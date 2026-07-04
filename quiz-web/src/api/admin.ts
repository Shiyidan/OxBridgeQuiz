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

export interface UserListParams {
  page?: number
  pageSize?: number
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
export function getRevenueListData() {
  return callApi<{ costs: RevenueItem[] }>({
    url: '/admin/revenue-costs/getList',
    method: 'GET',
    isAllData: false,
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
export function getUserListData(params: UserListParams = {}) {
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
