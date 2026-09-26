// 验证代理及直连场景的注册来源封禁，不连接数据库或发送邮件。
import assert from 'node:assert/strict'
import { once } from 'node:events'
import type { AddressInfo } from 'node:net'
import express from 'express'
import { createRegistrationSourceGuard, parseRegistrationBlockedIps } from '../src/middleware/registrationAccess.js'

assert.deepEqual(parseRegistrationBlockedIps(' 203.0.113.7,203.0.113.7,2001:db8::7 '), ['203.0.113.7', '2001:db8::7'])
assert.deepEqual(parseRegistrationBlockedIps(undefined), [])
assert.throws(() => parseRegistrationBlockedIps('203.0.113.0/24'))
assert.throws(() => parseRegistrationBlockedIps('not-an-ip'))
const app = express()
app.set('trust proxy', 'loopback')
// 仅测试服务器模拟 TCP 对端；生产代码始终使用真实 socket 地址。
app.use((req, _res, next) => {
  Object.defineProperty(req.socket, 'remoteAddress', { configurable: true, value: req.get('x-test-socket') || '127.0.0.1' })
  next()
})
const guard = createRegistrationSourceGuard(['203.0.113.7', '2001:db8::7'])
let businessCalls = 0
app.post(['/api/auth/register', '/api/auth/email-code'], guard, (req, res) => {
  businessCalls++
  res.json({ ip: req.ip })
})
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
// 将攻击来源和伪造头组合发给真实 Express HTTP 服务，验证来源解析与业务短路。
async function check(path: string, socket: string, forwarded: string | undefined, status: number) {
  const before = businessCalls
  const response = await fetch(base + path, { method: 'POST', headers: { 'x-test-socket': socket, ...(forwarded ? { 'x-forwarded-for': forwarded } : {}) } })
  assert.equal(response.status, status, `${path}: ${socket} via ${forwarded}`)
  if (status === 403) {
    assert.equal((await response.json()).code, 'AUTH_REGISTRATION_RESTRICTED')
    assert.equal(businessCalls, before, 'blocked requests must not reach registration or mail logic')
  }
}
try {
  for (const path of ['/api/auth/register', '/api/auth/email-code', '/api/auth/REGISTER/', '/api/auth/email-code?purpose=REGISTER']) {
    await check(path, '127.0.0.1', '203.0.113.7', 403)
    await check(path, '127.0.0.1', '198.51.100.9, 203.0.113.7', 403)
    await check(path, '203.0.113.7', '198.51.100.9', 403)
    await check(path, '203.0.113.7', undefined, 403)
    await check(path, '::ffff:203.0.113.7', '198.51.100.9', 403)
    await check(path, '2001:0db8:0000:0000:0000:0000:0000:0007', undefined, 403)
    await check(path, '127.0.0.1', '198.51.100.9', 200)
    await check(path, '198.51.100.9', '203.0.113.7', 200)
  }
  assert.equal((await fetch(base + '/api/health', { headers: { 'x-test-socket': '203.0.113.7' } })).status, 200)
  console.log('registration-source: 32 source/route cases and health isolation passed; no database or mail used')
} finally {
  server.closeAllConnections()
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
}
