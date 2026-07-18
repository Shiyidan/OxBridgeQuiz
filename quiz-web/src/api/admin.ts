/**
 * 管理后台 相关 API
 */
import { callApi } from '@/utils/request'

export interface RevenueItem {
  id: string
  costCategory: string
  rechargeItem: string
  amount: number
  operator: string
  occurredAt: string
  reimbursementStatus: string
  remark?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface UserItem {
  id: string
  username: string
  email: string
  role: string
  paymentStatus?: string
  diagnosticUsed?: boolean
  createdAt: string
  memberships?: UserMembershipItem[]
}

export interface UserMembershipItem {
  id: string
  examType: string
  plan: string
  status: string
  startsAt: number
  endsAt: number
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
}

export interface PageResult<T> {
  list: T[]
  pagination: PaginationMeta
}

export interface ListParams {
  page?: number
  pageSize?: number
}

export interface OperationLogItem {
  id: string
  occurredAt: string
  requestId?: string | null
  actorUserId?: string | null
  actorNameSnapshot: string
  actorEmailSnapshot: string
  actorRoleSnapshot: string
  module: string
  action: string
  summary: string
  result: 'success' | 'failure'
  resourceType?: string | null
  resourceId?: string | null
  method: string
  path: string
  statusCode: number
  ipAddress?: string | null
  userAgent?: string | null
  errorCode?: string | null
  hasChanges: boolean
  createdAt: string
}

export interface OperationLogChange {
  before: unknown
  after: unknown
}

export interface OperationLogDetail extends Omit<OperationLogItem, 'hasChanges'> {
  changes?: Record<string, OperationLogChange> | null
}

export interface OperationLogListParams extends ListParams {
  role?: string
  module?: string
  result?: string
  action?: string
  keyword?: string
  startAt?: string
  endAt?: string
}

export interface BehaviorAnalyticsParams {
  startAt?: string
  endAt?: string
  module?: string
}

export interface BehaviorAnalyticsOverview {
  activeUsers: number
  activeUsersChangeRate: number | null
  operationCount: number
  operationCountChangeRate: number | null
  averageOperations: number
  averageOperationsChangeRate: number | null
  moduleCount: number
  failureRate: number
  failureRateChange: number | null
}

export interface BehaviorAnalyticsRankingItem {
  userCount: number
  operationCount: number
  averageOperations: number
  penetrationRate: number
  repeatedUserRate: number
  failureRate: number
  userChangeRate: number | null
  operationChangeRate: number | null
}

export interface BehaviorAnalyticsModule extends BehaviorAnalyticsRankingItem {
  module: string
}

export interface BehaviorAnalyticsAction extends BehaviorAnalyticsRankingItem {
  module: string
  action: string
}

export interface BehaviorAnalyticsTrendItem {
  date: string
  userCount: number
  operationCount: number
  failureCount: number
}

export type ProductUsageModuleCode = 'diagnostic_test' | 'question_bank' | 'mock_exam'
export type ProductPreferenceCode = ProductUsageModuleCode | 'mixed' | 'insufficient'

export interface BehaviorProductUsageModule {
  module: ProductUsageModuleCode
  userCount: number
  completionCount: number
  averageCompletions: number
  completionShare: number
  userPenetrationRate: number
  repeatedUserRate: number
  completionChangeRate: number | null
}

export interface BehaviorProductPreference {
  preference: ProductPreferenceCode
  userCount: number
  userRate: number
}

export interface BehaviorProductTrendItem {
  date: string
  diagnosticTestCount: number
  questionBankPracticeCount: number
  mockExamCount: number
  reportViewCount: number
}

export interface BehaviorProductUsage {
  scope: {
    completionSource: 'exam_record'
    reportViewSource: 'operation_log'
    preferenceMinimumCompletions: number
  }
  overview: {
    activeUsers: number
    completedActivityCount: number
    completedActivityChangeRate: number | null
    reportViewCount: number
    reportViewChangeRate: number | null
    reportViewerCount: number
    distinctReportCount: number
    averageReportViews: number
    samePeriodReportViewRate: number
  }
  modules: BehaviorProductUsageModule[]
  preferences: BehaviorProductPreference[]
  trend: BehaviorProductTrendItem[]
}

export interface BehaviorAnalyticsResult {
  scope: {
    actorRoleSnapshot: 'student'
    excludedModules: string[]
    timezone: 'Asia/Shanghai'
  }
  period: {
    startAt: string
    endAt: string
    previousStartAt: string
    previousEndAt: string
    endExclusive: true
  }
  overview: BehaviorAnalyticsOverview
  modules: BehaviorAnalyticsModule[]
  actions: BehaviorAnalyticsAction[]
  trend: BehaviorAnalyticsTrendItem[]
  productUsage: BehaviorProductUsage
  dataQuality: {
    unattributedOperationCount: number
  }
}

export interface AdminPaymentConfig {
  firstMonthlyPriceCents: number
  monthlyPriceCents: number
  yearlyPriceCents: number
  status: 'active' | 'inactive'
  updatedBy?: string | null
  updatedAt: string
}

export interface AdminPaymentOrder {
  id: string
  orderNo: string
  examTypes: string[]
  plan: string
  priceType: string
  amountCents: number
  refundedAmountCents: number
  currency: string
  channel: string
  status: string
  provider: string
  providerOrderNo?: string | null
  failureCode?: string | null
  failureMessage?: string | null
  expiresAt: string
  paidAt?: string | null
  closedAt?: string | null
  createdAt: string
  updatedAt?: string
  latestRefund?: AdminPaymentRefund | null
  user: { id: string; username: string; email: string }
}

export interface AdminPaymentRefund {
  id: string
  refundOrderNo: string
  amountCents: number
  reason: string
  status: 'processing' | 'succeeded' | 'failed'
  providerRefundNo?: string | null
  failureCode?: string | null
  failureMessage?: string | null
  operatorId: string
  refundedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminPaymentReconciliationRun {
  id: string
  provider: string
  businessDate: string
  status: 'running' | 'completed' | 'partial' | 'failed'
  trigger: 'scheduled' | 'manual'
  triggeredBy?: string | null
  totalOrders: number
  matchedOrders: number
  correctedOrders: number
  anomalyOrders: number
  errorOrders: number
  errorMessage?: string | null
  startedAt: string
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminPaymentReconciliationOverview {
  latestRun: AdminPaymentReconciliationRun | null
  openAnomalyCount: number
  failedNotificationCount: number
  stuckRefundCount: number
  stalePendingCount: number
  defaultBusinessDate: string
  scope: 'local_orders_with_provider_query'
}

export interface AdminPaymentReconciliationItem {
  id: string
  runId: string
  paymentOrderId: string
  orderNo: string
  localStatus: string
  providerStatus?: string | null
  localAmountCents: number
  providerAmountCents?: number | null
  result: 'matched' | 'corrected' | 'anomaly' | 'error'
  anomalyType?: string | null
  message: string
  resolutionStatus: 'none' | 'open' | 'auto_resolved' | 'manually_resolved'
  resolutionNote?: string | null
  resolvedBy?: string | null
  resolvedAt?: string | null
  createdAt: string
  updatedAt: string
  run?: { businessDate: string }
  paymentOrder?: {
    status: string
    user: { id: string; username: string; email: string }
  }
}

export interface AdminPaymentAuditActor {
  id: string
  username: string
  email: string
}

export interface AdminPaymentAuditEvent {
  id: string
  category: 'order' | 'notification' | 'refund' | 'entitlement' | 'reconciliation'
  title: string
  description: string
  status: string
  occurredAt: string
  actor?: AdminPaymentAuditActor | null
  inferred?: boolean
}

export interface AdminPaymentOrderDetail {
  order: AdminPaymentOrder
  provider: {
    environment: 'test' | 'prod'
    appIdMasked: string
    mid: string
    tid: string
    instMid: string
    msgSrcId: string
    providerOrderNo?: string | null
    billDate?: string | null
    qrCodeId?: string | null
    systemId?: string | null
  }
  providerSnapshots: Array<{
    key: string
    label: string
    receivedAt?: string | null
    response: Record<string, unknown>
  }>
  notifications: Array<{
    id: string
    provider: string
    notificationId: string
    signatureValid: boolean
    processStatus: string
    payload: Record<string, unknown>
    errorMessage?: string | null
    processedAt?: string | null
    createdAt: string
    updatedAt: string
  }>
  refunds: Array<
    AdminPaymentRefund & {
      operator?: AdminPaymentAuditActor | null
      providerResult: Record<string, unknown>
    }
  >
  memberships: Array<{
    id: string
    examType: string
    plan: string
    status: string
    startsAt: string
    endsAt: string
    createdAt: string
    updatedAt: string
    associationBasis: 'user_exam_type_snapshot'
  }>
  reconciliationItems: Array<
    AdminPaymentReconciliationItem & {
      run: AdminPaymentReconciliationRun
      resolver?: AdminPaymentAuditActor | null
      triggerOperator?: AdminPaymentAuditActor | null
    }
  >
  timeline: AdminPaymentAuditEvent[]
}

export interface UpdateUserAccessPayload {
  role: string
  membership?: {
    examTypes: string[]
    plan: string
  }
}

// ---- 成本管理 ----

/** 成本列表 */
export function getRevenueListData(params: ListParams = {}) {
  return callApi<PageResult<RevenueItem>>({
    url: '/admin/revenue-costs/getList',
    method: 'GET',
    isAllData: false,
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
    },
  })
}

/** 更新成本 */
export function updateRevenue(id: string, data: Partial<RevenueItem>) {
  return callApi<RevenueItem>({
    url: `/admin/revenue-costs/${id}`,
    method: 'PUT',
    isAllData: false,
    body: data,
  })
}

/** 新增成本 */
export function createRevenue(data: Partial<RevenueItem>) {
  return callApi<RevenueItem>({
    url: '/admin/revenue-costs',
    method: 'POST',
    isAllData: false,
    body: data,
  })
}

// ---- 用户管理 ----

/** 用户列表 */
export function getUserListData(params: ListParams = {}) {
  return callApi<PageResult<UserItem>>({
    url: '/admin/users',
    method: 'GET',
    isAllData: false,
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
    },
  })
}

/** 更新用户角色 */
export function updateUserRole(userId: string, role: string) {
  return callApi<void>({
    url: `/admin/users/${userId}/role`,
    method: 'PUT',
    isAllData: false,
    body: { role },
  })
}

/** 更新用户权限 */
export function updateUserAccess(userId: string, data: UpdateUserAccessPayload) {
  return callApi<{ user: UserItem | null }>({
    url: `/admin/users/${userId}/access`,
    method: 'PUT',
    isAllData: false,
    body: data,
  })
}

// ---- 支付策略与订单 ----

/** 获取后台支付策略。 */
export function getAdminPaymentConfig() {
  return callApi<AdminPaymentConfig>({
    url: '/admin/payment-config',
    method: 'GET',
    isAllData: false,
  })
}

/** 保存后台支付策略，金额单位为分。 */
export function updateAdminPaymentConfig(
  data: Omit<AdminPaymentConfig, 'updatedAt' | 'updatedBy'>,
) {
  return callApi<AdminPaymentConfig>({
    url: '/admin/payment-config',
    method: 'PUT',
    isAllData: false,
    body: data,
  })
}

/** 查询支付订单。 */
export function getAdminPaymentOrders(
  params: ListParams & { status?: string; keyword?: string } = {},
) {
  return callApi<PageResult<AdminPaymentOrder>>({
    url: '/admin/payment-orders',
    method: 'GET',
    isAllData: false,
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
      status: params.status,
      keyword: params.keyword,
    },
  })
}

