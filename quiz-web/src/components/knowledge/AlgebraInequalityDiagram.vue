<!-- 一次不等式固定图：数轴区分开闭端点，坐标图用虚实边界标出公共半平面。 -->
<template>
  <div class="inequality-figure" :class="{ 'inequality-figure--interval': kind === 'interval' }">
    <figure>
      <figcaption>
        {{ kind === 'interval' ? '同一段解集，左端包含、右端不包含' : '两个半平面的公共部分' }}
      </figcaption>
      <div class="inequality-figure__body">
        <svg
          v-if="kind === 'interval'"
          class="inequality-figure__plot"
          viewBox="0 0 440 108"
          width="440"
          height="108"
          role="img"
          aria-label="数轴表示负二小于等于 x 且 x 小于二，负二处实心，二处空心，两个端点之间着色。"
        >
          <g class="inequality-figure__axis">
            <line x1="22" y1="42" x2="418" y2="42" />
            <path d="M27,38 L22,42 L27,46 M413,38 L418,42 L413,46" />
          </g>
          <g v-for="tick in [-3, -2, -1, 0, 1, 2, 3]" :key="tick" class="inequality-figure__labels">
            <line :x1="numberX(tick)" y1="38" :x2="numberX(tick)" y2="46" />
            <text :x="numberX(tick)" y="73" text-anchor="middle">{{ tick }}</text>
          </g>
          <line
            :x1="numberX(-2)"
            y1="42"
            :x2="numberX(2)"
            y2="42"
            stroke="#2453cd"
            stroke-width="5"
          />
          <circle
            :cx="numberX(-2)"
            cy="42"
            r="6"
            fill="#2453cd"
            stroke="#2453cd"
            stroke-width="2"
          />
          <circle :cx="numberX(2)" cy="42" r="6" fill="#fff" stroke="#2453cd" stroke-width="2" />
          <text x="426" y="47" class="inequality-figure__labels">x</text>
        </svg>
        <svg
          v-else
          class="inequality-figure__plot"
          viewBox="0 0 440 280"
          width="440"
          height="280"
          role="img"
          aria-label="公共解集位于 y=x−1 的虚线上方，y=2 的实线下方，点 (3,2) 不包含，点 (0,1) 在解集内。"
        >
          <g class="inequality-figure__grid">
            <line
              v-for="tick in [-2, -1, 0, 1, 2, 3, 4]"
              :key="'x' + tick"
              :x1="regionX(tick)"
              y1="32"
              :x2="regionX(tick)"
              y2="242"
            />
            <line
              v-for="tick in [-3, -2, -1, 0, 1, 2, 3, 4]"
              :key="'y' + tick"
              x1="60"
              :y1="regionY(tick)"
              x2="348"
              :y2="regionY(tick)"
            />
          </g>
          <polygon points="60,242 60,92 300,92" fill="#dce8ff" />
          <line
            x1="60"
            y1="242"
            x2="348"
            y2="62"
            stroke="#2453cd"
            stroke-width="2.5"
            stroke-dasharray="7 5"
          />
          <line x1="60" y1="92" x2="348" y2="92" stroke="#007b72" stroke-width="2.5" />
          <g class="inequality-figure__axis">
            <line x1="54" :y1="regionY(0)" x2="360" :y2="regionY(0)" />
            <path
              :d="'M355,' + (regionY(0) - 4) + ' L360,' + regionY(0) + ' L355,' + (regionY(0) + 4)"
            />
            <line :x1="regionX(0)" y1="246" :x2="regionX(0)" y2="22" />
            <path d="M152,27 L156,22 L160,27" />
          </g>
          <g class="inequality-figure__labels">
            <text x="370" :y="regionY(0) + 5">x</text>
            <text :x="regionX(0) + 9" y="23">y</text>
            <text :x="regionX(0) - 10" :y="regionY(0) + 20" text-anchor="end">0</text>
            <text
              v-for="tick in [-2, -1, 1, 2, 3, 4]"
              :key="'xt' + tick"
              :x="regionX(tick)"
              :y="regionY(0) + 20"
              text-anchor="middle"
            >
              {{ tick }}
            </text>
            <text
              v-for="tick in [-3, -2, -1, 1, 2, 3, 4]"
              :key="'yt' + tick"
              :x="regionX(0) - 10"
              :y="regionY(tick) + 5"
              text-anchor="end"
            >
              {{ tick }}
            </text>
          </g>
          <circle cx="300" cy="92" r="5" fill="#fff" stroke="#2453cd" stroke-width="2" />
          <circle :cx="regionX(0)" :cy="regionY(1)" r="4" fill="#007b72" />
          <g class="inequality-figure__annotation">
            <text x="314" y="52">y = x − 1</text>
            <text x="358" y="96">y = 2</text>
            <text x="168" y="123">(0, 1)</text>
          </g>
        </svg>
        <div v-if="kind === 'interval'" class="inequality-figure__notes">
          <p>
            <KnowledgeText text="$-2\le x<2$：−2 画实心点，2 画空心点，中间所有实数都属于解集。" />
          </p>
        </div>
        <div v-else class="inequality-figure__notes">
          <p><KnowledgeText text="**斜虚线**：$y>x-1$，取线上方，边界不包含。" /></p>
          <p><KnowledgeText text="**水平实线**：$y\le2$，取线下方，边界包含。" /></p>
          <p>
            <KnowledgeText
              text="阴影是公共区域的可见部分。$(0,1)$ 满足两式；$(3,2)$ 在斜虚线上，仍被排除。"
            />
          </p>
        </div>
      </div>
    </figure>
  </div>
