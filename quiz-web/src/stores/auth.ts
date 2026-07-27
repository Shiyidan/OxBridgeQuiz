/** 认证状态：访问令牌仅保存在内存，刷新凭证由HttpOnly Cookie管理。 */
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  login as apiLogin,
  logout as apiLogout,
  logoutAll as apiLogoutAll,
  refreshSession,
  register as apiRegister,
  updateProfile as apiUpdateProfile,
} from '../api/auth'
import type { MemberContext } from '../api/member'
import type { AuthLegalVersions } from '../constants/legal'

export interface User {
  id: string
  username: string
  email: string
  role: string
  avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const memberContext = ref<MemberContext | null>(null)
  const sessionRestored = ref(false)

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const permissions = computed(() => {
    const currentAdmin = memberContext.value?.isAdmin ?? user.value?.role === 'admin'
    return user.value ? { isAdmin: currentAdmin, canAccessAdmin: currentAdmin } : null
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

  // Auth Store 是访问令牌的唯一数据源，请求层通过启动时绑定读取和更新该值。
  function setAccessToken(accessToken: string | null): void {
    token.value = accessToken
  }

  function applyAuth(nextUser: User, accessToken: string): void {
    user.value = nextUser
    setAccessToken(accessToken)
  }

  function clearAuth(): void {
    user.value = null
    setAccessToken(null)
    memberContext.value = null
  }

  function clearLocalSession(): void {
    clearAuth()
  }

  async function restoreSession(): Promise<boolean> {
    if (sessionRestored.value) return isLoggedIn.value
    try {
      const data = await refreshSession()
      applyAuth(data.user, data.accessToken)
      return true
    } catch {
      clearAuth()
      return false
    } finally {
      sessionRestored.value = true
    }
  }

  function setMemberContext(context: MemberContext): void {
    memberContext.value = context
    user.value = context.user
  }

  function setUser(nextUser: User): void {
    user.value = nextUser
    if (memberContext.value) memberContext.value = { ...memberContext.value, user: nextUser }
  }

  async function login(
    username: string,
    password: string,
    legalVersions: AuthLegalVersions,
  ): Promise<void> {
    loading.value = true
    try {
      const data = await apiLogin({ username, password, legalVersions })
      applyAuth(data.user, data.accessToken)
    } finally {
      loading.value = false
    }
  }

  async function register(input: {
    username: string
    email: string
    password: string
    confirmPassword: string
    legalVersions: AuthLegalVersions
    challengeId: string
    emailCode: string
    examPreferences?: Array<{
      examType: string
      subjects: string[]
      targetUniversities?: string[]
      targetMajor?: string
      targetScore?: number
      examDate?: string
      weeklyHours?: number
    }>
  }): Promise<void> {
    loading.value = true
    try {
      const data = await apiRegister(input)
      applyAuth(data.user, data.accessToken)
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(input: {
    username: string
    email: string
    challengeId?: string
    emailCode?: string
  }): Promise<User> {
    loading.value = true
    try {
      const data = await apiUpdateProfile(input)
      setUser(data.user)
      return data.user
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await apiLogout()
    } finally {
      clearAuth()
    }
  }

  async function logoutAll(): Promise<void> {
    try {
      await apiLogoutAll()
    } finally {
      clearAuth()
    }
  }

  return {
    user,
    token,
    loading,
    memberContext,
    sessionRestored,
    permissions,
    entitlements,
    memberExamTypes,
    isLoggedIn,
    isAdmin,
    restoreSession,
    setMemberContext,
    setUser,
    setAccessToken,
    clearLocalSession,
    login,
    register,
    updateProfile,
    logout,
    logoutAll,
  }
})
