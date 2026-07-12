// 新版诊断报告首部分：报告头、模块结构、等效评估分和风险信号。
import crypto from 'crypto'
import { EXAM_TYPE } from '../constants/domain.js'
import { quickTmuaPaperScore } from './scoring.js'
import { requestDeepSeekJson } from './deepseek.js'
import { buildEsatDiagnosticReportSummary } from './esatDiagnosticReport.js'

type DifficultyLevel = 'low' | 'medium' | 'high'

export interface ReportQuestionInput {
  number: number
  subject: string | null
  subjectCode: string | null
  topic?: string | null
  topicCode?: string | null
  knowledgePoints?: Array<{
    code: string
    label: string
    role?: string
  }>
  difficulty: string | null
  isCorrect: boolean
  isAnswered?: boolean
  answerState?: 'unseen' | 'skipped' | 'answered'
  durationSeconds?: number | null
}

export interface PaperInput {
  title: string
  code: string | null
  year: number
  duration?: number
}

export interface LearnerProfileInput {
  subjects: string[]
  targetUniversities: string[]
  targetMajor: string | null
  targetScore: number | null
  examDate: string | null
  weeklyHours: number | null
}

export type DiagnosticBuildStage = 'module_analyzing' | 'roi_analyzing' | 'path_analyzing'

