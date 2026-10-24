<!-- ESAT 能量变化互动图解：按知识点展示热流、可逆方向、多步能级、传热效率与键能账本。 -->
<template>
  <figure class="energy-atlas">
    <figcaption>
      <span>CHEMISTRY · 能量去哪了</span>
      <h5>{{ heading }}</h5>
    </figcaption>
    <template v-if="topic === '141101' || topic === '141102'">
      <div class="controls">
        <AppButton
          :type="reversed ? 'secondary' : 'primary'"
          size="small"
          :aria-pressed="!reversed"
          @click="reversed = false"
          >{{ topic === '141102' ? '正向：A → B' : '放热' }}</AppButton
        ><AppButton
          :type="reversed ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="reversed"
          @click="reversed = true"
          >{{ topic === '141102' ? '逆向：B → A' : '吸热' }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 480 230"
        role="img"
        :aria-label="
          reversed
            ? '热量由周围进入反应体系，体系吸热，周围温度降低'
            : '热量从反应体系进入周围，体系放热，周围温度升高'
        "
      >
        <rect x="20" y="47" width="150" height="100" rx="18" class="system" />
        <text x="95" y="86">反应体系</text>
        <text x="95" y="118">ΔH {{ reversed ? '+60' : '−60' }} kJ/mol</text>
        <rect x="310" y="47" width="150" height="100" rx="18" class="surroundings" />
        <text x="385" y="86">周围：水 / 溶液</text>
        <text x="385" y="118">{{ reversed ? '失热 · 降温' : '得热 · 升温' }}</text>
        <path
          :d="reversed ? 'M295 95H185L197 86M185 95L197 104' : 'M185 95H295L283 86M295 95L283 104'"
          class="heat-flow"
        />
        <text x="240" y="75">热量</text>
        <text x="240" y="186">反应体系与周围的热量符号相反</text>
        <text x="240" y="211">示意：同一反应、相同物态、相同反应量</text>
      </svg>
      <div class="insight" aria-live="polite">
        <strong>{{ reversed ? '吸热方向：产物能级更高' : '放热方向：产物能级更低' }}</strong>
        <p>
          {{
            topic === '141102'
              ? '反向时 ΔH 变号，大小不变；升温有利于本例吸热的 B → A 方向，但两方向的反应速率一般都会变快。催化剂不改变平衡位置。'
              : '温度计读周围温度，ΔH 描述反应体系。需要点火是启动门槛，不能据此判断总体吸热。'
          }}
        </p>
      </div>
    </template>
    <template v-else-if="topic === '141103'">
      <div class="controls">
        <AppButton
          :type="catalysed ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="catalysed"
          @click="catalysed = !catalysed"
          >{{ catalysed ? '移除催化路径' : '比较催化路径' }}</AppButton
        ><AppButton
          v-for="step in [1, 2]"
          :key="step"
          :type="energyStep === step ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="energyStep === step"
          @click="energyStep = step"
          >第 {{ step }} 步</AppButton
        >
      </div>
      <svg
        viewBox="0 0 480 270"
        role="img"
        :aria-label="`两步能级图：反应物40，中间体65，产物20。当前第${energyStep}步活化能${stepBarrier}示意单位。`"
      >
        <path d="M35 25V235H452" class="axis" />
        <text x="88" y="18">相对能量 / 示意单位</text>
        <text x="395" y="261">反应进程</text>
        <path
          d="M55 170H85C110 170 118 65 145 65S192 132.5 225 132.5S268 87.5 300 87.5S352 200 385 200H430"
          class="baseline"
        />
        <path
          v-if="catalysed"
          d="M55 170H85C110 170 118 102.5 145 102.5S192 132.5 225 132.5S268 110 300 110S352 200 385 200H430"
          class="catalysed"
        />
        <line
          :x1="energyStep === 1 ? 107 : 270"
          :x2="energyStep === 1 ? 107 : 270"
          :y1="energyStep === 1 ? 170 : 132.5"
          :y2="selectedPeakY"
          class="barrier"
        />
        <text x="72" y="191">R = 40</text>
        <text x="225" y="156">I = 65</text>
        <text x="402" y="221">P = 20</text>
        <text x="145" y="52">峰 1：{{ catalysed ? 85 : 110 }}</text>
        <text x="320" y="75">峰 2：{{ catalysed ? 80 : 95 }}</text>
      </svg>
      <div class="stats" aria-live="polite">
        <div>
          <span>本步起点</span><strong>{{ energyStep === 1 ? '反应物 40' : '中间体 65' }}</strong>
        </div>
        <div>
          <span>本步活化能</span><strong>{{ stepBarrier }}</strong>
        </div>
        <div><span>总 ΔH</span><strong>20 − 40 = −20</strong></div>
      </div>
      <p class="insight">
        第二步从中间体 65 开始，不能从 40
        或零点量。催化对比保留两端；绿色路径只用于示意更低门槛，不代表所有催化反应必有相同中间体或相同步数。
      </p>
    </template>
    <template v-else-if="topic === '141104'">
      <p>150 g 水升温 60°C，取 c = 4 J/(g·°C)，水始终需要 <strong>36 kJ</strong>。</p>
      <label>燃烧热进入水的比例：{{ efficiency }}%</label
      ><el-slider
        v-model="efficiency"
        :min="50"
        :max="100"
        :step="10"
        show-stops
        aria-label="热传递效率百分比"
      />
      <svg
        viewBox="0 0 480 230"
        role="img"
        :aria-label="`效率${efficiency}百分比，燃料需释放${fuelHeat.toFixed(1)}千焦，水吸收36千焦，其余散失`"
      >
        <rect x="20" y="64" width="150" height="80" rx="14" class="system" />
        <text x="95" y="95">燃料释放</text>
        <text x="95" y="121">{{ fuelHeat.toFixed(1) }} kJ</text>
        <path d="M180 94H300L290 86M300 94L290 102" class="heat-flow" />
        <path d="M226 103V183H300L290 175M300 183L290 191" class="loss-flow" />
        <rect x="310" y="53" width="150" height="80" rx="14" class="surroundings" />
        <text x="385" y="85">进入水中</text>
        <text x="385" y="112">36 kJ</text>
        <text x="386" y="185">散失 {{ (fuelHeat - 36).toFixed(1) }} kJ</text>
      </svg>
      <div class="stats" aria-live="polite">
        <div><span>甲醇燃烧热</span><strong>720 kJ/mol</strong></div>
        <div>
          <span>所需甲醇</span><strong>{{ ((fuelHeat / 720) * 32).toFixed(2) }} g</strong>
        </div>
      </div>
      <p class="insight">
        降低效率时，水所需热量保持 36 kJ，燃料需求上升。反推燃料热用 36 ÷
        效率，而不是乘效率。这里列出的是释放热量的正数大小；甲醇燃烧的反应焓为负。
      </p>
    </template>
    <template v-else>
      <div class="controls">
        <AppButton
          :type="cancelCommon ? 'primary' : 'secondary'"
          size="small"
          :aria-pressed="cancelCommon"
          @click="cancelCommon = !cancelCommon"
          >{{ cancelCommon ? '显示完整键数' : '约去共同的 4 根 C—H' }}</AppButton
        >
      </div>
      <KnowledgeText
        text="$\mathrm{C_2H_4+H_2\rightarrow C_2H_6}$，取 C=C：600、H—H：430、C—C：350、C—H：415 kJ/mol。"
      />
      <div class="bond-ledger">
        <div>
          <span>断键 · 吸热</span
          ><strong>{{ cancelCommon ? '1 C=C + 1 H—H' : '1 C=C + 4 C—H + 1 H—H' }}</strong>
          <p>+ {{ broken }} kJ/mol</p>
        </div>
        <div>
          <span>成键 · 放热</span
          ><strong>{{ cancelCommon ? '1 C—C + 2 C—H' : '1 C—C + 6 C—H' }}</strong>
          <p>− {{ formed }} kJ/mol</p>
        </div>
      </div>
      <svg
        viewBox="0 0 480 160"
        role="img"
        :aria-label="`断键${broken}，成键${formed}，差为负150千焦每摩尔`"
      >
        <text x="51" y="42">断键</text>
        <rect x="90" y="23" :width="(broken / formed) * 325" height="29" rx="5" class="system" />
        <text x="51" y="98">成键</text>
        <rect x="90" y="79" width="325" height="29" rx="5" class="surroundings" />
        <text x="240" y="145">{{ broken }} − {{ formed }} = −150 kJ/mol</text>
      </svg>
      <p class="insight">
        约去相同键能项可以减少运算，但不会改变 ΔH。两根新 C—H 的能量是 2 ×
        415，不能漏掉系数，也不能把 830 当作一根键的键能。
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElSlider } from 'element-plus'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'
const props = defineProps<{ topic: string }>()
const reversed = ref(false)
const catalysed = ref(false)
const energyStep = ref(1)
const efficiency = ref(80)
const cancelCommon = ref(true)
// 每个知识点使用对应能量表示，避免所有页面重复同一能级图。
const heading = computed(
  () =>
    (
      ({
        '141101': '一份热，两种观察方向',
        '141102': '反应反向，热量收支也反向',
        '141103': '第二座峰，从第二步起点量',
        '141104': '水需要的热不变，效率改变燃料需求',
        '141105': '把每一根键记入能量账本',
      }) as Record<string, string>
    )[props.topic] || '能量变化的图形账本',
)
// 每步峰值与各自起点独立匹配，保证分步活化能的参考高度正确。
const peak = computed(() =>
  energyStep.value === 1 ? (catalysed.value ? 85 : 110) : catalysed.value ? 80 : 95,
)
// SVG纵轴以230为零点，每示意能量单位占1.5坐标单位。
const selectedPeakY = computed(() => 230 - peak.value * 1.5)
// 分步能垒从该步起始物或中间体能级量起。
const stepBarrier = computed(() => peak.value - (energyStep.value === 1 ? 40 : 65))
// 36kJ为固定水吸热量，反推燃料释放热需要除以传热效率。
const fuelHeat = computed(() => 36 / (efficiency.value / 100))
// 完整断键账本和约去共同键的账本只相差同样的四根C—H。
const broken = computed(() => 1030 + (cancelCommon.value ? 0 : 4 * 415))
// 成键以六根或净新增两根C—H计数，避免遗漏反应中的键数。
const formed = computed(() => 1180 + (cancelCommon.value ? 0 : 4 * 415))
</script>

