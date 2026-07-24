/**
 * Markdown 导入校验器 — 提取 JSON 代码块、结构校验、安全清洗
 */
import { ESAT_MODULE, ESAT_MODULES, EXAM_TYPE, PAPER_DELIVERY_MODE, TMUA_PAPER, TMUA_PAPERS, isExamType, isPaperType } from '../constants/domain.js'

export interface PaperBreakPolicy {
  durationSeconds: number
  skippable: boolean
}

export interface StandardPaperModule {
  code: string
  subject: string
  subjectCode: string | null
  order: number
  durationSeconds: number
  questionCount: number
}

export interface StandardPaperMetadata {
  code: string | null
  paperName: string
  year: number
  duration: number
  examType: string
  paperType: string
  totalQuestions: number
  deliveryMode: string
  breakDurationSeconds: number
  moduleConfig: StandardPaperModule[]
  breakPolicy: PaperBreakPolicy
  assemblyType: string
  sourceExamTypes: string[]
  remarks: string | null
}

export interface ValidationError {
  block: number // JSON 块序号（1-based）
  message: string
}

export interface ProcessResult {
  metadata: StandardPaperMetadata | null
  questions: any[]
  modules: StandardPaperModule[]
  errors: ValidationError[]
  warnings: string[]
}

// 匹配 ```json ... ``` 代码块
const JSON_BLOCK_RE = /```json\s*\n([\s\S]*?)\n\s*```/g

// 危险模式：需要移除的标签和属性
const DANGEROUS_TAGS = /<\s*script[\s\S]*?<\/\s*script\s*>|<\s*iframe[\s\S]*?<\/\s*iframe\s*>|<\s*object[\s\S]*?<\/\s*object\s*>|<\s*embed[^>]*\/?\s*>/gi
const DANGEROUS_EVENTS = /\b(on\w+)\s*=\s*["'][^"']*["']/gi
const JAVASCRIPT_PROTOCOL = /\bjavascript\s*:/gi
const REMAINING_TAGS = /<[^>]*>/g

// SVG 标签块 —— 合法的 inline SVG 图形需要保留
const SVG_BLOCK_RE = /<svg\b[\s\S]*?<\/svg\s*>/gi

// 合法的 LaTeX 占位符，不可作为安全标记移除
const PLACEHOLDER_RE = /\[\[(BS|NL|PARA|FIG)\]\]/g
const DEPRECATED_QUESTION_FIELDS = ['correctAnswer', 'content', 'order']
const DEFAULT_MODULE_BREAK_SECONDS = 180
const SAFE_RASTER_DATA_URI = /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i
const SECTION_SEQUENCE_DELIVERY_MODE = 'section_sequence'

interface DiagnosticSectionProfile {
  code: string
  sectionType: 'paper' | 'subject'
  subject: string
  subjectCode: string
  order: number
  durationMinutes: number
  questionCount: number | null
}

const TMUA_SECTION_PROFILES: Record<string, DiagnosticSectionProfile> = {
  [TMUA_PAPER.PAPER_1]: {
    code: TMUA_PAPER.PAPER_1,
    sectionType: 'paper',
    subject: 'Paper 1: Applications of Mathematical Knowledge',
    subjectCode: 'TMUA-P1',
    order: 1,
    durationMinutes: 75,
    questionCount: 20,
  },
  [TMUA_PAPER.PAPER_2]: {
    code: TMUA_PAPER.PAPER_2,
    sectionType: 'paper',
    subject: 'Paper 2: Mathematical Reasoning',
    subjectCode: 'TMUA-P2',
    order: 2,
    durationMinutes: 75,
    questionCount: 20,
  },
}

const ESAT_SECTION_PROFILES: Record<string, Omit<DiagnosticSectionProfile, 'order'>> = {
  [ESAT_MODULE.MATHS_1]: {
    code: ESAT_MODULE.MATHS_1,
    sectionType: 'subject',
    subject: 'Mathematics 1',
    subjectCode: '110000',
    durationMinutes: 40,
    questionCount: null,
  },
  [ESAT_MODULE.MATHS_2]: {
    code: ESAT_MODULE.MATHS_2,
    sectionType: 'subject',
    subject: 'Mathematics 2',
    subjectCode: '120000',
    durationMinutes: 40,
    questionCount: null,
  },
  [ESAT_MODULE.PHYSICS]: {
    code: ESAT_MODULE.PHYSICS,
    sectionType: 'subject',
    subject: 'Physics',
    subjectCode: '130000',
    durationMinutes: 40,
    questionCount: null,
  },
  [ESAT_MODULE.CHEMISTRY]: {
    code: ESAT_MODULE.CHEMISTRY,
    sectionType: 'subject',
    subject: 'Chemistry',
    subjectCode: '140000',
    durationMinutes: 40,
    questionCount: null,
  },
  [ESAT_MODULE.BIOLOGY]: {
    code: ESAT_MODULE.BIOLOGY,
    sectionType: 'subject',
    subject: 'Biology',
    subjectCode: '150000',
    durationMinutes: 40,
    questionCount: null,
  },
}

const ESAT_MODULE_ALIASES: Record<string, string> = {
  m1: ESAT_MODULE.MATHS_1,
  math1: ESAT_MODULE.MATHS_1,
  maths1: ESAT_MODULE.MATHS_1,
  mathematics1: ESAT_MODULE.MATHS_1,
  m2: ESAT_MODULE.MATHS_2,
  math2: ESAT_MODULE.MATHS_2,
  maths2: ESAT_MODULE.MATHS_2,
  mathematics2: ESAT_MODULE.MATHS_2,
  physics: ESAT_MODULE.PHYSICS,
  chemistry: ESAT_MODULE.CHEMISTRY,
  biology: ESAT_MODULE.BIOLOGY,
}

const ESAT_MODULE_SUBJECT_CODES: Record<string, string> = {
  [ESAT_MODULE.MATHS_1]: '110000',
  [ESAT_MODULE.MATHS_2]: '120000',
  [ESAT_MODULE.PHYSICS]: '130000',
  [ESAT_MODULE.CHEMISTRY]: '140000',
  [ESAT_MODULE.BIOLOGY]: '150000',
}

const TMUA_PAPER_ALIASES: Record<string, string> = {
  p1: TMUA_PAPER.PAPER_1,
  paper1: TMUA_PAPER.PAPER_1,
  tmuap1: TMUA_PAPER.PAPER_1,
  tmuapaper1: TMUA_PAPER.PAPER_1,
  applicationsofmathematicalknowledge: TMUA_PAPER.PAPER_1,
  mathematicalthinking: TMUA_PAPER.PAPER_1,
  p2: TMUA_PAPER.PAPER_2,
  paper2: TMUA_PAPER.PAPER_2,
  tmuap2: TMUA_PAPER.PAPER_2,
  tmuapaper2: TMUA_PAPER.PAPER_2,
  mathematicalreasoning: TMUA_PAPER.PAPER_2,
}

