// 银联商务 C扫B 聚合支付适配器：统一处理双环境地址、OPEN-BODY-SIG 认证和通知验签。
import crypto from 'crypto'
import { config } from '../config.js'
import { createChinaumsAuthorizationHeader } from './chinaumsSignature.js'
import { verifyChinaumsNotificationSignature } from './chinaumsNotificationSignature.js'

export { normalizeChinaumsNotification } from './chinaumsNotificationSignature.js'
export { resolveChinaumsPaymentChannel } from './chinaumsChannel.js'

type ChinaumsPayload = Record<string, unknown>

export interface ChinaumsBillPayment {
  status?: string
  targetOrderId?: string
  targetSys?: string
  payTime?: string
  totalAmount?: number | string
  buyerPayAmount?: number | string
  merOrderId?: string
}

export interface ChinaumsRefundPayment extends ChinaumsBillPayment {
  refundOrderId?: string
  refundAmount?: number | string
  refundPayTime?: string
}

export interface ChinaumsBillResponse extends ChinaumsPayload {
  errCode?: string
  errMsg?: string
  billNo?: string
  billDate?: string
  billStatus?: string
  billQRCode?: string
  qrCodeId?: string
  systemId?: string
  connectSys?: string
  targetSys?: string
  totalAmount?: number | string
  billPayment?: ChinaumsBillPayment
  refundOrderId?: string
  refundTargetOrderId?: string
  refundPayTime?: string
  refundStatus?: string
  refundAmount?: number | string
  refundBillPayment?: ChinaumsRefundPayment
}

export function chinaumsResponseSnapshot(response: ChinaumsBillResponse): ChinaumsBillResponse {
  const payment = response.billPayment
  const refundPayment = response.refundBillPayment
  return {
    errCode: response.errCode,
    errMsg: response.errMsg,
    billNo: response.billNo,
    billDate: response.billDate,
    billStatus: response.billStatus,
    billQRCode: response.billQRCode,
    qrCodeId: response.qrCodeId,
    systemId: response.systemId,
    connectSys: response.connectSys,
    targetSys: response.targetSys,
    totalAmount: response.totalAmount,
    refundOrderId: response.refundOrderId,
    refundTargetOrderId: response.refundTargetOrderId,
    refundPayTime: response.refundPayTime,
    refundStatus: response.refundStatus,
    refundAmount: response.refundAmount,
    ...(payment
      ? {
          billPayment: {
            status: payment.status,
            targetOrderId: payment.targetOrderId,
            targetSys: payment.targetSys,
            payTime: payment.payTime,
            totalAmount: payment.totalAmount,
            buyerPayAmount: payment.buyerPayAmount,
            merOrderId: payment.merOrderId,
          },
        }
      : {}),
    ...(refundPayment
      ? {
          refundBillPayment: {
            status: refundPayment.status,
            targetOrderId: refundPayment.targetOrderId,
            targetSys: refundPayment.targetSys,
            payTime: refundPayment.payTime,
            totalAmount: refundPayment.totalAmount,
            buyerPayAmount: refundPayment.buyerPayAmount,
            merOrderId: refundPayment.merOrderId,
            refundOrderId: refundPayment.refundOrderId,
            refundAmount: refundPayment.refundAmount,
            refundPayTime: refundPayment.refundPayTime,
          },
        }
      : {}),
  }
}

export class ChinaumsRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly response?: ChinaumsBillResponse,
  ) {
    super(message)
    this.name = 'ChinaumsRequestError'
  }
}

const chinaTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function chinaTimeParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    chinaTimeFormatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
}

export function formatChinaumsDateTime(date = new Date()): string {
  const part = chinaTimeParts(date)
  return `${part.year}-${part.month}-${part.day} ${part.hour}:${part.minute}:${part.second}`
}

export function formatChinaumsBillDate(date = new Date()): string {
  const part = chinaTimeParts(date)
  return `${part.year}-${part.month}-${part.day}`
}

function formatAuthorizationTimestamp(date = new Date()): string {
  const part = chinaTimeParts(date)
  return `${part.year}${part.month}${part.day}${part.hour}${part.minute}${part.second}`
}

// 新商户微信通道会在 billNo 后追加一位生成 merOrderId，因此暂将账单号控制为 27 字节兼容其 28 字节限制。
export function createChinaumsOrderNo(date = new Date()): string {
  if (!config.chinaums.msgSrcId) {
    throw new ChinaumsRequestError('银联商务来源编号尚未配置', 'PAYMENT_PROVIDER_NOT_CONFIGURED')
  }
  const part = chinaTimeParts(date)
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
  const timestamp = `${part.year}${part.month}${part.day}${part.hour}${part.minute}${part.second}${milliseconds}`
  const random = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  return `${config.chinaums.msgSrcId}${timestamp}${random}`
}

