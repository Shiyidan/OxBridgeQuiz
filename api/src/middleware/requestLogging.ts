// 记录每个 HTTP 请求的完成状态和耗时，作为操作审计与运行日志的连接点。
import type { RequestHandler } from 'express'
import { normalizeIpAddress } from '../utils/ipAddress.js'
import { logRuntimeError, logRuntimeInfo, logRuntimeWarning } from '../utils/runtimeLogger.js'

// 查询参数可能包含邮箱或筛选输入，运行日志只保存不带 query 的路径。
function requestPath(originalUrl: string): string {
  return originalUrl.split('?')[0]
}

export const requestLoggingMiddleware: RequestHandler = (req, res, next) => {
  const startedAt = process.hrtime.bigint()
  let completed = false

  // 完成事件在认证和业务路由之后触发，此时可以记录最终用户、状态码及精确耗时。
  res.once('finish', () => {
    completed = true
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    const fields = {
      requestId: req.requestId,
      method: req.method,
      path: requestPath(req.originalUrl),
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ipAddress: normalizeIpAddress(req.ip),
      userId: req.user?.userId,
    }
    if (res.statusCode >= 500) {
      logRuntimeError('http.request.completed', undefined, fields)
      return
    }
    if (res.statusCode >= 400) {
      logRuntimeWarning('http.request.completed', fields)
      return
    }
    logRuntimeInfo('http.request.completed', fields)
  })

  // 客户端断开且响应未完成时没有 finish 事件，需要单独留下可检索记录。
  res.once('close', () => {
    if (completed) return
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    logRuntimeWarning('http.request.aborted', {
      requestId: req.requestId,
      method: req.method,
      path: requestPath(req.originalUrl),
      durationMs: Number(durationMs.toFixed(2)),
      ipAddress: normalizeIpAddress(req.ip),
      userId: req.user?.userId,
    })
  })

  next()
}
