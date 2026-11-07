<!-- 相似、三角比与向量的方法配图：通过参考角、截线和分点变化核对数学关系。 -->
<template>
  <figure class="reasoning-figure">
    <figcaption><strong>{{ headings[kind] }}</strong><span>{{ descriptions[kind] }}</span></figcaption>
    <div v-if="kind === 'area-cut'" class="diagram-controls" aria-label="截线位置">
      <AppButton v-for="option in [0.5, 0.75]" :key="option" type="secondary" size="small" :aria-pressed="fraction === option" @click="fraction = option">边长占比 {{ option === 0.5 ? '1/2' : '3/4' }}</AppButton>
    </div>
    <div v-if="kind === 'trig-sides'" class="diagram-controls" aria-label="选择参考角">
      <AppButton type="secondary" size="small" :aria-pressed="!atTop" @click="atTop = false">以 A 为参考角</AppButton>
      <AppButton type="secondary" size="small" :aria-pressed="atTop" @click="atTop = true">以 C 为参考角</AppButton>
    </div>
    <div v-if="kind === 'vector-section'" class="diagram-controls" aria-label="分点位置">
      <AppButton v-for="option in [0.25, 0.5, 1.25]" :key="option" type="secondary" size="small" :aria-pressed="parameter === option" @click="parameter = option">t = {{ option }}</AppButton>
    </div>
    <svg class="geometry-plot" viewBox="0 0 320 240" role="img" :aria-label="descriptions[kind]">
      <defs><marker :id="arrowId" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>
      <g v-if="kind === 'similarity'">
        <path d="M30 100 H90 L30 20 Z" class="blue-fill" /><path d="M180 200 H300 L180 40 Z" class="teal-fill" />
        <path d="M30 90 H40 V100 M180 190 H190 V200" class="guide" />
        <text x="15" y="117">A</text><text x="90" y="118">B</text><text x="22" y="14">C</text>
        <text x="164" y="218">D</text><text x="299" y="218">E</text><text x="171" y="32">F</text>
        <text x="44" y="120">3</text><text x="10" y="65">4</text><text x="63" y="58">5</text>
        <text x="234" y="218">6</text><text x="157" y="126">8</text><text x="250" y="112">10</text>
      </g>
      <g v-else-if="kind === 'area-cut'">
        <path d="M160 25 L40 205 H280 Z" class="teal-fill" />
        <path :d="`M160 25 L${160-120*fraction} ${25+180*fraction} H${160+120*fraction} Z`" class="blue-fill" />
        <text x="155" y="17">A</text><text x="25" y="220">B</text><text x="284" y="220">C</text>
        <text :x="142-120*fraction" :y="29+180*fraction">D</text><text :x="166+120*fraction" :y="29+180*fraction">E</text>
        <text x="125" y="67">小三角形</text>
      </g>
      <g v-else-if="kind === 'trig-sides'">
        <path d="M40 200 H280 V20 Z" class="blue-fill" /><path d="M266 200 V186 H280" class="guide" />
        <path v-if="!atTop" d="M70 200 A30 30 0 0 0 64 182" class="angle" />
        <path v-else d="M256 38 A30 30 0 0 0 280 50" class="angle" />
        <text x="27" y="220">A</text><text x="282" y="220">B</text><text x="285" y="20">C</text>
        <text :x="atTop ? 258 : 77" :y="atTop ? 63 : 190" class="accent">θ</text>
        <text x="110" y="219">{{ atTop ? '对边' : '邻边' }} · 4</text>
        <text x="287" y="105">3</text><text x="276" y="137" transform="rotate(-90 276 137)">{{ atTop ? '邻边' : '对边' }}</text>
        <text x="130" y="102" transform="rotate(-36.87 130 102)">斜边 · 5</text>
      </g>
      <g v-else-if="kind === 'shared-height'">
        <path d="M40 200 H260 V30 Z M160 200 L260 30" class="outline" />
        <path d="M248 200 V188 H260" class="guide" />
        <text x="20" y="218">远点</text><text x="145" y="218">近点</text><text x="267" y="204">垂足</text>
        <text x="267" y="110">h</text><text x="97" y="218">s</text><text x="210" y="218">d</text>
        <text x="70" y="190">β</text><text x="177" y="182">α</text>
        <text x="267" y="30">顶点</text>
      </g>
      <g v-else-if="kind === 'vector-path'">
        <path d="M40 190 L110 40" class="arrow-blue" :marker-end="`url(#${arrowId})`" />
        <path d="M110 40 L280 120" class="arrow-teal" :marker-end="`url(#${arrowId})`" />
        <path d="M40 190 L280 120" class="arrow-blue" :marker-end="`url(#${arrowId})`" />
        <text x="22" y="208">O</text><text x="105" y="29">A</text><text x="285" y="124">B</text>
        <text x="50" y="108">a</text><text x="160" y="181">b</text><text x="190" y="65">b − a</text>
      </g>
      <g v-else>
        <path d="M40 125 H280" class="guide dashed" />
        <path d="M40 125 H200" class="arrow-blue" :marker-end="`url(#${arrowId})`" />
        <path :d="`M40 100 H${40+160*parameter}`" class="arrow-teal" :marker-end="`url(#${arrowId})`" />
        <circle cx="40" cy="125" r="4" class="dot" /><circle cx="200" cy="125" r="4" class="dot" />
        <circle :cx="40+160*parameter" cy="125" r="5" class="moving-dot" />
        <text x="35" y="150">A</text><text x="195" y="150">B</text><text :x="36+160*parameter" y="82">P</text>
        <path :d="`M${40+160*parameter} 90 V120`" class="guide dashed" />
        <text x="85" y="185">AP = t · AB（向量关系）</text>
      </g>
    </svg>
    <p aria-live="polite"><KnowledgeText :text="explanation" /></p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'
