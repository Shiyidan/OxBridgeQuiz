// 操作审计枚举：统一后台筛选、持久化结果和业务模块编码。
export const OPERATION_AUDIT_RESULT = {
  SUCCESS: 'success',
  BLOCKED: 'blocked',
  FAILURE: 'failure',
} as const

export const OPERATION_AUDIT_BLOCKED_ERROR_CODES = [
  'DIAGNOSTIC_IN_PROGRESS',
  'QUESTION_BANK_IN_PROGRESS',
] as const

// 已有未完成答卷属于预期业务保护，不计入系统或用户操作失败。
export function effectiveOperationAuditResult(input: {
  result?: string
  statusCode: number
  errorCode?: string | null
}): OperationAuditResult {
  if (input.result === OPERATION_AUDIT_RESULT.SUCCESS) {
    return OPERATION_AUDIT_RESULT.SUCCESS
  }
  if (input.result !== OPERATION_AUDIT_RESULT.FAILURE && input.statusCode < 400) {
    return OPERATION_AUDIT_RESULT.SUCCESS
  }
  if (
    input.result === OPERATION_AUDIT_RESULT.BLOCKED
    || (
      input.statusCode === 409
      && OPERATION_AUDIT_BLOCKED_ERROR_CODES.some((code) => code === input.errorCode)
    )
  ) {
    return OPERATION_AUDIT_RESULT.BLOCKED
  }
  return OPERATION_AUDIT_RESULT.FAILURE
}

// 行为分析只统计真正失败，历史上已保存为 failure 的业务拦截也按新口径排除。
export function isOperationAuditFailure(input: {
  result?: string
  statusCode: number
  errorCode?: string | null
}): boolean {
  return effectiveOperationAuditResult(input) === OPERATION_AUDIT_RESULT.FAILURE
}

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
