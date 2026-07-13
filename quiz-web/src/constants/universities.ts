// 注册与个人中心共用的目标院校选项。
export const TARGET_UNIVERSITY_OPTIONS = [
  '剑桥大学',
  '牛津大学',
  '帝国理工学院',
  '伦敦大学学院',
  '伦敦政治经济学院',
] as const

export type TargetUniversity = (typeof TARGET_UNIVERSITY_OPTIONS)[number]
