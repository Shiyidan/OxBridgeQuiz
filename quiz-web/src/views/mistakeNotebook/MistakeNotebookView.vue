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
            <span class="filter-field__label">考试科目</span>
            <el-select
              v-model="draftFilters.subjectCodes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              clearable
              :disabled="syllabusLoading || Boolean(syllabusError)"
              placeholder="全部科目"
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

          <label ref="knowledgeFilterFieldRef" class="filter-field">
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
              :tag-tooltip="knowledgeTagTooltip"
              clearable
              filterable
              :disabled="syllabusLoading || Boolean(syllabusError)"
              placeholder="全部知识点"
            />
          </label>

          <label class="filter-field filter-field--date">
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

          <label class="filter-field filter-field--keyword">
            <span class="filter-field__label">题目搜索</span>
            <el-input
              v-model="draftFilters.keyword"
              maxlength="100"
              clearable
              placeholder="输入题干关键词"
              @keyup.enter="applyFilters"
            />
          </label>

          <div class="filter-actions">
            <el-button
              type="primary"
              :disabled="wrongLoading"
              @click="applyFilters"
            >
              搜索
            </el-button>
            <el-button
              :disabled="wrongLoading"
              @click="resetFilters"
            >
              重置
            </el-button>
          </div>

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

        <div v-else class="wrong-results" :aria-busy="wrongLoading">
          <header class="wrong-results__header">
            <div>
              <h2>错题列表</h2>
              <span>{{ pagination.total }} 题</span>
            </div>
            <p>排序：<strong>最新收录</strong></p>
          </header>

          <div class="wrong-list">
            <article v-for="item in wrongList" :key="item.id" class="wrong-item">
              <span class="wrong-item__document" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M6.5 3.5h7l4 4v13h-11z" />
                  <path d="M13.5 3.5v4h4M9 12h6M9 15.5h4.5" />
                </svg>
              </span>

              <div class="wrong-item__body">
                <h3 class="wrong-item__title">
                  <LatexText :text="questionTitle(item)" />
                </h3>
                <div class="wrong-item__meta">
                  <span v-if="knowledgeText(item)">知识点：{{ knowledgeText(item) }}</span>
                  <span
                    class="wrong-item__difficulty"
                    :class="difficultyToneClass(item.difficulty)"
                  >
                    难度：{{ difficultyText(item) }}
                  </span>
                  <span>历史错题：{{ item.wrongCount }} 次</span>
                  <span v-if="selectedAnswersText(item)">
                    历史错选：{{ selectedAnswersText(item) }}
                  </span>
                </div>
              </div>

              <router-link
                v-if="item.examRecord?.id"
                :to="analysisLink(item)"
                class="wrong-item__action"
                aria-label="查看试题解析"
              >
                <span>查看解析</span>
              </router-link>
              <button
                v-else
                class="wrong-item__action wrong-item__action--disabled"
                type="button"
                disabled
                aria-label="缺少答题记录，暂时无法查看解析"
              >
                <span>查看解析</span>
              </button>
            </article>
          </div>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import LatexText from '@/components/LatexText.vue'
import AppPagination from '@/components/AppPagination.vue'
import {
  getMistakeNotebookData,
  recordMistakeNotebookVisit,
  type MistakeNotebookDifficulty,
  type WrongAnswer,
} from '@/api/exam'
import { getSyllabusData, type SyllabusNode } from '@/api/questionBank'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import { PAPER_TYPE, PAPER_TYPE_OPTIONS, type PaperType } from '@/constants/paperTypes'
import { getApiErrorMessage } from '@/utils/request'

interface FilterOption {
  label: string
  value: string
}

