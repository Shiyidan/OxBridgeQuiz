<!-- 数学2指数与对数互动图解：在知识讲解中连接函数图像、指数运算与方程的正根筛选。 -->
<template>
  <figure class="math2-exponentials" :aria-label="heading">
    <figcaption>
      <span>MATHEMATICS 2 · EXPONENTIALS &amp; LOGARITHMS</span>
      <h5>{{ heading }}</h5>
      <p>{{ introduction }}</p>
    </figcaption>

    <template v-if="mode === 'graph'">
      <div class="controls" role="group" aria-label="选择指数函数的底数">
        <AppButton
          v-for="item in bases"
          :key="item.value"
          size="small"
          :type="base === item.value ? 'primary' : 'secondary'"
          :aria-pressed="base === item.value"
          @click="base = item.value"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="移动指数函数上的观察点">
        <AppButton
          v-for="value in [-2, -1, 0, 1, 2]"
          :key="value"
          size="small"
          :type="pointX === value ? 'primary' : 'secondary'"
          :aria-pressed="pointX === value"
          @click="pointX = value"
          >x = {{ value }}</AppButton
        >
      </div>
      <p class="formula"><LatexText :text="pointFormula" /></p>
      <svg viewBox="0 0 540 340" role="img" :aria-label="graphAccessibleLabel">
        <title>底数变化不改变纵轴交点；横坐标每增加1，纵坐标乘以底数</title>
        <g v-for="value in [1, 4, 8]" :key="value">
          <path :d="`M55 ${graphY(value)}H485`" class="grid" />
          <text :x="graphX(0) - 13" :y="graphY(value) + 7" text-anchor="end">{{ value }}</text>
        </g>
        <path d="M45 285H500M270 295V20" class="axis" />
        <path v-if="base !== 1" d="M55 285H485" class="asymptote" />
        <g v-for="value in [-3, -2, -1, 1, 2, 3]" :key="value">
          <path :d="`M${graphX(value)} 281V289`" class="axis" />
          <text :x="graphX(value)" y="315" text-anchor="middle">{{ value }}</text>
        </g>
        <text x="255" y="315">0</text>
        <text x="506" y="292">x</text>
        <text x="282" y="25">y</text>
        <path :d="graphPath" class="curve" />
        <circle :cx="graphX(0)" :cy="graphY(1)" r="5" class="fixed-point" />
        <path :d="`M${graphX(pointX)} 285V${graphY(pointValue)}H270`" class="projection" />
        <circle :cx="graphX(pointX)" :cy="graphY(pointValue)" r="6" class="point" />
      </svg>
      <p class="result" aria-live="polite"><LatexText :text="graphConclusion" /></p>
      <p v-if="base !== 1">始终在横轴上方，经过 (0, 1)；虚线 y = 0 是渐近线，曲线不会碰到它。</p>
      <p v-else>这是常函数 y = 1，值域只有 {1}，y = 0 不是它的渐近线；1 不能作为对数的底。</p>
    </template>

    <template v-else-if="mode === 'laws'">
      <div class="controls" role="group" aria-label="选择对数底数">
        <AppButton
          v-for="value in [2, 3]"
          :key="value"
          size="small"
          :type="logBase === value ? 'primary' : 'secondary'"
          :aria-pressed="logBase === value"
          @click="logBase = value"
          >底数 {{ value }}</AppButton
        >
        <AppButton
          size="small"
          type="secondary"
          :aria-pressed="negativeExponent"
          @click="negativeExponent = !negativeExponent"
          >{{ negativeExponent ? 'm = −1：真数为分数' : 'm = 2：真数为整数' }}</AppButton
        >
      </div>
      <div class="identity-bridge" aria-label="同一个数的指数与对数写法">
        <LatexText :text="exponentialStatement" /><span class="bridge-arrow" aria-hidden="true"
          >⇔</span
        >
        <LatexText :text="logarithmStatement" />
      </div>
      <p>对数问的是“几次方”。把真数写成同底幂，指数的运算就是对数律。</p>
      <div class="controls" role="group" aria-label="选择对数运算法则">
        <AppButton
          v-for="item in lawOptions"
          :key="item.id"
          size="small"
          :type="law === item.id ? 'primary' : 'secondary'"
          :aria-pressed="law === item.id"
          @click="law = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <ol class="reasoning">
        <li><span>先写指数</span><LatexText :text="lawExponent" /></li>
        <li><span>再读对数</span><LatexText :text="lawLogarithm" /></li>
      </ol>
      <p class="result" aria-live="polite"><LatexText :text="lawConclusion" /></p>
      <p>使用条件：同一底数 a &gt; 0 且 a ≠ 1，各个真数都大于0。真数相加，没有对应的拆分法则。</p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="选择指数方程的解法">
        <AppButton
          v-for="(item, index) in equationCases"
          :key="item.label"
          size="small"
          :type="equationIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="equationIndex === index"
          @click="equationIndex = index"
          >{{ item.label }}</AppButton
        >
      </div>
      <p class="formula"><LatexText :text="equation.formula" /></p>
      <ol class="reasoning">
        <li v-for="(step, index) in equation.steps" :key="index">
          <span>{{ ['看结构', '解代数式', '还原并检查'][index] }}</span
          ><LatexText :text="step" />
        </li>
      </ol>
      <template v-if="equationIndex !== 0">
        <svg viewBox="0 0 540 140" role="img" :aria-label="equation.rootDescription">
          <title>代换量t必须大于0，负根和零根均不能还原成实数x</title>
          <path d="M50 65H490" class="axis" />
          <path d="M296 65H483L475 59M483 65L475 71" class="positive-ray" />
          <circle :cx="rootX(0)" cy="65" r="5" class="open-point" />
          <text :x="rootX(0)" y="101" text-anchor="middle">0</text>
          <text x="498" y="72">t</text>
          <g v-for="root in equation.roots" :key="root">
            <circle v-if="root > 0" :cx="rootX(root)" cy="65" r="7" class="point" />
            <path
              v-else
              :d="`M${rootX(root) - 6} 47L${rootX(root) + 6} 59M${rootX(root) + 6} 47L${rootX(root) - 6} 59`"
              class="rejected"
            />
            <text :x="rootX(root)" y="31" text-anchor="middle">
              {{ root > 0 ? '保留' : '舍去' }}
            </text>
            <text v-if="root !== 0" :x="rootX(root)" y="101" text-anchor="middle">{{ root }}</text>
          </g>
          <text x="352" y="133" class="positive-label">t &gt; 0</text>
        </svg>
      </template>
      <p class="result" aria-live="polite"><LatexText :text="equation.conclusion" /></p>
      <p>换元只是中间步骤。先筛选 t，再还原 x；最后把 x 代回原方程。</p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'

