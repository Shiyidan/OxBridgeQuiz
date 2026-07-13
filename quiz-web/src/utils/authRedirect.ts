// 认证跳转工具：在登录和注册流程之间安全保留站内目标地址。
import type { LocationQueryValue, RouteLocationRaw } from 'vue-router'

type AuthRouteName = 'login' | 'register'

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

// 在认证相关页面之间传递有效目标地址，没有目标时保持普通路由。
export function createAuthRouteLocation(name: AuthRouteName, redirect: string): RouteLocationRaw {
  return redirect === '/' ? { name } : { name, query: { redirect } }
}
