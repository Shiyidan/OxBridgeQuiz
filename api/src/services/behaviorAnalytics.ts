// 学生行为统计服务：基于考试记录与操作审计实时聚合产品偏好、行为排行和北京时间趋势。
import { prisma } from './prisma.js'
import {
  EXAM_RECORD_STATUS,
  PAPER_TYPE,
  USER_ROLE,
  normalizePaperType,
} from '../constants/domain.js'
import {
  OPERATION_AUDIT_MODULE,
  OPERATION_AUDIT_RESULT,
  isOperationAuditFailure,
} from '../constants/operationAudit.js'

const DAY_MS = 24 * 60 * 60 * 1000
const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000
const DIAGNOSTIC_REPORT_VIEW_ACTION = 'diagnostic_report.view'
const MISTAKE_NOTEBOOK_VIEW_ACTION = 'mistake_notebook.view'

export const BEHAVIOR_ANALYTICS_TIMEZONE = 'Asia/Shanghai'
export const BEHAVIOR_ANALYTICS_MAX_RANGE_DAYS = 90

export const PRODUCT_USAGE_MODULE = {
  DIAGNOSTIC_TEST: 'diagnostic_test',
  QUESTION_BANK: 'question_bank',
  MOCK_EXAM: 'mock_exam',
} as const

export const PRODUCT_PREFERENCE = {
  DIAGNOSTIC_TEST: PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST,
  QUESTION_BANK: PRODUCT_USAGE_MODULE.QUESTION_BANK,
  MOCK_EXAM: PRODUCT_USAGE_MODULE.MOCK_EXAM,
  MIXED: 'mixed',
  INSUFFICIENT: 'insufficient',
} as const

export const PRODUCT_PREFERENCE_MIN_COMPLETIONS = 3

export type ProductUsageModule = (typeof PRODUCT_USAGE_MODULE)[keyof typeof PRODUCT_USAGE_MODULE]
export type ProductPreference = (typeof PRODUCT_PREFERENCE)[keyof typeof PRODUCT_PREFERENCE]

export interface BehaviorAnalyticsFilters {
  startAt: Date
  endAt: Date
  module?: string
}

export interface BehaviorAnalyticsLog {
  occurredAt: Date
  actorUserId: string | null
  module: string
  action: string
  result: string
  statusCode?: number
  errorCode?: string | null
}

export interface ProductCompletionEvent {
  occurredAt: Date
  userId: string
  resourceId: string
  module: ProductUsageModule
}

export interface DiagnosticReportViewEvent {
  occurredAt: Date
  userId: string
  resourceId: string | null
}

export interface MistakeNotebookViewEvent {
  occurredAt: Date
  userId: string
}

export interface ProductUsageEvents {
  completions: ProductCompletionEvent[]
  reportViews: DiagnosticReportViewEvent[]
  mistakeNotebookViews: MistakeNotebookViewEvent[]
}

interface MutableGroupStats {
  users: Set<string>
  userOperationCounts: Map<string, number>
  operationCount: number
  attributedOperationCount: number
  failureCount: number
}

interface PeriodAggregation {
  users: Set<string>
  modules: Map<string, MutableGroupStats>
  actions: Map<string, MutableGroupStats & { module: string; action: string }>
  operationCount: number
  attributedOperationCount: number
  failureCount: number
  unattributedOperationCount: number
}

interface TrendAccumulator {
  users: Set<string>
  operationCount: number
  failureCount: number
}

interface ProductModuleAccumulator {
  users: Set<string>
  resources: Set<string>
  userCompletionCounts: Map<string, number>
}

interface ProductUsagePeriodAggregation {
  modules: Map<ProductUsageModule, ProductModuleAccumulator>
  activeUsers: Set<string>
  reportViewUsers: Set<string>
  reportViewResources: Set<string>
  reportViewCount: number
  mistakeNotebookViewUsers: Set<string>
  mistakeNotebookViewCount: number
  userModuleCounts: Map<string, Map<ProductUsageModule, number>>
}

