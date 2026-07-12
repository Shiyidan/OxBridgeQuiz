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
  STEP: 'STEP',
} as const

export const EXAM_TYPES = Object.values(EXAM_TYPE)
export type ExamType = (typeof EXAM_TYPES)[number]

export const EXAM_RECORD_STATUS = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
} as const

export const EXAM_RECORD_STATUSES = Object.values(EXAM_RECORD_STATUS)
export type ExamRecordStatus = (typeof EXAM_RECORD_STATUSES)[number]

export const ANSWER_RECORD_STATE = {
  UNSEEN: 'unseen',
  SKIPPED: 'skipped',
  ANSWERED: 'answered',
} as const

export const ANSWER_RECORD_STATES = Object.values(ANSWER_RECORD_STATE)
export type AnswerRecordState = (typeof ANSWER_RECORD_STATES)[number]

export function isAnswerRecordState(value: unknown): value is AnswerRecordState {
  return typeof value === 'string' && ANSWER_RECORD_STATES.includes(value as AnswerRecordState)
}

export const DIAGNOSTIC_REPORT_TASK_STATUS = {
  PENDING: 'pending',
  ANALYZING: 'analyzing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export const DIAGNOSTIC_REPORT_TASK_STAGE = {
  ANSWERS_SAVED: 'answers_saved',
  FIXED_CALCULATING: 'fixed_calculating',
  MODULE_ANALYZING: 'module_analyzing',
  ROI_ANALYZING: 'roi_analyzing',
  PATH_ANALYZING: 'path_analyzing',
  REPORT_SAVING: 'report_saving',
  COMPLETED: 'completed',
} as const

export const DIAGNOSTIC_REPORT_GENERATION_MODE = {
  FULL_AI: 'full_ai',
  MIXED_FALLBACK: 'mixed_fallback',
  RULES_ONLY: 'rules_only',
} as const

export const PAPER_TYPE = {
  REAL_PAPER: 'realPaper',
  MOCK_PAPER: 'mockPaper',
  AI_PAPER: 'aiPaper',
} as const

export const PAPER_TYPES = Object.values(PAPER_TYPE)
export type PaperType = (typeof PAPER_TYPES)[number]

export const REAL_PAPER_TYPES = [
  PAPER_TYPE.REAL_PAPER,
] as const

export const QUESTION_BANK_PAPER_TYPES = [
  PAPER_TYPE.AI_PAPER,
] as const

export const MOCK_PAPER_TYPES = [
  PAPER_TYPE.MOCK_PAPER,
] as const

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

export function normalizePaperType(value: unknown): PaperType {
  if (REAL_PAPER_TYPES.includes(value as any)) return PAPER_TYPE.REAL_PAPER
  if (MOCK_PAPER_TYPES.includes(value as any)) return PAPER_TYPE.MOCK_PAPER
  if (QUESTION_BANK_PAPER_TYPES.includes(value as any)) return PAPER_TYPE.AI_PAPER
  return PAPER_TYPE.REAL_PAPER
}

export function isPaperType(value: unknown): value is PaperType {
  return typeof value === 'string' && PAPER_TYPES.includes(value as PaperType)
}

export function paperTypeWhereValues(value: unknown): string[] {
  if (!isPaperType(value)) return []
  const paperType = normalizePaperType(value)
  if (paperType === PAPER_TYPE.REAL_PAPER) return [...REAL_PAPER_TYPES]
  if (paperType === PAPER_TYPE.MOCK_PAPER) return [...MOCK_PAPER_TYPES]
  return [...QUESTION_BANK_PAPER_TYPES]
}

export function isRealPaperType(value: unknown): boolean {
  return REAL_PAPER_TYPES.includes(value as any)
}

export function isMembershipPlan(value: unknown): value is MembershipPlan {
  return typeof value === 'string' && MEMBERSHIP_PLANS.includes(value as MembershipPlan)
}

export function normalizeUserPaymentStatus(value: unknown): UserPaymentStatus {
  return USER_PAYMENT_STATUSES.includes(value as UserPaymentStatus)
    ? value as UserPaymentStatus
    : USER_PAYMENT_STATUS.FREE
}
