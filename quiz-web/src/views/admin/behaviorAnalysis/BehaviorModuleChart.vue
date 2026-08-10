<!-- 学生操作模块图：对比各审计模块的活跃人数与关键操作次数，并支持点击筛选。 -->
<template>
  <div class="behavior-chart-shell">
    <div
      v-show="hasData"
      ref="chartRef"
      class="behavior-module-chart"
      aria-label="学生操作模块使用排行图"
    ></div>
    <el-empty v-if="!hasData" description="当前范围暂无模块使用数据" :image-size="72" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { BehaviorAnalyticsModule } from '@/api/admin'
import { operationModuleLabel } from '@/constants/operationAudit'

const props = defineProps<{
  items: BehaviorAnalyticsModule[]
}>()

const emit = defineEmits<{
  select: [module: string]
}>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// 无模块数据时显示明确空状态，避免留下可误解的空排行坐标轴。
const hasData = computed(() => props.items.some((item) => item.operationCount > 0))

// 模块排行随筛选结果整体替换，并保留同一个 ECharts 实例。
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

// 横向分组柱展示 UV 与操作量，点击任一柱后将模块编码交给页面应用筛选。
function renderChart(): void {
  if (!chartRef.value || !hasData.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  const displayedItems = [...props.items].reverse()
  chart.off('click')
  chart.on('click', (params) => {
    const item = displayedItems[params.dataIndex]
    if (item) emit('select', item.module)
  })
  chart.setOption(
    {
      animationDuration: 420,
      color: ['#4f46e5', '#a78bfa'],
      grid: { left: 82, right: 24, top: 44, bottom: 30 },
      legend: {
        top: 2,
        right: 6,
        textStyle: { color: '#64748b' },
        data: ['活跃学生', '关键操作'],
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#eef2f7', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: displayedItems.map((item) => operationModuleLabel(item.module)),
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: '#64748b' },
      },
      series: [
        {
          name: '活跃学生',
          type: 'bar',
          barMaxWidth: 18,
          itemStyle: { borderRadius: [0, 4, 4, 0] },
          data: displayedItems.map((item) => item.userCount),
        },
        {
          name: '关键操作',
          type: 'bar',
          barMaxWidth: 18,
          itemStyle: { borderRadius: [0, 4, 4, 0], opacity: 0.66 },
          data: displayedItems.map((item) => item.operationCount),
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

.behavior-module-chart {
  width: 100%;
  height: 320px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .behavior-chart-shell,
  .behavior-module-chart {
    min-height: 280px;
    height: 280px;
  }
}
</style>