interface FilterState {
  sources: string[]
  subjectCodes: string[]
  knowledgeCodes: string[]
  difficulties: MistakeNotebookDifficulty[]
  dateRange: string[] | null
  keyword: string
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const difficultyLabelMap = {
  easy: '低',
  medium: '中',
  hard: '高',
} as const
const mistakeNotebookDifficultyValues: readonly MistakeNotebookDifficulty[] = [
  'easy',
  'medium',
  'hard',
]
const difficultyOptions: FilterOption[] = mistakeNotebookDifficultyValues.map((value) => ({
  value,
  label: difficultyLabelMap[value],
}))
const difficultyFilterValues = new Set<string>(mistakeNotebookDifficultyValues)
const sourceLabelMap: Record<PaperType, string> = {
  [PAPER_TYPE.REAL_PAPER]: '诊断测试',
  [PAPER_TYPE.MOCK_PAPER]: '模考',
  [PAPER_TYPE.AI_PAPER]: '试题库',
}
const treeProps = { children: 'children', label: 'label', value: 'code' }
const wrongList = ref<WrongAnswer[]>([])
const syllabusTreeData = ref<SyllabusNode[]>([])
const wrongLoading = ref(true)
const wrongError = ref('')
const syllabusLoading = ref(false)
const syllabusError = ref('')
const earliestWrongDate = ref<string | null>(null)
const knowledgeFilterFieldRef = ref<HTMLElement | null>(null)
const knowledgeTooltipWidth = ref(0)
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
let pageInitialized = false
let knowledgeTooltipResizeObserver: ResizeObserver | null = null

// 错题本与其他学习模块共用顶部导航栏的考试类型，不再维护页面级选择。
const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)
const sourceOptions = computed<FilterOption[]>(() =>
  PAPER_TYPE_OPTIONS.map((item) => ({
    value: item.value,
    label: sourceLabelMap[item.value],
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
const knowledgeTagTooltip = computed(() => ({
  popperClass: 'mistake-knowledge-tags-tooltip',
  popperStyle: knowledgeTooltipWidth.value
    ? {
        width: `${knowledgeTooltipWidth.value}px`,
        maxWidth: `${knowledgeTooltipWidth.value}px`,
      }
    : undefined,
}))
const hasActiveQuery = computed(
  () =>
    appliedFilters.sources.length > 0 ||
    appliedFilters.subjectCodes.length > 0 ||
    appliedFilters.knowledgeCodes.length > 0 ||
    appliedFilters.difficulties.length > 0 ||
    Boolean(appliedFilters.dateRange?.length === 2) ||
    Boolean(appliedFilters.keyword),
)

// 首次进入或从解析页返回时，从地址栏恢复已应用条件和分页位置。
onMounted(async () => {
  syncKnowledgeTooltipWidth()
  knowledgeTooltipResizeObserver = new ResizeObserver(syncKnowledgeTooltipWidth)
  if (knowledgeFilterFieldRef.value) {
    knowledgeTooltipResizeObserver.observe(knowledgeFilterFieldRef.value)
  }
  restoreStateFromRoute()
  copyFilters(draftFilters, appliedFilters)
  pageInitialized = true
  // 访问上报独立于列表加载，统计失败不能阻断学生查看已有错题。
  void recordMistakeNotebookVisit().catch(() => undefined)
  await Promise.all([loadWrongAnswers(), loadSyllabusTree(activeExamType.value)])
})

// 顶部导航切换考试类型后，清除失效的科目条件并重新查询对应错题和考纲。
watch(activeExamType, async () => {
  if (!pageInitialized) return
  draftFilters.subjectCodes = []
  draftFilters.knowledgeCodes = []
  appliedFilters.subjectCodes = []
  appliedFilters.knowledgeCodes = []
  pagination.page = 1
  await Promise.all([loadWrongAnswers(), loadSyllabusTree(activeExamType.value)])
  await syncRouteState()
})

// 页面销毁后使仍在飞行的请求失效，避免异步结果继续写回已离开的页面。
onBeforeUnmount(() => {
  knowledgeTooltipResizeObserver?.disconnect()
  wrongRequestSequence += 1
  syllabusRequestSequence += 1
})

// 折叠知识点的悬浮层跟随选择框宽度，避免长标签将提示层撑满页面。
function syncKnowledgeTooltipWidth(): void {
  const select = knowledgeFilterFieldRef.value?.querySelector<HTMLElement>('.el-select')
  knowledgeTooltipWidth.value = Math.round(select?.getBoundingClientRect().width || 0)
}

// 创建筛选初始值，避免草稿条件和已应用条件共享数组引用。
function createEmptyFilters(): FilterState {
  return {
    sources: [],
    subjectCodes: [],
    knowledgeCodes: [],
    difficulties: [],
    dateRange: [],
    keyword: '',
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

// 地址栏只恢复页面级筛选；考试类型始终由顶部导航栏决定。
function restoreStateFromRoute(): void {
  draftFilters.sources = queryList(route.query.sources)
  draftFilters.subjectCodes = queryList(route.query.subjects)
  draftFilters.knowledgeCodes = queryList(route.query.knowledge)
  draftFilters.difficulties = queryList(route.query.difficulties).filter(
    (value): value is MistakeNotebookDifficulty => difficultyFilterValues.has(value),
  )
  const startDate = String(route.query.startDate || '')
  const endDate = String(route.query.endDate || '')
  draftFilters.dateRange = startDate && endDate ? [startDate, endDate] : []
  const keyword = Array.isArray(route.query.keyword) ? route.query.keyword[0] : route.query.keyword
  draftFilters.keyword = String(keyword || '').trim().slice(0, 100)
  pagination.page = positiveRouteNumber(route.query.page, 1)
  pagination.pageSize = positiveRouteNumber(route.query.pageSize, 20)
}

// 页码参数只接受正整数，异常链接回退到稳定默认值。
function positiveRouteNumber(value: unknown, fallback: number): number {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

// 考纲接口读取顶部导航考试类型；切换过快时只接受最后一次请求结果。
async function loadSyllabusTree(examType: ActiveExamType): Promise<void> {
  const requestId = ++syllabusRequestSequence
  syllabusError.value = ''
  syllabusLoading.value = true
  try {
    const nodes = await getSyllabusData(examType)
    if (requestId !== syllabusRequestSequence || examType !== activeExamType.value) return
    const onlyRoot = nodes.length === 1 ? nodes[0] : undefined
    syllabusTreeData.value = onlyRoot?.children?.length ? onlyRoot.children : nodes
  } catch (error: unknown) {
    if (requestId !== syllabusRequestSequence || examType !== activeExamType.value) return
    syllabusTreeData.value = []
    syllabusError.value = getApiErrorMessage(error, '考纲加载失败，请切换顶部考试类型后重试')
  } finally {
    if (requestId === syllabusRequestSequence) syllabusLoading.value = false
  }
}

// 错题请求通过序号防止旧搜索覆盖新搜索，并把失败与真正空数据分开呈现。
async function loadWrongAnswers(): Promise<boolean> {
  const requestId = ++wrongRequestSequence
  const requestedExamType = activeExamType.value
  wrongLoading.value = true
  wrongError.value = ''
  try {
    const result = await getMistakeNotebookData({
      page: pagination.page,
      pageSize: pagination.pageSize,
      examType: requestedExamType,
      paperTypes: appliedFilters.sources,
      subjectCodes: appliedFilters.subjectCodes,
      syllabusCodes: appliedFilters.knowledgeCodes,
      difficulties: appliedFilters.difficulties,
      startDate: appliedFilters.dateRange?.[0],
      endDate: appliedFilters.dateRange?.[1],
      keyword: appliedFilters.keyword,
    })
    if (requestId !== wrongRequestSequence || requestedExamType !== activeExamType.value) return false
    wrongList.value = result.list || []
    pagination.page = result.pagination.page
    pagination.pageSize = result.pagination.pageSize
    pagination.total = result.pagination.total
    pagination.totalPages = result.pagination.totalPages
    earliestWrongDate.value = dateOnly(result.dateBounds?.min)
    return true
  } catch (error: unknown) {
    if (requestId !== wrongRequestSequence || requestedExamType !== activeExamType.value) return false
    wrongError.value = getApiErrorMessage(error, '错题加载失败，请稍后重试')
    return false
  } finally {
    if (requestId === wrongRequestSequence) wrongLoading.value = false
  }
}

// 科目变化后清空旧知识点，避免隐藏条件继续影响下一次搜索。
function handleSubjectChange(): void {
  draftFilters.knowledgeCodes = []
}

// 搜索失败时恢复上一组已应用条件，页面继续展示与列表一致的旧结果。
async function applyFilters(): Promise<void> {
  const previousFilters = cloneFilters(appliedFilters)
  const previousPage = pagination.page
  draftFilters.keyword = draftFilters.keyword.trim()
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
  pagination.page = 1
  const succeeded = await loadWrongAnswers()
  if (!succeeded) {
    copyFilters(previousDraft, draftFilters)
    copyFilters(previousApplied, appliedFilters)
    pagination.page = previousPage
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
  if (appliedFilters.sources.length) query.sources = appliedFilters.sources.join(',')
  if (appliedFilters.subjectCodes.length) query.subjects = appliedFilters.subjectCodes.join(',')
  if (appliedFilters.knowledgeCodes.length)
    query.knowledge = appliedFilters.knowledgeCodes.join(',')
  if (appliedFilters.difficulties.length) query.difficulties = appliedFilters.difficulties.join(',')
  if (appliedFilters.dateRange?.[0]) query.startDate = appliedFilters.dateRange[0]
  if (appliedFilters.dateRange?.[1]) query.endDate = appliedFilters.dateRange[1]
  if (appliedFilters.keyword) query.keyword = appliedFilters.keyword
  if (pagination.page > 1) query.page = String(pagination.page)
  if (pagination.pageSize !== 20) query.pageSize = String(pagination.pageSize)
  await router.replace({ name: 'mistake-notebook', query })
}

// 草稿条件与已应用条件保持值复制，避免数组引用造成未搜索条件提前生效。
function copyFilters(source: FilterState, target: FilterState): void {
  target.sources = [...source.sources]
  target.subjectCodes = [...source.subjectCodes]
  target.knowledgeCodes = [...source.knowledgeCodes]
  target.difficulties = [...source.difficulties]
  target.dateRange = source.dateRange ? [...source.dateRange] : []
  target.keyword = source.keyword
}

// 快照用于请求失败后的事务式回滚。
function cloneFilters(source: FilterState): FilterState {
  const result = createEmptyFilters()
  copyFilters(source, result)
  return result
}

// 重置页面级筛选，顶部导航栏的全局考试类型保持不变。
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

// 知识点摘要最多直接展示两个名称，其余数量以紧凑后缀提示。
function knowledgeText(item: WrongAnswer): string {
  const labels = (item.knowledge_points || [])
    .flatMap((point) => (point.label ? [point.label] : []))
  if (!labels.length) return ''
  const visible = labels.slice(0, 2).join(' · ')
  return labels.length > 2 ? `${visible} +${labels.length - 2}` : visible
}

// 卡片与筛选统一展示低、中、高三档题目难度。
function difficultyText(item: WrongAnswer): string {
  const difficulty = item.difficulty || ''
  return difficulty in difficultyLabelMap
    ? difficultyLabelMap[difficulty as keyof typeof difficultyLabelMap]
    : '未标注'
}

// 难度颜色只编码题目复杂度，不影响列表排序与筛选状态。
function difficultyToneClass(difficulty?: string | null): string {
  if (difficulty === 'easy') return 'wrong-item__difficulty--easy'
  if (difficulty === 'medium') return 'wrong-item__difficulty--medium'
  if (difficulty === 'hard') return 'wrong-item__difficulty--hard'
  return 'wrong-item__difficulty--unknown'
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
  grid-template-columns:
    minmax(0, 18fr)
    minmax(0, 18fr)
    minmax(0, 32fr)
    minmax(0, 32fr);
  gap: 16px 20px;
  align-items: end;
  margin-bottom: 24px;
  padding: 10px 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.filter-field {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 12px;
  align-items: center;
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
.filter-field :deep(.el-input),
.filter-field :deep(.el-date-editor) {
  width: 100%;
}

.filter-field--date {
  grid-column: 1 / span 2;
}

.filter-field--keyword {
  grid-column: 3;
}

.filter-field :deep(.el-select__wrapper),
.filter-field :deep(.el-input__wrapper) {
  border-radius: 5px;
}

:global(.mistake-knowledge-tags-tooltip) {
  box-sizing: border-box;
}

:global(.mistake-knowledge-tags-tooltip .el-select__selected-item),
:global(.mistake-knowledge-tags-tooltip .el-tag) {
  max-width: 100%;
}

:global(.mistake-knowledge-tags-tooltip .el-select__tags-text) {
  text-overflow: ellipsis;
  overflow: hidden;
}

.filter-actions {
  display: flex;
  grid-column: 4;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.filter-message {
  grid-column: 1 / -1;
  margin: -2px 0 0;
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
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

.wrong-results__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 10px;
}

.wrong-results__header > div {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.wrong-results__header h2,
.wrong-results__header p {
  margin: 0;
}

.wrong-results__header h2 {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

.wrong-results__header span,
.wrong-results__header p {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.wrong-results__header p strong {
  margin-left: 8px;
  color: var(--color-ink-soft);
  font-weight: var(--weight-semi);
}

.wrong-list {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.wrong-item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  min-height: 82px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-line-soft);
  transition: background-color var(--duration-fast) ease;
}

.wrong-item:last-child {
  border-bottom: 0;
}

.wrong-item:hover {
  background: var(--color-hover);
}

.wrong-item__document {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  color: var(--color-ink-muted);
}

.wrong-item__document svg {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.wrong-item__body {
  min-width: 0;
}

.wrong-item__title {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  line-height: var(--leading-relaxed);
  overflow-wrap: anywhere;
}

.wrong-item__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 26px;
  align-items: center;
  margin-top: 7px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
}

.wrong-item__difficulty {
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  font-weight: var(--weight-semi);
}

.wrong-item__difficulty--easy {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.wrong-item__difficulty--medium {
  background: var(--color-warning-bg);
  color: var(--color-report-orange);
}

.wrong-item__difficulty--hard {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.wrong-item__difficulty--unknown {
  background: var(--color-info-bg);
  color: var(--color-info);
}

.wrong-item__action {
  display: inline-grid;
  align-items: center;
  min-width: 0;
  color: var(--color-ink);
  border: 0;
  background: transparent;
  font-size: var(--text-xs);
  font-family: inherit;
  font-weight: var(--weight-semi);
  text-decoration: none;
}

.wrong-item__action > span {
  display: inline-grid;
  min-width: 86px;
  min-height: 36px;
  padding: 0 16px;
  place-items: center;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
}

.wrong-item__action:hover > span,
.wrong-item__action:focus-visible > span {
  border-color: var(--color-ink-soft);
}

.wrong-item__action--disabled {
  border: 0;
  background: transparent;
  color: var(--color-ink-muted);
  cursor: not-allowed;
}

.wrong-item__action--disabled > span {
  background: var(--color-surface-alt);
}

@media (max-width: 780px), (max-device-width: 780px) {
  :global(body:has(.mistake-notebook-page)) {
    min-width: 0;
  }

  .mistake-notebook-page {
    --fluid-page-min-width: 0px;
    --fluid-shell-width: calc(100% - 32px);

    min-width: 0;
  }

  :deep(.navbar) {
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  :deep(.navbar::-webkit-scrollbar) {
    display: none;
  }

  :deep(.nav-inner) {
    width: max-content;
    min-width: 100%;
    padding: 0 16px;
  }

  .mistake-notebook-main {
    width: auto;
    margin: 0 16px;
    padding: 26px 0 48px;
  }

  .filter-bar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px 8px;
    padding: 12px;
  }

  .filter-actions {
    grid-column: auto;
    gap: 4px;
    justify-content: stretch;
  }

  .filter-field {
    grid-template-columns: minmax(0, 1fr);
    grid-column: auto;
    gap: 5px;
  }

  .filter-field__label {
    overflow: hidden;
    font-size: 11px;
    text-overflow: ellipsis;
  }

  .filter-field :deep(.el-select__wrapper),
  .filter-field :deep(.el-input__wrapper) {
    min-height: 34px;
    padding-right: 6px;
    padding-left: 6px;
    border-radius: 5px;
  }

  .filter-field :deep(.el-range-input),
  .filter-field :deep(.el-select__placeholder),
  .filter-field :deep(.el-select__selected-item) {
    font-size: 10px;
  }

  .filter-field :deep(.el-range-separator) {
    width: 12px;
    padding: 0 2px;
    font-size: 9px;
  }

  .filter-message {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px), (max-device-width: 640px) {
  .mistake-notebook-main {
    padding: 26px 0 20px;
  }

  .mistake-notebook-header {
    margin-bottom: 32px;

    h1 {
      font-size: 24px;
      line-height: 1.35;
    }
  }

  .wrong-item {
    grid-template-columns: 30px minmax(0, 1fr);
    gap: 12px;
    padding: 14px;
  }

  .wrong-item__action {
    grid-column: 2;
    justify-self: end;
  }

  .inline-error {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
