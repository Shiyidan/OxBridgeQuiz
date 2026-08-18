<!-- 无限模考成绩趋势图：使用 ECharts 展示近五次成绩并提供原生悬浮分数提示。 -->
<template>
  <div
    ref="chartRef"
    class="mock-exam-trend-chart"
    role="img"
    aria-label="近五次模考成绩趋势，悬浮数据点可查看分数"
  ></div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { MockExamOverviewResult } from '@/api/mockExams'

interface TrendTooltipItem {
  axisValue?: string
  marker?: string
  seriesName?: string
  value?: unknown
}

const props = defineProps<{
  overview: MockExamOverviewResult
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// 概览刷新后复用现有 Canvas，只更新当前考试类型对应的近五次数据。
watch(
  () => props.overview,
  () => void nextTick(renderChart),
  { deep: true },
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

// 分数统一保留必要的小数位，使 tooltip 与页面最佳成绩的显示口径一致。
function formatTrendScore(value: unknown): string {
  const score = Number(value)
  if (!Number.isFinite(score)) return '--'
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

// ECharts tooltip 回调只读取当前折线图需要的安全字段。
function isTrendTooltipItem(value: unknown): value is TrendTooltipItem {
  return typeof value === 'object' && value !== null
}

// 近五次各成绩系列共享时间轴，悬浮任一横轴位置时集中展示该次全部分数。
function renderChart(): void {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  const labels = props.overview.labels.slice(-5)
  const maxScore = Math.max(props.overview.maxScore || 9, 1)

  chart.setOption(
    {
      animationDuration: 360,
      color: ['#3478f6', '#00b85a', '#d98900'],
      grid: { left: 16, right: 12, top: 14, bottom: 34 },
      legend: {
        left: 0,
        bottom: 0,
        itemWidth: 8,
        itemHeight: 8,
        icon: 'circle',
        textStyle: { color: '#7a7a7a', fontSize: 10 },
      },
      tooltip: {
        trigger: 'axis',
        confine: true,
        axisPointer: {
          type: 'line',
          lineStyle: { color: '#cfd5dd', type: 'dashed' },
        },
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : [params]).filter(isTrendTooltipItem)
          const scoreRows = items
            .filter((item) => item.value !== null && item.value !== undefined)
            .map(
              (item) =>
                `${item.marker || ''}${item.seriesName || '成绩'}：${formatTrendScore(item.value)} 分`,
            )
          return [items[0]?.axisValue || '', ...scoreRows].filter(Boolean).join('<br/>')
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: labels,
        axisTick: { show: false },
        axisLabel: { show: false },
        axisLine: { lineStyle: { color: '#e2e5e9' } },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: maxScore,
        axisTick: { show: false },
        axisLabel: { show: false },
        axisLine: { show: true, lineStyle: { color: '#e2e5e9' } },
        splitLine: { show: false },
      },
      series: props.overview.series.map((series) => ({
        name: series.label,
        type: 'line',
        data: series.values.slice(-5),
        connectNulls: false,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { width: 2 },
        itemStyle: { borderColor: '#ffffff', borderWidth: 1.5 },
        emphasis: { focus: 'series', scale: 1.3 },
      })),
    },
    true,
  )
}
</script>

<style scoped lang="scss">
.mock-exam-trend-chart {
  width: 100%;
  height: 138px;
  margin-top: 4px;
}
</style>
