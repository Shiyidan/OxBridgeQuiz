// 登录 IP 上限回归：只在本地库创建临时账号，真实 HTTP 请求覆盖登录、鉴权和续期。
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { authRouter } from '../src/routes/auth.js'
import { requireAuth, optionalAuth } from '../src/middleware/auth.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { AUTH_ERROR } from '../src/constants/auth.js'
import { USER_ROLE } from '../src/constants/domain.js'
import { LEGAL_DOCUMENT_VERSIONS } from '../src/constants/legal.js'
import { normalizeIpAddress } from '../src/utils/ipAddress.js'
import { signAccessToken } from '../src/services/jwt.js'

if (config.runtimeEnv !== 'local' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
  throw new Error('IP limit regression requires the local development database')
}
const app = express()
// 仅测试服务器信任本地代理，借助固定测试地址重现不同网络，不修改真实服务配置。
app.set('trust proxy', 'loopback')
app.use(express.json(), cookieParser())
app.use('/api/auth', authRouter)
app.get('/required', requireAuth, (_req, res) => res.json({ success: true, code: 0, data: null }))
app.get('/optional', optionalAuth, (_req, res) => res.json({ success: true, code: 0, data: null }))
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing test port')
const base = `http://127.0.0.1:${address.port}`
const ids: string[] = []
const password = 'IpLimit123!'
const passwordHash = await bcrypt.hash(password, 4)
const A = '192.0.2.1', B = '192.0.2.2', C = '192.0.2.3', D = '192.0.2.4'

// 每个场景使用独立账号，不读写任何现有用户的会话。
async function fixture(role: string = USER_ROLE.STUDENT) {
  const username = `iplimit-${randomUUID().slice(0, 16)}`
  const user = await prisma.user.create({ data: { username, email: `${username}@example.test`, password: passwordHash, role } })
  ids.push(user.id)
  return user
}

