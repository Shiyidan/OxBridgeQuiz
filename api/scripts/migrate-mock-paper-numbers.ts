// 开发库模考编号迁移：从迁移前快照建立独立系列，保留全部业务主键、题序和历史答卷。
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { config } from 'dotenv'
import { Prisma } from '@prisma/client'
import { prisma } from '../src/services/prisma.js'
import { buildPlan, canonical, protectedSets, type Snapshot } from '../src/services/mockPaperNumberMigration.js'

config({ path: process.env.API_ENV_FILE || '.env.mysql.local', override: true })

// 写入限定本机开发数据库，不允许通过环境参数将编号迁移误投到线上。
function assertDevelopmentDatabase(): void {
  const database = new URL(process.env.DATABASE_URL || '')
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(database.hostname))
  assert.equal(database.protocol, 'mysql:')
  assert.match(database.pathname, /dev|test/i)
  assert.doesNotMatch(database.pathname, /prod/i)
  assert.ok(!['prod', 'production'].includes(process.env.API_RUNTIME_ENV || ''))
  assert.notEqual(process.env.NODE_ENV, 'production')
}

// 预览及应用均先核对快照；应用事务完成后再次确认原题和历史答卷完全一致。
async function main(): Promise<void> {
  assertDevelopmentDatabase()
  const args = process.argv.slice(2)
  assert.ok(args.every((arg) => arg === '--apply' || arg === '--dry-run' || arg.startsWith('--snapshot=')), '未知参数')
  assert.ok(!(args.includes('--apply') && args.includes('--dry-run')), 'apply 与 dry-run 不能同时使用')
  const snapshotPath = resolve(args.find((arg) => arg.startsWith('--snapshot='))?.slice('--snapshot='.length) || '.tmp/mock-numbering-before.json')
  const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8')) as Snapshot
  const plan = buildPlan(snapshot)
  const setIds = snapshot.sets.map((set) => set.id)
  const paperIds = snapshot.sets.flatMap((set) => set.paperId ? [set.paperId] : [])
  const current = await prisma.mockPaperSet.findMany({ where: { id: { in: setIds } }, include: { modules: { include: { questions: true } } } })
  assert.deepEqual(protectedSets(current), protectedSets(snapshot.sets), '当前试卷内容或来源关系与快照不一致')
  const recordsBefore = await prisma.examRecord.findMany({ where: { paperId: { in: paperIds } }, include: { answers: true } })
  assert.deepEqual(canonical(recordsBefore), canonical(snapshot.records), '当前答卷与迁移快照不一致')
  await writeFile(resolve('.tmp/mock-paper-number-mapping.json'), JSON.stringify(plan, null, 2), 'utf8')
  if (args.includes('--apply')) {
    await prisma.$transaction(async (tx) => {
      for (const item of plan.series) {
        const existing = await tx.mockPaperSeries.findUnique({ where: { id: item.id } })
        if (existing) {
          assert.deepEqual({ id: existing.id, examType: existing.examType, kind: existing.kind, moduleCode: existing.moduleCode, sequenceNo: existing.sequenceNo }, item)
        } else await tx.mockPaperSeries.create({ data: item })
      }
      for (const { id, ...data } of plan.sets) await tx.mockPaperSet.update({ where: { id }, data })
      for (const { id, ...data } of plan.modules) await tx.mockPaperModule.update({ where: { id }, data })
      for (const counter of plan.counters) {
        await tx.mockPaperNumberCounter.upsert({ where: { id: counter.id }, create: counter, update: {} })
        await tx.mockPaperNumberCounter.updateMany({ where: { id: counter.id, lastNumber: { lt: counter.lastNumber } }, data: { lastNumber: counter.lastNumber } })
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 120_000 })
  }
  const after = await prisma.mockPaperSet.findMany({ where: { id: { in: setIds } }, include: { modules: { include: { questions: true } } } })
  assert.deepEqual(protectedSets(after), protectedSets(snapshot.sets))
  assert.deepEqual(canonical(await prisma.examRecord.findMany({ where: { paperId: { in: paperIds } }, include: { answers: true } })), canonical(snapshot.records))
  console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'dry-run', setVersions: plan.sets.length, moduleVersions: plan.modules.length, fullSeries: plan.series.filter((item) => item.kind === 'full').length, singleSeries: plan.series.filter((item) => item.kind === 'single').length, counters: plan.counters, preservedExamRecords: snapshot.records.length }, null, 2))
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
