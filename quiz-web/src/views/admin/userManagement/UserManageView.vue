<template>
  <div class="um-page">
    <!-- <div class="page-top-bar">
      <button class="back-btn" type="button" @click="$router.push('/admin')">← 返回类别列表</button>
    </div> -->

    <div class="page-body">
      <div class="page-heading">
        <h2 class="page-title">用户管理</h2>
        <div class="user-search" role="search">
          <el-input
            v-model="searchKeyword"
            class="user-search__input"
            clearable
            maxlength="100"
            placeholder="搜索用户名"
            aria-label="搜索用户名"
            @keyup.enter="applyUserSearch"
            @clear="applyUserSearch"
          />
          <el-button type="primary" :loading="loading" @click="applyUserSearch">查询</el-button>
          <el-button @click="resetUserSearch">重置</el-button>
        </div>
      </div>

      <AdminDataTable
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :data="users"
        :loading="loading"
        :total="pagination.total"
        empty-text="暂无注册用户"
        fill-height
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
            <button
              class="cell-name cell-name--link"
              type="button"
              @click.stop="openUserDetail(row)"
            >
              {{ row.username || '-' }}
            </button>
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
          width="170"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <div class="table-actions">
              <button class="table-action-btn" type="button" @click.stop="openEditDialog(row)">
                编辑
              </button>
              <button
                v-if="row.role !== 'admin'"
                class="table-action-btn table-action-btn--gift"
                type="button"
                @click.stop="openGiftDialog(row)"
              >
                赠送
              </button>
            </div>
          </template>
        </el-table-column>
      </AdminDataTable>
    </div>

    <UserDetailDrawer v-model="detailVisible" :user-id="selectedUserId" />

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
            <el-select
              v-model="editForm.plan"
              placeholder="请选择会员套餐"
              :disabled="editForm.examTypes.length === 0"
            >
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

    <el-dialog v-model="giftVisible" title="赠送卡券" width="520px" append-to-body destroy-on-close>
      <template v-if="giftingUser">
        <p class="gift-dialog-description">
          目前支持赠送日卡；周卡和月卡仅作功能占位，暂不可选择。
        </p>
        <div class="user-summary gift-user-summary">
          <span>赠送给</span>
          <strong>{{ giftingUser.username }}</strong>
          <small>{{ giftingUser.email }}</small>
        </div>

        <div class="gift-card-options">
          <div class="gift-card-option gift-card-option--disabled">
            <el-checkbox :model-value="false" disabled aria-label="周卡暂不可赠送" />
            <div class="gift-card-icon gift-card-icon--weekly" aria-hidden="true">周</div>
            <div class="gift-card-copy">
              <strong>周卡 <small>即将开放</small></strong>
              <span>7 天有效期</span>
            </div>
            <el-input-number
              :model-value="1"
              :min="1"
              disabled
              controls-position="right"
              aria-label="周卡赠送数量暂不可用"
            />
          </div>

          <div class="gift-card-option">
            <el-checkbox :model-value="true" disabled aria-label="当前赠送日卡" />
            <div class="gift-card-icon gift-card-icon--daily" aria-hidden="true">日</div>
            <div class="gift-card-copy">
              <strong>日卡</strong>
              <span>1 天有效期 · 启用后生成零元支付订单</span>
            </div>
            <el-input-number
              v-model="giftQuantity"
              :min="1"
              :max="10"
              controls-position="right"
              aria-label="赠送日卡数量"
            />
          </div>

          <div class="gift-card-option gift-card-option--disabled">
            <el-checkbox :model-value="false" disabled aria-label="月卡暂不可赠送" />
            <div class="gift-card-icon gift-card-icon--monthly" aria-hidden="true">月</div>
            <div class="gift-card-copy">
              <strong>月卡 <small>即将开放</small></strong>
              <span>30 天有效期</span>
            </div>
            <el-input-number
              :model-value="1"
              :min="1"
              disabled
              controls-position="right"
              aria-label="月卡赠送数量暂不可用"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <el-button :disabled="giftSaving" @click="giftVisible = false">取消</el-button>
        <el-button type="primary" :loading="giftSaving" @click="submitGift"> 确认赠送 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// 用户管理页：展示注册用户，并允许管理员调整用户角色。
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import UserDetailDrawer from './UserDetailDrawer.vue'
import {
  getUserListData,
  giftUserCards,
  updateUserAccess,
  type UserItem,
  type UserMembershipItem,
} from '@/api/admin'
import { ElMessage } from 'element-plus'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'

