// 年度诊断真实接口回归：仅创建随机测试数据，验证选科、历史恢复和导入版本隔离。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { signAccessToken } from '../src/services/jwt.js'
import { papersRouter } from '../src/routes/papers.js'
import { examRouter } from '../src/routes/exam.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { syncPaperQuestions } from '../src/utils/questionSync.js'
import { formatQuestionDocument } from '../src/utils/questionDocument.js'
import { USER_ROLE, EXAM_TYPE, PAPER_TYPE, PAPER_DELIVERY_MODE, EXAM_RECORD_STATUS, DIAGNOSTIC_ASSEMBLY } from '../src/constants/domain.js'

if (config.runtimeEnv !== 'local' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
  throw new Error('Annual diagnostic regression requires the local development database')
}
const prefix = `annual-qa-${crypto.randomUUID()}`
const userIds: string[] = []
const paperIds: string[] = []
const modules = ['maths1', 'maths2', 'physics', 'chemistry', 'biology'].map((code, index) => ({
  code, subject: ['Mathematics 1', 'Mathematics 2', 'Physics', 'Chemistry', 'Biology'][index]!,
  subjectCode: ['110000', '120000', '130000', '140000', '150000'][index]!,
  order: index + 1, durationSeconds: 2400, questionCount: 2,
}))
const app = express()
app.use(express.json({ limit: '5mb' }))
app.use('/api/papers', papersRouter)
app.use('/api/exams', examRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address !== 'string')
const base = `http://127.0.0.1:${address.port}/api`

// 认证凭据全部来自本测试新建的用户与会话，不读取任何已有用户身份。
async function account(admin = false) {
  const username = `annualqa${crypto.randomBytes(8).toString('hex')}`
  const user = await prisma.user.create({ data: {
    username, email: `${username}@example.invalid`, password: 'not-a-login-password',
    role: admin ? USER_ROLE.ADMIN : USER_ROLE.STUDENT,
  } })
  userIds.push(user.id)
  const session = await prisma.authSession.create({ data: {
    userId: user.id, refreshTokenHash: crypto.randomBytes(32).toString('hex'),
    expiresAt: new Date(Date.now() + 3600000),
  } })
  return { id: user.id, token: signAccessToken(user, session.id) }
}

