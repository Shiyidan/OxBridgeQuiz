// 诊断报告产品代际与生成版本：统一服务端生成、升级权限和前端展示判断。
import { EXAM_TYPE } from './domain.js'

export const DIAGNOSTIC_REPORT_PRODUCT_VERSION = {
  V1: 'v1',
  V2: 'v2',
} as const

export type DiagnosticReportProductVersion =
  (typeof DIAGNOSTIC_REPORT_PRODUCT_VERSION)[keyof typeof DIAGNOSTIC_REPORT_PRODUCT_VERSION]

export const DIAGNOSTIC_REPORT_VERSION = {
  ESAT_V2: 'diagnostic-report-v2-esat-v1',
  TMUA_V2: 'diagnostic-report-v2-tmua-v1',
  GENERIC_V1: 'diagnostic-report-v1',
} as const

export const DIAGNOSTIC_REPORT_PROMPT_VERSION = {
  ESAT_V2: 'esat-diagnostic-v2-prompt-v6',
  TMUA_V2: 'tmua-diagnostic-v2-prompt-v6',
  GENERIC_V1: 'diagnostic-summary-v1',
} as const

// 新提交答卷按考试类型选择当前产品代际；未开放的通用报告继续使用原版本。
export function reportVersionForExam(examType: string): string {
  if (examType === EXAM_TYPE.ESAT) return DIAGNOSTIC_REPORT_VERSION.ESAT_V2
  if (examType === EXAM_TYPE.TMUA) return DIAGNOSTIC_REPORT_VERSION.TMUA_V2
  return DIAGNOSTIC_REPORT_VERSION.GENERIC_V1
}

// 提示词版本与报告产品代际绑定，保证同一报告快照可追溯到生成规范。
export function promptVersionForExam(examType: string): string {
  if (examType === EXAM_TYPE.ESAT) return DIAGNOSTIC_REPORT_PROMPT_VERSION.ESAT_V2
  if (examType === EXAM_TYPE.TMUA) return DIAGNOSTIC_REPORT_PROMPT_VERSION.TMUA_V2
  return DIAGNOSTIC_REPORT_PROMPT_VERSION.GENERIC_V1
}

// 历史内部修订号统一归为产品 V1，只有带产品 V2 前缀的新快照归为 V2。
export function productVersionForReportVersion(reportVersion: string): DiagnosticReportProductVersion {
  return reportVersion.startsWith('diagnostic-report-v2-')
    ? DIAGNOSTIC_REPORT_PRODUCT_VERSION.V2
    : DIAGNOSTIC_REPORT_PRODUCT_VERSION.V1
}

// 只有 ESAT/TMUA 的 V1 报告允许由学生主动更新一次，V2 不再重复生成。
export function canUpgradeDiagnosticReport(reportKind: string, reportVersion: string): boolean {
  const kind = reportKind.toLowerCase()
  return (kind === 'esat' || kind === 'tmua')
    && productVersionForReportVersion(reportVersion) === DIAGNOSTIC_REPORT_PRODUCT_VERSION.V1
}
