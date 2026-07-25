/**
 * 试题库相关 API
 */
import { callApi } from '@/utils/request'
import { DEFAULT_EXAM_TYPE } from '@/constants/examTypes'
import type { Question } from '@/types'

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

export interface QuestionBankItem extends Question {
  _paperId?: string
}

export interface QuestionBankSummary {
  total: number
  difficultyCount: DifficultyCount
}

// ---- API ----

/** 获取考纲树 */
export function getSyllabusData(examType = DEFAULT_EXAM_TYPE) {
  return callApi<SyllabusNode[]>({
    url: '/papers/syllabus',
    method: 'GET',
    params: { examType },
  })
}

/** 获取考纲节点下的题数与难度分布（轻量） */
export function getQuestionSummaryData(code: string, examType = DEFAULT_EXAM_TYPE) {
  return callApi<QuestionBankSummary>({
    url: '/papers/question-bank/summary',
    method: 'GET',
    params: { code, examType },
  })
}

/** 获取试题列表（全量，用于在线答题） */
export function getQuestionsData(filters: {
  code?: string
  difficulty?: string
  examType?: string
}) {
  return callApi<{ questions: QuestionBankItem[] }>({
    url: '/papers/question-bank',
    method: 'GET',
    params: filters,
  }).then((data) => data.questions)
}
