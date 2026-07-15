// 支付对账服务：按中国自然日逐笔复核本地订单与银联状态，并生成可操作的异常明细。
import { Prisma, type PaymentOrder } from '@prisma/client'
import { config } from '../config.js'
import {
  PAYMENT_ORDER_STATUS,
  PAYMENT_RECONCILIATION_RESOLUTION,
  PAYMENT_RECONCILIATION_RESULT,
  PAYMENT_RECONCILIATION_RUN_STATUS,
  PAYMENT_RECONCILIATION_TRIGGER,
  PAYMENT_REFUND_STATUS,
} from '../constants/domain.js'
import {
  ChinaumsRequestError,
  chinaumsResponseSnapshot,
  queryChinaumsBill,
  type ChinaumsBillResponse,
} from './chinaums.js'
import { fulfillPaidOrder } from './paymentFulfillment.js'
import { paymentProviderMeta, syncPaymentOrderFromChinaums } from './paymentOrder.js'
import { refreshPaymentRefund } from './paymentRefund.js'
import { prisma } from './prisma.js'

const RUN_STALE_MS = 30 * 60_000
const chinaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
})

export class PaymentReconciliationError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly httpStatus = 409,
  ) {
    super(message)
    this.name = 'PaymentReconciliationError'
  }
}

type ReconciliationEvaluation = {
  result: string
  anomalyType: string | null
  message: string
  resolutionStatus: string
}

// 中国自然日统一输出 YYYY-MM-DD，供定时任务和管理员手动触发复用。
function chinaDateParts(date: Date): Record<string, string> {
  return Object.fromEntries(
    chinaDateFormatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )
}

// 业务日期只接受真实存在的日历日期，避免数据库 DATE 自动纠正非法输入。
export function normalizePaymentBusinessDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return null
  return value
}

// 定时任务默认核对中国时区的前一个完整自然日。
export function previousPaymentBusinessDate(now = new Date()): string {
  const part = chinaDateParts(now)
  const current = Date.UTC(Number(part.year), Number(part.month) - 1, Number(part.day))
  return new Date(current - 86_400_000).toISOString().slice(0, 10)
}

// DATE 列使用 UTC 零点表示业务日期，交易时间范围则按东八区零点换算为 UTC。
function businessDateValues(value: string): {
  databaseDate: Date
  startAt: Date
  endAt: Date
} {
  const databaseDate = new Date(`${value}T00:00:00.000Z`)
  const startAt = new Date(`${value}T00:00:00+08:00`)
  return {
    databaseDate,
    startAt,
    endAt: new Date(startAt.getTime() + 86_400_000),
  }
}

// 渠道状态只在与本地状态语义一致时视为匹配，处理中退款仍保留为已收款状态。
function providerMatchesLocal(providerStatus: string, localStatus: string): boolean {
  if (providerStatus === 'PAID') {
    return [PAYMENT_ORDER_STATUS.PAID, PAYMENT_ORDER_STATUS.REFUNDING].includes(localStatus as any)
  }
  if (providerStatus === 'REFUND') return localStatus === PAYMENT_ORDER_STATUS.REFUNDED
  if (providerStatus === 'CLOSED') return localStatus === PAYMENT_ORDER_STATUS.CLOSED
  if (providerStatus === 'UNPAID') return localStatus === PAYMENT_ORDER_STATUS.PENDING
  return false
}

// 渠道原订单金额优先读取账单总额，缺失时回退到支付流水总额。
function providerAmount(response: ChinaumsBillResponse): number | null {
  const amount = Number(response.totalAmount ?? response.billPayment?.totalAmount)
  return Number.isInteger(amount) ? amount : null
}

