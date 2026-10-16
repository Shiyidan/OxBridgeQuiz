<!-- 生态系统原创交互图谱：生态层级、碳水循环、实景样方取样与富营养化剖面。 -->
<template>
  <BiologyAtlasFrame :title="heading" :subtitle="subtitle" :note="note">
    <template #controls>
      <AppButton
        v-for="item in controls"
        :key="item.value"
        type="secondary"
        size="small"
        :aria-pressed="mode === item.value"
        @click="mode = item.value"
        >{{ item.label }}</AppButton
      >
    </template>

    <svg
      class="ecosystem-illustration"
      viewBox="0 0 840 600"
      role="img"
      :aria-label="accessibleLabel"
    >
      <defs>
        <linearGradient :id="id('sky')" x2="0" y2="1">
          <stop offset="0" stop-color="var(--color-learning-blue-soft)" />
          <stop offset="1" stop-color="var(--color-surface)" />
        </linearGradient>
        <linearGradient :id="id('water')" x2="0.3" y2="1">
          <stop offset="0" stop-color="var(--color-learning-blue-soft)" />
          <stop offset="1" stop-color="var(--color-learning-blue-line)" />
        </linearGradient>
        <radialGradient :id="id('leaf')" cx="30%" cy="20%" r="85%">
          <stop offset="0" stop-color="var(--color-learning-teal-soft)" />
          <stop offset="1" stop-color="var(--color-learning-teal-line)" />
        </radialGradient>
        <linearGradient :id="id('meadow')">
          <stop offset="0" stop-color="var(--color-learning-blue-soft)" />
          <stop offset="0.5" stop-color="var(--color-learning-teal-soft)" />
          <stop offset="1" stop-color="var(--color-learning-amber-soft)" />
        </linearGradient>
        <linearGradient :id="id('soil')" x2="0" y2="1">
          <stop offset="0" stop-color="var(--color-learning-amber-line)" />
          <stop offset="1" stop-color="var(--color-learning-amber-soft)" />
        </linearGradient>
        <marker
          v-for="tone in ['blue', 'teal', 'amber', 'violet']"
          :id="id(`arrow-${tone}`)"
          :key="tone"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M1 1L9 5L1 9Z" :fill="`var(--color-learning-${tone})`" />
        </marker>
        <g :id="id('leaf-shape')">
          <path
            d="M0 0C-27-8-32-32-30-49C-5-47 16-24 0 0Z"
            :fill="paint('leaf')"
            class="leaf-outline"
          />
          <path d="M0 0L-27-44M-11-18L-23-19M-16-28L-15-39" class="leaf-vein" />
        </g>
        <g :id="id('tree')">
          <path d="M-12 0L-7-147L-46-184L-41-190L4-159L35-206L42-202L13-145L18 0Z" class="wood" />
          <path d="M-1-14L0-122M8-48L9-100M-2-143L-29-170" class="bark" />
          <g
            v-for="(leaf, index) in canopy"
            :key="index"
            :transform="`translate(${leaf.x} ${leaf.y}) rotate(${leaf.r}) scale(${leaf.s})`"
          >
            <use :href="`#${id('leaf-shape')}`" />
          </g>
          <path
            d="M-7 0Q-26 19-53 27M2 0Q6 32 30 43M11 0Q38 17 65 20M-34 19L-30 36M-17 10L-36 7M21 31L13 46M43 16L49 35"
            class="roots"
          />
        </g>
        <g :id="id('rabbit')">
          <ellipse cx="0" cy="0" rx="34" ry="23" class="animal-body" />
          <ellipse cx="-14" cy="5" rx="19" ry="17" class="animal-haunch" />
          <ellipse cx="26" cy="-17" rx="17" ry="16" class="animal-body" />
          <path
            d="M17-29Q6-69 17-71Q28-67 27-33M28-31Q27-67 37-65Q45-59 36-27"
            class="animal-body"
          />
          <path d="M19-39L17-59M32-38L36-54" class="ear-detail" />
          <path d="M-23 18H-5M15 15L24 21H36M29-13L46-13M31-8L46-5" class="animal-detail" />
          <circle cx="-34" cy="-5" r="9" class="animal-tail" />
          <circle cx="31" cy="-20" r="2.4" class="eye" />
          <circle cx="42" cy="-13" r="2.5" class="nose" />
          <path d="M-18-7L-12-3M-8-12L-2-8M2-7L8-3" class="fur" />
        </g>
        <g :id="id('fish')">
          <path d="M-35 0Q-4-29 30 0Q-4 29-35 0L-52-17L-48 0L-52 17Z" class="fish-body" />
          <path
            d="M-17-15L-7-28L5-16M-10 15L2 25L7 12M-48-10L-36 0L-48 10M12-13Q4 0 12 13"
            class="fish-details"
          />
          <circle cx="21" cy="-3" r="2.5" class="eye" />
          <path
            d="M-18-8Q-13-3-18 2M-8-7Q-3-2-8 3M-20 3Q-15 8-20 12M-8 4Q-3 9-8 13"
            class="fish-scales"
          />
        </g>
        <g :id="id('flower')">
          <path d="M0 10V-9M0 6Q-14 8-13-4Q-3-4 0 6M0 2Q13 1 12-9Q2-8 0 2" class="flower-stem" />
          <g transform="translate(0 -13)">
            <ellipse
              v-for="rotation in [0, 60, 120]"
              :key="rotation"
              rx="4.5"
              ry="11"
              :transform="`rotate(${rotation})`"
              class="flower-petal"
            />
            <circle r="3.4" class="flower-centre" />
          </g>
        </g>
        <g :id="id('clover')">
          <path d="M0 8V-2" class="leaf-vein" />
          <path
            d="M0-1C-19-1-17-17-9-15Q-3-16 0-7Q1-19 10-16C20-14 17-1 2-1C15 5 10 17 3 12Q-3 15-8 8Q-14 1 0-1Z"
            :fill="paint('leaf')"
            class="leaf-outline"
          />
          <path d="M0 0L-10-9M0 0L10-10M0 0L3 9" class="leaf-vein" />
        </g>
        <g :id="id('reed')">
          <path
            d="M0 0V-81M4 0Q25-51 35-55M-3 0Q-23-33-29-35M0-20Q-15-58-21-62"
            class="reed-stem"
          />
          <path d="M-4-80V-109Q0-116 4-109V-80Z" class="reed-head" />
        </g>
        <g :id="id('fungi')">
          <path d="M-18 0L-14-31H-6L-3 0M16 0L19-19H25L28 0" class="fungal-stalk" />
          <path d="M-39-27Q-10-69 17-27Z" class="fungal-cap" />
          <path d="M6-17Q22-43 42-17Z" class="fungal-cap" />
          <path d="M-30-27L-11-34L8-27M-21-27L-11-34L0-27M11-17L23-22L36-17" class="fungal-gills" />
          <path
            d="M-7 2L-26 15L-42 12M-26 15L-24 27M-7 2L11 20L26 17M11 20L12 30M21 1L38 12L50 8"
            class="mycelium"
          />
        </g>
        <g :id="id('cloud')">
          <path
            d="M-81 13C-108-4-92-40-64-34C-63-65-12-73 4-44C32-64 63-44 61-23C95-21 100 15 72 22H-72Z"
            class="cloud"
          />
          <path d="M-70 4Q-36 16-6 6M18 8Q46 17 70 6" class="cloud-detail" />
        </g>
        <g :id="id('bacterium')">
          <rect x="-13" y="-6" width="26" height="12" rx="6" class="microbe" />
          <path d="M-7 0Q-3-5 0 0T7 0M-14 1Q-21 9-24 1" class="microbe-detail" />
        </g>
      </defs>

      <g v-if="section === 'organisation'" class="habitat-scene">
        <rect x="14" y="18" width="812" height="480" rx="22" :fill="paint('sky')" />
        <circle cx="737" cy="88" r="32" class="sun" />
        <path
          d="M737 41V30M737 135V147M690 88H679M784 88H795M703 54L695 46M772 121L780 129M703 121L695 129M772 54L780 46"
          class="sun-rays"
        />
        <use :href="`#${id('cloud')}`" transform="translate(471 100) scale(.72)" />
        <path d="M14 341Q170 294 331 336T611 321T826 345V498H14Z" :fill="paint('soil')" />
        <path d="M14 341Q170 294 331 336T611 321T826 345" class="grass-bank" />
        <path
          d="M526 348Q623 313 796 349L813 439Q675 476 539 426Z"
          :fill="paint('water')"
          class="pond-edge"
        />
        <path
          d="M554 368Q605 357 641 366M694 355Q737 347 777 361M580 423Q651 441 706 422M718 407Q755 401 787 408"
          class="water-ripple"
        />
        <use :href="`#${id('tree')}`" transform="translate(171 335) scale(.83)" />
        <use :href="`#${id('reed')}`" transform="translate(793 370) scale(.83)" />
        <use :href="`#${id('reed')}`" transform="translate(547 363) scale(.6)" />
        <use
          v-for="(flower, index) in sceneFlowers"
          :key="index"
          :href="`#${id('flower')}`"
          :transform="`translate(${flower[0]} ${flower[1]}) scale(.76)`"
        />
        <use
          v-for="(rabbit, index) in rabbits"
          :key="index"
          :href="`#${id('rabbit')}`"
          :transform="`translate(${rabbit[0]} ${rabbit[1]}) scale(.8)`"
        />
        <use :href="`#${id('fish')}`" transform="translate(635 386) scale(.8)" />
        <use :href="`#${id('fish')}`" transform="translate(744 423) scale(-.7 .7)" />
        <use :href="`#${id('fungi')}`" transform="translate(255 427) scale(.75)" />
        <use :href="`#${id('bacterium')}`" transform="translate(374 456) scale(1.1)" />
        <use :href="`#${id('bacterium')}`" transform="translate(401 471) rotate(-25)" />
        <g transform="translate(382 208)">
          <path
            d="M0 0C-44-37-45 11-4 6C-35 37-4 45 1 9C36 39 39 6 6 5C44-22 14-44 1 0Z"
            class="butterfly-wing"
          />
          <path d="M2-9L1 19M2-9L-5-17M2-9L10-16" class="butterfly-body" />
        </g>
        <g v-if="mode === 'individual' || mode === 'population'">
          <ellipse
            v-for="(rabbit, index) in mode === 'individual' ? rabbits.slice(0, 1) : rabbits"
            :key="index"
            :cx="rabbit[0]"
            :cy="rabbit[1] - 17"
            rx="51"
            ry="52"
            class="selection-ring"
          />
        </g>
        <g v-if="mode === 'community'">
          <ellipse cx="171" cy="228" rx="104" ry="120" class="selection-ring" />
          <ellipse cx="385" cy="347" rx="127" ry="59" class="selection-ring" />
          <ellipse cx="387" cy="207" rx="40" ry="43" class="selection-ring" />
          <ellipse cx="683" cy="405" rx="117" ry="46" class="selection-ring" />
          <ellipse cx="260" cy="410" rx="46" ry="41" class="selection-ring" />
          <ellipse cx="388" cy="464" rx="44" ry="24" class="selection-ring" />
          <path
            d="M40 356Q90 301 132 363M505 366Q525 283 550 286M770 368Q776 251 819 292"
            class="community-bracket"
          />
        </g>
        <rect
          v-if="mode === 'ecosystem'"
          x="20"
          y="24"
          width="800"
          height="468"
          rx="20"
          class="selection-ring ecosystem-ring"
        />
        <text x="39" y="58" class="scene-kicker">同一片林缘池塘 · 改变研究范围</text>
        <text x="40" y="479" class="small-note">土壤中的真菌和细菌同样是群落成员</text>
        <path d="M45 518H795" class="divider" />
        <text x="43" y="550" class="main-label">{{ organisationLabel }}</text>
        <text x="43" y="577" class="small-note">{{ organisationDetail }}</text>
      </g>

      <g v-else-if="section === 'cycling'">
        <rect x="14" y="18" width="812" height="488" rx="22" :fill="paint('sky')" />
        <path d="M14 347Q197 320 402 354T826 350V506H14Z" :fill="paint('soil')" />
        <path d="M14 347Q197 320 402 354T826 350" class="grass-bank" />
        <path
          d="M549 353Q670 327 817 354V473Q672 468 550 435Z"
          :fill="paint('water')"
          class="pond-edge"
        />
        <path
          d="M579 375Q623 365 663 374M704 389Q748 381 793 390M574 429Q629 420 688 431"
          class="water-ripple"
        />
        <use :href="`#${id('tree')}`" transform="translate(174 344) scale(.72)" />
        <use :href="`#${id('rabbit')}`" transform="translate(390 355) scale(.8)" />
        <use :href="`#${id('fish')}`" transform="translate(686 417) scale(.72)" />
        <use :href="`#${id('reed')}`" transform="translate(567 367) scale(.6)" />
        <use
          v-for="(flower, index) in [
            [56, 346],
            [80, 338],
            [292, 346],
            [490, 358],
          ]"
          :key="index"
          :href="`#${id('flower')}`"
          :transform="`translate(${flower[0]} ${flower[1]}) scale(.65)`"
        />
        <g v-if="mode === 'carbon'">
          <rect x="325" y="37" width="250" height="68" rx="34" class="atmosphere" />
          <text x="450" y="66" text-anchor="middle" class="main-label">大气中的 CO₂</text>
          <text x="450" y="89" text-anchor="middle" class="small-note">追踪碳原子的去向</text>
          <path
            d="M326 69Q172 66 161 173"
            class="flow teal-flow"
            :marker-end="paint('arrow-teal')"
          />
          <text x="39" y="106" class="label-halo teal-text">光合作用</text>
          <text x="39" y="127" class="small-note label-halo">CO₂ → 有机物</text>
          <path
            d="M227 206Q292 174 359 111"
            class="flow violet-flow"
            :marker-end="paint('arrow-violet')"
          />
          <text x="270" y="178" class="label-halo violet-text">植物呼吸</text>
          <path
            d="M420 324Q486 259 469 111"
            class="flow violet-flow"
            :marker-end="paint('arrow-violet')"
          />
          <text x="490" y="257" class="label-halo violet-text">动物呼吸</text>
          <path
            d="M292 335Q326 299 367 348"
            class="flow teal-flow"
            :marker-end="paint('arrow-teal')"
          />
          <text x="291" y="283" class="small-note label-halo teal-text">取食</text>
          <use :href="`#${id('fungi')}`" transform="translate(406 476) scale(.9)" />
          <use :href="`#${id('bacterium')}`" transform="translate(465 474) rotate(-15)" />
          <g transform="translate(255 420) rotate(45) scale(.55)">
            <use :href="`#${id('leaf-shape')}`" />
          </g>
          <g transform="translate(291 431) rotate(-40) scale(.55)">
            <use :href="`#${id('leaf-shape')}`" />
          </g>
          <path
            d="M205 361Q222 402 238 408M305 428Q339 458 366 464"
            class="flow amber-flow"
            :marker-end="paint('arrow-amber')"
          />
          <text x="61" y="416" class="label-halo amber-text">落叶 / 遗体</text>
          <text x="319" y="416" class="small-note label-halo">有机物分解</text>
          <path
            d="M476 462Q616 471 617 311T563 107"
            class="flow violet-flow"
            :marker-end="paint('arrow-violet')"
          />
          <text x="630" y="305" class="label-halo violet-text">分解者呼吸</text>
          <g transform="translate(754 424)">
            <path d="M-31 5L25-6M-29-7L25 7" class="firewood" />
            <path d="M-21-9Q-36-32-11-47Q-19-66 2-79Q-2-57 15-49Q38-22 23-8Z" class="flame-outer" />
            <path d="M-8-9Q-20-28 2-44Q-3-29 13-23L9-9Z" class="flame-inner" />
          </g>
          <path
            d="M757 338Q787 145 583 74"
            class="flow amber-flow"
            :marker-end="paint('arrow-amber')"
          />
          <text x="724" y="208" class="label-halo amber-text">燃烧</text>
          <text x="689" y="456" class="small-note">含碳燃料</text>
        </g>
        <g v-else>
          <use :href="`#${id('cloud')}`" transform="translate(424 102) scale(1.18)" />
          <text x="424" y="85" text-anchor="middle" class="main-label">凝结形成云滴</text>
          <text x="424" y="109" text-anchor="middle" class="small-note">气态水 → 液态水</text>
          <path
            d="M685 348Q778 174 552 108"
            class="flow blue-flow"
            :marker-end="paint('arrow-blue')"
          />
          <text x="703" y="224" class="label-halo blue-text">水面蒸发</text>
          <path
            d="M216 210Q216 106 292 103"
            class="flow teal-flow"
            :marker-end="paint('arrow-teal')"
          />
          <text x="118" y="112" class="label-halo teal-text">叶片蒸腾</text>
          <path d="M455 143L455 362" class="flow blue-flow" :marker-end="paint('arrow-blue')" />
          <text x="472" y="220" class="label-halo blue-text">降水</text>
          <path
            v-for="(drop, index) in [
              [360, 162],
              [389, 197],
              [461, 167],
              [371, 241],
              [480, 250],
              [443, 279],
            ]"
            :key="index"
            :d="`M${drop[0]} ${drop[1]}l-4 14`"
            class="rain"
          />
          <path
            d="M441 351Q484 358 562 370"
            class="flow blue-flow"
            :marker-end="paint('arrow-blue')"
          />
          <text x="463" y="327" class="label-halo blue-text">径流</text>
          <path d="M350 347L350 455" class="flow blue-flow" :marker-end="paint('arrow-blue')" />
          <text x="367" y="416" class="label-halo blue-text">下渗</text>
          <path
            d="M358 476Q466 502 605 434"
            class="flow blue-flow"
            :marker-end="paint('arrow-blue')"
          />
          <text x="401" y="481" class="small-note label-halo blue-text">地下水流动</text>
          <path
            d="M104 437Q155 420 174 382L174 358"
            class="flow teal-flow"
            :marker-end="paint('arrow-teal')"
          />
          <text x="36" y="473" class="label-halo teal-text">根吸水</text>
          <text x="587" y="487" class="small-note">水体储存与重新分配</text>
        </g>
        <path d="M45 527H795" class="divider" />
        <text x="43" y="554" class="main-label">
          {{
            mode === 'carbon'
              ? '植物和分解者都呼吸；白天也不例外。'
              : '同一份水可以走不同路径，并在不同位置停留。'
          }}
        </text>
        <text x="43" y="581" class="small-note">
          物质可以循环；能量在传递中散失，需要持续输入。
        </text>
      </g>

      <g v-else-if="mode !== 'eutrophication'">
        <text x="58" y="32" class="main-label">
          {{
            mode === 'quadrat'
              ? '随机样方：估计整块生境的平均密度'
              : '沿梯度的间断带状样带：观察分布变化'
          }}
        </text>
        <text x="58" y="62" class="blue-text">靠近水边 · 更湿</text>
        <path d="M226 57H522" class="flow blue-flow" :marker-end="paint('arrow-blue')" />
        <text x="550" y="62" class="amber-text">离水较远 · 更干</text>
        <rect x="58" y="96" width="640" height="384" rx="5" :fill="paint('meadow')" />
        <g
          v-for="plant in samplePlants"
          :key="plant.key"
          :transform="`translate(${plant.x} ${plant.y}) scale(.52)`"
        >
          <use :href="`#${id(plant.flower ? 'flower' : 'clover')}`" />
        </g>
        <path
          v-for="col in 11"
          :key="`col-${col}`"
          :d="`M${58 + (col - 1) * 64} 96V480`"
          class="sample-grid"
        />
        <path
          v-for="row in 7"
          :key="`row-${row}`"
          :d="`M58 ${96 + (row - 1) * 64}H698`"
          class="sample-grid"
        />
        <g v-if="mode === 'transect'">
          <path d="M38 289H721" class="transect-line" />
          <path d="M38 276V303M721 276V303" class="transect-stakes" />
        </g>
        <g v-for="(cell, index) in selectedCells" :key="cell">
          <rect
            :x="59 + (cell % 10) * 64"
            :y="97 + Math.floor(cell / 10) * 64"
            width="62"
            height="62"
            class="sample-selected"
          />
          <circle
            :cx="69 + (cell % 10) * 64"
            :cy="107 + Math.floor(cell / 10) * 64"
            r="9"
            class="sample-number-bg"
          />
          <text
            :x="69 + (cell % 10) * 64"
            :y="111 + Math.floor(cell / 10) * 64"
            text-anchor="middle"
            class="sample-number"
          >
            {{ index + 1 }}
          </text>
        </g>
        <text x="720" y="119" class="sample-caption">每格</text>
        <text x="720" y="141" class="sample-caption">1 m²</text>
        <text x="720" y="196" class="sample-caption">整块</text>
        <text x="720" y="218" class="sample-caption">60 m²</text>
        <use :href="`#${id('flower')}`" transform="translate(752 283) scale(.9)" />
        <text x="720" y="314" class="sample-caption">目标种 A</text>
        <use :href="`#${id('clover')}`" transform="translate(750 367)" />
        <text x="720" y="400" class="sample-caption">其他种</text>
        <text x="58" y="510" class="small-note">
          橙色框内 A 株数：{{ sampleCounts.join('、') }}
        </text>
        <text v-if="mode === 'quadrat'" x="58" y="543" class="main-label">
          {{ sampleTotal }} 株 ÷ 6 m² × 60 m² = 约 {{ sampleTotal * 10 }} 株
        </text>
        <text v-else x="58" y="543" class="main-label">
          保留位置顺序，比较目标种沿湿度梯度的分布。
        </text>
        <text x="58" y="576" class="small-note">
          {{
            mode === 'quadrat'
              ? '这里演示一次已选定的随机样本；估计值不等于逐株清点的真实总数。'
              : '橙框沿同一条样带间隔放置；还应重复多条样带并记录环境条件。'
          }}
        </text>
      </g>

      <g v-else class="eutrophication-scene">
        <rect x="16" y="20" width="808" height="488" rx="22" :fill="paint('sky')" />
        <text x="39" y="53" class="main-label">从营养盐输入，到水体缺氧</text>
        <path d="M16 185Q124 177 225 233L264 508H16Z" :fill="paint('soil')" />
        <path d="M217 232H824V508H264Z" :fill="paint('water')" />
        <path d="M18 187Q120 180 219 232" class="grass-bank" />
        <use :href="`#${id('reed')}`" transform="translate(94 192) scale(.75)" />
        <use :href="`#${id('flower')}`" transform="translate(154 201) scale(1.2)" />
        <path
          d="M106 222Q172 237 278 244"
          class="flow amber-flow"
          :marker-end="paint('arrow-amber')"
        />
        <text x="35" y="279" class="label-halo amber-text">① 营养盐随径流进入</text>
        <g
          v-for="(x, index) in [
            285, 309, 339, 366, 395, 426, 455, 489, 521, 551, 586, 616, 647, 677, 711, 742, 777,
            806,
          ]"
          :key="x"
        >
          <ellipse :cx="x" :cy="237 + (index % 3) * 4" rx="17" ry="6" class="algal-mat" />
          <path :d="`M${x - 5} 238q5-6 10 0`" class="algal-detail" />
        </g>
        <text x="327" y="196" class="label-halo teal-text">② 藻类增长，表层遮光</text>
        <path d="M489 202V226" class="leader" />
        <path d="M357 266L373 332M403 267L415 308" class="blocked-light" />
        <path d="M363 297L378 300M402 294L418 296" class="light-stop" />
        <path
          d="M367 457Q353 407 361 370M362 415Q330 400 327 379M362 398Q384 381 391 360M374 459Q405 438 416 406"
          class="dying-plant"
        />
        <path
          d="M386 337Q428 369 462 389"
          class="flow amber-flow"
          :marker-end="paint('arrow-amber')"
        />
        <text x="276" y="475" class="small-note">光照减少，水下植物受影响</text>
        <g transform="translate(492 399) rotate(52) scale(.55)">
          <use :href="`#${id('leaf-shape')}`" />
        </g>
        <g transform="translate(524 414) rotate(-54) scale(.48)">
          <use :href="`#${id('leaf-shape')}`" />
        </g>
        <text x="450" y="356" class="label-halo amber-text">③ 死亡有机物增多</text>
        <g
          v-for="(microbe, index) in [
            [487, 438, -20],
            [524, 453, 20],
            [559, 427, -35],
            [590, 450, 12],
            [565, 472, 0],
          ]"
          :key="index"
          :transform="`translate(${microbe[0]} ${microbe[1]}) rotate(${microbe[2]})`"
        >
          <use :href="`#${id('bacterium')}`" />
        </g>
        <path
          d="M625 401Q609 432 609 446"
          class="flow violet-flow"
          :marker-end="paint('arrow-violet')"
        />
        <text x="619" y="379" class="violet-text">O₂</text>
        <text x="450" y="495" class="small-note">④ 有氧分解者呼吸耗氧</text>
        <use :href="`#${id('fish')}`" transform="translate(742 333) scale(.95)" />
        <circle cx="780" cy="311" r="6" class="oxygen-bubble" />
        <circle cx="792" cy="289" r="4" class="oxygen-bubble" />
        <path
          d="M699 412Q726 385 738 360"
          class="flow violet-flow"
          :marker-end="paint('arrow-violet')"
        />
        <text x="671" y="445" class="label-halo violet-text">⑤ 溶解氧下降</text>
        <text x="671" y="470" class="small-note">鱼类等可能减少</text>
        <path d="M45 529H795" class="divider" />
        <text x="43" y="557" class="main-label">耗氧的关键是呼吸；不是“光合作用消耗氧”。</text>
        <text x="43" y="583" class="small-note">
          控制营养盐来源能处理起因；曝气只能帮助缓解缺氧。
        </text>
      </g>
    </svg>

    <template #legend>
      <span><i class="legend-dot teal-dot" />植物与有机物</span>
      <span><i class="legend-dot blue-dot" />水与非生物环境</span>
      <span><i class="legend-dot amber-dot" />观察范围 / 取样位置</span>
      <span v-if="section !== 'organisation'"
        ><i class="legend-dot violet-dot" />呼吸及相关生物过程</span
      >
    </template>
    <template #explanation>
      <h6>{{ explanationTitle }}</h6>
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
const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const mode = ref('individual')
const rabbits: [number, number][] = [
  [330, 344],
  [428, 364],
  [401, 317],
]
const sceneFlowers = [
  [55, 351],
  [78, 338],
  [103, 356],
  [475, 354],
  [492, 365],
  [520, 342],
]
const canopy = [
  { x: -3, y: -132, r: -58, s: 1.4 },
  { x: -28, y: -172, r: -44, s: 1.3 },
  { x: -44, y: -183, r: -82, s: 1.2 },
  { x: -28, y: -184, r: -12, s: 1.3 },
  { x: -7, y: -181, r: 21, s: 1.4 },
  { x: 22, y: -182, r: 66, s: 1.4 },
  { x: 35, y: -192, r: 102, s: 1.2 },
  { x: 34, y: -209, r: 33, s: 1.2 },
  { x: 1, y: -214, r: -10, s: 1.1 },
  { x: -43, y: -205, r: -58, s: 1.15 },
  { x: 7, y: -148, r: 106, s: 1.2 },
  { x: 13, y: -177, r: 132, s: 1.1 },
  { x: -35, y: -161, r: -100, s: 1.1 },
  { x: -59, y: -192, r: -80, s: 1.1 },
]
const randomCells = [3, 9, 17, 24, 43, 57]
const transectCells = [20, 22, 24, 26, 28]