const TMUA_PAPER_SUBJECT_CODES: Record<string, string> = {
  [TMUA_PAPER.PAPER_1]: 'TMUA-P1',
  [TMUA_PAPER.PAPER_2]: 'TMUA-P2',
}

// 外部文件可使用科目全名或短码；入库前统一为稳定的 ESAT module code。
export function normalizeEsatModuleCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const key = value.toLowerCase().replace(/[^a-z0-9]/g, '')
  return ESAT_MODULE_ALIASES[key] || null
}

// TMUA 的分段代码表达 Paper 1/2，不与题目的数学考纲学科代码混用。
export function normalizeTmuaPaperCode(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const key = value.toLowerCase().replace(/[^a-z0-9]/g, '')
  return TMUA_PAPER_ALIASES[key] || null
}

// 上传文件按考试类型收窄稳定代码，禁止 ESAT 科目代码与 TMUA Paper 代码串用。
function normalizeDiagnosticSectionCode(examType: unknown, value: unknown): string | null {
  if (examType === EXAM_TYPE.TMUA) return normalizeTmuaPaperCode(value)
  return normalizeEsatModuleCode(value)
}

// 位图只允许站内相对地址、HTTP(S)、临时 blob 或常见位图 base64，禁止 data:SVG/HTML。
function isSafeRasterImageSource(value: string): boolean {
  if (SAFE_RASTER_DATA_URI.test(value)) return true
  if (/^(?:https?:|blob:|\/)/i.test(value)) return true
  return !/^[a-z][a-z0-9+.-]*:/i.test(value)
}

export function extractJsonBlocks(md: string): { index: number; raw: string }[] {
  const blocks: { index: number; raw: string }[] = []
  let match: RegExpExecArray | null
  let idx = 0

  // 重置 lastIndex
  JSON_BLOCK_RE.lastIndex = 0
  while ((match = JSON_BLOCK_RE.exec(md)) !== null) {
    idx++
    blocks.push({ index: idx, raw: match[1].trim() })
  }

  return blocks
}

// 新项目题目使用 camelCase；导入边界统一转换为数据库和渲染链使用的 snake_case。
function normalizeProjectQuestion(question: any, metadata: any): any {
  const { contentBlocks, questionType, classification, source, learningAnalysis, ...rest } = question || {}
  const normalizedLearningAnalysis =
    learningAnalysis && typeof learningAnalysis === 'object'
      ? {
          correct_solution: learningAnalysis.correctSolution,
          exam_focus: learningAnalysis.examFocus,
          common_error_causes: learningAnalysis.commonErrorCauses,
          review_guidance: learningAnalysis.reviewGuidance,
        }
      : rest.learning_analysis
  const normalizedContentBlocks = Array.isArray(contentBlocks)
    ? contentBlocks.map((block: any) =>
        block?.type === 'paragraph'
          ? { ...block, inline: block.align === 'center' ? false : true }
          : block,
      )
    : rest.content_blocks

  return {
    ...rest,
    content_blocks: normalizedContentBlocks,
    question_type: questionType || rest.question_type,
    subject: classification?.subject || rest.subject,
    subject_code: classification?.subjectCode == null ? rest.subject_code : String(classification.subjectCode),
    topic: classification?.topic || rest.topic,
    topic_code: classification?.topicCode == null ? rest.topic_code : String(classification.topicCode),
    knowledge_points: Array.isArray(classification?.knowledgePoints)
      ? classification.knowledgePoints.map((point: any) => ({
          ...point,
          code: String(point?.code ?? ''),
        }))
      : rest.knowledge_points,
    examType: metadata?.examType,
    source_examType: source?.examType || rest.source_examType,
    year: source?.year ?? rest.year,
    learning_analysis: normalizedLearningAnalysis,
  }
}

