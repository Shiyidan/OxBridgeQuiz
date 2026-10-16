<!-- DNA 章节原创分子图谱：按知识点展示遗传层级、核苷酸配对、信息传递与突变后的阅读结果。 -->
<template>
  <BiologyAtlasFrame :title="heading.title" :subtitle="heading.subtitle" :note="heading.note">
    <template #controls>
      <template v-if="view === 'structure'">
        <AppButton
          v-for="pair in pairOptions"
          :key="pair.id"
          type="secondary"
          size="small"
          :aria-pressed="pairKind === pair.id"
          @click="pairKind = pair.id"
          >{{ pair.label }}</AppButton
        >
      </template>
      <template v-else-if="view === 'synthesis'">
        <AppButton
          v-for="stage in synthesisStages"
          :key="stage.id"
          type="secondary"
          size="small"
          :aria-pressed="synthesisStage === stage.id"
          @click="synthesisStage = stage.id"
          >{{ stage.label }}</AppButton
        >
      </template>
      <template v-else-if="view === 'mutation'">
        <AppButton
          v-for="change in changes"
          :key="change.id"
          type="secondary"
          size="small"
          :aria-pressed="mutation === change.id"
          @click="mutation = change.id"
          >{{ change.label }}</AppButton
        >
      </template>
      <template v-else>
        <AppButton
          v-for="item in genomeOptions"
          :key="item.id"
          type="secondary"
          size="small"
          :aria-pressed="genomeFocus === item.id"
          @click="genomeFocus = item.id"
          >{{ item.label }}</AppButton
        >
      </template>
    </template>

    <svg
      class="dna-illustration"
      viewBox="0 0 840 500"
      role="img"
      :aria-label="accessibleDescription"
    >
      <defs>
        <radialGradient :id="id('cell')" cx="35%" cy="30%" r="80%">
          <stop offset="0" stop-color="var(--color-surface)" />
          <stop offset="0.65" stop-color="var(--color-learning-blue-soft)" />
          <stop offset="1" stop-color="var(--color-learning-blue-line)" />
        </radialGradient>
        <radialGradient :id="id('nucleus')" cx="30%" cy="25%" r="80%">
          <stop offset="0" stop-color="var(--color-learning-violet-soft)" />
          <stop offset="1" stop-color="var(--color-learning-violet-line)" />
        </radialGradient>
        <linearGradient :id="id('chromosome')" x1="0" y1="0" x2="1" y2="0">
          <stop
            offset="0"
            stop-color="color-mix(in srgb, var(--color-learning-violet) 72%, var(--color-learning-violet-line))"
          />
          <stop offset="0.38" stop-color="var(--color-learning-violet-line)" />
          <stop
            offset="0.65"
            stop-color="color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet))"
          />
          <stop
            offset="1"
            stop-color="color-mix(in srgb, var(--color-learning-violet) 72%, var(--color-learning-violet-line))"
          />
        </linearGradient>
        <radialGradient :id="id('protein')" cx="30%" cy="20%" r="90%">
          <stop offset="0" stop-color="var(--color-learning-teal-soft)" />
          <stop
            offset="1"
            stop-color="color-mix(in srgb, var(--color-learning-teal) 72%, var(--color-learning-teal-line))"
          />
        </radialGradient>
        <radialGradient :id="id('amino')" cx="30%" cy="22%" r="80%">
          <stop offset="0" stop-color="var(--color-learning-amber-soft)" />
          <stop
            offset="0.5"
            stop-color="color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber))"
          />
          <stop
            offset="1"
            stop-color="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
          />
        </radialGradient>
        <linearGradient :id="id('base')" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--color-learning-blue-soft)" />
          <stop offset="1" stop-color="var(--color-learning-blue-line)" />
        </linearGradient>
        <marker
          :id="id('arrow')"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0L10 5L0 10Z" fill="var(--color-learning-blue)" />
        </marker>
        <g :id="id('mitochondrion')">
          <path
            d="M-31-2C-32-20-5-23 17-13S41 14 15 20S-28 16-31-2Z"
            fill="var(--color-learning-amber-line)"
            stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
            stroke-width="2"
          />
          <path
            d="M-24 0C-24-12-12-14-6-9L-11 4Q-9 10-4 5L2-9Q8-7 8-2L5 10Q9 15 14 8L18-1Q26 3 25 9C16 22-17 15-24 0Z"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
            stroke-width="2"
          />
        </g>
        <g :id="id('folded')">
          <path
            d="M-45 8C-67-18-33-48-10-32C-2-65 42-48 35-20C70-20 68 20 37 22C46 55 2 60-7 33C-36 61-65 35-45 8Z"
            :fill="paint('protein')"
            stroke="var(--color-learning-teal)"
            stroke-width="2"
          />
          <path
            d="M-38 6C-49-19-15-30-8-6S27 20 32-3S6-41 0-14S-18 41 9 30S35 9 40 19"
            fill="none"
            stroke="var(--color-surface)"
            stroke-width="7"
            stroke-linecap="round"
          />
          <path
            d="M-38 6C-49-19-15-30-8-6S27 20 32-3S6-41 0-14S-18 41 9 30S35 9 40 19"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-teal) 72%, var(--color-learning-teal-line))"
            stroke-width="3"
            stroke-linecap="round"
          />
        </g>
      </defs>

      <g v-if="view === 'genome'">
        <text x="30" y="34" class="section-label">细胞里的遗传物质</text>
        <text x="427" y="34" class="section-label">从染色体展开到 DNA</text>
        <path
          d="M38 185C12 105 92 58 181 66C271 49 339 112 337 205C367 286 306 382 223 398C123 424 31 362 28 282C10 246 14 215 38 185Z"
          :fill="paint('cell')"
          stroke="color-mix(in srgb, var(--color-learning-blue-line) 65%, var(--color-learning-blue))"
          stroke-width="3"
        />
        <path
          d="M45 186C23 112 95 68 180 76C268 61 326 115 326 206C352 282 298 369 220 388C128 410 43 354 39 280"
          fill="none"
          stroke="var(--color-surface)"
          stroke-width="3"
        />
        <ellipse
          cx="181"
          cy="222"
          rx="100"
          ry="91"
          :fill="paint('nucleus')"
          stroke="color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet))"
          stroke-width="3"
        />
        <ellipse
          cx="181"
          cy="222"
          rx="92"
          ry="83"
          fill="none"
          stroke="color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet))"
          stroke-width="2"
        />
        <g
          stroke="color-mix(in srgb, var(--color-learning-violet) 72%, var(--color-learning-violet-line))"
          stroke-width="3"
          stroke-linecap="round"
        >
          <path
            d="M91 184l9 4M113 153l7 7M172 134v10M241 153l-7 8M277 204l-10 2M260 271l-9-5M204 311l-3-11M127 299l5-9M84 235l11-1"
          />
        </g>
        <g
          fill="none"
          stroke="color-mix(in srgb, var(--color-learning-violet) 72%, var(--color-learning-violet-line))"
          stroke-width="5"
          stroke-linecap="round"
        >
          <path d="M119 187C151 149 166 194 141 207S120 247 156 237S183 275 151 278" />
          <path d="M195 171C223 151 247 187 218 203S199 238 235 243S246 283 215 282" />
          <path d="M171 189C189 204 160 224 179 242S207 251 190 278" />
        </g>
        <path
          d="M122 194C134 183 140 184 146 190"
          fill="none"
          stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
          stroke-width="7"
          stroke-linecap="round"
        />
        <ellipse
          cx="203"
          cy="213"
          rx="18"
          ry="15"
          fill="color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet))"
          stroke="color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet))"
          stroke-width="2"
        />
        <use :href="'#' + id('mitochondrion')" transform="translate(91 326) rotate(-24)" />
        <use :href="'#' + id('mitochondrion')" transform="translate(287 126) rotate(32)" />
        <g
          fill="color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line))"
          opacity="0.65"
        >
          <circle v-for="(point, i) in cellDots" :key="i" :cx="point[0]" :cy="point[1]" r="2.6" />
        </g>
        <path d="M181 123V98" class="leader" />
        <text x="181" y="91" class="label" text-anchor="middle">细胞核：大部分 DNA 所在</text>
        <path d="M93 347L66 377" class="leader" />
        <text x="44" y="422" class="small-label">线粒体也含少量 DNA</text>
        <path d="M276 183L394 107M277 263L394 307" class="zoom-line" />
        <g :opacity="genomeFocus === 'whole' ? 0.68 : 1">
          <path
            d="M426 83C397 118 414 168 437 194C451 215 436 257 416 293C409 312 431 326 443 310C476 260 490 225 474 192C455 160 442 124 459 103C470 87 441 66 426 83Z"
            :fill="paint('chromosome')"
            stroke="color-mix(in srgb, var(--color-learning-violet) 72%, var(--color-learning-violet-line))"
            stroke-width="2"
          />
          <path
            d="M430 99C413 134 434 168 447 190M445 245L429 287"
            fill="none"
            stroke="var(--color-learning-violet-line)"
            stroke-width="5"
            stroke-linecap="round"
            opacity="0.65"
          />
          <path
            d="M432 180L466 166M440 190L472 178"
            stroke="color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber))"
            stroke-width="7"
          />
          <path d="M468 172L527 108" class="leader" />
          <text x="533" y="103" class="label">一段基因所在区域</text>
          <text x="440" y="354" class="small-label" text-anchor="middle">一条未复制的核染色体</text>
          <text x="440" y="376" class="small-label" text-anchor="middle">DNA 与蛋白质共同组成</text>
          <path
            d="M469 222C520 225 487 156 530 166S568 216 588 182S615 168 618 191"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet))"
            stroke-width="12"
            stroke-linecap="round"
          />
          <g
            v-for="(x, i) in [534, 576, 616]"
            :key="x"
            :transform="`translate(${x} ${185 + (i % 2) * 8})`"
          >
            <ellipse rx="12" ry="17" :fill="paint('chromosome')" />
            <path
              d="M-17-8Q0-20 17-8M-17 3Q0-9 17 3M-15 13Q0 2 15 13"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line))"
              stroke-width="3"
            />
          </g>
          <path d="M630 193Q669 217 675 269" class="leader" :marker-end="paint('arrow')" />
          <text x="550" y="239" class="small-label">逐步展开的染色质</text>
          <g transform="translate(548 270)">
            <rect
              x="67"
              y="-8"
              width="96"
              height="116"
              rx="18"
              fill="var(--color-learning-amber-line)"
              opacity="0.9"
            />
            <g v-for="pair in horizontalPairs" :key="pair.x">
              <line
                :x1="pair.x"
                :x2="pair.x"
                :y1="pair.y1"
                :y2="pair.y2"
                stroke="color-mix(in srgb, var(--color-learning-teal-line) 65%, var(--color-learning-teal))"
                stroke-width="3"
              />
            </g>
            <path
              :d="horizontalHelix(0)"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line))"
              stroke-width="7"
              stroke-linecap="round"
            />
            <path
              :d="horizontalHelix(Math.PI)"
              fill="none"
              stroke="var(--color-learning-teal)"
              stroke-width="7"
              stroke-linecap="round"
            />
          </g>
          <text x="665" y="409" class="label" text-anchor="middle">一条长 DNA 分子的局部</text>
        </g>
        <rect
          x="35"
          y="447"
          width="770"
          height="35"
          rx="12"
          fill="var(--color-learning-blue-soft)"
        />
        <text x="420" y="470" class="summary-label" text-anchor="middle">
          {{
            genomeFocus === 'whole'
              ? '基因组包含全套 DNA：编码部分与非编码部分都要算'
              : '金色区域示意一个基因；一条染色体上通常有许多基因'
          }}
        </text>
      </g>

      <g v-else-if="view === 'structure'">
        <text x="30" y="35" class="section-label">双螺旋的整体</text>
        <text x="354" y="35" class="section-label">放大看一对互补核苷酸</text>
        <g transform="translate(26 54)">
          <g v-for="(rung, index) in verticalPairs" :key="index" :opacity="index === 7 ? 1 : 0.65">
            <line
              :x1="rung.x1"
              x2="140"
              :y1="rung.y"
              :y2="rung.y"
              :stroke="
                index === 7
                  ? 'color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))'
                  : 'color-mix(in srgb, var(--color-learning-blue-line) 65%, var(--color-learning-blue))'
              "
              :stroke-width="index === 7 ? 7 : 4"
            />
            <line
              x1="140"
              :x2="rung.x2"
              :y1="rung.y"
              :y2="rung.y"
              :stroke="
                index === 7
                  ? 'color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))'
                  : 'color-mix(in srgb, var(--color-learning-teal-line) 65%, var(--color-learning-teal))'
              "
              :stroke-width="index === 7 ? 7 : 4"
            />
          </g>
          <path
            :d="verticalHelix(0)"
            fill="none"
            stroke="var(--color-learning-blue)"
            stroke-width="12"
            stroke-linecap="round"
          />
          <path
            :d="verticalHelix(0)"
            fill="none"
            stroke="var(--color-learning-blue-line)"
            stroke-width="3"
            stroke-linecap="round"
          />
          <path
            :d="verticalHelix(Math.PI)"
            fill="none"
            stroke="var(--color-learning-teal)"
            stroke-width="12"
            stroke-linecap="round"
          />
          <path
            :d="verticalHelix(Math.PI)"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-teal-line) 65%, var(--color-learning-teal))"
            stroke-width="3"
            stroke-linecap="round"
          />
          <path
            d="M204 22L169 50"
            fill="none"
            stroke="var(--color-learning-blue)"
            stroke-width="1.5"
          />
          <path
            d="M83 22L111 50"
            fill="none"
            stroke="var(--color-learning-teal)"
            stroke-width="1.5"
          />
          <text x="203" y="17" class="small-label strand-blue">5′</text>
          <text x="74" y="17" class="small-label strand-teal">3′</text>
          <text x="74" y="377" class="small-label strand-teal">5′</text>
          <text x="203" y="377" class="small-label strand-blue">3′</text>
        </g>
        <path d="M191 241L315 168M191 248L315 348" class="zoom-line" />
        <path d="M99 155L36 124" class="leader" />
        <text x="27" y="102" class="small-label">糖—磷酸主链</text>
        <text x="150" y="457" class="small-label" text-anchor="middle">两条链方向相反</text>
        <rect
          x="326"
          y="104"
          width="230"
          height="284"
          rx="28"
          fill="var(--color-learning-blue-soft)"
          stroke="var(--color-learning-blue-line)"
          stroke-width="1.5"
          stroke-dasharray="6 5"
        />
        <text x="441" y="127" class="small-label" text-anchor="middle">一个 DNA 核苷酸</text>
        <path
          d="M365 150L365 216M365 279L365 344M754 150L754 216M754 279L754 344"
          stroke="color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line))"
          stroke-width="4"
        />
        <circle
          cx="365"
          cy="168"
          r="20"
          fill="var(--color-learning-amber-line)"
          stroke="color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber))"
          stroke-width="2"
        />
        <text x="365" y="174" class="base-letter" text-anchor="middle">P</text>
        <circle
          cx="754"
          cy="328"
          r="20"
          fill="var(--color-learning-amber-line)"
          stroke="color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber))"
          stroke-width="2"
        />
        <text x="754" y="334" class="base-letter" text-anchor="middle">P</text>
        <path
          d="M365 214L392 235L382 270L347 270L337 235Z"
          :fill="paint('base')"
          stroke="color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line))"
          stroke-width="2"
        />
        <path
          d="M754 214L782 235L772 270L737 270L726 235Z"
          fill="var(--color-learning-teal-line)"
          stroke="color-mix(in srgb, var(--color-learning-teal) 72%, var(--color-learning-teal-line))"
          stroke-width="2"
        />
        <text x="365" y="247" class="small-label" text-anchor="middle">糖</text>
        <text x="754" y="247" class="small-label" text-anchor="middle">糖</text>
        <path
          d="M391 242H432M698 242H727"
          stroke="color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line))"
          stroke-width="3"
        />
        <path
          d="M432 224L454 211L479 224L479 253L455 267L432 253ZM479 224L501 217L518 240L501 261L479 253Z"
          fill="var(--color-learning-blue-soft)"
          stroke="color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line))"
          stroke-width="2"
        />
        <path
          d="M624 224L649 209L675 224V254L650 269L624 254Z"
          fill="var(--color-learning-teal-soft)"
          stroke="color-mix(in srgb, var(--color-learning-teal) 72%, var(--color-learning-teal-line))"
          stroke-width="2"
        />
        <path
          d="M675 240H698"
          stroke="color-mix(in srgb, var(--color-learning-teal) 72%, var(--color-learning-teal-line))"
          stroke-width="2"
        />
        <text x="468" y="247" class="base-letter" text-anchor="middle">
          {{ pairKind === 'at' ? 'A' : 'G' }}
        </text>
        <text x="650" y="247" class="base-letter" text-anchor="middle">
          {{ pairKind === 'at' ? 'T' : 'C' }}
        </text>
        <path
          v-for="y in pairKind === 'at' ? [232, 250] : [224, 241, 258]"
          :key="y"
          :d="`M525 ${y}H614`"
          stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
          stroke-width="2"
          stroke-dasharray="5 5"
        />
        <path d="M566 260V297" class="leader" />
        <text x="566" y="322" class="small-label" text-anchor="middle">
          {{ pairKind === 'at' ? '2 条虚线示意氢键' : '3 条虚线示意氢键' }}
        </text>
        <path d="M386 168H426" class="leader" />
        <text x="434" y="174" class="small-label">磷酸基团</text>
        <path d="M365 276V300" class="leader" />
        <text x="365" y="325" class="small-label" text-anchor="middle">脱氧核糖</text>
        <text x="468" y="192" class="small-label" text-anchor="middle">
          {{ pairKind === 'at' ? '腺嘌呤' : '鸟嘌呤' }}
        </text>
        <text x="650" y="192" class="small-label" text-anchor="middle">
          {{ pairKind === 'at' ? '胸腺嘧啶' : '胞嘧啶' }}
        </text>
        <text x="562" y="416" class="label" text-anchor="middle">
          一个碱基对，对应两条链上的两个核苷酸
        </text>
        <text x="562" y="451" class="small-label" text-anchor="middle">
          互补的是碱基；两侧各有自己的糖与磷酸
        </text>
      </g>

      <g v-else-if="view === 'synthesis'">
        <path
          d="M35 145C17 83 90 43 179 50L646 48C749 39 813 92 814 194L815 347C814 426 762 462 667 461L161 462C67 469 25 408 26 330Z"
          :fill="paint('cell')"
          stroke="color-mix(in srgb, var(--color-learning-blue-line) 65%, var(--color-learning-blue))"
          stroke-width="3"
        />
        <text x="667" y="432" class="small-label">细胞质</text>
        <g :opacity="synthesisStage === 'transcription' ? 1 : 0.5">
          <ellipse
            cx="178"
            cy="241"
            rx="133"
            ry="148"
            :fill="paint('nucleus')"
            stroke="color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet))"
            stroke-width="4"
          />
          <ellipse
            cx="178"
            cy="241"
            rx="124"
            ry="139"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet))"
            stroke-width="2"
          />
          <path
            d="M69 164l10 7M121 105l4 13M232 109l-4 12M296 180l-12 5M280 332l-11-7M183 387v-12M85 338l9-8"
            stroke="color-mix(in srgb, var(--color-learning-violet) 72%, var(--color-learning-violet-line))"
            stroke-width="4"
          />
          <path
            d="M98 162C117 143 136 156 130 175M220 140C242 158 217 171 240 188M112 324C139 302 155 341 175 328S222 315 237 336"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet))"
            stroke-width="4"
            stroke-linecap="round"
          />
          <text x="178" y="129" class="label" text-anchor="middle">细胞核</text>
          <g transform="translate(76 180) scale(.75)">
            <g v-for="pair in horizontalPairs" :key="pair.x">
              <line
                :x1="pair.x"
                :x2="pair.x"
                :y1="pair.y1"
                :y2="pair.y2"
                stroke="color-mix(in srgb, var(--color-learning-blue-line) 65%, var(--color-learning-blue))"
                stroke-width="3"
              />
            </g>
            <path
              :d="horizontalHelix(0)"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line))"
              stroke-width="7"
            />
            <path
              :d="horizontalHelix(Math.PI)"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-teal) 72%, var(--color-learning-teal-line))"
              stroke-width="7"
            />
          </g>
          <text x="175" y="176" class="small-label" text-anchor="middle">DNA 的相关基因</text>
          <path
            d="M142 260Q165 280 204 273T279 278"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
            stroke-width="4"
          />
          <path
            v-for="x in [156, 171, 186, 201, 216, 231, 246, 261]"
            :key="x"
            :d="`M${x} 274v9`"
            stroke="color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber))"
            stroke-width="3"
          />
          <text x="153" y="308" class="small-label">转录形成 RNA</text>
          <path
            d="M293 264L317 264M294 288L317 288"
            stroke="var(--color-learning-violet-soft)"
            stroke-width="10"
          />
          <path
            d="M294 260L318 262M294 292L318 291"
            stroke="color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet))"
            stroke-width="5"
            stroke-linecap="round"
          />
          <path
            d="M279 278C331 278 344 299 374 300"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
            stroke-width="4"
            :marker-end="paint('arrow')"
          />
          <path d="M309 260L340 223" class="leader" />
          <text x="345" y="216" class="small-label">核孔</text>
        </g>
        <g :opacity="synthesisStage === 'translation' ? 1 : 0.55">
          <path
            d="M431 299C404 275 419 236 449 220C466 182 517 180 550 195C592 182 630 221 618 252C642 267 630 295 611 302Z"
            :fill="paint('protein')"
            stroke="color-mix(in srgb, var(--color-learning-teal) 72%, var(--color-learning-teal-line))"
            stroke-width="2.5"
          />
          <path
            d="M436 315C423 341 451 363 482 359L585 360C611 361 629 338 610 316Z"
            fill="color-mix(in srgb, var(--color-learning-teal-line) 65%, var(--color-learning-teal))"
            stroke="color-mix(in srgb, var(--color-learning-teal) 72%, var(--color-learning-teal-line))"
            stroke-width="2.5"
          />
          <path
            d="M439 257Q460 216 489 225M565 213Q598 217 604 245"
            fill="none"
            stroke="var(--color-learning-teal-soft)"
            stroke-width="5"
            stroke-linecap="round"
          />
          <path
            d="M361 307H699"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
            stroke-width="5"
            stroke-linecap="round"
          />
          <g v-for="(codon, i) in ['AUG', 'GAA', 'UUU', 'CCG', 'UAA']" :key="codon">
            <text :x="385 + i * 62" y="302" class="codon" text-anchor="middle">{{ codon }}</text>
            <path
              :d="`M${366 + i * 62} 317v6h38v-6`"
              fill="none"
              stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
              stroke-width="1.5"
            />
          </g>
          <text x="353" y="291" class="small-label">5′</text>
          <text x="699" y="291" class="small-label">3′</text>
          <text x="656" y="349" class="small-label">mRNA</text>
          <path
            d="M395 393H604"
            stroke="var(--color-learning-blue)"
            stroke-width="2.5"
            :marker-end="paint('arrow')"
          />
          <text x="498" y="421" class="small-label" text-anchor="middle">
            按 5′ → 3′ 方向读取密码子
          </text>
          <path
            d="M516 195V153C501 153 498 141 507 135L494 127C487 117 500 109 508 116L517 129L526 116C535 107 548 118 540 127L528 135C537 142 532 153 521 153"
            fill="var(--color-learning-blue-soft)"
            stroke="color-mix(in srgb, var(--color-learning-blue-line) 65%, var(--color-learning-blue))"
            stroke-width="2"
          />
          <circle
            cx="520"
            cy="105"
            r="11"
            :fill="paint('amino')"
            stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
            stroke-width="1.5"
          />
          <path d="M507 135H476" class="leader" />
          <text x="476" y="123" class="small-label" text-anchor="end">tRNA 携带氨基酸</text>
          <text x="522" y="248" class="label" text-anchor="middle">核糖体</text>
        </g>
        <g :opacity="synthesisStage === 'folding' ? 1 : 0.6">
          <path
            d="M552 192L560 174L592 156L625 139L658 122"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
            stroke-width="4"
          />
          <g v-for="acid in aminoChain" :key="acid.name">
            <circle
              :cx="acid.x"
              :cy="acid.y"
              r="10"
              :fill="paint('amino')"
              stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
              stroke-width="1.5"
            />
            <text :x="acid.x" :y="acid.y - 17" class="small-label" text-anchor="middle">
              {{ acid.name }}
            </text>
          </g>
          <path d="M683 146Q705 158 707 198" class="leader" :marker-end="paint('arrow')" />
          <use :href="'#' + id('folded')" transform="translate(728 249) scale(.9)" />
          <text x="735" y="170" class="small-label" text-anchor="middle">蛋白质的一般</text>
          <text x="735" y="190" class="small-label" text-anchor="middle">折叠过程（示意）</text>
          <text x="725" y="326" class="small-label" text-anchor="middle">一般结构示意</text>
          <text x="638" y="79" class="small-label" text-anchor="middle">
            这段示例的翻译结果：4 个氨基酸
          </text>
        </g>
      </g>

      <g v-else>
        <text x="28" y="32" class="section-label">同一段信息：DNA → mRNA → 多肽</text>
        <text x="28" y="63" class="small-label">{{ mutationData.caption }}</text>
        <text x="28" y="109" class="small-label">DNA 编码链</text>
        <text x="28" y="208" class="small-label">互补模板链</text>
        <path
          d="M78 128H783M78 185H783"
          stroke="color-mix(in srgb, var(--color-learning-blue-line) 65%, var(--color-learning-blue))"
          stroke-width="3.5"
        />
        <text x="51" y="133" class="small-label">5′</text>
        <text x="792" y="133" class="small-label">3′</text>
        <text x="51" y="190" class="small-label">3′</text>
        <text x="792" y="190" class="small-label">5′</text>
        <g
          v-for="(base, i) in mutationData.dna"
          :key="i"
          :transform="`translate(${99 + i * 43} 0)`"
        >
          <rect
            v-if="mutationData.changed.includes(i)"
            x="-18"
            y="116"
            width="36"
            height="81"
            rx="10"
            fill="var(--color-learning-amber-soft)"
            stroke="color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber))"
            stroke-width="1.2"
          />
          <path
            d="M-8 128l8-6 8 6-3 9H-5ZM-8 185l8-6 8 6-3 9H-5Z"
            fill="var(--color-learning-blue-soft)"
            stroke="color-mix(in srgb, var(--color-learning-blue-line) 65%, var(--color-learning-blue))"
            stroke-width="1.2"
          />
          <circle
            cx="20"
            cy="128"
            r="4"
            fill="color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber))"
          />
          <circle
            cx="20"
            cy="185"
            r="4"
            fill="color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber))"
          />
          <path d="M0 138V148M0 165V177" :stroke="baseColor(base)" stroke-width="5" />
          <path
            d="M0 151V162"
            stroke="color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber))"
            stroke-width="1.8"
            stroke-dasharray="2 2"
          />
          <text y="151" :fill="baseColor(base)" class="sequence-base" text-anchor="middle">
            {{ base }}
          </text>
          <text
            y="177"
            :fill="baseColor(complement(base))"
            class="sequence-base"
            text-anchor="middle"
          >
            {{ complement(base) }}
          </text>
        </g>
        <path d="M50 219V253" class="leader" :marker-end="paint('arrow')" />
        <text x="28" y="278" class="small-label">mRNA</text>
        <g
          v-for="(codon, i) in mutationData.codons"
          :key="i"
          :transform="`translate(${99 + i * 129} 0)`"
        >
          <path
            :d="`M-16 295v7h${codon.length * 43 - 10}v-7`"
            fill="none"
            stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
            stroke-width="2"
          />
          <text
            v-for="(base, j) in codon"
            :key="j"
            :x="j * 43"
            y="279"
            class="sequence-base"
            :fill="baseColor(base)"
            text-anchor="middle"
          >
            {{ base }}
          </text>
          <text v-if="codon.length === 3" x="43" y="327" class="small-label" text-anchor="middle">
            {{ codon }}
          </text>
        </g>
        <path d="M50 318V355" class="leader" :marker-end="paint('arrow')" />
        <text x="28" y="382" class="small-label">多肽</text>
        <g
          v-for="(amino, i) in mutationData.amino"
          :key="i"
          :transform="`translate(${142 + i * 129} 390)`"
        >
          <line
            v-if="i > 0 && amino !== '终止'"
            x1="-105"
            x2="-25"
            y1="0"
            y2="0"
            stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
            stroke-width="4"
          />
          <g v-if="amino !== '终止'">
            <circle
              r="27"
              :fill="paint('amino')"
              stroke="color-mix(in srgb, var(--color-learning-amber) 72%, var(--color-learning-amber-line))"
              stroke-width="2"
            />
            <circle cx="-8" cy="-10" r="5" fill="var(--color-learning-amber-soft)" opacity="0.7" />
            <text y="6" class="amino-label" text-anchor="middle">{{ amino }}</text>
          </g>
          <g v-else>
            <path
              d="M-22-9L-9-22H9L22-9V9L9 22H-9L-22 9Z"
              fill="var(--color-learning-amber-soft)"
              stroke="color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber))"
              stroke-width="2"
            />
            <text y="5" class="small-label" text-anchor="middle">终止</text>
          </g>
        </g>
        <text x="420" y="460" class="summary-label" text-anchor="middle">
          {{ mutationData.result }}
        </text>
      </g>
    </svg>

    <template #legend>
      <span v-if="view !== 'mutation'" class="legend-item"
        ><i class="legend-dna" />蓝 / 绿：DNA 两条互补链</span
      >
      <span class="legend-item"><i class="legend-information" />金色：选定信息或氨基酸</span>
      <span v-if="view === 'mutation' || view === 'synthesis'"
        >Met 甲硫氨酸 · Glu 谷氨酸 · Phe 苯丙氨酸 · Pro 脯氨酸</span
      >
      <span v-if="view === 'mutation' && mutation === 'insert'"
        >Arg 精氨酸 · Ile 异亮氨酸 · Ser 丝氨酸 · Val 缬氨酸</span
      >
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
const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const pairKind = ref<'at' | 'gc'>('at')
const synthesisStage = ref<'transcription' | 'translation' | 'folding'>('transcription')
const mutation = ref<'original' | 'silent' | 'missense' | 'stop' | 'insert'>('original')
const genomeFocus = ref<'whole' | 'gene'>('whole')
const pairOptions = [
  { id: 'at', label: 'A 与 T 配对' },
  { id: 'gc', label: 'G 与 C 配对' },
] as const
const synthesisStages = [
  { id: 'transcription', label: '① 转录：信息形成 RNA' },
  { id: 'translation', label: '② 翻译：连接氨基酸' },
  { id: 'folding', label: '③ 折叠：形状与功能' },
] as const
const genomeOptions = [
  { id: 'whole', label: '全套遗传物质' },
  { id: 'gene', label: '看一段基因的位置' },
] as const
const changes = [
  { id: 'original', label: '原序列' },
  { id: 'silent', label: '同义替换' },
  { id: 'missense', label: '氨基酸改变' },
  { id: 'stop', label: '提前终止' },
  { id: 'insert', label: '插入一个碱基' },
] as const
const cellDots = [
  [61, 174],
  [68, 235],
  [71, 272],
  [110, 109],
  [146, 355],
  [242, 344],
  [289, 276],
  [303, 202],
  [216, 100],
  [173, 326],
  [310, 320],
]
const aminoChain = [
  { name: 'Pro', x: 560, y: 174 },
  { name: 'Phe', x: 592, y: 156 },
  { name: 'Glu', x: 625, y: 139 },
  { name: 'Met', x: 658, y: 122 },
]

