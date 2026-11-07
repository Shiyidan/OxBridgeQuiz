<!-- 几何读图配图：对照圆的边界、长方体对角线与相同视图下的不同堆叠。 -->
<template>
  <figure class="reading-figure">
    <figcaption><strong>{{ titles[kind] }}</strong><span>{{ descriptions[kind] }}</span></figcaption>
    <div class="reading-controls" :aria-label="titles[kind]">
      <AppButton v-for="(label, index) in choices[kind]" :key="label" type="secondary" size="small" :aria-pressed="selection === index" @click="selection = index">{{ label }}</AppButton>
    </div>
    <svg class="geometry-plot" viewBox="0 0 320 250" role="img" :aria-label="explanation">
      <g v-if="kind === 'circle-lines' || kind === 'circle-regions'">
        <circle cx="160" cy="125" r="80" class="outline muted" />
        <template v-if="kind === 'circle-lines'">
          <g v-if="selection === 0">
            <path d="M80 125 H240" class="outline" /><path d="M160 125 H240" class="accent-line" />
            <text x="65" y="145">A</text><text x="243" y="145">B</text><text x="193" y="116">r</text>
            <text x="138" y="227">AB = 2r</text>
          </g>
          <g v-else-if="selection === 1">
            <path d="M103.43 68.43 H216.57" class="outline" />
            <text x="86" y="61">A</text><text x="220" y="61">B</text><text x="115" y="227">弦不一定过圆心</text>
          </g>
          <g v-else>
            <path d="M240 25 V225" class="accent-line" /><path d="M160 125 H240" class="outline" />
            <path d="M228 125 V113 H240" class="guide" />
            <text x="249" y="132">T</text><text x="250" y="48">切线</text><text x="194" y="148">r</text>
          </g>
        </template>
        <template v-else>
          <path v-if="selection === 0" d="M160 125 L103.43 68.43 A80 80 0 0 1 216.57 68.43 Z" class="blue-fill" />
          <path v-else d="M103.43 68.43 A80 80 0 0 1 216.57 68.43 Z" class="teal-fill" />
          <path v-if="selection === 1" d="M103.43 68.43 H216.57" class="accent-line" />
          <text x="85" y="62">A</text><text x="222" y="62">B</text>
          <text x="94" y="227">{{ selection === 0 ? '两条半径 + 一条弧' : '一条弦 + 一条弧' }}</text>
        </template>
        <circle cx="160" cy="125" r="3" class="dot" /><text x="147" y="146">O</text>
      </g>
      <g v-else-if="kind === 'solid-diagonal'">
        <path d="M45 205 H205 L275 155 H115 Z" class="pale-fill" />
        <path d="M45 205 V95 H205 V205 M45 95 L115 45 H275 V155 M205 95 L275 45" class="outline" />
        <path d="M115 45 V155" class="guide dashed" />
        <path d="M45 205 L275 155" :class="selection === 0 ? 'accent-line' : 'guide dashed'" />
        <path v-if="selection === 1" d="M45 205 L275 45 V155" class="accent-line" />
        <text x="115" y="228">l</text><text x="246" y="194">w</text><text x="287" y="105">h</text>
        <text :x="selection === 0 ? 157 : 145" :y="selection === 0 ? 179 : 117" class="accent">{{ selection === 0 ? 'e' : 'd' }}</text>
      </g>
      <g v-else>
        <text x="20" y="22">俯视位置 · 数字为柱高</text>
        <g v-for="(row, j) in heights" :key="j">
          <g v-for="(height, i) in row" :key="i">
            <rect :x="44+i*42" :y="40+j*42" width="42" height="42" :class="selection === 1 && i !== j ? 'teal-fill' : 'blue-fill'" />
            <text :x="60+i*42" :y="66+j*42">{{ height }}</text>
          </g>
        </g>
        <text x="16" y="67">后</text><text x="16" y="109">前</text>
        <path d="M85 149 V132 l-5 7 M85 132 l5 7" class="accent-line" /><text x="58" y="168">正视方向</text>
        <g v-for="(height, i) in front" :key="`front-${i}`">
          <rect v-for="level in height" :key="level" :x="178+i*25" :y="116-level*25" width="25" height="25" class="blue-fill" />
        </g>
        <text x="174" y="135">正视：3、2</text>
        <g v-for="(height, j) in side" :key="`side-${j}`">
          <rect v-for="level in height" :key="level" :x="178+j*25" :y="230-level*25" width="25" height="25" class="teal-fill" />
        </g>
        <text x="174" y="249">后</text><text x="204" y="249">前</text><text x="239" y="205">侧视</text>
        <text x="32" y="219" class="accent">共 {{ total }} 块</text>
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

