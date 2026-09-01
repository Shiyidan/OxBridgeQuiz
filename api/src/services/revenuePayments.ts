// 真实支付营收服务：统一排除赠送权益，并汇总付费用户、订单和退款后的净营收。
import type { Prisma } from '@prisma/client'
import { MEMBERSHIP_PLAN, PAYMENT_ORDER_STATUS, PAYMENT_PRICE_TYPE } from '../constants/domain.js'
import { prisma } from './prisma.js'
import { parseJsonArray } from '../utils/jsonField.js'

export const REAL_PAYMENT_STATUSES = [
  PAYMENT_ORDER_STATUS.PAID,
  PAYMENT_ORDER_STATUS.REFUNDING,
  PAYMENT_ORDER_STATUS.REFUNDED,
] as const

export const REAL_PAYMENT_PRICE_TYPES = [
  PAYMENT_PRICE_TYPE.MONTHLY,
  PAYMENT_PRICE_TYPE.QUARTERLY,
] as const

export const REVENUE_DETAIL_PAYMENT_STATUSES = [
  PAYMENT_ORDER_STATUS.PAID,
  PAYMENT_ORDER_STATUS.REFUNDING,
] as const

export interface RevenuePaymentOverview {
  paidUserCount: number
  paidOrderCount: number
  grossRevenueCents: number
  refundedAmountCents: number
  netRevenueCents: number
  totalCostCents: number
  costRecordCount: number
  costExcludingReimbursedCents: number
  monthlyOrderCount: number
  quarterlyOrderCount: number
}

// 月卡和季卡是当前唯一真实付费商品，内部赠送日卡与邀请奖励不进入营收口径。
export function realPaymentOrderWhere(): Prisma.PaymentOrderWhereInput {
  return {
    priceType: { in: [...REAL_PAYMENT_PRICE_TYPES] },
    status: { in: [...REAL_PAYMENT_STATUSES] },
    amountCents: { gt: 0 },
  }
}

// 营收明细只展示仍产生净收入的订单，已完成退款的订单仅参与退款扣减。
export function revenueDetailOrderWhere(): Prisma.PaymentOrderWhereInput {
  return {
    ...realPaymentOrderWhere(),
    status: { in: [...REVENUE_DETAIL_PAYMENT_STATUSES] },
  }
}

// 未报销成本明确排除已完成报销的记录，其余报销状态均保留。
export function costExcludingReimbursedWhere(): Prisma.RevenueCostWhereInput {
  return {
    reimbursementStatus: { not: 'reimbursed' },
  }
}

// 净营收不能低于零，兼容渠道或历史数据中退款累计值异常大于订单金额的情况。
export function calculateNetRevenueCents(
  grossRevenueCents: number,
  refundedAmountCents: number,
): number {
  return Math.max(0, grossRevenueCents - refundedAmountCents)
}

// 成本表以元存储，进入营收看板前统一转换为分并规避浮点尾差。
export function yuanAmountToCents(amount: number): number {
  return Math.max(0, Math.round(amount * 100))
}

// 营收接口一次返回全量汇总和当前页明细，保证看板不受分页影响。
export async function getRevenuePayments(input: { page: number; pageSize: number }) {
  const allPaidWhere = realPaymentOrderWhere()
  const detailWhere = revenueDetailOrderWhere()
  const [
    paidOrderCount,
    totals,
    paidUsers,
    planCounts,
    costTotals,
    costExcludingReimbursedTotals,
  ] = await Promise.all([
    prisma.paymentOrder.count({ where: detailWhere }),
    prisma.paymentOrder.aggregate({
      where: allPaidWhere,
      _sum: { amountCents: true, refundedAmountCents: true },
    }),
    prisma.paymentOrder.findMany({
      where: detailWhere,
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.paymentOrder.groupBy({
      by: ['plan'],
      where: detailWhere,
      _count: { _all: true },
    }),
    prisma.revenueCost.aggregate({
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.revenueCost.aggregate({
      where: costExcludingReimbursedWhere(),
      _sum: { amount: true },
    }),
  ])
  const totalPages = Math.ceil(paidOrderCount / input.pageSize)
  const safePage = totalPages > 0 ? Math.min(input.page, totalPages) : 1
  const list = await prisma.paymentOrder.findMany({
    where: detailWhere,
    include: { user: { select: { id: true, username: true, email: true } } },
    orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    skip: (safePage - 1) * input.pageSize,
    take: input.pageSize,
  })
  const grossRevenueCents = totals._sum.amountCents || 0
  const refundedAmountCents = totals._sum.refundedAmountCents || 0
  // 套餐订单数从同一真实支付范围内分组读取，避免与总订单口径不一致。
  const orderCountForPlan = (plan: string) =>
    planCounts.find((item) => item.plan === plan)?._count._all || 0

  const overview: RevenuePaymentOverview = {
    paidUserCount: paidUsers.length,
    paidOrderCount,
    grossRevenueCents,
    refundedAmountCents,
    netRevenueCents: calculateNetRevenueCents(grossRevenueCents, refundedAmountCents),
    totalCostCents: yuanAmountToCents(costTotals._sum.amount || 0),
    costRecordCount: costTotals._count._all,
    costExcludingReimbursedCents: yuanAmountToCents(
      costExcludingReimbursedTotals._sum.amount || 0,
    ),
    monthlyOrderCount: orderCountForPlan(MEMBERSHIP_PLAN.MONTHLY),
    quarterlyOrderCount: orderCountForPlan(MEMBERSHIP_PLAN.QUARTERLY),
  }

  return {
    overview,
    list: list.map(({ providerPayload: _providerPayload, ...order }) => ({
      ...order,
      examTypes: parseJsonArray<string>(order.examTypes),
      paidAt: order.paidAt?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      expiresAt: order.expiresAt.toISOString(),
      closedAt: order.closedAt?.toISOString() || null,
    })),
    pagination: {
      page: safePage,
      pageSize: input.pageSize,
      total: paidOrderCount,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: totalPages > 0 && safePage < totalPages,
    },
  }
}