// 每个考纲叶子使用自己的结构场景，避免同一幅概览图替代全部知识点。
const view = computed(
  () =>
    ({ '150501': 'genome', '150502': 'structure', '150503': 'synthesis', '150504': 'mutation' })[
      props.topic ?? '150501'
    ] ?? 'genome',
)

// 切换知识点时回到该图的起始状态，保留每次讲解清晰的前后顺序。
watch(
  () => props.topic,
  () => {
    pairKind.value = 'at'
    synthesisStage.value = 'transcription'
    mutation.value = 'original'
    genomeFocus.value = 'whole'
  },
)

// 每个 SVG 实例使用独立标识，多个展开知识点的渐变与标记不会互相引用。
function id(name: string) {
  return `${uid}-dna-${name}`
}
function paint(name: string) {
  return `url(#${id(name)})`
}

// 曲线用于表达两条互补链的空间缠绕，不将示意图解释为原子精确模型。
function horizontalHelix(phase: number) {
  return Array.from(
    { length: 61 },
    (_, i) => `${i ? 'L' : 'M'}${i * 4} ${50 + 35 * Math.sin((i * 4 * Math.PI) / 100 + phase)}`,
  ).join(' ')
}
function verticalHelix(phase: number) {
  return Array.from(
    { length: 86 },
    (_, i) =>
      `${i ? 'L' : 'M'}${140 + 67 * Math.sin((i * 4 * Math.PI) / 140 + phase)} ${30 + i * 4}`,
  ).join(' ')
}
const horizontalPairs = Array.from({ length: 16 }, (_, i) => ({
  x: i * 15 + 7,
  y1: 50 + 35 * Math.sin(((i * 15 + 7) * Math.PI) / 100),
  y2: 50 - 35 * Math.sin(((i * 15 + 7) * Math.PI) / 100),
}))
const verticalPairs = Array.from({ length: 16 }, (_, i) => ({
  y: 40 + i * 21,
  x1: 140 + 67 * Math.sin(((10 + i * 21) * Math.PI) / 140),
  x2: 140 - 67 * Math.sin(((10 + i * 21) * Math.PI) / 140),
}))

