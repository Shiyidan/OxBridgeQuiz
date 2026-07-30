<!-- 诊断测试首页：按试卷交付方式进入连续作答或分段诊断流程。 -->
<template>
  <div class="assessment-page">
    <NavBar />
    <main class="assessment-shell">
      <header class="page-header">
        <div class="page-header__lead">
          <span class="page-eyebrow">Diagnostic Assessment</span>
          <h1>诊断测试中心</h1>
          <p>{{ assessmentSubtitle }}</p>
        </div>
      </header>

      <section class="paper-filter-bar" aria-label="诊断试卷筛选">
        <div class="paper-filter-bar__title">
          <span>Diagnostic Papers</span>
          <strong>{{ activeExamType }} 历年真题诊断卷</strong>
        </div>
        <div class="paper-filter-bar__controls">
          <div class="paper-filter-control">
            <span>完成状态</span>
            <el-segmented
              v-model="activeStatusFilter"
              class="status-filter"
              :options="statusFilterOptions"
              aria-label="按完成状态筛选诊断试卷"
            />
          </div>
          <div class="paper-filter-control paper-filter-control--chart">
            <span>分数趋势</span>
            <el-switch
              v-model="showScoreTrend"
              inline-prompt
              aria-label="显示或隐藏历次诊断测试分数变化折线图"
            />
          </div>
        </div>
      </section>

      <section v-if="showScoreTrend" class="chart-card">
        <div class="chart-title">
          <div>
            <span>Score Trend</span>
            <strong>{{ scoreTrendTitle }}</strong>
          </div>
        </div>
        <div v-if="scoreTrendLoading" class="score-chart-state">正在加载分数趋势...</div>
        <div v-else-if="scoreTrendError" class="score-chart-state score-chart-state--error">
          <span>{{ scoreTrendError }}</span>
          <button type="button" class="button_cancel" @click="loadScoreTrend">重新加载</button>
        </div>
        <div v-else-if="!scoreTrend?.points.length" class="score-chart-state">
          暂无已完成的 {{ activeExamType }} 诊断测试成绩
        </div>
        <div
          v-else
          ref="chartRef"
          class="score-chart"
          :aria-label="`${activeExamType} 诊断测试每日最新分数堆叠折线图`"
        ></div>
      </section>

      <section class="paper-grid" aria-label="历年真题">
        <article
          v-for="item in filteredDiagnosticTests"
          :key="item.id"
          class="paper-card"
          :class="{
            'paper-card--unavailable': !isPaperAvailable(item),
            'paper-card--locked': isPaperLocked(item) && item.testStatus !== 'completed',
          }"
        >
          <div
            v-if="isPaperLocked(item) && item.testStatus !== 'completed'"
            class="paper-card__lock-overlay"
            :aria-label="`${item.examType} 会员专享试卷`"
            @click.stop
          >
            <div class="paper-card__lock-marker">
              <el-icon><Lock /></el-icon>
              <!-- <span>会员专享</span> -->
            </div>
            <div class="paper-card__lock-actions">
              <button
                v-if="item.completedAttemptCount > 0"
                class="paper-card__locked-history-button"
                type="button"
                @click.stop="openPaperHistory(item)"
              >
                历次记录（{{ item.completedAttemptCount }}）
              </button>
              <button
                class="paper-card__unlock-button"
                type="button"
                @click.stop="handleUpgradeClick(item.examType)"
              >
                开通会员
              </button>
            </div>
          </div>

          <div class="paper-card__heading">
            <div class="paper-card__topline">
              <span
                class="paper-card__badge"
                :class="`paper-card__badge--${paperStatusTone(item)}`"
              >
                {{ paperStatusLabel(item) }}
              </span>
              <div class="paper-card__identity" aria-label="考试类型和年份">
                <span
                  class="paper-card__exam-type"
                  :class="`paper-card__exam-type--${String(item.examType || '').toLowerCase()}`"
                >
                  {{ item.examType || 'TMUA' }}
                </span>
                <span class="paper-card__year">{{ item.year }}</span>
              </div>
            </div>
            <h2 :title="item.title">{{ item.title }}</h2>
            <SubjectModuleTags
              v-if="item.modules?.length"
              class="paper-card__subject-tags"
              :modules="item.modules"
              align="start"
            />
          </div>

          <div class="paper-card__footer">
            <div
              v-if="item.testStatus === 'completed' && item.correctCount !== null"
              class="paper-card__score"
            >
              <strong>{{ item.correctCount }}/{{ item.totalQuestions }}</strong>
              <span v-if="isReportGenerating(item)">报告 {{ item.reportProgress }}%</span>
              <span v-else>题正确</span>
            </div>
            <div v-else-if="item.testStatus === 'in_progress'" class="paper-card__progress">
              <span>当前进度：</span>
              <strong>{{ currentProgressLabel(item) }}</strong>
            </div>
            <div class="paper-card__actions">
              <button
                v-if="item.testStatus === 'completed' && isPaperPublished(item)"
                class="paper-card__button paper-card__button--secondary button_cancel"
                type="button"
                :disabled="isPaperLocked(item) || startingPaperId === item.id"
                @click="handleRetestPaper(item)"
              >
                重新测试
              </button>
              <button
                class="paper-card__button button_primary"
                type="button"
                :disabled="
                  (isPaperLocked(item) && item.testStatus !== 'completed') ||
                  startingPaperId === item.id
                "
                @click="handlePaperAction(item)"
              >
                {{ startingPaperId === item.id ? '正在检查...' : paperActionLabel(item) }}
              </button>
            </div>
          </div>
        </article>
      </section>

      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!filteredDiagnosticTests.length" class="empty-state">
        {{ emptyPaperMessage }}
      </div>
    </main>

    <el-dialog
      v-model="historyDialogVisible"
      width="860px"
      class="diagnostic-history-dialog"
      :title="historyPaper ? `${historyPaper.title} · 历次诊断记录` : '历次诊断记录'"
      destroy-on-close
      align-center
    >
      <div v-if="historyLoading" class="diagnostic-history__state">正在加载历次记录...</div>
      <div
        v-else-if="historyError"
        class="diagnostic-history__state diagnostic-history__state--error"
      >
        <p>{{ historyError }}</p>
        <button type="button" class="button_cancel" @click="loadPaperHistory">重新加载</button>
      </div>
      <div v-else-if="!historyRecords.length" class="diagnostic-history__state">
        暂无已完成的诊断记录
      </div>
      <div v-else class="diagnostic-history">
        <article
          v-for="record in historyRecords"
          :key="record.examRecordId"
          class="diagnostic-history__item"
        >
          <div class="diagnostic-history__heading">
            <strong>第 {{ record.attemptNumber }} 次诊断</strong>
            <span
              class="diagnostic-history__status"
              :class="`diagnostic-history__status--${historyReportTone(record)}`"
            >
              {{ historyReportLabel(record) }}
            </span>
          </div>
          <dl class="diagnostic-history__metrics">
            <div>
              <dt>交卷时间</dt>
              <dd>{{ formatDateTime(record.submittedAt) }}</dd>
            </div>
            <div>
              <dt>成绩</dt>
              <dd>{{ record.correctCount }}/{{ record.totalQuestions }} 题正确</dd>
            </div>
            <div>
              <dt>作答用时</dt>
              <dd>{{ formatDuration(record.durationSeconds) }}</dd>
            </div>
            <div>
              <dt>报告时间</dt>
              <dd>{{ formatReportTime(record) }}</dd>
            </div>
          </dl>
          <button
            type="button"
            class="diagnostic-history__action"
            :class="record.hasReport ? 'button_primary' : 'button_cancel'"
            @click="handleHistoryAction(record)"
          >
            {{ historyActionLabel(record) }}
          </button>
        </article>
        <AppPagination
          :page="historyPage"
          :page-size="historyPageSize"
          :page-sizes="[5, 10, 20]"
          :total="historyTotal"
          layout="total, sizes, prev, pager, next"
          @page-change="handleHistoryPageChange"
          @page-size-change="handleHistoryPageSizeChange"
        />
      </div>
    </el-dialog>

    <PaymentModal
      v-model="paymentVisible"
      :default-exam-type="paymentExamType"
      @paid="handlePaymentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
