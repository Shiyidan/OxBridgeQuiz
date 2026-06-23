<template>
  <div class="um-page">
    <div class="page-top-bar">
      <button class="back-btn" type="button" @click="$router.push('/admin')">← 返回类别列表</button>
    </div>

    <div class="page-body">
      <h2 class="page-title">用户管理</h2>
      <p class="page-desc">共 {{ users.length }} 位注册用户</p>

      <div v-if="loading" class="loading-state">加载中...</div>
      <template v-else>
        <div class="table-wrap">
          <table class="um-table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>所属权益</th>
                <th>注册时间</th>
                <th v-if="isSuperAdmin">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td class="cell-name">{{ u.name }}</td>
                <td class="cell-email">{{ u.email }}</td>
                <td>
                  <span class="role-badge" :class="'role-' + u.role">
                    {{ u.role === 'admin' ? '管理员' : '普通用户' }}
                  </span>
                </td>
                <td>
                  <span class="plan-badge" :class="planClass(u)">
                    {{ planLabel(u) }}
                  </span>
                </td>
                <td class="cell-date">{{ formatDate(u.createdAt) }}</td>
                <td v-if="isSuperAdmin">
                  <button class="edit-btn" type="button" @click="openEditDialog(u)">
                    编辑
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="users.length === 0" class="empty-state">暂无注册用户</div>
      </template>
    </div>

    <el-dialog v-model="editVisible" title="编辑用户权限" width="520px">
      <div v-if="editingUser" class="access-form">
        <div class="user-summary">
          <strong>{{ editingUser.name }}</strong>
          <span>{{ editingUser.email }}</span>
        </div>

        <label class="form-row">
          <span>用户角色</span>
          <el-select v-model="editForm.role" class="form-control">
            <el-option label="普通用户" value="student" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </label>

        <label class="form-row">
          <span>考试类型</span>
          <el-select
            v-model="editForm.examTypes"
            class="form-control"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择要开通的考试类型"
          >
            <el-option
              v-for="item in examTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </label>

        <label class="form-row">
          <span>会员套餐</span>
          <el-select v-model="editForm.plan" class="form-control">
            <el-option
              v-for="item in planOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </label>
      </div>

      <template #footer>
        <button class="dialog-btn ghost" type="button" @click="editVisible = false">
          取消
        </button>
        <button class="dialog-btn primary" type="button" :disabled="saving" @click="saveAccess">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 用户管理页：展示注册用户，并允许管理员调整用户角色。
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getUserListData, updateUserAccess, type UserItem } from '@/api/admin'
import { ElMessage } from 'element-plus'

const auth = useAuthStore()
const users = ref<UserItem[]>([])
const loading = ref(true)
const isSuperAdmin = computed(() => auth.user?.role === 'admin')
const editVisible = ref(false)
const saving = ref(false)
const editingUser = ref<UserItem | null>(null)
const editForm = ref({
  role: 'student',
  examTypes: [] as string[],
  plan: 'monthly',
})

const examTypeOptions = [
  { label: 'TMUA', value: 'TMUA' },
  { label: 'ESAT', value: 'ESAT' },
  { label: 'ENGAA', value: 'ENGAA' },
  { label: 'NSAA', value: 'NSAA' },
]

const planOptions = [
  { label: '月度会员', value: 'monthly' },
  { label: '年度会员', value: 'yearly' },
]

function activeMemberships(user: UserItem) {
  const now = Date.now()
  return (user.memberships || []).filter((item) => (
    item.status === 'active' && item.endsAt > now
  ))
}

function planName(plan: string): string {
  const map: Record<string, string> = { monthly: '月度', yearly: '年度' }
  return map[plan] || plan
}

// 权益展示以 UserMembership 为准，避免旧 paymentStatus 误导测试。
function planLabel(user: UserItem): string {
  if (user.role === 'admin') return '管理员权限'
  const activeItems = activeMemberships(user)
  if (activeItems.length > 0) {
    return activeItems.map((item) => `${item.examType} ${planName(item.plan)}`).join('、')
  }
  if ((user.memberships || []).some((item) => item.status === 'expired')) return '会员已过期'
  return '免费'
}

