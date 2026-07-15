import { Router, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import {
  MEMBERSHIP_PLAN,
  MEMBERSHIP_STATUS,
  USER_PAYMENT_STATUS,
  USER_ROLE,
  PAYMENT_NOTIFICATION_STATUS,
  PAYMENT_RECONCILIATION_RESOLUTION,
  isExamType,
  isMembershipPlan,
  isUserRole,
} from '../constants/domain.js'
import { formatUserForClient } from '../utils/userPresenter.js'
import { PAYMENT_CONFIG_STATUS } from '../constants/domain.js'
import { getOrCreatePaymentConfig } from './payment.js'
import { ChinaumsRequestError } from '../services/chinaums.js'
import { config } from '../config.js'
import { parseJsonArray, parseJsonObject } from '../utils/jsonField.js'
import {
  PaymentRefundError,
  refreshPaymentRefund,
  requestFullPaymentRefund,
} from '../services/paymentRefund.js'
import {
  PaymentReconciliationError,
  normalizePaymentBusinessDate,
  previousPaymentBusinessDate,
  reconcilePaymentOrder,
  refreshPaymentReconciliationRun,
  runPaymentReconciliation,
} from '../services/paymentReconciliation.js'

export const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)

function parsePaymentAmount(value: unknown): number | null {
  const amount = Number(value)
  if (!Number.isInteger(amount) || amount < 1 || amount > 100000000) return null
  return amount
}

function formatPaymentConfig(config: {
  firstMonthlyPriceCents: number
  monthlyPriceCents: number
  yearlyPriceCents: number
  status: string
  updatedBy: string | null
  updatedAt: Date
}) {
  return { ...config, updatedAt: config.updatedAt.toISOString() }
}

function formatPaymentRefund(refund: {
  id: string
  refundOrderNo: string
  amountCents: number
  reason: string
  status: string
  providerRefundNo: string | null
  failureCode: string | null
  failureMessage: string | null
  operatorId: string
  refundedAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    ...refund,
    refundedAt: refund.refundedAt?.toISOString() || null,
    createdAt: refund.createdAt.toISOString(),
    updatedAt: refund.updatedAt.toISOString(),
  }
}

// 管理后台只展示可定位配置，AppKey 和通信密钥始终留在服务端。
function maskPaymentIdentifier(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return `${value.slice(0, 2)}…${value.slice(-2)}`
  return `${value.slice(0, 4)}…${value.slice(-4)}`
}

// JSON 快照可能来自 Prisma JSON 或历史字符串，详情页统一提取可读的渠道响应节点。
function paymentProviderSnapshots(value: unknown) {
  const payload = parseJsonObject(value)
  const definitions = [
    ['qrCode', '二维码生成'],
    ['latestConfirmation', '支付确认'],
    ['latestQuery', '主动查询'],
    ['closeResponse', '用户关单'],
    ['lifecycleCloseResponse', '系统过期关单'],
    ['createError', '二维码生成失败'],
  ] as const
  return definitions.flatMap(([key, label]) => {
    const node = parseJsonObject(payload[key])
    const response = key === 'qrCode' ? node.response : node.response ?? node
    if (!response || typeof response !== 'object' || Array.isArray(response) || Object.keys(response).length === 0) return []
    return [{
      key,
      label,
      receivedAt: typeof node.receivedAt === 'string'
        ? node.receivedAt
        : typeof node.confirmedAt === 'string'
          ? node.confirmedAt
          : null,
      response,
    }]
  })
}

// 对账批次日期按业务日输出，时间字段统一使用 ISO 字符串。
function formatReconciliationRun<T extends {
  businessDate: Date
  startedAt: Date
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}>(run: T) {
  return {
    ...run,
    businessDate: run.businessDate.toISOString().slice(0, 10),
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt?.toISOString() || null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  }
}

// 对账明细不向管理前端返回渠道原始快照，避免暴露支付上下文。
function formatReconciliationItem<T extends {
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
}>(item: T) {
  const { providerPayload: _providerPayload, ...safeItem } = item as T & { providerPayload?: unknown }
  return {
    ...safeItem,
    resolvedAt: item.resolvedAt?.toISOString() || null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }
}

