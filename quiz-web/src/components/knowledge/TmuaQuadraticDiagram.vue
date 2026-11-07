<!-- TMUA 二次函数与方程互动图解：通过参数和反例连接图像、实根与等价变形。 -->
<template>
  <figure
    class="tmua-quadratic"
    :class="{ 'tmua-quadratic--compact': compact }"
    aria-labelledby="tmua-quadratic-title"
  >
    <figcaption>
      <span>TMUA · QUADRATIC THINKING</span>
      <h5 id="tmua-quadratic-title">
        {{ mode === 'roots' ? '移动抛物线，观察实根' : '平方以后，候选解都成立吗？' }}
      </h5>
      <p>
        {{
          mode === 'roots'
            ? '改变开口、顶点位置和高度，比较图像与判别式。'
            : '先观察两条原函数的交点，再逐一检验平方后得到的候选解。'
        }}
      </p>
    </figcaption>

    <div v-if="!compact" class="controls modes" role="group" aria-label="选择观察方式">
      <AppButton
        size="small"
        :type="mode === 'roots' ? 'primary' : 'secondary'"
        :aria-pressed="mode === 'roots'"
        @click="mode = 'roots'"
        >图像与实根</AppButton
      >
      <AppButton
        size="small"
        :type="mode === 'equivalence' ? 'primary' : 'secondary'"
        :aria-pressed="mode === 'equivalence'"
        @click="mode = 'equivalence'"
        >平方与验根</AppButton
      >
    </div>

    <template v-if="mode === 'roots'">
      <p class="formula"><LatexText :text="quadraticFormula" /></p>
      <div class="controls" role="group" aria-label="调整二次项系数 a">
        <span class="control-label">开口 a</span>
        <AppButton
          v-for="value in [-2, -1, 1, 2]"
          :key="value"
          size="small"
          :type="a === value ? 'primary' : 'secondary'"
          :aria-pressed="a === value"
          @click="a = value"
          >{{ value }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="调整顶点横坐标 h">
        <span class="control-label">位置 h</span>
        <AppButton
          v-for="value in [-1, 0, 1]"
          :key="value"
          size="small"
          :type="h === value ? 'primary' : 'secondary'"
          :aria-pressed="h === value"
          @click="h = value"
          >{{ value }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="调整顶点纵坐标 k">
        <span class="control-label">高度 k</span>
        <AppButton
          v-for="value in [-2, -1, 0, 1, 2]"
          :key="value"
          size="small"
          :type="k === value ? 'primary' : 'secondary'"
          :aria-pressed="k === value"
          @click="k = value"
          >{{ value }}</AppButton
        >
      </div>
    </template>
    <template v-else>
      <p class="formula">
        <LatexText
          :text="
            String.raw`$\sqrt{x+2}=x\;\Longrightarrow\;x^2-x-2=0\;\Longrightarrow\;x=2\text{ 或 }x=-1$`
          "
        />
      </p>
      <p>
        原方程要求 <LatexText :text="String.raw`$x+2\ge 0$`" />，而平方前还要注意右侧
        <LatexText :text="String.raw`$x\ge 0$`" />。点击候选解，比较两边的值。
      </p>
      <div class="controls" role="group" aria-label="选择平方后候选解并验根">
        <AppButton
          v-for="value in [-1, 2]"
          :key="value"
          size="small"
          :type="candidate === value ? 'primary' : 'secondary'"
          :aria-pressed="candidate === value"
          @click="candidate = value"
          >检验 x = {{ value }}</AppButton
        >
      </div>
    </template>

    <svg viewBox="0 0 420 370" role="img" :aria-label="graphLabel">
      <title>{{ graphLabel }}</title>
      <defs>
        <clipPath id="tmua-quadratic-plot">
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
      <g clip-path="url(#tmua-quadratic-plot)">
        <path v-if="mode === 'roots'" :d="quadraticPath" class="curve" />
        <template v-else>
          <path :d="sqrtPath" class="curve" />
          <path :d="linePath" class="comparison" />
          <path v-if="candidate !== null" :d="`M${gx(candidate)} 30V330`" class="candidate-guide" />
        </template>
        <template v-if="mode === 'roots'">
          <circle :cx="gx(h)" :cy="gy(k)" r="5" class="vertex" />
          <circle v-for="x in roots" :key="x" :cx="gx(x)" :cy="gy(0)" r="6" class="root" />
        </template>
        <template v-else-if="candidate !== null">
          <circle :cx="gx(candidate)" :cy="gy(Math.sqrt(candidate + 2))" r="6" class="root" />
          <circle
            v-if="candidate === -1"
            :cx="gx(candidate)"
            :cy="gy(candidate)"
            r="6"
            class="different-point"
          />
        </template>
      </g>
    </svg>

    <aside v-if="compact" class="home-observations" aria-live="polite">
      <h6>把图像和结论连起来</h6>
      <div>
        <strong>开口向{{ a > 0 ? '上' : '下' }}</strong
        ><span>a = {{ a }}，顶点是{{ a > 0 ? '最低' : '最高' }}点。</span>
      </div>
      <div>
        <strong>顶点 ({{ h }}, {{ k }})</strong><span>改变 h 和 k，观察图像的平移。</span>
      </div>
      <div>
        <strong>{{
          roots.length === 2 ? '两个不同实根' : roots.length === 1 ? '一个实根（重根）' : '没有实根'
        }}</strong
        ><span>Δ = {{ discriminant }}，与 x 轴有 {{ roots.length }} 个交点。</span>
      </div>
    </aside>
    <div v-if="!compact" class="legend" aria-label="图例">
      <template v-if="mode === 'roots'"
        ><span class="curve-key">二次函数</span><span class="root-key">与 x 轴的交点</span
        ><span class="vertex-key">顶点</span></template
      >
      <template v-else
        ><span class="curve-key"><LatexText :text="String.raw`$y=\sqrt{x+2}$`" /></span
        ><span class="line-key"><LatexText :text="String.raw`$y=x$`" /></span
      ></template>
    </div>

    <p v-if="!compact && mode === 'roots'" class="result" aria-live="polite">
      <LatexText :text="rootConclusion" />
    </p>
    <p v-else-if="!compact" class="result" aria-live="polite">
      <LatexText :text="candidateConclusion" />
    </p>
    <p v-if="!compact && mode === 'roots'" class="note">
      <LatexText
        :text="
          String.raw`对任意二次函数 $ax^2+bx+c$，$a\ne0$；定义域为全体实数。开口与顶点共同决定图像和实根。`
        "
      />
    </p>
    <p v-else-if="!compact" class="note">
      平方从原方程推出新方程；逆向回到原方程时，必须保留条件并逐一验证。图中只表示实数范围。
    </p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'

defineProps<{ topic?: string; compact?: boolean }>()

const mode = ref<'roots' | 'equivalence'>('roots')
const a = ref(1)
const h = ref(0)
const k = ref(-1)
const candidate = ref<number | null>(null)
const ticks = [-3, -2, -1, 0, 1, 2, 3]

// 同一坐标单位在横纵方向都使用 50 像素，避免图像形状被非等比例拉伸。
function gx(x: number): number {
  return 210 + 50 * x
}
// SVG 纵轴向下增长，必须反转数学纵坐标。
function gy(y: number): number {
  return 180 - 50 * y
}

// 顶点式参数直接派生展开式系数，保证显示的判别式与图像来自同一个函数。
const coefficients = computed(() => ({
  b: -2 * a.value * h.value,
  c: a.value * h.value * h.value + k.value,
}))
// 展开式与顶点式计算出的判别式恒等，有限参数避免近零浮点误分类。
const discriminant = computed(() => coefficients.value.b ** 2 - 4 * a.value * coefficients.value.c)
// 选用整数及半整数比值时，解析解精确对应图上与横轴的交点。
const roots = computed(() => {
  if (discriminant.value < 0) return []
  if (discriminant.value === 0) return [h.value]
  const d = Math.sqrt(-k.value / a.value)
  return [h.value - d, h.value + d]
})

// 把顶点式系数呈现为简洁的代数式，不出现加负数或多余的系数 1。
const quadraticFormula = computed(() => {
  const leading = a.value === 1 ? '' : a.value === -1 ? '-' : String(a.value)
  const base = h.value === 0 ? 'x^2' : `(x${h.value > 0 ? '-' : '+'}${Math.abs(h.value)})^2`
  const constant = k.value === 0 ? '' : k.value > 0 ? `+${k.value}` : String(k.value)
  return `$y=${leading}${base}${constant}$，顶点 $(${h.value},${k.value})$`
})

// 表示平方根的精确值，避免把无理根的近似值误写成等式。
function rootOffset(value: number): string {
  if (value === 0.5) return String.raw`\frac{\sqrt{2}}{2}`
  if (value === 1) return '1'
  if (value === 2) return String.raw`\sqrt{2}`
  return String.raw`\sqrt{${value}}`
}

// 判别式的符号、实根个数、根的位置和截距统一由当前参数推导。
const rootConclusion = computed(() => {
  const delta = discriminant.value
  const prefix = String.raw`$b=${coefficients.value.b}$，$c=${coefficients.value.c}$，$\Delta=b^2-4ac=${delta}$。`
  if (delta < 0) return prefix + '图像与 x 轴没有交点，方程没有实根。'
  if (delta === 0) return prefix + `$x=${h.value}$ 是一个不同实根（重根），顶点在 x 轴上。`
  const offset = rootOffset(-k.value / a.value)
  const rootsText = h.value === 0 ? `\\pm ${offset}` : `${h.value}\\pm ${offset}`
  return prefix + `方程有两个不同实根：$x=${rootsText}$。`
})

// 验根先比较原方程两边，再解释平方为什么不能自动倒推。
const candidateConclusion = computed(() => {
  if (candidate.value === null)
    return '两个数都是平方后方程的解，先点击候选解，检查是否满足原方程。'
  if (candidate.value === -1)
    return String.raw`当 $x=-1$ 时，左边 $\sqrt{1}=1$，右边是 $-1$；两边不同，$-1$ 是平方产生的增根。`
  return String.raw`当 $x=2$ 时，左边 $\sqrt{4}=2$，右边也是 $2$；两边相同，所以 $2$ 是原方程的解。`
})

// 在有限绘图区内采样，真正裁剪由 SVG clipPath 完成，避免曲线冲出坐标轴。
function pathFor(f: (x: number) => number, start: number, end: number): string {
  const steps = 240
  return Array.from({ length: steps + 1 }, (_, index) => {
    const x = start + ((end - start) * index) / steps
    return `${index === 0 ? 'M' : 'L'}${gx(x).toFixed(2)} ${gy(f(x)).toFixed(2)}`
  }).join(' ')
}
// 曲线、顶点和根都读取当前 a、h、k，切换参数时同步更新。
const quadraticPath = computed(() => pathFor((x) => a.value * (x - h.value) ** 2 + k.value, -3, 3))
// 平方根只在 x≥−2 的实数定义域内绘制，避免跨越无定义区域。
const sqrtPath = computed(() => pathFor((x) => Math.sqrt(x + 2), -2, 3))
// 直线 y=x 与根式图像的交点代表原方程的解。
const linePath = computed(() => pathFor((x) => x, -3, 3))
// 给辅助技术完整的当前模型和结果，不要求用户自行解读 SVG。
const graphLabel = computed(() =>
  mode.value === 'roots'
    ? `抛物线顶点为（${h.value}，${k.value}），判别式为${discriminant.value}，有${roots.value.length}个不同实根。`
    : candidate.value === null
      ? '根式函数与直线图像，选择候选解后比较两边。'
      : candidate.value === 2
        ? 'x等于2时两条曲线相交，满足原方程。'
        : 'x等于负1时两条曲线高度不同，不满足原方程。',
)
</script>

<style scoped>
.tmua-quadratic {
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
.formula {
  overflow-x: auto;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d0e0ed;
  border-radius: 8px;
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
.comparison {
  stroke: #138679;
  stroke-width: 2.5;
  stroke-dasharray: 7 5;
  fill: none;
}
.candidate-guide {
  stroke: #bd934b;
  stroke-width: 1.5;
  stroke-dasharray: 3 4;
  fill: none;
}
.root {
  fill: #138679;
  stroke: white;
  stroke-width: 2;
}
.vertex {
  fill: #a5702b;
  stroke: white;
  stroke-width: 2;
}
.different-point {
  fill: #b25b54;
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
.root-key,
.line-key {
  color: #138679;
}
.vertex-key {
  color: #a5702b;
}
.line-key::before {
  border-top-style: dashed !important;
}
.result {
  padding: 12px 14px;
  border-left: 3px solid #168b84;
  border-radius: 0 8px 8px 0;
  background: #e5f4f1;
}
.note {
  color: #4c6876;
}
/* 首页复用同一组参数与绘图，将操作、图像和结论并排呈现。 */
.tmua-quadratic--compact {
  display: grid;
  grid-template-columns: 250px minmax(180px, 1fr) minmax(180px, 230px);
  grid-template-rows: auto auto repeat(3, 36px);
  align-content: center;
  column-gap: 24px;
  padding: 18px 24px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #17252e;
}
.tmua-quadratic--compact figcaption {
  grid-column: 1;
  grid-row: 1;
}
.tmua-quadratic--compact figcaption > span,
.tmua-quadratic--compact figcaption > p {
  display: none;
}
.tmua-quadratic--compact h5 {
  margin: 0 0 10px;
  font-size: 16px;
}
.tmua-quadratic--compact .formula {
  grid-column: 1;
  grid-row: 2;
  margin: 0 0 12px;
  padding: 0;
  border: 0;
  background: none;
  font-size: 13px;
}
.tmua-quadratic--compact .controls {
  grid-column: 1;
  margin: 0;
  gap: 5px;
}
.tmua-quadratic--compact .control-label {
  min-width: 45px;
  font-size: 12px;
}
.tmua-quadratic--compact .controls :deep(.app-button.el-button) {
  min-width: 28px;
  height: 27px;
  padding: 0 7px;
  border-radius: 5px;
  font-size: 12px;
}
.tmua-quadratic--compact svg {
  grid-column: 2;
  grid-row: 1 / 6;
  align-self: center;
  height: 230px;
  margin: 0;
}
.tmua-quadratic--compact .grid {
  stroke: #edf2f7;
}
.tmua-quadratic--compact .curve {
  stroke: #428eff;
}
.tmua-quadratic--compact .root {
  fill: #c5f232;
}
.tmua-quadratic--compact .vertex {
  fill: #17252e;
}
.home-observations {
  grid-column: 3;
  grid-row: 1 / 6;
  align-self: center;
  padding-left: 22px;
  border-left: 1px solid #eaf0f5;
}
.home-observations h6 {
  font-size: 15px;
  margin: 0 0 14px;
}
.home-observations > div {
  margin-top: 13px;
  padding-left: 10px;
  border-left: 2px solid #b9dbfe;
}
.home-observations strong,
.home-observations span {
  display: block;
}
.home-observations strong {
  font-size: 13px;
}
.home-observations span {
  font-size: 12px;
  line-height: 1.7;
  color: #728397;
  margin-top: 3px;
}
@media (max-width: 1200px) {
  .tmua-quadratic--compact {
    column-gap: 12px;
    grid-template-columns: 230px minmax(160px, 1fr) 180px;
    padding: 18px;
  }
  .home-observations {
    padding-left: 12px;
  }
}
@media (max-width: 600px) {
  .tmua-quadratic {
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
