/**
 * 试卷 相关 API
 */
import { callApi } from '@/utils/request'

export interface PaperItem {
  id: string
  title: string
  code: string | null
  year: number
  duration: number
  totalQuestions: number
  examType?: string
  paperType?: string
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
  questions: any[]
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
  title: string
  code: string | null
  year: number
  duration: number
  totalQuestions: number
  examType?: string
  paperType: string
  createdAt: string
}

export interface AssessmentRecordItem {
  id: string
  paperId: string
  examType?: string
  paperTitle: string
  totalQuestions: number
  correctCount: number
  startedAt: string
  submittedAt: string | null
  durationSeconds: number | null
}

export interface AssessmentPaperResult {
  papers: AssessmentPaperItem[]
  records: AssessmentRecordItem[]
}

/** 诊断测试套卷与参与记录 */
export function getAssessmentPapersData() {
  return callApi<AssessmentPaperResult>({
    url: '/papers/assessment/papers',
    method: 'GET',
    isAllData: false,
  })
}
