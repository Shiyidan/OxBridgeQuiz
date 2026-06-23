// 业务枚举集中定义，避免角色、会员和旧支付状态混用。
export const USER_ROLE = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const

export const USER_ROLES = Object.values(USER_ROLE)
export type UserRole = (typeof USER_ROLES)[number]

export const USER_PAYMENT_STATUS = {
  FREE: 'free',
  PAID: 'paid',
  EXPIRED: 'expired',
} as const

export const USER_PAYMENT_STATUSES = Object.values(USER_PAYMENT_STATUS)
export type UserPaymentStatus = (typeof USER_PAYMENT_STATUSES)[number]

export const EXAM_TYPE = {
  TMUA: 'TMUA',
  ESAT: 'ESAT',
  ENGAA: 'ENGAA',
  NSAA: 'NSAA',
} as const

export const EXAM_TYPES = Object.values(EXAM_TYPE)
export type ExamType = (typeof EXAM_TYPES)[number]

export const MEMBERSHIP_PLAN = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const

export const MEMBERSHIP_PLANS = Object.values(MEMBERSHIP_PLAN)
export type MembershipPlan = (typeof MEMBERSHIP_PLANS)[number]

export const EFFECTIVE_PLAN = {
  FREE: 'free',
  ADMIN: 'admin',
  MONTHLY: MEMBERSHIP_PLAN.MONTHLY,
  YEARLY: MEMBERSHIP_PLAN.YEARLY,
} as const

export const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const

export const EFFECTIVE_MEMBERSHIP_STATUS = {
  FREE: 'free',
  ACTIVE: MEMBERSHIP_STATUS.ACTIVE,
  EXPIRED: MEMBERSHIP_STATUS.EXPIRED,
  CANCELLED: MEMBERSHIP_STATUS.CANCELLED,
} as const

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole)
}

export function isExamType(value: unknown): value is ExamType {
  return typeof value === 'string' && EXAM_TYPES.includes(value as ExamType)
}

export function isMembershipPlan(value: unknown): value is MembershipPlan {
  return typeof value === 'string' && MEMBERSHIP_PLANS.includes(value as MembershipPlan)
}

export function normalizeUserPaymentStatus(value: unknown): UserPaymentStatus {
  return USER_PAYMENT_STATUSES.includes(value as UserPaymentStatus)
    ? value as UserPaymentStatus
    : USER_PAYMENT_STATUS.FREE
}
