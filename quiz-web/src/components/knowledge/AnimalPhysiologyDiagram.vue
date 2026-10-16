<!-- 动物生理学精细互动图谱：按考纲知识点切换器官、细胞机制与调节阶段。 -->
<template>
  <BiologyAtlasFrame
    :title="current.title"
    :subtitle="current.subtitle"
    note="原创结构与机制图。比例、细胞数量和时间均为教学示意；颜色用于区分结构，不代表真实组织颜色。点击编号或下方结构名称查看说明。"
  >
    <template #controls>
      <AppButton
        v-for="item in modes"
        :key="item.id"
        type="secondary"
        size="small"
        :aria-pressed="selectedMode === item.id"
        @click="selectMode(item.id)"
        >{{ item.label }}</AppButton
      >
    </template>

    <svg class="physiology-plate" viewBox="0 0 760 450" role="group" :aria-label="current.title">
      <defs>
        <radialGradient :id="id('tissue')" cx="34%" cy="28%" r="80%">
          <stop offset="0" class="stop-surface" />
          <stop offset="1" class="stop-blue" />
        </radialGradient>
        <radialGradient :id="id('warm')" cx="30%" cy="24%" r="85%">
          <stop offset="0" class="stop-amber-soft" />
          <stop offset="1" class="stop-amber" />
        </radialGradient>
        <radialGradient :id="id('organ')" cx="40%" cy="22%" r="80%">
          <stop offset="0" class="stop-violet-soft" />
          <stop offset="1" class="stop-violet" />
        </radialGradient>
        <linearGradient :id="id('green')" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" class="stop-teal-soft" />
          <stop offset="1" class="stop-teal" />
        </linearGradient>
        <pattern :id="id('mesh')" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 20L20 0M-5 5L5-5M15 25L25 15" class="mesh-line" />
        </pattern>
        <marker
          :id="id('arrow')"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M1 1L9 5L1 9Z" fill="context-stroke" />
        </marker>
        <g :id="id('rbc')">
          <ellipse rx="14" ry="9" class="warm-outline" :fill="paint('warm')" />
          <ellipse rx="7" ry="4" class="red-cell-centre" />
        </g>
        <g :id="id('antibody')">
          <path d="M0 14V0L-10-11M0 0L10-11M-4 13V2L-14-8M4 13V2L14-8" class="antibody-line" />
        </g>
        <g :id="id('mitochondrion')">
          <path
            d="M-102-9C-99-57-33-67 30-53C94-49 122-10 101 27C82 61 17 65-44 47C-90 38-105 20-102-9Z"
            :fill="paint('warm')"
            class="warm-outline"
          />
          <path
            d="M-88-9C-86-41-51-46-32-42L-45-6Q-48 6-39 9L-20-38Q-10-40-1-35L-11 12Q-12 21-3 19L11-31Q25-32 34-24L25 20Q26 27 36 22L49-16Q63-10 66-1L57 24Q55 30 66 27L82 8Q95 23 76 34C44 52-1 43-33 33C-65 27-86 17-88-9Z"
            class="cristae"
          />
          <path
            d="M-67-22Q-58-30-48-24M-56 16Q-50 7-43 14M8 30Q16 23 22 31M50 35Q59 30 67 33"
            class="fine-amber"
          />
        </g>
      </defs>

      <!-- 细胞外轮廓、核膜与线粒体内膜保留真实的嵌套关系。 -->
      <g v-if="view === 'respiration'">
        <path
          d="M126 94C213 45 340 50 438 85C529 117 556 200 528 280C499 367 362 404 245 375C131 351 75 288 83 204C86 161 102 125 126 94Z"
          :fill="paint('tissue')"
          class="blue-outline"
        />
        <path
          d="M139 106C217 63 337 67 431 98C512 125 541 199 513 275C483 351 360 389 250 361C146 336 91 282 97 205C101 165 115 130 139 106Z"
          class="membrane-inner"
        />
        <ellipse cx="186" cy="184" rx="62" ry="59" :fill="paint('organ')" class="violet-outline" />
        <ellipse cx="186" cy="184" rx="55" ry="52" class="nuclear-inner" />
        <path
          d="M150 169Q172 150 182 172T220 169M150 197Q165 182 183 201T220 194M179 141Q190 156 209 148"
          class="chromatin"
        />
        <circle cx="190" cy="184" r="17" class="nucleolus" />
        <g
          :class="{ 'structure-muted': selectedMode === 'anaerobic' }"
          transform="translate(371 250) rotate(-12)"
        >
          <use :href="'#' + id('mitochondrion')" />
        </g>
        <g transform="translate(337 129) scale(.36) rotate(25)">
          <use :href="'#' + id('mitochondrion')" />
        </g>
        <circle
          v-for="point in [
            [258, 159],
            [287, 183],
            [267, 233],
            [162, 287],
            [208, 306],
            [295, 322],
            [448, 152],
            [467, 314],
          ]"
          :key="point[0]"
          :cx="point[0]"
          :cy="point[1]"
          r="3"
          class="ribosome"
        />
        <path
          d="M265 96C288 132 284 164 303 191"
          class="flow teal-flow"
          :marker-end="paint('arrow')"
        />
        <text x="254" y="76" class="label">葡萄糖</text>
        <path
          v-if="selectedMode === 'aerobic'"
          d="M608 131C543 130 511 177 467 211"
          class="flow blue-flow"
          :marker-end="paint('arrow')"
        />
        <text v-if="selectedMode === 'aerobic'" x="603" y="117" class="label">氧</text>
        <path
          v-if="selectedMode === 'aerobic'"
          d="M478 261C543 266 550 243 610 243"
          class="flow amber-flow"
          :marker-end="paint('arrow')"
        />
        <text v-if="selectedMode === 'aerobic'" x="576" y="278" class="label">CO₂ + 水</text>
        <g v-if="selectedMode === 'anaerobic'">
          <path
            d="M296 174C370 170 443 157 594 174"
            class="flow teal-flow"
            :marker-end="paint('arrow')"
          />
          <text x="579" y="151" class="label">乳酸盐</text>
          <text x="557" y="236" class="label emphasis">少量 ATP</text>
          <text x="557" y="267" class="small-label">在细胞质中供能</text>
        </g>
        <g v-else>
          <path d="M431 301Q432 334 385 345" class="flow teal-flow" :marker-end="paint('arrow')" />
          <text x="380" y="367" class="label emphasis">ATP</text>
          <text x="548" y="380" class="small-label">供细胞活动使用</text>
        </g>
        <text x="95" y="418" class="small-label">细胞质：两种途径都涉及这里</text>
        <text x="434" y="418" class="small-label">线粒体：有氧供能的重要场所</text>
      </g>

      <!-- 四腔、房室瓣与各侧进出通路分别绘制，不以“富氧/缺氧”替代方向。 -->
      <g v-else-if="view === 'heart'">
        <path
          d="M320 98C280 57 218 77 207 132C171 177 189 264 264 339C308 382 354 400 380 413C402 393 479 346 513 275C554 187 510 111 454 94C406 74 365 79 320 98Z"
          :fill="paint('organ')"
          class="violet-outline"
        />
        <path
          d="M229 128C254 101 288 106 305 133L314 202C283 216 241 208 219 184Z"
          :fill="paint('tissue')"
          class="blue-outline"
        />
        <path
          d="M225 227C252 216 287 221 313 230L345 365C294 340 230 284 225 227Z"
          :fill="paint('tissue')"
          class="blue-outline"
        />
        <path
          d="M362 129C388 109 430 111 457 132L465 195C430 212 390 209 365 196Z"
          :fill="paint('warm')"
          class="warm-outline"
        />
        <path
          d="M368 230C396 215 435 218 466 227C460 293 421 339 380 367C365 327 360 276 368 230Z"
          :fill="paint('warm')"
          class="warm-outline"
        />
        <path d="M328 111C322 186 332 269 362 372" class="septum" />
        <path
          d="M229 210L262 228L282 211M282 211L301 229L315 214M365 214L393 234L409 214M409 214L433 234L463 211"
          class="valves"
        />
        <path d="M254 128V65H178M234 179C190 203 200 288 166 344H123" class="vessel blue-vessel" />
        <path d="M305 268C301 179 307 83 354 57H435" class="vessel blue-vessel" />
        <path d="M444 145H548M443 169H548" class="vessel warm-vessel" />
        <path
          d="M390 274C386 213 388 157 385 106C383 45 458 37 476 79V101"
          class="vessel warm-vessel"
        />
        <path
          v-for="segment in [
            'M196 65H238V110',
            'M146 344H166Q190 300 200 248L218 196',
            'M293 250V172',
            'M335 79L367 62',
            'M530 145H465',
            'M399 253V157',
            'M413 60Q449 44 464 75',
          ]"
          :key="segment"
          :d="segment"
          class="flow narrow"
          :marker-end="paint('arrow')"
        />
        <text x="43" y="66" class="label">腔静脉</text>
        <path d="M127 64H171" class="leader" />
        <text x="432" y="30" class="label">主动脉</text>
        <text x="498" y="64" class="label">肺动脉</text>
        <path d="M488 59H443" class="leader" />
        <text x="560" y="160" class="label">肺静脉</text>
        <text x="242" y="171" class="small-label">右房</text>
        <text x="267" y="278" class="small-label">右室</text>
        <text x="392" y="170" class="small-label">左房</text>
        <text x="398" y="290" class="small-label">左室</text>
        <text x="74" y="388" class="small-label">身体的右侧</text>
        <text x="516" y="388" class="small-label">身体的左侧</text>
        <text x="184" y="440" class="small-label">
          本图左右按身体自身方位命名；箭头表示血流方向
        </text>
      </g>

      <!-- 单个肺泡切面与紧贴的毛细血管，双层薄壁突出交换距离。 -->
      <g v-else-if="view === 'alveolus'">
        <path
          d="M294 29V99C264 116 230 106 202 126C137 136 111 202 135 253C96 304 131 370 193 374C235 415 309 395 330 368C394 398 461 365 458 307C508 266 486 194 444 182C443 124 382 101 347 101V29"
          :fill="paint('tissue')"
          class="blue-outline"
        />
        <path
          d="M307 32V109C268 132 242 120 211 140C153 150 128 202 150 253C115 303 143 355 200 360C240 398 300 379 327 352C386 381 445 352 442 302C489 263 470 207 430 191C430 140 380 116 334 113V32"
          class="membrane-inner"
        />
        <path
          d="M107 147C48 197 61 286 96 321C90 379 152 412 208 412C274 438 322 412 355 397C419 419 477 383 488 339C544 294 530 215 482 184"
          class="capillary-outer"
        />
        <path
          d="M107 147C48 197 61 286 96 321C90 379 152 412 208 412C274 438 322 412 355 397C419 419 477 383 488 339C544 294 530 215 482 184"
          class="capillary-inner"
        />
        <g
          v-for="(item, i) in [
            [82, 220, -70],
            [92, 299, 62],
            [144, 390, 15],
            [235, 419, 0],
            [365, 406, -12],
            [474, 359, -58],
            [515, 270, -90],
          ]"
          :key="i"
          :transform="'translate(' + item[0] + ' ' + item[1] + ') rotate(' + item[2] + ')'"
        >
          <use :href="'#' + id('rbc')" />
        </g>
        <path
          v-for="segment in ['M246 265L92 299', 'M385 312L474 359']"
          :key="segment"
          :d="segment"
          class="flow blue-flow"
          :marker-end="paint('arrow')"
        />
        <path
          v-for="segment in ['M82 220L181 203', 'M515 270L416 254']"
          :key="segment"
          :d="segment"
          class="flow amber-flow"
          :marker-end="paint('arrow')"
        />
        <text x="260" y="207" class="label emphasis">肺泡内空气</text>
        <text x="193" y="307" class="label">O₂</text>
        <text x="160" y="226" class="label">CO₂</text>
        <path d="M318 45V93" class="flow teal-flow" :marker-end="paint('arrow')" />
        <text x="363" y="58" class="label">通气更新空气</text>
        <path d="M553 215H637" class="leader" />
        <text x="563" y="198" class="label">薄壁紧贴</text>
        <text x="552" y="248" class="small-label">肺泡壁 + 毛细血管壁</text>
        <text x="552" y="282" class="small-label">不是一层厚厚的组织</text>
        <text x="45" y="113" class="small-label">血流带来 CO₂</text>
        <text x="513" y="357" class="small-label">血流带走 O₂</text>
      </g>

      <!-- 绒毛上皮细胞、刷状缘、血毛细血管与乳糜管分别编码。 -->
      <g v-else-if="view === 'villus'">
        <path
          d="M205 408C229 333 222 242 236 162C247 93 283 55 323 54C363 55 398 95 407 163C421 257 415 336 438 408Z"
          :fill="paint('warm')"
          class="warm-outline"
        />
        <path
          d="M226 408C248 328 239 242 254 166C266 103 289 78 323 77C354 78 378 106 389 170C402 254 397 338 417 408"
          class="fine-amber"
        />
        <g
          v-for="(cell, index) in villusCells"
          :key="index"
          :transform="'translate(' + cell.x + ' ' + cell.y + ') rotate(' + cell.angle + ')'"
        >
          <rect x="-9" y="-15" width="18" height="30" rx="6" class="epithelial-cell" />
          <ellipse cy="5" rx="3" ry="5" class="nucleus-dot" />
          <path d="M-6-15V-24M-2-15V-25M2-15V-25M6-15V-24" class="microvilli" />
        </g>
        <path
          d="M286 420V173C286 122 318 113 338 137C368 173 353 268 363 420"
          class="capillary-outer"
        />
        <path
          d="M286 420V173C286 122 318 113 338 137C368 173 353 268 363 420"
          class="capillary-inner"
        />
        <path d="M323 424V185Q323 159 332 185V424Z" :fill="paint('green')" class="teal-outline" />
        <path
          v-for="segment in ['M185 203L286 219', 'M457 270L328 282']"
          :key="segment"
          :d="segment"
          class="flow teal-flow"
          :marker-end="paint('arrow')"
        />
        <g
          v-for="(rbc, i) in [
            [285, 250],
            [286, 330],
            [356, 226],
            [363, 367],
          ]"
          :key="i"
          :transform="'translate(' + rbc[0] + ' ' + rbc[1] + ') rotate(90) scale(.6)'"
        >
          <use :href="'#' + id('rbc')" />
        </g>
        <text x="58" y="177" class="label">葡萄糖、氨基酸</text>
        <text x="65" y="237" class="small-label">主要进入血毛细血管</text>
        <text x="457" y="243" class="label">许多脂类吸收产物</text>
        <text x="481" y="310" class="small-label">经乳糜管进入淋巴</text>
        <text x="476" y="106" class="label">小肠腔</text>
        <text x="473" y="139" class="small-label">食物先消化，再吸收</text>
        <path d="M471 150L402 169" class="leader" />
        <text x="52" y="383" class="small-label">绒毛与微绒毛</text>
        <text x="52" y="410" class="small-label">共同扩大表面积</text>
      </g>

      <!-- 肾小囊的杯形轮廓包住血管球，滤液与周围血液保留独立通路。 -->
      <g v-else-if="view === 'nephron'">
        <path d="M30 227H733" class="region-boundary" />
        <text x="38" y="213" class="small-label">皮质</text>
        <text x="38" y="254" class="small-label">髓质</text>
        <path
          d="M121 114C123 72 196 59 226 96C252 129 233 177 199 188L245 188"
          class="tubule-outer"
        />
        <path
          d="M121 114C123 72 196 59 226 96C252 129 233 177 199 188L245 188"
          class="tubule-inner"
        />
        <path d="M133 112C123 145 147 169 180 168C210 165 225 143 213 117" class="capsule-inner" />
        <path
          d="M69 96L141 111C162 79 212 97 211 121C211 151 162 160 148 138C134 116 178 99 191 118C204 142 172 153 162 137C151 120 181 107 202 106L255 75"
          class="vessel thin-vessel warm-vessel"
        />
        <path
          d="M244 188C266 192 265 134 287 137C311 140 292 188 317 184C346 178 318 124 345 126C368 128 349 179 366 191L366 342Q366 391 410 391Q450 390 450 341V193C451 155 478 135 490 154C504 173 473 192 499 205C524 219 534 179 551 181L585 192V408"
          class="tubule-outer"
        />
        <path
          d="M244 188C266 192 265 134 287 137C311 140 292 188 317 184C346 178 318 124 345 126C368 128 349 179 366 191L366 342Q366 391 410 391Q450 390 450 341V193C451 155 478 135 490 154C504 173 473 192 499 205C524 219 534 179 551 181L585 192V408"
          class="tubule-inner"
        />
        <path
          d="M255 75C299 69 331 76 350 98M272 85C275 105 313 107 327 85M272 219C310 240 338 218 339 199M399 268V350Q400 362 415 359V267M623 189V393"
          class="blood-network"
        />
        <path
          v-for="segment in ['M174 143L194 176', 'M305 185L294 218']"
          :key="segment"
          :d="segment"
          class="flow teal-flow"
          :marker-end="paint('arrow')"
        />
        <g :class="{ 'structure-muted': selectedMode === 'water-low' }">
          <path
            v-for="segment in ['M592 254H621', 'M592 298H621', 'M592 342H621']"
            :key="segment"
            :d="segment"
            class="flow blue-flow"
            :marker-end="paint('arrow')"
          />
          <circle
            v-for="cy in [244, 288, 332]"
            :key="cy"
            cx="600"
            :cy="cy"
            r="4"
            class="water-dot"
          />
        </g>
        <path d="M585 359V398" class="flow amber-flow" :marker-end="paint('arrow')" />
        <text x="100" y="42" class="label">血液 → 肾小球</text>
        <text x="262" y="43" class="label">近曲小管</text>
        <text x="465" y="117" class="label">远曲小管</text>
        <text x="548" y="155" class="label">集合管</text>
        <text x="289" y="429" class="small-label">髓袢：向髓质深入后返回</text>
        <text x="563" y="437" class="small-label">流向肾盂</text>
        <text x="638" y="282" class="small-label">水返回</text>
        <text x="638" y="307" class="small-label">血液</text>
        <text v-if="selectedMode.startsWith('water')" x="59" y="314" class="label emphasis">
          {{ selectedMode === 'water-high' ? 'ADH 较多' : 'ADH 较少' }}
        </text>
        <text v-if="selectedMode.startsWith('water')" x="59" y="346" class="small-label">
          {{ selectedMode === 'water-high' ? '集合管水通透性提高' : '集合管水通透性降低' }}
        </text>
      </g>

      <!-- 感觉/中间/运动神经元的连接与末端突触放大分开展示。 -->
      <g v-else-if="view === 'reflex'">
        <path
          d="M481 39C410 78 414 129 454 164C414 216 429 275 483 299C536 323 593 292 610 245C654 205 640 150 605 135C628 91 568 32 526 39Z"
          :fill="paint('tissue')"
          class="blue-outline"
        />
        <path
          d="M472 89C492 103 501 119 518 132C539 115 551 98 567 92L578 118C558 138 549 162 561 185C574 204 586 222 574 244C551 227 539 205 520 195C505 210 490 231 471 244C459 224 470 208 478 185C485 164 476 142 461 128Z"
          :fill="paint('organ')"
          class="violet-outline"
        />
        <path d="M80 116C147 115 213 127 283 125S403 126 478 140" class="neuron sensory" />
        <path d="M280 124V86Q300 69 318 86" class="neuron sensory" />
        <ellipse cx="319" cy="86" rx="22" ry="17" :fill="paint('warm')" class="warm-outline" />
        <circle cx="320" cy="86" r="7" class="nucleus-dot" />
        <path d="M486 146Q522 151 527 176Q530 191 511 207" class="neuron relay" />
        <path d="M498 216C430 250 376 259 311 270S195 303 126 314" class="neuron motor" />
        <path d="M500 216l-17-18m17 18l18 17m-18-17l-19 12" class="neuron motor" />
        <circle cx="500" cy="216" r="11" class="teal-fill" />
        <g v-for="x in [156, 202, 250, 365, 411]" :key="x">
          <rect :x="x" y="114" width="28" height="21" rx="10" class="myelin" />
        </g>
        <g
          v-for="(point, index) in [
            [195, 297],
            [246, 284],
            [305, 271],
            [365, 258],
          ]"
          :key="index"
          :transform="'translate(' + point[0] + ' ' + point[1] + ') rotate(-14)'"
        >
          <rect x="-15" y="-10" width="30" height="20" rx="10" class="myelin-green" />
        </g>
        <path d="M73 92V140M62 100L80 114L60 130M79 114L96 100M79 114L96 131" class="receptor" />
        <path
          d="M69 285C91 271 134 290 153 313C132 345 85 350 60 331C72 321 76 302 69 285Z"
          :fill="paint('warm')"
          class="warm-outline"
        />
        <path d="M79 294L137 317M75 305L127 330M72 318L105 336" class="fine-amber" />
        <path
          v-for="segment in ['M188 102H249', 'M420 151H461', 'M426 260L374 274']"
          :key="segment"
          :d="segment"
          class="flow narrow"
          :marker-end="paint('arrow')"
        />
        <text x="43" y="69" class="label">感受器</text>
        <text x="207" y="49" class="label">感觉神经元</text>
        <text x="470" y="25" class="label">脊髓切面</text>
        <text x="57" y="378" class="label">肌肉：效应器</text>
        <text x="238" y="327" class="label">运动神经元</text>
        <text x="558" y="331" class="small-label">中间神经元</text>
        <path d="M550 315L530 177" class="leader" />
        <text x="186" y="410" class="small-label">典型撤回反射可先启动，再产生有意识的感觉</text>
      </g>

      <!-- 胰腺和肝脏的器官形态配合血液内的葡萄糖，避免把激素画成燃料。 -->
      <g v-else-if="view === 'glucose'">
        <path
          d="M80 99C111 49 205 47 261 79L337 109L308 178C250 200 178 192 106 169C80 154 65 128 80 99Z"
          :fill="paint('warm')"
          class="warm-outline"
        />
        <path
          d="M226 64C219 106 210 149 226 188M92 126C129 131 162 140 191 151"
          class="fine-amber"
        />
        <path
          d="M512 92C551 70 603 73 648 95C684 100 699 123 677 135C629 139 593 167 547 168C515 164 492 148 500 124Z"
          :fill="paint('organ')"
          class="violet-outline"
        />
        <path
          v-for="i in 7"
          :key="i"
          :d="'M' + (515 + i * 20) + ' ' + (105 + (i % 2) * 8) + 'q-11 15 1 28'"
          class="chromatin"
        />
        <path d="M520 136C562 124 608 121 665 117" class="duct" />
        <path d="M83 274C245 233 424 331 676 279" class="blood-channel-outline" />
        <path d="M83 274C245 233 424 331 676 279" class="blood-channel" />
        <g
          v-for="(p, i) in [
            [117, 269],
            [178, 267],
            [236, 269],
            [295, 283],
            [369, 294],
            [444, 298],
            [515, 296],
            [583, 290],
            [636, 285],
          ]"
          :key="i"
        >
          <path
            :d="'M' + p[0] + ' ' + (p[1]! - 7) + 'l7 4v8l-7 4-7-4v-8Z'"
            class="glucose-molecule"
          />
        </g>
        <path
          d="M558 181C558 213 530 234 498 256"
          class="flow violet-flow"
          :marker-end="paint('arrow')"
        />
        <path
          :d="selectedMode === 'glucose-high' ? 'M206 247L198 197' : 'M177 195L167 242'"
          class="flow teal-flow"
          :marker-end="paint('arrow')"
        />
        <text x="137" y="38" class="label">肝脏</text>
        <text x="542" y="49" class="label">胰腺</text>
        <text x="534" y="215" class="label emphasis">
          {{ selectedMode === 'glucose-high' ? '胰岛素' : '胰高血糖素' }}
        </text>
        <text x="91" y="222" class="small-label">
          {{ selectedMode === 'glucose-high' ? '葡萄糖 → 糖原' : '肝糖原 → 葡萄糖' }}
        </text>
        <text x="114" y="356" class="label">
          {{
            selectedMode === 'glucose-high' ? '血糖偏高：增加利用与储存' : '血糖偏低：肝释放葡萄糖'
          }}
        </text>
        <text x="112" y="394" class="small-label">激素传递调节信号，不直接充当分解糖原的酶</text>
      </g>

      <!-- 皮肤表层、汗腺、导管与可改变口径的微血管形成完整散热结构。 -->
      <g v-else-if="view === 'temperature'">
        <path
          d="M71 157C179 142 220 169 319 155S510 141 688 155V382H71Z"
          :fill="paint('warm')"
          class="warm-outline"
        />
        <path d="M71 177C179 162 220 189 319 175S510 161 688 175" class="epidermis" />
        <path d="M71 328C178 315 219 343 318 326S512 313 688 328V382H71Z" :fill="paint('mesh')" />
        <path
          d="M155 167C151 213 195 208 198 241C203 266 183 274 186 295C188 323 225 322 229 300C232 276 203 267 200 292C195 321 255 327 258 297C262 271 238 260 228 279C211 302 246 322 269 308"
          class="sweat-coil"
        />
        <path
          d="M112 311C135 289 133 220 178 209C219 193 268 210 287 246C316 290 358 249 366 217C374 183 437 184 460 217C485 253 512 265 545 230C575 195 620 218 648 290"
          class="skin-vessel-outline"
        />
        <path
          d="M112 311C135 289 133 220 178 209C219 193 268 210 287 246C316 290 358 249 366 217C374 183 437 184 460 217C485 253 512 265 545 230C575 195 620 218 648 290"
          class="skin-vessel"
          :class="{ 'is-constricted': selectedMode === 'cold' }"
        />
        <g v-if="selectedMode === 'hot'">
          <path d="M154 117C143 134 144 143 154 143C164 143 165 133 154 117Z" class="water-drop" />
          <path d="M176 84C165 101 167 110 176 110C186 110 186 100 176 84Z" class="water-drop" />
          <path d="M195 113C187 126 188 133 195 133C203 133 204 126 195 113Z" class="water-drop" />
          <path
            v-for="segment in ['M345 125V65', 'M449 125V65', 'M553 125V65']"
            :key="segment"
            :d="segment"
            class="flow amber-flow"
            :marker-end="paint('arrow')"
          />
        </g>
        <g v-else>
          <path
            v-for="segment in ['M382 125V97', 'M497 125V97']"
            :key="segment"
            :d="segment"
            class="flow amber-flow"
            :marker-end="paint('arrow')"
          />
          <path d="M405 351L419 337L435 353L452 338L469 352" class="shiver" />
        </g>
        <text x="84" y="51" class="label">
          {{ selectedMode === 'hot' ? '较热时：散热增加' : '较冷时：保温与产热' }}
        </text>
        <text x="75" y="417" class="small-label">汗腺与导管</text>
        <text x="303" y="417" class="small-label">
          {{ selectedMode === 'hot' ? '皮肤血管扩张' : '皮肤血管收缩' }}
        </text>
        <text x="547" y="417" class="small-label">皮肤切面</text>
      </g>

      <!-- 卵泡形态和子宫内膜厚度按阶段联动，避免只用抽象时间箭头。 -->
      <g v-else-if="view === 'cycle'">
        <path
          d="M105 110C143 64 233 65 278 110C316 148 302 209 249 231C193 254 127 237 98 194C80 162 84 133 105 110Z"
          :fill="paint('organ')"
          class="violet-outline"
        />
        <path
          d="M111 121C147 82 228 80 265 118C296 151 284 200 241 217C190 240 134 224 110 185C92 157 97 138 111 121Z"
          class="nuclear-inner"
        />
        <circle
          v-for="(p, i) in [
            [132, 126],
            [155, 106],
            [184, 104],
            [121, 157],
            [145, 194],
          ]"
          :key="i"
          :cx="p[0]"
          :cy="p[1]"
          r="11"
          class="follicle-small"
        />
        <g v-if="selectedMode !== 'luteal'">
          <ellipse cx="226" cy="166" rx="48" ry="46" :fill="paint('tissue')" class="blue-outline" />
          <ellipse cx="229" cy="163" rx="37" ry="34" class="follicular-fluid" />
          <circle v-if="selectedMode === 'follicular'" cx="210" cy="185" r="16" class="egg" />
          <circle
            v-if="selectedMode === 'follicular'"
            cx="210"
            cy="185"
            r="6"
            class="nucleus-dot"
          />
        </g>
        <g v-else>
          <path
            d="M184 134L202 126L215 137L232 128L246 142L265 144L262 163L273 178L255 189L254 208L234 207L220 220L207 205L189 207L187 187L174 173L187 156Z"
            :fill="paint('warm')"
            class="warm-outline"
          />
          <path
            d="M199 148L213 163L232 145M213 163L205 187L224 202M213 163L245 177L233 191"
            class="fine-amber"
          />
        </g>
        <g v-if="selectedMode === 'ovulation'">
          <path d="M267 153L307 149V180H269Z" :fill="paint('tissue')" />
          <path d="M267 153L307 149M269 180H307" class="blue-outline membrane-inner" />
          <path d="M276 165L307 161" class="flow blue-flow" :marker-end="paint('arrow')" />
          <circle cx="332" cy="159" r="18" class="egg" />
          <circle cx="332" cy="159" r="7" class="nucleus-dot" />
        </g>
        <path
          d="M422 91C455 72 479 88 492 118C516 153 561 153 587 118C602 86 625 74 657 91C647 107 629 106 618 130C599 160 587 172 584 204L572 295C564 334 524 338 514 295L502 204C501 173 481 153 465 128C453 106 436 111 422 91Z"
          :fill="paint('warm')"
          class="warm-outline"
        />
        <path
          d="M510 150C525 168 558 168 575 150L560 228V290Q546 311 531 290L524 227Z"
          class="endometrium"
          :class="{ thick: selectedMode === 'luteal' }"
        />
        <path d="M539 178L543 286" class="uterine-cavity" />
        <text x="137" y="45" class="label">卵巢</text>
        <text x="504" y="45" class="label">子宫切面</text>
        <text x="99" y="283" class="label emphasis">
          {{
            selectedMode === 'follicular'
              ? '卵泡发育 · 雌激素增加'
              : selectedMode === 'ovulation'
                ? 'LH 峰 · 触发排卵'
                : '黄体 · 孕激素增加'
          }}
        </text>
        <text x="456" y="359" class="label">
          {{ selectedMode === 'luteal' ? '维持子宫内膜' : '子宫内膜逐渐增厚' }}
        </text>
        <path d="M184 326H358" class="flow violet-flow" :marker-end="paint('arrow')" />
        <text x="180" y="363" class="small-label">卵巢激素经血液传递信号</text>
        <text x="117" y="415" class="small-label">阶段顺序示意；排卵日和周期长度存在个体差异</text>
      </g>

      <!-- 吞噬细胞膜包裹、抗原抗体结合与记忆细胞形成各有完整形态。 -->
      <g v-else-if="view === 'immunity'">
        <g v-if="selectedMode === 'phagocytosis'">
          <path
            d="M102 194C62 138 109 84 166 100C192 55 265 77 284 115C316 96 341 112 339 146C333 178 366 192 366 223C363 275 323 303 296 310C284 351 216 365 180 333C135 348 92 313 95 271C63 246 73 210 102 194Z"
            :fill="paint('tissue')"
            class="blue-outline"
          />
          <path
            d="M173 169C145 174 142 205 168 217C196 226 196 259 225 264C261 268 276 242 253 223C228 206 240 176 216 165C200 157 186 160 173 169Z"
            :fill="paint('organ')"
            class="violet-outline"
          />
          <path
            d="M286 135C315 154 326 162 330 190C333 215 305 238 279 216C257 199 260 155 286 135Z"
            :fill="paint('green')"
            class="teal-outline"
          />
          <g transform="translate(292 180) rotate(35)">
            <rect x="-17" y="-8" width="34" height="16" rx="8" class="bacterium" />
            <path d="M-8 0Q0-7 8 0Q0 6-8 0" class="bacterial-dna" />
          </g>
          <circle
            v-for="(point, i) in [
              [128, 261],
              [252, 299],
              [157, 291],
              [294, 270],
            ]"
            :key="i"
            :cx="point[0]"
            :cy="point[1]"
            r="11"
            class="lysosome"
          />
          <g transform="translate(477 153) rotate(-12)">
            <rect x="-36" y="-18" width="72" height="36" rx="18" class="bacterium" />
            <path d="M-21 0Q-8-15 3 0T24 1M-12 7L13-6" class="bacterial-dna" />
            <path d="M36 0Q70-32 81 0T115-5" class="flagellum" />
          </g>
          <path d="M431 184L374 206" class="flow teal-flow" :marker-end="paint('arrow')" />
          <text x="427" y="107" class="label">病原细菌示意</text>
          <text x="415" y="261" class="label emphasis">包入 → 与消化囊泡结合</text>
          <text x="425" y="304" class="small-label">吞噬不等于分泌抗体</text>
          <text x="125" y="402" class="label">吞噬细胞</text>
        </g>
        <g v-else>
          <path
            d="M116 129C159 87 238 92 268 138C299 187 277 253 231 278C188 302 120 275 99 234C76 192 82 156 116 129Z"
            :fill="paint('tissue')"
            class="blue-outline"
          />
          <ellipse
            cx="150"
            cy="192"
            rx="43"
            ry="49"
            :fill="paint('organ')"
            class="violet-outline"
          />
          <path
            d="M127 166Q148 159 163 178M123 194Q142 183 165 208M145 220L164 230"
            class="chromatin"
          />
          <path
            v-for="n in 5"
            :key="n"
            :d="'M' + (185 + n * 6) + ' ' + (129 + n * 8) + 'q45 41 5 84'"
            class="rough-er"
          />
          <text x="85" y="336" class="label">
            {{ selectedMode === 'memory' ? '再次遇到匹配抗原' : '浆细胞分泌抗体' }}
          </text>
          <g
            v-for="(point, i) in [
              [345, 145],
              [397, 209],
              [344, 278],
              [455, 117],
              [482, 288],
            ]"
            :key="i"
            :transform="
              'translate(' + point[0] + ' ' + point[1] + ') rotate(' + (i * 21 - 15) + ')'
            "
          >
            <use :href="'#' + id('antibody')" />
          </g>
          <g transform="translate(590 197)">
            <ellipse rx="58" ry="65" :fill="paint('green')" class="teal-outline" />
            <path
              d="M-56-21L-71-31L-73-14L-58-10M-35-54L-42-74L-24-77L-20-59M22-61L32-79L46-67L38-52M57-20L77-27L80-8L60-2M48 35L66 47L52 61L37 47M-6 63L-8 83L-26 79L-21 60M-50 38L-68 52L-76 35L-59 24"
              class="antigen"
            />
            <path d="M-25-14Q0-34 23-9T-2 28T-25-14Z" class="bacterial-dna" />
          </g>
          <path
            v-for="segment in ['M289 194H327', 'M422 199H501']"
            :key="segment"
            :d="segment"
            class="flow violet-flow"
            :marker-end="paint('arrow')"
          />
          <text x="530" y="80" class="label">匹配抗原</text>
          <text x="526" y="336" class="small-label">表面特征决定识别</text>
          <g v-if="selectedMode === 'memory'">
            <circle cx="375" cy="375" r="31" :fill="paint('organ')" class="violet-outline" />
            <circle cx="370" cy="375" r="21" class="nucleolus" />
            <path
              d="M353 343C318 321 299 293 277 266"
              class="flow teal-flow"
              :marker-end="paint('arrow')"
            />
            <text x="425" y="391" class="small-label">记忆细胞帮助更快应答</text>
          </g>
        </g>
      </g>

      <g
        v-for="(detail, index) in current.details"
        :key="selectedMode + index"
        class="detail-pin"
        :class="{ selected: selectedDetail === index }"
        :transform="'translate(' + detail.x + ' ' + detail.y + ')'"
        role="button"
        tabindex="0"
        :aria-label="'查看' + detail.label"
        :aria-pressed="selectedDetail === index"
        @click="selectDetail(index)"
        @keydown.enter.prevent="selectDetail(index)"
        @keydown.space.prevent="selectDetail(index)"
      >
        <circle r="22" class="pin-hit" />
        <circle r="15" class="pin-circle" />
        <text text-anchor="middle" y="6">{{ index + 1 }}</text>
      </g>
    </svg>

    <template #legend>
      <span class="legend-item"><i class="legend-blue" />结构与细胞内部</span>
      <span class="legend-item"><i class="legend-warm" />血流、组织或能量相关结构</span>
      <span class="legend-item"><i class="legend-teal" />物质交换与调节</span>
    </template>
    <template #explanation>
      <div class="detail-selector" role="group" aria-label="选择图中结构说明">
        <AppButton
          v-for="(detail, index) in current.details"
          :key="detail.label"
          type="secondary"
          size="small"
          :aria-pressed="selectedDetail === index"
          @click="selectDetail(index)"
          >{{ index + 1 }} · {{ detail.label }}</AppButton
        >
      </div>
      <div class="detail-copy" aria-live="polite">
        <h6>{{ activeDetail.label }}</h6>
        <p><KnowledgeText :text="activeDetail.text" /></p>
        <p class="reading-note"><KnowledgeText :text="current.remember" /></p>
      </div>
    </template>
  </BiologyAtlasFrame>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import AppButton from '../AppButton.vue'
