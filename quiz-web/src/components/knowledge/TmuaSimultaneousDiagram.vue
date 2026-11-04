<!-- TMUA 代入法互动图解：用直线、抛物线和圆的交点解释消元与回代。 -->
<template>
  <figure class="tmua-simultaneous" aria-labelledby="tmua-simultaneous-title">
    <figcaption>
      <span>TMUA · SIMULTANEOUS EQUATIONS</span>
      <h5 id="tmua-simultaneous-title">移动直线，观察联立的解</h5>
      <p>选择图形并改变截距，比较代入后的方程与交点数量。</p>
    </figcaption>

    <div class="controls" role="group" aria-label="选择联立方程模型">
      <AppButton
        size="small"
        :type="model === 'parabola' ? 'primary' : 'secondary'"
        :aria-pressed="model === 'parabola'"
        @click="selectModel('parabola')"
        >直线与抛物线</AppButton
      >
      <AppButton
        size="small"
        :type="model === 'circle' ? 'primary' : 'secondary'"
        :aria-pressed="model === 'circle'"
        @click="selectModel('circle')"
        >直线与圆</AppButton
      >
    </div>

    <div class="equations">
      <span>联立</span>
      <div><LatexText :text="systemFormula" /></div>
    </div>
    <div class="controls" role="group" aria-label="调整直线截距 c">
      <span class="control-label">截距 c</span>
      <AppButton
        v-for="choice in choices"
        :key="choice.value"
        size="small"
        :type="intercept === choice.value ? 'primary' : 'secondary'"
        :aria-pressed="intercept === choice.value"
        @click="intercept = choice.value"
      >
        {{ choice.label }}
      </AppButton>
    </div>

    <svg viewBox="0 0 420 370" role="img" :aria-label="graphLabel">
      <title>{{ graphLabel }}</title>
      <defs>
        <clipPath id="tmua-simultaneous-plot">
          <rect x="60" y="30" width="300" height="300" />
        </clipPath>
      </defs>
      <g v-for="tick in ticks" :key="tick">
        <path :d="`M60 ${gy(tick)}H360 M${gx(tick)} 30V330`" class="grid" />
        <text v-if="tick !== 0" :x="gx(tick)" :y="gy(0) + 17" text-anchor="middle">{{ tick }}</text>
        <text v-if="tick !== 0" :x="gx(0) - 9" :y="gy(tick) + 5" text-anchor="end">{{ tick }}</text>
      </g>
      <path :d="`M52 ${gy(0)}H370 M${gx(0)} 338V20`" class="axis" />
      <text :x="gx(0) - 9" :y="gy(0) + 17" text-anchor="end">0</text>
      <text x="375" :y="gy(0) + 5">x</text>
      <text :x="gx(0) + 8" y="18">y</text>
      <g clip-path="url(#tmua-simultaneous-plot)">
        <path v-if="model === 'parabola'" :d="parabolaPath" class="curve" />
        <circle v-else :cx="gx(0)" :cy="gy(0)" :r="50 * Math.SQRT2" class="curve" />
        <path :d="linePath" class="line" />
        <circle
          v-for="(point, index) in intersections"
          :key="index"
          :cx="gx(point.x)"
          :cy="gy(point.y)"
          r="6"
          class="point"
        />
      </g>
    </svg>

    <div class="legend" aria-label="图例">
      <span class="curve-key">{{ model === 'parabola' ? '抛物线' : '圆' }}</span>
      <span class="line-key">直线</span><span class="point-key">交点</span>
    </div>
    <div class="reasoning" aria-live="polite">
      <div>
        <span>代入</span>
        <p><LatexText :text="substitutionFormula" /></p>
      </div>
      <div>
        <span>整理</span>
        <p><LatexText :text="quadraticFormula" /></p>
      </div>
      <div>
        <span>判断</span>
        <p><LatexText :text="conclusion" /></p>
      </div>
    </div>
    <p class="note">
      每个求得的实数 x 都须代回直线求出
      y，并检验原来的两个方程；若题目另有限制，还要筛选交点。本图消元后的二次项系数是 1 或
      2；实际含参题要先检查二次项会否为零。
    </p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'

defineProps<{ topic?: string }>()

type Model = 'parabola' | 'circle'
const model = ref<Model>('parabola')
const intercept = ref(0)
const ticks = [-3, -2, -1, 0, 1, 2, 3]
const parabolaChoices = [
  { value: -2, label: '−2' },
  { value: -1.25, label: '−5/4' },
  { value: 0, label: '0' },
  { value: -1, label: '−1' },
]
const circleChoices = [-3, -2, 0, 1, 2, 3].map((value) => ({
  value,
  label: String(value).replace('-', '−'),
}))

