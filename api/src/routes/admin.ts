import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import {
  LEGACY_MEMBERSHIP_PLAN,
  MEMBERSHIP_DURATION_DAYS,
  MEMBERSHIP_PLAN,
  MEMBERSHIP_STATUS,
  PAYMENT_ORDER_STATUS,
  USER_ROLE,
  PAYMENT_NOTIFICATION_STATUS,
  PAYMENT_RECONCILIATION_RESOLUTION,
  isRevenueCostCategory,
  isRevenueCostItemForCategory,
  isExamType,
  isMembershipPlan,
  isUserRole,
  legacyRevenueCostCategory,
  normalizeRevenueCostItem,
} from '../constants/domain.js'
import { PAYMENT_CONFIG_STATUS } from '../constants/domain.js'
import { getOrCreatePaymentConfig } from './payment.js'
import { ChinaumsRequestError } from '../services/chinaums.js'
import { config } from '../config.js'
import { parseJsonArray, parseJsonObject } from '../utils/jsonField.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
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
import {
  OPERATION_AUDIT_BLOCKED_ERROR_CODES,
  OPERATION_AUDIT_MODULE,
  OPERATION_AUDIT_MODULE_VALUES,
  OPERATION_AUDIT_RESULT,
  effectiveOperationAuditResult,
} from '../constants/operationAudit.js'
import { buildOperationAuditChanges, setOperationAuditContext } from '../middleware/operationAudit.js'
import { normalizeIpAddress } from '../utils/ipAddress.js'
import {
  BEHAVIOR_ANALYTICS_MAX_RANGE_DAYS,
  defaultBehaviorAnalyticsPeriod,
  getStudentBehaviorAnalytics,
} from '../services/behaviorAnalytics.js'
import {
  WEBSITE_TRAFFIC_MAX_RANGE_DAYS,
  defaultWebsiteTrafficPeriod,
  getWebsiteTrafficAnalytics,
} from '../services/websiteTraffic.js'
import {
  InvitationError,
  grantAdminDailyCards,
} from '../services/invitation.js'
import {
  getAdminUserDetail,
  isUserActivityModule,
} from '../services/adminUserDetail.js'
import { getAdminStaffGiftCardStats } from '../services/adminStaffStats.js'
import { getRevenuePayments } from '../services/revenuePayments.js'

export const adminRouter = createAsyncRouter()

adminRouter.use(requireAuth, requireAdmin)

// 员工管理
adminRouter.get('/staff/gift-card-stats', async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
    const keyword = typeof req.query.keyword === 'string'
      ? req.query.keyword.trim().slice(0, 100)
      : ''
    const stats = await getAdminStaffGiftCardStats({ page, pageSize, keyword })
    res.json(success(stats))
  } catch (error) {
    logRuntimeError('admin.staff.gift_card_stats_failed', error)
    res.status(500).json(fail('读取员工日卡发放统计失败'))
  }
})

function parsePaymentAmount(value: unknown): number | null {
  const amount = Number(value)
  if (!Number.isInteger(amount) || amount < 1 || amount > 100000000) return null
  return amount
}

