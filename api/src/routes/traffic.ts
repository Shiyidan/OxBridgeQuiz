// 网站访问上报路由：接收匿名首屏访问并由服务端 IP 完成日期级聚合。
import rateLimit from 'express-rate-limit'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { success } from '../utils/response.js'
import { recordWebsiteVisit } from '../services/websiteTraffic.js'

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

// 访问统计不依赖登录态，IP 只从经过可信代理解析的 req.ip 读取。
trafficRouter.post('/visit', visitLimiter, async (req, res) => {
  const result = await recordWebsiteVisit(req.ip, req.get('user-agent'))
  res.json(success(result))
})
