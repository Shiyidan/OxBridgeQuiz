<!-- ESAT 反应、式与方程互动图解：以粒子、配比、物态和守恒过程承接第三章五个知识点。 -->
<template>
  <figure class="reaction-atlas" :aria-label="heading">
    <figcaption>
      <span class="reaction-eyebrow">CHEMISTRY · 反应、式与方程</span>
      <h5>{{ heading }}</h5>
      <p>{{ instruction }}</p>
    </figcaption>

    <template v-if="mode === 'rearrange'">
      <div class="reaction-controls" role="group" aria-label="观察原子与电子变化">
        <AppButton
          v-for="item in rearrangementOptions"
          :key="item.key"
          type="secondary"
          size="small"
          :aria-pressed="rearrangement === item.key"
          @click="setRearrangement(item.key)"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="stage-controls" role="group" aria-label="反应前后">
        <AppButton type="secondary" size="small" :aria-pressed="stage === 0" @click="stage = 0"
          >反应前</AppButton
        >
        <AppButton type="secondary" size="small" :aria-pressed="stage === 1" @click="stage = 1"
          >反应后</AppButton
        >
      </div>
      <svg
        v-if="rearrangement === 'covalent'"
        viewBox="0 0 580 235"
        role="img"
        :aria-label="waterDescription"
      >
        <title>{{ waterDescription }}</title>
        <g class="bond-lines">
          <line
            v-for="(bond, index) in waterBonds"
            :key="index"
            :x1="bond[0]"
            :y1="bond[1]"
            :x2="bond[2]"
            :y2="bond[3]"
          />
        </g>
        <g
          v-for="atom in waterAtoms"
          :key="atom.id"
          :class="['atom', atom.element === 'O' ? 'atom--oxygen' : 'atom--hydrogen']"
        >
          <circle :cx="atom.x" :cy="atom.y" :r="atom.element === 'O' ? 25 : 19" />
          <text :x="atom.x" :y="atom.y + 6" text-anchor="middle">{{ atom.element }}</text>
        </g>
        <text x="290" y="213" text-anchor="middle" class="svg-caption">
          {{ stage === 0 ? '2 个 H₂ + 1 个 O₂' : '2 个 H₂O' }}
        </text>
      </svg>
      <svg v-else viewBox="0 0 580 235" role="img" :aria-label="transferDescription">
        <title>{{ transferDescription }}</title>
        <circle cx="130" cy="100" r="53" class="zinc-disc" />
        <circle cx="450" cy="100" r="53" class="copper-disc" />
        <text x="130" y="108" text-anchor="middle" class="species-label">
          {{ stage === 0 ? 'Zn' : 'Zn²⁺' }}
        </text>
        <text x="450" y="108" text-anchor="middle" class="species-label">
          {{ stage === 0 ? 'Cu²⁺' : 'Cu' }}
        </text>
        <path d="M 205 96 H 373 L 361 88 M 373 96 L 361 104" class="transfer-arrow" />
        <text x="290" y="77" text-anchor="middle" class="svg-label">转移 2e⁻</text>
        <text x="130" y="176" text-anchor="middle" class="svg-caption">锌的原子核不变</text>
        <text x="450" y="176" text-anchor="middle" class="svg-caption">铜的原子核不变</text>
        <text x="290" y="215" text-anchor="middle" class="svg-label">
          {{ stage === 0 ? '初态：Zn(s) + Cu²⁺(aq)' : '末态：Zn²⁺(aq) + Cu(s)' }}
        </text>
      </svg>
      <div class="conservation-strip">
        <template v-if="rearrangement === 'covalent'"
          ><span>H：4 → 4</span><span>O：2 → 2</span><strong>原子留下，连接改变</strong></template
        >
        <template v-else
          ><span>Zn：1 → 1</span><span>Cu：1 → 1</span><strong>总电荷：+2 → +2</strong></template
        >
      </div>
      <p class="reaction-explanation" aria-live="polite">{{ rearrangementExplanation }}</p>
    </template>

    <template v-else-if="mode === 'formula'">
      <div class="reaction-controls" role="group" aria-label="选择离子配对">
        <AppButton
          v-for="(item, index) in formulaPairs"
          :key="item.formula"
          type="secondary"
          size="small"
          :aria-pressed="formulaIndex === index"
          @click="formulaIndex = index"
        >
          {{ item.name }}
        </AppButton>
      </div>
      <div class="ion-pair">
        <div>
          <span>阳离子</span><strong>{{ pair.cation }}</strong
          ><small>每个 +{{ pair.positive }}</small>
        </div>
        <span class="pair-plus" aria-hidden="true">+</span>
        <div>
          <span>阴离子</span><strong>{{ pair.anion }}</strong
          ><small>每个 −{{ pair.negative }}</small>
        </div>
      </div>
      <div class="charge-ledger">
        <div>
          <span>{{ pair.cationCount }} 份阳离子</span
          ><strong>+{{ pair.cationCount * pair.positive }}</strong>
        </div>
        <div>
          <span>{{ pair.anionCount }} 份阴离子</span
          ><strong>−{{ pair.anionCount * pair.negative }}</strong>
        </div>
        <div class="formula-result">
          <span>总电荷 0 · 最简比</span><strong>{{ pair.formula }}</strong>
        </div>
      </div>
      <p class="reaction-explanation" aria-live="polite">{{ pair.explanation }}</p>
      <div class="composition-line">
        <span>展开数原子</span><strong>{{ pair.inventory }}</strong>
      </div>
    </template>

    <template v-else-if="mode === 'states'">
      <div class="reaction-controls" role="group" aria-label="选择状态情境">
        <AppButton
          v-for="item in stateOptions"
          :key="item.key"
          type="secondary"
          size="small"
          :aria-pressed="stateChoice === item.key"
          @click="stateChoice = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <svg
        v-if="stateChoice !== 'aqueous'"
        viewBox="0 0 580 260"
        role="img"
        :aria-label="stateDescription"
      >
        <title>{{ stateDescription }}</title>
        <path d="M 45 30 V 220 H 535 V 30" class="vessel" />
        <path v-if="stateChoice === 'liquid'" d="M 47 108 H 533 V 219 H 47 Z" class="water-fill" />
        <g v-for="(position, index) in stateParticles" :key="index" class="water-molecule">
          <line :x1="position[0]" :y1="position[1]" :x2="position[0] - 11" :y2="position[1] + 10" />
          <line :x1="position[0]" :y1="position[1]" :x2="position[0] + 11" :y2="position[1] + 10" />
          <circle :cx="position[0]" :cy="position[1]" r="9" class="oxygen-dot" />
          <circle :cx="position[0] - 11" :cy="position[1] + 10" r="5" class="hydrogen-dot" />
          <circle :cx="position[0] + 11" :cy="position[1] + 10" r="5" class="hydrogen-dot" />
        </g>
        <text x="290" y="249" text-anchor="middle" class="svg-label">{{ stateDescription }}</text>
      </svg>
      <svg
        v-else
        viewBox="0 0 580 260"
        role="img"
        aria-label="氯化钠晶体中的正负离子，溶于水后分散成为水合离子；不是水的第四种物态"
      >
        <title>NaCl(s) 溶于水成为 NaCl(aq)，离子分散，不改变原子核</title>
        <rect x="333" y="38" width="218" height="166" rx="12" class="water-fill" />
        <g v-for="(ion, index) in dissolvedIons" :key="index">
          <circle
            :cx="78 + (index % 3) * 46"
            :cy="77 + Math.floor(index / 3) * 52"
            r="20"
            :class="index % 2 ? 'chloride-ion' : 'sodium-ion'"
          />
          <text
            :x="78 + (index % 3) * 46"
            :y="82 + Math.floor(index / 3) * 52"
            text-anchor="middle"
            class="ion-label"
          >
            {{ index % 2 ? 'Cl⁻' : 'Na⁺' }}
          </text>
          <circle
            :cx="ion[0]"
            :cy="ion[1]"
            r="22"
            :class="index % 2 ? 'chloride-ion' : 'sodium-ion'"
          />
          <text :x="ion[0]" :y="ion[1] + 5" text-anchor="middle" class="ion-label">
            {{ index % 2 ? 'Cl⁻' : 'Na⁺' }}
          </text>
        </g>
        <path d="M 231 121 H 307 L 297 113 M 307 121 L 297 129" class="transfer-arrow" />
        <text x="267" y="99" text-anchor="middle" class="svg-caption">溶于水</text>
        <text x="124" y="236" text-anchor="middle" class="svg-label">NaCl(s) · 固体</text>
        <text x="443" y="236" text-anchor="middle" class="svg-label">NaCl(aq) · 水溶液</text>
      </svg>
      <p class="reaction-explanation" aria-live="polite">{{ stateExplanation }}</p>
      <div class="state-contrast">
        <strong>{{
          stateChoice === 'aqueous' ? '与熔融 NaCl(l) 区分' : '变化的是排列与运动方式'
        }}</strong
        ><span>{{
          stateChoice === 'aqueous'
            ? '水溶液中有水，熔融盐中没有水；(aq) 不是 (l) 的另一种写法。'
            : '每个水分子仍由 2 个 H 和 1 个 O 组成，图中的颜色和组成始终保留。'
        }}</span>
      </div>
    </template>

    <template v-else-if="mode === 'balance'">
      <div class="reaction-controls" role="group" aria-label="选择方程类型">
        <AppButton
          v-for="item in equationOptions"
          :key="item.key"
          type="secondary"
          size="small"
          :aria-pressed="equationKind === item.key"
          @click="setEquationKind(item.key)"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="stage-controls" role="group" aria-label="查看配平步骤">
        <AppButton
          v-for="(label, index) in equationStages"
          :key="label"
          type="secondary"
          size="small"
          :aria-pressed="stage === index"
          @click="stage = index"
          >{{ index + 1 }} · {{ label }}</AppButton
        >
      </div>
      <div class="equation-display" aria-live="polite">
        <p v-for="line in equationDisplay.lines" :key="line">{{ line }}</p>
      </div>
      <div class="ledger-scroll" role="region" aria-label="原子与电荷核对表" tabindex="0">
        <table class="balance-ledger">
          <thead>
            <tr>
              <th scope="col">核对项目</th>
              <th scope="col">左边</th>
              <th scope="col">右边</th>
              <th scope="col">结果</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in equationDisplay.checks"
              :key="row.label"
              :class="{ 'is-unbalanced': row.left !== row.right }"
            >
              <th scope="row">{{ row.label }}</th>
              <td>{{ row.left }}</td>
              <td>{{ row.right }}</td>
              <td>{{ row.left === row.right ? '一致' : '需调整' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="reaction-explanation">{{ equationDisplay.explanation }}</p>
    </template>

    <template v-else>
      <div class="equilibrium-reaction">
        <strong>N₂(g) + 3H₂(g) ⇌ 2NH₃(g)</strong><span>正反应放热 · ΔH &lt; 0</span>
      </div>
      <div class="reaction-controls" role="group" aria-label="改变一个平衡条件">
        <AppButton
          v-for="item in equilibriumOptions"
          :key="item.key"
          type="secondary"
          size="small"
          :aria-pressed="equilibriumChoice === item.key"
          @click="equilibriumChoice = item.key"
          >{{ item.label }}</AppButton
        >
      </div>
      <svg
        v-if="equilibriumChoice === 'initial' || equilibriumChoice === 'catalyst'"
        viewBox="0 0 580 260"
        role="img"
        :aria-label="
          equilibriumChoice === 'catalyst'
            ? '催化剂使正逆反应更快达到相等速率，平衡组成不变；曲线为定性示意'
            : '正反应速率降低，逆反应速率升高，最终两者相等；反应没有停止'
        "
      >
        <title>从反应物开始达到动态平衡：曲线只示意趋势，不表示实验数据</title>
        <path d="M 63 25 V 219 H 540" class="chart-axis" />
        <path
          :d="equilibriumChoice === 'catalyst' ? 'M 64 110 H 527' : 'M 64 144 H 527'"
          class="equilibrium-level"
        />
        <path
          :d="
            equilibriumChoice === 'catalyst'
              ? 'M 70 27 C 105 65 135 107 216 110 H 520'
              : 'M 70 45 C 180 85 245 140 366 144 H 520'
          "
          class="rate-forward"
        />
        <path
          :d="
            equilibriumChoice === 'catalyst'
              ? 'M 70 213 C 100 145 145 115 216 110 H 520'
              : 'M 70 213 C 180 170 245 148 366 144 H 520'
          "
          class="rate-reverse"
        />
        <text x="14" y="20" class="svg-caption">速率</text>
        <text x="510" y="244" class="svg-caption">时间</text>
        <text x="100" y="51" class="forward-label">正反应</text>
        <text x="103" y="207" class="reverse-label">逆反应</text>
        <text x="400" :y="equilibriumChoice === 'catalyst' ? 91 : 125" class="svg-label">
          v正 = v逆 ≠ 0
        </text>
      </svg>
      <div v-else class="equilibrium-shift" aria-live="polite">
        <div><span>反应物一侧</span><strong>4 份气体</strong></div>
        <div
          :class="[
            'shift-direction',
            { 'shift-direction--left': equilibriumEffect.direction === 'left' },
          ]"
        >
          <span aria-hidden="true">{{ equilibriumEffect.direction === 'left' ? '←' : '→' }}</span>
          <strong>{{ equilibriumEffect.direction === 'left' ? '向左调整' : '向右调整' }}</strong>
        </div>
        <div><span>产物一侧</span><strong>2 份气体</strong></div>
      </div>
      <div class="conservation-strip">
        <strong>{{ equilibriumEffect.result }}</strong
        ><span>{{ equilibriumEffect.rate }}</span>
      </div>
      <p class="reaction-explanation" aria-live="polite">{{ equilibriumEffect.explanation }}</p>
    </template>
    <p class="reaction-note">{{ modelNote }}</p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'

type Mode = 'rearrange' | 'formula' | 'states' | 'balance' | 'equilibrium'
type Rearrangement = 'covalent' | 'transfer'
type StateChoice = 'solid' | 'liquid' | 'gas' | 'aqueous'
type EquationKind = 'molecular' | 'ionic' | 'half'
type EquilibriumChoice = 'initial' | 'reactant' | 'product' | 'heat' | 'pressure' | 'catalyst'
interface LedgerRow {
  label: string
  left: number
  right: number
}
interface EquationView {
  lines: string[]
  checks: LedgerRow[]
  explanation: string
}
interface Atom {
  id: string
  element: 'H' | 'O'
  x: number
  y: number
}

const props = defineProps<{ topic: string }>()
const stage = ref(0)
const rearrangement = ref<Rearrangement>('covalent')
const formulaIndex = ref(0)
const stateChoice = ref<StateChoice>('solid')
const equationKind = ref<EquationKind>('molecular')
const equilibriumChoice = ref<EquilibriumChoice>('initial')
const rearrangementOptions: Array<{ key: Rearrangement; label: string }> = [
  { key: 'covalent', label: '原子连接重排' },
  { key: 'transfer', label: '电子转移' },
]
const stateOptions: Array<{ key: StateChoice; label: string }> = [
  { key: 'solid', label: '冰 · (s)' },
  { key: 'liquid', label: '液态水 · (l)' },
  { key: 'gas', label: '水蒸气 · (g)' },
  { key: 'aqueous', label: '盐水 · (aq)' },
]
const equationOptions: Array<{ key: EquationKind; label: string }> = [
  { key: 'molecular', label: '完整反应式' },
  { key: 'ionic', label: '净离子方程' },
  { key: 'half', label: '半反应方程' },
]
const equilibriumOptions: Array<{ key: EquilibriumChoice; label: string }> = [
  { key: 'initial', label: '动态平衡' },
  { key: 'reactant', label: '加入 H₂' },
  { key: 'product', label: '移走 NH₃' },
  { key: 'heat', label: '升温' },
  { key: 'pressure', label: '恒温压缩' },
  { key: 'catalyst', label: '加入催化剂' },
]
const formulaPairs = [
  {
    name: '氯化镁',
    cation: 'Mg²⁺',
    anion: 'Cl⁻',
    positive: 2,
    negative: 1,
    cationCount: 1,
    anionCount: 2,
    formula: 'MgCl₂',
    inventory: 'Mg 1 · Cl 2',
    explanation:
      '一个 Mg²⁺ 的 +2 需要两个 Cl⁻ 的 −2 抵消。下标2只属于 Cl，不表示把镁离子的电荷改了。',
  },
  {
    name: '氧化铝',
    cation: 'Al³⁺',
    anion: 'O²⁻',
    positive: 3,
    negative: 2,
    cationCount: 2,
    anionCount: 3,
    formula: 'Al₂O₃',
    inventory: 'Al 2 · O 3',
    explanation:
      '两种电荷的最小公倍数为6，用2个 Al³⁺ 配3个 O²⁻。这表示晶体中的最简组成比，不是独立分子的形状。',
  },
  {
    name: '氢氧化钙',
    cation: 'Ca²⁺',
    anion: 'OH⁻',
    positive: 2,
    negative: 1,
    cationCount: 1,
    anionCount: 2,
    formula: 'Ca(OH)₂',
    inventory: 'Ca 1 · O 2 · H 2',
    explanation:
      '需要两整组 OH⁻，所以把 OH 括起来再写2。不能写成 CaOH₂：后者只把 H 变成两个，丢掉第二个 O。',
  },
  {
    name: '碳酸铵',
    cation: 'NH₄⁺',
    anion: 'CO₃²⁻',
    positive: 1,
    negative: 2,
    cationCount: 2,
    anionCount: 1,
    formula: '(NH₄)₂CO₃',
    inventory: 'N 2 · H 8 · C 1 · O 3',
    explanation:
      '两个铵根配一个碳酸根，括号外2乘 NH₄ 中的每个下标。铵根是带 +1 电荷的整体，不要把它当成氨 NH₃。',
  },
]
const dissolvedIons: Array<[number, number]> = [
  [372, 72],
  [479, 84],
  [425, 135],
  [515, 155],
  [364, 169],
  [487, 184],
]

// 考纲叶节点决定图解类型；整章或未知入口安全回到原子重排示意。
const mode = computed<Mode>(
  () =>
    (
      ({
        '140301': 'rearrange',
        '140302': 'formula',
        '140303': 'states',
        '140304': 'balance',
        '140305': 'equilibrium',
      }) as Record<string, Mode>
    )[props.topic] ?? 'rearrange',
)

// 标题与概念正文中的本点任务一致，避免图解脱离知识点。
const heading = computed(
  () =>
    ({
      rearrange: '换一种组合，原子还在',
      formula: '用电荷凑出中性组合',
      states: '状态告诉你：物质在哪里',
      balance: '让原子与电荷同时对上',
      equilibrium: '两边都在反应，宏观组成保持不变',
    })[mode.value],
)

// 每个图解只提示当前可操作的观察任务，不把整段讲义搬入图片。
const instruction = computed(
  () =>
    ({
      rearrange: '切换反应前后，检查哪些信息保留、哪些发生变化。',
      formula: '选择一组离子，看电荷总数怎样决定最简下标。',
      states: '前三项比较水的物态；第四项单独观察氯化钠的水溶液。',
      balance: '选一种方程，按步骤核对系数、旁观离子或电子。',
      equilibrium: '以放热合成氨为例，每次只改变一个条件。',
    })[mode.value],
)

// 切换知识点时重置局部观察，防止上一点的末步骤进入新图。
watch(
  () => props.topic,
  () => {
    stage.value = 0
    rearrangement.value = 'covalent'
    formulaIndex.value = 0
    stateChoice.value = 'solid'
    equationKind.value = 'molecular'
    equilibriumChoice.value = 'initial'
  },
)

// 电子转移与共享连接使用各自的初态，切换时不沿用前一个末态。
function setRearrangement(value: Rearrangement) {
  rearrangement.value = value
  stage.value = 0
}

// 不同方程的步骤含义不同，切换后从第一步读取。
function setEquationKind(value: EquationKind) {
  equationKind.value = value
  stage.value = 0
}

// 反应前后使用相同标识的4个氢、2个氧，仅改变图中位置和连接。
const waterAtoms = computed<Atom[]>(() =>
  stage.value === 0
    ? [
        { id: 'h1', element: 'H', x: 86, y: 104 },
        { id: 'h2', element: 'H', x: 126, y: 104 },
        { id: 'h3', element: 'H', x: 228, y: 104 },
        { id: 'h4', element: 'H', x: 268, y: 104 },
        { id: 'o1', element: 'O', x: 410, y: 104 },
        { id: 'o2', element: 'O', x: 462, y: 104 },
      ]
    : [
        { id: 'h1', element: 'H', x: 125, y: 143 },
        { id: 'h2', element: 'H', x: 205, y: 143 },
        { id: 'h3', element: 'H', x: 370, y: 143 },
        { id: 'h4', element: 'H', x: 450, y: 143 },
        { id: 'o1', element: 'O', x: 165, y: 103 },
        { id: 'o2', element: 'O', x: 410, y: 103 },
      ],
)

// 双键以两条线示意，产物按水的连接关系绘制，不宣称按键角或尺度作图。
const waterBonds = computed(() =>
  stage.value === 0
    ? [
        [86, 104, 126, 104],
        [228, 104, 268, 104],
        [410, 99, 462, 99],
        [410, 109, 462, 109],
      ]
    : [
        [125, 143, 165, 103],
        [205, 143, 165, 103],
        [370, 143, 410, 103],
        [450, 143, 410, 103],
      ],
)

// 图形变化同步提供文字组成，颜色不是区分元素的唯一途径。
const waterDescription = computed(() =>
  stage.value === 0
    ? '反应前：两个氢分子、一个氧分子，总计4个氢原子和2个氧原子'
    : '反应后：两个水分子，仍有4个氢原子和2个氧原子',
)

// 电子转移用宏观粒子身份表示，不把核内质子或中子画成可转移电子。
const transferDescription = computed(() =>
  stage.value === 0
    ? '反应前是锌与铜二价离子，锌将向铜离子转移两个电子'
    : '反应后是锌二价离子与铜，原子核身份不变，总电荷仍为正二',
)

// 解释当前图所支持的结论，不将所有化学反应都归为电子转移。
const rearrangementExplanation = computed(() =>
  rearrangement.value === 'covalent'
    ? 'H—H、O=O 的连接改变，形成 O—H 连接。分子总个数可以变化，但每一种元素的原子个数不变；这里的线表示共价连接，不是电子的运动轨迹。'
    : 'Zn 失去2个电子成为 Zn²⁺，Cu²⁺ 得到2个电子成为 Cu。两种元素的原子核均未改变；只观察这个反应的粒子时，总电荷前后同为 +2。',
)

// 电荷配比全部来自已核对的常见离子，避免任意组合产生无意义化学式。
const pair = computed(() => formulaPairs[formulaIndex.value] ?? formulaPairs[0]!)

// 保持三态中水分子数量与内部组成一致，只改变相对分布的定性示意。
const stateParticles = computed<Array<[number, number]>>(() => {
  if (stateChoice.value === 'solid')
    return Array.from({ length: 12 }, (_, i) => [195 + (i % 4) * 47, 77 + Math.floor(i / 4) * 44])
  if (stateChoice.value === 'liquid')
    return [
      [98, 145],
      [155, 175],
      [214, 132],
      [273, 176],
      [333, 135],
      [392, 180],
      [464, 140],
      [115, 195],
      [221, 197],
      [293, 129],
      [365, 199],
      [480, 199],
    ]
  return [
    [91, 58],
    [217, 69],
    [352, 49],
    [484, 68],
    [148, 118],
    [283, 123],
    [425, 127],
    [80, 177],
    [207, 197],
    [337, 188],
    [488, 194],
    [372, 102],
  ]
})

// 水溶液另用盐作为溶质例子，避免让学生误认为(aq)是水的第四种物态。
const stateDescription = computed(
  () =>
    ({
      solid: 'H₂O(s) · 水分子组成不变，排列有序',
      liquid: 'H₂O(l) · 水分子彼此接近，可相互移动',
      gas: 'H₂O(g) · 水分子间距较大，分散在容器中',
      aqueous: 'NaCl(aq) · 氯化钠溶于水，离子分散',
    })[stateChoice.value],
)

// 状态解释把粒子图连接到过滤、电解或气量计算的条件。
const stateExplanation = computed(
  () =>
    ({
      solid: '冰是固态水，写 H₂O(s)。图中只简化表示有序排列，并不是冰晶体的真实晶格或氢键结构。',
      liquid:
        '液态水写 H₂O(l)。这些分子仍是水，熔化不生成另一种化合物；(l)并不表示“任何溶于水的物质”。',
      gas: '水蒸气写 H₂O(g)。高温反应后若仍以气态测量，需要把水蒸气计入气体总量；冷却时必须重新检查状态。',
      aqueous:
        'NaCl(aq) 表示氯化钠水溶液。Na⁺、Cl⁻ 分散在水中并被水分子包围；为突出溶质，本图省略水分子与水合结构。溶解不改变元素的原子核。',
    })[stateChoice.value],
)

// 方程类型决定步骤标签，使“拆离子”与“补电子”不混用。
const equationStages = computed(
  () =>
    ({
      molecular: ['先写物质', '只改系数', '逐项核对'],
      ionic: ['完整式', '拆成离子', '删旁观离子'],
      half: ['先写粒子', '补电子', '相加抵消'],
    })[equationKind.value],
)

// 每个步骤同时派生方程和守恒表；不允许出现式子已变但核对数字仍旧的状态。
const equationDisplay = computed<EquationView>(() => {
  if (equationKind.value === 'molecular')
    return {
      lines: [stage.value === 0 ? 'H₂ + O₂ → H₂O' : '2H₂ + O₂ → 2H₂O'],
      checks: [
        { label: 'H 原子', left: stage.value === 0 ? 2 : 4, right: stage.value === 0 ? 2 : 4 },
        { label: 'O 原子', left: 2, right: stage.value === 0 ? 1 : 2 },
        { label: '总电荷', left: 0, right: 0 },
      ],
      explanation:
        stage.value === 0
          ? '物质身份正确，但氧原子还没配平。不要把 H₂O 改成 H₂O₂，那会把水换成过氧化氢。'
          : '给 H₂O 乘2后，右边变成4个H、2个O，因此左边 H₂ 也乘2。系数作用于整个式子，最后得到最简整数比2:1:2。',
    }
  if (equationKind.value === 'ionic')
    return {
      lines:
        stage.value === 0
          ? ['AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)']
          : stage.value === 1
            ? ['Ag⁺(aq) + NO₃⁻(aq) + Na⁺(aq) + Cl⁻(aq)', '→ AgCl(s) + Na⁺(aq) + NO₃⁻(aq)']
            : ['Ag⁺(aq) + Cl⁻(aq) → AgCl(s)'],
      checks: [
        { label: 'Ag 原子', left: 1, right: 1 },
        { label: 'Cl 原子', left: 1, right: 1 },
        ...(stage.value < 2
          ? [
              { label: 'Na 原子', left: 1, right: 1 },
              { label: 'N 原子', left: 1, right: 1 },
              { label: 'O 原子', left: 3, right: 3 },
            ]
          : []),
        { label: '总电荷', left: 0, right: 0 },
      ],
      explanation:
        stage.value === 0
          ? '先写完整反应式。AgCl 是沉淀，保留(s)；其他所列盐在水中可作为离子处理。'
          : stage.value === 1
            ? 'Na⁺ 和 NO₃⁻ 在左右完全相同，是旁观离子。AgCl(s) 不拆成游离离子，否则会抹掉沉淀这一变化。'
            : '抵消旁观离子后只留下成沉淀的变化。左边 +1 与 −1 相抵，右边固体为中性，原子与净电荷都守恒。',
    }
  return {
    lines:
      stage.value === 0
        ? ['Zn → Zn²⁺', 'Cu²⁺ → Cu']
        : stage.value === 1
          ? ['Zn → Zn²⁺ + 2e⁻', 'Cu²⁺ + 2e⁻ → Cu']
          : ['Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)'],
    checks:
      stage.value < 2
        ? [
            { label: 'Zn 半方程总电荷', left: 0, right: stage.value === 0 ? 2 : 0 },
            { label: 'Cu 半方程总电荷', left: stage.value === 0 ? 2 : 0, right: 0 },
          ]
        : [
            { label: 'Zn 原子', left: 1, right: 1 },
            { label: 'Cu 原子', left: 1, right: 1 },
            { label: '总电荷', left: 2, right: 2 },
          ],
    explanation:
      stage.value === 0
        ? '两行中的原子个数都相同，但电荷没对上。半方程需要明确电子在左边还是右边。'
        : stage.value === 1
          ? '锌失电子，把2e⁻写右边；铜离子得电子，把2e⁻写左边。各自电荷平衡，转移电子数也相等。'
          : '相加后两边的2e⁻抵消。这里可直接抵消是因为电子数恰好相同；不同半方程若电子数不同，必须先整体乘系数。',
  }
})

// 平衡影响来自同一放热、气体体积减小的反应，压强条件明确限定恒温压缩。
const equilibriumEffect = computed(
  () =>
    ({
      initial: {
        direction: 'none',
        result: '速率相等，组成恒定',
        rate: '不代表浓度相等或反应停止',
        explanation:
          '从反应物开始，正反应先较快；产物积累后逆反应增强。最后两种速率相等且非零，达到动态平衡。曲线只是这一路径的定性说明。',
      },
      reactant: {
        direction: 'right',
        result: '氨的平衡量倾向增加',
        rate: '调整过程中正反应快于逆反应',
        explanation:
          '恒温、定容加入 H₂，氢气浓度增大，体系向消耗 H₂、生成 NH₃ 的方向调整。到达新的平衡后，正逆速率重新相等；加入物不会保证被全部用完。',
      },
      product: {
        direction: 'right',
        result: '体系倾向补充被移走的氨',
        rate: '调整后重新达到正逆速率相等',
        explanation:
          '恒温、定容移走部分 NH₃，产物浓度下降，平衡向右调整。这里说的是补充趋势，不能断言最终氨的绝对量比移走之前更多。',
      },
      heat: {
        direction: 'left',
        result: '氨的平衡产率降低',
        rate: '升温通常加速反应，但快不等于产率高',
        explanation:
          '合成氨正向放热，因此逆向吸热。升温时平衡有利于吸热方向，更多氨分解；不能用“温度越高反应越快”替代产率判断。',
      },
      pressure: {
        direction: 'right',
        result: '氨的平衡产率提高',
        rate: '只比较气体的系数总和',
        explanation:
          '恒温压缩容器提高压强，体系向气体总物质的量较少的一侧调整。左边1+3=4，右边2；这条判断不直接适用于定容加入惰性气体。',
      },
      catalyst: {
        direction: 'none',
        result: '平衡组成不变',
        rate: '到达平衡更快，正逆过程均被加速',
        explanation:
          '催化剂同时加速正逆过程，不改变同样温度等条件下的平衡位置。图中更早达到相等速率，平衡时两个方向的反应也都更快；这些高度只示意趋势，不表示测量数值。',
      },
    })[equilibriumChoice.value],
)

// 图解均为概念示意，主动交代尺度、气体计量和真实化学结构的适用边界。
const modelNote = computed(
  () =>
    ({
      rearrange: '颜色与元素字母共同标记原子；连接和位置不按真实键角、距离或反应机理绘制。',
      formula: '离子配比表示电中性的最简组成，不表示离子晶体中存在独立小分子。',
      states: '粒子大小、间距与容器均不按比例；水三态和盐的水溶液是两个不同的教学情境。',
      balance: '表内数字用于核对原子或净电荷，不表示实际实验取样量。',
      equilibrium: '只展示定性趋势，不给出实验测量值或真实产率；平衡方向须以题给条件为准。',
    })[mode.value],
)
</script>

<style scoped lang="scss">
.reaction-atlas {
  --atlas-blue: var(--color-learning-blue, #2454cf);
  --atlas-blue-soft: var(--color-learning-blue-soft, #eef4ff);
  --atlas-teal: var(--color-learning-teal, #087e82);
  margin: 0;
  padding: clamp(18px, 3vw, 28px);
  border: 1px solid var(--color-border, #dce4ed);
  border-radius: 18px;
  background: linear-gradient(145deg, #f5f9ff, #fff 75%);
  color: var(--color-ink, #172334);
  min-width: 0;
}
.reaction-eyebrow {
  color: var(--atlas-blue);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}
figcaption h5 {
  margin: 12px 0 8px;
  font-size: 20px;
  line-height: 1.45;
}
figcaption p,
.reaction-explanation {
  margin: 0;
  font-size: 14px;
  line-height: 1.8;
}
.reaction-controls,
.stage-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0 10px;
}
.stage-controls {
  margin-top: 12px;
}
.reaction-controls :deep(.app-button),
.stage-controls :deep(.app-button) {
  --app-button-bg: #fff;
  --app-button-border: #c7d8f4;
  --app-button-color: var(--atlas-blue);
  --app-button-hover-bg: #f1f6ff;
  --app-button-hover-border: #90afe6;
  --app-button-active-bg: #e3edff;
  --app-button-active-border: var(--atlas-blue);
  margin-left: 0;
}
.reaction-controls :deep(.app-button[aria-pressed='true']),
.stage-controls :deep(.app-button[aria-pressed='true']) {
  --app-button-bg: var(--atlas-blue-soft);
  --app-button-border: #9bb9ef;
  --app-button-color: var(--atlas-blue);
  --app-button-hover-bg: #e3edff;
  --app-button-hover-border: var(--atlas-blue);
  --app-button-active-bg: #e3edff;
  --app-button-active-border: var(--atlas-blue);
}
svg {
  display: block;
  width: 100%;
  max-height: 280px;
  overflow: visible;
  margin: 12px 0;
}
svg text {
  font-family: inherit;
}
.bond-lines {
  stroke: #7b8b9c;
  stroke-width: 5;
}
.atom text {
  font-weight: 700;
  font-size: 18px;
  fill: #153c68;
}
.atom--oxygen circle {
  fill: #fde5de;
  stroke: #bb583b;
  stroke-width: 2;
}
.atom--hydrogen circle {
  fill: #e0edff;
  stroke: #4c78b9;
  stroke-width: 2;
}
.zinc-disc {
  fill: #e3ecff;
  stroke: #6383b7;
  stroke-width: 2;
}
.copper-disc {
  fill: #e3f4ef;
  stroke: #47917b;
  stroke-width: 2;
}
.species-label {
  fill: #17335b;
  font-size: 27px;
  font-weight: 700;
}
.svg-caption {
  fill: #56677c;
  font-size: 13px;
}
.svg-label {
  fill: #203b5c;
  font-size: 15px;
  font-weight: 600;
}
.transfer-arrow {
  fill: none;
  stroke: var(--atlas-blue);
  stroke-width: 3;
}
.conservation-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 22px;
  padding: 12px 16px;
  margin: 8px 0 14px;
  background: var(--atlas-blue-soft);
  border-left: 3px solid var(--atlas-blue);
  font-size: 14px;
  line-height: 1.65;
}
.conservation-strip strong {
  color: var(--atlas-blue);
}
.ion-pair {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 24px 10px;
  gap: 20px;
}
.ion-pair > div {
  display: grid;
  justify-items: center;
  gap: 7px;
}
.ion-pair strong {
  font-size: clamp(25px, 4vw, 34px);
  color: var(--atlas-blue);
}
.ion-pair span,
.ion-pair small {
  font-size: 13px;
  color: #53677e;
}
.ion-pair .pair-plus {
  font-size: 26px;
}
.charge-ledger {
  display: grid;
  grid-template-columns: 1fr 1fr 1.3fr;
  background: var(--atlas-blue-soft);
  padding: 15px 10px;
  margin-bottom: 16px;
  border-radius: 10px;
}
.charge-ledger > div {
  display: grid;
  gap: 8px;
  align-content: center;
  text-align: center;
}
.charge-ledger span {
  font-size: 12px;
  color: #48617e;
}
.charge-ledger strong {
  font-size: 22px;
}
.formula-result {
  border-left: 1px solid #c7d7ed;
}
.composition-line {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 15px;
  font-size: 14px;
}
.composition-line span {
  color: #61738a;
}
.vessel {
  stroke: #8ca3b9;
  stroke-width: 2;
  fill: none;
}
.water-fill {
  fill: #e7f2fc;
}
.water-molecule line {
  stroke: #64809c;
  stroke-width: 2;
}
.oxygen-dot {
  fill: #e39b88;
  stroke: #8b4f3c;
}
.hydrogen-dot {
  fill: #d8e9fd;
  stroke: #597a9e;
}
.sodium-ion {
  fill: #e0eaff;
  stroke: #5777ad;
  stroke-width: 1.5;
}
.chloride-ion {
  fill: #e3f3ec;
  stroke: #3f836c;
  stroke-width: 1.5;
}
.ion-label {
  font-size: 13px;
  font-weight: 600;
  fill: #263d56;
}
.state-contrast {
  display: grid;
  gap: 6px;
  border-top: 1px solid #dbe4f0;
  padding-top: 12px;
  margin-top: 16px;
  font-size: 13px;
  line-height: 1.7;
}
.state-contrast strong {
  color: var(--atlas-blue);
}
.equation-display {
  margin: 20px 0;
  padding: 16px 10px;
  background: #edf4ff;
  border-radius: 10px;
  text-align: center;
  overflow-wrap: anywhere;
  font-size: clamp(16px, 2vw, 20px);
  font-weight: 600;
  line-height: 1.85;
}
.equation-display p {
  margin: 0;
}
.ledger-scroll {
  overflow-x: auto;
  margin-bottom: 16px;
}
.balance-ledger {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: center;
}
.balance-ledger th,
.balance-ledger td {
  padding: 9px 10px;
  border-bottom: 1px solid #dce5f0;
  white-space: nowrap;
}
.balance-ledger th:first-child {
  text-align: left;
}
.balance-ledger thead {
  color: #536a82;
}
.balance-ledger .is-unbalanced {
  color: #a83f26;
  background: #fff3ed;
}
.equilibrium-reaction {
  display: grid;
  gap: 8px;
  margin: 20px 0;
}
.equilibrium-reaction strong {
  font-size: 21px;
  color: var(--atlas-blue);
}
.equilibrium-reaction span {
  font-size: 13px;
  color: #5f7188;
}
.chart-axis {
  fill: none;
  stroke: #7a8ea5;
  stroke-width: 2;
}
.equilibrium-level {
  fill: none;
  stroke: #bac9d9;
  stroke-width: 1;
  stroke-dasharray: 5 5;
}
.rate-forward,
.rate-reverse {
  fill: none;
  stroke-width: 3;
}
.rate-forward {
  stroke: #315cbb;
}
.rate-reverse {
  stroke: #087e82;
  stroke-dasharray: 7 4;
}
.forward-label {
  fill: #315cbb;
  font-size: 14px;
}
.reverse-label {
  fill: #087e82;
  font-size: 14px;
}
.equilibrium-shift {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 18px;
  min-height: 175px;
  text-align: center;
}
.equilibrium-shift > div {
  display: grid;
  gap: 8px;
}
.equilibrium-shift span {
  color: #61728b;
  font-size: 14px;
}
.equilibrium-shift .shift-direction span {
  color: var(--atlas-blue);
  font-size: 58px;
  line-height: 1;
}
.shift-direction strong {
  color: var(--atlas-blue);
  font-size: 14px;
}
.equilibrium-shift .shift-direction--left span,
.shift-direction--left strong {
  color: #a65b22;
}
.reaction-note {
  margin: 18px 0 0;
  padding-top: 12px;
  border-top: 1px solid #e0e7f0;
  font-size: 12px;
  line-height: 1.7;
  color: #627287;
}
@media (max-width: 600px) {
  figcaption h5 {
    font-size: 18px;
  }
  .charge-ledger {
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .charge-ledger .formula-result {
    grid-column: 1 / -1;
    border-left: 0;
    border-top: 1px solid #c7d7ed;
    padding-top: 12px;
  }
  .equilibrium-shift {
    gap: 10px;
  }
  .equilibrium-reaction strong {
    font-size: 18px;
  }
}
</style>
