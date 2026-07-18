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
  const requestId = response.headers.get('x-request-id')
  if (!requestId || !/^[0-9a-f-]{36}$/i.test(requestId)) {
    throw new Error(`${options.method || 'GET'} ${path} did not return a valid X-Request-ID`)
  }
  return {
    data: payload.data,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
    requestId,
  }
}

async function expectUnauthorized(path: string, token: string): Promise<void> {
  const response = await fetch(`${baseUrl}${path}`, { headers: { authorization: `Bearer ${token}` } })
  if (response.status !== 401) throw new Error(`${path} should return 401, received ${response.status}`)
}

// 参数边界测试直接检查失败响应，不经过只接受成功状态的 request 包装。
async function expectApiFailure(
  path: string,
  token: string,
  expectedStatus: number,
): Promise<void> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { authorization: `Bearer ${token}` },
  })
  const payload = (await response.json()) as any
  if (response.status !== expectedStatus || payload.success !== false) {
    throw new Error(
      `${path} should return ${expectedStatus}, received ${response.status} ${JSON.stringify(payload)}`,
    )
  }
}

// 审计在响应完成后异步落库，冒烟测试短暂轮询直到关键认证操作全部可见。
async function expectOperationAudit(userId: string, profileRequestId: string): Promise<void> {
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
      if (logs.some((log) => !log.requestId)) {
        throw new Error('New operation audit records did not persist Request ID')
      }
      if (profileLog?.requestId !== profileRequestId) {
        throw new Error('Profile response and operation audit Request ID did not match')
      }
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
async function expectOperationAuditApi(token: string, profileRequestId: string): Promise<void> {
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
  if (detail.data.requestId !== profileRequestId) {
    throw new Error('Operation audit detail did not return the persisted Request ID')
  }
  const requestIdResult = await request(`/admin/operation-logs?keyword=${profileRequestId}`, { token })
  if (requestIdResult.data.list.length !== 1 || requestIdResult.data.list[0].id !== profileLog.id) {
    throw new Error('Operation audit list could not locate the record by Request ID')
  }
}

// 审计异步落库后再读取统计，确保管理员同模块操作已真实存在而不是尚未写入。
async function waitForOperationLog(requestId: string, expectedRole: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const log = await prisma.operationLog.findFirst({
      where: { requestId, actorRoleSnapshot: expectedRole },
    })
    if (log) return
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Operation audit ${requestId} was not persisted in time`)
}

// 行为统计必须等于同范围学生角色快照日志，并排除已经落库的管理员同名操作。
async function expectBehaviorAnalyticsApi(
  token: string,
  userId: string,
  startAt: Date,
  endAt: Date,
): Promise<void> {
  const query = new URLSearchParams({
    module: 'profile',
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  })
  const expectedLogs = await prisma.operationLog.findMany({
    where: {
      actorRoleSnapshot: 'student',
      module: 'profile',
      occurredAt: { gte: startAt, lt: endAt },
    },
    select: { actorUserId: true },
  })
  const expectedUsers = new Set(
    expectedLogs.flatMap((log) => (log.actorUserId ? [log.actorUserId] : [])),
  )
  if (!expectedLogs.some((log) => log.actorUserId === userId)) {
    throw new Error('Student profile operation was not available for behavior analytics assertion')
  }

  const result = await request(`/admin/behavior-analytics?${query.toString()}`, { token })
  if (result.data.scope.actorRoleSnapshot !== 'student') {
    throw new Error('Behavior analytics did not expose the fixed student scope')
  }
  if (result.data.overview.operationCount !== expectedLogs.length) {
    throw new Error(
      'Behavior analytics included non-student operations or omitted student operations',
    )
  }
  if (result.data.overview.activeUsers !== expectedUsers.size) {
    throw new Error('Behavior analytics active users did not match distinct student actor IDs')
  }
  if (result.data.modules.length !== 1 || result.data.modules[0].module !== 'profile') {
    throw new Error('Behavior analytics module filter was not applied')
  }
  if (!result.data.actions.some((item: any) => item.action === 'profile.update')) {
    throw new Error('Behavior analytics action ranking did not include profile.update')
  }
  if (
    result.data.productUsage.scope.completionSource !== 'exam_record' ||
    result.data.productUsage.scope.reportViewSource !== 'operation_log'
  ) {
    throw new Error('Behavior analytics product usage sources were not exposed correctly')
  }
  if (result.data.productUsage.modules.length !== 3) {
    throw new Error('Behavior analytics did not return the three fixed learning product modules')
  }
  const trendOperationCount = result.data.trend.reduce(
    (total: number, item: any) => total + item.operationCount,
    0,
  )
  if (trendOperationCount !== expectedLogs.length) {
    throw new Error('Behavior analytics trend did not reconcile with the overview count')
  }

  const expectedCoreCount = await prisma.operationLog.count({
    where: {
      actorRoleSnapshot: 'student',
      module: { not: 'auth' },
      occurredAt: { gte: startAt, lt: endAt },
    },
  })
  const authCount = await prisma.operationLog.count({
    where: {
      actorRoleSnapshot: 'student',
      module: 'auth',
      occurredAt: { gte: startAt, lt: endAt },
    },
  })
  if (authCount === 0) {
    throw new Error('Behavior analytics fixture did not include student auth logs')
  }
  const unfilteredQuery = new URLSearchParams({
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  })
  const unfilteredResult = await request(
    `/admin/behavior-analytics?${unfilteredQuery.toString()}`,
    { token },
  )
  if (unfilteredResult.data.overview.operationCount !== expectedCoreCount) {
    throw new Error('Behavior analytics default scope did not exclude authentication operations')
  }
  if (unfilteredResult.data.modules.some((item: any) => item.module === 'auth')) {
    throw new Error('Behavior analytics exposed the excluded authentication module')
  }

  const invalidEnd = new Date(startAt.getTime() - 1).toISOString()
  await expectApiFailure(
    `/admin/behavior-analytics?startAt=${encodeURIComponent(startAt.toISOString())}&endAt=${encodeURIComponent(invalidEnd)}`,
    token,
    422,
  )
  const overlongStart = new Date(endAt.getTime() - 91 * 24 * 60 * 60 * 1000).toISOString()
  await expectApiFailure(
    `/admin/behavior-analytics?startAt=${encodeURIComponent(overlongStart)}&endAt=${encodeURIComponent(endAt.toISOString())}`,
    token,
    422,
  )
  await expectApiFailure(
    `/admin/behavior-analytics?module=auth&startAt=${encodeURIComponent(startAt.toISOString())}&endAt=${encodeURIComponent(endAt.toISOString())}`,
    token,
    422,
  )
  await expectApiFailure(
    `/admin/behavior-analytics?startAt=${encodeURIComponent(startAt.toISOString())}`,
    token,
    422,
  )
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
  const behaviorAnalyticsStartAt = new Date(Date.now() - 1000)
  const updatedProfile = await request('/auth/profile', {
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

  await expectOperationAudit(user.id, updatedProfile.requestId)

  await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } })
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: { username, password: resetPasswordValue },
  })
  const adminProfile = await request('/auth/profile', {
    method: 'PUT',
    token: adminLogin.data.accessToken,
    body: { username, email: secondEmail },
  })
  await waitForOperationLog(adminProfile.requestId, 'admin')
  await expectOperationAuditApi(adminLogin.data.accessToken, updatedProfile.requestId)
  await expectBehaviorAnalyticsApi(
    adminLogin.data.accessToken,
    user.id,
    behaviorAnalyticsStartAt,
    new Date(Date.now() + 1000),
  )

  console.log('Auth, operation audit, and behavior analytics smoke test passed')
}

main()
  .finally(cleanup)
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
