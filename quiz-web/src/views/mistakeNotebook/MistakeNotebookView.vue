<template>
  <div class="mistake-notebook-page">
    <NavBar />
    <main class="mistake-notebook-main">
      <header class="mistake-notebook-header">
        <span class="page-eyebrow">Mistakes Collector</span>
        <h1>错题本</h1>
        <p>智能收录错题，精准定位薄弱点，让复习事半功倍</p>
      </header>

      <section class="notebook-section">
        <div class="section-divider"></div>

        <div class="filter-bar" aria-label="错题筛选">
          <label class="filter-field">
            <span class="filter-field__label">考试类型</span>
            <el-select
              v-model="draftFilters.examType"
              clearable
              placeholder="全部考试"
              @change="handleExamTypeChange"
            >
              <el-option
                v-for="option in examTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </label>

          <label class="filter-field">
            <span class="filter-field__label">来源</span>
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
            <span class="filter-field__label">考试科目</span>
            <el-select
              v-model="draftFilters.subjectCodes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              clearable
              :disabled="!draftFilters.examType || syllabusLoading || Boolean(syllabusError)"
              :placeholder="draftFilters.examType ? '全部科目' : '请先选择考试类型'"
              @change="handleSubjectChange"
            >
              <el-option
                v-for="option in subjectOptions"
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
              :data="knowledgeTreeData"
              :props="treeProps"
              node-key="code"
              multiple
              show-checkbox
              collapse-tags
              collapse-tags-tooltip
              clearable
              filterable
              :disabled="!draftFilters.examType || syllabusLoading || Boolean(syllabusError)"
              :placeholder="draftFilters.examType ? '全部知识点' : '请先选择考试类型'"
            />
          </label>

          <label class="filter-field">
            <span class="filter-field__label">难度</span>
            <el-select
              v-model="draftFilters.difficulties"
              multiple
              collapse-tags
              collapse-tags-tooltip
              clearable
              placeholder="全部难度"
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
            <span class="filter-field__label">收录时间</span>
            <el-date-picker
              v-model="draftFilters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :disabled-date="isDateDisabled"
              clearable
            />
          </label>

          <div class="filter-actions">
            <button
              type="button"
              class="filter-button button_primary"
              :disabled="wrongLoading"
              @click="applyFilters"
            >
              搜索
            </button>
            <button
              type="button"
              class="filter-button button_cancel"
              :disabled="wrongLoading"
              @click="resetFilters"
            >
              重置
            </button>
          </div>

          <p class="filter-hint">
            日期用于筛出该时段内曾经做错的题；卡片中的错误次数和曾选答案始终按全历史累计。
          </p>
          <p v-if="syllabusError" class="filter-message" role="status">
            {{ syllabusError }}
          </p>
        </div>

        <div v-if="wrongError && wrongList.length" class="inline-error" role="alert">
          <span>{{ wrongError }}，当前仍显示上一次成功加载的结果。</span>
          <button
            type="button"
            class="button_cancel"
            :disabled="wrongLoading"
            @click="retryWrongAnswers"
          >
            重新加载
          </button>
        </div>

        <div v-if="wrongLoading && wrongList.length === 0" class="section-card section-card--empty">
          <p class="loading-text">加载中...</p>
        </div>

        <div
          v-else-if="wrongError && wrongList.length === 0"
          class="section-card section-card--empty section-card--error"
          role="alert"
        >
          <h3>错题加载失败</h3>
          <p class="empty-desc">{{ wrongError }}</p>
          <button
            type="button"
            class="state-action button_cancel"
            :disabled="wrongLoading"
            @click="retryWrongAnswers"
          >
            重新加载
          </button>
        </div>

        <div v-else-if="wrongList.length === 0" class="section-card section-card--empty">
          <div class="empty-icon">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="12" y="8" width="40" height="50" rx="4" stroke="#cbd5e1" stroke-width="2" />
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
              <circle cx="46" cy="48" r="12" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2" />
              <path d="M43 48h6M46 45v6" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
          <h3>{{ hasActiveQuery ? '暂无匹配错题' : '暂无错题' }}</h3>
          <p class="empty-desc">
            {{ hasActiveQuery ? '调整筛选条件后再试试。' : '你还没有做错的题目，继续保持。' }}
          </p>
        </div>

        <div v-else class="wrong-list" :aria-busy="wrongLoading">
          <article v-for="item in wrongList" :key="item.id" class="wrong-item">
            <div class="wrong-item__body">
              <div class="wrong-item__meta">
                <span class="context-tag">{{ examTypeText(item) }}</span>
                <span class="context-tag">{{ subjectText(item) }}</span>
                <span
                  >收录 {{ formatDate(item.examRecord?.submittedAt) }}
                  {{ formatTime(item.examRecord?.submittedAt) }}</span
                >
                <span>{{ formatDuration(item.durationSeconds) }}</span>
                <span class="difficulty-tag">{{ difficultyText(item) }}</span>
                <span class="source-tag">{{ sourceText(item) }}</span>
                <span class="history-tag">历史错 {{ item.wrongCount }} 次</span>
                <span v-if="selectedAnswersText(item)" class="history-tag">
                  历史曾选 {{ selectedAnswersText(item) }}
                </span>
              </div>
              <p v-if="knowledgeText(item)" class="wrong-item__knowledge">
                知识点：{{ knowledgeText(item) }}
              </p>
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
            <button
              v-else
              class="wrong-item__action wrong-item__action--disabled"
              type="button"
              disabled
              aria-label="缺少答题记录，暂时无法查看解析"
            >
              查看解析
            </button>
          </article>
        </div>

        <AppPagination
          v-if="!wrongLoading && !wrongError && pagination.total > 0"
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
// 错题本页面：按考试体系组织长期错题资产，并在筛选、失败和往返解析时保持上下文一致。
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import LatexText from '@/components/LatexText.vue'
import AppPagination from '@/components/AppPagination.vue'
import { getMistakeNotebookData, type WrongAnswer } from '@/api/exam'
import { getSyllabusData, type SyllabusNode } from '@/api/questionBank'
import { EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'
import { PAPER_TYPE, PAPER_TYPE_OPTIONS, paperTypeSourceLabel } from '@/constants/paperTypes'
import { getApiErrorMessage } from '@/utils/request'

interface FilterOption {
  label: string
  value: string
}

interface FilterState {
  examType: ExamType | ''
  sources: string[]
  subjectCodes: string[]
  knowledgeCodes: string[]
  difficulties: string[]
  dateRange: string[] | null
}

const route = useRoute()
const router = useRouter()
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
const wrongError = ref('')
const syllabusLoading = ref(false)
const syllabusError = ref('')
const earliestWrongDate = ref<string | null>(null)
const draftFilters = reactive<FilterState>(createEmptyFilters())
const appliedFilters = reactive<FilterState>(createEmptyFilters())
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
})
let wrongRequestSequence = 0
let syllabusRequestSequence = 0

