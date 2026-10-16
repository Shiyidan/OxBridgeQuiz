<!-- 基因技术精细图谱：分步呈现质粒重组、干细胞分化范围和跨代选择，配合各考纲知识点。 -->
<template>
  <BiologyAtlasFrame :title="heading" :subtitle="subtitle" :note="note">
    <template #controls>
      <AppButton
        v-for="(label, index) in controls"
        :key="label"
        type="secondary"
        size="small"
        :aria-pressed="stage === index"
        @click="stage = index"
        >{{ label }}</AppButton
      >
    </template>
    <svg
      class="gene-technologies-illustration"
      viewBox="0 0 820 500"
      role="img"
      :aria-label="accessibleLabel"
    >
      <defs>
        <radialGradient :id="id('cell')" cx="32%" cy="24%" r="85%">
          <stop offset="0" stop-color="var(--color-surface)" />
          <stop offset=".55" stop-color="var(--color-learning-blue-soft)" />
          <stop
            offset="1"
            stop-color="color-mix(in srgb, var(--color-learning-blue) 22%, var(--color-surface))"
          />
        </radialGradient>
        <radialGradient :id="id('nucleus')" cx="30%" cy="24%" r="80%">
          <stop offset="0" stop-color="var(--color-learning-violet-soft)" />
          <stop
            offset="1"
            stop-color="color-mix(in srgb, var(--color-learning-violet) 31%, var(--color-surface))"
          />
        </radialGradient>
        <radialGradient :id="id('red')" cx="30%" cy="25%" r="80%">
          <stop offset="0" stop-color="var(--color-learning-amber-line)" />
          <stop
            offset=".45"
            stop-color="color-mix(in srgb, var(--color-learning-amber) 38%, var(--color-surface))"
          />
          <stop
            offset="1"
            stop-color="color-mix(in srgb, var(--color-learning-amber) 64%, var(--color-surface))"
          />
        </radialGradient>
        <linearGradient :id="id('leaf')" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--color-learning-teal-line)" />
          <stop
            offset="1"
            stop-color="color-mix(in srgb, var(--color-learning-teal) 67%, var(--color-surface))"
          />
        </linearGradient>
        <linearGradient :id="id('bone')" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--color-learning-amber-line)" />
          <stop
            offset="1"
            stop-color="color-mix(in srgb, var(--color-learning-amber) 40%, var(--color-surface))"
          />
        </linearGradient>
        <marker
          :id="id('arrow')"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M1 1L9 5L1 9Z" fill="var(--color-learning-teal)" />
        </marker>
        <g :id="id('nuclear-detail')">
          <circle
            r="19"
            :fill="paint('nucleus')"
            stroke="color-mix(in srgb, var(--color-learning-violet) 50%, var(--color-surface))"
            stroke-width="1.8"
          />
          <circle
            r="15"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-violet) 31%, var(--color-surface))"
          />
          <path
            d="M-10-6Q-3-13 1-5T10-3M-11 3Q-4-2 0 5T10 7"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-violet) 54%, var(--color-surface))"
            stroke-width="1.6"
          />
          <circle
            cx="5"
            cy="-5"
            r="4"
            fill="color-mix(in srgb, var(--color-learning-violet) 50%, var(--color-surface))"
          />
        </g>
        <g :id="id('small-cell')">
          <circle
            r="31"
            :fill="paint('cell')"
            stroke="color-mix(in srgb, var(--color-learning-blue) 52%, var(--color-surface))"
            stroke-width="2"
          />
          <circle
            r="27"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-blue) 29%, var(--color-surface))"
          />
          <use :href="href('nuclear-detail')" />
          <ellipse
            cx="-16"
            cy="18"
            rx="7"
            ry="3"
            transform="rotate(25 -16 18)"
            fill="color-mix(in srgb, var(--color-learning-amber) 25%, var(--color-surface))"
            stroke="color-mix(in srgb, var(--color-learning-amber) 58%, var(--color-surface))"
          />
        </g>
        <g :id="id('protein')">
          <path
            d="M-19 2C-25-12-10-21-2-13C5-27 20-18 17-6C33-2 20 18 10 12C3 25-10 18-10 10C-19 15-26 8-19 2Z"
            fill="var(--color-learning-violet-line)"
            stroke="color-mix(in srgb, var(--color-learning-violet) 51%, var(--color-surface))"
            stroke-width="2"
          />
          <path
            d="M-12-1Q-6-13 1-5T13-1M-5 9Q3 1 10 7"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-violet) 37%, var(--color-surface))"
            stroke-width="2"
          />
        </g>
        <g :id="id('red-cell')">
          <ellipse
            rx="23"
            ry="16"
            :fill="paint('red')"
            stroke="color-mix(in srgb, var(--color-learning-amber) 57%, var(--color-surface))"
            stroke-width="1.5"
          />
          <ellipse
            rx="12"
            ry="7"
            fill="color-mix(in srgb, var(--color-learning-amber) 24%, var(--color-surface))"
            stroke="color-mix(in srgb, var(--color-learning-amber) 40%, var(--color-surface))"
          />
          <path
            d="M-15-6Q0-15 14-5"
            fill="none"
            stroke="var(--color-learning-amber-line)"
            stroke-width="2"
            opacity=".8"
          />
        </g>
        <g :id="id('neuron')">
          <path
            d="M-25-5L-48-18L-57-35M-48-18L-67-16M-17-17L-24-40L-15-53M-24-40L-39-48M-20 13L-43 31L-62 28M-43 31L-49 48M0-19L13-41L7-55M13-41L30-46"
            class="neuron-branch"
          />
          <path
            d="M-27-6Q-20-20-9-20Q7-19 12-8L20 0L12 8Q4 20-10 18Q-27 17-27-6Z"
            :fill="paint('cell')"
            stroke="color-mix(in srgb, var(--color-learning-blue) 68%, var(--color-surface))"
            stroke-width="2"
          />
          <circle
            cx="-9"
            cy="-1"
            r="10"
            :fill="paint('nucleus')"
            stroke="color-mix(in srgb, var(--color-learning-violet) 49%, var(--color-surface))"
          />
          <path d="M16 0H98M98 0L114-13M98 0L116 14" class="neuron-branch" />
          <rect
            v-for="x in [25, 49, 73]"
            :key="x"
            :x="x"
            y="-7"
            width="19"
            height="14"
            rx="6"
            fill="color-mix(in srgb, var(--color-learning-teal) 26%, var(--color-surface))"
            stroke="color-mix(in srgb, var(--color-learning-teal) 63%, var(--color-surface))"
          />
          <circle
            cx="115"
            cy="-13"
            r="3"
            fill="color-mix(in srgb, var(--color-learning-blue) 68%, var(--color-surface))"
          />
          <circle
            cx="116"
            cy="14"
            r="3"
            fill="color-mix(in srgb, var(--color-learning-blue) 68%, var(--color-surface))"
          />
        </g>
        <g :id="id('muscle')">
          <path
            d="M-75-15Q-92 0-75 15H75Q92 0 75-15Z"
            fill="var(--color-learning-amber-line)"
            stroke="color-mix(in srgb, var(--color-learning-amber) 47%, var(--color-surface))"
            stroke-width="2"
          />
          <path
            d="M-75-8H76M-80 0H80M-75 8H76"
            stroke="color-mix(in srgb, var(--color-learning-amber) 34%, var(--color-surface))"
            fill="none"
          />
          <path
            v-for="x in [-60, -45, -30, -15, 0, 15, 30, 45, 60]"
            :key="x"
            :d="`M${x}-13V13`"
            stroke="color-mix(in srgb, var(--color-learning-amber) 40%, var(--color-surface))"
          />
          <ellipse
            cx="-52"
            cy="-10"
            rx="8"
            ry="3"
            fill="color-mix(in srgb, var(--color-learning-violet) 52%, var(--color-surface))"
          />
          <ellipse
            cx="44"
            cy="10"
            rx="8"
            ry="3"
            fill="color-mix(in srgb, var(--color-learning-violet) 52%, var(--color-surface))"
          />
        </g>
      </defs>

      <g v-if="mode === 'engineering'">
        <text x="34" y="35" class="eyebrow">RECOMBINANT DNA · {{ controls[stage] }}</text>
        <template v-if="stage < 2">
          <ellipse cx="232" cy="262" rx="166" ry="159" fill="var(--color-learning-blue-soft)" />
          <path
            d="M315 172A120 120 0 1 0 315 348"
            fill="none"
            stroke="var(--color-learning-teal)"
            stroke-width="7"
            stroke-linecap="round"
          />
          <path
            d="M306 181A108 108 0 1 0 306 339"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-teal) 46%, var(--color-surface))"
            stroke-width="5"
            stroke-linecap="round"
          />
          <g v-for="a in plasmidRungs" :key="a" :transform="`translate(232 260) rotate(${a})`">
            <path
              d="M108 0H120"
              stroke="color-mix(in srgb, var(--color-learning-teal) 56%, var(--color-surface))"
              stroke-width="2.2"
            />
          </g>
          <g v-if="stage === 0">
            <path
              d="M315 172L324 180L312 193M306 181L313 188M315 348L324 340L312 327M306 339L313 332"
              stroke="var(--color-learning-teal)"
              fill="none"
              stroke-width="4"
            />
            <path
              d="M480 193L494 193L494 205H675M480 229H662L662 241H677"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-amber) 56%, var(--color-surface))"
              stroke-width="5"
            />
            <path
              v-for="x in [506, 523, 540, 557, 574, 591, 608, 625, 642]"
              :key="x"
              :d="`M${x} 205V229`"
              stroke="color-mix(in srgb, var(--color-learning-amber) 38%, var(--color-surface))"
              stroke-width="4"
            />
            <text x="575" y="163" text-anchor="middle" class="label">目的 DNA 片段</text>
            <text x="575" y="275" text-anchor="middle" class="small">两端与打开的质粒相容</text>
            <g transform="translate(365 146) rotate(-25)">
              <path
                d="M-37-18C-35-45 13-45 18-21L40-9L15 12L-2-3L-16 10C-41 15-51-8-37-18Z"
                fill="var(--color-learning-violet-line)"
                stroke="color-mix(in srgb, var(--color-learning-violet) 47%, var(--color-surface))"
                stroke-width="2"
              />
              <path
                d="M-2-3L15 12L40-9"
                fill="none"
                stroke="color-mix(in srgb, var(--color-learning-violet) 50%, var(--color-surface))"
                stroke-width="3"
              />
            </g>
            <path d="M387 128L425 96H591" class="leader" />
            <text x="432" y="85" class="label">限制性内切酶：切开 DNA</text>
            <path
              d="M465 216C420 216 390 232 365 250"
              class="transfer"
              :marker-end="paint('arrow')"
            />
            <path d="M319 344L397 379H625" class="leader" />
            <text x="405" y="370" class="small">黏性末端：露出的短单链</text>
          </g>
          <g v-else>
            <path
              d="M315 172A120 120 0 0 1 315 348"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-amber) 61%, var(--color-surface))"
              stroke-width="7"
              stroke-linecap="round"
            />
            <path
              d="M306 181A108 108 0 0 1 306 339"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-amber) 41%, var(--color-surface))"
              stroke-width="5"
              stroke-linecap="round"
            />
            <g
              v-for="a in [-42, -27, -12, 3, 18, 33, 48]"
              :key="a"
              :transform="`translate(232 260) rotate(${a})`"
            >
              <path
                d="M108 0H120"
                stroke="color-mix(in srgb, var(--color-learning-amber) 51%, var(--color-surface))"
                stroke-width="2.2"
              />
            </g>
            <circle
              cx="310"
              cy="176"
              r="15"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-violet) 47%, var(--color-surface))"
              stroke-width="2"
              stroke-dasharray="3 3"
            />
            <path d="M323 173L443 136" class="leader" />
            <rect
              x="440"
              y="105"
              width="332"
              height="235"
              rx="18"
              fill="var(--color-learning-violet-soft)"
              stroke="var(--color-learning-violet-line)"
            />
            <text x="606" y="134" text-anchor="middle" class="label">连接处放大：骨架被封口</text>
            <path
              d="M477 225H583M477 255H625"
              stroke="var(--color-learning-teal)"
              stroke-width="5"
            />
            <path
              d="M597 225H739M639 255H739"
              stroke="color-mix(in srgb, var(--color-learning-amber) 53%, var(--color-surface))"
              stroke-width="5"
            />
            <path
              v-for="x in [485, 510, 535, 560]"
              :key="x"
              :d="`M${x} 225V255`"
              stroke="color-mix(in srgb, var(--color-learning-teal) 45%, var(--color-surface))"
              stroke-width="3"
            />
            <path
              v-for="x in [650, 675, 700, 725]"
              :key="x"
              :d="`M${x} 225V255`"
              stroke="color-mix(in srgb, var(--color-learning-amber) 37%, var(--color-surface))"
              stroke-width="3"
            />
            <g v-for="x in [605, 620]" :key="`paired-${x}`">
              <path
                :d="`M${x} 225V240`"
                stroke="color-mix(in srgb, var(--color-learning-amber) 37%, var(--color-surface))"
                stroke-width="3"
              />
              <path
                :d="`M${x} 240V255`"
                stroke="color-mix(in srgb, var(--color-learning-teal) 45%, var(--color-surface))"
                stroke-width="3"
              />
            </g>
            <path
              d="M568 205C548 173 582 155 600 172C624 151 656 177 637 205L616 215L603 199L590 216Z"
              fill="var(--color-learning-violet-line)"
              stroke="color-mix(in srgb, var(--color-learning-violet) 51%, var(--color-surface))"
              stroke-width="2"
            />
            <path
              d="M583 225H597M625 255H639"
              stroke="color-mix(in srgb, var(--color-learning-violet) 56%, var(--color-surface))"
              stroke-width="5"
            />
            <circle
              cx="590"
              cy="225"
              r="5"
              fill="color-mix(in srgb, var(--color-learning-violet) 56%, var(--color-surface))"
            />
            <circle
              cx="632"
              cy="255"
              r="5"
              fill="color-mix(in srgb, var(--color-learning-violet) 56%, var(--color-surface))"
            />
            <text x="606" y="300" text-anchor="middle" class="small">连接酶连接糖—磷酸骨架</text>
            <text x="606" y="380" text-anchor="middle" class="small">
              得到重组质粒，还不等于已经表达
            </text>
          </g>
          <text x="220" y="256" text-anchor="middle" class="label">
            {{ stage === 0 ? '打开的质粒' : '重组质粒' }}
          </text>
          <text x="220" y="281" text-anchor="middle" class="small">环状双链 DNA</text>
          <text x="232" y="447" text-anchor="middle" class="small">
            青绿：载体 DNA　橙色：目的片段
          </text>
        </template>
        <template v-else>
          <path
            d="M185 132C95 132 65 192 65 260S98 388 187 388H400C482 388 508 327 508 260S480 132 400 132Z"
            :fill="paint('cell')"
            stroke="color-mix(in srgb, var(--color-learning-blue) 65%, var(--color-surface))"
            stroke-width="4"
          />
          <path
            d="M186 144C106 144 79 197 79 260S108 376 187 376H398C470 376 494 323 494 260S471 144 398 144Z"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-blue) 41%, var(--color-surface))"
            stroke-width="2"
          />
          <path
            d="M142 205C194 173 247 239 192 246S129 278 194 293S259 344 290 297S321 222 265 208S210 256 267 270S321 331 351 295S351 181 294 189S221 189 204 218"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-violet) 50%, var(--color-surface))"
            stroke-width="6"
            stroke-linecap="round"
          />
          <g
            v-for="(point, index) in ribosomes"
            :key="index"
            :transform="`translate(${point[0]} ${point[1]})`"
          >
            <ellipse
              rx="5"
              ry="3.5"
              fill="color-mix(in srgb, var(--color-learning-amber) 51%, var(--color-surface))"
            />
            <ellipse
              cy="4"
              rx="3.5"
              ry="2.2"
              fill="color-mix(in srgb, var(--color-learning-amber) 59%, var(--color-surface))"
            />
          </g>
          <g transform="translate(409 258)">
            <circle r="39" fill="none" stroke="var(--color-learning-teal)" stroke-width="5" />
            <circle
              r="31"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-teal) 36%, var(--color-surface))"
              stroke-width="3"
            />
            <path
              d="M28-27A39 39 0 0 1 28 27M22-22A31 31 0 0 1 22 22"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-amber) 56%, var(--color-surface))"
              stroke-width="5"
            />
          </g>
          <path d="M156 203L137 98H49" class="leader" />
          <text x="42" y="82" class="label">细菌主染色体</text>
          <path d="M424 221L449 91H642" class="leader" />
          <text x="470" y="79" class="label">带目的基因的质粒</text>
          <path d="M433 302L478 432H661" class="leader" />
          <text x="487" y="456" class="small">质粒可以独立于主染色体存在</text>
          <path d="M530 262H596" class="transfer" :marker-end="paint('arrow')" />
          <text x="564" y="229" text-anchor="middle" class="small">培养、提取</text>
          <text x="564" y="309" text-anchor="middle" class="small">与纯化</text>
          <ellipse
            cx="690"
            cy="269"
            rx="78"
            ry="94"
            fill="var(--color-learning-violet-soft)"
            stroke="var(--color-learning-violet-line)"
          />
          <use :href="href('protein')" transform="translate(674 222) rotate(-14)" />
          <use :href="href('protein')" transform="translate(713 266) rotate(19)" />
          <use :href="href('protein')" transform="translate(670 316) rotate(-25)" />
          <text x="691" y="395" text-anchor="middle" class="label">所需蛋白质</text>
          <text x="267" y="421" text-anchor="middle" class="small">宿主内：基因转录与翻译</text>
        </template>
      </g>

      <g v-else-if="mode === 'stem'">
        <text x="34" y="35" class="eyebrow">DIFFERENTIATION POTENTIAL · 分化范围</text>
        <text x="183" y="84" text-anchor="middle" class="label">{{ stemSource }}</text>
        <g v-if="stage === 0" transform="translate(183 246)">
          <circle
            r="111"
            fill="var(--color-learning-amber-soft)"
            stroke="color-mix(in srgb, var(--color-learning-amber) 36%, var(--color-surface))"
            stroke-width="5"
          />
          <circle
            r="101"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-amber) 19%, var(--color-surface))"
            stroke-width="2"
          />
          <path
            d="M-88-20C-95-85 1-106 63-68S105 53 56 82S-96 78-88-20Z"
            :fill="paint('cell')"
            stroke="color-mix(in srgb, var(--color-learning-blue) 51%, var(--color-surface))"
            stroke-width="3"
          />
          <g transform="scale(2)"><use :href="href('nuclear-detail')" /></g>
          <g
            v-for="(p, i) in [
              [-57, -48],
              [58, 30],
              [-40, 63],
              [40, -56],
            ]"
            :key="i"
            :transform="`translate(${p[0]} ${p[1]}) rotate(${i * 40})`"
          >
            <ellipse
              rx="14"
              ry="7"
              fill="color-mix(in srgb, var(--color-learning-amber) 26%, var(--color-surface))"
              stroke="color-mix(in srgb, var(--color-learning-amber) 54%, var(--color-surface))"
            />
            <path
              d="M-9 0L-4-4L0 3L5-3L9 0"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-amber) 58%, var(--color-surface))"
            />
          </g>
          <text y="153" text-anchor="middle" class="small">全能：完整个体所需的全部类型</text>
        </g>
        <g v-else-if="stage === 1" transform="translate(183 246)">
          <circle
            r="112"
            fill="var(--color-learning-amber-soft)"
            stroke="color-mix(in srgb, var(--color-learning-amber) 28%, var(--color-surface))"
            stroke-width="4"
          />
          <circle r="89" fill="var(--color-learning-blue-soft)" />
          <g v-for="i in 18" :key="i" :transform="`rotate(${i * 20}) translate(92 0)`">
            <ellipse
              rx="18"
              ry="17"
              :fill="paint('cell')"
              stroke="color-mix(in srgb, var(--color-learning-blue) 47%, var(--color-surface))"
              stroke-width="1.8"
            />
            <circle
              r="7"
              fill="color-mix(in srgb, var(--color-learning-violet) 32%, var(--color-surface))"
              stroke="color-mix(in srgb, var(--color-learning-violet) 51%, var(--color-surface))"
            />
          </g>
          <g
            v-for="(p, i) in [
              [-49, -46],
              [-22, -54],
              [-64, -18],
              [-34, -24],
              [-4, -30],
              [-48, 10],
            ]"
            :key="i"
            :transform="`translate(${p[0]} ${p[1]})`"
          >
            <circle
              r="17"
              fill="var(--color-learning-violet-line)"
              stroke="color-mix(in srgb, var(--color-learning-violet) 53%, var(--color-surface))"
              stroke-width="1.8"
            />
            <circle
              r="6"
              fill="color-mix(in srgb, var(--color-learning-violet) 42%, var(--color-surface))"
            />
          </g>
          <path d="M-46-70L-105-112" class="leader" />
          <text x="-145" y="-119" class="small">内细胞团</text>
          <text x="24" y="35" class="small">囊胚腔</text>
          <text y="153" text-anchor="middle" class="small">多能：来自内细胞团的胚胎干细胞</text>
        </g>
        <g v-else transform="translate(175 242)">
          <path
            d="M-100-71Q-132-106-103-130Q-76-150-53-116H55Q82-147 109-125Q136-104 103-73V75Q136 105 108 128Q80 149 55 116H-54Q-80 149-108 128Q-135 105-100 74Z"
            :fill="paint('bone')"
            stroke="color-mix(in srgb, var(--color-learning-amber) 58%, var(--color-surface))"
            stroke-width="3"
          />
          <path
            d="M-67-97H68V96H-67Z"
            fill="var(--color-learning-amber-line)"
            stroke="color-mix(in srgb, var(--color-learning-amber) 46%, var(--color-surface))"
            stroke-width="2"
          />
          <path
            d="M-100-65L-69-39M-100-10L-69 16M-101 46L-69 72M69-64L99-36M69-12L99 16M69 43L100 70"
            stroke="var(--color-learning-amber-line)"
            stroke-width="5"
          />
          <g
            v-for="(p, i) in [
              [-39, -61],
              [17, -71],
              [46, -30],
              [-14, -20],
              [-40, 27],
              [11, 36],
              [42, 74],
              [-17, 77],
            ]"
            :key="i"
            :transform="`translate(${p[0]} ${p[1]}) scale(.46)`"
          >
            <use :href="href('small-cell')" />
          </g>
          <circle
            cx="12"
            cy="-19"
            r="24"
            fill="none"
            stroke="var(--color-learning-teal)"
            stroke-width="3"
          />
          <text y="157" text-anchor="middle" class="small">多潜能：骨髓中的造血干细胞</text>
        </g>
        <path
          d="M311 244H355M355 117V364M355 117H401M355 244H401M355 364H401"
          class="potential"
          :class="{ muted: stage === 2 }"
        />
        <path d="M311 244H401" class="transfer" :marker-end="paint('arrow')" />
        <path
          v-if="stage < 2"
          d="M355 117H401M355 364H401"
          class="transfer"
          :marker-end="paint('arrow')"
        />
        <g :class="{ muted: stage === 2 }" transform="translate(497 117)">
          <use :href="href('neuron')" />
          <text x="133" y="5" class="label">神经细胞</text>
        </g>
        <g transform="translate(491 245)">
          <use :href="href('red-cell')" transform="translate(-25 -15) rotate(-18)" />
          <use :href="href('red-cell')" transform="translate(-2 22) rotate(15)" />
          <use :href="href('small-cell')" transform="translate(50 -4) scale(.8)" />
          <circle
            cx="-39"
            cy="23"
            r="4"
            fill="color-mix(in srgb, var(--color-learning-violet) 46%, var(--color-surface))"
          />
          <circle
            cx="29"
            cy="32"
            r="3"
            fill="color-mix(in srgb, var(--color-learning-violet) 46%, var(--color-surface))"
          />
          <text x="139" y="5" class="label">血细胞</text>
        </g>
        <g :class="{ muted: stage === 2 }" transform="translate(516 364)">
          <use :href="href('muscle')" transform="translate(0 -12)" />
          <use :href="href('muscle')" transform="translate(0 23)" />
          <text x="114" y="10" class="label">肌肉细胞</text>
        </g>
        <g v-if="stage === 0">
          <path d="M285 343Q339 442 420 442" class="transfer" :marker-end="paint('arrow')" />
          <path
            d="M447 459V431Q460 418 471 429Q485 413 498 428Q510 419 521 431V459Z"
            fill="color-mix(in srgb, var(--color-learning-amber) 26%, var(--color-surface))"
            stroke="color-mix(in srgb, var(--color-learning-amber) 46%, var(--color-surface))"
            stroke-width="2"
          />
          <path
            d="M456 433L459 451M473 429V453M490 430L486 452M510 433L507 453"
            stroke="color-mix(in srgb, var(--color-learning-amber) 43%, var(--color-surface))"
            stroke-width="2"
          />
          <text x="545" y="448" class="small">也包括支持发育的胚外组织</text>
        </g>
        <text v-else x="426" y="454" class="small">
          {{
            stage === 1
              ? '可形成身体各类细胞 ≠ 能独立形成完整个体'
              : '灰色类型超出本图造血干细胞的通常分化范围'
          }}
        </text>
      </g>

      <g v-else>
        <text x="34" y="35" class="eyebrow">SELECTIVE BREEDING · {{ controls[stage] }}</text>
        <rect
          x="32"
          y="62"
          width="756"
          height="72"
          rx="15"
          fill="var(--color-learning-teal-soft)"
          stroke="var(--color-learning-teal-line)"
        />
        <text x="410" y="91" text-anchor="middle" class="label">{{ breedingHeadline }}</text>
        <text x="410" y="116" text-anchor="middle" class="small">
          假设果实大小存在可遗传差异，种植条件相近
        </text>
        <path
          d="M32 359H788"
          stroke="color-mix(in srgb, var(--color-learning-teal) 32%, var(--color-surface))"
          stroke-width="3"
        />
        <path d="M32 365H788V419H32Z" fill="var(--color-learning-amber-line)" />
        <g
          v-for="(size, index) in fruitSizes"
          :key="index"
          :transform="`translate(${78 + index * 132} 348)`"
          :opacity="stage === 1 && !selectedPlants.includes(index) ? 0.3 : 1"
        >
          <ellipse
            v-if="stage === 1 && selectedPlants.includes(index)"
            cy="-75"
            rx="58"
            ry="126"
            fill="var(--color-learning-teal-soft)"
            stroke="var(--color-learning-teal)"
            stroke-width="2"
            stroke-dasharray="6 5"
          />
          <path
            d="M0 5L-2-122Q-3-145 7-164"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-teal) 68%, var(--color-surface))"
            stroke-width="5"
            stroke-linecap="round"
          />
          <path
            d="M0-29Q-38-23-46-61Q-9-70 0-29ZM-1-82Q31-68 46-106Q12-119-1-82Z"
            :fill="paint('leaf')"
            stroke="color-mix(in srgb, var(--color-learning-teal) 64%, var(--color-surface))"
            stroke-width="1.8"
          />
          <path
            d="M-43-59L-1-30M2-84L43-105M-29-54L-30-41M-19-46L-19-35M17-92L19-108M28-98L34-87"
            stroke="color-mix(in srgb, var(--color-learning-teal) 58%, var(--color-surface))"
            fill="none"
            stroke-width="1.3"
          />
          <path
            d="M-1-114Q-27-137-34-121M0-141Q28-158 32-139"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-teal) 68%, var(--color-surface))"
            stroke-width="2.5"
          />
          <g
            v-for="(p, fruit) in [
              [-32, -103],
              [30, -120],
              [7, -165],
            ]"
            :key="fruit"
            :transform="`translate(${p[0]} ${p[1]})`"
          >
            <circle
              :r="size + (fruit === 2 ? -2 : 0)"
              :fill="paint('red')"
              stroke="color-mix(in srgb, var(--color-learning-amber) 55%, var(--color-surface))"
              stroke-width="1.4"
            />
            <ellipse
              :cx="-size * 0.27"
              :cy="-size * 0.32"
              :rx="size * 0.27"
              :ry="size * 0.16"
              fill="var(--color-learning-amber-line)"
              opacity=".65"
              transform="rotate(-30)"
            />
            <path
              :d="`M0 ${-size + 4}l-8-3l5 7l-7 3l9-1l5 5l-1-7l7-4l-9 1l-1-6Z`"
              fill="var(--color-learning-teal)"
            />
          </g>
          <path
            d="M0 6L-4 37M-1 13L-20 26L-27 40M-2 22L17 38L28 43M-4 33L-14 49M-18 25L-31 28M15 37L16 51"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-amber) 51%, var(--color-surface))"
            stroke-width="2"
          />
          <text y="101" text-anchor="middle" class="small">
            {{ stage === 2 ? '后代 ' : '亲本 ' }}{{ index + 1 }}
          </text>
          <text
            v-if="stage === 1 && selectedPlants.includes(index)"
            y="-198"
            text-anchor="middle"
            class="selection-label"
          >
            留作亲本
          </text>
        </g>
        <text x="410" y="485" text-anchor="middle" class="small">
          {{
            stage === 2
              ? '平均性状可改变；后代仍有差异，并非克隆'
              : '果实尺寸仅表现相对差异，不代表真实测量或固定遗传比例'
          }}
        </text>
      </g>
    </svg>
    <template #legend>
      <span
        ><i class="legend-dot teal" />{{
          mode === 'engineering'
            ? '载体 DNA / 操作方向'
            : mode === 'stem'
              ? '当前可形成的类型'
              : '植株与被保留的亲本'
        }}</span
      >
      <span v-if="mode !== 'breeding'"
        ><i class="legend-dot violet" />{{
          mode === 'engineering' ? '酶 / 细胞内遗传结构' : '细胞核 / 干细胞来源'
        }}</span
      >
      <span v-if="mode === 'engineering'"><i class="legend-dot amber" />目的 DNA 片段</span>
      <span v-if="mode === 'breeding'"><i class="legend-dot amber" />同种作物的果实大小差异</span>
    </template>
    <template #explanation>
      <h6>{{ controls[stage] }} · 要记住的关系</h6>
      <p><KnowledgeText :text="explanation" /></p>
    </template>
  </BiologyAtlasFrame>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppButton from '@/components/AppButton.vue'
