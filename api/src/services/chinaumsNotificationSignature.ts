// 银联商务异步通知签名工具：按接入指引完成参数规范化、排序、摘要计算和常量时间比对。
import crypto from 'crypto'

// Express 可能把重复表单字段解析为数组，验签统一采用最后一个实际值。
function normalizeNotificationValue(value: unknown): string {
  if (Array.isArray(value)) return normalizeNotificationValue(value[value.length - 1])
  if (value === null || value === undefined) return ''
  return typeof value === 'string' ? value : JSON.stringify(value)
}

// 表单通知统一转换为已解码字符串，签名必须使用 URL 解码后的原始参数值。
export function normalizeChinaumsNotification(payload: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, normalizeNotificationValue(value)]),
  )
}

// 通知签名排除 sign 后按参数名 ASCII 顺序拼接，并在末尾直接追加通讯密钥。
export function createChinaumsNotificationSignature(
  payload: Record<string, unknown>,
  communicationKey: string,
): string {
  const normalized = normalizeChinaumsNotification(payload)
  const source = Object.keys(normalized)
    .filter((key) => key !== 'sign')
    .sort()
    .map((key) => `${key}=${normalized[key]}`)
    .join('&')
  const algorithm = normalized.signType?.toUpperCase() === 'MD5' ? 'md5' : 'sha256'
  return crypto
    .createHash(algorithm)
    .update(`${source}${communicationKey}`, 'utf8')
    .digest('hex')
    .toUpperCase()
}

// 验签采用常量时间比较，避免根据比较耗时泄露摘要匹配位置。
export function verifyChinaumsNotificationSignature(
  payload: Record<string, unknown>,
  communicationKey: string,
): boolean {
  const normalized = normalizeChinaumsNotification(payload)
  const receivedSign = normalized.sign?.toUpperCase()
  if (!receivedSign || !communicationKey) return false
  const expected = createChinaumsNotificationSignature(normalized, communicationKey)
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(receivedSign)
  return expectedBuffer.length === receivedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
}
