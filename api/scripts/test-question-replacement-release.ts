// 本地数据库回归：验证单项独立编号与版本、完整卷引用、旧共享运行载体和历史答卷隔离。
import assert from 'node:assert/strict'
import { randomInt, randomUUID } from 'node:crypto'
import { config } from 'dotenv'
import { Prisma } from '@prisma/client'

import {
  ESAT_MODULE, EXAM_RECORD_STATUS, EXAM_TYPE, MOCK_PAPER_MODULE_STATUS,
  MOCK_PAPER_STATUS, MOCK_PAPER_VALIDATION_STATUS,
  PAPER_DELIVERY_MODE, PAPER_TYPE, QUESTION_STATUS,
} from '../src/constants/domain.js'
import { prisma } from '../src/services/prisma.js'
import { QuestionReplacementReleaseError, releaseQuestionReplacementBatch } from '../src/services/questionReplacementRelease.js'
import { repairMockPaperQuestionReplacements } from '../src/services/mockPaperReplacementRepair.js'

config({ path: process.env.API_ENV_FILE || '.env' })

const fixturePrefix = `replacement-regression-${randomUUID()}`
const fixtureTime = new Date('2026-01-01T00:00:00.000Z')
let nextSequenceNo = randomInt(1_000_000_000, 1_900_000_000)
const createdPaperIds: string[] = []
const createdUserIds: string[] = []
const createdSeriesIds: string[] = []
const createdSetIds: string[] = []

type FixtureQuestion = { id: string; uniqueCode: string; examType: string; moduleCode: string }
type FixtureModule = {
  code: string
  questions: FixtureQuestion[]
  sourceModuleId?: string
  seriesId?: string
  version?: number
  publicationStatus?: string
  previouslyPublished?: boolean
  invalid?: boolean
}

const setInclude = {
  series: true,
  paper: true,
  modules: {
    orderBy: { moduleOrder: 'asc' as const },
    include: { series: true, questions: { orderBy: { position: 'asc' as const } } },
  },
} satisfies Prisma.MockPaperSetInclude
type FixtureSet = Prisma.MockPaperSetGetPayload<{ include: typeof setInclude }>

// 无论环境文件如何配置，数据库回归只允许显式命名的本机开发或测试数据库。
function assertLocalDatabase(): void {
  assert.ok(!['prod', 'production'].includes((process.env.API_RUNTIME_ENV || '').toLowerCase()))
  assert.notEqual(process.env.NODE_ENV, 'production')
  const database = new URL(process.env.DATABASE_URL || '')
  assert.equal(database.protocol, 'mysql:')
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(database.hostname), '回归拒绝连接非本机数据库')
  assert.match(database.pathname, /(?:dev|test)/i)
  assert.doesNotMatch(database.pathname, /prod/i)
}

// 测试系列使用独立 UUID 与高位序号，既验证编号池又避免触碰开发库已有资产。
async function createSeries(examType: string, kind: 'single' | 'full', moduleCode = '') {
  const series = await prisma.mockPaperSeries.create({
    data: { id: `${fixturePrefix}-${randomUUID()}`, examType, kind, moduleCode, sequenceNo: nextSequenceNo++ },
  })
  createdSeriesIds.push(series.id)
  return series
}

// 各考试使用正式题数与独立题号，避免共享测试题使不同场景相互影响。
async function createQuestions(moduleCode: string, examType: string = EXAM_TYPE.ESAT): Promise<FixtureQuestion[]> {
  const prefix = `${fixturePrefix}-${randomUUID()}`
  const questions = Array.from({ length: examType === EXAM_TYPE.TMUA ? 20 : 27 }, (_, index) => ({
    id: `${prefix}-${index + 1}`, uniqueCode: `${prefix}-${index + 1}`, examType, moduleCode,
  }))
  await prisma.question.createMany({ data: questions.map((question) => ({
    ...question, title: 'Choose the value of 1 + 1.', options: ['A. 2', 'B. 3'], answer: ['A'],
    questionType: 'single_choice', knowledgePoints: [], syllabusPoints: [], meta: {},
    status: QUESTION_STATUS.PUBLISHED, publishedAt: fixtureTime,
  })) })
  return questions
}