import BiologyAtlasFrame from './BiologyAtlasFrame.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic?: string }>()
const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const stage = ref(0)
const selectedPlants = [3, 5]
const plasmidRungs = [
  -50, -65, -80, -95, -110, -125, -140, -155, -170, -185, -200, -215, -230, -245, -260, -275, -290,
  -305,
]
const ribosomes = [
  [133, 164],
  [181, 166],
  [222, 163],
  [266, 160],
  [311, 163],
  [359, 168],
  [401, 169],
  [453, 194],
  [463, 239],
  [467, 299],
  [421, 343],
  [376, 349],
  [333, 347],
  [267, 353],
  [216, 348],
  [155, 335],
  [111, 291],
  [108, 234],
  [168, 269],
  [237, 306],
  [359, 228],
]

// 考纲叶子决定图谱主题，同一章节内不把上一知识点的交互状态带入下一点。
const mode = computed(() =>
  props.topic === '150602' ? 'stem' : props.topic === '150603' ? 'breeding' : 'engineering',
)
watch(
  () => props.topic,
  () => {
    stage.value = 0
  },
)

// 为多个图谱实例隔离渐变、图元和箭头定义，防止展开多节时引用串图。
function id(name: string) {
  return `gene-${uid}-${name}`
}
// SVG use 与填充都引用当前实例定义。
function href(name: string) {
  return `#${id(name)}`
}
// 渐变和箭头采用 SVG paint server 引用。
function paint(name: string) {
  return `url(#${id(name)})`
}

