
// 提供诊断试卷列表及其历史记录接口；独立试题库由 questionLibraryRouter 负责。
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { parseJsonField } from '../utils/jsonField.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
import { computeScores } from '../services/scoring.js'
import type { QuestionResult } from '../services/scoring.js'
import {
  EXAM_TYPE,
  EXAM_RECORD_STATUS,
  PAPER_DELIVERY_MODE,
  REAL_PAPER_TYPES,
  isExamType,
} from '../constants/domain.js'

import { parsePositiveInt } from './papers-shared.js'
export const questionBankRouter = createAsyncRouter()

const BEIJING_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// 诊断趋势以北京时间自然日聚合，避免服务器时区改变每日最新记录的归属。
function formatBeijingDate(date: Date): string {
  const parts = BEIJING_DATE_FORMATTER.formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value || ''
  const month = parts.find((part) => part.type === 'month')?.value || ''
  const day = parts.find((part) => part.type === 'day')?.value || ''
  return `${year}-${month}-${day}`
}

// 年份筛选只接受合理的四位年份，避免隐式 Number 转换把空值或小数带入 Prisma 查询。
function parseAssessmentYear(value: unknown): number | null {
  const text = String(value ?? '').trim()
  if (!text) return null
  const year = Number(text)
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? year : Number.NaN
}

