<!-- 后台试题库上传包详情：展示一次文件导入的元数据，并分页管理包内独立题目。 -->
<template>
  <div class="batch-detail-page">
    <header class="detail-header">
      <div>
        <button
          type="button"
          class="back-link"
          @click="router.push('/admin/core-library/questions')"
        >
          ← 返回文件列表
        </button>
        <el-tooltip :content="batch?.title || '文件详情'" placement="top">
          <h2>{{ batch?.title || '文件详情' }}</h2>
        </el-tooltip>
        <p>试题库文件详情</p>
      </div>
    </header>

    <section v-loading="batchLoading" class="package-card">
      <template v-if="batch">
        <div class="package-meta">
          <div>
            <span>当前题量</span><strong>{{ batch.currentQuestionCount }} 题</strong>
          </div>
          <div>
            <span>导入题量</span><strong>{{ batch.actualQuestionCount }} 题</strong>
          </div>
          <div>
            <span>考试类型</span><strong>{{ batch.examTypes.join('、') || '—' }}</strong>
          </div>
          <div>
            <span>科目 / 所属 Part</span>
            <strong>{{ batchClassificationLabel }}</strong>
          </div>
          <div>
            <span>上传时间</span><strong>{{ formatDate(batch.createdAt) }}</strong>
          </div>
          <div class="package-status-meta">
            <span>题目状态</span>
            <div class="package-status">
              <span class="status-chip status-chip--draft"
                >草稿 {{ batch.statusCounts.draft }}</span
              >
              <span class="status-chip status-chip--published">
                已发布 {{ batch.statusCounts.published }}
              </span>
              <span class="status-chip status-chip--archived">
                已归档 {{ batch.statusCounts.archived }}
              </span>
            </div>
          </div>
        </div>
        <div class="package-footer">
          <el-tooltip :content="batch.remarks || '暂无上传备注'" placement="top">
            <p class="remarks">{{ batch.remarks || '暂无上传备注' }}</p>
          </el-tooltip>
        </div>
      </template>
    </section>

    <section class="question-section">
      <div class="section-title-row">
        <div>
          <h3>文件内题目</h3>
          <p>导入文件仅用于归类和追溯，题目仍可独立审核、发布、归档和组卷。</p>
        </div>
      </div>

      <div class="filter-bar">
        <el-input
          v-model.trim="filters.keyword"
          class="search-input"
          clearable
          placeholder="题目 code、题干、学科或主题"
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
        <el-select v-model="filters.difficulty" clearable placeholder="难度">
          <el-option v-for="item in difficultyOptions" :key="item.value" v-bind="item" />
        </el-select>
        <el-select v-model="filters.status" clearable placeholder="状态">
          <el-option v-for="item in statusOptions" :key="item.value" v-bind="item" />
        </el-select>
        <el-button @click="applyFilters">筛选</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <AdminDataTable
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :data="questions"
        :loading="questionsLoading"
        :total="pagination.total"
        empty-text="该文件内暂无符合条件的题目"
        auto-height
        show-pagination
        @page-change="changePage"
        @page-size-change="changePageSize"
      >
        <el-table-column prop="code" label="题目 code" min-width="190" show-overflow-tooltip />
        <el-table-column prop="title" label="题干" min-width="300" show-overflow-tooltip />
        <el-table-column prop="examType" label="考试" width="90" align="center" />
        <el-table-column label="分类" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="classification-cell">
              <strong>{{ row.subject || '—' }}</strong>
              <span>{{ row.topic || '—' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="知识点" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ knowledgePointLabels(row.knowledgePoints) }}</template>
        </el-table-column>
        <el-table-column label="难度" width="100" align="center">
          <template #default="{ row }">{{ difficultyLabel(row.difficulty) }}</template>
        </el-table-column>
        <el-table-column label="质量" width="100" align="center">
          <template #default="{ row }">{{ qualityTierLabel(row.qualityTier) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="changeStatus(row, $event)">
              <button type="button" class="status-btn" :class="`status-btn--${row.status}`">
                {{ statusLabel(row.status) }}
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="item in statusOptions"
                    :key="item.value"
                    :command="item.value"
                  >
                    {{ item.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-group">
              <router-link
                :to="{
                  name: 'admin-questions-detail',
                  params: { id: row.id },
                  query: { batchId },
                }"
              >
                预览
              </router-link>
              <button type="button" :disabled="deletingId === row.id" @click="deleteQuestion(row)">
                {{ deletingId === row.id ? '删除中' : '删除' }}
              </button>
            </div>
          </template>
        </el-table-column>
      </AdminDataTable>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import {
  deleteQuestionBankQuestion,
  getQuestionBankImportBatchDetail,
  getQuestionBankImportBatchQuestions,
  updateQuestionBankStatus,
  type QuestionBankAdminItem,
  type QuestionBankImportBatch,
  type QuestionBankQualityTier,
  type QuestionBankStatus,
} from '@/api/questionBank'
import type { KnowledgePoint } from '@/types'

const route = useRoute()
const router = useRouter()
const batchId = String(route.params.batchId)
const batchLoading = ref(false)
const questionsLoading = ref(false)
const deletingId = ref('')
const batch = ref<QuestionBankImportBatch | null>(null)
const questions = ref<QuestionBankAdminItem[]>([])
const filters = reactive({ keyword: '', examType: '', difficulty: '', status: '' })
const appliedFilters = reactive({ keyword: '', examType: '', difficulty: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const difficultyOptions = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
  { value: 'composite', label: '复合' },
]
const statusOptions: Array<{ value: QuestionBankStatus; label: string }> = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'archived', label: '已归档' },
]

