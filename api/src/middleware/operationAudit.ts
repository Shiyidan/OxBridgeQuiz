// 操作审计中间件：为明确纳入审计的关键用户操作保存身份快照、结果和白名单变更。
import type { Request, RequestHandler, Response } from 'express'
import type { Prisma, User } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import {
  OPERATION_AUDIT_MODULE,
  OPERATION_AUDIT_RESULT,
  type OperationAuditModule,
} from '../constants/operationAudit.js'
import { normalizeIpAddress } from '../utils/ipAddress.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'

type AuditJsonValue = string | number | boolean | null | AuditJsonValue[] | { [key: string]: AuditJsonValue }

export type OperationAuditChanges = Record<string, {
  before: AuditJsonValue
  after: AuditJsonValue
}>

interface OperationAuditActor {
  userId: string
  username: string
  email: string
  role: string
}

interface OperationAuditContext {
  actor?: OperationAuditActor
  summary?: string
  resourceType?: string
  resourceId?: string
  changes?: OperationAuditChanges
}

interface OperationDefinition {
  method: string
  pattern: RegExp
  module: OperationAuditModule
  action: string
  summary: string
  resourceType?: string
  resourceIdGroup?: number
}

declare global {
  namespace Express {
    interface Request {
      operationAudit?: OperationAuditContext
    }
  }
}