const props = defineProps<{ topic: string }>()
// 每个考纲叶子对应独立模型；父组件按topic重新挂载，切点时恢复初始参数。
const mode = computed(() =>
  props.topic === '120502' ? 'laws' : props.topic === '120503' ? 'equation' : 'graph',
)
// 标题围绕当前模型的解题动作，避免与正文重复罗列知识名称。
const heading = computed(
  () =>
    ({
      graph: '底数决定方向，指数决定位置',
      laws: '对数就是把“几次方”读出来',
      equation: '把指数换成 t，先过正数这一关',
    })[mode.value],
)
// 模型提示说明可交互的变量，不把观察结论提前堆在图形上方。
const introduction = computed(
  () =>
    ({
      graph: '切换底数，再移动观察点，看增长、衰减与常函数有什么不同。',
      laws: '用同一组幂，比较乘积、商、乘方和不能拆分的加法。',
      equation: '比较同底与换元解法；代数根不一定都能还原成指数。',
    })[mode.value],
)
const bases = [
  { value: 2, label: 'a = 2' },
  { value: 0.5, label: 'a = 1/2' },
  { value: 1, label: 'a = 1' },
]
const base = ref(2)
const pointX = ref(1)
// 所有图形坐标共享固定刻度，切换底数时能直接比较变化方向。
function graphX(x: number) {
  return 270 + x * (215 / 3)
}
function graphY(y: number) {
  return 285 - y * 30
}
// 取样范围内最大值为8，无裁剪截断或负值伪影。
const graphPath = computed(() =>
  Array.from({ length: 241 }, (_, i) => {
    const x = -3 + i / 40
    return `${i ? 'L' : 'M'}${graphX(x).toFixed(2)} ${graphY(base.value ** x).toFixed(2)}`
  }).join(''),
)
// 坐标点、引导线和读数均使用相同指数值。
const pointValue = computed(() => base.value ** pointX.value)
// 有限整指数保留整数或分数，不以近似小数代替精确值。
function powerText(a: number, exponent: number) {
  if (a === 1) return '1'
  if (exponent >= 0) return String(a ** exponent)
  return String.raw`\frac{1}{${a ** -exponent}}`
}
// 分数底数先翻转指数，以便结果保持精确分数。
const pointFormula = computed(() => {
  const expression = base.value === 0.5 ? String.raw`\left(\frac12\right)` : String(base.value)
  const result =
    base.value === 0.5 ? powerText(2, -pointX.value) : powerText(base.value, pointX.value)
  return `$y=${expression}^{x}$；$x=${pointX.value}$ 时，$y=${expression}^{${pointX.value}}=${result}$。`
})
// 为读屏提供图像趋势及当前点，不依赖颜色说明底数变化。
const graphAccessibleLabel = computed(
  () =>
    `y等于${base.value}的x次方，当前点横坐标${pointX.value}，纵坐标${pointValue.value}；${base.value === 1 ? '恒等于1' : base.value > 1 ? '从左到右递增' : '从左到右递减'}`,
)
// 对1单独解释，避免误称它有反函数或以横轴为渐近线。
const graphConclusion = computed(() =>
  base.value === 1
    ? '$1^x=1$：不同的x给出同一个值，不能反推出唯一指数。'
    : base.value > 1
      ? '$x$每增加1，$y$乘2；$a>1$时，指数越大，函数值越大。'
      : '$x$每增加1，$y$乘$1/2$；$0<a<1$时，指数越大，函数值反而越小。',
)

