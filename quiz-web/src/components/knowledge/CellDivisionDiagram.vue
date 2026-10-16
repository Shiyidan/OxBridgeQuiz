<!-- ESAT B3 互动图谱：按真实计数绘制染色体分配、繁殖和通常 XX/XY 受精模型。 -->
<template>
  <BiologyAtlasFrame :title="title" :subtitle="subtitle" :note="note">
    <template #controls>
      <AppButton
        v-for="(item, index) in choices"
        :key="item.label"
        type="secondary"
        size="small"
        :aria-pressed="selected === index"
        @click="selected = index"
        >{{ item.label }}</AppButton
      >
    </template>
    <svg
      class="division-illustration"
      viewBox="0 0 800 440"
      role="img"
      :aria-labelledby="id('title') + ' ' + id('description')"
    >
      <title :id="id('title')">{{ title }}：{{ current.label }}</title>
      <desc :id="id('description')">{{ current.accessible }}</desc>
      <defs>
        <radialGradient :id="id('cytoplasm')" cx="35%" cy="30%" r="80%">
          <stop offset="0" class="surface-stop" />
          <stop offset="0.7" class="blue-soft-stop" />
          <stop offset="1" class="blue-line-stop" />
        </radialGradient>
        <radialGradient :id="id('nucleus')" cx="30%" cy="25%" r="85%">
          <stop offset="0" class="surface-stop" />
          <stop offset="1" class="violet-soft-stop" />
        </radialGradient>
        <linearGradient :id="id('leaf')" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" class="teal-soft-stop" />
          <stop offset="1" class="teal-line-stop" />
        </linearGradient>
        <g :id="id('cell')">
          <path
            class="cell-border"
            :fill="paint('cytoplasm')"
            d="M-137-11C-149-67-105-120-45-123C2-144 75-121 112-79C154-47 147 28 120 66C99 120 33 137-22 120C-80 132-126 89-133 40C-148 22-149 4-137-11Z"
          />
          <path
            class="membrane-inner"
            d="M-130-9C-142-63-101-113-43-116C3-137 71-114 107-74C147-44 140 26 114 62C94 113 33 130-21 113C-76 125-119 85-126 38C-141 20-142 6-130-9Z"
          />
          <g class="cytoplasm-granules">
            <circle
              v-for="point in granules"
              :key="point[0] + ':' + point[1]"
              :cx="point[0]"
              :cy="point[1]"
              r="2"
            />
          </g>
          <g
            v-for="(mito, i) in [
              [-97, -51, -20],
              [93, 69, 35],
              [-66, 95, 10],
            ]"
            :key="i"
            :transform="`translate(${mito[0]} ${mito[1]}) rotate(${mito[2]})`"
          >
            <ellipse class="mitochondrion" rx="15" ry="7" />
            <path class="mitochondrial-fold" d="M-10 0L-6-3-3 3 1-3 5 3 10 0" />
          </g>
        </g>
        <g :id="id('centrosome')">
          <path class="aster" d="M-12 0H12M0-12V12M-9-9L9 9M-9 9L9-9M-5-12L5 12M-12-5L12 5" />
          <rect
            class="centriole"
            x="-6"
            y="-4"
            width="9"
            height="4"
            rx="1"
            transform="rotate(25)"
          />
          <rect class="centriole" x="0" y="0" width="4" height="9" rx="1" transform="rotate(25)" />
        </g>
        <g :id="id('leaf-shape')">
          <path class="leaf" :fill="paint('leaf')" d="M0 0C-43-6-71-34-61-66C-28-72 3-39 0 0Z" />
          <path class="leaf-vein" d="M-2-4L-54-59M-19-24L-39-28M-32-39L-34-54M-40-45L-55-47" />
        </g>
        <g :id="id('plant')">
          <path class="stem" d="M0 0C-2-30 4-58 0-86M0-44L-22-66M0-65L25-92" />
          <use :href="'#' + id('leaf-shape')" transform="translate(-4 -48) rotate(-25)" />
          <use
            :href="'#' + id('leaf-shape')"
            transform="translate(5 -65) scale(-1 1) rotate(-20)"
          />
          <use :href="'#' + id('leaf-shape')" transform="translate(0 -85) rotate(35) scale(.7)" />
          <path
            class="roots"
            d="M0 0L-5 38M-3 10L-27 31M-1 17L18 42M-6 24L-17 45M11 31L29 38M-19 24L-32 24"
          />
        </g>
        <marker :id="id('arrow')" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path class="arrow-head" d="M0 0L7 4L0 8Z" />
        </marker>
      </defs>

      <template v-if="mode === 'mitosis' || mode === 'meiosis'">
        <text class="stage-kicker" x="400" y="30" text-anchor="middle">{{ current.headline }}</text>
        <g
          v-for="(cell, index) in cells"
          :key="index"
          :transform="`translate(${cell.x} ${cell.y}) scale(${cell.scale})`"
        >
          <use :href="'#' + id('cell')" />
          <g v-if="cell.nucleus">
            <ellipse class="nuclear-envelope" rx="85" ry="91" :fill="paint('nucleus')" />
            <ellipse class="nuclear-inner" rx="80" ry="86" />
            <path class="nuclear-pores" d="M-85-9h7M-40-80l4 6M47-74l-4 6M82 23l-7-2M-30 86l2-7" />
          </g>
          <g v-if="cell.spindle">
            <path
              v-for="(chromosome, i) in cell.chromosomes"
              :key="'fibre-' + i"
              class="spindle"
              :d="spindlePath(chromosome, cell.spindle)"
            />
            <path class="spindle-faint" d="M-112 0Q0-133 112 0M-112 0Q0 133 112 0" />
            <use :href="'#' + id('centrosome')" x="-112" />
            <use :href="'#' + id('centrosome')" x="112" />
          </g>
          <g
            v-for="(chromosome, i) in cell.chromosomes"
            :key="i"
            :transform="`translate(${chromosome.x} ${chromosome.y})`"
            :class="['chromosome', chromosome.origin]"
          >
            <template v-if="chromosome.paired">
              <path
                class="chromatid"
                :d="`M-10 ${-chromosome.length / 2}Q-12 -10 0 0Q10 10 10 ${chromosome.length / 2}`"
              />
              <path
                class="chromatid"
                :d="`M10 ${-chromosome.length / 2}Q12 -10 0 0Q-10 10-10 ${chromosome.length / 2}`"
              />
              <path class="chromatid-shine" :d="`M-11 ${-chromosome.length / 2 + 4}Q-10 -8 1 1`" />
            </template>
            <template v-else>
              <path
                class="chromatid"
                :d="`M2 ${-chromosome.length / 2}Q-5 -9 0 0T-1 ${chromosome.length / 2}`"
              />
              <path class="chromatid-shine" :d="`M0 ${-chromosome.length / 2 + 4}Q-6 -7-2 1`" />
            </template>
            <ellipse class="centromere" :rx="chromosome.paired ? 5 : 4.4" ry="4" />
          </g>
        </g>
        <g v-for="(cell, index) in cells" :key="'label-' + index">
          <text class="cell-label" :x="cell.x" y="392" text-anchor="middle">{{ cell.label }}</text>
          <text class="cell-count" :x="cell.x" y="420" text-anchor="middle">{{ cell.count }}</text>
        </g>
        <g v-if="mode === 'mitosis' && selected === 2" class="callout">
          <path d="M400 129L550 88H650" />
          <text x="558" y="78">着丝粒区域</text>
          <circle cx="400" cy="129" r="3" />
        </g>
        <g v-if="mode === 'meiosis' && selected === 0" class="callout">
          <path d="M345 177L226 90H100" />
          <text x="100" y="79">同源的一对</text>
        </g>
      </template>

      <template v-else-if="mode === 'reproduction' && selected === 0">
        <text class="stage-kicker" x="400" y="32" text-anchor="middle">
          匍匐茎形成新植株：没有配子融合
        </text>
        <path class="soil-fill" d="M40 275Q220 266 400 276T760 274V350H40Z" />
        <path class="soil-line" d="M40 275Q220 266 400 276T760 274" />
        <g
          v-for="x in [70, 105, 140, 250, 310, 390, 450, 515, 660, 710]"
          :key="x"
          class="soil-speck"
        >
          <ellipse :cx="x" :cy="302 + (x % 3) * 9" rx="4" ry="2" />
        </g>
        <use :href="'#' + id('plant')" transform="translate(205 274) scale(1.4)" />
        <path class="runner" d="M208 264C310 245 375 280 454 270S545 251 600 273" />
        <use :href="'#' + id('plant')" transform="translate(600 274) scale(.88)" />
        <g class="callout">
          <path d="M385 268L417 187H508" />
          <text x="423" y="175">匍匐茎</text>
          <circle cx="385" cy="268" r="3" />
        </g>
        <text class="cell-label" x="200" y="378" text-anchor="middle">亲本植株</text>
        <text class="cell-label" x="600" y="378" text-anchor="middle">新植株</text>
        <text class="cell-count" x="400" y="413" text-anchor="middle">
          无突变时，遗传组成相同；生长环境仍可影响外观
        </text>
      </template>

      <template v-else>
        <text class="stage-kicker" x="400" y="32" text-anchor="middle">{{ current.headline }}</text>
        <g transform="translate(155 202)">
          <circle class="egg-coat" r="87" />
          <circle class="egg-coat-inner" r="80" />
          <circle class="egg-membrane" r="69" :fill="paint('cytoplasm')" />
          <g class="egg-follicles">
            <circle
              v-for="angle in eggAngles"
              :key="angle"
              :cx="97 * Math.cos(angle)"
              :cy="97 * Math.sin(angle)"
              r="7"
            />
          </g>
          <ellipse class="nuclear-envelope" rx="38" ry="44" :fill="paint('nucleus')" />
          <g class="chromosome maternal">
            <path class="chromatid" d="M-10-24Q-16-7-11 4T-12 26" />
            <ellipse class="centromere" cx="-12" rx="4" ry="3.5" />
          </g>
          <g v-if="mode === 'reproduction'" class="chromosome maternal">
            <path class="chromatid" d="M15-15Q9-2 15 9T14 20" />
            <ellipse class="centromere" cx="13" cy="2" rx="4" ry="3.5" />
          </g>
          <text v-else class="chromosome-letter" x="10" y="5">X</text>
        </g>
        <g transform="translate(345 117) rotate(22)">
          <path class="sperm-tail" d="M0 25C-16 51 25 58 7 82S-24 106-1 133" />
          <path class="sperm-tail-inner" d="M0 25C-16 51 25 58 7 82S-24 106-1 133" />
          <rect class="sperm-midpiece" x="-5" y="11" width="10" height="26" rx="5" />
          <path class="midpiece-stripes" d="M-4 16H4M-4 21H4M-4 26H4M-4 31H4" />
          <ellipse class="sperm-head" rx="23" ry="31" :fill="paint('cytoplasm')" />
          <path class="acrosome" d="M-21-8Q-19-31 0-31T21-8Q0-17-21-8Z" />
          <g class="chromosome paternal">
            <path
              class="chromatid narrow"
              :d="mode === 'sex' && selected === 1 ? 'M-5-4V12' : 'M-5-12V15'"
            />
            <ellipse class="centromere" cx="-5" cy="1" rx="3" ry="2.5" />
          </g>
          <g v-if="mode === 'reproduction'" class="chromosome paternal">
            <path class="chromatid narrow" d="M8-5V13" />
            <ellipse class="centromere" cx="8" cy="2" rx="3" ry="2.5" />
          </g>
          <text v-else class="small-letter" x="4" y="7">{{ selected === 0 ? 'X' : 'Y' }}</text>
        </g>
        <path
          class="fertilisation-arrow"
          :marker-end="paint('arrow')"
          d="M295 262C360 291 425 291 476 258"
        />
        <text class="arrow-label" x="390" y="321" text-anchor="middle">受精</text>
        <g transform="translate(625 215) scale(.85)">
          <use :href="'#' + id('cell')" />
          <ellipse class="nuclear-envelope" rx="74" ry="78" :fill="paint('nucleus')" />
          <g
            v-for="(chromosome, i) in fertilisedChromosomes"
            :key="i"
            :transform="`translate(${chromosome.x} ${chromosome.y})`"
            :class="['chromosome', chromosome.origin]"
          >
            <path
              class="chromatid"
              :d="`M1 ${-chromosome.length / 2}Q-5-6 0 0T-1 ${chromosome.length / 2}`"
            />
            <ellipse class="centromere" rx="4" ry="3.5" />
          </g>
          <text v-if="mode === 'sex'" class="zygote-letters" x="0" y="64" text-anchor="middle">
            {{ selected === 0 ? 'XX' : 'XY' }}
          </text>
        </g>
        <text class="cell-label" x="155" y="370" text-anchor="middle">卵细胞</text>
        <text class="cell-count" x="155" y="398" text-anchor="middle">
          {{ mode === 'sex' ? '提供 X' : '单倍体 n=2' }}
        </text>
        <text class="sperm-label" x="345" y="73" text-anchor="middle">
          {{ mode === 'sex' ? (selected === 0 ? '带 X 的精子' : '带 Y 的精子') : '单倍体精子 n=2' }}
        </text>
        <text class="cell-label" x="625" y="370" text-anchor="middle">受精卵</text>
        <text class="cell-count" x="625" y="398" text-anchor="middle">
          {{
            mode === 'sex' ? (selected === 0 ? '通常 XX → 雌性' : '通常 XY → 雄性') : '二倍体 2n=4'
          }}
        </text>
      </template>
    </svg>
    <template #legend>
      <template v-if="mode !== 'reproduction' || selected === 1"
        ><span><i class="legend-dot maternal-dot" />母方来源</span
        ><span><i class="legend-dot paternal-dot" />父方来源</span></template
      >
      <span v-if="mode === 'mitosis' || mode === 'meiosis'"
        ><i class="legend-dot centromere-dot" />深色连接处：着丝粒区域</span
      >
      <span v-if="mode === 'mitosis' || mode === 'meiosis'"
        >同样长短表示同类染色体；颜色与长度一起辨认</span
      >
    </template>
    <template #explanation
      ><div aria-live="polite">
        <h6>{{ current.heading }}</h6>
        <p><KnowledgeText :text="current.explanation" /></p></div
    ></template>
  </BiologyAtlasFrame>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppButton from '../AppButton.vue'
