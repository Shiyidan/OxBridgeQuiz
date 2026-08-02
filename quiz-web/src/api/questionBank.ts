// 试题库 API：覆盖考纲与练习选题、standard2 导入及单题审核。
import { callApi } from '@/utils/request'
import { DEFAULT_EXAM_TYPE } from '@/constants/examTypes'
import type { AttemptQuestion, KnowledgePoint, Question } from '@/types'

export interface SyllabusNode {
  code: string
  label: string
  children?: SyllabusNode[]
}

export interface DifficultyCount {
  easy: number
  medium: number
  hard: number
  composite: number
}

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
  difficulty: string
  qualityTier: QuestionBankQualityTier | null
  subject: string | null
  subjectCode: string | null
  topic: string | null
  topicCode: string | null
  knowledgePoints: KnowledgePoint[]
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

/** 后台按单题分页获取试题库内容。 */
export function getQuestionBankAdminList(params: {
  page: number
  pageSize: number
  keyword?: string
  examType?: string
  difficulty?: string
  status?: string
}) {
  return callApi<{ list: QuestionBankAdminItem[]; pagination: PaginationResult }>({
    url: '/question-library/admin/questions',
    method: 'GET',
    params: {
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
      keyword: params.keyword,
      examType: params.examType,
      difficulty: params.difficulty,
      status: params.status,
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

/** 后台分页读取指定上传包内的独立题目。 */
export function getQuestionBankImportBatchQuestions(
  id: string,
  params: {
    page: number
    pageSize: number
    keyword?: string
    examType?: string
    difficulty?: string
    status?: string
  },
) {
  return callApi<{ list: QuestionBankAdminItem[]; pagination: PaginationResult }>({
    url: `/question-library/admin/batches/${id}/questions`,
    method: 'GET',
    params: {
      page: params.page.toString(),
      pageSize: params.pageSize.toString(),
      keyword: params.keyword,
      examType: params.examType,
      difficulty: params.difficulty,
      status: params.status,
    },
  })
}

/** 后台读取单题完整内容供审核。 */
export function getQuestionBankAdminDetail(id: string) {
  return callApi<QuestionBankAdminDetail>({
    url: `/question-library/admin/questions/${id}`,
    method: 'GET',
  })
}

/** 上传严格 JSON 或 JSON-in-Markdown 内容并按 standard2 整批导入。 */
export function importQuestionBankDocument(content: string, fileName: string) {
  return callApi<{
    batchId: string
    title: string
    fileName: string | null
    questionCount: number
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
