// 本地展示剔除回归：封禁前后比较审计、学习与注册统计，验证解封恢复且原始记录不删除。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { signAccessToken } from '../src/services/jwt.js'
import { adminRouter } from '../src/routes/admin.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { ACCOUNT_STATUS } from '../src/constants/auth.js'
import { EXAM_RECORD_STATUS, PAPER_TYPE, USER_ROLE } from '../src/constants/domain.js'
import { OPERATION_AUDIT_MODULE, OPERATION_AUDIT_RESULT } from '../src/constants/operationAudit.js'

if (config.runtimeEnv !== 'local' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
  throw new Error('Banned user analytics regression requires the local development database')
}
const prefix = `visibility-${crypto.randomUUID()}`
const userIds: string[] = []
const paperIds: string[] = []
const visitIds: string[] = []
const period = { startAt: '2098-06-01T16:00:00.000Z', endAt: '2098-06-02T16:00:00.000Z' }
const currentAt = new Date('2098-06-02T01:00:00.000Z')
const previousAt = new Date('2098-06-01T01:00:00.000Z')
const app = express()
app.use(express.json())
app.use('/api/admin', adminRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing test port')
const base = `http://127.0.0.1:${address.port}/api/admin`
let token = ''

// 真实管理员接口同时覆盖权限与查询组合，所有输出仅用于断言。
async function request(endpoint: string, body?: unknown) {
  const response = await fetch(base + endpoint, {
    method: body ? 'PUT' : 'GET',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  assert.equal(response.status, 200)
  return ((await response.json()) as any).data
}

// 同一请求编号隔离测试审计，历史无账号日志也参与可见性回归。
async function log(actorUserId: string | null, action: string, occurredAt: Date, role: string = USER_ROLE.STUDENT) {
  return prisma.operationLog.create({ data: {
    requestId: prefix, actorUserId, actorNameSnapshot: actorUserId || '历史账号', actorEmailSnapshot: '',
    actorRoleSnapshot: role, module: OPERATION_AUDIT_MODULE.EXAM, action, summary: '展示口径测试',
    occurredAt, result: OPERATION_AUDIT_RESULT.SUCCESS, method: 'GET', path: '/fixture', statusCode: 200,
  } })
}

try {
  for (let i = 0; i < 5; i++) {
    const user = await prisma.user.create({ data: {
      username: `${prefix}-${i}`, email: `${prefix}-${i}@example.test`, password: 'unused',
      role: i === 0 ? USER_ROLE.ADMIN : USER_ROLE.STUDENT,
      createdAt: i < 3 ? currentAt : previousAt,
    } })
    userIds.push(user.id)
  }
  const admin = await prisma.user.findUniqueOrThrow({ where: { id: userIds[0]! } })
  const session = await prisma.authSession.create({ data: {
    userId: admin.id, refreshTokenHash: crypto.randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + 3600000),
  } })
  token = signAccessToken(admin, session.id)
  for (const paperType of [PAPER_TYPE.REAL_PAPER, PAPER_TYPE.AI_PAPER, PAPER_TYPE.MOCK_PAPER]) {
    const paper = await prisma.paper.create({ data: { id: crypto.randomUUID(), title: prefix, year: 2098, duration: 60, paperType } })
    paperIds.push(paper.id)
  }
  let bannedLogId = ''
  for (let i = 1; i < 5; i++) {
    const userId = userIds[i]!
    const occurredAt = i < 3 ? currentAt : previousAt
    for (const action of ['exam.submit', 'diagnostic_report.view', 'mistake_notebook.view']) {
      const record = await log(userId, action, occurredAt)
      if (i === 2) bannedLogId = record.id
    }
    for (const paperId of paperIds) await prisma.examRecord.create({ data: {
      userId, paperId, startedAt: occurredAt, submittedAt: occurredAt, status: EXAM_RECORD_STATUS.SUBMITTED,
    } })
  }
  await log(null, 'exam.submit', currentAt)
  await log(admin.id, 'admin.user.ban', currentAt, USER_ROLE.ADMIN)
  for (const visitorType of ['student', 'anonymous']) {
    const visit = await prisma.websiteVisitDaily.create({ data: {
      businessDate: new Date('2098-06-02T00:00:00.000Z'), ipHash: crypto.randomBytes(32).toString('hex'), visitorType,
    } })
    visitIds.push(visit.id)
  }
  const query = new URLSearchParams(period).toString()
  const allBefore = await request(`/operation-logs?keyword=${prefix}`)
  const behaviorBefore = await request(`/behavior-analytics?${query}`)
  const trafficBefore = await request(`/traffic-analytics?${query}`)
  assert.equal(allBefore.pagination.total, 14)
  assert.equal(behaviorBefore.overview.operationCount, 7)
  assert.equal(behaviorBefore.productUsage.overview.completedActivityCount, 6)
  assert.equal(trafficBefore.overview.registrationCount, 2)

  const bannedIds = [userIds[2]!, userIds[4]!]
  await request('/users/account-status', { userIds: bannedIds, status: ACCOUNT_STATUS.BANNED, reason: '回归展示口径' })
  const list = await request(`/operation-logs?keyword=${prefix}&page=99&pageSize=2`)
  assert.equal(list.pagination.total, 8)
  assert.equal(list.pagination.page, 4)
  assert.ok(list.list.every((item: any) => !bannedIds.includes(item.actorUserId)))
  const visible = await request(`/operation-logs?keyword=${prefix}`)
  assert.ok(visible.list.some((item: any) => item.actorUserId === null))
  assert.ok(visible.list.some((item: any) => item.actorUserId === admin.id))
  const empty = await request(`/operation-logs?keyword=${userIds[2]}&role=student`)
  assert.equal(empty.pagination.total, 0)
  assert.equal((await request(`/operation-logs?keyword=${prefix}&result=failure`)).pagination.total, 0)
  assert.equal((await request(`/operation-logs?keyword=${prefix}&result=blocked`)).pagination.total, 0)
  assert.equal((await request(`/operation-logs/${bannedLogId}`)).id, bannedLogId)
  console.log('PASS filtered log count/pagination/search, historical null actors, admin audit and retained detail')

  const behavior = await request(`/behavior-analytics?${query}`)
  assert.equal(behavior.overview.activeUsers, 1)
  assert.equal(behavior.overview.operationCount, 4)
  assert.equal(behavior.overview.operationCountChangeRate, 0.3333)
  assert.equal(behavior.dataQuality.unattributedOperationCount, 1)
  assert.equal(behavior.trend.reduce((sum: number, item: any) => sum + item.operationCount, 0), 4)
  assert.equal(behavior.actions.reduce((sum: number, item: any) => sum + item.operationCount, 0), 4)
  assert.equal(behavior.productUsage.overview.completedActivityCount, 3)
  assert.equal(behavior.productUsage.overview.completedActivityChangeRate, 0)
  assert.equal(behavior.productUsage.overview.reportViewCount, 1)
  assert.equal(behavior.productUsage.overview.mistakeNotebookViewCount, 1)
  assert.ok(behavior.productUsage.modules.every((item: any) => item.completionCount === 1))
  const traffic = await request(`/traffic-analytics?${query}`)
  assert.equal(traffic.overview.registrationCount, 1)
  assert.equal(traffic.overview.registrationCountChangeRate, 0)
  assert.equal(traffic.locationDistribution.totalRegistrationCount, 1)
  assert.equal(traffic.trend.reduce((sum: number, item: any) => sum + item.registrationCount, 0), 1)
  assert.equal(traffic.overview.visitCount, trafficBefore.overview.visitCount)
  assert.equal(await prisma.operationLog.count({ where: { requestId: prefix } }), 14)
  assert.equal(await prisma.examRecord.count({ where: { userId: { in: userIds } } }), 12)
  console.log('PASS current/previous analytics, product/report/notebook, registration regions, visits preserved and no source deletion')

  await request('/users/account-status', { userIds: bannedIds, status: ACCOUNT_STATUS.ACTIVE, reason: '回归解封恢复' })
  assert.equal((await request(`/operation-logs?keyword=${prefix}`)).pagination.total, 14)
  const restored = await request(`/behavior-analytics?${query}`)
  assert.deepEqual(restored.overview, behaviorBefore.overview)
  assert.deepEqual(restored.productUsage.overview, behaviorBefore.productUsage.overview)
  assert.deepEqual((await request(`/traffic-analytics?${query}`)).overview, trafficBefore.overview)
  console.log('PASS unban restores historical counts without backfill')
} finally {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  await prisma.operationLog.deleteMany({ where: { OR: [{ requestId: prefix }, { actorUserId: { in: userIds } }] } })
  await prisma.examRecord.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.paper.deleteMany({ where: { id: { in: paperIds } } })
  await prisma.websiteVisitDaily.deleteMany({ where: { id: { in: visitIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.$disconnect()
}
