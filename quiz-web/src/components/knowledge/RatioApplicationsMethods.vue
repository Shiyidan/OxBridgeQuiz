<!-- 比与比例后六节方法讲义：仅在正反比例关系处保留紧凑、标注明确的函数对照图。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="比与比例的概念与方法">
    <template #diagram>
      <figure class="ratio-functions">
        <svg viewBox="0 0 360 300" role="img" aria-labelledby="ratio-functions-title ratio-functions-desc">
          <title id="ratio-functions-title">正比例直线与反比例曲线</title>
          <desc id="ratio-functions-desc">正比例 y 等于 x 经过原点；反比例 y 等于 4 除以 x 在正数范围内下降。两图在点 2,2 相交，但相交不表示关系相同。</desc>
          <g stroke="#e2e8f2" stroke-width="1">
            <path v-for="tick in ticks" :key="tick" :d="`M${52 + tick * 40} 18V258 M52 ${258 - tick * 40}H300`" />
          </g>
          <path d="M52 14V258H308" fill="none" stroke="#6a7b94" stroke-width="1.5" />
          <g fill="#52627c" font-size="13">
            <text x="38" y="276">0</text>
            <template v-for="tick in [2, 4, 6]" :key="tick">
              <text :x="52 + tick * 40" y="278" text-anchor="middle">{{ tick }}</text>
              <text x="39" :y="263 - tick * 40" text-anchor="end">{{ tick }}</text>
            </template>
            <text x="318" y="263">x</text>
            <text x="38" y="16">y</text>
          </g>
          <path d="M52 258L292 18" fill="none" stroke="#2454d6" stroke-width="2.5" />
          <polyline :points="inversePoints" fill="none" stroke="#008578" stroke-width="2.5" stroke-dasharray="6 4" />
          <text x="199" y="39" fill="#2454d6" font-size="16">y = x</text>
          <text x="206" y="197" fill="#008578" font-size="16">y = 4/x</text>
          <circle cx="132" cy="178" r="3.5" fill="#344767" />
          <text x="142" y="169" fill="#344767" font-size="14">(2, 2)</text>
        </svg>
        <figcaption>交于同一点不代表关系相同：前者固定 y/x，后者固定 xy。</figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ratioApplicationsMethods, type RatioApplicationCode } from '@/content/knowledge/ratioApplicationsMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: RatioApplicationCode }>()
// 根据当前考纲节点同步切换正文，避免复用组件时保留上一节的方法内容。
const lesson = computed(() => ratioApplicationsMethods[props.code])
const ticks = [1, 2, 3, 4, 5, 6]
// 在正量范围采样 y=4/x，坐标轴采用相同刻度，曲线始终留在画布内。
const inversePoints = Array.from({ length: 81 }, (_, index) => {
  const x = 2 / 3 + (6 - 2 / 3) * index / 80
  return `${52 + x * 40},${258 - 4 / x * 40}`
}).join(' ')
</script>

<style scoped lang="scss">
.ratio-functions {
  max-width: 390px;
  margin: 14px 0;
  svg { display: block; width: 100%; height: auto; }
  figcaption {
    margin-top: 6px;
    font-size: 14px;
    line-height: 1.65;
    color: var(--color-ink-secondary, #52627c);
  }
}
</style>
