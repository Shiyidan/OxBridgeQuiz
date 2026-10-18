<!-- ESAT 第五章互动图解：在学习讲义中联动氧去向、电子配对、氧化态及氧化还原角色。 -->
<template>
  <figure class="redox-atlas" :aria-label="heading">
    <figcaption>
      <span class="atlas-eyebrow">CHEMISTRY · 氧化与还原</span>
      <h5>{{ heading }}</h5>
      <p>{{ instruction }}</p>
    </figcaption>

    <template v-if="mode === 'oxygen'">
      <div class="atlas-controls" role="group" aria-label="选择氧的变化情境">
        <AppButton
          v-for="(label, index) in ['氧转移', '分解反例']"
          :key="label"
          type="secondary"
          size="small"
          :aria-pressed="oxygenIndex === index"
          @click="setOxygen(index)"
          >{{ label }}</AppButton
        >
      </div>
      <template v-if="oxygenIndex === 0">
        <div class="equation"><LatexText :text="oxygenEquation" /></div>
        <div class="atlas-controls" role="group" aria-label="观察反应前后">
          <AppButton
            type="secondary"
            size="small"
            :aria-pressed="oxygenStage === 0"
            @click="oxygenStage = 0"
            >反应前</AppButton
          >
          <AppButton
            type="secondary"
            size="small"
            :aria-pressed="oxygenStage === 1"
            @click="oxygenStage = 1"
            >反应后</AppButton
          >
        </div>
        <svg
          viewBox="0 0 620 220"
          role="img"
          :aria-label="oxygenStage === 0 ? '氧与铜结合，氢为氢气' : '氧从铜转到氢，铜析出，生成水'"
        >
          <title>氧的去向示意，非晶格或分子真实比例</title>
          <path d="M220 58 Q310 8 400 58" class="flow-line" />
          <path d="m389 47 11 11-15 2" class="flow-line" />
          <text x="310" y="28" text-anchor="middle" class="svg-muted">跟踪同一个 O</text>
          <line v-if="oxygenStage === 0" x1="130" y1="105" x2="190" y2="105" class="bond" />
          <line v-if="oxygenStage === 0" x1="420" y1="105" x2="467" y2="105" class="bond" />
          <template v-else>
            <line x1="432" y1="103" x2="396" y2="133" class="bond" />
            <line x1="432" y1="103" x2="469" y2="133" class="bond" />
          </template>
          <circle cx="130" cy="105" r="31" class="atom-copper" />
          <text x="130" y="112" text-anchor="middle" class="atom-label">Cu</text>
          <circle :cx="oxygenStage === 0 ? 190 : 432" cy="105" r="27" class="atom-oxygen" />
          <text :x="oxygenStage === 0 ? 190 : 432" y="112" text-anchor="middle" class="atom-label">
            O
          </text>
          <circle
            :cx="oxygenStage === 0 ? 420 : 396"
            :cy="oxygenStage === 0 ? 105 : 133"
            r="20"
            class="atom-hydrogen"
          />
          <circle
            :cx="oxygenStage === 0 ? 467 : 469"
            :cy="oxygenStage === 0 ? 105 : 133"
            r="20"
            class="atom-hydrogen"
          />
          <text
            :x="oxygenStage === 0 ? 420 : 396"
            :y="oxygenStage === 0 ? 111 : 139"
            text-anchor="middle"
            class="atom-label"
          >
            H
          </text>
          <text
            :x="oxygenStage === 0 ? 467 : 469"
            :y="oxygenStage === 0 ? 111 : 139"
            text-anchor="middle"
            class="atom-label"
          >
            H
          </text>
          <text x="150" y="192" text-anchor="middle" class="svg-label">
            {{ oxygenStage === 0 ? 'CuO：铜的氧化物' : 'CuO 失氧 → 被还原' }}
          </text>
          <text x="440" y="192" text-anchor="middle" class="svg-label">
            {{ oxygenStage === 0 ? 'H₂：氢气' : 'H₂ 得氧 → 被氧化' }}
          </text>
        </svg>
        <p class="atlas-insight" aria-live="polite">
          {{
            oxygenStage === 0
              ? '先选定氧化铜与氢气两个观察对象，再看氧转到了哪里。'
              : 'Cu：+2 → 0，降低；H：0 → +1，升高。氧转移与价态判断相互印证。'
          }}
        </p>
      </template>
      <template v-else>
        <div class="equation"><LatexText :text="carbonateEquation" /></div>
        <div class="state-ledger">
          <div><span>Ca</span><strong>+2 → +2</strong></div>
          <div><span>C</span><strong>+4 → +4</strong></div>
          <div><span>O</span><strong>−2 → −2</strong></div>
        </div>
        <p class="atlas-insight">
          氧分配到了两种产物，所有元素的氧化态都没有变化。这是分解，不能把 CaO
          中的氧较少解释成钙被还原。
        </p>
      </template>
    </template>

    <template v-else-if="mode === 'electrons'">
      <div class="atlas-controls" role="group" aria-label="选择电子配对">
        <AppButton
          v-for="(item, index) in transfers"
          :key="item.name"
          type="secondary"
          size="small"
          :aria-pressed="transferIndex === index"
          @click="setTransfer(index)"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="atlas-controls" role="group" aria-label="电子守恒的推导步骤">
        <AppButton
          v-for="(label, index) in ['各写一份', '配对电子', '合并方程']"
          :key="label"
          type="secondary"
          size="small"
          :aria-pressed="transferStage === index"
          @click="transferStage = index"
          >{{ index + 1 }} · {{ label }}</AppButton
        >
      </div>
      <div class="half-reactions">
        <div class="half-row">
          <span class="process-label">氧化 · 失电子</span>
          <LatexText :text="transferStage === 0 ? transfer.oxidation : transfer.scaledOxidation" />
          <strong>{{ transferStage === 0 ? transfer.loss : transfer.total }} e⁻</strong>
        </div>
        <div class="electron-bridge" aria-hidden="true">
          <span>↓</span
          ><span>{{ transferStage === 0 ? '先不要直接相加' : '同一笔电子，数量相等' }}</span>
        </div>
        <div class="half-row">
          <span class="process-label process-label--gain">还原 · 得电子</span>
          <LatexText :text="transferStage === 0 ? transfer.reduction : transfer.scaledReduction" />
          <strong>{{ transferStage === 0 ? transfer.gain : transfer.total }} e⁻</strong>
        </div>
      </div>
      <div v-if="transferStage === 2" class="equation" aria-live="polite">
        <LatexText :text="transfer.overall" />
      </div>
      <p class="atlas-insight" aria-live="polite">
        {{
          transferStage === 0
            ? transfer.unbalancedNote
            : transferStage === 1
              ? transfer.balanceNote
              : '两边电子抵消，得到总方程；原子数与总电荷仍需同时核对。'
        }}
      </p>
    </template>

    <template v-else-if="mode === 'states'">
      <div class="atlas-controls" role="group" aria-label="选择氧化态示例">
        <AppButton
          v-for="(item, index) in stateExamples"
          :key="item.name"
          type="secondary"
          size="small"
          :aria-pressed="stateIndex === index"
          @click="setState(index)"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="oxidation-workspace">
        <div class="state-formula">
          <LatexText :text="stateExample.formula" /><span>求 {{ stateExample.target }}</span>
        </div>
        <div class="state-working">
          <span class="small-label">各原子氧化态总和 = 整个粒子的电荷</span>
          <LatexText :text="stateExample.sum" />
          <div class="sum-parts">
            <span>已知部分 {{ stateExample.known }}</span
            ><span>总电荷 {{ stateExample.charge }}</span>
          </div>
        </div>
      </div>
      <AppButton
        type="secondary"
        size="small"
        :aria-expanded="stateRevealed"
        @click="stateRevealed = !stateRevealed"
        >{{ stateRevealed ? '收起结果' : '看求和结果' }}</AppButton
      >
      <div v-if="stateRevealed" class="result-line" aria-live="polite">
        <strong>{{ stateExample.result }}</strong>
        <p>{{ stateExample.note }}</p>
      </div>
    </template>

    <template v-else-if="mode === 'classify'">
      <div class="atlas-controls" role="group" aria-label="选择待分类的方程">
        <AppButton
          v-for="(item, index) in classifications"
          :key="item.name"
          type="secondary"
          size="small"
          :aria-pressed="classificationIndex === index"
          @click="setClassification(index)"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="equation"><LatexText :text="classification.equation" /></div>
      <div class="state-ledger">
        <div v-for="change in classification.changes" :key="change">
          <span>前后比较</span><strong>{{ change }}</strong>
        </div>
      </div>
      <AppButton
        type="secondary"
        size="small"
        :aria-expanded="classificationRevealed"
        @click="classificationRevealed = !classificationRevealed"
        >{{ classificationRevealed ? '收起判定' : '检查属于哪一类' }}</AppButton
      >
      <div v-if="classificationRevealed" class="result-line" aria-live="polite">
        <strong>{{ classification.result }}</strong>
        <p>{{ classification.note }}</p>
      </div>
      <div class="classification-key">
        <span>只氧化</span><span>只还原</span><span>完整 redox</span><span>无氧化还原</span>
      </div>
    </template>

    <template v-else-if="mode === 'split'">
      <div class="atlas-controls" role="group" aria-label="比较同元素的氧化态路径">
        <AppButton
          v-for="(item, index) in splits"
          :key="item.name"
          type="secondary"
          size="small"
          :aria-pressed="splitIndex === index"
          @click="splitIndex = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="equation"><LatexText :text="split.equation" /></div>
      <svg v-if="splitIndex < 3" viewBox="0 0 620 235" role="img" :aria-label="split.accessible">
        <title>{{ split.accessible }}</title>
        <path d="M240 116 408 55 M395 50 408 55 402 68" class="oxidation-path" />
        <path d="M240 116 408 178 M395 182 408 178 402 165" class="reduction-path" />
        <rect x="34" y="76" width="188" height="80" rx="12" class="source-box" />
        <text x="128" y="107" text-anchor="middle" class="svg-label">{{ split.startSpecies }}</text>
        <text x="128" y="137" text-anchor="middle" class="svg-value">{{ split.startState }}</text>
        <text x="487" y="43" text-anchor="middle" class="svg-label">{{ split.highSpecies }}</text>
        <text x="487" y="73" text-anchor="middle" class="svg-value">{{ split.highState }}</text>
        <text x="487" y="171" text-anchor="middle" class="svg-label">{{ split.lowSpecies }}</text>
        <text x="487" y="201" text-anchor="middle" class="svg-value">{{ split.lowState }}</text>
        <text x="305" y="61" text-anchor="middle" class="svg-muted">氧化 · 升</text>
        <text x="305" y="187" text-anchor="middle" class="svg-muted">还原 · 降</text>
      </svg>
      <svg
        v-else
        viewBox="0 0 620 235"
        role="img"
        aria-label="碳的0与+4两种起始氧化态汇合到CO中的+2，这不是歧化"
      >
        <title>两个不同起点汇合，不是同一起点分叉</title>
        <text x="130" y="58" text-anchor="middle" class="svg-label">CO₂ 中 C：+4</text>
        <text x="130" y="190" text-anchor="middle" class="svg-label">单质 C：0</text>
        <path d="M240 53 410 112 M397 116 410 112 404 99" class="reduction-path" />
        <path d="M240 185 410 124 M397 120 410 124 404 137" class="oxidation-path" />
        <text x="495" y="112" text-anchor="middle" class="svg-label">CO 中 C</text>
        <text x="495" y="144" text-anchor="middle" class="svg-value">+2</text>
      </svg>
      <p class="atlas-insight" aria-live="polite">{{ split.note }}</p>
      <div class="balance-strip">{{ split.balance }}</div>
    </template>

    <template v-else>
      <div class="atlas-controls" role="group" aria-label="选择氧化还原角色情境">
        <AppButton
          v-for="(item, index) in agents"
          :key="item.name"
          type="secondary"
          size="small"
          :aria-pressed="agentIndex === index"
          @click="agentIndex = index"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="equation"><LatexText :text="agent.equation" /></div>
      <div class="atlas-controls" role="group" aria-label="聚焦电子供体或受体">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="agentFocus === 'donor'"
          @click="agentFocus = 'donor'"
          >谁给电子？</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="agentFocus === 'acceptor'"
          @click="agentFocus = 'acceptor'"
          >谁收电子？</AppButton
        >
      </div>
      <div class="agent-map">
        <div :class="['agent-side', { 'is-focused': agentFocus === 'donor' }]">
          <span>反应物 · 电子供体</span><strong>{{ agent.donor }}</strong>
          <span>{{ agent.donorChange }}</span
          ><b>还原剂 · 自己被氧化</b>
        </div>
        <div class="agent-arrow" aria-hidden="true">
          <span>{{ agent.electrons }}e⁻</span><strong>→</strong>
        </div>
        <div :class="['agent-side', { 'is-focused': agentFocus === 'acceptor' }]">
          <span>反应物 · 电子受体</span><strong>{{ agent.acceptor }}</strong>
          <span>{{ agent.acceptorChange }}</span
          ><b>氧化剂 · 自己被还原</b>
        </div>
      </div>
      <p class="atlas-insight" aria-live="polite">
        {{ agentFocus === 'donor' ? agent.donorNote : agent.acceptorNote }}
      </p>
    </template>
    <p class="atlas-footnote">
      教学示意用于追踪原子与电子账目；粒子位置、连线和箭头不表示真实比例、晶格结构或反应机理。
    </p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
