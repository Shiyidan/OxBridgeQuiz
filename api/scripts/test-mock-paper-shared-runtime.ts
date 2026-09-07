// 单项下线的本地数据库回归：验证 ESAT/TMUA 原始单项共享 Paper 时各入口互不误关。
import assert from 'node:assert/strict'
import { randomInt, randomUUID } from 'node:crypto'
import { config } from 'dotenv'

import {
  ESAT_MODULES,
  EXAM_TYPE,
  MOCK_PAPER_MODULE_STATUS,
  MOCK_PAPER_STATUS,
  MOCK_PAPER_VALIDATION_STATUS,
  PAPER_ACCESS_TIER,
  PAPER_DELIVERY_MODE,
  PAPER_TYPE,
  QUESTION_STATUS,
} from '../src/constants/domain.js'
import {
  archiveMockPaperModule,
  archiveMockPaperSet,
  revalidateMockPaperSet,
} from '../src/services/mockPaperLibrary.js'
import { prisma } from '../src/services/prisma.js'
import { isMockPaperModuleAvailable } from '../src/utils/mockPaperState.js'

config({ path: process.env.API_ENV_FILE || '.env' })

type TestExamType = typeof EXAM_TYPE.ESAT | typeof EXAM_TYPE.TMUA
type FixtureModule = {
  code: string
  order: number
  durationSeconds: number
  questions: Array<{ id: string; uniqueCode: string }>
}

const fixturePrefix = `shared-runtime-${randomUUID()}`
const fixtureTime = new Date('2026-01-01T00:00:00.000Z')
const createdSetIds: string[] = []
const createdPaperIds: string[] = []
const createdQuestionIds: string[] = []
const createdSeriesIds: string[] = []
let sequenceNo = randomInt(1_000_000_000, 1_900_000_000)

// 即使误指定服务器环境文件，也只允许显式标识为 dev/test 的本机 MySQL 数据库。
function assertLocalDatabase(): void {
  assert.ok(!['prod', 'production'].includes((process.env.API_RUNTIME_ENV || '').toLowerCase()),
    '禁止在生产运行环境执行共享模考载体回归')
  assert.notEqual(process.env.NODE_ENV, 'production', '禁止在生产 Node 环境执行共享模考载体回归')
  const database = new URL(process.env.DATABASE_URL || '')
  assert.equal(database.protocol, 'mysql:', '回归只能使用本地 MySQL')
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(database.hostname),
    '回归拒绝连接非本机数据库')
  assert.match(database.pathname, /(?:dev|test)/i, '数据库名称必须标识为 dev 或 test')
  assert.doesNotMatch(database.pathname, /prod/i, '禁止连接生产数据库')
}

// 每科建立真实且题数完整的已发布题目，使运行载体通过业务校验而非依赖伪造的 valid 标记。
async function createQuestionPool(examType: TestExamType): Promise<FixtureModule[]> {
  const codes = examType === EXAM_TYPE.ESAT ? ESAT_MODULES : ['paper1', 'paper2']
  const questionCount = examType === EXAM_TYPE.ESAT ? 27 : 20
  const modules = codes.map((code, index) => ({
    code,
    order: index + 1,
    durationSeconds: (examType === EXAM_TYPE.ESAT ? 40 : 75) * 60,
    questions: Array.from({ length: questionCount }, (_, position) => ({
      id: `${fixturePrefix}-${examType}-${code}-${position + 1}`,
      uniqueCode: `${fixturePrefix}-${examType}-${code}-${position + 1}`,
    })),
  }))
  const questions = modules.flatMap((module) => module.questions.map((question) => ({
    ...question,
    sourceQuestionCode: question.uniqueCode,
    examType,
    moduleCode: module.code,
    title: 'Choose the correct value of 1 + 1.',
    options: ['A. 2', 'B. 3'],
    answer: ['A'],
    questionType: 'single_choice',
    knowledgePoints: [],
    syllabusPoints: [],
    meta: {},
    status: QUESTION_STATUS.PUBLISHED,
    publishedAt: fixtureTime,
  })))
  createdQuestionIds.push(...questions.map((question) => question.id))
  await prisma.question.createMany({ data: questions })
  return modules
}

