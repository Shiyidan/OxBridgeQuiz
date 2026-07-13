/**
 * 管理后台 相关 API
 */
import { callApi } from '@/utils/request'

export interface RevenueItem {
  id: string
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
  currency: string
  channel: string
  status: string
  provider: string
  providerOrderNo?: string | null
  expiresAt: string
  paidAt?: string | null
  createdAt: string
  user: { username: string; email: string }
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
export function updateAdminPaymentConfig(data: Omit<AdminPaymentConfig, 'updatedAt' | 'updatedBy'>) {
  return callApi<AdminPaymentConfig>({
    url: '/admin/payment-config',
    method: 'PUT',
    isAllData: false,
    body: data,
  })
}

/** 查询支付订单。 */
export function getAdminPaymentOrders(params: ListParams & { status?: string } = {}) {
  return callApi<PageResult<AdminPaymentOrder>>({
    url: '/admin/payment-orders',
    method: 'GET',
    isAllData: false,
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
      status: params.status,
    },
  })
}
