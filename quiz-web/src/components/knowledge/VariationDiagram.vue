<!-- 生物变异原创图谱：详细细菌群体追踪与植物遗传、营养双因素对照。 -->
<template>
  <BiologyAtlasFrame
    :title="isSources ? '同一种植物的株高差异，从哪里来？' : '跟着一群细菌，看耐药比例怎样改变'"
    :subtitle="
      isSources
        ? '四组植物同时比较：遗传品系 × 营养条件'
        : '保留细胞壁、膜、染色体 DNA 与核糖体，逐步追踪存活和繁殖'
    "
    :note="
      isSources
        ? '原创教学数据，与本节第一道例题一致。A、B 是遗传品系名称，不是一个基因的等位基因符号。株高按同一尺度绘制；器官形状为示意。每组代表多株的平均表现，其余条件受控。'
        : '原创教学模型，数字不代表某种药物的实际疗效。R 表示预先存在、可遗传的耐药类型；假定无突变和基因转移，所示繁殖后代全部存活。细菌与结构放大图均非实际比例。'
    "
  >
    <template #controls>
      <template v-if="isSources">
        <AppButton
          v-for="item in comparisons"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="comparison === item.id"
          @click="comparison = item.id"
          >{{ item.label }}</AppButton
        >
      </template>
      <template v-else>
        <AppButton
          v-for="(item, index) in stages"
          :key="item.title"
          type="secondary"
          size="small"
          :aria-pressed="stage === index"
          @click="stage = index"
          >{{ index + 1 }} · {{ item.title }}</AppButton
        >
      </template>
    </template>

    <svg
      v-if="!isSources"
      class="variation-illustration population-illustration"
      viewBox="0 0 840 570"
      role="img"
      :aria-label="`细菌群体：${currentStage.title}，活菌 ${currentStage.total} 个，其中耐药 ${currentStage.resistant} 个，耐药比例 ${currentStage.percentage}%。`"
    >
      <defs>
        <radialGradient :id="id('dish-fill')" cx="35%" cy="25%" r="80%">
          <stop offset="0" stop-color="var(--color-surface)" />
          <stop offset="1" stop-color="var(--color-learning-blue-soft)" />
        </radialGradient>
        <linearGradient :id="id('cytoplasm')" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stop-color="var(--color-surface)" />
          <stop offset="1" stop-color="var(--color-learning-teal-soft)" />
        </linearGradient>
        <g :id="id('bacterium')">
          <rect class="bacterial-wall" x="-39" y="-21" width="78" height="42" rx="21" />
          <rect
            class="bacterial-membrane"
            x="-34"
            y="-16"
            width="68"
            height="32"
            rx="16"
            :fill="paint('cytoplasm')"
          />
          <path
            class="bacterial-dna"
            d="M-18-2C-26-13-4-15 1-5S21 7 20-3S5-17 0-8S-12 15-18 5S-1-10 9-2S13 13 1 9S-11-10-18-2Z"
          />
          <path class="bacterial-highlight" d="M-18-2C-26-13-4-15 1-5" />
          <g class="ribosomes">
            <circle cx="-25" cy="5" r="1.5" />
            <circle cx="-13" cy="-11" r="1.5" />
            <circle cx="-7" cy="11" r="1.5" />
            <circle cx="12" cy="-11" r="1.5" />
            <circle cx="25" cy="5" r="1.5" />
            <circle cx="27" cy="-5" r="1.5" />
          </g>
        </g>
      </defs>
      <text class="stage-eyebrow" x="30" y="34">{{ currentStage.title }}</text>
      <text class="stage-subtitle" x="30" y="61">{{ currentStage.caption }}</text>
      <ellipse cx="255" cy="265" rx="239" ry="174" :fill="paint('dish-fill')" class="dish-outer" />
      <ellipse cx="255" cy="260" rx="228" ry="163" class="dish-inner" />
      <path d="M72 176C105 121 191 98 254 99" class="dish-reflection" />
      <g
        v-for="cell in population"
        :key="cell.key"
        class="microbe"
        :class="{ resistant: cell.resistant, dead: !cell.alive }"
        :transform="`translate(${cell.x} ${cell.y}) rotate(${cell.angle})`"
      >
        <use :href="`#${id('bacterium')}`" />
        <g v-if="cell.resistant" class="resistance-label">
          <circle cx="31" cy="-16" r="10" />
          <text x="31" y="-12" text-anchor="middle">R</text>
        </g>
        <path v-if="!cell.alive" class="dead-cross" d="M-25-25L25 25M25-25L-25 25" />
      </g>
      <g class="structure-zoom">
        <text x="557" y="104" class="detail-heading">耐药菌结构放大</text>
        <g class="microbe resistant" transform="translate(667 230) scale(2.7)">
          <use :href="`#${id('bacterium')}`" />
        </g>
        <path d="M615 184V147H556" class="structure-leader" />
        <text x="551" y="145" text-anchor="end" class="structure-label">细胞壁</text>
        <path d="M756 215H799V176" class="structure-leader" />
        <text x="797" y="164" text-anchor="end" class="structure-label">细胞膜</text>
        <path d="M631 215L585 318H546" class="structure-leader resistance-leader" />
        <text x="544" y="341" class="structure-label">染色体 DNA</text>
        <text x="544" y="363" class="small-note">橙色片段标出遗传差异</text>
        <path d="M737 245L777 293H806" class="structure-leader" />
        <text x="802" y="317" text-anchor="end" class="structure-label">核糖体</text>
        <text x="553" y="404" class="small-note">差异在处理前已存在</text>
        <text x="553" y="427" class="small-note">并不是药物教细菌“变耐药”</text>
      </g>
      <path d="M30 459H810" class="divider" />
      <text x="31" y="487" class="count-label">活菌 {{ currentStage.total }} 个</text>
      <text x="270" y="487" class="count-label resistance-text">
        耐药 {{ currentStage.resistant }} 个
      </text>
      <text x="535" y="487" class="count-label">耐药比例 {{ currentStage.percentage }}%</text>
      <rect x="31" y="506" width="778" height="18" rx="9" class="fraction-base" />
      <path :d="fractionPath" class="fraction-resistant" />
      <text x="31" y="550" class="small-note">{{ currentStage.footer }}</text>
    </svg>

    <svg
      v-else
      class="variation-illustration plant-illustration"
      viewBox="0 0 840 680"
      role="img"
      :aria-label="`受控植物实验：A 低营养 12 厘米、A 高营养 20 厘米、B 低营养 18 厘米、B 高营养 28 厘米。当前比较：${comparisonLabel}。`"
    >
      <defs>
        <linearGradient :id="id('leaf-fill')" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--color-learning-teal-soft)" />
          <stop offset="1" stop-color="var(--color-learning-teal)" />
        </linearGradient>
        <linearGradient :id="id('pot-fill')" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--color-learning-amber-soft)" />
          <stop offset="1" stop-color="var(--color-learning-amber-line)" />
        </linearGradient>
        <g :id="id('leaf')">
          <path
            d="M0 0C-5-19-23-35-54-29C-45-7-25 9 0 0Z"
            :fill="paint('leaf-fill')"
            class="leaf-outline"
          />
          <path
            d="M0 0Q-25-13-49-26M-13-8L-19-22M-26-15L-31-29M-20-12L-33-6M-36-21L-44-16"
            class="leaf-vein"
          />
        </g>
      </defs>
      <text x="30" y="33" class="stage-eyebrow">株高：同一尺度，单位 cm</text>
      <text x="30" y="59" class="stage-subtitle">
        同一品系内部遗传组成相同；两条品系 A、B 的遗传组成不同
      </text>
      <g
        v-for="plant in plants"
        :key="plant.label"
        :class="{ 'comparison-muted': !isHighlighted(plant) }"
      >
        <rect
          :x="plant.x - 88"
          y="80"
          width="176"
          height="463"
          rx="18"
          class="plant-panel"
          :class="{ 'line-b-panel': plant.line === 'B' }"
        />
        <rect
          :x="plant.x - 57"
          y="96"
          width="114"
          height="30"
          rx="15"
          class="line-badge"
          :class="{ 'line-b-badge': plant.line === 'B' }"
        />
        <text :x="plant.x" y="117" text-anchor="middle" class="line-label">
          遗传品系 {{ plant.line }}
        </text>
        <g :transform="`translate(${plant.x - 10} 440)`">
          <path
            :d="`M0 0Q-7 ${-plant.height * 4} 0 ${-plant.height * 10 + 15}`"
            class="plant-stem"
          />
          <g
            v-for="level in [0.24, 0.48, 0.72]"
            :key="level"
            :transform="`translate(0 ${-plant.height * 10 * level})`"
          >
            <use :href="`#${id('leaf')}`" />
            <use :href="`#${id('leaf')}`" transform="translate(0 -10) scale(-0.85 0.85)" />
          </g>
          <path
            :d="`M0 ${-plant.height * 10 + 18}C-15 ${-plant.height * 10 + 11}-7 ${-plant.height * 10 + 1} 0 ${-plant.height * 10}C8 ${-plant.height * 10 + 2}13 ${-plant.height * 10 + 11}0 ${-plant.height * 10 + 18}Z`"
            :fill="paint('leaf-fill')"
            class="leaf-outline"
          />
          <path d="M-56 0L-43 62Q0 73 43 62L56 0Z" :fill="paint('pot-fill')" class="pot-outline" />
          <ellipse cy="1" rx="56" ry="10" class="soil" />
          <path
            d="M0 0L-2 41M-1 13L-20 29L-29 45M-1 20L20 31L30 52M-2 30L-16 50M11 26L21 17M-13 24L-23 17"
            class="plant-roots"
          />
          <g class="mineral-dots">
            <circle
              v-for="n in plant.nutrients === 'high' ? 10 : 3"
              :key="n"
              :cx="-33 + ((n * 17) % 68)"
              :cy="15 + ((n * 13) % 38)"
              r="2.5"
            />
          </g>
          <path d="M-56 0Q0 20 56 0M-43 62Q0 73 43 62" class="pot-rim" />
        </g>
        <path
          :d="`M${plant.x + 62} 440V${440 - plant.height * 10}M${plant.x + 55} 440H${plant.x + 69}M${plant.x + 55} ${440 - plant.height * 10}H${plant.x + 69}`"
          class="height-ruler"
        />
        <text
          :x="plant.x + 62"
          :y="426 - plant.height * 10"
          text-anchor="middle"
          class="height-label"
        >
          {{ plant.height }}
        </text>
        <text :x="plant.x" y="527" text-anchor="middle" class="nutrient-label">
          {{ plant.nutrients === 'low' ? '低营养' : '高营养' }}
        </text>
      </g>
      <path d="M30 564H810" class="divider" />
      <text x="30" y="594" class="detail-heading">{{ comparisonLabel }}</text>
      <text x="30" y="624" class="comparison-equation">{{ comparisonEquation }}</text>
      <text x="30" y="654" class="small-note">{{ comparisonFooter }}</text>
    </svg>

    <template #legend>
      <template v-if="isSources">
        <span><i class="legend-dot line-a-dot" />A 品系</span>
        <span><i class="legend-dot line-b-dot" />B 品系</span>
        <span><i class="legend-dot mineral-dot" />土中圆点：营养水平示意</span>
        <span>高度标尺从土面到植株顶端</span>
      </template>
      <template v-else>
        <span><i class="legend-dot susceptible-dot" />敏感型</span>
        <span><i class="legend-dot resistance-dot" />R：耐药型</span>
        <span v-if="stage === 1">淡色 ×：处理后已死亡，不计入活菌总数</span>
        <span v-else>一幅完整菌体 = 一个细菌</span>
      </template>
    </template>
    <template #explanation>
      <h6>{{ isSources ? '先固定一个因素，再看另一个' : currentStage.explanationTitle }}</h6>
      <p><KnowledgeText :text="isSources ? comparisonExplanation : currentStage.explanation" /></p>
    </template>
  </BiologyAtlasFrame>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import AppButton from '../AppButton.vue'
