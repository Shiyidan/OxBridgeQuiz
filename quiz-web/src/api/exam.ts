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
  examType?: string
  selectionToken?: string
  startedAt?: string
}

export interface StartExamRequestOptions {
  silent?: boolean
}

export interface SubmitParams {
  responses: ExamResponseInput[]
  startedAt?: string
  submissionKey?: string
}

export type ExamPhase =
  | 'continuous'
  | 'answering'
  | 'paused'
  | 'break'
  | 'break_paused'
  | 'ready_to_submit'
  | 'submitted'

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
  paperTitle?: string
  paperYear?: number
  examType?: string
  mockExamMode?: 'full' | 'single'
  practiceTitle?: string
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

export interface ActiveQuestionBankPractice {
  examRecordId: string
  examType: string
  totalQuestions: number
  answeredCount: number
  startedAt: string
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
  errorMessage: string | null
  generationMode: 'full_ai' | 'mixed_fallback' | 'rules_only' | null
}

export interface DiagnosticReportMeta {
  reportExamRecordId: string
  generationMode: 'full_ai' | 'mixed_fallback' | 'rules_only'
  reportVersion: string
  productVersion: 'v1' | 'v2'
  canUpgrade: boolean
  completedAt: string
  sourcePaperType: string
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
    durationSeconds: number
    startedAt: string
    submittedAt: string
    status: string
    practiceNotebookName?: string | null
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
    source: 'deepseek' | 'mixed' | 'fallback'
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
  weaknessProfile?: {
    examPolicy: 'ESAT_VARIABLE_MODULES' | 'TMUA_STANDARD_EQUAL' | 'GENERIC_DYNAMIC'
    diagnosisMode?: 'weakness_attack' | 'balanced_improvement' | 'stable_progress'
    primaryModule: {
      moduleId: string
      moduleLabel: string
      level: 'clear' | 'relative'
      confidence: 'high' | 'medium' | 'low'
      correct: number
      total: number
      accuracy: number
      rank: number
      gapToNext: number | null
    } | null
    moduleSignals: Array<{
      moduleId: string
      moduleLabel: string
      level: 'clear' | 'relative'
      confidence: 'high' | 'medium' | 'low'
      correct: number
      total: number
      accuracy: number
      rank: number
      gapToNext: number | null
    }>
    difficultySignals: Array<{
      moduleId: string
      moduleLabel: string
      difficulty: 'low' | 'medium' | 'high'
      difficultyLabel: string
      level: 'clear' | 'relative'
      confidence: 'high' | 'medium' | 'low'
      correct: number
      total: number
      accuracy: number
      wrongCount: number
    }>
    topicSignals: Array<{
      moduleId: string
      moduleLabel: string
      topicCode: string
      topicLabel: string
      level: 'clear'
      confidence: 'high' | 'medium'
      correct: number
      total: number
      accuracy: number
      wrongCount: number
      wrongShareInModule: number
      primaryDifficulty: 'low' | 'medium' | 'high'
      primaryDifficultyLabel: string
    }>
    calibrationSignals: Array<{
      moduleId: string
      moduleLabel: string
      topicCode: string
      topicLabel: string
      level: 'calibration'
      confidence: 'low'
      correct: number
      total: number
      accuracy: number
      wrongCount: number
      wrongShareInModule: number
      primaryDifficulty: 'low' | 'medium' | 'high'
      primaryDifficultyLabel: string
    }>
    sequenceSignals?: Array<{
      kind: 'late_section_drop'
      moduleId: string
      moduleLabel: string
      level: 'clear'
      confidence: 'high' | 'medium' | 'low'
      splitAfter: number
      earlyCorrect: number
      earlyTotal: number
      earlyAccuracy: number
      lateCorrect: number
      lateTotal: number
      lateAccuracy: number
      accuracyGap: number
      lateQuestionNumbers: number[]
    }>
  }
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
    confidence?: 'high' | 'medium'
    evidenceScope?: 'topic'
    priorityReason: string
    suggestedHours: string
    prerequisiteCheck: string
    examFocus?: string[]
    questionNumbers?: number[]
    reviewGuidance?: string[]
    possibleErrorPatterns?: string[]
    analysisSource: 'deepseek' | 'fallback'
  }>
  analysisStatus: 'generated' | 'fallback' | 'not-needed'
}

export interface DiagnosticLearningPath {
  profile: {
    subjects: string[]
    targetUniversities: string[]
    targetMajor: string | null
    examDate: string | null
    weeklyHours: number | null
    missingFields: string[]
    declaredSubjects?: string[]
    subjectMismatch?: boolean
  }
  summary: {
    planningWeeks: number
    weeklyHours: number
    totalHours: number
    mode: 'Starter' | 'Standard' | 'Intensive' | 'Extended'
    modeReason: string
    dataSourceNote: string
    analysisSource: 'deepseek' | 'mixed' | 'fallback'
    planningScope?: 'starter' | 'full'
  }
  starterPlan?: DiagnosticStarterPlan | null
  phases: Array<{
    id: 'foundation' | 'improvement' | 'sprint'
    title: string
    durationWeeks: number
    weekLabel: string
    goal: string
    strategy: string
    checkpoint?: string
    focusTags: string[]
    tasks: Array<{
      period: string
      title: string
      completionLabel: string
    }>
    activities: string[]
  }>
}

