// 历史年度关联迁移回归：仅操作随机测试夹具，通过真实数据库与 HTTP 验证无损迁移。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { once } from 'node:events'
import express from 'express'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { signAccessToken } from '../src/services/jwt.js'
import { createDiagnosticHistoryMigrationPlan, applyDiagnosticHistoryMigrationPlan } from '../src/services/diagnosticHistoryMigration.js'
import { buildModuleExamSnapshot, moduleSnapshotJson } from '../src/services/moduleExamSession.js'
import { syncPaperQuestions } from '../src/utils/questionSync.js'
import { papersRouter } from '../src/routes/papers.js'
import { examRouter } from '../src/routes/exam.js'
import { globalErrorHandler } from '../src/middleware/error.js'
import { DIAGNOSTIC_ASSEMBLY, EXAM_TYPE, PAPER_TYPE, PAPER_DELIVERY_MODE, EXAM_RECORD_STATUS, EXAM_PHASE } from '../src/constants/domain.js'

if (config.runtimeEnv !== 'local' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
  throw new Error('History migration regression requires the local development database')
}
const prefix = `historyqa-${crypto.randomUUID()}`
const users: string[] = []
const papers: string[] = []
const app = express()
app.use(express.json())
app.use('/api/exams', examRouter)
app.use('/api/papers', papersRouter)
app.use(globalErrorHandler)
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address !== 'string')
const base = `http://127.0.0.1:${address.port}/api`

// 数据比较统一日期表示，避免把 Prisma Date 与 HTTP 字符串差异当成内容变化。
function json(value: unknown): any { return JSON.parse(JSON.stringify(value)) }
// 对于允许变动的引用列显式排除，其余所有旧值必须保持。
function without(value: any, keys: string[]): any {
  return Object.fromEntries(Object.entries(json(value)).filter(([key]) => !keys.includes(key)))
}

// 每个认证上下文都由本测试创建，不读取任何真实用户的会话。
async function account() {
  const username = `hqa${crypto.randomBytes(8).toString('hex')}`
  const user = await prisma.user.create({ data: { username, email: `${username}@example.invalid`, password: 'unused-test-password' } })
  users.push(user.id)
  const session = await prisma.authSession.create({ data: {
    userId: user.id, refreshTokenHash: crypto.randomBytes(32).toString('hex'), expiresAt: new Date(Date.now() + 3600000),
  } })
  return { id: user.id, token: signAccessToken(user, session.id) }
}

// HTTP 只验证本测试用户有权访问的结果和会话，不触发任何报告生成。
async function get(token: string, route: string) {
  const response = await fetch(base + route, { headers: { authorization: `Bearer ${token}` } })
  return { status: response.status, body: await response.json() as any }
}

// 新旧卷共享来源与完整内容，只有卷内顺序、归属和系统 ID 不同。
async function paper(examType: string, year: number, codes: string[], annual: boolean, continuous = false, archived = false) {
  const moduleConfig = codes.map((code, index) => ({
    code, subject: code, subjectCode: code, order: index + 1,
    questionCount: examType === EXAM_TYPE.TMUA ? 20 : 2,
    durationSeconds: examType === EXAM_TYPE.TMUA ? 4500 : 2400,
  }))
  const row = await prisma.paper.create({ data: {
    id: `${prefix}-${papers.length}`, code: `${prefix}-${papers.length}`, title: `${prefix} ${codes.join('/')}`,
    examType, year, paperType: PAPER_TYPE.REAL_PAPER, status: archived ? 'archived' : 'published', accessTier: 'free',
    assemblyType: annual ? DIAGNOSTIC_ASSEMBLY.ANNUAL : 'fixed', duration: 120,
    deliveryMode: continuous ? PAPER_DELIVERY_MODE.CONTINUOUS : PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
    breakDurationSeconds: examType === EXAM_TYPE.TMUA ? 0 : 180, moduleConfig,
    totalQuestions: moduleConfig.reduce((sum, module) => sum + module.questionCount, 0),
  } })
  papers.push(row.id)
  let number = 0
  await syncPaperQuestions(row.id, moduleConfig.flatMap((module) => Array.from({ length: module.questionCount }, (_, index) => ({
    code: `${prefix}-${year}-${module.code}-${index + 1}`, examType, year, source_examType: examType,
    number: ++number, module_code: module.code, module_order: module.order, module_question_number: index + 1,
    title: `${year} ${module.code} ${index + 1}`, subject: module.subject, subject_code: module.subjectCode,
    question_type: 'single_choice', difficulty: 'medium', knowledge_points: [],
    content_blocks: [{ type: 'paragraph', text: `Question ${module.code} ${index + 1}` }],
    images: [], options: [{ label: 'A', text: 'Answer A' }, { label: 'B', text: 'Answer B' }], answer: ['A'],
    learning_analysis: { correct_solution: `Original explanation ${module.code} ${index + 1}`,
      exam_focus: 'Original focus', common_error_causes: ['Original error'], review_guidance: 'Original advice' },
  }))))
  return { row, questions: await prisma.question.findMany({ where: { paperId: row.id }, orderBy: { number: 'asc' } }) }
}