// 复现历史多原始模块共用 Paper 的结构，并通过真实重校验生成最初的运行配置。
async function createFixture(
  examType: TestExamType,
  modules: FixtureModule[],
  hidden = false,
) {
  const id = `${fixturePrefix}-${randomUUID()}`
  const paperId = `mock-paper-${id}`
  const code = `shared-runtime-${randomUUID()}`
  const fixtureNumber = sequenceNo++
  const fullSeriesId = hidden ? null : randomUUID()
  const singleSeriesIds = modules.map(() => randomUUID())
  const series = [
    ...(fullSeriesId ? [{ id: fullSeriesId, examType, kind: 'full', moduleCode: '', sequenceNo: fixtureNumber }] : []),
    ...modules.map((module, index) => ({ id: singleSeriesIds[index]!, examType, kind: 'single', moduleCode: module.code, sequenceNo: fixtureNumber })),
  ]
  createdSeriesIds.push(...series.map((item) => item.id))
  await prisma.mockPaperSeries.createMany({ data: series })
  const created = await prisma.mockPaperSet.create({
    data: {
      id,
      ...(fullSeriesId ? { series: { connect: { id: fullSeriesId } } } : {}),
      versionGroupId: id,
      examType,
      title: `${fixturePrefix}-${examType}`,
      accessTier: PAPER_ACCESS_TIER.FREE,
      status: hidden ? MOCK_PAPER_STATUS.DRAFT : MOCK_PAPER_STATUS.PUBLISHED,
      publishedAt: hidden ? null : fixtureTime,
      deletedAt: hidden ? fixtureTime : null,
      issues: [],
      paper: {
        create: {
          id: paperId,
          code,
          title: fixturePrefix,
          examType,
          year: 2026,
          duration: 0,
          paperType: PAPER_TYPE.MOCK_PAPER,
          accessTier: PAPER_ACCESS_TIER.FREE,
          deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
          assemblyType: 'fixed_mock',
          status: 'published',
        },
      },
      modules: {
        create: modules.map((module, index) => ({
          series: { connect: { id: singleSeriesIds[index]! } },
          version: 1,
          code: module.code,
          label: module.code,
          accessTier: PAPER_ACCESS_TIER.FREE,
          moduleOrder: module.order,
          durationSeconds: module.durationSeconds,
          expectedQuestionCount: module.questions.length,
          questionCount: module.questions.length,
          publicationStatus: MOCK_PAPER_MODULE_STATUS.PUBLISHED,
          publishedAt: fixtureTime,
          issues: [],
          questions: {
            create: module.questions.map((question, position) => ({
              questionId: question.id,
              sourceCode: question.uniqueCode,
              position: position + 1,
              issues: [],
            })),
          },
        })),
      },
    },
    include: { modules: { orderBy: { moduleOrder: 'asc' } } },
  })
  createdSetIds.push(id)
  createdPaperIds.push(paperId)
  await revalidateMockPaperSet(id)
  const validated = await prisma.mockPaperSet.findUniqueOrThrow({
    where: { id },
    include: { paper: true, modules: true },
  })
  assert.ok(validated.modules.every((module) => (
    module.validationStatus === MOCK_PAPER_VALIDATION_STATUS.VALID
  )), `${examType} fixture modules must pass real question validation`)
  assert.equal(validated.paper?.status, 'published')
  return created
}