const examTypeOptions = computed<FilterOption[]>(() =>
  EXAM_TYPE_OPTIONS.filter((item) => item.available).map((item) => ({
    value: item.value,
    label: item.label,
  })),
)
const sourceOptions = computed<FilterOption[]>(() =>
  PAPER_TYPE_OPTIONS.map((item) => ({
    value: item.value,
    label: paperTypeSourceLabel(item.value),
  })),
)
const subjectOptions = computed<FilterOption[]>(() =>
  syllabusTreeData.value.map((item) => ({ value: item.code, label: item.label })),
)
const knowledgeTreeData = computed<SyllabusNode[]>(() => {
  if (!draftFilters.subjectCodes.length) return syllabusTreeData.value
  const selectedCodes = new Set(draftFilters.subjectCodes)
  return syllabusTreeData.value.filter((item) => selectedCodes.has(item.code))
})
const difficultyOptions = computed<FilterOption[]>(() =>
  Object.entries(difficultyLabelMap).map(([value, label]) => ({ value, label })),
)
const hasActiveQuery = computed(
  () =>
    Boolean(appliedFilters.examType) ||
    appliedFilters.sources.length > 0 ||
    appliedFilters.subjectCodes.length > 0 ||
    appliedFilters.knowledgeCodes.length > 0 ||
    appliedFilters.difficulties.length > 0 ||
    Boolean(appliedFilters.dateRange?.length === 2),
)

