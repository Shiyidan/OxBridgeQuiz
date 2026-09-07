// 模考换题核心：单项按自己的系列换版，完整卷只更新引用，历史题序与答卷仍指向原版本。
import { Prisma } from '@prisma/client'
import { randomUUID } from 'node:crypto'

import {
  MOCK_PAPER_MODULE_STATUS,
  MOCK_PAPER_STATUS,
  MOCK_PAPER_VALIDATION_STATUS,
} from '../constants/domain.js'
import { buildMockPaperNumber } from '../utils/mockPaperNumber.js'
import { revalidateMockPaperSet, syncPublishedMockPaperRuntime } from './mockPaperLibrary.js'

export class MockPaperReplacementError extends Error {
  readonly name = 'MockPaperReplacementError'
}

export type MockPaperQuestionReplacement = { id: string; uniqueCode: string }

const moduleSnapshotInclude = {
  series: true,
  questions: { orderBy: { position: 'asc' as const } },
} satisfies Prisma.MockPaperModuleInclude

const runtimeHistoryInclude = {
  paper: { include: { _count: { select: { examRecords: true } } } },
} satisfies Prisma.MockPaperSetInclude

const replacementSetInclude = {
  ...runtimeHistoryInclude,
  series: true,
  modules: {
    orderBy: { moduleOrder: 'asc' as const },
    include: {
      ...moduleSnapshotInclude,
      sourceModule: { include: moduleSnapshotInclude },
    },
  },
} satisfies Prisma.MockPaperSetInclude

const canonicalModuleInclude = {
  ...moduleSnapshotInclude,
  mockPaperSet: { include: runtimeHistoryInclude },
  composedCopies: {
    include: { mockPaperSet: { include: runtimeHistoryInclude } },
  },
} satisfies Prisma.MockPaperModuleInclude

type ModuleSnapshot = Prisma.MockPaperModuleGetPayload<{ include: typeof moduleSnapshotInclude }>
type CanonicalModule = Prisma.MockPaperModuleGetPayload<{ include: typeof canonicalModuleInclude }>
export type MockPaperReplacementSet = Prisma.MockPaperSetGetPayload<{ include: typeof replacementSetInclude }>
type RuntimeOwner = Prisma.MockPaperSetGetPayload<{ include: typeof runtimeHistoryInclude }>
type QuestionSnapshot = ModuleSnapshot['questions'][number]
type ReplacementAction = 'version' | 'update_draft'

type CanonicalChange = { module: CanonicalModule; action: ReplacementAction }
type FullModuleTarget = {
  module: MockPaperReplacementSet['modules'][number]
  source: ModuleSnapshot
  questions: QuestionSnapshot[]
}
type FullChange = {
  set: MockPaperReplacementSet
  action: ReplacementAction
  modules: FullModuleTarget[]
}

export type MockPaperReplacementPlan = {
  canonicalChanges: CanonicalChange[]
  fullChanges: FullChange[]
}

export type MockPaperReplacementResult = {
  updatedDraftMockPaperCount: number
  versionedMockPapers: Array<{
    kind: 'single' | 'full'
    seriesId: string
    previousSetId: string
    currentSetId: string
    previousModuleId?: string
    currentModuleId?: string
    sequenceNo: string | null
    previousVersion: number
    currentVersion: number
  }>
}

// 完整卷自己的开放历史与答卷才决定整卷不可变，副本继承的单项发布时间不代表整卷已开放。
function hasRuntimeHistory(set: RuntimeOwner): boolean {
  return Boolean(set.publishedAt || set.status === MOCK_PAPER_STATUS.PUBLISHED || set.paper?._count.examRecords)
}

// 单项曾独立开放或被正式完整卷使用后都保留旧版本，包含已经下线的组合引用。
function requiresCanonicalVersion(module: CanonicalModule): boolean {
  return Boolean(
    module.publishedAt
    || module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED
    || hasRuntimeHistory(module.mockPaperSet)
    || module.composedCopies.some((copy) => hasRuntimeHistory(copy.mockPaperSet)),
  )
}

// 内容替换只改命中的题目引用与题号，题位以及未命中的题目保持原样。
function replacedQuestions(
  questions: QuestionSnapshot[],
  replacements: Map<string, MockPaperQuestionReplacement>,
): QuestionSnapshot[] {
  return questions.map((item) => {
    const replacement = item.questionId ? replacements.get(item.questionId) : undefined
    return replacement ? { ...item, questionId: replacement.id, sourceCode: replacement.uniqueCode } : item
  })
}

