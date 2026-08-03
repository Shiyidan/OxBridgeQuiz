<!-- 练习本首页：按全局考试类型展示真实汇总，并在行内按需展开已交卷历史。 -->
<template>
  <div class="practice-notebook">
    <main class="notebook-container">
      <header class="notebook-header">
        <div>
          <span class="notebook-eyebrow">Practice Notebook</span>
          <h1>练习本</h1>
          <p>保存常用组卷规则，集中查看每次练习和历史结果。</p>
        </div>
        <button type="button" class="notebook-back" @click="handleBackToQuestionBank">
          <span aria-hidden="true">←</span>
          <span>返回试题库</span>
        </button>
      </header>

      <section
        v-if="activePractice && activePractice.examType !== activeExamType"
        class="notebook-active-other"
      >
        <div>
          <strong>你有一份 {{ activePractice.examType }} 练习尚未交卷</strong>
          <span
            >已答 {{ activePractice.answeredCount }}/{{ activePractice.totalQuestions }} 题</span
          >
        </div>
        <button
          type="button"
          class="button_primary"
          @click="continuePractice(activePractice.examRecordId)"
        >
          继续练习
        </button>
      </section>

      <section v-if="listLoading" class="notebook-state">正在加载练习本...</section>
      <section v-else-if="listError" class="notebook-state notebook-state--error">
        <p>{{ listError }}</p>
        <button type="button" class="button_cancel" @click="loadNotebookList">重新加载</button>
      </section>
      <section v-else-if="displayRows.length" class="notebook-list" aria-label="练习本列表">
        <div class="notebook-list__header" aria-hidden="true">
          <span>练习本</span>
          <span>当前设置</span>
          <span>最近一次</span>
          <span>累计</span>
          <span></span>
        </div>
        <template v-for="row in displayRows" :key="row.id">
          <article
            class="notebook-row"
            :class="{
              'notebook-row--expanded': expandedRowId === row.id,
              'notebook-row--active': isActiveRow(row),
            }"
            role="button"
            tabindex="0"
            :aria-expanded="expandedRowId === row.id"
            @click="toggleHistory(row)"
            @keydown.enter.prevent="toggleHistory(row)"
            @keydown.space.prevent="toggleHistory(row)"
          >
            <div class="notebook-row__identity">
              <h2 :title="row.title">{{ row.title }}</h2>
              <p>{{ row.scope }}</p>
              <span class="notebook-row__expand">
                {{ expandedRowId === row.id ? '收起历史' : '展开历史' }}
                <span aria-hidden="true">{{ expandedRowId === row.id ? '↑' : '↓' }}</span>
              </span>
            </div>
            <div class="notebook-row__settings">
              <strong :title="row.knowledge">{{ row.knowledge }}</strong>
              <p>{{ row.settings }}</p>
            </div>
            <div class="notebook-row__metric">
              <strong>{{ row.latestScore }}</strong>
              <small>{{ row.latestLabel }}</small>
            </div>
            <div class="notebook-row__metric">
              <strong>{{ row.completedGroups }}组</strong>
              <small>累计{{ row.completedQuestions }}题</small>
            </div>
            <div class="notebook-row__actions" @click.stop @keydown.stop>
              <button
                v-if="row.kind === 'notebook'"
                type="button"
                class="button_cancel"
                @click="handleEditNotebook(row.id)"
              >
                编辑
              </button>
              <button
                type="button"
                class="button_primary"
                :disabled="startingNotebookId === row.id"
                @click="handlePrimaryAction(row)"
              >
                {{ getPrimaryActionLabel(row) }}
              </button>
            </div>
          </article>

          <Transition name="history-expand">
            <section
              v-if="expandedRowId === row.id"
              class="notebook-history"
              :aria-label="`${row.title}历史记录`"
            >
              <div v-if="historyState(row.id).loading" class="history-state">
                正在加载历史记录...
              </div>
              <div
                v-else-if="historyState(row.id).error"
                class="history-state history-state--error"
              >
                <span>{{ historyState(row.id).error }}</span>
                <button type="button" @click="loadHistory(row, historyState(row.id).page)">
                  重试
                </button>
              </div>
              <div v-else-if="!historyState(row.id).records.length" class="history-state">
                暂无已交卷练习，完成第一组后会显示在这里。
              </div>
              <template v-else>
                <div class="history-table">
                  <div class="history-table__header" aria-hidden="true">
                    <span>交卷时间</span>
                    <span>成绩</span>
                    <span>正确率</span>
                    <span>用时</span>
                    <span></span>
                  </div>
                  <article
                    v-for="record in historyState(row.id).records"
                    :key="record.id"
                    class="history-record"
                  >
                    <span>{{ formatDateTime(record.submittedAt) }}</span>
                    <strong>{{ record.correctCount }} / {{ record.totalQuestions }}</strong>
                    <span>{{ record.accuracy }}%</span>
                    <span>{{ formatDuration(record.durationSeconds) }}</span>
                    <button type="button" @click="handleOpenHistory(record.id)">查看详情</button>
                  </article>
                </div>
                <AppPagination
                  :page="historyState(row.id).page"
                  :page-size="historyState(row.id).pageSize"
                  :page-sizes="[5, 10, 20]"
                  :total="historyState(row.id).total"
                  layout="total, sizes, prev, pager, next"
                  @page-change="handleHistoryPageChange(row, $event)"
                  @page-size-change="handleHistoryPageSizeChange(row, $event)"
                />
              </template>
            </section>
          </Transition>
        </template>
      </section>
      <section class="notebook-create-section" aria-label="新建练习本">
        <button type="button" class="notebook-create-card" @click="handleCreateNotebook">
          <span class="notebook-create-card__icon" aria-hidden="true">＋</span>
          <span class="notebook-create-card__copy">
            <strong>新建练习本</strong>
            <small>自己选择知识点、题量、难度和时间</small>
          </span>
        </button>
      </section>
    </main>

    <AppConfirmDialog
      v-model="quotaDialogVisible"
      title="免费练习题量不足"
      :message="quotaDialogMessage"
      confirm-text="开始练习"
      cancel-text="取消"
      @confirm="handleConfirmReducedPractice"
      @cancel="handleCancelReducedPractice"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import AppPagination from '@/components/AppPagination.vue'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import { checkMemberAccess } from '@/api/member'
