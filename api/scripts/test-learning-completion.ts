// 点亮回归：使用本地数据库核验持久化、重复请求、账号考试隔离、取消和日志事务一致性。
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { Request } from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { getLearningCompletions, setLearningCompletion, LearningCompletionError } from '../src/services/learningCompletion.js'
import { EXAM_TYPE, USER_ROLE, MEMBERSHIP_STATUS } from '../src/constants/domain.js'
import { ANNUAL_PLAN } from '../src/constants/annualMembership.js'

assert.equal(config.runtimeEnv, 'local')
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(process.env.DATABASE_URL!).hostname))
const ids: string[] = []
const run = randomUUID()

// 身份快照只模拟认证中间件已确认的用户，持久化与审计使用真实 Prisma 事务。
function request(user: { id: string; username: string; email: string; role: string }): Request {
  return {
    user: { userId: user.id, username: user.username, email: user.email, role: user.role },
    requestId: run, originalUrl: '/api/learning-completions/ESAT/110101',
    ip: '127.0.0.1', get: () => 'learning-completion-regression',
  } as unknown as Request
}

try {
  const nodes = await prisma.syllabusNode.findMany({ where: { examType: EXAM_TYPE.ESAT, code: { in: ['110100', '110101', '110102', '110201'] } } })
  assert.equal(nodes.length, 4, '本地需有 ESAT 单位与数考纲')
  const students = []
  for (let i = 0; i < 2; i++) {
    const user = await prisma.user.create({ data: {
      username: 'light-test-' + run + '-' + i,
      email: 'light-test-' + run + '-' + i + '@example.invalid',
      password: 'unusable-test-password', role: USER_ROLE.STUDENT,
    } })
    ids.push(user.id)
    students.push(user)
  }
  const first = request(students[0])
  const other = request(students[1])
  assert.equal((await getLearningCompletions(ids[0], EXAM_TYPE.ESAT)).length, 0)
  await setLearningCompletion(first, EXAM_TYPE.ESAT, '110101', true)
  await Promise.all([
    setLearningCompletion(first, EXAM_TYPE.ESAT, '110101', true),
    setLearningCompletion(first, EXAM_TYPE.ESAT, '110101', true),
  ])
  assert.equal(await prisma.operationLog.count({ where: { actorUserId: ids[0], action: 'learning.light_up' } }), 1)
  await setLearningCompletion(first, EXAM_TYPE.ESAT, '110100', true)
  assert.deepEqual((await getLearningCompletions(ids[0], EXAM_TYPE.ESAT)).map(x => x.code), ['110101', '110102'])
  assert.equal((await getLearningCompletions(ids[1], EXAM_TYPE.ESAT)).length, 0)
  assert.equal((await getLearningCompletions(ids[0], EXAM_TYPE.TMUA)).length, 0)
  await setLearningCompletion(other, EXAM_TYPE.ESAT, '110100', false)
  assert.equal((await getLearningCompletions(ids[0], EXAM_TYPE.ESAT)).length, 2)
  await setLearningCompletion(first, EXAM_TYPE.ESAT, '110100', false)
  assert.equal((await getLearningCompletions(ids[0], EXAM_TYPE.ESAT)).length, 0)
  assert.equal(await prisma.operationLog.count({ where: { actorUserId: ids[0] } }), 2)
  await setLearningCompletion(first, EXAM_TYPE.ESAT, '110101', true)
  assert.equal(await prisma.operationLog.count({ where: { actorUserId: ids[0] } }), 3)
  await assert.rejects(setLearningCompletion(first, EXAM_TYPE.ESAT, '110201', true), (e: unknown) => e instanceof LearningCompletionError && e.status === 403)
  await assert.rejects(setLearningCompletion(first, EXAM_TYPE.ESAT, '999999', true), (e: unknown) => e instanceof LearningCompletionError && e.status === 404)
  await assert.rejects(setLearningCompletion(first, EXAM_TYPE.ESAT, '110000', true), (e: unknown) => e instanceof LearningCompletionError && e.status === 404)
  // 验证审计失败时进度也回滚，不出现“点亮成功但无操作记录”。
  const invalid = request(students[1])
  invalid.user!.username = undefined as unknown as string
  await assert.rejects(setLearningCompletion(invalid, EXAM_TYPE.ESAT, '110101', true))
  assert.equal((await getLearningCompletions(ids[1], EXAM_TYPE.ESAT)).length, 0)
  await prisma.userMembership.create({ data: {
    userId: ids[1], examType: EXAM_TYPE.ESAT, plan: ANNUAL_PLAN.LEARNING, status: MEMBERSHIP_STATUS.ACTIVE,
    startsAt: new Date(Date.now() - 60_000), endsAt: new Date(Date.now() + 86_400_000),
  } })
  await setLearningCompletion(other, EXAM_TYPE.ESAT, '110201', true)
  assert.deepEqual((await getLearningCompletions(ids[1], EXAM_TYPE.ESAT)).map(x => x.code), ['110201'])
  // 两个账号点亮同一知识点后，任一账号取消都不得删除另一账号的记录。
  await setLearningCompletion(other, EXAM_TYPE.ESAT, '110101', true)
  const auditBeforeCancel = await prisma.operationLog.findMany({
    where: { actorUserId: { in: ids } }, orderBy: { id: 'asc' },
  })
  assert.ok(auditBeforeCancel.every(log => log.action === 'learning.light_up'))
  await setLearningCompletion(first, EXAM_TYPE.ESAT, '110101', false)
  assert.deepEqual((await getLearningCompletions(ids[0], EXAM_TYPE.ESAT)).map(x => x.code), [])
  assert.deepEqual((await getLearningCompletions(ids[1], EXAM_TYPE.ESAT)).map(x => x.code), ['110101', '110201'])
  await setLearningCompletion(other, EXAM_TYPE.ESAT, '110100', false)
  await setLearningCompletion(other, EXAM_TYPE.ESAT, '110201', false)
  assert.equal((await getLearningCompletions(ids[1], EXAM_TYPE.ESAT)).length, 0)
  assert.deepEqual(await prisma.operationLog.findMany({
    where: { actorUserId: { in: ids } }, orderBy: { id: 'asc' },
  }), auditBeforeCancel, '读取、单节点取消和整章取消均不得新增或修改日志')
  console.log('PASS 点亮持久化、整章汇总、重复并发幂等、账号/考试隔离、取消不记日志、重新点亮、会员边界及日志事务回滚')
} finally {
  // 仅清理本次测试创建的账号和其日志，用户级联关系清理对应测试状态及会员。
  await prisma.operationLog.deleteMany({ where: { actorUserId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
  await prisma.$disconnect()
}
