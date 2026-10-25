<!-- 数学2微分互动图解：在学习平台连接切线斜率、幂函数求导及驻点分类。 -->
<template>
  <figure class="math2-differentiation" :aria-label="heading">
    <figcaption>
      <span>MATHEMATICS 2 · DIFFERENTIATION</span>
      <h5>{{ heading }}</h5>
      <p>{{ introduction }}</p>
    </figcaption>

    <template v-if="mode === 'powers'">
      <div class="controls" role="group" aria-label="选择幂函数求导模型">
        <AppButton
          v-for="(item, index) in powerCases"
          :key="item.label"
          size="small"
          :type="powerIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="powerIndex === index"
          @click="powerIndex = index"
          >{{ item.label }}</AppButton
        >
      </div>
      <ol class="reasoning">
        <li><span>先化成幂</span><LatexText :text="powerCase.original" /></li>
        <li><span>一次求导</span><LatexText :text="powerCase.first" /></li>
        <li><span>再求一次</span><LatexText :text="powerCase.second" /></li>
      </ol>
      <p class="rule">
        <LatexText
          :text="
            String.raw`$\dfrac{d}{dx}x^n=nx^{n-1}$：指数先乘到前面，再减1；系数照留，常数导数为0。`
          "
        />
      </p>
      <div class="controls" role="group" aria-label="代入横坐标检查定义域和导数">
        <AppButton
          v-for="value in [0, 1, 4]"
          :key="value"
          size="small"
          :type="powerX === value ? 'primary' : 'secondary'"
          :aria-pressed="powerX === value"
          @click="powerX = value"
          >x = {{ value }}</AppButton
        >
      </div>
      <p class="result" aria-live="polite"><LatexText :text="powerValue" /></p>
      <p><LatexText :text="powerCase.domain" /></p>
    </template>

    <template v-else>
      <div v-if="mode === 'meaning'" class="controls" role="group" aria-label="选择导数的解释">
        <AppButton
          size="small"
          :type="!motion ? 'primary' : 'secondary'"
          :aria-pressed="!motion"
          @click="selectMeaning(false)"
          >曲线斜率</AppButton
        >
        <AppButton
          size="small"
          :type="motion ? 'primary' : 'secondary'"
          :aria-pressed="motion"
          @click="selectMeaning(true)"
          >位移与速度</AppButton
        >
      </div>
      <div v-else class="controls" role="group" aria-label="比较驻点处的导数符号">
        <AppButton
          v-for="(item, index) in applications"
          :key="item.label"
          size="small"
          :type="applicationIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="applicationIndex === index"
          @click="selectApplication(index)"
          >{{ item.label }}</AppButton
        >
      </div>
      <p class="formula"><LatexText :text="curveFormula" /></p>
      <div class="controls" role="group" aria-label="移动切点">
        <AppButton
          v-for="value in positions"
          :key="value"
          size="small"
          :type="position === value ? 'primary' : 'secondary'"
          :aria-pressed="position === value"
          @click="position = value"
          >{{ isMotion ? 't' : 'x' }} = {{ value }}</AppButton
        >
        <AppButton
          v-if="mode === 'application'"
          size="small"
          type="secondary"
          :aria-pressed="showNormal"
          @click="showNormal = !showNormal"
          >{{ showNormal ? '隐藏法线' : '显示法线' }}</AppButton
        >
      </div>
      <svg
        :viewBox="mode === 'application' ? '100 0 350 350' : '0 0 560 350'"
        role="img"
        :aria-label="graphLabel"
      >
        <title>{{ graphLabel }}</title>
        <g v-for="value in plot.yTicks" :key="`y${value}`">
          <path :d="`M${gx(plot.xmin)} ${gy(value)}H${gx(plot.xmax)}`" class="grid" />
          <text :x="gx(0) - 11" :y="gy(value) + 7" text-anchor="end">{{ value }}</text>
        </g>
        <path
          :d="`M${gx(plot.xmin) - 10} ${gy(0)}H${gx(plot.xmax) + 13}M${gx(0)} 310V18`"
          class="axis"
        />
        <g v-for="value in plot.xTicks" :key="`x${value}`">
          <path :d="`M${gx(value)} ${gy(0) - 4}V${gy(0) + 4}`" class="axis" />
          <text :x="gx(value)" :y="gy(0) + 27" text-anchor="middle">{{ value }}</text>
        </g>
        <text :x="gx(0) - 10" :y="gy(0) + 26" text-anchor="end">0</text>
        <text :x="gx(plot.xmax) + 18" :y="gy(0) + 7">{{ isMotion ? 't / s' : 'x' }}</text>
        <text :x="gx(0) + 12" y="20">{{ isMotion ? 's / m' : 'y' }}</text>
        <path :d="curvePath" class="curve" />
        <path :d="tangentPath" class="tangent" />
        <path v-if="mode === 'application' && showNormal" :d="normalPath" class="normal" />
        <circle
          v-for="value in stationaryPoints"
          :key="value"
          :cx="gx(value)"
          :cy="gy(curve(value))"
          r="5"
          class="stationary"
        />
        <circle :cx="gx(position)" :cy="gy(pointY)" r="6" class="point" />
      </svg>
      <div class="legend">
        <span class="curve-key">原函数</span><span class="tangent-key">切线</span
        ><span v-if="mode === 'application' && showNormal" class="normal-key">法线</span>
      </div>
      <p class="result" aria-live="polite"><LatexText :text="pointConclusion" /></p>
      <template v-if="mode === 'application'">
        <p v-if="showNormal"><LatexText :text="normalConclusion" /></p>
        <div class="sign-flow" aria-label="导数符号与函数变化方向">
          <span v-for="item in application.signs" :key="item">{{ item }}</span>
        </div>
        <p><LatexText :text="application.conclusion" /></p>
      </template>
      <p v-else-if="isMotion">
        <LatexText
          :text="
            String.raw`$s(t)=t^2$，$v(t)=s'(t)=2t$，$a(t)=s''(t)=2$。这里的斜率表示瞬时速度，二阶导表示速度的变化率。`
          "
        />
      </p>
      <p v-else>
        <LatexText
          :text="
            String.raw`$f'(x)$是斜率函数，$f'(x_0)$是某一点的斜率。切线经过$(x_0,f(x_0))$，不是经过$(x_0,f'(x_0))$。`
          "
        />
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'

