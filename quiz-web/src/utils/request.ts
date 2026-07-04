import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { API_URL } from '../config'

/** 后端统一响应格式（拦截器前） */
export interface ApiResponse<T = unknown> {
  success: boolean
  code: number | string
  errMsg: string
  data: T
}

const instance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

// 请求拦截器：自动注入 Token（公开接口跳过，避免旧 token 污染登录请求）
const PUBLIC_URLS = ['/auth/login', '/auth/register', '/health']
instance.interceptors.request.use((config) => {
  if (config.url && PUBLIC_URLS.some((u) => config.url!.includes(u))) return config
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：解包统一响应格式 + 处理 401
instance.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success) {
        response.data = body.data
      } else {
        return Promise.reject(new Error(body.errMsg || '请求失败'))
      }
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('memberContext')
      const isLoginPage =
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/register')
      if (!isLoginPage && window.location.pathname !== '/') {
        ElMessage.error('登录状态已过期，即将跳转回首页')
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      }
    }
    return Promise.reject(error)
  },
)

/**
 * 类型安全的请求包装器。
 * 泛型 T 对应后端 ApiResponse.data 的**内层**类型（拦截器已解包）。
 * 用法：request.get<{ papers: PaperItem[] }>('/papers', { params: { limit: 100 } })
 */
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

// ---- 通用 API 封装 ----

export interface ApiConfig<T = unknown> {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  isAllData: boolean // true=完整res / false=拦截器解包后的data
  params?: Record<string, string | undefined> // query 参数
  body?: unknown // POST/PUT 请求体
}

function buildUrl(path: string, params?: Record<string, string | undefined>): string {
  if (!params) return path
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') qs.set(k, v)
  }
  const suffix = qs.toString()
  return suffix ? `${path}?${suffix}` : path
}

export async function callApi<T>(config: ApiConfig<T>): Promise<T> {
  const url = buildUrl(config.url, config.params)
  let res: AxiosResponse<T>
  switch (config.method) {
    case 'POST':
      res = await request.post<T>(url, config.body)
      break
    case 'PUT':
      res = await request.put<T>(url, config.body)
      break
    case 'DELETE':
      res = await request.delete<T>(url)
      break
    default:
      res = await request.get<T>(url)
  }
  return config.isAllData ? (res as any) : res.data
}

export default request
