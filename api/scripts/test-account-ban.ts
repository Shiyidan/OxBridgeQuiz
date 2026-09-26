// 本地账号封禁回归：验证批量原子性、跨设备拦截、登录和续期、解封及审计保留。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { authRouter } from '../src/routes/auth.js'
import { adminRouter } from '../src/routes/admin.js'
import { requireAuth, optionalAuth } from '../src/middleware/auth.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { requestContextMiddleware } from '../src/utils/requestContext.js'
import { LEGAL_DOCUMENT_VERSIONS } from '../src/constants/legal.js'
import { ACCOUNT_STATUS, AUTH_ERROR } from '../src/constants/auth.js'
import { USER_ROLE } from '../src/constants/domain.js'

const databaseHost = new URL(process.env.DATABASE_URL!).hostname
if (config.runtimeEnv !== 'local' || !['localhost', '127.0.0.1'].includes(databaseHost)) {
  throw new Error('Account ban regression requires the local development database')
}
const app = express()
app.use(express.json(), cookieParser(), requestContextMiddleware)
app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.get('/required', requireAuth, (_req, res) => res.json({ success: true, data: {} }))
app.get('/optional', optionalAuth, (_req, res) => res.json({ success: true, data: {} }))
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing test port')
const baseUrl = `http://127.0.0.1:${address.port}`
const fixtureIds: string[] = []
const password = 'AccountBanTest123!'
const fixturePrefix = `ban${crypto.randomBytes(5).toString('hex')}`

// 请求通过真实路由和中间件，保留响应头以检查刷新 Cookie 清理行为。
async function request(
  path: string,
  options: { method?: string; body?: unknown; token?: string; cookie?: string } = {},
) {
  const response = await fetch(baseUrl + path, {
    method: options.method || 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  return {
    status: response.status,
    body: (await response.json()) as any,
    cookie: response.headers.get('set-cookie') || '',
  }
}

// 每次登录产生独立设备会话，测试封禁是否同时撤销两端登录。
async function login(username: string, attemptedPassword = password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: {
      username,
      password: attemptedPassword,
      legalVersions: {
        userAgreement: LEGAL_DOCUMENT_VERSIONS.userAgreement,
        privacyPolicy: LEGAL_DOCUMENT_VERSIONS.privacyPolicy,
      },
    },
  })
}

