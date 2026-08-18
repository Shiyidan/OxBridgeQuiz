
// 提供错题本聚合分页与最近练习记录查询。
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonField, parseJsonArray, parseJsonObject } from '../utils/jsonField.js'
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

type WrongAttemptSourceType = 'diagnostic' | 'question-bank' | 'mock-exam' | 'unknown'

interface WrongAttemptExamRecordMeta {
  id: string
  practiceSnapshot: Prisma.JsonValue | null
  paper: {
    paperType: string
    title: string
  }
}

// 题库答卷以开始练习时冻结的范围快照命名，练习本名称优先于自动生成的专项范围。
function resolveQuestionBankAttemptTitle(snapshotValue: unknown): string {
  const snapshot = parseJsonObject(snapshotValue)
  const notebookName = typeof snapshot.notebookName === 'string' ? snapshot.notebookName.trim() : ''
  if (notebookName) return notebookName

  const knowledgePoint = parseJsonObject(snapshot.knowledgePoint)
  const knowledgePointLabel = typeof knowledgePoint.label === 'string'
    ? knowledgePoint.label.trim()
    : ''
  if (knowledgePointLabel) return `${knowledgePointLabel}专项练习`

  const subject = parseJsonObject(snapshot.subject)
  const subjectLabel = typeof subject.label === 'string' ? subject.label.trim() : ''
  return subjectLabel ? `${subjectLabel}专项练习` : '题库专项练习'
}