// 每个实例的 SVG 引用独立命名，避免切换章节或并排渲染时发生 ID 冲突。
function id(name: string) {
  return `ecosystems-${uid}-${name}`
}
// 共用图形、渐变和箭头均引用当前实例的定义。
function paint(name: string) {
  return `url(#${id(name)})`
}

// 考纲叶节点决定展示层级、循环或调查图，并与页面选择保持一致。
const section = computed(() =>
  props.topic === '151002' ? 'cycling' : props.topic === '151003' ? 'biodiversity' : 'organisation',
)
watch(
  section,
  (value) => {
    mode.value =
      value === 'cycling' ? 'carbon' : value === 'biodiversity' ? 'quadrat' : 'individual'
  },
  { immediate: true },
)
// 各图的控制只切换阅读视角，不改变正文题目的数据或答案。
const controls = computed(() =>
  section.value === 'organisation'
    ? [
        { value: 'individual', label: '个体' },
        { value: 'population', label: '种群' },
        { value: 'community', label: '群落' },
        { value: 'ecosystem', label: '生态系统' },
      ]
    : section.value === 'cycling'
      ? [
          { value: 'carbon', label: '碳循环' },
          { value: 'water', label: '水循环' },
        ]
      : [
          { value: 'quadrat', label: '随机样方' },
          { value: 'transect', label: '带状样带' },
          { value: 'eutrophication', label: '富营养化剖面' },
        ],
)
// 标题强调本叶节点的知识关系，图中控件补充具体观察角度。
const heading = computed(() =>
  section.value === 'organisation'
    ? '同一片生境，四种观察范围'
    : section.value === 'cycling'
      ? '沿着树、土壤和水体，追踪物质的去向'
      : '从现场取样，到解释群落变化',
)
// 简短说明帮助学生进入图解，不在按钮或标签里提前泄露练习答案。
const subtitle = computed(() =>
  section.value === 'organisation'
    ? '树木、兔、鱼和微生物共同生活，水和光照也在影响它们'
    : section.value === 'cycling'
      ? '切换碳与水：看清每条箭头转移的是什么'
      : '同一块草地可用于数量估计，也可用于观察环境梯度',
)
// 图示边界明确说明比例、取样预设与生态模型省略的部分。
const note = computed(() =>
  section.value === 'organisation'
    ? '原创教学小景，动物、植物与土壤微生物并非同一比例；只画出群落的部分代表。群落包括所有生物，生态系统还包括非生物环境及其相互作用。'
    : section.value === 'cycling'
      ? '原创过程图，箭头表示过程方向，不表示流量大小。碳循环省略海洋交换、长期埋藏等路径；植物、动物和分解者的呼吸均被保留。水循环示出主要路径，不要求每份水走完所有步骤。'
      : '原创虚构生境与取样数据；每个方格代表 1 m²，草地共 60 m²。图中花朵表示可辨认的目标植物 A，每个符号计一株；样本位置固定用于讲解，按钮不会重新随机抽样。富营养化剖面展示典型过程，不代表所有水体同时出现相同结果。',
)
// 当前层级的描述与图中选区一一对应。
const organisationLabel = computed(
  () =>
    ({
      individual: '个体：一只兔',
      population: '种群：这里所有同种的兔',
      community: '群落：这里不同物种的全部种群',
      ecosystem: '生态系统：群落 + 非生物环境及相互作用',
    })[mode.value] ?? '',
)
// 层级提示强调群落成员不局限于容易看见的动物。
const organisationDetail = computed(
  () =>
    ({
      individual: '研究一个生物体，不把其他兔一起计算。',
      population: '图中三只兔属于同一物种；树、鱼与真菌不计入兔种群。',
      community: '包括植物、动物、真菌和细菌；不把水、土壤矿物或阳光算成生物。',
      ecosystem: '水、光照、空气与土壤条件共同影响这些生物。',
    })[mode.value] ?? '',
)

