// 网站访问上报路由：接收匿名首屏访问并由服务端 IP 完成日期级聚合。
import rateLimit from 'express-rate-limit'
import { USER_ROLE } from '../constants/domain.js'
import { optionalAuth } from '../middleware/auth.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { success } from '../utils/response.js'
import {
  recordWebsiteVisit,
  WEBSITE_VISITOR_TYPE,
} from '../services/websiteTraffic.js'

export const trafficRouter = createAsyncRouter()

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
  const result = await recordWebsiteVisit(req.ip, req.get('user-agent'), visitorType)
  res.json(success(result))
})
