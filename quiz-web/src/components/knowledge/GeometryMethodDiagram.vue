<!-- 坐标与变换讲义图示：使用同一等比例坐标网格呈现关系，并比较组合变换的顺序。 -->
<template>
  <figure class="method-figure">
    <figcaption><strong>{{ diagram.title }}</strong><span>{{ diagram.caption }}</span></figcaption>
    <div v-if="kind === 'order'" class="order-controls" aria-label="比较变换顺序">
      <AppButton size="small" type="secondary" :aria-pressed="!reverse" @click="reverse = false">先平移</AppButton>
      <AppButton size="small" type="secondary" :aria-pressed="reverse" @click="reverse = true">先旋转</AppButton>
    </div>
    <svg class="coordinate-plot" viewBox="0 0 320 270" role="img" :aria-label="diagram.caption">
      <g class="grid-lines">
        <path v-for="n in ticks" :key="'x'+n" :d="`M ${px(n)} ${py(-2)} V ${py(7)}`" />
        <path v-for="n in ticks" :key="'y'+n" :d="`M ${px(-3)} ${py(n)} H ${px(8)}`" />
      </g>
      <path class="axes" :d="`M ${px(-3)} ${py(0)} H ${px(8)} M ${px(0)} ${py(-2)} V ${py(7)}`" />
      <text :x="px(8)" :y="py(0)-7">x</text><text :x="px(0)+7" :y="py(7)">y</text>
      <text :x="px(0)-14" :y="py(0)+15">0</text>
      <g v-for="n in [2,4,6]" :key="n" class="ticks"><text :x="px(n)-3" :y="py(0)+15">{{ n }}</text><text :x="px(0)-16" :y="py(n)+4">{{ n }}</text></g>
      <polyline v-for="(line,index) in diagram.lines" :key="index" :points="line.points.map(p => `${px(p[0])},${py(p[1])}`).join(' ')" :class="['shape', line.tone]" />
      <g v-for="point in diagram.points" :key="point.label">
        <circle :cx="px(point.at[0])" :cy="py(point.at[1])" r="3.5" :class="['point', point.tone]" />
        <text :x="px(point.at[0])+(point.dx ?? 7)" :y="py(point.at[1])+(point.dy ?? -9)" class="point-label">{{ point.label }}</text>
      </g>
    </svg>
    <p aria-live="polite"><KnowledgeText :text="diagram.explanation" /></p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'
import type { GeometryMethodSection } from '@/content/knowledge/coordinateTransformMethods'

