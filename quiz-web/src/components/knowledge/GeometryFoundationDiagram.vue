<!-- 几何基础讲义配图：用可切换的条件对照说明角、对称、四边形与全等判定。 -->
<template>
  <figure class="foundation-figure">
    <figcaption><strong>{{ titles[kind] }}</strong><span>{{ captions[kind] }}</span></figcaption>
    <div v-if="choices.length" class="foundation-controls" :aria-label="titles[kind]">
      <AppButton v-for="(label, index) in choices" :key="label" type="secondary" size="small" :aria-pressed="selection === index" @click="selection = index">{{ label }}</AppButton>
    </div>
    <svg class="geometry-plot" viewBox="0 0 320 250" role="img" :aria-label="captions[kind]">
      <g v-if="kind === 'angle-name'">
        <path d="M70 40 V190 M70 190 H285 M70 190 L240 70" class="outline" />
        <path v-if="selection === 0" d="M70 150 A40 40 0 0 1 110 190" class="angle" />
        <path v-else d="M70 150 A40 40 0 0 1 102.67 166.94" class="angle" />
        <text x="63" y="28">A</text><text x="49" y="213">B</text><text x="285" y="211">C</text><text x="246" y="66">D</text>
        <text x="151" y="150" class="accent">{{ selection === 0 ? '∠ABC' : '∠ABD' }}</text>
      </g>
      <g v-else-if="kind === 'symmetry' || kind === 'polygon'">
        <polygon :points="polygonPoints" class="blue-fill" />
        <g v-if="kind === 'symmetry'">
          <path d="M160 15 V230" class="guide dashed" /><circle cx="160" cy="125" r="4" class="dot" />
          <path :d="`M160 97 A28 28 0 0 1 ${160 + 28 * Math.sin(2 * Math.PI / sides)} ${125 - 28 * Math.cos(2 * Math.PI / sides)}`" class="angle" />
          <text x="179" y="127">O</text><text x="182" y="40">对称轴</text>
        </g>
        <g v-else>
          <line :x1="polygonVertices[0]!.x" :y1="polygonVertices[0]!.y" :x2="extension.x" :y2="extension.y" class="guide dashed" />
          <circle :cx="polygonVertices[1]!.x" :cy="polygonVertices[1]!.y" r="5" class="dot" />
          <text x="254" y="149" class="accent">外角</text>
        </g>
        <text x="109" y="246">正 {{ sides }} 边形</text>
      </g>
      <g v-else-if="kind === 'parallel'">
        <path d="M30 80 H290 M30 175 H290 M70 215 L250 35" class="outline" />
        <path d="M205 80 h30 M110 175 h30 M226.21 58.79 A30 30 0 0 1 235 80 M131.21 153.79 A30 30 0 0 1 140 175" class="angle" />
        <path d="M50 75 l7 5 l-7 5 M50 170 l7 5 l-7 5" class="outline" />
        <text x="294" y="85">l</text><text x="294" y="180">m</text><text x="244" y="63">α</text><text x="149" y="158">β</text>
        <text x="38" y="240">l ∥ m：同一截线上的同位角相等</text>
      </g>
      <g v-else-if="kind === 'diagonals'">
        <template v-if="selection === 0">
          <path d="M55 60 H265 V190 H55 Z" class="blue-fill" />
          <path d="M55 60 L265 190 M265 60 L55 190" class="angle" />
          <path d="M55 74 H69 V60" class="guide" />
          <text x="39" y="52">A</text><text x="270" y="52">B</text><text x="270" y="212">C</text><text x="39" y="212">D</text>
        </template>
        <template v-else>
          <path d="M160 35 L285 125 L160 215 L35 125 Z" class="blue-fill" />
          <path d="M160 35 V215 M35 125 H285" class="angle" />
          <path d="M160 113 H172 V125" class="guide" />
          <text x="154" y="25">A</text><text x="294" y="130">B</text><text x="154" y="238">C</text><text x="17" y="130">D</text>
        </template>
        <circle cx="160" cy="125" r="3" class="dot" /><text x="165" y="146">O</text>
      </g>
      <g v-else-if="kind === 'isosceles'">
        <path d="M160 35 L45 205 H275 Z" class="blue-fill" />
        <path d="M160 35 V205 M160 191 H174 V205" class="angle" />
        <path d="M96 114 l13 9 M211 123 l13 -9 M100 200 v10 M218 200 v10" class="guide" />
        <text x="154" y="25">A</text><text x="26" y="212">B</text><text x="281" y="212">C</text><text x="153" y="227">D</text>
        <text x="68" y="120">s</text><text x="239" y="120">s</text><text x="171" y="132">h</text><text x="89" y="239">b/2</text><text x="213" y="239">b/2</text>
      </g>
      <g v-else-if="kind === 'correspondence'">
        <path d="M30 160 H110 L30 50 Z" class="blue-fill" /><path d="M290 60 H210 L290 170 Z" class="teal-fill" />
        <path d="M30 148 H42 V160 M290 72 H278 V60 M70 154 v12 M250 54 v12 M24 100 h12 M24 109 h12 M284 109 h12 M284 118 h12" class="guide" />
        <text x="15" y="181">A</text><text x="112" y="179">B</text><text x="24" y="39">C</text>
        <text x="294" y="51">D</text><text x="191" y="53">E</text><text x="294" y="192">F</text>
        <text x="77" y="232">A ↔ D，B ↔ E，C ↔ F</text>
      </g>
      <g v-else-if="kind === 'ssa'">
        <path d="M15 70 A145 145 0 0 0 305 70" class="guide dashed" />
        <path d="M40 190 L160 70 L241.39 190 Z" class="blue-fill" />
        <path d="M40 190 L160 70 L78.61 190 Z" class="teal-fill" />
        <path d="M40 190 H302 M160 70 V190" class="guide dashed" />
        <path d="M65 190 A25 25 0 0 0 57.68 172.32" class="angle" />
        <circle cx="78.61" cy="190" r="4" class="dot" /><circle cx="241.39" cy="190" r="4" class="dot" />
        <text x="21" y="214">A</text><text x="69" y="213">B₁</text><text x="232" y="213">B₂</text><text x="153" y="59">C</text>
        <text x="117" y="126">r</text><text x="208" y="126">r</text><text x="160" y="243">CB₁ = CB₂</text>
      </g>
    </svg>
    <p><KnowledgeText :text="explanation" /></p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'