import BiologyAtlasFrame from './BiologyAtlasFrame.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic?: string }>()
const prefix = useId().replace(/:/g, '')
const stage = ref(0)
const comparison = ref<'all' | 'line-a' | 'low-nutrient'>('all')

// 同一章节的两个考纲点分别展示群体选择和变异来源。
const isSources = computed(() => props.topic === '150702')

// 避免章节并排或切换时 SVG 引用串到其他图谱。
function id(name: string) {
  return `variation-${prefix}-${name}`
}

// 所有渐变引用指向本图自己的定义。
function paint(name: string) {
  return `url(#${id(name)})`
}

const stages = [
  {
    title: '处理之前',
    caption: '原有 9 个敏感菌 + 3 个耐药菌',
    total: 12,
    resistant: 3,
    percentage: 25,
    footer: '3 ÷ 12 = 25% · 原有差异是后续选择的基础。',
    explanationTitle: '先有可遗传的差异',
    explanation:
      '这 12 个细菌中，3 个已经是耐药型。图中把它们标为 R，并在染色体上标出遗传差异。**耐药类型在处理前已经存在**；并不需要假定药物会把敏感菌主动改造成耐药菌。',
  },
  {
    title: '处理后幸存',
    caption: '8 个敏感菌死亡；1 个敏感菌与 3 个耐药菌幸存',
    total: 4,
    resistant: 3,
    percentage: 75,
    footer: '3 ÷ 4 = 75% · 耐药菌仍是 3 个，比例已从 25% 升到 75%。',
    explanationTitle: '改变的是幸存者的组成',
    explanation:
      '淡色打叉的 8 个细菌已经死亡，不能放进“活菌总数”的分母。耐药菌数量仍为 3，活菌总数却从 12 降到 4，因此耐药比例升至 75%。**选择可以改变比例，而不增加耐药菌的绝对数量**。这里敏感菌仍有一个幸存，也说明真实判断要看相对成功，不能把类型当作绝对命运。',
  },
  {
    title: '幸存者繁殖',
    caption: '撤去药物；4 个幸存者各连续分裂两次，形成 16 个后代',
    total: 16,
    resistant: 12,
    percentage: 75,
    footer: '12 ÷ 16 = 75% · 两类都增为 4 倍，比例保持不变。',
    explanationTitle: '数量增长与比例变化要分开',
    explanation:
      '每个幸存细菌分裂两次后形成 4 个后代：3 个耐药菌形成 12 个耐药后代，1 个敏感菌形成 4 个敏感后代。耐药性随繁殖传递，但两类以相同倍数增长，所以比例仍是 75%。**“继续繁殖”本身不保证耐药比例继续增加**；比例进一步变化还需要相对繁殖成功不同等条件。',
  },
] as const