// 替换题逐版本建立真实关系，供正式发布和历史补修共用。
async function createReplacement(original: FixtureQuestion, revisionVersion = 2, status: string = QUESTION_STATUS.DRAFT) {
  const batch = await prisma.questionImportBatch.create({
    data: { title: fixturePrefix, declaredQuestionCount: 1, actualQuestionCount: 1 },
  })
  const question = await prisma.question.create({ data: {
    uniqueCode: `${original.uniqueCode}-V${revisionVersion}`,
    importBatchId: batch.id, replacesQuestionId: original.id, revisionVersion,
    examType: original.examType, moduleCode: original.moduleCode,
    title: 'Choose the value of 2 + 2.', options: ['A. 4', 'B. 5'], answer: ['A'],
    questionType: 'single_choice', knowledgePoints: [], syllabusPoints: [], meta: {}, status,
    publishedAt: status === QUESTION_STATUS.PUBLISHED ? fixtureTime : null,
  } })
  return { batch, question: { ...question, moduleCode: original.moduleCode } }
}

// 同一个夹具可表示隐藏来源、正式副本组合或共享 Paper 的旧多科原始容器。
async function createSet(label: string, modules: FixtureModule[], options: {
  hidden?: boolean
  status?: string
  runtime?: boolean
  runtimePublished?: boolean
  version?: number
  seriesId?: string
  versionGroupId?: string
  examType?: string
} = {}): Promise<FixtureSet> {
  const title = `${fixturePrefix} ${label}`
  const examType = options.examType || EXAM_TYPE.ESAT
  const durationSeconds = examType === EXAM_TYPE.TMUA ? 4500 : 2400
  const fullSeriesId = options.hidden ? null : options.seriesId || (await createSeries(examType, 'full')).id
  const singleSeriesIds: Array<string | null> = []
  for (const module of modules) {
    singleSeriesIds.push(module.sourceModuleId ? null : module.seriesId || (await createSeries(examType, 'single', module.code)).id)
  }
  let paperId: string | undefined
  if (options.runtime) {
    paperId = `${fixturePrefix}-paper-${randomUUID()}`
    createdPaperIds.push(paperId)
    await prisma.paper.create({ data: {
      id: paperId, title, code: null, examType, year: 2026,
      duration: modules.length * durationSeconds / 60,
      totalQuestions: modules.reduce((sum, module) => sum + module.questions.length, 0),
      paperType: PAPER_TYPE.MOCK_PAPER, deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
      moduleConfig: modules.map((module, index) => ({
        code: module.code, subject: module.code, subjectCode: module.code, order: index + 1,
        durationSeconds, questionCount: module.questions.length,
      })),
      status: options.runtimePublished === false ? 'archived' : 'published',
    } })
  }
  const set = await prisma.mockPaperSet.create({ data: {
    title, examType, seriesId: fullSeriesId,
    versionGroupId: options.versionGroupId || fullSeriesId || randomUUID(),
    version: options.version || 1,
    status: options.status || MOCK_PAPER_STATUS.DRAFT,
    publishedAt: options.status === MOCK_PAPER_STATUS.PUBLISHED ? fixtureTime : null,
    paperId, deletedAt: options.hidden ? fixtureTime : null,
    issues: [], questionCount: modules.reduce((sum, module) => sum + module.questions.length, 0),
    modules: { create: modules.map((module, index) => ({
      code: module.code, label: module.code, title: `${title} ${module.code}`,
      sourceModuleId: module.sourceModuleId, seriesId: singleSeriesIds[index],
      version: module.sourceModuleId ? null : module.version || 1,
      moduleOrder: index + 1, durationSeconds,
      expectedQuestionCount: module.questions.length, questionCount: module.questions.length,
      validationStatus: module.invalid ? MOCK_PAPER_VALIDATION_STATUS.INVALID : MOCK_PAPER_VALIDATION_STATUS.VALID,
      publicationStatus: module.publicationStatus || MOCK_PAPER_MODULE_STATUS.DRAFT,
      publishedAt: module.previouslyPublished || module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED ? fixtureTime : null,
      archivedAt: module.publicationStatus === MOCK_PAPER_MODULE_STATUS.ARCHIVED ? fixtureTime : null,
      issueCount: module.invalid ? 1 : 0, issues: [],
      questions: { create: module.questions.map((question, position) => ({
        questionId: question.id, sourceCode: question.uniqueCode, position: position + 1,
        validationStatus: module.invalid && position === 0 ? MOCK_PAPER_VALIDATION_STATUS.INVALID : MOCK_PAPER_VALIDATION_STATUS.VALID,
        issues: module.invalid && position === 0 ? ['题目已归档'] : [],
      })) },
    })) },
  }, include: setInclude })
  createdSetIds.push(set.id)
  return set
}

