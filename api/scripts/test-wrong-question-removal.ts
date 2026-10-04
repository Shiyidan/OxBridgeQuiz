// 本地错题本回归：校验题目查看审计、用户隔离、持久移出及新错误重新收录。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { signAccessToken } from '../src/services/jwt.js'
import { errorBookRouter } from '../src/routes/errorBook.js'
import { favoritesRouter } from '../src/routes/favorites.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { operationAuditMiddleware } from '../src/middleware/operationAudit.js'
import { getStudentBehaviorAnalytics } from '../src/services/behaviorAnalytics.js'
import { syncPaperQuestions } from '../src/utils/questionSync.js'
import { syncSubmittedWrongQuestions } from '../src/services/wrongQuestionSummary.js'
import { EXAM_TYPE, EXAM_RECORD_STATUS, USER_ROLE } from '../src/constants/domain.js'
import { OPERATION_AUDIT_MODULE, OPERATION_AUDIT_RESULT } from '../src/constants/operationAudit.js'

if (
  config.runtimeEnv !== 'local' ||
  !['localhost', '127.0.0.1'].includes(
    new URL(process.env.DATABASE_URL!).hostname,
  )
) {
  throw new Error(
    'Wrong-question regression requires the local development database',
  )
}
const paperId = `wrong-removal-${crypto.randomUUID()}`
const userIds: string[] = []
const app = express()
app.use(express.json())
app.use((req, _res, next) => {
  req.requestId = req.get('x-test-request-id') || crypto.randomUUID()
  next()
})
app.use(operationAuditMiddleware)
app.use('/api/exams', errorBookRouter)
app.use('/api/favorites', favoritesRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string')
  throw new Error('Missing test server port')
const base = `http://127.0.0.1:${address.port}/api`

// 审计在响应结束后异步保存，按本次请求等待，避免断言或清理早于写入。
async function waitForAudit(requestId: string) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const log = await prisma.operationLog.findFirst({ where: { requestId } })
    if (log) return log
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error('Audit was not persisted')
}

// 随机测试账号隔离真实用户数据，结束时按创建记录精确清理。
async function member() {
  const name = `wrong-removal-${crypto.randomUUID()}`
  const user = await prisma.user.create({
    data: { username: name, email: `${name}@example.test`, password: 'unused' },
  })
  userIds.push(user.id)
  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 3600000),
    },
  })
  return { id: user.id, token: signAccessToken(user, session.id) }
}

