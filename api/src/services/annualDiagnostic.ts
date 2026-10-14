// 年度分科诊断的规范校验、选科与导入；历史内容通过新增版本保留。
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { DIAGNOSTIC_ASSEMBLY, EXAM_TYPE, ESAT_MODULES, TMUA_PAPERS, PAPER_TYPE, PAPER_DELIVERY_MODE, PAPER_ACCESS_TIER } from '../constants/domain.js'
import { canonicalQuestionToInput, formatQuestionDocument, buildQuestionStorage, questionObject, type QuestionDocument } from '../utils/questionDocument.js'
import { syncPaperQuestions } from '../utils/questionSync.js'
import { createNumericId } from '../utils/id.js'

export const ANNUAL_DOCUMENT_FORMAT = 'paper-content-solution-meta-v1'
export interface AnnualModule { code: string; subject: string; subjectCode: string | null; order: number; durationSeconds: number; questionCount: number }
export interface AnnualDocument {
  format: string
  paper: { title: string; code?: string; examType: string; year: number; accessTier: string; duration: number; totalQuestions: number; moduleConfig: AnnualModule[]; remarks: string | null; assemblyType: string; deliveryMode: string; breakDurationSeconds: number }
  questions: QuestionDocument[]
}

export class AnnualDiagnosticError extends Error {
  constructor(message: string, readonly code = 'DIAGNOSTIC_DOCUMENT_INVALID') { super(message) }
}

// 单题所有关键数组和资源引用必须完整；不把错误 JSON 静默转为空列表。
function validateQuestion(document: QuestionDocument, examType: string, index: number) {
  const q = canonicalQuestionToInput(document)
  const prefix = `第 ${index + 1} 题`
  if (typeof document.code !== 'string' || !document.code.trim()) throw new Error(`${prefix} 缺少 code`)
  if (q.examType !== examType || typeof q.title !== 'string' || !q.title.trim()) throw new Error(`${prefix} 考试类型或 title 不正确`)
  if (q.question_type !== 'single_choice') throw new Error(`${prefix} 诊断题型必须是 single_choice`)
  if (q.difficulty != null && !['easy', 'medium', 'hard', 'unknown'].includes(q.difficulty)) throw new Error(`${prefix} 难度不正确`)
  if (!Array.isArray(q.content_blocks) || !q.content_blocks.length || !Array.isArray(q.images)) throw new Error(`${prefix} 缺少 blocks 或 images 数组`)
  if (!Array.isArray(q.options) || q.options.length < 2 || !Array.isArray(q.knowledge_points)) throw new Error(`${prefix} 选项或知识点数组不正确`)
  buildQuestionStorage(q)
  const imageIds = new Set(q.images.map((image: any) => image.id))
  if (imageIds.size !== q.images.length) throw new Error(`${prefix} 图片 ID 重复`)
  const labels = new Set<string>()
  for (const option of q.options) {
    if (!option || typeof option.label !== 'string' || !option.label.trim() || typeof option.text !== 'string' || labels.has(option.label)) throw new Error(`${prefix} 选项标签重复或内容无效`)
    if (!option.text.trim() && !option.image_id) throw new Error(`${prefix} 选项必须包含文字或图片`)
    if (option.image_id !== undefined && !imageIds.has(option.image_id)) throw new Error(`${prefix} 选项引用的图片不存在`)
    labels.add(option.label)
  }
  for (const block of q.content_blocks) if (block.type === 'image_ref' && !imageIds.has(block.image_id)) throw new Error(`${prefix} 题干引用的图片不存在`)
  if (q.answer.length !== 1 || !labels.has(q.answer[0])) throw new Error(`${prefix} 正确答案必须对应一个选项`)
  for (const point of q.knowledge_points) if (!point || typeof point.code !== 'string' || typeof point.label !== 'string') throw new Error(`${prefix} 知识点必须有 code 和 label`)
  for (const key of ['correctSolution', 'examFocus', 'reviewGuidance']) {
    if (document.solution[key] !== undefined && typeof document.solution[key] !== 'string') throw new Error(`${prefix} ${key} 必须是文本`)
  }
  if (document.solution.commonErrorCauses !== undefined && (!Array.isArray(document.solution.commonErrorCauses) || document.solution.commonErrorCauses.some((item: unknown) => typeof item !== 'string'))) throw new Error(`${prefix} commonErrorCauses 必须是文本数组`)
  return q
}

