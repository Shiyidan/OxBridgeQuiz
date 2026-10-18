<!-- ESAT 化学周期表图解：按知识点联动元素位置、电子排布与同族趋势，供学习平台复习使用。 -->
<template>
  <figure class="periodic-atlas" :aria-label="view.title">
    <figcaption>
      <span class="atlas-eyebrow">CHEMISTRY ATLAS · 化学图解</span>
      <h5>{{ view.title }}</h5>
      <p>{{ view.subtitle }}</p>
    </figcaption>

    <div v-if="mode === 'position'" class="atlas-controls" role="group" aria-label="比较周期与族">
      <AppButton
        v-for="item in axes"
        :key="item.value"
        type="secondary"
        size="small"
        :aria-pressed="axis === item.value"
        @click="axis = item.value"
        >{{ item.label }}</AppButton
      >
    </div>
    <div v-else-if="mode === 'sequence'" class="sequence-controls">
      <AppButton
        type="secondary"
        size="small"
        :disabled="selected.number === 1"
        @click="stepElement(-1)"
        >前一个元素</AppButton
      >
      <span
        >原子序数 <strong>{{ selected.number }}</strong> · 质子数
        <strong>{{ selected.number }}</strong></span
      >
      <AppButton
        type="secondary"
        size="small"
        :disabled="selected.number === 20"
        @click="stepElement(1)"
        >后一个元素</AppButton
      >
    </div>
    <div
      v-else-if="mode === 'regions'"
      class="atlas-controls"
      role="group"
      aria-label="选择元素分区"
    >
      <AppButton
        v-for="item in regions"
        :key="item.value"
        type="secondary"
        size="small"
        :aria-pressed="region === item.value"
        @click="region = item.value"
        >{{ item.label }}</AppButton
      >
    </div>
    <div
      v-else-if="mode === 'electrons'"
      class="atlas-controls"
      role="group"
      aria-label="比较电子排布"
    >
      <AppButton
        v-for="number in [11, 12, 17, 18, 2, 19]"
        :key="number"
        type="secondary"
        size="small"
        :aria-pressed="selected.number === number"
        @click="selectElement(number)"
        >{{ elements[number - 1]?.symbol }}</AppButton
      >
    </div>
    <div v-else class="atlas-controls" role="group" aria-label="比较元素族反应性">
      <AppButton
        type="secondary"
        size="small"
        :aria-pressed="family === 'alkali'"
        @click="family = 'alkali'"
        >第 1 族 · 碱金属</AppButton
      >
      <AppButton
        type="secondary"
        size="small"
        :aria-pressed="family === 'halogen'"
        @click="family = 'halogen'"
        >第 17 族 · 卤素</AppButton
      >
    </div>

    <div
      v-if="mode !== 'trends'"
      class="table-scroll"
      tabindex="0"
      aria-label="前20号元素周期表，窄屏可横向滚动；元素按钮支持方向键选择"
    >
      <div class="element-grid">
        <span class="axis-label" style="grid-column: 1; grid-row: 1">族 →<br />周期 ↓</span>
        <span
          v-for="group in 18"
          :key="`g-${group}`"
          class="group-label"
          :class="{ 'is-axis': group === selected.group }"
          :style="{ gridColumn: group + 1, gridRow: 1 }"
          >{{ group }}</span
        >
        <span
          v-for="period in 4"
          :key="`p-${period}`"
          class="period-label"
          :class="{ 'is-axis': period === selected.period }"
          :style="{ gridColumn: 1, gridRow: period + 1 }"
          >{{ period }}</span
        >
        <AppButton
          v-for="element in elements"
          :key="element.number"
          type="secondary"
          size="small"
          class="element-cell"
          :class="[
            element.kind,
            {
              'is-selected': element.number === selected.number,
              'is-related': isRelated(element),
              'is-muted': mode === 'regions' && !isRelated(element),
            },
          ]"
          :style="{ gridColumn: element.group + 1, gridRow: element.period + 1 }"
          :aria-label="`${element.name} ${element.symbol}，原子序数${element.number}，第${element.period}周期，第${element.group}族，${kindLabels[element.kind]}`"
          :aria-pressed="element.number === selected.number"
          :data-atomic-number="element.number"
          @click="selectElement(element.number)"
          @keydown="navigateElement($event, element)"
        >
          <span class="element-number">{{ element.number }}</span>
          <strong>{{ element.symbol }}</strong
          ><span class="element-name">{{ element.name }}</span>
        </AppButton>
        <div class="table-reading-key">
          <span>{{
            mode === 'sequence'
              ? '读数字，不数空格'
              : mode === 'regions'
                ? '先定位，再看类别'
                : '横看周期 · 竖看族'
          }}</span>
          <p>
            {{
              mode === 'sequence'
                ? 'He → Li、Ne → Na、Ar → K：换行时原子序数仍连续。'
                : '点击元素，将位置与下方的电子排布一起看。'
            }}
          </p>
        </div>
        <div
          class="transition-region"
          :class="{ 'is-related': mode === 'regions' && region === 'transition' }"
        >
          <strong>21—30 号所在的中央区域</strong><span>从第 4 周期开始 · 过渡金属主要在这里</span>
        </div>
        <div class="omitted-region">31—36 号位置<br /><span>本图省略元素格</span></div>
      </div>
    </div>

    <template v-if="mode !== 'trends'">
      <div class="table-legend">
        <span class="metal">金属</span><span class="nonmetal">非金属</span
        ><span class="metalloid">类金属：B、Si</span><span>蓝色边框：当前元素</span>
      </div>
      <div class="element-explanation" aria-live="polite">
        <div class="element-summary">
          <div class="element-heading">
            <strong>{{ selected.symbol }}</strong>
            <div>
              <b>{{ selected.name }} · {{ selected.english }}</b
              ><span
                >第 {{ selected.period }} 周期 · 第 {{ selected.group }} 族 ·
                {{ kindLabels[selected.kind] }}</span
              >
            </div>
          </div>
          <p class="arrangement">
            <span>中性原子电子排布</span><strong>{{ selected.shells.join(',') }}</strong>
          </p>
          <p>{{ explanation }}</p>
          <p v-if="mode === 'regions'" class="small-note">{{ regionExplanation }}</p>
        </div>
        <div class="shell-preview">
          <svg
            viewBox="0 0 250 250"
            role="img"
            :aria-label="`${selected.name}原子的电子层计数示意：${selected.shells.join('、')}，共有${selected.shells.length}层`"
          >
            <circle cx="125" cy="125" r="16" class="nucleus" />
            <text x="125" y="130" class="nucleus-label">+{{ selected.number }}</text>
            <g v-for="(count, index) in selected.shells" :key="index">
              <circle
                cx="125"
                cy="125"
                :r="shellRadius(index)"
                class="electron-shell"
                :class="{ outer: index === selected.shells.length - 1 }"
              />
              <circle
                v-for="electron in count"
                :key="electron"
                :cx="electronPoint(index, electron, count).x"
                :cy="electronPoint(index, electron, count).y"
                r="4.5"
                class="electron"
                :class="{ outer: index === selected.shells.length - 1 }"
              />
            </g>
          </svg>
          <span
            >{{ selected.shells.length }} 个已占据电子层 · 最外层 {{ outerElectrons }} 个电子</span
          >
        </div>
      </div>
    </template>

    <div v-else class="trend-explanation" aria-live="polite">
      <div class="trend-heading">
        <strong>{{ family === 'alkali' ? '向下更容易失去电子' : '向下得电子的能力减弱' }}</strong
        ><span>{{
          family === 'alkali' ? '反应性：Li < Na < K' : '氧化性 / 置换能力：Cl₂ > Br₂ > I₂'
        }}</span>
      </div>
      <div class="trend-rows">
        <AppButton
          v-for="(item, index) in trendElements"
          :key="item.symbol"
          type="secondary"
          class="trend-row"
          :aria-pressed="trendIndex === index"
          @click="trendIndex = index"
        >
          <span class="trend-symbol"
            >{{ item.symbol }}<small>{{ item.name }}</small></span
          >
          <svg
            viewBox="0 0 220 62"
            role="img"
            :aria-label="`${item.name}具有${item.layers}个已占据电子层`"
          >
            <circle cx="90" cy="31" r="7" class="nucleus" />
            <circle
              v-for="layer in item.layers"
              :key="layer"
              cx="90"
              cy="31"
              :r="8 + layer * 4"
              class="electron-shell"
            />
            <circle :cx="98 + item.layers * 4" cy="31" r="3.5" class="electron outer" />
            <text x="135" y="35">
              {{ item.layers }} 层 · 外层 {{ family === 'alkali' ? 1 : 7 }} e⁻
            </text>
          </svg>
          <span class="trend-result">{{ item.description }}</span>
        </AppButton>
      </div>
      <p class="trend-reason">
        <strong>{{ currentTrend.symbol }}：</strong>{{ currentTrend.reason }}
      </p>
      <p v-if="family === 'alkali'">
        多一层电子，外层电子离核更远，内层屏蔽也增多；这些影响胜过核电荷增加带来的吸引。失去最外层 1
        个电子更容易，因此 Li → Na → K 与水反应通常更剧烈。
      </p>
      <p v-else>
        比较卤素单质取得电子的能力：Cl → Br → I
        的原子外层离核更远，屏蔽更多，对外来电子的吸引减弱。因此氯能置换溴化物中的溴，溴不能反向置换氯化物中的氯。
      </p>
      <div class="trend-memory">
        {{ family === 'alkali' ? '碱金属失电子：向下更容易。' : '卤素得电子：向下更困难。'
        }}<span>先认元素族，再判断电子得失，最后写趋势。</span>
      </div>
    </div>

    <p class="atlas-note">
      {{
        mode === 'trends'
          ? '比较的是指定元素族在相应反应中的趋势，不能推广为所有元素的统一规律。小图只表示电子层数与最外层，不画完整电子数，大小不是实测原子半径。'
          : '本图详细展示 H—Ca；只对这些中性基态原子使用层式电子排布。圆环用于计数，不是真实电子轨道，也不表示各层最大容量；原子核与电子不按实际比例。'
      }}
    </p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '../AppButton.vue'

