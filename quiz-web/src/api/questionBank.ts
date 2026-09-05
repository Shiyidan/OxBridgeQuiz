// 试题库 API：覆盖考纲与练习选题、standard2 导入及单题审核。
import { callApi } from '@/utils/request'
import { DEFAULT_EXAM_TYPE } from '@/constants/examTypes'
import type { AttemptQuestion, KnowledgePoint, Question } from '@/types'

export interface SyllabusNode {
  code: string
  label: string
  children?: SyllabusNode[]
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard'

export type DifficultyCount = Record<QuestionDifficulty, number>

export interface QuestionBankSummary {
  total: number
  difficultyCount: DifficultyCount
}

export interface KnowledgePointQuestionCounts {
  counts: Record<string, number>
  total: number
}

export interface PaginationResult {
  page: number
  pageSize: number
  total: number
}

export type QuestionBankStatus = 'draft' | 'published' | 'archived'
export type QuestionBankQualityTier = 'qualified' | 'excellent'

export interface QuestionBankAdminItem {
  id: string
  code: string
  title: string
  examType: string
  questionType: string
  difficulty: QuestionDifficulty
  qualityTier: QuestionBankQualityTier | null
  subject: string | null
  subjectCode: string | null
  topic: string | null
  topicCode: string | null
  knowledgePoints: KnowledgePoint[]
  isReplacement: boolean
  status: QuestionBankStatus
  publishedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  importBatch: { id: string; title: string } | null
}

export interface QuestionBankAdminDetail extends QuestionBankAdminItem {
  question: Question
  importBatch: {
    id: string
    title: string
    fileName?: string | null
    remarks?: string | null
    createdAt: string
  } | null
}

export interface QuestionBankImportBatch {
  id: string
  title: string
  fileName: string | null
  declaredQuestionCount: number
  actualQuestionCount: number
  currentQuestionCount: number
  replacementCount: number
  replacedQuestionCount: number
  pendingReplacementCount: number
  remarks: string | null
  createdAt: string
  statusCounts: Record<QuestionBankStatus, number>
  examTypes: string[]
  subjects: Array<{ code: string; label: string; examType: string }>
  parts: Array<{ code: string; label: string; subjectCode: string | null }>
}

/** 获取当前考试类型的考纲树。 */
export function getSyllabusData(examType = DEFAULT_EXAM_TYPE) {
  return callApi<SyllabusNode[]>({
    url: '/papers/syllabus',
    method: 'GET',
    params: { examType },
  })
}

/** 获取考纲节点下已发布题目的数量与难度分布。 */
export function getQuestionSummaryData(code: string, examType = DEFAULT_EXAM_TYPE) {
  return callApi<QuestionBankSummary>({
    url: '/question-library/summary',
    method: 'GET',
    params: { code, examType },
  })
}

/** 批量获取叶子知识点各自题量和跨知识点去重后的已发布题目总数。 */
export function getKnowledgePointQuestionCounts(codes: string[], examType = DEFAULT_EXAM_TYPE) {
  return callApi<KnowledgePointQuestionCounts>({
    url: '/question-library/knowledge-point-counts',
    method: 'GET',
    params: { codes: codes.join(','), examType },
  })
}

/** 为一次练习限量选择题目，正确答案不会在此接口下发。 */
export function getQuestionsData(filters: {
  code?: string
  difficulty?: string
  examType?: string
}) {
  return callApi<{ questions: AttemptQuestion[]; total: number; selectionToken: string | null }>({
    url: '/question-library/selection',
    method: 'GET',
    params: {
      code: filters.code,
      difficulty: filters.difficulty,
      examType: filters.examType,
    },
  })
}

/** 后台按上传文件批次分页读取试题库入口列表。 */
export function getQuestionBankImportBatchList(params: {
  page: number
  pageSize: number
  keyword?: string
  examType?: string
  status?: string
}) {
  return callApi<{ list: QuestionBankImportBatch[]; pagination: PaginationResult }>({
    url: '/question-library/admin/batches',
    method: 'GET',
    params: {
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
      keyword: params.keyword,
      examType: params.examType,
      status: params.status,
    },
  })
}

/** 后台读取一个上传包的元数据和包内题目状态汇总。 */
export function getQuestionBankImportBatchDetail(id: string) {
  return callApi<QuestionBankImportBatch>({
    url: `/question-library/admin/batches/${id}`,
    method: 'GET',
  })
}

/** 修改后台试题包名称，不改变包内题目及其发布状态。 */
export function updateQuestionBankImportBatchTitle(id: string, title: string) {
  return callApi<{ id: string; title: string }>({
    url: `/question-library/admin/batches/${id}/title`,
    method: 'PUT',
    body: { title },
  })
}

/** 后台一次读取上传包内全部完整题目，用于逐题解析查看。 */
export function getQuestionBankImportBatchReview(id: string) {
  return callApi<{ questions: QuestionBankAdminDetail[] }>({
    url: `/question-library/admin/batches/${id}/review`,
    method: 'GET',
  })
}

/** 后台将上传包内全部题目统一上线或归档。 */
export function updateQuestionBankImportBatchStatus(
  id: string,
  status: Extract<QuestionBankStatus, 'published' | 'archived'>,
) {
  return callApi<{
    id: string
    status: QuestionBankStatus
    questionCount: number
    updatedQuestions: number
    replacementCount: number
    archivedQuestionCount: number
    updatedDraftMockPaperCount: number
    versionedMockPapers: Array<{
      previousSetId: string
      currentSetId: string
      sequenceNo: number
      previousVersion: number
      currentVersion: number
      code: string
    }>
  }>({
    url: `/question-library/admin/batches/${id}/status`,
    method: 'PUT',
    body: { status },
  })
}

/** 删除没有任何答题或错题历史的上传包及包内题目。 */
export function deleteQuestionBankImportBatch(id: string) {
  return callApi<{ id: string; deletedQuestions: number }>({
    url: `/question-library/admin/batches/${id}`,
    method: 'DELETE',
  })
}

/** 上传严格 JSON 或 JSON-in-Markdown 内容并按 standard2 整批导入。 */
export function importQuestionBankDocument(content: string, fileName: string) {
  return callApi<{
    batchId: string
    title: string
    fileName: string | null
    questionCount: number
    replacementCount: number
    status: QuestionBankStatus
  }>({
    url: '/question-library/admin/import',
    method: 'POST',
    body: { content, fileName },
  })
}

/** 后台更新单题发布状态。 */
export function updateQuestionBankStatus(id: string, status: QuestionBankStatus) {
  return callApi<{ id: string; status: QuestionBankStatus }>({
    url: `/question-library/admin/questions/${id}/status`,
    method: 'PUT',
    body: { status },
  })
}

/** 删除尚无答题记录的独立题目。 */
export function deleteQuestionBankQuestion(id: string) {
  return callApi<{ id: string }>({
    url: `/question-library/admin/questions/${id}`,
    method: 'DELETE',
  })
}
