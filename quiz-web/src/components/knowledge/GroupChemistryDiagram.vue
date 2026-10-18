<!-- ESAT 第七章讲义图解：联动三族粒子形式、碱金属物性与卤素置换，供概念复习使用。 -->
<template>
  <figure class="group-atlas" :aria-label="heading">
    <figcaption>
      <span class="atlas-eyebrow">CHEMISTRY · 族的性质与反应</span>
      <h5>{{ heading }}</h5>
      <p>{{ instruction }}</p>
    </figcaption>

    <template v-if="mode === 'families'">
      <div class="atlas-controls" role="group" aria-label="选择元素族">
        <AppButton
          v-for="(item, index) in families"
          :key="item.name"
          type="secondary"
          size="small"
          :aria-pressed="familyIndex === index"
          @click="familyIndex = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="family-layout">
        <svg viewBox="0 0 340 250" role="img" :aria-label="family.particle">
          <title>{{ family.particle }}，粒子关系示意而非真实比例</title>
          <rect x="15" y="18" width="310" height="200" rx="16" class="sample-frame" />
          <template v-if="familyIndex === 0">
            <g v-for="(point, index) in metalPoints" :key="index">
              <circle :cx="point.x" :cy="point.y" r="23" class="metal-particle" />
              <text :x="point.x" :y="point.y + 5" text-anchor="middle" class="particle-label">
                Na⁺
              </text>
              <text :x="point.x + 29" :y="point.y - 22" class="electron">e⁻</text>
            </g>
          </template>
          <template v-else-if="familyIndex === 1">
            <g v-for="(point, index) in gasPoints.slice(0, 4)" :key="index">
              <line
                :x1="point.x - 17"
                :x2="point.x + 17"
                :y1="point.y"
                :y2="point.y"
                class="bond"
              />
              <circle :cx="point.x - 17" :cy="point.y" r="20" class="halogen-particle" />
              <circle :cx="point.x + 17" :cy="point.y" r="20" class="halogen-particle" />
              <text :x="point.x - 17" :y="point.y + 5" text-anchor="middle" class="particle-label">
                Cl
              </text>
              <text :x="point.x + 17" :y="point.y + 5" text-anchor="middle" class="particle-label">
                Cl
              </text>
            </g>
          </template>
          <template v-else>
            <g v-for="(point, index) in gasPoints" :key="index">
              <circle :cx="point.x" :cy="point.y" r="20" class="noble-particle" />
              <text :x="point.x" :y="point.y + 5" text-anchor="middle" class="particle-label">
                Ar
              </text>
            </g>
          </template>
          <text x="170" y="244" text-anchor="middle" class="svg-caption">
            {{ family.particle }}
          </text>
        </svg>
        <div class="family-profile" aria-live="polite">
          <span class="small-label">{{ family.members }}</span>
          <h6>{{ family.headline }}</h6>
          <dl>
            <div>
              <dt>常见物性</dt>
              <dd>{{ family.physical }}</dd>
            </div>
            <div>
              <dt>电子与反应</dt>
              <dd>{{ family.chemical }}</dd>
            </div>
            <div>
              <dt>做题先辨</dt>
              <dd>{{ family.boundary }}</dd>
            </div>
          </dl>
        </div>
      </div>
      <p class="atlas-insight"><KnowledgeText :text="family.evidence" /></p>
    </template>

    <template v-else-if="mode === 'alkali'">
      <div class="atlas-controls" role="group" aria-label="选择碱金属">
        <AppButton
          v-for="(item, index) in alkaliMetals"
          :key="item.symbol"
          type="secondary"
          size="small"
          :aria-pressed="metalIndex === index"
          @click="metalIndex = index"
          >{{ item.symbol }} · {{ item.name }}</AppButton
        >
      </div>
      <div class="alkali-layout">
        <div class="water-observation">
          <svg viewBox="0 0 320 210" role="img" :aria-label="metal.observation">
            <title>{{ metal.name }}与水反应的定性示意，不表示实测速率或产气量</title>
            <path d="M50 45 V175 Q50 190 65 190 H255 Q270 190 270 175 V45" class="beaker" />
            <path
              d="M53 110 Q95 102 135 110 T267 110 V175 Q267 187 255 187 H65 Q53 187 53 175Z"
              class="water"
            />
            <ellipse
              cx="151"
              cy="106"
              :rx="metalIndex === 0 ? 25 : 19"
              :ry="metalIndex === 0 ? 10 : 15"
              class="metal-particle"
            />
            <text x="151" y="110" text-anchor="middle" class="particle-label">
              {{ metal.symbol }}
            </text>
            <circle
              v-for="(point, index) in bubblePoints"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="4"
              class="bubble"
            />
            <text x="224" y="70" class="svg-caption">H₂ ↑</text>
            <text x="160" y="157" text-anchor="middle" class="svg-caption">
              {{ metal.symbol }}OH(aq) · 碱性
            </text>
          </svg>
          <p aria-live="polite">
            <strong>{{ metal.symbol }} 与水：</strong>{{ metal.observation }}
          </p>
          <div class="equation"><KnowledgeText :text="waterEquation" /></div>
          <p class="small-note">气泡仅表示生成氢气；图中数量不用于比较速率或最终产量。</p>
        </div>
        <div class="property-comparison">
          <div class="atlas-controls" role="group" aria-label="比较碱金属物理性质">
            <AppButton
              v-for="item in metrics"
              :key="item.key"
              type="secondary"
              size="small"
              :aria-pressed="metric === item.key"
              @click="metric = item.key"
              >{{ item.label }}</AppButton
            >
          </div>
          <span class="small-label">{{ metricLabel }} · {{ metricUnit }}</span>
          <div class="bar-list">
            <div
              v-for="(item, index) in alkaliMetals"
              :key="item.symbol"
              class="bar-row"
              :class="{ 'is-selected': index === metalIndex }"
            >
              <strong>{{ item.symbol }}</strong>
              <div class="bar-track">
                <span :style="{ width: (item[metric] / metricMaximum) * 100 + '%' }" />
              </div>
              <span class="bar-number">{{ item[metric] }}</span>
            </div>
          </div>
          <p class="atlas-insight" aria-live="polite">{{ metricExplanation }}</p>
          <div class="direction-line">
            <span>Li → Na → K</span><strong>与水反应性增强 →</strong>
          </div>
          <p class="small-note">物性数值取 RSC 数据并适当舍入，用于比较；不要求记住所有小数。</p>
        </div>
      </div>
      <div class="quantity-check">
        <span class="small-label">把速度与最终量分开</span>
        <div class="atlas-controls" role="group" aria-label="选择完全反应的用量条件">
          <AppButton
            type="secondary"
            size="small"
            :aria-pressed="equalMass"
            @click="equalMass = true"
            >等质量</AppButton
          >
          <AppButton
            type="secondary"
            size="small"
            :aria-pressed="!equalMass"
            @click="equalMass = false"
            >等摩尔</AppButton
          >
        </div>
        <p aria-live="polite">
          {{
            equalMass
              ? '水足量、都完全反应：Li 的摩尔质量最小，同质量时金属摩尔数最多，最终 H₂ 最多；这不代表 Li 反应最快。'
              : '水足量、都完全反应：每 2 mol 金属都对应 1 mol H₂，最终产气量相同；完成快慢仍可不同。'
          }}
        </p>
      </div>
    </template>

    <template v-else>
      <div class="atlas-controls" role="group" aria-label="选择卤素学习内容">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="halogenStage === 'trend'"
          @click="halogenStage = 'trend'"
          >物态与趋势</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="halogenStage === 'displacement'"
          @click="halogenStage = 'displacement'"
          >试一组置换</AppButton
        >
      </div>
      <template v-if="halogenStage === 'trend'">
        <div class="halogen-strip">
          <div v-for="item in halogens" :key="item.symbol" class="halogen-item">
            <span class="colour-sample" :style="{ background: item.colour }" aria-hidden="true" />
            <strong>{{ item.symbol }}₂</strong>
            <span>{{ item.state }}</span>
            <small>{{ item.appearance }}</small>
          </div>
        </div>
        <div class="trend-lines">
          <p>
            <span>化学性质</span><strong>F₂ → Cl₂ → Br₂ → I₂：氧化能力减弱</strong
            ><small>比较电子转移的倾向</small>
          </p>
          <p>
            <span>物理性质</span><strong>F₂ → Cl₂ → Br₂ → I₂：熔沸点升高</strong
            ><small>同类分子的分子间作用总体增强</small>
          </p>
        </div>
        <p class="atlas-insight">
          上方颜色表示常温常压下的单质外观。碘固体是灰黑色，碘蒸气是紫色；水溶液颜色要另按溶剂和浓度判断。
        </p>
      </template>
      <template v-else>
        <div class="reactant-selection">
          <div>
            <span class="small-label">加入的卤素单质</span>
            <div class="atlas-controls" role="group" aria-label="加入的卤素单质">
              <AppButton
                v-for="(item, index) in aqueousHalogens"
                :key="item.symbol"
                type="secondary"
                size="small"
                :aria-pressed="halogenIndex === index"
                @click="halogenIndex = index"
                >{{ item.symbol }}₂</AppButton
              >
            </div>
          </div>
          <span class="plus-sign" aria-hidden="true">+</span>
          <div>
            <span class="small-label">盐溶液中的卤离子</span>
            <div class="atlas-controls" role="group" aria-label="盐溶液中的卤离子">
              <AppButton
                v-for="(item, index) in aqueousHalogens"
                :key="item.symbol"
                type="secondary"
                size="small"
                :aria-pressed="halideIndex === index"
                @click="halideIndex = index"
                >{{ item.symbol }}⁻</AppButton
              >
            </div>
          </div>
        </div>
        <div class="displacement-result" aria-live="polite">
          <svg viewBox="0 0 160 190" role="img" :aria-label="resultObservation">
            <title>水溶液颜色示意，浓度不同可改变深浅</title>
            <path d="M46 18 V144 Q46 174 80 174 Q114 174 114 144 V18" class="beaker" />
            <path d="M49 78 H111 V143 Q111 171 80 171 Q49 171 49 143Z" :fill="resultColour" />
            <text x="80" y="61" text-anchor="middle" class="svg-caption">水溶液</text>
          </svg>
          <div>
            <span class="result-label">{{ canDisplace ? '发生置换' : '没有净置换' }}</span>
            <div v-if="canDisplace" class="equation">
              <KnowledgeText :text="displacementEquation" />
            </div>
            <h6 v-else>
              {{
                halogenIndex === halideIndex
                  ? '同种卤素，不发生净交换'
                  : donor.symbol + '₂ 不足以氧化 ' + receiver.symbol + '⁻'
              }}
            </h6>
            <p>{{ resultObservation }}</p>
            <p class="small-note">{{ electronExplanation }}</p>
          </div>
        </div>
        <p class="atlas-insight">
          这里比较 Cl₂、Br₂、I₂ 的常见水溶液置换，并假定卤离子足量。F₂
          与水本身会强烈反应，因此不放进这个水溶液选择器。
        </p>
      </template>
    </template>
    <p class="atlas-footnote">学习模型用于解释性质与反应；粒子位置、大小和颜色深浅均为示意。</p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic: string }>()
