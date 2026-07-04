<template>
  <div class="question-bank-page">
    <div class="page-body">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">试题库题目管理</h2>
          <p class="section-desc">管理 AI 生成题目及其内容，发布后进入学生端试题库练习范围。</p>
        </div>
        <el-button type="primary" @click="handleImport">导入题目</el-button>
      </div>

      <div class="filter-bar">
        <el-input
          v-model.trim="draftKeyword"
          class="search-input"
          clearable
          placeholder="搜索试卷名称..."
          @keyup.enter="handleSearch"
        />
        <div class="filter-tags">
          <button
            v-for="item in examTypeFilters"
            :key="item.value"
            type="button"
            class="filter-tag"
            :class="{ 'filter-tag--active': draftExamType === item.value }"
            @click="handleExamTypeChange(item.value)"
          >
            {{ item.label }}
          </button>
        </div>
        <el-button @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <div class="table-wrap">
        <el-table
          v-loading="loading"
          :data="paperList"
          class="admin-paper-table"
          stripe
          empty-text="暂无 AI 生成题目，请点击“导入题目”上传题目文件"
          max-height="var(--question-table-max-height)"
        >
          <el-table-column prop="title" label="题目名称" min-width="240" align="center" header-align="center" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="cell-name">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="考试类型" width="120" align="center" header-align="center">
            <template #default="{ row }">
              <el-tag class="exam-type-tag" effect="light" round>{{ row.examType || 'TMUA' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="学科/模块" width="140" align="center" header-align="center">
            <template #default="{ row }">
              <el-tag class="subject-tag" :class="`subject-tag--${subjectType(row.code)}`" effect="light" round>
                {{ subjectLabel(row.code) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="130" align="center" header-align="center">
            <template #default>
              <el-tag class="paper-type-tag" effect="light" round>AI 生成卷</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="year" label="年份" width="100" align="center" header-align="center" />
          <el-table-column label="题目数量" width="120" align="center" header-align="center">
            <template #default="{ row }">{{ row.totalQuestions }} 题</template>
          </el-table-column>
          <el-table-column label="状态" width="140" align="center" header-align="center">
            <template #default="{ row }">
              <el-dropdown trigger="click" @command="handleStatusCommand(row.id, $event)">
                <button class="status-btn" :class="`status-btn--${row.status}`" type="button">
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
          <el-table-column label="操作" width="140" fixed="right" align="center" header-align="center">
            <template #default="{ row }">
              <router-link :to="`/admin/core-library/questions/${row.id}`" class="table-action-link">
                管理内容
              </router-link>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrap">
        <AppPagination
          v-if="!loading"
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 试题库题目管理：按 AI 生成题目文件管理内容和发布状态。
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppPagination from '@/components/AppPagination.vue'
import { getPaperListData, updatePaperStatus, type PaperItem } from '@/api/papers'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import { PAPER_TYPE } from '@/constants/paperTypes'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const draftKeyword = ref('')
const appliedKeyword = ref('')
const draftExamType = ref('all')
const appliedExamType = ref('all')
const paperList = ref<PaperItem[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const examTypeFilters = computed(() => [
  { value: 'all', label: '全部' },
  ...EXAM_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
])

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'review', label: '审核中' },
  { value: 'published', label: '已上线' },
  { value: 'archived', label: '已归档' },
]

watch(
  () => route.path,
  (path) => {
    if (path === '/admin/core-library/questions') void fetchPapers()
  },
  { immediate: true },
)

// 试题库管理只展示 AI 生成卷来源，和学生端试题库的数据来源保持一致。
async function fetchPapers(): Promise<void> {
  loading.value = true
  try {
    const data = await getPaperListData({
      page: pagination.page,
      pageSize: pagination.pageSize,
      paperType: PAPER_TYPE.AI_PAPER,
      keyword: appliedKeyword.value,
      examType: appliedExamType.value === 'all' ? undefined : appliedExamType.value,
    })
    paperList.value = data.list || []
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
  } catch {
    paperList.value = []
    pagination.total = 0
    ElMessage.error('试题库题目加载失败')
  } finally {
    loading.value = false
  }
}

// 搜索时应用草稿条件并回到第一页，避免只筛当前页数据。
async function handleSearch(): Promise<void> {
  appliedKeyword.value = draftKeyword.value
  appliedExamType.value = draftExamType.value
  pagination.page = 1
  await fetchPapers()
}

// 重置保留当前 pageSize，清空筛选条件后回到第一页。
async function handleReset(): Promise<void> {
  draftKeyword.value = ''
  appliedKeyword.value = ''
  draftExamType.value = 'all'
  appliedExamType.value = 'all'
  pagination.page = 1
  await fetchPapers()
}

// 考试类型标签是高频筛选项，点击后立即应用并重置页码。
async function handleExamTypeChange(examType: string): Promise<void> {
  draftExamType.value = examType
  appliedExamType.value = examType
  pagination.page = 1
  await fetchPapers()
}

// 试题库分页切换时只更新分页条件，并重新读取当前页数据。
async function handlePageChange(page: number): Promise<void> {
  pagination.page = page
  await fetchPapers()
}

// 修改每页数量后回到第一页，避免请求到不存在的页码。
async function handlePageSizeChange(pageSize: number): Promise<void> {
  pagination.pageSize = pageSize
  pagination.page = 1
  await fetchPapers()
}

// 后台列表用试卷 code 推断学科展示名，空 code 展示为通用。
function subjectLabel(code: string | null): string {
  return code || '通用'
}

// 学科类型只影响标签颜色，不参与业务筛选。
function subjectType(code: string | null): string {
  if (!code) return 'general'
  const text = code.toLowerCase()
  if (text.includes('math')) return 'math'
  if (text.includes('step') || text.includes('esat')) return 'advanced'
  if (text.includes('physics') || text.includes('pat')) return 'physics'
  return 'general'
}

// 状态值来自后端枚举，前端统一转为中文展示。
function statusLabel(status: string): string {
  return (
    { draft: '草稿', review: '审核中', published: '已上线', archived: '已归档' }[status] || status
  )
}

// 发布成功后，该批次题目进入学生端试题库练习范围。
async function changeStatus(id: string, newStatus: string): Promise<void> {
  try {
    await updatePaperStatus(id, newStatus)
    const item = paperList.value.find((paper) => paper.id === id)
    if (item) item.status = newStatus
  } catch {
    ElMessage.error('题目状态更新失败')
  }
}

function handleStatusCommand(id: string, command: unknown): void {
  void changeStatus(id, String(command))
}

// 导入入口复用标准 JSON / Markdown 上传流程，文件内 paperType 决定进入哪个管理列表。
function handleImport(): void {
  router.push({ path: '/admin/core-library/exams/upload', query: { source: 'questions' } })
}
</script>

<style scoped lang="scss">
.question-bank-page {
  --question-table-max-height: calc(100vh - var(--nav-height) - 226px);

  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 40px 10px;
  overflow: hidden;
}

.section-header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.header-text {
  max-width: 620px;
}

.section-title {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0;
}

.section-desc {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

.filter-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.search-input {
  width: 280px;
  flex: 0 0 280px;
}

.filter-tags {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.filter-tag {
  height: var(--height-button-sm);
  padding: 0 14px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: #64748b;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background var(--duration-base) ease,
    border-color var(--duration-base) ease,
    color var(--duration-base) ease;
}

.filter-tag:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
}

.filter-tag--active {
  border-color: var(--color-ink);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}

.table-wrap {
  flex: 0 1 auto;
  min-height: 0;
  max-height: var(--question-table-max-height);
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.pagination-wrap {
  position: sticky;
  bottom: 0;
  z-index: 10;
  flex-shrink: 0;
  margin-top: 10px;
  padding: 0;
  background: #f8fafc;
}

.pagination-wrap:empty {
  display: none;
}

.pagination-wrap :deep(.app-pagination) {
  padding: 0;
  border-top: 0;
  background: transparent;
}

:deep(.admin-paper-table) {
  --el-table-border-color: var(--color-line-soft);
  --el-table-header-bg-color: #f0f3ff;
  --el-table-row-hover-bg-color: var(--color-hover);

  width: 100%;
  font-size: var(--text-sm);
}

:deep(.admin-paper-table .el-table__cell) {
  padding: 12px 16px;
}

:deep(.admin-paper-table th.el-table__cell) {
  color: #334155;
  font-weight: var(--weight-semi);
  background: #f0f3ff;
}

:deep(.admin-paper-table .el-table__header-wrapper th.el-table__cell),
:deep(.admin-paper-table .el-table__fixed-right th.el-table__cell) {
  background: #f0f3ff;
}

:deep(.admin-paper-table th .cell),
:deep(.admin-paper-table .el-table__fixed-right .cell) {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}

:deep(.admin-paper-table .el-table__row) {
  height: var(--height-table-row);
}

.cell-name {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.exam-type-tag,
.subject-tag,
.paper-type-tag {
  border-radius: var(--radius-pill);
  font-weight: var(--weight-semi);
}

.exam-type-tag {
  background: #ecfeff !important;
  border-color: #a5f3fc !important;
  color: #0e7490 !important;
}

.paper-type-tag {
  background: #f5f3ff !important;
  border-color: #ddd6fe !important;
  color: #5b21b6 !important;
}

.subject-tag--general {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  color: #475569 !important;
}

.subject-tag--math {
  background: #ecfdf5 !important;
  border-color: #a7f3d0 !important;
  color: #047857 !important;
}

.subject-tag--advanced {
  background: #eef2ff !important;
  border-color: #c7d2fe !important;
  color: #3730a3 !important;
}

.subject-tag--physics {
  background: #eff6ff !important;
  border-color: #bfdbfe !important;
  color: #1d4ed8 !important;
}

.status-btn,
.table-action-link {
  min-width: 72px;
  height: var(--height-button-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

.status-btn {
  border: 1px solid transparent;
}

.status-btn--published {
  background: #dcfce7;
  color: #047857;
}

.status-btn--draft {
  background: #f1f5f9;
  color: #475569;
}

.status-btn--review {
  background: #fef3c7;
  color: #b45309;
}

.status-btn--archived {
  background: #e5e7eb;
  color: #374151;
}

.table-action-link {
  color: var(--color-ink);
  text-decoration: none;
  transition:
    background var(--duration-base) ease,
    border-color var(--duration-base) ease,
    color var(--duration-base) ease;
}

.table-action-link:hover,
.table-action-link:focus-visible {
  background: var(--color-hover);
  color: var(--color-ink);
}
</style>