function planClass(user: UserItem): string {
  if (user.role === 'admin') return 'plan-admin'
  if (activeMemberships(user).length > 0) return 'plan-paid'
  if ((user.memberships || []).some((item) => item.status === 'expired')) return 'plan-expired'
  return 'plan-free'
}

// 后台列表只需要展示日期，避免时间精度干扰用户扫描。
function formatDate(d: string): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 用户接口返回 { users }，页面只消费内部数组。
async function fetchUsers(): Promise<void> {
  loading.value = true
  try {
    const data = await getUserListData()
    users.value = data.users || []
  } catch {
    users.value = []
  } finally {
    loading.value = false
  }
}

// 打开弹窗时带入现有角色和当前有效会员，便于续改测试账号。
function openEditDialog(user: UserItem): void {
  const activeItems = activeMemberships(user)
  editingUser.value = user
  editForm.value = {
    role: user.role,
    examTypes: activeItems.map((item) => item.examType),
    plan: activeItems[0]?.plan || 'monthly',
  }
  editVisible.value = true
}

// 保存后以后端返回用户替换当前行，确保会员记录与列表展示一致。
async function saveAccess(): Promise<void> {
  if (!editingUser.value) return
  saving.value = true
  try {
    const data = await updateUserAccess(editingUser.value.id, {
      role: editForm.value.role,
      membership: {
        examTypes: editForm.value.examTypes,
        plan: editForm.value.plan,
      },
    })
    if (data.user) {
      const index = users.value.findIndex((u) => u.id === data.user!.id)
      if (index >= 0) users.value[index] = data.user
    }
    editVisible.value = false
    ElMessage.success('用户权限已更新')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.errMsg || '操作失败')
  } finally {
    saving.value = false
  }
}

onMounted(fetchUsers)
</script>

<style scoped lang="scss">
.um-page {
  min-height: 100%;
}

.page-top-bar {
  padding: 28px 40px 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease;

  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
}

.page-body {
  padding: 24px 40px 48px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
}

.page-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 24px;
}

.loading-state,
.empty-state {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 60px 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.938rem;
}

.table-wrap {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.um-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 14px 20px;
    text-align: left;
    font-size: 0.875rem;
    border-bottom: 1px solid #f1f5f9;
  }

  th {
    font-weight: 600;
    color: #64748b;
    background: #f8fafc;
    font-size: 0.813rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td {
    color: #0f172a;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background: #f8fafc;
  }
}

.cell-name {
  font-weight: 600;
}

.cell-email {
  color: #475569;
}

.cell-date {
  color: #94a3b8;
  font-size: 0.813rem;
}

.role-badge,
.plan-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.role-admin {
  background: #eef2ff;
  color: #4f46e5;
}

.role-student {
  background: #f1f5f9;
  color: #64748b;
}

.plan-free {
  background: #f0fdf4;
  color: #16a34a;
}

.plan-paid {
  background: #eef2ff;
  color: #4f46e5;
}

.plan-expired {
  background: #fef2f2;
  color: #dc2626;
}

.plan-admin {
  background: #111827;
  color: #fff;
}

.edit-btn,
.dialog-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.813rem;
  font-family: inherit;
  font-weight: 700;
  color: #0f172a;
  background: #fff;
  cursor: pointer;
  outline: none;

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.12);
  }
}

.edit-btn:hover {
  border-color: #4f46e5;
  color: #4f46e5;
}

.access-form {
  display: grid;
  gap: 18px;
}

.user-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  border-radius: 8px;
  background: #f8fafc;

  strong {
    color: #0f172a;
  }

  span {
    color: #64748b;
    font-size: 0.875rem;
  }
}

.form-row {
  display: grid;
  gap: 8px;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 700;
}

.form-control {
  width: 100%;
}

.dialog-btn {
  margin-left: 10px;
}

.dialog-btn.primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
}

.dialog-btn.ghost {
  color: #475569;
}
</style>
