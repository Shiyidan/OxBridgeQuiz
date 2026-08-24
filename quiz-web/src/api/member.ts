/**
 * 会员权益相关 API
 */
import { callApi } from '@/utils/request'

export interface MemberUser {
  id: string
  username: string
  email: string
  role: string
  avatar?: string | null
}

export interface MemberSubscription {
  examType: string
  plan: string
  status: string
  startsAt: number | null
  endsAt: number | null
  entitlementEndsAt: number | null
  remainingDays: number
}

export interface PendingDailyCard {
  id: string
  activationDeadline: number
  durationHours: number
}

export interface PendingMembershipCard {
  id: string
  activationDeadline: number | null
  durationHours: number
  sourceType: string
  beneficiaryRole: string
  readyToActivate: boolean
}

export interface UsageQuota {
  limit: number | null
  used: number
  remaining: number | null
  unlimited: boolean
}

export interface ExamQuota {
  status: string
  isMember: boolean
  plan: string
  startsAt: number | null
  endsAt: number | null
  remainingDays: number
  diagnostic: UsageQuota
  questionBank: UsageQuota
}

export interface ExamPreference {
  examType: string
  subjects: string[]
  primaryExamType?: StudyExamType
  targetRegions?: string
  targetUniversities?: string[]
  targetMajor?: string
  entrySeason?: string
  targetScore?: number
  examDate?: string
  weeklyHours?: number
}

export type StudyExamType = 'ESAT' | 'TMUA'

export interface StudyPreferences {
  examTypes: string[]
  primaryExamType: StudyExamType | null
  esatSubjects: string[]
  targetRegions: string
  targetUniversities: string[]
  targetMajor: string
  targetScores: Record<'ESAT' | 'TMUA', number | null>
  examDate: string
  weeklyHours: number
}

export type StudyPreferencesUpdate = Omit<StudyPreferences, 'primaryExamType'> & {
  primaryExamType: StudyExamType
}

export interface MemberContext {
  user: MemberUser
  role: string
  isAdmin: boolean
  memberships: MemberSubscription[]
  quotas: Record<string, ExamQuota>
  pendingDailyCards: PendingDailyCard[]
  pendingMembershipCards: PendingMembershipCard[]
  examPreferences: ExamPreference[]
  studyPreferences: StudyPreferences
}

export interface MemberAccessResult {
  allowed: boolean
  reason: string | null
  action: 'diagnostic' | 'question-bank'
  examType: string
  required: number
  limit: number | null
  used: number
  remaining: number | null
  unlimited: boolean
}

/** 更新账户级学习偏好 */
export function updateStudyPreferences(studyPreferences: StudyPreferencesUpdate) {
  return callApi<null>({
    url: '/getMember/study-preferences',
    method: 'PUT',
    body: { studyPreferences },
  })
}

/** 获取当前用户会员权益上下文 */
export function getMember() {
  return callApi<MemberContext>({
    url: '/getMember',
    method: 'GET',
  })
}

/** 寮€濮嬭瘖鏂垨缁冧範鍓嶉妫€鏉冪泭 */
export function checkMemberAccess(params: {
  action: 'diagnostic' | 'question-bank'
  examType: string
  questionCount?: number
}) {
  return callApi<MemberAccessResult>({
    url: '/getMember/check-access',
    method: 'POST',
    body: params,
  })
}
