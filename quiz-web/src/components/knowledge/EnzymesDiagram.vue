<!-- ESAT 酶章节图谱：能量途径、活性位点循环、环境条件与消化器官的原创矢量图解。 -->
<template>
  <BiologyAtlasFrame :title="heading" :subtitle="subtitle" :note="note">
    <template #controls>
      <AppButton
        v-for="choice in choices"
        :key="choice.id"
        type="secondary"
        size="small"
        :aria-pressed="selected === choice.id"
        @click="selected = choice.id"
        >{{ choice.label }}</AppButton
      >
    </template>

    <svg
      class="enzyme-atlas"
      viewBox="0 0 840 510"
      role="img"
      :aria-labelledby="`${uid}-title ${uid}-desc`"
    >
      <title :id="`${uid}-title`">{{ heading }}：{{ activeLabel }}</title>
      <desc :id="`${uid}-desc`">{{ accessibleDescription }}</desc>
      <defs>
        <radialGradient :id="`${uid}-enzyme`" cx="32%" cy="25%" r="85%">
          <stop offset="0" stop-color="var(--color-learning-blue-soft)" />
          <stop offset="0.55" stop-color="var(--color-learning-blue-line)" />
          <stop offset="1" stop-color="var(--color-learning-blue)" />
        </radialGradient>
        <linearGradient :id="`${uid}-organ`" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="var(--color-learning-violet-soft)" />
          <stop offset="0.52" stop-color="var(--color-learning-violet-line)" />
          <stop offset="1" stop-color="var(--color-learning-violet)" />
        </linearGradient>
        <linearGradient :id="`${uid}-gut`" x1="0" x2="0.8" y1="0" y2="1">
          <stop offset="0" stop-color="var(--color-learning-amber-soft)" />
          <stop offset="1" stop-color="var(--color-learning-amber-line)" />
        </linearGradient>
        <radialGradient :id="`${uid}-substrate`" cx="30%" cy="20%" r="90%">
          <stop offset="0" stop-color="var(--color-learning-amber-soft)" />
          <stop offset="1" stop-color="var(--color-learning-amber)" />
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
          <path d="M0 0L10 5L0 10Z" fill="var(--color-learning-teal)" />
        </marker>
        <marker
          :id="`${uid}-ink-arrow`"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10Z" fill="var(--color-ink-soft)" />
        </marker>
        <g :id="`${uid}-protein`">
          <path
            d="M190 270C143 247 141 197 175 175C180 130 220 120 250 140L265 175Q285 195 305 175L330 135C361 105 410 130 420 170C462 167 492 209 470 250C500 290 476 345 435 345C430 395 365 410 325 380C270 415 205 380 205 345C155 355 130 300 190 270Z"
            :fill="`url(#${uid}-enzyme)`"
            class="protein-edge"
          />
          <path
            d="M180 215C195 175 225 183 228 208S208 259 243 265S295 239 308 270S307 326 340 330S374 308 393 327S420 363 402 376M196 294C227 289 247 305 237 329S253 374 281 367M345 157C385 151 403 177 389 196S365 224 394 239S445 220 449 251M330 217C311 228 326 250 350 247S387 267 366 285S332 283 321 306"
            class="protein-fold"
          />
          <path
            d="M169 238C181 256 207 249 217 229M263 300C275 277 299 282 296 308S282 347 307 356M426 191C407 211 426 227 449 223M398 280C409 262 439 282 425 305"
            class="protein-fold soft-fold"
          />
          <path d="M250 140L265 175Q285 195 305 175L330 135" class="active-site" />
          <circle cx="265" cy="174" r="5" class="site-dot" />
          <circle cx="305" cy="174" r="5" class="site-dot" />
          <circle cx="285" cy="184" r="5" class="site-dot" />
        </g>
      </defs>

      <g v-if="chapterMode === 'catalyst'">
        <text x="36" y="34" class="figure-title">相同起点与终点，两条不同的反应途径</text>
        <path d="M90 60V400H774" class="axis" :marker-end="`url(#${uid}-ink-arrow)`" />
        <text x="39" y="241" transform="rotate(-90 39 241)" class="axis-label">能量（示意）</text>
        <text x="660" y="432" class="axis-label">反应进程 →</text>
        <path
          d="M100 290H210C270 290 281 103 375 103S466 350 535 350H748"
          class="energy-curve no-enzyme"
          :class="{ dimmed: selected === 'with' }"
        />
        <path
          d="M100 290H210C272 290 290 220 375 220S469 350 535 350H748"
          class="energy-curve with-enzyme"
          :class="{ dimmed: selected === 'without' }"
        />
        <path d="M210 290H485M375 103H438M375 220H493" class="guide" />
        <path
          v-if="selected !== 'with'"
          d="M429 284V110"
          class="barrier barrier-original"
          :marker-start="`url(#${uid}-ink-arrow)`"
          :marker-end="`url(#${uid}-ink-arrow)`"
        />
        <path
          v-if="selected !== 'without'"
          d="M488 284V226"
          class="barrier"
          :marker-start="`url(#${uid}-arrow)`"
          :marker-end="`url(#${uid}-arrow)`"
        />
        <text x="150" y="321" text-anchor="middle" class="label">反应物</text>
        <text x="680" y="378" text-anchor="middle" class="label">产物</text>
        <text x="375" y="76" text-anchor="middle" class="amber-text">未催化路径：能量障碍较高</text>
        <text x="250" y="204" class="teal-text">酶提供较低的障碍</text>
        <path d="M564 290V350" class="delta" :marker-end="`url(#${uid}-ink-arrow)`" />
        <text x="585" y="310" class="label">起点到终点</text>
        <text x="585" y="331" class="small-label">总能量变化保持相同</text>
        <rect x="95" y="452" width="652" height="36" rx="10" class="teal-panel" />
        <text x="421" y="475" text-anchor="middle" class="teal-text">
          降低的是活化能，不是把反应物或产物换成另一种能量状态
        </text>
      </g>

      <g v-else-if="chapterMode === 'specificity'">
        <text x="32" y="34" class="figure-title">{{ bindingTitle }}</text>
        <ellipse cx="305" cy="420" rx="170" ry="16" class="shadow" />
        <use :href="`#${uid}-protein`" />
        <g
          v-if="selected !== 'released'"
          :transform="selected === 'free' ? 'translate(0 -65)' : undefined"
        >
          <path
            d="M250 120H287V178Q275 180 265 166Z"
            :fill="`url(#${uid}-substrate)`"
            class="substrate-edge"
            :transform="
              selected === 'products' ? 'translate(-34 -45) rotate(-12 267 151)' : undefined
            "
          />
          <path
            d="M287 120H327L305 166Q295 180 287 178Z"
            :fill="`url(#${uid}-substrate)`"
            class="substrate-edge"
            :transform="
              selected === 'products' ? 'translate(55 -53) rotate(16 308 151)' : undefined
            "
          />
          <path
            v-if="selected === 'free' || selected === 'bound'"
            d="M287 132V167"
            class="substrate-bond"
          />
        </g>
        <path
          v-if="selected === 'free'"
          d="M287 113V143"
          class="flow"
          :marker-end="`url(#${uid}-arrow)`"
        />
        <g v-if="selected === 'products' || selected === 'released'">
          <path
            d="M247 132L222 97M331 131L364 92"
            class="flow"
            :marker-end="`url(#${uid}-arrow)`"
          />
          <text x="90" y="75" class="amber-text">产物离开</text>
          <path d="M176 80L224 111" class="callout" />
        </g>
        <path d="M264 176L112 142H48" class="callout" />
        <text x="48" y="121" class="teal-text">活性位点</text>
        <text x="48" y="139" class="small-label">形状与化学性质共同起作用</text>
        <text x="300" y="459" text-anchor="middle" class="blue-text">折叠的蛋白质酶</text>
        <g transform="translate(533 76)">
          <text x="0" y="0" class="figure-title">一次催化循环</text>
          <g
            v-for="(stage, index) in bindingStages"
            :key="stage.id"
            :transform="`translate(0 ${40 + index * 85})`"
            :class="{ 'cycle-current': selected === stage.id }"
          >
            <circle cx="19" cy="16" r="17" class="cycle-number" />
            <text x="19" y="21" text-anchor="middle" class="number-text">{{ index + 1 }}</text>
            <text x="50" y="15" class="label">{{ stage.label }}</text>
            <text x="50" y="38" class="small-label">{{ stage.detail }}</text>
            <path v-if="index < 3" d="M19 39V64" class="flow" :marker-end="`url(#${uid}-arrow)`" />
          </g>
        </g>
      </g>

      <g v-else-if="chapterMode === 'conditions'">
        <text x="34" y="34" class="figure-title">
          {{ selected === 'ph' ? '不同酶可以有不同的最适 pH' : '低温变慢与高温变性是两回事' }}
        </text>
        <path d="M86 78V300H767" class="axis" :marker-end="`url(#${uid}-ink-arrow)`" />
        <text x="38" y="220" transform="rotate(-90 38 220)" class="axis-label">相对反应速率</text>
        <template v-if="selected === 'ph'">
          <g v-for="tick in 8" :key="tick">
            <path :d="`M${90 + (tick - 1) * 91} 300v7`" class="tick" />
            <text :x="90 + (tick - 1) * 91" y="328" text-anchor="middle" class="small-label">
              {{ (tick - 1) * 2 }}
            </text>
          </g>
          <path d="M90 299C109 298 133 115 181 107S241 297 289 299" class="ph-curve acid-curve" />
          <path
            d="M315 299C359 299 404 108 454 107S532 297 594 299"
            class="ph-curve neutral-curve"
          />
          <path
            d="M402 299C455 299 476 111 503 107S559 295 652 299"
            class="ph-curve alkaline-curve"
          />
          <text x="143" y="81" class="violet-text">酶 A</text>
          <text x="385" y="81" class="blue-text">酶 B</text>
          <text x="535" y="81" class="teal-text">酶 C</text>
          <text x="737" y="328" class="axis-label">pH</text>
          <rect x="90" y="364" width="642" height="104" rx="15" class="soft-panel" />
          <text x="113" y="393" class="label">图示为三种假想酶，各自的最高点不同</text>
          <text x="113" y="421" class="small-label">
            偏离适宜 pH → 电荷、结合或结构受影响 → 速率可能下降
          </text>
          <text x="113" y="449" class="small-label">
            最高的已测点 ≠ 已确定精确最适 pH；曲线不代表所有酶
          </text>
        </template>
        <template v-else>
          <path
            d="M96 288C190 284 290 253 377 177S462 94 486 120S522 270 581 290S682 299 739 299"
            class="temperature-curve"
          />
          <path d="M466.4 106.3V300" class="guide" />
          <text x="130" y="328" class="small-label">较低温度</text>
          <text x="466.4" y="328" text-anchor="middle" class="small-label">本实验的最适温度</text>
          <text x="658" y="328" class="small-label">较高温度 →</text>
          <path d="M278 205L213 147H121" class="callout" />
          <text x="121" y="122" class="blue-text">温度升高</text>
          <text x="121" y="143" class="small-label">有效碰撞通常增多</text>
          <path d="M524 234L582 154H736" class="callout" />
          <text x="584" y="125" class="amber-text">过高温度</text>
          <text x="584" y="147" class="small-label">正常结构受损，活性下降</text>
          <g transform="translate(50 327) scale(.32)"><use :href="`#${uid}-protein`" /></g>
          <text x="230" y="400" class="blue-text">低温时结构常仍完整</text>
          <text x="230" y="425" class="small-label">回到适温后常可恢复</text>
          <path
            d="M521 390C486 361 510 340 541 363S567 418 592 393S626 350 648 376S619 430 658 446S690 408 711 426S735 458 751 444"
            class="unfolded-protein"
          />
          <path
            d="M516 391C541 397 551 408 563 421M594 392C603 403 615 414 628 417M669 438L696 462"
            class="protein-fold"
          />
          <text x="542" y="481" class="amber-text">变性：正常活性位点被破坏</text>
        </template>
      </g>

      <g v-else>
        <text x="30" y="33" class="figure-title">{{ digestiveTitle }}</text>
        <path
          d="M222 58C183 62 162 92 166 128C169 153 183 167 195 183L186 211C147 224 124 261 118 303L109 476H425L415 303C409 263 383 224 342 212L333 181C348 164 360 142 358 115C354 79 332 61 295 57Z"
          class="body-outline"
        />
        <path d="M193 126Q227 115 253 129Q230 141 193 126Z" class="mouth" />
        <path d="M239 132C256 151 270 159 268 183L271 278" class="oesophagus-back" />
        <path d="M239 132C256 151 270 159 268 183L271 278" class="oesophagus" />
        <path
          d="M271 257C279 278 302 251 324 260C366 270 356 330 327 346C298 363 263 330 277 313C287 302 273 293 271 278Z"
          :fill="`url(#${uid}-organ)`"
          class="stomach"
          :class="{ highlighted: selected === 'protein' }"
        />
        <path
          d="M297 275C320 267 343 279 337 302M288 296C312 287 337 300 324 321M293 321C307 316 317 327 325 333"
          class="organ-fold"
        />
        <path
          d="M150 260C170 237 235 237 269 258L259 297C226 305 184 289 159 300C147 287 144 272 150 260Z"
          class="liver"
          :class="{ highlighted: selected === 'fat' }"
        />
        <path d="M221 289C208 303 214 319 226 316C237 309 237 294 221 289Z" class="gallbladder" />
        <path d="M226 315L249 333L285 344" class="bile-duct" />
        <path
          d="M248 331C271 325 304 335 331 329Q348 331 346 345C319 356 276 347 250 349Z"
          class="pancreas"
        />
        <path d="M337 339L281 342" class="pancreas-duct" />
        <path d="M280 342C260 355 263 373 287 376" class="duodenum-back" />
        <path d="M280 342C260 355 263 373 287 376" class="duodenum" />
        <path
          d="M179 448V361Q177 344 193 345H354Q370 346 365 366L359 447Q354 460 324 453L305 464V484"
          class="colon-back"
        />
        <path
          d="M179 448V361Q177 344 193 345H354Q370 346 365 366L359 447Q354 460 324 453L305 464V484"
          class="colon"
        />
        <path
          d="M211 372H314C342 372 341 391 318 393H225C199 393 199 413 224 413H317C342 413 337 434 315 434H226C208 434 207 449 229 450H282"
          class="small-intestine-back"
        />
        <path
          d="M211 372H314C342 372 341 391 318 393H225C199 393 199 413 224 413H317C342 413 337 434 315 434H226C208 434 207 449 229 450H282"
          class="small-intestine"
        />
        <g class="organ-labels">
          <path d="M204 126L122 102H42" class="callout" />
          <text x="42" y="88" class="label">口腔</text>
          <path d="M268 193L358 182H399" class="callout" />
          <text x="356" y="169" class="label">食管</text>
          <path d="M178 270L111 243H42" class="callout" />
          <text x="42" y="229" class="label">肝脏</text>
          <path d="M219 307L113 315H42" class="callout" />
          <text x="42" y="335" class="label">胆囊</text>
          <path d="M336 287L386 267H434" class="callout" />
          <text x="389" y="254" class="label">胃</text>
          <path d="M329 339L394 325H434" class="callout" />
          <text x="389" y="312" class="label">胰腺</text>
          <path d="M236 405L123 398H42" class="callout" />
          <text x="42" y="384" class="label">小肠</text>
          <path d="M361 416L395 436H438" class="callout" />
          <text x="390" y="458" class="small-label">大肠</text>
        </g>
        <g transform="translate(482 74)">
          <rect width="324" height="386" rx="18" class="soft-panel" />
          <template v-if="selected === 'carbohydrate'">
            <text x="22" y="37" class="blue-text">淀粉酶：口腔与小肠</text>
            <g v-for="i in 7" :key="i">
              <circle :cx="38 + (i - 1) * 35" cy="91" r="17" class="sugar-unit" />
              <path v-if="i < 7" :d="`M${55 + (i - 1) * 35} 91h3`" class="molecule-bond" />
            </g>
            <text x="162" y="132" text-anchor="middle" class="small-label">
              淀粉长链（仅示一段）
            </text>
            <path d="M162 148V180" class="flow" :marker-end="`url(#${uid}-arrow)`" />
            <g
              v-for="group in [
                { x: 30, count: 2 },
                { x: 115, count: 2 },
                { x: 202, count: 3 },
              ]"
              :key="group.x"
              :transform="`translate(${group.x} 213)`"
            >
              <g v-for="i in group.count" :key="i">
                <circle :cx="(i - 1) * 28" cy="0" r="13" class="sugar-unit" />
                <path
                  v-if="i < group.count"
                  :d="`M${(i - 1) * 28 + 13} 0h2`"
                  class="molecule-bond"
                />
              </g>
            </g>
            <text x="162" y="253" text-anchor="middle" class="small-label">麦芽糖及较短糖链</text>
            <path d="M162 269V298" class="flow" :marker-end="`url(#${uid}-arrow)`" />
            <text x="162" y="331" text-anchor="middle" class="label">后续酶继续分解 → 葡萄糖</text>
            <text x="162" y="359" text-anchor="middle" class="small-label">
              不是由淀粉酶独自完成全部步骤
            </text>
          </template>
          <template v-else-if="selected === 'protein'">
            <text x="22" y="37" class="violet-text">蛋白酶：胃与小肠</text>
            <path
              d="M38 85C64 54 75 117 104 87S150 59 167 90S211 122 236 88S272 66 284 90"
              class="peptide-back"
            />
            <circle
              v-for="(point, i) in peptidePoints"
              :key="i"
              :cx="point[0]"
              :cy="point[1]"
              r="10"
              :class="i % 2 ? 'amino-blue' : 'amino-violet'"
            />
            <text x="162" y="133" text-anchor="middle" class="small-label">
              蛋白质：氨基酸组成的长链
            </text>
            <path d="M162 149V178" class="flow" :marker-end="`url(#${uid}-arrow)`" />
            <path
              d="M31 205L54 193L77 210L100 197M130 205L153 193L176 210L199 197M229 205L252 193L275 210L298 197"
              class="peptide-back"
            />
            <circle
              v-for="(point, i) in shortPeptidePoints"
              :key="i"
              :cx="point[0]"
              :cy="point[1]"
              r="10"
              :class="i % 2 ? 'amino-blue' : 'amino-violet'"
            />
            <text x="162" y="254" text-anchor="middle" class="small-label">
              较短肽链：还需继续消化
            </text>
            <path d="M162 268V298" class="flow" :marker-end="`url(#${uid}-arrow)`" />
            <circle
              v-for="i in 12"
              :key="i"
              :cx="30 + (i - 1) * 24"
              cy="325"
              r="10"
              :class="(i - 1) % 2 ? 'amino-blue' : 'amino-violet'"
            />
            <text x="162" y="359" text-anchor="middle" class="label">最终主要吸收氨基酸</text>
          </template>
          <template v-else>
            <text x="22" y="37" class="amber-text">胆盐乳化，再由脂肪酶水解</text>
            <circle cx="75" cy="112" r="41" :fill="`url(#${uid}-substrate)`" class="fat-droplet" />
            <path d="M133 112H175" class="flow" :marker-end="`url(#${uid}-arrow)`" />
            <circle
              v-for="(point, i) in fatDroplets"
              :key="i"
              :cx="point[0]"
              :cy="point[1]"
              r="14"
              :fill="`url(#${uid}-substrate)`"
              class="fat-droplet"
            />
            <text x="75" y="177" text-anchor="middle" class="small-label">大脂肪滴</text>
            <text x="235" y="177" text-anchor="middle" class="small-label">许多小脂肪滴</text>
            <text x="162" y="210" text-anchor="middle" class="teal-text">总接触面积增加</text>
            <path d="M162 230V259" class="flow" :marker-end="`url(#${uid}-arrow)`" />
            <text x="162" y="287" text-anchor="middle" class="label">脂肪酶催化分子水解</text>
            <text x="162" y="318" text-anchor="middle" class="small-label">胰脂肪酶主要形成</text>
            <text x="162" y="344" text-anchor="middle" class="amber-text">脂肪酸 + 单甘油酯</text>
            <text x="162" y="369" text-anchor="middle" class="small-label">
              胆盐不是酶，乳化本身不水解脂肪
            </text>
          </template>
        </g>
      </g>
    </svg>
    <template #legend>
      <span><i class="legend-dot blue-dot" />蛋白质酶／结构</span>
      <span><i class="legend-dot teal-dot" />催化途径／过程</span>
      <span><i class="legend-dot amber-dot" />底物／能量障碍</span>
      <span><i class="legend-dot violet-dot" />蛋白质或器官对照</span>
    </template>
    <template #explanation><KnowledgeText :text="explanation" /></template>
  </BiologyAtlasFrame>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppButton from '../AppButton.vue'