// 同一题序的来源变化必须同时比较题位、官方题目 ID 与题号，避免只更新展示号就误判已修复。
function sameQuestions(left: QuestionSnapshot[], right: QuestionSnapshot[]): boolean {
  return left.length === right.length && left.every((item, index) => (
    item.position === right[index]?.position
    && item.questionId === right[index]?.questionId
    && item.sourceCode === right[index]?.sourceCode
  ))
}

// 副本只能引用具体的原始单项版本；编号缺失或多层副本应先完成数据修复而非猜测身份。
function canonicalSource(module: MockPaperReplacementSet['modules'][number]): ModuleSnapshot {
  const source = module.sourceModuleId ? module.sourceModule : module
  if (!source || source.sourceModuleId || !source.seriesId || !source.series || source.version === null) {
    throw new MockPaperReplacementError(`${module.title || module.label} 缺少完整的原始单项版本关系`)
  }
  if (source.series.kind !== 'single') {
    throw new MockPaperReplacementError(`${module.title || module.label} 的编号系列不是单项`)
  }
  return source
}

// 原始单项按自己的系列取最新版本，父完整卷已经换版不影响其中仍有效的单项身份。
async function findLatestCanonicalModules(tx: Prisma.TransactionClient, seriesIds: string[]) {
  const rows = await tx.mockPaperModule.findMany({
    where: { sourceModuleId: null, seriesId: { in: seriesIds } },
    include: canonicalModuleInclude,
    orderBy: [{ version: 'desc' }, { id: 'asc' }],
  })
  const latest = new Map<string, CanonicalModule>()
  for (const row of rows) {
    if (!row.seriesId || row.version === null || !row.series) {
      throw new MockPaperReplacementError('原始单项尚未完成编号系列迁移')
    }
    if (!latest.has(row.seriesId)) latest.set(row.seriesId, row)
  }
  if (latest.size !== seriesIds.length) throw new MockPaperReplacementError('模考引用的原始单项系列不存在')
  return latest
}