// metadata + sections 是新版外部交换格式；考试时长、分卷名称和切换规则由服务端规则派生。
function normalizeSectionPaperDocument(input: any, errors: ValidationError[]): any {
  const rawMetadata = input?.metadata
  const rawSections = Array.isArray(input?.sections) ? input.sections : []

  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return input
  }
  if (typeof rawMetadata.code !== 'string' || !rawMetadata.code.trim()) {
    errors.push({ block: 0, message: 'metadata.code 必须为非空套卷代码' })
  }
  if (typeof rawMetadata.title !== 'string' || !rawMetadata.title.trim()) {
    errors.push({ block: 0, message: 'metadata.title 必须为非空试卷名称' })
  }
  if (rawMetadata.examType !== EXAM_TYPE.TMUA && rawMetadata.examType !== EXAM_TYPE.ESAT) {
    errors.push({ block: 0, message: 'sections 新规范仅支持 TMUA 和 ESAT' })
  }
  if (rawMetadata.deliveryMode !== SECTION_SEQUENCE_DELIVERY_MODE) {
    errors.push({
      block: 0,
      message: 'metadata.deliveryMode 必须为 section_sequence',
    })
  }
  if (!isPaperType(rawMetadata.paperType)) {
    errors.push({
      block: 0,
      message: 'metadata.paperType 必须为 realPaper、mockPaper 或 aiPaper',
    })
  }
  if (typeof rawMetadata.assemblyType !== 'string' || !rawMetadata.assemblyType.trim()) {
    errors.push({
      block: 0,
      message: 'metadata.assemblyType 必须为非空字符串',
    })
  }
  for (const field of ['duration', 'totalQuestions', 'breakPolicy']) {
    if (Object.prototype.hasOwnProperty.call(rawMetadata, field)) {
      errors.push({
        block: 0,
        message: `metadata.${field} 由服务端考试规则派生，不得写入新版上传文件`,
      })
    }
  }
  const expectedSectionCount = rawMetadata.examType === EXAM_TYPE.ESAT ? 3 : 2
  if (rawSections.length !== expectedSectionCount) {
    errors.push({
      block: 0,
      message: rawMetadata.examType === EXAM_TYPE.ESAT ? 'ESAT sections 必须恰好包含三个科目' : 'TMUA sections 必须恰好包含 paper1 和 paper2',
    })
  }

  const modules = rawSections.map((section: any, sectionIndex: number) => {
    const normalizedCode = normalizeDiagnosticSectionCode(rawMetadata.examType, section?.code)
    const baseProfile = normalizedCode
      ? rawMetadata.examType === EXAM_TYPE.ESAT
        ? ESAT_SECTION_PROFILES[normalizedCode]
        : TMUA_SECTION_PROFILES[normalizedCode]
      : undefined
    const profile: DiagnosticSectionProfile | undefined = baseProfile
      ? {
          ...baseProfile,
          order: rawMetadata.examType === EXAM_TYPE.TMUA ? (baseProfile as DiagnosticSectionProfile).order : section?.order,
        }
      : undefined
    const label = `section ${sectionIndex + 1}`
    const allowedSectionFields = new Set(['code', 'sectionType', 'order', 'questions'])
    const orchestrationFields = new Set(['name', 'duration', 'durationSeconds', 'transitionAfter'])

    if (!profile || section?.code !== profile.code) {
      errors.push({
        block: 0,
        message: `${label}：code 不是 ${rawMetadata.examType} 支持的稳定分段代码`,
      })
    }
    if (profile && section?.sectionType !== profile.sectionType) {
      errors.push({
        block: 0,
        message: `${profile.code}：sectionType 必须为 ${profile.sectionType}`,
      })
    }
    if (profile && rawMetadata.examType === EXAM_TYPE.TMUA && section?.order !== profile.order) {
      errors.push({
        block: 0,
        message: `${profile.code}：order 必须为 ${profile.order}`,
      })
    }
    for (const field of Object.keys(section || {})) {
      if (!allowedSectionFields.has(field)) {
        errors.push({
          block: 0,
          message: orchestrationFields.has(field)
            ? `${profile?.code || label}：${field} 属于考试编排规则，不得写入 sections`
            : `${profile?.code || label}：不支持 section 字段 ${field}`,
        })
      }
    }

    const sectionQuestions = Array.isArray(section?.questions) ? section.questions : []
    if (!Array.isArray(section?.questions)) {
      errors.push({
        block: 0,
        message: `${profile?.code || label}：questions 必须为数组`,
      })
    } else if (profile && profile.questionCount !== null && sectionQuestions.length !== profile.questionCount) {
      errors.push({
        block: 0,
        message: `${profile.code} 必须包含 ${profile.questionCount} 道题`,
      })
    } else if (profile && profile.questionCount === null && sectionQuestions.length === 0) {
      errors.push({
        block: 0,
        message: `${profile.code}：questions 必须为非空数组`,
      })
    }

    const normalizedQuestions = sectionQuestions.map((question: any, questionIndex: number) => {
      const questionLabel = `${profile?.code || label} 题目 ${question?.number ?? questionIndex + 1}`
      const source = question?.source
      const classification = question?.classification
      const learningAnalysis = question?.learningAnalysis

      if (question?.difficulty !== undefined && !['easy', 'medium', 'hard', 'composite', 'unknown'].includes(question.difficulty)) {
        errors.push({
          block: 0,
          message: `${questionLabel}：difficulty 必须为 easy、medium、hard、composite 或 unknown`,
        })
      }

      if (!source || typeof source !== 'object') {
        errors.push({ block: 0, message: `${questionLabel}：缺少 source` })
      } else {
        if (rawMetadata.examType === EXAM_TYPE.TMUA && source.examType !== rawMetadata.examType) {
          errors.push({
            block: 0,
            message: `${questionLabel}：source.examType 必须与 metadata.examType 一致`,
          })
        } else if (typeof source.examType !== 'string' || !source.examType.trim()) {
          errors.push({
            block: 0,
            message: `${questionLabel}：source.examType 不能为空`,
          })
        }
        if (source.year !== rawMetadata.year) {
          errors.push({
            block: 0,
            message: `${questionLabel}：source.year 必须与 metadata.year 一致`,
          })
        }
        if (profile && source.sectionCode !== profile.code) {
          errors.push({
            block: 0,
            message: `${questionLabel}：source.sectionCode 必须为 ${profile.code}`,
          })
        }
        if (source.questionNumber !== question?.number) {
          errors.push({
            block: 0,
            message: `${questionLabel}：source.questionNumber 必须等于 number`,
          })
        }
      }

      if (!classification || typeof classification !== 'object') {
        errors.push({
          block: 0,
          message: `${questionLabel}：缺少 classification`,
        })
      } else {
        for (const field of ['subject', 'subjectCode', 'topic', 'topicCode']) {
          if ((typeof classification[field] !== 'string' && typeof classification[field] !== 'number') || String(classification[field]).trim() === '') {
            errors.push({
              block: 0,
              message: `${questionLabel}：classification.${field} 不能为空`,
            })
          }
        }
        if (!Array.isArray(classification.knowledgePoints) || !classification.knowledgePoints.length) {
          errors.push({
            block: 0,
            message: `${questionLabel}：classification.knowledgePoints 必须为非空数组`,
          })
        } else {
          let hasPrimaryKnowledgePoint = false
          classification.knowledgePoints.forEach((point: any, pointIndex: number) => {
            if (
              (typeof point?.code !== 'string' && typeof point?.code !== 'number') ||
              String(point.code).trim() === '' ||
              typeof point?.label !== 'string' ||
              !point.label.trim() ||
              !['primary', 'secondary'].includes(point?.role)
            ) {
              errors.push({
                block: 0,
                message: `${questionLabel}：classification.knowledgePoints[${pointIndex}] 必须包含 code、label 和合法 role`,
              })
            }
            if (point?.role === 'primary') hasPrimaryKnowledgePoint = true
          })
          if (!hasPrimaryKnowledgePoint) {
            errors.push({
              block: 0,
              message: `${questionLabel}：classification.knowledgePoints 必须至少包含一个 primary`,
            })
          }
        }
      }

      if (!learningAnalysis || typeof learningAnalysis !== 'object') {
        errors.push({
          block: 0,
          message: `${questionLabel}：缺少 learningAnalysis`,
        })
      } else {
        for (const field of ['correctSolution', 'examFocus', 'reviewGuidance']) {
          if (typeof learningAnalysis[field] !== 'string' || !learningAnalysis[field].trim()) {
            errors.push({
              block: 0,
              message: `${questionLabel}：learningAnalysis.${field} 不能为空`,
            })
          }
        }
        if (
          !Array.isArray(learningAnalysis.commonErrorCauses) ||
          !learningAnalysis.commonErrorCauses.length ||
          learningAnalysis.commonErrorCauses.some((item: unknown) => typeof item !== 'string' || !item.trim())
        ) {
          errors.push({
            block: 0,
            message: `${questionLabel}：learningAnalysis.commonErrorCauses 必须为非空字符串数组`,
          })
        }
      }

      return normalizeProjectQuestion(question, rawMetadata)
    })

    return {
      code: profile?.code || section?.code,
      order: section?.order,
      subject: profile?.subject || '',
      subject_code: profile?.subjectCode || '',
      duration: profile?.durationMinutes || 0,
      totalQuestions: sectionQuestions.length,
      questions: normalizedQuestions,
    }
  })

  const totalQuestions = rawSections.reduce((sum: number, section: any) => sum + (Array.isArray(section?.questions) ? section.questions.length : 0), 0)
  const duration = rawSections.reduce((sum: number, section: any) => {
    const code = normalizeDiagnosticSectionCode(rawMetadata.examType, section?.code)
    const profile = code ? (rawMetadata.examType === EXAM_TYPE.ESAT ? ESAT_SECTION_PROFILES[code] : TMUA_SECTION_PROFILES[code]) : undefined
    return sum + (profile?.durationMinutes || 0)
  }, 0)

  return {
    schemaVersion: 'diagnostic-paper-v2',
    metadata: {
      code: rawMetadata.code,
      paperName: rawMetadata.title,
      year: rawMetadata.year,
      duration,
      examType: rawMetadata.examType,
      paperType: rawMetadata.paperType,
      totalQuestions,
      deliveryMode: PAPER_DELIVERY_MODE.MODULE_SEQUENCE,
      breakPolicy: {
        durationSeconds: rawMetadata.examType === EXAM_TYPE.ESAT ? DEFAULT_MODULE_BREAK_SECONDS : 0,
        skippable: rawMetadata.examType === EXAM_TYPE.ESAT,
      },
      assemblyType: rawMetadata.assemblyType,
      remarks: rawMetadata.remarks,
    },
    modules,
  }
}

