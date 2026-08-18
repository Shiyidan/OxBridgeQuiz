// 处理考试开始或恢复、增量保存及原子交卷流程。
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonField, parseJsonArray, parseJsonObject } from '../utils/jsonField.js'
import { checkMemberAccess, hasDiagnosticPaperAccess } from '../services/member.js'
import { verifyQuestionBankSelection } from '../services/questionBankSelection.js'
import { withQuotaTransaction } from '../services/transactionRetry.js'
import { syncSubmittedWrongQuestions } from '../services/wrongQuestionSummary.js'
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
  QUESTION_STATUS,
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  isExamType,
  isAnswerRecordState,
  isRealPaperType,
  supportsDiagnosticReport,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'
import {
  promptVersionForExam,
  reportVersionForExam,
} from '../constants/diagnosticReport.js'

import {
  buildModuleExamSnapshot,
  getModuleExamSession,
  moduleSnapshotJson,
  parseModuleExamSnapshot,
  reconcileExpiredModuleTimeline,
  reconcileModuleBreak,
} from '../services/moduleExamSession.js'
import { attemptQuestionSelect, formatQuestionForAttempt } from './papers-shared.js'

import { safeJsonParse, parseQueryList, parseDateBoundary, parsePositiveInt, getQuestionKey, buildAnswerRecordRows, countCorrectAnswers, ExamResponseInput, ExamProgressConflictError, normalizeExamResponses, responseMaps, usesContinuousExamClock, buildExamDeadline, continuousExamDurationSeconds, replaceAnswerRecords, collectSyllabusCodes, jsonPointsHaveCode, calculateNinePointScore } from './exam-shared.js'
export const examSessionRouter = createAsyncRouter()

class ExamStartBusinessError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message)
  }
}

// 答题页标题与练习记录使用同一份范围快照；练习本记录则回退到用户保存的练习本名称。
function resolvePracticeTitle(snapshotValue: unknown): string {
  const snapshot = parseJsonObject(snapshotValue)
  const knowledgePoint = parseJsonObject(snapshot.knowledgePoint)
  const knowledgePointLabel = typeof knowledgePoint.label === 'string'
    ? knowledgePoint.label.trim()
    : ''
  if (knowledgePointLabel) return knowledgePointLabel
  return typeof snapshot.notebookName === 'string' ? snapshot.notebookName.trim() : ''
}

// 所有题库入口共享唯一进行中练习，切换考试类型后仍能返回并继续原记录。
examSessionRouter.get('/active-practice', requireAuth, async (req, res) => {
  const record = await prisma.examRecord.findFirst({
    where: {
      userId: req.user!.userId,
      status: EXAM_RECORD_STATUS.IN_PROGRESS,
      activeQuestionBankKey: { not: null },
      paperId: 'question-bank',
    },
    select: {
      id: true,
      examType: true,
      totalQuestions: true,
      startedAt: true,
      _count: { select: { answers: { where: { selectedAnswer: { not: null } } } } },
    },
  })
  res.json(success(record
    ? {
        examRecordId: record.id,
        examType: record.examType,
        totalQuestions: record.totalQuestions,
        answeredCount: record._count.answers,
        startedAt: record.startedAt,
      }
    : null))
})