// 历史答卷含固定 ID 的答案及原始时间，迁移必须只重定向关系而保留事实记录。
async function record(userId: string, source: Awaited<ReturnType<typeof paper>>, submitted = true, moduleSnapshot = true, nullPositions = false) {
  const startedAt = new Date(Date.now() - 120000)
  const snapshot = moduleSnapshot ? moduleSnapshotJson(buildModuleExamSnapshot(source.row, source.questions)) : undefined
  return prisma.examRecord.create({ data: {
    userId, paperId: source.row.id, examType: source.row.examType,
    totalQuestions: source.questions.length, correctCount: source.questions.length - 1,
    startedAt, submittedAt: submitted ? new Date(startedAt.getTime() + 65000) : null, durationSeconds: 65,
    status: submitted ? EXAM_RECORD_STATUS.SUBMITTED : EXAM_RECORD_STATUS.IN_PROGRESS,
    structureSnapshot: snapshot, phase: moduleSnapshot ? EXAM_PHASE.ANSWERING : EXAM_PHASE.CONTINUOUS,
    phaseStartedAt: startedAt, phaseExpiresAt: new Date(Date.now() + 2400000), expiresAt: new Date(Date.now() + 2400000),
    answers: { create: source.questions.map((question, index) => ({
      questionId: question.id, selectedAnswer: index === 0 ? 'B' : 'A', isCorrect: index !== 0,
      answerState: 'answered', position: nullPositions ? null : index, durationSeconds: index + 2,
      answeredAt: new Date(startedAt.getTime() + index * 1000),
    })) },
  }, include: { answers: { orderBy: { position: 'asc' } } } })
}

// 读自己的夹具用于全表无写入断言，覆盖错题收藏与报告，不纳入认证中间件活动时间。
async function snapshot() {
  const models = ['paper', 'question', 'examRecord', 'answerRecord', 'diagnosticReport', 'diagnosticReportTask', 'wrongQuestionSummary', 'wrongQuestionAttempt', 'questionFavorite']
  const result: Record<string, any[]> = {}
  for (const model of models) {
    const where = model === 'paper' ? { id: { in: papers } }
      : model === 'question' ? { paperId: { in: papers } }
      : model === 'answerRecord' ? { examRecord: { userId: { in: users } } }
      : { userId: { in: users } }
    result[model] = json(await (prisma as any)[model].findMany({ where, orderBy: { id: 'asc' } }))
  }
  return result
}

