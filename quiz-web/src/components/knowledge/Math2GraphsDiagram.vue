<!-- 数学2函数图像互动图解：同一坐标系中观察定义域、变换、参数、升降与交点。 -->
<template>
  <figure class="math2-graphs" :aria-label="heading">
    <figcaption>
      <span>MATHEMATICS 2 · GRAPHS</span>
      <h5>{{ heading }}</h5>
      <p>{{ introduction }}</p>
    </figcaption>
    <div v-if="mode === 'common'" class="controls" role="group" aria-label="选择基本函数">
      <AppButton
        v-for="(item, index) in families"
        :key="item.label"
        size="small"
        :type="familyIndex === index ? 'primary' : 'secondary'"
        :aria-pressed="familyIndex === index"
        @click="familyIndex = index"
        >{{ item.label }}</AppButton
      >
    </div>
    <div v-else-if="mode === 'transform'" class="controls" role="group" aria-label="选择图像变换">
      <AppButton
        v-for="(item, index) in transforms"
        :key="item.label"
        size="small"
        :type="transformIndex === index ? 'primary' : 'secondary'"
        :aria-pressed="transformIndex === index"
        @click="transformIndex = index"
        >{{ item.label }}</AppButton
      >
    </div>
    <template v-else-if="mode === 'line'">
      <div class="controls" role="group" aria-label="调整直线斜率">
        <span class="control-label">斜率 m</span>
        <AppButton
          v-for="value in [-2, -1, 0, 1, 2]"
          :key="value"
          size="small"
          :type="slope === value ? 'primary' : 'secondary'"
          :aria-pressed="slope === value"
          @click="slope = value"
          >{{ value }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="调整直线纵截距">
        <span class="control-label">截距 c</span>
        <AppButton
          v-for="value in [-2, 0, 2]"
          :key="value"
          size="small"
          :type="intercept === value ? 'primary' : 'secondary'"
          :aria-pressed="intercept === value"
          @click="intercept = value"
          >{{ value }}</AppButton
        >
      </div>
    </template>
    <template v-else-if="mode === 'quadratic'">
      <div class="controls" role="group" aria-label="调整二次函数开口">
        <span class="control-label">开口 a</span>
        <AppButton
          v-for="value in [-2, -1, 0.5, 1, 2]"
          :key="value"
          size="small"
          :type="quadA === value ? 'primary' : 'secondary'"
          :aria-pressed="quadA === value"
          @click="quadA = value"
          >{{ value }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="调整二次函数水平位置">
        <span class="control-label">括号 b</span>
        <AppButton
          v-for="value in [-1, 0, 1]"
          :key="value"
          size="small"
          :type="quadB === value ? 'primary' : 'secondary'"
          :aria-pressed="quadB === value"
          @click="quadB = value"
          >{{ value }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="调整二次函数顶点高度">
        <span class="control-label">高度 c</span>
        <AppButton
          v-for="value in [-1, 0, 1]"
          :key="value"
          size="small"
          :type="quadC === value ? 'primary' : 'secondary'"
          :aria-pressed="quadC === value"
          @click="quadC = value"
          >{{ value }}</AppButton
        >
      </div>
    </template>
    <div
      v-else-if="mode === 'derivative'"
      class="controls"
      role="group"
      aria-label="比较驻点的图像"
    >
      <AppButton
        v-for="(item, index) in derivativeCases"
        :key="item.label"
        size="small"
        :type="derivativeIndex === index ? 'primary' : 'secondary'"
        :aria-pressed="derivativeIndex === index"
        @click="derivativeIndex = index"
        >{{ item.label }}</AppButton
      >
      <AppButton
        size="small"
        type="secondary"
        :aria-pressed="showDerivative"
        @click="showDerivative = !showDerivative"
        >{{ showDerivative ? '隐藏导函数' : '叠加导函数' }}</AppButton
      >
    </div>
    <div v-else-if="mode === 'roots'" class="controls" role="group" aria-label="比较根的重数">
      <AppButton
        v-for="(item, index) in rootCases"
        :key="item.label"
        size="small"
        :type="rootIndex === index ? 'primary' : 'secondary'"
        :aria-pressed="rootIndex === index"
        @click="rootIndex = index"
        >{{ item.label }}</AppButton
      >
    </div>
    <div v-else class="controls" role="group" aria-label="移动水平线观察交点">
      <span class="control-label">直线 y = k</span>
      <AppButton
        v-for="value in [-1, 0, 1, 4]"
        :key="value"
        size="small"
        :type="height === value ? 'primary' : 'secondary'"
        :aria-pressed="height === value"
        @click="height = value"
        >{{ value }}</AppButton
      >
    </div>

    <p class="formula"><LatexText :text="formula" /></p>
    <svg viewBox="0 0 420 370" role="img" :aria-label="graphLabel">
      <title>{{ graphLabel }}</title>
      <g v-for="tick in ticks" :key="tick">
        <path :d="'M' + gx(-4) + ' ' + gy(tick) + 'H' + gx(4)" class="grid" />
        <path :d="'M' + gx(tick) + ' ' + gy(-4) + 'V' + gy(4)" class="grid" />
        <text v-if="tick !== 0" :x="gx(tick)" :y="gy(0) + 17" text-anchor="middle">{{ tick }}</text>
        <text v-if="tick !== 0" :x="gx(0) - 9" :y="gy(tick) + 4" text-anchor="end">{{ tick }}</text>
      </g>
      <path
        :d="
          'M' +
          gx(-4) +
          ' ' +
          gy(0) +
          'H' +
          (gx(4) + 10) +
          'M' +
          gx(0) +
          ' ' +
          gy(-4) +
          'V' +
          (gy(4) - 10)
        "
        class="axis"
      />
      <text :x="gx(4) + 15" :y="gy(0) + 5">x</text>
      <text :x="gx(0) + 8" :y="gy(4) - 8">y</text>
      <text :x="gx(0) - 8" :y="gy(0) + 17" text-anchor="end">0</text>
      <path
        v-for="(line, index) in asymptotes"
        :key="'asymptote' + index"
        :d="line"
        class="asymptote"
      />
      <path
        v-for="(curve, index) in curves"
        :key="'curve' + index"
        :d="curve.d"
        :class="curve.kind"
      />
      <g v-for="point in points" :key="point.label">
        <circle :cx="gx(point.x)" :cy="gy(point.y)" r="4.5" class="point" />
        <text :x="gx(point.x) + 8" :y="gy(point.y) - 10" class="point-label">
          {{ point.label }}
        </text>
      </g>
    </svg>
    <p class="legend">
      <span class="blue">实线：{{ mainLegend }}</span
      ><span v-if="secondaryLegend" class="teal">虚线：{{ secondaryLegend }}</span>
    </p>
    <div class="result" aria-live="polite"><LatexText :text="conclusion" /></div>
    <p class="prompt"><LatexText :text="prompt" /></p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'

const props = defineProps<{ topic: string }>()
type GraphFunction = (x: number) => number
type Point = { x: number; y: number; label: string }
type Mode = 'common' | 'transform' | 'line' | 'quadratic' | 'derivative' | 'roots' | 'intersections'
const topicModes: Record<string, Mode> = {
  '120801': 'common',
  '120802': 'transform',
  '120803': 'line',
  '120804': 'quadratic',
  '120805': 'derivative',
  '120806': 'roots',
  '120807': 'intersections',
}
// 按知识点选择独立教学模型，避免图像与当前正文错位。
const mode = computed(() => topicModes[props.topic] ?? 'common')
// 每个模型的标题对应一个可观察的问题。
const heading = computed(
  () =>
    ({
      common: '先认特征，再画曲线',
      transform: '同一个点，变换后去了哪里？',
      line: '改变斜率或截距，观察直线怎样移动',
      quadratic: '顶点不难找：括号内先变号',
      derivative: '从导数的正负，读原图的升降',
      roots: '穿过还是接触？看根的重数',
      intersections: '移动一条水平线，数不同交点',
    })[mode.value] ?? '',
)
// 模型说明强调操作顺序而不是重复知识点名称。
const introduction = computed(
  () =>
    ({
      common: '切换基本函数，比较定义域、截距和渐近线。三角函数横坐标使用弧度。',
      transform: '绿色虚线作为参照；逐个比较输出变化与输入变化，再查看两种复合顺序。',
      line: '先固定c只改变m，再固定m只改变c，观察共同点与平行关系。',
      quadratic: '分别调整a、b、c，绿色点始终标记顶点。',
      derivative: '比较两个极值与水平驻点；需要时叠加导函数检查符号。',
      roots: '把因式分解与曲线接触x轴的方式放在一起看。',
      intersections: '比较k为负、零、正时，直线与抛物线的交点数量。',
    })[mode.value] ?? '',
)
const familyIndex = ref(0)
const transformIndex = ref(0)
const slope = ref(1)
const intercept = ref(0)
const quadA = ref(1)
const quadB = ref(0)
const quadC = ref(0)
const derivativeIndex = ref(0)
const showDerivative = ref(false)
const rootIndex = ref(0)
const height = ref(1)
const ticks = [-4, -2, 0, 2, 4]

const families = [
  {
    label: '直线',
    formula: '$y=x$',
    fn: (x: number) => x,
    note: '定义域、值域都是实数；经过原点，斜率为1。',
  },
  {
    label: '平方',
    formula: '$y=x^2$',
    fn: (x: number) => x * x,
    note: '关于y轴对称，最小值0；负输入也有非负输出。',
  },
  {
    label: '立方',
    formula: '$y=x^3$',
    fn: (x: number) => x ** 3,
    note: '关于原点对称，全轴递增；原点变平，但不是极值。',
  },
  {
    label: '平方根',
    formula: '$y=\\sqrt{x}$',
    fn: (x: number) => (x >= 0 ? Math.sqrt(x) : NaN),
    note: '只画x≥0、y≥0的分支；没有负横坐标部分。',
  },
  {
    label: '绝对值',
    formula: '$y=|x|$',
    fn: Math.abs,
    note: 'V形关于y轴对称，原点是尖角，不能画成光滑U形。',
  },
  {
    label: '指数',
    formula: '$y=2^x$',
    fn: (x: number) => 2 ** x,
    note: '经过(0,1)，全轴递增且始终为正；向左接近y=0而不相交。',
  },
  {
    label: '对数',
    formula: '$y=\\log_2 x$',
    fn: (x: number) => (x > 0 ? Math.log2(x) : NaN),
    note: '只允许x>0，经过(1,0)；向左接近x=0而不相交。',
  },
  {
    label: '正弦',
    formula: '$y=\\sin x$',
    fn: Math.sin,
    note: '值在−1至1之间，周期2π，关于原点对称。',
  },
  {
    label: '余弦',
    formula: '$y=\\cos x$',
    fn: Math.cos,
    note: '值在−1至1之间，周期2π，关于y轴对称，x=0时为1。',
  },
  {
    label: '正切',
    formula: '$y=\\tan x$',
    fn: Math.tan,
    note: '周期π；x=π/2+kπ处无定义，图像分支不能跨虚线连接。',
  },
]
const transforms = [
  {
    label: '纵向×2',
    formula: '$g(x)=2f(x)$',
    fn: (x: number) => 2 * (x * x + x),
    point: { x: 1, y: 4, label: '(1,4)' },
    note: '点(1,2)变为(1,4)：输入不动，输出乘2。',
  },
  {
    label: '上移1',
    formula: '$g(x)=f(x)+1$',
    fn: (x: number) => x * x + x + 1,
    point: { x: 1, y: 3, label: '(1,3)' },
    note: '点(1,2)变为(1,3)：所有高度加1。',
  },
  {
    label: '左移1',
    formula: '$g(x)=f(x+1)$',
    fn: (x: number) => (x + 1) ** 2 + x + 1,
    point: { x: 0, y: 2, label: '(0,2)' },
    note: '点(1,2)变为(0,2)：x+1等于旧输入1时，新x为0。',
  },
  {
    label: '横向×½',
    formula: '$g(x)=f(2x)$',
    fn: (x: number) => 4 * x * x + 2 * x,
    point: { x: 0.5, y: 2, label: '(½,2)' },
    note: '点(1,2)变为(½,2)：内部乘2，横坐标反而除以2。',
  },
  {
    label: '上下反射',
    formula: '$g(x)=-f(x)$',
    fn: (x: number) => -x * x - x,
    point: { x: 1, y: -2, label: '(1,−2)' },
    note: '外面的负号只改变输出符号，关于x轴反射。',
  },
  {
    label: '左右反射',
    formula: '$g(x)=f(-x)$',
    fn: (x: number) => x * x - x,
    point: { x: -1, y: 2, label: '(−1,2)' },
    note: '里面的负号改变输入方向，关于y轴反射。',
  },
  {
    label: '先压缩后左移',
    formula: '$g(x)=f(2(x+1))$',
    fn: (x: number) => 4 * (x + 1) ** 2 + 2 * (x + 1),
    point: { x: -0.5, y: 2, label: '(−½,2)' },
    note: '旧点先到(½,2)，再左移1到(−½,2)。',
  },
  {
    label: '先左移后压缩',
    formula: '$g(x)=f(2x+1)$',
    fn: (x: number) => (2 * x + 1) ** 2 + 2 * x + 1,
    point: { x: 0, y: 2, label: '(0,2)' },
    note: '旧点先到(0,2)，再横向压缩仍为(0,2)；顺序不同结果不同。',
  },
  {
    label: '复合顺序',
    formula: '$f(x)=x^2,\\ g(x)=x+1$',
    fn: (x: number) => (x + 1) ** 2,
    point: { x: 0, y: 1, label: '(0,1)' },
    note: '蓝线f(g(x))=(x+1)²，虚线g(f(x))=x²+1。除个别点外并不相同。',
  },
]
const derivativeCases = [
  {
    label: '两个极值',
    formula: "$f(x)=x^3-3x,\\ f'(x)=3x^2-3$",
    fn: (x: number) => x ** 3 - 3 * x,
    derivative: (x: number) => 3 * x * x - 3,
    note: 'x<−1时增，−1<x<1时减，x>1时增。极大点(−1,2)，极小点(1,−2)。',
    points: [
      { x: -1, y: 2, label: '极大' },
      { x: 1, y: -2, label: '极小' },
    ],
  },
  {
    label: '水平却不转折',
    formula: "$f(x)=x^3,\\ f'(x)=3x^2$",
    fn: (x: number) => x ** 3,
    derivative: (x: number) => 3 * x * x,
    note: '除原点外导数为正，原点导数为0却不变号；原函数全轴递增，没有极大或极小。',
    points: [{ x: 0, y: 0, label: '水平驻点' }],
  },
  {
    label: '二阶导数为零的极小',
    formula: "$f(x)=x^4,\\ f'(x)=4x^3$",
    fn: (x: number) => x ** 4,
    derivative: (x: number) => 4 * x ** 3,
    note: '原点两侧导数由负变正，所以是极小；即使f″(0)=0，也不能排除极值。',
    points: [{ x: 0, y: 0, label: '极小' }],
  },
]
const rootCases = [
  {
    label: '一个单根＋一个双根',
    formula: '$f(x)=(x+1)^2(x-2)$',
    fn: (x: number) => (x + 1) ** 2 * (x - 2),
    note: '两个不同实根：−1是双根，接触后仍在x轴下；2是单根，穿轴变正。y截距为−2。',
    points: [
      { x: -1, y: 0, label: '双根' },
      { x: 2, y: 0, label: '单根' },
      { x: 0, y: -2, label: 'y截距' },
    ],
  },
  {
    label: '一个三重根',
    formula: '$f(x)=(x-1)^3$',
    fn: (x: number) => (x - 1) ** 3,
    note: '只有一个不同实根1；三重根仍穿过x轴，只是穿过时切线水平。y截距为−1。',
    points: [
      { x: 1, y: 0, label: '三重根' },
      { x: 0, y: -1, label: 'y截距' },
    ],
  },
  {
    label: '无实根',
    formula: '$f(x)=x^2+1$',
    fn: (x: number) => x * x + 1,
    note: '二次函数最小值为1，始终高于x轴，因此没有实根；次数2不意味着有两个实交点。',
    points: [{ x: 0, y: 1, label: 'y截距/最小值' }],
  },
]

// 参数统一保留短小数，避免图像标签显示浮点噪声。
function format(value: number) {
  return Number(value.toFixed(3)).toString()
}
// 坐标轴采用相同单位长度，斜率与角度不会因纵横拉伸而失真。
function gx(x: number) {
  return 210 + 38 * x
}
function gy(y: number) {
  return 180 - 38 * y
}
// 只连接窗口内连续点；越域或越界即断笔，避免正切渐近线与根式边界产生伪连线。
function pathFor(fn: GraphFunction): string {
  let result = '',
    drawing = false,
    previousY = NaN
  for (let index = 0; index <= 800; index++) {
    const x = -4 + index / 100
    const y = fn(x)
    if (!Number.isFinite(y) || y < -4 || y > 4) {
      drawing = false
      previousY = NaN
      continue
    }
    if (Number.isFinite(previousY) && Math.abs(y - previousY) > 1) drawing = false
    result += (drawing ? 'L' : 'M') + gx(x).toFixed(2) + ' ' + gy(y).toFixed(2)
    drawing = true
    previousY = y
  }
  return result
}
// 当前知识点参数决定蓝色主曲线，所有计算只用于教学示意。
const mainFunction = computed<GraphFunction>(() => {
  if (mode.value === 'common') return families[familyIndex.value]!.fn
  if (mode.value === 'transform') return transforms[transformIndex.value]!.fn
  if (mode.value === 'line') return (x: number) => slope.value * x + intercept.value
  if (mode.value === 'quadratic')
    return (x: number) => quadA.value * (x + quadB.value) ** 2 + quadC.value
  if (mode.value === 'derivative') return derivativeCases[derivativeIndex.value]!.fn
  if (mode.value === 'roots') return rootCases[rootIndex.value]!.fn
  return (x: number) => x * x
})
// 参照线与原图同坐标叠加，显示变换前后、导函数或联立的另一条图像。
const secondaryFunction = computed<GraphFunction | null>(() => {
  if (mode.value === 'transform')
    return transformIndex.value === 8 ? (x: number) => x * x + 1 : (x: number) => x * x + x
  if (mode.value === 'derivative' && showDerivative.value)
    return derivativeCases[derivativeIndex.value]!.derivative
  if (mode.value === 'intersections') return () => height.value
  return null
})
// 路径在参数变化时才重新计算，避免任何动画或持续监听开销。
const curves = computed(() => [
  ...(secondaryFunction.value
    ? [{ d: pathFor(secondaryFunction.value), kind: 'reference-curve' }]
    : []),
  { d: pathFor(mainFunction.value), kind: 'main-curve' },
])
// 基本函数的渐近线明确标示，正切分支由采样断笔而非虚线连接。
const asymptotes = computed(() => {
  if (mode.value !== 'common') return []
  if (familyIndex.value === 5) return ['M' + gx(-4) + ' ' + gy(0) + 'H' + gx(4)]
  if (familyIndex.value === 6) return ['M' + gx(0) + ' ' + gy(-4) + 'V' + gy(4)]
  if (familyIndex.value === 9)
    return [-Math.PI / 2, Math.PI / 2].map((x) => 'M' + gx(x) + ' ' + gy(-4) + 'V' + gy(4))
  return []
})
// 标出顶点、根或交点等关键点，点的坐标由当前参数准确计算。
const points = computed<Point[]>(() => {
  if (mode.value === 'transform') return [transforms[transformIndex.value]!.point]
  if (mode.value === 'line')
    return [{ x: 0, y: intercept.value, label: '(0,' + intercept.value + ')' }]
  if (mode.value === 'quadratic')
    return [
      { x: -quadB.value, y: quadC.value, label: '顶点(' + -quadB.value + ',' + quadC.value + ')' },
    ]
  if (mode.value === 'derivative') return derivativeCases[derivativeIndex.value]!.points
  if (mode.value === 'roots') return rootCases[rootIndex.value]!.points
  if (mode.value === 'intersections') {
    if (height.value < 0) return []
    if (height.value === 0) return [{ x: 0, y: 0, label: '一个交点' }]
    const root = Math.sqrt(height.value)
    return [
      { x: -root, y: height.value, label: '(' + -root + ',' + height.value + ')' },
      { x: root, y: height.value, label: '(' + root + ',' + height.value + ')' },
    ]
  }
  if (familyIndex.value === 5 || familyIndex.value === 8) return [{ x: 0, y: 1, label: '(0,1)' }]
  if (familyIndex.value === 6) return [{ x: 1, y: 0, label: '(1,0)' }]
  return [{ x: 0, y: 0, label: '(0,0)' }]
})
// 数学式交给共享 LatexText 渲染，不在图解中实现另一套公式系统。
const formula = computed(() => {
  if (mode.value === 'common') return families[familyIndex.value]!.formula
  if (mode.value === 'transform')
    return (
      (transformIndex.value === 8 ? '' : '$f(x)=x^2+x$；') +
      transforms[transformIndex.value]!.formula
    )
  if (mode.value === 'line')
    return '$y=' + slope.value + 'x' + (intercept.value >= 0 ? '+' : '') + intercept.value + '$'
  if (mode.value === 'quadratic')
    return (
      '$y=' +
      quadA.value +
      '(x' +
      (quadB.value >= 0 ? '+' : '') +
      quadB.value +
      ')^2' +
      (quadC.value >= 0 ? '+' : '') +
      quadC.value +
      '$'
    )
  if (mode.value === 'derivative') return derivativeCases[derivativeIndex.value]!.formula
  if (mode.value === 'roots') return rootCases[rootIndex.value]!.formula
  return '$y=x^2$ 与 $y=' + height.value + '$'
})
// 对照的文字结论覆盖参数为零、重根和无交点等边界状态。
const conclusion = computed(() => {
  if (mode.value === 'common') return families[familyIndex.value]!.note
  if (mode.value === 'transform') return transforms[transformIndex.value]!.note
  if (mode.value === 'line')
    return (
      '纵截距为' +
      intercept.value +
      '；' +
      (slope.value === 0
        ? 'm=0，是水平线。'
        : '向右走1，高度变化' +
          slope.value +
          '；x截距为' +
          format(-intercept.value / slope.value) +
          '。')
    )
  if (mode.value === 'quadratic')
    return (
      '对称轴x=' +
      -quadB.value +
      '，顶点高度' +
      quadC.value +
      '是' +
      (quadA.value > 0 ? '最小值' : '最大值') +
      '。y截距为' +
      format(quadA.value * quadB.value ** 2 + quadC.value) +
      '，未必等于顶点高度。'
    )
  if (mode.value === 'derivative') return derivativeCases[derivativeIndex.value]!.note
  if (mode.value === 'roots') return rootCases[rootIndex.value]!.note
  if (height.value < 0) return 'x²不可能为负：没有实交点。'
  if (height.value === 0) return 'x²=0只有一个不同实根x=0，直线在顶点与抛物线相切。'
  return (
    'x²=' + height.value + '，两个不同实根为±' + Math.sqrt(height.value) + '；每个根对应一个交点。'
  )
})
// 观察问题把图解结果连接到实际做题方法。
const prompt = computed(
  () =>
    ({
      common: '先遮住公式，仅凭定义域、关键点和端部行为，你能认出这条曲线吗？',
      transform: '先看公式中改的是输入还是输出，再检查标出的点是否去了正确位置。',
      line: '固定c时所有线经过同一点；固定m时，改变c得到平行线。',
      quadratic: '令括号为0就找到对称轴；令x为0才找到y截距。',
      derivative: '看虚线在x轴上方还是下方，能否预测蓝线在哪些区间上升或下降？',
      roots: '“次数”“根的重数”“不同实根数”是三件事；看清题目实际在问哪一个。',
      intersections: '联立后先找横坐标，再代回求纵坐标；相切时重根只算一个不同点。',
    })[mode.value] ?? '',
)
// 图例区分用于比较的图像，避免把导函数误当原函数。
const mainLegend = computed(() =>
  mode.value === 'transform' && transformIndex.value === 8
    ? 'f(g(x))'
    : mode.value === 'transform'
      ? '变换后'
      : '当前函数',
)
const secondaryLegend = computed(() =>
  mode.value === 'transform'
    ? transformIndex.value === 8
      ? 'g(f(x))'
      : '原函数'
    : mode.value === 'derivative' && showDerivative.value
      ? '导函数'
      : mode.value === 'intersections'
        ? '水平线'
        : '',
)
// 非视觉读者能通过当前公式与结论理解操作后的图像变化。
const graphLabel = computed(() => heading.value + '。' + conclusion.value)
</script>

<style scoped lang="scss">
.math2-graphs {
  margin: 0;
  padding: 22px;
  min-width: 0;
  color: #254451;
  background: linear-gradient(145deg, #f2faf9, #fbfdfd);
  border: 1px solid #bfe2dd;
  border-radius: 14px;
  figcaption > span {
    color: #007e82;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
  }
  h5 {
    margin: 12px 0 8px;
    color: #112f3b;
    font-size: 20px;
    line-height: 1.45;
  }
  p {
    margin: 8px 0 14px;
    font-size: 14px;
    line-height: 1.75;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin: 10px 0;
  }
  .controls :deep(.el-button + .el-button) {
    margin-left: 0;
  }
  // 图像探索沿用已有章节的蓝色交互层级，选中状态与曲线颜色保持一致。
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
  .control-label {
    min-width: 60px;
    color: #577179;
    font-size: 13px;
  }
  .formula {
    margin: 16px 0 0;
    color: #17394a;
  }
  svg {
    display: block;
    width: 100%;
    max-width: 470px;
    max-height: 380px;
    margin: 0 auto;
    overflow: visible;
  }
  svg text {
    fill: #607881;
    font-size: 11px;
    font-family: inherit;
  }
  .grid {
    stroke: #e0ebe9;
    stroke-width: 1;
  }
  .axis {
    stroke: #92a9af;
    stroke-width: 1.2;
    fill: none;
  }
  .asymptote {
    stroke: #b98731;
    stroke-width: 1.5;
    stroke-dasharray: 4 5;
    fill: none;
  }
  .main-curve {
    stroke: #2855cf;
    stroke-width: 2.8;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }
  .reference-curve {
    stroke: #25988f;
    stroke-width: 2;
    stroke-dasharray: 6 5;
    fill: none;
  }
  .point {
    fill: #007b77;
    stroke: white;
    stroke-width: 1.5;
  }
  svg .point-label {
    fill: #006d68;
    font-size: 11px;
    font-weight: 600;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 20px;
    font-size: 12px;
    margin-top: -10px;
  }
  .blue {
    color: #2855cf;
  }
  .teal {
    color: #138b82;
  }
  .result {
    padding: 14px 16px;
    border-left: 3px solid #168b84;
    background: #e5f4f1;
    border-radius: 0 8px 8px 0;
    line-height: 1.8;
    font-size: 14px;
  }
  .prompt {
    color: #59747c;
    margin: 12px 0 0;
    font-size: 13px;
  }
}
@media (max-width: 600px) {
  .math2-graphs {
    padding: 14px;
    h5 {
      font-size: 18px;
    }
    .controls {
      gap: 6px;
    }
    svg text {
      font-size: 17px;
    }
    svg .point-label {
      font-size: 14px;
    }
    .result {
      padding: 10px;
    }
  }
}
</style>
