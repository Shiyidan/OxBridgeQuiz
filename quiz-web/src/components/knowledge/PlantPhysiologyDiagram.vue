<!-- 植物生理原创图谱：以叶片剖面、叶绿体和根茎叶运输结构连接光合作用与水分调节。 -->
<template>
  <BiologyAtlasFrame
    :title="current.title"
    :subtitle="current.subtitle"
    note="原创结构图，不按实物比例；展示常见陆生双子叶植物的代表性结构。箭头表示指定条件下的净移动方向，不代表分子完全停止反向运动。"
  >
    <template #controls>
      <AppButton
        v-for="item in modes"
        :key="item.id"
        type="secondary"
        size="small"
        :aria-pressed="mode === item.id"
        @click="mode = item.id"
        >{{ item.label }}</AppButton
      >
      <template v-if="mode === 'stoma'">
        <AppButton type="secondary" size="small" :aria-pressed="stomaOpen" @click="stomaOpen = true"
          >气孔开放</AppButton
        >
        <AppButton
          type="secondary"
          size="small"
          :aria-pressed="!stomaOpen"
          @click="stomaOpen = false"
          >气孔关闭</AppButton
        >
      </template>
    </template>

    <svg
      class="plant-illustration"
      viewBox="0 0 800 520"
      role="img"
      :aria-label="current.accessible"
    >
      <defs>
        <linearGradient :id="id('leaf-fill')" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" class="stop-surface" />
          <stop offset="0.55" class="stop-teal-soft" />
          <stop offset="1" class="stop-teal-line" />
        </linearGradient>
        <radialGradient :id="id('chloroplast-fill')" cx="34%" cy="25%" r="80%">
          <stop offset="0" class="stop-surface" />
          <stop offset="0.7" class="stop-teal-soft" />
          <stop offset="1" class="stop-teal-line" />
        </radialGradient>
        <linearGradient :id="id('water-fill')" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" class="stop-blue-line" />
          <stop offset="0.35" class="stop-surface" />
          <stop offset="1" class="stop-blue-soft" />
        </linearGradient>
        <linearGradient :id="id('sugar-fill')" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" class="stop-violet-soft" />
          <stop offset="0.5" class="stop-surface" />
          <stop offset="1" class="stop-violet-line" />
        </linearGradient>
        <marker
          :id="id('arrow-blue')"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10Z" class="water-solid" />
        </marker>
        <marker
          :id="id('arrow-violet')"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10Z" class="sugar-solid" />
        </marker>
        <marker
          :id="id('arrow-amber')"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0 0L10 5L0 10Z" class="light-solid" />
        </marker>
        <g :id="id('plastid')">
          <ellipse rx="14" ry="8" :fill="paint('chloroplast-fill')" class="green-outline" />
          <ellipse rx="11" ry="5" class="thin-green" />
          <path d="M-8-3V3M-4-4V4M1-4V4M5-3V3M-9 0H9" class="thin-green" />
        </g>
        <g :id="id('nucleus')">
          <ellipse rx="12" ry="11" class="nucleus" />
          <ellipse cx="3" cy="-2" rx="4" ry="4" class="sugar-solid" />
          <path d="M-7 2Q-1-4 4 5M-7-4Q-1-9 5-6" class="chromatin" />
        </g>
        <g :id="id('mitochondrion')">
          <ellipse rx="15" ry="8" class="mitochondrion" />
          <path d="M-10 0L-6-4L-3 4L1-4L5 4L9 0" class="crista" />
        </g>
      </defs>

      <g v-if="mode === 'leaf'">
        <text x="38" y="34" class="section-title">01 · 从受光面到气孔，看看原料怎样到达叶肉</text>
        <path
          d="M85 55V98M140 55V98M195 55V98"
          class="light-arrow"
          :marker-end="paint('arrow-amber')"
        />
        <text x="228" y="76" class="amber-text">光能</text>
        <path d="M55 116Q150 108 260 114T570 116L570 125Q420 119 260 122T55 125Z" class="cuticle" />
        <rect
          v-for="x in [55, 120, 185, 250, 315, 380, 445, 510]"
          :key="`upper-${x}`"
          :x="x"
          y="125"
          width="64"
          height="35"
          rx="8"
          :fill="paint('leaf-fill')"
          class="green-outline"
        />
        <g
          v-for="(x, i) in [65, 137, 209, 281, 353, 425, 497]"
          :key="`palisade-${x}`"
          :transform="`translate(${x} 167)`"
        >
          <rect width="61" height="113" rx="19" :fill="paint('leaf-fill')" class="cell-wall" />
          <rect x="6" y="6" width="49" height="101" rx="15" class="cell-membrane" />
          <rect x="18" y="23" width="25" height="66" rx="12" class="vacuole" />
          <use :href="`#${id('plastid')}`" transform="translate(13 31) rotate(80) scale(.7)" />
          <use :href="`#${id('plastid')}`" transform="translate(48 37) rotate(90) scale(.7)" />
          <use :href="`#${id('plastid')}`" transform="translate(13 79) rotate(100) scale(.7)" />
          <use :href="`#${id('plastid')}`" transform="translate(46 85) rotate(75) scale(.7)" />
          <use
            :href="`#${id('nucleus')}`"
            :transform="`translate(31 ${i % 2 ? 98 : 14}) scale(.5)`"
          />
        </g>
        <g
          v-for="(point, i) in spongyCells"
          :key="`spongy-${i}`"
          :transform="`translate(${point[0]} ${point[1]}) rotate(${i % 2 ? -12 : 18})`"
        >
          <path
            d="M-30-18Q-3-34 25-21L35-5Q31 24 5 25L-21 16Q-41 5-30-18Z"
            :fill="paint('leaf-fill')"
            class="green-outline"
          />
          <ellipse rx="19" ry="13" class="vacuole" />
          <use :href="`#${id('plastid')}`" transform="translate(-19 -10) scale(.65)" />
          <use :href="`#${id('plastid')}`" transform="translate(20 8) rotate(70) scale(.65)" />
        </g>
        <rect
          v-for="x in [55, 120, 185, 380, 445, 510]"
          :key="`lower-${x}`"
          :x="x"
          y="386"
          width="64"
          height="32"
          rx="8"
          :fill="paint('leaf-fill')"
          class="green-outline"
        />
        <path
          d="M256 390Q285 371 307 392Q295 405 308 417Q279 433 256 412Z M333 392Q355 371 380 390V412Q358 433 331 417Q344 405 333 392Z"
          :fill="paint('leaf-fill')"
          class="green-outline"
        />
        <use :href="`#${id('plastid')}`" transform="translate(278 401) scale(.6)" />
        <use :href="`#${id('plastid')}`" transform="translate(358 401) scale(.6)" />
        <path
          d="M308 458V435Q309 404 318 383V354"
          class="sugar-arrow"
          :marker-end="paint('arrow-violet')"
        />
        <path
          d="M335 350V376Q330 401 333 428V458"
          class="water-arrow"
          :marker-end="paint('arrow-blue')"
        />
        <text x="224" y="481" class="violet-text">CO₂ 进入</text>
        <text x="347" y="481" class="blue-text">水蒸气逸出</text>
        <path
          d="M555 117H600V91H618M555 141H610V145H618M544 217H600V210H618M500 355H600V284H618M366 402H600V364H618"
          class="leader"
        />
        <text x="626" y="96" class="label">角质层</text>
        <text x="626" y="150" class="label">上表皮</text>
        <text x="626" y="210" class="label">栅栏叶肉</text>
        <text x="626" y="230" class="small-label">含许多叶绿体</text>
        <text x="626" y="285" class="label">海绵叶肉间气腔</text>
        <text x="626" y="305" class="small-label">为气体扩散留出空间</text>
        <text x="626" y="367" class="label">保卫细胞与气孔</text>
        <text x="626" y="387" class="small-label">调节交换，也影响失水</text>
      </g>

      <g v-else-if="mode === 'chloroplast'">
        <text x="38" y="34" class="section-title">02 · 放大一枚叶绿体，看光能与有机物的关系</text>
        <ellipse
          cx="388"
          cy="264"
          rx="259"
          ry="137"
          :fill="paint('chloroplast-fill')"
          class="cell-wall"
        />
        <ellipse cx="388" cy="264" rx="246" ry="124" class="thin-green" />
        <path
          d="M228 262Q310 281 388 264T548 259M228 280Q305 303 391 287T546 280"
          class="lamella"
        />
        <g
          v-for="(x, i) in [230, 334, 438, 542]"
          :key="x"
          :transform="`translate(${x} ${228 + (i % 2) * 16})`"
        >
          <g v-for="y in [0, 12, 24, 36, 48]" :key="y">
            <path
              :d="`M-29 ${y}V${y + 7}C-29 ${y + 15}29 ${y + 15}29 ${y + 7}V${y}Z`"
              class="thylakoid-side"
            />
            <ellipse :cy="y" rx="29" ry="8" class="thylakoid" />
          </g>
        </g>
        <ellipse cx="325" cy="335" rx="28" ry="17" class="starch" />
        <ellipse cx="484" cy="194" rx="22" ry="12" class="starch" />
        <path
          d="M214 74L241 110L229 114L251 167M272 74L294 112L283 115L308 173"
          class="light-arrow"
          :marker-end="paint('arrow-amber')"
        />
        <text x="190" y="62" class="amber-text">光 · 由叶绿素吸收</text>
        <path d="M85 247H149M85 291H149" class="sugar-arrow" :marker-end="paint('arrow-violet')" />
        <text x="40" y="224" class="label">CO₂ + 水</text>
        <path
          d="M638 246H713M638 290H713"
          class="sugar-arrow"
          :marker-end="paint('arrow-violet')"
        />
        <text x="654" y="223" class="label">糖 + O₂</text>
        <path
          d="M591 189L647 131H722M438 279V424H495M329 308L271 422H177M149 222L95 174H38"
          class="leader"
        />
        <text x="625" y="117" class="label">双层包膜</text>
        <text x="506" y="428" class="label">类囊体堆叠成基粒</text>
        <text x="65" y="430" class="label">基质</text>
        <text x="38" y="161" class="label">外膜、内膜</text>
        <text x="400" y="478" text-anchor="middle" class="footer-text">
          吸收光能 → 转为有机物中的化学能；这不是呼吸放能
        </text>
      </g>

      <g v-else-if="mode === 'plant'">
        <text x="38" y="34" class="section-title">01 · 同一株植物，两套运输组织</text>
        <path d="M70 367Q155 350 240 366T440 368T739 367" class="soil-line" />
        <path
          d="M353 369Q329 412 286 448M353 369Q365 416 416 459M354 396Q346 451 357 490M325 415Q292 416 266 404M330 420Q307 453 283 464M382 431Q418 428 444 441M355 453L329 481"
          class="roots"
        />
        <path d="M351 372Q352 273 350 208T358 99" class="stem-wall" />
        <path d="M348 368V200Q349 151 356 112" class="xylem-path" />
        <path d="M360 366V208Q363 160 369 127" class="phloem-path" />
        <path
          d="M350 221Q292 150 152 161Q187 263 350 221Z"
          :fill="paint('leaf-fill')"
          class="cell-wall"
        />
        <path
          d="M346 218Q252 200 162 168M248 199L207 174M278 206L242 170M302 211L287 180M263 204L223 225M302 214L271 235"
          class="leaf-veins"
        />
        <path
          d="M359 272Q424 195 564 199Q522 298 359 272Z"
          :fill="paint('leaf-fill')"
          class="cell-wall"
        />
        <path
          d="M364 270Q453 236 556 206M446 242L470 219M421 252L430 224M443 243L480 268M479 230L514 246"
          class="leaf-veins"
        />
        <path
          d="M359 115Q318 94 336 61Q365 67 359 115Z M363 115Q393 87 380 63Q359 75 363 115Z"
          :fill="paint('leaf-fill')"
          class="green-outline"
        />
        <path
          d="M346 340V244Q300 212 225 192"
          class="water-arrow"
          :marker-end="paint('arrow-blue')"
        />
        <path d="M351 253V134" class="water-arrow" :marker-end="paint('arrow-blue')" />
        <path
          d="M364 324V278Q439 255 511 223"
          class="water-arrow"
          :marker-end="paint('arrow-blue')"
        />
        <path
          d="M236 217Q308 242 369 237V351"
          class="sugar-arrow"
          :marker-end="paint('arrow-violet')"
        />
        <path
          d="M280 212Q338 235 372 198V128"
          class="sugar-arrow"
          :marker-end="paint('arrow-violet')"
        />
        <path
          d="M203 147Q193 119 211 100M231 146Q221 116 241 96"
          class="water-arrow"
          :marker-end="paint('arrow-blue')"
        />
        <text x="86" y="86" class="blue-text">水蒸气经气孔逸出</text>
        <path d="M213 241L167 277H61M379 81H472M376 337H530M401 449H543" class="leader" />
        <text x="60" y="299" class="label">成熟叶：糖的源</text>
        <text x="481" y="86" class="label">生长芽：糖的库</text>
        <text x="543" y="335" class="label">蓝：木质部 · 水、矿物离子</text>
        <text x="543" y="357" class="label">紫：韧皮部 · 可溶性糖</text>
        <text x="552" y="452" class="label">根：此时是糖的库</text>
        <path
          d="M222 409L294 425M460 401L408 421"
          class="water-arrow"
          :marker-end="paint('arrow-blue')"
        />
        <text x="63" y="396" class="blue-text">土壤水与矿物离子</text>
        <text x="402" y="498" text-anchor="middle" class="footer-text">
          不同筛管可向不同方向转运；源与库会随生长阶段改变
        </text>
      </g>

      <g v-else-if="mode === 'vessels'">
        <text x="38" y="34" class="section-title">02 · 结构特征，解释为什么能承担不同运输</text>
        <text x="219" y="78" text-anchor="middle" class="blue-text">木质部导管 · 成熟时死亡</text>
        <text x="579" y="78" text-anchor="middle" class="violet-text">
          筛管分子 + 伴胞 · 活细胞
        </text>
        <path
          d="M165 112Q218 93 271 112V405Q218 423 165 405Z"
          :fill="paint('water-fill')"
          class="xylem-wall"
        />
        <ellipse cx="218" cy="112" rx="53" ry="15" class="open-lumen" />
        <path
          v-for="y in [141, 173, 205, 237, 269, 301, 333, 365]"
          :key="y"
          :d="`M165 ${y}Q218 ${y + 27}271 ${y}`"
          class="lignin-ring"
        />
        <ellipse
          v-for="y in [157, 221, 285, 349]"
          :key="`pit-${y}`"
          cx="270"
          :cy="y"
          rx="4"
          ry="7"
          class="pit"
        />
        <path d="M216 378V151" class="water-arrow" :marker-end="paint('arrow-blue')" />
        <text x="218" y="447" text-anchor="middle" class="label">连续空腔，阻力较小</text>
        <path d="M166 205H118V185H43M271 285H319V315H355" class="leader" />
        <text x="38" y="167" class="label">木质化</text>
        <text x="38" y="188" class="label">加厚管壁</text>
        <text x="320" y="337" class="label">纹孔</text>
        <g v-for="y in [112, 210, 308]" :key="`sieve-${y}`">
          <rect
            x="470"
            :y="y"
            width="105"
            height="98"
            rx="10"
            :fill="paint('sugar-fill')"
            class="phloem-wall"
          />
          <path :d="`M477 ${y}V${y + 98}M568 ${y}V${y + 98}`" class="phloem-membrane" />
          <path :d="`M478 ${y + 98}H568`" class="sieve-plate" />
          <circle
            v-for="x in [488, 507, 526, 545, 560]"
            :key="x"
            :cx="x"
            :cy="y + 98"
            r="3"
            class="sieve-pore"
          />
        </g>
        <rect
          x="603"
          y="119"
          width="74"
          height="281"
          rx="24"
          :fill="paint('leaf-fill')"
          class="green-outline"
        />
        <rect x="609" y="125" width="62" height="269" rx="21" class="cell-membrane" />
        <use :href="`#${id('nucleus')}`" transform="translate(640 175) scale(1.5)" />
        <use
          v-for="y in [225, 266, 307, 353]"
          :key="y"
          :href="`#${id('mitochondrion')}`"
          :transform="`translate(640 ${y}) rotate(${y % 2 ? 15 : -20})`"
        />
        <path d="M576 155H604M576 250H604M576 347H604" class="cell-connections" />
        <path d="M522 151V368" class="sugar-arrow" :marker-end="paint('arrow-violet')" />
        <path d="M566 210H714V196H756M660 175H718V145H757M650 352H719V370H758" class="leader" />
        <text x="705" y="131" class="label">伴胞细胞核</text>
        <text x="711" y="219" class="label">筛板</text>
        <text x="705" y="392" class="label">线粒体</text>
        <text x="578" y="447" text-anchor="middle" class="label">筛管少细胞器，伴胞支持代谢</text>
        <text x="400" y="491" text-anchor="middle" class="footer-text">
          紫色箭头只示一条筛管的源 → 库方向；不代表所有筛管都向下
        </text>
      </g>

      <g v-else-if="mode === 'root'">
        <text x="38" y="34" class="section-title">03 · 根毛是细胞的延伸，增加与土壤接触的面积</text>
        <path
          d="M375 100H701Q730 100 730 129V391Q730 420 701 420H377Q352 420 352 392V292Q317 280 270 288L116 309Q72 312 64 289Q60 269 92 260L274 238Q325 231 352 220V131Q352 100 375 100Z"
          :fill="paint('leaf-fill')"
          class="cell-wall"
        />
        <path
          d="M381 110H696Q720 110 720 133V387Q720 410 696 410H382Q362 410 362 389V285Q317 270 267 279L117 300Q84 302 76 288Q72 278 96 270L275 247Q330 242 362 227V135Q362 110 381 110Z"
          class="cell-membrane"
        />
        <path
          d="M412 144H655Q690 144 690 179V348Q690 382 655 382H414Q389 382 389 352V184Q389 144 412 144Z"
          class="vacuole"
        />
        <use :href="`#${id('nucleus')}`" transform="translate(610 396)" />
        <use :href="`#${id('mitochondrion')}`" transform="translate(381 177) rotate(80)" />
        <use :href="`#${id('mitochondrion')}`" transform="translate(471 397)" />
        <use :href="`#${id('mitochondrion')}`" transform="translate(709 243) rotate(90)" />
        <path
          d="M96 191L146 267M230 347L249 270"
          class="water-arrow"
          :marker-end="paint('arrow-blue')"
        />
        <path d="M225 183L246 269" class="sugar-arrow" :marker-end="paint('arrow-violet')" />
        <rect
          x="231"
          y="238"
          width="23"
          height="18"
          rx="7"
          class="membrane-protein"
          transform="rotate(-7 243 247)"
        />
        <circle
          v-for="point in [
            [77, 177],
            [127, 200],
            [250, 363],
            [282, 347],
          ]"
          :key="point.join('-')"
          :cx="point[0]"
          :cy="point[1]"
          r="7"
          class="water-drop"
        />
        <path d="M210 164L216 154L227 154L233 164L227 174L216 174Z" class="sugar-solid" />
        <path d="M109 244L101 222H48M353 136H316V104H181M562 363V451H617" class="leader" />
        <text x="39" y="213" class="label">根毛</text>
        <text x="103" y="92" class="label">外侧细胞壁 · 内侧细胞膜</text>
        <text x="618" y="456" class="label">含细胞液的液泡</text>
        <text x="72" y="150" class="blue-text">水：渗透</text>
        <text x="195" y="139" class="violet-text">矿物离子：可主动吸收</text>
        <text x="81" y="394" class="small-label">土壤水势较高</text>
        <text x="441" y="273" class="label">根毛内水势较低</text>
        <text x="400" y="495" text-anchor="middle" class="footer-text">
          图中忽略膜电势差；水顺水势差净进入，逆浓度梯度吸收离子需能量
        </text>
      </g>

      <g v-else>
        <text x="38" y="34" class="section-title">04 · 保卫细胞膨压改变，调节气孔孔隙</text>
        <path
          d="M62 130Q128 87 205 117T350 110T500 123T736 123V411Q647 443 550 418T368 428T194 416T62 418Z"
          :fill="paint('leaf-fill')"
          class="green-outline"
        />
        <path
          d="M91 120Q148 181 109 244T110 417M215 117Q255 167 225 213M528 118Q556 171 581 223M697 119Q644 180 687 251T695 419M122 250L184 265M600 257L680 255M211 371L184 420M555 373L573 421"
          class="epidermal-boundary"
        />
        <g>
          <path
            :d="
              stomaOpen
                ? 'M349 147C263 135 205 200 212 279C218 351 277 397 350 379C311 342 291 307 291 264C291 218 312 180 349 147Z'
                : 'M367 147C281 135 223 200 230 279C236 351 295 397 368 379C364 342 363 307 363 264C363 218 364 180 367 147Z'
            "
            :fill="paint('chloroplast-fill')"
            class="cell-wall"
          />
          <path
            :d="
              stomaOpen
                ? 'M317 165C293 169 266 191 256 220L254 239C264 242 267 250 267 260C267 270 264 278 254 281L256 307C265 334 289 355 317 368C298 334 289 303 289 264C289 225 300 190 317 165Z'
                : 'M330 190C294 190 277 222 277 246C277 269 285 298 302 328L329 346C342 299 343 243 330 190Z'
            "
            :transform="stomaOpen ? undefined : 'translate(61.4 53.6) scale(.8)'"
            class="vacuole"
          />
          <path
            :d="
              stomaOpen
                ? 'M349 147C312 180 291 218 291 264C291 307 311 342 350 379'
                : 'M367 147C364 180 363 218 363 264C363 307 364 342 368 379'
            "
            class="guard-inner-wall"
          />
          <use
            v-for="point in [
              [260, 185],
              [241, 227],
              [239, 287],
              [259, 336],
              [290, 363],
            ]"
            :key="point.join('-')"
            :href="`#${id('plastid')}`"
            :transform="`translate(${point[0]! + (stomaOpen ? 0 : point[1] === 185 ? 21 : 14)} ${point[1]}) rotate(55)`"
          />
          <use :href="`#${id('nucleus')}`" :transform="`translate(${stomaOpen ? 232 : 250} 260)`" />
        </g>
        <g>
          <path
            :d="
              stomaOpen
                ? 'M391 147C477 135 535 200 528 279C522 351 463 397 390 379C429 342 449 307 449 264C449 218 428 180 391 147Z'
                : 'M373 147C459 135 517 200 510 279C504 351 445 397 372 379C376 342 377 307 377 264C377 218 376 180 373 147Z'
            "
            :fill="paint('chloroplast-fill')"
            class="cell-wall"
          />
          <path
            :d="
              stomaOpen
                ? 'M317 165C293 169 266 191 256 220L254 239C264 242 267 250 267 260C267 270 264 278 254 281L256 307C265 334 289 355 317 368C298 334 289 303 289 264C289 225 300 190 317 165Z'
                : 'M330 190C294 190 277 222 277 246C277 269 285 298 302 328L329 346C342 299 343 243 330 190Z'
            "
            :transform="
              stomaOpen
                ? 'translate(740 0) scale(-1 1)'
                : 'translate(740 0) scale(-1 1) translate(61.4 53.6) scale(.8)'
            "
            class="vacuole"
          />
          <path
            :d="
              stomaOpen
                ? 'M391 147C428 180 449 218 449 264C449 307 429 342 390 379'
                : 'M373 147C376 180 377 218 377 264C377 307 376 342 372 379'
            "
            class="guard-inner-wall"
          />
          <use
            v-for="point in [
              [480, 185],
              [499, 227],
              [501, 287],
              [481, 336],
              [450, 363],
            ]"
            :key="point.join('-')"
            :href="`#${id('plastid')}`"
            :transform="`translate(${point[0]! - (stomaOpen ? 0 : point[1] === 185 ? 21 : 14)} ${point[1]}) rotate(-55)`"
          />
          <use :href="`#${id('nucleus')}`" :transform="`translate(${stomaOpen ? 508 : 490} 260)`" />
        </g>
        <path
          :d="
            stomaOpen
              ? 'M349 147C312 180 291 218 291 264C291 307 311 342 350 379L390 379C429 342 449 307 449 264C449 218 428 180 391 147Z'
              : 'M367 147C364 180 363 218 363 264C363 307 364 342 368 379L372 379C376 342 377 307 377 264C377 218 376 180 373 147Z'
          "
          class="stomatal-pore"
        />
        <g v-if="stomaOpen">
          <path d="M359 93V191" class="sugar-arrow" :marker-end="paint('arrow-violet')" />
          <path d="M385 195V93" class="water-arrow" :marker-end="paint('arrow-blue')" />
          <text x="238" y="77" class="violet-text">CO₂ 进入</text>
          <text x="397" y="77" class="blue-text">水蒸气逸出</text>
        </g>
        <text v-else x="370" y="81" text-anchor="middle" class="amber-text">
          关闭可减少失水，也限制 CO₂ 进入
        </text>
        <path
          :d="`M${stomaOpen ? 480 : 459} 185H580V169H622M${stomaOpen ? 508 : 490} 260H620M370 350V457H471M277 360L226 454H101`"
          class="leader"
        />
        <text x="631" y="172" class="label">叶绿体</text>
        <text x="630" y="265" class="label">细胞核</text>
        <text x="480" y="462" class="label">{{ stomaOpen ? '开放的孔隙' : '孔隙显著缩小' }}</text>
        <text x="43" y="457" class="label">保卫细胞</text>
        <text x="400" y="499" text-anchor="middle" class="footer-text">
          {{
            stomaOpen
              ? '膨压较高，细胞弯曲使孔隙开放；气体箭头对应叶片净光合条件'
              : '失水使膨压降低、孔隙缩小；图示状态不表示所有植物只在夜间关闭气孔'
          }}
        </text>
      </g>
    </svg>

    <template #legend>
      <span><i class="legend-dot green-dot" />植物细胞与叶绿体</span>
      <span><i class="legend-dot blue-dot" />水或水蒸气路径</span>
      <span><i class="legend-dot violet-dot" />碳源／糖／指定溶质</span>
      <span><i class="legend-dot amber-dot" />光能或线粒体</span>
    </template>
    <template #explanation>
      <h6>{{ current.heading }}</h6>
      <p><KnowledgeText :text="explanation" /></p>
    </template>
  </BiologyAtlasFrame>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppButton from '../AppButton.vue'
