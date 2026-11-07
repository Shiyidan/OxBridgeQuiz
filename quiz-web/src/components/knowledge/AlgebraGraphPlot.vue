<!-- 代数讲义的小型坐标图：统一刻度与标注，函数分支按连续区间绘制。 -->
<template>
  <svg
    class="algebra-plot"
    viewBox="0 0 400 266"
    width="400"
    height="266"
    role="img"
    :aria-label="model.description"
  >
    <g class="algebra-plot__grid">
      <line
        v-for="tick in model.xTicks"
        :key="'x' + tick"
        :x1="x(tick)"
        y1="22"
        :x2="x(tick)"
        y2="232"
      />
      <line
        v-for="tick in model.yTicks"
        :key="'y' + tick"
        x1="48"
        :y1="y(tick)"
        x2="348"
        :y2="y(tick)"
      />
    </g>
    <g class="algebra-plot__axes">
      <line x1="48" :y1="y(0)" x2="358" :y2="y(0)" />
      <path :d="'M354,' + (y(0) - 3) + ' L358,' + y(0) + ' L354,' + (y(0) + 3)" />
      <line :x1="x(0)" y1="232" :x2="x(0)" y2="12" />
      <path :d="'M' + (x(0) - 3) + ',16 L' + x(0) + ',12 L' + (x(0) + 3) + ',16'" />
    </g>
    <g class="algebra-plot__labels">
      <text x="366" :y="y(0) - 9">{{ model.degreeAxis ? 'x / °' : 'x' }}</text>
      <text :x="x(0) + 8" y="15">y</text>
      <text :x="x(0) - 9" :y="y(0) + 18" text-anchor="end">0</text>
      <g v-for="tick in model.xTicks" :key="'xt' + tick">
        <line :x1="x(tick)" :y1="y(0) - 3" :x2="x(tick)" :y2="y(0) + 3" />
        <text :x="x(tick)" :y="y(0) + 19" text-anchor="middle">{{ tick }}</text>
      </g>
      <g v-for="tick in model.yTicks" :key="'yt' + tick">
        <line :x1="x(0) - 3" :y1="y(tick)" :x2="x(0) + 3" :y2="y(tick)" />
        <text :x="x(0) - 9" :y="y(tick) + 5" text-anchor="end">{{ tick }}</text>
      </g>
    </g>
    <line
      v-for="(guide, index) in model.guides"
      :key="'g' + index"
      :x1="x(guide.from.x)"
      :y1="y(guide.from.y)"
      :x2="x(guide.to.x)"
      :y2="y(guide.to.y)"
      :stroke="guide.color || '#007b72'"
      stroke-width="1.7"
      stroke-dasharray="5 4"
    />
    <g v-for="curve in model.curves" :key="curve.label">
      <path
        v-for="(segment, index) in curve.segments"
        :key="index"
        :d="graphPath(segment, model)"
        :stroke="curve.color"
        :stroke-dasharray="curve.dash"
        fill="none"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
    <g v-for="mark in model.marks" :key="mark.label" class="algebra-plot__mark">
      <circle :cx="x(mark.x)" :cy="y(mark.y)" r="4" />
      <text :x="x(mark.x) + (mark.dx || 0)" :y="y(mark.y) + (mark.dy || 0)">{{ mark.label }}</text>
    </g>
  </svg>
</template>
<script setup lang="ts">
import {
  graphX,
  graphY,
  graphPath,
  type AlgebraGraphModel,
} from '@/content/knowledge/algebraGraphModels'
const props = defineProps<{ model: AlgebraGraphModel }>()
// 所有标注和函数点使用同一映射，节点切换时保持位置与刻度一致。
function x(value: number) {
  return graphX(value, props.model)
}
// 数学坐标转为画布坐标，纵轴朝上。
function y(value: number) {
  return graphY(value, props.model)
}
</script>
<style scoped lang="scss">
.algebra-plot {
  display: block;
  width: 100%;
  height: auto;
  max-width: 440px;
  margin: 0 auto;
  font-family: inherit;
}
.algebra-plot__grid line {
  stroke: #e2e8f2;
  stroke-width: 1;
}
.algebra-plot__axes {
  stroke: #8291a7;
  stroke-width: 1.3;
  fill: none;
}
.algebra-plot__labels {
  fill: #52647d;
  font-size: 14px;
}
.algebra-plot__labels line {
  stroke: #8291a7;
}
.algebra-plot__mark circle {
  fill: #007b72;
  stroke: #fff;
  stroke-width: 1.5;
}
.algebra-plot__mark text {
  fill: #193e67;
  font-size: 15px;
  font-weight: 600;
  paint-order: stroke;
  stroke: #f6f9ff;
  stroke-width: 4px;
  stroke-linejoin: round;
}
</style>