export interface ReportOverview {
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

export interface ReportKnowledgeMastery {
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

export interface ReportAiImprovementPlan {
  matrix: Array<{
    code: string
    label: string
    moduleId: string
    moduleLabel: string
    cells: Array<{
      difficulty: DifficultyLevel
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
    difficulty: DifficultyLevel
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

export interface ReportLearningPath {
  profile: LearnerProfileInput & {
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

export interface DifficultyMasteryItem {
  level: DifficultyLevel
  label: string
  correct: number
  total: number
  accuracy: number | null
}

export interface AssessmentPositioning {
  percentileValue: number | null
  percentileLabel: string
  performanceLevel: string
  competitiveness: string
  analysisSource?: 'deepseek' | 'fallback'
  cohortReference: string
  limitedData: boolean
}

export interface AssessmentModule {
  id: string
  label: string
  correct: number
  total: number
  score: number | null
  scoreRange: [number, number] | null
  scaleLabel: string
  summary: string
  positioning: AssessmentPositioning | null
  difficultyMastery: DifficultyMasteryItem[]
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
    positioning: AssessmentPositioning | null
    modules: AssessmentModule[]
    difficultyMastery: DifficultyMasteryItem[]
    riskSignal: string | null
    riskStatus: 'generated' | 'unavailable'
  }
  overview?: ReportOverview
  knowledgeMastery?: ReportKnowledgeMastery
  aiImprovementPlan?: ReportAiImprovementPlan
  learningPath?: ReportLearningPath
}

const DIFFICULTY_META: Record<DifficultyLevel, { label: string }> = {
  low: { label: '低难度' },
  medium: { label: '中难度' },
  high: { label: '高难度' },
}

const riskSignalCache = new Map<string, string>()

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalizeDifficulty(value: string | null): DifficultyLevel | null {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return null
  if (['low', 'easy', '基础', '简单'].includes(normalized)) return 'low'
  if (['medium', '中等', '中'].includes(normalized)) return 'medium'
  if (['high', 'hard', 'difficult', '困难', '高'].includes(normalized)) return 'high'
  return null
}

function rawRatio(questions: ReportQuestionInput[]): number {
  if (!questions.length) return 0
  return questions.filter((question) => question.isCorrect).length / questions.length
}

// 使用原始正确率的 Wilson 区间表达单套试卷不确定性，难度标签不参与 Rasch 等效分加权。
function rawRatioRange(questions: ReportQuestionInput[]): [number, number] {
  if (!questions.length) return [0, 0]
  const sampleSize = questions.length
  const proportion = rawRatio(questions)
  const z = 1.2816
  const denominator = 1 + (z * z) / sampleSize
  const center = (proportion + (z * z) / (2 * sampleSize)) / denominator
  const margin = (
    z * Math.sqrt((proportion * (1 - proportion)) / sampleSize + (z * z) / (4 * sampleSize * sampleSize))
  ) / denominator
  return [clamp(center - margin, 0, 1), clamp(center + margin, 0, 1)]
}

function tmuaModuleId(question: ReportQuestionInput, index: number, total: number): 'paper1' | 'paper2' {
  const text = `${question.subject || ''} ${question.subjectCode || ''}`.toLowerCase()
  if (/paper\s*2|p2|reasoning|推理/.test(text)) return 'paper2'
  if (/paper\s*1|p1|thinking|思维/.test(text)) return 'paper1'
  return index < Math.ceil(total / 2) ? 'paper1' : 'paper2'
}

function groupModules(examType: string, questions: ReportQuestionInput[]): Map<string, ReportQuestionInput[]> {
  const groups = new Map<string, ReportQuestionInput[]>()
  questions.forEach((question, index) => {
    let moduleId = 'overall'
    if (examType === EXAM_TYPE.TMUA) moduleId = tmuaModuleId(question, index, questions.length)
    if (examType === EXAM_TYPE.STEP) {
      const text = `${question.subject || ''} ${question.subjectCode || ''}`.toLowerCase()
      moduleId = /step\s*3|step3/.test(text) ? 'step3' : 'step2'
    }
    const group = groups.get(moduleId) || []
    group.push(question)
    groups.set(moduleId, group)
  })
  return groups
}

function moduleLabel(examType: string, id: string): string {
  const labels: Record<string, string> = {
    paper1: 'Paper 1',
    paper2: 'Paper 2',
    maths1: '数学 1',
    maths2: '数学 2',
    physics: '物理',
    chemistry: '化学',
    biology: '生物',
    unclassified: '未分类模块',
    step2: 'STEP 2',
    step3: 'STEP 3',
    overall: examType,
  }
  return labels[id] || id
}

function buildReportTitle(examType: string, paper: PaperInput): string {
  const code = paper.code?.trim().toUpperCase() || examType
  let title = paper.title.trim()
  if (!title.toUpperCase().includes(code)) title = `${code} ${title}`
  if (!title.includes(String(paper.year))) title = `${title} ${paper.year}`
  return `${title} · 成绩报告`
}

function positioningForScore(score: number, examType: string): AssessmentPositioning {
  const bands = [
    { min: 8, percentile: 95, label: 'Excellent', competitiveness: '所有院校极具竞争力' },
    { min: 7, percentile: 90, label: 'Very Good', competitiveness: '顶尖院校申请中有力竞争' },
    { min: 6.5, percentile: 85, label: 'Good', competitiveness: '所有院校有竞争力' },
    { min: 5.5, percentile: 75, label: 'Above Average', competitiveness: '满足多数申请场景的竞争要求' },
    { min: 4.5, percentile: 50, label: 'Average', competitiveness: '具备基础竞争力，仍需提升稳定性' },
    { min: 3.5, percentile: 35, label: 'Below Average', competitiveness: '当前竞争力有限' },
    { min: 1, percentile: 20, label: 'Poor', competitiveness: '当前分数难以增强申请竞争力' },
  ]
  const band = bands.find((item) => score >= item.min) || bands[bands.length - 1]
  const top = 100 - band.percentile
  const limitedData = examType === EXAM_TYPE.ESAT
  return {
    percentileValue: band.percentile,
    percentileLabel: `Top ${top}%`,
    performanceLevel: band.label,
    competitiveness: band.competitiveness,
    cohortReference: limitedData
      ? 'ESAT 历史场次较少，百分位仅供参考'
      : `2025/26 众数 3.5，你高于约 ${band.percentile}% 考生`,
    limitedData,
  }
}

function scoreTmuaModule(id: string, questions: ReportQuestionInput[]): Omit<AssessmentModule, 'summary'> {
  const ratio = rawRatio(questions)
  const range = rawRatioRange(questions)
  const paper = id === 'paper2' ? 'paper2' : 'paper1'
  const score = quickTmuaPaperScore(paper, ratio * questions.length, questions.length)
  const scoreRange: [number, number] = [
    quickTmuaPaperScore(paper, range[0] * questions.length, questions.length),
    quickTmuaPaperScore(paper, range[1] * questions.length, questions.length),
  ]
  return {
    id,
    label: moduleLabel(EXAM_TYPE.TMUA, id),
    correct: questions.filter((question) => question.isCorrect).length,
    total: questions.length,
    score,
    scoreRange,
    scaleLabel: '/ 9.0',
    positioning: positioningForScore(score, EXAM_TYPE.TMUA),
    difficultyMastery: buildDifficultyMastery(questions),
  }
}

function moduleSummary(module: Omit<AssessmentModule, 'summary'>, average: number | null): string {
  if (module.score === null || average === null) return '当前模块缺少可靠换算规则。'
  if (module.score >= average + 0.5) return '本模块表现相对突出，可继续保持稳定性。'
  if (module.score <= average - 0.5) return '本模块低于整体表现，是当前需要关注的方向。'
  return '本模块表现接近整体水平。'
}

function buildDifficultyMastery(questions: ReportQuestionInput[]): DifficultyMasteryItem[] {
  return (Object.keys(DIFFICULTY_META) as DifficultyLevel[]).map((level) => {
    const items = questions.filter((question) => normalizeDifficulty(question.difficulty) === level)
    const correct = items.filter((question) => question.isCorrect).length
    return {
      level,
      label: DIFFICULTY_META[level].label,
      correct,
      total: items.length,
      accuracy: items.length ? round1(correct / items.length) : null,
    }
  })
}

async function generateRiskSignal(input: {
  examType: string
  score: number | null
  scoreRange: [number, number] | null
  modules: AssessmentModule[]
  difficultyMastery: DifficultyMasteryItem[]
}): Promise<string | null> {
  const cacheKey = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex')
  const cached = riskSignalCache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await requestDeepSeekJson<{ riskSignal?: unknown }>(
      [
        '你是英国大学入学考试诊断分析师。请只输出 JSON。',
        '根据输入事实生成一个 riskSignal 字段，最多两句中文，总长度不超过100字。',
        '只指出一个最大风险；不得生成新分数、百分位、院校结论、错误类型或学习建议。',
      ].join('\n'),
      input,
    )
    const signal = typeof response.data.riskSignal === 'string' ? response.data.riskSignal.trim() : ''
    if (!signal || signal.length > 100) throw new Error('DeepSeek riskSignal validation failed')
    riskSignalCache.set(cacheKey, signal)
    console.info('[diagnostic-report] risk signal generated', {
      model: response.model,
      totalTokens: response.usage.totalTokens,
    })
    return signal
  } catch (error) {
    console.error('[diagnostic-report] risk signal unavailable:', error)
    return null
  }
}

export async function buildDiagnosticReportSummary(input: {
  examType: string
  paper: PaperInput
  questions: ReportQuestionInput[]
  elapsedDurationSeconds?: number | null
  syllabusNodes?: Array<{ code: string; label: string }>
  learnerProfile?: LearnerProfileInput
  onStage?: (stage: DiagnosticBuildStage) => void | Promise<void>
}): Promise<DiagnosticReportSummary> {
  if (input.examType === EXAM_TYPE.ESAT) {
    return buildEsatDiagnosticReportSummary(input)
  }

  await input.onStage?.('module_analyzing')

  const questions = [...input.questions].sort((a, b) => a.number - b.number)
  const groups = groupModules(input.examType, questions)
  const rawModules: Array<Omit<AssessmentModule, 'summary'>> = []

  for (const [id, items] of groups) {
    if (input.examType === EXAM_TYPE.TMUA) rawModules.push(scoreTmuaModule(id, items))
    else {
      rawModules.push({
        id,
        label: moduleLabel(input.examType, id),
        correct: items.filter((question) => question.isCorrect).length,
        total: items.length,
        score: null,
        scoreRange: null,
        scaleLabel: '等级评分待接入',
        positioning: null,
        difficultyMastery: buildDifficultyMastery(items),
      })
    }
  }

  const scoredModules = rawModules.filter((module) => module.score !== null)
  const moduleAverage = scoredModules.length
    ? round1(scoredModules.reduce((sum, module) => sum + (module.score || 0), 0) / scoredModules.length)
    : null
  const modules = rawModules.map((module) => ({
    ...module,
    summary: moduleSummary(module, moduleAverage),
  }))

  const tmuaScore = input.examType === EXAM_TYPE.TMUA ? moduleAverage : null
  const tmuaRanges = input.examType === EXAM_TYPE.TMUA
    ? modules.map((module) => module.scoreRange).filter((value): value is [number, number] => Boolean(value))
    : []
  const scoreRange = tmuaRanges.length
    ? [
        round1(tmuaRanges.reduce((sum, range) => sum + range[0], 0) / tmuaRanges.length),
        round1(tmuaRanges.reduce((sum, range) => sum + range[1], 0) / tmuaRanges.length),
      ] as [number, number]
    : null
  const difficultyMastery = buildDifficultyMastery(questions)
  const riskSignal = await generateRiskSignal({
    examType: input.examType,
    score: tmuaScore,
    scoreRange,
    modules,
    difficultyMastery,
  })

  return {
    reportKind: input.examType === EXAM_TYPE.TMUA ? 'tmua' : 'step',
    header: {
      title: buildReportTitle(input.examType, input.paper),
      examType: input.examType,
      year: input.paper.year,
      modules: modules.map((module) => ({ id: module.id, label: module.label })),
    },
    assessment: {
      score: tmuaScore,
      scoreRange,
      scaleLabel: input.examType === EXAM_TYPE.STEP ? '等级评分待接入' : '/ 9.0',
      basedOnQuestions: questions.length,
      methodNote: '基于本次原始正确数与参考换算曲线估算；难度标签仅用于能力分析',
      referenceVersion: input.examType === EXAM_TYPE.TMUA
        ? 'tmua-2024-representative-v1'
        : input.examType === EXAM_TYPE.ESAT
          ? 'esat-module-reference-v1'
          : 'step-pending',
      positioning: tmuaScore === null ? null : positioningForScore(tmuaScore, input.examType),
      modules,
      difficultyMastery,
      riskSignal,
      riskStatus: riskSignal ? 'generated' : 'unavailable',
    },
  }
}
