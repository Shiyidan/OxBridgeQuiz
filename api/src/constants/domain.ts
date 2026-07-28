// 业务枚举集中定义，避免角色、会员和旧支付状态混用。
export const USER_ROLE = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const

export const USER_ROLES = Object.values(USER_ROLE)
export type UserRole = (typeof USER_ROLES)[number]

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

export const QUESTION_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export const QUESTION_STATUSES = Object.values(QUESTION_STATUS)
export type QuestionStatus = (typeof QUESTION_STATUSES)[number]

// 单题发布状态只接受草稿、已发布和已归档三种稳定值。
export function isQuestionStatus(value: unknown): value is QuestionStatus {
  return typeof value === 'string' && QUESTION_STATUSES.includes(value as QuestionStatus)
}

export const PAPER_DELIVERY_MODE = {
  CONTINUOUS: 'continuous',
  MODULE_SEQUENCE: 'module_sequence',
} as const

export const PAPER_DELIVERY_MODES = Object.values(PAPER_DELIVERY_MODE)
export type PaperDeliveryMode = (typeof PAPER_DELIVERY_MODES)[number]

export const EXAM_PHASE = {
  CONTINUOUS: 'continuous',
  ANSWERING: 'answering',
  PAUSED: 'paused',
  BREAK: 'break',
  BREAK_PAUSED: 'break_paused',
  READY_TO_SUBMIT: 'ready_to_submit',
} as const

export const EXAM_PHASES = Object.values(EXAM_PHASE)
export type ExamPhase = (typeof EXAM_PHASES)[number]

export const ESAT_MODULE = {
  MATHS_1: 'maths1',
  MATHS_2: 'maths2',
  PHYSICS: 'physics',
  CHEMISTRY: 'chemistry',
  BIOLOGY: 'biology',
} as const

export const ESAT_MODULES = Object.values(ESAT_MODULE)
export type EsatModuleCode = (typeof ESAT_MODULES)[number]

export const TMUA_PAPER = {
  PAPER_1: 'paper1',
  PAPER_2: 'paper2',
} as const

export const TMUA_PAPERS = Object.values(TMUA_PAPER)
export type TmuaPaperCode = (typeof TMUA_PAPERS)[number]

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

export const PAPER_ACCESS_TIER = {
  FREE: 'free',
  MEMBER: 'member',
} as const

export const PAPER_ACCESS_TIERS = Object.values(PAPER_ACCESS_TIER)
export type PaperAccessTier = (typeof PAPER_ACCESS_TIERS)[number]

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

export const PAYMENT_REFUND_STATUS = {
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
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

export const PAYMENT_RECONCILIATION_RUN_STATUS = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  FAILED: 'failed',
} as const

export const PAYMENT_RECONCILIATION_TRIGGER = {
  SCHEDULED: 'scheduled',
  MANUAL: 'manual',
} as const

export const PAYMENT_RECONCILIATION_RESULT = {
  MATCHED: 'matched',
  CORRECTED: 'corrected',
  ANOMALY: 'anomaly',
  ERROR: 'error',
} as const

export const PAYMENT_RECONCILIATION_RESOLUTION = {
  NONE: 'none',
  OPEN: 'open',
  AUTO_RESOLVED: 'auto_resolved',
  MANUALLY_RESOLVED: 'manually_resolved',
} as const

export const REVENUE_COST_CATEGORY = {
  TECHNICAL_INFRASTRUCTURE: 'technical_infrastructure',
  DEVELOPMENT_TOOLS: 'development_tools',
  OPERATIONS_MARKETING: 'operations_marketing',
} as const

export const REVENUE_COST_CATEGORIES = Object.values(REVENUE_COST_CATEGORY)
export type RevenueCostCategory = (typeof REVENUE_COST_CATEGORIES)[number]

export const REVENUE_COST_ITEM = {
  SERVER_RENTAL: 'server_rental',
  DATABASE_RENTAL: 'database_rental',
  DOMAIN_CERTIFICATE: 'domain_certificate',
  THIRD_PARTY_TECHNICAL_SERVICE: 'third_party_technical_service',
  DEEPSEEK: 'deepseek',
  CLAUDE: 'claude',
  CODEX: 'codex',
  MARKETING_PROMOTION: 'marketing_promotion',
  CONTENT_OPERATIONS: 'content_operations',
  ADMINISTRATION_FINANCE: 'administration_finance',
} as const

export type RevenueCostItem = (typeof REVENUE_COST_ITEM)[keyof typeof REVENUE_COST_ITEM]

export const REVENUE_COST_ITEMS_BY_CATEGORY: Record<RevenueCostCategory, readonly RevenueCostItem[]> = {
  [REVENUE_COST_CATEGORY.TECHNICAL_INFRASTRUCTURE]: [
    REVENUE_COST_ITEM.SERVER_RENTAL,
    REVENUE_COST_ITEM.DATABASE_RENTAL,
    REVENUE_COST_ITEM.DOMAIN_CERTIFICATE,
    REVENUE_COST_ITEM.THIRD_PARTY_TECHNICAL_SERVICE,
  ],
  [REVENUE_COST_CATEGORY.DEVELOPMENT_TOOLS]: [
    REVENUE_COST_ITEM.DEEPSEEK,
    REVENUE_COST_ITEM.CLAUDE,
    REVENUE_COST_ITEM.CODEX,
  ],
  [REVENUE_COST_CATEGORY.OPERATIONS_MARKETING]: [
    REVENUE_COST_ITEM.MARKETING_PROMOTION,
    REVENUE_COST_ITEM.CONTENT_OPERATIONS,
    REVENUE_COST_ITEM.ADMINISTRATION_FINANCE,
  ],
}

const DEVELOPMENT_TOOL_COST_ITEMS = new Set(REVENUE_COST_ITEMS_BY_CATEGORY[REVENUE_COST_CATEGORY.DEVELOPMENT_TOOLS])

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

// 诊断卷访问级别只接受免费或会员两类稳定编码。
export function isPaperAccessTier(value: unknown): value is PaperAccessTier {
  return (
    typeof value === 'string'
    && PAPER_ACCESS_TIERS.includes(value as PaperAccessTier)
  )
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

// 成本分类只接受后台成本管理已定义的三类稳定编码。
export function isRevenueCostCategory(value: unknown): value is RevenueCostCategory {
  return typeof value === 'string' && REVENUE_COST_CATEGORIES.includes(value as RevenueCostCategory)
}

// 成本项编码统一去除首尾空格并转为小写，兼容历史工具名称的大小写差异。
export function normalizeRevenueCostItem(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

// 成本项必须属于所选分类，防止前端联动被绕过后写入错误组合。
export function isRevenueCostItemForCategory(category: RevenueCostCategory, item: string): item is RevenueCostItem {
  return REVENUE_COST_ITEMS_BY_CATEGORY[category].includes(item as RevenueCostItem)
}

// 旧客户端提交具体研发工具但缺少分类时兼容归入研发工具，新分类项仍必须显式提交分类。
export function legacyRevenueCostCategory(value: unknown): RevenueCostCategory | null {
  if (typeof value !== 'string') return null
  return DEVELOPMENT_TOOL_COST_ITEMS.has(value.trim().toLowerCase() as RevenueCostItem)
    ? REVENUE_COST_CATEGORY.DEVELOPMENT_TOOLS
    : null
}