// 使用真实鉴权与路由，只输出断言结果，不输出令牌。
async function request(
  token: string,
  path: string,
  method = 'GET',
  body?: unknown,
  status = 200,
) {
  const requestId = crypto.randomUUID()
  const response = await fetch(base + path, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'x-test-request-id': requestId,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = (await response.json()) as any
  assert.equal(response.status, status, `${method} ${path}: ${result.errMsg}`)
  assert.equal(result.success, status < 400)
  if (token && ((method === 'POST' && path.endsWith('/view')) || (method === 'DELETE' && path === '/exams/error-book'))) {
    const audit = await waitForAudit(requestId)
    assert.equal(audit.result, status < 400 ? 'success' : 'failure')
    if (path.endsWith('/view')) {
      assert.equal(audit.resourceType, 'Question')
      assert.equal(audit.resourceId, path.split('/').at(-2))
      if (path.startsWith('/exams/error-book/')) {
        assert.equal(audit.action, 'mistake_notebook.view')
        assert.equal(audit.summary, '查看错题本')
      }
    } else assert.equal(audit.action, 'mistake_notebook.remove')
  }
  return result.data
}

// 创建真实已交卷记录，再走交卷共用的错题同步服务。
async function submitted(
  userId: string,
  questionIds: string[],
  examType: string,
  submittedAt: Date,
  isCorrect = false,
  sync = true,
) {
  const record = await prisma.examRecord.create({
    data: {
      userId,
      paperId,
      examType,
      status: EXAM_RECORD_STATUS.SUBMITTED,
      startedAt: new Date(submittedAt.getTime() - 60000),
      submittedAt,
      answers: {
        create: questionIds.map((questionId) => ({
          questionId,
          selectedAnswer: isCorrect ? 'A' : 'B',
          isCorrect,
        })),
      },
    },
  })
  if (sync)
    await prisma.$transaction((tx) =>
      syncSubmittedWrongQuestions(tx, record.id),
    )
  return record
}

try {
  await prisma.paper.create({
    data: {
      id: paperId,
      title: 'Wrong removal fixture',
      examType: EXAM_TYPE.ESAT,
      year: 2026,
      duration: 30,
    },
  })
  await syncPaperQuestions(
    paperId,
    [1, 2, 3, 4].map((number) => ({
      number,
      examType: number === 4 ? EXAM_TYPE.TMUA : EXAM_TYPE.ESAT,
      title: `Wrong removal fixture ${number}`,
      options: [{ label: 'A', text: '1' }],
      answer: ['A'],
      difficulty: 'easy',
      subject: 'Mathematics 1',
      subject_code: 'fixture-maths',
      content_blocks: [
        { type: 'paragraph', text: `Wrong removal fixture ${number}` },
      ],
      images: [],
    })),
  )
  const questions = await prisma.question.findMany({
    where: { paperId },
    orderBy: { number: 'asc' },
  })
  const [q1, q2, q3, q4] = questions.map((item) => item.id)
  const owner = await member()
  const stranger = await member()
  const past = new Date(Date.now() - 86400000)
  const original = await submitted(owner.id, [q1, q2, q3], EXAM_TYPE.ESAT, past)
  await submitted(
    owner.id,
    [q1],
    EXAM_TYPE.ESAT,
    new Date(past.getTime() + 1000),
  )
  await submitted(owner.id, [q4], EXAM_TYPE.TMUA, past)
  await submitted(stranger.id, [q1], EXAM_TYPE.ESAT, past)
  const historical = await submitted(
    owner.id,
    [q3],
    EXAM_TYPE.ESAT,
    past,
    false,
    false,
  )
  await prisma.questionFavorite.create({
    data: { userId: owner.id, questionId: q1 },
  })
  const answerBefore = await prisma.answerRecord.findMany({
    where: { examRecord: { paperId } },
    orderBy: { id: 'asc' },
  })
  const recordsBefore = await prisma.examRecord.findMany({
    where: { paperId },
    orderBy: { id: 'asc' },
  })

  // 浏览列表不产生查看日志，旧入口已移除；打开具体题目成功后才计数。
  await request(owner.token, '/exams/error-book?examType=ESAT')
  await request(owner.token, '/favorites?examType=ESAT')
  const removedEndpoint = await fetch(`${base}/exams/error-book/visit`, {
    method: 'POST', headers: { authorization: `Bearer ${owner.token}` },
  })
  assert.equal(removedEndpoint.status, 404)
  assert.equal(await prisma.operationLog.count({ where: { actorUserId: owner.id } }), 0)
  await request('', `/exams/error-book/${q1}/view`, 'POST', undefined, 401)
  await request(owner.token, `/exams/error-book/${q1}/view`, 'POST')
  await request(owner.token, `/exams/error-book/${q1}/view`, 'POST')
  await request(owner.token, `/favorites/${q1}/view`, 'POST')
  await request(owner.token, `/favorites/${q1}/view`, 'POST')
  await request(stranger.token, `/exams/error-book/${q2}/view`, 'POST', undefined, 404)
  await request(stranger.token, `/favorites/${q1}/view`, 'POST', undefined, 404)

  // 独立未来时段验证历史查看与新查看统一累计，失败查看不计数。
  const viewAt = new Date('2097-10-03T04:00:00Z')
  await prisma.operationLog.updateMany({ where: { actorUserId: { in: userIds } }, data: { occurredAt: viewAt } })
  await prisma.operationLog.create({ data: {
    occurredAt: viewAt, actorUserId: owner.id, actorNameSnapshot: 'legacy fixture',
    actorEmailSnapshot: '', actorRoleSnapshot: USER_ROLE.STUDENT, module: OPERATION_AUDIT_MODULE.EXAM,
    action: 'mistake_notebook.view', summary: '查看错题本', result: OPERATION_AUDIT_RESULT.SUCCESS,
    method: 'POST', path: '/api/exams/error-book/visit', statusCode: 200,
  } })
  const analytics = await getStudentBehaviorAnalytics({
    startAt: new Date('2097-10-02T16:00:00Z'), endAt: new Date('2097-10-03T16:00:00Z'),
  })
  assert.equal(analytics.productUsage.overview.mistakeNotebookViewCount, 3)
  assert.equal(analytics.productUsage.overview.mistakeNotebookViewerCount, 1)
  assert.equal(analytics.productUsage.overview.averageMistakeNotebookViews, 3)
  assert.equal(analytics.productUsage.trend[0].mistakeNotebookViewCount, 3)
  assert.equal(analytics.productUsage.overview.favoriteNotebookViewCount, 2)
  assert.equal(analytics.productUsage.overview.favoriteNotebookViewerCount, 1)
  assert.equal(analytics.productUsage.trend[0].favoriteNotebookViewCount, 2)
  console.log('PASS question view audit: list ignored, old endpoint removed, historical and new views counted together, owner isolation, failures excluded.')

  await request(
    '',
    '/exams/error-book',
    'DELETE',
    { examType: 'ESAT', questionIds: [q1] },
    401,
  )
  for (const body of [
    {},
    { examType: 'ESAT', questionIds: [] },
    { examType: 'invalid', questionIds: [q1] },
    { examType: 'ESAT', questionIds: [' '] },
    { examType: 'ESAT', questionIds: Array(101).fill(q1) },
    { examType: 'ESAT', questionIds: [q1], userId: owner.id },
  ])
    await request(owner.token, '/exams/error-book', 'DELETE', body, 422)
  assert.equal(
    (
      await request(stranger.token, '/exams/error-book', 'DELETE', {
        examType: 'ESAT',
        questionIds: [q2],
      })
    ).removedCount,
    0,
  )
  assert.equal(
    (
      await request(
        owner.token,
        '/exams/error-book?examType=ESAT&page=2&pageSize=2',
      )
    ).pagination.page,
    2,
  )
  assert.equal(
    (
      await request(owner.token, '/exams/error-book', 'DELETE', {
        examType: 'ESAT',
        questionIds: [q3, q3],
      })
    ).removedCount,
    1,
  )
  const remaining = await request(
    owner.token,
    '/exams/error-book?examType=ESAT&page=2&pageSize=2',
  )
  await request(owner.token, `/exams/error-book/${q3}/view`, 'POST', undefined, 404)
  assert.equal(remaining.pagination.page, 1)
  assert.equal(remaining.pagination.total, 2)
  assert.equal(
    remaining.list.some((item: any) => item.questionId === q3),
    false,
  )

  assert.equal(
    (
      await request(owner.token, '/exams/error-book', 'DELETE', {
        examType: 'ESAT',
        questionIds: [q1, q2, q4, 'missing'],
      })
    ).removedCount,
    2,
  )
  assert.equal(
    (
      await request(owner.token, '/exams/error-book', 'DELETE', {
        examType: 'ESAT',
        questionIds: [q1, q2, q3],
      })
    ).removedCount,
    0,
  )
  const empty = await request(owner.token, '/exams/error-book?examType=ESAT')
  assert.equal(empty.pagination.total, 0)
  assert.equal(empty.pagination.page, 1)
  assert.equal(
    (await request(owner.token, '/exams/error-book?examType=TMUA')).pagination
      .total,
    1,
  )
  assert.equal(
    (await request(stranger.token, '/exams/error-book?examType=ESAT'))
      .pagination.total,
    1,
  )
  const summary = await request(owner.token, '/favorites/summary?examType=ESAT')
  assert.equal(summary.wrongCount, 0)
  assert.equal(summary.total, 1)
  assert.equal(
    (await request(owner.token, `/exams/error-book/${q1}/attempts`)).total,
    2,
  )
  assert.deepEqual(
    await prisma.answerRecord.findMany({
      where: { examRecord: { paperId } },
      orderBy: { id: 'asc' },
    }),
    answerBefore,
  )
  assert.deepEqual(
    await prisma.examRecord.findMany({
      where: { paperId },
      orderBy: { id: 'asc' },
    }),
    recordsBefore,
  )

  // 重放已同步答卷和补录旧错误均不能让已删除题目复现。
  assert.equal(
    await prisma.$transaction((tx) =>
      syncSubmittedWrongQuestions(tx, original.id),
    ),
    0,
  )
  assert.equal(
    await prisma.$transaction((tx) =>
      syncSubmittedWrongQuestions(tx, historical.id),
    ),
    1,
  )
  assert.equal(
    (await request(owner.token, '/exams/error-book?examType=ESAT')).pagination
      .total,
    0,
  )
  await submitted(
    owner.id,
    [q3],
    EXAM_TYPE.ESAT,
    new Date(Date.now() + 1000),
    true,
  )
  assert.equal(
    (await request(owner.token, '/exams/error-book?examType=ESAT')).pagination
      .total,
    0,
  )
  const newWrong = await submitted(
    owner.id,
    [q1],
    EXAM_TYPE.ESAT,
    new Date(Date.now() + 1000),
  )
  const restored = await request(owner.token, '/exams/error-book?examType=ESAT')
  assert.equal(restored.pagination.total, 1)
  assert.equal(restored.list[0].questionId, q1)
  assert.equal(restored.list[0].wrongCount, 3)
  assert.equal(restored.list[0].examRecord.id, newWrong.id)
  assert.equal(
    (await request(owner.token, '/favorites/summary?examType=ESAT')).wrongCount,
    1,
  )
  console.log(
    'Wrong-question removal passed: validation, owner/workspace isolation, single/batch removal, idempotence, last-page fallback, preserved answers/favorites/history, old-record replay, new-error re-entry.',
  )
} finally {
  await prisma.operationLog.deleteMany({ where: { actorUserId: { in: userIds } } })
  await prisma.examRecord.deleteMany({ where: { paperId } })
  await prisma.paper.deleteMany({ where: { id: paperId } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  await prisma.$disconnect()
}