// 默认范围覆盖北京时间今天及此前 29 个完整自然日，结束时间采用半开区间。
export function defaultBehaviorAnalyticsPeriod(now = new Date()): {
  startAt: Date
  endAt: Date
} {
  const chinaNow = new Date(now.getTime() + CHINA_TIMEZONE_OFFSET_MS)
  const chinaDayStart = Date.UTC(
    chinaNow.getUTCFullYear(),
    chinaNow.getUTCMonth(),
    chinaNow.getUTCDate(),
  )
  const endAt = new Date(chinaDayStart - CHINA_TIMEZONE_OFFSET_MS + DAY_MS)
  return { startAt: new Date(endAt.getTime() - 30 * DAY_MS), endAt }
}

// 百分比与人均值统一保留有限小数，避免接口返回浮点噪声。
function round(value: number, digits = 4): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

// 上一周期为零时不虚构增长率，由前端显示“新增”或“暂无对比”。
function changeRate(current: number, previous: number): number | null {
  return previous === 0 ? null : round((current - previous) / previous)
}

// 空集合的比例返回零，保证空数据响应结构稳定。
function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : round(numerator / denominator)
}

// 每个模块或行为使用同一套用户、次数和失败计数结构。
function createGroupStats(): MutableGroupStats {
  return {
    users: new Set<string>(),
    userOperationCounts: new Map<string, number>(),
    operationCount: 0,
    attributedOperationCount: 0,
    failureCount: 0,
  }
}

// 用户标识缺失的历史日志只参与次数统计，不参与 UV 或人均计算。
function addLogToGroup(group: MutableGroupStats, log: BehaviorAnalyticsLog): void {
  group.operationCount += 1
  if (isOperationAuditFailure({ ...log, statusCode: log.statusCode ?? 0 })) group.failureCount += 1
  if (!log.actorUserId) return
  group.attributedOperationCount += 1
  group.users.add(log.actorUserId)
  group.userOperationCounts.set(
    log.actorUserId,
    (group.userOperationCounts.get(log.actorUserId) || 0) + 1,
  )
}

// 单个周期先聚合基础集合与计数，再由响应格式化阶段计算派生指标。
function aggregatePeriod(logs: BehaviorAnalyticsLog[]): PeriodAggregation {
  const aggregation: PeriodAggregation = {
    users: new Set<string>(),
    modules: new Map(),
    actions: new Map(),
    operationCount: 0,
    attributedOperationCount: 0,
    failureCount: 0,
    unattributedOperationCount: 0,
  }

  for (const log of logs) {
    aggregation.operationCount += 1
    if (isOperationAuditFailure({ ...log, statusCode: log.statusCode ?? 0 })) aggregation.failureCount += 1
    if (log.actorUserId) {
      aggregation.attributedOperationCount += 1
      aggregation.users.add(log.actorUserId)
    } else aggregation.unattributedOperationCount += 1

    const moduleStats = aggregation.modules.get(log.module) || createGroupStats()
    addLogToGroup(moduleStats, log)
    aggregation.modules.set(log.module, moduleStats)

    const actionKey = `${log.module}\u0000${log.action}`
    const actionStats = aggregation.actions.get(actionKey) || {
      ...createGroupStats(),
      module: log.module,
      action: log.action,
    }
    addLogToGroup(actionStats, log)
    aggregation.actions.set(actionKey, actionStats)
  }

  return aggregation
}

// 重复用户定义为同一周期内在同一模块或行为至少操作两次的用户。
function repeatedUserRate(group: MutableGroupStats): number {
  const repeatedUsers = [...group.userOperationCounts.values()].filter((count) => count >= 2).length
  return ratio(repeatedUsers, group.users.size)
}

// UTC 时间先平移到东八区，再取自然日键，避免凌晨日志落入前一天。
export function chinaDateKey(value: Date): string {
  return new Date(value.getTime() + CHINA_TIMEZONE_OFFSET_MS).toISOString().slice(0, 10)
}

