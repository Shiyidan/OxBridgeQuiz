// 模考旧编号清理的只读回归：核对学生记录、结果页与后台用户详情的编号一致且不再返回旧码。
import assert from 'node:assert/strict'
import { config } from 'dotenv'
import { prisma } from '../src/services/prisma.js'
import { getAdminUserDetail } from '../src/services/adminUserDetail.js'
import { mockExamRouter } from '../src/routes/mockExams.js'
import { examResultRouter } from '../src/routes/exam-results.js'
import { MOCK_PAPER_TYPES } from '../src/constants/domain.js'

config({ path: process.env.API_ENV_FILE || '.env.mysql.local', override: true })
const reads = new Set(['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy'])
prisma.$use(async (params, next) => {
  assert.ok(reads.has(params.action), `禁止写入：${params.model}.${params.action}`)
  const result = await next(params)
  // 该测试仅核对答卷编号，隔离无关的 IP 属地外部查询，不改数据库中的登录信息。
  if (params.model === 'User' && params.action === 'findUnique' && result?.authSessions) {
    return { ...result, authSessions: [], operationLogs: [] }
  }
  return result
})

// 调用既有 GET 处理器并使用现有用户身份，不创建会话，不执行写接口。
async function get(router: any, path: string, userId: string, params = {}, query = {}): Promise<any> {
  const route = router.stack.find((layer: any) => layer.route?.path === path && layer.route.methods.get)?.route
  assert.ok(route, `GET ${path}`)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`GET ${path} timeout`)), 20_000)
    let status = 200
    const res = {
      status(value: number) { status = value; return res },
      json(packet: any) { clearTimeout(timer); try { assert.equal(status, 200, packet.errMsg); assert.equal(packet.success, true, packet.errMsg); resolve(packet.data) } catch (error) { reject(error) } },
    }
    Promise.resolve(route.stack.at(-1).handle({ user: { userId }, params, query }, res, reject)).catch((error) => { clearTimeout(timer); reject(error) })
  })
}

// 孤立旧答卷允许空编号，禁止从已清空的旧码或标题编造编号；非孤立记录须跨页面一致。
async function main(): Promise<void> {
  const database = new URL(process.env.DATABASE_URL || '')
  assert.equal(database.protocol, 'mysql:')
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(database.hostname))
  assert.match(database.pathname, /dev|test/i)
  assert.doesNotMatch(database.pathname, /prod/i)
  assert.ok(!['prod', 'production'].includes((process.env.API_RUNTIME_ENV || '').toLowerCase()))
  assert.notEqual(process.env.NODE_ENV, 'production')
  assert.equal(await prisma.paper.count({ where: { paperType: { in: [...MOCK_PAPER_TYPES] }, code: { not: null } } }), 0)
  const records = await prisma.examRecord.findMany({ where: { paper: { paperType: { in: [...MOCK_PAPER_TYPES] } } }, select: { id: true, userId: true } })
  const users = [...new Set(records.map((record) => record.userId))]
  let compared = 0
  for (const userId of users) {
    const admin = await getAdminUserDetail(userId, { module: 'mockExam', page: 1, pageSize: 100 })
    assert.ok(admin)
    const attempts: Array<{ id: string; status: string; paper: { sequenceNo?: string | null; code?: string | null } }> = admin.attempts
    for (const attempt of attempts) {
      assert.ok(!('code' in attempt.paper))
      assert.ok('sequenceNo' in attempt.paper)
      if (attempt.status !== 'submitted') continue
      const result = await get(examResultRouter, '/:id/result', userId, { id: attempt.id })
      assert.ok(!('code' in result.examRecord.paper))
      assert.equal(attempt.paper.sequenceNo, result.examRecord.paper.sequenceNo)
      if (attempt.paper.sequenceNo !== null) assert.match(attempt.paper.sequenceNo!, /^(ESAT|TMUA)-MOCK(?:-[A-Z]\d?)?-\d+-V\d+$/)
      compared += 1
    }
    for (const examType of ['ESAT', 'TMUA']) {
      const student = await get(mockExamRouter, '/records', userId, {}, { examType, pageSize: '100' })
      for (const record of student.list) {
        assert.ok(!('paperCode' in record))
        const attempt = attempts.find((item) => item.id === record.examRecordId)
        if (attempt) assert.equal(attempt.paper.sequenceNo, record.sequenceNo)
      }
    }
  }
  console.log(JSON.stringify({ users: users.length, existingMockRecords: records.length, comparedAdminResults: compared, writes: 0 }))
}

main().catch((error) => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
