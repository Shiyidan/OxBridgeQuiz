<!-- 知识图谱画布：章节总览与知识点关系共用，选中节点另有可键盘访问的文字列表。 -->
<template>
  <div class="graph-canvas-shell">
    <div
      ref="host"
      class="graph-canvas"
      :class="{ 'is-overview': overview, 'is-dense': nodes.length > 20 }"
      role="img"
      :aria-label="description"
    />
    <div class="graph-zoom-controls" aria-label="图谱缩放">
      <AppButton
        type="secondary"
        size="mini"
        :icon="Minus"
        :disabled="cameraZoom <= 0.65"
        aria-label="缩小图谱"
        @click="zoomBy(1 / 1.25)"
      />
      <AppButton
        type="secondary"
        size="mini"
        :icon="Plus"
        :disabled="cameraZoom >= 4"
        aria-label="放大图谱"
        @click="zoomBy(1.25)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { graphic, init, use, type EChartsCoreOption, type EChartsType } from 'echarts/core'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Minus, Plus } from '@element-plus/icons-vue'
import AppButton from '@/components/AppButton.vue'
import type { KnowledgeRelationType } from '@/content/knowledgeGraph/types'
import { layoutKnowledgeGraph } from '@/content/knowledgeGraph/layout'
import {
  graphDetailLevelForZoom,
  type GraphDetailLevel,
} from '@/content/knowledgeGraph/maths1Overview'

use([GraphChart, TooltipComponent, CanvasRenderer])
export interface GraphVisualNode {
  id: string
  name: string
  alternateName: string
  learningStatusText: string
  questionCountText: string
  detailLevel?: GraphDetailLevel
  lit?: boolean
  selected?: boolean
}
export interface GraphVisualEdge {
  id: string
  source: string
  target: string
  type?: KnowledgeRelationType
  detailLevel?: GraphDetailLevel
}
export interface GraphDisplayStats {
  level: GraphDetailLevel
  nodes: number
  edges: number
}
const props = defineProps<{
  nodes: GraphVisualNode[]
  edges: GraphVisualEdge[]
  overview: boolean
  description: string
  resetKey: number
}>()
const emit = defineEmits<{ select: [code: string]; display: [stats: GraphDisplayStats] }>()
const host = ref<HTMLDivElement>()
const cameraZoom = ref(1)
let chart: EChartsType | undefined
let observer: ResizeObserver | undefined
let frame: number | undefined
let scopeKey = ''
let renderedResetKey = -1
let detailLevel: GraphDetailLevel = 0
let positions = new Map<string, { x: number; y: number }>()
let labelMetrics = new Map<string, { width: number; height: number }>()
let layoutWidth = 1000
let layoutHeight = 650
let layoutBounds = { x: 0, y: 0, width: 1000, height: 650 }
let visibleNodeIds = new Set<string>()
const edgeColors = { prerequisite: '#9aaddb', application: '#9cc9c5', connection: '#c4c9d4' }

// 读取 ECharts 已更新的视口，使分层、语言与个人进度更新都保留缩放和平移。
function viewport(): { zoom: number; center?: [number | string, number | string] } {
  const series = (
    chart?.getOption().series as
      | Array<{ zoom?: number; center?: [number | string, number | string] }>
      | undefined
  )?.[0]
  return { zoom: series?.zoom ?? 1, center: series?.center }
}

// 缩放控件与滚轮共用 graphRoam，因此按钮也会逐层展开或收起细节。
function zoomBy(factor: number): void {
  if (!chart || !host.value) return
  chart.dispatchAction({
    type: 'graphRoam',
    seriesId: 'knowledge-network',
    zoom: factor,
    originX: host.value.clientWidth / 2,
    originY: host.value.clientHeight / 2,
  })
}

// 合并连续滚轮与尺寸变化，避免在一个浏览器帧内重复提交图谱配置。
function scheduleRender(): void {
  if (frame !== undefined) return
  frame = requestAnimationFrame(() => {
    frame = undefined
    render()
  })
}