const props = defineProps<{ topic: string }>()
// 叶子编号决定教学模型，父组件以topic为键，切知识点时不残留旧参数。
const mode = computed(() =>
  props.topic === '120602' ? 'powers' : props.topic === '120603' ? 'application' : 'meaning',
)
// 图解标题强调操作后的观察任务，而不重复正文标题。
const heading = computed(
  () =>
    ({
      meaning: '移动切点，看斜率怎样变化',
      powers: '先写成幂，再让指数乘前减一',
      application: '先看导数变号，再判断极值',
    })[mode.value],
)
// 提示明确每个模型可操作的内容与判断目标。
const introduction = computed(
  () =>
    ({
      meaning: '同一条曲线，在不同位置有不同切线；换成位移图，就能读出速度。',
      powers: '比较整数、负数与分数指数；代入0，检查原函数和导数是否存在。',
      application: '比较三个多项式的驻点；显示法线，检查水平切线时会发生什么。',
    })[mode.value],
)
const motion = ref(false)
const position = ref(1)
const applicationIndex = ref(0)
const showNormal = ref(false)
// 切换斜率与运动情境时回到合法观察点，避免负横坐标残留为负时间。
function selectMeaning(useMotion: boolean) {
  motion.value = useMotion
  position.value = 1
}
// 切换多项式时统一从原点开始，便于比较三类驻点行为。
function selectApplication(index: number) {
  applicationIndex.value = index
  position.value = 0
}
// 运动情境只在导数意义页生效，应用页沿用普通坐标。
const isMotion = computed(() => mode.value === 'meaning' && motion.value)
const applications = [
  {
    label: '两个极值',
    formula: String.raw`$f(x)=x^3-3x$，$f'(x)=3x^2-3$，$f''(x)=6x$。`,
    signs: ['x < −1：＋ ↗', '−1 < x < 1：− ↘', 'x > 1：＋ ↗'],
    conclusion:
      '$x=-1$处导数由正变负，是极大值点；$x=1$处由负变正，是极小值点。驻点坐标分别为$(-1,2)$、$(1,-2)$。',
  },
  {
    label: '零斜率但无极值',
    formula: String.raw`$f(x)=x^3$，$f'(x)=3x^2$，$f''(x)=6x$。`,
    signs: ['x < 0：＋ ↗', 'x = 0：0', 'x > 0：＋ ↗'],
    conclusion:
      '$x=0$两侧导数都是正，函数持续增加；水平切线不保证极值。严格递增函数也可能在个别点导数为0。',
  },
  {
    label: '二阶导为零仍有极值',
    formula: String.raw`$f(x)=x^4$，$f'(x)=4x^3$，$f''(x)=12x^2$。`,
    signs: ['x < 0：− ↘', 'x = 0：0', 'x > 0：＋ ↗'],
    conclusion:
      "$f'(0)=f''(0)=0$，但导数由负变正，所以$(0,0)$仍是极小值点。二阶导为0时，改看一阶导两侧符号。",
  },
]
// 方程、符号表与结论共同使用同一个多项式预设。
const application = computed(() => applications[applicationIndex.value]!)
// 所有允许的切点都落在当前视窗中，运动模型避免负时间。
const positions = computed(() =>
  isMotion.value ? [0, 1, 2, 3] : mode.value === 'application' ? [-1, 0, 1] : [-2, -1, 0, 1, 2],
)
// 曲线及直线使用同一数值坐标，确保显示斜率不是像素比例。
const plot = computed(() =>
  isMotion.value
    ? { xmin: -0.15, xmax: 3.3, ymin: -0.5, ymax: 10, xTicks: [1, 2, 3], yTicks: [2, 6, 10] }
    : mode.value === 'meaning'
      ? { xmin: -2.3, xmax: 2.3, ymin: -1, ymax: 5, xTicks: [-2, -1, 1, 2], yTicks: [2, 4] }
      : { xmin: -2.5, xmax: 2.5, ymin: -2.5, ymax: 2.5, xTicks: [-2, -1, 1, 2], yTicks: [-2, 2] },
)
function gx(x: number) {
  // 应用页使用与纵轴相同的54px/单位，使切线与法线在屏幕上也相互垂直。
  return mode.value === 'application'
    ? 140 + ((x - plot.value.xmin) / (plot.value.xmax - plot.value.xmin)) * 270
    : 55 + ((x - plot.value.xmin) / (plot.value.xmax - plot.value.xmin)) * 440
}
function gy(y: number) {
  return 300 - ((y - plot.value.ymin) / (plot.value.ymax - plot.value.ymin)) * 270
}
// 三种应用模型保留不同的驻点行为，不能只用一张示意曲线替代。
function curve(x: number) {
  return mode.value !== 'application'
    ? x * x
    : applicationIndex.value === 0
      ? x ** 3 - 3 * x
      : applicationIndex.value === 1
        ? x ** 3
        : x ** 4
}
// 解析导数用于切线和法线，避免用像素差分产生近似误导。
function derivative(x: number) {
  return mode.value !== 'application'
    ? 2 * x
    : applicationIndex.value === 0
      ? 3 * x * x - 3
      : applicationIndex.value === 1
        ? 3 * x * x
        : 4 * x ** 3
}
// 只在坐标窗内连线，越界后重新开始，避免把截断点跨窗连接。
const curvePath = computed(() => {
  let path = '',
    visible = false
  const min = isMotion.value ? 0 : plot.value.xmin
  for (let i = 0; i <= 400; i++) {
    const x = min + ((plot.value.xmax - min) * i) / 400,
      y = curve(x)
    const inside = y >= plot.value.ymin && y <= plot.value.ymax
    if (inside) path += `${visible ? 'L' : 'M'}${gx(x).toFixed(2)} ${gy(y).toFixed(2)}`
    visible = inside
  }
  return path
})
// 直线与可见坐标窗求交，避免陡切线或法线越出图解。
function linePath(slope: number, intercept: number) {
  const p = plot.value
  const points = [
    [p.xmin, slope * p.xmin + intercept],
    [p.xmax, slope * p.xmax + intercept],
  ]
  if (slope !== 0)
    points.push([(p.ymin - intercept) / slope, p.ymin], [(p.ymax - intercept) / slope, p.ymax])
  const inside = points
    .filter(
      ([x, y]) =>
        x! >= p.xmin - 1e-9 && x! <= p.xmax + 1e-9 && y! >= p.ymin - 1e-9 && y! <= p.ymax + 1e-9,
    )
    .filter(
      (point, i, all) =>
        all.findIndex(
          (other) =>
            Math.abs(other[0]! - point[0]!) < 1e-8 && Math.abs(other[1]! - point[1]!) < 1e-8,
        ) === i,
    )
  return inside.length < 2
    ? ''
    : `M${gx(inside[0]![0]!)} ${gy(inside[0]![1]!)}L${gx(inside[1]![0]!)} ${gy(inside[1]![1]!)}`
}
// 切点坐标、线与说明共同取值，避免移动后文字仍显示上一点。
const pointY = computed(() => curve(position.value))
const slope = computed(() => derivative(position.value))
const tangentPath = computed(() =>
  linePath(slope.value, pointY.value - slope.value * position.value),
)
// 水平切线的法线是竖线，不代入负倒数以免产生无穷值。
const normalPath = computed(() =>
  slope.value === 0
    ? `M${gx(position.value)} 30V300`
    : linePath(-1 / slope.value, pointY.value + position.value / slope.value),
)
// 应用页显示驻点，意义页只突出移动的切点。
const stationaryPoints = computed(() =>
  mode.value === 'application' ? (applicationIndex.value === 0 ? [-1, 1] : [0]) : [],
)
// 运动单位单独说明，不把位移图误标成普通函数坐标。
const curveFormula = computed(() =>
  mode.value === 'application'
    ? application.value.formula
    : isMotion.value
      ? String.raw`$s(t)=t^2\,\mathrm{m}$（t以秒计），$v(t)=2t\,\mathrm{m\,s^{-1}}$。`
      : String.raw`$f(x)=x^2$，$f'(x)=2x$，$f''(x)=2$。`,
)
// 坐标与斜率的完整读数帮助区分函数值和导数值。
const pointConclusion = computed(() =>
  isMotion.value
    ? String.raw`$t=${position.value}\,\mathrm{s}$时，位移为$${pointY.value}\,\mathrm{m}$，瞬时速度为$${slope.value}\,\mathrm{m\,s^{-1}}$；加速度恒为$2\,\mathrm{m\,s^{-2}}$。`
    : `$P=(${position.value},${pointY.value})$，$f'(${position.value})=${slope.value}$。切线：$y-(${pointY.value})=${slope.value}[x-(${position.value})]$。`,
)
// 法线方程保留精确倒数，零斜率时直接使用竖线方程。
const normalConclusion = computed(() =>
  slope.value === 0
    ? `$m_{\\text{切}}=0$，法线竖直：$x=${position.value}$；不能写成斜率为0的法线。`
    : String.raw`法线斜率为$-1/(${slope.value})$，方程为$y-(${pointY.value})=\frac{-1}{${slope.value}}[x-(${position.value})]$。`,
)
// 屏幕阅读器得到数值与线的含义，不依赖颜色识别。
const graphLabel = computed(
  () =>
    `${isMotion.value ? '位移与时间图' : '函数与切线图'}，当前点(${position.value},${pointY.value})，切线斜率${slope.value}${showNormal.value && mode.value === 'application' ? '，另显示法线' : ''}`,
)

