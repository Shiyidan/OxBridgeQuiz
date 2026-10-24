<!-- ESAT 有机化学交互图：以可切换的分子连接、反应条件和原子守恒辅助第十三章复习。 -->
<template>
  <figure class="organic-atlas" :aria-label="heading">
    <figcaption>
      <span class="eyebrow">CHEMISTRY · 追踪变化的位置</span>
      <h5>{{ heading }}</h5>
      <p>{{ instruction }}</p>
    </figcaption>

    <template v-if="mode === 'families'">
      <div class="controls" role="group" aria-label="比较有机物类别">
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
      <svg viewBox="0 0 520 220" role="img" :aria-label="family.formula">
        <title>两碳骨架中，不同官能团改变物质类别和主要反应。</title>
        <text x="130" y="117" class="atom">{{ familyIndex === 1 ? 'CH₂' : 'CH₃' }}</text>
        <line x1="164" y1="108" x2="241" y2="108" class="bond" />
        <line v-if="familyIndex === 1" x1="164" y1="99" x2="241" y2="99" class="highlight-bond" />
        <text x="275" y="117" class="atom">
          {{ familyIndex === 0 ? 'CH₃' : familyIndex === 3 ? 'C' : 'CH₂' }}
        </text>
        <template v-if="familyIndex >= 2">
          <line x1="307" y1="108" x2="368" y2="108" class="highlight-bond" />
          <text x="402" y="117" class="functional">OH</text>
        </template>
        <template v-if="familyIndex === 3">
          <line x1="270" y1="89" x2="270" y2="55" class="highlight-bond" />
          <line x1="280" y1="89" x2="280" y2="55" class="highlight-bond" />
          <text x="275" y="43" class="functional">O</text>
        </template>
        <text x="260" y="180" class="caption">{{ family.formula }} · {{ family.group }}</text>
      </svg>
      <p class="insight" aria-live="polite">{{ family.rule }}</p>
    </template>

    <template v-else-if="mode === 'alkane'">
      <div class="controls" role="group" aria-label="选择烷烃">
        <AppButton
          v-for="(name, index) in ['甲烷', '乙烷', '丙烷', '丁烷']"
          :key="name"
          type="secondary"
          size="small"
          :aria-pressed="carbonCount === index + 1"
          @click="carbonCount = index + 1"
          >{{ name }}</AppButton
        >
      </div>
      <svg viewBox="0 0 520 190" role="img" :aria-label="`${carbonCount}个碳的烷烃碳骨架`">
        <title>饱和碳链：端点通常为 CH₃，中间碳通常为 CH₂；甲烷为 CH₄。</title>
        <g v-for="index in carbonCount" :key="index">
          <line
            v-if="index < carbonCount"
            :x1="chainX(index) + 30"
            y1="86"
            :x2="chainX(index + 1) - 30"
            y2="86"
            class="bond"
          />
          <text :x="chainX(index)" y="95" class="atom">
            {{ carbonCount === 1 ? 'CH₄' : index === 1 || index === carbonCount ? 'CH₃' : 'CH₂' }}
          </text>
        </g>
        <text x="260" y="154" class="caption">{{ combustion }}</text>
      </svg>
      <div class="controls" role="group" aria-label="燃烧后的水状态">
        <AppButton type="secondary" size="small" :aria-pressed="steam" @click="steam = true"
          >水仍为蒸气</AppButton
        ><AppButton type="secondary" size="small" :aria-pressed="!steam" @click="steam = false"
          >水已冷凝</AppButton
        >
      </div>
      <p class="insight" aria-live="polite">
        每 1 mol 烷烃形成 {{ carbonCount }} mol CO₂和 {{ carbonCount + 1 }} mol H₂O。{{
          steam ? '气体总量必须计入这些水蒸气。' : '冷凝水不计入题目要求的气体总量。'
        }}过量的剩余 O₂也不能漏掉。
      </p>
    </template>

    <template v-else-if="mode === 'alkene'">
      <div class="controls" role="group" aria-label="选择加成试剂">
        <AppButton
          v-for="(item, index) in additions"
          :key="item.name"
          type="secondary"
          size="small"
          :aria-pressed="additionIndex === index"
          @click="additionIndex = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 520 245"
        role="img"
        :aria-label="additionComplete ? addition.product : '乙烯，两个碳之间有双键'"
      >
        <title>加成保留碳骨架和原有氢，将双键改为单键，两端各接一个新增部分。</title>
        <text x="185" y="127" class="atom">C</text>
        <text x="335" y="127" class="atom">C</text>
        <line x1="207" y1="116" x2="313" y2="116" class="bond" />
        <line v-if="!additionComplete" x1="207" y1="128" x2="313" y2="128" class="highlight-bond" />
        <g v-for="x in [185, 335]" :key="x">
          <line :x1="x" y1="98" :x2="x" y2="61" class="bond" />
          <text :x="x" y="46" class="atom-small">H</text>
          <line :x1="x" y1="139" :x2="x" y2="177" class="bond" />
          <text :x="x" y="203" class="atom-small">H</text>
        </g>
        <template v-if="additionComplete">
          <line x1="110" y1="119" x2="161" y2="119" class="highlight-bond" />
          <text x="77" y="127" class="functional">{{ addition.left }}</text>
          <line x1="358" y1="119" x2="409" y2="119" class="highlight-bond" />
          <text x="447" y="127" class="functional">{{ addition.right }}</text>
        </template>
      </svg>
      <AppButton
        type="secondary"
        size="small"
        :aria-pressed="additionComplete"
        @click="additionComplete = !additionComplete"
        >{{ additionComplete ? '查看加成前' : '显示加成后' }}</AppButton
      >
      <p class="insight" aria-live="polite">
        {{ additionComplete ? addition.product : '乙烯 CH₂=CH₂' }}。{{
          addition.condition
        }}每个双键消耗 1 mol 对应试剂，不因 Br₂含两个 Br 就再乘 2。
      </p>
    </template>

    <template v-else-if="mode === 'polymer'">
      <div class="controls" role="group" aria-label="选择聚合物类型">
        <AppButton
          v-for="(name, index) in ['加聚', '聚酯', '聚酰胺']"
          :key="name"
          type="secondary"
          size="small"
          :aria-pressed="polymerKind === index"
          @click="polymerKind = index"
          >{{ name }}</AppButton
        >
      </div>
      <div v-if="polymerKind === 0" class="controls" role="group" aria-label="切换单体与重复单元">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="!polymerised"
          @click="polymerised = false"
          >丁-1-烯单体</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="polymerised"
          @click="polymerised = true"
          >加聚重复单元</AppButton
        >
      </div>
      <svg
        v-if="polymerKind === 0"
        viewBox="0 0 520 250"
        role="img"
        :aria-label="polymerised ? '聚丁-1-烯，乙基作为侧链保留' : '丁-1-烯 CH₂=CH–CH₂–CH₃'"
      >
        <title>只有原双键的两个碳进入相邻主链位置，乙基侧链完整保留。</title>
        <text x="177" y="93" class="atom">CH₂</text>
        <text x="328" y="93" class="atom">CH</text>
        <line x1="215" y1="83" x2="291" y2="83" class="bond" />
        <line v-if="!polymerised" x1="215" y1="94" x2="291" y2="94" class="highlight-bond" />
        <line x1="328" y1="110" x2="328" y2="146" class="highlight-bond" />
        <text x="328" y="173" class="functional">CH₂CH₃</text>
        <template v-if="polymerised">
          <path d="M95 46H80V203H95 M410 46H425V203H410" class="bracket" />
          <line x1="50" y1="83" x2="136" y2="83" class="bond" />
          <line x1="362" y1="83" x2="456" y2="83" class="bond" />
          <text x="450" y="216" class="atom-small">n</text>
        </template>
        <text x="260" y="240" class="caption">
          {{ polymerised ? '主链延伸，原子组成仍为 C₄H₈' : '圈出双键碳，别把乙基搬到主链' }}
        </text>
      </svg>
      <svg
        v-else
        viewBox="0 0 560 245"
        role="img"
        :aria-label="polymerKind === 1 ? '聚酯重复单元中的酯键' : '聚酰胺重复单元中的酰胺键'"
      >
        <title>两类缩聚物比较：聚酯连接含 O，聚酰胺连接含 NH，羰基 C=O 均保留。</title>
        <path d="M28 40H16V180H28 M526 40H538V180H526" class="bracket" />
        <line x1="0" y1="108" x2="34" y2="108" class="bond" />
        <text x="57" y="116" class="functional">{{ polymerKind === 1 ? 'O' : 'NH' }}</text>
        <line x1="81" y1="108" x2="100" y2="108" class="bond" />
        <text x="145" y="116" class="atom-small">
          {{ polymerKind === 1 ? '(CH₂)₃' : '(CH₂)₆' }}
        </text>
        <line x1="190" y1="108" x2="205" y2="108" class="bond" />
        <text x="228" y="116" class="functional">{{ polymerKind === 1 ? 'O' : 'NH' }}</text>
        <line x1="252" y1="108" x2="281" y2="108" class="highlight-bond" />
        <text x="302" y="116" class="atom">C</text>
        <line x1="297" y1="88" x2="297" y2="57" class="highlight-bond" />
        <line x1="307" y1="88" x2="307" y2="57" class="highlight-bond" />
        <text x="302" y="43" class="functional">O</text>
        <line x1="322" y1="108" x2="342" y2="108" class="bond" />
        <text x="387" y="116" class="atom-small">
          {{ polymerKind === 1 ? '(CH₂)₂' : '(CH₂)₄' }}
        </text>
        <line x1="432" y1="108" x2="455" y2="108" class="bond" />
        <text x="478" y="116" class="atom">C</text>
        <line x1="473" y1="88" x2="473" y2="57" class="highlight-bond" />
        <line x1="483" y1="88" x2="483" y2="57" class="highlight-bond" />
        <text x="478" y="43" class="functional">O</text>
        <line x1="500" y1="108" x2="557" y2="108" class="bond" />
        <text x="549" y="198" class="atom-small">n</text>
        <text x="280" y="229" class="caption">
          {{ polymerKind === 1 ? '二醇 + 二羧酸 → 聚酯 + 水' : '二胺 + 二羧酸 → 聚酰胺 + 水' }}
        </text>
      </svg>
      <p class="insight">
        {{
          polymerKind === 0
            ? '加聚保留单体全部原子，打开 C=C 的一部分键形成链。'
            : polymerKind === 1
              ? '沿 –COO– 断开，补回醇的 –OH 和酸的 –COOH，可反推二醇与二羧酸。'
              : '沿 –CONH– 断开，补回 –COOH 与 –NH₂，可反推二羧酸与二胺。氨基酸也可通过这种酰胺连接形成肽链。'
        }}
        缩聚会释放水等小分子；有限链的端基和失水量需要另外核对。
      </p>
    </template>

    <template v-else-if="mode === 'alcohol'">
      <div class="controls" role="group" aria-label="选择醇类型">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="!secondaryAlcohol"
          @click="secondaryAlcohol = false"
          >伯醇 · 乙醇</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="secondaryAlcohol"
          @click="secondaryAlcohol = true"
          >仲醇 · 丙-2-醇</AppButton
        >
      </div>
      <svg viewBox="0 0 560 220" role="img" :aria-label="alcoholReading">
        <title>根据羟基所连碳的位置及氧化条件，比较醛、酮和羧酸产物。</title>
        <text x="125" y="105" class="molecule">
          {{ secondaryAlcohol ? 'CH₃–CH–CH₃' : 'CH₃–CH₂' }}
        </text>
        <line
          :x1="secondaryAlcohol ? 125 : 167"
          y1="119"
          :x2="secondaryAlcohol ? 125 : 167"
          y2="153"
          class="highlight-bond"
        />
        <text :x="secondaryAlcohol ? 125 : 167" y="180" class="functional">OH</text>
        <path d="M229 99H300L289 91M300 99L289 107" class="reaction-arrow" />
        <text x="265" y="72" class="caption">[O]</text>
        <text x="389" y="105" class="atom">C</text>
        <line x1="383" y1="80" x2="383" y2="47" class="highlight-bond" />
        <line x1="395" y1="80" x2="395" y2="47" class="highlight-bond" />
        <text x="389" y="34" class="functional">O</text>
        <line x1="365" y1="96" x2="345" y2="96" class="bond" />
        <text x="324" y="105" class="atom-small">CH₃</text>
        <line x1="411" y1="96" x2="452" y2="96" class="bond" />
        <text x="487" y="105" class="functional">
          {{ secondaryAlcohol ? 'CH₃' : reflux ? 'OH' : 'H' }}
        </text>
      </svg>
      <div v-if="!secondaryAlcohol" class="controls" role="group" aria-label="选择氧化条件">
        <AppButton type="secondary" size="small" :aria-pressed="!reflux" @click="reflux = false"
          >及时蒸馏 · 移走产物</AppButton
        ><AppButton type="secondary" size="small" :aria-pressed="reflux" @click="reflux = true"
          >过量氧化剂 · 回流</AppButton
        >
      </div>
      <p class="insight" aria-live="polite">{{ alcoholReading }}</p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="观察酯化原子来源">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="!esterFormed"
          @click="esterFormed = false"
          >酸与醇</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="esterFormed"
          @click="esterFormed = true"
          >形成酯与水</AppButton
        >
      </div>
      <svg
        viewBox="0 0 570 220"
        role="img"
        :aria-label="esterFormed ? '乙酸乙酯与水' : '乙酸和乙醇'"
      >
        <title>乙酸和乙醇在酸催化条件下可逆酯化，保留碳骨架并脱去水。</title>
        <text x="68" y="110" class="acid-atom">CH₃</text>
        <line x1="103" y1="101" x2="145" y2="101" class="bond" />
        <text x="168" y="110" class="acid-atom">C</text>
        <line x1="162" y1="84" x2="162" y2="50" class="acid-bond" />
        <line x1="174" y1="84" x2="174" y2="50" class="acid-bond" />
        <text x="168" y="39" class="acid-atom">O</text>
        <line x1="191" y1="101" x2="231" y2="101" class="bond" />
        <template v-if="!esterFormed">
          <text x="262" y="110" class="acid-atom">OH</text>
          <text x="315" y="110" class="atom-small">+</text>
          <text x="360" y="110" class="alcohol-atom">HO</text>
          <line x1="389" y1="101" x2="421" y2="101" class="bond" />
          <text x="474" y="110" class="alcohol-atom">CH₂CH₃</text>
        </template>
        <template v-else>
          <text x="254" y="110" class="alcohol-atom">O</text>
          <line x1="276" y1="101" x2="314" y2="101" class="bond" />
          <text x="369" y="110" class="alcohol-atom">CH₂CH₃</text>
          <text x="460" y="110" class="atom-small">+</text>
          <text x="520" y="110" class="atom-small">H₂O</text>
        </template>
        <text x="285" y="180" class="caption">60 + 46 ⇌ 88 + 18 · 酸催化，反应可逆</text>
      </svg>
      <p class="insight">
        {{
          esterFormed
            ? '酯键为 –COO–。酸提供含羰基片段，醇提供烃基；总原子数必须在酯和水两边都守恒。'
            : '羧酸的 –COOH 与醇的 –OH 发生酯化，不是把两个分子的相对分子质量直接相加。'
        }}催化剂改变速率，不改变相同温度下的平衡位置。
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{ topic: string }>()
const familyIndex = ref(0)
const carbonCount = ref(2)
const steam = ref(true)
const additionIndex = ref(0)
const additionComplete = ref(false)
const polymerised = ref(false)
const polymerKind = ref(0)
const secondaryAlcohol = ref(false)
const reflux = ref(false)
const esterFormed = ref(false)
const families = [
  {
    name: '烷烃',
    formula: 'C₂H₆',
    group: '乙烷 · 碳碳单键',
    rule: '非环饱和烷烃 CₙH₂ₙ₊₂；只有 C、H 两种元素，是烃。',
  },
  {
    name: '烯烃',
    formula: 'C₂H₄',
    group: '乙烯 · C=C',
    rule: '单个非环烯烃 CₙH₂ₙ；有 C=C 才能判断为烯烃，分子式相同的环烷烃不能混入。',
  },
  {
    name: '醇',
    formula: 'C₂H₆O',
    group: '乙醇 · –OH',
    rule: '含共价羟基 –OH，不是溶液中的 OH⁻；它是有机物但不是只含碳氢的烃。',
  },
  {
    name: '羧酸',
    formula: 'C₂H₄O₂',
    group: '乙酸 · –COOH',
    rule: '把 C=O 与 OH 合在一起识别羧基；羧基碳也计入总碳数。',
  },
]
const additions = [
  {
    name: 'Br₂',
    left: 'Br',
    right: 'Br',
    product: '1,2-二溴乙烷',
    condition: '常见溴加成使溴颜色消退，不需紫外光。',
  },
  {
    name: 'HBr',
    left: 'H',
    right: 'Br',
    product: '溴乙烷',
    condition: '氢卤酸提供一个 H 和一个 Br，不能画成二溴产物。',
  },
  { name: 'H₂', left: 'H', right: 'H', product: '乙烷', condition: '氢化通常使用镍等催化剂。' },
  {
    name: 'H₂O',
    left: 'H',
    right: 'OH',
    product: '乙醇',
    condition: '蒸气水合需要适当的酸催化与反应条件。',
  },
]
// 每个叶子匹配真正的结构图任务，而非重复显示同一张概览。
const mode = computed(
  () =>
    ({
      '141301': 'families',
      '141302': 'alkane',
      '141303': 'alkene',
      '141304': 'polymer',
      '141305': 'alcohol',
      '141306': 'acid',
    })[props.topic] || 'families',
)
// 当前类别只改变官能团，保留两碳骨架以便直观比较。
const family = computed(() => families[familyIndex.value]!)
// 试剂同时决定新增的两部分及必要反应条件。
const addition = computed(() => additions[additionIndex.value]!)
// 用实际碳数配平完全燃烧，供学生核对结构与氧耗量。
const combustion = computed(
  () =>
    `1 mol 烷烃 + ${(3 * carbonCount.value + 1) / 2} mol O₂ → ${carbonCount.value} mol CO₂ + ${carbonCount.value + 1} mol H₂O`,
)
// 氧化条件和醇类型共同决定产物，防止形成“所有醇都氧化成酸”的印象。
const alcoholReading = computed(() =>
  secondaryAlcohol.value
    ? '仲醇丙-2-醇氧化为丙酮；不能只通过换回流或蒸馏就得到丙醛。'
    : reflux.value
      ? '伯醇乙醇在过量氧化剂、回流条件下可进一步生成乙酸，醛仍留在氧化体系中。'
      : '及时蒸馏移走乙醛，减少它继续接触氧化剂；蒸馏的目的不是让所有氧化停止。',
)
// 图标题指出当前结构中需要追踪的变化。
const heading = computed(
  () =>
    ({
      families: '同一碳骨架，换官能团就换一类反应',
      alkane: '碳链增长，燃烧需氧怎样变化？',
      alkene: '双键两端分别接上什么？',
      polymer: '主链只接双键碳，乙基侧链保留',
      alcohol: '看 –OH 的位置，再看氧化条件',
      acid: '酯化少掉的一分子水在哪里？',
    })[mode.value],
)
// 各交互入口提供简短操作目标，不重复整章摘要。
const instruction = computed(
  () =>
    ({
      families: '切换类别，观察蓝色官能团和分子式的变化。',
      alkane: '选择碳链长度，再判断水蒸气是否进入气体总量。',
      alkene: '选择试剂并显示加成后结构，逐个检查碳的四价。',
      polymer: '先看单体，再显示重复单元，跟踪双键和侧链。',
      alcohol: '比较伯醇与仲醇；伯醇还可切换及时蒸馏与回流。',
      acid: '切换反应前后，用颜色追踪酸与醇的骨架来源。',
    })[mode.value],
)
// 碳链居中排布，链长变化时仍保留清晰可见的键长。
function chainX(index: number) {
  return 260 + (index - (carbonCount.value + 1) / 2) * 112
}
// 切换知识点时从反应前开始，避免学生只看到已完成产物。
watch(
  () => props.topic,
  () => {
    familyIndex.value = 0
    carbonCount.value = 2
    steam.value = true
    additionIndex.value = 0
    additionComplete.value = false
    polymerised.value = false
    polymerKind.value = 0
    secondaryAlcohol.value = false
    reflux.value = false
    esterFormed.value = false
  },
)
</script>