export type DiagnosticStarterPlanDayRole =
  | 'evidence_audit'
  | 'method_rebuild'
  | 'retrieval_practice'
  | 'secondary_transfer'
  | 'third_or_deepen'
  | 'interleaved_timed'
  | 'weekly_retest'

export interface DiagnosticStarterPlanDay {
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7
  role: DiagnosticStarterPlanDayRole
  title: string
  focus: Array<{
    gapKey: string
    moduleLabel: string
    topicCode: string
    topicLabel: string
    difficultyLabel: string
  }>
  durationMinutes: number
  diagnosticRationale: string
  steps: Array<{ action: string; output: string }>
  deliverable: string
  successCriteria: string
  ifNotMet: string
  evidenceRefs: string[]
}

export interface DiagnosticStarterPlan {
  version: 'starter-plan-v2'
  weeklyBudgetMinutes: number
  totalPlannedMinutes: number
  budgetSource: 'profile' | 'default'
  analysisSource: 'deepseek' | 'mixed' | 'fallback'
  evidenceBoundary: string
  days: DiagnosticStarterPlanDay[]
}

export interface DiagnosticNextAction {
  actionType: 'targeted_practice' | 'calibration_test' | 'review_wrong' | 'mixed_timed_practice'
  title: string
  moduleId: string
  moduleLabel: string
  topicCode: string
  topicLabel: string
  knowledgePointCodes?: string[]
  difficulty: 'low' | 'medium' | 'high'
  difficultyLabel: string
  evidence: {
    correct: number
    total: number
    accuracy: number | null
    confidence: 'high' | 'medium' | 'low'
    questionNumbers: number[]
  }
  whyNow: string
  suggestedMinutes: number
  suggestedQuestionCount: number
  successCriteria: string
  reviewGuidance: string[]
  possibleErrorPatterns: string[]
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
  nextAction?: DiagnosticNextAction | null
}

export interface WrongAnswer {
  id: string
  questionId: string
  examType: string
  title: string
  difficulty: string
  subject: string
  subjectCode: string
  knowledge_points: { code: string; label: string; role?: string }[]
  selectedAnswer: string | null
  selectedAnswers: string[]
  wrongCount: number
  isCorrect: boolean
  durationSeconds: number
  answeredAt: string | null
  examRecord?: {
    id: string
    examType: string
    submittedAt: string
    paper?: {
      paperType: string
      title: string
    } | null
  }
}

export type MistakeAttemptSourceType =
  | 'diagnostic'
  | 'question-bank'
  | 'mock-exam'
  | 'unknown'

export type MistakeAttemptAnswerState = 'answered' | 'skipped' | 'unseen'

export interface MistakeAttemptHistoryItem {
  id: string
  examRecordId: string
  submittedAt: string
  answeredAt: string | null
  selectedAnswer: string | null
  answerState: MistakeAttemptAnswerState
  durationSeconds: number
  sourceType: MistakeAttemptSourceType
  sourceLabel: string
  sourceTitle: string
}

export interface MistakeAttemptHistoryResult {
  questionId: string
  total: number
  list: MistakeAttemptHistoryItem[]
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
  dateBounds?: {
    min: string | null
    max: string | null
  }
}

export type MistakeNotebookDifficulty = 'easy' | 'medium' | 'hard'

