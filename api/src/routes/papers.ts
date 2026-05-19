import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'

export const papersRouter = Router()

// 试卷列表
papersRouter.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const skip = (page - 1) * limit

  const [papers, total] = await Promise.all([
    prisma.paper.findMany({
      select: {
        id: true, title: true, code: true, year: true,
        duration: true, totalQuestions: true, status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit
    }),
    prisma.paper.count()
  ])

  res.json({ papers, total, page, totalPages: Math.ceil(total / limit) })
})

// 试卷详情
papersRouter.get('/:id', async (req, res) => {
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!paper) {
    res.status(404).json({ error: '试卷不存在' })
    return
  }
  res.json({
    ...paper,
    questions: JSON.parse(paper.questions)
  })
})

// 更新试卷（人工校对）
papersRouter.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { title, code, year, duration, questions, status } = req.body
  const paper = await prisma.paper.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(code !== undefined && { code }),
      ...(year && { year }),
      ...(duration && { duration }),
      ...(questions && { questions: JSON.stringify(questions), totalQuestions: questions.length }),
      ...(status && { status })
    }
  })
  res.json(paper)
})

// 删除试卷
papersRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  // TODO: 迁移至 OSS 后同步删除 OSS 文件
  await prisma.paper.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// 发布试卷
papersRouter.put('/:id/publish', requireAuth, requireAdmin, async (req, res) => {
  const paper = await prisma.paper.update({
    where: { id: req.params.id },
    data: { status: 'published' }
  })
  res.json(paper)
})

// 下载原始PDF
papersRouter.get('/:id/pdf', requireAuth, async (req, res) => {
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!paper?.pdfUrl) {
    res.status(404).json({ error: 'PDF暂不可用，OSS 尚未接入' })
    return
  }
  if (paper.pdfUrl.startsWith('http')) {
    res.redirect(paper.pdfUrl)
  } else {
    res.status(404).json({ error: 'PDF暂不可用，OSS 尚未接入' })
  }
})
