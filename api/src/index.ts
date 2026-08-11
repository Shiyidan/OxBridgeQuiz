import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from './config.js'
import { papersRouter } from './routes/papers.js'
import { parseRouter } from './routes/parse.js'
import { uploadRouter } from './routes/upload.js'
import { examRouter } from './routes/exam.js'
import { authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'
import { memberRouter } from './routes/member.js'
import { paymentRouter } from './routes/payment.js'
import { startDiagnosticReportWorker } from './services/diagnosticReportTask.js'
import { startPaymentLifecycleWorker } from './services/paymentLifecycle.js'
import { success } from './utils/response.js'
import { globalErrorHandler, notFoundHandler } from './middleware/error.js'
import { operationAuditMiddleware } from './middleware/operationAudit.js'
import { requestContextMiddleware } from './utils/requestContext.js'
import { requestLoggingMiddleware } from './middleware/requestLogging.js'
import { questionLibraryRouter } from './routes/questionLibrary.js'
import { practiceNotebookRouter } from './routes/practiceNotebooks.js'
import { trafficRouter } from './routes/traffic.js'
import { invitationsRouter } from './routes/invitations.js'

const app = express()

app.set('trust proxy', config.trustProxy)
app.use(requestContextMiddleware)
app.use(requestLoggingMiddleware)
app.use(cors({ origin: config.corsOrigins, credentials: true, exposedHeaders: ['X-Request-ID'] }))

// 安全头必须先于请求体解析器执行，确保解析失败响应也受到相同保护。
app.use((_req, res, next) => {
  // connect-src 'self'：Nginx 反代下前端 / 和 API /api/ 同域，无需额外配置
  res.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: blob: https://qr-test2.chinaums.com https://qr.chinaums.com; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self'")
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  next()
})

// 禁用 ETag，避免浏览器缓存 API 返回 304
app.set('etag', false)
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

app.use(cookieParser())
app.use(express.urlencoded({ extended: false, limit: '1mb' }))
app.use(express.json({ limit: '50mb' }))
app.use(operationAuditMiddleware)

app.use('/api/traffic', trafficRouter)
app.use('/api/auth', authRouter)
app.use('/api/getMember', memberRouter)
app.use('/api/payment', paymentRouter)
app.use('/api/invitations', invitationsRouter)
app.use('/api/exams', examRouter)
app.use('/api/admin', adminRouter)
app.use('/api/papers', papersRouter)
app.use('/api/question-library', questionLibraryRouter)
app.use('/api/practice-notebooks', practiceNotebookRouter)
app.use('/api/parse-tasks', parseRouter)
app.use('/api/upload', uploadRouter)

app.get('/api/health', (_req, res) => {
  res.json(success({ status: 'ok' }))
})

// 404 和异常处理必须位于全部正常路由之后，统一 API 失败响应。
app.use(notFoundHandler)
app.use(globalErrorHandler)

app.listen(config.port, () => {
  console.log(`API Server running on http://localhost:${config.port}`)
  console.log(
    `[config] env=${config.runtimeEnv}, refreshCookie=Secure:${config.refreshCookieSecure}; SameSite:${config.refreshCookieSameSite}`,
  )
  void startDiagnosticReportWorker().catch((error) => {
    console.error('[diagnostic-report-task] worker startup failed:', error)
  })
  void startPaymentLifecycleWorker().catch((error) => {
    console.error('[payment-lifecycle] worker startup failed:', error)
  })
})
