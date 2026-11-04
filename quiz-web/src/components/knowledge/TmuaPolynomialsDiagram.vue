<!-- TMUA 多项式互动图解：用函数值、余式与因式对应展示余式定理。 -->
<template>
  <figure class="tmua-polynomials" aria-labelledby="tmua-polynomials-title">
    <figcaption>
      <span>TMUA · POLYNOMIALS</span>
      <h5 id="tmua-polynomials-title">换一个除式，观察余数</h5>
      <p>图像与数值都来自同一个多项式；切换除式的零点。</p>
    </figcaption>
    <div class="definition"><LatexText text="$P(x)=x^3-3x+2=(x-1)^2(x+2)$" /></div>
    <div class="controls" role="group" aria-label="选择除式零点">
      <span>选择 a</span>
      <AppButton
        v-for="item in choices"
        :key="item"
        size="small"
        :type="a === item ? 'primary' : 'secondary'"
        :aria-pressed="a === item"
        @click="a = item"
        >{{ item < 0 ? '−' + -item : item }}</AppButton
      >
    </div>
    <svg viewBox="0 0 420 320" role="img" :aria-label="graphLabel">
      <defs>
        <clipPath id="tmua-polynomials-plot">
          <rect x="36" y="18" width="340" height="282" />
        </clipPath>
      </defs>
      <path d="M36 158H376 M210 18V300" class="axis" />
      <g v-for="tick in ticks" :key="tick">
        <path :d="'M' + gx(tick) + ' 153V163'" class="axis" />
        <text :x="gx(tick)" y="181" text-anchor="middle">{{ tick }}</text>
      </g>
      <text x="380" y="163">x</text>
      <text x="216" y="22">P(x)</text>
      <g clip-path="url(#tmua-polynomials-plot)">
        <path :d="curve" class="curve" />
        <path :d="'M' + gx(a) + ' 158V' + gy(value)" class="guide" />
        <circle :cx="gx(a)" :cy="gy(value)" r="6" class="point" />
      </g>
    </svg>
    <div class="reasoning" aria-live="polite">
      <div><span>除式</span><LatexText :text="divisor" /></div>
      <div><span>余数</span><LatexText :text="remainder" /></div>
      <div>
        <span>判断</span>
        <p>{{ conclusion }}</p>
      </div>
    </div>
    <p class="note">
      这里已知完整因式分解。重根 1 与单根 −2 都使余数为零，但它们在图像附近的符号变化不同。
    </p>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'

defineProps<{ topic?: string }>()
const choices = [-2, -1, 0, 1, 2]
const ticks = [-2, -1, 0, 1, 2]
const a = ref(0)
// 余数、点的位置和图像始终来自同一个多项式。
function polynomial(x: number): number {
  return x ** 3 - 3 * x + 2
}
// 横纵坐标使用固定比例，保证曲线与取值点对应。
function gx(x: number): number {
  return 210 + 65 * x
}
// 纵坐标同样由多项式函数值确定。
function gy(y: number): number {
  return 158 - 14 * y
}
// 当前除式的零点决定余数与图中点的位置。
const value = computed(() => polynomial(a.value))
// 零点为 a 的一次除式统一写成 x-a，避免负号导致误读。
const divisor = computed(
  () => '$x' + (a.value < 0 ? '+' + -a.value : a.value > 0 ? '-' + a.value : '') + '$',
)
// 余式定理将所选零点处的函数值作为余数。
const remainder = computed(() => '$P(' + a.value + ')=' + value.value + '$')
// 只有余数为零时，当前一次除式才是因式。
const conclusion = computed(() =>
  value.value === 0 ? '余数为 0，所选除式是因式。' : '余数不为 0，所选除式不是因式。',
)
// 无障碍说明同步播报当前函数值和余数。
const graphLabel = computed(
  () => '多项式图像中，除式零点 a 等于 ' + a.value + '，函数值和余数均为 ' + value.value + '。',
)
// 用固定坐标比例绘图并裁剪显示区域，不把屏幕边界当作函数定义域。
const curve = computed(() =>
  Array.from({ length: 120 }, (_, i) => {
    const x = -2.65 + (i * 5.2) / 119
    return (i === 0 ? 'M' : 'L') + gx(x).toFixed(2) + ' ' + gy(polynomial(x)).toFixed(2)
  }).join(' '),
)
</script>
<style scoped>
.tmua-polynomials {
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
.definition {
  padding: 10px 14px;
  background: white;
  border-radius: 8px;
  overflow-x: auto;
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
  max-height: 270px;
}
svg text {
  fill: #607787;
  font-size: 14px;
}
.axis {
  stroke: #8fa3b1;
  stroke-width: 1.5;
  fill: none;
}
.curve {
  stroke: #2464bc;
  stroke-width: 3;
  fill: none;
}
.guide {
  stroke: #15958f;
  stroke-width: 1.8;
  stroke-dasharray: 4 4;
}
.point {
  fill: #168b84;
  stroke: #fff;
  stroke-width: 2;
}
.reasoning {
  border: 1px solid #dce9ef;
  border-radius: 10px;
  background: white;
  padding: 3px 15px;
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
  min-width: 38px;
}
.reasoning p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}
.note {
  margin: 14px 0 0;
}
@media (max-width: 600px) {
  .tmua-polynomials {
    padding: 16px;
  }
}
</style>
