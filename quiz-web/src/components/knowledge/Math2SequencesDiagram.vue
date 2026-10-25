<!-- 数学2第2章数列与级数互动图解：按4个考点切换递推链、等差配对求和、等比收敛折线与帕斯卡三角形，用于知识点讲解页。 -->
<template>
  <figure class="math2-sequences" :aria-label="heading">
    <figcaption>
      <span class="visual-label">MATHEMATICS 2 · 数列实验室</span>
      <h5>{{ heading }}</h5>
      <p>{{ invitation }}</p>
    </figcaption>

    <template v-if="activeTopic === '120201'">
      <div class="controls" role="group" aria-label="选择递推参数 p">
        <AppButton
          v-for="p in [-2, 1, 2]"
          :key="p"
          type="secondary"
          size="small"
          :aria-pressed="pick === p"
          @click="pick = p"
          >p = {{ p }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="recurFormula" /></div>
      <svg viewBox="0 0 480 150" role="img" :aria-label="recurAria">
        <g v-for="(v, i) in recurValues" :key="i">
          <rect :x="70 + i * 120 - 32" y="48" width="64" height="48" rx="10" class="node" />
          <text :x="70 + i * 120" y="36" class="tick-label">u{{ i + 1 }}</text>
          <text :x="70 + i * 120" y="80" class="node-value">{{ v }}</text>
        </g>
        <g v-for="i in 3" :key="'a' + i">
          <path
            :d="`M${70 + (i - 1) * 120 + 32} 72H${70 + i * 120 - 40}M${70 + i * 120 - 40} 65L${
              70 + i * 120 - 32
            } 72L${70 + i * 120 - 40} 79`"
            class="chain-arrow"
          />
          <text :x="70 + i * 120 - 60" y="118" class="chip-caption">×p + 3</text>
        </g>
      </svg>
      <ol class="recur-flow">
        <li v-for="line in recurSteps" :key="line"><LatexText :text="line" /></li>
      </ol>
      <p class="insight"><LatexText :text="recurInsight" /></p>
    </template>

    <template v-else-if="activeTopic === '120202'">
      <div class="controls" role="group" aria-label="选择项数 n">
        <AppButton
          v-for="n in [4, 5, 6]"
          :key="n"
          type="secondary"
          size="small"
          :aria-pressed="pick === n"
          @click="pick = n"
          >前 {{ n }} 项</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="arithFormula" /></div>
      <svg viewBox="0 0 480 250" role="img" :aria-label="arithAria">
        <path d="M50 210H440" class="axis" />
        <g v-for="(v, i) in arithTerms" :key="i">
          <rect :x="50 + i * 65" :y="210 - v * 12" width="40" :height="v * 12" :class="barClass(i)" />
          <text :x="70 + i * 65" y="230" class="bar-label">{{ v }}</text>
        </g>
        <g v-for="(pair, i) in arithPairs" :key="'p' + i">
          <path
            :d="`M${70 + pair.i * 65} ${pair.y}H${70 + pair.j * 65}M${70 + pair.i * 65} ${pair.y}V${
              210 - (2 * pair.i + 1) * 12
            }M${70 + pair.j * 65} ${pair.y}V${210 - (2 * pair.j + 1) * 12}`"
            class="bracket"
          />
          <text :x="70 + ((pair.i + pair.j) / 2) * 65" :y="pair.y - 8" class="bracket-label">
            {{ pair.label }}
          </text>
        </g>
      </svg>
      <p class="insight"><LatexText :text="arithInsight" /></p>
    </template>

    <template v-else-if="activeTopic === '120203'">
      <div class="controls" role="group" aria-label="选择公比情形">
        <AppButton
          v-for="item in geomModes"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="mode === item.id"
          @click="mode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="geomFormula" /></div>
      <svg viewBox="0 0 480 300" role="img" :aria-label="geomAria">
        <g v-for="tick in geomXTicks" :key="'x' + tick">
          <line :x1="gx(tick)" y1="30" :x2="gx(tick)" y2="250" class="grid" />
          <text :x="gx(tick)" y="272" class="tick-label">{{ tick }}</text>
        </g>
        <g v-for="tick in geomYTicks" :key="'y' + tick">
          <line x1="60" :y1="gy(tick)" x2="420" :y2="gy(tick)" class="grid" />
          <text x="46" :y="gy(tick) + 5" class="tick-label">{{ tick }}</text>
        </g>
        <path :d="'M60 ' + gy(0) + 'H420M' + gx(1) + ' 30V250'" class="axis" />
        <text x="412" y="290" class="tick-label">n</text>
        <text x="70" y="22" text-anchor="start" class="tick-label">uₙ</text>
        <path :d="geomPath" class="curve" />
        <g v-for="(mark, i) in geomMarks" :key="'m' + i">
          <circle :cx="gx(mark.x)" :cy="gy(mark.y)" r="5" class="mark" />
          <text :x="gx(mark.x) + mark.dx" :y="gy(mark.y) + mark.dy" class="point-label">{{
            mark.label
          }}</text>
        </g>
      </svg>
      <p class="result"><LatexText :text="geomSum" /></p>
      <p class="insight"><LatexText :text="geomInsight" /></p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="选择展开层数">
        <AppButton
          v-for="n in [3, 4, 5, 6]"
          :key="n"
          type="secondary"
          size="small"
          :aria-pressed="pick === n"
          @click="pick = n"
          >展开到 {{ n }} 次</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="pascalFormula" /></div>
      <svg viewBox="0 0 480 340" role="img" :aria-label="pascalAria">
        <g v-for="(row, r) in pascalRows" :key="r">
          <g v-for="(c, j) in row" :key="j">
            <circle
              :cx="240 + (j - r / 2) * 52"
              :cy="34 + r * 46"
              r="20"
              :class="r === pick ? 'pascal-cell pascal-highlight' : 'pascal-cell'"
            />
            <text :x="240 + (j - r / 2) * 52" :y="34 + r * 46 + 5" class="pascal-value">{{ c }}</text>
          </g>
        </g>
      </svg>
      <p class="insight"><LatexText :text="pascalInsight" /></p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic?: string }>()
const knownTopics = ['120201', '120202', '120203', '120204']
// 未匹配的知识点回落到递推场景，保证图解始终与主题相关。
const activeTopic = computed(() =>
  props.topic && knownTopics.includes(props.topic) ? props.topic : '120201',
)
const pick = ref(-2)
const mode = ref('decay')
const headings: Record<string, string> = {
  '120201': '逐项展开，常数每一层都在',
  '120202': '首尾配对，把和折半',
  '120203': '公比的绝对值决定收敛',
  '120204': '帕斯卡三角形读出组合数',
}
// 切换考点时恢复默认选项，避免前一场景的状态被错误带入。
function resetTopic() {
  mode.value = 'decay'
  if (activeTopic.value === '120201') pick.value = -2
  else if (activeTopic.value === '120202') pick.value = 4
  else if (activeTopic.value === '120204') pick.value = 4
}
watch(activeTopic, resetTopic, { immediate: true })
const heading = computed(() => headings[activeTopic.value] || '数列与级数')
const invitation = computed(() =>
  activeTopic.value === '120201'
    ? '切换 p，观察递推链每一步都在前项乘 p 后再加 3。'
    : '点选上方按钮，在图形、公式与结论之间来回检查。',
)
// 负数代入时给加括号，避免出现“×−1”这类歧义写法。
function paren(v: number) {
  return v < 0 ? '(' + v + ')' : String(v)
}
// 递推链：u1=2，u_{n+1}=p·u_n+3，常数 3 在每一层都保留。
const recurValues = computed(() => {
  const pv = pick.value
  const u1 = 2
  const u2 = 2 * pv + 3
  const u3 = pv * u2 + 3
  const u4 = pv * u3 + 3
  return [u1, u2, u3, u4]
})
const recurFormula = computed(() => '$u_{n+1}=p\\,u_n+3,\\quad u_1=2$')
const recurAria = computed(() =>
  '递推链从 u1 等于 2 出发，u2 到 u4 依次由上一项乘 p 再加 3 得到，依次为 ' +
    recurValues.value.join('、'),
)
const recurSteps = computed(() => {
  const pv = pick.value
  const u = recurValues.value
  return [
    '$u_1=2$',
    `$u_2=${pv}\\cdot2+3=${u[1]}$`,
    `$u_3=${pv}\\cdot${paren(u[1]!)}+3=${u[2]}$`,
    `$u_4=${pv}\\cdot${paren(u[2]!)}+3=${u[3]}$`,
  ]
})
const recurInsight = computed(
  () =>
    `递推把上一步的结果再加工：乘 $p$ 之后仍要加 3，常数不会在递推中消失，漏掉它后面全错。含参数时逐项展开成参数多项式，再利用整数、正项等条件试根。`,
)
// 等差：u_n=1+2(n−1)，首尾配对后每对和都是 u1+u_n。
const arithTerms = computed(() => Array.from({ length: pick.value }, (_, i) => 1 + 2 * i))
const arithFormula = computed(() => {
  const n = pick.value
  return `$u_n=1+2(n-1),\\quad S_{${n}}=\\frac{${n}}{2}(1+${2 * n - 1})=${n * n}$`
})
const arithAria = computed(() =>
  '等差数列 1、3、5 等共 ' + pick.value + ' 项，柱子高度代表项值，首尾两两配对',
)
const arithPairs = computed(() => {
  const n = pick.value
  const pairs: Array<{ i: number; j: number; y: number; label: string }> = []
  for (let i = 0; i < n - 1 - i; i++) {
    const j = n - 1 - i
    const ti = 210 - (2 * i + 1) * 12
    const tj = 210 - (2 * j + 1) * 12
    pairs.push({ i, j, y: Math.min(ti, tj) - 22, label: `${2 * i + 1}+${2 * j + 1}=${2 * n}` })
  }
  return pairs
})
const arithInsight = computed(() => {
  const n = pick.value
  return (
    `首项 ${1} 配末项 ${2 * n - 1}，第二项配倒数第二项，每对和都是 ${2 * n}；共有 ${n} 项，折半得 ` +
    `$S_{${n}}=${n * n}$。第 n 项的系数是 $n-1$，用 $u_1=1$ 自检。`
  )
})
function barClass(i: number) {
  const n = pick.value
  if (n % 2 === 1 && i === (n - 1) / 2) return 'bar bar-middle'
  const pairIndex = Math.min(i, n - 1 - i)
  return pairIndex % 2 === 0 ? 'bar bar-teal' : 'bar bar-blue'
}
// 等比：增长公比 2 发散，衰减公比 1/2 收敛且有有限无穷和。
const geomModes = [
  { id: 'growth', label: '公比 2（增长）' },
  { id: 'decay', label: '公比 1/2（衰减）' },
]
const geomParams = computed(() =>
  mode.value === 'growth' ? { a: 1, r: 2, ymax: 34 } : { a: 8, r: 0.5, ymax: 8 },
)
const geomTerms = computed(() => {
  const { a, r } = geomParams.value
  return Array.from({ length: 6 }, (_, i) => a * r ** i)
})
function gx(n: number) {
  return 60 + (n - 1) * 72
}
function gy(v: number) {
  return 250 - (v / geomParams.value.ymax) * 220
}
const geomXTicks = [1, 2, 3, 4, 5, 6]
const geomYTicks = computed(() =>
  mode.value === 'growth' ? [0, 8, 16, 24, 32] : [0, 2, 4, 6, 8],
)
const geomPath = computed(() =>
  geomTerms.value.map((v, i) => (i ? 'L' : 'M') + gx(i + 1) + ' ' + gy(v)).join(' '),
)
const geomMarks = computed(() =>
  geomTerms.value.map((v, i) => ({ x: i + 1, y: v, label: String(v), dx: 0, dy: -14 })),
)
const geomFormula = computed(() =>
  mode.value === 'growth'
    ? String.raw`$u_n=2^{\,n-1}\quad(a=1,\ r=2)$`
    : String.raw`$u_n=8\left(\frac12\right)^{n-1}$`,
)
const geomSum = computed(() =>
  mode.value === 'growth'
    ? String.raw`$|r|=2\ge1$：数列发散，没有无穷和。`
    : String.raw`$|r|=\frac12<1$，$S_\infty=\dfrac{a}{1-r}=\dfrac{8}{1-\frac12}=16$。`,
)
const geomAria = computed(() =>
  mode.value === 'growth'
    ? '公比 2 的等比数列逐项翻倍，从 1 到 32，单调发散'
    : '公比二分之一的等比数列从 8 开始逐项减半，逐步逼近 0',
)
const geomInsight = computed(() =>
  mode.value === 'growth'
    ? '每加一项都乘 2，项值无界增长；无穷和公式只在 $|r|<1$ 时成立，硬套会得到貌似合理的错误值。'
    : '每加一项都减半，项值趋于 0；$|r|<1$ 才谈无穷和。偶数项子列仍是等比级数，公比变为 $r^2$。',
)
// 帕斯卡三角形：第 n 行即 (a+b)^n 的系数，可交互展开层数。
function binom(n: number, r: number) {
  if (r < 0 || r > n) return 0
  let c = 1
  for (let k = 0; k < r; k++) c = (c * (n - k)) / (k + 1)
  return Math.round(c)
}
const pascalRows = computed(() =>
  Array.from({ length: pick.value + 1 }, (_, r) => Array.from({ length: r + 1 }, (_, j) => binom(r, j))),
)
const pascalFormula = computed(() => {
  const n = pick.value
  const parts: string[] = []
  for (let r = 0; r <= n; r++) {
    const c = binom(n, r)
    const coef = c === 1 ? '' : String(c)
    const aPart = n - r === 0 ? '' : n - r === 1 ? 'a' : 'a^{' + (n - r) + '}'
    const bPart = r === 0 ? '' : r === 1 ? 'b' : 'b^{' + r + '}'
    parts.push(coef + aPart + bPart)
  }
  return `$(a+b)^{${n}}=` + parts.join('+') + '$'
})
const pascalAria = computed(() =>
  '帕斯卡三角形从第 0 行到第 ' + pick.value + ' 行，每行数字是二项式展开的组合数',
)
const pascalInsight = computed(() => {
  const n = pick.value
  return (
    `每行系数对称：$\\binom{${n}}{r}=\\binom{${n}}{${n}-r}$。求指定项不必全部展开，写一般项 ` +
    `$\\binom{${n}}{r}a^{${n}-r}b^r$ 再定位 $r$；两项都含 $x$ 时先把幂次合并解出 $r$。`
  )
})
</script>

<style scoped>
.math2-sequences {
  margin: 20px 0 0;
  padding: 20px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-lg);
  background: var(--color-learning-teal-soft);
}
figcaption {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
.visual-label {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-learning-teal);
  color: var(--color-ink-inverse);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}
h5 {
  margin: 0;
  color: var(--color-learning-teal);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
}
figcaption p {
  flex-basis: 100%;
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
.controls .app-button.el-button {
  --app-button-bg: var(--color-surface);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-color: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-border: var(--color-learning-teal);
  --app-button-active-bg: var(--color-learning-teal-line);
  --app-button-active-border: var(--color-learning-teal);
}
.controls .app-button.el-button[aria-pressed='true'] {
  --app-button-bg: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-active-bg: var(--color-learning-teal);
}
.controls .app-button.el-button:focus-visible {
  outline-color: var(--color-learning-teal);
}
svg {
  display: block;
  width: 100%;
  max-width: 620px;
  height: auto;
  margin: 16px auto 0;
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
svg text {
  fill: var(--color-ink-soft);
  font-family: var(--font-sans);
  font-size: 15px;
  text-anchor: middle;
}
.formula-stage {
  margin-top: 16px;
  padding: 14px 10px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow-x: auto;
  text-align: center;
  font-size: var(--text-lg);
}
.insight {
  margin: 16px 0 0;
  padding: 12px 16px;
  border-left: 3px solid var(--color-learning-teal);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  overflow-wrap: anywhere;
}
.result {
  margin: 16px 0 0;
  padding: 12px 16px;
  border-left: 3px solid var(--color-learning-blue);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  overflow-wrap: anywhere;
}
.recur-flow {
  list-style: none;
  display: grid;
  gap: 10px;
  margin: 16px 0 0;
  padding: 0;
}
.recur-flow li {
  padding: 12px 14px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  overflow-x: auto;
  text-align: center;
}
.node {
  fill: var(--color-learning-teal-soft);
  stroke: var(--color-learning-teal-line);
  stroke-width: 2;
}
.node-value {
  fill: var(--color-learning-teal);
  font-size: 18px;
  font-weight: var(--weight-semi);
}
.chain-arrow {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 2;
}
.chip-caption {
  fill: var(--color-ink-muted);
  font-size: 13px;
}
.grid {
  stroke: var(--color-learning-teal-line);
  stroke-width: 1;
}
.axis {
  fill: none;
  stroke: var(--color-ink-muted);
  stroke-width: 1.5;
}
.tick-label {
  fill: var(--color-ink-muted);
  font-size: 13px;
}
.curve {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 3;
}
.mark {
  fill: var(--color-learning-blue);
  stroke: var(--color-surface);
  stroke-width: 2;
}
.point-label {
  fill: var(--color-learning-blue);
  font-size: 13px;
  font-weight: var(--weight-semi);
  paint-order: stroke;
  stroke: var(--color-surface);
  stroke-width: 4px;
  stroke-linejoin: round;
}
.bar {
  stroke-width: 1.5;
}
.bar-teal {
  fill: var(--color-learning-teal-soft);
  stroke: var(--color-learning-teal);
}
.bar-blue {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue);
}
.bar-middle {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
}
.bar-label {
  fill: var(--color-ink-soft);
  font-size: 14px;
  font-weight: var(--weight-semi);
}
.bracket {
  fill: none;
  stroke: var(--color-ink-muted);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}
.bracket-label {
  fill: var(--color-ink-muted);
  font-size: 13px;
}
.pascal-cell {
  fill: var(--color-learning-teal-soft);
  stroke: var(--color-learning-teal-line);
  stroke-width: 2;
}
.pascal-highlight {
  fill: var(--color-learning-teal-line);
  stroke: var(--color-learning-teal);
}
.pascal-value {
  fill: var(--color-learning-teal);
  font-weight: var(--weight-semi);
}
@media (max-width: 780px) {
  .math2-sequences {
    padding: 12px;
  }
  svg text {
    font-size: 22px;
  }
  .tick-label,
  .chip-caption,
  .point-label,
  .bar-label,
  .bracket-label {
    font-size: 18px;
  }
}
</style>
