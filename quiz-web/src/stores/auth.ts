import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import request from '../utils/request'

export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  paymentStatus?: string
}

interface LoginResponse {
  token: string
  user: User
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isPaid = computed(() => user.value?.paymentStatus === 'paid')

  // 从 localStorage 恢复登录态
  function initFromStorage(): void {
    const saved = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (saved && savedUser) {
      token.value = saved
      user.value = JSON.parse(savedUser)
    }
  }

  // 登录
  async function login(
    email: string,
    password: string,
    diagnosticSessionId?: string,
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await request.post<LoginResponse>('/auth/login', { email, password, diagnosticSessionId })
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      // 如果携带了诊断报告，返回给调用方
      return res.data
    } catch (e: any) {
      error.value = e.response?.data?.errMsg || e.message || '登录失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 注册
  async function register(
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    diagnosticSessionId?: string,
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const res = await request.post<LoginResponse>('/auth/register', {
        name,
        email,
        password,
        confirmPassword,
        diagnosticSessionId,
      })
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      return res.data
    } catch (e: any) {
      error.value = e.response?.data?.errMsg || e.message || '注册失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 退出
  async function logout(): Promise<void> {
    try {
      await request.post('/auth/logout')
    } catch {
      // 网络异常等情况下也继续清除本地状态
    }
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    error.value = null
  }

  return { user, token, loading, error, isLoggedIn, isAdmin, isPaid, initFromStorage, login, register, logout }
})