try {
  assert.equal(await prisma.paper.count({ where: { year: { in: [2093, 2094, 2095] } } }), 0, 'Test years already occupied')
  const student = await account()
  const outsider = await account()
  const old = await paper(EXAM_TYPE.ESAT, 2094, ['physics', 'maths1', 'biology'], false)
  const annual = await paper(EXAM_TYPE.ESAT, 2094, ['maths1', 'maths2', 'physics', 'chemistry', 'biology'], true)
  const continuous = await paper(EXAM_TYPE.ESAT, 2094, ['maths1', 'chemistry', 'maths2'], false, true)
  const expired = await paper(EXAM_TYPE.ESAT, 2094, ['maths1', 'maths2', 'physics'], false, false, true)
  const oldTmua = await paper(EXAM_TYPE.TMUA, 2095, ['paper1', 'paper2'], false)
  const annualTmua = await paper(EXAM_TYPE.TMUA, 2095, ['paper1', 'paper2'], true)
  const historical = await record(student.id, old)
  const continuousRecord = await record(student.id, continuous, false, false, true)
  const pausedUser = await account()
  const pausedRecord = await record(pausedUser.id, old, false)
  await prisma.examRecord.update({ where: { id: pausedRecord.id }, data: {
    phase: EXAM_PHASE.BREAK_PAUSED, currentModuleIndex: 1, phaseStartedAt: new Date(),
    phaseExpiresAt: new Date(Date.now() + 120000), expiresAt: null,
  } })
  const answeringUser = await account()
  const answeringRecord = await record(answeringUser.id, old, false)
  await prisma.examRecord.update({ where: { id: answeringRecord.id }, data: {
    phase: EXAM_PHASE.PAUSED, currentModuleIndex: 0, phaseStartedAt: new Date(),
    phaseExpiresAt: new Date(Date.now() + 120000), expiresAt: null,
  } })
  const tmuaRecord = await record(student.id, oldTmua)
  const expiredRecord = await record(student.id, expired)
  const expectedReport = { originalScore: 8.2, advice: 'Do not regenerate', year: 2094 }
  const report = await prisma.diagnosticReport.create({ data: {
    userId: student.id, paperId: old.row.id, examRecordId: historical.id, reportKind: 'esat', result: expectedReport,
    sourceSnapshot: { paperId: old.row.id, questions: old.questions.map((q) => ({ questionId: q.id, score: 1, originalText: q.title })) },
    completedAt: new Date(),
  } })
  await prisma.diagnosticReportTask.create({ data: {
    userId: student.id, paperId: old.row.id, examRecordId: historical.id, reportKind: 'esat', status: 'completed', result: expectedReport,
  } })
  const wrong = historical.answers.find((answer) => answer.selectedAnswer === 'B')!
  const summary = await prisma.wrongQuestionSummary.create({ data: {
    userId: student.id, questionId: wrong.questionId, examType: EXAM_TYPE.ESAT,
    firstWrongAt: historical.startedAt, latestWrongAt: historical.submittedAt!,
    latestAnswerRecordId: wrong.id, latestExamRecordId: historical.id,
    latestSelectedAnswer: 'B', latestDurationSeconds: wrong.durationSeconds,
    latestPaperType: PAPER_TYPE.REAL_PAPER, latestPaperTitle: old.row.title,
  } })
  await prisma.wrongQuestionAttempt.create({ data: {
    summaryId: summary.id, userId: student.id, questionId: wrong.questionId, answerRecordId: wrong.id,
    examRecordId: historical.id, examType: EXAM_TYPE.ESAT, paperType: PAPER_TYPE.REAL_PAPER,
    submittedAt: historical.submittedAt!, selectedAnswer: 'B',
  } })
  await prisma.questionFavorite.create({ data: { userId: student.id, questionId: wrong.questionId } })
  const scope = [old.row.id, continuous.row.id, expired.row.id, oldTmua.row.id]
  // 新版解析、知识分类和段落排版允许更新，历史查看必须实际读取新版解析。
  for (const target of [annual, annualTmua]) {
    for (const question of target.questions) {
      const content = question.content as any
      const updated = await prisma.question.update({ where: { id: question.id }, data: {
        solution: { ...(question.solution as any), correctSolution: `Updated explanation ${question.moduleCode} ${question.moduleQuestionNumber}` },
        topic: 'Updated classification',
        content: { ...content, blocks: content.blocks.map((block: any) => ({ ...block, inline: true })) },
      } })
      Object.assign(question, updated)
    }
  }
  const before = await snapshot()
  const defaultPlan = await createDiagnosticHistoryMigrationPlan(prisma, scope)
  assert.deepEqual(defaultPlan.expiredPaperIds, [], 'archive status alone must never expire history')
  assert.ok(!defaultPlan.backup.papers.some(p => p.id === expired.row.id))
  const unclassifiedHistory = await get(student.token, `/exams/${expiredRecord.id}/result`)
  assert.equal(unclassifiedHistory.status, 200, 'unclassified archived history remains readable')
  await assert.rejects(() => createDiagnosticHistoryMigrationPlan(prisma, scope, { expiredPaperIds: [old.row.id] }), 'published papers must not be accepted as expired')
  const expiryOptions = { expiredPaperIds: [expired.row.id] }
  let plan = await createDiagnosticHistoryMigrationPlan(prisma, scope, expiryOptions)
  assert.deepEqual(await snapshot(), before, 'dry-run mutated fixture data')
  assert.equal(plan.version, 2)
  await assert.rejects(() => applyDiagnosticHistoryMigrationPlan({ ...plan, version: 1 } as any, prisma), 'legacy plans inferred from archive status must require a fresh audit')
  assert.ok(plan.papers.every((p) => scope.includes(p.sourcePaperId)))
  assert.deepEqual(plan.expiredPaperIds, [expired.row.id])
  const esatMap = plan.papers.find((p) => p.sourcePaperId === old.row.id)!
  assert.equal(esatMap.targetPaperId, annual.row.id)
  const questionMap = new Map(plan.papers.flatMap((p) => p.questions.map((q) => [q.sourceQuestionId, q.questionId] as const)))
  console.log('PASS scoped dry-run is read-only and maps original subject order to annual subjects')

  const alteredMapping = structuredClone(plan)
  alteredMapping.papers[0]!.questions[0]!.questionId = alteredMapping.papers[0]!.questions[1]!.questionId
  await assert.rejects(() => applyDiagnosticHistoryMigrationPlan(alteredMapping, prisma), 'altered target mapping must not bypass the backup fingerprint')
  const alteredScope = structuredClone(plan)
  alteredScope.expiredPaperIds = []
  await assert.rejects(() => applyDiagnosticHistoryMigrationPlan(alteredScope, prisma), 'expired batch must remain fixed')
  assert.deepEqual(await snapshot(), before, 'invalid plans must leave all fixture rows unchanged')

  const changedQuestion = annual.questions[0]!
  for (const data of [
    { solution: { ...(changedQuestion.solution as any), answer: ['B'] } },
    { content: { ...(changedQuestion.content as any), options: [{ label: 'A', text: 'Different option' }] } },
    { content: { ...(changedQuestion.content as any), blocks: [{ type: 'paragraph', text: 'Different question' }] } },
  ]) {
    await prisma.question.update({ where: { id: changedQuestion.id }, data })
    await assert.rejects(() => createDiagnosticHistoryMigrationPlan(prisma, scope, expiryOptions), 'changed question or grading must refuse migration')
    await prisma.question.update({ where: { id: changedQuestion.id }, data: {
      solution: changedQuestion.solution!, content: changedQuestion.content!, updatedAt: changedQuestion.updatedAt,
    } })
  }
  await prisma.question.update({ where: { id: changedQuestion.id }, data: { title: `${changedQuestion.title} CHANGED` } })
  await assert.rejects(() => createDiagnosticHistoryMigrationPlan(prisma, scope, expiryOptions), 'different content must refuse migration')
  await assert.rejects(() => applyDiagnosticHistoryMigrationPlan(plan, prisma), 'stale plan must refuse migration')
  assert.equal((await prisma.examRecord.findUniqueOrThrow({ where: { id: historical.id } })).paperId, old.row.id)
  await prisma.question.update({ where: { id: changedQuestion.id }, data: { title: changedQuestion.title, updatedAt: changedQuestion.updatedAt } })
  console.log('PASS content differences and concurrent edits reject migration without partial reference updates')

  const otherCategory = await prisma.favoriteCategory.create({ data: { userId: student.id, examType: EXAM_TYPE.ESAT, name: 'Keep this distinct category' } })
  const duplicateFavorite = await prisma.questionFavorite.create({ data: { userId: student.id, questionId: questionMap.get(wrong.questionId)!, categoryId: otherCategory.id } })
  await assert.rejects(async () => {
    const conflicted = await createDiagnosticHistoryMigrationPlan(prisma, scope, expiryOptions)
    await applyDiagnosticHistoryMigrationPlan(conflicted, prisma)
  }, 'favorites with different categories must refuse without silently deleting either item')
  assert.equal(await prisma.questionFavorite.count({ where: { userId: student.id } }), 2)
  assert.equal((await prisma.examRecord.findUniqueOrThrow({ where: { id: historical.id } })).paperId, old.row.id)
  await prisma.questionFavorite.delete({ where: { id: duplicateFavorite.id } })
  const foreignRecord = await prisma.examRecord.create({ data: {
    userId: outsider.id, paperId: annual.row.id, examType: EXAM_TYPE.ESAT, startedAt: new Date(),
    answers: { create: { questionId: wrong.questionId, selectedAnswer: 'B' } },
  } })
  await assert.rejects(() => createDiagnosticHistoryMigrationPlan(prisma, scope, expiryOptions), 'questions used by an unrelated paper must not be silently reassigned')
  await prisma.examRecord.delete({ where: { id: foreignRecord.id } })
  // 与维护脚本一致，验证落盘后日期成为字符串的计划仍可安全应用。
  plan = JSON.parse(JSON.stringify(await createDiagnosticHistoryMigrationPlan(prisma, scope, expiryOptions)))
  await applyDiagnosticHistoryMigrationPlan(plan, prisma)
  const after = await snapshot()
  assert.deepEqual(after.question, before.question, 'reference migration must not rewrite any original or annual question')
  await applyDiagnosticHistoryMigrationPlan(plan, prisma)
  assert.deepEqual(await snapshot(), after, 'reapplying the completed plan must be idempotent')
  console.log('PASS favorite conflict blocks loss; completed migration is idempotent')

  for (const table of ['examRecord', 'answerRecord', 'diagnosticReport', 'diagnosticReportTask', 'wrongQuestionSummary', 'wrongQuestionAttempt', 'questionFavorite']) {
    assert.equal(after[table]!.length, before[table]!.length, `${table}: rows removed`)
    const refs = table === 'examRecord' ? ['paperId', 'structureSnapshot']
      : table === 'answerRecord' ? ['questionId', 'position']
      : table === 'diagnosticReport' ? ['paperId', 'sourceSnapshot']
      : table === 'diagnosticReportTask' ? ['paperId'] : ['questionId']
    for (const row of before[table]!) {
      const migrated = after[table]!.find((item) => item.id === row.id)
      assert.ok(migrated, `${table}: old ID removed`)
      assert.deepEqual(without(migrated, refs), without(row, refs), `${table}: non-reference data changed`)
      if (table === 'answerRecord' && row.position !== null) assert.equal(migrated.position, row.position)
    }
  }
  const migratedRecord = await prisma.examRecord.findUniqueOrThrow({ where: { id: historical.id } })
  assert.equal(migratedRecord.paperId, annual.row.id)
  const frozen = json(migratedRecord.structureSnapshot)
  assert.deepEqual(frozen.modules.map((module: any) => module.code), ['physics', 'maths1', 'biology'])
  assert.deepEqual(frozen.modules.flatMap((module: any) => module.questionIds), old.questions.map((q) => questionMap.get(q.id)))
  assert.equal((await prisma.examRecord.findUniqueOrThrow({ where: { id: tmuaRecord.id } })).paperId, annualTmua.row.id)
  const migratedReport = await prisma.diagnosticReport.findUniqueOrThrow({ where: { id: report.id } })
  assert.deepEqual(json(migratedReport.result), expectedReport)
  assert.equal(json(migratedReport.sourceSnapshot).paperId, annual.row.id)
  assert.deepEqual(json(migratedReport.sourceSnapshot).questions.map((q: any) => q.questionId), old.questions.map((q) => questionMap.get(q.id)))
  assert.equal((await prisma.wrongQuestionSummary.findUniqueOrThrow({ where: { id: summary.id } })).questionId, questionMap.get(wrong.questionId))
  assert.equal((await prisma.paper.findUniqueOrThrow({ where: { id: expired.row.id } })).assemblyType, DIAGNOSTIC_ASSEMBLY.LEGACY_EXPIRED)
  assert.equal((await prisma.examRecord.findUniqueOrThrow({ where: { id: expiredRecord.id } })).paperId, expired.row.id)
  console.log('PASS record/answer IDs, scores, timings, reports, wrong-question history and favorites preserved')

  const result = await get(student.token, `/exams/${historical.id}/result`)
  assert.equal(result.status, 200, JSON.stringify(result.body))
  assert.deepEqual(result.body.data.questions.map((q: any) => q.id), old.questions.map((q) => questionMap.get(q.id)))
  assert.deepEqual(result.body.data.questions.map((q: any) => q.originalQuestionId), old.questions.map((q) => q.id))
  assert.deepEqual(result.body.data.questions.map((q: any) => q.module_code), old.questions.map((q) => q.moduleCode))
  assert.deepEqual(result.body.data.questions.map((q: any) => q.number), old.questions.map((q) => q.number))
  for (const [index, q] of result.body.data.questions.entries()) {
    assert.equal(q.title, old.questions[index]!.title)
    assert.deepEqual(q.answer, ['A'])
    assert.equal(q.selectedAnswer, index === 0 ? 'B' : 'A')
    assert.equal(q.learning_analysis.correct_solution, `Updated explanation ${old.questions[index]!.moduleCode} ${old.questions[index]!.moduleQuestionNumber}`)
  }
  const reportHttp = await get(student.token, `/exams/${historical.id}/diagnostic-report/summary`)
  assert.equal(reportHttp.status, 200, JSON.stringify(reportHttp.body))
  assert.deepEqual(reportHttp.body.data.report, expectedReport)
  const continuousHttp = await get(student.token, `/exams/${continuousRecord.id}/session`)
  assert.equal(continuousHttp.status, 200, JSON.stringify(continuousHttp.body))
  assert.equal((await prisma.examRecord.findUniqueOrThrow({ where: { id: continuousRecord.id } })).phase, EXAM_PHASE.CONTINUOUS)
  assert.equal(continuousHttp.body.data.expiresAt, continuousRecord.expiresAt!.toISOString())
  assert.equal(continuousHttp.body.data.questions.length, continuous.questions.length)
  assert.deepEqual(continuousHttp.body.data.questions.map((q: any) => q.id), continuous.questions.map((q) => questionMap.get(q.id)))
  assert.equal(JSON.stringify(continuousHttp.body).includes('Original explanation'), false)
  const pausedHttp = await get(pausedUser.token, `/exams/${pausedRecord.id}/session`)
  assert.equal(pausedHttp.status, 200, JSON.stringify(pausedHttp.body))
  assert.equal(pausedHttp.body.data.phase, EXAM_PHASE.BREAK)
  assert.equal(pausedHttp.body.data.currentModuleIndex, 1)
  assert.deepEqual(pausedHttp.body.data.modules.map((module: any) => module.code), ['physics', 'maths1', 'biology'])
  const answeringHttp = await get(answeringUser.token, `/exams/${answeringRecord.id}/session`)
  assert.equal(answeringHttp.status, 200, JSON.stringify(answeringHttp.body))
  assert.equal(answeringHttp.body.data.phase, EXAM_PHASE.ANSWERING)
  assert.equal(answeringHttp.body.data.currentModule.code, 'physics')
  assert.deepEqual(answeringHttp.body.data.questions.map((q: any) => q.id), old.questions.slice(0, 2).map((q) => questionMap.get(q.id)))
  const history = await get(student.token, '/papers/assessment/years/2094/history?examType=ESAT')
  assert.equal(history.status, 200, JSON.stringify(history.body))
  const entry = history.body.data.list.find((item: any) => item.examRecordId === historical.id)
  assert.equal(entry.isExpired, false)
  assert.deepEqual(entry.modules.map((module: any) => module.code), ['physics', 'maths1', 'biology'])
  assert.equal((await get(student.token, `/exams/${expiredRecord.id}/result`)).status, 410)
  assert.equal((await get(outsider.token, `/exams/${historical.id}/result`)).status, 404)
  await prisma.paper.update({ where: { id: annual.row.id }, data: { status: 'archived', assemblyType: DIAGNOSTIC_ASSEMBLY.RETIRED } })
  assert.equal((await get(student.token, `/exams/${historical.id}/result`)).status, 200)
  assert.equal((await get(student.token, `/exams/${historical.id}/diagnostic-report/summary`)).status, 200)
  console.log('PASS HTTP history/results/reports/continuous resume; only explicitly expired legacy is blocked; ownership isolated')

  // 仅删除本测试已迁移源卷，证明历史运行时不再查询旧卷/旧题，真实数据审计不执行删除。
  const beforeSourceDeletion = await snapshot()
  const sourcePaperIds = [old.row.id, continuous.row.id, oldTmua.row.id]
  const sourceQuestionIds = [old, continuous, oldTmua].flatMap(source => source.questions.map(q => q.id))
  await prisma.paper.deleteMany({ where: { id: { in: sourcePaperIds } } })
  assert.equal(await prisma.question.count({ where: { id: { in: sourceQuestionIds } } }), 0)
  const afterSourceDeletion = await snapshot()
  for (const table of ['examRecord', 'answerRecord', 'diagnosticReport', 'diagnosticReportTask', 'wrongQuestionSummary', 'wrongQuestionAttempt', 'questionFavorite']) {
    assert.deepEqual(afterSourceDeletion[table], beforeSourceDeletion[table], `${table}: deleting migrated source papers must preserve all user data`)
  }
  const resultAfterDeletion = await get(student.token, `/exams/${historical.id}/result`)
  assert.equal(resultAfterDeletion.status, 200)
  assert.deepEqual(resultAfterDeletion.body.data.questions, result.body.data.questions)
  assert.deepEqual((await get(student.token, `/exams/${historical.id}/diagnostic-report/summary`)).body.data.report, expectedReport)
  assert.equal((await get(student.token, `/exams/${tmuaRecord.id}/result`)).status, 200)
  assert.equal((await get(student.token, `/exams/${continuousRecord.id}/session`)).status, 200)
  assert.equal((await get(pausedUser.token, `/exams/${pausedRecord.id}/session`)).status, 200)
  assert.equal((await get(answeringUser.token, `/exams/${answeringRecord.id}/session`)).status, 200)
  const historyAfterDeletion = await get(student.token, '/papers/assessment/years/2094/history?examType=ESAT')
  assert.equal(historyAfterDeletion.status, 200)
  const retainedHistory = historyAfterDeletion.body.data.list.find((item: any) => item.examRecordId === historical.id)
  assert.deepEqual(retainedHistory, entry)
  console.log('PASS deleting migrated source fixture papers/questions preserves records, reports, old question aliases, history and ESAT/TMUA resume')

  const mergeUser = await account()
  const mergeFirst = await paper(EXAM_TYPE.ESAT, 2093, ['physics', 'maths1', 'biology'], false)
  const mergeSecond = await paper(EXAM_TYPE.ESAT, 2093, ['physics', 'maths1', 'chemistry'], false)
  const mergeAnnual = await paper(EXAM_TYPE.ESAT, 2093, ['maths1', 'maths2', 'physics', 'chemistry', 'biology'], true)
  const mergeRecordFirst = await record(mergeUser.id, mergeFirst)
  const mergeRecordSecond = await record(mergeUser.id, mergeSecond)
  const related = []
  for (const item of [mergeRecordFirst, mergeRecordSecond]) {
    const answer = item.answers.find((row) => row.selectedAnswer === 'B')!
    const oldSummary = await prisma.wrongQuestionSummary.create({ data: {
      userId: mergeUser.id, questionId: answer.questionId, examType: EXAM_TYPE.ESAT,
      firstWrongAt: item.startedAt, latestWrongAt: item.submittedAt!,
      latestAnswerRecordId: answer.id, latestExamRecordId: item.id, latestSelectedAnswer: 'B',
      latestDurationSeconds: answer.durationSeconds, latestPaperType: PAPER_TYPE.REAL_PAPER, latestPaperTitle: 'Original paper title',
    } })
    const attempt = await prisma.wrongQuestionAttempt.create({ data: {
      summaryId: oldSummary.id, userId: mergeUser.id, questionId: answer.questionId,
      answerRecordId: answer.id, examRecordId: item.id, examType: EXAM_TYPE.ESAT,
      paperType: PAPER_TYPE.REAL_PAPER, submittedAt: item.submittedAt!, selectedAnswer: 'B',
    } })
    const favorite = await prisma.questionFavorite.create({ data: { userId: mergeUser.id, questionId: answer.questionId } })
    related.push({ summary: oldSummary, attempt, favorite })
  }
  const mergePlan = await createDiagnosticHistoryMigrationPlan(prisma, [mergeFirst.row.id, mergeSecond.row.id])
  await applyDiagnosticHistoryMigrationPlan(mergePlan, prisma)
  const mergedSummary = await prisma.wrongQuestionSummary.findMany({ where: { userId: mergeUser.id } })
  assert.equal(mergedSummary.length, 1)
  assert.equal(mergedSummary[0]!.wrongCount, 2)
  assert.equal(mergedSummary[0]!.firstWrongAt.toISOString(), related[0]!.summary.firstWrongAt.toISOString())
  assert.equal(mergedSummary[0]!.latestWrongAt.toISOString(), related[1]!.summary.latestWrongAt.toISOString())
  const mergedAttempts = await prisma.wrongQuestionAttempt.findMany({ where: { userId: mergeUser.id }, orderBy: { id: 'asc' } })
  assert.equal(mergedAttempts.length, 2)
  assert.deepEqual(mergedAttempts.map((item) => item.id), related.map((item) => item.attempt.id).sort())
  for (const attempt of mergedAttempts) {
    const previous = related.find((item) => item.attempt.id === attempt.id)!.attempt
    assert.deepEqual(without(attempt, ['summaryId', 'questionId']), without(previous, ['summaryId', 'questionId']))
  }
  const mergedFavorite = await prisma.questionFavorite.findMany({ where: { userId: mergeUser.id } })
  assert.equal(mergedFavorite.length, 1)
  assert.equal(mergedFavorite[0]!.id, related[0]!.favorite.id)
  const annualPhysics = mergeAnnual.questions.find((q) => q.moduleCode === 'physics' && q.moduleQuestionNumber === 1)!
  assert.equal(mergedFavorite[0]!.questionId, annualPhysics.id)
  assert.equal(mergedSummary[0]!.questionId, annualPhysics.id)
  assert.ok(mergedAttempts.every((attempt) => attempt.questionId === annualPhysics.id))
  console.log('PASS duplicate source questions merge summary totals and date ranges while retaining every attempt ID and earliest same-category favorite')
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  await prisma.examRecord.deleteMany({ where: { userId: { in: users } } })
  await prisma.user.deleteMany({ where: { id: { in: users } } })
  await prisma.paper.deleteMany({ where: { id: { in: papers } } })
  await prisma.$disconnect()
}