// 先确定真正变题的单项，再反向纳入使用该系列的当前完整卷；定向补修也必须维持组卷引用完整。
export async function findMockPaperReplacementPlan(
  tx: Prisma.TransactionClient,
  replacements: Map<string, MockPaperQuestionReplacement>,
  setIds?: string[],
): Promise<MockPaperReplacementPlan> {
  const oldQuestionIds = [...replacements.keys()]
  if (!oldQuestionIds.length || setIds?.length === 0) return { canonicalChanges: [], fullChanges: [] }
  const matchingSets = await tx.mockPaperSet.findMany({
    where: {
      ...(setIds ? { id: { in: setIds } } : {}),
      modules: { some: { questions: { some: { questionId: { in: oldQuestionIds } } } } },
    },
    include: replacementSetInclude,
    orderBy: { id: 'asc' },
  })
  const sourceSeriesIds = new Set<string>()
  for (const set of matchingSets) {
    for (const module of set.modules) {
      if (sameQuestions(module.questions, replacedQuestions(module.questions, replacements))) continue
      sourceSeriesIds.add(canonicalSource(module).seriesId!)
    }
  }
  if (!sourceSeriesIds.size) return { canonicalChanges: [], fullChanges: [] }
  const latestSources = await findLatestCanonicalModules(tx, [...sourceSeriesIds])
  const canonicalChanges: CanonicalChange[] = []
  for (const module of latestSources.values()) {
    if (sameQuestions(module.questions, replacedQuestions(module.questions, replacements))) continue
    if ((module.publishedAt || module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED)
      && !module.mockPaperSet.paper) {
      throw new MockPaperReplacementError(`${module.title || module.label} 已开放，但缺少运行 Paper`)
    }
    canonicalChanges.push({ module, action: requiresCanonicalVersion(module) ? 'version' : 'update_draft' })
  }

  const candidates = await tx.mockPaperSet.findMany({
    where: {
      series: { kind: 'full' },
      deletedAt: null,
      status: { not: MOCK_PAPER_STATUS.ARCHIVED },
      modules: { some: { OR: [
        { sourceModuleId: null, seriesId: { in: [...sourceSeriesIds] } },
        { sourceModule: { seriesId: { in: [...sourceSeriesIds] } } },
      ] } },
    },
    include: replacementSetInclude,
    orderBy: [{ version: 'desc' }, { id: 'asc' }],
  })
  const highestVersions = candidates.length ? await tx.mockPaperSet.groupBy({
    by: ['seriesId'],
    where: { seriesId: { in: [...new Set(candidates.map((set) => set.seriesId!))] } },
    _max: { version: true },
  }) : []
  const latestFullVersions = new Map(highestVersions.map((row) => [row.seriesId, row._max.version]))
  const changedSourceSeriesIds = new Set(canonicalChanges.map((change) => change.module.seriesId!))
  const versionedSourceIds = new Set(canonicalChanges.filter((change) => change.action === 'version').map((change) => change.module.id))
  const fullChanges: FullChange[] = []
  for (const set of candidates) {
    if (set.version !== latestFullVersions.get(set.seriesId)) continue
    const modules = set.modules.map((module): FullModuleTarget => {
      const originalSource = canonicalSource(module)
      const affected = changedSourceSeriesIds.has(originalSource.seriesId!)
        || !sameQuestions(module.questions, replacedQuestions(module.questions, replacements))
      const source = affected ? latestSources.get(originalSource.seriesId!) || originalSource : originalSource
      return {
        module,
        source,
        questions: affected && latestSources.has(originalSource.seriesId!)
          ? replacedQuestions(source.questions, replacements)
          : module.questions,
      }
    })
    const changed = modules.some(({ module, source, questions }) => (
      !sameQuestions(module.questions, questions)
      || (module.sourceModuleId || module.id) !== source.id
      || versionedSourceIds.has(source.id)
    ))
    if (!changed) continue
    // 旧式完整卷直接持有已开放原始单项时，另存完整卷才能保留旧模块所属 Paper 与答卷关系。
    const preservesOwnedCanonical = modules.some(({ module, source }) => (
      !module.sourceModuleId && (module.id !== source.id || versionedSourceIds.has(source.id))
    ))
    const immutable = hasRuntimeHistory(set) || preservesOwnedCanonical
    if (hasRuntimeHistory(set) && !set.paper) {
      throw new MockPaperReplacementError(`${set.title} 已开放或已有答卷，但缺少运行 Paper`)
    }
    fullChanges.push({ set, modules, action: immutable ? 'version' : 'update_draft' })
  }
  return { canonicalChanges, fullChanges }
}

// Nullable Json 字段只在有值时复制，不向 Prisma 写入预序列化文本。
function optionalJson<T extends string>(key: T, value: Prisma.JsonValue | null) {
  return value === null ? {} : { [key]: value as Prisma.InputJsonValue }
}

// 新运行载体从旧 Paper 继承考试配置，最终题量、模块和开放状态由事务内正式同步决定。
async function copyRuntimePaper(
  tx: Prisma.TransactionClient,
  setId: string,
  oldPaper: RuntimeOwner['paper'],
  title: string,
): Promise<void> {
  if (!oldPaper) return
  const paperId = `mock-paper-${setId}`
  await tx.paper.create({
    data: {
      id: paperId,
      title,
      code: null,
      examType: oldPaper.examType,
      year: oldPaper.year,
      duration: oldPaper.duration,
      totalQuestions: oldPaper.totalQuestions,
      paperType: oldPaper.paperType,
      accessTier: oldPaper.accessTier,
      deliveryMode: oldPaper.deliveryMode,
      breakDurationSeconds: oldPaper.breakDurationSeconds,
      ...optionalJson('moduleConfig', oldPaper.moduleConfig),
      assemblyType: oldPaper.assemblyType,
      ...optionalJson('sourceExamTypes', oldPaper.sourceExamTypes),
      remarks: oldPaper.remarks,
      pdfUrl: oldPaper.pdfUrl,
      status: oldPaper.status,
    },
  })
  await tx.mockPaperSet.update({ where: { id: setId }, data: { paperId } })
}