type ElementKind = 'metal' | 'nonmetal' | 'metalloid'
type DiagramMode = 'position' | 'sequence' | 'regions' | 'electrons' | 'trends'
type Region =
  | 'all'
  | 'metal'
  | 'nonmetal'
  | 'alkali'
  | 'alkaline'
  | 'oxygen'
  | 'halogen'
  | 'noble'
  | 'transition'
interface TableElement {
  number: number
  symbol: string
  name: string
  english: string
  group: number
  period: number
  shells: number[]
  kind: ElementKind
}
const props = defineProps<{ topic: string }>()

// 显式保存前 20 号元素的基态排布，避免用“每层都填满 8 个”误推更高原子序数。
const elements: TableElement[] = [
  {
    number: 1,
    symbol: 'H',
    name: '氢',
    english: 'Hydrogen',
    group: 1,
    period: 1,
    shells: [1],
    kind: 'nonmetal',
  },
  {
    number: 2,
    symbol: 'He',
    name: '氦',
    english: 'Helium',
    group: 18,
    period: 1,
    shells: [2],
    kind: 'nonmetal',
  },
  {
    number: 3,
    symbol: 'Li',
    name: '锂',
    english: 'Lithium',
    group: 1,
    period: 2,
    shells: [2, 1],
    kind: 'metal',
  },
  {
    number: 4,
    symbol: 'Be',
    name: '铍',
    english: 'Beryllium',
    group: 2,
    period: 2,
    shells: [2, 2],
    kind: 'metal',
  },
  {
    number: 5,
    symbol: 'B',
    name: '硼',
    english: 'Boron',
    group: 13,
    period: 2,
    shells: [2, 3],
    kind: 'metalloid',
  },
  {
    number: 6,
    symbol: 'C',
    name: '碳',
    english: 'Carbon',
    group: 14,
    period: 2,
    shells: [2, 4],
    kind: 'nonmetal',
  },
  {
    number: 7,
    symbol: 'N',
    name: '氮',
    english: 'Nitrogen',
    group: 15,
    period: 2,
    shells: [2, 5],
    kind: 'nonmetal',
  },
  {
    number: 8,
    symbol: 'O',
    name: '氧',
    english: 'Oxygen',
    group: 16,
    period: 2,
    shells: [2, 6],
    kind: 'nonmetal',
  },
  {
    number: 9,
    symbol: 'F',
    name: '氟',
    english: 'Fluorine',
    group: 17,
    period: 2,
    shells: [2, 7],
    kind: 'nonmetal',
  },
  {
    number: 10,
    symbol: 'Ne',
    name: '氖',
    english: 'Neon',
    group: 18,
    period: 2,
    shells: [2, 8],
    kind: 'nonmetal',
  },
  {
    number: 11,
    symbol: 'Na',
    name: '钠',
    english: 'Sodium',
    group: 1,
    period: 3,
    shells: [2, 8, 1],
    kind: 'metal',
  },
  {
    number: 12,
    symbol: 'Mg',
    name: '镁',
    english: 'Magnesium',
    group: 2,
    period: 3,
    shells: [2, 8, 2],
    kind: 'metal',
  },
  {
    number: 13,
    symbol: 'Al',
    name: '铝',
    english: 'Aluminium',
    group: 13,
    period: 3,
    shells: [2, 8, 3],
    kind: 'metal',
  },
  {
    number: 14,
    symbol: 'Si',
    name: '硅',
    english: 'Silicon',
    group: 14,
    period: 3,
    shells: [2, 8, 4],
    kind: 'metalloid',
  },
  {
    number: 15,
    symbol: 'P',
    name: '磷',
    english: 'Phosphorus',
    group: 15,
    period: 3,
    shells: [2, 8, 5],
    kind: 'nonmetal',
  },
  {
    number: 16,
    symbol: 'S',
    name: '硫',
    english: 'Sulfur',
    group: 16,
    period: 3,
    shells: [2, 8, 6],
    kind: 'nonmetal',
  },
  {
    number: 17,
    symbol: 'Cl',
    name: '氯',
    english: 'Chlorine',
    group: 17,
    period: 3,
    shells: [2, 8, 7],
    kind: 'nonmetal',
  },
  {
    number: 18,
    symbol: 'Ar',
    name: '氩',
    english: 'Argon',
    group: 18,
    period: 3,
    shells: [2, 8, 8],
    kind: 'nonmetal',
  },
  {
    number: 19,
    symbol: 'K',
    name: '钾',
    english: 'Potassium',
    group: 1,
    period: 4,
    shells: [2, 8, 8, 1],
    kind: 'metal',
  },
  {
    number: 20,
    symbol: 'Ca',
    name: '钙',
    english: 'Calcium',
    group: 2,
    period: 4,
    shells: [2, 8, 8, 2],
    kind: 'metal',
  },
]
const kindLabels = { metal: '金属', nonmetal: '非金属', metalloid: '类金属' }
const selectedNumber = ref(11)
const axis = ref<'period' | 'group'>('period')
const region = ref<Region>('all')
const family = ref<'alkali' | 'halogen'>('alkali')
const trendIndex = ref(0)
const axes = [
  { value: 'period', label: '横向看周期' },
  { value: 'group', label: '纵向看族' },
] as const
const regions: Array<{ value: Region; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'metal', label: '金属' },
  { value: 'nonmetal', label: '非金属' },
  { value: 'alkali', label: '1 族碱金属' },
  { value: 'alkaline', label: '2 族' },
  { value: 'oxygen', label: '16 族' },
  { value: 'halogen', label: '17 族卤素' },
  { value: 'noble', label: '18 族稀有气体' },
  { value: 'transition', label: '过渡金属区' },
]
const views: Record<DiagramMode, { title: string; subtitle: string }> = {
  position: {
    title: '一横一竖，给元素定位',
    subtitle: '周期是横排，族是竖列。切换比较方向，再点一个元素。',
  },
  sequence: {
    title: '跟着原子序数，读懂换行',
    subtitle: '从 H 到 Ca，质子数逐一增加；图上的空格不代表缺失的原子序数。',
  },
  regions: {
    title: '用位置记住元素类别',
    subtitle: '左侧多金属，右上多非金属；氢与分界附近的类金属要单独看。',
  },
  electrons: {
    title: '把电子排布翻译成周期和族',
    subtitle: '先数已占据电子层，再看最外层电子。点 He，检查这条规则的例外。',
  },
  trends: {
    title: '同样向下，为什么趋势不同？',
    subtitle: '一个比较失电子，一个比较得电子；切换族，再点击元素看原因。',
  },
}