import BiologyAtlasFrame from './BiologyAtlasFrame.vue'
import KnowledgeText from './KnowledgeText.vue'

type Origin = 'maternal' | 'paternal'
interface Chromosome {
  x: number
  y: number
  length: number
  origin: Origin
  paired: boolean
}
interface DrawnCell {
  x: number
  y: number
  scale: number
  nucleus: boolean
  spindle: 'aligned' | 'separating' | false
  chromosomes: Chromosome[]
  label: string
  count: string
}
interface Stage {
  label: string
  headline: string
  heading: string
  explanation: string
  accessible: string
}
const props = defineProps<{ topic?: string }>()
const selected = ref(0)
const instanceId = 'division-' + useId().replace(/[^a-zA-Z0-9-]/g, '')
const granules = [
  [-105, 38],
  [-88, 70],
  [103, -37],
  [-60, -100],
  [61, -97],
  [79, 91],
  [112, 16],
  [-115, -22],
  [34, 111],
]
const eggAngles = Array.from({ length: 24 }, (_, i) => (i * Math.PI) / 12)

const stages: Record<string, Stage[]> = {
  mitosis: [
    {
      label: '1 · 复制前',
      headline: '一个二倍体细胞 · 以 2n=4 为例',
      heading: '先认清两对同源染色体',
      explanation:
        '两条长的是一对，两条短的是另一对；每对中一条来自母方，一条来自父方。现在每条只含一条 DNA 双链分子。**四条染色体，不是四对**。为便于计数，图把间期通常较松散的染色质展开成可辨认的条形。',
      accessible: '一个细胞，细胞核内四条未复制染色体，两长两短，分别来自母方和父方。',
    },
    {
      label: '2 · 复制完成',
      headline: 'DNA 已加倍，染色体仍为 4 条',
      heading: '一个 X 是一条复制后的染色体',
      explanation:
        '每条染色体复制成两条相连的姐妹染色单体。图里有 4 个 X，也就是 **4 条染色体、8 条染色单体**，核 DNA 由 2C 变为 4C。这里为计数把复制后的间期染色质画成凝缩形状；实际凝缩主要出现在随后分裂时。',
      accessible: '一个细胞，四条复制后的染色体，每条含两条姐妹染色单体，总计八条染色单体。',
    },
    {
      label: '3 · 中央排列',
      headline: '每条染色体准备把两份复制品分到两边',
      heading: '纺锤体连接并帮助分配染色体',
      explanation:
        '核膜已经解体，复制后的染色体在中央排列。纺锤体连接着丝粒附近的结构，并使姐妹染色单体随后朝相反两极移动。**此时姐妹尚未分开，所以仍为 4 条染色体**。',
      accessible: '核膜已解体，四条复制后的染色体在细胞中央分别排列，纺锤纤维连接两极。',
    },
    {
      label: '4 · 姐妹分开',
      headline: '整细胞 8 条；每一极分到 4 条',
      heading: '计数时要先说明范围',
      explanation:
        '姐妹一旦分开，每条就作为独立染色体计数。现在细胞尚未分成两个，因此**整个细胞共 8 条，每一极各 4 条**；核 DNA 总量仍为 4C，并没有再复制一次。',
      accessible: '一个尚未胞质分裂的细胞，八条分开的染色体，左右两极各四条，每极有两长两短。',
    },
    {
      label: '5 · 两个子细胞',
      headline: '两个子细胞各获得完整的遗传信息',
      heading: '完成分裂，回到每细胞的数目',
      explanation:
        '胞质分裂完成，每个子细胞有 4 条染色体、2C 的核 DNA，回到复制前的水平。无突变等异常时，两者遗传组成相同。**增加的是细胞数，不是每个子细胞的染色体数**。',
      accessible: '两个子细胞，各有四条未复制染色体和一个完整细胞核，遗传组成相同。',
    },
  ],
  meiosis: [
    {
      label: '1 · 复制后配对',
      headline: '一次复制后：4 条染色体，两对同源染色体',
      heading: '先分清“同源”与“姐妹”',
      explanation:
        '两个长 X 是一对同源染色体，两个短 X 是另一对；**同一个 X 的两边才是姐妹染色单体**。本图为了清楚计数，不画交叉互换；真实配对阶段，同源的非姐妹染色单体可以交换相应片段。',
      accessible:
        '一个二倍体细胞，复制后的两条长染色体配对，两条短染色体配对，每条仍为两个姐妹染色单体。',
    },
    {
      label: '2 · 第一次分裂后',
      headline: '同源染色体分开；每个细胞已有一套',
      heading: '已经是单倍体，但姐妹仍相连',
      explanation:
        '每一对同源染色体各去一边，因此每细胞有一长一短，共 **2 条染色体、4 条染色单体**。每条仍是复制后的状态，DNA 为 2C。接下来不再复制 DNA，直接准备第二次分裂。',
      accessible: '两个细胞，每个有两条复制后的染色体，一长一短，每细胞四条染色单体。',
    },
    {
      label: '3 · 第二次分裂后',
      headline: '姐妹分开，形成四个单倍体产物',
      heading: '每个产物保留每类染色体的一份',
      explanation:
        '第二次分裂把姐妹染色单体分开，四个细胞各有一长一短：**每个 2 条染色体、1C 的核 DNA**。本图只展示一种分配、未画交换，所以有两组相同组合；不能由这幅计数图推断实际减数分裂永远只产生两种配子。',
      accessible:
        '四个单倍体细胞，各有两条未复制染色体；未画交叉互换，展示同源独立分配的一种结果。',
    },
  ],
  reproduction: [
    {
      label: '无性 · 匍匐茎',
      headline: '',
      heading: '有丝分裂形成新植株',
      explanation:
        '亲本长出匍匐茎，节点处的新植株逐渐长出叶和根。这里没有配子融合；**无突变时新植株是亲本的克隆**。若水分、光照不同，即使遗传相同，大小也可不同。',
      accessible:
        '草莓亲本与经匍匐茎相连的新植株，均画有叶脉、茎和根，说明没有配子融合的无性繁殖。',
    },
    {
      label: '有性 · 配子结合',
      headline: '两个单倍体配子结合，恢复二倍体',
      heading: '配子先减半，受精再相加',
      explanation:
        '左侧卵细胞与上方精子各含一套染色体，这个模型的 n=2。结合后，受精卵中恢复两套，即 2n=4。**受精卵以后通过有丝分裂生长**；受精与有丝分裂是不同过程。图中不按真实大小比例，省略其余细胞结构。',
      accessible: '含两条染色体的卵细胞和含两条染色体的精子结合，形成含四条染色体的受精卵。',
    },
  ],
  sex: [
    {
      label: 'X 精子 + X 卵',
      headline: '通常 XX/XY 模型：X + X → XX',
      heading: '两种精子之一：带 X',
      explanation:
        '卵细胞提供 X，带 X 的精子参与受精，组合成为 XX。在题目所用通常模型中对应雌性。**只画性染色体，常染色体省略**；配子里的 X 是染色体名称，不表示它必须呈现 X 形。',
      accessible: '一个带 X 的卵细胞与一个带 X 的精子形成 XX 受精卵，只示性染色体。',
    },
    {
      label: 'Y 精子 + X 卵',
      headline: '通常 XX/XY 模型：Y + X → XY',
      heading: '两种精子之二：带 Y',
      explanation:
        '卵细胞仍然提供 X，这次由带 Y 的精子参与受精，得到 XY。在通常模型中对应雄性。两种精子受精机会相等时，两种结果概率各为 1/2；**不是每两次受精必定各出现一种**。',
      accessible: '一个带 X 的卵细胞与一个带 Y 的精子形成 XY 受精卵，Y 以较短的染色体示意。',
    },
  ],
}

