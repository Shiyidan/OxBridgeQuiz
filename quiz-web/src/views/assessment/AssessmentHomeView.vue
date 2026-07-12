<template>
  <div class="assessment-page">
    <NavBar />
    <main class="assessment-shell">
      <header class="page-header">
        <div class="page-header__lead">
          <span class="page-eyebrow">Diagnostic Assessment</span>
          <h1>诊断测试中心</h1>
          <p>选择已发布真题套卷完成一次全真诊断，系统会在交卷后生成成绩报告。</p>
        </div>
        <div class="quota-card">
          <div class="quota-list" aria-label="诊断测试额度明细">
            <span
              v-for="item in diagnosticQuotaItems"
              :key="item.examType"
              class="quota-pill"
              :class="{ 'quota-pill--empty': item.isEmpty }"
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

      <section class="chart-card">
        <div class="chart-title">
          <div>
            <span>Score Trend</span>
            <strong>历次诊断测试分数变化</strong>
          </div>
        </div>
        <div ref="chartRef" class="score-chart" aria-label="历次诊断测试分数变化折线图"></div>
      </section>

      <section class="paper-grid" aria-label="历年真题">
        <article v-for="item in diagnosticTests" :key="item.id" class="paper-card">
          <div class="paper-card__info">
            <span class="paper-card__badge">{{ paperStatusLabel(item) }}</span>
            <h2>{{ item.title }}</h2>
            <p>{{ item.code || item.title }}</p>
          </div>

          <div v-if="item.testStatus === 'completed' && item.correctCount !== null" class="paper-card__score">
            <strong>{{ item.correctCount }}/{{ item.totalQuestions }}</strong>
            <span v-if="isReportGenerating(item)">报告 {{ item.reportProgress }}%</span>
            <span v-else>题正确</span>
          </div>

          <div class="paper-card__actions">
            <button
              v-if="item.testStatus === 'completed'"
              class="paper-card__button paper-card__button--secondary button_cancel"
              type="button"
              @click="handleRetestPaper(item)"
            >
              重新测试
            </button>
            <button
              class="paper-card__button button_primary"
              type="button"
              @click="handlePaperAction(item)"
            >
              {{ paperActionLabel(item) }}
            </button>
          </div>
        </article>
      </section>

      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!diagnosticTests.length" class="empty-state">
        暂无已上线真题套卷，请先在后台真题库发布试卷。
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 诊断测试中心：展示模考额度、历史趋势和真题套卷入口。
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import NavBar from '@/components/NavBar.vue'
import { checkMemberAccess } from '@/api/member'
import { useAuthStore } from '@/stores/auth'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import {
  getAssessmentPapersData,
  type AssessmentPaperItem,
} from '@/api/papers'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const diagnosticTests = ref<AssessmentPaperItem[]>([])
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const mockScoreTrend = [
  { month: '2023-09', score: 5.2 },
  { month: '2023-10', score: 5.8 },
  { month: '2023-11', score: 6.2 },
  { month: '2023-12', score: 6.5 },
  { month: '2024-01', score: 6.8 },
  { month: '2024-02', score: 7.1 },
  { month: '2024-03', score: 7.5 },
]

const examTypeLabelMap = new Map<string, string>(EXAM_TYPE_OPTIONS.map((item) => [item.value, item.label]))
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
    const isUnlimited = Boolean(quota?.isMember || diagnostic?.unlimited)
    const hasQuota = Boolean(diagnostic)
    let text = '暂无额度'

    if (isUnlimited) {
      text = '会员不限次'
    } else if (diagnostic && diagnostic.remaining !== null && diagnostic.limit !== null) {
      text = `剩余 ${diagnostic.remaining}/${diagnostic.limit} 次`
    }

    return {
      examType,
      label: examTypeLabelMap.get(examType) || examType,
      text,
      isEmpty: !isUnlimited && (!hasQuota || diagnostic?.remaining === 0),
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

// mock 折线图先固定趋势数据，后续接真实历史诊断分数接口。
function renderChart(): void {
  if (!chartRef.value) return
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
      formatter: (items: any) => {
        const item = Array.isArray(items) ? items[0] : items
        return `${item.axisValue}<br/>分数：${item.data}`
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

async function handlePaperAction(item: AssessmentPaperItem): Promise<void> {
  if (item.testStatus === 'in_progress') {
    router.push({ path: '/practice', query: { paperId: item.paperId, mode: 'assessment' } })
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

// 临时调试入口：已完成套卷可直接重新进入答题，不消耗诊断额度。
function handleRetestPaper(paper: AssessmentPaperItem): void {
  router.push({
    path: '/practice',
    query: { paperId: paper.id, mode: 'assessment', debugRetake: '1' },
  })
}

// 点击套卷前先做权益预检，避免进入答题页后才发现额度不足。
async function startPaper(paper: AssessmentPaperItem): Promise<void> {
  const access = await checkMemberAccess({
    action: 'diagnostic',
    examType: paper.examType || 'TMUA',
    questionCount: 1,
  })
  if (!access.allowed) {
    ElMessage.warning('当前诊断测试额度不足，请开通会员后继续')
    return
  }
  router.push({ path: '/practice', query: { paperId: paper.id, mode: 'assessment' } })
}

// 分析中与待分析统一进入分析弹窗恢复入口，完成或有旧报告时进入报告路由。
function isReportGenerating(item: AssessmentPaperItem): boolean {
  return item.reportStatus === 'pending' || item.reportStatus === 'analyzing'
}

function paperStatusLabel(item: AssessmentPaperItem): string {
  if (item.testStatus === 'in_progress') return '进行中'
  if (item.testStatus === 'not_started') return '待开始'
  if (item.reportStatus === 'failed') {
    return item.hasReport ? '最新分析失败 · 可看上次报告' : '分析失败'
  }
  if (isReportGenerating(item)) return `报告生成中 ${item.reportProgress}%`
  if (item.reportStatus === 'not_generated') return '待生成报告'
  return '报告已完成'
}

function paperActionLabel(item: AssessmentPaperItem): string {
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
  width: clamp(var(--fluid-shell-min), var(--fluid-shell-fluid), var(--fluid-shell-max));
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

.paper-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.paper-card {
  min-width: 0;
  min-height: 96px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 20px;
  padding: 20px;
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

.paper-card__badge {
  display: inline-flex;
  align-items: center;
  height: 24px;
  margin-bottom: 10px;
  padding: 0 10px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: var(--color-hover);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.paper-card__info h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  overflow-wrap: anywhere;
}

.paper-card__info p {
  margin: 8px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
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

.paper-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
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
</style>
