<!-- ESAT 化学检验图解：按知识点演示试剂与观察，强调完整证据、过量试剂和检验边界。 -->
<template>
  <figure class="test-atlas" :aria-label="heading">
    <figcaption>
      <span class="eyebrow">CHEMISTRY · 检验证据台</span>
      <h5>{{ heading }}</h5>
      <p>{{ instruction }}</p>
    </figcaption>

    <template v-if="mode === 'gas'">
      <div class="controls" role="group" aria-label="选择要检验的气体">
        <AppButton
          v-for="(item, index) in gases"
          :key="item.name"
          size="small"
          :type="gasIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="gasIndex === index"
          @click="gasIndex = index"
          >{{ item.name }}{{ index === 3 ? ' · 补充' : '' }}</AppButton
        >
      </div>
      <div class="demo-layout">
        <svg viewBox="0 0 280 240" role="img" :aria-label="`${gas.name}：${gas.observation}`">
          <title>{{ gas.test }}；{{ gas.observation }}；示意而非实验操作指导</title>
          <path d="M80 35V180Q80 220 125 220Q170 220 170 180V35" class="glass" />
          <template v-if="gasIndex === 2">
            <path d="M85 130V180Q85 213 125 213Q165 213 165 180V130Z" fill="#e1e9e9" />
            <circle
              v-for="n in 12"
              :key="n"
              :cx="94 + ((n * 17) % 62)"
              :cy="148 + ((n * 13) % 54)"
              r="3"
              fill="white"
              stroke="#a5b7bd"
            />
            <path d="M230 40H140V158" class="tube" />
            <text x="215" y="27" text-anchor="middle">CO₂</text>
          </template>
          <template v-else-if="gasIndex === 0 || gasIndex === 1">
            <path d="M125 2V67" stroke="#a77c4f" stroke-width="8" />
            <path d="M125 62Q102 87 124 110Q150 88 125 62Z" fill="#f8a642" />
            <text x="125" y="143" text-anchor="middle">
              {{ gasIndex === 0 ? '爆鸣声' : '木条复燃' }}
            </text>
          </template>
          <template v-else>
            <rect
              x="110"
              y="20"
              width="30"
              height="105"
              rx="4"
              :fill="gasIndex === 3 ? '#3b75d3' : '#fff'"
              stroke="#8c9eae"
            />
            <path d="M150 48Q160 61 150 65Q140 61 150 48Z" fill="#7ec1ec" />
            <text x="125" y="155" text-anchor="middle">
              {{ gasIndex === 3 ? '湿红纸变蓝' : '湿蓝纸先红后白' }}
            </text>
          </template>
          <text x="125" y="237" text-anchor="middle">{{ gas.name }}</text>
        </svg>
        <div class="evidence" aria-live="polite">
          <span>检验条件</span><strong>{{ gas.test }}</strong
          ><span>阳性观察</span><strong>{{ gas.observation }}</strong>
          <p>{{ gas.reason }}</p>
        </div>
      </div>
      <p class="insight">{{ gas.boundary }}</p>
    </template>

    <template v-else-if="mode === 'anion'">
      <div class="controls" role="group" aria-label="选择阴离子检验路线">
        <AppButton
          v-for="(item, index) in anions"
          :key="item.name"
          size="small"
          :type="anionIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="anionIndex === index"
          @click="anionIndex = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <ol class="test-route" aria-live="polite">
        <li>
          <span>1</span>
          <div>
            <small>前处理</small><strong>{{ anion.first }}</strong>
          </div>
        </li>
        <li>
          <span>2</span>
          <div>
            <small>加入试剂</small><strong>{{ anion.second }}</strong>
          </div>
        </li>
        <li>
          <span>3</span>
          <div>
            <small>记录证据</small><strong>{{ anion.result }}</strong>
          </div>
        </li>
      </ol>
      <div v-if="anionIndex === 0" class="silver-results">
        <div v-for="item in halides" :key="item.ion">
          <span class="deposit" :style="{ background: item.colour }"></span
          ><strong>{{ item.ion }}</strong
          ><small>{{ item.salt }} · {{ item.name }}</small>
        </div>
      </div>
      <div v-else class="reaction"><KnowledgeText :text="anion.equation" /></div>
      <p class="insight" aria-live="polite">{{ anion.warning }}</p>
    </template>

    <template v-else-if="mode === 'cation'">
      <div class="controls" role="group" aria-label="选择金属阳离子">
        <AppButton
          v-for="(item, index) in cations"
          :key="item.ion"
          size="small"
          :type="cationIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="cationIndex === index"
          @click="chooseCation(index)"
          >{{ item.ion }}{{ index === 6 ? ' · 补充' : '' }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="氢氧化钠用量">
        <AppButton
          size="small"
          :type="!excess ? 'primary' : 'secondary'"
          :aria-pressed="!excess"
          @click="excess = false"
          >少量 NaOH</AppButton
        >
        <AppButton
          size="small"
          :type="excess ? 'primary' : 'secondary'"
          :aria-pressed="excess"
          @click="excess = true"
          >继续加至过量</AppButton
        >
      </div>
      <div class="demo-layout">
        <svg viewBox="0 0 280 230" role="img" :aria-label="`${cation.ion}：${cationResult}`">
          <title>{{ cation.ion }}加入{{ excess ? '过量' : '少量' }}NaOH；{{ cationResult }}</title>
          <path d="M85 20V165Q85 205 130 205Q175 205 175 165V20" class="glass" />
          <path d="M90 105V165Q90 198 130 198Q170 198 170 165V105Z" fill="#eaf6fb" />
          <path
            v-if="!(excess && cation.dissolves)"
            d="M90 165Q110 158 130 166Q150 158 170 165Q170 198 130 198Q90 198 90 165Z"
            :fill="cation.colour"
            stroke="#9eafb5"
          />
          <text x="130" y="224" text-anchor="middle">
            {{ excess && cation.dissolves ? '无色溶液' : cation.salt }}
          </text>
          <path d="M210 60Q225 82 210 90Q195 82 210 60Z" fill="#67a8df" />
          <text x="210" y="47" text-anchor="middle">NaOH</text>
        </svg>
        <div class="evidence" aria-live="polite">
          <span>{{ excess ? '加入过量后' : '少量试剂后' }}</span
          ><strong>{{ cationResult }}</strong>
          <p>{{ cation.note }}</p>
          <span>判题边界</span>
          <p>
            {{
              cation.dissolves
                ? '溶于过量碱支持两性氢氧化物；仅凭这一步不能区分Al³⁺与Zn²⁺。'
                : '沉淀颜色需要结合其他检验；白色沉淀尤其不能唯一锁定一种离子。'
            }}
          </p>
        </div>
      </div>
    </template>

    <template v-else-if="mode === 'flame'">
      <div class="controls" role="group" aria-label="选择焰色检验离子">
        <AppButton
          v-for="(item, index) in flames"
          :key="item.ion"
          size="small"
          :type="flameIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="flameIndex === index"
          @click="flameIndex = index"
          >{{ item.ion }}</AppButton
        >
      </div>
      <div class="demo-layout">
        <svg viewBox="0 0 280 240" role="img" :aria-label="`${flame.ion}：${flame.name}`">
          <title>{{ flame.ion }}的焰色：{{ flame.name }}；图示颜色非仪器标准色</title>
          <rect x="113" y="178" width="54" height="45" rx="4" fill="#9aaeba" />
          <path d="M100 224H180" stroke="#526c7a" stroke-width="6" />
          <path
            d="M140 20C150 78 205 110 175 163Q140 202 105 163C72 128 110 81 140 20Z"
            :fill="flame.colour"
            opacity=".9"
          />
          <path d="M140 108Q171 151 140 180Q109 151 140 108Z" fill="#e9f6ff" opacity=".85" />
          <path d="M215 100H155Q143 100 145 110" stroke="#64748b" stroke-width="3" fill="none" />
        </svg>
        <div class="evidence" aria-live="polite">
          <span>金属离子</span><strong>{{ flame.ion }}</strong
          ><span>特征焰色</span><strong>{{ flame.name }}</strong>
          <p>{{ flame.note }}</p>
        </div>
      </div>
      <p class="insight">
        颜色同时配有文字。实际颜色可受浓度、背景火焰和钠污染影响；焰色不等于沉淀颜色，也不表示金属活性顺序。
      </p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="选择水检验样品">
        <AppButton
          v-for="(item, index) in waterSamples"
          :key="item.name"
          size="small"
          :type="waterIndex === index ? 'primary' : 'secondary'"
          :aria-pressed="waterIndex === index"
          @click="waterIndex = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="water-pair">
        <div>
          <span
            class="sample-chip"
            :style="{ background: waterSample.wet ? '#3b82c4' : '#fff' }"
          ></span
          ><strong>无水硫酸铜</strong
          ><span>{{ waterSample.wet ? '白色 → 蓝色' : '仍为白色' }}</span>
        </div>
        <div>
          <span
            class="sample-chip paper"
            :style="{ background: waterSample.wet ? '#e990b2' : '#3f78bb' }"
          ></span
          ><strong>干氯化钴试纸（补充）</strong
          ><span>{{ waterSample.wet ? '蓝色 → 粉红色' : '仍为蓝色' }}</span>
        </div>
      </div>
      <div class="water-conclusion" aria-live="polite">
        <strong>{{ waterSample.conclusion }}</strong>
        <p>{{ waterSample.boundary }}</p>
      </div>
      <p class="insight">
        对比纯水与盐水：两项都呈阳性，说明检验回答的是“有没有水”。要判断纯度，还需要已知压强下的熔沸点等证据。
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic: string }>()
const gasIndex = ref(0)
const anionIndex = ref(0)
const cationIndex = ref(0)
const flameIndex = ref(0)
const waterIndex = ref(0)
const excess = ref(false)
const gases = [
  {
    name: 'H₂',
    test: '点燃的木条接近少量气体样品管口',
    observation: '发出爆鸣声',
    reason: '氢与空气中的氧迅速反应，形成特征声响。',
    boundary: '不能用“带火星木条复燃”替代氢气检验；那是氧气的检验。',
  },
  {
    name: 'O₂',
    test: '伸入带火星的木条',
    observation: '木条复燃',
    reason: '氧气支持燃烧，使余烬重新燃烧。',
    boundary: '氧气支持燃烧，不等于氧气本身是燃料；检验需要带火星木条。',
  },
  {
    name: 'CO₂',
    test: '将气体通入澄清石灰水',
    observation: '先出现白色浑浊',
    reason: '生成CaCO₃悬浮沉淀；原石灰水是Ca(OH)₂溶液。',
    boundary: '持续通入过量CO₂，浑浊可能减弱；记录先后现象，不把气泡本身当鉴定。',
  },
  {
    name: 'NH₃',
    test: '接触湿润红色石蕊试纸',
    observation: '红色变蓝色',
    reason: 'NH₃溶于水形成碱性环境。',
    boundary: '必须写“湿润”；不要直接吸闻未知气体来代替化学检验。',
  },
  {
    name: 'Cl₂',
    test: '接触湿润蓝色石蕊试纸',
    observation: '先变红，再被漂白为白色',
    reason: '氯气与水形成的含氯物种具有酸性和漂白作用；湿蓝纸先红后白。',
    boundary: '“先红”说明酸性，“后褪色”说明漂白；两者不是同一个变化。',
  },
]
const anions = [
  {
    name: 'Cl⁻ / Br⁻ / I⁻',
    first: '用稀硝酸酸化',
    second: '加入硝酸银溶液',
    result: '分别得到白、奶油色、黄色沉淀',
    equation: '',
    warning: '不用盐酸酸化：盐酸带来的Cl⁻会干扰氯离子检验。每个新检验使用独立小份样品。',
  },
  {
    name: 'SO₄²⁻',
    first: '用稀盐酸酸化，排除干扰',
    second: '加入氯化钡溶液',
    result: '白色BaSO₄沉淀',
    equation: '$\\mathrm{Ba^{2+}+SO_4^{2-}\\rightarrow BaSO_4(s)}$',
    warning: '不用硫酸酸化：试剂本身会带入待检的硫酸根。白色沉淀必须与酸化钡盐这组试剂配对。',
  },
  {
    name: 'CO₃²⁻',
    first: '向样品加入稀酸，观察产气',
    second: '将气体通入澄清石灰水',
    result: '气泡 + 石灰水浑浊',
    equation: '$\\mathrm{CO_3^{2-}+2H^+\\rightarrow CO_2+H_2O}$',
    warning: '第一步有气泡不是最终证据；第二步确认CO₂，才能把产气与碳酸根联系起来。',
  },
]
const halides = [
  { ion: 'Cl⁻', salt: 'AgCl', name: '白色', colour: '#fff' },
  { ion: 'Br⁻', salt: 'AgBr', name: '奶油色', colour: '#f4e5b6' },
  { ion: 'I⁻', salt: 'AgI', name: '黄色', colour: '#e8cc43' },
]
const cations = [
  {
    ion: 'Cu²⁺',
    salt: 'Cu(OH)₂',
    colour: '#64a9e0',
    name: '蓝色',
    dissolves: false,
    note: '这是沉淀色；铜的焰色是蓝绿色，不能互换。',
  },
  {
    ion: 'Fe²⁺',
    salt: 'Fe(OH)₂',
    colour: '#73a889',
    name: '绿色',
    dissolves: false,
    note: '初始为绿色，接触空气后可逐渐氧化变棕；题目说“立即”时按初始颜色判断。',
  },
  {
    ion: 'Fe³⁺',
    salt: 'Fe(OH)₃',
    colour: '#a66c4f',
    name: '棕色',
    dissolves: false,
    note: '需要三个OH⁻配平一个Fe³⁺的电荷。',
  },
  {
    ion: 'Mg²⁺',
    salt: 'Mg(OH)₂',
    colour: '#fff',
    name: '白色',
    dissolves: false,
    note: '白色不等于唯一身份，还需结合其他检验。',
  },
  {
    ion: 'Ca²⁺',
    salt: 'Ca(OH)₂',
    colour: '#fff',
    name: '白色',
    dissolves: false,
    note: '适当浓度下可形成白色沉淀，砖红焰色可提供补充证据。',
  },
  {
    ion: 'Al³⁺',
    salt: 'Al(OH)₃',
    colour: '#fff',
    name: '白色',
    dissolves: true,
    note: '氢氧化铝具有两性，过量NaOH使沉淀溶解。',
  },
  {
    ion: 'Zn²⁺',
    salt: 'Zn(OH)₂',
    colour: '#fff',
    name: '白色',
    dissolves: true,
    note: '氢氧化锌也可溶于过量NaOH；此现象并非铝离子独有。',
  },
]
const flames = [
  {
    ion: 'Li⁺',
    name: '深红色 · crimson',
    colour: '#d44b67',
    note: '区别于钙的橙红或砖红；不要把所有红色都当成同一种离子。',
  },
  {
    ion: 'Na⁺',
    name: '黄至黄橙色 · yellow-orange',
    colour: '#efc442',
    note: '黄色很强，少量钠污染可能掩盖其他离子的焰色。',
  },
  {
    ion: 'K⁺',
    name: '淡紫色 · lilac',
    colour: '#b799dd',
    note: '读英文lilac时应联想到钾，而不是钠的黄色。',
  },
  {
    ion: 'Ca²⁺',
    name: '砖红色 · brick-red',
    colour: '#e57a48',
    note: '可与白色氢氧化物沉淀结合，用两条证据的交集鉴别钙。',
  },
  {
    ion: 'Cu²⁺',
    name: '绿至蓝绿色 · green / blue-green',
    colour: '#39b7ae',
    note: '焰色蓝绿，Cu(OH)₂沉淀蓝色，铜金属又是红棕色：对象不同。',
  },
]
const waterSamples = [
  {
    name: '纯水',
    wet: true,
    conclusion: '两项阳性：有水',
    boundary: '只有这两个显色结果，仍不足以单独证明“纯水”；此处样品名称是已知条件。',
  },
  {
    name: '盐水',
    wet: true,
    conclusion: '同样阳性：有水，但含有溶解盐',
    boundary: '与纯水产生相同显色，正好说明含水检验不能代替纯度检验。',
  },
  {
    name: '干燥空白对照',
    wet: false,
    conclusion: '没有水接触：未发生显色',
    boundary: '空白对照帮助确认起始试剂仍为无水/干燥状态；实际未知样品还要考虑检出限和操作。',
  },
]

