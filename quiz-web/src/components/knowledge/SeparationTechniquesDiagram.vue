<!-- ESAT 第八章互动图解：在学习讲义中追踪分离目标、装置路径与色谱证据。 -->
<template>
  <figure class="separation-atlas" :aria-label="heading.title">
    <figcaption>
      <span>CHEMISTRY · 分离技术</span>
      <h5>{{ heading.title }}</h5>
      <p>{{ heading.help }}</p>
    </figcaption>
    <template v-if="mode === 'chemical'">
      <div class="controls" role="group" aria-label="选择物理或化学过程">
        <AppButton
          v-for="(item, i) in processes"
          :key="item.name"
          type="secondary"
          size="small"
          :aria-pressed="processIndex === i"
          @click="chooseProcess(i)"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="controls" role="group" aria-label="观察操作前后">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="!afterProcess"
          @click="afterProcess = false"
          >操作前</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="afterProcess"
          @click="afterProcess = true"
          >操作后</AppButton
        >
      </div>
      <div
        class="diagram-scroll"
        tabindex="0"
        role="region"
        aria-label="物质变化图，窄屏可左右滚动"
      >
        <svg viewBox="0 0 640 240" role="img" :aria-label="process.note">
          <rect x="45" y="30" width="250" height="155" rx="16" class="vessel-fill" />
          <rect x="345" y="30" width="250" height="155" rx="16" class="vessel-fill" />
          <text x="170" y="64" text-anchor="middle">
            {{ afterProcess ? '保留 / 获得的物质' : '起始物质' }}
          </text>
          <text x="470" y="64" text-anchor="middle">
            {{ afterProcess ? '另一部分产物' : '操作条件' }}
          </text>
          <text x="170" y="122" text-anchor="middle" class="large">
            {{ afterProcess ? process.product : process.start }}
          </text>
          <text x="470" y="122" text-anchor="middle" class="large">
            {{ afterProcess ? process.other : process.condition }}
          </text>
          <path d="M305 108H334m-8 -6 8 6-8 6" class="flow" />
          <text x="320" y="218" text-anchor="middle" class="emphasis">
            {{ afterProcess ? process.verdict : '先判断目标：取回原物质，还是生成组成单质？' }}
          </text>
        </svg>
      </div>
      <p class="insight" aria-live="polite">{{ afterProcess ? process.note : process.before }}</p>
      <div class="equation" v-if="afterProcess && process.equation">
        <LatexText :text="process.equation" />
      </div>
    </template>
    <template v-else-if="mode === 'mixtures' || mode === 'methods'">
      <div v-if="mode === 'mixtures'" class="controls" role="group" aria-label="选择混合物">
        <AppButton
          v-for="(item, i) in mixtures"
          :key="item.name"
          type="secondary"
          size="small"
          :aria-pressed="mixtureIndex === i"
          @click="chooseMixture(i)"
          >{{ item.name }}</AppButton
        >
      </div>
      <div v-else class="controls" role="group" aria-label="选择分离方法">
        <AppButton
          v-for="item in methods"
          :key="item.key"
          type="secondary"
          size="small"
          :aria-pressed="methodKey === item.key"
          @click="chooseMethod(item.key)"
          >{{ item.name }}</AppButton
        >
      </div>
      <div class="target-strip">
        <span>{{ mode === 'mixtures' ? mixture.evidence : method.basis }}</span
        ><strong>目标：{{ mode === 'mixtures' ? mixture.target : method.target }}</strong>
      </div>
      <div class="controls" role="group" aria-label="查看分离前后">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="!separated"
          @click="separated = false"
          >先看装置 / 原料</AppButton
        >
        <AppButton type="secondary" size="small" :aria-pressed="separated" @click="separated = true"
          >观察分离结果</AppButton
        >
      </div>
      <div
        class="diagram-scroll"
        tabindex="0"
        role="region"
        aria-label="分离装置图，窄屏可左右滚动"
      >
        <svg viewBox="0 0 640 310" role="img" :aria-label="apparatusExplanation">
          <template v-if="apparatus === 'filter'">
            <path d="M110 50H350L248 163V194H214V163Z" class="glass" />
            <path d="M130 63H330L231 155Z" class="filter-paper" />
            <g v-for="i in 7" :key="i">
              <circle
                :cx="180 + (i % 4) * 28"
                :cy="80 + Math.floor(i / 4) * 20"
                r="6"
                class="sand"
              />
            </g>
            <path d="M157 206V281H305V206" class="glass" />
            <path v-if="separated" d="M160 242H302V278H160Z" class="water" />
            <g v-if="separated" class="salt-particles">
              <circle
                v-for="i in 6"
                :key="i"
                :cx="181 + (i % 3) * 37"
                :cy="252 + Math.floor(i / 3) * 16"
                r="4"
              />
            </g>
            <path v-if="separated" d="M231 190v41m-5 -8 5 8 5-8" class="flow" />
            <path d="M292 88H383M305 255H383" class="leader" />
            <text x="397" y="88">滤渣：不溶的沙</text>
            <text x="397" y="111">仍留在滤纸上</text>
            <text x="397" y="254">滤液：盐水</text>
            <text x="397" y="277">溶解盐随水通过</text>
          </template>
          <template v-else-if="apparatus === 'funnel'">
            <path
              d="M233 30H277V57C360 76 349 157 266 215V249H244V215C161 157 150 76 233 57Z"
              class="glass"
            />
            <path
              d="M189 110H321C320 145 291 175 266 196H244C219 175 190 145 189 110Z"
              class="water"
            />
            <path d="M202 75H308Q325 90 321 110H189Q185 90 202 75Z" class="oil" />
            <path d="M230 233H280" class="glass" />
            <path d="M211 265V300H300V265" class="glass" />
            <path v-if="separated" d="M214 282H297V297H214Z" class="water" />
            <path v-if="separated" d="M255 247v26m-5 -7 5 7 5-7" class="flow" />
            <path d="M310 88H387M304 151H387" class="leader" />
            <text x="400" y="89">上层：较低密度液体</text>
            <text x="400" y="152">下层：较高密度液体</text>
            <text x="400" y="190">静置分层后放出下层</text>
            <text x="400" y="216">液层仍可能含互溶成分</text>
          </template>
          <template v-else-if="apparatus === 'simple' || apparatus === 'fractional'">
            <path
              d="M124 147V205C64 214 66 286 145 286C224 286 226 214 166 205V147"
              class="glass"
            />
            <path d="M91 251Q145 226 199 251Q205 280 145 281Q85 280 91 251Z" class="water" />
            <rect
              x="124"
              :y="apparatus === 'fractional' ? 52 : 120"
              width="42"
              :height="apparatus === 'fractional' ? 97 : 29"
              class="glass"
            />
            <g v-if="apparatus === 'fractional'">
              <path
                v-for="i in 5"
                :key="i"
                :d="'M128 ' + (58 + i * 15) + 'h34'"
                class="column-tray"
              />
              <text x="23" y="92">分馏柱</text>
              <path d="M77 88H120" class="leader" />
            </g>
            <path
              :d="
                apparatus === 'fractional'
                  ? 'M145 52V36H215L462 150V181'
                  : 'M145 120V36H215L462 150V181'
              "
              class="glass"
            />
            <path d="M260 43L441 126L424 162L243 79Z" class="condenser" />
            <path d="M253 62L434 145" class="vapour-tube" />
            <path d="M260 43V22M425 161V186" class="coolant" />
            <text x="273" y="26">冷却水出口</text>
            <text x="438" y="192">冷却水入口</text>
            <path d="M434 201V284H535V201" class="glass" />
            <path v-if="separated" d="M437 254H532V281H437Z" class="water" />
            <path v-if="separated" d="M462 178v56m-5 -8 5 8 5-8" class="flow" />
            <path d="M99 301H191" class="heat" />
            <text x="25" y="302">加热</text>
            <text x="480" y="306" text-anchor="middle">冷凝后收集馏出液</text>
            <text x="315" y="225" text-anchor="middle">
              {{ apparatus === 'simple' ? '溶剂汽化 → 冷凝' : '反复汽化、冷凝 → 富集' }}
            </text>
          </template>
          <template v-else-if="apparatus === 'centrifuge'">
            <g
              v-for="side in [0, 1]"
              :key="side"
              :transform="'translate(' + (110 + side * 300) + ',35)'"
            >
              <path d="M0 0V200Q40 248 80 200V0" class="glass" />
              <path d="M3 40H77V197Q40 238 3 197Z" class="water" />
              <circle
                v-for="i in 12"
                :key="i"
                :cx="side === 1 && separated ? 25 + (i % 4) * 10 : 16 + (i % 4) * 16"
                :cy="
                  side === 1 && separated
                    ? 191 + Math.floor(i / 4) * 8
                    : 63 + Math.floor(i / 4) * 48
                "
                r="4"
                class="sand"
              />
              <text x="40" y="266" text-anchor="middle">
                {{ side === 0 ? '原悬浊液' : separated ? '上清液 + 沉淀' : '离心后观察这一管' }}
              </text>
            </g>
            <path d="M246 141H363m-9 -7 9 7-9 7" class="flow" />
            <text x="303" y="121" text-anchor="middle">离心</text>
          </template>
          <template v-else-if="apparatus === 'dissolve'">
            <path d="M80 50V251H330V50" class="glass" />
            <path d="M83 120H327V248H83Z" class="water" />
            <g v-for="i in 10" :key="i">
              <circle
                :cx="110 + (i % 5) * 40"
                :cy="229 + Math.floor(i / 5) * 12"
                r="6"
                class="sand"
              />
            </g>
            <rect
              v-for="i in 8"
              :key="'salt' + i"
              :x="separated ? 106 + (i % 4) * 56 : 140 + (i % 4) * 23"
              :y="separated ? 146 + Math.floor(i / 4) * 43 : 213 + Math.floor(i / 4) * 15"
              width="7"
              height="7"
              class="salt-particles"
            />
            <text x="390" y="106">盐可溶 → 进入水中</text>
            <text x="390" y="142">沙不溶 → 保留为固体</text>
            <text x="390" y="202">下一步：过滤</text>
            <text x="390" y="235">仅溶解，还没分开收集</text>
          </template>
          <template v-else-if="apparatus === 'evaporate' || apparatus === 'crystallise'">
            <path d="M90 156Q105 252 247 252Q389 252 404 156" class="glass" />
            <path
              :d="
                separated
                  ? 'M128 213H366Q335 247 247 247Q159 247 128 213Z'
                  : 'M103 180H391Q365 247 247 247Q129 247 103 180Z'
              "
              class="water"
            />
            <template v-if="separated && apparatus === 'crystallise'">
              <path
                v-for="i in 7"
                :key="i"
                :d="
                  'M' +
                  (171 + (i % 4) * 40) +
                  ' ' +
                  (228 + Math.floor(i / 4) * 12) +
                  'l8 -8 8 8-8 8Z'
                "
                class="crystal"
              />
            </template>
            <template v-if="apparatus === 'evaporate'">
              <path
                v-for="i in 3"
                :key="i"
                :d="'M' + (166 + i * 42) + ' 142q-12 -22 0-44t0-44'"
                class="vapour"
              />
              <path d="M137 278H360" class="heat" />
              <text x="247" y="302" text-anchor="middle">蒸发除去溶剂</text>
            </template>
            <template v-else>
              <text x="247" y="92" text-anchor="middle">
                {{ separated ? '浓缩后冷却，晶体析出' : '热的近饱和溶液' }}
              </text>
              <text x="247" y="293" text-anchor="middle">形成晶体后，过滤、洗涤、干燥</text>
            </template>
            <text x="451" y="163">保留溶质</text>
            <text x="451" y="195">不用蒸干来</text>
            <text x="451" y="221">保证晶体纯度</text>
          </template>
          <template v-else>
            <rect x="102" y="20" width="290" height="263" rx="4" class="paper" />
            <path d="M107 241H387" class="baseline" />
            <path :d="'M107 ' + (separated ? 41 : 121) + 'H387'" class="front" />
            <circle cx="248" :cy="241 - (separated ? 160 : 96)" r="10" class="spot" />
            <path d="M248 245v11M94 241h-14M94 41h-14" class="leader" />
            <text x="409" y="65">同一组分、同一展开条件</text>
            <text x="409" y="107">Rf 保持 0.80</text>
            <text x="409" y="151">{{ separated ? '斑点：16 cm' : '斑点：9.6 cm' }}</text>
            <text x="409" y="183">{{ separated ? '前沿：20 cm' : '前沿：12 cm' }}</text>
            <text x="250" y="280" text-anchor="middle">铅笔基线（距纸底并非 0）</text>
          </template>
        </svg>
      </div>
      <p class="insight" aria-live="polite">{{ apparatusExplanation }}</p>
      <p class="note">{{ mode === 'mixtures' ? mixture.limit : method.limit }}</p>
    </template>
    <template v-else>
      <div class="controls" role="group" aria-label="选择色谱证据">
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="chromatographyMode === 'purity'"
          @click="chooseChromatography('purity')"
          >完全分离时判纯度</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="chromatographyMode === 'two-dimensional'"
          @click="chooseChromatography('two-dimensional')"
          >同点可能重叠</AppButton
        >
      </div>
      <template v-if="chromatographyMode === 'purity'">
        <div class="controls" role="group" aria-label="选择点样样品">
          <AppButton
            v-for="lane in lanes"
            :key="lane.name"
            type="secondary"
            size="small"
            :aria-pressed="laneKey === lane.name"
            @click="laneKey = lane.name"
            >{{ lane.name }}</AppButton
          >
        </div>
        <div
          class="diagram-scroll"
          tabindex="0"
          role="region"
          aria-label="色谱纯度图，窄屏可左右滚动"
        >
          <svg
            viewBox="0 0 640 300"
            role="img"
            aria-label="教学色谱：W和Z为单斑点，X和Y为多斑点；溶剂前沿10厘米"
          >
            <rect x="65" y="20" width="390" height="255" class="paper" />
            <path d="M70 240H450" class="baseline" />
            <path d="M70 40H450" class="front" />
            <g v-for="(lane, i) in lanes" :key="lane.name">
              <circle
                v-for="height in lane.spots"
                :key="height"
                :cx="122 + i * 90"
                :cy="240 - height * 20"
                :r="laneKey === lane.name ? 10 : 7"
                :class="laneKey === lane.name ? 'spot' : 'spot-muted'"
              />
              <text :x="122 + i * 90" y="264" text-anchor="middle">{{ lane.name }}</text>
            </g>
            <text x="473" y="44">前沿：10 cm</text>
            <text x="473" y="242">基线：0 cm</text>
            <text x="260" y="296" text-anchor="middle">本模式明确假设全部组分被完全分离并检出</text>
          </svg>
        </div>
        <div class="result" aria-live="polite">
          <strong>{{ laneResult }}</strong
          ><span>先看每个样品是否单点，再比较符合条件的样品；距离由基线量到斑点中心。</span>
        </div>
      </template>
      <template v-else>
        <div class="controls" role="group" aria-label="观察二维展开">
          <AppButton
            type="secondary"
            size="small"
            :aria-pressed="!secondSolvent"
            @click="secondSolvent = false"
            >第一溶剂：两个位置</AppButton
          >
          <AppButton
            type="secondary"
            size="small"
            :aria-pressed="secondSolvent"
            @click="secondSolvent = true"
            >第二溶剂：分开四点</AppButton
          >
        </div>
        <div
          class="diagram-scroll"
          tabindex="0"
          role="region"
          aria-label="二维色谱图，窄屏可左右滚动"
        >
          <svg
            viewBox="0 0 640 310"
            role="img"
            :aria-label="
              secondSolvent
                ? '二维展开后原先重叠的成分分别显示四个点'
                : '第一溶剂展开时四种成分两两重叠，只显示两个位置'
            "
          >
            <rect x="88" y="25" width="450" height="240" class="paper" />
            <path d="M108 242H522M108 242V38" class="baseline" />
            <path d="M108 42H508M508 42V242" class="front" />
            <circle
              v-for="(point, i) in twoDimensionalSpots"
              :key="i"
              :cx="secondSolvent ? 108 + point.x * 20 : 108"
              :cy="242 - point.y * 20"
              r="8"
              class="spot"
            />
            <g v-if="secondSolvent">
              <text
                v-for="(point, i) in twoDimensionalSpots"
                :key="i"
                :x="108 + point.x * 20 + 14"
                :y="242 - point.y * 20 + 5"
              >
                {{ point.label }}
              </text>
            </g>
            <path d="M61 233V58m-5 8 5-8 5 8M124 280H485m-8 -5 8 5-8 5" class="flow" />
            <text x="305" y="303" text-anchor="middle">第二方向：前沿 20 cm</text>
            <text x="13" y="30">第一方向</text>
            <text x="13" y="48">前沿 10 cm</text>
          </svg>
        </div>
        <p class="insight" aria-live="polite">
          {{
            secondSolvent
              ? '四点可分辨：A(6,8)、B(6,6)、C(8,6)、D(14,8) cm。A 在第一方向 Rf=8/10=0.80，第二方向 Rf=6/20=0.30，分母不能混用。'
              : '这里只有两个可见位置，但不代表只有两种成分。两对物质在第一溶剂中共迁移，第二溶剂可提供新的分离信息。'
          }}
        </p>
      </template>
      <p class="note">
        这是可操作的教学示意；一般实验中，单斑点与相同 Rf
        都不能独自证明绝对纯度或唯一身份。斑点大小不用于推断含量。
      </p>
    </template>
    <p class="footnote">
      装置与粒子位置均为原理示意，不按真实比例；结果受物质、溶剂及实验条件限制。
    </p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LatexText from '@/components/LatexText.vue'

