// 个人中心学习足迹：保留实际作答事件，并按北京时间汇总注册至今的学习记录。
import { createHash } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { EXAM_RECORD_STATUS } from '../constants/domain.js'
import { OPERATION_AUDIT_RESULT } from '../constants/operationAudit.js'

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS
const VIEW_ACTIONS = [
  'mistake_notebook.view',
  'favorite_notebook.question_view',
  'diagnostic_report.view',
]
type ActivityKind = 'answers' | 'reviews' | 'reports'
type Activity = { kind: ActivityKind; resourceKey: string; occurredAt: Date }

export interface LearningDay {
  date: string
  answers: number
  reviews: number
  reports: number
  total: number
  level: number
  partial: boolean
}

// 时间使用北京时间自然日；与浏览器所在时区无关。
export function learningDate(date: Date): string {
  return new Date(date.getTime() + 8 * HOUR_MS).toISOString().slice(0, 10)
}

// 同一答卷中的题目形成稳定键，不依赖可被覆盖或删除的作答明细主键。
function answerResourceKey(examRecordId: string, questionId: string): string {
  return createHash('sha256')
    .update(JSON.stringify([examRecordId, questionId]))
    .digest('hex')
}

// 答题接口已校验归属和题目范围；保存非空答案即记录，同一答卷题目每天只计一次。
export async function recordAnswerLearning(
  tx: Prisma.TransactionClient,
  userId: string,
  examRecordId: string,
  responses: Array<{ questionId: string; selectedAnswer: string | null }>,
  occurredAt = new Date(),
): Promise<void> {
  const dayStart = new Date(`${learningDate(occurredAt)}T00:00:00+08:00`)
  const data = responses
    .filter((item) => item.selectedAnswer?.trim())
    .map((item) => ({
      userId,
      resourceKey: answerResourceKey(examRecordId, item.questionId),
      hourStart: dayStart,
      occurredAt,
    }))
  if (data.length) await tx.learningActivity.createMany({ data, skipDuplicates: true })
}

// 固定分档使相同学习量在不同月份具有相同颜色。
function activityLevel(total: number): number {
  return total === 0 ? 0 : total <= 5 ? 1 : total <= 15 ? 2 : total <= 30 ? 3 : 4
}

// 一日一格覆盖完整注册时间，同类同资源每天只计一次。
export function buildLearningFootprint(
  createdAt: Date,
  trackedAt: Date,
  activities: Activity[],
  now = new Date(),
) {
  const startDate = learningDate(createdAt)
  const endDate = learningDate(now)
  const trackingStartDate = learningDate(trackedAt)
  const days = new Map<string, LearningDay>()
  for (let time = Date.parse(startDate); time <= Date.parse(endDate); time += DAY_MS) {
    const date = new Date(time).toISOString().slice(0, 10)
    days.set(date, {
      date,
      answers: 0,
      reviews: 0,
      reports: 0,
      total: 0,
      level: 0,
      partial: createdAt < trackedAt && date <= trackingStartDate,
    })
  }
  const seen = new Set<string>()
  for (const activity of activities) {
    if (activity.occurredAt < createdAt || activity.occurredAt > now) continue
    const date = learningDate(activity.occurredAt)
    const key = `${activity.kind}:${activity.resourceKey}:${date}`
    if (seen.has(key)) continue
    seen.add(key)
    const day = days.get(date)
    if (!day) continue
    day[activity.kind] += 1
    day.total += 1
    day.level = activityLevel(day.total)
  }
  const values = [...days.values()]
  return {
    startDate,
    endDate,
    trackingStartDate,
    timezone: 'Asia/Shanghai',
    days: values,
    summary: values.reduce(
      (sum, day) => ({
        activeDays: sum.activeDays + Number(day.total > 0),
        total: sum.total + day.total,
        answers: sum.answers + day.answers,
        reviews: sum.reviews + day.reviews,
        reports: sum.reports + day.reports,
      }),
      { activeDays: 0, total: 0, answers: 0, reviews: 0, reports: 0 },
    ),
  }
}

// 仅查询当前登录用户；历史作答按真实交卷时间归档，旧列表访问不能冒充题目复习。
export async function getLearningFootprint(userId: string, now = new Date()) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, learningTrackedAt: true },
  })
  if (!user) return null
  const [answers, historicalAnswers, views] = await Promise.all([
    prisma.learningActivity.findMany({
      where: { userId, occurredAt: { gte: user.createdAt, lte: now } },
      select: { resourceKey: true, occurredAt: true },
      orderBy: { occurredAt: 'asc' },
    }),
    prisma.answerRecord.findMany({
      where: {
        selectedAnswer: { not: null },
        examRecord: {
          userId,
          status: EXAM_RECORD_STATUS.SUBMITTED,
          submittedAt: {
            gte: user.createdAt,
            lt: user.learningTrackedAt,
            lte: now,
          },
        },
      },
      select: {
        questionId: true,
        selectedAnswer: true,
        examRecordId: true,
        examRecord: { select: { submittedAt: true } },
      },
    }),
    prisma.operationLog.findMany({
      where: {
        actorUserId: userId,
        result: OPERATION_AUDIT_RESULT.SUCCESS,
        action: { in: VIEW_ACTIONS },
        resourceId: { not: null },
        occurredAt: { gte: user.createdAt, lte: now },
      },
      select: {
        action: true,
        resourceId: true,
        resourceType: true,
        occurredAt: true,
      },
      orderBy: { occurredAt: 'asc' },
    }),
  ])
  const activities: Activity[] = answers.map((item) => ({
    ...item,
    kind: 'answers',
  }))
  for (const item of historicalAnswers) {
    if (item.selectedAnswer?.trim() && item.examRecord.submittedAt)
      activities.push({
        kind: 'answers',
        resourceKey: answerResourceKey(item.examRecordId, item.questionId),
        occurredAt: item.examRecord.submittedAt,
      })
  }
  for (const item of views) {
    const report = item.action === 'diagnostic_report.view'
    if (!item.resourceId || item.resourceType !== (report ? 'ExamRecord' : 'Question')) continue
    activities.push({
      kind: report ? 'reports' : 'reviews',
      resourceKey: item.resourceId,
      occurredAt: item.occurredAt,
    })
  }
  return buildLearningFootprint(user.createdAt, user.learningTrackedAt, activities, now)
}
