import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonField, parseJsonArray } from '../utils/jsonField.js'
import { checkMemberAccess } from '../services/member.js'
import { computeScores } from '../services/scoring.js'
import type { QuestionResult } from '../services/scoring.js'
import {
  buildDiagnosticReportSummary,
  type LearnerProfileInput,
} from '../services/diagnosticReport.js'
import {
  EXAM_TYPE,
  EXAM_TYPES,
  EXAM_RECORD_STATUS,
  PAPER_TYPE,
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  isExamType,
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

// 学习路径只读取当前考试类型的结构化备考资料，并对旧版偏好数据安全降级。
function learnerProfileForExam(raw: unknown, examType: string): LearnerProfileInput {
  const preferences = parseJsonArray<Record<string, unknown>>(raw)
  const preference = preferences.find((item) => String(item.examType || '').toUpperCase() === examType.toUpperCase())
  const weeklyHoursValue = Number(preference?.weeklyHours)
  const targetScoreValue = Number(preference?.targetScore)
  const examDateValue = typeof preference?.examDate === 'string' ? preference.examDate.trim() : ''
  const targetUniversities = Array.isArray(preference?.targetUniversities)
    ? preference.targetUniversities.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : typeof preference?.targetUniversity === 'string' && preference.targetUniversity.trim()
      ? [preference.targetUniversity.trim()]
      : []
  return {
    subjects: Array.isArray(preference?.subjects)
      ? preference.subjects.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
      : [],
    targetUniversities,
    targetMajor: typeof preference?.targetMajor === 'string' && preference.targetMajor.trim()
      ? preference.targetMajor.trim()
      : null,
    targetScore: Number.isFinite(targetScoreValue) && targetScoreValue >= 1 && targetScoreValue <= 9
      ? targetScoreValue
      : null,
    examDate: /^\d{4}-\d{2}-\d{2}$/.test(examDateValue) ? examDateValue : null,
    weeklyHours: Number.isFinite(weeklyHoursValue) && weeklyHoursValue >= 1 && weeklyHoursValue <= 80
      ? weeklyHoursValue
      : null,
  }
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
      return {
        examRecordId,
        questionId: key,
        selectedAnswer: selected || null,
        isCorrect,
        durationSeconds,
        answeredAt: new Date(),
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

async function replaceAnswerRecords(
  examRecordId: string,
  questions: any[],
  answers: Record<string, string>,
  questionDurations: Record<string, number>,
  includeUnanswered = true,
) {
  await prisma.answerRecord.deleteMany({ where: { examRecordId } })
  const rows = buildAnswerRecordRows(examRecordId, questions, answers, questionDurations, includeUnanswered)
  if (rows.length) await prisma.answerRecord.createMany({ data: rows })
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

// Exam progress
examRouter.get('/progress/:paperId', requireAuth, async (req, res) => {
  try {
    const record = await prisma.examRecord.findFirst({
      where: {
        userId: req.user!.userId,
        paperId: req.params.paperId,
        status: 'in_progress',
        paper: { paperType: { in: [...REAL_PAPER_TYPES] } },
      },
      include: {
        answers: {
          select: {
            questionId: true,
            selectedAnswer: true,
            durationSeconds: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    })

    if (!record) {
      res.json(success(null))
      return
    }

    const answers: Record<string, string> = {}
    const questionDurations: Record<string, number> = {}
    for (const answer of record.answers) {
      if (answer.selectedAnswer) answers[answer.questionId] = answer.selectedAnswer
      questionDurations[answer.questionId] = answer.durationSeconds
    }

    res.json(success({
      id: record.id,
      paperId: record.paperId,
      examType: record.examType,
      totalQuestions: record.totalQuestions,
      startedAt: record.startedAt,
      status: record.status,
      answers,
      questionDurations,
      durationSeconds: Object.values(questionDurations).reduce((sum, value) => sum + value, 0),
    }))
  } catch (e: any) {
    console.error('Exam progress get error:', e)
    res.status(500).json(fail(e.message || '获取答题进度失败'))
  }
})

// Save exam progress
examRouter.post('/progress', requireAuth, async (req, res) => {
  try {
    const { questions, answers, questionDurations, startedAt, paperId, examType } = req.body

    if (!paperId) {
      res.status(400).json(fail('paperId 不能为空'))
      return
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json(fail('题目列表不能为空'))
      return
    }

    const paper = await prisma.paper.findUnique({ where: { id: paperId } })
    if (!paper) {
      res.status(404).json(fail('Paper not found'))
      return
    }
    if (!isRealPaperType(normalizePaperType(paper.paperType))) {
      res.status(422).json(fail('仅诊断测试支持保存进度'))
      return
    }

    const targetExamType = paper.examType || examType || 'TMUA'
    if (!isExamType(targetExamType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }

    let record = await prisma.examRecord.findFirst({
      where: {
        userId: req.user!.userId,
        paperId,
        status: 'in_progress',
      },
      orderBy: { startedAt: 'desc' },
    })

    if (!record) {
      const entitlement = await checkMemberAccess(req.user!.userId, 'diagnostic', targetExamType, 1)
      if (!entitlement.allowed) {
        res.status(403).json(fail('当前额度不足，请开通会员后继续'))
        return
      }
      record = await prisma.examRecord.create({
        data: {
          userId: req.user!.userId,
          paperId,
          examType: targetExamType,
          totalQuestions: questions.length,
          correctCount: countCorrectAnswers(questions, answers || {}),
          startedAt: startedAt ? new Date(startedAt) : new Date(),
          submittedAt: null,
          status: 'in_progress',
        },
      })
    } else {
      record = await prisma.examRecord.update({
        where: { id: record.id },
        data: {
          examType: targetExamType,
          totalQuestions: questions.length,
          correctCount: countCorrectAnswers(questions, answers || {}),
          startedAt: startedAt ? new Date(startedAt) : record.startedAt,
          submittedAt: null,
          status: 'in_progress',
        },
      })
    }

    await replaceAnswerRecords(record.id, questions, answers || {}, questionDurations || {}, true)

    res.json(success({
      examRecordId: record.id,
      status: record.status,
    }))
  } catch (e: any) {
    console.error('Exam progress save error:', e)
    res.status(500).json(fail(e.message || '保存答题进度失败'))
  }
})

// Submit exam
examRouter.post('/submit', requireAuth, async (req, res) => {
  try {
    const { questions, answers, questionDurations, startedAt, paperId, examType, debugRetake } = req.body

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json(fail('题目列表不能为空'))
      return
    }

    const answerMap: Record<string, string> = answers || {}
    const durationMap: Record<string, number> = questionDurations || {}
    const correctCount = countCorrectAnswers(questions, answerMap)

    const targetPaperId = paperId || 'question-bank'
    let targetExamType = examType || 'TMUA'
    if (!isExamType(targetExamType)) {
      res.status(422).json(fail('无效的考试类型'))
      return
    }
    let targetPaperType: string = PAPER_TYPE.AI_PAPER
    if (paperId) {
      const paper = await prisma.paper.findUnique({ where: { id: paperId } })
      if (!paper) {
        res.status(404).json(fail('Paper not found'))
        return
      }
      targetExamType = paper.examType || targetExamType
      targetPaperType = normalizePaperType(paper.paperType)
      if (!isExamType(targetExamType)) {
        res.status(422).json(fail('无效的考试类型'))
        return
      }
    }

    const isDiagnostic = isRealPaperType(targetPaperType)
    const skipEntitlementForDebugRetake = isDiagnostic && (debugRetake === true || debugRetake === '1')
    if (!skipEntitlementForDebugRetake) {
      const entitlement = await checkMemberAccess(
        req.user!.userId,
        isDiagnostic ? 'diagnostic' : 'question-bank',
        targetExamType,
        isDiagnostic ? 1 : questions.length,
      )
      if (!entitlement.allowed) {
        res.status(403).json(fail('当前额度不足，请开通会员后继续'))
        return
      }
    }

    if (!paperId) {
      await prisma.paper.upsert({
        where: { id: 'question-bank' },
        update: { paperType: PAPER_TYPE.AI_PAPER, status: 'published' },
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
    }

    const inProgressRecord = paperId
      ? await prisma.examRecord.findFirst({
          where: {
            userId: req.user!.userId,
            paperId: targetPaperId,
            status: 'in_progress',
          },
          orderBy: { startedAt: 'desc' },
        })
      : null

    const examRecord = inProgressRecord
      ? await prisma.examRecord.update({
          where: { id: inProgressRecord.id },
          data: {
            examType: targetExamType,
            totalQuestions: questions.length,
            correctCount,
            startedAt: startedAt ? new Date(startedAt) : inProgressRecord.startedAt,
            submittedAt: new Date(),
            status: 'submitted',
          },
        })
      : await prisma.examRecord.create({
          data: {
            userId: req.user!.userId,
            paperId: targetPaperId,
            examType: targetExamType,
            totalQuestions: questions.length,
            correctCount,
            startedAt: startedAt ? new Date(startedAt) : new Date(),
            submittedAt: new Date(),
            status: 'submitted',
          },
        })

    // Persist per-question answers with Question ids.
    await replaceAnswerRecords(examRecord.id, questions, answerMap, durationMap, true)

    res.json(success({
      examRecordId: examRecord.id,
      totalQuestions: questions.length,
      correctCount,
      wrongCount: questions.length - correctCount,
    }))
  } catch (e: any) {
    console.error('Exam submit error:', e)
    res.status(500).json(fail(e.message || '浜ゅ嵎澶辫触'))
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

    const answers = await prisma.answerRecord.findMany({
      where: { examRecordId: examRecord.id },
      orderBy: { answeredAt: 'asc' },
    })

    const questionRows = await prisma.question.findMany({
      where: { id: { in: answers.map((answer) => answer.questionId) } },
    })
    const questionMap = new Map(questionRows.map((question) => [question.id, question]))

    const needPaperMeta = examRecord.paperId !== 'question-bank'
    const paper = needPaperMeta
      ? await prisma.paper.findUnique({
          where: { id: examRecord.paperId },
          select: { id: true, title: true, paperType: true, year: true, duration: true, code: true },
        })
      : null

    const answeredQuestions = answers.map((a) => {
      const question = questionMap.get(a.questionId)
      if (question) {
        return {
          ...formatQuestionRow(question),
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer,
          isCorrect: a.isCorrect,
          durationSeconds: a.durationSeconds,
        }
      }
      return {
        questionId: a.questionId,
        selectedAnswer: a.selectedAnswer,
        isCorrect: a.isCorrect,
        durationSeconds: a.durationSeconds,
        number: undefined,
        title: '',
        options: [],
        answer: [],
        images: [],
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

// 诊断报告头、等效评估分与总体成绩概览
examRouter.get('/:id/diagnostic-report/summary', requireAuth, async (req, res) => {
  try {
    const examRecord = await prisma.examRecord.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        paper: true,
        answers: true,
        user: { select: { examPreferences: true } },
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

    const questionRows = await prisma.question.findMany({
      where: { paperId: examRecord.paperId },
      orderBy: { number: 'asc' },
      select: {
        id: true,
        number: true,
        subject: true,
        subjectCode: true,
        topic: true,
        topicCode: true,
        knowledgePoints: true,
        difficulty: true,
      },
    })
    const syllabusNodes = await prisma.syllabusNode.findMany({
      where: { examType: examRecord.examType },
      orderBy: { order: 'asc' },
      select: { code: true, label: true },
    })
    const answerMap = new Map(examRecord.answers.map((answer) => [answer.questionId, answer]))

    const report = await buildDiagnosticReportSummary({
      examType: examRecord.examType,
      paper: {
        title: examRecord.paper.title,
        code: examRecord.paper.code,
        year: examRecord.paper.year,
        duration: examRecord.paper.duration,
      },
      questions: questionRows.map((question) => ({
        number: question.number,
        subject: question.subject,
        subjectCode: question.subjectCode,
        topic: question.topic,
        topicCode: question.topicCode,
        knowledgePoints: parseJsonArray<{ code: string; label: string; role?: string }>(
          question.knowledgePoints,
        ),
        difficulty: question.difficulty,
        isCorrect: answerMap.get(question.id)?.isCorrect ?? false,
        isAnswered: Boolean(answerMap.get(question.id)?.selectedAnswer?.trim()),
        durationSeconds: answerMap.get(question.id)?.durationSeconds ?? null,
      })),
      elapsedDurationSeconds: Math.max(
        0,
        Math.round((examRecord.submittedAt.getTime() - examRecord.startedAt.getTime()) / 1000),
      ),
      syllabusNodes,
      learnerProfile: learnerProfileForExam(examRecord.user.examPreferences, examRecord.examType),
    })

    res.json(success({ report }))
  } catch (error: any) {
    console.error('[diagnostic-report] summary error:', error)
    res.status(500).json(fail(error.message || 'Get diagnostic report summary failed'))
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
        durationSeconds: record.submittedAt
          ? Math.max(0, Math.round((record.submittedAt.getTime() - record.startedAt.getTime()) / 1000))
          : null,
      })),
    }))
  } catch (e: any) {
    console.error('Practice records error:', e)
    res.status(500).json(fail(e.message || '获取练习记录失败'))
  }
})
