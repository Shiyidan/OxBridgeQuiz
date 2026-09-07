// 开发库旧模考编号清理：先保存旧值和答卷快照，只清空模考运行 Paper 的 code。
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { config } from 'dotenv'
import { prisma } from '../src/services/prisma.js'
import { MOCK_PAPER_TYPES } from '../src/constants/domain.js'

config({ path: process.env.API_ENV_FILE || '.env.mysql.local', override: true })

// 清理限定回环开发或测试库，不允许修改远程或生产数据库。
async function main(): Promise<void> {
  const database = new URL(process.env.DATABASE_URL || '')
  assert.equal(database.protocol, 'mysql:')
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(database.hostname))
  assert.match(database.pathname, /dev|test/i)
  assert.doesNotMatch(database.pathname, /prod/i)
  assert.ok(!['prod', 'production'].includes((process.env.API_RUNTIME_ENV || '').toLowerCase()))
  assert.notEqual(process.env.NODE_ENV, 'production')
  const args = process.argv.slice(2)
  assert.ok(args.every((arg) => ['--dry-run', '--apply'].includes(arg)))
  assert.ok(!(args.includes('--apply') && args.includes('--dry-run')))
  const apply = args.includes('--apply')
  const papers = await prisma.paper.findMany({
    where: { paperType: { in: [...MOCK_PAPER_TYPES] } }, orderBy: { id: 'asc' },
  })
  const sets = await prisma.mockPaperSet.findMany({ orderBy: { id: 'asc' } })
  const recordQuery = {
    where: { paperId: { in: papers.map((paper) => paper.id) } },
    orderBy: { id: 'asc' as const },
    include: { answers: { orderBy: { id: 'asc' as const } } },
  }
  const records = await prisma.examRecord.findMany(recordQuery)
  const affected = papers.filter((paper) => paper.code !== null)
  let backup: string | null = null
  if (apply) {
    await mkdir('.tmp', { recursive: true })
    backup = `.tmp/mock-code-cleanup-${Date.now()}.json`
    await writeFile(backup, JSON.stringify({ sets, papers, records }, null, 2), 'utf8')
    await prisma.paper.updateMany({
      where: { id: { in: affected.map((paper) => paper.id) }, paperType: { in: [...MOCK_PAPER_TYPES] } },
      data: { code: null },
    })
    assert.equal(await prisma.paper.count({ where: { paperType: { in: [...MOCK_PAPER_TYPES] }, code: { not: null } } }), 0)
    assert.deepEqual(await prisma.examRecord.findMany(recordQuery), records, '答卷和答案不得因编号清理发生变化')
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', affectedPaperCodes: affected.length, setVersions: sets.length, preservedExamRecords: records.length, backup }, null, 2))
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