// 切换模型时回到两条曲线都有交点的基础状态，避免继承另一模型的截距选项。
function selectModel(next: Model): void {
  model.value = next
  intercept.value = 0
}
// 当前模型决定截距选项与边界，圆的 ±2 是相切边界。
const choices = computed(() => (model.value === 'parabola' ? parabolaChoices : circleChoices))
// 横纵坐标共用 50 像素每单位，保证相切和圆的形状不会失真。
function gx(x: number): number {
  return 210 + 50 * x
}
// SVG 纵轴向下，必须反转纵坐标以保持数学坐标方向。
function gy(y: number): number {
  return 180 - 50 * y
}

// 固定方程的二次项始终非零，按所选模型给出代入后的系数。
const coefficients = computed(() =>
  model.value === 'parabola'
    ? { a: 1, b: -1, c: -1 - intercept.value }
    : { a: 2, b: 2 * intercept.value, c: intercept.value ** 2 - 2 },
)
// 判别式和交点均从同一组系数推导，避免图形与结论不一致。
const discriminant = computed(
  () => coefficients.value.b ** 2 - 4 * coefficients.value.a * coefficients.value.c,
)
// 非负判别式的每个 x 均代回直线求 y；重根只计一个不同交点。
const intersections = computed(() => {
  const { a, b } = coefficients.value
  const delta = discriminant.value
  if (delta < 0) return []
  const root = Math.sqrt(delta)
  const xs = delta === 0 ? [-b / (2 * a)] : [(-b - root) / (2 * a), (-b + root) / (2 * a)]
  return xs.map((x) => ({ x, y: x + intercept.value }))
})

// 本图只使用整数和四分数，保留分数精确值，避免把近似值写成等式。
function numberTex(value: number): string {
  if (value === 0.25) return String.raw`\frac{1}{4}`
  if (value === 0.75) return String.raw`\frac{3}{4}`
  if (value === 1.25) return String.raw`\frac{5}{4}`
  if (value === 0.5) return String.raw`\frac{1}{2}`
  return String(value)
}
// 项的符号与绝对值分别处理，避免产生“加负数”或多余的 1 系数。
function signedTerm(value: number, variable = ''): string {
  if (value === 0) return ''
  const sign = value > 0 ? '+' : '-'
  const magnitude = Math.abs(value)
  return sign + (variable && magnitude === 1 ? '' : numberTex(magnitude)) + variable
}
// 两个等式及后续演算都使用所选截距；圆方程始终为 x²+y²=2。
const systemFormula = computed(() => {
  const line = `y=x${signedTerm(intercept.value)}`
  return model.value === 'parabola' ? `$y=x^2-1$；$${line}$` : `$x^2+y^2=2$；$${line}$`
})
// 先写出 y 的表达式代入曲线，保留括号以免平方时遗漏交叉项。
const substitutionFormula = computed(() => {
  const line = `x${signedTerm(intercept.value)}`
  return model.value === 'parabola' ? `$x^2-1=${line}$` : `$x^2+(${line})^2=2$`
})
// 展开结果从实际系数生成，不在切换参数时沿用固定示例。
const quadraticFormula = computed(() => {
  const { a, b, c } = coefficients.value
  const prefix = a === 1 ? 'x^2' : `${a}x^2`
  return `$${prefix}${signedTerm(b, 'x')}${signedTerm(c)}=0$`
})
// 精确展示各有限选项对应的横坐标，图像位置由同一判别式计算。
const xSolutions = computed(() => {
  const c = intercept.value
  if (discriminant.value === 0)
    return model.value === 'parabola' ? String.raw`x=\frac{1}{2}` : `x=${-c / 2}`
  if (model.value === 'parabola')
    return c === -1 ? String.raw`x=0,\;1` : String.raw`x=\frac{1\pm\sqrt{5}}{2}`
  return c === 0 ? String.raw`x=\pm1` : String.raw`x=\frac{-1\pm\sqrt{3}}{2}`
})
// 判别式只给出实数交点数，随后要求回代，避免只报一个坐标。
const conclusion = computed(() => {
  const prefix = `$\\Delta=${discriminant.value}$。`
  if (discriminant.value < 0) return prefix + '没有实数解，两条图形没有交点。'
  if (discriminant.value === 0)
    return prefix + `一个实数解（重根）：$${xSolutions.value}$；对应一个切点。`
  return prefix + `两个不同实数解：$${xSolutions.value}$。将每个 $x$ 代回直线，得到两个交点。`
})
// 为读屏用户提供图像模型及交点数量，结果文本另给具体代入计算。
const graphLabel = computed(
  () =>
    `${model.value === 'parabola' ? '抛物线 y 等于 x 平方减 1' : '圆 x 平方加 y 平方等于 2'} 与直线 y 等于 x 加 c，截距 c 为 ${intercept.value}，有 ${intersections.value.length} 个不同交点。`,
)

