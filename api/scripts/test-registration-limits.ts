// 仅本机数据库执行的注册防刷回归：真实 HTTP、并发提交、事务回滚和跨日窗口。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { once } from 'node:events'
import express, { type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { authRouter } from '../src/routes/auth.js'
import { AUTH_ERROR, EMAIL_CODE_PURPOSE } from '../src/constants/auth.js'
import { LEGAL_DOCUMENT_VERSIONS } from '../src/constants/legal.js'
import { createEmailChallenge } from '../src/services/emailVerification.js'
import {
  REGISTRATION_BROWSER_COOKIE,
  getRegistrationSource,
  registrationSuccessBuckets,
  registrationTransaction,
  consumeRegistrationSuccess,
  consumeRegistrationAttempt,
  checkRegistrationSuccessLimits,
  type RegistrationSource,
} from '../src/services/registrationLimits.js'

if (
  config.runtimeEnv !== 'local' ||
  !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)
) {
  throw new Error('Registration regression requires the local development database')
}
assert.deepEqual(config.registrationLimits, {
  ipAttemptsPerMinute: 5,
  ipSuccessPer10Minutes: 3,
  ipSuccessPerDay: 10,
  browserSuccessPerHour: 2,
  codeRequestsPer10Minutes: 10,
})
const prefix = `rl${crypto.randomBytes(5).toString('hex')}`
const keys = new Set<string>()
const emails: string[] = []
const password = 'Test1234!'
const legalVersions = {
  userAgreement: LEGAL_DOCUMENT_VERSIONS.userAgreement,
  privacyPolicy: LEGAL_DOCUMENT_VERSIONS.privacyPolicy,
}
const app = express()
app.set('trust proxy', 'loopback')
app.use(express.json(), cookieParser())
app.use('/api/auth', authRouter)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing port')
const origin = `http://127.0.0.1:${address.port}/api/auth`
type Client = { ip: string; cookie: string; source: RegistrationSource }

// 使用保留测试网段及随机来源，清理时只删除本次回归创建的桶。
function client(
  ip = `198.18.${crypto.randomInt(256)}.${crypto.randomInt(1, 255)}`,
  cookie = '',
): Client {
  const req = {
    ip,
    cookies: { [REGISTRATION_BROWSER_COOKIE]: cookie.split('=')[1] },
  } as unknown as Request
  let value = cookie
  const source = getRegistrationSource(req, {
    cookie: (name: string, token: string) => {
      value = `${name}=${token}`
    },
  } as unknown as Response)
  for (const bucket of registrationSuccessBuckets(source)) keys.add(bucket.key)
  keys.add(`ip-attempt:${source.ip}`)
  keys.add(`ip-code:${source.ip}`)
  return { ip, cookie: value, source }
}

// 请求经过正式注册路由，测试服务器只信任本机转发的合成来源。
async function request(client: Client, path: string, body: unknown, cookie = client.cookie) {
  const response = await fetch(origin + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': client.ip, cookie },
    body: JSON.stringify(body),
  })
  return {
    status: response.status,
    body: (await response.json()) as any,
    retryAfter: response.headers.get('retry-after'),
    cookies: response.headers.getSetCookie(),
  }
}

// 验证码在本机直接准备，避免真实发信；测试仍执行正式验证码消费和账号创建。
async function registrationInput() {
  const username = `${prefix}${emails.length}`
  const email = `${username}@example.test`
  emails.push(email)
  const challenge = await prisma.$transaction((tx) =>
    createEmailChallenge(tx, { email, purpose: EMAIL_CODE_PURPOSE.REGISTER }),
  )
  return {
    username,
    email,
    password,
    confirmPassword: password,
    legalVersions,
    challengeId: challenge.id,
    emailCode: challenge.code,
  }
}

// 仅替换当前测试桶的历史事件，以验证跨日及滚动窗口而不实际等待。
async function seed(source: RegistrationSource, kind: string, events: number[]) {
  const bucket = registrationSuccessBuckets(source).find((item) => item.key.startsWith(kind))!
  await prisma.registrationRateBucket.upsert({
    where: { key: bucket.key },
    create: { key: bucket.key, events, expiresAt: new Date(bucket.expiresAt) },
    update: { events },
  })
}

