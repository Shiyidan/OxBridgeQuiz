// 为单次 HTTP 请求提供可跨异步调用读取的 Request ID 上下文。
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'

interface RequestContext {
  requestId: string
}

declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

const requestContextStorage = new AsyncLocalStorage<RequestContext>()

// 运行日志通过异步上下文读取当前请求标识，后台任务没有请求上下文时返回空值。
export function getCurrentRequestId(): string | undefined {
  return requestContextStorage.getStore()?.requestId
}

// 每次请求使用服务端生成的 UUID，避免客户端伪造标识混淆审计链路。
export const requestContextMiddleware: RequestHandler = (req, res, next) => {
  const requestId = randomUUID()
  req.requestId = requestId
  res.setHeader('X-Request-ID', requestId)
  requestContextStorage.run({ requestId }, next)
}
