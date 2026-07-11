/**
 * 考试 / 答卷 / 错题本 相关 API
 */
import { callApi } from '@/utils/request'
import type { Question } from '@/types'

// ---- 类型 ----

export interface SubmitParams {
  questions: any[]
  answers: Record<string, string>
  questionDurations?: Record<string, number>
  startedAt: string
  difficulty?: string
  code?: string
  paperId?: string
  examType?: string
  debugRetake?: boolean
}

export interface ExamProgress {
  id: string
  paperId: string
  examType?: string
  totalQuestions: number
  startedAt: string
  status: string
  answers: Record<string, string>
  questionDurations: Record<string, number>
  durationSeconds: number
}

export interface SaveProgressResult {
  examRecordId: string
  status: string
}

export interface SubmitResult {
  examRecordId: string
  totalQuestions: number
  correctCount: number
  wrongCount: number
}

export interface ExamQuestion extends Question {
  questionId?: string
  selectedAnswer?: string | null
  isCorrect?: boolean
  durationSeconds?: number
}

export interface ModuleScore {
  module: string
  moduleLabel: string
  rawScore: number
  totalQuestions: number
  scaledScore: number
  band: string
  bandLabel: string
  approximatePercentile: number
}

export interface ScoringResult {
  examType: string
  strategy: string
  overallScore: number
  overallBand: string
  overallBandLabel: string
  modules: ModuleScore[]
  generatedAt: string
}

export interface ExamResult {
  examRecord: {
    id: string
    examType: string
    totalQuestions: number
    correctCount: number
    startedAt: string
    submittedAt: string
    status: string
    paper?: {
      id: string
      title: string
      paperType: string
      year?: number
      duration?: number
      code?: string | null
    } | null
  }
  questions: ExamQuestion[]
  scoring?: ScoringResult
}

export interface DiagnosticPositioning {
  percentileValue: number | null
  percentileLabel: string
  performanceLevel: string
  competitiveness: string
  analysisSource?: 'deepseek' | 'fallback'
  cohortReference: string
  limitedData: boolean
}

export interface DiagnosticAssessmentModule {
  id: string
  label: string
  correct: number
  total: number
  score: number | null
  scoreRange: [number, number] | null
  scaleLabel: string
  summary: string
  positioning: DiagnosticPositioning | null
  difficultyMastery: DiagnosticDifficultyMastery[]
  scoringBasis?: 'standard' | 'normalized'
  equivalentRawScore?: number | null
  notice?: string | null
  riskSignal?: string | null
  diagnosticAnalysis?: {
    summary: string
    strength: string
    keyIssue: string
    focusSuggestion: string
    source: 'deepseek' | 'fallback'
  }
}

export interface DiagnosticDifficultyMastery {
  level: 'low' | 'medium' | 'high'
  label: string
  correct: number
  total: number
  accuracy: number | null
}

export interface DiagnosticReportOverview {
  totalQuestions: number
  correct: number
  wrong: number
  unanswered: number
  accuracy: number | null
  timing: {
    totalDurationSeconds: number | null
    plannedDurationSeconds: number | null
    detailedTimingReliable: boolean
    averageDurationSeconds: number | null
    overtimeQuestionCount: number | null
    modules: Array<{
      id: string
      label: string
      actualDurationSeconds: number
      plannedDurationSeconds: number
    }>
  }
}

export interface DiagnosticKnowledgeMastery {
  modules: Array<{
    id: string
    label: string
    knowledgePointCount: number
    correct: number
    total: number
    accuracy: number | null
    topics: Array<{
      code: string
      label: string
      knowledgePointCount: number
      correct: number
      total: number
      accuracy: number | null
      children: Array<{
        code: string
        label: string
        correct: number
        total: number
        accuracy: number | null
      }>
    }>
  }>
}

export interface DiagnosticAiImprovementPlan {
  matrix: Array<{
    code: string
    label: string
    moduleId: string
    moduleLabel: string
    cells: Array<{
      difficulty: 'low' | 'medium' | 'high'
      label: string
      correct: number
      total: number
      accuracy: number | null
      status: 'strong' | 'medium' | 'weak' | 'insufficient'
    }>
  }>
  highRoiGaps: Array<{
    rank: number
    topicCode: string
    topicLabel: string
    moduleId: string
    moduleLabel: string
    difficulty: 'low' | 'medium' | 'high'
    difficultyLabel: string
    correct: number
    total: number
    accuracy: number
    priorityReason: string
    suggestedHours: string
    prerequisiteCheck: string
    analysisSource: 'deepseek' | 'fallback'
  }>
  analysisStatus: 'generated' | 'fallback' | 'not-needed'
}

