// V2 诊断报告生成器：统一处理 ESAT/TMUA 的证据画像、模型分析与学习行动。
import crypto from 'crypto'
import { BoundedLruCache } from '../../../utils/boundedLruCache.js'
import {
  resolveEsatModule,
  quickEsatScore,
  quickTmuaPaperScore,
  type EsatModule,
} from '../shared/scoring.js'
import { requestDeepSeekJson } from '../../deepseek.js'
import { diagnosticReportPrompt } from './prompts.js'
import type {
  AssessmentModule,
  AssessmentPositioning,
  DiagnosticReportSummary,
  DifficultyMasteryItem,
  PaperInput,
  ReportQuestionInput,
  ReportOverview,
  ReportKnowledgeMastery,
  ReportAiImprovementPlan,
  ReportWeaknessProfile,
  ReportModuleWeaknessSignal,
  ReportDifficultyWeaknessSignal,
  ReportTopicWeaknessSignal,
  ReportLearningPath,
  ReportNextAction,
  ReportStarterPlan,
  ReportStarterPlanDay,
  LearnerProfileInput,
  DiagnosticBuildStage,
} from '../../diagnosticReport.js'

type DifficultyLevel = 'low' | 'medium' | 'high'

const ESAT_EXPECTED_QUESTION_COUNT = 27
const TMUA_EXPECTED_QUESTION_COUNT = 20
const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  low: '低难度',
  medium: '中难度',
  high: '高难度',
}
const DIFFICULTY_TIME_WEIGHTS: Record<DifficultyLevel, number> = {
  low: 0.8,
  medium: 1,
  high: 1.25,
}
const MODULE_LABELS: Record<string, string> = {
  maths1: '数学 1',
  maths2: '数学 2',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  unclassified: '未分类模块',
}
const MODULE_ORDER = ['maths1', 'maths2', 'physics', 'chemistry', 'biology', 'unclassified']
const TMUA_MODULE_LABELS: Record<string, string> = {
  paper1: 'Paper 1 · 数学知识应用',
  paper2: 'Paper 2 · 数学推理',
  unclassified: '未分类分卷',
}
const TMUA_MODULE_ORDER = ['paper1', 'paper2', 'unclassified']
const ESAT_SCORE_BINS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]
const ESAT_DISTRIBUTION_PERCENTAGES: Record<string, number[]> = {
  maths1: [0.4, 0.7, 2.2, 3.5, 11.2, 11.8, 15.4, 17.2, 10.2, 8.7, 5.5, 4.9, 2.8, 2.0, 0.4, 1.5, 1.7],
  maths2: [2.1, 2.2, 3.4, 5.4, 10.5, 13.3, 14.8, 9.9, 12.5, 7.3, 7.1, 3.5, 2.7, 1.1, 1.6, 0.4, 2.3],
  physics: [3.7, 2.7, 5.6, 7.5, 7.7, 12.9, 11.3, 13.0, 8.1, 10.4, 5.0, 4.3, 3.4, 0.6, 2.0, 0.3, 1.7],
  chemistry: [1.8, 3.3, 2.5, 4.8, 11.7, 7.0, 14.0, 12.3, 9.4, 11.0, 6.2, 3.4, 5.2, 4.0, 0.6, 0, 3.2],
  biology: [7.1, 0.9, 5.2, 7.7, 7.1, 9.0, 9.3, 11.0, 10.8, 9.0, 5.5, 7.3, 3.2, 2.5, 2.1, 0, 2.7],
}
type ModuleAnalysis = Partial<{
  riskSignal: string
  summary: string
  strength: string
  keyIssue: string
  focusSuggestion: string
}>

type DiagnosticExamContext = {
  examType: 'ESAT' | 'TMUA'
  moduleNoun: '科目' | '分卷'
  moduleLabels: Record<string, string>
  moduleOrder: string[]
  resolveModule: (question: ReportQuestionInput, index: number, total: number) => string
}

const ESAT_CONTEXT: DiagnosticExamContext = {
  examType: 'ESAT',
  moduleNoun: '科目',
  moduleLabels: MODULE_LABELS,
  moduleOrder: MODULE_ORDER,
  resolveModule: (question) => resolveEsatModule(
    question.moduleCode ?? question.componentCode,
    question.subject,
  ) || 'unclassified',
}

const TMUA_CONTEXT: DiagnosticExamContext = {
  examType: 'TMUA',
  moduleNoun: '分卷',
  moduleLabels: TMUA_MODULE_LABELS,
  moduleOrder: TMUA_MODULE_ORDER,
  resolveModule: (question, index, total) => {
    const source = [
      question.moduleCode,
      question.componentCode,
      question.subjectCode,
      question.subject,
    ].filter(Boolean).join(' ').toLowerCase()
    if (/paper\s*2|paper2|p2|reasoning|推理/.test(source)) return 'paper2'
    if (/paper\s*1|paper1|p1|thinking|应用/.test(source)) return 'paper1'
    return index < Math.ceil(total / 2) ? 'paper1' : 'paper2'
  },
}

const DIAGNOSTIC_AI_CACHE_MAX_ENTRIES = 128
const moduleAnalysisCache = new BoundedLruCache<string, Record<string, ModuleAnalysis>>(
  DIAGNOSTIC_AI_CACHE_MAX_ENTRIES,
)
const modulePositioningCache = new BoundedLruCache<string, Record<string, string>>(
  DIAGNOSTIC_AI_CACHE_MAX_ENTRIES,
)
const roiCache = new BoundedLruCache<
  string,
  Array<{ gapKey: string; priorityReason: string; prerequisiteCheck: string }>
>(DIAGNOSTIC_AI_CACHE_MAX_ENTRIES)
const learningPathCache = new BoundedLruCache<string, unknown>(DIAGNOSTIC_AI_CACHE_MAX_ENTRIES)
const starterPlanCache = new BoundedLruCache<string, unknown>(DIAGNOSTIC_AI_CACHE_MAX_ENTRIES)

// 保留一位小数，统一 ESAT 等效原始分和标准分的展示精度。
function round1(value: number): number {
  return Math.round(value * 10) / 10
}

// 将数值限制在合法范围内，避免区间计算越界。
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// 兼容题库已有的中英文难度值，只把标准三档纳入分析。
function normalizeDifficulty(value: string | null): DifficultyLevel | null {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return null
  if (['low', 'easy', '基础', '简单'].includes(normalized)) return 'low'
  if (['medium', '中等', '中'].includes(normalized)) return 'medium'
  if (['high', 'hard', 'difficult', '困难', '高'].includes(normalized)) return 'high'
  return null
}

// 题目目标题时按难度权重分配整卷规定时长，所有题的目标时间之和始终等于试卷时长。
function timingWeight(question: ReportQuestionInput): number {
  return DIFFICULTY_TIME_WEIGHTS[normalizeDifficulty(question.difficulty) || 'medium']
}

// 非标准题量使用正确率 Wilson 区间，再映射到 ESAT 27 题等效原始分。
function ratioRange(correct: number, total: number): [number, number] {
  if (total <= 0) return [0, 0]
  const proportion = correct / total
  const z = 1.2816
  const denominator = 1 + (z * z) / total
  const center = (proportion + (z * z) / (2 * total)) / denominator
  const margin = (
    z * Math.sqrt((proportion * (1 - proportion)) / total + (z * z) / (4 * total * total))
  ) / denominator
  return [clamp(center - margin, 0, 1), clamp(center + margin, 0, 1)]
}

