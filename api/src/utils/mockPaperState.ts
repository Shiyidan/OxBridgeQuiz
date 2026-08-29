// 模考试卷状态机：集中定义套卷组卷、发布、单项开放和删除的稳定业务规则。
import {
  MOCK_PAPER_MODULE_STATUS,
  MOCK_PAPER_STATUS,
  MOCK_PAPER_VALIDATION_STATUS,
} from '../constants/domain.js'

// 只有未删除的草稿套卷允许改变模块组成，避免已发布套卷结构漂移。
export function canEditMockPaperComposition(
  status: string,
  deletedAt: Date | null = null,
): boolean {
  return !deletedAt && status === MOCK_PAPER_STATUS.DRAFT
}

// 发布至少一个可用单项时不自动冒充完整套卷，只有完整结构才能切换套卷状态。
export function suiteStatusAfterPublish(fullExamReady: boolean): string {
  return fullExamReady ? MOCK_PAPER_STATUS.PUBLISHED : MOCK_PAPER_STATUS.DRAFT
}

// 学生端单项入口同时依赖模块发布、模块校验、所属记录存续和运行载体状态。
export function isMockPaperModuleAvailable(input: {
  publicationStatus: string
  validationStatus: string
  deletedAt: Date | null
  paperStatus: string | null
}): boolean {
  return (
    input.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED
    && input.validationStatus === MOCK_PAPER_VALIDATION_STATUS.VALID
    && !input.deletedAt
    && input.paperStatus === 'published'
  )
}

// 套卷删除仅允许无答卷记录的草稿，发布套卷必须走下线流程。
export function canDeleteMockPaperSet(input: {
  status: string
  examRecordCount: number
  deletedAt: Date | null
}): boolean {
  return (
    canEditMockPaperComposition(input.status, input.deletedAt)
    && input.examRecordCount === 0
  )
}

// 可组卷来源必须未被其他套卷占用；所属套卷删除后，原始模块作为释放单项继续可用。
export function canClaimMockPaperSource(input: {
  sourceModuleId: string | null
  composedCopyCount: number
  ownerModuleCount: number
  ownerStatus: string
  ownerDeletedAt: Date | null
}): boolean {
  const hasActiveStandaloneOwner = (
    input.ownerModuleCount === 1
    && input.ownerStatus !== MOCK_PAPER_STATUS.ARCHIVED
    && !input.ownerDeletedAt
  )
  const releasedFromDeletedOwner = Boolean(input.ownerDeletedAt)
  return (
    !input.sourceModuleId
    && input.composedCopyCount === 0
    && (hasActiveStandaloneOwner || releasedFromDeletedOwner)
  )
}
