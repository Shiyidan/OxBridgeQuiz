/**
 * 试卷 相关 API
 */
import { callApi } from '@/utils/request'
import type { PaperAccessTier, PaperDeliveryMode, Question } from '@/types'

export interface PaperModuleOutline {
  code: string
  subject: string
  subjectCode: string | null
  order: number
  durationSeconds: number
  questionCount: number
}

export interface PaperItem {
  id: string
  title: string
  code: string | null
  year: number
  duration: number
  totalQuestions: number
  examType?: string
  paperType?: string
  accessTier: PaperAccessTier
  deliveryMode?: PaperDeliveryMode
  breakDurationSeconds?: number
  modules?: PaperModuleOutline[]
  assemblyType?: string
  remarks?: string | null
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
  questions: Question[]
}

/** 试卷列表 */
export function getPaperListData(params: PaperListParams = {}) {
  return callApi<PaperListResult>({
    url: '/papers',
    method: 'GET',
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
  })
}

/** 更新试卷状态 */
export function updatePaperStatus(id: string, status: string) {
  return callApi<PaperItem>({
    url: `/papers/${id}`,
    method: 'PUT',
    body: { status },
  })
}

/** 更新试卷类型 */
export function updatePaperType(id: string, paperType: string) {
  return callApi<PaperItem>({
    url: `/papers/${id}`,
    method: 'PUT',
    body: { paperType },
  })
}

/** 更新诊断卷的免费或会员访问级别。 */
export function updatePaperAccessTier(id: string, accessTier: PaperAccessTier) {
  return callApi<PaperItem>({
    url: `/papers/${id}`,
    method: 'PUT',
    body: { accessTier },
  })
}

export interface DeletePaperResult {
  id: string
  deletedQuestions: number
  deletedParseTasks: number
}

/** 删除未产生诊断历史的试卷及其直属题目数据。 */
export function deletePaper(id: string) {
  return callApi<DeletePaperResult>({
    url: `/papers/${id}`,
    method: 'DELETE',
  })
}

export interface AssessmentPaperItem {
  id: string
  paperId: string
  paperName: string
  title: string
  code: string | null
  year: number
  duration: number
  totalQuestions: number
  examType?: string
  paperType: string
  accessTier: PaperAccessTier
  deliveryMode: PaperDeliveryMode
  breakDurationSeconds: number
  modules: PaperModuleOutline[]
  assemblyType: string
  remarks: string | null
  publicationStatus: 'draft' | 'published' | string
  testStatus: 'not_started' | 'in_progress' | 'completed'
  examRecordId: string | null
  answeredCount: number
  correctCount: number | null
  startedAt: string | null
  expiresAt: string | null
  phase: string | null
  currentModuleIndex: number | null
  phaseExpiresAt: string | null
  submittedAt: string | null
  durationSeconds: number | null
  completedAttemptCount: number
  reportStatus: 'not_generated' | 'pending' | 'analyzing' | 'completed' | 'failed' | null
  reportStage: string | null
  reportProgress: number
  reportErrorMessage: string | null
  hasReport: boolean
  reportExamRecordId: string | null
  generationMode: 'full_ai' | 'mixed_fallback' | 'rules_only' | null
  reportCompletedAt: string | null
}

export interface AssessmentPaperResult {
  list: AssessmentPaperItem[]
}

export interface AssessmentYearSummary {
  year: number
  paperCount: number
  totalQuestions: number
  completedPaperCount: number
  inProgressPaperCount: number
  completedAttemptCount: number
  freePaperCount: number
  memberPaperCount: number
}

export interface AssessmentYearResult {
  list: AssessmentYearSummary[]
}

export interface AssessmentPaperHistoryItem {
  examRecordId: string
  paperId?: string
  paperTitle?: string
  modules?: PaperModuleOutline[]
  attemptNumber: number
  totalQuestions: number
  correctCount: number
  startedAt: string
  submittedAt: string
  durationSeconds: number
  reportStatus: 'not_generated' | 'pending' | 'analyzing' | 'completed' | 'failed'
  reportStage: string | null
  reportProgress: number
  reportErrorMessage: string | null
  reportKind: 'esat' | 'tmua' | 'step'
  hasReport: boolean
  reportCompletedAt: string | null
  generationMode: 'full_ai' | 'mixed_fallback' | 'rules_only' | null
}

export interface AssessmentPaperHistoryResult {
  paper: {
    id: string
    title: string
    examType: string
    year: number
  }
  list: AssessmentPaperHistoryItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasPrev: boolean
    hasNext: boolean
  }
}

export interface AssessmentYearHistoryResult {
  year: number
  examType: string
  list: AssessmentPaperHistoryItem[]
  pagination: AssessmentPaperHistoryResult['pagination']
}

export interface AssessmentScoreTrendScore {
  key: string
  label: string
  score: number
}

export interface AssessmentScoreTrendPoint {
  date: string
  submittedAt: string
  examRecordId: string
  paperTitle: string
  scores: AssessmentScoreTrendScore[]
}

export interface AssessmentScoreTrendResult {
  examType: string
  points: AssessmentScoreTrendPoint[]
}

/** 获取当前考试类型下可见诊断卷的年份聚合及用户完成状态。 */
export function getAssessmentYearsData(examType: string) {
  return callApi<AssessmentYearResult>({
    url: '/papers/assessment/years',
    method: 'GET',
    params: { examType },
  })
}

/** 获取当前考试类型及可选年份下按试卷聚合的诊断测试列表及用户状态。 */
export function getAssessmentPapersData(examType: string, year?: number) {
  return callApi<AssessmentPaperResult>({
    url: '/papers/assessment/papers',
    method: 'GET',
    params: { examType, ...(year ? { year: String(year) } : {}) },
  })
}

/** 获取当前考试类型下按北京时间自然日聚合的最新诊断分数。 */
export function getAssessmentScoreTrend(examType: string) {
  return callApi<AssessmentScoreTrendResult>({
    url: '/papers/assessment/score-trend',
    method: 'GET',
    params: { examType },
  })
}

/** 分页获取同一诊断试卷的历次已交卷记录及各自报告状态。 */
export function getAssessmentPaperHistory(paperId: string, page = 1, pageSize = 10) {
  return callApi<AssessmentPaperHistoryResult>({
    url: `/papers/assessment/papers/${paperId}/history`,
    method: 'GET',
    params: {
      page: String(page),
      pageSize: String(pageSize),
    },
  })
}

/** 分页获取某一考试年份下跨组合卷汇总的已交卷诊断记录。 */
export function getAssessmentYearHistory(examType: string, year: number, page = 1, pageSize = 10) {
  return callApi<AssessmentYearHistoryResult>({
    url: `/papers/assessment/years/${year}/history`,
    method: 'GET',
    params: {
      examType,
      page: String(page),
      pageSize: String(pageSize),
    },
  })
}
