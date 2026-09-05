// 模考试卷库服务：解析组卷 Excel、关联现有题库题目，并维护草稿的可发布校验结果。
import { Prisma, type Question } from '@prisma/client'
import readXlsxFile, { readSheetNames, type Row } from 'read-excel-file/node'
import {
  EXAM_TYPE,
  MOCK_PAPER_MODULE_STATUS,
  MOCK_PAPER_STATUS,
  MOCK_PAPER_VALIDATION_STATUS,
  PAPER_DELIVERY_MODE,
  PAPER_TYPE,
  QUESTION_STATUS,
} from '../constants/domain.js'
import { prisma } from './prisma.js'
import { parseJsonArray } from '../utils/jsonField.js'
import { resolveQuestionModuleCode } from '../utils/questionModule.js'
import { formatMockPaperModuleTitle } from '../utils/mockPaperTitle.js'
import {
  canClaimMockPaperSource,
  deriveMockPaperReadiness,
} from '../utils/mockPaperState.js'

type SupportedExamType = typeof EXAM_TYPE.ESAT | typeof EXAM_TYPE.TMUA

type ModuleDefinition = {
  code: string
  label: string
  aliases: string[]
  order: number
  durationSeconds: number
  expectedQuestionCount: number
  codePattern?: RegExp
}

type ParsedWorkbookModule = ModuleDefinition & {
  sourceSheetName: string
  questionCodes: string[]
}

export type ParsedWorkbookSet = {
  sourceKey: string
  sourceSequence: number
  examType: SupportedExamType
  modules: ParsedWorkbookModule[]
}

type ValidationQuestion = Pick<
  Question,
  | 'id'
  | 'uniqueCode'
  | 'sourceQuestionCode'
  | 'examType'
  | 'status'
  | 'moduleCode'
  | 'subject'
  | 'subjectCode'
  | 'questionType'
  | 'options'
  | 'answer'
>

const EXPECTED_HEADERS = ['考试类型', '学科', '题号（全局唯一）']

const MODULE_DEFINITIONS: Record<SupportedExamType, ModuleDefinition[]> = {
  ESAT: [
    {
      code: 'maths1',
      label: '数学1',
      aliases: ['maths1', 'mathematics1', '数学1', 'm1'],
      order: 1,
      durationSeconds: 40 * 60,
      expectedQuestionCount: 27,
      codePattern: /^ESAT-M1-/i,
    },
    {
      code: 'maths2',
      label: '数学2',
      aliases: ['maths2', 'mathematics2', '数学2', 'm2'],
      order: 2,
      durationSeconds: 40 * 60,
      expectedQuestionCount: 27,
      codePattern: /^ESAT-M2-/i,
    },
    {
      code: 'physics',
      label: '物理',
      aliases: ['physics', '物理', 'phy'],
      order: 3,
      durationSeconds: 40 * 60,
      expectedQuestionCount: 27,
      codePattern: /^ESAT-PHY-/i,
    },
    {
      code: 'biology',
      label: '生物',
      aliases: ['biology', '生物', 'bio'],
      order: 4,
      durationSeconds: 40 * 60,
      expectedQuestionCount: 27,
      codePattern: /^(?:ESAT-)?BIO-/i,
    },
    {
      code: 'chemistry',
      label: '化学',
      aliases: ['chemistry', '化学', 'chem'],
      order: 5,
      durationSeconds: 40 * 60,
      expectedQuestionCount: 27,
      codePattern: /^(?:ESAT-)?CHEM-/i,
    },
  ],
  TMUA: [
    {
      code: 'paper1',
      label: 'Paper1',
      aliases: ['paper1', 'paper 1'],
      order: 1,
      durationSeconds: 75 * 60,
      expectedQuestionCount: 20,
    },
    {
      code: 'paper2',
      label: 'Paper2',
      aliases: ['paper2', 'paper 2'],
      order: 2,
      durationSeconds: 75 * 60,
      expectedQuestionCount: 20,
    },
  ],
}

export const FULL_EXAM_REQUIRED_MODULE_COUNT: Record<SupportedExamType, number> = {
  ESAT: 3,
  TMUA: 2,
}

export const MOCK_PAPER_MODULE_POOL_CAPACITY: Record<SupportedExamType, number> = {
  ESAT: 5,
  TMUA: 2,
}

export class MockPaperWorkbookError extends Error {
  constructor(public readonly issues: string[]) {
    super(issues.join('\n'))
    this.name = 'MockPaperWorkbookError'
  }
}

// 单元格统一转成业务文本，避免数字题号被科学计数或布尔值混入校验。
function cellText(value: Row[number]): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value).trim()
}

