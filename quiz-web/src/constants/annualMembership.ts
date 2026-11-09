// 年卡商品展示定义；成交金额以服务端读取的最新定价为准。
export const ANNUAL_PLAN = { PRACTICE: 'annual_practice', LEARNING: 'annual_learning', BUNDLE: 'annual_bundle' } as const
export type AnnualPlan = (typeof ANNUAL_PLAN)[keyof typeof ANNUAL_PLAN]
export interface AnnualPricing {
  practiceOriginalPriceCents: number
  practicePriceCents: number
  learningOriginalPriceCents: number
  learningPriceCents: number
  bundlePriceCents: number
}
export const DEFAULT_ANNUAL_PRICING: AnnualPricing = {
  practiceOriginalPriceCents: 49800, practicePriceCents: 39800,
  learningOriginalPriceCents: 24800, learningPriceCents: 19800, bundlePriceCents: 52000,
}
export const ANNUAL_PLAN_LABELS: Record<AnnualPlan, string> = {
  annual_practice: '做题年卡', annual_learning: '学习平台年卡', annual_bundle: '做题＋学习平台年卡',
}
