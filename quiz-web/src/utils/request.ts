/** Axios公共客户端：统一认证注入、会话刷新、响应解包和错误提示。 */
import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { API_URL } from '../config'

export interface ApiResponse<T = unknown> {
  success: boolean
  code: number | string
  errMsg: string
  data: T
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: number | string = 1,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestAuthBridge {
  getAccessToken: () => string | null
  setAccessToken: (token: string) => void
  clearSession: () => void
}

let authBridge: RequestAuthBridge | null = null
let refreshPromise: Promise<string> | null = null
let authFailureRedirectScheduled = false

const AUTH_FAILURE_REDIRECT_DELAY_MS = 1800
const AUTH_SESSION_EXPIRED_CODE = 'AUTH_SESSION_EXPIRED'
const REQUEST_CANCELED_CODE = 'ERR_CANCELED'

// 应用启动时绑定 Pinia 认证状态，确保请求层和界面只使用同一个 Token 数据源。
export function configureRequestAuth(bridge: RequestAuthBridge): void {
  authBridge = bridge
}

const instance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
})

instance.interceptors.request.use((request) => {
  const accessToken = authBridge?.getAccessToken()
  if (accessToken) request.headers.Authorization = `Bearer ${accessToken}`
  return request
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }
const NO_REFRESH_URLS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/email-code',
  '/auth/password/reset',
]

// 多个并发 401 共用一次刷新请求，避免重复轮换服务端会话。
function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise
  refreshPromise = instance
    .post<unknown, AxiosResponse<{ accessToken: string }>>('/auth/refresh')
    .then((response) => {
      authBridge?.setAccessToken(response.data.accessToken)
      return response.data.accessToken
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

// 接口异常优先读取标准响应包中的 errMsg，只有非标准响应才退回网络错误文本。
function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  const response = (
    error as {
      response?: { status?: number; data?: Partial<ApiResponse> }
      message?: string
    }
  )?.response
  const body = response?.data
  const message =
    body?.success === false && typeof body.errMsg === 'string' && body.errMsg
      ? body.errMsg
      : (error as { message?: string })?.message || '请求失败'
  const code = body?.code ?? (error as { code?: number | string })?.code ?? 1
  return new ApiError(message, code, response?.status)
}

// 页面需要保留错误状态时统一读取新 ApiError 字段，不再访问 Axios response 兼容结构。
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

// 需要分支处理的业务错误直接比较 ApiError.code。
export function hasApiErrorCode(error: unknown, code: number | string): boolean {
  return error instanceof ApiError && error.code === code
}

// 非登录失效类错误统一展示后端 errMsg，并通过 grouping 合并并发产生的相同提示。
function showApiError(apiError: ApiError): void {
  ElMessage.error({
    message: apiError.message,
    duration: 3000,
    showClose: true,
    grouping: true,
  })
}

// 只有服务端明确返回会话失效业务码时才退出，避免把登录密码错误等 401 当成掉线。
function isSessionExpired(apiError: ApiError): boolean {
  return apiError.status === 401 && apiError.code === AUTH_SESSION_EXPIRED_CODE
}

// 受保护接口确认失去登录状态后只提示一次，并在提示可见后自动回到公开首页。
function handleUnauthorized(apiError: ApiError): void {
  authBridge?.clearSession()
  if (authFailureRedirectScheduled) return
  authFailureRedirectScheduled = true
  ElMessage.error({
    message: apiError.message,
    duration: AUTH_FAILURE_REDIRECT_DELAY_MS,
    showClose: false,
  })
  window.setTimeout(() => {
    window.location.replace('/')
  }, AUTH_FAILURE_REDIRECT_DELAY_MS)
}

instance.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse
    if (body && typeof body === 'object' && 'success' in body) {
      if (!body.success) {
        const apiError = new ApiError(body.errMsg || '请求失败', body.code, response.status)
        showApiError(apiError)
        return Promise.reject(apiError)
      }
      response.data = body.data
    }
    return response
  },
  async (error) => {
    const original = error.config as RetryConfig | undefined
    const url = original?.url || ''
    const isRefreshRequest = url.includes('/auth/refresh')
    const canRefresh =
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !NO_REFRESH_URLS.some((item) => url.includes(item))

    if (canRefresh) {
      original._retry = true
      try {
        const refreshedToken = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${refreshedToken}`
        return instance(original)
      } catch (refreshError: unknown) {
        const apiError = toApiError(refreshError)
        if (isSessionExpired(apiError)) {
          handleUnauthorized(apiError)
          return Promise.reject(apiError)
        }
        showApiError(apiError)
        return Promise.reject(apiError)
      }
    }

    const apiError = toApiError(error)
    if (isRefreshRequest) return Promise.reject(apiError)
    if (apiError.code === REQUEST_CANCELED_CODE) return Promise.reject(apiError)
    if (isSessionExpired(apiError)) {
      handleUnauthorized(apiError)
      return Promise.reject(apiError)
    }
    showApiError(apiError)
    return Promise.reject(apiError)
  },
)

export interface ApiConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, string | undefined>
  body?: unknown
  timeout?: number
}

// 统一过滤空查询参数，避免各 API 模块重复拼接 URL。
function buildUrl(path: string, params?: Record<string, string | undefined>): string {
  if (!params) return path
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, value)
  }
  const suffix = qs.toString()
  return suffix ? `${path}?${suffix}` : path
}

// API 模块通过统一配置发起请求，并按需覆盖全局超时时间。
export async function callApi<T>(config: ApiConfig): Promise<T> {
  const url = buildUrl(config.url, config.params)
  const response = await instance.request<T, AxiosResponse<T>>({
    url,
    method: config.method,
    data: config.body,
    timeout: config.timeout,
  })
  return response.data
}
