<!-- 后台试题库入口：按每次上传文件展示导入包，再进入包内管理独立题目。 -->
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
        max-height="var(--question-table-max-height)"
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
          label="科目 / 所属 Part"
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
          width="150"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <router-link
              class="detail-link"
              :to="{
                name: 'admin-question-batch-detail',
                params: { batchId: row.id },
              }"
            >
              查看题目
            </router-link>
          </template>
        </el-table-column>
      </AdminDataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import {
  getQuestionBankImportBatchList,
  type QuestionBankImportBatch,
  type QuestionBankStatus,
} from '@/api/questionBank'

const router = useRouter()
const loading = ref(false)
const batches = ref<QuestionBankImportBatch[]>([])
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

// ESAT/STEP 使用科目，TMUA 使用 Part；后端已按考试类型分别汇总两类数据。
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

// 悬浮说明明确区分科目和 TMUA Part，兼容同一文件包含多个考试类型。
function classificationTooltip(batch: QuestionBankImportBatch): string {
  const groups = [
    batch.subjects.length
      ? `科目：${batch.subjects.map((subject) => subject.label).join('、')}`
      : '',
    batch.parts.length ? `所属 Part：${batch.parts.map((part) => part.label).join('、')}` : '',
  ].filter(Boolean)
  return groups.join('；') || '暂无科目或所属 Part'
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

.detail-link {
  min-width: 88px;
  height: var(--height-button-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--color-ink);
  font-weight: var(--weight-semi);
  text-decoration: none;
  white-space: nowrap;
}

.detail-link:hover,
.detail-link:focus-visible {
  background: var(--color-hover);
}
</style>
