<!-- 转化分析的累计付费用户折线图：展示截至每个北京时间自然日的历史付费规模。 -->
<template>
  <div
    ref="chartRef"
    class="paid-user-growth-chart"
    role="img"
    aria-label="累计付费用户趋势折线图，按北京时间统计截至每日的付费用户总数"
  />
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { ConversionPaidUserGrowthPoint } from '@/api/conversionAnalytics'

const props = defineProps<{ items: ConversionPaidUserGrowthPoint[] }>()
const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null

// 无新增付费时保持累计值，折线使用真实日值连接，避免平滑曲线产生虚构回落。
function renderChart(): void {
  if (!chartRef.value) return
  if (!chart) chart = echarts.init(chartRef.value)
  chart.setOption(
    {
      animationDuration: 300,
      grid: { top: 30, right: 20, bottom: 35, left: 48, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
        valueFormatter: (value: unknown) => `${value} 人`,
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
        name: '人数',
        min: 0,
        minInterval: 1,
        max: props.items.some((item) => item.cumulativePaidUsers > 0) ? undefined : 1,
        nameTextStyle: { color: '#94a3b8' },
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
      },
      series: [
        {
          name: '累计付费用户',
          type: 'line',
          smooth: false,
          showSymbol: props.items.length <= 14,
          symbolSize: 6,
          lineStyle: { color: '#6366f1', width: 3 },
          itemStyle: { color: '#6366f1' },
          areaStyle: { color: '#6366f1', opacity: 0.08 },
          data: props.items.map((item) => item.cumulativePaidUsers),
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
.paid-user-growth-chart {
  width: 100%;
  height: 320px;
}
@media (max-width: 768px) {
  .paid-user-growth-chart {
    height: 280px;
  }
}
</style>
