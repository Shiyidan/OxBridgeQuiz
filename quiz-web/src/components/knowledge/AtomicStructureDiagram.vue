<!-- ESAT 原子结构互动图解：在六个知识点中联动粒子位置、核素记号、电子层和同位素丰度。 -->
<template>
  <figure class="atomic-atlas" :aria-label="heading">
    <figcaption>
      <span class="atomic-eyebrow">CHEMISTRY · 原子结构</span>
      <h5>{{ heading }}</h5>
      <p>{{ instruction }}</p>
    </figcaption>

    <div
      v-if="mode === 'model' || mode === 'particles'"
      class="atomic-controls"
      role="group"
      aria-label="观察粒子"
    >
      <AppButton
        v-for="item in particleOptions"
        :key="item.key"
        type="secondary"
        size="small"
        :aria-pressed="particle === item.key"
        @click="particle = item.key"
        >{{ item.label }}</AppButton
      >
    </div>
    <div
      v-else-if="mode === 'notation'"
      class="atomic-controls"
      role="group"
      aria-label="比较氯原子与氯离子"
    >
      <AppButton
        v-for="item in chlorineOptions"
        :key="item.key"
        type="secondary"
        size="small"
        :aria-pressed="chlorineChoice === item.key"
        @click="chlorineChoice = item.key"
        >{{ item.label }}</AppButton
      >
    </div>
    <div v-else-if="mode === 'shells'" class="element-picker">
      <label :for="elementSelectId">选择元素（H–Ca）</label>
      <el-select :id="elementSelectId" v-model="elementNumber" aria-label="选择前20号元素">
        <el-option
          v-for="(item, index) in elements"
          :key="item.symbol"
          :label="`${index + 1} · ${item.symbol} ${item.name}`"
          :value="index + 1"
        />
      </el-select>
    </div>

    <template v-if="mode !== 'isotopes' && mode !== 'average'">
      <div class="atomic-scene">
        <svg viewBox="0 0 400 308" role="img" :aria-label="atomDescription">
          <title>{{ atomDescription }}</title>
          <g class="shell-rings">
            <circle
              v-for="(count, index) in shells"
              :key="index"
              cx="200"
              cy="148"
              :r="62 + index * 25"
            />
          </g>
          <g :class="{ 'is-muted': particle === 'electron' && mode === 'particles' }">
            <circle cx="200" cy="148" r="38" class="nuclear-boundary" />
            <g
              v-for="dot in nuclearParticles"
              :key="dot.id"
              :class="[
                'nucleon',
                dot.kind,
                {
                  'is-emphasized':
                    particle === dot.kind && (mode === 'model' || mode === 'particles'),
                },
              ]"
            >
              <circle :cx="dot.x" :cy="dot.y" :r="dot.radius" />
              <text :x="dot.x" :y="dot.y + 3">{{ dot.kind === 'proton' ? '+' : 'n' }}</text>
            </g>
          </g>
          <g
            v-for="electron in electronDots"
            :key="electron.id"
            :class="[
              'electron',
              {
                'is-emphasized':
                  particle === 'electron' && (mode === 'model' || mode === 'particles'),
              },
            ]"
          >
            <circle :cx="electron.x" :cy="electron.y" r="5" />
            <text :x="electron.x" :y="electron.y + 3">−</text>
          </g>
          <path d="M 229 123 L 289 74 L 347 74" class="atomic-leader" />
          <text x="346" y="64" text-anchor="end" class="atomic-svg-label">原子核（放大）</text>
          <text x="200" y="289" text-anchor="middle" class="shell-caption">
            {{ shells.join('，') }} · {{ atom.electrons }} 个电子
          </text>
        </svg>
        <div class="atomic-facts" aria-live="polite">
          <div
            class="nuclide"
            :aria-label="`${atom.name}，质量数${atom.mass}，原子序数${atom.z}，${chargeText}`"
          >
            <span class="nuclide-numbers"
              ><span>{{ atom.mass }}</span
              ><span>{{ atom.z }}</span></span
            >
            <strong>{{ atom.symbol }}</strong
            ><sup v-if="atom.charge">{{ atom.charge === -1 ? '−' : `${atom.charge}+` }}</sup>
          </div>
          <dl>
            <div>
              <dt>质子 p</dt>
              <dd>{{ atom.z }}</dd>
            </div>
            <div>
              <dt>中子 n</dt>
              <dd>{{ atom.mass - atom.z }}</dd>
            </div>
            <div>
              <dt>电子 e</dt>
              <dd>{{ atom.electrons }}</dd>
            </div>
            <div>
              <dt>总电荷</dt>
              <dd>{{ chargeText }}</dd>
            </div>
          </dl>
          <p v-if="mode === 'shells'">
            {{ shells.length }} 个已占据电子层；最外层 {{ shells[shells.length - 1] }} 个电子。
          </p>
        </div>
      </div>
      <div class="atomic-explanation" aria-live="polite"><KnowledgeText :text="explanation" /></div>
      <div
        v-if="mode === 'particles'"
        class="particle-table-scroll"
        role="region"
        aria-label="粒子相对质量与电荷"
        tabindex="0"
      >
        <table class="particle-table">
          <thead>
            <tr>
              <th scope="col">粒子</th>
              <th scope="col">位置</th>
              <th scope="col">相对质量</th>
              <th scope="col">相对电荷</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in particleProperties"
              :key="item.key"
              :class="{ 'is-current': particle === item.key }"
            >
              <th scope="row">{{ item.name }}</th>
              <td>{{ item.position }}</td>
              <td>{{ item.mass }}</td>
              <td>{{ item.charge }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else>
      <div class="isotope-pair">
        <div>
          <span class="isotope-symbol">³⁵Cl</span><span>17 p + <strong>18 n</strong></span
          ><small>{{ abundance }}% 的原子</small>
        </div>
        <span class="isotope-relation">同一元素<br />中子数不同</span>
        <div>
          <span class="isotope-symbol">³⁷Cl</span><span>17 p + <strong>20 n</strong></span
          ><small>{{ 100 - abundance }}% 的原子</small>
        </div>
      </div>
      <div class="abundance-control">
        <label :for="abundanceSliderId"
          >氯-35 的丰度 <strong>{{ abundance }}%</strong></label
        >
        <el-slider
          :id="abundanceSliderId"
          v-model="abundance"
          :min="0"
          :max="100"
          :step="5"
          :show-tooltip="false"
          aria-label="氯35丰度百分比"
        />
        <span>氯-37 自动补足至 100%</span>
      </div>
      <svg
        v-if="mode === 'isotopes'"
        class="spectrum"
        viewBox="0 0 420 238"
        role="img"
        :aria-label="`教学质谱：m/z为35处丰度${abundance}%，37处丰度${100 - abundance}%，可见${peakCount}个峰`"
      >
        <title>仅考虑单电荷原子离子的简化同位素质谱</title>
        <path d="M 66 26 V 192 H 382" class="spectrum-axis" />
        <path d="M 66 52 H 382 M 66 122 H 382" class="spectrum-grid" />
        <text x="20" y="28">丰度 %</text>
        <text x="27" y="57">100</text>
        <text x="35" y="127">50</text>
        <text x="43" y="197">0</text>
        <path
          v-if="abundance > 0"
          :d="`M 162 192 V ${192 - abundance * 1.4}`"
          class="spectrum-peak spectrum-peak--light"
        />
        <path
          v-if="abundance < 100"
          :d="`M 294 192 V ${192 - (100 - abundance) * 1.4}`"
          class="spectrum-peak spectrum-peak--heavy"
        />
        <text x="162" :y="Math.max(38, 181 - abundance * 1.4)" text-anchor="middle">
          {{ abundance }}%
        </text>
        <text x="294" :y="Math.max(38, 181 - (100 - abundance) * 1.4)" text-anchor="middle">
          {{ 100 - abundance }}%
        </text>
        <text x="162" y="216" text-anchor="middle">35</text>
        <text x="294" y="216" text-anchor="middle">37</text>
        <text x="355" y="228">m/z</text>
      </svg>
      <div v-else class="mass-average">
        <div class="mass-balance-labels">
          <span>35 · 较轻同位素</span><span>37 · 较重同位素</span>
        </div>
        <div class="mass-balance">
          <span class="mass-marker" :style="{ left: `${100 - abundance}%` }" />
        </div>
        <p class="average-value" aria-live="polite">
          相对原子质量 <strong>{{ averageMass }}</strong>
        </p>
        <KnowledgeText :text="averageFormula" />
      </div>
      <div class="atomic-explanation" aria-live="polite">
        <KnowledgeText :text="isotopeExplanation" />
      </div>
    </template>
    <p class="atomic-note">{{ modelNote }}</p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic: string }>()
