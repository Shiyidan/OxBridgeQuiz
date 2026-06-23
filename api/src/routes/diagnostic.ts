import { Router, Request, Response } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { buildFullReportFromSession } from '../services/diagnostic.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { checkMemberAccess } from '../services/member.js'

export const diagnosticRouter = Router()

// 获取诊断题目（需登录）
diagnosticRouter.get('/questions', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      res.status(404).json(fail('用户不存在'))
      return
    }

    const examType = (req.query.examType as string) || 'TMUA'
    const entitlement = await checkMemberAccess(req.user!.userId, 'diagnostic', examType, 1)
    if (!entitlement.allowed) {
      res.status(403).json(fail('当前诊断测试额度不足，请开通会员后继续'))
      return
    }

    const dbQuestions = await prisma.question.findMany({
      where: { examType, paper: { status: 'published' } },
      take: 100,
    })

    const allQuestions = dbQuestions.map((q) => {
      const formatted = formatQuestionRow(q)
      return {
        id: formatted.id,
        title: formatted.title,
        options: formatted.options,
        answer: formatted.answer,
        subject: formatted.subject,
      }
    })

    const shuffled = allQuestions.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(20, shuffled.length))
    const questions = selected.map(({ answer, ...rest }) => rest)

    res.json(success({ questions, answers: selected.map((q) => ({ id: q.id, answer: q.answer })) }))
  } catch (err) {
    console.error('[diagnostic] questions error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 提交诊断答案（需登录）
diagnosticRouter.post('/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const { answers, questionAnswers, examType = 'TMUA' } = req.body
    if (!answers || !Array.isArray(answers)) {
      res.status(422).json(fail('请提交答案'))
      return
    }

    const entitlement = await checkMemberAccess(req.user!.userId, 'diagnostic', examType, 1)
    if (!entitlement.allowed) {
      res.status(403).json(fail('当前诊断测试额度不足，请开通会员后继续'))
      return
    }

    const qaMap = new Map<string, string[]>(
      (questionAnswers || []).map((qa: { id: string; answer: string[] }) => [qa.id, qa.answer]),
    )

    let correctCount = 0
    const items = answers.map(
      (a: { questionId: string; selectedAnswer: string }, i: number) => {
        const correct = qaMap.get(a.questionId) || []
        const isCorrect = correct.length === 1 && correct[0] === a.selectedAnswer
        if (isCorrect) correctCount++
        return { questionId: a.questionId, order: i + 1, isCorrect }
      },
    )

    const session = await prisma.diagnosticSession.create({
      data: {
        userId: req.user!.userId,
        examType,
        answers: JSON.stringify(answers),
        totalQuestions: answers.length,
        correctCount,
        status: 'linked',
      },
    })

    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { diagnosticUsed: true },
    })

    const fullReport = buildFullReportFromSession(session)
    res.json(success({ report: fullReport }))
  } catch (err) {
    console.error('[diagnostic] submit error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 获取报告（需登录，仅允许查看自己的）
diagnosticRouter.get('/report/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const session = await prisma.diagnosticSession.findUnique({
      where: { id: req.params.id },
    })

    if (!session) {
      res.status(404).json(fail('报告不存在'))
      return
    }

    if (session.userId !== req.user!.userId) {
      res.status(403).json(fail('无权查看此报告'))
      return
    }

    const fullReport = buildFullReportFromSession(session)
    res.json(success({ report: fullReport }))
  } catch (err) {
    console.error('[diagnostic] report error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})