const auth = useAuthStore()
const users = ref<UserItem[]>([])
const loading = ref(true)
const searchKeyword = ref('')
const appliedSearchKeyword = ref('')
const isSuperAdmin = computed(() => auth.user?.role === 'admin')
const editVisible = ref(false)
const saving = ref(false)
const editingUser = ref<UserItem | null>(null)
const giftVisible = ref(false)
const giftSaving = ref(false)
const giftingUser = ref<UserItem | null>(null)
const giftQuantity = ref(1)
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
const detailVisible = ref(false)
const selectedUserId = ref<string | null>(null)

const examTypeOptions = EXAM_TYPE_OPTIONS

const planOptions = [
  { label: '月卡会员（30天）', value: 'monthly' },
  { label: '季卡会员（90天）', value: 'quarterly' },
]

interface MembershipBadge {
  key: string
  label: string
  className: string
  tooltip: string
}

interface ActiveMembershipItem extends UserMembershipItem {
  entitlementEndsAt: number
}

// 当前生效套餐用于展示名称，同考试类型后续排队权益的最晚结束时间用于展示最终有效期。
function activeMemberships(user: UserItem): ActiveMembershipItem[] {
  const now = Date.now()
  const memberships = user.memberships || []
  return memberships
    .filter((item) => item.status === 'active' && item.startsAt <= now && item.endsAt > now)
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.examType === item.examType) === index,
    )
    .map((item) => ({
      ...item,
      entitlementEndsAt: memberships
        .filter(
          (candidate) =>
            candidate.status === 'active' &&
            candidate.examType === item.examType &&
            candidate.endsAt > now,
        )
        .reduce((latest, candidate) => Math.max(latest, candidate.endsAt), item.endsAt),
    }))
}

function planName(plan: string): string {
  const map: Record<string, string> = {
    monthly: '月卡',
    quarterly: '季卡',
    yearly: '年度（历史）',
    daily_gift: '日卡',
  }
  return map[plan] || plan
}

function roleLabel(role: string): string {
  return role === 'admin' ? '管理员' : '普通用户'
}

function latestMembership(user: UserItem): UserMembershipItem | undefined {
  return [...(user.memberships || [])].sort((a, b) => b.endsAt - a.endsAt)[0]
}