// 复用绘图库的实际换行测量，并同时预留中英文尺寸，切换语言无需重排节点。
function measureLabel(node: GraphVisualNode): { width: number; height: number } {
  const style = {
    fontSize: node.selected || (props.overview && node.detailLevel === 0) ? 12 : 11,
    fontWeight: node.selected ? 600 : 400,
    fontFamily: 'sans-serif',
    lineHeight: 15,
  }
  const names = [node.name, node.alternateName]
  const width = Math.min(
    132,
    Math.ceil(
      Math.max(
        ...names.map(
          (text) => new graphic.Text({ style: { ...style, text } }).getBoundingRect().width,
        ),
      ),
    ),
  )
  const height = Math.max(
    ...names.map(
      (text) =>
        new graphic.Text({
          style: { ...style, text, width, overflow: 'break', padding: [2, 4] },
        }).getBoundingRect().height,
    ),
  )
  return { width, height }
}

// 全范围只布局一次；以布局的原始比例映射屏幕，隐藏节点不再撑拉核心网络。
function render(): void {
  if (!chart || !host.value) return
  const focused = props.nodes.some((node) => node.selected)
  const nextScope = `${props.overview}:${props.nodes.map((node) => `${node.id}:${!!node.selected}`).join(',')}:${props.edges.map((edge) => edge.id).join(',')}`
  const reset = scopeKey !== nextScope || renderedResetKey !== props.resetKey
  const camera = reset ? { zoom: 1, center: undefined } : viewport()
  cameraZoom.value = camera.zoom
  if (reset) {
    scopeKey = nextScope
    renderedResetKey = props.resetKey
    detailLevel = props.overview ? 0 : 2
    layoutWidth = Math.max(props.overview ? 1000 : 800, host.value.clientWidth)
    layoutHeight = Math.max(props.nodes.length > 20 ? 500 : 400, host.value.clientHeight)
    labelMetrics = new Map(props.nodes.map((node) => [node.id, measureLabel(node)]))
    positions = new Map(
      layoutKnowledgeGraph(
        props.nodes.map((node) => ({
          id: node.id,
          labelWidth: labelMetrics.get(node.id)!.width,
          labelHeight: labelMetrics.get(node.id)!.height,
          detailLevel: props.overview ? node.detailLevel : 0,
        })),
        props.edges.map((edge) => ({
          ...edge,
          detailLevel: props.overview ? edge.detailLevel : 0,
        })),
        layoutWidth,
        layoutHeight,
      ).map((point) => [point.id, point]),
    )
    const xs = [...positions.values()].map((point) => point.x)
    const ys = [...positions.values()].map((point) => point.y)
    const minX = xs.length ? Math.min(...xs) : layoutWidth / 2
    const maxX = xs.length ? Math.max(...xs) : minX
    const minY = ys.length ? Math.min(...ys) : layoutHeight / 2
    const maxY = ys.length ? Math.max(...ys) : minY
    // 与 ECharts 单点范围的 ±1 规则对齐，小局部图也保持居中且不被拉伸。
    layoutBounds = {
      x: minX === maxX ? minX - 1 : minX,
      y: minY === maxY ? minY - 1 : minY,
      width: maxX === minX ? 2 : maxX - minX,
      height: maxY === minY ? 2 : maxY - minY,
    }
  }
  const coreOverview = props.overview && detailLevel === 0
  visibleNodeIds = new Set(
    props.nodes
      .filter((node) => !props.overview || (node.detailLevel ?? 2) <= detailLevel)
      .map((node) => node.id),
  )
  const edges = props.edges.filter(
    (edge) =>
      visibleNodeIds.has(edge.source) &&
      visibleNodeIds.has(edge.target) &&
      (!props.overview || (edge.detailLevel ?? 2) <= detailLevel),
  )
  const data = props.nodes.map((node) => {
    const visible = visibleNodeIds.has(node.id)
    return {
      id: node.id,
      name: node.name,
      x: positions.get(node.id)?.x,
      y: positions.get(node.id)?.y,
      symbol: visible ? 'circle' : 'none',
      symbolSize: node.selected ? 11 : coreOverview ? 6 : props.overview ? 5 : 6,
      draggable: false,
      tooltip: {
        show: visible,
        formatter: [node.learningStatusText, node.questionCountText].join('\n'),
      },
      emphasis: { disabled: !visible, label: { show: visible } },
      itemStyle: {
        color: node.lit ? '#e5a800' : '#5574e8',
        borderWidth: 0,
      },
      label: {
        show: visible,
        position: 'bottom',
        color: node.selected ? '#3d58ab' : '#788297',
        fontSize: node.selected || coreOverview ? 12 : 11,
        fontWeight: node.selected ? 600 : 400,
        distance: 5,
        formatter: node.name,
        width: labelMetrics.get(node.id)?.width ?? 132,
        overflow: 'break',
        lineHeight: 15,
        // 只沿文字描边，避免中英文共用的整块标签背景截断后方细线。
        textBorderColor: '#fff',
        textBorderWidth: 2,
        padding: [2, 4],
      },
    }
  })
  const option: EChartsCoreOption = {
    animation: false,
    tooltip: { trigger: 'item', renderMode: 'richText', confine: true, formatter: '{b}' },
    series: [
      {
        id: 'knowledge-network',
        type: 'graph',
        layout: 'none',
        roam: true,
        zoom: camera.zoom,
        center: camera.center,
        nodeScaleRatio: 0,
        left: (host.value.clientWidth - layoutWidth) / 2 + layoutBounds.x,
        width: layoutBounds.width,
        top: (host.value.clientHeight - layoutHeight) / 2 + layoutBounds.y,
        height: layoutBounds.height,
        scaleLimit: { min: 0.65, max: 4 },
        data,
        links: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          symbol: ['none', focused && edge.type && edge.type !== 'connection' ? 'arrow' : 'none'],
          symbolSize: 3,
          lineStyle: {
            color:
              focused && edge.type ? edgeColors[edge.type] : coreOverview ? '#aeb9cb' : '#c5cbd8',
            width: focused ? 0.7 : coreOverview ? 0.6 : 0.45,
            opacity: focused ? 0.8 : coreOverview ? 0.78 : 0.65,
            type: focused && edge.type === 'connection' ? 'dashed' : 'solid',
            curveness: 0,
          },
          tooltip: { show: false },
          // 连线只表达关系；悬浮聚焦由知识点节点触发，避免经过线条时整图明暗变化。
          emphasis: { disabled: true, focus: 'none' },
          // 连线禁用自身悬浮后，仍随节点聚焦淡化无关关系。
          blur: { lineStyle: { opacity: (focused ? 0.8 : coreOverview ? 0.78 : 0.65) * 0.1 } },
        })),
        emphasis: {
          focus: 'adjacency',
          scale: 1.5,
          label: { show: true },
          lineStyle: { width: 0.8, opacity: 0.9 },
        },
        labelLayout: { hideOverlap: false },
      },
    ],
  }
  chart.dispatchAction({ type: 'hideTip' })
  chart.setOption(option, { notMerge: true })
  emit('display', { level: detailLevel, nodes: visibleNodeIds.size, edges: edges.length })
}

