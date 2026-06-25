// 考试类型选项：上传、题库、会员权益和个人中心共用。
export const EXAM_TYPE_OPTIONS = [
  { label: 'ESAT', value: 'ESAT' },
  { label: 'TMUA', value: 'TMUA' },
  { label: 'STEP', value: 'STEP' },
] as const

export type ExamType = (typeof EXAM_TYPE_OPTIONS)[number]['value']

export const DEFAULT_EXAM_TYPE: ExamType = 'TMUA'