// 文案、数量和条形比例从同一阶段数据派生，避免切换后互相矛盾。
const currentStage = computed(() => stages[stage.value] ?? stages[0])

// 处理阶段保留死亡个体的位置，繁殖阶段按两个分裂轮次生成准确的后代数。
const population = computed(() => {
  if (stage.value === 2)
    return Array.from({ length: 16 }, (_, index) => ({
      key: index,
      x: 93 + (index % 4) * 108,
      y: 160 + Math.floor(index / 4) * 63,
      resistant: index % 4 !== 3,
      alive: true,
      angle: ((index % 3) - 1) * 13,
    }))
  return Array.from({ length: 12 }, (_, index) => ({
    key: index,
    x: 110 + (index % 3) * 145,
    y: 160 + Math.floor(index / 3) * 63,
    resistant: [0, 4, 8].includes(index),
    alive: stage.value === 0 || [0, 4, 8, 11].includes(index),
    angle: ((index % 3) - 1) * 13,
  }))
})

// 琥珀段长度只由活菌中的耐药比例决定，右侧保留敏感型的份额。
const fractionPath = computed(() => {
  const end = 31 + (778 * currentStage.value.percentage) / 100
  return `M40 506H${end}V524H40A9 9 0 0 1 40 506Z`
})

const comparisons = [
  { id: 'all' as const, label: '看全部对照' },
  { id: 'line-a' as const, label: '固定遗传品系 A' },
  { id: 'low-nutrient' as const, label: '固定低营养条件' },
]
interface PlantSample {
  label: string
  line: 'A' | 'B'
  nutrients: 'low' | 'high'
  height: number
  x: number
}
const plants: PlantSample[] = [
  { label: 'A-low', line: 'A', nutrients: 'low', height: 12, x: 113 },
  { label: 'A-high', line: 'A', nutrients: 'high', height: 20, x: 313 },
  { label: 'B-low', line: 'B', nutrients: 'low', height: 18, x: 513 },
  { label: 'B-high', line: 'B', nutrients: 'high', height: 28, x: 713 },
]

