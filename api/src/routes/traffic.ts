// 网站访问与推广上报路由：接收匿名访问聚合和口语推广兴趣事件。
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { USER_ROLE } from '../constants/domain.js'
import { optionalAuth } from '../middleware/auth.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { fail, success } from '../utils/response.js'
import { recordOralPromotionOpen } from '../services/oralPromotionAnalytics.js'
import { recordRegistrationVisit } from '../services/registrationAttribution.js'
import {
  recordWebsiteVisit,
  WEBSITE_VISITOR_TYPE,
} from '../services/websiteTraffic.js'

export const trafficRouter = createAsyncRouter()

const promotionEventSchema = z
  .object({
    event: z.enum(['impression', 'open', 'consult']),
    source: z.enum(['banner', 'charm', 'navigation']),
    page: z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  })
  .strict()

const promotionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.json(success({ recorded: false }))
  },
})

// 英语口语推广
trafficRouter.post('/promotion-events', promotionLimiter, optionalAuth, async (req, res) => {
  const parsed = promotionEventSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json(fail('推广事件格式不正确'))
    return
  }
  // 兼容尚未刷新的旧页面，但不再保存曝光或咨询点击。
  const recorded = parsed.data.event === 'open'
    ? await recordOralPromotionOpen(req, parsed.data.source)
    : false
  res.json(success({ recorded }))
})

const visitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (_req, res) => {
    res.json(success({ counted: false }))
  },
})

// 访问类别由服务端登录态判定；管理员访问不计入，IP 只从可信代理解析后的 req.ip 读取。
trafficRouter.post('/visit', visitLimiter, optionalAuth, async (req, res) => {
  if (req.user?.role === USER_ROLE.ADMIN) {
    res.json(success({ counted: false }))
    return
  }
  const visitorType =
    req.user?.role === USER_ROLE.STUDENT
      ? WEBSITE_VISITOR_TYPE.STUDENT
      : WEBSITE_VISITOR_TYPE.ANONYMOUS
  const result = await recordWebsiteVisit(req.ip, req.get('user-agent'), visitorType, new Date(), req.user?.userId)
  if (result.counted && visitorType === WEBSITE_VISITOR_TYPE.ANONYMOUS) recordRegistrationVisit(req, res)
  res.json(success(result))
})