type Metric = 'melting' | 'boiling' | 'density'
const familyIndex = ref(0)
const metalIndex = ref(0)
const metric = ref<Metric>('melting')
const equalMass = ref(true)
const halogenStage = ref<'trend' | 'displacement'>('trend')
const halogenIndex = ref(0)
const halideIndex = ref(1)

const families = [
  {
    name: '第 1 族 · 碱金属',
    members: 'Li · Na · K',
    headline: '失去一个电子，形成 M⁺',
    particle: '钠金属：正离子实与离域电子',
    physical: '较软、密度较低；新鲜切面有金属光泽。',
    chemical: '与水生成氢氧化物与氢气；常见化合物中金属为 +1。',
    boundary: 'H 虽列在第 1 族，却不是碱金属；M 与 M⁺ 的性质不同。',
    evidence:
      '遇到水反应，先写共同模型：$2\\mathrm{M}+2\\mathrm{H_2O}\\rightarrow2\\mathrm{MOH}+\\mathrm{H_2}$。金属图中的正离子实和电子合起来仍电中性。',
  },
  {
    name: '第 17 族 · 卤素',
    members: 'F · Cl · Br · I',
    headline: '单质 X₂，卤离子 X⁻',
    particle: '氯气：分开的 Cl₂ 分子',
    physical: 'F₂、Cl₂ 是气体，Br₂ 是液体，I₂ 是固体；颜色各不相同。',
    chemical: '常作氧化剂；与金属形成卤化物，强卤素可置换弱卤素。',
    boundary: 'Cl₂ 与 Cl⁻ 不是同一种粒子，不能共用单质颜色或反应性。',
    evidence:
      '钙与溴形成 CaBr₂，因为 $\\mathrm{Ca^{2+}}$ 配两个 $\\mathrm{Br^-}$；钾与溴则形成 KBr，不是 KBr₂。',
  },
  {
    name: '第 18 族 · 稀有气体',
    members: 'He · Ne · Ar',
    headline: '单原子、低反应性',
    particle: '氩气：彼此独立的 Ar 原子',
    physical: '常温为无色气体，熔沸点很低。',
    chemical: '外层排布稳定，常见条件下很不活泼，可提供保护气氛。',
    boundary: 'Ar 不是 Ar₂；“很不活泼”不等于所有稀有气体永远不反应。',
    evidence: '氩气保护热金属，是减少金属与周围活泼物质发生反应。==保护气氛不等于催化剂==。',
  },
]
const metalPoints = [
  { x: 94, y: 73 },
  { x: 160, y: 73 },
  { x: 226, y: 73 },
  { x: 94, y: 143 },
  { x: 160, y: 143 },
  { x: 226, y: 143 },
]
const gasPoints = [
  { x: 91, y: 70 },
  { x: 236, y: 84 },
  { x: 100, y: 166 },
  { x: 235, y: 159 },
  { x: 160, y: 121 },
]
const bubblePoints = [
  { x: 185, y: 98 },
  { x: 196, y: 81 },
  { x: 202, y: 61 },
]
const alkaliMetals = [
  {
    symbol: 'Li',
    name: '锂',
    melting: 180.5,
    boiling: 1342,
    density: 0.534,
    observation: '浮在水面并放出气泡；在三者中反应较缓。',
  },
  {
    symbol: 'Na',
    name: '钠',
    melting: 97.8,
    boiling: 883,
    density: 0.97,
    observation: '反应更剧烈，放热常使金属熔成小球，在水面移动。',
  },
  {
    symbol: 'K',
    name: '钾',
    melting: 63.5,
    boiling: 759,
    density: 0.89,
    observation: '反应更剧烈，并可能出现淡紫色火焰；不靠最终气泡总数判断速率。',
  },
]
const metrics: Array<{ key: Metric; label: string }> = [
  { key: 'melting', label: '熔点' },
  { key: 'boiling', label: '沸点' },
  { key: 'density', label: '密度' },
]
const halogens = [
  {
    symbol: 'F',
    state: '气体',
    appearance: '淡黄色',
    colour: '#f1edb8',
    aqueousColour: '',
    aqueousAppearance: '',
  },
  {
    symbol: 'Cl',
    state: '气体',
    appearance: '黄绿色',
    colour: '#c3d373',
    aqueousColour: '#d6df9c',
    aqueousAppearance: '淡黄绿色',
  },
  {
    symbol: 'Br',
    state: '液体',
    appearance: '红棕色',
    colour: '#a94f31',
    aqueousColour: '#df9b55',
    aqueousAppearance: '橙色',
  },
  {
    symbol: 'I',
    state: '固体',
    appearance: '灰黑色',
    colour: '#575361',
    aqueousColour: '#a47142',
    aqueousAppearance: '棕色',
  },
]
const aqueousHalogens = halogens.slice(1)

