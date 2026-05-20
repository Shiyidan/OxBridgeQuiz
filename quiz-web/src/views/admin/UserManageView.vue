<template>
  <div class="um-page">
    <div class="page-top-bar">
      <button class="back-btn" @click="$router.push('/admin')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回类别列表
      </button>
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
                  <span class="plan-badge" :class="'plan-' + u.paymentStatus">
                    {{ planLabel(u.paymentStatus) }}
                  </span>
                </td>
                <td class="cell-date">{{ formatDate(u.createdAt) }}</td>
                <td v-if="isSuperAdmin">
                  <select
                    class="role-select"
                    :value="u.role"
                    @change="handleRoleChange(u.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="student">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="users.length === 0" class="empty-state">
          暂无注册用户
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import request from '@/utils/request'

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  paymentStatus: string
  diagnosticUsed: boolean
  createdAt: string
}

const auth = useAuthStore()
const users = ref<UserItem[]>([])
const loading = ref(true)

const isSuperAdmin = computed(() => auth.user?.role === 'admin')

function planLabel(status: string): string {
  const map: Record<string, string> = { free: '免费', paid: '付费', expired: '已过期' }
  return map[status] || status
}

function formatDate(d: string): string {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

async function fetchUsers(): Promise<void> {
  loading.value = true
  try {
    const res = await request.get('/admin/users')
    users.value = res.data.users
  } catch {
    // 401/403 handled by interceptor
  } finally {
    loading.value = false
  }
}

async function handleRoleChange(userId: string, newRole: string): Promise<void> {
  try {
    await request.put(`/admin/users/${userId}/role`, { role: newRole })
    const user = users.value.find((u) => u.id === userId)
    if (user) user.role = newRole
  } catch (e: any) {
    alert(e.response?.data?.errMsg || '操作失败')
  }
}

onMounted(fetchUsers)
</script>

<style scoped lang="scss">
.um-page { min-height: 100%; }
.page-top-bar { padding: 28px 40px 0; }
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: none; background: transparent;
  font-size: 0.875rem; font-weight: 500; color: #64748b;
  cursor: pointer; border-radius: 8px; transition: all 0.15s ease;
  svg { width: 16px; height: 16px; }
  &:hover { color: #0f172a; background: #f1f5f9; }
}
.page-body { padding: 24px 40px 48px; }
.page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
.page-desc { font-size: 0.875rem; color: #64748b; margin: 0 0 24px; }

.loading-state, .empty-state {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
  padding: 60px 40px; text-align: center; color: #94a3b8; font-size: 0.938rem;
}

.table-wrap {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
  overflow: hidden;
}

.um-table {
  width: 100%; border-collapse: collapse;
  th, td {
    padding: 14px 20px; text-align: left; font-size: 0.875rem;
    border-bottom: 1px solid #f1f5f9;
  }
  th {
    font-weight: 600; color: #64748b; background: #f8fafc; font-size: 0.813rem;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  td { color: #0f172a; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: #f8fafc; }
}

.cell-name { font-weight: 600; }
.cell-email { color: #475569; }
.cell-date { color: #94a3b8; font-size: 0.813rem; }

.role-badge, .plan-badge {
  display: inline-block; padding: 3px 10px; border-radius: 999px;
  font-size: 0.75rem; font-weight: 600;
}
.role-admin { background: #eef2ff; color: #4f46e5; }
.role-student { background: #f1f5f9; color: #64748b; }
.plan-free { background: #f0fdf4; color: #16a34a; }
.plan-paid { background: #eef2ff; color: #4f46e5; }
.plan-expired { background: #fef2f2; color: #dc2626; }

.role-select {
  padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 0.813rem; font-family: inherit; color: #0f172a; background: #fff;
  cursor: pointer; outline: none;
  &:focus { border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.12); }
}
</style>
