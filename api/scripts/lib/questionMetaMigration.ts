// 仅供删除旧列前的数据迁移使用；业务读取不得依赖旧作答载荷。
import { isDeepStrictEqual } from 'node:util'

// 历史字符串只在迁移边界解码，坏数据必须阻止删列，不能转换为空对象。
function decodeObject(raw: unknown, name: string, nullable = false): Record<string, unknown> {
  let value = raw
  for (let depth = 0; typeof value === 'string' && depth < 3; depth++) value = JSON.parse(value)
  if (nullable && value === null) return {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} 必须是 JSON 对象`)
  return value as Record<string, unknown>
}

// 保留 meta 的全部字段，只补缺失项；所有旧字段都参与核对，包含未知扩展字段。
export function mergeLegacyQuestionMeta(rawAttempt: unknown, rawMeta: unknown) {
  const legacy = decodeObject(rawAttempt, 'attemptPayload', true)
  const original = decodeObject(rawMeta, 'meta')
  const meta = { ...original }
  const copiedKeys: string[] = []
  const conflictKeys: string[] = []
  for (const [key, value] of Object.entries(legacy)) {
    if (!Object.hasOwn(meta, key)) {
      Object.defineProperty(meta, key, { value, enumerable: true, configurable: true, writable: true })
      copiedKeys.push(key)
    } else if (!isDeepStrictEqual(meta[key], value)) conflictKeys.push(key)
  }
  for (const key of ['content_blocks', 'images']) {
    if (Object.hasOwn(meta, key) && !Array.isArray(meta[key])) throw new Error(`meta.${key} 必须是数组`)
  }
  if (Object.hasOwn(meta, 'learning_analysis')) decodeObject(meta.learning_analysis, 'meta.learning_analysis')
  return { meta, copiedKeys, conflictKeys, changed: !isDeepStrictEqual(rawMeta, meta) }
}