// 对账结果区分一致、管理员修复和待人工处置，日常对账本身不修改任何业务状态。
function evaluateResult(input: {
  beforeStatus: string
  localStatus: string
  localAmountCents: number
  providerStatus: string
  providerAmountCents: number | null
  adminRecheck: boolean
}): ReconciliationEvaluation {
  if (input.providerAmountCents === null) {
    return {
      result: PAYMENT_RECONCILIATION_RESULT.ERROR,
      anomalyType: 'PROVIDER_AMOUNT_MISSING',
      message: '银联查询结果缺少可校验的订单金额',
      resolutionStatus: PAYMENT_RECONCILIATION_RESOLUTION.OPEN,
    }
  }
  if (input.providerAmountCents !== input.localAmountCents) {
    return {
      result: PAYMENT_RECONCILIATION_RESULT.ANOMALY,
      anomalyType: 'AMOUNT_MISMATCH',
      message: `金额不一致：本地 ${input.localAmountCents} 分，银联 ${input.providerAmountCents} 分`,
      resolutionStatus: PAYMENT_RECONCILIATION_RESOLUTION.OPEN,
    }
  }
  if (!providerMatchesLocal(input.providerStatus, input.localStatus)) {
    return {
      result: PAYMENT_RECONCILIATION_RESULT.ANOMALY,
      anomalyType: 'STATUS_MISMATCH',
      message: `状态不一致：本地 ${input.localStatus}，银联 ${input.providerStatus || 'UNKNOWN'}`,
      resolutionStatus: PAYMENT_RECONCILIATION_RESOLUTION.OPEN,
    }
  }
  if (input.beforeStatus !== input.localStatus) {
    return {
      result: PAYMENT_RECONCILIATION_RESULT.CORRECTED,
      anomalyType: null,
      message: `管理员复核银联结果后修复：${input.beforeStatus} → ${input.localStatus}`,
      resolutionStatus: PAYMENT_RECONCILIATION_RESOLUTION.MANUALLY_RESOLVED,
    }
  }
  return {
    result: PAYMENT_RECONCILIATION_RESULT.MATCHED,
    anomalyType: null,
    message: input.adminRecheck ? '管理员重新查询后确认本地订单与银联交易一致' : '本地订单与银联交易一致',
    resolutionStatus: input.adminRecheck
      ? PAYMENT_RECONCILIATION_RESOLUTION.MANUALLY_RESOLVED
      : PAYMENT_RECONCILIATION_RESOLUTION.NONE,
  }
}

// 管理员主动修复只接受银联可验证的 PAID/CLOSED/REFUND 结果，不提供人工强制置为已支付。
async function applyAdminCompensation(order: PaymentOrder, response: ChinaumsBillResponse): Promise<PaymentOrder> {
  const status = String(response.billStatus || '').toUpperCase()
  if (
    status === 'PAID'
    && [PAYMENT_ORDER_STATUS.PENDING, PAYMENT_ORDER_STATUS.FAILED, PAYMENT_ORDER_STATUS.CLOSED].includes(order.status as any)
  ) {
    const fulfilled = await fulfillPaidOrder(order.orderNo, response, 'query')
    return fulfilled || order
  }
  if (
    status === 'CLOSED'
    && [PAYMENT_ORDER_STATUS.PENDING, PAYMENT_ORDER_STATUS.FAILED].includes(order.status as any)
  ) {
    const synced = await syncPaymentOrderFromChinaums(order)
    return synced || order
  }
  if (status === 'REFUND' && order.status === PAYMENT_ORDER_STATUS.REFUNDING) {
    const refund = await prisma.paymentRefund.findFirst({
      where: { paymentOrderId: order.id, status: PAYMENT_REFUND_STATUS.PROCESSING },
      orderBy: { createdAt: 'desc' },
    })
    if (refund) await refreshPaymentRefund(refund.refundOrderNo)
  }
  return (await prisma.paymentOrder.findUnique({ where: { id: order.id } })) || order
}

