<!-- 遗传章节原创图谱：核与基因定位、等位基因比较及可切换杂交和三代家系。 -->
<template>
  <BiologyAtlasFrame :title="title" :subtitle="subtitle" :note="note">
    <template #controls>
      <template v-if="topic === '150402'">
        <AppButton
          v-for="item in genotypes"
          :key="item"
          type="secondary"
          size="small"
          :aria-pressed="genotype === item"
          @click="genotype = item"
          >{{ item }} · {{ item === 'Aa' ? '杂合' : '纯合' }}</AppButton
        >
      </template>
      <template v-else-if="topic === '150403'">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="mode === 'cross'"
          @click="mode = 'cross'"
          >杂交表</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="mode === 'pedigree'"
          @click="mode = 'pedigree'"
          >三代家系</AppButton
        >
        <template v-if="mode === 'cross'">
          <AppButton
            type="secondary"
            size="small"
            :aria-pressed="partner === 'Aa'"
            @click="partner = 'Aa'"
            >Aa × Aa</AppButton
          >
          <AppButton
            type="secondary"
            size="small"
            :aria-pressed="partner === 'aa'"
            @click="partner = 'aa'"
            >Aa × aa</AppButton
          >
        </template>
        <AppButton
          v-else
          type="secondary"
          size="small"
          :aria-pressed="confirmed"
          @click="confirmed = !confirmed"
          >{{ confirmed ? '恢复：仅知道 II-2 未患病' : '改变条件：检测确认 II-2 为 Aa' }}</AppButton
        >
      </template>
    </template>

    <div
      class="inheritance-canvas"
      role="region"
      aria-label="遗传图解，可在窄屏横向滚动"
      tabindex="0"
    >
      <svg viewBox="0 0 740 445" role="img" :aria-labelledby="id('title') + ' ' + id('desc')">
        <title :id="id('title')">{{ title }}</title>
        <desc :id="id('desc')">{{ description }}</desc>
        <defs>
          <radialGradient :id="id('cell')" cx="32%" cy="28%" r="80%">
            <stop offset="0" class="stop-surface" />
            <stop offset="0.65" class="stop-blue-soft" />
            <stop offset="1" class="stop-blue-line" />
          </radialGradient>
          <radialGradient :id="id('nuclear')" cx="32%" cy="24%" r="78%">
            <stop offset="0" class="stop-violet-soft" />
            <stop offset="1" class="stop-violet-line" />
          </radialGradient>
          <linearGradient :id="id('maternal')" x1="0" x2="1">
            <stop offset="0" class="stop-blue-line" />
            <stop offset="0.4" class="stop-blue-soft" />
            <stop offset="1" class="stop-blue" />
          </linearGradient>
          <linearGradient :id="id('paternal')" x1="0" x2="1">
            <stop offset="0" class="stop-teal-line" />
            <stop offset="0.4" class="stop-teal-soft" />
            <stop offset="1" class="stop-teal" />
          </linearGradient>
          <linearGradient :id="id('petal')" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0" class="stop-violet-soft" />
            <stop offset="0.5" class="stop-violet-line" />
            <stop offset="1" class="stop-violet" />
          </linearGradient>
          <marker
            :id="id('arrow')"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0L10 5L0 10Z" class="arrow-fill" />
          </marker>
          <g :id="id('chromosome')">
            <path
              d="M-17-114Q-17-133 0-133Q17-133 17-114L13-25Q10-16 6-10Q3-4 7 5L16 102Q18 124 0 125Q-18 124-16 102L-7 5Q-3-4-6-10Q-10-16-13-25Z"
              class="chromosome-outline"
            />
            <path d="M-5-115L-4-31M-3 20L-5 105" class="chromosome-shine" />
            <path
              d="M-15-89H15M-14-69H14M-13-45H13M-10 34H10M-12 58H12M-14 83H14"
              class="chromosome-bands"
            />
            <ellipse cy="-5" rx="7" ry="5" class="centromere" />
          </g>
          <g :id="id('mitochondrion')">
            <path
              d="M-22-8C-12-24 17-21 23-7C31 13 5 25-12 16C-24 10-26 1-22-8Z"
              class="mitochondrion"
            />
            <path
              d="M-16-5Q-8-14-3-12L-6 1Q-6 7-1 5L7-11Q16-10 18-4L9 9Q4 14-6 9L-4 2Q-7-4-12 4Q-18 6-16-5Z"
              class="cristae"
            />
          </g>
        </defs>

        <g v-if="topic !== '150402' && topic !== '150403'">
          <text x="24" y="31" class="kicker">01 · 遗传信息在哪里</text>
          <path
            d="M44 162C35 113 67 81 109 87C153 57 208 82 228 127C258 154 249 208 221 231C226 281 178 312 131 293C81 316 35 278 43 233C18 209 24 180 44 162Z"
            :fill="paint('cell')"
            class="cell-outline"
          />
          <path
            d="M51 164C43 119 73 89 110 94C151 65 203 90 222 132C250 158 240 205 214 228C218 274 174 302 133 286C87 306 44 274 50 230C27 205 33 181 51 164Z"
            class="inner-membrane"
          />
          <g transform="translate(144 187)">
            <ellipse rx="60" ry="57" :fill="paint('nuclear')" class="nuclear-outline" />
            <ellipse rx="53" ry="50" class="nuclear-inner" />
            <path
              d="M-38-20C-25-40-9-12-19-8S-37 10-20 17S3 2 8 18S24 40 33 19M-9-38C9-43 24-27 11-18S-2-5 17-6S39-4 40 10"
              class="chromatin"
            />
            <circle cx="10" cy="-3" r="16" class="nucleolus" />
            <circle cx="5" cy="-8" r="5" class="nucleolus-glint" />
            <path
              d="M-55-19l7 2M-29-49l4 6M32-47l-5 6M57 18l-7-2M25 51l-3-7M-36 43l5-5"
              class="pores"
            />
          </g>
          <use
            :href="'#' + id('mitochondrion')"
            transform="translate(76 139) rotate(-25) scale(.8)"
          />
          <use
            :href="'#' + id('mitochondrion')"
            transform="translate(196 260) rotate(35) scale(.75)"
          />
          <g class="ribosomes">
            <circle cx="76" cy="234" r="2" />
            <circle cx="87" cy="249" r="2" />
            <circle cx="210" cy="168" r="2" />
            <circle cx="213" cy="184" r="2" />
            <circle cx="126" cy="112" r="2" />
            <circle cx="141" cy="106" r="2" />
          </g>
          <path d="M86 191H22V326H97" class="leader" />
          <text x="100" y="332" class="label">细胞核</text>
          <text x="38" y="368" class="small">核膜内保存主要遗传物质</text>
          <path d="M191 144L290 92M191 228L290 312" class="zoom-line" />
          <text x="282" y="31" class="kicker">02 · 同源染色体</text>
          <rect x="284" y="58" width="176" height="304" rx="24" class="detail-panel" />
          <use
            :href="'#' + id('chromosome')"
            transform="translate(331 205)"
            :fill="paint('maternal')"
          />
          <use
            :href="'#' + id('chromosome')"
            transform="translate(411 205)"
            :fill="paint('paternal')"
          />
          <path d="M314 149H348M394 149H428" class="gene-locus" />
          <text x="330" y="146" class="allele-on-band">A</text>
          <text x="411" y="146" class="allele-on-band">a</text>
          <path d="M349 149H393" class="locus-link" />
          <text x="331" y="346" class="small centered">母方</text>
          <text x="411" y="346" class="small centered">父方</text>
          <text x="371" y="388" class="label centered">同一位点，不同版本</text>
          <path d="M430 143L500 103M430 155L500 313" class="zoom-line" />
          <text x="509" y="31" class="kicker">03 · DNA 上的基因</text>
          <rect x="504" y="59" width="212" height="304" rx="24" class="dna-panel" />
          <rect x="531" y="148" width="158" height="116" rx="14" class="gene-region" />
          <g v-for="(rung, index) in dnaRungs" :key="index">
            <path
              :d="'M' + rung.left + ' ' + rung.y + 'H' + rung.right"
              :class="index > 4 && index < 13 ? 'dna-bond gene-bond' : 'dna-bond'"
            />
            <circle :cx="rung.left" :cy="rung.y" r="3.2" class="dna-node-blue" />
            <circle :cx="rung.right" :cy="rung.y" r="3.2" class="dna-node-teal" />
          </g>
          <path :d="dnaStrands.left" class="dna-strand blue" />
          <path :d="dnaStrands.right" class="dna-strand teal" />
          <path d="M698 151H708V261H698" class="gene-bracket" />
          <text x="610" y="388" class="label centered">基因是 DNA 的一段</text>
          <text x="24" y="423" class="small">
            一条染色体上还有许多其他基因；图中只强调一个位点。
          </text>
        </g>

        <g v-else-if="topic === '150402'">
          <text x="28" y="31" class="kicker">同一基因的两个版本</text>
          <rect x="27" y="59" width="292" height="329" rx="26" class="detail-panel" />
          <path d="M61 173H286" class="locus-link" />
          <text x="173" y="92" class="small centered">一对未复制的同源常染色体</text>
          <use
            :href="'#' + id('chromosome')"
            transform="translate(112 242) scale(.87)"
            :fill="paint('maternal')"
          />
          <use
            :href="'#' + id('chromosome')"
            transform="translate(233 242) scale(.87)"
            :fill="paint('paternal')"
          />
          <path d="M96 173H128M217 173H249" class="gene-locus" />
          <text x="112" y="170" class="allele-on-band">{{ genotype[0] }}</text>
          <text x="233" y="170" class="allele-on-band">{{ genotype[1] }}</text>
          <text x="173" y="221" class="label centered">相同基因位点</text>
          <text x="112" y="374" class="small centered">来自母方</text>
          <text x="233" y="374" class="small centered">来自父方</text>
          <path d="M335 212H411" class="flow-arrow" :marker-end="paint('arrow')" />
          <text x="374" y="188" class="small centered">影响性状</text>
          <g transform="translate(537 190)">
            <path d="M0 47C14 116-15 149 1 190" class="flower-stem" />
            <path d="M4 120C-32 79-76 111-39 143C-20 154-6 142 4 120Z" class="flower-leaf" />
            <path d="M7 151C35 110 74 127 47 157C28 170 15 160 7 151Z" class="flower-leaf" />
            <path d="M-2 129L-46 119M10 151L48 137" class="leaf-veins" />
            <g
              v-for="angle in [0, 72, 144, 216, 288]"
              :key="angle"
              :transform="'rotate(' + angle + ')'"
            >
              <path
                d="M0 8C-25-1-52-30-39-59C-25-88 15-84 31-64C49-38 20-5 0 8Z"
                :fill="genotype === 'aa' ? 'var(--color-surface)' : paint('petal')"
                class="petal"
              />
              <path
                d="M0-8C-12-24-12-47-7-61M-5-18Q-29-32-27-48M2-23Q20-41 18-54"
                class="petal-veins"
              />
            </g>
            <circle r="23" class="flower-centre" />
            <circle
              v-for="point in pollen"
              :key="point.x + ':' + point.y"
              :cx="point.x"
              :cy="point.y"
              r="2.4"
              class="pollen"
            />
          </g>
          <text x="537" y="73" class="label centered">
            {{ genotype === 'aa' ? '白花' : '紫花' }} · 表现型
          </text>
          <rect x="459" y="379" width="156" height="39" rx="19" class="genotype-pill" />
          <text x="537" y="405" class="genotype-text centered">
            {{ genotype }} · {{ genotype === 'Aa' ? '杂合' : '纯合' }}
          </text>
          <text x="26" y="425" class="small">虚构花色模型：A 对 a 完全显性；环境相同。</text>
        </g>

        <g v-else-if="mode === 'cross'">
          <text x="26" y="31" class="kicker">亲本 Aa × {{ partner }} · 随机受精</text>
          <text x="247" y="63" class="small centered">亲本一的配子</text>
          <g
            v-for="(allele, index) in ['A', 'a']"
            :key="allele"
            :transform="'translate(' + (174 + index * 146) + ' 101)'"
          >
            <circle r="26" class="gamete maternal-gamete" />
            <path d="M-3-14V12" class="gamete-chromosome" />
            <text x="45" y="-2" class="gamete-letter">{{ allele }}</text>
            <text x="45" y="17" class="small">1/2</text>
          </g>
          <g
            v-for="(allele, row) in rowGametes"
            :key="row"
            :transform="'translate(58 ' + (181 + row * 123) + ')'"
          >
            <circle r="25" class="gamete paternal-gamete" />
            <path d="M-3-14V12" class="gamete-chromosome" />
            <text x="0" y="47" class="label centered">{{ allele }}</text>
            <text x="0" y="66" class="small centered">{{ partner === 'Aa' ? '1/2' : '全部' }}</text>
          </g>
          <g
            v-for="(cell, index) in crossCells"
            :key="index"
            :transform="
              'translate(' +
              (111 + (index % 2) * 146) +
              ' ' +
              (139 + Math.floor(index / 2) * 123) +
              ')'
            "
          >
            <rect
              width="133"
              height="111"
              rx="17"
              :class="cell === 'aa' ? 'affected-cell' : 'unaffected-cell'"
            />
            <text x="67" y="46" class="cross-genotype centered">{{ cell }}</text>
            <text x="67" y="73" class="small centered">
              {{ cell === 'aa' ? '患病' : '未患病' }}
            </text>
            <text x="67" y="96" class="small centered">{{ partner === 'Aa' ? '1/4' : '1/2' }}</text>
          </g>
          <rect x="435" y="78" width="278" height="304" rx="25" class="result-panel" />
          <text x="461" y="113" class="label">每个后代的理论概率</text>
          <circle cx="575" cy="207" r="67" class="probability-ring" />
          <circle
            cx="575"
            cy="207"
            r="67"
            class="probability-ring-value"
            :stroke-dasharray="(partner === 'Aa' ? 105.24 : 210.49) + ' 420.97'"
            transform="rotate(-90 575 207)"
          />
          <text x="575" y="211" class="probability-number centered">
            {{ partner === 'Aa' ? '25%' : '50%' }}
          </text>
          <text x="575" y="236" class="small centered">aa 患病</text>
          <text x="575" y="315" class="label centered">
            {{ partner === 'Aa' ? 'AA∶Aa∶aa = 1∶2∶1' : 'Aa∶aa = 1∶1' }}
          </text>
          <text x="575" y="344" class="small centered">
            {{ partner === 'Aa' ? '未患病∶患病 = 3∶1' : '未患病∶患病 = 1∶1' }}
          </text>
          <text x="26" y="422" class="small">各格是可能的受精组合，不是孩子的出生次序。</text>
        </g>

        <g v-else>
          <text x="25" y="31" class="kicker">三代家系 · 常染色体隐性模型</text>
          <rect x="22" y="55" width="421" height="350" rx="25" class="pedigree-panel" />
          <text x="38" y="109" class="generation">I</text>
          <text x="38" y="231" class="generation">II</text>
          <text x="38" y="353" class="generation">III</text>
          <path
            d="M169 104H279M225 104V157M113 157H280M113 157V198M280 157V198M304 222H367M336 222V319"
            class="pedigree-line"
          />
          <rect x="121" y="80" width="48" height="48" rx="2" class="person-unaffected" />
          <circle cx="303" cy="104" r="24" class="person-unaffected" />
          <text x="145" y="69" class="small centered">I-1</text>
          <text x="303" y="69" class="small centered">I-2</text>
          <text x="145" y="150" class="label centered">Aa</text>
          <text x="303" y="150" class="label centered">Aa</text>
          <circle cx="113" cy="222" r="24" class="person-affected" />
          <rect
            x="256"
            y="198"
            width="48"
            height="48"
            rx="2"
            class="person-unaffected focus-person"
          />
          <circle cx="391" cy="222" r="24" class="person-unaffected" />
          <text x="113" y="188" class="small centered">II-1</text>
          <text x="280" y="188" class="small centered">II-2</text>
          <text x="391" y="188" class="small centered">II-3</text>
          <text x="113" y="271" class="label centered">aa</text>
          <text x="280" y="271" class="label centered">
            {{ confirmed ? 'Aa 已确认' : 'AA 或 Aa' }}
          </text>
          <text x="391" y="271" class="label centered">Aa</text>
          <path d="M336 319L362 345L336 371L310 345Z" class="future-person" />
          <text x="336" y="393" class="small centered">预计下一胎</text>
          <rect x="462" y="55" width="254" height="350" rx="25" class="result-panel" />
          <text x="487" y="91" class="label">II-2 是携带者的概率</text>
          <text x="589" y="145" class="probability-number centered">
            {{ confirmed ? '1' : '2/3' }}
          </text>
          <text x="589" y="174" class="small centered">
            {{ confirmed ? '检测已排除 AA' : '已知未患病，排除 aa' }}
          </text>
          <g
            v-for="(value, index) in ['AA', 'Aa', 'aA']"
            :key="value"
            :opacity="confirmed && index === 0 ? 0.25 : 1"
            :transform="'translate(' + (479 + index * 73) + ' 194)'"
          >
            <rect
              width="66"
              height="41"
              rx="10"
              :class="index === 0 ? 'unaffected-cell' : 'carrier-cell'"
            />
            <text x="33" y="28" class="label centered">{{ value }}</text>
          </g>
          <path d="M484 251H695" class="separator" />
          <text x="589" y="284" class="label centered">孩子患病的概率</text>
          <text x="589" y="326" class="risk-equation centered">
            {{ confirmed ? '1 × 1/4 = 1/4' : '2/3 × 1/4 = 1/6' }}
          </text>
          <text x="589" y="367" class="small centered">双方都要把 a 传给孩子</text>
          <text x="26" y="432" class="small">
            Aa、aA 是两种等可能配子组合，合并后属于同一种基因型。
          </text>
        </g>
      </svg>
    </div>

    <template #legend>
      <template v-if="topic === '150403' && mode === 'pedigree'">
        <span class="legend-item"><i class="square" />男性</span
        ><span class="legend-item"><i class="circle" />女性</span
        ><span class="legend-item"><i class="circle filled" />患病</span
        ><span class="legend-item"><i class="diamond" />未来孩子，性别未指定</span>
      </template>
      <template v-else-if="topic === '150403'">
        <span class="legend-item"><i class="dot maternal" />亲本一的配子</span
        ><span class="legend-item"><i class="dot paternal" />亲本二的配子</span
        ><span class="legend-item"><i class="dot affected" />aa 患病</span>
      </template>
      <template v-else>
        <span class="legend-item"><i class="dot maternal" />母方染色体</span
        ><span class="legend-item"><i class="dot paternal" />父方染色体</span
        ><span class="legend-item"><i class="dot gene" />强调的基因位点</span>
      </template>
    </template>
    <template #explanation>
      <div aria-live="polite">
        <h6>{{ explanationTitle }}</h6>
        <p><KnowledgeText :text="explanation" /></p>
      </div>
    </template>
  </BiologyAtlasFrame>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import AppButton from '../AppButton.vue'
