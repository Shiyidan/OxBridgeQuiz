<template>
  <div class="um-page">
    <!-- <div class="page-top-bar">
      <button class="back-btn" type="button" @click="$router.push('/admin')">← 返回类别列表</button>
    </div> -->

    <div class="page-body">
      <h2 class="page-title">用户管理</h2>

      <AdminDataTable
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :data="users"
        :loading="loading"
        :total="pagination.total"
        empty-text="暂无注册用户"
        max-height="var(--um-table-max-height)"
        show-pagination
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <el-table-column
          prop="username"
          label="用户名"
          min-width="180"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <span class="cell-name">{{ row.username || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="email"
          label="邮箱"
          min-width="200"
          align="center"
          header-align="center"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="cell-email">{{ row.email || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="角色" min-width="150" align="center" header-align="center">
          <template #default="{ row }">
            <el-tag class="role-tag" :class="'role-' + row.role" effect="light" round>
              {{ roleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="所属权益" width="240" align="center" header-align="center">
          <template #default="{ row }">
            <div class="plan-tags">
              <el-tooltip
                v-for="item in membershipBadges(row)"
                :key="item.key"
                :content="item.tooltip"
                placement="top"
                effect="dark"
                trigger="hover"
                :show-after="120"
                :teleported="true"
              >
                <span class="plan-tooltip-trigger">
                  <el-tag class="plan-tag" :class="item.className" effect="light" round>
                    {{ item.label }}
                  </el-tag>
                </span>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="150" align="center" header-align="center">
          <template #default="{ row }">
            <span class="cell-date">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-if="isSuperAdmin"
          label="操作"
          width="120"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <button class="table-action-btn" type="button" @click.stop="openEditDialog(row)">
              编辑
            </button>
          </template>
        </el-table-column>
      </AdminDataTable>
    </div>

    <el-dialog
      v-model="editVisible"
      title="编辑用户权限"
      width="520px"
      append-to-body
      destroy-on-close
    >
      <template v-if="editingUser">
        <div class="user-summary">
          <strong>{{ editingUser.username }}</strong>
          <span>{{ editingUser.email }}</span>
        </div>

        <el-form :model="editForm" class="access-form" label-width="96px" label-position="left">
          <el-form-item label="用户角色">
            <el-select v-model="editForm.role" placeholder="请选择用户角色">
              <el-option label="普通用户" value="student" />
              <el-option label="管理员" value="admin" />
            </el-select>
          </el-form-item>

          <el-form-item label="考试类型">
            <el-select
              v-model="editForm.examTypes"
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
          </el-form-item>

          <el-form-item label="会员套餐">
            <el-select v-model="editForm.plan" placeholder="请选择会员套餐">
              <el-option
                v-for="item in planOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveAccess">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 用户管理页：展示注册用户，并允许管理员调整用户角色。
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import {
  getUserListData,
  updateUserAccess,
  type UserItem,
  type UserMembershipItem,
} from '@/api/admin'
import { ElMessage } from 'element-plus'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'

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
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const examTypeOptions = EXAM_TYPE_OPTIONS

const planOptions = [
  { label: '月度会员', value: 'monthly' },
  { label: '年度会员', value: 'yearly' },
]

interface MembershipBadge {
  key: string
  label: string
  className: string
  tooltip: string
}

function activeMemberships(user: UserItem) {
  const now = Date.now()
  return (user.memberships || []).filter(
    (item) => item.status === 'active' && item.startsAt <= now && item.endsAt > now,
  )
}

function planName(plan: string): string {
  const map: Record<string, string> = { monthly: '月度', yearly: '年度' }
  return map[plan] || plan
}

function roleLabel(role: string): string {
  return role === 'admin' ? '管理员' : '普通用户'
}

function latestMembership(user: UserItem): UserMembershipItem | undefined {
  return [...(user.memberships || [])].sort((a, b) => b.endsAt - a.endsAt)[0]
}

function membershipTooltip(item: UserMembershipItem): string {
  return `${item.examType} ${planName(item.plan)}，到期时间：${formatDateTime(item.endsAt)}`
}

// 权益列按 UserMembership 逐项展示，支持同一用户叠加多个考试类型会员。
function membershipBadges(user: UserItem): MembershipBadge[] {
  if (user.role === 'admin') {
    return [
      {
        key: `${user.id}-admin`,
        label: '管理员权限',
        className: 'plan-admin',
        tooltip: '管理员拥有全产品权限',
      },
    ]
  }

  const activeItems = activeMemberships(user)
  if (activeItems.length > 0) {
    return activeItems.map((item) => ({
      key: item.id,
      label: `${item.examType} ${planName(item.plan)}`,
      className: 'plan-paid',
      tooltip: membershipTooltip(item),
    }))
  }

  const latest = latestMembership(user)
  if (latest?.status === 'cancelled') {
    return [
      {
        key: `${user.id}-cancelled`,
        label: '会员已取消',
        className: 'plan-cancelled',
        tooltip: `最近权益：${membershipTooltip(latest)}`,
      },
    ]
  }
  if (latest && (latest.status === 'expired' || latest.endsAt <= Date.now())) {
    return [
      {
        key: `${user.id}-expired`,
        label: '会员已过期',
        className: 'plan-expired',
        tooltip: `最近权益：${membershipTooltip(latest)}`,
      },
    ]
  }

  return [
    {
      key: `${user.id}-free`,
      label: '免费',
      className: 'plan-free',
      tooltip: '暂无有效会员权益',
    },
  ]
}

// 后台列表只需要展示日期，避免时间精度干扰用户扫描。
function formatDate(d: string | number): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function formatDateTime(d: string | number): string {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 用户接口返回 { users }，页面只消费内部数组。
async function fetchUsers(): Promise<void> {
  loading.value = true
  try {
    const data = await getUserListData({
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    users.value = data.list || []
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
  } catch {
    users.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 用户列表分页切换时只更新分页条件，并重新读取当前页用户。
async function handlePageChange(page: number): Promise<void> {
  pagination.page = page
  await fetchUsers()
}

// 修改每页数量后回到第一页，避免请求到不存在的页码。
async function handlePageSizeChange(pageSize: number): Promise<void> {
  pagination.pageSize = pageSize
  pagination.page = 1
  await fetchUsers()
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
  --um-table-max-height: calc(100vh - var(--nav-height) - 146px);

  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 40px 10px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 24px;
}

.cell-name {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.cell-email {
  color: var(--color-ink-soft);
}

.cell-date {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.role-tag,
.plan-tag {
  max-width: 100%;
  border-radius: var(--radius-pill);
  font-weight: var(--weight-semi);
  vertical-align: middle;
}

.plan-tags {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.plan-tooltip-trigger {
  display: inline-flex;
  cursor: pointer;
}

.plan-tag {
  cursor: pointer;

  :deep(.el-tag__content) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.role-admin {
  background: #eef2ff !important;
  border-color: #c7d2fe !important;
  color: #4f46e5 !important;
}

.role-student {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  color: #475569 !important;
}

.plan-free {
  background: #f0fdf4 !important;
  border-color: #bbf7d0 !important;
  color: #16a34a !important;
}

.plan-paid {
  background: #eef2ff !important;
  border-color: #c7d2fe !important;
  color: #4f46e5 !important;
}

.plan-expired {
  background: #fef2f2 !important;
  border-color: #fecaca !important;
  color: #dc2626 !important;
}

.plan-cancelled {
  background: #fff7ed !important;
  border-color: #fed7aa !important;
  color: #c2410c !important;
}

.plan-admin {
  background: #111827 !important;
  border-color: #111827 !important;
  color: #fff !important;
}

.table-action-btn {
  min-width: 48px;
  height: var(--height-button-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-ink);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background var(--duration-base) ease,
    border-color var(--duration-base) ease,
    color var(--duration-base) ease;
}

.table-action-btn:hover,
.table-action-btn:focus-visible {
  border-color: var(--color-line);
  background: var(--color-hover);
  color: var(--color-ink);
}

.access-form {
  padding-top: 4px;
}

.user-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);

  strong {
    color: var(--color-ink);
    font-weight: var(--weight-semi);
  }

  span {
    color: var(--color-ink-soft);
    font-size: var(--text-sm);
  }
}

:deep(.access-form .el-select) {
  width: 100%;
}

:deep(.access-form .el-form-item:last-child) {
  margin-bottom: 0;
}
</style>
