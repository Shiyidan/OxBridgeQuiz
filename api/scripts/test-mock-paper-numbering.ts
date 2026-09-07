// 模考分号的本地数据库回归：验证考试与学科分池、删除不回收、事务回滚和并发唯一。
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { config } from 'dotenv'

import { ESAT_MODULES, EXAM_TYPE, TMUA_PAPERS } from '../src/constants/domain.js'
import {
  createMockPaperSeries,
  MOCK_PAPER_SERIES_KIND,
  mockPaperNumberPool,
  withMockPaperNumberTransaction,
} from '../src/services/mockPaperNumbering.js'
import { prisma } from '../src/services/prisma.js'

config({ path: process.env.API_ENV_FILE || '.env' })

const isolatedExamType = `number-test-${randomUUID().slice(0, 12)}`
const isolatedPoolId = mockPaperNumberPool(isolatedExamType, MOCK_PAPER_SERIES_KIND.SINGLE, 'maths1')

// 真实考试池只在回滚事务中测试，并发试验仅使用随机隔离池，禁止连接服务器数据库。
function assertLocalDatabase(): void {
  assert.ok(!['prod', 'production'].includes((process.env.API_RUNTIME_ENV || '').toLowerCase()),
    '禁止在生产运行环境执行模考分号回归')
  assert.notEqual(process.env.NODE_ENV, 'production', '禁止在生产 Node 环境执行模考分号回归')
  const database = new URL(process.env.DATABASE_URL || '')
  assert.equal(database.protocol, 'mysql:', '回归只能使用本地 MySQL')
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(database.hostname),
    '回归拒绝连接非本机数据库')
  assert.match(database.pathname, /(?:dev|test)/i, '数据库名称必须标识为 dev 或 test')
  assert.doesNotMatch(database.pathname, /prod/i, '禁止连接生产数据库')
}

// 正式考试池使用真实枚举，测试结束整体回滚，避免消耗开发环境下一份试卷的号码。
async function testIndependentPoolsAndRollback(): Promise<void> {
  const scopes = [
    ...ESAT_MODULES.map((moduleCode) => ({ examType: EXAM_TYPE.ESAT, kind: MOCK_PAPER_SERIES_KIND.SINGLE, moduleCode })),
    ...TMUA_PAPERS.map((moduleCode) => ({ examType: EXAM_TYPE.TMUA, kind: MOCK_PAPER_SERIES_KIND.SINGLE, moduleCode })),
    { examType: EXAM_TYPE.ESAT, kind: MOCK_PAPER_SERIES_KIND.FULL, moduleCode: '' },
    { examType: EXAM_TYPE.TMUA, kind: MOCK_PAPER_SERIES_KIND.FULL, moduleCode: '' },
  ]
  const poolIds = scopes.map((scope) => mockPaperNumberPool(scope.examType, scope.kind, scope.moduleCode))
  const countersBefore = await prisma.mockPaperNumberCounter.findMany({
    where: { id: { in: poolIds } }, orderBy: { id: 'asc' },
  })
  const seriesBefore = await prisma.mockPaperSeries.findMany({
    where: { examType: { in: [EXAM_TYPE.ESAT, EXAM_TYPE.TMUA] } }, orderBy: { id: 'asc' },
  })
  const rollback = new Error('Rollback numbering fixtures after successful assertions')
  await assert.rejects(withMockPaperNumberTransaction(async (tx) => {
    const startingNumbers = new Map(countersBefore.map((counter) => [counter.id, counter.lastNumber]))
    const allocated = []
    for (const scope of scopes) {
      const series = await createMockPaperSeries(tx, scope.examType, scope.kind, scope.moduleCode)
      const poolId = mockPaperNumberPool(scope.examType, scope.kind, scope.moduleCode)
      assert.equal(series.sequenceNo, (startingNumbers.get(poolId) || 0) + 1,
        `${poolId} must advance only its own counter`)
      assert.equal(series.examType, scope.examType)
      assert.equal(series.kind, scope.kind)
      assert.equal(series.moduleCode, scope.moduleCode)
      allocated.push(series)
    }
    const firstMaths1 = allocated[0]
    await tx.mockPaperSeries.delete({ where: { id: firstMaths1.id } })
    const secondMaths1 = await createMockPaperSeries(
      tx, EXAM_TYPE.ESAT, MOCK_PAPER_SERIES_KIND.SINGLE, 'maths1',
    )
    assert.equal(secondMaths1.sequenceNo, firstMaths1.sequenceNo + 1,
      '删除试卷系列也不能回收已经使用的单项编号')
    for (const scope of scopes.slice(1)) {
      const poolId = mockPaperNumberPool(scope.examType, scope.kind, scope.moduleCode)
      const counter = await tx.mockPaperNumberCounter.findUniqueOrThrow({ where: { id: poolId } })
      assert.equal(counter.lastNumber, (startingNumbers.get(poolId) || 0) + 1,
        '数学1再次分号不能推进其他学科或完整卷的号码')
    }
    await assert.rejects(
      () => createMockPaperSeries(tx, EXAM_TYPE.ESAT, MOCK_PAPER_SERIES_KIND.SINGLE),
      /MOCK_PAPER_NUMBER_SCOPE_INVALID/,
    )
    await assert.rejects(
      () => createMockPaperSeries(tx, EXAM_TYPE.ESAT, MOCK_PAPER_SERIES_KIND.FULL, 'maths1'),
      /MOCK_PAPER_NUMBER_SCOPE_INVALID/,
    )
    throw rollback
  }), (error) => error === rollback)
  assert.deepEqual(await prisma.mockPaperNumberCounter.findMany({
    where: { id: { in: poolIds } }, orderBy: { id: 'asc' },
  }), countersBefore)
  assert.deepEqual(await prisma.mockPaperSeries.findMany({
    where: { examType: { in: [EXAM_TYPE.ESAT, EXAM_TYPE.TMUA] } }, orderBy: { id: 'asc' },
  }), seriesBefore)
}