const props = defineProps<{ kind: NonNullable<GeometryMethodSection['readingDiagram']> }>()
const selection = ref(0)
const titles = {
  'circle-lines': '同一个圆，不同的线', 'circle-regions': '弧相同，直边与区域不同',
  'solid-diagonal': '先认对角线经过哪里', views: '轮廓相同，总数不同',
}
const descriptions = {
  'circle-lines': 'O 是圆心。切换记号，对照端点和圆心的位置。',
  'circle-regions': '蓝绿填色是所选区域，实线标出它的边界。',
  'solid-diagonal': 'l、w、h 是长方体三条互相垂直的棱长。',
  views: '每格从地面连续堆起；数字是额外标出的柱高，不是俯视图本身能读出的数据。',
}
const choices = {
  'circle-lines': ['半径与直径', '弦', '切线'], 'circle-regions': ['扇形', '弓形'],
  'solid-diagonal': ['面对角线', '体对角线'], views: ['原搭法', '加高两柱'],
}
// 两种连续堆叠有相同占地、行最大值与列最大值，用于解释视图不唯一。
const heights = computed(() => selection.value === 0 ? [[3, 1], [1, 2]] : [[3, 2], [2, 2]])
// 正视沿前后方向观察，每个横向位置取所有柱高的最大值。
const front = computed(() => [0, 1].map(i => Math.max(...heights.value.map(row => row[i]!))))
// 侧视沿左右方向观察，图中按后、前顺序排列轮廓。
const side = computed(() => heights.value.map(row => Math.max(...row)))
// 连续堆叠的方块总数为各占据位置柱高之和。
const total = computed(() => heights.value.flat().reduce((sum, height) => sum + height, 0))
// 说明跟随当前图形状态，避免切换图示后仍展示另一种边界或尺寸。
const explanation = computed(() => {
  switch (props.kind) {
    case 'circle-lines': return ['OA、OB 都是半径；AB 经过圆心，是直径。', 'AB 两端在圆上，是弦；没有经过圆心，不是直径。', '$OT\\perp\\text{切线}$：必须连接圆心与切点 T。'][selection.value]!
    case 'circle-regions': return selection.value === 0 ? '扇形 OAB 的边界是 OA、OB 与弧 AB。' : '弓形的边界是弦 AB 与弧 AB；圆心不一定在区域内。'
    case 'solid-diagonal': return selection.value === 0 ? '$e^2=l^2+w^2$，只使用底面的长与宽。' : '$d^2=e^2+h^2=l^2+w^2+h^2$，底面对角线再与高作一次勾股。'
    case 'views': return `总数为 ${total.value} 块。俯视仍占 4 格，正视和侧视的轮廓仍各为 3、2；给定这三幅视图，方块数不唯一。`
    default: return ''
  }
})
</script>

<style scoped>
.reading-figure { min-width: 0; margin: 0; padding: 16px; border: 1px solid #d7e4fa; border-radius: 12px; background: #f5f8ff; }
figcaption strong { display: block; color: #203a62; font-size: 15px; line-height: 1.65; }
figcaption span { display: block; margin-top: 6px; color: #657994; font-size: 13px; line-height: 1.8; }
.reading-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.reading-controls [aria-pressed="true"] { color: #2352cf; background: #e4edff; border-color: #8caaff; }
.geometry-plot { display: block; width: 100%; max-width: 360px; height: auto; margin: 10px auto; }
.geometry-plot text { fill: #405674; font-family: inherit; font-size: 14px; }
.outline, .blue-fill, .pale-fill { fill: none; stroke: #2452cb; stroke-width: 2; stroke-linejoin: round; }
.blue-fill { fill: #e1eaff; }
.pale-fill { fill: #edf2fb; }
.teal-fill { fill: #dff3ee; stroke: #0c827b; stroke-width: 2; }
.accent-line { fill: none; stroke: #0c827b; stroke-width: 3; }
.guide { fill: none; stroke: #879ab5; stroke-width: 1.5; }
.muted { stroke: #9eafc9; }
.dashed { stroke-dasharray: 5 4; }
.dot { fill: #2452cb; }
.geometry-plot .accent { fill: #0c827b; font-weight: 700; }
p { padding-top: 10px; border-top: 1px solid #d7e4fa; color: #47618a; font-size: 13px; line-height: 1.85; }
</style>
