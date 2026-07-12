// UAT-UK 2025/26 ESAT 官方模块成绩分布数字化数据，供定位图和参考百分位共用。

export const ESAT_DISTRIBUTION_SOURCE_URL =
  'https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2026/02/11111430/ESAT_Explanation_of_Results-October2025_and_January2026.pdf'

export const ESAT_DISTRIBUTION_COHORT = 'UAT-UK 2025年10月与2026年1月考试'

export interface EsatDistributionPoint {
  score: number
  percentage: number
}

const SCORE_BINS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]

const DISTRIBUTION_PERCENTAGES: Record<string, number[]> = {
  maths1: [0.4, 0.7, 2.2, 3.5, 11.2, 11.8, 15.4, 17.2, 10.2, 8.7, 5.5, 4.9, 2.8, 2.0, 0.4, 1.5, 1.7],
  maths2: [2.1, 2.2, 3.4, 5.4, 10.5, 13.3, 14.8, 9.9, 12.5, 7.3, 7.1, 3.5, 2.7, 1.1, 1.6, 0.4, 2.3],
  physics: [3.7, 2.7, 5.6, 7.5, 7.7, 12.9, 11.3, 13.0, 8.1, 10.4, 5.0, 4.3, 3.4, 0.6, 2.0, 0.3, 1.7],
  chemistry: [1.8, 3.3, 2.5, 4.8, 11.7, 7.0, 14.0, 12.3, 9.4, 11.0, 6.2, 3.4, 5.2, 4.0, 0.6, 0, 3.2],
  biology: [7.1, 0.9, 5.2, 7.7, 7.1, 9.0, 9.3, 11.0, 10.8, 9.0, 5.5, 7.3, 3.2, 2.5, 2.1, 0, 2.7],
}

// 图表百分比来自官方图片数字化，按总和归一后用于累计百分位，消除像素读取产生的微小总和误差。
export function getEsatScoreDistribution(moduleId: string): EsatDistributionPoint[] {
  const percentages = DISTRIBUTION_PERCENTAGES[moduleId] || DISTRIBUTION_PERCENTAGES.maths1!
  const total = percentages.reduce((sum, value) => sum + value, 0)
  return SCORE_BINS.map((score, index) => ({
    score,
    percentage: total > 0 ? (percentages[index]! / total) * 100 : 0,
  }))
}

// 当前分数使用相邻分数档的中秩累计百分位线性插值，避免把整档考生全部算在同一侧。
export function estimateEsatPercentile(moduleId: string, score: number | null): number | null {
  if (score === null) return null
  const points = getEsatScoreDistribution(moduleId)
  const boundedScore = Math.max(1, Math.min(9, score))
  const midRanks: Array<{ score: number; percentile: number }> = []
  let cumulative = 0

  for (const point of points) {
    midRanks.push({ score: point.score, percentile: cumulative + point.percentage / 2 })
    cumulative += point.percentage
  }

  const upperIndex = midRanks.findIndex((point) => point.score >= boundedScore)
  if (upperIndex <= 0) return Math.round(midRanks[0]!.percentile)
  if (upperIndex < 0) return Math.round(midRanks[midRanks.length - 1]!.percentile)

  const lower = midRanks[upperIndex - 1]!
  const upper = midRanks[upperIndex]!
  const ratio = (boundedScore - lower.score) / (upper.score - lower.score)
  return Math.round(lower.percentile + (upper.percentile - lower.percentile) * ratio)
}

// 曲线标记高度沿相邻真实档位线性插值，不再通过正态分布公式计算。
export function estimateEsatDistributionHeight(moduleId: string, score: number | null): number | null {
  if (score === null) return null
  const points = getEsatScoreDistribution(moduleId)
  const boundedScore = Math.max(1, Math.min(9, score))
  const upperIndex = points.findIndex((point) => point.score >= boundedScore)
  if (upperIndex <= 0) return points[0]!.percentage
  if (upperIndex < 0) return points[points.length - 1]!.percentage
  const lower = points[upperIndex - 1]!
  const upper = points[upperIndex]!
  const ratio = (boundedScore - lower.score) / (upper.score - lower.score)
  return lower.percentage + (upper.percentage - lower.percentage) * ratio
}
