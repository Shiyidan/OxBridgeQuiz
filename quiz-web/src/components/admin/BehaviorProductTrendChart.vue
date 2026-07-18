<!-- 产品使用趋势图：按北京时间自然日对比诊断、题库、模考完成次数与诊断报告查看次数。 -->
<template>
  <div class="product-trend-shell">
    <div
      v-show="hasData"
      ref="chartRef"
      class="product-trend-chart"
      aria-label="学生产品使用每日趋势图"
    ></div>
    <el-empty v-if="!hasData" description="当前范围暂无学习活动数据" :image-size="72" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { BehaviorProductTrendItem } from '@/api/admin'

interface TooltipItem {
  axisValue?: string
  marker?: string
  seriesName?: string
  value?: number
}

const props = defineProps<{
  items: BehaviorProductTrendItem[]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// 四项核心行为均为零时使用空状态，避免无意义坐标轴占据页面空间。
const hasData = computed(() =>
  props.items.some(
    (item) =>
      item.diagnosticTestCount +
        item.questionBankPracticeCount +
        item.mockExamCount +
        item.reportViewCount >
      0,
  ),
)

// 日期筛选替换响应后复用图表实例，确保连续查询时没有多余 Canvas。
watch(
  () => props.items,
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

// 四条折线共享次数坐标，便于直接观察不同学习路径的使用峰值和相对变化。
function renderChart(): void {
  if (!chartRef.value || !hasData.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  chart.setOption(
    {
      animationDuration: 420,
      color: ['#4f46e5', '#0891b2', '#d97706', '#7c3aed'],
      grid: { left: 48, right: 24, top: 58, bottom: 40 },
      legend: {
        top: 4,
        right: 8,
        textStyle: { color: '#64748b' },
        data: ['诊断测试', '试题库练习', '模考练习', '查看分析报告'],
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const items = (Array.isArray(params) ? params : []) as TooltipItem[]
          const rows = items.map(
            (item) => `${item.marker || ''}${item.seriesName || ''}：${Number(item.value || 0)}`,
          )
          return [items[0]?.axisValue || '', ...rows].filter(Boolean).join('<br/>')
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: props.items.map((item) => item.date),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#94a3b8', formatter: (value: string) => value.slice(5) },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        name: '次数',
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
      },
      series: [
        {
          name: '诊断测试',
          type: 'line',
          smooth: 0.24,
          symbolSize: 6,
          lineStyle: { width: 3 },
          data: props.items.map((item) => item.diagnosticTestCount),
        },
        {
          name: '试题库练习',
          type: 'line',
          smooth: 0.24,
          symbolSize: 6,
          lineStyle: { width: 3 },
          data: props.items.map((item) => item.questionBankPracticeCount),
        },
        {
          name: '模考练习',
          type: 'line',
          smooth: 0.24,
          symbolSize: 6,
          lineStyle: { width: 3 },
          data: props.items.map((item) => item.mockExamCount),
        },
        {
          name: '查看分析报告',
          type: 'line',
          smooth: 0.24,
          symbolSize: 6,
          lineStyle: { width: 2, type: 'dashed' },
          data: props.items.map((item) => item.reportViewCount),
        },
      ],
    },
    true,
  )
}
</script>

<style scoped lang="scss">
.product-trend-shell,
.product-trend-chart {
  width: 100%;
  min-height: 320px;
}

.product-trend-chart {
  height: 320px;
}

@media (max-width: 768px) {
  .product-trend-shell,
  .product-trend-chart {
    min-height: 280px;
    height: 280px;
  }
}
</style>