// 每个主题提供实际生物过程或能力范围，按钮名称不以题目方法代替知识。
const controls = computed(() =>
  mode.value === 'engineering'
    ? ['切割与末端匹配', '连接形成重组质粒', '宿主表达与产物']
    : mode.value === 'stem'
      ? ['全能 Totipotent', '多能 Pluripotent', '多潜能 Multipotent']
      : ['原始群体', '选择亲本', '多代后的群体'],
)
// 图谱标题随知识点变化，便于读屏和章节定位。
const heading = computed(() =>
  mode.value === 'engineering'
    ? '从一段 DNA，到细胞制造的蛋白质'
    : mode.value === 'stem'
      ? '干细胞的能力，关键在分化范围'
      : '选择留下哪些亲本，会改变后来的群体',
)
// 副标题说明图中操作与需要保持的科学边界。
const subtitle = computed(() =>
  mode.value === 'engineering'
    ? '切换步骤，观察 DNA 的切口、连接位置以及宿主内外的不同对象。'
    : mode.value === 'stem'
      ? '切换潜能类型，比较来源示例与能够形成的细胞；图中只列出部分代表。'
      : '切换世代，观察已有差异怎样通过选亲本和繁殖影响后代。',
)
// 原理图不使用真实比例，不把示意阶段误当成完整实验操作或疗法。
const note = computed(() =>
  mode.value === 'engineering'
    ? '原创结构示意，非按比例绘制；质粒环放大显示双链，省略筛选与部分实验步骤。用于细菌表达的目的 DNA 应含合适的编码及调控信息；这里不表示把任意人类基因组片段直接转入即可成功。'
    : mode.value === 'stem'
      ? '原创能力示意，非实际大小比较，也不是从左到右必然发生的完整发育过程。全能栏用极早期细胞代表；多能栏标出囊胚内细胞团；多潜能栏以造血干细胞为例。'
      : '原创假想作物示意；假设大小差异有遗传基础，种植条件相近。图示平均性状变化不是对所有育种实验的保证，仍需考虑多基因、环境和保留遗传多样性。',
)
// 来源名称保留阶段限制，避免“所有胚胎细胞全能”的误读。
const stemSource = computed(
  () => ['某些极早期胚胎细胞', '囊胚中的内细胞团', '成体骨髓（局部剖面）'][stage.value],
)
// 虚构果实尺寸只表达变异和平均变化，不承担精确遗传比例。
const fruitSizes = computed(() =>
  stage.value === 2 ? [20, 25, 23, 28, 22, 26] : [13, 19, 15, 26, 18, 28],
)
// 群体图明确区分个体被选择与多代之后群体发生变化。
const breedingHeadline = computed(
  () =>
    [
      '原群体：个体间已经有差异',
      '选择阶段：让目标性状合适的个体繁殖',
      '多代选择后：较大果实可能更常见',
    ][stage.value],
)
// 读屏获得当前主题和控制状态，不依赖颜色来理解内容。
const accessibleLabel = computed(
  () =>
    `${heading.value}，${controls.value[stage.value]}。${mode.value === 'stem' ? '全能包括胚外组织，多能包括身体各类细胞，本图多潜能仅显示血细胞分化。' : mode.value === 'breeding' ? breedingHeadline.value : '青绿表示载体，橙色表示目的 DNA，紫色表示酶或相关细胞内结构。'}`,
)
// 每一步解释具体结构变化，并提醒最容易混淆的因果关系。
const explanation = computed(() => {
  if (mode.value === 'engineering')
    return [
      '限制性内切酶先切开 DNA。图中用互补黏性末端示例：露出的单链末端可以配对，**但配上不等于骨架已经接牢**。不同限制酶也可能产生平末端。',
      '**DNA 连接酶连接糖—磷酸骨架**，使目的片段成为重组质粒的一部分。放大框中的紫色短段强调连接处，并不是额外插入了一段“酶的 DNA”。',
      '适当的重组质粒进入宿主后，细胞才可能按指令制造所需蛋白质。图右是经提取、纯化后的产物，**不是患者的染色体，也不是直接注射活细菌**。实际表达还需要适合的调控序列与宿主条件。',
    ][stage.value]!
  if (mode.value === 'stem')
    return [
      '**全能性包含完整个体发育所需的全部细胞类型**，在哺乳动物中还包括胚外组织。图中展示的是能力范围，不能推断每个细胞在任何环境下都会形成完整个体。',
      '囊胚内细胞团是胚胎干细胞的一种来源。**多能细胞可以形成身体各类细胞，但不因此具有完整个体发育所需的全部能力**；图中的神经、血液和肌肉仅是代表。',
      '造血干细胞可以产生多类血细胞，属于多潜能。灰色神经和肌肉细胞提示其范围限制，**不是说这些类型在身体中不存在，也不是说所有成体干细胞都只产生血细胞**。',
    ][stage.value]!
  return [
    '先有可遗传差异，后有选择。较大果实的个体本来就在群体中，**不是因为人想要大果实，它们才按需求产生特定突变**。',
    '虚线圈出的植株被留下繁殖，因而会向下一代贡献更多遗传信息。**亲本被选中，并不使其余植株立即改变 DNA**；变化要通过繁殖传递到后代。',
    '经过多代选择，后代平均性状可能改变，但图中仍保留大小差异。**人工选择不等于克隆**；长期反复使用少数亲本还可能降低多样性，增加近交风险。',
  ][stage.value]!
})
</script>

