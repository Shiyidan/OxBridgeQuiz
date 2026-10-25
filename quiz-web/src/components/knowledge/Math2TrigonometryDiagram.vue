<!-- 数学2三角互动图解：按六个考纲叶节点展示几何、单位圆、图像与方程的复习模型。 -->
<template>
  <figure class="math2-trigonometry" :aria-label="heading">
    <figcaption>
      <span>MATHEMATICS 2 · TRIGONOMETRY</span>
      <h5>{{ heading }}</h5>
      <p>{{ introduction }}</p>
    </figcaption>
    <template v-if="mode === 'triangle'">
      <div class="controls" role="group" aria-label="三角形的已知条件">
        <AppButton
          size="small"
          :type="!ambiguous ? 'primary' : 'secondary'"
          :aria-pressed="!ambiguous"
          @click="ambiguous = false"
          >两边及夹角</AppButton
        >
        <AppButton
          size="small"
          :type="ambiguous ? 'primary' : 'secondary'"
          :aria-pressed="ambiguous"
          @click="ambiguous = true"
          >非夹角：可能两解</AppButton
        >
      </div>
      <template v-if="!ambiguous">
        <div class="controls" role="group" aria-label="改变夹角A">
          <AppButton
            v-for="a in [30, 60, 90]"
            :key="a"
            size="small"
            :type="triangleAngle === a ? 'primary' : 'secondary'"
            :aria-pressed="triangleAngle === a"
            @click="triangleAngle = a"
            >A = {{ a }}°</AppButton
          >
        </div>
        <svg
          viewBox="0 0 600 370"
          role="img"
          :aria-label="`夹角${triangleAngle}度，邻边6和8，对边${triangleSide.toFixed(2)}`"
        >
          <title>小写边名对应同名大写顶点的对边</title>
          <path :d="`M90 300L450 300L${trianglePoint.x} ${trianglePoint.y}Z`" class="shape" />
          <path :d="arc(90, 300, 48, triangleAngle)" class="angle" />
          <text x="65" y="330">A</text>
          <text x="455" y="330">B</text>
          <text :x="trianglePoint.x" :y="trianglePoint.y - 15">C</text>
          <text x="270" y="335" text-anchor="middle">c = 8</text>
          <text
            :x="(90 + trianglePoint.x) / 2 - 20"
            :y="(300 + trianglePoint.y) / 2 - 14"
            text-anchor="end"
          >
            b = 6
          </text>
          <text :x="(450 + trianglePoint.x) / 2 + 15" :y="(300 + trianglePoint.y) / 2">a</text>
          <text
            :x="90 + 88 * Math.cos(radians(triangleAngle / 2))"
            :y="307 - 88 * Math.sin(radians(triangleAngle / 2))"
            text-anchor="middle"
          >
            {{ triangleAngle }}°
          </text>
        </svg>
        <p class="result"><LatexText :text="triangleResult" /></p>
        <p>夹角已知，用余弦定理求对边，用两条邻边和夹角求面积。边长与面积并不按同样规律改变。</p>
      </template>
      <template v-else>
        <svg
          viewBox="0 0 600 370"
          role="img"
          aria-label="A角30度，AB为10，BC为7时，C有两个可能位置"
        >
          <title>C同时在30度射线和以B为圆心半径7的圆上</title>
          <path d="M90 300L555 31M174 300A196 196 0 0 1 566 300" class="guide" />
          <path :d="`M90 300L370 300L${ssaPoints[0]!.x} ${ssaPoints[0]!.y}Z`" class="shape" />
          <path :d="`M90 300L370 300L${ssaPoints[1]!.x} ${ssaPoints[1]!.y}Z`" class="alternative" />
          <path :d="arc(90, 300, 48, 30)" class="angle" />
          <text x="70" y="333">A</text>
          <text x="370" y="333">B</text>
          <text x="215" y="333">10</text>
          <text x="163" y="283">30°</text>
          <text :x="ssaPoints[0]!.x - 20" :y="ssaPoints[0]!.y - 15">C₁</text>
          <text :x="ssaPoints[1]!.x + 8" :y="ssaPoints[1]!.y - 8">C₂</text>
          <text x="290" y="248">7</text>
          <text x="410" y="222">7</text>
        </svg>
        <p class="result"><LatexText :text="ssaResult" /></p>
        <p>非夹角条件可能有两解、一解或无解。本图两处交点都有效；不能只取反正弦给出的锐角。</p>
      </template>
    </template>
    <template v-else-if="mode === 'radian'">
      <div class="controls" role="group" aria-label="选择圆心角">
        <AppButton
          v-for="item in sectorAngles"
          :key="item.degree"
          size="small"
          :type="sectorDegree === item.degree ? 'primary' : 'secondary'"
          :aria-pressed="sectorDegree === item.degree"
          @click="sectorDegree = item.degree"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="选择半径">
        <AppButton
          v-for="r in [3, 6]"
          :key="r"
          size="small"
          :type="sectorRadius === r ? 'primary' : 'secondary'"
          :aria-pressed="sectorRadius === r"
          @click="sectorRadius = r"
          >r = {{ r }} cm</AppButton
        >
      </div>
      <svg
        viewBox="0 0 600 360"
        role="img"
        :aria-label="`半径${sectorRadius}厘米，圆心角${sectorDegree}度`"
      >
        <title>图中半径随实际数值同比改变，圆心角控制整圆比例</title>
        <circle cx="280" cy="185" :r="sectorDrawingRadius" class="guide" />
        <path :d="sectorPath" class="shape" />
        <path :d="arc(280, 185, 36, sectorDegree)" class="angle" />
        <text x="255" y="217">O</text>
        <text :x="280 + sectorDrawingRadius / 2" y="214" text-anchor="middle">
          r = {{ sectorRadius }}
        </text>
        <text
          :x="280 + 65 * Math.cos(radians(sectorDegree / 2))"
          :y="192 - 65 * Math.sin(radians(sectorDegree / 2))"
          text-anchor="middle"
        >
          θ
        </text>
      </svg>
      <p class="result"><LatexText :text="sectorResult" /></p>
      <p>
        使用 l = rθ 和面积 ½r²θ 时，θ 必须以弧度表示。同角度下半径翻倍，弧长翻倍，扇形面积变四倍。
      </p>
    </template>
    <template v-else-if="mode === 'exact' || mode === 'identity'">
      <div class="controls" role="group" aria-label="选择单位圆角度">
        <AppButton
          v-for="a in unitAngles"
          :key="a"
          size="small"
          :type="unitDegree === a ? 'primary' : 'secondary'"
          :aria-pressed="unitDegree === a"
          @click="unitDegree = a"
          >{{ a }}°</AppButton
        >
      </div>
      <svg
        viewBox="0 0 600 360"
        role="img"
        :aria-label="`单位圆${unitDegree}度，横坐标为余弦，纵坐标为正弦`"
      >
        <title>P=(cosθ,sinθ)，投影带符号，半径恒为1</title>
        <path d="M90 180H470M280 25V335" class="axis" />
        <circle cx="280" cy="180" r="120" class="guide" />
        <path :d="`M280 180L${unitPoint.x} ${unitPoint.y}`" class="curve" />
        <path :d="`M280 180H${unitPoint.x}V${unitPoint.y}H280`" class="projection" />
        <path :d="arc(280, 180, 40, unitDegree)" class="angle" />
        <circle :cx="unitPoint.x" :cy="unitPoint.y" r="6" class="point" />
        <text :x="unitPoint.x + (unitDegree === 90 ? -30 : 12)" :y="unitPoint.y - 10">P</text>
        <text x="475" y="189">x</text>
        <text x="290" y="27">y</text>
        <text x="255" y="207">O</text>
        <text x="403" y="207">1</text>
        <text x="141" y="207">−1</text>
        <text x="290" y="66">1</text>
        <text x="290" y="311">−1</text>
        <text x="72" y="350">横坐标 cosθ；纵坐标 sinθ</text>
      </svg>
      <p class="result"><LatexText :text="unitResult" /></p>
      <template v-if="mode === 'identity'">
        <div
          class="squared-bar"
          role="img"
          :aria-label="`余弦平方${unitCosSquared.toFixed(2)}加正弦平方${(1 - unitCosSquared).toFixed(2)}等于1`"
        >
          <span :style="{ width: `${unitCosSquared * 100}%` }" class="cos-square"></span
          ><span :style="{ width: `${(1 - unitCosSquared) * 100}%` }" class="sin-square"></span>
        </div>
        <p class="legend"><span>蓝：cos²θ</span><span>青：sin²θ</span><strong>总和 = 1</strong></p>
        <p><LatexText :text="identityResult" /></p>
      </template>
      <p v-else>
        先用参考角确定大小，再由象限判断正负。精确值保留根式；90°处的正切没有定义，不能记成0。
      </p>
    </template>
    <template v-else-if="mode === 'graph'">
      <div class="controls" role="group" aria-label="选择三角函数">
        <AppButton
          v-for="f in functionNames"
          :key="f"
          size="small"
          :type="graphFunction === f ? 'primary' : 'secondary'"
          :aria-pressed="graphFunction === f"
          @click="graphFunction = f"
          >{{ f }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="改变图像参数">
        <AppButton size="small" type="secondary" @click="amplitude = amplitude === 1 ? 2 : 1"
          >纵向倍数 a = {{ amplitude }}</AppButton
        >
        <AppButton size="small" type="secondary" @click="frequency = frequency === 1 ? 2 : 1"
          >角度倍数 b = {{ frequency }}</AppButton
        >
        <AppButton
          size="small"
          type="secondary"
          :aria-pressed="shifted"
          @click="shifted = !shifted"
          >{{ shifted ? '向右平移 π/2' : '不平移' }}</AppButton
        >
      </div>
      <p class="formula"><LatexText :text="graphFormula" /></p>
      <svg viewBox="0 0 600 360" role="img" :aria-label="graphAria">
        <title>横轴为弧度；正切在渐近线两侧分段绘制，不跨无定义点连线</title>
        <g v-for="y in [-2, -1, 1, 2]" :key="y">
          <path :d="`M55 ${180 - y * 52}H555`" class="grid" />
          <text x="43" :y="188 - y * 52" text-anchor="end">{{ y }}</text>
        </g>
        <path d="M55 35V315M55 180H565" class="axis" />
        <path v-for="x in graphPoles" :key="x" :d="`M${graphX(x)} 35V315`" class="asymptote" />
        <path :d="graphPath" class="curve" />
        <text
          v-for="(label, i) in ['0', 'π/2', 'π', '3π/2', '2π']"
          :key="label"
          :x="55 + i * 125"
          y="345"
          text-anchor="middle"
        >
          {{ label }}
        </text>
        <text x="570" y="188">x</text>
        <text x="65" y="28">y</text>
      </svg>
      <p class="result"><LatexText :text="graphConclusion" /></p>
      <p>
        sin、tan 是奇函数，cos
        是偶函数；平移后应围绕新的对称中心或对称轴判断。正切虚线是渐近线，不属于图像。
      </p>
    </template>
    <template v-else>
      <div class="controls" role="group" aria-label="选择待解方程">
        <AppButton
          v-for="(label, i) in ['sin x = ½', 'cos x = −½', 'sin 2x = ½']"
          :key="label"
          size="small"
          :type="equation === i ? 'primary' : 'secondary'"
          :aria-pressed="equation === i"
          @click="equation = i"
          >{{ label }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="选择解的区间">
        <AppButton
          size="small"
          :type="!negativeRange ? 'primary' : 'secondary'"
          :aria-pressed="!negativeRange"
          @click="negativeRange = false"
          >0° ≤ x ≤ 360°</AppButton
        >
        <AppButton
          size="small"
          :type="negativeRange ? 'primary' : 'secondary'"
          :aria-pressed="negativeRange"
          @click="negativeRange = true"
          >−180° ≤ x ≤ 180°</AppButton
        >
      </div>
      <svg
        viewBox="0 0 600 360"
        role="img"
        :aria-label="`当前区间共${equationRoots.length}个交点，对应全部解`"
      >
        <title>蓝色曲线与青色目标水平线的每个交点对应一个解</title>
        <path :d="`M${equationX(0)} 40V280M55 180H555`" class="axis" />
        <path :d="`M55 ${equationTargetY}H555`" class="target" />
        <path :d="equationPath" class="curve" />
        <g v-for="root in equationRoots" :key="root">
          <circle :cx="equationX(root)" :cy="equationTargetY" r="6" class="point" />
          <path :d="`M${equationX(root)} ${equationTargetY}V285`" class="guide" />
          <text :x="equationX(root)" y="310" text-anchor="middle">{{ root }}°</text>
        </g>
        <text x="55" y="348" text-anchor="middle">{{ rangeStart }}°</text>
        <text x="555" y="348" text-anchor="middle">{{ rangeStart + 360 }}°</text>
        <text x="565" y="188">x</text>
        <text :x="equationX(0) + 10" y="28">y</text>
        <text v-if="negativeRange" :x="equationX(0)" y="348" text-anchor="middle">0°</text>
        <text x="45" :y="equationTargetY - 10" text-anchor="end">
          {{ equation === 1 ? '−½' : '½' }}
        </text>
      </svg>
      <p class="result">全部解：{{ equationRoots.map((x) => `${x}°`).join('，') }}。</p>
      <p><LatexText :text="equationReason" /></p>
      <p>
        先写各分支，再按周期枚举和筛选区间。图中交点数是漏根检查；若除以含x的三角因子，必须先保留该因子为零的分支。
      </p>
    </template>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'
const props = defineProps<{ topic: string }>()
// 叶子编号决定教学模型，避免六个知识点共用一幅静态示意。
const mode = computed(
  () =>
    ({
      '120401': 'triangle',
      '120402': 'radian',
      '120403': 'exact',
      '120404': 'graph',
      '120405': 'identity',
      '120406': 'equation',
    })[props.topic] ?? 'triangle',
)
// 图题直接提示当前应观察的关系。
const heading = computed(
  () =>
    ({
      triangle: '先看已知条件，再选定理',
      radian: '弧度连接角度、弧长与面积',
      exact: '参考角定大小，象限定正负',
      graph: '看清周期，别跨渐近线连线',
      identity: '一个单位圆，连接三条恒等关系',
      equation: '保留每个交点，最后筛区间',
    })[mode.value],
)
// 简短提示说明哪些变量可操作，结论在图后同步更新。
const introduction = computed(
  () =>
    ({
      triangle: '比较夹角条件与非夹角条件，留意两解情况。',
      radian: '改变圆心角或半径，比较长度与面积的倍率。',
      exact: '比较特殊角的坐标与正切值。',
      graph: '改变纵向倍数、角度倍数或平移，观察图像与周期。',
      identity: '平方和始终为1；相除前检查分母是否为0。',
      equation: '切换方程与区间，寻找参考角之外的其他解。',
    })[mode.value],
)
const ambiguous = ref(false)
const triangleAngle = ref(60)
const sectorDegree = ref(60)
const sectorRadius = ref(3)
const unitDegree = ref(30)
const unitAngles = [30, 45, 60, 90, 120, 225, 300]
const sectorAngles = [
  { degree: 30, label: 'π/6' },
  { degree: 60, label: 'π/3' },
  { degree: 90, label: 'π/2' },
  { degree: 180, label: 'π' },
]
const functionNames = ['sin', 'cos', 'tan'] as const
const graphFunction = ref<(typeof functionNames)[number]>('sin')
const amplitude = ref(1)
const frequency = ref(1)
const shifted = ref(false)
const equation = ref(0)
const negativeRange = ref(false)
// 绘图采用数学角度，从正横轴逆时针测量。
function radians(degree: number) {
  return (degree * Math.PI) / 180
}
// SVG纵轴向下，因此弧线采用逆时针扫掠；大于180度时保留优弧。
function arc(x: number, y: number, r: number, degree: number) {
  return `M${x + r} ${y}A${r} ${r} 0 ${degree > 180 ? 1 : 0} 0 ${x + r * Math.cos(radians(degree))} ${y - r * Math.sin(radians(degree))}`
}
// 两邻边长度固定为6与8，坐标和余弦定理共享夹角。
const trianglePoint = computed(() => ({
  x: 90 + 270 * Math.cos(radians(triangleAngle.value)),
  y: 300 - 270 * Math.sin(radians(triangleAngle.value)),
}))
// 采用实际边长计算，不把绘图像素当作题目长度。
const triangleSide = computed(() => Math.sqrt(100 - 96 * Math.cos(radians(triangleAngle.value))))
// 余弦定理与面积公式并列展示，防止把面积误当边长的线性变化。
const triangleResult = computed(
  () =>
    String.raw`$a^2=100-96\cos ${triangleAngle.value}^\circ$，$a\approx${triangleSide.value.toFixed(2)}$；$S=24\sin ${triangleAngle.value}^\circ\approx${(24 * Math.sin(radians(triangleAngle.value))).toFixed(2)}$。`,
)
// 两个SSA交点由射线与同一圆联立求得，均为正边长。
const ssaPoints = computed(() =>
  [-1, 1].map((sign) => {
    const length = 10 * Math.cos(Math.PI / 6) + sign * Math.sqrt(49 - 25)
    return {
      x: 90 + 28 * length * Math.cos(Math.PI / 6),
      y: 300 - 28 * length * Math.sin(Math.PI / 6),
    }
  }),
)
const ssaResult = String.raw`$A=30^\circ,\ a=7,\ c=10$，故$\sin C=5/7$。$C\approx45.6^\circ$或$134.4^\circ$，两者均满足$A+C<180^\circ$。`
// 半径使用相同比例绘制，让长度与面积倍率能在图中直接比较。
const sectorDrawingRadius = computed(() => sectorRadius.value * 22)
// 扇形、角弧和结果都从相同圆心角产生。
const sectorPath = computed(
  () => `${arc(280, 185, sectorDrawingRadius.value, sectorDegree.value)}L280 185Z`,
)
// 半径与所选角度只产生精确有限小数系数，π始终保留。
const sectorResult = computed(() => {
  const theta = sectorAngles
    .find((item) => item.degree === sectorDegree.value)!
    .label.replace('π', '\\pi')
  const length = (sectorRadius.value * sectorDegree.value) / 180
  const area = (sectorRadius.value ** 2 * sectorDegree.value) / 360
  return String.raw`$\theta=${theta}$，$l=${length}\pi\,\mathrm{cm}$，$S=${area}\pi\,\mathrm{cm^2}$。`
})
const exactValues: Record<number, { cos: string; sin: string; tan: string }> = {
  30: {
    cos: String.raw`\frac{\sqrt3}{2}`,
    sin: String.raw`\frac12`,
    tan: String.raw`\frac{\sqrt3}{3}`,
  },
  45: { cos: String.raw`\frac{\sqrt2}{2}`, sin: String.raw`\frac{\sqrt2}{2}`, tan: '1' },
  60: { cos: String.raw`\frac12`, sin: String.raw`\frac{\sqrt3}{2}`, tan: String.raw`\sqrt3` },
  90: { cos: '0', sin: '1', tan: '' },
  120: { cos: String.raw`-\frac12`, sin: String.raw`\frac{\sqrt3}{2}`, tan: String.raw`-\sqrt3` },
  225: { cos: String.raw`-\frac{\sqrt2}{2}`, sin: String.raw`-\frac{\sqrt2}{2}`, tan: '1' },
  300: { cos: String.raw`\frac12`, sin: String.raw`-\frac{\sqrt3}{2}`, tan: String.raw`-\sqrt3` },
}
// 单位圆投影按真实三角函数值定位；精确表达式单独保留根式。
const unitPoint = computed(() => ({
  x: 280 + 120 * Math.cos(radians(unitDegree.value)),
  y: 180 - 120 * Math.sin(radians(unitDegree.value)),
}))
// 条形表示投影的平方，不能直接把带符号坐标相加。
const unitCosSquared = computed(() => Math.cos(radians(unitDegree.value)) ** 2)
// 正切在90度无定义，不能用数值浮点误差伪造极大有限值。
const unitResult = computed(() => {
  const values = exactValues[unitDegree.value]!
  return (
    String.raw`$\cos\theta=${values.cos}$；$\sin\theta=${values.sin}$；` +
    (values.tan ? String.raw`$\tan\theta=${values.tan}$。` : 'tan θ 无定义。')
  )
})
// 恒等式的适用域随所选角度变化，特别指出除以零不合法。
const identityResult = computed(() =>
  unitDegree.value === 90
    ? String.raw`$\sin^2\theta+\cos^2\theta=1+0=1$。此时$\cos\theta=0$，不能计算$\tan\theta=\sin\theta/\cos\theta$，也不能将平方和除以$\cos^2\theta$。`
    : String.raw`$\sin^2\theta+\cos^2\theta=1$。此时$\cos\theta\ne0$，可相除得到$\tan\theta=\sin\theta/\cos\theta$与$1+\tan^2\theta=1/\cos^2\theta$。`,
)
// 图像横轴固定为0到2π，方便比较相同窗口内的周期数。
function graphX(x: number) {
  return 55 + (x / (2 * Math.PI)) * 500
}
// 函数输入先减去h再乘b，图形整体右移h，与显示公式保持一致。
function graphValue(x: number) {
  const t = frequency.value * (x - (shifted.value ? Math.PI / 2 : 0))
  return amplitude.value * Math[graphFunction.value](t)
}
// 解b(x-h)=π/2+kπ，只画当前横轴范围内的正切渐近线。
const graphPoles = computed(() =>
  graphFunction.value === 'tan'
    ? Array.from(
        { length: 13 },
        (_, i) =>
          (shifted.value ? Math.PI / 2 : 0) + (Math.PI / 2 + (i - 6) * Math.PI) / frequency.value,
      ).filter((x) => x >= -1e-8 && x <= 2 * Math.PI + 1e-8)
    : [],
)
// 超出显示窗口或穿过无定义点后重新起笔，禁止把渐近线两侧连接起来。
const graphPath = computed(() => {
  let path = '',
    drawing = false
  for (let i = 0; i <= 720; i++) {
    const x = (i / 720) * 2 * Math.PI,
      y = graphValue(x)
    if (
      !Number.isFinite(y) ||
      Math.abs(y) > 2.5 ||
      graphPoles.value.some((pole) => Math.abs(x - pole) < 1e-6)
    ) {
      drawing = false
      continue
    }
    path += `${drawing ? 'L' : 'M'}${graphX(x).toFixed(2)} ${(180 - y * 52).toFixed(2)}`
    drawing = true
  }
  return path
})
// 公式与曲线采样共用a、b、h，避免平移方向不一致。
const graphFormula = computed(
  () =>
    String.raw`$y=${amplitude.value}${'\\' + graphFunction.value}\left(${frequency.value}${shifted.value ? String.raw`(x-\pi/2)` : 'x'}\right)$`,
)
// 正切没有有限振幅，因此只把a称作纵向倍数。
const graphConclusion = computed(() => {
  const period =
    graphFunction.value === 'tan'
      ? frequency.value === 1
        ? String.raw`\pi`
        : String.raw`\pi/2`
      : frequency.value === 1
        ? String.raw`2\pi`
        : String.raw`\pi`
  return `周期 $T=${period}$；${graphFunction.value === 'tan' ? 'tan没有有限振幅' : `振幅为${amplitude.value}`}；${shifted.value ? String.raw`向右平移 $\pi/2$` : '没有横向平移'}。`
})
// 无障碍文字准确描述当前参数，不把所有函数统一称为正弦波。
const graphAria = computed(
  () =>
    `${graphFunction.value}函数，纵向倍数${amplitude.value}，角度倍数${frequency.value}，${shifted.value ? '右移半π' : '不平移'}`,
)
// 区间宽度固定360度，便于观察负角与周期分支如何对应。
const rangeStart = computed(() => (negativeRange.value ? -180 : 0))
// 先枚举参考角两分支及周期，再筛选原变量的闭区间。
const equationRoots = computed(() => {
  const bases = equation.value === 1 ? [120, 240] : [30, 150]
  const multiplier = equation.value === 2 ? 2 : 1
  return [
    ...new Set(
      bases.flatMap((base) =>
        Array.from({ length: 9 }, (_, i) => (base + (i - 4) * 360) / multiplier),
      ),
    ),
  ]
    .filter((x) => x >= rangeStart.value && x <= rangeStart.value + 360)
    .sort((a, b) => a - b)
})
// 交点与曲线采用同一区间坐标，保证标签对应解的位置。
function equationX(degree: number) {
  return 55 + ((degree - rangeStart.value) / 360) * 500
}
// 水平线表示方程右端常数，而不是函数的零线。
const equationTargetY = computed(() => 180 - (equation.value === 1 ? -0.5 : 0.5) * 100)
// 方程曲线共享求根时使用的种类与角度倍数，用交点数复核漏根。
const equationPath = computed(() =>
  Array.from({ length: 361 }, (_, i) => {
    const degree = rangeStart.value + i
    const value =
      equation.value === 1
        ? Math.cos(radians(degree))
        : Math.sin(radians(degree * (equation.value === 2 ? 2 : 1)))
    return `${i ? 'L' : 'M'}${equationX(degree).toFixed(2)} ${(180 - value * 100).toFixed(2)}`
  }).join(''),
)
// 双角方程明确中间变量的范围变化，避免只解一个周期。
const equationReason = computed(() =>
  equation.value === 2
    ? String.raw`$u=2x$，则$${2 * rangeStart.value}^\circ\le u\le${2 * (rangeStart.value + 360)}^\circ$。先解$\sin u=1/2$，所有$u$除以2还原$x$。`
    : equation.value === 1
      ? String.raw`参考角60°；cos为负，对应第二、第三象限。$x=120^\circ+360^\circ k$或$240^\circ+360^\circ k$，$k\in\mathbb Z$。`
      : String.raw`参考角30°；sin为正，对应第一、第二象限。$x=30^\circ+360^\circ k$或$150^\circ+360^\circ k$，$k\in\mathbb Z$。`,
)
</script>
<style scoped>
.math2-trigonometry {
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
  letter-spacing: 1.4px;
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
  max-height: 380px;
  margin: 16px 0;
}
svg text {
  font-size: 24px;
  font-family: inherit;
  fill: #193c58;
}
.shape {
  fill: #dcedfa;
  stroke: #286aba;
  stroke-width: 3;
}
.alternative {
  fill: #d9eee980;
  stroke: #138679;
  stroke-width: 3;
}
.curve {
  fill: none;
  stroke: #286aba;
  stroke-width: 3;
}
.angle {
  fill: none;
  stroke: #bb8224;
  stroke-width: 2;
}
.axis {
  fill: none;
  stroke: #829caf;
  stroke-width: 2;
}
.guide {
  fill: none;
  stroke: #99aebd;
  stroke-width: 2;
  stroke-dasharray: 5 5;
}
.projection,
.target {
  fill: none;
  stroke: #138679;
  stroke-width: 2;
}
.grid {
  fill: none;
  stroke: #dce7ed;
  stroke-width: 1;
}
.asymptote {
  fill: none;
  stroke: #bb8224;
  stroke-width: 2;
  stroke-dasharray: 5 5;
}
.point {
  fill: #c88a25;
  stroke: white;
  stroke-width: 2;
}
.result {
  border-left: 3px solid #2679a2;
  padding: 12px 14px;
  background: #e7f1fa;
  font-weight: 600;
}
.formula {
  padding: 8px 14px;
  background: white;
  border-radius: 8px;
}
.squared-bar {
  display: flex;
  height: 30px;
  margin-top: 15px;
  border-radius: 7px;
  overflow: hidden;
}
.cos-square {
  background: #286aba;
}
.sin-square {
  background: #138679;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}
.legend > :first-child {
  color: #286aba;
}
.legend > :nth-child(2) {
  color: #138679;
}
@media (max-width: 600px) {
  .math2-trigonometry {
    padding: 12px;
  }
  h5 {
    font-size: 18px;
  }
  .controls {
    gap: 6px;
  }
}
</style>
