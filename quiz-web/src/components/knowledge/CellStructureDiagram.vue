<!-- 备考细胞识图：原创矢量结构、可键盘操作的引线标注及结构功能联动。 -->
<template>
  <figure class="cell-atlas">
    <figcaption class="atlas-heading">
      <div>
        <span class="atlas-eyebrow">CELL STRUCTURE · 细胞识图</span>
        <h5>{{ cellTitle }}</h5>
      </div>
      <span class="atlas-type">{{ cellType === 'bacterium' ? '原核细胞' : '真核细胞' }}</span>
    </figcaption>

    <div
      v-if="kind === 'eukaryotic-cell'"
      class="cell-switch"
      role="group"
      aria-label="选择细胞类型"
    >
      <AppButton
        v-for="item in cellOptions"
        :key="item.id"
        type="secondary"
        size="small"
        :aria-pressed="cellType === item.id"
        @click="selectCell(item.id)"
        >{{ item.label }}</AppButton
      >
    </div>

    <div class="atlas-workspace">
      <div class="cell-stage">
        <div class="stage-caption"><span>结构示意</span><span>点击编号定位</span></div>
        <svg
          class="cell-illustration"
          viewBox="0 0 640 440"
          role="group"
          :aria-label="accessibleLabel"
        >
          <defs>
            <radialGradient :id="id('cytoplasm')" cx="37%" cy="29%" r="78%">
              <stop offset="0" class="gradient-surface" />
              <stop offset="0.64" class="gradient-blue-soft" />
              <stop offset="1" class="gradient-blue-line" />
            </radialGradient>
            <radialGradient :id="id('nuclear-fill')" cx="35%" cy="30%" r="78%">
              <stop offset="0" class="gradient-violet-soft" />
              <stop offset="1" class="gradient-violet-line" />
            </radialGradient>
            <linearGradient :id="id('vacuole-fill')" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" class="gradient-blue-soft" />
              <stop offset="1" class="gradient-blue-line" />
            </linearGradient>
            <linearGradient :id="id('wall-fill')" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" class="gradient-teal-soft" />
              <stop offset="1" class="gradient-teal-line" />
            </linearGradient>
            <linearGradient :id="id('mitochondrion-fill')" x1="0" y1="0" x2="0.7" y2="1">
              <stop offset="0" class="gradient-amber-soft" />
              <stop offset="1" class="gradient-amber-line" />
            </linearGradient>
            <g :id="id('nucleus')">
              <ellipse
                class="nuclear-envelope structure-outline"
                rx="53"
                ry="49"
                :fill="paint('nuclear-fill')"
              />
              <ellipse class="nuclear-inner" rx="47" ry="43" />
              <path
                class="chromatin"
                d="M-29-21C-10-32-20-4-4-12S21-25 28-12 M-35 5C-21-7-16 17-5 11S15 20 30 6 M-19 27C-7 18-1 32 15 24 M5-31C21-36 27-30 32-23"
              />
              <ellipse class="nucleolus" cx="10" cy="-3" rx="14" ry="12" />
              <ellipse class="nucleolus-light" cx="7" cy="-6" rx="5" ry="4" />
              <g class="nuclear-pores">
                <path d="M-49-12l6 2 M-24-43l3 6 M29-40l-4 6 M50 11l-6-1 M22 44l-3-6 M-28 41l3-6" />
              </g>
            </g>
            <g :id="id('mitochondrion')">
              <path
                class="mitochondrial-envelope structure-outline"
                :fill="paint('mitochondrion-fill')"
                d="M-35 0C-39-15-19-23 2-18C23-17 39-7 36 7C34 22 12 23-7 18C-24 17-33 11-35 0Z"
              />
              <path
                class="mitochondrial-inner"
                d="M-29-1C-30-11-17-15-8-12L-12-2Q-14 4-9 5L-2-11Q3-12 8-8L4 3Q2 10 7 10L16-6Q23-4 26 0L20 8Q18 12 24 11C14 19-5 12-15 11C-24 8-28 5-29-1Z"
              />
            </g>
            <g :id="id('chloroplast')">
              <ellipse
                class="chloroplast-envelope structure-outline"
                rx="33"
                ry="18"
                :fill="paint('wall-fill')"
              />
              <ellipse class="chloroplast-inner" rx="28" ry="14" />
              <path class="chloroplast-lamella" d="M-22 3L21-2 M-20-3L20 4" />
              <g v-for="x in [-17, -2, 13]" :key="x" :transform="'translate(' + x + ' 0)'">
                <rect
                  v-for="y in [-7, -2, 3]"
                  :key="y"
                  class="granum"
                  x="-5"
                  :y="y"
                  width="10"
                  height="3.4"
                  rx="1.7"
                />
              </g>
            </g>
          </defs>

          <g aria-hidden="true" v-if="cellType === 'animal'">
            <g :class="structureClass('membrane')">
              <path
                class="animal-membrane structure-outline"
                :fill="paint('cytoplasm')"
                d="M151 115C165 70 226 50 278 67C330 38 411 66 446 105C497 126 516 176 489 220C511 273 461 325 405 333C353 373 279 357 238 335C182 345 135 310 128 264C100 227 114 178 132 155C128 138 138 124 151 115Z"
              />
              <path
                class="membrane-inner"
                d="M157 120C169 78 227 58 279 74C332 46 406 72 442 112C491 133 507 177 482 219C503 267 456 318 402 325C353 365 280 349 240 328C185 337 143 307 135 261C108 227 122 180 140 157C136 140 145 128 157 120Z"
              />
            </g>
            <g :class="structureClass('cytoplasm')">
              <path
                class="cytoplasm-emphasis"
                d="M143 204Q153 186 180 190T212 219Q201 241 170 236T143 204Z"
              />
            </g>
            <g :class="structureClass('nucleus')" transform="translate(310 200) rotate(-9)">
              <use :href="'#' + id('nucleus')" />
            </g>
            <g :class="structureClass('mitochondrion')">
              <use
                :href="'#' + id('mitochondrion')"
                transform="translate(190 139) rotate(-24) scale(1.08)"
              />
              <use :href="'#' + id('mitochondrion')" transform="translate(420 270) rotate(-31)" />
              <use
                :href="'#' + id('mitochondrion')"
                transform="translate(233 297) rotate(14) scale(.85)"
              />
            </g>
          </g>

          <g aria-hidden="true" v-else-if="cellType === 'plant'">
            <g :class="structureClass('wall')">
              <path
                class="plant-wall structure-outline"
                :fill="paint('wall-fill')"
                d="M173 63L450 52Q483 53 490 84L512 322Q514 355 480 366L188 382Q151 382 143 349L125 111Q122 77 157 67Z"
              />
              <path
                class="wall-grain"
                d="M157 79L145 93 M172 72L160 84 M196 68L184 80 M472 63L461 75 M495 312L507 322 M165 363L175 375 M456 356L466 368"
              />
            </g>
            <g :class="structureClass('membrane')">
              <path
                class="plant-membrane structure-outline"
                :fill="paint('cytoplasm')"
                d="M179 77L443 66Q472 67 477 91L498 319Q501 344 475 351L191 368Q165 370 157 344L139 113Q136 89 164 81Z"
              />
            </g>
            <g :class="structureClass('cytoplasm')">
              <path
                class="cytoplasm-emphasis"
                d="M149 158Q178 149 181 169L178 191Q163 204 150 191Z"
              />
            </g>
            <g :class="structureClass('vacuole')">
              <path
                class="vacuole-body structure-outline"
                :fill="paint('vacuole-fill')"
                d="M270 111C304 101 377 104 408 120Q437 136 443 178L452 272Q453 306 422 314L268 324Q240 322 237 294L228 157Q228 120 270 111Z"
              />
              <path class="vacuole-highlight" d="M251 153Q249 130 279 126L374 125" />
            </g>
            <g
              :class="structureClass('nucleus')"
              transform="translate(190 226) rotate(-16) scale(.68)"
            >
              <use :href="'#' + id('nucleus')" />
            </g>
            <g :class="structureClass('chloroplast')">
              <use
                :href="'#' + id('chloroplast')"
                transform="translate(196 117) rotate(-22) scale(.88)"
              />
              <use
                :href="'#' + id('chloroplast')"
                transform="translate(441 100) rotate(21) scale(.82)"
              />
              <use
                :href="'#' + id('chloroplast')"
                transform="translate(466 205) rotate(82) scale(.94)"
              />
              <use
                :href="'#' + id('chloroplast')"
                transform="translate(452 334) rotate(-14) scale(.85)"
              />
              <use
                :href="'#' + id('chloroplast')"
                transform="translate(207 343) rotate(7) scale(.85)"
              />
            </g>
            <g :class="structureClass('mitochondrion')">
              <use
                :href="'#' + id('mitochondrion')"
                transform="translate(187 288) rotate(65) scale(.67)"
              />
              <use
                :href="'#' + id('mitochondrion')"
                transform="translate(337 345) rotate(-4) scale(.72)"
              />
              <use :href="'#' + id('mitochondrion')" transform="translate(316 90) scale(.61)" />
            </g>
          </g>

          <g aria-hidden="true" v-else>
            <g :class="structureClass('wall')">
              <path
                class="bacterial-wall structure-outline"
                :fill="paint('wall-fill')"
                d="M196 112C249 70 416 89 461 143C501 190 494 252 448 282C398 324 241 338 182 300C122 264 111 204 143 157C156 137 176 124 196 112Z"
              />
            </g>
            <g :class="structureClass('membrane')">
              <path
                class="bacterial-membrane structure-outline"
                :fill="paint('cytoplasm')"
                d="M202 125C255 86 407 103 450 153C483 194 479 244 439 271C391 309 248 323 190 289C139 257 128 208 155 164C167 145 182 136 202 125Z"
              />
            </g>
            <g :class="structureClass('cytoplasm')">
              <path
                class="cytoplasm-emphasis"
                d="M157 193Q171 177 190 188L203 219Q194 238 173 226Z"
              />
            </g>
            <g :class="structureClass('chromosome')">
              <path class="bacterial-chromosome chromosome-underlay" :d="chromosomePath" />
              <path class="bacterial-chromosome structure-outline" :d="chromosomePath" />
              <path
                class="chromosome-detail"
                d="M242 170l6 4 M285 149l-1 7 M350 157l-2 7 M381 187l-6 1 M352 239l-3-6 M292 265l1-7 M240 239l6-4"
              />
            </g>
            <g :class="structureClass('plasmid')">
              <ellipse
                class="plasmid-ring structure-outline"
                cx="418"
                cy="244"
                rx="23"
                ry="14"
                transform="rotate(-27 418 244)"
              />
              <ellipse
                class="plasmid-inner"
                cx="418"
                cy="244"
                rx="18"
                ry="9"
                transform="rotate(-27 418 244)"
              />
              <ellipse
                class="plasmid-ring structure-outline"
                cx="201"
                cy="269"
                rx="14"
                ry="9"
                transform="rotate(16 201 269)"
              />
            </g>
          </g>

          <g :class="structureClass('ribosome')" aria-hidden="true">
            <g
              v-for="(point, index) in ribosomePoints"
              :key="index"
              :transform="'translate(' + point[0] + ' ' + point[1] + ')'"
            >
              <circle class="ribosome-particle" r="2.6" />
              <circle class="ribosome-highlight" cx="-.7" cy="-.8" r=".8" />
            </g>
            <circle
              v-if="selectedPart === 'ribosome'"
              class="ribosome-focus"
              :cx="activePart.target[0]"
              :cy="activePart.target[1]"
              r="11"
            />
          </g>

          <g
            v-for="part in cellParts"
            :key="part.key"
            class="cell-annotation"
            :class="{ 'cell-annotation--active': selectedPart === part.key }"
            role="button"
            tabindex="0"
            :aria-label="part.number + '，' + part.name + '，查看识图提示'"
            :aria-pressed="selectedPart === part.key"
            @click="selectPart(part.key)"
            @keydown.enter.prevent="selectPart(part.key)"
            @keydown.space.prevent="selectPart(part.key)"
          >
            <path class="annotation-line" :d="annotationPath(part)" />
            <circle class="annotation-anchor" :cx="part.target[0]" :cy="part.target[1]" r="3" />
            <circle class="annotation-hit" :cx="part.label[0]" :cy="part.label[1]" r="25" />
            <circle class="annotation-badge" :cx="part.label[0]" :cy="part.label[1]" r="18" />
            <text :x="part.label[0]" :y="part.label[1]" dy=".35em">{{ part.number }}</text>
          </g>
        </svg>
        <p class="stage-note">原创结构示意 · 非显微照片 · 不按真实比例</p>
      </div>

      <div class="structure-inspector">
        <p class="inspector-label">选一个结构，一起看它长什么样、有什么作用</p>
        <div class="structure-index" role="group" aria-label="选择结构查看功能与题干线索">
          <AppButton
            v-for="part in cellParts"
            :key="part.key"
            type="secondary"
            size="small"
            :aria-pressed="selectedPart === part.key"
            @click="selectPart(part.key)"
            ><span class="index-number">{{ part.number }}</span
            >{{ part.name }}</AppButton
          >
        </div>
        <div class="structure-detail" aria-live="polite" aria-atomic="true">
          <header>
            <span class="detail-number">{{ activePart.number }}</span>
            <div>
              <h6>{{ activePart.name }}</h6>
              <span>{{ activePart.english }}</span>
            </div>
          </header>
          <dl>
            <div>
              <dt>在图上怎么看</dt>
              <dd><KnowledgeText :text="activePart.appearance" /></dd>
            </div>
            <div>
              <dt>它有什么作用</dt>
              <dd><KnowledgeText :text="activePart.description" /></dd>
            </div>
            <div class="detail-clue">
              <dt>题目里怎样用</dt>
              <dd><KnowledgeText :text="activePart.clue" /></dd>
            </div>
          </dl>
          <p class="detail-trap">
            <strong>这里容易混淆</strong><KnowledgeText :text="activePart.trap" />
          </p>
        </div>
      </div>
    </div>

    <div class="atlas-reading">
      <span>跟着图看一遍</span>
      <p><KnowledgeText :text="readingStrategy" /></p>
    </div>
    <p class="atlas-caution"><KnowledgeText :text="cellCaution" /></p>
    <p v-if="cellType !== 'bacterium'" class="atlas-microdetail">
      <KnowledgeText
        text="再看一眼细胞核内部：深色小团是**核仁**，细丝是含有 DNA 的**染色质**。画出这些结构是为了帮助认图，不能据此认定细胞正在分裂。"
      />
    </p>
  </figure>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import KnowledgeText from './KnowledgeText.vue'