// 首次进入或从解析页返回时，从地址栏恢复已应用条件和分页位置。
onMounted(async () => {
  restoreStateFromRoute()
  copyFilters(draftFilters, appliedFilters)
  await Promise.all([loadWrongAnswers(), loadSyllabusTree(draftFilters.examType)])
})

// 页面销毁后使仍在飞行的请求失效，避免异步结果继续写回已离开的页面。
onBeforeUnmount(() => {
  wrongRequestSequence += 1
  syllabusRequestSequence += 1
})

// 创建筛选初始值，避免草稿条件和已应用条件共享数组引用。
function createEmptyFilters(): FilterState {
  return {
    examType: '',
    sources: [],
    subjectCodes: [],
    knowledgeCodes: [],
    difficulties: [],
    dateRange: [],
  }
}

// 地址栏列表值统一使用逗号分隔，兼容路由可能返回的数组形式。
function queryList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value]
  return values
    .flatMap((item) => String(item || '').split(','))
    .map((item) => item.trim())
    .filter(Boolean)
}

// 只恢复当前已开放考试类型，避免旧链接把 STEP 等未开放能力带入错题筛选。
function restoreStateFromRoute(): void {
  const requestedExamType = String(route.query.examType || '').toUpperCase()
  draftFilters.examType = examTypeOptions.value.some((item) => item.value === requestedExamType)
    ? (requestedExamType as ExamType)
    : ''
  draftFilters.sources = queryList(route.query.sources)
  draftFilters.subjectCodes = draftFilters.examType ? queryList(route.query.subjects) : []
  draftFilters.knowledgeCodes = draftFilters.examType ? queryList(route.query.knowledge) : []
  draftFilters.difficulties = queryList(route.query.difficulties)
  const startDate = String(route.query.startDate || '')
  const endDate = String(route.query.endDate || '')
  draftFilters.dateRange = startDate && endDate ? [startDate, endDate] : []
  pagination.page = positiveRouteNumber(route.query.page, 1)
  pagination.pageSize = positiveRouteNumber(route.query.pageSize, 20)
}

