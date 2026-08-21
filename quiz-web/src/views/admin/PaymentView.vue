<!-- 全站支付运营台：配置价格、查看所有用户订单并处理对账异常。 -->
<template>
  <div class="payment-admin-page">
    <main class="page-body">
      <header class="page-heading">
        <div>
          <h1>支付运营与对账</h1>
          <p>统一管理全站价格、所有用户支付订单、退款和对账异常。</p>
        </div>
        <span class="environment-badge">全站订单 · 银联商务</span>
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
          <el-form-item label="月卡价格">
            <el-input-number v-model="form.monthlyPrice" :disabled="!editing" :min="0.01" :max="100000" :precision="2" :step="1" controls-position="right" />
            <span class="field-hint">月卡固定 30 天</span>
          </el-form-item>
          <el-form-item label="季卡原价">
            <el-input-number v-model="form.quarterlyOriginalPrice" :disabled="!editing" :min="0.01" :max="100000" :precision="2" :step="1" controls-position="right" />
            <span class="field-hint">支付弹窗用于展示划线原价</span>
          </el-form-item>
          <el-form-item label="季卡折扣价">
            <el-input-number v-model="form.quarterlyPrice" :disabled="!editing" :min="0.01" :max="100000" :precision="2" :step="1" controls-position="right" />
            <span class="field-hint">季卡固定 90 天，当前按 6 折展示</span>
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

      <section class="reconciliation-card">
        <div class="orders-toolbar">
          <div>
            <h2>交易状态核对与财务清算对账</h2>
            <p>系统逐笔查询本地订单并记录异常，不会自动修改订单；财务清算结果需在银联商户平台复核。</p>
          </div>
          <div class="toolbar-actions">
            <el-date-picker
              v-model="reconciliationDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择对账日期"
              :clearable="false"
            />
            <el-button type="primary" :loading="runningReconciliation" @click="handleRunReconciliation">
              立即对账
            </el-button>
            <el-button :loading="loadingReconciliation" @click="loadReconciliationData">刷新</el-button>
          </div>
        </div>

        <div class="reconciliation-metrics">
          <div class="metric-item">
            <span>最近对账日期</span>
            <strong>{{ reconciliationOverview.latestRun?.businessDate || '尚未执行' }}</strong>
            <small>{{ reconciliationRunText(reconciliationOverview.latestRun?.status) }}</small>
          </div>
          <div class="metric-item">
            <span>核对 / 人工修复</span>
            <strong>
              {{ reconciliationOverview.latestRun?.totalOrders || 0 }} / {{ reconciliationOverview.latestRun?.correctedOrders || 0 }}
            </strong>
            <small>逐笔向银联查询</small>
          </div>
          <div class="metric-item metric-warning">
            <span>待处理异常</span>
            <strong>{{ reconciliationOverview.openAnomalyCount }}</strong>
            <small>需要查询或人工确认</small>
          </div>
          <div class="metric-item">
            <span>通知失败 / 卡住退款</span>
            <strong>{{ reconciliationOverview.failedNotificationCount }} / {{ reconciliationOverview.stuckRefundCount }}</strong>
            <small>另有 {{ reconciliationOverview.stalePendingCount }} 笔超时待支付</small>
          </div>
        </div>

        <el-alert
          class="reconciliation-note"
          type="info"
          :closable="false"
          show-icon
          title="定时对账和立即对账只发现并记录异常，不会自动修改订单、退款或会员；所有修复均需管理员在异常明细中显式确认。"
        />

        <div class="settlement-guide">
          <div>
            <strong>银联清算报表复核</strong>
            <span>进入“账务中心 → 对账查询 → 明细查询”，应用类型选择“公共支付”，按清算时间核对明细或汇总并下载 XLS/CSV。</span>
          </div>
          <el-link href="https://service.chinaums.com/uisportal/" target="_blank" rel="noopener noreferrer" type="primary">
            打开银联商务商户平台
          </el-link>
        </div>

        <div class="anomaly-toolbar">
          <div>
            <h3>对账明细与异常告警</h3>
            <span>“复核并修复”必须由管理员确认，且只接受银联可验证、金额一致的结果。</span>
          </div>
          <el-select v-model="resolutionFilter" @change="handleResolutionFilterChange">
            <el-option label="待处理异常" value="open" />
            <el-option label="全部对账结果" value="all" />
            <el-option label="已人工处理" value="manually_resolved" />
          </el-select>
        </div>

        <AdminDataTable
          v-model:page="reconciliationPagination.page"
          v-model:page-size="reconciliationPagination.pageSize"
          :data="reconciliationItems"
          :loading="loadingReconciliation"
          :total="reconciliationPagination.total"
          empty-text="暂无对账明细"
          show-pagination
          @page-change="handleReconciliationPageChange"
          @page-size-change="handleReconciliationPageSizeChange"
        >
          <el-table-column label="对账日期" width="112">
            <template #default="{ row }">{{ row.run?.businessDate || '—' }}</template>
          </el-table-column>
          <el-table-column label="订单与用户" min-width="220">
            <template #default="{ row }">
              <div class="user-cell">
                <strong>{{ row.orderNo }}</strong>
                <span>{{ reconciliationUserText(row) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="本地 / 银联" width="145">
            <template #default="{ row }">
              {{ statusText(row.localStatus) }} / {{ providerStatusText(row.providerStatus) }}
            </template>
          </el-table-column>
          <el-table-column label="金额" width="130">
            <template #default="{ row }">
              ¥{{ formatMoney(row.localAmountCents) }} / {{ row.providerAmountCents == null ? '—' : `¥${formatMoney(row.providerAmountCents)}` }}
            </template>
          </el-table-column>
          <el-table-column label="结果" width="120">
            <template #default="{ row }">
              <el-tag :type="reconciliationResultTag(row.result)" effect="light">
                {{ reconciliationResultText(row.result) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="说明" min-width="230" show-overflow-tooltip />
          <el-table-column label="操作" width="190" fixed="right">
            <template #default="{ row }">
              <template v-if="row.resolutionStatus === 'open'">
                <el-button
                  link
                  type="primary"
                  :loading="recheckingItemId === row.id"
                  @click="handleRecheckItem(row.id)"
                >
                  复核并修复
                </el-button>
                <el-button link @click="handleResolveItem(row.id)">标记已处理</el-button>
              </template>
              <span v-else class="operation-muted">{{ resolutionStatusText(row.resolutionStatus) }}</span>
            </template>
          </el-table-column>
        </AdminDataTable>
      </section>

      <section class="orders-card">
        <div class="orders-toolbar">
          <div>
            <h2>全站支付订单</h2>
            <p>这里展示所有用户的支付记录，不受当前管理员账号限制。</p>
          </div>
          <div class="toolbar-actions">
            <el-input
              v-model="orderKeyword"
              clearable
              placeholder="订单号 / 用户名 / 邮箱"
              @keyup.enter="handleOrderSearch"
              @clear="handleOrderSearch"
            />
            <el-select v-model="statusFilter" placeholder="全部状态" clearable @change="handleFilterChange">
              <el-option label="待支付" value="pending" />
              <el-option label="已支付" value="paid" />
              <el-option label="失败" value="failed" />
              <el-option label="已关闭" value="closed" />
              <el-option label="退款中" value="refunding" />
              <el-option label="已退款" value="refunded" />
            </el-select>
            <el-button type="primary" plain @click="handleOrderSearch">搜索</el-button>
            <el-button :loading="loadingOrders" @click="loadOrders">刷新</el-button>
          </div>
        </div>

        <AdminDataTable
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :data="orders"
          :loading="loadingOrders"
          :total="pagination.total"
          empty-text="暂无支付订单"
          show-pagination
          @page-change="handleOrderPageChange"
          @page-size-change="handleOrderPageSizeChange"
        >
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
          <el-table-column label="操作" width="105" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleOpenOrderDetail(row.orderNo)">
                订单追踪
              </el-button>
            </template>
          </el-table-column>
        </AdminDataTable>
      </section>
    </main>

    <el-drawer
      v-model="orderDetailVisible"
      :title="orderDetailTitle"
      size="min(760px, 94vw)"
      destroy-on-close
      @closed="handleOrderDetailClosed"
    >
      <div v-loading="loadingOrderDetail" class="order-detail-drawer">
        <template v-if="orderDetail">
          <section class="detail-section detail-overview">
            <div class="detail-section-heading">
              <div>
                <h3>订单与用户</h3>
                <p>先确认订单、用户、金额和当前资金状态，再执行高风险操作。</p>
              </div>
              <div class="detail-heading-actions">
                <el-tag :type="statusTagType(orderDetail.order.status)" effect="light">
                  {{ statusText(orderDetail.order.status) }}
                </el-tag>
                <el-button
                  v-if="canRefundOrder"
                  type="danger"
                  plain
                  :loading="refundingOrderNo === orderDetail.order.orderNo"
                  @click="handleRefund(orderDetail.order)"
                >
                  全额退款
                </el-button>
                <el-button
                  v-else-if="processingRefund"
                  type="primary"
                  plain
                  :loading="queryingRefundNo === processingRefund.refundOrderNo"
                  @click="handleRefundQuery(processingRefund.refundOrderNo)"
                >
                  查询退款状态
                </el-button>
              </div>
            </div>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="订单号">{{ orderDetail.order.orderNo }}</el-descriptions-item>
              <el-descriptions-item label="用户">
                {{ orderDetail.order.user.username }} · {{ orderDetail.order.user.email }}
              </el-descriptions-item>
              <el-descriptions-item label="套餐">
                {{ planText(orderDetail.order.plan, orderDetail.order.priceType) }} · {{ normalizeExamTypes(orderDetail.order.examTypes).join(' / ') }}
              </el-descriptions-item>
              <el-descriptions-item label="金额">
                ¥{{ formatMoney(orderDetail.order.amountCents) }} / 已退 ¥{{ formatMoney(orderDetail.order.refundedAmountCents) }}
              </el-descriptions-item>
              <el-descriptions-item label="支付渠道">{{ channelText(orderDetail.order.channel) }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDateTime(orderDetail.order.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="支付时间">{{ formatOptionalDateTime(orderDetail.order.paidAt) }}</el-descriptions-item>
              <el-descriptions-item label="过期时间">{{ formatDateTime(orderDetail.order.expiresAt) }}</el-descriptions-item>
              <el-descriptions-item label="关闭时间">{{ formatOptionalDateTime(orderDetail.order.closedAt) }}</el-descriptions-item>
              <el-descriptions-item
                v-if="orderDetail.order.failureCode || orderDetail.order.failureMessage"
                label="失败原因"
                :span="2"
              >
                {{ [orderDetail.order.failureCode, orderDetail.order.failureMessage].filter(Boolean).join('：') }}
              </el-descriptions-item>
            </el-descriptions>
          </section>

          <section class="detail-section">
            <div class="detail-section-heading">
              <div>
                <h3>关键处理状态</h3>
                <p>快速确认渠道流水、支付通知、权益和对账是否完整。</p>
              </div>
            </div>
            <div class="detail-signal-grid">
              <article v-for="signal in detailSignals" :key="signal.key" :class="['detail-signal', `detail-signal--${signal.tone}`]">
                <span>{{ signal.label }}</span>
                <strong>{{ signal.value }}</strong>
                <small>{{ signal.note }}</small>
              </article>
            </div>
          </section>

          <section class="detail-section">
            <div class="detail-section-heading">
              <div>
                <h3>支付处理时间线</h3>
                <p>按时间倒序汇总支付、通知、退款、权益、对账和管理员操作。</p>
              </div>
            </div>
            <el-timeline class="payment-timeline">
              <el-timeline-item
                v-for="event in orderDetail.timeline"
                :key="event.id"
                :timestamp="formatDateTime(event.occurredAt)"
                :type="auditEventType(event)"
                placement="top"
              >
                <div class="timeline-event">
                  <div class="timeline-title-row">
                    <strong>{{ event.title }}</strong>
                    <el-tag v-if="event.inferred" size="small" type="info" effect="plain">关联权益快照</el-tag>
                  </div>
                  <p>{{ event.description }}</p>
                  <span v-if="event.actor">操作人：{{ event.actor.username }}（{{ event.actor.email || event.actor.id }}）</span>
                </div>
              </el-timeline-item>
            </el-timeline>
          </section>

          <section class="detail-section">
            <div class="detail-section-heading">
              <div>
                <h3>关联会员权益</h3>
                <p>仅展示通过本订单编号精确关联创建的会员权益。</p>
              </div>
            </div>
            <AdminDataTable
              :data="orderDetail.memberships"
              size="small"
              empty-text="没有关联权益记录"
            >
              <el-table-column prop="examType" label="考试" width="90" />
              <el-table-column label="套餐" width="110">
                <template #default="{ row }">{{ planText(row.plan, '') }}</template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">{{ membershipStatusText(row.status) }}</template>
              </el-table-column>
              <el-table-column label="有效期" min-width="230">
                <template #default="{ row }">{{ formatDateTime(row.startsAt) }} 至 {{ formatDateTime(row.endsAt) }}</template>
              </el-table-column>
            </AdminDataTable>
          </section>

          <section class="detail-section">
            <div class="detail-section-heading">
              <div>
                <h3>技术与审计信息</h3>
                <p>仅在支付异常、客服投诉或财务核查时展开；敏感信息不会展示。</p>
              </div>
            </div>
            <el-collapse class="audit-records">
              <el-collapse-item title="渠道与商户配置" name="merchant">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="运行环境">
                    {{ orderDetail.provider.environment === 'prod' ? '生产' : '测试' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="AppId">{{ orderDetail.provider.appIdMasked || '—' }}</el-descriptions-item>
                  <el-descriptions-item label="商户号 MID">{{ orderDetail.provider.mid || '—' }}</el-descriptions-item>
                  <el-descriptions-item label="终端号 TID">{{ orderDetail.provider.tid || '—' }}</el-descriptions-item>
                  <el-descriptions-item label="机构商户号">{{ orderDetail.provider.instMid || '—' }}</el-descriptions-item>
                  <el-descriptions-item label="账单日期">{{ orderDetail.provider.billDate || '—' }}</el-descriptions-item>
                  <el-descriptions-item label="二维码 ID">{{ orderDetail.provider.qrCodeId || '—' }}</el-descriptions-item>
                  <el-descriptions-item label="系统 ID">{{ orderDetail.provider.systemId || '—' }}</el-descriptions-item>
                </el-descriptions>
              </el-collapse-item>
              <el-collapse-item :title="`银联响应摘要（${orderDetail.providerSnapshots.length}）`" name="provider">
                <div v-if="orderDetail.providerSnapshots.length === 0" class="record-empty">暂无银联响应快照</div>
                <article v-for="snapshot in orderDetail.providerSnapshots" :key="snapshot.key" class="audit-record">
                  <div><strong>{{ snapshot.label }}</strong><span>{{ formatOptionalDateTime(snapshot.receivedAt) }}</span></div>
                  <pre>{{ formatJson(snapshot.response) }}</pre>
                </article>
              </el-collapse-item>
              <el-collapse-item :title="`异步通知（${orderDetail.notifications.length}）`" name="notifications">
                <div v-if="orderDetail.notifications.length === 0" class="record-empty">暂无异步通知</div>
                <article v-for="notification in orderDetail.notifications" :key="notification.id" class="audit-record">
                  <div>
                    <strong>{{ notification.notificationId }}</strong>
                    <span>{{ notificationStatusText(notification.processStatus) }} · 验签{{ notification.signatureValid ? '通过' : '未通过' }}</span>
                  </div>
                  <p v-if="notification.errorMessage">{{ notification.errorMessage }}</p>
                  <pre>{{ formatJson(notification.payload) }}</pre>
                </article>
              </el-collapse-item>
              <el-collapse-item :title="`退款记录（${orderDetail.refunds.length}）`" name="refunds">
                <div v-if="orderDetail.refunds.length === 0" class="record-empty">暂无退款记录</div>
                <article v-for="refund in orderDetail.refunds" :key="refund.id" class="audit-record">
                  <div>
                    <strong>{{ refund.refundOrderNo }} · ¥{{ formatMoney(refund.amountCents) }}</strong>
                    <span>{{ refundStatusText(refund.status) }} · {{ refund.operator?.username || refund.operatorId }}</span>
                  </div>
                  <p>{{ refund.reason }}</p>
                  <pre v-if="Object.keys(refund.providerResult).length">{{ formatJson(refund.providerResult) }}</pre>
                </article>
              </el-collapse-item>
              <el-collapse-item :title="`对账记录（${orderDetail.reconciliationItems.length}）`" name="reconciliation">
                <div v-if="orderDetail.reconciliationItems.length === 0" class="record-empty">暂无对账记录</div>
                <article v-for="item in orderDetail.reconciliationItems" :key="item.id" class="audit-record audit-record-plain">
                  <div>
                    <strong>{{ item.run.businessDate }} · {{ reconciliationResultText(item.result) }}</strong>
                    <span>{{ resolutionStatusText(item.resolutionStatus) }}</span>
                  </div>
                  <p>{{ item.message }}<template v-if="item.resolutionNote">；{{ item.resolutionNote }}</template></p>
                </article>
              </el-collapse-item>
            </el-collapse>
          </section>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import {
  createAdminPaymentRefund,
  getAdminPaymentConfig,
  getAdminPaymentOrderDetail,
  getAdminPaymentOrders,
  getAdminPaymentReconciliationItems,
  getAdminPaymentReconciliationOverview,
  queryAdminPaymentRefund,
  recheckAdminPaymentReconciliationItem,
  resolveAdminPaymentReconciliationItem,
  runAdminPaymentReconciliation,
  updateAdminPaymentConfig,
  type AdminPaymentOrder,
  type AdminPaymentOrderDetail,
  type AdminPaymentAuditEvent,
  type AdminPaymentReconciliationItem,
  type AdminPaymentReconciliationOverview,
} from '@/api/admin'

const saving = ref(false)
const editing = ref(false)
const loadingOrders = ref(false)
const loadingOrderDetail = ref(false)
const orderDetailVisible = ref(false)
const refundingOrderNo = ref('')
const queryingRefundNo = ref('')
const loadingReconciliation = ref(false)
const runningReconciliation = ref(false)
const recheckingItemId = ref('')
const updatedAt = ref('')
const statusFilter = ref('')
const orderKeyword = ref('')
const orderDetailOrderNo = ref('')
const reconciliationDate = ref('')
const resolutionFilter = ref('open')
const orders = ref<AdminPaymentOrder[]>([])
const orderDetail = ref<AdminPaymentOrderDetail | null>(null)
const reconciliationItems = ref<AdminPaymentReconciliationItem[]>([])
const reconciliationOverview = reactive<AdminPaymentReconciliationOverview>({
  latestRun: null,
  openAnomalyCount: 0,
  failedNotificationCount: 0,
  stuckRefundCount: 0,
  stalePendingCount: 0,
  defaultBusinessDate: '',
  scope: 'local_orders_with_provider_query',
})
const form = reactive({
  monthlyPrice: 198,
  quarterlyOriginalPrice: 594,
  quarterlyPrice: 356,
  status: 'active' as 'active' | 'inactive',
})
const savedForm = reactive({
  monthlyPrice: 198,
  quarterlyOriginalPrice: 594,
  quarterlyPrice: 356,
  status: 'active' as 'active' | 'inactive',
})
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const reconciliationPagination = reactive({ page: 1, pageSize: 10, total: 0 })
// 抽屉加载期间仍展示目标订单号，防止标题在请求完成前跳变。
const orderDetailTitle = computed(() => orderDetailOrderNo.value ? `订单追踪 · ${orderDetailOrderNo.value}` : '订单追踪')

// 全额退款只允许从追踪抽屉对真实银联已支付订单发起，避免列表快捷操作误触。
const canRefundOrder = computed(() => {
  const order = orderDetail.value?.order
  return Boolean(order
    && order.status === 'paid'
    && order.provider === 'chinaums'
    && order.amountCents > 0
    && order.refundedAmountCents === 0)
})

// 退款中的订单在抽屉内提供主动查询入口，使用最近一笔处理中退款定位渠道状态。
const processingRefund = computed(() => orderDetail.value?.refunds.find((refund) => refund.status === 'processing') || null)

// 关键状态卡片把技术明细压缩为客服和财务可直接判断的结论。
const detailSignals = computed(() => {
  const detail = orderDetail.value
  if (!detail) return []
  const failedNotifications = detail.notifications.filter((item) => item.processStatus === 'failed').length
  const openReconciliations = detail.reconciliationItems.filter((item) => item.resolutionStatus === 'open').length
  return [
    {
      key: 'provider',
      label: '渠道流水号',
      value: detail.provider.providerOrderNo || '尚未生成',
      note: detail.provider.billDate ? `账单日期 ${detail.provider.billDate}` : '暂无渠道账单日期',
      tone: detail.provider.providerOrderNo ? 'normal' : 'muted',
    },
    {
      key: 'notification',
      label: '支付通知',
      value: detail.notifications.length ? `${detail.notifications.length} 条` : '暂无通知',
      note: failedNotifications ? `${failedNotifications} 条处理失败` : '未发现处理失败',
      tone: failedNotifications ? 'danger' : detail.notifications.length ? 'success' : 'muted',
    },
    {
      key: 'membership',
      label: '关联权益',
      value: `${detail.memberships.length} 项`,
      note: '按支付订单精确关联',
      tone: detail.memberships.length ? 'success' : 'muted',
    },
    {
      key: 'reconciliation',
      label: '对账结果',
      value: detail.reconciliationItems.length ? `${detail.reconciliationItems.length} 条` : '尚未对账',
      note: openReconciliations ? `${openReconciliations} 条待处理异常` : '暂无待处理异常',
      tone: openReconciliations ? 'danger' : detail.reconciliationItems.length ? 'success' : 'muted',
    },
  ]
})

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

// 缺失的支付、关单和渠道接收时间统一显示占位符，避免详情页出现无效日期。
function formatOptionalDateTime(value?: string | null): string {
  return value ? formatDateTime(value) : '—'
}

// 渠道快照使用格式化 JSON 展示，数据已由后端在入库时完成脱敏。
function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function syncSavedForm(): void {
  savedForm.monthlyPrice = form.monthlyPrice
  savedForm.quarterlyOriginalPrice = form.quarterlyOriginalPrice
  savedForm.quarterlyPrice = form.quarterlyPrice
  savedForm.status = form.status
}

function startEditing(): void {
  syncSavedForm()
  editing.value = true
}

function cancelEditing(): void {
  form.monthlyPrice = savedForm.monthlyPrice
  form.quarterlyOriginalPrice = savedForm.quarterlyOriginalPrice
  form.quarterlyPrice = savedForm.quarterlyPrice
  form.status = savedForm.status
  editing.value = false
}

function normalizeExamTypes(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function planText(plan: string, priceType: string): string {
  if (plan === 'daily_gift' || priceType === 'admin_gift') return '管理员赠送日卡'
  if (plan === 'weekly_reward' || priceType === 'invitation_reward') return '邀请奖励周卡'
  if (plan === 'quarterly') return '季卡会员'
  if (plan === 'yearly') return '年度会员（历史）'
  return priceType === 'first_monthly' ? '月度会员（历史首购）' : '月卡会员'
}

function channelText(channel: string): string {
  return {
    alipay: '支付宝',
    wechat: '微信支付',
    unionpay: '云闪付',
    admin_gift: '管理员赠送',
    invitation_reward: '邀请奖励',
  }[channel] || channel
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

// 时间线节点颜色按资金和异常语义区分，便于管理员快速定位失败与退款事件。
function auditEventType(event: AdminPaymentAuditEvent): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  if (event.status === 'paid' || event.status === 'succeeded' || event.status === 'processed') return 'success'
  if (event.status === 'failed' || event.status === 'open' || event.status === 'anomaly') return 'danger'
  if (event.category === 'refund' || event.status === 'processing') return 'warning'
  if (event.category === 'reconciliation') return 'primary'
  return 'info'
}

// 会员状态文案与支付详情中的权益快照保持一致。
function membershipStatusText(status: string): string {
  return {
    active: '生效中',
    expired: '已到期',
    cancelled: '已取消',
  }[status] || status
}

// 退款和通知的渠道状态转换为管理员可读文案。
function refundStatusText(status: string): string {
  return { processing: '处理中', succeeded: '已退款', failed: '失败' }[status] || status
}

function notificationStatusText(status: string): string {
  return { received: '已接收', processed: '处理成功', failed: '处理失败' }[status] || status
}

// 银联账单状态转换为后台可读文案，未知值仍保留原始状态便于排查。
function providerStatusText(status?: string | null): string {
  if (!status) return '查询失败'
  return {
    PAID: '已支付',
    UNPAID: '待支付',
    CLOSED: '已关闭',
    REFUND: '已退款',
  }[status] || status
}

// 对账批次状态用于摘要卡片，不隐藏部分失败和执行中状态。
function reconciliationRunText(status?: string): string {
  return {
    running: '执行中',
    completed: '已完成',
    partial: '部分订单查询失败',
    failed: '执行失败',
  }[status || ''] || '等待首次对账'
}

// 对账明细结果区分一致、管理员修复和仍需人工关注的异常。
function reconciliationResultText(result: string): string {
  return {
    matched: '一致',
    corrected: '已人工修复',
    anomaly: '状态异常',
    error: '查询失败',
  }[result] || result
}

// 标签颜色让正常、人工修复和异常结果在长列表中可快速识别。
function reconciliationResultTag(result: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  if (result === 'matched') return 'success'
  if (result === 'corrected') return 'primary'
  if (result === 'anomaly' || result === 'error') return 'danger'
  return 'info'
}

// 异常关闭方式保留历史自动修复兼容值，新产生的修复均记录为管理员操作。
function resolutionStatusText(status: string): string {
  return {
    none: '无需处理',
    auto_resolved: '历史自动修复',
    manually_resolved: '已人工处理',
  }[status] || status
}

// 对账明细关联全站订单用户，关联缺失时仍显示可定位的订单信息。
function reconciliationUserText(item: AdminPaymentReconciliationItem): string {
  const user = item.paymentOrder?.user
  return user ? `${user.username} · ${user.email}` : '用户信息不可用'
}

// 页面初始化时读取数据库中的当前支付策略。
async function loadConfig(): Promise<void> {
  try {
    const config = await getAdminPaymentConfig()
    form.monthlyPrice = centsToYuan(config.monthlyPriceCents)
    form.quarterlyOriginalPrice = centsToYuan(config.quarterlyOriginalPriceCents)
    form.quarterlyPrice = centsToYuan(config.quarterlyPriceCents)
    form.status = config.status
    updatedAt.value = config.updatedAt
    syncSavedForm()
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  }
}

// 管理员保存价格后，前台下一次打开支付弹窗即使用新策略。
async function saveConfig(): Promise<void> {
  if (!editing.value) return
  if (form.quarterlyPrice > form.quarterlyOriginalPrice) {
    ElMessage.warning('季卡折扣价不能高于季卡原价')
    return
  }
  saving.value = true
  try {
    const config = await updateAdminPaymentConfig({
      monthlyPriceCents: yuanToCents(form.monthlyPrice),
      quarterlyOriginalPriceCents: yuanToCents(form.quarterlyOriginalPrice),
      quarterlyPriceCents: yuanToCents(form.quarterlyPrice),
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
      keyword: orderKeyword.value.trim() || undefined,
    })
    orders.value = data.list
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
  } finally {
    loadingOrders.value = false
  }
}

// 切换支付订单页码后读取对应页数据。
async function handleOrderPageChange(page: number): Promise<void> {
  pagination.page = page
  await loadOrders()
}

// 调整支付订单每页条数后回到第一页，并让页面高度随当前页数据自然展开。
async function handleOrderPageSizeChange(pageSize: number): Promise<void> {
  pagination.pageSize = pageSize
  pagination.page = 1
  await loadOrders()
}

// 订单详情由后台一次性聚合，避免抽屉为通知、退款和对账分别发起请求。
async function loadOrderDetail(orderNo: string): Promise<void> {
  loadingOrderDetail.value = true
  try {
    const detail = await getAdminPaymentOrderDetail(orderNo)
    if (orderDetailOrderNo.value === orderNo) orderDetail.value = detail
  } finally {
    if (orderDetailOrderNo.value === orderNo) loadingOrderDetail.value = false
  }
}

// 管理员从全站订单列表进入审计抽屉，先打开容器再展示加载状态。
function handleOpenOrderDetail(orderNo: string): void {
  orderDetailOrderNo.value = orderNo
  orderDetail.value = null
  orderDetailVisible.value = true
  void loadOrderDetail(orderNo)
}

// 抽屉关闭后清理上一订单数据，避免下次打开瞬间显示旧用户信息。
function handleOrderDetailClosed(): void {
  orderDetailOrderNo.value = ''
  orderDetail.value = null
  loadingOrderDetail.value = false
}

// 退款或主动查询改变订单后同步刷新仍处于打开状态的审计详情。
async function refreshOpenOrderDetail(): Promise<void> {
  if (!orderDetailVisible.value || !orderDetailOrderNo.value) return
  await loadOrderDetail(orderDetailOrderNo.value)
}

// 订单搜索始终回到第一页，避免旧分页超出筛选后的结果范围。
function handleOrderSearch(): void {
  pagination.page = 1
  void loadOrders()
}

function handleFilterChange(): void {
  pagination.page = 1
  void loadOrders()
}

// 对账摘要与异常列表并行刷新，保证管理员操作后的计数及时变化。
async function loadReconciliationData(): Promise<void> {
  loadingReconciliation.value = true
  try {
    const [overview, items] = await Promise.all([
      getAdminPaymentReconciliationOverview(),
      getAdminPaymentReconciliationItems({
        page: reconciliationPagination.page,
        pageSize: reconciliationPagination.pageSize,
        resolutionStatus: resolutionFilter.value,
      }),
    ])
    Object.assign(reconciliationOverview, overview)
    if (!reconciliationDate.value) reconciliationDate.value = overview.defaultBusinessDate
    reconciliationItems.value = items.list
    reconciliationPagination.page = items.pagination.page
    reconciliationPagination.pageSize = items.pagination.pageSize
    reconciliationPagination.total = items.pagination.total
  } finally {
    loadingReconciliation.value = false
  }
}

// 分页变化只重新读取明细，避免重复请求摘要指标。
async function loadReconciliationItems(): Promise<void> {
  loadingReconciliation.value = true
  try {
    const items = await getAdminPaymentReconciliationItems({
      page: reconciliationPagination.page,
      pageSize: reconciliationPagination.pageSize,
      resolutionStatus: resolutionFilter.value,
    })
    reconciliationItems.value = items.list
    reconciliationPagination.page = items.pagination.page
    reconciliationPagination.pageSize = items.pagination.pageSize
    reconciliationPagination.total = items.pagination.total
  } finally {
    loadingReconciliation.value = false
  }
}

// 切换对账明细页码后读取对应页数据。
async function handleReconciliationPageChange(page: number): Promise<void> {
  reconciliationPagination.page = page
  await loadReconciliationItems()
}

// 调整对账明细每页条数后回到第一页，完整展示当页明细。
async function handleReconciliationPageSizeChange(pageSize: number): Promise<void> {
  reconciliationPagination.pageSize = pageSize
  reconciliationPagination.page = 1
  await loadReconciliationItems()
}

// 切换异常处理状态时从第一页重新读取对应集合。
function handleResolutionFilterChange(): void {
  reconciliationPagination.page = 1
  void loadReconciliationItems()
}

// 手动对账只调用银联查询并生成差异，任何业务状态修复都留给管理员后续显式操作。
async function handleRunReconciliation(): Promise<void> {
  if (!reconciliationDate.value) {
    ElMessage.warning('请选择对账日期')
    return
  }
  try {
    await ElMessageBox.confirm(
      `将逐笔查询 ${reconciliationDate.value} 的全站支付订单并生成异常明细，本次操作不会自动修改订单、退款或会员状态。`,
      '确认执行交易对账',
      { confirmButtonText: '开始对账', cancelButtonText: '取消', type: 'warning' },
    )
    runningReconciliation.value = true
    const run = await runAdminPaymentReconciliation(reconciliationDate.value)
    ElMessage.success(`对账完成：${run.totalOrders} 笔，待管理员处理异常 ${run.anomalyOrders + run.errorOrders} 笔`)
    reconciliationPagination.page = 1
    await Promise.all([loadReconciliationData(), loadOrders()])
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    runningReconciliation.value = false
  }
}

// 修复必须由管理员再次确认，服务端仍只接受银联可验证且金额一致的最终状态。
async function handleRecheckItem(id: string): Promise<void> {
  try {
    await ElMessageBox.confirm(
      '系统将重新查询银联。若状态和金额可验证，将立即修复对应订单、退款或会员状态，并记录本次管理员操作。',
      '确认人工复核并修复',
      { confirmButtonText: '确认复核并修复', cancelButtonText: '取消', type: 'warning' },
    )
    recheckingItemId.value = id
    const item = await recheckAdminPaymentReconciliationItem(id)
    ElMessage.success(item.resolutionStatus === 'open' ? '复核完成，异常仍需管理员进一步处理' : '管理员复核完成，处理结果已记录')
    await Promise.all([loadReconciliationData(), loadOrders()])
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    recheckingItemId.value = ''
  }
}

// 人工关闭告警必须记录处理说明，保留后续财务和客服审计依据。
async function handleResolveItem(id: string): Promise<void> {
  try {
    const result = await ElMessageBox.prompt('请填写线下核查结果或处理依据。', '标记异常已处理', {
      confirmButtonText: '确认处理完成',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：已与银联账单及客户付款凭证核实',
      inputValidator: (value) => value.trim().length >= 2 || '处理说明至少填写 2 个字符',
    })
    await resolveAdminPaymentReconciliationItem(id, result.value.trim())
    ElMessage.success('异常已标记为人工处理完成')
    await loadReconciliationData()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  }
}

// 管理员确认退款原因后发起全额退款，最终状态由银联响应或后续主动查询确认。
async function handleRefund(order: AdminPaymentOrder): Promise<void> {
  try {
    const result = await ElMessageBox.prompt(
      `用户：${order.user.username}；订单：${order.orderNo}；将原路退回 ¥${formatMoney(order.amountCents)}。退款成功后会回收本订单发放的会员权益。`,
      '确认全额退款',
      {
        confirmButtonText: '确认退款',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入退款原因',
        inputValidator: (value) => value.trim().length >= 2 || '退款原因至少填写 2 个字符',
        type: 'warning',
      },
    )
    refundingOrderNo.value = order.orderNo
    const refund = await createAdminPaymentRefund(order.orderNo, result.value.trim())
    ElMessage.success(refund.status === 'succeeded' ? '退款成功，会员权益已回收' : '退款已受理，请稍后查询')
    await Promise.all([loadOrders(), refreshOpenOrderDetail()])
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') throw error
  } finally {
    refundingOrderNo.value = ''
  }
}

// 对处理中的退款主动查单，避免渠道通知丢失时后台状态长期停留在退款中。
async function handleRefundQuery(refundOrderNo: string): Promise<void> {
  queryingRefundNo.value = refundOrderNo
  try {
    const refund = await queryAdminPaymentRefund(refundOrderNo)
    ElMessage.success(refund.status === 'succeeded' ? '退款成功，状态已同步' : '退款仍在处理中')
    await Promise.all([loadOrders(), refreshOpenOrderDetail()])
  } finally {
    queryingRefundNo.value = ''
  }
}

onMounted(() => {
  void Promise.all([loadConfig(), loadOrders(), loadReconciliationData()])
})
</script>

<style scoped lang="scss">
.payment-admin-page { min-height: 100%; background: #f6f8fb; }
.page-body { width: 100%; max-width: 1480px; padding: 22px 40px 48px; box-sizing: border-box; }
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.page-heading h1 { margin: 0 0 7px; color: #0f172a; font-size: 1.55rem; }
.page-heading p, .card-heading p, .orders-toolbar p { margin: 0; color: #718096; font-size: 0.88rem; }
.environment-badge { padding: 7px 12px; color: #176b4d; font-size: 0.78rem; background: #ecfdf5; border: 1px solid #b7ead3; border-radius: 999px; }
.strategy-card, .reconciliation-card, .orders-card { background: #fff; border: 1px solid #dce3ec; border-radius: 14px; box-shadow: 0 8px 24px rgb(15 23 42 / 7%); }
.strategy-card { padding: 24px 26px 20px; }
.card-heading, .orders-toolbar, .strategy-footer { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.card-heading h2, .orders-toolbar h2 { margin: 0 0 5px; color: #162033; font-size: 1.08rem; }
.price-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px; margin-top: 25px; }
.price-form :deep(.el-form-item) { min-width: 0; margin-bottom: 18px; }
.price-form :deep(.el-form-item__label) { color: #344054; font-size: 0.86rem; font-weight: 650; }
.price-form :deep(.el-form-item__content) { flex-direction: column; align-items: flex-start; }
.price-form :deep(.el-input-number) { width: 33.333%; min-width: 132px; }
.field-hint { display: block; margin-top: 7px; color: #94a3b8; font-size: 0.75rem; line-height: 1.4; }
.strategy-footer { padding-top: 18px; border-top: 1px solid #edf0f4; }
.strategy-footer > span { color: #94a3b8; font-size: 0.78rem; }
.strategy-actions { display: flex; align-items: center; gap: 8px; }
.reconciliation-card, .orders-card { margin-top: 24px; overflow: hidden; }
.orders-toolbar { padding: 22px 24px; border-bottom: 1px solid #e8ecf1; }
.toolbar-actions { display: flex; gap: 10px; }
.toolbar-actions :deep(.el-select) { width: 140px; }
.toolbar-actions :deep(.el-input) { width: 225px; }
.toolbar-actions :deep(.el-date-editor) { width: 160px; }
.reconciliation-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; padding: 20px 24px 8px; }
.metric-item { display: grid; gap: 6px; min-height: 90px; padding: 16px 18px; background: #f8fafc; border: 1px solid #e5eaf1; border-radius: 11px; box-sizing: border-box; }
.metric-item span { color: #64748b; font-size: 0.78rem; }
.metric-item strong { color: #172033; font-size: 1.28rem; line-height: 1.2; }
.metric-item small { color: #94a3b8; font-size: 0.72rem; }
.metric-warning strong { color: #d97706; }
.reconciliation-note { width: auto; margin: 14px 24px 4px; }
.settlement-guide { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin: 14px 24px 4px; padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px; }
.settlement-guide > div { display: grid; gap: 4px; }
.settlement-guide strong { color: #334155; font-size: 0.82rem; }
.settlement-guide span { color: #718096; font-size: 0.75rem; line-height: 1.5; }
.settlement-guide :deep(.el-link) { flex: 0 0 auto; }
.anomaly-toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding: 20px 24px 14px; }
.anomaly-toolbar h3 { margin: 0 0 5px; color: #263245; font-size: 0.96rem; }
.anomaly-toolbar span { color: #8b97a8; font-size: 0.75rem; }
.anomaly-toolbar :deep(.el-select) { width: 150px; }
.orders-card :deep(.el-table) { --el-table-border-color: #edf0f4; }
.reconciliation-card :deep(.el-table) { --el-table-border-color: #edf0f4; }
.user-cell { display: grid; gap: 3px; }
.user-cell strong { color: #273244; font-size: 0.86rem; }
.user-cell span, .exam-tags { color: #8490a2; font-size: 0.75rem; }
.exam-tags { margin-top: 4px; }
.orders-card :deep(.app-pagination), .reconciliation-card :deep(.app-pagination) { padding: 18px 24px; }
.order-detail-drawer { min-height: 240px; padding: 0 4px 28px; }
.detail-section { padding: 4px 0 26px; }
.detail-section + .detail-section { padding-top: 24px; border-top: 1px solid #e8edf3; }
.detail-section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 16px; }
.detail-section-heading h3 { margin: 0 0 5px; color: #172033; font-size: 1rem; }
.detail-section-heading p { margin: 0; color: #8490a2; font-size: 0.76rem; line-height: 1.5; }
.detail-heading-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 10px; }
.detail-overview :deep(.el-descriptions__label), .detail-section :deep(.el-descriptions__label) { width: 112px; color: #64748b; font-weight: 600; }
.detail-section :deep(.el-descriptions__content) { color: #263245; word-break: break-all; }
.detail-signal-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.detail-signal { display: flex; min-width: 0; flex-direction: column; gap: 6px; padding: 15px 16px; background: #f8fafc; border: 1px solid #e5eaf1; border-radius: 10px; }
.detail-signal span { color: #718096; font-size: 0.75rem; }
.detail-signal strong { overflow: hidden; color: #273244; font-size: 0.9rem; text-overflow: ellipsis; white-space: nowrap; }
.detail-signal small { color: #94a3b8; font-size: 0.72rem; }
.detail-signal--success { background: #f4fbf7; border-color: #cfe9da; }
.detail-signal--success strong { color: #176b4d; }
.detail-signal--danger { background: #fff7f7; border-color: #f5d0d0; }
.detail-signal--danger strong { color: #c24141; }
.detail-signal--muted strong { color: #7b8798; }
.payment-timeline { padding: 8px 4px 0 6px; }
.timeline-event { padding: 2px 0 7px; }
.timeline-title-row { display: flex; align-items: center; gap: 9px; }
.timeline-title-row strong { color: #253044; font-size: 0.88rem; }
.timeline-event p { margin: 6px 0 4px; color: #526174; font-size: 0.8rem; line-height: 1.55; }
.timeline-event > span { color: #8b97a8; font-size: 0.72rem; }
.audit-records :deep(.el-collapse-item__header) { color: #344054; font-weight: 650; }
.audit-record { padding: 12px 0 15px; border-bottom: 1px solid #edf1f5; }
.audit-record:last-child { border-bottom: 0; }
.audit-record > div { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.audit-record strong { color: #273244; font-size: 0.8rem; }
.audit-record span, .audit-record p { color: #7b8798; font-size: 0.73rem; }
.audit-record p { margin: 7px 0 0; line-height: 1.5; }
.audit-record pre { max-height: 270px; margin: 10px 0 0; padding: 12px 14px; overflow: auto; color: #334155; font: 12px/1.55 Consolas, Monaco, monospace; white-space: pre-wrap; overflow-wrap: anywhere; background: #f7f9fc; border: 1px solid #e5eaf1; border-radius: 8px; }
.audit-record-plain { padding-right: 3px; }
.record-empty { padding: 18px 0; color: #94a3b8; font-size: 0.78rem; text-align: center; }
@media (max-width: 680px) {
  .page-body { padding-right: 18px; padding-left: 18px; }
  .price-form { grid-template-columns: 1fr; gap: 4px; }
  .page-heading, .orders-toolbar { align-items: stretch; flex-direction: column; }
  .toolbar-actions { align-items: stretch; flex-direction: column; }
  .toolbar-actions :deep(.el-input), .toolbar-actions :deep(.el-select), .toolbar-actions :deep(.el-date-editor) { width: 100%; }
  .settlement-guide { align-items: flex-start; flex-direction: column; }
  .reconciliation-metrics { grid-template-columns: 1fr; }
  .anomaly-toolbar { align-items: stretch; flex-direction: column; }
  .detail-section-heading { align-items: stretch; flex-direction: column; }
  .detail-heading-actions { justify-content: space-between; }
  .detail-signal-grid { grid-template-columns: 1fr; }
  .detail-section :deep(.el-descriptions) { --el-descriptions-table-border: 1px solid #e5eaf1; }
  .detail-section :deep(.el-descriptions__label) { width: 92px; }
}
</style>