const OPERATION_DEFINITIONS: OperationDefinition[] = [
  { method: 'POST', pattern: /^\/api\/auth\/register$/, module: OPERATION_AUDIT_MODULE.AUTH, action: 'auth.register', summary: '注册账号', resourceType: 'User' },
  { method: 'POST', pattern: /^\/api\/auth\/login$/, module: OPERATION_AUDIT_MODULE.AUTH, action: 'auth.login', summary: '登录账号', resourceType: 'User' },
  { method: 'POST', pattern: /^\/api\/auth\/password\/reset$/, module: OPERATION_AUDIT_MODULE.AUTH, action: 'auth.password.reset', summary: '重置密码', resourceType: 'User' },
  { method: 'POST', pattern: /^\/api\/auth\/password\/change$/, module: OPERATION_AUDIT_MODULE.AUTH, action: 'auth.password.change', summary: '修改密码', resourceType: 'User' },
  { method: 'PUT', pattern: /^\/api\/auth\/profile$/, module: OPERATION_AUDIT_MODULE.PROFILE, action: 'profile.update', summary: '修改个人资料', resourceType: 'User' },
  { method: 'POST', pattern: /^\/api\/auth\/logout$/, module: OPERATION_AUDIT_MODULE.AUTH, action: 'auth.logout', summary: '退出当前设备', resourceType: 'User' },
  { method: 'POST', pattern: /^\/api\/auth\/logout-all$/, module: OPERATION_AUDIT_MODULE.AUTH, action: 'auth.logout_all', summary: '退出全部设备', resourceType: 'User' },
  { method: 'DELETE', pattern: /^\/api\/auth\/sessions\/([^/]+)$/, module: OPERATION_AUDIT_MODULE.AUTH, action: 'auth.session.revoke', summary: '移除登录设备', resourceType: 'AuthSession', resourceIdGroup: 1 },
  { method: 'PUT', pattern: /^\/api\/getMember\/study-preferences$/, module: OPERATION_AUDIT_MODULE.PROFILE, action: 'profile.study_preferences.update', summary: '修改全局学习偏好', resourceType: 'User' },
  { method: 'POST', pattern: /^\/api\/exams\/start$/, module: OPERATION_AUDIT_MODULE.EXAM, action: 'exam.start', summary: '开始考试', resourceType: 'ExamRecord' },
  { method: 'POST', pattern: /^\/api\/exams\/([^/]+)\/submit$/, module: OPERATION_AUDIT_MODULE.EXAM, action: 'exam.submit', summary: '提交考试', resourceType: 'ExamRecord', resourceIdGroup: 1 },
  { method: 'GET', pattern: /^\/api\/exams\/([^/]+)\/diagnostic-report\/summary$/, module: OPERATION_AUDIT_MODULE.EXAM, action: 'diagnostic_report.view', summary: '查看诊断分析报告', resourceType: 'ExamRecord', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/exams\/error-book\/visit$/, module: OPERATION_AUDIT_MODULE.EXAM, action: 'mistake_notebook.view', summary: '查看错题本' },
  { method: 'POST', pattern: /^\/api\/payment\/orders$/, module: OPERATION_AUDIT_MODULE.PAYMENT, action: 'payment.order.create', summary: '创建支付订单', resourceType: 'PaymentOrder' },
  { method: 'POST', pattern: /^\/api\/payment\/orders\/([^/]+)\/close$/, module: OPERATION_AUDIT_MODULE.PAYMENT, action: 'payment.order.close', summary: '关闭支付订单', resourceType: 'PaymentOrder', resourceIdGroup: 1 },
  { method: 'PUT', pattern: /^\/api\/admin\/payment-config$/, module: OPERATION_AUDIT_MODULE.PAYMENT, action: 'admin.payment_config.update', summary: '修改支付策略', resourceType: 'PaymentConfig' },
  { method: 'POST', pattern: /^\/api\/admin\/payment-orders\/([^/]+)\/refunds$/, module: OPERATION_AUDIT_MODULE.PAYMENT, action: 'admin.payment_refund.create', summary: '发起支付退款', resourceType: 'PaymentOrder', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/admin\/payment-refunds\/([^/]+)\/query$/, module: OPERATION_AUDIT_MODULE.PAYMENT, action: 'admin.payment_refund.query', summary: '查询退款结果', resourceType: 'PaymentRefund', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/admin\/payment-reconciliation\/runs$/, module: OPERATION_AUDIT_MODULE.PAYMENT, action: 'admin.payment_reconciliation.run', summary: '执行支付对账', resourceType: 'PaymentReconciliationRun' },
  { method: 'POST', pattern: /^\/api\/admin\/payment-reconciliation\/items\/([^/]+)\/recheck$/, module: OPERATION_AUDIT_MODULE.PAYMENT, action: 'admin.payment_reconciliation.recheck', summary: '复核支付异常', resourceType: 'PaymentReconciliationItem', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/admin\/payment-reconciliation\/items\/([^/]+)\/resolve$/, module: OPERATION_AUDIT_MODULE.PAYMENT, action: 'admin.payment_reconciliation.resolve', summary: '关闭支付异常', resourceType: 'PaymentReconciliationItem', resourceIdGroup: 1 },
  { method: 'PUT', pattern: /^\/api\/admin\/users\/([^/]+)\/role$/, module: OPERATION_AUDIT_MODULE.USER, action: 'admin.user.role.update', summary: '修改用户角色', resourceType: 'User', resourceIdGroup: 1 },
  { method: 'PUT', pattern: /^\/api\/admin\/users\/([^/]+)\/access$/, module: OPERATION_AUDIT_MODULE.USER, action: 'admin.user.access.update', summary: '修改用户权限', resourceType: 'User', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/admin\/users\/([^/]+)\/gift-cards$/, module: OPERATION_AUDIT_MODULE.USER, action: 'admin.user.gift_cards.create', summary: '向用户赠送卡券', resourceType: 'User', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/admin\/revenue-costs$/, module: OPERATION_AUDIT_MODULE.REVENUE, action: 'admin.revenue_cost.create', summary: '新增成本记录', resourceType: 'RevenueCost' },
  { method: 'PUT', pattern: /^\/api\/admin\/revenue-costs\/([^/]+)$/, module: OPERATION_AUDIT_MODULE.REVENUE, action: 'admin.revenue_cost.update', summary: '修改成本记录', resourceType: 'RevenueCost', resourceIdGroup: 1 },
  { method: 'PUT', pattern: /^\/api\/papers\/([^/]+)$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.paper.update', summary: '修改试卷', resourceType: 'Paper', resourceIdGroup: 1 },
  { method: 'DELETE', pattern: /^\/api\/papers\/([^/]+)$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.paper.delete', summary: '删除试卷', resourceType: 'Paper', resourceIdGroup: 1 },
  { method: 'PUT', pattern: /^\/api\/papers\/([^/]+)\/publish$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.paper.publish', summary: '发布试卷', resourceType: 'Paper', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/papers\/import-json$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.paper.import_json', summary: '导入 JSON 试卷', resourceType: 'Paper' },
  { method: 'POST', pattern: /^\/api\/papers\/import-markdown$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.paper.import_markdown', summary: '导入 Markdown 试卷', resourceType: 'Paper' },
  { method: 'POST', pattern: /^\/api\/papers\/syllabus-library$/, module: OPERATION_AUDIT_MODULE.SYLLABUS, action: 'admin.syllabus.create', summary: '上传考纲', resourceType: 'Syllabus' },
  { method: 'PUT', pattern: /^\/api\/papers\/syllabus-library\/([^/]+)\/enable$/, module: OPERATION_AUDIT_MODULE.SYLLABUS, action: 'admin.syllabus.enable', summary: '启用考纲', resourceType: 'Syllabus', resourceIdGroup: 1 },
  { method: 'PUT', pattern: /^\/api\/papers\/syllabus-library\/([^/]+)\/disable$/, module: OPERATION_AUDIT_MODULE.SYLLABUS, action: 'admin.syllabus.disable', summary: '停用考纲', resourceType: 'Syllabus', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/upload\/paper-pages\/create$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.paper.upload_create', summary: '创建上传试卷', resourceType: 'Paper' },
  { method: 'POST', pattern: /^\/api\/mock-paper-sets\/import$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.mock_paper.import', summary: '上传模考组卷清单', resourceType: 'MockPaperSet' },
  { method: 'PUT', pattern: /^\/api\/mock-paper-sets\/([^/]+)$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.mock_paper.update', summary: '修改模考卷草稿', resourceType: 'MockPaperSet', resourceIdGroup: 1 },
  { method: 'PUT', pattern: /^\/api\/mock-paper-sets\/([^/]+)\/questions\/([^/]+)$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.mock_paper.question_replace', summary: '替换模考卷题目', resourceType: 'MockPaperSet', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/mock-paper-sets\/([^/]+)\/publish$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.mock_paper.publish', summary: '发布模考试卷', resourceType: 'MockPaperSet', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/mock-paper-sets\/([^/]+)\/archive$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.mock_paper.archive', summary: '下线模考试卷', resourceType: 'MockPaperSet', resourceIdGroup: 1 },
  { method: 'DELETE', pattern: /^\/api\/mock-paper-sets\/([^/]+)$/, module: OPERATION_AUDIT_MODULE.PAPER, action: 'admin.mock_paper.delete', summary: '删除模考卷草稿', resourceType: 'MockPaperSet', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/mock-exams\/papers\/([^/]+)\/attempts$/, module: OPERATION_AUDIT_MODULE.EXAM, action: 'mock_exam.start', summary: '开始无限模考', resourceType: 'MockPaperSet', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/mock-exams\/modules\/([^/]+)\/attempts$/, module: OPERATION_AUDIT_MODULE.EXAM, action: 'mock_exam.single_start', summary: '开始单项模考', resourceType: 'MockPaperModule', resourceIdGroup: 1 },
  { method: 'DELETE', pattern: /^\/api\/mock-exams\/attempts\/([^/]+)$/, module: OPERATION_AUDIT_MODULE.EXAM, action: 'mock_exam.abandon', summary: '放弃无限模考', resourceType: 'ExamRecord', resourceIdGroup: 1 },
  { method: 'POST', pattern: /^\/api\/study-resources\/admin\/upload$/, module: OPERATION_AUDIT_MODULE.RESOURCE, action: 'admin.study_resource.upload', summary: '上传学习资料', resourceType: 'StudyResource' },
  { method: 'POST', pattern: /^\/api\/study-resources\/admin\/upload-past-paper$/, module: OPERATION_AUDIT_MODULE.RESOURCE, action: 'admin.study_resource.past_paper_upload', summary: '上传年度真题资料组', resourceType: 'StudyResource' },
  { method: 'PUT', pattern: /^\/api\/study-resources\/admin\/bundles\/([^/]+)\/status$/, module: OPERATION_AUDIT_MODULE.RESOURCE, action: 'admin.study_resource.status_update', summary: '更新学习资料发布状态', resourceType: 'StudyResource', resourceIdGroup: 1 },
  { method: 'DELETE', pattern: /^\/api\/study-resources\/admin\/bundles\/([^/]+)$/, module: OPERATION_AUDIT_MODULE.RESOURCE, action: 'admin.study_resource.delete', summary: '删除学习资料', resourceType: 'StudyResource', resourceIdGroup: 1 },
]

// 审计 JSON 只接受有限结构，避免 Date、undefined 或超大业务对象直接写入数据库。
function normalizeAuditValue(value: unknown, depth = 0): AuditJsonValue {
  if (depth > 5) return '[内容层级过深]'
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value.slice(0, 2000)
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value)
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => normalizeAuditValue(item, depth + 1))
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 100)
        .map(([key, item]) => [key, normalizeAuditValue(item, depth + 1)]),
    )
  }
  return String(value)
}

// 对比只基于调用方给出的白名单字段，避免把密码、令牌或完整业务对象带入审计记录。
export function buildOperationAuditChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): OperationAuditChanges | undefined {
  const changes: OperationAuditChanges = {}
  const fields = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const field of fields) {
    const beforeValue = normalizeAuditValue(before[field])
    const afterValue = normalizeAuditValue(after[field])
    if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) continue
    changes[field] = { before: beforeValue, after: afterValue }
  }
  return Object.keys(changes).length > 0 ? changes : undefined
}

