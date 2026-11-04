<!-- TMUA 不等式互动图解：比较二次曲线的零点、符号区间与端点。 -->
<template>
  <figure class="tmua-inequalities" aria-labelledby="tmua-inequalities-title">
    <figcaption>
      <span>TMUA · INEQUALITIES</span>
      <h5 id="tmua-inequalities-title">从图像读出不等式的解</h5>
      <p>改变零点情况与不等号，观察曲线和数轴上选中的区间。</p>
    </figcaption>
    <div class="controls" role="group" aria-label="选择二次函数零点情况">
      <AppButton
        v-for="item in models"
        :key="item.id"
        size="small"
        :type="model === item.id ? 'primary' : 'secondary'"
        :aria-pressed="model === item.id"
        @click="model = item.id"
        >{{ item.label }}</AppButton
      >
    </div>
    <div class="controls" role="group" aria-label="选择不等号">
      <span>求解</span>
      <AppButton
        v-for="item in operators"
        :key="item.id"
        size="small"
        :type="operator === item.id ? 'primary' : 'secondary'"
        :aria-pressed="operator === item.id"
        @click="operator = item.id"
        >{{ item.label }}</AppButton
      >
    </div>
    <div class="equation"><LatexText :text="expression" /></div>
    <svg viewBox="0 0 420 290" role="img" :aria-label="accessibleLabel">
      <path d="M40 150H380 M210 215V20" class="axis" />
      <path :d="curvePath" class="curve" />
      <g v-for="tick in ticks" :key="tick">
        <path :d="`M${toX(tick)} 146V154`" class="axis" />
        <text :x="toX(tick)" y="172" text-anchor="middle">{{ tick }}</text>
      </g>
      <text x="380" y="140">x</text>
      <text x="218" y="28">y</text>
      <text x="40" y="231" class="numberline-label">解集数轴</text>
      <path d="M50 255H370" class="numberline" />
      <path v-for="(line, index) in segments" :key="index" :d="line" class="selected" />
      <circle
        v-for="root in roots"
        :key="root"
        :cx="toX(root)"
        cy="255"
        r="6"
        :class="includeBoundary ? 'closed' : 'open'"
      />
      <text v-for="root in roots" :key="`label${root}`" :x="toX(root)" y="280" text-anchor="middle">
        {{ root }}
      </text>
    </svg>
    <div class="result" aria-live="polite">
      <span>解集</span><LatexText :text="solution" />
      <p>{{ reasoning }}</p>
    </div>
    <p class="note">
      图像只显示部分范围；数轴两端的线段表示继续向外延伸。等号决定零点是否包含在解集中。
    </p>
  </figure>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '../AppButton.vue'
import LatexText from '../LatexText.vue'

