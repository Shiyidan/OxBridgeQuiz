<!-- ESAT 空气与水图解：联动分馏、红外吸收、污染物路径和净水步骤，区分相似名词的作用。 -->
<template>
  <figure class="environment-atlas" :aria-label="heading">
    <figcaption>
      <span class="eyebrow">CHEMISTRY · 空气与水</span>
      <h5>{{ heading }}</h5>
      <p>{{ instruction }}</p>
    </figcaption>

    <template v-if="mode === 'air'">
      <div
        class="air-composition"
        role="img"
        aria-label="干空气近似组成：78%氮气、21%氧气、约1%氩气及其他气体"
      >
        <span class="nitrogen">N₂ · 78%</span><span class="oxygen">O₂ · 21%</span
        ><span class="other"></span>
      </div>
      <p class="small-note">其余约1%主要为Ar及微量气体；图中比例为考试常用近似，不含水蒸气。</p>
      <div class="controls" role="group" aria-label="选择液化空气分馏阶段">
        <AppButton
          v-for="(item, index) in distillation"
          :key="item.gas"
          size="small"
          :type="distillationIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="distillationIndex === index"
          @click="distillationIndex = index"
          >{{ index + 1 }} · {{ item.gas }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 550 230"
        role="img"
        :aria-label="`${fraction.gas}沸点约${fraction.boiling}摄氏度，按升温顺序第${distillationIndex + 1}收集`"
      >
        <title>氮、氩、氧沸点数轴与分馏收集顺序示意</title>
        <path d="M48 130H510L500 124M510 130L500 136" class="axis" />
        <g v-for="(item, index) in distillation" :key="item.gas">
          <path :d="`M${item.x} 122V138`" class="tick" />
          <circle
            :cx="item.x"
            cy="130"
            :r="distillationIndex === index ? 11 : 7"
            :class="distillationIndex === index ? 'selected-dot' : 'dot'"
          />
          <text :x="item.x" y="95" text-anchor="middle" class="gas-name">{{ item.gas }}</text>
          <text :x="item.x" y="163" text-anchor="middle">{{ item.boiling }} °C</text>
        </g>
        <text x="280" y="208" text-anchor="middle">逐渐升温：低沸点先汽化 →</text>
      </svg>
      <div class="result" aria-live="polite">
        <strong>{{ fraction.gas }} · {{ fraction.name }}</strong>
        <p>{{ fraction.note }}</p>
      </div>
      <p class="insight">
        两道独立判断：先按空气组成选出N₂、O₂、Ar，再按沸点排成N₂→Ar→O₂。含量排序不能替代沸点排序。
      </p>
    </template>

    <template v-else-if="mode === 'greenhouse'">
      <div class="controls" role="group" aria-label="选择大气气体">
        <AppButton
          v-for="(item, index) in greenhouseGases"
          :key="item.name"
          size="small"
          :type="greenhouseIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="greenhouseIndex === index"
          @click="greenhouseIndex = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 560 290"
        role="img"
        :aria-label="
          greenhouse.active
            ? `${greenhouse.name}可吸收部分地表红外辐射并再发射`
            : `${greenhouse.name}不是主要温室气体，不能把大气含量等同红外吸收作用`
        "
      >
        <title>温室效应机制示意；不按气体含量或强度绘制，箭头表示辐射方向</title>
        <rect x="25" y="25" width="510" height="225" rx="16" fill="#eff7fc" />
        <path d="M25 230Q275 190 535 230V260H25Z" fill="#bbdbbf" />
        <text x="280" y="253" text-anchor="middle">地表</text>
        <circle cx="78" cy="66" r="23" fill="#f2c45a" />
        <path d="M102 86L170 200L160 194M170 200L170 188" class="sun-ray" />
        <text x="114" y="135">太阳辐射</text>
        <path d="M285 212V118L279 129M285 118L291 129" class="infrared" />
        <text x="300" y="183">地表红外</text>
        <circle
          cx="285"
          cy="90"
          r="31"
          :fill="greenhouse.active ? '#d9ecec' : '#e5ebf1'"
          stroke="#88aab8"
        />
        <text x="285" y="95" text-anchor="middle" class="gas-name">{{ greenhouse.name }}</text>
        <template v-if="greenhouse.active">
          <path
            d="M304 113L380 195L370 190M380 195L378 184 M306 69L380 35L369 35M380 35L374 45 M254 90H190L201 84M190 90L201 96"
            class="infrared"
          />
          <text x="394" y="124">向各方向再发射</text>
        </template>
        <template v-else>
          <path d="M285 58V27L279 38M285 27L291 38" class="passing" />
          <text x="345" y="80">不是主要红外吸收者</text>
        </template>
      </svg>
      <div class="result" aria-live="polite">
        <strong>{{ greenhouse.title }}</strong>
        <p>{{ greenhouse.note }}</p>
      </div>
      <p class="insight">
        图示只解释机制，不比较CO₂、CH₄与水蒸气的温室效应强弱。强弱还与浓度、波段、寿命及比较时间尺度有关。
      </p>
    </template>

    <template v-else-if="mode === 'pollution'">
      <div class="controls" role="group" aria-label="选择污染物">
        <AppButton
          v-for="(item, index) in pollutants"
          :key="item.name"
          size="small"
          :type="pollutantIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="pollutantIndex === index"
          @click="pollutantIndex = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="pollutant-route" aria-live="polite">
        <div>
          <small>从哪里来</small><strong>{{ pollutant.source }}</strong>
          <p>{{ pollutant.formation }}</p>
        </div>
        <span class="route-arrow" aria-hidden="true">→</span>
        <div>
          <small>主要影响</small><strong>{{ pollutant.effect }}</strong>
          <p>{{ pollutant.explanation }}</p>
        </div>
        <span class="route-arrow" aria-hidden="true">→</span>
        <div>
          <small>针对性控制</small><strong>{{ pollutant.control }}</strong>
          <p>{{ pollutant.limit }}</p>
        </div>
      </div>
      <div class="reaction"><KnowledgeText :text="pollutant.equation" /></div>
      <p class="insight">{{ pollutant.warning }}</p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="选择饮用水处理阶段">
        <AppButton
          v-for="(item, index) in treatmentStages"
          :key="item.name"
          size="small"
          :type="treatmentIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="treatmentIndex === index"
          @click="treatmentIndex = index"
          >{{ index + 1 }} · {{ item.name }}</AppButton
        >
      </div>
      <div class="water-layout">
        <svg
          viewBox="0 0 320 245"
          role="img"
          :aria-label="`${treatment.name}：${treatment.result}`"
        >
          <title>水处理示意；图中颗粒数量不代表定量去除率，普通过滤不能去除全部溶解盐</title>
          <path d="M30 25V205Q30 222 48 222H272Q290 222 290 205V25" class="glass" />
          <path
            d="M35 65Q65 56 95 65Q125 74 155 65Q185 56 215 65Q245 74 285 65V205Q285 217 272 217H48Q35 217 35 205Z"
            fill="#e6f3fa"
          />
          <g v-for="n in 8" :key="`salt-${n}`">
            <circle :cx="54 + ((n * 47) % 210)" :cy="88 + ((n * 29) % 112)" r="4" fill="#577bbc" />
            <text :x="60 + ((n * 47) % 210)" :y="91 + ((n * 29) % 112)" class="ion-mark">
              {{ n % 2 ? '+' : '−' }}
            </text>
          </g>
          <g v-if="treatmentIndex < 2">
            <rect
              v-for="n in 7"
              :key="`dirt-${n}`"
              :x="55 + ((n * 33) % 200)"
              :y="treatmentIndex === 1 ? 198 + (n % 2) * 5 : 75 + ((n * 27) % 120)"
              width="12"
              height="9"
              rx="2"
              fill="#bca681"
            />
          </g>
          <g
            v-for="n in treatmentIndex === 0 ? 5 : 2"
            :key="`germ-${n}`"
            :transform="`translate(${60 + ((n * 49) % 190)},${86 + ((n * 37) % 100)})`"
          >
            <ellipse rx="9" ry="5" :fill="treatmentIndex === 3 ? '#bac4ce' : '#62a076'" />
            <path
              v-if="treatmentIndex === 3"
              d="M-7 -7L7 7M-7 7L7 -7"
              stroke="#64748b"
              stroke-width="2"
            />
          </g>
        </svg>
        <div class="water-legend">
          <span><i class="dirt"></i>悬浮物</span
          ><span
            ><i class="germ"></i>{{ treatmentIndex === 3 ? '已失活微生物示意' : '微生物' }}</span
          ><span><i class="ion"></i>溶解离子仍可存在</span>
        </div>
      </div>
      <div class="result" aria-live="polite">
        <strong>{{ treatment.name }} · {{ treatment.result }}</strong>
        <p>{{ treatment.note }}</p>
      </div>
      <div class="controls" role="group" aria-label="比较饮用水添加剂的用途">
        <AppButton
          v-for="(item, index) in additives"
          :key="item.name"
          size="small"
          :type="additiveIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="additiveIndex === index"
          @click="additiveIndex = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="result" aria-live="polite">
        <strong>{{ additive.purpose }}</strong>
        <p>{{ additive.note }}</p>
      </div>
      <p class="insight">
        这是典型流程的概念示意，不承诺固定去除率或替代水质检测。需要脱盐时，另用反渗透、蒸馏等工艺；不是加一层普通滤纸。
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic: string }>()
const distillationIndex = ref(0)
const greenhouseIndex = ref(0)
const pollutantIndex = ref(0)
const treatmentIndex = ref(0)
const additiveIndex = ref(0)
const distillation = [
  {
    gas: 'N₂',
    name: '氮气',
    boiling: '−196',
    x: 90,
    note: '三者中沸点最低，升温时首先收集。其含量最多与“首先收集”是两项不同事实。',
  },
  {
    gas: 'Ar',
    name: '氩气',
    boiling: '−186',
    x: 340,
    note: '沸点介于氮和氧之间。虽然含量少，仍在氧之前汽化收集。',
  },
  {
    gas: 'O₂',
    name: '氧气',
    boiling: '−183',
    x: 415,
    note: '三者中沸点最高，升温时最后收集。−183 °C高于−196 °C。',
  },
]
const greenhouseGases = [
  {
    name: 'CO₂',
    active: true,
    title: '二氧化碳：常见温室气体',
    note: '可吸收部分地表红外辐射。化石燃料燃烧和部分工业过程是排放来源；用量计算不等于气候效应计算。',
  },
  {
    name: 'CH₄',
    active: true,
    title: '甲烷：同样有温室作用',
    note: '可来自化石燃料泄漏、动物消化和有机物厌氧分解。不能仅凭分子比CO₂轻就判断作用更弱。',
  },
  {
    name: 'H₂O',
    active: true,
    title: '水蒸气：温室气体与气候反馈',
    note: '气态水可以吸收红外；空气可容纳的水蒸气受温度影响。能凝结不意味着没有温室作用。',
  },
  {
    name: 'N₂',
    active: false,
    title: '氮气：最多，不代表温室作用最大',
    note: '空气中含量约78%，但N₂不是主要温室气体。分子性质决定与特定红外波段的相互作用。',
  },
  {
    name: 'O₂',
    active: false,
    title: '氧气：支持燃烧，与温室作用分开',
    note: 'O₂不是主要温室气体。它参与燃烧可能生成CO₂和水，但反应物与生成物的环境作用不同。',
  },
]
const pollutants = [
  {
    name: 'CO₂',
    source: '含碳燃料燃烧与碳酸盐工业',
    formation: '完全燃烧仍可生成CO₂；水泥生产中碳酸盐分解也是来源。',
    effect: '增强温室效应与气候变化',
    explanation: '吸收部分地表红外辐射；不要套用CO与血红蛋白结合的毒性机制。',
    control: '提高能效与减少化石碳排放',
    limit: '将CO氧化成CO₂降低CO毒性，但不能同时消除温室影响。',
    equation: '$\\mathrm{CaCO_3\\rightarrow CaO+CO_2}$',
    warning: 'CO₂、CO和SO₂的主要环境作用不同，不能只写笼统的“污染空气”。',
  },
  {
    name: 'CO',
    source: '含碳燃料不完全燃烧',
    formation: '供氧不足或混合不充分，可同时生成CO、烟炱和CO₂。',
    effect: '妨碍血液运输氧',
    explanation: 'CO与血红蛋白结合；无色无味不能靠嗅觉可靠察觉。',
    control: '改善燃烧与催化氧化',
    limit: '合理供氧和合适催化条件有助于转化CO。',
    equation: '$\\mathrm{2CO+O_2\\rightarrow2CO_2}$',
    warning: '把CO变成CO₂可降低这一毒性来源，但不能据此声称完全没有环境影响。',
  },
  {
    name: 'SO₂',
    source: '含硫燃料或硫化物加工',
    formation: '硫燃烧生成SO₂，后续可氧化成SO₃并形成酸性物质。',
    effect: '酸沉降与呼吸道刺激',
    explanation: '与CO的血红蛋白作用不同，不能把所有危害都写成“温室效应”。',
    control: '低硫燃料与烟气脱硫',
    limit: '可用碱性物质捕集酸性SO₂，需针对含硫来源。',
    equation: '$\\mathrm{SO_2+CaO\\rightarrow CaSO_3}$',
    warning: '这里是碱性吸收剂反应的简化示意；实际脱硫产物还可能进一步氧化。',
  },
  {
    name: 'NOₓ',
    source: '发动机等高温环境',
    formation: '空气中的N₂与O₂可在高温下反应，不要求燃料含氮。',
    effect: '酸雨与光化学污染',
    explanation: 'NO可氧化为NO₂，氮氧化物参与复杂的大气反应。',
    control: '适当条件下催化还原',
    limit: '可将NOₓ转化为N₂，催化剂不是把气体机械过滤。',
    equation: '$\\mathrm{2NO+2CO\\rightarrow N_2+2CO_2}$',
    warning: '这是示意净反应；催化剂和氧化还原角色要依据具体反应判断，不能只凭物质名称。',
  },
]
const treatmentStages = [
  {
    name: '原水',
    result: '悬浮物、微生物与溶解物并存',
    note: '看起来清澈也可能含微生物和溶解污染物。图中只用几种符号概括不同处理对象。',
  },
  {
    name: '混凝与沉降',
    result: '细小颗粒聚集后下沉',
    note: '加适当混凝剂并形成絮体，帮助后续沉降。上清液仍可能含微生物与溶解盐。',
  },
  {
    name: '普通过滤',
    result: '去除剩余悬浮颗粒',
    note: '过滤可减少颗粒和部分微生物，但不等于完全消毒；大部分溶解离子仍可通过普通滤层。',
  },
  {
    name: '消毒',
    result: '控制或灭活微生物',
    note: '含氯消毒剂、臭氧或紫外线各有适用条件。适当余氯可继续保护管网，处理水仍可能保留适量溶解盐。',
  },
]
const additives = [
  {
    name: '氯 · 消毒',
    purpose: '氯控制病原微生物',
    note: '加入适量含氯消毒剂以杀灭或灭活微生物，合适余氯还能保护输水管网；不是去除所有溶解盐。',
  },
  {
    name: 'F⁻ · 护齿',
    purpose: '适量氟离子帮助预防龋齿',
    note: '受控浓度的F⁻有助于牙釉质抵抗酸的侵蚀。它不是氟气F₂，也不代替氯消毒；各地饮水加氟政策不同。',
  },
]

