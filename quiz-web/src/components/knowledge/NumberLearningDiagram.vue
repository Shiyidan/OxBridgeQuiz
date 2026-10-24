<!-- 数学1数章节交互图解：根据14个叶子节点展示数轴、位值、因数、列举与误差区间。 -->
<template>
  <figure class="number-atlas" :aria-label="heading">
    <figcaption>
      <span class="eyebrow">MATHEMATICS 1 · NUMBER</span>
      <h5>{{ heading }}</h5>
      <p>{{ prompt }}</p>
    </figcaption>

    <template v-if="mode === 1">
      <div class="controls">
        <AppButton
          v-for="(value, i) in [0.25, 0.5, 0.81]"
          :key="value"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >x = {{ value }}</AppButton
        >
      </div>
      <svg viewBox="0 0 560 210" role="img" aria-label="0到1之间的数、平方和平方根的数轴比较">
        <title>同一数轴上比较x、x²与√x；负x在0左边</title>
        <path d="M30 120H530" class="axis" />
        <g v-for="tick in [-1, -0.5, 0, 0.5, 1]" :key="tick">
          <path :d="`M${280 + tick * 240} 115v10`" class="axis" />
          <text :x="280 + tick * 240" y="149" text-anchor="middle">{{ tick }}</text>
        </g>
        <g v-for="(point, i) in numberPoints" :key="point.label">
          <path :d="`M${280 + point.value * 240} 120V${35 + i * 23}`" class="guide" />
          <circle
            :cx="280 + point.value * 240"
            cy="120"
            r="5"
            :class="i === 3 ? 'accent-dot' : 'dot'"
          />
          <text :x="280 + point.value * 240" :y="28 + i * 23" text-anchor="middle">
            {{ point.label }}
          </text>
        </g>
      </svg>
      <LatexText class="result" text="$-x<x^3<x^2<x<\sqrt{x}\quad(0<x<1)$" />
      <p class="insight">
        平方使0与1之间的正数更靠近0；开平方使它更靠近1。这个顺序不能照搬到x&gt;1。
      </p>
    </template>

    <template v-else-if="mode === 2">
      <div class="controls">
        <AppButton
          size="small"
          :type="choice === 0 ? 'primary' : 'secondary'"
          :aria-pressed="choice === 0"
          @click="choice = 0"
          >原数 47</AppButton
        ><AppButton
          size="small"
          :type="choice === 1 ? 'primary' : 'secondary'"
          :aria-pressed="choice === 1"
          @click="choice = 1"
          >反转 74</AppButton
        ><AppButton
          size="small"
          :type="choice === 2 ? 'primary' : 'secondary'"
          :aria-pressed="choice === 2"
          @click="choice = 2"
          >小数 4.7</AppButton
        >
      </div>
      <div class="place-grid" aria-live="polite">
        <div v-for="cell in placeCells" :key="cell.place">
          <span>{{ cell.place }}</span
          ><strong>{{ cell.digit }}</strong
          ><small>{{ cell.value }}</small>
        </div>
      </div>
      <LatexText
        class="result"
        :text="
          ['$47=4\\times10+7$', '$74=7\\times10+4$', '$4.7=4\\times1+7\\times0.1$'][choice] ?? ''
        "
      />
      <p class="insight">
        数字4与7没有变，但所在的位改变了它们的贡献。小数点标记个位与十分位之间的界线。
      </p>
    </template>

    <template v-else-if="mode === 3">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['比较分解', '求HCF', '求LCM']"
          :key="label"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >{{ label }}</AppButton
        >
      </div>
      <div class="factor-table">
        <div class="factor-row heading">
          <span>整数</span><span>2的个数</span><span>3的个数</span><span>5的个数</span>
        </div>
        <div class="factor-row"><strong>24</strong><span>3</span><span>1</span><span>0</span></div>
        <div class="factor-row"><strong>40</strong><span>3</span><span>0</span><span>1</span></div>
        <div class="factor-row"><strong>54</strong><span>1</span><span>3</span><span>0</span></div>
        <div v-if="choice" class="factor-row highlighted">
          <strong>{{ choice === 1 ? '最低指数' : '最高指数' }}</strong
          ><span>{{ choice === 1 ? 1 : 3 }}</span
          ><span>{{ choice === 1 ? 0 : 3 }}</span
          ><span>{{ choice === 1 ? 0 : 1 }}</span>
        </div>
      </div>
      <LatexText
        class="result"
        :text="
          choice === 1
            ? '$\\mathrm{HCF}=2^1\\times3^0\\times5^0=2$'
            : choice === 2
              ? '$\\mathrm{LCM}=2^3\\times3^3\\times5=1080$'
              : '$24=2^3\\times3,\\quad40=2^3\\times5,\\quad54=2\\times3^3$'
        "
      />
      <p class="insight">
        HCF必须装在每个数里，所以取共有的最少数量；LCM要容纳每个数的需要，所以取足最高指数。
      </p>
    </template>

    <template v-else-if="mode === 4">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['读分组', '先幂与根', '再加减', '最后相除']"
          :key="label"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >{{ i + 1 }} · {{ label }}</AppButton
        >
      </div>
      <div class="operation-fraction">
        <div>
          <span>完整分子</span
          ><LatexText :text="choice < 1 ? '$3+2^3$' : choice < 2 ? '$3+8$' : '$11$'" />
        </div>
        <div>
          <span>完整分母</span
          ><LatexText :text="choice < 1 ? '$\\sqrt{49}-5$' : choice < 2 ? '$7-5$' : '$2$'" />
        </div>
      </div>
      <LatexText v-if="choice === 3" class="result" text="$\dfrac{11}{2}=5.5$" />
      <p class="insight">
        分数线已经为上下各加了一层括号。先完成分子和分母，再用整个分子除以整个分母。
      </p>
    </template>

    <template v-else-if="mode === 5">
      <div class="controls">
        <AppButton
          size="small"
          :type="choice === 0 ? 'primary' : 'secondary'"
          :aria-pressed="choice === 0"
          @click="choice = 0"
          >完整36格</AppButton
        ><AppButton
          size="small"
          :type="choice === 1 ? 'primary' : 'secondary'"
          :aria-pressed="choice === 1"
          @click="choice = 1"
          >筛出和大于9</AppButton
        >
      </div>
      <div class="dice-grid" role="table" aria-label="骰子X与Y的36种面组合">
        <span class="corner" role="columnheader">X / Y</span
        ><strong v-for="(n, i) in diceY" :key="`y${i}`" role="columnheader"
          >{{ n }}<small v-if="n === 6">{{ i === 4 ? '①' : '②' }}</small></strong
        ><template v-for="(x, row) in diceX" :key="row"
          ><strong role="rowheader"
            >{{ x }}<small v-if="x === 1">{{ row === 0 ? '①' : '②' }}</small></strong
          ><span
            v-for="(y, col) in diceY"
            :key="col"
            role="cell"
            :class="{ hit: choice === 1 && x + y > 9, muted: choice === 1 && x + y <= 9 }"
            >{{ x + y }}</span
          ></template
        >
      </div>
      <LatexText v-if="choice" class="result" text="$P(X+Y>9)=\dfrac{2+3}{36}=\dfrac5{36}$" />
      <p class="insight">①②区分相同数字的不同面。每格仍是1/36；X=4贡献2格，X=5贡献3格。</p>
    </template>

    <template v-else-if="mode === 6">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['平方与平方根', '立方与立方根', '长度选正根']"
          :key="label"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >{{ label }}</AppButton
        >
      </div>
      <svg
        viewBox="0 0 520 185"
        role="img"
        :aria-label="
          choice === 1 ? '负3立方为负27，再开立方回到负3' : '正负3平方都等于9，但根号9只表示正3'
        "
      >
        <title>平方会丢失符号，立方保留符号</title>
        <template v-if="choice === 1">
          <text x="80" y="85" class="large" text-anchor="middle">−3</text>
          <path d="M120 78H220 M210 71L220 78L210 85" class="arrow" />
          <text x="170" y="58" text-anchor="middle">立方</text>
          <text x="260" y="85" class="large" text-anchor="middle">−27</text>
          <path d="M300 78H400 M390 71L400 78L390 85" class="arrow" />
          <text x="350" y="58" text-anchor="middle">立方根</text>
          <text x="445" y="85" class="large" text-anchor="middle">−3</text>
        </template>
        <template v-else>
          <text x="85" y="52" class="large">+3</text>
          <text x="85" y="145" class="large">−3</text>
          <path d="M130 45L230 90 M130 137L230 90" class="arrow" />
          <text x="165" y="35">平方</text>
          <text x="165" y="160">平方</text>
          <text x="250" y="100" class="large">9</text>
          <path d="M285 90H390 M380 83L390 90L380 97" class="arrow" />
          <text x="330" y="65" text-anchor="middle">根号主值</text>
          <text x="410" y="100" class="large">3</text>
        </template>
      </svg>
      <LatexText
        class="result"
        :text="
          choice === 2
            ? '$x^2=25/4\\Rightarrow x=\\pm5/2;\\quad\\text{length}>0\\Rightarrow x=5/2$'
            : choice === 1
              ? '$\\sqrt[3]{-27}=-3$'
              : '$\\sqrt9=3,\\quad x^2=9\\Rightarrow x=\\pm3$'
        "
      />
      <p class="insight">
        根号的主值与方程的全部解不是同一件事。对真实长度再应用“必须为正”的条件。
      </p>
    </template>

    <template v-else-if="mode === 7">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['统一底数', '合并指数', '负指数', '分数指数']"
          :key="label"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >{{ label }}</AppButton
        >
      </div>
      <div class="steps-panel" aria-live="polite">
        <LatexText v-for="line in indexLines[choice]" :key="line" :text="line" />
      </div>
      <p class="insight">
        {{
          [
            '不同底数先改成同底数；(aᵐ)ⁿ的指数相乘。',
            '这里只能合并相乘的幂，2ᵃ+2ᵇ不能写成2ᵃ⁺ᵇ。',
            '负指数表示倒数，不表示负值；底数不能是0。',
            '正底数下，指数分母表示开几次根，分子表示几次方。',
          ][choice]
        }}
      </p>
    </template>

    <template v-else-if="mode === 8">
      <div class="controls">
        <AppButton
          v-for="(n, i) in [-3, 0, 3, 6]"
          :key="n"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >10的{{ n }}次方</AppButton
        >
      </div>
      <div class="place-grid">
        <div><span>系数</span><strong>3.6</strong><small>1 ≤ 3.6 &lt; 10</small></div>
        <div>
          <span>10的指数</span><strong>{{ [-3, 0, 3, 6][choice] }}</strong
          ><small>记录数量级</small>
        </div>
      </div>
      <LatexText class="result" :text="standardValue" />
      <div class="steps-panel">
        <LatexText text="$3.6\times10^4+2\times10^3=(3.6+0.2)\times10^4$" /><LatexText
          text="$=3.8\times10^4$"
        />
      </div>
      <p class="insight">
        加减先统一指数，乘除才把指数相加减。若系数算成36，需要改写为3.6，并把指数增加1。
      </p>
    </template>

    <template v-else-if="mode === 9">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['有限小数', '循环小数', '错位相减']"
          :key="label"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >{{ label }}</AppButton
        >
      </div>
      <div class="digit-strip" aria-label="小数点后数字">
        <span>0.</span><strong>2</strong><strong>3</strong><strong>7</strong
        ><template v-if="choice"
          ><strong class="repeat">2</strong><strong class="repeat">3</strong
          ><strong class="repeat">7</strong><span>…</span></template
        ><template v-else><span>0</span><span>0</span><span>0</span></template>
      </div>
      <div class="steps-panel">
        <template v-if="choice === 0"><LatexText text="$0.237=237/1000=23.7\%$" /></template
        ><template v-else
          ><LatexText text="$x=0.237237\ldots$" /><LatexText
            text="$1000x=237.237237\ldots$" /><LatexText
            v-if="choice === 2"
            text="$999x=237\Rightarrow x=\dfrac{79}{333}$"
        /></template>
      </div>
      <p class="insight">
        有限小数的分母是10的幂。循环小数通过相减消去重复尾巴，不能直接把循环节放到1000下面。
      </p>
    </template>

    <template v-else-if="mode === 10">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['原有100份', '先花35%', '再花剩余的1/3']"
          :key="label"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >{{ label }}</AppButton
        >
      </div>
      <svg viewBox="0 0 520 185" role="img" aria-label="总量100份，花掉35份，剩余65份再分为三等份">
        <title>第二次支出的整体是剩余65份</title>
        <rect x="25" y="35" width="470" height="48" rx="5" class="base-fill" />
        <rect v-if="choice" x="25" y="35" width="164.5" height="48" class="spent-fill" />
        <rect
          v-if="choice === 2"
          x="189.5"
          y="35"
          :width="305.5 / 3"
          height="48"
          class="second-fill"
        />
        <text x="105" y="65" text-anchor="middle">{{ choice ? '已花35份' : '整体100份' }}</text>
        <text v-if="choice" x="350" y="65" text-anchor="middle">
          {{ choice === 1 ? '剩余65份' : '剩余43⅓份' }}
        </text>
        <path
          v-if="choice === 2"
          d="M189.5 96H495 M189.5 90v12 M291.33 90v12 M393.17 90v12 M495 90v12"
          class="axis"
        />
        <text v-if="choice === 2" x="342" y="132" text-anchor="middle">
          把剩下的65份重新分成3等份
        </text>
      </svg>
      <LatexText
        class="result"
        :text="
          choice === 2
            ? '$2700\\times0.65\\times\\dfrac23=1170$'
            : choice === 1
              ? '$2700\\times(1-35\\%)=1755$'
              : '$2700\\text{ pounds}\\leftrightarrow100\\%$'
        "
      />
      <p class="insight">
        图解只展示百分比与分数两次支出；若还有固定支出，再从结果中扣除。第二次的“1/3”不是原来2700的1/3。
      </p>
    </template>

    <template v-else-if="mode === 11">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['提平方因子', '平方展开', '共轭有理化']"
          :key="label"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >{{ label }}</AppButton
        >
      </div>
      <svg
        v-if="choice === 0"
        viewBox="0 0 520 170"
        role="img"
        aria-label="四个面积为2的小正方形拼成面积8的大正方形"
      >
        <title>四块面积2的正方形，边长合为2√2，面积8</title>
        <rect
          v-for="(cell, i) in [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
          ]"
          :key="i"
          :x="40 + cell[0]! * 60"
          :y="20 + cell[1]! * 60"
          width="60"
          height="60"
          class="tile"
        />
        <text x="70" y="55" text-anchor="middle">2</text>
        <text x="130" y="55" text-anchor="middle">2</text>
        <text x="70" y="115" text-anchor="middle">2</text>
        <text x="130" y="115" text-anchor="middle">2</text>
        <text x="230" y="66">小块边长 √2</text>
        <text x="230" y="102">大块边长 2√2 = √8</text>
      </svg>
      <div class="steps-panel">
        <LatexText v-for="line in surdLines[choice]" :key="line" :text="line" />
      </div>
      <p class="insight">
        {{
          [
            '开平方可以把完全平方因子提出根号；四块面积不是四倍边长。',
            '展开必须有两倍交叉项；根式不是把根号里的数字直接相减。',
            '分子分母同乘共轭，利用(a+b)(a−b)=a²−b²。',
          ][choice]
        }}
      </p>
    </template>

    <template v-else-if="mode === 12">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['面积下界', '面积上界', '长度÷宽度的上界']"
          :key="label"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >{{ label }}</AppButton
        >
      </div>
      <div class="bound-lines">
        <LatexText text="$7.35\le L<7.45$" /><LatexText text="$2.55\le W<2.65$" />
      </div>
      <div class="place-grid">
        <div>
          <span>长度选择</span><strong>{{ choice === 0 ? '7.35' : '7.45' }}</strong>
        </div>
        <div>
          <span>宽度选择</span><strong>{{ choice === 1 ? '2.65' : '2.55' }}</strong>
        </div>
      </div>
      <LatexText
        class="result"
        :text="
          choice === 0
            ? '$A\\ge7.35\\times2.55=18.7425$'
            : choice === 1
              ? '$A<7.45\\times2.65=19.7425$'
              : '$\\dfrac LW<\\dfrac{7.45}{2.55}=\\dfrac{149}{51}$'
        "
      />
      <p class="insight">
        {{
          choice === 2
            ? '要让正数商尽量大：分子尽量大，分母尽量小。不能把两个量都取上界。'
            : '长度上端点不包含，所以面积上界也不包含；下界在本例可以取得。'
        }}
      </p>
    </template>

    <template v-else-if="mode === 13">
      <div class="controls">
        <AppButton
          v-for="(label, i) in ['舍入到0.1', '正数截断', '负数向零截断']"
          :key="label"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >{{ label }}</AppButton
        >
      </div>
      <svg viewBox="0 0 520 165" role="img" :aria-label="intervalDescription">
        <title>{{ intervalDescription }}</title>
        <path d="M35 85H485" class="axis" />
        <path d="M110 85H410" class="range" />
        <circle cx="110" cy="85" r="7" :class="choice === 2 ? 'open-dot' : 'dot'" />
        <circle cx="410" cy="85" r="7" :class="choice === 2 ? 'dot' : 'open-dot'" />
        <text x="110" y="122" text-anchor="middle">
          {{ choice === 0 ? '2.35' : choice === 1 ? '2.4' : '−2.5' }}
        </text>
        <text x="410" y="122" text-anchor="middle">
          {{ choice === 0 ? '2.45' : choice === 1 ? '2.5' : '−2.4' }}
        </text>
        <text x="260" y="43" text-anchor="middle">
          {{ choice === 2 ? '显示 −2.4' : '显示 2.4' }}
        </text>
      </svg>
      <LatexText
        class="result"
        :text="
          choice === 0 ? '$2.35\\le x<2.45$' : choice === 1 ? '$2.4\\le x<2.5$' : '$-2.5<x\\le-2.4$'
        "
      />
      <p class="insight">
        实心端点包含，空心端点不包含。舍入例按通常正数“四舍五入”规则；截断按去掉后续数字、向零处理。
      </p>
    </template>

    <template v-else>
      <div class="controls">
        <AppButton
          v-for="(n, i) in [53, 600, 15]"
          :key="n"
          size="small"
          :type="choice === i ? 'primary' : 'secondary'"
          :aria-pressed="choice === i"
          @click="choice = i"
          >√{{ n }} 在哪里？</AppButton
        >
      </div>
      <div class="estimate-scale">
        <div>
          <strong>{{ estimate.floor }}²</strong><span>{{ estimate.floor ** 2 }}</span>
        </div>
        <span>&lt;</span>
        <div class="target">
          <strong>{{ estimate.n }}</strong
          ><span>目标平方</span>
        </div>
        <span>&lt;</span>
        <div>
          <strong>{{ estimate.floor + 1 }}²</strong><span>{{ (estimate.floor + 1) ** 2 }}</span>
        </div>
      </div>
      <LatexText
        class="result"
        :text="`$${estimate.floor}<\\sqrt{${estimate.n}}<${estimate.floor + 1}$`"
      />
      <p class="insight">
        {{
          choice === 1
            ? '若p是素数且p²<600，先由夹逼得p≤24，再检验24以下最大的素数是23。估算只缩小范围，不能代替素数检查。'
            : '两边都是非负数，开平方保持大小次序。题目只问区间时，不必求根式小数。'
        }}
      </p>
    </template>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
