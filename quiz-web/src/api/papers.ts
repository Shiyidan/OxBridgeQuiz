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
export function getPaperListData(params: { page?: number; limit?: number } = {}) {
  return callApi<PaperListResult>({
    url: '/papers',
    method: 'GET',
    isAllData: false,
    params: {
      page: String(params.page || 1),
      limit: String(params.limit || 100),
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
