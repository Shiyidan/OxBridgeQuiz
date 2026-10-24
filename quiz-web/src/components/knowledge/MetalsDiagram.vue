<!-- ESAT 金属章节互动图解：以反应性、置换装置、合金晶层和高炉连接结构与解题依据。 -->
<template>
  <figure class="metals-atlas" :aria-label="heading">
    <figcaption>
      <span class="eyebrow">CHEMISTRY · 金属与材料</span>
      <h5>{{ heading }}</h5>
    </figcaption>

    <template v-if="mode === 'extraction'">
      <p>选一种金属，比较它与碳的位置。位置表示定性反应性，不是等间隔的数值。</p>
      <div class="controls" role="group" aria-label="选择要提取的金属">
        <AppButton
          v-for="metal in metals"
          :key="metal.symbol"
          type="secondary"
          size="small"
          :aria-pressed="selectedMetal === metal.symbol"
          @click="selectedMetal = metal.symbol"
          >{{ metal.symbol }}</AppButton
        >
      </div>
      <div class="svg-scroll" tabindex="0" aria-label="金属反应性与提取方法示意">
        <svg viewBox="0 0 680 330" role="img" :aria-label="extractionExplanation">
          <path d="M60 292V30L53 43M60 30L67 43" class="arrow" />
          <text x="18" y="165" transform="rotate(-90 18 165)">反应性增强</text>
          <g v-for="(item, index) in activity" :key="item">
            <rect
              x="105"
              :y="25 + index * 32"
              width="110"
              height="26"
              rx="6"
              :class="
                item === selectedMetal ? 'selected-band' : item === 'C' ? 'carbon-band' : 'band'
              "
            />
            <text x="160" :y="44 + index * 32" text-anchor="middle">
              {{ item === 'C' ? 'C · 碳参照' : item === 'H' ? 'H · 氢参照' : item }}
            </text>
          </g>
          <path d="M230 25H250V83H230 M230 121H250V276H230" class="bracket" />
          <text x="280" y="65" class="strong">比碳活泼：常用电解</text>
          <text x="280" y="94">不能直接以碳还原相应稳定氧化物</text>
          <text x="280" y="195" class="strong">比碳不活泼：可考虑化学还原</text>
          <text x="280" y="224">例如 Fe₂O₃ 用 CO 还原</text>
          <text x="280" y="253">实际工艺还取决于矿物、成本与条件</text>
        </svg>
      </div>
      <p class="conclusion" aria-live="polite">{{ extractionExplanation }}</p>
    </template>

    <template v-else-if="mode === 'displacement'">
      <p>把金属片浸入另一种金属的硫酸盐溶液，先预测能否置换，再看粒子与方程。</p>
      <div class="controls" role="group" aria-label="选择金属片">
        <span>金属片</span
        ><AppButton
          v-for="metal in displacementMetals"
          :key="metal"
          type="secondary"
          size="small"
          :aria-pressed="strip === metal"
          @click="strip = metal"
          >{{ metal }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="选择盐溶液">
        <span>溶液</span
        ><AppButton
          v-for="metal in displacementMetals"
          :key="metal"
          type="secondary"
          size="small"
          :aria-pressed="solution === metal"
          @click="solution = metal"
          >{{ metal }}SO₄</AppButton
        >
      </div>
      <div class="svg-scroll" tabindex="0" aria-label="金属置换前后粒子模型">
        <svg viewBox="0 0 680 340" role="img" :aria-label="displacementExplanation">
          <g v-for="(x, phase) in [30, 390]" :key="phase" :transform="`translate(${x},0)`">
            <text x="125" y="26" text-anchor="middle" class="strong">
              {{ phase ? '充分接触后' : '反应前' }}
            </text>
            <path d="M20 75V285Q20 305 40 305H210Q230 305 230 285V75" class="glass" />
            <path d="M23 145H227V285Q227 302 210 302H40Q23 302 23 285Z" class="liquid" />
            <rect
              x="98"
              y="57"
              :width="phase && displaces ? 22 : 30"
              height="170"
              rx="3"
              class="strip"
            />
            <text x="140" y="94">{{ strip }} 片</text>
            <g v-if="phase && displaces">
              <circle
                v-for="i in 3"
                :key="i"
                :cx="i === 2 ? 94 : 125"
                :cy="169 + (i - 1) * 24"
                r="7"
                class="deposit"
              />
              <text x="143" y="206">{{ solution }} 析出</text>
            </g>
            <g v-for="(point, i) in ionPoints" :key="i">
              <circle :cx="point.x" :cy="point.y" r="19" class="ion" />
              <text :x="point.x" :y="point.y + 5" text-anchor="middle">
                {{ phase && displaces ? strip : solution }}²⁺
              </text>
            </g>
            <text x="125" y="329" text-anchor="middle">SO₄²⁻ 为旁观离子，图中省略</text>
          </g>
          <path d="M292 172H368L356 163M368 172L356 181" class="arrow" />
          <text x="330" y="148" text-anchor="middle">{{ displaces ? '发生置换' : '不置换' }}</text>
        </svg>
      </div>
      <p class="equation">{{ displacementEquation }}</p>
      <p class="conclusion" aria-live="polite">
        {{
          displacementExplanation
        }}
        示意假定金属片足量、盐溶液有限；颜色仅区分图形，不代表所有溶液的真实颜色。
      </p>
    </template>

    <template v-else-if="mode === 'alloy'">
      <p>切换纯金属与合金，再比较剪切时原子层相对移动的难易。</p>
      <div class="controls" role="group" aria-label="比较纯金属与合金">
        <AppButton type="secondary" size="small" :aria-pressed="!alloy" @click="alloy = false"
          >纯金属</AppButton
        >
        <AppButton type="secondary" size="small" :aria-pressed="alloy" @click="alloy = true"
          >合金</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="sheared"
          @click="sheared = !sheared"
          >{{ sheared ? '撤去剪切示意' : '施加剪切' }}</AppButton
        >
      </div>
      <div class="svg-scroll" tabindex="0" aria-label="纯金属和合金层滑移对比模型">
        <svg
          viewBox="0 0 680 340"
          role="img"
          :aria-label="
            alloy ? '不同尺寸的原子使晶格畸变，阻碍层滑移' : '纯金属规则排列的原子层较易相对滑移'
          "
        >
          <path v-if="sheared" d="M80 33H250L238 25M250 33L238 41" class="arrow" />
          <text x="320" y="40" text-anchor="middle">
            {{
              sheared
                ? '剪切作用：比较位移难易，不表示真实应力数值'
                : '选择上方按钮，观察原子层变化'
            }}
          </text>
          <line x1="60" y1="188" x2="620" y2="188" class="slip-plane" />
          <g v-for="(point, i) in alloyPoints" :key="i">
            <circle
              :cx="point.x + (sheared && point.row < 2 ? (alloy ? 8 : 42) : 0)"
              :cy="point.y"
              :r="alloy && i % 7 === 2 ? 25 : 19"
              :class="alloy && i % 7 === 2 ? 'alloy-atom' : 'metal-atom'"
            />
          </g>
          <text x="340" y="324" text-anchor="middle">
            {{ alloy ? '尺寸不同 → 晶格畸变 → 滑移受阻' : '规则排列 → 原子层较容易滑移' }}
          </text>
        </svg>
      </div>
      <p class="conclusion" aria-live="polite">
        {{
          alloy
            ? '合金通常比相应纯金属更硬；这不是因为加入的原子把金属键全部变成共价键。耐腐蚀、密度或熔点须按具体合金判断。'
            : '纯金属可以延展，层移动时金属键仍可维持。图中只画原子位置，不画完整离域电子海；不表示金属没有自由电子。'
        }}
      </p>
    </template>

    <template v-else-if="mode === 'ore'">
      <p>以高炉炼铁为例：区分供热、生成还原剂、还原矿石与除杂的作用。</p>
      <div class="controls" role="group" aria-label="查看高炉中的反应环节">
        <AppButton
          v-for="(step, i) in furnaceSteps"
          :key="step.title"
          type="secondary"
          size="small"
          :aria-pressed="furnaceStep === i"
          @click="furnaceStep = i"
          >{{ step.title }}</AppButton
        >
      </div>
      <div class="svg-scroll" tabindex="0" aria-label="高炉与物料流向示意">
        <svg viewBox="0 0 680 365" role="img" :aria-label="furnaceCurrent.description">
          <path d="M270 55H375L390 145L435 270V328H210V270L255 145Z" class="furnace" />
          <path
            d="M270 55H375L390 145L435 270V328H210V270L255 145Z"
            fill="none"
            stroke="#8095ad"
            stroke-width="8"
          />
          <path d="M225 277H421V300H225Z" class="slag" />
          <path d="M225 301H421V321H225Z" class="molten" />
          <circle
            v-for="(point, i) in orePoints"
            :key="i"
            :cx="point.x"
            :cy="point.y"
            r="9"
            :class="i % 2 ? 'coke' : 'ore'"
          />
          <path d="M320 18V48L312 39M320 48L328 39" class="arrow" />
          <text x="335" y="27">铁矿石、焦炭、石灰石</text>
          <path
            d="M68 255H207L194 247M207 255L194 263 M577 255H438L451 247M438 255L451 263"
            class="hot-air"
          />
          <text x="67" y="237">热空气</text>
          <text x="516" y="237">热空气</text>
          <path d="M323 249V111L315 124M323 111L331 124" class="gas-flow" />
          <text x="337" y="186">CO 上升</text>
          <path d="M433 289H540 M433 313H540" class="outlet" />
          <text x="550" y="294">炉渣</text>
          <text x="550" y="318">铁水</text>
          <text x="322" y="356" text-anchor="middle">结构与温区简化；CO 是重要还原剂</text>
        </svg>
      </div>
      <p class="equation"><LatexText :text="furnaceCurrent.equation" /></p>
      <p class="conclusion" aria-live="polite">{{ furnaceCurrent.description }}</p>
    </template>

    <template v-else>
      <p>选择一组常见离子，比较颜色和氧化态。颜色必须连同离子及环境一起记。</p>
      <div class="controls" role="group" aria-label="选择过渡金属示例">
        <AppButton
          v-for="(item, i) in transitionSamples"
          :key="item.title"
          type="secondary"
          size="small"
          :aria-pressed="transitionIndex === i"
          @click="transitionIndex = i"
          >{{ item.title }}</AppButton
        >
      </div>
      <div class="svg-scroll" tabindex="0" aria-label="不同金属离子的颜色示意">
        <svg viewBox="0 0 680 300" role="img" :aria-label="transition.description">
          <g
            v-for="(sample, i) in transition.samples"
            :key="sample.label"
            :transform="`translate(${130 + i * 260},0)`"
          >
            <path d="M0 45V215Q0 250 40 250Q80 250 80 215V45" class="glass" />
            <rect
              v-if="'solid' in sample && sample.solid"
              x="18"
              y="166"
              width="44"
              height="70"
              rx="3"
              :fill="sample.color"
            />
            <path v-else d="M3 115H77V215Q77 247 40 247Q3 247 3 215Z" :fill="sample.color" />
            <text x="40" y="28" text-anchor="middle" class="strong">{{ sample.label }}</text>
            <text x="40" y="279" text-anchor="middle">{{ sample.name }}</text>
          </g>
        </svg>
      </div>
      <p class="conclusion" aria-live="polite">{{ transition.description }}</p>
    </template>
    <small class="model-note"
      >用于概念复习的简化示意，不按真实尺寸绘制；实验现象以题目条件为准。</small
    >
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic?: string }>()
type Mode = 'extraction' | 'displacement' | 'alloy' | 'ore' | 'transition'
const modes: Record<string, Mode> = {
  '141401': 'extraction',
  '141402': 'displacement',
  '141403': 'alloy',
  '141404': 'ore',
  '141405': 'transition',
}
// 每个叶子默认使用对应机制图，避免整章共用一个与正文无关的状态。
const mode = computed(() => modes[props.topic || ''] || 'extraction')
const headings: Record<Mode, string> = {
  extraction: '活性顺序怎样约束提取方法',
  displacement: '金属片能把谁从溶液中置换出来',
  alloy: '合金为什么通常更硬',
  ore: '高炉中，每条反应各有职责',
  transition: '同一种金属，不同离子可以不同颜色',
}
// 图题由当前知识点决定，不由交互中的金属名称替代主题。
const heading = computed(() => headings[mode.value])
const activity = ['Mg', 'Al', 'C', 'Zn', 'Fe', 'H', 'Cu', 'Ag']
const metals = [
  { symbol: 'Mg', note: 'Mg 比碳活泼，提取常用熔融盐电解等工艺；不能简单用碳还原 MgO。' },
  {
    symbol: 'Al',
    note: 'Al 比碳活泼，工业常电解溶于熔融冰晶石的氧化铝。表面氧化膜造成的钝化不意味着铝不活泼。',
  },
  {
    symbol: 'Zn',
    note: 'Zn 位于碳下方，可在适当高温下由含锌氧化物化学还原获得；不是向冷溶液中加入碳就会置换锌。',
  },
  {
    symbol: 'Fe',
    note: 'Fe 位于碳下方，高炉中 CO 可还原铁氧化物。矿石中的杂质和最终铁中的碳需另行考虑。',
  },
  {
    symbol: 'Cu',
    note: 'Cu 比碳、氢不活泼；CuO 可被合适的还原剂还原。硫化铜矿的实际提取还需处理硫，不宜只背一个氧化物方程。',
  },
  {
    symbol: 'Ag',
    note: 'Ag 反应性较低，天然可能以单质或化合物存在；具体提取步骤取决于矿石，不能由排序推断所有矿都只需加热。',
  },
]
const selectedMetal = ref('Fe')
// 活性图给出工艺边界，避免把简单顺序表当成所有矿石的完整工厂流程。
const extractionExplanation = computed(
  () => metals.find((metal) => metal.symbol === selectedMetal.value)!.note,
)
const displacementMetals = ['Mg', 'Zn', 'Fe', 'Cu']
const strip = ref('Zn')
const solution = ref('Cu')
// 只比较相同二价体系；是否发生置换由固体金属与溶液金属的相对活性决定。
const displaces = computed(
  () => displacementMetals.indexOf(strip.value) < displacementMetals.indexOf(solution.value),
)
// 图中四组均用二价离子，净离子方程的电子与原子按一比一守恒。
const displacementEquation = computed(() =>
  displaces.value
    ? `${strip.value}(s) + ${solution.value}²⁺(aq) → ${strip.value}²⁺(aq) + ${solution.value}(s)`
    : '在上述通常条件下，不发生金属置换反应。',
)
// 同种金属的情形单列，不能把“相同”误说成“更不活泼”。
const displacementExplanation = computed(() =>
  strip.value === solution.value
    ? '同一种金属与自身离子接触，没有这种净置换。'
    : displaces.value
      ? `${strip.value} 比 ${solution.value} 活泼，失去电子形成离子，${solution.value}²⁺ 得电子成为金属。`
      : `${strip.value} 比 ${solution.value} 不活泼，不能把它从盐溶液中置换出来。`,
)
const ionPoints = [
  { x: 56, y: 192 },
  { x: 182, y: 251 },
  { x: 78, y: 267 },
]
const alloy = ref(false)
const sheared = ref(false)
const alloyPoints = Array.from({ length: 32 }, (_, i) => ({
  x: 100 + (i % 8) * 62,
  y: 89 + Math.floor(i / 8) * 60,
  row: Math.floor(i / 8),
}))
const orePoints = [
  { x: 281, y: 99 },
  { x: 350, y: 100 },
  { x: 272, y: 135 },
  { x: 370, y: 135 },
  { x: 258, y: 182 },
  { x: 380, y: 192 },
  { x: 263, y: 227 },
]
const furnaceStep = ref(0)
const furnaceSteps = [
  {
    title: '生成还原剂',
    equation: String.raw`$\mathrm{C+O_2\rightarrow CO_2}\quad\mathrm{CO_2+C\rightarrow2CO}$`,
    description:
      '焦炭燃烧供热，生成的 CO₂ 与炽热碳形成 CO。第二步中碳元素既有升价又有降价；不能只凭反应物有碳就忽略另一种碳。',
  },
  {
    title: '还原铁矿石',
    equation: String.raw`$\mathrm{Fe_2O_3+3CO\rightarrow2Fe+3CO_2}$`,
    description:
      '铁从 +3 价降到 0 价，被还原；CO 中的碳从 +2 升到 +4，被氧化。CO 是还原剂。高炉铁水含碳等杂质，不等于纯铁。',
  },
  {
    title: '形成炉渣',
    equation: String.raw`$\mathrm{CaCO_3\rightarrow CaO+CO_2}\quad\mathrm{CaO+SiO_2\rightarrow CaSiO_3}$`,
    description:
      '石灰石分解得到 CaO，再与酸性杂质 SiO₂ 形成炉渣。这两步不改变元素氧化态，不能把高炉里每条方程都叫氧化还原。',
  },
]
// 环节按钮同步方程与解释，保留同一高炉装置便于理解各步骤关系。
const furnaceCurrent = computed(() => furnaceSteps[furnaceStep.value]!)
const transitionIndex = ref(0)
const transitionSamples = [
  {
    title: 'Fe：不同氧化态',
    samples: [
      { label: 'Fe²⁺(aq)', color: '#b5d9ba', name: '通常浅绿色' },
      { label: 'Fe³⁺(aq)', color: '#e2be6a', name: '常见黄色至黄棕色' },
    ],
    description:
      '铁可形成 +2、+3 等氧化态。溶液色受配体、浓度和水解影响；Fe³⁺ 溶液的黄棕色不要与 Fe(OH)₃ 沉淀混为一项。',
  },
  {
    title: 'Cu：离子与金属',
    samples: [
      { label: 'Cu²⁺(aq)', color: '#88c9ef', name: '常见水溶液蓝色' },
      { label: 'Cu(s)', color: '#bd7151', name: '铜单质呈红棕色', solid: true },
    ],
    description:
      '铜离子与铜单质不是同一种观察对象。Cu²⁺ 被还原时可析出铜，不能用铜单质颜色代替铜盐溶液颜色。右侧是固体铜片，左侧是含铜离子的溶液。',
  },
  {
    title: 'Zn：避免绝对化',
    samples: [
      { label: 'Zn²⁺(aq)', color: '#f2f8fc', name: '通常无色' },
      { label: 'Cu²⁺(aq)', color: '#88c9ef', name: '常见蓝色，对照' },
    ],
    description:
      '“许多过渡金属化合物有颜色”不能改成“所有金属离子都有颜色”。Zn 与 Zn²⁺ 的 d 亚层都充满，按严格定义不属过渡元素；按题目指定范围使用术语。',
  },
]
// 离子样例切换时图中颜色与文字同时更新，颜色不能脱离具体粒子。
const transition = computed(() => transitionSamples[transitionIndex.value]!)
// 回到知识点时恢复可解释的初始情境，避免沿用其他知识点的实验条件。
watch(
  () => props.topic,
  () => {
    selectedMetal.value = 'Fe'
    strip.value = 'Zn'
    solution.value = 'Cu'
    alloy.value = false
    sheared.value = false
    furnaceStep.value = 0
    transitionIndex.value = 0
  },
)
</script>