try {
  const cookieClient = client()
  const noCookie = await request(cookieClient, '/register', {}, '')
  assert.equal(noCookie.body.code, AUTH_ERROR.REGISTRATION_COOKIE_REQUIRED)
  assert.match(noCookie.cookies.join(';'), /HttpOnly/)
  assert.match(noCookie.cookies.join(';'), /SameSite=Lax/)
  const forged = await request(
    cookieClient,
    '/register',
    {},
    `${REGISTRATION_BROWSER_COOKIE}=${'a'.repeat(32)}.${'0'.repeat(64)}`,
  )
  assert.equal(forged.body.code, AUTH_ERROR.REGISTRATION_COOKIE_REQUIRED)
  const mapped = client(`::ffff:${cookieClient.ip}`, cookieClient.cookie)
  assert.equal(mapped.source.ip, cookieClient.source.ip)
  assert.equal(
    client('2001:db8:abcd:1::1').source.ip,
    client('2001:0db8:abcd:0001::abcd').source.ip,
  )
  console.log('PASS signed cookie required, cookie flags and canonical IPv4/IPv6 source')

  const rollbackClient = client()
  const input = await registrationInput()
  const badCode = input.emailCode === '000000' ? '111111' : '000000'
  assert.equal(
    (await request(rollbackClient, '/register', { ...input, emailCode: badCode })).status,
    422,
  )
  assert.equal(
    (await request(rollbackClient, '/register', { ...input, inviteCode: 'ZZZZZZZZZZZZZZZZ' }))
      .status,
    422,
  )
  assert.equal(await prisma.user.count({ where: { email: input.email } }), 0)
  assert.equal(
    (
      await prisma.emailVerificationChallenge.findUniqueOrThrow({
        where: { id: input.challengeId },
      })
    ).usedAt,
    null,
  )
  assert.equal(
    await prisma.registrationRateBucket.count({
      where: {
        key: { in: registrationSuccessBuckets(rollbackClient.source).map((item) => item.key) },
      },
    }),
    0,
  )
  assert.equal((await request(rollbackClient, '/register', input)).status, 201)
  const second = await registrationInput()
  assert.equal((await request(rollbackClient, '/register', second)).status, 201)
  const browserLimited = await request(rollbackClient, '/email-code', {
    email: `${prefix}unused@example.test`,
    purpose: 'REGISTER',
  })
  assert.equal(browserLimited.body.code, AUTH_ERROR.REGISTRATION_BROWSER_FREQUENT)
  assert.ok(Number(browserLimited.retryAfter) > 0)
  assert.match(browserLimited.body.errMsg, /北京时间/)
  const changedIp = client(undefined, rollbackClient.cookie)
  assert.equal(
    (
      await request(changedIp, '/email-code', {
        email: `${prefix}unused@example.test`,
        purpose: 'REGISTER',
      })
    ).body.code,
    AUTH_ERROR.REGISTRATION_BROWSER_FREQUENT,
  )
  assert.equal(
    (await request(rollbackClient, '/login', { username: input.username, password, legalVersions }))
      .status,
    200,
  )
  assert.equal(
    (
      await request(rollbackClient, '/email-code', {
        email: `${prefix}unknown@example.test`,
        purpose: 'RESET_PASSWORD',
      })
    ).status,
    200,
  )
  assert.equal(
    (await request(rollbackClient, '/logout', {})).cookies.some((value) =>
      value.startsWith(`${REGISTRATION_BROWSER_COOKIE}=`),
    ),
    false,
  )
  console.log(
    'PASS failed code/invitation roll back success quota; browser cap survives IP switch; login/reset/logout unaffected',
  )

  const ipOwner = client()
  const ipClients = Array.from({ length: 5 }, () => client(ipOwner.ip))
  const ipInputs = []
  for (const _client of ipClients) ipInputs.push(await registrationInput())
  const ipResults = await Promise.all(
    ipClients.map((item, index) => request(item, '/register', ipInputs[index])),
  )
  assert.equal(ipResults.filter((item) => item.status === 201).length, 3, JSON.stringify(ipResults))
  assert.ok(ipResults.filter((item) => item.status !== 201).every((item) => item.status === 429))
  assert.equal(
    (await request(client(ipOwner.ip), '/register', {})).body.code,
    AUTH_ERROR.REGISTRATION_IP_FREQUENT,
  )
  assert.equal(
    (
      await request(client(ipOwner.ip), '/email-code', {
        email: `${prefix}ipblocked@example.test`,
        purpose: 'REGISTER',
      })
    ).status,
    429,
  )
  assert.equal(
    await prisma.user.count({ where: { email: { in: ipInputs.map((item) => item.email) } } }),
    3,
  )
  console.log(
    'PASS five concurrent browsers on one IP create exactly three accounts; sixth attempt and further code requests denied',
  )

  const browserOwner = client()
  const browserClients = Array.from({ length: 5 }, () => client(undefined, browserOwner.cookie))
  const browserInputs = []
  for (const _client of browserClients) browserInputs.push(await registrationInput())
  const browserResults = await Promise.all(
    browserClients.map((item, index) => request(item, '/register', browserInputs[index])),
  )
  assert.equal(
    browserResults.filter((item) => item.status === 201).length,
    2,
    JSON.stringify(browserResults),
  )
  assert.ok(
    browserResults
      .filter((item) => item.status !== 201)
      .every((item) => item.body.code === AUTH_ERROR.REGISTRATION_BROWSER_FREQUENT),
  )
  console.log('PASS five concurrent IPs sharing a browser create exactly two accounts')

  const dailyClient = client()
  const midnight =
    registrationSuccessBuckets(dailyClient.source).find((item) => item.key.startsWith('ip-day:'))!
      .since + 1
  await seed(dailyClient.source, 'ip-day:', Array(10).fill(midnight))
  assert.equal(
    (
      await request(dailyClient, '/email-code', {
        email: `${prefix}daily@example.test`,
        purpose: 'REGISTER',
      })
    ).body.code,
    AUTH_ERROR.REGISTRATION_IP_DAILY,
  )
  assert.equal(
    (await request(dailyClient, '/register', {})).body.code,
    AUTH_ERROR.REGISTRATION_IP_DAILY,
  )
  const freshModule = await import('../src/services/registrationLimits.js?fresh-instance')
  await assert.rejects(freshModule.checkRegistrationSuccessLimits(dailyClient.source), {
    code: AUTH_ERROR.REGISTRATION_IP_DAILY,
  })
  await seed(dailyClient.source, 'ip-day:', Array(10).fill(midnight - 1))
  await checkRegistrationSuccessLimits(dailyClient.source)
  await seed(dailyClient.source, 'ip-success:', Array(3).fill(Date.now() - 600_001))
  await seed(dailyClient.source, 'browser:', Array(2).fill(Date.now() - 3_600_001))
  await registrationTransaction((tx) => consumeRegistrationSuccess(tx, dailyClient.source))
  const before = registrationSuccessBuckets(
    dailyClient.source,
    Date.parse('2026-09-26T15:59:59.999Z'),
  )[0]!
  const after = registrationSuccessBuckets(
    dailyClient.source,
    Date.parse('2026-09-26T16:00:00.000Z'),
  )[0]!
  assert.equal(before.expiresAt, after.since + 1)
  console.log(
    'PASS persistent quota across service instances, rolling expiry, and Beijing midnight including exact boundary',
  )

  const dailyRace = client()
  await seed(dailyRace.source, 'ip-day:', Array(9).fill(midnight))
  const dailyRaceSources = Array.from({ length: 5 }, () => client(dailyRace.ip).source)
  const dailyRaceResults = await Promise.allSettled(
    dailyRaceSources.map((source) =>
      registrationTransaction((tx) => consumeRegistrationSuccess(tx, source)),
    ),
  )
  assert.equal(dailyRaceResults.filter((item) => item.status === 'fulfilled').length, 1)
  const attempts = client()
  const attemptResults = await Promise.allSettled(
    Array.from({ length: 8 }, () => consumeRegistrationAttempt(attempts.source)),
  )
  assert.equal(attemptResults.filter((item) => item.status === 'fulfilled').length, 5)
  const codeClient = client()
  for (let index = 0; index < 10; index++) await consumeRegistrationAttempt(codeClient.source, true)
  await assert.rejects(consumeRegistrationAttempt(codeClient.source, true), {
    code: AUTH_ERROR.REGISTRATION_IP_FREQUENT,
  })
  console.log(
    'PASS daily last slot, concurrent request attempts and registration email request cap',
  )

  const delivery = client()
  const deliveryEmail = `${prefix}delivery@example.test`
  emails.push(deliveryEmail)
  const delivered = await request(
    delivery,
    '/email-code',
    { email: deliveryEmail, purpose: 'REGISTER' },
    '',
  )
  assert.equal(delivered.status, 200)
  assert.match(delivered.body.data.developmentCode, /^\d{6}$/)
  assert.ok(delivered.cookies.some((value) => value.startsWith(`${REGISTRATION_BROWSER_COOKIE}=`)))
  console.log('PASS first-time registration email flow issues browser cookie and code')
} finally {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  await prisma.user.deleteMany({ where: { email: { in: emails } } })
  await prisma.emailVerificationChallenge.deleteMany({ where: { email: { in: emails } } })
  await prisma.registrationRateBucket.deleteMany({ where: { key: { in: [...keys] } } })
  await prisma.$disconnect()
}
