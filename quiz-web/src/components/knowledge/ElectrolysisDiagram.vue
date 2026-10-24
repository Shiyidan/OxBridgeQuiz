<!-- ESAT 电解交互图：联动电极接线、离子迁移、材料条件和电子计量，嵌入第十二章讲义。 -->
<template>
  <figure class="electrolysis-atlas" :aria-label="heading">
    <figcaption>
      <span class="eyebrow">CHEMISTRY · 电子与离子接力</span>
      <h5>{{ heading }}</h5>
      <p>{{ instruction }}</p>
    </figcaption>
    <div class="choices" role="group" aria-label="选择电解条件">
      <AppButton
        v-for="(item, index) in cells"
        :key="item.label"
        size="small"
        type="secondary"
        :aria-pressed="cellIndex === index"
        @click="cellIndex = index"
        >{{ item.label }}</AppButton
      >
    </div>
    <div class="diagram-layout">
      <svg
        viewBox="0 0 460 330"
        role="img"
        :aria-label="`${cell.label}，阴极${cell.cathodeProduct}，阳极${cell.anodeProduct}`"
      >
        <title>直流电解示意，离子位置和数量不按比例；电子不穿过电解质。</title>
        <path d="M90 110V38H175 M285 38H370V110" class="wire" />
        <rect x="175" y="12" width="110" height="52" rx="8" class="power" />
        <text x="230" y="35" class="svg-title">直流电源</text>
        <text x="190" y="55" class="sign">{{ negativeLeft ? '−' : '+' }}</text>
        <text x="270" y="55" class="sign">{{ negativeLeft ? '+' : '−' }}</text>
        <path d="M32 112V282Q32 298 48 298H412Q428 298 428 282V112" class="beaker" />
        <path d="M35 155H425V280Q425 295 411 295H49Q35 295 35 280Z" class="liquid" />
        <rect
          x="76"
          y="104"
          width="28"
          height="145"
          rx="5"
          :class="negativeLeft ? 'cathode' : 'anode'"
        />
        <rect
          x="356"
          y="104"
          width="28"
          height="145"
          rx="5"
          :class="negativeLeft ? 'anode' : 'cathode'"
        />
        <text x="90" y="94" class="svg-title">{{ negativeLeft ? '阴极 −' : '阳极 +' }}</text>
        <text x="370" y="94" class="svg-title">{{ negativeLeft ? '阳极 +' : '阴极 −' }}</text>
        <text x="90" y="272" class="product">
          {{ negativeLeft ? cell.cathodeProduct : cell.anodeProduct }}
        </text>
        <text x="370" y="272" class="product">
          {{ negativeLeft ? cell.anodeProduct : cell.cathodeProduct }}
        </text>
        <g v-for="index in 3" :key="`positive-${index}`">
          <circle :cx="185 + (index % 2) * 36" :cy="167 + index * 27" r="15" class="positive-ion" />
          <text :x="185 + (index % 2) * 36" :y="172 + index * 27" class="ion-text">+</text>
        </g>
        <g v-for="index in 3" :key="`negative-${index}`">
          <circle :cx="267 + (index % 2) * 29" :cy="166 + index * 27" r="15" class="negative-ion" />
          <text :x="267 + (index % 2) * 29" :y="171 + index * 27" class="ion-text">−</text>
        </g>
        <path
          :d="
            negativeLeft
              ? 'M172 179H120L129 172M120 179L129 186'
              : 'M172 179H327L318 172M327 179L318 186'
          "
          class="positive-flow"
        />
        <path
          :d="
            negativeLeft
              ? 'M310 248H344L335 241M344 248L335 255'
              : 'M310 248H122L131 241M122 248L131 255'
          "
          class="negative-flow"
        />
        <text x="230" y="145" class="solution-label">{{ cell.ions }}</text>
        <text x="230" y="321" class="caption">溶液/熔体内靠离子迁移，外电路靠电子</text>
      </svg>
      <div class="reaction-reading" aria-live="polite">
        <p class="condition"><strong>先读条件</strong>{{ cell.condition }}</p>
        <div class="reaction cathode-reading">
          <span>阴极 · 得电子 · 还原</span><strong>{{ cell.cathode }}</strong>
        </div>
        <div class="reaction anode-reading">
          <span>阳极 · 失电子 · 氧化</span><strong>{{ cell.anode }}</strong>
        </div>
        <p class="insight">{{ cell.insight }}</p>
      </div>
    </div>
    <div class="bottom-controls">
      <AppButton type="secondary" size="small" @click="negativeLeft = !negativeLeft"
        >交换电源接线</AppButton
      >
      <span>位置可变，阴极始终还原、阳极始终氧化。</span>
    </div>
    <div class="amount-panel">
      <div class="choices" role="group" aria-label="选择通过的电子量">
        <span>通过电子</span>
        <AppButton
          v-for="amount in [2, 4, 6]"
          :key="amount"
          type="secondary"
          size="small"
          :aria-pressed="electronMoles === amount"
          @click="electronMoles = amount"
          >{{ amount }} mol e⁻</AppButton
        >
      </div>
      <p aria-live="polite">{{ amountReading }}</p>
      <small>理想计量示意：假设原料足量、无竞争副反应。实际电镀还需核对金属离子库存。</small>
    </div>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{ topic: string }>()