// 日常对账只记录差异；仅管理员显式复核时允许按银联可信结果执行修复并留下操作人。
export async function reconcilePaymentOrder(
  runId: string,
  paymentOrderId: string,
  options: { adminRecheck?: boolean; adminUserId?: string } = {},
) {
  const order = await prisma.paymentOrder.findUnique({ where: { id: paymentOrderId } })
  if (!order) {
    throw new PaymentReconciliationError('支付订单不存在', 'PAYMENT_ORDER_NOT_FOUND', 404)
  }
  const beforeStatus = order.status
  try {
    const meta = paymentProviderMeta(order)
    const response = await queryChinaumsBill(order.orderNo, meta.billDate)
    const amount = providerAmount(response)
    const providerStatus = String(response.billStatus || '').toUpperCase()
    const compensated = options.adminRecheck && amount === order.amountCents
      ? await applyAdminCompensation(order, response)
      : order
    const evaluation = evaluateResult({
      beforeStatus,
      localStatus: compensated.status,
      localAmountCents: order.amountCents,
      providerStatus,
      providerAmountCents: amount,
      adminRecheck: Boolean(options.adminRecheck),
    })
    const manuallyResolved = evaluation.resolutionStatus === PAYMENT_RECONCILIATION_RESOLUTION.MANUALLY_RESOLVED
    const resolutionNote = manuallyResolved
      ? (beforeStatus === compensated.status ? '管理员主动重新查询并确认交易已一致' : '管理员主动复核银联结果后执行安全修复')
      : null
    return prisma.paymentReconciliationItem.upsert({
      where: { runId_paymentOrderId: { runId, paymentOrderId } },
      create: {
        runId,
        paymentOrderId,
        orderNo: order.orderNo,
        localStatus: compensated.status,
        providerStatus: providerStatus || null,
        localAmountCents: order.amountCents,
        providerAmountCents: amount,
        result: evaluation.result,
        anomalyType: evaluation.anomalyType,
        message: evaluation.message,
        providerPayload: JSON.parse(JSON.stringify(chinaumsResponseSnapshot(response))) as Prisma.InputJsonValue,
        resolutionStatus: evaluation.resolutionStatus,
        resolutionNote,
        resolvedBy: manuallyResolved ? options.adminUserId || null : null,
        resolvedAt: manuallyResolved ? new Date() : null,
      },
      update: {
        localStatus: compensated.status,
        providerStatus: providerStatus || null,
        providerAmountCents: amount,
        result: evaluation.result,
        anomalyType: evaluation.anomalyType,
        message: evaluation.message,
        providerPayload: JSON.parse(JSON.stringify(chinaumsResponseSnapshot(response))) as Prisma.InputJsonValue,
        resolutionStatus: evaluation.resolutionStatus,
        resolutionNote,
        resolvedBy: manuallyResolved ? options.adminUserId || null : null,
        resolvedAt: manuallyResolved ? new Date() : null,
      },
    })
  } catch (error) {
    const detail = error instanceof ChinaumsRequestError
      ? { code: error.code, message: error.message, response: error.response }
      : {
          code: 'RECONCILIATION_QUERY_FAILED',
          message: error instanceof Error ? error.message : '银联订单查询失败',
          response: undefined,
        }
    return prisma.paymentReconciliationItem.upsert({
      where: { runId_paymentOrderId: { runId, paymentOrderId } },
      create: {
        runId,
        paymentOrderId,
        orderNo: order.orderNo,
        localStatus: order.status,
        localAmountCents: order.amountCents,
        result: PAYMENT_RECONCILIATION_RESULT.ERROR,
        anomalyType: detail.code.slice(0, 64),
        message: detail.message.slice(0, 500),
        ...(detail.response
          ? { providerPayload: JSON.parse(JSON.stringify(chinaumsResponseSnapshot(detail.response))) as Prisma.InputJsonValue }
          : {}),
        resolutionStatus: PAYMENT_RECONCILIATION_RESOLUTION.OPEN,
      },
      update: {
        localStatus: order.status,
        providerStatus: null,
        providerAmountCents: null,
        result: PAYMENT_RECONCILIATION_RESULT.ERROR,
        anomalyType: detail.code.slice(0, 64),
        message: detail.message.slice(0, 500),
        ...(detail.response
          ? { providerPayload: JSON.parse(JSON.stringify(chinaumsResponseSnapshot(detail.response))) as Prisma.InputJsonValue }
          : {}),
        resolutionStatus: PAYMENT_RECONCILIATION_RESOLUTION.OPEN,
        resolutionNote: null,
        resolvedBy: null,
        resolvedAt: null,
      },
    })
  }
}