// 诊断测试中心：展示试卷权益、历史趋势和真题套卷入口。
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import NavBar from '@/components/NavBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import SubjectModuleTags from '@/components/SubjectModuleTags.vue'
import { getMember } from '@/api/member'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import { getExamUnavailableMessage, isExamTypeAvailable } from '@/constants/examTypes'
import { PAPER_ACCESS_TIER } from '@/constants/paperTypes'
import {
  getAssessmentPaperHistory,
  getAssessmentPapersData,
  getAssessmentScoreTrend,
  type AssessmentPaperHistoryItem,
  type AssessmentPaperItem,
  type AssessmentScoreTrendResult,
} from '@/api/papers'
import { getApiErrorMessage } from '@/utils/request'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const startingPaperId = ref('')
const diagnosticTests = ref<AssessmentPaperItem[]>([])
const historyDialogVisible = ref(false)
const historyLoading = ref(false)
const historyError = ref('')
const historyPaper = ref<AssessmentPaperItem | null>(null)
const historyRecords = ref<AssessmentPaperHistoryItem[]>([])
const historyPage = ref(1)
const historyPageSize = ref(5)
const historyTotal = ref(0)
const paymentVisible = ref(false)
const paymentExamType = ref<string>(auth.activeExamType)
const chartRef = ref<HTMLDivElement | null>(null)
const scoreTrend = ref<AssessmentScoreTrendResult | null>(null)
const scoreTrendLoading = ref(true)
const scoreTrendError = ref('')
let chartInstance: echarts.ECharts | null = null
let assessmentInitialized = false
let assessmentLoadSequence = 0
let scoreTrendLoadSequence = 0

