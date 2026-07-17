// 输出可由 PM2 收集和按 Request ID 检索的单行 JSON 运行日志。
import { getCurrentRequestId } from './requestContext.js'

type RuntimeLogFields = Record<string, unknown>

// Error 的 message、stack 和扩展属性需要显式展开，否则 JSON.stringify 只会得到空对象。
function serializeError(error: unknown): unknown {
  if (!(error instanceof Error)) return error
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...Object.fromEntries(Object.entries(error)),
  }
}

// 循环引用和 BigInt 不应导致记录运行日志本身再次抛错。
function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>()
  try {
    return JSON.stringify(value, (_key, item: unknown) => {
      if (typeof item === 'bigint') return item.toString()
      if (item instanceof Error) return serializeError(item)
      if (item && typeof item === 'object') {
        if (seen.has(item)) return '[Circular]'
        seen.add(item)
      }
      return item
    })
  } catch (error) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'runtime_log.serialization_failed',
      requestId: getCurrentRequestId(),
      error: serializeError(error),
    })
  }
}

// 所有级别共享相同结构，便于 grep、日志采集器和后续告警规则解析。
function writeRuntimeLog(level: 'info' | 'warn' | 'error', event: string, fields: RuntimeLogFields): void {
  const requestId = getCurrentRequestId()
  const line = safeStringify({
    ...fields,
    timestamp: new Date().toISOString(),
    level,
    event,
    ...(requestId ? { requestId } : {}),
  })
  if (level === 'error') {
    console.error(line)
    return
  }
  if (level === 'warn') {
    console.warn(line)
    return
  }
  console.info(line)
}

// 普通请求完成和关键业务阶段使用 info 级别。
export function logRuntimeInfo(event: string, fields: RuntimeLogFields = {}): void {
  writeRuntimeLog('info', event, fields)
}

// 客户端错误、连接中断等需要关注但不代表服务故障的事件使用 warn 级别。
export function logRuntimeWarning(event: string, fields: RuntimeLogFields = {}): void {
  writeRuntimeLog('warn', event, fields)
}

// 异常对象保留完整堆栈，同时自动补充当前 Request ID。
export function logRuntimeError(
  event: string,
  error: unknown,
  fields: RuntimeLogFields = {},
): void {
  writeRuntimeLog('error', event, { ...fields, error: serializeError(error) })
}
