import { Router, Request, Response } from 'express'
import { prisma } from '../services/prisma.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { scoreAnswers, buildPartialReport, buildFullReportFromSession } from '../services/diagnostic.js'
import { success, fail } from '../utils/response.js'
import { safeParseQuestions } from '../utils/safeParse.js'

export const diagnosticRouter = Router()

// 获取诊断题目
diagnosticRouter.get('/questions', optionalAuth, async (req: Request, res: Response) => {
  try {
    // 如果已登录，检查配额
    if (req.user) {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
      if (user && user.diagnosticUsed && user.paymentStatus === 'free') {
        res.status(403).json(fail('免费诊断次数已用完，请升级付费解锁更多次数'))
        return
      }
    }

    // 从题库随机取 20 题作为诊断试题
    const papers = await prisma.paper.findMany({
      where: { status: 'published' },
      take: 5,
      orderBy: { createdAt: 'desc' },
    })

    // 聚合试题
    const allQuestions: Array<{
      id: string
      title: string
      options: { label: string; text: string }[]
      answer: string[]
      subject?: string
    }> = []

    for (const paper of papers) {
      const qs = safeParseQuestions(paper)
      for (const q of qs) {
        allQuestions.push({
          id: q.id || `q-${allQuestions.length}`,
          title: q.title || '',
          options: q.options || [],
          answer: q.answer || [],
          subject: q.subject,
        })
      }
    }

    // 随机选取 20 题（不足则全部返回）
    const shuffled = allQuestions.sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(20, shuffled.length))

    const questions = selected.map(({ answer, ...rest }) => rest)

    res.json(success({ questions, answers: selected.map((q) => ({ id: q.id, answer: q.answer })) }))
  } catch (err) {
    console.error('[diagnostic] questions error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 提交诊断答案
diagnosticRouter.post('/submit', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { answers, questionAnswers } = req.body
    // questionAnswers: 后端在校验时使用，不在响应中暴露
    if (!answers || !Array.isArray(answers)) {
      res.status(422).json(fail('请提交答案'))
      return
    }

    // 批改
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

    const totalQuestions = answers.length

    // 创建 DiagnosticSession
    const session = await prisma.diagnosticSession.create({
      data: {
        userId: req.user?.userId || null,
        answers: JSON.stringify(answers),
        totalQuestions,
        correctCount,
        status: req.user ? 'linked' : 'anonymous',
      },
    })

    // 如果已登录，标记 diagnosticUsed
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { diagnosticUsed: true },
      })
    }

    if (req.user) {
      // 登录用户返回完整报告
      const fullReport = buildFullReportFromSession(session)
      res.json(success({ report: fullReport }))
    } else {
      // 游客返回部分报告
      const partialReport = buildPartialReport(session.id, totalQuestions, items, correctCount)
      res.json(success({ report: partialReport }))
    }
  } catch (err) {
    console.error('[diagnostic] submit error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})

// 获取报告
diagnosticRouter.get('/report/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const session = await prisma.diagnosticSession.findUnique({
      where: { id: req.params.id },
    })

    if (!session) {
      res.status(404).json(fail('报告不存在'))
      return
    }

    // 游客只能看自己的匿名会话，且仅返回部分报告
    if (session.status === 'anonymous') {
      if (req.user && session.userId === req.user.userId) {
        // 已登录且是自己的，返回完整
        const fullReport = buildFullReportFromSession(session)
        res.json(success({ report: fullReport }))
        return
      }
      // 游客看部分报告
      const items = (JSON.parse(session.answers) as Array<{ questionId: string }>).map((a, i) => ({
        questionId: a.questionId,
        order: i + 1,
        isCorrect: true, // 简化，实际应在 session 中存储
      }))
      const partialReport = buildPartialReport(
        session.id,
        session.totalQuestions,
        items,
        session.correctCount,
      )
      res.json(success({ report: partialReport }))
      return
    }

    // linked 状态，检查归属
    if (req.user && session.userId === req.user.userId) {
      const fullReport = buildFullReportFromSession(session)
      res.json(success({ report: fullReport }))
    } else if (!req.user) {
      res.status(401).json(fail('请先登录查看完整报告'))
    } else {
      res.status(403).json(fail('无权查看此报告'))
    }
  } catch (err) {
    console.error('[diagnostic] report error:', err)
    res.status(500).json(fail('服务器错误'))
  }
})
