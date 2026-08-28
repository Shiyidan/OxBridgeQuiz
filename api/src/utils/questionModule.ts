// 根据考试、学科编码和学科名称统一解析题库题目的 ESAT Module 或 TMUA Paper。
import {
  ESAT_MODULE,
  ESAT_MODULE_SUBJECT_CODES,
  ESAT_MODULES,
  EXAM_TYPE,
  TMUA_PAPER,
  TMUA_PAPERS,
  type EsatModuleCode,
  type TmuaPaperCode,
} from '../constants/domain.js'

export type QuestionModuleCode = EsatModuleCode | TmuaPaperCode

type QuestionModuleResolutionInput = {
  examType: unknown
  explicitModuleCode?: unknown
  subjectCode?: unknown
  subject?: unknown
  part?: unknown
}

const ESAT_MODULE_ALIASES: Record<EsatModuleCode, string[]> = {
  [ESAT_MODULE.MATHS_1]: ['m1', 'math1', 'maths1', 'mathematics1', '数学1'],
  [ESAT_MODULE.MATHS_2]: ['m2', 'math2', 'maths2', 'mathematics2', '数学2'],
  [ESAT_MODULE.PHYSICS]: ['physics', '物理'],
  [ESAT_MODULE.CHEMISTRY]: ['chemistry', '化学'],
  [ESAT_MODULE.BIOLOGY]: ['biology', '生物'],
}

const TMUA_PAPER_ALIASES: Record<TmuaPaperCode, string[]> = {
  [TMUA_PAPER.PAPER_1]: ['p1', 'paper1', 'tmuap1', 'tmuapaper1'],
  [TMUA_PAPER.PAPER_2]: ['p2', 'paper2', 'tmuap2', 'tmuapaper2'],
}

// 学科名称允许中英文组合文本，编码和显式模块值仍优先采用精确匹配。
function normalizeModuleToken(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\-()（）]+/g, '')
}

// 从 standard2 分类和兼容字段中解析稳定的模块码，无法确认时保持为空。
export function resolveQuestionModuleCode(
  input: QuestionModuleResolutionInput,
): QuestionModuleCode | null {
  const examType = String(input.examType || '').trim().toUpperCase()
  const explicitModuleCode = normalizeModuleToken(input.explicitModuleCode)
  const part = normalizeModuleToken(input.part)
  const subjectCode = String(input.subjectCode || '').trim()
  const subject = normalizeModuleToken(input.subject)

  if (examType === EXAM_TYPE.ESAT) {
    const explicit = ESAT_MODULES.find((code) => normalizeModuleToken(code) === explicitModuleCode)
    if (explicit) return explicit

    const bySubjectCode = ESAT_MODULES.find(
      (code) => ESAT_MODULE_SUBJECT_CODES[code] === subjectCode,
    )
    if (bySubjectCode) return bySubjectCode

    return (
      ESAT_MODULES.find((code) =>
        ESAT_MODULE_ALIASES[code].some((alias) => subject.includes(normalizeModuleToken(alias))),
      ) || null
    )
  }

  if (examType === EXAM_TYPE.TMUA) {
    const explicit = TMUA_PAPERS.find((code) => normalizeModuleToken(code) === explicitModuleCode)
    if (explicit) return explicit

    const partCode = TMUA_PAPERS.find((code) => normalizeModuleToken(code) === part)
    if (partCode) return partCode

    const classification = normalizeModuleToken(`${subjectCode} ${input.subject || ''}`)
    return (
      TMUA_PAPERS.find((code) =>
        TMUA_PAPER_ALIASES[code].some((alias) =>
          classification.includes(normalizeModuleToken(alias)),
        ),
      ) || null
    )
  }

  return null
}