const powerIndex = ref(0)
const powerX = ref(1)
const powerCases = [
  {
    label: '整数幂',
    original: '$f(x)=x^3$',
    first: String.raw`$f'(x)=3x^2$`,
    second: String.raw`$f''(x)=6x$`,
    domain: '原函数、一阶导数与二阶导数均对所有实数x有定义。',
    values: [
      "$f(0)=0$，$f'(0)=0$，$f''(0)=0$。",
      "$f(1)=1$，$f'(1)=3$，$f''(1)=6$。",
      "$f(4)=64$，$f'(4)=48$，$f''(4)=24$。",
    ],
  },
  {
    label: '负指数',
    original: String.raw`$f(x)=\dfrac1{x^2}=x^{-2}$`,
    first: String.raw`$f'(x)=-2x^{-3}=-\dfrac2{x^3}$`,
    second: String.raw`$f''(x)=6x^{-4}=\dfrac6{x^4}$`,
    domain: '$x=0$时原函数无定义，不能在这里求导；其余实数均可。',
    values: [
      '$x=0$：分母为0，原函数和导数均无定义。',
      "$f(1)=1$，$f'(1)=-2$，$f''(1)=6$。",
      String.raw`$f(4)=\frac1{16}$，$f'(4)=-\frac1{32}$，$f''(4)=\frac3{128}$。`,
    ],
  },
  {
    label: '分数指数',
    original: String.raw`$f(x)=\sqrt{x}=x^{1/2}$`,
    first: String.raw`$f'(x)=\dfrac12x^{-1/2}=\dfrac1{2\sqrt{x}}$`,
    second: String.raw`$f''(x)=-\dfrac14x^{-3/2}$`,
    domain: String.raw`$f$在$x\ge0$有定义，所列有限导数只对$x>0$适用。`,
    values: [
      '$f(0)=0$，但0处不存在有限导数；不能把负指数公式代入0。',
      String.raw`$f(1)=1$，$f'(1)=\frac12$，$f''(1)=-\frac14$。`,
      String.raw`$f(4)=2$，$f'(4)=\frac14$，$f''(4)=-\frac1{32}$。`,
    ],
  },
  {
    label: '先拆分再求导',
    original: String.raw`$f(x)=\dfrac{x^2+1}{\sqrt{x}}=x^{3/2}+x^{-1/2}$`,
    first: String.raw`$f'(x)=\dfrac32x^{1/2}-\dfrac12x^{-3/2}$`,
    second: String.raw`$f''(x)=\dfrac34x^{-1/2}+\dfrac34x^{-5/2}$`,
    domain: '$x>0$；先逐项除以根号x，不需要商法则。',
    values: [
      '$x=0$：原分母为0，原函数及导数无定义。',
      String.raw`$f(1)=2$，$f'(1)=1$，$f''(1)=\frac32$。`,
      String.raw`$f(4)=\frac{17}{2}$，$f'(4)=\frac{47}{16}$，$f''(4)=\frac{51}{128}$。`,
    ],
  },
]
// 选中的例子同时决定改写、两阶求导与定义域，不额外添加规则外的求导公式。
const powerCase = computed(() => powerCases[powerIndex.value]!)
// 零值检查单独列出，确保不会用Infinity或NaN充当数学结论。
const powerValue = computed(() => powerCase.value.values[[0, 1, 4].indexOf(powerX.value)]!)
</script>

