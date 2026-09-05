// 模考中心 API：定义公开目录、个人概览、答卷记录和开始/放弃操作的前端契约。
import { callApi } from '@/utils/request'
import type { PaperAccessTier } from '@/types'
import type { PaperModuleOutline, PaginationMeta } from '@/api/papers'

export type MockExamCatalogStatus = 'all' | 'not_started' | 'in_progress' | 'completed'
export type MockExamRecordStatus = 'in_progress' | 'completed'
export type MockExamModuleStatus = MockExamCatalogStatus | 'practiced'
export type MockExamRecordMode = 'all' | 'full' | 'single'

export interface MockExamAttemptBrief {
  examRecordId: string
  paperId: string
  startedAt: string
  updatedAt: string
  currentModuleLabel: string
  answeredCount: number
  totalQuestions: number
  remainingSeconds: number | null
}

export interface MockExamPaperItem {
  id: string
  code: string | null
  title: string
  examType: string
  accessTier: PaperAccessTier
  durationSeconds: number
  totalQuestions: number
  modules: PaperModuleOutline[]
  publicationStatus: 'published' | 'offline' | string
  version: number
  inProgressCount: number
  completedCount: number
  completedCurrentVersionCount: number
  hasContentUpdate: boolean
  bestScore: number | null
  latestCompletedExamRecordId: string | null
  inProgressAttempts: MockExamAttemptBrief[]
}

export interface MockExamCatalogResult {
  list: MockExamPaperItem[]
  pagination: PaginationMeta
}

export interface MockExamModuleItem {
  id: string
  mockPaperSetId: string
  code: string
  label: string
  title: string
  examType: string
  accessTier: PaperAccessTier
  durationSeconds: number
  totalQuestions: number
  publicationStatus: 'published' | 'offline' | string
  sourcePaperCode: string
  sourcePaperTitle: string
  fullExamReady: boolean
  inProgressCount: number
  completedCount: number
  bestScore: number | null
  latestCompletedExamRecordId: string | null
  practicedInFull: boolean
  inProgressAttempts: MockExamAttemptBrief[]
}

export interface MockExamModuleCatalogResult {
  list: MockExamModuleItem[]
  pagination: PaginationMeta
}

export interface MockExamTrendSeries {
  key: string
  label: string
  values: Array<number | null>
}

export interface MockExamOverviewResult {
  completedCount: number
  bestScore: number | null
  bestScoreModuleLabel: string | null
  targetScore: number | null
  maxScore: number
  labels: string[]
  series: MockExamTrendSeries[]
}

export interface MockExamRecordItem {
  examRecordId: string
  paperId: string
  paperTitle: string
  paperCode: string | null
  version: number
  mode: 'full' | 'single'
  moduleCode: string | null
  moduleLabel: string | null
  sourcePaperTitle: string
  sourcePaperCode: string | null
  status: MockExamRecordStatus
  startedAt: string
  updatedAt: string
  submittedAt: string | null
  currentModuleLabel: string | null
  answeredCount: number
  totalQuestions: number
  correctCount: number
  wrongCount: number
  accuracy: number | null
  durationSeconds: number
  remainingSeconds: number | null
  score: number | null
  moduleScores: Array<{
    code: string
    label: string
    correctCount: number
    totalQuestions: number
    score: number
  }>
  reportStatus: 'pending' | 'analyzing' | 'completed' | 'failed' | null
}

export interface MockExamRecordResult {
  list: MockExamRecordItem[]
  pagination: PaginationMeta
}

export interface MockExamCatalogParams {
  examType: string
  keyword?: string
  status?: MockExamCatalogStatus
  page?: number
  pageSize?: number
}

export interface MockExamRecordParams {
  examType: string
  status?: MockExamRecordStatus
  mode?: MockExamRecordMode
  page?: number
  pageSize?: number
}

export interface MockExamModuleCatalogParams {
  examType: string
  keyword?: string
  moduleCode?: string
  status?: MockExamModuleStatus
  page?: number
  pageSize?: number
}

export interface StartMockExamResult {
  examRecordId: string
  paperId: string
}

/** 游客可访问的固定模考卷目录；登录时响应附带当前用户答卷汇总。 */
export function getMockExamCatalogData(params: MockExamCatalogParams) {
  return callApi<MockExamCatalogResult>({
    url: '/mock-exams/catalog',
    method: 'GET',
    params: {
      examType: params.examType,
      keyword: params.keyword,
      status: params.status === 'all' ? undefined : params.status,
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 10),
    },
    silent: true,
  })
}

/** 游客可访问的单项模考目录；登录时附带单项答卷与整卷练习状态。 */
export function getMockExamModuleCatalogData(params: MockExamModuleCatalogParams) {
  return callApi<MockExamModuleCatalogResult>({
    url: '/mock-exams/modules',
    method: 'GET',
    params: {
      examType: params.examType,
      keyword: params.keyword,
      moduleCode: params.moduleCode,
      status: params.status === 'all' ? undefined : params.status,
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 10),
    },
    silent: true,
  })
}

/** 当前登录学生在指定模考类型下的完成次数、最佳成绩与近五次趋势。 */
export function getMockExamOverviewData(examType: string, mode: MockExamRecordMode = 'full') {
  return callApi<MockExamOverviewResult>({
    url: '/mock-exams/overview',
    method: 'GET',
    params: { examType, mode },
    silent: true,
  })
}

/** 当前登录学生的未完成或已完成模考记录。 */
export function getMockExamRecordsData(params: MockExamRecordParams) {
  return callApi<MockExamRecordResult>({
    url: '/mock-exams/records',
    method: 'GET',
    params: {
      examType: params.examType,
      status: params.status,
      mode: params.mode === 'all' ? undefined : params.mode,
      page: String(params.page || 1),
      pageSize: String(params.pageSize || 10),
    },
    silent: true,
  })
}

/** 确认考前规则后创建一场独立模考答卷。 */
export function startMockExam(paperId: string, startRequestId: string) {
  return callApi<StartMockExamResult>({
    url: `/mock-exams/papers/${paperId}/attempts`,
    method: 'POST',
    body: { startRequestId },
    silent: true,
  })
}

/** 确认考前规则后创建一场只包含目标 Module/Paper 的独立答卷。 */
export function startSingleMockExam(moduleId: string, startRequestId: string) {
  return callApi<StartMockExamResult>({
    url: `/mock-exams/modules/${moduleId}/attempts`,
    method: 'POST',
    body: { startRequestId },
    silent: true,
  })
}

/** 放弃一场未完成模考；服务端负责永久移除该场进度。 */
export function abandonMockExam(examRecordId: string) {
  return callApi<null>({
    url: `/mock-exams/attempts/${examRecordId}`,
    method: 'DELETE',
    silent: true,
  })
}
