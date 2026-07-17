// 非生产认证与操作审计闭环冒烟测试，通过数据库准备验证码，不绕过生产接口校验逻辑。
import crypto from 'node:crypto'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { EMAIL_CODE_PURPOSE, type EmailCodePurpose } from '../src/constants/auth.js'

if (config.runtimeEnv === 'prod') throw new Error('Refusing to run auth smoke test in production')

const baseUrl = 'http://127.0.0.1:3001/api'
const firstEmail = 'auth-smoke@acemock.cn'
const secondEmail = 'auth-smoke-updated@acemock.cn'
const username = 'auth-smoke-user'
const firstPassword = 'SmokePass123'
const secondPassword = 'SmokePass456'
const resetPasswordValue = 'SmokePass789'
const code = '246810'

function codeDigest(email: string, purpose: EmailCodePurpose, challengeId: string): string {
  return crypto
    .createHmac('sha256', config.emailCodeSecret)
    .update(`${email}:${purpose}:${challengeId}:${code}`)
    .digest('hex')
}

async function createChallenge(email: string, purpose: EmailCodePurpose, userId?: string) {
  const id = crypto.randomUUID()
  await prisma.emailVerificationChallenge.create({
    data: {
      id,
      email,
      purpose,
      userId,
      codeDigest: codeDigest(email, purpose, id),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  })
  return id
}

async function request(
  path: string,
  options: { method?: string; body?: unknown; token?: string; cookie?: string } = {},
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.cookie ? { cookie: options.cookie } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const payload = (await response.json()) as any
  if (!response.ok || !payload.success) {
    throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(payload)}`)
  }
  return {
    data: payload.data,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  }
}

async function expectUnauthorized(path: string, token: string): Promise<void> {
  const response = await fetch(`${baseUrl}${path}`, { headers: { authorization: `Bearer ${token}` } })
  if (response.status !== 401) throw new Error(`${path} should return 401, received ${response.status}`)
}

// 审计在响应完成后异步落库，冒烟测试短暂轮询直到关键认证操作全部可见。
async function expectOperationAudit(userId: string): Promise<void> {
  const requiredActions = new Set([
    'auth.register',
    'auth.login',
    'auth.password.change',
    'profile.update',
    'auth.logout_all',
    'auth.password.reset',
  ])
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const logs = await prisma.operationLog.findMany({ where: { actorUserId: userId } })
    const actions = new Set(logs.map((log) => log.action))
    if ([...requiredActions].every((action) => actions.has(action))) {
      const profileLog = logs.find((log) => log.action === 'profile.update')
      const changes = profileLog?.changes as Record<string, { before?: unknown; after?: unknown }> | null
      if (changes?.email?.before !== firstEmail || changes.email.after !== secondEmail) {
        throw new Error('Profile audit did not preserve the email before/after values')
      }
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Operation audit records were not persisted in time')
}

// 管理员查询接口必须支持角色筛选，并且只在详情中返回字段前后值。
async function expectOperationAuditApi(token: string): Promise<void> {
  const result = await request(`/admin/operation-logs?role=student&keyword=${username}`, { token })
  if (!Array.isArray(result.data.list) || result.data.list.length === 0) {
    throw new Error('Operation audit list did not return the test user records')
  }
  const profileLog = result.data.list.find((log: any) => log.action === 'profile.update')
  if (!profileLog?.hasChanges || 'changes' in profileLog) {
    throw new Error('Operation audit list did not hide changes or expose hasChanges correctly')
  }
  const detail = await request(`/admin/operation-logs/${profileLog.id}`, { token })
  if (detail.data.changes?.email?.before !== firstEmail || detail.data.changes.email.after !== secondEmail) {
    throw new Error('Operation audit detail did not return the email before/after values')
  }
}

async function cleanup(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { OR: [{ username }, { email: { in: [firstEmail, secondEmail] } }] },
    select: { id: true },
  })
  const userIds = users.map((item) => item.id)
  if (userIds.length) {
    await prisma.$transaction([
      prisma.operationLog.deleteMany({ where: { actorUserId: { in: userIds } } }),
      prisma.answerRecord.deleteMany({ where: { examRecord: { userId: { in: userIds } } } }),
      prisma.diagnosticReport.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.diagnosticReportTask.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.examRecord.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.diagnosticSession.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.userMembership.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.authSession.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.emailVerificationChallenge.deleteMany({
        where: { OR: [{ userId: { in: userIds } }, { email: { in: [firstEmail, secondEmail] } }] },
      }),
      prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ])
  } else {
    await prisma.emailVerificationChallenge.deleteMany({
      where: { email: { in: [firstEmail, secondEmail] } },
    })
  }
}

async function main(): Promise<void> {
  await cleanup()
  const registerChallenge = await createChallenge(firstEmail, EMAIL_CODE_PURPOSE.REGISTER)
  const registered = await request('/auth/register', {
    method: 'POST',
    body: {
      username,
      email: firstEmail,
      password: firstPassword,
      confirmPassword: firstPassword,
      challengeId: registerChallenge,
      emailCode: code,
    },
  })
  let accessToken = registered.data.accessToken as string
  let cookie = registered.cookie
  if (!cookie) throw new Error('Register did not set refresh cookie')

  await request('/getMember', { token: accessToken })
  const refreshed = await request('/auth/refresh', { method: 'POST', cookie })
  accessToken = refreshed.data.accessToken
  cookie = refreshed.cookie
  if (!cookie) throw new Error('Refresh did not rotate refresh cookie')

  await request('/auth/password/change', {
    method: 'POST',
    token: accessToken,
    cookie,
    body: { currentPassword: firstPassword, newPassword: secondPassword, confirmPassword: secondPassword },
  })
  await expectUnauthorized('/getMember', accessToken)

  const reloggedAfterPasswordChange = await request('/auth/login', {
    method: 'POST',
    body: { username, password: secondPassword },
  })
  accessToken = reloggedAfterPasswordChange.data.accessToken
  cookie = reloggedAfterPasswordChange.cookie
  if (!cookie) throw new Error('Login after password change did not set refresh cookie')

  const user = await prisma.user.findUniqueOrThrow({ where: { username } })
  const emailChallenge = await createChallenge(secondEmail, EMAIL_CODE_PURPOSE.CHANGE_EMAIL, user.id)
  await request('/auth/profile', {
    method: 'PUT',
    token: accessToken,
    cookie,
    body: { username, email: secondEmail, challengeId: emailChallenge, emailCode: code },
  })

  const sessions = await request('/auth/sessions', { token: accessToken })
  if (sessions.data.list.length !== 1 || !sessions.data.list[0].isCurrent) {
    throw new Error('Current session was not listed correctly')
  }

  await request('/auth/logout-all', { method: 'POST', token: accessToken, cookie })
  await expectUnauthorized('/getMember', accessToken)

  const loggedIn = await request('/auth/login', {
    method: 'POST',
    body: { username: secondEmail, password: secondPassword },
  })
  accessToken = loggedIn.data.accessToken
  cookie = loggedIn.cookie

  const resetChallenge = await createChallenge(secondEmail, EMAIL_CODE_PURPOSE.RESET_PASSWORD, user.id)
  await request('/auth/password/reset', {
    method: 'POST',
    cookie,
    body: {
      email: secondEmail,
      challengeId: resetChallenge,
      emailCode: code,
      password: resetPasswordValue,
      confirmPassword: resetPasswordValue,
    },
  })
  await expectUnauthorized('/getMember', accessToken)
  await request('/auth/login', {
    method: 'POST',
    body: { username, password: resetPasswordValue },
  })

  await expectOperationAudit(user.id)

  await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } })
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { username, password: resetPasswordValue },
  })
  await expectOperationAuditApi(adminLogin.data.accessToken)

  console.log('Auth and operation audit smoke test passed')
}

main()
  .finally(cleanup)
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
