import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { papersRouter } from './routes/papers.js'
import { parseRouter } from './routes/parse.js'
import { uploadRouter } from './routes/upload.js'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.API_PORT || 3001

app.use(cors({ origin: [/^http:\/\/localhost:\d+$/] }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')))

app.use('/api/papers', papersRouter)
app.use('/api/parse-tasks', parseRouter)
app.use('/api/upload', uploadRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`API Server running on http://localhost:${PORT}`)
})