// 历史答卷固定旧题与结构快照，之后使用完整对象比较验证没有被换题流程改写。
async function createHistoricalAttempt(paperId: string, questionId: string) {
  const user = await prisma.user.create({ data: {
    username: `${fixturePrefix}-${createdUserIds.length}`, email: `${randomUUID()}@example.test`, password: 'unused-regression-password',
  } })
  createdUserIds.push(user.id)
  return prisma.examRecord.create({ data: {
    userId: user.id, paperId, examType: EXAM_TYPE.ESAT, startedAt: fixtureTime, submittedAt: fixtureTime,
    totalQuestions: 1, correctCount: 1, status: EXAM_RECORD_STATUS.SUBMITTED,
    structureSnapshot: { questionIds: [questionId] },
    answers: { create: { questionId, selectedAnswer: 'A', isCorrect: true, position: 1 } },
  }, include: { answers: true } })
}

// 按稳定单项系列读取当前版本，完全不依赖它暂时放在哪个父容器。
async function latestSingle(seriesId: string) {
  return prisma.mockPaperModule.findFirstOrThrow({
    where: { seriesId, sourceModuleId: null }, orderBy: { version: 'desc' },
    include: { series: true, questions: { orderBy: { position: 'asc' } }, mockPaperSet: { include: { paper: true } } },
  })
}

// 完整卷只按自己的系列读取最高版本，避免与同序号单项混为一组。
async function latestFull(seriesId: string) {
  return prisma.mockPaperSet.findFirstOrThrow({ where: { seriesId }, orderBy: { version: 'desc' }, include: setInclude })
}

// 题目 ID、题号与逐题校验必须一起更新，不能只把模块标记为通过。
function assertValidReplacement(module: { validationStatus: string; issueCount: number; questions: Array<{ questionId: string | null; sourceCode: string; validationStatus: string }> }, replacement: FixtureQuestion) {
  assert.equal(module.validationStatus, MOCK_PAPER_VALIDATION_STATUS.VALID)
  assert.equal(module.issueCount, 0)
  assert.equal(module.questions[0]?.questionId, replacement.id)
  assert.equal(module.questions[0]?.sourceCode, replacement.uniqueCode)
  assert.ok(module.questions.every((item) => item.validationStatus === MOCK_PAPER_VALIDATION_STATUS.VALID))
}