type RedoxMode = 'oxygen' | 'electrons' | 'states' | 'classify' | 'split' | 'agents'
const modeByTopic: Record<string, RedoxMode> = {
  '140501': 'oxygen',
  '140502': 'electrons',
  '140503': 'states',
  '140504': 'classify',
  '140505': 'split',
  '140506': 'agents',
}
// 章级概览回退到氧转移，叶子节点显示各自的推理图。
const mode = computed(() => modeByTopic[props.topic] ?? 'oxygen')
const headings = {
  oxygen: '跟着氧走，再用价态确认',
  electrons: '两边的电子，必须对得上',
  states: '先列总和，再求氧化态',
  classify: '方程有四类，不靠外观猜',
  split: '一个起点，分出升与降',
  agents: '名字说别人，变化看自己',
}
const instructions = {
  oxygen: '切换反应前后，观察氧的位置；再对比分解反例。',
  electrons: '从两条半反应出发，先配电子，再合并。',
  states: '选择普通物种或例外，检查总和右边应写什么。',
  classify: '先看元素怎样变化，再展开分类依据。',
  split: '把同一种元素的起点和终点连起来，检查是不是歧化。',
  agents: '选择反应，再分别聚焦电子供体与受体。',
}
// 标题与提示随考点变化，不向可见标题注入公式标记。
const heading = computed(() => headings[mode.value])
// 每种图解用独立操作提示，帮助学生直接开始观察。
const instruction = computed(() => instructions[mode.value])