import {
  getPracticeNotebookHistory,
  getPracticeNotebooks,
  getTemporaryPracticeHistory,
  startPracticeNotebook,
  type ActiveNotebookPractice,
  type PracticeHistoryRecord,
  type PracticeNotebookSummary,
  type TemporaryPracticeSummary,
} from '@/api/practiceNotebook'
import { getApiErrorMessage, hasApiErrorCode } from '@/utils/request'

interface DisplayRow {
  id: string
  kind: 'notebook' | 'temporary'
  examType: ActiveExamType
  questionCount: number
  title: string
  scope: string
  knowledge: string
  settings: string
  latestScore: string
  latestLabel: string
  completedGroups: number
  completedQuestions: number
}

interface HistoryState {
  loading: boolean
  loaded: boolean
  error: string
  records: PracticeHistoryRecord[]
  page: number
  pageSize: number
  total: number
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单为主',
  medium: '中等为主',
  hard: '困难为主',
  mixed: '均衡难度',
}

const router = useRouter()
const auth = useAuthStore()
const notebooks = ref<PracticeNotebookSummary[]>([])
const temporaryPractice = ref<TemporaryPracticeSummary | null>(null)
const activePractice = ref<ActiveNotebookPractice | null>(null)
const listLoading = ref(true)
const listError = ref('')
const expandedRowId = ref('')
const startingNotebookId = ref('')
const quotaDialogVisible = ref(false)
const quotaDialogMessage = ref('')
const pendingNotebookStart = ref<{ notebookId: string } | null>(null)
const histories = reactive<Record<string, HistoryState>>({})
let listRequestSequence = 0
let initialized = false

const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)

// 页面行由真实练习本和可选临时练习系统分组共同组成。
const displayRows = computed<DisplayRow[]>(() => {
  const rows = notebooks.value.map(formatNotebookRow)
  if (temporaryPractice.value) rows.push(formatTemporaryRow(temporaryPractice.value))
  return rows
})

// 练习本知识点快照用于稳定显示学科和规则摘要，不依赖考纲后续改名。
function formatNotebookRow(notebook: PracticeNotebookSummary): DisplayRow {
  const subjects = [...new Set(notebook.knowledgePoints.map((item) => item.subjectLabel))]
  const knowledge = notebook.knowledgePoints.map((item) => item.label).join('、') || '已选知识点'
  const duration =
    notebook.durationMinutes === null ? '不限时' : `总时间${notebook.durationMinutes}分钟`
  return {
    id: notebook.id,
    kind: 'notebook',
    examType: notebook.examType,
    questionCount: notebook.questionCount,
    title: notebook.name,
    scope: `${notebook.examType} · ${subjects.join(' + ') || '综合知识点'}`,
    knowledge,
    settings: `每次${notebook.questionCount}题 · ${DIFFICULTY_LABELS[notebook.difficultyMode] || notebook.difficultyMode} · ${duration}`,
    latestScore: notebook.latestRecord
      ? `${notebook.latestRecord.correctCount} / ${notebook.latestRecord.totalQuestions}`
      : '—',
    latestLabel: notebook.latestRecord ? '最近一次' : '尚未练习',
    completedGroups: notebook.completedGroups,
    completedQuestions: notebook.completedQuestions,
  }
}

