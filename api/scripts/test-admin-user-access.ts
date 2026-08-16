// 后台用户权益回归测试：验证考试类型保存为最终状态，并在清空后取消全部会员权益。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { config } from '../src/config.js'
import {
  EXAM_TYPE,
  MEMBERSHIP_PLAN,
  MEMBERSHIP_STATUS,
  USER_ROLE,
} from '../src/constants/domain.js'
import { getMemberContext } from '../src/services/member.js'
import { prisma } from '../src/services/prisma.js'

if (config.runtimeEnv === 'prod') {
  throw new Error('Refusing to run admin user access test in production')
}

const baseUrl = `http://127.0.0.1:${config.port}/api`
const suffix = crypto.randomUUID()
const adminUsername = `access-admin-${suffix}`
const studentUsername = `access-student-${suffix}`
const password = 'AccessTest123'
let adminUserId = ''
let studentUserId = ''

type ApiResult<T> = {
  success: boolean
  data: T
  errMsg: string
}

// 通过真实 HTTP 接口执行后台操作，确保路由鉴权、参数解析和数据库事务共同生效。
async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const payload = (await response.json()) as ApiResult<T>
  if (!response.ok || !payload.success) {
    throw new Error(
      `${options.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(payload)}`,
    )
  }
  return payload.data
}

// 后台弹窗每次提交完整考试类型集合，而不是对既有权益做增量追加。
async function saveAccess(
  token: string,
  examTypes: string[],
  plan: string = MEMBERSHIP_PLAN.MONTHLY,
): Promise<any> {
  return request(`/admin/users/${studentUserId}/access`, {
    method: 'PUT',
    token,
    body: {
      role: USER_ROLE.STUDENT,
      membership: { examTypes, plan },
    },
  })
}

// 读取尚未到期的 active 记录，既覆盖当前权益，也覆盖可能存在的未来预约权益。
async function findUncancelledMemberships() {
  return prisma.userMembership.findMany({
    where: {
      userId: studentUserId,
      status: MEMBERSHIP_STATUS.ACTIVE,
      endsAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'asc' },
  })
}

async function main(): Promise<void> {
  const hashedPassword = await bcrypt.hash(password, 12)
  const [admin, student] = await prisma.$transaction([
    prisma.user.create({
      data: {
        username: adminUsername,
        email: `${adminUsername}@example.test`,
        password: hashedPassword,
        role: USER_ROLE.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        username: studentUsername,
        email: `${studentUsername}@example.test`,
        password: hashedPassword,
        role: USER_ROLE.STUDENT,
      },
    }),
  ])
  adminUserId = admin.id
  studentUserId = student.id

  const login = await request<{ accessToken: string }>('/auth/login', {
    method: 'POST',
    body: { username: adminUsername, password },
  })

  const granted = await saveAccess(login.accessToken, [EXAM_TYPE.TMUA])
  assert.equal('paymentStatus' in granted.user, false)
  assert.deepEqual(
    (await findUncancelledMemberships()).map((membership) => membership.examType),
    [EXAM_TYPE.TMUA],
  )

  await saveAccess(login.accessToken, [EXAM_TYPE.TMUA], MEMBERSHIP_PLAN.QUARTERLY)
  const quarterlyTmua = await findUncancelledMemberships()
  assert.equal(quarterlyTmua.length, 1)
  assert.equal(quarterlyTmua[0]?.plan, MEMBERSHIP_PLAN.QUARTERLY)

  await saveAccess(login.accessToken, [EXAM_TYPE.ESAT])
  assert.deepEqual(
    (await findUncancelledMemberships()).map((membership) => membership.examType),
    [EXAM_TYPE.ESAT],
  )

  // 人工加入未来权益，验证“全部清空”同样不会遗留尚未开始的会员记录。
  const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const futureMembership = await prisma.userMembership.create({
    data: {
      userId: studentUserId,
      examType: EXAM_TYPE.TMUA,
      plan: MEMBERSHIP_PLAN.MONTHLY,
      status: MEMBERSHIP_STATUS.ACTIVE,
      startsAt: futureStart,
      endsAt: new Date(futureStart.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  await saveAccess(login.accessToken, [])
  assert.equal((await findUncancelledMemberships()).length, 0)

  const history = await prisma.userMembership.findMany({
    where: { userId: studentUserId },
  })
  assert.ok(history.length >= 3)
  assert.ok(history.every((membership) => membership.status === MEMBERSHIP_STATUS.CANCELLED))
  const cancelledFutureMembership = history.find(
    (membership) => membership.id === futureMembership.id,
  )
  assert.equal(cancelledFutureMembership?.startsAt.getTime(), futureStart.getTime())
  assert.ok(
    Number(cancelledFutureMembership?.endsAt.getTime())
      > Number(cancelledFutureMembership?.startsAt.getTime()),
  )

  const memberContext = await getMemberContext(studentUserId)
  assert.equal(memberContext?.quotas[EXAM_TYPE.TMUA]?.isMember, false)
  assert.equal(memberContext?.quotas[EXAM_TYPE.ESAT]?.isMember, false)

  console.log('Admin user access regression test passed.')
}

// 测试账号和审计记录仅服务本次回归，结束后必须清理，避免污染本地会员列表。
async function cleanup(): Promise<void> {
  if (!adminUserId && !studentUserId) return
  await new Promise((resolve) => setTimeout(resolve, 300))
  await prisma.operationLog.deleteMany({
    where: {
      OR: [
        { actorUserId: { in: [adminUserId, studentUserId].filter(Boolean) } },
        { actorNameSnapshot: { in: [adminUsername, studentUsername] } },
      ],
    },
  })
  await prisma.user.deleteMany({
    where: { id: { in: [adminUserId, studentUserId].filter(Boolean) } },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await cleanup()
    await prisma.$disconnect()
  })
