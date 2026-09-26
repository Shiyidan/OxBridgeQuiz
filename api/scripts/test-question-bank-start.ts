// 本地取题防绕过回归：真实接口验证先落库后读题、并发固定题组及旧入口失效。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { signAccessToken } from '../src/services/jwt.js'
import { questionLibraryRouter } from '../src/routes/questionLibrary.js'
import { examRouter } from '../src/routes/exam.js'
import { practiceNotebookRouter } from '../src/routes/practiceNotebooks.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { operationAuditMiddleware } from '../src/middleware/operationAudit.js'
import { signQuestionBankSelection } from '../src/services/questionBankSelection.js'
import {
  EXAM_TYPE,
  EXAM_RECORD_STATUS,
  MEMBERSHIP_PLAN,
  MEMBERSHIP_SOURCE,
  MEMBERSHIP_STATUS,
  PRACTICE_SOURCE,
  QUESTION_STATUS,
} from '../src/constants/domain.js'

if (
  config.runtimeEnv !== 'local' ||
  !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)
) {
  throw new Error('Question bank start regression requires the local development database')
}
const prefix = `qbs-${crypto.randomUUID()}`
const scopeId = crypto.randomUUID()
const questionIds = Array.from({ length: 9 }, () => crypto.randomUUID())
const userIds: string[] = []
let failUserId = ''
// 在嵌套写入成功后故意抛错，验证整个事务回滚，响应不会泄露题目或留下半成品。
prisma.$use(async (params, next) => {
  const result = await next(params)
  if (
    params.model === 'ExamRecord' &&
    params.action === 'create' &&
    params.args.data.userId === failUserId
  ) {
    throw new Error('Intentional test rollback')
  }
  return result
})
const app = express()
app.use(express.json(), operationAuditMiddleware)
app.use('/api/question-library', questionLibraryRouter)
app.use('/api/exams', examRouter)
app.use('/api/practice-notebooks', practiceNotebookRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing port')
const base = `http://127.0.0.1:${address.port}/api`

// 每个用例使用独立会员与会话，清理只涉及本次随机标识的数据。
async function member() {
  const username = `qbs${crypto.randomBytes(7).toString('hex')}`
  const user = await prisma.user.create({
    data: { username, email: `${username}@example.test`, password: 'unused' },
  })
  userIds.push(user.id)
  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 3600000),
    },
  })
  await prisma.userMembership.create({
    data: {
      userId: user.id,
      examType: EXAM_TYPE.TMUA,
      plan: MEMBERSHIP_PLAN.MONTHLY,
      sourceType: MEMBERSHIP_SOURCE.PAYMENT,
      status: MEMBERSHIP_STATUS.ACTIVE,
      startsAt: new Date(Date.now() - 60000),
      endsAt: new Date(Date.now() + 3600000),
    },
  })
  return { id: user.id, token: signAccessToken(user, session.id) }
}

