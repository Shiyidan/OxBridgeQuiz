// 处理考试开始或恢复、增量保存及原子交卷流程。
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonField, parseJsonArray } from '../utils/jsonField.js'
import { checkMemberAccess, hasDiagnosticPaperAccess } from '../services/member.js'
import { withQuotaTransaction } from '../services/transactionRetry.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { computeScores } from '../services/scoring.js'
import { setOperationAuditContext } from '../middleware/operationAudit.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
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
  EXAM_PHASE,
  PAPER_DELIVERY_MODE,
  PAPER_TYPE,
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  isExamType,
  isAnswerRecordState,
  isRealPaperType,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'

import {
  buildModuleExamSnapshot,
  getModuleExamSession,
  moduleSnapshotJson,
  parseModuleExamSnapshot,
  reconcileExpiredModuleTimeline,
  reconcileModuleBreak,
} from '../services/moduleExamSession.js'

import { safeJsonParse, parseQueryList, parseDateBoundary, parsePositiveInt, getQuestionKey, buildAnswerRecordRows, countCorrectAnswers, ExamResponseInput, ExamProgressConflictError, normalizeExamResponses, responseMaps, usesContinuousExamClock, buildExamDeadline, continuousExamDurationSeconds, replaceAnswerRecords, collectSyllabusCodes, jsonPointsHaveCode, calculateNinePointScore } from './exam-shared.js'
export const examSessionRouter = createAsyncRouter()