// 考纲叶节点决定所需模型，父章节复用首个三族对照。
const mode = computed(() =>
  props.topic === '140702' ? 'alkali' : props.topic === '140703' ? 'halogens' : 'families',
)
// 图题随当前知识点变化，避免三节展示相同说明。
const heading = computed(() =>
  mode.value === 'families'
    ? '三族先看粒子，再看反应'
    : mode.value === 'alkali'
      ? '一条族，几种不同的变化'
      : '谁能置换谁？把反应方向试出来',
)
// 用操作提示说明图解当前比较的变量及边界。
const instruction = computed(() =>
  mode.value === 'families'
    ? '切换元素族，对照常见单质的粒子形式与化学行为。'
    : mode.value === 'alkali'
      ? '选择金属和物性，再比较等质量与等摩尔的最终结果。'
      : '先看物态与趋势，再选择卤素单质和盐中的卤离子。',
)
// 所选族的资料与粒子图共用同一索引。
const family = computed(() => families[familyIndex.value]!)
// 物性和水反应观察同时承接所选碱金属。
const metal = computed(() => alkaliMetals[metalIndex.value]!)
// 共用配平的水反应，只替换本族金属符号。
const waterEquation = computed(
  () =>
    '$2\\mathrm{' +
    metal.value.symbol +
    '}+2\\mathrm{H_2O}\\rightarrow2\\mathrm{' +
    metal.value.symbol +
    'OH}+\\mathrm{H_2}$',
)
// 条形图按当前物性数值归一，密度保留相对水密度 1 的比例。
const metricMaximum = computed(() =>
  metric.value === 'density' ? 1 : Math.max(...alkaliMetals.map((item) => item[metric.value])),
)
// 物性标签统一取控制项的中文名称。
const metricLabel = computed(() => metrics.find((item) => item.key === metric.value)!.label)
// 温度与密度单位随比较项切换，避免数值脱离量纲。
const metricUnit = computed(() => (metric.value === 'density' ? 'g/cm³' : '°C'))
// 密度显式提示 Na/K 例外，其余物性不与反应性混用。
const metricExplanation = computed(() =>
  metric.value === 'density'
    ? 'Li、Na、K 的密度都小于水；K 比 Na 小，不能写成每往下一格密度都增加。'
    : 'Li → Na → K 的这一物性总体降低；与水反应更剧烈并不意味着熔点或沸点更高。',
)
// 水溶液置换只使用 Cl、Br、I，不给强烈与水反应的 F₂ 构造错误情境。
const donor = computed(() => aqueousHalogens[halogenIndex.value]!)
// 被比较的是另一种卤离子，不能误当加入了第二种单质。
const receiver = computed(() => aqueousHalogens[halideIndex.value]!)
// 常见水溶液中，族位置较高的卤素可氧化位置较低者的卤离子。
const canDisplace = computed(() => halogenIndex.value < halideIndex.value)
// 置换净离子方程保留双原子单质和两个一价离子以同时守恒原子与电荷。
const displacementEquation = computed(
  () =>
    '$\\mathrm{' +
    donor.value.symbol +
    '_2}+2\\mathrm{' +
    receiver.value.symbol +
    '^-}\\rightarrow2\\mathrm{' +
    donor.value.symbol +
    '^-}+\\mathrm{' +
    receiver.value.symbol +
    '_2}$',
)
// 卤离子足量时展示生成卤素的颜色；无置换时保留原卤素，不能假设变为无色。
const resultColour = computed(() =>
  canDisplace.value ? receiver.value.aqueousColour : donor.value.aqueousColour,
)
// 观察说明始终注明水溶液条件，并保留稀释造成颜色变化的边界。
const resultObservation = computed(() =>
  canDisplace.value
    ? '生成 ' +
      receiver.value.symbol +
      '₂，水溶液呈' +
      receiver.value.aqueousAppearance +
      '体系；深浅随浓度变化。'
    : '没有新卤素生成；' +
      donor.value.symbol +
      '₂ 原有的' +
      donor.value.aqueousAppearance +
      '可能因稀释而变浅。',
)
// 得失电子说明与选中的粒子同步，未反应时不虚构电子转移。
const electronExplanation = computed(() =>
  canDisplace.value
    ? donor.value.symbol +
      '₂ 得电子成为 ' +
      donor.value.symbol +
      '⁻；' +
      receiver.value.symbol +
      '⁻ 失电子成为 ' +
      receiver.value.symbol +
      '₂。Na⁺、K⁺ 等旁观离子未画出。'
    : '没有发生卤素之间的净电子转移；不能把颜色变浅本身当成置换证据。',
)

