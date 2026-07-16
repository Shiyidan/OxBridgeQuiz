// 将 API 的 404、请求解析错误和未捕获异常转换为统一 JSON 响应。
import { Prisma } from '@prisma/client'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { MulterError } from 'multer'
import { ZodError } from 'zod'
import { AuthError } from '../utils/authError.js'
import { fail } from '../utils/response.js'

type ErrorResponse = {
  status: number
  code: string
  message: string
}

// body-parser 通过 type 标识请求体过大，不依赖具体错误类。
function hasErrorType(error: unknown, type: string): boolean {
  return Boolean(error && typeof error === 'object' && 'type' in error && error.type === type)
}

// JSON 语法错误由 express.json 在进入业务路由前抛出。
function isJsonSyntaxError(error: unknown): boolean {
  return error instanceof SyntaxError
    && Boolean(error && typeof error === 'object' && 'body' in error)
}

// 仅向客户端暴露已知、安全的错误语义，未知异常统一隐藏内部细节。
function mapError(error: unknown): ErrorResponse {
  if (error instanceof AuthError) {
    return { status: error.status, code: error.code, message: error.message }
  }
  if (error instanceof ZodError) {
    return { status: 422, code: 'VALIDATION_ERROR', message: '请求参数校验失败' }
  }
  if (isJsonSyntaxError(error)) {
    return { status: 400, code: 'INVALID_JSON', message: '请求体 JSON 格式不正确' }
  }
  if (hasErrorType(error, 'entity.too.large')) {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: '请求体超过大小限制' }
  }
  if (error instanceof MulterError) {
    const tooLarge = error.code === 'LIMIT_FILE_SIZE'
    return {
      status: tooLarge ? 413 : 400,
      code: tooLarge ? 'FILE_TOO_LARGE' : 'UPLOAD_ERROR',
      message: tooLarge ? '上传文件超过大小限制' : '上传文件处理失败',
    }
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return { status: 409, code: 'DATA_CONFLICT', message: '数据已存在或发生冲突' }
    }
    if (error.code === 'P2025') {
      return { status: 404, code: 'DATA_NOT_FOUND', message: '请求的数据不存在' }
    }
  }
  return { status: 500, code: 'INTERNAL_ERROR', message: '服务器内部错误' }
}

// 未匹配路由也遵守 API envelope，避免 Express 返回 HTML。
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(fail(`接口不存在：${req.method} ${req.originalUrl}`, 'NOT_FOUND'))
}

// 错误日志保留完整对象供排查，客户端只收到 mapError 允许公开的信息。
export const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  const mapped = mapError(error)
  console.error('[unhandled-api-error]', {
    method: req.method,
    path: req.originalUrl,
    status: mapped.status,
    code: mapped.code,
    error,
  })
  res.status(mapped.status).json(fail(mapped.message, mapped.code))
}
