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

export interface ApiConfig<T = unknown> {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  isAllData: boolean
  params?: Record<string, string | undefined>
  body?: unknown
}

function buildUrl(path: string, params?: Record<string, string | undefined>): string {
  if (!params) return path
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') qs.set(key, value)
  }
  const suffix = qs.toString()
  return suffix ? `${path}?${suffix}` : path
}

export async function callApi<T>(config: ApiConfig<T>): Promise<T> {
  const url = buildUrl(config.url, config.params)
  let response: AxiosResponse<T>
  if (config.method === 'POST') response = await request.post<T>(url, config.body)
  else if (config.method === 'PUT') response = await request.put<T>(url, config.body)
  else if (config.method === 'DELETE') response = await request.delete<T>(url)
  else response = await request.get<T>(url)
  return config.isAllData ? (response as T) : response.data
}

export default request
