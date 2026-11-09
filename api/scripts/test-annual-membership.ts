// 本地年卡回归：验证固定金额、功能隔离、365天续购、旧权益保留和重复履约。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { ANNUAL_PLAN, annualPricing, annualPlanPrice, isAnnualPlan } from '../src/constants/annualMembership.js'
import { getMemberContext, hasActiveExamMembershipAccess, checkMemberAccess } from '../src/services/member.js'
import { fulfillPaidOrder } from '../src/services/paymentFulfillment.js'
import type { Request, Response } from 'express'
import { requireLearningMembership } from '../src/middleware/learningMembership.js'

if (config.runtimeEnv !== 'local' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
  throw new Error('Annual membership regression requires the local development database')
}
const userIds: string[] = []
const day = 86400000
const pricing = annualPricing(null)
assert.deepEqual(Object.values(ANNUAL_PLAN).map(plan => annualPlanPrice(plan, pricing)), [39800, 19800, 52000])
assert.equal(isAnnualPlan('monthly'), false)
assert.equal(isAnnualPlan('quarterly'), false)

// 测试账号与订单均独立创建，结束时仅清理本次测试数据。
async function createUser() {
  const username = `annual${crypto.randomBytes(7).toString('hex')}`
  const user = await prisma.user.create({ data: { username, email: `${username}@example.test`, password: 'unused-test-password', role: 'student' } })
  userIds.push(user.id)
  return user.id
}

// 直接运行真实学习门禁，确认资源所属考试和套餐会决定是否放行。
async function learningGate(userId: string, path: string) {
  let status = 200
  let allowed = false
  const res = { status(code: number) { status = code; return this }, json() { return this } }
  await requireLearningMembership({ user: { userId }, path } as Request, res as unknown as Response, error => {
    if (error) throw error
    allowed = true
  })
  return { status, allowed }
}

// 模拟已验证的通道支付确认，不调用外部支付服务或产生真实交易。
async function purchase(userId: string, plan: typeof ANNUAL_PLAN[keyof typeof ANNUAL_PLAN]) {
  const order = await prisma.paymentOrder.create({ data: {
    userId, orderNo: `test-${crypto.randomUUID()}`, examTypes: ['ESAT'], plan, priceType: plan,
    amountCents: annualPlanPrice(plan, pricing), channel: 'aggregate', expiresAt: new Date(Date.now() + day),
  } })
  const paid = { errCode: 'SUCCESS', billStatus: 'PAID', totalAmount: order.amountCents }
  await fulfillPaidOrder(order.orderNo, paid, 'query')
  await fulfillPaidOrder(order.orderNo, paid, 'notification')
  const rows = await prisma.userMembership.findMany({ where: { paymentOrderId: order.id } })
  assert.equal(rows.length, 1)
  assert.equal(rows[0]!.endsAt.getTime() - rows[0]!.startsAt.getTime(), 365 * day)
  return rows[0]!
}

try {
  for (const plan of Object.values(ANNUAL_PLAN)) {
    const userId = await createUser()
    const first = await purchase(userId, plan)
    const practice = plan !== ANNUAL_PLAN.LEARNING
    const learning = plan !== ANNUAL_PLAN.PRACTICE
    assert.equal(await hasActiveExamMembershipAccess(userId, 'ESAT'), practice)
    assert.equal(await hasActiveExamMembershipAccess(userId, 'ESAT', prisma, 'learning'), learning)
    assert.equal(await hasActiveExamMembershipAccess(userId, 'TMUA'), false)
    assert.equal(await hasActiveExamMembershipAccess(userId, 'TMUA', prisma, 'learning'), false)
    assert.deepEqual(await learningGate(userId, '/esat/self-check/100101'), { status: learning ? 200 : 403, allowed: learning })
    assert.deepEqual(await learningGate(userId, '/tmua/examples/100101'), { status: 403, allowed: false })
    assert.equal((await checkMemberAccess(userId, 'question-bank', 'ESAT', 1)).allowed, practice)
    const quota = (await getMemberContext(userId))!.quotas.ESAT!
    assert.equal(quota.practiceAccess, practice)
    assert.equal(quota.learningAccess, learning)
    const renewal = await purchase(userId, plan)
    assert.equal(renewal.startsAt.getTime(), first.endsAt.getTime())
    await prisma.userMembership.updateMany({ where: { userId }, data: { status: 'cancelled' } })
    assert.equal(await hasActiveExamMembershipAccess(userId, 'ESAT'), false)
    assert.equal(await hasActiveExamMembershipAccess(userId, 'ESAT', prisma, 'learning'), false)
  }
  for (const plan of ['monthly', 'quarterly', 'daily_gift']) {
    const userId = await createUser()
    const old = await prisma.userMembership.create({ data: {
      userId, examType: 'ESAT', plan, startsAt: new Date(Date.now() - day), endsAt: new Date(Date.now() + 10 * day), status: 'active',
    } })
    await purchase(userId, ANNUAL_PLAN.LEARNING)
    assert.equal(await hasActiveExamMembershipAccess(userId, 'ESAT'), true)
    assert.equal(await hasActiveExamMembershipAccess(userId, 'ESAT', prisma, 'learning'), true)
    const saved = await prisma.userMembership.findUniqueOrThrow({ where: { id: old.id } })
    assert.equal(saved.endsAt.getTime(), old.endsAt.getTime())
    await prisma.userMembership.update({ where: { id: old.id }, data: { endsAt: new Date(Date.now() - 1) } })
    assert.equal(await hasActiveExamMembershipAccess(userId, 'ESAT'), false)
    assert.equal(await hasActiveExamMembershipAccess(userId, 'ESAT', prisma, 'learning'), true)
  }
  console.log('Annual membership regression passed: prices, scopes, exam isolation, 365 days, renewal, idempotency and legacy preservation')
} finally {
  await prisma.userMembership.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.paymentOrder.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.$disconnect()
}
