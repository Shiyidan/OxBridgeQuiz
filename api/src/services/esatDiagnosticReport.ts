// ESAT 独立诊断策略：按实际模块分别估分、定位、分析难度并生成模块风险信号。
import crypto from 'crypto'
import { resolveEsatModule, quickEsatScore, type EsatModule } from './scoring.js'
import { requestDeepSeekJson } from './deepseek.js'
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
  ReportLearningPath,
  LearnerProfileInput,
  DiagnosticBuildStage,
} from './diagnosticReport.js'

type DifficultyLevel = 'low' | 'medium' | 'high'

const ESAT_EXPECTED_QUESTION_COUNT = 27
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
const ESAT_SCORE_BINS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]
const ESAT_DISTRIBUTION_PERCENTAGES: Record<string, number[]> = {
  maths1: [0.4, 0.7, 2.2, 3.5, 11.2, 11.8, 15.4, 17.2, 10.2, 8.7, 5.5, 4.9, 2.8, 2.0, 0.4, 1.5, 1.7],
  maths2: [2.1, 2.2, 3.4, 5.4, 10.5, 13.3, 14.8, 9.9, 12.5, 7.3, 7.1, 3.5, 2.7, 1.1, 1.6, 0.4, 2.3],
  physics: [3.7, 2.7, 5.6, 7.5, 7.7, 12.9, 11.3, 13.0, 8.1, 10.4, 5.0, 4.3, 3.4, 0.6, 2.0, 0.3, 1.7],
  chemistry: [1.8, 3.3, 2.5, 4.8, 11.7, 7.0, 14.0, 12.3, 9.4, 11.0, 6.2, 3.4, 5.2, 4.0, 0.6, 0, 3.2],
  biology: [7.1, 0.9, 5.2, 7.7, 7.1, 9.0, 9.3, 11.0, 10.8, 9.0, 5.5, 7.3, 3.2, 2.5, 2.1, 0, 2.7],
}
type ModuleAnalysis = {
  riskSignal: string
  positioningInsight: string
  summary: string
  strength: string
  keyIssue: string
  focusSuggestion: string
}

const moduleAnalysisCache = new Map<string, Record<string, ModuleAnalysis>>()
const roiCache = new Map<string, Array<{ gapKey: string; priorityReason: string; prerequisiteCheck: string }>>()
const learningPathCache = new Map<string, unknown>()

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
    percentileLabel: `Top ${Math.max(1, 100 - percentile)}%`,
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

