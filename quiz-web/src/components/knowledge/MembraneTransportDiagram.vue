<!-- 跨膜运输精细图谱：以磷脂双层、运输蛋白及细胞形态联动解释通路、方向与能量。 -->
<template>
  <BiologyAtlasFrame
    title="穿过细胞膜：看清物质走的是哪条路"
    subtitle="膜的局部放大图：先认磷脂双层，再比较直接穿膜、蛋白通路和供能。"
    note="原创结构示意，不按真实比例。圆点数仅表示相同区域内的相对浓度，不是分子数量测量。渗透比较假定同温同压、主要溶质不能过膜；主动运输图选用直接由 ATP 供能的泵作为实例，其他主动运输也可能间接利用 ATP。"
  >
    <template #controls>
      <div class="mode-buttons" role="group" aria-label="选择跨膜运输方式">
        <AppButton
          v-for="item in modes"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="mode === item.id"
          @click="mode = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
      <div v-if="mode === 'osmosis'" class="water-buttons" role="group" aria-label="选择外液条件">
        <span>比较初始水势</span>
        <AppButton
          v-for="item in waterOptions"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="water === item.id"
          @click="water = item.id"
          >{{ item.label }}</AppButton
        >
      </div>
    </template>

    <svg class="membrane-detail" viewBox="0 0 840 470" role="img" :aria-label="accessibleLabel">
      <defs>
        <linearGradient :id="`${uid}-fluid`" x2="0" y2="1">
          <stop stop-color="var(--color-learning-blue-soft)" />
          <stop offset="1" stop-color="var(--color-learning-teal-soft)" />
        </linearGradient>
        <linearGradient :id="`${uid}-core`" x2="0" y2="1">
          <stop stop-color="var(--color-learning-teal-line)" />
          <stop offset=".5" stop-color="var(--color-learning-amber-soft)" />
          <stop offset="1" stop-color="var(--color-learning-teal-line)" />
        </linearGradient>
        <radialGradient :id="`${uid}-head`" cx=".3" cy=".25">
          <stop stop-color="var(--color-learning-teal-soft)" />
          <stop
            offset=".55"
            stop-color="color-mix(in srgb, var(--color-learning-teal) 45%, var(--color-learning-teal-line))"
          />
          <stop offset="1" stop-color="var(--color-learning-teal)" />
        </radialGradient>
        <linearGradient :id="`${uid}-protein`">
          <stop stop-color="var(--color-learning-violet)" />
          <stop offset=".4" stop-color="var(--color-learning-violet-line)" />
          <stop offset="1" stop-color="var(--color-learning-violet)" />
        </linearGradient>
        <radialGradient :id="`${uid}-cell`">
          <stop stop-color="var(--color-learning-amber-soft)" />
          <stop offset=".75" stop-color="var(--color-learning-amber-line)" />
          <stop
            offset="1"
            stop-color="color-mix(in srgb, var(--color-learning-amber) 45%, var(--color-learning-amber-line))"
          />
        </radialGradient>
        <marker
          :id="`${uid}-arrow`"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10Z" fill="var(--color-learning-blue)" />
        </marker>
        <marker
          :id="`${uid}-small`"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10Z" fill="var(--color-ink-muted)" />
        </marker>
        <g :id="`${uid}-water`">
          <circle r="7" fill="var(--color-learning-blue)" />
          <circle
            cx="-7"
            cy="-5"
            r="3.5"
            fill="var(--color-learning-blue-line)"
            stroke="var(--color-learning-blue-line)"
          />
          <circle
            cx="7"
            cy="-5"
            r="3.5"
            fill="var(--color-learning-blue-line)"
            stroke="var(--color-learning-blue-line)"
          />
        </g>
        <g :id="`${uid}-gas`">
          <circle cx="-5" r="7" fill="var(--color-learning-blue)" />
          <circle cx="5" r="7" fill="var(--color-learning-blue-line)" />
          <path d="M-5-3L5-3" stroke="var(--color-learning-blue-soft)" stroke-width="2" />
        </g>
        <g :id="`${uid}-solute`">
          <path
            d="M-9-5L0-10 9-5 9 5 0 10-9 5Z"
            fill="var(--color-learning-amber-line)"
            stroke="var(--color-learning-amber)"
            stroke-width="1.5"
          />
        </g>
      </defs>
      <rect x="10" y="10" width="820" height="450" rx="20" :fill="`url(#${uid}-fluid)`" />
      <text x="35" y="44" class="region-title">细胞外 · extracellular</text>
      <text x="35" y="339" class="region-title">细胞内 · cytoplasm</text>
      <text x="805" y="44" class="region-state">{{ outerLabel }}</text>
      <text x="805" y="339" class="region-state">{{ innerLabel }}</text>

      <g
        v-for="(point, index) in particles"
        :key="`outside-${index}`"
        :transform="`translate(${point.x} ${point.y})`"
      >
        <use
          v-if="index < outerCount"
          :href="`#${uid}-${mode === 'osmosis' ? 'solute' : mode === 'diffusion' ? 'gas' : 'solute'}`"
        />
      </g>
      <g
        v-for="(point, index) in particles"
        :key="`inside-${index}`"
        :transform="`translate(${point.x} ${point.y + 285})`"
      >
        <use
          v-if="index < innerCount"
          :href="`#${uid}-${mode === 'osmosis' ? 'solute' : mode === 'diffusion' ? 'gas' : 'solute'}`"
        />
      </g>
      <g v-if="mode === 'osmosis'">
        <g v-for="(point, index) in waterPositions" :key="index">
          <use :href="`#${uid}-water`" :x="point.x" :y="point.y" />
          <use :href="`#${uid}-water`" :x="point.x + 9" :y="point.y + 285" />
        </g>
      </g>

      <rect
        x="30"
        y="198"
        width="780"
        height="78"
        rx="9"
        :fill="`url(#${uid}-core)`"
        opacity=".65"
      />
      <g v-for="x in lipidPositions" :key="x">
        <path
          :d="`M${x - 4} 204l-3 11 5 10-4 12 3 10 M${x + 4} 204l4 10-4 11 4 11-2 9 M${x - 4} 270l-3-10 4-9-3-10 M${x + 4} 270l3-10-4-10 3-9`"
          class="lipid-tail"
        />
        <circle
          :cx="x"
          cy="196"
          r="10"
          :fill="`url(#${uid}-head)`"
          stroke="var(--color-learning-teal)"
        />
        <circle
          :cx="x"
          cy="278"
          r="10"
          :fill="`url(#${uid}-head)`"
          stroke="var(--color-learning-teal)"
        />
      </g>
      <g v-if="mode !== 'diffusion'" class="transport-protein">
        <path
          d="M373 166C350 172 359 198 360 217L358 268C353 300 368 320 389 311L402 287 400 187C396 170 390 159 373 166Z"
          :fill="`url(#${uid}-protein)`"
          stroke="var(--color-learning-violet)"
          stroke-width="2"
        />
        <path
          d="M467 166C490 172 481 198 480 217L482 268C487 300 472 320 451 311L438 287 440 187C444 170 450 159 467 166Z"
          :fill="`url(#${uid}-protein)`"
          stroke="var(--color-learning-violet)"
          stroke-width="2"
        />
        <path
          d="M376 181Q368 212 376 239T375 294 M464 181Q473 212 464 239T465 294"
          fill="none"
          stroke="var(--color-learning-violet-soft)"
          stroke-width="4"
          opacity=".8"
        />
        <path
          v-if="mode === 'active' || mode === 'facilitated'"
          d="M398 212Q420 190 442 216L442 246Q419 226 398 252Z"
          fill="var(--color-learning-violet-line)"
          stroke="var(--color-learning-violet)"
          stroke-width="2"
        />
        <path
          v-if="mode === 'active'"
          d="M455 290Q486 283 493 298Q503 320 479 326L463 313Z"
          fill="var(--color-learning-violet-line)"
          stroke="var(--color-learning-violet)"
          stroke-width="2"
        />
      </g>

      <path
        v-if="mode !== 'osmosis' || water !== 'equal'"
        :d="netPath"
        class="net-arrow"
        :marker-end="`url(#${uid}-arrow)`"
        :stroke-dasharray="mode === 'active' || mode === 'facilitated' ? '8 5' : undefined"
      />
      <g v-if="mode === 'osmosis' && water === 'equal'">
        <path d="M409 135V328" class="net-arrow" :marker-end="`url(#${uid}-arrow)`" />
        <path d="M431 328V135" class="net-arrow" :marker-end="`url(#${uid}-arrow)`" />
      </g>
      <path
        v-if="mode === 'diffusion'"
        d="M460 307V160"
        class="random-arrow"
        :marker-end="`url(#${uid}-small)`"
      />
      <path
        v-if="mode === 'osmosis' && water !== 'equal'"
        :d="water === 'higher' ? 'M437 310V156' : 'M403 155V310'"
        class="random-arrow"
        :marker-end="`url(#${uid}-small)`"
      />
      <text x="420" y="92" class="direction-label">{{ directionLabel }}</text>
      <path d="M183 156L183 185" class="leader" />
      <text x="183" y="145" class="annotation">亲水头部</text>
      <path d="M669 238H735V165" class="leader" />
      <text x="735" y="152" class="annotation">疏水尾部</text>
      <path d="M225 305V292" class="leader" />
      <text x="225" y="321" class="small-label">磷脂双层</text>
      <text x="420" y="446" class="transport-caption">{{ routeLabel }}</text>
      <g v-if="mode === 'active'">
        <path
          d="M604 376Q522 370 487 318"
          fill="none"
          stroke="var(--color-learning-amber)"
          stroke-width="2"
          stroke-dasharray="4 3"
        />
        <rect
          x="590"
          y="363"
          width="198"
          height="40"
          rx="20"
          fill="var(--color-learning-amber-soft)"
          stroke="var(--color-learning-amber-line)"
        />
        <text x="689" y="389" class="energy-label">ATP → ADP + Pi</text>
      </g>
    </svg>

    <div v-if="mode === 'osmosis'" class="cell-responses">
      <h6>把局部水流放回完整细胞中看</h6>
      <svg viewBox="0 0 780 290" role="img" :aria-label="cellResponse">
        <text x="184" y="28" class="region-title centered">动物细胞</text>
        <text x="578" y="28" class="region-title centered">植物细胞</text>
        <g
          :transform="`translate(184 146) scale(${water === 'higher' ? 1.12 : water === 'lower' ? 0.76 : 0.94})`"
        >
          <path
            d="M-80-26C-93-75-33-98 12-86C61-94 94-45 84-2C101 46 53 88 2 81C-49 98-98 53-85 12Z"
            fill="var(--color-learning-amber-line)"
            stroke="color-mix(in srgb, var(--color-learning-amber) 45%, var(--color-learning-amber-line))"
            stroke-width="4"
          />
          <path
            d="M-69-24C-78-65-30-81 10-70C51-79 78-40 70-2"
            fill="none"
            stroke="var(--color-learning-amber-soft)"
            stroke-width="5"
          />
          <ellipse
            cx="-20"
            cy="10"
            rx="25"
            ry="28"
            fill="var(--color-learning-violet-line)"
            stroke="var(--color-learning-violet)"
            stroke-width="2"
          />
          <circle cx="-15" cy="14" r="9" fill="var(--color-learning-violet)" />
          <path
            d="M-36 0Q-11-6-22 27M-28-12Q-8-8-6 7"
            fill="none"
            stroke="var(--color-learning-violet)"
            stroke-width="2"
          />
          <g
            v-for="(point, index) in [
              [35, -28],
              [39, 38],
              [-47, -41],
            ]"
            :key="index"
            :transform="`translate(${point[0]} ${point[1]}) rotate(-25)`"
          >
            <ellipse
              rx="17"
              ry="8"
              fill="var(--color-learning-amber-line)"
              stroke="var(--color-learning-amber)"
            />
            <path
              d="M-10 0l5-4 3 7 4-7 5 4"
              fill="none"
              stroke="var(--color-learning-amber)"
              stroke-width="1.8"
            />
          </g>
        </g>
        <rect
          x="456"
          y="52"
          width="244"
          height="186"
          rx="34"
          fill="var(--color-learning-teal-line)"
          stroke="var(--color-learning-teal)"
          stroke-width="6"
        />
        <rect
          x="463"
          y="59"
          width="230"
          height="172"
          rx="29"
          fill="var(--color-learning-teal-soft)"
          stroke="var(--color-learning-teal-line)"
          stroke-width="2"
        />
        <g :transform="`translate(578 145) scale(${water === 'lower' ? 0.72 : 1})`">
          <rect
            x="-110"
            y="-80"
            width="220"
            height="160"
            rx="26"
            fill="var(--color-learning-teal-soft)"
            stroke="var(--color-learning-teal)"
            stroke-width="3"
          />
          <rect
            x="-81"
            y="-65"
            width="169"
            height="133"
            rx="28"
            fill="var(--color-learning-blue-soft)"
            stroke="var(--color-learning-blue-line)"
            stroke-width="2"
          />
          <ellipse
            cx="-90"
            cy="5"
            rx="16"
            ry="22"
            fill="var(--color-learning-violet-line)"
            stroke="var(--color-learning-violet)"
          />
          <circle cx="-89" cy="8" r="6" fill="var(--color-learning-violet)" />
          <g
            v-for="(pos, i) in [
              [-54, -72],
              [40, -72],
              [89, 50],
              [-55, 73],
            ]"
            :key="i"
            :transform="`translate(${pos[0]} ${pos[1]})`"
          >
            <ellipse
              rx="15"
              ry="6"
              fill="color-mix(in srgb, var(--color-learning-teal) 45%, var(--color-learning-teal-line))"
              stroke="var(--color-learning-teal)"
            />
            <path
              d="M-9-2V2M-4-3V3M1-3V3M6-2V2"
              stroke="var(--color-learning-teal)"
              stroke-width="2"
            />
          </g>
          <text x="8" y="7" class="small-label">中央液泡</text>
        </g>
        <text x="184" y="274" class="response-label">{{ animalResponse }}</text>
        <text x="578" y="274" class="response-label">{{ plantResponse }}</text>
      </svg>
    </div>
    <template #legend>
      <span
        ><i class="legend-dot blue" />{{
          mode === 'osmosis'
            ? '水分子：蓝色氧与浅色氢'
            : mode === 'diffusion'
              ? 'O₂：可直接穿膜的小分子'
              : '被运输的溶质'
        }}</span
      >
      <span v-if="mode === 'osmosis'"
        ><i class="legend-dot amber" />六边形：此处不能过膜的溶质</span
      >
      <span>{{
        mode === 'osmosis' && water === 'equal'
          ? '两条等粗箭头：双向等量，无净水流'
          : '粗箭头：净方向；细箭头：相反方向仍有运动'
      }}</span>
      <span v-if="mode === 'active' || mode === 'facilitated'"
        >虚线：蛋白改变构象的运输过程，不是一直敞开的孔</span
      >
    </template>
    <template #explanation>
      <div class="mechanism-explanation" aria-live="polite">
        <h6>{{ current.label }} · 从结构理解过程</h6>
        <p><KnowledgeText :text="current.description" /></p>
        <p><KnowledgeText :text="mode === 'osmosis' ? cellResponse : current.caution" /></p>
      </div>
    </template>
  </BiologyAtlasFrame>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import AppButton from '@/components/AppButton.vue'