try {
  const hash = await bcrypt.hash(password, 4)
  for (const role of [USER_ROLE.ADMIN, USER_ROLE.STUDENT, USER_ROLE.STUDENT]) {
    const username = `${fixturePrefix}${fixtureIds.length}`
    const user = await prisma.user.create({
      data: { username, email: `${username}@example.test`, password: hash, role },
    })
    fixtureIds.push(user.id)
  }
  const [admin, first, second] = await Promise.all(
    fixtureIds.map((id) => prisma.user.findUniqueOrThrow({ where: { id } })),
  )
  const adminLogin = await login(admin!.username)
  assert.equal(adminLogin.status, 200)
  const token = adminLogin.body.data.accessToken
  const deviceA = await login(first!.username)
  const deviceB = await login(first!.username)
  assert.equal(deviceA.status, 200)
  assert.equal(deviceB.status, 200)
  const firstToken = deviceA.body.data.accessToken
  const cookie = deviceA.cookie.split(';')[0]
  const change = (userIds: string[], status: string, reason = '回归测试内部原因') =>
    request('/api/admin/users/account-status', {
      method: 'PUT',
      token,
      body: { userIds, status, reason },
    })
  assert.equal((await request('/required', { token: firstToken })).status, 200)
  assert.equal(
    (
      await request('/api/admin/users/account-status', {
        method: 'PUT',
        token: firstToken,
        body: { userIds: [second!.id], status: ACCOUNT_STATUS.BANNED, reason: '越权测试' },
      })
    ).status,
    403,
  )
  assert.equal((await change([first!.id], ACCOUNT_STATUS.BANNED, ' ')).status, 422)
  assert.equal((await change([first!.id, admin!.id], ACCOUNT_STATUS.BANNED)).status, 403)
  assert.equal((await change([first!.id, crypto.randomUUID()], ACCOUNT_STATUS.BANNED)).status, 404)
  assert.equal(
    (await prisma.user.findUniqueOrThrow({ where: { id: first!.id } })).accountStatus,
    ACCOUNT_STATUS.ACTIVE,
  )
  console.log('PASS admin authorization, input validation and atomic batch rejection')

  const banned = await change([first!.id, second!.id], ACCOUNT_STATUS.BANNED)
  assert.equal(banned.status, 200)
  assert.equal(banned.body.data.changedCount, 2)
  assert.equal(banned.body.data.revokedSessionCount, 2)
  for (const accessToken of [firstToken, deviceB.body.data.accessToken]) {
    for (const endpoint of ['/required', '/optional']) {
      const result = await request(endpoint, { token: accessToken })
      assert.equal(result.status, 403)
      assert.equal(result.body.code, AUTH_ERROR.ACCOUNT_BANNED)
      assert.equal(JSON.stringify(result.body).includes('回归测试内部原因'), false)
    }
  }
  assert.equal((await request('/optional')).status, 200)
  assert.equal(
    (await login(first!.username, 'WrongPassword123')).body.code,
    AUTH_ERROR.INVALID_CREDENTIALS,
  )
  assert.equal((await login(first!.username)).body.code, AUTH_ERROR.ACCOUNT_BANNED)
  const refreshed = await request('/api/auth/refresh', { method: 'POST', cookie })
  assert.equal(refreshed.body.code, AUTH_ERROR.ACCOUNT_BANNED)
  assert.match(refreshed.cookie, /quiz_refresh=;/)
  const forgedCookie = cookie!.slice(0, -1) + (cookie!.endsWith('a') ? 'b' : 'a')
  assert.equal(
    (await request('/api/auth/refresh', { method: 'POST', cookie: forgedCookie })).body.code,
    AUTH_ERROR.SESSION_EXPIRED,
  )
  assert.equal(await prisma.authSession.count({ where: { userId: first!.id, revokedAt: null } }), 0)
  assert.equal(
    (await change([first!.id, second!.id], ACCOUNT_STATUS.BANNED)).body.data.changedCount,
    0,
  )
  console.log('PASS all devices, optional auth, login, refresh, private reason and repeat ban')

  const listed = await request(`/api/admin/users?keyword=${first!.username}`, { token })
  assert.equal(listed.body.data.list[0].accountStatus, ACCOUNT_STATUS.BANNED)
  assert.equal(listed.body.data.list[0].banReason, '回归测试内部原因')
  // 隔离关键词下校验分类总数与分页，确保按数据库全量筛选而非只过滤当前页。
  for (const [category, expected] of [['all', 3], ['admin', 1], ['student', 0], ['banned', 2]] as const) {
    const result = await request(`/api/admin/users?keyword=${fixturePrefix}&category=${category}&page=99&pageSize=1`, { token })
    assert.equal(result.status, 200)
    assert.equal(result.body.data.pagination.total, expected)
    assert.equal(result.body.data.pagination.page, Math.max(expected, 1))
    assert.equal(result.body.data.list.length, expected ? 1 : 0)
    if (category === 'admin') assert.equal(result.body.data.list[0].id, admin!.id)
    if (category === 'banned') assert.equal(result.body.data.list[0].accountStatus, ACCOUNT_STATUS.BANNED)
  }
  assert.equal((await request('/api/admin/users?category=invalid', { token })).status, 422)
  assert.equal((await request('/api/admin/users?category=admin&category=banned', { token })).status, 422)
  const unbanned = await change([first!.id], ACCOUNT_STATUS.ACTIVE, '人工复核通过')
  assert.equal(unbanned.status, 200)
  for (const [category, expectedId] of [['student', first!.id], ['banned', second!.id]] as const) {
    const result = await request(`/api/admin/users?keyword=${fixturePrefix}&category=${category}`, { token })
    assert.equal(result.body.data.pagination.total, 1)
    assert.equal(result.body.data.list[0].id, expectedId)
  }
  console.log('PASS user categories, keyword filtering, page correction and unban recategorization')
  assert.equal((await request('/required', { token: firstToken })).status, 401)
  assert.equal(
    (await request('/api/auth/refresh', { method: 'POST', cookie })).body.code,
    AUTH_ERROR.SESSION_EXPIRED,
  )
  const newLogin = await login(first!.username)
  assert.equal(newLogin.status, 200)
  assert.equal((await request('/required', { token: newLogin.body.data.accessToken })).status, 200)
  assert.equal(
    (await prisma.user.findUniqueOrThrow({ where: { id: second!.id } })).accountStatus,
    ACCOUNT_STATUS.BANNED,
  )
  const audit = await prisma.operationLog.findMany({
    where: { actorUserId: admin!.id },
    orderBy: { occurredAt: 'asc' },
  })
  assert.equal(audit.length, 3)
  assert.equal(audit.filter((entry) => entry.action === 'admin.user.ban').length, 2)
  assert.equal(audit.filter((entry) => entry.action === 'admin.user.unban').length, 1)
  assert.equal((audit[2]!.changes as any).reason.after, '人工复核通过')
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: first!.id } })).banReason, null)
  console.log('PASS list state, unban, old credential rejection, new login and permanent audit')
} finally {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  await prisma.operationLog.deleteMany({ where: { actorUserId: { in: fixtureIds } } })
  await prisma.user.deleteMany({ where: { id: { in: fixtureIds } } })
  await prisma.$disconnect()
}
