/**
 * 统一评分引擎：按考试类型分发策略，将原始答题结果转换为标准分。
 * 使用于 exam 路由（/exams/:id/result）、diagnostic 服务和 profile-stats。
 *
 * ESAT 策略按模块独立评分（1.0-9.0），不产生官方总分。
 * TMUA 对外只报告单一总分；分卷估值仅供诊断，参考曲线会随年度动态变化。
 * 难度标签不参与标准分加权，符合 Rasch 模型只按原始正确数估计能力的规则。
 */

// ---- 类型 ----

/** ESAT 规范模块标识 */
export type EsatModule = 'maths1' | 'maths2' | 'physics' | 'chemistry' | 'biology'
export type TmuaPaper = 'paper1' | 'paper2'

/** raw→scaled 锚点 */
interface RawToScaledPoint {
  raw: number
  scaled: number
}

/** 单模块评分结果 */
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

/** 分数段位 */
interface ScoreBand {
  band: string
  label: string
  approximatePercentile: number
}

/** 顶层评分结果 */
export interface ScoringResult {
  examType: string
  strategy: string
  overallScore: number
  overallBand: string
  overallBandLabel: string
  modules: ModuleScore[]
  generatedAt: string
}

/** computeScores 入参：每题一条 */
export interface QuestionResult {
  subject: string | null
  isCorrect: boolean
  number?: number | null
}

// ---- ESAT 模块定义 ----

const ESAT_MODULE_META: Record<EsatModule, { label: string; order: number }> = {
  maths1:    { label: 'Mathematics 1', order: 1 },
  maths2:    { label: 'Mathematics 2', order: 2 },
  physics:   { label: 'Physics',       order: 3 },
  chemistry: { label: 'Chemistry',     order: 4 },
  biology:   { label: 'Biology',       order: 5 },
}

/** subject 关键词 → EsatModule 映射表 */
const SUBJECT_KEYWORDS: [EsatModule, string[]][] = [
  ['maths1',    ['maths 1', 'mathematics 1', 'maths1', 'mathematics1', '数学1']],
  ['maths2',    ['maths 2', 'mathematics 2', 'maths2', 'mathematics2', '数学2']],
  ['physics',   ['physics', '物理']],
  ['chemistry', ['chemistry', '化学']],
  ['biology',   ['biology', '生物']],
]

// ---- raw→scaled 参考表（来自 ESAT计分规则.md §四）----

/** Mathematics 1：最苛刻的转换曲线 */
const MATHS1_TABLE: RawToScaledPoint[] = [
  { raw: 0,  scaled: 1.0 },
  { raw: 8.5, scaled: 3.0 },
  { raw: 11.5, scaled: 4.0 },
  { raw: 13.5, scaled: 4.5 },
  { raw: 15,  scaled: 5.0 },
  { raw: 16.5, scaled: 5.5 },
  { raw: 18,  scaled: 6.0 },
  { raw: 20,  scaled: 6.5 },
  { raw: 22,  scaled: 7.0 },
  { raw: 23,  scaled: 7.5 },
  { raw: 24.5, scaled: 8.0 },
  { raw: 25.5, scaled: 8.5 },
  { raw: 27,  scaled: 9.0 },
]

/** Mathematics 2：最宽松的转换曲线 */
const MATHS2_TABLE: RawToScaledPoint[] = [
  { raw: 0,  scaled: 1.0 },
  { raw: 7.5, scaled: 3.0 },
  { raw: 10.5, scaled: 4.0 },
  { raw: 12.5, scaled: 4.5 },
  { raw: 13.5, scaled: 5.0 },
  { raw: 15.5, scaled: 5.5 },
  { raw: 16.5, scaled: 6.0 },
  { raw: 18.5, scaled: 6.5 },
  { raw: 20.5, scaled: 7.0 },
  { raw: 21.5, scaled: 7.5 },
  { raw: 22.5, scaled: 8.0 },
  { raw: 23.5, scaled: 8.5 },
  { raw: 26,  scaled: 9.0 },
]

