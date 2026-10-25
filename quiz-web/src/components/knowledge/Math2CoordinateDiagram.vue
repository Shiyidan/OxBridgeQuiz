<!-- 数学2第3章坐标几何互动图解：按3个考点切换直线斜率截距、圆与直线的位置关系、圆内弦角性质，用于知识点讲解页。 -->
<template>
  <figure class="math2-coordinate" :aria-label="heading">
    <figcaption>
      <span class="visual-label">MATHEMATICS 2 · 坐标几何实验室</span>
      <h5>{{ heading }}</h5>
      <p>{{ invitation }}</p>
    </figcaption>

    <template v-if="activeTopic === '120301'">
      <div class="controls" role="group" aria-label="选择斜率 m">
        <span class="control-label">斜率</span>
        <AppButton
          v-for="m in slopes"
          :key="'m' + m"
          type="secondary"
          size="small"
          :aria-pressed="mPick === m"
          @click="mPick = m"
          >m = {{ m }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="选择截距 c">
        <span class="control-label">截距</span>
        <AppButton
          v-for="c in intercepts"
          :key="'c' + c"
          type="secondary"
          size="small"
          :aria-pressed="cPick === c"
          @click="cPick = c"
          >c = {{ c }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="选择直线的相对位置">
        <span class="control-label">关系</span>
        <AppButton
          v-for="item in lineRelations"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="lineMode === item.id"
          @click="lineMode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="lineFormula" /></div>
      <svg viewBox="0 0 480 330" role="img" :aria-label="lineAria">
        <g v-for="tick in xTicks" :key="'x' + tick">
          <line :x1="sx(tick)" y1="30" :x2="sx(tick)" y2="300" class="grid" />
          <text :x="sx(tick)" y="322" class="tick-label">{{ tick }}</text>
        </g>
        <g v-for="tick in yTicks" :key="'y' + tick">
          <line x1="60" :y1="sy(tick)" x2="420" :y2="sy(tick)" class="grid" />
          <text x="46" :y="sy(tick) + 5" class="tick-label">{{ tick }}</text>
        </g>
        <path :d="'M60 ' + sy(0) + 'H420M' + sx(0) + ' 30V300'" class="axis" />
        <text x="430" :y="sy(0) + 5" class="tick-label">x</text>
        <text :x="sx(0)" y="20" class="tick-label">y</text>
        <path v-if="secondLine" :d="secondLinePath" class="line-secondary" />
        <path :d="mainLinePath" class="line-main" />
        <path v-if="rightAnglePath" :d="rightAnglePath" class="right-angle" />
        <g v-for="(point, i) in lineMarks" :key="'lm' + i">
          <circle :cx="sx(point.x)" :cy="sy(point.y)" r="5" class="mark" />
          <text :x="sx(point.x) + point.dx" :y="sy(point.y) + point.dy" class="point-label">{{
            point.label
          }}</text>
        </g>
      </svg>
      <p class="insight"><LatexText :text="lineInsight" /></p>
    </template>

    <template v-else-if="activeTopic === '120302'">
      <div class="controls" role="group" aria-label="选择直线与圆的位置">
        <AppButton
          v-for="item in circleModes"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="circleMode === item.id"
          @click="circleMode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="circleFormula" /></div>
      <svg viewBox="0 0 480 330" role="img" :aria-label="circleAria">
        <g v-for="tick in xTicks" :key="'cx' + tick">
          <line :x1="sx(tick)" y1="30" :x2="sx(tick)" y2="300" class="grid" />
          <text :x="sx(tick)" y="322" class="tick-label">{{ tick }}</text>
        </g>
        <g v-for="tick in yTicks" :key="'cy' + tick">
          <line x1="60" :y1="sy(tick)" x2="420" :y2="sy(tick)" class="grid" />
          <text x="46" :y="sy(tick) + 5" class="tick-label">{{ tick }}</text>
        </g>
        <path :d="'M60 ' + sy(0) + 'H420M' + sx(0) + ' 30V300'" class="axis" />
        <text x="430" :y="sy(0) + 5" class="tick-label">x</text>
        <text :x="sx(0)" y="20" class="tick-label">y</text>
        <circle
          :cx="sx(circleCenter.a)"
          :cy="sy(circleCenter.b)"
          :r="circleRadius * unitScale"
          class="circle-shape"
        />
        <line
          x1="60"
          :y1="sy(circleLineY)"
          x2="420"
          :y2="sy(circleLineY)"
          class="intersect-line"
        />
        <line
          :x1="sx(circleCenter.a)"
          :y1="sy(circleCenter.b)"
          :x2="sx(circleCenter.a)"
          :y2="sy(circleLineY)"
          class="distance-line"
        />
        <line
          :x1="sx(circleCenter.a)"
          :y1="sy(circleCenter.b)"
          :x2="sx(circleRadiusPoint.x)"
          :y2="sy(circleCenter.b)"
          class="radius-line"
        />
        <path v-if="tangentRightAngle" :d="tangentRightAngle" class="right-angle" />
        <circle
          :cx="sx(circleCenter.a)"
          :cy="sy(circleCenter.b)"
          r="5"
          class="center-dot"
        />
        <text :x="sx(circleCenter.a) - 12" :y="sy(circleCenter.b) + 20" class="point-label">O</text>
        <text
          :x="sx(circleRadiusPoint.x) - 14"
          :y="sy(circleCenter.b) - 8"
          text-anchor="end"
          class="point-label"
          >r = {{ circleRadius }}</text
        >
        <text
          :x="sx(circleCenter.a) + 10"
          :y="sy(circleCenter.b + circleD / 2) + 5"
          text-anchor="start"
          class="point-label"
          >d = {{ circleD }}</text
        >
        <g v-for="(point, i) in circlePoints" :key="'cp' + i">
          <circle :cx="sx(point.x)" :cy="sy(point.y)" r="5" class="mark mark-amber" />
          <text
            :x="sx(point.x) + point.dx"
            :y="sy(point.y) + point.dy"
            class="point-label point-label-amber"
            >{{ point.label }}</text
          >
        </g>
      </svg>
      <p class="insight"><LatexText :text="circleInsight" /></p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="选择圆内角关系">
        <AppButton
          v-for="item in propertyModes"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="propertyMode === item.id"
          @click="propertyMode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="formula-stage"><LatexText :text="propertyFormula" /></div>
      <svg viewBox="0 0 480 330" role="img" :aria-label="propertyAria">
        <g v-for="tick in xTicks" :key="'px' + tick">
          <line :x1="sx(tick)" y1="30" :x2="sx(tick)" y2="300" class="grid" />
          <text :x="sx(tick)" y="322" class="tick-label">{{ tick }}</text>
        </g>
        <g v-for="tick in yTicks" :key="'py' + tick">
          <line x1="60" :y1="sy(tick)" x2="420" :y2="sy(tick)" class="grid" />
          <text x="46" :y="sy(tick) + 5" class="tick-label">{{ tick }}</text>
        </g>
        <path :d="'M60 ' + sy(0) + 'H420M' + sx(0) + ' 30V300'" class="axis" />
        <text x="430" :y="sy(0) + 5" class="tick-label">x</text>
        <text :x="sx(0)" y="20" class="tick-label">y</text>
        <circle :cx="sx(0)" :cy="sy(0)" :r="propRadius * unitScale" class="circle-shape" />
        <line :x1="sx(chordA.x)" :y1="sy(chordA.y)" :x2="sx(chordB.x)" :y2="sy(chordB.y)" class="chord" />
        <line
          :x1="sx(propCenter.x)"
          :y1="sy(propCenter.y)"
          :x2="sx(chordM.x)"
          :y2="sy(chordM.y)"
          class="perpendicular-line"
        />
        <path :d="rightAngleAtM" class="right-angle" />
        <line
          v-for="(tick, i) in segmentTicks"
          :key="'st' + i"
          :x1="sx(tick.x)"
          :y1="sy(tick.y) - 7"
          :x2="sx(tick.x)"
          :y2="sy(tick.y) + 7"
          class="tick-mark"
        />
        <g v-if="propertyMode === 'equal'">
          <line :x1="sx(arcP.x)" :y1="sy(arcP.y)" :x2="sx(chordA.x)" :y2="sy(chordA.y)" class="ray-line" />
          <line :x1="sx(arcP.x)" :y1="sy(arcP.y)" :x2="sx(chordB.x)" :y2="sy(chordB.y)" class="ray-line" />
          <line :x1="sx(arcQ.x)" :y1="sy(arcQ.y)" :x2="sx(chordA.x)" :y2="sy(chordA.y)" class="ray-line" />
          <line :x1="sx(arcQ.x)" :y1="sy(arcQ.y)" :x2="sx(chordB.x)" :y2="sy(chordB.y)" class="ray-line" />
          <path :d="angleArcAtP" class="angle-arc" />
          <path :d="angleArcAtQ" class="angle-arc" />
          <text :x="angleLabelP.x" :y="angleLabelP.y" class="angle-label"
            >{{ inscribedAnglePDeg }}°</text
          >
          <text :x="angleLabelQ.x" :y="angleLabelQ.y" class="angle-label"
            >{{ inscribedAngleQDeg }}°</text
          >
          <circle :cx="sx(arcP.x)" :cy="sy(arcP.y)" r="5" class="point-dot" />
          <circle :cx="sx(arcQ.x)" :cy="sy(arcQ.y)" r="5" class="point-dot" />
          <text :x="labelP.x" :y="labelP.y" class="point-label">P</text>
          <text :x="labelQ.x" :y="labelQ.y" class="point-label">Q</text>
        </g>
        <g v-else>
          <line
            :x1="sx(propCenter.x)"
            :y1="sy(propCenter.y)"
            :x2="sx(chordA.x)"
            :y2="sy(chordA.y)"
            class="radius-line"
          />
          <line
            :x1="sx(propCenter.x)"
            :y1="sy(propCenter.y)"
            :x2="sx(chordB.x)"
            :y2="sy(chordB.y)"
            class="radius-line"
          />
          <line :x1="sx(arcP.x)" :y1="sy(arcP.y)" :x2="sx(chordA.x)" :y2="sy(chordA.y)" class="ray-line" />
          <line :x1="sx(arcP.x)" :y1="sy(arcP.y)" :x2="sx(chordB.x)" :y2="sy(chordB.y)" class="ray-line" />
          <path :d="angleArcAtO" class="angle-arc angle-arc-central" />
          <path :d="angleArcAtP" class="angle-arc" />
          <text :x="angleLabelO.x" :y="angleLabelO.y" class="angle-label angle-label-central"
            >{{ centralAngleDeg }}°</text
          >
          <text :x="angleLabelP.x" :y="angleLabelP.y" class="angle-label"
            >{{ inscribedAnglePDeg }}°</text
          >
          <circle :cx="sx(arcP.x)" :cy="sy(arcP.y)" r="5" class="point-dot" />
          <text :x="labelP.x" :y="labelP.y" class="point-label">P</text>
        </g>
        <circle :cx="sx(chordA.x)" :cy="sy(chordA.y)" r="5" class="point-dot" />
        <circle :cx="sx(chordB.x)" :cy="sy(chordB.y)" r="5" class="point-dot" />
        <circle :cx="sx(chordM.x)" :cy="sy(chordM.y)" r="5" class="center-dot" />
        <circle :cx="sx(propCenter.x)" :cy="sy(propCenter.y)" r="5" class="center-dot" />
        <text :x="labelA.x" :y="labelA.y" class="point-label">A</text>
        <text :x="labelB.x" :y="labelB.y" class="point-label">B</text>
        <text :x="sx(chordM.x) - 10" :y="sy(chordM.y) + 5" text-anchor="end" class="point-label"
          >M</text
        >
        <text :x="sx(propCenter.x) - 12" :y="sy(propCenter.y) + 20" class="point-label">O</text>
      </svg>
      <p class="insight"><LatexText :text="propertyInsight" /></p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic?: string }>()
const knownTopics = ['120301', '120302', '120303']
// 未匹配的知识点回落到直线场景，保证图解始终与本章主题相关。
const activeTopic = computed(() =>
  props.topic && knownTopics.includes(props.topic) ? props.topic : '120301',
)
const headings: Record<string, string> = {
  '120301': '斜率与截距决定直线的位置',
  '120302': '圆心到直线的距离决定交点个数',
  '120303': '同弧的圆心角是圆周角的两倍',
}
const heading = computed(() => headings[activeTopic.value] || '坐标几何')
const invitation = computed(() =>
  ({
    '120301': '切换斜率、截距与两条直线的相对位置，观察方程如何改变图形。',
    '120302': '点选直线位置，比较圆心到直线的距离与半径的大小。',
    '120303': '切换观察角度，比较同弧上的圆周角与圆心角。',
  } as Record<string, string>)[activeTopic.value] || '',
)

// 三个场景共用同一套等比例坐标映射，圆和垂直关系在屏幕上不会被拉伸。
const unitScale = 36
const plotBounds = { xMin: -5, xMax: 5, yMin: -3.75, yMax: 3.75 }
function sx(x: number) {
  return 240 + x * unitScale
}
function sy(y: number) {
  return 165 - y * unitScale
}
const xTicks = [-4, -2, 2, 4]
const yTicks = [-2, 2]

function formatNumber(value: number) {
  return String(Math.round(value * 100) / 100)
}

// 把参数写进直线方程；1 与 −1 省略系数，避免出现 1x。
function latexLine(m: number, c: number) {
  const coefficient = m === 1 ? '' : m === -1 ? '-' : formatNumber(m)
  const intercept = c === 0 ? '' : c > 0 ? `+${formatNumber(c)}` : formatNumber(c)
  return `y=${coefficient}x${intercept}`
}

// 只保留落在视窗内的线段，避免直线穿过坐标轴标注。
function linePath(m: number, c: number) {
  const lowY = Math.min(plotBounds.yMin, plotBounds.yMax)
  const highY = Math.max(plotBounds.yMin, plotBounds.yMax)
  const rawA = (lowY - c) / m
  const rawB = (highY - c) / m
  const lowX = Math.max(plotBounds.xMin, Math.min(rawA, rawB))
  const highX = Math.min(plotBounds.xMax, Math.max(rawA, rawB))
  if (lowX > highX) return ''
  return (
    'M' +
    sx(lowX).toFixed(2) +
    ' ' +
    sy(m * lowX + c).toFixed(2) +
    'L' +
    sx(highX).toFixed(2) +
    ' ' +
    sy(m * highX + c).toFixed(2)
  )
}

// 在屏幕坐标里沿两条方向画直角小方框；等比例映射保证它看起来就是直角。
function screenDirection(dx: number, dy: number) {
  const length = Math.hypot(dx, dy) || 1
  return { x: dx / length, y: -dy / length }
}
function rightAngleMarker(
  point: { x: number; y: number },
  dirA: { x: number; y: number },
  dirB: { x: number; y: number },
  size: number,
) {
  const px = sx(point.x)
  const py = sy(point.y)
  const first = { x: px + dirA.x * size, y: py + dirA.y * size }
  const corner = {
    x: px + (dirA.x + dirB.x) * size,
    y: py + (dirA.y + dirB.y) * size,
  }
  const second = { x: px + dirB.x * size, y: py + dirB.y * size }
  return (
    'M' +
    first.x.toFixed(2) +
    ' ' +
    first.y.toFixed(2) +
    'L' +
    corner.x.toFixed(2) +
    ' ' +
    corner.y.toFixed(2) +
    'L' +
    second.x.toFixed(2) +
    ' ' +
    second.y.toFixed(2)
  )
}

const slopes = [-2, -1, 1, 2]
const intercepts = [-2, 0, 2]
const lineRelations = [
  { id: 'single', label: '单线' },
  { id: 'parallel', label: '平行线' },
  { id: 'perpendicular', label: '垂直线' },
]
const mPick = ref(1)
const cPick = ref(2)
const lineMode = ref('single')

const secondLine = computed(() => {
  if (lineMode.value === 'parallel') return { m: mPick.value, c: cPick.value - 2 }
  if (lineMode.value === 'perpendicular') return { m: -1 / mPick.value, c: cPick.value }
  return null
})
const mainLinePath = computed(() => linePath(mPick.value, cPick.value))
const secondLinePath = computed(() =>
  secondLine.value ? linePath(secondLine.value.m, secondLine.value.c) : '',
)
const lineMarks = computed(() => {
  const m = mPick.value
  const c = cPick.value
  const marks: Array<{ x: number; y: number; label: string; dx: number; dy: number }> = []
  // 垂直场景的直角小方框画在交点右侧，标签移到左侧避让。
  marks.push({
    x: 0,
    y: c,
    label: `(0, ${formatNumber(c)})`,
    dx: lineMode.value === 'perpendicular' ? -24 : 8,
    dy: c >= 0 ? -10 : 20,
  })
  if (c !== 0) {
    const xIntercept = -c / m
    if (xIntercept >= plotBounds.xMin && xIntercept <= plotBounds.xMax) {
      marks.push({
        x: xIntercept,
        y: 0,
        label: `(${formatNumber(xIntercept)}, 0)`,
        dx: 0,
        dy: 22,
      })
    }
  }
  return marks
})
const rightAnglePath = computed(() => {
  if (lineMode.value !== 'perpendicular') return ''
  const m2 = -1 / mPick.value
  return rightAngleMarker(
    { x: 0, y: cPick.value },
    screenDirection(1, mPick.value),
    screenDirection(1, m2),
    12,
  )
})
const lineFormula = computed(() => {
  const main = latexLine(mPick.value, cPick.value)
  if (lineMode.value === 'parallel') {
    return `$${main}$ 与 $${latexLine(mPick.value, cPick.value - 2)}$ 的斜率相同，所以平行。`
  }
  if (lineMode.value === 'perpendicular') {
    const m2 = -1 / mPick.value
    return `$${main}\\perp ${latexLine(m2, cPick.value)}$，$m_1m_2=${formatNumber(
      mPick.value,
    )}\\times(${formatNumber(m2)})=-1$。`
  }
  return `$${main}$`
})
const lineAria = computed(() => {
  const m = mPick.value
  const c = cPick.value
  const base =
    '直线 y 等于 ' +
    (m === 1 ? 'x' : m === -1 ? '负 x' : formatNumber(m) + 'x') +
    (c === 0 ? '' : (c > 0 ? ' 加 ' : ' 减 ') + Math.abs(c))
  if (lineMode.value === 'parallel') {
    return base + '；另一条直线斜率相同、截距相差 2，两条线平行且不相交'
  }
  if (lineMode.value === 'perpendicular') {
    return (
      base +
      '；另一条直线经过点 (0, ' +
      c +
      ')，斜率为 ' +
      formatNumber(-1 / m) +
      '，两条线在交点处互相垂直'
    )
  }
  return base + '；图中标出 y 轴截距，必要时也标出 x 轴截距'
})
const lineInsight = computed(() => {
  const m = mPick.value
  const c = cPick.value
  if (lineMode.value === 'parallel') {
    return `两条直线斜率都是 $m=${formatNumber(m)}$，截距不同，所以在平面内永不相交。判断平行只看斜率是否相等，与截距无关。`
  }
  if (lineMode.value === 'perpendicular') {
    const m2 = -1 / m
    return `斜率互为负倒数：$m_1m_2=${formatNumber(m)}\\times\\left(${formatNumber(
      m2,
    )}\\right)=-1$。交点处的小方框表示直角。竖直线斜率不存在，判断垂直时要单独讨论。`
  }
  const slopePart =
    m > 0
      ? `斜率 $m=${formatNumber(m)}>0$，直线从左下向右上，$x$ 每增加 1，$y$ 增加 ${formatNumber(m)}$。`
      : `斜率 $m=${formatNumber(m)}<0$，直线从左上向右下，$x$ 每增加 1，$y$ 减少 ${formatNumber(
          Math.abs(m),
        )}$。`
  const steepPart = Math.abs(m) === 2 ? '斜率绝对值是 2，比 $45^\\circ$ 更陡。' : '斜率绝对值是 1，正好与 $x$ 轴成 $45^\\circ$。'
  const interceptPart =
    c === 0
      ? '直线经过原点，两个截距都是 0。'
      : `$y$ 轴截距是 $${formatNumber(c)}$，令 $y=0$ 得 $x$ 轴截距 $${formatNumber(-c / m)}$。`
  return slopePart + steepPart + interceptPart
})

const circleCenter = { a: -0.5, b: 0.5 }
const circleRadius = 2
const circleModes = [
  { id: 'intersect', label: '相交', d: 1 },
  { id: 'tangent', label: '相切', d: 2 },
  { id: 'separate', label: '相离', d: 3 },
]
const circleMode = ref('intersect')
const circleD = computed(
  () => (circleModes.find((item) => item.id === circleMode.value) || circleModes[0]!).d,
)
const circleLineY = computed(() => circleCenter.b + circleD.value)
const circleHasTwoPoints = computed(() => circleD.value < circleRadius)
const circleIsTangent = computed(() => circleD.value === circleRadius)
const halfChord = computed(() =>
  Math.sqrt(Math.max(0, circleRadius * circleRadius - circleD.value * circleD.value)),
)
const circlePoints = computed(() => {
  const y = circleLineY.value
  if (circleIsTangent.value) {
    return [{ x: circleCenter.a, y, label: '切点', dx: 10, dy: -12 }]
  }
  if (!circleHasTwoPoints.value) return []
  return [
    { x: circleCenter.a - halfChord.value, y, label: 'A', dx: -14, dy: 22 },
    { x: circleCenter.a + halfChord.value, y, label: 'B', dx: 14, dy: 22 },
  ]
})
const circleRadiusPoint = computed(() => ({ x: circleCenter.a + circleRadius, y: circleCenter.b }))
const tangentRightAngle = computed(() => {
  if (!circleIsTangent.value) return ''
  return rightAngleMarker({ x: circleCenter.a, y: circleLineY.value }, { x: -1, y: 0 }, { x: 0, y: 1 }, 10)
})
const circleFormula = computed(() => {
  const equation = String.raw`$(x+0.5)^2+(y-0.5)^2=4$`
  if (circleHasTwoPoints.value) {
    return `${equation}，直线 $y=${formatNumber(circleLineY.value)}$，$d=${circleD.value}<r=2$，两个交点。`
  }
  if (circleIsTangent.value) {
    return `${equation}，直线 $y=${formatNumber(circleLineY.value)}$，$d=${circleD.value}=r=2$，一个切点。`
  }
  return `${equation}，直线 $y=${formatNumber(circleLineY.value)}$，$d=${circleD.value}>r=2$，没有交点。`
})
const circleAria = computed(() => {
  const base = `以点 (负0.5, 0.5) 为圆心、半径 2 的圆，水平直线 y 等于 ${formatNumber(
    circleLineY.value,
  )}`
  if (circleHasTwoPoints.value) return `${base}，圆心到直线距离 1 小于半径，直线与圆相交于两点`
  if (circleIsTangent.value) return `${base}，圆心到直线距离等于半径，直线与圆相切于一点`
  return `${base}，圆心到直线距离 3 大于半径，直线与圆没有交点`
})
const circleInsight = computed(() => {
  if (circleHasTwoPoints.value) {
    const squared = circleRadius * circleRadius - circleD.value * circleD.value
    return String.raw`圆心到直线的距离 $d=1<r=2$。代入 $y=b+d$ 后得到 $(x-a)^2=r^2-d^2=${squared}>0$，有两个实交点；弦长 $2\sqrt{r^2-d^2}\approx${formatNumber(
      2 * Math.sqrt(squared),
    )}$。判断位置关系只需比较 $d$ 与 $r$。`
  }
  if (circleIsTangent.value) {
    return String.raw`$d=2=r$，$r^2-d^2=0$，方程只有一个解，直线与圆相切。此时圆心到切点的半径与切线垂直，图中的小方框就是直角。`
  }
  return String.raw`$d=3>r=2$，$r^2-d^2=-5<0$，没有实交点。直线整体在圆外；$d$ 越大，直线离圆越远。`
})

type PlanePoint = { x: number; y: number }
const propCenter: PlanePoint = { x: 0, y: 0 }
const propRadius = 2
function pointOnCircle(degrees: number): PlanePoint {
  const radians = (degrees * Math.PI) / 180
  return {
    x: propRadius * Math.cos(radians),
    y: propRadius * Math.sin(radians),
  }
}
// 弦 AB 在下方短弧上跨 120°，P、Q 都取在优弧上，同弧圆周角因此都是 60°。
const chordA = pointOnCircle(210)
const chordB = pointOnCircle(-30)
const arcP = pointOnCircle(90)
const arcQ = pointOnCircle(45)
const chordM: PlanePoint = {
  x: (chordA.x + chordB.x) / 2,
  y: (chordA.y + chordB.y) / 2,
}
const propertyModes = [
  { id: 'equal', label: '同弧圆周角相等' },
  { id: 'central', label: '圆心角是两倍' },
]
const propertyMode = ref('equal')

function vectorAngleDeg(vertex: PlanePoint, first: PlanePoint, second: PlanePoint) {
  const u = { x: first.x - vertex.x, y: first.y - vertex.y }
  const v = { x: second.x - vertex.x, y: second.y - vertex.y }
  const lengthProduct = Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y) || 1
  const cosine = (u.x * v.x + u.y * v.y) / lengthProduct
  return (Math.acos(Math.max(-1, Math.min(1, cosine))) * 180) / Math.PI
}
const centralAngleDeg = computed(() => Math.round(vectorAngleDeg(propCenter, chordA, chordB)))
const inscribedAnglePDeg = computed(() => Math.round(vectorAngleDeg(arcP, chordA, chordB)))
const inscribedAngleQDeg = computed(() => Math.round(vectorAngleDeg(arcQ, chordA, chordB)))

