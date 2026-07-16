// 聚合试卷领域子路由，并保持 /api/papers 下的既有路径不变。
import { Router } from 'express'
import { paperImportRouter } from './papers-import.js'
import { syllabusRouter } from './syllabus.js'
import { questionBankRouter } from './questionBank.js'
import { paperCrudRouter } from './papers-crud.js'

export const papersRouter = Router()

papersRouter.use(paperImportRouter)
papersRouter.use(syllabusRouter)
papersRouter.use(questionBankRouter)
papersRouter.use(paperCrudRouter)