// 按当前模块的题目标签聚合低、中、高难度掌握度。
function buildDifficultyMastery(questions: ReportQuestionInput[]): DifficultyMasteryItem[] {
  return (Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map((level) => {
    const items = questions.filter((question) => normalizeDifficulty(question.difficulty) === level)
    const correct = items.filter((question) => question.isCorrect).length
    return {
      level,
      label: DIFFICULTY_LABELS[level],
      correct,
      total: items.length,
      accuracy: items.length ? round1(correct / items.length) : null,
    }
  })
}

// 官方仅提供图表，因此按数字化后的 0.5 分档分布计算中秩百分位，并归一化微小读取误差。
function estimateOfficialPercentile(moduleId: string, score: number): number {
  const percentages = ESAT_DISTRIBUTION_PERCENTAGES[moduleId] || ESAT_DISTRIBUTION_PERCENTAGES.maths1
  const total = percentages.reduce((sum, value) => sum + value, 0)
  const boundedScore = clamp(score, 1, 9)
  const midRanks: Array<{ score: number; percentile: number }> = []
  let cumulative = 0

  ESAT_SCORE_BINS.forEach((scoreBin, index) => {
    const percentage = total > 0 ? ((percentages[index] || 0) / total) * 100 : 0
    midRanks.push({ score: scoreBin, percentile: cumulative + percentage / 2 })
    cumulative += percentage
  })

  const upperIndex = midRanks.findIndex((point) => point.score >= boundedScore)
  if (upperIndex <= 0) return Math.round(midRanks[0]?.percentile || 0)
  if (upperIndex < 0) return Math.round(midRanks[midRanks.length - 1]?.percentile || 100)
  const lower = midRanks[upperIndex - 1]
  const upper = midRanks[upperIndex]
  const ratio = (boundedScore - lower.score) / (upper.score - lower.score)
  return Math.round(lower.percentile + (upper.percentile - lower.percentile) * ratio)
}

// ESAT 模块定位的表现等级使用平台分档，参考百分位使用对应模块的官方历史分布。
function buildPositioning(moduleId: string, score: number): AssessmentPositioning {
  const bands = [
    { min: 8, level: 'Excellent', competitiveness: '该模块处于顶尖水平' },
    { min: 7, level: 'Very Good', competitiveness: '该模块具备较强竞争力' },
    { min: 6, level: 'Good', competitiveness: '该模块具备竞争力' },
    { min: 4, level: 'Average', competitiveness: '该模块处于主要考生分布区间' },
    { min: 1, level: 'Below Average', competitiveness: '该模块仍有较大提升空间' },
  ]
  const band = bands.find((item) => score >= item.min) || bands[bands.length - 1]
  const percentile = estimateOfficialPercentile(moduleId, score)
  return {
    percentileValue: percentile,
    percentileLabel: `约第 ${percentile} 百分位`,
    performanceLevel: band.level,
    competitiveness: band.competitiveness,
    analysisSource: 'fallback',
    cohortReference: 'UAT-UK 2025年10月与2026年1月官方模块成绩分布（图表数字化近似）',
    limitedData: false,
  }
}

// 每个模块独立估分；不足或超过 27 题时先归一为 /27 等效原始分。
function buildModule(id: string, questions: ReportQuestionInput[]): AssessmentModule {
  const correct = questions.filter((question) => question.isCorrect).length
  const total = questions.length
  const scoringBasis = total === ESAT_EXPECTED_QUESTION_COUNT ? 'standard' : 'normalized'
  const equivalentRawScore = total > 0 ? round1((correct / total) * ESAT_EXPECTED_QUESTION_COUNT) : 0
  const range = ratioRange(correct, total)
  const score = id === 'unclassified'
    ? null
    : quickEsatScore(id as EsatModule, equivalentRawScore, ESAT_EXPECTED_QUESTION_COUNT)
  const scoreRange = id === 'unclassified'
    ? null
    : [
        quickEsatScore(id as EsatModule, range[0] * ESAT_EXPECTED_QUESTION_COUNT, ESAT_EXPECTED_QUESTION_COUNT),
        quickEsatScore(id as EsatModule, range[1] * ESAT_EXPECTED_QUESTION_COUNT, ESAT_EXPECTED_QUESTION_COUNT),
      ] as [number, number]
  const notice = scoringBasis === 'normalized'
    ? `本模块为 ${total} 题非标准题量，已按正确率归一为 /27 等效原始分，区间相应放宽。`
    : null
  return {
    id,
    label: MODULE_LABELS[id] || id,
    correct,
    total,
    score,
    scoreRange,
    scaleLabel: '/ 9.0',
    summary: score === null ? '当前模块缺少可靠换算规则。' : 'ESAT 模块独立评分，不与其他模块合并。',
    positioning: score === null ? null : buildPositioning(id, score),
    difficultyMastery: buildDifficultyMastery(questions),
    scoringBasis,
    equivalentRawScore,
    notice,
    riskSignal: null,
  }
}

// 按“未得分题量”选择最影响模块整体表现的难度层，避免只按最低正确率误判小样本。
function primaryDifficultyGap(module: AssessmentModule): DifficultyMasteryItem | null {
  return [...module.difficultyMastery]
    .filter((item) => item.total > 0 && item.accuracy !== null)
    .sort((left, right) => {
      const missedDifference = (right.total - right.correct) - (left.total - left.correct)
      if (missedDifference !== 0) return missedDifference
      if (right.total !== left.total) return right.total - left.total
      return (left.accuracy ?? 0) - (right.accuracy ?? 0)
    })[0] || null
}

// 模型不可用时根据模块分数、正确率、难度题量和小样本边界生成有证据的整体评价。
export function buildFallbackModulePositioningInsight(
  module: AssessmentModule,
  sequenceSignal?: ReportWeaknessProfile['sequenceSignals'][number] | null,
): string {
  const scoreLabel = module.scoreRange
    ? `平台预估区间${module.scoreRange[0].toFixed(1)}—${module.scoreRange[1].toFixed(1)}`
    : module.score === null
      ? '暂无可靠预估分'
      : `预估分${module.score.toFixed(1)}`
  if (module.total <= 0) return `${module.label}${scoreLabel}，当前没有有效作答样本，暂不能判断稳定表现；应先完成足量作答后再确定优先提升方向。`

  const accuracy = round1((module.correct / module.total) * 100)
  if (sequenceSignal) {
    return `${module.label}${scoreLabel}，本次答对${module.correct}/${module.total}题（正确率${accuracy}%）。前${sequenceSignal.earlyTotal}题答对${sequenceSignal.earlyCorrect}题，后${sequenceSignal.lateTotal}题仅答对${sequenceSignal.lateCorrect}题；后段正确率明显下降，应先复盘后段错题并用限时混合题复测。`
  }
  const gap = primaryDifficultyGap(module)
  if (!gap) {
    return `${module.label}${scoreLabel}，本次答对${module.correct}/${module.total}题（正确率${accuracy}%）。当前缺少可用的难度分层数据，应先复盘本模块错题并补充样本。`
  }

  const smallPositive = module.difficultyMastery.find(
    (item) => item.total > 0 && item.total < 4 && item.correct > 0 && item.level !== gap.level,
  )
  const sampleCaveat = smallPositive
    ? `；${smallPositive.label}${smallPositive.correct}/${smallPositive.total}因样本较少，暂不足以证明稳定优势`
    : ''
  const gapCaveat = gap.total < 4 ? '，但样本较少，需先校准' : ''
  return `${module.label}${scoreLabel}，本次答对${module.correct}/${module.total}题（正确率${accuracy}%）。${gap.label}答对${gap.correct}/${gap.total}题且影响未得分题量最大，是当前最值得复盘的难度层${gapCaveat}${sampleCaveat}；复盘后再决定是否专项投入。`
}

// 模型不可用时仅使用模块真实作答数据生成结构化降级分析，避免诊断区域留空。
export function buildFallbackModuleAnalysis(module: AssessmentModule): NonNullable<AssessmentModule['diagnosticAnalysis']> {
  const assessed = module.difficultyMastery
    .filter((item) => item.total > 0 && item.accuracy !== null)
    .sort((left, right) => (right.accuracy ?? 0) - (left.accuracy ?? 0))
  const strongest = assessed[0]
  const weakest = assessed[assessed.length - 1]
  const accuracy = module.total > 0 ? Math.round((module.correct / module.total) * 100) : 0
  const strength = strongest && (strongest.accuracy ?? 0) >= 0.4
    ? `${strongest.label}表现相对较好，答对 ${strongest.correct}/${strongest.total} 题，正确率 ${Math.round((strongest.accuracy ?? 0) * 100)}%。`
    : '当前样本尚未显示稳定优势，需要通过后续作答继续观察。'
  const keyIssue = weakest
    ? `${weakest.label}是当前最值得优先复盘的难度层，答对 ${weakest.correct}/${weakest.total} 题，正确率 ${Math.round((weakest.accuracy ?? 0) * 100)}%；需结合后续样本再判断是否专项补弱。`
    : '当前模块缺少可用于难度分层判断的有效作答样本。'
  const focusSuggestion = weakest
    ? `优先复盘${weakest.label}错题，核对解题步骤与失分环节，再通过同难度题目验证改进效果。`
    : '先补充当前模块的有效作答样本，再确定下一阶段复盘重点。'
  return {
    summary: `${module.label}本次答对 ${module.correct}/${module.total} 题，正确率 ${accuracy}%，模块预估分 ${module.score?.toFixed(1) ?? '-'}。`,
    strength,
    keyIssue,
    focusSuggestion,
    source: 'fallback',
  }
}

// 风险字段独立降级，不因模型的某个辅助字段无效而在页面中留空。
function buildFallbackModuleRiskSignal(module: AssessmentModule): string {
  const gap = primaryDifficultyGap(module)
  if (!gap) return '当前难度分层样本不足，需补充有效作答后再判断主要风险。'
  return `${gap.label}答对${gap.correct}/${gap.total}题且影响未得分题量最大，是当前最需要关注的得分风险。`
}

// 为模型提供预计算比例和样本提示，避免让模型自行换算或夸大小样本表现。
function positioningPayloadForModule(module: AssessmentModule) {
  const primaryReviewDifficulty = primaryDifficultyGap(module)
  return {
    moduleId: module.id,
    moduleLabel: module.label,
    score: module.score,
    scoreRange: module.scoreRange,
    performanceLevel: module.positioning?.performanceLevel ?? null,
    percentileLabel: module.positioning?.percentileLabel ?? null,
    correct: module.correct,
    total: module.total,
    accuracyPercent: module.total > 0 ? round1((module.correct / module.total) * 100) : null,
    scoringBasis: module.scoringBasis,
    equivalentRawScore: module.equivalentRawScore,
    primaryReviewDifficulty: primaryReviewDifficulty
      ? {
          level: primaryReviewDifficulty.level,
          label: primaryReviewDifficulty.label,
          correct: primaryReviewDifficulty.correct,
          total: primaryReviewDifficulty.total,
        }
      : null,
    difficultyMastery: module.difficultyMastery.map((item) => ({
      level: item.level,
      label: item.label,
      correct: item.correct,
      total: item.total,
      accuracyPercent: item.total > 0 ? round1((item.correct / item.total) * 100) : null,
      sampleNote: item.total === 0
        ? '无题，不作判断'
        : item.total < 5
          ? '样本较少，不足以证明稳定优势'
          : '可用于判断当前表现',
    })),
  }
}

// 整体评价必须同时包含模块定位和作答证据，过滤空泛或脱离输入的模型文案。
export function validateModulePositioningInsight(
  module: AssessmentModule,
  value: unknown,
  weaknessProfile?: ReportWeaknessProfile,
): string | null {
  if (typeof value !== 'string') return null
  const insight = value.trim()
  const compactInsight = insight.replace(/\s+/g, '')
  if (insight.length < 25 || insight.length > 160) return null
  if (['仍有提升空间', '加强练习', '继续努力'].some((phrase) => insight === phrase || insight === `该模块${phrase}`)) {
    return null
  }
  if (['极弱', '严重不足', '系统性缺失', '完全没有能力'].some((phrase) => insight.includes(phrase))) return null
  const hasModuleSignal = weaknessProfile?.moduleSignals.some((signal) => signal.moduleId === module.id) ?? false
  const hasDifficultySignal = weaknessProfile?.difficultySignals.some((signal) => signal.moduleId === module.id) ?? false
  if (!hasModuleSignal && insight.includes('模块短板')) return null
  if (!hasDifficultySignal && ['主要薄弱层', '明确薄弱层', '核心瓶颈'].some((phrase) => insight.includes(phrase))) {
    return null
  }
  const bottleneckLevel = insight.match(/(?:核心|主要)瓶颈[^。；，]{0,12}([低中高])难度/)?.[1]
  const priorityLevel = insight.match(/优先[^。；，]{0,16}([低中高])难度/)?.[1]
  if (bottleneckLevel && priorityLevel && bottleneckLevel !== priorityLevel) return null
  const primaryGap = primaryDifficultyGap(module)
  const primaryGapLevel = primaryGap?.label.match(/([低中高])难度/)?.[1]
  if (
    weaknessProfile?.diagnosisMode === 'balanced_improvement'
    && priorityLevel
    && primaryGapLevel
    && priorityLevel !== primaryGapLevel
  ) return null
  const scoreEvidence = module.scoreRange
    ? module.scoreRange.every((score) => compactInsight.includes(score.toFixed(1)))
    : module.score === null || compactInsight.includes(module.score.toFixed(1))
  const overallEvidence = compactInsight.includes(`${module.correct}/${module.total}`)
    || compactInsight.includes(`${module.total}题`)
  const difficultyEvidence = module.difficultyMastery.some((item) => (
    item.total > 0
    && (compactInsight.includes(`${item.correct}/${item.total}`) || compactInsight.includes(item.label))
  ))
  return scoreEvidence && (overallEvidence || difficultyEvidence) ? insight : null
}

function modulePositioningPrompt(context: DiagnosticExamContext): string {
  return diagnosticReportPrompt('module-positioning', context)
}

// 执行一次整体评价专用请求，并逐模块接受合格结果。
async function requestModulePositioningInsights(
  modules: AssessmentModule[],
  context: DiagnosticExamContext,
  weaknessProfile?: ReportWeaknessProfile,
): Promise<Record<string, string>> {
  const prompt = modulePositioningPrompt(context)
  const response = await requestDeepSeekJson<{ moduleAnalyses?: unknown }>(
    prompt,
    {
      examType: context.examType,
      task: `生成各${context.moduleNoun}的整体评价`,
      weaknessProfile: weaknessProfile || null,
      modules: modules.map(positioningPayloadForModule),
    },
    { maxTokens: 900 },
  )
  if (!Array.isArray(response.data.moduleAnalyses)) throw new Error(`Invalid ${context.examType} positioning moduleAnalyses`)
  const moduleMap = new Map(modules.map((module) => [module.id, module]))
  const insights: Record<string, string> = {}
  for (const item of response.data.moduleAnalyses as Array<Record<string, unknown>>) {
    const moduleId = typeof item.moduleId === 'string' ? item.moduleId : ''
    const module = moduleMap.get(moduleId)
    if (!module) continue
    const insight = validateModulePositioningInsight(module, item.positioningInsight, weaknessProfile)
    if (insight) insights[moduleId] = insight
  }
  console.info('[diagnostic-report] module positioning generated', {
    examType: context.examType,
    model: response.model,
    accepted: Object.keys(insights).length,
    requested: modules.length,
    totalTokens: response.usage.totalTokens,
  })
  return insights
}

// 批量生成后只补偿缺失模块，兼顾跨模块区分度与单模块失败隔离。
export async function generateModulePositioningInsights(
  modules: AssessmentModule[],
  context: DiagnosticExamContext = ESAT_CONTEXT,
  weaknessProfile?: ReportWeaknessProfile,
): Promise<Record<string, string>> {
  const payload = modules.map(positioningPayloadForModule)
  const prompt = modulePositioningPrompt(context)
  const cacheKey = crypto.createHash('sha256')
    .update(JSON.stringify({ prompt, payload, weaknessProfile }))
    .digest('hex')
  const cached = modulePositioningCache.get(cacheKey)
  if (cached) return cached

  const insights: Record<string, string> = {}
  try {
    Object.assign(insights, await requestModulePositioningInsights(modules, context, weaknessProfile))
  } catch (error) {
    console.error(`[${context.examType.toLowerCase()}-diagnostic] module positioning batch unavailable:`, error)
  }

  const missingModules = modules.filter((module) => !insights[module.id])
  if (missingModules.length) {
    try {
      Object.assign(insights, await requestModulePositioningInsights(missingModules, context, weaknessProfile))
    } catch (error) {
      console.error(`[${context.examType.toLowerCase()}-diagnostic] module positioning repair unavailable:`, error)
    }
  }

  if (Object.keys(insights).length) modulePositioningCache.set(cacheKey, insights)
  return insights
}

// 辅助诊断仍使用一次批量调用，但每个字段独立验收，任一字段无效不再丢弃整模块结果。
async function generateModuleAnalyses(
  modules: AssessmentModule[],
  context: DiagnosticExamContext = ESAT_CONTEXT,
  weaknessProfile?: ReportWeaknessProfile,
): Promise<Record<string, ModuleAnalysis>> {
  const payload = modules.map((module) => ({
    moduleId: module.id,
    moduleLabel: module.label,
    score: module.score,
    scoreRange: module.scoreRange,
    correct: module.correct,
    total: module.total,
    scoringBasis: module.scoringBasis,
    difficultyMastery: module.difficultyMastery,
    primaryReviewDifficulty: primaryDifficultyGap(module),
    weaknessSignal: weaknessProfile?.moduleSignals.find((signal) => signal.moduleId === module.id) || null,
    difficultySignals: weaknessProfile?.difficultySignals.filter((signal) => signal.moduleId === module.id) || [],
    sequenceSignals: weaknessProfile?.sequenceSignals.filter((signal) => signal.moduleId === module.id) || [],
  }))
  const prompt = diagnosticReportPrompt('module-analysis', context)
  const cacheKey = crypto.createHash('sha256').update(JSON.stringify({
    examType: context.examType,
    prompt,
    weaknessProfile,
    payload,
  })).digest('hex')
  const cached = moduleAnalysisCache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await requestDeepSeekJson<{ moduleAnalyses?: unknown }>(
      prompt,
      {
        examType: context.examType,
        examPolicy: weaknessProfile?.examPolicy,
        weaknessProfile: weaknessProfile
          ? {
              diagnosisMode: weaknessProfile.diagnosisMode,
              primaryModule: weaknessProfile.primaryModule,
              moduleSignals: weaknessProfile.moduleSignals,
              difficultySignals: weaknessProfile.difficultySignals,
              topicSignals: weaknessProfile.topicSignals,
              calibrationSignals: weaknessProfile.calibrationSignals,
              sequenceSignals: weaknessProfile.sequenceSignals,
            }
          : null,
        modules: payload,
      },
      { maxTokens: 1500 },
    )
    if (!Array.isArray(response.data.moduleAnalyses)) throw new Error(`Invalid ${context.examType} moduleAnalyses`)
    const moduleMap = new Map(modules.map((module) => [module.id, module]))
    const allowedIds = new Set(moduleMap.keys())
    const analyses: Record<string, ModuleAnalysis> = {}
    for (const item of response.data.moduleAnalyses as Array<Record<string, unknown>>) {
      const moduleId = typeof item.moduleId === 'string' ? item.moduleId : ''
      const riskSignal = typeof item.riskSignal === 'string' ? item.riskSignal.trim() : ''
      const summary = typeof item.summary === 'string' ? item.summary.trim() : ''
      const strength = typeof item.strength === 'string' ? item.strength.trim() : ''
      const keyIssue = typeof item.keyIssue === 'string' ? item.keyIssue.trim() : ''
      const focusSuggestion = typeof item.focusSuggestion === 'string'
        ? item.focusSuggestion.trim()
        : ''
      if (!allowedIds.has(moduleId)) continue
      const module = moduleMap.get(moduleId)
      const strengthOverstatesSmallSample = module?.difficultyMastery.some((difficulty) => (
        difficulty.total > 0
        && difficulty.total < 4
        && strength.includes(difficulty.label)
        && !/(样本|暂|校准|观察)/.test(strength)
      )) ?? false
      const analysis: ModuleAnalysis = {}
      if (riskSignal && riskSignal.length <= 80) analysis.riskSignal = riskSignal
      if (summary && summary.length <= 100) analysis.summary = summary
      if (strength && strength.length <= 80 && !strengthOverstatesSmallSample) analysis.strength = strength
      if (keyIssue && keyIssue.length <= 100) analysis.keyIssue = keyIssue
      if (focusSuggestion && focusSuggestion.length <= 100) analysis.focusSuggestion = focusSuggestion
      if (Object.keys(analysis).length) analyses[moduleId] = analysis
    }
    moduleAnalysisCache.set(cacheKey, analyses)
    console.info('[diagnostic-report] module analyses generated', {
      examType: context.examType,
      model: response.model,
      totalTokens: response.usage.totalTokens,
    })
    return analyses
  } catch (error) {
    console.error(`[${context.examType.toLowerCase()}-diagnostic] module analyses unavailable:`, error)
    return {}
  }
}

// 逐字段合并模型结果与规则结果，保留部分成功并用 mixed 明确标记混合来源。
export function mergeModuleDiagnosticAnalysis(
  module: AssessmentModule,
  analysis: ModuleAnalysis | undefined,
  moduleSignal?: ReportModuleWeaknessSignal | null,
  difficultySignals?: ReportDifficultyWeaknessSignal[],
  sequenceSignal?: ReportWeaknessProfile['sequenceSignals'][number] | null,
): {
  riskSignal: string
  diagnosticAnalysis: NonNullable<AssessmentModule['diagnosticAnalysis']>
} {
  const fallback = buildFallbackModuleAnalysis(module)
  const aiFields = [analysis?.summary, analysis?.strength, analysis?.keyIssue, analysis?.focusSuggestion]
    .filter((value): value is string => Boolean(value))
  const source = aiFields.length === 4 ? 'deepseek' : aiFields.length > 0 ? 'mixed' : 'fallback'
  const primaryDifficultySignal = difficultySignals?.[0]
  const controlledRiskSignal = sequenceSignal
    ? `前${sequenceSignal.earlyTotal}题答对${sequenceSignal.earlyCorrect}题，后${sequenceSignal.lateTotal}题仅答对${sequenceSignal.lateCorrect}题，后段连续失分是当前最明确的风险。`
    : moduleSignal
    ? moduleSignal.level === 'relative'
      ? `${module.label}本次答对${moduleSignal.correct}/${moduleSignal.total}题，是相对其他模块更需要优先处理的方向。`
      : `${module.label}本次答对${moduleSignal.correct}/${moduleSignal.total}题，已形成${moduleSignal.confidence === 'high' ? '高' : '中'}置信度模块短板。`
    : primaryDifficultySignal
      ? `${primaryDifficultySignal.difficultyLabel}答对${primaryDifficultySignal.correct}/${primaryDifficultySignal.total}题，是当前有证据支持的主要薄弱层。`
      : null
  const controlledKeyIssue = sequenceSignal
    ? `后段第${sequenceSignal.lateQuestionNumbers[0]}—${sequenceSignal.lateQuestionNumbers.at(-1)}题答对 ${sequenceSignal.lateCorrect}/${sequenceSignal.lateTotal} 题，相比前段 ${sequenceSignal.earlyCorrect}/${sequenceSignal.earlyTotal} 明显下降。`
    : primaryDifficultySignal
    ? `${primaryDifficultySignal.difficultyLabel}答对 ${primaryDifficultySignal.correct}/${primaryDifficultySignal.total} 题，正确率 ${Math.round(primaryDifficultySignal.accuracy * 100)}%，是${primaryDifficultySignal.confidence === 'high' ? '高' : '中'}置信度薄弱层。`
    : null
  return {
    riskSignal: controlledRiskSignal || analysis?.riskSignal || buildFallbackModuleRiskSignal(module),
    diagnosticAnalysis: {
      summary: analysis?.summary || fallback.summary,
      strength: analysis?.strength || fallback.strength,
      keyIssue: controlledKeyIssue || analysis?.keyIssue || fallback.keyIssue,
      focusSuggestion: analysis?.focusSuggestion || fallback.focusSuggestion,
      source,
    },
  }
}

// 报告标题只使用本次 Paper 元数据，避免沿用原型中的固定考试名称。
function buildTitle(paper: PaperInput): string {
  let title = paper.title.trim()
  if (!title.toUpperCase().includes('ESAT')) title = `ESAT ${title}`
  if (!title.includes(String(paper.year))) title = `${title} ${paper.year}`
  return `${title} · 成绩报告`
}

// TMUA 综合定位只使用 UAT-UK 已公开的 4.5 典型分与 7.0 高分锚点，不插值虚构中间百分位。
function buildTmuaOverallPositioning(score: number): AssessmentPositioning {
  const aboveTopDecileAnchor = score > 7
  const atOrAboveTypical = score >= 4.5
  return {
    percentileValue: null,
    percentileLabel: aboveTopDecileAnchor ? '约前 10% 区间' : '官方未公布精确排名',
    performanceLevel: aboveTopDecileAnchor
      ? '高于官方 7.0 锚点'
      : atOrAboveTypical
        ? '达到或高于典型分'
        : '低于典型分锚点',
    competitiveness: `当前综合参考分为 ${score.toFixed(1)}；需要结合 Paper 1 与 Paper 2 的作答证据判断下一步优先项。`,
    cohortReference: 'UAT-UK 2025/26：典型考生约 4.5 分，约 10% 考生高于 7.0 分；官方不提供其他分数的精确百分位。',
    limitedData: true,
  }
}

// UAT-UK 不发布分卷成绩，Paper 1/2 只保留平台诊断定位，不映射官方百分位。
function buildTmuaPaperPositioning(score: number): AssessmentPositioning {
  return {
    percentileValue: null,
    percentileLabel: '不提供分卷排名',
    performanceLevel: '平台分卷诊断',
    competitiveness: `当前分卷诊断参考分为 ${score.toFixed(1)}，仅用于比较两卷表现与定位训练重点。`,
    cohortReference: 'UAT-UK 正式成绩只报告 Paper 1 与 Paper 2 联合等值后的单一综合分。',
    limitedData: true,
  }
}