import BiologyAtlasFrame from './BiologyAtlasFrame.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic?: string }>()
const uid = useId().replace(/:/g, '')
const selected = ref('both')
const bindingStages = [
  { id: 'free', label: '底物靠近', detail: '合适底物接近活性位点' },
  { id: 'bound', label: '结合与催化', detail: '形成暂时复合物，促进转化' },
  { id: 'products', label: '产物释放', detail: '本例的一种底物分成两部分' },
  { id: 'released', label: '酶可再用', detail: '下一份合适底物可继续结合' },
]
const peptidePoints = [
  [38, 85],
  [62, 76],
  [82, 96],
  [104, 87],
  [128, 74],
  [149, 76],
  [167, 90],
  [191, 106],
  [214, 104],
  [236, 88],
  [260, 76],
  [284, 90],
]
const shortPeptidePoints = [
  [31, 205],
  [54, 193],
  [77, 210],
  [100, 197],
  [130, 205],
  [153, 193],
  [176, 210],
  [199, 197],
  [229, 205],
  [252, 193],
  [275, 210],
  [298, 197],
]
const fatDroplets = [
  [211, 83],
  [244, 78],
  [277, 92],
  [211, 119],
  [245, 112],
  [279, 129],
  [244, 145],
]

// 根据考纲叶节点选择与本节知识对应的图谱，避免各节重复展示同一张图。
const chapterMode = computed(
  () =>
    ({
      '150801': 'catalyst',
      '150802': 'specificity',
      '150803': 'conditions',
      '150804': 'digestion',
    })[props.topic ?? '150801'] ?? 'catalyst',
)