import BiologyAtlasFrame from './BiologyAtlasFrame.vue'
import KnowledgeText from './KnowledgeText.vue'

const props = defineProps<{ topic?: string }>()
const prefix = `animal-${useId().replace(/:/g, '')}`
const selectedMode = ref('aerobic')
const selectedDetail = ref(0)
type View =
  | 'respiration'
  | 'heart'
  | 'alveolus'
  | 'villus'
  | 'nephron'
  | 'reflex'
  | 'glucose'
  | 'temperature'
  | 'cycle'
  | 'immunity'
type Detail = { label: string; text: string; x: number; y: number }
type Plate = { title: string; subtitle: string; remember: string; details: Detail[] }
const modeOptions: Record<string, { id: string; label: string; view: View }[]> = {
  '150901': [
    { id: 'aerobic', label: '有氧供能', view: 'respiration' },
    { id: 'anaerobic', label: '动物无氧供能', view: 'respiration' },
  ],
  '150902': [
    { id: 'heart', label: '心脏与血流', view: 'heart' },
    { id: 'alveolus', label: '肺泡交换', view: 'alveolus' },
    { id: 'villus', label: '小肠绒毛', view: 'villus' },
    { id: 'nephron', label: '肾单位', view: 'nephron' },
    { id: 'reflex', label: '反射弧', view: 'reflex' },
  ],
  '150903': [
    { id: 'glucose-high', label: '血糖偏高', view: 'glucose' },
    { id: 'glucose-low', label: '血糖偏低', view: 'glucose' },
    { id: 'water-high', label: '缺水：ADH 增多', view: 'nephron' },
    { id: 'water-low', label: '水较多：ADH 减少', view: 'nephron' },
    { id: 'hot', label: '较热时', view: 'temperature' },
    { id: 'cold', label: '较冷时', view: 'temperature' },
  ],
  '150904': [
    { id: 'follicular', label: '卵泡发育', view: 'cycle' },
    { id: 'ovulation', label: '排卵', view: 'cycle' },
    { id: 'luteal', label: '黄体阶段', view: 'cycle' },
  ],
  '150905': [
    { id: 'phagocytosis', label: '吞噬', view: 'immunity' },
    { id: 'antibody', label: '抗体识别', view: 'immunity' },
    { id: 'memory', label: '免疫记忆', view: 'immunity' },
  ],
}
const plates: Record<View, Plate> = {
  respiration: {
    title: '把细胞内的供能过程看清楚',
    subtitle: '保留细胞核、细胞质与线粒体的空间关系；切换供能方式比较主要位置和产物。',
    remember:
      '**有氧过程涉及细胞质和线粒体；动物无氧过程在细胞质中进行**。图中线粒体变淡只表示当前重点，不代表结构消失。',
    details: [
      {
        label: '细胞质',
        x: 281,
        y: 195,
        text: '葡萄糖分解的起始过程在细胞质中进行；动物无氧供能也在这里完成，产生乳酸盐和少量 ATP。**细胞质不是没有化学反应的填充物**。',
      },
      {
        label: '线粒体内膜',
        x: 411,
        y: 244,
        text: '内膜形成褶皱，增加相关反应可用的面积，支持有氧 ATP 生成。图中画出的是膜的连续折叠，不是一堆互不相连的横条。',
      },
      {
        label: '细胞膜',
        x: 113,
        y: 261,
        text: '细胞膜围住细胞内部，控制原料和产物的进出。氧供应不足改变的是供能条件，**不等于细胞膜或细胞核立刻消失**。',
      },
    ],
  },
  heart: {
    title: '沿着四个心腔走一遍双循环',
    subtitle: '蓝色通路将血送往肺，暖色通路从肺回流并送往身体；读图先看方向，再看含氧量。',
    remember:
      '**动脉离开心脏，静脉返回心脏**。左心室较厚的肌壁为体循环提供较高压力；血管走向为教学展开。',
    details: [
      {
        label: '右心与肺循环',
        x: 237,
        y: 250,
        text: '腔静脉将体循环回流带入右心房，再经右心室泵向肺动脉。肺动脉虽然叫动脉，含氧量通常较低；它的名称来自**从心脏流出的方向**。',
      },
      {
        label: '房室瓣',
        x: 430,
        y: 217,
        text: '房室瓣位于心房和心室之间，随两侧压力变化开闭，帮助防止心室收缩时血倒流到心房。瓣膜不是主动泵血的小肌肉，图中瓣叶按位置展示，不代表同一时刻的精确开闭状态。',
      },
      {
        label: '左心室肌壁',
        x: 491,
        y: 284,
        text: '左心室经主动脉为身体供血，肌壁较厚，可以产生较高压力。**壁厚支持泵血功能，不等于心腔一定容纳更多血**。',
      },
    ],
  },
  alveolus: {
    title: '肺泡与毛细血管：让扩散只走很短的路',
    subtitle: '看清空气、肺泡薄壁、毛细血管和红细胞的位置，再跟随氧与二氧化碳的方向。',
    remember: '**通气更新肺泡中的空气，血流更新毛细血管中的血液**，两者帮助维持交换所需的分压差。',
    details: [
      {
        label: '空气与湿润内表面',
        x: 315,
        y: 263,
        text: '氧从肺泡空气中进入薄的湿润表面，再穿过交换屏障。这里画的是一个肺泡；真实肺有大量肺泡，合起来提供很大的交换面积。',
      },
      {
        label: '短扩散距离',
        x: 451,
        y: 307,
        text: '肺泡上皮与毛细血管壁相贴近，形成很薄的屏障。**壁变厚会增加扩散距离**，即使通气次数相同，交换也可能受影响。',
      },
      {
        label: '持续血流',
        x: 97,
        y: 344,
        text: '红细胞随血流通过毛细血管，血红蛋白结合氧；血流带走氧并带来二氧化碳，帮助维持分压差。氧通常进血，二氧化碳通常出血。',
      },
    ],
  },
  villus: {
    title: '小肠绒毛：从表面到运输通路',
    subtitle: '绒毛外有一层上皮细胞及微绒毛，内部同时有血毛细血管与乳糜管。',
    remember:
      '**消化先把大分子拆成可吸收的产物，吸收再让它们穿过上皮**。表面积、距离和运走产物的速度共同影响效率。',
    details: [
      {
        label: '上皮与微绒毛',
        x: 402,
        y: 183,
        text: '外缘画出的刷状细突起是微绒毛，属于上皮细胞表面；整根手指状结构是绒毛。两种层次都增加面积，**微绒毛不是另一个独立细胞**。',
      },
      {
        label: '毛细血管',
        x: 282,
        y: 308,
        text: '葡萄糖与氨基酸等主要进入血毛细血管。持续血流运走吸收产物，有助于保持适当的浓度差；一些吸收过程还涉及主动或耦联运输。',
      },
      {
        label: '乳糜管',
        x: 329,
        y: 347,
        text: '乳糜管是绒毛内的淋巴管。许多脂类吸收产物经细胞重新组装后进入这条通路，之后汇入血液；不能把所有营养物质都画成直接进入同一条毛细血管。',
      },
    ],
  },
  nephron: {
    title: '肾单位：先滤过，再沿小管调整',
    subtitle: '暖色血管留在血液一侧，浅色小管承接滤液；集合管的水回收可随 ADH 改变。',
    remember:
      '箭头表示水或溶质跨壁移动，**不是整份血液流入小管**。滤液成分沿途改变后，才形成最终尿液。',
    details: [
      {
        label: '肾小球与肾小囊',
        x: 184,
        y: 97,
        text: '杯状肾小囊包住毛细血管团。血液中的部分水和小分子被滤出；正常滤过屏障把血细胞和大蛋白保留在血内。初始滤液可含葡萄糖、盐和尿素。',
      },
      {
        label: '小管重吸收',
        x: 310,
        y: 153,
        text: '近曲小管回收葡萄糖等有用物质及大量水、盐，后续各段继续调整。**重吸收的方向是从滤液回到血液**，不是从肾动脉直接排到膀胱。',
      },
      {
        label: '集合管与 ADH',
        x: 584,
        y: 251,
        text: '正常靶细胞响应 ADH 时，集合管水通透性提高，更多水经渗透返回周围组织和血液，尿量通常减少。ADH 减少时这一保水作用减弱，图中的淡箭头表示减少而非绝对归零。',
      },
    ],
  },
  reflex: {
    title: '撤回反射：信号怎样从刺激走到肌肉',
    subtitle: '感觉通路进入脊髓，中间神经元连接，运动通路到达效应器；细胞长突起沿途传导冲动。',
    remember:
      '**感觉神经元传向中枢，运动神经元传向效应器**。典型化学突触用递质跨越间隙，不能把两条神经元当成一根连续电线。',
    details: [
      {
        label: '感觉神经元',
        x: 318,
        y: 86,
        text: '感受器检测刺激后，冲动沿感觉神经元传向中枢。图中的细胞体位于传入通路旁，髓鞘包裹部分长突起；感觉神经元不是收缩的效应器。',
      },
      {
        label: '中枢连接',
        x: 524,
        y: 172,
        text: '中间神经元位于中枢内，把传入信号连接到运动通路。反射能在有意识的感觉形成前启动，并不代表信号永远不会传到脑。',
      },
      {
        label: '运动神经元',
        x: 308,
        y: 271,
        text: '运动神经元把信号传给肌肉，使其收缩完成撤回动作。若这条输出通路受阻，即使感受器正常，肌肉也可能无法得到该反射命令。',
      },
    ],
  },
  glucose: {
    title: '血糖调节：胰腺发信号，肝脏参与调节',
    subtitle: '六边形表示血液中的葡萄糖；切换初始状态，观察肝脏与血液之间的方向变化。',
    remember:
      '**胰岛素与胰高血糖素由胰腺分泌，不由肝脏制造**。图中突出肝脏，胰岛素也作用于肌肉等其他靶组织。',
    details: [
      {
        label: '肝脏储存与释放',
        x: 210,
        y: 126,
        text: '血糖偏高时，胰岛素促进糖原合成等过程；血糖偏低时，胰高血糖素促进肝脏向血液供应葡萄糖。肝糖原不是溶在血浆中的激素。',
      },
      {
        label: '胰腺内分泌细胞',
        x: 588,
        y: 121,
        text: '胰腺中的不同内分泌细胞分别分泌胰岛素与胰高血糖素。激素经血液传送，与胰腺把消化酶送入小肠的外分泌作用不同。',
      },
      {
        label: '血糖回到适宜范围',
        x: 373,
        y: 294,
        text: '被调节的是血糖。原来偏高就向下纠正，原来偏低就向上纠正；两种情况都可以是**抵消原来偏离的负反馈**。',
      },
    ],
  },
  temperature: {
    title: '皮肤中的散热结构：血管、汗腺与表面',
    subtitle: '切换冷热条件，比较血管口径和汗液蒸发；较冷时还会通过颤抖增加产热。',
    remember:
      '**汗液真正蒸发才有效带走热**。散热还受外界温度与湿度影响，图中箭头不代表所有环境中的固定热流量。',
    details: [
      {
        label: '汗腺与导管',
        x: 225,
        y: 300,
        text: '盘曲的汗腺通过导管把汗液送到皮肤表面。出汗与蒸发是先后两个环节：高湿度可能限制蒸发，即使汗仍在分泌。',
      },
      {
        label: '皮肤血流',
        x: 416,
        y: 204,
        text: '较热时皮肤血管扩张，血流增加，帮助向适当环境散热；较冷时收缩，减少体表血流以保留热量。**改变的是口径和血流，不是血管搬家**。',
      },
      {
        label: '表面与热量',
        x: 548,
        y: 151,
        text: '热量可在体表与环境间交换，方向取决于温度等条件。寒冷时除了减少散热，肌肉颤抖还会增加代谢产热；两种策略并不矛盾。',
      },
    ],
  },
  cycle: {
    title: '卵巢与子宫：同一个周期里的两条变化',
    subtitle: '在卵巢看卵泡、排卵与黄体，在子宫看内膜；阶段按钮同时改变两侧结构说明。',
    remember:
      '**FSH 促进卵泡发育，LH 峰触发排卵，孕激素帮助维持内膜**。若未建立妊娠，黄体退化和激素下降与月经开始相联系。',
    details: [
      {
        label: '卵泡或黄体',
        x: 224,
        y: 166,
        text: '卵泡包围正在发育的卵细胞，分泌雌激素。排卵后剩余卵泡结构形成黄体，分泌较多孕激素。**黄体不是被释放出来的卵细胞**。',
      },
      {
        label: '卵细胞释放位置',
        x: 304,
        y: 180,
        text: '排卵是成熟卵细胞从卵巢释放，随后可进入输卵管；不是直接从卵巢进入子宫内膜。LH 峰位于这一事件之前，图中只在排卵阶段显示释放的卵细胞。',
      },
      {
        label: '子宫内膜',
        x: 563,
        y: 236,
        text: '雌激素促进内膜增厚，排卵后的孕激素帮助维持它。周期阶段对应的是内膜状态，并不是每个人每个月必定在同一天排卵。',
      },
    ],
  },
  immunity: {
    title: '身体防御：吞噬、特异性识别与记忆',
    subtitle: '把细胞与分子分别画清：细胞可以包入病原，抗体结合抗原，记忆细胞保留再次反应的能力。',
    remember:
      '**抗体是蛋白质分子，记忆细胞是细胞**。图中同一组配色表示匹配的抗原识别，不代表一种抗体对所有病原有效。',
    details: [
      {
        label: '免疫细胞',
        x: 151,
        y: 188,
        text: '吞噬模式中，细胞膜将病原包入囊泡，再与消化结构配合；抗体模式中，浆细胞分泌抗体。它们是不同功能的细胞，不能说每个白细胞都完成全部工作。',
      },
      {
        label: '识别或处理病原',
        x: 292,
        y: 183,
        text: '吞噬能包入并分解病原；抗体通过结合相应抗原发挥中和或帮助清除等作用。**抗体不会变成另一种细胞，也不等于抗生素**。',
      },
      {
        label: '病原与特异性',
        x: 594,
        y: 198,
        text: '病原表面具有可识别的分子特征。形成相应免疫记忆后，再遇到匹配抗原通常可更快、更强地应答；对某种病原的记忆不能自动推广到所有无关病原。',
      },
    ],
  },
}

