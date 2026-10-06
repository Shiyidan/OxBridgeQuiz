// 学生行为统计服务：基于交卷与成功查看记录聚合产品使用偏好和北京时间趋势。
import { prisma } from './prisma.js'
import { analyticsStudentWhere } from './analyticsScope.js'
import { visibleOperationActorWhere } from './operationLogVisibility.js'
import {
  EXAM_RECORD_STATUS,
  PAPER_TYPE,
  USER_ROLE,
  normalizePaperType,
} from '../constants/domain.js'
import { OPERATION_AUDIT_RESULT } from '../constants/operationAudit.js'

const DAY_MS = 24 * 60 * 60 * 1000
const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000
const DIAGNOSTIC_REPORT_VIEW_ACTION = 'diagnostic_report.view'
const MISTAKE_NOTEBOOK_VIEW_ACTION = 'mistake_notebook.view'
const FAVORITE_NOTEBOOK_VIEW_ACTION = 'favorite_notebook.question_view'

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

export interface NotebookQuestionViewEvent {
  occurredAt: Date
  userId: string
}

export interface ProductUsageEvents {
  completions: ProductCompletionEvent[]
  reportViews: DiagnosticReportViewEvent[]
  mistakeNotebookViews: NotebookQuestionViewEvent[]
  favoriteNotebookViews: NotebookQuestionViewEvent[]
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
  favoriteNotebookViewUsers: Set<string>
  favoriteNotebookViewCount: number
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

// UTC 时间先平移到东八区，再取自然日键，避免凌晨日志落入前一天。
export function chinaDateKey(value: Date): string {
  return new Date(value.getTime() + CHINA_TIMEZONE_OFFSET_MS).toISOString().slice(0, 10)
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
    favoriteNotebookViewUsers: new Set(),
    favoriteNotebookViewCount: 0,
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
  for (const event of events.favoriteNotebookViews) {
    aggregation.favoriteNotebookViewCount += 1
    aggregation.favoriteNotebookViewUsers.add(event.userId)
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
  favoriteNotebookViewCount: number
}> {
  const trend = new Map<
    string,
    {
      diagnosticTestCount: number
      questionBankPracticeCount: number
      mockExamCount: number
      reportViewCount: number
      mistakeNotebookViewCount: number
      favoriteNotebookViewCount: number
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
      favoriteNotebookViewCount: 0,
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
  for (const event of events.favoriteNotebookViews) {
    const item = trend.get(chinaDateKey(event.occurredAt))
    if (item) item.favoriteNotebookViewCount += 1
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
      favoriteNotebookViewSource: 'operation_log' as const,
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
      favoriteNotebookViewCount: current.favoriteNotebookViewCount,
      favoriteNotebookViewChangeRate: changeRate(
        current.favoriteNotebookViewCount,
        previous.favoriteNotebookViewCount,
      ),
      favoriteNotebookViewerCount: current.favoriteNotebookViewUsers.size,
      averageFavoriteNotebookViews: ratio(
        current.favoriteNotebookViewCount,
        current.favoriteNotebookViewUsers.size,
      ),
    },
    modules,
    preferences,
    trend: buildProductUsageTrend(currentEvents, filters.startAt, filters.endAt),
  }
}

// 数据库仅读取聚合所需窄字段；完成次数取业务记录，报告查看取成功审计事件。
export async function getStudentBehaviorAnalytics(filters: BehaviorAnalyticsFilters) {
  const durationMs = filters.endAt.getTime() - filters.startAt.getTime()
  const previousStartAt = new Date(filters.startAt.getTime() - durationMs)
  const [completionRecords, productViewLogs, trendOverrides] = await Promise.all([
    prisma.examRecord.findMany({
      where: {
        status: EXAM_RECORD_STATUS.SUBMITTED,
        submittedAt: { gte: previousStartAt, lt: filters.endAt },
        user: { is: analyticsStudentWhere },
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
        AND: [visibleOperationActorWhere],
        actorRoleSnapshot: USER_ROLE.STUDENT,
        action: { in: [DIAGNOSTIC_REPORT_VIEW_ACTION, MISTAKE_NOTEBOOK_VIEW_ACTION, FAVORITE_NOTEBOOK_VIEW_ACTION] },
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
    prisma.productUsageTrendOverride.findMany({
      where: {
        businessDate: {
          gte: new Date(`${chinaDateKey(filters.startAt)}T00:00:00.000Z`),
          lte: new Date(`${chinaDateKey(new Date(filters.endAt.getTime() - 1))}T00:00:00.000Z`),
        },
      },
      select: { businessDate: true, questionBankPracticeCount: true },
    }),
  ])

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
  const mistakeNotebookViewEvents: NotebookQuestionViewEvent[] = productViewLogs.flatMap((log) =>
    log.actorUserId && log.action === MISTAKE_NOTEBOOK_VIEW_ACTION
      ? [{ occurredAt: log.occurredAt, userId: log.actorUserId }]
      : [],
  )
  const favoriteNotebookViewEvents: NotebookQuestionViewEvent[] = productViewLogs.flatMap((log) =>
    log.actorUserId && log.action === FAVORITE_NOTEBOOK_VIEW_ACTION
      ? [{ occurredAt: log.occurredAt, userId: log.actorUserId }]
      : [],
  )
  const currentProductEvents: ProductUsageEvents = {
    completions: completionEvents.filter((event) => event.occurredAt >= filters.startAt),
    reportViews: reportViewEvents.filter((event) => event.occurredAt >= filters.startAt),
    mistakeNotebookViews: mistakeNotebookViewEvents.filter(
      (event) => event.occurredAt >= filters.startAt,
    ),
    favoriteNotebookViews: favoriteNotebookViewEvents.filter(
      (event) => event.occurredAt >= filters.startAt,
    ),
  }
  const previousProductEvents: ProductUsageEvents = {
    completions: completionEvents.filter((event) => event.occurredAt < filters.startAt),
    reportViews: reportViewEvents.filter((event) => event.occurredAt < filters.startAt),
    mistakeNotebookViews: mistakeNotebookViewEvents.filter(
      (event) => event.occurredAt < filters.startAt,
    ),
    favoriteNotebookViews: favoriteNotebookViewEvents.filter(
      (event) => event.occurredAt < filters.startAt,
    ),
  }

  const productUsage = aggregateProductUsage(currentProductEvents, previousProductEvents, filters)
  const overrideByDate = new Map(
    trendOverrides.map((item) => [item.businessDate.toISOString().slice(0, 10), item.questionBankPracticeCount]),
  )
  // 趋势修正不能高于剔除封禁账号后的真实次数，避免固定修正值重新抬高统计。
  productUsage.trend = productUsage.trend.map((item) => {
    const count = overrideByDate.get(item.date)
    return count !== undefined && Number.isSafeInteger(count) && count >= 0
      ? { ...item, questionBankPracticeCount: Math.min(count, item.questionBankPracticeCount) }
      : item
  })
  return {
    scope: {
      actorRoleSnapshot: USER_ROLE.STUDENT,
      timezone: BEHAVIOR_ANALYTICS_TIMEZONE,
    },
    period: {
      startAt: filters.startAt.toISOString(),
      endAt: filters.endAt.toISOString(),
      previousStartAt: previousStartAt.toISOString(),
      previousEndAt: filters.startAt.toISOString(),
      endExclusive: true,
    },
    productUsage,
  }
}
