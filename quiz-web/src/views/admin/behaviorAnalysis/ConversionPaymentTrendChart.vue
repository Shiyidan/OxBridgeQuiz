<!-- 转化分析的每日付费人数图表：按北京时间付款日期展示当天去重的付费学生人数。 -->
<template>
  <div
    ref="chartRef"
    class="payment-trend-chart"
    role="img"
    aria-label="每日付费人数柱状图，按北京时间付款成功日期统计"
  />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { ConversionDailyPayment } from '@/api/conversionAnalytics'

const props = defineProps<{ items: ConversionDailyPayment[] }>()
const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

// 日期筛选后复用图表实例；零付款日期保留坐标与零值，方便观察连续趋势。
function renderChart(): void {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption(
    {
      animationDuration: 300,
      grid: { top: 30, right: 20, bottom: 35, left: 48, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value: unknown) => `${value} 人`,
      },
      xAxis: {
        type: 'category',
        data: props.items.map((item) => item.date),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#94a3b8', formatter: (value: string) => value.slice(5) },
      },
      yAxis: {
        type: 'value',
        name: '人数',
        min: 0,
        minInterval: 1,
        max: props.items.some((item) => item.paidUsers > 0) ? undefined : 1,
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
      },
      series: [
        {
          name: '付费人数',
          type: 'bar',
          barMaxWidth: 32,
          itemStyle: { color: '#6366f1', borderRadius: [4, 4, 0, 0] },
          emphasis: { itemStyle: { color: '#4f46e5' } },
          data: props.items.map((item) => item.paidUsers),
        },
      ],
    },
    true,
  )
}

watch(
  () => props.items,
  () => void nextTick(renderChart),
)
onMounted(() => {
  renderChart()
  if (chartRef.value) {
    observer = new ResizeObserver(() => chart?.resize())
    observer.observe(chartRef.value)
  }
})
onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
})
</script>

<style scoped>
.payment-trend-chart {
  width: 100%;
  height: 320px;
}
@media (max-width: 768px) {
  .payment-trend-chart {
    height: 280px;
  }
}
</style>