import BiologyAtlasFrame from './BiologyAtlasFrame.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic?: string }>()
const instanceId = useId()
const genotypes = ['AA', 'Aa', 'aa'] as const
const genotype = ref<(typeof genotypes)[number]>('Aa')
const mode = ref<'cross' | 'pedigree'>('cross')
const partner = ref<'Aa' | 'aa'>('Aa')
const confirmed = ref(false)
const pollen = [
  { x: 0, y: 0 },
  { x: -11, y: -9 },
  { x: 4, y: -13 },
  { x: 13, y: -4 },
  { x: 8, y: 10 },
  { x: -6, y: 13 },
  { x: -14, y: 5 },
]
// 两条骨架与横向碱基对使用同一坐标计算，保持螺旋宽度一致且端点相接。
function dnaPoint(y: number) {
  const wave = 55 * Math.cos(((y - 81) / 90) * Math.PI)
  return { y, left: 610 - wave, right: 610 + wave }
}
const dnaRungs = Array.from({ length: 19 }, (_, index) => dnaPoint(81 + index * 15))
const dnaPoints = Array.from({ length: 181 }, (_, index) => dnaPoint(81 + index * 1.5))
const dnaStrands = {
  left: dnaPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.left} ${point.y}`)
    .join(' '),
  right: dnaPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.right} ${point.y}`)
    .join(' '),
}