import type { GeometryMethodSection } from '@/content/knowledge/coordinateTransformMethods'

const props = defineProps<{ kind: NonNullable<GeometryMethodSection['foundationDiagram']> }>()
const selection = ref(0)
const titles = {
  'angle-name': '顶点相同，不代表是同一个角', symmetry: '重合之前，先确定轴与中心',
  parallel: '相同位置的角，相等需要平行条件', polygon: '沿边转一周，累计转过 360°',
  diagonals: '同样互相平分，额外性质不同', isosceles: '从等腰顶点作高，一条线承担三个角色',
  correspondence: '图形转过方向，对应关系不变', ssa: '同样两边和一个非夹角，仍可有两解',
}
const captions = {
  'angle-name': 'D 位于 ∠ABC 内部；切换角名，观察被选中的范围。',
  symmetry: '正多边形绕中心旋转，或沿对称轴反射，都能与自身重合。',
  parallel: '两条平行线被同一条直线所截，α 与 β 位于对应位置。',
  polygon: '延长一条边，与下一条边形成转向的外角；正多边形每次转角相等。',
  diagonals: '切换矩形与菱形，对照等长、垂直与平分三种独立关系。',
  isosceles: 'AB = AC，AD ⟂ BC。垂足 D 同时是底边中点。',
  correspondence: '两条对应边及夹角相等，先按顶点顺序写出全等关系。',
  ssa: '固定 AC 和 A 处射线，以 C 为圆心的同一圆弧与射线有两个交点。',
}
// 图示只切换与当前方法有关的条件，不加入解题所需的额外假设。
const choices = computed(() => ({
  'angle-name': ['观察 ∠ABC', '观察 ∠ABD'], symmetry: ['正方形', '正五边形'],
  polygon: ['正五边形', '正六边形'], diagonals: ['矩形', '菱形'],
}[props.kind as 'angle-name' | 'symmetry' | 'polygon' | 'diagonals'] ?? []))
// 正多边形的边数同时决定图形坐标、旋转阶数与外角。
const sides = computed(() => (props.kind === 'symmetry' ? 4 : 5) + selection.value)
// 用统一圆心和半径生成等边等角的图形，避免示意图与文字条件不符。
const polygonVertices = computed(() => Array.from({ length: sides.value }, (_, i) => {
  const angle = -Math.PI / 2 + i * 2 * Math.PI / sides.value
  return { x: 160 + 85 * Math.cos(angle), y: 125 + 85 * Math.sin(angle) }
}))
// SVG 多边形与边的延长线共用同一组顶点。
const polygonPoints = computed(() => polygonVertices.value.map(p => `${p.x},${p.y}`).join(' '))
// 只延长相邻边，不把内部角误画成外角。
const extension = computed(() => {
  const [a, b] = polygonVertices.value
  return { x: b!.x + (b!.x - a!.x) * .45, y: b!.y + (b!.y - a!.y) * .45 }
})
// 结论随图形条件同步更新，明确每个结论成立的前提。
const explanation = computed(() => {
  switch (props.kind) {
    case 'angle-name': return selection.value === 0 ? '$\\angle ABC=\\angle ABD+\\angle DBC$，这里 D 在整体角内部。' : '∠ABD 由 BA 与 BD 确定；BC 不属于这个角的边。'
    case 'symmetry': return `正 ${sides.value} 边形有 ${sides.value} 条对称轴；最小正旋转角为 $360^\\circ/${sides.value}=${360 / sides.value}^\\circ$。图中只画出一条对称轴。`
    case 'parallel': return '已知 $l\\parallel m$ 才能由对应位置推出 $\\alpha=\\beta$；反过来，这组同位角相等也可用于证明两线平行。'
    case 'polygon': return `正 ${sides.value} 边形的外角为 $360^\\circ/${sides.value}=${360 / sides.value}^\\circ$，内角为 $${180 - 360 / sides.value}^\\circ$。非等角多边形不能这样求单个角。`
    case 'diagonals': return selection.value === 0 ? '矩形：$AO=OC$，$BO=OD$，且 $AC=BD$。对角线一般不垂直。' : '菱形：$AO=OC$，$BO=OD$，且 $AC\\perp BD$。对角线一般不等长。'
    case 'isosceles': return '$BD=DC=b/2$，$h^2=s^2-(b/2)^2$。要求 $0<b<2s$；取等号会使三角形退化。'
    case 'correspondence': return '$\\triangle ABC\\cong\\triangle DEF$。从对应顺序得到 $BC=EF$；不能据此断言 BC 与 EF 平行。'
    case 'ssa': return '两个三角形共用 AC 和 ∠A，且 $CB_1=CB_2$，但 $AB_1\\ne AB_2$。所以一般 SSA 不能保证全等。'
    default: return ''
  }
})
</script>