/** Physics：中等转换曲线 */
const PHYSICS_TABLE: RawToScaledPoint[] = [
  { raw: 0,  scaled: 1.0 },
  { raw: 7.5, scaled: 3.0 },
  { raw: 10.5, scaled: 4.0 },
  { raw: 12.5, scaled: 4.5 },
  { raw: 14.5, scaled: 5.0 },
  { raw: 15.5, scaled: 5.5 },
  { raw: 17.5, scaled: 6.0 },
  { raw: 19,  scaled: 6.5 },
  { raw: 21,  scaled: 7.0 },
  { raw: 22.5, scaled: 7.5 },
  { raw: 23.5, scaled: 8.0 },
  { raw: 24.5, scaled: 8.5 },
  { raw: 26.5, scaled: 9.0 },
]

/** Chemistry：与 Physics 接近 */
const CHEMISTRY_TABLE: RawToScaledPoint[] = [
  { raw: 0,  scaled: 1.0 },
  { raw: 7.5, scaled: 3.0 },
  { raw: 10.5, scaled: 4.0 },
  { raw: 12.5, scaled: 4.5 },
  { raw: 14.5, scaled: 5.0 },
  { raw: 15.5, scaled: 5.5 },
  { raw: 17.5, scaled: 6.0 },
  { raw: 19,  scaled: 6.5 },
  { raw: 21,  scaled: 7.0 },
  { raw: 22.5, scaled: 7.5 },
  { raw: 23.5, scaled: 8.0 },
  { raw: 24.5, scaled: 8.5 },
  { raw: 26.5, scaled: 9.0 },
]

/** Biology：高端压缩，raw 需求高 */
const BIOLOGY_TABLE: RawToScaledPoint[] = [
  { raw: 0,  scaled: 1.0 },
  { raw: 9.5, scaled: 3.0 },
  { raw: 12.5, scaled: 4.0 },
  { raw: 14.5, scaled: 4.5 },
  { raw: 16,  scaled: 5.0 },
  { raw: 17.5, scaled: 5.5 },
  { raw: 19,  scaled: 6.0 },
  { raw: 21,  scaled: 6.5 },
  { raw: 22.5, scaled: 7.0 },
  { raw: 23.5, scaled: 7.5 },
  { raw: 24.5, scaled: 8.0 },
  { raw: 25.5, scaled: 8.5 },
  { raw: 26.5, scaled: 9.0 },
]

const ESAT_TABLES: Record<EsatModule, RawToScaledPoint[]> = {
  maths1: MATHS1_TABLE,
  maths2: MATHS2_TABLE,
  physics: PHYSICS_TABLE,
  chemistry: CHEMISTRY_TABLE,
  biology: BIOLOGY_TABLE,
}

// ---- TMUA raw→scaled 代表性参考表（2024 新制） ----

const TMUA_TABLES: Record<TmuaPaper, RawToScaledPoint[]> = {
  paper1: [
    { raw: 0, scaled: 1 }, { raw: 3, scaled: 1 }, { raw: 4, scaled: 1.6 },
    { raw: 5, scaled: 2.3 }, { raw: 6, scaled: 3 }, { raw: 7, scaled: 3.6 },
    { raw: 8, scaled: 4.2 }, { raw: 9, scaled: 4.7 }, { raw: 10, scaled: 5.3 },
    { raw: 11, scaled: 5.8 }, { raw: 12, scaled: 6.4 }, { raw: 13, scaled: 6.7 },
    { raw: 14, scaled: 6.9 }, { raw: 15, scaled: 7.1 }, { raw: 16, scaled: 7.4 },
    { raw: 17, scaled: 7.8 }, { raw: 18, scaled: 8.2 }, { raw: 19, scaled: 8.9 },
    { raw: 20, scaled: 9 },
  ],
  paper2: [
    { raw: 0, scaled: 1 }, { raw: 3, scaled: 1 }, { raw: 4, scaled: 1.3 },
    { raw: 5, scaled: 2.2 }, { raw: 6, scaled: 2.9 }, { raw: 7, scaled: 3.6 },
    { raw: 8, scaled: 4.2 }, { raw: 9, scaled: 4.8 }, { raw: 10, scaled: 5.4 },
    { raw: 11, scaled: 6 }, { raw: 12, scaled: 6.5 }, { raw: 13, scaled: 6.8 },
    { raw: 14, scaled: 7 }, { raw: 15, scaled: 7.3 }, { raw: 16, scaled: 7.6 },
    { raw: 17, scaled: 7.9 }, { raw: 18, scaled: 8.4 }, { raw: 19, scaled: 9 },
    { raw: 20, scaled: 9 },
  ],
}

// ---- 分数段位 ----