// DNA 互补与颜色映射直接由碱基决定，突变上下两条链保持一致。
function complement(base: string): string {
  return ({ A: 'T', T: 'A', G: 'C', C: 'G' } as Record<string, string>)[base] ?? base
}
function baseColor(base: string): string {
  return (
    (
      {
        A: 'color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line))',
        T: 'var(--color-learning-amber)',
        U: 'var(--color-learning-amber)',
        G: 'color-mix(in srgb, var(--color-learning-violet) 72%, var(--color-learning-violet-line))',
        C: 'var(--color-learning-teal)',
      } as Record<string, string>
    )[base] ?? 'var(--color-learning-blue)'
  )
}

// 展示的密码子来自真实遗传密码；插入后只翻译当前片段中完整、未遇终止的密码子。
const mutationData = computed(() => {
  const variants = {
    original: {
      dna: 'ATGGAATTTCCGTAA',
      changed: [] as number[],
      caption: '原始编码链：从 ATG 开始，末尾 TAA 对应终止信号。',
      result: '4 个氨基酸；终止信号本身不是一个氨基酸。',
    },
    silent: {
      dna: 'ATGGAGTTTCCGTAA',
      changed: [5],
      caption: '第 6 位 A → G；GAA 与 GAG 都指定谷氨酸。',
      result: 'DNA 已改变，但这里的氨基酸顺序保持不变。',
    },
    missense: {
      dna: 'ATGGTATTTCCGTAA',
      changed: [4],
      caption: '第 5 位 A → T；mRNA 的 GAA 变成 GUA。',
      result: 'Glu → Val；可能影响蛋白质功能，不能仅凭此判断影响大小。',
    },
    stop: {
      dna: 'ATGTAATTTCCGTAA',
      changed: [3],
      caption: '第 4 位 G → T；原来的 GAA 变成终止密码子 UAA。',
      result: '翻译在更早的位置停止；后面的密码子不再继续翻译。',
    },
    insert: {
      dna: 'ATGAGAATTTCCGTAA',
      changed: [3],
      caption: '在第一组之后插入 A；后面的原有碱基重新按三个一组读取。',
      result: '读作 AUG | AGA | AUU | UCC | GUA | A…；末尾不足一组，后续未画出。',
    },
  }
  const chosen = variants[mutation.value]
  const codons = chosen.dna.replaceAll('T', 'U').match(/.{1,3}/g) ?? []
  const dictionary: Record<string, string> = {
    AUG: 'Met',
    GAA: 'Glu',
    GAG: 'Glu',
    GUA: 'Val',
    UUU: 'Phe',
    CCG: 'Pro',
    UAA: '终止',
    AGA: 'Arg',
    AUU: 'Ile',
    UCC: 'Ser',
  }
  const amino: string[] = []
  for (const codon of codons) {
    if (codon.length < 3) break
    const acid = dictionary[codon] ?? '?'
    amino.push(acid)
    if (acid === '终止') break
  }
  return { ...chosen, codons, amino }
})