// 当前知识点只展示相关机制，默认落在该点最先介绍的图解。
const modes = computed(() => modeOptions[props.topic ?? '150901'] ?? modeOptions['150901']!)
// 按模式选择完整解剖图，模式内部的细节变化由模板同步展示。
const view = computed<View>(
  () => modes.value.find((item) => item.id === selectedMode.value)?.view ?? modes.value[0]!.view,
)
// 所有图都提供三处定位解释，图中编号与下方文字保持一一对应。
const current = computed(() => {
  const plate = plates[view.value]
  if (selectedMode.value !== 'phagocytosis') return plate
  return {
    ...plate,
    details: plate.details.map((detail, index) =>
      index === 2 ? { ...detail, x: 477, y: 153 } : detail,
    ),
  }
})
// 选择结构后只更新解释与编号，不改变图解所示的科学条件。
const activeDetail = computed(
  () => current.value.details[selectedDetail.value] ?? current.value.details[0]!,
)
// 沿绒毛两侧与顶部生成有方向的上皮细胞，表现微绒毛朝向小肠腔。
const villusCells = [
  ...Array.from({ length: 9 }, (_, i) => ({ x: 235 - i * 2.1, y: 193 + i * 23, angle: -91 })),
  ...Array.from({ length: 9 }, (_, i) => ({ x: 411 + i * 2.2, y: 193 + i * 23, angle: 91 })),
  ...Array.from({ length: 10 }, (_, i) => {
    const angle = Math.PI + (i * Math.PI) / 9
    return {
      x: 323 + 84 * Math.cos(angle),
      y: 187 + 119 * Math.sin(angle),
      angle: (angle * 180) / Math.PI + 90,
    }
  }),
]

