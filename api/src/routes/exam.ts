// 聚合考试领域子路由，并保持 /api/exams 下的既有路径不变。
import { Router } from 'express'
import { errorBookRouter } from './errorBook.js'
import { examSessionRouter } from './exam-session.js'
import { examResultRouter } from './exam-results.js'

export const examRouter = Router()

examRouter.use(errorBookRouter)
examRouter.use(examSessionRouter)
examRouter.use(examResultRouter)
