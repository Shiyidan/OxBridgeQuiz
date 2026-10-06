// 转化分析 API：后台独立页签使用注册观察期、真实支付与付费学习数据。
import { callApi } from '@/utils/request'

export interface ConversionParams {
  startAt: string
  endAt: string
  windowDays: number
  examDate?: string
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
export interface ConversionPaidUserGrowthPoint {
  date: string
  cumulativePaidUsers: number
}
export interface ExamPaymentAnalysis {
  examDate: string
  totalUsers: number
  stages: Array<{
    label: string
    startDate: string | null
    endDate: string | null
    observedDays: number
    users: number
    dailyAverage: number | null
    share: number | null
    status: 'not_started' | 'outside_range' | 'ongoing' | 'partial' | 'complete'
  }>
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
  paidUserGrowth: ConversionPaidUserGrowthPoint[]
  heatmap: ConversionCell[]
  hourly: Array<{ hour: number; users: number; userHours: number }>
  topHours: Array<{ hour: number; users: number; userHours: number }>
  examPayments: ExamPaymentAnalysis
  quality: {
    registrationTracked: number
    registrationTotal: number
    smallCohort: boolean
    invalidPaymentTimes: number
  }
}

export interface PaidUserAnalytics {
  observedAt: string
  paidUsers: number
  everPaidUsers: number
  fullyRefundedUsers: number
  geography: {
    knownUsers: number
    unknownUsers: number
    regions: Array<{ label: string; users: number; share: number | null }>
  }
  duration: ConversionDuration & {
    meanSeconds: number | null
    minSeconds: number | null
    maxSeconds: number | null
    invalidUsers: number
    withinDayShare: number | null
    withinWeekShare: number | null
  }
}

// 累计付费分析独立加载，首次地域解析允许更长的等待时间。
export function getPaidUserAnalytics() {
  return callApi<PaidUserAnalytics>({
    method: 'GET',
    url: '/admin/conversion-analytics/paid-users',
    timeout: 60000,
    silent: true,
  })
}

// 统计失败由面板展示可重试状态，避免重复全局弹窗。
export function getConversionAnalytics(params: ConversionParams) {
  return callApi<ConversionResult>({
    method: 'GET',
    url: '/admin/conversion-analytics',
    params: {
      startAt: params.startAt,
      endAt: params.endAt,
      windowDays: String(params.windowDays),
      examDate: params.examDate,
    },
    silent: true,
  })
}
