
// 提供考试结果、个人统计及诊断报告任务与摘要接口。
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonField, parseJsonArray } from '../utils/jsonField.js'
import { checkMemberAccess } from '../services/member.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { computeScores } from '../services/scoring.js'
import type { QuestionResult } from '../services/scoring.js'
import {
  ensureDiagnosticReportTask,
  retryDiagnosticReportTask,
  scheduleDiagnosticReportWorker,
} from '../services/diagnosticReportTask.js'
import {
  ANSWER_RECORD_STATE,
  type AnswerRecordState,
  DIAGNOSTIC_REPORT_TASK_STATUS,
  EXAM_TYPE,
  EXAM_TYPES,
  EXAM_RECORD_STATUS,
  PAPER_TYPE,
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  isExamType,
  isAnswerRecordState,
  isRealPaperType,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'

import { safeJsonParse, parseQueryList, parseDateBoundary, parsePositiveInt, getQuestionKey, buildAnswerRecordRows, countCorrectAnswers, ExamResponseInput, normalizeExamResponses, responseMaps, usesContinuousExamClock, buildExamDeadline, continuousExamDurationSeconds, replaceAnswerRecords, collectSyllabusCodes, jsonPointsHaveCode, calculateNinePointScore } from './exam-shared.js'
export const examResultRouter = createAsyncRouter()

examResultRouter.get('/profile-stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const [diagnosticRecords, diagnosticSessions, answeredRows] = await Promise.all([
      prisma.examRecord.findMany({
        where: {
          userId,
          status: 'submitted',
          examType: { in: EXAM_TYPES },
          paper: { paperType: { in: [...REAL_PAPER_TYPES] } },
        },
        select: {
          examType: true,
          totalQuestions: true,
          correctCount: true,
        },
      }),
      prisma.diagnosticSession.findMany({
        where: {
          userId,
          status: 'linked',
          examType: { in: EXAM_TYPES },
        },
        select: {
          examType: true,
          totalQuestions: true,
          correctCount: true,
        },
      }),
      prisma.answerRecord.findMany({
        where: {
          examRecord: {
            userId,
            status: 'submitted',
            examType: { in: EXAM_TYPES },
          },
        },
        select: {
          questionId: true,
          examRecord: { select: { examType: true } },
        },
      }),
    ])
    const scoresByExamType = new Map<string, number[]>()
    const answeredQuestionsByExamType = new Map<string, Set<string>>()
    const stats: Record<string, {
      estimatedScore: number | null
      answeredQuestionCount: number
      diagnosticExamCount: number
    }> = {}

    for (const examType of EXAM_TYPES) {
      scoresByExamType.set(examType, [])
      answeredQuestionsByExamType.set(examType, new Set())
      stats[examType] = {
        estimatedScore: null,
        answeredQuestionCount: 0,
        diagnosticExamCount: 0,
      }
    }


    for (const item of [...diagnosticRecords, ...diagnosticSessions]) {
      const score = calculateNinePointScore(item.examType, item.totalQuestions, item.correctCount)
      if (score === null) continue
      scoresByExamType.get(item.examType)?.push(score)
      stats[item.examType].diagnosticExamCount += 1
    }

    for (const row of answeredRows) {
      answeredQuestionsByExamType.get(row.examRecord.examType)?.add(row.questionId)
    }

    for (const examType of EXAM_TYPES) {
      const scores = scoresByExamType.get(examType) || []
      const average = scores.length
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : null
      stats[examType].estimatedScore = average === null ? null : Math.round(average * 10) / 10
      stats[examType].answeredQuestionCount = answeredQuestionsByExamType.get(examType)?.size || 0
    }

    res.json(success({ stats }))
  } catch (e: any) {
    console.error('Profile exam stats error:', e)
    res.status(500).json(fail(e.message || 'Get profile stats failed'))
  }
})