// 独立单项只增加自身版本，未发布草稿原位更新，下线与历史答卷均保留。
async function testIndependentSingles(): Promise<void> {
  const questions = await createQuestions(ESAT_MODULE.MATHS_2)
  const { batch, question } = await createReplacement(questions[0])
  const series = await createSeries(EXAM_TYPE.ESAT, 'single', ESAT_MODULE.MATHS_2)
  const historical = await createSet('historical', [{ code: ESAT_MODULE.MATHS_2, questions, seriesId: series.id,
    publicationStatus: MOCK_PAPER_MODULE_STATUS.ARCHIVED }], { hidden: true })
  const current = await createSet('current', [{ code: ESAT_MODULE.MATHS_2, questions, seriesId: series.id,
    version: 2, invalid: true, publicationStatus: MOCK_PAPER_MODULE_STATUS.PUBLISHED }], { hidden: true, runtime: true })
  const draft = await createSet('draft', [{ code: ESAT_MODULE.MATHS_2, questions }], { hidden: true })
  const offline = await createSet('offline', [{ code: ESAT_MODULE.MATHS_2, questions,
    publicationStatus: MOCK_PAPER_MODULE_STATUS.ARCHIVED, previouslyPublished: true }], { hidden: true, runtime: true, runtimePublished: false })
  const attempt = await createHistoricalAttempt(offline.paperId!, questions[0].id)
  const result = await releaseQuestionReplacementBatch(batch.id)
  assert.equal(result.versionedMockPapers.length, 2)
  assert.equal(result.updatedDraftMockPaperCount, 1)
  const versioned = result.versionedMockPapers.find((item) => item.seriesId === series.id)!
  assert.equal(versioned.sequenceNo, `ESAT-MOCK-M2-${series.sequenceNo}-V3`)
  assert.ok(!('displayNo' in versioned))
  assert.ok(!('code' in versioned))
  const next = await latestSingle(series.id)
  assert.equal(next.version, 3)
  assert.equal(next.series?.sequenceNo, series.sequenceNo)
  assertValidReplacement(next, question)
  assert.equal(next.mockPaperSet.seriesId, null)
  assert.equal(next.mockPaperSet.paper?.totalQuestions, 27)
  assert.equal(next.mockPaperSet.paper?.status, 'published')
  const nextOffline = await latestSingle(offline.modules[0].seriesId!)
  assert.equal(nextOffline.publicationStatus, MOCK_PAPER_MODULE_STATUS.ARCHIVED)
  assert.equal(nextOffline.mockPaperSet.paper?.status, 'archived')
  assert.deepEqual(nextOffline.archivedAt, offline.modules[0].archivedAt)
  const sameDraft = await latestSingle(draft.modules[0].seriesId!)
  assert.equal(sameDraft.id, draft.modules[0].id)
  assert.equal(sameDraft.version, 1)
  assert.equal(sameDraft.mockPaperSet.paperId, null)
  assertValidReplacement(sameDraft, question)
  assert.deepEqual(await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: historical.id }, include: setInclude }), historical)
  const oldCurrent = await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: current.id }, include: setInclude })
  assert.deepEqual(oldCurrent.modules[0].questions, current.modules[0].questions)
  assert.equal(oldCurrent.paper?.status, 'archived')
  assert.deepEqual(await prisma.examRecord.findUniqueOrThrow({ where: { id: attempt.id }, include: { answers: true } }), attempt)
  const repeated = await releaseQuestionReplacementBatch(batch.id)
  assert.equal(repeated.versionedMockPapers.length, 0)
  assert.equal(repeated.updatedDraftMockPaperCount, 0)
  assert.equal(repeated.updatedQuestions, 0)
  console.log('Independent module series, offline state, history and idempotency passed.')
}