<style scoped lang="scss">
// 图解选择沿用学习区配色，通过按下状态区分当前演示。
.organic-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-color: var(--color-learning-blue);
  --app-button-hover-border: var(--color-learning-blue);
}
.organic-atlas :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-blue);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-blue);
  --app-button-hover-bg: var(--color-learning-blue);
  --app-button-hover-color: var(--color-ink-inverse);
}

.organic-atlas {
  margin: 0;
  padding: 24px;
  border: 1px solid #cfe3ee;
  border-radius: 16px;
  background: #f4f9fc;
  color: #1c364a;
}
.eyebrow {
  color: #216c93;
  font-size: 12px;
  letter-spacing: 0.08em;
  font-weight: 700;
}
h5 {
  margin: 10px 0;
  font-size: 21px;
}
figcaption p {
  margin: 0 0 18px;
  line-height: 1.7;
  color: #587083;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  [aria-pressed='true'] {
    background: #deedf9;
    border-color: #548dc5;
    color: #1b5d91;
  }
}
svg {
  width: 100%;
  max-width: 680px;
  display: block;
  margin: 8px auto;
  font-family: inherit;
}
svg text {
  text-anchor: middle;
  fill: #263f50;
}
.atom {
  font-size: 26px;
  font-weight: 600;
}
.atom-small {
  font-size: 22px;
}
.molecule {
  font-size: 22px;
  font-weight: 600;
}
.functional {
  fill: #2369b0;
  font-size: 25px;
  font-weight: 700;
}
.bond,
.bracket {
  stroke: #516b7d;
  stroke-width: 3;
  fill: none;
}
.highlight-bond,
.reaction-arrow {
  stroke: #337fbd;
  stroke-width: 3;
  fill: none;
}
.caption {
  font-size: 14px;
  fill: #566f80;
}
.acid-atom {
  font-size: 25px;
  font-weight: 600;
  fill: #2369b0;
}
.acid-bond {
  stroke: #2369b0;
  stroke-width: 3;
}
.alcohol-atom {
  font-size: 25px;
  font-weight: 600;
  fill: #a05e22;
}
.insight {
  padding: 14px 0 0;
  border-top: 1px solid #d6e4ed;
  margin: 16px 0 0;
  line-height: 1.8;
  font-size: 14px;
}
@media (max-width: 640px) {
  .organic-atlas {
    padding: 16px;
  }
}
</style>
