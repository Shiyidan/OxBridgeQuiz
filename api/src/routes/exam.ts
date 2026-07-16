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

export const examRouter = Router()

function safeJsonParse<T>(value: unknown, fallback: T): T {
  return parseJsonField<T>(value, fallback)
}

// Parse comma-separated query values.
function parseQueryList(value: unknown): string[] {
  if (!value) return []
  const values = Array.isArray(value) ? value : [value]
  return values
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseDateBoundary(value: unknown, boundary: 'start' | 'end'): Date | undefined {
  if (!value) return undefined
  const text = String(Array.isArray(value) ? value[0] : value).trim()
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  const date = matched
    ? new Date(
        Number(matched[1]),
        Number(matched[2]) - 1,
        Number(matched[3]) + (boundary === 'end' ? 1 : 0),
      )
    : new Date(text)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function parsePositiveInt(value: unknown, fallback: number, max?: number): number {
  const parsed = Number.parseInt(String(Array.isArray(value) ? value[0] : value), 10)
  if (Number.isNaN(parsed) || parsed < 1) return fallback
  return max ? Math.min(parsed, max) : parsed
}

function getQuestionKey(question: any): string {
  return String(question?.id || question?.number || '')
}

function buildAnswerRecordRows(
  examRecordId: string,
  questions: any[],
  answers: Record<string, string>,
  questionDurations: Record<string, number>,
  answerStates: Record<string, AnswerRecordState> = {},
  includeUnanswered = true,
) {
  return questions
    .map((question) => {
      const key = getQuestionKey(question)
      if (!key) return null
      const selected = answers[key]
      const durationSeconds = Math.max(0, Math.round(Number(questionDurations[key]) || 0))
      if (!includeUnanswered && !selected && durationSeconds <= 0) return null
      const correct = Array.isArray(question.answer) ? question.answer : []
      const isCorrect = !!(selected && correct.includes(selected))
      const answerState = selected
        ? ANSWER_RECORD_STATE.ANSWERED
        : answerStates[key] === ANSWER_RECORD_STATE.SKIPPED || durationSeconds > 0
          ? ANSWER_RECORD_STATE.SKIPPED
          : ANSWER_RECORD_STATE.UNSEEN
      return {
        examRecordId,
        questionId: key,
        selectedAnswer: selected || null,
        answerState,
        isCorrect,
        durationSeconds,
        answeredAt: selected ? new Date() : null,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

function countCorrectAnswers(questions: any[], answers: Record<string, string>): number {
  let correctCount = 0
  for (const question of questions) {
    const selected = answers[getQuestionKey(question)]
    const correct = Array.isArray(question.answer) ? question.answer : []
    if (selected && correct.includes(selected)) correctCount++
  }
  return correctCount
}

type ExamResponseInput = {
  questionId: string
  selectedAnswer: string | null
  durationSeconds: number
  answerState: AnswerRecordState
}

class ExamProgressConflictError extends Error {}

// 保存和交卷统一使用逐题响应数组，避免答案与耗时两个 Map 的题目键不一致。
function normalizeExamResponses(value: unknown): ExamResponseInput[] {
  if (!Array.isArray(value)) return []
  const responseMap = new Map<string, ExamResponseInput>()
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const raw = item as Record<string, unknown>
    const questionId = typeof raw.questionId === 'string' ? raw.questionId.trim() : ''
    if (!questionId) continue
    const selectedAnswer = typeof raw.selectedAnswer === 'string' && raw.selectedAnswer.trim()
      ? raw.selectedAnswer.trim().slice(0, 64)
      : null
    const durationSeconds = Math.max(0, Math.min(24 * 60 * 60, Math.round(Number(raw.durationSeconds) || 0)))
    const requestedState = isAnswerRecordState(raw.answerState)
      ? raw.answerState
      : ANSWER_RECORD_STATE.UNSEEN
    const answerState = selectedAnswer
      ? ANSWER_RECORD_STATE.ANSWERED
      : requestedState === ANSWER_RECORD_STATE.SKIPPED || durationSeconds > 0
        ? ANSWER_RECORD_STATE.SKIPPED
        : ANSWER_RECORD_STATE.UNSEEN
    responseMap.set(questionId, { questionId, selectedAnswer, durationSeconds, answerState })
  }
  return [...responseMap.values()]
}

function responseMaps(responses: ExamResponseInput[]): {
  answers: Record<string, string>
  durations: Record<string, number>
  states: Record<string, AnswerRecordState>
} {
  const answers: Record<string, string> = {}
  const durations: Record<string, number> = {}
  const states: Record<string, AnswerRecordState> = {}
  for (const response of responses) {
    if (response.selectedAnswer) answers[response.questionId] = response.selectedAnswer
    durations[response.questionId] = response.durationSeconds
    states[response.questionId] = response.answerState
  }
  return { answers, durations, states }
}

function usesContinuousExamClock(paperType: unknown): boolean {
  const normalized = normalizePaperType(paperType)
  return normalized === PAPER_TYPE.REAL_PAPER || normalized === PAPER_TYPE.MOCK_PAPER
}

function buildExamDeadline(startedAt: Date, durationMinutes: number): Date {
  return new Date(startedAt.getTime() + Math.max(1, durationMinutes) * 60 * 1000)
}

function continuousExamDurationSeconds(startedAt: Date, expiresAt: Date, endedAt: Date): number {
  const effectiveEnd = Math.min(endedAt.getTime(), expiresAt.getTime())
  return Math.max(0, Math.round((effectiveEnd - startedAt.getTime()) / 1000))
}

async function replaceAnswerRecords(
  client: Prisma.TransactionClient | typeof prisma,
  examRecordId: string,
  questions: any[],
  answers: Record<string, string>,
  questionDurations: Record<string, number>,
  answerStates: Record<string, AnswerRecordState> = {},
  includeUnanswered = true,
) {
  await client.answerRecord.deleteMany({ where: { examRecordId } })
  const rows = buildAnswerRecordRows(
    examRecordId,
    questions,
    answers,
    questionDurations,
    answerStates,
    includeUnanswered,
  )
  if (rows.length) await client.answerRecord.createMany({ data: rows })
}

async function collectSyllabusCodes(codes: string[]): Promise<string[]> {
  if (!codes.length) return []
  const nodes = await prisma.syllabusNode.findMany({
    where: { examType: { in: EXAM_TYPES } },
    select: { code: true, parentCode: true },
  })
  const childrenMap = new Map<string, string[]>()
  for (const node of nodes) {
    if (!node.parentCode) continue
    const children = childrenMap.get(node.parentCode) || []
    children.push(node.code)
    childrenMap.set(node.parentCode, children)
  }
  const result = new Set<string>()
  const visit = (code: string) => {
    result.add(code)
    for (const child of childrenMap.get(code) || []) visit(child)
  }
  codes.forEach(visit)
  return [...result]
}

// Check whether question point JSON contains any target code.
function jsonPointsHaveCode(value: unknown, codes: string[]): boolean {
  const points = parseJsonArray<{ code?: string }>(value)
  return points.some((point) => point.code && codes.includes(point.code))
}

function calculateNinePointScore(examType: string, totalQuestions: number, correctCount: number): number | null {
  if (totalQuestions <= 0) return null
  const dummyQuestions: QuestionResult[] = Array.from({ length: totalQuestions }, (_, i) => ({
    subject: null,
    isCorrect: i < correctCount,
  }))
  const result = computeScores(examType, dummyQuestions)
  return result.overallScore
}

examRouter.get('/error-book', requireAuth, async (req, res) => {
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
    console.error('Error book error:', e)
    res.status(500).json(fail(e.message || 'Get error book failed'))
  }
})

// 开始或恢复考试；诊断真题复用进行中记录，明确重测时创建新记录。
examRouter.post('/start', requireAuth, async (req, res) => {
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
examRouter.put('/:id/progress', requireAuth, async (req, res) => {
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
examRouter.post('/:id/submit', requireAuth, async (req, res) => {
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
examRouter.get('/profile-stats', requireAuth, async (req, res) => {
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
examRouter.get('/:id/result', requireAuth, async (req, res) => {
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
examRouter.get('/:id/diagnostic-report/status', requireAuth, async (req, res) => {
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
examRouter.post('/:id/diagnostic-report/retry', requireAuth, async (req, res) => {
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
examRouter.get('/:id/diagnostic-report/summary', requireAuth, async (req, res) => {
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

// Practice records
examRouter.get('/practice-records', requireAuth, async (req, res) => {
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
    console.error('Practice records error:', e)
    res.status(500).json(fail(e.message || '获取练习记录失败'))
  }
})
