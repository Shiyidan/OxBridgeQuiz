// 学生产品使用分析展示常量：统一核心学习模块、偏好类型及其配色。
import type { ProductPreferenceCode, ProductUsageModuleCode } from '@/api/admin'

export const PRODUCT_USAGE_MODULE_META: Record<
  ProductUsageModuleCode,
  { label: string; metricLabel: string; color: string }
> = {
  diagnostic_test: {
    label: '诊断测试',
    metricLabel: '诊断测试次数',
    color: '#4f46e5',
  },
  question_bank: {
    label: '试题库练习',
    metricLabel: '试题库练习次数',
    color: '#0891b2',
  },
  mock_exam: {
    label: '模考练习',
    metricLabel: '模考练习次数',
    color: '#d97706',
  },
}

export const PRODUCT_PREFERENCE_META: Record<
  ProductPreferenceCode,
  { label: string; color: string }
> = {
  diagnostic_test: { label: '偏好诊断测试', color: '#4f46e5' },
  question_bank: { label: '偏好试题库', color: '#0891b2' },
  mock_exam: { label: '偏好模考', color: '#d97706' },
  mixed: { label: '混合使用', color: '#7c3aed' },
  insufficient: { label: '数据不足', color: '#94a3b8' },
}

// 未知编码保留原值，保证服务端新增类型时页面仍可辨认。
export function productUsageModuleLabel(module: string): string {
  return PRODUCT_USAGE_MODULE_META[module as ProductUsageModuleCode]?.label || module
}

// 偏好分组名称用于统计条和辅助说明，保持与最小样本规则一致。
export function productPreferenceLabel(preference: string): string {
  return PRODUCT_PREFERENCE_META[preference as ProductPreferenceCode]?.label || preference
}