// 新模块保留正式结构与展示信息；副本不保存独立编号系列或版本。
function moduleCreateData(source: ModuleSnapshot, questions: QuestionSnapshot[], order = source.moduleOrder) {
  return {
    code: source.code,
    label: source.label,
    title: source.title,
    accessTier: source.accessTier,
    moduleOrder: order,
    durationSeconds: source.durationSeconds,
    expectedQuestionCount: source.expectedQuestionCount,
    questionCount: questions.length,
    validationStatus: source.validationStatus,
    publicationStatus: source.publicationStatus,
    issueCount: source.issueCount,
    issues: source.issues as Prisma.InputJsonValue,
    publishedAt: source.publishedAt,
    archivedAt: source.archivedAt,
    questions: { create: questions.map((item) => ({
      questionId: item.questionId,
      sourceCode: item.sourceCode,
      position: item.position,
      validationStatus: item.validationStatus,
      issues: item.issues as Prisma.InputJsonValue,
    })) },
  }
}

// 草稿题位保持现有关系 ID；仅对实际变化的题位更新，来源版本题数变化时补齐或移除草稿位置。
async function rewriteDraftQuestions(
  tx: Prisma.TransactionClient,
  module: ModuleSnapshot,
  questions: QuestionSnapshot[],
): Promise<void> {
  const existingByPosition = new Map(module.questions.map((item) => [item.position, item]))
  const nextPositions = new Set(questions.map((item) => item.position))
  for (const item of questions) {
    const existing = existingByPosition.get(item.position)
    if (existing?.questionId === item.questionId && existing.sourceCode === item.sourceCode) continue
    const data = {
      questionId: item.questionId,
      sourceCode: item.sourceCode,
      validationStatus: MOCK_PAPER_VALIDATION_STATUS.VALID,
      issues: [] as string[],
    }
    if (existing) await tx.mockPaperQuestion.update({ where: { id: existing.id }, data })
    else await tx.mockPaperQuestion.create({ data: { ...data, moduleId: module.id, position: item.position } })
  }
  const removedIds = module.questions.filter((item) => !nextPositions.has(item.position)).map((item) => item.id)
  if (removedIds.length) await tx.mockPaperQuestion.deleteMany({ where: { id: { in: removedIds } } })
}

