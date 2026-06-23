import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { config } from './config.js'
import { papersRouter } from './routes/papers.js'
import { parseRouter } from './routes/parse.js'
import { uploadRouter } from './routes/upload.js'
import { examRouter } from './routes/exam.js'
import { authRouter } from './routes/auth.js'
import { diagnosticRouter } from './routes/diagnostic.js'
import { adminRouter } from './routes/admin.js'
import { memberRouter } from './routes/member.js'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const app = express()

app.use(cors({ origin: config.corsOrigins }))
app.use(express.json({ limit: '50mb' }))

// 禁用 ETag，避免浏览器缓存 API 返回 304
app.set('etag', false)
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

app.use('/api/auth', authRouter)
app.use('/api/getMember', memberRouter)
app.use('/api/exams', examRouter)
app.use('/api/diagnostic', diagnosticRouter)
app.use('/api/admin', adminRouter)
app.use('/api/papers', papersRouter)
app.use('/api/parse-tasks', parseRouter)
app.use('/api/upload', uploadRouter)

import { success } from './utils/response.js'

app.get('/api/health', (_req, res) => {
  res.json(success({ status: 'ok' }))
})

app.listen(config.port, () => {
  console.log(`API Server running on http://localhost:${config.port}`)
})
