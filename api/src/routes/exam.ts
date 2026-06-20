import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'

export const examRouter = Router()

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
      include: { question: true },
      orderBy: { answeredAt: 'asc' },
    })

    const needPaperMeta = examRecord.paperId !== 'question-bank'
    const paper = needPaperMeta
      ? await prisma.paper.findUnique({
          where: { id: examRecord.paperId },
          select: { id: true, title: true, paperType: true, year: true, duration: true, code: true },
        })
      : null

    const answeredQuestions = answers.map((a) => {
      if (a.question) {
        return {
          ...formatQuestionRow(a.question),
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

// 错题本 — 获取当前用户的全部错题
examRouter.get('/error-book', requireAuth, async (req, res) => {
  try {
    const wrongAnswers = await prisma.answerRecord.findMany({
      where: {
        examRecord: { userId: req.user!.userId },
        isCorrect: false,
      },
      include: {
        examRecord: { select: { id: true, submittedAt: true } },
      },
      orderBy: { answeredAt: 'desc' },
    })

    res.json(success({ wrongAnswers, total: wrongAnswers.length }))
  } catch (e: any) {
    console.error('Error book error:', e)
    res.status(500).json(fail(e.message || '获取错题本失败'))
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