// TMUA 分卷按实际题量归一到标准 20 题后换算，诊断分析仍保留原始正确数作为证据。
function buildTmuaModule(id: string, questions: ReportQuestionInput[]): AssessmentModule {
  const paper = id === 'paper2' ? 'paper2' : 'paper1'
  const correct = questions.filter((question) => question.isCorrect).length
  const score = quickTmuaPaperScore(paper, correct, questions.length)
  const range = ratioRange(correct, questions.length)
  const scoreRange: [number, number] = [
    quickTmuaPaperScore(paper, range[0] * questions.length, questions.length),
    quickTmuaPaperScore(paper, range[1] * questions.length, questions.length),
  ]
  const scoringBasis = questions.length === 20 ? 'standard' as const : 'normalized' as const
  return {
    id,
    label: TMUA_MODULE_LABELS[id] || id,
    correct,
    total: questions.length,
    score,
    scoreRange,
    scaleLabel: '/ 9.0',
    summary: `本卷答对 ${correct}/${questions.length} 题，诊断参考分 ${score.toFixed(1)}。`,
    positioning: buildTmuaPaperPositioning(score),
    difficultyMastery: buildDifficultyMastery(questions),
    scoringBasis,
    equivalentRawScore: questions.length ? round1((correct / questions.length) * 20) : 0,
    notice: scoringBasis === 'normalized'
      ? `本卷为 ${questions.length} 题非标准题量，已按正确率归一为 /20 等效原始分。`
      : null,
  }
}

// TMUA 报告标题保持考试名称、试卷元数据和年份一致。
function buildTmuaTitle(paper: PaperInput): string {
  let title = paper.title.trim()
  if (!title.toUpperCase().includes('TMUA')) title = `TMUA ${title}`
  if (!title.includes(String(paper.year))) title = `${title} ${paper.year}`
  return `${title} · 诊断报告`
}

// 总体概览以完成节奏、时间效率和模块效率组织，所有数值均由答题记录确定性计算。
function buildOverview(
  questions: ReportQuestionInput[],
  paper: PaperInput,
  elapsedDurationSeconds: number | null | undefined,
  context: DiagnosticExamContext = ESAT_CONTEXT,
): ReportOverview {
  const totalQuestions = questions.length
  const correct = questions.filter((question) => question.isCorrect).length
  const unanswered = questions.filter((question) => !question.isAnswered).length
  const wrong = Math.max(0, totalQuestions - correct - unanswered)
  const plannedDurationSeconds = paper.duration && paper.duration > 0 ? paper.duration * 60 : null
  const totalDurationSeconds = typeof elapsedDurationSeconds === 'number' && elapsedDurationSeconds >= 0
    ? Math.round(elapsedDurationSeconds)
    : null
  const timedQuestions = questions.filter(
    (question) => typeof question.durationSeconds === 'number' && question.durationSeconds > 0,
  )
  const attemptedQuestionCount = questions.filter((question) => (
    question.isAnswered
    || question.answerState === 'skipped'
    || (question.durationSeconds || 0) > 0
  )).length
  const recordedDurationSeconds = questions.reduce(
    (sum, question) => sum + Math.max(0, question.durationSeconds || 0),
    0,
  )
  const timingCoverage = totalQuestions ? timedQuestions.length / totalQuestions : 0
  const durationRatio = totalDurationSeconds && totalDurationSeconds > 0
    ? recordedDurationSeconds / totalDurationSeconds
    : 0
  const hasTimingBaseline = Boolean(plannedDurationSeconds && totalDurationSeconds && totalDurationSeconds > 0)
  const hasReferenceTiming = Boolean(hasTimingBaseline && timingCoverage >= 0.3)
  const detailedTimingReliable = Boolean(
    plannedDurationSeconds
    && totalDurationSeconds
    && timingCoverage >= 0.8
    && durationRatio >= 0.7
    && durationRatio <= 1.15,
  )
  const analysisLevel = detailedTimingReliable
    ? 'complete' as const
    : hasReferenceTiming
      ? 'reference' as const
      : 'unavailable' as const
  const pacingStatus = !hasTimingBaseline
    ? 'unavailable' as const
    : totalDurationSeconds! > plannedDurationSeconds!
      ? 'overtime' as const
      : attemptedQuestionCount < totalQuestions
        ? 'incomplete' as const
        : 'within_limit' as const
  const baselineTargetDurationSeconds = plannedDurationSeconds && totalQuestions
    ? plannedDurationSeconds / totalQuestions
    : null
  const totalTimingWeight = questions.reduce((sum, question) => sum + timingWeight(question), 0)
  const expectedDurationFor = (question: ReportQuestionInput): number => (
    plannedDurationSeconds && totalTimingWeight > 0
      ? (plannedDurationSeconds * timingWeight(question)) / totalTimingWeight
      : 0
  )
  const quadrantCounts = {
    fast_correct: 0,
    slow_correct: 0,
    fast_wrong: 0,
    slow_wrong: 0,
  }
  const moduleGroups = new Map<string, Array<{ question: ReportQuestionInput; expectedDurationSeconds: number }>>()

  for (const [index, question] of questions.entries()) {
    const expectedDurationSeconds = expectedDurationFor(question)
    const durationSeconds = Math.max(0, question.durationSeconds || 0)
    if (durationSeconds > 0 && question.isAnswered && expectedDurationSeconds > 0) {
      const speed = durationSeconds <= expectedDurationSeconds ? 'fast' : 'slow'
      const outcome = question.isCorrect ? 'correct' : 'wrong'
      const quadrantKey = `${speed}_${outcome}` as keyof typeof quadrantCounts
      quadrantCounts[quadrantKey] += 1
    }
    const moduleId = context.resolveModule(question, index, questions.length)
    const group = moduleGroups.get(moduleId) || []
    group.push({ question, expectedDurationSeconds })
    moduleGroups.set(moduleId, group)
  }
  const efficiencySampleCount = Object.values(quadrantCounts).reduce((sum, count) => sum + count, 0)
  const modules = Array.from(moduleGroups.entries())
    .map(([id, items]) => {
      const timedItems = items.filter((item) => (item.question.durationSeconds || 0) > 0)
      const actualDurationSeconds = timedItems.reduce(
        (sum, item) => sum + Math.max(0, item.question.durationSeconds || 0),
        0,
      )
      const plannedDurationSecondsForModule = items.reduce(
        (sum, item) => sum + item.expectedDurationSeconds,
        0,
      )
      const actualAverageDurationSeconds = timedItems.length
        ? actualDurationSeconds / timedItems.length
        : null
      const expectedAverageDurationSeconds = items.length
        ? plannedDurationSecondsForModule / items.length
        : null
      return {
        id,
        label: context.moduleLabels[id] || id,
        actualDurationSeconds: Math.round(actualDurationSeconds),
        plannedDurationSeconds: Math.round(plannedDurationSecondsForModule),
        totalQuestions: items.length,
        timedQuestionCount: timedItems.length,
        correct: items.filter((item) => item.question.isCorrect).length,
        accuracy: items.length ? round1(items.filter((item) => item.question.isCorrect).length / items.length) : null,
        timeEfficiencyIndex: actualAverageDurationSeconds && expectedAverageDurationSeconds
          ? round1(actualAverageDurationSeconds / expectedAverageDurationSeconds)
          : null,
      }
    })
    .sort((a, b) => context.moduleOrder.indexOf(a.id) - context.moduleOrder.indexOf(b.id))

  return {
    totalQuestions,
    correct,
    wrong,
    unanswered,
    accuracy: totalQuestions ? correct / totalQuestions : null,
    timing: {
      totalDurationSeconds,
      plannedDurationSeconds,
      detailedTimingReliable,
      analysisLevel,
      pacingStatus,
      attemptedQuestionCount,
      timedQuestionCount: timedQuestions.length,
      timingCoverage: Math.round(timingCoverage * 1000) / 1000,
      efficiencySampleCount,
      targetDurationSeconds: baselineTargetDurationSeconds === null ? null : Math.round(baselineTargetDurationSeconds),
      averageDurationSeconds: analysisLevel !== 'unavailable' && timedQuestions.length
        ? Math.round(recordedDurationSeconds / timedQuestions.length)
        : null,
      overtimeQuestionCount: analysisLevel !== 'unavailable'
        ? questions.filter((question) => (
            (question.durationSeconds || 0) > expectedDurationFor(question)
          )).length
        : null,
      quadrants: [
        { id: 'fast_correct', count: quadrantCounts.fast_correct },
        { id: 'slow_correct', count: quadrantCounts.slow_correct },
        { id: 'fast_wrong', count: quadrantCounts.fast_wrong },
        { id: 'slow_wrong', count: quadrantCounts.slow_wrong },
      ],
      modules,
    },
  }
}

// 知识点掌握度沿用题库的模块、topic、knowledgePoints 三级编码，并优先使用当前考纲节点名称。
function buildKnowledgeMastery(
  questions: ReportQuestionInput[],
  syllabusNodes: Array<{ code: string; label: string }>,
  context: DiagnosticExamContext = ESAT_CONTEXT,
): ReportKnowledgeMastery {
  const syllabusLabels = new Map(syllabusNodes.map((node) => [node.code, node.label]))
  const moduleGroups = new Map<string, ReportQuestionInput[]>()
  for (const [index, question] of questions.entries()) {
    const moduleId = context.resolveModule(question, index, questions.length)
    const group = moduleGroups.get(moduleId) || []
    group.push(question)
    moduleGroups.set(moduleId, group)
  }

  const modules = Array.from(moduleGroups.entries())
    .map(([moduleId, moduleQuestions]) => {
      const topicGroups = new Map<string, ReportQuestionInput[]>()
      for (const question of moduleQuestions) {
        const topicCode = question.topicCode?.trim() || `${moduleId}-unmapped`
        const group = topicGroups.get(topicCode) || []
        group.push(question)
        topicGroups.set(topicCode, group)
      }

      const topics = Array.from(topicGroups.entries()).map(([topicCode, topicQuestions]) => {
        const childGroups = new Map<string, { label: string; questions: ReportQuestionInput[] }>()
        for (const question of topicQuestions) {
          for (const point of question.knowledgePoints || []) {
            if (!point.code?.trim()) continue
            const group = childGroups.get(point.code) || {
              label: syllabusLabels.get(point.code) || point.label || point.code,
              questions: [],
            }
            group.questions.push(question)
            childGroups.set(point.code, group)
          }
        }
        const children = Array.from(childGroups.entries())
          .map(([code, group]) => {
            const correct = group.questions.filter((question) => question.isCorrect).length
            return {
              code,
              label: group.label,
              correct,
              total: group.questions.length,
              accuracy: group.questions.length ? correct / group.questions.length : null,
            }
          })
          .sort((a, b) => a.code.localeCompare(b.code))
        const correct = topicQuestions.filter((question) => question.isCorrect).length
        const topicFallback = topicQuestions.find((question) => question.topic?.trim())?.topic
        return {
          code: topicCode,
          label: syllabusLabels.get(topicCode) || topicFallback || '未映射二级知识点',
          knowledgePointCount: children.length,
          correct,
          total: topicQuestions.length,
          accuracy: topicQuestions.length ? correct / topicQuestions.length : null,
          children,
        }
      }).sort((a, b) => a.code.localeCompare(b.code))
      const correct = moduleQuestions.filter((question) => question.isCorrect).length
      return {
        id: moduleId,
        label: context.moduleLabels[moduleId] || moduleId,
        knowledgePointCount: new Set(topics.flatMap((topic) => topic.children.map((child) => child.code))).size,
        correct,
        total: moduleQuestions.length,
        accuracy: moduleQuestions.length ? correct / moduleQuestions.length : null,
        topics,
      }
    })
    .sort((a, b) => context.moduleOrder.indexOf(a.id) - context.moduleOrder.indexOf(b.id))

  return { modules }
}

type AiMatrixRow = ReportAiImprovementPlan['matrix'][number]
type RoiCandidate = Omit<
  ReportAiImprovementPlan['highRoiGaps'][number],
  | 'rank'
  | 'priorityReason'
  | 'prerequisiteCheck'
  | 'examFocus'
  | 'questionNumbers'
  | 'reviewGuidance'
  | 'possibleErrorPatterns'
  | 'analysisSource'
> & {
  gapKey: string
}
type LearningFocusGap = ReportAiImprovementPlan['highRoiGaps'][number] & { gapKey: string }
type ImprovementEvidence = {
  matrix: ReportAiImprovementPlan['matrix']
  weaknessProfile: ReportWeaknessProfile
}

// 矩阵颜色严格按样本量和正确率阈值计算，不让模型改变统计结论。
function matrixStatus(total: number, accuracy: number | null): AiMatrixRow['cells'][number]['status'] {
  if (total < 5 || accuracy === null) return 'insufficient'
  if (accuracy > 0.7) return 'strong'
  if (accuracy >= 0.4) return 'medium'
  return 'weak'
}

