// 口语推广本地集成回归：真实认证、持久化、人数去重、排序分页和封禁恢复。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { trafficRouter } from '../src/routes/traffic.js'
import { adminRouter } from '../src/routes/admin.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { signAccessToken } from '../src/services/jwt.js'
import { USER_ROLE } from '../src/constants/domain.js'
import { ACCOUNT_STATUS } from '../src/constants/auth.js'
import { ORAL_PROMOTION_OPEN_ACTION } from '../src/constants/oralPromotion.js'

if (config.runtimeEnv !== 'local' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
  throw new Error('Oral promotion regression requires the local development database')
}
const userIds: string[] = []
const prefix = `oral-${crypto.randomUUID()}`
const app = express()
app.use(express.json())
app.use('/api/traffic', trafficRouter)
app.use('/api/admin', adminRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing test port')
const base = `http://127.0.0.1:${address.port}/api`

// 测试只创建独立前缀账号和会话，身份仍由真实认证中间件校验。
async function createActor(role: string) {
  const suffix = userIds.length
  const user = await prisma.user.create({ data: {
    username: `${prefix}-${suffix}`, email: `${prefix}-${suffix}@example.invalid`, password: 'unused-test-hash', role,
  } })
  userIds.push(user.id)
  const session = await prisma.authSession.create({ data: {
    userId: user.id, refreshTokenHash: crypto.randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + 3600000), ipAddress: '127.0.0.1',
  } })
  return { user, token: signAccessToken(user, session.id) }
}

// 返回状态与标准响应供断言，令牌只用于请求头，不写入控制台。
async function request(path: string, token?: string, body?: unknown) {
  const response = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, body: await response.json() as any }
}

try {
  const admin = await createActor(USER_ROLE.ADMIN)
  const first = await createActor(USER_ROLE.STUDENT)
  const second = await createActor(USER_ROLE.STUDENT)
  const event = { event: 'open', source: 'charm', page: 'home' }
  assert.equal((await request('/traffic/promotion-events', undefined, event)).body.data.recorded, false)
  assert.equal((await request('/traffic/promotion-events', admin.token, event)).body.data.recorded, false)
  for (const kind of ['impression', 'consult']) {
    assert.equal((await request('/traffic/promotion-events', first.token, { ...event, event: kind })).body.data.recorded, false)
  }
  assert.equal((await request('/traffic/promotion-events', first.token, { ...event, userId: second.user.id })).status, 400)
  for (const source of ['charm', 'navigation', 'charm']) {
    assert.equal((await request('/traffic/promotion-events', first.token, { ...event, source })).body.data.recorded, true)
  }
  assert.equal((await request('/traffic/promotion-events', second.token, event)).body.data.recorded, true)
  assert.equal(await prisma.operationLog.count({ where: { actorUserId: { in: userIds } } }), 4)
  // 把本轮创建记录移到独立历史日期，避免本地已有点击影响期望值。
  await prisma.operationLog.updateMany({ where: { actorUserId: { in: userIds } }, data: { occurredAt: new Date('2001-02-03T04:00:00Z') } })
  const query = '/admin/oral-promotion-analytics?startAt=2001-02-02T16:00:00Z&endAt=2001-02-03T16:00:00Z&pageSize=1'
  assert.equal((await request(query)).status, 401)
  assert.equal((await request(query, first.token)).status, 403)
  const result = (await request(query, admin.token)).body.data
  assert.deepEqual(result.overview, { clickCount: 4, userCount: 2 })
  assert.equal(result.list[0].userId, first.user.id)
  assert.equal(result.list[0].clickCount, 3)
  assert.equal(result.pagination.total, 2)
  const last = (await request(`${query}&page=99`, admin.token)).body.data
  assert.equal(last.pagination.page, 2)
  assert.equal(last.list[0].userId, second.user.id)
  await prisma.user.update({ where: { id: first.user.id }, data: { accountStatus: ACCOUNT_STATUS.BANNED } })
  const excluded = (await request(query, admin.token)).body.data
  assert.deepEqual(excluded.overview, { clickCount: 1, userCount: 1 })
  assert.equal(excluded.list[0].userId, second.user.id)
  assert.equal((await request('/traffic/promotion-events', first.token, event)).status, 403)
  await prisma.user.update({ where: { id: first.user.id }, data: { accountStatus: ACCOUNT_STATUS.ACTIVE } })
  assert.deepEqual((await request(query, admin.token)).body.data.overview, result.overview)
  const empty = (await request('/admin/oral-promotion-analytics?startAt=2001-02-04T00:00:00Z&endAt=2001-02-05T00:00:00Z', admin.token)).body.data
  assert.deepEqual(empty.overview, { clickCount: 0, userCount: 0 })
  assert.deepEqual(empty.list, [])
  for (const queryString of ['startAt=invalid', 'startAt=2001-01-01', 'startAt=2001-01-02&endAt=2001-01-01', 'startAt=2001-01-01&endAt=2002-01-01']) {
    assert.equal((await request(`/admin/oral-promotion-analytics?${queryString}`, admin.token)).status, 422)
  }
  assert.equal(await prisma.operationLog.count({ where: { actorUserId: { in: userIds }, action: ORAL_PROMOTION_OPEN_ACTION } }), 4)
  console.log('PASS open-only persistence, authenticated attribution, guest/admin exclusion, duplicate-user count, descending pagination, banned exclusion/restoration, empty results and protected/validated queries')
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  await prisma.operationLog.deleteMany({ where: { actorUserId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.$disconnect()
}
