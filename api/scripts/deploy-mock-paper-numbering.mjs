// 已备份的部署中分阶段升级旧编号；中间客户端回填成功后，部署器才能执行删列迁移。
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [environment, databaseName, repoApi, artifactApi, runtimeApi, stage] = process.argv.slice(2)
assert.ok(['test', 'prod'].includes(environment))
assert.equal(process.env.API_RUNTIME_ENV, environment)
assert.equal(new URL(process.env.DATABASE_URL).pathname.slice(1), databaseName)
assert.match(stage, /^\/tmp\/quiz-deploy-\d{8}[-_]\d{6}\/numbering$/)
const cli = path.join(runtimeApi, 'node_modules/.bin/prisma')
const finalSchema = path.join(repoApi, 'prisma/schema.prisma')

// CLI 只处理 Prisma 结构迁移；所有业务查询和回填使用项目客户端单例。
function command(executable, args, capture = false) {
  return execFileSync(executable, args, {
    cwd: runtimeApi, env: process.env, encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  })
}

const currentSchema = command(cli, ['db', 'pull', '--print', '--schema', finalSchema], true)
const currentSet = currentSchema.match(/model MockPaperSet \{([\s\S]*?)\n\}/i)?.[1]
assert.ok(currentSet, 'MockPaperSet missing')
if (!/^\s+sequenceNo\s+Int/m.test(currentSet)) {
  console.log('mock_numbering_stage=already_migrated')
  process.exit(0)
}

await mkdir(path.join(stage, 'prisma/migrations'), { recursive: true })
await writeFile(path.join(stage, 'package.json'), '{"type":"module"}')
await symlink(path.join(runtimeApi, 'node_modules'), path.join(stage, 'node_modules'), 'dir')
let intermediate = await readFile(finalSchema, 'utf8')
intermediate = intermediate.replace('model MockPaperSet {', 'model MockPaperSet {\n  code String @unique @db.VarChar(100)\n  sequenceNo Int\n  legacyCode String? @unique @db.VarChar(100)')
intermediate = intermediate.replace(/versionGroupId String\s+@db/, 'versionGroupId String? @db')
// 独立输出防止中间生成覆盖正在服务的运行客户端。
intermediate = intermediate.replace(/provider\s*=\s*"prisma-client-js"/, `provider = "prisma-client-js"\n  output = "${stage}/generated-client"`)
const middleSchema = path.join(stage, 'prisma/schema.prisma')
await writeFile(middleSchema, intermediate)
for (const entry of await readdir(path.join(repoApi, 'prisma/migrations'), { withFileTypes: true })) {
  if (entry.name === 'migration_lock.toml' || (entry.isDirectory() && entry.name <= '20260907150000_add_mock_paper_number_series')) {
    await cp(path.join(repoApi, 'prisma/migrations', entry.name), path.join(stage, 'prisma/migrations', entry.name), { recursive: true })
  }
}
// 暂停 API 写入覆盖快照、回填和删列全过程；失败时保持停止以避免旧代码写入新结构。
command('pm2', ['stop', 'quiz-api'])
command(cli, ['migrate', 'deploy', '--schema', middleSchema])
command(cli, ['generate', '--schema', middleSchema])
await mkdir(path.join(stage, 'services'), { recursive: true })
const singleton = await readFile(path.join(artifactApi, 'dist/services/prisma.js'), 'utf8')
await writeFile(path.join(stage, 'services/prisma.js'), singleton.replace("'@prisma/client'", "'../generated-client/index.js'"))
const { prisma } = await import(pathToFileURL(path.join(stage, 'services/prisma.js')).href)
const { buildPlan, canonical, protectedSets } = await import(pathToFileURL(path.join(artifactApi, 'dist/services/mockPaperNumberMigration.js')).href)
try {
  const snapshot = {
    sets: await prisma.mockPaperSet.findMany({ include: { modules: { include: { questions: true } } } }),
    records: await prisma.examRecord.findMany({ include: { answers: true } }),
  }
  await writeFile(path.join(stage, 'before.json'), JSON.stringify(snapshot), { mode: 0o600 })
  const plan = buildPlan(snapshot)
  await writeFile(path.join(stage, 'mapping.json'), JSON.stringify(plan, null, 2), { mode: 0o600 })
  console.log(JSON.stringify({ mock_numbering_preview: { sets: plan.sets.length, modules: plan.modules.length, series: plan.series.length, records: snapshot.records.length, counters: plan.counters } }))
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
    const after = await tx.mockPaperSet.findMany({ include: { modules: { include: { questions: true } } } })
    assert.deepEqual(protectedSets(after), protectedSets(snapshot.sets))
    assert.equal(after.filter(set => !set.versionGroupId).length, 0)
    assert.equal(await tx.mockPaperModule.count({ where: { sourceModuleId: null, seriesId: null } }), 0)
    assert.deepEqual(canonical(await tx.examRecord.findMany({ include: { answers: true } })), canonical(snapshot.records))
  }, { isolationLevel: 'Serializable', timeout: 120000 })
  console.log('mock_numbering_stage=backfilled_and_verified')
} finally {
  await prisma.$disconnect()
}