const props = defineProps<{ topic: string }>()
type Mode = 'chemical' | 'mixtures' | 'methods' | 'purity'
type Apparatus =
  | 'filter'
  | 'funnel'
  | 'simple'
  | 'fractional'
  | 'centrifuge'
  | 'dissolve'
  | 'evaporate'
  | 'crystallise'
  | 'chromatography'
const modeByTopic: Record<string, Mode> = {
  '140801': 'chemical',
  '140802': 'mixtures',
  '140803': 'methods',
  '140804': 'purity',
}
// 每个叶子考点进入对应实验，章级回退到物理与化学的区别。
const mode = computed(() => modeByTopic[props.topic] ?? 'chemical')
const headings = {
  chemical: {
    title: '取回原成分，还是生成单质？',
    help: '比较蒸发、还原与电解；操作前后追踪物质身份。',
  },
  mixtures: { title: '先看混在一起的是什么', help: '切换混合物，观察目标留在哪一份产物中。' },
  methods: {
    title: '一种物性差异，对应一条分离路径',
    help: '选择方法，查看装置原理及应收集的部分。',
  },
  purity: {
    title: '斑点是证据，纯度是有条件的判断',
    help: '先看完全分离的样品，再观察重叠斑点怎样被第二种溶剂分开。',
  },
}
// 图解标题与当前考点对应，避免沿用上一节的任务提示。
const heading = computed(() => headings[mode.value])
const processes = [
  {
    name: '盐水蒸发',
    start: 'NaCl + 水',
    condition: '蒸发水',
    product: 'NaCl',
    other: '水蒸气',
    verdict: '物理分离：盐仍是化合物',
    before: '目标是回收盐，不是制取钠。水与盐本来就是混合物中的不同成分。',
    note: '蒸发只除去水；Na⁺ 与 Cl⁻ 仍组成氯化钠，没有变成 Na 与 Cl₂。',
    equation: '',
  },
  {
    name: '还原氧化铜',
    start: 'CuO + H₂',
    condition: '适当加热',
    product: 'Cu',
    other: 'H₂O',
    verdict: '化学过程：从化合物得到铜单质',
    before: 'CuO 中的铜不是隐藏的小块铜。生成 Cu 要发生还原。',
    note: 'Cu 从 +2 降到 0，氢被氧化为水；这不是将两种已有单质简单分开。',
    equation: '\\(\\mathrm{CuO+H_2\\rightarrow Cu+H_2O}\\)',
  },
  {
    name: '熔盐电解',
    start: '熔融 NaCl',
    condition: '直流电',
    product: 'Na',
    other: 'Cl₂',
    verdict: '化学过程：离子变为组成元素的单质',
    before: '此处指定熔融氯化钠，不是氯化钠水溶液。熔化只让离子能移动，电解才产生单质。',
    note: 'Na⁺ 得电子、Cl⁻ 失电子。若改为水溶液，阴极还会与水的反应竞争，不能直接套用这里的产物。',
    equation:
      '\\(2\\mathrm{NaCl(l)}\\xrightarrow{\\text{电解}}2\\mathrm{Na(l)}+\\mathrm{Cl_2(g)}\\)',
  },
]
const processIndex = ref(0)
const afterProcess = ref(false)
// 操作前后读取同一组固定反应，防止条件与产物混配。
const process = computed(() => processes[processIndex.value]!)
const mixtures: Array<{
  name: string
  apparatus: Apparatus
  evidence: string
  target: string
  limit: string
}> = [
  {
    name: '沙与盐水',
    apparatus: 'filter',
    evidence: '沙不溶；盐已溶解',
    target: '分开沙与盐水',
    limit: '滤液仍是盐水；若还要回收盐，需要后续蒸发或结晶。',
  },
  {
    name: '两层液体',
    apparatus: 'funnel',
    evidence: '两种液体不互溶，静置分层',
    target: '收集指定液层',
    limit: '下层由密度判断；图示不指定有机层必在上方，液层也可能包含多种互溶物质。',
  },
  {
    name: '乙醇与水',
    apparatus: 'fractional',
    evidence: '互溶，不能按液层分开',
    target: '提高乙醇比例',
    limit: '分馏可富集乙醇，但乙醇与水存在恒沸限制，普通分馏不能保证无水纯乙醇。',
  },
  {
    name: '盐与沙',
    apparatus: 'dissolve',
    evidence: '盐可溶于水，沙不溶',
    target: '先让盐进入液相',
    limit: '加水只是第一步；之后过滤留沙、处理滤液回收盐。',
  },
]
const mixtureIndex = ref(0)
// 混合物的分类、目标和对应装置同步切换。
const mixture = computed(() => mixtures[mixtureIndex.value]!)
const methods: Array<{
  key: Apparatus
  name: string
  basis: string
  target: string
  result: string
  limit: string
}> = [
  {
    key: 'simple',
    name: '简单蒸馏',
    basis: '溶剂可挥发，溶质不易挥发',
    target: '回收溶剂',
    result:
      '蒸气沿内管进入冷凝器，冷却后滴入收集器。冷却水走外套，低处进、高处出，与馏出物不混合。',
    limit: '简单蒸馏常用于溶剂与不挥发溶质；只蒸发而不冷凝，就没有回收溶剂。',
  },
  {
    key: 'fractional',
    name: '分馏',
    basis: '互溶液体具有不同挥发性',
    target: '收集富集的馏分',
    result: '分馏柱内反复汽化、冷凝，使较易挥发的组分在上升蒸气中富集；随后冷凝并分段收集。',
    limit:
      '图中柱内横线表示反复接触区域，不是真实塔板结构。分馏不等于每段绝对纯，也不能绕过恒沸限制。',
  },
  {
    key: 'funnel',
    name: '分液漏斗',
    basis: '不互溶的液体形成不同液层',
    target: '收集下层，再保留上层',
    result: '先静置到界面清晰，再控制活塞放出下层；到达界面时停止，换容器后处理另一层。',
    limit: '装置只表示分层与放液原理。分液不能直接拆开互溶的乙醇与水。',
  },
  {
    key: 'centrifuge',
    name: '离心',
    basis: '悬浮颗粒与连续液相的沉降差异',
    target: '沉淀或上清液',
    result: '离心加快悬浮颗粒沉降，形成底部沉淀；上方是上清液，之后仍需分别取出。',
    limit: '图示为离心前后观察管，不是转子安装图。上清液可能含溶解盐，离心不等于脱盐。',
  },
  {
    key: 'dissolve',
    name: '溶解',
    basis: '混合固体在所选溶剂中溶解性不同',
    target: '选择性转移可溶组分',
    result: '盐在水中分散为溶解粒子，沙仍是不溶固体；接着过滤，盐会随滤液走。',
    limit: '小方点表示溶解粒子的分布，不代表水中存在一颗颗微型 NaCl 晶体；省略水分子。',
  },
  {
    key: 'filter',
    name: '过滤',
    basis: '不溶固体与液体可以穿过滤纸的程度不同',
    target: '滤渣或滤液',
    result: '沙被滤纸截留；水与溶解的盐进入接收容器。先确认目标，决定保留滤渣还是滤液。',
    limit: '这是普通过滤示意，不等同于能截留溶解离子的特殊膜分离。',
  },
  {
    key: 'evaporate',
    name: '蒸发',
    basis: '溶剂较易挥发',
    target: '除去溶剂、浓缩溶液',
    result: '溶剂进入气相，剩余溶液更浓；图中未设置冷凝收集，因此不表示已回收水。',
    limit: '不能把所有溶质强热蒸干：有些会分解。需要纯晶体时，应考虑后续结晶。',
  },
  {
    key: 'crystallise',
    name: '结晶',
    basis: '浓缩或降温改变饱和程度',
    target: '回收溶质晶体',
    result: '此图演示已浓缩的热溶液冷却后析晶。滤出晶体，用适量冷溶剂洗涤，再干燥。',
    limit:
      '冷却结晶要求该溶质在所用范围内降温时溶解度降低；不承诺全部溶质析出，也不把所有杂质都画进晶体。',
  },
  {
    key: 'chromatography',
    name: '纸色谱 / Rf',
    basis: '各组分对固定相与流动相的相对作用不同',
    target: '分开并比较组分',
    result:
      '同条件下，前沿由 12 cm 走到 20 cm，该组分由 9.6 cm 走到 16 cm；两个距离同比例变化，Rf 都为 0.80。',
    limit:
      '两幅图对应展开距离变化，不假定溶剂匀速。换纸、换溶剂或明显改变温度后，不能直接沿用原 Rf。',
  },
]
const methodKey = ref<Apparatus>('simple')
const separated = ref(false)
// 装置选择依据教学模式，混合物页不继承方法页的无关状态。
const apparatus = computed(() =>
  mode.value === 'mixtures' ? mixture.value.apparatus : methodKey.value,
)
// 根据实际显示装置匹配规则说明。
const method = computed(() => methods.find((item) => item.key === apparatus.value)!)
// 未操作时说明观察目的，操作后给出目标去向。
const apparatusExplanation = computed(() =>
  separated.value
    ? method.value.result
    : '观察图示中的原料、通路与接收位置；点击“观察分离结果”，追踪目标去了哪里。',
)
const lanes = [
  { name: 'W', spots: [6] },
  { name: 'X', spots: [3, 9] },
  { name: 'Y', spots: [2, 7] },
  { name: 'Z', spots: [8] },
]
const laneKey = ref('W')
const chromatographyMode = ref<'purity' | 'two-dimensional'>('purity')
const secondSolvent = ref(false)
// 完全分离前提下先判单点，再用共同基线和前沿计算。
const laneResult = computed(() => {
  const lane = lanes.find((item) => item.name === laneKey.value)!
  return lane.spots.length === 1
    ? lane.name +
        '：一个斑点，按本模式前提为纯样品；Rf = ' +
        lane.spots[0] +
        '/10 = ' +
        (lane.spots[0]! / 10).toFixed(2)
    : lane.name + '：多个斑点，是混合物；不能以最高斑点代表整个样品的 Rf。'
})
const twoDimensionalSpots = [
  { label: 'A', x: 6, y: 8 },
  { label: 'B', x: 6, y: 6 },
  { label: 'C', x: 8, y: 6 },
  { label: 'D', x: 14, y: 8 },
]
// 更换过程时回到起点，避免直接显示另一个过程的产物。
function chooseProcess(index: number) {
  processIndex.value = index
  afterProcess.value = false
}
// 混合物切换后重新观察其原料与目标。
function chooseMixture(index: number) {
  mixtureIndex.value = index
  separated.value = false
}
// 每种装置从操作前开始，不继承上一装置的结果状态。
function chooseMethod(key: Apparatus) {
  methodKey.value = key
  separated.value = false
}
// 两类纯度证据独立观察，二维模式先呈现重叠现象。
function chooseChromatography(value: 'purity' | 'two-dimensional') {
  chromatographyMode.value = value
  secondSolvent.value = false
}
// 跨知识点切换恢复各模式默认值，不产生学习记录或改变练习范围。
function resetObservation() {
  processIndex.value = 0
  afterProcess.value = false
  mixtureIndex.value = 0
  methodKey.value = 'simple'
  separated.value = false
  laneKey.value = 'W'
  chromatographyMode.value = 'purity'
  secondSolvent.value = false
}
watch(() => props.topic, resetObservation)
</script>