// 旧多科原始容器换掉一科后，其余科仍保留旧 ID、独立版本与共享 Paper 开考能力。
async function testLegacySharedPaper(): Promise<void> {
  const codes = [ESAT_MODULE.MATHS_1, ESAT_MODULE.MATHS_2, ESAT_MODULE.PHYSICS]
  const questions = await Promise.all(codes.map((code) => createQuestions(code)))
  const original = await createSet('shared-paper', codes.map((code, index) => ({
    code, questions: questions[index], publicationStatus: MOCK_PAPER_MODULE_STATUS.PUBLISHED,
  })), { status: MOCK_PAPER_STATUS.PUBLISHED, runtime: true })
  const attempt = await createHistoricalAttempt(original.paperId!, questions[2][0].id)
  const physics = await createReplacement(questions[2][0])
  const firstResult = await releaseQuestionReplacementBatch(physics.batch.id)
  assert.equal(firstResult.versionedMockPapers.filter((item) => item.kind === 'single').length, 1)
  assert.equal(firstResult.versionedMockPapers.filter((item) => item.kind === 'full').length, 1)
  assert.equal(firstResult.versionedMockPapers.find((item) => item.kind === 'full')?.sequenceNo,
    `ESAT-MOCK-${original.series!.sequenceNo}-V2`)
  assert.equal(firstResult.versionedMockPapers.find((item) => item.kind === 'single')?.sequenceNo,
    `ESAT-MOCK-P-${original.modules[2].series!.sequenceNo}-V2`)
  const nextPhysics = await latestSingle(original.modules[2].seriesId!)
  const fullV2 = await latestFull(original.seriesId!)
  assert.equal(fullV2.version, 2)
  assert.equal(fullV2.series?.sequenceNo, original.series?.sequenceNo)
  assert.equal(nextPhysics.version, 2)
  assertValidReplacement(nextPhysics, physics.question)
  assert.deepEqual(fullV2.modules.map((module) => module.sourceModuleId), [original.modules[0].id, original.modules[1].id, nextPhysics.id])
  assert.ok(fullV2.modules.every((module) => module.seriesId === null && module.version === null))
  let oldOwner = await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: original.id }, include: setInclude })
  assert.equal(oldOwner.status, MOCK_PAPER_STATUS.ARCHIVED)
  assert.equal(oldOwner.paper?.status, 'published')
  assert.equal(oldOwner.paper?.totalQuestions, 54)
  assert.equal((await latestSingle(original.modules[0].seriesId!)).id, original.modules[0].id)
  assert.equal((await latestSingle(original.modules[1].seriesId!)).id, original.modules[1].id)
  assert.deepEqual(oldOwner.modules.map((module) => module.questions), original.modules.map((module) => module.questions))

  // 数学 2 的父完整卷已经归档且当前完整卷为 V2，仍须按数学 2 自己的系列继续换版。
  const maths2 = await createReplacement(questions[1][0])
  const secondResult = await releaseQuestionReplacementBatch(maths2.batch.id)
  assert.equal(secondResult.versionedMockPapers.length, 2)
  const nextMaths2 = await latestSingle(original.modules[1].seriesId!)
  const fullV3 = await latestFull(original.seriesId!)
  assert.equal(nextMaths2.version, 2)
  assert.equal(fullV3.version, 3)
  assert.equal((await latestSingle(original.modules[2].seriesId!)).id, nextPhysics.id)
  assert.equal((await latestSingle(original.modules[0].seriesId!)).id, original.modules[0].id)
  assert.deepEqual(fullV3.modules.map((module) => module.sourceModuleId), [original.modules[0].id, nextMaths2.id, nextPhysics.id])
  assert.equal(fullV3.paper?.status, 'published')
  assert.equal(fullV3.paper?.totalQuestions, 81)
  oldOwner = await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: original.id }, include: setInclude })
  assert.equal(oldOwner.paper?.status, 'published')
  assert.equal(oldOwner.paper?.totalQuestions, 27)
  assert.deepEqual(oldOwner.modules.map((module) => module.questions), original.modules.map((module) => module.questions))
  const oldV2 = await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: fullV2.id }, include: setInclude })
  assert.equal(oldV2.paper?.status, 'archived')
  assert.deepEqual(oldV2.modules, fullV2.modules)
  assert.deepEqual(await prisma.examRecord.findUniqueOrThrow({ where: { id: attempt.id }, include: { answers: true } }), attempt)
  assert.equal((await releaseQuestionReplacementBatch(maths2.batch.id)).versionedMockPapers.length, 0)
  console.log('Legacy shared Paper, unchanged subject versions and later independent replacement passed.')
}

// 旧多科草稿内只改尚未开放的一科，已发布与已归档兄弟的题目、校验和更新时间均保持历史快照。
async function testMixedHistoricalSiblings(): Promise<void> {
  const codes = [ESAT_MODULE.MATHS_1, ESAT_MODULE.MATHS_2, ESAT_MODULE.PHYSICS]
  const questions = await Promise.all(codes.map((code) => createQuestions(code)))
  await prisma.question.update({ where: { id: questions[2][0].id }, data: {
    status: QUESTION_STATUS.ARCHIVED, archivedAt: fixtureTime,
  } })
  const original = await createSet('mixed-history', [
    { code: codes[0], questions: questions[0], publicationStatus: MOCK_PAPER_MODULE_STATUS.PUBLISHED },
    { code: codes[1], questions: questions[1], invalid: true },
    { code: codes[2], questions: questions[2], invalid: true, previouslyPublished: true,
      publicationStatus: MOCK_PAPER_MODULE_STATUS.ARCHIVED },
  ], { runtime: true })
  const replacement = await createReplacement(questions[1][0])
  const result = await releaseQuestionReplacementBatch(replacement.batch.id)
  assert.equal(result.versionedMockPapers.length, 0)
  assert.equal(result.updatedDraftMockPaperCount, 2)
  const updated = await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: original.id }, include: setInclude })
  assert.equal(updated.id, original.id)
  assert.equal(updated.version, 1)
  assert.equal(updated.status, MOCK_PAPER_STATUS.DRAFT)
  assert.equal(updated.modules[1].id, original.modules[1].id)
  assert.equal(updated.modules[1].version, 1)
  assertValidReplacement(updated.modules[1], replacement.question)
  assert.deepEqual(updated.modules[0], original.modules[0])
  assert.deepEqual(updated.modules[2], original.modules[2])
  assert.equal(updated.issueCount, 1, '父汇总保留历史兄弟的既有问题数，同时清除已修草稿的问题数')
  assert.equal(updated.paper?.status, 'published')
  assert.equal(updated.paper?.totalQuestions, 27)
  const repeated = await releaseQuestionReplacementBatch(replacement.batch.id)
  assert.equal(repeated.updatedDraftMockPaperCount, 0)
  assert.equal(repeated.versionedMockPapers.length, 0)
  console.log('Mixed original modules passed: draft-only validation, historical siblings and parent totals preserved.')
}