<style scoped>
.foundation-figure { min-width: 0; margin: 0; padding: 18px; border: 1px solid #d7e4fa; border-radius: 12px; background: #f5f8ff; }
figcaption strong { display: block; font-size: 15px; line-height: 1.65; color: #203a62; }
figcaption span { display: block; margin-top: 7px; font-size: 13px; line-height: 1.8; color: #657994; }
.foundation-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.foundation-controls [aria-pressed="true"] { color: #2352cf; background: #e4edff; border-color: #8caaff; }
.geometry-plot { display: block; width: 100%; max-width: 360px; height: auto; margin: 10px auto; }
.geometry-plot text { fill: #405674; font-family: inherit; font-size: 14px; }
.outline, .blue-fill { stroke: #2452cb; stroke-width: 2; stroke-linejoin: round; fill: none; }
.blue-fill { fill: #e1eaff; }
.teal-fill { fill: #dff3ee; fill-opacity: .7; stroke: #0c827b; stroke-width: 2; }
.angle { fill: none; stroke: #0c827b; stroke-width: 2; }
.guide { fill: none; stroke: #879ab5; stroke-width: 1.5; }
.dashed { stroke-dasharray: 5 4; }
.dot { fill: #2452cb; }
.geometry-plot .accent { fill: #0c827b; font-weight: 700; }
p { padding-top: 12px; border-top: 1px solid #d7e4fa; color: #47618a; font-size: 13px; line-height: 1.85; }
</style>
