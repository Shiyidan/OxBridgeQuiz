<!-- 我的练习册统一页面：管理列表、新建和编辑状态，并保留列表范围与历史展开状态。 -->
<template>
  <div ref="notebookRef" class="practice-notebook">
    <PracticeNotebookEditor
      v-if="showEditor"
      :key="editorKey"
      :notebook-id="editingNotebookId"
      :prefill="route.query"
      :return-button-label="editorReturnLabel"
      @close="closeEditor"
      @saved="handleEditorSaved"
      @invalidated="leaveInvalidEditor"
    />
    <main v-else class="notebook-container">
      <header class="notebook-header">
        <div>
          <h1>我的练习册</h1>
          <p>保存常用组卷规则，集中查看每次练习和历史结果。</p>
        </div>
        <AppButton :icon="Plus" @click="handleCreateNotebook">新建练习册</AppButton>
      </header>
      <div v-if="relatedCode" class="notebook-scope" role="status">
        <span>当前筛选：{{ relatedLabel }}相关练习册</span
        ><AppButton type="text" size="small" @click="clearRelatedScope">查看全部练习册</AppButton>
      </div>
      <p v-if="!listLoading && !listError && !displayRows.length" class="notebook-state">
        {{
          relatedCode
            ? '暂无包含这个知识点的练习册，可新建专题练习册。'
            : '还没有练习册，先创建一套常用练习规则。'
        }}
      </p>

      <section v-if="unlistedActivePractice" class="notebook-active-other">
        <div>
          <strong>你有一份 {{ unlistedActivePractice.examType }} 练习尚未交卷</strong>
          <span
            >已答 {{ unlistedActivePractice.answeredCount }}/{{
              unlistedActivePractice.totalQuestions
            }}
            题</span
          >
        </div>
        <AppButton @click="continuePractice(unlistedActivePractice.examRecordId)">
          继续练习
        </AppButton>
      </section>

      <section v-if="listLoading" class="notebook-state">正在加载练习册...</section>
      <section v-else-if="listError" class="notebook-state notebook-state--error">
        <p>{{ listError }}</p>
        <AppButton type="secondary" size="small" @click="loadNotebookList">重新加载</AppButton>
      </section>
      <section v-else-if="displayRows.length" class="notebook-list" aria-label="练习册列表">
        <div class="notebook-list__header" aria-hidden="true">
          <span>练习册</span>
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
              <AppButton type="secondary" size="small" @click="handleEditNotebook(row.id)">
                编辑
              </AppButton>
              <AppButton
                size="small"
                :loading="startingNotebookId === row.id"
                @click="handlePrimaryAction(row)"
              >
                {{ getPrimaryActionLabel(row) }}
              </AppButton>
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
                <AppButton
                  type="link"
                  size="small"
                  @click="loadHistory(row, historyState(row.id).page)"
                >
                  重试
                </AppButton>
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
                    <AppButton type="link" size="small" @click="handleOpenHistory(record.id)"
                      >查看详情</AppButton
                    >
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
    </main>

    <DailyCardAccessDialog
      v-model="upgradeDialogVisible"
      :exam-type="paymentExamType"
      upgrade-message="试题库为会员专享，开通当前考试类型的会员后即可不限题量练习。"
      @activated="handleDailyCardActivated"
      @upgrade="handleOpenPayment"
      @cancel="handleCancelMembershipAccess"
    />

    <PaymentModal
      :model-value="paymentVisible"
      :default-exam-type="paymentExamType"
      @update:model-value="handlePaymentVisibilityChange"
      @paid="handlePaymentSuccess"
    />
    <AnalysisMembershipDialog
      v-model="analysisMembershipOpen"
      :exam-type="analysisExamType"
      @renewed="resumeAnalysis"
    />
  </div>
</template>

<script setup lang="ts">
import AnalysisMembershipDialog from '@/components/AnalysisMembershipDialog.vue'
import { useAnalysisMembershipAccess } from '@/composables/useAnalysisMembershipAccess'
import AppButton from '@/components/AppButton.vue'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLearningWorkspaceStore } from '@/stores/learningWorkspace'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import AppPagination from '@/components/AppPagination.vue'
import DailyCardAccessDialog from '@/components/DailyCardAccessDialog.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import PracticeNotebookEditor from '@/components/practiceNotebook/PracticeNotebookEditor.vue'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import { checkMemberAccess, getMember } from '@/api/member'
import { createLoginRequiredRouteLocation } from '@/utils/authRedirect'
import {
  getPracticeNotebookHistory,
  getPracticeNotebooks,
  startPracticeNotebook,
  type ActiveNotebookPractice,
  type PracticeHistoryRecord,
  type PracticeNotebookSummary,
} from '@/api/practiceNotebook'
import { getApiErrorMessage, hasApiErrorCode } from '@/utils/request'

