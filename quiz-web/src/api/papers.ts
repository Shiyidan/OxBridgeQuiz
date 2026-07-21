/**
 * 试卷 相关 API
 */
import { callApi } from '@/utils/request'
import type { PaperDeliveryMode, Question } from '@/types'

export interface PaperModuleOutline {
  code: string
  subject: string
  subjectCode: string | null
  order: number
  durationSeconds: number
  questionCount: number
}

export interface PaperItem {
  id: string
  title: string
  code: string | null
  year: number
  duration: number
  totalQuestions: number
  examType?: string
  paperType?: string
  deliveryMode?: PaperDeliveryMode
  breakDurationSeconds?: number
  modules?: PaperModuleOutline[]
  assemblyType?: string
  remarks?: string | null
  status: string
  createdAt: string
}

export interface PaperListResult {
  list: PaperItem[]
  pagination: PaginationMeta
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
}

export interface PaperListParams {
  page?: number
  pageSize?: number
  paperType?: string
  examType?: string
  keyword?: string
}

export interface PaperDetail extends PaperItem {
  updatedAt: string
  questions: Question[]
}

/** 试卷列表 */
export function getPaperListData(params: PaperListParams = {}) {
  return callApi<PaperListResult>({
    url: '/papers',
    method: 'GET',
    isAllData: false,
    params: {
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 20),
      ...(params.paperType ? { paperType: params.paperType } : {}),
      ...(params.examType ? { examType: params.examType } : {}),
      ...(params.keyword ? { keyword: params.keyword } : {}),
    },
  })
}

/** 试卷详情 */
export function getPaperDetailData(id: string) {
  return callApi<PaperDetail>({
    url: `/papers/${id}`,
    method: 'GET',
    isAllData: false,
  })
}

/** 更新试卷状态 */
export function updatePaperStatus(id: string, status: string) {
  return callApi<PaperItem>({
    url: `/papers/${id}`,
    method: 'PUT',
    isAllData: false,
    body: { status },
  })
}

/** 更新试卷类型 */
export function updatePaperType(id: string, paperType: string) {
  return callApi<PaperItem>({
    url: `/papers/${id}`,
    method: 'PUT',
    isAllData: false,
    body: { paperType },
  })
}

export interface AssessmentPaperItem {
  id: string
  paperId: string
  paperName: string
  title: string
  code: string | null
  year: number
  duration: number
  totalQuestions: number
  examType?: string
  paperType: string
  deliveryMode: PaperDeliveryMode
  breakDurationSeconds: number
  modules: PaperModuleOutline[]
  assemblyType: string
  remarks: string | null
  testStatus: 'not_started' | 'in_progress' | 'completed'
  examRecordId: string | null
  answeredCount: number
  correctCount: number | null
  startedAt: string | null
  expiresAt: string | null
  phase: string | null
  currentModuleIndex: number | null
  phaseExpiresAt: string | null
  submittedAt: string | null
  durationSeconds: number | null
  reportStatus: 'not_generated' | 'pending' | 'analyzing' | 'completed' | 'failed' | null
  reportStage: string | null
  reportProgress: number
  reportErrorMessage: string | null
  hasReport: boolean
  reportExamRecordId: string | null
  generationMode: 'full_ai' | 'mixed_fallback' | 'rules_only' | null
  reportCompletedAt: string | null
}

export interface AssessmentPaperResult {
  list: AssessmentPaperItem[]
}

/** 获取按试卷聚合的诊断测试列表及当前用户状态。 */
export function getAssessmentPapersData() {
  return callApi<AssessmentPaperResult>({
    url: '/papers/assessment/papers',
    method: 'GET',
    isAllData: false,
  })
}
