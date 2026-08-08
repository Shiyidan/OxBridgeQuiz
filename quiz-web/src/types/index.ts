// 题目标准结构：对应 standard.md 的解析 JSON 主格式。

/** 题目类型：用于区分单选、多选和主观简答题。 */
export type QuestionType = 'single_choice' | 'multiple_choice' | 'short_answer'

/** ESAT 官方五个模块的稳定标识；展示名称不参与业务判断。 */
export type EsatModuleCode = 'maths1' | 'maths2' | 'physics' | 'chemistry' | 'biology'

/** TMUA 两份试卷的稳定标识；Paper 展示名称不参与业务判断。 */
export type TmuaPaperCode = 'paper1' | 'paper2'

export type DiagnosticSectionCode = EsatModuleCode | TmuaPaperCode

export type PaperDeliveryMode = 'continuous' | 'module_sequence'

/** 上传文档可使用新版 section_sequence；module 仅作为历史兼容值。 */
export type PaperDocumentDeliveryMode = PaperDeliveryMode | 'section_sequence' | 'module'

export type PaperAccessTier = 'free' | 'member'

export interface PaperBreakPolicy {
  durationSeconds: number
  skippable: boolean
}

/** 试卷元数据：只描述整张试卷，不重复放到每一道题里。 */
export interface PaperMetadata {
  paperName: string
  year: number
  duration: number
  examType: string
  paperType: 'realPaper' | 'mockPaper' | 'aiPaper'
  accessTier?: PaperAccessTier
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
      /** 仅显式 center 时整段居中；缺省时沿用普通题干流。 */
      align?: 'center'
      /** 新版 project JSON 的连续片段在同一阅读流中展示。 */
      inline?: boolean
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

/** 错误选项解析：兼容解析文件使用的选项与原因对象。 */
export interface DistractorReason {
  option: string
  reason: string
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
    distractors?: DistractorReason[]
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
  module_code?: DiagnosticSectionCode
  module_order?: number
  module_question_number?: number
  /** @deprecated 兼容早期组合卷；新数据使用 module_*。 */
  component_code?: DiagnosticSectionCode
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
  code: DiagnosticSectionCode
  order: number
  subject: string
  subject_code: string | number
  duration: number
  totalQuestions?: number
  questions: Array<QuestionInput & { code: string }>
}

/** 新版项目题目在上传边界使用 camelCase，导入后统一转为 Question。 */
export interface ProjectQuestionInput {
  code: string
  number: number
  title: string
  contentBlocks: RichContentBlock[]
  options: Option[]
  answer: string[]
  images: QuestionImage[]
  questionType: QuestionType
  difficulty?: string
  classification: {
    subject: string
    subjectCode: string | number
    topic: string
    topicCode: string | number
    knowledgePoints: KnowledgePoint[]
  }
  source: {
    examType: string
    year: number
    sectionCode: DiagnosticSectionCode
    questionNumber: number
  }
  learningAnalysis: {
    correctSolution: string
    examFocus: string
    commonErrorCauses: string[]
    reviewGuidance: string
  }
}

/** 新版 TMUA 项目卷只携带内容结构，计时与切换规则由服务端考试配置派生。 */
export interface TmuaSectionPaperJson {
  metadata: {
    code: string
    title: string
    examType: 'TMUA'
    year: number
    paperType: 'realPaper' | 'mockPaper' | 'aiPaper'
    accessTier?: PaperAccessTier
    assemblyType: 'original' | string
    deliveryMode: 'section_sequence'
    remarks?: string
  }
  sections: Array<{
    code: TmuaPaperCode
    sectionType: 'paper'
    order: 1 | 2
    questions: ProjectQuestionInput[]
  }>
  questions?: never
  modules?: never
}

/** 新版 ESAT 等效诊断卷同样只携带三个科目的内容结构。 */
export interface EsatSectionPaperJson {
  metadata: {
    code: string
    title: string
    examType: 'ESAT'
    year: number
    paperType: 'realPaper' | 'mockPaper' | 'aiPaper'
    accessTier?: PaperAccessTier
    assemblyType: 'legacy_equivalent' | string
    deliveryMode: 'section_sequence'
    remarks?: string
  }
  sections: Array<{
    code: EsatModuleCode
    sectionType: 'subject'
    order: number
    questions: ProjectQuestionInput[]
  }>
  questions?: never
  modules?: never
}

export interface FlatPaperJson {
  metadata: PaperMetadata
  questions: QuestionInput[]
  modules?: never
}

export interface EsatModularPaperJson {
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

export interface TmuaModularPaperJson {
  schemaVersion: 'diagnostic-paper-v2'
  code?: string
  metadata: PaperMetadata & {
    examType: 'TMUA'
    deliveryMode: 'module_sequence'
    duration: 150
    totalQuestions: 40
    breakPolicy: {
      durationSeconds: 0
      skippable: false
    }
  }
  modules: DiagnosticPaperModule[]
  questions?: never
}

export type ModularPaperJson = EsatModularPaperJson | TmuaModularPaperJson

/** 现有生成器过渡格式；导入器接受，但新文件应使用 ModularPaperJson。 */
export interface LegacyGroupedPaperJson {
  code?: string
  metadata: PaperMetadata
  questions: Array<{
    /** 旧格式允许省略，导入器会由 subject 推导。 */
    code?: DiagnosticSectionCode
    module_code?: DiagnosticSectionCode
    component_code?: DiagnosticSectionCode
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
    code?: DiagnosticSectionCode
    module_code?: DiagnosticSectionCode
    component_code?: DiagnosticSectionCode
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
  | TmuaSectionPaperJson
  | EsatSectionPaperJson
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
    code: DiagnosticSectionCode
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
