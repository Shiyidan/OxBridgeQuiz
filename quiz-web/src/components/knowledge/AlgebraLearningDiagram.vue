<!-- 数学1代数互动图解：按19个知识点切换符号推演、坐标函数、图像估算与数列，复用公式和按钮组件。 -->
<template>
  <figure class="algebra-atlas">
    <figcaption>
      <span>MATHEMATICS 1 · 代数实验室</span>
      <h5>{{ heading }}</h5>
      <p>{{ invitation }}</p>
    </figcaption>

    <template v-if="topic === '110401' || topic === '110403'">
      <label class="slider-label"
        >代入 x = {{ value }}
        <input v-model.number="value" type="range" min="-3" max="4" step="1" />
      </label>
      <div class="expression-grid">
        <div v-for="item in notationValues" :key="item.formula">
          <LatexText :text="item.formula" />
          <strong>{{ item.value }}</strong>
          <small>{{ item.note }}</small>
        </div>
      </div>
      <div class="insight">
        <LatexText
          :text="
            topic === '110401'
              ? '字母相同不代表结构相同。$3x$ 是乘法，$x^3$ 是乘方；滑动 x，比较结果。'
              : '代入负数先加括号。$x^2$ 与 $-x^2$ 的负号不在同一层；$(-x)^2=x^2$。'
          "
        />
      </div>
    </template>

    <template v-else-if="topic === '110402'">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['原式', '外幂分配', '合并指数']"
          :key="label"
          :type="step === i ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="step === i"
          @click="step = i"
          >{{ label }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="indexStages[step] || indexStages[0]!" /></div>
      <div class="ledger">
        <span>系数 3² → 9</span><span>x：(1/2)×2 → 1</span><span>y：−2×2 → −4</span>
      </div>
      <p class="insight">
        本图取 x &gt; 0、y ≠ 0。括号外的平方对三个因子分别生效；负四次幂移到分母成为正四次幂。
      </p>
    </template>

    <template v-else-if="topic === '110404' || topic === '110405'">
      <div class="controls">
        <AppButton
          :type="step === 0 ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="step === 0"
          @click="step = 0"
          >看面积分块</AppButton
        >
        <AppButton
          :type="step === 1 ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="step === 1"
          @click="step = 1"
          >合并 / 反向分解</AppButton
        >
      </div>
      <svg
        viewBox="0 0 480 260"
        role="img"
        aria-label="边长x加2与x加3的矩形，分为x平方、2x、3x和6四块；正长度示意，不按比例"
      >
        <rect x="70" y="45" width="220" height="130" class="blue-fill" />
        <rect x="290" y="45" width="110" height="130" class="teal-fill" />
        <rect x="70" y="175" width="220" height="50" class="teal-fill" />
        <rect x="290" y="175" width="110" height="50" class="gold-fill" />
        <text x="180" y="116">x²</text>
        <text x="345" y="116">2x</text>
        <text x="180" y="207">3x</text>
        <text x="345" y="207">6</text>
        <text x="180" y="29">x</text>
        <text x="345" y="29">2</text>
        <text x="46" y="116">x</text>
        <text x="46" y="207">3</text>
      </svg>
      <div class="formula-stage">
        <LatexText :text="step === 0 ? '$(x+2)(x+3)=x^2+2x+3x+6$' : '$x^2+5x+6=(x+2)(x+3)$'" />
      </div>
      <p class="insight">
        {{
          topic === '110404'
            ? '展开把整块面积相加，合并同类项得到5x。这里只用正长度解释分配律；一般代数还允许负数。'
            : '因式分解把四块重新拼成矩形：2和3相加为5，相乘为6。负常数题应使用带符号的代数配对，不当作负长度。'
        }}
      </p>
    </template>

    <template v-else-if="topic === '110406'">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['原分式', '拆成因式', '约去公共因式']"
          :key="label"
          :type="step === i ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="step === i"
          @click="step = i"
          >{{ label }}</AppButton
        >
      </div>
      <div class="formula-stage">
        <LatexText :text="fractionStages[step] || fractionStages[0]!" />
      </div>
      <div class="condition">
        <strong>始终保留：x ≠ 2</strong
        ><span>原式在 x = 2 时分母为 0。约掉 (x−2)，不能把这个禁值恢复。</span>
      </div>
      <p class="insight">只有完整的乘法因式可以约去，x²−4中的x不能直接与x−2中的x抵消。</p>
    </template>

    <template v-else-if="topic === '110407'">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['观察外层', '隔离平方', '恢复未知量']"
          :key="label"
          :type="step === i ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="step === i"
          @click="step = i"
          >{{ label }}</AppButton
        >
      </div>
      <ol class="formula-flow">
        <li v-for="(formula, i) in rearrangeStages.slice(0, step + 1)" :key="formula">
          <span>{{ i + 1 }}</span
          ><LatexText :text="formula" />
        </li>
      </ol>
      <p class="insight">
        x先减1，再平方、乘2、加3。逆向依次减3、除2、开方、加1；开平方恢复两条分支。实数范围需 y ≥
        3。
      </p>
    </template>

    <template v-else-if="topic === '110408'">
      <label class="slider-label"
        >检查 x = {{ value }}<input v-model.number="value" type="range" min="-3" max="4" step="1"
      /></label>
      <div class="expression-grid two">
        <div>
          <LatexText text="$2(x+1)\equiv2x+2$" /><strong
            >{{ 2 * (value + 1) }} = {{ 2 * value + 2 }}</strong
          ><small>恒等式：分配律保证总成立</small>
        </div>
        <div>
          <LatexText text="$2x+1=7$" /><strong
            >{{ 2 * value + 1 }} {{ value === 3 ? '=' : '≠' }} 7</strong
          ><small>方程：本例只在 x = 3 成立</small>
        </div>
      </div>
      <p class="insight">
        拖动可以发现反例，也可以验算；证明恒等式仍靠对所有允许值都合法的代数变形，不能只靠滑块抽查。
      </p>
    </template>

    <template v-else-if="topic === '110418' || topic === '110419'">
      <div class="controls">
        <AppButton
          v-for="item in sequenceModes"
          :key="item.id"
          :type="mode === item.id ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="mode === item.id"
          @click="mode = item.id"
          >{{ item.label }}</AppButton
        >
        <AppButton type="secondary" size="small" :disabled="termCount >= 7" @click="termCount++"
          >再看一项</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="sequenceFormula" /></div>
      <div class="sequence-scroll">
        <table>
          <thead>
            <tr>
              <th>项号 n</th>
              <th v-for="n in termCount" :key="n">{{ n }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>项值</th>
              <td v-for="v in sequenceValues" :key="v.n">{{ v.value }}</td>
            </tr>
            <tr>
              <th>一阶差</th>
              <td>—</td>
              <td v-for="(d, i) in firstDifferences" :key="i">{{ d }}</td>
            </tr>
            <tr v-if="topic === '110419' && mode === 'quadratic'">
              <th>二阶差</th>
              <td>—</td>
              <td>—</td>
              <td v-for="(d, i) in secondDifferences" :key="i">{{ d }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="insight">{{ sequenceInsight }}</p>
    </template>

    <template v-else>
      <div v-if="topic === '110409'" class="controls">
        <AppButton
          v-for="(point, i) in quadrantPoints"
          :key="i"
          :type="step === i ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="step === i"
          @click="step = i"
          >{{ point.name }}</AppButton
        >
      </div>
      <div v-else-if="topic === '110410'" class="controls">
        <AppButton
          v-for="item in [
            { id: 'line', label: '原直线' },
            { id: 'parallel', label: '平行线' },
            { id: 'perpendicular', label: '垂线' },
          ]"
          :key="item.id"
          :type="mode === item.id ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="mode === item.id"
          @click="mode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div v-else-if="topic === '110411' || topic === '110416'" class="controls">
        <AppButton
          v-for="k in [3, 4, 5]"
          :key="k"
          :type="constant === k ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="constant === k"
          @click="constant = k"
          >常数项 {{ k }}</AppButton
        >
      </div>
      <div v-else-if="topic === '110412'" class="controls">
        <AppButton
          v-for="item in graphModes"
          :key="item.id"
          :type="mode === item.id ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="mode === item.id"
          @click="mode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div v-else-if="topic === '110413'" class="controls">
        <AppButton
          v-for="item in [
            { id: 'journey', label: '离家距离' },
            { id: 'reciprocal', label: '固定距离用时' },
            { id: 'decay', label: '按期衰减' },
          ]"
          :key="item.id"
          :type="mode === item.id ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="mode === item.id"
          @click="mode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div v-else-if="topic === '110414'" class="controls">
        <AppButton
          v-for="n in [2, 4, 8]"
          :key="n"
          :type="divisions === n ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="divisions === n"
          @click="divisions = n"
          >{{ n }} 个梯形</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="showTangent"
          @click="showTangent = !showTangent"
          >{{ showTangent ? '隐藏切线' : '看 t = 2 的切线' }}</AppButton
        >
      </div>
      <div v-else-if="topic === '110415'" class="controls">
        <AppButton
          :type="mode === 'linear' ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="mode === 'linear'"
          @click="mode = 'linear'"
          >直线与直线</AppButton
        >
        <AppButton
          :type="mode === 'quadratic' ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="mode === 'quadratic'"
          @click="mode = 'quadratic'"
          >直线与抛物线</AppButton
        >
      </div>
      <div v-else-if="topic === '110417'" class="controls">
        <AppButton
          :type="mode === 'number' ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="mode === 'number'"
          @click="mode = 'number'"
          >数轴区间</AppButton
        >
        <AppButton
          :type="mode === 'plane' ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="mode === 'plane'"
          @click="mode = 'plane'"
          >二元不等式区域</AppButton
        >
      </div>

      <div class="formula-stage"><LatexText :text="graphFormula" /></div>
      <svg
        v-if="topic === '110417' && mode === 'number'"
        viewBox="0 0 520 145"
        role="img"
        aria-label="不等式负2小于x且x小于等于4，负2空心、4实心，中间区间高亮"
      >
        <path d="M35 72H485M475 65L485 72L475 79" class="axis" />
        <line x1="140" y1="72" x2="410" y2="72" class="solution-line" />
        <g v-for="n in [-4, -2, 0, 2, 4]" :key="n">
          <line :x1="140 + (n + 2) * 45" y1="67" :x2="140 + (n + 2) * 45" y2="77" class="axis" />
          <text :x="140 + (n + 2) * 45" y="101">{{ n }}</text>
        </g>
        <circle cx="140" cy="72" r="7" fill="white" stroke="#2451d1" stroke-width="3" />
        <circle cx="410" cy="72" r="7" fill="#2451d1" />
      </svg>
      <svg v-else viewBox="0 0 520 330" role="img" :aria-label="graphDescription">
        <defs>
          <clipPath :id="clipId"><rect x="55" y="20" width="430" height="260" /></clipPath>
        </defs>
        <g v-for="tick in xTicks" :key="'x' + tick">
          <line :x1="sx(tick)" y1="20" :x2="sx(tick)" y2="280" class="grid" />
          <text :x="sx(tick)" y="303">{{ tick }}</text>
        </g>
        <g v-for="tick in yTicks" :key="'y' + tick">
          <line x1="55" :y1="sy(tick)" x2="485" :y2="sy(tick)" class="grid" />
          <text x="38" :y="sy(tick) + 5">{{ tick }}</text>
        </g>
        <path :d="'M55 ' + sy(0) + 'H485M' + sx(0) + ' 20V280'" class="axis" />
        <text x="483" y="322">{{ xAxisLabel }}</text>
        <text x="60" y="13" text-anchor="start">{{ yAxisLabel }}</text>
        <g :clip-path="'url(#' + clipId + ')'">
          <polygon
            v-if="topic === '110417' && mode === 'plane'"
            :points="regionPoints"
            class="region"
          />
          <polygon
            v-for="(polygon, i) in trapezoids"
            :key="'area' + i"
            :points="polygon"
            class="trapezoid"
          />
          <path
            v-for="(curve, i) in curves"
            :key="'curve' + i"
            :d="curve.path"
            :class="['curve', i ? 'curve-secondary' : '', curve.dashed ? 'dashed' : '']"
          />
          <path
            v-if="topic === '110414' && showTangent"
            :d="curvePath((x) => 4 * x - 4)"
            class="tangent"
          />
          <template v-if="topic === '110409'">
            <path
              :d="'M' + sx(0) + ' ' + sy(0) + 'H' + sx(currentPoint.x) + 'V' + sy(currentPoint.y)"
              class="guide"
            />
          </template>
          <g v-for="(point, i) in marks" :key="'point' + i">
            <circle :cx="sx(point.x)" :cy="sy(point.y)" r="5" class="mark" />
            <text :x="sx(point.x) + point.dx" :y="sy(point.y) + point.dy" class="point-label">
              {{ point.label }}
            </text>
          </g>
        </g>
      </svg>
      <div class="insight" aria-live="polite"><LatexText :text="graphInsight" /></div>
      <p v-if="topic === '110412' && ['sin', 'cos', 'tan'].includes(mode)" class="footnote">
        横轴使用度数；正切曲线在渐近线处断开，不连成竖线。
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
const step = ref(0)
const value = ref(-2)
const mode = ref('line')
const constant = ref(3)
const divisions = ref(4)
const showTangent = ref(false)
const termCount = ref(4)
const headings: Record<string, string> = {
  '110401': '同一个 x，不同运算结构',
  '110402': '把指数账本拆成三栏',
  '110403': '负数代入，括号放在哪里',
  '110404': '乘法展开是一块面积的拆分',
  '110405': '因式分解是反向拼回矩形',
  '110406': '约去因式，保留禁值',
  '110407': '沿运算链反向找回未知量',
  '110408': '一次相等和永远相等有什么区别',
  '110409': '先横后纵，走进四个象限',
  '110410': '用两条线比较斜率',
  '110411': '改变常数，观察顶点与根',
  '110412': '抓住形状、关键点和断点',
  '110413': '同样一条曲线，先读坐标轴',
  '110414': '用梯形估面积，用切线估斜率',
  '110415': '交点就是两式共同的解',
  '110416': '实根数量在图像上看得见',
  '110417': '把解集画成区间或区域',
  '110418': '从首项逐步走向后项',
  '110419': '差分怎样揭示通项结构',
}
// 切换知识点时恢复本点的示意状态，避免前一点的选项被错误带入。
function resetTopic() {
  step.value = 0
  mode.value =
    (
      {
        '110412': 'linear',
        '110413': 'journey',
        '110415': 'linear',
        '110417': 'number',
        '110418': 'arithmetic',
        '110419': 'quadratic',
      } as Record<string, string>
    )[props.topic] || 'line'
  termCount.value = 4
  value.value = -2
  constant.value = 3
  divisions.value = 4
  showTangent.value = false
}
watch(() => props.topic, resetTopic, { immediate: true })
// 当前考纲节点决定图解小标题。
const heading = computed(() => headings[props.topic] || '代数结构与图像')
// 每类互动提示说明学生能观察的变化，而不是让学生猜控件用途。
const invitation = computed(() =>
  ['110401', '110403', '110408'].includes(props.topic)
    ? '拖动数值，观察结构与结果的关系。'
    : props.topic === '110414'
      ? '增加分割数，比较曲线面积估计；再切换到切线。'
      : '点选上方按钮，在示意、公式与结论之间来回检查。',
)
// 同一输入分别计算乘法、幂和负号，保持展示与实际数值一致。
const notationValues = computed(() =>
  props.topic === '110401'
    ? [
        { formula: '$3x$', value: 3 * value.value, note: '三个 x 相加' },
        { formula: '$x^3$', value: value.value ** 3, note: '三个 x 相乘' },
        { formula: '$3+x$', value: 3 + value.value, note: '3 与 x 相加' },
      ]
    : [
        { formula: '$x^2$', value: value.value ** 2, note: '先代入，再平方' },
        { formula: '$-x^2$', value: -(value.value ** 2), note: '先平方，再取负' },
        { formula: '$(-x)^2$', value: (-value.value) ** 2, note: '负号在平方里面' },
      ],
)
const indexStages = [
  String.raw`$(3x^{1/2}y^{-2})^2$`,
  String.raw`$3^2(x^{1/2})^2(y^{-2})^2$`,
  String.raw`$9xy^{-4}=\frac{9x}{y^4}$`,
]
const fractionStages = [
  String.raw`$\frac{x^2-4}{x-2}$`,
  String.raw`$\frac{(x-2)(x+2)}{x-2}$`,
  String.raw`$x+2\qquad(x\ne2)$`,
]
const rearrangeStages = [
  String.raw`$y=2(x-1)^2+3$`,
  String.raw`$(x-1)^2=\frac{y-3}{2}$`,
  String.raw`$x=1\pm\sqrt{\frac{y-3}{2}}$`,
]
const quadrantPoints = [
  { name: '第一象限', x: 3, y: 2 },
  { name: '第二象限', x: -3, y: 2 },
  { name: '第三象限', x: -3, y: -2 },
  { name: '第四象限', x: 3, y: -2 },
  { name: '坐标轴', x: 0, y: 3 },
]
// 受控按钮索引只从预设点读取，坐标轴上的点也单独展示。
const currentPoint = computed(() => quadrantPoints[step.value] || quadrantPoints[0]!)
const graphModes = [
  { id: 'linear', label: '一次' },
  { id: 'quadratic', label: '二次' },
  { id: 'cubic', label: '三次' },
  { id: 'reciprocal', label: '反比例' },
  { id: 'growth', label: '指数增长' },
  { id: 'decay', label: '指数衰减' },
  { id: 'sin', label: 'sin' },
  { id: 'cos', label: 'cos' },
  { id: 'tan', label: 'tan' },
]
// 图像范围与实际单位同步，三角图像的横轴始终按度数。
const bounds = computed(() => {
  if (props.topic === '110413')
    return mode.value === 'journey'
      ? { xmin: 0, xmax: 50, ymin: 0, ymax: 12 }
      : mode.value === 'reciprocal'
        ? { xmin: 0, xmax: 60, ymin: 0, ymax: 12 }
        : { xmin: 0, xmax: 5, ymin: 0, ymax: 100 }
  if (props.topic === '110414') return { xmin: 0, xmax: 4, ymin: 0, ymax: 18 }
  if (props.topic === '110412' && ['sin', 'cos', 'tan'].includes(mode.value))
    return { xmin: -360, xmax: 360, ymin: -3, ymax: 3 }
  if (['110411', '110416'].includes(props.topic)) return { xmin: -1, xmax: 5, ymin: -2, ymax: 8 }
  return { xmin: -5, xmax: 5, ymin: -5, ymax: 5 }
})
// 所有图形使用同一个坐标映射，保证阴影、切线和曲线对齐。
function sx(x: number) {
  if (['110409', '110410', '110415', '110417'].includes(props.topic))
    return 140 + ((x - bounds.value.xmin) / (bounds.value.xmax - bounds.value.xmin)) * 260
  return 55 + ((x - bounds.value.xmin) / (bounds.value.xmax - bounds.value.xmin)) * 430
}
// 纵向映射与横向的几何模式同尺度，垂线在屏幕上也保持直角。
function sy(y: number) {
  return 280 - ((y - bounds.value.ymin) / (bounds.value.ymax - bounds.value.ymin)) * 260
}
// 按当前量程生成少量刻度，窄屏不堆叠数字。
const xTicks = computed(() => {
  const b = bounds.value
  if (b.xmin === -5) return [-4, -2, 0, 2, 4]
  if (props.topic === '110414') return [0, 1, 2, 3, 4]
  const count =
    props.topic === '110413' && mode.value === 'journey'
      ? 5
      : props.topic === '110412' && ['sin', 'cos', 'tan'].includes(mode.value)
        ? 4
        : 5
  return Array.from(
    { length: count + 1 },
    (_, i) => Math.round((b.xmin + ((b.xmax - b.xmin) * i) / count) * 10) / 10,
  )
})
// 纵轴刻度与曲线高度同步，不依赖静态文字标尺。
const yTicks = computed(() =>
  bounds.value.ymin === -5
    ? [-4, -2, 0, 2, 4]
    : Array.from(
        { length: 5 },
        (_, i) =>
          Math.round((bounds.value.ymin + ((bounds.value.ymax - bounds.value.ymin) * i) / 4) * 10) /
          10,
      ),
)
// 不同知识点实例使用独立裁剪路径，整章阅读时不会相互覆盖。
const clipId = computed(() => 'algebra-clip-' + props.topic)
// 对渐近线和超出窗口的采样点中断路径，防止将正切或反比例两侧错误连线。
function curvePath(fn: (x: number) => number) {
  let path = '',
    connected = false,
    previous = 0
  for (let i = 0; i <= 400; i++) {
    const x = bounds.value.xmin + ((bounds.value.xmax - bounds.value.xmin) * i) / 400,
      y = fn(x)
    if (!Number.isFinite(y) || y < bounds.value.ymin - 1 || y > bounds.value.ymax + 1) {
      connected = false
      continue
    }
    if (connected && Math.abs(y - previous) > (bounds.value.ymax - bounds.value.ymin) * 0.7)
      connected = false
    path += (connected ? 'L' : 'M') + sx(x).toFixed(2) + ' ' + sy(y).toFixed(2) + ' '
    connected = true
    previous = y
  }
  return path
}
// 折线读图场景保留原数据节点，避免用平滑曲线改写实际运动过程。
function linePath(points: number[][]) {
  return points.map((p, i) => (i ? 'L' : 'M') + sx(p[0]!) + ' ' + sy(p[1]!)).join(' ')
}
// 当前图像组合同时决定公式、交点和高亮区域的依据。
const curves = computed(() => {
  const p = props.topic,
    m = mode.value
  if (p === '110409') return []
  if (p === '110410')
    return [
      { path: curvePath((x) => x + 1) },
      {
        path: curvePath(
          m === 'parallel' ? (x) => x - 2 : m === 'perpendicular' ? (x) => -x + 1 : (x) => x + 1,
        ),
      },
    ]
  if (['110411', '110416'].includes(p))
    return [{ path: curvePath((x) => x * x - 4 * x + constant.value) }]
  if (p === '110412') {
    const f: Record<string, (x: number) => number> = {
      linear: (x) => x,
      quadratic: (x) => x * x,
      cubic: (x) => x * x * x,
      reciprocal: (x) => 1 / x,
      growth: (x) => 2 ** x,
      decay: (x) => 0.5 ** x,
      sin: (x) => Math.sin((x * Math.PI) / 180),
      cos: (x) => Math.cos((x * Math.PI) / 180),
      tan: (x) => Math.tan((x * Math.PI) / 180),
    }
    return [{ path: curvePath(f[m] || f.linear!) }]
  }
  if (p === '110413')
    return [
      {
        path:
          m === 'journey'
            ? linePath([
                [0, 0],
                [15, 10],
                [25, 10],
                [50, 0],
              ])
            : curvePath(m === 'reciprocal' ? (x) => 60 / x : (x) => 100 * 0.5 ** x),
      },
    ]
  if (p === '110414') return [{ path: curvePath((x) => x * x) }]
  if (p === '110415')
    return [
      { path: curvePath((x) => x + 1) },
      { path: curvePath(m === 'linear' ? (x) => -x + 3 : (x) => x * x - 1) },
    ]
  if (p === '110417')
    return [{ path: curvePath((x) => x + 1) }, { path: curvePath((x) => 4 - x), dashed: true }]
  return []
})
// 实际坐标轴单位帮助区分图高、斜率与面积各自含义。
const xAxisLabel = computed(() =>
  props.topic === '110413'
    ? mode.value === 'journey'
      ? 't / min'
      : mode.value === 'reciprocal'
        ? 'v / km·h⁻¹'
        : '期数'
    : props.topic === '110414'
      ? 't / s'
      : props.topic === '110412' && ['sin', 'cos', 'tan'].includes(mode.value)
        ? 'x / °'
        : 'x',
)
// 纵轴量的名称决定高度、斜率和面积的实际意义。
const yAxisLabel = computed(() =>
  props.topic === '110413'
    ? mode.value === 'journey'
      ? '离家距离 / km'
      : mode.value === 'reciprocal'
        ? '用时 / h'
        : '余量 / %'
    : props.topic === '110414'
      ? 'v / m·s⁻¹'
      : 'y',
)
// 标注点来自解析坐标，非凭视觉摆放。
const marks = computed(() => {
  const p = props.topic
  if (p === '110409')
    return [
      {
        ...currentPoint.value,
        label: '(' + currentPoint.value.x + ',' + currentPoint.value.y + ')',
        dx: 0,
        dy: -14,
      },
    ]
  if (['110411', '110416'].includes(p)) {
    const items = [
      {
        x: 2,
        y: constant.value - 4,
        label: '顶点 (2,' + (constant.value - 4) + ')',
        dx: 0,
        dy: 23,
      },
    ]
    if (constant.value < 4) {
      items.push(
        { x: 1, y: 0, label: 'x=1', dx: -22, dy: -14 },
        { x: 3, y: 0, label: 'x=3', dx: 22, dy: -14 },
      )
    }
    return items
  }
  if (p === '110415')
    return mode.value === 'linear'
      ? [{ x: 1, y: 2, label: '(1,2)', dx: 22, dy: -12 }]
      : [
          { x: -1, y: 0, label: '(-1,0)', dx: -28, dy: 20 },
          { x: 2, y: 3, label: '(2,3)', dx: 25, dy: -12 },
        ]
  if (p === '110414' && showTangent.value) return [{ x: 2, y: 4, label: '(2,4)', dx: -24, dy: -14 }]
  return []
})
// 半平面交集在当前视窗内为三角区域：x≥1.5，4−x<y≤x+1。
const regionPoints = computed(() =>
  [
    [1.5, 2.5],
    [4, 5],
    [5, 5],
    [5, -1],
  ]
    .map(([x, y]) => sx(x!) + ',' + sy(y!))
    .join(' '),
)
// 速度曲线v=t²的每段梯形都用真实端点高度，细分后面积应逐渐降低。
const trapezoids = computed(() => {
  if (props.topic !== '110414') return []
  const dx = 4 / divisions.value
  return Array.from({ length: divisions.value }, (_, i) => {
    const a = i * dx,
      b = (i + 1) * dx
    return [
      [a, 0],
      [a, a * a],
      [b, b * b],
      [b, 0],
    ]
      .map(([x, y]) => sx(x!) + ',' + sy(y!))
      .join(' ')
  })
})
// 梯形估算只输出近似面积，不把有限分割宣称为精确积分值。
const estimatedArea = computed(() => {
  const dx = 4 / divisions.value
  return Array.from(
    { length: divisions.value },
    (_, i) => (((i * dx) ** 2 + ((i + 1) * dx) ** 2) / 2) * dx,
  ).reduce((a, b) => a + b, 0)
})
// 控件状态与公式保持同源，让学生可来回对应图形和符号。
const graphFormula = computed(() => {
  const p = props.topic,
    m = mode.value
  if (p === '110409') return '$(x,y)$：先沿横轴，再沿纵轴'
  if (p === '110410')
    return m === 'parallel'
      ? '$y=x+1\\quad\\text{与}\\quad y=x-2$'
      : m === 'perpendicular'
        ? '$y=x+1\\quad\\text{与}\\quad y=-x+1$'
        : '$y=x+1\\quad(m=1,\\ c=1)$'
  if (['110411', '110416'].includes(p))
    return (
      '$y=x^2-4x+' +
      constant.value +
      '=(x-2)^2' +
      (constant.value >= 4 ? '+' : '') +
      (constant.value - 4) +
      '$'
    )
  if (p === '110412')
    return (
      (
        {
          linear: '$y=x$',
          quadratic: '$y=x^2$',
          cubic: '$y=x^3$',
          reciprocal: '$y=1/x\\ (x\\ne0)$',
          growth: '$y=2^x$',
          decay: '$y=(1/2)^x$',
          sin: '$y=\\sin x$',
          cos: '$y=\\cos x$',
          tan: '$y=\\tan x$',
        } as Record<string, string>
      )[m] || '$y=x$'
    )
  if (p === '110413')
    return m === 'journey'
      ? '出发 → 停留 → 返程'
      : m === 'reciprocal'
        ? '$t=60/v\\quad(v>0)$'
        : '$Q=100(1/2)^t$'
  if (p === '110414') return '$v=t^2\\quad(0\\le t\\le4)$'
  if (p === '110415') return m === 'linear' ? '$y=x+1,\\quad y=-x+3$' : '$y=x+1,\\quad y=x^2-1$'
  return m === 'number'
    ? '$-3<2x+1\\le9\\ \\Longleftrightarrow\\ -2<x\\le4$'
    : '$y\\le x+1,\\quad y>4-x$'
})
// 解释由当前模型推导，不对图像之外的真实情境作额外承诺。
const graphInsight = computed(() => {
  const p = props.topic,
    m = mode.value
  if (p === '110409')
    return currentPoint.value.x === 0
      ? 'x=0，因此点在y轴上，不属于四个象限。'
      : '横坐标' +
          currentPoint.value.x +
          '、纵坐标' +
          currentPoint.value.y +
          '；虚线展示先横后纵的定位路径。'
  if (p === '110410')
    return m === 'parallel'
      ? '两线每向右1都上升1，斜率相同、截距不同，永不相交。'
      : m === 'perpendicular'
        ? '斜率分别是1和−1，乘积为−1。横纵轴使用相同尺度，交角为90°。'
        : '向右1、向上1，斜率为1；x=0时y=1，所以纵截距为1。'
  if (['110411', '110416'].includes(p))
    return constant.value === 3
      ? '顶点(2,−1)，与x轴相交于x=1、3；两个不同实根。'
      : constant.value === 4
        ? '顶点(2,0)，只与x轴相切；x=2是一个重根，不是两个不同的交点。'
        : '顶点(2,1)，整条抛物线位于x轴上方；方程没有实根。'
  if (p === '110412')
    return (
      (
        {
          linear: '直线过原点，斜率为1。',
          quadratic: '关于y轴对称，顶点在原点；左右两支不是两条不同函数。',
          cubic: '关于原点对称，从第三象限穿过原点到第一象限。',
          reciprocal: '定义域排除x=0。曲线分两支，接近坐标轴但不与它们相交。',
          growth: '每增加1，函数值乘2；过(0,1)，永远为正。',
          decay: '每增加1，函数值减半；过(0,1)，下降但不会到0。',
          sin: '周期360°，过(0,0)，90°达到1，270°达到−1。',
          cos: '周期360°，过(0,1)，180°达到−1。',
          tan: '周期180°；90°+180°n处无定义。每条支连续上升，但不同支不能相连。',
        } as Record<string, string>
      )[m] || ''
    )
  if (p === '110413')
    return m === 'journey'
      ? '水平段15—25分钟表示停留。回到原点只说明离家距离为0，累计路程为20 km。'
      : m === 'reciprocal'
        ? '固定路程60 km，速度越大，用时越少：10 km/h需6 h，20 km/h需3 h。纵值是时间，不能将这条曲线下的面积当路程。'
        : '余量每期减半，减少的绝对量逐期变小。模型以连续曲线示意，按期结算时应读取整数期位置。'
  if (p === '110414')
    return (
      '当前' +
      divisions.value +
      '个梯形估得路程约' +
      estimatedArea.value.toFixed(2) +
      ' m。' +
      (showTangent.value
        ? 't=2处切线为v=4t−4，斜率4 m/s²；这是瞬时加速度，不是曲线下的面积。'
        : '本曲线上弯，梯形弦在曲线上方，所以估计偏大；增加分割数比较收敛趋势。')
    )
  if (p === '110415')
    return m === 'linear'
      ? '两条直线交于(1,2)，它同时满足两式；把坐标代回两条等式检查。'
      : '代入得到x²−x−2=0，所以交点为(−1,0)和(2,3)。每个x必须与自己对应的y配对。'
  return m === 'number'
    ? '−2不包括，4包括；中间所有实数都满足。若只求整数，解为−1、0、1、2、3、4。'
    : '阴影是两条件的交集：蓝色实线包括，绿色虚线不包括；两线交点(1.5,2.5)因严格不等式也不包括。'
})
// 屏幕阅读器读取公式与结论，避免只能看颜色区分图形。
const graphDescription = computed(() => heading.value + '。' + graphInsight.value)
// 生成数列页展示递推，通项页展示一阶与二阶差的对比。
const sequenceModes = computed(() =>
  props.topic === '110418'
    ? [
        { id: 'arithmetic', label: '每次加3' },
        { id: 'recursive', label: '前项×2再加1' },
      ]
    : [
        { id: 'arithmetic', label: '一次通项' },
        { id: 'quadratic', label: '二次通项' },
      ],
)
// 通项与递推式随模式同步，避免示意表和标题使用不同规则。
const sequenceFormula = computed(() =>
  mode.value === 'recursive'
    ? '$a_1=2,\\quad a_{n+1}=2a_n+1$'
    : mode.value === 'quadratic'
      ? '$a_n=2n^2+1$'
      : '$a_n=3n-1$',
)
// 递推模型逐项使用上一项的新值；其他模型直接由项号计算。
const sequenceValues = computed(() => {
  let previous = 2
  return Array.from({ length: termCount.value }, (_, i) => {
    const n = i + 1
    if (mode.value === 'recursive') {
      if (i > 0) previous = 2 * previous + 1
      return { n, value: previous }
    }
    return { n, value: mode.value === 'quadratic' ? 2 * n * n + 1 : 3 * n - 1 }
  })
})
// 差分只比较相邻项，不把首项当作第一条增量。
const firstDifferences = computed(() =>
  sequenceValues.value.slice(1).map((v, i) => v.value - sequenceValues.value[i]!.value),
)
// 二阶差检验二次数列的最高次系数：恒定值等于2A。
const secondDifferences = computed(() =>
  firstDifferences.value.slice(1).map((v, i) => v - firstDifferences.value[i]!),
)
// 根据差分结果解释一次、二次和递推三种规则的区别。
const sequenceInsight = computed(() =>
  mode.value === 'recursive'
    ? '每次使用上一步刚算出的项，2 → 5 → 11。增量不是常数，不能当等差数列。'
    : mode.value === 'quadratic'
      ? '一阶差为6、10、14……；二阶差恒为4，所以n²的系数是4÷2=2。再减去2n²，剩余常数1。'
      : '一阶差恒为3。第1项为2，所以通项为2+3(n−1)=3n−1；常数−1不是首项。',
)
</script>

<style scoped lang="scss">
.algebra-atlas {
  margin: 0;
  padding: 22px;
  background: linear-gradient(135deg, #f0f7ff, #f5fbfa);
  border: 1px solid #cce0f1;
  border-radius: 14px;
  min-width: 0;
  color: #173451;
  figcaption > span {
    font-size: 11px;
    letter-spacing: 0.12em;
    font-weight: 700;
    color: #177d82;
  }
  h5 {
    font-size: 20px;
    margin: 10px 0 8px;
    color: #172b40;
  }
  p {
    line-height: 1.7;
    margin: 10px 0 0;
  }
  figcaption p {
    color: #5d7286;
    font-size: 14px;
  }
  svg {
    display: block;
    width: 100%;
    max-width: 620px;
    height: auto;
    overflow: hidden;
    margin: 16px auto;
  }
  svg text {
    font-size: 15px;
    fill: #29445c;
    text-anchor: middle;
  }
  svg .point-label {
    font-size: 13px;
    font-weight: 600;
    paint-order: stroke;
    stroke: white;
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  :deep(.app-button--primary) {
    --app-button-bg: var(--color-blue-600, #2451d1);
    --app-button-border: var(--color-blue-600, #2451d1);
    --app-button-hover-bg: #1e40af;
    --app-button-hover-border: #1e40af;
    --app-button-active-bg: #1e3a8a;
    --app-button-active-border: #1e3a8a;
    background: #2451d1;
    border-color: #2451d1;
    color: white;
  }
  :deep(.app-button--secondary) {
    --app-button-hover-bg: #eaf1ff;
    --app-button-hover-border: #8cafff;
    --app-button-active-bg: #dbe8ff;
    --app-button-active-border: #789df3;
    color: #2451d1;
    border-color: #c4d5fc;
    background: white;
  }
}
.controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 18px;
}
.slider-label {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 22px 0;
  font-weight: 600;
  input {
    accent-color: #2451d1;
    width: 100%;
  }
}
.expression-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 20px;
  &.two {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px 8px;
    background: #fff;
    border: 1px solid #d9e5f1;
    border-radius: 10px;
    min-width: 0;
    strong {
      font-size: 24px;
      color: #2451d1;
    }
    small {
      font-size: 12px;
      color: #5d7286;
      text-align: center;
    }
  }
}
.formula-stage {
  padding: 14px 10px;
  background: #fff;
  border-radius: 8px;
  margin-top: 16px;
  text-align: center;
  overflow-x: auto;
  font-size: 18px;
}
.formula-flow {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 12px;
  margin: 22px 0;
  li {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #fff;
    border-radius: 8px;
    padding: 16px 12px;
    overflow-x: auto;
  }
  li > span:first-child {
    width: 26px;
    height: 26px;
    line-height: 26px;
    text-align: center;
    flex-shrink: 0;
    background: #e8f0ff;
    border-radius: 50%;
    color: #2451d1;
    font-weight: 700;
  }
}
.insight {
  padding: 14px 16px;
  background: #e9f1ff;
  border-left: 3px solid #2451d1;
  font-size: 14px;
  line-height: 1.8;
  margin-top: 18px;
  overflow-wrap: anywhere;
}
.condition {
  display: grid;
  gap: 8px;
  padding: 16px;
  margin-top: 16px;
  background: #fff4df;
  border-left: 3px solid #c8912e;
  line-height: 1.7;
}
.ledger {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  span {
    background: white;
    padding: 9px 12px;
    border-radius: 6px;
    font-size: 13px;
  }
}
.blue-fill {
  fill: #dce8ff;
  stroke: #6b92e1;
  stroke-width: 2;
}
.teal-fill {
  fill: #d4eeeb;
  stroke: #4ba89f;
  stroke-width: 2;
}
.gold-fill {
  fill: #fff0ca;
  stroke: #d9b451;
  stroke-width: 2;
}
.grid {
  stroke: #dbe5ed;
  stroke-width: 1;
}
.axis {
  fill: none;
  stroke: #6b7e91;
  stroke-width: 1.5;
}
.curve {
  fill: none;
  stroke: #2451d1;
  stroke-width: 3;
}
.curve-secondary {
  stroke: #0c877e;
}
.dashed {
  stroke-dasharray: 7 5;
}
.tangent {
  stroke: #c0791c;
  stroke-width: 2;
  fill: none;
  stroke-dasharray: 6 4;
}
.guide {
  fill: none;
  stroke: #8397b1;
  stroke-dasharray: 5 4;
  stroke-width: 2;
}
.mark {
  fill: #2451d1;
  stroke: white;
  stroke-width: 2;
}
.solution-line {
  stroke: #2451d1;
  stroke-width: 5;
}
.region {
  fill: #d0e6ed;
  fill-opacity: 0.75;
}
.trapezoid {
  fill: #86c5bc;
  fill-opacity: 0.3;
  stroke: #549e95;
  stroke-width: 1;
}
.footnote {
  font-size: 12px;
  color: #678097;
}
.sequence-scroll {
  overflow-x: auto;
  margin-top: 16px;
  background: #fff;
  border-radius: 8px;
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 14px;
    text-align: center;
  }
  th,
  td {
    padding: 12px 14px;
    white-space: nowrap;
    border-bottom: 1px solid #e3eaf2;
  }
  th {
    font-weight: 600;
    color: #51708c;
  }
  td {
    color: #2451d1;
    font-weight: 600;
  }
}
@media (max-width: 600px) {
  .algebra-atlas {
    padding: 14px;
    h5 {
      font-size: 18px;
    }
  }
  .controls {
    gap: 6px;
  }
  .expression-grid {
    gap: 6px;
    > div {
      padding: 12px 4px;
      strong {
        font-size: 21px;
      }
    }
  }
  .formula-stage {
    font-size: 16px;
  }
  .insight {
    padding: 12px;
  }
  .expression-grid.two {
    grid-template-columns: 1fr;
  }
}
</style>
