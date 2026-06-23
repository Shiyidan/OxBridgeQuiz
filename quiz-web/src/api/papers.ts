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
  papers: PaperItem[]
  total: number
  page: number
  totalPages: number
}

export interface PaperDetail extends PaperItem {
  updatedAt: string
  questions: any[]
}

/** 试卷列表 */
export function getPaperListData(params: { page?: number; limit?: number; paperType?: string } = {}) {
  return callApi<PaperListResult>({
    url: '/papers',
    method: 'GET',
    isAllData: false,
    params: {
      page: String(params.page || 1),
      limit: String(params.limit || 100),
      ...(params.paperType ? { paperType: params.paperType } : {}),
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
