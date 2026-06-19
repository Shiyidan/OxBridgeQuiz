import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'
import { processMarkdownImport } from '../services/markdownValidator.js'

export const papersRouter = Router()

/** 兼容 difficulty 的两种格式：对象 { level } 或纯字符串 */
function levelOf(q: any): string | null {
  const d = q?.difficulty
  if (!d) return null
  if (typeof d === 'string') return d
  return d.level || null
}

// 试卷列表
papersRouter.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const paperType = req.query.paperType as string | undefined
  const skip = (page - 1) * limit
  const where = paperType ? { paperType } : {}

  const [papers, total] = await Promise.all([
    prisma.paper.findMany({
      where,
      select: {
        id: true, title: true, code: true, year: true,
        duration: true, totalQuestions: true, paperType: true, status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip, take: limit
    }),
    prisma.paper.count({ where })
  ])

  res.json(success({ papers, total, page, totalPages: Math.ceil(total / limit) }))
})

// JSON 导入试卷
papersRouter.post('/import-json', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, year, duration, code, questions, paperType } = req.body

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
        paperType: paperType || 'past',
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
    const { markdown, title, year, duration, code, paperType } = req.body

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
        paperType: paperType || 'past',
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

// 考纲树 — 按考试类型返回平铺节点，前端组装树结构
papersRouter.get('/syllabus', async (req, res) => {
  try {
    const examType = (req.query.examType as string) || 'ESAT'
    const nodes = await prisma.syllabusNode.findMany({
      where: { examType },
      orderBy: { order: 'asc' },
    })
    // 组装为树结构
    const nodeMap = new Map<string, any>()
    const roots: any[] = []
    for (const n of nodes) {
      nodeMap.set(n.code, { code: n.code, label: n.label, children: [] })
    }
    for (const n of nodes) {
      const treeNode = nodeMap.get(n.code)!
      if (n.parentCode && nodeMap.has(n.parentCode)) {
        nodeMap.get(n.parentCode)!.children.push(treeNode)
      } else {
        roots.push(treeNode)
      }
    }
    // 清理空 children 数组
    const cleanEmptyChildren = (list: any[]) => {
      for (const item of list) {
        if (item.children.length === 0) delete item.children
        else cleanEmptyChildren(item.children)
      }
    }
    cleanEmptyChildren(roots)

    res.json(success(roots))
  } catch (e: any) {
    res.status(500).json(fail(e.message || '获取考纲失败'))
  }
})

// 试题库轻量摘要 — 仅返回考纲节点下的题数和难度分布，不返回题目详情
papersRouter.get('/question-bank/summary', async (req, res) => {
  try {
    const code = req.query.code as string | undefined

    const papers = await prisma.paper.findMany({
      where: { status: 'published' },
    })

    // 收集考纲节点及其子孙 code
    let filterCodes: string[] = []
    if (code) {
      const allNodes = await prisma.syllabusNode.findMany({ where: { examType: 'ESAT' } })
      const childCodes = new Set<string>([code])
      let prevSize = 0
      while (childCodes.size > prevSize) {
        prevSize = childCodes.size
        for (const n of allNodes) {
          if (n.parentCode && childCodes.has(n.parentCode)) childCodes.add(n.code)
        }
      }
      filterCodes = [...childCodes]
    }

    const diffCount: Record<string, number> = { easy: 0, medium: 0, hard: 0, composite: 0 }
    let total = 0

    for (const paper of papers) {
      const qs = JSON.parse(paper.questions)
      for (const q of qs) {
        const level = levelOf(q)
        if (!level || !['easy', 'medium', 'hard', 'composite'].includes(level)) continue

        if (filterCodes.length) {
          const spCodes = new Set((q.syllabus_points || []).map((sp: any) => sp.code))
          const kpCodes = new Set((q.knowledge_points || []).map((kp: any) => kp.code))
          if (!filterCodes.some(c => spCodes.has(c) || kpCodes.has(c))) continue
        }

        diffCount[level]++
        total++
      }
    }

    res.json(success({ total, difficultyCount: diffCount }))
  } catch (e: any) {
    res.status(500).json(fail(e.message || '获取摘要失败'))
  }
})