// 趋势补齐范围内的空白自然日，图表不会因无操作日期而断轴。
function buildTrend(
  logs: BehaviorAnalyticsLog[],
  startAt: Date,
  endAt: Date,
): Array<{
  date: string
  userCount: number
  operationCount: number
  failureCount: number
}> {
  const trend = new Map<string, TrendAccumulator>()
  const firstDay = Math.floor((startAt.getTime() + CHINA_TIMEZONE_OFFSET_MS) / DAY_MS) * DAY_MS
  const lastIncludedTime = Math.max(startAt.getTime(), endAt.getTime() - 1)
  const lastDay = Math.floor((lastIncludedTime + CHINA_TIMEZONE_OFFSET_MS) / DAY_MS) * DAY_MS

  for (let cursor = firstDay; cursor <= lastDay; cursor += DAY_MS) {
    const date = new Date(cursor).toISOString().slice(0, 10)
    trend.set(date, { users: new Set(), operationCount: 0, failureCount: 0 })
  }

  for (const log of logs) {
    const date = chinaDateKey(log.occurredAt)
    const item = trend.get(date)
    if (!item) continue
    item.operationCount += 1
    if (isOperationAuditFailure({ ...log, statusCode: log.statusCode ?? 0 })) item.failureCount += 1
    if (log.actorUserId) item.users.add(log.actorUserId)
  }

  return [...trend.entries()].map(([date, item]) => ({
    date,
    userCount: item.users.size,
    operationCount: item.operationCount,
    failureCount: item.failureCount,
  }))
}

// 试卷标准类型映射为互斥的产品使用模块，避免统计层重复解释业务枚举。
export function productModuleFromPaperType(paperType: unknown): ProductUsageModule {
  const normalized = normalizePaperType(paperType)
  if (normalized === PAPER_TYPE.AI_PAPER) return PRODUCT_USAGE_MODULE.QUESTION_BANK
  if (normalized === PAPER_TYPE.MOCK_PAPER) return PRODUCT_USAGE_MODULE.MOCK_EXAM
  return PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST
}

// 产品模块始终返回固定三类，即使周期内为零也便于前端做稳定横向对比。
function createProductModuleAccumulators(): Map<ProductUsageModule, ProductModuleAccumulator> {
  return new Map([
    [
      PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST,
      {
        users: new Set(),
        resources: new Set(),
        userCompletionCounts: new Map(),
      },
    ],
    [
      PRODUCT_USAGE_MODULE.QUESTION_BANK,
      {
        users: new Set(),
        resources: new Set(),
        userCompletionCounts: new Map(),
      },
    ],
    [
      PRODUCT_USAGE_MODULE.MOCK_EXAM,
      {
        users: new Set(),
        resources: new Set(),
        userCompletionCounts: new Map(),
      },
    ],
  ])
}

// 完成次数按考试记录去重；报告查看保留每次成功打开，同时另外维护报告去重集合。
function aggregateProductUsagePeriod(events: ProductUsageEvents): ProductUsagePeriodAggregation {
  const aggregation: ProductUsagePeriodAggregation = {
    modules: createProductModuleAccumulators(),
    activeUsers: new Set(),
    reportViewUsers: new Set(),
    reportViewResources: new Set(),
    reportViewCount: 0,
    mistakeNotebookViewUsers: new Set(),
    mistakeNotebookViewCount: 0,
    userModuleCounts: new Map(),
  }

  for (const event of events.completions) {
    const moduleStats = aggregation.modules.get(event.module)!
    if (moduleStats.resources.has(event.resourceId)) continue
    moduleStats.resources.add(event.resourceId)
    moduleStats.users.add(event.userId)
    moduleStats.userCompletionCounts.set(
      event.userId,
      (moduleStats.userCompletionCounts.get(event.userId) || 0) + 1,
    )
    aggregation.activeUsers.add(event.userId)

    const userCounts = aggregation.userModuleCounts.get(event.userId) || new Map()
    userCounts.set(event.module, (userCounts.get(event.module) || 0) + 1)
    aggregation.userModuleCounts.set(event.userId, userCounts)
  }

  for (const event of events.reportViews) {
    aggregation.reportViewCount += 1
    aggregation.reportViewUsers.add(event.userId)
    if (event.resourceId) aggregation.reportViewResources.add(event.resourceId)
  }

  for (const event of events.mistakeNotebookViews) {
    aggregation.mistakeNotebookViewCount += 1
    aggregation.mistakeNotebookViewUsers.add(event.userId)
  }

  return aggregation
}