const choice = ref(0)
// 每个叶子展示对应的数学结构，整章默认从大小关系开始。
const mode = computed(() => Math.max(1, Math.min(14, Number(props.topic.slice(-2)) || 1)))
const headings = [
  '0到1之间，平方反而变小',
  '同一数字，不同位值',
  '素因子的指数就是数量清单',
  '分数线是一层大括号',
  '先列全，再筛选',
  '根号值与方程根分开看',
  '指数运算先统一底数',
  '系数记录有效数字，指数记录量级',
  '有限尾巴与循环尾巴不同',
  '剩余部分成为新的整体',
  '保留根式，看清几何与结构',
  '上界由增减关系决定',
  '误差区间看端点是否包含',
  '不求小数，也能锁定范围',
]
// 标题与每个知识点图解对应，避免章节切换后保留旧标题。
const heading = computed(() => headings[mode.value - 1] ?? headings[0])
// 交互说明只解释操作目标，不预先泄露后面的自测答案。
const prompt = computed(() =>
  mode.value === 5
    ? '切换筛选状态，观察相同数字为何仍对应不同的等可能面。'
    : '点选不同步骤或情形，对照公式与图中的变化。',
)
// 选取能够直观看出平方与开方顺序的正数，所有坐标由数值计算。
const numberPoints = computed(() => {
  const x = [0.25, 0.5, 0.81][choice.value] ?? 0.25
  return [
    { label: '−x', value: -x },
    { label: 'x²', value: x * x },
    { label: 'x', value: x },
    { label: '√x', value: Math.sqrt(x) },
  ]
})
// 位值按实际贡献展示，数字反转不只交换文字位置。
const placeCells = computed(() =>
  choice.value === 2
    ? [
        { place: '个位', digit: 4, value: '4 × 1 = 4' },
        { place: '十分位', digit: 7, value: '7 × 0.1 = 0.7' },
      ]
    : [
        {
          place: '十位',
          digit: choice.value ? 7 : 4,
          value: choice.value ? '7 × 10 = 70' : '4 × 10 = 40',
        },
        {
          place: '个位',
          digit: choice.value ? 4 : 7,
          value: choice.value ? '4 × 1 = 4' : '7 × 1 = 7',
        },
      ],
)
const diceX = [1, 1, 2, 3, 4, 5]
const diceY = [2, 3, 4, 5, 6, 6]
const indexLines = [
  ['$2^{3+2x}4^x8^{-x}$', '$=2^{3+2x}2^{2x}2^{-3x}$'],
  ['$2^{3+2x+2x-3x}=2^{3+x}$', '$4\\sqrt2=2^{5/2}$', '$3+x=5/2\\Rightarrow x=-1/2$'],
  ['$2^{-3}=1/2^3=1/8$', '$(-2)^{-3}=-1/8$'],
  ['$27^{2/3}=(\\sqrt[3]{27})^2=9$', '$27^{-2/3}=1/9$'],
]
// 科学计数法使用同一系数，切换指数只改变数量级。
const standardValue = computed(() => {
  const power = [-3, 0, 3, 6][choice.value] ?? -3
  return `$3.6\\times10^{${power}}=${[0.0036, 3.6, 3600, 3600000][choice.value]}$`
})
const surdLines = [
  ['$\\sqrt8=\\sqrt{4\\times2}=2\\sqrt2$'],
  ['$(\\sqrt3-\\sqrt2)^2=3-2\\sqrt6+2$', '$=5-2\\sqrt6$'],
  [
    '$\\dfrac1{\\sqrt3-\\sqrt2}\\times\\dfrac{\\sqrt3+\\sqrt2}{\\sqrt3+\\sqrt2}$',
    '$=\\dfrac{\\sqrt3+\\sqrt2}{3-2}=\\sqrt3+\\sqrt2$',
  ],
]
// 读屏说明同时提供端点数值与开闭信息。
const intervalDescription = computed(
  () =>
    ['2.35包含到2.45不包含', '2.4包含到2.5不包含', '负2.5不包含到负2.4包含'][choice.value] ?? '',
)
// 相邻整数平方给出严格根式区间；当前示例均不是完全平方数。
const estimate = computed(() => {
  const n = [53, 600, 15][choice.value] ?? 53
  return { n, floor: Math.floor(Math.sqrt(n)) }
})
watch(
  () => props.topic,
  () => {
    choice.value = 0
  },
)
</script>

