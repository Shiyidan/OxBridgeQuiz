// 无数据库写入的解析权限回归：真实路由与会员判定配合内存数据验证到期、续费及归属边界。
import assert from 'node:assert/strict'
import { prisma } from '../src/services/prisma.js'
import { examResultRouter } from '../src/routes/exam-results.js'
import { favoritesRouter } from '../src/routes/favorites.js'
import { EXAM_RECORD_STATUS, MEMBERSHIP_STATUS, MEMBERSHIP_PLAN, ADMIN_GIFT_DAILY_PLAN, USER_ROLE } from '../src/constants/domain.js'

const now = Date.now()
let role: string = USER_ROLE.STUDENT
let memberships: Array<{ examType: string; plan: string; status: string; startsAt: Date; endsAt: Date }> = []
let answerReads = 0
let favoriteDetailReads = 0
const originalFavorite = prisma.questionFavorite.findUnique
const originalRecord = prisma.examRecord.findFirst
const originalUser = prisma.user.findUnique
const originalMemberships = prisma.userMembership.findMany
const originalAnswers = prisma.answerRecord.findMany

// 仅替换持久化边界，保留路由内的归属查询、真实会员规则和拒绝响应。
Object.assign(prisma.examRecord, { findFirst: async ({ where }: any) =>
  where.userId === 'owner' && where.id === 'record'
    ? { id: 'record', examType: 'ESAT', status: EXAM_RECORD_STATUS.SUBMITTED, submittedAt: new Date() }
    : null })
Object.assign(prisma.user, { findUnique: async () => ({ id: 'owner', role }) })
Object.assign(prisma.userMembership, { findMany: async ({ where }: any) =>
  memberships.filter((membership) => membership.examType === where.examType) })
Object.assign(prisma.answerRecord, { findMany: async () => { answerReads++; return [] } })

// 收藏归属查询同样只返回考试类型，统计是否越权读取完整题目。
Object.assign(prisma.questionFavorite, { findUnique: async ({ where, include }: any) => {
  if (where.userId_questionId.userId !== 'owner') return null
  if (include?.question) favoriteDetailReads++
  return { question: { examType: 'ESAT' } }
} })

// 调用真实业务 handler；认证中间件已由已有认证回归覆盖，此处显式传入会话归属。
async function invoke(path: string, userId = 'owner', router = examResultRouter): Promise<{ status: number; body: any }> {
  const route = (router as any).stack.find((layer: any) => layer.route?.path === path).route
  return new Promise((resolve, reject) => {
    let status = 200
    const response = {
      status(value: number) { status = value; return response },
      json(body: unknown) { resolve({ status, body }); return response },
    }
    route.stack.at(-1).handle({ params: { id: 'record', questionId: 'question' }, user: { userId } }, response, reject)
  })
}

// 两类会员只改变套餐来源，时间边界与考试隔离规则完全一致。
function card(plan: string, expired: boolean, examType = 'ESAT') {
  return { examType, plan, status: MEMBERSHIP_STATUS.ACTIVE,
    startsAt: new Date(now - 60000), endsAt: new Date(now + (expired ? -1000 : 3600000)) }
}

try {
  for (const plan of [MEMBERSHIP_PLAN.MONTHLY, ADMIN_GIFT_DAILY_PLAN]) {
    memberships = [card(plan, true)]
    assert.equal((await invoke('/:questionId/review-access', 'owner', favoritesRouter)).body.data.allowed, false)
    const favoriteDenied = await invoke('/:questionId', 'owner', favoritesRouter)
    assert.equal(favoriteDenied.status, 403)
    assert.equal(favoriteDenied.body.code, 'ANALYSIS_MEMBERSHIP_REQUIRED')
    assert.equal(favoriteDenied.body.data, null)
    assert.equal(favoriteDetailReads, 0)
    assert.equal((await invoke('/:id/review-access')).body.data.allowed, false)
    const denied = await invoke('/:id/result')
    assert.equal(denied.status, 403)
    assert.equal(denied.body.code, 'ANALYSIS_MEMBERSHIP_REQUIRED')
    assert.equal(denied.body.data, null)
    assert.equal(answerReads, 0)
    memberships.push(card(MEMBERSHIP_PLAN.MONTHLY, false, 'TMUA'))
    assert.equal((await invoke('/:id/review-access')).body.data.allowed, false)
    assert.equal((await invoke('/:questionId/review-access', 'owner', favoritesRouter)).body.data.allowed, false)
    memberships.push(card(MEMBERSHIP_PLAN.MONTHLY, false))
    assert.equal((await invoke('/:questionId/review-access', 'owner', favoritesRouter)).body.data.allowed, true)
    assert.equal((await invoke('/:id/review-access')).body.data.allowed, true)
  }
  memberships = []
  assert.equal((await invoke('/:id/review-access')).body.data.allowed, false)
  assert.equal((await invoke('/:id/review-access', 'other')).status, 404)
  assert.equal((await invoke('/:id/result', 'other')).status, 404)
  assert.equal((await invoke('/:questionId/review-access', 'other', favoritesRouter)).status, 404)
  assert.equal((await invoke('/:questionId', 'other', favoritesRouter)).status, 404)
  role = USER_ROLE.ADMIN
  assert.equal((await invoke('/:questionId/review-access', 'owner', favoritesRouter)).body.data.allowed, true)
  assert.equal((await invoke('/:id/review-access')).body.data.allowed, true)
  console.log('PASS: expired monthly/day cards, renewal, exam isolation, ownership and no answer leakage')
} finally {
  prisma.questionFavorite.findUnique = originalFavorite
  prisma.examRecord.findFirst = originalRecord
  prisma.user.findUnique = originalUser
  prisma.userMembership.findMany = originalMemberships
  prisma.answerRecord.findMany = originalAnswers
  await prisma.$disconnect()
}
