import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'

export const examRouter = Router()

// 安全 JSON 解析：解析失败时返回默认值而非抛异常
function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

// 解析 query 参数中逗号分隔的列表值，如 ?difficulty=easy,medium → ['easy','medium']
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

// 收集考纲节点及其所有子孙 code，用于按考纲节点筛选时覆盖子节点
async function collectSyllabusCodes(codes: string[]): Promise<string[]> {
  if (!codes.length) return []
  const nodes = await prisma.syllabusNode.findMany({
    where: { examType: 'ESAT' },
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

// 检查题目的 knowledgePoints 或 syllabusPoints JSON 中是否包含指定 code
function jsonPointsHaveCode(value: string, codes: string[]): boolean {
  const points = safeJsonParse<Array<{ code?: string }>>(value, [])
  return points.some((point) => point.code && codes.includes(point.code))
}

// 错题本 — 按难度、试卷类型和大纲节点筛选当前用户错题摘要。
examRouter.get('/error-book', requireAuth, async (req, res) => {
  try {
    const difficulties = parseQueryList(req.query.difficulty)
    const paperTypes = parseQueryList(req.query.paperType)
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
      knowledgePoints: string
      syllabusPoints: string
    }> = []

    if (hasQuestionFilter) {
      const candidates = await prisma.question.findMany({
        where: difficulties.length ? { difficulty: { in: difficulties } } : {},
        select: {
          id: true,
          title: true,
          difficulty: true,
          knowledgePoints: true,
          syllabusPoints: true,
        },
      })
      questionSummaries = syllabusCodes.length
        ? candidates.filter(
            (question) =>
              jsonPointsHaveCode(question.syllabusPoints, syllabusCodes) ||
              jsonPointsHaveCode(question.knowledgePoints, syllabusCodes),
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
            syllabusPoints: true,
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
        syllabus_points: question ? safeJsonParse(question.syllabusPoints, []) : [],
        selectedAnswer: group.selectedAnswers.join('、') || answer.selectedAnswer,
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
    res.status(500).json(fail(e.message || '获取错题本失败'))
  }
})

// 交卷 — 保存答题记录和逐题答案
examRouter.post('/submit', requireAuth, async (req, res) => {
  try {
    const { questions, answers, questionDurations, startedAt, paperId } = req.body

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json(fail('题目列表不能为空'))
      return
    }

    const answerMap: Record<string, string> = answers || {}
    const durationMap: Record<string, number> = questionDurations || {}
    let correctCount = 0

    for (const q of questions) {
      const key = q.id || q.number?.toString()
      const selected = answerMap[key]
      const correct = Array.isArray(q.answer) ? q.answer : []
      if (selected && correct.includes(selected)) correctCount++
    }

    const targetPaperId = paperId || 'question-bank'
    if (paperId) {
      const paper = await prisma.paper.findUnique({ where: { id: paperId } })
      if (!paper) {
        res.status(404).json(fail('试卷不存在'))
        return
      }
    }

    if (!paperId) {
      await prisma.paper.upsert({
        where: { id: 'question-bank' },
        update: {},
        create: {
          id: 'question-bank',
          title: '试题库练习',
          year: new Date().getFullYear(),
          duration: 60,
          paperType: 'practice',
          status: 'published',
        },
      })
    }

    const examRecord = await prisma.examRecord.create({
      data: {
        userId: req.user!.userId,
        paperId: targetPaperId,
        totalQuestions: questions.length,
        correctCount,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        submittedAt: new Date(),
        status: 'submitted',
      },
    })

    // 逐题保存答题明细：questionId 现在是 Question 表的 UUID 外键
    const answerRecords = questions.map((q) => {
      const key = q.id || q.number?.toString()
      const selected = answerMap[key]
      const correct = Array.isArray(q.answer) ? q.answer : []
      const isCorrect = !!(selected && correct.includes(selected))
      return {
        examRecordId: examRecord.id,
        questionId: key,
        selectedAnswer: selected || null,
        isCorrect,
        durationSeconds: Math.max(0, Math.round(Number(durationMap[key]) || 0)),
        answeredAt: new Date(),
      }
    })

    await prisma.answerRecord.createMany({ data: answerRecords })

    res.json(success({
      examRecordId: examRecord.id,
      totalQuestions: questions.length,
      correctCount,
      wrongCount: questions.length - correctCount,
    }))
  } catch (e: any) {
    console.error('Exam submit error:', e)
    res.status(500).json(fail(e.message || '交卷失败'))
  }
})

// 答题结果详情 — 通过 AnswerRecord → Question FK 直接拿到完整题目
examRouter.get('/:id/result', requireAuth, async (req, res) => {
  try {
    const examRecord = await prisma.examRecord.findUnique({
      where: { id: req.params.id },
    })

    if (!examRecord) {
      res.status(404).json(fail('考试记录不存在'))
      return
    }

    const answers = await prisma.answerRecord.findMany({
      where: { examRecordId: examRecord.id },
      orderBy: { answeredAt: 'asc' },
    })

    // 历史答题记录可能没有对应 Question 行，拆开查询避免 Prisma 必填关系直接抛错。
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

    res.json(success({
      examRecord: {
        id: examRecord.id,
        totalQuestions: examRecord.totalQuestions,
        correctCount: examRecord.correctCount,
        startedAt: examRecord.startedAt,
        submittedAt: examRecord.submittedAt,
        status: examRecord.status,
        paper: examRecord.paperId === 'question-bank'
          ? {
              id: 'question-bank',
              title: '题库练习',
              paperType: 'practice',
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
    }))
  } catch (e: any) {
    console.error('Exam result error:', e)
    res.status(500).json(fail(e.message || '获取结果失败'))
  }
})

// 练习记录 — 获取当前用户的试题库练习记录
examRouter.get('/practice-records', requireAuth, async (req, res) => {
  try {
    const records = await prisma.examRecord.findMany({
      where: {
        userId: req.user!.userId,
        status: 'submitted',
        paper: { paperType: 'practice' },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    })

    res.json(success({
      records: records.map((record) => ({
        id: record.id,
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