type CellType = 'animal' | 'plant' | 'bacterium'
type PartKey =
  | 'membrane'
  | 'cytoplasm'
  | 'nucleus'
  | 'mitochondrion'
  | 'wall'
  | 'chloroplast'
  | 'vacuole'
  | 'chromosome'
  | 'plasmid'
  | 'ribosome'
interface StructureCopy {
  name: string
  english: string
  appearance: string
  description: string
  clue: string
  trap: string
}
interface CellPart extends StructureCopy {
  key: PartKey
  number: number
  target: [number, number]
  label: [number, number]
}
type PartLocation = [PartKey, [number, number], [number, number]]

const props = defineProps<{ kind: 'eukaryotic-cell' | 'prokaryotic-cell' }>()
const diagramId = useId().replace(/:/g, '')
const cellType = ref<CellType>(props.kind === 'prokaryotic-cell' ? 'bacterium' : 'animal')
const selectedPart = ref<PartKey>('nucleus')
const cellOptions = [
  { id: 'animal', label: '动物细胞' },
  { id: 'plant', label: '植物细胞' },
] as const
const chromosomePath =
  'M226 186C211 158 257 139 278 156C296 171 267 190 253 182C228 168 256 126 292 145C319 159 298 200 280 185C262 168 306 143 339 157C368 168 370 198 346 195C321 189 334 153 365 172C399 192 382 232 356 222C332 213 370 197 374 226C377 251 341 272 324 251C307 231 342 215 344 246C344 276 299 284 283 260C269 239 308 222 309 249C310 274 269 280 251 254C235 230 269 213 276 237C281 260 238 253 228 228C216 201 253 187 255 210C256 234 218 222 226 186Z'

