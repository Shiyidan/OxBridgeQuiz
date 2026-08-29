<!-- 网站流量趋势图：在同一时间轴区分登录学生、匿名访客与新增注册。 -->
<template>
  <div class="traffic-chart-shell">
    <div
      v-show="hasData"
      ref="chartRef"
      class="traffic-trend-chart"
      role="img"
      aria-label="每日登录学生与匿名访客折线、学生注册人数柱形趋势图"
    ></div>
    <el-empty v-if="!hasData" description="当前范围暂无网站访问与注册数据" :image-size="72" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { TrafficAnalyticsTrendItem } from '@/api/admin'

interface TooltipItem {
  axisValue?: string
  marker?: string
  seriesName?: string
  value?: number
}

const props = defineProps<{ items: TrafficAnalyticsTrendItem[] }>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// 任一核心序列存在有效值时显示组合图，确保仅有访问或仅有注册的日期范围仍可分析。
const hasData = computed(() =>
  props.items.some((item) => item.visitCount > 0 || item.registrationCount > 0),
)
// 数据范围变化时复用同一实例，避免筛选过程中重复创建 Canvas。
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

// Tooltip 使用纯统计文本，所有值均来自接口，不在前端推测或补造趋势。
function tooltipFormatter(params: unknown): string {
  const items = (Array.isArray(params) ? params : []) as TooltipItem[]
  const rows = items.map(
    (item) => `${item.marker || ''}${item.seriesName || ''}：${Number(item.value || 0)}`,
  )
  return [items[0]?.axisValue || '', ...rows].filter(Boolean).join('<br/>')
}

// 组合图以服务端身份分类绘制登录学生与匿名访客折线。
function renderChart(): void {
  if (!chartRef.value || !hasData.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  const sharedXAxis = {
    type: 'category' as const,
    data: props.items.map((item) => item.date),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#cbd5e1' } },
    axisLabel: {
      color: '#94a3b8',
      hideOverlap: true,
      formatter: (value: string) => value.slice(5),
    },
  }

  chart.setOption(
    {
      animationDuration: 420,
      color: ['#4f46e5', '#0f9f8f', '#f59e0b'],
      grid: { left: 52, right: 56, top: 52, bottom: 40 },
      legend: {
        top: 4,
        right: 8,
        textStyle: { color: '#64748b' },
        data: ['登录学生', '匿名访客', '新增注册'],
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'line' }, formatter: tooltipFormatter },
      xAxis: sharedXAxis,
      yAxis: [
        {
          type: 'value',
          minInterval: 1,
          name: '每日去重访问',
          nameTextStyle: { color: '#94a3b8' },
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
        },
        {
          type: 'value',
          minInterval: 1,
          name: '新增注册',
          nameTextStyle: { color: '#94a3b8' },
          axisLabel: { color: '#94a3b8' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '登录学生',
          type: 'line',
          yAxisIndex: 0,
          smooth: 0.24,
          symbolSize: 6,
          lineStyle: { width: 3 },
          areaStyle: { color: 'rgba(79, 70, 229, 0.06)' },
          data: props.items.map((item) => item.studentVisitCount),
        },
        {
          name: '匿名访客',
          type: 'line',
          yAxisIndex: 0,
          smooth: 0.24,
          symbolSize: 6,
          lineStyle: { width: 3 },
          data: props.items.map((item) => item.anonymousVisitCount),
        },
        {
          name: '新增注册',
          type: 'bar',
          yAxisIndex: 1,
          barMaxWidth: 22,
          itemStyle: { borderRadius: [4, 4, 0, 0], opacity: 0.8 },
          data: props.items.map((item) => item.registrationCount),
        },
      ],
    },
    true,
  )
}
</script>

<style scoped lang="scss">
.traffic-chart-shell,
.traffic-trend-chart {
  width: 100%;
  min-height: 320px;
  height: 320px;
}

@media (max-width: 768px) {
  .traffic-chart-shell,
  .traffic-trend-chart {
    min-height: 280px;
    height: 280px;
  }
}
</style>
