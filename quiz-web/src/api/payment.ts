/** 支付策略与用户支付订单 API。 */
import { callApi } from '@/utils/request'

export interface PaymentConfig {
  firstMonthlyPriceCents: number
  monthlyPriceCents: number
  yearlyPriceCents: number
  status: 'active' | 'inactive'
  providerReady: boolean
  updatedAt: string
}

export interface PaymentOrder {
  id: string
  orderNo: string
  examTypes: string[]
  plan: 'monthly' | 'yearly'
  priceType: 'first_monthly' | 'monthly' | 'yearly'
  amountCents: number
  currency: string
  channel: 'alipay' | 'wechat' | 'unionpay'
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