export interface DiagnosticLearningPath {
  profile: {
    subjects: string[]
    targetUniversities: string[]
    targetMajor: string | null
    targetScore: number | null
    examDate: string | null
    weeklyHours: number | null
    missingFields: string[]
  }
  summary: {
    planningWeeks: number
    weeklyHours: number
    totalHours: number
    mode: 'Standard' | 'Intensive' | 'Extended'
    modeReason: string
    dataSourceNote: string
    analysisSource: 'deepseek' | 'fallback'
  }
  phases: Array<{
    id: 'foundation' | 'improvement' | 'sprint'
    title: string
    durationWeeks: number
    weekLabel: string
    goal: string
    strategy: string
    focusTags: string[]
    tasks: Array<{
      period: string
      title: string
      completionLabel: string
    }>
    activities: string[]
  }>
}

export interface DiagnosticReportSummary {
  reportKind: 'esat' | 'tmua' | 'step'
  header: {
    title: string
    examType: string
    year: number
    modules: Array<{ id: string; label: string }>
  }
  assessment: {
    score: number | null
    scoreRange: [number, number] | null
    scaleLabel: string
    basedOnQuestions: number
    methodNote: string
    referenceVersion: string
    positioning: DiagnosticPositioning | null
    modules: DiagnosticAssessmentModule[]
    difficultyMastery: DiagnosticDifficultyMastery[]
    riskSignal: string | null
    riskStatus: 'generated' | 'unavailable'
  }
  overview?: DiagnosticReportOverview
  knowledgeMastery?: DiagnosticKnowledgeMastery
  aiImprovementPlan?: DiagnosticAiImprovementPlan
  learningPath?: DiagnosticLearningPath
}

export interface WrongAnswer {
  id: string
  questionId: string
  title: string
  difficulty: string
  knowledge_points: { code: string; label: string; role?: string }[]
  selectedAnswer: string | null
  selectedAnswers: string[]
  wrongCount: number
  isCorrect: boolean
  durationSeconds: number
  answeredAt: string | null
  examRecord?: {
    id: string
    submittedAt: string
    paper?: {
      paperType: string
      title: string
    } | null
  }
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
}

export interface PageResult<T> {
  list: T[]
  pagination: PaginationMeta
}

export interface MistakeNotebookParams {
  page?: number
  pageSize?: number
  difficulties?: string[]
  paperTypes?: string[]
  syllabusCodes?: string[]
  startDate?: string
  endDate?: string
}

export interface PracticeRecord {
  id: string
  examType?: string
  totalQuestions: number
  correctCount: number
  startedAt: string
  submittedAt: string | null
  durationSeconds: number | null
}

export interface ProfileExamStats {
  estimatedScore: number | null
  answeredQuestionCount: number
  diagnosticExamCount: number
}

// ---- API ----

/** 保存诊断测试答题进度 */
export function saveExamProgress(params: SubmitParams) {
  return callApi<SaveProgressResult>({
    url: '/exams/progress',
    method: 'POST',
    isAllData: false,
    body: params,
  })
}

/** 获取诊断测试答题进度 */
export function getExamProgressData(paperId: string) {
  return callApi<ExamProgress | null>({
    url: `/exams/progress/${paperId}`,
    method: 'GET',
    isAllData: false,
  })
}

/** 交卷 */
export function submitExam(params: SubmitParams) {
  return callApi<SubmitResult>({
    url: '/exams/submit',
    method: 'POST',
    isAllData: false,
    body: params,
  })
}

/** 获取答卷详情 */
export function getExamResultData(examId: string) {
  return callApi<ExamResult>({
    url: `/exams/${examId}/result`,
    method: 'GET',
    isAllData: false,
  })
}

/** 获取新版诊断报告头、等效评估分与总体成绩概览 */
export function getDiagnosticReportSummary(examId: string) {
  return callApi<{ report: DiagnosticReportSummary }>({
    url: `/exams/${examId}/diagnostic-report/summary`,
    method: 'GET',
    isAllData: false,
  })
}

/** 获取错题本 */
export function getMistakeNotebookData(params: MistakeNotebookParams = {}) {
  return callApi<PageResult<WrongAnswer>>({
    url: '/exams/error-book',
    method: 'GET',
    isAllData: false,
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
      ...(params.difficulties?.length ? { difficulty: params.difficulties.join(',') } : {}),
      ...(params.paperTypes?.length ? { paperType: params.paperTypes.join(',') } : {}),
      ...(params.syllabusCodes?.length ? { syllabusCode: params.syllabusCodes.join(',') } : {}),
      ...(params.startDate ? { startDate: params.startDate } : {}),
      ...(params.endDate ? { endDate: params.endDate } : {}),
    },
  })
}

/** 获取试题库练习记录 */
export function getPracticeRecords() {
  return callApi<{ records: PracticeRecord[] }>({
    url: '/exams/practice-records',
    method: 'GET',
    isAllData: false,
  })
}

/** 获取个人中心考试统计 */
export function getProfileExamStats() {
  return callApi<{ stats: Record<string, ProfileExamStats> }>({
    url: '/exams/profile-stats',
    method: 'GET',
    isAllData: false,
  })
}