const structureCopy: Record<PartKey, StructureCopy> = {
  membrane: {
    name: '细胞膜',
    english: 'cell membrane',
    appearance:
      '沿着细胞边缘找那层薄薄的边界，它包住细胞内容物。如果外面还有细胞壁，记住：**细胞膜在壁的内侧**。',
    description:
      '它调控哪些物质能进入或离开细胞。不同物质通过它的难易程度不同，这就是“**选择性通透**”的意思。',
    clue: '如果题目问“哪一层控制物质进出”，应先找==细胞膜==，不要因为细胞壁画得更厚就选细胞壁。',
    trap: '有细胞壁的细胞仍然有细胞膜。两层位置相邻，但**支持细胞**和**调控物质进出**是不同的作用。',
  },
  cytoplasm: {
    name: '细胞质',
    english: 'cytoplasm',
    appearance:
      '看细胞膜以内、细胞核以外的部分，这里是**细胞质**。图中的浅色背景表示其中的液态部分，其他细胞器分布在其中。',
    description:
      '细胞质中有许多酶，能帮助化学反应进行。因此，细胞维持生命所需的**许多代谢反应**会在这里发生。',
    clue: '题目若把它描述成“含有酶，许多化学反应在其中进行的区域”，可联系到==细胞质==。',
    trap: '图上的浅色部分不是空白或空气。也不要把细胞质想成另一颗由膜单独包住的小球。',
  },
  nucleus: {
    name: '细胞核',
    english: 'nucleus',
    appearance:
      '先找由**核膜**包围的结构。图中核内有细丝状的染色质和较深的小团；那个小团是核仁，不是第二个细胞核。',
    description:
      '细胞核保存着**大部分 DNA**。细胞利用其中的基因信息制造蛋白质，进而调节生长等活动。',
    clue: '判断真核还是原核时，重点问：==有没有核膜把 DNA 包围起来？== 这比只看细胞是圆形还是长条形更可靠。',
    trap: '不要把“大部分 DNA”读成“全部 DNA”。线粒体和叶绿体也各自含有少量 DNA。',
  },
  mitochondrion: {
    name: '线粒体',
    english: 'mitochondrion',
    appearance:
      '找到长圆或豆状的结构，再看里面：内膜向内折叠，这些折叠叫作**嵴**。识图时，里面的折叠比外轮廓更有帮助。',
    description:
      '它是**有氧呼吸的重要场所**，其中的反应能生成 ATP。细胞用 ATP 为运动、合成物质等活动提供能量。',
    clue: '题目问某种细胞为什么有较多线粒体时，可以接着想：它是否有==较大的能量需求==，需要更多 ATP？',
    trap: '植物也要呼吸、也需要 ATP，所以植物细胞也可有线粒体。**线粒体负责呼吸中的供能，叶绿体负责光合作用**，两者不要互换。',
  },
  wall: {
    name: '细胞壁',
    english: 'cell wall',
    appearance: '找**细胞膜外面**较厚的那一层。图中把壁和膜分开画，是为了让你看清它们的位置关系。',
    description: '它提供支撑和保护。细胞吸水时，细胞壁还能限制细胞过度膨胀。',
    clue: '如果题目强调“保持形状”或“抵抗吸水后的膨胀”，可以想到==细胞壁的支撑作用==。',
    trap: '控制物质进出的主要选择性屏障是细胞膜。细菌也通常有细胞壁，因此**有壁不等于一定是植物细胞**。',
  },
  chloroplast: {
    name: '叶绿体',
    english: 'chloroplast',
    appearance:
      '找到椭圆结构后，看里面一叠叠的小片。每一叠称为**基粒**；这与线粒体中内膜的折叠画法不同。',
    description: '它含有**叶绿素**，能吸收光能，是光合作用的场所。植物可在这里利用光能制造有机物。',
    clue: '看到“吸收光能”或“进行光合作用”，就把功能与==叶绿体==联系起来。',
    trap: '**不是所有植物细胞都有叶绿体**，例如根毛细胞通常没有。所以只看到“没有叶绿体”，还不能排除它是植物细胞。',
  },
  vacuole: {
    name: '中央液泡',
    english: 'central vacuole',
    appearance:
      '典型成熟植物细胞里，中央液泡常占很大一部分空间。看图时也留意它的周围：**细胞质并没有消失**。',
    description:
      '液泡内装着**细胞液**。吸水后，细胞内容物向外推压细胞壁，形成膨压，帮助细胞保持挺实。',
    clue: '若题目提到“含细胞液”“大而持久”或“帮助维持膨压”，应想到==中央液泡==。',
    trap: '液泡里有液体，不是空洞。也要分清三个名称：**细胞核、细胞质、细胞液**不是同一回事。',
  },
  chromosome: {
    name: '染色体 DNA',
    english: 'chromosomal DNA',
    appearance:
      '先找细菌中盘曲成团的那段较大 DNA。它集中分布的区域叫**拟核**，但周围没有核膜；图中画的是典型的环状染色体。',
    description: '这段 DNA 携带细胞**主要的遗传信息**，其中的基因参与决定细胞能制造哪些蛋白质。',
    clue: '题目说“DNA 没有核膜包围”时，这是判断==原核细胞==的重要依据，不能只凭细胞的外形下结论。',
    trap: '**没有细胞核，不等于没有 DNA**。拟核只是 DNA 集中的区域，不是一个由膜包围的细胞核。',
  },
  plasmid: {
    name: '质粒 DNA',
    english: 'plasmid DNA',
    appearance:
      '看大段染色体 DNA 旁边的小环，它表示**质粒**。大小差异在这里是识图提示，不代表图按真实比例绘制。',
    description:
      '质粒是染色体之外的额外 DNA，可在细胞内独立于染色体复制。有些质粒带有**抗生素抗性基因**，可能帮助细菌在相应抗生素存在时存活。',
    clue: '如果题目说“染色体之外的小型环状 DNA”，通常是在描述==质粒==；再根据题目提供的基因信息判断它的作用。',
    trap: '要分开判断两件事：**细菌不一定有质粒，有质粒也不一定有抗性基因**。不能只凭画了一个小环，就断定细菌有抗药性。',
  },
  ribosome: {
    name: '核糖体',
    english: 'ribosome',
    appearance:
      '图中散布的小颗粒表示**核糖体**，画得比细胞核、线粒体小很多。它们不是染色体的小碎片。',
    description:
      '核糖体是**合成蛋白质**的场所，本身没有膜包围。细菌虽然没有细胞核，也需要核糖体制造蛋白质。',
    clue: '问“哪种结构直接合成蛋白质”时，选==核糖体==；不要因为细胞核含有基因，就把这两个结构混为一谈。',
    trap: '名字里都有“核”，作用却不同：**细胞核保存大部分 DNA，核糖体合成蛋白质**。',
  },
}