/** 获取单笔支付订单及通知、退款、权益和对账审计详情。 */
export function getAdminPaymentOrderDetail(orderNo: string) {
  return callApi<AdminPaymentOrderDetail>({
    url: `/admin/payment-orders/${encodeURIComponent(orderNo)}`,
    method: 'GET',
    isAllData: false,
  })
}

/** 管理员对已支付订单发起全额退款。 */
export function createAdminPaymentRefund(orderNo: string, reason: string) {
  return callApi<AdminPaymentRefund>({
    url: `/admin/payment-orders/${encodeURIComponent(orderNo)}/refunds`,
    method: 'POST',
    isAllData: false,
    body: { reason },
  })
}

/** 主动向银联查询处理中的退款单，并同步最终结果。 */
export function queryAdminPaymentRefund(refundOrderNo: string) {
  return callApi<AdminPaymentRefund>({
    url: `/admin/payment-refunds/${encodeURIComponent(refundOrderNo)}/query`,
    method: 'POST',
    isAllData: false,
  })
}

/** 获取最近对账批次和全站支付异常计数。 */
export function getAdminPaymentReconciliationOverview() {
  return callApi<AdminPaymentReconciliationOverview>({
    url: '/admin/payment-reconciliation/overview',
    method: 'GET',
    isAllData: false,
  })
}

