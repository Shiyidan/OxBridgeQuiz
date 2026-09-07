// 开发库模考编号迁移：从迁移前快照建立独立系列，保留全部业务主键、题序和历史答卷。
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { config } from 'dotenv'
import { Prisma } from '@prisma/client'
import { prisma } from '../src/services/prisma.js'
import { mockPaperNumberPool, type MockPaperSeriesKind } from '../src/services/mockPaperNumbering.js'

config({ path: process.env.API_ENV_FILE || '.env.mysql.local', override: true })

type LegacyModule = {
  id: string; code: string; title: string | null; sourceModuleId: string | null; createdAt: string
  questions: Array<{ id: string; questionId: string | null; sourceCode: string; position: number }>
}
type LegacySet = {
  id: string; code: string; sequenceNo: number; examType: string; title: string; version: number
  deletedAt: string | null; paperId: string | null; createdAt: string; modules: LegacyModule[]
}
type NumberSeries = { id: string; examType: string; kind: MockPaperSeriesKind; moduleCode: string; sequenceNo: number }
type Snapshot = { sets: LegacySet[]; records: Array<Record<string, unknown>> }

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

// 相同快照重复预览或执行会得到相同系列 ID，不因重试再次创建编号。
function seriesId(key: string): string {
  return `mock-series-${createHash('sha256').update(key).digest('hex').slice(0, 32)}`
}

// 对 JSON 对象键及带主键的记录数组排序，排除数据库返回顺序对快照核对的影响。
function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    const rows = value.map(canonical)
    if (rows.every((row) => row && typeof row === 'object' && 'id' in row)) {
      rows.sort((left, right) => String((left as { id: string }).id).localeCompare(String((right as { id: string }).id)))
    }
    return rows
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  }
  return value
}

// 仅抽取不得改变的试卷身份、父关系和题目引用，编号新增字段不参与内容比较。
function protectedSets(sets: Array<{
  id: string; title: string; paperId: string | null
  modules: Array<{ id: string; code: string; title: string | null; sourceModuleId: string | null; questions: LegacyModule['questions'] }>
}>): unknown {
  return canonical(sets.map((set) => ({
    id: set.id, title: set.title, paperId: set.paperId,
    modules: set.modules.map((module) => ({
      id: module.id, code: module.code, title: module.title, sourceModuleId: module.sourceModuleId,
      questions: module.questions.map((question) => ({ id: question.id, questionId: question.questionId, sourceCode: question.sourceCode, position: question.position })),
    })),
  })))
}

// 旧父序号仅用于已审核的历史归族，后续新增完全由独立编号池分配。
function buildPlan(snapshot: Snapshot) {
  const series = new Map<string, NumberSeries>()
  const fullGroups = new Map<string, LegacySet[]>()
  for (const set of snapshot.sets) {
    const key = `${set.examType}:${set.code.replace(/-V[1-9]\d*$/i, '')}`
    fullGroups.set(key, [...(fullGroups.get(key) || []), set])
  }
  const sets: Array<{ id: string; seriesId: string | null; versionGroupId: string }> = []
  for (const [key, versions] of fullGroups) {
    const isFull = !key.includes('-RELEASED-') && versions.some((set) => !set.deletedAt || set.modules.length > 1)
    const first = versions[0]!
    const groupId = seriesId(`container:${key}`)
    if (isFull) {
      assert.ok(versions.every((set) => set.sequenceNo === first.sequenceNo), `整卷版本编号冲突：${key}`)
      assert.equal(new Set(versions.map((set) => set.version)).size, versions.length, `整卷版本重复：${key}`)
      series.set(groupId, { id: groupId, examType: first.examType, kind: 'full', moduleCode: '', sequenceNo: first.sequenceNo })
    }
    for (const set of versions) sets.push({ id: set.id, seriesId: isFull ? groupId : null, versionGroupId: groupId })
  }
  const modules: Array<{ id: string; seriesId: string | null; version: number | null }> = []
  const usedVersions = new Set<string>()
  for (const set of snapshot.sets) {
    for (const module of set.modules) {
      if (module.sourceModuleId) {
        modules.push({ id: module.id, seriesId: null, version: null })
        continue
      }
      const id = seriesId(`single:${set.examType}:${set.sequenceNo}:${module.code}`)
      const versionKey = `${id}:${set.version}`
      assert.ok(!usedVersions.has(versionKey), `单项历史归族冲突，需要人工映射：${set.code}/${module.code}`)
      usedVersions.add(versionKey)
      series.set(id, { id, examType: set.examType, kind: 'single', moduleCode: module.code, sequenceNo: set.sequenceNo })
      modules.push({ id: module.id, seriesId: id, version: set.version })
    }
  }
  const numbers = new Set<string>()
  const counters = new Map<string, number>()
  for (const item of series.values()) {
    assert.ok(Number.isSafeInteger(item.sequenceNo) && item.sequenceNo > 0)
    const pool = mockPaperNumberPool(item.examType, item.kind, item.moduleCode)
    const key = `${pool}:${item.sequenceNo}`
    assert.ok(!numbers.has(key), `编号冲突，需要人工映射：${key}`)
    numbers.add(key)
    counters.set(pool, Math.max(counters.get(pool) || 0, item.sequenceNo))
  }
  return { series: [...series.values()], sets, modules, counters: [...counters].map(([id, lastNumber]) => ({ id, lastNumber })) }
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
