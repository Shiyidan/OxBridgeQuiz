<!-- ESAT 酸碱盐互动图解：以粒子示意区分强弱、碱的角色及中和前后的当量，不代替真实实验数据。 -->
<template>
  <figure class="acid-atlas">
    <figcaption>
      <span>CHEMISTRY · 酸碱的粒子账本</span>
      <h5>{{ heading }}</h5>
    </figcaption>
    <template v-if="topic === '140901'">
      <div class="controls" role="group" aria-label="选择酸的电离模型">
        <AppButton
          v-for="value in [true, false]"
          :key="String(value)"
          :type="strong === value ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="strong === value"
          @click="strong = value"
          >{{ value ? '强一元酸' : '弱一元酸' }}</AppButton
        >
      </div>
      <p>相同体积、相同总酸量：只切换电离程度。</p>
      <svg
        viewBox="0 0 480 235"
        role="img"
        :aria-label="
          strong
            ? '十组酸全部示意为H正离子与A负离子'
            : '十组酸中两组电离，八组保留HA，仅为电离区别示意'
        "
      >
        <rect x="12" y="15" width="456" height="180" rx="16" class="vessel" />
        <g
          v-for="i in 10"
          :key="i"
          :transform="`translate(${50 + ((i - 1) % 5) * 91},${65 + Math.floor((i - 1) / 5) * 80})`"
        >
          <template v-if="strong || i <= 2">
            <circle cx="-12" cy="0" r="18" class="positive" />
            <circle cx="25" cy="0" r="19" class="negative" />
            <text x="-12" y="5">H⁺</text>
            <text x="25" y="5">A⁻</text>
          </template>
          <template v-else>
            <rect x="-27" y="-19" width="61" height="38" rx="19" class="molecule" />
            <text x="3" y="5">HA</text>
          </template>
        </g>
        <text x="240" y="223">
          {{
            strong
              ? '更多自由离子：导电性较强，常见反应初速较快'
              : '未电离 HA 仍能随 H⁺ 被消耗继续电离'
          }}
        </text>
      </svg>
      <div class="insight">
        <strong>完全中和的总量相同</strong>
        <p>
          两种模型均含 10 份一元酸，完全中和都需 10 份 OH⁻。图中弱酸的 2/10
          仅供示意，不代表真实电离率或 pH。
        </p>
      </div>
    </template>
    <template v-else-if="topic === '140902'">
      <div class="controls" role="group" aria-label="选择碱的例子">
        <AppButton
          v-for="(item, index) in bases"
          :key="item.name"
          :type="baseIndex === index ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="baseIndex === index"
          @click="baseIndex = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <svg viewBox="0 0 480 190" role="img" :aria-label="base.reaction">
        <rect x="22" y="35" width="125" height="75" rx="15" class="molecule" />
        <text x="84" y="78">{{ baseIndex === 0 ? 'OH⁻' : base.name }}</text>
        <text x="184" y="78">{{ baseIndex === 1 ? '+ 2H⁺' : '+ H⁺' }}</text>
        <path d="M235 72H295L286 65M295 72L286 79" />
        <rect x="322" y="35" width="136" height="75" rx="15" class="negative" />
        <text x="390" y="78">{{ base.product }}</text>
        <text x="240" y="155">{{ base.role }}</text>
      </svg>
      <div class="insight" aria-live="polite">
        <strong>{{ base.classification }}</strong>
        <p>{{ base.detail }}</p>
        <KnowledgeText :text="base.equation" />
      </div>
    </template>
    <template v-else>
      <div class="controls" role="group" aria-label="选择完全中和的酸">
        <AppButton
          v-for="item in acids"
          :key="item.name"
          :type="acid.name === item.name ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="acid.name === item.name"
          @click="acid = item"
          >{{ item.name }}</AppButton
        >
      </div>
      <p>
        固定 10 mmol 酸，加入 <strong>{{ hydroxide }} mmol OH⁻</strong>，按完全中和计量。
      </p>
      <el-slider
        v-model="hydroxide"
        :min="0"
        :max="30"
        :step="5"
        show-stops
        aria-label="加入的氢氧根毫摩尔数"
      />
      <div class="ledger" aria-live="polite">
        <div>
          <span>酸的可中和量</span><strong>{{ capacity }} mmol</strong>
        </div>
        <div>
          <span>已配对反应</span><strong>{{ reacted }} mmol</strong>
        </div>
        <div>
          <span>反应后</span><strong>{{ remainder }}</strong>
        </div>
      </div>
      <svg
        viewBox="0 0 480 105"
        role="img"
        :aria-label="`可中和量${capacity}毫摩尔，已反应${reacted}毫摩尔`"
      >
        <text x="50" y="23">酸当量</text>
        <rect x="100" y="8" :width="capacity * 10" height="21" rx="5" class="positive" />
        <text x="50" y="59">已反应</text>
        <rect x="100" y="44" :width="reacted * 10" height="21" rx="5" class="negative" />
        <text x="240" y="96">1 mmol H⁺ 当量与 1 mmol OH⁻ 配对</text>
      </svg>
      <div class="insight">
        <strong>{{ acid.name }} : OH⁻ = 1 : {{ acid.protons }}</strong>
        <p>
          这里统计的是可完全中和的酸当量，不代表溶液中全部质子都已自由电离，也不由当量图直接计算
          pH。
        </p>
      </div>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElSlider } from 'element-plus'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic: string }>()
