import { Router } from 'express'
import { prisma } from '../services/prisma.js'
import { addPageToTask } from '../services/parseService.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'

export const parseRouter = Router()

// 查询解析任务状态与进度
parseRouter.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  const task = await prisma.parseTask.findUnique({ where: { id: req.params.id } })
  if (!task) {
    res.status(404).json(fail('任务不存在'))
    return
  }
  res.json(success(task))
})

// 接收前端逐页渲染的页面，每页到达立即调 Qwen（信号量限制最多 5 并发）
parseRouter.post('/:id/pages', requireAuth, requireAdmin, async (req, res) => {
  const task = await prisma.parseTask.findUnique({ where: { id: req.params.id } })
  if (!task) {
    res.status(404).json(fail('任务不存在'))
    return
  }

  const { page, base64, totalPages } = req.body
  if (!base64 || page == null) {
    res.status(400).json(fail('缺少页面数据'))
    return
  }

  addPageToTask(task.id, task.paperId, { page, base64 }, totalPages).catch((err) =>
    console.error(`Page ${page} add failed:`, err),
  )

  res.json(success({ accepted: true, page }))
})