// 保存令牌与 Cookie 以验证被撤销的两种凭证都无法恢复。
async function request(path: string, ip: string, options: { method?: string; body?: unknown; token?: string; cookie?: string } = {}) {
  const response = await fetch(base + path, {
    method: options.method || 'GET',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip,
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  return { status: response.status, body: await response.json() as any, cookie: response.headers.get('set-cookie') || '' }
}

// 登录请求使用正式密码和协议校验流程，不直接签发正常场景的测试令牌。
async function login(username: string, ip: string, attemptedPassword = password) {
  const result = await request('/api/auth/login', ip, { method: 'POST', body: {
    username, password: attemptedPassword,
    legalVersions: { userAgreement: LEGAL_DOCUMENT_VERSIONS.userAgreement, privacyPolicy: LEGAL_DOCUMENT_VERSIONS.privacyPolicy },
  } })
  if (attemptedPassword === password) assert.equal(result.status, 200, JSON.stringify(result.body))
  return { status: result.status, token: result.body.data?.accessToken as string, cookie: result.cookie.split(';')[0]! }
}

// 从数据库核对有效 IP 集合，避免仅看登录成功响应而漏掉同时在线超额。
async function activeIps(userId: string) {
  const rows = await prisma.authSession.findMany({ where: {
    userId, revokedAt: null, expiresAt: { gt: new Date() },
    lastUsedAt: { gt: new Date(Date.now() - config.refreshTokenTtlSeconds * 1000) },
  }, select: { ipAddress: true } })
  return [...new Set(rows.map(row => normalizeIpAddress(row.ipAddress)))].sort()
}

try {
  assert.equal(normalizeIpAddress('::ffff:192.0.2.1'), A)
  assert.equal(normalizeIpAddress('::ffff:c000:201'), A)
  assert.equal(normalizeIpAddress('2001:0DB8:0000:0:0:0:0:1'), '2001:db8::1')
  const user = await fixture()
  const a1 = await login(user.username, A)
  const a2 = await login(user.username, '::ffff:192.0.2.1')
  const b = await login(user.username, B)
  assert.deepEqual(await activeIps(user.id), [A, B])
  assert.equal((await request('/required', A, a1)).status, 200)
  assert.equal((await request('/required', A, a2)).status, 200)
  assert.equal((await login(user.username, C, 'wrong')).status, 401)
  assert.deepEqual(await activeIps(user.id), [A, B])
  const c = await login(user.username, C)
  assert.deepEqual(await activeIps(user.id), [B, C])
  for (const device of [a1, a2]) {
    for (const path of ['/required', '/optional']) {
      const denied = await request(path, A, device)
      assert.equal(denied.status, 401)
      assert.equal(denied.body.code, AUTH_ERROR.SESSION_EXPIRED)
    }
    const refresh = await request('/api/auth/refresh', A, { method: 'POST', cookie: device.cookie })
    assert.equal(refresh.status, 401)
    assert.match(refresh.cookie, /Expires=Thu, 01 Jan 1970/)
  }
  assert.equal((await request('/required', B, b)).status, 200)
  assert.equal((await request('/required', C, c)).status, 200)
  assert.equal((await request('/optional', A)).status, 200)
  assert.deepEqual(await activeIps(user.id), [B, C])

  // 同 IP 补充设备不占名额、不重排最早网络；整组会话均在第三个 IP 登录后失效。
  const b2 = await login(user.username, B)
  const d = await login(user.username, D)
  assert.deepEqual(await activeIps(user.id), [C, D])
  assert.equal((await request('/required', B, b2)).status, 401)
  assert.equal((await request('/required', D, d)).status, 200)
  await request('/api/auth/logout', C, { method: 'POST', cookie: c.cookie, token: c.token })
  await login(user.username, A)
  assert.deepEqual(await activeIps(user.id), [A, D])
  console.log('PASS two IPs, mapped addresses, same-IP devices, failed login, whole-IP eviction, revoked tokens/cookies and logout release')

  // 同网络的两个会话之一切换网络，旧网络仍有其他设备时需要淘汰最早的其他网络。
  for (const path of ['/required', '/api/auth/refresh']) {
    const moving = await fixture()
    const first = await login(moving.username, A)
    const same = await login(moving.username, A)
    const second = await login(moving.username, B)
    const result = await request(path, C, path === '/required' ? first : { method: 'POST', cookie: first.cookie })
    assert.equal(result.status, 200)
    assert.deepEqual(await activeIps(moving.id), [B, C])
    assert.equal((await request('/required', A, same)).status, 401)
    assert.equal((await request('/required', B, second)).status, 200)
  }

  const solo = await fixture()
  const soloA = await login(solo.username, A)
  const soloB = await login(solo.username, B)
  assert.equal((await request('/required', C, soloA)).status, 200)
  assert.deepEqual(await activeIps(solo.id), [B, C])
  assert.equal((await request('/required', B, soloB)).status, 200)

  const expired = await fixture()
  await login(expired.username, A)
  await prisma.authSession.updateMany({ where: { userId: expired.id }, data: { expiresAt: new Date(Date.now() - 1000) } })
  await login(expired.username, B)
  await login(expired.username, C)
  assert.deepEqual(await activeIps(expired.id), [B, C])
  await prisma.authSession.updateMany({ where: { userId: expired.id, ipAddress: B }, data: {
    lastUsedAt: new Date(Date.now() - (config.refreshTokenTtlSeconds + 1) * 1000),
  } })
  await login(expired.username, D)
  assert.deepEqual(await activeIps(expired.id), [C, D])
  console.log('PASS request/refresh network changes, expired and idle sessions release slots')

  // 模拟上线前已有三个 IP 的会话，首次访问收敛，撤销结果必须提交后再返回 401。
  const legacy = await fixture()
  const legacySessions = []
  for (const [index, ipAddress] of [A, B, C].entries()) {
    legacySessions.push(await prisma.authSession.create({ data: {
      userId: legacy.id, ipAddress, refreshTokenHash: '0'.repeat(64),
      expiresAt: new Date(Date.now() + 86400000), createdAt: new Date(Date.now() - (3 - index) * 10000),
    } }))
  }
  const oldToken = signAccessToken(legacy, legacySessions[0]!.id)
  assert.equal((await request('/required', A, { token: oldToken })).status, 401)
  assert.deepEqual(await activeIps(legacy.id), [B, C])

  // 多个新 IP 同时完成密码登录，串行裁决后只保留两个；管理员也遵循同一上限。
  for (const role of [USER_ROLE.STUDENT, USER_ROLE.ADMIN]) {
    const concurrent = await fixture(role)
    const ips = Array.from({ length: 6 }, (_, i) => `198.51.100.${i + 1}`)
    const devices = await Promise.all(ips.map(ip => login(concurrent.username, ip)))
    const retained = await activeIps(concurrent.id)
    assert.equal(retained.length, 2)
    assert.equal(await prisma.userLegalAcceptance.count({ where: { userId: concurrent.id } }), 2)
    for (const [index, device] of devices.entries()) {
      assert.equal((await request('/required', ips[index]!, device)).status, retained.includes(ips[index]!) ? 200 : 401)
    }
    assert.deepEqual(await activeIps(concurrent.id), retained)
  }
  console.log('PASS historical sessions, concurrent logins, student/admin parity and no revoked-session resurrection')
} finally {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  await prisma.operationLog.deleteMany({ where: { actorUserId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
  await prisma.$disconnect()
}