// 模型不可用时仅使用模块真实作答数据生成结构化降级分析，避免诊断区域留空。
function buildFallbackModuleAnalysis(module: AssessmentModule): NonNullable<AssessmentModule['diagnosticAnalysis']> {
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
    ? `${weakest.label}是当前主要薄弱层级，答对 ${weakest.correct}/${weakest.total} 题，正确率 ${Math.round((weakest.accuracy ?? 0) * 100)}%。`
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

// 一次 DeepSeek 调用生成模块风险与定位解读，避免切换模块时重复请求。
async function generateModuleAnalyses(modules: AssessmentModule[]): Promise<Record<string, ModuleAnalysis>> {
  const payload = modules.map((module) => ({
    moduleId: module.id,
    moduleLabel: module.label,
    score: module.score,
    scoreRange: module.scoreRange,
    correct: module.correct,
    total: module.total,
    scoringBasis: module.scoringBasis,
    difficultyMastery: module.difficultyMastery,
  }))
  const cacheKey = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  const cached = moduleAnalysisCache.get(cacheKey)
  if (cached) return cached

  try {
    const response = await requestDeepSeekJson<{ moduleAnalyses?: unknown }>(
      [
        '你是 ESAT 模块诊断分析师，请只输出 JSON。',
        '输出 moduleAnalyses 数组，每项包含 moduleId、riskSignal、positioningInsight、summary、strength、keyIssue 和 focusSuggestion。',
        'riskSignal 不超过80字，用一句中文指出该模块最需要关注的风险。',
        'positioningInsight 使用1-2句中文且不超过100字，必须引用输入中的分数、正确率或难度数据，解释当前表现和最值得关注的提升方向。',
        'summary 不超过100字，概括模块预估分、作答正确率和难度表现；strength 不超过80字，只描述数据中真实存在的相对优势，没有优势时必须明确说明样本未显示稳定优势。',
        'keyIssue 不超过100字，指出最主要的薄弱难度层级并引用正确数、总数或正确率；focusSuggestion 不超过100字，给出下一阶段可执行的复盘重点，但不得虚构知识点。',
        '只能描述输入中的得分、正确率和难度表现，不得推断知识体系、心理或能力成因。',
        '语气客观中性，禁止使用“严重不足”“系统性缺失”等绝对化表达。',
        '不得生成新分数、百分位、院校结论、错误类型或具体学习任务。',
      ].join('\n'),
      { examType: 'ESAT', modules: payload },
    )
    if (!Array.isArray(response.data.moduleAnalyses)) throw new Error('Invalid ESAT moduleAnalyses')
    const allowedIds = new Set(modules.map((module) => module.id))
    const analyses: Record<string, ModuleAnalysis> = {}
    for (const item of response.data.moduleAnalyses as Array<Record<string, unknown>>) {
      const moduleId = typeof item.moduleId === 'string' ? item.moduleId : ''
      const riskSignal = typeof item.riskSignal === 'string' ? item.riskSignal.trim() : ''
      const positioningInsight = typeof item.positioningInsight === 'string'
        ? item.positioningInsight.trim()
        : ''
      const summary = typeof item.summary === 'string' ? item.summary.trim() : ''
      const strength = typeof item.strength === 'string' ? item.strength.trim() : ''
      const keyIssue = typeof item.keyIssue === 'string' ? item.keyIssue.trim() : ''
      const focusSuggestion = typeof item.focusSuggestion === 'string'
        ? item.focusSuggestion.trim()
        : ''
      if (
        allowedIds.has(moduleId)
        && riskSignal
        && riskSignal.length <= 80
        && positioningInsight
        && positioningInsight.length <= 100
        && summary
        && summary.length <= 100
        && strength
        && strength.length <= 80
        && keyIssue
        && keyIssue.length <= 100
        && focusSuggestion
        && focusSuggestion.length <= 100
      ) {
        analyses[moduleId] = {
          riskSignal,
          positioningInsight,
          summary,
          strength,
          keyIssue,
          focusSuggestion,
        }
      }
    }
    moduleAnalysisCache.set(cacheKey, analyses)
    console.info('[esat-diagnostic] module analyses generated', {
      model: response.model,
      totalTokens: response.usage.totalTokens,
    })
    return analyses
  } catch (error) {
    console.error('[esat-diagnostic] module analyses unavailable:', error)
    return {}
  }
}

// 报告标题只使用本次 Paper 元数据，避免沿用原型中的固定考试名称。
function buildTitle(paper: PaperInput): string {
  let title = paper.title.trim()
  if (!title.toUpperCase().includes('ESAT')) title = `ESAT ${title}`
  if (!title.includes(String(paper.year))) title = `${title} ${paper.year}`
  return `${title} · 成绩报告`
}

// 总体概览以完成节奏、时间效率和模块效率组织，所有数值均由答题记录确定性计算。
function buildOverview(
  questions: ReportQuestionInput[],
  paper: PaperInput,
  elapsedDurationSeconds: number | null | undefined,
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

  for (const question of questions) {
    const expectedDurationSeconds = expectedDurationFor(question)
    const durationSeconds = Math.max(0, question.durationSeconds || 0)
    if (durationSeconds > 0 && question.isAnswered && expectedDurationSeconds > 0) {
      const speed = durationSeconds <= expectedDurationSeconds ? 'fast' : 'slow'
      const outcome = question.isCorrect ? 'correct' : 'wrong'
      const quadrantKey = `${speed}_${outcome}` as keyof typeof quadrantCounts
      quadrantCounts[quadrantKey] += 1
    }
    const moduleId = resolveEsatModule(
      question.moduleCode ?? question.componentCode,
      question.subject,
    ) || 'unclassified'
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
        label: MODULE_LABELS[id] || id,
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
    .sort((a, b) => MODULE_ORDER.indexOf(a.id) - MODULE_ORDER.indexOf(b.id))

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
): ReportKnowledgeMastery {
  const syllabusLabels = new Map(syllabusNodes.map((node) => [node.code, node.label]))
  const moduleGroups = new Map<string, ReportQuestionInput[]>()
  for (const question of questions) {
    const moduleId = resolveEsatModule(
      question.moduleCode ?? question.componentCode,
      question.subject,
    ) || 'unclassified'
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
        label: MODULE_LABELS[moduleId] || moduleId,
        knowledgePointCount: new Set(topics.flatMap((topic) => topic.children.map((child) => child.code))).size,
        correct,
        total: moduleQuestions.length,
        accuracy: moduleQuestions.length ? correct / moduleQuestions.length : null,
        topics,
      }
    })
    .sort((a, b) => MODULE_ORDER.indexOf(a.id) - MODULE_ORDER.indexOf(b.id))

  return { modules }
}

