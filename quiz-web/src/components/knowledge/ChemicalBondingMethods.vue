<!-- 化学键讲义：仅共价电子计数和分子内外作用配图，其余复用紧凑正文。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="化学键、结构与性质：概念与方法">
    <template #diagram>
      <figure v-if="code === '140604'" class="bond-method__electron">
        <svg viewBox="0 0 400 195" role="img" :aria-labelledby="uid + '-nitrogen'">
          <title :id="uid + '-nitrogen'">
            N₂ 价电子点叉图：三个共享电子对，每个氮另有一个孤对，共十个价电子。
          </title>
          <text x="124" y="108" text-anchor="middle" class="bond-method__symbol">N</text>
          <text x="278" y="108" text-anchor="middle" class="bond-method__symbol">N</text>
          <rect
            x="177"
            y="52"
            width="49"
            height="95"
            rx="10"
            fill="#eaf3ff"
            stroke="#bfd1f0"
            stroke-dasharray="4 3"
          />
          <circle
            v-for="y in [70, 100, 130]"
            :key="'shared-dot-' + y"
            cx="192"
            :cy="y"
            r="4"
            fill="#2453cd"
          />
          <text
            v-for="y in [70, 100, 130]"
            :key="'shared-cross-' + y"
            x="211"
            :y="y + 7"
            text-anchor="middle"
            class="bond-method__cross"
          >
            ×
          </text>
          <circle
            v-for="y in [90, 110]"
            :key="'lone-dot-' + y"
            cx="80"
            :cy="y"
            r="4"
            fill="#2453cd"
          />
          <text
            v-for="y in [90, 110]"
            :key="'lone-cross-' + y"
            x="322"
            :y="y + 7"
            text-anchor="middle"
            class="bond-method__cross"
          >
            ×
          </text>
          <text x="201" y="174" text-anchor="middle">3 对共享电子</text>
          <text x="83" y="42" text-anchor="middle">1 对孤对</text>
          <text x="319" y="42" text-anchor="middle">1 对孤对</text>
        </svg>
        <figcaption>
          只显示价电子。蓝点和绿叉分别追踪两个 N 各自提供的 5 个电子；共享电子总共 6
          个，孤对电子总共 4 个。
        </figcaption>
      </figure>
      <div v-else-if="code === '140606'" class="bond-method__comparison">
        <div class="bond-method__pair">
          <figure v-for="view in waterViews" :key="view.key">
            <h4>{{ view.heading }}</h4>
            <svg viewBox="0 0 360 210" role="img" :aria-labelledby="uid + '-' + view.key">
              <title :id="uid + '-' + view.key">{{ view.description }}</title>
              <g v-for="(oxygen, index) in view.oxygens" :key="index">
                <path
                  :d="
                    'M' +
                    oxygen.x +
                    ' ' +
                    oxygen.y +
                    'l44 0M' +
                    oxygen.x +
                    ' ' +
                    oxygen.y +
                    'l-22 38'
                  "
                  fill="none"
                  stroke="#2453cd"
                  stroke-width="3"
                />
                <circle
                  :cx="oxygen.x"
                  :cy="oxygen.y"
                  r="15"
                  fill="#e2edff"
                  stroke="#2453cd"
                  stroke-width="1.5"
                />
                <circle
                  :cx="oxygen.x + 44"
                  :cy="oxygen.y"
                  r="10"
                  fill="white"
                  stroke="#2453cd"
                  stroke-width="1.5"
                />
                <circle
                  :cx="oxygen.x - 22"
                  :cy="oxygen.y + 38"
                  r="10"
                  fill="white"
                  stroke="#2453cd"
                  stroke-width="1.5"
                />
                <text :x="oxygen.x" :y="oxygen.y + 6" text-anchor="middle">O</text>
                <text
                  :x="oxygen.x + 44"
                  :y="oxygen.y + 5"
                  text-anchor="middle"
                  class="bond-method__hydrogen"
                >
                  H
                </text>
                <text
                  :x="oxygen.x - 22"
                  :y="oxygen.y + 43"
                  text-anchor="middle"
                  class="bond-method__hydrogen"
                >
                  H
                </text>
              </g>
              <template v-if="view.key === 'liquid'">
                <path
                  d="M126 105H214"
                  fill="none"
                  stroke="#087f76"
                  stroke-width="2"
                  stroke-dasharray="5 4"
                />
                <text x="171" y="62" text-anchor="middle">分子间氢键</text>
                <path d="M171 70V94" stroke="#087f76" stroke-width="1.5" />
              </template>
              <text v-else x="180" y="41" text-anchor="middle">分子间距增大</text>
              <text x="180" y="199" text-anchor="middle">每个分子的 O—H 共价键保留</text>
            </svg>
            <figcaption>{{ view.caption }}</figcaption>
          </figure>
        </div>
        <p class="bond-method__note">
          示意图不按真实距离或角度绘制；实线表示分子内共价键，虚线表示分子间氢键。气态图省略分子间作用，不表示发生了化学分解。
        </p>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  chemicalBondingMethods,
  type ChemicalBondingMethodCode,
} from '@/content/knowledge/chemicalBondingMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: ChemicalBondingMethodCode }>()
// 按知识点加载独立内容，基础分类不挂载旧版互动粒子图。
const lesson = computed(() => chemicalBondingMethods[props.code])
const uid = 'bond-method-' + useId()
const waterViews = [
  {
    key: 'liquid',
    heading: '液态：分子之间有作用',
    description: '两个水分子内都有两条 O—H 共价键；一个分子的 H 与另一分子的 O 之间标出氢键。',
    oxygens: [
      { x: 70, y: 105 },
      { x: 230, y: 105 },
    ],
    caption: '氢键连接不同分子，不是水分子内部的 O—H 共价键。',
  },
  {
    key: 'gas',
    heading: '气态：分子分开，内部键保留',
    description: '同样两个水分子分隔更远，各自的两条 O—H 共价键仍然保留。',
    oxygens: [
      { x: 65, y: 78 },
      { x: 270, y: 130 },
    ],
    caption: '沸腾主要克服分子间作用，水蒸气仍由 H₂O 分子组成。',
  },
]
</script>