const SCORE_BANDS: (ScoreBand & { min: number; max: number })[] = [
  { min: 8.0, max: 9.0, band: 'elite',       label: '顶尖', approximatePercentile: 96 },
  { min: 7.0, max: 7.9, band: 'excellent',   label: '优秀', approximatePercentile: 90 },
  { min: 6.0, max: 6.9, band: 'good',        label: '良好', approximatePercentile: 80 },
  { min: 4.0, max: 5.9, band: 'average',     label: '中等', approximatePercentile: 55 },
  { min: 1.0, max: 3.9, band: 'below_avg',   label: '偏低', approximatePercentile: 20 },
]

// ---- 公开工具函数 ----

/** 将 Question.subject 映射到规范 EsatModule，无法识别返回 null */
export function mapSubjectToEsatModule(subject: string | null | undefined): EsatModule | null {
  if (!subject) return null
  const normalized = subject.toLowerCase().trim()
  for (const [module, keywords] of SUBJECT_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return module
  }
  return null
}

/** 分段线性插值：raw → scaled，结果四舍五入到 1 位小数，夹紧到 [1.0, 9.0] */
export function interpolateScaledScore(raw: number, table: RawToScaledPoint[]): number {
  if (!table.length) return 1.0
  if (raw <= table[0].raw) return table[0].scaled
  const last = table[table.length - 1]
  if (raw >= last.raw) return last.scaled

  // 找到包围区间 [lo, hi)
  for (let i = 0; i < table.length - 1; i++) {
    const lo = table[i]
    const hi = table[i + 1]
    if (raw >= lo.raw && raw <= hi.raw) {
      if (hi.raw === lo.raw) return lo.scaled
      const fraction = (raw - lo.raw) / (hi.raw - lo.raw)
      const scaled = lo.scaled + fraction * (hi.scaled - lo.scaled)
      return clampScore(Math.round(scaled * 10) / 10)
    }
  }
  return last.scaled
}

/** 根据 1.0-9.0 标准分返回段位信息 */
export function getScoreBand(scaled: number): { band: string; label: string; approximatePercentile: number } {
  for (const b of SCORE_BANDS) {
    if (scaled >= b.min && scaled <= b.max) {
      return { band: b.band, label: b.label, approximatePercentile: b.approximatePercentile }
    }
  }
  return { band: 'below_avg', label: '偏低', approximatePercentile: 20 }
}

/** 快速计算单个 ESAT 模块的标准分 */
export function quickEsatScore(module: EsatModule, correct: number, total: number): number {
  if (total <= 0) return 1.0
  const table = ESAT_TABLES[module]
  if (!table) return clampScore(Math.round((correct / total) * 9 * 10) / 10)
  return interpolateScaledScore(correct, table)
}

/** TMUA 分卷诊断估值：按实际题量归一到 20 题后查 2024 新制代表曲线。 */
export function quickTmuaPaperScore(paper: TmuaPaper, correct: number, total: number): number {
  if (total <= 0) return 1.0
  const normalizedRaw = Math.max(0, Math.min(20, (correct / total) * 20))
  return interpolateScaledScore(normalizedRaw, TMUA_TABLES[paper])
}

// ---- 评分主入口 ----

/** 按考试类型分发评分策略，返回统一 ScoringResult */
export function computeScores(
  examType: string,
  questionsWithResults: QuestionResult[],
): ScoringResult {
  const now = new Date().toISOString()

  if (examType === 'ESAT') {
    return computeEsatScores(questionsWithResults, now)
  }

  if (examType === 'TMUA') {
    return computeTmuaScores(questionsWithResults, now)
  }

  // 通用策略兜底
  return computeGenericScores(examType, questionsWithResults, now)
}

// ---- 内部实现 ----

function clampScore(value: number): number {
  return Math.max(1.0, Math.min(9.0, value))
}