import BiologyAtlasFrame from './BiologyAtlasFrame.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic?: string }>()
type PlantMode = 'leaf' | 'chloroplast' | 'plant' | 'vessels' | 'root' | 'stoma'
const uid = useId().replace(/:/g, '')
const mode = ref<PlantMode>(props.topic === '151102' ? 'plant' : 'leaf')
const stomaOpen = ref(true)
const spongyCells = [
  [92, 318],
  [176, 343],
  [260, 315],
  [372, 323],
  [455, 352],
  [538, 318],
]

// 同一页面可能展开多个知识点，独立的标识防止不同 SVG 的填色与箭头互相覆盖。
function id(name: string): string {
  return `plant-${uid}-${name}`
}
// SVG 的引用统一绑定当前实例的结构定义。
function paint(name: string): string {
  return `url(#${id(name)})`
}

// 每个考纲知识点只展示与本节对应的图谱入口。
const modes = computed<Array<{ id: PlantMode; label: string }>>(() =>
  props.topic === '151102'
    ? [
        { id: 'plant', label: '根、茎、叶的运输' },
        { id: 'vessels', label: '木质部与韧皮部' },
        { id: 'root', label: '放大根毛细胞' },
        { id: 'stoma', label: '气孔开合' },
      ]
    : [
        { id: 'leaf', label: '叶片剖面' },
        { id: 'chloroplast', label: '放大叶绿体' },
      ],
)

