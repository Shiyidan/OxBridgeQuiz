// 先加新列并生成阶段 Client，再备份和无损搬迁；验证成功后才能移除旧列。
import { Prisma } from '@prisma/client'
import { mkdir, open, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { isDeepStrictEqual } from 'node:util'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { migrateQuestionContent, verifyQuestionContent } from './lib/questionContentMigration.js'

// 按稳定主键分批读取所有列；限制图片题内存占用并确保备份包含全部题目。
async function scan(visit: (rows: any[]) => Promise<void>) {
  let cursor: string | undefined
  while (true) {
    const rows = await prisma.question.findMany({ orderBy: { id: 'asc' }, take: 30, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) })
    if (!rows.length) return
    await visit(rows)
    cursor = rows.at(-1)!.id
  }
}

// 全量审计必须先完成，避免遇到后段坏数据时才发现无法安全删列。
async function audit() {
  const result = { scanned: 0, pending: 0, errors: [] as Array<{ id: string; reason: string }> }
  await scan(async (rows) => {
    for (const row of rows) {
      result.scanned++
      try {
        const next = migrateQuestionContent(row)
        if (!['content', 'solution', 'meta'].every((key) => isDeepStrictEqual(row[key], next[key as keyof typeof next]))) result.pending++
      } catch (error) { result.errors.push({ id: row.id, reason: error instanceof Error ? error.message : String(error) }) }
    }
  })
  return result
}

// 运行期间必须暂停题目写入；更新时间不变，迁移不会改变历史关联或发布状态。
async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  if (apply === args.includes('--dry-run')) throw new Error('必须指定 --dry-run 或 --apply')
  const environment = args.find((arg) => arg.startsWith('--environment='))?.slice(14) || 'local'
  if (environment !== config.runtimeEnv) throw new Error('运行环境不匹配')
  if (environment === 'local' && !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error('local 只允许本地数据库')
  if (apply && !args.includes('--confirm=SPLIT_QUESTION_CONTENT')) throw new Error('需提供 --confirm=SPLIT_QUESTION_CONTENT')
  const fields = Prisma.dmmf.datamodel.models.find((model) => model.name === 'Question')?.fields.map((field) => field.name) || []
  if (!['options', 'answer', 'syllabusPoints', 'content', 'solution'].every((key) => fields.includes(key))) throw new Error('必须使用同时包含新旧列的 question-content-stage.prisma Client')
  const before = await audit()
  console.log(JSON.stringify({ mode: 'preflight', environment, ...before }, null, 2))
  if (before.errors.length) throw new Error('全量审计失败，未写入任何数据')
  if (!apply) return
  const directory = path.resolve(args.find((arg) => arg.startsWith('--backup-dir='))?.slice(13) || '../.private/question-content-migration')
  await mkdir(directory, { recursive: true })
  const stamp = Date.now()
  const backupFile = path.join(directory, `questions-before-${stamp}.ndjson.gz`)
  const backup = await open(backupFile, 'wx')
  try {
    await scan(async (rows) => { await backup.writeFile(gzipSync(rows.map((row) => JSON.stringify(row)).join('\n') + '\n')) })
    await backup.sync()
  } finally { await backup.close() }
  let verified = 0
  await scan(async (rows) => {
    for (const row of rows) {
      const data = migrateQuestionContent(row)
      await prisma.$transaction(async (tx) => {
        const current = await tx.question.findUniqueOrThrow({ where: { id: row.id } })
        if (!isDeepStrictEqual(current, row)) throw new Error(`题目 ${row.id} 出现并发修改`)
        await tx.question.update({ where: { id: row.id }, data: { ...data, updatedAt: row.updatedAt } as any })
        const updated = await tx.question.findUniqueOrThrow({ where: { id: row.id } })
        if (row.content == null || row.solution == null) verifyQuestionContent(row, updated)
        else if (!['content', 'solution', 'meta'].every((key) => isDeepStrictEqual((updated as any)[key], data[key as keyof typeof data]))) throw new Error(`题目 ${row.id} 核验失败`)
      })
      verified++
    }
  })
  const after = await audit()
  if (after.errors.length || after.pending || verified !== before.scanned || after.scanned !== before.scanned) throw new Error('迁移后验证失败，禁止删列')
  const result = { environment, verified, backupFile, ...after }
  await writeFile(path.join(directory, `verified-${stamp}.json`), JSON.stringify(result, null, 2), { flag: 'wx' })
  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(async () => { await prisma.$disconnect() })
