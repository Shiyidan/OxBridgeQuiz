// 题目标准结构：对应 standard.md 的解析 JSON 主格式。

/** 题目类型：用于区分单选、多选和主观简答题。 */
export type QuestionType = 'single_choice' | 'multiple_choice' | 'short_answer'

/** ESAT 官方五个模块的稳定标识；展示名称不参与业务判断。 */
export type EsatModuleCode = 'maths1' | 'maths2' | 'physics' | 'chemistry' | 'biology'

export type PaperDeliveryMode = 'continuous' | 'module_sequence'

/** 上传文档与 API 统一使用 module_sequence；module 仅作为兼容值。 */
export type PaperDocumentDeliveryMode = PaperDeliveryMode | 'module'

export interface PaperBreakPolicy {
  durationSeconds: number
  skippable: true
}

/** 试卷元数据：只描述整张试卷，不重复放到每一道题里。 */
export interface PaperMetadata {
  paperName: string
  year: number
  duration: number
  examType: string
  paperType: 'realPaper' | 'mockPaper' | 'aiPaper'
  totalQuestions: number
  deliveryMode?: PaperDocumentDeliveryMode
  /** @deprecated 兼容早期生成文件；新文件使用 breakPolicy。 */
  breakDurationSeconds?: number
  breakPolicy?: PaperBreakPolicy
  assemblyType?: 'original' | 'legacy_equivalent' | string
  sourceExamTypes?: string[]
  remarks?: string
}

/** 题干内容块：题干按段落和图片引用顺序渲染。 */
export type RichContentBlock =
  | {
      type: 'paragraph'
      text: string
    }
  | {
      type: 'image_ref'
      image_id: string
      alt?: string
    }

/** 题目选项：文字选项和图像选项统一使用同一结构。 */
export interface Option {
  label: string
  text: string
  image_id?: string
}

/** 题目图片资源池：题干和选项图片都必须通过 id 引用这里的资源。 */
export type QuestionImage =
  | {
      id: string
      type: 'svg'
      svg: string
      alt: string
    }
  | {
      id: string
      type: 'image'
      src: string
      alt: string
    }

/** 知识点标注：用于考纲映射、报告分析和错题聚合。 */
export interface KnowledgePoint {
  code: string
  label: string
  role: 'primary' | 'secondary'
}

/** 学习解析：入库后的题目解析、反馈和复习建议。 */
export interface LearningAnalysis {
  solution_trace?: {
    trace_source?: string
    knowns?: string[]
    method?: string
    steps?: string[]
    final_value?: string
    correct_answer?: string[]
    distractors?: Record<string, string>
  }
  answer_feedback_mode?: 'precomputed'
  exam_focus?: string
  correct_solution?: string
  /** 旧解析文件兼容字段；导入时会归一化到 correct_solution。 */
  solution?: string
  common_error_causes?: string[]
  review_guidance?: string
}

/** 标准题目结构：前端渲染、练习、考试和报告统一使用这一份结构。 */
export interface Question {
  id: string
  uniqueCode?: string
  code?: string
  number: number
  title: string
  content_blocks: RichContentBlock[]
  options: Option[]
  answer: string[]
  images: QuestionImage[]
  examType: string
  source_examType: string
  year: number
  question_type: QuestionType
  difficulty?: string
  is_ai_generated?: boolean
  subject_code?: string
  subject?: string
  module_code?: EsatModuleCode
  module_order?: number
  module_question_number?: number
  /** @deprecated 兼容早期组合卷；新数据使用 module_*。 */
  component_code?: EsatModuleCode
  component_order?: number
  component_question_number?: number
  topic_code?: string
  topic?: string
  knowledge_points?: KnowledgePoint[]
  syllabus_points?: Array<{ code: string; label: string }>
  learning_analysis?: LearningAnalysis
}

/** 作答接口题目：服务端不会下发正确答案或解析。 */
export type AttemptQuestion = Omit<Question, 'answer' | 'learning_analysis'> & {
  answer?: never
  learning_analysis?: never
}

/** 通用题卡既渲染完整题目，也渲染不含答案的作答态题目。 */
export type RenderableQuestion = Omit<Question, 'answer'> & { answer?: string[] }

/** 上传态题目尚未生成数据库 id。 */
export type QuestionInput = Omit<Question, 'id' | 'uniqueCode' | 'subject_code'> & {
  id?: string
  /** 外部试卷可使用数字考纲码；服务端入库前会统一转为字符串。 */
  subject_code?: string | number
}

/** 模块化诊断卷：每个模块独立计时，模块内题号从 1 开始。 */
export interface DiagnosticPaperModule {
  code: EsatModuleCode
  order: number
  subject: string
  subject_code: string | number
  duration: number
  totalQuestions?: number
  questions: Array<QuestionInput & { code: string }>
}

export interface FlatPaperJson {
  metadata: PaperMetadata
  questions: QuestionInput[]
  modules?: never
}

export interface ModularPaperJson {
  schemaVersion: 'diagnostic-paper-v2'
  code?: string
  metadata: PaperMetadata & {
    examType: 'ESAT'
    deliveryMode: 'module_sequence'
    breakPolicy: {
      durationSeconds: 180
      skippable: true
    }
  }
  modules: DiagnosticPaperModule[]
  questions?: never
}

/** 现有生成器过渡格式；导入器接受，但新文件应使用 ModularPaperJson。 */
export interface LegacyGroupedPaperJson {
  code?: string
  metadata: PaperMetadata
  questions: Array<{
    /** 旧格式允许省略，导入器会由 subject 推导。 */
    code?: EsatModuleCode
    module_code?: EsatModuleCode
    component_code?: EsatModuleCode
    order?: number
    subject: string
    subject_code?: string | number
    duration: number
    items: QuestionInput[]
  }>
  modules?: never
}

/** 早期 modules[].items 格式；只用于兼容导入。 */
export interface LegacyModuleItemsPaperJson {
  code?: string
  metadata: PaperMetadata
  modules: Array<{
    code?: EsatModuleCode
    module_code?: EsatModuleCode
    component_code?: EsatModuleCode
    order?: number
    subject: string
    subject_code?: string | number
    duration: number
    totalQuestions?: number
    items: QuestionInput[]
  }>
  questions?: never
}

export type StandardPaperJson =
  | FlatPaperJson
  | ModularPaperJson
  | LegacyGroupedPaperJson
  | LegacyModuleItemsPaperJson

/** 前端考试态中的试卷对象。 */
export interface Paper {
  title: string
  year: number
  duration: number
  totalQuestions: number
  deliveryMode?: PaperDeliveryMode
  breakDurationSeconds?: number
  modules?: Array<{
    code: EsatModuleCode
    subject: string
    subjectCode?: string | null
    order: number
    durationSeconds: number
    questionCount: number
  }>
  questions: Question[]
}

/** 单题作答记录：用于本地考试状态和提交前整理。 */
export interface AnswerRecord {
  questionId: string
  selectedOption: string
  answeredAt: number
}

/** 前端考试状态：Pinia store 使用。 */
export interface ExamState {
  paper: Paper | null
  answers: Map<string, string>
  submitted: boolean
  startedAt: number | null
  submittedAt: number | null
}