<style scoped>
.gene-technologies-illustration {
  min-width: 610px;
}
.gene-technologies-illustration text {
  fill: var(--color-ink);
}
.gene-technologies-illustration .eyebrow {
  fill: var(--color-learning-teal);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.gene-technologies-illustration .label {
  font-size: 15px;
  font-weight: 650;
}
.gene-technologies-illustration .small {
  fill: var(--color-ink-soft);
  font-size: 13px;
}
.gene-technologies-illustration .selection-label {
  fill: var(--color-learning-teal);
  font-size: 13px;
  font-weight: 700;
}
.leader {
  fill: none;
  stroke: color-mix(in srgb, var(--color-learning-blue) 51%, var(--color-surface));
  stroke-width: 1.5;
}
.transfer {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 2.5;
}
.potential {
  fill: none;
  stroke: color-mix(in srgb, var(--color-learning-teal) 41%, var(--color-surface));
  stroke-width: 2;
}
.neuron-branch {
  fill: none;
  stroke: color-mix(in srgb, var(--color-learning-blue) 68%, var(--color-surface));
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.muted {
  opacity: 0.2;
}
.legend-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 6px;
  border-radius: 50%;
}
.teal {
  background: var(--color-learning-teal);
}
.violet {
  background: color-mix(in srgb, var(--color-learning-violet) 49%, var(--color-surface));
}
.amber {
  background: color-mix(in srgb, var(--color-learning-amber) 56%, var(--color-surface));
}
@media (max-width: 760px) {
  .gene-technologies-illustration {
    min-width: 590px;
  }
}
</style>
