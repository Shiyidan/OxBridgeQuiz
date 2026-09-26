// 本地题库会员回归：真实接口验证免费拦截、赠送权益、到期续答与历史保留。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { signAccessToken } from '../src/services/jwt.js'
import { checkMemberAccess, getMemberContext, hasDiagnosticPaperAccess } from '../src/services/member.js'
import { signQuestionBankSelection } from '../src/services/questionBankSelection.js'
import { examRouter } from '../src/routes/exam.js'
import { questionLibraryRouter } from '../src/routes/questionLibrary.js'
import { practiceNotebookRouter } from '../src/routes/practiceNotebooks.js'
import { paperCrudRouter } from '../src/routes/papers-crud.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import {
  ADMIN_GIFT_DAILY_PLAN, EXAM_TYPE, EXAM_RECORD_STATUS, INVITATION_REWARD_PLAN,
  MEMBERSHIP_PLAN, MEMBERSHIP_SOURCE, MEMBERSHIP_STATUS, PAPER_ACCESS_TIER,
  PAPER_TYPE, PRACTICE_SOURCE, QUESTION_STATUS, USER_ROLE,
} from '../src/constants/domain.js'

if (config.runtimeEnv !== 'local' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
  throw new Error('Question bank regression requires the local development database')
}
const app = express()
app.use(express.json())
app.use('/exams', examRouter)
app.use('/questions', questionLibraryRouter)
app.use('/notebooks', practiceNotebookRouter)
app.use('/papers', paperCrudRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing test port')
const origin = `http://127.0.0.1:${address.port}`
const userIds: string[] = []
const paperId = crypto.randomUUID()
const questionId = crypto.randomUUID()
const now = Date.now()

// 每个用例拥有独立会话，所有请求经过真实认证及业务路由。
async function createUser(role: string = USER_ROLE.STUDENT) {
  const username = `qbm${crypto.randomBytes(7).toString('hex')}`
  const user = await prisma.user.create({ data: { username, email: `${username}@example.test`, password: 'unused-test-password', role } })
  userIds.push(user.id)
  const session = await prisma.authSession.create({ data: {
    userId: user.id, refreshTokenHash: crypto.randomBytes(32).toString('hex'), expiresAt: new Date(now + 3600000),
  } })
  return { id: user.id, token: signAccessToken(user, session.id) }
}

// 只断言业务响应，不依赖错误提示文本，确保拒绝响应不包含题目。
async function request(token: string, path: string, method = 'GET', body?: unknown) {
  const response = await fetch(origin + path, {
    method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, body: await response.json() as any }
}

// 付费、赠送和日卡均以生效的 UserMembership 为授权依据。
async function grant(userId: string, plan: string = MEMBERSHIP_PLAN.MONTHLY, sourceType: string = MEMBERSHIP_SOURCE.PAYMENT) {
  return prisma.userMembership.create({ data: {
    userId, examType: EXAM_TYPE.TMUA, plan, sourceType, status: MEMBERSHIP_STATUS.ACTIVE,
    startsAt: new Date(now - 60000), endsAt: new Date(now + 3600000),
  } })
}

// 构造旧链接所持有的合法选题凭证，验证开始时仍会重新检查会员。
function selectionToken(userId: string) {
  return signQuestionBankSelection(userId, EXAM_TYPE.TMUA, [questionId], {
    source: PRACTICE_SOURCE.DIRECT, subject: null, knowledgePoint: null,
    difficulty: 'easy', plannedQuestionCount: 1, questionCount: 1,
  })
}

// 明确检查权限拒绝，避免把其他输入错误误当作防护生效。
function assertDenied(result: Awaited<ReturnType<typeof request>>) {
  assert.equal(result.status, 403)
  assert.equal(result.body.code, 'QUESTION_BANK_ACCESS_DENIED')
  assert.equal(result.body.data, null)
}

try {
  await prisma.paper.create({ data: { id: paperId, title: 'Membership test paper', examType: EXAM_TYPE.TMUA,
    year: 2026, duration: 60, paperType: PAPER_TYPE.AI_PAPER, status: QUESTION_STATUS.PUBLISHED } })
  await prisma.question.create({ data: { id: questionId, uniqueCode: questionId, examType: EXAM_TYPE.TMUA,
    title: 'Membership test question', options: [{ key: 'A', content: '1' }], answer: ['A'],
    knowledgePoints: [], syllabusPoints: [], meta: {}, difficulty: 'easy', questionType: 'single_choice', status: QUESTION_STATUS.PUBLISHED } })
  const free = await createUser()
  for (const examType of [EXAM_TYPE.ESAT, EXAM_TYPE.TMUA]) {
    for (const count of [0, 1, 25, -1]) {
      const access = await checkMemberAccess(free.id, 'question-bank', examType, count)
      assert.equal(access.allowed, false)
      assert.equal(access.reason, 'MEMBERSHIP_REQUIRED')
      assert.equal(access.limit, 0)
    }
    assertDenied(await request(free.token, `/questions/selection?examType=${examType}&difficulty=easy`))
  }
  const context = await getMemberContext(free.id)
  assert.equal(context!.quotas.TMUA!.questionBank.limit, 0)
  assert.equal(context!.quotas.ESAT!.questionBank.remaining, 0)
  // 模拟数据库仍保留历史 25 题配置；无需改动共享配置也能验证其已失效。
  const legacyConfigDb = Object.create(prisma)
  Object.defineProperty(legacyConfigDb, 'entitlementConfig', { value: { findFirst: async () => ({ diagnosticLimit: 1, questionBankLimit: 25 }) } })
  assert.equal((await checkMemberAccess(free.id, 'question-bank', EXAM_TYPE.TMUA, 1, legacyConfigDb)).allowed, false)
  assert.equal(await hasDiagnosticPaperAccess(free.id, { examType: EXAM_TYPE.TMUA, accessTier: PAPER_ACCESS_TIER.FREE }), true)
  assertDenied(await request(free.token, '/exams/start', 'POST', { selectionToken: selectionToken(free.id) }))
  assert.equal(await prisma.examRecord.count({ where: { userId: free.id } }), 0)
  const notebook = await prisma.practiceNotebook.create({ data: { userId: free.id, examType: EXAM_TYPE.TMUA,
    name: 'Membership test notebook', knowledgePointCodes: [], knowledgePointSnapshot: [], questionCount: 5, difficultyMode: 'easy' } })
  assertDenied(await request(free.token, `/notebooks/${notebook.id}/start`, 'POST', {}))
  assert.equal(await prisma.examRecord.count({ where: { userId: free.id } }), 0)
  console.log('PASS free users, old quota config, signed start, notebook start and free diagnosis')

  for (const [plan, source] of [
    [MEMBERSHIP_PLAN.MONTHLY, MEMBERSHIP_SOURCE.PAYMENT],
    [INVITATION_REWARD_PLAN, MEMBERSHIP_SOURCE.INVITATION_REWARD],
    [ADMIN_GIFT_DAILY_PLAN, MEMBERSHIP_SOURCE.ADMIN_GIFT],
  ]) {
    const member = await createUser()
    const membership = await grant(member.id, plan, source)
    assert.equal((await checkMemberAccess(member.id, 'question-bank', EXAM_TYPE.TMUA, 10000)).allowed, true)
    assertDenied(await request(member.token, '/questions/selection?examType=ESAT&difficulty=easy'))
    assert.equal((await request(member.token, '/questions/selection?examType=TMUA&difficulty=easy')).status, 200)
    const started = await request(member.token, '/exams/start', 'POST', { selectionToken: selectionToken(member.id) })
    assert.equal(started.status, 200, JSON.stringify(started.body))
    const examId = started.body.data.examRecordId
    assert.equal((await request(member.token, `/exams/${examId}/session`)).status, 200)
    await prisma.userMembership.update({ where: { id: membership.id }, data: { endsAt: new Date(now - 1000) } })
    for (const [suffix, method] of [['session', 'GET'], ['progress', 'PUT'], ['pause', 'POST'], ['submit', 'POST']]) {
      assertDenied(await request(member.token, `/exams/${examId}/${suffix}`, method, method === 'GET' ? undefined : {}))
    }
    assert.equal((await prisma.examRecord.findUniqueOrThrow({ where: { id: examId } })).status, EXAM_RECORD_STATUS.IN_PROGRESS)
    await prisma.userMembership.update({ where: { id: membership.id }, data: { endsAt: new Date(now + 3600000) } })
    assert.equal((await request(member.token, `/exams/${examId}/session`)).status, 200)
  }
  const admin = await createUser(USER_ROLE.ADMIN)
  for (const examType of [EXAM_TYPE.TMUA, EXAM_TYPE.ESAT]) {
    assert.equal((await request(admin.token, `/questions/selection?examType=${examType}&difficulty=easy`)).status, 200)
  }
  console.log('PASS paid/gift/day-card/admin access, exam isolation, expiration and renewal')

  const stale = await createUser()
  const membership = await grant(stale.id)
  const token = selectionToken(stale.id)
  for (const data of [
    { status: MEMBERSHIP_STATUS.CANCELLED },
    { status: MEMBERSHIP_STATUS.ACTIVE, startsAt: new Date(now + 60000) },
    { startsAt: new Date(now - 60000), endsAt: new Date(now - 1000) },
  ]) {
    await prisma.userMembership.update({ where: { id: membership.id }, data })
    assertDenied(await request(stale.token, '/exams/start', 'POST', { selectionToken: token }))
  }
  assert.equal(await prisma.examRecord.count({ where: { userId: stale.id } }), 0)
  const legacy = await prisma.examRecord.create({ data: { userId: free.id, paperId, examType: EXAM_TYPE.TMUA,
    startedAt: new Date(now), totalQuestions: 1,
    answers: { create: { questionId, position: 0, selectedAnswer: 'A' } } } })
  assertDenied(await request(free.token, `/exams/${legacy.id}/session`))
  assert.equal((await request(free.token, `/papers/${paperId}`)).status, 403)
  await prisma.examRecord.update({ where: { id: legacy.id }, data: { status: EXAM_RECORD_STATUS.SUBMITTED, submittedAt: new Date() } })
  const result = await request(free.token, `/exams/${legacy.id}/result`)
  assert.equal(result.status, 200, JSON.stringify(result.body))
  assert.ok(JSON.stringify(result.body).includes(questionId))
  console.log('PASS cancelled/future/expired membership, old paper links and completed history')
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  await prisma.examRecord.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.question.deleteMany({ where: { id: questionId } })
  await prisma.paper.deleteMany({ where: { id: paperId } })
  await prisma.$disconnect()
}