// 每个组件使用独立标识，避免多个章节同时挂载时 SVG 渐变互相引用。
function id(name: string) {
  return `${instanceId}-inheritance-${name}`
}
// 原创图的结构与填色共用同一实例定义。
function paint(name: string) {
  return `url(#${id(name)})`
}

// 隐性纯合亲本只产生一种配子，避免用重复格子误导配子种类。
const rowGametes = computed(() => (partner.value === 'Aa' ? ['A', 'a'] : ['a']))
// 组合后统一把大写等位基因写在前，保留 Aa 的两种受精来源。
const crossCells = computed(() =>
  rowGametes.value.flatMap((row) => ['A', 'a'].map((column) => [row, column].sort().join(''))),
)
// 每个考纲叶子默认展示与该知识点对应的结构层级。
const title = computed(() =>
  props.topic === '150402'
    ? '同一对染色体，可以带相同或不同的版本'
    : props.topic === '150403'
      ? mode.value === 'cross'
        ? '把配子配成对，概率就看得见'
        : '从三代家系看清“已知未患病”'
      : '从细胞核，找到 DNA 上的一个基因',
)
// 图解副标题先交代模型条件，避免把简化模型当成所有遗传规律。
const subtitle = computed(() =>
  props.topic === '150402'
    ? '切换 AA、Aa、aa，对照基因型与花色。这里只研究一个虚构的单基因性状。'
    : props.topic === '150403'
      ? '**常染色体隐性模型**：aa 患病，AA 与 Aa 未患病；完全显现、无新突变、正常分离且随机受精。'
      : '细胞核内的染色体携带 DNA；同一位点的 A 与 a 是同一基因的不同版本。',
)
// 图形说明补足比例、复制状态与家系符号的适用边界。
const note = computed(() =>
  props.topic === '150403'
    ? '原创教学模型。各基因型存活机会相同；家系中的未来孩子尚未出生，菱形不表示已经患病。图中概率针对单次受精；窄屏可左右滑动图解。'
    : '原创结构示意，不按真实大小绘制。染色体放大处以未复制的单条形态展示位点，不表示细胞核内 DNA 始终这样凝缩排列；窄屏可左右滑动图解。',
)
// 无障碍描述给出图形之外也能理解的完整关系。
const description = computed(() =>
  props.topic === '150402'
    ? `母方和父方同源染色体在同一位点携带 ${genotype.value}，完全显性模型下表现为${genotype.value === 'aa' ? '白花' : '紫花'}。`
    : props.topic === '150403'
      ? mode.value === 'cross'
        ? `Aa 与 ${partner.value} 杂交，后代 aa 患病的概率为 ${partner.value === 'Aa' ? '四分之一' : '二分之一'}。`
        : `第一代两位未患病亲本有 aa 女儿，因此都为 Aa。未患病儿子 II-2 ${confirmed.value ? '已确认 Aa' : '有三分之二概率为 Aa'}，与已确认 Aa 女性的孩子患病概率为${confirmed.value ? '四分之一' : '六分之一'}。`
      : '动物细胞中的细胞核、放大的一对同源染色体以及进一步放大的 DNA。两条同源染色体同一位点分别为 A 与 a。DNA 上高亮的一段代表一个基因。',
)
// 解释始终随当前按钮条件更新，让学生看到结论改变的原因。
const explanationTitle = computed(() =>
  props.topic === '150402'
    ? genotype.value === 'Aa'
      ? 'Aa 没有“丢掉”a，只是表现型与 AA 相同'
      : genotype.value === 'aa'
        ? 'aa 也是纯合，只是没有 A'
        : 'AA 与 Aa 可以同为紫花，但配子不同'
    : props.topic === '150403'
      ? mode.value === 'pedigree'
        ? confirmed.value
          ? '检测改变了已知信息'
          : '排除 aa 后，为什么剩下的不是一半对一半？'
        : '先读基因型，再看题目问哪种表现型'
      : '同一位置，两个版本；一条 DNA，许多基因',
)
// 图下只强调必要结论与限定条件，不靠颜色单独传达遗传状态。
const explanation = computed(() => {
  if (props.topic === '150402') {
    if (genotype.value === 'Aa')
      return '左侧一个位点是 A，另一个是 a，所以是杂合。题目设定 A 完全显性，花色与 AA 相同；但形成正常配子时，**A 与 a 理论上各有 1/2 的机会传下去**，a 并没有被 A 消灭。'
    if (genotype.value === 'aa')
      return '两条同源染色体在这个位置都带 a，因此是隐性纯合。模型规定 aa 为白花；**白色并不表示“没有花色基因”**，这里仍有两份基因，只是都属于 a 版本。'
    return '两个版本都是 A，因此是显性纯合；正常配子在这个位点全部带 A。切换到 Aa 会发现花色不变，但配子可以携带 a。==表现型相同，不保证基因型或后代概率相同==。'
  }
  if (props.topic === '150403') {
    if (mode.value === 'pedigree')
      return confirmed.value
        ? '检测已经确认 II-2 为 Aa，便不再乘“他可能是携带者”的 2/3。他与 Aa 女性生出 aa 的概率直接是 1/4。**条件改变了，计算也要跟着改变**；如果两人基因型已固定，前一胎结果不会改变下一胎的 1/4。'
        : '第一代 Aa × Aa 有 AA、Aa、aA、aa 四种等可能组合。II-2 已知未患病，所以排除 aa；剩下三种中，两种是携带者，因此概率为 2/3。再乘 Aa × Aa 生出 aa 的 1/4，得到 **2/3 × 1/4 = 1/6**。'
    return partner.value === 'Aa'
      ? '两方配子的 A 与 a 都各占一半，四种组合各占 1/4。Aa 与 aA 合并为杂合子，占 1/2；aa 占 1/4，患病。**表中的四格不是四次生育的安排表**，前面已经生过 aa，不会把后面 aa 的机会用掉。'
      : '第二个亲本是 aa，只能提供 a，所以左侧只列一种配子。第一个亲本一半给 A、一半给 a，得到一半 Aa、一半 aa。==亲本换了，就重新列配子，不能继续套用 3∶1==。'
  }
  return '蓝色与绿色只区分母方、父方来源；金色横带标出对应的基因位点。A 与 a 位于同一基因的位置，却是不同版本，因此该位点为 Aa。右侧进一步放大 DNA，强调**基因是 DNA 序列的一段**。图中细胞质里的线粒体也有自己的 DNA，所以细胞核是主要、并非唯一的遗传物质储存处。'
})
</script>