// 支付策略配置
adminRouter.get('/payment-config', async (_req, res) => {
  try {
    const config = await getOrCreatePaymentConfig()
    res.json(success(formatPaymentConfig(config)))
  } catch (error) {
    console.error('[admin] payment config error:', error)
    res.status(500).json(fail('获取支付策略失败'))
  }
})

// 保存支付策略后，前台支付弹窗立即读取最新价格。
adminRouter.put('/payment-config', async (req, res) => {
  try {
    const firstMonthlyPriceCents = parsePaymentAmount(req.body.firstMonthlyPriceCents)
    const monthlyPriceCents = parsePaymentAmount(req.body.monthlyPriceCents)
    const yearlyPriceCents = parsePaymentAmount(req.body.yearlyPriceCents)
    const status = req.body.status
    if (firstMonthlyPriceCents === null || monthlyPriceCents === null || yearlyPriceCents === null) {
      res.status(422).json(fail('价格必须是大于 0 的整数分'))
      return
    }
    if (status !== PAYMENT_CONFIG_STATUS.ACTIVE && status !== PAYMENT_CONFIG_STATUS.INACTIVE) {
      res.status(422).json(fail('无效的支付策略状态'))
      return
    }
    if (firstMonthlyPriceCents > monthlyPriceCents) {
      res.status(422).json(fail('首次按月价格不能高于正常月价格'))
      return
    }

    const config = await prisma.paymentConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        firstMonthlyPriceCents,
        monthlyPriceCents,
        yearlyPriceCents,
        status,
        updatedBy: req.user!.userId,
      },
      update: {
        firstMonthlyPriceCents,
        monthlyPriceCents,
        yearlyPriceCents,
        status,
        updatedBy: req.user!.userId,
      },
    })
    res.json(success(formatPaymentConfig(config)))
  } catch (error) {
    console.error('[admin] update payment config error:', error)
    res.status(500).json(fail('保存支付策略失败'))
  }
})

// 支付订单列表
adminRouter.get('/payment-orders', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
    const status = typeof req.query.status === 'string' && req.query.status ? req.query.status : undefined
    const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim().slice(0, 100) : ''
    const where: Prisma.PaymentOrderWhereInput = {
      ...(status ? { status } : {}),
      ...(keyword
        ? {
            OR: [
              { orderNo: { contains: keyword } },
              { providerOrderNo: { contains: keyword } },
              { user: { is: { OR: [
                { username: { contains: keyword } },
                { email: { contains: keyword } },
              ] } } },
            ],
          }
        : {}),
    }
    const total = await prisma.paymentOrder.count({ where })
    const totalPages = Math.ceil(total / pageSize)
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
    const list = await prisma.paymentOrder.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, email: true } },
        refunds: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            refundOrderNo: true,
            amountCents: true,
            reason: true,
            status: true,
            providerRefundNo: true,
            failureCode: true,
            failureMessage: true,
            operatorId: true,
            refundedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    })
    res.json(success({
      list: list.map((order) => {
        const { providerPayload: _providerPayload, ...safeOrder } = order
        return {
          ...safeOrder,
          latestRefund: order.refunds[0] ? formatPaymentRefund(order.refunds[0]) : null,
          refunds: undefined,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          expiresAt: order.expiresAt.toISOString(),
          paidAt: order.paidAt?.toISOString() || null,
          closedAt: order.closedAt?.toISOString() || null,
        }
      }),
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: totalPages > 0 && safePage < totalPages,
      },
    }))
  } catch (error) {
    console.error('[admin] payment orders error:', error)
    res.status(500).json(fail('获取支付订单失败'))
  }
})

