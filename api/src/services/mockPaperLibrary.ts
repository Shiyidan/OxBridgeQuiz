// 模考试卷库服务：解析组卷 Excel、关联现有题库题目，并维护草稿的可发布校验结果。
import { Prisma, type Question } from '@prisma/client'
import readXlsxFile, { readSheetNames, type Row } from 'read-excel-file/node'
import {
  EXAM_TYPE,
  MOCK_PAPER_STATUS,
  MOCK_PAPER_VALIDATION_STATUS,
  PAPER_DELIVERY_MODE,
  PAPER_TYPE,
  QUESTION_STATUS,
} from '../constants/domain.js'
import { prisma } from './prisma.js'
import { parseJsonArray } from '../utils/jsonField.js'
import { resolveQuestionModuleCode } from '../utils/questionModule.js'

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

// 工作表名称固定承载考试、源套卷序号和模块，保证批量导入可以稳定分组。
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
    if (set.modules.some((module) => module.code === definition.code)) {
      issues.push(`${parsedName.sourceKey}：模块 ${definition.label} 重复`)
      continue
    }
    set.modules.push({ ...definition, sourceSheetName: sheetName, questionCodes })
    setMap.set(parsedName.sourceKey, set)
  }

  if (setMap.size === 0 && issues.length === 0) {
    issues.push('没有识别到可导入的 ESAT 或 TMUA 套卷')
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
}

// 运行载体只收录当前校验通过的单项；完整模考与单项模考后续共享同一组稳定配置。
function buildMockRuntimeConfig(examType: string, modules: MockRuntimeModule[]) {
  const readyModules = modules.filter(
    (module) => module.validationStatus === MOCK_PAPER_VALIDATION_STATUS.VALID,
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

// 已发布 Mock 的待处理单项修复后同步运行载体，不改变既有答卷已经冻结的结构快照。
async function syncPublishedMockPaperRuntime(mockPaperSetId: string): Promise<void> {
  const set = await prisma.mockPaperSet.findUnique({
    where: { id: mockPaperSetId },
    include: { modules: { orderBy: { moduleOrder: 'asc' } } },
  })
  if (!set || set.status !== MOCK_PAPER_STATUS.PUBLISHED || !set.paperId) return
  const runtime = buildMockRuntimeConfig(set.examType, set.modules)
  if (!runtime.readyModules.length) return
  await prisma.paper.update({
    where: { id: set.paperId },
    data: {
      duration: runtime.durationMinutes,
      totalQuestions: runtime.totalQuestions,
      accessTier: set.accessTier,
      breakDurationSeconds: runtime.breakDurationSeconds,
      moduleConfig: runtime.moduleConfig as Prisma.InputJsonValue,
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
  const readyModuleCodes = new Set<string>()
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
      if (moduleInvalidCount + moduleIssues.length === 0) readyModuleCodes.add(module.code)
    }

    const fullExamReady = set.examType === EXAM_TYPE.ESAT
      ? readyModuleCodes.has('maths1')
        && readyModuleCodes.size >= FULL_EXAM_REQUIRED_MODULE_COUNT.ESAT
      : expectedModules.length > 0
        && expectedModules.every((module) => readyModuleCodes.has(module.code))
    const issueCount = invalidQuestionCount + moduleStructureIssueCount + setIssues.length
    await tx.mockPaperSet.update({
      where: { id: set.id },
      data: {
        questionCount: allRows.length,
        readyModuleCount: readyModuleCodes.size,
        fullExamReady,
        issueCount,
        validationStatus:
          fullExamReady
            ? MOCK_PAPER_VALIDATION_STATUS.VALID
            : MOCK_PAPER_VALIDATION_STATUS.INVALID,
        issues: setIssues as Prisma.InputJsonValue,
      },
    })
  })
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

// 文件中的源编号只用于排序，正式名称按目标库各考试的连续序号从 001 自动生成。
export async function createMockPaperDraftsFromWorkbook(
  sets: ParsedWorkbookSet[],
  sourceFileName: string,
  accessTier: string,
): Promise<string[]> {
  const nextSequences = await getNextSequenceNumbers(sets)
  const createdIds: string[] = []
  await prisma.$transaction(async (tx) => {
    for (const set of sets) {
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
          modules: {
            create: set.modules.map((module) => ({
              code: module.code,
              label: module.label,
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
            })),
          },
        },
        select: { id: true },
      })
      createdIds.push(created.id)
    }
  })

  for (const id of createdIds) await revalidateMockPaperSet(id)
  return createdIds
}

// 发布时只要求至少一个模块可用；完整模考目录继续由 fullExamReady 单独约束。
export async function publishMockPaperSet(mockPaperSetId: string): Promise<{
  id: string
  paperId: string
  status: string
  publishedAt: Date
}> {
  await revalidateMockPaperSet(mockPaperSetId)
  const set = await prisma.mockPaperSet.findUnique({
    where: { id: mockPaperSetId },
    include: { modules: { orderBy: { moduleOrder: 'asc' } } },
  })
  if (!set) throw new Error('MOCK_PAPER_SET_NOT_FOUND')
  if (set.status === MOCK_PAPER_STATUS.ARCHIVED) throw new Error('MOCK_PAPER_SET_ARCHIVED')
  const runtime = buildMockRuntimeConfig(set.examType, set.modules)
  if (!runtime.readyModules.length) throw new Error('MOCK_PAPER_SET_NO_READY_MODULES')

  const paperId = set.paperId || `mock-paper-${set.id}`
  const publishedAt = new Date()

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
      publishedAt: updated.publishedAt!,
    }
  })
}

// 下线只禁止创建新答卷，运行载体和历史关联继续保留供恢复、交卷和报告读取。
export async function archiveMockPaperSet(mockPaperSetId: string): Promise<{
  id: string
  status: string
  archivedAt: Date
}> {
  const set = await prisma.mockPaperSet.findUnique({ where: { id: mockPaperSetId } })
  if (!set) throw new Error('MOCK_PAPER_SET_NOT_FOUND')
  if (set.status !== MOCK_PAPER_STATUS.PUBLISHED || !set.paperId) {
    throw new Error('MOCK_PAPER_SET_NOT_PUBLISHED')
  }
  const archivedAt = new Date()
  return prisma.$transaction(async (tx) => {
    await tx.paper.update({ where: { id: set.paperId! }, data: { status: 'archived' } })
    const updated = await tx.mockPaperSet.update({
      where: { id: set.id },
      data: { status: MOCK_PAPER_STATUS.ARCHIVED, archivedAt },
      select: { id: true, status: true, archivedAt: true },
    })
    return { id: updated.id, status: updated.status, archivedAt: updated.archivedAt! }
  })
}
