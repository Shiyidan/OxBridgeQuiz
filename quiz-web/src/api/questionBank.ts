/**
 * 试题库相关 API
 */
import { callApi } from '@/utils/request'

// ---- 类型 ----

export interface SyllabusNode {
  code: string
  label: string
  children?: SyllabusNode[]
}

export interface DifficultyCount {
  easy: number
  medium: number
  hard: number
  composite: number
}

export interface QuestionBankItem {
  number: number
  title: string
  options: { label: string; text: string }[]
  answer: string[]
  images: any[]
  subject?: string
  difficulty?: string
  knowledge_points?: { code: string; label: string; role?: string }[]
  syllabus_points?: { code: string; label: string; role?: string }[]
  question_type?: string
  [key: string]: any
}

export interface QuestionBankSummary {
  total: number
  difficultyCount: DifficultyCount
}

// ---- API ----

/** 获取考纲树 */
export function getSyllabusData() {
  return callApi<SyllabusNode[]>({
    url: '/papers/syllabus',
    method: 'GET',
    isAllData: false,
    params: { examType: 'ESAT' },
  })
}

/** 获取考纲节点下的题数与难度分布（轻量） */
export function getQuestionSummaryData(code: string) {
  return callApi<QuestionBankSummary>({
    url: '/papers/question-bank/summary',
    method: 'GET',
    isAllData: false,
    params: { code },
  })
}

/** 获取试题列表（全量，用于在线答题） */
export function getQuestionsData(filters: { code?: string; difficulty?: string }) {
  return callApi<{ questions: QuestionBankItem[] }>({
    url: '/papers/question-bank',
    method: 'GET',
    isAllData: false,
    params: filters,
  }).then(data => data.questions)
}