// 图标题说明当前观察层级，细节边界放在图注中，避免把艺术形态当作实验数据。
const heading = computed(() => {
  const headings = {
    genome: {
      title: '遗传信息放在哪里？从细胞到一段基因',
      subtitle: '同一份 DNA 可以组织成染色体；金色只是其中一段基因的位置。',
      note: '图中是一种真核动物细胞示意，不按比例；局部放大展示一条未复制的核染色体。左侧松散染色质与右侧凝缩形态用于说明组织关系，并非同一时刻的显微照片。',
    },
    structure: {
      title: '双螺旋拆开看：核苷酸与互补配对',
      subtitle: '每一条链都有糖—磷酸主链；两条链用互补碱基相联系。',
      note: '分子几何为教学示意，碱基环形仅帮助区分结构，不是完整化学结构式；省略原子、取代基及精确键角。5′ 与 3′ 表示链方向；虚线数表示 A—T 两个、G—C 三个氢键。',
    },
    synthesis: {
      title: '遗传信息如何成为蛋白质？',
      subtitle: '选择一个阶段，观察信息从细胞核到核糖体，再到折叠后的蛋白质。',
      note: '以真核细胞的核基因为例；各阶段同时展示，并非一个时间点的分子快照。4 个相连小球是本段示例的翻译结果；tRNA 携带的小球单独说明运送过程，不是结果中的第 5 个氨基酸。右侧另举一般蛋白质的折叠示意，不表示这条四肽会形成所画的功能结构；有些蛋白质还需要多条多肽。省略 RNA 加工细节。',
    },
    mutation: {
      title: '改一个位置，沿着序列看后果',
      subtitle: '切换突变类型，比较 DNA、三联体分组与实际读出的氨基酸。',
      note: '原创短序列用于演示遗传密码；不是完整天然基因。DNA 上方为 5′→3′ 编码链，下方为反向互补模板链；mRNA 按 5′→3′ 读取。所有糖磷酸与氢键仅作结构提示，不是原子级模型。',
    },
  }
  return headings[view.value as keyof typeof headings]
})