// 支付订单详情聚合订单、脱敏通知、退款、权益快照、对账和管理员操作，供人工核查使用。
adminRouter.get('/payment-orders/:orderNo', async (req, res) => {
  try {
    const order = await prisma.paymentOrder.findUnique({
      where: { orderNo: req.params.orderNo },
      include: {
        user: { select: { id: true, username: true, email: true } },
        refunds: { orderBy: { createdAt: 'desc' } },
        reconciliationItems: {
          include: { run: true },
          orderBy: { updatedAt: 'desc' },
        },
      },
    })
    if (!order) {
      res.status(404).json(fail('支付订单不存在', 'PAYMENT_ORDER_NOT_FOUND'))
      return
    }

    const examTypes = [...new Set(parseJsonArray<string>(order.examTypes))]
    const [notifications, memberships] = await Promise.all([
      prisma.paymentNotification.findMany({
        where: { orderNo: order.orderNo },
        orderBy: { createdAt: 'desc' },
      }),
      examTypes.length > 0
        ? prisma.userMembership.findMany({
            where: { userId: order.userId, examType: { in: examTypes } },
            orderBy: [{ examType: 'asc' }, { endsAt: 'desc' }],
          })
        : Promise.resolve([]),
    ])

    const operatorIds = new Set<string>()
    order.refunds.forEach((refund) => operatorIds.add(refund.operatorId))
    order.reconciliationItems.forEach((item) => {
      if (item.resolvedBy) operatorIds.add(item.resolvedBy)
      if (item.run.triggeredBy) operatorIds.add(item.run.triggeredBy)
    })
    const operators = operatorIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: [...operatorIds] } },
          select: { id: true, username: true, email: true },
        })
      : []
    const operatorMap = new Map(operators.map((operator) => [operator.id, operator]))

    // 审计关联的管理员可能已被删除，仍保留原始 ID 以便追踪历史操作。
    const actorFor = (id: string | null) => {
      if (!id) return null
      return operatorMap.get(id) || { id, username: '未知或已删除管理员', email: '' }
    }
    const timeline: Array<{
      id: string
      category: 'order' | 'notification' | 'refund' | 'entitlement' | 'reconciliation'
      title: string
      description: string
      status: string
      occurredAt: string
      actor: { id: string; username: string; email: string } | null
      inferred?: boolean
    }> = []

    timeline.push({
      id: `order-created-${order.id}`,
      category: 'order',
      title: '支付订单创建',
      description: `${examTypes.join(' / ') || '未指定考试类型'} · ${order.plan} · ${order.amountCents} 分`,
      status: 'created',
      occurredAt: order.createdAt.toISOString(),
      actor: null,
    })
    const providerPayload = parseJsonObject(order.providerPayload)
    const qrCode = parseJsonObject(providerPayload.qrCode)
    if (Object.keys(qrCode).length > 0) {
      timeline.push({
        id: `qr-created-${order.id}`,
        category: 'order',
        title: '银联支付二维码生成',
        description: `账单日期 ${String(qrCode.billDate || '未知')}，二维码标识 ${String(qrCode.qrCodeId || '未返回')}`,
        status: 'pending',
        occurredAt: order.createdAt.toISOString(),
        actor: null,
      })
    }
    if (order.paidAt) {
      timeline.push({
        id: `order-paid-${order.id}`,
        category: 'order',
        title: '银联确认支付成功',
        description: `渠道流水号 ${order.providerOrderNo || '未返回'}，实付 ${order.amountCents} 分`,
        status: 'paid',
        occurredAt: order.paidAt.toISOString(),
        actor: null,
      })
    }
    if (order.closedAt) {
      timeline.push({
        id: `order-closed-${order.id}`,
        category: 'order',
        title: '支付订单关闭',
        description: order.failureMessage || '银联二维码已关闭或超过有效期',
        status: 'closed',
        occurredAt: order.closedAt.toISOString(),
        actor: null,
      })
    }
    if (order.failureCode || order.status === 'failed') {
      timeline.push({
        id: `order-failed-${order.id}`,
        category: 'order',
        title: '支付订单处理失败',
        description: `${order.failureCode || 'PAYMENT_FAILED'}：${order.failureMessage || '未记录失败原因'}`,
        status: 'failed',
        occurredAt: order.updatedAt.toISOString(),
        actor: null,
      })
    }

    notifications.forEach((notification) => {
      timeline.push({
        id: `notification-${notification.id}`,
        category: 'notification',
        title: notification.processStatus === PAYMENT_NOTIFICATION_STATUS.PROCESSED
          ? '银联异步通知处理成功'
          : '银联异步通知处理异常',
        description: `通知 ${notification.notificationId}，验签${notification.signatureValid ? '通过' : '未通过'}${notification.errorMessage ? `；${notification.errorMessage}` : ''}`,
        status: notification.processStatus,
        occurredAt: (notification.processedAt || notification.updatedAt).toISOString(),
        actor: null,
      })
    })

    order.refunds.forEach((refund) => {
      timeline.push({
        id: `refund-requested-${refund.id}`,
        category: 'refund',
        title: '管理员发起全额退款',
        description: `${refund.refundOrderNo} · ${refund.amountCents} 分 · ${refund.reason}`,
        status: 'processing',
        occurredAt: refund.createdAt.toISOString(),
        actor: actorFor(refund.operatorId),
      })
      if (refund.status !== 'processing') {
        timeline.push({
          id: `refund-result-${refund.id}`,
          category: 'refund',
          title: refund.status === 'succeeded' ? '银联确认退款成功' : '退款处理失败',
          description: refund.status === 'succeeded'
            ? `退款流水号 ${refund.providerRefundNo || '未返回'}，已退款 ${refund.amountCents} 分`
            : `${refund.failureCode || 'REFUND_FAILED'}：${refund.failureMessage || '未记录失败原因'}`,
          status: refund.status,
          occurredAt: (refund.refundedAt || refund.updatedAt).toISOString(),
          actor: actorFor(refund.operatorId),
        })
      }
    })

    memberships.forEach((membership) => {
      timeline.push({
        id: `membership-start-${membership.id}`,
        category: 'entitlement',
        title: '关联会员权益开始',
        description: `${membership.examType} · ${membership.plan} · 当前状态 ${membership.status}`,
        status: membership.status,
        occurredAt: membership.startsAt.toISOString(),
        actor: null,
        inferred: true,
      })
      if (membership.status === MEMBERSHIP_STATUS.CANCELLED || membership.status === MEMBERSHIP_STATUS.EXPIRED) {
        timeline.push({
          id: `membership-end-${membership.id}`,
          category: 'entitlement',
          title: membership.status === MEMBERSHIP_STATUS.CANCELLED ? '关联会员权益已取消' : '关联会员权益已到期',
          description: `${membership.examType} · ${membership.plan}`,
          status: membership.status,
          occurredAt: membership.endsAt.toISOString(),
          actor: null,
          inferred: true,
        })
      }
    })

    order.reconciliationItems.forEach((item) => {
      const title = item.result === 'matched'
        ? '交易对账一致'
        : item.result === 'corrected'
          ? '管理员复核并修复'
          : item.result === 'anomaly'
            ? '交易对账发现异常'
            : '交易对账查询失败'
      timeline.push({
        id: `reconciliation-${item.id}`,
        category: 'reconciliation',
        title,
        description: `${item.run.businessDate.toISOString().slice(0, 10)} · ${item.message}${item.resolutionNote ? `；${item.resolutionNote}` : ''}`,
        status: item.resolutionStatus,
        occurredAt: (item.resolvedAt || item.updatedAt).toISOString(),
        actor: actorFor(item.resolvedBy || item.run.triggeredBy),
      })
    })
    timeline.sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())

    const { providerPayload: _providerPayload, refunds: _refunds, reconciliationItems: _items, ...safeOrder } = order
    res.json(success({
      order: {
        ...safeOrder,
        examTypes,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        expiresAt: order.expiresAt.toISOString(),
        paidAt: order.paidAt?.toISOString() || null,
        closedAt: order.closedAt?.toISOString() || null,
      },
      provider: {
        environment: config.chinaums.environment,
        appIdMasked: maskPaymentIdentifier(config.chinaums.appId),
        mid: config.chinaums.mid,
        tid: config.chinaums.tid,
        instMid: config.chinaums.instMid,
        msgSrcId: config.chinaums.msgSrcId,
        providerOrderNo: order.providerOrderNo,
        billDate: typeof qrCode.billDate === 'string' ? qrCode.billDate : null,
        qrCodeId: typeof qrCode.qrCodeId === 'string' ? qrCode.qrCodeId : null,
        systemId: typeof qrCode.systemId === 'string' ? qrCode.systemId : null,
      },
      providerSnapshots: paymentProviderSnapshots(order.providerPayload),
      notifications: notifications.map((notification) => ({
        id: notification.id,
        provider: notification.provider,
        notificationId: notification.notificationId,
        signatureValid: notification.signatureValid,
        processStatus: notification.processStatus,
        payload: notification.rawPayload,
        errorMessage: notification.errorMessage,
        processedAt: notification.processedAt?.toISOString() || null,
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString(),
      })),
      refunds: order.refunds.map((refund) => ({
        ...formatPaymentRefund(refund),
        operator: actorFor(refund.operatorId),
        providerResult: parseJsonObject(parseJsonObject(refund.providerPayload).response),
      })),
      memberships: memberships.map((membership) => ({
        id: membership.id,
        examType: membership.examType,
        plan: membership.plan,
        status: membership.status,
        startsAt: membership.startsAt.toISOString(),
        endsAt: membership.endsAt.toISOString(),
        createdAt: membership.createdAt.toISOString(),
        updatedAt: membership.updatedAt.toISOString(),
        associationBasis: 'user_exam_type_snapshot',
      })),
      reconciliationItems: order.reconciliationItems.map((item) => ({
        ...formatReconciliationItem(item),
        run: formatReconciliationRun(item.run),
        resolver: actorFor(item.resolvedBy),
        triggerOperator: actorFor(item.run.triggeredBy),
      })),
      timeline,
    }))
  } catch (error) {
    console.error('[admin] payment order detail error:', error)
    res.status(500).json(fail('获取支付订单详情失败'))
  }
})