// 模块名称只接受已确认的 ESAT 五模块和 TMUA 双卷名称。
function getModuleDefinition(examType: SupportedExamType, label: string): ModuleDefinition | null {
  const normalized = normalizeToken(label)
  return (
    MODULE_DEFINITIONS[examType].find((module) =>
      [module.label, module.code, ...module.aliases].some(
        (candidate) => normalizeToken(candidate) === normalized,
      ),
    ) || null
  )
}

// 归一化学科与模块标签，用于兼容空格、连字符和大小写差异。
function normalizeToken(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')
}

// 工作表名称固定承载考试、源序号和模块；源序号只用于稳定读取，不代表自动组套关系。
function parseSheetName(sheetName: string): {
  sourceKey: string
  sourceSequence: number
  examType: SupportedExamType
  moduleLabel: string
} | null {
  const match = /^(ESAT|TMUA)(\d+)-(.+)$/i.exec(sheetName.trim())
  if (!match) return null
  const examType = match[1].toUpperCase() as SupportedExamType
  return {
    sourceKey: `${examType}${match[2]}`,
    sourceSequence: Number(match[2]),
    examType,
    moduleLabel: match[3].trim(),
  }
}

// 读取上传清单并完成文件结构校验；题库存在性留到持久化草稿后的统一复核。
export async function parseMockPaperWorkbook(buffer: Buffer): Promise<ParsedWorkbookSet[]> {
  const issues: string[] = []
  let sheetNames: string[]
  try {
    sheetNames = await readSheetNames(buffer)
  } catch {
    throw new MockPaperWorkbookError(['文件无法解析，请确认上传的是有效的 .xlsx 文件'])
  }

  const setMap = new Map<string, ParsedWorkbookSet>()
  for (const sheetName of sheetNames) {
    const parsedName = parseSheetName(sheetName)
    if (!parsedName) {
      if (sheetName.trim() !== '套卷配置') {
        issues.push(`${sheetName}：工作表名称必须使用 ESAT01-数学1 或 TMUA01-Paper1 格式`)
      }
      continue
    }
    const definition = getModuleDefinition(parsedName.examType, parsedName.moduleLabel)
    if (!definition) {
      issues.push(`${sheetName}：不是当前支持的考试模块`)
      continue
    }

    let rows: Row[]
    try {
      rows = await readXlsxFile(buffer, { sheet: sheetName })
    } catch {
      issues.push(`${sheetName}：工作表内容无法读取`)
      continue
    }
    const headers = (rows[0] || []).slice(0, 3).map(cellText)
    if (EXPECTED_HEADERS.some((header, index) => headers[index] !== header)) {
      issues.push(`${sheetName}：表头必须为“${EXPECTED_HEADERS.join('、')}”`)
      continue
    }

    const questionCodes: string[] = []
    for (const [rowIndex, row] of rows.slice(1).entries()) {
      const values = row.slice(0, 3).map(cellText)
      if (values.every((value) => !value)) continue
      const excelRow = rowIndex + 2
      if (values[0].toUpperCase() !== parsedName.examType) {
        issues.push(`${sheetName} 第 ${excelRow} 行：考试类型应为 ${parsedName.examType}`)
      }
      if (normalizeToken(values[1]) !== normalizeToken(parsedName.moduleLabel)) {
        issues.push(`${sheetName} 第 ${excelRow} 行：学科应为 ${parsedName.moduleLabel}`)
      }
      if (!values[2]) {
        issues.push(`${sheetName} 第 ${excelRow} 行：题号不能为空`)
      } else if (values[2].length > 191) {
        issues.push(`${sheetName} 第 ${excelRow} 行：题号不能超过 191 个字符`)
      }
      questionCodes.push(values[2])
    }

    const set = setMap.get(parsedName.sourceKey) || {
      sourceKey: parsedName.sourceKey,
      sourceSequence: parsedName.sourceSequence,
      examType: parsedName.examType,
      modules: [],
    }
    set.modules.push({ ...definition, sourceSheetName: sheetName, questionCodes })
    setMap.set(parsedName.sourceKey, set)
  }

  if (setMap.size === 0 && issues.length === 0) {
    issues.push('没有识别到可导入的 ESAT 或 TMUA 单项卷')
  }
  if (issues.length) throw new MockPaperWorkbookError(issues)

  return [...setMap.values()]
    .map((set) => ({
      ...set,
      modules: [...set.modules].sort((left, right) => left.order - right.order),
    }))
    .sort((left, right) => {
      if (left.examType !== right.examType) return left.examType.localeCompare(right.examType)
      return left.sourceSequence - right.sourceSequence
    })
}