const oxygenIndex = ref(0)
const oxygenStage = ref(0)
const oxygenEquation = '\\(\\mathrm{CuO+H_2\\rightarrow Cu+H_2O}\\)'
const carbonateEquation = '\\(\\mathrm{CaCO_3\\rightarrow CaO+CO_2}\\)'
const transferIndex = ref(0)
const transferStage = ref(0)
const transfers = [
  {
    name: '锌与银离子',
    loss: 2,
    gain: 1,
    total: 2,
    oxidation: '\\(\\mathrm{Zn\\rightarrow Zn^{2+}}+2e^-\\)',
    reduction: '\\(\\mathrm{Ag^+}+e^-\\rightarrow\\mathrm{Ag}\\)',
    scaledOxidation: '\\(\\mathrm{Zn\\rightarrow Zn^{2+}}+2e^-\\)',
    scaledReduction: '\\(2\\mathrm{Ag^+}+2e^-\\rightarrow2\\mathrm{Ag}\\)',
    overall: '\\(\\mathrm{Zn+2Ag^+\\rightarrow Zn^{2+}+2Ag}\\)',
    unbalancedNote: '一份 Zn 失 2e⁻，一份 Ag⁺ 只得 1e⁻；两条各一份直接相加，电子无法抵消。',
    balanceNote: '把银的整条还原半反应乘 2：两份 Ag⁺ 得到锌给出的 2e⁻。',
  },
  {
    name: '铝与铜离子',
    loss: 3,
    gain: 2,
    total: 6,
    oxidation: '\\(\\mathrm{Al\\rightarrow Al^{3+}}+3e^-\\)',
    reduction: '\\(\\mathrm{Cu^{2+}}+2e^-\\rightarrow\\mathrm{Cu}\\)',
    scaledOxidation: '\\(2\\mathrm{Al}\\rightarrow2\\mathrm{Al^{3+}}+6e^-\\)',
    scaledReduction: '\\(3\\mathrm{Cu^{2+}}+6e^-\\rightarrow3\\mathrm{Cu}\\)',
    overall: '\\(\\mathrm{2Al+3Cu^{2+}\\rightarrow2Al^{3+}+3Cu}\\)',
    unbalancedNote: '每个 Al 失 3e⁻，每个 Cu²⁺ 得 2e⁻；先找 3 与 2 的最小公倍数。',
    balanceNote:
      '统一到 6e⁻：氧化半反应乘 2，还原半反应乘 3。这里检查计量关系，不预测表面氧化膜造成的实际反应速率。',
  },
]
// 当前半反应组始终来自已核对的固定教学反应。
const transfer = computed(() => transfers[transferIndex.value]!)