// 由当前考纲叶子切换图解主题，而不是依赖章节标题的显示文字。
const mode = computed(() =>
  props.topic === '150302'
    ? 'meiosis'
    : props.topic === '150303'
      ? 'reproduction'
      : props.topic === '150304'
        ? 'sex'
        : 'mitosis',
)
// 各主题只呈现与当前知识点有关的阶段按钮。
const choices = computed(() => stages[mode.value]!)
// 防止考纲切换后沿用上一个图解中不存在的阶段。
const current = computed(() => choices.value[selected.value] ?? choices.value[0]!)
// 标题与选择的考纲主题保持一致，便于屏幕阅读器识别图谱。
const title = computed(
  () =>
    ({
      mitosis: '有丝分裂：追踪每一条染色体',
      meiosis: '减数分裂：先分同源，再分姐妹',
      reproduction: '从新植株到受精卵：两种繁殖方式',
      sex: '通常 XX/XY：卵与精子各提供什么',
    })[mode.value],
)
// 为图形计数补充同一尺度的阅读说明。
const subtitle = computed(() =>
  mode.value === 'mitosis' || mode.value === 'meiosis'
    ? '点击阶段，观察染色体如何变化。C 表示一套未复制染色体的 DNA 含量。'
    : '切换按钮比较过程，图形中的结构与文字解释同步变化。',
)
// 主动说明计数模型省略的内容，避免把清晰绘图误认为完整实物图。
const note = computed(() =>
  mode.value === 'meiosis'
    ? '原创计数图；只画 2n=4 的一种分配，未画交叉互换。四个单倍体产物不等于四个功能相同的成熟卵细胞。'
    : mode.value === 'sex'
      ? '原创通常哺乳动物模型；仅示性染色体，形状和大小不按比例。卵与精子中的染色体按未复制状态画成单条。'
      : '原创结构与过程图；不按实物比例。分裂计数图把 DNA 绘成便于辨认的条形，间期实际通常呈较松散染色质。',
)