/** ESAT 策略：按模块独立评分 */
function computeEsatScores(
  questions: QuestionResult[],
  generatedAt: string,
): ScoringResult {
  // 按模块分组
  const groups = new Map<EsatModule, { total: number; correct: number }>()
  for (const q of questions) {
    const module = mapSubjectToEsatModule(q.subject)
    if (!module) continue
    const entry = groups.get(module) || { total: 0, correct: 0 }
    entry.total += 1
    if (q.isCorrect) entry.correct += 1
    groups.set(module, entry)
  }

  // 每个模块独立评分
  const modules: ModuleScore[] = []
  for (const [module, counts] of groups) {
    const meta = ESAT_MODULE_META[module]
    const table = ESAT_TABLES[module]
    const scaledScore = interpolateScaledScore(counts.correct, table)
    const band = getScoreBand(scaledScore)
    modules.push({
      module,
      moduleLabel: meta.label,
      rawScore: counts.correct,
      totalQuestions: counts.total,
      scaledScore,
      band: band.band,
      bandLabel: band.label,
      approximatePercentile: band.approximatePercentile,
    })
  }

  // 按模块顺序排序
  modules.sort((a, b) => {
    const orderA = ESAT_MODULE_META[a.module as EsatModule]?.order ?? 99
    const orderB = ESAT_MODULE_META[b.module as EsatModule]?.order ?? 99
    return orderA - orderB
  })

  // 总体分 = 各模块加权平均
  let overallScore = 1.0
  if (modules.length > 0) {
    const totalQ = modules.reduce((sum, m) => sum + m.totalQuestions, 0)
    overallScore = totalQ > 0
      ? clampScore(Math.round(modules.reduce((sum, m) => sum + m.scaledScore * m.totalQuestions, 0) / totalQ * 10) / 10)
      : 1.0
  } else {
    // 没有匹配到任何模块 → 退化为通用策略
    const total = questions.length
    const correct = questions.filter((q) => q.isCorrect).length
    overallScore = total > 0 ? clampScore(Math.round((correct / total) * 9 * 10) / 10) : 1.0
  }

  const overallBand = getScoreBand(overallScore)

  return {
    examType: 'ESAT',
    strategy: 'esat',
    overallScore,
    overallBand: overallBand.band,
    overallBandLabel: overallBand.label,
    modules,
    generatedAt,
  }
}

/** TMUA 平台等效估值：两卷分别查代表曲线后取平均，对外仍只使用单一总分。 */
function computeTmuaScores(
  questions: QuestionResult[],
  generatedAt: string,
): ScoringResult {
  const midpoint = Math.ceil(questions.length / 2)
  const groups: Record<TmuaPaper, QuestionResult[]> = { paper1: [], paper2: [] }
  questions.forEach((question, index) => {
    const subject = question.subject?.toLowerCase() || ''
    const paper: TmuaPaper = /paper\s*2|p2|reasoning|推理/.test(subject)
      ? 'paper2'
      : /paper\s*1|p1|thinking|思维/.test(subject)
        ? 'paper1'
        : index < midpoint ? 'paper1' : 'paper2'
    groups[paper].push(question)
  })

  const modules: ModuleScore[] = (Object.keys(groups) as TmuaPaper[])
    .filter((paper) => groups[paper].length > 0)
    .map((paper) => {
      const items = groups[paper]
      const rawScore = items.filter((question) => question.isCorrect).length
      const scaledScore = quickTmuaPaperScore(paper, rawScore, items.length)
      const band = getScoreBand(scaledScore)
      return {
        module: paper,
        moduleLabel: paper === 'paper1' ? 'Paper 1' : 'Paper 2',
        rawScore,
        totalQuestions: items.length,
        scaledScore,
        band: band.band,
        bandLabel: band.label,
        approximatePercentile: band.approximatePercentile,
      }
    })

  const overallScore = modules.length
    ? clampScore(Math.round((modules.reduce((sum, module) => sum + module.scaledScore, 0) / modules.length) * 10) / 10)
    : 1
  const overallBand = getScoreBand(overallScore)
  return {
    examType: 'TMUA',
    strategy: 'tmua-equivalent',
    overallScore,
    overallBand: overallBand.band,
    overallBandLabel: overallBand.label,
    modules,
    generatedAt,
  }
}

/** 通用策略：correct/total * 9 */
function computeGenericScores(
  examType: string,
  questions: QuestionResult[],
  generatedAt: string,
): ScoringResult {
  const total = questions.length
  const correct = questions.filter((q) => q.isCorrect).length
  const overallScore = total > 0
    ? clampScore(Math.round((correct / total) * 9 * 10) / 10)
    : 1.0
  const overallBand = getScoreBand(overallScore)

  return {
    examType,
    strategy: 'generic',
    overallScore,
    overallBand: overallBand.band,
    overallBandLabel: overallBand.label,
    modules: [],
    generatedAt,
  }
}
