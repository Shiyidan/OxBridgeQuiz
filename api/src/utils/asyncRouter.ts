// 创建能将同步异常和异步拒绝统一转发给 Express 错误链的业务 Router。
import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'

const ROUTE_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

type RouteHandler = ((...args: any[]) => unknown) | RouteHandler[]

// 路由允许嵌套 handler 数组，包装时保留四参数错误处理中间件的签名。
function wrapRouteHandler(handler: RouteHandler): RouteHandler {
  if (Array.isArray(handler)) return handler.map(wrapRouteHandler)
  if (typeof handler !== 'function' || handler.length === 4) return handler

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = handler(req, res, next)
      if (result && typeof (result as Promise<unknown>).catch === 'function') {
        void (result as Promise<unknown>).catch(next)
      }
    } catch (error) {
      next(error)
    }
  }
}

// 统一包装所有常用 HTTP 方法，避免新增异步路由时遗漏 asyncRoute。
export function createAsyncRouter(): Router {
  const router = Router()
  const mutableRouter = router as any

  for (const method of ROUTE_METHODS) {
    const register = mutableRouter[method].bind(router)
    mutableRouter[method] = (path: unknown, ...handlers: RouteHandler[]) => {
      const registerRoute = register as (...args: any[]) => Router
      return registerRoute(path, ...handlers.map(wrapRouteHandler))
    }
  }

  return router
}