// 诊断年份首页由数据库直接聚合可见试卷及当前用户状态，前端不再加载全部试卷后内存分组。
questionBankRouter.get('/assessment/years', requireAuth, async (req, res) => {
  try {
    const examType = String(req.query.examType || EXAM_TYPE.ESAT).toUpperCase()
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }

    const papers = await prisma.paper.findMany({
      where: {
        examType,
        paperType: { in: [...REAL_PAPER_TYPES] },
        OR: [
          {
            status: 'published',
            OR: [
              { examType: { not: EXAM_TYPE.ESAT } },
              { deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE },
            ],
          },
          { examRecords: { some: { userId: req.user!.userId } } },
        ],
      },
      select: {
        id: true,
        year: true,
        totalQuestions: true,
        createdAt: true,
        examRecords: {
          where: { userId: req.user!.userId },
          select: { status: true, startedAt: true },
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    })

    const yearMap = new Map<number, {
      year: number
      paperCount: number
      totalQuestions: number
      completedPaperCount: number
      inProgressPaperCount: number
      completedAttemptCount: number
    }>()

    for (const paper of papers) {
      const summary = yearMap.get(paper.year) || {
        year: paper.year,
        paperCount: 0,
        totalQuestions: 0,
        completedPaperCount: 0,
        inProgressPaperCount: 0,
        completedAttemptCount: 0,
      }
      const latestRecord = paper.examRecords[0]
      const completedAttemptCount = paper.examRecords.filter(
        (record) => record.status === EXAM_RECORD_STATUS.SUBMITTED,
      ).length

      summary.paperCount += 1
      summary.totalQuestions += paper.totalQuestions
      summary.completedAttemptCount += completedAttemptCount
      if (completedAttemptCount > 0) summary.completedPaperCount += 1
      if (latestRecord?.status === EXAM_RECORD_STATUS.IN_PROGRESS) {
        summary.inProgressPaperCount += 1
      }
      yearMap.set(paper.year, summary)
    }

    res.json(success({
      list: [...yearMap.values()].sort((a, b) => b.year - a.year),
    }))
  } catch (error: any) {
    logRuntimeError('assessment_years.list_failed', error)
    res.status(500).json(fail(error.message || '获取诊断年份失败'))
  }
})

// 诊断测试列表按试卷聚合当前用户的最新测试与报告状态。
questionBankRouter.get('/assessment/papers', requireAuth, async (req, res) => {
  try {
    const examType = String(req.query.examType || EXAM_TYPE.TMUA).toUpperCase()
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    const year = parseAssessmentYear(req.query.year)
    if (Number.isNaN(year)) {
      res.status(422).json(fail('无效的试卷年份'))
      return
    }
    const [papers, records] = await Promise.all([
      prisma.paper.findMany({
        where: {
          examType,
          ...(year === null ? {} : { year }),
          paperType: { in: [...REAL_PAPER_TYPES] },
          OR: [
            {
              status: 'published',
              OR: [
                { examType: { not: EXAM_TYPE.ESAT } },
                { deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE },
              ],
            },
            { examRecords: { some: { userId: req.user!.userId } } },
          ],
        },
        select: {
          id: true,
          title: true,
          code: true,
          examType: true,
          year: true,
          duration: true,
          totalQuestions: true,
          paperType: true,
          accessTier: true,
          deliveryMode: true,
          breakDurationSeconds: true,
          moduleConfig: true,
          assemblyType: true,
          remarks: true,
          status: true,
          createdAt: true,
        },
        orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.examRecord.findMany({
        where: {
          userId: req.user!.userId,
          examType,
          paper: {
            paperType: { in: [...REAL_PAPER_TYPES] },
            ...(year === null ? {} : { year }),
          },
        },
        select: {
          id: true,
          paperId: true,
          status: true,
          totalQuestions: true,
          correctCount: true,
          startedAt: true,
          expiresAt: true,
          phase: true,
          currentModuleIndex: true,
          phaseExpiresAt: true,
          submittedAt: true,
          durationSeconds: true,
          _count: {
            select: { answers: { where: { selectedAnswer: { not: null } } } },
          },
          diagnosticReportTask: {
            select: { status: true, stage: true, progress: true, errorMessage: true },
          },
          diagnosticReport: {
            select: {
              examRecordId: true,
              generationMode: true,
              completedAt: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      }),
    ])

    const latestRecordMap = new Map<string, (typeof records)[number]>()
    const completedAttemptCountMap = new Map<string, number>()
    for (const record of records) {
      if (!latestRecordMap.has(record.paperId)) latestRecordMap.set(record.paperId, record)
      if (record.status === 'submitted') {
        completedAttemptCountMap.set(
          record.paperId,
          (completedAttemptCountMap.get(record.paperId) || 0) + 1,
        )
      }
    }

    res.json(success({
      list: papers.map((paper) => {
        const record = latestRecordMap.get(paper.id)
        const report = record?.diagnosticReport
        const testStatus = record?.status === 'in_progress'
          ? 'in_progress'
          : record?.status === 'submitted'
            ? 'completed'
            : 'not_started'
        const reportStatus = record?.status === 'submitted'
          ? report
            ? 'completed'
            : record.diagnosticReportTask?.status || 'not_generated'
          : null

        return {
          id: paper.id,
          paperId: paper.id,
          paperName: paper.title,
          title: paper.title,
          code: paper.code,
          examType: paper.examType,
          year: paper.year,
          duration: paper.duration,
          totalQuestions: paper.totalQuestions,
          paperType: paper.paperType,
          accessTier: paper.accessTier,
          deliveryMode: paper.deliveryMode,
          breakDurationSeconds: paper.breakDurationSeconds,
          modules: parseJsonField(paper.moduleConfig, []),
          assemblyType: paper.assemblyType,
          remarks: paper.remarks,
          publicationStatus: paper.status,
          testStatus,
          examRecordId: record?.id || null,
          answeredCount: record?._count.answers || 0,
          correctCount: record?.status === 'submitted' ? record.correctCount : null,
          startedAt: record?.startedAt || null,
          expiresAt: record?.expiresAt || null,
          phase: record?.phase || null,
          currentModuleIndex: record?.currentModuleIndex ?? null,
          phaseExpiresAt: record?.phaseExpiresAt || null,
          submittedAt: record?.submittedAt || null,
          durationSeconds: record?.status === 'submitted' ? record.durationSeconds : null,
          completedAttemptCount: completedAttemptCountMap.get(paper.id) || 0,
          reportStatus,

          reportStage: record?.diagnosticReportTask?.stage || null,
          reportProgress: record?.diagnosticReportTask?.progress
            ?? (report ? 100 : 0),
          reportErrorMessage: record?.diagnosticReportTask?.errorMessage || null,
          hasReport: Boolean(report),
          reportExamRecordId: report?.examRecordId || null,
          generationMode: report?.generationMode || null,
          reportCompletedAt: report?.completedAt || null,
        }
      }),
    }))
  } catch (e: any) {
    logRuntimeError('assessment_papers.list_failed', e)
    res.status(500).json(fail(e.message || '获取诊断测试套卷失败'))
  }
})

// 诊断分数趋势按北京时间每日仅保留最后一次正式交卷，并复用统一评分引擎。
questionBankRouter.get('/assessment/score-trend', requireAuth, async (req, res) => {
  try {
    const examType = String(req.query.examType || EXAM_TYPE.TMUA).toUpperCase()
    if (!isExamType(examType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }

    const submittedRecords = await prisma.examRecord.findMany({
      where: {
        userId: req.user!.userId,
        examType,
        status: EXAM_RECORD_STATUS.SUBMITTED,
        submittedAt: { not: null },
        paper: { paperType: { in: [...REAL_PAPER_TYPES] } },
      },
      select: { id: true, submittedAt: true },
      orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
    })

    const latestRecordByDate = new Map<string, { id: string; submittedAt: Date }>()
    for (const record of submittedRecords) {
      if (!record.submittedAt) continue
      const date = formatBeijingDate(record.submittedAt)
      if (!latestRecordByDate.has(date)) {
        latestRecordByDate.set(date, { id: record.id, submittedAt: record.submittedAt })
      }
    }

    const dailyRecords = [...latestRecordByDate.entries()]
      .map(([date, record]) => ({ date, ...record }))
      .sort((left, right) => left.submittedAt.getTime() - right.submittedAt.getTime())

    if (!dailyRecords.length) {
      res.json(success({ examType, points: [] }))
      return
    }

    const scoreRecords = await prisma.examRecord.findMany({
      where: { id: { in: dailyRecords.map((record) => record.id) } },
      select: {
        id: true,
        paper: { select: { title: true } },
        answers: {
          select: {
            isCorrect: true,
            position: true,
            question: {
              select: {
                subject: true,
                moduleCode: true,
                number: true,
              },
            },
          },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
        },
      },
    })
    const scoreRecordMap = new Map(scoreRecords.map((record) => [record.id, record]))

    const points = dailyRecords.flatMap((dailyRecord) => {
      const record = scoreRecordMap.get(dailyRecord.id)
      if (!record) return []
      const questionResults: QuestionResult[] = record.answers.map((answer) => ({
        subject: answer.question.subject,
        moduleCode: answer.question.moduleCode,
        isCorrect: answer.isCorrect,
        number: answer.question.number,
      }))
      const scoring = computeScores(examType, questionResults)
      const scores = examType === EXAM_TYPE.ESAT
        ? scoring.modules.map((module) => ({
            key: module.module,
            label: module.moduleLabel,
            score: module.scaledScore,
          }))
        : scoring.overallScore === null
          ? []
          : [{ key: 'overall', label: '综合分数', score: scoring.overallScore }]

      if (!scores.length) return []
      return [{
        date: dailyRecord.date,
        submittedAt: dailyRecord.submittedAt,
        examRecordId: dailyRecord.id,
        paperTitle: record.paper.title,
        scores,
      }]
    })

    res.json(success({ examType, points }))
  } catch (error: any) {
    logRuntimeError('assessment_score_trend.get_failed', error)
    res.status(500).json(fail(error.message || '获取诊断分数趋势失败'))
  }
})

// 历次诊断记录按交卷时间倒序返回，每一条报告只关联本次考试记录。
questionBankRouter.get('/assessment/papers/:paperId/history', requireAuth, async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 10, 50)
    const paper = await prisma.paper.findFirst({
      where: {
        id: req.params.paperId,
        paperType: { in: [...REAL_PAPER_TYPES] },
      },
      select: { id: true, title: true, examType: true, year: true },
    })
    if (!paper) {
      res.status(404).json(fail('诊断试卷不存在'))
      return
    }

    const where = {
      userId: req.user!.userId,
      paperId: paper.id,
      status: 'submitted',
    } as const
    const [total, records] = await Promise.all([
      prisma.examRecord.count({ where }),
      prisma.examRecord.findMany({
        where,
        select: {
          id: true,
          totalQuestions: true,
          correctCount: true,
          startedAt: true,
          submittedAt: true,
          durationSeconds: true,
          diagnosticReportTask: {
            select: {
              status: true,
              stage: true,
              progress: true,
              errorMessage: true,
              reportKind: true,
            },
          },
          diagnosticReport: {
            select: {
              examRecordId: true,
              generationMode: true,
              completedAt: true,
            },
          },
        },
        orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])
    const totalPages = Math.ceil(total / pageSize)

    res.json(success({
      paper,
      list: records.map((record, index) => ({
        examRecordId: record.id,
        attemptNumber: total - (page - 1) * pageSize - index,
        totalQuestions: record.totalQuestions,
        correctCount: record.correctCount,
        startedAt: record.startedAt,
        submittedAt: record.submittedAt,
        durationSeconds: record.durationSeconds,
        reportStatus: record.diagnosticReport
          ? 'completed'
          : record.diagnosticReportTask?.status || 'not_generated',
        reportStage: record.diagnosticReportTask?.stage || null,
        reportProgress: record.diagnosticReportTask?.progress
          ?? (record.diagnosticReport ? 100 : 0),
        reportErrorMessage: record.diagnosticReportTask?.errorMessage || null,
        reportKind: record.diagnosticReportTask?.reportKind || paper.examType.toLowerCase(),
        hasReport: Boolean(record.diagnosticReport),
        reportCompletedAt: record.diagnosticReport?.completedAt || null,
        generationMode: record.diagnosticReport?.generationMode || null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    }))
  } catch (error: any) {
    logRuntimeError('assessment_papers.history_failed', error)
    res.status(500).json(fail(error.message || '获取历次诊断记录失败'))
  }
})

// 试卷详情