onMounted(() => {
  if (!host.value) return
  chart = init(host.value)
  // 禁用连线提示后，移到连线还需清除上一节点留下的浮层。
  chart.on('mouseover', (params) => {
    if (params.dataType === 'edge') chart?.dispatchAction({ type: 'hideTip' })
  })
  // ECharts 线条默认使用手形光标，关系线不提供操作入口。
  chart.on('mousemove', (params) => {
    if (params.dataType === 'edge') chart?.getZr().setCursorStyle('default')
  })
  chart.on('click', (params) => {
    if (params.dataType !== 'node') return
    const id = (params.data as { id?: string } | undefined)?.id
    if (id && visibleNodeIds.has(id)) emit('select', id)
  })
  chart.on('graphroam', () => {
    cameraZoom.value = viewport().zoom
    if (!props.overview) return
    const next = graphDetailLevelForZoom(cameraZoom.value, detailLevel)
    if (next === detailLevel) return
    detailLevel = next
    scheduleRender()
  })
  observer = new ResizeObserver(() => {
    chart?.resize()
    scheduleRender()
  })
  observer.observe(host.value)
  render()
})
watch(() => [props.nodes, props.edges, props.overview, props.resetKey], scheduleRender, {
  deep: true,
})
onBeforeUnmount(() => {
  observer?.disconnect()
  if (frame !== undefined) cancelAnimationFrame(frame)
  chart?.dispose()
})
</script>

<style scoped>
.graph-canvas-shell {
  position: relative;
  min-width: 0;
}
.graph-zoom-controls {
  position: absolute;
  right: 16px;
  bottom: 14px;
  display: flex;
  gap: 6px;
}
.graph-canvas {
  width: 100%;
  height: clamp(360px, 50vh, 540px);
  min-width: 0;
}
.graph-canvas.is-overview,
.graph-canvas.is-dense {
  height: clamp(480px, 65vh, 720px);
}
@media (max-width: 680px) {
  .graph-canvas,
  .graph-canvas.is-overview,
  .graph-canvas.is-dense {
    height: 380px;
  }
}
</style>