// 每个考纲节点有独立的观察任务，避免切换章节后仍呈现同一张无变化的图。
const mode = computed<DiagramMode>(
  () =>
    (
      ({
        '140201': 'position',
        '140202': 'sequence',
        '140203': 'regions',
        '140204': 'electrons',
        '140205': 'trends',
      }) as Record<string, DiagramMode>
    )[props.topic] ?? 'position',
)
// 图题随当前知识点切换，与正文的学习目标保持一致。
const view = computed(() => views[mode.value])
// 选中编号只来自图中已核对的前 20 个元素。
const selected = computed(() => elements[selectedNumber.value - 1] ?? elements[10]!)
// 最外层数用于主族对照，氦的满层例外由解释单独说明。
const outerElectrons = computed(() => selected.value.shells.at(-1) ?? 0)
// 根据当前观察任务解释同一个元素，原子序数、周期和族不混为一项。
const explanation = computed(() => {
  const item = selected.value
  if (mode.value === 'sequence')
    return `${item.name}的原子序数是 ${item.number}，核内有 ${item.number} 个质子。中性原子也有 ${item.number} 个电子；变成离子或换一个同位素，都不会移动这个元素在表中的位置。`
  if (mode.value === 'regions') {
    if (item.number === 1)
      return '氢位于第 1 族，但属于非金属，不是碱金属。不能只看“在左边”，就认定它是金属。'
    if (item.kind === 'metalloid')
      return `${item.name}位于金属与非金属分界附近，通常单列为类金属；不能把整条分界右侧或整族都机械归成同一类。`
    return `${item.name}在第 ${item.group} 族的${item.kind === 'metal' ? '金属' : '非金属'}区域。族是纵向的位置，金属／非金属是性质类别；同一族不一定从上到下都属于同一类别。`
  }
  if (item.number === 2)
    return 'He 只有 1 个已占据电子层，所以在第 1 周期；第一层有 2 个电子已经满层，因此与其他稀有气体同列在第 18 族，不在第 2 族。'
  if (mode.value === 'position')
    return axis.value === 'period'
      ? `${item.name}所在的第 ${item.period} 周期是一横排；本图中同排原子的已占据电子层数都为 ${item.period}。同一周期不表示最外层电子数相同。`
      : `${item.name}所在的第 ${item.group} 族是一竖列。主族原子的相似最外层排布与相似化学性质有关；He 是“满外层相似、外层电子数不同”的例外。`
  return `${item.shells.join(',')} 有 ${item.period} 个数，表示 ${item.period} 个已占据电子层，故为第 ${item.period} 周期；最外层有 ${outerElectrons.value} 个电子，对应第 ${item.group} 族${item.group >= 13 ? '（13—18 族用最外层电子数加 10）' : ''}。这套快捷判断用于本图的主族中性基态原子。`
})
// 分区文字覆盖图中省略的中央区域，并说明 16 族及氢的分类边界。
const regionExplanation = computed(
  () =>
    ({
      all: 'B、Si 单列类金属；第 4 周期中央区域在前 20 号元素之后，本图仅标出位置。',
      metal: '碱金属在第 1 族（不含氢），碱土金属在第 2 族；Al 也属于金属。',
      nonmetal: '本图非金属多在右上，但氢在左上；并非“右边每个元素都是非金属”。',
      alkali: '当前展示 Li、Na、K，均有 1 个最外层电子；氢不属于碱金属。',
      alkaline: '第 2 族为碱土金属；本图显示 Be、Mg、Ca，最外层均有 2 个电子。',
      oxygen: '第 16 族的 O、S 是常见非金属，最外层有 6 个电子；不要推成全族每种元素都为非金属。',
      halogen: '第 17 族为卤素，本图显示 F、Cl；Br、I 在下方周期，不在前 20 号元素范围。',
      noble: '第 18 族为稀有气体：He 的外层 2 个电子已满，Ne、Ar 的外层均为 8 个。',
      transition:
        '过渡金属主要在表的中央，从第 4 周期开始。不能把中央元素的族号直接当最外层电子数。',
    })[region.value],
)
// 趋势图显式区分失电子与得电子，使用指定元素族的定性比较。
const trendElements = computed(() =>
  family.value === 'alkali'
    ? [
        {
          symbol: 'Li',
          name: '锂',
          layers: 2,
          description: '较难失去外层电子',
          reason: '与 Na、K 相比，外层电子距核较近、屏蔽较少，在这三者中较难失去。',
        },
        {
          symbol: 'Na',
          name: '钠',
          layers: 3,
          description: '较易失去外层电子',
          reason: '比 Li 多一个已占据电子层，外层电子离核更远，失电子更容易。',
        },
        {
          symbol: 'K',
          name: '钾',
          layers: 4,
          description: '三者中最易失电子',
          reason: '比 Na 再多一层，外层电子受到的有效吸引更弱，与水反应通常更剧烈。',
        },
      ]
    : [
        {
          symbol: 'Cl',
          name: '氯',
          layers: 3,
          description: '三者中氧化性最强',
          reason: '与 Br、I 相比，外层离核较近、屏蔽较少，氯单质取得电子的能力较强。',
        },
        {
          symbol: 'Br',
          name: '溴',
          layers: 4,
          description: '能置换碘，不能置换氯',
          reason: '溴单质可使碘离子失电子生成碘，但不能使氯离子按同样方式生成氯。',
        },
        {
          symbol: 'I',
          name: '碘',
          layers: 5,
          description: '三者中氧化性最弱',
          reason:
            '在这组比较中外层距核更远、屏蔽更多；碘单质不能从氯化物或溴化物溶液中置换氯或溴。',
        },
      ],
)
// 点击比较对象只更新图旁解释，不改动学习范围或作答状态。
const currentTrend = computed(
  () => trendElements.value[trendIndex.value] ?? trendElements.value[0]!,
)