// 固定的虚构植物位置允许学生直接核对框内数量；目标种在湿地一侧较多。
const samplePlants = Array.from({ length: 60 }, (_, cell) => {
  const col = cell % 10
  const row = Math.floor(cell / 10)
  const count = Math.max(
    0,
    4 - Math.floor(col / 3) + (row % 3 === 0 ? 1 : 0) - (row % 3 === 2 ? 1 : 0),
  )
  const positions = [
    [18, 29],
    [44, 32],
    [29, 53],
    [46, 53],
    [16, 52],
  ]
  return [
    ...positions.slice(0, count).map((point, index) => ({
      key: `${cell}-a-${index}`,
      cell,
      flower: true,
      x: 58 + col * 64 + point[0]!,
      y: 96 + row * 64 + point[1]!,
    })),
    { key: `${cell}-b`, cell, flower: false, x: 58 + col * 64 + 45, y: 96 + row * 64 + 13 },
  ]
}).flat()
// 随机样本估计整体，间断样带保留位置顺序，两种调查目标分开呈现。
const selectedCells = computed(() => (mode.value === 'transect' ? transectCells : randomCells))
// 图中每个计数直接由该框内的目标种符号推导，不另设一套显示数据。
const sampleCounts = computed(() =>
  selectedCells.value.map(
    (cell) => samplePlants.filter((plant) => plant.cell === cell && plant.flower).length,
  ),
)
// 六个 1 m² 样方的目标种总数用于同一图中的密度与面积换算。
const sampleTotal = computed(() => sampleCounts.value.reduce((total, count) => total + count, 0))
// 屏幕阅读器能够获得当前模式及与图同步的核心信息。
const accessibleLabel = computed(() =>
  section.value === 'organisation'
    ? `${organisationLabel.value}。${organisationDetail.value}`
    : section.value === 'cycling'
      ? `${mode.value === 'carbon' ? '碳循环：光合固定碳，植物、动物和分解者呼吸释放二氧化碳，燃烧也释放二氧化碳。' : '水循环：水面蒸发、叶片蒸腾、凝结、降水、径流、下渗、地下水流动和根吸水。'}`
      : mode.value === 'eutrophication'
        ? '富营养化剖面：营养盐进入，藻类增长，死亡有机物增加，分解者耗氧，鱼类可能减少。'
        : `植物取样图。所选样方中的目标种 A 分别有 ${sampleCounts.value.join('、')} 株。`,
)
// 解释区补充图形无法完整表达的条件与因果，保持老师讲解的语气。
const explanationTitle = computed(() =>
  section.value === 'organisation'
    ? '范围改变以后，什么被包括进来了？'
    : section.value === 'cycling'
      ? '把过程名称和物质去向对应起来'
      : mode.value === 'eutrophication'
        ? '为什么藻类多了，其他生物却可能少了？'
        : mode.value === 'transect'
          ? '这里要看的是位置变化'
          : '先数清样方面积，再估计总数',
)
// 关键限制条件在正文中完整突出，避免图形简化带来错误推论。
const explanation = computed(() =>
  section.value === 'organisation'
    ? `${organisationDetail.value} **群落包含生物部分，生态系统还要考虑它们与非生物环境的联系。** 不能因为鱼和兔住在同一处，就把它们叫作一个种群。`
    : section.value === 'cycling'
      ? mode.value === 'carbon'
        ? '先看进入植物的箭头：光合作用把二氧化碳中的碳合成到有机物中。取食再把一部分有机碳传给动物，落叶等则供分解者利用。**植物、动物和分解者都能通过呼吸释放二氧化碳**；燃烧也能释放二氧化碳，但不是活细胞的呼吸。'
        : '水面蒸发和叶片蒸腾把水送入空气；水蒸气凝结成小液滴，降水再把水带回地面。降下来的水可以流向水体、渗入地下或被根吸收。**水循环让水重新分配，不是在每一步都创造新的水。**'
      : mode.value === 'eutrophication'
        ? '藻类增长可能遮住水下植物需要的光。随后大量有机物死亡，分解者利用这些有机物并呼吸；当总耗氧快于氧的补充，鱼类等就可能缺氧。**光合作用释放氧，呼吸才消耗氧。** 藻类自身的夜间呼吸也可能加重缺氧，不能用“看起来更绿”判断生态系统更健康。'
        : mode.value === 'transect'
          ? '按离水边的顺序比较橙框内的 A 株数，可以看到沿这条线的分布趋势。**这条样带用于研究梯度，不应直接当作整块草地的随机样本。** 水分、光照和其他条件可能一起变化，还需要测量环境、重复样带，才能更可靠地解释原因。'
          : `六个样方合计 6 m²，其中有 ${sampleTotal.value} 株 A。把平均密度乘整块草地的 60 m²，得到约 ${sampleTotal.value * 10} 株。**这是估计值，不是逐株清点的结果。** 随机取样仍有抽样波动；若只挑选花多的地方，估计还会出现系统性偏差。`,
)
</script>

