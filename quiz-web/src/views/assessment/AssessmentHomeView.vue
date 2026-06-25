<template>
  <div class="assessment-page">
    <NavBar />
    <main class="assessment-shell">
      <header class="page-header">
        <h1>诊断测试中心</h1>
        <div class="quota-bar">
          <span class="quota-text">{{ quotaText }}</span>
          <button class="quota-button" type="button" @click="handleUpgradeClick">
            获取更多模考额度
          </button>
        </div>
      </header>

      <section class="chart-card">
        <div class="chart-title">
          <span aria-hidden="true">⌁</span>
          <strong>历次诊断测试分数变化</strong>
        </div>
        <div ref="chartRef" class="score-chart" aria-label="历次诊断测试分数变化折线图"></div>
        <div class="chart-foot-label">历年真题</div>
      </section>

      <section class="paper-grid" aria-label="历年真题">
        <article v-for="item in paperCards" :key="item.paper.id" class="paper-card">
          <div class="paper-card__info">
            <h2>{{ item.paper.title }}</h2>
            <p>{{ item.paper.code || item.paper.title }}</p>
          </div>

          <div v-if="item.record" class="paper-card__score">
            <strong>{{ scoreText(item.record) }}</strong>
            <span>/9.0</span>
          </div>

          <button
            class="paper-card__button"
            type="button"
            @click="handlePaperAction(item.paper)"
          >
            {{ item.record ? '诊断详情→' : '开始测试→' }}
          </button>
        </article>
      </section>

      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!visiblePapers.length" class="empty-state">
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
import {
  getAssessmentPapersData,
  type AssessmentPaperItem,
  type AssessmentRecordItem,
} from '@/api/papers'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)
const papers = ref<AssessmentPaperItem[]>([])
const records = ref<AssessmentRecordItem[]>([])
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

const visiblePapers = computed(() => papers.value)
const currentExamType = computed(() => visiblePapers.value[0]?.examType || 'TMUA')
const currentQuota = computed(() => auth.memberContext?.quotas?.[currentExamType.value])
const canUseAllTests = computed(() => auth.isAdmin || Boolean(currentQuota.value?.isMember))
const quotaText = computed(() => {
  if (canUseAllTests.value) return '可全部测试'
  const diagnostic = currentQuota.value?.diagnostic
  if (!diagnostic || diagnostic.remaining === null || diagnostic.limit === null) return '免费额度  --/--次'
  return `免费额度（${diagnostic.remaining}/${diagnostic.limit}次）`
})
const recordByPaperId = computed<Record<string, AssessmentRecordItem>>(() => {
  const map: Record<string, AssessmentRecordItem> = {}
  for (const record of records.value) {
    if (!map[record.paperId]) map[record.paperId] = record
  }
  return map
})
const paperCards = computed(() =>
  visiblePapers.value.map((paper) => ({
    paper,
    record: recordByPaperId.value[paper.id],
  })),
)

// 进入诊断测试页时拉取可测试真题与历史记录，保证入口和报告列表同步。
onMounted(async () => {
  try {
    const data = await getAssessmentPapersData()
    papers.value = data.papers || []
    records.value = data.records || []
  } catch {
    papers.value = []
    records.value = []
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
    grid: { left: 46, right: 24, top: 20, bottom: 42 },
    xAxis: {
      type: 'category',
      data: mockScoreTrend.map((item) => item.month),
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#d9e2ea' } },
      axisLabel: { color: '#7a8794', fontWeight: 600 },
      splitLine: { show: true, lineStyle: { color: '#edf2f5', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 9,
      interval: 3,
      axisLabel: { color: '#7a8794', fontWeight: 600 },
      splitLine: { lineStyle: { color: '#edf2f5', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        data: mockScoreTrend.map((item) => item.score),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#3d8bd1' },
        itemStyle: { color: '#2f80c4' },
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

async function handlePaperAction(paper: AssessmentPaperItem): Promise<void> {
  const record = recordByPaperId.value[paper.id]
  if (record) {
    router.push(`/exam-result/${record.id}`)
    return
  }
  await startPaper(paper)
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

function scoreText(record: AssessmentRecordItem): string {
  if (!record.totalQuestions) return '0'
  return ((record.correctCount / record.totalQuestions) * 9).toFixed(1)
}
</script>

<style scoped lang="scss">
.assessment-page {
  min-height: 100vh;
  background: #f5f7fa;
  color: #1f2a37;
  overflow-x: hidden;
}

.assessment-shell {
  width: min(774px, calc(100% - 40px));
  margin: 0 auto;
  padding: 28px 0 96px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin: 0 0 66px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e6ebf0;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: 0;
  white-space: nowrap;
}

.quota-bar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.quota-text {
  color: #3979a7;
  font-size: 16px;
  font-weight: 800;
}

.quota-button,
.paper-card__button {
  height: 32px;
  padding: 0 16px;
  border: 1px solid #dbe3ea;
  border-radius: 4px;
  background: #fff;
  color: #1f2a37;
  font-weight: 800;
  cursor: pointer;
}

.quota-button {
  border-color: #3b7192;
  background: #3b7192;
  color: #fff;
}

.chart-card {
  padding: 18px 18px 8px;
  border: 1px solid #e4e9ee;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #253445;
  font-size: 14px;
}

.chart-title span {
  color: #3d8bd1;
  font-size: 20px;
  line-height: 1;
}

.score-chart {
  width: 100%;
  height: 214px;
}

.chart-foot-label {
  margin: -8px 0 4px;
  color: #1f2a37;
  font-size: 13px;
  font-weight: 800;
}

.paper-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 32px;
  margin-top: 20px;
}

.paper-card {
  min-width: 0;
  min-height: 66px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 18px;
  padding: 18px 22px;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.paper-card__info h2 {
  margin: 0;
  color: #263446;
  font-size: 16px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.paper-card__info p {
  margin: 6px 0 0;
  color: #6d7886;
  font-size: 12px;
  font-weight: 700;
}

.paper-card__score {
  white-space: nowrap;
}

.paper-card__score strong {
  color: #2f80d1;
  font-size: 20px;
}

.paper-card__score span {
  color: #8793a0;
  font-size: 12px;
  font-weight: 800;
}

.empty-state {
  margin-top: 20px;
  padding: 28px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  text-align: center;
}

@media (max-width: 820px) {
  .assessment-shell {
    width: min(100% - 28px, 560px);
    padding-top: 24px;
  }

  .quota-bar {
    justify-content: flex-end;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 32px;
  }

  .paper-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .quota-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .quota-button {
    width: 100%;
  }

  .paper-card {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .paper-card__button {
    width: 100%;
  }
}
</style>