import BiologyAtlasFrame from './BiologyAtlasFrame.vue'
import KnowledgeText from './KnowledgeText.vue'

type Mode = 'diffusion' | 'facilitated' | 'osmosis' | 'active'
const uid = useId().replace(/:/g, '')
const mode = ref<Mode>('diffusion')
const water = ref<'higher' | 'equal' | 'lower'>('higher')
const modes = [
  {
    id: 'diffusion',
    label: '简单扩散',
    description:
      '像氧气这样能穿过脂质部分的小分子，可以**直接通过磷脂双层**。图中外侧浓度较高，起初向内通过得更多，因此净方向向内；仍有分子向外运动。',
    caution: '这里不需要运输蛋白或代谢供能。==有浓度差还不够，物质必须能够通过这层膜==。',
  },
  {
    id: 'facilitated',
    label: '易化扩散',
    description:
      '图中用载体蛋白帮助一种不带电溶质顺浓度梯度进入。蛋白先结合溶质，再改变构象并在另一侧释放；另一类易化扩散可以通过通道蛋白进行。**蛋白帮助通行，不等于必须消耗 ATP**。',
    caution:
      '外侧浓度较高，向内净运输符合被动过程。==易化扩散依赖运输蛋白，但不依赖代谢供能==。本图没有把载体画成始终开放的孔。',
  },
  {
    id: 'osmosis',
    label: '渗透',
    description:
      '图中水通过水通道蛋白，两侧水分子都在运动。净方向由**较高水势指向较低水势**；黄色溶质不能通过此处的膜。水通道是常见通路，水也能较慢地穿过脂质部分。',
    caution: '',
  },
  {
    id: 'active',
    label: '主动运输',
    description:
      '这个示例中外侧溶质浓度低、内侧高，蛋白仍把溶质向内运输。图示选用**直接水解 ATP 的泵**，通过构象变化完成逆梯度运输；虚线表示运输过程，不是敞开的通道。',
    caution:
      '==并非所有主动运输蛋白都直接水解 ATP==：有些依靠其他过程维持的离子梯度间接获得能量。判断离子是否逆梯度时，还可能需要考虑电势。',
  },
] as const
const waterOptions = [
  { id: 'higher', label: '外液水势较高' },
  { id: 'equal', label: '两侧水势相等' },
  { id: 'lower', label: '外液水势较低' },
] as const
const particles = [
  { x: 83, y: 93 },
  { x: 232, y: 84 },
  { x: 672, y: 97 },
  { x: 766, y: 126 },
  { x: 128, y: 128 },
  { x: 592, y: 131 },
  { x: 302, y: 118 },
]
const waterPositions = [
  { x: 48, y: 119 },
  { x: 264, y: 151 },
  { x: 322, y: 76 },
  { x: 552, y: 83 },
  { x: 721, y: 147 },
]
// 当前说明与图示共用状态，防止按钮切换后方向、通路和文字不一致。
const current = computed(() => modes.find((item) => item.id === mode.value)!)
// 蛋白嵌入双层处留出结构空间，简单扩散仍完整显示磷脂。
const lipidPositions = computed(() =>
  Array.from({ length: 33 }, (_, i) => 36 + i * 24).filter(
    (x) => mode.value === 'diffusion' || x < 350 || x > 490,
  ),
)
// 等面积区域的溶质示意数与浓度文字对应；水势模式固定内部为四个。
const outerCount = computed(() =>
  mode.value === 'osmosis'
    ? water.value === 'higher'
      ? 2
      : water.value === 'lower'
        ? 6
        : 4
    : mode.value === 'active'
      ? 2
      : 6,
)
const innerCount = computed(() => (mode.value === 'osmosis' ? 4 : mode.value === 'active' ? 6 : 2))
// 水势标签直接比较物理量，避免让学生把蓝色水分子数量当作水势。
const outerLabel = computed(() =>
  mode.value === 'osmosis'
    ? water.value === 'higher'
      ? '初始水势较高'
      : water.value === 'lower'
        ? '初始水势较低'
        : '水势相等'
    : '溶质浓度' + (mode.value === 'active' ? '较低' : '较高'),
)
const innerLabel = computed(() =>
  mode.value === 'osmosis'
    ? water.value === 'higher'
      ? '初始水势较低'
      : water.value === 'lower'
        ? '初始水势较高'
        : '水势相等'
    : '溶质浓度' + (mode.value === 'active' ? '较高' : '较低'),
)
// 同一坐标下上方为细胞外，净吸水向下、净失水向上。
const netPath = computed(() =>
  mode.value === 'osmosis' && water.value === 'lower' ? 'M420 325V133' : 'M420 133V325',
)
// 平衡状态改用双向等量说明，不把任意方向误称为净流向。
const directionLabel = computed(() =>
  mode.value === 'osmosis'
    ? water.value === 'equal'
      ? '双向等量 · 无净水流'
      : water.value === 'higher'
        ? '水起初净进入细胞 ↓'
        : '水起初净离开细胞 ↑'
    : mode.value === 'active'
      ? '逆梯度运输 ↓'
      : '顺梯度净移动 ↓',
)
// 通路名称随机制切换，显式区分载体构象变化和水通道。
const routeLabel = computed(() =>
  mode.value === 'diffusion'
    ? '直接穿过脂质部分 · 无需 ATP'
    : mode.value === 'osmosis'
      ? '水通道蛋白 · 不依赖代谢供能'
      : mode.value === 'active'
        ? 'ATP 驱动的泵：结合 → 构象变化 → 释放'
        : '载体蛋白：结合 → 构象变化 → 释放',
)
// 形态只表达典型初始趋势；植物壁固定，失水时内容物收缩。
const animalResponse = computed(() =>
  water.value === 'higher'
    ? '净吸水、膨胀；过度时可胀破'
    : water.value === 'lower'
      ? '净失水、皱缩'
      : '无净水流，体积相对稳定',
)
// 植物形态说明包含壁的支撑，水势相等本身不唯一决定膨压。
const plantResponse = computed(() =>
  water.value === 'higher'
    ? '吸水后膨压增加，细胞壁支撑'
    : water.value === 'lower'
      ? '失水较多时，可发生质壁分离'
      : '无净水流；膨压取决于当前状态',
)
// 把初始水势关系转为可观察的细胞变化，并保留图示的适用条件。
const cellResponse = computed(() =>
  water.value === 'higher'
    ? '外液初始水势较高，水净进入。动物细胞可膨胀，过度时可能破裂；植物细胞壁抵抗膨胀，膨压增加。**这表示变化趋势，不代表水会无限进入**。'
    : water.value === 'lower'
      ? '外液初始水势较低，水净离开。动物细胞可皱缩；植物先降低膨压，失水足够多时内容物才会离开细胞壁。==松弛不一定已经质壁分离==。'
      : '两侧水势相等时，**两个方向的水分子平均通过量相等**，并非水分子停住。这里以无膨压的简化情境绘制松弛植物细胞；只知道水势相等，不能反推出所有植物细胞都没有膨压。',
)
// 辅助阅读器获得与当前图一致的细胞内外关系、方向和通路。
const accessibleLabel = computed(
  () =>
    `${current.value.label}膜局部图；上方细胞外，下方细胞内。${outerLabel.value}，内部${innerLabel.value}。${directionLabel.value}。${routeLabel.value}。`,
)
</script>