// 考纲点变化后从该主题的第一幅图开始，避免错误阶段残留。
watch(
  () => props.topic,
  () => {
    selected.value = 0
  },
)

// 所有渐变和图形定义均使用组件实例 ID，避免同页多图引用冲突。
function id(name: string): string {
  return instanceId + '-' + name
}
// 与当前实例内的 SVG 定义建立引用。
function paint(name: string): string {
  return 'url(#' + id(name) + ')'
}
// 染色体的长短区分同源种类，颜色区分亲本来源；paired 表示复制后姐妹尚未分开。
function chromosome(
  x: number,
  y: number,
  length: number,
  origin: Origin,
  paired: boolean,
): Chromosome {
  return { x, y, length, origin, paired }
}
// 一套二倍体包含两对：一长一短的母方来源与对应的父方来源。
function diploid(paired: boolean): Chromosome[] {
  return [
    chromosome(-36, -39, 56, 'maternal', paired),
    chromosome(36, -39, 56, 'paternal', paired),
    chromosome(-36, 39, 38, 'maternal', paired),
    chromosome(36, 39, 38, 'paternal', paired),
  ]
}
// 以统一细胞外形承载不同阶段的染色体，计数和标签来自同一数据。
function cell(
  x: number,
  scale: number,
  chromosomes: Chromosome[],
  label: string,
  count: string,
  nucleus = true,
  spindle: DrawnCell['spindle'] = false,
): DrawnCell {
  return { x, y: 215, scale, chromosomes, label, count, nucleus, spindle }
}
// 显示阶段对应的真实数目；姐妹分离后整细胞计数与子细胞计数分别标明。
const cells = computed<DrawnCell[]>(() => {
  if (mode.value === 'meiosis') {
    if (selected.value === 0)
      return [cell(400, 1.15, diploid(true), '二倍体 · 2n=4', '4 条染色体 · 4C')]
    const first = [
      chromosome(-25, 0, 56, 'maternal', selected.value === 1),
      chromosome(27, 0, 38, 'paternal', selected.value === 1),
    ]
    const second = [
      chromosome(-25, 0, 56, 'paternal', selected.value === 1),
      chromosome(27, 0, 38, 'maternal', selected.value === 1),
    ]
    if (selected.value === 1)
      return [
        cell(225, 0.85, first, '子细胞 1 · n=2', '2 条染色体 · 2C'),
        cell(575, 0.85, second, '子细胞 2 · n=2', '2 条染色体 · 2C'),
      ]
    return [first, first, second, second].map((chromosomes, index) =>
      cell(113 + index * 191, 0.55, chromosomes, '产物 ' + (index + 1), 'n=2 · 1C'),
    )
  }
  if (selected.value === 0)
    return [cell(400, 1.15, diploid(false), '复制前 · G1', '4 条染色体 · 2C')]
  if (selected.value === 1) return [cell(400, 1.15, diploid(true), '复制已完成', '4 条染色体 · 4C')]
  if (selected.value === 2)
    return [
      cell(
        400,
        1.15,
        [-75, -25, 25, 75].map((y, index) =>
          chromosome(0, y, index < 2 ? 44 : 30, index % 2 ? 'paternal' : 'maternal', true),
        ),
        '姐妹仍相连',
        '4 条染色体 · 4C',
        false,
        'aligned',
      ),
    ]
  if (selected.value === 3)
    return [
      cell(
        400,
        1.15,
        [-55, 55].flatMap((x) =>
          [-66, -22, 22, 66].map((y, index) =>
            chromosome(x, y, index < 2 ? 34 : 24, index % 2 ? 'paternal' : 'maternal', false),
          ),
        ),
        '整个细胞尚未分开',
        '整细胞 8 条 · 每极 4 条',
        false,
        'separating',
      ),
    ]
  return [
    cell(225, 0.85, diploid(false), '子细胞 1', '4 条染色体 · 2C'),
    cell(575, 0.85, diploid(false), '子细胞 2', '4 条染色体 · 2C'),
  ]
})
// 分裂期纺锤纤维连接着丝粒附近；分离阶段只连向对应一极。
function spindlePath(chromosome: Chromosome, phase: DrawnCell['spindle']): string {
  const left = `M-112 0Q-62 ${chromosome.y * 0.95} ${chromosome.x} ${chromosome.y}`
  const right = `M112 0Q62 ${chromosome.y * 0.95} ${chromosome.x} ${chromosome.y}`
  return phase === 'aligned' ? left + right : chromosome.x < 0 ? left : right
}
// 有性繁殖图展示全部四条；性别图只显示 X/X 或 X/Y，避免把名称 X 画成复制后的 X 形。
const fertilisedChromosomes = computed(() =>
  mode.value === 'sex'
    ? [
        chromosome(-24, -8, 60, 'maternal', false),
        chromosome(24, -8, selected.value === 0 ? 60 : 32, 'paternal', false),
      ]
    : diploid(false),
)
</script>

