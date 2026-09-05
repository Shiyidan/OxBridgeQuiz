
// 提供考试结果、个人统计及诊断报告任务与摘要接口。
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonField, parseJsonArray, parseJsonObject } from '../utils/jsonField.js'
import { orderQuestionsForResult } from '../utils/questionOrder.js'
import { checkMemberAccess } from '../services/member.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { computeScores } from '../services/scoring.js'
import type { QuestionResult } from '../services/scoring.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import {
  ensureDiagnosticReportTask,
  regenerateDiagnosticReportTask,
  retryDiagnosticReportTask,
  scheduleDiagnosticReportWorker,
  supportsAttemptDiagnosticReport,
} from '../services/diagnosticReportTask.js'
import {
  canUpgradeDiagnosticReport,
  productVersionForReportVersion,
} from '../constants/diagnosticReport.js'
import {
  indexSnapshotQuestionModules,
  parseModuleExamSnapshot,
  singleModuleExamTitle,
} from '../services/moduleExamSession.js'
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
  isMockPaperType,
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
          paperId: { not: 'question-bank' },
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
    logRuntimeError('exam.profile_stats_failed', e)
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

    const unorderedQuestionRows = await prisma.question.findMany({
      where: { id: { in: answers.map((answer) => answer.questionId) } },
    })
    const questionRows = orderQuestionsForResult(unorderedQuestionRows)
    const storedPositionsAreComplete = answers.every((answer) => Number.isInteger(answer.position))
      && new Set(answers.map((answer) => answer.position)).size === answers.length
    const orderedAnswers = storedPositionsAreComplete
      ? [...answers].sort((left, right) => Number(left.position) - Number(right.position))
      : questionRows.flatMap((question) => {
          const answer = answers.find((item) => item.questionId === question.id)
          return answer ? [answer] : []
        })
    const questionMap = new Map(questionRows.map((question) => [question.id, question]))
    const snapshotQuestionModules = indexSnapshotQuestionModules(
      parseModuleExamSnapshot(examRecord.structureSnapshot),
    )

    const needPaperMeta = examRecord.paperId !== 'question-bank'
    const paper = needPaperMeta
      ? await prisma.paper.findUnique({
          where: { id: examRecord.paperId },
          select: {
            id: true,
            title: true,
            paperType: true,
            year: true,
            duration: true,
            code: true,
            mockPaperSet: {
              select: {
                sequenceNo: true,
                modules: { select: { id: true, code: true, title: true } },
              },
            },
          },
        })
      : null

    // 逐题解析以答卷快照恢复模块归属，并按正式题号排序，不受题库当前分类或作答先后影响。
    const answeredQuestions = orderedAnswers.flatMap((answerRecord) => {
      const question = questionMap.get(answerRecord.questionId)
      if (!question) return []
      const formatted = formatQuestionRow(question)
      const snapshotModule = snapshotQuestionModules.get(question.id)
      return [{
        ...formatted,
        ...(snapshotModule
          ? {
              module_code: snapshotModule.code,
              module_order: snapshotModule.order,
              module_question_number: snapshotModule.questionNumber,
            }
          : {}),
        number: (
          examRecord.paperId === 'question-bank'
          || isMockPaperType(paper?.paperType)
        ) && Number.isInteger(answerRecord.position)
          ? Number(answerRecord.position) + 1
          : question.number,
        questionId: question.id,
        selectedAnswer: answerRecord.selectedAnswer,
        isCorrect: answerRecord.isCorrect,
        durationSeconds: answerRecord.durationSeconds,
      }]
    })

    const questionsWithResults: QuestionResult[] = answeredQuestions.map((q: any) => ({
      subject: q.subject ?? null,
      moduleCode: q.module_code ?? null,
      isCorrect: q.isCorrect ?? false,
      number: q.number ?? null,
    }))
    const scoring = computeScores(examRecord.examType, questionsWithResults)
    const practiceSnapshot = parseJsonObject(examRecord.practiceSnapshot)
    const notebookName = typeof practiceSnapshot.notebookName === 'string'
      ? practiceSnapshot.notebookName.trim()
      : ''
    const moduleSnapshot = parseModuleExamSnapshot(examRecord.structureSnapshot)
    const singleModule = moduleSnapshot?.mockExamMode === 'single'
      ? moduleSnapshot.modules[0] || null
      : null
    const currentModuleTitle = paper?.mockPaperSet?.modules.find((module) => (
      module.id === moduleSnapshot?.mockModuleId || module.code === singleModule?.code
    ))?.title
    const resultPaperTitle = singleModule && paper?.mockPaperSet
      ? singleModuleExamTitle(
          examRecord.examType,
          singleModule.code,
          paper.mockPaperSet.sequenceNo,
          currentModuleTitle || singleModule.title,
        )
      : paper?.title || ''

    res.json(success({
      examRecord: {
        id: examRecord.id,
        examType: examRecord.examType,
        totalQuestions: examRecord.totalQuestions,
        correctCount: examRecord.correctCount,
        durationSeconds: examRecord.durationSeconds,
        startedAt: examRecord.startedAt,
        submittedAt: examRecord.submittedAt,
        status: examRecord.status,
        practiceNotebookName: notebookName || null,
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
              title: resultPaperTitle,
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
    logRuntimeError('exam.result_failed', e)
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
    if (!supportsAttemptDiagnosticReport(
      examRecord.paper.paperType,
      examRecord.structureSnapshot,
    )) {
      res.status(400).json(fail('Only diagnostic and mock-paper records have this report'))
      return
    }
    if (examRecord.status !== EXAM_RECORD_STATUS.SUBMITTED || !examRecord.submittedAt) {
      res.status(409).json(fail('Diagnostic report is available after submission'))
      return
    }

    if (!examRecord.diagnosticReportTask) {
      await ensureDiagnosticReportTask(examRecord.id, req.user!.userId)
    }
    const [task, report] = await Promise.all([
      prisma.diagnosticReportTask.findUnique({ where: { examRecordId: examRecord.id } }),
      prisma.diagnosticReport.findUnique({
        where: { examRecordId: examRecord.id },
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
    res.json(success({
      status: task.status,
      stage: task.stage,
      progress: task.progress,
      message: task.status === DIAGNOSTIC_REPORT_TASK_STATUS.FAILED
        ? '最新一次诊断分析失败'
        : messageByStage[task.stage] || '正在生成诊断报告',
      reportKind: task.reportKind,
      reportExamRecordId: task.status === DIAGNOSTIC_REPORT_TASK_STATUS.COMPLETED
        ? report?.examRecordId || null
        : null,
      errorMessage: task.status === DIAGNOSTIC_REPORT_TASK_STATUS.FAILED ? task.errorMessage : null,
      generationMode: task.generationMode,
    }))
  } catch (error: any) {
    logRuntimeError('diagnostic_report.status_failed', error)
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
    logRuntimeError('diagnostic_report.retry_failed', error)
    res.status(500).json(fail(error.message || '重新分析失败'))
  }
})

// 升级已完成诊断报告
examResultRouter.post('/:id/diagnostic-report/regenerate', requireAuth, async (req, res) => {
  try {
    await regenerateDiagnosticReportTask(req.params.id, req.user!.userId)
    const task = await prisma.diagnosticReportTask.findUnique({ where: { examRecordId: req.params.id } })
    res.json(success({
      status: task?.status || DIAGNOSTIC_REPORT_TASK_STATUS.PENDING,
      stage: task?.stage || 'answers_saved',
      progress: task?.progress ?? 10,
    }))
  } catch (error: any) {
    logRuntimeError('diagnostic_report.regenerate_failed', error)
    res.status(500).json(fail(error.message || '升级诊断报告失败'))
  }
})

// 按考试记录读取该次测试独立持久化的诊断报告
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
    if (!supportsAttemptDiagnosticReport(
      examRecord.paper.paperType,
      examRecord.structureSnapshot,
    )) {
      res.status(400).json(fail('Only diagnostic and mock-paper records have this report'))
      return
    }
    if (examRecord.status !== EXAM_RECORD_STATUS.SUBMITTED || !examRecord.submittedAt) {
      res.status(409).json(fail('Diagnostic report is available after submission'))
      return
    }

    if (!examRecord.diagnosticReportTask) {
      await ensureDiagnosticReportTask(examRecord.id, req.user!.userId)
    }
    const [task, report] = await Promise.all([
      prisma.diagnosticReportTask.findUnique({ where: { examRecordId: examRecord.id } }),
      prisma.diagnosticReport.findUnique({
        where: { examRecordId: examRecord.id },
      }),
    ])
    if (!report) {
      res.status(409).json(fail(
        task?.status === DIAGNOSTIC_REPORT_TASK_STATUS.FAILED
          ? '诊断报告生成失败，请重新分析'
          : '诊断报告仍在生成中',
        task?.status === DIAGNOSTIC_REPORT_TASK_STATUS.FAILED ? 'REPORT_FAILED' : 'REPORT_PENDING',
      ))
      return
    }

    // 报告正文成功读取才计为一次查看，状态轮询与尚未生成的请求不会进入成功统计。
    setOperationAuditContext(req, {
      summary: `查看 ${examRecord.examType} 诊断分析报告`,
      resourceType: 'ExamRecord',
      resourceId: report.examRecordId,
    })
    res.json(success({
      report: report.result,
      meta: {
        reportExamRecordId: report.examRecordId,
        generationMode: report.generationMode,
        reportVersion: report.reportVersion,
        productVersion: productVersionForReportVersion(report.reportVersion),
        canUpgrade: canUpgradeDiagnosticReport(report.reportKind, report.reportVersion),
        completedAt: report.completedAt,
        sourcePaperType: examRecord.paper.paperType,
      },
    }))
  } catch (error: any) {
    logRuntimeError('diagnostic_report.summary_failed', error)
    res.status(500).json(fail(error.message || '读取诊断报告失败'))
  }
})