// 同一用户达到最小样本后按完成次数最大模块归类，并列最高视为混合偏好。
function productPreferenceForUser(counts: Map<ProductUsageModule, number>): ProductPreference {
  const entries = [...counts.entries()]
  const total = entries.reduce((sum, [, count]) => sum + count, 0)
  if (total < PRODUCT_PREFERENCE_MIN_COMPLETIONS) return PRODUCT_PREFERENCE.INSUFFICIENT
  const maximum = Math.max(...entries.map(([, count]) => count))
  const preferredModules = entries.filter(([, count]) => count === maximum)
  return preferredModules.length === 1 ? preferredModules[0][0] : PRODUCT_PREFERENCE.MIXED
}

// 产品趋势使用完成时间与报告实际打开时间，并补齐北京时间范围内无数据的自然日。
function buildProductUsageTrend(
  events: ProductUsageEvents,
  startAt: Date,
  endAt: Date,
): Array<{
  date: string
  diagnosticTestCount: number
  questionBankPracticeCount: number
    mockExamCount: number
    reportViewCount: number
    mistakeNotebookViewCount: number
}> {
  const trend = new Map<
    string,
    {
      diagnosticTestCount: number
      questionBankPracticeCount: number
      mockExamCount: number
      reportViewCount: number
      mistakeNotebookViewCount: number
    }
  >()
  const firstDay = Math.floor((startAt.getTime() + CHINA_TIMEZONE_OFFSET_MS) / DAY_MS) * DAY_MS
  const lastIncludedTime = Math.max(startAt.getTime(), endAt.getTime() - 1)
  const lastDay = Math.floor((lastIncludedTime + CHINA_TIMEZONE_OFFSET_MS) / DAY_MS) * DAY_MS

  for (let cursor = firstDay; cursor <= lastDay; cursor += DAY_MS) {
    trend.set(new Date(cursor).toISOString().slice(0, 10), {
      diagnosticTestCount: 0,
      questionBankPracticeCount: 0,
      mockExamCount: 0,
      reportViewCount: 0,
      mistakeNotebookViewCount: 0,
    })
  }

  for (const event of events.completions) {
    const item = trend.get(chinaDateKey(event.occurredAt))
    if (!item) continue
    if (event.module === PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST) item.diagnosticTestCount += 1
    if (event.module === PRODUCT_USAGE_MODULE.QUESTION_BANK) item.questionBankPracticeCount += 1
    if (event.module === PRODUCT_USAGE_MODULE.MOCK_EXAM) item.mockExamCount += 1
  }
  for (const event of events.reportViews) {
    const item = trend.get(chinaDateKey(event.occurredAt))
    if (item) item.reportViewCount += 1
  }
  for (const event of events.mistakeNotebookViews) {
    const item = trend.get(chinaDateKey(event.occurredAt))
    if (item) item.mistakeNotebookViewCount += 1
  }

  return [...trend.entries()].map(([date, item]) => ({ date, ...item }))
}

