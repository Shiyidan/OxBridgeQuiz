import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { prisma } from '../services/prisma.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
papersRouter.put('/:id', async (req, res) => {
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
papersRouter.delete('/:id', async (req, res) => {
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (paper?.pdfUrl) {
    const pdfPath = path.join(__dirname, '../../', paper.pdfUrl)
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath)
  }
  await prisma.paper.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

// 发布试卷
papersRouter.put('/:id/publish', async (req, res) => {
  const paper = await prisma.paper.update({
    where: { id: req.params.id },
    data: { status: 'published' }
  })
  res.json(paper)
})

// 下载原始PDF
papersRouter.get('/:id/pdf', async (req, res) => {
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!paper?.pdfUrl) {
    res.status(404).json({ error: 'PDF不存在' })
    return
  }
  const pdfPath = path.join(__dirname, '../../', paper.pdfUrl)
  if (!fs.existsSync(pdfPath)) {
    res.status(404).json({ error: '文件不存在' })
    return
  }
  res.download(pdfPath, `${paper.title}.pdf`)
})
