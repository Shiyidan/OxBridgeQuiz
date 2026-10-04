// 本地学习足迹回归：真实作答写入、去重、历史范围、访问隔离及移除后的保留。
import assert from 'node:assert/strict'
import { randomUUID, randomBytes } from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { signAccessToken } from '../src/services/jwt.js'
import { memberRouter } from '../src/routes/member.js'
import { examSessionRouter } from '../src/routes/exam-session.js'
import { favoritesRouter } from '../src/routes/favorites.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { operationAuditMiddleware } from '../src/middleware/operationAudit.js'
import { syncPaperQuestions } from '../src/utils/questionSync.js'
import {
  buildLearningFootprint,
  getLearningFootprint,
  learningDate,
  recordAnswerLearning,
} from '../src/services/learningFootprint.js'
import {
  EXAM_TYPE,
  PAPER_TYPE,
  EXAM_RECORD_STATUS,
  EXAM_PHASE,
  USER_ROLE,
} from '../src/constants/domain.js'
import { moduleSnapshotJson } from '../src/services/moduleExamSession.js'

assert.equal(config.runtimeEnv, 'local')
assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))

const calendar = buildLearningFootprint(
  new Date('2024-02-28T16:00:00Z'),
  new Date('2024-03-01T00:00:00Z'),
  [
    {
      kind: 'answers',
      resourceKey: 'a',
      occurredAt: new Date('2024-02-29T15:59:59Z'),
    },
    {
      kind: 'answers',
      resourceKey: 'a',
      occurredAt: new Date('2024-02-29T16:00:00Z'),
    },
    {
      kind: 'answers',
      resourceKey: 'a',
      occurredAt: new Date('2024-02-29T22:00:00Z'),
    },
    {
      kind: 'reviews',
      resourceKey: 'q',
      occurredAt: new Date('2024-03-01T00:01:00Z'),
    },
    {
      kind: 'reviews',
      resourceKey: 'q',
      occurredAt: new Date('2024-03-01T08:20:00Z'),
    },
    {
      kind: 'reports',
      resourceKey: 'q',
      occurredAt: new Date('2024-03-01T00:20:00Z'),
    },
    {
      kind: 'reports',
      resourceKey: 'q',
      occurredAt: new Date('2024-03-01T08:20:00Z'),
    },
    {
      kind: 'answers',
      resourceKey: 'future',
      occurredAt: new Date('2024-03-03T00:00:00Z'),
    },
  ],
  new Date('2024-03-02T04:00:00Z'),
)
assert.deepEqual(
  calendar.days.map((day) => day.date),
  ['2024-02-29', '2024-03-01', '2024-03-02'],
)
assert.deepEqual(
  calendar.days.map((day) => day.total),
  [1, 3, 0],
)
assert.deepEqual(
  calendar.days.map((day) => day.partial),
  [true, true, false],
)
assert.equal(calendar.summary.activeDays, 2)
const newUserCalendar = buildLearningFootprint(
  new Date('2026-10-04T00:00:00Z'),
  new Date('2026-10-04T00:00:00Z'),
  [],
  new Date('2026-10-04T01:00:00Z'),
)
assert.equal(newUserCalendar.days.length, 1)
assert.equal(newUserCalendar.days[0].partial, false)
assert.equal(newUserCalendar.summary.total, 0)
assert.equal(
  buildLearningFootprint(
    new Date('2024-01-01T00:00:00Z'),
    new Date('2024-01-01T00:00:00Z'),
    [],
    new Date('2025-01-01T00:00:00Z'),
  ).days.length,
  367,
)
for (const [count, level] of [
  [0, 0],
  [1, 1],
  [5, 1],
  [6, 2],
  [15, 2],
  [16, 3],
  [30, 3],
  [31, 4],
]) {
  const at = new Date('2026-10-04T00:00:00Z')
  const result = buildLearningFootprint(
    at,
    at,
    Array.from({ length: count }, (_, index) => ({
      kind: 'answers' as const,
      resourceKey: String(index),
      occurredAt: at,
    })),
    at,
  )
  assert.equal(result.days[0].level, level)
}