<style scoped>
.ecosystem-illustration {
  min-width: 620px;
  color: var(--color-ink);
}
svg text {
  fill: var(--color-ink);
  font-size: 16px;
}
.main-label {
  font-size: 19px;
  font-weight: 750;
}
.scene-kicker {
  fill: var(--color-learning-blue);
  font-size: 16px;
  font-weight: 650;
}
.small-note {
  font-size: 14px;
  fill: var(--color-ink-soft);
}
.divider {
  stroke: var(--color-learning-teal-line);
  stroke-width: 1.3;
}
.label-halo {
  paint-order: stroke fill;
  stroke: var(--color-surface);
  stroke-width: 5;
  stroke-linejoin: round;
  font-weight: 650;
}
.teal-text {
  fill: var(--color-learning-teal);
}
.blue-text {
  fill: var(--color-learning-blue);
}
.amber-text {
  fill: var(--color-learning-amber);
}
.violet-text {
  fill: var(--color-learning-violet);
}
.wood {
  fill: var(--color-learning-amber-line);
  stroke: var(--color-learning-amber);
  stroke-width: 1.4;
}
.bark,
.roots {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 2;
  stroke-linecap: round;
}
.bark {
  stroke-width: 1;
}
.leaf-outline {
  stroke: var(--color-learning-teal);
  stroke-width: 1.4;
}
.leaf-vein {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1.3;
}
.grass-bank {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 4;
}
.pond-edge {
  stroke: var(--color-learning-blue-line);
  stroke-width: 1.5;
}
.water-ripple {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 1.4;
  opacity: 0.55;
}
.cloud {
  fill: var(--color-surface);
  stroke: var(--color-learning-blue-line);
  stroke-width: 1.5;
}
.cloud-detail {
  fill: none;
  stroke: var(--color-learning-blue-soft);
  stroke-width: 3;
}
.sun {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber-line);
  stroke-width: 2;
}
.sun-rays {
  stroke: var(--color-learning-amber-line);
  stroke-width: 2.5;
  stroke-linecap: round;
}
.animal-body {
  fill: var(--color-learning-amber-soft);
  stroke: var(--color-learning-amber);
  stroke-width: 1.5;
}
.animal-haunch {
  fill: var(--color-learning-amber-line);
  stroke: var(--color-learning-amber);
  stroke-width: 1;
}
.animal-tail {
  fill: var(--color-surface);
  stroke: var(--color-learning-amber);
  stroke-width: 1.4;
}
.animal-detail,
.fur,
.ear-detail {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 1.2;
  stroke-linecap: round;
}
.ear-detail {
  stroke-width: 3;
  opacity: 0.5;
}
.eye {
  fill: var(--color-ink);
}
.nose {
  fill: var(--color-learning-violet);
}
.fish-body {
  fill: var(--color-learning-blue-soft);
  stroke: var(--color-learning-blue);
  stroke-width: 1.4;
}
.fish-details,
.fish-scales {
  fill: none;
  stroke: var(--color-learning-blue);
  stroke-width: 1.2;
}
.fish-scales {
  opacity: 0.5;
}
.flower-stem {
  fill: var(--color-learning-teal-line);
  stroke: var(--color-learning-teal);
  stroke-width: 1.4;
}
.flower-petal {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet);
  stroke-width: 1;
}
.flower-centre {
  fill: var(--color-learning-amber);
}
.reed-stem {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 2;
  stroke-linecap: round;
}
.reed-head {
  fill: var(--color-learning-amber-line);
  stroke: var(--color-learning-amber);
}
.fungal-stalk {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet);
  stroke-width: 1.3;
}
.fungal-cap {
  fill: var(--color-learning-violet-line);
  stroke: var(--color-learning-violet);
  stroke-width: 1.5;
}
.fungal-gills,
.mycelium {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 1;
}
.microbe {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet);
  stroke-width: 1.3;
}
.microbe-detail {
  fill: none;
  stroke: var(--color-learning-violet);
  stroke-width: 1;
}
.butterfly-wing {
  fill: var(--color-learning-violet-soft);
  stroke: var(--color-learning-violet);
  stroke-width: 1.5;
}
.butterfly-body {
  stroke: var(--color-learning-violet);
  stroke-width: 2.5;
  stroke-linecap: round;
}
.selection-ring {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 2.2;
  stroke-dasharray: 6 4;
}
.ecosystem-ring {
  stroke-width: 3;
  stroke-dasharray: none;
}
.community-bracket {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 2.2;
  stroke-dasharray: 6 4;
}
.flow {
  fill: none;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.teal-flow {
  stroke: var(--color-learning-teal);
}
.blue-flow {
  stroke: var(--color-learning-blue);
}
.violet-flow {
  stroke: var(--color-learning-violet);
}
.amber-flow {
  stroke: var(--color-learning-amber);
}
.atmosphere {
  fill: var(--color-surface);
  stroke: var(--color-learning-blue-line);
  stroke-width: 1.5;
}
.firewood {
  stroke: var(--color-learning-amber);
  stroke-width: 8;
  stroke-linecap: round;
}
.flame-outer {
  fill: var(--color-learning-amber-line);
  stroke: var(--color-learning-amber);
  stroke-width: 1.5;
}
.flame-inner {
  fill: var(--color-learning-amber-soft);
}
.rain {
  stroke: var(--color-learning-blue);
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.65;
}
.sample-grid {
  stroke: color-mix(in srgb, var(--color-learning-teal) 27%, transparent);
  stroke-width: 1;
}
.sample-selected {
  fill: color-mix(in srgb, var(--color-learning-amber-soft) 15%, transparent);
  stroke: var(--color-learning-amber);
  stroke-width: 3;
}
.sample-number-bg {
  fill: var(--color-learning-amber);
}
.sample-number {
  fill: var(--color-ink-inverse);
  font-size: 11px;
  font-weight: 700;
}
.sample-caption {
  font-size: 14px;
  fill: var(--color-ink-soft);
}
.transect-line {
  stroke: var(--color-learning-violet);
  stroke-width: 2.5;
  stroke-dasharray: 7 4;
}
.transect-stakes {
  stroke: var(--color-learning-violet);
  stroke-width: 4;
}
.algal-mat {
  fill: var(--color-learning-teal-line);
  stroke: var(--color-learning-teal);
  stroke-width: 1.3;
}
.algal-detail {
  fill: none;
  stroke: var(--color-learning-teal);
  stroke-width: 1;
}
.blocked-light {
  stroke: var(--color-learning-amber-line);
  stroke-width: 4;
  stroke-dasharray: 5 5;
}
.light-stop {
  stroke: var(--color-learning-amber);
  stroke-width: 2;
}
.dying-plant {
  fill: none;
  stroke: var(--color-learning-amber);
  stroke-width: 5;
  stroke-linecap: round;
  opacity: 0.75;
}
.leader {
  fill: none;
  stroke: var(--color-ink-soft);
  stroke-width: 1.3;
}
.oxygen-bubble {
  fill: var(--color-surface);
  stroke: var(--color-learning-blue);
  stroke-width: 1;
}
.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 5px;
  border-radius: 50%;
}
.teal-dot {
  background: var(--color-learning-teal);
}
.blue-dot {
  background: var(--color-learning-blue);
}
.amber-dot {
  background: var(--color-learning-amber);
}
.violet-dot {
  background: var(--color-learning-violet);
}
@media (max-width: 760px) {
  .ecosystem-illustration {
    min-width: 620px;
  }
}
</style>