type AssessmentStatusFilter = 'ALL' | 'not_started' | 'in_progress' | 'completed'

const activeStatusFilter = ref<AssessmentStatusFilter>('ALL')
const showScoreTrend = ref(true)
const statusFilterOptions: Array<{ label: string; value: AssessmentStatusFilter }> = [
  { label: '全部', value: 'ALL' },
  { label: '待开始', value: 'not_started' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
]

// 诊断中心统一读取导航栏的全局考试类型，不再维护页面级考试选择。
const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)

// ESAT 采用科目独立标准分，TMUA 采用综合分，标题明确两种评分口径。
const scoreTrendTitle = computed(() =>
  activeExamType.value === 'ESAT'
    ? 'ESAT 每日最新诊断测试科目分数变化'
    : 'TMUA 每日最新诊断测试综合分数变化',
)

// 页面说明随全局考试类型切换，避免同时描述两套不同的模块结构。
const assessmentSubtitle = computed(() =>
  activeExamType.value === 'ESAT'
    ? '选择 ESAT 历年真题诊断卷，按科目模块完成在线测试。'
    : '选择 TMUA 历年真题诊断卷，按 Paper 1/2 完成在线测试。',
)

// 数据源已由后端限定考试类型，页面只保留与考试类型无关的完成状态筛选。
const filteredDiagnosticTests = computed(() => {
  return diagnosticTests.value.filter((paper) => {
    const matchesExamType = String(paper.examType || '').toUpperCase() === activeExamType.value
    const matchesStatus =
      activeStatusFilter.value === 'ALL' || paper.testStatus === activeStatusFilter.value
    return matchesExamType && matchesStatus
  })
})

// 空状态区分“尚无任何试卷”和“当前考试类型暂无试卷”，避免误导后台发布状态。
const emptyPaperMessage = computed(() => {
  if (activeStatusFilter.value === 'ALL') {
    return `暂无已上线的 ${activeExamType.value} 诊断试卷，请先在后台真题库发布试卷。`
  }
  return `${activeExamType.value} 当前完成状态下暂无诊断试卷。`
})

// 每次只请求当前全局考试类型，并丢弃快速切换后延迟返回的旧响应。
async function loadAssessmentPapers(): Promise<void> {
  const requestSequence = ++assessmentLoadSequence
  const requestedExamType = activeExamType.value
  loading.value = true
  diagnosticTests.value = []
  try {
    const data = await getAssessmentPapersData(requestedExamType)
    if (requestSequence !== assessmentLoadSequence || requestedExamType !== activeExamType.value) {
      return
    }
    diagnosticTests.value = data.list || []
  } catch {
    if (requestSequence === assessmentLoadSequence) diagnosticTests.value = []
  } finally {
    if (requestSequence === assessmentLoadSequence) loading.value = false
  }
}

// 趋势接口独立刷新，并丢弃快速切换考试类型后返回的旧成绩响应。
async function loadScoreTrend(): Promise<void> {
  const requestSequence = ++scoreTrendLoadSequence
  const requestedExamType = activeExamType.value
  scoreTrendLoading.value = true
  scoreTrendError.value = ''
  scoreTrend.value = null
  chartInstance?.dispose()
  chartInstance = null
  try {
    const data = await getAssessmentScoreTrend(requestedExamType)
    if (requestSequence !== scoreTrendLoadSequence || requestedExamType !== activeExamType.value) {
      return
    }
    scoreTrend.value = data
  } catch (error: unknown) {
    if (requestSequence !== scoreTrendLoadSequence) return
    scoreTrendError.value = getApiErrorMessage(error, '分数趋势加载失败，请稍后重试。')
  } finally {
    if (requestSequence !== scoreTrendLoadSequence) return
    scoreTrendLoading.value = false
    if (showScoreTrend.value && scoreTrend.value?.points.length) {
      await nextTick()
      renderChart()
    }
  }
}

// 页面进入或全局考试类型变化时并行刷新试卷列表与真实成绩趋势。
async function refreshAssessmentData(): Promise<void> {
  await Promise.all([loadAssessmentPapers(), loadScoreTrend()])
}

// 进入页面时先确定用户默认考试类型，再查询该类型的诊断试卷。
onMounted(async () => {
  try {
    await auth.ensureMemberContext()
  } catch {
    // 偏好加载失败时继续使用全局默认 TMUA，公共请求层负责错误提示。
  }
  assessmentInitialized = true
  await refreshAssessmentData()
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chartInstance?.dispose()
})

// 趋势图重新显示时等待容器挂载，隐藏时及时释放 ECharts 实例。
watch(showScoreTrend, async (visible) => {
  if (!visible) {
    chartInstance?.dispose()
    chartInstance = null
    return
  }
  await nextTick()
  renderChart()
})

