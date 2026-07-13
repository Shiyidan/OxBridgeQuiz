<!-- 付费策略与订单管理：配置前台价格并查看支付订单。 -->
<template>
  <div class="payment-admin-page">
    <main class="page-body">
      <header class="page-heading">
        <div>
          <h1>付费策略与订阅</h1>
          <p>统一配置支付弹窗价格，查看系统生成的支付订单。</p>
        </div>
        <span class="environment-badge">银联商务 · 待接通</span>
      </header>

      <section class="strategy-card">
        <div class="card-heading">
          <div>
            <h2>会员定价策略</h2>
            <p>保存后，首页支付弹窗再次打开时会读取最新价格。</p>
          </div>
          <el-switch
            v-model="form.status"
            :disabled="!editing"
            active-value="active"
            inactive-value="inactive"
            active-text="开放支付"
            inactive-text="暂停支付"
          />
        </div>

        <el-form class="price-form" label-position="top" @submit.prevent="saveConfig">
          <el-form-item label="首次按月付费价格">
            <el-input-number v-model="form.firstMonthlyPrice" :disabled="!editing" :min="0.01" :max="100000" :precision="2" :step="1" controls-position="right" />
            <span class="field-hint">用户第一次成功购买月度会员时使用</span>
          </el-form-item>
          <el-form-item label="正常月价格">
            <el-input-number v-model="form.monthlyPrice" :disabled="!editing" :min="0.01" :max="100000" :precision="2" :step="1" controls-position="right" />
            <span class="field-hint">非首次购买月度会员时使用</span>
          </el-form-item>
          <el-form-item label="年价格">
            <el-input-number v-model="form.yearlyPrice" :disabled="!editing" :min="0.01" :max="100000" :precision="2" :step="10" controls-position="right" />
            <span class="field-hint">年度套餐一次性支付价格</span>
          </el-form-item>
        </el-form>

        <div class="strategy-footer">
          <span v-if="updatedAt">上次更新：{{ formatDateTime(updatedAt) }}</span>
          <div class="strategy-actions">
            <el-button v-if="!editing" type="primary" @click="startEditing">编辑</el-button>
            <template v-else>
              <el-button :disabled="saving" @click="cancelEditing">取消</el-button>
              <el-button type="primary" :loading="saving" @click="saveConfig">保存</el-button>
            </template>
          </div>
        </div>
      </section>

      <section class="orders-card">
        <div class="orders-toolbar">
          <div>
            <h2>支付订单</h2>
            <p>目前记录本地订单；银联商务接通后将同步渠道流水和支付结果。</p>
          </div>
          <div class="toolbar-actions">
            <el-select v-model="statusFilter" placeholder="全部状态" clearable @change="handleFilterChange">
              <el-option label="待支付" value="pending" />
              <el-option label="已支付" value="paid" />
              <el-option label="失败" value="failed" />
              <el-option label="已关闭" value="closed" />
              <el-option label="退款中" value="refunding" />
              <el-option label="已退款" value="refunded" />
            </el-select>
            <el-button :loading="loadingOrders" @click="loadOrders">刷新</el-button>
          </div>
        </div>

        <el-table v-loading="loadingOrders" :data="orders" empty-text="暂无支付订单">
          <el-table-column prop="orderNo" label="订单号" min-width="215" />
          <el-table-column label="用户" min-width="170">
            <template #default="{ row }">
              <div class="user-cell">
                <strong>{{ row.user.username }}</strong>
                <span>{{ row.user.email }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="套餐" min-width="145">
            <template #default="{ row }">
              <strong>{{ planText(row.plan, row.priceType) }}</strong>
              <div class="exam-tags">{{ normalizeExamTypes(row.examTypes).join(' / ') }}</div>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="105">
            <template #default="{ row }">¥{{ formatMoney(row.amountCents) }}</template>
          </el-table-column>
          <el-table-column label="渠道" width="105">
            <template #default="{ row }">{{ channelText(row.channel) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="105">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" effect="light">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="170">
            <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>

        <AppPagination
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          @change="loadOrders"
        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppPagination from '@/components/AppPagination.vue'
import {
  getAdminPaymentConfig,
  getAdminPaymentOrders,
  updateAdminPaymentConfig,
  type AdminPaymentOrder,
} from '@/api/admin'

const saving = ref(false)
const editing = ref(false)
const loadingOrders = ref(false)
const updatedAt = ref('')
const statusFilter = ref('')
const orders = ref<AdminPaymentOrder[]>([])
const form = reactive({
  firstMonthlyPrice: 78,
  monthlyPrice: 79,
  yearlyPrice: 398,
  status: 'active' as 'active' | 'inactive',
})
const savedForm = reactive({
  firstMonthlyPrice: 78,
  monthlyPrice: 79,
  yearlyPrice: 398,
  status: 'active' as 'active' | 'inactive',
})
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

function centsToYuan(value: number): number {
  return Number((value / 100).toFixed(2))
}

function yuanToCents(value: number): number {
  return Math.round(value * 100)
}

function formatMoney(value: number): string {
  return (value / 100).toFixed(2)
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function syncSavedForm(): void {
  savedForm.firstMonthlyPrice = form.firstMonthlyPrice
  savedForm.monthlyPrice = form.monthlyPrice
  savedForm.yearlyPrice = form.yearlyPrice
  savedForm.status = form.status
}

function startEditing(): void {
  syncSavedForm()
  editing.value = true
}

function cancelEditing(): void {
  form.firstMonthlyPrice = savedForm.firstMonthlyPrice
  form.monthlyPrice = savedForm.monthlyPrice
  form.yearlyPrice = savedForm.yearlyPrice
  form.status = savedForm.status
  editing.value = false
}

function normalizeExamTypes(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function planText(plan: string, priceType: string): string {
  if (plan === 'yearly') return '年度会员'
  return priceType === 'first_monthly' ? '月度会员（首次）' : '月度会员'
}

function channelText(channel: string): string {
  return { alipay: '支付宝', wechat: '微信支付', unionpay: '云闪付' }[channel] || channel
}

function statusText(status: string): string {
  return {
    pending: '待支付',
    paid: '已支付',
    failed: '失败',
    closed: '已关闭',
    refunding: '退款中',
    refunded: '已退款',
  }[status] || status
}

function statusTagType(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  if (status === 'paid') return 'success'
  if (status === 'pending' || status === 'refunding') return 'warning'
  if (status === 'failed') return 'danger'
  return 'info'
}

// 页面初始化时读取数据库中的当前支付策略。
async function loadConfig(): Promise<void> {
  try {
    const config = await getAdminPaymentConfig()
    form.firstMonthlyPrice = centsToYuan(config.firstMonthlyPriceCents)
    form.monthlyPrice = centsToYuan(config.monthlyPriceCents)
    form.yearlyPrice = centsToYuan(config.yearlyPriceCents)
    form.status = config.status
    updatedAt.value = config.updatedAt
    syncSavedForm()
  } catch {
    ElMessage.error('支付策略加载失败')
  }
}

// 管理员保存价格后，前台下一次打开支付弹窗即使用新策略。
async function saveConfig(): Promise<void> {
  if (!editing.value) return
  if (form.firstMonthlyPrice > form.monthlyPrice) {
    ElMessage.warning('首次按月价格不能高于正常月价格')
    return
  }
  saving.value = true
  try {
    const config = await updateAdminPaymentConfig({
      firstMonthlyPriceCents: yuanToCents(form.firstMonthlyPrice),
      monthlyPriceCents: yuanToCents(form.monthlyPrice),
      yearlyPriceCents: yuanToCents(form.yearlyPrice),
      status: form.status,
    })
    updatedAt.value = config.updatedAt
    syncSavedForm()
    editing.value = false
    ElMessage.success('支付策略已保存')
  } finally {
    saving.value = false
  }
}

// 支付订单列表使用后台筛选条件和统一分页参数读取。
async function loadOrders(): Promise<void> {
  loadingOrders.value = true
  try {
    const data = await getAdminPaymentOrders({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: statusFilter.value || undefined,
    })
    orders.value = data.list
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
  } finally {
    loadingOrders.value = false
  }
}

function handleFilterChange(): void {
  pagination.page = 1
  void loadOrders()
}

onMounted(() => {
  void Promise.all([loadConfig(), loadOrders()])
})
</script>

<style scoped lang="scss">
.payment-admin-page { min-height: 100%; background: #f6f8fb; }
.page-body { width: 100%; max-width: 1480px; padding: 22px 40px 48px; box-sizing: border-box; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.page-heading h1 { margin: 0 0 7px; color: #0f172a; font-size: 1.55rem; }
.page-heading p, .card-heading p, .orders-toolbar p { margin: 0; color: #718096; font-size: 0.88rem; }
.environment-badge { padding: 7px 12px; color: #9a6700; font-size: 0.78rem; background: #fff7d6; border: 1px solid #f4df8d; border-radius: 999px; }
.strategy-card, .orders-card { background: #fff; border: 1px solid #dce3ec; border-radius: 14px; box-shadow: 0 8px 24px rgb(15 23 42 / 7%); }
.strategy-card { padding: 24px 26px 20px; }
.card-heading, .orders-toolbar, .strategy-footer { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.card-heading h2, .orders-toolbar h2 { margin: 0 0 5px; color: #162033; font-size: 1.08rem; }
.price-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; margin-top: 25px; }
.price-form :deep(.el-form-item) { min-width: 0; margin-bottom: 18px; }
.price-form :deep(.el-form-item__label) { color: #344054; font-size: 0.86rem; font-weight: 650; }
.price-form :deep(.el-input-number) { width: 33.333%; min-width: 132px; }
.field-hint { display: block; margin-top: 7px; color: #94a3b8; font-size: 0.75rem; line-height: 1.4; }
.strategy-footer { padding-top: 18px; border-top: 1px solid #edf0f4; }
.strategy-footer > span { color: #94a3b8; font-size: 0.78rem; }
.strategy-actions { display: flex; align-items: center; gap: 8px; }
.orders-card { margin-top: 24px; overflow: hidden; }
.orders-toolbar { padding: 22px 24px; border-bottom: 1px solid #e8ecf1; }
.toolbar-actions { display: flex; gap: 10px; }
.toolbar-actions :deep(.el-select) { width: 140px; }
.orders-card :deep(.el-table) { --el-table-border-color: #edf0f4; }
.user-cell { display: grid; gap: 3px; }
.user-cell strong { color: #273244; font-size: 0.86rem; }
.user-cell span, .exam-tags { color: #8490a2; font-size: 0.75rem; }
.exam-tags { margin-top: 4px; }
.orders-card :deep(.app-pagination) { padding: 18px 24px; }
@media (max-width: 680px) {
  .page-body { padding-right: 18px; padding-left: 18px; }
  .price-form { grid-template-columns: 1fr; gap: 4px; }
  .page-heading, .orders-toolbar { align-items: stretch; flex-direction: column; }
}
</style>