// 切换叶节点时返回该图谱的起始状态，防止沿用另一类图的按钮值。
watch(
  chapterMode,
  (mode) => {
    selected.value =
      {
        catalyst: 'both',
        specificity: 'free',
        conditions: 'temperature',
        digestion: 'carbohydrate',
      }[mode] ?? 'both'
  },
  { immediate: true },
)

// 每类图只显示当前主题相关的可键盘操作按钮。
const choices = computed(() => {
  if (chapterMode.value === 'catalyst')
    return [
      { id: 'both', label: '两条途径对照' },
      { id: 'without', label: '观察未催化路径' },
      { id: 'with', label: '观察酶催化路径' },
    ]
  if (chapterMode.value === 'specificity') return bindingStages
  if (chapterMode.value === 'conditions')
    return [
      { id: 'temperature', label: '温度与结构变化' },
      { id: 'ph', label: '不同酶的 pH 曲线' },
    ]
  return [
    { id: 'carbohydrate', label: '淀粉与淀粉酶' },
    { id: 'protein', label: '蛋白质与蛋白酶' },
    { id: 'fat', label: '脂肪、胆盐与脂肪酶' },
  ]
})

// 图题和无障碍文本随当前按钮更新，帮助识别切换后的内容。
const activeLabel = computed(
  () => choices.value.find((choice) => choice.id === selected.value)?.label ?? '',
)
// 顶层标题明确本知识点使用哪种证据和结构图。
const heading = computed(
  () =>
    ({
      catalyst: '酶降低反应的能量障碍',
      specificity: '走近酶的活性位点',
      conditions: '把速率曲线与酶的状态一起看',
      digestion: '沿消化道追踪酶的工作',
    })[chapterMode.value] ?? '',
)
// 副标题只提示阅读对象，不泄露后面例题的具体答案。
const subtitle = computed(
  () =>
    ({
      catalyst: '比较有酶与无酶时的途径，留意起点、终点和峰顶。',
      specificity: '切换四个阶段，观察底物、活性位点与产物的位置变化。',
      conditions: '切换温度与 pH，理解曲线为何上升、下降，以及不同酶的差别。',
      digestion: '切换食物种类，同时对照作用器官与分子变化。',
    })[chapterMode.value] ?? '',
)
// 每幅示意图说明模型边界，避免比例与形状被误认为真实测量结果。
const note = computed(() =>
  chapterMode.value === 'digestion'
    ? '人体器官位置、比例与分子数量为教学示意；图中肝脏位于人体自身右侧（观看者左侧）。脂肪滴数量不表示定量体积变化。胆汁经胆管、胰液经胰管进入小肠。'
    : chapterMode.value === 'conditions'
      ? '曲线为定性教学图，不是某种酶的实测数据；pH 图中的 A、B、C 为假想酶。正常酶与变性酶的形状只用于表达结构变化，不表示真实分子比例。'
      : '原创教学模型，不按真实分子比例绘制。催化循环以分解反应为例；真实活性位点还涉及化学性质与正常的结构调整，不是僵硬凹槽。能量途径示意不代表反应历时。',
)
// 循环中的短标题随阶段切换，突出当前所见而非重复整章文字。
const bindingTitle = computed(
  () =>
    ({
      free: '底物靠近：只有合适的结合才有助于催化',
      bound: '底物结合：活性位点帮助反应完成',
      products: '形成产物：释放后，酶仍然存在',
      released: '一次催化结束：酶可以再次使用',
    })[selected.value] ?? '',
)
// 消化图的图题对应当前营养物质，方便与器官图一起阅读。
const digestiveTitle = computed(
  () =>
    ({
      carbohydrate: '糖类消化：淀粉逐步分解',
      protein: '蛋白质消化：长链逐步切短',
      fat: '脂肪消化：乳化与水解分工不同',
    })[selected.value] ?? '',
)
// 文字描述为屏幕阅读器补充图中箭头、曲线及器官关系。
const accessibleDescription = computed(() => {
  if (chapterMode.value === 'catalyst')
    return '两条能量曲线具有相同反应物和产物能量，酶催化曲线的峰较低。活化能从反应物位置量到峰顶，总能量变化从反应物量到产物。'
  if (chapterMode.value === 'specificity')
    return `${activeLabel.value}。蓝色折叠酶顶端具有以青色标出的活性位点，金色底物接近、结合、转化为两个产物并离开；酶保留供下次使用。`
  if (chapterMode.value === 'conditions')
    return selected.value === 'ph'
      ? '三种假想酶的反应速率随 pH 呈不同位置的峰形，示意其最适 pH 可以不同。'
      : '温度曲线先升后降；低温通常减少有效碰撞，高温可能破坏蛋白质结构，图下比较完整酶与展开的蛋白质。'
  return `左侧显示口腔、食管、胃、肝脏、胆囊、胰腺、小肠和大肠；右侧为${activeLabel.value}的分子过程，强调消化作用与辅助条件的区别。`
})
// 每个按钮对应一段完整解释，将图中变化与应记住的知识连接起来。
const explanation = computed(() => {
  if (chapterMode.value === 'catalyst')
    return '**活化能看“反应物到峰顶”的高度差，总能量变化看“终点减起点”。**酶提供更容易经过的反应途径，所以加快反应；两条途径仍通向相同产物。图里的横轴是反应进程，不是时间，不能用曲线斜率计算反应速率。'
  if (chapterMode.value === 'specificity')
    return (
      {
        free: '金色底物与青色活性位点具有相适合的结构。**适合还包括化学性质，不只是大小与外形**。本图用凹槽帮助识别位置；真实酶与底物结合时还可以发生正常的形状调整。',
        bound:
          '底物暂时结合形成酶—底物复合物。酶通过活性位点的作用促进转化、降低反应所需的活化能；**不是把酶本身当作反应燃料消耗掉**。',
        products:
          '本例展示分解反应：一种底物转成两个产物并离开。**产物释放后，酶可以继续工作**。其他酶也可催化合成等反应，不能把所有酶都想成“剪刀”。',
        released:
          '现在活性位点可再次接待底物。**酶不会按催化次数被等量消耗**；若没有更多底物，产物便不再增加，但酶不一定已损坏。',
      }[selected.value] ?? ''
    )
  if (chapterMode.value === 'conditions')
    return selected.value === 'ph'
      ? '每种酶的活性位点有自己的适宜环境。pH 改变可影响电荷、结合与结构，极端条件还可能使酶变性。**不能把某种酶的峰值套给全部酶，也不能把低速自动判成永久变性。**'
      : '**低温时通常是反应暂时变慢；温度过高则可能使正常结构受损。**先升后降来自两种影响的共同作用。要区分可恢复的变慢与持续失活，可以先处理，再把各组放回相同的适宜条件测量。'
  return (
    {
      carbohydrate:
        '唾液腺与胰腺制造的淀粉酶分别在口腔、小肠参与作用。**淀粉酶先形成麦芽糖和较短糖链，后续酶再生成葡萄糖**。葡萄糖形成后跨过肠上皮，才是吸收。',
      protein:
        '胃蛋白酶在胃中先把蛋白质切成较短肽链；胰腺与小肠相关酶继续作用，最终主要吸收氨基酸。**制造酶的器官与酶作用的部位可以不同**，食物不用进入胰腺。',
      fat: '**胆盐使脂肪分散，脂肪酶催化分子水解。**两步作用不同。胰脂肪酶的主要直接产物是脂肪酸与单甘油酯；考纲将完整脂肪分解常概括为脂肪酸与甘油，不要把概括式当成每一步的唯一产物。',
    }[selected.value] ?? ''
  )
})
</script>

