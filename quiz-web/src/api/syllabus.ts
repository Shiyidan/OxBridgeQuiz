// 大纲库管理 API：上传版本、查看内容、启用后同步到试题库组织树。
import { callApi } from '@/utils/request'
import type { ExamType } from '@/constants/examTypes'

export interface SyllabusItem {
  id: string
  name: string
  examType: ExamType
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SyllabusDetail extends SyllabusItem {
  content: unknown
}

export function getSyllabusListData() {
  return callApi<SyllabusItem[]>({
    url: '/papers/syllabus-library',
    method: 'GET',
  })
}

export function uploadSyllabusData(payload: {
  name: string
  examType: ExamType
  content: unknown
}) {
  return callApi<SyllabusItem>({
    url: '/papers/syllabus-library',
    method: 'POST',
    body: payload,
  })
}

export function getSyllabusDetailData(id: string) {
  return callApi<SyllabusDetail>({
    url: `/papers/syllabus-library/${id}`,
    method: 'GET',
  })
}

export function enableSyllabusData(id: string) {
  return callApi<{ id: string; isActive: boolean }>({
    url: `/papers/syllabus-library/${id}/enable`,
    method: 'PUT',
  })
}

export function disableSyllabusData(id: string) {
  return callApi<{ id: string; isActive: boolean }>({
    url: `/papers/syllabus-library/${id}/disable`,
    method: 'PUT',
  })
}
