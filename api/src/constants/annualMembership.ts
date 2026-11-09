// 年卡商品与权益范围；旧套餐继续按原规则履约，新下单仅接受这三种商品。
export const ANNUAL_PLAN = {
  PRACTICE: 'annual_practice',
  LEARNING: 'annual_learning',
  BUNDLE: 'annual_bundle',
} as const
export type AnnualPlan = (typeof ANNUAL_PLAN)[keyof typeof ANNUAL_PLAN]
export type MembershipFeature = 'practice' | 'learning'
export const ANNUAL_DURATION_DAYS = 365
export const DEFAULT_ANNUAL_PRICING = {
  practiceOriginalPriceCents: 49800,
  practicePriceCents: 39800,
  learningOriginalPriceCents: 24800,
  learningPriceCents: 19800,
  bundlePriceCents: 52000,
}
export type AnnualPricing = typeof DEFAULT_ANNUAL_PRICING

// 新订单只允许年卡，历史月卡、季卡仍可用于查询、退款和履约。
export function isAnnualPlan(value: unknown): value is AnnualPlan {
  return Object.values(ANNUAL_PLAN).includes(value as AnnualPlan)
}

// 旧会员原有功能全部保留，新年卡按购买的学习或做题范围授权。
export function planIncludesFeature(plan: string, feature: MembershipFeature): boolean {
  if (plan === ANNUAL_PLAN.PRACTICE) return feature === 'practice'
  if (plan === ANNUAL_PLAN.LEARNING) return feature === 'learning'
  return true
}

// 尚未配置年卡时使用新品默认价，不从历史月卡价格推导。
export function annualPricing(value: unknown): AnnualPricing {
  const input = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  return Object.fromEntries(Object.entries(DEFAULT_ANNUAL_PRICING).map(([key, fallback]) => {
    const amount = input[key]
    return [key, typeof amount === 'number' && Number.isInteger(amount) && amount > 0 ? amount : fallback]
  })) as AnnualPricing
}

// 支付金额由服务端选择，折扣标签不参与金额计算。
export function annualPlanPrice(plan: AnnualPlan, pricing: AnnualPricing): number {
  return plan === ANNUAL_PLAN.PRACTICE ? pricing.practicePriceCents
    : plan === ANNUAL_PLAN.LEARNING ? pricing.learningPriceCents : pricing.bundlePriceCents
}
