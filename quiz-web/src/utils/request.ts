/** Axios封装：内存访问令牌、HttpOnly刷新Cookie和统一响应解包。 */
import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
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

let accessToken: string | null = null
let refreshPromise: Promise<string> | null = null

// 登录态变化时同步更新后续 API 请求使用的内存访问令牌。
export function setAccessToken(token: string | null): void {
  accessToken = token
}

const instance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
})

instance.interceptors.request.use((request) => {
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
      setAccessToken(response.data.accessToken)
      return response.data.accessToken
    })
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

instance.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse
    if (body && typeof body === 'object' && 'success' in body) {
      if (!body.success) return Promise.reject(new ApiError(body.errMsg || '请求失败', body.code, response.status))
      response.data = body.data
    }
    return response
  },
  async (error) => {
    const original = error.config as RetryConfig | undefined
    const url = original?.url || ''
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
      } catch {
        // 刷新失败后统一进入未登录状态。
      }
    }

    const body = error.response?.data as ApiResponse | undefined
    const apiError = new ApiError(body?.errMsg || error.message || '请求失败', body?.code, error.response?.status)
    if (error.response?.status === 401 && !NO_REFRESH_URLS.some((item) => url.includes(item))) {
      setAccessToken(null)
      if (!window.location.pathname.startsWith('/login')) {
        ElMessage.error('登录状态已过期，请重新登录')
        window.location.href = '/login'
      }
    }
    return Promise.reject(apiError)
  },
)

const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return instance.get(url, config) as Promise<AxiosResponse<T>>
  },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return instance.post(url, data, config) as Promise<AxiosResponse<T>>
  },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) {
    return instance.put(url, data, config) as Promise<AxiosResponse<T>>
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    return instance.delete(url, config) as Promise<AxiosResponse<T>>
  },
}

export interface ApiConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  isAllData: boolean
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
  const requestConfig = config.timeout === undefined ? undefined : { timeout: config.timeout }
  let response: AxiosResponse<T>
  if (config.method === 'POST') response = await request.post<T>(url, config.body, requestConfig)
  else if (config.method === 'PUT') response = await request.put<T>(url, config.body, requestConfig)
  else if (config.method === 'DELETE') response = await request.delete<T>(url, requestConfig)
  else response = await request.get<T>(url, requestConfig)
  return config.isAllData ? (response as T) : response.data
}

export default request
