// 本地展示剔除回归：封禁前后比较操作日志、学习与注册统计，验证解封恢复且原始记录不删除。
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
import { EXAM_RECORD_STATUS, PAPER_TYPE, USER_ROLE, MEMBERSHIP_PLAN, PAYMENT_PRICE_TYPE, PAYMENT_ORDER_STATUS } from '../src/constants/domain.js'
import { OPERATION_AUDIT_MODULE, OPERATION_AUDIT_RESULT } from '../src/constants/operationAudit.js'
import { getRevenuePayments } from '../src/services/revenuePayments.js'
import { getAdminStaffGiftCardStats } from '../src/services/adminStaffStats.js'
import { getConversionAnalytics, getPaidUserAnalytics } from '../src/services/conversionAnalytics.js'
import { recordWebsiteVisit, WEBSITE_VISITOR_TYPE } from '../src/services/websiteTraffic.js'
import { trafficRouter } from '../src/routes/traffic.js'

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
app.use('/api/traffic', trafficRouter)
app.use('/api/admin', adminRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing test port')
const base = `http://127.0.0.1:${address.port}/api/admin`
let token = ''
const observedAt = new Date('2098-07-01T00:00:00Z')
const conversionFilters = { startAt: new Date(period.startAt), endAt: new Date(period.endAt), windowDays: 7 }
const originalFetch = globalThis.fetch
// 地理服务不接收本地回归账号的地址，失败回退也应保持人数一致。
globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof globalThis.Request ? input.url : String(input))
  if (url.hostname === 'ipwho.is') return new globalThis.Response(JSON.stringify({ success: false }), { status: 200 })
  return originalFetch(input, init)
}

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
    await prisma.paymentOrder.create({ data: {
      orderNo: `${prefix}-${i}`, userId, examTypes: ['ESAT'],
      plan: i % 2 ? MEMBERSHIP_PLAN.MONTHLY : MEMBERSHIP_PLAN.QUARTERLY,
      priceType: i % 2 ? PAYMENT_PRICE_TYPE.MONTHLY : PAYMENT_PRICE_TYPE.QUARTERLY,
      status: i === 3 ? PAYMENT_ORDER_STATUS.REFUNDED : i === 2 ? PAYMENT_ORDER_STATUS.REFUNDING : PAYMENT_ORDER_STATUS.PAID,
      amountCents: i * 10000, refundedAmountCents: i === 3 ? 30000 : i === 2 ? 5000 : 0,
      createdAt: occurredAt, paidAt: new Date(occurredAt.getTime() + 60000),
      expiresAt: new Date(occurredAt.getTime() + 600000), channel: 'wechat',
    } })
    await prisma.operationLog.create({ data: {
      actorUserId: admin.id, actorNameSnapshot: '赠卡回归', actorEmailSnapshot: '', actorRoleSnapshot: USER_ROLE.ADMIN,
      module: OPERATION_AUDIT_MODULE.USER, action: 'admin.user.gift_cards.create',
      result: OPERATION_AUDIT_RESULT.SUCCESS, resourceType: 'User', resourceId: userId,
      summary: '赠卡回归', changes: { pendingDailyCardsAdded: { before: 0, after: i } },
      method: 'POST', path: '/fixture', statusCode: 200, occurredAt,
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
  // 一人独占、多人共用、先匿名后登录及上期访问同时覆盖；重复上报不应重复关联或增加 IP 数。
  const ipPrefix = `2001:db8:${crypto.randomBytes(2).toString('hex')}`
  await recordWebsiteVisit(`${ipPrefix}::1`, 'fixture browser', WEBSITE_VISITOR_TYPE.STUDENT, currentAt, userIds[2])
  await recordWebsiteVisit(`${ipPrefix}::1`, 'fixture browser', WEBSITE_VISITOR_TYPE.STUDENT, previousAt, userIds[4])
  await recordWebsiteVisit(`${ipPrefix}::2`, 'fixture browser', WEBSITE_VISITOR_TYPE.STUDENT, currentAt, userIds[1])
  await Promise.all([1, 2, 2].map(index => recordWebsiteVisit(`${ipPrefix}::2`, 'fixture browser', WEBSITE_VISITOR_TYPE.STUDENT, currentAt, userIds[index])))
  await recordWebsiteVisit(`${ipPrefix}::3`, 'fixture browser', WEBSITE_VISITOR_TYPE.ANONYMOUS, currentAt)
  await recordWebsiteVisit(`${ipPrefix}::3`, 'fixture browser', WEBSITE_VISITOR_TYPE.STUDENT, currentAt, userIds[2])
  const linkedVisits = await prisma.websiteVisitDaily.findMany({ where: { users: { some: { id: { in: userIds } } } }, include: { users: true } })
  visitIds.push(...linkedVisits.map(visit => visit.id))
  assert.equal(linkedVisits.length, 4)
  assert.equal(linkedVisits.reduce((sum, visit) => sum + visit.users.length, 0), 5)
  assert.equal(linkedVisits.filter(visit => visit.hasUnattributedVisit).length, 1)
  const bannedUser = await prisma.user.findUniqueOrThrow({ where: { id: userIds[2]! } })
  const bannedSession = await prisma.authSession.create({ data: { userId: bannedUser.id, refreshTokenHash: crypto.randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + 3600000) } })
  const bannedToken = signAccessToken(bannedUser, bannedSession.id)
  const [revenueBefore, giftsBefore, conversionBefore, paidBefore] = await Promise.all([
    getRevenuePayments({ page: 1, pageSize: 10000 }),
    getAdminStaffGiftCardStats({ page: 1, pageSize: 10000, keyword: prefix }),
    getConversionAnalytics(conversionFilters, observedAt),
    getPaidUserAnalytics(observedAt),
  ])
  const sourceOrders = await prisma.paymentOrder.findMany({ where: { userId: { in: userIds } }, orderBy: { id: 'asc' } })
  const query = new URLSearchParams(period).toString()
  const allBefore = await request(`/operation-logs?keyword=${prefix}`)
  const behaviorBefore = await request(`/behavior-analytics?${query}`)
  const trafficBefore = await request(`/traffic-analytics?${query}`)
  assert.equal(allBefore.pagination.total, 14)
  assert.deepEqual(Object.keys(behaviorBefore).sort(), ['period', 'productUsage', 'scope'])
  assert.equal(behaviorBefore.productUsage.overview.completedActivityCount, 6)
  assert.equal(trafficBefore.overview.registrationCount, 2)
  assert.equal(trafficBefore.paidExamPreferenceDistribution.totalStudentCount, 2)
  assert.equal(trafficBefore.overview.visitCount, 5)

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
  assert.equal(behavior.productUsage.overview.completedActivityCount, 3)
  assert.equal(behavior.productUsage.overview.completedActivityChangeRate, 0)
  assert.equal(behavior.productUsage.overview.reportViewCount, 1)
  assert.equal(behavior.productUsage.overview.mistakeNotebookViewCount, 1)
  assert.ok(behavior.productUsage.modules.every((item: any) => item.completionCount === 1))
  const traffic = await request(`/traffic-analytics?${query}`)
  assert.equal(traffic.overview.registrationCount, 1)
  assert.equal(traffic.paidExamPreferenceDistribution.totalStudentCount, 1)
  assert.equal(traffic.overview.registrationCountChangeRate, 0)
  assert.equal(traffic.locationDistribution.totalRegistrationCount, 1)
  assert.equal(traffic.trend.reduce((sum: number, item: any) => sum + item.registrationCount, 0), 1)
  assert.equal(traffic.overview.visitCount, 4)
  assert.equal(traffic.overview.uniqueIpCount, 4)
  assert.equal(traffic.overview.visitCountChangeRate, null)
  assert.equal(traffic.trend[0].studentVisitCount, 2)
  assert.equal(traffic.trend[0].anonymousVisitCount, 2)
  assert.equal(await prisma.websiteVisitDaily.count({ where: { id: { in: visitIds } } }), 6)
  const blockedVisit = await fetch(`http://127.0.0.1:${address.port}/api/traffic/visit`, { method: 'POST', headers: { authorization: `Bearer ${bannedToken}` } })
  assert.equal(blockedVisit.status, 403)
  const [revenue, gifts, conversion, paid] = await Promise.all([
    getRevenuePayments({ page: 1, pageSize: 10000 }),
    getAdminStaffGiftCardStats({ page: 1, pageSize: 10000, keyword: prefix }),
    getConversionAnalytics(conversionFilters, observedAt),
    getPaidUserAnalytics(observedAt),
  ])
  assert.equal(revenue.overview.paidUserCount, revenueBefore.overview.paidUserCount - 2)
  assert.equal(revenue.overview.paidOrderCount, revenueBefore.overview.paidOrderCount - 2)
  assert.equal(revenue.overview.grossRevenueCents, revenueBefore.overview.grossRevenueCents - 60000)
  assert.equal(revenue.overview.refundedAmountCents, revenueBefore.overview.refundedAmountCents - 5000)
  assert.equal(revenue.overview.netRevenueCents, revenueBefore.overview.netRevenueCents - 55000)
  assert.equal(revenue.overview.quarterlyOrderCount, revenueBefore.overview.quarterlyOrderCount - 2)
  assert.equal(revenue.overview.monthlyOrderCount, revenueBefore.overview.monthlyOrderCount)
  assert.equal(revenue.overview.totalCostCents, revenueBefore.overview.totalCostCents)
  assert.ok(revenue.list.every(item => !bannedIds.includes(item.userId)))
  assert.equal(revenue.pagination.total, revenueBefore.pagination.total - 2)
  assert.equal(gifts.overview.grantCount, giftsBefore.overview.grantCount - 2)
  assert.equal(gifts.overview.cardCount, giftsBefore.overview.cardCount - 6)
  assert.equal(gifts.overview.recipientCount, giftsBefore.overview.recipientCount - 2)
  assert.equal(gifts.pagination.total, 2)
  assert.ok(gifts.list.every(item => !bannedIds.includes(item.userId)))
  assert.equal(conversion.overview.registered, conversionBefore.overview.registered - 1)
  assert.equal(conversion.overview.firstPayersInPeriod, conversionBefore.overview.firstPayersInPeriod - 1)
  assert.equal(conversion.paidUserGrowth[0]!.cumulativePaidUsers, conversionBefore.paidUserGrowth[0]!.cumulativePaidUsers - 2)
  assert.equal(paid.paidUsers, paidBefore.paidUsers - 2)
  assert.equal(paid.geography.unknownUsers, paidBefore.geography.unknownUsers - 2)
  assert.equal(paid.duration.sampleCount, paidBefore.duration.sampleCount - 2)
  assert.deepEqual(await prisma.paymentOrder.findMany({ where: { userId: { in: userIds } }, orderBy: { id: 'asc' } }), sourceOrders)
  assert.equal(await prisma.operationLog.count({ where: { requestId: prefix } }), 14)
  assert.equal(await prisma.examRecord.count({ where: { userId: { in: userIds } } }), 12)
  console.log('PASS current/previous analytics, product/report/notebook, registration regions, visits preserved and no source deletion')

  await request('/users/account-status', { userIds: bannedIds, status: ACCOUNT_STATUS.ACTIVE, reason: '回归解封恢复' })
  assert.equal((await request(`/operation-logs?keyword=${prefix}`)).pagination.total, 14)
  const restored = await request(`/behavior-analytics?${query}`)
  assert.deepEqual(restored.productUsage.overview, behaviorBefore.productUsage.overview)
  assert.deepEqual((await request(`/traffic-analytics?${query}`)).overview, trafficBefore.overview)
  assert.deepEqual((await request(`/traffic-analytics?${query}`)).paidExamPreferenceDistribution, trafficBefore.paidExamPreferenceDistribution)
  assert.deepEqual((await getRevenuePayments({ page: 1, pageSize: 10000 })).overview, revenueBefore.overview)
  assert.deepEqual(await getAdminStaffGiftCardStats({ page: 1, pageSize: 10000, keyword: prefix }), giftsBefore)
  assert.deepEqual(await getConversionAnalytics(conversionFilters, observedAt), conversionBefore)
  assert.deepEqual(await getPaidUserAnalytics(observedAt), paidBefore)
  console.log('PASS revenue/refunds/plans/details, gift recipients, daily conversion, lifetime paid geography/durations, shared IP and anonymous traffic; unban restores all statistics')
  console.log('PASS unban restores historical counts without backfill')
} finally {
  globalThis.fetch = originalFetch
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  await prisma.operationLog.deleteMany({ where: { OR: [{ requestId: prefix }, { actorUserId: { in: userIds } }] } })
  await prisma.examRecord.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.paymentOrder.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.paper.deleteMany({ where: { id: { in: paperIds } } })
  await prisma.websiteVisitDaily.deleteMany({ where: { OR: [{ id: { in: visitIds } }, { users: { some: { id: { in: userIds } } } }] } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.$disconnect()
}
