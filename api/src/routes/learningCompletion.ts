// 点亮接口按登录账号读写个人进度，访问、查询和取消都不进入操作审计。
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { success, fail } from '../utils/response.js'
import { EXAM_TYPE } from '../constants/domain.js'
import { getLearningCompletions, setLearningCompletion, LearningCompletionError } from '../services/learningCompletion.js'
import { getCompletedQuestionCounts } from '../services/learningProgress.js'

export const learningCompletionRouter = createAsyncRouter()
learningCompletionRouter.use(requireAuth)
const examSchema = z.enum([EXAM_TYPE.ESAT, EXAM_TYPE.TMUA])
const updateSchema = z.object({ completed: z.boolean() }).strict()

// 知识点题库完成数量
learningCompletionRouter.get('/:examType/question-counts', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const exam = examSchema.safeParse(req.params.examType)
  if (!exam.success) { res.status(422).json(fail('考试类型不正确')); return }
  res.json(success({ counts: await getCompletedQuestionCounts(req.user!.userId, exam.data) }))
})

// 学习点亮状态
learningCompletionRouter.get('/:examType', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store')
  const exam = examSchema.safeParse(req.params.examType)
  if (!exam.success) { res.status(422).json(fail('考试类型不正确')); return }
  res.json(success({ items: await getLearningCompletions(req.user!.userId, exam.data) }))
})

// 点亮知识点
learningCompletionRouter.put('/:examType/:code', async (req, res) => {
  const exam = examSchema.safeParse(req.params.examType)
  const body = updateSchema.safeParse(req.body)
  if (!exam.success || !body.success || !/^\d{6}$/.test(req.params.code)) {
    res.status(422).json(fail('点亮参数不正确')); return
  }
  try {
    const items = await setLearningCompletion(req, exam.data, req.params.code, body.data.completed)
    res.json(success({ items }))
  } catch (error) {
    if (!(error instanceof LearningCompletionError)) throw error
    res.status(error.status).json(fail(error.message, error.code))
  }
})