interface DisplayRow {
  id: string
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
const route = useRoute()
const workspace = useLearningWorkspaceStore()
const { analysisMembershipOpen, analysisExamType, checkAnalysisAccess, resumeAnalysis } =
  useAnalysisMembershipAccess()
const auth = useAuthStore()
const notebooks = ref<PracticeNotebookSummary[]>([])
const activePractice = ref<ActiveNotebookPractice | null>(null)
const listLoading = ref(true)
const listError = ref('')
const expandedRowId = ref('')
const startingNotebookId = ref('')
const upgradeDialogVisible = ref(false)
const paymentVisible = ref(false)
const paymentExamType = ref<ActiveExamType>(auth.activeExamType)
const pendingNotebookStart = ref<{ notebookId: string; examType: ActiveExamType } | null>(null)
const histories = reactive<Record<string, HistoryState>>({})
const notebookRef = ref<HTMLElement>()
let listRequestSequence = 0
let initialized = false
let listScrollTop = 0
let listContextVersion = 0

// 原列表、新建和编辑地址统一由本页面管理，仍支持刷新和直接分享。
const showEditor = computed(
  () => route.name === 'practice-notebook-new' || route.name === 'practice-notebook-edit',
)
// 编辑 ID 仅来自编辑路由，新建时始终使用空白表单或来源预填。
const editingNotebookId = computed(() =>
  route.name === 'practice-notebook-edit' ? String(route.params.id || '') : '',
)
// 不同账号、对象和来源使用独立表单，避免沿用上一份未保存配置。
const editorKey = computed(() => JSON.stringify([auth.user?.id, route.fullPath]))

// 返回地址只允许已知业务页面，编辑器不能自行拼接任意跳转目标。
const editorReturn = computed(() => {
  const source = typeof route.query.source === 'string' ? route.query.source : ''
  const value = typeof route.query.returnTo === 'string' ? route.query.returnTo : ''
  if (source === 'knowledge-graph') {
    const path = /^\/knowledge-graph(?:\?.*)?$/.test(value) ? value : '/knowledge-graph'
    return {
      path,
      savePath: path,
      label: auth.activeExamType === 'ESAT' ? '返回学习总览' : '返回题库练习',
    }
  }
  if (source === 'question-bank') {
    const path = /^\/question-bank(?:\?.*)?$/.test(value) ? value : '/question-bank'
    return { path, savePath: path, label: '返回题库练习' }
  }
  if (
    source === 'diagnostic-report' &&
    /^\/exam-result\/[^/]+\/(?:esat|tmua)(?:\?.*)?$/.test(value)
  )
    return { path: value, savePath: '/practice-notebook', label: '返回诊断报告' }
  const path = /^\/practice-notebook(?:\?.*)?$/.test(value) ? value : '/practice-notebook'
  return { path, savePath: path, label: '返回练习册' }
})
// 明确表单返回入口，保留图谱和报告来源的原有行为。
const editorReturnLabel = computed(() => editorReturn.value.label)

// 取消只恢复来源页面或列表，不保存当前表单。
function closeEditor(): void {
  void router.push(editorReturn.value.path)
}
// 保存成功由列表模式监听刷新数据，图谱来源继续返回原知识点。
function handleEditorSaved(): void {
  void router.push(editorReturn.value.savePath)
}
// 编辑对象不可访问或考试被切换时回到当前考试的练习册列表。
function leaveInvalidEditor(): void {
  void router.replace('/practice-notebook')
}

// 练习册首页允许游客查看入口，涉及个人配置和作答时再要求登录。
function requireLoginForNotebookAction(targetPath: string): boolean {
  if (auth.isLoggedIn) return false
  void router.push(createLoginRequiredRouteLocation(targetPath))
  return true
}

const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)

// 练习册页只展示用户保存的可复用组卷规则，临时练习由独立记录页承接。
const relatedCode = computed(() =>
  typeof route.query.knowledgeCode === 'string' ? route.query.knowledgeCode : '',
)
// 只有显式的相关入口启用过滤，不继承顶部科目选择造成隐形限制。
const relatedLabel = computed(
  () =>
    workspace.index.get(relatedCode.value)?.node.cn_label ||
    notebooks.value
      .flatMap((book) => book.knowledgePoints)
      .find((item) => item.code === relatedCode.value)?.label ||
    '所选知识点',
)
// 相关入口只筛选保存范围中包含该知识点的练习册。
const displayRows = computed<DisplayRow[]>(() =>
  notebooks.value
    .filter((book) => !relatedCode.value || book.knowledgePointCodes.includes(relatedCode.value))
    .map(formatNotebookRow),
)
// 清除范围后恢复所有练习册，保留真实历史与进行中的练习。
function clearRelatedScope(): void {
  void router.replace('/practice-notebook')
}