// 管理员全额退款
adminRouter.post('/payment-orders/:orderNo/refunds', async (req, res) => {
  try {
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : ''
    if (reason.length < 2 || reason.length > 255) {
      res.status(422).json(fail('退款原因长度应为 2 到 255 个字符', 'PAYMENT_REFUND_REASON_INVALID'))
      return
    }
    const refund = await requestFullPaymentRefund({
      orderNo: req.params.orderNo,
      operatorId: req.user!.userId,
      reason,
    })
    res.json(success(formatPaymentRefund(refund)))
  } catch (error) {
    console.error('[admin] payment refund error:', error)
    if (error instanceof PaymentRefundError) {
      res.status(error.httpStatus).json(fail(error.message, error.code))
      return
    }
    if (error instanceof ChinaumsRequestError) {
      res.status(502).json(fail(error.message, error.code))
      return
    }
    res.status(500).json(fail('发起退款失败', 'PAYMENT_REFUND_FAILED'))
  }
})

// 管理员主动查询退款
adminRouter.post('/payment-refunds/:refundOrderNo/query', async (req, res) => {
  try {
    const refund = await refreshPaymentRefund(req.params.refundOrderNo)
    res.json(success(formatPaymentRefund(refund)))
  } catch (error) {
    console.error('[admin] payment refund query error:', error)
    if (error instanceof PaymentRefundError) {
      res.status(error.httpStatus).json(fail(error.message, error.code))
      return
    }
    if (error instanceof ChinaumsRequestError) {
      res.status(502).json(fail(error.message, error.code))
      return
    }
    res.status(500).json(fail('查询退款失败', 'PAYMENT_REFUND_QUERY_FAILED'))
  }
})