// 同时兼容当前独立题库 uniqueCode 和历史 sourceQuestionCode，但同一业务题号只能得到唯一候选。
async function findQuestionCandidates(codes: string[]): Promise<Map<string, ValidationQuestion[]>> {
  const uniqueCodes = [...new Set(codes.filter(Boolean))]
  const rows: ValidationQuestion[] = []
  for (let index = 0; index < uniqueCodes.length; index += 300) {
    const batch = uniqueCodes.slice(index, index + 300)
    rows.push(
      ...(await prisma.question.findMany({
        where: {
          OR: [{ uniqueCode: { in: batch } }, { sourceQuestionCode: { in: batch } }],
        },
        select: {
          id: true,
          uniqueCode: true,
          sourceQuestionCode: true,
          examType: true,
          status: true,
          moduleCode: true,
          subject: true,
          subjectCode: true,
          questionType: true,
          options: true,
          answer: true,
        },
      })),
    )
  }

  const candidates = new Map(uniqueCodes.map((code) => [code, [] as ValidationQuestion[]]))
  for (const row of rows) {
    for (const code of [row.uniqueCode, row.sourceQuestionCode]) {
      if (!code || !candidates.has(code)) continue
      const list = candidates.get(code)!
      if (!list.some((candidate) => candidate.id === row.id)) list.push(row)
    }
  }
  return candidates
}

// 题目模块校验优先使用结构化字段，旧题缺字段时才使用稳定题号前缀兜底。
function matchesModule(question: ValidationQuestion, module: ModuleDefinition, sourceCode: string): boolean {
  const resolvedModuleCode = resolveQuestionModuleCode({
    examType: question.examType,
    explicitModuleCode: question.moduleCode,
    subject: question.subject,
    subjectCode: question.subjectCode,
  })
  if (resolvedModuleCode === module.code) return true

  const aliases = new Set(
    [module.code, module.label, ...module.aliases].map((value) => normalizeToken(value)),
  )
  const actualValues = [question.moduleCode, question.subjectCode, question.subject]
    .map((value) => normalizeToken(value))
    .filter(Boolean)
  if (actualValues.some((value) => aliases.has(value))) return true
  return Boolean(module.codePattern?.test(sourceCode))
}

// 单题校验结果直接用于后台定位和发布拦截，错误文案保持可读且可恢复。
function validateQuestion(
  sourceCode: string,
  examType: SupportedExamType,
  module: ModuleDefinition,
  candidates: ValidationQuestion[],
  duplicated: boolean,
): { question: ValidationQuestion | null; issues: string[] } {
  const issues: string[] = []
  if (!sourceCode) return { question: null, issues: ['题号不能为空'] }
  if (duplicated) issues.push('题号在当前套卷中重复')
  if (candidates.length === 0) return { question: null, issues: [...issues, '题目不存在'] }
  if (candidates.length > 1) return { question: null, issues: [...issues, '题号匹配到多道题'] }

  const question = candidates[0]
  if (question.status !== QUESTION_STATUS.PUBLISHED) {
    issues.push(question.status === 'archived' ? '题目已归档' : '题目尚未发布')
  }
  if (question.examType !== examType) issues.push(`题目考试类型应为 ${examType}`)
  if (!matchesModule(question, module, sourceCode)) issues.push(`题目不属于${module.label}模块`)
  if (question.questionType !== 'single_choice') issues.push('当前模考只支持单选题')
  if (parseJsonArray(question.options).length < 2) issues.push('题目选项不完整')
  if (parseJsonArray(question.answer).length !== 1) issues.push('题目标准答案不完整')
  return { question, issues }
}

type MockRuntimeModule = {
  code: string
  label: string
  moduleOrder: number
  durationSeconds: number
  expectedQuestionCount: number
  validationStatus: string
  publicationStatus: string
  sourceModuleId?: string | null
}