// 并发路径走真实 Serializable 重试包装，以隔离池覆盖首次建计数器和已有计数器的竞争。
async function testConcurrentNumberAllocation(): Promise<void> {
  for (const round of [0, 1]) {
    const results = await Promise.allSettled(Array.from({ length: 4 }, () => (
      withMockPaperNumberTransaction((tx) => createMockPaperSeries(
        tx, isolatedExamType, MOCK_PAPER_SERIES_KIND.SINGLE, 'maths1',
      ))
    )))
    const failures = results.filter((result) => result.status === 'rejected')
    assert.equal(failures.length, 0, `并发分号失败：${failures.map((failure) => String(failure.reason)).join('; ')}`)
    const sequences = results.flatMap((result) => result.status === 'fulfilled' ? [result.value.sequenceNo] : [])
    assert.deepEqual(sequences.sort((left, right) => left - right),
      Array.from({ length: 4 }, (_, index) => round * 4 + index + 1))
  }
  const counter = await prisma.mockPaperNumberCounter.findUniqueOrThrow({ where: { id: isolatedPoolId } })
  assert.equal(counter.lastNumber, 8)
  assert.equal(await prisma.mockPaperSeries.count({ where: { examType: isolatedExamType } }), 8)
}

// 隔离池名称只属于本次执行，删除其系列与计数器不会改变真实考试下一次分号。
async function cleanup(): Promise<void> {
  await prisma.mockPaperSeries.deleteMany({ where: { examType: isolatedExamType } })
  await prisma.mockPaperNumberCounter.deleteMany({ where: { id: isolatedPoolId } })
  assert.equal(await prisma.mockPaperSeries.count({ where: { examType: isolatedExamType } }), 0)
  assert.equal(await prisma.mockPaperNumberCounter.count({ where: { id: isolatedPoolId } }), 0)
}

assertLocalDatabase()
try {
  await testIndependentPoolsAndRollback()
  await testConcurrentNumberAllocation()
  console.log('Mock paper numbering tests passed (independent pools, non-reuse, rollback, concurrent allocation).')
} finally {
  try {
    await cleanup()
  } finally {
    await prisma.$disconnect()
  }
}
