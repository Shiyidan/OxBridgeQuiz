// 规范化题目渲染与分析 JSON：渲染资源只存 attemptPayload，meta 只保留非作答态信息。
import { isDeepStrictEqual } from 'node:util'
import { parseJsonObject } from './jsonField.js'

export const QUESTION_RENDER_PAYLOAD_KEYS = [
  'code',
  'source_examType',
  'year',
  'is_ai_generated',
  'content_blocks',
  'images',
] as const

export interface NormalizedQuestionPayload {
  attemptPayload: Record<string, unknown>
  meta: Record<string, unknown>
  copiedKeys: string[]
  removedMetaKeys: string[]
  conflictKeys: string[]
  changed: boolean
}

// 自有属性检查用于区分字段缺失与显式 null，避免历史数据回填时误覆盖。
function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

// 历史数据先补齐安全作答载荷，再从 meta 删除重复渲染字段；冲突交给调用方硬停止。
export function normalizeQuestionPayload(
  rawAttemptPayload: unknown,
  rawMeta: unknown,
): NormalizedQuestionPayload {
  const originalAttemptPayload = parseJsonObject(rawAttemptPayload)
  const originalMeta = parseJsonObject(rawMeta)
  const attemptPayload = { ...originalAttemptPayload }
  const meta = { ...originalMeta }
  const copiedKeys: string[] = []
  const removedMetaKeys: string[] = []
  const conflictKeys: string[] = []

  for (const key of QUESTION_RENDER_PAYLOAD_KEYS) {
    const attemptHasKey = hasOwn(attemptPayload, key)
    const metaHasKey = hasOwn(meta, key)
    if (!metaHasKey) continue

    if (!attemptHasKey) {
      attemptPayload[key] = meta[key]
      copiedKeys.push(key)
    } else if (!isDeepStrictEqual(attemptPayload[key], meta[key])) {
      conflictKeys.push(key)
    }
    delete meta[key]
    removedMetaKeys.push(key)
  }

  return {
    attemptPayload,
    meta,
    copiedKeys,
    removedMetaKeys,
    conflictKeys,
    changed: !isDeepStrictEqual(attemptPayload, originalAttemptPayload)
      || !isDeepStrictEqual(meta, originalMeta),
  }
}