// 在屏幕坐标中画小于 180° 的角弧，sweep 由叉积决定，保证弧走短边。
function angleArcPath(vertex: PlanePoint, first: PlanePoint, second: PlanePoint, radius: number) {
  const v = { x: sx(vertex.x), y: sy(vertex.y) }
  const a = { x: sx(first.x), y: sy(first.y) }
  const b = { x: sx(second.x), y: sy(second.y) }
  const u1 = { x: a.x - v.x, y: a.y - v.y }
  const u2 = { x: b.x - v.x, y: b.y - v.y }
  const l1 = Math.hypot(u1.x, u1.y) || 1
  const l2 = Math.hypot(u2.x, u2.y) || 1
  const start = { x: v.x + (u1.x / l1) * radius, y: v.y + (u1.y / l1) * radius }
  const end = { x: v.x + (u2.x / l2) * radius, y: v.y + (u2.y / l2) * radius }
  const cross = (u1.x / l1) * (u2.y / l2) - (u1.y / l1) * (u2.x / l2)
  const sweep = cross > 0 ? 1 : 0
  return (
    'M' +
    start.x.toFixed(2) +
    ' ' +
    start.y.toFixed(2) +
    'A' +
    radius +
    ' ' +
    radius +
    ' 0 0 ' +
    sweep +
    ' ' +
    end.x.toFixed(2) +
    ' ' +
    end.y.toFixed(2)
  )
}
function angleLabelPoint(vertex: PlanePoint, first: PlanePoint, second: PlanePoint, radius: number) {
  const v = { x: sx(vertex.x), y: sy(vertex.y) }
  const a = { x: sx(first.x) - v.x, y: sy(first.y) - v.y }
  const b = { x: sx(second.x) - v.x, y: sy(second.y) - v.y }
  const la = Math.hypot(a.x, a.y) || 1
  const lb = Math.hypot(b.x, b.y) || 1
  const mid = { x: a.x / la + b.x / lb, y: a.y / la + b.y / lb }
  const lm = Math.hypot(mid.x, mid.y) || 1
  return {
    x: v.x + (mid.x / lm) * radius,
    y: v.y + (mid.y / lm) * radius + 5,
  }
}
const angleArcAtP = angleArcPath(arcP, chordA, chordB, 30)
const angleArcAtQ = angleArcPath(arcQ, chordA, chordB, 30)
const angleArcAtO = angleArcPath(propCenter, chordA, chordB, 28)
const angleLabelP = angleLabelPoint(arcP, chordA, chordB, 48)
const angleLabelQ = angleLabelPoint(arcQ, chordA, chordB, 48)
// 圆心角顶点在原点，标签向右让开竖直的垂径线，同时留在角内。
const angleLabelO = { x: sx(0) + 18, y: sy(0) + 25 }
const rightAngleAtM = rightAngleMarker(chordM, { x: 1, y: 0 }, { x: 0, y: -1 }, 11)
const segmentTicks = [
  { x: (chordA.x + chordM.x) / 2, y: (chordA.y + chordM.y) / 2 },
  { x: (chordM.x + chordB.x) / 2, y: (chordM.y + chordB.y) / 2 },
]
// 标签沿圆心向外推一点，避免压在圆周线上。
function outsideLabel(point: PlanePoint, distance = 0.8) {
  const length = Math.hypot(point.x, point.y) || 1
  return {
    x: sx(point.x + (point.x / length) * distance),
    y: sy(point.y + (point.y / length) * distance) + 5,
  }
}
const labelA = outsideLabel(chordA)
const labelB = outsideLabel(chordB)
const labelP = outsideLabel(arcP)
const labelQ = outsideLabel(arcQ)
const propertyFormula = computed(() => {
  if (propertyMode.value === 'equal') {
    return String.raw`$\angle APB=\angle AQB=${inscribedAnglePDeg.value}^\circ$，且 $OM\perp AB$，$AM=MB$。`
  }
  return String.raw`$\angle AOB=${centralAngleDeg.value}^\circ=2\angle APB=2\times${inscribedAnglePDeg.value}^\circ$，且 $OM\perp AB$，$AM=MB$。`
})
const propertyAria = computed(() => {
  if (propertyMode.value === 'equal') {
    return `圆内弦 AB，圆心 O 到弦的垂线交于中点 M；点 P 与点 Q 在优弧上，角 APB 与角 AQB 都等于 ${inscribedAnglePDeg.value} 度，同弧所对的圆周角相等`
  }
  return `圆内弦 AB，圆心 O 到弦的垂线交于中点 M；圆心角 AOB 等于 ${centralAngleDeg.value} 度，圆周角 APB 等于 ${inscribedAnglePDeg.value} 度，圆心角是圆周角的两倍`
})
const propertyInsight = computed(() => {
  if (propertyMode.value === 'equal') {
    return String.raw`同弧 $AB$ 所对的圆周角相等：P、Q 在优弧上移动时，$\angle APB=\angle AQB=\frac12\angle AOB$ 始终成立。圆心角固定为 $${centralAngleDeg.value}^\circ$，所以两个圆周角都是 $${inscribedAnglePDeg.value}^\circ$。圆心到弦的垂线同时平分弦，$AM=MB$。`
  }
  return String.raw`圆心角与圆周角同弧：$\angle AOB=2\angle APB$。连接半径后出现两个等腰三角形，把底角记作 $x,y$，三角形外角正好给出 $2(x+y)=${centralAngleDeg.value}^\circ$。垂径定理还给出 $OM\perp AB$ 且 $AM=MB$。`
})

