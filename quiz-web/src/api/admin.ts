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
  avatar?: string | null
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
  entitlementEndsAt?: number
}

export interface AdminUserIpLocation {
  country: string
  region: string
  city: string
  label: string
}

export type AdminUserActivityModule =
  | 'diagnostic'
  | 'mockExam'
  | 'questionBank'
  | 'mistakeNotebook'

export interface AdminUserCountItem {
  key: AdminUserActivityModule
  label: string
  count: number
  unit: '次' | '道'
}

export interface AdminUserWrongQuestionSubject {
  examType: string
  subject: string
  subjectCode: string | null
  count: number
  difficultyCounts: {
    easy: number
    medium: number
    hard: number
    unknown: number
  }
}

export interface AdminUserRewardCardSummary {
  key: 'dailyGift' | 'inviterWeek' | 'inviteeWeek'
  label: string
  total: number
  pendingCount: number
  activatedCount: number
  expiredCount: number
  revokedCount: number
}

export interface AdminUserAttempt {
  id: string
  examType: string
  status: string
  startedAt: string
  submittedAt: string | null
  accuracy: number | null
  subjects: string[]
  questionBankPractice: {
    mode: 'random' | 'notebook'
    notebookName: string | null
  } | null
  paper: {
    code: string | null
    paperType: string
  }
}

