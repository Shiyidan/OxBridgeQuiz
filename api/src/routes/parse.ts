import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { startParseTask } from '../services/parseService.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const parseRouter = Router()

// 查询解析任务
parseRouter.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  const task = await prisma.parseTask.findUnique({ where: { id: req.params.id } })
  if (!task) {
    res.status(404).json({ error: '任务不存在' })
    return
  }
  res.json(task)
})

// 重试
parseRouter.post('/:id/retry', requireAuth, requireAdmin, async (req, res) => {
  const task = await prisma.parseTask.findUnique({ where: { id: req.params.id } })
  if (!task) {
    res.status(404).json({ error: '任务不存在' })
    return
  }
  const paper = await prisma.paper.findUnique({ where: { id: task.paperId } })
  if (!paper) {
    res.status(404).json({ error: '试卷不存在' })
    return
  }

  await prisma.parseTask.update({
    where: { id: task.id },
    data: { status: 'pending', error: null, progress: 0 }
  })

  const pdfPath = path.join(__dirname, '../../', paper.pdfUrl)
  startParseTask(task.id, paper.id, pdfPath).catch(console.error)

  res.json({ status: 'processing' })
})