import type { GeometryMethodSection } from '@/content/knowledge/coordinateTransformMethods'
type Kind = NonNullable<GeometryMethodSection['reasoningDiagram']>
const props = defineProps<{ kind: Kind }>()
const fraction = ref(0.5)
const atTop = ref(false)
const parameter = ref(0.25)
const arrowId = `geometry-arrow-${useId()}`
const headings: Record<Kind, string> = {
  similarity: '对应边统一倍率，面积使用平方',
  'area-cut': '截线平行，剩余面积怎样变化',
  'trig-sides': '同一个三角形，换一个参考角',
  'shared-height': '两个直角三角形共享同一高度',
  'vector-path': '直接到 B，与经过 A 到 B',
  'vector-section': '参数 t 同时描述比例与位置',
}
const descriptions: Record<Kind, string> = {
  similarity: 'A、B、C 分别对应 D、E、F；两三角形的边长为 3、4、5 和 6、8、10。',
  'area-cut': 'D、E 在 AB、AC 上，DE 平行 BC。蓝色为小三角形，浅绿色为剩余梯形。',
  'trig-sides': 'B 为直角，AB=4、BC=3、AC=5。切换参考角，观察对边和邻边互换。',
  'shared-height': '两个观测点在目标同一侧的同一水平面上；α、β 以水平线为基准。图形仅说明位置关系。',
  'vector-path': '蓝色表示位置向量 OA、OB；绿色表示从 A 到 B 的位移。箭头指向各段终点。',
  'vector-section': 'A、B 固定，P 随 t 移动；绿色箭头表示 AP，蓝色箭头表示整段 AB。',
}
// 说明与图形共用交互参数，避免截线位置和比例数值不一致。
const explanation = computed(() => {
  switch (props.kind) {
    case 'similarity': return '对应长度比 $k=2$，周长比为 2；面积由 6 变为 24，面积比为 $2^2=4$。'
    case 'area-cut': return fraction.value === 0.5 ? '边长占比 $1/2$，小三角形面积占 $1/4$；剩余占 $3/4$，不是 $1/2$。' : '边长占比 $3/4$，小三角形面积占 $9/16$；剩余占 $7/16$，不是 $1/16$。'
    case 'trig-sides': return atTop.value ? '参考角为 C：$\\sin C=4/5$，$\\cos C=3/5$，$\\tan C=4/3$。' : '参考角为 A：$\\sin A=3/5$，$\\cos A=4/5$，$\\tan A=3/4$。'
    case 'shared-height': return '$h=d\\tan\\alpha=(d+s)\\tan\\beta$；相同高度下，近点仰角更大。'
    case 'vector-path': return '$\\mathbf a+(\\mathbf b-\\mathbf a)=\\mathbf b$；逆向从 B 到 A 时，位移是 $\\mathbf a-\\mathbf b$。'
    case 'vector-section': return parameter.value === 0.25 ? '$t=1/4$：P 在内部，$AP:PB=1:3$；份额 $1/4$ 不等于局部比 $1/3$。' : parameter.value === 0.5 ? '$t=1/2$：P 为中点，$\\mathbf p=(\\mathbf a+\\mathbf b)/2$。' : '$t=5/4>1$：P 越过 B；$\\overrightarrow{PB}$ 与 $\\overrightarrow{AB}$ 反向，不能照搬内分公式。'
    default: return ''
  }
})
</script>

<style scoped>
.reasoning-figure { margin: 0; padding: 18px; border: 1px solid #dce6f5; border-radius: 10px; background: #f5f8fd; min-width: 0; }
figcaption { display: grid; gap: 7px; color: #182b49; font-size: 14px; line-height: 1.7; }
figcaption span { color: #65748a; font-size: 12px; }
.geometry-plot { display: block; width: 100%; max-width: 360px; height: auto; margin: 10px auto; }
.geometry-plot text { fill: #34455e; font-size: 12px; }
.blue-fill { fill: #dce8fd; stroke: #2451c5; stroke-width: 2; stroke-linejoin: round; }
.teal-fill { fill: #e2f2ed; stroke: #11786f; stroke-width: 2; stroke-linejoin: round; }
.guide { fill: none; stroke: #8193ab; stroke-width: 1.4; }
.dashed { stroke-dasharray: 4 4; }
.outline, .arrow-blue { fill: none; stroke: #2451c5; stroke-width: 2; }
.arrow-teal, .angle { fill: none; stroke: #11786f; stroke-width: 2; }
.accent { fill: #11786f; font-weight: 700; }
.dot { fill: #2451c5; }
.moving-dot { fill: #11786f; stroke: white; stroke-width: 1.5; }
p { margin: 0; padding-top: 10px; border-top: 1px solid #dce6f5; color: #405776; font-size: 13px; line-height: 1.8; overflow-wrap: anywhere; }
.diagram-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.diagram-controls :deep([aria-pressed='true']) { background: #e2ebfd; border-color: #2451c5; color: #2451c5; }
</style>