// 把颜色与交互状态的含义同时提供给屏幕阅读器。
const accessibleDescription = computed(
  () => `${heading.value.title}。${explanation.value.replace(/\*\*|==/g, '')}`,
)

// 解释随图的选择同步变化，强调不能从图形直接推出的结论。
const explanation = computed(() => {
  if (view.value === 'genome')
    return genomeFocus.value === 'whole'
      ? '**“全套”是基因组最重要的限定。** 核内有大量 DNA，线粒体也有自己的 DNA；编码和非编码部分都属于遗传物质。图中只画出部分结构，不能拿图上的线条数当染色体总数。'
      : '**金色区域是一段基因，不是整条染色体。** 染色体展开后可以看到长 DNA；DNA 上通常有许多基因，也有其他序列。复制后每条姐妹染色单体各有一条双链 DNA，不能把姐妹当成双螺旋的两条单链。'
  if (view.value === 'structure')
    return pairKind.value === 'at'
      ? '**A 配 T：两边各自都有糖、磷酸与碱基，合起来是两个核苷酸。** 蓝色虚框只圈出其中一个。双链整体 A 与 T 数量相等，但这一点不能直接套到其中一条单链。'
      : '**G 配 C：配对的两个碱基不同，仍能形成稳定的互补关系。** G—C 有三个氢键，A—T 有两个；ESAT 计数题更关键的是 G=C 与“一对碱基对应两个核苷酸”，不是把氢键数当碱基数。'
  if (view.value === 'synthesis')
    return {
      transcription:
        '**转录复制的是相关信息，DNA 本身不会变成 RNA 或离开核去充当蛋白质原料。** 典型真核细胞的核基因在核内转录，经过所需加工的 mRNA 可通过核孔进入细胞质。',
      translation:
        '**核糖体沿 mRNA 的 5′→3′ 方向读取三个一组的密码子；tRNA 带来相应氨基酸。** 起始 AUG 也指定氨基酸，终止 UAA 则不指定氨基酸。合成顺序是 Met—Glu—Phe—Pro，然后终止；珠链上较早接入的 Met 在远离核糖体的外端，较晚接入的 Pro 靠近出口。',
      folding:
        '**氨基酸的排列顺序影响多肽怎样折叠，三维形状又关系到功能。** 图中球状外形是说明折叠这一过程，不表示所有蛋白质都呈球形；有些功能蛋白质还需要多条链组合。',
    }[synthesisStage.value]
  return {
    original:
      '**先从规定的起点每三个碱基分一组。** DNA 编码链与对应 mRNA 的信息顺序一致，但 RNA 用 U 代替 T。这个片段的四个氨基酸之后是终止信号，不能把终止再算成第五个氨基酸。',
    silent:
      '**突变已经发生，氨基酸却可以不变。** GAA 与 GAG 都编码谷氨酸，因此这次替换不改变图中的氨基酸顺序；这说明 DNA 改变与蛋白质序列改变不是同一个判断。',
    missense:
      '**一个碱基替换，使这里的谷氨酸变成缬氨酸。** 序列长度和后面的三联体分组没有改变。功能影响要看改变发生的位置及蛋白质本身，不能直接断定完全失活。',
    stop: '**新的终止信号会被真正读到，翻译在这里结束。** 图中保留后面的 mRNA 字母，是为了说明它们仍存在，但不再继续加入氨基酸；终止不是一种特殊氨基酸。',
    insert:
      '**插入一个碱基后，后面的原序列需要重新分组。** 金色标出插入的位置；新的密码子读出 Arg、Ile、Ser、Val。最后一个 A 不是完整密码子，后续序列未展示，因此不能从图中断定最终多肽长度。',
  }[mutation.value]
})
</script>

