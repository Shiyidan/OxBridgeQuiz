<!-- 后台试题包列表：按导入文件汇总题目并提供整包上线、归档、删除和查看入口。 -->
<template>
  <div class="question-bank-page">
    <div class="page-body">
      <div class="section-header">
        <div>
          <h2 class="section-title">试题库文件</h2>
          <p class="section-desc">每次导入按原始文件归类展示；进入文件后可逐题审核、发布和归档。</p>
        </div>
        <el-button type="primary" @click="router.push('/admin/core-library/questions/import')">
          导入 standard2 文件
        </el-button>
      </div>

      <div class="filter-bar">
        <el-input
          v-model.trim="filters.keyword"
          class="search-input"
          clearable
          placeholder="文件名、批次标题或备注"
          @keyup.enter="applyFilters"
        />
        <el-select v-model="filters.examType" clearable placeholder="考试类型">
          <el-option
            v-for="item in EXAM_TYPE_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="filters.status" clearable placeholder="题目状态">
          <el-option v-for="item in statusOptions" :key="item.value" v-bind="item" />
        </el-select>
        <el-button @click="applyFilters">筛选</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <AdminDataTable
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :data="batches"
        :loading="loading"
        :total="pagination.total"
        empty-text="暂无导入文件，请先导入符合 standard2 的 JSON 或 Markdown 文件"
        show-pagination
        @page-change="changePage"
        @page-size-change="changePageSize"
      >
        <el-table-column label="文件名" min-width="260" align="center" header-align="center">
          <template #default="{ row }">
            <el-tooltip :content="row.title" placement="top" :show-after="300">
              <span class="file-name">{{ row.title }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="题目数量" width="100" align="center" header-align="center">
          <template #default="{ row }">
            <div class="count-cell">
              <strong>{{ row.currentQuestionCount }} 题</strong>
              <span v-if="row.currentQuestionCount !== row.actualQuestionCount">
                导入时 {{ row.actualQuestionCount }} 题
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="考试类型" width="120" align="center" header-align="center">
          <template #default="{ row }">
            <div class="tag-list tag-list--center">
              <el-tag
                v-for="examType in row.examTypes"
                :key="examType"
                class="exam-type-tag"
                :class="examTypeClass(examType)"
                effect="light"
                round
              >
                {{ examType }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="科目 / 所属 Paper"
          min-width="400"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <el-tooltip
              :content="classificationTooltip(row)"
              placement="top"
              :disabled="classificationItems(row).length <= visibleClassificationCount"
              :show-after="300"
            >
              <div class="tag-list tag-list--center">
                <el-tag
                  v-for="item in visibleClassificationItems(row)"
                  :key="item.key"
                  class="classification-tag"
                  :class="subjectTagClass(item.code, item.label)"
                  effect="light"
                  round
                >
                  {{ item.displayLabel }}
                </el-tag>
                <el-tag
                  v-if="classificationItems(row).length > visibleClassificationCount"
                  class="more-tag"
                  effect="plain"
                  round
                >
                  +{{ classificationItems(row).length - visibleClassificationCount }}
                </el-tag>
                <span v-if="!classificationItems(row).length" class="empty-value">—</span>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="题目状态" min-width="230" align="center" header-align="center">
          <template #default="{ row }">
            <div class="status-summary">
              <span class="status-chip status-chip--draft">草稿 {{ row.statusCounts.draft }}</span>
              <span class="status-chip status-chip--published">
                已发布 {{ row.statusCounts.published }}
              </span>
              <span class="status-chip status-chip--archived">
                已归档 {{ row.statusCounts.archived }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="remarks"
          label="备注"
          min-width="220"
          align="center"
          header-align="center"
          show-overflow-tooltip
        >
          <template #default="{ row }">{{ row.remarks || '—' }}</template>
        </el-table-column>
        <el-table-column label="上传时间" width="170" align="center" header-align="center">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="260"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <div class="action-group">
              <button
                type="button"
                class="table-action table-action--danger"
                :disabled="Boolean(operatingBatchId)"
                @click="handleDeleteBatch(row)"
              >
                {{ actionLabel(row.id, 'delete', '删除') }}
              </button>
              <button
                type="button"
                class="table-action table-action--publish"
                :disabled="isStatusActionDisabled(row, 'published')"
                @click="handleBatchStatus(row, 'published')"
              >
                {{ actionLabel(row.id, 'published', '上线') }}
              </button>
              <button
                type="button"
                class="table-action table-action--archive"
                :disabled="isStatusActionDisabled(row, 'archived')"
                @click="handleBatchStatus(row, 'archived')"
              >
                {{ actionLabel(row.id, 'archived', '归档') }}
              </button>
              <router-link
                class="table-action"
                :to="{
                  name: 'admin-question-batch-detail',
                  params: { batchId: row.id },
                }"
              >
                查看
              </router-link>
            </div>
          </template>
        </el-table-column>
      </AdminDataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import {
  deleteQuestionBankImportBatch,
  getQuestionBankImportBatchList,
  updateQuestionBankImportBatchStatus,
  type QuestionBankImportBatch,
  type QuestionBankStatus,
} from '@/api/questionBank'

const router = useRouter()
const loading = ref(false)
const batches = ref<QuestionBankImportBatch[]>([])
const operatingBatchId = ref('')
const operatingAction = ref<'delete' | 'published' | 'archived' | ''>('')
const filters = reactive({ keyword: '', examType: '', status: '' })
const appliedFilters = reactive({ keyword: '', examType: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const statusOptions: Array<{ value: QuestionBankStatus; label: string }> = [
  { value: 'draft', label: '包含草稿题' },
  { value: 'published', label: '包含已发布题' },
  { value: 'archived', label: '包含已归档题' },
]
const visibleClassificationCount = 4

type BatchClassificationItem = {
  key: string
  code: string | null
  label: string
  displayLabel: string
}

// 考试类型标签沿用真题库 ESAT、TMUA 的稳定配色类。
function examTypeClass(examType: unknown): string {
  return `exam-type-tag--${String(examType || 'TMUA').toLowerCase()}`
}

// 科目 code 优先映射为真题库的模块颜色，缺失时再根据展示名判断。
function subjectTagClass(code: string | null, label: string): string {
  const normalizedCode = String(code || '').toLowerCase()
  const normalizedLabel = label.toLowerCase().replace(/[^a-z0-9]/g, '')
  const codeMap: Record<string, string> = {
    '110000': 'maths1',
    '120000': 'maths2',
    '130000': 'physics',
    '140000': 'chemistry',
    '150000': 'biology',
    '210000': 'maths1',
    '220000': 'maths2',
  }
  const type =
    codeMap[normalizedCode] ||
    ['maths1', 'maths2', 'physics', 'chemistry', 'biology', 'paper1', 'paper2'].find(
      (item) => normalizedCode === item || normalizedLabel.startsWith(item),
    ) ||
    'general'
  return `classification-tag--${type}`
}

// 科目名称沿用真题库的紧凑标签，避免中英文全名撑高表格行。
function subjectLabel(code: string, label: string): string {
  const type = subjectTagClass(code, label).replace('classification-tag--', '')
  const labels: Record<string, string> = {
    maths1: 'Math 1',
    maths2: 'Math 2',
    physics: 'Physics',
    chemistry: 'Chemistry',
    biology: 'Biology',
    paper1: 'Paper 1',
    paper2: 'Paper 2',
  }
  return labels[type] || label
}

// ESAT/STEP 使用科目，TMUA 使用 Paper；后端已按考试类型分别汇总两类数据。
function classificationItems(batch: QuestionBankImportBatch): BatchClassificationItem[] {
  return [
    ...batch.subjects.map((subject) => ({
      key: `subject-${subject.examType}-${subject.code}`,
      code: subject.code,
      label: subject.label,
      displayLabel: subjectLabel(subject.code, subject.label),
    })),
    ...batch.parts.map((part) => ({
      key: `part-${part.code}`,
      code: part.code,
      label: part.label,
      displayLabel: part.label,
    })),
  ]
}

// 合并列保持单行标签，超过可见数量的内容通过悬浮提示查看。
function visibleClassificationItems(batch: QuestionBankImportBatch): BatchClassificationItem[] {
  return classificationItems(batch).slice(0, visibleClassificationCount)
}

// 悬浮说明明确区分科目和 TMUA Paper，兼容同一文件包含多个考试类型。
function classificationTooltip(batch: QuestionBankImportBatch): string {
  const groups = [
    batch.subjects.length
      ? `科目：${batch.subjects.map((subject) => subject.label).join('、')}`
      : '',
    batch.parts.length ? `所属 Paper：${batch.parts.map((part) => part.label).join('、')}` : '',
  ].filter(Boolean)
  return groups.join('；') || '暂无科目或所属 Paper'
}

// 上传包筛选和分页都交给后端，列表只接收批次级摘要。
async function loadBatches(): Promise<void> {
  loading.value = true
  try {
    const data = await getQuestionBankImportBatchList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: appliedFilters.keyword || undefined,
      examType: appliedFilters.examType || undefined,
      status: appliedFilters.status || undefined,
    })
    batches.value = data.list
    Object.assign(pagination, data.pagination)
  } catch {
    batches.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 点击筛选时固化输入条件并从第一页查询上传包。
async function applyFilters(): Promise<void> {
  Object.assign(appliedFilters, filters)
  pagination.page = 1
  await loadBatches()
}

// 重置同时清空编辑中与已应用的筛选条件。
async function resetFilters(): Promise<void> {
  Object.assign(filters, { keyword: '', examType: '', status: '' })
  Object.assign(appliedFilters, filters)
  pagination.page = 1
  await loadBatches()
}

// 页码变化时保留已经应用的上传包筛选条件。
async function changePage(page: number): Promise<void> {
  pagination.page = page
  await loadBatches()
}

// 每页数量变化后回到第一页，避免页码越界。
async function changePageSize(pageSize: number): Promise<void> {
  pagination.pageSize = pageSize
  pagination.page = 1
  await loadBatches()
}

// 同一上传包已全部处于目标状态时禁用重复操作，空包也不能上线或归档。
function isStatusActionDisabled(
  batch: QuestionBankImportBatch,
  status: Extract<QuestionBankStatus, 'published' | 'archived'>,
): boolean {
  return (
    Boolean(operatingBatchId.value) ||
    batch.currentQuestionCount === 0 ||
    batch.statusCounts[status] === batch.currentQuestionCount
  )
}

// 批量操作执行期间在当前按钮上显示处理中状态，避免管理员重复提交。
function actionLabel(
  batchId: string,
  action: 'delete' | 'published' | 'archived',
  fallback: string,
): string {
  return operatingBatchId.value === batchId && operatingAction.value === action
    ? `${fallback}中`
    : fallback
}

// 整包上线或归档前明确学生端影响，成功后重新读取状态汇总。
async function handleBatchStatus(
  batch: QuestionBankImportBatch,
  status: Extract<QuestionBankStatus, 'published' | 'archived'>,
): Promise<void> {
  const isPublish = status === 'published'
  const actionName = isPublish ? '上线' : '归档'
  const impactMessage = isPublish
    ? `上线后，包内 ${batch.currentQuestionCount} 道题将进入学生端新练习的选题范围。`
    : '归档后，包内题目不再进入学生端新练习，但进行中作答、历史记录和错题本会继续保留。'
  try {
    await ElMessageBox.confirm(
      `${impactMessage}确认${actionName}试题包“${batch.title}”吗？`,
      `${actionName}试题包`,
      {
        type: 'warning',
        confirmButtonText: `确认${actionName}`,
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }

  operatingBatchId.value = batch.id
  operatingAction.value = status
  try {
    const result = await updateQuestionBankImportBatchStatus(batch.id, status)
    ElMessage.success(`试题包已${actionName}，共更新 ${result.updatedQuestions} 道题`)
    await loadBatches()
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    operatingBatchId.value = ''
    operatingAction.value = ''
  }
}

// 删除仅适用于没有学习历史的上传包，后端会再次检查答题和错题关联。
async function handleDeleteBatch(batch: QuestionBankImportBatch): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认删除试题包“${batch.title}”及其中 ${batch.currentQuestionCount} 道题吗？删除不可恢复；已有学生作答或错题记录时不能删除，只能归档。`,
      '删除试题包',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }

  operatingBatchId.value = batch.id
  operatingAction.value = 'delete'
  try {
    const result = await deleteQuestionBankImportBatch(batch.id)
    ElMessage.success(`试题包已删除，同时清理 ${result.deletedQuestions} 道题`)
    if (batches.value.length === 1 && pagination.page > 1) pagination.page -= 1
    await loadBatches()
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    operatingBatchId.value = ''
    operatingAction.value = ''
  }
}

// 上传时间统一按当前浏览器时区展示到分钟。
function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

onMounted(loadBatches)
</script>

<style scoped lang="scss">
.question-bank-page {
  --question-table-max-height: calc(100vh - var(--nav-height) - 220px);
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.page-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px 40px 10px;
}

.section-header,
.filter-bar,
.status-summary {
  display: flex;
  align-items: center;
}

.section-header {
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 6px;
  color: #0f172a;
  font-size: 1.5rem;
}

.section-desc {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.filter-bar {
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.search-input {
  width: 300px;
}

.filter-bar .el-select {
  width: 150px;
}

.count-cell {
  display: grid;
  gap: 4px;
}

.count-cell span {
  color: #64748b;
  font-size: 12px;
}

.file-name {
  display: block;
  max-width: 100%;
  overflow: hidden;
  color: var(--color-ink);
  font-weight: var(--weight-semi);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-list {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tag-list--center {
  justify-content: center;
}

.exam-type-tag,
.classification-tag {
  flex: 0 0 auto;
  border-radius: var(--radius-pill);
  font-weight: var(--weight-semi);
}

.exam-type-tag--esat,
.classification-tag--maths1 {
  background: #ecfeff !important;
  border-color: #a5f3fc !important;
  color: #0e7490 !important;
}

.exam-type-tag--tmua,
.classification-tag--maths2 {
  background: #f5f3ff !important;
  border-color: #ddd6fe !important;
  color: #6d28d9 !important;
}

.classification-tag--physics {
  background: #eff6ff !important;
  border-color: #bfdbfe !important;
  color: #1d4ed8 !important;
}

.classification-tag--chemistry {
  background: #fff7ed !important;
  border-color: #fed7aa !important;
  color: #c2410c !important;
}

.classification-tag--biology {
  background: #f0fdf4 !important;
  border-color: #bbf7d0 !important;
  color: #15803d !important;
}

.classification-tag--paper1 {
  background: #eef2ff !important;
  border-color: #c7d2fe !important;
  color: #4338ca !important;
}

.classification-tag--paper2 {
  background: #fdf4ff !important;
  border-color: #f0abfc !important;
  color: #a21caf !important;
}

.classification-tag--general,
.more-tag {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  color: #475569 !important;
}

.empty-value {
  color: #94a3b8;
}

.status-summary {
  flex-wrap: nowrap;
  justify-content: center;
  gap: 6px;
}

.status-chip {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
}

.status-chip--draft {
  background: #f1f5f9;
  color: #475569;
}

.status-chip--published {
  background: #dcfce7;
  color: #047857;
}

.status-chip--archived {
  background: #e5e7eb;
  color: #374151;
}

.action-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
}

.table-action {
  min-width: 44px;
  height: var(--height-button-sm);
  padding: 0 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-ink);
  font-weight: var(--weight-semi);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}

.table-action--danger {
  color: #dc2626;
}

.table-action--publish {
  color: #047857;
}

.table-action--archive {
  color: #475569;
}

.table-action:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.table-action:not(:disabled):hover,
.table-action:not(:disabled):focus-visible {
  background: var(--color-hover);
}
</style>
