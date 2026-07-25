<!-- 诊断测试首页：按试卷交付方式进入连续作答或分段诊断流程。 -->
<template>
  <div class="assessment-page">
    <NavBar />
    <main class="assessment-shell">
      <header class="page-header">
        <div class="page-header__lead">
          <span class="page-eyebrow">Diagnostic Assessment</span>
          <h1>诊断测试中心</h1>
          <p>选择历年真题诊断卷，按 ESAT 科目模块或 TMUA Paper 1/2 完成在线测试。</p>
        </div>
        <div class="quota-card">
          <div class="quota-list" aria-label="诊断测试额度明细">
            <span
              v-for="item in diagnosticQuotaItems"
              :key="item.examType"
              class="quota-pill"
              :class="{
                'quota-pill--empty': item.isEmpty,
                'quota-pill--unavailable': !item.available,
              }"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.text }}</span>
            </span>
          </div>
          <button class="quota-button button_primary" type="button" @click="handleUpgradeClick">
            获取更多模考额度
          </button>
        </div>
      </header>

      <section class="paper-filter-bar" aria-label="诊断试卷筛选">
        <div class="paper-filter-bar__title">
          <span>Diagnostic Papers</span>
          <strong>历年真题诊断卷</strong>
        </div>
        <div class="paper-filter-bar__controls">
          <div class="paper-filter-control">
            <span>考试类型</span>
            <el-segmented
              v-model="activeExamTypeFilter"
              class="exam-type-filter"
              :options="examTypeFilterOptions"
              aria-label="按考试类型筛选诊断试卷"
            />
          </div>
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
            <strong>历次诊断测试分数变化</strong>
          </div>
        </div>
        <div ref="chartRef" class="score-chart" aria-label="历次诊断测试分数变化折线图"></div>
      </section>

      <section class="paper-grid" aria-label="历年真题">
        <article
          v-for="item in filteredDiagnosticTests"
          :key="item.id"
          class="paper-card"
          :class="{ 'paper-card--unavailable': !isPaperAvailable(item) }"
        >
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
            <button
              v-if="item.completedAttemptCount > 0"
              class="paper-card__history-button"
              type="button"
              @click="openPaperHistory(item)"
            >
              历次记录（{{ item.completedAttemptCount }}）
            </button>

            <div class="paper-card__actions">
              <button
                v-if="item.testStatus === 'completed'"
                class="paper-card__button paper-card__button--secondary button_cancel"
                type="button"
                :disabled="startingPaperId === item.id"
                @click="handleRetestPaper(item)"
              >
                重新测试
              </button>
              <button
                class="paper-card__button button_primary"
                type="button"
                :disabled="startingPaperId === item.id"
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
      <div v-else-if="historyError" class="diagnostic-history__state diagnostic-history__state--error">
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
  </div>
</template>

