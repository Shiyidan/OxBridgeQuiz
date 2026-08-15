/** 支付策略与用户支付订单 API。 */
import { callApi } from '@/utils/request'
import type { MembershipLegalVersions } from '@/constants/legal'

export interface PaymentConfig {
  firstMonthlyPriceCents: number
  monthlyPriceCents: number
  yearlyPriceCents: number
  status: 'active' | 'inactive'
  providerReady: boolean
  firstMonthlyEligible: boolean
  updatedAt: string
}

export interface PaymentOrder {
  id: string
  orderNo: string
  examTypes: string[]
  plan: 'monthly' | 'yearly' | 'daily_gift' | 'weekly_reward'
  priceType: 'first_monthly' | 'monthly' | 'yearly' | 'admin_gift' | 'invitation_reward'
  amountCents: number
  refundedAmountCents: number
  currency: string
  channel: 'alipay' | 'wechat' | 'unionpay' | 'admin_gift' | 'invitation_reward'
  status: string
  provider: string
  providerOrderNo: string | null
  expiresAt: string
  paidAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentOrderResult {
  order: PaymentOrder
  paymentReady: boolean
  qrCodeUrl: string
  message: string
}

export interface BillingMembershipRecord {
  id: string
  examType: string
  plan: string
  status: string
  startsAt: string
  endsAt: string
  createdAt: string
  updatedAt: string
}

export interface BillingOverview {
  summary: {
    totalSubscriptions: number
    activeEntitlements: number
    totalOrders: number
    netPaidCents: number
    currency: string
    subscribedExamTypes: string[]
  }
  memberships: BillingMembershipRecord[]
  orders: PaymentOrder[]
}

/** 获取支付弹窗使用的最新价格策略。 */
export function getPaymentConfig() {
  return callApi<PaymentConfig>({
    url: '/payment/config',
    method: 'GET',
  })
}

/** 创建支付订单并由后端向银联商务换取一次性聚合支付二维码。 */
export function createPaymentOrder(payload: {
  examTypes: string[]
  plan: 'monthly' | 'yearly'
  channel: 'alipay' | 'wechat' | 'unionpay'
  legalVersions: MembershipLegalVersions
}) {
  return callApi<CreatePaymentOrderResult>({
    url: '/payment/orders',
    method: 'POST',
    body: payload,
  })
}

/** 主动查询银联商务支付状态，作为异步通知之外的前台轮询兜底。 */
export function queryPaymentOrder(orderNo: string) {
  return callApi<PaymentOrder>({
    url: `/payment/orders/${encodeURIComponent(orderNo)}/query`,
    method: 'POST',
  })
}

/** 恢复仍在有效期内的待支付订单及原支付二维码。 */
export function resumePaymentOrder(orderNo: string) {
  return callApi<CreatePaymentOrderResult>({
    url: `/payment/orders/${encodeURIComponent(orderNo)}/resume`,
    method: 'POST',
  })
}

/** 用户取消支付时关闭尚未使用的一次性二维码。 */
export function closePaymentOrder(orderNo: string) {
  return callApi<PaymentOrder>({
    url: `/payment/orders/${encodeURIComponent(orderNo)}/close`,
    method: 'POST',
  })
}

/** 获取当前用户支付订单。 */
export function getMyPaymentOrders() {
  return callApi<PaymentOrder[]>({
    url: '/payment/orders',
    method: 'GET',
  })
}

/** 获取当前用户完整订阅、订单列表及后端汇总。 */
export function getBillingOverview() {
  return callApi<BillingOverview>({
    url: '/payment/records',
    method: 'GET',
  })
}
