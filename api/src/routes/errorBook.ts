
// 提供错题本聚合分页与最近练习记录查询。
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
import { logRuntimeError } from '../utils/runtimeLogger.js'
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
  type QuestionDifficulty,
  REAL_PAPER_TYPES,
  isQuestionDifficulty,
  isExamType,
  isAnswerRecordState,
  isRealPaperType,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'

import { safeJsonParse, parseQueryList, parseDateBoundary, parsePositiveInt, getQuestionKey, buildAnswerRecordRows, countCorrectAnswers, ExamResponseInput, normalizeExamResponses, responseMaps, usesContinuousExamClock, buildExamDeadline, continuousExamDurationSeconds, replaceAnswerRecords, collectSyllabusCodes, calculateNinePointScore } from './exam-shared.js'
export const errorBookRouter = createAsyncRouter()

// 错题本
errorBookRouter.get('/error-book', requireAuth, async (req, res) => {
  try {
    const requestedExamType = String(
      Array.isArray(req.query.examType) ? req.query.examType[0] : req.query.examType || '',
    ).trim().toUpperCase()
    if (requestedExamType && !isExamType(requestedExamType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    const examType = requestedExamType || undefined
    const difficulties = parseQueryList(req.query.difficulty)
    if (difficulties.some((difficulty) => !isQuestionDifficulty(difficulty))) {
      res.status(422).json(fail('无效的错题难度，仅支持低、中、高'))
      return
    }
    const validDifficulties = difficulties as QuestionDifficulty[]
    const paperTypes = parseQueryList(req.query.paperType).flatMap((value) => paperTypeWhereValues(value))
    const subjectCodes = parseQueryList(req.query.subjectCode)
    const requestedSyllabusCodes = parseQueryList(req.query.syllabusCode)
    if (requestedSyllabusCodes.length && !examType) {
      res.status(422).json(fail('筛选知识点前请先选择考试类型'))
      return
    }
    const syllabusCodes = await collectSyllabusCodes(requestedSyllabusCodes, examType)
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
    const startDate = parseDateBoundary(req.query.startDate, 'start')
    const endDate = parseDateBoundary(req.query.endDate, 'end')
    const wrongTimeWhere: Prisma.DateTimeFilter = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lt: endDate } : {}),
    }
    const hasTimeFilter = Boolean(startDate || endDate)
    const attemptWhere: Prisma.WrongQuestionAttemptWhereInput = {
      ...(paperTypes.length ? { paperType: { in: paperTypes } } : {}),
      ...(hasTimeFilter ? { submittedAt: wrongTimeWhere } : {}),
    }
    const questionWhere: Prisma.QuestionWhereInput = {
      ...(examType ? { examType } : {}),
      ...(validDifficulties.length ? { difficulty: { in: validDifficulties } } : {}),
      ...(subjectCodes.length ? { subjectCode: { in: subjectCodes } } : {}),
      ...(syllabusCodes.length
        ? {
            OR: [
              {
                knowledgePointLinks: {
                  some: { syllabusNode: { code: { in: syllabusCodes } } },
                },
              },
              { subjectCode: { in: syllabusCodes } },
              { topicCode: { in: syllabusCodes } },
            ],
          }
        : {}),
    }
    const summaryWhere: Prisma.WrongQuestionSummaryWhereInput = {
      userId: req.user!.userId,
      ...(examType ? { examType } : {}),
      ...(paperTypes.length || hasTimeFilter ? { attempts: { some: attemptWhere } } : {}),
      question: questionWhere,
    }

    const [total, globalDateBounds] = await Promise.all([
      prisma.wrongQuestionSummary.count({ where: summaryWhere }),
      prisma.wrongQuestionAttempt.aggregate({
        where: { userId: req.user!.userId },
        _min: { submittedAt: true },
        _max: { submittedAt: true },
      }),
    ])
    const totalPages = Math.ceil(total / pageSize)
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
    const summaries = await prisma.wrongQuestionSummary.findMany({
      where: summaryWhere,
      orderBy: [{ latestWrongAt: 'desc' }, { id: 'asc' }],
      skip: (safePage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        questionId: true,
        examType: true,
        wrongCount: true,
        latestWrongAt: true,
        latestAnswerRecordId: true,
        latestExamRecordId: true,
        latestSelectedAnswer: true,
        latestDurationSeconds: true,
        latestAnsweredAt: true,
        latestPaperType: true,
        latestPaperTitle: true,
        question: {
          select: {
            examType: true,
            title: true,
            difficulty: true,
            subject: true,
            subjectCode: true,
            knowledgePoints: true,
          },
        },
      },
    })
    const summaryIds = summaries.map((summary) => summary.id)
    const selectedAnswerGroups = summaryIds.length
      ? await prisma.wrongQuestionAttempt.groupBy({
          by: ['summaryId', 'selectedAnswer'],
          where: {
            summaryId: { in: summaryIds },
            selectedAnswer: { not: null },
          },
          _min: { submittedAt: true },
          orderBy: [{ _min: { submittedAt: 'asc' } }, { selectedAnswer: 'asc' }],
        })
      : []
    const selectedAnswersBySummary = new Map<string, string[]>()
    for (const group of selectedAnswerGroups) {
      const selectedAnswer = group.selectedAnswer?.trim()
      if (!selectedAnswer) continue
      const answers = selectedAnswersBySummary.get(group.summaryId) || []
      answers.push(selectedAnswer)
      selectedAnswersBySummary.set(group.summaryId, answers)
    }

    const list = summaries.map((summary) => {
      const selectedAnswers = selectedAnswersBySummary.get(summary.id) || []
      return {
        id: summary.latestAnswerRecordId,
        questionId: summary.questionId,
        examType: summary.examType || summary.question.examType || '',
        title: summary.question.title || '',
        difficulty: summary.question.difficulty || '',
        subject: summary.question.subject || '',
        subjectCode: summary.question.subjectCode || '',
        knowledge_points: safeJsonParse(summary.question.knowledgePoints, []),
        selectedAnswer: selectedAnswers.join(', ') || summary.latestSelectedAnswer,
        selectedAnswers,
        wrongCount: summary.wrongCount,
        isCorrect: false,
        durationSeconds: summary.latestDurationSeconds,
        answeredAt: summary.latestAnsweredAt,
        examRecord: {
          id: summary.latestExamRecordId,
          examType: summary.examType,
          submittedAt: summary.latestWrongAt,
          paper: {
            paperType: summary.latestPaperType,
            title: summary.latestPaperTitle,
          },
        },
      }
    })

    res.json(success({
      list,
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: totalPages > 0 && safePage < totalPages,
      },
      dateBounds: {
        min: globalDateBounds._min.submittedAt,
        max: globalDateBounds._max.submittedAt,
      },
    }))
  } catch (e: any) {
    logRuntimeError('error_book.list_failed', e)
    res.status(500).json(fail(e.message || '获取错题本失败'))
  }
})

// 开始或恢复考试；诊断真题复用进行中记录，明确重测时创建新记录。
// Practice records
errorBookRouter.get('/practice-records', requireAuth, async (req, res) => {
  try {
    const records = await prisma.examRecord.findMany({
      where: {
        userId: req.user!.userId,
        status: 'submitted',
        paperId: 'question-bank',
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    })

    res.json(success({
      records: records.map((record) => ({
        id: record.id,
        examType: record.examType,
        totalQuestions: record.totalQuestions,
        correctCount: record.correctCount,
        startedAt: record.startedAt,
        submittedAt: record.submittedAt,
        durationSeconds: record.submittedAt ? record.durationSeconds : null,
      })),
    }))
  } catch (e: any) {
    logRuntimeError('practice_records.list_failed', e)

    res.status(500).json(fail(e.message || '获取练习记录失败'))
  }
})
