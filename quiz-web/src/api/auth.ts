/** 认证相关API：验证码、密码流程和可撤销会话。 */
import { callApi } from '@/utils/request'
import type { AuthLegalVersions } from '@/constants/legal'

export type EmailCodePurpose = 'REGISTER' | 'RESET_PASSWORD' | 'CHANGE_EMAIL'

export interface LoginParams {
  username: string
  password: string
  legalVersions: AuthLegalVersions
}

export interface RegisterParams {
  username: string
  email: string
  password: string
  confirmPassword: string
  legalVersions: AuthLegalVersions
  challengeId: string
  emailCode: string
  inviteCode?: string
  examPreferences?: Array<{
    examType: string
    subjects: string[]
    targetRegions?: string
    targetUniversities?: string[]
    targetMajor?: string
    entrySeason?: string
    targetScore?: number
    examDate?: string
    weeklyHours?: number
  }>
}

export interface UserInfo {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
}

export interface AuthResult {
  user: UserInfo
  accessToken: string
  invitationRewardEligible?: boolean
}

export interface EmailCodeResult {
  challengeId: string
  expiresIn: number
  resendAfter: number
}

export interface UpdateProfileParams {
  username: string
  email: string
  challengeId?: string
  emailCode?: string
}

export interface AuthSessionItem {
  id: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  lastUsedAt: string
  expiresAt: string
  isCurrent: boolean
  ipLocation?: {
    country: string
    region: string
    city: string
    label: string
  } | null
}

// 验证码发送允许覆盖 SMTP 的正常响应窗口，不放宽其他 API 的全局超时。
export function sendEmailCode(email: string, purpose: EmailCodePurpose) {
  return callApi<EmailCodeResult>({
    url: '/auth/email-code',
    method: 'POST',
    body: { email, purpose },
    timeout: 30000,
  })
}

export function login(params: LoginParams) {
  return callApi<AuthResult>({ url: '/auth/login', method: 'POST', body: params })
}

export function register(params: RegisterParams) {
  return callApi<AuthResult>({ url: '/auth/register', method: 'POST', body: params })
}

export function refreshSession() {
  return callApi<AuthResult>({ url: '/auth/refresh', method: 'POST' })
}

export function updateProfile(params: UpdateProfileParams) {
  return callApi<{ user: UserInfo }>({
    url: '/auth/profile',
    method: 'PUT',
    body: params,
  })
}

export function resetPassword(params: {
  email: string
  challengeId: string
  emailCode: string
  password: string
  confirmPassword: string
}) {
  return callApi<null>({
    url: '/auth/password/reset',
    method: 'POST',
    body: params,
  })
}

export function changePassword(params: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  return callApi<null>({
    url: '/auth/password/change',
    method: 'POST',
    body: params,
  })
}

export function getSessions() {
  return callApi<{ list: AuthSessionItem[] }>({
    url: '/auth/sessions',
    method: 'GET',
  })
}

export function revokeSession(sessionId: string) {
  return callApi<null>({
    url: `/auth/sessions/${sessionId}`,
    method: 'DELETE',
  })
}

export function logout() {
  return callApi<null>({ url: '/auth/logout', method: 'POST' })
}

export function logoutAll() {
  return callApi<null>({ url: '/auth/logout-all', method: 'POST' })
}
