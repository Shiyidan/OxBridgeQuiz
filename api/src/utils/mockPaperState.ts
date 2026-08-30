// 模考试卷状态机：集中定义套卷组卷、发布、单项开放和删除的稳定业务规则。
import {
  EXAM_TYPE,
  MOCK_PAPER_MODULE_STATUS,
  MOCK_PAPER_STATUS,
  MOCK_PAPER_VALIDATION_STATUS,
} from '../constants/domain.js'

type MockPaperReadinessModule = {
  code: string
  validationStatus: string
}

export type MockPaperReadiness = {
  validationStatus: string
  readyModuleCount: number
  fullExamReady: boolean
}

// ESAT 完整模考必须覆盖个人中心选定的三科，不能把只命中两科的套卷裁剪后展示。
export function coversEsatModuleSelection(
  modules: Array<{ code: string }>,
  selectedCodes: string[] | null,
): boolean {
  if (
    !selectedCodes
    || selectedCodes.length !== 3
    || new Set(selectedCodes).size !== 3
    || !selectedCodes.includes('maths1')
  ) return false
  const availableCodes = new Set(modules.map((module) => module.code))
  return selectedCodes.every((code) => availableCodes.has(code))
}

// 套卷就绪状态只由当前 Module 校验结果派生，避免数据库缓存字段与实际组成脱节。
export function deriveMockPaperReadiness(
  examType: string,
  modules: MockPaperReadinessModule[],
): MockPaperReadiness {
  const readyModuleCodes = new Set(
    modules
      .filter((module) => module.validationStatus === MOCK_PAPER_VALIDATION_STATUS.VALID)
      .map((module) => module.code),
  )
  const moduleCodes = new Set(modules.map((module) => module.code))
  const everyModuleReady = readyModuleCodes.size === modules.length
  const fullExamReady = examType === EXAM_TYPE.ESAT
    ? modules.length >= 3
      && modules.length <= 5
      && moduleCodes.size === modules.length
      && moduleCodes.has('maths1')
      && everyModuleReady
    : examType === EXAM_TYPE.TMUA
      ? modules.length === 2
        && moduleCodes.size === 2
        && moduleCodes.has('paper1')
        && moduleCodes.has('paper2')
        && everyModuleReady
      : false
  return {
    validationStatus: fullExamReady
      ? MOCK_PAPER_VALIDATION_STATUS.VALID
      : MOCK_PAPER_VALIDATION_STATUS.INVALID,
    readyModuleCount: readyModuleCodes.size,
    fullExamReady,
  }
}

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

// 单项发布与套卷生命周期相互独立；只要单项校验和运行载体有效即可开始。
export function isMockPaperModuleAvailable(input: {
  publicationStatus: string
  validationStatus: string
  deletedAt: Date | null
  paperStatus: string | null
}): boolean {
  return (
    input.publicationStatus === MOCK_PAPER_MODULE_STATUS.PUBLISHED
    && input.validationStatus === MOCK_PAPER_VALIDATION_STATUS.VALID
    && input.paperStatus === 'published'
  )
}

// 草稿套卷可独立删除；既有单项答卷属于单项资产，不阻止释放组卷关系。
export function canDeleteMockPaperSet(input: {
  status: string
  examRecordCount: number
  deletedAt: Date | null
}): boolean {
  return (
    canEditMockPaperComposition(input.status, input.deletedAt)
  )
}

// 可组卷来源必须来自已删除套卷且未被其他套卷占用；仍属于草稿或已发布套卷的模块一律不可重复组卷。
export function canClaimMockPaperSource(input: {
  sourceModuleId: string | null
  composedCopyCount: number
  ownerModuleCount: number
  ownerStatus: string
  ownerDeletedAt: Date | null
}): boolean {
  return (
    !input.sourceModuleId
    && input.composedCopyCount === 0
    && Boolean(input.ownerDeletedAt)
  )
}
