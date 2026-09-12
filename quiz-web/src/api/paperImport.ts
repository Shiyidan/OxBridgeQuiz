/** 管理端标准试卷 JSON 导入 API。 */
import { callApi } from '@/utils/request'
import type { Question, StandardPaperJson } from '@/types'

export interface ImportedPaperResult {
  id: string
  questions: Question[]
  modules?: Array<{
    code: string
    subject: string
    subjectCode: string | null
    order: number
    durationSeconds: number
    questionCount: number
  }>
  warnings?: string[]
}

/** JSON 导入试卷 */
export function importJson(params: StandardPaperJson & { code?: string }) {
  return callApi<ImportedPaperResult>({
    url: '/papers/import-json',
    method: 'POST',
    body: params,
    timeout: 0,
  })
}
