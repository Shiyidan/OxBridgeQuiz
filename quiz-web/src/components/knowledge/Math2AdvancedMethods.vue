<!-- 数学2指数、微积分与图像讲义：复用正文，必要图解静态并排并按内容宽度自然换行。 -->
<template>
  <KnowledgeMethodsArticle class="math2-advanced-methods" :lesson="lesson" label="数学2概念与方法">
    <template #diagram="{ block }">
      <div
        class="math2-diagrams"
        :class="{ 'math2-diagrams--pair': diagramsFor(block.title).length >= 2 }"
      >
        <figure
          v-for="(diagram, index) in diagramsFor(block.title)"
          :key="diagram.title"
          class="math2-figure"
        >
          <h4>{{ diagram.title }}</h4>
          <div class="math2-plot">
            <svg
              viewBox="0 0 310 220"
              role="img"
              :aria-labelledby="uid + '-' + lesson.blocks.indexOf(block) + '-' + index"
            >
              <title :id="uid + '-' + lesson.blocks.indexOf(block) + '-' + index">
                {{ diagram.description }}
              </title>
              <polygon
                v-for="(fill, fillIndex) in diagram.fills"
                :key="'fill-' + fillIndex"
                :points="coordinates(fill.points, diagram)"
                :fill="fill.color"
                stroke="none"
              />
              <path :d="axes(diagram)" fill="none" stroke="#b0bdd0" stroke-width="1.2" />
              <g v-for="tick in diagram.xTicks" :key="'x-' + tick.value">
                <path
                  :d="'M' + px(tick.value, diagram) + ' ' + py(0, diagram) + 'v4'"
                  stroke="#b0bdd0"
                  fill="none"
                />
                <text :x="px(tick.value, diagram)" :y="py(0, diagram) + 19" text-anchor="middle">
                  {{ tick.label }}
                </text>
              </g>
              <g v-for="tick in diagram.yTicks" :key="'y-' + tick.value">
                <path
                  :d="'M' + px(0, diagram) + ' ' + py(tick.value, diagram) + 'h-4'"
                  stroke="#b0bdd0"
                  fill="none"
                />
                <text :x="px(0, diagram) - 8" :y="py(tick.value, diagram) + 5" text-anchor="end">
                  {{ tick.label }}
                </text>
              </g>
              <polyline
                v-for="(curve, curveIndex) in diagram.curves"
                :key="'curve-' + curveIndex"
                :points="coordinates(curve.points, diagram)"
                fill="none"
                :stroke="curve.color"
                stroke-width="2.3"
                :stroke-dasharray="curve.dashed ? '5 4' : undefined"
                stroke-linejoin="round"
              />
              <circle
                v-for="(point, pointIndex) in diagram.dots"
                :key="'point-' + pointIndex"
                :cx="px(point[0], diagram)"
                :cy="py(point[1], diagram)"
                r="3.2"
                fill="#2453cd"
              />
              <text :x="298" :y="py(0, diagram) + 5">x</text>
              <text :x="px(0, diagram) + 6" y="16">y</text>
              <text
                v-for="(label, labelIndex) in diagram.labels"
                :key="'label-' + labelIndex"
                :x="label.x"
                :y="label.y"
                :text-anchor="label.anchor || 'start'"
              >
                {{ label.text }}
              </text>
            </svg>
            <ul v-if="diagram.legend" class="math2-legend" aria-label="图例">
              <li v-for="item in diagram.legend" :key="item.text">
                <span
                  class="math2-legend__line"
                  :style="{
                    borderColor: item.color,
                    borderTopStyle: item.dashed ? 'dashed' : 'solid',
                  }"
                  aria-hidden="true"
                ></span>
                {{ item.text }}
              </li>
            </ul>
          </div>
          <figcaption>{{ diagram.caption }}</figcaption>
        </figure>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { math2ExponentialMethods } from '@/content/knowledge/math2ExponentialMethods'
import { math2DifferentiationMethods } from '@/content/knowledge/math2DifferentiationMethods'
import { math2IntegrationMethods } from '@/content/knowledge/math2IntegrationMethods'
import { math2GraphMethods } from '@/content/knowledge/math2GraphMethods'
import { math2GraphDiagrams } from '@/content/knowledge/math2GraphDiagrams'
import {
  math2MethodDiagrams,
  type Math2MethodDiagram,
} from '@/content/knowledge/math2MethodDiagrams'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const lessons = {
  ...math2ExponentialMethods,
  ...math2DifferentiationMethods,
  ...math2IntegrationMethods,
  ...math2GraphMethods,
}
const props = defineProps<{ code: keyof typeof lessons }>()
const uid = useId()
// 当前叶节点独立选择正文，父章节遍历时沿用同一节点映射。
const lesson = computed(() => lessons[props.code])
// 函数图像章按方法块选择图组，其余章节沿用原节点图解，避免每块重复整节图像。
function diagramsFor(title: string): Math2MethodDiagram[] {
  return math2GraphDiagrams[props.code]?.[title] ?? math2MethodDiagrams[props.code] ?? []
}

// 所有图共享清晰的绘图区，函数坐标与文字标注留白分开处理。
function px(x: number, diagram: Math2MethodDiagram): number {
  return 40 + ((x - diagram.domain[0]) / (diagram.domain[1] - diagram.domain[0])) * 250
}
// 纵轴方向与 SVG 像素方向相反；范围固定于各图的数学模型。
function py(y: number, diagram: Math2MethodDiagram): number {
  return 182 - ((y - diagram.range[0]) / (diagram.range[1] - diagram.range[0])) * 160
}
// 曲线与面积使用同一坐标变换，避免图上交点与正文计算不一致。
function coordinates(points: [number, number][], diagram: Math2MethodDiagram): string {
  return points
    .map(([x, y]) => px(x, diagram).toFixed(2) + ',' + py(y, diagram).toFixed(2))
    .join(' ')
}
// 坐标轴均经过数学原点，图形范围不借助裁切来限制尺寸。
function axes(diagram: Math2MethodDiagram): string {
  return 'M40 ' + py(0, diagram) + 'H292 M' + px(0, diagram) + ' 20V184'
}
</script>

<style scoped lang="scss">
.math2-advanced-methods {
  container-type: inline-size;
}
.math2-advanced-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.math2-diagrams {
  max-width: 640px;
  margin: 12px auto;
}
.math2-figure {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: center;
  gap: 8px 18px;
  min-width: 0;
  margin: 0;
  padding: 14px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.math2-figure h4 {
  grid-column: 1 / -1;
  margin: 0;
  color: #243c59;
  font-size: 16px;
}
.math2-figure svg {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: 0 auto;
}
.math2-figure svg text {
  fill: #344c6c;
  font-family: var(--font-family-base, sans-serif);
  font-size: 15px;
}
.math2-figure figcaption {
  margin: 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.75;
}
.math2-plot {
  min-width: 0;
}
.math2-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 14px;
  line-height: 1.6;
  color: #344c6c;
}
.math2-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.math2-legend__line {
  width: 20px;
  border-top-width: 2px;
  flex-shrink: 0;
}
.math2-diagrams--pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-width: 680px;
}
.math2-diagrams--pair .math2-figure {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}
@container (max-width: 660px) {
  .math2-diagrams {
    max-width: 350px;
  }
  .math2-figure {
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  .math2-diagrams--pair {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
