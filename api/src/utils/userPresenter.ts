import { USER_ROLE, normalizeUserPaymentStatus, type UserPaymentStatus } from '../constants/domain.js'

// paymentStatus 只描述学生旧付费状态，管理员不返回该字段。
export function formatUserForClient<T extends { role: string; paymentStatus?: string | null }>(
  user: T,
): Omit<T, 'paymentStatus'> & { paymentStatus?: UserPaymentStatus } {
  const { paymentStatus, ...rest } = user
  if (user.role === USER_ROLE.ADMIN) return rest

  return {
    ...rest,
    paymentStatus: normalizeUserPaymentStatus(paymentStatus),
  }
}