// 导航栏切换考试类型时关闭旧上下文，并重新查询对应诊断卷和成绩趋势。
watch(activeExamType, () => {
  if (!assessmentInitialized) return
  startingPaperId.value = ''
  historyDialogVisible.value = false
  historyLoading.value = false
  historyError.value = ''
  historyPaper.value = null
  historyRecords.value = []
  historyTotal.value = 0
  paymentVisible.value = false
  paymentExamType.value = activeExamType.value
  void refreshAssessmentData()
})

// 图表按接口返回的每日最新成绩构造序列，ESAT 科目和 TMUA 综合分使用同一渲染入口。
function renderChart(): void {
  const trend = scoreTrend.value
  if (!chartRef.value || !trend?.points.length) return
  const seriesMeta = new Map<string, string>()
  for (const point of trend.points) {
    for (const score of point.scores) {
      if (!seriesMeta.has(score.key)) seriesMeta.set(score.key, score.label)
    }
  }
  const seriesEntries = [...seriesMeta.entries()]
  const stackedMaximum = Math.max(
    9,
    ...trend.points.map((point) => point.scores.reduce((sum, score) => sum + score.score, 0)),
  )
  const yAxisMaximum = Math.ceil(stackedMaximum / 3) * 3
  const palette = ['#1a1a1a', '#2f7d78', '#c67a37', '#5576b9', '#8567a8']

  chartInstance?.dispose()
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption({
    color: palette,
    grid: { left: 44, right: 20, top: seriesEntries.length > 1 ? 46 : 24, bottom: 36 },
    legend: {
      show: seriesEntries.length > 1,
      top: 2,
      right: 4,
      itemWidth: 18,
      itemHeight: 8,
      textStyle: { color: '#666666', fontSize: 12 },
    },
    xAxis: {
      type: 'category',
      data: trend.points.map((point) => point.date.slice(5).replace('-', '/')),
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#eaeaea' } },
      axisLabel: { color: '#8a8a8a', fontWeight: 600 },
      splitLine: { show: true, lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: yAxisMaximum,
      interval: 3,
      name: '分数',
      nameTextStyle: { color: '#8a8a8a', padding: [0, 0, 0, -24] },
      axisLabel: { color: '#8a8a8a', fontWeight: 600 },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: seriesEntries.map(([key, label], index) => ({
        name: label,
        type: 'line',
        stack: 'diagnostic-score',
        data: trend.points.map((point) => (
          point.scores.find((score) => score.key === key)?.score ?? null
        )),
        smooth: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2.5, color: palette[index % palette.length] },
        itemStyle: {
          color: palette[index % palette.length],
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        emphasis: { focus: 'series' },
        connectNulls: false,
      })),
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const items = (Array.isArray(params) ? params : [params]) as Array<{
          dataIndex?: number
          marker?: string
          seriesName?: string
          data?: string | number | null
        }>
        const point = trend.points[items[0]?.dataIndex ?? -1]
        if (!point) return ''
        const rows = items
          .filter((item) => item.data !== null && item.data !== undefined)
          .map((item) => `${item.marker || ''}${item.seriesName || '分数'}：${item.data}`)
        return [formatDateTime(point.submittedAt), ...rows].join('<br/>')
      },
    },
  })
}

function resizeChart(): void {
  chartInstance?.resize()
}

// 从试卷锁定态进入支付时预选该试卷的考试类型，减少重复选择。
function handleUpgradeClick(examType?: string): void {
  paymentExamType.value = examType || activeExamType.value
  paymentVisible.value = true
}

// 支付完成后立即刷新会员上下文，使当前列表无需刷新页面即可解除遮罩。
async function handlePaymentSuccess(): Promise<void> {
  try {
    const context = await getMember()
    auth.setMemberContext(context)
    paymentVisible.value = false
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  }
}

// 打开试卷历史时固定当前试卷上下文，分页请求不会和其他卡片的数据混用。
function openPaperHistory(item: AssessmentPaperItem): void {
  historyPaper.value = item
  historyPage.value = 1
  historyRecords.value = []
  historyTotal.value = item.completedAttemptCount
  historyDialogVisible.value = true
  void loadPaperHistory()
}

// 历次记录只读取正式交卷 attempt，报告状态和报告时间均由后端关联记录返回。
async function loadPaperHistory(): Promise<void> {
  const paperId = historyPaper.value?.paperId
  if (!paperId) return
  historyLoading.value = true
  historyError.value = ''
  try {
    const data = await getAssessmentPaperHistory(paperId, historyPage.value, historyPageSize.value)
    if (historyPaper.value?.paperId !== paperId) return
    historyRecords.value = data.list || []
    historyTotal.value = data.pagination.total
  } catch (error: unknown) {
    if (historyPaper.value?.paperId !== paperId) return
    historyRecords.value = []
    historyError.value = getApiErrorMessage(error, '历次诊断记录加载失败，请稍后重试。')
  } finally {
    if (historyPaper.value?.paperId === paperId) historyLoading.value = false
  }
}

