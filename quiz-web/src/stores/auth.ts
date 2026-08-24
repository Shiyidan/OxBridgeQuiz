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
import { getMember as apiGetMember, type MemberContext } from '../api/member'
import type { AuthLegalVersions } from '../constants/legal'

export interface User {
  id: string
  username: string
  email: string
  role: string
  avatar?: string | null
}

export type ActiveExamType = 'ESAT' | 'TMUA'

// 会员上下文只认当前由服务端判定为生效的考试权益，并过滤未知考试类型。
function resolveActiveMemberExamTypes(context: MemberContext): ActiveExamType[] {
  return Object.entries(context.quotas || {})
    .filter(([, quota]) => quota.isMember)
    .map(([examType]) => String(examType || '').toUpperCase())
    .filter((examType): examType is ActiveExamType => examType === 'ESAT' || examType === 'TMUA')
}

// 唯一有效会员考试优先；双会员或无会员时再使用显式默认、首项目标和 TMUA 兜底。
function resolveDefaultExamType(context: MemberContext): ActiveExamType {
  const memberExamTypes = resolveActiveMemberExamTypes(context)
  const preferredExamTypes = (context.studyPreferences?.examTypes || [])
    .map((examType) => String(examType || '').toUpperCase())
    .filter((examType): examType is ActiveExamType => examType === 'ESAT' || examType === 'TMUA')
  const primaryExamType = String(context.studyPreferences?.primaryExamType || '').toUpperCase()

  if (memberExamTypes.length === 1) return memberExamTypes[0]!

  if (
    (primaryExamType === 'ESAT' || primaryExamType === 'TMUA') &&
    preferredExamTypes.includes(primaryExamType)
  ) {
    return primaryExamType
  }

  const firstPreferredExamType = preferredExamTypes[0]
  if (firstPreferredExamType) return firstPreferredExamType

  return 'TMUA'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const memberContext = ref<MemberContext | null>(null)
  const sessionRestored = ref(false)
  const activeExamType = ref<ActiveExamType>('TMUA')
  const examTypeSelectedManually = ref(false)
  let memberContextRequest: Promise<MemberContext> | null = null

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

  // 页面需要判断会员优先级时复用同一份有效考试集合，避免各处自行推导产生分歧。
  const effectiveMemberExamTypes = computed<ActiveExamType[]>(() =>
    memberContext.value ? resolveActiveMemberExamTypes(memberContext.value) : [],
  )

  // Auth Store 是访问令牌的唯一数据源，请求层通过启动时绑定读取和更新该值。
  function setAccessToken(accessToken: string | null): void {
    token.value = accessToken
  }

  function applyAuth(nextUser: User, accessToken: string): void {
    if (user.value?.id !== nextUser.id) {
      memberContext.value = null
      memberContextRequest = null
      activeExamType.value = 'TMUA'
      examTypeSelectedManually.value = false
    }
    user.value = nextUser
    setAccessToken(accessToken)
  }

  function clearAuth(): void {
    user.value = null
    setAccessToken(null)
    memberContext.value = null
    memberContextRequest = null
    activeExamType.value = 'TMUA'
    examTypeSelectedManually.value = false
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

  // 上下文刷新时，唯一会员考试覆盖旧选择；双会员与无会员仍尊重用户当前选择。
  function setMemberContext(context: MemberContext): void {
    const userChanged = user.value?.id !== context.user.id
    if (userChanged) examTypeSelectedManually.value = false
    memberContext.value = context
    user.value = context.user
    if (effectiveMemberExamTypes.value.length === 1) {
      activeExamType.value = effectiveMemberExamTypes.value[0]!
      examTypeSelectedManually.value = false
      return
    }
    if (!examTypeSelectedManually.value) {
      activeExamType.value = resolveDefaultExamType(context)
    }
  }

  // 全局模块共用同一次会员上下文请求，避免导航栏与业务页面并发重复读取考试偏好。
  async function ensureMemberContext(): Promise<MemberContext | null> {
    if (!isLoggedIn.value || !user.value) return null
    if (memberContext.value) return memberContext.value
    if (memberContextRequest) return memberContextRequest
    const requestedUserId = user.value.id
    memberContextRequest = apiGetMember()
      .then((context) => {
        if (user.value?.id === requestedUserId) setMemberContext(context)
        return context
      })
      .finally(() => {
        memberContextRequest = null
      })
    return memberContextRequest
  }

  // 业务页和个人中心切换当前学习上下文，不直接改写已保存的报考目标。
  function setActiveExamType(examType: ActiveExamType): void {
    activeExamType.value = examType
    examTypeSelectedManually.value = true
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
    inviteCode?: string
    examPreferences?: Array<{
      examType: string
      subjects: string[]
      targetRegions?: string
      targetUniversities?: string[]
      targetMajor?: string
      entrySeason?: string
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
    activeExamType,
    sessionRestored,
    permissions,
    entitlements,
    memberExamTypes,
    effectiveMemberExamTypes,
    isLoggedIn,
    isAdmin,
    restoreSession,
    setMemberContext,
    ensureMemberContext,
    setActiveExamType,
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