// 每个叶子节点只展开对应机制，减少无关图解挤占学习空间。
const mode = computed(() =>
  props.topic === '141702'
    ? 'greenhouse'
    : props.topic === '141703'
      ? 'pollution'
      : props.topic === '141704'
        ? 'water'
        : 'air',
)
// 标题直接指出本节需要区分的两类判断。
const heading = computed(
  () =>
    ({
      air: '含量最多，不等于只按含量收集',
      greenhouse: '地表放热，哪些气体会吸收？',
      pollution: '从来源出发，才能选对处理方法',
      water: '水变清了，为什么还需要消毒？',
    })[mode.value],
)
// 交互说明与分支一致，明确图解为理解机制服务。
const instruction = computed(
  () =>
    ({
      air: '点选气体，跟着沸点数轴理解收集顺序。',
      greenhouse: '切换气体，比较地表红外辐射与其相互作用。',
      pollution: '切换污染物，沿来源、影响和控制三步阅读。',
      water: '依次点选处理阶段，观察哪些对象改变，哪些仍保留。',
    })[mode.value],
)
// 分馏位置和解释同源，确保选项变化影响图形和文字。
const fraction = computed(() => distillation[distillationIndex.value]!)
// 是否为主要温室气体控制红外示意箭头，而非只是颜色变化。
const greenhouse = computed(() => greenhouseGases[greenhouseIndex.value]!)
// 当前污染物拥有独立形成路径和控制手段，避免泛泛重复模板。
const pollutant = computed(() => pollutants[pollutantIndex.value]!)
// 净水阶段保留不同处理对象的边界，消毒不能假装去除溶解盐。
const treatment = computed(() => treatmentStages[treatmentIndex.value]!)
// 同为添加到水中的物质，氯和氟离子的目标不同，独立比较以免误作连续净水步骤。
const additive = computed(() => additives[additiveIndex.value]!)

