// 学习资料 API：提供前台成组资料下载，以及后台 PDF 上传和组级状态管理。
import { callApi } from '@/utils/request'
import type { ExamType } from '@/constants/examTypes'

export type StudyResourceCategory = 'exam_material' | 'past_paper' | 'knowledge_handout'
export type StudyResourceAccessTier = 'free' | 'member'
export type StudyResourceStatus = 'draft' | 'published'
export type StudyResourceFileRole = 'main' | 'question' | 'answer'

export interface StudyResourceFileItem {
  id: string
  fileRole: StudyResourceFileRole
  originalFileName: string
  fileSizeBytes: number
}

export interface StudyResourceItem {
  id: string
  title: string
  description: string | null
  examType: ExamType
  category: StudyResourceCategory
  resourceYear: number | null
  accessTier: StudyResourceAccessTier
  status: StudyResourceStatus
  publishedAt: string | null
  createdAt: string
  downloadCount: number
  files: StudyResourceFileItem[]
}

export interface StudyResourceListData {
  list: StudyResourceItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export type PublicStudyResourceItem = Omit<StudyResourceItem, 'status'>

export interface PublicStudyResourceListData {
  list: PublicStudyResourceItem[]
  pagination: StudyResourceListData['pagination']
}

export interface StudyResourceUploadPayload {
  title: string
  description: string
  examType: ExamType
  category: Exclude<StudyResourceCategory, 'past_paper'>
  file: File
}

export interface PastPaperUploadPayload {
  title: string
  description: string
  examType: ExamType
  resourceYear: number
  questionFile: File | null
  answerFile: File | null
}

export function getStudyResourceAdminList(params: {
  page: number
  pageSize: number
  examType?: ExamType
  category?: StudyResourceCategory
  status?: StudyResourceStatus
}) {
  return callApi<StudyResourceListData>({
    url: '/study-resources/admin',
    method: 'GET',
    params: {
      page: String(params.page),
      pageSize: String(params.pageSize),
      examType: params.examType,
      category: params.category,
      status: params.status,
    },
  })
}

export function getPublishedStudyResources(params: {
  page: number
  pageSize: number
  examType?: ExamType
  category?: StudyResourceCategory
}) {
  return callApi<PublicStudyResourceListData>({
    url: '/study-resources',
    method: 'GET',
    params: {
      page: String(params.page),
      pageSize: String(params.pageSize),
      examType: params.examType,
      category: params.category,
    },
    silent: true,
  })
}

export function downloadStudyResource(id: string) {
  return callApi<Blob>({
    url: `/study-resources/${id}/download`,
    method: 'GET',
    timeout: 60000,
    responseType: 'blob',
  })
}

export function uploadStudyResource(payload: StudyResourceUploadPayload) {
  const form = new FormData()
  form.append('title', payload.title)
  form.append('description', payload.description)
  form.append('examType', payload.examType)
  form.append('category', payload.category)
  form.append('file', payload.file)

  return callApi<StudyResourceItem>({
    url: '/study-resources/admin/upload',
    method: 'POST',
    body: form,
    timeout: 60000,
  })
}

export function uploadPastPaperBundle(payload: PastPaperUploadPayload) {
  const form = new FormData()
  form.append('title', payload.title)
  form.append('description', payload.description)
  form.append('examType', payload.examType)
  form.append('resourceYear', String(payload.resourceYear))
  if (payload.questionFile) form.append('questionFile', payload.questionFile)
  if (payload.answerFile) form.append('answerFile', payload.answerFile)

  return callApi<StudyResourceItem>({
    url: '/study-resources/admin/upload-past-paper',
    method: 'POST',
    body: form,
    timeout: 120000,
  })
}

export function deleteStudyResource(id: string) {
  return callApi<null>({
    url: `/study-resources/admin/bundles/${encodeURIComponent(id)}`,
    method: 'DELETE',
  })
}

export function updateStudyResourceStatus(id: string, status: StudyResourceStatus) {
  return callApi<Pick<StudyResourceItem, 'id' | 'status' | 'publishedAt'>>({
    url: `/study-resources/admin/bundles/${encodeURIComponent(id)}/status`,
    method: 'PUT',
    body: { status },
  })
}
