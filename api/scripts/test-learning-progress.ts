// 图谱题数回归：本地真实数据库验证账号隔离、题目去重、交卷边界与只读接口。
import assert from 'node:assert/strict'
import { randomUUID, randomBytes } from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { signAccessToken } from '../src/services/jwt.js'
import { getCompletedQuestionCounts } from '../src/services/learningProgress.js'
import { learningCompletionRouter } from '../src/routes/learningCompletion.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { operationAuditMiddleware } from '../src/middleware/operationAudit.js'
import { syncPaperQuestions } from '../src/utils/questionSync.js'
import { ANSWER_RECORD_STATE, EXAM_RECORD_STATUS, EXAM_TYPE, PAPER_TYPE, USER_ROLE, QUESTION_STATUS } from '../src/constants/domain.js'

assert.equal(config.runtimeEnv, 'local')
assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))
const run = `graph-progress-${randomUUID()}`
const users: string[] = []
const questions: string[] = []
const papers = [run + '-practice', run + '-exam']
const now = new Date()
const app = express()
app.use(express.json(), operationAuditMiddleware)
app.use('/api/learning-completions', learningCompletionRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
if (!address || typeof address === 'string') throw new Error('测试端口未就绪')
const base = `http://127.0.0.1:${address.port}/api/learning-completions`

// 测试账号没有会员权益，读取自己的历史统计仍应可用。
async function member() {
  const user = await prisma.user.create({ data: {
    username: run + users.length, email: run + users.length + '@example.invalid',
    password: 'unused-test-password', role: USER_ROLE.STUDENT,
  } })
  users.push(user.id)
  const session = await prisma.authSession.create({ data: {
    userId: user.id, refreshTokenHash: randomBytes(32).toString('hex'),
    expiresAt: new Date(now.getTime() + 3_600_000),
  } })
  return { id: user.id, token: signAccessToken(user, session.id) }
}

// 每张答卷独立创建，题目在多个答卷重做才能检验统计是否真正去重。
async function attempt(userId: string, indices: number[], options: {
  submitted?: boolean; examType?: string; paperId?: string; state?: string; answer?: string | null
} = {}) {
  const submitted = options.submitted !== false
  return prisma.examRecord.create({ data: {
    userId, paperId: options.paperId ?? papers[0], examType: options.examType ?? EXAM_TYPE.ESAT,
    startedAt: now, submittedAt: submitted ? now : null,
    status: submitted ? EXAM_RECORD_STATUS.SUBMITTED : EXAM_RECORD_STATUS.IN_PROGRESS,
    totalQuestions: indices.length,
    answers: { create: indices.map(index => ({
      questionId: questions[index], answerState: options.state ?? ANSWER_RECORD_STATE.ANSWERED,
      selectedAnswer: options.answer === undefined ? 'A' : options.answer,
      isCorrect: index === 0, answeredAt: now,
    })) },
  } })
}

try {
  const nodes = await prisma.syllabusNode.findMany({ where: { examType: EXAM_TYPE.ESAT, code: { in: ['110101', '110102'] } }, orderBy: { code: 'asc' } })
  assert.equal(nodes.length, 2, '本地需有 ESAT 单位考纲')
  const tmua = await prisma.syllabusNode.findFirst({ where: { examType: EXAM_TYPE.TMUA }, orderBy: { code: 'desc' } })
  assert.ok(tmua, '本地需有 TMUA 考纲')
  await prisma.paper.createMany({ data: papers.map((id, index) => ({
    id, title: run, year: 2026, duration: 60, examType: EXAM_TYPE.ESAT,
    paperType: index ? PAPER_TYPE.REAL_PAPER : PAPER_TYPE.AI_PAPER,
  })) })
  await prisma.questionImportBatch.create({ data: { id: run, title: run, declaredQuestionCount: 11, actualQuestionCount: 11 } })
  questions.push(...await syncPaperQuestions(null, Array.from({ length: 11 }, (_, index) => ({
    importBatchId: run, code: run + '-' + index,
    examType: index === 10 ? EXAM_TYPE.TMUA : EXAM_TYPE.ESAT,
    title: 'Progress fixture', content_blocks: [], options: [{ key: 'A', content: 'fixture' }], answer: ['A'],
  }))))
  const paperQuestions = await syncPaperQuestions(papers[1], [{ number: 1, title: 'Exam fixture', content_blocks: [], answer: ['A'] }])
  questions.push(...paperQuestions)
  await prisma.questionKnowledgePoint.createMany({ data: [
    ...questions.map((questionId, index) => ({ questionId, syllabusNodeId: index === 10 ? tmua.id : nodes[0].id, role: 'primary' })),
    { questionId: questions[0], syllabusNodeId: nodes[1].id, role: 'secondary' },
  ] })
  await prisma.question.updateMany({ where: { id: { in: questions } }, data: { status: QUESTION_STATUS.PUBLISHED } })
  await prisma.question.update({ where: { id: questions[7] }, data: { status: QUESTION_STATUS.ARCHIVED } })
  const first = await member(), second = await member()
  await attempt(first.id, [0, 1, 7])
  await attempt(first.id, [0])
  await attempt(first.id, [2], { state: ANSWER_RECORD_STATE.SKIPPED, answer: null })
  await attempt(first.id, [3], { state: ANSWER_RECORD_STATE.UNSEEN, answer: null })
  const unfinished = await attempt(first.id, [4], { submitted: false })
  await attempt(second.id, [5])
  await attempt(first.id, [6], { paperId: papers[1] })
  await attempt(first.id, [8], { answer: '' })
  await attempt(first.id, [9], { examType: EXAM_TYPE.TMUA })
  await attempt(first.id, [10], { examType: EXAM_TYPE.ESAT })
  await attempt(first.id, [10], { examType: EXAM_TYPE.TMUA })
  await attempt(first.id, [11])

  const counts = await getCompletedQuestionCounts(first.id, EXAM_TYPE.ESAT)
  assert.equal(counts['110101'], 3, '已交卷正确/错误/归档题均计入，重复题、空答案和其他来源不计入')
  assert.equal(counts['110102'], 1, '一道题可贡献于各自关联知识点，但每个知识点内只计一次')
  assert.equal((await getCompletedQuestionCounts(second.id, EXAM_TYPE.ESAT))['110101'], 1)
  assert.equal((await getCompletedQuestionCounts(second.id, EXAM_TYPE.ESAT))['110102'], 0)
  assert.equal((await getCompletedQuestionCounts(first.id, EXAM_TYPE.TMUA))[tmua.code], 1)
  assert.equal(await prisma.learningCompletion.count({ where: { userId: { in: users } } }), 0, '完成题目不自动点亮')
  const headers = { Authorization: 'Bearer ' + first.token }
  const response = await fetch(`${base}/ESAT/question-counts?userId=${second.id}`, { headers })
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const body = await response.json() as { success: boolean; data: { counts: Record<string, number> } }
  assert.equal(body.success, true)
  assert.equal(body.data.counts['110101'], 3, '客户端 userId 不能改变认证账号')
  assert.equal((await fetch(`${base}/ESAT/question-counts`)).status, 401)
  assert.equal((await fetch(`${base}/INVALID/question-counts`, { headers })).status, 422)
  await prisma.examRecord.update({ where: { id: unfinished.id }, data: { status: EXAM_RECORD_STATUS.SUBMITTED, submittedAt: now } })
  assert.equal((await getCompletedQuestionCounts(first.id, EXAM_TYPE.ESAT))['110101'], 4)
  assert.equal(await prisma.operationLog.count({ where: { actorUserId: { in: users } } }), 0, '读取统计不新增操作日志')
  console.log('PASS 图谱题数：真实数据库去重、账号/考试隔离、多知识点、交卷边界、跳过/空答案、归档保留、来源限定及只读鉴权')
} finally {
  // 仅删除本次测试创建的账号、答卷、题目与试题包，保留现有考纲和用户数据。
  server.close()
  await prisma.examRecord.deleteMany({ where: { userId: { in: users } } })
  await prisma.question.deleteMany({ where: { id: { in: questions } } })
  await prisma.paper.deleteMany({ where: { id: { in: papers } } })
  await prisma.questionImportBatch.deleteMany({ where: { id: run } })
  await prisma.operationLog.deleteMany({ where: { actorUserId: { in: users } } })
  await prisma.user.deleteMany({ where: { id: { in: users } } })
  await prisma.$disconnect()
}