export function createChinaumsAuthorization(body: string, date = new Date(), nonce = crypto.randomUUID().replace(/-/g, '')): string {
  const timestamp = formatAuthorizationTimestamp(date)
  return createChinaumsAuthorizationHeader({
    appId: config.chinaums.appId,
    appKey: config.chinaums.appKey,
    body,
    timestamp,
    nonce,
  })
}

function commonPayload(): ChinaumsPayload {
  return {
    requestTimestamp: formatChinaumsDateTime(),
    mid: config.chinaums.mid,
    tid: config.chinaums.tid,
    instMid: config.chinaums.instMid,
  }
}

async function postChinaums(path: string, payload: ChinaumsPayload): Promise<ChinaumsBillResponse> {
  if (!config.chinaums.enabled) {
    throw new ChinaumsRequestError('银联商务参数尚未启用', 'PAYMENT_PROVIDER_NOT_CONFIGURED')
  }
  const body = JSON.stringify(payload)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), config.chinaums.timeoutMs)
  try {
    const response = await fetch(`${config.chinaums.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        Authorization: createChinaumsAuthorization(body),
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json',
      },
      body,
      signal: controller.signal,
    })
    const text = await response.text()
    let result: ChinaumsBillResponse
    try {
      result = JSON.parse(text) as ChinaumsBillResponse
    } catch {
      throw new ChinaumsRequestError(`银联商务返回了无法解析的响应（HTTP ${response.status}）`, 'CHINAUMS_INVALID_RESPONSE')
    }
    if (!response.ok || result.errCode !== 'SUCCESS') {
      throw new ChinaumsRequestError(
        result.errMsg || `银联商务请求失败（HTTP ${response.status}）`,
        result.errCode || `HTTP_${response.status}`,
        result,
      )
    }
    return result
  } catch (error) {
    if (error instanceof ChinaumsRequestError) throw error
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ChinaumsRequestError('银联商务请求超时，请稍后查询订单状态', 'CHINAUMS_TIMEOUT')
    }
    throw new ChinaumsRequestError(
      error instanceof Error ? error.message : '银联商务网络请求失败',
      'CHINAUMS_NETWORK_ERROR',
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function createChinaumsQr(input: {
  orderNo: string
  amountCents: number
  expiresAt: Date
  description?: string
}): Promise<ChinaumsBillResponse> {
  const createdAt = new Date()
  return postChinaums('/v1/netpay/bills/get-qrcode', {
    ...commonPayload(),
    billNo: input.orderNo,
    billDate: formatChinaumsBillDate(createdAt),
    billDesc: (input.description || config.chinaums.orderDescription).slice(0, 128),
    totalAmount: input.amountCents,
    expireTime: formatChinaumsDateTime(input.expiresAt),
    ...(config.chinaums.notifyUrl ? { notifyUrl: config.chinaums.notifyUrl } : {}),
    ...(config.chinaums.returnUrl ? { returnUrl: config.chinaums.returnUrl } : {}),
    walletOption: 'MULTIPLE',
    attachedData: input.orderNo,
  })
}

export function queryChinaumsBill(orderNo: string, billDate: string): Promise<ChinaumsBillResponse> {
  return postChinaums('/v1/netpay/bills/query', {
    ...commonPayload(),
    billNo: orderNo,
    billDate,
  })
}

export function refundChinaumsBill(input: {
  orderNo: string
  billDate: string
  refundOrderNo: string
  amountCents: number
  description: string
}): Promise<ChinaumsBillResponse> {
  return postChinaums('/v1/netpay/bills/refund', {
    ...commonPayload(),
    billNo: input.orderNo,
    billDate: input.billDate,
    refundOrderId: input.refundOrderNo,
    refundAmount: input.amountCents,
    refundDesc: input.description.slice(0, 255),
  })
}

export function queryChinaumsRefund(input: {
  orderNo: string
  billDate: string
  refundOrderNo: string
}): Promise<ChinaumsBillResponse> {
  return postChinaums('/v1/netpay/bills/query', {
    ...commonPayload(),
    billNo: input.orderNo,
    billDate: input.billDate,
    refundOrderId: input.refundOrderNo,
  })
}

export function closeChinaumsQr(qrCodeId: string, systemId?: string): Promise<ChinaumsBillResponse> {
  return postChinaums('/v1/netpay/bills/close-qrcode', {
    ...commonPayload(),
    qrCodeId,
    ...(systemId ? { systemId } : {}),
    attachRefund: false,
  })
}

export function verifyChinaumsNotification(payload: Record<string, unknown>): boolean {
  return verifyChinaumsNotificationSignature(payload, config.chinaums.communicationKey)
}