// Exam result
examResultRouter.get('/:id/result', requireAuth, async (req, res) => {
  try {
    const examRecord = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })

    if (!examRecord) {
      res.status(404).json(fail('Exam record not found'))
      return
    }

    if (examRecord.status !== EXAM_RECORD_STATUS.SUBMITTED || !examRecord.submittedAt) {
      res.status(409).json(fail('考试尚未交卷，暂不能查看结果', 'EXAM_NOT_SUBMITTED'))
      return
    }

    const answers = await prisma.answerRecord.findMany({
      where: { examRecordId: examRecord.id },
    })

    const questionRows = await prisma.question.findMany({
      where: { id: { in: answers.map((answer) => answer.questionId) } },
      orderBy: { number: 'asc' },
    })
    const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]))

    const needPaperMeta = examRecord.paperId !== 'question-bank'
    const paper = needPaperMeta
      ? await prisma.paper.findUnique({
          where: { id: examRecord.paperId },
          select: { id: true, title: true, paperType: true, year: true, duration: true, code: true },
        })
      : null

    // 逐题解析必须遵循试卷题号，不能受作答先后或未答题的空时间影响。
    const answeredQuestions = questionRows.map((question) => {
      const answer = answerMap.get(question.id)
      return {
        ...formatQuestionRow(question),
        questionId: question.id,
        selectedAnswer: answer?.selectedAnswer ?? null,
        isCorrect: answer?.isCorrect ?? false,
        durationSeconds: answer?.durationSeconds ?? 0,
      }
    })

    const questionsWithResults: QuestionResult[] = answeredQuestions.map((q: any) => ({
      subject: q.subject ?? null,
      isCorrect: q.isCorrect ?? false,
      number: q.number ?? null,
    }))
    const scoring = computeScores(examRecord.examType, questionsWithResults)

    res.json(success({
      examRecord: {
        id: examRecord.id,
        examType: examRecord.examType,
        totalQuestions: examRecord.totalQuestions,
        correctCount: examRecord.correctCount,
        startedAt: examRecord.startedAt,
        submittedAt: examRecord.submittedAt,
        status: examRecord.status,
        paper: examRecord.paperId === 'question-bank'
          ? {
              id: 'question-bank',
              title: '题库练习',
              paperType: PAPER_TYPE.AI_PAPER,
              year: new Date().getFullYear(),
              duration: 60,
              code: null,
            }
          : paper

          ? {
              id: paper.id,
              title: paper.title,
              paperType: paper.paperType,
              year: paper.year,
              duration: paper.duration,
              code: paper.code,
            }
          : null,
      },
      questions: answeredQuestions,
      scoring,
    }))
  } catch (e: any) {
    console.error('Exam result error:', e)
    res.status(500).json(fail(e.message || '鑾峰彇缁撴灉澶辫触'))
  }
})

// 诊断报告生成状态
examResultRouter.get('/:id/diagnostic-report/status', requireAuth, async (req, res) => {
  try {
    const examRecord = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        paper: { select: { paperType: true } },
        diagnosticReportTask: true,
      },
    })
    if (!examRecord) {
      res.status(404).json(fail('Exam record not found'))
      return
    }
    if (!isRealPaperType(examRecord.paper.paperType)) {
      res.status(400).json(fail('Only diagnostic real-paper records have this report'))
      return
    }
    if (examRecord.status !== EXAM_RECORD_STATUS.SUBMITTED || !examRecord.submittedAt) {
      res.status(409).json(fail('Diagnostic report is available after submission'))
      return
    }

    if (!examRecord.diagnosticReportTask) {
      await ensureDiagnosticReportTask(examRecord.id, req.user!.userId)
    }
    const [task, currentReport] = await Promise.all([
      prisma.diagnosticReportTask.findUnique({ where: { examRecordId: examRecord.id } }),
      prisma.diagnosticReport.findUnique({
        where: { userId_paperId: { userId: req.user!.userId, paperId: examRecord.paperId } },
        select: { examRecordId: true },
      }),
    ])
    if (!task) {
      res.status(500).json(fail('诊断分析任务创建失败'))
      return
    }

    const messageByStage: Record<string, string> = {
      answers_saved: '答卷已安全保存',
      fixed_calculating: '正在计算成绩与能力表现',
      module_analyzing: '正在分析各考试模块',
      roi_analyzing: '正在定位高价值提升方向',
      path_analyzing: '正在生成个性化学习路径',
      report_saving: '正在保存诊断报告',
      completed: '诊断报告生成完成',
    }
    const hasPreviousReport = Boolean(currentReport && currentReport.examRecordId !== examRecord.id)

    res.json(success({
      status: task.status,
      stage: task.stage,
      progress: task.progress,
      message: task.status === DIAGNOSTIC_REPORT_TASK_STATUS.FAILED
        ? '最新一次诊断分析失败'
        : messageByStage[task.stage] || '正在生成诊断报告',
      reportKind: task.reportKind,
      reportExamRecordId: task.status === DIAGNOSTIC_REPORT_TASK_STATUS.COMPLETED
        ? currentReport?.examRecordId || null
        : null,
      previousReportExamRecordId: hasPreviousReport ? currentReport?.examRecordId || null : null,
      hasPreviousReport,
      errorMessage: task.status === DIAGNOSTIC_REPORT_TASK_STATUS.FAILED ? task.errorMessage : null,
      generationMode: task.generationMode,
    }))
  } catch (error: any) {
    console.error('[diagnostic-report] status error:', error)
    res.status(500).json(fail(error.message || '获取诊断分析状态失败'))
  }
})

