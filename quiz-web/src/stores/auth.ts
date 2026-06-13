import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth'

export interface User {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  paymentStatus?: string
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
      const data = await apiLogin({ email, password, diagnosticSessionId } as any)
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data as any
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
      const data = await apiRegister({ name, email, password, confirmPassword, diagnosticSessionId } as any)
      token.value = data.token
      user.value = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      return data as any
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
      await apiLogout()
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