const locations: Record<CellType, PartLocation[]> = {
  animal: [
    ['membrane', [152, 114], [47, 96]],
    ['cytoplasm', [169, 213], [47, 191]],
    ['nucleus', [335, 163], [593, 96]],
    ['mitochondrion', [420, 270], [593, 287]],
    ['ribosome', [222, 251], [47, 304]],
  ],
  plant: [
    ['membrane', [142, 149], [47, 99]],
    ['cytoplasm', [160, 174], [47, 181]],
    ['nucleus', [189, 220], [47, 263]],
    ['mitochondrion', [187, 288], [47, 347]],
    ['wall', [485, 77], [593, 88]],
    ['chloroplast', [466, 205], [593, 176]],
    ['vacuole', [375, 226], [593, 264]],
    ['ribosome', [415, 328], [593, 352]],
  ],
  bacterium: [
    ['membrane', [157, 162], [47, 102]],
    ['cytoplasm', [180, 206], [47, 201]],
    ['wall', [455, 139], [593, 102]],
    ['chromosome', [339, 157], [593, 201]],
    ['plasmid', [418, 244], [593, 300]],
    ['ribosome', [235, 294], [47, 300]],
  ],
}
const ribosomes: Record<CellType, [number, number][]> = {
  animal: [
    [167, 182],
    [182, 195],
    [205, 221],
    [222, 251],
    [230, 246],
    [216, 258],
    [267, 285],
    [283, 304],
    [309, 317],
    [353, 295],
    [377, 318],
    [444, 216],
    [454, 193],
    [411, 154],
    [392, 134],
    [359, 111],
    [325, 96],
    [264, 111],
    [244, 150],
    [172, 258],
    [156, 236],
    [386, 224],
    [426, 122],
  ],
  plant: [
    [153, 131],
    [166, 153],
    [170, 183],
    [208, 173],
    [216, 193],
    [215, 261],
    [163, 312],
    [255, 342],
    [276, 350],
    [291, 336],
    [376, 344],
    [403, 340],
    [415, 328],
    [420, 325],
    [411, 333],
    [477, 274],
    [483, 302],
    [455, 145],
    [456, 164],
    [394, 91],
    [363, 87],
    [259, 96],
    [236, 94],
  ],
  bacterium: [
    [180, 166],
    [191, 153],
    [204, 179],
    [214, 149],
    [251, 124],
    [280, 116],
    [310, 122],
    [340, 128],
    [386, 139],
    [412, 157],
    [441, 184],
    [453, 213],
    [387, 269],
    [355, 290],
    [318, 300],
    [281, 296],
    [250, 292],
    [235, 294],
    [231, 288],
    [240, 299],
    [166, 222],
    [172, 241],
    [206, 232],
    [397, 194],
    [410, 207],
  ],
}