// 运行载体同步时只收录已发布单项；首次发布则先用全部校验通过的单项生成载体。
function buildMockRuntimeConfig(
  examType: string,
  modules: MockRuntimeModule[],
  publishedOnly = false,
) {
  const readyModules = modules.filter(
    (module) => (
      module.validationStatus === MOCK_PAPER_VALIDATION_STATUS.VALID
      && (
        !publishedOnly
        || (
          !module.sourceModuleId
          && module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED
        )
      )
    ),
  )
  const isEsat = examType === EXAM_TYPE.ESAT
  const effectiveModules = isEsat ? readyModules.slice(0, 3) : readyModules
  return {
    readyModules,
    durationMinutes: Math.round(
      effectiveModules.reduce((sum, module) => sum + module.durationSeconds, 0) / 60,
    ),
    totalQuestions: effectiveModules.reduce(
      (sum, module) => sum + module.expectedQuestionCount,
      0,
    ),
    breakDurationSeconds: isEsat ? 180 : 0,
    moduleConfig: readyModules.map((module) => ({
      code: module.code,
      subject: module.label,
      subjectCode: module.code,
      order: module.moduleOrder,
      durationSeconds: module.durationSeconds,
      questionCount: module.expectedQuestionCount,
    })),
  }
}

// 已发布套卷按全部模块同步；其他状态只保留独立发布的原始单项运行能力。
async function syncPublishedMockPaperRuntime(mockPaperSetId: string): Promise<void> {
  const set = await prisma.mockPaperSet.findUnique({
    where: { id: mockPaperSetId },
    include: { modules: { orderBy: { moduleOrder: 'asc' } } },
  })
  if (!set || !set.paperId) return
  const suiteRuntimeEnabled = (
    set.status === MOCK_PAPER_STATUS.PUBLISHED
    && deriveMockPaperReadiness(set.examType, set.modules).fullExamReady
  )
  const runtime = buildMockRuntimeConfig(set.examType, set.modules, !suiteRuntimeEnabled)
  if (!runtime.readyModules.length) {
    await prisma.paper.update({ where: { id: set.paperId }, data: { status: 'archived' } })
    return
  }
  await prisma.paper.update({
    where: { id: set.paperId },
    data: {
      duration: runtime.durationMinutes,
      totalQuestions: runtime.totalQuestions,
      accessTier: set.accessTier,
      breakDurationSeconds: runtime.breakDurationSeconds,
      moduleConfig: runtime.moduleConfig as Prisma.InputJsonValue,
      status: 'published',
    },
  })
}

// 每次上传或替换后逐模块复核，再从可用模块派生整卷是否完整。
export async function revalidateMockPaperSet(mockPaperSetId: string): Promise<void> {
  const set = await prisma.mockPaperSet.findUnique({
    where: { id: mockPaperSetId },
    include: {
      modules: {
        orderBy: { moduleOrder: 'asc' },
        include: { questions: { orderBy: { position: 'asc' } } },
      },
    },
  })
  if (!set) return

  const allRows = set.modules.flatMap((module) => module.questions)
  const sourceCounts = new Map<string, number>()
  for (const row of allRows) {
    if (row.sourceCode) sourceCounts.set(row.sourceCode, (sourceCounts.get(row.sourceCode) || 0) + 1)
  }
  const candidates = await findQuestionCandidates(allRows.map((row) => row.sourceCode))
  const expectedModules = MODULE_DEFINITIONS[set.examType as SupportedExamType] || []
  const supportedActualModuleCodes = set.modules
    .map((module) => module.code)
    .filter((code) => expectedModules.some((expected) => expected.code === code))
  const setIssues: string[] = []
  const actualModuleCodes = set.modules.map((module) => module.code)
  if (set.examType === EXAM_TYPE.ESAT) {
    if (!actualModuleCodes.includes('maths1')) setIssues.push('缺少数学1模块')
    const missingModuleCount = Math.max(
      0,
      FULL_EXAM_REQUIRED_MODULE_COUNT.ESAT - new Set(supportedActualModuleCodes).size,
    )
    if (missingModuleCount > 0) setIssues.push(`完整模考还需 ${missingModuleCount} 个模块`)
  } else {
    for (const expected of expectedModules) {
      if (!actualModuleCodes.includes(expected.code)) setIssues.push(`缺少${expected.label}模块`)
    }
  }
  for (const module of set.modules) {
    if (!expectedModules.some((expected) => expected.code === module.code)) {
      setIssues.push(`存在不支持的${module.label}模块`)
    }
  }

  let invalidQuestionCount = 0
  let moduleStructureIssueCount = 0
  await prisma.$transaction(async (tx) => {
    for (const module of set.modules) {
      const definition = expectedModules.find((item) => item.code === module.code)
      const moduleIssues: string[] = []
      if (!definition) {
        moduleIssues.push('模块不属于当前考试')
      } else if (module.questions.length !== definition.expectedQuestionCount) {
        moduleIssues.push(
          `${module.label}应为 ${definition.expectedQuestionCount} 题，当前为 ${module.questions.length} 题`,
        )
      }
      moduleStructureIssueCount += moduleIssues.length

      let moduleInvalidCount = 0
      for (const row of module.questions) {
        const result = definition
          ? validateQuestion(
              row.sourceCode,
              set.examType as SupportedExamType,
              definition,
              candidates.get(row.sourceCode) || [],
              (sourceCounts.get(row.sourceCode) || 0) > 1,
            )
          : { question: null, issues: ['模块不属于当前考试'] }
        if (result.issues.length) {
          moduleInvalidCount += 1
          invalidQuestionCount += 1
        }
        await tx.mockPaperQuestion.update({
          where: { id: row.id },
          data: {
            questionId: result.question?.id || null,
            validationStatus: result.issues.length
              ? MOCK_PAPER_VALIDATION_STATUS.INVALID
              : MOCK_PAPER_VALIDATION_STATUS.VALID,
            issues: result.issues as Prisma.InputJsonValue,
          },
        })
      }
      await tx.mockPaperModule.update({
        where: { id: module.id },
        data: {
          durationSeconds: definition?.durationSeconds || module.durationSeconds,
          expectedQuestionCount: definition?.expectedQuestionCount || module.expectedQuestionCount,
          questionCount: module.questions.length,
          validationStatus:
            moduleInvalidCount + moduleIssues.length === 0
              ? MOCK_PAPER_VALIDATION_STATUS.VALID
              : MOCK_PAPER_VALIDATION_STATUS.INVALID,
          issueCount: moduleInvalidCount + moduleIssues.length,
          issues: moduleIssues as Prisma.InputJsonValue,
        },
      })
    }

    const issueCount = invalidQuestionCount + moduleStructureIssueCount + setIssues.length
    await tx.mockPaperSet.update({
      where: { id: set.id },
      data: {
        questionCount: allRows.length,
        issueCount,
        issues: setIssues as Prisma.InputJsonValue,
      },
    })
  })
  // 套卷删除或下线后仍需维持其中独立发布单项的运行载体。
  await syncPublishedMockPaperRuntime(set.id)
}