const logBase = ref(2)
const negativeExponent = ref(false)
const lawOptions = [
  { id: 'multiply', label: '乘积 → 相加' },
  { id: 'divide', label: '商 → 相减' },
  { id: 'power', label: '乘方 → 系数' },
  { id: 'addition', label: '真数相加？' },
] as const
const law = ref<(typeof lawOptions)[number]['id']>('multiply')
// 负指数模式展示分数真数仍为正，避免把负对数与负真数混淆。
const m = computed(() => (negativeExponent.value ? -1 : 2))
const n = 3
// 数值与等式共享指数来源，切底数后保持所有等式一致。
const exponentialStatement = computed(
  () => `$${logBase.value}^{${m.value}}=${powerText(logBase.value, m.value)}$`,
)
const logarithmStatement = computed(
  () => String.raw`$\log_{${logBase.value}}${powerText(logBase.value, m.value)}=${m.value}$`,
)
// 同底乘、除、幂分别对应指数加、减、乘；加法模式显示对照而不伪造法则。
const lawExponent = computed(() => {
  const a = logBase.value,
    p = m.value
  if (law.value === 'multiply')
    return String.raw`$${a}^{${p}}\times${a}^{${n}}=${a}^{${p}+${n}}=${powerText(a, p + n)}$`
  if (law.value === 'divide')
    return String.raw`$${a}^{${p}}\div${a}^{${n}}=${a}^{${p}-${n}}=${powerText(a, p - n)}$`
  if (law.value === 'power')
    return String.raw`$(${a}^{${p}})^${n}=${a}^{${p}\times${n}}=${powerText(a, p * n)}$`
  return String.raw`$${a}^{${p}}+${a}^{${n}}\ne ${a}^{${p}+${n}}$。左边在相加，右边却等于两项相乘。`
})
// 原始真数显式写成幂；无需换底公式即可读取结果。
const lawLogarithm = computed(() => {
  const a = logBase.value,
    p = m.value
  if (law.value === 'multiply')
    return String.raw`$\log_{${a}}(${a}^{${p}}\times${a}^{${n}})=${p}+${n}=${p + n}$`
  if (law.value === 'divide')
    return String.raw`$\log_{${a}}(${a}^{${p}}\div${a}^{${n}})=${p}-${n}=${p - n}$`
  if (law.value === 'power')
    return String.raw`$\log_{${a}}((${a}^{${p}})^${n})=${n}\times(${p})=${p * n}$`
  return String.raw`$\log_{${a}}(${a}^{${p}}+${a}^{${n}})\ne\log_{${a}}${a}^{${p}}+\log_{${a}}${a}^{${n}}$`
})
// 先观察数值等式，再给可迁移到题目的通用法则。
const lawConclusion = computed(
  () =>
    ({
      multiply: String.raw`$\log_a u+\log_a v=\log_a(uv)$：对数相加，对应真数相乘。`,
      divide: String.raw`$\log_a u-\log_a v=\log_a(u/v)$：对数相减，对应真数相除。`,
      power: String.raw`$\log_a(u^k)=k\log_a u$：真数的指数移作对数前的系数。`,
      addition: String.raw`$\log_a(u+v)$不能拆成两个对数的和。先看括号中的运算，再选法则。`,
    })[law.value],
)

