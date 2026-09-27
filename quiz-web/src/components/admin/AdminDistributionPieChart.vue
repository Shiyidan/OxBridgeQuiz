<!-- 后台人数分布饼图：统一图例、占比提示、空状态和尺寸更新。 -->
<template>
  <div class="distribution-chart-shell">
    <div
      v-show="hasData"
      ref="chartRef"
      class="distribution-chart"
      role="img"
      :aria-label="`${title}饼状图`"
    ></div>
    <el-empty v-if="!hasData" :description="emptyText" :image-size="72" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'


const props = withDefaults(defineProps<{
  items: { label: string; count: number }[]
  title: string
  emptyText?: string
}>(), { emptyText: '当前范围暂无新增学生' })

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// 饼图仅在存在真实人数时展示，空数组或全零数据统一进入空状态。
const hasData = computed(() => props.items.some((item) => item.count > 0))

// 分布数据随筛选范围变化时更新现有实例，避免反复创建 Canvas。
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

// 图例同时提供分类和人数，长分类名使用省略显示。
function legendFormatter(name: string): string {
  const item = props.items.find((candidate) => candidate.label === name)
  const shortName = name.length > 12 ? `${name.slice(0, 11)}…` : name
  return `${shortName}  ${item?.count || 0} 人`
}

// 分布图固定采用左图右图例，半宽卡片与窄屏下保持一致的阅读顺序。
function renderChart(): void {
  if (!chartRef.value || !hasData.value) return
  if (!chart) chart = echarts.init(chartRef.value)

  chart.setOption(
    {
      animationDuration: 420,
      color: ['#4f46e5', '#0f9f8f', '#f59e0b', '#e879f9', '#38bdf8', '#94a3b8'],
      tooltip: {
        trigger: 'item',
        renderMode: 'richText',
        formatter: '{b}\n{c} 人 · {d}%',
      },
      legend: {
        orient: 'vertical',
        top: 'middle',
        right: 0,
        width: '40%',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 15,
        textStyle: { color: '#64748b', fontSize: 12 },
        formatter: legendFormatter,
      },
      series: [
        {
          name: props.title,
          type: 'pie',
          radius: '55%',
          center: ['27%', '50%'],
          minAngle: 4,
          stillShowZeroSum: false,
          label: {
            color: '#475569',
            fontSize: 11,
            formatter: '{d}%',
          },
          labelLine: {
            length: 10,
            length2: 7,
            lineStyle: { color: '#cbd5e1' },
          },
          itemStyle: {
            borderColor: '#ffffff',
            borderWidth: 2,
            borderRadius: 3,
          },
          emphasis: { scaleSize: 4 },
          data: props.items.map((item) => ({
            name: item.label,
            value: item.count,
          })),
        },
      ],
    },
    true,
  )
}
</script>

<style scoped lang="scss">
.distribution-chart-shell,
.distribution-chart {
  width: 100%;
  min-height: 270px;
  height: 270px;
}
</style>
