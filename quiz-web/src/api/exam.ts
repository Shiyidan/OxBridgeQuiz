/**
 * 考试 / 答卷 / 错题本 相关 API
 */
import { callApi } from '@/utils/request'

// ---- 类型 ----

export interface SubmitParams {
  questions: any[]
  answers: Record<string, string>
  startedAt: string
  difficulty?: string
  code?: string
  paperId?: string
}

export interface SubmitResult {
  examRecordId: string
  totalQuestions: number
  correctCount: number
  wrongCount: number
}

export interface ExamQuestion {
  number: number
  title: string
  options: { label: string; text: string }[]
  answer: string[]
  images: any[]
  subject?: string
  difficulty?: { level: string; score: number }
  knowledge_points?: any[]
  learning_analysis?: any
  selectedAnswer?: string | null
  isCorrect?: boolean
  [key: string]: any
}

export interface ExamResult {
  examRecord: {
    id: string
    totalQuestions: number
    correctCount: number
    startedAt: string
    submittedAt: string
    status: string
    paper?: {
      id: string
      title: string
      paperType: string
    } | null
  }
  questions: ExamQuestion[]
}

export interface WrongAnswer {
  id: string
  questionId: string
  selectedAnswer: string | null
  isCorrect: boolean
  examRecord?: {
    id: string
    submittedAt: string
  }
}

// ---- API ----

/** 交卷 */
export function submitExam(params: SubmitParams) {
  return callApi<SubmitResult>({
    url: '/exams/submit',
    method: 'POST',
    isAllData: false,
    body: params,
  })
}

/** 获取答卷详情 */
export function getExamResultData(examId: string) {
  return callApi<ExamResult>({
    url: `/exams/${examId}/result`,
    method: 'GET',
    isAllData: false,
  })
}

/** 获取错题本 */
export function getErrorBookData() {
  return callApi<{ wrongAnswers: WrongAnswer[]; total: number }>({
    url: '/exams/error-book',
    method: 'GET',
    isAllData: false,
  })
}
