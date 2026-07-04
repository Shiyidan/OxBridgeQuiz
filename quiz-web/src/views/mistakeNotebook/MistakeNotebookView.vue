<template>
  <div class="mistake-notebook-page">
    <NavBar />
    <main class="mistake-notebook-main">

      <header class="mistake-notebook-header">
        <h1>错题本（Mistakes Collector）</h1>
        <p>智能收录错题，精准定位薄弱点，让复习事半功倍</p>
      </header>

      <section class="notebook-section">
        <div class="section-divider"></div>

        <div class="filter-bar" aria-label="错题筛选">
          <label class="filter-field">
            <span class="filter-field__label">题目难度</span>
            <el-select
              v-model="draftFilters.difficulties"
              multiple
              collapse-tags
              collapse-tags-tooltip
              clearable
              placeholder="请选择"
            >
              <el-option
                v-for="option in difficultyOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </label>

          <label class="filter-field">
            <span class="filter-field__label">题目来源</span>
            <el-select
              v-model="draftFilters.sources"
              multiple
              collapse-tags
              collapse-tags-tooltip
              clearable
              placeholder="请选择"
            >
              <el-option
                v-for="option in sourceOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </label>

          <label class="filter-field">
            <span class="filter-field__label">知识点</span>
            <el-tree-select
              v-model="draftFilters.knowledgeCodes"
              :data="syllabusTreeData"
              :props="treeProps"
              node-key="code"
              multiple
              show-checkbox
              check-strictly
              collapse-tags
              collapse-tags-tooltip
              clearable
              filterable
              placeholder="请选择"
            />
          </label>

          <label class="filter-field filter-field--range">
            <span class="filter-field__label">提交时间</span>
            <el-date-picker
              v-model="draftFilters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              clearable
            />
          </label>

          <div class="filter-actions">
            <button type="button" class="filter-button button_primary" @click="applyFilters">搜索</button>
            <button type="button" class="filter-button button_cancel" @click="resetFilters">
              重置
            </button>
          </div>
        </div>

        <div v-if="wrongLoading" class="section-card section-card--empty">
          <p class="loading-text">加载中...</p>
        </div>

        <div v-else-if="wrongList.length === 0" class="section-card section-card--empty">
          <div class="empty-icon">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect
                x="12"
                y="8"
                width="40"
                height="50"
                rx="4"
                stroke="#cbd5e1"
                stroke-width="2"
              />
              <line
                x1="22"
                y1="22"
                x2="42"
                y2="22"
                stroke="#e2e8f0"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="22"
                y1="30"
                x2="38"
                y2="30"
                stroke="#e2e8f0"
                stroke-width="2"
                stroke-linecap="round"
              />
              <circle
                cx="46"
                cy="48"
                r="12"
                fill="#f1f5f9"
                stroke="#e2e8f0"
                stroke-width="2"
              />
              <path
                d="M43 48h6M46 45v6"
                stroke="#94a3b8"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h3>{{ hasActiveQuery ? '暂无匹配错题' : '暂无错题' }}</h3>
          <p class="empty-desc">
            {{ hasActiveQuery ? '调整筛选条件后再试试。' : '你还没有做错的题目，继续保持。' }}
          </p>
        </div>

        <div v-else class="wrong-list">
          <article v-for="item in wrongList" :key="item.id" class="wrong-item">
            <div class="wrong-item__body">
              <div class="wrong-item__meta">
                <span>{{ formatDate(item.examRecord?.submittedAt) }}</span>
                <span>{{ formatTime(item.examRecord?.submittedAt) }}</span>
                <span>{{ formatDuration(item.durationSeconds) }}</span>
                <span class="difficulty-tag">{{ difficultyText(item) }}</span>
                <span class="source-tag">{{ sourceText(item) }}</span>
                <span class="history-tag">错 {{ item.wrongCount }} 次</span>
                <span v-if="selectedAnswersText(item)" class="history-tag">
                  曾选 {{ selectedAnswersText(item) }}
                </span>
              </div>
              <h2 class="wrong-item__title">
                <LatexText :text="questionTitle(item)" />
              </h2>
            </div>

            <router-link
              v-if="item.examRecord?.id"
              :to="analysisLink(item)"
              class="wrong-item__action button_cancel"
              aria-label="查看试题解析"
            >
              查看解析
            </router-link>
            <button v-else class="wrong-item__action wrong-item__action--disabled" type="button">
              查看解析
            </button>
          </article>
        </div>

        <AppPagination
          v-if="!wrongLoading"
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// 错题本页面：展示当前用户做错的题目，并支持按难度、来源和大纲知识点筛选。
import { computed, onMounted, reactive, ref } from 'vue'
import NavBar from '@/components/NavBar.vue'
import LatexText from '@/components/LatexText.vue'
import AppPagination from '@/components/AppPagination.vue'
import { getMistakeNotebookData, type WrongAnswer } from '@/api/exam'
import { getSyllabusData, type SyllabusNode } from '@/api/questionBank'
import { PAPER_TYPE_OPTIONS, normalizePaperType, paperTypeSourceLabel } from '@/constants/paperTypes'