const cellIndex = ref(0)
const negativeLeft = ref(true)
const electronMoles = ref(2)
const cells = [
  {
    label: '熔融 PbBr₂',
    ions: 'Pb²⁺ / Br⁻（无水）',
    condition: '熔融盐、惰性电极；无水参与竞争。',
    cathode: 'Pb²⁺ + 2e⁻ → Pb',
    anode: '2Br⁻ → Br₂ + 2e⁻',
    cathodeProduct: '铅 Pb',
    anodeProduct: '溴 Br₂',
    insight: 'Pb 与 Br₂的摩尔比为 1 : 1；Br₂中的下标不表示产生两倍溴分子。',
  },
  {
    label: '浓盐水',
    ions: 'Na⁺ / Cl⁻ / H₂O',
    condition: '浓 NaCl 水溶液、惰性电极；水在阴极参与反应。',
    cathode: '2H₂O + 2e⁻ → H₂ + 2OH⁻',
    anode: '2Cl⁻ → Cl₂ + 2e⁻',
    cathodeProduct: '氢气 H₂',
    anodeProduct: '氯气 Cl₂',
    insight: '阴极没有钠金属；氢气与氯气摩尔比 1 : 1，残液可呈碱性。',
  },
  {
    label: '镀铜 · 石墨阳极',
    ions: 'Cu²⁺ / SO₄²⁻ / H₂O',
    condition: 'CuSO₄水溶液、惰性阳极；镀件是阴极。',
    cathode: 'Cu²⁺ + 2e⁻ → Cu',
    anode: '2H₂O → O₂ + 4H⁺ + 4e⁻',
    cathodeProduct: '铜镀层',
    anodeProduct: '氧气 O₂',
    insight: '阴极消耗 Cu²⁺，石墨阳极不补充；剩余铜离子减少，计算浓度还要读最终体积。',
  },
  {
    label: '镀铜 · 铜阳极',
    ions: 'Cu²⁺ / SO₄²⁻ / H₂O',
    condition: '含 Cu²⁺的水溶液、可溶性铜阳极。',
    cathode: 'Cu²⁺ + 2e⁻ → Cu',
    anode: 'Cu → Cu²⁺ + 2e⁻',
    cathodeProduct: '铜镀层',
    anodeProduct: '铜溶解',
    insight: '铜从阳极经溶液转移到阴极；在理想条件下补充与消耗的 Cu²⁺相等。',
  },
]
// 使用当前条件的一对半反应，避免将不同装置中的规则拼到一起。
const cell = computed(() => cells[cellIndex.value]!)
// 每个叶子有独立阅读重点，图中装置仍可跨情境比较。
const heading = computed(
  () =>
    ({
      '141201': '谁在导线中移动，谁在电解质中移动？',
      '141202': '交换接线，观察电极角色变化',
      '141203': '电子在半方程的哪一侧？',
      '141204': '同样通电，条件改变产物',
      '141205': '先对齐电子，再比较产物',
      '141206': '阳极换材料，铜离子的收支就变了',
    })[props.topic] || '把电解装置读成两条半方程',
)
// 将当前叶子的概念任务直接放在交互入口，避免只有装饰图。
const instruction = computed(() =>
  props.topic === '141206'
    ? '比较石墨阳极与铜阳极，观察哪种条件会补充溶液中的 Cu²⁺。'
    : '切换电解质和电极材料，先预测产物，再对照半方程；可交换接线检验阴阳极定义。',
)
// 用同一电子量计算两端产物，强调价态与双原子气体的系数。
const amountReading = computed(() => {
  const half = electronMoles.value / 2
  if (cellIndex.value === 0) return `阴极：${half} mol Pb；阳极：${half} mol Br₂。不是 2 : 1。`
  if (cellIndex.value === 1) return `阴极：${half} mol H₂；阳极：${half} mol Cl₂。Na⁺留在溶液。`
  if (cellIndex.value === 2)
    return `阴极沉积 ${half} mol Cu；阳极生成 ${electronMoles.value / 4} mol O₂；溶液少了 ${half} mol Cu²⁺。`
  return `阴极沉积 ${half} mol Cu；阳极溶解 ${half} mol Cu；Cu²⁺的净变化约为 0。`
})
// 知识点切换恢复与该点最相关的装置，避免前一节交互状态误导当前内容。
watch(
  () => props.topic,
  (topic) => {
    cellIndex.value = topic === '141206' ? 2 : topic === '141204' ? 1 : 0
    negativeLeft.value = true
    electronMoles.value = 2
  },
  { immediate: true },
)
</script>