const equationIndex = ref(0)
const equationCases = [
  {
    label: '同底：直接比指数',
    formula: '$2^{x+1}=8$',
    steps: [
      '$8=2^3$，同一个合法底数2的幂相等。',
      '$x+1=3$，所以$x=2$。',
      '$2^{2+1}=8$，满足原方程。',
    ],
    roots: [] as number[],
    rootDescription: '同底幂相等，指数相等',
    conclusion: String.raw`$a>0$且$a\ne1$时，$a^u=a^v\iff u=v$。`,
  },
  {
    label: '换元：舍去负根',
    formula: '$4^x+2^x-6=0$',
    steps: [
      '$4^x=(2^x)^2$。设$t=2^x>0$。',
      '$t^2+t-6=(t+3)(t-2)=0$，$t=-3$或$2$。',
      '$t=-3$舍去；$2^x=2$得$x=1$。代回：$4+2-6=0$。',
    ],
    roots: [-3, 2],
    rootDescription: '代数根负3舍去，正2保留',
    conclusion: '$t=2^x$永远为正：只保留$t=2$，最终答案是$x=1$。',
  },
  {
    label: '换元：零根也要舍去',
    formula: '$3^{2x}-3^x=0$',
    steps: [
      '$3^{2x}=(3^x)^2$。设$t=3^x>0$。',
      '$t^2-t=t(t-1)=0$，$t=0$或$1$。',
      '$t=0$舍去；$3^x=1$得$x=0$。代回：$1-1=0$。',
    ],
    roots: [0, 1],
    rootDescription: '代数根0舍去，正1保留',
    conclusion: '$3^x$可无限接近0，却不会等于0。保留$t=1$，最终答案$x=0$。',
  },
]
// 公式、推导和数轴根使用同一预设，切例时不会保留上一题结果。
const equation = computed(() => equationCases[equationIndex.value]!)
// t轴零点固定，负根和正根按等距刻度显示。
function rootX(t: number) {
  return 290 + 60 * t
}
</script>

<style scoped>
.math2-exponentials {
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
  max-height: 310px;
  margin: 12px 0;
}
svg text {
  font-size: 22px;
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
  stroke-width: 1.6;
}
.grid {
  fill: none;
  stroke: #dce7ed;
  stroke-width: 1;
}
.asymptote {
  stroke: #bf8b2e;
  stroke-width: 2;
  stroke-dasharray: 6 5;
}
.projection {
  fill: none;
  stroke: #138679;
  stroke-width: 1.5;
  stroke-dasharray: 4 4;
}
.point {
  fill: #138679;
  stroke: white;
  stroke-width: 2;
}
.fixed-point {
  fill: #286aba;
}
.open-point {
  fill: #f0f7ff;
  stroke: #138679;
  stroke-width: 2;
}
.positive-ray {
  stroke: #138679;
  stroke-width: 3;
  fill: none;
}
.positive-label {
  fill: #138679;
}
.rejected {
  stroke: #a76428;
  stroke-width: 3;
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
.identity-bridge {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 22px 8px;
  margin-top: 12px;
  border-top: 1px solid #d0e0ed;
  border-bottom: 1px solid #d0e0ed;
  font-size: 19px;
}
.bridge-arrow {
  color: #138679;
  font-size: 26px;
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
  .math2-exponentials {
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
  .identity-bridge {
    gap: 9px;
    font-size: 16px;
  }
}
</style>