// 多个图卡同时挂载时，渐变与细胞器定义使用实例独立 ID，避免互相串图。
function id(name: string): string {
  return diagramId + '-' + name
}
// SVG 引用同一组实例内渐变，让绘制层不依赖新增全局颜色。
function paint(name: string): string {
  return 'url(#' + id(name) + ')'
}
// 所选结构保留自身语义色，并以轮廓和轻微光晕提供额外的定位反馈。
function structureClass(key: PartKey): Record<string, boolean> {
  return { 'cell-structure': true, 'cell-structure--active': selectedPart.value === key }
}
// 引线在细胞外先折转，再接向实际结构，避免把编号压在细胞器上。
function annotationPath(part: CellPart): string {
  const left = part.label[0] < 320
  return (
    'M' +
    (part.label[0] + (left ? 19 : -19)) +
    ' ' +
    part.label[1] +
    'H' +
    (left ? 100 : 540) +
    'L' +
    part.target[0] +
    ' ' +
    part.target[1]
  )
}
// 图中与文字列表选择同一个结构，只有展示状态改变，不影响题目范围。
function selectPart(key: PartKey): void {
  selectedPart.value = key
}
// 动植物切换保留有效的共同结构，否则回到细胞核，防止索引错配。
function selectCell(type: CellType): void {
  cellType.value = type
  if (!locations[type].some(([key]) => key === selectedPart.value))
    selectedPart.value = type === 'bacterium' ? 'chromosome' : 'nucleus'
}