interface FilterOption {
  label: string
  value: string
}

interface FilterState {
  difficulties: string[]
  sources: string[]
  knowledgeCodes: string[]
  dateRange: string[] | null
}

const difficultyLabelMap: Record<string, string> = {
  easy: '难度-低',
  medium: '难度-中',
  hard: '难度-高',
  composite: '难度-复合',
}
const treeProps = { children: 'children', label: 'label', value: 'code' }
const wrongList = ref<WrongAnswer[]>([])
const syllabusTreeData = ref<SyllabusNode[]>([])
const wrongLoading = ref(true)
const hasActiveQuery = ref(false)
const draftFilters = reactive<FilterState>({
  difficulties: [],
  sources: [],
  knowledgeCodes: [],
  dateRange: [],
})
const appliedFilters = reactive<FilterState>({
  difficulties: [],
  sources: [],
  knowledgeCodes: [],
  dateRange: [],
})
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
})

const difficultyOptions = computed<FilterOption[]>(() =>
  Object.entries(difficultyLabelMap).map(([value, label]) => ({ value, label })),
)
const sourceOptions = computed<FilterOption[]>(() =>
  PAPER_TYPE_OPTIONS.map((item) => ({ value: item.value, label: paperTypeSourceLabel(item.value) })),
)

// 进入页面后同时加载错题记录和试题库同源大纲树。
onMounted(async () => {
  wrongLoading.value = true
  try {
    const results = await Promise.allSettled([loadWrongAnswers(), getSyllabusData()])
    const syllabusResult = results[1]
    if (syllabusResult.status === 'fulfilled') syllabusTreeData.value = syllabusResult.value
  } finally {
    wrongLoading.value = false
  }
})

// 按已应用筛选条件和分页参数向后端请求错题摘要列表。
async function loadWrongAnswers(): Promise<void> {
  const result = await getMistakeNotebookData({
    page: pagination.page,
    pageSize: pagination.pageSize,
    difficulties: appliedFilters.difficulties,
    paperTypes: appliedFilters.sources,
    syllabusCodes: appliedFilters.knowledgeCodes,
    startDate: appliedFilters.dateRange?.[0],
    endDate: appliedFilters.dateRange?.[1],
  })
  wrongList.value = result.list || []
  pagination.page = result.pagination.page
  pagination.pageSize = result.pagination.pageSize
  pagination.total = result.pagination.total
  pagination.totalPages = result.pagination.totalPages
}

// 点击搜索时将草稿筛选条件提交为已应用条件，并从第一页重新查询。
async function applyFilters(): Promise<void> {
  copyFilters(draftFilters, appliedFilters)
  pagination.page = 1
  wrongLoading.value = true
  hasActiveQuery.value =
    appliedFilters.difficulties.length > 0 ||
    appliedFilters.sources.length > 0 ||
    appliedFilters.knowledgeCodes.length > 0 ||
    (Array.isArray(appliedFilters.dateRange) && appliedFilters.dateRange.length === 2)
  try {
    await loadWrongAnswers()
  } finally {
    wrongLoading.value = false
  }
}

// 重置筛选条件后重新拉取未过滤的错题列表。
async function resetFilters(): Promise<void> {
  clearFilters(draftFilters)
  clearFilters(appliedFilters)
  pagination.page = 1
  hasActiveQuery.value = false
  wrongLoading.value = true
  try {
    await loadWrongAnswers()
  } finally {
    wrongLoading.value = false
  }
}

// 分页切换使用已应用筛选条件，避免未点击搜索的草稿条件影响当前列表。
async function handlePageChange(page: number): Promise<void> {
  pagination.page = page
  wrongLoading.value = true
  try {
    await loadWrongAnswers()
  } finally {
    wrongLoading.value = false
  }
}

// 切换每页数量时保留已应用筛选条件，并回到第一页。
async function handlePageSizeChange(pageSize: number): Promise<void> {
  pagination.pageSize = pageSize
  pagination.page = 1
  wrongLoading.value = true
  try {
    await loadWrongAnswers()
  } finally {
    wrongLoading.value = false
  }
}

// 搜索按钮是草稿条件生效的唯一入口，分页只读取已应用条件。
function copyFilters(source: FilterState, target: FilterState): void {
  target.difficulties = [...source.difficulties]
  target.sources = [...source.sources]
  target.knowledgeCodes = [...source.knowledgeCodes]
  target.dateRange = source.dateRange ? [...source.dateRange] : []
}

// 重置时同时清空草稿条件和已应用条件。
function clearFilters(filters: FilterState): void {
  filters.difficulties = []
  filters.sources = []
  filters.knowledgeCodes = []
  filters.dateRange = []
}

// 跳转到答题报告，并通过 questionId 定位到具体错题解析。
function analysisLink(item: WrongAnswer) {
  return {
    path: `/exam-result/${item.examRecord?.id}`,
    query: { questionId: item.questionId },
  }
}

