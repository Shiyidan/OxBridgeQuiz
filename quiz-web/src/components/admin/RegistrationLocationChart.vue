<!-- 注册地址分布图：以饼图展示所选周期内学生注册国家和地区占比。 -->
<template>
  <div class="location-chart-shell">
    <div
      v-show="hasData"
      ref="chartRef"
      class="location-chart"
      role="img"
      aria-label="注册学生国家和地区占比饼状图"
    ></div>
    <el-empty v-if="!hasData" description="当前范围暂无新增学生" :image-size="72" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { TrafficRegistrationLocationItem } from '@/api/admin'

const props = defineProps<{ items: TrafficRegistrationLocationItem[] }>()

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

// 饼图仅在存在真实注册人数时展示，空数组或全零数据统一进入空状态。
const hasData = computed(() => props.items.some((item) => item.registrationCount > 0))

// 地区数据随筛选范围变化时更新现有实例，避免反复创建 Canvas。
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

// 图例同时提供地区和人数，长地区名截断后仍可通过悬浮提示查看完整文本。
function legendFormatter(name: string): string {
  const item = props.items.find((candidate) => candidate.location === name)
  const shortName = name.length > 12 ? `${name.slice(0, 11)}…` : name
  return `${shortName}  ${item?.registrationCount || 0} 人`
}

// 地址图固定采用左图右图例，半宽卡片与窄屏下保持一致的阅读顺序。
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
          name: '注册地址',
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
            name: item.location,
            value: item.registrationCount,
          })),
        },
      ],
    },
    true,
  )
}
</script>

<style scoped lang="scss">
.location-chart-shell,
.location-chart {
  width: 100%;
  min-height: 270px;
  height: 270px;
}
</style>