// 位置按细胞类型定义，功能文案共用；壁的成分和细胞质定义按原核情境细化。
const cellParts = computed<CellPart[]>(() =>
  locations[cellType.value].map(([key, target, label], index) => {
    const copy = { ...structureCopy[key] }
    if (key === 'wall')
      copy.description =
        cellType.value === 'bacterium'
          ? '典型细菌的细胞壁含有**肽聚糖**，能支持和保护细胞，也帮助抵抗吸水后的过度膨胀。记成分时，要把它与植物细胞壁的纤维素分开。'
          : '植物细胞壁主要含**纤维素**，能支撑细胞。细胞吸水后，细胞壁限制它继续膨大，帮助维持形状。'
    if (key === 'cytoplasm' && cellType.value === 'bacterium')
      copy.appearance =
        '看细胞膜以内的区域，DNA 和核糖体都分布在这里。图中浅色背景表示细胞质的液态部分；细菌没有由核膜包围的细胞核。'
    return { ...copy, key, number: index + 1, target, label }
  }),
)
// 结构详情始终从当前图对应的列表获取，不让旧选中项泄漏到另一类型。
const activePart = computed(
  () => cellParts.value.find((part) => part.key === selectedPart.value) ?? cellParts.value[0]!,
)
// 核糖体位置避开其他细胞器和液泡，维持“细小颗粒”的辨识特征。
const ribosomePoints = computed(() => ribosomes[cellType.value])
// 标题明确典型细胞情境，避免把光合叶肉图推广为所有植物细胞。
const cellTitle = computed(() =>
  cellType.value === 'plant'
    ? '典型光合植物细胞'
    : cellType.value === 'bacterium'
      ? '典型细菌细胞'
      : '典型动物细胞',
)
// 非视觉阅读也包含全部结构及示意图限制，编号仅用于对应而不代替结构名。
const accessibleLabel = computed(
  () =>
    cellTitle.value +
    '结构示意。' +
    cellParts.value.map((part) => part.number + '，' + part.name).join('；') +
    '。可聚焦编号并按回车或空格查看。非显微照片，不按真实比例。',
)
// 每类细胞提供实际可用于判断选项的识图顺序，而不只依赖外形和颜色。
const readingStrategy = computed(() =>
  cellType.value === 'bacterium'
    ? '先找 DNA，确认==周围没有核膜==。再把较大的染色体 DNA 与小质粒分开看，最后沿外缘找细胞膜和细胞壁，并留意散布的核糖体。'
    : cellType.value === 'plant'
      ? '先沿边缘分清==外侧的细胞壁与内侧的细胞膜==。接着找中央液泡和叶绿体，再确认细胞核与线粒体；植物细胞也需要呼吸供能。'
      : '先找到==由核膜包围的细胞核==。接着看哪些小结构里有折叠的内膜，那是线粒体。最后再沿外缘找细胞膜，辨认细胞质和小颗粒状的核糖体。',
)
// 典型结构不写成绝对规则，帮助学生处理缺少某结构的特化细胞。
const cellCaution = computed(() =>
  cellType.value === 'plant'
    ? '这张图选的是典型光合植物细胞。**根毛细胞通常没有叶绿体**，液泡大小也会随细胞类型和发育阶段变化，不能要求每个植物细胞都长得和图中一样。图中只画出本节需要学习的主要结构。'
    : cellType.value === 'bacterium'
      ? '这是一幅典型细菌示意图，**不是每个细菌都有质粒**。细菌的细胞壁成分也与植物不同。做题时要看题目给出的结构证据，不能单看颜色和外形；图中未画出的结构，也不能直接断定它一定没有。'
      : '这张图画的是典型动物细胞。特化细胞可能不同，例如**成熟哺乳动物红细胞没有细胞核和线粒体**。遇到这类题，先读清题目指定的细胞，再判断哪些结构应当存在。',
)