export function validateStandardPaperDocument(input: any): {
  metadata: StandardPaperMetadata | null
  questions: any[]
  modules: StandardPaperModule[]
  errors: ValidationError[]
  warnings: string[]
} {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const isSectionDocument = Array.isArray(input?.sections)
  if (isSectionDocument) {
    input = normalizeSectionPaperDocument(input, errors)
  }
  const rawMetadata = input?.metadata

  if (!rawMetadata || typeof rawMetadata !== 'object') {
    errors.push({ block: 0, message: '缺少标准根字段 metadata' })
  } else {
    if (!rawMetadata.paperName || typeof rawMetadata.paperName !== 'string') {
      errors.push({ block: 0, message: 'metadata.paperName 必须为试卷名称' })
    }
    if (typeof rawMetadata.year !== 'number' || !Number.isFinite(rawMetadata.year)) {
      errors.push({ block: 0, message: 'metadata.year 必须为数字年份' })
    }
    if (typeof rawMetadata.duration !== 'number' || !Number.isFinite(rawMetadata.duration)) {
      errors.push({ block: 0, message: 'metadata.duration 必须为数字分钟数' })
    }
    if (!isExamType(rawMetadata.examType)) {
      errors.push({
        block: 0,
        message: 'metadata.examType 不是系统支持的考试类型',
      })
    }
    if (!isPaperType(rawMetadata.paperType)) {
      errors.push({
        block: 0,
        message: 'metadata.paperType 必须为 realPaper、mockPaper 或 aiPaper',
      })
    }
    if (typeof rawMetadata.totalQuestions !== 'number' || !Number.isFinite(rawMetadata.totalQuestions)) {
      errors.push({ block: 0, message: 'metadata.totalQuestions 必须为数字' })
    }
  }

  const explicitModules = Array.isArray(input?.modules) ? input.modules : null
  const isCanonicalModuleDocument = Boolean(
    explicitModules && explicitModules.length > 0 && explicitModules.every((module: any) => Array.isArray(module?.questions)),
  )
  const legacyModuleItemsAlias = Boolean(explicitModules?.some((module: any) => Array.isArray(module?.items) && !Array.isArray(module?.questions)))
  const legacyModuleAlias =
    !explicitModules && Array.isArray(input?.questions) && input.questions.length > 0 && input.questions.every((item: any) => Array.isArray(item?.items))
      ? input.questions
      : null
  const rawModules = explicitModules || legacyModuleAlias
  const isModular = Boolean(rawModules)

  if (isCanonicalModuleDocument && input?.schemaVersion !== 'diagnostic-paper-v2') {
    errors.push({
      block: 0,
      message: '标准分段卷 schemaVersion 必须为 diagnostic-paper-v2',
    })
  }

  if (rawMetadata?.examType === EXAM_TYPE.ESAT && rawMetadata?.paperType === 'realPaper' && !isModular) {
    warnings.push('扁平 ESAT 真题仅可作为草稿兼容导入；发布诊断卷前必须改为三模块 modules[].questions')
  }
  if (rawMetadata?.examType === EXAM_TYPE.TMUA && rawMetadata?.paperType === 'realPaper' && !isModular) {
    warnings.push('扁平 TMUA 真题仅可作为草稿兼容导入；发布诊断卷前必须改为 Paper 1/2 的 modules[].questions')
  }

  if (legacyModuleAlias) {
    warnings.push('检测到兼容格式 questions[].items；新组合卷建议改用 modules[].questions')
  }
  if (legacyModuleItemsAlias) {
    warnings.push('检测到兼容格式 modules[].items；新组合卷建议改用 modules[].questions')
  }

  if (!isModular && (!Array.isArray(input?.questions) || input.questions.length === 0)) {
    errors.push({
      block: 0,
      message: '扁平试卷需要非空 questions；模块试卷需要非空 modules',
    })
    return { metadata: null, questions: [], modules: [], errors, warnings }
  }
  if (rawModules && rawModules.length === 0) {
    errors.push({ block: 0, message: 'modules 必须是非空数组' })
  }

  const normalizedQuestions: any[] = []
  const modules: StandardPaperModule[] = []
  const sourceExamTypes = new Set<string>()
  const sourceQuestionCodes = new Set<string>()

  if (rawModules) {
    if (rawMetadata?.examType === EXAM_TYPE.ESAT && rawModules.length !== 3) {
      errors.push({
        block: 0,
        message: 'ESAT 模块诊断卷必须恰好包含 3 个科目模块',
      })
    }
    if (rawMetadata?.examType === EXAM_TYPE.TMUA && rawModules.length !== 2) {
      errors.push({
        block: 0,
        message: 'TMUA 诊断卷必须恰好包含 Paper 1 和 Paper 2',
      })
    }

    const usedModuleCodes = new Set<string>()
    const usedOrders = new Set<number>()
    let globalNumber = 1
    for (let moduleIndex = 0; moduleIndex < rawModules.length; moduleIndex++) {
      const rawModule = rawModules[moduleIndex] || {}
      const sectionName = rawMetadata?.examType === EXAM_TYPE.TMUA ? '分卷' : '模块'
      const moduleItems = Array.isArray(rawModule.questions) ? rawModule.questions : Array.isArray(rawModule.items) ? rawModule.items : []
      const subject = typeof rawModule.subject === 'string' ? rawModule.subject.trim() : ''
      if (isCanonicalModuleDocument && (typeof rawModule.code !== 'string' || !rawModule.code.trim())) {
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：标准 modules[].questions 格式必须填写 code`,
        })
      }
      const moduleCode = normalizeDiagnosticSectionCode(rawMetadata?.examType, rawModule.code || rawModule.module_code || rawModule.component_code || subject)
      if (isCanonicalModuleDocument && moduleCode && typeof rawModule.code === 'string' && rawModule.code.trim().toLowerCase() !== moduleCode) {
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：code 必须使用稳定值 ${moduleCode}`,
        })
      }
      if (isCanonicalModuleDocument && !Number.isInteger(rawModule.order)) {
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：标准格式必须显式填写正整数 order`,
        })
      }
      const order = Number.isInteger(rawModule.order) ? rawModule.order : moduleIndex + 1
      const durationMinutes = Number(rawModule.duration)

      const validSectionCodes = rawMetadata?.examType === EXAM_TYPE.TMUA ? TMUA_PAPERS : ESAT_MODULES
      if (!moduleCode || !validSectionCodes.some((code) => code === moduleCode)) {
        errors.push({
          block: 0,
          message:
            rawMetadata?.examType === EXAM_TYPE.TMUA
              ? `分卷 ${moduleIndex + 1}：无法识别 Paper 代码或名称`
              : `模块 ${moduleIndex + 1}：无法识别科目代码或科目名称`,
        })
      } else if (usedModuleCodes.has(moduleCode)) {
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：代码 ${moduleCode} 重复`,
        })
      } else {
        usedModuleCodes.add(moduleCode)
      }
      if (!subject)
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：缺少 subject`,
        })
      if (!Number.isInteger(order) || order < 1 || usedOrders.has(order)) {
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：order 必须为不重复的正整数`,
        })
      }
      usedOrders.add(order)
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：duration 必须为正数分钟`,
        })
      }
      if (!moduleItems.length) {
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：questions 必须是非空数组`,
        })
      }
      if (rawModule.totalQuestions !== undefined && Number(rawModule.totalQuestions) !== moduleItems.length) {
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：totalQuestions 必须等于 questions.length`,
        })
      }

      const subjectCode =
        typeof rawModule.subject_code === 'string' ? rawModule.subject_code : rawModule.subject_code == null ? null : String(rawModule.subject_code)
      const expectedSubjectCode = moduleCode
        ? rawMetadata?.examType === EXAM_TYPE.TMUA
          ? TMUA_PAPER_SUBJECT_CODES[moduleCode]
          : ESAT_MODULE_SUBJECT_CODES[moduleCode]
        : null
      if (isCanonicalModuleDocument && !subjectCode) {
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：标准格式必须填写 subject_code`,
        })
      } else if (subjectCode && expectedSubjectCode && subjectCode !== expectedSubjectCode) {
        errors.push({
          block: 0,
          message: `${sectionName} ${moduleIndex + 1}：${moduleCode} 的 subject_code 必须为 ${expectedSubjectCode}`,
        })
      }
      modules.push({
        code: moduleCode || `unknown_${moduleIndex + 1}`,
        subject,
        subjectCode,
        order,
        durationSeconds: Number.isFinite(durationMinutes) ? Math.round(durationMinutes * 60) : 0,
        questionCount: moduleItems.length,
      })

      if (
        !isSectionDocument &&
        rawMetadata?.examType === EXAM_TYPE.TMUA &&
        rawMetadata?.paperType === 'realPaper'
      ) {
        if (durationMinutes !== 75) {
          errors.push({
            block: 0,
            message: `TMUA ${moduleCode || `Paper ${moduleIndex + 1}`} 的 duration 必须为 75 分钟`,
          })
        }
        if (moduleItems.length !== 20) {
          errors.push({
            block: 0,
            message: `TMUA ${moduleCode || `Paper ${moduleIndex + 1}`} 必须包含 20 道题`,
          })
        }
      }

      const usedModuleQuestionNumbers = new Set<number>()
      moduleItems.forEach((item: any, itemIndex: number) => {
        if (isCanonicalModuleDocument && !Number.isInteger(item?.number)) {
          errors.push({
            block: 0,
            message: `${sectionName} ${moduleIndex + 1}：questions[${itemIndex}] 必须显式填写正整数 number`,
          })
        }
        const moduleQuestionNumber = Number.isFinite(item?.number) ? item.number : itemIndex + 1
        if (!Number.isInteger(moduleQuestionNumber) || moduleQuestionNumber < 1 || usedModuleQuestionNumbers.has(moduleQuestionNumber)) {
          errors.push({
            block: 0,
            message: `${sectionName} ${moduleIndex + 1}：questions[${itemIndex}] 的 number 必须为不重复的正整数`,
          })
        }
        usedModuleQuestionNumbers.add(moduleQuestionNumber)
        const learningAnalysis =
          item?.learning_analysis && typeof item.learning_analysis === 'object'
            ? {
                ...item.learning_analysis,
                correct_solution: item.learning_analysis.correct_solution || item.learning_analysis.solution,
              }
            : item?.learning_analysis
        normalizedQuestions.push({
          ...item,
          number: globalNumber++,
          module_code: moduleCode,
          module_order: order,
          module_question_number: moduleQuestionNumber,
          // 兼容早期 component_* 输出；新业务统一读取 module_*。
          component_code: moduleCode,
          component_order: order,
          component_question_number: moduleQuestionNumber,
          subject: item?.subject || subject,
          subject_code: item?.subject_code || subjectCode,
          learning_analysis: learningAnalysis,
        })
      })
    }

    if (rawMetadata?.examType === EXAM_TYPE.ESAT && !usedModuleCodes.has(ESAT_MODULE.MATHS_1)) {
      errors.push({
        block: 0,
        message: 'ESAT 模块诊断卷必须包含 Mathematics 1',
      })
    }
    if (rawMetadata?.examType === EXAM_TYPE.TMUA && (!usedModuleCodes.has(TMUA_PAPER.PAPER_1) || !usedModuleCodes.has(TMUA_PAPER.PAPER_2))) {
      errors.push({
        block: 0,
        message: 'TMUA 诊断卷必须同时包含 paper1 和 paper2',
      })
    }

    const durationSum = modules.reduce((sum, module) => sum + module.durationSeconds, 0) / 60
    if (Number.isFinite(rawMetadata?.duration) && rawMetadata.duration !== durationSum) {
      errors.push({
        block: 0,
        message: 'metadata.duration 必须等于各模块 duration 之和，且不包含休息时间',
      })
    }
  } else {
    normalizedQuestions.push(...input.questions.map((question: any) => ({ ...question })))
  }

  if (rawMetadata?.totalQuestions !== undefined && rawMetadata.totalQuestions !== normalizedQuestions.length) {
    errors.push({
      block: 0,
      message: isModular ? 'metadata.totalQuestions 必须等于所有 modules[].questions 的题数之和' : 'metadata.totalQuestions 必须等于 questions.length',
    })
  }

  for (let i = 0; i < normalizedQuestions.length; i++) {
    const q = normalizedQuestions[i]
    const moduleCode = q.module_code || q.component_code
    const moduleQuestionNumber = q.module_question_number ?? q.component_question_number
    const modulePrefix = moduleCode ? `${moduleCode} ` : ''
    const label = `${modulePrefix}题目 ${moduleQuestionNumber ?? q.number ?? `索引${i + 1}`}`
    const imageIds = new Set((Array.isArray(q.images) ? q.images : []).map((img: any) => img?.id).filter(Boolean))

    for (const field of DEPRECATED_QUESTION_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(q, field)) {
        errors.push({
          block: 0,
          message: `${label}：${field} 是已废弃字段，请使用标准题目结构`,
        })
      }
    }

    if (q.number == null) {
      errors.push({ block: 0, message: `${label}：缺少题号 (number)` })
    } else if (typeof q.number !== 'number' || !Number.isFinite(q.number)) {
      errors.push({ block: 0, message: `${label}：题号必须为有效数字` })
    }

    if (!q.title || typeof q.title !== 'string' || !q.title.trim()) {
      errors.push({ block: 0, message: `${label}：缺少题干 (title)` })
    }

    if (!Array.isArray(q.content_blocks) || q.content_blocks.length === 0) {
      errors.push({
        block: 0,
        message: `${label}：缺少题干内容块 (content_blocks)`,
      })
    } else {
      const first = q.content_blocks[0]
      if (first?.type !== 'paragraph' || first.text !== q.title) {
        errors.push({
          block: 0,
          message: `${label}：title 必须等于 content_blocks[0].text，且首块必须为 paragraph`,
        })
      }
      for (let j = 0; j < q.content_blocks.length; j++) {
        const block = q.content_blocks[j]
        if (block?.type === 'paragraph') {
          if (typeof block.text !== 'string') {
            errors.push({
              block: 0,
              message: `${label} 的 content_blocks[${j}]：paragraph 必须包含 text`,
            })
          }
          if (block.align !== undefined && block.align !== 'center') {
            errors.push({
              block: 0,
              message: `${label} 的 content_blocks[${j}]：align 目前只允许 center`,
            })
          }
        } else if (block?.type === 'image_ref') {
          if (Object.prototype.hasOwnProperty.call(block, 'align')) {
            errors.push({
              block: 0,
              message: `${label} 的 content_blocks[${j}]：align 仅适用于 paragraph`,
            })
          }
          if (!block.image_id || !imageIds.has(block.image_id)) {
            errors.push({
              block: 0,
              message: `${label} 的 content_blocks[${j}]：image_id 必须匹配 images[].id`,
            })
          }
        } else {
          errors.push({
            block: 0,
            message: `${label} 的 content_blocks[${j}]：type 只能为 paragraph 或 image_ref`,
          })
        }
      }
    }

    if (!Array.isArray(q.options) || q.options.length === 0) {
      errors.push({ block: 0, message: `${label}：缺少选项 (options)` })
    } else {
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j]
        if (!opt.label) {
          errors.push({
            block: 0,
            message: `${label} 的选项 ${j + 1}：缺少标签 (label)`,
          })
        }
        if (opt.text === undefined || opt.text === null) {
          errors.push({
            block: 0,
            message: `${label} 的选项 ${j + 1}：缺少文本 (text)`,
          })
        }
        if (opt.image_id && !imageIds.has(opt.image_id)) {
          errors.push({
            block: 0,
            message: `${label} 的选项 ${j + 1}：image_id 必须匹配 images[].id`,
          })
        }
      }
    }

    if (!Array.isArray(q.answer)) {
      errors.push({ block: 0, message: `${label}：answer 必须为数组` })
    }
    if (q.difficulty !== undefined && typeof q.difficulty !== 'string') {
      errors.push({ block: 0, message: `${label}：difficulty 必须为字符串` })
    }
    if (q.examType !== rawMetadata?.examType) {
      errors.push({
        block: 0,
        message: `${label}：examType 必须与 metadata.examType 一致`,
      })
    }
    if (!q.source_examType || typeof q.source_examType !== 'string') {
      errors.push({
        block: 0,
        message: `${label}：缺少来源考试类型 (source_examType)`,
      })
    } else {
      sourceExamTypes.add(q.source_examType)
    }
    if (q.year !== rawMetadata?.year) {
      errors.push({
        block: 0,
        message: `${label}：year 必须与 metadata.year 一致`,
      })
    }
    if (!['single_choice', 'multiple_choice', 'short_answer'].includes(q.question_type)) {
      errors.push({
        block: 0,
        message: `${label}：question_type 必须为 single_choice、multiple_choice 或 short_answer`,
      })
    }
    if (isModular && (rawMetadata?.examType === EXAM_TYPE.ESAT || rawMetadata?.examType === EXAM_TYPE.TMUA) && q.question_type !== 'single_choice') {
      errors.push({
        block: 0,
        message: `${label}：${rawMetadata.examType} 分段诊断只支持 single_choice`,
      })
    }
    if (!Array.isArray(q.images)) {
      errors.push({
        block: 0,
        message: `${label}：images 必须为数组，没有图片时请使用空数组`,
      })
    } else {
      for (const img of q.images) {
        if (Object.prototype.hasOwnProperty.call(img, 'code')) {
          errors.push({
            block: 0,
            message: `${label}：images[].code 是已废弃字段，请使用 svg 或 src`,
          })
        }
        if (!img.id || !img.alt || !['svg', 'image'].includes(img.type)) {
          errors.push({
            block: 0,
            message: `${label}：images 每项必须包含 id、type、alt`,
          })
        } else if (img.type === 'svg' && typeof img.svg !== 'string') {
          errors.push({
            block: 0,
            message: `${label}：SVG 图片必须包含 svg 字符串`,
          })
        } else if (img.type === 'image' && typeof img.src !== 'string') {
          errors.push({ block: 0, message: `${label}：位图图片必须包含 src` })
        } else if (img.type === 'image' && !isSafeRasterImageSource(img.src)) {
          errors.push({
            block: 0,
            message: `${label}：位图 src 协议或 data URI 类型不安全`,
          })
        }
      }
    }

    const optionLabels = new Set(
      (Array.isArray(q.options) ? q.options : []).map((option: any) => option?.label).filter((value: unknown): value is string => typeof value === 'string'),
    )
    if (Array.isArray(q.answer) && q.answer.some((answer: unknown) => !optionLabels.has(String(answer)))) {
      errors.push({
        block: 0,
        message: `${label}：answer 必须是 options[].label 的子集`,
      })
    }
    if (q.question_type === 'single_choice' && Array.isArray(q.answer) && q.answer.length !== 1) {
      errors.push({
        block: 0,
        message: `${label}：single_choice 必须且只能有一个正确答案`,
      })
    }
    if (isCanonicalModuleDocument && (typeof q.code !== 'string' || !q.code.trim())) {
      errors.push({
        block: 0,
        message: `${label}：标准分段真题必须填写来源稳定标识 code`,
      })
    } else if (typeof q.code === 'string' && q.code.trim()) {
      if (sourceQuestionCodes.has(q.code)) {
        errors.push({ block: 0, message: `${label}：题目 code 在本卷中重复` })
      }
      sourceQuestionCodes.add(q.code)
    }
  }

  const requestedDeliveryMode = rawMetadata?.deliveryMode
  if (requestedDeliveryMode === 'module') {
    warnings.push('metadata.deliveryMode=module 为兼容值；新文件请使用 module_sequence')
  }
  if (isCanonicalModuleDocument && requestedDeliveryMode !== PAPER_DELIVERY_MODE.MODULE_SEQUENCE) {
    errors.push({
      block: 0,
      message: '标准分段卷 metadata.deliveryMode 必须显式为 module_sequence',
    })
  }
  if (
    requestedDeliveryMode !== undefined &&
    requestedDeliveryMode !== (isModular ? PAPER_DELIVERY_MODE.MODULE_SEQUENCE : PAPER_DELIVERY_MODE.CONTINUOUS) &&
    requestedDeliveryMode !== (isModular ? 'module' : undefined)
  ) {
    errors.push({
      block: 0,
      message: isModular ? 'metadata.deliveryMode 分段卷必须为 module_sequence（兼容旧值 module）' : 'metadata.deliveryMode 扁平卷必须为 continuous',
    })
  }

  const policyBreakDuration = rawMetadata?.breakPolicy?.durationSeconds
  const legacyBreakDuration = rawMetadata?.breakDurationSeconds
  if (isModular && policyBreakDuration !== undefined && legacyBreakDuration !== undefined && Number(policyBreakDuration) !== Number(legacyBreakDuration)) {
    errors.push({
      block: 0,
      message: 'breakPolicy.durationSeconds 与兼容字段 breakDurationSeconds 不能冲突',
    })
  }
  const rawBreakDuration = policyBreakDuration ?? legacyBreakDuration
  if (isModular && rawMetadata?.breakDurationSeconds !== undefined) {
    warnings.push('metadata.breakDurationSeconds 为兼容字段；新文件请使用 breakPolicy.durationSeconds')
  }
  const expectedBreakSkippable = rawMetadata?.examType === EXAM_TYPE.TMUA ? false : true
  if (
    isCanonicalModuleDocument &&
    (!rawMetadata?.breakPolicy || policyBreakDuration === undefined || rawMetadata.breakPolicy.skippable !== expectedBreakSkippable)
  ) {
    errors.push({
      block: 0,
      message:
        rawMetadata?.examType === EXAM_TYPE.TMUA
          ? 'TMUA 标准分卷必须填写 breakPolicy.durationSeconds: 0 和 skippable: false'
          : '标准模块卷必须填写 breakPolicy.durationSeconds 和 skippable: true',
    })
  }
  const breakDurationSeconds = isModular
    ? rawBreakDuration === undefined
      ? rawMetadata?.examType === EXAM_TYPE.TMUA
        ? 0
        : DEFAULT_MODULE_BREAK_SECONDS
      : Number(rawBreakDuration)
    : 0
  if (isModular && (!Number.isInteger(breakDurationSeconds) || breakDurationSeconds < 0)) {
    errors.push({
      block: 0,
      message: 'metadata.breakPolicy.durationSeconds 必须为非负整数秒',
    })
  }
  if (
    isModular &&
    rawMetadata?.examType === EXAM_TYPE.ESAT &&
    Number.isInteger(breakDurationSeconds) &&
    breakDurationSeconds !== DEFAULT_MODULE_BREAK_SECONDS
  ) {
    errors.push({
      block: 0,
      message: 'ESAT 模块诊断卷的 breakPolicy.durationSeconds 必须为 180 秒',
    })
  }
  if (isModular && rawMetadata?.examType === EXAM_TYPE.TMUA && Number.isInteger(breakDurationSeconds) && breakDurationSeconds !== 0) {
    errors.push({
      block: 0,
      message: 'TMUA 两卷连续作答，breakPolicy.durationSeconds 必须为 0 秒',
    })
  }
  const normalizedBreakDurationSeconds =
    Number.isInteger(breakDurationSeconds) && breakDurationSeconds >= 0
      ? breakDurationSeconds
      : rawMetadata?.examType === EXAM_TYPE.TMUA
        ? 0
        : DEFAULT_MODULE_BREAK_SECONDS
  const metadata: StandardPaperMetadata | null =
    rawMetadata && typeof rawMetadata === 'object'
      ? {
          code:
            typeof rawMetadata.code === 'string' && rawMetadata.code.trim()
              ? rawMetadata.code.trim()
              : typeof input?.code === 'string' && input.code.trim()
                ? input.code.trim()
                : null,
          paperName: rawMetadata.paperName,
          year: rawMetadata.year,
          duration: rawMetadata.duration,
          examType: rawMetadata.examType,
          paperType: rawMetadata.paperType,
          totalQuestions: rawMetadata.totalQuestions,
          deliveryMode: isModular ? PAPER_DELIVERY_MODE.MODULE_SEQUENCE : PAPER_DELIVERY_MODE.CONTINUOUS,
          breakDurationSeconds: normalizedBreakDurationSeconds,
          moduleConfig: modules.sort((a, b) => a.order - b.order),
          breakPolicy: {
            durationSeconds: normalizedBreakDurationSeconds,
            skippable: normalizedBreakDurationSeconds > 0,
          },
          assemblyType:
            typeof rawMetadata.assemblyType === 'string'
              ? rawMetadata.assemblyType
              : isModular && rawMetadata.examType === EXAM_TYPE.ESAT
                ? 'legacy_equivalent'
                : 'original',
          sourceExamTypes: [...sourceExamTypes],
          remarks: typeof rawMetadata.remarks === 'string' ? rawMetadata.remarks : null,
        }
      : null

  if (isModular && rawMetadata?.examType === EXAM_TYPE.ESAT && modules.some((module) => module.questionCount !== 27)) {
    warnings.push('模块题量不是正式 ESAT 的每模块 27 题；可用于流程测试，但等效分仅作低可信度估算')
  }

  if (errors.length)
    return {
      metadata,
      questions: normalizedQuestions,
      modules,
      errors,
      warnings,
    }
  // 暂停上传阶段的文本安全清洗：当前 HTML 标签规则会误删数学表达式中的 < 与 >。
  // 清洗函数暂时保留，待后续改为能区分数学符号与真实 HTML 标签的字段级规则后再接回。
  return {
    metadata,
    questions: normalizedQuestions,
    modules: modules.sort((a, b) => a.order - b.order),
    errors,
    warnings,
  }
}