// 失败的诊断报告重新分析
examResultRouter.post('/:id/diagnostic-report/retry', requireAuth, async (req, res) => {
  try {
    await retryDiagnosticReportTask(req.params.id, req.user!.userId)
    const task = await prisma.diagnosticReportTask.findUnique({ where: { examRecordId: req.params.id } })
    res.json(success({
      status: task?.status || DIAGNOSTIC_REPORT_TASK_STATUS.PENDING,
      stage: task?.stage || 'answers_saved',
      progress: task?.progress ?? 10,
    }))

  } catch (error: any) {
    console.error('[diagnostic-report] retry error:', error)
    res.status(500).json(fail(error.message || '重新分析失败'))
  }
})

// 读取已持久化的当前有效诊断报告
examResultRouter.get('/:id/diagnostic-report/summary', requireAuth, async (req, res) => {
  try {
    const examRecord = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        paper: { select: { paperType: true } },
        diagnosticReportTask: true,
      },
    })
    if (!examRecord) {
      res.status(404).json(fail('Exam record not found'))
      return
    }
    if (!isRealPaperType(examRecord.paper.paperType)) {
      res.status(400).json(fail('Only diagnostic real-paper records have this report'))
      return
    }
    if (examRecord.status !== EXAM_RECORD_STATUS.SUBMITTED || !examRecord.submittedAt) {
      res.status(409).json(fail('Diagnostic report is available after submission'))
      return
    }

    if (!examRecord.diagnosticReportTask) {
      await ensureDiagnosticReportTask(examRecord.id, req.user!.userId)
    }
    const [task, currentReport] = await Promise.all([
      prisma.diagnosticReportTask.findUnique({ where: { examRecordId: examRecord.id } }),
      prisma.diagnosticReport.findUnique({
        where: { userId_paperId: { userId: req.user!.userId, paperId: examRecord.paperId } },
      }),
    ])
    if (!currentReport) {
      res.status(409).json(fail(
        task?.status === DIAGNOSTIC_REPORT_TASK_STATUS.FAILED
          ? '诊断报告生成失败，请重新分析'
          : '诊断报告仍在生成中',
        task?.status === DIAGNOSTIC_REPORT_TASK_STATUS.FAILED ? 'REPORT_FAILED' : 'REPORT_PENDING',
      ))
      return
    }

    const isRequestedReport = currentReport.examRecordId === examRecord.id
    const warning = isRequestedReport
      ? null
      : task?.status === DIAGNOSTIC_REPORT_TASK_STATUS.FAILED
        ? '最新一次分析失败，当前展示上一次报告'
        : task?.status === DIAGNOSTIC_REPORT_TASK_STATUS.PENDING || task?.status === DIAGNOSTIC_REPORT_TASK_STATUS.ANALYZING
          ? '最新一次报告正在生成，当前展示上一次报告'
          : '当前展示该试卷最新生成的诊断报告'

    res.json(success({
      report: currentReport.result,
      meta: {
        reportExamRecordId: currentReport.examRecordId,
        requestedExamRecordId: examRecord.id,
        isPreviousReport: !isRequestedReport,
        warning,
        generationMode: currentReport.generationMode,
        completedAt: currentReport.completedAt,
      },
    }))
  } catch (error: any) {
    console.error('[diagnostic-report] summary error:', error)
    res.status(500).json(fail(error.message || '读取诊断报告失败'))
  }
})