type AiMatrixRow = ReportAiImprovementPlan['matrix'][number]
type RoiCandidate = Omit<ReportAiImprovementPlan['highRoiGaps'][number], 'rank' | 'priorityReason' | 'prerequisiteCheck' | 'analysisSource'> & {
  gapKey: string
}
type LearningFocusGap = ReportAiImprovementPlan['highRoiGaps'][number] & { gapKey: string }

// 矩阵颜色严格按样本量和正确率阈值计算，不让模型改变统计结论。
function matrixStatus(total: number, accuracy: number | null): AiMatrixRow['cells'][number]['status'] {
  if (total < 3 || accuracy === null) return 'insufficient'
  if (accuracy > 0.7) return 'strong'
  if (accuracy >= 0.4) return 'medium'
  return 'weak'
}

// 能力矩阵按二级 topic 与三档难度交叉聚合，只使用本次试卷的实际题目。
function buildAbilityMatrix(
  questions: ReportQuestionInput[],
  syllabusNodes: Array<{ code: string; label: string }>,
): ReportAiImprovementPlan['matrix'] {
  const syllabusLabels = new Map(syllabusNodes.map((node) => [node.code, node.label]))
  const topicGroups = new Map<string, { moduleId: string; label: string; questions: ReportQuestionInput[] }>()
  for (const question of questions) {
    const moduleId = resolveEsatModule(
      question.moduleCode ?? question.componentCode,
      question.subject,
    ) || 'unclassified'
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
        moduleLabel: MODULE_LABELS[group.moduleId] || group.moduleId,
        cells,
      }
    })
    .sort((a, b) => {
      const moduleDiff = MODULE_ORDER.indexOf(a.moduleId) - MODULE_ORDER.indexOf(b.moduleId)
      return moduleDiff || a.code.localeCompare(b.code)
    })
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

// 固定算法只选择样本充分且低于强掌握阈值的格子，红色和高难度优先。
function selectRoiCandidates(matrix: ReportAiImprovementPlan['matrix']): RoiCandidate[] {
  return matrix
    .flatMap((row) => row.cells
      .filter((cell) => cell.total >= 3 && cell.accuracy !== null && cell.accuracy <= 0.7)
      .map((cell) => ({
        gapKey: `${row.moduleId}:${row.code}:${cell.difficulty}`,
        topicCode: row.code,
        topicLabel: row.label,
        moduleId: row.moduleId,
        moduleLabel: row.moduleLabel,
        difficulty: cell.difficulty,
        difficultyLabel: cell.label,
        correct: cell.correct,
        total: cell.total,
        accuracy: cell.accuracy as number,
        suggestedHours: suggestedHours({ difficulty: cell.difficulty, accuracy: cell.accuracy as number }),
      })))
    .sort((a, b) => {
      const riskDiff = Number(a.accuracy >= 0.4) - Number(b.accuracy >= 0.4)
      const difficultyWeight: Record<DifficultyLevel, number> = { low: 1, medium: 2, high: 3 }
      return riskDiff
        || difficultyWeight[b.difficulty] - difficultyWeight[a.difficulty]
        || a.accuracy - b.accuracy
        || b.total - a.total
    })
    .slice(0, 5)
}

// 降级原因只引用矩阵中的真实数据，保证模型不可用时仍能解释优先级。
function fallbackPriorityReason(candidate: RoiCandidate): string {
  const accuracy = Math.round(candidate.accuracy * 100)
  const threshold = candidate.accuracy < 0.4 ? '低于 40% 风险阈值' : '处于 40%-70% 提升区间'
  return `${candidate.difficultyLabel}样本量 n=${candidate.total}，正确率 ${accuracy}%，${threshold}。`
}

