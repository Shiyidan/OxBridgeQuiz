<!-- TMUA 根式互动图解：用数轴解释平方根的非负性与绝对值。 -->
<template>
  <figure class="tmua-surds" aria-labelledby="tmua-surds-title">
    <figcaption>
      <span>TMUA · SURDS</span>
      <h5 id="tmua-surds-title">平方以后，符号去了哪里？</h5>
      <p>选择一个数，比较原数、平方和算术平方根。</p>
    </figcaption>
    <div class="controls" role="group" aria-label="选择数轴上的 x">
      <span>x =</span
      ><AppButton
        v-for="item in values"
        :key="item"
        size="small"
        :type="value === item ? 'primary' : 'secondary'"
        :aria-pressed="value === item"
        @click="value = item"
        >{{ item < 0 ? `−${-item}` : item }}</AppButton
      >
    </div>
    <svg viewBox="0 0 420 155" role="img" :aria-label="accessibleLabel">
      <path d="M40 80 H380 M372 73 L380 80 L372 87" class="axis" />
      <path :d="`M210 80 H${position}`" class="distance" />
      <g v-for="tick in ticks" :key="tick">
        <path :d="`M${210 + tick * 46} 73 V87`" class="axis" />
        <text :x="210 + tick * 46" y="112" text-anchor="middle">{{ tick }}</text>
      </g>
      <circle :cx="position" cy="80" r="8" class="point" />
      <text :x="position" y="48" text-anchor="middle" class="point-label">x = {{ value }}</text>
    </svg>
    <div class="reasoning" aria-live="polite">
      <div><span>先平方</span><LatexText :text="squareFormula" /></div>
      <div><span>再开方</span><LatexText :text="rootFormula" /></div>
      <div><span>对照数轴</span><LatexText :text="distanceFormula" /></div>
    </div>
    <p class="note">
      平方根符号表示非负的主平方根；解方程 <LatexText :text="String.raw`$t^2=a$`" /> 时，若
      <LatexText :text="String.raw`$a>0$`" /> 则有两个解，别把两者混淆。
    </p>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'

defineProps<{ topic?: string }>()
const values = [-3, -1, 0, 1, 3]
const ticks = [-3, -2, -1, 0, 1, 2, 3]
const value = ref(-3)
// 数轴距离始终是非负数，和主平方根取值保持一致。
const position = computed(() => 210 + value.value * 46)
const squareFormula = computed(() => `$(${value.value})^2=${value.value ** 2}$`)
const rootFormula = computed(
  () => `$\\sqrt{(${value.value})^2}=\\sqrt{${value.value ** 2}}=${Math.abs(value.value)}$`,
)
const distanceFormula = computed(() => `$|${value.value}|=${Math.abs(value.value)}$`)
const accessibleLabel = computed(
  () =>
    `数轴上 x 等于 ${value.value}，与零的距离是 ${Math.abs(value.value)}，因此平方后开方等于 ${Math.abs(value.value)}。`,
)
</script>
<style scoped>
.tmua-surds {
  margin: 0;
  padding: 22px;
  border: 1px solid #cee2ee;
  border-radius: 14px;
  background: #f2f8fc;
  color: #183248;
  min-width: 0;
}
figcaption > span {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: #136f85;
  font-weight: 700;
}
h5 {
  font-size: 19px;
  margin: 8px 0;
}
figcaption p,
.note {
  font-size: 14px;
  line-height: 1.65;
  color: #526b7d;
  margin: 0 0 14px;
}
.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}
.controls > span {
  color: #526b7d;
  font-size: 14px;
}
svg {
  display: block;
  width: 100%;
  max-height: 160px;
}
.axis {
  stroke: #7991a3;
  stroke-width: 2;
  fill: none;
}
.distance {
  stroke: #17a099;
  stroke-width: 6;
  stroke-linecap: round;
}
.point {
  fill: #2162c8;
  stroke: #fff;
  stroke-width: 3;
}
svg text {
  fill: #607787;
  font-size: 14px;
}
.point-label {
  fill: #174c9c;
  font-weight: 700;
}
.reasoning {
  border: 1px solid #dce9ef;
  border-radius: 10px;
  background: white;
  padding: 4px 15px;
}
.reasoning > div {
  display: flex;
  align-items: baseline;
  gap: 18px;
  padding: 10px 0;
}
.reasoning > div + div {
  border-top: 1px solid #e5eef3;
}
.reasoning span {
  color: #087b75;
  font-weight: 700;
  font-size: 14px;
  min-width: 64px;
}
.note {
  margin: 14px 0 0;
}
@media (max-width: 600px) {
  .tmua-surds {
    padding: 16px;
  }
}
</style>