// 同一组件切到另一考纲图时，回到该类细胞的核心鉴别结构。
watch(
  () => props.kind,
  (kind) => {
    cellType.value = kind === 'prokaryotic-cell' ? 'bacterium' : 'animal'
    selectedPart.value = kind === 'prokaryotic-cell' ? 'chromosome' : 'nucleus'
  },
  { immediate: true },
)
</script>

<style scoped>
.cell-atlas {
  margin: 24px 0 0;
  color: var(--color-ink);
}
.atlas-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.atlas-eyebrow {
  color: var(--color-learning-blue);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: 0.07em;
}
.atlas-heading h5 {
  margin: 7px 0 0;
  font-size: var(--text-lg);
  line-height: 1.4;
  font-weight: var(--weight-semi);
}
.atlas-type {
  padding: 5px 11px;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: var(--radius-pill);
  color: var(--color-learning-blue);
  font-size: var(--text-xs);
  background: var(--color-learning-blue-soft);
}
.cell-switch {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.cell-atlas :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-color: var(--color-ink-soft);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue-soft);
  --app-button-active-border: var(--color-learning-blue);
}
.cell-atlas :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-blue-soft);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue);
}
.cell-atlas :deep(.app-button.el-button:focus-visible) {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 3px;
}
.atlas-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  margin-top: 18px;
}
.cell-stage {
  overflow: hidden;
  min-width: 0;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, var(--color-surface), var(--color-learning-blue-soft));
}
.stage-caption {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 18px 0;
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}
.stage-caption span:first-child {
  color: var(--color-learning-blue);
  font-weight: var(--weight-semi);
}
.cell-illustration {
  display: block;
  width: 100%;
  max-width: 740px;
  margin: 0 auto;
  overflow: visible;
}
.stage-note {
  margin: 0;
  padding: 0 16px 15px;
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  text-align: center;
}
.gradient-surface {
  stop-color: var(--color-surface);
}
.gradient-blue-soft {
  stop-color: var(--color-learning-blue-soft);
}
.gradient-blue-line {
  stop-color: var(--color-learning-blue-line);
}
.gradient-violet-soft {
  stop-color: var(--color-learning-violet-soft);
}
.gradient-violet-line {
  stop-color: var(--color-learning-violet-line);
}
.gradient-teal-soft {
  stop-color: var(--color-learning-teal-soft);
}
.gradient-teal-line {
  stop-color: var(--color-learning-teal-line);
}
.gradient-amber-soft {
  stop-color: var(--color-learning-amber-soft);
}
.gradient-amber-line {
  stop-color: var(--color-learning-amber-line);
}
.animal-membrane,
.plant-membrane,
.bacterial-membrane {
  stroke: var(--color-learning-blue);
  stroke-width: 2.2;
}
.membrane-inner {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 0.8;
  opacity: 0.34;
}
.plant-wall,
.bacterial-wall {
  stroke: var(--color-learning-teal);
  stroke-width: 2.3;
}
.wall-grain {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1;
  opacity: 0.3;
}
.nuclear-envelope {
  stroke: var(--color-learning-violet);
  stroke-width: 2.2;
}
.nuclear-inner {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 0.9;
  opacity: 0.5;
}
.chromatin {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 2.3;
  stroke-linecap: round;
  opacity: 0.46;
}
.nucleolus {
  fill: var(--color-learning-violet);
}
.nucleolus-light {
  fill: var(--color-learning-violet-line);
  opacity: 0.45;
}
.nuclear-pores {
  stroke: var(--color-learning-violet);
  stroke-width: 2.3;
  stroke-linecap: round;
}
.mitochondrial-envelope {
  stroke: var(--color-learning-amber);
  stroke-width: 1.8;
}
.mitochondrial-inner {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 1.6;
  stroke-linejoin: round;
}
.chloroplast-envelope {
  stroke: var(--color-learning-teal);
  stroke-width: 1.8;
}
.chloroplast-inner {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 0.8;
  opacity: 0.55;
}
.chloroplast-lamella {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1;
}
.granum {
  fill: var(--color-learning-teal);
  opacity: 0.85;
}
.vacuole-body {
  stroke: var(--color-learning-blue);
  stroke-width: 1.5;
}
.vacuole-highlight {
  fill: none;
  stroke: var(--color-surface);
  stroke-width: 4;
  stroke-linecap: round;
  opacity: 0.75;
}
.bacterial-chromosome {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.chromosome-underlay {
  stroke: var(--color-learning-violet-line);
  stroke-width: 7;
}
.chromosome-detail {
  fill: none;
  stroke: var(--color-learning-violet-line);
  stroke-width: 1.5;
}
.plasmid-ring {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 2.7;
}
.plasmid-inner {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 0.8;
  opacity: 0.45;
}
.ribosome-particle {
  fill: var(--color-learning-teal);
}
.ribosome-highlight {
  fill: var(--color-learning-teal-line);
}
.ribosome-focus {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 1.8;
  stroke-dasharray: 3 2;
}
.cytoplasm-emphasis {
  fill: var(--color-learning-blue-line);
  stroke: var(--color-learning-blue);
  stroke-width: 1;
  stroke-dasharray: 4 3;
  opacity: 0;
}
.cell-structure {
  transition: filter 0.18s ease;
}
.cell-structure--active {
  filter: drop-shadow(0 0 4px var(--color-learning-blue-line));
}
.cell-structure--active .structure-outline {
  stroke-width: 3.4;
}
.cell-structure--active .cytoplasm-emphasis {
  opacity: 0.55;
}
.cell-annotation {
  cursor: pointer;
  outline: none;
}
.annotation-line {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 1.05;
  opacity: 0.36;
}
.annotation-anchor {
  fill: var(--color-learning-blue);
  opacity: 0.55;
}
.annotation-hit {
  fill: transparent;
}
.annotation-badge {
  fill: var(--color-surface);
  stroke: var(--color-learning-blue-line);
  stroke-width: 1.6;
  transition: fill 0.15s ease;
}
.cell-annotation text {
  fill: var(--color-learning-blue);
  text-anchor: middle;
  font-family: var(--font-sans);
  font-size: 18px;
  font-weight: var(--weight-semi);
  pointer-events: none;
}
.cell-annotation--active .annotation-line,
.cell-annotation:hover .annotation-line,
.cell-annotation:focus-visible .annotation-line {
  opacity: 1;
  stroke-width: 1.8;
}
.cell-annotation--active .annotation-anchor {
  opacity: 1;
}
.cell-annotation--active .annotation-badge {
  fill: var(--color-learning-blue);
  stroke: var(--color-learning-blue);
}
.cell-annotation--active text {
  fill: var(--color-ink-inverse);
}
.cell-annotation:focus-visible .annotation-badge {
  stroke: var(--color-learning-blue);
  stroke-width: 4;
}
.structure-inspector {
  min-width: 0;
}
.inspector-label {
  margin: 0 0 11px;
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}
.structure-index {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.structure-index :deep(.app-button.el-button) {
  min-height: 38px;
  padding: 0 10px;
  border-radius: var(--radius-md);
  min-width: 0;
}
.index-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: 5px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-learning-blue);
  background: var(--color-learning-blue-soft);
  border-radius: 50%;
}
.structure-detail {
  margin-top: 16px;
  padding: 18px;
  border: 1px solid var(--color-learning-blue-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}
.structure-detail header {
  display: flex;
  align-items: center;
  gap: 11px;
}
.detail-number {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--color-learning-blue-soft);
  color: var(--color-learning-blue);
  font-family: var(--font-mono);
  font-size: var(--text-lg);
}
.structure-detail h6 {
  margin: 0;
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
}
.structure-detail header div > span {
  display: block;
  margin-top: 3px;
  font-size: var(--text-xs);
  color: var(--color-ink-soft);
}
.structure-detail dl {
  margin: 16px 0 0;
  display: grid;
  gap: 14px;
}
.structure-detail dt {
  font-size: var(--text-xs);
  color: var(--color-learning-blue);
  font-weight: var(--weight-semi);
}
.structure-detail dd {
  margin: 5px 0 0;
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--color-ink-soft);
}
.detail-clue {
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--color-learning-blue-soft);
}
.detail-trap {
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--color-learning-amber-line);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
.detail-trap strong {
  margin-right: 7px;
  color: var(--color-learning-amber);
  font-size: var(--text-xs);
}
.atlas-reading {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding-top: 16px;
  margin-top: 18px;
  border-top: 1px solid var(--color-learning-blue-line);
}
.atlas-reading > span {
  flex-shrink: 0;
  font-size: var(--text-xs);
  color: var(--color-learning-blue);
  font-weight: var(--weight-semi);
}
.atlas-reading p {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}
.atlas-caution,
.atlas-microdetail {
  margin: 10px 0 0;
  font-size: var(--text-xs);
  line-height: var(--leading-relaxed);
  color: var(--color-ink-soft);
}
@media (min-width: 1100px) {
  .atlas-workspace {
    grid-template-columns: minmax(0, 1.3fr) minmax(280px, 1fr);
    align-items: start;
  }
  .cell-stage {
    position: sticky;
    top: 12px;
  }
}
@media (max-width: 600px) {
  .atlas-heading h5 {
    font-size: var(--text-base);
  }
  .atlas-eyebrow {
    font-size: var(--text-xs);
  }
  .atlas-workspace {
    gap: 16px;
  }
  .stage-caption {
    padding: 12px 12px 0;
  }
  .cell-annotation text {
    font-size: 24px;
  }
  .annotation-badge {
    r: 21px;
  }
  .annotation-hit {
    r: 30px;
  }
  .structure-index {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .structure-index :deep(.app-button.el-button) {
    width: 100%;
    justify-content: flex-start;
    min-height: 44px;
  }
  .structure-detail {
    padding: 14px;
  }
  .atlas-reading {
    display: block;
  }
  .atlas-reading p {
    margin-top: 6px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cell-structure,
  .annotation-badge {
    transition: none;
  }
}
</style>