// DeepSeek 只润色已选候选项的原因和前置检查，不参与分数、排序或投入时长计算。
async function generateRoiNarratives(candidates: RoiCandidate[]): Promise<Map<string, {
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
    requiredCitation: `正确率 ${Math.round(candidate.accuracy * 100)}%，样本量 n=${candidate.total}`,
  }))
  const cacheKey = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  const cached = roiCache.get(cacheKey)
  let generated = cached

  if (!generated) {
    try {
      const response = await requestDeepSeekJson<{ recommendations?: unknown }>(
        [
          '你是 ESAT 诊断报告分析师，请只输出 JSON。',
          '输出 recommendations 数组，每项只能包含 gapKey、priorityReason、prerequisiteCheck。',
          '必须逐项使用输入中的 gapKey，不得新增、删除或改变候选项。',
          'priorityReason 不超过90字，必须原样包含 requiredCitation，并客观说明该格子为何优先。',
          'prerequisiteCheck 不超过50字，只能建议检查当前 topic 的基础定义、公式或本次错题。',
          '不得生成分数、样本量、学习时长、院校结论、心理归因或新的知识点名称。',
          '不得声称存在知识点依赖关系。',
        ].join('\n'),
        { examType: 'ESAT', candidates: payload },
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
      console.info('[esat-diagnostic] ROI narratives generated', {
        model: response.model,
        totalTokens: response.usage.totalTokens,
      })
    } catch (error) {
      console.error('[esat-diagnostic] ROI narratives unavailable:', error)
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
): Promise<ReportAiImprovementPlan> {
  const matrix = buildAbilityMatrix(questions, syllabusNodes)
  const candidates = selectRoiCandidates(matrix)
  if (!candidates.length) return { matrix, highRoiGaps: [], analysisStatus: 'not-needed' }

  const narratives = await generateRoiNarratives(candidates)
  const highRoiGaps = candidates.map((candidate, index) => {
    const narrative = narratives.get(candidate.gapKey)
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
      suggestedHours: candidate.suggestedHours,
      priorityReason: narrative?.priorityReason || fallbackPriorityReason(candidate),
      prerequisiteCheck: narrative?.prerequisiteCheck || '先复盘本格错题，并检查该知识点的基础定义与核心公式。',
      analysisSource: narrative ? 'deepseek' as const : 'fallback' as const,
    }
  })
  return {
    matrix,
    highRoiGaps,
    analysisStatus: highRoiGaps.every((gap) => gap.analysisSource === 'deepseek') ? 'generated' : 'fallback',
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

// 学习模式综合时间、投入能力、模块分数、缺口压力和目标差距固定计算，保证结果稳定可解释。
function decideLearningMode(input: {
  examDate: string | null
  weeklyHours: number
  targetScore: number | null
  modules: AssessmentModule[]
  highRoiGaps: ReportAiImprovementPlan['highRoiGaps']
}): { weeks: number; mode: ReportLearningPath['summary']['mode']; reason: string } {
  const targetDate = input.examDate ? new Date(`${input.examDate}T00:00:00Z`) : null
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
  const targetGap = averageScore !== null && input.targetScore !== null
    ? Math.max(0, input.targetScore - averageScore)
    : 0

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
  if (targetGap >= 3) pressure += 3
  else if (targetGap >= 1.5) pressure += 2
  else if (targetGap > 0.5) pressure += 1
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
    input.targetScore === null
      ? '目标分数未设置'
      : `目标 ${input.targetScore.toFixed(1)} 分${averageScore === null ? '' : `，当前差距 ${targetGap.toFixed(1)} 分`}`,
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
}): Promise<{ phases: ReportLearningPath['phases']; source: 'deepseek' | 'fallback' }> {
  const allowedGaps = new Map(input.focusGaps.map((gap) => [gap.gapKey, gap]))
  const payload = {
    profile: {
      subjects: input.profile.subjects,
      targetMajor: input.profile.targetMajor,
      targetScore: input.profile.targetScore,
      examDate: input.profile.examDate,
      weeklyHours: input.summary.weeklyHours,
      targetUniversityCount: input.profile.targetUniversities.length,
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
  const cacheKey = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
  let generated = learningPathCache.get(cacheKey) as { phases?: unknown } | undefined
  if (!generated) {
    try {
      const response = await requestDeepSeekJson<{ phases?: unknown }>(
        [
          '你是 ESAT 个性化学习路径规划师，请只输出 JSON。',
          '输出 phases 数组，必须且只能包含 foundation、improvement、sprint 三项。',
          '每项包含 id、goal、strategy、tasks、activities。goal 与 strategy 各不超过100字。',
          'foundation.tasks 只能引用输入 focusGaps 的 gapKey，每项包含 gapKey、title、completionLabel；不得新增知识点。',
          'title 不超过50字；completionLabel 不超过70字，且必须原样包含该缺口的 suggestedHours。',
          'improvement 与 sprint 的 activities 各输出2条，每条不超过70字；不得改变阶段周数和总投入时长。',
          '必须结合备考科目、目标专业、目标分数、考试日期、每周投入和固定模式判定依据；缺失资料不得猜测。',
          '若 timingAnalysis.available 为 true，可将其中模块时间效率用于限时训练或整卷节奏安排；不得创造未提供的耗时、比例或时间问题。',
          '所有百分比只能使用输入中的 accuracyPercent、targetPercent 或40%阶段阈值，不得创造其他提分指标。',
          '不得生成院校录取线、录取概率、心理归因、知识点依赖或输入中不存在的分数。',
        ].join('\n'),
        payload,
        { maxTokens: 1400 },
      )
      generated = response.data
      learningPathCache.set(cacheKey, generated)
      console.info('[esat-diagnostic] learning path generated', {
        model: response.model,
        totalTokens: response.usage.totalTokens,
      })
    } catch (error) {
      console.error('[esat-diagnostic] learning path unavailable:', error)
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
      tasks,
      activities: activities.length === 2 ? activities : phase.activities,
    }
  })
  return { phases, source: 'deepseek' }
}

// 学习路径先建立稳定调度骨架，再让模型在受控范围内完成个性化聚焦。
async function buildLearningPath(
  plan: ReportAiImprovementPlan,
  modules: AssessmentModule[],
  learnerProfile: LearnerProfileInput | undefined,
  timing: ReportOverview['timing'],
): Promise<ReportLearningPath> {
  const matrixSubjects = Array.from(new Set(plan.matrix.map((row) => row.moduleLabel)))
  const profile: LearnerProfileInput = {
    subjects: learnerProfile?.subjects?.filter(Boolean) || [],
    targetUniversities: learnerProfile?.targetUniversities?.filter(Boolean) || [],
    targetMajor: learnerProfile?.targetMajor?.trim() || null,
    targetScore: learnerProfile?.targetScore && learnerProfile.targetScore >= 1 && learnerProfile.targetScore <= 9
      ? learnerProfile.targetScore
      : null,
    examDate: learnerProfile?.examDate || null,
    weeklyHours: learnerProfile?.weeklyHours && learnerProfile.weeklyHours > 0
      ? learnerProfile.weeklyHours
      : null,
  }
  const missingFields = [
    !profile.subjects.length ? '备考科目' : '',
    !profile.targetUniversities.length ? '目标院校' : '',
    !profile.targetMajor ? '目标专业' : '',
    profile.targetScore === null ? '目标分数' : '',
    !profile.examDate ? '考试日期' : '',
    profile.weeklyHours === null ? '每周可投入时长' : '',
  ].filter(Boolean)
  const weeklyHours = profile.weeklyHours || 12
  const modeDecision = decideLearningMode({
    examDate: profile.examDate,
    weeklyHours,
    targetScore: profile.targetScore,
    modules,
    highRoiGaps: plan.highRoiGaps,
  })
  const [foundationWeeks, improvementWeeks, sprintWeeks] = allocatePhaseWeeks(modeDecision.weeks)
  const majorModules = majorPreferredModules(profile.targetMajor)
  const subjects = profile.subjects.length ? profile.subjects : matrixSubjects
  const rankedGaps: LearningFocusGap[] = plan.highRoiGaps
    .map((gap) => ({
      ...gap,
      gapKey: `${gap.moduleId}:${gap.topicCode}:${gap.difficulty}`,
    }))
    .filter((gap) => subjectMatchesModule(subjects, gap.moduleId, gap.moduleLabel))
    .sort((a, b) => {
      const aMajor = majorModules.includes(a.moduleId) ? majorModules.indexOf(a.moduleId) : 99
      const bMajor = majorModules.includes(b.moduleId) ? majorModules.indexOf(b.moduleId) : 99
      return aMajor - bMajor || a.rank - b.rank
    })
  const focusGaps = rankedGaps.slice(0, 3)
  const focusTags = Array.from(new Set(focusGaps.map((gap) => gap.topicLabel)))
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
    completionLabel: `完成本格错题复盘与 ${gap.suggestedHours} 专项投入`,
  }))
  const summaryBase = {
    planningWeeks: modeDecision.weeks,
    weeklyHours,
    totalHours: modeDecision.weeks * weeklyHours,
    mode: modeDecision.mode,
    modeReason: modeDecision.reason,
    dataSourceNote: missingFields.length
      ? `尚未设置：${missingFields.join('、')}；缺失项使用保守默认值，不推断院校录取门槛。`
      : '已关联个人中心备考资料；目标院校仅作为申请背景，不推断录取分数线。',
  }
  const fallbackPhases: ReportLearningPath['phases'] = [
      {
        id: 'foundation',
        title: '阶段 1：基础补漏',
        durationWeeks: foundationWeeks,
        weekLabel: weekLabel(1, foundationWeeks),
        goal: firstGap && firstTarget !== null
          ? `优先将“${firstGap.topicLabel} × ${firstGap.difficultyLabel}”正确率从 ${Math.round(firstGap.accuracy * 100)}% 提升至 ${Math.round(firstTarget * 100)}% 以上。`
          : '复盘本次诊断错题，补齐样本充分格子中的基础薄弱项。',
        strategy: `按高 ROI 顺序逐项补漏，每项完成复盘、专项训练与小样本复测。${timingTrainingFocus}`,
        focusTags,
        tasks,
        activities: [],
      },
      {
        id: 'improvement',
        title: '阶段 2：难度提升',
        durationWeeks: improvementWeeks,
        weekLabel: weekLabel(improvementStart, improvementWeeks),
        goal: '将样本充分格子中的红色缺口逐步提升至 40% 以上，并建立跨题型稳定性。',
        strategy: `围绕阶段一复诊后仍存在的缺口进行中高难度迁移，并用限时模块测试校验稳定性。${timingTrainingFocus}`,
        focusTags,
        tasks: [],
        activities: [
          `${weekLabel(improvementStart, Math.max(1, improvementWeeks - 1))}：完成重点知识点的中高难度综合专项。`,
          `${weekLabel(improvementStart + Math.max(0, improvementWeeks - 1), 1)}：完成 2 次模块限时模拟并复盘节奏。`,
        ],
      },
      {
        id: 'sprint',
        title: '阶段 3：模考冲刺',
        durationWeeks: sprintWeeks,
        weekLabel: weekLabel(sprintStart, sprintWeeks),
        goal: profile.examDate
          ? `在 ${profile.examDate} 考试日前稳定完成整套模考与错题复盘${applicationContext}。`
          : `在目标考试前稳定完成整套模考与错题复盘${applicationContext}。`,
        strategy: '减少新内容输入，以整卷节奏、错题回收和稳定得分为核心进行冲刺。',
        focusTags: subjects,
        tasks: [],
        activities: [
          '每周完成 1 套完整模考，并按知识点与难度复盘错题。',
          '优先处理限时场景下仍不稳定的高样本缺口，保持已掌握格子的正确率。',
        ],
      },
    ]
  const personalized = await personalizeLearningPath({
    phases: fallbackPhases,
    focusGaps,
    profile: { ...profile, subjects },
    summary: summaryBase,
    timing,
  })
  return {
    profile: { ...profile, subjects, missingFields },
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
  await input.onStage?.('module_analyzing')
  const moduleAnalysisPromise = generateModuleAnalyses(modules).then(async (result) => {
    await input.onStage?.('roi_analyzing')
    return result
  })
  const [moduleAnalyses, aiImprovementPlan] = await Promise.all([
    moduleAnalysisPromise,
    buildAiImprovementPlan(input.questions, input.syllabusNodes || []),
  ])
  const modulesWithRisks = modules.map((module) => {
    const analysis = moduleAnalyses[module.id]
    return {
      ...module,
      positioning: module.positioning
        ? {
            ...module.positioning,
            competitiveness: analysis?.positioningInsight || module.positioning.competitiveness,
            analysisSource: analysis?.positioningInsight ? 'deepseek' as const : 'fallback' as const,
          }
        : null,
      riskSignal: analysis?.riskSignal || null,
      diagnosticAnalysis: analysis
        ? {
            summary: analysis.summary,
            strength: analysis.strength,
            keyIssue: analysis.keyIssue,
            focusSuggestion: analysis.focusSuggestion,
            source: 'deepseek' as const,
          }
        : buildFallbackModuleAnalysis(module),
    }
  })
  const difficultyMastery = buildDifficultyMastery(input.questions)
  const overview = buildOverview(input.questions, input.paper, input.elapsedDurationSeconds)
  await input.onStage?.('path_analyzing')
  const learningPath = await buildLearningPath(
    aiImprovementPlan,
    modulesWithRisks,
    input.learnerProfile,
    overview.timing,
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
  }
}