const stateIndex = ref(0)
const stateRevealed = ref(false)
const stateExamples = [
  {
    name: 'SO₄²⁻',
    formula: '\\(\\mathrm{SO_4^{2-}}\\)',
    target: 'S',
    sum: '\\(x+4(-2)=-2\\)',
    known: '4 × (−2) = −8',
    charge: '−2',
    result: 'S = +6',
    note: '总和要等于离子电荷 −2；写成 0 会多算两单位。',
  },
  {
    name: 'NH₄⁺',
    formula: '\\(\\mathrm{NH_4^+}\\)',
    target: 'N',
    sum: '\\(x+4(+1)=+1\\)',
    known: '4 × (+1) = +4',
    charge: '+1',
    result: 'N = −3',
    note: '整个离子带正电，不代表其中每一种原子的氧化态都为正。',
  },
  {
    name: 'H₂O₂',
    formula: '\\(\\mathrm{H_2O_2}\\)',
    target: 'O',
    sum: '\\(2(+1)+2x=0\\)',
    known: '2 × (+1) = +2',
    charge: '0',
    result: '每个 O = −1',
    note: '这是过氧化物；不能把普通氧化物中 O 为 −2 的规则直接套进来。',
  },
  {
    name: 'NaH',
    formula: '\\(\\mathrm{NaH}\\)',
    target: 'H',
    sum: '\\((+1)+x=0\\)',
    known: 'Na：+1',
    charge: '0',
    result: 'H = −1',
    note: '金属氢化物中，氢可以为 −1；H₂ 单质仍为 0。',
  },
  {
    name: 'OF₂',
    formula: '\\(\\mathrm{OF_2}\\)',
    target: 'O',
    sum: '\\(x+2(-1)=0\\)',
    known: '2 × (−1) = −2',
    charge: '0',
    result: 'O = +2',
    note: 'F 在化合物中为 −1，这里必须让 O 为正才能满足总和。',
  },
  {
    name: 'S₄O₆²⁻',
    formula: '\\(\\mathrm{S_4O_6^{2-}}\\)',
    target: '四个 S 的总和',
    sum: '\\((x_1+x_2+x_3+x_4)+6(-2)=-2\\)',
    known: '6 × (−2) = −12',
    charge: '−2',
    result: 'ΣS = +10；平均为 +2.5',
    note: '平均值不能证明每个 S 都是 +2.5。要确定各原子氧化态，还需要结构或候选条件。',
  },
]
// 总和式、结果和例外说明来自同一记录，防止切换后内容错位。
const stateExample = computed(() => stateExamples[stateIndex.value]!)