// HTTP 响应中只保留本次断言需要的数据，不输出题目或认证凭据。
async function request(
  token: string,
  path: string,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
) {
  const response = await fetch(base + path, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return {
    status: response.status,
    body: (await response.json()) as any,
    cacheControl: response.headers.get('cache-control'),
  }
}

// 固定范围只含测试题，任意客户端题量或题目 ID 都不能参与后端选题。
function input(requestId = crypto.randomUUID()) {
  return { examType: EXAM_TYPE.TMUA, code: prefix, difficulty: 'easy', requestId }
}

// 所有失败与开始响应都不应带题干；题干只能通过已落库的本人会话读取。
function noQuestions(value: unknown) {
  assert.equal(JSON.stringify(value).includes('private-fixture-stem'), false)
  assert.equal(JSON.stringify(value).includes('private-fixture-solution'), false)
}

try {
  await prisma.syllabusNode.create({
    data: { id: scopeId, examType: EXAM_TYPE.TMUA, code: prefix, label: 'Atomic selection test' },
  })
  for (const [index, id] of questionIds.entries()) {
    await prisma.question.create({
      data: {
        id,
        uniqueCode: id,
        title: `private-fixture-stem-${index}`,
        examType: EXAM_TYPE.TMUA,
        questionType: 'single_choice',
        difficulty: index < 7 ? 'easy' : 'hard',
        status: index === 8 ? QUESTION_STATUS.DRAFT : QUESTION_STATUS.PUBLISHED,
        options: [{ key: 'A', content: 'fixture-option' }],
        answer: ['A'],
        knowledgePoints: [],
        syllabusPoints: [],
        meta: { explanation: 'private-fixture-solution' },
        knowledgePointLinks: { create: { syllabusNodeId: scopeId, role: 'primary' } },
      },
    })
  }
  const user = await member()
  const legacyToken = signQuestionBankSelection(user.id, EXAM_TYPE.TMUA, [questionIds[0]!], {
    source: PRACTICE_SOURCE.DIRECT,
    subject: null,
    knowledgePoint: null,
    difficulty: 'easy',
    plannedQuestionCount: 1,
    questionCount: 1,
  })
  for (const path of [
    '/question-library/selection?examType=TMUA&difficulty=easy',
    '/question-library/SELECTION/?examType=TMUA&difficulty=easy',
  ]) {
    const old = await request(user.token, path)
    assert.equal(old.status, 410)
    assert.equal(old.body.data, null)
    noQuestions(old.body)
  }
  for (const body of [
    { selectionToken: legacyToken },
    { questionIds: [questionIds[0]], examType: 'TMUA' },
    { paperId: 'question-bank' },
  ]) {
    assert.equal((await request(user.token, '/exams/start', body)).status, 410)
  }
  assert.equal(await prisma.examRecord.count({ where: { userId: user.id } }), 0)
  console.log(
    'PASS old selection, legacy valid token and raw-ID start are closed without creating records',
  )

  for (const body of [
    { ...input(), questionIds },
    { ...input(), count: 1000 },
    { ...input(), requestId: '' },
    { ...input(), difficulty: 'invalid' },
  ]) {
    const invalid = await request(user.token, '/question-library/practice', body)
    assert.equal(invalid.status, 422)
    noQuestions(invalid.body)
  }
  assert.equal(
    (await request(user.token, '/question-library/practice', { ...input(), difficulty: 'medium' }))
      .body.code,
    'QUESTION_BANK_EMPTY',
  )
  assert.equal(await prisma.examRecord.count({ where: { userId: user.id } }), 0)
  console.log('PASS invalid parameters, injected IDs/counts and empty selection leave no record')

  const key = crypto.randomUUID()
  const starts = await Promise.all(
    Array.from({ length: 8 }, (_, index) =>
      request(
        user.token,
        '/question-library/practice',
        input(index < 4 ? key : crypto.randomUUID()),
      ),
    ),
  )
  assert.ok(
    starts.every((row) => row.status === 200),
    JSON.stringify(starts),
  )
  starts.forEach((row) => noQuestions(row.body))
  assert.ok(starts.every((row) => row.cacheControl === 'no-store'))
  const recordIds = new Set(starts.map((row) => row.body.data.examRecordId))
  assert.equal(recordIds.size, 1)
  const examId = starts[0]!.body.data.examRecordId
  const record = await prisma.examRecord.findUniqueOrThrow({
    where: { id: examId },
    include: { answers: { orderBy: { position: 'asc' } } },
  })
  assert.equal(record.totalQuestions, 5)
  assert.equal(record.answers.length, 5)
  assert.ok(record.answers.every((answer) => questionIds.slice(0, 7).includes(answer.questionId)))
  assert.deepEqual(
    record.answers.map((answer) => answer.position),
    [0, 1, 2, 3, 4],
  )
  assert.equal(await prisma.examRecord.count({ where: { userId: user.id } }), 1)
  const current = await request(user.token, `/exams/${examId}/session`)
  assert.equal(current.status, 200)
  assert.deepEqual(
    current.body.data.questions.map((question: any) => question.id),
    record.answers.map((answer) => answer.questionId),
  )
  assert.equal(JSON.stringify(current.body).includes('private-fixture-solution'), false)
  assert.ok(
    current.body.data.questions.every(
      (question: any) => !question.answer?.length && !question.analysis && !question.explanation,
    ),
  )
  const repeat = await request(user.token, '/question-library/practice', {
    ...input(),
    difficulty: 'hard',
  })
  assert.equal(repeat.body.data.examRecordId, examId)
  const other = await member()
  const forbidden = await request(other.token, `/exams/${examId}/session`)
  assert.equal(forbidden.status, 404)
  noQuestions(forbidden.body)
  console.log(
    'PASS concurrent requests freeze one five-question group; retries and new filters reuse it; other users cannot read it',
  )

  // 唯一初始创建请求在交卷后重放，仍指向原记录，不抽新题。
  const creator = starts.findIndex((row) => !row.body.data.isResumed)
  assert.ok(creator >= 0)
  const replayUser = await member()
  const replayInput = input()
  const replayStart = await request(replayUser.token, '/question-library/practice', replayInput)
  const replayId = replayStart.body.data.examRecordId
  const saved = await request(replayUser.token, `/exams/${replayId}/session`)
  const responses = saved.body.data.questions.map((question: any) => ({
    questionId: question.id,
    selectedAnswer: 'A',
    answerState: 'answered',
    durationSeconds: 3,
  }))
  assert.equal(
    (await request(replayUser.token, `/exams/${replayId}/progress`, { responses }, 'PUT')).status,
    200,
  )
  assert.equal(
    Object.keys((await request(replayUser.token, `/exams/${replayId}/session`)).body.data.answers)
      .length,
    5,
  )
  assert.equal(
    (
      await request(replayUser.token, `/exams/${replayId}/submit`, {
        responses,
        submissionKey: crypto.randomUUID(),
      })
    ).status,
    200,
  )
  const replayed = await request(replayUser.token, '/question-library/practice', replayInput)
  assert.equal(replayed.body.data.examRecordId, replayId)
  assert.equal(replayed.body.data.status, EXAM_RECORD_STATUS.SUBMITTED)
  const newStart = await request(replayUser.token, '/question-library/practice', input())
  assert.equal(newStart.status, 200)
  assert.notEqual(newStart.body.data.examRecordId, replayId)
  assert.equal(await prisma.examRecord.count({ where: { userId: replayUser.id } }), 2)
  console.log('PASS progress, submission, post-submit idempotency and explicit new practice')

  const failing = await member()
  failUserId = failing.id
  const failed = await request(failing.token, '/question-library/practice', input())
  assert.equal(failed.status, 500)
  assert.equal(failed.body.data, null)
  noQuestions(failed.body)
  assert.equal(await prisma.examRecord.count({ where: { userId: failing.id } }), 0)
  assert.equal(
    await prisma.answerRecord.count({ where: { examRecord: { userId: failing.id } } }),
    0,
  )
  failUserId = ''
  console.log(
    'PASS nested creation failure rolls back the complete attempt before any question response',
  )

  const mixed = await member()
  const notebook = await prisma.practiceNotebook.create({
    data: {
      userId: mixed.id,
      examType: EXAM_TYPE.TMUA,
      name: 'Concurrent test',
      knowledgePointCodes: [prefix],
      knowledgePointSnapshot: [{ code: prefix, label: 'Atomic selection test' }],
      questionCount: 5,
      difficultyMode: 'easy',
    },
  })
  const mixedStarts = await Promise.all([
    request(mixed.token, '/question-library/practice', input()),
    request(mixed.token, `/practice-notebooks/${notebook.id}/start`, {}),
  ])
  assert.ok(
    mixedStarts.every((row) => [200, 201, 409].includes(row.status)),
    JSON.stringify(mixedStarts),
  )
  assert.equal(await prisma.examRecord.count({ where: { userId: mixed.id } }), 1)
  const tiny = await member()
  const tinyStart = await request(tiny.token, '/question-library/practice', {
    ...input(),
    difficulty: 'hard',
  })
  assert.equal(tinyStart.body.data.totalQuestions, 1)
  console.log(
    'PASS notebook and direct entry share concurrency lock; fewer than five questions use actual count and exclude drafts',
  )

  let audit
  for (let attempt = 0; attempt < 20 && !audit; attempt++) {
    audit = await prisma.operationLog.findFirst({
      where: {
        actorUserId: user.id,
        path: '/api/question-library/practice',
        resourceId: examId,
        result: 'success',
      },
    })
    if (!audit) await new Promise((resolve) => setTimeout(resolve, 25))
  }
  assert.ok(audit)
  assert.equal(audit.action, 'exam.start')
  console.log(
    'PASS new start endpoint writes the existing operation audit with its persisted record ID',
  )
} finally {
  failUserId = ''
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  await prisma.operationLog.deleteMany({ where: { actorUserId: { in: userIds } } })
  await prisma.examRecord.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.question.deleteMany({ where: { id: { in: questionIds } } })
  await prisma.syllabusNode.deleteMany({ where: { id: scopeId } })
  await prisma.$disconnect()
}