// ESAT/STEP 显示科目，TMUA 显示 Part；混合文件按两类内容依次汇总。
const batchClassificationLabel = computed(() => {
  if (!batch.value) return '—'
  return (
    [
      ...batch.value.subjects.map((subject) => subject.label),
      ...batch.value.parts.map((part) => part.label),
    ].join('、') || '—'
  )
})

// 上传包卡片单独读取实时题量和状态汇总。
async function loadBatch(): Promise<void> {
  batchLoading.value = true
  try {
    batch.value = await getQuestionBankImportBatchDetail(batchId)
  } catch {
    batch.value = null
  } finally {
    batchLoading.value = false
  }
}

// 包内题目只按当前上传包 id 查询，避免退回全库单题列表。
async function loadQuestions(): Promise<void> {
  questionsLoading.value = true
  try {
    const data = await getQuestionBankImportBatchQuestions(batchId, {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: appliedFilters.keyword || undefined,
      examType: appliedFilters.examType || undefined,
      difficulty: appliedFilters.difficulty || undefined,
      status: appliedFilters.status || undefined,
    })
    questions.value = data.list
    Object.assign(pagination, data.pagination)
  } catch {
    questions.value = []
    pagination.total = 0
  } finally {
    questionsLoading.value = false
  }
}

// 点击筛选后固定包内题目条件并回到第一页。
async function applyFilters(): Promise<void> {
  Object.assign(appliedFilters, filters)
  pagination.page = 1
  await loadQuestions()
}

// 清空包内题目的全部筛选条件并重新查询。
async function resetFilters(): Promise<void> {
  Object.assign(filters, { keyword: '', examType: '', difficulty: '', status: '' })
  Object.assign(appliedFilters, filters)
  pagination.page = 1
  await loadQuestions()
}

// 页码变化时沿用已经应用的包内筛选条件。
async function changePage(page: number): Promise<void> {
  pagination.page = page
  await loadQuestions()
}

// 每页数量变化后回到第一页，避免页码越界。
async function changePageSize(pageSize: number): Promise<void> {
  pagination.pageSize = pageSize
  pagination.page = 1
  await loadQuestions()
}

// 知识点快照用于表格摘要，实际筛选仍由数据库关联表负责。
function knowledgePointLabels(points: KnowledgePoint[] | unknown): string {
  return Array.isArray(points)
    ? points
        .map((point) => String(point?.label || point?.code || ''))
        .filter(Boolean)
        .join('、') || '—'
    : '—'
}