export interface MistakeNotebookParams {
  page?: number
  pageSize?: number
  examType?: string
  difficulties?: MistakeNotebookDifficulty[]
  paperTypes?: string[]
  subjectCodes?: string[]
  syllabusCodes?: string[]
  startDate?: string
  endDate?: string
  keyword?: string
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
export function startExam(params: StartExamParams, options: StartExamRequestOptions = {}) {
  return callApi<StartExamResult>({
    url: '/exams/start',
    method: 'POST',
    body: params,
    silent: options.silent,
  })
}

/** 查询指定考试类型唯一的进行中题库练习。 */
export function getActiveQuestionBankPractice(examType: string) {
  return callApi<ActiveQuestionBankPractice | null>({
    url: '/exams/active-practice',
    method: 'GET',
    params: { examType },
  })
}

/** 按考试记录保存逐题答案与耗时。 */
export function saveExamProgress(examId: string, responses: ExamResponseInput[]) {
  return callApi<SaveProgressResult>({
    url: `/exams/${examId}/progress`,
    method: 'PUT',
    body: { responses },
  })
}

/** 恢复模块化诊断会话；题目范围和阶段均由服务端决定。 */
export function getModuleExamSession(examId: string) {
  return callApi<StartExamResult>({
    url: `/exams/${examId}/session`,
    method: 'GET',
  })
}

/** 按 ExamRecord 恢复普通题库练习或连续考试的冻结题目与进度。 */
export function getExamSession(examId: string) {
  return callApi<StartExamResult>({
    url: `/exams/${examId}/session`,
    method: 'GET',
  })
}

/** 离开答题页时保存当前模块快照，并由服务端冻结剩余时间。 */
export function pauseExamModule(
  examId: string,
  moduleCode: string,
  responses: ExamResponseInput[],
) {
  return callApi<StartExamResult>({
    url: `/exams/${examId}/pause`,
    method: 'POST',
    body: { moduleCode, responses },
  })
}

/** 锁定当前考试分段答案，并进入休息、下一分段或最终交卷阶段。 */
export function completeExamModule(examId: string, responses: ExamResponseInput[]) {
  return callApi<StartExamResult>({
    url: `/exams/${examId}/module/complete`,
    method: 'POST',
    body: { responses },
  })
}

/** 跳过当前三分钟休息并立即开始下一科目。 */
export function skipExamBreak(examId: string) {
  return callApi<StartExamResult>({
    url: `/exams/${examId}/break/skip`,
    method: 'POST',
    body: {},
  })
}

/** 按考试记录交卷，试卷、题目范围与考试类型由后端记录推导。 */
export function submitExam(examId: string, params: SubmitParams) {
  return callApi<SubmitResult>({
    url: `/exams/${examId}/submit`,
    method: 'POST',
    body: params,
  })
}

/** 获取答卷详情 */
export function getExamResultData(examId: string) {
  return callApi<ExamResult>({
    url: `/exams/${examId}/result`,
    method: 'GET',
  })
}

/** 获取新版诊断报告头、等效评估分与总体成绩概览 */
export function getDiagnosticReportSummary(examId: string) {
  return callApi<{ report: DiagnosticReportSummary; meta: DiagnosticReportMeta }>({
    url: `/exams/${examId}/diagnostic-report/summary`,
    method: 'GET',
  })
}

/** 获取诊断报告后台生成状态，分析弹窗据此展示真实进度。 */
export function getDiagnosticReportStatus(examId: string) {
  return callApi<DiagnosticReportStatus>({
    url: `/exams/${examId}/diagnostic-report/status`,
    method: 'GET',
  })
}

/** 重新执行失败的诊断分析，不重复提交答卷。 */
export function retryDiagnosticReport(examId: string) {
  return callApi<Pick<DiagnosticReportStatus, 'status' | 'stage' | 'progress'>>({
    url: `/exams/${examId}/diagnostic-report/retry`,
    method: 'POST',
  })
}

/** 按当前报告版本重新分析已提交答卷，成功前保留旧报告快照。 */
export function regenerateDiagnosticReport(examId: string) {
  return callApi<Pick<DiagnosticReportStatus, 'status' | 'stage' | 'progress'>>({
    url: `/exams/${examId}/diagnostic-report/regenerate`,
    method: 'POST',
  })
}

/** 获取错题本 */
export function getMistakeNotebookData(params: MistakeNotebookParams = {}) {
  return callApi<PageResult<WrongAnswer>>({
    url: '/exams/error-book',
    method: 'GET',
    params: {
      ...(params.page ? { page: String(params.page) } : {}),
      ...(params.pageSize ? { pageSize: String(params.pageSize) } : {}),
      ...(params.examType ? { examType: params.examType } : {}),
      ...(params.difficulties?.length ? { difficulty: params.difficulties.join(',') } : {}),
      ...(params.paperTypes?.length ? { paperType: params.paperTypes.join(',') } : {}),
      ...(params.subjectCodes?.length ? { subjectCode: params.subjectCodes.join(',') } : {}),
      ...(params.syllabusCodes?.length ? { syllabusCode: params.syllabusCodes.join(',') } : {}),
      ...(params.startDate ? { startDate: params.startDate } : {}),
      ...(params.endDate ? { endDate: params.endDate } : {}),
      ...(params.keyword ? { keyword: params.keyword } : {}),
    },
  })
}

/** 记录一次错题本页面访问，筛选和翻页不会重复上报。 */
export function recordMistakeNotebookVisit() {
  return callApi<{ recorded: true }>({
    url: '/exams/error-book/visit',
    method: 'POST',
  })
}

/** 获取当前用户在单道错题上的历次错误作答，服务端按提交时间倒序返回。 */
export function getMistakeAttemptHistory(questionId: string) {
  return callApi<MistakeAttemptHistoryResult>({
    url: `/exams/error-book/${encodeURIComponent(questionId)}/attempts`,
    method: 'GET',
  })
}

/** 获取试题库练习记录 */
export function getPracticeRecords() {
  return callApi<{ records: PracticeRecord[] }>({
    url: '/exams/practice-records',
    method: 'GET',
  })
}

/** 获取个人中心考试统计 */
export function getProfileExamStats() {
  return callApi<{ stats: Record<string, ProfileExamStats> }>({
    url: '/exams/profile-stats',
    method: 'GET',
  })
}