// 核心学习行为独立于通用操作排行聚合，防止接口重试被误认为一次新的练习完成。
export function aggregateProductUsage(
  currentEvents: ProductUsageEvents,
  previousEvents: ProductUsageEvents,
  filters: Pick<BehaviorAnalyticsFilters, 'startAt' | 'endAt'>,
) {
  const current = aggregateProductUsagePeriod(currentEvents)
  const previous = aggregateProductUsagePeriod(previousEvents)
  const moduleOrder = [
    PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST,
    PRODUCT_USAGE_MODULE.QUESTION_BANK,
    PRODUCT_USAGE_MODULE.MOCK_EXAM,
  ] as const
  const completedActivityCount = moduleOrder.reduce(
    (sum, module) => sum + current.modules.get(module)!.resources.size,
    0,
  )
  const previousCompletedActivityCount = moduleOrder.reduce(
    (sum, module) => sum + previous.modules.get(module)!.resources.size,
    0,
  )
  const diagnosticRecords = current.modules.get(PRODUCT_USAGE_MODULE.DIAGNOSTIC_TEST)!.resources
  const viewedCurrentDiagnosticCount = [...diagnosticRecords].filter((resourceId) =>
    current.reportViewResources.has(resourceId),
  ).length

  const modules = moduleOrder.map((module) => {
    const stats = current.modules.get(module)!
    const previousStats = previous.modules.get(module)!
    const repeatedUsers = [...stats.userCompletionCounts.values()].filter(
      (count) => count >= 2,
    ).length
    return {
      module,
      userCount: stats.users.size,
      completionCount: stats.resources.size,
      averageCompletions: ratio(stats.resources.size, stats.users.size),
      completionShare: ratio(stats.resources.size, completedActivityCount),
      userPenetrationRate: ratio(stats.users.size, current.activeUsers.size),
      repeatedUserRate: ratio(repeatedUsers, stats.users.size),
      completionChangeRate: changeRate(stats.resources.size, previousStats.resources.size),
    }
  })

  const preferenceCounts = new Map<ProductPreference, number>([
    [PRODUCT_PREFERENCE.DIAGNOSTIC_TEST, 0],
    [PRODUCT_PREFERENCE.QUESTION_BANK, 0],
    [PRODUCT_PREFERENCE.MOCK_EXAM, 0],
    [PRODUCT_PREFERENCE.MIXED, 0],
    [PRODUCT_PREFERENCE.INSUFFICIENT, 0],
  ])
  for (const counts of current.userModuleCounts.values()) {
    const preference = productPreferenceForUser(counts)
    preferenceCounts.set(preference, (preferenceCounts.get(preference) || 0) + 1)
  }
  const preferences = [...preferenceCounts.entries()].map(([preference, userCount]) => ({
    preference,
    userCount,
    userRate: ratio(userCount, current.activeUsers.size),
  }))

  return {
    scope: {
      completionSource: 'exam_record' as const,
      reportViewSource: 'operation_log' as const,
      mistakeNotebookViewSource: 'operation_log' as const,
      preferenceMinimumCompletions: PRODUCT_PREFERENCE_MIN_COMPLETIONS,
    },
    overview: {
      activeUsers: current.activeUsers.size,
      completedActivityCount,
      completedActivityChangeRate: changeRate(
        completedActivityCount,
        previousCompletedActivityCount,
      ),
      reportViewCount: current.reportViewCount,
      reportViewChangeRate: changeRate(current.reportViewCount, previous.reportViewCount),
      reportViewerCount: current.reportViewUsers.size,
      distinctReportCount: current.reportViewResources.size,
      averageReportViews: ratio(current.reportViewCount, current.reportViewUsers.size),
      samePeriodReportViewRate: ratio(viewedCurrentDiagnosticCount, diagnosticRecords.size),
      mistakeNotebookViewCount: current.mistakeNotebookViewCount,
      mistakeNotebookViewChangeRate: changeRate(
        current.mistakeNotebookViewCount,
        previous.mistakeNotebookViewCount,
      ),
      mistakeNotebookViewerCount: current.mistakeNotebookViewUsers.size,
      averageMistakeNotebookViews: ratio(
        current.mistakeNotebookViewCount,
        current.mistakeNotebookViewUsers.size,
      ),
    },
    modules,
    preferences,
    trend: buildProductUsageTrend(currentEvents, filters.startAt, filters.endAt),
  }
}