<style scoped>
.mode-buttons,
.water-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.water-buttons {
  width: 100%;
  margin-top: 8px;
  font-size: var(--text-sm);
}
.membrane-detail {
  min-width: 560px;
}
.membrane-detail text,
.cell-responses text {
  fill: var(--color-ink-soft);
  font-family: var(--font-sans);
}
.region-title {
  font-size: 18px;
  font-weight: 600;
}
.region-state {
  font-size: 16px;
  text-anchor: end;
}
.lipid-tail {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 2.4;
  stroke-linejoin: round;
}
.net-arrow {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 4;
}
.random-arrow {
  fill: none;
  stroke: var(--color-ink-muted);
  stroke-width: 1.7;
}
.leader {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1.5;
}
.annotation {
  font-size: 15px;
  text-anchor: middle;
}
.small-label {
  font-size: 14px;
  text-anchor: middle;
}
.direction-label {
  font-size: 19px;
  font-weight: 600;
  text-anchor: middle;
  fill: var(--color-learning-blue) !important;
}
.transport-caption,
.energy-label {
  font-size: 17px;
  text-anchor: middle;
  font-weight: 600;
}
.energy-label {
  fill: var(--color-learning-amber) !important;
}
.legend-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 5px;
}
.blue {
  background: var(--color-learning-blue);
}
.amber {
  background: var(--color-learning-amber-line);
}
.cell-responses {
  margin-top: 18px;
  border-top: 1px solid var(--color-learning-teal-line);
}
.cell-responses h6 {
  margin: 16px 12px 8px;
  font-size: var(--text-sm);
}
.cell-responses svg {
  min-width: 560px;
}
.centered,
.response-label {
  text-anchor: middle;
}
.response-label {
  font-size: 16px;
}
@media (max-width: 760px) {
  .membrane-detail,
  .cell-responses svg {
    min-width: 540px;
  }
}
</style>