<style scoped>
.math2-differentiation {
  margin: 0;
  padding: 20px;
  border: 1px solid #d0e0ed;
  border-radius: 14px;
  background: linear-gradient(120deg, #f0f7ff, #f4fbfa);
  color: #193c58;
  min-width: 0;
}
figcaption > span {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #256b8c;
}
h5 {
  font-size: 21px;
  font-weight: 700;
  margin: 12px 0;
}
p {
  font-size: 14px;
  line-height: 1.8;
  margin: 10px 0;
  overflow-wrap: anywhere;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
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
svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 340px;
  margin: 12px 0 4px;
}
svg text {
  font-size: 20px;
  font-family: inherit;
  fill: #193c58;
}
.curve {
  fill: none;
  stroke: #286aba;
  stroke-width: 3;
}
.axis {
  fill: none;
  stroke: #829caf;
  stroke-width: 1.5;
}
.grid {
  fill: none;
  stroke: #dce7ed;
  stroke-width: 1;
}
.tangent {
  fill: none;
  stroke: #138679;
  stroke-width: 2.5;
}
.normal {
  fill: none;
  stroke: #ad7725;
  stroke-width: 2;
  stroke-dasharray: 6 4;
}
.point {
  fill: #138679;
  stroke: white;
  stroke-width: 2;
}
.stationary {
  fill: #fff;
  stroke: #286aba;
  stroke-width: 2;
}
.formula {
  padding: 10px 14px;
  border-radius: 8px;
  background: #fff;
}
.result {
  border-left: 3px solid #2679a2;
  padding: 12px 14px;
  background: #e7f1fa;
}
.rule {
  padding: 12px 0;
  border-block: 1px solid #d0e0ed;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  font-size: 12px;
}
.legend span::before {
  display: inline-block;
  content: '';
  width: 22px;
  border-top: 3px solid;
  margin-right: 5px;
  vertical-align: middle;
}
.curve-key {
  color: #286aba;
}
.tangent-key {
  color: #138679;
}
.normal-key {
  color: #ad7725;
}
.normal-key::before {
  border-top-style: dashed !important;
}
.sign-flow {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 14px;
  margin: 15px 0;
  padding: 12px 0;
  border-block: 1px solid #d0e0ed;
}
.sign-flow span {
  color: #2167a6;
}
.reasoning {
  padding: 0;
  margin: 16px 0;
  list-style: none;
}
.reasoning li {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 12px;
  align-items: baseline;
  padding: 12px 0;
  border-bottom: 1px solid #dce7ed;
  line-height: 1.9;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.reasoning li > span:first-child {
  color: #2167a6;
  font-weight: 600;
}
@media (max-width: 600px) {
  .math2-differentiation {
    padding: 12px;
  }
  h5 {
    font-size: 18px;
  }
  .controls {
    gap: 6px;
  }
  .reasoning li {
    grid-template-columns: minmax(0, 1fr);
    gap: 3px;
  }
  svg text {
    font-size: 22px;
  }
}
</style>
