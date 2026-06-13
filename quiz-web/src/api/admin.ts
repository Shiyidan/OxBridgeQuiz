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
  name: string
  email: string
  role: string
  paymentStatus: string
  diagnosticUsed?: boolean
  createdAt: string
}

// ---- 成本管理 ----

/** 成本列表 */
export function getRevenueListData() {
  return callApi<RevenueItem[]>({
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
export function getUserListData() {
  return callApi<UserItem[]>({
    url: '/admin/users',
    method: 'GET',
    isAllData: false,
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
