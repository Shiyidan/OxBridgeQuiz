import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'
import { prisma } from '../services/prisma.js'
import { startParseTask } from '../services/parseService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../../../uploads')

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

uploadRouter.post('/paper', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: '请上传PDF文件' })
      return
    }

    const { title, year, duration } = req.body

    const paper = await prisma.paper.create({
      data: {
        title: title || req.file.originalname.replace('.pdf', ''),
        year: parseInt(year) || new Date().getFullYear(),
        duration: parseInt(duration) || 60,
        pdfUrl: `/uploads/${req.file.filename}`,
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

    res.json({
      paperId: paper.id,
      taskId: task.id,
      status: 'processing'
    })
  } catch (e: any) {
    console.error('Upload error:', e)
    res.status(500).json({ error: e.message || '上传失败' })
  }
})