/**
 * 对题目内容做安全清洗（递归遍历所有字符串字段）
 * 返回 { cleaned, warnings }
 */
export function sanitizeQuestionContent(questions: any[]): {
  cleaned: any[]
  warnings: string[]
} {
  const warnings: string[] = []
  const cleaned = JSON.parse(JSON.stringify(questions)) // 深拷贝

  for (let i = 0; i < cleaned.length; i++) {
    const q = cleaned[i]
    const label = `题目 ${q.number ?? i + 1}`
    sanitizeRecursive(q, label, warnings)
  }

  return { cleaned, warnings }
}

/** 递归遍历对象，清洗所有字符串值 */
function sanitizeRecursive(obj: any, questionLabel: string, warnings: string[], path: string = ''): void {
  if (obj === null || obj === undefined) return

  if (typeof obj === 'string') {
    // 跳过 LaTeX-only 占位符（纯标记类字符串不需要清洗）
    if (PLACEHOLDER_RE.test(obj) && obj.replace(PLACEHOLDER_RE, '').trim() === '') return

    const result = sanitizeText(obj, questionLabel, path || '字段')
    if (result.warning) warnings.push(result.warning)
    // 原始字符串没有父级可回写，此分支只补充校验告警。
    return
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const item = obj[i]
      if (typeof item === 'string') {
        const result = sanitizeText(item, questionLabel, path ? `${path}[${i}]` : `[${i}]`)
        obj[i] = result.text
        if (result.warning) warnings.push(result.warning)
      } else if (typeof item === 'object') {
        sanitizeRecursive(item, questionLabel, warnings, path ? `${path}[${i}]` : `[${i}]`)
      }
    }
    return
  }

  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const val = obj[key]
      const nextPath = path ? `${path}.${key}` : key

      if (typeof val === 'string') {
        const result = sanitizeText(val, questionLabel, nextPath)
        obj[key] = result.text
        if (result.warning) warnings.push(result.warning)
      } else if (typeof val === 'object') {
        sanitizeRecursive(val, questionLabel, warnings, nextPath)
      }
    }
  }
}

