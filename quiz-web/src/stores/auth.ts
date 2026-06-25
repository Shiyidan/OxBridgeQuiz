import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  login as apiLogin,
  register as apiRegister,
  updateProfile as apiUpdateProfile,
  logout as apiLogout,
} from '../api/auth'
import { type MemberContext } from '../api/member'

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
  const memberContext = ref<MemberContext | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isPaid = computed(() => user.value?.paymentStatus === 'paid')
  const permissions = computed(() => {
    const isCurrentAdmin = memberContext.value?.isAdmin ?? user.value?.role === 'admin'
    return memberContext.value ? { isAdmin: isCurrentAdmin, canAccessAdmin: isCurrentAdmin } : null
  })
  const entitlements = computed(() => {
    const quotas = memberContext.value?.quotas || {}
    return Object.fromEntries(
      Object.entries(quotas).map(([examType, item]) => [
        examType,
        {
          examType,
          isMember: item.isMember,
          membershipPlan: item.plan,
          membershipEndsAt: item.endsAt,
          diagnostic: item.diagnostic,
          questionBank: item.questionBank,
        },
      ]),
    )
  })
  const memberExamTypes = computed(() =>
    Object.entries(memberContext.value?.quotas || {}).map(([examType, item]) => ({
      examType,
      ...item,
    })),
  )

  // 从 localStorage 恢复登录态
  function initFromStorage(): void {
    const saved = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    const savedMemberContext = localStorage.getItem('memberContext')
    if (saved && savedUser) {
      token.value = saved
      user.value = JSON.parse(savedUser)
      memberContext.value = savedMemberContext ? JSON.parse(savedMemberContext) : null
    }
  }

  // 保存会员权益上下文（由调用方传入已请求好的数据）
  function setMemberContext(context: MemberContext): void {
    memberContext.value = context
    user.value = context.user
    localStorage.setItem('user', JSON.stringify(context.user))
    localStorage.setItem('memberContext', JSON.stringify(context))
  }

  // 保存当前用户资料后同步本地登录态，避免导航栏和下次进入页面继续显示旧信息。
  function setUser(nextUser: User): void {
    user.value = nextUser
    if (memberContext.value) {
      memberContext.value = { ...memberContext.value, user: nextUser }
      localStorage.setItem('memberContext', JSON.stringify(memberContext.value))
    }
    localStorage.setItem('user', JSON.stringify(nextUser))
  }

  // 登录
  async function login(
    email: string,
    password: string,
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const data = await apiLogin({ email, password } as any)
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
  ): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const data = await apiRegister({ name, email, password, confirmPassword } as any)
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

  // 更新当前用户基础资料
  async function updateProfile(name: string, email: string): Promise<User> {
    loading.value = true
    error.value = null
    try {
      const data = await apiUpdateProfile({ name, email })
      setUser(data.user)
      return data.user
    } catch (e: any) {
      error.value = e.response?.data?.errMsg || e.message || '更新资料失败'
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
    memberContext.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('memberContext')
    error.value = null
  }

  return {
    user,
    token,
    loading,
    error,
    memberContext,
    permissions,
    entitlements,
    memberExamTypes,
    isLoggedIn,
    isAdmin,
    isPaid,
    initFromStorage,
    setMemberContext,
    setUser,
    login,
    register,
    updateProfile,
    logout,
  }
})