// 单项下线后同时检查共享载体、未下线兄弟的可开考条件和实际收录的模块，避免只验证单个状态字段。
async function assertRuntime(
  setId: string,
  expectedRuntimeCodes: string[],
  expectedPublishedModuleCodes: string[],
): Promise<void> {
  const set = await prisma.mockPaperSet.findUniqueOrThrow({
    where: { id: setId },
    include: { paper: true, modules: { orderBy: { moduleOrder: 'asc' } } },
  })
  assert.ok(set.paper)
  assert.deepEqual(
    set.modules.filter((module) => (
      module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED
    )).map((module) => module.code),
    expectedPublishedModuleCodes,
  )
  assert.equal(set.paper.status, expectedRuntimeCodes.length ? 'published' : 'archived')
  if (expectedRuntimeCodes.length) {
    assert.deepEqual(
      (set.paper.moduleConfig as Array<{ code: string }>).map((module) => module.code),
      expectedRuntimeCodes,
    )
  }
  for (const module of set.modules) {
    const available = isMockPaperModuleAvailable({
      publicationStatus: module.publicationStatus,
      validationStatus: module.validationStatus,
      deletedAt: set.deletedAt,
      paperStatus: set.paper.status,
    })
    assert.equal(available, expectedPublishedModuleCodes.includes(module.code),
      `${set.examType} ${module.code} must retain its own single-module availability`)
  }
}

// 完整卷已下线或父记录隐藏时，逐科下线仅减少单项入口，最后一科下线才关闭共享 Paper。
async function testIndependentArchiving(
  examType: TestExamType,
  modules: FixtureModule[],
  hidden = false,
): Promise<void> {
  const set = await createFixture(examType, modules, hidden)
  if (!hidden) await archiveMockPaperSet(set.id)
  for (const [index, module] of set.modules.entries()) {
    await archiveMockPaperModule(module.id)
    const remainingCodes = set.modules.slice(index + 1).map((sibling) => sibling.code)
    await assertRuntime(set.id, remainingCodes, remainingCodes)
  }
  const parent = await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: set.id } })
  assert.equal(parent.status, hidden ? MOCK_PAPER_STATUS.DRAFT : MOCK_PAPER_STATUS.ARCHIVED)
}

// 单项独立入口全部下线也不能关闭仍发布的完整套卷，运行配置继续保留完整模块池。
async function testPublishedSuiteSurvives(
  examType: TestExamType,
  modules: FixtureModule[],
): Promise<void> {
  const set = await createFixture(examType, modules)
  const suiteCodes = set.modules.map((module) => module.code)
  for (const [index, module] of set.modules.entries()) {
    await archiveMockPaperModule(module.id)
    await assertRuntime(set.id, suiteCodes, set.modules.slice(index + 1).map((sibling) => sibling.code))
  }
  const parent = await prisma.mockPaperSet.findUniqueOrThrow({ where: { id: set.id } })
  assert.equal(parent.status, MOCK_PAPER_STATUS.PUBLISHED)
}

// 仅按本次记录的随机主键清理测试资产，保留所有业务数据和其他并行回归的数据。
async function cleanupFixtures(): Promise<void> {
  await prisma.mockPaperSet.deleteMany({ where: { id: { in: createdSetIds } } })
  await prisma.paper.deleteMany({ where: { id: { in: createdPaperIds } } })
  await prisma.question.deleteMany({ where: { id: { in: createdQuestionIds } } })
  await prisma.mockPaperSeries.deleteMany({ where: { id: { in: createdSeriesIds } } })
  assert.equal(await prisma.mockPaperSet.count({ where: { id: { in: createdSetIds } } }), 0)
  assert.equal(await prisma.paper.count({ where: { id: { in: createdPaperIds } } }), 0)
  assert.equal(await prisma.question.count({ where: { id: { in: createdQuestionIds } } }), 0)
  assert.equal(await prisma.mockPaperSeries.count({ where: { id: { in: createdSeriesIds } } }), 0)
}

// 数据库校验在任何写入之前执行；成功和失败都清理同一批精确记录。
async function main(): Promise<void> {
  assertLocalDatabase()
  try {
    for (const examType of [EXAM_TYPE.ESAT, EXAM_TYPE.TMUA]) {
      const modules = await createQuestionPool(examType)
      await testIndependentArchiving(examType, modules)
      await testIndependentArchiving(examType, modules, true)
      await testPublishedSuiteSurvives(examType, modules)
      console.log(`${examType} shared runtime tests passed`)
    }
  } finally {
    await cleanupFixtures()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