// 错题卡片优先展示 Question.title，缺失时回退到题目 ID。
function questionTitle(item: WrongAnswer): string {
  return item.title || `题目 ${item.questionId}`
}

// difficulty 已在后端统一为 easy/medium/hard/composite 字符串。
function difficultyText(item: WrongAnswer): string {
  return difficultyLabelMap[difficultyValue(item)] || '难度-未标注'
}

// 难度筛选值统一取固定枚举字符串，缺失题目不进入难度筛选项。
function difficultyValue(item: WrongAnswer): string {
  return item.difficulty || ''
}

// 题目来源筛选值对应规范化后的 Paper.paperType。
function sourceValue(item: WrongAnswer): string {
  return normalizePaperType(item.examRecord?.paper?.paperType)
}

// 题目来源展示沿用 paperType 来源定义。
function sourceText(item: WrongAnswer): string {
  return paperTypeSourceLabel(sourceValue(item))
}

// 聚合错题展示历史错误答案，保留用户曾经选错过的选项。
function selectedAnswersText(item: WrongAnswer): string {
  if (item.selectedAnswers?.length) return item.selectedAnswers.join('、')
  return item.selectedAnswer || ''
}

// 错题本按整次答题提交时间确认最近一次错误，避免逐题时间口径混乱。
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

// 提交时间精确到时分，缺失时展示占位符。
function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '--:--'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '--:--'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 单题耗时是独立统计字段，不参与错题本最近错误时间排序。
function formatDuration(seconds?: number | null): string {
  if (!seconds) return '用时 -'
  if (seconds < 60) return `用时 ${seconds} 秒`
  return `用时 ${Math.max(1, Math.round(seconds / 60))} 分钟`
}

</script>

<style scoped lang="scss">
.mistake-notebook-page {
  min-height: 100vh;
  background: #fbfbfa;
  color: #273437;
}

.mistake-notebook-main {
  width: min(100%, 920px);
  margin: 0 auto;
  padding: 34px 24px 20px;
}

.back-link {
  color: #9aa6a9;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
}

.mistake-notebook-header {
  margin: 12px 0 20px;

  h1 {
    margin: 0 0 22px;
    color: #273437;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: #7d8a8e;
    font-size: 15px;
    font-weight: 700;
  }
}

.notebook-section {
  min-width: 0;
}

.section-divider {
  height: 1px;
  margin-bottom: 20px;
  background: #e5e8e8;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 18px;
  align-items: end;
  margin-bottom: 18px;
}

.filter-field {
  display: grid;
  grid-column: span 4;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.filter-field--range {
  grid-column: span 6;
}

.filter-field__label {
  color: #273437;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.filter-field :deep(.el-select),
.filter-field :deep(.el-tree-select),
.filter-field :deep(.el-date-editor) {
  width: 100%;
}

.filter-field :deep(.el-select__wrapper),
.filter-field :deep(.el-input__wrapper) {
  min-height: 32px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #cfd8dc inset;
}

.filter-actions {
  display: flex;
  grid-column: span 6;
  gap: 8px;
  align-items: center;
}

.filter-button {
  min-width: 64px;
  height: 32px;
  padding: 0 14px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 800;
}

.section-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
}

.section-card--empty {
  display: grid;
  place-items: center;
  min-height: 240px;
  text-align: center;

  h3 {
    margin: 12px 0 8px;
    color: #475569;
    font-size: 18px;
    font-weight: 700;
  }
}

.loading-text,
.empty-desc {
  margin: 0;
  color: #94a3b8;
}

.empty-icon {
  svg {
    width: 80px;
    height: 80px;
  }
}

.wrong-list {
  display: grid;
  gap: 10px;
}

.wrong-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  border: 1px solid #e4e8e8;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
}

.wrong-item__body {
  min-width: 0;
}

.wrong-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
  color: #2f6f9b;
  font-size: 12px;
  font-weight: 800;
}

.difficulty-tag,
.source-tag,
.history-tag {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 2px 10px;
  border-radius: 4px;
  background: #d8ebf8;
  color: #2d668e;
}

.source-tag {
  background: #eef6f2;
  color: #36745a;
}

.history-tag {
  background: #f6f3e9;
  color: #7a6840;
}

.wrong-item__title {
  margin: 0;
  color: #263437;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.wrong-item__action {
  min-width: 72px;
  height: 32px;
  display: inline-grid;
  place-items: center;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 900;
}

.wrong-item__action--disabled {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

@media (max-width: 780px) {
  .filter-bar {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .filter-actions {
    grid-column: auto;
    justify-content: flex-end;
  }

  .filter-field,
  .filter-field--range {
    grid-column: auto;
  }
}

@media (max-width: 640px) {
  .mistake-notebook-main {
    padding: 26px 16px 20px;
  }

  .mistake-notebook-header {
    margin-bottom: 32px;

    h1 {
      font-size: 24px;
      line-height: 1.35;
    }
  }

  .wrong-item {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }

  .wrong-item__action {
    justify-self: end;
  }

}
</style>