export interface AdminUserDetail {
  profile: UserItem & {
    updatedAt: string
  }
  sourceAndEntitlements: {
    invitation: {
      inviter: {
        id: string
        username: string
      }
      code: string
      bindingSource: string
      boundAt: string
    } | null
    accessLevel: 'admin' | 'member' | 'free'
    memberships: UserMembershipItem[]
    rewardCards: AdminUserRewardCardSummary[]
  }
  loginLocation: AdminUserIpLocation | null
  lastActiveAt: string | null
  overview: {
    moduleAttemptCounts: AdminUserCountItem[]
    selectedModule: AdminUserActivityModule
  }
  wrongQuestionOverview: {
    total: number
    subjects: AdminUserWrongQuestionSubject[]
  }
  attempts: AdminUserAttempt[]
  pagination: PaginationMeta
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

export interface AdminStaffGiftCardStatsItem {
  userId: string
  username: string
  email: string | null
  grantCount: number
  cardCount: number
  usedCardCount: number
  staffCount: number
  staffNames: string[]
  latestGrantedAt: string | null
}

export interface AdminStaffGiftCardStatsResult extends PageResult<AdminStaffGiftCardStatsItem> {
  overview: {
    staffCount: number
    grantCount: number
    cardCount: number
    recipientCount: number
  }
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
  resourceDisplayName?: string | null
  resourceDisplayEmail?: string | null
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

export interface TrafficAnalyticsParams {
  startAt?: string
  endAt?: string
}

export interface TrafficAnalyticsTrendItem {
  date: string
  uniqueIpCount: number
  visitCount: number
  studentVisitCount: number
  anonymousVisitCount: number
  registrationCount: number
}

export interface TrafficRegistrationLocationItem {
  location: string
  registrationCount: number
  percentage: number
}

export interface TrafficAnalyticsResult {
  scope: {
    timezone: 'Asia/Shanghai'
    uniqueIpDefinition: 'period_distinct_hmac'
    visitDefinition: 'daily_distinct_ip'
    visitorClassification: 'authenticated_role'
    registrationRole: 'student'
  }
  period: {
    startAt: string
    endAt: string
    previousStartAt: string
    previousEndAt: string
    endExclusive: true
  }
  overview: {
    uniqueIpCount: number
    uniqueIpChangeRate: number | null
    visitCount: number
    visitCountChangeRate: number | null
    registrationCount: number
    registrationCountChangeRate: number | null
  }
  trend: TrafficAnalyticsTrendItem[]
  locationDistribution: {
    source: 'registration_ip'
    precision: 'country_region'
    totalRegistrationCount: number
    resolvedRegistrationCount: number
    unknownRegistrationCount: number
    items: TrafficRegistrationLocationItem[]
  }
  generatedAt: string
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
  mistakeNotebookViewCount: number
}

export interface BehaviorProductUsage {
  scope: {
    completionSource: 'exam_record'
    reportViewSource: 'operation_log'
    mistakeNotebookViewSource: 'operation_log'
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
    mistakeNotebookViewCount: number
    mistakeNotebookViewChangeRate: number | null
    mistakeNotebookViewerCount: number
    averageMistakeNotebookViews: number
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
  monthlyPriceCents: number
  quarterlyOriginalPriceCents: number
  quarterlyPriceCents: number
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
    associationBasis: 'payment_order'
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

export interface GiftUserCardsPayload {
  cardType: 'daily'
  quantity: number
}

// ---- 成本管理 ----

/** 成本列表 */
export function getRevenueListData(params: ListParams = {}) {
  return callApi<PageResult<RevenueItem>>({
    url: '/admin/revenue-costs/getList',
    method: 'GET',
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
    body: data,
  })
}

/** 新增成本 */
export function createRevenue(data: Partial<RevenueItem>) {
  return callApi<RevenueItem>({
    url: '/admin/revenue-costs',
    method: 'POST',
    body: data,
  })
}

// ---- 用户管理 ----

/** 用户列表 */
export function getUserListData(params: ListParams & { keyword?: string } = {}) {
  return callApi<PageResult<UserItem>>({
    url: '/admin/users',
    method: 'GET',
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
      ...(params.keyword ? { keyword: params.keyword } : {}),
    },
  })
}

/** 按当前管理员汇总成功赠送日卡的次数、张数、用户覆盖和最近发放时间。 */
export function getAdminStaffGiftCardStats(
  params: ListParams & { keyword?: string } = {},
) {
  return callApi<AdminStaffGiftCardStatsResult>({
    url: '/admin/staff/gift-card-stats',
    method: 'GET',
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
      ...(params.keyword ? { keyword: params.keyword } : {}),
    },
  })
}

/** 用户详情按产品模块筛选答题记录，模块总览始终保持全量统计。 */
export function getAdminUserDetailData(
  userId: string,
  params: ListParams & { module?: AdminUserActivityModule } = {},
) {
  return callApi<AdminUserDetail>({
    url: `/admin/users/${encodeURIComponent(userId)}/detail`,
    method: 'GET',
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
      ...(params.module ? { module: params.module } : {}),
    },
  })
}

/** 更新用户角色 */
export function updateUserRole(userId: string, role: string) {
  return callApi<void>({
    url: `/admin/users/${userId}/role`,
    method: 'PUT',
    body: { role },
  })
}

/** 更新用户权限 */
export function updateUserAccess(userId: string, data: UpdateUserAccessPayload) {
  return callApi<{ user: UserItem | null }>({
    url: `/admin/users/${userId}/access`,
    method: 'PUT',
    body: data,
  })
}

/** 向普通用户发放待启用日卡，启用后由后端生成内部支付订单和会员权益。 */
export function giftUserCards(userId: string, data: GiftUserCardsPayload) {
  return callApi<{ createdCount: number; rewardIds: string[]; grantedAt: string }>({
    url: `/admin/users/${encodeURIComponent(userId)}/gift-cards`,
    method: 'POST',
    body: data,
  })
}

// ---- 支付策略与订单 ----

/** 获取后台支付策略。 */
export function getAdminPaymentConfig() {
  return callApi<AdminPaymentConfig>({
    url: '/admin/payment-config',
    method: 'GET',
  })
}

/** 保存后台支付策略，金额单位为分。 */
export function updateAdminPaymentConfig(
  data: Omit<AdminPaymentConfig, 'updatedAt' | 'updatedBy'>,
) {
  return callApi<AdminPaymentConfig>({
    url: '/admin/payment-config',
    method: 'PUT',
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
  })
}

/** 管理员对已支付订单发起全额退款。 */
export function createAdminPaymentRefund(orderNo: string, reason: string) {
  return callApi<AdminPaymentRefund>({
    url: `/admin/payment-orders/${encodeURIComponent(orderNo)}/refunds`,
    method: 'POST',
    body: { reason },
  })
}

/** 主动向银联查询处理中的退款单，并同步最终结果。 */
export function queryAdminPaymentRefund(refundOrderNo: string) {
  return callApi<AdminPaymentRefund>({
    url: `/admin/payment-refunds/${encodeURIComponent(refundOrderNo)}/query`,
    method: 'POST',
  })
}

/** 获取最近对账批次和全站支付异常计数。 */
export function getAdminPaymentReconciliationOverview() {
  return callApi<AdminPaymentReconciliationOverview>({
    url: '/admin/payment-reconciliation/overview',
    method: 'GET',
  })
}

/** 获取对账明细，默认只读取仍待处理的异常。 */
export function getAdminPaymentReconciliationItems(
  params: ListParams & { resolutionStatus?: string } = {},
) {
  return callApi<PageResult<AdminPaymentReconciliationItem>>({
    url: '/admin/payment-reconciliation/items',
    method: 'GET',
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
    body: { businessDate },
  })
}

/** 重新查询银联并执行仅基于渠道成功结果的安全补偿。 */
export function recheckAdminPaymentReconciliationItem(id: string) {
  return callApi<AdminPaymentReconciliationItem>({
    url: `/admin/payment-reconciliation/items/${encodeURIComponent(id)}/recheck`,
    method: 'POST',
  })
}

/** 保存管理员线下核查说明并关闭异常告警。 */
export function resolveAdminPaymentReconciliationItem(id: string, note: string) {
  return callApi<AdminPaymentReconciliationItem>({
    url: `/admin/payment-reconciliation/items/${encodeURIComponent(id)}/resolve`,
    method: 'POST',
    body: { note },
  })
}

// ---- 操作审计 ----

/** 查询匿名网站访问与学生注册趋势，按北京时间自然日聚合。 */
export function getTrafficAnalytics(params: TrafficAnalyticsParams = {}) {
  return callApi<TrafficAnalyticsResult>({
    url: '/admin/traffic-analytics',
    method: 'GET',
    silent: true,
    params: {
      startAt: params.startAt,
      endAt: params.endAt,
    },
  })
}

/** 查询学生学习产品偏好与操作审计统计，不接收角色参数。 */
export function getBehaviorAnalytics(params: BehaviorAnalyticsParams = {}) {
  return callApi<BehaviorAnalyticsResult>({
    url: '/admin/behavior-analytics',
    method: 'GET',
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
  })
}
