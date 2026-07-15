// 支付订单状态同步服务：集中处理银联查询、并发状态保护与二维码关闭。
import { Prisma, type PaymentOrder } from '@prisma/client'
import { PAYMENT_ORDER_STATUS } from '../constants/domain.js'
import { parseJsonObject } from '../utils/jsonField.js'
import {
  ChinaumsRequestError,
  chinaumsResponseSnapshot,
  closeChinaumsQr,
  formatChinaumsBillDate,
  queryChinaumsBill,
  type ChinaumsBillResponse,
} from './chinaums.js'
import { fulfillPaidOrder } from './paymentFulfillment.js'
import { prisma } from './prisma.js'

type SyncablePaymentOrder = Pick<
  PaymentOrder,
  'id' | 'orderNo' | 'status' | 'providerPayload' | 'createdAt' | 'updatedAt'
>

// Prisma JSON 写入前复制为纯数据，剔除 undefined 等不可持久化值。
function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

// 渠道元数据从首次下单快照读取，历史记录缺少账单日期时回退到订单创建日。
export function paymentProviderMeta(order: Pick<PaymentOrder, 'providerPayload' | 'createdAt'>) {
  const payload = parseJsonObject(order.providerPayload)
  const qrCode = parseJsonObject(payload.qrCode)
  return {
    billDate: typeof qrCode.billDate === 'string'
      ? qrCode.billDate
      : formatChinaumsBillDate(order.createdAt),
    qrCodeId: typeof qrCode.qrCodeId === 'string' ? qrCode.qrCodeId : '',
    systemId: typeof qrCode.systemId === 'string' ? qrCode.systemId : '',
  }
}

// 渠道响应只保留脱敏快照，并与订单已有支付上下文合并。
function mergeProviderResponse(
  existing: unknown,
  key: string,
  response: ChinaumsBillResponse,
): Prisma.InputJsonValue {
  return {
    ...parseJsonObject(existing),
    [key]: {
      receivedAt: new Date().toISOString(),
      response: jsonValue(chinaumsResponseSnapshot(response)),
    },
  } as Prisma.InputJsonValue
}

// 主动查询以银联最终状态为准；条件更新防止旧查询覆盖并发支付通知。
export async function syncPaymentOrderFromChinaums(order: SyncablePaymentOrder) {
  if (
    order.status === PAYMENT_ORDER_STATUS.PAID
    || order.status === PAYMENT_ORDER_STATUS.REFUNDING
    || order.status === PAYMENT_ORDER_STATUS.REFUNDED
  ) {
    return prisma.paymentOrder.findUnique({ where: { id: order.id } })
  }

  const meta = paymentProviderMeta(order)
  const response = await queryChinaumsBill(order.orderNo, meta.billDate)
  if (response.billStatus === 'PAID') {
    return fulfillPaidOrder(order.orderNo, response, 'query')
  }
  if (response.billStatus === 'CLOSED') {
    await prisma.paymentOrder.updateMany({
      where: {
        id: order.id,
        status: { notIn: [
          PAYMENT_ORDER_STATUS.PAID,
          PAYMENT_ORDER_STATUS.REFUNDING,
          PAYMENT_ORDER_STATUS.REFUNDED,
        ] },
      },
      data: {
        status: PAYMENT_ORDER_STATUS.CLOSED,
        closedAt: new Date(),
        providerPayload: mergeProviderResponse(order.providerPayload, 'latestQuery', response),
      },
    })
    return prisma.paymentOrder.findUnique({ where: { id: order.id } })
  }

  await prisma.paymentOrder.updateMany({
    where: {
      id: order.id,
      status: PAYMENT_ORDER_STATUS.PENDING,
      updatedAt: order.updatedAt,
    },
    data: {
      providerPayload: mergeProviderResponse(order.providerPayload, 'latestQuery', response),
    },
  })
  return prisma.paymentOrder.findUnique({ where: { id: order.id } })
}

// 关单前先查询支付状态，避免把已经付款但通知尚未到达的订单误关。
export async function closePaymentOrder(
  order: SyncablePaymentOrder,
  source: 'user' | 'lifecycle',
) {
  const synced = await syncPaymentOrderFromChinaums(order)
  if (!synced) return null
  if (
    synced.status === PAYMENT_ORDER_STATUS.PAID
    || synced.status === PAYMENT_ORDER_STATUS.REFUNDING
    || synced.status === PAYMENT_ORDER_STATUS.REFUNDED
    || synced.status === PAYMENT_ORDER_STATUS.CLOSED
  ) {
    return synced
  }

  const meta = paymentProviderMeta(synced)
  if (!meta.qrCodeId) {
    throw new ChinaumsRequestError('该订单缺少银联商务二维码标识', 'PAYMENT_QR_ID_MISSING')
  }
  const response = await closeChinaumsQr(meta.qrCodeId, meta.systemId)
  await prisma.paymentOrder.updateMany({
    where: {
      id: synced.id,
      status: { notIn: [
        PAYMENT_ORDER_STATUS.PAID,
        PAYMENT_ORDER_STATUS.REFUNDING,
        PAYMENT_ORDER_STATUS.REFUNDED,
        PAYMENT_ORDER_STATUS.CLOSED,
      ] },
    },
    data: {
      status: PAYMENT_ORDER_STATUS.CLOSED,
      closedAt: new Date(),
      providerPayload: mergeProviderResponse(
        synced.providerPayload,
        source === 'user' ? 'closeResponse' : 'lifecycleCloseResponse',
        response,
      ),
    },
  })
  return prisma.paymentOrder.findUnique({ where: { id: synced.id } })
}