// 切换页码后重新读取该页，避免一次性把长期积累的全部历史报告下发到首页。
function handleHistoryPageChange(page: number): void {
  historyPage.value = page
  void loadPaperHistory()
}

// 每页数量改变时回到第一页，避免原页码超出新的总页数。
function handleHistoryPageSizeChange(pageSize: number): void {
  historyPageSize.value = pageSize
  historyPage.value = 1
  void loadPaperHistory()
}

// 历史入口始终以该次 examRecordId 导航，禁止回退到同一试卷的其他报告。
function handleHistoryAction(record: AssessmentPaperHistoryItem): void {
  historyDialogVisible.value = false
  if (record.hasReport) {
    const reportKind = record.reportKind.toLowerCase()
    if (reportKind === 'esat' || reportKind === 'tmua') {
      void router.push(`/exam-result/${record.examRecordId}/${reportKind}`)
      return
    }
    void router.push(`/exam-result/${record.examRecordId}`)
    return
  }
  void router.push({
    path: '/exam-result',
    query: {
      id: record.examRecordId,
      total: String(record.totalQuestions),
      correct: String(record.correctCount),
      source: 'assessment',
    },
  })
}

// 日期按学生浏览器本地时区展示，并统一为便于核对的年月日时分格式。
function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const pad = (part: number) => String(part).padStart(2, '0')
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(' ')
}

// 报告时间只取本次正式报告的 completedAt，任务未完成时不以交卷时间替代。
function formatReportTime(record: AssessmentPaperHistoryItem): string {
  if (record.reportCompletedAt) return formatDateTime(record.reportCompletedAt)
  if (record.reportStatus === 'failed') return '生成失败'
  return '尚未生成'
}

// 作答用时按已持久化有效时长展示，ESAT 休息时间不计入其中。
function formatDuration(durationSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  if (hours > 0) return `${hours} 小时 ${minutes} 分`
  if (minutes > 0) return `${minutes} 分 ${seconds} 秒`
  return `${seconds} 秒`
}

// 历史状态文案描述该次报告自身，不受同一试卷其他报告影响。
function historyReportLabel(record: AssessmentPaperHistoryItem): string {
  if (record.hasReport) return '报告已完成'
  if (record.reportStatus === 'failed') return '分析失败'
  if (record.reportStatus === 'analyzing') return `报告生成中 ${record.reportProgress}%`
  if (record.reportStatus === 'pending') return '等待生成报告'
  return '待生成报告'
}

// 历史状态沿用首页的低饱和语义色，避免和考试、科目标签竞争视觉层级。
function historyReportTone(
  record: AssessmentPaperHistoryItem,
): 'completed' | 'progress' | 'failed' {
  if (record.hasReport) return 'completed'
  if (record.reportStatus === 'failed') return 'failed'
  return 'progress'
}

// 报告尚未完成时，历史记录入口复用本次分析进度或失败重试流程。
function historyActionLabel(record: AssessmentPaperHistoryItem): string {
  if (record.hasReport) return '查看该次报告'
  if (record.reportStatus === 'failed') return '重新分析'
  return '查看生成进度'
}

async function handlePaperAction(item: AssessmentPaperItem): Promise<void> {
  if (!isPaperAvailable(item)) {
    ElMessage.info(getExamUnavailableMessage(item.examType))
    return
  }
  if (item.testStatus === 'in_progress') {
    routeToDiagnosticPaper(item, true)
    return
  }
  if (item.testStatus === 'completed') {
    openPaperHistory(item)
    return
  }
  if (isPaperLocked(item)) {
    handleUpgradeClick(item.examType)
    return
  }
  await startPaper(item)
}

// 重新测试走正式权益校验并创建新的 attempt，不再提供客户端调试绕过参数。
async function handleRetestPaper(paper: AssessmentPaperItem): Promise<void> {
  if (!isPaperAvailable(paper)) {
    ElMessage.info(getExamUnavailableMessage(paper.examType))
    return
  }
  if (isPaperLocked(paper)) {
    handleUpgradeClick(paper.examType)
    return
  }
  if (!isPaperPublished(paper)) {
    ElMessage.info('该诊断卷已下线，只能查看已有记录')
    return
  }
  await startPaper(paper)
}

// 前端只处理明确的锁定交互，创建 attempt 时仍由后端再次校验试卷级权益。
async function startPaper(paper: AssessmentPaperItem): Promise<void> {
  if (!isPaperAvailable(paper)) {
    ElMessage.info(getExamUnavailableMessage(paper.examType))
    return
  }
  if (!isPaperPublished(paper)) {
    ElMessage.info('该诊断卷已下线，不能创建新的测试')
    return
  }
  const activePaper = diagnosticTests.value.find(
    (item) => item.examType === paper.examType && item.testStatus === 'in_progress',
  )
  if (activePaper && activePaper.id !== paper.id) {
    ElMessage.warning(`请先完成正在进行的“${activePaper.title}”`)
    return
  }
  if (startingPaperId.value) return
  startingPaperId.value = paper.id
  try {
    routeToDiagnosticPaper(paper, false)
  } finally {
    startingPaperId.value = ''
  }
}