examSessionRouter.post('/start', requireAuth, async (req, res) => {
  let startingQuestionBank = false
  try {

    const { paperId, examType, questionIds, selectionToken } = req.body as {
      paperId?: string
      examType?: string
      questionIds?: unknown
      selectionToken?: unknown
    }
    let targetPaperId = paperId || 'question-bank'
    let targetExamType = examType || EXAM_TYPE.TMUA
    let targetPaperType: string = PAPER_TYPE.AI_PAPER
    let targetDeliveryMode: string = PAPER_DELIVERY_MODE.CONTINUOUS
    let targetDurationMinutes = 60
    let targetPaper: any = null

    if (paperId) {
      const paper = await prisma.paper.findUnique({
        where: { id: paperId },
        select: {
          id: true,
          examType: true,
          duration: true,
          paperType: true,
          accessTier: true,
          deliveryMode: true,
          breakDurationSeconds: true,
          moduleConfig: true,
          status: true,
        },
      })
      if (!paper) {
        res.status(404).json(fail('Paper not found'))
        return
      }
      targetExamType = paper.examType
      targetPaperType = normalizePaperType(paper.paperType)
      targetDeliveryMode = paper.deliveryMode
      targetDurationMinutes = paper.duration
      targetPaper = paper
    }
    if (!isExamType(targetExamType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }

    if (!paperId) {
      startingQuestionBank = true
      if (typeof selectionToken !== 'string') {
        throw new ExamStartBusinessError(
          '选题凭证缺失，请返回试题库重新选择',
          422,
          'QUESTION_SELECTION_INVALID',
        )
      }
      let verifiedSelection
      try {
        verifiedSelection = verifyQuestionBankSelection(selectionToken, req.user!.userId)
      } catch {
        throw new ExamStartBusinessError(
          '选题凭证已失效，请返回试题库重新选择',
          422,
          'QUESTION_SELECTION_INVALID',
        )
      }
      targetExamType = verifiedSelection.examType
      const requestedQuestionIds = verifiedSelection.questionIds

      // 题库练习统一关联稳定的系统占位试卷；考试类型以 ExamRecord 为准，不再反复改写 Paper。
      await prisma.paper.upsert({
        where: { id: 'question-bank' },
        update: { paperType: PAPER_TYPE.AI_PAPER, status: 'published' },
        create: {
          id: 'question-bank',
          title: 'Question bank practice',
          examType: EXAM_TYPE.TMUA,
          year: new Date().getFullYear(),
          duration: 60,
          paperType: PAPER_TYPE.AI_PAPER,
          status: 'published',
        },
      })

      const examRecord = await withQuotaTransaction(async (tx) => {
        const serverStartedAt = new Date()
        const existingActive = await tx.examRecord.findFirst({
          where: {
            userId: req.user!.userId,
            paperId: 'question-bank',
            status: EXAM_RECORD_STATUS.IN_PROGRESS,
            activeQuestionBankKey: { not: null },
          },
          select: { id: true },
        })
        if (existingActive) {
          throw new ExamStartBusinessError(
            '已有未完成练习，请先继续并交卷',
            409,
            'QUESTION_BANK_IN_PROGRESS',
          )
        }
        // 先占用唯一活动键，再读取已交卷用量；并发 start/submit 会由唯一索引按顺序裁决。
        const record = await tx.examRecord.create({
          data: {
            userId: req.user!.userId,
            paperId: 'question-bank',
            examType: targetExamType,
            totalQuestions: requestedQuestionIds.length,
            correctCount: 0,
            startedAt: serverStartedAt,
            phase: EXAM_PHASE.CONTINUOUS,
            activeDurationSeconds: 0,
            durationSeconds: 0,
            status: EXAM_RECORD_STATUS.IN_PROGRESS,
            activeQuestionBankKey: req.user!.userId,
            practiceSource: verifiedSelection.practiceSnapshot.source,
            practiceSnapshot: verifiedSelection.practiceSnapshot as unknown as Prisma.InputJsonValue,
          },
        })

        const questionRows = await tx.question.findMany({
          where: {
            id: { in: requestedQuestionIds },
            examType: targetExamType,
            paperId: null,
            status: QUESTION_STATUS.PUBLISHED,
            questionType: 'single_choice',
          },
          select: { id: true, answer: true },
        })
        if (questionRows.length !== requestedQuestionIds.length) {
          throw new ExamStartBusinessError(
            '题目不存在、已下架或不属于当前考试类型',
            422,
            'QUESTION_SCOPE_INVALID',
          )
        }
        const questionMap = new Map(questionRows.map((question) => [question.id, question]))
        const officialQuestions = requestedQuestionIds.map((questionId) => {
          const question = questionMap.get(questionId)!
          return { id: question.id, answer: parseJsonArray<string>(question.answer) }
        })
        const entitlement = await checkMemberAccess(
          req.user!.userId,
          'question-bank',
          targetExamType,
          officialQuestions.length,
          tx,
        )
        if (!entitlement.allowed) {
          throw new ExamStartBusinessError(
            '当前题库额度不足，请开通会员后继续',
            403,
            'QUESTION_BANK_ACCESS_DENIED',
          )
        }
        await replaceAnswerRecords(tx, record.id, officialQuestions, {}, {}, {}, true)
        return record
      })

      setOperationAuditContext(req, {
        resourceId: examRecord.id,
        summary: `开始 ${examRecord.examType} 题库练习`,
      })
      res.json(success({
        examRecordId: examRecord.id,
        paperId: examRecord.paperId,
        examType: examRecord.examType,
        practiceTitle: resolvePracticeTitle(verifiedSelection.practiceSnapshot),
        totalQuestions: examRecord.totalQuestions,
        startedAt: examRecord.startedAt,
        expiresAt: null,
        status: examRecord.status,
        isResumed: false,
        isExpired: false,
        answers: {},
        questionDurations: {},
        answerStates: {},
        durationSeconds: 0,
      }))
      return
    }

    const isDiagnostic = isRealPaperType(targetPaperType)
    if (!isDiagnostic) {
      res.status(422).json(fail('当前试卷类型不能从诊断测试入口开始', 'PAPER_TYPE_UNSUPPORTED'))
      return
    }
    const isModuleSequence = targetDeliveryMode === PAPER_DELIVERY_MODE.MODULE_SEQUENCE
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

    if (targetPaper.status !== 'published') {
      res.status(404).json(fail('试卷不存在或尚未发布'))
      return
    }
    if (
      (targetExamType === EXAM_TYPE.ESAT || targetExamType === EXAM_TYPE.TMUA)
      && !isModuleSequence
    ) {
      res.status(422).json(fail(
        `${targetExamType} 诊断卷必须配置完整分段结构后才能开始`,
        'PAPER_STRUCTURE_INVALID',
      ))
      return
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
    if (error instanceof ExamStartBusinessError) {
      res.status(error.status).json(fail(error.message, error.code))
      return
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      if (startingQuestionBank) {
        res.status(409).json(fail(
          '当前考试类型已有一份未完成练习，请先继续并交卷',
          'QUESTION_BANK_IN_PROGRESS',
        ))
        return
      }
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

// 刷新或重新进入答题页时，按 ExamRecord 冻结的题目范围恢复题目、答案和用时。
examSessionRouter.get('/:id/session', requireAuth, async (req, res) => {
  try {
    const sessionScope = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      select: { id: true, structureSnapshot: true },
    })
    if (!sessionScope) {
      res.status(404).json(fail('考试会话不存在'))
      return
    }
    if (parseModuleExamSnapshot(sessionScope.structureSnapshot)) {
      const session = await getModuleExamSession(
        sessionScope.id,
        req.user!.userId,
        { resumePaused: true },
      )
      if (!session) {
        res.status(404).json(fail('模块化考试会话不存在'))
        return
      }
      res.json(success(session))
      return
    }
    const record = await prisma.examRecord.findFirst({
      where: { id: sessionScope.id, userId: req.user!.userId },
      select: {
        id: true,
        paperId: true,
        examType: true,
        totalQuestions: true,
        startedAt: true,
        expiresAt: true,
        status: true,
        practiceSnapshot: true,
        paper: {
          select: {
            paperType: true,
            deliveryMode: true,
            duration: true,
          },
        },
        answers: {
          select: {
            questionId: true,
            selectedAnswer: true,
            durationSeconds: true,
            answerState: true,
            position: true,
            question: { select: attemptQuestionSelect },
          },
        },
      },
    })
    if (!record) {
      res.status(404).json(fail('考试会话不存在'))
      return
    }
    if (record.status !== EXAM_RECORD_STATUS.IN_PROGRESS) {
      res.status(409).json(fail('该练习已经交卷', 'EXAM_ALREADY_SUBMITTED'))
      return
    }
    const paperType = normalizePaperType(record.paper.paperType)
    if (!supportsDiagnosticReport(paperType) && !QUESTION_BANK_PAPER_TYPES.includes(paperType as any)) {
      res.status(422).json(fail('当前考试类型不支持恢复'))
      return
    }

    const storedPositionsAreComplete = record.answers.every((answer) =>
      Number.isInteger(answer.position),
    ) && new Set(record.answers.map((answer) => answer.position)).size === record.answers.length
    const orderedAnswers = storedPositionsAreComplete
      ? [...record.answers].sort((left, right) => Number(left.position) - Number(right.position))
      : [...record.answers].sort((left, right) => (
          String(left.question.paperId || '').localeCompare(String(right.question.paperId || ''))
          || Number(left.question.number || 0) - Number(right.question.number || 0)
        ))
    const answers: Record<string, string> = {}
    const questionDurations: Record<string, number> = {}
    const answerStates: Record<string, AnswerRecordState> = {}
    for (const answer of orderedAnswers) {
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
    const usesPracticeDeadline = record.paperId === 'question-bank' && Boolean(record.expiresAt)
    const expiresAt = usesContinuousExamClock(record.paper.paperType, record.paper.deliveryMode)
      ? record.expiresAt || buildExamDeadline(record.startedAt, record.paper.duration)
      : usesPracticeDeadline
        ? record.expiresAt
        : null
    const now = new Date()
    const durationSeconds = expiresAt
      ? continuousExamDurationSeconds(record.startedAt, expiresAt, now)
      : Object.values(questionDurations).reduce((sum, value) => sum + value, 0)
    res.json(success({
      examRecordId: record.id,
      paperId: record.paperId,
      examType: record.examType,
      practiceTitle: resolvePracticeTitle(record.practiceSnapshot),
      totalQuestions: record.totalQuestions,
      startedAt: record.startedAt,
      expiresAt,
      status: record.status,
      isResumed: true,
      isExpired: Boolean(expiresAt && expiresAt.getTime() <= now.getTime()),
      answers,
      questionDurations,
      answerStates,
      durationSeconds,
      questions: orderedAnswers.map((answer, index) => ({
        ...formatQuestionForAttempt(answer.question),
        number: index + 1,
      })),
    }))
  } catch (error: any) {
    logRuntimeError('exam.session_restore_failed', error)
    res.status(500).json(fail(error.message || '恢复考试会话失败'))
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
            position: true,
          },
        },
        diagnosticReportTask: true,
      },
    })
    if (!record) {
      res.status(404).json(fail('Exam record not found'))
      return
    }

    const isDiagnostic = supportsDiagnosticReport(record.paper.paperType)
    const moduleSnapshot = parseModuleExamSnapshot(record.structureSnapshot)
    const usesTimedSession = usesContinuousExamClock(
      record.paper.paperType,
      record.paper.deliveryMode,
    ) || (record.paperId === 'question-bank' && Boolean(record.expiresAt))
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
    const questionMap = new Map(questionRows.map((question) => [question.id, question]))
    const fallbackQuestionOrder = new Map(
      questionRows.map((question, index) => [question.id, index]),
    )
    const orderedAnswers = [...record.answers].sort((left, right) => {
      if (Number.isInteger(left.position) && Number.isInteger(right.position)) {
        return Number(left.position) - Number(right.position)
      }
      return (fallbackQuestionOrder.get(left.questionId) ?? 0)
        - (fallbackQuestionOrder.get(right.questionId) ?? 0)
    })
    const officialQuestions = orderedAnswers.flatMap((answerRecord) => {
      const question = questionMap.get(answerRecord.questionId)
      return question
        ? [{ id: question.id, answer: parseJsonArray<string>(question.answer) }]
        : []
    })

    const submissionKey = typeof req.body?.submissionKey === 'string' && req.body.submissionKey.trim()
      ? req.body.submissionKey.trim().slice(0, 191)
      : record.submissionKey
    const correctCount = countCorrectAnswers(officialQuestions, maps.answers)
    const submittedAt = new Date()
    const expiresAt = usesTimedSession
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
          activeQuestionBankKey: null,
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
      await syncSubmittedWrongQuestions(tx, record.id)
      const task = isDiagnostic
        ? await tx.diagnosticReportTask.upsert({
            where: { examRecordId: record.id },
            update: {},
            create: {
              examRecordId: record.id,
              userId: req.user!.userId,
              paperId: record.paperId,
              reportKind: record.examType.toLowerCase(),
              reportVersion: reportVersionForExam(record.examType),
              promptVersion: promptVersionForExam(record.examType),
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