// 切换知识点后回到该节默认起点，避免前一节操作遗留影响新内容。
watch(
  () => props.topic,
  () => {
    familyIndex.value = 0
    metalIndex.value = 0
    metric.value = 'melting'
    equalMass.value = true
    halogenStage.value = 'trend'
    halogenIndex.value = 0
    halideIndex.value = 1
  },
)
</script>

<style scoped>
.group-atlas {
  margin: 0;
  padding: 22px;
  border: 1px solid #bde3dd;
  border-radius: 14px;
  background: linear-gradient(140deg, #f0faf8, #fff 70%);
  color: #132d40;
}
figcaption {
  margin-bottom: 18px;
}
.atlas-eyebrow {
  color: #087b7a;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
}
h5 {
  margin: 8px 0;
  font-size: 21px;
  line-height: 1.45;
}
figcaption p,
p {
  margin: 8px 0;
  line-height: 1.7;
}
figcaption p {
  font-size: 14px;
  color: #536b7a;
}
h6 {
  margin: 8px 0 12px;
  font-size: 18px;
  line-height: 1.5;
}
.atlas-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 10px 0 16px;
}
.atlas-controls :deep(.app-button.el-button.app-button--secondary) {
  --app-button-bg: #fff;
  --app-button-border: #c5dbef;
  --app-button-color: #2455a0;
  --app-button-hover-bg: #edf5ff;
  --app-button-hover-border: #9fc0ed;
  --app-button-active-bg: #e7f0ff;
  --app-button-active-border: #73a5e8;
}
.atlas-controls :deep(.app-button.el-button.app-button--secondary[aria-pressed='true']) {
  --app-button-bg: #e7f0ff;
  --app-button-border: #73a5e8;
  --app-button-color: #17499a;
}
.family-layout,
.alkali-layout {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.2fr);
  gap: 22px;
  align-items: start;
}
svg {
  display: block;
  width: 100%;
  max-height: 280px;
  font-family: inherit;
}
.sample-frame {
  fill: #fff;
  stroke: #d7e4e8;
}
.metal-particle {
  fill: #d7e2ef;
  stroke: #6384a6;
  stroke-width: 1.5;
}
.halogen-particle {
  fill: #dbe8a8;
  stroke: #849943;
  stroke-width: 1.5;
}
.noble-particle {
  fill: #d7eef2;
  stroke: #5b99a5;
  stroke-width: 1.5;
}
.particle-label {
  fill: #20374f;
  font-size: 14px;
  font-weight: 600;
}
.electron {
  fill: #3670b2;
  font-size: 14px;
}
.bond {
  stroke: #5b743c;
  stroke-width: 4;
}
.svg-caption {
  fill: #456475;
  font-size: 13px;
}
.small-label {
  display: block;
  color: #557082;
  font-size: 12px;
  font-weight: 600;
}
dl {
  margin: 0;
}
dl > div {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 10px;
  border-top: 1px solid #dfebee;
  padding: 11px 0;
  font-size: 14px;
  line-height: 1.7;
}
dt {
  color: #557082;
}
dd {
  margin: 0;
}
.atlas-insight {
  padding: 12px 15px;
  background: #e9f5f3;
  border-left: 3px solid #209588;
  color: #21525b;
  font-size: 14px;
}
.atlas-footnote,
.small-note {
  font-size: 12px;
  color: #607786;
  line-height: 1.65;
}
.atlas-footnote {
  margin: 18px 0 0;
}
.beaker {
  fill: none;
  stroke: #7894a3;
  stroke-width: 3;
}
.water {
  fill: #dceff8;
}
.bubble {
  fill: #fff;
  stroke: #61a3c7;
  stroke-width: 1.5;
}
.water-observation p {
  font-size: 14px;
}
.equation {
  overflow-x: auto;
  padding: 10px 0;
  font-size: 15px;
}
.bar-list {
  margin: 18px 0;
}
.bar-row {
  display: grid;
  grid-template-columns: 25px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 10px;
  margin: 14px 0;
  font-size: 13px;
}
.bar-track {
  height: 16px;
  background: #eaf0f5;
  border-radius: 3px;
  overflow: hidden;
}
.bar-track span {
  display: block;
  height: 100%;
  background: #abc9dc;
}
.is-selected .bar-track span {
  background: #278c9a;
}
.bar-number {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.direction-line {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #287577;
}
.quantity-check {
  border-top: 1px solid #dce8eb;
  margin-top: 18px;
  padding-top: 15px;
  font-size: 14px;
}
.quantity-check .atlas-controls {
  margin: 8px 0;
}
.halogen-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 22px 0;
}
.halogen-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  text-align: center;
}
.colour-sample {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 1px solid #c4d2d7;
}
.halogen-item strong {
  font-size: 20px;
}
.halogen-item span:not(.colour-sample) {
  font-size: 14px;
}
.halogen-item small {
  color: #5e7280;
}
.trend-lines p {
  display: grid;
  gap: 5px;
  padding: 12px 0;
  border-top: 1px solid #dce8eb;
}
.trend-lines span {
  font-size: 12px;
  color: #607786;
}
.trend-lines strong {
  font-size: 15px;
  color: #196c78;
}
.trend-lines small {
  font-size: 13px;
}
.reactant-selection {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}
.plus-sign {
  color: #79929f;
  font-size: 24px;
  margin: 0 8px;
}
.displacement-result {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  padding: 15px;
  border: 1px solid #d1e6e2;
  border-radius: 10px;
  background: #fff;
}
.displacement-result svg {
  max-height: 190px;
}
.result-label {
  color: #087d72;
  font-weight: 700;
}
.displacement-result p {
  font-size: 14px;
}
@media (max-width: 700px) {
  .group-atlas {
    padding: 16px;
  }
  .family-layout,
  .alkali-layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .family-layout svg {
    max-height: 220px;
  }
  .halogen-strip {
    gap: 5px;
  }
  .displacement-result {
    grid-template-columns: 85px minmax(0, 1fr);
    gap: 8px;
    padding: 10px;
  }
  .plus-sign {
    display: none;
  }
  .reactant-selection {
    display: block;
  }
}
</style>