// 全站支付对账摘要与待处理告警
adminRouter.get('/payment-reconciliation/overview', async (_req, res) => {
  try {
    const stuckBefore = new Date(Date.now() - 30 * 60_000)
    const [latestRun, openAnomalyCount, failedNotificationCount, stuckRefundCount, stalePendingCount] = await Promise.all([
      prisma.paymentReconciliationRun.findFirst({ orderBy: { businessDate: 'desc' } }),
      prisma.paymentReconciliationItem.count({
        where: { resolutionStatus: PAYMENT_RECONCILIATION_RESOLUTION.OPEN },
      }),
      prisma.paymentNotification.count({
        where: { processStatus: PAYMENT_NOTIFICATION_STATUS.FAILED },
      }),
      prisma.paymentRefund.count({
        where: { status: 'processing', updatedAt: { lte: stuckBefore } },
      }),
      prisma.paymentOrder.count({
        where: { status: 'pending', expiresAt: { lte: new Date() } },
      }),
    ])
    res.json(success({
      latestRun: latestRun ? formatReconciliationRun(latestRun) : null,
      openAnomalyCount,
      failedNotificationCount,
      stuckRefundCount,
      stalePendingCount,
      defaultBusinessDate: previousPaymentBusinessDate(),
      scope: 'local_orders_with_provider_query',
    }))
  } catch (error) {
    console.error('[admin] payment reconciliation overview error:', error)
    res.status(500).json(fail('获取支付对账摘要失败'))
  }
})