// 同一考试独立编号；空库从 001 开始，后续上传只向后追加且不覆盖已有套卷。
async function getNextSequenceNumbers(
  sets: ParsedWorkbookSet[],
): Promise<Map<SupportedExamType, number>> {
  const result = new Map<SupportedExamType, number>()
  for (const examType of [...new Set(sets.map((set) => set.examType))]) {
    const latest = await prisma.mockPaperSet.findFirst({
      where: { examType },
      orderBy: { sequenceNo: 'desc' },
      select: { sequenceNo: true },
    })
    result.set(examType, (latest?.sequenceNo || 0) + 1)
  }
  return result
}

// 每个 Sheet 独立创建一个无所属套卷的来源模块；只有管理员主动组卷才建立套卷关系。
export async function createMockPaperDraftsFromWorkbook(
  sets: ParsedWorkbookSet[],
  sourceFileName: string,
  accessTier: string,
): Promise<string[]> {
  const nextSequences = await getNextSequenceNumbers(sets)
  const createdIds: string[] = []
  const importedAt = new Date()
  await prisma.$transaction(async (tx) => {
    for (const set of sets) {
      for (const module of set.modules) {
        const sequenceNo = nextSequences.get(set.examType) || 1
        nextSequences.set(set.examType, sequenceNo + 1)
        const suffix = String(sequenceNo).padStart(3, '0')
        const created = await tx.mockPaperSet.create({
          data: {
            code: `${set.examType}-MOCK-${suffix}`,
            sequenceNo,
            examType: set.examType,
            title: `${set.examType} 模拟卷 No.${suffix}`,
            accessTier,
            sourceFileName,
            issues: [],
            deletedAt: importedAt,
            modules: {
              create: {
                code: module.code,
                label: module.label,
                title: formatMockPaperModuleTitle({
                  examType: set.examType,
                  code: module.code,
                  label: module.label,
                  sequenceNo,
                }),
                accessTier,
                moduleOrder: module.order,
                durationSeconds: module.durationSeconds,
                expectedQuestionCount: module.expectedQuestionCount,
                questionCount: module.questionCodes.length,
                issues: [],
                questions: {
                  create: module.questionCodes.map((sourceCode, index) => ({
                    sourceCode,
                    position: index + 1,
                    issues: [],
                  })),
                },
              },
            },
          },
          select: { id: true },
        })
        createdIds.push(created.id)
      }
    }
  })

  for (const id of createdIds) await revalidateMockPaperSet(id)
  return createdIds
}

