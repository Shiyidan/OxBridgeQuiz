// 练习本 API：集中定义配置、首页汇总、历史分页和开始练习请求。
import { callApi } from '@/utils/request'
import type { ActiveExamType } from '@/stores/auth'

export type PracticeDifficultyMode = 'easy' | 'medium' | 'hard' | 'mixed'

export interface PracticeKnowledgePoint {
  code: string
  label: string
  parentLabel: string
  subjectLabel: string
}

export interface PracticeNotebookConfig {
  id: string
  name: string
  examType: ActiveExamType
  knowledgePointCodes: string[]
  knowledgePoints: PracticeKnowledgePoint[]
  questionCount: number
  difficultyMode: PracticeDifficultyMode
  durationMinutes: number | null
  unseenFirst: boolean
  status: string
  createdAt: string
  updatedAt: string
}

export interface PracticeHistoryRecord {
  id: string
  examType: ActiveExamType
  totalQuestions: number
  correctCount: number
  accuracy: number
  durationSeconds: number
  startedAt: string
  submittedAt: string | null
  source: 'direct' | 'free_assembly' | 'notebook'
  snapshot: Record<string, unknown>
}

export interface PracticeNotebookSummary extends PracticeNotebookConfig {
  latestRecord: PracticeHistoryRecord | null
  completedGroups: number
  completedQuestions: number
}

export interface ActiveNotebookPractice {
  examRecordId: string
  examType: ActiveExamType
  totalQuestions: number
  answeredCount: number
  startedAt: string
  practiceNotebookId: string | null
  source: 'direct' | 'free_assembly' | 'notebook'
}

export interface TemporaryPracticeSummary {
  id: 'temporary'
  name: string
  examType: ActiveExamType
  latestRecord: PracticeHistoryRecord | null
  completedGroups: number
  completedQuestions: number
}

export interface PracticeNotebookListResult {
  notebooks: PracticeNotebookSummary[]
  activePractice: ActiveNotebookPractice | null
  temporaryPractice: TemporaryPracticeSummary | null
}

export interface PracticeHistoryResult {
  list: PracticeHistoryRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export interface PracticeNotebookPayload {
  name: string
  examType: ActiveExamType
  knowledgePointCodes: string[]
  questionCount: number
  difficultyMode: PracticeDifficultyMode
  durationMinutes: number | null
  unseenFirst: boolean
}

export interface StartNotebookPracticeResult {
  examRecordId: string
  examType: ActiveExamType
  totalQuestions: number
  startedAt: string
  expiresAt: string | null
}

/** 按导航栏考试类型读取练习本、临时练习和唯一进行中练习。 */
export function getPracticeNotebooks(examType: ActiveExamType) {
  return callApi<PracticeNotebookListResult>({
    url: '/practice-notebooks',
    method: 'GET',
    params: { examType },
  })
}

/** 读取编辑页需要的完整练习本配置。 */
export function getPracticeNotebook(id: string) {
  return callApi<PracticeNotebookConfig>({
    url: `/practice-notebooks/${id}`,
    method: 'GET',
  })
}

/** 保存一套新的可重复组卷规则。 */
export function createPracticeNotebook(payload: PracticeNotebookPayload) {
  return callApi<PracticeNotebookConfig>({
    url: '/practice-notebooks',
    method: 'POST',
    body: payload,
  })
}

/** 编辑只影响后续组卷，不改变已有答卷快照。 */
export function updatePracticeNotebook(id: string, payload: PracticeNotebookPayload) {
  return callApi<PracticeNotebookConfig>({
    url: `/practice-notebooks/${id}`,
    method: 'PUT',
    body: payload,
  })
}

/** 原子校验题目与额度并生成一份可恢复练习。 */
export function startPracticeNotebook(id: string) {
  return callApi<StartNotebookPracticeResult>({
    url: `/practice-notebooks/${id}/start`,
    method: 'POST',
    body: {},
  })
}

/** 展开某本练习本时按需读取历史分页。 */
export function getPracticeNotebookHistory(id: string, page: number, pageSize: number) {
  return callApi<PracticeHistoryResult>({
    url: `/practice-notebooks/${id}/history`,
    method: 'GET',
    params: { page: String(page), pageSize: String(pageSize) },
  })
}

/** 临时练习承接题库专项和一次性自由组卷的历史记录。 */
export function getTemporaryPracticeHistory(
  examType: ActiveExamType,
  page: number,
  pageSize: number,
) {
  return callApi<PracticeHistoryResult>({
    url: '/practice-notebooks/temporary/history',
    method: 'GET',
    params: { examType, page: String(page), pageSize: String(pageSize) },
  })
}