// 临时练习聚合题库专项和一次性组卷，不伪造固定知识点配置。
function formatTemporaryRow(summary: TemporaryPracticeSummary): DisplayRow {
  return {
    id: summary.id,
    kind: 'temporary',
    examType: summary.examType,
    questionCount: 0,
    title: summary.name,
    scope: `${summary.examType} · 试题库专项与一次性组卷`,
    knowledge: '按每次选择的考纲与难度生成',
    settings: '未保存为练习本的练习记录',
    latestScore: summary.latestRecord
      ? `${summary.latestRecord.correctCount} / ${summary.latestRecord.totalQuestions}`
      : '—',
    latestLabel: summary.latestRecord ? '最近一次' : '进行中',
    completedGroups: summary.completedGroups,
    completedQuestions: summary.completedQuestions,
  }
}

// 每个展开行维护独立分页和失败状态，切换练习本时不重复读取已加载页。
function historyState(rowId: string): HistoryState {
  if (!histories[rowId]) {
    histories[rowId] = {
      loading: false,
      loaded: false,
      error: '',
      records: [],
      page: 1,
      pageSize: 5,
      total: 0,
    }
  }
  return histories[rowId]
}

// 列表请求只接受最后一次考试类型响应，避免导航快速切换产生串数据。
async function loadNotebookList(): Promise<void> {
  const requestSequence = ++listRequestSequence
  const requestedExamType = activeExamType.value
  listLoading.value = true
  listError.value = ''
  try {
    const data = await getPracticeNotebooks(requestedExamType)
    if (requestSequence !== listRequestSequence || requestedExamType !== activeExamType.value)
      return
    notebooks.value = data.notebooks
    temporaryPractice.value = data.temporaryPractice
    activePractice.value = data.activePractice
  } catch (error: unknown) {
    if (requestSequence !== listRequestSequence) return
    notebooks.value = []
    temporaryPractice.value = null
    activePractice.value = null
    listError.value = getApiErrorMessage(error, '练习本加载失败，请稍后重试')
  } finally {
    if (requestSequence === listRequestSequence) listLoading.value = false
  }
}

// 主行展开时才读取历史；收起不会丢失已经加载的当前页。
async function toggleHistory(row: DisplayRow): Promise<void> {
  if (expandedRowId.value === row.id) {
    expandedRowId.value = ''
    return
  }
  expandedRowId.value = row.id
  const state = historyState(row.id)
  if (!state.loaded && !state.loading) await loadHistory(row, 1)
}

// 普通练习本和临时练习调用各自接口，但返回同一分页结构。
async function loadHistory(row: DisplayRow, page: number): Promise<void> {
  const state = historyState(row.id)
  state.loading = true
  state.error = ''
  try {
    const data =
      row.kind === 'temporary'
        ? await getTemporaryPracticeHistory(activeExamType.value, page, state.pageSize)
        : await getPracticeNotebookHistory(row.id, page, state.pageSize)
    state.records = data.list
    state.page = data.pagination.page
    state.pageSize = data.pagination.pageSize
    state.total = data.pagination.total
    state.loaded = true
  } catch (error: unknown) {
    state.error = getApiErrorMessage(error, '历史记录加载失败，请稍后重试')
  } finally {
    state.loading = false
  }
}

// 页码变化只刷新当前展开行。
function handleHistoryPageChange(row: DisplayRow, page: number): void {
  void loadHistory(row, page)
}

// 每页数量变化后从第一页重新读取，避免页码超出新总页数。
function handleHistoryPageSizeChange(row: DisplayRow, pageSize: number): void {
  const state = historyState(row.id)
  state.pageSize = pageSize
  void loadHistory(row, 1)
}

// 行是否承接唯一进行中记录决定高亮和“继续练习”文案。
function isActiveRow(row: DisplayRow): boolean {
  if (!activePractice.value) return false
  return row.kind === 'temporary'
    ? !activePractice.value.practiceNotebookId &&
        activePractice.value.examType === activeExamType.value
    : activePractice.value.practiceNotebookId === row.id
}