// 管理员从未组套的独立单项创建新套卷，原始单项保留，套卷内复制稳定题序并独占来源。
export async function composeMockPaperSetFromModules(
  moduleIds: string[],
  accessTier: string,
): Promise<string> {
  const uniqueIds = [...new Set(moduleIds)]
  const modules = await prisma.mockPaperModule.findMany({
    where: {
      id: { in: uniqueIds },
      sourceModuleId: null,
      validationStatus: MOCK_PAPER_VALIDATION_STATUS.VALID,
      composedCopies: { none: {} },
    },
    include: {
      _count: { select: { composedCopies: true } },
      mockPaperSet: { include: { _count: { select: { modules: true } } } },
      questions: { orderBy: { position: 'asc' } },
    },
  })
  if (
    modules.length !== uniqueIds.length
    || modules.some((module) => (
      !canClaimMockPaperSource({
        sourceModuleId: module.sourceModuleId,
        composedCopyCount: module._count.composedCopies,
        ownerModuleCount: module.mockPaperSet._count.modules,
        ownerStatus: module.mockPaperSet.status,
        ownerDeletedAt: module.mockPaperSet.deletedAt,
      })
    ))
  ) throw new Error('MOCK_PAPER_COMPOSE_SOURCE_UNAVAILABLE')

  const examTypes = new Set(modules.map((module) => module.mockPaperSet.examType))
  const moduleCodes = new Set(modules.map((module) => module.code))
  if (examTypes.size !== 1 || moduleCodes.size !== modules.length) {
    throw new Error('MOCK_PAPER_COMPOSE_STRUCTURE_INVALID')
  }
  const examType = modules[0]?.mockPaperSet.examType as SupportedExamType | undefined
  const validStructure = examType === EXAM_TYPE.ESAT
    ? modules.length >= FULL_EXAM_REQUIRED_MODULE_COUNT.ESAT
      && modules.length <= MOCK_PAPER_MODULE_POOL_CAPACITY.ESAT
      && moduleCodes.has('maths1')
    : examType === EXAM_TYPE.TMUA
      && modules.length === FULL_EXAM_REQUIRED_MODULE_COUNT.TMUA
      && moduleCodes.has('paper1')
      && moduleCodes.has('paper2')
  if (!examType || !validStructure) throw new Error('MOCK_PAPER_COMPOSE_STRUCTURE_INVALID')

  const latest = await prisma.mockPaperSet.findFirst({
    where: { examType },
    orderBy: { sequenceNo: 'desc' },
    select: { sequenceNo: true },
  })
  const sequenceNo = (latest?.sequenceNo || 0) + 1
  const suffix = String(sequenceNo).padStart(3, '0')
  const orderedModules = [...modules].sort((left, right) => left.moduleOrder - right.moduleOrder)
  const created = await prisma.mockPaperSet.create({
    data: {
      code: `${examType}-MOCK-${suffix}`,
      sequenceNo,
      examType,
      title: `${examType} 模拟卷 No.${suffix}`,
      accessTier,
      sourceFileName: null,
      issues: [],
      modules: {
        create: orderedModules.map((module) => ({
          sourceModuleId: module.id,
          code: module.code,
          label: module.label,
          title: formatMockPaperModuleTitle({
            title: module.title,
            examType: module.mockPaperSet.examType,
            code: module.code,
            label: module.label,
            sequenceNo: module.mockPaperSet.sequenceNo,
          }),
          accessTier: module.accessTier,
          moduleOrder: module.moduleOrder,
          durationSeconds: module.durationSeconds,
          expectedQuestionCount: module.expectedQuestionCount,
          questionCount: module.questionCount,
          publicationStatus: module.publicationStatus,
          publishedAt: module.publishedAt,
          archivedAt: module.archivedAt,
          validationStatus: module.validationStatus,
          issueCount: module.issueCount,
          issues: module.issues as Prisma.InputJsonValue,
          questions: {
            create: module.questions.map((question) => ({
              questionId: question.questionId,
              sourceCode: question.sourceCode,
              position: question.position,
              validationStatus: question.validationStatus,
              issues: question.issues as Prisma.InputJsonValue,
            })),
          },
        })),
      },
    },
    select: { id: true },
  })
  await revalidateMockPaperSet(created.id)
  return created.id
}

