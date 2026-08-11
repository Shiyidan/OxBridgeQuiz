/**
 * 会员权益相关 API
 */
import { callApi } from '@/utils/request'

export interface MemberUser {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
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
  targetRegions?: string
  targetUniversities?: string[]
  targetMajor?: string
  entrySeason?: string
  targetScore?: number
  examDate?: string
  weeklyHours?: number
}

export interface StudyPreferences {
  examTypes: string[]
  esatSubjects: string[]
  targetRegions: string
  targetUniversities: string[]
  targetMajor: string
  examDate: string
  weeklyHours: number
}

export interface MemberContext {
  user: MemberUser
  role: string
  isAdmin: boolean
  memberships: MemberSubscription[]
  quotas: Record<string, ExamQuota>
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
export function updateStudyPreferences(studyPreferences: StudyPreferences) {
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