const strong = ref(true)
const baseIndex = ref(0)
const bases = [
  {
    name: 'NaOH',
    product: 'H₂O',
    role: '溶于水后 OH⁻ 接受 H⁺',
    classification: '碱，也是可溶性碱',
    detail: 'Na⁺ 是旁观离子；净反应只保留 H⁺ 和 OH⁻。',
    equation: '$\\mathrm{H^++OH^-\\rightarrow H_2O}$',
    reaction: '氢氧化钠提供氢氧根，中和氢离子生成水',
  },
  {
    name: 'CuO',
    product: 'Cu²⁺ + H₂O',
    role: '固体氧化物也能接受 H⁺',
    classification: '不溶性碱性氧化物，不是 alkali',
    detail: '需要 2 份 H⁺；能与酸反应不要求先完全溶于水。',
    equation: '$\\mathrm{CuO+2H^+\\rightarrow Cu^{2+}+H_2O}$',
    reaction: '氧化铜与两份氢离子生成铜离子和水',
  },
  {
    name: 'NH₃',
    product: 'NH₄⁺',
    role: '氨直接接受一个质子',
    classification: '弱碱，不必在化学式中含 OH',
    detail: '氨与水建立平衡产生 OH⁻；和酸反应时按 1:1 接受质子。',
    equation: '$\\mathrm{NH_3+H^+\\rightarrow NH_4^+}$',
    reaction: '氨接受氢离子形成铵离子',
  },
]
const acids = [
  { name: 'HCl', protons: 1 },
  { name: 'H₂SO₄', protons: 2 },
  { name: 'H₃PO₄', protons: 3 },
]
const acid = ref(acids[0]!)
const hydroxide = ref(10)
// 章节内各叶子展示独立概念，避免共用不相干的固定图题。
const heading = computed(() =>
  props.topic === '140901'
    ? '强弱不同，为什么耗碱总量可以相同？'
    : props.topic === '140902'
      ? '碱的共同角色：接受 H⁺'
      : '让酸当量与 OH⁻ 一一配对',
)
// 当前物质的具体反应决定图解右侧的产物和分类。
const base = computed(() => bases[baseIndex.value]!)
// 每摩尔酸按完全中和可供给的质子数换算当量，不当作自由离子浓度。
const capacity = computed(() => 10 * acid.value.protons)
// 中和量由酸当量和加入的氢氧根中较少的一方限制。
const reacted = computed(() => Math.min(capacity.value, hydroxide.value))
// 只展示反应后的计量余量，不把未反应酸当量直接解释成 pH。
const remainder = computed(() =>
  capacity.value === hydroxide.value
    ? '恰好完全中和'
    : capacity.value > hydroxide.value
      ? `剩 ${capacity.value - hydroxide.value} mmol 酸当量`
      : `剩 ${hydroxide.value - capacity.value} mmol OH⁻`,
)
</script>

<style scoped lang="scss">
// 图解选择沿用学习区配色，通过按下状态区分当前演示。
.acid-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-color: var(--color-learning-teal);
  --app-button-hover-border: var(--color-learning-teal);
}
.acid-atlas :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-color: var(--color-ink-inverse);
}

.acid-atlas {
  margin: 0;
  padding: 22px;
  border: 1px solid #bbdedc;
  border-radius: 14px;
  background: linear-gradient(135deg, #f0fbf9, #fff);
  color: #173e4b;
  min-width: 0;
  font-size: 14px;
  line-height: 1.75;
  figcaption > span {
    font-size: 12px;
    letter-spacing: 1px;
    color: #087e80;
  }
  h5 {
    font-size: 20px;
    margin: 8px 0 16px;
  }
  p {
    margin: 9px 0;
  }
  svg {
    width: 100%;
    max-width: 620px;
    display: block;
    margin: 12px auto;
  }
  svg text {
    font-size: 13px;
    fill: #214958;
    text-anchor: middle;
  }
  svg path {
    fill: none;
    stroke: #14868b;
    stroke-width: 3;
  }
  .controls {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .vessel {
    fill: #fff;
    stroke: #afd5d1;
    stroke-width: 2;
  }
  .positive {
    fill: #fee2dc;
    stroke: #dd8a7a;
  }
  .negative {
    fill: #d2efea;
    stroke: #63aba4;
  }
  .molecule {
    fill: #edf1f8;
    stroke: #adbdcf;
  }
  .insight {
    border-left: 3px solid #168487;
    padding: 9px 14px;
    background: #fff;
  }
  .ledger {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin: 18px 0;
    .ledger div {
      min-width: 0;
    }
    span,
    strong {
      display: block;
    }
    span {
      color: #687d86;
      font-size: 12px;
    }
    strong {
      font-size: 15px;
    }
  }
}
@media (max-width: 580px) {
  .acid-atlas {
    padding: 15px;
    .ledger {
      grid-template-columns: 1fr;
      gap: 8px;
    }
    h5 {
      font-size: 18px;
    }
  }
}
</style>