examSessionRouter.post('/start', requireAuth, async (req, res) => {
  try {

    const { paperId, examType, questionIds } = req.body as {
      paperId?: string
      examType?: string
      questionIds?: unknown
    }
    let targetPaperId = paperId || 'question-bank'
    let targetExamType = examType || EXAM_TYPE.TMUA
    let targetPaperType: string = PAPER_TYPE.AI_PAPER
    let targetDeliveryMode: string = PAPER_DELIVERY_MODE.CONTINUOUS
    let targetDurationMinutes = 60
    let targetPaper: any = null

    if (paperId) {
      const paper = await prisma.paper.findUnique({ where: { id: paperId } })
      if (!paper) {
        res.status(404).json(fail('Paper not found'))
        return
      }
      targetExamType = paper.examType
      targetPaperType = normalizePaperType(paper.paperType)
      targetDeliveryMode = paper.deliveryMode
      targetDurationMinutes = paper.duration
      targetPaper = paper
      if (isRealPaperType(targetPaperType) && paper.status !== 'published') {
        res.status(404).json(fail('试卷不存在或尚未发布'))
        return
      }
    }
    if (!isExamType(targetExamType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }

    const isDiagnostic = isRealPaperType(targetPaperType)
    const isModuleSequence = targetDeliveryMode === PAPER_DELIVERY_MODE.MODULE_SEQUENCE
    if (
      isDiagnostic
      && (targetExamType === EXAM_TYPE.ESAT || targetExamType === EXAM_TYPE.TMUA)
      && !isModuleSequence
    ) {
      res.status(422).json(fail(
        `${targetExamType} 诊断卷必须配置完整分段结构后才能开始`,
        'PAPER_STRUCTURE_INVALID',
      ))
      return
    }
    const usesContinuousClock = usesContinuousExamClock(targetPaperType, targetDeliveryMode)
    const existingRecord = isDiagnostic
      ? await prisma.examRecord.findFirst({
          where: {
            userId: req.user!.userId,
            examType: targetExamType,
            status: EXAM_RECORD_STATUS.IN_PROGRESS,
            paper: { paperType: { in: [...REAL_PAPER_TYPES] } },
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
      if (existingRecord.paperId !== targetPaperId) {
        res.status(409).json(fail(
          '当前考试类型已有一场未完成的诊断测试，请先继续并完成该测试',
          'DIAGNOSTIC_IN_PROGRESS',
        ))
        return
      }
      if (isModuleSequence) {
        const session = await getModuleExamSession(
          existingRecord.id,
          req.user!.userId,
          { resumePaused: true },
        )
        if (!session) {
          res.status(409).json(fail('模块化考试会话结构损坏，无法恢复'))
          return
        }
        setOperationAuditContext(req, {
          resourceId: existingRecord.id,
          summary: `恢复 ${existingRecord.examType} 模块化考试`,
        })
        res.json(success({ ...session, isResumed: true }))
        return
      }
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
      setOperationAuditContext(req, {
        resourceId: existingRecord.id,
        summary: `恢复 ${existingRecord.examType} 考试`,
      })
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
      select: {
        id: true,
        answer: true,
        moduleCode: true,
        moduleOrder: true,
      },
    })
    if (!questionRows.length || (!isDiagnostic && questionRows.length !== requestedQuestionIds.length)) {
      res.status(422).json(fail('考试题目不存在或不属于当前考试类型'))
      return
    }
    const officialQuestions = questionRows.map((question) => ({
      id: question.id,
      answer: parseJsonArray<string>(question.answer),
    }))

    const accessAllowed = isDiagnostic
      ? await hasDiagnosticPaperAccess(req.user!.userId, targetPaper)
      : (
          await checkMemberAccess(
            req.user!.userId,
            'question-bank',
            targetExamType,
            officialQuestions.length,
          )
        ).allowed
    if (!accessAllowed) {
      res.status(403).json(fail(
        isDiagnostic
          ? `当前试卷需要开通 ${targetExamType} 会员后才能开始`
          : '当前额度不足，请开通会员后继续',
        isDiagnostic ? 'DIAGNOSTIC_PAPER_LOCKED' : 'QUESTION_BANK_ACCESS_DENIED',
      ))
      return
    }

    const moduleSnapshot = isModuleSequence && targetPaper
      ? buildModuleExamSnapshot(targetPaper as any, questionRows)
      : null

    const examRecord = await prisma.$transaction(async (tx) => {
      // 真题和仿真考试使用服务端开始时间，防止客户端修改截止时间。
      const serverStartedAt = new Date()
      const expiresAt = usesContinuousClock
        ? buildExamDeadline(serverStartedAt, targetDurationMinutes)
        : moduleSnapshot
          ? new Date(serverStartedAt.getTime() + moduleSnapshot.modules[0].durationSeconds * 1000)
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
          phase: moduleSnapshot ? EXAM_PHASE.ANSWERING : EXAM_PHASE.CONTINUOUS,
          currentModuleIndex: 0,
          phaseStartedAt: moduleSnapshot ? serverStartedAt : null,
          phaseExpiresAt: moduleSnapshot ? expiresAt : null,
          structureSnapshot: moduleSnapshot ? moduleSnapshotJson(moduleSnapshot) : Prisma.JsonNull,
          activeDurationSeconds: 0,
          submittedAt: null,
          durationSeconds: 0,
          status: EXAM_RECORD_STATUS.IN_PROGRESS,
          activeDiagnosticKey: isDiagnostic
            ? `${req.user!.userId}:${targetExamType}`
            : null,
        },
      })
      await replaceAnswerRecords(tx, record.id, officialQuestions, {}, {}, {}, true)
      return record
    })

    setOperationAuditContext(req, {
      resourceId: examRecord.id,
      summary: `开始 ${examRecord.examType} 考试`,
    })
    if (moduleSnapshot) {
      const session = await getModuleExamSession(examRecord.id, req.user!.userId)
      if (!session) {
        res.status(500).json(fail('模块化考试会话创建失败'))
        return
      }
      res.json(success({ ...session, isResumed: false }))
      return
    }
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json(fail(
        '当前考试类型已有一场未完成的诊断测试，请返回诊断中心继续作答',
        'DIAGNOSTIC_IN_PROGRESS',
      ))
      return
    }
    logRuntimeError('exam.start_failed', error)
    res.status(500).json(fail(error.message || '开始考试失败'))
  }
})