// 对账异常明细列表
adminRouter.get('/payment-reconciliation/items', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 10, 100)
    const resolutionStatus = typeof req.query.resolutionStatus === 'string' && req.query.resolutionStatus
      ? req.query.resolutionStatus
      : PAYMENT_RECONCILIATION_RESOLUTION.OPEN
    const where: Prisma.PaymentReconciliationItemWhereInput = resolutionStatus === 'all'
      ? {}
      : { resolutionStatus }
    const total = await prisma.paymentReconciliationItem.count({ where })
    const totalPages = Math.ceil(total / pageSize)
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
    const list = await prisma.paymentReconciliationItem.findMany({
      where,
      include: {
        run: { select: { businessDate: true } },
        paymentOrder: {
          select: {
            status: true,
            user: { select: { id: true, username: true, email: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    })
    res.json(success({
      list: list.map((item) => ({
        ...formatReconciliationItem(item),
        run: { businessDate: item.run.businessDate.toISOString().slice(0, 10) },
      })),
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: totalPages > 0 && safePage < totalPages,
      },
    }))
  } catch (error) {
    console.error('[admin] payment reconciliation items error:', error)
    res.status(500).json(fail('获取支付对账明细失败'))
  }
})

// 管理员手动执行指定自然日的全站订单对账
adminRouter.post('/payment-reconciliation/runs', async (req, res) => {
  try {
    const rawDate = req.body.businessDate ?? previousPaymentBusinessDate()
    const businessDate = normalizePaymentBusinessDate(rawDate)
    if (!businessDate) {
      res.status(422).json(fail('对账日期格式应为 YYYY-MM-DD', 'RECONCILIATION_DATE_INVALID'))
      return
    }
    const run = await runPaymentReconciliation({
      businessDate,
      trigger: 'manual',
      triggeredBy: req.user!.userId,
    })
    res.json(success(formatReconciliationRun(run)))
  } catch (error) {
    console.error('[admin] payment reconciliation run error:', error)
    if (error instanceof PaymentReconciliationError) {
      res.status(error.httpStatus).json(fail(error.message, error.code))
      return
    }
    res.status(500).json(fail('执行支付对账失败', 'RECONCILIATION_RUN_FAILED'))
  }
})

// 管理员显式确认后重新查询银联并仅执行可验证的安全修复
adminRouter.post('/payment-reconciliation/items/:id/recheck', async (req, res) => {
  try {
    const existing = await prisma.paymentReconciliationItem.findUnique({ where: { id: req.params.id } })
    if (!existing) {
      res.status(404).json(fail('对账明细不存在', 'RECONCILIATION_ITEM_NOT_FOUND'))
      return
    }
    if (existing.resolutionStatus !== PAYMENT_RECONCILIATION_RESOLUTION.OPEN) {
      res.status(409).json(fail('该对账异常已经处理', 'RECONCILIATION_ITEM_NOT_OPEN'))
      return
    }
    const item = await reconcilePaymentOrder(existing.runId, existing.paymentOrderId, {
      adminRecheck: true,
      adminUserId: req.user!.userId,
    })
    await refreshPaymentReconciliationRun(existing.runId)
    res.json(success(formatReconciliationItem(item)))
  } catch (error) {
    console.error('[admin] payment reconciliation recheck error:', error)
    if (error instanceof PaymentReconciliationError) {
      res.status(error.httpStatus).json(fail(error.message, error.code))
      return
    }
    res.status(500).json(fail('人工复核并修复失败', 'RECONCILIATION_RECHECK_FAILED'))
  }
})

// 管理员确认线下处置结果后关闭异常告警
adminRouter.post('/payment-reconciliation/items/:id/resolve', async (req, res) => {
  try {
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : ''
    if (note.length < 2 || note.length > 500) {
      res.status(422).json(fail('处理说明长度应为 2 到 500 个字符', 'RECONCILIATION_NOTE_INVALID'))
      return
    }
    const updated = await prisma.paymentReconciliationItem.updateMany({
      where: {
        id: req.params.id,
        resolutionStatus: PAYMENT_RECONCILIATION_RESOLUTION.OPEN,
      },
      data: {
        resolutionStatus: PAYMENT_RECONCILIATION_RESOLUTION.MANUALLY_RESOLVED,
        resolutionNote: note,
        resolvedBy: req.user!.userId,
        resolvedAt: new Date(),
      },
    })
    if (updated.count !== 1) {
      res.status(409).json(fail('该对账异常不存在或已经处理', 'RECONCILIATION_ITEM_NOT_OPEN'))
      return
    }
    const item = await prisma.paymentReconciliationItem.findUniqueOrThrow({ where: { id: req.params.id } })
    res.json(success(formatReconciliationItem(item)))
  } catch (error) {
    console.error('[admin] payment reconciliation resolve error:', error)
    res.status(500).json(fail('标记异常处理结果失败', 'RECONCILIATION_RESOLVE_FAILED'))
  }
})

interface RevenueCostPayload {
  rechargeItem: string
  amount: number
  operator: string
  occurredAt: Date
  reimbursementStatus: string
  remark: string | null
}

type RevenueCostPayloadResult =
  | { data: RevenueCostPayload }
  | { error: string }

function buildMembershipEndDate(plan: string, start: Date): Date {
  const end = new Date(start)
  if (plan === MEMBERSHIP_PLAN.YEARLY) {
    end.setFullYear(end.getFullYear() + 1)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end
}

function formatAdminUserForClient<T extends { role: string; paymentStatus?: string | null; memberships?: any[] }>(user: T) {
  const formatted = formatUserForClient(user)
  if (!user.memberships) return formatted
  return {
    ...formatted,
    memberships: user.memberships.map((membership) => ({
      ...membership,
      startsAt: membership.startsAt.getTime(),
      endsAt: membership.endsAt.getTime(),
    })),
  }
}

function parsePositiveInt(value: unknown, fallback: number, max?: number): number {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  const safeValue = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  return max ? Math.min(safeValue, max) : safeValue
}

function parseRevenueCostPayload(body: Record<string, unknown>): RevenueCostPayloadResult {
  const {
    rechargeItem,
    amount,
    operator,
    occurredAt,
    reimbursementStatus = 'unreimbursed',
    remark,
  } = body
  const numericAmount = Number(amount)
  const costDate = new Date(String(occurredAt))
  const normalizedRechargeItem = typeof rechargeItem === 'string' ? rechargeItem.trim() : ''
  const normalizedOperator = typeof operator === 'string' ? operator.trim() : ''
  const normalizedReimbursementStatus = typeof reimbursementStatus === 'string' ? reimbursementStatus.trim() : ''
  const normalizedRemark = typeof remark === 'string' && remark.trim() ? remark.trim() : null

  if (!normalizedRechargeItem) {
    return { error: '无效的成本项' }
  }
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    return { error: '无效的金额' }
  }
  if (!normalizedOperator) {
    return { error: '无效的操作人' }
  }
  if (Number.isNaN(costDate.getTime())) {
    return { error: '无效的时间' }
  }
  if (!normalizedReimbursementStatus) {
    return { error: '无效的报销情况' }
  }
  if (normalizedRemark && normalizedRemark.length > 500) {
    return { error: '备注不能超过 500 个字符' }
  }

  return {
    data: {
      rechargeItem: normalizedRechargeItem,
      amount: numericAmount,
      operator: normalizedOperator,
      occurredAt: costDate,
      reimbursementStatus: normalizedReimbursementStatus,
      remark: normalizedRemark,
    },
  }
}

// 用户列表
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
    const total = await prisma.user.count()
    const totalPages = Math.ceil(total / pageSize)
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        paymentStatus: true,
        diagnosticUsed: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            examType: true,
            plan: true,
            status: true,
            startsAt: true,
            endsAt: true,
          },
          orderBy: { endsAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    })
    res.json(success({
      list: users.map(formatAdminUserForClient),
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: totalPages > 0 && safePage < totalPages,
      },
    }))
  } catch (err) {
    console.error('[admin] users error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 更新用户角色
adminRouter.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body
    if (!isUserRole(role)) {
      res.status(422).json(fail('无效的角色'))
      return
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, username: true, email: true, role: true, paymentStatus: true },
    })
    res.json(success({ user: formatAdminUserForClient(user) }))
  } catch (err) {
    console.error('[admin] update role error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 更新用户权限
adminRouter.put('/users/:id/access', async (req: Request, res: Response) => {
  try {
    const { role, membership } = req.body
    const userId = req.params.id
    if (!isUserRole(role)) {
      res.status(422).json(fail('无效的角色'))
      return
    }

    const requestedExamTypes: unknown[] = Array.isArray(membership?.examTypes) ? membership.examTypes : []
    const plan = membership?.plan
    if (requestedExamTypes.length > 0 && !isMembershipPlan(plan)) {
      res.status(422).json(fail('无效的会员套餐'))
      return
    }
    if (requestedExamTypes.some((examType) => !isExamType(examType))) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    const examTypes = requestedExamTypes as string[]

    const now = new Date()
    const endsAt = examTypes.length > 0 ? buildMembershipEndDate(plan, now) : null

    const user = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          role,
          ...(role === USER_ROLE.STUDENT && examTypes.length > 0
            ? { paymentStatus: USER_PAYMENT_STATUS.PAID }
            : {}),
        },
      })

      // 后台手动授权是追加语义：未选中的现有权益不在本次操作中取消。
      for (const examType of examTypes) {
        const active = await tx.userMembership.findFirst({
          where: {
            userId,
            examType,
            status: MEMBERSHIP_STATUS.ACTIVE,
            startsAt: { lte: now },
            endsAt: { gt: now },
          },
          orderBy: { endsAt: 'desc' },
        })
        if (active) {
          continue
        }
        await tx.userMembership.create({
          data: { userId, examType, plan, startsAt: now, endsAt: endsAt!, status: MEMBERSHIP_STATUS.ACTIVE },
        })
      }

      return tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          paymentStatus: true,
          diagnosticUsed: true,
          createdAt: true,
          memberships: {
            select: {
              id: true,
              examType: true,
              plan: true,
              status: true,
              startsAt: true,
              endsAt: true,
            },
            orderBy: { endsAt: 'desc' },
          },
        },
      })
    })

    res.json(success({ user: user ? formatAdminUserForClient(user) : null }))
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json(fail('用户不存在'))
      return
    }
    console.error('[admin] update access error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 成本记录
adminRouter.get('/revenue-costs/getList', async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
    const total = await prisma.revenueCost.count()
    const totalPages = Math.ceil(total / pageSize)
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
    const costs = await prisma.revenueCost.findMany({
      orderBy: { occurredAt: 'desc' },
      skip: (safePage - 1) * pageSize,
      take: pageSize,
    })
    res.json(success({
      list: costs,
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: totalPages > 0 && safePage < totalPages,
      },
    }))
  } catch (err) {
    console.error('[admin] revenue costs error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 成本导入
adminRouter.post('/revenue-costs', async (req: Request, res: Response) => {
  try {
    const parsed = parseRevenueCostPayload(req.body)
    if ('error' in parsed) {
      res.status(422).json(fail(parsed.error))
      return
    }

    const cost = await prisma.revenueCost.create({
      data: parsed.data,
    })
    res.json(success({ cost }))
  } catch (err) {
    console.error('[admin] create revenue cost error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 成本编辑
adminRouter.put('/revenue-costs/:id', async (req: Request, res: Response) => {
  try {
    const parsed = parseRevenueCostPayload(req.body)
    if ('error' in parsed) {
      res.status(422).json(fail(parsed.error))
      return
    }

    const cost = await prisma.revenueCost.update({
      where: { id: req.params.id },
      data: parsed.data,
    })
    res.json(success({ cost }))
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json(fail('成本记录不存在'))
      return
    }
    console.error('[admin] update revenue cost error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})