// 按正式组卷结构构造无 Paper 草稿，不调用业务编号分配器，验证副本发布史不会误触完整卷换版。
async function testSourcesInDraft(examType: string, archivedSource: boolean): Promise<void> {
  const codes = examType === EXAM_TYPE.TMUA ? ['paper1', 'paper2'] : [ESAT_MODULE.MATHS_1, ESAT_MODULE.MATHS_2, ESAT_MODULE.CHEMISTRY]
  const questions = await Promise.all(codes.map((code) => createQuestions(code, examType)))
  const sources: FixtureSet[] = []
  for (const [index, code] of codes.entries()) {
    sources.push(await createSet(`draft-source-${examType}-${index}-${randomUUID()}`, [{
      code, questions: questions[index], previouslyPublished: true,
      publicationStatus: index === 0 && archivedSource ? MOCK_PAPER_MODULE_STATUS.ARCHIVED : MOCK_PAPER_MODULE_STATUS.PUBLISHED,
    }], { hidden: true, runtime: true, runtimePublished: !(index === 0 && archivedSource), examType }))
  }
  const composition = await createSet(`draft-copies-${examType}-${archivedSource}`, sources.map((source, index) => ({
    code: codes[index], questions: questions[index], sourceModuleId: source.modules[0].id,
    publicationStatus: source.modules[0].publicationStatus, previouslyPublished: true,
  })), { examType })
  const compositionId = composition.id
  assert.equal(composition.paperId, null)
  const replacement = await createReplacement(questions[0][0])
  const result = await releaseQuestionReplacementBatch(replacement.batch.id)
  assert.equal(result.versionedMockPapers.length, 1)
  assert.equal(result.updatedDraftMockPaperCount, 1)
  assert.equal(result.versionedMockPapers[0]?.sequenceNo,
    `${examType}-MOCK-${examType === EXAM_TYPE.TMUA ? 'P1' : 'M1'}-${sources[0].modules[0].series!.sequenceNo}-V2`)
  const updated = await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: compositionId }, include: setInclude })
  const nextSource = await latestSingle(sources[0].modules[0].seriesId!)
  assert.equal(updated.version, 1)
  assert.equal(updated.seriesId, composition.seriesId)
  assert.equal(updated.status, MOCK_PAPER_STATUS.DRAFT)
  assert.equal(updated.paperId, null)
  assert.equal(updated.modules.find((module) => module.code === codes[0])?.sourceModuleId, nextSource.id)
  assert.equal(nextSource.publicationStatus, sources[0].modules[0].publicationStatus)
  assertValidReplacement(nextSource, replacement.question)
  for (const source of sources.slice(1)) assert.equal((await latestSingle(source.modules[0].seriesId!)).id, source.modules[0].id)
  assert.equal((await releaseQuestionReplacementBatch(replacement.batch.id)).versionedMockPapers.length, 0)
  console.log(`Draft composition passed (${examType}, source ${archivedSource ? 'archived' : 'published'}).`)
}