// 年度文档只接受确认后的三分组结构，科目与题号由服务端交叉校验。
export function validateAnnualDocument(raw: unknown): AnnualDocument {
  try {
    const input = questionObject(raw, '年度文档')
    if (input.format !== ANNUAL_DOCUMENT_FORMAT) throw new Error(`format 必须为 ${ANNUAL_DOCUMENT_FORMAT}`)
    const p = questionObject(input.paper, 'paper')
    if (![EXAM_TYPE.ESAT, EXAM_TYPE.TMUA].includes(p.examType)) throw new Error('诊断年度仅支持 ESAT 或 TMUA')
    if (!Number.isInteger(p.year) || p.year < 2000 || p.year > 2100) throw new Error('paper.year 必须是有效年份')
    if (typeof p.title !== 'string' || !p.title.trim()) throw new Error('paper.title 不能为空')
    if (!Array.isArray(input.questions) || !input.questions.length) throw new Error('questions 必须是非空数组')
    const requiredCodes: readonly string[] = p.examType === EXAM_TYPE.ESAT ? ESAT_MODULES : TMUA_PAPERS
    if (!Array.isArray(p.moduleConfig) || p.moduleConfig.length !== requiredCodes.length) throw new Error(p.examType === EXAM_TYPE.ESAT ? 'ESAT 年度必须完整提供五科' : 'TMUA 年度必须完整提供 Paper 1 和 Paper 2')
    const configurations = new Map<string, any>(p.moduleConfig.map((module: any) => [module?.code, module]))
    if (configurations.size !== requiredCodes.length || requiredCodes.some((code) => !configurations.has(code))) throw new Error('模块代码缺失或重复')
    const questions = input.questions as QuestionDocument[]
    const normalized = questions.map((question, index) => validateQuestion(question, p.examType, index))
    if (new Set(questions.map((question) => question.code)).size !== questions.length) throw new Error('题目 code 在年度内不能重复')
    const modules = requiredCodes.map((code, index): AnnualModule => {
      const module = configurations.get(code)!
      const rows = normalized.filter((q) => q.module_code === code)
      if (!rows.length) throw new Error(`${code} 没有题目`)
      if (!Number.isInteger(module.durationSeconds) || module.durationSeconds <= 0) throw new Error(`${code} 时长必须是正整数秒`)
      if (p.examType === EXAM_TYPE.TMUA && (rows.length !== 20 || module.durationSeconds !== 4500)) throw new Error('TMUA 每卷必须 20 题、75 分钟')
      if (module.questionCount !== undefined && module.questionCount !== rows.length) throw new Error(`${code} 声明题数与实际题目不符`)
      if (typeof module.subject !== 'string' || !module.subject.trim()) throw new Error(`${code} 缺少科目名称`)
      const numbers = rows.map((row) => row.module_question_number).sort((a, b) => a - b)
      if (numbers.some((number, i) => number !== i + 1)) throw new Error(`${code} 科目内题号必须连续且从 1 开始`)
      return { code, subject: module.subject, subjectCode: module.subjectCode == null ? null : String(module.subjectCode), order: index + 1, durationSeconds: module.durationSeconds, questionCount: rows.length }
    })
    if (normalized.some((q) => !requiredCodes.includes(q.module_code))) throw new Error('存在未归属于年度科目的题目')
    const accessTier = p.accessTier ?? PAPER_ACCESS_TIER.MEMBER
    if (![PAPER_ACCESS_TIER.FREE, PAPER_ACCESS_TIER.MEMBER].includes(accessTier)) throw new Error('访问级别必须为 free 或 member')
    const orderedQuestions = modules.flatMap((module) => questions.filter((question) => question.meta.moduleCode === module.code).sort((a, b) => a.meta.moduleQuestionNumber - b.meta.moduleQuestionNumber))
      .map((question, index) => ({ ...question, meta: { ...question.meta, number: index + 1, moduleOrder: modules.find((module) => module.code === question.meta.moduleCode)!.order } }))
    return {
      format: ANNUAL_DOCUMENT_FORMAT,
      paper: {
        title: p.title.trim(), code: typeof p.code === 'string' ? p.code : undefined,
        examType: p.examType, year: p.year, accessTier, duration: Math.ceil(modules.reduce((total, module) => total + module.durationSeconds, 0) / 60),
        totalQuestions: questions.length, moduleConfig: modules, remarks: typeof p.remarks === 'string' ? p.remarks : null,
        assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL, deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
        breakDurationSeconds: p.examType === EXAM_TYPE.ESAT ? 180 : 0,
      },
      questions: orderedQuestions,
    }
  } catch (error) {
    throw new AnnualDiagnosticError(error instanceof Error ? error.message : '年度文档格式错误')
  }
}