// 考纲切换时重置模式与编号，避免沿用另一个器官的选择。
watch(
  () => props.topic,
  () => selectMode(modes.value[0]!.id),
  { immediate: true },
)

// 切换生理条件时从首个结构开始读图。
function selectMode(mode: string) {
  selectedMode.value = mode
  selectedDetail.value = 0
}
// 图中热点与文字按钮共用同一选择入口，支持鼠标与键盘。
function selectDetail(index: number) {
  selectedDetail.value = index
}
// 每个图谱实例使用独立 SVG 标识，防止多个知识点同时渲染时渐变串用。
function id(name: string) {
  return `${prefix}-${name}`
}
// 渐变、图案和箭头引用均在当前图谱实例内解析。
function paint(name: string) {
  return `url(#${id(name)})`
}
</script>

<style scoped>
.physiology-plate {
  min-width: 620px;
  overflow: visible;
}
.physiology-plate path,
.physiology-plate ellipse,
.physiology-plate circle,
.physiology-plate rect {
  vector-effect: non-scaling-stroke;
}
.label {
  fill: var(--color-ink);
  font-size: 19px;
  font-weight: var(--weight-semi);
}
.small-label {
  fill: var(--color-ink-soft);
  font-size: 16px;
}
.emphasis {
  fill: var(--color-learning-teal);
}
.stop-surface {
  stop-color: var(--color-surface);
}
.stop-blue {
  stop-color: var(--color-learning-blue-line);
}
.stop-amber-soft {
  stop-color: var(--color-learning-amber-soft);
}
.stop-amber {
  stop-color: var(--color-learning-amber-line);
}
.stop-violet-soft {
  stop-color: var(--color-learning-violet-soft);
}
.stop-violet {
  stop-color: var(--color-learning-violet-line);
}
.stop-teal-soft {
  stop-color: var(--color-learning-teal-soft);
}
.stop-teal {
  stop-color: var(--color-learning-teal-line);
}
.blue-outline {
  stroke: var(--color-learning-blue);
  stroke-width: 2;
}
.warm-outline {
  stroke: var(--color-learning-amber);
  stroke-width: 2;
}
.violet-outline {
  stroke: var(--color-learning-violet);
  stroke-width: 2;
}
.teal-outline {
  stroke: var(--color-learning-teal);
  stroke-width: 2;
}
.membrane-inner {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 1;
  opacity: 0.6;
}
.nuclear-inner {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 1.2;
  opacity: 0.6;
}
.chromatin,
.rough-er {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 1.5;
  stroke-linecap: round;
}
.nucleolus,
.nucleus-dot,
.ribosome {
  fill: var(--color-learning-violet);
}
.cristae {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 1.6;
}
.fine-amber {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 1.2;
  opacity: 0.7;
}
.flow {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 2.6;
  stroke-linecap: round;
}
.teal-flow {
  stroke: var(--color-learning-teal);
}
.blue-flow {
  stroke: var(--color-learning-blue);
}
.amber-flow {
  stroke: var(--color-learning-amber);
}
.violet-flow {
  stroke: var(--color-learning-violet);
}
.narrow {
  stroke: var(--color-ink);
  stroke-width: 1.6;
}
.leader {
  fill: none;
  stroke: var(--color-ink-soft);
  stroke-width: 1;
}
.structure-muted {
  opacity: 0.23;
}
.vessel {
  fill: none;
  stroke-width: 13;
  stroke-linejoin: round;
}
.blue-vessel {
  stroke: var(--color-learning-blue);
}
.warm-vessel {
  stroke: var(--color-learning-amber);
}
.septum {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 13;
}
.valves {
  fill: var(--color-surface);
  stroke: var(--color-learning-violet);
  stroke-width: 2;
}
.red-cell-centre {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 0.6;
}
.capillary-outer {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 23;
  stroke-linecap: round;
}
.capillary-inner {
  fill: none;
  stroke: var(--color-learning-amber-soft);
  stroke-width: 19;
  stroke-linecap: round;
}
.epithelial-cell {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 1;
}
.microvilli {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 1;
}
.tubule-outer {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 17;
  stroke-linejoin: round;
}
.tubule-inner {
  fill: none;
  stroke: var(--color-learning-blue-soft);
  stroke-width: 12;
  stroke-linejoin: round;
}
.capsule-inner {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 2;
}
.thin-vessel {
  stroke-width: 5;
}
.blood-network {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 3;
}
.water-dot {
  fill: var(--color-learning-blue);
}
.region-boundary {
  stroke: var(--color-learning-teal-line);
  stroke-dasharray: 6 6;
}
.neuron {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
}
.sensory {
  stroke: var(--color-learning-amber);
}
.relay {
  stroke: var(--color-learning-violet);
}
.motor {
  stroke: var(--color-learning-teal);
}
.teal-fill {
  fill: var(--color-learning-teal);
}
.myelin {
  fill: var(--color-learning-amber-line);
  stroke: var(--color-learning-amber);
  stroke-width: 1;
}
.myelin-green {
  fill: var(--color-learning-teal-line);
  stroke: var(--color-learning-teal);
  stroke-width: 1;
}
.receptor {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 3;
}
.duct {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 2;
}
.blood-channel-outline {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 39;
  stroke-linecap: round;
}
.blood-channel {
  fill: none;
  stroke: var(--color-learning-amber-soft);
  stroke-width: 35;
  stroke-linecap: round;
}
.glucose-molecule {
  fill: var(--color-learning-teal-line);
  stroke: var(--color-learning-teal);
  stroke-width: 1.2;
}
.mesh-line {
  fill: none;
  stroke: var(--color-learning-amber-line);
  stroke-width: 1;
}
.epidermis {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 5;
}
.sweat-coil {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 6;
}
.skin-vessel-outline {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 18;
}
.skin-vessel {
  fill: none;
  stroke: var(--color-learning-amber-soft);
  stroke-width: 13;
}
.skin-vessel.is-constricted {
  stroke-width: 4;
}
.water-drop {
  fill: var(--color-learning-blue-line);
  stroke: var(--color-learning-blue);
  stroke-width: 1.5;
}
.shiver {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 3;
}
.follicle-small {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet);
  stroke-width: 1.4;
}
.follicular-fluid {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue-line);
  stroke-width: 1;
}
.egg {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 2.3;
}
.endometrium {
  fill: var(--color-learning-violet-line);
  stroke: var(--color-learning-violet);
  stroke-width: 3;
}
.endometrium.thick {
  stroke-width: 9;
}
.uterine-cavity {
  fill: none;
  stroke: var(--color-surface);
  stroke-width: 4;
}
.antibody-line {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 2.2;
  stroke-linecap: round;
}
.bacterium {
  fill: var(--color-learning-teal-line);
  stroke: var(--color-learning-teal);
  stroke-width: 1.8;
}
.bacterial-dna {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1.5;
}
.flagellum {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 2;
}
.lysosome {
  fill: var(--color-learning-amber-line);
  stroke: var(--color-learning-amber);
  stroke-width: 1.4;
}
.antigen {
  fill: var(--color-learning-violet-line);
  stroke: var(--color-learning-violet);
  stroke-width: 1.5;
}
.detail-pin {
  outline: none;
}
.pin-hit {
  fill: transparent;
}
.pin-circle {
  fill: var(--color-surface);
  stroke: var(--color-learning-teal);
  stroke-width: 1.6;
}
.detail-pin text {
  fill: var(--color-learning-teal);
  font-size: 17px;
  font-weight: var(--weight-bold);
}
.detail-pin.selected .pin-circle {
  fill: var(--color-learning-teal);
  stroke-width: 3;
}
.detail-pin.selected text {
  fill: var(--color-ink-inverse);
}
.detail-pin:focus-visible .pin-circle {
  stroke: var(--color-learning-blue);
  stroke-width: 4;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.legend-item i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.legend-blue {
  background: var(--color-learning-blue);
}
.legend-warm {
  background: var(--color-learning-amber);
}
.legend-teal {
  background: var(--color-learning-teal);
}
.detail-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.detail-selector :deep(.app-button.el-button) {
  margin: 0;
  height: auto;
  min-height: 36px;
  white-space: normal;
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-border: var(--color-learning-teal);
  --app-button-hover-color: var(--color-learning-teal);
}
.detail-selector :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-border: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-color: var(--color-ink-inverse);
}
.reading-note {
  padding-top: 12px;
  border-top: 1px solid var(--color-learning-teal-line);
}
@media (max-width: 600px) {
  .physiology-plate {
    min-width: 620px;
  }
  .detail-selector {
    gap: 6px;
  }
  .detail-selector :deep(.app-button.el-button) {
    padding: 8px;
    font-size: var(--text-xs);
  }
}
</style>