function formatPaymentConfig(config: {
  monthlyPriceCents: number
  quarterlyOriginalPriceCents: number
  quarterlyPriceCents: number
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

// 审计列表只返回检索与定位字段，前后值仅在管理员打开详情时读取。
function formatOperationLog<T extends {
  occurredAt: Date
  createdAt: Date
  result: string
  statusCode: number
  errorCode: string | null
  changes?: unknown
}>(log: T) {
  const { changes, ...safeLog } = log
  return {
    ...safeLog,
    result: effectiveOperationAuditResult(log),
    ipAddress: normalizeIpAddress((safeLog as { ipAddress?: string | null }).ipAddress),
    hasChanges: changes !== null && changes !== undefined,
    occurredAt: log.occurredAt.toISOString(),
    createdAt: log.createdAt.toISOString(),
  }
}

type OperationActorAccountType = 'admin' | 'member' | 'regular'

// 操作人会员类型按当前有效权益派生；管理员和已删除用户无需额外查询会员记录。
async function getActiveOperationLogMemberIds(
  logs: Array<{ actorUserId: string | null; actorRoleSnapshot: string }>,
): Promise<Set<string>> {
  const userIds = [...new Set(
    logs
      .filter((log) => log.actorRoleSnapshot === USER_ROLE.STUDENT && log.actorUserId)
      .map((log) => log.actorUserId as string),
  )]
  if (userIds.length === 0) return new Set()
  const now = new Date()
  const memberships = await prisma.userMembership.findMany({
    where: {
      userId: { in: userIds },
      status: MEMBERSHIP_STATUS.ACTIVE,
      startsAt: { lte: now },
      endsAt: { gt: now },
    },
    distinct: ['userId'],
    select: { userId: true },
  })
  return new Set(memberships.map((membership) => membership.userId))
}

// 管理员保持管理员身份，学生再根据当前有效会员记录区分会员和普通用户。
function operationActorAccountType(
  log: { actorUserId: string | null; actorRoleSnapshot: string },
  activeMemberIds: Set<string>,
): OperationActorAccountType {
  if (log.actorRoleSnapshot === USER_ROLE.ADMIN) return 'admin'
  return log.actorUserId && activeMemberIds.has(log.actorUserId) ? 'member' : 'regular'
}

// 结果筛选按当前统计口径兼容历史 failure 记录，无需回填生产审计表。
function operationLogResultWhere(result: string): Prisma.OperationLogWhereInput {
  if (result === OPERATION_AUDIT_RESULT.BLOCKED) {
    return {
      OR: [
        { result: OPERATION_AUDIT_RESULT.BLOCKED },
        {
          result: OPERATION_AUDIT_RESULT.FAILURE,
          statusCode: 409,
          errorCode: { in: [...OPERATION_AUDIT_BLOCKED_ERROR_CODES] },
        },
      ],
    }
  }
  if (result === OPERATION_AUDIT_RESULT.FAILURE) {
    return {
      result: OPERATION_AUDIT_RESULT.FAILURE,
      OR: [
        { statusCode: { not: 409 } },
        { errorCode: null },
        { errorCode: { notIn: [...OPERATION_AUDIT_BLOCKED_ERROR_CODES] } },
      ],
    }
  }
  return result ? { result } : {}
}

interface OperationResourceDisplay {
  name: string
  email?: string | null
}

// 当前页按对象类型批量查询可读名称和关联邮箱，避免列表逐行查询造成 N+1 压力。
async function getOperationResourceDisplays(
  logs: Array<{ resourceType: string | null; resourceId: string | null }>,
): Promise<Map<string, OperationResourceDisplay>> {
  const idsFor = (resourceType: string) => [...new Set(
    logs
      .filter((log) => log.resourceType === resourceType && log.resourceId)
      .map((log) => log.resourceId as string),
  )]
  const userIds = idsFor('User')
  const examRecordIds = idsFor('ExamRecord')
  const paperIds = idsFor('Paper')
  const studyResourceKeys = idsFor('StudyResource')
  const paymentOrderIds = idsFor('PaymentOrder')
  const mockPaperSetIds = idsFor('MockPaperSet')
  const revenueCostIds = idsFor('RevenueCost')
  const syllabusIds = idsFor('Syllabus')

  const [users, examRecords, papers, studyResources, paymentOrders, mockPaperSets, revenueCosts, syllabuses] = await Promise.all([
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true, email: true },
        })
      : Promise.resolve([]),
    examRecordIds.length
      ? prisma.examRecord.findMany({
          where: { id: { in: examRecordIds } },
          select: { id: true, paper: { select: { title: true } } },
        })
      : Promise.resolve([]),
    paperIds.length
      ? prisma.paper.findMany({ where: { id: { in: paperIds } }, select: { id: true, title: true } })
      : Promise.resolve([]),
    studyResourceKeys.length
      ? prisma.studyResource.findMany({
          where: { bundleKey: { in: studyResourceKeys } },
          select: { bundleKey: true, title: true },
          distinct: ['bundleKey'],
        })
      : Promise.resolve([]),
    paymentOrderIds.length
      ? prisma.paymentOrder.findMany({
          where: { OR: [{ id: { in: paymentOrderIds } }, { orderNo: { in: paymentOrderIds } }] },
          select: { id: true, orderNo: true, user: { select: { username: true, email: true } } },
        })
      : Promise.resolve([]),
    mockPaperSetIds.length
      ? prisma.mockPaperSet.findMany({ where: { id: { in: mockPaperSetIds } }, select: { id: true, title: true } })
      : Promise.resolve([]),
    revenueCostIds.length
      ? prisma.revenueCost.findMany({
          where: { id: { in: revenueCostIds } },
          select: { id: true, rechargeItem: true, amount: true },
        })
      : Promise.resolve([]),
    syllabusIds.length
      ? prisma.syllabus.findMany({ where: { id: { in: syllabusIds } }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ])

  const displays = new Map<string, OperationResourceDisplay>()
  users.forEach((user) => displays.set(`User:${user.id}`, { name: user.username, email: user.email }))
  examRecords.forEach((record) => displays.set(`ExamRecord:${record.id}`, { name: record.paper.title }))
  papers.forEach((paper) => displays.set(`Paper:${paper.id}`, { name: paper.title }))
  studyResources.forEach((resource) => displays.set(`StudyResource:${resource.bundleKey}`, { name: resource.title }))
  paymentOrders.forEach((order) => {
    const label = `${order.orderNo} · ${order.user.username}`
    const display = { name: label, email: order.user.email }
    displays.set(`PaymentOrder:${order.id}`, display)
    displays.set(`PaymentOrder:${order.orderNo}`, display)
  })
  mockPaperSets.forEach((paper) => displays.set(`MockPaperSet:${paper.id}`, { name: paper.title }))
  revenueCosts.forEach((cost) => displays.set(`RevenueCost:${cost.id}`, {
    name: `${cost.rechargeItem} · ¥${cost.amount.toFixed(2)}`,
  }))
  syllabuses.forEach((syllabus) => displays.set(`Syllabus:${syllabus.id}`, { name: syllabus.name }))
  return displays
}

// 对象已删除时从审计摘要保留的中文引号内容恢复名称，编码继续作为次要定位信息。
function resourceDisplayNameFromSummary(summary: string): string | null {
  return summary.match(/“([^”]+)”/)?.[1]?.trim() || null
}

// 时间筛选只接受有效 ISO 日期，避免无效 Date 进入 Prisma 查询。
function parseOperationLogDate(value: unknown): Date | null | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

// 网站访问分析
adminRouter.get('/traffic-analytics', async (req, res) => {
  const requestedStartAt = parseOperationLogDate(req.query.startAt)
  const requestedEndAt = parseOperationLogDate(req.query.endAt)

  if (requestedStartAt === null || requestedEndAt === null) {
    res.status(422).json(fail('无效的时间范围'))
    return
  }
  if ((requestedStartAt === undefined) !== (requestedEndAt === undefined)) {
    res.status(422).json(fail('开始时间和结束时间必须同时提供'))
    return
  }

  const defaults = defaultWebsiteTrafficPeriod()
  const startAt = requestedStartAt || defaults.startAt
  const endAt = requestedEndAt || defaults.endAt
  const durationMs = endAt.getTime() - startAt.getTime()
  const maxDurationMs = WEBSITE_TRAFFIC_MAX_RANGE_DAYS * 24 * 60 * 60 * 1000
  if (durationMs <= 0) {
    res.status(422).json(fail('结束时间必须晚于开始时间'))
    return
  }
  if (durationMs > maxDurationMs) {
    res.status(422).json(fail(`统计时间范围不能超过 ${WEBSITE_TRAFFIC_MAX_RANGE_DAYS} 天`))
    return
  }

  res.json(success(await getWebsiteTrafficAnalytics({ startAt, endAt })))
})

// 学生行为分析
adminRouter.get('/behavior-analytics', async (req, res) => {
  const requestedStartAt = parseOperationLogDate(req.query.startAt)
  const requestedEndAt = parseOperationLogDate(req.query.endAt)
  const module = typeof req.query.module === 'string' ? req.query.module.trim() : ''

  if (requestedStartAt === null || requestedEndAt === null) {
    res.status(422).json(fail('无效的时间范围'))
    return
  }
  if ((requestedStartAt === undefined) !== (requestedEndAt === undefined)) {
    res.status(422).json(fail('开始时间和结束时间必须同时提供'))
    return
  }
  if (module === OPERATION_AUDIT_MODULE.AUTH) {
    res.status(422).json(fail('用户行为分析不统计认证登录模块'))
    return
  }
  if (module && !OPERATION_AUDIT_MODULE_VALUES.some((value) => value === module)) {
    res.status(422).json(fail('无效的操作模块'))
    return
  }
  const defaults = defaultBehaviorAnalyticsPeriod()
  const startAt = requestedStartAt || defaults.startAt
  const endAt = requestedEndAt || defaults.endAt
  const durationMs = endAt.getTime() - startAt.getTime()
  const maxDurationMs = BEHAVIOR_ANALYTICS_MAX_RANGE_DAYS * 24 * 60 * 60 * 1000
  if (durationMs <= 0) {
    res.status(422).json(fail('结束时间必须晚于开始时间'))
    return
  }
  if (durationMs > maxDurationMs) {
    res.status(422).json(fail(`统计时间范围不能超过 ${BEHAVIOR_ANALYTICS_MAX_RANGE_DAYS} 天`))
    return
  }

  const analytics = await getStudentBehaviorAnalytics({
    startAt,
    endAt,
    ...(module ? { module } : {}),
  })
  res.json(success(analytics))
})

// 操作日志
adminRouter.get('/operation-logs', async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1)
  const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
  const role = typeof req.query.role === 'string' ? req.query.role.trim() : ''
  const module = typeof req.query.module === 'string' ? req.query.module.trim() : ''
  const result = typeof req.query.result === 'string' ? req.query.result.trim() : ''
  const action = typeof req.query.action === 'string' ? req.query.action.trim().slice(0, 128) : ''
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim().slice(0, 100) : ''
  const startAt = parseOperationLogDate(req.query.startAt)
  const endAt = parseOperationLogDate(req.query.endAt)

  if (role && role !== 'all' && !isUserRole(role)) {
    res.status(422).json(fail('无效的用户角色'))
    return
  }
  if (module && !OPERATION_AUDIT_MODULE_VALUES.some((value) => value === module)) {
    res.status(422).json(fail('无效的操作模块'))
    return
  }
  if (result && !Object.values(OPERATION_AUDIT_RESULT).some((value) => value === result)) {
    res.status(422).json(fail('无效的操作结果'))
    return
  }
  if (startAt === null || endAt === null || (startAt && endAt && startAt > endAt)) {
    res.status(422).json(fail('无效的时间范围'))
    return
  }

  // 关键词按完整标识精确匹配，避免短用户名同时命中其他人的邮箱或请求编号。
  const where: Prisma.OperationLogWhereInput = {
    ...(role && role !== 'all' ? { actorRoleSnapshot: role } : {}),
    ...(module ? { module } : {}),
    ...operationLogResultWhere(result),
    ...(action ? { action } : {}),
    ...(startAt || endAt
      ? { occurredAt: { ...(startAt ? { gte: startAt } : {}), ...(endAt ? { lte: endAt } : {}) } }
      : {}),
    ...(keyword
      ? {
          OR: [
            { actorNameSnapshot: { equals: keyword } },
            { actorEmailSnapshot: { equals: keyword } },
            { resourceId: { equals: keyword } },
            { requestId: { equals: keyword } },
          ],
        }
      : {}),
  }
  const total = await prisma.operationLog.count({ where })
  const totalPages = Math.ceil(total / pageSize)
  const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
  const list = await prisma.operationLog.findMany({
    where,
    orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  })
  const [resourceDisplays, activeMemberIds] = await Promise.all([
    getOperationResourceDisplays(list),
    getActiveOperationLogMemberIds(list),
  ])
  res.json(success({
    list: list.map((log) => {
      const resourceDisplay = log.resourceType && log.resourceId
        ? resourceDisplays.get(`${log.resourceType}:${log.resourceId}`)
        : undefined
      return {
        ...formatOperationLog(log),
        actorAccountType: operationActorAccountType(log, activeMemberIds),
        resourceDisplayName: log.resourceType && log.resourceId
          ? resourceDisplay?.name || resourceDisplayNameFromSummary(log.summary)
          : null,
        resourceDisplayEmail: resourceDisplay?.email || null,
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
})

// 操作日志详情
adminRouter.get('/operation-logs/:id', async (req, res) => {
  const log = await prisma.operationLog.findUnique({ where: { id: req.params.id } })
  if (!log) {
    res.status(404).json(fail('操作日志不存在'))
    return
  }
  const activeMemberIds = await getActiveOperationLogMemberIds([log])
  res.json(success({
    ...log,
    actorAccountType: operationActorAccountType(log, activeMemberIds),
    result: effectiveOperationAuditResult(log),
    ipAddress: normalizeIpAddress(log.ipAddress),
    occurredAt: log.occurredAt.toISOString(),
    createdAt: log.createdAt.toISOString(),
  }))
})

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
    logRuntimeError('admin.payment_config.read_failed', error)
    res.status(500).json(fail('获取支付策略失败'))
  }
})

// 保存支付策略后，前台支付弹窗立即读取最新价格。
adminRouter.put('/payment-config', async (req, res) => {
  try {
    const monthlyPriceCents = parsePaymentAmount(req.body.monthlyPriceCents)
    const quarterlyOriginalPriceCents = parsePaymentAmount(req.body.quarterlyOriginalPriceCents)
    const quarterlyPriceCents = parsePaymentAmount(req.body.quarterlyPriceCents)
    const status = req.body.status
    if (monthlyPriceCents === null || quarterlyOriginalPriceCents === null || quarterlyPriceCents === null) {
      res.status(422).json(fail('价格必须是大于 0 的整数分'))
      return
    }
    if (status !== PAYMENT_CONFIG_STATUS.ACTIVE && status !== PAYMENT_CONFIG_STATUS.INACTIVE) {
      res.status(422).json(fail('无效的支付策略状态'))
      return
    }
    if (quarterlyPriceCents > quarterlyOriginalPriceCents) {
      res.status(422).json(fail('季卡折扣价不能高于季卡原价'))
      return
    }

    const previousConfig = await getOrCreatePaymentConfig()
    const config = await prisma.paymentConfig.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        monthlyPriceCents,
        quarterlyOriginalPriceCents,
        quarterlyPriceCents,
        status,
        updatedBy: req.user!.userId,
      },
      update: {
        monthlyPriceCents,
        quarterlyOriginalPriceCents,
        quarterlyPriceCents,
        status,
        updatedBy: req.user!.userId,
      },
    })
    setOperationAuditContext(req, {
      resourceId: config.id,
      changes: buildOperationAuditChanges(
        {
          monthlyPriceCents: previousConfig.monthlyPriceCents,
          quarterlyOriginalPriceCents: previousConfig.quarterlyOriginalPriceCents,
          quarterlyPriceCents: previousConfig.quarterlyPriceCents,
          status: previousConfig.status,
        },
        { monthlyPriceCents, quarterlyOriginalPriceCents, quarterlyPriceCents, status },
      ),
    })
    res.json(success(formatPaymentConfig(config)))
  } catch (error) {
    logRuntimeError('admin.payment_config.update_failed', error)
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
    logRuntimeError('admin.payment_orders.list_failed', error)
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
    const [notifications, memberships, invitationRewards] = await Promise.all([
      prisma.paymentNotification.findMany({
        where: { orderNo: order.orderNo },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.userMembership.findMany({
        where: { paymentOrderId: order.id },
        orderBy: [{ examType: 'asc' }, { endsAt: 'desc' }],
      }),
      prisma.invitationReward.findMany({
        where: { triggerPaymentOrderId: order.id },
        select: {
          id: true,
          beneficiaryRole: true,
          status: true,
          examType: true,
          revokedAt: true,
          user: { select: { username: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
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
    const isInternalEntitlementOrder = order.provider === 'internal' && order.amountCents === 0
    if (isInternalEntitlementOrder && order.status === PAYMENT_ORDER_STATUS.REFUNDED) {
      timeline.push({
        id: `entitlement-revoked-${order.id}`,
        category: 'entitlement',
        title: order.priceType === 'invitation_reward' ? '邀请奖励权益已撤回' : '内部赠送权益已撤回',
        description: order.priceType === 'invitation_reward'
          ? '触发邀请奖励的真实支付订单已退款'
          : '关联权益已由系统撤回',
        status: PAYMENT_ORDER_STATUS.REFUNDED,
        occurredAt: order.updatedAt.toISOString(),
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

    invitationRewards.forEach((reward) => {
      if (reward.status !== 'revoked' || !reward.revokedAt) return
      timeline.push({
        id: `invitation-reward-revoked-${reward.id}`,
        category: 'entitlement',
        title: '邀请周卡奖励已撤回',
        description: `${reward.user.username} · ${reward.beneficiaryRole === 'inviter' ? '邀请人' : '受邀人'} · ${reward.examType || '未选择考试'}`,
        status: reward.status,
        occurredAt: reward.revokedAt.toISOString(),
        actor: null,
      })
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
        associationBasis: 'payment_order',
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
    logRuntimeError('admin.payment_order.detail_failed', error)
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
    logRuntimeError('admin.payment_refund.create_failed', error)
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
    logRuntimeError('admin.payment_refund.query_failed', error)
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
    logRuntimeError('admin.payment_reconciliation.overview_failed', error)
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
    logRuntimeError('admin.payment_reconciliation.items_failed', error)
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
    logRuntimeError('admin.payment_reconciliation.run_failed', error)
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
    logRuntimeError('admin.payment_reconciliation.recheck_failed', error)
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
    logRuntimeError('admin.payment_reconciliation.resolve_failed', error)
    res.status(500).json(fail('标记异常处理结果失败', 'RECONCILIATION_RESOLVE_FAILED'))
  }
})

interface RevenueCostPayload {
  costCategory: string
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
  if (plan === LEGACY_MEMBERSHIP_PLAN.YEARLY) {
    const legacyEnd = new Date(start)
    legacyEnd.setFullYear(legacyEnd.getFullYear() + 1)
    return legacyEnd
  }
  const durationDays = plan === MEMBERSHIP_PLAN.QUARTERLY
    ? MEMBERSHIP_DURATION_DAYS.quarterly
    : MEMBERSHIP_DURATION_DAYS.monthly
  return new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000)
}

function formatAdminUserForClient<T extends { role: string; memberships?: any[] }>(user: T) {
  if (!user.memberships) return user
  return {
    ...user,
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
    costCategory,
    rechargeItem,
    amount,
    operator,
    occurredAt,
    reimbursementStatus = 'unreimbursed',
    remark,
  } = body
  const numericAmount = Number(amount)
  const costDate = new Date(String(occurredAt))
  const normalizedRechargeItem = normalizeRevenueCostItem(rechargeItem)
  const normalizedCostCategory = typeof costCategory === 'string' && costCategory.trim()
    ? costCategory.trim()
    : legacyRevenueCostCategory(rechargeItem)
  const normalizedOperator = typeof operator === 'string' ? operator.trim() : ''
  const normalizedReimbursementStatus = typeof reimbursementStatus === 'string' ? reimbursementStatus.trim() : ''
  const normalizedRemark = typeof remark === 'string' && remark.trim() ? remark.trim() : null

  if (!isRevenueCostCategory(normalizedCostCategory)) {
    return { error: '无效的成本分类' }
  }
  if (!isRevenueCostItemForCategory(normalizedCostCategory, normalizedRechargeItem)) {
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
      costCategory: normalizedCostCategory,
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
    const keyword = typeof req.query.keyword === 'string'
      ? req.query.keyword.trim().slice(0, 100)
      : ''
    const where: Prisma.UserWhereInput = keyword
      ? { username: { contains: keyword } }
      : {}
    const total = await prisma.user.count({ where })
    const totalPages = Math.ceil(total / pageSize)
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
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
    logRuntimeError('admin.users.list_failed', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 用户详情
adminRouter.get('/users/:id/detail', async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 10, 50)
    const module = req.query.module
    if (module !== undefined && !isUserActivityModule(module)) {
      res.status(422).json(fail('用户活动模块参数无效', 'ADMIN_USER_MODULE_INVALID'))
      return
    }
    const detail = await getAdminUserDetail(req.params.id, { page, pageSize, module })
    if (!detail) {
      res.status(404).json(fail('用户不存在', 'ADMIN_USER_NOT_FOUND'))
      return
    }
    res.json(success(detail))
  } catch (error) {
    logRuntimeError('admin.user.detail_failed', error)
    res.status(500).json(fail('读取用户详情失败'))
  }
})

// 管理员赠送日卡只发放待启用卡券，会员权益与零元支付订单均由用户启用时创建。
adminRouter.post('/users/:id/gift-cards', async (req: Request, res: Response) => {
  try {
    if (req.body?.cardType !== 'daily') {
      res.status(422).json(fail('当前仅支持赠送日卡', 'ADMIN_GIFT_CARD_TYPE_INVALID'))
      return
    }
    const quantity = Number(req.body?.quantity)
    const result = await grantAdminDailyCards({
      userId: req.params.id,
      operatorId: req.user!.userId,
      quantity,
    })
    setOperationAuditContext(req, {
      resourceId: result.recipient.id,
      summary: `向用户“${result.recipient.username}”赠送 ${result.rewards.length} 张日卡`,
      changes: buildOperationAuditChanges(
        { pendingDailyCardsAdded: 0, giftCardRewardIds: [] },
        {
          pendingDailyCardsAdded: result.rewards.length,
          giftCardRewardIds: result.rewards.map((reward) => reward.id),
        },
      ),
    })
    res.json(success({
      createdCount: result.rewards.length,
      rewardIds: result.rewards.map((reward) => reward.id),
      grantedAt: result.grantedAt.toISOString(),
    }))
  } catch (error) {
    if (error instanceof InvitationError) {
      res.status(error.httpStatus).json(fail(error.message, error.code))
      return
    }
    logRuntimeError('admin.user.gift_cards_failed', error)
    res.status(500).json(fail('赠送卡券失败'))
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

    const previousUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, role: true },
    })
    if (!previousUser) {
      res.status(404).json(fail('用户不存在'))
      return
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, username: true, email: true, role: true },
    })
    setOperationAuditContext(req, {
      summary: `修改用户“${user.username}”的角色`,
      changes: buildOperationAuditChanges({ role: previousUser.role }, { role: user.role }),
    })
    res.json(success({ user: formatAdminUserForClient(user) }))
  } catch (err) {
    logRuntimeError('admin.user.role_update_failed', err)
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
    const examTypes = [...new Set(requestedExamTypes as string[])]

    const previousUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        role: true,
        memberships: {
          select: { examType: true, plan: true, status: true, startsAt: true, endsAt: true },
          orderBy: [{ examType: 'asc' }, { endsAt: 'desc' }],
        },
      },
    })
    if (!previousUser) {
      res.status(404).json(fail('用户不存在'))
      return
    }

    const now = new Date()
    const endsAt = examTypes.length > 0 ? buildMembershipEndDate(plan, now) : null

    const user = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { role },
      })

      // 当前生效但已被移除的权益截止到保存时刻，历史记录保留用于审计和展示。
      await tx.userMembership.updateMany({
        where: {
          userId,
          status: MEMBERSHIP_STATUS.ACTIVE,
          startsAt: { lte: now },
          endsAt: { gt: now },
          ...(examTypes.length > 0 ? { examType: { notIn: examTypes } } : {}),
        },
        data: {
          status: MEMBERSHIP_STATUS.CANCELLED,
          endsAt: now,
        },
      })

      // 尚未开始且已被移除的预约权益只更新状态，保留原计划日期并避免出现结束早于开始。
      await tx.userMembership.updateMany({
        where: {
          userId,
          status: MEMBERSHIP_STATUS.ACTIVE,
          startsAt: { gt: now },
          endsAt: { gt: now },
          ...(examTypes.length > 0 ? { examType: { notIn: examTypes } } : {}),
        },
        data: {
          status: MEMBERSHIP_STATUS.CANCELLED,
        },
      })

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
          if (active.plan !== plan) {
            await tx.userMembership.update({
              where: { id: active.id },
              data: {
                plan,
                startsAt: now,
                endsAt: endsAt!,
              },
            })
          }
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

    if (user) {
      setOperationAuditContext(req, {
        summary: `修改用户“${user.username}”的权限`,
        changes: buildOperationAuditChanges(
          {
            role: previousUser.role,
            memberships: previousUser.memberships,
          },
          {
            role: user.role,
            memberships: user.memberships.map((membership) => ({
              examType: membership.examType,
              plan: membership.plan,
              status: membership.status,
              startsAt: membership.startsAt,
              endsAt: membership.endsAt,
            })),
          },
        ),
      })
    }
    res.json(success({ user: user ? formatAdminUserForClient(user) : null }))
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json(fail('用户不存在'))
      return
    }
    logRuntimeError('admin.user.access_update_failed', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 真实支付营收
adminRouter.get('/revenue-payments', async (req: Request, res: Response) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 10, 100)
    const result = await getRevenuePayments({ page, pageSize })
    res.json(success(result))
  } catch (error) {
    logRuntimeError('admin.revenue_payments.list_failed', error)
    res.status(500).json(fail('读取真实支付营收失败'))
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
    logRuntimeError('admin.revenue_costs.list_failed', err)
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
    setOperationAuditContext(req, {
      resourceId: cost.id,
      summary: `新增成本记录“${cost.rechargeItem}”`,
    })
    res.json(success({ cost }))
  } catch (err) {
    logRuntimeError('admin.revenue_cost.create_failed', err)
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

    const previousCost = await prisma.revenueCost.findUnique({ where: { id: req.params.id } })
    if (!previousCost) {
      res.status(404).json(fail('成本记录不存在'))
      return
    }
    const cost = await prisma.revenueCost.update({
      where: { id: req.params.id },
      data: parsed.data,
    })
    setOperationAuditContext(req, {
      summary: `修改成本记录“${cost.rechargeItem}”`,
      changes: buildOperationAuditChanges(
        {
          costCategory: previousCost.costCategory,
          rechargeItem: previousCost.rechargeItem,
          amount: previousCost.amount,
          operator: previousCost.operator,
          occurredAt: previousCost.occurredAt,
          reimbursementStatus: previousCost.reimbursementStatus,
          remark: previousCost.remark,
        },
        {
          costCategory: cost.costCategory,
          rechargeItem: cost.rechargeItem,
          amount: cost.amount,
          operator: cost.operator,
          occurredAt: cost.occurredAt,
          reimbursementStatus: cost.reimbursementStatus,
          remark: cost.remark,
        },
      ),
    })
    res.json(success({ cost }))
  } catch (err: any) {
    if (err?.code === 'P2025') {
      res.status(404).json(fail('成本记录不存在'))
      return
    }
    logRuntimeError('admin.revenue_cost.update_failed', err)
    res.status(500).json(fail('服务器错误'))
  }
})
