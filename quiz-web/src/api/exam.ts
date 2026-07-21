/**
 * 考试 / 答卷 / 错题本 相关 API
 */
import { callApi } from '@/utils/request'
import type { AttemptQuestion, Question } from '@/types'

// ---- 类型 ----

export type AnswerState = 'unseen' | 'skipped' | 'answered'

export interface ExamResponseInput {
  questionId: string
  selectedAnswer: string | null
  durationSeconds: number
  answerState: AnswerState
}

export interface StartExamParams {
  paperId?: string
  examType: string
  questionIds?: string[]
  startedAt?: string
}

export interface SubmitParams {
  responses: ExamResponseInput[]
  startedAt?: string
  submissionKey?: string
}

export type ExamPhase = 'continuous' | 'answering' | 'break' | 'ready_to_submit' | 'submitted'

export interface ExamModuleState {
  code: string
  label: string
  subjectCode: string | null
  order: number
  durationSeconds: number
  totalQuestions: number
  status: 'pending' | 'in_progress' | 'completed'
}

export interface ActiveExamModule extends ExamModuleState {
  startedAt: string
  expiresAt: string
  questions: AttemptQuestion[]
}

export interface ExamBreakState {
  afterModuleCode: string
  nextModuleCode: string
  nextModuleLabel: string
  startedAt: string
  endsAt: string
  durationSeconds: number
  canSkip: true
}

export interface ExamProgress {
  id: string
  paperId: string
  examType?: string
  totalQuestions: number
  startedAt: string
  expiresAt: string | null
  status: string
  answers: Record<string, string>
  questionDurations: Record<string, number>
  answerStates: Record<string, AnswerState>
  durationSeconds: number
  isResumed?: boolean
  isExpired?: boolean
  deliveryMode?: 'continuous' | 'module_sequence'
  phase?: ExamPhase
  serverNow?: string
  currentModuleIndex?: number
  modules?: ExamModuleState[]
  currentModule?: ActiveExamModule | null
  break?: ExamBreakState | null
  questions?: AttemptQuestion[]
  activeDurationSeconds?: number
}

export interface StartExamResult extends Omit<ExamProgress, 'id'> {
  examRecordId: string
}

export interface SaveProgressResult {
  examRecordId: string
  status: string
  savedQuestionIds: string[]
}

export interface SubmitResult {
  examRecordId: string
  totalQuestions: number
  correctCount: number
  wrongCount: number
  durationSeconds: number
  reportStatus: string | null
}

export interface DiagnosticReportStatus {
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  stage:
    | 'answers_saved'
    | 'fixed_calculating'
    | 'module_analyzing'
    | 'roi_analyzing'
    | 'path_analyzing'
    | 'report_saving'
    | 'completed'
  progress: number
  message: string
  reportKind: 'esat' | 'tmua' | 'step'
  reportExamRecordId: string | null
  previousReportExamRecordId: string | null
  hasPreviousReport: boolean
  errorMessage: string | null
  generationMode: 'full_ai' | 'mixed_fallback' | 'rules_only' | null
}

export interface DiagnosticReportMeta {
  reportExamRecordId: string
  requestedExamRecordId: string
  isPreviousReport: boolean
  warning: string | null
  generationMode: 'full_ai' | 'mixed_fallback' | 'rules_only'
  completedAt: string
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
  overallScore: number | null
  overallBand: string | null
  overallBandLabel: string | null
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
    analysisLevel?: 'unavailable' | 'reference' | 'complete'
    pacingStatus?: 'unavailable' | 'within_limit' | 'incomplete' | 'overtime'
    attemptedQuestionCount?: number
    timedQuestionCount?: number
    timingCoverage?: number
    efficiencySampleCount?: number
    targetDurationSeconds?: number | null
    averageDurationSeconds: number | null
    overtimeQuestionCount: number | null
    quadrants?: Array<{
      id: 'fast_correct' | 'slow_correct' | 'fast_wrong' | 'slow_wrong'
      count: number
    }>
    modules: Array<{
      id: string
      label: string
      actualDurationSeconds: number
      plannedDurationSeconds: number
      totalQuestions?: number
      timedQuestionCount?: number
      correct?: number
      accuracy?: number | null
      timeEfficiencyIndex?: number | null
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

/** 进入答题页时创建或恢复考试记录，后续请求只使用返回的 ExamRecord ID。 */
export function startExam(params: StartExamParams) {
  return callApi<StartExamResult>({
    url: '/exams/start',
    method: 'POST',
    isAllData: false,
    body: params,
  })
}

/** 按考试记录保存逐题答案与耗时。 */
export function saveExamProgress(examId: string, responses: ExamResponseInput[]) {
  return callApi<SaveProgressResult>({
    url: `/exams/${examId}/progress`,
    method: 'PUT',
    isAllData: false,
    body: { responses },
  })
}

/** 恢复模块化诊断会话；题目范围和阶段均由服务端决定。 */
export function getModuleExamSession(examId: string) {
  return callApi<StartExamResult>({
    url: `/exams/${examId}/session`,
    method: 'GET',
    isAllData: false,
  })
}

/** 锁定当前科目答案，并进入休息或最终交卷阶段。 */
export function completeExamModule(examId: string, responses: ExamResponseInput[]) {
  return callApi<StartExamResult>({
    url: `/exams/${examId}/module/complete`,
    method: 'POST',
    isAllData: false,
    body: { responses },
  })
}

/** 跳过当前三分钟休息并立即开始下一科目。 */
export function skipExamBreak(examId: string) {
  return callApi<StartExamResult>({
    url: `/exams/${examId}/break/skip`,
    method: 'POST',
    isAllData: false,
    body: {},
  })
}

/** 按考试记录交卷，试卷、题目范围与考试类型由后端记录推导。 */
export function submitExam(examId: string, params: SubmitParams) {
  return callApi<SubmitResult>({
    url: `/exams/${examId}/submit`,
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
  return callApi<{ report: DiagnosticReportSummary; meta: DiagnosticReportMeta }>({
    url: `/exams/${examId}/diagnostic-report/summary`,
    method: 'GET',
    isAllData: false,
  })
}

/** 获取诊断报告后台生成状态，分析弹窗据此展示真实进度。 */
export function getDiagnosticReportStatus(examId: string) {
  return callApi<DiagnosticReportStatus>({
    url: `/exams/${examId}/diagnostic-report/status`,
    method: 'GET',
    isAllData: false,
  })
}

/** 重新执行失败的诊断分析，不重复提交答卷。 */
export function retryDiagnosticReport(examId: string) {
  return callApi<Pick<DiagnosticReportStatus, 'status' | 'stage' | 'progress'>>({
    url: `/exams/${examId}/diagnostic-report/retry`,
    method: 'POST',
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
