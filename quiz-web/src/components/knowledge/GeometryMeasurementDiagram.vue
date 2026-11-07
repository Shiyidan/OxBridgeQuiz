<!-- 测量几何配图：同步展示方位、垂直高、圆柱端面与扇形占比的条件变化。 -->
<template>
  <figure class="measurement-figure">
    <figcaption><strong>{{ titles[kind] }}</strong><span>{{ captions[kind] }}</span></figcaption>
    <div v-if="kind === 'bearing'" class="measurement-controls" aria-label="观察起点">
      <AppButton v-for="start in ['A','B']" :key="start" type="secondary" size="small" :aria-pressed="observer === start" @click="observer = start">从 {{ start }} 出发</AppButton>
    </div>
    <div v-if="kind === 'height'" class="measurement-controls" aria-label="三角形顶点位置">
      <AppButton type="secondary" size="small" :aria-pressed="!outside" @click="outside = false">垂足在内部</AppButton>
      <AppButton type="secondary" size="small" :aria-pressed="outside" @click="outside = true">垂足在外部</AppButton>
    </div>
    <div v-if="kind === 'cylinder'" class="measurement-controls" aria-label="圆柱表面范围">
      <AppButton v-for="(label,index) in ['仅侧面','无盖有底','封闭']" :key="label" type="secondary" size="small" :aria-pressed="ends === index" @click="ends = index">{{ label }}</AppButton>
    </div>
    <div v-if="kind === 'sector'" class="measurement-controls" aria-label="扇形圆心角">
      <AppButton v-for="value in [60,120,240]" :key="value" type="secondary" size="small" :aria-pressed="angle === value" @click="angle = value">{{ value }}°</AppButton>
    </div>
    <svg class="geometry-plot" viewBox="0 0 320 250" role="img" :aria-label="captions[kind]">
      <g v-if="kind === 'scale'">
        <text x="104" y="45">比例尺 1 : 25000</text>
        <rect x="50" y="85" width="110" height="18" class="blue-fill" /><rect x="160" y="85" width="110" height="18" class="teal-fill" />
        <path d="M50 78 V110 M160 78 V110 M270 78 V110" class="guide" />
        <text x="45" y="130">0</text><text x="138" y="130">0.5 km</text><text x="253" y="130">1 km</text>
        <path d="M50 165 H270 M50 158 V172 M270 158 V172" class="outline" />
        <text x="111" y="190">图上标示长 4 cm</text>
      </g>
      <g v-else-if="kind === 'bearing'">
        <path d="M70 190 V35 M225.88 185 V25" class="guide dashed" />
        <path d="M70 170 L225.88 80" class="outline" />
        <circle cx="70" cy="170" r="4" class="dot" /><circle cx="225.88" cy="80" r="4" class="dot" />
        <path v-if="observer === 'A'" d="M70 140 A30 30 0 0 1 95.98 155" class="angle" />
        <path v-else d="M225.88 50 A30 30 0 1 1 199.90 95" class="angle" />
        <text x="59" y="207">A</text><text x="235" y="84">B</text><text x="64" y="28">N</text><text x="220" y="19">N</text>
        <text v-if="observer === 'A'" x="88" y="132" class="accent">060°</text><text v-else x="265" y="70" class="accent">240°</text>
      </g>
      <g v-else-if="kind === 'height'">
        <path :d="`M40 190 H240 L${outside ? 270 : 120} 50 Z`" class="blue-fill" />
        <path d="M25 190 H295 M25 50 H295" class="guide dashed" />
        <path :d="`M${outside ? 270 : 120} 50 V190 h-12 v-12 h12`" class="angle" />
        <text x="130" y="212">底 b</text><text :x="outside ? 280 : 130" y="126">高 h</text>
        <text :x="outside ? 264 : 114" y="40">P</text><text x="26" y="212">A</text><text x="240" y="212">B</text>
      </g>
      <g v-else-if="kind === 'prism'">
        <path d="M40 175 L60 105 H140 L160 175 Z" class="blue-fill" />
        <path d="M60 105 L160 50 H240 L140 105 M140 105 L240 50 L260 120 L160 175" class="teal-fill" />
        <path d="M40 175 L140 120 H260 M140 120 L160 50" class="guide dashed" />
        <path d="M60 105 V175 h12 v-12 H60" class="guide" />
        <text x="25" y="144">h</text><text x="88" y="194">底 b</text><text x="259" y="148">L</text><text x="83" y="139">截面</text>
      </g>
      <g v-else-if="kind === 'cylinder'">
        <rect x="70" y="100" width="180" height="70" class="blue-fill" />
        <circle v-if="ends === 2" cx="160" cy="60" r="28" class="teal-fill" />
        <circle v-if="ends >= 1" cx="160" cy="210" r="28" class="teal-fill" />
        <text x="103" y="90">圆周 C = 2πr</text><text x="262" y="140">h</text><text x="124" y="140">展开侧面</text>
        <text v-if="ends === 2" x="146" y="64">πr²</text><text v-if="ends >= 1" x="146" y="214">πr²</text>
      </g>
      <g v-else-if="kind === 'hollow'">
        <circle cx="160" cy="120" r="85" class="teal-fill" /><circle cx="160" cy="120" r="45" class="hole" />
        <path d="M160 120 H245 M160 120 V75" class="outline" />
        <circle cx="160" cy="120" r="3" class="dot" /><text x="207" y="112">R</text><text x="169" y="95">r</text>
        <text x="118" y="183">材料截面</text><text x="109" y="232">内圆为空洞，非材料</text>
      </g>
      <g v-else-if="kind === 'sector'">
        <circle cx="150" cy="125" r="85" class="guide dashed" />
        <path :d="sectorPath" class="blue-fill" />
        <circle cx="150" cy="125" r="3" class="dot" /><text x="135" y="140">O</text><text x="191" y="117">r</text>
        <text x="134" y="25">θ = {{ angle }}°</text>
      </g>
      <g v-else>
        <circle cx="160" cy="130" r="85" class="guide dashed" />
        <path d="M160 130 L160 45 A85 85 0 0 1 245 130 Z" class="blue-fill" />
        <path d="M160 130 V45 L245 130 Z" class="teal-fill" />
        <path d="M160 118 H172 V130" class="guide" />
        <text x="144" y="147">O</text><text x="153" y="35">A</text><text x="253" y="135">B</text><text x="175" y="118">90°</text>
        <text x="75" y="229">弓形 = 扇形 − 三角形</text>
      </g>
    </svg>
    <p aria-live="polite"><KnowledgeText :text="explanation" /></p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'