function membershipTooltip(item: UserMembershipItem): string {
  return `${item.examType} ${planName(item.plan)}，到期时间：${formatDateTime(item.entitlementEndsAt ?? item.endsAt)}`
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
      keyword: appliedSearchKeyword.value || undefined,
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

// 查询时固定使用已确认的关键词并回到第一页，避免输入中的临时值影响翻页结果。
async function applyUserSearch(): Promise<void> {
  searchKeyword.value = searchKeyword.value.trim()
  appliedSearchKeyword.value = searchKeyword.value
  pagination.page = 1
  await fetchUsers()
}

// 重置同时清空输入和已应用条件，恢复完整用户列表。
async function resetUserSearch(): Promise<void> {
  searchKeyword.value = ''
  appliedSearchKeyword.value = ''
  pagination.page = 1
  await fetchUsers()
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

// 用户详情仅在点击用户名时按需加载，避免答题聚合拖慢用户列表分页。
function openUserDetail(user: UserItem): void {
  selectedUserId.value = user.id
  detailVisible.value = true
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

// 赠送弹窗每次从一张日卡开始，避免沿用上一次批量数量造成误发。
function openGiftDialog(user: UserItem): void {
  giftingUser.value = user
  giftQuantity.value = 1
  giftVisible.value = true
}

// 确认赠送只发放待启用日卡；支付订单和会员权益由用户后续启用动作创建。
async function submitGift(): Promise<void> {
  if (!giftingUser.value) return
  giftSaving.value = true
  try {
    const result = await giftUserCards(giftingUser.value.id, {
      cardType: 'daily',
      quantity: giftQuantity.value,
    })
    giftVisible.value = false
    ElMessage.success(`已赠送 ${result.createdCount} 张日卡`)
  } catch {
    // 公共请求层统一展示后端业务错误。
  } finally {
    giftSaving.value = false
  }
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
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    saving.value = false
  }
}

onMounted(fetchUsers)
</script>

<style scoped lang="scss">
.um-page {
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

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.user-search {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-search__input {
  width: 280px;
}

.cell-name {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.cell-name--link {
  padding: 3px 5px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #4f46e5;
  font: inherit;
  font-weight: var(--weight-semi);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  transition:
    background var(--duration-base) ease,
    text-decoration-color var(--duration-base) ease;
}

.cell-name--link:hover,
.cell-name--link:focus-visible {
  background: #eef2ff;
  text-decoration-color: currentColor;
  outline: none;
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

.table-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.table-action-btn--gift {
  color: #5b4bd6;
}

.table-action-btn--gift:hover,
.table-action-btn--gift:focus-visible {
  border-color: #d8d2ff;
  background: #f4f2ff;
  color: #4936d1;
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

.gift-dialog-description {
  margin: -2px 0 14px;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.gift-user-summary {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 3px 12px;
  margin-bottom: 14px;

  span {
    grid-row: 1 / 3;
    color: var(--color-ink-muted);
  }

  small {
    color: var(--color-ink-soft);
    font-size: var(--text-xs);
  }
}

.gift-card-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--color-line-soft);
  border-radius: 8px;
  background: #fff;
}

.gift-card-options {
  display: grid;
  gap: 12px;
}

.gift-card-option--disabled {
  background: #fafbfc;
}

.gift-card-option--disabled .gift-card-copy {
  opacity: 0.68;
}

.gift-card-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  place-items: center;
  border-radius: 7px;
  background: #e8f6ee;
  color: #237a50;
  font-weight: 800;
}

.gift-card-icon--weekly {
  background: #e9efff;
  color: #3f63c8;
}

.gift-card-icon--monthly {
  background: #f3e8fa;
  color: #8a49a5;
}

.gift-card-copy {
  display: grid;
  flex: 1;
  gap: 4px;
  min-width: 0;

  strong {
    color: var(--color-ink);
    font-size: var(--text-base);
  }

  small {
    margin-left: 5px;
    color: var(--color-ink-muted);
    font-size: 11px;
    font-weight: 500;
  }

  span {
    color: var(--color-ink-soft);
    font-size: var(--text-xs);
  }
}

.gift-card-option :deep(.el-input-number) {
  width: 110px;
}

:deep(.access-form .el-select) {
  width: 100%;
}

:deep(.access-form .el-form-item:last-child) {
  margin-bottom: 0;
}

@media (max-width: 760px) {
  .page-body {
    padding-inline: 20px;
  }

  .page-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .user-search {
    width: 100%;
  }

  .user-search__input {
    width: auto;
    flex: 1;
  }
}
@media (max-width: 860px) {
  // 移动端由后台主内容区统一滚动，避免筛选区和表格被固定高度裁切。
  .um-page,
  .page-body {
    height: auto;
    overflow: visible;
  }

  .page-body {
    flex: none;
    padding: 20px 16px;
  }
}
</style>
