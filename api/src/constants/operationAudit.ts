// 操作审计枚举：统一后台筛选、持久化结果和业务模块编码。
export const OPERATION_AUDIT_RESULT = {
  SUCCESS: 'success',
  FAILURE: 'failure',
} as const

export const OPERATION_AUDIT_MODULE = {
  AUTH: 'auth',
  PROFILE: 'profile',
  EXAM: 'exam',
  PAYMENT: 'payment',
  USER: 'user',
  PAPER: 'paper',
  SYLLABUS: 'syllabus',
  REVENUE: 'revenue',
  RESOURCE: 'resource',
} as const

export const OPERATION_AUDIT_MODULE_VALUES = Object.values(OPERATION_AUDIT_MODULE)

export type OperationAuditResult = typeof OPERATION_AUDIT_RESULT[keyof typeof OPERATION_AUDIT_RESULT]
export type OperationAuditModule = typeof OPERATION_AUDIT_MODULE[keyof typeof OPERATION_AUDIT_MODULE]