// 切换考点时恢复默认选项，避免前一场景的状态被错误带入。
function resetTopic() {
  mPick.value = 1
  cPick.value = 2
  lineMode.value = 'single'
  circleMode.value = 'intersect'
  propertyMode.value = 'equal'
}
watch(activeTopic, resetTopic, { immediate: true })
</script>

<style scoped>
.math2-coordinate {
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
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}
.control-label {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
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
.line-main {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 3;
}
.line-secondary {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 2.5;
  stroke-dasharray: 8 5;
}
.mark {
  fill: var(--color-learning-blue);
  stroke: var(--color-surface);
  stroke-width: 2;
}
.mark-amber {
  fill: var(--color-learning-amber);
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
.point-label-amber {
  fill: var(--color-learning-amber);
}
.circle-shape {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 2.5;
}
.intersect-line {
  stroke: var(--color-learning-amber);
  stroke-width: 2.5;
}
.distance-line {
  stroke: var(--color-ink-muted);
  stroke-width: 1.5;
  stroke-dasharray: 5 4;
}
.radius-line {
  stroke: var(--color-learning-teal);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
}
.right-angle {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 1.5;
}
.chord {
  stroke: var(--color-ink-soft);
  stroke-width: 2.5;
}
.perpendicular-line {
  stroke: var(--color-learning-amber);
  stroke-width: 2;
  stroke-dasharray: 6 4;
}
.ray-line {
  stroke: var(--color-learning-blue);
  stroke-width: 1.5;
}
.angle-arc {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 2;
}
.angle-arc-central {
  stroke: var(--color-learning-amber);
}
.angle-label {
  fill: var(--color-learning-blue);
  font-size: 14px;
  font-weight: var(--weight-semi);
  paint-order: stroke;
  stroke: var(--color-surface);
  stroke-width: 4px;
  stroke-linejoin: round;
}
.angle-label-central {
  fill: var(--color-learning-amber);
}
.point-dot {
  fill: var(--color-learning-teal);
  stroke: var(--color-surface);
  stroke-width: 2;
}
.center-dot {
  fill: var(--color-learning-teal);
  stroke: var(--color-surface);
  stroke-width: 2;
}
.tick-mark {
  stroke: var(--color-ink-soft);
  stroke-width: 1.5;
}
@media (max-width: 780px) {
  .math2-coordinate {
    padding: 12px;
  }
  svg text {
    font-size: 22px;
  }
  .tick-label,
  .point-label,
  .angle-label {
    font-size: 18px;
  }
}
</style>