// 带分段交付配置的 ESAT 与 TMUA 试卷进入专用状态机；旧扁平卷保持原答题页。
function routeToDiagnosticPaper(paper: AssessmentPaperItem, resume: boolean): void {
  if (paper.deliveryMode === 'module_sequence') {
    router.push({
      path: `/assessment/exam/${paper.id}`,
      query: resume && paper.examRecordId ? { examRecordId: paper.examRecordId } : {},
    })
    return
  }
  router.push({ path: '/practice', query: { paperId: paper.id, mode: 'assessment' } })
}

// 分析中与待分析统一进入本次分析弹窗，完成后只进入本次考试记录的报告。
function isReportGenerating(item: AssessmentPaperItem): boolean {
  return item.reportStatus === 'pending' || item.reportStatus === 'analyzing'
}

// 诊断列表可展示 STEP 上线预告，但任何开始、继续和重测操作都必须保持关闭。
function isPaperAvailable(item: AssessmentPaperItem): boolean {
  return isExamTypeAvailable(item.examType || 'TMUA')
}

// 发布状态只限制新建和重测，已开始测试与历史记录仍可访问。
function isPaperPublished(item: AssessmentPaperItem): boolean {
  return item.publicationStatus === 'published'
}

// 进行中的 attempt 沿用创建时取得的权限；免费卷、管理员和有效会员不显示锁定态。
function isPaperLocked(item: AssessmentPaperItem): boolean {
  if (!isPaperAvailable(item) || item.testStatus === 'in_progress') return false
  if (item.accessTier === PAPER_ACCESS_TIER.FREE || auth.isAdmin) return false
  return !auth.memberContext?.quotas?.[item.examType || 'TMUA']?.isMember
}

function paperStatusLabel(item: AssessmentPaperItem): string {
  if (!isPaperAvailable(item)) return '暂未开放'
  if (!isPaperPublished(item) && item.testStatus === 'in_progress') return '已下线 · 进行中'
  if (!isPaperPublished(item)) return '已下线'
  if (item.testStatus === 'in_progress') return '进行中'
  if (item.testStatus === 'not_started') return '待开始'
  if (item.reportStatus === 'failed') return '分析失败'
  if (isReportGenerating(item)) return `报告生成中 ${item.reportProgress}%`
  if (item.reportStatus === 'not_generated') return '待生成报告'
  return '报告已完成'
}

// 状态标签使用低饱和语义色，和科目、考试类型的亮色标签形成层级区分。
function paperStatusTone(
  item: AssessmentPaperItem,
): 'pending' | 'progress' | 'completed' | 'failed' | 'unavailable' {
  if (!isPaperAvailable(item)) return 'unavailable'
  if (!isPaperPublished(item)) return 'unavailable'
  if (item.testStatus === 'in_progress') return 'progress'
  if (item.testStatus === 'not_started') return 'pending'
  if (item.reportStatus === 'failed') return 'failed'
  if (isReportGenerating(item) || item.reportStatus === 'not_generated') return 'progress'
  return 'completed'
}

function paperActionLabel(item: AssessmentPaperItem): string {
  if (!isPaperAvailable(item)) return '正在推进中'
  if (item.testStatus === 'in_progress') return '继续测试→'
  if (!isPaperPublished(item)) return '历次记录→'
  if (item.testStatus === 'not_started') return '开始测试→'
  if (item.reportStatus === 'failed' && !item.hasReport) return '重新分析→'
  if (isReportGenerating(item) || item.reportStatus === 'not_generated') {
    return '查看生成进度→'
  }
  return '查看诊断报告→'
}

// 进行中卡片按当前模块索引展示 ESAT 科目或 TMUA Paper，避免沿用过长的试卷副标题。
function currentProgressLabel(item: AssessmentPaperItem): string {
  const moduleIndex = Math.max(0, item.currentModuleIndex ?? 0)
  const currentModule = item.modules?.[moduleIndex]
  if (String(item.examType || '').toUpperCase() === 'TMUA') {
    const moduleIdentity = `${currentModule?.code || ''} ${currentModule?.subject || ''}`
    if (/paper[\s_-]*2/i.test(moduleIdentity)) return 'Paper 2'
    if (/paper[\s_-]*1/i.test(moduleIdentity)) return 'Paper 1'
    return `Paper ${moduleIndex + 1}`
  }
  return currentModule?.subject || currentModule?.code || `第 ${moduleIndex + 1} 科目`
}
</script>

<style scoped lang="scss">
.assessment-page {
  min-height: 100vh;
  min-width: var(--fluid-page-min-width);
  background: var(--color-bg);
  color: var(--color-ink);
}

.assessment-shell {
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 40px 0 96px;
}

.page-header {
  margin: 0 0 24px;
}