// 淡化本次比较以外的两组，仍保留完整实验背景。
function isHighlighted(plant: PlantSample) {
  return (
    comparison.value === 'all' ||
    (comparison.value === 'line-a' ? plant.line === 'A' : plant.nutrients === 'low')
  )
}

// 底部文字明确本次保持不变的因素。
const comparisonLabel = computed(
  () =>
    ({
      all: '遗传与环境都可以影响株高',
      'line-a': '固定 A 品系：比较营养条件',
      'low-nutrient': '固定低营养：比较遗传品系',
    })[comparison.value],
)

// 数字与四株植物的标尺一致，帮助学生在图中做同条件比较。
const comparisonEquation = computed(
  () =>
    ({
      all: 'A：12 → 20 cm　　B：18 → 28 cm',
      'line-a': 'A 低营养 12 cm　→　A 高营养 20 cm',
      'low-nutrient': '低营养：A 为 12 cm　／　B 为 18 cm',
    })[comparison.value],
)

// 提醒比较实验的证据边界，避免把观察差异直接写成唯一原因。
const comparisonFooter = computed(
  () =>
    ({
      all: '既比较同品系的两种环境，也比较同环境的两条品系。',
      'line-a': '遗传背景不变，营养改变；株高增加不代表 DNA 变成了 B 品系。',
      'low-nutrient': '营养及其他条件一致，遗传品系不同；支持遗传差异的影响。',
    })[comparison.value],
)

