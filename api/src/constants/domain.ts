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

export const AVAILABLE_STUDENT_EXAM_TYPES = [EXAM_TYPE.TMUA, EXAM_TYPE.ESAT] as const

export const TARGET_UNIVERSITIES = [
  '剑桥大学',
  '牛津大学',
  '帝国理工学院',
  '伦敦大学学院',
  '伦敦政治经济学院',
] as const

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

// 将外部状态值收窄为答题记录允许的状态，供接口边界安全复用。
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

export const REAL_PAPER_TYPES = [PAPER_TYPE.REAL_PAPER] as const

export const QUESTION_BANK_PAPER_TYPES = [PAPER_TYPE.AI_PAPER] as const

export const MOCK_PAPER_TYPES = [PAPER_TYPE.MOCK_PAPER] as const

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

export const PAYMENT_CONFIG_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const

export const PAYMENT_ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CLOSED: 'closed',
  REFUNDING: 'refunding',
  REFUNDED: 'refunded',
} as const

export const PAYMENT_CHANNEL = {
  ALIPAY: 'alipay',
  WECHAT: 'wechat',
  UNIONPAY: 'unionpay',
} as const

export const PAYMENT_CHANNELS = Object.values(PAYMENT_CHANNEL)

export const PAYMENT_PRICE_TYPE = {
  FIRST_MONTHLY: 'first_monthly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const

export const PAYMENT_NOTIFICATION_STATUS = {
  RECEIVED: 'received',
  PROCESSED: 'processed',
  IGNORED: 'ignored',
  FAILED: 'failed',
} as const

export const EFFECTIVE_MEMBERSHIP_STATUS = {
  FREE: 'free',
  ACTIVE: MEMBERSHIP_STATUS.ACTIVE,
  EXPIRED: MEMBERSHIP_STATUS.EXPIRED,
  CANCELLED: MEMBERSHIP_STATUS.CANCELLED,
} as const

// 角色判断统一使用领域常量，避免各接口接受未定义角色。
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole)
}

// 考试类型判断统一约束在当前产品支持的类型集合内。
export function isExamType(value: unknown): value is ExamType {
  return typeof value === 'string' && EXAM_TYPES.includes(value as ExamType)
}

// 学生端开放状态与完整数据类型分离，STEP 可供后台维护但不能进入购买和作答流程。
export function isStudentExamTypeAvailable(value: unknown): boolean {
  return AVAILABLE_STUDENT_EXAM_TYPES.includes(value as (typeof AVAILABLE_STUDENT_EXAM_TYPES)[number])
}

// 旧试卷类型在业务查询前归一到当前三类标准值。
export function normalizePaperType(value: unknown): PaperType {
  if (REAL_PAPER_TYPES.includes(value as any)) return PAPER_TYPE.REAL_PAPER
  if (MOCK_PAPER_TYPES.includes(value as any)) return PAPER_TYPE.MOCK_PAPER
  if (QUESTION_BANK_PAPER_TYPES.includes(value as any)) return PAPER_TYPE.AI_PAPER
  return PAPER_TYPE.REAL_PAPER
}

// 在接口边界判断试卷类型是否可用于当前业务查询。
export function isPaperType(value: unknown): value is PaperType {
  return typeof value === 'string' && PAPER_TYPES.includes(value as PaperType)
}

// 将标准试卷类型展开为数据库兼容值，集中处理历史类型映射。
export function paperTypeWhereValues(value: unknown): string[] {
  if (!isPaperType(value)) return []
  const paperType = normalizePaperType(value)
  if (paperType === PAPER_TYPE.REAL_PAPER) return [...REAL_PAPER_TYPES]
  if (paperType === PAPER_TYPE.MOCK_PAPER) return [...MOCK_PAPER_TYPES]
  return [...QUESTION_BANK_PAPER_TYPES]
}

// 真题判断沿用统一兼容集合，避免业务层重复比较字符串。
export function isRealPaperType(value: unknown): boolean {
  return REAL_PAPER_TYPES.includes(value as any)
}

// 会员套餐判断只接受系统已配置的月度或年度方案。
export function isMembershipPlan(value: unknown): value is MembershipPlan {
  return typeof value === 'string' && MEMBERSHIP_PLANS.includes(value as MembershipPlan)
}

// 旧支付状态缺失或异常时按免费用户处理，避免误授予权益。
export function normalizeUserPaymentStatus(value: unknown): UserPaymentStatus {
  return USER_PAYMENT_STATUSES.includes(value as UserPaymentStatus)
    ? (value as UserPaymentStatus)
    : USER_PAYMENT_STATUS.FREE
}