// 难度编码在上传包详情中统一转换为中文标签。
function difficultyLabel(value: string): string {
  return difficultyOptions.find((item) => item.value === value)?.label || value || '—'
}

// 生成质量等级仅在包内题目列表转换为中文，不参与筛选和其他页面展示。
function qualityTierLabel(value: QuestionBankQualityTier | null): string {
  if (value === 'excellent') return '优秀'
  if (value === 'qualified') return '标准'
  return '—'
}

// 单题状态下拉和上传包统计共用稳定状态编码。
function statusLabel(value: QuestionBankStatus): string {
  return statusOptions.find((item) => item.value === value)?.label || value
}

// 单题状态变更后同步刷新上传包汇总，包本身不拥有独立发布状态。
async function changeStatus(row: QuestionBankAdminItem, command: unknown): Promise<void> {
  const status = String(command) as QuestionBankStatus
  if (status === row.status) return
  try {
    await updateQuestionBankStatus(row.id, status)
    row.status = status
    await loadBatch()
    ElMessage.success(`题目已设为${statusLabel(status)}`)
  } catch {
    // 公共请求层展示后端错误。
  }
}

// 删除仍遵循单题历史记录保护，成功后同时刷新上传包题量和当前页。
async function deleteQuestion(row: QuestionBankAdminItem): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认从该导入文件删除题目 ${row.code} 吗？已有答题记录的题目不能删除。`,
      '删除题目',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  deletingId.value = row.id
  try {
    await deleteQuestionBankQuestion(row.id)
    ElMessage.success('题目已删除')
    if (questions.value.length === 1 && pagination.page > 1) pagination.page -= 1
    await Promise.all([loadBatch(), loadQuestions()])
  } catch {
    // 公共请求层展示后端错误。
  } finally {
    deletingId.value = ''
  }
}

// 上传时间按管理员当前浏览器时区显示到分钟。
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

onMounted(() => Promise.all([loadBatch(), loadQuestions()]))
</script>

<style scoped lang="scss">
.batch-detail-page {
  min-height: 100%;
  padding: 24px 40px 40px;
}

.detail-header,
.package-footer,
.package-status,
.filter-bar,
.action-group {
  display: flex;
  align-items: center;
}

.detail-header {
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}

.detail-header > div {
  min-width: 0;
}

.back-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.detail-header h2 {
  max-width: min(720px, 70vw);
  margin: 12px 0 5px;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-header p,
.section-title-row p,
.remarks {
  margin: 0;
  color: #64748b;
}

.package-card {
  min-height: 0;
  margin-bottom: 14px;
  padding: 14px 18px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.package-meta {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.package-meta > div {
  display: grid;
  gap: 2px;
}

.package-meta span {
  color: #64748b;
  font-size: 12px;
}

.package-meta strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.package-footer {
  min-width: 0;
  gap: 16px;
  margin-top: 10px;
}

.package-status {
  flex: 0 0 auto;
  flex-wrap: nowrap;
  gap: 8px;
}

.status-chip {
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 12px;
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

.remarks {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.question-section {
  min-height: 0;
}

.section-title-row {
  margin-bottom: 12px;
}

.section-title-row h3 {
  margin: 0 0 5px;
}

.section-title-row p {
  font-size: 13px;
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
  width: 130px;
}

.classification-cell {
  display: grid;
  gap: 3px;
}

.classification-cell span {
  color: #64748b;
  font-size: 12px;
}

.status-btn {
  min-width: 74px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.status-btn--draft {
  background: #f1f5f9;
  color: #475569;
}

.status-btn--published {
  background: #dcfce7;
  color: #047857;
}

.status-btn--archived {
  background: #e5e7eb;
  color: #374151;
}

.action-group {
  justify-content: center;
  gap: 12px;
}

.action-group a,
.action-group button {
  border: 0;
  background: transparent;
  color: #111827;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.action-group button {
  color: #dc2626;
}

.action-group button:disabled {
  color: #94a3b8;
}

@media (max-width: 900px) {
  .batch-detail-page {
    padding-inline: 20px;
  }

  .package-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