// 按考试记录保存进度；startedAt 只在 start 创建记录时写入，此处不会覆盖。
examSessionRouter.put('/:id/progress', requireAuth, async (req, res) => {
  try {
    await reconcileModuleBreak(req.params.id, req.user!.userId)
    const record = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        phase: true,
        currentModuleIndex: true,
        structureSnapshot: true,
      },
    })
    if (!record) {
      res.status(404).json(fail('Exam record not found'))
      return

    }
    if (record.status !== EXAM_RECORD_STATUS.IN_PROGRESS) {
      res.status(409).json(fail('已交卷记录不能继续保存进度', 'EXAM_ALREADY_SUBMITTED'))
      return
    }
    const moduleSnapshot = parseModuleExamSnapshot(record.structureSnapshot)
    if (moduleSnapshot && record.phase !== EXAM_PHASE.ANSWERING) {
      res.status(409).json(fail('当前不在分段作答阶段，不能保存题目进度', 'EXAM_NOT_ANSWERING'))
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
    const activeModuleQuestionIds = moduleSnapshot
      ? new Set(moduleSnapshot.modules[record.currentModuleIndex]?.questionIds || [])
      : null
    if (activeModuleQuestionIds && responseQuestionIds.some((id) => !activeModuleQuestionIds.has(id))) {
      res.status(422).json(fail('只能保存当前考试分段内的题目'))
      return
    }
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
              examRecord: moduleSnapshot
                ? {
                    status: EXAM_RECORD_STATUS.IN_PROGRESS,
                    phase: EXAM_PHASE.ANSWERING,
                    currentModuleIndex: record.currentModuleIndex,
                  }
                : { status: EXAM_RECORD_STATUS.IN_PROGRESS },
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
        res.status(409).json(moduleSnapshot
          ? fail('当前考试分段已结束，进度未再写入', 'EXAM_PHASE_CHANGED')
          : fail('考试已交卷，当前进度未再写入', 'EXAM_ALREADY_SUBMITTED'))
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
    logRuntimeError('exam.progress_save_failed', e)
    res.status(500).json(fail(e.message || '保存答题进度失败'))
  }
})

// 刷新或重新进入分段诊断页时，以服务端保存的阶段和截止时间恢复。
examSessionRouter.get('/:id/session', requireAuth, async (req, res) => {
  try {
    const session = await getModuleExamSession(
      req.params.id,
      req.user!.userId,
      { resumePaused: true },
    )
    if (!session) {
      res.status(404).json(fail('模块化考试会话不存在'))
      return
    }
    res.json(success(session))
  } catch (error: any) {
    logRuntimeError('exam.module_session_failed', error)
    res.status(500).json(fail(error.message || '恢复模块化考试失败'))
  }
})