// 未独立发布但已经用于正式完整卷的来源也必须换版，且无自身 Paper 是合法状态。
async function testSourceHistoryThroughComposition(): Promise<void> {
  const codes = [ESAT_MODULE.MATHS_1, ESAT_MODULE.MATHS_2, ESAT_MODULE.CHEMISTRY]
  const questions = await Promise.all(codes.map((code) => createQuestions(code)))
  const sources: FixtureSet[] = []
  for (const [index, code] of codes.entries()) sources.push(await createSet(`unpublished-source-${index}`, [{ code, questions: questions[index] }], { hidden: true }))
  const full = await createSet('published-copies', codes.map((code, index) => ({ code, questions: questions[index], sourceModuleId: sources[index].modules[0].id })), { status: MOCK_PAPER_STATUS.PUBLISHED, runtime: true })
  const replacement = await createReplacement(questions[1][0])
  const result = await releaseQuestionReplacementBatch(replacement.batch.id)
  assert.equal(result.versionedMockPapers.length, 2)
  const nextSource = await latestSingle(sources[1].modules[0].seriesId!)
  assert.notEqual(nextSource.id, sources[1].modules[0].id)
  assert.equal(nextSource.version, 2)
  assert.equal(nextSource.mockPaperSet.paperId, null)
  assert.equal(nextSource.publicationStatus, MOCK_PAPER_MODULE_STATUS.DRAFT)
  assert.equal((await latestFull(full.seriesId!)).paper?.status, 'published')
}

// 定向补修反向纳入正式组合卷，沿替换链补到已发布末端且不重新上线旧题。
async function testHistoricalRepair(): Promise<void> {
  const codes = [ESAT_MODULE.MATHS_1, ESAT_MODULE.MATHS_2, ESAT_MODULE.PHYSICS]
  const questions = await Promise.all(codes.map((code) => createQuestions(code)))
  const middle = await createReplacement(questions[1][0], 2, QUESTION_STATUS.ARCHIVED)
  const latest = await createReplacement(middle.question, 3, QUESTION_STATUS.PUBLISHED)
  await prisma.question.update({ where: { id: questions[1][0].id }, data: { status: QUESTION_STATUS.ARCHIVED, archivedAt: fixtureTime } })
  const sources: FixtureSet[] = []
  for (const [index, code] of codes.entries()) sources.push(await createSet(`repair-source-${index}`, [{ code, questions: questions[index],
    publicationStatus: MOCK_PAPER_MODULE_STATUS.PUBLISHED }], { hidden: true, runtime: true }))
  const full = await createSet('repair-full', codes.map((code, index) => ({ code, questions: questions[index], sourceModuleId: sources[index].modules[0].id })), { status: MOCK_PAPER_STATUS.PUBLISHED, runtime: true })
  const repairOptions = { examType: EXAM_TYPE.ESAT, setIds: [sources[1].id], apply: false } as const
  const before = await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: full.id }, include: setInclude })
  const chainIds = [questions[1][0].id, middle.question.id, latest.question.id]
  const chainBefore = await prisma.question.findMany({ where: { id: { in: chainIds } }, orderBy: { id: 'asc' } })
  const preview = await repairMockPaperQuestionReplacements({ ...repairOptions, setIds: [...repairOptions.setIds] })
  assert.equal(preview.plans.length, 2)
  assert.equal(preview.versionedMockPapers.length, 0)
  assert.equal(preview.plans.find((item) => item.kind === 'single')?.sequenceNo,
    `ESAT-MOCK-M2-${sources[1].modules[0].series!.sequenceNo}-V1`)
  assert.equal(preview.plans.find((item) => item.kind === 'full')?.sequenceNo,
    `ESAT-MOCK-${full.series!.sequenceNo}-V1`)
  assert.ok(preview.plans.every((item) => item.sequenceNo && !('code' in item)))
  assert.deepEqual(await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: full.id }, include: setInclude }), before)
  const applied = await repairMockPaperQuestionReplacements({ ...repairOptions, setIds: [...repairOptions.setIds], apply: true })
  assert.equal(applied.versionedMockPapers.length, 2)
  const nextSource = await latestSingle(sources[1].modules[0].seriesId!)
  assertValidReplacement(nextSource, latest.question)
  const nextFull = await latestFull(full.seriesId!)
  assert.equal(nextFull.modules[1].sourceModuleId, nextSource.id)
  assert.deepEqual(await prisma.question.findMany({ where: { id: { in: chainIds } }, orderBy: { id: 'asc' } }), chainBefore)
  assert.equal((await repairMockPaperQuestionReplacements({ ...repairOptions, setIds: [...repairOptions.setIds] })).plans.length, 0)
  await assert.rejects(() => releaseQuestionReplacementBatch(middle.batch.id), QuestionReplacementReleaseError)
}