type Particle = 'proton' | 'neutron' | 'electron'
type Mode = 'model' | 'particles' | 'notation' | 'shells' | 'isotopes' | 'average'
const particle = ref<Particle>('proton')
const chlorineChoice = ref('35-neutral')
const elementNumber = ref(17)
const abundance = ref(75)
const elementSelectId = useId()
const abundanceSliderId = useId()
const particleOptions: Array<{ key: Particle; label: string }> = [
  { key: 'proton', label: '质子 p⁺' },
  { key: 'neutron', label: '中子 n' },
  { key: 'electron', label: '电子 e⁻' },
]
const particleProperties = [
  { key: 'proton', name: '质子', position: '核内', mass: '约 1', charge: '+1' },
  { key: 'neutron', name: '中子', position: '核内', mass: '约 1', charge: '0' },
  { key: 'electron', name: '电子', position: '核外', mass: '约 1/1836', charge: '−1' },
]
const chlorineOptions = [
  { key: '35-neutral', label: '³⁵Cl 原子' },
  { key: '37-neutral', label: '³⁷Cl 原子' },
  { key: '35-ion', label: '³⁵Cl⁻ 离子' },
]
const elements = [
  { symbol: 'H', name: '氢', mass: 1 },
  { symbol: 'He', name: '氦', mass: 4 },
  { symbol: 'Li', name: '锂', mass: 7 },
  { symbol: 'Be', name: '铍', mass: 9 },
  { symbol: 'B', name: '硼', mass: 11 },
  { symbol: 'C', name: '碳', mass: 12 },
  { symbol: 'N', name: '氮', mass: 14 },
  { symbol: 'O', name: '氧', mass: 16 },
  { symbol: 'F', name: '氟', mass: 19 },
  { symbol: 'Ne', name: '氖', mass: 20 },
  { symbol: 'Na', name: '钠', mass: 23 },
  { symbol: 'Mg', name: '镁', mass: 24 },
  { symbol: 'Al', name: '铝', mass: 27 },
  { symbol: 'Si', name: '硅', mass: 28 },
  { symbol: 'P', name: '磷', mass: 31 },
  { symbol: 'S', name: '硫', mass: 32 },
  { symbol: 'Cl', name: '氯', mass: 35 },
  { symbol: 'Ar', name: '氩', mass: 40 },
  { symbol: 'K', name: '钾', mass: 39 },
  { symbol: 'Ca', name: '钙', mass: 40 },
]
const topicModes: Record<string, Mode> = {
  '140102': 'particles',
  '140103': 'notation',
  '140104': 'shells',
  '140105': 'isotopes',
  '140106': 'average',
}