function sanitizeText(text: string, questionLabel: string, fieldLabel: string): { text: string; warning?: string } {
  const original = text
  let cleaned = original
  // 先解码再做标签与协议清洗，避免 &lt;script&gt; 或编码后的 SVG 绕过检测。
  for (let pass = 0; pass < 2; pass++) {
    const decoded = cleaned
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#x27;/gi, "'")
      .replace(/&#x2f;/gi, '/')
      .replace(/&#(\d+);/g, (_m, d) => String.fromCharCode(parseInt(d, 10)))
      .replace(/&#[xX]([0-9a-fA-F]+);/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
    if (decoded === cleaned) break
    cleaned = decoded
  }

  // 0. 保存 SVG 标签块（合法图形），清洗后还原
  const svgBlocks: string[] = []
  cleaned = cleaned.replace(SVG_BLOCK_RE, (match) => {
    const idx = svgBlocks.length
    svgBlocks.push(sanitizeSvgMarkup(match))
    return `[[SVG_${idx}]]`
  })

  // 2. 移除 <script>, <iframe>, <object>, <embed> 整标签
  cleaned = cleaned.replace(DANGEROUS_TAGS, '')

  // 3. 移除内联事件处理器 (onerror=..., onclick=...)
  cleaned = cleaned.replace(DANGEROUS_EVENTS, '')

  // 4. 移除 javascript: 协议
  cleaned = cleaned.replace(JAVASCRIPT_PROTOCOL, '')

  // 5. 移除剩余的所有 HTML 标签（<div>, <span>, <a> 等），只保留纯文本
  cleaned = cleaned.replace(REMAINING_TAGS, '')

  // 6. 还原合法的 SVG 块
  cleaned = cleaned.replace(/\[\[SVG_(\d+)\]\]/g, (_m, idx) => {
    return svgBlocks[parseInt(idx, 10)] || ''
  })

  // 检查是否有内容被移除
  const trimmed = cleaned.trim()
  if (original !== cleaned) {
    const removed = original.length - cleaned.length
    if (removed > 5) {
      return {
        text: trimmed,
        warning: `${questionLabel} 的 ${fieldLabel}：移除了 ${removed} 个不安全字符`,
      }
    }
  }

  return { text: trimmed }
}

// SVG 会进入题目渲染链路；移除脚本容器、事件属性和外部可执行引用。
function sanitizeSvgMarkup(svg: string): string {
  return svg
    .replace(/<\s*(script|style|foreignObject|iframe|object|embed)\b[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:href|xlink:href)\s*=\s*(?:"(?!#)[^"]*"|'(?!#)[^']*'|(?!#)[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
}

/**
 * 串联处理：提取 → 解析 → 校验 → 清洗
 */
export function processMarkdownImport(md: string): ProcessResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const allQuestions: any[] = []
  let modules: StandardPaperModule[] = []
  let metadata: StandardPaperMetadata | null = null

  if (!md || typeof md !== 'string' || !md.trim()) {
    errors.push({ block: 0, message: 'Markdown 内容不能为空' })
    return { metadata: null, questions: [], modules: [], errors, warnings }
  }

  // 1. 提取 JSON 代码块
  const blocks = extractJsonBlocks(md)
  if (blocks.length === 0) {
    errors.push({
      block: 0,
      message: '未找到 JSON 代码块（需要 ```json ... ``` 格式）',
    })
    return { metadata: null, questions: [], modules: [], errors, warnings }
  }
  if (blocks.length > 1) {
    errors.push({
      block: 0,
      message: '标准导入 Markdown 只能包含一个完整 JSON 代码块',
    })
    return { metadata: null, questions: [], modules: [], errors, warnings }
  }

  // 2. 逐个解析和校验
  for (const block of blocks) {
    let parsed: any
    try {
      parsed = JSON.parse(block.raw)
    } catch (e: any) {
      errors.push({
        block: block.index,
        message: `第 ${block.index} 个 JSON 块解析失败：${e.message}`,
      })
      continue
    }

    const validated = validateStandardPaperDocument(parsed)
    metadata = validated.metadata
    modules = validated.modules
    const questions = validated.questions
    const structErrors = validated.errors
    for (const e of structErrors) {
      errors.push({
        block: block.index,
        message: `第 ${block.index} 个 JSON 块，${e.message}`,
      })
    }

    if (structErrors.length > 0) continue

    // JSON 与 Markdown 共用同一结构归一化和业务校验入口。
    allQuestions.push(...questions)
    warnings.push(...validated.warnings)
  }

  if (allQuestions.length === 0 && errors.length === 0) {
    errors.push({
      block: 0,
      message: '未能从 Markdown 中提取到有效的题目数据',
    })
  }

  return { metadata, questions: allQuestions, modules, errors, warnings }
}
