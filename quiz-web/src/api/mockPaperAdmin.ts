// 模考试卷库 API：定义后台套卷列表、Excel 导入、校验详情和草稿替换操作。
import { callApi } from '@/utils/request'

export type MockPaperExamType = 'ESAT' | 'TMUA'
export type MockPaperAccessTier = 'free' | 'member'
export type MockPaperValidationStatus = 'valid' | 'invalid'

export interface MockPaperSetListItem {
  id: string
  code: string
  sequenceNo: number
  examType: MockPaperExamType
  title: string
  accessTier: MockPaperAccessTier
  status: 'draft' | 'published' | 'archived'
  version: number
  sourceFileName: string | null
  paperId: string | null
  validationStatus: MockPaperValidationStatus
  issueCount: number
  questionCount: number
  readyModuleCount: number
  fullExamReady: boolean
  moduleCount: number
  deletable: boolean
  modules: Array<{
    code: string
    label: string
    validationStatus: MockPaperValidationStatus
  }>
  updatedAt: string
  publishedAt: string | null
  archivedAt: string | null
}

export interface MockPaperQuestionDetail {
  id: string
  position: number
  sourceCode: string
  validationStatus: MockPaperValidationStatus
  issues: string[]
  question: {
    id: string
    uniqueCode: string
    title: string
    status: string
    examType: string
    subject: string | null
    subjectCode: string | null
    difficulty: 'easy' | 'medium' | 'hard' | null
    questionType: string | null
  } | null
}

export interface MockPaperModuleDetail {
  id: string
  code: string
  label: string
  title: string | null
  order: number
  durationSeconds: number
  expectedQuestionCount: number
  questionCount: number
  validationStatus: MockPaperValidationStatus
  publicationStatus: 'draft' | 'published' | 'archived'
  issueCount: number
  published: boolean
  removable: boolean
  issues: string[]
  questions: MockPaperQuestionDetail[]
}

export interface MockPaperSetDetail
  extends Omit<MockPaperSetListItem, 'moduleCount'> {
  issues: string[]
  publishableModuleCount: number
  canPublish: boolean
  canAddModules: boolean
  singleModuleDetail?: boolean
  releasedModule?: boolean
  parentSetTitle?: string | null
  modules: MockPaperModuleDetail[]
}

export interface MockPaperModuleCandidate {
  id: string
  code: string
  label: string
  title: string | null
  durationSeconds: number
  questionCount: number
  sourceSet: {
    id: string
    code: string
    sequenceNo: number
    title: string
    status: 'draft' | 'published'
    accessTier: MockPaperAccessTier
  }
}

export interface MockPaperListResult {
  list: MockPaperSetListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasPrev: boolean
    hasNext: boolean
  }
}

export interface MockPaperModuleListItem {
  id: string
  code: string
  label: string
  title: string | null
  accessTier: MockPaperAccessTier
  order: number
  durationSeconds: number
  expectedQuestionCount: number
  questionCount: number
  validationStatus: MockPaperValidationStatus
  publicationStatus: 'draft' | 'published' | 'archived'
  issueCount: number
  updatedAt: string
  released: boolean
  mockPaperSet: Pick<
    MockPaperSetListItem,
    | 'id'
    | 'code'
    | 'sequenceNo'
    | 'examType'
    | 'title'
    | 'accessTier'
    | 'status'
    | 'version'
    | 'fullExamReady'
  >
}

export interface MockPaperModuleListResult {
  list: MockPaperModuleListItem[]
  pagination: MockPaperListResult['pagination']
}

export interface MockPaperListParams {
  page?: number
  pageSize?: number
  examType?: string
  status?: string
  keyword?: string
}
export interface MockPaperWorkbookUploadItem {
  id: string
  originalFileName: string
  contentType: string
  fileSizeBytes: number
  status: 'processing' | 'succeeded' | 'failed'
  setCount: number
  moduleCount: number
  errorMessage: string | null
  uploadedBy: {
    username: string
    email: string
  } | null
  createdAt: string
  completedAt: string | null
}

