import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../services/prisma.js'
import { startParseTask } from '../services/parseService.js'
import { requireAuth } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/admin.js'
import { success, fail } from '../utils/response.js'

// PDF 上传暂存到系统临时目录，解析完成后可清理
// TODO: 迁移至阿里云 OSS
const uploadDir = os.tmpdir()

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('仅支持PDF文件'))
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
})

export const uploadRouter = Router()

uploadRouter.post('/paper', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json(fail('请上传PDF文件'))
      return
    }

    const { title, year, duration } = req.body

    const paper = await prisma.paper.create({
      data: {
        title: title || req.file.originalname.replace('.pdf', ''),
        year: parseInt(year) || new Date().getFullYear(),
        duration: parseInt(duration) || 60,
        pdfUrl: null, // TODO: 迁移至 OSS 后填入 OSS URL
        questions: '[]'
      }
    })

    // 异步启动解析任务
    const task = await prisma.parseTask.create({
      data: {
        paperId: paper.id,
        status: 'pending'
      }
    })

    // 后台启动解析
    startParseTask(task.id, paper.id, path.join(uploadDir, req.file.filename))
      .catch(err => console.error('Parse task failed:', err))

    res.json(success({
      paperId: paper.id,
      taskId: task.id,
      status: 'processing'
    }))
  } catch (e: any) {
    console.error('Upload error:', e)
    res.status(500).json(fail(e.message || '上传失败'))
  }
})
