<!-- 教材与备考资料库管理页：按三类入口上传 PDF，并维护后台可见的资料记录。 -->
<template>
  <div class="resource-page">
    <div class="page-body">
      <header class="section-header">
        <div>
          <h2 class="section-title">教材与备考资料库</h2>
          <p class="section-desc">上传 PDF 资料并按考试资料、过往真题和知识点讲义统一管理。</p>
        </div>
        <el-button type="primary" @click="openUploadDialog">上传 PDF 资料</el-button>
      </header>

      <section class="category-grid" aria-label="资料分类">
        <button
          v-for="category in categoryOptions"
          :key="category.value"
          class="category-card"
          :class="{ 'category-card--active': filters.category === category.value }"
          type="button"
          @click="selectCategory(category.value)"
        >
          <span class="category-card__icon" aria-hidden="true">{{ category.icon }}</span>
          <span>
            <strong>{{ category.label }}</strong>
            <small>{{ category.description }}</small>
          </span>
        </button>
      </section>

      <section class="list-panel">
        <div class="filter-row">
          <el-select v-model="filters.examType" clearable placeholder="全部考试" @change="resetAndFetch">
            <el-option
              v-for="option in examTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-select v-model="filters.status" clearable placeholder="全部状态" @change="resetAndFetch">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
          </el-select>
          <el-button @click="resetFilters">重置筛选</el-button>
        </div>

        <AdminDataTable
          :data="resources"
          :loading="loading"
          :show-pagination="true"
          :page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          empty-text="当前分类暂无资料，请点击右上角上传 PDF"
          @update:page="changePage"
          @update:page-size="changePageSize"
        >
          <el-table-column prop="title" label="资料名称" min-width="340" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="resource-name">
                <strong>{{ row.title }}</strong>
                <span v-for="file in row.files" :key="file.id">
                  {{ fileRoleLabel(file.fileRole) }}：{{ file.originalFileName }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="examType" label="考试" min-width="110" align="center" />
          <el-table-column label="年份" min-width="90" align="center">
            <template #default="{ row }">{{ row.resourceYear || '—' }}</template>
          </el-table-column>
          <el-table-column label="文件大小" min-width="120" align="center">
            <template #default="{ row }">{{ formatFileSize(totalFileSize(row)) }}</template>
          </el-table-column>
          <el-table-column label="状态" min-width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'published' ? 'success' : 'info'" effect="light" round>
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="上传时间" min-width="180" align="center">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" min-width="140" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="toggleResourceStatus(row)">
                {{ row.status === 'published' ? '撤回' : '发布' }}
              </el-button>
              <el-button link type="danger" @click="removeResource(row)">删除</el-button>
            </template>
          </el-table-column>
        </AdminDataTable>
      </section>
    </div>

    <el-dialog
      v-model="uploadDialogVisible"
      class="resource-upload-dialog"
      :title="uploadForm.category === 'past_paper' ? '上传年度真题' : '上传 PDF 资料'"
      width="620px"
      top="4vh"
      :close-on-click-modal="false"
      @closed="resetUploadForm"
    >
      <el-form label-position="top">
        <template v-if="uploadForm.category === 'past_paper'">
          <div class="paired-upload-grid">
            <el-form-item label="试题 PDF">
              <el-upload
                ref="questionUploadRef"
                class="pdf-uploader"
                drag
                accept=".pdf,application/pdf"
                :auto-upload="false"
                :limit="1"
                :on-change="handleQuestionFileChange"
                :on-remove="clearQuestionFile"
              >
                <div class="upload-copy upload-copy--compact">
                  <strong>{{ uploadForm.questionFile?.name || '选择试题 PDF' }}</strong>
                  <span>Question Paper</span>
                </div>
              </el-upload>
            </el-form-item>
            <el-form-item label="答案 PDF">
              <el-upload
                ref="answerUploadRef"
                class="pdf-uploader"
                drag
                accept=".pdf,application/pdf"
                :auto-upload="false"
                :limit="1"
                :on-change="handleAnswerFileChange"
                :on-remove="clearAnswerFile"
              >
                <div class="upload-copy upload-copy--compact">
                  <strong>{{ uploadForm.answerFile?.name || '选择答案 PDF' }}</strong>
                  <span>Answer / Mark Scheme</span>
                </div>
              </el-upload>
            </el-form-item>
          </div>
          <p class="paired-upload-tip">同一考试和年份会合并为一组；可同时上传两份文件，也可为已有年份补传缺失项。</p>
        </template>
        <el-form-item v-else label="资料文件" required>
          <el-upload
            ref="uploadRef"
            class="pdf-uploader"
            drag
            accept=".pdf,application/pdf"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="clearSelectedFile"
          >
            <div class="upload-copy">
              <strong>{{ uploadForm.file ? uploadForm.file.name : '拖拽 PDF 到此处，或点击选择文件' }}</strong>
              <span>单个文件最大 50MB，仅支持 PDF</span>
            </div>
          </el-upload>
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="资料名称" required>
            <el-input v-model="uploadForm.title" maxlength="255" show-word-limit />
          </el-form-item>
          <el-form-item label="考试类型" required>
            <el-select v-model="uploadForm.examType">
              <el-option
                v-for="option in examTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="资料分类" required>
            <el-select v-model="uploadForm.category">
              <el-option
                v-for="option in categoryOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="uploadForm.category === 'past_paper'" label="真题年份" required>
            <el-input-number
              v-model="uploadForm.resourceYear"
              :min="1980"
              :max="maxResourceYear"
              :controls="false"
              placeholder="例如 2016"
            />
          </el-form-item>
        </div>

        <el-form-item label="资料说明">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="2"
            maxlength="5000"
            show-word-limit
            placeholder="可填写版本、来源或适用范围"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitUpload">
          {{ submitting ? '上传中' : uploadForm.category === 'past_paper' ? '保存年度真题' : '确认上传' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type UploadFile, type UploadInstance } from 'element-plus'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import { DEFAULT_EXAM_TYPE, EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'
import {
  deleteStudyResource,
  getStudyResourceAdminList,
  updateStudyResourceStatus,
  uploadPastPaperBundle,
  uploadStudyResource,
  type StudyResourceCategory,
  type StudyResourceFileRole,
  type StudyResourceItem,
  type StudyResourceStatus,
} from '@/api/studyResources'

type CategoryOption = {
  value: StudyResourceCategory
  label: string
  description: string
  icon: string
}

type UploadForm = {
  title: string
  description: string
  examType: ExamType
  category: StudyResourceCategory
  file: File | null
  resourceYear: number
  questionFile: File | null
  answerFile: File | null
}

const categoryOptions: CategoryOption[] = [
  {
    value: 'exam_material',
    label: '考试资料',
    description: '官方考纲、考试指南与备考说明',
    icon: '考',
  },
  {
    value: 'past_paper',
    label: '过往真题',
    description: '历史试卷、样题与配套答案',
    icon: '题',
  },
  {
    value: 'knowledge_handout',
    label: '知识点讲义',
    description: '专题讲义、公式总结与学习笔记',
    icon: '讲',
  },
]

const examTypeOptions = EXAM_TYPE_OPTIONS
const maxResourceYear = new Date().getFullYear() + 2
const loading = ref(false)
const submitting = ref(false)
const uploadDialogVisible = ref(false)
const uploadRef = ref<UploadInstance | null>(null)
const questionUploadRef = ref<UploadInstance | null>(null)
const answerUploadRef = ref<UploadInstance | null>(null)
const resources = ref<StudyResourceItem[]>([])
const filters = reactive<{
  examType: ExamType | ''
  category: StudyResourceCategory
  status: StudyResourceStatus | ''
}>({
  examType: '',
  category: 'exam_material',
  status: '',
})
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const uploadForm = reactive<UploadForm>(createDefaultUploadForm())

// 新增弹窗继承当前分类，减少管理员在三个入口间重复选择。
function createDefaultUploadForm(): UploadForm {
  return {
    title: '',
    description: '',
    examType: filters?.examType || DEFAULT_EXAM_TYPE,
    category: filters?.category || 'exam_material',
    file: null,
    resourceYear: new Date().getFullYear(),
    questionFile: null,
    answerFile: null,
  }
}

onMounted(fetchResources)

// 后台列表始终按当前分类和筛选条件从数据库分页读取。
async function fetchResources(): Promise<void> {
  loading.value = true
  try {
    const result = await getStudyResourceAdminList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      examType: filters.examType || undefined,
      category: filters.category,
      status: filters.status || undefined,
    })
    resources.value = result.list
    pagination.total = result.pagination.total
  } catch {
    resources.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 三个分类卡片既是业务入口也是列表筛选，切换后回到第一页。
function selectCategory(category: StudyResourceCategory): void {
  filters.category = category
  pagination.page = 1
  void fetchResources()
}

function resetAndFetch(): void {
  pagination.page = 1
  void fetchResources()
}

function resetFilters(): void {
  filters.examType = ''
  filters.status = ''
  pagination.page = 1
  void fetchResources()
}

function changePage(page: number): void {
  pagination.page = page
  void fetchResources()
}

function changePageSize(pageSize: number): void {
  pagination.pageSize = pageSize
  pagination.page = 1
  void fetchResources()
}

// 上传弹窗使用当前筛选考试作为默认值，但不锁定管理员重新选择。
function openUploadDialog(): void {
  Object.assign(uploadForm, createDefaultUploadForm())
  uploadDialogVisible.value = true
}

// 选择 PDF 后使用文件名预填标题，管理员仍可在提交前修改。
function handleFileChange(uploadFile: UploadFile): void {
  const file = uploadFile.raw || null
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    ElMessage.warning('仅支持上传 PDF 文件')
    uploadRef.value?.clearFiles()
    uploadForm.file = null
    return
  }
  uploadForm.file = file
  if (!uploadForm.title.trim()) uploadForm.title = file.name.replace(/\.pdf$/i, '')
}

function clearSelectedFile(): void {
  uploadForm.file = null
}

// 年度真题的两个上传框共用 PDF 校验，但分别保存为试题和答案角色。
function handlePairedFileChange(role: 'question' | 'answer', uploadFile: UploadFile): void {
  const file = uploadFile.raw || null
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
    ElMessage.warning('仅支持上传 PDF 文件')
    if (role === 'question') questionUploadRef.value?.clearFiles()
    else answerUploadRef.value?.clearFiles()
    clearPairedFile(role)
    return
  }
  if (role === 'question') uploadForm.questionFile = file
  else uploadForm.answerFile = file
  if (!uploadForm.title.trim()) uploadForm.title = file.name.replace(/\.pdf$/i, '')
}

// 试题上传框将文件固定归入 question 角色。
function handleQuestionFileChange(uploadFile: UploadFile): void {
  handlePairedFileChange('question', uploadFile)
}

// 答案上传框将文件固定归入 answer 角色。
function handleAnswerFileChange(uploadFile: UploadFile): void {
  handlePairedFileChange('answer', uploadFile)
}

function clearPairedFile(role: 'question' | 'answer'): void {
  if (role === 'question') uploadForm.questionFile = null
  else uploadForm.answerFile = null
}

// 移除试题选择时只清空 question 文件，不影响已选答案。
function clearQuestionFile(): void {
  clearPairedFile('question')
}

// 移除答案选择时只清空 answer 文件，不影响已选试题。
function clearAnswerFile(): void {
  clearPairedFile('answer')
}

function resetUploadForm(): void {
  uploadRef.value?.clearFiles()
  questionUploadRef.value?.clearFiles()
  answerUploadRef.value?.clearFiles()
  Object.assign(uploadForm, createDefaultUploadForm())
}

// 后端再次校验 PDF 签名和业务枚举，前端校验只用于即时反馈。
async function submitUpload(): Promise<void> {
  const isPastPaper = uploadForm.category === 'past_paper'
  if (isPastPaper && !uploadForm.questionFile && !uploadForm.answerFile) {
    ElMessage.warning('请至少选择试题或答案 PDF')
    return
  }
  if (!isPastPaper && !uploadForm.file) {
    ElMessage.warning('请选择 PDF 文件')
    return
  }
  if (!uploadForm.title.trim()) uploadForm.title = `${uploadForm.examType} ${uploadForm.resourceYear} 年真题`

  submitting.value = true
  try {
    if (isPastPaper) {
      await uploadPastPaperBundle({
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim(),
        examType: uploadForm.examType,
        resourceYear: uploadForm.resourceYear,
        questionFile: uploadForm.questionFile,
        answerFile: uploadForm.answerFile,
      })
    } else {
      await uploadStudyResource({
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim(),
        examType: uploadForm.examType,
        category: uploadForm.category as Exclude<StudyResourceCategory, 'past_paper'>,
        file: uploadForm.file!,
      })
    }
    ElMessage.success(isPastPaper ? '年度真题保存成功' : 'PDF 资料上传成功')
    uploadDialogVisible.value = false
    filters.category = uploadForm.category
    pagination.page = 1
    await fetchResources()
  } catch {
    // 公共请求层展示服务端返回的具体失败原因。
  } finally {
    submitting.value = false
  }
}

// 删除资料会同时清理数据库记录和 ECS 本地文件，操作前必须二次确认。
async function removeResource(resource: StudyResourceItem): Promise<void> {
  try {
    await ElMessageBox.confirm(`删除后将同时移除 PDF 文件，确认删除“${resource.title}”吗？`, '删除资料', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await deleteStudyResource(resource.id)
    ElMessage.success('资料已删除')
    if (resources.value.length === 1 && pagination.page > 1) pagination.page -= 1
    await fetchResources()
  } catch {
    // 公共请求层展示服务端返回的具体失败原因。
  }
}

// 发布后资料立即进入前台下载列表；撤回只隐藏入口，不删除物理文件。
async function toggleResourceStatus(resource: StudyResourceItem): Promise<void> {
  const nextStatus: StudyResourceStatus = resource.status === 'published' ? 'draft' : 'published'
  const actionLabel = nextStatus === 'published' ? '发布' : '撤回'
  try {
    await ElMessageBox.confirm(
      nextStatus === 'published'
        ? `发布后用户可在资料下载页看到“${resource.title}”，确认发布吗？`
        : `撤回后用户将无法继续下载“${resource.title}”，确认撤回吗？`,
      `${actionLabel}资料`,
      { confirmButtonText: `确认${actionLabel}`, cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  try {
    await updateStudyResourceStatus(resource.id, nextStatus)
    ElMessage.success(`资料已${actionLabel}`)
    await fetchResources()
  } catch {
    // 公共请求层展示服务端返回的具体失败原因。
  }
}

function fileRoleLabel(role: StudyResourceFileRole): string {
  if (role === 'question') return '试题'
  if (role === 'answer') return '答案'
  return '文件'
}

function totalFileSize(resource: StudyResourceItem): number {
  return resource.files.reduce((total, file) => total + file.fileSizeBytes, 0)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped lang="scss">
.resource-page {
  // 当前分页全部展开，由后台主内容区滚动到分页器。
  height: auto;
  min-height: 100%;
  background: #f8fafc;
}

.page-body {
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 40px 16px;
  overflow: visible;
}

.section-header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.section-title {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 1.5rem;
  font-weight: 800;
}

.section-desc {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.category-grid {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.category-card {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  color: #334155;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.category-card:hover,
.category-card--active {
  border-color: #2563eb;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.1);
}

.category-card__icon {
  width: 42px;
  height: 42px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 800;
}

.category-card strong,
.category-card small {
  display: block;
}

.category-card strong {
  margin-bottom: 5px;
  color: #0f172a;
  font-size: 0.95rem;
}

.category-card small {
  overflow: hidden;
  color: #64748b;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.filter-row {
  flex-shrink: 0;
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.filter-row :deep(.el-select) {
  width: 160px;
}

.resource-name {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.resource-name strong,
.resource-name span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-name strong {
  color: #0f172a;
}

.resource-name span {
  color: #94a3b8;
  font-size: 0.75rem;
}

.pdf-uploader {
  width: 100%;
}

.pdf-uploader :deep(.el-upload),
.pdf-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 128px;
  padding: 14px;
}

.paired-upload-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.paired-upload-tip {
  margin: -6px 0 18px;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.6;
}

.upload-copy {
  display: grid;
  gap: 8px;
  padding: 12px;
}

.upload-copy strong {
  color: #334155;
}

.upload-copy span {
  color: #94a3b8;
  font-size: 0.8rem;
}

.upload-copy--compact {
  min-height: 42px;
}

.paired-upload-grid .pdf-uploader :deep(.el-upload-dragger) {
  height: 104px;
}

.upload-copy--compact strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.form-grid :deep(.el-select) {
  width: 100%;
}

.form-grid :deep(.el-input-number) {
  width: 100%;
}

:global(.resource-upload-dialog .el-dialog__header) {
  padding-bottom: 10px;
}

:global(.resource-upload-dialog .el-dialog__body) {
  max-height: calc(84vh - 118px);
  padding-top: 8px;
  padding-bottom: 8px;
  overflow-y: auto;
}

:global(.resource-upload-dialog .el-dialog__footer) {
  padding-top: 10px;
}

:global(.resource-upload-dialog .el-form-item) {
  margin-bottom: 14px;
}

@media (max-width: 900px) {
  .page-body {
    padding-right: 20px;
    padding-left: 20px;
  }

  .category-grid,
  .form-grid,
  .paired-upload-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 860px) {
  .page-body {
    flex: none;
    padding: 20px 16px;
  }
}
</style>