<style scoped lang="scss">
// 图解选择沿用学习区配色，通过按下状态区分当前演示。
.electrolysis-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-color: var(--color-learning-teal);
  --app-button-hover-border: var(--color-learning-teal);
}
.electrolysis-atlas :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-color: var(--color-ink-inverse);
}

.electrolysis-atlas {
  margin: 0;
  padding: 24px;
  background: #f4fafb;
  border: 1px solid #cce4e6;
  border-radius: 16px;
  color: #173744;
}
.eyebrow {
  color: #0b777e;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
h5 {
  margin: 10px 0;
  font-size: 21px;
}
figcaption p {
  margin: 0 0 18px;
  line-height: 1.7;
  color: #526979;
}
.choices {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  [aria-pressed='true'] {
    color: #075f67;
    background: #d9f0ee;
    border-color: #13838a;
  }
}
.diagram-layout {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(240px, 1fr);
  gap: 20px;
  align-items: center;
  margin-top: 16px;
}
svg {
  width: 100%;
  min-width: 0;
  font-family: inherit;
  overflow: visible;
}
svg text {
  text-anchor: middle;
  fill: #284653;
  font-size: 12px;
}
.wire,
.beaker {
  fill: none;
  stroke: #638295;
  stroke-width: 3;
}
.power {
  fill: #fff;
  stroke: #8faab7;
  stroke-width: 2;
}
.liquid {
  fill: #dceff4;
}
.cathode {
  fill: #4776be;
}
.anode {
  fill: #14877e;
}
.svg-title {
  font-size: 14px;
  font-weight: 700;
}
.sign {
  font-size: 20px;
  font-weight: 700;
}
.product {
  font-size: 13px;
  font-weight: 700;
}
.positive-ion {
  fill: #e3edff;
  stroke: #527ed2;
}
.negative-ion {
  fill: #d5f1e6;
  stroke: #208c74;
}
.ion-text {
  font-size: 18px;
}
.positive-flow {
  fill: none;
  stroke: #527ed2;
  stroke-width: 2;
}
.negative-flow {
  fill: none;
  stroke: #208c74;
  stroke-width: 2;
}
.caption {
  fill: #5b7380;
}
.condition {
  display: grid;
  gap: 6px;
  line-height: 1.65;
  font-size: 14px;
}
.reaction {
  border-left: 3px solid;
  padding: 10px 12px;
  margin: 12px 0;
  display: grid;
  gap: 7px;
  background: #fff;
  span {
    font-size: 12px;
  }
  strong {
    font-size: 15px;
    overflow-wrap: anywhere;
  }
}
.cathode-reading {
  border-color: #4776be;
}
.anode-reading {
  border-color: #14877e;
}
.insight {
  line-height: 1.7;
  font-size: 14px;
}
.bottom-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #637784;
}
.amount-panel {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #d3e5e8;
  p {
    line-height: 1.7;
    font-weight: 600;
  }
  small {
    color: #657a88;
    line-height: 1.6;
  }
}
@media (max-width: 760px) {
  .diagram-layout {
    grid-template-columns: 1fr;
  }
  .electrolysis-atlas {
    padding: 16px;
  }
}
</style>
