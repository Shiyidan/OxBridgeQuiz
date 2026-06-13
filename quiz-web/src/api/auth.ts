/**
 * 认证相关 API
 */
import { callApi } from '@/utils/request'

export interface LoginParams {
  email: string
  password: string
}

export interface RegisterParams {
  email: string
  password: string
  confirmPassword: string
  name: string
}

export interface UserInfo {
  id: string
  name: string
  email: string
  role: string
}

export interface AuthResult {
  user: UserInfo
  token: string
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

/** 登出 */
export function logout() {
  return callApi<null>({
    url: '/auth/logout',
    method: 'POST',
    isAllData: false,
  })
}