const classificationIndex = ref(0)
const classificationRevealed = ref(false)
const classifications = [
  {
    name: '铁离子变价',
    equation: '\\(\\mathrm{Fe^{2+}\\rightarrow Fe^{3+}}+e^-\\)',
    changes: ['Fe：+2 → +3'],
    result: '只显示氧化 · 氧化半反应',
    note: '电子在右边，铁失去电子；没有写出得到电子的一侧。',
  },
  {
    name: '铜离子析出',
    equation: '\\(\\mathrm{Cu^{2+}}+2e^-\\rightarrow\\mathrm{Cu}\\)',
    changes: ['Cu：+2 → 0'],
    result: '只显示还原 · 还原半反应',
    note: '电子在左边，铜离子得到电子；题目若要求完整 redox，不能只用这条半反应代替。',
  },
  {
    name: '锌铜置换',
    equation: '\\(\\mathrm{Zn+Cu^{2+}\\rightarrow Zn^{2+}+Cu}\\)',
    changes: ['Zn：0 → +2', 'Cu：+2 → 0'],
    result: '完整氧化还原 · redox',
    note: '锌失去 2e⁻，铜离子得到 2e⁻。总方程没写 e⁻，电子变化仍然存在。',
  },
  {
    name: '氯化银沉淀',
    equation: '\\(\\mathrm{Ag^++Cl^-\\rightarrow AgCl(s)}\\)',
    changes: ['Ag：+1 → +1', 'Cl：−1 → −1'],
    result: '无氧化还原',
    note: '固体里仍是 Ag⁺ 与 Cl⁻，不是银离子得电子变成银单质。',
  },
]
// 所选方程、价态与四类判定保持同源。
const classification = computed(() => classifications[classificationIndex.value]!)