// 页码参数只接受正整数，异常链接回退到稳定默认值。
function positiveRouteNumber(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

// 考纲接口带上草稿考试类型；切换过快时只接受最后一次请求结果。
async function loadSyllabusTree(examType: FilterState['examType']): Promise<void> {
  const requestId = ++syllabusRequestSequence
  syllabusError.value = ''
  if (!examType) {
    syllabusTreeData.value = []
    syllabusLoading.value = false
    return
  }
  syllabusLoading.value = true
  try {
    const nodes = await getSyllabusData(examType)
    if (requestId !== syllabusRequestSequence) return
    const onlyRoot = nodes.length === 1 ? nodes[0] : undefined
    syllabusTreeData.value = onlyRoot?.children?.length ? onlyRoot.children : nodes
  } catch (error: unknown) {
    if (requestId !== syllabusRequestSequence) return
    syllabusTreeData.value = []
    syllabusError.value = getApiErrorMessage(error, '考纲加载失败，请重新选择考试类型后重试')
  } finally {
    if (requestId === syllabusRequestSequence) syllabusLoading.value = false
  }
}

// 错题请求通过序号防止旧搜索覆盖新搜索，并把失败与真正空数据分开呈现。
async function loadWrongAnswers(): Promise<boolean> {
  const requestId = ++wrongRequestSequence
  wrongLoading.value = true
  wrongError.value = ''
  try {
    const result = await getMistakeNotebookData({
      page: pagination.page,
      pageSize: pagination.pageSize,
      examType: appliedFilters.examType,
      paperTypes: appliedFilters.sources,
      subjectCodes: appliedFilters.subjectCodes,
      syllabusCodes: appliedFilters.knowledgeCodes,
      difficulties: appliedFilters.difficulties,
      startDate: appliedFilters.dateRange?.[0],
      endDate: appliedFilters.dateRange?.[1],
    })
    if (requestId !== wrongRequestSequence) return false
    wrongList.value = result.list || []
    pagination.page = result.pagination.page
    pagination.pageSize = result.pagination.pageSize
    pagination.total = result.pagination.total
    pagination.totalPages = result.pagination.totalPages
    earliestWrongDate.value = dateOnly(result.dateBounds?.min)
    return true
  } catch (error: unknown) {
    if (requestId !== wrongRequestSequence) return false
    wrongError.value = getApiErrorMessage(error, '错题加载失败，请稍后重试')
    return false
  } finally {
    if (requestId === wrongRequestSequence) wrongLoading.value = false
  }
}

// 考试类型决定科目和知识点树，切换后清空不再属于当前体系的下游条件。
async function handleExamTypeChange(): Promise<void> {
  draftFilters.subjectCodes = []
  draftFilters.knowledgeCodes = []
  await loadSyllabusTree(draftFilters.examType)
}

// 科目变化后清空旧知识点，避免隐藏条件继续影响下一次搜索。
function handleSubjectChange(): void {
  draftFilters.knowledgeCodes = []
}

// 搜索失败时恢复上一组已应用条件，页面继续展示与列表一致的旧结果。
async function applyFilters(): Promise<void> {
  const previousFilters = cloneFilters(appliedFilters)
  const previousPage = pagination.page
  copyFilters(draftFilters, appliedFilters)
  pagination.page = 1
  const succeeded = await loadWrongAnswers()
  if (!succeeded) {
    copyFilters(previousFilters, appliedFilters)
    pagination.page = previousPage
    return
  }
  await syncRouteState()
}

// 重置失败时同样回滚已应用条件，不让旧列表与新筛选口径错位。
async function resetFilters(): Promise<void> {
  const previousDraft = cloneFilters(draftFilters)
  const previousApplied = cloneFilters(appliedFilters)
  const previousPage = pagination.page
  clearFilters(draftFilters)
  clearFilters(appliedFilters)
  await loadSyllabusTree('')
  pagination.page = 1
  const succeeded = await loadWrongAnswers()
  if (!succeeded) {
    copyFilters(previousDraft, draftFilters)
    copyFilters(previousApplied, appliedFilters)
    pagination.page = previousPage
    await loadSyllabusTree(draftFilters.examType)
    return
  }
  await syncRouteState()
}

// 分页失败时回到原页，避免页码和保留的列表内容不一致。
async function handlePageChange(page: number): Promise<void> {
  const previousPage = pagination.page
  pagination.page = page
  const succeeded = await loadWrongAnswers()
  if (!succeeded) {
    pagination.page = previousPage
    return
  }
  await syncRouteState()
}

// 切换每页数量失败时恢复原分页配置。
async function handlePageSizeChange(pageSize: number): Promise<void> {
  const previousPage = pagination.page
  const previousPageSize = pagination.pageSize
  pagination.pageSize = pageSize
  pagination.page = 1
  const succeeded = await loadWrongAnswers()
  if (!succeeded) {
    pagination.page = previousPage
    pagination.pageSize = previousPageSize
    return
  }
  await syncRouteState()
}

// 失败态重试只使用已应用条件，不会把尚未搜索的草稿条件带入列表。
async function retryWrongAnswers(): Promise<void> {
  const succeeded = await loadWrongAnswers()
  if (succeeded) await syncRouteState()
}

// 已应用条件写入地址栏，使查看解析后的返回能够恢复原筛选和页码。
async function syncRouteState(): Promise<void> {
  const query: Record<string, string> = {}
  if (appliedFilters.examType) query.examType = appliedFilters.examType
  if (appliedFilters.sources.length) query.sources = appliedFilters.sources.join(',')
  if (appliedFilters.subjectCodes.length) query.subjects = appliedFilters.subjectCodes.join(',')
  if (appliedFilters.knowledgeCodes.length)
    query.knowledge = appliedFilters.knowledgeCodes.join(',')
  if (appliedFilters.difficulties.length) query.difficulties = appliedFilters.difficulties.join(',')
  if (appliedFilters.dateRange?.[0]) query.startDate = appliedFilters.dateRange[0]
  if (appliedFilters.dateRange?.[1]) query.endDate = appliedFilters.dateRange[1]
  if (pagination.page > 1) query.page = String(pagination.page)
  if (pagination.pageSize !== 20) query.pageSize = String(pagination.pageSize)
  await router.replace({ name: 'mistake-notebook', query })
}

// 草稿条件与已应用条件保持值复制，避免数组引用造成未搜索条件提前生效。
function copyFilters(source: FilterState, target: FilterState): void {
  target.examType = source.examType
  target.sources = [...source.sources]
  target.subjectCodes = [...source.subjectCodes]
  target.knowledgeCodes = [...source.knowledgeCodes]
  target.difficulties = [...source.difficulties]
  target.dateRange = source.dateRange ? [...source.dateRange] : []
}

// 快照用于请求失败后的事务式回滚。
function cloneFilters(source: FilterState): FilterState {
  const result = createEmptyFilters()
  copyFilters(source, result)
  return result
}

// 重置所有筛选层级，考试类型清空后科目和知识点也必须同步失效。
function clearFilters(filters: FilterState): void {
  copyFilters(createEmptyFilters(), filters)
}

// 错题解析显式记录“来自错题本”，同时保留题目业务来源和列表返回地址。
function analysisLink(item: WrongAnswer) {
  const paperType = item.examRecord?.paper?.paperType
  const recordSource =
    paperType === PAPER_TYPE.REAL_PAPER
      ? 'diagnostic'
      : paperType === PAPER_TYPE.MOCK_PAPER || paperType === PAPER_TYPE.AI_PAPER
        ? 'question-bank'
        : undefined
  return {
    name: 'exam-question-review',
    params: { id: item.examRecord?.id },
    query: {
      questionId: item.questionId,
      from: 'mistake-notebook',
      recordSource,
      returnTo: route.fullPath,
    },
  }
}

// 错题卡片优先展示正式题目标题，历史异常数据缺标题时回退到题目 ID。
function questionTitle(item: WrongAnswer): string {
  return item.title || `题目 ${item.questionId}`
}

// 卡片显示答题记录所属考试体系，缺失时不伪造默认考试类型。
function examTypeText(item: WrongAnswer): string {
  return item.examType || item.examRecord?.examType || '考试类型未知'
}

// 科目名称优先使用题目展示名，历史数据缺失时回退到科目 code。
function subjectText(item: WrongAnswer): string {
  return item.subject || item.subjectCode || '科目未标注'
}

// 知识点摘要最多直接展示两个名称，其余数量以紧凑后缀提示。
function knowledgeText(item: WrongAnswer): string {
  const labels = (item.knowledge_points || [])
    .map((point) => point.label || point.code)
    .filter(Boolean)
  if (!labels.length) return ''
  const visible = labels.slice(0, 2).join(' · ')
  return labels.length > 2 ? `${visible} +${labels.length - 2}` : visible
}

// difficulty 已在后端统一为 easy/medium/hard/composite 字符串。
function difficultyText(item: WrongAnswer): string {
  return difficultyLabelMap[item.difficulty || ''] || '难度-未标注'
}

// 题目来源保留未知状态，不再把缺失数据伪装成真题。
function sourceText(item: WrongAnswer): string {
  return paperTypeSourceLabel(item.examRecord?.paper?.paperType)
}

// 聚合错题展示全历史错误答案，并按首次出现顺序去重。
function selectedAnswersText(item: WrongAnswer): string {
  if (item.selectedAnswers?.length) return item.selectedAnswers.join('、')
  return item.selectedAnswer || ''
}

// 日期选择范围从第一条正式收录的错题开始，未来日期不可选。
function isDateDisabled(date: Date): boolean {
  const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  if (candidate > todayStart) return true
  if (!earliestWrongDate.value) return false
  const earliest = new Date(`${earliestWrongDate.value}T00:00:00`).getTime()
  return Number.isFinite(earliest) && candidate < earliest
}

// 接口时间边界统一截取日期部分，避免 UTC 时区改变日期选择器下限。
function dateOnly(value?: string | null): string | null {
  if (!value) return null
  const matched = /^(\d{4}-\d{2}-\d{2})/.exec(value)
  return matched?.[1] || null
}

// 收录时间使用整次答题提交时间，避免把保存进度时间误认为做错时间。
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

// 收录时间精确到时分，缺失时展示占位符。
function formatTime(dateStr?: string | null): string {
  if (!dateStr) return '--:--'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '--:--'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 单题耗时是独立统计字段，不参与最近收录时间排序。
function formatDuration(seconds?: number | null): string {
  if (!seconds) return '用时 -'
  if (seconds < 60) return `用时 ${seconds} 秒`
  return `用时 ${Math.max(1, Math.round(seconds / 60))} 分钟`
}
</script>

<style scoped lang="scss">
.mistake-notebook-page {
  min-height: 100vh;
  min-width: var(--fluid-page-min-width);
  background: var(--color-bg);
  color: var(--color-ink);
}

.mistake-notebook-main {
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 40px 0 96px;
}

.back-link {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  text-decoration: none;
}

.mistake-notebook-header {
  margin: 0 0 24px;

  h1 {
    margin: 0;
    color: var(--color-ink);
    font-size: var(--text-4xl);
    font-weight: var(--weight-bold);
    letter-spacing: 0;
  }

  p {
    max-width: 560px;
    margin: 10px 0 0;
    color: var(--color-ink-soft);
    line-height: var(--leading-relaxed);
  }
}

.page-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.page-eyebrow::before {
  width: 24px;
  height: 1px;
  background: var(--color-ink);
  content: '';
}

.notebook-section {
  min-width: 0;
}

.section-divider {
  display: none;
}

.filter-bar {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px 20px;
  align-items: end;
  margin-bottom: 24px;
  padding: 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.filter-field {
  display: grid;
  grid-column: span 4;
  gap: 7px;
  align-content: start;
  min-width: 0;
}

.filter-field__label {
  color: var(--color-ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  white-space: nowrap;
}

.filter-field :deep(.el-select),
.filter-field :deep(.el-tree-select),
.filter-field :deep(.el-date-editor) {
  width: 100%;
}

.filter-field :deep(.el-select__wrapper),
.filter-field :deep(.el-input__wrapper) {
  min-height: var(--height-button);
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 1px var(--color-line) inset;
}

.filter-actions {
  display: flex;
  grid-column: span 12;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.filter-button {
  min-width: 80px;
  height: var(--height-button);
  padding: 0 18px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.filter-button:disabled {
  cursor: wait;
  opacity: 0.58;
}

.filter-hint,
.filter-message {
  grid-column: 1 / -1;
  margin: -2px 0 0;
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
}

.filter-hint {
  color: var(--color-ink-muted);
}

.filter-message {
  color: var(--color-danger);
}

.section-card {
  padding: 24px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.section-card--empty {
  display: grid;
  place-items: center;
  min-height: 300px;
  text-align: center;

  h3 {
    margin: 12px 0 8px;
    color: var(--color-ink);
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
  }
}

.loading-text,
.empty-desc {
  margin: 0;
  color: var(--color-ink-muted);
}

.section-card--error {
  gap: 12px;
}

.state-action {
  min-width: 96px;
  min-height: var(--height-button);
  margin-top: 6px;
  padding: 0 18px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.inline-error {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--color-danger) 36%, var(--color-line));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-danger) 6%, var(--color-surface));
  color: var(--color-danger);
  font-size: var(--text-sm);

  button {
    flex: none;
    min-height: 36px;
    padding: 0 14px;
    border-radius: var(--radius-md);
  }
}

.empty-icon {
  svg {
    width: 80px;
    height: 80px;
  }
}

.wrong-list {
  display: grid;
  gap: 12px;
}

.wrong-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 20px;
  align-items: center;
  min-height: 96px;
  padding: 18px 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition:
    border-color var(--duration-base) ease,
    transform var(--duration-fast) ease;
}

.wrong-item:hover {
  border-color: var(--color-ink);
  transform: translateY(-1px);
}

.wrong-item__body {
  min-width: 0;
}

.wrong-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.context-tag,
.difficulty-tag,
.source-tag,
.history-tag {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 2px 10px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: var(--color-hover);
  color: var(--color-ink-soft);
}

.context-tag {
  background: var(--color-ink);
  color: var(--color-surface);
}

.source-tag {
  background: var(--color-surface-alt);
}

.history-tag {
  background: var(--color-surface);
}

.wrong-item__knowledge {
  margin: 0 0 8px;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
  overflow-wrap: anywhere;
}

.wrong-item__title {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
  line-height: var(--leading-relaxed);
  overflow-wrap: anywhere;
}

.wrong-item__action {
  display: inline-grid;
  place-items: center;
  min-width: 92px;
  height: var(--height-button);
  padding: 0 16px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.wrong-item__action--disabled {
  border: 1px solid var(--color-line);
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
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
  .filter-hint,
  .filter-message {
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

  .inline-error {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
