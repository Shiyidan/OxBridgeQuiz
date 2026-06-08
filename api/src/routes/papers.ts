import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import { processMarkdownImport } from '../services/markdownValidator.js'

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

  res.json(success({ papers, total, page, totalPages: Math.ceil(total / limit) }))
})

// JSON 导入试卷
papersRouter.post('/import-json', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, year, duration, code, questions } = req.body

    // 校验必填字段
    if (!title || !year) {
      res.status(400).json(fail('标题和年份为必填项'))
      return
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json(fail('题目列表不能为空'))
      return
    }

    // 校验每道题目的必填字段
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (q.number == null) {
        res.status(400).json(fail(`第 ${i + 1} 题缺少题号 (number)`))
        return
      }
      if (!q.title) {
        res.status(400).json(fail(`第 ${i + 1} 题缺少题干 (title)`))
        return
      }
      if (!Array.isArray(q.options) || q.options.length === 0) {
        res.status(400).json(fail(`第 ${i + 1} 题缺少选项 (options)`))
        return
      }
    }

    const paper = await prisma.paper.create({
      data: {
        title,
        year: parseInt(String(year)),
        duration: parseInt(String(duration)) || 60,
        code: code || undefined,
        questions: JSON.stringify(questions),
        totalQuestions: questions.length,
        status: 'draft',
      },
    })

    res.json(success({
      ...paper,
      questions: JSON.parse(paper.questions),
    }))
  } catch (e: any) {
    console.error('Import JSON error:', e)
    res.status(500).json(fail(e.message || '导入失败'))
  }
})

// Markdown 导入试卷
papersRouter.post('/import-markdown', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { markdown, title, year, duration, code } = req.body

    if (!title || !year) {
      res.status(400).json(fail('标题和年份为必填项'))
      return
    }
    if (!markdown || typeof markdown !== 'string') {
      res.status(400).json(fail('请提供 Markdown 内容'))
      return
    }

    const result = processMarkdownImport(markdown)

    if (result.errors.length > 0) {
      res.status(400).json(fail(`校验失败：${result.errors.map(e => e.message).join('；')}`))
      return
    }

    if (result.questions.length === 0) {
      res.status(400).json(fail('未能从 Markdown 中提取到有效的题目数据'))
      return
    }

    const paper = await prisma.paper.create({
      data: {
        title,
        year: parseInt(String(year)),
        duration: parseInt(String(duration)) || 60,
        code: code || undefined,
        questions: JSON.stringify(result.questions),
        totalQuestions: result.questions.length,
        status: 'draft',
      },
    })

    res.json(success({
      ...paper,
      questions: JSON.parse(paper.questions),
      warnings: result.warnings,
    }))
  } catch (e: any) {
    console.error('Import markdown error:', e)
    res.status(500).json(fail(e.message || '导入失败'))
  }
})

// 试卷详情
papersRouter.get('/:id', async (req, res) => {
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!paper) {
    res.status(404).json(fail('试卷不存在'))
    return
  }
  res.json(success({
    ...paper,
    questions: JSON.parse(paper.questions)
  }))
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
  res.json(success(paper))
})

// 删除试卷
papersRouter.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  // TODO: 迁移至 OSS 后同步删除 OSS 文件
  await prisma.paper.delete({ where: { id: req.params.id } })
  res.json(success(null))
})

// 发布试卷
papersRouter.put('/:id/publish', requireAuth, requireAdmin, async (req, res) => {
  const paper = await prisma.paper.update({
    where: { id: req.params.id },
    data: { status: 'published' }
  })
  res.json(success(paper))
})

// 下载原始PDF
papersRouter.get('/:id/pdf', requireAuth, async (req, res) => {
  const paper = await prisma.paper.findUnique({ where: { id: req.params.id } })
  if (!paper?.pdfUrl) {
    res.status(404).json(fail('PDF暂不可用，OSS 尚未接入'))
    return
  }
  if (paper.pdfUrl.startsWith('http')) {
    res.redirect(paper.pdfUrl)
  } else {
    res.status(404).json(fail('PDF暂不可用，OSS 尚未接入'))
  }
})