/** 获取对账明细，默认只读取仍待处理的异常。 */
export function getAdminPaymentReconciliationItems(
  params: ListParams & { resolutionStatus?: string } = {},
) {
  return callApi<PageResult<AdminPaymentReconciliationItem>>({
    url: '/admin/payment-reconciliation/items',
    method: 'GET',
    isAllData: false,
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
      resolutionStatus: params.resolutionStatus,
    },
  })
}

/** 管理员手动执行指定自然日的逐单渠道对账。 */
export function runAdminPaymentReconciliation(businessDate: string) {
  return callApi<AdminPaymentReconciliationRun>({
    url: '/admin/payment-reconciliation/runs',
    method: 'POST',
    isAllData: false,
    body: { businessDate },
  })
}

/** 重新查询银联并执行仅基于渠道成功结果的安全补偿。 */
export function recheckAdminPaymentReconciliationItem(id: string) {
  return callApi<AdminPaymentReconciliationItem>({
    url: `/admin/payment-reconciliation/items/${encodeURIComponent(id)}/recheck`,
    method: 'POST',
    isAllData: false,
  })
}

/** 保存管理员线下核查说明并关闭异常告警。 */
export function resolveAdminPaymentReconciliationItem(id: string, note: string) {
  return callApi<AdminPaymentReconciliationItem>({
    url: `/admin/payment-reconciliation/items/${encodeURIComponent(id)}/resolve`,
    method: 'POST',
    isAllData: false,
    body: { note },
  })
}

// ---- 操作审计 ----

/** 查询学生学习产品偏好与操作审计统计，不接收角色参数。 */
export function getBehaviorAnalytics(params: BehaviorAnalyticsParams = {}) {
  return callApi<BehaviorAnalyticsResult>({
    url: '/admin/behavior-analytics',
    method: 'GET',
    isAllData: false,
    params: {
      startAt: params.startAt,
      endAt: params.endAt,
      module: params.module,
    },
  })
}

/** 查询管理员与普通用户的操作审计记录。 */
export function getOperationLogs(params: OperationLogListParams = {}) {
  return callApi<PageResult<OperationLogItem>>({
    url: '/admin/operation-logs',
    method: 'GET',
    isAllData: false,
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
      role: params.role,
      module: params.module,
      result: params.result,
      action: params.action,
      keyword: params.keyword,
      startAt: params.startAt,
      endAt: params.endAt,
    },
  })
}

/** 详情接口按需返回白名单字段的前后值。 */
export function getOperationLogDetail(id: string) {
  return callApi<OperationLogDetail>({
    url: `/admin/operation-logs/${encodeURIComponent(id)}`,
    method: 'GET',
    isAllData: false,
  })
}
