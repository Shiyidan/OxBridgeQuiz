<!-- 试题库知识讲解示意：按知识类型分发数学、生物、化学与物理互动图解。 -->
<template>
  <component :is="chapterDiagram" v-if="chapterDiagram" :key="topic" :topic="topic" />
  <BiologyKnowledgeVisual v-else-if="isBiologyVisual" :kind="kind" />
  <figure
    v-else-if="['unit-scale', 'number-line', 'bounds'].includes(kind)"
    class="knowledge-visual"
  >
    <template v-if="kind === 'unit-scale'">
      <figcaption>
        <span class="visual-label">互动图解</span>
        <span>看懂换算：每一个方向，都要换一次单位</span>
      </figcaption>
      <div class="dimension-controls" role="group" aria-label="选择换算维度">
        <AppButton
          v-for="item in dimensions"
          :key="item.power"
          :type="dimension === item.power ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="dimension === item.power"
          @click="dimension = item.power"
          >{{ item.label }}</AppButton
        >
      </div>
      <svg viewBox="0 0 520 175" role="img" :aria-label="dimensionAccessibleLabel">
        <g v-if="dimension === 1" class="shape unit-shape">
          <path d="M45 85H175 M45 77V93 M175 77V93" />
          <text x="110" y="116">1 m</text>
        </g>
        <g v-else-if="dimension === 2" class="shape unit-shape">
          <rect class="unit-face" x="65" y="32" width="105" height="105" />
          <text x="117" y="158">1 m</text>
          <text x="38" y="90">1 m</text>
          <text x="117" y="90">1 m²</text>
        </g>
        <g v-else class="shape unit-shape">
          <polygon class="unit-face" points="65,60 145,60 145,140 65,140" />
          <polygon class="unit-face unit-face--top" points="65,60 100,30 180,30 145,60" />
          <polygon class="unit-face unit-face--side" points="145,60 180,30 180,110 145,140" />
          <path d="M65 60H145V140H65Z M65 60L100 30H180V110L145 140 M145 60L180 30" />
          <text x="104" y="104">1 m³</text>
          <text x="105" y="162">1 m</text>
          <text x="40" y="106">1 m</text>
          <text x="77" y="37">1 m</text>
        </g>
        <g class="shape conversion-arrow">
          <path d="M220 85H285L276 78 M285 85L276 92" />
          <text x="252" y="63">
            {{ dimension === 1 ? '×100' : `×100${dimension === 2 ? '²' : '³'}` }}
          </text>
        </g>
        <rect class="result-background" x="304" y="56" width="196" height="43" rx="10" />
        <text class="result" x="402" y="86">{{ dimensionResult }}</text>
        <text class="caption" x="402" y="116">
          {{ dimension === 1 ? '换 1 个方向' : `换 ${dimension} 个方向` }}
        </text>
      </svg>
      <p><LatexText :text="dimensionDescription" /></p>
    </template>
    <template v-else-if="kind === 'number-line'">
      <figcaption>
        <span class="visual-label">数轴图解</span>
        <span>数轴上，越往右越大</span>
      </figcaption>
      <svg
        viewBox="0 0 520 145"
        role="img"
        aria-label="数轴：负2.5在负0.5左边，负0.5在四分之三左边"
      >
        <g class="shape axis">
          <path d="M28 82H493L485 76 M493 82L485 88" />
          <g v-for="tick in 7" :key="tick">
            <path :d="`M${40 + (tick - 1) * 72} 77V87`" />
            <text :x="40 + (tick - 1) * 72" y="112">{{ tick - 4 }}</text>
          </g>
          <g class="focus-points">
            <circle cx="76" cy="82" r="5" class="closed-point" />
            <circle cx="220" cy="82" r="5" class="closed-point" />
            <circle cx="310" cy="82" r="5" class="closed-point" />
            <text x="76" y="55">−2.5</text>
            <text x="220" y="55">−0.5</text>
            <text x="310" y="55">3/4</text>
          </g>
        </g>
      </svg>
      <p>
        <LatexText
          :text="String.raw`$-2.5 < -0.5 < \frac{3}{4}$。比较负数时，不能只比较去掉负号后的大小。`"
        />
      </p>
    </template>
    <template v-else>
      <figcaption>
        <span class="visual-label">区间图解</span>
        <span>显示为 3.4，真实值可以在哪里？</span>
      </figcaption>
      <svg
        viewBox="0 0 520 155"
        role="img"
        aria-label="按通常四舍五入保留一位小数，3.35包含在区间，3.45不包含在区间"
      >
        <g class="shape axis">
          <path d="M35 85H485 M100 78V92 M260 78V92 M420 78V92" />
          <path class="focus-interval" d="M100 85H420" stroke-width="6" />
          <circle cx="100" cy="85" r="7" class="closed-point" />
          <circle cx="420" cy="85" r="7" class="open-point" />
          <text class="included-label" x="100" y="120">3.35</text>
          <text x="260" y="120">3.4</text>
          <text class="excluded-label" x="420" y="120">3.45</text>
          <text class="included-label" x="100" y="51">包含下界</text>
          <text class="excluded-label" x="420" y="51">不含上界</text>
        </g>
      </svg>
      <p>
        <LatexText
          :text="
            String.raw`按通常四舍五入保留一位小数：$3.35 \le x < 3.45$。半个最小刻度是 $0.05$；3.45 会舍入为 3.5。`
          "
        />
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, type Component } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'
import BiologyKnowledgeVisual from './BiologyKnowledgeVisual.vue'
import type { KnowledgeSection } from '@/content/knowledge/types'