// 聚合结果转换为稳定的管理端响应，并为每个排行项匹配上一周期数据。
export function aggregateBehaviorAnalytics(
  currentLogs: BehaviorAnalyticsLog[],
  previousLogs: BehaviorAnalyticsLog[],
  filters: BehaviorAnalyticsFilters,
) {
  const current = aggregatePeriod(currentLogs)
  const previous = aggregatePeriod(previousLogs)
  const activeUsers = current.users.size
  const previousActiveUsers = previous.users.size
  const averageOperations = ratio(current.attributedOperationCount, activeUsers)
  const previousAverageOperations = ratio(previous.attributedOperationCount, previousActiveUsers)

  const modules = [...current.modules.entries()]
    .map(([module, stats]) => {
      const previousStats = previous.modules.get(module)
      return {
        module,
        userCount: stats.users.size,
        operationCount: stats.operationCount,
        averageOperations: ratio(stats.attributedOperationCount, stats.users.size),
        penetrationRate: ratio(stats.users.size, activeUsers),
        repeatedUserRate: repeatedUserRate(stats),
        failureRate: ratio(stats.failureCount, stats.operationCount),
        userChangeRate: changeRate(stats.users.size, previousStats?.users.size || 0),
        operationChangeRate: changeRate(stats.operationCount, previousStats?.operationCount || 0),
      }
    })
    .sort(
      (left, right) =>
        right.userCount - left.userCount || right.operationCount - left.operationCount,
    )

  const actions = [...current.actions.entries()]
    .map(([key, stats]) => {
      const previousStats = previous.actions.get(key)
      return {
        module: stats.module,
        action: stats.action,
        userCount: stats.users.size,
        operationCount: stats.operationCount,
        averageOperations: ratio(stats.attributedOperationCount, stats.users.size),
        penetrationRate: ratio(stats.users.size, activeUsers),
        repeatedUserRate: repeatedUserRate(stats),
        failureRate: ratio(stats.failureCount, stats.operationCount),
        userChangeRate: changeRate(stats.users.size, previousStats?.users.size || 0),
        operationChangeRate: changeRate(stats.operationCount, previousStats?.operationCount || 0),
      }
    })
    .sort(
      (left, right) =>
        right.userCount - left.userCount || right.operationCount - left.operationCount,
    )

  const durationMs = filters.endAt.getTime() - filters.startAt.getTime()
  const previousStartAt = new Date(filters.startAt.getTime() - durationMs)

  return {
    scope: {
      actorRoleSnapshot: USER_ROLE.STUDENT,
      excludedModules: [OPERATION_AUDIT_MODULE.AUTH],
      timezone: BEHAVIOR_ANALYTICS_TIMEZONE,
    },
    period: {
      startAt: filters.startAt.toISOString(),
      endAt: filters.endAt.toISOString(),
      previousStartAt: previousStartAt.toISOString(),
      previousEndAt: filters.startAt.toISOString(),
      endExclusive: true,
    },
    overview: {
      activeUsers,
      activeUsersChangeRate: changeRate(activeUsers, previousActiveUsers),
      operationCount: current.operationCount,
      operationCountChangeRate: changeRate(current.operationCount, previous.operationCount),
      averageOperations,
      averageOperationsChangeRate: changeRate(averageOperations, previousAverageOperations),
      moduleCount: current.modules.size,
      failureRate: ratio(current.failureCount, current.operationCount),
      failureRateChange:
        previous.operationCount === 0
          ? null
          : round(
              ratio(current.failureCount, current.operationCount) -
                ratio(previous.failureCount, previous.operationCount),
            ),
    },
    modules,
    actions,
    trend: buildTrend(currentLogs, filters.startAt, filters.endAt),
    dataQuality: {
      unattributedOperationCount: current.unattributedOperationCount,
    },
  }
}