// 能力矩阵按二级 topic 与三档难度交叉聚合，只使用本次试卷的实际题目。
function buildAbilityMatrix(
  questions: ReportQuestionInput[],
  syllabusNodes: Array<{ code: string; label: string }>,
  context: DiagnosticExamContext = ESAT_CONTEXT,
): ReportAiImprovementPlan['matrix'] {
  const syllabusLabels = new Map(syllabusNodes.map((node) => [node.code, node.label]))
  const topicGroups = new Map<string, { moduleId: string; label: string; questions: ReportQuestionInput[] }>()
  for (const [index, question] of questions.entries()) {
    const moduleId = context.resolveModule(question, index, questions.length)
    const topicCode = question.topicCode?.trim() || `${moduleId}-unmapped`
    const key = `${moduleId}:${topicCode}`
    const group = topicGroups.get(key) || {
      moduleId,
      label: syllabusLabels.get(topicCode) || question.topic?.trim() || '未映射二级知识点',
      questions: [],
    }
    group.questions.push(question)
    topicGroups.set(key, group)
  }

  return Array.from(topicGroups.entries())
    .map(([key, group]) => {
      const topicCode = key.slice(key.indexOf(':') + 1)
      const cells = (Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map((difficulty) => {
        const items = group.questions.filter((question) => normalizeDifficulty(question.difficulty) === difficulty)
        const correct = items.filter((question) => question.isCorrect).length
        const accuracy = items.length ? correct / items.length : null
        return {
          difficulty,
          label: DIFFICULTY_LABELS[difficulty],
          correct,
          total: items.length,
          accuracy,
          status: matrixStatus(items.length, accuracy),
        }
      })
      return {
        code: topicCode,
        label: group.label,
        moduleId: group.moduleId,
        moduleLabel: context.moduleLabels[group.moduleId] || group.moduleId,
        cells,
      }
    })
    .sort((a, b) => {
      const moduleDiff = context.moduleOrder.indexOf(a.moduleId) - context.moduleOrder.indexOf(b.moduleId)
      return moduleDiff || a.code.localeCompare(b.code)
    })
}

// 模块置信度只由本次实际覆盖题量决定，避免模型根据分数高低自行升级结论。
function moduleSignalConfidence(total: number, sufficientTotal: number, maxModuleTotal: number) {
  if (total >= Math.ceil(maxModuleTotal * 0.75)) return 'high' as const
  if (total >= sufficientTotal) return 'medium' as const
  return 'low' as const
}

// 难度置信度同时考虑最低证据线和本科覆盖比例，完整主难度层可进入高置信度。
function difficultySignalConfidence(total: number, sufficientTotal: number, moduleTotal: number) {
  if (total >= Math.max(sufficientTotal, Math.ceil(moduleTotal * 0.4))) return 'high' as const
  if (total >= sufficientTotal) return 'medium' as const
  return 'low' as const
}

// 程序先按考试结构生成统一短板画像，DeepSeek 和所有页面只能消费这组确定性结论。
function buildWeaknessProfile(
  questions: ReportQuestionInput[],
  matrix: ReportAiImprovementPlan['matrix'],
  context: DiagnosticExamContext,
): ReportWeaknessProfile {
  const groupedQuestions = new Map<string, ReportQuestionInput[]>()
  questions.forEach((question, index) => {
    const moduleId = context.resolveModule(question, index, questions.length)
    const group = groupedQuestions.get(moduleId) || []
    group.push(question)
    groupedQuestions.set(moduleId, group)
  })
  const moduleFacts = Array.from(groupedQuestions.entries()).map(([moduleId, items]) => {
    const correct = items.filter((question) => question.isCorrect).length
    return {
      moduleId,
      moduleLabel: context.moduleLabels[moduleId] || moduleId,
      correct,
      total: items.length,
      accuracy: items.length ? correct / items.length : 0,
    }
  })
  const rankedModules = [...moduleFacts].sort((left, right) => (
    left.accuracy - right.accuracy || right.total - left.total || left.moduleId.localeCompare(right.moduleId)
  ))
  const rankById = new Map(rankedModules.map((module, index) => [module.moduleId, index + 1]))
  const maxModuleTotal = Math.max(0, ...moduleFacts.map((module) => module.total))
  const sufficientTotal = Math.max(6, Math.ceil(maxModuleTotal * 0.4))
  const tmuaStandardEqual = context.examType === 'TMUA'
    && moduleFacts.length === 2
    && moduleFacts.every((module) => module.moduleId !== 'unclassified')
    && moduleFacts.every((module) => module.total === TMUA_EXPECTED_QUESTION_COUNT)
  const examPolicy: ReportWeaknessProfile['examPolicy'] = context.examType === 'ESAT'
    ? 'ESAT_VARIABLE_MODULES'
    : tmuaStandardEqual
      ? 'TMUA_STANDARD_EQUAL'
      : 'GENERIC_DYNAMIC'

  const moduleSignals: ReportModuleWeaknessSignal[] = []
  if (tmuaStandardEqual) {
    for (const module of rankedModules) {
      if (module.accuracy > 0.6) continue
      const other = rankedModules.find((candidate) => candidate.moduleId !== module.moduleId)
      moduleSignals.push({
        ...module,
        level: 'clear',
        confidence: 'high',
        rank: rankById.get(module.moduleId) || 1,
        gapToNext: other ? Math.max(0, other.accuracy - module.accuracy) : null,
      })
    }
    if (!moduleSignals.length && rankedModules.length === 2) {
      const [weakest, other] = rankedModules
      const gap = other.accuracy - weakest.accuracy
      if (weakest.accuracy > 0.6 && gap >= 0.12) {
        moduleSignals.push({
          ...weakest,
          level: 'relative',
          confidence: 'high',
          rank: 1,
          gapToNext: gap,
        })
      }
    }
  } else {
    for (const module of rankedModules) {
      const rank = rankById.get(module.moduleId) || 1
      const next = rankedModules[rank]
      const gapToNext = rank === 1 && next ? next.accuracy - module.accuracy : null
      const hasSufficientTotal = module.total >= sufficientTotal
      const absoluteSignal = hasSufficientTotal && module.accuracy <= 0.6
      const relativeSignal = rank === 1 && hasSufficientTotal && (gapToNext || 0) >= 0.12
      const level = module.accuracy <= 0.5 || (absoluteSignal && relativeSignal)
        ? 'clear' as const
        : relativeSignal
          ? 'relative' as const
          : null
      if (!level) continue
      moduleSignals.push({
        ...module,
        level,
        confidence: moduleSignalConfidence(module.total, sufficientTotal, maxModuleTotal),
        rank,
        gapToNext,
      })
    }
  }
  moduleSignals.sort((left, right) => (
    Number(left.level !== 'clear') - Number(right.level !== 'clear')
    || left.accuracy - right.accuracy
    || right.total - left.total
  ))

  const difficultySignals: ReportDifficultyWeaknessSignal[] = []
  for (const module of moduleFacts) {
    const items = groupedQuestions.get(module.moduleId) || []
    const difficultyFacts = (Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[])
      .map((difficulty) => {
        const difficultyItems = items.filter((question) => normalizeDifficulty(question.difficulty) === difficulty)
        const correct = difficultyItems.filter((question) => question.isCorrect).length
        return {
          difficulty,
          difficultyLabel: DIFFICULTY_LABELS[difficulty],
          correct,
          total: difficultyItems.length,
          accuracy: difficultyItems.length ? correct / difficultyItems.length : 0,
          wrongCount: difficultyItems.length - correct,
        }
      })
      .filter((item) => item.total > 0)
    const weakestDifficulty = [...difficultyFacts].sort((left, right) => (
      left.accuracy - right.accuracy || right.wrongCount - left.wrongCount || right.total - left.total
    ))[0]
    const sufficientDifficultyTotal = Math.max(3, Math.ceil(module.total * 0.15))
    for (const item of difficultyFacts) {
      const enough = item.total >= sufficientDifficultyTotal && item.wrongCount >= 2
      const level = enough && item.accuracy <= 0.5
        ? 'clear' as const
        : enough && item.accuracy <= 0.6 && item.difficulty === weakestDifficulty?.difficulty
          ? 'relative' as const
          : null
      if (!level) continue
      difficultySignals.push({
        moduleId: module.moduleId,
        moduleLabel: module.moduleLabel,
        ...item,
        level,
        confidence: difficultySignalConfidence(item.total, sufficientDifficultyTotal, module.total),
      })
    }
  }
  difficultySignals.sort((left, right) => (
    Number(left.level !== 'clear') - Number(right.level !== 'clear')
    || Number(left.moduleId !== moduleSignals[0]?.moduleId) - Number(right.moduleId !== moduleSignals[0]?.moduleId)
    || left.accuracy - right.accuracy
    || right.wrongCount - left.wrongCount
  ))

  // 前后段信号只描述可观察的正确率断层，不把题目位置直接归因为疲劳、时间不足或能力缺失。
  const sequenceSignals: ReportWeaknessProfile['sequenceSignals'] = []
  for (const module of moduleFacts) {
    const orderedItems = [...(groupedQuestions.get(module.moduleId) || [])].sort((left, right) => (
      (left.moduleQuestionNumber ?? left.number) - (right.moduleQuestionNumber ?? right.number)
    ))
    if (orderedItems.length < 10) continue
    const lateTotal = Math.max(4, Math.ceil(orderedItems.length * 0.3))
    const earlyItems = orderedItems.slice(0, -lateTotal)
    const lateItems = orderedItems.slice(-lateTotal)
    if (earlyItems.length < 6) continue
    const earlyCorrect = earlyItems.filter((question) => question.isCorrect).length
    const lateCorrect = lateItems.filter((question) => question.isCorrect).length
    const earlyAccuracy = earlyCorrect / earlyItems.length
    const lateAccuracy = lateCorrect / lateItems.length
    const accuracyGap = earlyAccuracy - lateAccuracy
    const lateWrongCount = lateItems.length - lateCorrect
    if (lateAccuracy >= 0.5 || accuracyGap < 0.3 || lateWrongCount < 3) continue
    sequenceSignals.push({
      kind: 'late_section_drop',
      moduleId: module.moduleId,
      moduleLabel: module.moduleLabel,
      level: 'clear',
      confidence: orderedItems.length >= 20 && accuracyGap >= 0.5 ? 'high' : 'medium',
      splitAfter: earlyItems.length,
      earlyCorrect,
      earlyTotal: earlyItems.length,
      earlyAccuracy,
      lateCorrect,
      lateTotal: lateItems.length,
      lateAccuracy,
      accuracyGap,
      lateQuestionNumbers: lateItems.map((question) => question.moduleQuestionNumber ?? question.number),
    })
  }
  sequenceSignals.sort((left, right) => (
    right.accuracyGap - left.accuracyGap
    || right.lateTotal - left.lateTotal
    || left.moduleId.localeCompare(right.moduleId)
  ))

  const topicSignals: ReportTopicWeaknessSignal[] = []
  const calibrationSignals: ReportTopicWeaknessSignal[] = []
  for (const row of matrix) {
    const correct = row.cells.reduce((sum, cell) => sum + cell.correct, 0)
    const total = row.cells.reduce((sum, cell) => sum + cell.total, 0)
    const wrongCount = total - correct
    if (!total || !wrongCount) continue
    const module = moduleFacts.find((item) => item.moduleId === row.moduleId)
    const moduleWrongCount = module ? module.total - module.correct : 0
    const wrongShareInModule = moduleWrongCount > 0 ? wrongCount / moduleWrongCount : 0
    const primaryCell = [...row.cells]
      .filter((cell) => cell.total > 0 && cell.accuracy !== null)
      .sort((left, right) => (
        (right.total - right.correct) - (left.total - left.correct)
        || (left.accuracy || 0) - (right.accuracy || 0)
        || right.total - left.total
      ))[0]
    if (!primaryCell) continue
    const accuracy = correct / total
    const highConfidence = total >= 5 && wrongCount >= 3 && accuracy <= 0.5
    const mediumConfidence = total >= 3
      && wrongCount >= 2
      && (accuracy <= 0.6 || wrongShareInModule >= 0.3)
    const signal: ReportTopicWeaknessSignal = {
      moduleId: row.moduleId,
      moduleLabel: row.moduleLabel,
      topicCode: row.code,
      topicLabel: row.label,
      level: highConfidence || mediumConfidence ? 'clear' : 'calibration',
      confidence: highConfidence ? 'high' : mediumConfidence ? 'medium' : 'low',
      correct,
      total,
      accuracy,
      wrongCount,
      wrongShareInModule,
      primaryDifficulty: primaryCell.difficulty,
      primaryDifficultyLabel: primaryCell.label,
    }
    if (highConfidence || mediumConfidence) topicSignals.push(signal)
    else if (total <= 2) calibrationSignals.push(signal)
  }
  const topicSort = (left: ReportTopicWeaknessSignal, right: ReportTopicWeaknessSignal) => (
    Number(left.confidence !== 'high') - Number(right.confidence !== 'high')
    || Number(left.moduleId !== moduleSignals[0]?.moduleId) - Number(right.moduleId !== moduleSignals[0]?.moduleId)
    || right.wrongShareInModule - left.wrongShareInModule
    || right.wrongCount - left.wrongCount
    || left.accuracy - right.accuracy
  )
  topicSignals.sort(topicSort)
  calibrationSignals.sort(topicSort)
  const hasConfirmedWeakness = moduleSignals.length > 0
    || difficultySignals.length > 0
    || topicSignals.length > 0
    || sequenceSignals.length > 0
  const totalWrong = moduleFacts.reduce((sum, module) => sum + module.total - module.correct, 0)
  const diagnosisMode: ReportWeaknessProfile['diagnosisMode'] = hasConfirmedWeakness
    ? 'weakness_attack'
    : totalWrong > 0
      ? 'balanced_improvement'
      : 'stable_progress'
  return {
    examPolicy,
    diagnosisMode,
    primaryModule: moduleSignals[0] || null,
    moduleSignals,
    difficultySignals,
    topicSignals,
    calibrationSignals,
    sequenceSignals,
  }
}

// 矩阵与短板画像在模型调用前一次性计算，确保模块文案、优先级和页面展示引用同一快照。
function buildImprovementEvidence(
  questions: ReportQuestionInput[],
  syllabusNodes: Array<{ code: string; label: string }>,
  context: DiagnosticExamContext,
): ImprovementEvidence {
  const matrix = buildAbilityMatrix(questions, syllabusNodes, context)
  return { matrix, weaknessProfile: buildWeaknessProfile(questions, matrix, context) }
}

// 行为测试通过公开入口验证 ESAT/TMUA 策略，不暴露内部考试上下文对象。
export function buildWeaknessProfileForQuestions(
  questions: ReportQuestionInput[],
  syllabusNodes: Array<{ code: string; label: string }>,
  examType: 'ESAT' | 'TMUA',
): ReportWeaknessProfile {
  const context = examType === 'TMUA' ? TMUA_CONTEXT : ESAT_CONTEXT
  return buildImprovementEvidence(questions, syllabusNodes, context).weaknessProfile
}

// 建议投入区间由缺口程度和题目难度固定映射，避免模型输出伪精确时长。
function suggestedHours(candidate: { difficulty: DifficultyLevel; accuracy: number }): string {
  if (candidate.accuracy < 0.4) {
    if (candidate.difficulty === 'high') return '3-5 小时'
    if (candidate.difficulty === 'medium') return '2-4 小时'
    return '2-3 小时'
  }
  if (candidate.difficulty === 'high') return '2-4 小时'
  if (candidate.difficulty === 'medium') return '2-3 小时'
  return '1-2 小时'
}

// 高 ROI 候选直接读取跨难度聚合后的中高置信度知识点，不再依赖单个矩阵格固定五题。
function selectRoiCandidates(profile: ReportWeaknessProfile): RoiCandidate[] {
  return profile.topicSignals.slice(0, 5).map((signal) => ({
    gapKey: `${signal.moduleId}:${signal.topicCode}:topic`,
    topicCode: signal.topicCode,
    topicLabel: signal.topicLabel,
    moduleId: signal.moduleId,
    moduleLabel: signal.moduleLabel,
    difficulty: signal.primaryDifficulty,
    difficultyLabel: signal.primaryDifficultyLabel,
    correct: signal.correct,
    total: signal.total,
    accuracy: signal.accuracy,
    confidence: signal.confidence === 'high' ? 'high' : 'medium',
    evidenceScope: 'topic',
    suggestedHours: suggestedHours({
      difficulty: signal.primaryDifficulty,
      accuracy: signal.accuracy,
    }),
  }))
}

// 降级原因只引用矩阵中的真实数据，保证模型不可用时仍能解释优先级。
function fallbackPriorityReason(candidate: RoiCandidate): string {
  const accuracy = Math.round(candidate.accuracy * 100)
  const confidenceLabel = candidate.confidence === 'high' ? '高置信度' : '中置信度'
  return `该知识点跨难度样本量 n=${candidate.total}，正确率 ${accuracy}%，属于${confidenceLabel}集中失分方向。`
}

// DeepSeek 只润色已选候选项的原因和前置检查，不参与分数、排序或投入时长计算。
async function generateRoiNarratives(
  candidates: RoiCandidate[],
  context: DiagnosticExamContext = ESAT_CONTEXT,
): Promise<Map<string, {
  priorityReason: string
  prerequisiteCheck: string
}>> {
  if (!candidates.length) return new Map()
  const payload = candidates.map((candidate) => ({
    gapKey: candidate.gapKey,
    topicLabel: candidate.topicLabel,
    moduleLabel: candidate.moduleLabel,
    difficultyLabel: candidate.difficultyLabel,
    correct: candidate.correct,
    total: candidate.total,
    accuracyPercent: Math.round(candidate.accuracy * 100),
    confidence: candidate.confidence,
    evidenceScope: candidate.evidenceScope,
    requiredCitation: `正确率 ${Math.round(candidate.accuracy * 100)}%，样本量 n=${candidate.total}`,
  }))
  const cacheKey = crypto.createHash('sha256').update(JSON.stringify({ examType: context.examType, payload })).digest('hex')
  const cached = roiCache.get(cacheKey)
  let generated = cached

  if (!generated) {
    try {
      const response = await requestDeepSeekJson<{ recommendations?: unknown }>(
        diagnosticReportPrompt('roi-narrative', context),
        { examType: context.examType, candidates: payload },
        { maxTokens: 900 },
      )
      if (!Array.isArray(response.data.recommendations)) throw new Error('Invalid ROI recommendations')
      generated = (response.data.recommendations as Array<Record<string, unknown>>)
        .map((item) => ({
          gapKey: typeof item.gapKey === 'string' ? item.gapKey : '',
          priorityReason: typeof item.priorityReason === 'string' ? item.priorityReason.trim() : '',
          prerequisiteCheck: typeof item.prerequisiteCheck === 'string' ? item.prerequisiteCheck.trim() : '',
        }))
      roiCache.set(cacheKey, generated)
      console.info('[diagnostic-report] ROI narratives generated', {
        examType: context.examType,
        model: response.model,
        totalTokens: response.usage.totalTokens,
      })
    } catch (error) {
      console.error(`[${context.examType.toLowerCase()}-diagnostic] ROI narratives unavailable:`, error)
      generated = []
    }
  }

  const candidateMap = new Map(candidates.map((candidate) => [candidate.gapKey, candidate]))
  const result = new Map<string, { priorityReason: string; prerequisiteCheck: string }>()
  for (const item of generated) {
    const candidate = candidateMap.get(item.gapKey)
    if (!candidate) continue
    const requiredCitation = `正确率 ${Math.round(candidate.accuracy * 100)}%，样本量 n=${candidate.total}`
    if (
      item.priorityReason.length > 90
      || !item.priorityReason.includes(requiredCitation)
      || !item.prerequisiteCheck
      || item.prerequisiteCheck.length > 50
    ) continue
    result.set(item.gapKey, {
      priorityReason: item.priorityReason,
      prerequisiteCheck: item.prerequisiteCheck,
    })
  }
  return result
}

// AI 提升规划先完成确定性矩阵和候选排序，再合并模型文案或安全降级文案。
async function buildAiImprovementPlan(
  questions: ReportQuestionInput[],
  syllabusNodes: Array<{ code: string; label: string }>,
  context: DiagnosticExamContext = ESAT_CONTEXT,
  evidence?: ImprovementEvidence,
): Promise<ReportAiImprovementPlan> {
  const resolvedEvidence = evidence || buildImprovementEvidence(questions, syllabusNodes, context)
  const { matrix, weaknessProfile } = resolvedEvidence
  const candidates = selectRoiCandidates(weaknessProfile)
  if (!candidates.length) {
    return { weaknessProfile, matrix, highRoiGaps: [], analysisStatus: 'not-needed' }
  }

  const narratives = await generateRoiNarratives(candidates, context)
  const highRoiGaps = candidates.map((candidate, index) => {
    const narrative = narratives.get(candidate.gapKey)
    const learningInsights = learningInsightsForTopic(
      questions,
      candidate.moduleId,
      candidate.topicCode,
      null,
      context,
    )
    return {
      rank: index + 1,
      topicCode: candidate.topicCode,
      topicLabel: candidate.topicLabel,
      moduleId: candidate.moduleId,
      moduleLabel: candidate.moduleLabel,
      difficulty: candidate.difficulty,
      difficultyLabel: candidate.difficultyLabel,
      correct: candidate.correct,
      total: candidate.total,
      accuracy: candidate.accuracy,
      confidence: candidate.confidence,
      evidenceScope: candidate.evidenceScope,
      suggestedHours: candidate.suggestedHours,
      priorityReason: narrative?.priorityReason || fallbackPriorityReason(candidate),
      prerequisiteCheck: narrative?.prerequisiteCheck || '先复盘本格错题，并检查该知识点的基础定义与核心公式。',
      examFocus: learningInsights.examFocus,
      questionNumbers: learningInsights.questionNumbers,
      reviewGuidance: learningInsights.reviewGuidance,
      possibleErrorPatterns: learningInsights.possibleErrorPatterns,
      analysisSource: narrative ? 'deepseek' as const : 'fallback' as const,
    }
  })
  return {
    weaknessProfile,
    matrix,
    highRoiGaps,
    analysisStatus: highRoiGaps.every((gap) => gap.analysisSource === 'deepseek') ? 'generated' : 'fallback',
  }
}

// 相同考点与难度下的错题复用题库已有学习分析，并始终以“建议核对”而非确定成因呈现。
function learningInsightsForTopic(
  questions: ReportQuestionInput[],
  moduleId: string,
  topicCode: string,
  difficulty: DifficultyLevel | null,
  context: DiagnosticExamContext = ESAT_CONTEXT,
): { examFocus: string[]; reviewGuidance: string[]; possibleErrorPatterns: string[]; questionNumbers: number[] } {
  const matched = questions.filter((question, index) => (
    !question.isCorrect
    && context.resolveModule(question, index, questions.length) === moduleId
    && (question.topicCode?.trim() || `${moduleId}-unmapped`) === topicCode
    && (difficulty === null || normalizeDifficulty(question.difficulty) === difficulty)
  ))
  const unique = (values: string[]): string[] => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
  return {
    examFocus: unique(matched.flatMap((question) => question.learningAnalysis?.examFocus || [])).slice(0, 2),
    reviewGuidance: unique(matched.flatMap((question) => question.learningAnalysis?.reviewGuidance || [])).slice(0, 3),
    possibleErrorPatterns: unique(matched.flatMap(
      (question) => question.learningAnalysis?.commonErrorCauses || [],
    )).slice(0, 3),
    questionNumbers: Array.from(new Set(matched.map((question) => question.number))).slice(0, 8),
  }
}

type ActionCandidate = {
  actionType: ReportNextAction['actionType']
  moduleId: string
  moduleLabel: string
  topicCode: string
  topicLabel: string
  difficulty: DifficultyLevel
  difficultyLabel: string
  correct: number
  total: number
  accuracy: number | null
  confidence?: 'high' | 'medium' | 'low'
  evidenceScope?: 'topic'
}

// 明确的后段断层优先生成跨知识点限时训练；否则再按知识点证据选择专项、校准或错题回收。
export function buildEsatNextAction(
  plan: ReportAiImprovementPlan,
  questions: ReportQuestionInput[],
  context: DiagnosticExamContext = ESAT_CONTEXT,
): ReportNextAction | null {
  const sequenceSignals = plan.weaknessProfile?.sequenceSignals || []
  if (sequenceSignals.length) {
    const lateQuestions = sequenceSignals.flatMap((signal) => {
      const moduleQuestions = questions
        .map((question, index) => ({ question, index }))
        .filter(({ question, index }) => context.resolveModule(question, index, questions.length) === signal.moduleId)
        .sort((left, right) => (
          (left.question.moduleQuestionNumber ?? left.question.number)
          - (right.question.moduleQuestionNumber ?? right.question.number)
        ))
      return moduleQuestions.slice(-signal.lateTotal).map(({ question }) => question)
    })
    const wrongLateQuestions = lateQuestions.filter((question) => !question.isCorrect)
    const difficultyCounts = new Map<DifficultyLevel, number>()
    wrongLateQuestions.forEach((question) => {
      const difficulty = normalizeDifficulty(question.difficulty) || 'medium'
      difficultyCounts.set(difficulty, (difficultyCounts.get(difficulty) || 0) + 1)
    })
    const difficulty = [...difficultyCounts.entries()]
      .sort((left, right) => right[1] - left[1])[0]?.[0] || 'medium'
    const knowledgePointCodes = Array.from(new Set(
      wrongLateQuestions
        .flatMap((question) => question.knowledgePoints || [])
        .map((point) => point.code?.trim())
        .filter((code): code is string => Boolean(code)),
    ))
    const topicCodes = Array.from(new Set(
      wrongLateQuestions
        .map((question) => question.topicCode?.trim())
        .filter((code): code is string => Boolean(code)),
    ))
    const moduleLabel = sequenceSignals.length > 1
      ? sequenceSignals.map((signal) => signal.moduleLabel.replace(/\s*·.*$/, '')).join(' 与 ')
      : sequenceSignals[0].moduleLabel
    const earlyCorrect = sequenceSignals.reduce((sum, signal) => sum + signal.earlyCorrect, 0)
    const earlyTotal = sequenceSignals.reduce((sum, signal) => sum + signal.earlyTotal, 0)
    const lateCorrect = sequenceSignals.reduce((sum, signal) => sum + signal.lateCorrect, 0)
    const lateTotal = sequenceSignals.reduce((sum, signal) => sum + signal.lateTotal, 0)
    const reviewGuidance = Array.from(new Set(
      wrongLateQuestions.flatMap((question) => question.learningAnalysis?.reviewGuidance || []),
    )).slice(0, 3)
    return {
      actionType: 'mixed_timed_practice',
      title: '强化后段：跨知识点限时训练',
      moduleId: sequenceSignals.length > 1 ? 'cross-module' : sequenceSignals[0].moduleId,
      moduleLabel,
      topicCode: 'late-section-mixed',
      topicLabel: '后段综合题稳定性',
      knowledgePointCodes: knowledgePointCodes.length ? knowledgePointCodes : topicCodes,
      difficulty,
      difficultyLabel: DIFFICULTY_LABELS[difficulty],
      evidence: {
        correct: lateCorrect,
        total: lateTotal,
        accuracy: lateTotal ? lateCorrect / lateTotal : null,
        confidence: sequenceSignals.every((signal) => signal.confidence === 'high') ? 'high' : 'medium',
        questionNumbers: Array.from(new Set(sequenceSignals.flatMap((signal) => signal.lateQuestionNumbers))),
      },
      whyNow: `${moduleLabel}前段合计答对 ${earlyCorrect}/${earlyTotal} 题，后段仅答对 ${lateCorrect}/${lateTotal} 题；当前最明确的共同失分特征是题目位置，而非单一知识点。`,
      suggestedMinutes: 25,
      suggestedQuestionCount: 6,
      successCriteria: '完成 6 道中高难度混合题并至少答对 4 道；连续两组达标后再回到整卷训练。',
      reviewGuidance,
      possibleErrorPatterns: [],
    }
  }

  const primaryGap = plan.highRoiGaps[0]
  let candidate: ActionCandidate | null = primaryGap
    ? {
        actionType: 'targeted_practice',
        moduleId: primaryGap.moduleId,
        moduleLabel: primaryGap.moduleLabel,
        topicCode: primaryGap.topicCode,
        topicLabel: primaryGap.topicLabel,
        difficulty: primaryGap.difficulty,
        difficultyLabel: primaryGap.difficultyLabel,
        correct: primaryGap.correct,
        total: primaryGap.total,
        accuracy: primaryGap.accuracy,
        confidence: primaryGap.confidence,
        evidenceScope: primaryGap.evidenceScope,
      }
    : null

  if (!candidate) {
    const observedCells = plan.matrix.flatMap((row) => row.cells
      .filter((cell) => (
        cell.total > 0
        && cell.accuracy !== null
        && (cell.total < 3 || cell.accuracy < 1)
      ))
      .map((cell) => ({
        actionType: cell.total < 5 ? 'calibration_test' as const : 'review_wrong' as const,
        moduleId: row.moduleId,
        moduleLabel: row.moduleLabel,
        topicCode: row.code,
        topicLabel: row.label,
        difficulty: cell.difficulty,
        difficultyLabel: cell.label,
        correct: cell.correct,
        total: cell.total,
        accuracy: cell.accuracy,
      })))
      .sort((left, right) => {
        const calibrationDiff = Number(left.actionType !== 'calibration_test') - Number(right.actionType !== 'calibration_test')
        const accuracyDiff = (left.accuracy ?? 1) - (right.accuracy ?? 1)
        return calibrationDiff || accuracyDiff || right.total - left.total
      })
    candidate = observedCells[0] || null
  }
  if (!candidate) return null

  const insights = learningInsightsForTopic(
    questions,
    candidate.moduleId,
    candidate.topicCode,
    candidate.evidenceScope === 'topic' ? null : candidate.difficulty,
    context,
  )
  const knowledgePointCodes = Array.from(new Set(
    questions
      .filter((question, index) => (
        context.resolveModule(question, index, questions.length) === candidate.moduleId
        && (question.topicCode?.trim() || `${candidate.moduleId}-unmapped`) === candidate.topicCode
        && (
          candidate.evidenceScope === 'topic'
          || normalizeDifficulty(question.difficulty) === candidate.difficulty
        )
      ))
      .flatMap((question) => question.knowledgePoints || [])
      .map((point) => point.code?.trim())
      .filter((code): code is string => Boolean(code) && code !== candidate.topicCode),
  ))
  const accuracyPercent = candidate.accuracy === null ? null : Math.round(candidate.accuracy * 100)
  const confidence = candidate.confidence
    || (candidate.total >= 5 ? 'high' : candidate.total >= 3 ? 'medium' : 'low')
  const title = candidate.actionType === 'calibration_test'
    ? `先校准：${candidate.topicLabel}`
    : candidate.actionType === 'review_wrong'
      ? `回收错题：${candidate.topicLabel}`
      : `先练这一项：${candidate.topicLabel}`
  const whyNow = candidate.actionType === 'calibration_test'
    ? `本次${candidate.difficultyLabel}只考查 ${candidate.total} 题，当前正确率${accuracyPercent === null ? '暂无' : `为 ${accuracyPercent}%`}，证据不足以直接判定强弱，先用小题组完成校准。`
    : `本次该知识点跨难度答对 ${candidate.correct}/${candidate.total} 题${accuracyPercent === null ? '' : `，正确率 ${accuracyPercent}%`}，是当前最值得先处理的可观察缺口。`
  const successCriteria = candidate.actionType === 'calibration_test'
    ? '完成 5 道校准题；达到 4/5 则转入巩固，否则进入专项补弱。'
    : '完成 5 道同考点训练并至少答对 4 道；未达标时回到相关错题复盘。'

  return {
    actionType: candidate.actionType,
    title,
    moduleId: candidate.moduleId,
    moduleLabel: candidate.moduleLabel,
    topicCode: candidate.topicCode,
    topicLabel: candidate.topicLabel,
    knowledgePointCodes: knowledgePointCodes.length ? knowledgePointCodes : [candidate.topicCode],
    difficulty: candidate.difficulty,
    difficultyLabel: candidate.difficultyLabel,
    evidence: {
      correct: candidate.correct,
      total: candidate.total,
      accuracy: candidate.accuracy,
      confidence,
      questionNumbers: insights.questionNumbers,
    },
    whyNow,
    suggestedMinutes: 20,
    suggestedQuestionCount: 5,
    successCriteria,
    reviewGuidance: insights.reviewGuidance,
    possibleErrorPatterns: insights.possibleErrorPatterns,
  }
}

// 目标专业只用于固定的科目方向加权，不推断院校门槛或知识点依赖关系。
function majorPreferredModules(targetMajor: string | null): string[] {
  const normalized = targetMajor?.trim().toLowerCase() || ''
  if (!normalized) return []
  if (/physics|engineering|工程|物理|mechanic|机械|electronic|电子/.test(normalized)) {
    return ['physics', 'maths2', 'maths1']
  }
  if (/computer|computing|计算机|数学|mathematics|data|数据/.test(normalized)) {
    return ['maths2', 'maths1', 'physics']
  }
  if (/medicine|medical|医学|biology|生物|chemistry|化学/.test(normalized)) {
    return ['biology', 'chemistry', 'maths1']
  }
  return []
}

// 备考科目名称兼容个人中心现有的中英文和空格差异。
function subjectMatchesModule(subjects: string[], moduleId: string, moduleLabel: string): boolean {
  if (!subjects.length) return true
  const normalizedSubjects = subjects.map((subject) => subject.replace(/\s+/g, '').toLowerCase())
  const aliases: Record<string, string[]> = {
    maths1: ['数学1', 'mathematics1', 'maths1'],
    maths2: ['数学2', 'mathematics2', 'maths2'],
    physics: ['物理', 'physics'],
    chemistry: ['化学', 'chemistry'],
    biology: ['生物', 'biology'],
  }
  const candidates = [...(aliases[moduleId] || []), moduleLabel.replace(/\s+/g, '').toLowerCase()]
  return normalizedSubjects.some((subject) => candidates.includes(subject))
}

// 学习路径始终覆盖本次实际作答模块；个人资料只用于发现配置差异，不能过滤诊断证据。
export function resolveEsatPlanningSubjects(
  matrix: Array<{ moduleId: string; moduleLabel: string }>,
  declaredSubjects: string[],
): { subjects: string[]; subjectMismatch: boolean } {
  const actualModules = Array.from(new Map(
    matrix.map((row) => [row.moduleId, { id: row.moduleId, label: row.moduleLabel }]),
  ).values())
  const subjectMismatch = declaredSubjects.length > 0 && (
    actualModules.some((module) => !subjectMatchesModule(declaredSubjects, module.id, module.label))
    || declaredSubjects.some((subject) => !actualModules.some(
      (module) => subjectMatchesModule([subject], module.id, module.label),
    ))
  )
  return {
    subjects: actualModules.map((module) => module.label),
    subjectMismatch,
  }
}

// 学习模式综合考试时间、投入能力、模块分数与缺口压力固定计算，保证结果稳定可解释。
function decideLearningMode(input: {
  examDate: string | null
  weeklyHours: number
  modules: AssessmentModule[]
  highRoiGaps: ReportAiImprovementPlan['highRoiGaps']
}): { weeks: number; mode: ReportLearningPath['summary']['mode']; reason: string } {
  const normalizedExamDate = input.examDate && /^\d{4}-\d{2}$/.test(input.examDate)
    ? `${input.examDate}-01`
    : input.examDate
  const targetDate = normalizedExamDate ? new Date(`${normalizedExamDate}T00:00:00Z`) : null
  const remainingWeeks = targetDate && !Number.isNaN(targetDate.getTime())
    ? Math.max(1, Math.ceil((targetDate.getTime() - Date.now()) / 86_400_000 / 7))
    : null
  const moduleScores = input.modules
    .map((module) => module.score)
    .filter((score): score is number => score !== null)
  const averageScore = moduleScores.length
    ? moduleScores.reduce((sum, score) => sum + score, 0) / moduleScores.length
    : null
  const severeGapCount = input.highRoiGaps.filter((gap) => gap.accuracy < 0.4).length
  let pressure = 0
  if (averageScore !== null) {
    if (averageScore < 4) pressure += 3
    else if (averageScore < 6) pressure += 2
    else if (averageScore < 7) pressure += 1
  }
  if (input.highRoiGaps.length >= 5) pressure += 2
  else if (input.highRoiGaps.length >= 3) pressure += 1
  if (severeGapCount >= 3) pressure += 2
  else if (severeGapCount >= 1) pressure += 1
  if (remainingWeeks !== null) {
    if (remainingWeeks <= 4) pressure += 4
    else if (remainingWeeks <= 8) pressure += 2
    else if (remainingWeeks <= 12) pressure += 1
  }
  if (input.weeklyHours < 8) pressure += 1
  pressure = Math.min(10, pressure)

  let mode: ReportLearningPath['summary']['mode'] = 'Standard'
  let weeks = remainingWeeks === null ? 8 : Math.max(3, Math.min(12, remainingWeeks))
  if (remainingWeeks !== null && remainingWeeks <= 4) {
    mode = 'Intensive'
    weeks = 3
  } else if (remainingWeeks !== null && remainingWeeks > 12) {
    mode = pressure >= 4 || input.weeklyHours < 10 ? 'Extended' : 'Standard'
    weeks = 12
  } else if (remainingWeeks !== null) {
    if (input.weeklyHours < 8 && remainingWeeks >= 9 && pressure >= 5) mode = 'Extended'
    else if (pressure >= 7 || (remainingWeeks <= 6 && pressure >= 5)) mode = 'Intensive'
  } else if (pressure >= 7 && input.weeklyHours >= 10) {
    mode = 'Intensive'
    weeks = 6
  } else if (pressure >= 5 && input.weeklyHours < 10) {
    mode = 'Extended'
    weeks = 12
  }

  const factors = [
    remainingWeeks === null ? '考试日期未设置' : `距考试约 ${remainingWeeks} 周`,
    `每周可投入 ${input.weeklyHours} 小时`,
    averageScore === null ? '暂无模块预估分' : `模块平均预估分 ${averageScore.toFixed(1)}`,
    `高 ROI 缺口 ${input.highRoiGaps.length} 项（其中低于40%共 ${severeGapCount} 项）`,
  ]
  return {
    weeks,
    mode,
    reason: `${factors.join('；')}。综合压力指数 ${pressure}/10，采用 ${mode} 模式。`,
  }
}

// 三阶段周数固定为约 25%/50%/25%，并保证每个阶段至少一周。
function allocatePhaseWeeks(totalWeeks: number): [number, number, number] {
  const foundation = Math.max(1, Math.round(totalWeeks * 0.25))
  const improvement = Math.max(1, Math.round(totalWeeks * 0.5))
  const sprint = Math.max(1, totalWeeks - foundation - improvement)
  const overflow = foundation + improvement + sprint - totalWeeks
  return overflow > 0
    ? [foundation, Math.max(1, improvement - overflow), sprint]
    : [foundation, improvement, sprint]
}

// 周区间从上一阶段连续累加，避免阶段标题和任务周期出现断档。
function weekLabel(startWeek: number, durationWeeks: number): string {
  const endWeek = startWeek + durationWeeks - 1
  return startWeek === endWeek ? `第 ${startWeek} 周` : `第 ${startWeek}-${endWeek} 周`
}

// 模型文案中的百分比只能引用输入事实或代码目标，防止自行创造提分指标。
function percentagesAreAllowed(text: string, allowedValues: number[]): boolean {
  const values = [...text.matchAll(/(\d+(?:\.\d+)?)%/g)].map((match) => Number(match[1]))
  return values.every((value) => allowedValues.some((allowed) => Math.abs(allowed - value) < 0.01))
}

// DeepSeek 在固定阶段与缺口范围内生成个性化目标和任务文案，任何越界输出都回退到规则方案。
async function personalizeLearningPath(input: {
  phases: ReportLearningPath['phases']
  focusGaps: LearningFocusGap[]
  profile: LearnerProfileInput
  summary: Omit<ReportLearningPath['summary'], 'analysisSource'>
  timing: ReportOverview['timing']
}, context: DiagnosticExamContext = ESAT_CONTEXT): Promise<{ phases: ReportLearningPath['phases']; source: 'deepseek' | 'fallback' }> {
  const allowedGaps = new Map(input.focusGaps.map((gap) => [gap.gapKey, gap]))
  const payload = {
    profile: {
      subjects: input.profile.subjects,
      targetMajor: input.profile.targetMajor,
      targetUniversities: input.profile.targetUniversities,
      examDate: input.profile.examDate,
      weeklyHours: input.summary.weeklyHours,
    },
    schedule: {
      planningWeeks: input.summary.planningWeeks,
      totalHours: input.summary.totalHours,
      mode: input.summary.mode,
      modeReason: input.summary.modeReason,
      phases: input.phases.map((phase) => ({
        id: phase.id,
        durationWeeks: phase.durationWeeks,
        weekLabel: phase.weekLabel,
        checkpoint: phase.checkpoint,
      })),
    },
    focusGaps: input.focusGaps.map((gap) => ({
      gapKey: gap.gapKey,
      moduleLabel: gap.moduleLabel,
      topicLabel: gap.topicLabel,
      difficultyLabel: gap.difficultyLabel,
      accuracyPercent: Math.round(gap.accuracy * 100),
      targetPercent: gap.accuracy < 0.4 ? 50 : 70,
      total: gap.total,
      suggestedHours: gap.suggestedHours,
      priorityReason: gap.priorityReason,
    })),
    timingAnalysis: input.timing.analysisLevel === 'unavailable'
      ? { available: false }
      : {
          available: true,
          pacingStatus: input.timing.pacingStatus,
          modules: input.timing.modules
            .filter((module) => module.timeEfficiencyIndex !== null)
            .map((module) => ({
              moduleLabel: module.label,
              timeEfficiencyIndex: module.timeEfficiencyIndex,
              timedQuestionCount: module.timedQuestionCount,
              totalQuestions: module.totalQuestions,
              accuracyPercent: module.accuracy === null ? null : Math.round(module.accuracy * 100),
            })),
        },
  }
  const cacheKey = crypto.createHash('sha256').update(JSON.stringify({ examType: context.examType, payload })).digest('hex')
  let generated = learningPathCache.get(cacheKey) as { phases?: unknown } | undefined
  if (!generated) {
    try {
      const response = await requestDeepSeekJson<{ phases?: unknown }>(
        diagnosticReportPrompt('learning-path', context),
        payload,
        { maxTokens: 1400 },
      )
      generated = response.data
      learningPathCache.set(cacheKey, generated)
      console.info('[diagnostic-report] learning path generated', {
        examType: context.examType,
        model: response.model,
        totalTokens: response.usage.totalTokens,
      })
    } catch (error) {
      console.error(`[${context.examType.toLowerCase()}-diagnostic] learning path unavailable:`, error)
      return { phases: input.phases, source: 'fallback' }
    }
  }
  if (!Array.isArray(generated.phases)) return { phases: input.phases, source: 'fallback' }
  const generatedMap = new Map<string, Record<string, unknown>>()
  for (const item of generated.phases as Array<Record<string, unknown>>) {
    if (typeof item.id === 'string') generatedMap.set(item.id, item)
  }
  const requiredIds = new Set(['foundation', 'improvement', 'sprint'])
  if (generatedMap.size !== 3 || [...generatedMap.keys()].some((id) => !requiredIds.has(id))) {
    return { phases: input.phases, source: 'fallback' }
  }

  const phases = input.phases.map((phase) => {
    const item = generatedMap.get(phase.id)!
    const phasePercentages = phase.id === 'foundation'
      ? input.focusGaps.flatMap((gap) => [Math.round(gap.accuracy * 100), gap.accuracy < 0.4 ? 50 : 70])
      : phase.id === 'improvement'
        ? [40]
        : []
    const generatedGoal = typeof item.goal === 'string' ? item.goal.trim() : ''
    const generatedStrategy = typeof item.strategy === 'string' ? item.strategy.trim() : ''
    const generatedCheckpoint = typeof item.checkpoint === 'string' ? item.checkpoint.trim() : ''
    const goal = generatedGoal
      && generatedGoal.length <= 100
      && percentagesAreAllowed(generatedGoal, phasePercentages)
      ? generatedGoal
      : phase.goal
    const strategy = generatedStrategy
      && generatedStrategy.length <= 100
      && percentagesAreAllowed(generatedStrategy, phasePercentages)
      ? generatedStrategy
      : phase.strategy
    const checkpoint = generatedCheckpoint
      && generatedCheckpoint.length <= 100
      && percentagesAreAllowed(generatedCheckpoint, phasePercentages)
      ? generatedCheckpoint
      : phase.checkpoint
    const activities = Array.isArray(item.activities)
      ? item.activities.filter((value): value is string => (
          typeof value === 'string'
          && value.trim().length <= 70
          && percentagesAreAllowed(value, phasePercentages)
        )).slice(0, 2)
      : []
    let tasks = phase.tasks
    if (phase.id === 'foundation' && Array.isArray(item.tasks)) {
      const fallbackTasks = new Map(input.focusGaps.map((gap, index) => [gap.gapKey, phase.tasks[index]]))
      const generatedTasks = (item.tasks as Array<Record<string, unknown>>).flatMap((task) => {
        const gapKey = typeof task.gapKey === 'string' ? task.gapKey : ''
        const gap = allowedGaps.get(gapKey)
        const fallback = fallbackTasks.get(gapKey)
        const title = typeof task.title === 'string' ? task.title.trim() : ''
        const completionLabel = typeof task.completionLabel === 'string' ? task.completionLabel.trim() : ''
        if (!gap || !fallback) return []
        const allowedTaskPercentages = [
          Math.round(gap.accuracy * 100),
          gap.accuracy < 0.4 ? 50 : 70,
        ]
        if (
          !title
          || title.length > 50
          || !completionLabel
          || completionLabel.length > 70
          || !completionLabel.includes(gap.suggestedHours)
          || !percentagesAreAllowed(completionLabel, allowedTaskPercentages)
        ) return []
        return [{ ...fallback, title, completionLabel }]
      })
      if (generatedTasks.length) tasks = generatedTasks
    }
    return {
      ...phase,
      goal,
      strategy,
      checkpoint,
      tasks,
      activities: activities.length === 2 ? activities : phase.activities,
    }
  })
  return { phases, source: 'deepseek' }
}

type StarterFocusSource = ReportStarterPlanDay['focus'][number] & {
  correct: number
  total: number
  accuracy: number | null
  confidence: 'high' | 'medium' | 'low'
  questionNumbers: number[]
  examFocus: string[]
  reviewGuidance: string[]
  possibleErrorPatterns: string[]
}

const STARTER_DAY_WEIGHTS = [0.12, 0.16, 0.15, 0.14, 0.14, 0.16, 0.13] as const

// 一周分钟预算采用最大余数法分配，保证七天相加严格等于个人资料或默认预算。
export function allocateStarterMinutes(totalMinutes: number): [number, number, number, number, number, number, number] {
  const normalizedTotal = Math.max(7, Math.round(totalMinutes))
  const raw = STARTER_DAY_WEIGHTS.map((weight) => weight * normalizedTotal)
  const allocated = raw.map((value) => Math.floor(value))
  let remaining = normalizedTotal - allocated.reduce((sum, value) => sum + value, 0)
  const order = raw
    .map((value, index) => ({ index, fraction: value - allocated[index] }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index)
  for (let cursor = 0; remaining > 0; cursor += 1, remaining -= 1) {
    allocated[order[cursor % order.length].index] += 1
  }
  return allocated as [number, number, number, number, number, number, number]
}

// 启动计划优先使用样本充分缺口；没有缺口时承接首要校准行动，保证优秀或低样本答卷也有可执行路径。
function starterFocusSources(
  plan: ReportAiImprovementPlan,
  nextAction: ReportNextAction | null,
): StarterFocusSource[] {
  const gapSources = plan.highRoiGaps.slice(0, 3).map((gap) => ({
    gapKey: `${gap.moduleId}:${gap.topicCode}:${gap.difficulty}`,
    moduleLabel: gap.moduleLabel,
    topicCode: gap.topicCode,
    topicLabel: gap.topicLabel,
    difficultyLabel: gap.difficultyLabel,
    correct: gap.correct,
    total: gap.total,
    accuracy: gap.accuracy,
    confidence: gap.confidence,
    questionNumbers: gap.questionNumbers,
    examFocus: gap.examFocus,
    reviewGuidance: gap.reviewGuidance,
    possibleErrorPatterns: gap.possibleErrorPatterns,
  }))
  if (gapSources.length) return gapSources
  if (nextAction) {
    return [{
      gapKey: `${nextAction.moduleId}:${nextAction.topicCode}:${nextAction.difficulty}`,
      moduleLabel: nextAction.moduleLabel,
      topicCode: nextAction.topicCode,
      topicLabel: nextAction.topicLabel,
      difficultyLabel: nextAction.difficultyLabel,
      correct: nextAction.evidence.correct,
      total: nextAction.evidence.total,
      accuracy: nextAction.evidence.accuracy,
      confidence: nextAction.evidence.confidence,
      questionNumbers: nextAction.evidence.questionNumbers,
      examFocus: [],
      reviewGuidance: nextAction.reviewGuidance,
      possibleErrorPatterns: nextAction.possibleErrorPatterns,
    }]
  }
  const observed = plan.matrix
    .flatMap((row) => row.cells
      .filter((cell) => cell.total > 0)
      .map((cell) => ({ row, cell })))
    .sort((left, right) => right.cell.total - left.cell.total || (right.cell.accuracy || 0) - (left.cell.accuracy || 0))[0]
  if (!observed) return []
  return [{
    gapKey: `${observed.row.moduleId}:${observed.row.code}:${observed.cell.difficulty}`,
    moduleLabel: observed.row.moduleLabel,
    topicCode: observed.row.code,
    topicLabel: observed.row.label,
    difficultyLabel: observed.cell.label,
    correct: observed.cell.correct,
    total: observed.cell.total,
    accuracy: observed.cell.accuracy,
    confidence: observed.cell.total >= 5 ? 'high' : observed.cell.total >= 3 ? 'medium' : 'low',
    questionNumbers: [],
    examFocus: [],
    reviewGuidance: [],
    possibleErrorPatterns: [],
  }]
}

// 计划焦点只暴露前端需要的稳定字段，具体诊断素材保留在服务端生成上下文中。
function starterDayFocus(source: StarterFocusSource): ReportStarterPlanDay['focus'][number] {
  return {
    gapKey: source.gapKey,
    moduleLabel: source.moduleLabel,
    topicCode: source.topicCode,
    topicLabel: source.topicLabel,
    difficultyLabel: source.difficultyLabel,
  }
}

// 每日依据使用直接作答事实；低样本明确称为校准，不升级为能力结论。
function starterEvidenceSentence(source: StarterFocusSource): string {
  const observed = source.total
    ? `本次${source.difficultyLabel}答对 ${source.correct}/${source.total} 题`
    : `本次已识别到${source.difficultyLabel}训练需求`
  return source.confidence === 'low'
    ? `${observed}，样本仍少，先通过短任务校准，不直接判定强弱。`
    : `${observed}，作为本周训练顺序的直接依据。`
}

// 题号仅在正式作答记录确实存在时展示，否则使用不带伪编号的“相关错题”。
function starterQuestionLabel(source: StarterFocusSource): string {
  return source.questionNumbers.length
    ? `第 ${source.questionNumbers.join('、')} 题`
    : `${source.topicLabel} 的相关错题`
}

// 规则兜底本身提供完整七日课程，不依赖模型才能避免模板重复。
export function buildFallbackStarterPlan(input: {
  plan: ReportAiImprovementPlan
  nextAction: ReportNextAction | null
  weeklyHours: number
  budgetSource: 'profile' | 'default'
  timing: ReportOverview['timing']
}, context: DiagnosticExamContext = ESAT_CONTEXT): { starterPlan: ReportStarterPlan; sources: StarterFocusSource[] } {
  const sources = starterFocusSources(input.plan, input.nextAction)
  const primary = sources[0] || {
    gapKey: `${context.examType.toLowerCase()}:diagnostic:review`,
    moduleLabel: context.examType,
    topicCode: 'diagnostic-review',
    topicLabel: '本次诊断错题',
    difficultyLabel: '当前难度',
    correct: 0,
    total: 0,
    accuracy: null,
    confidence: 'low' as const,
    questionNumbers: [],
    examFocus: [],
    reviewGuidance: [],
    possibleErrorPatterns: [],
  }
  const secondary = sources[1] || primary
  const third = sources[2] || sources[1] || primary
  const mixedSources = Array.from(new Map(
    [primary, secondary, third].map((source) => [source.gapKey, source]),
  ).values())
  const weeklyBudgetMinutes = Math.round(input.weeklyHours * 60)
  const minutes = allocateStarterMinutes(weeklyBudgetMinutes)
  const primaryQuestions = starterQuestionLabel(primary)
  const errorHypothesis = primary.possibleErrorPatterns[0]
  const reviewGuidance = primary.reviewGuidance[0]
  const timingAvailable = input.timing.analysisLevel !== 'unavailable'
    && input.timing.modules.some((module) => module.timeEfficiencyIndex !== null)
  const commonRefs = (source: StarterFocusSource): string[] => [
    `gap:${source.gapKey}`,
    ...source.questionNumbers.map((number) => `question:${number}`),
  ]
  const days: ReportStarterPlanDay[] = [
    {
      day: 1,
      role: 'evidence_audit',
      title: `定位 ${primary.topicLabel} 的第一个失误步骤`,
      focus: [starterDayFocus(primary)],
      durationMinutes: minutes[0],
      diagnosticRationale: starterEvidenceSentence(primary),
      steps: [
        {
          action: `遮住解析，重新阅读${primaryQuestions}，分别写出已知条件、所求目标和准备采用的方法。`,
          output: '每道题一份“已知—所求—方法”记录。',
        },
        {
          action: `对照正式解析，标出自己最先偏离正确过程的位置${errorHypothesis ? `；同时核对是否出现“${errorHypothesis}”，不要预设它一定存在。` : '，不要用“粗心”代替具体步骤。'}`,
          output: '一张标明第一个不确定步骤的错题核对表。',
        },
      ],
      deliverable: `${primary.topicLabel} 错题步骤核对表。`,
      successCriteria: '每道相关错题都能标出第一个不确定步骤，并能说明正确过程从哪里开始。',
      ifNotMet: '无法定位的题先标记为“方法未知”，第 2 天优先重建这部分方法，不继续盲目增加题量。',
      evidenceRefs: commonRefs(primary),
    },
    {
      day: 2,
      role: 'method_rebuild',
      title: `把 ${primary.topicLabel} 重建成可复用方法`,
      focus: [starterDayFocus(primary)],
      durationMinutes: minutes[1],
      diagnosticRationale: '第 1 天已经定位不确定步骤；今天先形成正确方法，再进入无提示训练。',
      steps: [
        {
          action: reviewGuidance
            ? `结合题库复习提示“${reviewGuidance}”，逐步阅读一题正式解析，只保留关键判断和运算顺序。`
            : '从第 1 天最早出现不确定步骤的一题开始，逐步阅读正式解析，只保留关键判断和运算顺序。',
          output: '一份精简的正确解题流程。',
        },
        {
          action: '合上解析，用自己的语言写出这套方法的适用信号、执行顺序和最后检查点。',
          output: `${primary.topicLabel} 方法清单。`,
        },
        {
          action: '使用方法清单重新完成一题，并在每一步旁标注对应检查点。',
          output: '一份带自检标记的完整重做过程。',
        },
      ],
      deliverable: `${primary.topicLabel} 方法清单和一份完整重做过程。`,
      successCriteria: '不照抄解析也能说清方法的适用信号、关键步骤和最后检查点。',
      ifNotMet: '保留仍说不清的步骤，第 3 天训练前先重新对照解析；暂不扩大到其他题型。',
      evidenceRefs: [...commonRefs(primary), 'day:1:deliverable'],
    },
    {
      day: 3,
      role: 'retrieval_practice',
      title: `无提示检验 ${primary.topicLabel} 方法`,
      focus: [starterDayFocus(primary)],
      durationMinutes: minutes[2],
      diagnosticRationale: '第 2 天完成的是方法重建；今天检验能否在不看清单时独立调用。',
      steps: [
        {
          action: `收起方法清单，独立完成 ${input.nextAction?.suggestedQuestionCount || 5} 道同考点训练，并在每题开头写下准备使用的方法。`,
          output: '无提示作答结果和方法选择记录。',
        },
        {
          action: '完成后再查看反馈，只修改第一个错误步骤，并写明修改原因。',
          output: '错误步骤修正记录。',
        },
      ],
      deliverable: '无提示训练结果和错误步骤修正记录。',
      successCriteria: input.nextAction?.successCriteria || '完成训练，并能说明每道未通过题最先失败的步骤。',
      ifNotMet: '未达到完成标准时，回到第 2 天方法清单，只针对最常失败的步骤完成一次“看解析—遮答案—重做”。',
      evidenceRefs: [...commonRefs(primary), 'day:2:deliverable'],
    },
    {
      day: 4,
      role: 'secondary_transfer',
      title: secondary.gapKey === primary.gapKey
        ? `用新题型迁移 ${primary.topicLabel} 方法`
        : `把核对流程迁移到 ${secondary.topicLabel}`,
      focus: [starterDayFocus(secondary)],
      durationMinutes: minutes[3],
      diagnosticRationale: secondary.gapKey === primary.gapKey
        ? '当前只有一个明确优先项；今天不新增诊断，而是检验同一方法能否迁移到不同表述。'
        : `${starterEvidenceSentence(secondary)}沿用前三天的核对流程，但不假设它与第一项存在相同错误。`,
      steps: [
        {
          action: `先为 ${secondary.topicLabel} 的相关题写出题目目标、准备采用的方法和检查方式。`,
          output: `${secondary.topicLabel} 解题前置计划。`,
        },
        {
          action: '对照正式解析，标出第一个不同点，并只重做该步骤。',
          output: '一条经核对的方法修正。',
        },
        {
          action: '合上解析，完整重做一题并解释每一步的目的。',
          output: '一份独立重做过程。',
        },
      ],
      deliverable: `${secondary.topicLabel} 前置计划、方法修正和独立重做过程。`,
      successCriteria: '能够在不看解析时完整说明一题的解题步骤，并指出最后如何检查结果。',
      ifNotMet: '只保留第一个说不清的步骤作为下一次入口；暂不增加题量，也不扩大成整体能力结论。',
      evidenceRefs: [...commonRefs(secondary), 'day:1:deliverable'],
    },
    {
      day: 5,
      role: 'third_or_deepen',
      title: third.gapKey === primary.gapKey
        ? `提升 ${primary.topicLabel} 的难度稳定性`
        : `分开检查 ${third.topicLabel} 的方法与执行`,
      focus: [starterDayFocus(third)],
      durationMinutes: minutes[4],
      diagnosticRationale: third.gapKey === primary.gapKey
        ? '没有第三个样本充分缺口；今天深化第一项，避免为了凑满计划而虚构新知识点。'
        : starterEvidenceSentence(third),
      steps: [
        {
          action: `开始作答前，先写出 ${third.topicLabel} 的数量关系、关键条件或方法顺序。`,
          output: '一份作答前计划。',
        },
        {
          action: '对照正式解析，分别标记方法选择差异和执行差异。',
          output: '“方法—执行”两栏修正记录。',
        },
        {
          action: '重做后使用适合该题的方式检查结果，并写明检查发现了什么。',
          output: '一份带检查过程的完整答案。',
        },
      ],
      deliverable: `${third.topicLabel} 方法—执行修正表和带检查的重做答案。`,
      successCriteria: '能够把方法选择、执行过程和结果检查分开说明，不以笼统标签代替具体步骤。',
      ifNotMet: '只保留一题逐行对照正式解析，并在第 6 天降低该项的混合练习数量。',
      evidenceRefs: [...commonRefs(third), 'day:4:deliverable'],
    },
    {
      day: 6,
      role: 'interleaved_timed',
      title: mixedSources.length > 1 ? '交错训练：先识别方法，再开始计算' : `交错训练：识别 ${primary.topicLabel} 的不同表述`,
      focus: mixedSources.map(starterDayFocus),
      durationMinutes: minutes[5],
      diagnosticRationale: timingAvailable
        ? '已有逐题时间记录可作为训练参考；今天用混合呈现检验方法识别和执行节奏。'
        : '本次没有可靠逐题计时证据；限时只是一种训练安排，不代表已经诊断出速度问题。',
      steps: [
        {
          action: `混合选择${mixedSources.map((source) => source.topicLabel).join('、')}的练习，逐题先写知识点和预定方法，再开始计算。`,
          output: '每题的方法选择记录。',
        },
        {
          action: `在 ${minutes[5]} 分钟预算内完成训练；到时即停止，不为完成数量延长。`,
          output: '实际完成题数和停止位置。',
        },
        {
          action: '对照本周方法记录，区分方法识别错误和执行错误。',
          output: '一份交错训练错误分类。',
        },
      ],
      deliverable: '方法选择记录、实际完成记录和错误分类。',
      successCriteria: '每题作答前都完成知识点与方法判断，并能把未通过题归入具体失败步骤。',
      ifNotMet: '方法识别不稳时，第 7 天复测前先做不计算的题型判断；执行不稳时只复习对应步骤。',
      evidenceRefs: [...mixedSources.flatMap(commonRefs), 'day:2:deliverable', 'day:4:deliverable', 'day:5:deliverable'],
    },
    {
      day: 7,
      role: 'weekly_retest',
      title: '复测并决定下一周只保留什么',
      focus: mixedSources.map(starterDayFocus),
      durationMinutes: minutes[6],
      diagnosticRationale: '今天不再新增方法，而是使用本周产出确认哪些方法已经能独立调用，哪些仍需继续补强。',
      steps: [
        {
          action: `重新完成首要知识点的 ${input.nextAction?.suggestedQuestionCount || 5} 道训练，并从其他焦点各选择一项本周任务独立完成。`,
          output: '本周焦点复测结果。',
        },
        {
          action: '逐项对照本周成功标准，标记为达标、部分达标或未达标。',
          output: '一张结果判定表。',
        },
        {
          action: '只把部分达标和未达标项写入下一周首要清单。',
          output: '下一周最多三项的继续训练决定。',
        },
      ],
      deliverable: '复测结果表和下一周继续训练决定。',
      successCriteria: input.nextAction?.successCriteria || '所有焦点都能按本周各自的成功标准独立完成。',
      ifNotMet: '全部达标则进入混合巩固；部分达标则只保留未稳定项；多项未达标则继续短周期补弱，不生成乐观的长期结论。',
      evidenceRefs: [...mixedSources.flatMap(commonRefs), 'day:3:deliverable', 'day:4:deliverable', 'day:5:deliverable', 'day:6:deliverable'],
    },
  ]
  return {
    sources,
    starterPlan: {
      version: 'starter-plan-v2',
      weeklyBudgetMinutes,
      totalPlannedMinutes: minutes.reduce((sum, value) => sum + value, 0),
      budgetSource: input.budgetSource,
      analysisSource: 'fallback',
      evidenceBoundary: '计划只使用本次作答、正式题目分析与已计算缺口；可能错误模式仅供核对，不代表已经确认的个人失分原因。',
      days,
    },
  }
}

// 模型只改写代码已锁定的每日内容；日期、职能、焦点、分钟与证据引用始终采用规则骨架。
async function personalizeStarterPlan(
  fallback: ReportStarterPlan,
  sources: StarterFocusSource[],
  context: DiagnosticExamContext = ESAT_CONTEXT,
): Promise<ReportStarterPlan> {
  const payload = {
    evidenceBoundary: fallback.evidenceBoundary,
    weeklyBudgetMinutes: fallback.weeklyBudgetMinutes,
    focusFacts: sources.map((source) => ({
      gapKey: source.gapKey,
      moduleLabel: source.moduleLabel,
      topicLabel: source.topicLabel,
      difficultyLabel: source.difficultyLabel,
      correct: source.correct,
      total: source.total,
      accuracyPercent: source.accuracy === null ? null : Math.round(source.accuracy * 100),
      confidence: source.confidence,
      questionNumbers: source.questionNumbers,
      examFocus: source.examFocus,
      reviewGuidance: source.reviewGuidance,
      possibleErrorPatterns: source.possibleErrorPatterns,
    })),
    fixedDays: fallback.days,
  }
  const cacheKey = crypto.createHash('sha256').update(JSON.stringify({ examType: context.examType, payload })).digest('hex')
  let generated = starterPlanCache.get(cacheKey) as { days?: unknown } | undefined
  if (!generated) {
    try {
      const response = await requestDeepSeekJson<{ days?: unknown }>(
        diagnosticReportPrompt('starter-plan', context),
        payload,
        { maxTokens: 3200 },
      )
      generated = response.data
      starterPlanCache.set(cacheKey, generated)
      console.info('[diagnostic-report] starter plan generated', {
        examType: context.examType,
        model: response.model,
        totalTokens: response.usage.totalTokens,
      })
    } catch (error) {
      console.error(`[${context.examType.toLowerCase()}-diagnostic] starter plan unavailable:`, error)
      return fallback
    }
  }
  if (!Array.isArray(generated.days)) return fallback
  const rawDays = generated.days as Array<Record<string, unknown>>
  const allowedPercentages = sources
    .map((source) => source.accuracy === null ? null : Math.round(source.accuracy * 100))
    .filter((value): value is number => value !== null)
  let accepted = 0
  const days = fallback.days.map((fallbackDay) => {
    const raw = rawDays.find((item) => item.day === fallbackDay.day)
    if (!raw || raw.role !== fallbackDay.role || raw.durationMinutes !== fallbackDay.durationMinutes) return fallbackDay
    const title = typeof raw.title === 'string' ? raw.title.trim() : ''
    const diagnosticRationale = typeof raw.diagnosticRationale === 'string' ? raw.diagnosticRationale.trim() : ''
    const deliverable = typeof raw.deliverable === 'string' ? raw.deliverable.trim() : ''
    const successCriteria = typeof raw.successCriteria === 'string' ? raw.successCriteria.trim() : ''
    const ifNotMet = typeof raw.ifNotMet === 'string' ? raw.ifNotMet.trim() : ''
    const steps = Array.isArray(raw.steps)
      ? (raw.steps as Array<Record<string, unknown>>).flatMap((step) => {
          const action = typeof step.action === 'string' ? step.action.trim() : ''
          const output = typeof step.output === 'string' ? step.output.trim() : ''
          return action && output && action.length <= 120 && output.length <= 120 ? [{ action, output }] : []
        }).slice(0, 4)
      : []
    const text = [title, diagnosticRationale, deliverable, successCriteria, ifNotMet, ...steps.flatMap((step) => [step.action, step.output])].join(' ')
    if (
      !title || title.length > 40
      || !diagnosticRationale || diagnosticRationale.length > 90
      || !deliverable || deliverable.length > 120
      || !successCriteria || successCriteria.length > 120
      || !ifNotMet || ifNotMet.length > 120
      || steps.length < 2
      || /专项投入|完成本格复盘/.test(text)
      || !percentagesAreAllowed(text, allowedPercentages)
    ) return fallbackDay
    accepted += 1
    return { ...fallbackDay, title, diagnosticRationale, steps, deliverable, successCriteria, ifNotMet }
  })
  const uniqueTitles = new Set(days.map((day) => day.title)).size === days.length
  if (!uniqueTitles) return fallback
  return {
    ...fallback,
    analysisSource: accepted === 7 ? 'deepseek' : accepted > 0 ? 'mixed' : 'fallback',
    days,
  }
}

// 学习路径先建立稳定调度骨架，再让模型在受控范围内完成个性化聚焦。
async function buildLearningPath(
  plan: ReportAiImprovementPlan,
  modules: AssessmentModule[],
  learnerProfile: LearnerProfileInput | undefined,
  timing: ReportOverview['timing'],
  nextAction: ReportNextAction | null,
  context: DiagnosticExamContext = ESAT_CONTEXT,
): Promise<ReportLearningPath> {
  const profile: LearnerProfileInput = {
    subjects: learnerProfile?.subjects?.filter(Boolean) || [],
    targetUniversities: learnerProfile?.targetUniversities?.filter(Boolean) || [],
    targetMajor: learnerProfile?.targetMajor?.trim() || null,
    examDate: learnerProfile?.examDate || null,
    weeklyHours: learnerProfile?.weeklyHours && learnerProfile.weeklyHours > 0
      ? learnerProfile.weeklyHours
      : null,
  }
  const missingFields = [
    !profile.subjects.length ? '备考科目' : '',
    !profile.targetUniversities.length ? '目标院校' : '',
    !profile.targetMajor ? '目标专业' : '',
    !profile.examDate ? '考试日期' : '',
    profile.weeklyHours === null ? '每周可投入时长' : '',
  ].filter(Boolean)
  const declaredSubjects = [...profile.subjects]
  const planningSubjects = context.examType === 'TMUA'
    ? { subjects: ['数学'], subjectMismatch: false }
    : resolveEsatPlanningSubjects(plan.matrix, declaredSubjects)
  const planningScope: ReportLearningPath['summary']['planningScope'] = 'full'
  const weeklyHours = profile.weeklyHours || 5
  const modeDecision = decideLearningMode({
    examDate: profile.examDate,
    weeklyHours,
    modules,
    highRoiGaps: plan.highRoiGaps,
  })
  const [foundationWeeks, improvementWeeks, sprintWeeks] = allocatePhaseWeeks(modeDecision.weeks)
  const majorModules = context.examType === 'TMUA' ? [] : majorPreferredModules(profile.targetMajor)
  const subjects = planningSubjects.subjects
  const rankedGaps: LearningFocusGap[] = plan.highRoiGaps
    .map((gap) => ({
      ...gap,
      gapKey: `${gap.moduleId}:${gap.topicCode}:${gap.difficulty}`,
    }))
    .sort((a, b) => {
      const aMajor = majorModules.includes(a.moduleId) ? majorModules.indexOf(a.moduleId) : 99
      const bMajor = majorModules.includes(b.moduleId) ? majorModules.indexOf(b.moduleId) : 99
      return aMajor - bMajor || a.rank - b.rank
    })
  const focusGaps = rankedGaps.slice(0, 3)
  const focusTags = Array.from(new Set([
    ...focusGaps.map((gap) => gap.topicLabel),
    ...(focusGaps.length ? [] : nextAction ? [nextAction.topicLabel] : []),
  ]))
  const foundationEnd = foundationWeeks
  const improvementStart = foundationEnd + 1
  const sprintStart = foundationEnd + improvementWeeks + 1
  const firstGap = focusGaps[0]
  const firstTarget = firstGap
    ? Math.max(firstGap.accuracy < 0.4 ? 0.5 : 0.7, firstGap.accuracy)
    : null
  const slowTimingModules = timing.analysisLevel === 'unavailable'
    ? []
    : timing.modules
      .filter((module) => module.timeEfficiencyIndex !== null && module.timeEfficiencyIndex > 1.25)
      .sort((left, right) => (right.timeEfficiencyIndex || 0) - (left.timeEfficiencyIndex || 0))
  const timingTrainingFocus = slowTimingModules[0]
    ? `${slowTimingModules[0].label} 当前题时效率 ${slowTimingModules[0].timeEfficiencyIndex?.toFixed(1)}×，阶段二加入限时模块训练。`
    : ''
  const applicationContext = profile.targetUniversities.length
    ? `，为 ${profile.targetUniversities.join('、')} 的申请考试做好准备`
    : ''
  const tasks = focusGaps.map((gap, index) => ({
    period: foundationWeeks === 1
      ? '第 1 周'
      : `第 ${Math.min(index + 1, foundationWeeks)} 周`,
    title: `${gap.topicLabel} · ${gap.difficultyLabel}专项复习`,
    completionLabel: `完成错题复盘，并按 ${gap.suggestedHours} 的训练预算完成专项练习与复测`,
  }))
  if (!tasks.length && nextAction) {
    tasks.push({
      period: '第 1 周',
      title: nextAction.title,
      completionLabel: `${nextAction.suggestedMinutes} 分钟内完成 ${nextAction.suggestedQuestionCount} 道训练题`,
    })
  }
  const summaryBase = {
    planningWeeks: modeDecision.weeks,
    weeklyHours,
    totalHours: modeDecision.weeks * weeklyHours,
    mode: modeDecision.mode,
    modeReason: modeDecision.reason,
    planningScope,
    dataSourceNote: missingFields.length
      ? `尚未设置：${missingFields.join('、')}；缺失项采用受控默认值生成三阶段计划，不虚构具体考试日期或院校录取门槛。${planningSubjects.subjectMismatch ? ' 个人资料科目与本次试卷模块不一致，规划已按本次实际模块生成。' : ''}`
      : `已关联个人中心备考资料；目标院校仅作为申请背景，不推断录取分数线。${planningSubjects.subjectMismatch ? ' 个人资料科目与本次试卷模块不一致，规划已按本次实际模块生成。' : ''}`,
  }
  const fallbackPhases: ReportLearningPath['phases'] = [
      {
        id: 'foundation',
        title: '补漏期',
        durationWeeks: foundationWeeks,
        weekLabel: weekLabel(1, foundationWeeks),
        goal: firstGap && firstTarget !== null
          ? `优先将“${firstGap.topicLabel} × ${firstGap.difficultyLabel}”正确率从 ${Math.round(firstGap.accuracy * 100)}% 提升至 ${Math.round(firstTarget * 100)}% 以上。`
          : '复盘本次诊断错题，补齐样本充分格子中的基础薄弱项。',
        strategy: `按高 ROI 顺序逐项补漏，每项完成复盘、专项训练与小样本复测。${timingTrainingFocus}`,
        checkpoint: firstGap && firstTarget !== null
          ? `阶段末复测“${firstGap.topicLabel} × ${firstGap.difficultyLabel}”，正确率达到 ${Math.round(firstTarget * 100)}% 以上后再进入提速；未达标则继续保留。`
          : '阶段末完成本次错题复测；达成各任务完成标准后进入提速，未达标内容继续保留。',
        focusTags,
        tasks,
        activities: [],
      },
      {
        id: 'improvement',
        title: '提速期',
        durationWeeks: improvementWeeks,
        weekLabel: weekLabel(improvementStart, improvementWeeks),
        goal: '将样本充分格子中的红色缺口逐步提升至 40% 以上，并建立跨题型稳定性。',
        strategy: `围绕阶段一复诊后仍存在的缺口进行中高难度迁移，并用限时模块测试校验稳定性。${timingTrainingFocus}`,
        checkpoint: '阶段末连续完成 2 次模块限时训练；两次均达到阶段目标后进入模考冲刺，否则保留未稳定项。',
        focusTags,
        tasks: [],
        activities: [
          `${weekLabel(improvementStart, Math.max(1, improvementWeeks - 1))}：完成重点知识点的中高难度综合专项。`,
          `${weekLabel(improvementStart + Math.max(0, improvementWeeks - 1), 1)}：完成 2 次模块限时模拟并复盘节奏。`,
          '每次限时训练后只回收未稳定知识点，并记录第一处失败步骤。',
        ],
      },
      {
        id: 'sprint',
        title: '模考冲刺期',
        durationWeeks: sprintWeeks,
        weekLabel: weekLabel(sprintStart, sprintWeeks),
        goal: profile.examDate
          ? `在 ${profile.examDate} 考试日前稳定完成整套模考与错题复盘${applicationContext}。`
          : `在目标考试前稳定完成整套模考与错题复盘${applicationContext}。`,
        strategy: '减少新内容输入，以整卷节奏、错题回收和稳定得分为核心进行冲刺。',
        checkpoint: '用最近 2 套完整模考检查整卷节奏和错题回收是否稳定；仍不稳定的内容只做定向回收。',
        focusTags: subjects,
        tasks: [],
        activities: [
          '每周完成 1 套完整模考，并按知识点与难度复盘错题。',
          '优先处理限时场景下仍不稳定的高样本缺口，保持已掌握格子的正确率。',
          '考前最后一周减少新内容，只保留整卷节奏检查和错题回收。',
        ],
      },
    ]
  const personalized = await personalizeLearningPath({
    phases: fallbackPhases,
    focusGaps,
    profile: { ...profile, subjects },
    summary: summaryBase,
    timing,
  }, context)
  return {
    profile: {
      ...profile,
      subjects,
      missingFields,
      declaredSubjects,
      subjectMismatch: planningSubjects.subjectMismatch,
    },
    summary: { ...summaryBase, analysisSource: personalized.source },
    phases: personalized.phases,
  }
}

// 构建 ESAT 独立报告；主分数保持为空，前端只展示当前模块分数。
export async function buildEsatDiagnosticReportSummary(input: {
  examType: string
  paper: PaperInput
  questions: ReportQuestionInput[]
  elapsedDurationSeconds?: number | null
  syllabusNodes?: Array<{ code: string; label: string }>
  learnerProfile?: LearnerProfileInput
  onStage?: (stage: DiagnosticBuildStage) => void | Promise<void>
}): Promise<DiagnosticReportSummary> {
  const groups = new Map<string, ReportQuestionInput[]>()
  for (const question of [...input.questions].sort((a, b) => a.number - b.number)) {
    const moduleId = resolveEsatModule(
      question.moduleCode ?? question.componentCode,
      question.subject,
    ) || 'unclassified'
    const group = groups.get(moduleId) || []
    group.push(question)
    groups.set(moduleId, group)
  }
  const modules = Array.from(groups.entries())
    .map(([id, questions]) => buildModule(id, questions))
    .sort((a, b) => MODULE_ORDER.indexOf(a.id) - MODULE_ORDER.indexOf(b.id))
  const improvementEvidence = buildImprovementEvidence(
    input.questions,
    input.syllabusNodes || [],
    ESAT_CONTEXT,
  )
  await input.onStage?.('module_analyzing')
  const moduleAnalysisPromise = Promise.all([
    generateModuleAnalyses(modules, ESAT_CONTEXT, improvementEvidence.weaknessProfile),
    generateModulePositioningInsights(modules, ESAT_CONTEXT, improvementEvidence.weaknessProfile),
  ]).then(async (result) => {
    await input.onStage?.('roi_analyzing')
    return result
  })
  const [[moduleAnalyses, modulePositioningInsights], aiImprovementPlan] = await Promise.all([
    moduleAnalysisPromise,
    buildAiImprovementPlan(
      input.questions,
      input.syllabusNodes || [],
      ESAT_CONTEXT,
      improvementEvidence,
    ),
  ])
  const modulesWithRisks = modules.map((module) => {
    const analysis = moduleAnalyses[module.id]
    const mergedDiagnostic = mergeModuleDiagnosticAnalysis(
      module,
      analysis,
      improvementEvidence.weaknessProfile.moduleSignals.find((signal) => signal.moduleId === module.id),
      improvementEvidence.weaknessProfile.difficultySignals.filter((signal) => signal.moduleId === module.id),
      improvementEvidence.weaknessProfile.sequenceSignals.find((signal) => signal.moduleId === module.id),
    )
    const positioningInsight = modulePositioningInsights[module.id]
    return {
      ...module,
      positioning: module.positioning
        ? {
            ...module.positioning,
            competitiveness: positioningInsight || buildFallbackModulePositioningInsight(
              module,
              improvementEvidence.weaknessProfile.sequenceSignals.find((signal) => signal.moduleId === module.id),
            ),
            analysisSource: positioningInsight ? 'deepseek' as const : 'fallback' as const,
          }
        : null,
      riskSignal: mergedDiagnostic.riskSignal,
      diagnosticAnalysis: mergedDiagnostic.diagnosticAnalysis,
    }
  })
  const difficultyMastery = buildDifficultyMastery(input.questions)
  const overview = buildOverview(input.questions, input.paper, input.elapsedDurationSeconds)
  const nextAction = buildEsatNextAction(aiImprovementPlan, input.questions)
  await input.onStage?.('path_analyzing')
  const learningPath = await buildLearningPath(
    aiImprovementPlan,
    modulesWithRisks,
    input.learnerProfile,
    overview.timing,
    nextAction,
  )

  return {
    reportKind: 'esat',
    header: {
      title: buildTitle(input.paper),
      examType: 'ESAT',
      year: input.paper.year,
      modules: modulesWithRisks.map((module) => ({ id: module.id, label: module.label })),
    },
    assessment: {
      score: null,
      scoreRange: null,
      scaleLabel: '/ 9.0',
      basedOnQuestions: input.questions.length,
      methodNote: 'ESAT 各模块独立估分，不生成总分',
      referenceVersion: 'esat-module-reference-v1',
      positioning: null,
      modules: modulesWithRisks,
      difficultyMastery,
      riskSignal: null,
      riskStatus: Object.values(moduleAnalyses).some((analysis) => analysis.riskSignal)
        ? 'generated'
        : 'unavailable',
    },
    overview,
    knowledgeMastery: buildKnowledgeMastery(input.questions, input.syllabusNodes || []),
    aiImprovementPlan,
    learningPath,
    nextAction,
  }
}

// 构建 TMUA 完整诊断报告：综合分按两卷参考分合并，其他分析沿用与 ESAT 相同的证据和容错框架。
export async function buildTmuaDiagnosticReportSummary(input: {
  examType: string
  paper: PaperInput
  questions: ReportQuestionInput[]
  elapsedDurationSeconds?: number | null
  syllabusNodes?: Array<{ code: string; label: string }>
  learnerProfile?: LearnerProfileInput
  onStage?: (stage: DiagnosticBuildStage) => void | Promise<void>
}): Promise<DiagnosticReportSummary> {
  const sortedQuestions = [...input.questions].sort((left, right) => left.number - right.number)
  const groups = new Map<string, ReportQuestionInput[]>()
  for (const [index, question] of sortedQuestions.entries()) {
    const moduleId = TMUA_CONTEXT.resolveModule(question, index, sortedQuestions.length)
    const group = groups.get(moduleId) || []
    group.push(question)
    groups.set(moduleId, group)
  }
  const modules = Array.from(groups.entries())
    .map(([id, questions]) => buildTmuaModule(id, questions))
    .sort((left, right) => TMUA_MODULE_ORDER.indexOf(left.id) - TMUA_MODULE_ORDER.indexOf(right.id))
  const improvementEvidence = buildImprovementEvidence(
    sortedQuestions,
    input.syllabusNodes || [],
    TMUA_CONTEXT,
  )

  await input.onStage?.('module_analyzing')
  const moduleAnalysisPromise = Promise.all([
    generateModuleAnalyses(modules, TMUA_CONTEXT, improvementEvidence.weaknessProfile),
    generateModulePositioningInsights(modules, TMUA_CONTEXT, improvementEvidence.weaknessProfile),
  ]).then(async (result) => {
    await input.onStage?.('roi_analyzing')
    return result
  })
  const [[moduleAnalyses, modulePositioningInsights], aiImprovementPlan] = await Promise.all([
    moduleAnalysisPromise,
    buildAiImprovementPlan(
      sortedQuestions,
      input.syllabusNodes || [],
      TMUA_CONTEXT,
      improvementEvidence,
    ),
  ])
  const modulesWithRisks = modules.map((module) => {
    const analysis = moduleAnalyses[module.id]
    const mergedDiagnostic = mergeModuleDiagnosticAnalysis(
      module,
      analysis,
      improvementEvidence.weaknessProfile.moduleSignals.find((signal) => signal.moduleId === module.id),
      improvementEvidence.weaknessProfile.difficultySignals.filter((signal) => signal.moduleId === module.id),
      improvementEvidence.weaknessProfile.sequenceSignals.find((signal) => signal.moduleId === module.id),
    )
    const positioningInsight = modulePositioningInsights[module.id]
    return {
      ...module,
      positioning: module.positioning
        ? {
            ...module.positioning,
            competitiveness: positioningInsight || buildFallbackModulePositioningInsight(
              module,
              improvementEvidence.weaknessProfile.sequenceSignals.find((signal) => signal.moduleId === module.id),
            ),
            analysisSource: positioningInsight ? 'deepseek' as const : 'fallback' as const,
          }
        : null,
      riskSignal: mergedDiagnostic.riskSignal,
      diagnosticAnalysis: mergedDiagnostic.diagnosticAnalysis,
    }
  })
  const combinedScore = modulesWithRisks.length
    ? round1(modulesWithRisks.reduce((sum, module) => sum + (module.score || 0), 0) / modulesWithRisks.length)
    : null
  const rangedModules = modulesWithRisks.filter(
    (module): module is typeof module & { scoreRange: [number, number] } => module.scoreRange !== null,
  )
  const combinedRange: [number, number] | null = rangedModules.length
    ? [
        round1(rangedModules.reduce((sum, module) => sum + module.scoreRange[0], 0) / rangedModules.length),
        round1(rangedModules.reduce((sum, module) => sum + module.scoreRange[1], 0) / rangedModules.length),
      ]
    : null
  const overallPositioning = combinedScore === null ? null : buildTmuaOverallPositioning(combinedScore)
  if (overallPositioning && combinedScore !== null && modulesWithRisks.length) {
    const moduleEvidence = modulesWithRisks
      .map((module) => `${module.label} ${module.score?.toFixed(1)}（${module.correct}/${module.total}）`)
      .join('；')
    const weakestModule = [...modulesWithRisks].sort(
      (left, right) => (left.score || 0) - (right.score || 0),
    )[0]
    overallPositioning.competitiveness = `综合参考分 ${combinedScore.toFixed(1)}；${moduleEvidence}。当前优先检查 ${weakestModule.label} 的失分结构与限时表现。`
  }

  const difficultyMastery = buildDifficultyMastery(sortedQuestions)
  const overview = buildOverview(
    sortedQuestions,
    input.paper,
    input.elapsedDurationSeconds,
    TMUA_CONTEXT,
  )
  const nextAction = buildEsatNextAction(aiImprovementPlan, sortedQuestions, TMUA_CONTEXT)
  await input.onStage?.('path_analyzing')
  const learningPath = await buildLearningPath(
    aiImprovementPlan,
    modulesWithRisks,
    input.learnerProfile,
    overview.timing,
    nextAction,
    TMUA_CONTEXT,
  )

  return {
    reportKind: 'tmua',
    header: {
      title: buildTmuaTitle(input.paper),
      examType: 'TMUA',
      year: input.paper.year,
      modules: modulesWithRisks.map((module) => ({ id: module.id, label: module.label })),
    },
    assessment: {
      score: combinedScore,
      scoreRange: combinedRange,
      scaleLabel: '/ 9.0',
      basedOnQuestions: sortedQuestions.length,
      methodNote: '基于历史真题正确率与参考曲线估算；正式 UAT-UK 成绩使用 Rasch 模型将两卷联合等值，最终分数以官方结果为准',
      referenceVersion: 'tmua-uat-uk-2025-26-anchor-v1',
      positioning: overallPositioning,
      modules: modulesWithRisks,
      difficultyMastery,
      riskSignal: modulesWithRisks
        .slice()
        .sort((left, right) => (left.score || 0) - (right.score || 0))[0]?.riskSignal || null,
      riskStatus: Object.values(moduleAnalyses).some((analysis) => analysis.riskSignal)
        ? 'generated'
        : 'unavailable',
    },
    overview,
    knowledgeMastery: buildKnowledgeMastery(
      sortedQuestions,
      input.syllabusNodes || [],
      TMUA_CONTEXT,
    ),
    aiImprovementPlan,
    learningPath,
    nextAction,
  }
}