<style scoped>
.inheritance-canvas {
  overflow-x: auto;
}
.inheritance-canvas svg {
  min-width: 620px;
}
.inheritance-canvas:focus-visible {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 2px;
}
svg text {
  fill: var(--color-ink);
}
.kicker {
  font-size: 16px;
  font-weight: var(--weight-bold);
  fill: var(--color-learning-teal);
}
.label {
  font-size: 16px;
  font-weight: var(--weight-semi);
}
.small {
  font-size: 13px;
  fill: var(--color-ink-soft);
}
.centered {
  text-anchor: middle;
}
.stop-surface {
  stop-color: var(--color-surface);
}
.stop-blue-soft {
  stop-color: var(--color-learning-blue-soft);
}
.stop-blue-line {
  stop-color: var(--color-learning-blue-line);
}
.stop-blue {
  stop-color: var(--color-learning-blue);
}
.stop-teal-soft {
  stop-color: var(--color-learning-teal-soft);
}
.stop-teal-line {
  stop-color: var(--color-learning-teal-line);
}
.stop-teal {
  stop-color: var(--color-learning-teal);
}
.stop-violet-soft {
  stop-color: var(--color-learning-violet-soft);
}
.stop-violet-line {
  stop-color: var(--color-learning-violet-line);
}
.stop-violet {
  stop-color: var(--color-learning-violet);
}
.cell-outline {
  stroke: var(--color-learning-blue);
  stroke-width: 2.5;
}
.inner-membrane {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 1;
  opacity: 0.45;
}
.nuclear-outline {
  stroke: var(--color-learning-violet);
  stroke-width: 2;
}
.nuclear-inner {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 1;
  opacity: 0.5;
}
.chromatin {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 3.2;
  stroke-linecap: round;
  opacity: 0.55;
}
.nucleolus {
  fill: var(--color-learning-violet);
  opacity: 0.8;
}
.nucleolus-glint {
  fill: var(--color-learning-violet-line);
}
.pores {
  stroke: var(--color-surface);
  stroke-width: 4;
}
.mitochondrion {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 1.4;
}
.cristae {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 1.6;
}
.ribosomes {
  fill: var(--color-learning-violet);
  opacity: 0.5;
}
.leader {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 1.3;
}
.zoom-line {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 1.2;
  stroke-dasharray: 4 5;
  opacity: 0.55;
}
.detail-panel {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue-line);
}
.dna-panel {
  fill: var(--color-learning-teal-soft);
  stroke: var(--color-learning-teal-line);
}
.chromosome-outline {
  stroke: var(--color-learning-blue);
  stroke-width: 1.4;
}
.chromosome-shine {
  fill: none;
  stroke: var(--color-surface);
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.65;
}
.chromosome-bands {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 5;
  opacity: 0.25;
}
.centromere {
  fill: var(--color-learning-violet);
  opacity: 0.45;
}
.gene-locus {
  stroke: var(--color-learning-amber-line);
  stroke-width: 21;
  stroke-linecap: round;
}
.allele-on-band {
  fill: var(--color-learning-amber);
  font-size: 20px;
  font-weight: var(--weight-bold);
  text-anchor: middle;
  dominant-baseline: central;
}
.locus-link {
  stroke: var(--color-learning-amber);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}
