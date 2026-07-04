/**
 * 认证相关 API
 */
import { callApi } from '@/utils/request'

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  email: string
  password: string
  confirmPassword: string
  examPreferences?: Array<{ examType: string; subjects: string[] }>
}

export interface UserInfo {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
  paymentStatus?: string
}

export interface AuthResult {
  user: UserInfo
  token: string
}

export interface UpdateProfileParams {
  username: string
  email: string
}

export interface UpdateProfileResult {
  user: UserInfo
}

/** 登录 */
export function login(params: LoginParams) {
  return callApi<AuthResult>({
    url: '/auth/login',
    method: 'POST',
    isAllData: false,
    body: params,
  })
}

/** 注册 */
export function register(params: RegisterParams) {
  return callApi<AuthResult>({
    url: '/auth/register',
    method: 'POST',
    isAllData: false,
    body: params,
  })
}

/** 更新当前用户资料 */
export function updateProfile(params: UpdateProfileParams) {
  return callApi<UpdateProfileResult>({
    url: '/auth/profile',
    method: 'PUT',
    isAllData: false,
    body: params,
  })
}

/** 登出 */
export function logout() {
  return callApi<null>({
    url: '/auth/logout',
    method: 'POST',
    isAllData: false,
  })
}
