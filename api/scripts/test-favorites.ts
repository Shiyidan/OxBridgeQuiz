// 本地收藏回归：验证未交卷收藏与完整解析查看、用户隔离及分类管理。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { signAccessToken } from '../src/services/jwt.js'
import { favoritesRouter } from '../src/routes/favorites.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { syncPaperQuestions } from '../src/utils/questionSync.js'
import { EXAM_TYPE, EXAM_RECORD_STATUS } from '../src/constants/domain.js'

if (
  config.runtimeEnv !== 'local' ||
  !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)
) {
  throw new Error('Favorites regression requires the local development database')
}
const paperId = `favorite-test-${crypto.randomUUID()}`
const userIds: string[] = []
const app = express()
app.use(express.json())
app.use('/favorites', favoritesRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing test server port')
const base = `http://127.0.0.1:${address.port}/favorites`

// 测试会话使用随机用户，最终仅清理本次创建的数据。
async function member() {
  const name = `favorite-${crypto.randomUUID()}`
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
// 断言只输出状态和测试结果，认证凭据不写日志。
async function request(token: string, path: string, method = 'GET', body?: unknown, status = 200) {
  const response = await fetch(base + path, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const result = (await response.json()) as any
  assert.equal(response.status, status, `${method} ${path}: ${result.errMsg}`)
  assert.equal(result.success, status < 400)
  return result.data
}

try {
  await prisma.paper.create({
    data: {
      id: paperId,
      title: 'Favorites regression fixture',
      examType: EXAM_TYPE.ESAT,
      year: 2026,
      duration: 30,
    },
  })
  await syncPaperQuestions(
    paperId,
    [1, 2, 3].map((number) => ({
      number,
      examType: number === 3 ? EXAM_TYPE.TMUA : EXAM_TYPE.ESAT,
      title: `Favorite fixture ${number}`,
      options: [{ label: 'A', text: '1' }],
      answer: ['A'],
      difficulty: 'easy',
      subject: 'Mathematics 1',
      subject_code: 'fixture-maths',
      topic: 'Equations',
      content_blocks: [{ type: 'paragraph', text: `Favorite fixture ${number}` }],
      images: [],
      learning_analysis: { correct_solution: 'favorite-fixture-solution' },
    })),
  )
  const questions = await prisma.question.findMany({
    where: { paperId },
    orderBy: { number: 'asc' },
  })
  const [q1, q2, q3] = questions.map((question) => question.id)
  const owner = await member()
  const stranger = await member()
  const exam = await prisma.examRecord.create({
    data: {
      userId: owner.id,
      paperId,
      examType: EXAM_TYPE.ESAT,
      startedAt: new Date(),
      answers: { create: questions.map((question) => ({ questionId: question.id })) },
    },
  })
  await request('', '/summary?examType=ESAT', 'GET', undefined, 401)
  await request(stranger.token, `/${q1}`, 'PUT', {}, 404)
  // 并发收藏具有相同身份，尚未作答或交卷也能保存并查看解析。
  await Promise.all(Array.from({ length: 6 }, () => request(owner.token, `/${q1}`, 'PUT', {})))
  await request(owner.token, `/${q2}`, 'PUT', {})
  await request(owner.token, `/${q3}`, 'PUT', {})
  assert.equal(await prisma.questionFavorite.count({ where: { userId: owner.id } }), 3)
  const originalAnswers = await prisma.answerRecord.findMany({ where: { examRecordId: exam.id } })
  const detail = await request(owner.token, `/${q1}`)
  assert.equal((await request(owner.token, `/${q1}/view`, 'POST')).recorded, true)
  await request(stranger.token, `/${q1}/view`, 'POST', undefined, 404)
  assert.deepEqual(detail.question.answer, ['A'])
  assert.equal(detail.question.learning_analysis.correct_solution, 'favorite-fixture-solution')
  const unfinishedExam = await prisma.examRecord.findUniqueOrThrow({ where: { id: exam.id } })
  assert.equal(unfinishedExam.status, EXAM_RECORD_STATUS.IN_PROGRESS)
  assert.equal(unfinishedExam.submittedAt, null)
  assert.deepEqual(
    await prisma.answerRecord.findMany({ where: { examRecordId: exam.id } }),
    originalAnswers,
  )
  assert.equal((await request(owner.token, '/?examType=ESAT')).total, 2)
  assert.equal((await request(owner.token, '/?examType=TMUA')).total, 1)
  assert.equal((await request(owner.token, '/?examType=ESAT&keyword=unmatched')).total, 0)
  assert.equal((await request(owner.token, '/summary?examType=ESAT')).total, 2)
  const category = await request(owner.token, '/categories', 'POST', {
    examType: 'ESAT',
    name: '重点复习',
  })
  const other = await request(stranger.token, '/categories', 'POST', {
    examType: 'ESAT',
    name: '私人分类',
  })
  const tmua = await request(owner.token, '/categories', 'POST', { examType: 'TMUA', name: 'TMUA' })
  await request(
    owner.token,
    '/batch',
    'PUT',
    { examType: 'ESAT', questionIds: [q1], action: 'move', categoryId: other.id },
    404,
  )
  await request(
    owner.token,
    '/batch',
    'PUT',
    { examType: 'ESAT', questionIds: [q1], action: 'move', categoryId: tmua.id },
    404,
  )
  await request(owner.token, '/batch', 'PUT', {
    examType: 'ESAT',
    questionIds: [q1],
    action: 'move',
    categoryId: category.id,
  })
  const summary = await request(owner.token, '/summary?examType=ESAT')
  assert.equal(summary.unclassified, 1)
  assert.equal(summary.categories[0].count, 1)
  await request(stranger.token, `/categories/${category.id}`, 'PUT', { name: '越权修改' }, 404)
  await request(stranger.token, `/categories/${category.id}`, 'DELETE')
  assert.ok(await prisma.favoriteCategory.findUnique({ where: { id: category.id } }))
  await request(stranger.token, '/batch', 'PUT', {
    examType: 'ESAT',
    questionIds: [q1, q2],
    action: 'remove',
  })
  assert.equal((await request(owner.token, '/summary?examType=ESAT')).total, 2)
  assert.deepEqual(await request(stranger.token, '/status', 'POST', { questionIds: [q1] }), [])
  await request(stranger.token, `/${q1}`, 'GET', undefined, 404)
  await request(owner.token, `/categories/${category.id}`, 'PUT', { name: '易混淆' })
  await request(owner.token, `/categories/${category.id}`, 'DELETE')
  assert.equal((await request(owner.token, '/summary?examType=ESAT')).unclassified, 2)
  await prisma.examRecord.update({
    where: { id: exam.id },
    data: { status: EXAM_RECORD_STATUS.SUBMITTED, submittedAt: new Date() },
  })
  const completed = await request(owner.token, `/${q1}`)
  assert.deepEqual(completed.question, detail.question)
  const beforeAnswers = await prisma.answerRecord.findMany({ where: { examRecordId: exam.id } })
  await request(owner.token, `/${q1}`, 'DELETE')
  await request(owner.token, `/${q1}`, 'DELETE')
  await request(owner.token, `/${q1}/view`, 'POST', undefined, 404)
  assert.deepEqual(
    await prisma.answerRecord.findMany({ where: { examRecordId: exam.id } }),
    beforeAnswers,
  )
  await request(owner.token, `/${q1}`, 'PUT', {})
  await prisma.examRecord.delete({ where: { id: exam.id } })
  assert.equal((await request(owner.token, '/summary?examType=ESAT')).total, 2)
  assert.deepEqual((await request(owner.token, `/${q1}`)).question, detail.question)
  await request(owner.token, '/batch', 'PUT', {
    examType: 'ESAT',
    questionIds: [q1, q2, q3],
    action: 'remove',
  })
  assert.equal((await request(owner.token, '/summary?examType=ESAT')).total, 0)
  assert.equal((await request(owner.token, '/summary?examType=TMUA')).total, 1)
  console.log(
    'Favorites regression passed: immediate save and full review before submission, unchanged answers, deduplication, owner/workspace isolation, category lifecycle, batch operations, record independence.',
  )
} finally {
  await prisma.examRecord.deleteMany({ where: { paperId } })
  await prisma.paper.deleteMany({ where: { id: paperId } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  await prisma.$disconnect()
}