// 单项发布只开放指定 Module/Paper；所属套卷继续保持草稿，不连带发布其他模块。
export async function publishMockPaperModule(moduleId: string): Promise<{
  id: string
  moduleId: string
  paperId: string
}> {
  const source = await prisma.mockPaperModule.findUnique({
    where: { id: moduleId },
    include: {
      _count: { select: { composedCopies: true } },
      mockPaperSet: { include: { _count: { select: { modules: true } } } },
    },
  })
  if (!source) throw new Error('MOCK_PAPER_MODULE_NOT_FOUND')

  if (source.sourceModuleId) throw new Error('MOCK_PAPER_MODULE_UNAVAILABLE')
  await revalidateMockPaperSet(source.mockPaperSetId)
  const set = await prisma.mockPaperSet.findUnique({
    where: { id: source.mockPaperSetId },
    include: { modules: { orderBy: { moduleOrder: 'asc' } } },
  })
  if (!set) throw new Error('MOCK_PAPER_SET_NOT_FOUND')
  const target = set.modules.find((module) => module.id === moduleId)
  if (
    !target
    || target.validationStatus !== MOCK_PAPER_VALIDATION_STATUS.VALID
  ) throw new Error('MOCK_PAPER_MODULE_UNAVAILABLE')

  const runtime = buildMockRuntimeConfig(set.examType, set.modules)
  const paperId = set.paperId || `mock-paper-${set.id}`
  const publishedAt = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.paper.upsert({
      where: { id: paperId },
      update: {
        title: set.title,
        code: set.code,
        examType: set.examType,
        duration: runtime.durationMinutes,
        totalQuestions: runtime.totalQuestions,
        paperType: PAPER_TYPE.MOCK_PAPER,
        accessTier: set.accessTier,
        deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
        breakDurationSeconds: runtime.breakDurationSeconds,
        moduleConfig: runtime.moduleConfig as Prisma.InputJsonValue,
        assemblyType: 'fixed_mock',
        sourceExamTypes: [set.examType],
        remarks: `模考试卷库单项 ${target.code} 的运行载体`,
        status: 'published',
      },
      create: {
        id: paperId,
        title: set.title,
        code: set.code,
        examType: set.examType,
        year: publishedAt.getFullYear(),
        duration: runtime.durationMinutes,
        totalQuestions: runtime.totalQuestions,
        paperType: PAPER_TYPE.MOCK_PAPER,
        accessTier: set.accessTier,
        deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
        breakDurationSeconds: runtime.breakDurationSeconds,
        moduleConfig: runtime.moduleConfig as Prisma.InputJsonValue,
        assemblyType: 'fixed_mock',
        sourceExamTypes: [set.examType],
        remarks: `模考试卷库单项 ${target.code} 的运行载体`,
        status: 'published',
      },
    })
    await tx.mockPaperModule.updateMany({
      where: {
        OR: [
          { id: target.id },
          { sourceModuleId: target.id },
        ],
      },
      data: {
        publicationStatus: MOCK_PAPER_MODULE_STATUS.PUBLISHED,
        publishedAt,
        archivedAt: null,
      },
    })
    await tx.mockPaperSet.update({
      where: { id: set.id },
      data: { paperId },
    })
  })
  return { id: set.id, moduleId: target.id, paperId }
}

// 单项下线只关闭其独立模考入口；套卷副本同步状态，但不改变完整套卷及其运行载体。
export async function archiveMockPaperModule(moduleId: string): Promise<{
  id: string
  moduleId: string
  status: string
  archivedAt: Date
}> {
  const source = await prisma.mockPaperModule.findUnique({
    where: { id: moduleId },
    include: {
      mockPaperSet: { select: { id: true, paperId: true, status: true } },
    },
  })
  if (!source) throw new Error('MOCK_PAPER_MODULE_NOT_FOUND')
  if (source.sourceModuleId) throw new Error('MOCK_PAPER_MODULE_UNAVAILABLE')
  if (source.publicationStatus !== MOCK_PAPER_MODULE_STATUS.PUBLISHED) {
    throw new Error('MOCK_PAPER_MODULE_NOT_PUBLISHED')
  }

  const archivedAt = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.mockPaperModule.updateMany({
      where: {
        OR: [
          { id: source.id },
          { sourceModuleId: source.id },
        ],
      },
      data: {
        publicationStatus: MOCK_PAPER_MODULE_STATUS.ARCHIVED,
        archivedAt,
      },
    })

    // 草稿或隐藏来源容器的 Paper 只服务于单项；已发布套卷的 Paper 必须继续开放完整模考。
    if (
      source.mockPaperSet.paperId
      && source.mockPaperSet.status !== MOCK_PAPER_STATUS.PUBLISHED
    ) {
      await tx.paper.update({
        where: { id: source.mockPaperSet.paperId },
        data: { status: 'archived' },
      })
    }
  })

  return {
    id: source.mockPaperSet.id,
    moduleId: source.id,
    status: MOCK_PAPER_MODULE_STATUS.ARCHIVED,
    archivedAt,
  }
}