.page-header h1 {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
  letter-spacing: 0;
  white-space: nowrap;
}

.page-header__lead p {
  max-width: 560px;
  margin: 10px 0 0;
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
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

.paper-card__button {
  height: var(--height-button);
  border-radius: var(--radius-md);
}

.chart-card {
  margin-top: 16px;
  padding: 24px 24px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.chart-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.chart-title span {
  display: block;
  margin-bottom: 4px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.chart-title strong {
  color: var(--color-ink);
  font-size: var(--text-lg);
}

.score-chart {
  width: 100%;
  height: 220px;
}

.score-chart-state {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.score-chart-state--error {
  color: var(--color-danger);
}

.score-chart-state .button_cancel {
  min-height: 34px;
  padding: 0 14px;
}

.paper-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 14px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.paper-filter-bar__title span {
  display: block;
  margin-bottom: 3px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.paper-filter-bar__title strong {
  color: var(--color-ink);
  font-size: var(--text-base);
}

.paper-filter-bar__controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  flex-wrap: wrap;
}

.paper-filter-control {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.paper-filter-control > span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  white-space: nowrap;
}

.paper-filter-control--chart {
  min-height: var(--height-button);
  padding-left: 4px;
}

.status-filter {
  flex: 0 0 auto;
  min-width: 340px;
}

.status-filter :deep(.el-segmented__item) {
  min-width: 76px;
  font-weight: var(--weight-semi);
}

.paper-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.paper-card {
  position: relative;
  overflow: hidden;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  transition:
    border-color var(--duration-base) ease,
    transform var(--duration-fast) ease;
}

.paper-card__lock-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  overflow: hidden;
  border-radius: inherit;
  background: linear-gradient(
    to top,
    rgb(15 15 15 / 68%) 0%,
    rgb(20 20 20 / 42%) 38%,
    rgb(24 24 24 / 18%) 72%,
    rgb(24 24 24 / 7%) 100%
  );
  color: rgb(255 255 255 / 92%);
  cursor: not-allowed;
  pointer-events: auto;
  transition: background var(--duration-base) ease;
}

.paper-card__lock-marker {
  position: absolute;
  top: 66.666%;
  left: 50%;
  display: grid;
  justify-items: center;
  gap: 6px;
  transform: translate(-50%, -50%);
  text-shadow: 0 1px 10px rgb(0 0 0 / 42%);
}

.paper-card__lock-marker .el-icon {
  font-size: 32px;
}

.paper-card__lock-marker span {
  font-size: var(--text-sm);
  font-weight: var(--weight-bold);
  letter-spacing: 0.04em;
}

.paper-card__lock-actions {
  position: absolute;
  bottom: 12px;
  right: 24px;
  left: 24px;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  column-gap: 10px;
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px);
  transition:
    opacity var(--duration-fast) ease,
    transform var(--duration-fast) ease;
}

.paper-card__unlock-button {
  grid-column: 2;
  min-width: 112px;
  height: var(--height-button);
  padding: 0 22px;
  border: 1px solid rgb(255 255 255 / 64%);
  border-radius: var(--radius-md);
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 10px 28px rgb(0 0 0 / 20%);
  color: var(--color-ink);
  font: inherit;
  font-weight: var(--weight-bold);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) ease,
    background var(--duration-fast) ease,
    color var(--duration-fast) ease;
}

.paper-card__locked-history-button {
  grid-column: 1;
  grid-row: 1;
  justify-self: end;
  padding: 5px 1px 3px;
  border: 0;
  border-bottom: 1px solid rgb(255 255 255 / 72%);
  background: transparent;
  color: rgb(255 255 255 / 94%);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) ease,
    color var(--duration-fast) ease;
}

.paper-card__unlock-button:hover {
  background: var(--color-surface);
}

.paper-card__locked-history-button:hover {
  border-bottom-color: rgb(255 255 255);
  color: rgb(255 255 255);
}

.paper-card--locked:hover .paper-card__lock-overlay,
.paper-card--locked:focus-within .paper-card__lock-overlay {
  background: linear-gradient(
    to top,
    rgb(12 12 12 / 74%) 0%,
    rgb(18 18 18 / 48%) 38%,
    rgb(22 22 22 / 22%) 72%,
    rgb(22 22 22 / 9%) 100%
  );
}

