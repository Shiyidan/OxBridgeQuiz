// 考试类型配置：上传、题库、会员权益和个人中心共享，开放状态仅约束学生端业务入口。
export const EXAM_TYPE_OPTIONS = [
  { label: 'ESAT', value: 'ESAT', available: true },
  { label: 'TMUA', value: 'TMUA', available: true },
  { label: 'STEP', value: 'STEP', available: false },
] as const

export type ExamType = (typeof EXAM_TYPE_OPTIONS)[number]['value']

export const DEFAULT_EXAM_TYPE: ExamType = 'TMUA'
export const STEP_UNAVAILABLE_MESSAGE = 'STEP 考试相关功能正在推进中，敬请期待'

// 学生端使用集中开放状态拦截暂未支持的考试，后台仍可维护对应基础数据。
export function isExamTypeAvailable(value: unknown): boolean {
  const normalized = String(value || '').toUpperCase()
  return EXAM_TYPE_OPTIONS.some((item) => item.value === normalized && item.available)
}

// 未开放考试统一使用稳定提示，避免不同入口出现互相矛盾的上线文案。
export function getExamUnavailableMessage(value: unknown): string {
  const normalized = String(value || '').toUpperCase()
  return normalized === 'STEP'
    ? STEP_UNAVAILABLE_MESSAGE
    : `${normalized || '该类型'}考试相关功能暂未开放`
}