// 五个考纲叶子各自进入对应检验台，而不是展示同一张通用表。
const mode = computed(() =>
  props.topic === '141602'
    ? 'anion'
    : props.topic === '141603'
      ? 'cation'
      : props.topic === '141604'
        ? 'flame'
        : props.topic === '141605'
          ? 'water'
          : 'gas',
)
// 图解标题明确本节最容易混淆的证据层次。
const heading = computed(
  () =>
    ({
      gas: '气体不同，检验条件也不同',
      anion: '同样是白色，先问加了什么',
      cation: '先看颜色，再看过量NaOH',
      flame: '看的是火焰，不是沉淀',
      water: '纯水和盐水会给出相同结果吗？',
    })[mode.value],
)
// 操作提示与当前检验台一致，避免学生把示意当真实实验操作。
const instruction = computed(() =>
  mode.value === 'cation'
    ? '选择离子，分别比较少量与过量试剂后的现象。'
    : mode.value === 'water'
      ? '切换样品，观察显色相同但能得出的结论不同。'
      : '点选对象，将试剂、现象与结论连成完整证据链。',
)
// 当前选中的气体绑定专属检验而非仅更新标题。
const gas = computed(() => gases[gasIndex.value]!)
// 阴离子路线把酸化试剂与后续显色绑定，避免错误试剂组合。
const anion = computed(() => anions[anionIndex.value]!)
// 金属离子的颜色和过量碱溶解性来自同一审阅记录。
const cation = computed(() => cations[cationIndex.value]!)
// 溶于过量碱的结果需同时满足所选离子和试剂量两个条件。
const cationResult = computed(() =>
  excess.value && cation.value.dissolves
    ? '白色沉淀溶解，得到无色溶液'
    : `${cation.value.name}沉淀${excess.value ? '仍保留' : '形成'}`,
)
// 焰色文字与色块同源，颜色辨认困难时仍能读取结论。
const flame = computed(() => flames[flameIndex.value]!)
// 水检验对比刻意保留盐水与纯水相同阳性，用于演示结论边界。
const waterSample = computed(() => waterSamples[waterIndex.value]!)