// 数据库仅读取聚合所需窄字段；完成次数取业务记录，报告查看取成功审计事件。
export async function getStudentBehaviorAnalytics(filters: BehaviorAnalyticsFilters) {
  const durationMs = filters.endAt.getTime() - filters.startAt.getTime()
  const previousStartAt = new Date(filters.startAt.getTime() - durationMs)
  const [logs, completionRecords, productViewLogs] = await Promise.all([
    prisma.operationLog.findMany({
      where: {
        actorRoleSnapshot: USER_ROLE.STUDENT,
        module: filters.module || { not: OPERATION_AUDIT_MODULE.AUTH },
        occurredAt: { gte: previousStartAt, lt: filters.endAt },
      },
      select: {
        occurredAt: true,
        actorUserId: true,
        module: true,
        action: true,
        result: true,
        statusCode: true,
        errorCode: true,
      },
      orderBy: { occurredAt: 'asc' },
    }),
    prisma.examRecord.findMany({
      where: {
        status: EXAM_RECORD_STATUS.SUBMITTED,
        submittedAt: { gte: previousStartAt, lt: filters.endAt },
        user: { role: USER_ROLE.STUDENT },
      },
      select: {
        id: true,
        userId: true,
        submittedAt: true,
        paper: { select: { paperType: true } },
      },
      orderBy: { submittedAt: 'asc' },
    }),
    prisma.operationLog.findMany({
      where: {
        actorRoleSnapshot: USER_ROLE.STUDENT,
        action: { in: [DIAGNOSTIC_REPORT_VIEW_ACTION, MISTAKE_NOTEBOOK_VIEW_ACTION] },
        result: OPERATION_AUDIT_RESULT.SUCCESS,
        occurredAt: { gte: previousStartAt, lt: filters.endAt },
      },
      select: {
        occurredAt: true,
        actorUserId: true,
        resourceId: true,
        action: true,
      },
      orderBy: { occurredAt: 'asc' },
    }),
  ])

  const currentLogs = logs.filter((log) => log.occurredAt >= filters.startAt)
  const previousLogs = logs.filter((log) => log.occurredAt < filters.startAt)
  const completionEvents: ProductCompletionEvent[] = completionRecords.flatMap((record) =>
    record.submittedAt
      ? [
          {
            occurredAt: record.submittedAt,
            userId: record.userId,
            resourceId: record.id,
            module: productModuleFromPaperType(record.paper.paperType),
          },
        ]
      : [],
  )
  const reportViewEvents: DiagnosticReportViewEvent[] = productViewLogs.flatMap((log) =>
    log.actorUserId && log.action === DIAGNOSTIC_REPORT_VIEW_ACTION
      ? [
          {
            occurredAt: log.occurredAt,
            userId: log.actorUserId,
            resourceId: log.resourceId,
          },
        ]
      : [],
  )
  const mistakeNotebookViewEvents: MistakeNotebookViewEvent[] = productViewLogs.flatMap((log) =>
    log.actorUserId && log.action === MISTAKE_NOTEBOOK_VIEW_ACTION
      ? [{ occurredAt: log.occurredAt, userId: log.actorUserId }]
      : [],
  )
  const currentProductEvents: ProductUsageEvents = {
    completions: completionEvents.filter((event) => event.occurredAt >= filters.startAt),
    reportViews: reportViewEvents.filter((event) => event.occurredAt >= filters.startAt),
    mistakeNotebookViews: mistakeNotebookViewEvents.filter(
      (event) => event.occurredAt >= filters.startAt,
    ),
  }
  const previousProductEvents: ProductUsageEvents = {
    completions: completionEvents.filter((event) => event.occurredAt < filters.startAt),
    reportViews: reportViewEvents.filter((event) => event.occurredAt < filters.startAt),
    mistakeNotebookViews: mistakeNotebookViewEvents.filter(
      (event) => event.occurredAt < filters.startAt,
    ),
  }

  return {
    ...aggregateBehaviorAnalytics(currentLogs, previousLogs, filters),
    productUsage: aggregateProductUsage(currentProductEvents, previousProductEvents, filters),
  }
}
