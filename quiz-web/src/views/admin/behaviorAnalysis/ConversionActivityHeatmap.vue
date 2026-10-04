<!-- 转化分析中的付费学习热力图：按星期与小时显示去重后的用户活跃人次。 -->
<template>
  <div class="heatmap-shell">
    <div
      v-if="hasData"
      ref="chartRef"
      class="heatmap-chart"
      role="img"
      aria-label="付费用户每周学习活跃时段，按北京时间显示"
    />
    <el-empty v-else description="所选期间暂无付费后的学习行为" :image-size="80" />
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { ConversionCell } from '@/api/conversionAnalytics'
const props = defineProps<{ items: ConversionCell[] }>()
const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let observer: ResizeObserver | null = null
const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
// 没有有效活动时展示空状态，不把全零色块当作可解释的热区。
const hasData = computed(() => props.items.some((item) => item.userHours > 0))
// 小时格子的强度由用户日去重计数决定，避免某个用户重复点击支配热图。
function render() {
  if (!chartRef.value || !hasData.value) {
    observer?.disconnect()
    chart?.dispose()
    chart = null
    return
  }
  if (!chart) {
    chart = echarts.init(chartRef.value)
    observer = new ResizeObserver(() => chart?.resize())
    observer.observe(chartRef.value)
  }
  chart.setOption(
    {
      grid: { top: 12, left: 45, right: 12, bottom: 78 },
      tooltip: {
        formatter: (params: unknown) => {
          const value = (params as { value: number[] }).value
          return `${days[value[1]!]!} ${value[0]}:00–${value[0]! + 1}:00<br/>${value[2]} 活跃人次 · ${value[3]} 位学生`
        },
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')),
        splitArea: { show: true },
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: '#64748b', interval: 1 },
      },
      yAxis: {
        type: 'category',
        data: days,
        inverse: true,
        axisTick: { show: false },
        axisLine: { show: false },
        axisLabel: { color: '#64748b' },
      },
      visualMap: {
        dimension: 2,
        min: 0,
        max: Math.max(1, ...props.items.map((item) => item.userHours)),
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        text: ['活跃多', '活跃少'],
        calculable: false,
        inRange: { color: ['#f1f5f9', '#c7d2fe', '#818cf8', '#4f46e5'] },
      },
      series: [
        {
          type: 'heatmap',
          data: props.items.map((item) => [item.hour, item.weekday, item.userHours, item.users]),
          itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 4 },
          emphasis: { itemStyle: { borderColor: '#312e81', borderWidth: 2 } },
        },
      ],
    },
    true,
  )
}
watch(
  () => props.items,
  async () => {
    await nextTick()
    render()
  },
)
onMounted(render)
onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
})
</script>
<style scoped>
.heatmap-shell {
  min-width: 0;
  overflow-x: auto;
}
.heatmap-chart {
  width: 100%;
  min-width: 540px;
  height: 310px;
}
</style>