// 更换阳离子从少量试剂重新开始，呈现完整“先沉淀、后过量”的观察序列。
function chooseCation(index: number) {
  cationIndex.value = index
  excess.value = false
}

// 新考纲节点恢复默认观察，防止上一节的选择或过量状态被误读。
watch(
  () => props.topic,
  () => {
    gasIndex.value = 0
    anionIndex.value = 0
    chooseCation(0)
    flameIndex.value = 0
    waterIndex.value = 0
  },
)
</script>

<style scoped lang="scss">
// 图解选择沿用学习区配色，通过按下状态区分当前演示。
.test-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-color: var(--color-learning-teal);
  --app-button-hover-border: var(--color-learning-teal);
}
.test-atlas :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-color: var(--color-ink-inverse);
}

.test-atlas {
  margin: 0;
  padding: 24px;
  border: 1px solid #bedfe1;
  border-radius: 14px;
  background: linear-gradient(145deg, #f1faf9, #fff);
  color: #29495a;
}
.eyebrow {
  font-size: 12px;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #11777c;
}
h5 {
  margin: 10px 0;
  font-size: 20px;
  line-height: 1.5;
  color: #173441;
}
figcaption p {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}
.demo-layout {
  display: grid;
  grid-template-columns: minmax(150px, 0.8fr) minmax(180px, 1fr);
  gap: 20px;
  align-items: center;
}
svg {
  display: block;
  width: 100%;
  max-height: 255px;
}
svg text {
  font-size: 13px;
  fill: #456170;
}
.glass {
  fill: #fff;
  stroke: #8db3c0;
  stroke-width: 3;
}
.tube {
  fill: none;
  stroke: #678793;
  stroke-width: 5;
}
.evidence {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 14px;
  line-height: 1.8;
}
.evidence > span {
  color: #708493;
  font-size: 12px;
}
.evidence > strong {
  color: #08777a;
  font-size: 16px;
}
.evidence p {
  margin: 0 0 8px;
}
.insight {
  margin: 18px 0 0;
  padding: 12px 14px;
  background: #edf4ff;
  border-left: 3px solid #4874cf;
  font-size: 14px;
  line-height: 1.8;
}
.test-route {
  list-style: none;
  padding: 0;
  margin: 18px 0;
  display: grid;
  gap: 12px;
}
.test-route li {
  display: flex;
  align-items: center;
  gap: 12px;
}
.test-route li > span {
  display: grid;
  place-items: center;
  background: #def2ef;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #08777a;
  font-weight: 700;
  flex-shrink: 0;
}
.test-route small,
.test-route strong {
  display: block;
}
.test-route small {
  font-size: 12px;
  color: #708493;
}
.test-route strong {
  font-size: 14px;
  line-height: 1.8;
}
.silver-results,
.water-pair {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 20px;
}
.silver-results > div,
.water-pair > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  text-align: center;
}
.silver-results small {
  font-size: 12px;
}
.deposit {
  display: block;
  width: 56px;
  height: 38px;
  border: 1px solid #aebfc7;
  border-radius: 3px 3px 20px 20px;
}
.reaction {
  padding: 16px;
  background: #fff;
  border: 1px solid #d4e6e7;
  border-radius: 8px;
}
.water-pair {
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.sample-chip {
  width: 75px;
  height: 56px;
  border-radius: 8px 8px 18px 18px;
  border: 1px solid #a4bcc9;
  display: block;
}
.sample-chip.paper {
  border-radius: 2px;
  width: 32px;
  height: 75px;
}
.water-conclusion {
  margin: 22px 0 0;
  padding-top: 16px;
  border-top: 1px solid #c6e0e3;
  font-size: 14px;
  line-height: 1.8;
}
.water-conclusion strong {
  color: #107b79;
}
.water-conclusion p {
  margin: 6px 0;
}
@media (max-width: 650px) {
  .test-atlas {
    padding: 16px;
  }
  .demo-layout {
    grid-template-columns: 1fr;
  }
  .silver-results {
    gap: 6px;
  }
}
</style>
