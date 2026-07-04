/**
 * 试卷上传 / 解析 相关 API
 */
import { callApi } from '@/utils/request'
import type { PaperMetadata, Question } from '@/types'

export interface CreateTaskResult {
  paperId: string
  taskId: string
}

export interface ParseTaskStatus {
  progress: number
  status: string
  error?: string
}

/** 创建上传任务 */
export function createUploadTask(params: {
  title: string
  year: number
  duration: number
  totalPages: number
  examType?: string
  paperType?: string
}) {
  return callApi<CreateTaskResult>({
    url: '/upload/paper-pages/create',
    method: 'POST',
    isAllData: false,
    body: params,
  })
}

/** 上传单页 */
export function uploadPage(
  taskId: string,
  data: {
    page: number
    base64: string
    mimeType: string
    totalPages: number
  },
) {
  return callApi<void>({
    url: `/parse-tasks/${taskId}/pages`,
    method: 'POST',
    isAllData: false,
    body: data,
  })
}

/** 轮询解析状态 */
export function getParseTaskStatusData(taskId: string) {
  return callApi<ParseTaskStatus>({
    url: `/parse-tasks/${taskId}`,
    method: 'GET',
    isAllData: false,
  })
}

/** 重试解析（旧版） */
export function retryParseTask(taskId: string) {
  return callApi<void>({
    url: `/parse-tasks/${taskId}/retry`,
    method: 'POST',
    isAllData: false,
  })
}

/** JSON 导入试卷 */
export function importJson(params: {
  code?: string
  metadata: PaperMetadata
  questions: Question[]
}) {
  return callApi<any>({
    url: '/papers/import-json',
    method: 'POST',
    isAllData: false,
    body: params,
  })
}

/** Markdown 导入试卷 */
export function importMarkdown(params: { markdown: string; code?: string }) {
  return callApi<any>({
    url: '/papers/import-markdown',
    method: 'POST',
    isAllData: false,
    body: params,
  })
}