import type { GeometryMethodSection } from '@/content/knowledge/coordinateTransformMethods'
type Kind = NonNullable<GeometryMethodSection['measurementDiagram']>
const props = defineProps<{ kind: Kind }>()
const observer = ref('A')
const outside = ref(false)
const ends = ref(2)
const angle = ref(60)
const titles: Record<Kind, string> = {
  scale: '同一个尺度，先把单位接起来', bearing: '换观察点，反向角增加半周',
  height: '底与高不变，移动顶点面积不变', prism: '截面的高与棱柱的长度分开标',
  cylinder: '相同侧面，不同端面清单', hollow: '壁厚不是空心管的等效半径',
  sector: '半径不变，只改变角度份额', segment: '弦切出的是弓形，辅助半径不是边界',
}
const captions: Record<Kind, string> = {
  scale: '图上 4 cm 对应实际 1 km。示意条会随屏幕缩放，不可直接用屏幕长度测量。',
  bearing: 'A 到 B 的方位为 060°，B 到 A 为 240°。两地北线平行，弧线均从各自北线顺时针起算。',
  height: '顶点 P 沿平行于 AB 的直线移动，垂直高度保持不变；切换查看垂足落在延长线的情况。',
  prism: '梯形截面沿垂直方向延伸为直棱柱；h 在截面内，L 是棱柱长度。透视图仅示意结构。',
  cylinder: '矩形表示圆柱侧面展开。圆面单独列出，图形仅表示面数与公式，不作为精确裁剪图。',
  hollow: '俯视圆环：外半径 R、内半径 r，浅绿色为材料。体积还需要乘管长 h。',
  sector: '用同一个圆比较 60°、120° 和 240° 扇形；蓝色区域随角度占比变化。',
  segment: '圆心角为 90°，OA、OB 均为 r；蓝色弓形由弧 AB 和弦 AB 围成，绿色为三角形。',
}
// SVG 的圆弧端点与大弧标记共用角度，优扇形不会误画成劣扇形。
const sectorPath = computed(() => {
  const radians = angle.value * Math.PI / 180
  return `M150 125 L235 125 A85 85 0 ${angle.value > 180 ? 1 : 0} 0 ${150+85*Math.cos(radians)} ${125-85*Math.sin(radians)} Z`
})
// 切换只改变当前图示条件；文字结论和图形参数同步派生。
const explanation = computed(() => {
  switch (props.kind) {
    case 'scale': return '$4\\times25000=100000\\,\\mathrm{cm}=1\\,\\mathrm{km}$；面积的倍率则为 $25000^2$。'
    case 'bearing': return observer.value === 'A' ? '从 A 看 B：从 A 的北线顺时针量 $060^\\circ$。' : '从 B 看 A：$060^\\circ+180^\\circ=240^\\circ$，不是 $360^\\circ-60^\\circ$。'
    case 'height': return outside.value ? '垂足落在 AB 延长线上，垂直距离仍为 h，所以 $S=bh/2$ 不变。' : '顶点与底边所在直线的垂直距离为 h，$S=bh/2$。'
    case 'prism': return '$S_{\\rm cross}=(a+b)h/2$，再用 $V=S_{\\rm cross}L$；a 是截面的另一条平行边。'
    case 'cylinder': return ['$S=2\\pi rh$：只计侧面。', '$S=2\\pi rh+\\pi r^2$：侧面加一个底。', '$S=2\\pi rh+2\\pi r^2$：侧面加两个圆面。'][ends.value]!
    case 'hollow': return '$S_{\\rm material}=\\pi(R^2-r^2)$；壁厚相同时，R 越大，用料仍会增加。'
    case 'sector': return `$\\theta=${angle.value}^\\circ$，占整圆 $${angle.value === 60 ? '1/6' : angle.value === 120 ? '1/3' : '2/3'}$；弧长与面积使用同一份额。`
    case 'segment': return '$S_{\\rm segment}=\\pi r^2/4-r^2/2$；其周长为 $\\pi r/2+\\sqrt2r$，不是加上 $2r$。'
    default: return ''
  }
})
</script>

