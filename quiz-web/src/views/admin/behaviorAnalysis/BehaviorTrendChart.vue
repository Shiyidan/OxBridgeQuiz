<!-- 学生行为趋势图：展示北京时间自然日的活跃学生、关键操作与失败操作变化。 -->
<template>
  <div class="behavior-chart-shell">
    <div
      v-show="hasData"
      ref="chartRef"
      class="behavior-trend-chart"
      aria-label="学生关键行为每日趋势图"
    ></div>
    <el-empty v-if="!hasData" description="当前范围暂无学生行为数据" :image-size="72" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { BehaviorAnalyticsTrendItem } from '@/api/admin'

interface TooltipItem {
  axisValue?: string
  marker?: string
  seriesName?: string
  value?: number
}

const props = defineProps<{
  items: BehaviorAnalyticsTrendItem[]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// 只有实际发生过操作时才绘制坐标轴，空范围交给统一空状态展示。
const hasData = computed(() => props.items.some((item) => item.operationCount > 0))

// 接口响应替换后复用图表实例，避免筛选时重复创建 Canvas。
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

// 趋势图使用双轴区分人数与操作次数，并在提示框中保留失败操作定位信息。
function renderChart(): void {
  if (!chartRef.value || !hasData.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  chart.setOption(
    {
      animationDuration: 420,
      color: ['#4f46e5', '#8b5cf6', '#ef4444'],
      grid: { left: 48, right: 52, top: 54, bottom: 40 },
      legend: {
        top: 4,
        right: 8,
        textStyle: { color: '#64748b' },
        data: ['活跃学生', '关键操作', '失败操作'],
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' },
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
        boundaryGap: true,
        data: props.items.map((item) => item.date),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#94a3b8',
          formatter: (value: string) => value.slice(5),
        },
      },
      yAxis: [
        {
          type: 'value',
          minInterval: 1,
          name: '人数',
          nameTextStyle: { color: '#94a3b8' },
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
        },
        {
          type: 'value',
          minInterval: 1,
          name: '次数',
          nameTextStyle: { color: '#94a3b8' },
          axisLabel: { color: '#94a3b8' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '活跃学生',
          type: 'line',
          yAxisIndex: 0,
          smooth: 0.28,
          symbolSize: 6,
          lineStyle: { width: 3 },
          areaStyle: { color: 'rgba(79, 70, 229, 0.10)' },
          data: props.items.map((item) => item.userCount),
        },
        {
          name: '关键操作',
          type: 'bar',
          yAxisIndex: 1,
          barMaxWidth: 18,
          itemStyle: { borderRadius: [4, 4, 0, 0], opacity: 0.56 },
          data: props.items.map((item) => item.operationCount),
        },
        {
          name: '失败操作',
          type: 'line',
          yAxisIndex: 1,
          smooth: 0.2,
          symbol: 'none',
          lineStyle: { width: 2, type: 'dashed' },
          data: props.items.map((item) => item.failureCount),
        },
      ],
    },
    true,
  )
}
</script>

<style scoped lang="scss">
.behavior-chart-shell {
  min-height: 320px;
}

.behavior-trend-chart {
  width: 100%;
  height: 320px;
}

@media (max-width: 768px) {
  .behavior-chart-shell,
  .behavior-trend-chart {
    min-height: 280px;
    height: 280px;
  }
}
</style>