// 登录、注册和重置密码在认证中间件之外完成，通过成功结果补充可审计身份。
export function setOperationAuditActor(req: Request, user: Pick<User, 'id' | 'username' | 'email' | 'role'>): void {
  req.operationAudit = {
    ...req.operationAudit,
    actor: {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  }
}

// 业务路由只补充资源和白名单变化，基础身份、路径与结果由中间件统一采集。
export function setOperationAuditContext(req: Request, context: Omit<OperationAuditContext, 'actor'>): void {
  req.operationAudit = { ...req.operationAudit, ...context }
}

// URL 查询参数不进入审计路径，避免验证码、搜索邮箱等输入被意外持久化。
function requestPath(req: Request): string {
  return req.originalUrl.split('?')[0].slice(0, 500)
}

// 路由定义集中决定哪些关键操作值得审计，高频轮询、列表浏览和自动保存不会命中。
function resolveOperationDefinition(req: Request): { definition: OperationDefinition; match: RegExpMatchArray } | null {
  const path = requestPath(req)
  for (const definition of OPERATION_DEFINITIONS) {
    if (definition.method !== req.method) continue
    const match = path.match(definition.pattern)
    if (match) return { definition, match }
  }
  return null
}

// 资源标识来自固定路由分组，解码失败时保留原值供后台定位。
function resourceIdFromMatch(definition: OperationDefinition, match: RegExpMatchArray): string | undefined {
  if (!definition.resourceIdGroup) return undefined
  const value = match[definition.resourceIdGroup]
  if (!value) return undefined
  try {
    return decodeURIComponent(value).slice(0, 191)
  } catch {
    return value.slice(0, 191)
  }
}

// 响应完成后异步保存审计，日志写入失败不能把已完成的业务响应改写成失败。
async function persistOperationAudit(req: Request, res: Response, occurredAt: Date, errorCode?: string): Promise<void> {
  const resolved = resolveOperationDefinition(req)
  if (!resolved) return
  const actor = req.operationAudit?.actor || (req.user
    ? {
        userId: req.user.userId,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
      }
    : undefined)
  if (!actor) return

  const { definition, match } = resolved
  const context = req.operationAudit
  await prisma.operationLog.create({
    data: {
      occurredAt,
      requestId: req.requestId,
      actorUserId: actor.userId,
      actorNameSnapshot: actor.username.slice(0, 191),
      actorEmailSnapshot: actor.email.slice(0, 191),
      actorRoleSnapshot: actor.role.slice(0, 32),
      module: definition.module,
      action: definition.action,
      summary: (context?.summary || definition.summary).slice(0, 500),
      result: res.statusCode < 400 ? OPERATION_AUDIT_RESULT.SUCCESS : OPERATION_AUDIT_RESULT.FAILURE,
      resourceType: (context?.resourceType || definition.resourceType)?.slice(0, 64),
      resourceId: (context?.resourceId || resourceIdFromMatch(definition, match))?.slice(0, 191),
      changes: context?.changes as Prisma.InputJsonValue | undefined,
      method: req.method.slice(0, 16),
      path: requestPath(req),
      statusCode: res.statusCode,
      ipAddress: normalizeIpAddress(req.ip)?.slice(0, 64),
      userAgent: req.get('user-agent')?.slice(0, 512),
      errorCode: errorCode?.slice(0, 64),
    },
  })
}

export const operationAuditMiddleware: RequestHandler = (req, res, next) => {
  const occurredAt = new Date()
  let errorCode: string | undefined
  const originalJson = res.json.bind(res)
  res.json = ((body: unknown) => {
    if (body && typeof body === 'object' && 'success' in body && body.success === false && 'code' in body) {
      errorCode = String(body.code)
    }
    return originalJson(body)
  }) as Response['json']

  res.once('finish', () => {
    void persistOperationAudit(req, res, occurredAt, errorCode).catch((error) => {
      logRuntimeError('operation_audit.persist_failed', error, {
        requestId: req.requestId,
        method: req.method,
        path: requestPath(req),
      })
    })
  })
  next()
}