<style scoped>
.measurement-figure { margin: 0; padding: 18px; border: 1px solid #dce6f5; border-radius: 10px; background: #f5f8fd; min-width: 0; }
figcaption { display: grid; gap: 7px; color: #182b49; font-size: 14px; line-height: 1.7; }
figcaption span { color: #65748a; font-size: 12px; }
.geometry-plot { display: block; width: 100%; max-width: 360px; height: auto; margin: 10px auto; }
.geometry-plot text { fill: #34455e; font-size: 12px; }
.blue-fill { fill: #dce8fd; stroke: #2451c5; stroke-width: 2; stroke-linejoin: round; }
.teal-fill { fill: #e2f2ed; stroke: #11786f; stroke-width: 2; stroke-linejoin: round; }
.hole { fill: #f5f8fd; stroke: #11786f; stroke-width: 2; }
.guide { fill: none; stroke: #8193ab; stroke-width: 1.4; }
.dashed { stroke-dasharray: 4 4; }
.outline { fill: none; stroke: #2451c5; stroke-width: 2; }
.angle { fill: none; stroke: #11786f; stroke-width: 2; }
.dot { fill: #2451c5; }
.accent { fill: #11786f; font-weight: 700; }
p { margin: 0; padding-top: 10px; border-top: 1px solid #dce6f5; color: #405776; font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
.measurement-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.measurement-controls :deep([aria-pressed='true']) { background: #e2ebfd; border-color: #2451c5; color: #2451c5; }
</style>