<style scoped lang="scss">
// 图解选择沿用学习区配色，通过按下状态区分当前演示。
.energy-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-color: var(--color-learning-teal);
  --app-button-hover-border: var(--color-learning-teal);
}
.energy-atlas :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-color: var(--color-ink-inverse);
}

.energy-atlas {
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
  .controls {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  svg {
    width: 100%;
    max-width: 620px;
    display: block;
    margin: 12px auto;
  }
  svg text {
    font-size: 12px;
    fill: #214958;
    text-anchor: middle;
  }
  .axis {
    fill: none;
    stroke: #78969e;
    stroke-width: 1.5;
  }
  .system {
    fill: #ffe6dc;
    stroke: #dbab90;
  }
  .surroundings {
    fill: #d8f1eb;
    stroke: #88c3b4;
  }
  .heat-flow {
    fill: none;
    stroke: #d58a3c;
    stroke-width: 4;
  }
  .loss-flow {
    fill: none;
    stroke: #9baab7;
    stroke-width: 2;
  }
  .baseline,
  .catalysed {
    fill: none;
    stroke: #416ed3;
    stroke-width: 3;
  }
  .catalysed {
    stroke: #078d81;
  }
  .barrier {
    stroke: #d58a3c;
    stroke-width: 3;
  }
  .insight {
    border-left: 3px solid #168487;
    padding: 9px 14px;
    background: #fff;
  }
  .stats,
  .bond-ledger {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin: 14px 0;
    span,
    strong {
      display: block;
    }
    span {
      font-size: 12px;
      color: #647b86;
    }
    strong {
      font-size: 16px;
    }
  }
  .bond-ledger {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    > div {
      padding: 14px;
      background: #fff;
      border-radius: 10px;
      border-top: 3px solid #d58a3c;
    }
    > div + div {
      border-color: #078d81;
    }
    strong {
      font-size: 14px;
    }
  }
}
@media (max-width: 580px) {
  .energy-atlas {
    padding: 15px;
    .stats,
    .bond-ledger {
      grid-template-columns: 1fr;
    }
    h5 {
      font-size: 18px;
    }
  }
}
</style>