// 学生离开诊断页时冻结当前作答或休息剩余时间，继续测试时再恢复服务端截止时间。
examSessionRouter.post('/:id/pause', requireAuth, async (req, res) => {
  try {
    await reconcileExpiredModuleTimeline(req.params.id, req.user!.userId)
    const record = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      select: {
        id: true,
        status: true,
        phase: true,
        currentModuleIndex: true,
        phaseStartedAt: true,
        phaseExpiresAt: true,
        structureSnapshot: true,
      },
    })
    if (!record) {
      res.status(404).json(fail('Exam record not found'))
      return
    }
    const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
    if (!snapshot) {
      res.status(400).json(fail('当前考试不是模块化诊断测试'))
      return
    }
    if (record.status !== EXAM_RECORD_STATUS.IN_PROGRESS) {
      res.status(409).json(fail('已交卷记录不能暂停', 'EXAM_ALREADY_SUBMITTED'))
      return
    }
    const isAnswering = record.phase === EXAM_PHASE.ANSWERING
    const isBreak = record.phase === EXAM_PHASE.BREAK
    if (!isAnswering && !isBreak) {
      const session = await getModuleExamSession(record.id, req.user!.userId)
      res.json(success(session))
      return
    }

    const activeModule = snapshot.modules[record.currentModuleIndex]
    if (!activeModule || !record.phaseStartedAt || !record.phaseExpiresAt) {
      res.status(409).json(fail('当前考试分段状态不完整，无法暂停'))
      return
    }
    if (record.phaseExpiresAt.getTime() <= Date.now()) {
      await reconcileExpiredModuleTimeline(record.id, req.user!.userId)
      const session = await getModuleExamSession(record.id, req.user!.userId)
      res.json(success(session))
      return
    }
    const requestModuleCode =
      typeof req.body?.moduleCode === 'string' ? req.body.moduleCode.trim() : ''
    const responses = isAnswering && requestModuleCode === activeModule.code
      ? normalizeExamResponses(req.body?.responses)
      : []
    const activeQuestionIds = new Set(activeModule.questionIds)
    if (responses.some((response) => !activeQuestionIds.has(response.questionId))) {
      res.status(422).json(fail('只能保存当前考试分段内的题目'))
      return
    }

    const pausedAt = new Date()
    const elapsedSeconds = isAnswering
      ? Math.max(
          0,
          Math.round(
            (Math.min(pausedAt.getTime(), record.phaseExpiresAt.getTime())
              - record.phaseStartedAt.getTime())
              / 1000,
          ),
        )
      : 0
    try {
      await prisma.$transaction(async (tx) => {
        const answerUpdates = await Promise.all(responses.map((response) => (
          tx.answerRecord.updateMany({
            where: {
              examRecordId: record.id,
              questionId: response.questionId,
              examRecord: {
                status: EXAM_RECORD_STATUS.IN_PROGRESS,
                phase: EXAM_PHASE.ANSWERING,
                currentModuleIndex: record.currentModuleIndex,
              },
            },
            data: {
              selectedAnswer: response.selectedAnswer,
              answerState: response.answerState,
              durationSeconds: response.durationSeconds,
              answeredAt: response.selectedAnswer ? pausedAt : null,
            },
          })
        )))
        if (answerUpdates.some((result) => result.count !== 1)) {
          throw new ExamProgressConflictError('Exam phase changed while pausing')
        }

        const paused = await tx.examRecord.updateMany({
          where: {
            id: record.id,
            userId: req.user!.userId,
            status: EXAM_RECORD_STATUS.IN_PROGRESS,
            phase: record.phase,
            currentModuleIndex: record.currentModuleIndex,
            phaseStartedAt: record.phaseStartedAt,
            phaseExpiresAt: {
              equals: record.phaseExpiresAt,
              gt: pausedAt,
            },
          },
          data: isBreak
            ? {
                phase: EXAM_PHASE.BREAK_PAUSED,
                phaseStartedAt: pausedAt,
                expiresAt: null,
              }
            : {
                phase: EXAM_PHASE.PAUSED,
                phaseStartedAt: pausedAt,
                expiresAt: null,
                activeDurationSeconds: { increment: elapsedSeconds },
              },
        })
        if (paused.count !== 1) {
          throw new ExamProgressConflictError('Exam phase changed while pausing')
        }
      })
    } catch (error) {
      if (error instanceof ExamProgressConflictError) {
        const session = await getModuleExamSession(record.id, req.user!.userId)
        if (session) {
          res.json(success(session))
          return
        }
        res.status(409).json(fail('考试状态已变化，请重新进入后继续', 'EXAM_PHASE_CHANGED'))
        return
      }
      throw error
    }

    setOperationAuditContext(req, {
      resourceId: record.id,
      summary: isBreak
        ? `暂停 ${snapshot.modules[record.currentModuleIndex]?.subject || '下一分段'} 前休息`
        : `暂停 ${snapshot.modules[record.currentModuleIndex]?.subject || '当前分段'} 作答`,
    })
    const session = await getModuleExamSession(record.id, req.user!.userId)
    res.json(success(session))
  } catch (error: any) {
    logRuntimeError('exam.module_pause_failed', error)
    res.status(500).json(fail(error.message || '暂停诊断测试失败'))
  }
})