// HTTP helper 不输出认证凭据，失败信息只包含响应包。
async function request(token: string, path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') {
  const response = await fetch(base + path, {
    method,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, body: await response.json() as any }
}

// 造题只走正式同步入口，嵌套敏感属性用于证明作答白名单不会泄露解析。
async function fixture(annual: boolean, selected = modules, examType: string = EXAM_TYPE.ESAT) {
  const paper = await prisma.paper.create({ data: {
    id: `${prefix}-${paperIds.length}`, title: prefix, year: 2097, examType,
    duration: 120, paperType: PAPER_TYPE.REAL_PAPER, accessTier: 'free', status: 'published',
    assemblyType: annual ? DIAGNOSTIC_ASSEMBLY.ANNUAL : 'fixed',
    deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE, breakDurationSeconds: examType === EXAM_TYPE.ESAT ? 180 : 0,
    moduleConfig: selected,
  } })
  paperIds.push(paper.id)
  await syncPaperQuestions(paper.id, selected.flatMap((module, moduleIndex) => Array.from({ length: module.questionCount }, (_, index) => index + 1).map((number) => ({
    code: `${prefix}-${module.code}-${number}`, examType, number: moduleIndex * module.questionCount + number,
    title: `Original ${module.code} ${number}`, module_code: module.code,
    module_order: module.order, module_question_number: number,
    subject: module.subject, subject_code: module.subjectCode, question_type: 'single_choice', difficulty: 'easy',
    content_blocks: [{ type: 'paragraph', text: `Original ${module.code} ${number}`, solution: 'SECRET_NESTED' }],
    options: [{ label: 'A', text: 'one', isCorrect: true }, { label: 'B', text: 'two', solution: 'SECRET_NESTED' }],
    images: [], answer: ['A'], knowledge_points: [], source_examType: examType, year: 2097,
    learning_analysis: { correct_solution: 'SECRET_CORRECT_SOLUTION', exam_focus: 'SECRET_FOCUS',
      common_error_causes: ['SECRET_ERROR'], review_guidance: 'SECRET_REVIEW' },
  }))))
  return paper
}

// 检查整个会话和嵌套题干，禁止答案及学习解析旁路下发。
function safeSession(data: any) {
  const serialized = JSON.stringify(data)
  assert.equal(serialized.includes('SECRET_'), false)
  for (const question of data.questions ?? []) {
    assert.equal(Object.hasOwn(question, 'answer'), false)
    assert.equal(Object.hasOwn(question, 'solution'), false)
    assert.equal(Object.hasOwn(question, 'learning_analysis'), false)
    for (const option of question.options) assert.equal(Object.hasOwn(option, 'isCorrect'), false)
  }
}

try {
  // 测试专属年份必须空闲，避免版本导入误操作已有年度。
  assert.equal(await prisma.paper.count({ where: { year: 2097 } }), 0, 'Test year 2097 is already occupied')
  const annual = await fixture(true)
  const admin = await account(true)
  const optional = modules.slice(1).map((module) => module.code)
  for (let first = 0; first < optional.length; first++) {
    for (let second = first + 1; second < optional.length; second++) {
      const user = await account()
      const moduleCodes = ['maths1', optional[first]!, optional[second]!]
      const started = await request(user.token, '/exams/start', { paperId: annual.id, moduleCodes })
      assert.equal(started.status, 200, JSON.stringify(started.body))
      const data = started.body.data
      assert.deepEqual(data.modules.map((module: any) => module.code), moduleCodes)
      assert.equal(data.totalQuestions, 6)
      safeSession(data)
      const rows = await prisma.answerRecord.findMany({ where: { examRecordId: data.examRecordId }, include: { question: true } })
      assert.equal(rows.length, 6)
      assert.ok(rows.every((row) => moduleCodes.includes(row.question.moduleCode!)))
      const resumed = await request(user.token, '/exams/start', { paperId: annual.id, moduleCodes: [...moduleCodes].reverse() })
      assert.equal(resumed.status, 200, JSON.stringify(resumed.body))
      assert.equal(resumed.body.data.examRecordId, data.examRecordId)
      const otherCodes = ['maths1', optional.find((code) => !moduleCodes.includes(code))!, moduleCodes[1]!]
      const switched = await request(user.token, '/exams/start', { paperId: annual.id, moduleCodes: otherCodes })
      assert.equal(switched.status, 409, JSON.stringify(switched.body))
      assert.equal(await prisma.examRecord.count({ where: { userId: user.id } }), 1)
      let session = resumed.body.data
      for (let index = 0; index < moduleCodes.length; index++) {
        assert.equal(session.currentModule.code, moduleCodes[index])
        assert.equal(session.questions.length, 2)
        assert.ok(session.questions.every((question: any) => question.module_code === moduleCodes[index]))
        safeSession(session)
        const completed = await request(user.token, `/exams/${data.examRecordId}/module/complete`, { responses: [] })
        assert.equal(completed.status, 200, JSON.stringify(completed.body))
        session = completed.body.data
        if (index < moduleCodes.length - 1) {
          const skipped = await request(user.token, `/exams/${data.examRecordId}/break/skip`, {})
          assert.equal(skipped.status, 200, JSON.stringify(skipped.body))
          session = skipped.body.data
        }
      }
      assert.equal(session.phase, 'ready_to_submit')
      await prisma.examRecord.update({ where: { id: data.examRecordId }, data: {
        status: EXAM_RECORD_STATUS.SUBMITTED, submittedAt: new Date(), activeDiagnosticKey: null,
      } })
      const result = await request(user.token, `/exams/${data.examRecordId}/result`)
      assert.equal(result.status, 200, JSON.stringify(result.body))
      assert.deepEqual(result.body.data.questions.map((question: any) => question.number), [1, 2, 3, 4, 5, 6])
      assert.deepEqual(result.body.data.questions.map((question: any) => question.module_question_number), [1, 2, 1, 2, 1, 2])
    }
  }
  console.log('PASS all six ESAT combinations; unselected subjects excluded; resumed composition immutable; nested answer filtering')

  const invalidUser = await account()
  for (const moduleCodes of [[], ['physics', 'chemistry', 'biology'], ['maths1', 'maths1', 'physics'],
    ['maths1', 'physics', 'chemistry', 'biology'], ['maths1', 'physics', 'invalid']]) {
    const response = await request(invalidUser.token, '/exams/start', { paperId: annual.id, moduleCodes })
    assert.equal(response.status, 422, JSON.stringify(response.body))
  }
  assert.equal(await prisma.examRecord.count({ where: { userId: invalidUser.id } }), 0)
  const hidden = await fixture(true)
  await prisma.paper.update({ where: { id: hidden.id }, data: { status: 'draft' } })
  const selection = { paperId: hidden.id, moduleCodes: ['maths1', 'physics', 'chemistry'] }
  assert.equal((await request(invalidUser.token, '/exams/start', selection)).status, 404)
  await prisma.paper.update({ where: { id: hidden.id }, data: { status: 'published', accessTier: 'member' } })
  assert.equal((await request(invalidUser.token, '/exams/start', selection)).status, 403)
  assert.equal(await prisma.examRecord.count({ where: { userId: invalidUser.id } }), 0)
  console.log('PASS invalid selections rejected before any answer record is created')

  const tmuaModules = ['paper1', 'paper2'].map((code, index) => ({
    code, subject: `Paper ${index + 1}`, subjectCode: `TMUA-P${index + 1}`, order: index + 1,
    durationSeconds: 4500, questionCount: 20,
  }))
  const tmua = await fixture(true, tmuaModules, EXAM_TYPE.TMUA)
  const tmuaUser = await account()
  const tmuaStart = await request(tmuaUser.token, '/exams/start', { paperId: tmua.id, moduleCodes: ['paper1', 'paper2'] })
  assert.equal(tmuaStart.status, 200, JSON.stringify(tmuaStart.body))
  assert.deepEqual(tmuaStart.body.data.modules.map((module: any) => module.code), ['paper1', 'paper2'])
  safeSession(tmuaStart.body.data)
  console.log('PASS TMUA retains both papers')

  const legacy = await fixture(false, modules.slice(0, 3))
  const legacyUser = await account()
  assert.equal((await request(legacyUser.token, '/exams/start', { paperId: legacy.id })).status, 410)
  const legacyQuestions = await prisma.question.findMany({ where: { paperId: legacy.id }, orderBy: { number: 'asc' } })
  const originalContent = legacyQuestions.map(formatQuestionDocument)
  // 模拟升级前已存在的连续计时答卷，旧结构必须能恢复和查看。
  await prisma.paper.update({ where: { id: legacy.id }, data: { deliveryMode: PAPER_DELIVERY_MODE.CONTINUOUS } })
  const oldRecord = await prisma.examRecord.create({ data: {
    userId: legacyUser.id, paperId: legacy.id, examType: EXAM_TYPE.ESAT, startedAt: new Date(),
    totalQuestions: legacyQuestions.length, answers: { create: legacyQuestions.map((question, position) => ({
      questionId: question.id, selectedAnswer: 'A', answerState: 'answered', isCorrect: true, position, durationSeconds: 12,
    })) },
  } })
  const restored = await request(legacyUser.token, '/exams/start', { paperId: legacy.id })
  assert.equal(restored.status, 200, JSON.stringify(restored.body))
  assert.equal(restored.body.data.examRecordId, oldRecord.id)
  assert.equal(Object.keys(restored.body.data.answers).length, legacyQuestions.length)
  // 直接设置本测试答卷完成状态，避免交卷唤醒全库报告 worker 干扰现存用户任务。
  await prisma.examRecord.update({ where: { id: oldRecord.id }, data: {
    status: EXAM_RECORD_STATUS.SUBMITTED, submittedAt: new Date(), correctCount: legacyQuestions.length, durationSeconds: 72,
  } })
  const historicalReport = { marker: prefix, originalScore: 9, originalAdvice: 'Preserve original report' }
  await prisma.diagnosticReportTask.create({ data: {
    examRecordId: oldRecord.id, userId: legacyUser.id, paperId: legacy.id, reportKind: EXAM_TYPE.ESAT,
    status: 'completed', result: historicalReport,
  } })
  await prisma.diagnosticReport.create({ data: {
    examRecordId: oldRecord.id, userId: legacyUser.id, paperId: legacy.id, reportKind: EXAM_TYPE.ESAT,
    result: historicalReport, completedAt: new Date(),
  } })
  const result = await request(legacyUser.token, `/exams/${oldRecord.id}/result`)
  assert.equal(result.status, 200, JSON.stringify(result.body))
  assert.equal(result.body.data.questions.length, legacyQuestions.length)
  for (const [index, question] of result.body.data.questions.entries()) {
    assert.equal(question.id, legacyQuestions[index]!.id)
    assert.equal(question.selectedAnswer, 'A')
    assert.deepEqual(question.answer, ['A'])
    assert.equal(question.learning_analysis.correct_solution, 'SECRET_CORRECT_SOLUTION')
  }
  const report = await request(legacyUser.token, `/exams/${oldRecord.id}/diagnostic-report/summary`)
  assert.equal(report.status, 200, JSON.stringify(report.body))
  assert.deepEqual(report.body.data.report, historicalReport)
  console.log('PASS legacy new-start blocked; existing session restored; original answers, analysis and report readable')

  // 普通归档保留历史；仅显式失效标记拦截所有历史内容入口，且先检查归属。
  const beforeArchivedTask = await prisma.diagnosticReportTask.findUniqueOrThrow({ where: { examRecordId: oldRecord.id } })
  await prisma.paper.update({ where: { id: legacy.id }, data: { status: 'archived' } })
  assert.equal((await request(legacyUser.token, `/exams/${oldRecord.id}/result`)).status, 200)
  assert.equal((await request(legacyUser.token, `/exams/${oldRecord.id}/diagnostic-report/summary`)).status, 200)
  await prisma.paper.update({ where: { id: legacy.id }, data: { assemblyType: DIAGNOSTIC_ASSEMBLY.LEGACY_EXPIRED } })
  for (const suffix of ['result', 'diagnostic-report/summary', 'diagnostic-report/status', 'diagnostic-report/retry', 'diagnostic-report/regenerate']) {
    const body = suffix.endsWith('/retry') || suffix.endsWith('/regenerate') ? {} : undefined
    const expired = await request(legacyUser.token, `/exams/${oldRecord.id}/${suffix}`, body)
    assert.equal(expired.status, 410)
    assert.equal(expired.body.code, 'DIAGNOSTIC_PAPER_EXPIRED')
    assert.equal(expired.body.errMsg, '当前试卷已失效，请查看最新版试卷')
    assert.equal((await request(invalidUser.token, `/exams/${oldRecord.id}/${suffix}`, body)).status, 404)
  }
  for (const path of [`/papers/assessment/years/2097/history?examType=ESAT`, `/papers/assessment/papers/${legacy.id}/history`]) {
    const history = await request(legacyUser.token, path)
    assert.equal(history.status, 200, JSON.stringify(history.body))
    assert.equal(history.body.data.list.find((row: any) => row.examRecordId === oldRecord.id)?.isExpired, true)
  }
  assert.deepEqual(await prisma.diagnosticReportTask.findUniqueOrThrow({ where: { examRecordId: oldRecord.id } }), beforeArchivedTask)
  assert.deepEqual((await prisma.diagnosticReport.findUniqueOrThrow({ where: { examRecordId: oldRecord.id } })).result, historicalReport)
  // 模考的归档状态不影响原有结果与报告读取。
  await prisma.paper.update({ where: { id: legacy.id }, data: { paperType: PAPER_TYPE.MOCK_PAPER } })
  assert.equal((await request(legacyUser.token, `/exams/${oldRecord.id}/result`)).status, 200)
  assert.equal((await request(legacyUser.token, `/exams/${oldRecord.id}/diagnostic-report/summary`)).status, 200)
  await prisma.paper.update({ where: { id: legacy.id }, data: { paperType: PAPER_TYPE.REAL_PAPER } })
  await prisma.paper.update({ where: { id: tmua.id }, data: { status: 'archived', assemblyType: DIAGNOSTIC_ASSEMBLY.LEGACY_EXPIRED } })
  const expiredTmua = await request(tmuaUser.token, `/exams/${tmuaStart.body.data.examRecordId}/result`)
  assert.equal(expiredTmua.body.code, 'DIAGNOSTIC_PAPER_EXPIRED')
  console.log('PASS only explicitly expired ESAT/TMUA history blocked; ordinary archived history, ownership and records preserved')

  const exported = await request(admin.token, `/papers/${annual.id}/document`)
  assert.equal(exported.status, 200, JSON.stringify(exported.body))
  const document = exported.body.data
  const versionUser = await account()
  const oldVersionSession = await request(versionUser.token, '/exams/start', {
    paperId: annual.id, moduleCodes: ['maths1', 'physics', 'biology'],
  })
  assert.equal(oldVersionSession.status, 200, JSON.stringify(oldVersionSession.body))
  const validation = await request(admin.token, '/papers/diagnostic/validate', document)
  assert.equal(validation.status, 200, JSON.stringify(validation.body))
  assert.equal(validation.body.data.questionCount, 10)
  const imported = await request(admin.token, '/papers/diagnostic/import', document)
  assert.ok([200, 201].includes(imported.status), JSON.stringify(imported.body))
  paperIds.push(imported.body.data.id)
  assert.notEqual(imported.body.data.id, annual.id)
  assert.equal(await prisma.question.count({ where: { paperId: annual.id } }), 10)
  const published = await request(admin.token, `/papers/${imported.body.data.id}/publish`, {}, 'PUT')
  assert.equal(published.status, 200, JSON.stringify(published.body))
  const retired = await prisma.paper.findUniqueOrThrow({ where: { id: annual.id } })
  assert.equal(retired.assemblyType, DIAGNOSTIC_ASSEMBLY.RETIRED)
  const resumedOldVersion = await request(versionUser.token, '/exams/start', { paperId: annual.id })
  assert.equal(resumedOldVersion.status, 200, JSON.stringify(resumedOldVersion.body))
  assert.equal(resumedOldVersion.body.data.examRecordId, oldVersionSession.body.data.examRecordId)
  assert.deepEqual(resumedOldVersion.body.data.modules, oldVersionSession.body.data.modules)
  const exportedOld = await request(admin.token, `/papers/${annual.id}/document`)
  assert.deepEqual(exportedOld.body.data.questions, document.questions)
  const afterLegacy = await prisma.question.findMany({ where: { paperId: legacy.id }, orderBy: { number: 'asc' } })
  assert.deepEqual(afterLegacy.map(formatQuestionDocument), originalContent)
  const studentExport = await request(invalidUser.token, `/papers/${annual.id}/document`)
  assert.equal(studentExport.status, 403)
  const studentImport = await request(invalidUser.token, '/papers/diagnostic/import', document)
  assert.equal(studentImport.status, 403)
  console.log('PASS canonical export/import validation, new-version isolation and administrative access controls')
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  await prisma.examRecord.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.paper.deleteMany({ where: { id: { in: paperIds } } })
  await prisma.$disconnect()
}
