// 官方考期工具：为无限模考倒计时集中维护 UAT-UK 中国大陆及港澳考试窗口。
import type { ActiveExamType } from '@/stores/auth'

export const OFFICIAL_EXAM_DATES_SOURCE = 'https://esat-tmua.ac.uk/deadlines/'

export interface OfficialExamSitting {
  examType: ActiveExamType
  period: string
  startDate: string
  endDate: string
  regionLabel: string
}

export interface ResolvedExamCountdown {
  sitting: OfficialExamSitting
  daysRemaining: number
  state: 'upcoming' | 'starts_today' | 'active'
  usedPreferredPeriod: boolean
}

export const OFFICIAL_EXAM_SITTINGS: OfficialExamSitting[] = [
  {
    examType: 'ESAT',
    period: '2026-10',
    startDate: '2026-10-12',
    endDate: '2026-10-13',
    regionLabel: '中国大陆、香港及澳门',
  },
  {
    examType: 'TMUA',
    period: '2026-10',
    startDate: '2026-10-15',
    endDate: '2026-10-16',
    regionLabel: '中国大陆、香港及澳门',
  },
  {
    examType: 'ESAT',
    period: '2027-01',
    startDate: '2027-01-06',
    endDate: '2027-01-06',
    regionLabel: '中国大陆、香港及澳门',
  },
  {
    examType: 'TMUA',
    period: '2027-01',
    startDate: '2027-01-08',
    endDate: '2027-01-08',
    regionLabel: '中国大陆、香港及澳门',
  },
]

// 北京时间自然日用于倒计时，避免浏览器所在时区改变显示天数。
function getShanghaiDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

// ISO 日期转成无时区的日序号，只用于自然日差值计算。
function toCalendarDayNumber(dateKey: string): number {
  const [year = 1970, month = 1, day = 1] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
}

// 个人设置优先；缺失、无效或已过期时回退到该考试最近的官方未来考期。
export function resolveExamCountdown(
  examType: ActiveExamType,
  preferredPeriod?: string | null,
  now = new Date(),
): ResolvedExamCountdown | null {
  const today = getShanghaiDateKey(now)
  const available = OFFICIAL_EXAM_SITTINGS.filter(
    (item) => item.examType === examType && item.endDate >= today,
  ).sort((left, right) => left.startDate.localeCompare(right.startDate))
  const preferred = preferredPeriod
    ? available.find((item) => item.period === preferredPeriod)
    : undefined
  const sitting = preferred || available[0]
  if (!sitting) return null

  const daysRemaining = Math.max(
    0,
    toCalendarDayNumber(sitting.startDate) - toCalendarDayNumber(today),
  )
  const state =
    sitting.startDate === today ? 'starts_today' : today > sitting.startDate ? 'active' : 'upcoming'
  return {
    sitting,
    daysRemaining,
    state,
    usedPreferredPeriod: Boolean(preferred),
  }
}

// 单日仅显示一个日期，多日窗口保留完整范围。
export function formatExamWindow(sitting: OfficialExamSitting): string {
  const start = new Date(`${sitting.startDate}T00:00:00+08:00`)
  const end = new Date(`${sitting.endDate}T00:00:00+08:00`)
  const startLabel = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(start)
  if (sitting.startDate === sitting.endDate) return startLabel
  return `${startLabel}—${new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'long',
    day: 'numeric',
  }).format(end)}`
}