// 套卷发布要求当前包含的全部单项校验通过，不改变任何单项的独立发布状态。
export async function publishMockPaperSet(mockPaperSetId: string): Promise<{
  id: string
  paperId: string
  status: string
  publishedAt: Date | null
  suitePublished: boolean
  publishedModuleCount: number
}> {
  await revalidateMockPaperSet(mockPaperSetId)
  const set = await prisma.mockPaperSet.findUnique({
    where: { id: mockPaperSetId },
    include: { modules: { orderBy: { moduleOrder: 'asc' } } },
  })
  if (!set || set.deletedAt) throw new Error('MOCK_PAPER_SET_NOT_FOUND')
  if (set.status !== MOCK_PAPER_STATUS.DRAFT) throw new Error('MOCK_PAPER_SET_LOCKED')
  const runtime = buildMockRuntimeConfig(set.examType, set.modules)
  const readiness = deriveMockPaperReadiness(set.examType, set.modules)
  if (!readiness.fullExamReady) throw new Error('MOCK_PAPER_SET_NOT_READY')

  const paperId = set.paperId || `mock-paper-${set.id}`
  const publishedAt = new Date()
  const suitePublished = true

  return prisma.$transaction(async (tx) => {
    await tx.paper.upsert({
      where: { id: paperId },
      update: {
        title: set.title,
        code: set.code,
        examType: set.examType,
        duration: runtime.durationMinutes,
        totalQuestions: runtime.totalQuestions,
        paperType: PAPER_TYPE.MOCK_PAPER,
        accessTier: set.accessTier,
        deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
        breakDurationSeconds: runtime.breakDurationSeconds,
        moduleConfig: runtime.moduleConfig as Prisma.InputJsonValue,
        assemblyType: 'fixed_mock',
        sourceExamTypes: [set.examType],
        remarks: `模考试卷库套卷 ${set.code} 的运行载体`,
        status: 'published',
      },
      create: {
        id: paperId,
        title: set.title,
        code: set.code,
        examType: set.examType,
        year: publishedAt.getFullYear(),
        duration: runtime.durationMinutes,
        totalQuestions: runtime.totalQuestions,
        paperType: PAPER_TYPE.MOCK_PAPER,
        accessTier: set.accessTier,
        deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
        breakDurationSeconds: runtime.breakDurationSeconds,
        moduleConfig: runtime.moduleConfig as Prisma.InputJsonValue,
        assemblyType: 'fixed_mock',
        sourceExamTypes: [set.examType],
        remarks: `模考试卷库套卷 ${set.code} 的运行载体`,
        status: 'published',
      },
    })
    const updated = await tx.mockPaperSet.update({
      where: { id: set.id },
      data: {
        paperId,
        status: MOCK_PAPER_STATUS.PUBLISHED,
        publishedAt,
        archivedAt: null,
      },
      select: { id: true, paperId: true, status: true, publishedAt: true },
    })
    return {
      id: updated.id,
      paperId: updated.paperId!,
      status: updated.status,
      publishedAt: updated.publishedAt,
      suitePublished,
      publishedModuleCount: 0,
    }
  })
}

// 下线只禁止创建新答卷，运行载体和历史关联继续保留供恢复、交卷和报告读取。
export async function archiveMockPaperSet(mockPaperSetId: string): Promise<{
  id: string
  status: string
  archivedAt: Date
}> {
  const set = await prisma.mockPaperSet.findUnique({
    where: { id: mockPaperSetId },
    include: {
      modules: { select: { sourceModuleId: true, publicationStatus: true } },
    },
  })
  if (!set || set.deletedAt) throw new Error('MOCK_PAPER_SET_NOT_FOUND')
  if (set.status !== MOCK_PAPER_STATUS.PUBLISHED || !set.paperId) {
    throw new Error('MOCK_PAPER_SET_NOT_PUBLISHED')
  }
  const archivedAt = new Date()
  return prisma.$transaction(async (tx) => {
    const hasPublishedCanonicalModule = set.modules.some((module) => (
      !module.sourceModuleId
      && module.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED
    ))
    if (!hasPublishedCanonicalModule) {
      await tx.paper.update({ where: { id: set.paperId! }, data: { status: 'archived' } })
    }
    const updated = await tx.mockPaperSet.update({
      where: { id: set.id },
      data: { status: MOCK_PAPER_STATUS.ARCHIVED, archivedAt },
      select: { id: true, status: true, archivedAt: true },
    })
    return { id: updated.id, status: updated.status, archivedAt: updated.archivedAt! }
  })
}