const splitIndex = ref(0)
const splits = [
  {
    name: '过氧化氢',
    equation: '\\(\\mathrm{2H_2O_2\\rightarrow2H_2O+O_2}\\)',
    startSpecies: 'H₂O₂ 中 O',
    startState: '−1',
    highSpecies: 'O₂ 中 O',
    highState: '0',
    lowSpecies: 'H₂O 中 O',
    lowState: '−2',
    accessible: '氧从同一个负一氧化态，分向零与负二',
    note: '同一批过氧化氢中的氧，一部分升价、一部分降价。图中追踪的是氧原子，不是说一个原子复制成两个。',
    balance: '2 个 O 各失 1e⁻；另 2 个 O 各得 1e⁻。',
  },
  {
    name: '氯与热浓碱',
    equation: '\\(\\mathrm{3Cl_2+6OH^-\\rightarrow5Cl^-+ClO_3^-+3H_2O}\\)',
    startSpecies: 'Cl₂ 中 Cl',
    startState: '0',
    highSpecies: 'ClO₃⁻ 中 Cl',
    highState: '+5',
    lowSpecies: 'Cl⁻ 中 Cl',
    lowState: '−1',
    accessible: '氯从零分别升到正五、降到负一，需要五比一的原子数量配对',
    note: '向上每个 Cl 失 5e⁻，向下每个 Cl 只得 1e⁻。因此氯离子与氯酸根中的 Cl 数量比为 5∶1。',
    balance: '1 个 Cl 失 5e⁻；5 个 Cl 各得 1e⁻。',
  },
  {
    name: '亚硝酸',
    equation: '\\(\\mathrm{3HNO_2\\rightarrow HNO_3+2NO+H_2O}\\)',
    startSpecies: 'HNO₂ 中 N',
    startState: '+3',
    highSpecies: 'HNO₃ 中 N',
    highState: '+5',
    lowSpecies: 'NO 中 N',
    lowState: '+2',
    accessible: '氮从正三升到正五或降到正二，两个降价原子对应一个升价原子',
    note: '一份 HNO₃ 与两份 NO 分别承接升价与降价；三份起始物质中的氮都能追踪到产物。',
    balance: '1 个 N 失 2e⁻；2 个 N 各得 1e⁻。',
  },
  {
    name: '汇合反例',
    equation: '\\(\\mathrm{CO_2+C\\rightarrow2CO}\\)',
    startSpecies: '',
    startState: '',
    highSpecies: '',
    highState: '',
    lowSpecies: '',
    lowState: '',
    accessible: '两种碳的氧化态汇合',
    note: '起始碳分别为 +4 与 0，最后都为 +2。这是两种起点汇合，属于归中；不是同一起点分叉的歧化。',
    balance: 'C(0) 失 2e⁻；CO₂ 中 C(+4) 得 2e⁻。',
  },
]
// 歧化及归中共享同一氧化态路径记录，文字同步解释原子数量。
const split = computed(() => splits[splitIndex.value]!)

const agentIndex = ref(0)
const agentFocus = ref<'donor' | 'acceptor'>('donor')
const agents = [
  {
    name: '锌与铜离子',
    equation: '\\(\\mathrm{Zn+Cu^{2+}\\rightarrow Zn^{2+}+Cu}\\)',
    donor: 'Zn',
    acceptor: 'Cu²⁺',
    electrons: 2,
    donorChange: 'Zn：0 → +2',
    acceptorChange: 'Cu：+2 → 0',
    donorNote: 'Zn 给出电子，使 Cu²⁺ 被还原。因此 Zn 是还原剂，它自己却被氧化。',
    acceptorNote: '起始 Cu²⁺ 收到电子而变为 Cu。因此氧化剂是 Cu²⁺，不要回答还原后的产物 Cu。',
  },
  {
    name: '氯与碘离子',
    equation: '\\(\\mathrm{Cl_2+2I^-\\rightarrow2Cl^-+I_2}\\)',
    donor: 'I⁻',
    acceptor: 'Cl₂',
    electrons: 2,
    donorChange: 'I：−1 → 0',
    acceptorChange: 'Cl：0 → −1',
    donorNote: '两份 I⁻ 各失 1e⁻，形成 I₂。碘离子是还原剂，不要把它与生成的碘单质混同。',
    acceptorNote: '一份 Cl₂ 共得 2e⁻，形成两份 Cl⁻。氯气使碘离子被氧化，所以是氧化剂。',
  },
  {
    name: '铁离子与碘离子',
    equation: '\\(\\mathrm{2Fe^{3+}+2I^-\\rightarrow2Fe^{2+}+I_2}\\)',
    donor: 'I⁻',
    acceptor: 'Fe³⁺',
    electrons: 2,
    donorChange: 'I：−1 → 0',
    acceptorChange: 'Fe：+3 → +2',
    donorNote: 'I⁻ 向 Fe³⁺ 提供电子。带负电不意味着只能得到电子；这里它失电子，是还原剂。',
    acceptorNote:
      '每个 Fe³⁺ 得 1e⁻ 后仍是正离子 Fe²⁺。还原不一定得到单质；Fe³⁺ 仍是本反应的氧化剂。',
  },
]
// 角色图始终标起始反应物，避免把生成物误作氧化剂或还原剂。
const agent = computed(() => agents[agentIndex.value]!)