// 每个考纲叶子进入对应的观察方式，章级展示默认使用原子模型。
const mode = computed<Mode>(() => topicModes[props.topic] || 'model')
// 选中的原子、同位素和离子统一决定核素记号与粒子数量。
const atom = computed(() => {
  if (mode.value === 'shells') {
    const item = elements[elementNumber.value - 1]!
    return { ...item, z: elementNumber.value, electrons: elementNumber.value, charge: 0 }
  }
  if (mode.value === 'notation') {
    const ion = chlorineChoice.value === '35-ion'
    return {
      symbol: 'Cl',
      name: '氯',
      z: 17,
      mass: chlorineChoice.value === '37-neutral' ? 37 : 35,
      electrons: ion ? 18 : 17,
      charge: ion ? -1 : 0,
    }
  }
  return { symbol: 'C', name: '碳', z: 6, mass: 12, electrons: 6, charge: 0 }
})
// 本图仅计算前20号元素及氯离子的基态电子层，不把第三层八电子推广为通用容量。
const shells = computed(() => {
  let remaining = atom.value.electrons
  const result: number[] = []
  for (const capacity of [2, 8, 8, 2]) {
    if (remaining <= 0) break
    const count = Math.min(capacity, remaining)
    result.push(count)
    remaining -= count
  }
  return result
})
// 将电子分布在示意电子层上，位置用于数数而非表示真实运行轨迹。
const electronDots = computed(() =>
  shells.value.flatMap((count, shell) =>
    Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2 + shell * 0.14
      return {
        id: `${shell}-${index}`,
        x: 200 + Math.cos(angle) * (62 + shell * 25),
        y: 148 + Math.sin(angle) * (62 + shell * 25),
      }
    }),
  ),
)
// 核内每个小圆对应一个核子，颜色和文字同时区分质子与中子。
const nuclearParticles = computed(() =>
  Array.from({ length: atom.value.mass }, (_, index) => {
    const angle = index * 2.399963
    const distance = Math.sqrt(index / Math.max(1, atom.value.mass - 1)) * 29
    return {
      id: index,
      kind: index < atom.value.z ? 'proton' : 'neutron',
      x: 200 + Math.cos(angle) * distance,
      y: 148 + Math.sin(angle) * distance,
      radius: atom.value.mass > 20 ? 4.8 : 7,
    }
  }),
)
// 粒子数之差决定总电荷，数值为零时明确显示中性。
const chargeText = computed(() =>
  atom.value.charge === 0
    ? '0（中性）'
    : `${atom.value.charge < 0 ? '−' : '+'}${Math.abs(atom.value.charge)}`,
)
// 供屏幕阅读器读取完整原子信息，无需从图中的小圆推断数量。
const atomDescription = computed(
  () =>
    `${atom.value.name}-${atom.value.mass}结构示意：${atom.value.z}个质子，${atom.value.mass - atom.value.z}个中子，${atom.value.electrons}个电子，电子排布${shells.value.join('，')}；核及粒子不按比例。`,
)
// 标题与章节目标一一对应，不在所有知识点重复同一张原子图。
const heading = computed(
  () =>
    ({
      model: '先分清核内与核外',
      particles: '质量集中在哪里，电荷又怎样相抵？',
      notation: '一个符号，读出三种粒子',
      shells: '从原子序数排到最外层电子',
      isotopes: '峰的位置认质量，峰的高低读丰度',
      average: '丰度改变，平均值向哪边移动？',
    })[mode.value],
)
// 操作提示指向当前图解可以观察的变化。
const instruction = computed(
  () =>
    ({
      model: '点选粒子，对照它在碳-12原子中的位置。',
      particles: '切换粒子，比较位置、相对质量和电荷。',
      notation: '对比同位素与离子：每次到底改变了哪一种粒子？',
      shells: '选择元素，核素、电子数与电子层同时更新。',
      isotopes: '拖动丰度，观察两种同位素的峰。',
      average: '先预测平均值的方向，再拖动氯-35的丰度。',
    })[mode.value],
)
// 原子模型和粒子性质随选中对象解释，电子排布与离子记号使用各自条件。
const explanation = computed(() => {
  if (mode.value === 'notation') {
    if (atom.value.charge === -1)
      return '**得到1个电子，形成 Cl⁻。**质子仍为17、中子仍为18；电子变成18。元素身份和质量数不变。'
    if (atom.value.mass === 37)
      return '**换成氯-37，只增加2个中子。**与氯-35相比，质子和中性原子的电子数都不变，所以仍是氯。'
    return '**左上35是质子与中子的总数，左下17是质子数。**中子数为35−17=18；未标电荷的原子有17个电子。'
  }
  if (mode.value === 'shells') {
    if (atom.value.z === 1)
      return '**氢-1没有中子。**原子模型中的“核含质子、中子”描述通常组成，并不表示每种原子都必须同时含两者。电子排布为1。'
    if (atom.value.z === 2)
      return '**氦只有2个电子，第一层已经排满。**不要把所有原子的稳定最外层都机械写成8。'
    if (atom.value.z >= 19)
      return '**氩之后开始第四层。**前20号元素的基态排布中，钾是2,8,8,1，钙是2,8,8,2；不能把第19个电子继续填入第三层。'
    return `中性${atom.value.name}原子有${atom.value.z}个电子。**先确定总电子数，再由内向外分层；最后把${shells.value.join('+')}加回去核对总数。**`
  }
  return {
    proton:
      '**质子在原子核内，带+1相对电荷、相对质量约1。**质子数决定元素身份；核外电子的得失不会把碳变成另一种元素。',
    neutron:
      '**中子在原子核内，相对电荷为0、相对质量约1。**不带电不等于没有质量；改变中子数可以得到同一元素的另一同位素。',
    electron:
      '**电子分布在核外的电子层，相对电荷为−1。**质量约为质子的1/1836，虽然很轻，带电量的大小却与质子相等。',
  }[particle.value]
})
// 教学混合样品只含氯35和氯37，近似以质量数作为同位素相对质量。
const averageMass = computed(() =>
  Number(((35 * abundance.value) / 100 + (37 * (100 - abundance.value)) / 100).toFixed(2)),
)
// 零丰度同位素不再画峰，避免将坐标位置误读为实际检测到的同位素。
const peakCount = computed(() => (abundance.value === 0 || abundance.value === 100 ? 1 : 2))
// 加权式与当前滑杆始终同步，公式沿用公共数学文本渲染。
const averageFormula = computed(
  () =>
    `$A_r=\\dfrac{35\\times ${abundance.value}+37\\times ${100 - abundance.value}}{100}=${averageMass.value}$`,
)
// 峰图和加权平均各自强调可用于判断选项的观察规则。
const isotopeExplanation = computed(() => {
  if (mode.value === 'isotopes')
    return `当前有**${peakCount.value}个非零峰**。两种氯同位素的质子数都是17，中性原子都有17个电子；峰高改变的是样品比例，不是单个原子的中子数。**先确认都是单电荷原子离子，才把m/z当作同位素质量来读。**`
  if (abundance.value === 50)
    return '**只有两种同位素数量相等时，才可直接取35与37的中点36。**比例一旦改变，普通平均就不再适用。'
  if (abundance.value === 0 || abundance.value === 100)
    return '**只有一种同位素时，平均值落在该同位素的质量处。**这也可以用来检查公式的两个极端情况。'
  return `**平均值${averageMass.value}在35与37之间，并靠近较多的同位素。**氯-35占比增加，平均值向35移动；权重按原子个数比例，不按总质量比例。`
})
// 注明图的简化边界，防止学生把教学近似当成精密数据或真实轨迹。
const modelNote = computed(() =>
  mode.value === 'isotopes' || mode.value === 'average'
    ? '教学混合样品；丰度可调，不代表天然样品的精确比例。近似取同位素质量为35、37；质谱仅画单电荷原子离子，不含分子或碎片峰。'
    : '电子层示意模型，不表示真实电子轨迹；原子核、粒子和电子层不按比例。核素取一个常见同位素，左上数字为质量数。',
)