defineProps<{ topic?: string }>()
type Model = 'two' | 'double' | 'none'
type Operator = 'gt' | 'ge' | 'lt' | 'le'
const models: { id: Model; label: string }[] = [
  { id: 'two', label: '两个零点' },
  { id: 'double', label: '重根' },
  { id: 'none', label: '没有零点' },
]
const operators: { id: Operator; label: string }[] = [
  { id: 'gt', label: '> 0' },
  { id: 'ge', label: '≥ 0' },
  { id: 'lt', label: '< 0' },
  { id: 'le', label: '≤ 0' },
]
const model = ref<Model>('two')
const operator = ref<Operator>('lt')
const ticks = [-3, -2, -1, 0, 1, 2, 3]
const symbol: Record<Operator, string> = {
  gt: '>',
  ge: String.raw`\ge`,
  lt: '<',
  le: String.raw`\le`,
}
// 三个模型开口均向上，比较两根、重根和无实根对符号的影响。
const offset = computed(() => (model.value === 'two' ? -1 : model.value === 'none' ? 1 : 0))
// 零点位置由同一模型确定，供端点和数轴共用。
const roots = computed(() =>
  model.value === 'two' ? [-1, 1] : model.value === 'double' ? [0] : [],
)
// 非严格不等号才允许取到零点。
const includeBoundary = computed(() => operator.value === 'ge' || operator.value === 'le')
// 图示方程与选中的符号条件保持同步。
const expression = computed(
  () =>
    `$x^2${offset.value === 0 ? '' : offset.value > 0 ? '+1' : '-1'}${symbol[operator.value]}0$`,
)
// 横轴上每个单位对应相同长度，曲线与数轴共享坐标。
function toX(x: number): number {
  return 210 + x * (160 / 3)
}
// 绘制当前二次式，避免图像与解集脱节。
const curvePath = computed(() =>
  Array.from({ length: 81 }, (_, i) => {
    const x = -3 + (i * 6) / 80
    return `${i === 0 ? 'M' : 'L'}${toX(x).toFixed(2)} ${(150 - 14 * (x * x + offset.value)).toFixed(2)}`
  }).join(' '),
)
// 根据零点数量和不等号确定完整解集。
const solution = computed(() => {
  if (model.value === 'none')
    return operator.value === 'gt' || operator.value === 'ge'
      ? String.raw`$x\in\mathbb R$`
      : String.raw`$\varnothing$`
  if (model.value === 'double')
    return {
      gt: '$x<0$ 或 $x>0$',
      ge: String.raw`$x\in\mathbb R$`,
      lt: String.raw`$\varnothing$`,
      le: '$x=0$',
    }[operator.value]
  return {
    gt: '$x<-1$ 或 $x>1$',
    ge: String.raw`$x\le-1$ 或 $x\ge1$`,
    lt: '$-1<x<1$',
    le: String.raw`$-1\le x\le1$`,
  }[operator.value]
})
// 每条高亮线段与解集文字由同一状态计算，重根的单点用闭点表达。
const segments = computed(() => {
  if (model.value === 'none')
    return operator.value === 'gt' || operator.value === 'ge' ? ['M50 255H370'] : []
  if (model.value === 'double') {
    if (operator.value === 'ge') return ['M50 255H370']
    if (operator.value === 'gt') return ['M50 255H210', 'M210 255H370']
    return []
  }
  return operator.value === 'gt' || operator.value === 'ge'
    ? [`M50 255H${toX(-1)}`, `M${toX(1)} 255H370`]
    : [`M${toX(-1)} 255H${toX(1)}`]
})
// 按零点情况解释符号，不把屏幕截取范围误当作定义域。
const reasoning = computed(() =>
  model.value === 'two'
    ? '抛物线在两根之间位于横轴下方，外侧位于上方。'
    : model.value === 'double'
      ? '曲线只在零点接触横轴；其余地方均位于横轴上方。'
      : '曲线始终位于横轴上方，因此没有等于零或小于零的点。',
)
// 无障碍说明与当前模型和符号同步更新。
const accessibleLabel = computed(
  () =>
    `二次函数图像，${models.find((item) => item.id === model.value)?.label}，选择 ${operators.find((item) => item.id === operator.value)?.label}；${reasoning.value}`,
)
</script>
<style scoped>
.tmua-inequalities {
  margin: 0;
  padding: 22px;
  border: 1px solid #cee2ee;
  border-radius: 14px;
  background: #f2f8fc;
  color: #183248;
  min-width: 0;
}
figcaption > span {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: #136f85;
  font-weight: 700;
}
h5 {
  font-size: 19px;
  margin: 8px 0;
}
figcaption p,
.note {
  font-size: 14px;
  line-height: 1.65;
  color: #526b7d;
  margin: 0 0 14px;
}
.controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}
.controls > span {
  font-size: 14px;
  color: #526b7d;
}
.equation {
  padding: 8px 12px;
  border-radius: 8px;
  background: white;
}
svg {
  display: block;
  width: 100%;
  max-height: 290px;
}
svg text {
  font-size: 13px;
  fill: #607787;
}
.axis {
  stroke: #91a7b5;
  stroke-width: 1.5;
}
.curve {
  fill: none;
  stroke: #2268bb;
  stroke-width: 3;
}
.numberline {
  stroke: #b8c9d0;
  stroke-width: 3;
}
.selected {
  stroke: #0b887e;
  stroke-width: 5;
}
.open {
  fill: white;
  stroke: #0b887e;
  stroke-width: 3;
}
.closed {
  fill: #0b887e;
  stroke: white;
  stroke-width: 2;
}
.numberline-label {
  fill: #607787;
}
.result {
  background: #fff;
  border: 1px solid #dce9ef;
  border-radius: 10px;
  padding: 12px 15px;
}
.result > span:first-child {
  color: #087b75;
  font-size: 14px;
  font-weight: 700;
  margin-right: 14px;
}
.result p {
  margin: 8px 0 0;
  color: #526b7d;
  font-size: 14px;
  line-height: 1.5;
}
.note {
  margin: 14px 0 0;
}
@media (max-width: 600px) {
  .tmua-inequalities {
    padding: 16px;
  }
}
</style>
