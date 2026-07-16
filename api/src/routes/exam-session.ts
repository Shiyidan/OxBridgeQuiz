
// 处理考试开始或恢复、增量保存及原子交卷流程。
import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonField, parseJsonArray } from '../utils/jsonField.js'
import { checkMemberAccess } from '../services/member.js'
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

import { safeJsonParse, parseQueryList, parseDateBoundary, parsePositiveInt, getQuestionKey, buildAnswerRecordRows, countCorrectAnswers, ExamResponseInput, ExamProgressConflictError, normalizeExamResponses, responseMaps, usesContinuousExamClock, buildExamDeadline, continuousExamDurationSeconds, replaceAnswerRecords, collectSyllabusCodes, jsonPointsHaveCode, calculateNinePointScore } from './exam-shared.js'
export const examSessionRouter = Router()

examSessionRouter.post('/start', requireAuth, async (req, res) => {
  try {

    const { paperId, examType, questionIds, debugRetake } = req.body as {
      paperId?: string
      examType?: string
      questionIds?: unknown
      startedAt?: string
      debugRetake?: boolean | string
    }
    const isDebugRetake = debugRetake === true || debugRetake === '1'
    let targetPaperId = paperId || 'question-bank'
    let targetExamType = examType || EXAM_TYPE.TMUA
    let targetPaperType: string = PAPER_TYPE.AI_PAPER
    let targetDurationMinutes = 60

    if (paperId) {
      const paper = await prisma.paper.findUnique({ where: { id: paperId } })
      if (!paper) {
        res.status(404).json(fail('Paper not found'))
        return
      }
      targetExamType = paper.examType
      targetPaperType = normalizePaperType(paper.paperType)
      targetDurationMinutes = paper.duration
    }
    if (!isExamType(targetExamType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }

    const isDiagnostic = isRealPaperType(targetPaperType)
    const usesContinuousClock = usesContinuousExamClock(targetPaperType)
    const existingRecord = isDiagnostic && !isDebugRetake
      ? await prisma.examRecord.findFirst({
          where: {
            userId: req.user!.userId,
            paperId: targetPaperId,
            status: EXAM_RECORD_STATUS.IN_PROGRESS,
          },
          include: {
            answers: {
              select: {
                questionId: true,
                selectedAnswer: true,
                durationSeconds: true,
                answerState: true,
              },
            },
          },
          orderBy: { startedAt: 'desc' },
        })
      : null

    if (existingRecord) {
      const answers: Record<string, string> = {}
      const questionDurations: Record<string, number> = {}
      const answerStates: Record<string, AnswerRecordState> = {}
      for (const answer of existingRecord.answers) {
        if (answer.selectedAnswer) answers[answer.questionId] = answer.selectedAnswer
        questionDurations[answer.questionId] = answer.durationSeconds
        answerStates[answer.questionId] = isAnswerRecordState(answer.answerState)
          ? answer.answerState
          : answer.selectedAnswer
            ? ANSWER_RECORD_STATE.ANSWERED
            : answer.durationSeconds > 0
              ? ANSWER_RECORD_STATE.SKIPPED
              : ANSWER_RECORD_STATE.UNSEEN
      }
      const expiresAt = usesContinuousClock
        ? existingRecord.expiresAt || buildExamDeadline(existingRecord.startedAt, targetDurationMinutes)
        : null
      if (expiresAt && !existingRecord.expiresAt) {
        await prisma.examRecord.update({ where: { id: existingRecord.id }, data: { expiresAt } })
      }
      const now = new Date()
      const durationSeconds = expiresAt
        ? continuousExamDurationSeconds(existingRecord.startedAt, expiresAt, now)
        : Object.values(questionDurations).reduce((sum, value) => sum + value, 0)
      res.json(success({
        examRecordId: existingRecord.id,
        paperId: existingRecord.paperId,
        examType: existingRecord.examType,
        totalQuestions: existingRecord.totalQuestions,
        startedAt: existingRecord.startedAt,
        expiresAt,
        status: existingRecord.status,
        isResumed: true,
        isExpired: Boolean(expiresAt && expiresAt.getTime() <= now.getTime()),
        answers,
        questionDurations,
        answerStates,
        durationSeconds,
      }))
      return
    }

    if (!paperId) {
      await prisma.paper.upsert({
        where: { id: 'question-bank' },
        update: { paperType: PAPER_TYPE.AI_PAPER, status: 'published', examType: targetExamType },
        create: {
          id: 'question-bank',

          title: 'Question bank practice',
          examType: targetExamType,
          year: new Date().getFullYear(),
          duration: 60,
          paperType: PAPER_TYPE.AI_PAPER,
          status: 'published',
          questions: [],
        },
      })
      targetPaperId = 'question-bank'
    }

    const requestedQuestionIds = Array.isArray(questionIds)
      ? [...new Set(questionIds.filter((value): value is string => typeof value === 'string' && Boolean(value.trim())))]
      : []
    const questionRows = await prisma.question.findMany({
      where: isDiagnostic
        ? { paperId: targetPaperId }
        : { id: { in: requestedQuestionIds }, examType: targetExamType },
      orderBy: [{ paperId: 'asc' }, { number: 'asc' }],
      select: { id: true, answer: true },
    })
    if (!questionRows.length || (!isDiagnostic && questionRows.length !== requestedQuestionIds.length)) {
      res.status(422).json(fail('考试题目不存在或不属于当前考试类型'))
      return
    }
    const officialQuestions = questionRows.map((question) => ({
      id: question.id,
      answer: parseJsonArray<string>(question.answer),
    }))

    const skipEntitlement = isDiagnostic && isDebugRetake
    if (!skipEntitlement) {
      const entitlement = await checkMemberAccess(
        req.user!.userId,
        isDiagnostic ? 'diagnostic' : 'question-bank',
        targetExamType,
        isDiagnostic ? 1 : officialQuestions.length,
      )
      if (!entitlement.allowed) {
        res.status(403).json(fail('当前额度不足，请开通会员后继续'))
        return
      }
    }

    const examRecord = await prisma.$transaction(async (tx) => {
      // 真题和仿真考试使用服务端开始时间，防止客户端修改截止时间。
      const serverStartedAt = new Date()
      const expiresAt = usesContinuousClock
        ? buildExamDeadline(serverStartedAt, targetDurationMinutes)
        : null
      const record = await tx.examRecord.create({
        data: {
          userId: req.user!.userId,
          paperId: targetPaperId,
          examType: targetExamType,
          totalQuestions: officialQuestions.length,
          correctCount: 0,
          startedAt: serverStartedAt,
          expiresAt,
          submittedAt: null,
          durationSeconds: 0,
          status: EXAM_RECORD_STATUS.IN_PROGRESS,
        },
      })
      await replaceAnswerRecords(tx, record.id, officialQuestions, {}, {}, {}, true)
      return record
    })

    res.json(success({
      examRecordId: examRecord.id,
      paperId: examRecord.paperId,
      examType: examRecord.examType,
      totalQuestions: examRecord.totalQuestions,
      startedAt: examRecord.startedAt,
      expiresAt: examRecord.expiresAt,
      status: examRecord.status,
      isResumed: false,
      isExpired: false,
      answers: {},
      questionDurations: {},
      answerStates: {},
      durationSeconds: 0,
    }))
  } catch (error: any) {
    console.error('Exam start error:', error)
    res.status(500).json(fail(error.message || '开始考试失败'))
  }
})

// 按考试记录保存进度；startedAt 只在 start 创建记录时写入，此处不会覆盖。
examSessionRouter.put('/:id/progress', requireAuth, async (req, res) => {
  try {
    const record = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      select: { id: true, status: true, expiresAt: true },
    })
    if (!record) {
      res.status(404).json(fail('Exam record not found'))
      return

    }
    if (record.status !== EXAM_RECORD_STATUS.IN_PROGRESS) {
      res.status(409).json(fail('已交卷记录不能继续保存进度', 'EXAM_ALREADY_SUBMITTED'))
      return
    }
    if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
      res.status(409).json(fail('考试时间已结束，请提交当前答卷', 'EXAM_EXPIRED'))
      return
    }

    const responses = normalizeExamResponses(req.body?.responses)
    if (!responses.length) {
      res.status(400).json(fail('至少需要提交一道发生变化的题目'))
      return
    }

    const responseQuestionIds = responses.map((response) => response.questionId)
    const scopedQuestionCount = await prisma.answerRecord.count({
      where: {
        examRecordId: record.id,
        questionId: { in: responseQuestionIds },
      },
    })
    if (scopedQuestionCount !== responseQuestionIds.length) {
      res.status(422).json(fail('提交的题目不属于当前考试记录'))
      return
    }

    try {
      await prisma.$transaction(async (tx) => {
        const updateResults = await Promise.all(responses.map((response) => {
          return tx.answerRecord.updateMany({
            where: {
              examRecordId: record.id,
              questionId: response.questionId,
              examRecord: { status: EXAM_RECORD_STATUS.IN_PROGRESS },
            },
            data: {
              selectedAnswer: response.selectedAnswer,
              answerState: response.answerState,
              durationSeconds: response.durationSeconds,
              answeredAt: response.selectedAnswer ? new Date() : null,
            },
          })
        }))
        if (updateResults.some((result) => result.count !== 1)) {
          throw new ExamProgressConflictError('Exam was submitted while progress was being saved')
        }
      })
    } catch (error) {
      if (error instanceof ExamProgressConflictError) {
        res.status(409).json(fail('考试已交卷，当前进度未再写入', 'EXAM_ALREADY_SUBMITTED'))
        return
      }
      throw error
    }

    res.json(success({
      examRecordId: record.id,
      status: record.status,
      savedQuestionIds: responseQuestionIds,
    }))
  } catch (e: any) {
    console.error('Exam progress save error:', e)
    res.status(500).json(fail(e.message || '保存答题进度失败'))
  }
})