const descriptions = {
  leaf: {
    title: '叶片中的光合作用',
    subtitle: '从完整叶片组织，找到受光、气体交换与原料供应的关系。',
    accessible: '叶片剖面，包括角质层、表皮、含叶绿体的栅栏叶肉、海绵叶肉气腔以及保卫细胞和气孔。',
    heading: '叶片每一层，都与它的工作有关',
    text: '**栅栏叶肉有许多叶绿体，海绵叶肉之间的气腔有利于气体扩散**。图中光合作用超过呼吸时，二氧化碳经气孔净进入，随后扩散到叶肉细胞；水从湿润细胞壁表面蒸发后经气孔离开。气孔主要位于下表皮是许多陆生植物的常见情况，不能推广为所有植物都相同。',
  },
  chloroplast: {
    title: '叶绿体内部的膜结构',
    subtitle: '细看包膜与类囊体；记住光合作用怎样吸收并储存能量。',
    accessible:
      '叶绿体具有双层包膜，内部有基质、相连的类囊体及堆叠成的基粒；光能、二氧化碳和水支持有机物形成。',
    heading: '光是能量来源，二氧化碳和水是原料',
    text: '叶绿素位于类囊体膜中，能够吸收光能。**光合作用把光能转为有机物中的化学能**；包膜内不同区域分工合作。图中原料和产物箭头表达总体反应，不表示每一步都发生在同一处，也不要求把反应理解成葡萄糖在一次反应中直接生成。',
  },
  plant: {
    title: '从根到叶，再从源到库',
    subtitle: '两套组织同时工作；仔细看它们各自运什么、往哪里运。',
    accessible:
      '整株植物的根、茎、叶和生长芽；蓝色木质部运水向上，紫色韧皮部从成熟叶分别到根和生长芽。',
    heading: '运输方向，要跟着物质与需求判断',
    text: '**水和矿物离子主要经木质部从根向叶运输；糖经韧皮部从源到库转运**。这里成熟叶提供糖，根与生长芽使用糖，因此不同筛管中的运输方向可以相反。春季储藏根释放糖时，根也能成为源。',
  },
  vessels: {
    title: '把两类运输组织并排看',
    subtitle: '木质部的空腔与加厚管壁，韧皮部的筛板与伴胞，各有用途。',
    accessible:
      '左侧木质部导管具有空腔、木质化环纹和纹孔；右侧韧皮部有相接筛管、筛板与含核和线粒体的伴胞。',
    heading: '不能只凭“有没有细胞核”判断死活',
    text: '成熟木质部导管已经死亡，空腔让水较容易通过，**木质化管壁抵抗拉力造成的塌陷**。成熟筛管分子仍存活，通常不保留细胞核；相邻伴胞有核和较多线粒体，支持其代谢。筛板上的孔让汁液通过。图中的环状加厚只是木质化管壁的一种形式。',
  },
  root: {
    title: '根毛：一整个细胞的长延伸',
    subtitle: '细胞壁、膜、细胞质与液泡保留连续关系，水和离子的进入机制分别判断。',
    accessible:
      '根毛细胞具有延长的细胞壁和细胞膜、大液泡、细胞核与线粒体；蓝箭头表示水渗透进入，紫箭头表示矿物离子的膜运输。',
    heading: '增加面积，不等于改变运输原理',
    text: '根毛的延伸增大吸收面积。**土壤水势较高时，水经选择透过膜渗透进入**。本图忽略膜两侧电势差，只比较浓度；在这一模型中，逆浓度梯度吸收矿物离子需要膜运输蛋白和能量。普通地下根毛通常没有叶绿体，仍能用呼吸提供能量。图中省略土壤颗粒，以便看清细胞边界和运输路径。',
  },
  stoma: {
    title: '气孔：气体交换与保水之间的调节',
    subtitle: '切换开合状态，对照保卫细胞和孔隙的变化。',
    accessible: '两枚含叶绿体、细胞核和液泡的肾形保卫细胞围绕气孔，展示膨压变化与开放或关闭状态。',
    heading: '开孔带来二氧化碳，也带来失水',
    text: '',
  },
} as const