// 知识点变化后恢复该节起点，避免上一节的分区筛选干扰新观察任务。
watch(
  () => props.topic,
  () => {
    selectedNumber.value = props.topic === '140202' ? 1 : 11
    axis.value = 'period'
    region.value = 'all'
    family.value = 'alkali'
    trendIndex.value = 0
  },
  { immediate: true },
)

// 保持编号与示意图数据一一对应。
function selectElement(number: number) {
  if (number >= 1 && number <= 20) selectedNumber.value = number
}
// 序号模式跨越周期边界时仍逐一递增质子数。
function stepElement(delta: number) {
  selectElement(selectedNumber.value + delta)
}
// 按观察方向或元素分区突出相关对象，颜色之外保留元素名称与类别文字。
function isRelated(element: TableElement): boolean {
  if (mode.value === 'regions') {
    if (region.value === 'all') return true
    if (region.value === 'metal' || region.value === 'nonmetal')
      return element.kind === region.value
    if (region.value === 'alkali') return element.group === 1 && element.number !== 1
    return (
      element.group ===
      (
        { alkaline: 2, oxygen: 16, halogen: 17, noble: 18, transition: -1 } as Partial<
          Record<Region, number>
        >
      )[region.value]
    )
  }
  if (mode.value === 'position')
    return axis.value === 'period'
      ? element.period === selected.value.period
      : element.group === selected.value.group
  return element.number === selectedNumber.value
}
// 横向方向键沿原子序数，纵向沿同族移动；同时移动键盘焦点至被选元素。
function navigateElement(event: KeyboardEvent, element: TableElement) {
  let next: TableElement | undefined
  if (event.key === 'ArrowLeft') next = elements[element.number - 2]
  if (event.key === 'ArrowRight') next = elements[element.number]
  if (event.key === 'ArrowUp')
    next = [...elements]
      .reverse()
      .find((item) => item.group === element.group && item.period < element.period)
  if (event.key === 'ArrowDown')
    next = elements.find((item) => item.group === element.group && item.period > element.period)
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
  event.preventDefault()
  if (!next) return
  selectElement(next.number)
  const table = (event.currentTarget as HTMLElement).closest('.element-grid')
  table?.querySelector<HTMLElement>(`[data-atomic-number="${next.number}"]`)?.focus()
}
// 图中的层距只为清楚计数，不表达真实尺寸或能级间距。
function shellRadius(index: number) {
  return 36 + index * 23
}
// 均匀分布电子标记方便数目核对，不表示电子沿圆周运行。
function electronPoint(layer: number, number: number, count: number) {
  const angle = ((number - 1) * 2 * Math.PI) / count - Math.PI / 2
  return {
    x: 125 + shellRadius(layer) * Math.cos(angle),
    y: 125 + shellRadius(layer) * Math.sin(angle),
  }
}
</script>

