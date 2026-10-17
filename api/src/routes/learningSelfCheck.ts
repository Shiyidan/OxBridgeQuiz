// 讲义固定自测入口：仅开放审核白名单，不提供学生筛选或任意题库检索。
import { z } from 'zod'
import { optionalAuth } from '../middleware/auth.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { fail, success } from '../utils/response.js'
import { getLearningSelfCheck, checkLearningSelfCheck } from '../services/learningSelfCheck.js'

export const learningSelfCheckRouter = createAsyncRouter()
const codeSchema = z.string().regex(/^\d{6}$/)
const answerSchema = z.object({ questionId: z.string().min(1).max(191), answer: z.string().regex(/^[A-Z]$/) }).strict()

// 精选知识点自测
learningSelfCheckRouter.get('/esat/self-check/:code', optionalAuth, async (req, res) => {
  const code = codeSchema.safeParse(req.params.code)
  if (!code.success) { res.status(400).json(fail('知识点编号不正确')); return }
  const result = await getLearningSelfCheck(code.data)
  if (!result) { res.status(404).json(fail('该知识点尚未配置自测')); return }
  res.json(success(result))
})

// 自测答案核对
learningSelfCheckRouter.post('/esat/self-check/:code/answer', optionalAuth, async (req, res) => {
  const code = codeSchema.safeParse(req.params.code)
  const body = answerSchema.safeParse(req.body)
  if (!code.success || !body.success) { res.status(400).json(fail('请选择有效的自测选项')); return }
  const result = await checkLearningSelfCheck(code.data, body.data.questionId, body.data.answer)
  if (!result) { res.status(409).json(fail('题目或选项已变化，请重新加载自测题')); return }
  res.json(success(result))
})
