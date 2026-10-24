<!-- 数学1概率互动图解：七个考纲节点分别演示频数、期望、实验频率、事件分类、列举、样本空间与条件路径。 -->
<template>
  <figure class="probability-atlas">
    <figcaption>
      <span>MATHEMATICS 1 · 概率实验室</span>
      <h5>{{ heading }}</h5>
      <p>{{ invitation }}</p>
    </figcaption>

    <template v-if="topic === '110701'">
      <div class="controls">
        <AppButton
          :type="frequencyView === 'table' ? 'primary' : 'secondary'"
          size="small"
          @click="frequencyView = 'table'"
          >双向表</AppButton
        >
        <AppButton
          :type="frequencyView === 'tree' ? 'primary' : 'secondary'"
          size="small"
          @click="frequencyView = 'tree'"
          >频数树</AppButton
        >
        <AppButton type="secondary" size="small" @click="showMissing = !showMissing">{{
          showMissing ? '隐藏待求格' : '显示补全结果'
        }}</AppButton>
      </div>
      <table v-if="frequencyView === 'table'" class="frequency-table">
        <caption>
          同一组500人的两种记录方式
        </caption>
        <thead>
          <tr>
            <th>类别</th>
            <th>通过</th>
            <th>未通过</th>
            <th>合计</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>女性</th>
            <td>{{ showMissing ? 57 : '?' }}</td>
            <td>143</td>
            <td>200</td>
          </tr>
          <tr>
            <th>男性</th>
            <td class="chosen">{{ showMissing ? 110 : '?' }}</td>
            <td>{{ showMissing ? 190 : '?' }}</td>
            <td>300</td>
          </tr>
          <tr>
            <th>合计</th>
            <td>167</td>
            <td>{{ showMissing ? 333 : '?' }}</td>
            <td>500</td>
          </tr>
        </tbody>
      </table>
      <svg
        v-else
        viewBox="0 0 600 310"
        role="img"
        aria-label="500人先分女性200人与男性300人，再各自分通过与未通过"
      >
        <path
          d="M90 155L260 85M90 155L260 230M280 85L450 40M280 85L450 125M280 230L450 190M280 230L450 275"
          class="branch"
        />
        <circle cx="70" cy="155" r="35" class="node" />
        <text x="70" y="160">500人</text>
        <text x="255" y="76">女性200</text>
        <text x="255" y="225">男性300</text>
        <text x="505" y="42">通过 {{ showMissing ? 57 : '?' }}</text>
        <text x="505" y="130">未通过143</text>
        <text x="505" y="194">通过 {{ showMissing ? 110 : '?' }}</text>
        <text x="505" y="280">未通过 {{ showMissing ? 190 : '?' }}</text>
      </svg>
      <p class="insight">
        {{
          showMissing
            ? '200−143=57；167−57=110。每一处分叉的子项相加都回到母项，总数保持500。'
            : '先找可以用总数减去已知数的位置，再沿另一方向核对。这里每个数的单位都是“人”。'
        }}
      </p>
    </template>

    <template v-else-if="topic === '110702'">
      <div class="controls">
        <AppButton type="primary" size="small" :disabled="coinTrials >= 2000" @click="tossCoins(20)"
          >再抛20次</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :disabled="coinTrials >= 2000"
          @click="tossCoins(100)"
          >再抛100次</AppButton
        >
        <AppButton type="secondary" size="small" @click="resetCoins">重新开始</AppButton>
      </div>
      <p>公平硬币的模拟实验 · 每次正面概率0.5 · 最多2000次</p>
      <div class="metrics">
        <div>
          <small>试验次数</small><strong>{{ coinTrials }}</strong>
        </div>
        <div>
          <small>正面实际次数</small><strong>{{ heads }}</strong>
        </div>
        <div>
          <small>正面期望次数</small><strong>{{ coinTrials / 2 }}</strong>
        </div>
      </div>
      <svg
        viewBox="0 0 600 180"
        role="img"
        :aria-label="'正面实际比例' + coinRate + '，理论概率0.5'"
      >
        <text x="85" y="51">实际比例</text>
        <rect x="165" y="30" width="360" height="30" rx="6" class="empty-bar" />
        <rect x="165" y="30" :width="360 * coinRate" height="30" rx="6" class="filled-bar" />
        <text x="85" y="109">理论概率</text>
        <rect x="165" y="88" width="360" height="30" rx="6" class="empty-bar" />
        <rect x="165" y="88" width="180" height="30" rx="6" class="expected-bar" />
        <line x1="345" y1="20" x2="345" y2="130" class="reference" />
        <text x="165" y="157">0</text>
        <text x="345" y="157">0.5</text>
        <text x="525" y="157">1</text>
      </svg>
      <p class="insight">
        {{
          coinTrials
            ? '本轮正面比例为 ' +
              (coinRate * 100).toFixed(1) +
              '%。实际次数可高于或低于期望；即使刚好相等，也不保证下一批相等。'
            : '点击开始模拟。期望是次数×0.5；尚未实验时没有实测比例，上方空条表示暂无数据。'
        }}
      </p>
    </template>

    <template v-else-if="topic === '110703'">
      <div class="controls">
        <AppButton
          v-for="n in [10, 50, 100, 500, 1000]"
          :key="n"
          :type="sampleSize === n ? 'primary' : 'secondary'"
          size="small"
          @click="sampleSize = n"
          >{{ n }}次</AppButton
        >
      </div>
      <p>
        同一条预设演示序列 · 理论正面概率0.5 · 实测 {{ observedHeads }}/{{ sampleSize }} =
        {{ observedRate.toFixed(3) }}
      </p>
      <svg
        viewBox="0 0 600 285"
        role="img"
        aria-label="累计相对频率折线图；虚线为理论概率0.5，折线可向两侧波动"
      >
        <path d="M50 20V235H565" class="axis" />
        <line x1="50" y1="127.5" x2="565" y2="127.5" class="reference" />
        <text x="25" y="25">1</text>
        <text x="25" y="133">0.5</text>
        <text x="25" y="239">0</text>
        <polyline :points="frequencyPoints" class="curve" />
        <circle :cx="565" :cy="235 - observedRate * 215" r="5" class="marker" />
        <text x="50" y="258">1次</text>
        <text x="540" y="258">{{ sampleSize }}次</text>
      </svg>
      <LatexText
        class="insight"
        :text="
          '相对频率 $=' +
          observedHeads +
          '/' +
          sampleSize +
          '$；样本增加后通常更稳定，但不必每一步都靠近0.5。此图是教学演示，不是对某枚真实硬币公平性的证明。'
        "
      />
    </template>

    <template v-else-if="topic === '110704'">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['奇数 / 偶数', '≤4 / ≥3', '1 / 2']"
          :key="label"
          :type="eventMode === i ? 'primary' : 'secondary'"
          size="small"
          @click="eventMode = i"
          >{{ label }}</AppButton
        >
      </div>
      <svg viewBox="0 0 600 270" role="img" :aria-label="eventDescription">
        <rect x="22" y="15" width="556" height="240" rx="15" class="universe" />
        <ellipse
          :cx="eventMode === 1 ? 250 : 185"
          cy="130"
          :rx="eventMode === 1 ? 125 : 115"
          ry="90"
          class="set-a"
        />
        <ellipse
          :cx="eventMode === 1 ? 350 : 415"
          cy="130"
          :rx="eventMode === 1 ? 125 : 115"
          ry="90"
          class="set-b"
        />
        <text :x="eventMode === 1 ? 185 : 185" y="77">A</text>
        <text :x="eventMode === 1 ? 415 : 415" y="77">B</text>
        <template v-if="eventMode === 0">
          <text x="185" y="140">1 · 3 · 5</text>
          <text x="415" y="140">2 · 4 · 6</text>
        </template>
        <template v-else-if="eventMode === 1">
          <text x="205" y="140">1 · 2</text>
          <text x="300" y="140">3 · 4</text>
          <text x="395" y="140">5 · 6</text>
        </template>
        <template v-else>
          <text x="185" y="140">1</text>
          <text x="415" y="140">2</text>
          <text x="300" y="241">外部：3 · 4 · 5 · 6</text>
        </template>
      </svg>
      <div class="metrics">
        <div>
          <small>是否互斥</small><strong>{{ eventMode === 1 ? '否' : '是' }}</strong>
        </div>
        <div>
          <small>是否完备</small><strong>{{ eventMode === 2 ? '否' : '是' }}</strong>
        </div>
      </div>
      <LatexText class="insight" :text="eventFormula" />
      <p>{{ eventDescription }}</p>
    </template>

    <template v-else-if="topic === '110705'">
      <div class="controls">
        <AppButton type="primary" size="small" @click="revealTriples = !revealTriples">{{
          revealTriples ? '收起筛选颜色' : '标出直角三角形'
        }}</AppButton>
      </div>
      <p>从根号1到根号5选三条边，每组只按从小到大写一次。点击任意组合查看判定。</p>
      <div class="triple-grid">
        <AppButton
          v-for="(triple, i) in triples"
          :key="triple.join('-')"
          :type="selectedTriple === i ? 'primary' : 'secondary'"
          size="small"
          :class="{
            'successful-combination': revealTriples && triple[0]! + triple[1]! === triple[2]!,
          }"
          @click="selectedTriple = i"
        >
          {{ triple.map((n) => '√' + n).join('，') }}
        </AppButton>
      </div>
      <LatexText class="insight" :text="tripleExplanation" />
      <p>
        {{
          revealTriples
            ? '全部10种等可能组合中，123、134、145、235满足勾股关系，共4种，概率4/10。颜色只表示直角条件，不表示其余组合都不是三角形。'
            : '按最小数分组：最小是1有6组，最小是2有3组，最小是3有1组，总共10组。'
        }}
      </p>
    </template>

    <template v-else-if="topic === '110706'">
      <div class="controls">
        <AppButton
          :type="repeatedFaces ? 'secondary' : 'primary'"
          size="small"
          @click="repeatedFaces = false"
          >普通六面骰</AppButton
        >
        <AppButton
          :type="repeatedFaces ? 'primary' : 'secondary'"
          size="small"
          @click="repeatedFaces = true"
          >重复标签骰</AppButton
        >
      </div>
      <label class="slider-label"
        >筛选两数之和大于 {{ threshold
        }}<input v-model.number="threshold" type="range" min="2" max="11" step="1"
      /></label>
      <table class="sample-grid">
        <caption>
          行是X的六个面，列是Y的六个面；相同数字仍占不同格
        </caption>
        <thead>
          <tr>
            <th>X \ Y</th>
            <th v-for="(v, i) in dieY" :key="i">{{ v }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(x, i) in dieX" :key="i">
            <th>{{ x }}</th>
            <td v-for="(y, j) in dieY" :key="j" :class="{ chosen: x + y > threshold }">
              {{ x + y
              }}<span class="sr-only">{{ x + y > threshold ? '符合条件' : '不符合条件' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <LatexText
        class="insight"
        :text="
          '符合条件有 ' +
          favorableFaces +
          ' 格；$P=' +
          favorableFaces +
          '/36$。每格对应一次X面与一次Y面，不能把重复标号删除。'
        "
      />
    </template>

    <template v-else>
      <div class="controls">
        <AppButton
          :type="conditionalView ? 'secondary' : 'primary'"
          size="small"
          @click="conditionalView = false"
          >抽球概率树</AppButton
        >
        <AppButton
          :type="conditionalView ? 'primary' : 'secondary'"
          size="small"
          @click="conditionalView = true"
          >已知条件改分母</AppButton
        >
      </div>
      <template v-if="!conditionalView">
        <div class="controls">
          <AppButton
            :type="replacement ? 'primary' : 'secondary'"
            size="small"
            @click="replacement = true"
            >放回</AppButton
          >
          <AppButton
            :type="replacement ? 'secondary' : 'primary'"
            size="small"
            @click="replacement = false"
            >不放回</AppButton
          >
          <AppButton type="secondary" size="small" @click="differentColors = !differentColors">{{
            differentColors ? '当前：不同色' : '当前：两红'
          }}</AppButton>
        </div>
        <p>袋内3红2蓝 · 连续抽两颗 · 高亮所求路径</p>
        <svg viewBox="0 0 600 310" role="img" :aria-label="treeDescription">
          <path d="M55 155L245 80" :class="['branch', { active: true }]" />
          <path d="M55 155L245 230" :class="['branch', { active: differentColors }]" />
          <path d="M255 80L460 35" :class="['branch', { active: !differentColors }]" />
          <path d="M255 80L460 125" :class="['branch', { active: differentColors }]" />
          <path d="M255 230L460 185" :class="['branch', { active: differentColors }]" />
          <path d="M255 230L460 280" class="branch" />
          <text x="45" y="155">开始</text>
          <text x="242" y="72">红</text>
          <text x="242" y="235">蓝</text>
          <text x="140" y="98">3/5</text>
          <text x="140" y="218">2/5</text>
          <text x="355" y="41">{{ replacement ? '3/5' : '2/4' }}</text>
          <text x="355" y="126">{{ replacement ? '2/5' : '2/4' }}</text>
          <text x="355" y="190">{{ replacement ? '3/5' : '3/4' }}</text>
          <text x="355" y="280">{{ replacement ? '2/5' : '1/4' }}</text>
          <text class="tree-leaf-label" x="510" y="40">红 → 两红</text>
          <text class="tree-leaf-label" x="510" y="131">蓝 → 红蓝</text>
          <text class="tree-leaf-label" x="510" y="191">红 → 蓝红</text>
          <text class="tree-leaf-label" x="510" y="286">蓝 → 两蓝</text>
        </svg>
        <LatexText class="insight" :text="treeFormula" />
        <p>同一路径相乘；“不同色”包含红蓝、蓝红两条互斥路径，必须相加。每处分叉的概率之和均为1。</p>
      </template>
      <template v-else>
        <div class="controls">
          <AppButton
            :type="givenBoy ? 'secondary' : 'primary'"
            size="small"
            @click="givenBoy = false"
            >全体随机选</AppButton
          >
          <AppButton
            :type="givenBoy ? 'primary' : 'secondary'"
            size="small"
            @click="givenBoy = true"
            >已知选中男生</AppButton
          >
        </div>
        <table class="frequency-table">
          <caption>
            目标：选中“游泳男生”；切换条件只改变观察范围
          </caption>
          <thead>
            <tr>
              <th>类别</th>
              <th>游泳</th>
              <th>其他活动</th>
              <th>合计</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>男生</th>
              <td class="chosen">32</td>
              <td>42</td>
              <td :class="{ chosen: givenBoy }">74</td>
            </tr>
            <tr :class="{ excluded: givenBoy }">
              <th>女生</th>
              <td>25</td>
              <td>21</td>
              <td>46</td>
            </tr>
            <tr>
              <th>全体</th>
              <td>57</td>
              <td>63</td>
              <td :class="{ chosen: !givenBoy }">120</td>
            </tr>
          </tbody>
        </table>
        <LatexText
          class="insight"
          :text="
            givenBoy
              ? '已知男生：只在74名男生中找游泳者，$P=32/74=16/37$。女生不再进入分母。'
              : '未加条件：在120人中找32名游泳男生，$P=32/120=4/15$。目标人数相同，但总体不同。'
          "
        />
      </template>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
const frequencyView = ref<'table' | 'tree'>('table')
const showMissing = ref(false)
const coinTrials = ref(0)
const heads = ref(0)
const sampleSize = ref(50)
const eventMode = ref(0)
const revealTriples = ref(false)
const selectedTriple = ref(0)
const repeatedFaces = ref(true)
const threshold = ref(9)
const conditionalView = ref(false)
const replacement = ref(false)
const differentColors = ref(false)
const givenBoy = ref(true)

// 每个考纲叶节点使用独立的说明，避免图解标题与学习范围脱节。
const heading = computed(
  () =>
    ({
      '110701': '同一批人数，表和树互相验证',
      '110702': '实际次数会波动，期望不随历史改变',
      '110703': '放大样本，观察比例如何变化',
      '110704': '完备看是否漏，互斥看是否重',
      '110705': '固定顺序，列全十种组合',
      '110706': '不要合并重复面：一格就是一种结果',
      '110707': '路径改变，概率和分母跟着改变',
    })[props.topic] || '路径改变，概率和分母跟着改变',
)

// 节点提示引导学生操作对应模型，而不是展示通用的重复说明。
const invitation = computed(
  () =>
    ({
      '110701': '切换表示方式，再补全缺失频数；每个分支都要守住总人数。',
      '110702': '模拟公平硬币，比较实际记录与次数×概率。',
      '110703': '查看同一序列的前10到1000次，观察波动而非单调接近。',
      '110704': '切换三种事件划分，观察重叠与遗漏如何影响概率相加。',
      '110705': '点选三个根式的组合，把直角条件转成整数相加。',
      '110706': '切换骰面标签或移动门槛，成功格与分母同步核对。',
      '110707': '比较放回、不放回及已知条件；把每个分数对应到对象。',
    })[props.topic] || '比较不同的抽取条件。',
)

// 随机模拟只写入当前图解状态，不保存学生成绩或学习记录。
function tossCoins(count: number) {
  const remaining = Math.min(count, 2000 - coinTrials.value)
  for (let i = 0; i < remaining; i++) {
    if (Math.random() < 0.5) heads.value++
  }
  coinTrials.value += remaining
}

// 清空本轮演示，使下一轮可以看到不同的随机波动。
function resetCoins() {
  coinTrials.value = 0
  heads.value = 0
}

// 尚无试验时用空条占位，文本同时说明这不是已测得概率为0。
const coinRate = computed(() => (coinTrials.value ? heads.value / coinTrials.value : 0))

// 固定种子仅用于可复现的教学序列，各样本量使用同一序列的前缀。
function createFrequencySequence() {
  let seed = 20261023
  let successes = 0
  return Array.from({ length: 1000 }, (_, index) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    if (seed / 4294967296 < 0.5) successes++
    return { n: index + 1, successes, rate: successes / (index + 1) }
  })
}
const frequencySequence = createFrequencySequence()

// 选定前缀的累计频数保持与折线末点一致。
const observedHeads = computed(() => frequencySequence[sampleSize.value - 1]!.successes)
// 相对频率以当前前缀样本量为分母，不能使用完整序列长度。
const observedRate = computed(() => observedHeads.value / sampleSize.value)
// 每个前缀按自身横轴范围展开，显示实际累计相对频率而非平滑趋势线。
const frequencyPoints = computed(() =>
  frequencySequence
    .slice(0, sampleSize.value)
    .map(
      (point) =>
        50 + ((point.n - 1) / (sampleSize.value - 1)) * 515 + ',' + (235 - point.rate * 215),
    )
    .join(' '),
)

// 同时陈述互斥和完备，避免把“覆盖全部”误读成概率可直接相加。
const eventDescription = computed(
  () =>
    [
      '奇数与偶数不重不漏：既互斥又完备，两类概率之和等于1。',
      'A为不大于4，B为不小于3：覆盖全部但3、4重叠。并集概率为1，两个事件概率之和却大于1。',
      'A为1，B为2：互斥但遗漏3、4、5、6，尚未覆盖整个样本空间。',
    ][eventMode.value]!,
)
// 公式分别表现“不重不漏”“覆盖但重叠”“不重但遗漏”的差异。
const eventFormula = computed(
  () =>
    [
      '$3/6+3/6=1$。直接相加到1需要两类既互斥又完备。',
      '$4/6+4/6=8/6$；重叠算了两次，扣除后 $4/6+4/6-2/6=1$。',
      '$1/6+1/6=1/3$；其余四个结果占 $4/6$，补上后才等于1。',
    ][eventMode.value]!,
)

const triples: [number, number, number][] = [
  [1, 2, 3],
  [1, 2, 4],
  [1, 2, 5],
  [1, 3, 4],
  [1, 3, 5],
  [1, 4, 5],
  [2, 3, 4],
  [2, 3, 5],
  [2, 4, 5],
  [3, 4, 5],
]
// 将根式勾股关系还原为整数条件；未通过仅表示不是直角三角形。
const tripleExplanation = computed(() => {
  const [a, b, c] = triples[selectedTriple.value]!
  return (
    '选中的边为 $\\sqrt{' +
    a +
    '},\\sqrt{' +
    b +
    '},\\sqrt{' +
    c +
    '}$。平方后比较：$' +
    a +
    '+' +
    b +
    '=' +
    (a + b) +
    (a + b === c ? '=' : '\\ne') +
    c +
    '$，' +
    (a + b === c ? '满足勾股关系，是直角三角形。' : '不满足勾股关系，不计入成功组合。')
  )
})

// 重复标签保留六个实际面的位置，数组索引即面身份。
const dieX = computed(() => (repeatedFaces.value ? [1, 1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]))
// 两颗骰子分别保留重复面，不因数值相同而合并列。
const dieY = computed(() => (repeatedFaces.value ? [2, 3, 4, 5, 6, 6] : [1, 2, 3, 4, 5, 6]))
// 有利结果从与网格完全相同的36个有序面组合计算，严格使用大于。
const favorableFaces = computed(() =>
  dieX.value.reduce(
    (count, x) => count + dieY.value.filter((y) => x + y > threshold.value).length,
    0,
  ),
)

// 树的文字替代同时说明放回规则与当前高亮事件，便于非视觉阅读。
const treeDescription = computed(
  () =>
    '3红2蓝连续抽两颗，' +
    (replacement.value ? '放回时第二次仍为3红2蓝。' : '不放回时第二次总数为4。') +
    (differentColors.value ? '高亮红蓝和蓝红两条路径。' : '高亮两红路径。'),
)
// 每一项对应图中的一路，异色事件必须对互斥的两种顺序求和。
const treeFormula = computed(() =>
  differentColors.value
    ? replacement.value
      ? '$P(\\text{不同色})=\\frac35\\frac25+\\frac25\\frac35=\\frac{12}{25}$。'
      : '$P(\\text{不同色})=\\frac35\\frac24+\\frac25\\frac34=\\frac35$。'
    : replacement.value
      ? '$P(\\text{两红})=\\frac35\\frac35=\\frac9{25}$。放回后比例保持不变。'
      : '$P(\\text{两红})=\\frac35\\frac24=\\frac3{10}$。第一颗红球拿走后，只剩2红和4颗球。',
)
</script>

<style scoped lang="scss">
.probability-atlas {
  --prob-blue: var(--color-blue-600, #2451d1);
  --prob-teal: #147c83;
  min-width: 0;
  margin: 0;
  padding: clamp(14px, 2.2vw, 26px);
  border: 1px solid #c9e1e5;
  border-radius: 16px;
  background: linear-gradient(145deg, #f1fbfa, #fff 65%);
  color: #21394f;
  overflow-wrap: anywhere;

  figcaption > span {
    color: var(--prob-teal);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.09em;
  }
  h5 {
    margin: 10px 0;
    font-size: 21px;
    line-height: 1.45;
    color: #172b40;
  }
  p {
    margin: 12px 0;
    line-height: 1.7;
    font-size: 14px;
  }
  svg {
    display: block;
    width: 100%;
    max-width: 620px;
    height: auto;
    margin: 18px auto;
    overflow: visible;
  }
  svg text {
    fill: #243e55;
    font-size: 15px;
    text-anchor: middle;
  }
  :deep(.app-button--primary) {
    --app-button-bg: var(--prob-blue);
    --app-button-border: var(--prob-blue);
    --app-button-hover-bg: #1e40af;
    --app-button-hover-border: #1e40af;
    --app-button-active-bg: #1e3a8a;
    --app-button-active-border: #1e3a8a;
  }
  :deep(.app-button--secondary) {
    color: var(--prob-blue);
    border-color: #bdd0f4;
    --app-button-hover-bg: #eaf1ff;
    --app-button-hover-border: #8cafff;
    --app-button-active-bg: #dbe8ff;
    --app-button-active-border: #789df3;
  }
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}
.controls :deep(.app-button + .app-button),
.triple-grid :deep(.app-button + .app-button) {
  margin-left: 0;
}
.metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin: 18px 0;
}
.metrics > div {
  flex: 1;
  min-width: 86px;
  border-left: 3px solid #b8d5f8;
  padding-left: 12px;
}
.metrics small {
  display: block;
  color: #567188;
  font-size: 12px;
}
.metrics strong {
  display: block;
  margin-top: 5px;
  color: var(--prob-blue);
  font-size: 24px;
}
.insight {
  display: block;
  margin-top: 16px;
  border-left: 3px solid var(--prob-blue);
  padding: 12px 14px;
  background: #eef4ff;
  border-radius: 0 9px 9px 0;
  line-height: 1.8;
  font-size: 14px;
}
.branch {
  fill: none;
  stroke: #b8cbd7;
  stroke-width: 2;
}
.branch.active {
  stroke: var(--prob-blue);
  stroke-width: 3;
}
.node {
  fill: #e6efff;
  stroke: #adc6f8;
}
.axis {
  fill: none;
  stroke: #718aa1;
  stroke-width: 1.5;
}
.reference {
  stroke: var(--prob-teal);
  stroke-width: 1.5;
  stroke-dasharray: 5 5;
}
.empty-bar {
  fill: #e7eef4;
}
.filled-bar,
.marker {
  fill: var(--prob-blue);
}
.expected-bar {
  fill: var(--prob-teal);
}
.curve {
  fill: none;
  stroke: var(--prob-blue);
  stroke-width: 2;
}
.universe {
  fill: #fff;
  stroke: #b8cbd7;
}
.set-a {
  fill: #d5e5ff;
  fill-opacity: 0.7;
  stroke: var(--prob-blue);
}
.set-b {
  fill: #c9efea;
  fill-opacity: 0.6;
  stroke: var(--prob-teal);
}
.frequency-table,
.sample-grid {
  width: 100%;
  max-width: 620px;
  margin: 16px auto;
  border-collapse: collapse;
  font-size: 14px;
  text-align: center;
  table-layout: fixed;
}
caption {
  caption-side: top;
  text-align: left;
  font-size: 12px;
  color: #567188;
  margin-bottom: 10px;
  line-height: 1.7;
}
th,
td {
  border: 1px solid #d4e1ec;
  padding: 10px 5px;
}
th {
  background: #f0f5fb;
  font-weight: 600;
}
.chosen {
  background: #dceaff;
  color: #1948b9;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px #98b9f5;
}
.excluded {
  opacity: 0.45;
}
.triple-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-width: 620px;
  margin: 18px auto;
}
.triple-grid :deep(.app-button) {
  width: 100%;
  min-width: 0;
  padding: 9px 5px;
}
.triple-grid :deep(.successful-combination.app-button--secondary) {
  background: #e1f6ef;
  color: #11695e;
  border-color: #83c5b5;
}
.slider-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 14px;
  margin: 15px 0;
}
.slider-label input {
  flex: 1;
  width: 100%;
  min-width: 110px;
  max-width: 300px;
  accent-color: var(--prob-blue);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 480px) {
  .probability-atlas {
    padding: 12px;
  }
  .probability-atlas h5 {
    font-size: 18px;
  }
  // 手机按600宽坐标缩放后仍保留约12px读数，并遮住穿过文字的分支线。
  .probability-atlas svg text {
    font-size: 24px;
    paint-order: stroke;
    stroke: #f7fcfc;
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  // 放大后的叶节点文字从分支末端右移，最右边仍保留在600宽视框内。
  .probability-atlas svg .tree-leaf-label {
    transform: translateX(12px);
  }
  .controls {
    gap: 6px;
  }
  .controls :deep(.app-button) {
    padding-inline: 9px;
    font-size: 12px;
  }
  .frequency-table,
  .sample-grid {
    font-size: 12px;
  }
  th,
  td {
    padding: 9px 2px;
  }
  .metrics {
    gap: 10px;
  }
  .metrics strong {
    font-size: 21px;
  }
}
</style>