.gene-region {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber-line);
  stroke-dasharray: 4 3;
}
.dna-bond {
  stroke: var(--color-learning-teal-line);
  stroke-width: 4;
  stroke-linecap: round;
}
.gene-bond {
  stroke: var(--color-learning-amber-line);
}
.dna-node-blue {
  fill: var(--color-learning-blue);
}
.dna-node-teal {
  fill: var(--color-learning-teal);
}
.dna-strand {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}
.blue {
  stroke: var(--color-learning-blue);
}
.teal {
  stroke: var(--color-learning-teal);
}
.gene-bracket {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 2;
}
.flow-arrow {
  stroke: var(--color-learning-teal);
  stroke-width: 2;
}
.arrow-fill {
  fill: var(--color-learning-teal);
}
.flower-stem {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 7;
  stroke-linecap: round;
}
.flower-leaf {
  fill: var(--color-learning-teal-line);
  stroke: var(--color-learning-teal);
  stroke-width: 1.5;
}
.leaf-veins {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1;
}
.petal {
  stroke: var(--color-learning-violet);
  stroke-width: 1.3;
}
.petal-veins {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 1.2;
  opacity: 0.45;
}
.flower-centre {
  fill: var(--color-learning-amber-line);
  stroke: var(--color-learning-amber);
  stroke-width: 1.5;
}
.pollen {
  fill: var(--color-learning-amber);
}
.genotype-pill {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet-line);
}
.genotype-text {
  fill: var(--color-learning-violet);
  font-size: 18px;
  font-weight: var(--weight-bold);
}
.gamete {
  stroke-width: 1.8;
}
.maternal-gamete {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue);
}
.paternal-gamete {
  fill: var(--color-learning-teal-soft);
  stroke: var(--color-learning-teal);
}
.gamete-chromosome {
  stroke: var(--color-learning-violet);
  stroke-width: 5;
  stroke-linecap: round;
}
.gamete-letter {
  fill: var(--color-learning-violet);
  font-size: 20px;
  font-weight: var(--weight-bold);
}
.unaffected-cell {
  fill: var(--color-learning-teal-soft);
  stroke: var(--color-learning-teal-line);
}
.affected-cell,
.carrier-cell {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber-line);
}
.cross-genotype {
  font-size: 30px;
  font-weight: var(--weight-bold);
  fill: var(--color-learning-violet);
}
.result-panel {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet-line);
}
.probability-ring {
  fill: none;
  stroke: var(--color-learning-violet-line);
  stroke-width: 13;
}
.probability-ring-value {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 13;
}
.probability-number {
  fill: var(--color-learning-violet);
  font-size: 34px;
  font-weight: var(--weight-bold);
}
.pedigree-panel {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue-line);
}
.generation {
  fill: var(--color-learning-blue);
  font-size: 17px;
  font-weight: var(--weight-bold);
}
.pedigree-line {
  stroke: var(--color-ink-soft);
  stroke-width: 2;
  fill: none;
}
.person-unaffected {
  fill: var(--color-surface);
  stroke: var(--color-learning-violet);
  stroke-width: 2.5;
}
.person-affected {
  fill: var(--color-learning-violet);
  stroke: var(--color-learning-violet);
  stroke-width: 2.5;
}
.focus-person {
  stroke: var(--color-learning-amber);
  stroke-width: 3;
}
.future-person {
  fill: var(--color-surface);
  stroke: var(--color-learning-violet);
  stroke-width: 2;
  stroke-dasharray: 4 3;
}
.separator {
  stroke: var(--color-learning-violet-line);
}
.risk-equation {
  fill: var(--color-learning-violet);
  font-size: 23px;
  font-weight: var(--weight-bold);
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.legend-item i {
  display: inline-block;
  width: 13px;
  height: 13px;
  border: 1.5px solid var(--color-learning-violet);
  background: var(--color-surface);
}
.legend-item .circle,
.legend-item .dot {
  border-radius: 50%;
}
.legend-item .diamond {
  transform: rotate(45deg);
  width: 11px;
  height: 11px;
  border-style: dashed;
}
.legend-item .filled {
  background: var(--color-learning-violet);
}
.legend-item .maternal {
  background: var(--color-learning-blue-line);
  border-color: var(--color-learning-blue);
}
.legend-item .paternal {
  background: var(--color-learning-teal-line);
  border-color: var(--color-learning-teal);
}
.legend-item .gene,
.legend-item .affected {
  background: var(--color-learning-amber-line);
  border-color: var(--color-learning-amber);
}
</style>
