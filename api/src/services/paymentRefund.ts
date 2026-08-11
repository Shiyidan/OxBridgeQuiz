// 支付退款服务：管理全额退款状态、银联结果确认与会员权益回收。
import { Prisma } from '@prisma/client'
import {
  MEMBERSHIP_PLAN,
  MEMBERSHIP_SOURCE,
  MEMBERSHIP_STATUS,
  PAYMENT_ORDER_STATUS,
  PAYMENT_REFUND_STATUS,
} from '../constants/domain.js'
import { parseJsonArray, parseJsonObject } from '../utils/jsonField.js'
import {
  ChinaumsRequestError,
  chinaumsResponseSnapshot,
  createChinaumsOrderNo,
  formatChinaumsBillDate,
  queryChinaumsRefund,
  refundChinaumsBill,
  type ChinaumsBillResponse,
} from './chinaums.js'
import { prisma } from './prisma.js'
import { revokeInvitationRewardsForPaymentOrder } from './invitation.js'

export class PaymentRefundError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly httpStatus = 409,
  ) {
    super(message)
    this.name = 'PaymentRefundError'
  }
}

type RefundableOrder = {
  id: string
  orderNo: string
  userId: string
  examTypes: unknown
  plan: string
  amountCents: number
  refundedAmountCents: number
  status: string
  providerPayload: unknown
  createdAt: Date
}

function refundProviderMeta(order: RefundableOrder): { billDate: string } {
  const payload = parseJsonObject(order.providerPayload)
  const qrCode = parseJsonObject(payload.qrCode)
  return {
    billDate: typeof qrCode.billDate === 'string'
      ? qrCode.billDate
      : formatChinaumsBillDate(order.createdAt),
  }
}

function refundResponsePayload(response: ChinaumsBillResponse): Prisma.InputJsonValue {
  return {
    response: JSON.parse(JSON.stringify(chinaumsResponseSnapshot(response))),
    receivedAt: new Date().toISOString(),
  } as Prisma.InputJsonValue
}

function refundSucceeded(response: ChinaumsBillResponse): boolean {
  const status = String(
    response.refundStatus
      || response.refundBillPayment?.status
      || '',
  ).toUpperCase()
  return status === 'SUCCESS'
    || status === 'TRADE_SUCCESS'
    || (response.billStatus === 'REFUND' && status !== 'FAIL' && status !== 'FAILED')
}

function refundProviderOrderNo(response: ChinaumsBillResponse): string | null {
  return response.refundTargetOrderId
    || response.refundBillPayment?.targetOrderId
    || null
}

