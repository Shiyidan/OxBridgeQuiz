<!-- 数学2第1章代数互动图解：按7个考点切换指数律、根式、二次函数、联立方程、不等式、多项式定理与函数性质，用于知识点讲解页。 -->
<template>
  <figure class="math2-algebra" :aria-label="heading">
    <figcaption>
      <span class="visual-label">MATHEMATICS 2 · 代数实验室</span>
      <h5>{{ heading }}</h5>
      <p>{{ invitation }}</p>
    </figcaption>

    <template v-if="activeTopic === '120101'">
      <div class="controls" role="group" aria-label="选择指数法则">
        <AppButton
          v-for="item in indexLawModes"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="mode === item.id"
          @click="mode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="indexLawFormula" /></div>
      <svg viewBox="0 0 480 210" role="img" :aria-label="indexLawAria">
        <g v-if="mode === 'product'">
          <text x="124" y="22" class="chip-caption">2³ = 2×2×2</text>
          <g v-for="i in 3" :key="'a' + i">
            <rect :x="36 + (i - 1) * 52" y="32" width="44" height="44" class="chip" />
            <text :x="58 + (i - 1) * 52" y="61">2</text>
          </g>
          <text x="224" y="61">×</text>
          <text x="300" y="22" class="chip-caption">2² = 2×2</text>
          <g v-for="i in 2" :key="'b' + i">
            <rect :x="252 + (i - 1) * 52" y="32" width="44" height="44" class="chip" />
            <text :x="274 + (i - 1) * 52" y="61">2</text>
          </g>
          <text x="240" y="108" class="arrow-down">↓ 指数相加 3 + 2</text>
          <g v-for="i in 5" :key="'m' + i">
            <rect :x="36 + (i - 1) * 52" y="126" width="44" height="44" class="chip chip-merged" />
            <text :x="58 + (i - 1) * 52" y="155">2</text>
          </g>
          <text x="360" y="155" class="chip-result">= 2⁵ = 32</text>
        </g>
        <g v-else-if="mode === 'power'">
          <text x="240" y="20" class="chip-caption">(2³)²：两个 2³ 相乘</text>
          <g v-for="i in 3" :key="'p1' + i">
            <rect :x="100 + (i - 1) * 52" y="32" width="44" height="44" class="chip" />
            <text :x="122 + (i - 1) * 52" y="61">2</text>
          </g>
          <g v-for="i in 3" :key="'p2' + i">
            <rect :x="100 + (i - 1) * 52" y="96" width="44" height="44" class="chip" />
            <text :x="122 + (i - 1) * 52" y="125">2</text>
          </g>
          <text x="320" y="90" class="chip-result">指数相乘 3×2 → 2⁶ = 64</text>
        </g>
        <g v-else-if="mode === 'negative'">
          <text x="240" y="52" class="chip-caption">1</text>
          <path d="M170 66H310" class="fraction-bar" />
          <g v-for="i in 3" :key="'n' + i">
            <rect :x="192 + (i - 1) * 52" y="80" width="44" height="44" class="chip" />
            <text :x="214 + (i - 1) * 52" y="109">2</text>
          </g>
          <text x="240" y="162" class="chip-result">2⁻³ = 1/2³ = 1/8 = 0.125</text>
        </g>
        <g v-else>
          <rect x="40" y="80" width="64" height="48" class="chip" />
          <text x="72" y="111">8</text>
          <path d="M112 104H192 M184 96L192 104L184 112" class="flow-arrow" />
          <text x="152" y="76" class="chip-caption">先开立方</text>
          <rect x="200" y="80" width="64" height="48" class="chip" />
          <text x="232" y="111">2</text>
          <path d="M272 104H352 M344 96L352 104L344 112" class="flow-arrow" />
          <text x="312" y="76" class="chip-caption">再平方</text>
          <rect x="360" y="80" width="64" height="48" class="chip chip-merged" />
          <text x="392" y="111">4</text>
          <text x="240" y="172" class="chip-result">8^(2/3)：分母 3 先开立方，分子 2 再平方</text>
        </g>
      </svg>
      <p class="insight"><LatexText :text="indexLawInsight" /></p>
    </template>

    <template v-else-if="activeTopic === '120102'">
      <div class="controls" role="group" aria-label="选择要化简的根式">
        <AppButton
          v-for="item in surdModes"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="mode === item.id"
          @click="mode = item.id"
          >{{ item.side }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="surdFormula" /></div>
      <svg viewBox="0 0 480 240" role="img" :aria-label="surdAria">
        <rect x="60" y="30" width="180" height="180" class="surd-square" />
        <line
          v-for="i in surdGrid.size - 1"
          :key="'v' + i"
          :x1="60 + i * surdGrid.cellWidth"
          y1="30"
          :x2="60 + i * surdGrid.cellWidth"
          y2="210"
          class="surd-line"
        />
        <line
          v-for="i in surdGrid.size - 1"
          :key="'h' + i"
          x1="60"
          :y1="30 + i * surdGrid.cellWidth"
          x2="240"
          :y2="30 + i * surdGrid.cellWidth"
          class="surd-line"
        />
        <text
          v-for="cell in surdCells"
          :key="cell.key"
          :x="cell.x"
          :y="cell.y"
          class="surd-cell"
          >{{ surdGrid.cell }}</text
        >
        <text x="150" y="20" class="chip-caption">边长 {{ surdGrid.alt }}</text>
        <text x="50" y="125" text-anchor="end" class="chip-caption">{{ surdGrid.side }}</text>
        <text x="300" y="100" text-anchor="start" class="surd-note"
          >面积 = {{ surdGrid.size }}² × {{ surdGrid.cell }} = {{ surdGrid.total }}</text
        >
        <text x="300" y="132" text-anchor="start" class="surd-note"
          >边长 = {{ surdGrid.side }} = {{ surdGrid.alt }}</text
        >
        <text x="300" y="164" text-anchor="start" class="surd-note"
          >≈ {{ surdGrid.approx }}</text
        >
      </svg>
      <p class="insight"><LatexText :text="surdInsight" /></p>
    </template>

    <template v-else-if="activeTopic === '120103'">
      <div class="controls" role="group" aria-label="选择常数项 c">
        <AppButton
          v-for="c in [0, 1, 2]"
          :key="c"
          type="secondary"
          size="small"
          :aria-pressed="pick === c"
          @click="pick = c"
          >c = {{ c }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="quadraticFormula" /></div>
      <svg viewBox="0 0 480 300" role="img" :aria-label="quadraticAria">
        <g v-for="tick in xTicks" :key="'x' + tick">
          <line :x1="sx(tick)" y1="30" :x2="sx(tick)" y2="250" class="grid" />
          <text :x="sx(tick)" y="272" class="tick-label">{{ tick }}</text>
        </g>
        <g v-for="tick in yTicks" :key="'y' + tick">
          <line x1="60" :y1="sy(tick)" x2="420" :y2="sy(tick)" class="grid" />
          <text x="46" :y="sy(tick) + 5" class="tick-label">{{ tick }}</text>
        </g>
        <path :d="'M60 ' + sy(0) + 'H420M' + sx(0) + ' 30V250'" class="axis" />
        <text x="412" y="290" class="tick-label">x</text>
        <text x="70" y="22" text-anchor="start" class="tick-label">y</text>
        <path :d="parabolaPath" class="curve" />
        <g v-for="(point, i) in quadraticMarks" :key="'m' + i">
          <circle :cx="sx(point.x)" :cy="sy(point.y)" r="5" class="mark" />
          <text :x="sx(point.x) + point.dx" :y="sy(point.y) + point.dy" class="point-label">{{
            point.label
          }}</text>
        </g>
      </svg>
      <p class="insight"><LatexText :text="discriminantInsight" /></p>
    </template>

    <template v-else-if="activeTopic === '120104'">
      <div class="controls" role="group" aria-label="代入法步骤">
        <AppButton
          v-for="(label, i) in ['看两条曲线', '代入消元', '解出交点']"
          :key="label"
          type="secondary"
          size="small"
          :aria-pressed="step === i"
          @click="step = i"
          >{{ label }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="simultaneousFormula" /></div>
      <svg viewBox="0 0 480 300" role="img" aria-label="直线与抛物线的两个交点">
        <g v-for="tick in xTicks" :key="'x' + tick">
          <line :x1="sx(tick)" y1="30" :x2="sx(tick)" y2="250" class="grid" />
          <text :x="sx(tick)" y="272" class="tick-label">{{ tick }}</text>
        </g>
        <g v-for="tick in yTicks" :key="'y' + tick">
          <line x1="60" :y1="sy(tick)" x2="420" :y2="sy(tick)" class="grid" />
          <text x="46" :y="sy(tick) + 5" class="tick-label">{{ tick }}</text>
        </g>
        <path :d="'M60 ' + sy(0) + 'H420M' + sx(0) + ' 30V250'" class="axis" />
        <text x="412" y="290" class="tick-label">x</text>
        <text x="70" y="22" text-anchor="start" class="tick-label">y</text>
        <path :d="curvePath((x: number) => x * x - 1)" class="curve" />
        <path :d="curvePath((x: number) => x + 1)" class="curve curve-secondary" />
        <g v-for="(point, i) in simultaneousMarks" :key="'s' + i">
          <circle :cx="sx(point.x)" :cy="sy(point.y)" r="5" class="mark" />
          <text :x="sx(point.x) + point.dx" :y="sy(point.y) + point.dy" class="point-label">{{
            point.label
          }}</text>
        </g>
      </svg>
      <p class="insight"><LatexText :text="simultaneousInsight" /></p>
    </template>

    <template v-else-if="activeTopic === '120105'">
      <div class="controls" role="group" aria-label="选择不等式类型">
        <AppButton
          v-for="item in inequalityModes"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="mode === item.id"
          @click="mode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="inequalityFormula" /></div>
      <svg viewBox="0 0 480 160" role="img" :aria-label="inequalityAria">
        <path d="M40 85H445 M437 78L445 85L437 92" class="axis" />
        <g v-for="n in 8" :key="n">
          <line :x1="nl(-4 + n)" y1="79" :x2="nl(-4 + n)" y2="91" class="axis" />
          <text :x="nl(-4 + n)" y="118" class="tick-label">{{ -4 + n }}</text>
        </g>
        <template v-if="mode === 'linear'">
          <line :x1="nl(1)" y1="85" x2="445" y2="85" class="solution-line" />
          <circle :cx="nl(1)" cy="85" r="7" class="open-point" />
        </template>
        <template v-else-if="mode === 'outside'">
          <line x1="40" y1="85" :x2="nl(-1)" y2="85" class="solution-line" />
          <line :x1="nl(2)" y1="85" x2="445" y2="85" class="solution-line" />
          <circle :cx="nl(-1)" cy="85" r="7" class="open-point" />
          <circle :cx="nl(2)" cy="85" r="7" class="open-point" />
        </template>
        <template v-else>
          <line :x1="nl(-1)" y1="85" :x2="nl(2)" y2="85" class="solution-line" />
          <circle :cx="nl(-1)" cy="85" r="7" class="closed-point" />
          <circle :cx="nl(2)" cy="85" r="7" class="closed-point" />
        </template>
      </svg>
      <p class="insight"><LatexText :text="inequalityInsight" /></p>
    </template>

    <template v-else-if="activeTopic === '120106'">
      <div class="controls" role="group" aria-label="选择代入的 a 值">
        <AppButton
          v-for="a in [-2, 1, 2, 3]"
          :key="a"
          type="secondary"
          size="small"
          :aria-pressed="pick === a"
          @click="pick = a"
          >a = {{ a }}</AppButton
        >
      </div>
      <div class="formula-stage">
        <LatexText :text="String.raw`$f(x)=x^3-2x^2-5x+6=(x-1)(x-3)(x+2)$`" />
      </div>
      <div class="expression-grid">
        <div v-for="item in polynomialTerms" :key="item.formula">
          <LatexText :text="item.formula" />
          <strong>{{ item.value }}</strong>
          <small>{{ item.note }}</small>
        </div>
        <div class="sum-cell">
          <LatexText text="$f(a)$" />
          <strong>{{ polynomialValue }}</strong>
          <small>{{ polynomialValue === 0 ? '余数为 0，是因式' : '余数不为 0' }}</small>
        </div>
      </div>
      <p class="insight"><LatexText :text="polynomialInsight" /></p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="选择函数类型">
        <AppButton
          v-for="item in functionModes"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="mode === item.id"
          @click="mode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="functionFormula" /></div>
      <svg viewBox="0 0 480 300" role="img" :aria-label="functionAria">
        <g v-for="tick in xTicks" :key="'x' + tick">
          <line :x1="sx(tick)" y1="30" :x2="sx(tick)" y2="250" class="grid" />
          <text :x="sx(tick)" y="272" class="tick-label">{{ tick }}</text>
        </g>
        <g v-for="tick in yTicks" :key="'y' + tick">
          <line x1="60" :y1="sy(tick)" x2="420" :y2="sy(tick)" class="grid" />
          <text x="46" :y="sy(tick) + 5" class="tick-label">{{ tick }}</text>
        </g>
        <path :d="'M60 ' + sy(0) + 'H420M' + sx(0) + ' 30V250'" class="axis" />
        <text x="412" y="290" class="tick-label">x</text>
        <text x="70" y="22" text-anchor="start" class="tick-label">y</text>
        <path :d="functionPath" class="curve" />
      </svg>
      <p class="insight"><LatexText :text="functionInsight" /></p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic?: string }>()
const knownTopics = ['120101', '120102', '120103', '120104', '120105', '120106', '120107']
// 未匹配的知识点回落到二次函数判别式场景，保证图解始终与主题相关。
const activeTopic = computed(() =>
  props.topic && knownTopics.includes(props.topic) ? props.topic : '120103',
)
const mode = ref('product')
const step = ref(0)
// 默认落在按钮集合内且为非因式的 a=2，保证初始余数与下方文案自洽。
const pick = ref(2)
const headings: Record<string, string> = {
  '120101': '指数律是三笔不同的账',
  '120102': '把平方因子请出根号',
  '120103': '判别式决定抛物线与 x 轴的交点个数',
  '120104': '代入消元：交点就是共同解',
  '120105': '不等式的解集是区间，注意开闭端点',
  '120106': '因式定理与余数定理',
  '120107': '常见函数的样子与性质',
}
// 切换考点时恢复默认选项，避免前一场景的状态被错误带入。
function resetTopic() {
  mode.value =
    (
      {
        '120101': 'product',
        '120102': '12',
        '120105': 'linear',
        '120107': 'square',
      } as Record<string, string>
    )[activeTopic.value] || 'product'
  step.value = 0
  pick.value = 2
}
watch(activeTopic, resetTopic, { immediate: true })
const heading = computed(() => headings[activeTopic.value] || '代数与函数')
const invitation = computed(() =>
  activeTopic.value === '120106'
    ? '点选 a 的值，看 f(a) 是否归零。'
    : '点选上方按钮，在图形、公式与结论之间来回检查。',
)
// 指数律四种模式共用同一组芯片图。
const indexLawModes = [
  { id: 'product', label: '同底相乘' },
  { id: 'power', label: '幂的乘方' },
  { id: 'negative', label: '负指数' },
  { id: 'fraction', label: '分数指数' },
]
const indexLawFormula = computed(
  () =>
    (
      {
        product: String.raw`$2^3\times2^2=2^{3+2}=2^5=32$`,
        power: String.raw`$(2^3)^2=2^{3\times2}=2^6=64$`,
        negative: String.raw`$2^{-3}=\frac{1}{2^3}=\frac{1}{8}=0.125$`,
        fraction: String.raw`$8^{\frac{2}{3}}=\left(8^{\frac{1}{3}}\right)^2=2^2=4$`,
      } as Record<string, string>
    )[mode.value] || '',
)
const indexLawAria = computed(
  () =>
    (
      {
        product: '三个 2 与两个 2 相乘，合并为五个 2，指数相加得 2 的 5 次方',
        power: '两个 2 的立方相乘，共六个 2，指数相乘得 2 的 6 次方',
        negative: '2 的负 3 次方等于 1 除以三个 2 的乘积，结果为 0.125',
        fraction: '8 的三分之二次方：先开立方得 2，再平方得 4',
      } as Record<string, string>
    )[mode.value] || '',
)
const indexLawInsight = computed(
  () =>
    (
      {
        product:
          '同底数幂相乘，指数相加：$a^m\\times a^n=a^{m+n}$。底数必须相同才能合并。',
        power:
          '幂的乘方，指数相乘：$(a^m)^n=a^{mn}$。注意与 $a^m\\cdot a^n$ 区分，一个是叠乘，一个是合并。',
        negative:
          '负指数表示取倒数：$a^{-n}=\\frac{1}{a^n}$（$a\\ne0$）。负号只影响位置，不改变数值的正负。',
        fraction:
          '分数指数 $\\frac{m}{n}$：分母 $n$ 是开 $n$ 次方，分子 $m$ 是乘方。先开方再乘方，数值更小更好算。',
      } as Record<string, string>
    )[mode.value] || '',
)
// 根式场景：大正方形面积 = 小格数 × 每格面积，边长即根式化简结果。
const surdModes = [
  { id: '12', total: 12, size: 2, cell: 3, side: '√12', alt: '2√3', approx: '3.464' },
  { id: '8', total: 8, size: 2, cell: 2, side: '√8', alt: '2√2', approx: '2.828' },
  { id: '50', total: 50, size: 5, cell: 2, side: '√50', alt: '5√2', approx: '7.071' },
]
const surdGrid = computed(() => {
  const item = surdModes.find((s) => s.id === mode.value) || surdModes[0]!
  return { ...item, cellWidth: 180 / item.size }
})
const surdCells = computed(() => {
  const g = surdGrid.value
  const cells: Array<{ key: string; x: number; y: number }> = []
  for (let i = 0; i < g.size; i++)
    for (let j = 0; j < g.size; j++)
      cells.push({
        key: i + '-' + j,
        x: 60 + (i + 0.5) * g.cellWidth,
        y: 30 + (j + 0.5) * g.cellWidth + 5,
      })
  return cells
})
const surdFormula = computed(
  () =>
    (
      {
        '12': String.raw`$\sqrt{12}=\sqrt{4\times3}=\sqrt{4}\times\sqrt{3}=2\sqrt{3}$`,
        '8': String.raw`$\sqrt{8}=\sqrt{4\times2}=2\sqrt{2}$`,
        '50': String.raw`$\sqrt{50}=\sqrt{25\times2}=5\sqrt{2}$`,
      } as Record<string, string>
    )[mode.value] || '',
)
const surdAria = computed(
  () =>
    '面积 ' +
    surdGrid.value.total +
    ' 的正方形分成 ' +
    surdGrid.value.size +
    ' 乘 ' +
    surdGrid.value.size +
    ' 个小正方形，每格面积 ' +
    surdGrid.value.cell +
    '，边长为 ' +
    surdGrid.value.alt,
)
const surdInsight = computed(
  () =>
    String.raw`$\sqrt{ab}=\sqrt{a}\times\sqrt{b}$（$a,b\ge0$）。找到被开方数里的平方因子（4、9、25……），开出来写在根号外；剩下不能再开的留在根号内。`,
)
// 二次函数：y = x² − 2x + c，顶点 (1, c−1)，判别式 4 − 4c。
const bounds = computed(() =>
  activeTopic.value === '120107'
    ? { xmin: -3, xmax: 3, ymin: -3, ymax: 3 }
    : { xmin: -1.5, xmax: 3.5, ymin: -2.5, ymax: 4.5 },
)
// 同一坐标映射服务网格、曲线与标注点，保证图形对齐。
function sx(x: number) {
  const b = bounds.value
  return 60 + ((x - b.xmin) / (b.xmax - b.xmin)) * 360
}
function sy(y: number) {
  const b = bounds.value
  return 250 - ((y - b.ymin) / (b.ymax - b.ymin)) * 220
}
const xTicks = computed(() => (activeTopic.value === '120107' ? [-2, 0, 2] : [-1, 0, 1, 2, 3]))
const yTicks = computed(() =>
  activeTopic.value === '120107' ? [-2, 0, 2] : [-2, -1, 0, 1, 2, 3, 4],
)
// 超出视窗的采样点断开路径，避免把渐近线两侧错误相连。
function curvePath(fn: (x: number) => number) {
  const b = bounds.value
  let path = ''
  let connected = false
  for (let i = 0; i <= 240; i++) {
    const x = b.xmin + ((b.xmax - b.xmin) * i) / 240
    const y = fn(x)
    if (!Number.isFinite(y) || y < b.ymin - 0.5 || y > b.ymax + 0.5) {
      connected = false
      continue
    }
    path += (connected ? 'L' : 'M') + sx(x).toFixed(2) + ' ' + sy(y).toFixed(2) + ' '
    connected = true
  }
  return path
}
const parabolaPath = computed(() => curvePath((x) => x * x - 2 * x + pick.value))
const quadraticFormula = computed(() => {
  const c = pick.value
  const vertex = c - 1
  const vertexPart = vertex === 0 ? '' : (vertex > 0 ? '+' : '') + vertex
  return '$y=x^2-2x+' + c + '=(x-1)^2' + vertexPart + '$'
})
const quadraticMarks = computed(() => {
  const c = pick.value
  const marks = [{ x: 1, y: c - 1, label: '顶点 (1,' + (c - 1) + ')', dx: 8, dy: 24 }]
  if (c === 0)
    marks.push(
      { x: 0, y: 0, label: 'x=0', dx: -14, dy: -12 },
      { x: 2, y: 0, label: 'x=2', dx: 14, dy: -12 },
    )
  if (c === 1) marks.push({ x: 1, y: 0, label: 'x=1（重根）', dx: 0, dy: -14 })
  return marks
})
const quadraticAria = computed(
  () =>
    '抛物线 y 等于 x 平方减 2x 加 ' +
    pick.value +
    '，顶点纵坐标 ' +
    (pick.value - 1) +
    (pick.value === 0 ? '，与 x 轴有两个交点' : pick.value === 1 ? '，与 x 轴相切' : '，不与 x 轴相交'),
)
const discriminantInsight = computed(
  () =>
    (
      {
        0: '判别式 $\\Delta=b^2-4ac=4-0=4>0$：两个不同实根 $x=0$ 和 $x=2$，抛物线与 $x$ 轴相交两次。',
        1: '判别式 $\\Delta=4-4=0$：一个重根 $x=1$，抛物线与 $x$ 轴相切，只接触一次。',
        2: '判别式 $\\Delta=4-8=-4<0$：没有实根，整条抛物线在 $x$ 轴上方。',
      } as Record<number, string>
    )[pick.value] || '',
)
// 联立方程：直线 y=x+1 与抛物线 y=x²−1 的交点即共同解。
const simultaneousFormula = computed(
  () =>
    [
      String.raw`$y=x+1,\qquad y=x^2-1$`,
      String.raw`$x^2-1=x+1\ \Longrightarrow\ x^2-x-2=0$`,
      String.raw`$(x+1)(x-2)=0\ \Rightarrow\ x=-1\text{ 或 }2$；回代得交点 $(-1,0)$、$(2,3)$`,
    ][step.value] || '',
)
const simultaneousMarks = [
  { x: -1, y: 0, label: '(-1,0)', dx: -16, dy: 22 },
  { x: 2, y: 3, label: '(2,3)', dx: 16, dy: -12 },
]
const simultaneousInsight = computed(
  () =>
    [
      '两条曲线的交点同时满足两个方程，所以求交点就是解联立方程。',
      '把直线表达式代入抛物线，消去 y，得到只含 x 的一元二次方程。',
      '每个 x 必须回代求对应的 y；交点坐标要成对写出，代回原方程检验。',
    ][step.value] || '',
)
// 不等式解集画在数轴上：空心端点不含，实心端点包含。
const inequalityModes = [
  { id: 'linear', label: '一次：2x+1>3' },
  { id: 'outside', label: '二次：两根之外' },
  { id: 'between', label: '二次：两根之间' },
]
function nl(v: number) {
  return 40 + ((v + 3) / 7) * 400
}
const inequalityFormula = computed(
  () =>
    (
      {
        linear: String.raw`$2x+1>3\ \Longleftrightarrow\ x>1$`,
        outside: String.raw`$x^2-x-2>0\ \Longleftrightarrow\ (x+1)(x-2)>0\ \Longleftrightarrow\ x<-1\ \text{或}\ x>2$`,
        between: String.raw`$x^2-x-2\le0\ \Longleftrightarrow\ -1\le x\le2$`,
      } as Record<string, string>
    )[mode.value] || '',
)
const inequalityAria = computed(
  () =>
    (
      {
        linear: '数轴上 x 大于 1，端点 1 为空心，射线向右',
        outside: '数轴上 x 小于负 1 或 x 大于 2，两个端点均为空心',
        between: '数轴上 x 在负 1 与 2 之间，两个端点均为实心',
      } as Record<string, string>
    )[mode.value] || '',
)
const inequalityInsight = computed(
  () =>
    (
      {
        linear:
          '解一次不等式与解方程步骤相同；两端乘除负数时不等号要反向。空心圈表示 $x=1$ 本身不满足。',
        outside:
          '开口向上的抛物线在两根之外位于 $x$ 轴上方，所以大于零的解集分两段；两个解集之间用“或”，不能写成 $-1>x>2$。',
        between:
          '同一个二次式小于等于零时解集在两根之间，不等号带等号，端点用实心点表示包含 $-1$ 和 $2$。',
      } as Record<string, string>
    )[mode.value] || '',
)
// 多项式场景：代入 a 计算各项，余数为 0 时 (x−a) 是因式。
const polynomialTerms = computed(() => {
  const a = pick.value
  return [
    { formula: '$a^3$', value: a ** 3, note: '立方项' },
    { formula: '$-2a^2$', value: -2 * a * a, note: '平方项' },
    { formula: '$-5a$', value: -5 * a, note: '一次项' },
    { formula: '$+6$', value: 6, note: '常数项' },
  ]
})
const polynomialValue = computed(() =>
  polynomialTerms.value.reduce((sum, item) => sum + item.value, 0),
)
const polynomialInsight = computed(() => {
  const a = pick.value
  if (polynomialValue.value === 0)
    return (
      '$f(' +
      a +
      ')=0$，由因式定理，$(x' +
      (a >= 0 ? '-' : '+') +
      Math.abs(a) +
      ')$ 是 $f(x)$ 的因式，$x=' +
      a +
      '$ 是方程 $f(x)=0$ 的根。'
    )
  const sign = a >= 0 ? '-' : '+'
  return (
    '$f(' +
    a +
    ')=' +
    polynomialValue.value +
    '\\ne0$，所以 $(x' +
    sign +
    Math.abs(a) +
    ')$ 不是因式；由余数定理，$f(x)$ 除以 $(x' +
    sign +
    Math.abs(a) +
    ')$ 的余数就是 ' +
    polynomialValue.value +
    '。'
  )
})
// 常见函数图像：定义域与对称性是要读出的性质。
const functionModes = [
  { id: 'square', label: 'y = x²' },
  { id: 'cube', label: 'y = x³' },
  { id: 'reciprocal', label: 'y = 1/x' },
  { id: 'sqrt', label: 'y = √x' },
]
const functionPath = computed(() => {
  const fns: Record<string, (x: number) => number> = {
    square: (x) => x * x,
    cube: (x) => x * x * x,
    reciprocal: (x) => 1 / x,
    sqrt: (x) => (x < 0 ? NaN : Math.sqrt(x)),
  }
  return curvePath(fns[mode.value] || fns.square!)
})
const functionFormula = computed(
  () =>
    (
      {
        square: String.raw`$y=x^2$`,
        cube: String.raw`$y=x^3$`,
        reciprocal: String.raw`$y=\frac{1}{x}\quad(x\ne0)$`,
        sqrt: String.raw`$y=\sqrt{x}\quad(x\ge0)$`,
      } as Record<string, string>
    )[mode.value] || '',
)
const functionAria = computed(
  () =>
    (
      {
        square: '抛物线开口向上，关于 y 轴对称',
        cube: '三次曲线过原点，关于原点对称，单调上升',
        reciprocal: '双曲线分两支，分别在一三象限，不接触坐标轴',
        sqrt: '根号函数从原点出发，只在 x 非负时有定义，上升渐缓',
      } as Record<string, string>
    )[mode.value] || '',
)
const functionInsight = computed(
  () =>
    (
      {
        square:
          '偶函数：$f(-x)=f(x)$，图像关于 $y$ 轴对称；值域 $y\\ge0$，$x=0$ 处取最小值。',
        cube:
          '奇函数：$f(-x)=-f(x)$，图像关于原点对称；全体实数上单调递增，负输入得负输出。',
        reciprocal:
          '定义域排除 $x=0$，图像分两支，永不与坐标轴相交；关于原点对称。$x$ 越大，$y$ 越接近 0 但不等于 0。',
        sqrt:
          '定义域 $x\\ge0$，值域 $y\\ge0$；从原点出发单调递增，增长越来越平缓——这是 $x^2$（$x\\ge0$）的反函数图像。',
      } as Record<string, string>
    )[mode.value] || '',
)
</script>

<style scoped>
.math2-algebra {
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
.chip {
  fill: var(--color-learning-teal-soft);
  stroke: var(--color-learning-teal-line);
  stroke-width: 2;
  rx: 8;
}
.chip-merged {
  fill: var(--color-learning-teal-line);
  stroke: var(--color-learning-teal);
}
.chip-caption {
  fill: var(--color-ink-muted);
  font-size: 13px;
}
.chip-result {
  fill: var(--color-learning-teal);
  font-size: 15px;
  font-weight: var(--weight-semi);
}
.arrow-down {
  fill: var(--color-learning-blue);
  font-size: 14px;
  font-weight: var(--weight-semi);
}
.fraction-bar {
  stroke: var(--color-ink-muted);
  stroke-width: 2;
}
.flow-arrow {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 2;
}
.surd-square {
  fill: var(--color-learning-teal-soft);
  stroke: var(--color-learning-teal);
  stroke-width: 2;
}
.surd-line {
  stroke: var(--color-learning-teal-line);
  stroke-width: 1.5;
}
.surd-cell {
  fill: var(--color-learning-teal);
  font-weight: var(--weight-semi);
}
.surd-note {
  fill: var(--color-ink-soft);
  font-size: 14px;
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
.curve-secondary {
  stroke: var(--color-learning-teal);
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
.solution-line {
  stroke: var(--color-learning-teal);
  stroke-width: 5;
}
.open-point {
  fill: var(--color-surface);
  stroke: var(--color-learning-amber);
  stroke-width: 2.5;
}
.closed-point {
  fill: var(--color-learning-teal);
  stroke: var(--color-learning-teal);
}
.expression-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin-top: 16px;
}
.expression-grid > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 0;
  padding: 14px 8px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.expression-grid strong {
  color: var(--color-learning-teal);
  font-size: var(--text-xl);
}
.expression-grid small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  text-align: center;
}
.sum-cell {
  border-color: var(--color-learning-teal);
}
@media (max-width: 780px) {
  .math2-algebra {
    padding: 12px;
  }
  svg text {
    font-size: 22px;
  }
  .tick-label,
  .chip-caption,
  .point-label {
    font-size: 18px;
  }
  .expression-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
