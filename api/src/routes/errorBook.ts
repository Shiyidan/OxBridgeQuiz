
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
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  isExamType,
  isAnswerRecordState,
  isRealPaperType,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'

import { safeJsonParse, parseQueryList, parseDateBoundary, parsePositiveInt, getQuestionKey, buildAnswerRecordRows, countCorrectAnswers, ExamResponseInput, normalizeExamResponses, responseMaps, usesContinuousExamClock, buildExamDeadline, continuousExamDurationSeconds, replaceAnswerRecords, collectSyllabusCodes, jsonPointsHaveCode, calculateNinePointScore } from './exam-shared.js'
export const errorBookRouter = createAsyncRouter()

errorBookRouter.get('/error-book', requireAuth, async (req, res) => {
  try {
    const difficulties = parseQueryList(req.query.difficulty)
    const paperTypes = parseQueryList(req.query.paperType).flatMap((value) => paperTypeWhereValues(value))
    const syllabusCodes = await collectSyllabusCodes(parseQueryList(req.query.syllabusCode))
    const page = parsePositiveInt(req.query.page, 1)
    const pageSize = parsePositiveInt(req.query.pageSize, 20, 100)
    const startDate = parseDateBoundary(req.query.startDate, 'start')
    const endDate = parseDateBoundary(req.query.endDate, 'end')
    const wrongTimeWhere = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lt: endDate } : {}),
    }
    const hasTimeFilter = Boolean(startDate || endDate)
    const hasQuestionFilter = difficulties.length > 0 || syllabusCodes.length > 0
    let questionSummaries: Array<{
      id: string
      title: string
      difficulty: string | null
      knowledgePoints: unknown
      subjectCode: string | null
      topicCode: string | null
    }> = []

    if (hasQuestionFilter) {
      const candidates = await prisma.question.findMany({
        where: difficulties.length ? { difficulty: { in: difficulties } } : {},
        select: {
          id: true,
          title: true,
          difficulty: true,
          knowledgePoints: true,
          subjectCode: true,
          topicCode: true,
        },
      })
      questionSummaries = syllabusCodes.length
        ? candidates.filter(
            (question) =>
              jsonPointsHaveCode(question.knowledgePoints, syllabusCodes) ||
              (question.subjectCode && syllabusCodes.includes(question.subjectCode)) ||
              (question.topicCode && syllabusCodes.includes(question.topicCode)),
          )
        : candidates
    }

    const wrongAnswers = await prisma.answerRecord.findMany({
      where: {
        examRecord: {
          userId: req.user!.userId,
          ...(paperTypes.length ? { paper: { paperType: { in: paperTypes } } } : {}),
          ...(hasTimeFilter ? { submittedAt: wrongTimeWhere } : {}),
        },
        isCorrect: false,
        ...(hasQuestionFilter
          ? { questionId: { in: questionSummaries.map((question) => question.id) } }
          : {}),
      },
      include: {

        examRecord: {
          select: {
            id: true,
            submittedAt: true,
            paper: { select: { paperType: true, title: true } },
          },
        },
      },
    })
    const sortedWrongAnswers = wrongAnswers.sort((a, b) => {
      const bTime = new Date(b.examRecord.submittedAt || 0).getTime()
      const aTime = new Date(a.examRecord.submittedAt || 0).getTime()
      return bTime - aTime
    })

    const questionRows = hasQuestionFilter
      ? questionSummaries
      : await prisma.question.findMany({
          where: { id: { in: sortedWrongAnswers.map((answer) => answer.questionId) } },
          select: {
            id: true,
            title: true,
            difficulty: true,
            knowledgePoints: true,
          },
        })
    const questionMap = new Map(questionRows.map((question) => [question.id, question]))
    const groupedWrongAnswers = new Map<
      string,
      {
        latest: (typeof sortedWrongAnswers)[number]
        wrongCount: number
        selectedAnswers: string[]
      }
    >()

    for (const answer of sortedWrongAnswers) {
      const group = groupedWrongAnswers.get(answer.questionId)
      if (group) {
        group.wrongCount += 1
      } else {
        groupedWrongAnswers.set(answer.questionId, {
          latest: answer,
          wrongCount: 1,
          selectedAnswers: [],
        })
      }
    }

    for (const answer of [...sortedWrongAnswers].reverse()) {
      const selectedAnswer = answer.selectedAnswer?.trim()
      const group = groupedWrongAnswers.get(answer.questionId)
      if (selectedAnswer && group && !group.selectedAnswers.includes(selectedAnswer)) {
        group.selectedAnswers.push(selectedAnswer)
      }
    }

    const allItems = Array.from(groupedWrongAnswers.values()).map((group) => {
      const answer = group.latest
      const question = questionMap.get(answer.questionId)
      return {
        id: answer.id,
        questionId: answer.questionId,
        title: question?.title || '',
        difficulty: question?.difficulty || '',
        knowledge_points: question ? safeJsonParse(question.knowledgePoints, []) : [],
        selectedAnswer: group.selectedAnswers.join(', ') || answer.selectedAnswer,
        selectedAnswers: group.selectedAnswers,
        wrongCount: group.wrongCount,
        isCorrect: answer.isCorrect,
        durationSeconds: answer.durationSeconds,
        answeredAt: answer.answeredAt,
        examRecord: answer.examRecord,
      }
    })
    const total = allItems.length
    const totalPages = Math.ceil(total / pageSize)
    const safePage = totalPages > 0 ? Math.min(page, totalPages) : 1
    const startIndex = (safePage - 1) * pageSize

    res.json(success({
      list: allItems.slice(startIndex, startIndex + pageSize),
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: totalPages > 0 && safePage < totalPages,
      },
    }))
  } catch (e: any) {
    logRuntimeError('error_book.list_failed', e)
    res.status(500).json(fail(e.message || 'Get error book failed'))
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
        paper: { paperType: { in: [...QUESTION_BANK_PAPER_TYPES] } },
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