// 每次错误事件从所属答卷还原业务来源，避免把题库占位试卷名称展示给学生。
function resolveWrongAttemptSource(
  record: WrongAttemptExamRecordMeta | undefined,
  attemptPaperType: string,
): { type: WrongAttemptSourceType; label: string; title: string } {
  const paperType = record?.paper.paperType || attemptPaperType
  if (paperType === PAPER_TYPE.REAL_PAPER) {
    return {
      type: 'diagnostic',
      label: '诊断测试',
      title: record?.paper.title || '诊断测试试卷',
    }
  }
  if (paperType === PAPER_TYPE.MOCK_PAPER) {
    return {
      type: 'mock-exam',
      label: '模考',
      title: record?.paper.title || '模考试卷',
    }
  }
  if (paperType === PAPER_TYPE.AI_PAPER) {
    return {
      type: 'question-bank',
      label: '试题库',
      title: resolveQuestionBankAttemptTitle(record?.practiceSnapshot),
    }
  }
  return { type: 'unknown', label: '其他来源', title: '历史练习' }
}

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
    const filteredAttempts = summaryIds.length
      ? await prisma.wrongQuestionAttempt.findMany({
          where: {
            summaryId: { in: summaryIds },
            ...attemptWhere,
          },
          orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
          select: {
            id: true,
            summaryId: true,
            answerRecordId: true,
            examRecordId: true,
            paperType: true,
            submittedAt: true,
            selectedAnswer: true,
          },
        })
      : []
    const answerRecordIds = filteredAttempts.map((attempt) => attempt.answerRecordId)
    const examRecordIds = [...new Set(filteredAttempts.map((attempt) => attempt.examRecordId))]
    const [answerRecords, examRecords] = await Promise.all([
      answerRecordIds.length
        ? prisma.answerRecord.findMany({
            where: {
              id: { in: answerRecordIds },
              examRecord: { userId: req.user!.userId },
            },
            select: { id: true, durationSeconds: true, answeredAt: true },
          })
        : [],
      examRecordIds.length
        ? prisma.examRecord.findMany({
            where: { id: { in: examRecordIds }, userId: req.user!.userId },
            select: {
              id: true,
              paper: { select: { paperType: true, title: true } },
            },
          })
        : [],
    ])
    const answerRecordMap = new Map(answerRecords.map((answer) => [answer.id, answer]))
    const examRecordMap = new Map(examRecords.map((record) => [record.id, record]))
    const attemptsBySummary = new Map<string, typeof filteredAttempts>()
    for (const attempt of filteredAttempts) {
      const attempts = attemptsBySummary.get(attempt.summaryId) || []
      attempts.push(attempt)
      attemptsBySummary.set(attempt.summaryId, attempts)
    }

    const list = summaries.map((summary) => {
      const matchingAttempts = attemptsBySummary.get(summary.id) || []
      const latestAttempt = matchingAttempts[0]
      const latestAnswerRecord = latestAttempt
        ? answerRecordMap.get(latestAttempt.answerRecordId)
        : undefined
      const latestExamRecord = latestAttempt
        ? examRecordMap.get(latestAttempt.examRecordId)
        : undefined
      const selectedAnswers = [...matchingAttempts].reverse().reduce<string[]>((answers, attempt) => {
        const selectedAnswer = attempt.selectedAnswer?.trim()
        if (selectedAnswer && !answers.includes(selectedAnswer)) answers.push(selectedAnswer)
        return answers
      }, [])
      const filteredPaperType = latestExamRecord?.paper.paperType || latestAttempt?.paperType || ''
      const filteredPaperTitle = latestExamRecord?.paper.title
        || (filteredPaperType === PAPER_TYPE.MOCK_PAPER
          ? '模考试卷'
          : filteredPaperType === PAPER_TYPE.REAL_PAPER
            ? '诊断测试试卷'
            : '题库专项练习')
      return {
        id: latestAttempt?.answerRecordId || summary.latestAnswerRecordId,
        questionId: summary.questionId,
        examType: summary.examType || summary.question.examType || '',
        title: summary.question.title || '',
        difficulty: summary.question.difficulty || '',
        subject: summary.question.subject || '',
        subjectCode: summary.question.subjectCode || '',
        knowledge_points: safeJsonParse(summary.question.knowledgePoints, []),
        selectedAnswer: matchingAttempts.length
          ? selectedAnswers.join(', ') || latestAttempt?.selectedAnswer || null
          : summary.latestSelectedAnswer,
        selectedAnswers,
        wrongCount: matchingAttempts.length || summary.wrongCount,
        isCorrect: false,
        durationSeconds: matchingAttempts.length
          ? latestAnswerRecord?.durationSeconds || 0
          : summary.latestDurationSeconds,
        answeredAt: matchingAttempts.length
          ? latestAnswerRecord?.answeredAt || null
          : summary.latestAnsweredAt,
        examRecord: {
          id: latestAttempt?.examRecordId || summary.latestExamRecordId,
          examType: summary.examType,
          submittedAt: latestAttempt?.submittedAt || summary.latestWrongAt,
          paper: {
            paperType: matchingAttempts.length ? filteredPaperType : summary.latestPaperType,
            title: matchingAttempts.length ? filteredPaperTitle : summary.latestPaperTitle,
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

// 单题错误历史按最近提交优先返回，并从答卷与练习快照补齐每次错误的来源名称。
errorBookRouter.get('/error-book/:questionId/attempts', requireAuth, async (req, res) => {
  try {
    const questionId = String(req.params.questionId || '').trim()
    if (!questionId) {
      res.status(422).json(fail('题目 ID 不能为空'))
      return
    }

    const summary = await prisma.wrongQuestionSummary.findUnique({
      where: {
        userId_questionId: {
          userId: req.user!.userId,
          questionId,
        },
      },
      select: { id: true },
    })
    if (!summary) {
      res.status(404).json(fail('未找到该题的错题记录', 'WRONG_QUESTION_NOT_FOUND'))
      return
    }

    const attempts = await prisma.wrongQuestionAttempt.findMany({
      where: { summaryId: summary.id, userId: req.user!.userId },
      orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        answerRecordId: true,
        examRecordId: true,
        paperType: true,
        submittedAt: true,
        selectedAnswer: true,
      },
    })
    const answerRecordIds = attempts.map((attempt) => attempt.answerRecordId)
    const examRecordIds = [...new Set(attempts.map((attempt) => attempt.examRecordId))]
    const [answerRecords, examRecords] = await Promise.all([
      answerRecordIds.length
        ? prisma.answerRecord.findMany({
            where: {
              id: { in: answerRecordIds },
              examRecord: { userId: req.user!.userId },
            },
            select: {
              id: true,
              answerState: true,
              answeredAt: true,
              durationSeconds: true,
            },
          })
        : [],
      examRecordIds.length
        ? prisma.examRecord.findMany({
            where: { id: { in: examRecordIds }, userId: req.user!.userId },
            select: {
              id: true,
              practiceSnapshot: true,
              paper: { select: { paperType: true, title: true } },
            },
          })
        : [],
    ])
    const answerRecordMap = new Map(answerRecords.map((answer) => [answer.id, answer]))
    const examRecordMap = new Map(examRecords.map((record) => [record.id, record]))

    res.json(success({
      questionId,
      total: attempts.length,
      list: attempts.map((attempt) => {
        const answerRecord = answerRecordMap.get(attempt.answerRecordId)
        const source = resolveWrongAttemptSource(
          examRecordMap.get(attempt.examRecordId),
          attempt.paperType,
        )
        const answerState = answerRecord && isAnswerRecordState(answerRecord.answerState)
          ? answerRecord.answerState
          : attempt.selectedAnswer
            ? ANSWER_RECORD_STATE.ANSWERED
            : ANSWER_RECORD_STATE.UNSEEN
        return {
          id: attempt.id,
          examRecordId: attempt.examRecordId,
          submittedAt: attempt.submittedAt,
          answeredAt: answerRecord?.answeredAt || null,
          selectedAnswer: attempt.selectedAnswer,
          answerState,
          durationSeconds: answerRecord?.durationSeconds || 0,
          sourceType: source.type,
          sourceLabel: source.label,
          sourceTitle: source.title,
        }
      }),
    }))
  } catch (e: any) {
    logRuntimeError('error_book.attempt_history_failed', e)
    res.status(500).json(fail(e.message || '获取错题历史失败'))
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