// 每个对照选择都有对应的教师式解释。
const comparisonExplanation = computed(
  () =>
    ({
      all: '先看 A 内部：营养提高后，平均株高从 12 cm 变成 20 cm，说明环境有影响。再看低营养下的 A 与 B：一个是 12 cm，一个是 18 cm，在其他条件受控时支持遗传差异也有影响。**两种因素可以同时起作用，不必二选一**。',
      'line-a':
        '这里高亮的两组都属于 A，遗传背景相同，区别是营养条件。株高从 12 cm 到 20 cm，支持营养影响表现型。**表现型可以变化而基因型不变**；这也没有证明株高完全不受基因影响。',
      'low-nutrient':
        '这里高亮的两组都在低营养环境中，年龄和其他条件也受控制。A 平均 12 cm，B 平均 18 cm，支持遗传差异影响株高。**这个 6 cm 的差距只描述本条件**，不能保证换成高营养后仍相差 6 cm。',
    })[comparison.value],
)
</script>

<style scoped>
.variation-illustration {
  min-width: 620px;
}
.stage-eyebrow {
  fill: var(--color-learning-teal);
  font-size: 17px;
  font-weight: 750;
}
.stage-subtitle {
  fill: var(--color-ink-soft);
  font-size: 14px;
}
.dish-outer {
  stroke: var(--color-learning-blue-line);
  stroke-width: 3;
}
.dish-inner {
  fill: none;
  stroke: var(--color-learning-blue-line);
  stroke-width: 1;
}
.dish-reflection {
  fill: none;
  stroke: var(--color-surface);
  stroke-width: 7;
  stroke-linecap: round;
}
.bacterial-wall {
  fill: var(--bacterial-wall-fill, var(--color-learning-blue-soft));
  stroke: var(--bacterial-wall-stroke, var(--color-learning-blue));
  stroke-width: 2.2;
}
.bacterial-membrane {
  stroke: var(--color-learning-teal);
  stroke-width: 1.2;
}
.bacterial-dna {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 1.5;
  stroke-linecap: round;
}
.bacterial-highlight {
  fill: none;
  stroke: var(--bacterium-resistance, var(--color-learning-violet));
  stroke-width: var(--resistance-stroke-width, 1.5);
}
.resistant {
  --bacterium-resistance: var(--color-learning-amber);
  --bacterial-wall-fill: var(--color-learning-amber-soft);
  --bacterial-wall-stroke: var(--color-learning-amber);
  --resistance-stroke-width: 2.7;
}
.ribosomes {
  fill: var(--color-learning-teal);
}
.resistance-label circle {
  fill: var(--color-learning-amber);
  stroke: var(--color-surface);
  stroke-width: 1.5;
}
.resistance-label text {
  fill: var(--color-ink-inverse);
  font-size: 12px;
  font-weight: 800;
}
.dead {
  opacity: 0.24;
}
.dead-cross {
  fill: none;
  stroke: var(--color-ink-soft);
  stroke-width: 3;
}
.structure-leader {
  fill: none;
  stroke: var(--color-ink-soft);
  stroke-width: 1.4;
}
.resistance-leader {
  stroke: var(--color-learning-amber);
}
.structure-label {
  fill: var(--color-ink);
  font-size: 14px;
  font-weight: 650;
}
.detail-heading {
  fill: var(--color-learning-teal);
  font-size: 17px;
  font-weight: 700;
}
.small-note {
  fill: var(--color-ink-soft);
  font-size: 14px;
}
.divider {
  stroke: var(--color-learning-teal-line);
  stroke-width: 1;
}
.count-label {
  fill: var(--color-ink);
  font-size: 19px;
  font-weight: 700;
}
.resistance-text {
  fill: var(--color-learning-amber);
}
.fraction-base {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue-line);
}
.fraction-resistant {
  fill: var(--color-learning-amber);
}
.plant-panel {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue-line);
}
.line-b-panel {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet-line);
}
.line-badge {
  fill: var(--color-surface);
  stroke: var(--color-learning-blue-line);
}
.line-b-badge {
  stroke: var(--color-learning-violet-line);
}
.line-label {
  fill: var(--color-ink);
  font-size: 14px;
  font-weight: 650;
}
.leaf-outline {
  stroke: var(--color-learning-teal);
  stroke-width: 1.2;
  stroke-linejoin: round;
}
.leaf-vein {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1;
}
.plant-stem {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 5;
  stroke-linecap: round;
}
.pot-outline {
  stroke: var(--color-learning-amber);
  stroke-width: 1.5;
}
.soil {
  fill: var(--color-learning-amber-line);
  stroke: var(--color-learning-amber);
  stroke-width: 1;
}
.pot-rim {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 1.6;
}
.plant-roots {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 1.5;
  stroke-linecap: round;
}
.mineral-dots {
  fill: var(--color-learning-violet);
}
.height-ruler {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1.4;
}
.height-label {
  fill: var(--color-learning-teal);
  font-size: 19px;
  font-weight: 750;
}
.nutrient-label {
  fill: var(--color-ink);
  font-size: 15px;
  font-weight: 650;
}
.comparison-muted {
  opacity: 0.32;
}
.comparison-equation {
  fill: var(--color-ink);
  font-size: 18px;
  font-weight: 600;
}
.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
}
.susceptible-dot,
.line-a-dot {
  background: var(--color-learning-blue);
}
.resistance-dot {
  background: var(--color-learning-amber);
}
.line-b-dot,
.mineral-dot {
  background: var(--color-learning-violet);
}
@media (max-width: 760px) {
  .variation-illustration {
    min-width: 600px;
  }
}
</style>