function refundPaidAt(response: ChinaumsBillResponse): Date {
  const value = response.refundPayTime || response.refundBillPayment?.refundPayTime
  if (!value) return new Date()
  const parsed = new Date(value.replace(' ', 'T') + '+08:00')
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function subtractPlanDuration(plan: string, value: Date): Date {
  const result = new Date(value)
  if (plan === MEMBERSHIP_PLAN.YEARLY) result.setFullYear(result.getFullYear() - 1)
  else result.setMonth(result.getMonth() - 1)
  return result
}

async function revertOrderMemberships(
  tx: Prisma.TransactionClient,
  order: RefundableOrder,
  refundedAt: Date,
): Promise<void> {
  const examTypes = [...new Set(parseJsonArray<string>(order.examTypes))]
  for (const examType of examTypes) {
    const orderMembership = await tx.userMembership.findFirst({
      where: { paymentOrderId: order.id, examType },
    })
    if (orderMembership) {
      await tx.userMembership.update({
        where: { id: orderMembership.id },
        data: {
          status: MEMBERSHIP_STATUS.CANCELLED,
          ...(orderMembership.startsAt <= refundedAt && orderMembership.endsAt > refundedAt
            ? { endsAt: refundedAt }
            : {}),
        },
      })
      continue
    }

    // 历史订单没有来源关联时保留旧版时长回退，但明确排除邀请赠送权益。
    const membership = await tx.userMembership.findFirst({
      where: {
        userId: order.userId,
        examType,
        status: MEMBERSHIP_STATUS.ACTIVE,
        NOT: { sourceType: MEMBERSHIP_SOURCE.INVITATION_REWARD },
      },
      orderBy: { endsAt: 'desc' },
    })
    if (!membership) continue

    const restoredEndsAt = subtractPlanDuration(order.plan, membership.endsAt)
    if (restoredEndsAt <= refundedAt || restoredEndsAt <= membership.startsAt) {
      await tx.userMembership.update({
        where: { id: membership.id },
        data: {
          status: MEMBERSHIP_STATUS.CANCELLED,
          endsAt: refundedAt,
        },
      })
    } else {
      await tx.userMembership.update({
        where: { id: membership.id },
        data: { endsAt: restoredEndsAt },
      })
    }
  }
}

async function finalizeRefund(
  refundOrderNo: string,
  response: ChinaumsBillResponse,
) {
  if (!refundSucceeded(response)) {
    throw new PaymentRefundError('银联商务尚未确认退款成功', 'PAYMENT_REFUND_NOT_CONFIRMED', 202)
  }
  const refundedAt = refundPaidAt(response)
  return prisma.$transaction(async (tx) => {
    const refund = await tx.paymentRefund.findUnique({
      where: { refundOrderNo },
      include: { paymentOrder: true },
    })
    if (!refund) throw new PaymentRefundError('本地退款单不存在', 'PAYMENT_REFUND_NOT_FOUND', 404)
    if (refund.status === PAYMENT_REFUND_STATUS.SUCCEEDED) return refund
    const providerAmount = Number(
      response.refundAmount
        ?? response.refundBillPayment?.refundAmount
        ?? response.refundBillPayment?.totalAmount,
    )
    if (!Number.isInteger(providerAmount) || providerAmount !== refund.amountCents) {
      throw new PaymentRefundError('银联商务退款金额与本地退款单不一致', 'PAYMENT_REFUND_AMOUNT_MISMATCH')
    }

    const order = refund.paymentOrder
    await revertOrderMemberships(tx, order, refundedAt)
    await revokeInvitationRewardsForPaymentOrder(tx, order.id, refundedAt)
    await tx.paymentOrder.update({
      where: { id: order.id },
      data: {
        status: PAYMENT_ORDER_STATUS.REFUNDED,
        refundedAmountCents: refund.amountCents,
      },
    })
    return tx.paymentRefund.update({
      where: { id: refund.id },
      data: {
        status: PAYMENT_REFUND_STATUS.SUCCEEDED,
        providerRefundNo: refundProviderOrderNo(response),
        providerPayload: refundResponsePayload(response),
        failureCode: null,
        failureMessage: null,
        refundedAt,
      },
    })
  })
}

async function markDefiniteRefundFailure(
  refundOrderNo: string,
  error: ChinaumsRequestError,
): Promise<void> {
  if (['CHINAUMS_TIMEOUT', 'CHINAUMS_NETWORK_ERROR'].includes(error.code)) return
  await prisma.$transaction([
    prisma.paymentRefund.update({
      where: { refundOrderNo },
      data: {
        status: PAYMENT_REFUND_STATUS.FAILED,
        failureCode: error.code.slice(0, 64),
        failureMessage: error.message.slice(0, 500),
        ...(error.response ? { providerPayload: refundResponsePayload(error.response) } : {}),
      },
    }),
    prisma.paymentOrder.updateMany({
      where: { refunds: { some: { refundOrderNo } }, status: PAYMENT_ORDER_STATUS.REFUNDING },
      data: { status: PAYMENT_ORDER_STATUS.PAID },
    }),
  ])
}

export async function requestFullPaymentRefund(input: {
  orderNo: string
  operatorId: string
  reason: string
}) {
  const prepared = await prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUnique({ where: { orderNo: input.orderNo } })
    if (!order) throw new PaymentRefundError('支付订单不存在', 'PAYMENT_ORDER_NOT_FOUND', 404)
    if (order.status === PAYMENT_ORDER_STATUS.REFUNDED) {
      const succeeded = await tx.paymentRefund.findFirst({
        where: { paymentOrderId: order.id, status: PAYMENT_REFUND_STATUS.SUCCEEDED },
        orderBy: { createdAt: 'desc' },
      })
      if (succeeded) return { order, refund: succeeded, shouldSubmit: false }
    }
    if (order.status !== PAYMENT_ORDER_STATUS.PAID) {
      throw new PaymentRefundError('仅已支付订单可以发起退款', 'PAYMENT_ORDER_NOT_REFUNDABLE')
    }
    if (order.refundedAmountCents > 0) {
      throw new PaymentRefundError('该订单已存在退款金额', 'PAYMENT_ORDER_ALREADY_REFUNDED')
    }
    const laterPaidOrder = await tx.paymentOrder.findFirst({
      where: {
        userId: order.userId,
        createdAt: { gt: order.createdAt },
        status: { in: [PAYMENT_ORDER_STATUS.PAID, PAYMENT_ORDER_STATUS.REFUNDING] },
      },
      select: { id: true },
    })
    if (laterPaidOrder) {
      throw new PaymentRefundError(
        '该用户存在后续有效支付订单，请人工确认权益后再退款',
        'PAYMENT_REFUND_REQUIRES_MANUAL_REVIEW',
      )
    }
    const existing = await tx.paymentRefund.findFirst({
      where: {
        paymentOrderId: order.id,
        status: { in: [PAYMENT_REFUND_STATUS.PROCESSING, PAYMENT_REFUND_STATUS.SUCCEEDED] },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (existing) return { order, refund: existing, shouldSubmit: false }

    const refund = await tx.paymentRefund.create({
      data: {
        refundOrderNo: createChinaumsOrderNo(),
        paymentOrderId: order.id,
        amountCents: order.amountCents,
        reason: input.reason.slice(0, 255),
        status: PAYMENT_REFUND_STATUS.PROCESSING,
        operatorId: input.operatorId,
      },
    })
    const updated = await tx.paymentOrder.updateMany({
      where: { id: order.id, status: PAYMENT_ORDER_STATUS.PAID },
      data: { status: PAYMENT_ORDER_STATUS.REFUNDING },
    })
    if (updated.count !== 1) {
      throw new PaymentRefundError('支付订单状态已变化，请刷新后重试', 'PAYMENT_ORDER_STATUS_CHANGED')
    }
    return { order, refund, shouldSubmit: true }
  })

  if (!prepared.shouldSubmit) {
    if (prepared.refund.status === PAYMENT_REFUND_STATUS.PROCESSING) {
      return refreshPaymentRefund(prepared.refund.refundOrderNo)
    }
    return prepared.refund
  }

  const meta = refundProviderMeta(prepared.order)
  try {
    const response = await refundChinaumsBill({
      orderNo: prepared.order.orderNo,
      billDate: meta.billDate,
      refundOrderNo: prepared.refund.refundOrderNo,
      amountCents: prepared.refund.amountCents,
      description: input.reason,
    })
    if (!refundSucceeded(response)) {
      return prisma.paymentRefund.update({
        where: { id: prepared.refund.id },
        data: { providerPayload: refundResponsePayload(response) },
      })
    }
    return finalizeRefund(prepared.refund.refundOrderNo, response)
  } catch (error) {
    if (error instanceof ChinaumsRequestError) {
      await markDefiniteRefundFailure(prepared.refund.refundOrderNo, error)
    }
    throw error
  }
}

export async function refreshPaymentRefund(refundOrderNo: string) {
  const refund = await prisma.paymentRefund.findUnique({
    where: { refundOrderNo },
    include: { paymentOrder: true },
  })
  if (!refund) throw new PaymentRefundError('退款单不存在', 'PAYMENT_REFUND_NOT_FOUND', 404)
  if (refund.status !== PAYMENT_REFUND_STATUS.PROCESSING) return refund
  const meta = refundProviderMeta(refund.paymentOrder)
  const response = await queryChinaumsRefund({
    orderNo: refund.paymentOrder.orderNo,
    billDate: meta.billDate,
    refundOrderNo,
  })
  if (!refundSucceeded(response)) {
    return prisma.paymentRefund.update({
      where: { id: refund.id },
      data: { providerPayload: refundResponsePayload(response) },
    })
  }
  return finalizeRefund(refundOrderNo, response)
}