<style scoped>
.division-illustration {
  min-width: 600px;
}
.surface-stop {
  stop-color: var(--color-surface);
}
.blue-soft-stop {
  stop-color: var(--color-learning-blue-soft);
}
.blue-line-stop {
  stop-color: var(--color-learning-blue-line);
}
.violet-soft-stop {
  stop-color: var(--color-learning-violet-soft);
}
.teal-soft-stop {
  stop-color: var(--color-learning-teal-soft);
}
.teal-line-stop {
  stop-color: var(--color-learning-teal-line);
}
.cell-border,
.egg-membrane {
  stroke: var(--color-learning-blue);
  stroke-width: 2.6;
}
.membrane-inner {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 0.8;
  opacity: 0.55;
}
.cytoplasm-granules {
  fill: var(--color-learning-blue);
  opacity: 0.22;
}
.mitochondrion {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 1.2;
}
.mitochondrial-fold {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 0.9;
}
.nuclear-envelope {
  stroke: var(--color-learning-violet);
  stroke-width: 1.7;
}
.nuclear-inner {
  fill: none;
  stroke: var(--color-learning-violet-line);
  stroke-width: 1.3;
}
.nuclear-pores {
  stroke: var(--color-learning-violet);
  stroke-width: 3;
}
.chromosome.maternal {
  color: var(--color-learning-violet);
}
.chromosome.paternal {
  color: var(--color-learning-amber);
}
.chromatid {
  fill: none;
  stroke: currentColor;
  stroke-width: 10;
  stroke-linecap: round;
}
.chromatid.narrow {
  stroke-width: 6;
}
.chromatid-shine {
  fill: none;
  stroke: var(--color-surface);
  stroke-width: 2;
  stroke-linecap: round;
  opacity: 0.55;
}
.centromere {
  fill: var(--color-ink);
  stroke: var(--color-surface);
  stroke-width: 0.7;
}
.spindle,
.spindle-faint {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1.1;
  opacity: 0.58;
}
.spindle-faint {
  opacity: 0.26;
}
.aster {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 0.8;
}
.centriole {
  fill: var(--color-learning-teal);
}
.stage-kicker {
  fill: var(--color-learning-teal);
  font-size: 19px;
  font-weight: 700;
}
.cell-label {
  fill: var(--color-ink);
  font-size: 19px;
  font-weight: 700;
}
.cell-count {
  fill: var(--color-ink-soft);
  font-size: 17px;
}
.callout {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1.2;
}
.callout text {
  fill: var(--color-learning-teal);
  stroke: none;
  font-size: 16px;
}
.callout circle {
  fill: var(--color-learning-teal);
}
.leaf {
  stroke: var(--color-learning-teal);
  stroke-width: 1.6;
}
.leaf-vein {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1;
  opacity: 0.7;
}
.stem,
.runner {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 4;
  stroke-linecap: round;
}
.roots {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 2;
  stroke-linecap: round;
}
.soil-fill {
  fill: var(--color-learning-amber-soft);
}
.soil-line {
  fill: none;
  stroke: var(--color-learning-amber-line);
  stroke-width: 2;
}
.soil-speck {
  fill: var(--color-learning-amber-line);
}
.egg-coat {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet-line);
  stroke-width: 1.8;
}
.egg-coat-inner {
  fill: none;
  stroke: var(--color-learning-violet-line);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}
