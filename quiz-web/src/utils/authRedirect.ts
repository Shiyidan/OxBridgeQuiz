// 认证跳转工具：在登录和注册流程之间安全保留站内目标地址。
import type { LocationQueryValue, RouteLocationRaw } from 'vue-router'

type AuthRouteName = 'login' | 'register'

export const AUTH_LOGIN_REQUIRED_REASON = 'login-required'
const AUTH_REDIRECT_STORAGE_KEY = 'auth:pending-redirect'

const LOGIN_REQUIRED_FEATURES = [
  { pathPrefix: '/assessment', label: '诊断测试' },
  { pathPrefix: '/question-bank', label: '试题库' },
  { pathPrefix: '/mock-exams', label: '模考中心' },
  { pathPrefix: '/mistake-notebook', label: '错题本' },
  { pathPrefix: '/practice-notebook', label: '练习本' },
  { pathPrefix: '/practice-records', label: '练习记录' },
  { pathPrefix: '/practice', label: '在线练习' },
  { pathPrefix: '/exam-result', label: '学习报告' },
  { pathPrefix: '/profile', label: '个人中心' },
  { pathPrefix: '/admin', label: '后台管理' },
] as const

// 仅接受站内绝对路径，避免认证完成后跳转到外部地址。
export function getSafeAuthRedirect(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
): string {
  const candidate = Array.isArray(value) ? value[0] : value
  if (
    typeof candidate !== 'string' ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\')
  ) {
    return '/'
  }
  return candidate
}

// 查询参数在第三方跳转、手动复制或刷新时可能丢失，保留一次受保护目标作为登录后的兜底回跳。
export function rememberAuthRedirect(redirect: string): void {
  const safeRedirect = getSafeAuthRedirect(redirect)
  if (safeRedirect === '/' || typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, safeRedirect)
}

// 读取后立即消费，避免普通登录反复被带到上一次的受保护页面。
export function consumeRememberedAuthRedirect(): string {
  if (typeof sessionStorage === 'undefined') return '/'
  const redirect = getSafeAuthRedirect(sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY))
  sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY)
  return redirect
}

// 登录页根据原目标模块给出明确提示，帮助用户理解登录后将继续进入哪里。
export function getLoginRequiredMessage(redirect: LocationQueryValue | LocationQueryValue[] | undefined): string {
  const targetPath = getSafeAuthRedirect(redirect).split(/[?#]/, 1)[0] || '/'
  const feature = LOGIN_REQUIRED_FEATURES.find(
    (item) => targetPath === item.pathPrefix || targetPath.startsWith(`${item.pathPrefix}/`),
  )
  return feature ? `请先登录后使用${feature.label}功能` : '请先登录后使用该功能'
}

// 在认证相关页面之间传递有效目标地址，没有目标时保持普通路由。
export function createAuthRouteLocation(name: AuthRouteName, redirect: string): RouteLocationRaw {
  return redirect === '/' ? { name } : { name, query: { redirect } }
}

// 功能入口要求认证时同时携带回跳地址和提示原因，登录页据此只展示一次明确引导。
export function createLoginRequiredRouteLocation(redirect: string): RouteLocationRaw {
  rememberAuthRedirect(redirect)
  return {
    name: 'login',
    query: {
      ...(redirect === '/' ? {} : { redirect }),
      reason: AUTH_LOGIN_REQUIRED_REASON,
    },
  }
}