// 真正独立发布的来源缺运行 Paper 仍须整体拒绝，不能借编号迁移掩盖异常数据。
async function testMissingOriginalRuntime(): Promise<void> {
  const questions = await createQuestions(ESAT_MODULE.MATHS_2)
  const source = await createSet('missing-runtime', [{ code: ESAT_MODULE.MATHS_2, questions,
    publicationStatus: MOCK_PAPER_MODULE_STATUS.PUBLISHED }], { hidden: true })
  const replacement = await createReplacement(questions[0])
  await assert.rejects(() => releaseQuestionReplacementBatch(replacement.batch.id), /缺少运行 Paper/)
  assert.equal((await prisma.question.findUniqueOrThrow({ where: { id: questions[0].id } })).status, QUESTION_STATUS.PUBLISHED)
  assert.equal((await prisma.question.findUniqueOrThrow({ where: { id: replacement.question.id } })).status, QUESTION_STATUS.DRAFT)
  assert.deepEqual(await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: source.id }, include: setInclude }), source)
}

// 清理范围只包含本次系列、随机前缀及显式记录的 ID，服务生成的新版本通过系列关系一并找到。
async function cleanup(): Promise<void> {
  const sets = await prisma.mockPaperSet.findMany({ where: { OR: [
    { id: { in: createdSetIds } }, { title: { startsWith: fixturePrefix } },
    { seriesId: { in: createdSeriesIds } }, { modules: { some: { seriesId: { in: createdSeriesIds } } } },
  ] }, select: { id: true, paperId: true } })
  const paperIds = [...new Set([...createdPaperIds, ...sets.flatMap((set) => set.paperId ? [set.paperId] : [])])]
  await prisma.$transaction(async (tx) => {
    await tx.examRecord.deleteMany({ where: { userId: { in: createdUserIds } } })
    await tx.mockPaperModule.updateMany({ where: { mockPaperSetId: { in: sets.map((set) => set.id) } }, data: { sourceModuleId: null } })
    await tx.mockPaperSet.deleteMany({ where: { id: { in: sets.map((set) => set.id) } } })
    await tx.mockPaperSeries.deleteMany({ where: { id: { in: createdSeriesIds } } })
    await tx.paper.deleteMany({ where: { id: { in: paperIds } } })
    await tx.question.updateMany({ where: { uniqueCode: { startsWith: fixturePrefix } }, data: { replacesQuestionId: null } })
    await tx.question.deleteMany({ where: { uniqueCode: { startsWith: fixturePrefix } } })
    await tx.questionImportBatch.deleteMany({ where: { title: fixturePrefix } })
    await tx.user.deleteMany({ where: { id: { in: createdUserIds } } })
  }, { timeout: 60_000 })
  assert.equal(await prisma.mockPaperSeries.count({ where: { id: { in: createdSeriesIds } } }), 0)
  assert.equal(await prisma.question.count({ where: { uniqueCode: { startsWith: fixturePrefix } } }), 0)
}

// 全部场景通过同一正式事务服务执行，覆盖独立版本、组卷引用、共享 Paper 和补修幂等。
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.length) {
    assert.deepEqual(args, ['--case=mixed-history'], '仅支持 --case=mixed-history，省略参数执行全部场景')
    await testMixedHistoricalSiblings()
    return
  }
  await testIndependentSingles()
  await testLegacySharedPaper()
  await testMixedHistoricalSiblings()
  for (const examType of [EXAM_TYPE.ESAT, EXAM_TYPE.TMUA]) {
    await testSourcesInDraft(examType, false)
    await testSourcesInDraft(examType, true)
  }
  await testSourceHistoryThroughComposition()
  await testHistoricalRepair()
  await testMissingOriginalRuntime()
  console.log('Question replacement integration checks passed for independent numbering and versions.')
}

assertLocalDatabase()
try {
  await main()
} finally {
  try { await cleanup() } finally { await prisma.$disconnect() }
}