.egg-follicles {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet-line);
}
.sperm-tail {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 4;
  stroke-linecap: round;
}
.sperm-tail-inner {
  fill: none;
  stroke: var(--color-learning-blue-line);
  stroke-width: 1.5;
}
.sperm-head {
  stroke: var(--color-learning-blue);
  stroke-width: 1.8;
}
.sperm-midpiece {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 1.1;
}
.midpiece-stripes {
  stroke: var(--color-learning-amber);
  stroke-width: 1;
}
.acrosome {
  fill: var(--color-learning-violet-line);
  stroke: var(--color-learning-violet);
  stroke-width: 1;
}
.fertilisation-arrow {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 2.4;
}
.arrow-head {
  fill: var(--color-learning-teal);
}
.arrow-label,
.sperm-label {
  fill: var(--color-learning-teal);
  font-size: 17px;
}
.chromosome-letter,
.small-letter {
  fill: var(--color-ink);
  font-size: 18px;
  font-weight: 700;
}
.small-letter {
  font-size: 15px;
}
.zygote-letters {
  fill: var(--color-learning-violet);
  font-size: 22px;
  font-weight: 700;
}
.legend-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 5px;
  border-radius: 50%;
}
.maternal-dot {
  background: var(--color-learning-violet);
}
.paternal-dot {
  background: var(--color-learning-amber);
}
.centromere-dot {
  background: var(--color-ink);
}
</style>
