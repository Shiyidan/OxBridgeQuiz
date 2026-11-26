// 后台模考 JSON 导出：读取当前组卷关系，并复用正式题目的统一内容结构。
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { PAPER_TYPE, PAPER_DELIVERY_MODE, EXAM_TYPE } from '../constants/domain.js'
import { formatQuestionDocument } from '../utils/questionDocument.js'
import { buildMockPaperNumber } from '../utils/mockPaperNumber.js'
import { formatMockPaperModuleTitle } from '../utils/mockPaperTitle.js'

const moduleExportInclude = {
  series: { select: { sequenceNo: true } },
  sourceModule: {
    select: { id: true, title: true, code: true, label: true, version: true, series: { select: { sequenceNo: true } } },
  },
  questions: { orderBy: { position: 'asc' }, include: { question: true } },
} satisfies Prisma.MockPaperModuleInclude

type ExportModule = Prisma.MockPaperModuleGetPayload<{ include: typeof moduleExportInclude }>
type ExportSet = Prisma.MockPaperSetGetPayload<{ include: { series: { select: { sequenceNo: true } } } }>

export class MockPaperExportError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) { super(message) }
}

// 题目不存在时阻止整个导出，不能把缺题草稿悄悄变成少题文件。
export function buildMockPaperDocument(set: ExportSet, modules: ExportModule[], singleModule = false) {
  if (!modules.length || modules.some((module) => !module.questions.length)) {
    throw new MockPaperExportError('试卷包含空模块，请补充题目后导出', 'MOCK_PAPER_EXPORT_EMPTY', 422)
  }
  const missing = modules.flatMap((module) => module.questions
    .filter((item) => !item.question)
    .map((item) => `${module.code} 第 ${item.position} 题（${item.sourceCode}）`))
  if (missing.length) {
    throw new MockPaperExportError(`有 ${missing.length} 道题未关联到题库，无法完整导出：${missing.slice(0, 5).join('；')}`, 'MOCK_PAPER_EXPORT_MISSING_QUESTIONS', 422)
  }
  const moduleConfig = modules.map((module, index) => {
    const source = module.sourceModule || module
    return {
      id: module.id, code: module.code, subject: module.label,
      title: formatMockPaperModuleTitle({ ...source, examType: set.examType, sequenceNo: source.series?.sequenceNo || 0 }),
      sequenceNo: buildMockPaperNumber(set.examType, source.series?.sequenceNo, source.version, source.code),
      order: index + 1, durationSeconds: module.durationSeconds, questionCount: module.questions.length,
    }
  })
  let number = 0
  const questions = modules.flatMap((module, index) => module.questions.map((item) => {
    const document = formatQuestionDocument(item.question!)
    return {
      ...document,
      meta: {
        ...document.meta,
        paperId: set.paperId, number: ++number, moduleCode: module.code,
        moduleOrder: index + 1, moduleQuestionNumber: item.position,
        mockPaper: { setId: set.id, moduleId: module.id, sourceModuleId: module.sourceModuleId, itemId: item.id, sourceCode: item.sourceCode },
      },
    }
  }))
  const first = modules[0]!
  return {
    format: 'paper-content-solution-meta-v1',
    paper: {
      id: set.paperId, mockPaperSetId: set.id, exportScope: singleModule ? 'module' : 'set',
      title: singleModule ? moduleConfig[0]!.title : set.title,
      code: singleModule ? moduleConfig[0]!.sequenceNo : buildMockPaperNumber(set.examType, set.series?.sequenceNo, set.version),
      examType: set.examType, paperType: PAPER_TYPE.MOCK_PAPER,
      status: singleModule ? first.publicationStatus : set.status,
      accessTier: singleModule ? first.accessTier : set.accessTier,
      version: singleModule ? first.version : set.version,
      sourceFileName: set.sourceFileName,
      deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
      breakDurationSeconds: !singleModule && set.examType === EXAM_TYPE.ESAT ? 180 : 0,
      duration: Math.ceil(moduleConfig.reduce((sum, module) => sum + module.durationSeconds, 0) / 60),
      totalQuestions: questions.length, moduleConfig,
    },
    questions,
  }
}

// 从套卷模块的当前题位读取内容，草稿没有运行 Paper 时也能完整导出。
export async function exportMockPaperSetDocument(id: string) {
  const set = await prisma.mockPaperSet.findFirst({
    where: { id, deletedAt: null, seriesId: { not: null } },
    include: { series: { select: { sequenceNo: true } }, modules: { orderBy: { moduleOrder: 'asc' }, include: moduleExportInclude } },
  })
  if (!set) throw new MockPaperExportError('模考试卷不存在', 'MOCK_PAPER_SET_NOT_FOUND', 404)
  return buildMockPaperDocument(set, set.modules)
}

// 隐藏容器中的原始单项仍可导出；套卷副本只能随套卷导出，避免错用单项身份。
export async function exportMockPaperModuleDocument(id: string) {
  const module = await prisma.mockPaperModule.findUnique({
    where: { id },
    include: { ...moduleExportInclude, mockPaperSet: { include: { series: { select: { sequenceNo: true } } } } },
  })
  if (!module || module.sourceModuleId || !module.series) {
    throw new MockPaperExportError('单项卷不存在', 'MOCK_PAPER_MODULE_NOT_AVAILABLE', 404)
  }
  return buildMockPaperDocument(module.mockPaperSet, [module], true)
}