// 当前分段完成后立即锁定；有休息策略时进入休息，否则直接开启下一分段。
examSessionRouter.post('/:id/module/complete', requireAuth, async (req, res) => {
  try {
    await reconcileModuleBreak(req.params.id, req.user!.userId)
    const record = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!record) {
      res.status(404).json(fail('Exam record not found'))
      return
    }
    const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
    if (!snapshot) {
      res.status(400).json(fail('当前考试不是模块化诊断测试'))
      return
    }
    if (record.status !== EXAM_RECORD_STATUS.IN_PROGRESS) {
      const session = await getModuleExamSession(record.id, req.user!.userId)
      res.json(success(session))
      return
    }
    if (record.phase !== EXAM_PHASE.ANSWERING) {
      const session = await getModuleExamSession(record.id, req.user!.userId)
      res.json(success(session))
      return
    }

    const activeModule = snapshot.modules[record.currentModuleIndex]
    if (!activeModule) {
      res.status(409).json(fail('当前考试分段不存在'))
      return
    }
    const now = new Date()
    const isExpired = Boolean(
      record.phaseExpiresAt && record.phaseExpiresAt.getTime() <= now.getTime(),
    )
    // 截止后只锁定截止前已增量保存的答案，不能通过完成请求补写或改写。
    const responses = isExpired ? [] : normalizeExamResponses(req.body?.responses)
    const activeQuestionIds = new Set(activeModule.questionIds)
    if (responses.some((response) => !activeQuestionIds.has(response.questionId))) {
      res.status(422).json(fail('只能提交当前考试分段内的题目'))
      return
    }

    const endedAt = record.phaseExpiresAt && record.phaseExpiresAt.getTime() <= now.getTime()
      ? record.phaseExpiresAt
      : now
    const elapsedSeconds = record.phaseStartedAt
      ? Math.max(0, Math.round((endedAt.getTime() - record.phaseStartedAt.getTime()) / 1000))
      : 0
    const nextModuleIndex = record.currentModuleIndex + 1
    const isLastModule = nextModuleIndex >= snapshot.modules.length

    await prisma.$transaction(async (tx) => {
      for (const response of responses) {
        await tx.answerRecord.updateMany({
          where: {
            examRecordId: record.id,
            questionId: response.questionId,
            examRecord: {
              status: EXAM_RECORD_STATUS.IN_PROGRESS,
              phase: EXAM_PHASE.ANSWERING,
              currentModuleIndex: record.currentModuleIndex,
            },
          },
          data: {
            selectedAnswer: response.selectedAnswer,
            answerState: response.answerState,
            durationSeconds: response.durationSeconds,
            answeredAt: response.selectedAnswer ? endedAt : null,
          },
        })
      }

      const nextModule = snapshot.modules[nextModuleIndex]
      const hasBreak = snapshot.breakDurationSeconds > 0
      const breakEndsAt = new Date(endedAt.getTime() + snapshot.breakDurationSeconds * 1000)
      const nextModuleExpiresAt = nextModule
        ? new Date(endedAt.getTime() + nextModule.durationSeconds * 1000)
        : null
      await tx.examRecord.updateMany({
        where: {
          id: record.id,
          status: EXAM_RECORD_STATUS.IN_PROGRESS,
          phase: EXAM_PHASE.ANSWERING,
          currentModuleIndex: record.currentModuleIndex,
        },
        data: isLastModule
          ? {
              phase: EXAM_PHASE.READY_TO_SUBMIT,
              currentModuleIndex: record.currentModuleIndex,
              phaseStartedAt: null,
              phaseExpiresAt: null,
              expiresAt: null,
              activeDurationSeconds: { increment: elapsedSeconds },
            }
          : hasBreak
            ? {
                phase: EXAM_PHASE.BREAK,
                currentModuleIndex: nextModuleIndex,
                phaseStartedAt: endedAt,
                phaseExpiresAt: breakEndsAt,
                expiresAt: breakEndsAt,
                activeDurationSeconds: { increment: elapsedSeconds },
              }
            : {
                phase: EXAM_PHASE.ANSWERING,
                currentModuleIndex: nextModuleIndex,
                phaseStartedAt: endedAt,
                phaseExpiresAt: nextModuleExpiresAt,
                expiresAt: nextModuleExpiresAt,
                activeDurationSeconds: { increment: elapsedSeconds },
              },
      })
    })

    const session = await getModuleExamSession(record.id, req.user!.userId)
    res.json(success(session))
  } catch (error: any) {
    logRuntimeError('exam.module_complete_failed', error)
    res.status(500).json(fail(error.message || '完成当前考试分段失败'))
  }
})

// 跳过休息只改变服务端阶段；并发点击或倒计时同时结束时保持幂等。
examSessionRouter.post('/:id/break/skip', requireAuth, async (req, res) => {
  try {
    await reconcileModuleBreak(req.params.id, req.user!.userId)
    const record = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!record) {
      res.status(404).json(fail('Exam record not found'))
      return
    }
    const snapshot = parseModuleExamSnapshot(record.structureSnapshot)
    if (!snapshot) {
      res.status(400).json(fail('当前考试不是模块化诊断测试'))
      return
    }
    if (record.phase === EXAM_PHASE.BREAK) {
      const nextModule = snapshot.modules[record.currentModuleIndex]
      if (!nextModule) {
        res.status(409).json(fail('下一科目模块不存在'))
        return
      }
      const startedAt = new Date()
      const expiresAt = new Date(startedAt.getTime() + nextModule.durationSeconds * 1000)
      await prisma.examRecord.updateMany({
        where: {
          id: record.id,
          status: EXAM_RECORD_STATUS.IN_PROGRESS,
          phase: EXAM_PHASE.BREAK,
          currentModuleIndex: record.currentModuleIndex,
        },
        data: {
          phase: EXAM_PHASE.ANSWERING,
          phaseStartedAt: startedAt,
          phaseExpiresAt: expiresAt,
          expiresAt,
        },
      })
    }
    const session = await getModuleExamSession(record.id, req.user!.userId)
    res.json(success(session))
  } catch (error: any) {
    logRuntimeError('exam.break_skip_failed', error)
    res.status(500).json(fail(error.message || '跳过休息失败'))
  }
})