// 先创建变化单项的版本，再更新完整卷引用；未改科不换版，旧共享 Paper 只同步剩余单项能力。
export async function applyMockPaperReplacementPlan(
  tx: Prisma.TransactionClient,
  plan: MockPaperReplacementPlan,
  replacements: Map<string, MockPaperQuestionReplacement>,
  releasedAt: Date,
): Promise<MockPaperReplacementResult> {
  const versionedMockPapers: MockPaperReplacementResult['versionedMockPapers'] = []
  const replacementSourceById = new Map<string, ModuleSnapshot>()
  const revalidateSetIds = new Map<string, Set<string> | null>()
  const historicalRuntimeSetIds = new Set<string>()
  // 新容器完整复核；旧容器只复核真正编辑的模块，以保留兄弟单项的历史校验关系。
  const queueDraftValidation = (setId: string, moduleId: string): void => {
    if (revalidateSetIds.get(setId) === null) return
    const moduleIds = revalidateSetIds.get(setId) || new Set<string>()
    moduleIds.add(moduleId)
    revalidateSetIds.set(setId, moduleIds)
  }
  for (const change of plan.canonicalChanges) {
    const source = change.module
    const questions = replacedQuestions(source.questions, replacements)
    if (change.action === 'update_draft') {
      await rewriteDraftQuestions(tx, source, questions)
      replacementSourceById.set(source.id, { ...source, questions })
      queueDraftValidation(source.mockPaperSetId, source.id)
      continue
    }
    const currentVersion = source.version! + 1
    const setId = randomUUID()
    const moduleId = randomUUID()
    const publishedAt = source.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED ? releasedAt : source.publishedAt
    const newSet = await tx.mockPaperSet.create({
      data: {
        id: setId,
        seriesId: null,
        versionGroupId: source.seriesId!,
        version: currentVersion,
        examType: source.series!.examType,
        title: source.title || source.label,
        accessTier: source.accessTier,
        status: MOCK_PAPER_STATUS.DRAFT,
        sourceFileName: source.mockPaperSet.sourceFileName,
        deletedAt: releasedAt,
        issues: [],
        questionCount: questions.length,
        modules: { create: {
          ...moduleCreateData(source, questions),
          id: moduleId,
          seriesId: source.seriesId,
          version: currentVersion,
          sourceModuleId: null,
          publishedAt,
        } },
      },
      select: { id: true },
    })
    await copyRuntimePaper(tx, newSet.id, source.mockPaperSet.paper, source.title || source.label)
    await tx.mockPaperModule.update({
      where: { id: source.id },
      data: { publicationStatus: MOCK_PAPER_MODULE_STATUS.ARCHIVED, archivedAt: releasedAt },
    })
    replacementSourceById.set(source.id, {
      ...source, id: moduleId, mockPaperSetId: setId, version: currentVersion, publishedAt, questions,
    })
    historicalRuntimeSetIds.add(source.mockPaperSetId)
    revalidateSetIds.set(setId, null)
    const sequenceNo = buildMockPaperNumber(
      source.series!.examType, source.series!.sequenceNo, currentVersion, source.series!.moduleCode,
    )
    versionedMockPapers.push({
      kind: 'single', seriesId: source.seriesId!,
      previousSetId: source.mockPaperSetId, currentSetId: setId,
      previousModuleId: source.id, currentModuleId: moduleId,
      sequenceNo,
      previousVersion: source.version!, currentVersion,
    })
  }

  for (const change of plan.fullChanges) {
    const { set } = change
    if (change.action === 'update_draft') {
      for (const target of change.modules) {
        const source = replacementSourceById.get(target.source.id) || target.source
        const changed = !sameQuestions(target.module.questions, target.questions)
          || (target.module.sourceModuleId || target.module.id) !== source.id
        if (target.module.sourceModuleId) {
          await tx.mockPaperModule.update({
            where: { id: target.module.id },
            data: {
              sourceModuleId: source.id,
              seriesId: null,
              version: null,
              publicationStatus: source.publicationStatus,
              publishedAt: source.publishedAt,
              archivedAt: source.archivedAt,
            },
          })
        }
        await rewriteDraftQuestions(tx, target.module, target.questions)
        if (changed) queueDraftValidation(set.id, target.module.id)
      }
      continue
    }
    const currentVersion = set.version + 1
    const newSet = await tx.mockPaperSet.create({
      data: {
        seriesId: set.seriesId,
        versionGroupId: set.versionGroupId,
        version: currentVersion,
        examType: set.examType,
        title: set.title,
        accessTier: set.accessTier,
        status: set.status,
        sourceFileName: set.sourceFileName,
        issues: [],
        questionCount: change.modules.reduce((total, module) => total + module.questions.length, 0),
        publishedAt: set.status === MOCK_PAPER_STATUS.PUBLISHED ? releasedAt : set.publishedAt,
        archivedAt: set.archivedAt,
        modules: { create: change.modules.map((target) => {
          const source = replacementSourceById.get(target.source.id) || target.source
          return {
            ...moduleCreateData(source, target.questions, target.module.moduleOrder),
            sourceModuleId: source.id,
            seriesId: null,
            version: null,
          }
        }) },
      },
      select: { id: true },
    })
    await copyRuntimePaper(tx, newSet.id, set.paper, set.title)
    await tx.mockPaperSet.update({
      where: { id: set.id },
      data: { status: MOCK_PAPER_STATUS.ARCHIVED, archivedAt: releasedAt },
    })
    historicalRuntimeSetIds.add(set.id)
    revalidateSetIds.set(newSet.id, null)
    const sequenceNo = buildMockPaperNumber(set.examType, set.series!.sequenceNo, currentVersion)
    versionedMockPapers.push({
      kind: 'full', seriesId: set.seriesId!,
      previousSetId: set.id, currentSetId: newSet.id,
      sequenceNo,
      previousVersion: set.version, currentVersion,
    })
  }

  for (const [setId, moduleIds] of revalidateSetIds) {
    await revalidateMockPaperSet(setId, tx, moduleIds ? [...moduleIds] : undefined)
  }
  // 历史模块题目及校验关系保持原样；仅关闭已失去开放单项的运行载体。
  for (const setId of historicalRuntimeSetIds) {
    if (!revalidateSetIds.has(setId)) await syncPublishedMockPaperRuntime(setId, tx)
  }
  return {
    updatedDraftMockPaperCount: plan.canonicalChanges.filter((change) => change.action === 'update_draft').length
      + plan.fullChanges.filter((change) => change.action === 'update_draft').length,
    versionedMockPapers,
  }
}
