// 支付履约服务：以银联商务查询结果为准，幂等更新订单并创建或延长会员权益。
import { Prisma } from '@prisma/client'
import {
  MEMBERSHIP_PLAN,
  MEMBERSHIP_STATUS,
  PAYMENT_ORDER_STATUS,
} from '../constants/domain.js'
import { parseJsonArray, parseJsonObject } from '../utils/jsonField.js'
import { prisma } from './prisma.js'
import { chinaumsResponseSnapshot, type ChinaumsBillResponse } from './chinaums.js'

export class PaymentFulfillmentError extends Error {
  constructor(message: string, readonly code: string) {
    super(message)
    this.name = 'PaymentFulfillmentError'
  }
}

function extendMembership(plan: string, start: Date): Date {
  const end = new Date(start)
  if (plan === MEMBERSHIP_PLAN.YEARLY) end.setFullYear(end.getFullYear() + 1)
  else end.setMonth(end.getMonth() + 1)
  return end
}

function paymentTimeFromProvider(value: unknown): Date {
  if (typeof value !== 'string') return new Date()
  const parsed = new Date(value.replace(' ', 'T') + '+08:00')
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function mergeProviderPayload(existing: unknown, source: string, response: ChinaumsBillResponse): Prisma.InputJsonValue {
  return {
    ...parseJsonObject(existing),
    latestConfirmation: {
      source,
      confirmedAt: new Date().toISOString(),
      response: JSON.parse(JSON.stringify(chinaumsResponseSnapshot(response))),
    },
  } as Prisma.InputJsonValue
}

export async function fulfillPaidOrder(
  orderNo: string,
  response: ChinaumsBillResponse,
  source: 'notification' | 'query',
) {
  if (response.errCode !== 'SUCCESS' || response.billStatus !== 'PAID') {
    throw new PaymentFulfillmentError('银联商务尚未确认该订单支付成功', 'PAYMENT_NOT_PAID')
  }
  const payment = response.billPayment
  if (payment?.status && payment.status !== 'TRADE_SUCCESS') {
    throw new PaymentFulfillmentError('银联商务支付流水不是成功状态', 'PAYMENT_TRADE_NOT_SUCCESS')
  }

  return prisma.$transaction(async (tx) => {
    const order = await tx.paymentOrder.findUnique({ where: { orderNo } })
    if (!order) throw new PaymentFulfillmentError('本地支付订单不存在', 'PAYMENT_ORDER_NOT_FOUND')

    const providerAmount = Number(response.totalAmount ?? payment?.totalAmount)
    if (!Number.isInteger(providerAmount) || providerAmount !== order.amountCents) {
      throw new PaymentFulfillmentError('银联商务返回金额与本地订单金额不一致', 'PAYMENT_AMOUNT_MISMATCH')
    }

    if ([PAYMENT_ORDER_STATUS.PAID, PAYMENT_ORDER_STATUS.REFUNDING, PAYMENT_ORDER_STATUS.REFUNDED].includes(order.status as any)) {
      return order
    }

    const updated = await tx.paymentOrder.updateMany({
      where: {
        id: order.id,
        status: { notIn: [PAYMENT_ORDER_STATUS.PAID, PAYMENT_ORDER_STATUS.REFUNDING, PAYMENT_ORDER_STATUS.REFUNDED] },
      },
      data: {
        status: PAYMENT_ORDER_STATUS.PAID,
        providerOrderNo: payment?.targetOrderId || payment?.merOrderId || order.providerOrderNo,
        providerPayload: mergeProviderPayload(order.providerPayload, source, response),
        failureCode: null,
        failureMessage: null,
        paidAt: paymentTimeFromProvider(payment?.payTime),
        closedAt: null,
      },
    })
    if (updated.count === 0) return tx.paymentOrder.findUnique({ where: { id: order.id } })

    const now = new Date()
    const examTypes = [...new Set(parseJsonArray<string>(order.examTypes))]
    for (const examType of examTypes) {
      const active = await tx.userMembership.findFirst({
        where: {
          userId: order.userId,
          examType,
          status: MEMBERSHIP_STATUS.ACTIVE,
          endsAt: { gt: now },
        },
        orderBy: { endsAt: 'desc' },
      })
      if (active) {
        await tx.userMembership.update({
          where: { id: active.id },
          data: { plan: order.plan, endsAt: extendMembership(order.plan, active.endsAt) },
        })
      } else {
        await tx.userMembership.create({
          data: {
            userId: order.userId,
            examType,
            plan: order.plan,
            status: MEMBERSHIP_STATUS.ACTIVE,
            startsAt: now,
            endsAt: extendMembership(order.plan, now),
          },
        })
      }
    }
    return tx.paymentOrder.findUnique({ where: { id: order.id } })
  })
}