<style scoped>
.dna-illustration {
  min-width: 660px;
}
.section-label {
  fill: var(--color-learning-blue);
  font-size: 17px;
  font-weight: 700;
}
.label {
  fill: var(--color-learning-blue);
  font-size: 15px;
  font-weight: 650;
}
.small-label {
  fill: var(--color-learning-blue);
  font-size: 13px;
}
.strand-blue {
  fill: var(--color-learning-blue);
}
.strand-teal {
  fill: var(--color-learning-teal);
}
.summary-label {
  fill: var(--color-learning-blue);
  font-size: 14px;
  font-weight: 600;
}
.base-letter {
  fill: var(--color-learning-blue);
  font-size: 22px;
  font-weight: 700;
}
.sequence-base {
  font-size: 17px;
  font-weight: 700;
  paint-order: stroke fill;
  stroke: var(--color-surface);
  stroke-width: 4px;
}
.codon {
  fill: var(--color-learning-amber);
  font: 600 14px var(--font-mono);
}
.amino-label {
  fill: var(--color-learning-amber);
  font: 700 13px var(--font-mono);
}
.leader {
  fill: none;
  stroke: color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line));
  stroke-width: 1.6;
}
.zoom-line {
  fill: none;
  stroke: color-mix(in srgb, var(--color-learning-violet-line) 65%, var(--color-learning-violet));
  stroke-width: 1.5;
  stroke-dasharray: 5 5;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.legend-item i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.legend-dna {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-learning-blue) 72%, var(--color-learning-blue-line)) 50%,
    color-mix(in srgb, var(--color-learning-teal) 72%, var(--color-learning-teal-line)) 50%
  );
}
.legend-information {
  background: color-mix(in srgb, var(--color-learning-amber-line) 65%, var(--color-learning-amber));
}
@media (max-width: 760px) {
  .dna-illustration {
    min-width: 650px;
  }
}
</style>