<style scoped>
.bond-method__electron,
.bond-method__pair figure {
  margin: 12px auto;
  padding: 14px;
  border: 1px solid #d8e3f5;
  border-radius: 9px;
  background: #f6f9ff;
}
.bond-method__electron {
  max-width: 490px;
}
.bond-method__comparison {
  container-type: inline-size;
  max-width: 930px;
  margin: 12px auto;
}
.bond-method__pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.bond-method__pair figure {
  min-width: 0;
  margin: 0;
}
.bond-method__pair h4 {
  margin: 0 0 8px;
  color: #243e65;
  font-size: 16px;
  line-height: 1.6;
}
.bond-method__electron svg,
.bond-method__pair svg {
  display: block;
  width: 100%;
  height: auto;
}
.bond-method__electron svg text,
.bond-method__pair svg text {
  font-family: var(--font-sans);
  font-size: 16px;
  fill: #425574;
}
.bond-method__electron svg .bond-method__symbol {
  font-size: 27px;
  font-weight: 600;
}
.bond-method__electron svg .bond-method__cross {
  font-size: 22px;
  fill: #087f76;
}
.bond-method__pair svg .bond-method__hydrogen {
  font-size: 13px;
}
.bond-method__electron figcaption,
.bond-method__pair figcaption,
.bond-method__note {
  margin: 10px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
@container (max-width: 670px) {
  .bond-method__pair {
    grid-template-columns: 1fr;
  }
  .bond-method__pair figure {
    max-width: 440px;
    justify-self: center;
    padding: 12px;
  }
}
</style>