// 试题库 — 获取已发布考卷的全部题目（支持按难度/学科筛选）
papersRouter.get('/question-bank', async (req, res) => {
  try {
    const difficulty = req.query.difficulty as string | undefined
    const subject = req.query.subject as string | undefined
    const code = req.query.code as string | undefined

    // 试题库只取已上线的试卷
    const papers = await prisma.paper.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' },
    })

    // 考纲筛选：收集当前节点及其所有子孙的 code
    let filterCodes: string[] = []
    if (code) {
      const allNodes = await prisma.syllabusNode.findMany({
        where: { examType: 'ESAT' },
      })
      const childCodes = new Set<string>([code])
      let prevSize = 0
      while (childCodes.size > prevSize) {
        prevSize = childCodes.size
        for (const n of allNodes) {
          if (n.parentCode && childCodes.has(n.parentCode)) {
            childCodes.add(n.code)
          }
        }
      }
      filterCodes = [...childCodes]
    }

    const isFiltered = !!(difficulty || subject || code)
    const allQuestions: any[] = []
    const diffCount: Record<string, number> = { easy: 0, medium: 0, hard: 0, composite: 0 }
    const subjects = new Set<string>()

    for (const paper of papers) {
      const qs = JSON.parse(paper.questions)
      for (const q of qs) {
        const level = levelOf(q)
        if (!level || !['easy', 'medium', 'hard', 'composite'].includes(level)) continue

        if (difficulty && level !== difficulty) continue
        if (subject && q.subject !== subject) continue

        if (filterCodes.length) {
          const spCodes = new Set((q.syllabus_points || []).map((sp: any) => sp.code))
          const kpCodes = new Set((q.knowledge_points || []).map((kp: any) => kp.code))
          if (!filterCodes.some(c => spCodes.has(c) || kpCodes.has(c))) continue
        }

        // 始终统计筛选后的难度分布
        diffCount[level] = (diffCount[level] || 0) + 1
        if (!isFiltered && q.subject) subjects.add(q.subject)

        allQuestions.push({
          ...q,
          _paperId: paper.id,
          _paperTitle: paper.title,
          _paperYear: paper.year,
        })
      }
    }

    res.json(success({
      questions: allQuestions,
      total: allQuestions.length,
      difficultyCount: diffCount,
      ...(isFiltered ? {} : { subjects: [...subjects] }),
    }))
  } catch (e: any) {
    console.error('Question bank error:', e)
    res.status(500).json(fail(e.message || '获取试题库失败'))
  }
})

// 试卷详情
papersRouter.get('/assessment/papers', requireAuth, async (req, res) => {
  try {
    const papers = await prisma.paper.findMany({
      where: { status: 'published', paperType: 'past' },
      select: {
        id: true,
        title: true,
        code: true,
        year: true,
        duration: true,
        totalQuestions: true,
        paperType: true,
        createdAt: true,
      },
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
    })

    const records = await prisma.examRecord.findMany({
      where: { userId: req.user!.userId, status: 'submitted' },
      include: {
        paper: { select: { title: true, paperType: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 12,
    })

    res.json(success({
      papers,
      records: records
        .filter((record) => record.paper.paperType === 'past')
        .map((record) => ({
          id: record.id,
          paperTitle: record.paper.title,
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
    console.error('Assessment papers error:', e)
    res.status(500).json(fail(e.message || '获取诊断测试套卷失败'))
  }
})

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
  const { title, code, year, duration, questions, status, paperType } = req.body
  const paper = await prisma.paper.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title }),
      ...(code !== undefined && { code }),
      ...(year && { year }),
      ...(duration && { duration }),
      ...(questions && { questions: JSON.stringify(questions), totalQuestions: questions.length }),
      ...(status && { status }),
      ...(paperType && { paperType })
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
