<!-- 数学 1 比与比例互动图解：按当前考点显示基准、份额、函数、相似尺度或迭代过程。 -->
<template>
  <figure class="ratio-atlas" :aria-label="heading">
    <figcaption>
      <span>MATHEMATICS 1 · 比例实验室</span>
      <h5>{{ heading }}</h5>
      <p>{{ instruction }}</p>
    </figcaption>

    <template v-if="mode === 'scale'">
      <div class="controls" role="group" aria-label="地图复印倍率">
        <AppButton
          v-for="k in [0.9, 1, 1.2, 2]"
          :key="k"
          type="secondary"
          size="small"
          :aria-pressed="mapScale === k"
          @click="mapScale = k"
          >{{ k * 100 }}%</AppButton
        >
      </div>
      <svg viewBox="0 0 480 210" role="img" aria-label="同一实地距离在复印前后地图上的长度">
        <text x="24" y="28">原图：4 cm</text>
        <path d="M40 65H200" class="blue-line" />
        <circle cx="40" cy="65" r="5" />
        <circle cx="200" cy="65" r="5" />
        <text x="24" y="112">复印后：{{ format(4 * mapScale) }} cm</text>
        <path :d="`M40 150H${40 + 160 * mapScale}`" class="teal-line" />
        <circle cx="40" cy="150" r="5" />
        <circle :cx="40 + 160 * mapScale" cy="150" r="5" />
        <text x="24" y="194">两段代表的实地距离均为 1 km</text>
      </svg>
      <p class="result">1 : 25000 → 1 : {{ format(25000 / mapScale) }}</p>
      <p class="hint">图变大，比例尺分母变小；真实距离没有改变。分母按需要取近似。</p>
    </template>

    <template v-else-if="mode === 'fraction'">
      <div class="controls" role="group" aria-label="选择比较基准">
        <AppButton
          v-for="(label, index) in ['A 是 B 的几倍', 'B 是 A 的几倍', 'A 占总量多少']"
          :key="label"
          type="secondary"
          size="small"
          :aria-pressed="reference === index"
          @click="reference = index"
          >{{ label }}</AppButton
        >
      </div>
      <svg viewBox="0 0 480 185" role="img" aria-label="A有5份，B有3份，每份大小相同">
        <text x="15" y="60">A</text>
        <rect
          v-for="n in 5"
          :key="`a${n}`"
          :x="50 + (n - 1) * 65"
          y="30"
          width="60"
          height="45"
          class="blue-fill"
        />
        <text x="15" y="135">B</text>
        <rect
          v-for="n in 3"
          :key="`b${n}`"
          :x="50 + (n - 1) * 65"
          y="105"
          width="60"
          height="45"
          class="teal-fill"
        />
      </svg>
      <p class="result"><LatexText :text="fractionFormula" /></p>
      <p class="hint">改变的是分母代表的量，A 与 B 本身都没有变化。5/3 大于 1 是合理的。</p>
    </template>

    <template v-else-if="mode === 'notation'">
      <div class="controls">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="aligned"
          @click="aligned = !aligned"
          >{{ aligned ? '查看原始份数' : '对齐公共量 R' }}</AppButton
        >
      </div>
      <div class="table-scroll">
        <table>
          <caption>
            两组比使用同一个 R
          </caption>
          <thead>
            <tr>
              <th>关系</th>
              <th>Q</th>
              <th>R</th>
              <th>S</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Q : R{{ aligned ? ' × 3' : '' }}</th>
              <td>{{ aligned ? 15 : 5 }}</td>
              <td class="shared">{{ aligned ? 6 : 2 }}</td>
              <td>—</td>
            </tr>
            <tr>
              <th>R : S{{ aligned ? ' × 2' : '' }}</th>
              <td>—</td>
              <td class="shared">{{ aligned ? 6 : 3 }}</td>
              <td>{{ aligned ? 20 : 10 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="result">
        {{ aligned ? 'Q : R : S = 15 : 6 : 20 → Q : S = 3 : 4' : 'R 的份数还不同，暂不能直接连接' }}
      </p>
      <p class="hint">
        比例里的数字是各自尺度的份数。将公共量调成同样的份数后，才可读取同一组数量。
      </p>
    </template>

    <template v-else-if="mode === 'allocation'">
      <div class="controls" role="group" aria-label="分配比例">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="!threeShares"
          @click="threeShares = false"
          >3 : 5</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="threeShares"
          @click="threeShares = true"
          >3 : 2 : 1</AppButton
        >
      </div>
      <label class="slider-label" for="ratio-total">总量 {{ total }}</label
      ><ElSlider
        id="ratio-total"
        v-model="total"
        :min="60"
        :max="600"
        :step="60"
        aria-label="待分配总量"
      />
      <div
        class="share-bar"
        role="img"
        :aria-label="shares.map((n, i) => `第${i + 1}部分${n}份`).join('，')"
      >
        <span v-for="(n, i) in shares" :key="i" :style="{ flex: n, background: palette[i] }"
          >{{ n }}份</span
        >
      </div>
      <p class="result">一份 = {{ total }} ÷ {{ shareSum }} = {{ format(total / shareSum) }}</p>
      <p class="values">
        <span v-for="(n, i) in shares" :key="i"
          >第{{ i + 1 }}部分：<strong>{{ format((total * n) / shareSum) }}</strong></span
        >
      </p>
      <p class="hint">总量对应全部份数。若题目给两部分的差，就应对应份数差，不能继续用总份数。</p>
    </template>

    <template v-else-if="mode === 'context'">
      <label class="slider-label" for="ratio-mixture"
        >A 溶液的质量：{{ massA }} kg；B 溶液：{{ 10 - massA }} kg</label
      ><ElSlider
        id="ratio-mixture"
        v-model="massA"
        :min="1"
        :max="9"
        :step="1"
        aria-label="百分之四十溶液的质量"
      />
      <div class="mixture-columns">
        <div>
          <strong>A · 40%</strong>
          <div class="beaker"><div :style="{ height: `${massA * 10}%` }" class="blue-fill" /></div>
          <span>溶质 {{ format(massA * 0.4) }} kg</span>
        </div>
        <b>＋</b>
        <div>
          <strong>B · 20%</strong>
          <div class="beaker">
            <div :style="{ height: `${(10 - massA) * 10}%` }" class="teal-fill" />
          </div>
          <span>溶质 {{ format((10 - massA) * 0.2) }} kg</span>
        </div>
      </div>
      <p class="result">
        混合质量分数 = {{ format(massA * 0.4 + (10 - massA) * 0.2) }} ÷ 10 = {{ 20 + 2 * massA }}%
      </p>
      <p class="hint">
        假设混合无反应、无损失；液面柱高只示意质量，不代表体积。两种溶液等质量时才可直接平均浓度。
      </p>
    </template>

    <template v-else-if="mode === 'linear' || mode === 'power'">
      <div class="controls" role="group" aria-label="选择比例关系">
        <AppButton
          v-for="(item, index) in graphChoices"
          :key="item.label"
          type="secondary"
          size="small"
          :aria-pressed="graphIndex === index"
          @click="graphIndex = index"
          >{{ item.label }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 480 280"
        role="img"
        :aria-label="graphChoice.label + '的函数图像，横轴x，纵轴y'"
      >
        <path
          v-for="n in 6"
          :key="n"
          :d="`M50 ${235 - n * 30}H430 M${50 + n * 60} 235V25`"
          class="grid"
        />
        <path d="M50 25V235H445" class="axis" />
        <text x="32" y="256">0</text>
        <text x="449" y="240">x</text>
        <text x="29" y="22">y</text>
        <text v-for="n in 6" :key="`x${n}`" :x="46 + n * 60" y="256">{{ n }}</text>
        <text v-for="n in 6" :key="`y${n}`" x="25" :y="240 - n * 30">{{ n * 2 }}</text>
        <path :d="graphPath" class="blue-line" />
      </svg>
      <p class="result"><LatexText :text="graphChoice.formula" /></p>
      <p class="hint">{{ graphChoice.note }}</p>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>x</th>
              <th>1</th>
              <th>2</th>
              <th>4</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>y</th>
              <td v-for="x in [1, 2, 4]" :key="x">{{ format(graphValue(x)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else-if="mode === 'parts'">
      <div class="controls" role="group" aria-label="选择部分或剩余量">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="!remaining"
          @click="remaining = false"
          >部分比 1 : 3</AppButton
        ><AppButton
          type="secondary"
          size="small"
          :aria-pressed="remaining"
          @click="remaining = true"
          >剩余量的三分之一</AppButton
        >
      </div>
      <svg
        v-if="!remaining"
        viewBox="0 0 480 160"
        role="img"
        aria-label="全长分成4份，短段1份，长段3份"
      >
        <rect
          v-for="n in 4"
          :key="n"
          :x="40 + (n - 1) * 100"
          y="45"
          width="96"
          height="50"
          :class="n === 1 ? 'blue-fill' : 'teal-fill'"
        />
        <text x="60" y="125">1 / 4</text>
        <text x="260" y="125">3 / 4</text>
      </svg>
      <template v-else
        ><div class="share-bar">
          <span style="flex: 35; background: #cbd5e1">35% 花掉</span
          ><span style="flex: 65; background: #2563eb">65% 留下</span>
        </div>
        <p class="result">
          <LatexText
            :text="String.raw`再花剩余的 $\frac13$，最终留下 $0.65\times\frac23=\frac{13}{30}$`"
          /></p
      ></template>
      <p class="hint">
        {{
          remaining
            ? '第二次的整体是65%的剩余量，不是原来的全部。'
            : '比为1:3，但短段占全长1/(1+3)=1/4。'
        }}
      </p>
    </template>

    <template v-else-if="mode === 'percentage'">
      <div class="controls" role="group" aria-label="连续百分比场景">
        <AppButton
          v-for="(item, index) in percentageCases"
          :key="item.label"
          type="secondary"
          size="small"
          :aria-pressed="percentageIndex === index"
          @click="percentageIndex = index"
          >{{ item.label }}</AppButton
        >
      </div>
      <div class="multiplier-flow">
        <strong>100</strong><span>× {{ percentageCase.first }}</span
        ><strong>{{ format(100 * percentageCase.first) }}</strong
        ><span>× {{ percentageCase.second }}</span
        ><strong>{{ format(100 * percentageCase.first * percentageCase.second) }}</strong>
      </div>
      <p class="result">{{ percentageCase.note }}</p>
      <p class="hint">把原量暂看成100是为了读清百分比；这些倍率对任何正的原量都适用。</p>
    </template>

    <template v-else-if="mode === 'dimensions'">
      <div class="controls" role="group" aria-label="相似放缩倍率">
        <AppButton
          v-for="k in [0.5, 1, 1.5, 2]"
          :key="k"
          type="secondary"
          size="small"
          :aria-pressed="scale === k"
          @click="scale = k"
          >k = {{ k }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 480 245"
        role="img"
        aria-label="原正方形与按k放大的相似正方形，边长同比变化"
      >
        <rect x="35" y="100" width="70" height="70" class="outline blue-fill" />
        <text x="50" y="195">边长 1</text>
        <path d="M145 132H205L193 124 M205 132L193 140" class="axis" />
        <rect
          x="250"
          :y="170 - 70 * scale"
          :width="70 * scale"
          :height="70 * scale"
          class="outline teal-fill"
        />
        <text x="250" y="195">边长 {{ scale }}</text>
      </svg>
      <p class="values">
        <span
          >长度 × <strong>{{ scale }}</strong></span
        ><span
          >面积 × <strong>{{ format(scale ** 2) }}</strong></span
        ><span
          >相似立体体积 × <strong>{{ format(scale ** 3) }}</strong></span
        >
      </p>
      <p class="hint">平面示意用正方形展示面积变化；体积倍率适用于三个方向均同倍放缩的相似立体。</p>
    </template>

    <template v-else>
      <div class="controls" role="group" aria-label="迭代模型">
        <AppButton
          v-for="(label, index) in ['保留40%', '增长10%', '先除4，再加54']"
          :key="label"
          type="secondary"
          size="small"
          :aria-pressed="iterationIndex === index"
          @click="iterationIndex = index"
          >{{ label }}</AppButton
        >
      </div>
      <label class="slider-label" for="ratio-steps">更新次数 n = {{ iterations }}</label
      ><ElSlider
        id="ratio-steps"
        v-model="iterations"
        :min="0"
        :max="7"
        :step="1"
        aria-label="迭代次数"
      />
      <svg
        viewBox="0 0 480 250"
        role="img"
        aria-label="迭代过程，横轴更新次数，纵轴当前值，每个点代表一期"
      >
        <path d="M45 20V210H450" class="axis" />
        <text x="8" y="18">当前值</text>
        <text x="400" y="241">次数 n</text>
        <g v-for="(v, i) in iterationValues" :key="i">
          <line
            :x1="55 + i * 53"
            y1="210"
            :x2="55 + i * 53"
            :y2="210 - (v / iterationMax) * 160"
            class="stem"
          />
          <circle :cx="55 + i * 53" :cy="210 - (v / iterationMax) * 160" r="5" />
          <text :x="55 + i * 53" :y="199 - (v / iterationMax) * 160" text-anchor="middle">
            {{ format(v) }}
          </text>
          <text :x="55 + i * 53" y="228" text-anchor="middle">{{ i }}</text>
        </g>
      </svg>
      <p class="result"><LatexText :text="iterationFormula" /></p>
      <p class="hint">
        {{
          iterationIndex === 2
            ? '从8出发，逐步靠近72；每一步与72的差都缩小为前一步的1/4。'
            : '这里只画每次更新的离散值；比较不同模型时纵轴按各自数据缩放，不用图形高度直接比较两种模型。'
        }}
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElSlider } from 'element-plus'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'
const props = defineProps<{ topic?: string }>()
const modes = [
  'scale',
  'fraction',
  'notation',
  'allocation',
  'context',
  'linear',
  'parts',
  'percentage',
  'power',
  'dimensions',
  'iteration',
] as const
// 精确匹配章节叶子，避免切换考点后沿用其他比例概念的演示。
const sectionIndex = computed(() =>
  Math.max(0, Math.min(10, Number(props.topic?.slice(-2) || 1) - 1)),
)
// 当前考点决定图解形式，章节入口默认第一点。
const mode = computed(() => modes[sectionIndex.value])
const headings = [
  '地图变了，地面距离没变',
  '先选择分母，再读分数',
  '把两组比的公共量对齐',
  '总份数决定每一份',
  '不同质量，不同权重',
  '固定比值，才是正比例',
  '每一步，重新确认整体',
  '涨跌不要相加，倍率才能连乘',
  '同样变化一倍，不同模型有不同响应',
  '一个方向、两个方向、三个方向',
  '观察每一步如何改变当前值',
]
// 标题与当前模式同步，图解可脱离正文独立读懂。
const heading = computed(() => headings[sectionIndex.value])
const instruction = '切换条件，观察关系如何变化；示意用于理解方法，例题区保留原题。'
const palette = ['#2563eb', '#0f766e', '#b45309']
const mapScale = ref(1),
  reference = ref(0),
  aligned = ref(false),
  threeShares = ref(false),
  total = ref(240),
  massA = ref(5),
  graphIndex = ref(0),
  remaining = ref(false),
  percentageIndex = ref(0),
  scale = ref(1.5),
  iterationIndex = ref(0),
  iterations = ref(3)
// 比较基准变化时只改变分式，不修改两份数量。
const fractionFormula = computed(
  () => [String.raw`$A/B=5/3$`, String.raw`$B/A=3/5$`, String.raw`$A/(A+B)=5/8$`][reference.value]!,
)
// 总量与份数分别建模，支持二份和三份分配的同一守恒关系。
const shares = computed(() => (threeShares.value ? [3, 2, 1] : [3, 5]))
// 同一总量必须覆盖全部份数。
const shareSum = computed(() => shares.value.reduce((sum, n) => sum + n, 0))
const linearGraphs = [
  {
    label: '正比例 y = 2x',
    formula: '$y=2x$',
    power: 1,
    k: 2,
    b: 0,
    note: '比值y/x始终为2，直线经过原点。',
  },
  {
    label: '线性 y = 2x + 3',
    formula: '$y=2x+3$',
    power: 1,
    k: 2,
    b: 3,
    note: '斜率仍是2，但有固定的3；y/x不恒定，所以不是正比例。',
  },
  {
    label: '反比例 y = 6/x',
    formula: '$xy=6$',
    power: -1,
    k: 6,
    b: 0,
    note: '乘积xy恒定；仅展示x>0部分。曲线趋近坐标轴但不相交。',
  },
]
const powerGraphs = [
  {
    label: '与 x² 成正比',
    formula: '$y=x^2$',
    power: 2,
    k: 1,
    b: 0,
    note: 'x翻倍，y变为4倍；不是只翻倍。',
  },
  {
    label: '与 x² 成反比',
    formula: '$y=4/x^2$',
    power: -2,
    k: 4,
    b: 0,
    note: 'x翻倍，y变为1/4；这里仅展示正变量。',
  },
  {
    label: '与 √x 成正比',
    formula: String.raw`$y=3\sqrt{x}$`,
    power: 0.5,
    k: 3,
    b: 0,
    note: 'x变为4倍，y才变为2倍。',
  },
]
// 比例与函数节点比较截距，正反比例节点比较幂；二者使用同一坐标尺度。
const graphChoices = computed(() => (mode.value === 'linear' ? linearGraphs : powerGraphs))
// 选择项同时驱动公式、图线和数据表。
const graphChoice = computed(() => graphChoices.value[graphIndex.value]!)
// 图像、表格共用同一函数，防止展示值和画线规则不一致。
function graphValue(x: number) {
  const g = graphChoice.value
  return g.k * x ** g.power + g.b
}
// 仅绘制有限且在坐标窗口中的点；倒数图不跨越零点连接。
const graphPath = computed(() => {
  let path = ''
  let connected = false
  for (let i = 0; i <= 300; i++) {
    const x = i / 50
    const y = graphValue(x)
    if (!Number.isFinite(y) || y < 0 || y > 14) {
      connected = false
      continue
    }
    path += `${connected ? 'L' : 'M'}${50 + x * 60},${235 - y * 15} `
    connected = true
  }
  return path
})
const percentageCases = [
  {
    label: '先降10%，再涨10%',
    first: 0.9,
    second: 1.1,
    note: '结果99，整体下降1%，两次变化不抵消。',
  },
  {
    label: '先涨25%，再降20%',
    first: 1.25,
    second: 0.8,
    note: '结果100，两个倍率互为倒数，才回到原值。',
  },
  {
    label: '先涨125%，再降40%',
    first: 2.25,
    second: 0.6,
    note: '结果135，整体增加35%，不是增加85%。',
  },
]
// 每种情境明确保存两次倍率与最终比较基准。
const percentageCase = computed(() => percentageCases[percentageIndex.value]!)
// 递推按顺序更新当前值，保留x0以区分项数与更新次数。
const iterationValues = computed(() => {
  const values = [iterationIndex.value === 2 ? 8 : 100]
  for (let i = 0; i < iterations.value; i++) {
    const last = values[values.length - 1]!
    values.push(
      iterationIndex.value === 0
        ? last * 0.4
        : iterationIndex.value === 1
          ? last * 1.1
          : last / 4 + 54,
    )
  }
  return values
})
// 纵轴随当前模型缩放，确保所有离散值可见。
const iterationMax = computed(() => Math.max(100, ...iterationValues.value))
// 与递推规则对应展示式子，避免只凭图形记忆。
const iterationFormula = computed(
  () =>
    [
      String.raw`$A_n=100(0.4)^n$`,
      String.raw`$A_n=100(1.1)^n$`,
      String.raw`$x_{n+1}=x_n/4+54,\quad x_0=8$`,
    ][iterationIndex.value]!,
)
// 展示精度不参与计算，避免连续迭代因每步舍入而漂移。
function format(value: number) {
  return Number(value.toFixed(4)).toLocaleString('en-US', { maximumFractionDigits: 4 })
}
</script>

<style scoped lang="scss">
.ratio-atlas {
  margin: 0;
  padding: 24px;
  min-width: 0;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: 14px;
  background: linear-gradient(135deg, #f2f7ff, #f7fcfb);
  color: var(--color-ink);
}
figcaption > span {
  font-size: 12px;
  letter-spacing: 1px;
  color: var(--color-learning-blue);
  font-weight: 700;
}
h5 {
  font-size: 20px;
  margin: 14px 0 8px;
  line-height: 1.5;
}
figcaption p,
.hint {
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-ink-soft);
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}
.controls :deep(.app-button.el-button) {
  margin: 0;
  max-width: 100%;
  height: auto;
  min-height: 32px;
  white-space: normal;
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-border: var(--color-learning-blue-line);
  --app-button-active-bg: var(--color-learning-blue-soft);
  --app-button-active-border: var(--color-learning-blue);
}
.controls :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue);
  --app-button-color: var(--color-ink-inverse);
  --app-button-hover-bg: var(--color-learning-blue);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue);
  --app-button-active-border: var(--color-learning-blue);
}
svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 600px;
  margin: 18px auto;
  background: #fff;
  border-radius: 10px;
}
svg text {
  fill: #334155;
  font-size: 14px;
}
circle {
  fill: #2563eb;
}
.blue-fill {
  fill: #bfdbfe;
  background: #93c5fd;
}
.teal-fill {
  fill: #99f6e4;
  background: #5eead4;
}
.outline {
  stroke: #64748b;
  stroke-width: 1.5;
}
.blue-line {
  stroke: #2563eb;
  stroke-width: 4;
  fill: none;
}
.teal-line {
  stroke: #0f766e;
  stroke-width: 4;
  fill: none;
}
.axis {
  stroke: #64748b;
  stroke-width: 1.5;
  fill: none;
}
.grid {
  stroke: #e2e8f0;
  stroke-width: 1;
  fill: none;
}
.stem {
  stroke: #93c5fd;
  stroke-width: 3;
}
.result {
  margin: 16px 0;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.8;
  overflow-wrap: anywhere;
}
.hint {
  padding-top: 12px;
  border-top: 1px solid #d6e4f2;
  margin-bottom: 0;
}
.slider-label {
  display: block;
  font-size: 14px;
  line-height: 1.7;
  margin-top: 18px;
}
.share-bar {
  display: flex;
  overflow: hidden;
  min-height: 52px;
  border-radius: 8px;
  margin: 24px 0;
}
.share-bar span {
  display: grid;
  place-items: center;
  padding: 8px;
  color: white;
  font-size: 14px;
  text-align: center;
}
.values {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  font-size: 15px;
  line-height: 1.8;
}
.table-scroll {
  overflow-x: auto;
  max-width: 100%;
  margin: 20px 0;
}
table {
  border-collapse: collapse;
  width: 100%;
  font-size: 14px;
  text-align: center;
}
caption {
  padding: 8px;
  font-size: 13px;
  color: #64748b;
}
td,
th {
  padding: 12px 8px;
  border-bottom: 1px solid #cbd5e1;
}
.shared {
  background: #e0f2fe;
  color: #1d4ed8;
  font-weight: 700;
}
.mixture-columns {
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  gap: 10px;
  margin: 24px 0;
}
.mixture-columns > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}
.beaker {
  height: 145px;
  width: 80px;
  border: 2px solid #94a3b8;
  border-top: none;
  border-radius: 0 0 15px 15px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.beaker > div {
  width: 100%;
  transition: height 0.2s;
}
.multiplier-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 30px 0;
}
.multiplier-flow strong {
  font-size: 22px;
  color: #1d4ed8;
}
.multiplier-flow span {
  font-size: 14px;
  color: #64748b;
}
@media (max-width: 650px) {
  .ratio-atlas {
    padding: 16px;
  }
  h5 {
    font-size: 18px;
  }
  .result {
    font-size: 15px;
  }
  .controls {
    gap: 6px;
  }
  td,
  th {
    padding: 10px 6px;
  }
  .share-bar span {
    font-size: 12px;
    padding: 6px 4px;
  }
}
</style>