<style scoped>
.periodic-atlas {
  min-width: 0;
  margin: 16px 0;
  padding: 20px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-learning-teal-soft), var(--color-surface) 65%);
  color: var(--color-ink);
}
.atlas-eyebrow {
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  color: var(--color-learning-teal);
  letter-spacing: 0.08em;
}
figcaption h5 {
  margin: 6px 0;
  font-size: var(--text-lg);
  line-height: 1.5;
}
figcaption p {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.8;
}
.atlas-controls,
.sequence-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
  font-size: var(--text-sm);
}
.periodic-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-color: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-color: var(--color-learning-teal);
  --app-button-hover-border: var(--color-learning-teal);
  min-width: 0;
  margin-left: 0;
}
.atlas-controls :deep(.app-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
}
.periodic-atlas :deep(button:focus-visible),
.table-scroll:focus-visible {
  outline: 3px solid var(--color-learning-blue);
  outline-offset: 3px;
}
.table-scroll {
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: 8px;
  padding: 12px;
  background: var(--color-surface);
}
.element-grid {
  display: grid;
  grid-template-columns: 30px repeat(18, minmax(34px, 1fr));
  grid-template-rows: 34px repeat(4, 66px);
  gap: 4px;
  min-width: 760px;
}
.axis-label,
.group-label,
.period-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--color-ink-soft);
  text-align: center;
}
.is-axis {
  font-weight: var(--weight-bold);
  color: var(--color-learning-blue);
}
.element-cell.app-button.el-button {
  --app-button-bg: #f0fdfa;
  --app-button-color: #115e59;
  --app-button-border: #c5e6df;
  height: 66px;
  width: 100%;
  padding: 3px;
  border-radius: 5px;
  font-size: 12px;
}
.element-cell.nonmetal {
  --app-button-bg: #eff6ff;
  --app-button-color: #1e40af;
  --app-button-border: #cbddf9;
}
.element-cell.metalloid {
  --app-button-bg: #fff7ed;
  --app-button-color: #9a3412;
  --app-button-border: #fed7aa;
}
.element-cell :deep(.app-button__label) {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  justify-content: center;
  gap: 1px;
  line-height: 1.2;
}
.element-cell strong {
  font-size: 17px;
}
.element-number {
  font-size: 10px;
  font-weight: 400;
  align-self: flex-start;
}
.element-name {
  font-size: 10px;
  font-weight: 400;
}
.element-cell.is-related {
  box-shadow: inset 0 0 0 1px var(--color-learning-teal);
}
.element-cell.is-muted {
  opacity: 0.4;
}
.element-cell.is-selected {
  border: 2px solid var(--color-learning-blue);
  box-shadow: 0 0 0 1px var(--color-learning-blue);
  opacity: 1;
}
.table-reading-key {
  grid-column: 4 / 14;
  grid-row: 2 / 5;
  align-self: center;
  padding: 18px;
  text-align: center;
}
.table-reading-key > span {
  font-weight: var(--weight-bold);
  color: var(--color-learning-teal);
}
.table-reading-key p {
  margin: 8px 0 0;
  line-height: 1.7;
  font-size: 13px;
  color: var(--color-ink-soft);
}
.transition-region,
.omitted-region {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  grid-row: 5;
  padding: 6px;
  border: 1px dashed #cbd5e1;
  border-radius: 5px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  text-align: center;
}
.transition-region {
  grid-column: 4 / 14;
}
.transition-region.is-related {
  border: 2px solid var(--color-learning-teal);
  background: var(--color-learning-teal-soft);
  color: var(--color-learning-teal);
}
.omitted-region {
  grid-column: 14 / 20;
}
.table-legend {
  display: flex;
  gap: 8px 16px;
  flex-wrap: wrap;
  margin: 12px 0;
  font-size: 12px;
  color: var(--color-ink-soft);
}
.table-legend .metal {
  color: #115e59;
}
.table-legend .nonmetal {
  color: #1e40af;
}
.table-legend .metalloid {
  color: #9a3412;
}
.element-explanation {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  align-items: center;
  gap: 24px;
  padding-top: 12px;
  border-top: 1px solid var(--color-learning-teal-line);
}
.element-heading {
  display: flex;
  align-items: center;
  gap: 14px;
}
.element-heading > strong {
  font-size: 36px;
  color: var(--color-learning-teal);
}
.element-heading > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.element-heading b {
  font-size: 15px;
}
.element-heading span {
  font-size: 13px;
  color: var(--color-ink-soft);
}
.element-summary p {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.8;
}
.element-summary .arrangement {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.arrangement strong {
  font-size: 24px;
  color: var(--color-learning-blue);
  letter-spacing: 0.08em;
}
.arrangement span {
  font-size: 12px;
  color: var(--color-ink-soft);
}
.element-summary .small-note {
  font-size: 12px;
  color: var(--color-ink-soft);
}
.shell-preview svg {
  display: block;
  max-height: 200px;
  width: 100%;
}
.shell-preview > span {
  display: block;
  text-align: center;
  font-size: 12px;
  color: var(--color-ink-soft);
}
.nucleus {
  fill: #dbeafe;
  stroke: #93c5fd;
}
.nucleus-label {
  fill: #1e40af;
  text-anchor: middle;
  font-size: 12px;
}
.electron-shell {
  fill: none;
  stroke: #cbd5e1;
  stroke-width: 1.5;
}
.electron-shell.outer {
  stroke: var(--color-learning-teal);
  stroke-width: 2;
}
.electron {
  fill: #64748b;
}
.electron.outer {
  fill: var(--color-learning-teal);
}
.trend-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 14px 0;
}
.trend-heading span {
  font-size: 14px;
  color: var(--color-learning-teal);
}
.trend-rows {
  display: grid;
  gap: 6px;
}
.trend-row.app-button.el-button {
  width: 100%;
  height: auto;
  padding: 8px 14px;
  border-radius: 6px;
}
.trend-row :deep(> span) {
  width: 100%;
}
.trend-row :deep(.app-button__label) {
  display: grid;
  grid-template-columns: 65px minmax(100px, 1fr) minmax(140px, 1fr);
  gap: 8px;
  align-items: center;
  width: 100%;
  text-align: left;
  white-space: normal;
}
.trend-row[aria-pressed='true'] {
  border-color: var(--color-learning-teal);
  background: var(--color-learning-teal-soft);
}
.trend-symbol {
  font-size: 24px;
}
.trend-symbol small {
  display: block;
  font-size: 12px;
  font-weight: 400;
}
.trend-row svg {
  display: block;
  max-width: 220px;
  width: 100%;
}
.trend-row svg text {
  font-size: 10px;
  fill: #334155;
}
.trend-result {
  font-size: 13px;
  line-height: 1.6;
}
.trend-explanation p {
  font-size: 14px;
  line-height: 1.85;
}
.trend-reason {
  padding: 12px 0;
  border-bottom: 1px solid var(--color-learning-teal-line);
}
.trend-memory {
  border-left: 3px solid var(--color-learning-blue);
  padding: 10px 14px;
  background: #eff6ff;
  color: #1e40af;
  font-weight: var(--weight-bold);
  font-size: 14px;
  line-height: 1.7;
}
.trend-memory span {
  display: block;
  font-size: 12px;
  font-weight: 400;
}
.atlas-note {
  margin: 16px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--color-learning-teal-line);
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-ink-soft);
}
@media (max-width: 650px) {
  .periodic-atlas {
    padding: 12px;
  }
  .element-explanation {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
  }
  .shell-preview {
    max-width: 250px;
    justify-self: center;
  }
  .trend-row :deep(.app-button__label) {
    grid-template-columns: 42px minmax(100px, 1fr);
  }
  .trend-result {
    grid-column: 2;
  }
  .trend-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .atlas-controls :deep(.app-button.el-button) {
    padding: 0 8px;
    font-size: 12px;
  }
}
</style>