const props = defineProps<{ kind: NonNullable<KnowledgeSection['visual']>; topic?: string }>()

const diagramModules = import.meta.glob<{ default: Component }>('./*Diagram.vue')
const chapterFiles = {
  'maths-units': 'UnitsLearningDiagram',
  'maths-number': 'NumberLearningDiagram',
  'maths-ratio': 'RatioLearningDiagram',
  'maths-algebra': 'AlgebraLearningDiagram',
  'maths-geometry': 'GeometryLearningDiagram',
  'maths-statistics': 'StatisticsLearningDiagram',
  'maths-probability': 'ProbabilityLearningDiagram',
  'physics-electricity': 'ElectricityDiagram',
  'physics-magnetism': 'MagnetismDiagram',
  'physics-mechanics': 'MechanicsDiagram',
  'physics-thermal': 'ThermalPhysicsDiagram',
  'physics-matter': 'MatterDiagram',
  'physics-waves': 'WavesDiagram',
  'physics-radioactivity': 'RadioactivityDiagram',
  'cell-division': 'CellDivisionDiagram',
  inheritance: 'InheritanceDiagram',
  dna: 'DnaDiagram',
  'gene-technologies': 'GeneTechnologiesDiagram',
  variation: 'VariationDiagram',
  enzymes: 'EnzymesDiagram',
  'animal-physiology': 'AnimalPhysiologyDiagram',
  ecosystems: 'EcosystemsDiagram',
  'plant-physiology': 'PlantPhysiologyDiagram',
  'atomic-structure': 'AtomicStructureDiagram',
  'periodic-table': 'PeriodicTableDiagram',
  'chemical-reactions': 'ChemicalReactionsDiagram',
  'quantitative-chemistry': 'QuantitativeChemistryDiagram',
  redox: 'RedoxDiagram',
  'chemical-bonding': 'ChemicalBondingDiagram',
  'group-chemistry': 'GroupChemistryDiagram',
  'separation-techniques': 'SeparationTechniquesDiagram',
  'acids-bases-salts': 'AcidsBasesSaltsDiagram',
  'reaction-rates': 'ReactionRatesDiagram',
  'energy-changes': 'EnergyChangesDiagram',
  electrolysis: 'ElectrolysisDiagram',
  'organic-chemistry': 'OrganicChemistryDiagram',
  metals: 'MetalsDiagram',
  'particle-theory': 'ParticleTheoryDiagram',
  'chemical-tests': 'ChemicalTestsDiagram',
  'air-water': 'AirWaterDiagram',
} as const
const chapterDiagrams = Object.fromEntries(
  Object.entries(chapterFiles).flatMap(([kind, filename]) => {
    const loader = diagramModules[`./${filename}.vue`]
    return loader ? [[kind, defineAsyncComponent(loader)]] : []
  }),
) as Partial<Record<NonNullable<KnowledgeSection['visual']>, Component>>

// 章节图谱按需加载，知识点编号决定图中展示的具体机制或器官。
const chapterDiagram = computed(() => chapterDiagrams[props.kind])