const props = defineProps<{ kind: NonNullable<GeometryMethodSection['diagram']> }>()
const reverse = ref(false)
const ticks = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
type Point = [number, number]
interface Diagram {
  title: string
  caption: string
  explanation: string
  lines: { points: Point[]; tone: string }[]
  points: { at: Point; label: string; tone?: string; dx?: number; dy?: number }[]
}
// 横纵轴采用相同单位长度，确保直角与旋转在图上保持真实比例。
function px(x: number) { return 90 + 24 * x }
// SVG 纵轴向下，数学坐标向上，统一反向换算。
function py(y: number) { return 205 - 24 * y }
// 图示只解释通用关系；组合变换由相同起点和操作计算两种顺序的结果。
const diagram = computed<Diagram>(() => {
  if (props.kind === 'coordinates') return {
    title: '一组坐标差，三种用途', caption: 'A(−1,1)、B(5,4)：水平差 6，竖直差 3，中点 M(2,2.5)。',
    explanation: '$AB^2=6^2+3^2=45$，斜率 $m=3/6=1/2$；M 分别取两坐标的平均。',
    lines: [{ points: [[-1,1],[5,1],[5,4]], tone: 'guide' }, { points: [[-1,1],[5,4]], tone: 'blue' }],
    points: [{ at: [-1,1], label: 'A(−1,1)', dx: -42, dy: 21 }, { at: [5,4], label: 'B(5,4)' }, { at: [2,2.5], label: 'M', tone: 'teal' }],
  }
  if (props.kind === 'square') return {
    title: '已知对角线：围绕中点构造', caption: 'A(−1,1)、C(5,5) 是对角顶点，M(2,3) 是中心；另两点 B(0,6)、D(4,0)。',
    explanation: '半条对角线 $A-M=(-3,-2)$，转直角得到 $(2,-3)$；另一对顶点为 $M\\pm(2,-3)$。',
    lines: [{ points: [[-1,1],[0,6],[5,5],[4,0],[-1,1]], tone: 'blue' }, { points: [[-1,1],[5,5]], tone: 'guide' }, { points: [[0,6],[4,0]], tone: 'teal' }],
    points: [{ at: [-1,1], label: 'A', dx: -16 }, { at: [0,6], label: 'B' }, { at: [5,5], label: 'C' }, { at: [4,0], label: 'D', dy: 30 }, { at: [2,3], label: 'M', tone: 'teal' }],
  }
  if (props.kind === 'centre') return {
    title: '绕 C 旋转，而不是绕原点', caption: '以 C(1,1) 为中心逆时针旋转 90°，P(4,2) 到 Q(0,4)。',
    explanation: '相对坐标 $(3,1)\\to(-1,3)$，再加回 $(1,1)$ 得 Q(0,4)；$CP=CQ$。',
    lines: [{ points: [[4,2],[1,1],[0,4]], tone: 'blue' }],
    points: [{ at: [1,1], label: 'C(1,1)', dy: 23 }, { at: [4,2], label: 'P(4,2)' }, { at: [0,4], label: 'Q(0,4)', tone: 'teal' }],
  }
  const start: Point = [1,1]
  const intermediate: Point = reverse.value ? [-start[1],start[0]] : [start[0]+3,start[1]]
  const end: Point = reverse.value ? [intermediate[0]+3,intermediate[1]] : [-intermediate[1],intermediate[0]]
  return {
    title: '相同两步，终点可以不同', caption: '从 P(1,1) 出发，比较向右平移 3 与绕原点逆时针转 90° 的先后顺序。连线连接各步位置，不表示旋转轨迹。',
    explanation: reverse.value ? '先旋转：$(1,1)\\to(-1,1)$；再平移：$(-1,1)\\to(2,1)$。终点为 (2,1)。' : '先平移：$(1,1)\\to(4,1)$；再旋转：$(4,1)\\to(-1,4)$。终点为 (−1,4)。',
    lines: [{ points: [start,intermediate], tone: 'blue' }, { points: [intermediate,end], tone: 'teal' }],
    points: [{ at: start, label: '起点 P', dy: 27, dx: -15 }, { at: intermediate, label: '中间点', dx: -14 }, { at: end, label: '终点', tone: 'teal' }],
  }
})
</script>

<style scoped>
.method-figure { margin: 0; padding: 18px; border: 1px solid #dce6f5; border-radius: 10px; background: #f5f8fd; min-width: 0; }
figcaption { display: grid; gap: 7px; font-size: 14px; color: #182b49; line-height: 1.7; }
figcaption span { font-size: 12px; color: #65748a; }
.coordinate-plot { display: block; width: 100%; max-width: 340px; height: auto; margin: 8px auto; }
.coordinate-plot text { fill: #566378; font-size: 12px; }
.point-label { fill: #253c5c; font-weight: 600; }
.grid-lines { fill: none; stroke: #e0e7f0; stroke-width: .6; }
.axes { fill: none; stroke: #9aaac0; stroke-width: 1.2; }
.shape { fill: none; stroke-width: 2.2; stroke-linejoin: round; }
.blue { stroke: #2451c5; }
.teal { stroke: #11786f; }
.guide { stroke: #96a6bd; stroke-dasharray: 4 4; }
.point { fill: #2451c5; stroke: white; stroke-width: 1; }
.point.teal { fill: #11786f; stroke: white; }
p { margin: 0; padding-top: 10px; border-top: 1px solid #dce6f5; color: #405776; font-size: 13px; line-height: 1.8; }
.order-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.order-controls :deep([aria-pressed='true']) { background: #e2ebfd; border-color: #2451c5; color: #2451c5; }
</style>