// 按考试记录交卷；题目范围、考试类型和试卷信息全部由服务端记录推导。
examSessionRouter.post('/:id/submit', requireAuth, async (req, res) => {
  try {
    const record = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        paper: true,
        answers: { select: { questionId: true } },
        diagnosticReportTask: true,
      },
    })
    if (!record) {
      res.status(404).json(fail('Exam record not found'))
      return
    }

    const isDiagnostic = isRealPaperType(record.paper.paperType)
    const usesContinuousClock = usesContinuousExamClock(record.paper.paperType)
    if (record.status === EXAM_RECORD_STATUS.SUBMITTED) {
      const task = isDiagnostic
        ? await ensureDiagnosticReportTask(record.id, req.user!.userId)
        : null
      res.json(success({
        examRecordId: record.id,
        totalQuestions: record.totalQuestions,
        correctCount: record.correctCount,
        wrongCount: record.totalQuestions - record.correctCount,
        durationSeconds: record.durationSeconds,
        reportStatus: task?.status || null,
      }))
      return
    }

    if (record.status !== EXAM_RECORD_STATUS.IN_PROGRESS) {
      res.status(409).json(fail('当前考试记录不能交卷'))
      return
    }

    const responses = normalizeExamResponses(req.body?.responses)
    const maps = responseMaps(responses)
    const scopedQuestionIds = record.answers.map((answer) => answer.questionId)
    const questionRows = await prisma.question.findMany({
      where: isDiagnostic ? { paperId: record.paperId } : { id: { in: scopedQuestionIds } },
      orderBy: [{ paperId: 'asc' }, { number: 'asc' }],
      select: { id: true, answer: true },
    })
    if (!questionRows.length) {
      res.status(422).json(fail('当前考试记录没有可提交的正式题目'))
      return
    }
    const officialQuestions = questionRows.map((question) => ({
      id: question.id,
      answer: parseJsonArray<string>(question.answer),
    }))

    const debugRetake = req.body?.debugRetake === true || req.body?.debugRetake === '1'
    // 题库练习在 start 创建题目范围时已完成额度校验；诊断测试在正式交卷前再次校验次数。
    if (isDiagnostic && !debugRetake) {
      const entitlement = await checkMemberAccess(
        req.user!.userId,
        'diagnostic',
        record.examType,
        1,
      )
      if (!entitlement.allowed) {
        // 并发重复提交可能在额度检查前已由另一个请求完成，优先返回既有结果。
        const submittedRecord = await prisma.examRecord.findFirst({
          where: {
            id: record.id,
            userId: req.user!.userId,
            status: EXAM_RECORD_STATUS.SUBMITTED,
          },
          include: { diagnosticReportTask: { select: { status: true } } },
        })
        if (submittedRecord) {
          res.json(success({
            examRecordId: submittedRecord.id,
            totalQuestions: submittedRecord.totalQuestions,
            correctCount: submittedRecord.correctCount,
            wrongCount: submittedRecord.totalQuestions - submittedRecord.correctCount,
            durationSeconds: submittedRecord.durationSeconds,
            reportStatus: submittedRecord.diagnosticReportTask?.status || null,
          }))
          return
        }
        res.status(403).json(fail('当前额度不足，请开通会员后继续'))
        return
      }
    }

    const submissionKey = typeof req.body?.submissionKey === 'string' && req.body.submissionKey.trim()
      ? req.body.submissionKey.trim().slice(0, 191)
      : record.submissionKey
    const correctCount = countCorrectAnswers(officialQuestions, maps.answers)
    const submittedAt = new Date()
    const expiresAt = usesContinuousClock
      ? record.expiresAt || buildExamDeadline(record.startedAt, record.paper.duration)
      : null
    const durationSeconds = expiresAt
      ? continuousExamDurationSeconds(record.startedAt, expiresAt, submittedAt)
      : Object.values(maps.durations).reduce((sum, value) => sum + Math.max(0, value), 0)
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.examRecord.updateMany({
        where: { id: record.id, status: EXAM_RECORD_STATUS.IN_PROGRESS },
        data: {
          totalQuestions: officialQuestions.length,
          correctCount,
          submissionKey,
          expiresAt,
          submittedAt,
          durationSeconds,
          status: EXAM_RECORD_STATUS.SUBMITTED,
        },
      })
      if (!claimed.count) {
        const existingRecord = await tx.examRecord.findUnique({ where: { id: record.id } })
        const existingTask = isDiagnostic
          ? await tx.diagnosticReportTask.findUnique({
              where: { examRecordId: record.id },
              select: { status: true },
            })
          : null
        return { examRecord: existingRecord, task: existingTask, claimed: false }
      }

      await replaceAnswerRecords(
        tx,
        record.id,
        officialQuestions,
        maps.answers,
        maps.durations,
        maps.states,
        true,

      )
      const task = isDiagnostic
        ? await tx.diagnosticReportTask.upsert({
            where: { examRecordId: record.id },
            update: {},
            create: {
              examRecordId: record.id,
              userId: req.user!.userId,
              paperId: record.paperId,
              reportKind: record.examType.toLowerCase(),
            },
            select: { status: true },
          })
        : null
      const examRecord = await tx.examRecord.findUnique({ where: { id: record.id } })
      return { examRecord, task, claimed: true }
    })

    if (!result.examRecord) {
      res.status(404).json(fail('Exam record not found'))
      return
    }

    if (isDiagnostic && result.claimed) scheduleDiagnosticReportWorker()
    res.json(success({
      examRecordId: result.examRecord.id,
      totalQuestions: result.examRecord.totalQuestions,
      correctCount: result.examRecord.correctCount,
      wrongCount: result.examRecord.totalQuestions - result.examRecord.correctCount,
      durationSeconds: result.examRecord.durationSeconds,
      reportStatus: result.task?.status || null,
    }))
  } catch (error: any) {
    console.error('Exam submit error:', error)
    res.status(500).json(fail(error.message || '交卷失败'))
  }
})

// Profile stats
