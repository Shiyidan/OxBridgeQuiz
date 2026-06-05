import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { API_URL } from '../config'

/** 后端统一响应格式（拦截器前） */
export interface ApiResponse<T = unknown> {
  success: boolean
  code: number
  errMsg: string
  data: T
}

const instance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
})

// 请求拦截器：自动注入 Token
instance.interceptors.request.use((config) => {
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
      if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        ElMessage.error('登录状态已过期，即将跳转回首页')
        setTimeout(() => { window.location.href = '/' }, 1500)
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

export default request
