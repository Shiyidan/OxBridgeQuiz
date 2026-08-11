<!-- ESAT 官方成绩分布图：使用 ECharts 展示真实模块分布并标记当前预估分。 -->
<template>
  <div class="official-distribution">
    <div
      ref="chartRef"
      class="official-distribution__chart"
      aria-label="ESAT 官方模块成绩分布与当前预估分"
    ></div>
    <div class="official-distribution__legend" aria-hidden="true">
      <span>较低分段</span>
      <span>主要分布区间</span>
      <span>较高分段</span>
    </div>
    <p>
      数据来源：
      <a :href="ESAT_DISTRIBUTION_SOURCE_URL" target="_blank" rel="noopener noreferrer">
        {{ ESAT_DISTRIBUTION_COHORT }}官方成绩分布
      </a>
      ；图表数据由官方柱状图数字化，可能存在约 0.1 个百分点误差。
    </p>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import {
  ESAT_DISTRIBUTION_COHORT,
  ESAT_DISTRIBUTION_SOURCE_URL,
  estimateEsatDistributionHeight,
  getEsatScoreDistribution,
} from '@/data/esatScoreDistribution'

const props = defineProps<{
  moduleId: string
  score: number | null
}>()

interface DistributionTooltipItem {
  seriesName?: string
  data?: unknown
}

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// ECharts 回调输入先收窄为当前图表需要的字段，避免第三方事件数据污染业务类型。
function isDistributionTooltipItem(value: unknown): value is DistributionTooltipItem {
  return typeof value === 'object' && value !== null
}

// 模块或预估分切换时复用同一图表实例，并更新对应模块的官方分布与定位线。
watch(
  () => [props.moduleId, props.score] as const,
  () => void nextTick(renderChart),
)

onMounted(() => {
  renderChart()
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => chart?.resize())
    resizeObserver.observe(chartRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  resizeObserver = null
  chart = null
})

// ECharts 曲线只对官方离散档位做平滑连接，不使用正态分布参数生成虚构数据。
function renderChart(): void {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  const distribution = getEsatScoreDistribution(props.moduleId)
  const markerHeight = estimateEsatDistributionHeight(props.moduleId, props.score)
  const score = props.score === null ? null : Math.max(1, Math.min(9, props.score))
  const maxPercentage =
    Math.ceil(Math.max(...distribution.map((point) => point.percentage), 10) / 2) * 2 + 2

  chart.setOption(
    {
      animationDuration: 500,
      grid: { left: 54, right: 28, top: 52, bottom: 36 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]).filter(
            isDistributionTooltipItem,
          )
          const data = items.find((item) => item.seriesName === '官方考生分布')?.data
          if (!Array.isArray(data) || data.length < 2) return ''
          return `${Number(data[0]).toFixed(1)} 分<br/>该分数档约占 ${Number(data[1]).toFixed(1)}%`
        },
      },
      xAxis: {
        type: 'value',
        min: 1,
        max: 9,
        interval: 1,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { show: false },
        axisLabel: { color: '#64748b', formatter: (value: number) => value.toFixed(1) },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: maxPercentage,
        name: '考生占比',
        nameTextStyle: { color: '#64748b', padding: [0, 0, 8, 0] },
        axisLabel: { color: '#94a3b8', formatter: (value: number) => `${value}%` },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
      },
      series: [
        {
          name: '官方考生分布',
          type: 'line',
          data: distribution.map((point) => [point.score, Number(point.percentage.toFixed(2))]),
          smooth: 0.28,
          smoothMonotone: 'x',
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { width: 3, color: '#7c3aed' },
          itemStyle: { color: '#7c3aed', borderColor: '#ffffff', borderWidth: 1 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: 'rgba(248, 113, 113, 0.22)' },
              { offset: 0.45, color: 'rgba(250, 204, 21, 0.20)' },
              { offset: 0.72, color: 'rgba(59, 130, 246, 0.20)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.22)' },
            ]),
          },
          markLine:
            score === null
              ? undefined
              : {
                  symbol: ['none', 'none'],
                  silent: true,
                  lineStyle: { color: '#111827', width: 1.5, type: 'dashed' },
                  label: {
                    show: true,
                    position: 'end',
                    rotate: 0,
                    align: 'center',
                    verticalAlign: 'bottom',
                    offset: [0, -8],
                    formatter: `你的预估分 ${score.toFixed(1)}`,
                    color: '#ffffff',
                    backgroundColor: 'rgba(17, 24, 39, 0.84)',
                    borderRadius: 6,
                    padding: [6, 9],
                    fontWeight: 700,
                  },
                  data: [{ xAxis: score }],
                },
        },
        ...(score === null || markerHeight === null
          ? []
          : [
              {
                name: '当前预估分',
                type: 'scatter',
                data: [[score, Number(markerHeight.toFixed(2))]],
                symbolSize: 13,
                z: 5,
                itemStyle: { color: '#111827', borderColor: '#ffffff', borderWidth: 3 },
                tooltip: { show: false },
              },
            ]),
      ],
    },
    true,
  )
}
</script>

<style scoped lang="scss">
.official-distribution {
  padding: 12px 18px 14px;
  border: 1px solid #e7e9ef;
  border-radius: 12px;
  background: #fbfcfe;
}

.official-distribution__chart {
  width: 100%;
  height: 330px;
}

.official-distribution__legend {
  display: flex;
  justify-content: space-between;
  margin: -12px 18px 0;
  color: #94a3b8;
  font-size: 12px;
}

.official-distribution p {
  margin: 18px 0 0;
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.7;
  text-align: center;
}

.official-distribution a {
  color: #6d28d9;
  text-decoration: none;
}

.official-distribution a:hover {
  text-decoration: underline;
}

@media (max-width: 760px) {
  .official-distribution {
    padding-right: 8px;
    padding-left: 8px;
  }

  .official-distribution__chart {
    height: 290px;
  }
}
</style>
