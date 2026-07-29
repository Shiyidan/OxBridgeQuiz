// 银联商务实际支付钱包识别：将渠道 targetSys 映射为系统统一的支付渠道值。
import { PAYMENT_CHANNEL, type PaymentChannel } from '../constants/domain.js'

type ChinaumsChannelResponse = {
  targetSys?: unknown
  connectSys?: unknown
  billPayment?: { targetSys?: unknown }
}

// connectSys 在支付宝示例中也可能是 UNIONPAY，因此实际钱包只读取 targetSys。
export function resolveChinaumsPaymentChannel(response: ChinaumsChannelResponse): PaymentChannel | undefined {
  const source = [
    response.billPayment?.targetSys,
    response.targetSys,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase()
  if (/alipay|支付宝/.test(source)) return PAYMENT_CHANNEL.ALIPAY
  if (/wechat|wxpay|微信/.test(source)) return PAYMENT_CHANNEL.WECHAT
  if (/unionpay|云闪付|银联/.test(source)) return PAYMENT_CHANNEL.UNIONPAY
  return undefined
}
