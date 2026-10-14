// 诊断历史迁移后的原卷摘要、题号和旧链接映射，统一供历史、结果与会话读取。
import { DIAGNOSTIC_ASSEMBLY, isRealPaperType } from '../constants/domain.js'
import { parseJsonObject } from './jsonField.js'

export interface DiagnosticHistoryQuestion {
  sourceQuestionId: string
  questionId: string
  number: number | null
  moduleCode: string | null
  moduleOrder: number | null
  moduleQuestionNumber: number | null
}

export interface DiagnosticHistorySourcePaper {
  id: string
  title: string
  code: string | null
  year: number
  duration: number
  deliveryMode: string
}

export interface DiagnosticHistoryModule {
  code: string
  subject: string
  subjectCode: string | null
  order: number
  durationSeconds: number
  questionCount: number
  questionIds: string[]
}

export interface DiagnosticHistorySnapshot {
  version: 1
  sourcePaper: DiagnosticHistorySourcePaper
  questions: DiagnosticHistoryQuestion[]
  modules: DiagnosticHistoryModule[]
}

// 普通归档和年度换版不使已有历史失效；只有迁移审计固定的显式标记才失效。
export function isExpiredDiagnosticPaper(paper: { paperType?: string; assemblyType?: string | null }): boolean {
  return isRealPaperType(paper.paperType) && paper.assemblyType === DIAGNOSTIC_ASSEMBLY.LEGACY_EXPIRED
}

// 迁移快照必须具备版本、原卷信息和题目映射，不能误认普通模块快照。
export function parseDiagnosticHistorySnapshot(value: unknown): DiagnosticHistorySnapshot | null {
  const root = parseJsonObject(value)
  const history = parseJsonObject(root.diagnosticHistory)
  if (history.version !== 1) return null
  const source = parseJsonObject(history.sourcePaper)
  if (typeof source.id !== 'string' || typeof source.title !== 'string'
    || typeof source.year !== 'number' || typeof source.duration !== 'number'
    || typeof source.deliveryMode !== 'string' || !Array.isArray(history.questions)
    || !Array.isArray(history.modules)) return null
  const questions: DiagnosticHistoryQuestion[] = []
  for (const raw of history.questions) {
    const question = parseJsonObject(raw)
    if (typeof question.sourceQuestionId !== 'string' || typeof question.questionId !== 'string') return null
    questions.push({
      sourceQuestionId: question.sourceQuestionId,
      questionId: question.questionId,
      number: typeof question.number === 'number' ? question.number : null,
      moduleCode: typeof question.moduleCode === 'string' ? question.moduleCode : null,
      moduleOrder: typeof question.moduleOrder === 'number' ? question.moduleOrder : null,
      moduleQuestionNumber: typeof question.moduleQuestionNumber === 'number' ? question.moduleQuestionNumber : null,
    })
  }
  return {
    version: 1,
    sourcePaper: {
      id: source.id, title: source.title, code: typeof source.code === 'string' ? source.code : null,
      year: source.year, duration: source.duration, deliveryMode: source.deliveryMode,
    },
    questions,
    modules: readModuleOutlines(history.modules),
  }
}

// 历史题号和旧题链接随答卷冻结，不能使用年度新题的全库顺序覆盖。
export function diagnosticHistoryQuestionFields(value: unknown, questionId: string) {
  const question = parseDiagnosticHistorySnapshot(value)?.questions.find((item) => item.questionId === questionId)
  return question ? {
    originalQuestionId: question.sourceQuestionId,
    number: question.number,
    module_code: question.moduleCode,
    module_order: question.moduleOrder,
    module_question_number: question.moduleQuestionNumber,
  } : {}
}

// 历史模块优先读取迁移保留的原卷，其次读取本次答卷快照，最后才使用原试卷配置。
export function diagnosticHistoryModules(value: unknown, fallback: unknown): DiagnosticHistoryModule[] {
  const history = parseDiagnosticHistorySnapshot(value)
  if (history) return history.modules
  const snapshot = parseJsonObject(value)
  return readModuleOutlines(Array.isArray(snapshot.modules) ? snapshot.modules : fallback)
}

// 模块摘要保留原顺序及题量，允许普通模块快照与模块配置共用同一显示投影。
function readModuleOutlines(value: unknown): DiagnosticHistoryModule[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((raw) => {
    const module = parseJsonObject(raw)
    if (typeof module.code !== 'string') return []
    const questionIds = Array.isArray(module.questionIds)
      ? module.questionIds.filter((id): id is string => typeof id === 'string') : []
    return [{
      code: module.code,
      subject: typeof module.subject === 'string' ? module.subject : module.code,
      subjectCode: typeof module.subjectCode === 'string' ? module.subjectCode : null,
      order: Number(module.order) || 0,
      durationSeconds: Number(module.durationSeconds) || 0,
      questionCount: questionIds.length || Number(module.questionCount) || 0,
      questionIds,
    }]
  })
}