// 在绘图区采样，clipPath 裁掉边界外的部分，不把离屏曲线连接成假交点。
function pathFor(f: (x: number) => number): string {
  return Array.from({ length: 241 }, (_, index) => {
    const x = -3 + index / 40
    return `${index ? 'L' : 'M'}${gx(x).toFixed(2)} ${gy(f(x)).toFixed(2)}`
  }).join(' ')
}
// 抛物线图形由固定公式生成；参数只影响直线位置。
const parabolaPath = computed(() => pathFor((x) => x * x - 1))
// 直线图形与代入方程共用当前截距，随按钮切换同步移动。
const linePath = computed(() => pathFor((x) => x + intercept.value))
</script>

<style scoped>
.tmua-simultaneous {
  margin: 0;
  padding: 20px;
  min-width: 0;
  color: #193c58;
  border: 1px solid #d0e0ed;
  border-radius: 14px;
  background: linear-gradient(120deg, #f0f7ff, #f4fbfa);
}
figcaption > span {
  color: #256b8c;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.2px;
}
h5 {
  margin: 12px 0;
  font-size: 21px;
  line-height: 1.4;
}
p {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
}
.control-label {
  min-width: 55px;
  font-size: 13px;
  color: #59747c;
}
.controls :deep(.app-button.el-button) {
  --app-button-bg: #fff;
  --app-button-color: #2167a6;
  --app-button-border: #bfd8ec;
  --app-button-hover-bg: #e7f1fb;
  --app-button-hover-border: #2167a6;
  --app-button-active-bg: #e7f1fb;
  --app-button-active-border: #2167a6;
}
.controls :deep(.app-button.el-button.app-button--primary) {
  --app-button-bg: #2167a6;
  --app-button-color: #fff;
  --app-button-border: #2167a6;
  --app-button-hover-bg: #19558c;
  --app-button-hover-border: #19558c;
  --app-button-active-bg: #19558c;
  --app-button-active-border: #19558c;
}
.equations {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 8px 12px;
  border: 1px solid #d0e0ed;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  line-height: 1.8;
}
.equations > span {
  color: #59747c;
  font-size: 12px;
  flex: none;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 340px;
  margin: 12px 0 4px;
}
svg text {
  font-family: inherit;
  font-size: 15px;
  fill: #536d7b;
}
.grid {
  stroke: #dce8ed;
  stroke-width: 1;
  fill: none;
}
.axis {
  stroke: #8a9da8;
  stroke-width: 1.4;
  fill: none;
}
.curve {
  stroke: #286aba;
  stroke-width: 3;
  fill: none;
}
.line {
  stroke: #138679;
  stroke-width: 2.5;
  stroke-dasharray: 7 5;
  fill: none;
}
.point {
  fill: #a5702b;
  stroke: white;
  stroke-width: 2;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 16px;
  font-size: 12px;
}
.legend span::before {
  display: inline-block;
  content: '';
  width: 18px;
  margin-right: 5px;
  vertical-align: middle;
  border-top: 3px solid;
}
.curve-key {
  color: #286aba;
}
.line-key {
  color: #138679;
}
.point-key {
  color: #a5702b;
}
.line-key::before {
  border-top-style: dashed !important;
}
.reasoning {
  margin-top: 14px;
  padding: 5px 14px;
  border-left: 3px solid #168b84;
  border-radius: 0 8px 8px 0;
  background: #e5f4f1;
}
.reasoning > div {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  align-items: baseline;
}
.reasoning > div > span {
  color: #0f766e;
  font-size: 12px;
  font-weight: 600;
}
.reasoning p {
  margin: 6px 0;
}
.note {
  color: #4c6876;
}
@media (max-width: 600px) {
  .tmua-simultaneous {
    padding: 14px;
  }
  h5 {
    font-size: 18px;
  }
  .controls {
    gap: 6px;
  }
  svg text {
    font-size: 17px;
  }
}
</style>