.paper-card__lock-overlay:hover .paper-card__lock-actions,
.paper-card__lock-overlay:focus-within .paper-card__lock-actions {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.paper-card:hover {
  border-color: var(--color-ink);
  transform: translateY(-1px);
}

.paper-card--unavailable,
.paper-card--unavailable:hover {
  border-color: var(--color-line);
  border-style: dashed;
  background: linear-gradient(
    135deg,
    var(--color-surface),
    color-mix(in srgb, var(--color-report-purple-soft) 44%, var(--color-surface))
  );
  transform: none;
}

.paper-card--unavailable .paper-card__button,
.paper-card--unavailable .paper-card__button:hover {
  border-color: var(--color-line);
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
}

.paper-card__badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: var(--color-hover);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.paper-card__badge--pending {
  border-color: #d5d8dc;
  background: #f1f2f3;
  color: #555d66;
}

.paper-card__badge--progress {
  border-color: #d6c9b2;
  background: #f3f0e9;
  color: #6b5b3e;
}

.paper-card__badge--completed {
  border-color: #c8d2cc;
  background: #edf1ef;
  color: #435c4d;
}

.paper-card__badge--failed {
  border-color: #d8c8c8;
  background: #f3eeee;
  color: #775555;
}

.paper-card__badge--unavailable {
  border-color: #d4d4d4;
  border-style: dashed;
  background: #f4f4f4;
  color: #737373;
}

.paper-card__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.paper-card__identity {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.paper-card__exam-type,
.paper-card__year {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  white-space: nowrap;
}

.paper-card__exam-type--esat {
  border-color: #67e8f9;
  background: #ecfeff;
  color: #0e7490;
}

.paper-card__exam-type--tmua {
  border-color: #ddd6fe;
  background: #f5f3ff;
  color: #6d28d9;
}

.paper-card__year {
  background: var(--color-surface-alt);
  color: var(--color-ink-soft);
}

.paper-card__heading {
  min-width: 0;
}

.paper-card__heading h2 {
  overflow: hidden;
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.paper-card__subject-tags {
  margin-top: 10px;
}

.paper-card__footer {
  position: relative;
  z-index: 3;
  min-height: var(--height-button);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-line);
}

.paper-card__score {
  padding: 0 4px;
  white-space: nowrap;
}

.paper-card__score strong {
  color: var(--color-ink);
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
}

.paper-card__score span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.paper-card__progress {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 0 4px;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.paper-card__progress strong {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.paper-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.paper-card__button--secondary {
  min-width: 92px;
}

.empty-state {
  margin-top: 24px;
  padding: 32px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  text-align: center;
}

:deep(.diagnostic-history-dialog) {
  overflow: hidden;
  border-radius: var(--radius-lg);
}

:deep(.diagnostic-history-dialog .el-dialog__header) {
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--color-line);
}

:deep(.diagnostic-history-dialog .el-dialog__title) {
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

:deep(.diagnostic-history-dialog .el-dialog__body) {
  padding: 0;
}

.diagnostic-history {
  max-height: min(68vh, 720px);
  overflow-y: auto;
  padding: 8px 24px 20px;
}

.diagnostic-history__state {
  min-height: 220px;
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 32px;
  color: var(--color-ink-muted);
  text-align: center;
}

.diagnostic-history__state p {
  margin: 0;
}

.diagnostic-history__state--error {
  color: var(--color-danger);
}

.diagnostic-history__state button {
  min-width: 100px;
  min-height: var(--height-button);
  border-radius: var(--radius-md);
}

.diagnostic-history__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px 20px;
  padding: 18px 0;
  border-bottom: 1px solid var(--color-line);
}

.diagnostic-history__heading {
  display: flex;
  align-items: center;
  gap: 10px;
  grid-column: 1 / -1;
}

.diagnostic-history__heading > strong {
  color: var(--color-ink);
  font-size: var(--text-base);
}

.diagnostic-history__status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.diagnostic-history__status--completed {
  border-color: #c8d2cc;
  background: #edf1ef;
  color: #435c4d;
}

.diagnostic-history__status--progress {
  border-color: #d6c9b2;
  background: #f3f0e9;
  color: #6b5b3e;
}

.diagnostic-history__status--failed {
  border-color: #d8c8c8;
  background: #f3eeee;
  color: #775555;
}

.diagnostic-history__metrics {
  min-width: 0;
  display: grid;
  grid-template-columns: 1.35fr 1fr 1fr 1.35fr;
  gap: 18px;
  margin: 0;
}

.diagnostic-history__metrics div {
  min-width: 0;
}

.diagnostic-history__metrics dt {
  margin-bottom: 5px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.diagnostic-history__metrics dd {
  overflow: hidden;
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.diagnostic-history__action {
  min-width: 118px;
  height: var(--height-button);
  align-self: center;
  border-radius: var(--radius-md);
}

.diagnostic-history :deep(.app-pagination) {
  position: sticky;
  bottom: -20px;
  padding: 14px 0 0;
  background: var(--color-surface);
}

@media (max-width: 760px) {
  .paper-filter-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .paper-filter-bar__controls {
    align-items: stretch;
    flex-direction: column;
  }

  .paper-filter-control {
    justify-content: space-between;
  }

  .status-filter {
    width: 100%;
    min-width: 0;
  }

  :deep(.diagnostic-history-dialog) {
    width: calc(100% - 32px) !important;
  }

  .diagnostic-history__item {
    grid-template-columns: 1fr;
  }

  .diagnostic-history__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .diagnostic-history__action {
    width: 100%;
  }
}
</style>