<style scoped>
.separation-atlas {
  --accent: #087c82;
  margin: 0;
  min-width: 0;
  padding: 24px;
  border: 1px solid #c9e3e4;
  border-radius: 14px;
  background: linear-gradient(135deg, #f1faf8, #f8fbff);
  color: #263f55;
}
figcaption > span {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: var(--accent);
}
h5 {
  font-size: 23px;
  margin: 10px 0;
  line-height: 1.45;
}
figcaption p,
.note,
.footnote {
  font-size: 13px;
  line-height: 1.8;
  color: #61788a;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 15px 0;
}
.separation-atlas :deep(.app-button.el-button.app-button--secondary) {
  --app-button-bg: #fff;
  --app-button-border: #b8d6de;
  --app-button-color: #08757d;
  --app-button-hover-bg: #edf8f6;
  --app-button-hover-border: #68b3b2;
  --app-button-active-bg: #e0f2ef;
  --app-button-active-border: #278f8e;
  margin-left: 0;
}
.separation-atlas :deep(.app-button.el-button.app-button--secondary[aria-pressed='true']) {
  --app-button-bg: #e1f3ef;
  --app-button-color: #075f68;
  --app-button-border: #7abbb7;
}
.diagram-scroll {
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}
.diagram-scroll:focus-visible {
  outline: 2px solid #388eaa;
  outline-offset: 2px;
  border-radius: 6px;
}
svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 370px;
  margin: 16px 0;
  overflow: visible;
}
svg text {
  fill: #2f5269;
  font-size: 13px;
}
.large {
  font-size: 24px;
  font-weight: 700;
}
.emphasis {
  font-weight: 700;
  fill: #087c82;
}
.glass {
  fill: none;
  stroke: #7196a9;
  stroke-width: 3;
  stroke-linejoin: round;
}
.vessel-fill {
  fill: #fff;
  stroke: #c2dbdf;
}
.filter-paper {
  fill: #f6f0de;
  stroke: #bdad7d;
  stroke-width: 2;
}
.water {
  fill: #d5eaf5;
}
.oil {
  fill: #f3dc9b;
}
.sand {
  fill: #9a825c;
}
.salt-particles {
  fill: #5388b0;
}
.flow {
  fill: none;
  stroke: #13868b;
  stroke-width: 2.5;
  stroke-linejoin: round;
}
.leader {
  stroke: #91a9b8;
  stroke-width: 1.5;
  fill: none;
}
.condenser {
  fill: #e2f3f0;
  stroke: #65a7a4;
  stroke-width: 2;
}
.vapour-tube {
  fill: none;
  stroke: #799cad;
  stroke-width: 4;
}
.coolant {
  fill: none;
  stroke: #4a9db0;
  stroke-width: 3;
}
.column-tray {
  stroke: #9cb4bd;
  stroke-width: 3;
}
.heat {
  stroke: #c4914d;
  stroke-width: 4;
}
.vapour {
  stroke: #98b6c3;
  fill: none;
  stroke-width: 2;
  stroke-dasharray: 4 4;
}
.crystal {
  stroke: #4085a0;
  fill: #92cbd5;
}
.paper {
  fill: #fffdf7;
  stroke: #c8cbb9;
  stroke-width: 1.5;
}
.baseline {
  stroke: #828d94;
  stroke-width: 1.5;
}
.front {
  stroke: #5d9db1;
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
}
.spot {
  fill: #208b89;
  stroke: #fff;
  stroke-width: 2;
}
.spot-muted {
  fill: #b1c5c5;
}
.insight {
  padding-left: 13px;
  border-left: 3px solid var(--accent);
  font-size: 14px;
  line-height: 1.85;
  margin: 16px 0;
}
.target-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 24px;
  padding: 14px 0;
  border-block: 1px solid #d3e4e6;
  font-size: 13px;
  line-height: 1.6;
}
.target-strip strong {
  color: var(--accent);
}
.result {
  display: grid;
  gap: 9px;
  font-size: 14px;
  line-height: 1.75;
}
.result strong {
  color: var(--accent);
}
.equation {
  text-align: center;
  padding: 12px;
  overflow-x: auto;
}
.footnote {
  padding-top: 12px;
  border-top: 1px solid #d5e5e5;
  margin-bottom: 0;
}
@media (max-width: 700px) {
  .separation-atlas {
    padding: 16px;
  }
  h5 {
    font-size: 20px;
  }
  .controls {
    gap: 7px;
  }
  .controls :deep(.app-button) {
    font-size: 12px;
  }
  svg {
    min-width: 600px;
  }
  .target-strip {
    display: grid;
  }
}
</style>