// 选科由服务端校验；数组顺序不会改变年度定义的科目顺序。
export function selectAnnualModules(examType: string, rawConfig: unknown, selected: unknown): AnnualModule[] {
  if (!Array.isArray(rawConfig)) throw new AnnualDiagnosticError('年度模块配置损坏')
  const modules = rawConfig as AnnualModule[]
  const codes = selected === undefined && examType === EXAM_TYPE.TMUA ? [...TMUA_PAPERS] : selected
  const valid = Array.isArray(codes) && codes.every((code) => typeof code === 'string') && new Set(codes).size === codes.length
  if (!valid || (examType === EXAM_TYPE.ESAT ? codes.length !== 3 || !codes.includes('maths1') || codes.some((code) => !(ESAT_MODULES as readonly string[]).includes(code)) : codes.length !== 2 || TMUA_PAPERS.some((code) => !codes.includes(code)))) {
    throw new AnnualDiagnosticError(examType === EXAM_TYPE.ESAT ? '请选择数学 1 及另外两个不重复科目' : 'TMUA 必须包含 Paper 1 和 Paper 2', 'DIAGNOSTIC_SUBJECTS_INVALID')
  }
  const picked = modules.filter((module) => codes.includes(module.code)).sort((a, b) => a.order - b.order)
  if (picked.length !== codes.length) throw new AnnualDiagnosticError('所选科目尚未准备完整', 'DIAGNOSTIC_SUBJECTS_UNAVAILABLE')
  return picked.map((module, index) => ({ ...module, order: index + 1 }))
}

// 内容更新始终建立新年度版本，不覆盖任何旧题；发布时再切换公开入口。
export async function importAnnualDocument(raw: unknown) {
  const document = validateAnnualDocument(raw)
  return prisma.$transaction(async (tx) => {
    const id = createNumericId()
    const paper = await tx.paper.create({ data: { id, ...document.paper, paperType: PAPER_TYPE.REAL_PAPER, moduleConfig: document.paper.moduleConfig as unknown as Prisma.InputJsonValue, status: 'draft' } })
    await syncPaperQuestions(paper.id, document.questions.map(canonicalQuestionToInput), tx)
    return paper
  }, { timeout: 120000 })
}

// 管理员导出统一文档；来源和题号跟随每道题，保持桌面规范的布局。
export async function exportAnnualDocument(paperId: string) {
  const paper = await prisma.paper.findUnique({ where: { id: paperId } })
  if (!paper) throw new AnnualDiagnosticError('试卷不存在', 'PAPER_NOT_FOUND')
  const questions = await prisma.question.findMany({ where: { paperId }, orderBy: { number: 'asc' } })
  const { questions: _legacy, ...metadata } = paper
  return { format: ANNUAL_DOCUMENT_FORMAT, paper: metadata, questions: questions.map(formatQuestionDocument) }
}