// 不属于当前可见练习册的活动答卷单独提示，避免临时练习阻塞新练习却没有反馈。
const unlistedActivePractice = computed(() => {
  const practice = activePractice.value
  if (!practice) return null
  return displayRows.value.some((notebook) => notebook.id === practice.practiceNotebookId)
    ? null
    : practice
})

// 练习册知识点快照用于稳定显示学科和规则摘要，不依赖考纲后续改名。
function formatNotebookRow(notebook: PracticeNotebookSummary): DisplayRow {
  const subjects = [...new Set(notebook.knowledgePoints.map((item) => item.subjectLabel))]
  const knowledge = notebook.knowledgePoints.map((item) => item.label).join('、') || '已选知识点'
  const duration =
    notebook.durationMinutes === null ? '不限时' : `总时间${notebook.durationMinutes}分钟`
  return {
    id: notebook.id,
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

// 每个展开行维护独立分页和失败状态，切换练习册时不重复读取已加载页。
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
  if (route.name !== 'practice-notebook' || !auth.isLoggedIn) return
  const requestSequence = ++listRequestSequence
  const requestedExamType = activeExamType.value
  listLoading.value = true
  listError.value = ''
  try {
    const data = await getPracticeNotebooks(requestedExamType)
    if (requestSequence !== listRequestSequence || requestedExamType !== activeExamType.value)
      return
    notebooks.value = data.notebooks
    activePractice.value = data.activePractice
    const id = typeof route.query.notebookId === 'string' ? route.query.notebookId : ''
    const target = displayRows.value.find((row) => row.id === id)
    if (target && expandedRowId.value !== target.id) await toggleHistory(target)
  } catch (error: unknown) {
    if (requestSequence !== listRequestSequence) return
    notebooks.value = []
    activePractice.value = null
    listError.value = getApiErrorMessage(error, '练习册加载失败，请稍后重试')
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

// 展开练习册时按练习册 ID 读取独立历史分页。
async function loadHistory(row: DisplayRow, page: number): Promise<void> {
  const state = historyState(row.id)
  state.loading = true
  state.error = ''
  try {
    const data = await getPracticeNotebookHistory(row.id, page, state.pageSize)
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
  return activePractice.value.practiceNotebookId === row.id
}

// 进行中行继续原答卷，其余练习册按保存配置开始新答卷。
function getPrimaryActionLabel(row: DisplayRow): string {
  if (isActiveRow(row)) return '继续练习'
  return '开始练习'
}

// 后端根据练习册配置生成题目，并在事务内复核当前考试的会员资格。
async function startNotebookPractice(notebookId: string): Promise<void> {
  const request = listContextVersion
  startingNotebookId.value = notebookId
  try {
    const result = await startPracticeNotebook(notebookId)
    if (request !== listContextVersion) return
    await continuePractice(result.examRecordId)
  } catch (error: unknown) {
    if (hasApiErrorCode(error, 'QUESTION_BANK_IN_PROGRESS')) await loadNotebookList()
  } finally {
    if (request === listContextVersion) startingNotebookId.value = ''
  }
}

// 开始操作先检查当前考试的有效会员，未解锁时保留选择并引导开通。
async function handlePrimaryAction(row: DisplayRow): Promise<void> {
  if (requireLoginForNotebookAction('/practice-notebook')) return
  if (isActiveRow(row) && activePractice.value) {
    await continuePractice(activePractice.value.examRecordId)
    return
  }
  if (activePractice.value) {
    ElMessage.info(`已有一份 ${activePractice.value.examType} 练习尚未交卷，请先继续完成`)
    return
  }

  const request = listContextVersion
  startingNotebookId.value = row.id
  try {
    const access = await checkMemberAccess({
      action: 'question-bank',
      examType: row.examType,
      questionCount: row.questionCount,
    })
    if (request !== listContextVersion) return
    if (access.allowed) {
      await startNotebookPractice(row.id)
      return
    }

    pendingNotebookStart.value = { notebookId: row.id, examType: row.examType }
    paymentExamType.value = row.examType
    upgradeDialogVisible.value = true
  } catch {
    // 公共请求层已统一展示网络或服务端错误，此处只阻止按钮事件产生未处理异常。
  } finally {
    if (request === listContextVersion) startingNotebookId.value = ''
  }
}

// 日卡启用后直接承接此前被冻结的练习册，不要求用户再次查找并点击。
async function handleDailyCardActivated(): Promise<void> {
  const request = listContextVersion
  const pending = pendingNotebookStart.value
  pendingNotebookStart.value = null
  if (!pending) return
  await loadNotebookList()
  if (request !== listContextVersion) return
  if (activePractice.value) {
    ElMessage.info(`已有一份 ${activePractice.value.examType} 练习尚未交卷，请先继续完成`)
    return
  }
  const notebook = displayRows.value.find(
    (item) => item.id === pending.notebookId && item.examType === pending.examType,
  )
  if (!notebook) {
    ElMessage.info('练习册状态已更新，请重新选择。')
    return
  }
  await startNotebookPractice(pending.notebookId)
}

// 用户关闭会员拦截时清除冻结操作，避免后续误启动旧练习册。
function handleCancelMembershipAccess(): void {
  pendingNotebookStart.value = null
}

// 没有可用日卡或用户主动升级时再进入支付，并保留当前练习册页面。
function handleOpenPayment(): void {
  upgradeDialogVisible.value = false
  paymentVisible.value = true
}

// 未完成购买便关闭收银台时结束此前冻结的练习册意图。
function handlePaymentVisibilityChange(visible: boolean): void {
  paymentVisible.value = visible
  if (!visible) pendingNotebookStart.value = null
}

// 支付完成后刷新会员上下文和练习册列表，使原操作可以立即重新发起。
async function handlePaymentSuccess(): Promise<void> {
  const request = listContextVersion
  paymentVisible.value = false
  try {
    const context = await getMember()
    if (request !== listContextVersion) return
    auth.setMemberContext(context)
    if (pendingNotebookStart.value) {
      await handleDailyCardActivated()
    } else {
      await loadNotebookList()
    }
  } catch {
    // 支付组件已确认成功，公共请求层负责提示权益刷新失败。
  }
}

// 临时活动答卷返回练习记录，其余练习册答卷保持返回当前页面。
async function continuePractice(examRecordId: string): Promise<void> {
  const isTemporaryActivePractice =
    activePractice.value?.examRecordId === examRecordId && !activePractice.value.practiceNotebookId
  await router.push({
    path: '/practice',
    query: {
      examId: examRecordId,
      from: isTemporaryActivePractice ? 'practice-records' : 'practice-notebook',
    },
  })
}

// 编辑复用同一配置页并由路由ID恢复服务端保存值。
function handleEditNotebook(id: string): void {
  listScrollTop = window.scrollY
  void router.push({
    name: 'practice-notebook-edit',
    params: { id },
    query: { source: 'practice-notebook', returnTo: route.fullPath },
  })
}

// 历史详情复用题库逐题解析，并固定返回练习册首页。
function handleOpenHistory(examRecordId: string): void {
  void checkAnalysisAccess(examRecordId, () =>
    router.push({
      name: 'exam-result-detail',
      params: { id: examRecordId },
      query: { from: 'practice-notebook', recordSource: 'question-bank' },
    }),
  )
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

// 新建入口进入空白配置页。
function handleCreateNotebook(): void {
  listScrollTop = window.scrollY
  const path = router.resolve({
    path: '/practice-notebook/new',
    query: {
      source: 'practice-notebook',
      returnTo: route.fullPath,
      ...(relatedCode.value
        ? {
            knowledgePointCodes: relatedCode.value,
            name: relatedLabel.value + '专项练习',
          }
        : {}),
    },
  }).fullPath
  if (requireLoginForNotebookAction(path)) return
  void router.push(path)
}

// 导航栏切换考试类型后清空展开缓存并重新查询对应练习册。
watch(
  () => [activeExamType.value, auth.user?.id, auth.isLoggedIn],
  () => {
    listContextVersion += 1
    listRequestSequence++
    notebooks.value = []
    activePractice.value = null
    if (!initialized) return
    expandedRowId.value = ''
    upgradeDialogVisible.value = false
    if (!paymentVisible.value) paymentExamType.value = activeExamType.value
    pendingNotebookStart.value = null
    Object.keys(histories).forEach((key) => delete histories[key])
    if (!auth.isLoggedIn) {
      listLoading.value = false
      return
    }
    void loadNotebookList()
  },
)

// 表单只是练习册的内部状态，返回列表后刷新规则并恢复列表位置。
watch(showEditor, async (editing) => {
  const request = ++listContextVersion
  listRequestSequence += 1
  upgradeDialogVisible.value = paymentVisible.value = analysisMembershipOpen.value = false
  pendingNotebookStart.value = null
  startingNotebookId.value = ''
  if (editing) {
    await nextTick()
    if (request === listContextVersion)
      notebookRef.value?.scrollIntoView({ behavior: 'auto', block: 'start' })
    return
  }
  if (!initialized) return
  await loadNotebookList()
  await nextTick()
  if (request === listContextVersion) window.scrollTo({ top: listScrollTop, behavior: 'auto' })
})

// 页面销毁后，历史请求和开始练习的回调不能继续改变导航。
onBeforeUnmount(() => {
  listRequestSequence += 1
  listContextVersion += 1
})

// 首次进入先完成会员和默认考试初始化，再读取最终考试类型的数据。
onMounted(async () => {
  if (!auth.isLoggedIn) {
    initialized = true
    listLoading.value = false
    return
  }
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
.notebook-scope {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--color-learning-blue);
}

.practice-notebook {
  color: var(--color-ink);
  scroll-margin-top: calc(var(--nav-height) + 20px);
}

.notebook-container {
  width: 100%;
  margin: 0;
  padding: 0;
}

.notebook-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.notebook-header h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.4;
  font-weight: var(--weight-bold);
}

.notebook-header p {
  margin: 6px 0 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.5;
}

.notebook-active-other {
  min-height: 60px;
  margin-bottom: 12px;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--color-line);
  background: var(--color-surface);
}

.notebook-active-other > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notebook-active-other span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.notebook-state {
  min-height: 120px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
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
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1.7fr) 100px 90px 174px;
  align-items: center;
  column-gap: 16px;
}

.notebook-list__header {
  min-height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid var(--color-line);
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.notebook-row {
  position: relative;
  min-height: 108px;
  padding: 16px 12px;
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
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notebook-row__identity p,
.notebook-row__settings p {
  margin: 4px 0 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.notebook-row__expand {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
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
  gap: 4px;
}

.notebook-row__metric strong {
  font-size: var(--text-xl);
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
  flex-wrap: wrap;
  gap: 8px;
}

.notebook-history {
  padding: 12px 12px 16px 24px;
  border-bottom: 1px solid var(--color-line);
  background: var(--color-surface-alt);
  overflow: hidden;
}

.history-state {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.history-state--error {
  color: var(--color-danger);
}

.history-table__header,
.history-record {
  display: grid;
  grid-template-columns: minmax(180px, 1.5fr) 110px 100px 110px 90px;
  align-items: center;
  gap: 16px;
}

.history-table__header {
  min-height: 32px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.history-record {
  min-height: 44px;
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

@media (max-width: 860px) {
  .practice-notebook {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow-x: clip;
  }

  .notebook-container {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 0;
  }

  .notebook-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }

  .notebook-header p {
    max-width: 100%;
  }

  .notebook-active-other {
    align-items: stretch;
    flex-direction: column;
    padding: 12px;
  }

  .notebook-state {
    min-height: 120px;
    padding: 20px 12px;
  }

  .notebook-list {
    min-width: 0;
    overflow: visible;
  }

  .notebook-list__header {
    display: none;
  }

  .notebook-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    min-width: 0;
    min-height: 0;
    padding: 16px 12px;
  }

  .notebook-row__identity,
  .notebook-row__settings,
  .notebook-row__actions {
    grid-column: 1 / -1;
  }

  .notebook-row__identity h2,
  .notebook-row__settings strong {
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
  }

  .notebook-row__metric {
    gap: 5px;
    padding: 8px;
    border: 1px solid var(--color-line-soft);
    background: var(--color-surface-alt);
  }

  .notebook-row__metric strong {
    font-size: var(--text-xl);
  }

  .notebook-row__actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .notebook-history {
    min-width: 0;
    padding: 12px;
    overflow: visible;
  }

  .history-table__header {
    display: none;
  }

  .history-record {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
    min-height: 0;
    padding: 12px 0;
  }

  .history-record > span,
  .history-record > strong {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
    overflow-wrap: anywhere;
  }

  .history-record > span::before,
  .history-record > strong::before {
    color: var(--color-ink-muted);
    font-size: var(--text-xs);
    font-weight: var(--weight-regular);
  }

  .history-record > span:nth-child(1)::before {
    content: '交卷时间';
  }

  .history-record > strong:nth-child(2)::before {
    content: '成绩';
  }

  .history-record > span:nth-child(3)::before {
    content: '正确率';
  }

  .history-record > span:nth-child(4)::before {
    content: '用时';
  }

  .history-record button {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .notebook-history :deep(.app-pagination) {
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 420px) {
  .notebook-row__actions {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .history-expand-enter-active,
  .history-expand-leave-active {
    transition-duration: 1ms;
  }
}
</style>
