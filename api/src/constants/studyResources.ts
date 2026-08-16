// 学习资料枚举：统一后台分类、访问级别与发布状态的稳定编码。
export const STUDY_RESOURCE_CATEGORY = {
  EXAM_MATERIAL: 'exam_material',
  PAST_PAPER: 'past_paper',
  KNOWLEDGE_HANDOUT: 'knowledge_handout',
} as const

export const STUDY_RESOURCE_CATEGORIES = Object.values(STUDY_RESOURCE_CATEGORY)
export type StudyResourceCategory = (typeof STUDY_RESOURCE_CATEGORIES)[number]

export const STUDY_RESOURCE_ACCESS_TIER = {
  FREE: 'free',
  MEMBER: 'member',
} as const

export const STUDY_RESOURCE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
} as const

export const STUDY_RESOURCE_STATUSES = Object.values(STUDY_RESOURCE_STATUS)
export type StudyResourceStatus = (typeof STUDY_RESOURCE_STATUSES)[number]

export const STUDY_RESOURCE_FILE_ROLE = {
  MAIN: 'main',
  QUESTION: 'question',
  ANSWER: 'answer',
} as const

export const STUDY_RESOURCE_DOWNLOAD_COUNT_BASE = 10

// 后台只接受三个已确认的资料入口，避免自由文本形成重复分类。
export function isStudyResourceCategory(value: unknown): value is StudyResourceCategory {
  return typeof value === 'string'
    && STUDY_RESOURCE_CATEGORIES.includes(value as StudyResourceCategory)
}

// 上传阶段仅允许草稿或已发布，避免数据库出现无法解释的状态。
export function isStudyResourceStatus(value: unknown): value is StudyResourceStatus {
  return typeof value === 'string'
    && STUDY_RESOURCE_STATUSES.includes(value as StudyResourceStatus)
}
