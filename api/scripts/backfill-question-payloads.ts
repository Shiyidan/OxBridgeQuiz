// 将历史题目的渲染资源统一迁入 attemptPayload，并从 meta 删除重复副本。
import { Prisma } from '@prisma/client'
import { prisma } from '../src/services/prisma.js'
import {
  QUESTION_RENDER_PAYLOAD_KEYS,
  normalizeQuestionPayload,
} from '../src/utils/questionPayload.js'
import { parseJsonObject } from '../src/utils/jsonField.js'

const APPLY_CONFIRMATION = 'NORMALIZE_QUESTION_PAYLOADS'
const BATCH_SIZE = 100

interface BackfillOptions {
  apply: boolean
}

interface AuditStats {
  scannedQuestions: number
  candidateQuestions: number
  copiedFieldCount: number
  removedFieldCount: number
  duplicateBytesRemoved: number
  conflictQuestions: Array<{ id: string; keys: string[] }>
}

// 写模式需要固定确认短语，避免误把尚未审计的数据直接规范化。
function parseOptions(): BackfillOptions {
  const args = new Set(process.argv.slice(2))
  const dryRun = args.has('--dry-run')
  const apply = args.has('--apply')
  const confirmation = [...args].find((arg) => arg.startsWith('--confirm='))?.slice(10)

  if (dryRun === apply) throw new Error('必须且只能指定 --dry-run 或 --apply')
  if (apply && confirmation !== APPLY_CONFIRMATION) {
    throw new Error(`写模式必须附加 --confirm=${APPLY_CONFIRMATION}`)
  }
  return { apply }
}

// 只统计 meta 中即将移除的渲染字段，输出容量收益但不打印题目内容。
function duplicatedRenderBytes(rawMeta: unknown): number {
  const meta = parseJsonObject(rawMeta)
  return QUESTION_RENDER_PAYLOAD_KEYS.reduce((total, key) => {
    if (!Object.prototype.hasOwnProperty.call(meta, key)) return total
    return total + Buffer.byteLength(JSON.stringify({ [key]: meta[key] }), 'utf8')
  }, 0)
}

// 主键游标扫描避免一次性加载全部 SVG；回调仅在当前题目确实需要更新时执行。
async function scanQuestions(
  onCandidate?: (question: {
    id: string
    attemptPayload: Prisma.JsonValue | null
    meta: Prisma.JsonValue
  }) => Promise<void>,
): Promise<AuditStats> {
  const stats: AuditStats = {
    scannedQuestions: 0,
    candidateQuestions: 0,
    copiedFieldCount: 0,
    removedFieldCount: 0,
    duplicateBytesRemoved: 0,
    conflictQuestions: [],
  }
  let cursorId: string | undefined

  while (true) {
    const questions = await prisma.question.findMany({
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      select: { id: true, attemptPayload: true, meta: true },
    })
    if (!questions.length) break

    for (const question of questions) {
      stats.scannedQuestions += 1
      const normalized = normalizeQuestionPayload(question.attemptPayload, question.meta)
      if (normalized.conflictKeys.length) {
        stats.conflictQuestions.push({ id: question.id, keys: normalized.conflictKeys })
      }
      if (!normalized.changed) continue

      stats.candidateQuestions += 1
      stats.copiedFieldCount += normalized.copiedKeys.length
      stats.removedFieldCount += normalized.removedMetaKeys.length
      stats.duplicateBytesRemoved += duplicatedRenderBytes(question.meta)
      if (onCandidate) await onCandidate(question)
    }
    cursorId = questions.at(-1)!.id
  }
  return stats
}

// 每题更新前重新规范化并拒绝冲突，确保审计和写入之间的数据变化不会被覆盖。
async function updateQuestion(question: {
  id: string
  attemptPayload: Prisma.JsonValue | null
  meta: Prisma.JsonValue
}): Promise<void> {
  const normalized = normalizeQuestionPayload(question.attemptPayload, question.meta)
  if (normalized.conflictKeys.length) {
    throw new Error(`题目 ${question.id} 的渲染字段冲突：${normalized.conflictKeys.join(', ')}`)
  }
  if (!normalized.changed) return

  await prisma.question.update({
    where: { id: question.id },
    data: {
      attemptPayload: normalized.attemptPayload as Prisma.InputJsonObject,
      meta: normalized.meta as Prisma.InputJsonObject,
    },
  })
}

// 写入前先完成全库冲突审计；任何不一致都必须人工判断，不能自动选择副本。
async function main(): Promise<void> {
  const options = parseOptions()
  const audit = await scanQuestions()
  if (audit.conflictQuestions.length) {
    console.log(JSON.stringify({
      mode: options.apply ? 'apply-blocked' : 'dry-run',
      ...audit,
      conflictQuestions: audit.conflictQuestions.slice(0, 50),
    }, null, 2))
    if (options.apply) throw new Error('存在渲染字段冲突，已停止写入')
    return
  }

  if (!options.apply) {
    console.log(JSON.stringify({ mode: 'dry-run', ...audit }, null, 2))
    return
  }

  let updatedQuestions = 0
  const writeStats = await scanQuestions(async (question) => {
    await updateQuestion(question)
    updatedQuestions += 1
  })
  const verification = await scanQuestions()
  if (verification.candidateQuestions !== 0 || verification.conflictQuestions.length !== 0) {
    throw new Error(
      `回填后校验失败：仍有 ${verification.candidateQuestions} 道待处理题目、`
      + `${verification.conflictQuestions.length} 道冲突题目`,
    )
  }

  console.log(JSON.stringify({
    mode: 'apply',
    auditedQuestions: audit.scannedQuestions,
    updatedQuestions,
    copiedFieldCount: writeStats.copiedFieldCount,
    removedFieldCount: writeStats.removedFieldCount,
    duplicateBytesRemoved: writeStats.duplicateBytesRemoved,
    remainingCandidates: verification.candidateQuestions,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