// 生物图示交给独立组件，避免新的类型落入数学误差区间的兜底分支。
const isBiologyVisual = computed(() =>
  ['eukaryotic-cell', 'prokaryotic-cell', 'organisation', 'membrane-transport'].includes(
    props.kind,
  ),
)

const dimension = ref(1)
const dimensions = [
  { power: 1, label: '长度' },
  { power: 2, label: '面积' },
  { power: 3, label: '体积' },
]

// 长度、面积和体积分别累乘一、二、三次线性换算因子。
const dimensionResult = computed(
  () => ['100 cm', '10 000 cm²', '1 000 000 cm³'][dimension.value - 1],
)

// 图形无障碍名称使用自然语言，避免辅助阅读器朗读 LaTeX 源码。
const dimensionAccessibleLabel = computed(
  () =>
    ['1 米等于 100 厘米', '1 平方米等于 10000 平方厘米', '1 立方米等于 1000000 立方厘米'][
      dimension.value - 1
    ],
)

// 为图形同时提供可读说明，强调平方和立方来自独立方向而非移动小数点口诀。
const dimensionDescription = computed(
  () =>
    [
      String.raw`$1\,\mathrm{m}=100\,\mathrm{cm}$，长度换算一次。`,
      String.raw`$1\,\mathrm{m}^2=(100\,\mathrm{cm})^2=10\,000\,\mathrm{cm}^2$，长和宽都乘 100。`,
      String.raw`$1\,\mathrm{m}^3=(100\,\mathrm{cm})^3=1\,000\,000\,\mathrm{cm}^3$，长、宽、高都乘 100。`,
    ][dimension.value - 1]!,
)
</script>

<style scoped>
.knowledge-visual {
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
  color: var(--color-learning-teal);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
  line-height: var(--leading-normal);
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
.dimension-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
/* 维度按钮仅在图卡内使用教学主题，保留公共按钮的键盘与按压行为。 */
.dimension-controls .app-button.el-button {
  --app-button-bg: var(--color-surface);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-color: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-border: var(--color-learning-teal);
  --app-button-active-bg: var(--color-learning-teal-line);
  --app-button-active-border: var(--color-learning-teal);
}
.dimension-controls .app-button.el-button[aria-pressed='true'] {
  --app-button-bg: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-active-bg: var(--color-learning-teal);
}
.dimension-controls .app-button.el-button:focus-visible {
  outline-color: var(--color-learning-teal);
}
svg {
  display: block;
  width: 100%;
  max-width: 600px;
  margin: 16px auto 0;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-learning-teal);
  overflow: visible;
}
.shape {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
}
.unit-shape {
  stroke-width: 2;
}
.unit-face {
  fill: var(--color-learning-teal-soft);
}
.unit-face--top {
  fill: var(--color-learning-teal-line);
}
.unit-face--side {
  fill: color-mix(in srgb, var(--color-learning-teal) 20%, var(--color-surface));
}
.conversion-arrow {
  color: var(--color-learning-blue);
  stroke-width: 2;
}
.axis {
  color: var(--color-ink-muted);
}
.axis > text,
.axis > g:not(.focus-points) text {
  fill: var(--color-ink-soft);
}
.focus-points,
.focus-interval {
  color: var(--color-learning-teal);
  stroke: var(--color-learning-teal);
}
.focus-points text,
.axis > .included-label {
  fill: var(--color-learning-teal);
  font-weight: var(--weight-semi);
}
.axis > .excluded-label {
  fill: var(--color-learning-amber);
  font-weight: var(--weight-semi);
}
text {
  fill: currentColor;
  stroke: none;
  text-anchor: middle;
  font-family: var(--font-sans);
  font-size: 15px;
}
.result {
  fill: var(--color-learning-teal);
  font-size: 19px;
  font-weight: var(--weight-semi);
}
.result-background {
  fill: var(--color-learning-teal-soft);
}
.caption {
  fill: var(--color-ink-soft);
}
.closed-point {
  fill: var(--color-learning-teal);
  stroke: var(--color-learning-teal);
}
.open-point {
  fill: var(--color-surface);
  stroke: var(--color-learning-amber);
  stroke-width: 2;
}
p {
  margin: 16px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--color-learning-teal-line);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
@media (max-width: 780px) {
  .knowledge-visual {
    padding: 12px;
  }
  text {
    font-size: 22px;
  }
  .result {
    font-size: 24px;
  }
}
</style>