<script setup lang="ts">
// 诊断测试中心：展示模考额度、历史趋势和真题套卷入口。
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import NavBar from '@/components/NavBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import SubjectModuleTags from '@/components/SubjectModuleTags.vue'
import { checkMemberAccess } from '@/api/member'
import { useAuthStore } from '@/stores/auth'
import {
  EXAM_TYPE_OPTIONS,
  getExamUnavailableMessage,
  isExamTypeAvailable,
} from '@/constants/examTypes'
import {
  getAssessmentPaperHistory,
  getAssessmentPapersData,
  type AssessmentPaperHistoryItem,
  type AssessmentPaperItem,
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
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

type AssessmentExamTypeFilter = 'ALL' | 'ESAT' | 'TMUA'
type AssessmentStatusFilter = 'ALL' | 'not_started' | 'in_progress' | 'completed'

const activeExamTypeFilter = ref<AssessmentExamTypeFilter>('ALL')
const activeStatusFilter = ref<AssessmentStatusFilter>('ALL')
const showScoreTrend = ref(true)
const examTypeFilterOptions: Array<{ label: string; value: AssessmentExamTypeFilter }> = [
  { label: '全部', value: 'ALL' },
  { label: 'ESAT', value: 'ESAT' },
  { label: 'TMUA', value: 'TMUA' },
]
const statusFilterOptions: Array<{ label: string; value: AssessmentStatusFilter }> = [
  { label: '全部', value: 'ALL' },
  { label: '待开始', value: 'not_started' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
]

// 筛选只改变当前展示集合，额度与进行中测试约束继续读取完整试卷列表。
const filteredDiagnosticTests = computed(() => {
  return diagnosticTests.value.filter((paper) => {
    const matchesExamType =
      activeExamTypeFilter.value === 'ALL' ||
      String(paper.examType || '').toUpperCase() === activeExamTypeFilter.value
    const matchesStatus =
      activeStatusFilter.value === 'ALL' || paper.testStatus === activeStatusFilter.value
    return matchesExamType && matchesStatus
  })
})

// 空状态区分“尚无任何试卷”和“当前考试类型暂无试卷”，避免误导后台发布状态。
const emptyPaperMessage = computed(() => {
  if (activeExamTypeFilter.value === 'ALL' && activeStatusFilter.value === 'ALL') {
    return '暂无已上线真题套卷，请先在后台真题库发布试卷。'
  }
  return '当前筛选条件下暂无诊断试卷。'
})

const mockScoreTrend = [
  { month: '2023-09', score: 5.2 },
  { month: '2023-10', score: 5.8 },
  { month: '2023-11', score: 6.2 },
  { month: '2023-12', score: 6.5 },
  { month: '2024-01', score: 6.8 },
  { month: '2024-02', score: 7.1 },
  { month: '2024-03', score: 7.5 },
]

const examTypeLabelMap = new Map<string, string>(
  EXAM_TYPE_OPTIONS.map((item) => [item.value, item.label]),
)
const diagnosticQuotaItems = computed(() => {
  const quotas = auth.memberContext?.quotas || {}
  const examTypes = new Set<string>([
    ...EXAM_TYPE_OPTIONS.map((item) => item.value),
    ...Object.keys(quotas),
    ...diagnosticTests.value.map((paper) => paper.examType || '').filter(Boolean),
  ])

  return [...examTypes].map((examType) => {
    const quota = quotas[examType]
    const diagnostic = quota?.diagnostic
    const available = isExamTypeAvailable(examType)
    const isUnlimited = Boolean(quota?.isMember || diagnostic?.unlimited)
    const hasQuota = Boolean(diagnostic)
    let text = available ? '暂无额度' : '正在推进中'

    if (available && isUnlimited) {
      text = '会员不限次'
    } else if (
      available &&
      diagnostic &&
      diagnostic.remaining !== null &&
      diagnostic.limit !== null
    ) {
      text = `剩余 ${diagnostic.remaining}/${diagnostic.limit} 次`
    }

    return {
      examType,
      label: examTypeLabelMap.get(examType) || examType,
      text,
      available,
      isEmpty: !available || (!isUnlimited && (!hasQuota || diagnostic?.remaining === 0)),
    }
  })
})
// 进入诊断测试页时读取后端已聚合的试卷状态列表，不在前端拼接考试记录。
onMounted(async () => {
  try {
    const data = await getAssessmentPapersData()
    diagnosticTests.value = data.list || []
  } catch {
    diagnosticTests.value = []
  } finally {
    loading.value = false
    await nextTick()
    renderChart()
  }
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

// mock 折线图先固定趋势数据，后续接真实历史诊断分数接口。
function renderChart(): void {
  if (!chartRef.value) return
  chartInstance?.dispose()
  chartInstance = echarts.init(chartRef.value)
  chartInstance.setOption({
    grid: { left: 44, right: 20, top: 24, bottom: 36 },
    xAxis: {
      type: 'category',
      data: mockScoreTrend.map((item) => item.month),
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#eaeaea' } },
      axisLabel: { color: '#8a8a8a', fontWeight: 600 },
      splitLine: { show: true, lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 9,
      interval: 3,
      axisLabel: { color: '#8a8a8a', fontWeight: 600 },
      splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        data: mockScoreTrend.map((item) => item.score),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#1a1a1a' },
        itemStyle: { color: '#1a1a1a', borderColor: '#ffffff', borderWidth: 2 },
      },
    ],
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const rawItem = Array.isArray(params) ? params[0] : params
        const item = rawItem as { axisValue?: string | number; data?: string | number }
        return `${item.axisValue ?? ''}<br/>分数：${item.data ?? ''}`
      },
    },
  })
}

function resizeChart(): void {
  chartInstance?.resize()
}

function handleUpgradeClick(): void {
  ElMessage.info('会员开通功能即将上线')
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
    const data = await getAssessmentPaperHistory(
      paperId,
      historyPage.value,
      historyPageSize.value,
    )
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
  if (item.testStatus === 'completed' && item.examRecordId) {
    if (isReportGenerating(item) || item.reportStatus === 'not_generated' || !item.hasReport) {
      router.push({
        path: '/exam-result',
        query: {
          id: item.examRecordId,
          total: String(item.totalQuestions),
          correct: String(item.correctCount || 0),
          source: 'assessment',
        },
      })
      return
    }
    router.push(`/exam-result/${item.reportExamRecordId || item.examRecordId}`)
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
  await startPaper(paper)
}

// 点击套卷前先做权益预检，避免进入答题页后才发现额度不足。
async function startPaper(paper: AssessmentPaperItem): Promise<void> {
  if (!isPaperAvailable(paper)) {
    ElMessage.info(getExamUnavailableMessage(paper.examType))
    return
  }
  const activePaper = diagnosticTests.value.find((item) =>
    item.examType === paper.examType && item.testStatus === 'in_progress',
  )
  if (activePaper && activePaper.id !== paper.id) {
    ElMessage.warning(`请先完成正在进行的“${activePaper.title}”`)
    return
  }
  if (startingPaperId.value) return
  startingPaperId.value = paper.id
  try {
    const access = await checkMemberAccess({
      action: 'diagnostic',
      examType: paper.examType || 'TMUA',
      questionCount: 1,
    })
    if (!access.allowed) {
      ElMessage.warning('当前诊断测试额度不足，请开通会员后继续')
      return
    }
    routeToDiagnosticPaper(paper, false)
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
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

function paperStatusLabel(item: AssessmentPaperItem): string {
  if (!isPaperAvailable(item)) return '暂未开放'
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
  if (item.testStatus === 'in_progress') return 'progress'
  if (item.testStatus === 'not_started') return 'pending'
  if (item.reportStatus === 'failed') return 'failed'
  if (isReportGenerating(item) || item.reportStatus === 'not_generated') return 'progress'
  return 'completed'
}

function paperActionLabel(item: AssessmentPaperItem): string {
  if (!isPaperAvailable(item)) return '正在推进中'
  if (item.testStatus === 'in_progress') return '继续测试→'
  if (item.testStatus === 'not_started') return '开始测试→'
  if (item.reportStatus === 'failed' && !item.hasReport) return '重新分析→'
  if (isReportGenerating(item) || item.reportStatus === 'not_generated') {
    return '查看生成进度→'
  }
  return '查看诊断报告→'
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
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
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

.quota-card {
  width: fit-content;
  max-width: 100%;
  display: grid;
  gap: 14px;
  flex: 0 1 auto;
  justify-items: stretch;
  padding: 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.quota-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quota-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: var(--color-hover);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  white-space: nowrap;
}

.quota-pill strong {
  color: var(--color-ink);
}

.quota-pill--empty {
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
}

.quota-pill--unavailable {
  border-style: dashed;
  background: color-mix(in srgb, var(--color-report-purple-soft) 42%, var(--color-surface));
}

.quota-button,
.paper-card__button {
  height: var(--height-button);
  border-radius: var(--radius-md);
}

.quota-button {
  min-width: 128px;
  width: 100%;
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

.exam-type-filter {
  flex: 0 0 auto;
  min-width: 252px;
}

.status-filter {
  flex: 0 0 auto;
  min-width: 340px;
}

.exam-type-filter :deep(.el-segmented__item),
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

.paper-card__history-button {
  flex: 0 0 auto;
  padding: 4px 2px;
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: var(--color-ink-soft);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  cursor: pointer;
  transition:
    border-color var(--duration-fast) ease,
    color var(--duration-fast) ease;
}

.paper-card__history-button:hover {
  border-bottom-color: var(--color-ink);
  color: var(--color-ink);
}

.paper-card__history-button:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 3px;
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

  .exam-type-filter,
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