const userIds: string[] = []
const paperId = `learning-test-${randomUUID()}`
const now = new Date()
// 历史样本相对运行时间生成，回归不依赖某一天的系统时钟。
const dayAgo = (days: number) => new Date(now.getTime() - days * 86_400_000)
const app = express()
app.use(express.json(), operationAuditMiddleware)
app.use('/api/getMember', memberRouter)
app.use('/api/exams', examSessionRouter)
app.use('/api/favorites', favoritesRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing test server')
const base = `http://127.0.0.1:${address.port}/api`

// 每轮使用独立账号和会话，只清理测试自己创建的数据。
async function member() {
  const id = `learning-${randomUUID()}`
  const user = await prisma.user.create({
    data: {
      id,
      username: id,
      email: `${id}@example.test`,
      password: 'unused',
      role: USER_ROLE.ADMIN,
      createdAt: dayAgo(4),
      learningTrackedAt: dayAgo(1),
    },
  })
  userIds.push(id)
  const session = await prisma.authSession.create({
    data: {
      userId: id,
      refreshTokenHash: randomBytes(32).toString('hex'),
      expiresAt: new Date(now.getTime() + 3_600_000),
    },
  })
  return { id, token: signAccessToken(user, session.id) }
}

// 认证令牌只在内存中使用，不写入输出或临时文件。
async function request(token: string, path: string, method = 'GET', body?: unknown, status = 200) {
  const response = await fetch(base + path, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = (await response.json()) as any
  assert.equal(response.status, status, `${method} ${path}: ${result.errMsg}`)
  return result.data
}

try {
  const owner = await member()
  const stranger = await member()
  await prisma.paper.create({
    data: {
      id: paperId,
      title: paperId,
      examType: EXAM_TYPE.ESAT,
      paperType: PAPER_TYPE.AI_PAPER,
      year: 2026,
      duration: 60,
    },
  })
  await syncPaperQuestions(
    paperId,
    [1, 2].map((number) => ({
      number,
      examType: EXAM_TYPE.ESAT,
      title: `Learning fixture ${number}`,
      options: [
        { label: 'A', text: '1' },
        { label: 'B', text: '2' },
      ],
      answer: ['A'],
      difficulty: 'easy',
      subject: 'Mathematics 1',
      topic: 'Equations',
      content_blocks: [{ type: 'paragraph', text: `Learning fixture ${number}` }],
      images: [],
    })),
  )
  const questions = await prisma.question.findMany({
    where: { paperId },
    orderBy: { number: 'asc' },
  })
  const [q1, q2] = questions.map((question) => question.id)
  const exam = await prisma.examRecord.create({
    data: {
      userId: owner.id,
      paperId,
      examType: EXAM_TYPE.ESAT,
      startedAt: now,
      answers: {
        create: questions.map((question) => ({ questionId: question.id })),
      },
    },
  })
  const body = (questionId: string, selectedAnswer: string | null) => ({
    responses: [
      {
        questionId,
        selectedAnswer,
        answerState: selectedAnswer ? 'answered' : 'seen',
        durationSeconds: 12,
      },
    ],
  })
  await request('', '/getMember/learning-footprint', 'GET', undefined, 401)
  await request(stranger.token, `/exams/${exam.id}/progress`, 'PUT', body(q1, 'A'), 404)
  await request(owner.token, `/exams/${exam.id}/progress`, 'PUT', body('outside-scope', 'A'), 422)
  assert.equal(await prisma.learningActivity.count({ where: { userId: owner.id } }), 0)
  await request(owner.token, `/exams/${exam.id}/progress`, 'PUT', body(q1, 'A'))
  assert.equal((await request(owner.token, '/getMember/learning-footprint')).summary.answers, 1)
  assert.equal(
    (await prisma.examRecord.findUniqueOrThrow({ where: { id: exam.id } })).status,
    EXAM_RECORD_STATUS.IN_PROGRESS,
  )
  await request(owner.token, `/exams/${exam.id}/progress`, 'PUT', body(q1, 'A'))
  await request(owner.token, `/exams/${exam.id}/progress`, 'PUT', body(q1, 'B'))
  await request(owner.token, `/exams/${exam.id}/progress`, 'PUT', body(q1, null))
  assert.equal(await prisma.learningActivity.count({ where: { userId: owner.id } }), 1)
  // 足迹与业务更新同一事务，保存失败必须一起回滚。
  await assert.rejects(
    prisma.$transaction(async (tx) => {
      await tx.answerRecord.updateMany({
        where: { examRecordId: exam.id, questionId: q2 },
        data: { selectedAnswer: 'A' },
      })
      const dayStart = Date.parse(`${learningDate(dayAgo(1))}T00:00:00+08:00`)
      for (const hours of [1, 8, 25]) {
        await recordAnswerLearning(
          tx,
          owner.id,
          exam.id,
          [{ questionId: q2, selectedAnswer: 'A' }],
          new Date(dayStart + hours * 3_600_000),
        )
      }
      // 相同答案在同日跨小时保存仍只记一次，次日保存新增一天的记录。
      assert.equal(await tx.learningActivity.count({ where: { userId: owner.id } }), 3)
      throw new Error('rollback fixture')
    }),
    /rollback fixture/,
  )
  assert.equal(await prisma.learningActivity.count({ where: { userId: owner.id } }), 1)
  await request(owner.token, `/exams/${exam.id}/submit`, 'POST', {
    responses: [...body(q1, 'A').responses, ...body(q2, 'A').responses],
  })
  await request(owner.token, `/exams/${exam.id}/submit`, 'POST', {
    responses: [],
  })
  assert.equal((await request(owner.token, '/getMember/learning-footprint')).summary.answers, 2)
  await request(owner.token, `/exams/${exam.id}/progress`, 'PUT', body(q2, 'B'), 409)
  assert.equal(await prisma.learningActivity.count({ where: { userId: owner.id } }), 2)
  // 当前账号无法借参数读取另一用户的足迹。
  assert.equal(
    (await request(stranger.token, `/getMember/learning-footprint?userId=${owner.id}`)).summary
      .total,
    0,
  )

  await request(owner.token, `/favorites/${q1}`, 'PUT', {})
  await request(owner.token, `/favorites/${q1}/view`, 'POST')
  await request(owner.token, `/favorites/${q1}/view`, 'POST')
  for (let attempt = 0; attempt < 100; attempt++) {
    if ((await getLearningFootprint(owner.id))?.summary.reviews === 1) break
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  assert.equal((await getLearningFootprint(owner.id))?.summary.reviews, 1)
  await request(owner.token, `/favorites/${q1}`, 'DELETE')
  assert.equal((await getLearningFootprint(owner.id))?.summary.reviews, 1)

  // 同一题跨错题本/收藏夹复习按天去重；报告与复习分别统计，失败和旧列表日志不计入。
  const logs = [
    ['mistake_notebook.view', q1, 'Question', 'success'],
    ['diagnostic_report.view', exam.id, 'ExamRecord', 'success'],
    ['diagnostic_report.view', exam.id, 'ExamRecord', 'success'],
    ['mistake_notebook.view', null, null, 'success'],
    ['favorite_notebook.question_view', q2, 'Question', 'failure'],
    ['auth.login', owner.id, 'User', 'success'],
  ].map(([action, resourceId, resourceType, result]) => ({
    actorUserId: owner.id,
    actorNameSnapshot: 'fixture',
    actorEmailSnapshot: 'fixture@example.test',
    actorRoleSnapshot: 'student',
    module: 'exam',
    action: action!,
    resourceId,
    resourceType,
    result: result!,
    summary: 'fixture',
    method: 'POST',
    path: '/fixture',
    statusCode: 200,
  }))
  await prisma.operationLog.createMany({ data: logs })
  assert.deepEqual((await getLearningFootprint(owner.id))?.summary, {
    activeDays: 1,
    total: 4,
    answers: 2,
    reviews: 1,
    reports: 1,
  })
  await prisma.examRecord.create({
    data: {
      userId: owner.id,
      paperId,
      examType: EXAM_TYPE.ESAT,
      startedAt: dayAgo(3),
      status: EXAM_RECORD_STATUS.SUBMITTED,
      submittedAt: dayAgo(2),
      answers: {
        create: [
          { questionId: q1, selectedAnswer: 'A', answeredAt: dayAgo(3) },
          { questionId: q2, selectedAnswer: null },
        ],
      },
    },
  })
  const historical = await getLearningFootprint(owner.id)
  assert.equal(historical?.days.find((day) => day.date === learningDate(dayAgo(2)))?.answers, 1)
  assert.equal(historical?.days.find((day) => day.date === learningDate(dayAgo(3)))?.answers, 0)
  assert.equal(historical?.summary.answers, 3)
  // 新足迹不依赖可变的 AnswerRecord，后续清理答卷也不会丢失已经记录的事件。
  await prisma.examRecord.delete({ where: { id: exam.id } })
  assert.equal((await getLearningFootprint(owner.id))?.summary.answers, 3)

  // 分段考试离开时保存和完成模块时保存，同样记录实际答案且最终交卷不重复计数。
  const deadline = new Date(Date.now() + 2_400_000)
  const modular = await prisma.examRecord.create({
    data: {
      userId: owner.id,
      paperId,
      examType: EXAM_TYPE.ESAT,
      startedAt: now,
      phase: EXAM_PHASE.ANSWERING,
      phaseStartedAt: now,
      phaseExpiresAt: deadline,
      expiresAt: deadline,
      structureSnapshot: moduleSnapshotJson({
        version: 1,
        deliveryMode: 'module_sequence',
        breakDurationSeconds: 0,
        modules: [
          {
            code: 'maths1',
            subject: 'Mathematics 1',
            subjectCode: 'maths1',
            order: 1,
            durationSeconds: 2400,
            questionCount: 2,
            questionIds: [q1, q2],
          },
        ],
      }),
      answers: {
        create: questions.map((question) => ({ questionId: question.id })),
      },
    },
  })
  await request(owner.token, `/exams/${modular.id}/pause`, 'POST', {
    moduleCode: 'maths1',
    ...body(q1, 'A'),
  })
  assert.equal((await getLearningFootprint(owner.id))?.summary.answers, 4)
  await request(owner.token, `/exams/${modular.id}/session`)
  await request(owner.token, `/exams/${modular.id}/module/complete`, 'POST', body(q2, 'A'))
  await request(owner.token, `/exams/${modular.id}/module/complete`, 'POST', body(q2, 'A'))
  await request(owner.token, `/exams/${modular.id}/submit`, 'POST', {})
  assert.equal((await getLearningFootprint(owner.id))?.summary.answers, 5)
  console.log(
    'Learning footprint passed: calendar/date boundaries, levels, unsubmitted answers, save/submit deduplication, transaction rollback, auth isolation, detail views, historical coverage, retained history.',
  )
} finally {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await prisma.operationLog.deleteMany({
    where: { actorUserId: { in: userIds } },
  })
  await prisma.examRecord.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.paper.deleteMany({ where: { id: paperId } })
  await prisma.$disconnect()
}