// 进行中行继续原答卷，普通练习本开始新答卷，临时分组返回试题库选择范围。
function getPrimaryActionLabel(row: DisplayRow): string {
  if (isActiveRow(row)) return '继续练习'
  return row.kind === 'temporary' ? '前往试题库' : '开始练习'
}

// 后端根据练习本配置和事务内剩余额度确定最终题量，客户端不再传入可修改的数量。
async function startNotebookPractice(notebookId: string): Promise<void> {
  startingNotebookId.value = notebookId
  try {
    const result = await startPracticeNotebook(notebookId)
    await continuePractice(result.examRecordId)
  } catch (error: unknown) {
    if (hasApiErrorCode(error, 'QUESTION_BANK_IN_PROGRESS')) await loadNotebookList()
  } finally {
    startingNotebookId.value = ''
  }
}

// 开始操作先预检计划题量，免费额度部分不足时不直接创建，等待用户确认缩量练习。
async function handlePrimaryAction(row: DisplayRow): Promise<void> {
  if (isActiveRow(row) && activePractice.value) {
    await continuePractice(activePractice.value.examRecordId)
    return
  }
  if (row.kind === 'temporary') {
    await router.push('/question-bank')
    return
  }
  if (activePractice.value) {
    ElMessage.info(`已有一份 ${activePractice.value.examType} 练习尚未交卷，请先继续完成`)
    return
  }

  startingNotebookId.value = row.id
  try {
    const access = await checkMemberAccess({
      action: 'question-bank',
      examType: row.examType,
      questionCount: row.questionCount,
    })
    if (access.allowed) {
      await startNotebookPractice(row.id)
      return
    }

    const remaining = Math.max(0, access.remaining ?? 0)
    if (remaining === 0) {
      ElMessage.warning('当前免费练习题量已用完，请开通会员后继续')
      return
    }

    pendingNotebookStart.value = { notebookId: row.id }
    quotaDialogMessage.value = `当前免费练习题量不足，还可免费练习${remaining}道，是否开始`
    quotaDialogVisible.value = true
  } catch {
    // 公共请求层已统一展示网络或服务端错误，此处只阻止按钮事件产生未处理异常。
  } finally {
    startingNotebookId.value = ''
  }
}

// 用户确认后以剩余额度作为本次练习题量，不改写练习本原有的固定题量设置。
function handleConfirmReducedPractice(): void {
  const pending = pendingNotebookStart.value
  pendingNotebookStart.value = null
  if (!pending) return
  void startNotebookPractice(pending.notebookId)
}

// 取消缩量开始只清理待确认状态，练习本配置保持不变。
function handleCancelReducedPractice(): void {
  pendingNotebookStart.value = null
}

// 练习本入口通过来源参数让交卷结果和逐题解析返回本页。
async function continuePractice(examRecordId: string): Promise<void> {
  await router.push({
    path: '/practice',
    query: { examId: examRecordId, from: 'practice-notebook' },
  })
}

// 编辑复用同一配置页并由路由ID恢复服务端保存值。
function handleEditNotebook(id: string): void {
  void router.push({ name: 'practice-notebook-edit', params: { id } })
}

// 历史详情复用题库逐题解析，并固定返回练习本首页。
function handleOpenHistory(examRecordId: string): void {
  void router.push({
    name: 'exam-result-detail',
    params: { id: examRecordId },
    query: { from: 'practice-notebook', recordSource: 'question-bank' },
  })
}

// 时间使用本地化展示；缺失交卷时间时不伪造成当前时间。
function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// 用时统一显示到分钟和秒，便于与结果页核对。
function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const rest = safeSeconds % 60
  return minutes ? `${minutes}分${rest}秒` : `${rest}秒`
}

// 返回同一工作区的试题库首页，由外层布局提供向右滑动。
function handleBackToQuestionBank(): void {
  void router.push('/question-bank')
}

// 新建入口进入空白配置页。
function handleCreateNotebook(): void {
  void router.push('/practice-notebook/new')
}

// 导航栏切换考试类型后清空展开缓存并重新查询对应练习本。
watch(activeExamType, () => {
  if (!initialized) return
  expandedRowId.value = ''
  Object.keys(histories).forEach((key) => delete histories[key])
  void loadNotebookList()
})

// 首次进入先完成会员和默认考试初始化，再读取最终考试类型的数据。
onMounted(async () => {
  try {
    await auth.ensureMemberContext()
  } catch {
    // 公共请求层展示上下文失败；页面仍使用当前全局考试类型继续加载。
  }
  initialized = true
  await loadNotebookList()
})
</script>

