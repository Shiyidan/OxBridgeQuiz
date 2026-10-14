// 在旧 Prisma Client 仍可读取旧列时，将题目内容无损合并至 meta；先审计、备份，再写入。
import { Prisma } from '@prisma/client'
import { mkdir, open } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { mergeLegacyQuestionMeta } from './lib/questionMetaMigration.js'

type LegacyRow = { id: string; updatedAt: Date; meta: unknown; attemptPayload: unknown }

// 主键分页限制 SVG 数据的内存占用；旧列仅存在于迁移脚本，不进入业务客户端类型。
async function scan(visit: (rows: LegacyRow[]) => Promise<void>) {
  let cursor: string | undefined
  while (true) {
    const rows = await prisma.question.findMany({
      orderBy: { id: 'asc' }, take: 50,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }) as unknown as LegacyRow[]
    if (!rows.length) return
    await visit(rows)
    cursor = rows.at(-1)!.id
  }
}

// 全库审计先于任何写入；重复键不一致、坏 JSON 均阻止迁移。
async function audit() {
  const result = { scanned: 0, needsMerge: 0, copiedFields: 0, errors: [] as Array<{ id: string; reason: string }> }
  await scan(async (rows) => {
    for (const row of rows) {
      result.scanned++
      try {
        const merged = mergeLegacyQuestionMeta(row.attemptPayload, row.meta)
        if (merged.conflictKeys.length) throw new Error(`重复字段冲突：${merged.conflictKeys.join(', ')}`)
        if (merged.changed) result.needsMerge++
        result.copiedFields += merged.copiedKeys.length
      } catch (error) {
        result.errors.push({ id: row.id, reason: error instanceof Error ? error.message : '无效 JSON' })
      }
    }
  })
  return result
}

// 每批压缩为 gzip 成员，备份包含全部 Question 字段，可用于原地恢复及删列后的逐题核验。
async function backup(directory: string) {
  await mkdir(directory, { recursive: true })
  const file = path.join(directory, `questions-before-${Date.now()}.ndjson.gz`)
  const handle = await open(file, 'wx')
  try {
    await scan(async (rows) => { await handle.writeFile(gzipSync(rows.map((row) => JSON.stringify(row)).join('\n') + '\n')) })
    await handle.sync()
  } finally { await handle.close() }
  return file
}

// 停止应用写入后执行；保留主键、业务字段和更新时间，乐观锁拒绝覆盖并发修改。
async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  if (apply === args.includes('--dry-run')) throw new Error('必须且只能指定 --dry-run 或 --apply')
  const environment = args.find((arg) => arg.startsWith('--environment='))?.slice(14) || 'local'
  if (environment !== config.runtimeEnv) throw new Error('环境不匹配，请显式指定 --environment=目标环境')
  if (environment === 'local' && !['127.0.0.1', 'localhost'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
    throw new Error('local 迁移仅允许本地数据库')
  }
  if (apply && !args.includes('--confirm=MERGE_QUESTION_META')) throw new Error('写入必须指定 --confirm=MERGE_QUESTION_META')
  if (!Prisma.dmmf.datamodel.models.find((model) => model.name === 'Question')?.fields.some((field) => field.name === 'attemptPayload')) {
    throw new Error('必须在 prisma generate 与删列迁移之前，使用仍包含旧列的 Prisma Client 执行此脚本')
  }
  const before = await audit()
  console.log(JSON.stringify({ mode: apply ? 'preflight' : 'dry-run', environment, ...before }, null, 2))
  if (before.errors.length) throw new Error('审计未通过，未写入任何数据；禁止执行删列迁移')
  if (!apply) return
  const directory = args.find((arg) => arg.startsWith('--backup-dir='))?.slice(13) || '../.private/question-meta-migration'
  const backupFile = await backup(path.resolve(directory))
  let updated = 0
  await scan(async (rows) => {
    for (const row of rows) {
      const merged = mergeLegacyQuestionMeta(row.attemptPayload, row.meta)
      if (merged.conflictKeys.length) throw new Error(`题目 ${row.id} 出现并发冲突`)
      if (!merged.changed) continue
      const result = await prisma.question.updateMany({
        where: { id: row.id, updatedAt: row.updatedAt },
        data: { meta: merged.meta as Prisma.InputJsonObject, updatedAt: row.updatedAt },
      })
      if (result.count !== 1) throw new Error(`题目 ${row.id} 已变化，停止迁移`)
      updated++
    }
  })
  const after = await audit()
  if (after.errors.length || after.needsMerge || after.scanned !== before.scanned) throw new Error('迁移后校验失败；禁止执行删列迁移')
  console.log(JSON.stringify({ mode: 'complete', updated, verified: after.scanned, backupFile }, null, 2))
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
  .finally(async () => { await prisma.$disconnect() })