// 单笔重新核对后重算批次统计，保证后台摘要与异常明细同步变化。
export async function refreshPaymentReconciliationRun(runId: string) {
  const groups = await prisma.paymentReconciliationItem.groupBy({
    by: ['result'],
    where: { runId },
    _count: { _all: true },
  })
  const counts = Object.fromEntries(groups.map((group) => [group.result, group._count._all]))
  const errorOrders = counts[PAYMENT_RECONCILIATION_RESULT.ERROR] || 0
  return prisma.paymentReconciliationRun.update({
    where: { id: runId },
    data: {
      status: errorOrders > 0
        ? PAYMENT_RECONCILIATION_RUN_STATUS.PARTIAL
        : PAYMENT_RECONCILIATION_RUN_STATUS.COMPLETED,
      totalOrders: groups.reduce((sum, group) => sum + group._count._all, 0),
      matchedOrders: counts[PAYMENT_RECONCILIATION_RESULT.MATCHED] || 0,
      correctedOrders: counts[PAYMENT_RECONCILIATION_RESULT.CORRECTED] || 0,
      anomalyOrders: counts[PAYMENT_RECONCILIATION_RESULT.ANOMALY] || 0,
      errorOrders,
      completedAt: new Date(),
    },
  })
}

// 同一业务日期只保留一个批次；运行中批次需超时后才能被重新接管。
async function claimReconciliationRun(input: {
  businessDate: string
  trigger: string
  triggeredBy?: string
}) {
  const { databaseDate } = businessDateValues(input.businessDate)
  let run = await prisma.paymentReconciliationRun.findUnique({
    where: { provider_businessDate: { provider: 'chinaums', businessDate: databaseDate } },
  })
  if (!run) {
    try {
      return await prisma.paymentReconciliationRun.create({
        data: {
          provider: 'chinaums',
          businessDate: databaseDate,
          status: PAYMENT_RECONCILIATION_RUN_STATUS.RUNNING,
          trigger: input.trigger,
          triggeredBy: input.triggeredBy || null,
        },
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error
      run = await prisma.paymentReconciliationRun.findUnique({
        where: { provider_businessDate: { provider: 'chinaums', businessDate: databaseDate } },
      })
    }
  }
  if (!run) throw new PaymentReconciliationError('创建对账批次失败', 'RECONCILIATION_RUN_CREATE_FAILED', 500)

  const staleBefore = new Date(Date.now() - RUN_STALE_MS)
  const claimed = await prisma.paymentReconciliationRun.updateMany({
    where: {
      id: run.id,
      OR: [
        { status: { not: PAYMENT_RECONCILIATION_RUN_STATUS.RUNNING } },
        { updatedAt: { lte: staleBefore } },
      ],
    },
    data: {
      status: PAYMENT_RECONCILIATION_RUN_STATUS.RUNNING,
      trigger: input.trigger,
      triggeredBy: input.triggeredBy || null,
      totalOrders: 0,
      matchedOrders: 0,
      correctedOrders: 0,
      anomalyOrders: 0,
      errorOrders: 0,
      errorMessage: null,
      startedAt: new Date(),
      completedAt: null,
    },
  })
  if (claimed.count !== 1) {
    throw new PaymentReconciliationError('该日期正在执行对账，请稍后刷新', 'RECONCILIATION_ALREADY_RUNNING')
  }
  return prisma.paymentReconciliationRun.findUniqueOrThrow({ where: { id: run.id } })
}

// 对账范围覆盖当日创建、支付或退款的本地订单，并逐批查询渠道避免内存峰值。
export async function runPaymentReconciliation(input: {
  businessDate: string
  trigger: 'scheduled' | 'manual'
  triggeredBy?: string
}) {
  if (!config.chinaums.enabled) {
    throw new PaymentReconciliationError('银联商务通道尚未启用', 'PAYMENT_PROVIDER_NOT_CONFIGURED', 503)
  }
  const normalizedDate = normalizePaymentBusinessDate(input.businessDate)
  if (!normalizedDate) {
    throw new PaymentReconciliationError('对账日期格式应为 YYYY-MM-DD', 'RECONCILIATION_DATE_INVALID', 422)
  }
  const today = chinaDateParts(new Date())
  const todayValue = `${today.year}-${today.month}-${today.day}`
  if (normalizedDate > todayValue) {
    throw new PaymentReconciliationError('不能对未来日期执行对账', 'RECONCILIATION_DATE_IN_FUTURE', 422)
  }

  const run = await claimReconciliationRun({
    businessDate: normalizedDate,
    trigger: input.trigger,
    triggeredBy: input.triggeredBy,
  })
  const { startAt, endAt } = businessDateValues(normalizedDate)
  const where: Prisma.PaymentOrderWhereInput = {
    OR: [
      { createdAt: { gte: startAt, lt: endAt } },
      { paidAt: { gte: startAt, lt: endAt } },
      { refunds: { some: { refundedAt: { gte: startAt, lt: endAt } } } },
    ],
  }

  try {
    await prisma.paymentReconciliationItem.deleteMany({ where: { runId: run.id } })
    const totalOrders = await prisma.paymentOrder.count({ where })
    let cursorId: string | undefined
    let matchedOrders = 0
    let correctedOrders = 0
    let anomalyOrders = 0
    let errorOrders = 0

    while (true) {
      const orders = await prisma.paymentOrder.findMany({
        where,
        orderBy: { id: 'asc' },
        take: config.paymentLifecycle.reconciliationBatchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        select: { id: true },
      })
      if (orders.length === 0) break
      for (const order of orders) {
        const item = await reconcilePaymentOrder(run.id, order.id)
        if (item.result === PAYMENT_RECONCILIATION_RESULT.MATCHED) matchedOrders += 1
        else if (item.result === PAYMENT_RECONCILIATION_RESULT.CORRECTED) correctedOrders += 1
        else if (item.result === PAYMENT_RECONCILIATION_RESULT.ANOMALY) anomalyOrders += 1
        else errorOrders += 1
      }
      cursorId = orders[orders.length - 1]?.id
    }

    const completed = await prisma.paymentReconciliationRun.update({
      where: { id: run.id },
      data: {
        status: errorOrders > 0
          ? PAYMENT_RECONCILIATION_RUN_STATUS.PARTIAL
          : PAYMENT_RECONCILIATION_RUN_STATUS.COMPLETED,
        totalOrders,
        matchedOrders,
        correctedOrders,
        anomalyOrders,
        errorOrders,
        completedAt: new Date(),
      },
    })
    console.log('[payment-reconciliation] run completed', {
      businessDate: normalizedDate,
      totalOrders,
      matchedOrders,
      correctedOrders,
      anomalyOrders,
      errorOrders,
    })
    return completed
  } catch (error) {
    await prisma.paymentReconciliationRun.update({
      where: { id: run.id },
      data: {
        status: PAYMENT_RECONCILIATION_RUN_STATUS.FAILED,
        errorMessage: (error instanceof Error ? error.message : '对账任务失败').slice(0, 500),
        completedAt: new Date(),
      },
    }).catch(() => undefined)
    throw error
  }
}

// 到达配置小时后自动对前一完整自然日执行一次，已完成或部分完成的批次不重复跑。
export async function runScheduledPaymentReconciliation(now = new Date()) {
  if (!config.paymentLifecycle.reconciliationEnabled || !config.chinaums.enabled) return null
  const part = chinaDateParts(now)
  if (Number(part.hour) < config.paymentLifecycle.reconciliationHour) return null
  const businessDate = previousPaymentBusinessDate(now)
  const { databaseDate } = businessDateValues(businessDate)
  const existing = await prisma.paymentReconciliationRun.findUnique({
    where: { provider_businessDate: { provider: 'chinaums', businessDate: databaseDate } },
  })
  if (
    existing
    && [
      PAYMENT_RECONCILIATION_RUN_STATUS.COMPLETED,
      PAYMENT_RECONCILIATION_RUN_STATUS.PARTIAL,
    ].includes(existing.status as any)
  ) {
    return existing
  }
  return runPaymentReconciliation({
    businessDate,
    trigger: PAYMENT_RECONCILIATION_TRIGGER.SCHEDULED,
  })
}