<style scoped>
.practice-notebook {
  min-height: calc(100vh - var(--nav-height));
  color: var(--color-ink);
}

.notebook-container {
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 40px 0 96px;
}

.notebook-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.notebook-eyebrow {
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

.notebook-eyebrow::before {
  width: 24px;
  height: 1px;
  background: var(--color-ink);
  content: '';
}

.notebook-header h1 {
  margin: 0;
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
}

.notebook-header p {
  margin: 10px 0 0;
  color: var(--color-ink-soft);
}

.notebook-back {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-weight: var(--weight-semi);
  cursor: pointer;
}

.notebook-back:hover,
.notebook-back:focus-visible {
  border-color: var(--color-ink);
  background: var(--color-hover);
}

.notebook-active-other {
  min-height: 70px;
  margin-bottom: 18px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid var(--color-line);
  background: var(--color-surface);
}

.notebook-active-other > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.notebook-active-other span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.notebook-state {
  min-height: 180px;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  text-align: center;
}

.notebook-state p {
  margin: 0;
}

.notebook-state--error {
  color: var(--color-danger);
}

.notebook-list {
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.notebook-list__header,
.notebook-row {
  display: grid;
  grid-template-columns: minmax(300px, 2.2fr) minmax(280px, 1.7fr) 160px 140px 190px;
  align-items: center;
  column-gap: 24px;
}

.notebook-list__header {
  min-height: 56px;
  padding: 0 24px;
  border-bottom: 1px solid var(--color-ink);
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.notebook-row {
  position: relative;
  min-height: 150px;
  padding: 28px 24px;
  border-bottom: 1px solid var(--color-line);
  background: var(--color-surface);
  cursor: pointer;
  outline: none;
}

.notebook-row:hover,
.notebook-row:focus-visible,
.notebook-row--expanded {
  background: var(--color-hover);
}

.notebook-row--active::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: var(--color-success);
  content: '';
}

.notebook-row__identity,
.notebook-row__settings,
.notebook-row__metric {
  min-width: 0;
}

.notebook-row__identity h2 {
  margin: 0;
  overflow: hidden;
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notebook-row__identity p,
.notebook-row__settings p {
  margin: 8px 0 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.notebook-row__expand {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 12px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.notebook-row__settings strong {
  display: block;
  overflow: hidden;
  font-size: var(--text-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notebook-row__metric {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notebook-row__metric strong {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  font-variant-numeric: tabular-nums;
}

.notebook-row__metric small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.notebook-row__actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
}

.notebook-row__actions button {
  min-width: 0;
  height: 44px;
  padding-inline: 14px;
  white-space: nowrap;
}

.notebook-history {
  padding: 18px 24px 22px 48px;
  border-bottom: 1px solid var(--color-line);
  background: var(--color-surface-alt);
  overflow: hidden;
}

.history-state {
  min-height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.history-state--error {
  color: var(--color-danger);
}

.history-state button,
.history-record button {
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  font-weight: var(--weight-semi);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.history-table__header,
.history-record {
  display: grid;
  grid-template-columns: minmax(200px, 1.5fr) 130px 120px 130px 100px;
  align-items: center;
  gap: 20px;
}

.history-table__header {
  min-height: 38px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.history-record {
  min-height: 56px;
  border-top: 1px solid var(--color-line-soft);
  font-size: var(--text-sm);
}

.history-record strong {
  font-variant-numeric: tabular-nums;
}

.history-expand-enter-active,
.history-expand-leave-active {
  transition: all 180ms ease;
}

.history-expand-enter-from,
.history-expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.notebook-create-section {
  margin-top: 30px;
  padding: 22px 0;
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
}

.notebook-create-card {
  width: 100%;
  min-height: 112px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border: 1px dashed var(--color-line-strong, #bcc9d8);
  border-radius: 0;
  background: var(--color-surface-alt);
  color: var(--color-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.notebook-create-card:hover,
.notebook-create-card:focus-visible {
  border-color: var(--color-active);
  background: var(--color-hover);
}

.notebook-create-card__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--color-line);
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-active);
  font-size: 24px;
}

.notebook-create-card__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notebook-create-card__copy strong {
  font-size: var(--text-base);
  font-weight: var(--weight-bold);
}

.notebook-create-card__copy small {
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

@media (max-width: 900px) {
  .notebook-header {
    align-items: flex-start;
  }

  .notebook-list {
    overflow-x: auto;
  }

  .notebook-list__header,
  .notebook-row,
  .notebook-history {
    min-width: 1120px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .history-expand-enter-active,
  .history-expand-leave-active {
    transition-duration: 1ms;
  }
}
</style>
