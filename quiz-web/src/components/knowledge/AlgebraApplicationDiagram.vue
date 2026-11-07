<!-- 实际情境与斜率面积的紧凑固定图：以单位、分段和有向面积解释同一过程。 -->
<template>
  <div class="application-figure">
    <figure>
      <figcaption>{{ model.title }}</figcaption>
      <div class="application-figure__body">
        <svg
          class="application-figure__plot"
          width="440"
          height="266"
          viewBox="0 0 440 266"
          role="img"
          :aria-label="model.description"
        >
          <g class="application-figure__grid">
            <line
              v-for="tick in model.xTicks"
              :key="'x' + tick"
              :x1="x(tick)"
              y1="36"
              :x2="x(tick)"
              y2="222"
            />
            <line
              v-for="tick in model.yTicks"
              :key="'y' + tick"
              x1="52"
              :y1="y(tick)"
              x2="352"
              :y2="y(tick)"
            />
          </g>
          <polygon
            v-for="area in model.areas"
            :key="area.tone"
            :points="applicationPoints(area.points, model)"
            :class="'application-figure__area--' + area.tone"
          />
          <g class="application-figure__axes">
            <line x1="52" :y1="y(0)" x2="362" :y2="y(0)" />
            <path :d="'M358,' + (y(0) - 3) + ' L362,' + y(0) + ' L358,' + (y(0) + 3)" />
            <line x1="52" y1="222" x2="52" y2="28" />
            <path d="M49,32 L52,28 L55,32" />
          </g>
          <g class="application-figure__labels">
            <text x="52" y="18">{{ model.yLabel }}</text>
            <text x="370" :y="y(0) + 5">{{ model.xLabel }}</text>
            <text x="42" :y="y(0) + 18" text-anchor="end">0</text>
            <g v-for="tick in model.xTicks" :key="'xt' + tick">
              <line :x1="x(tick)" :y1="y(0) - 3" :x2="x(tick)" :y2="y(0) + 3" />
              <text :x="x(tick)" :y="y(0) + 20" text-anchor="middle">{{ tick }}</text>
            </g>
            <g v-for="tick in model.yTicks" :key="'yt' + tick">
              <line x1="49" :y1="y(tick)" x2="55" :y2="y(tick)" />
              <text x="42" :y="y(tick) + 5" text-anchor="end">{{ tick }}</text>
            </g>
          </g>
          <polyline
            class="application-figure__curve"
            :points="applicationPoints(model.points, model)"
          />
          <circle
            v-for="(point, index) in model.points"
            :key="index"
            :cx="x(point[0])"
            :cy="y(point[1])"
            r="3.5"
            class="application-figure__point"
          />
        </svg>
        <div class="application-figure__notes">
          <p v-for="note in model.notes" :key="note"><KnowledgeText :text="note" /></p>
        </div>
      </div>
    </figure>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import {
  algebraApplicationFigures,
  applicationX,
  applicationY,
  applicationPoints,
  type ApplicationFigureCode,
} from '@/content/knowledge/algebraApplicationFigures'
import KnowledgeText from './KnowledgeText.vue'
const props = defineProps<{ code: ApplicationFigureCode }>()
// 小节切换同时更换单位、模型与计算说明，避免混淆位置图和速度图。
const model = computed(() => algebraApplicationFigures[props.code])
// 标注与折线共用横坐标，保证区间宽度对应真实时间。
function x(value: number) {
  return applicationX(value, model.value)
}
// 纵坐标保留负速度对应的区域，填色和刻度同步。
function y(value: number) {
  return applicationY(value, model.value)
}
</script>
<style scoped lang="scss">
.application-figure {
  container-type: inline-size;
  min-width: 0;
}
.application-figure figure {
  margin: 0;
  padding: 18px 20px;
  border: 1px solid #dce6f8;
  border-radius: 12px;
  background: #f6f9ff;
}
.application-figure figcaption {
  color: #193e67;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.5;
  margin-bottom: 14px;
}
.application-figure__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px 22px;
  align-items: center;
}
.application-figure__plot {
  display: block;
  width: 100%;
  max-width: 480px;
  height: auto;
  margin: 0 auto;
  font-family: inherit;
}
.application-figure__grid line {
  stroke: #e2e8f2;
  stroke-width: 1;
}
.application-figure__axes {
  stroke: #8291a7;
  stroke-width: 1.3;
  fill: none;
}
.application-figure__labels {
  fill: #52647d;
  font-size: 15px;
}
.application-figure__labels line {
  stroke: #8291a7;
}
.application-figure__area--positive {
  fill: #dce8ff;
}
.application-figure__area--negative {
  fill: #ffe2bc;
}
.application-figure__curve {
  stroke: #2453cd;
  stroke-width: 2.8;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.application-figure__point {
  fill: #2453cd;
  stroke: #fff;
  stroke-width: 1.3;
}
.application-figure__notes {
  min-width: 0;
  color: #415976;
  font-size: 15px;
  line-height: 1.8;
}
.application-figure__notes p {
  margin: 8px 0;
}
@container (min-width:800px) {
  .application-figure__body {
    grid-template-columns: minmax(0, 480px) minmax(0, 1fr);
  }
}
/* 窄容器增大图内标注字号，并减少外框留白，避免整图缩放后字过小。 */
@container (max-width:450px) {
  .application-figure figure {
    padding: 14px 10px;
  }
  .application-figure__labels {
    font-size: 18px;
  }
}
</style>