</template>
<script setup lang="ts">
import KnowledgeText from './KnowledgeText.vue'
defineProps<{ kind: 'interval' | 'region' }>()
// 数轴保留等间距刻度，端点与解集线段使用同一映射。
function numberX(value: number) {
  return 52 + (value + 3) * 56
}
// 坐标图按 x∈[−2,4] 展示可见部分；显示边缘不代表新的解集边界。
function regionX(value: number) {
  return 60 + (value + 2) * 48
}
// 数学 y 轴向上，用同一映射对齐边界、测试点和刻度。
function regionY(value: number) {
  return 32 + (4 - value) * 30
}
</script>
<style scoped lang="scss">
.inequality-figure {
  container-type: inline-size;
  min-width: 0;
}
.inequality-figure figure {
  margin: 0;
  padding: 16px 20px;
  border: 1px solid #dce6f8;
  border-radius: 12px;
  background: #f6f9ff;
}
.inequality-figure figcaption {
  font-size: 17px;
  font-weight: 700;
  line-height: 1.5;
  color: #193e67;
  margin-bottom: 10px;
}
.inequality-figure__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 6px 22px;
}
.inequality-figure__plot {
  display: block;
  width: 100%;
  max-width: 480px;
  height: auto;
  margin: 0 auto;
  font-family: inherit;
}
.inequality-figure__axis {
  stroke: #8291a7;
  stroke-width: 1.4;
  fill: none;
}
.inequality-figure__grid {
  stroke: #e2e8f2;
  stroke-width: 1;
}
.inequality-figure__labels {
  font-size: 15px;
  fill: #52647d;
}
.inequality-figure__labels text {
  paint-order: stroke;
  stroke: #f6f9ff;
  stroke-width: 3px;
  stroke-linejoin: round;
}
.inequality-figure__labels line {
  stroke: #8291a7;
}
.inequality-figure__annotation {
  font-size: 15px;
  fill: #193e67;
  paint-order: stroke;
  stroke: #f6f9ff;
  stroke-width: 3px;
  stroke-linejoin: round;
}
.inequality-figure__notes {
  min-width: 0;
  color: #415976;
  font-size: 15px;
  line-height: 1.8;
}
.inequality-figure__notes p {
  margin: 8px 0;
}
.inequality-figure--interval figure {
  max-width: 620px;
}
@container (min-width:800px) {
  .inequality-figure:not(.inequality-figure--interval) .inequality-figure__body {
    grid-template-columns: minmax(0, 480px) minmax(0, 1fr);
  }
}
@container (max-width:450px) {
  .inequality-figure figure {
    padding: 14px 10px;
  }
  .inequality-figure__labels,
  .inequality-figure__annotation {
    font-size: 18px;
  }
}
</style>