// 切换氧情境时回到初态，避免新情境继承旧反应的观察阶段。
function setOxygen(index: number) {
  oxygenIndex.value = index
  oxygenStage.value = 0
}
// 新的电子配对从各写一份开始，使倍乘步骤可重新观察。
function setTransfer(index: number) {
  transferIndex.value = index
  transferStage.value = 0
}
// 切换氧化态示例后隐藏答案，让学生先检查总和式。
function setState(index: number) {
  stateIndex.value = index
  stateRevealed.value = false
}
// 切换方程后收起判定，保留先观察再核对的阅读顺序。
function setClassification(index: number) {
  classificationIndex.value = index
  classificationRevealed.value = false
}
// 知识点变化时重置图解交互，避免跨节遗留上一个演示的答案状态。
function resetObservation() {
  oxygenIndex.value = 0
  oxygenStage.value = 0
  transferIndex.value = 0
  transferStage.value = 0
  stateIndex.value = 0
  stateRevealed.value = false
  classificationIndex.value = 0
  classificationRevealed.value = false
  splitIndex.value = 0
  agentIndex.value = 0
  agentFocus.value = 'donor'
}
watch(() => props.topic, resetObservation)
</script>

<style scoped>
.redox-atlas {
  --atlas-blue: #2855ba;
  --atlas-teal: #087b80;
  margin: 0;
  padding: 24px;
  border: 1px solid #c8dce9;
  border-radius: 14px;
  background: linear-gradient(140deg, #f1f7ff 0%, #f8fcfc 65%, #fff 100%);
  color: #17304b;
  min-width: 0;
}
figcaption h5 {
  margin: 10px 0 8px;
  font-size: 23px;
  line-height: 1.45;
  color: #142d48;
}
figcaption p {
  margin: 0 0 16px;
  color: #5d7088;
  line-height: 1.75;
  font-size: 14px;
}
.atlas-eyebrow {
  color: var(--atlas-teal);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
}
.atlas-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 16px;
}
.redox-atlas :deep(.app-button) {
  --app-button-bg: #fff;
  --app-button-border: #bfd2ee;
  --app-button-color: #2855ba;
  --app-button-hover-bg: #edf4ff;
  --app-button-hover-border: #8eafe4;
  --app-button-active-bg: #e3eeff;
  --app-button-active-border: #2855ba;
  margin-left: 0;
}
.redox-atlas :deep(.app-button[aria-pressed='true']) {
  --app-button-bg: #e6efff;
  --app-button-border: #87a9e0;
  --app-button-color: #194cae;
}
.equation {
  padding: 17px 8px;
  margin: 12px 0 18px;
  text-align: center;
  font-size: clamp(14px, 1.55vw, 20px);
  overflow-x: auto;
  border-block: 1px solid #d8e5f3;
}
svg {
  display: block;
  width: 100%;
  max-height: 260px;
}
.bond {
  stroke: #8c9eae;
  stroke-width: 5;
}
.flow-line,
.oxidation-path,
.reduction-path {
  fill: none;
  stroke: #3973c0;
  stroke-width: 3;
}
.reduction-path {
  stroke: var(--atlas-teal);
  stroke-dasharray: 7 4;
}
.atom-copper {
  fill: #f0ceb4;
  stroke: #b1754c;
  stroke-width: 2;
}
.atom-oxygen {
  fill: #e5eefe;
  stroke: #4b7ac0;
  stroke-width: 2;
}
.atom-hydrogen {
  fill: #e4f3f1;
  stroke: #4d9995;
  stroke-width: 2;
}
.atom-label {
  fill: #163451;
  font-size: 19px;
  font-weight: 650;
}
.svg-label {
  fill: #173b5b;
  font-size: 17px;
}
.svg-value {
  fill: #244fa5;
  font-size: 25px;
  font-weight: 700;
}
.svg-muted {
  fill: #657991;
  font-size: 14px;
}
.source-box {
  fill: #e7effc;
  stroke: #adc4ea;
}
.atlas-insight {
  margin: 18px 0 8px;
  padding-left: 13px;
  border-left: 3px solid var(--atlas-teal);
  color: #224966;
  font-size: 14px;
  line-height: 1.85;
}
.state-ledger {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 20px;
  padding: 24px 12px;
}
.state-ledger > div {
  display: grid;
  gap: 10px;
  text-align: center;
}
.state-ledger span {
  color: #667a91;
  font-size: 13px;
}
.state-ledger strong {
  font-size: 20px;
  color: var(--atlas-blue);
}
.half-reactions {
  padding: 15px 0;
}
.half-row {
  display: grid;
  grid-template-columns: 135px 1fr auto;
  align-items: center;
  gap: 15px;
  padding: 14px 10px;
}
.half-row :deep(.latex-text) {
  overflow-x: auto;
  font-size: 18px;
}
.half-row strong {
  color: var(--atlas-blue);
  white-space: nowrap;
}
.process-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--atlas-blue);
}
.process-label--gain {
  color: var(--atlas-teal);
}
.electron-bridge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #688097;
  font-size: 13px;
}
.electron-bridge > span:first-child {
  font-size: 26px;
  color: var(--atlas-teal);
}
.oxidation-workspace {
  display: grid;
  grid-template-columns: minmax(110px, 1fr) minmax(0, 3fr);
  align-items: center;
  gap: 24px;
  padding: 22px 0;
}
.state-formula {
  display: grid;
  gap: 12px;
  color: #2855ba;
  font-size: 26px;
  text-align: center;
}
.state-formula > span {
  color: #647b92;
  font-size: 13px;
}
.state-working {
  display: grid;
  gap: 15px;
  min-width: 0;
}
.state-working > :deep(.latex-text) {
  font-size: 21px;
  overflow-x: auto;
}
.small-label {
  font-size: 13px;
  color: #5f778f;
}
.sum-parts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  font-size: 13px;
}
.result-line {
  margin-top: 18px;
  padding-top: 15px;
  border-top: 1px solid #cadbec;
}
.result-line strong {
  color: var(--atlas-teal);
  font-size: 19px;
}
.result-line p {
  line-height: 1.8;
  font-size: 14px;
  margin: 8px 0 0;
}
.classification-key {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 22px;
  color: #6a7d94;
  font-size: 12px;
  margin-top: 22px;
}
.balance-strip {
  color: #305b7c;
  font-size: 14px;
  line-height: 1.7;
  padding: 10px 0;
}
.agent-map {
  display: grid;
  grid-template-columns: 1fr 70px 1fr;
  gap: 12px;
  align-items: center;
  margin: 24px 0;
}
.agent-side {
  display: grid;
  gap: 12px;
  padding: 18px 10px;
  text-align: center;
  border-block: 2px solid transparent;
  transition: background 160ms ease;
}
.agent-side.is-focused {
  border-color: #8fb3df;
  background: #eaf2ff;
}
.agent-side > span {
  font-size: 13px;
  color: #5d728c;
}
.agent-side > strong {
  font-size: 30px;
  color: #2459a8;
}
.agent-side b {
  font-size: 14px;
  font-weight: 600;
  color: var(--atlas-teal);
}
.agent-arrow {
  display: grid;
  gap: 0;
  text-align: center;
  color: var(--atlas-teal);
}
.agent-arrow strong {
  font-size: 40px;
  font-weight: 400;
}
.agent-arrow span {
  font-size: 14px;
}
.atlas-footnote {
  padding-top: 13px;
  margin: 20px 0 0;
  border-top: 1px solid #dce5ef;
  color: #6c7c91;
  font-size: 12px;
  line-height: 1.7;
}
@media (max-width: 600px) {
  .redox-atlas {
    padding: 16px;
  }
  figcaption h5 {
    font-size: 20px;
  }
  .half-row {
    grid-template-columns: 1fr auto;
    gap: 10px;
    padding-inline: 0;
  }
  .process-label {
    grid-column: 1 / -1;
  }
  .half-row :deep(.latex-text) {
    font-size: 15px;
  }
  .oxidation-workspace {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .state-formula {
    justify-items: start;
    text-align: left;
  }
  .state-working > :deep(.latex-text) {
    font-size: 17px;
  }
  .agent-map {
    grid-template-columns: 1fr 38px 1fr;
    gap: 4px;
  }
  .agent-side {
    padding: 14px 6px;
  }
  .agent-side > strong {
    font-size: 25px;
  }
  .agent-side b {
    font-size: 12px;
    line-height: 1.65;
  }
}
@media (prefers-reduced-motion: reduce) {
  .agent-side {
    transition: none;
  }
}
</style>