// 当前图与其说明同时切换，避免图像显示一种机制而正文仍解释另一种。
const current = computed(() => descriptions[mode.value])
// 开合状态的解释补足相应条件，不把气孔关闭错误等同于夜间必然发生的唯一状态。
const explanation = computed(() =>
  mode.value !== 'stoma'
    ? current.value.text
    : stomaOpen.value
      ? '**保卫细胞吸水、膨压增加时，典型气孔会开放**。图中的蓝箭头表示水蒸气逸出，紫箭头对应光合作用超过呼吸时的二氧化碳净进入。气体方向还取决于内外浓度，不能只凭气孔开放就认定净光合一定为正。'
      : '**保卫细胞失水、膨压降低时，孔隙变小，可减少蒸腾**。干旱或强烈水分胁迫下，白天也可能关闭。节水的同时二氧化碳进入受限，光合作用可能降低；形状变化为便于比较作了夸张处理。',
)

// 考纲选项改变时回到该知识点的总览，避免沿用另一知识点的局部结构。
watch(
  () => props.topic,
  () => {
    mode.value = props.topic === '151102' ? 'plant' : 'leaf'
    stomaOpen.value = true
  },
)
</script>

<style scoped>
.plant-illustration {
  min-width: 650px;
  color: var(--color-ink);
}
.section-title {
  fill: var(--color-learning-teal);
  font-size: 17px;
  font-weight: 700;
}
.label {
  fill: var(--color-ink);
  font-size: 14px;
}
.small-label {
  fill: var(--color-ink-soft);
  font-size: 12px;
}
.footer-text {
  fill: var(--color-ink-soft);
  font-size: 13px;
}
.blue-text,
.violet-text,
.amber-text {
  font-size: 14px;
  font-weight: 700;
}
.blue-text {
  fill: var(--color-learning-blue);
}
.violet-text {
  fill: var(--color-learning-violet);
}
.amber-text {
  fill: var(--color-learning-amber);
}
.stop-surface {
  stop-color: var(--color-surface);
}
.stop-teal-soft {
  stop-color: var(--color-learning-teal-soft);
}
.stop-teal-line {
  stop-color: var(--color-learning-teal-line);
}
.stop-blue-line {
  stop-color: var(--color-learning-blue-line);
}
.stop-blue-soft {
  stop-color: var(--color-learning-blue-soft);
}
.stop-violet-line {
  stop-color: var(--color-learning-violet-line);
}
.stop-violet-soft {
  stop-color: var(--color-learning-violet-soft);
}
.green-outline,
.cell-wall {
  stroke: var(--color-learning-teal);
  stroke-width: 2;
}
.cell-wall {
  stroke-width: 3;
}
.cell-membrane,
.thin-green,
.lamella {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1.2;
}
.cell-membrane {
  stroke: var(--color-learning-blue);
}
.vacuole {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue-line);
  stroke-width: 1.5;
}
.nucleus {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet);
  stroke-width: 1.3;
}
.chromatin {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 1;
}
.mitochondrion {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 1.3;
}
.crista {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 1.2;
}
.leader {
  fill: none;
  stroke: var(--color-ink-soft);
  stroke-width: 1.2;
}
.cuticle {
  fill: var(--color-learning-amber-line);
  stroke: var(--color-learning-amber);
  stroke-width: 1;
}
.water-arrow,
.sugar-arrow,
.light-arrow {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.water-arrow {
  stroke: var(--color-learning-blue);
}
.sugar-arrow {
  stroke: var(--color-learning-violet);
}
.light-arrow {
  stroke: var(--color-learning-amber);
}
.water-solid {
  fill: var(--color-learning-blue);
}
.sugar-solid {
  fill: var(--color-learning-violet);
}
.light-solid {
  fill: var(--color-learning-amber);
}
.thylakoid {
  fill: var(--color-learning-teal-soft);
  stroke: var(--color-learning-teal);
  stroke-width: 1.3;
}
.thylakoid-side {
  fill: var(--color-learning-teal-line);
  stroke: var(--color-learning-teal);
  stroke-width: 1;
}
.lamella {
  stroke-width: 3;
}
.starch {
  fill: var(--color-surface);
  stroke: var(--color-learning-teal-line);
  stroke-width: 2;
}
.soil-line {
  fill: none;
  stroke: var(--color-learning-amber-line);
  stroke-width: 3;
}
.roots {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 5;
  stroke-linecap: round;
}
.stem-wall {
  fill: none;
  stroke: var(--color-learning-teal-line);
  stroke-width: 29;
  stroke-linecap: round;
}
.xylem-path {
  fill: none;
  stroke: var(--color-learning-blue-line);
  stroke-width: 8;
}
.phloem-path {
  fill: none;
  stroke: var(--color-learning-violet-line);
  stroke-width: 7;
}
.leaf-veins {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1.4;
}
.xylem-wall {
  stroke: var(--color-learning-amber);
  stroke-width: 6;
}
.open-lumen {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 5;
}
.lignin-ring {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 7;
}
.pit {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 1.3;
}
.phloem-wall {
  stroke: var(--color-learning-violet);
  stroke-width: 2;
}
.phloem-membrane {
  fill: none;
  stroke: var(--color-learning-violet-line);
  stroke-width: 1;
}
.sieve-plate {
  stroke: var(--color-learning-violet-line);
  stroke-width: 11;
}
.sieve-pore {
  fill: var(--color-surface);
}
.cell-connections {
  stroke: var(--color-learning-teal);
  stroke-width: 3;
}
.water-drop {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue);
  stroke-width: 1.7;
}
.membrane-protein {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet);
  stroke-width: 1.5;
}
.epidermal-boundary {
  fill: none;
  stroke: var(--color-learning-teal-line);
  stroke-width: 2;
}
.guard-inner-wall {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 6;
}
.stomatal-pore {
  fill: var(--color-surface);
  stroke: var(--color-learning-teal-line);
  stroke-width: 1;
}
.legend-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  margin-right: 5px;
  border-radius: 50%;
}
.green-dot {
  background: var(--color-learning-teal);
}
.blue-dot {
  background: var(--color-learning-blue);
}
.violet-dot {
  background: var(--color-learning-violet);
}
.amber-dot {
  background: var(--color-learning-amber);
}
@media (max-width: 760px) {
  .plant-illustration {
    min-width: 610px;
  }
}
</style>