export interface MockPaperWorkbookUploadListResult {
  list: MockPaperWorkbookUploadItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 管理首页卡片只获取模考试卷库汇总数量。
export function getMockPaperSetStats() {
  return callApi<{ total: number; validDrafts: number }>({
    method: 'GET',
    url: '/mock-paper-sets/stats',
    silent: true,
  })
}

// 管理列表使用服务端分页，筛选变化后由页面重置到第一页。
export function getMockPaperSets(params: MockPaperListParams) {
  return callApi<MockPaperListResult>({
    method: 'GET',
    url: '/mock-paper-sets',
    params: {
      page: params.page ? String(params.page) : undefined,
      pageSize: params.pageSize ? String(params.pageSize) : undefined,
      examType: params.examType,
      status: params.status,
      keyword: params.keyword,
    },
  })
}

// 单项视图按 Module/Paper 分页，并返回所属 Mock 的组成状态。
export function getMockPaperModules(params: MockPaperListParams) {
  return callApi<MockPaperModuleListResult>({
    method: 'GET',
    url: '/mock-paper-sets/modules',
    params: {
      page: params.page ? String(params.page) : undefined,
      pageSize: params.pageSize ? String(params.pageSize) : undefined,
      examType: params.examType,
      status: params.status,
      keyword: params.keyword,
    },
  })
}

// 详情包含模块、题序、匹配题目和逐题校验问题。
export function getMockPaperSetDetail(id: string) {
  return callApi<MockPaperSetDetail>({
    method: 'GET',
    url: `/mock-paper-sets/${id}`,
  })
}

// 单项视图详情只读取当前 Module/Paper，不展开所属套卷的其他模块。
export function getMockPaperModuleDetail(moduleId: string) {
  return callApi<MockPaperSetDetail>({
    method: 'GET',
    url: `/mock-paper-sets/modules/${moduleId}`,
  })
}

// 单项名称和权限修改后由服务端同步来源模块及其已有套卷副本。
export function updateMockPaperModule(
  moduleId: string,
  body: { title: string; accessTier: MockPaperAccessTier },
) {
  return callApi<{
    id: string
    title: string
    accessTier: MockPaperAccessTier
    updatedModuleCount: number
  }>({
    method: 'PUT',
    url: `/mock-paper-sets/modules/${moduleId}`,
    body,
  })
}

// 单项重新校验只以指定来源 Module/Paper 为入口，不改变任何发布或权限状态。
export function validateMockPaperModule(moduleId: string) {
  return callApi<{
    id: string
    validationStatus: MockPaperValidationStatus
    issueCount: number
  }>({
    method: 'POST',
    url: `/mock-paper-sets/modules/${moduleId}/validate`,
  })
}

// 单项发布只开放指定 Module/Paper，并保持所属套卷的其他模块状态不变。
export function publishMockPaperModule(moduleId: string) {
  return callApi<{ id: string; moduleId: string; paperId: string }>({
    method: 'POST',
    url: `/mock-paper-sets/modules/${moduleId}/publish`,
  })
}

// 单项下线仅关闭新的单项模考入口，不改变所属完整套卷或历史答卷。
export function archiveMockPaperModule(moduleId: string) {
  return callApi<{
    id: string
    moduleId: string
    status: 'archived'
    archivedAt: string
  }>({
    method: 'POST',
    url: `/mock-paper-sets/modules/${moduleId}/archive`,
  })
}

// 组套候选只包含同考试、模块不重复且尚未被其他有效套卷采用的独立单项卷。
export function getMockPaperModuleCandidates(id: string) {
  return callApi<{ list: MockPaperModuleCandidate[] }>({
    method: 'GET',
    url: `/mock-paper-sets/${id}/module-candidates`,
  })
}

// 新建套卷弹窗读取尚未被任何套卷采用的独立单项。
export function getMockPaperCompositionCandidates(examType: MockPaperExamType) {
  return callApi<{ list: MockPaperModuleCandidate[] }>({
    method: 'GET',
    url: '/mock-paper-sets/composition-candidates',
    params: { examType },
  })
}

// 由管理员选择的独立单项创建新草稿套卷，来源独占校验由服务端完成。
export function composeMockPaperSet(
  moduleIds: string[],
  accessTier: MockPaperAccessTier,
) {
  return callApi<{ id: string }>({
    method: 'POST',
    url: '/mock-paper-sets/compose',
    body: { moduleIds, accessTier },
  })
}

// 管理员确认后由服务端复制稳定题序并记录来源，前端不直接拼装题目数据。
export function addMockPaperModule(id: string, sourceModuleId: string) {
  return callApi<{ id: string; sourceModuleId: string }>({
    method: 'POST',
    url: `/mock-paper-sets/${id}/modules`,
    body: { sourceModuleId },
  })
}

// 草稿移除 Module 只调整模考试卷结构，不删除题库中的 Question 数据。
export function removeMockPaperModule(id: string, moduleId: string) {
  return callApi<{ id: string; sourceModuleId: string | null }>({
    method: 'DELETE',
    url: `/mock-paper-sets/${id}/modules/${moduleId}`,
  })
}

// Excel 文件在后端解析并校验，前端不推断题号或模块结果。
export function importMockPaperWorkbook(file: File, accessTier: MockPaperAccessTier) {
  const form = new FormData()
  form.append('file', file)
  form.append('accessTier', accessTier)
  return callApi<{ moduleCount: number }>({
    method: 'POST',
    url: '/mock-paper-sets/import',
    body: form,
    timeout: 120000,
  })
}
// 上传历史由服务端分页，文件的物理存储键不进入浏览器。
export function getMockPaperWorkbookUploadHistory(page: number, pageSize: number) {
  return callApi<MockPaperWorkbookUploadListResult>({
    method: 'GET',
    url: '/mock-paper-sets/upload-history',
    params: { page: String(page), pageSize: String(pageSize) },
  })
}

// 原始 Excel 通过管理员鉴权接口下载，避免生成可公开访问的静态地址。
export function downloadMockPaperWorkbookUpload(id: string) {
  return callApi<Blob>({
    method: 'GET',
    url: `/mock-paper-sets/upload-history/${id}/download`,
    responseType: 'blob',
    timeout: 60000,
  })
}

// 草稿名称和免费/会员属性可独立调整，套卷编号保持不变。
export function updateMockPaperSet(
  id: string,
  body: { title: string; accessTier: MockPaperAccessTier },
) {
  return callApi<{ id: string; title: string; accessTier: MockPaperAccessTier }>({
    method: 'PUT',
    url: `/mock-paper-sets/${id}`,
    body,
  })
}

// 单题替换保留当前位置，并由服务端重新复核整套草稿。
export function replaceMockPaperQuestion(id: string, itemId: string, questionCode: string) {
  return callApi<{ id: string; previousCode: string; questionCode: string }>({
    method: 'PUT',
    url: `/mock-paper-sets/${id}/questions/${itemId}`,
    body: { questionCode },
  })
}

// 题库状态变化后可主动刷新整个草稿的校验结果。
export function validateMockPaperSet(id: string) {
  return callApi<{
    id: string
    validationStatus: MockPaperValidationStatus
    issueCount: number
    readyModuleCount: number
    fullExamReady: boolean
  }>({
    method: 'POST',
    url: `/mock-paper-sets/${id}/validate`,
  })
}

// 校验通过后发布到学生端目录，并创建答卷运行载体。
export function publishMockPaperSet(id: string) {
  return callApi<{
    id: string
    paperId: string
    status: 'draft' | 'published'
    publishedAt: string | null
    suitePublished: boolean
    publishedModuleCount: number
  }>({
    method: 'POST',
    url: `/mock-paper-sets/${id}/publish`,
  })
}

// 已发布套卷下线后不再允许新开始，既有答卷仍可继续。
export function archiveMockPaperSet(id: string) {
  return callApi<{ id: string; status: 'archived'; archivedAt: string }>({
    method: 'POST',
    url: `/mock-paper-sets/${id}/archive`,
  })
}

// 删除仅用于尚未发布的错误草稿。
export function deleteMockPaperSet(id: string) {
  return callApi<{ id: string }>({
    method: 'DELETE',
    url: `/mock-paper-sets/${id}`,
  })
}
