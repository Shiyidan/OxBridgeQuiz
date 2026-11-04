<!-- 数学2积分互动图解：在概念讲解中连接符号面积、原函数、区间合并、梯形估计与初值。 -->
<template>
  <figure class="math2-integration" :aria-label="heading">
    <figcaption>
      <span>MATHEMATICS 2 · INTEGRATION</span>
      <h5>{{ heading }}</h5>
      <p>{{ introduction }}</p>
    </figcaption>
    <div v-if="mode === 1" class="controls" role="group" aria-label="比较面积与有向积分">
      <AppButton
        v-for="item in [
          { value: false, label: '有向积分' },
          { value: true, label: '几何面积' },
        ]"
        :key="String(item.value)"
        size="small"
        :type="absoluteArea === item.value ? 'primary' : 'secondary'"
        :aria-pressed="absoluteArea === item.value"
        @click="absoluteArea = item.value"
        >{{ item.label }}</AppButton
      >
    </div>
    <div v-else-if="mode === 2" class="controls" role="group" aria-label="选择幂指数">
      <AppButton
        v-for="n in [-2, -0.5, 0, 1, 2]"
        :key="n"
        size="small"
        :type="power === n ? 'primary' : 'secondary'"
        :aria-pressed="power === n"
        @click="power = n"
        >n = {{ n }}</AppButton
      >
    </div>
    <div v-else-if="mode === 3" class="controls" role="group" aria-label="移动积分上限">
      <AppButton
        v-for="x in [0.5, 1, 1.5, 2]"
        :key="x"
        size="small"
        :type="upper === x ? 'primary' : 'secondary'"
        :aria-pressed="upper === x"
        @click="upper = x"
        >上限 x = {{ x }}</AppButton
      >
    </div>
    <div v-else-if="mode === 4" class="controls" role="group" aria-label="拆分与反转积分区间">
      <AppButton
        v-for="x in [0, 1]"
        :key="x"
        size="small"
        :type="split === x ? 'primary' : 'secondary'"
        :aria-pressed="split === x"
        @click="split = x"
        >分界点 {{ x }}</AppButton
      >
      <AppButton
        size="small"
        :type="reverse ? 'primary' : 'secondary'"
        :aria-pressed="reverse"
        @click="reverse = !reverse"
        >{{ reverse ? '方向：2 → −1' : '方向：−1 → 2' }}</AppButton
      >
    </div>
    <template v-else-if="mode === 5">
      <div class="controls" role="group" aria-label="选择曲线弯向">
        <AppButton
          v-for="(name, i) in ['向上弯：x²', '向下弯：4 − x²', '直线：2x']"
          :key="name"
          size="small"
          :type="shape === i ? 'primary' : 'secondary'"
          :aria-pressed="shape === i"
          @click="shape = i"
          >{{ name }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="选择梯形分段数">
        <AppButton
          v-for="n in [1, 2, 4, 8]"
          :key="n"
          size="small"
          :type="strips === n ? 'primary' : 'secondary'"
          :aria-pressed="strips === n"
          @click="strips = n"
          >{{ n }} 段</AppButton
        >
      </div>
    </template>
    <div v-else class="controls" role="group" aria-label="改变初值">
      <AppButton
        v-for="y in [0, 1, 3]"
        :key="y"
        size="small"
        :type="initialY === y ? 'primary' : 'secondary'"
        :aria-pressed="initialY === y"
        @click="initialY = y"
        >y(1) = {{ y }}</AppButton
      >
    </div>
    <p class="formula"><LatexText :text="formula" /></p>
    <svg viewBox="0 0 560 340" role="img" :aria-label="graphDescription">
      <title>{{ graphDescription }}</title>
      <g v-for="y in yTicks" :key="'y' + y">
        <path :d="'M55 ' + sy(y) + 'H505'" class="grid" />
        <text x="43" :y="sy(y) + 5" text-anchor="end">{{ y }}</text>
      </g>
      <g v-for="x in xTicks" :key="'x' + x">
        <path :d="'M' + sx(x) + ' 25V280'" class="grid" />
        <text :x="sx(x)" y="306" text-anchor="middle">{{ x }}</text>
      </g>
      <path :d="'M55 ' + sy(0) + 'H520'" class="axis" />
      <path v-if="limits.xMin <= 0" :d="'M' + sx(0) + ' 290V18'" class="axis" />
      <text x="522" :y="sy(0) - 6">x</text>
      <text x="57" y="17">y</text>
      <template v-if="mode === 5">
        <polygon v-for="(polygon, i) in trapezia" :key="i" :points="polygon" class="trapezium" />
      </template>
      <template v-else>
        <path
          v-for="(region, i) in regions"
          :key="i"
          :d="region.path"
          :class="['fill', region.negative ? 'negative' : 'positive']"
        />
      </template>
      <template v-if="mode === 6">
        <path v-for="c in [-1, 0, 2]" :key="c" :d="curvePath((x) => x * x + c)" class="family" />
      </template>
      <path :d="curvePath(value)" class="curve" />
      <path
        v-if="mode === 4"
        :d="'M' + sx(split) + ' ' + sy(0) + 'V' + sy(value(split))"
        class="divider"
      />
      <circle v-if="mode === 3" :cx="sx(upper)" :cy="sy(value(upper))" r="6" class="point" />
      <circle v-if="mode === 6" :cx="sx(1)" :cy="sy(initialY)" r="6" class="point" />
    </svg>
    <div class="result" aria-live="polite"><LatexText :text="conclusion" /></div>
    <template v-if="mode === 5">
      <div class="stats">
        <span
          >步长 <b>{{ number(2 / strips) }}</b></span
        >
        <span
          >估计值 <b>{{ number(estimate) }}</b></span
        >
        <span
          >精确值 <b>{{ exactLabel }}</b></span
        >
        <span
          >偏差 <b>{{ number(estimate - exact) }}</b></span
        >
      </div>
      <p>
        浅色梯形是用弦代替曲线；所有模型在 [0, 2]
        上非负，因此此处定积分也是几何面积。改变分段数，观察两者如何接近。
      </p>
    </template>
    <p v-else-if="mode === 2">
      图中只画被积函数，在正区间 [0.5, 2] 上观察；指数 −1 不适用幂积分规则，不能令分母为0。
    </p>
    <p v-else-if="mode === 6">
      灰线表示相同导数对应的不同原函数；蓝线是当前初值选中的曲线。改变初值只会改变高度，不改变斜率。
    </p>
    <p v-else-if="mode === 4">
      阴影位置不随积分方向改变，但反转方向会使每段积分及总积分都变号。区间拼接累计的是带符号的量。
    </p>
    <p v-else>蓝色表示横轴上方，橙色表示横轴下方；计算几何面积时，下方部分按正面积计入。</p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
const absoluteArea = ref(false)
const power = ref(2)
const upper = ref(1)
const split = ref(0)
const reverse = ref(false)
const shape = ref(0)
const strips = ref(2)
const initialY = ref(1)

// 精确叶子编号决定图解模式，避免跨节误用上一节的计算模型。
const mode = computed(() => Number(props.topic.slice(-2)) || 1)
// 页面切换知识点时重置交互，保证首次看到的是与讲解一致的基础状态。
watch(
  () => props.topic,
  () => {
    absoluteArea.value = false
    power.value = 2
    upper.value = 1
    split.value = 0
    reverse.value = false
    shape.value = 0
    strips.value = 2
    initialY.value = 1
  },
)
// 每节标题强调需要观察的区别，避免只复述公式名称。
const heading = computed(
  () =>
    [
      '同一块阴影，两种不同的总量',
      '求导与积分：指数怎样往返？',
      '移动上限，看累计量怎样增长',
      '拆成两段，方向决定符号',
      '用直线代替曲线，误差朝哪边？',
      '斜率相同，初值选择一条曲线',
    ][mode.value - 1] ?? '积分与累计',
)
// 说明控件与教学目标的关系。
const introduction = computed(
  () =>
    [
      '观察 y = x 从 −1 到 2 的两块区域，再切换积分与面积。',
      '改变幂指数，同时核对原函数、系数与定积分；图形在被积函数的有效正区间内展示。',
      '变化率为 2x，上限向右移动时，新加入的一小条决定累计量的变化率。',
      '在不同位置拆开同一段积分；反转方向后检查每一段的符号。',
      '比较向上弯、向下弯和直线；再增加分段数，检查近似与精确值。',
      '已知 dy/dx = 2x，改变 y(1) 后观察积分常数和曲线的平移。',
    ][mode.value - 1] ?? '',
)
// 不同模型使用明确坐标范围，避免负幂奇点与初值曲线越界。
const limits = computed(() => {
  if (mode.value === 1 || mode.value === 4) return { xMin: -1.2, xMax: 2.2, yMin: -1.2, yMax: 2.5 }
  if (mode.value === 2) return { xMin: 0.4, xMax: 2.1, yMin: 0, yMax: 4.5 }
  if (mode.value === 6) return { xMin: -1.5, xMax: 1.5, yMin: -1.5, yMax: 4.5 }
  return { xMin: 0, xMax: 2.2, yMin: 0, yMax: 4.5 }
})
// 坐标刻度按模型取值，移动坐标范围时保持标签有意义。
const xTicks = computed(() =>
  mode.value === 6
    ? [-1, 0, 1]
    : mode.value === 2
      ? [0.5, 1, 1.5, 2]
      : mode.value === 1 || mode.value === 4
        ? [-1, 0, 1, 2]
        : [0, 0.5, 1, 1.5, 2],
)
// 只输出当前可视范围内的整数纵坐标。
const yTicks = computed(() =>
  [-1, 0, 1, 2, 3, 4].filter((y) => y >= limits.value.yMin && y <= limits.value.yMax),
)

// 把数学横坐标映射到固定画布的绘图区域。
function sx(x: number) {
  return 55 + ((x - limits.value.xMin) / (limits.value.xMax - limits.value.xMin)) * 450
}
// 把数学纵坐标映射到向下增长的SVG纵坐标。
function sy(y: number) {
  return 280 - ((y - limits.value.yMin) / (limits.value.yMax - limits.value.yMin)) * 255
}
// 当前模型的函数值与积分/近似使用同一来源，防止图形与数值脱节。
function value(x: number): number {
  if (mode.value === 1 || mode.value === 4) return x
  if (mode.value === 2) return x ** power.value
  if (mode.value === 6) return x * x + initialY.value - 1
  if (mode.value === 5) return shape.value === 0 ? x * x : shape.value === 1 ? 4 - x * x : 2 * x
  return 2 * x
}
// 在有效区间采样曲线；越过显示范围时中断路径，不连接不可见部分。
function curvePath(fn: (x: number) => number): string {
  const start =
    mode.value === 2 ? 0.5 : mode.value === 1 || mode.value === 4 ? -1 : limits.value.xMin
  const end = mode.value === 6 ? 1.5 : 2
  let path = ''
  let drawing = false
  for (let i = 0; i <= 160; i++) {
    const x = start + ((end - start) * i) / 160
    const y = fn(x)
    if (!Number.isFinite(y) || y < limits.value.yMin || y > limits.value.yMax) {
      drawing = false
      continue
    }
    path += (drawing ? 'L' : 'M') + sx(x).toFixed(2) + ' ' + sy(y).toFixed(2)
    drawing = true
  }
  return path
}
// 每块阴影以横轴闭合，在穿轴点分开后可分别表达正负贡献。
function areaPath(a: number, b: number): string {
  let result = 'M' + sx(a) + ' ' + sy(0)
  for (let i = 0; i <= 80; i++) {
    const x = a + ((b - a) * i) / 80
    result += 'L' + sx(x).toFixed(2) + ' ' + sy(value(x)).toFixed(2)
  }
  return result + 'L' + sx(b) + ' ' + sy(0) + 'Z'
}
// 积分区间按教学任务划分；初值曲线不填充无关面积。
const regions = computed(() => {
  if (mode.value === 1 || mode.value === 4)
    return [
      { path: areaPath(-1, 0), negative: true },
      { path: areaPath(0, 2), negative: false },
    ]
  if (mode.value === 2) return [{ path: areaPath(0.5, 2), negative: false }]
  if (mode.value === 3) return [{ path: areaPath(0, upper.value), negative: false }]
  return []
})
// 等宽梯形的四个顶点由实际采样值生成，端点与近似计算保持一致。
const trapezia = computed(() =>
  Array.from({ length: strips.value }, (_, i) => {
    const a = (2 * i) / strips.value
    const b = (2 * (i + 1)) / strips.value
    return [
      [sx(a), sy(0)],
      [sx(a), sy(value(a))],
      [sx(b), sy(value(b))],
      [sx(b), sy(0)],
    ]
      .map((p) => p.join(','))
      .join(' ')
  }),
)
// 梯形法则对每一段独立求和，兼容三种曲率模型。
const estimate = computed(() => {
  const h = 2 / strips.value
  let total = 0
  for (let i = 0; i < strips.value; i++) total += (h * (value(i * h) + value((i + 1) * h))) / 2
  return total
})
// 精确积分用各模型的解析结果校核，避免把近似作为标准值。
const exact = computed(() => (shape.value === 0 ? 8 / 3 : shape.value === 1 ? 16 / 3 : 4))
// 以精确分数标识参考结果，近似小数另行展示。
const exactLabel = computed(() => (shape.value === 0 ? '8/3' : shape.value === 1 ? '16/3' : '4'))
// 展示小数时固定精度并消除浮点负零。
function number(n: number): string {
  return Math.abs(n) < 1e-8 ? '0' : String(Number(n.toFixed(4)))
}
// 公式随交互更新，幂规则特别保留常数与除以新指数。
const formula = computed(() => {
  if (mode.value === 1) return '$y=x,\\quad -1\\le x\\le2$'
  if (mode.value === 2) {
    const n = power.value,
      next = n + 1
    return '$\\int x^{' + n + '}\\,dx=\\frac{x^{' + next + '}}{' + next + '}+C$'
  }
  if (mode.value === 3) return '$A(x)=\\int_0^x2t\\,dt=x^2,\\quad A^{\\prime}(x)=2x$'
  if (mode.value === 4)
    return reverse.value
      ? '$\\int_2^{-1}x\\,dx=\\int_2^{' +
          split.value +
          '}x\\,dx+\\int_{' +
          split.value +
          '}^{-1}x\\,dx$'
      : '$\\int_{-1}^2x\\,dx=\\int_{-1}^{' +
          split.value +
          '}x\\,dx+\\int_{' +
          split.value +
          '}^2x\\,dx$'
  if (mode.value === 5) return '$T_n=\\frac h2[y_0+2y_1+\\cdots+2y_{n-1}+y_n],\\quad h=2/n$'
  return '$\\frac{dy}{dx}=2x\\Rightarrow y=x^2+C,\\quad y(1)=' + initialY.value + '$'
})
// 数值结论同时解释符号与条件，不能只更新答案而保留过期说明。
const conclusion = computed(() => {
  if (mode.value === 1)
    return absoluteArea.value
      ? '几何面积：$1/2+2=5/2$。下方三角形也按正面积计入。'
      : '有向积分：$-1/2+2=3/2$。下方三角形作负贡献。'
  if (mode.value === 2) {
    const n = power.value + 1
    return (
      '$\\int_{0.5}^{2}x^{' +
      power.value +
      '}\\,dx\\approx ' +
      number((2 ** n - 0.5 ** n) / n) +
      '$（小数按四位取近似）。对原函数求导可回到 $x^{' +
      power.value +
      '}$。'
    )
  }
  if (mode.value === 3)
    return (
      '上限为 ' +
      upper.value +
      ' 时，累计量 $A=' +
      number(upper.value ** 2) +
      '$，但此刻增长率 $A^{\\prime}=' +
      number(2 * upper.value) +
      '$；面积与增长率不是同一个数值概念。'
    )
  if (mode.value === 4) {
    const left = (split.value ** 2 - 1) / 2
    const right = (4 - split.value ** 2) / 2
    const a = reverse.value ? -right : left,
      b = reverse.value ? -left : right
    return (
      '按当前方向，两段积分为 $(' +
      number(a) +
      ')+(' +
      number(b) +
      ')=' +
      (reverse.value ? '-1.5' : '1.5') +
      '$。分界点改变，总积分不变。'
    )
  }
  if (mode.value === 5)
    return shape.value === 0
      ? '向上弯：弦在曲线上方，梯形高估。增加分段数后，本模型的正偏差减小。'
      : shape.value === 1
        ? '向下弯：弦在曲线下方，梯形低估。虽然函数递减，判断仍来自弯向而非增减。'
        : '直线：弦与函数重合，每一段都精确，所以分段数改变也没有误差。'
  const c = initialY.value - 1
  return (
    '$1+C=' +
    initialY.value +
    '\\Rightarrow C=' +
    c +
    '$。蓝线为 $y=x^2' +
    (c < 0 ? c : c > 0 ? '+' + c : '') +
    '$；求导仍为 $2x$。'
  )
})
// 提供完整文本替代信息，屏幕阅读器无需解读SVG坐标即可理解当前状态。
const graphDescription = computed(
  () => heading.value + '。' + introduction.value + '。' + conclusion.value.replaceAll('$', ''),
)
</script>

<style scoped lang="scss">
.math2-integration {
  margin: 0;
  padding: 20px;
  border: 1px solid #c8e4e1;
  border-radius: 14px;
  background: linear-gradient(120deg, #f0f7ff, #f4fbfa);
  min-width: 0;
  color: var(--color-ink);
  figcaption > span {
    color: #0f766e;
    font-size: 11px;
    letter-spacing: 0.12em;
    font-weight: 700;
  }
  h5 {
    margin: 8px 0;
    font-size: 20px;
    line-height: 1.4;
  }
  p {
    font-size: 14px;
    line-height: 1.7;
    margin: 10px 0;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 12px 0;
  }
  // 沿用数学2前六章的教学控件配色，避免黑色主按钮抢占图解的视觉重点。
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
    padding: 10px 12px;
    background: #fff;
    border: 1px solid #c8e4e1;
    border-radius: 8px;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 340px;
    background: #fff;
    border-radius: 10px;
  }
  svg text {
    font-size: 20px;
    fill: #52616c;
  }
  .grid {
    stroke: #e8eef1;
    stroke-width: 1;
  }
  .axis {
    stroke: #657784;
    stroke-width: 1.4;
    fill: none;
  }
  .curve {
    stroke: #2563eb;
    stroke-width: 3;
    fill: none;
  }
  .fill.positive {
    fill: #2563eb;
    fill-opacity: 0.13;
  }
  .fill.negative {
    fill: #ea8636;
    fill-opacity: 0.22;
  }
  .trapezium {
    fill: #0d9488;
    fill-opacity: 0.12;
    stroke: #0f766e;
    stroke-width: 1.3;
  }
  .divider {
    stroke: #0f766e;
    stroke-width: 2;
    stroke-dasharray: 4 3;
  }
  .family {
    fill: none;
    stroke: #b7c4cc;
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
  }
  .point {
    fill: #0f766e;
    stroke: #fff;
    stroke-width: 2;
  }
  .result {
    margin-top: 12px;
    padding: 12px 14px;
    border-left: 3px solid #0d9488;
    background: #edf8f6;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }
  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 20px;
    padding: 12px 0;
    font-size: 13px;
  }
  .stats b {
    color: #0f766e;
    margin-left: 5px;
  }
}
@media (max-width: 600px) {
  .math2-integration {
    padding: 14px;
  }
  .math2-integration svg text {
    font-size: 22px;
  }
  .math2-integration h5 {
    font-size: 18px;
  }
  .math2-integration .controls {
    gap: 6px;
  }
}
</style>