<style scoped lang="scss">
// 图解选择沿用学习区配色，通过按下状态区分当前演示。
.metals-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-color: var(--color-learning-teal);
  --app-button-hover-border: var(--color-learning-teal);
}
.metals-atlas :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-color: var(--color-ink-inverse);
}

.metals-atlas {
  margin: 0;
  padding: 24px;
  min-width: 0;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: 14px;
  background: var(--color-learning-teal-soft);
  color: var(--color-ink);
}
.eyebrow {
  color: var(--color-learning-teal);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.09em;
}
h5 {
  margin: 12px 0;
  font-size: 20px;
  line-height: 1.5;
}
p {
  font-size: 14px;
  line-height: 1.85;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 14px 0;
}
.controls > span {
  min-width: 44px;
  font-size: 13px;
  color: var(--color-ink-soft);
}
.controls :deep([aria-pressed='true']) {
  background: var(--color-learning-teal);
  border-color: var(--color-learning-teal);
  color: white;
}
.svg-scroll {
  overflow-x: auto;
  margin: 18px 0;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: 10px;
  background: white;
}
svg {
  display: block;
  width: 100%;
  min-width: 520px;
  height: auto;
}
svg text {
  fill: #243b53;
  font-size: 14px;
}
.strong {
  font-weight: 700;
  font-size: 17px;
}
.arrow,
.bracket,
.glass,
.outlet {
  fill: none;
  stroke: #426784;
  stroke-width: 2.5;
}
.band {
  fill: #f2f5f8;
}
.selected-band {
  fill: #bde8e1;
  stroke: #098377;
}
.carbon-band {
  fill: #f8e5bc;
}
.liquid {
  fill: #e8f4fb;
}
.strip {
  fill: #a9b7c4;
  stroke: #61798d;
}
.deposit {
  fill: #c37b4f;
}
.ion {
  fill: white;
  stroke: #80b3c3;
}
.metal-atom {
  fill: #b5d2e9;
  stroke: #648fb3;
}
.alloy-atom {
  fill: #f0c484;
  stroke: #bd8842;
}
.slip-plane {
  stroke: #648fb3;
  stroke-dasharray: 6 6;
}
.furnace {
  fill: #fff1db;
}
.slag {
  fill: #d7b76b;
}
.molten {
  fill: #d87744;
}
.ore {
  fill: #b7784d;
}
.coke {
  fill: #626367;
}
.hot-air {
  fill: none;
  stroke: #d16b34;
  stroke-width: 3;
}
.gas-flow {
  fill: none;
  stroke: #0e8b80;
  stroke-width: 3;
}
.equation {
  padding: 12px 14px;
  border-left: 3px solid var(--color-learning-teal);
  background: white;
  font-weight: 600;
  overflow-x: auto;
}
.conclusion {
  padding-top: 12px;
  border-top: 1px solid var(--color-learning-teal-line);
}
.model-note {
  display: block;
  color: var(--color-ink-muted);
  font-size: 12px;
  line-height: 1.7;
}
.svg-scroll:focus-visible {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 3px;
}
@media (max-width: 780px) {
  .metals-atlas {
    padding: 16px;
  }
  h5 {
    font-size: 18px;
  }
}
</style>