// 按考试记录交卷；题目范围、考试类型和试卷信息全部由服务端记录推导。
examSessionRouter.post('/:id/submit', requireAuth, async (req, res) => {
  try {
    const record = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        paper: true,
        answers: {
          select: {
            questionId: true,
            selectedAnswer: true,
            durationSeconds: true,
            answerState: true,
          },
        },
        diagnosticReportTask: true,
      },
    })
    if (!record) {
      res.status(404).json(fail('Exam record not found'))
      return
    }

    const isDiagnostic = isRealPaperType(record.paper.paperType)
    const moduleSnapshot = parseModuleExamSnapshot(record.structureSnapshot)
    const usesContinuousClock = usesContinuousExamClock(
      record.paper.paperType,
      record.paper.deliveryMode,
    )
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
    if (moduleSnapshot && record.phase !== EXAM_PHASE.READY_TO_SUBMIT) {
      res.status(409).json(fail('请先完成所有考试分段后再交卷', 'MODULE_NOT_COMPLETED'))
      return
    }

    const responses = moduleSnapshot ? [] : normalizeExamResponses(req.body?.responses)
    const maps = responseMaps(responses)
    if (moduleSnapshot) {
      // 三个模块在各自完成时即已锁定；最终交卷只信任服务端 AnswerRecord，忽略客户端重传。
      for (const answer of record.answers) {
        if (answer.selectedAnswer) {
          maps.answers[answer.questionId] = answer.selectedAnswer
        }
        maps.durations[answer.questionId] = answer.durationSeconds
        if (isAnswerRecordState(answer.answerState)) {
          maps.states[answer.questionId] = answer.answerState
        }
      }
    }
    const scopedQuestionIds = record.answers.map((answer) => answer.questionId)
    const questionRows = await prisma.question.findMany({
      where: { id: { in: scopedQuestionIds } },
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
      : moduleSnapshot
        ? record.activeDurationSeconds
        : Object.values(maps.durations).reduce((sum, value) => sum + Math.max(0, value), 0)
    const result = await withQuotaTransaction(async (tx) => {
      if (isDiagnostic) {
        const latest = await tx.examRecord.findUnique({ where: { id: record.id } })
        if (latest?.status === EXAM_RECORD_STATUS.SUBMITTED) {
          const existingTask = await tx.diagnosticReportTask.findUnique({
            where: { examRecordId: record.id },
            select: { status: true },
          })
          return { examRecord: latest, task: existingTask, claimed: false }
        }
      }

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
          activeDiagnosticKey: null,
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

      if (moduleSnapshot) {
        for (const question of officialQuestions) {
          const selectedAnswer = maps.answers[question.id] || null
          await tx.answerRecord.updateMany({
            where: { examRecordId: record.id, questionId: question.id },
            data: {
              selectedAnswer,
              answerState: selectedAnswer
                ? ANSWER_RECORD_STATE.ANSWERED
                : maps.states[question.id] || ANSWER_RECORD_STATE.UNSEEN,
              durationSeconds: maps.durations[question.id] || 0,
              isCorrect: Boolean(selectedAnswer && question.answer.includes(selectedAnswer)),
              answeredAt: selectedAnswer ? submittedAt : null,
            },
          })
        }
      } else {
        await replaceAnswerRecords(
          tx,
          record.id,
          officialQuestions,
          maps.answers,
          maps.durations,
          maps.states,
          true,
        )
      }
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
    setOperationAuditContext(req, {
      summary: `提交 ${result.examRecord.examType} 考试`,
    })
    res.json(success({
      examRecordId: result.examRecord.id,
      totalQuestions: result.examRecord.totalQuestions,
      correctCount: result.examRecord.correctCount,
      wrongCount: result.examRecord.totalQuestions - result.examRecord.correctCount,
      durationSeconds: result.examRecord.durationSeconds,
      reportStatus: result.task?.status || null,
    }))
  } catch (error: any) {
    logRuntimeError('exam.submit_failed', error)
    res.status(500).json(fail(error.message || '交卷失败'))
  }
})

// Profile stats
