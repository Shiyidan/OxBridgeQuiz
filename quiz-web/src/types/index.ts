// 题目标准结构：对应 standard.md 的解析 JSON 主格式。

/** 题目类型：用于区分单选、多选和主观简答题。 */
export type QuestionType = 'single_choice' | 'multiple_choice' | 'short_answer'

/** 试卷元数据：只描述整张试卷，不重复放到每一道题里。 */
export interface PaperMetadata {
  paperName: string
  year: number
  duration: number
  examType: string
  paperType: 'realPaper' | 'mockPaper' | 'aiPaper'
  totalQuestions: number
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
  topic_code?: string
  topic?: string
  knowledge_points?: KnowledgePoint[]
  learning_analysis?: LearningAnalysis
}

/** 标准试卷 JSON：上传和导入时的根结构。 */
export interface StandardPaperJson {
  metadata: PaperMetadata
  questions: Question[]
}

/** 前端考试态中的试卷对象。 */
export interface Paper {
  title: string
  year: number
  duration: number
  totalQuestions: number
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