// 切换考纲节点恢复起点，避免旧选择误导新知识点的初始阅读。
watch(
  () => props.topic,
  () => {
    distillationIndex.value = 0
    greenhouseIndex.value = 0
    pollutantIndex.value = 0
    treatmentIndex.value = 0
    additiveIndex.value = 0
  },
)
</script>

<style scoped lang="scss">
// 图解选择沿用学习区配色，通过按下状态区分当前演示。
.environment-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-color: var(--color-learning-teal);
  --app-button-hover-border: var(--color-learning-teal);
}
.environment-atlas :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-color: var(--color-ink-inverse);
}

.environment-atlas {
  margin: 0;
  padding: 24px;
  border: 1px solid #bddfe1;
  border-radius: 14px;
  background: linear-gradient(145deg, #eff9f7, #fff);
  color: #29495b;
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: #11777c;
  font-weight: 700;
}
h5 {
  font-size: 20px;
  line-height: 1.5;
  margin: 10px 0;
  color: #173441;
}
figcaption p {
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}
svg {
  display: block;
  width: 100%;
  height: auto;
}
svg text {
  fill: #426071;
  font-size: 13px;
}
svg .gas-name {
  font-size: 17px;
  font-weight: 700;
}
.air-composition {
  display: flex;
  height: 43px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 22px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
.air-composition span {
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
.nitrogen {
  width: 78%;
  background: #277cb4;
}
.oxygen {
  width: 21%;
  background: #17887d;
}
.other {
  width: 1%;
  background: #d4ae52;
}
.small-note {
  font-size: 12px;
  line-height: 1.7;
  color: #6d8190;
}
.axis,
.tick {
  fill: none;
  stroke: #8da8b6;
  stroke-width: 2;
}
.dot {
  fill: #bad6df;
}
.selected-dot {
  fill: #137d81;
}
.result {
  padding-top: 15px;
  border-top: 1px solid #c7e1e5;
  font-size: 14px;
  line-height: 1.85;
}
.result strong {
  color: #0b777b;
  font-size: 16px;
}
.result p {
  margin: 6px 0 0;
}
.insight {
  margin: 18px 0 0;
  padding: 12px 14px;
  background: #edf4ff;
  border-left: 3px solid #4672c9;
  font-size: 14px;
  line-height: 1.8;
}
.sun-ray {
  fill: none;
  stroke: #d8ac39;
  stroke-width: 4;
}
.infrared {
  fill: none;
  stroke: #d97b5d;
  stroke-width: 3;
}
.passing {
  fill: none;
  stroke: #93a4b4;
  stroke-width: 3;
  stroke-dasharray: 4 3;
}
.pollutant-route {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: start;
  gap: 10px;
  margin: 25px 0;
}
.pollutant-route small {
  display: block;
  color: #68818d;
  font-size: 12px;
  margin-bottom: 8px;
}
.pollutant-route strong {
  color: #14797b;
  font-size: 15px;
  line-height: 1.6;
}
.pollutant-route p {
  font-size: 13px;
  line-height: 1.85;
  margin: 9px 0;
}
.route-arrow {
  color: #7fadb1;
  padding-top: 35px;
}
.reaction {
  padding: 14px;
  background: #fff;
  border: 1px solid #cde4e6;
  border-radius: 8px;
}
.water-layout {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(120px, 0.55fr);
  gap: 16px;
  align-items: center;
}
.glass {
  fill: #fff;
  stroke: #8bafbf;
  stroke-width: 3;
}
.ion-mark {
  font-size: 11px;
}
.water-legend {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 13px;
  line-height: 1.7;
}
.water-legend span {
  display: flex;
  align-items: center;
  gap: 7px;
}
.water-legend i {
  display: inline-block;
  width: 12px;
  height: 10px;
  flex-shrink: 0;
}
.water-legend .dirt {
  background: #bca681;
}
.water-legend .germ {
  background: #62a076;
  border-radius: 50%;
}
.water-legend .ion {
  background: #577bbc;
  border-radius: 50%;
  width: 7px;
  height: 7px;
}
@media (max-width: 650px) {
  .environment-atlas {
    padding: 16px;
  }
  .pollutant-route {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .route-arrow {
    transform: rotate(90deg);
    padding: 0;
    justify-self: center;
  }
  .water-layout {
    grid-template-columns: 1fr;
  }
  .water-legend {
    flex-direction: row;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }
}
</style>
