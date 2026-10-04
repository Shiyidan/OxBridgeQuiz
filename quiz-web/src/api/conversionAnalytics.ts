// 转化分析 API：后台独立页签使用注册观察期、真实支付与付费学习数据。
import { callApi } from '@/utils/request'

export interface ConversionParams {
  startAt: string
  endAt: string
  windowDays: number
}
export interface ConversionDuration {
  key: 'registration' | 'activation' | 'payment' | 'checkout'
  sampleCount: number
  eligibleCount: number
  medianSeconds: number | null
  p75Seconds: number | null
  p90Seconds: number | null
  buckets: Array<{ label: string; count: number; share: number | null }>
}
export interface ConversionCell {
  weekday: number
  hour: number
  users: number
  userHours: number
}
export interface ConversionDailyPayment {
  date: string
  paidUsers: number
}
export interface ConversionSegment {
  label: string
  users: number
  activated: number
  paid: number
  conversionRate: number | null
  medianSeconds: number | null
}
export interface ConversionResult {
  period: ConversionParams & { observedAt: string; timezone: string }
  overview: {
    registered: number
    matured: number
    observing: number
    started: number
    activated: number
    ordered: number
    converted: number
    activationRate: number | null
    conversionRate: number | null
    firstPayersInPeriod: number
    repeatPayerCount: number
    firstPaymentRefundedUsers: number
    paidActiveUsers: number
    paidLearningEligible: number
    paidLearningUsers: number
    paidLearningRate: number | null
    medianPaymentSeconds: number | null
  }
  funnels: Array<{ key: string; label: string; steps: Array<{ label: string; count: number }> }>
  durations: ConversionDuration[]
  dailyPayments: ConversionDailyPayment[]
  heatmap: ConversionCell[]
  hourly: Array<{ hour: number; users: number; userHours: number }>
  topHours: Array<{ hour: number; users: number; userHours: number }>
  segments: ConversionSegment[]
  weeklyCohorts: Array<{
    week: string
    users: number
    activated: number
    paid: number
    conversionRate: number | null
  }>
  quality: {
    registrationTracked: number
    registrationTotal: number
    smallCohort: boolean
    invalidPaymentTimes: number
  }
}

// 统计失败由面板展示可重试状态，避免重复全局弹窗。
export function getConversionAnalytics(params: ConversionParams) {
  return callApi<ConversionResult>({
    method: 'GET',
    url: '/admin/conversion-analytics',
    params: { startAt: params.startAt, endAt: params.endAt, windowDays: String(params.windowDays) },
    silent: true,
  })
}