// 切换知识点重置教学状态，避免上一节的离子或丰度设置影响新节初始解释。
watch(
  () => props.topic,
  () => {
    particle.value = 'proton'
    chlorineChoice.value = '35-neutral'
    elementNumber.value = 17
    abundance.value = 75
  },
)
</script>

<style scoped>
.atomic-atlas {
  margin: 0;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--color-learning-blue-soft), var(--color-surface) 60%);
  color: var(--color-ink);
}
.atomic-eyebrow {
  color: var(--color-learning-blue);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  letter-spacing: 0.08em;
}
figcaption h5 {
  margin: 7px 0;
  font-size: var(--text-lg);
}
figcaption p,
.atomic-note {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.7;
}
.atomic-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0 4px;
}
.atomic-controls :deep(.app-button) {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-hover-color: var(--color-learning-blue);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-border: var(--color-learning-blue);
  margin: 0;
}
.atomic-controls :deep(.app-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-blue);
  --app-button-color: var(--color-surface);
  --app-button-border: var(--color-learning-blue);
}
.element-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 16px 0 0;
  font-size: var(--text-sm);
}
.element-picker .el-select {
  width: 170px;
}
.atomic-scene {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 126px;
  align-items: center;
  gap: 8px;
}
.atomic-scene svg {
  width: 100%;
  min-width: 0;
}
svg text {
  font-family: var(--font-sans);
  fill: var(--color-ink-soft);
  font-size: 13px;
}
.shell-rings circle {
  fill: none;
  stroke: var(--color-learning-blue-line);
  stroke-width: 1.5;
}
.nuclear-boundary {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber-line);
}
.nucleon circle {
  stroke: var(--color-surface);
  stroke-width: 1;
}
.proton circle {
  fill: var(--color-learning-blue);
}
.neutron circle {
  fill: var(--color-learning-teal);
}
.nucleon text {
  fill: white;
  text-anchor: middle;
  font-size: 8px;
  font-weight: 700;
}
.electron circle {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 1.5;
}
.electron text {
  fill: var(--color-ink);
  text-anchor: middle;
  font-size: 9px;
}
.nucleon.is-emphasized circle,
.electron.is-emphasized circle {
  stroke: var(--color-ink);
  stroke-width: 1.5;
}
.is-muted {
  opacity: 0.55;
}
.atomic-leader {
  fill: none;
  stroke: var(--color-ink-soft);
  stroke-width: 1;
}
.shell-caption {
  fill: var(--color-learning-blue);
  font-weight: var(--weight-semi);
  font-size: 15px;
}
.nuclide {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 72px;
}
.nuclide-numbers {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 18px;
  line-height: 1.4;
}
.nuclide strong {
  font-size: 40px;
  font-weight: var(--weight-semi);
}
.nuclide sup {
  align-self: flex-start;
  margin-top: 12px;
  font-size: 20px;
}
.atomic-facts dl {
  margin: 8px 0;
}
.atomic-facts dl div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-learning-blue-line);
  font-size: var(--text-sm);
}
.atomic-facts dt {
  color: var(--color-ink-soft);
}
.atomic-facts dd {
  margin: 0;
  font-weight: var(--weight-semi);
  white-space: nowrap;
}
.atomic-facts p {
  font-size: var(--text-xs);
  line-height: 1.7;
  color: var(--color-ink-soft);
}
.atomic-explanation {
  padding: 12px 14px;
  border-left: 3px solid var(--color-learning-blue);
  background: var(--color-learning-blue-soft);
  font-size: var(--text-sm);
  line-height: 1.85;
}
.atomic-note {
  margin-top: 12px;
  font-size: var(--text-xs);
}
.particle-table-scroll {
  overflow-x: auto;
  margin-top: 14px;
}
.particle-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--text-xs);
}
.particle-table th,
.particle-table td {
  padding: 8px;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-learning-blue-line);
}
.particle-table .is-current {
  background: var(--color-learning-blue-soft);
}
.isotope-pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  margin: 22px 0 16px;
}
.isotope-pair > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  font-size: var(--text-sm);
}
.isotope-symbol {
  color: var(--color-learning-blue);
  font-size: 30px;
  font-weight: var(--weight-bold);
}
.isotope-pair small,
.isotope-relation {
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  text-align: center;
  line-height: 1.7;
}
.abundance-control {
  margin: 12px 8px 0;
  font-size: var(--text-sm);
}
.abundance-control label {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.abundance-control > span {
  display: block;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
}
.spectrum {
  width: 100%;
  margin-top: 10px;
}
.spectrum-axis {
  fill: none;
  stroke: var(--color-ink-soft);
  stroke-width: 1.5;
}
.spectrum-grid {
  fill: none;
  stroke: var(--color-learning-blue-line);
  stroke-dasharray: 4 4;
}
.spectrum-peak {
  stroke-width: 12;
  fill: none;
}
.spectrum-peak--light {
  stroke: var(--color-learning-blue);
}
.spectrum-peak--heavy {
  stroke: var(--color-learning-teal);
}
.mass-average {
  margin: 28px 12px 20px;
  text-align: center;
  font-size: var(--text-sm);
  line-height: 1.7;
}
.mass-balance-labels {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
}
.mass-balance {
  position: relative;
  height: 6px;
  margin: 15px 0 20px;
  background: linear-gradient(to right, var(--color-learning-blue), var(--color-learning-teal));
  border-radius: 3px;
}
.mass-marker {
  position: absolute;
  width: 14px;
  height: 14px;
  top: -4px;
  transform: translateX(-50%);
  border: 2px solid var(--color-surface);
  border-radius: 50%;
  background: var(--color-ink);
}
.average-value strong {
  color: var(--color-learning-blue);
  font-size: 28px;
  margin-left: 8px;
}
@media (max-width: 560px) {
  .atomic-atlas {
    padding: 14px;
  }
  .atomic-scene {
    grid-template-columns: minmax(0, 1fr);
  }
  .atomic-facts {
    display: grid;
    grid-template-columns: 95px minmax(0, 1fr);
    gap: 12px;
    align-items: center;
  }
  .atomic-facts p {
    grid-column: 1 / -1;
    margin: 0 0 12px;
  }
  .atomic-facts dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 12px;
  }
  .atomic-facts dl div {
    font-size: var(--text-xs);
  }
  .isotope-pair {
    gap: 5px;
  }
  .isotope-pair > div {
    font-size: var(--text-xs);
  }
}
</style>