<style scoped>
.enzyme-atlas {
  min-width: 680px;
  color: var(--color-ink);
}
svg text {
  fill: var(--color-ink);
  font-size: 15px;
}
.figure-title {
  font-size: 18px;
  font-weight: var(--weight-bold);
}
.label {
  font-size: 16px;
  font-weight: var(--weight-bold);
}
.small-label {
  font-size: 13px;
  fill: var(--color-ink-soft);
}
.axis-label {
  font-size: 14px;
  fill: var(--color-ink-soft);
}
.blue-text {
  fill: var(--color-learning-blue);
  font-weight: var(--weight-bold);
}
.teal-text {
  fill: var(--color-learning-teal);
  font-weight: var(--weight-bold);
}
.amber-text {
  fill: var(--color-learning-amber);
  font-weight: var(--weight-bold);
}
.violet-text {
  fill: var(--color-learning-violet);
  font-weight: var(--weight-bold);
}
.axis,
.tick {
  fill: none;
  stroke: var(--color-ink-soft);
  stroke-width: 1.8;
}
.energy-curve,
.ph-curve,
.temperature-curve {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}
.no-enzyme {
  stroke: var(--color-learning-amber);
}
.with-enzyme,
.temperature-curve {
  stroke: var(--color-learning-teal);
}
.dimmed {
  opacity: 0.2;
}
.guide {
  fill: none;
  stroke: var(--color-ink-muted);
  stroke-width: 1;
  stroke-dasharray: 5 5;
}
.barrier,
.flow {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 2;
}
.barrier-original,
.delta {
  fill: none;
  stroke: var(--color-ink-soft);
  stroke-width: 1.8;
}
.teal-panel {
  fill: var(--color-learning-teal-soft);
}
.soft-panel {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue-line);
}
.callout {
  fill: none;
  stroke: var(--color-ink-muted);
  stroke-width: 1.2;
}
.protein-edge {
  stroke: var(--color-learning-blue);
  stroke-width: 2.5;
}
.protein-fold {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 4;
  stroke-linecap: round;
  opacity: 0.52;
}
.soft-fold {
  stroke: var(--color-surface);
  opacity: 0.7;
  stroke-width: 5;
}
.active-site {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 7;
  stroke-linecap: round;
}
.site-dot {
  fill: var(--color-learning-teal-soft);
  stroke: var(--color-learning-teal);
  stroke-width: 1.5;
}
.substrate-edge {
  stroke: var(--color-learning-amber);
  stroke-width: 2;
}
.substrate-bond {
  stroke: var(--color-learning-amber);
  stroke-width: 5;
}
.shadow {
  fill: var(--color-learning-blue-soft);
}
.cycle-number {
  fill: var(--color-surface);
  stroke: var(--color-learning-teal-line);
  stroke-width: 2;
}
.number-text {
  fill: var(--color-learning-teal);
  font-weight: var(--weight-bold);
}
.cycle-current .cycle-number {
  fill: var(--color-learning-teal);
  stroke: var(--color-learning-teal);
}
.cycle-current .number-text {
  fill: var(--color-ink-inverse);
}
.cycle-current .label {
  fill: var(--color-learning-teal);
}
.acid-curve {
  stroke: var(--color-learning-violet);
}
.neutral-curve {
  stroke: var(--color-learning-blue);
  stroke-dasharray: 9 4;
}
.alkaline-curve {
  stroke: var(--color-learning-teal);
}
.unfolded-protein {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 10;
  stroke-linecap: round;
}
.body-outline {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue-line);
  stroke-width: 1.5;
}
.mouth {
  fill: var(--color-learning-violet-line);
  stroke: var(--color-learning-violet);
  stroke-width: 2;
}
.oesophagus-back {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 14;
  stroke-linecap: round;
}
.oesophagus {
  fill: none;
  stroke: var(--color-learning-violet-line);
  stroke-width: 9;
  stroke-linecap: round;
}
.stomach {
  stroke: var(--color-learning-violet);
  stroke-width: 2;
}
.organ-fold {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 2;
  opacity: 0.65;
}
.liver {
  fill: var(--color-learning-amber-line);
  stroke: var(--color-learning-amber);
  stroke-width: 2;
}
.gallbladder {
  fill: var(--color-learning-teal-line);
  stroke: var(--color-learning-teal);
  stroke-width: 2;
}
.bile-duct {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 3;
}
.pancreas {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 2;
}
.pancreas-duct {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 2;
}
.duodenum-back {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 13;
}
.duodenum {
  fill: none;
  stroke: var(--color-learning-amber-line);
  stroke-width: 9;
}
.colon-back {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 20;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.colon {
  fill: none;
  stroke: var(--color-learning-violet-line);
  stroke-width: 14;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.small-intestine-back {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 14;
  stroke-linecap: round;
}
.small-intestine {
  fill: none;
  stroke: var(--color-learning-amber-line);
  stroke-width: 9;
  stroke-linecap: round;
}
.highlighted {
  stroke-width: 3.5;
}
.sugar-unit,
.fat-droplet {
  stroke: var(--color-learning-amber);
  stroke-width: 1.6;
}
.sugar-unit {
  fill: var(--color-learning-amber-line);
}
.molecule-bond {
  stroke: var(--color-learning-amber);
  stroke-width: 3;
}
.peptide-back {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 3;
}
.amino-blue {
  fill: var(--color-learning-blue-line);
  stroke: var(--color-learning-blue);
  stroke-width: 1.5;
}
.amino-violet {
  fill: var(--color-learning-violet-line);
  stroke: var(--color-learning-violet);
  stroke-width: 1.5;
}
.legend-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 5px;
  border-radius: 50%;
}
.blue-dot {
  background: var(--color-learning-blue);
}
.teal-dot {
  background: var(--color-learning-teal);
}
.amber-dot {
  background: var(--color-learning-amber);
}
.violet-dot {
  background: var(--color-learning-violet);
}
</style>