<style scoped lang="scss">
.number-atlas {
  margin: 0;
  padding: 22px;
  min-width: 0;
  border: 1px solid #bfdcfa;
  border-radius: 14px;
  background: linear-gradient(135deg, #f4f8ff, #f1faf8);
  color: #173850;
}
.eyebrow {
  color: #087e87;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
h5 {
  font-size: 20px;
  margin: 10px 0;
}
p {
  margin: 8px 0 16px;
  line-height: 1.75;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.result {
  display: block;
  padding: 16px 10px;
  margin-top: 12px;
  background: #e4f3f6;
  border-radius: 9px;
  text-align: center;
  overflow-x: auto;
}
.insight {
  margin: 16px 0 0;
  padding: 8px 0 8px 12px;
  border-left: 3px solid #168f9a;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 230px;
  font-size: 14px;
  fill: #23475d;
}
.axis {
  fill: none;
  stroke: #7089a0;
  stroke-width: 1.4;
}
.guide {
  fill: none;
  stroke: #9db3ca;
  stroke-dasharray: 3 3;
}
.dot {
  fill: #2a5adb;
}
.accent-dot {
  fill: #098d88;
}
.open-dot {
  fill: #fff;
  stroke: #2a5adb;
  stroke-width: 3;
}
.range {
  stroke: #2a5adb;
  stroke-width: 5;
}
.arrow {
  fill: none;
  stroke: #3573c8;
  stroke-width: 2;
}
.large {
  font-size: 27px;
  font-weight: 700;
}
.place-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.place-grid > div {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 20px 10px;
  background: white;
  border: 1px solid #d7e4f1;
  border-radius: 9px;
}
.place-grid strong {
  font-size: 34px;
  color: #2a5adb;
}
.place-grid small,
.place-grid span {
  color: #60758c;
}
.factor-table {
  font-size: 14px;
  background: white;
  border-radius: 9px;
  overflow: hidden;
}
.factor-row {
  display: grid;
  grid-template-columns: 1.2fr repeat(3, 1fr);
  gap: 4px;
  text-align: center;
  border-bottom: 1px solid #e0e8f1;
  padding: 12px 4px;
}
.factor-row.heading {
  color: #60758c;
  background: #eaf1fa;
}
.highlighted {
  background: #dff4ed;
  color: #087e75;
}
.operation-fraction {
  display: grid;
  margin: 10px auto;
  max-width: 360px;
  background: white;
  padding: 16px;
  border-radius: 9px;
}
.operation-fraction > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 14px;
}
.operation-fraction > div:first-child {
  border-bottom: 2px solid #345a82;
}
.operation-fraction span {
  font-size: 13px;
  color: #76889b;
}
.dice-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 3px;
  text-align: center;
  font-size: 14px;
}
.dice-grid > * {
  padding: 10px 2px;
  background: white;
  border-radius: 4px;
}
.dice-grid strong {
  background: #e4edf9;
}
.dice-grid small {
  font-size: 10px;
}
.dice-grid .hit {
  background: #087f83;
  color: white;
  font-weight: 700;
}
.dice-grid .muted {
  color: #8f9eac;
}
.corner {
  font-size: 12px;
}
.steps-panel {
  display: grid;
  gap: 14px;
  background: white;
  border-radius: 9px;
  padding: 20px 12px;
  text-align: center;
  overflow-x: auto;
}
.digit-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
  margin: 16px 0;
}
.digit-strip > * {
  padding: 10px 8px;
  font-size: 22px;
}
.digit-strip strong {
  background: #dceafe;
  color: #2457cc;
  border-bottom: 2px solid #3470d2;
}
.digit-strip .repeat {
  background: #d7f0eb;
  color: #0c7f79;
  border-color: #0c7f79;
}
.base-fill {
  fill: #ccece8;
}
.spent-fill {
  fill: #c7d3e7;
}
.second-fill {
  fill: #b1cef5;
}
.tile {
  fill: #d8e9fd;
  stroke: #3979bd;
  stroke-width: 2;
}
.bound-lines {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}
.estimate-scale {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.estimate-scale > div {
  display: grid;
  gap: 10px;
  flex: 1;
  padding: 18px 5px;
  text-align: center;
  background: white;
  border-radius: 8px;
}
.estimate-scale strong {
  font-size: 24px;
}
.estimate-scale span {
  color: #668096;
}
.estimate-scale .target {
  background: #dfecff;
  color: #2457cc;
}
@media (max-width: 600px) {
  .number-atlas {
    padding: 14px;
  }
  h5 {
    font-size: 18px;
  }
  .dice-grid > * {
    padding: 8px 0;
  }
  .dice-grid {
    font-size: 12px;
  }
  .place-grid strong {
    font-size: 27px;
  }
  .factor-row {
    font-size: 12px;
  }
  .estimate-scale {
    gap: 6px;
  }
  .estimate-scale strong {
    font-size: 20px;
  }
}

.controls :deep(.app-button) {
  white-space: normal;
  max-width: 100%;
  margin: 0;
  height: auto;
  min-height: 32px;
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-border: var(--color-learning-blue-line);
  --app-button-active-bg: var(--color-learning-blue-soft);
  --app-button-active-border: var(--color-learning-blue);
}
.controls :deep(.app-button--primary) {
  --app-button-bg: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue);
  --app-button-color: var(--color-ink-inverse);
  --app-button-hover-bg: var(--color-learning-blue);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue);
  --app-button-active-border: var(--color-learning-blue);
}
</style>
