<!-- 比例因子与地图讲义：用紧凑的等距对照图说明复印前后的比例尺变化。 -->
<template>
  <KnowledgeMethodsArticle :lesson="scaleFactorsMethods" label="比例因子、比例图与地图的概念与方法">
    <template #diagram>
      <figure class="scale-comparison">
        <svg viewBox="0 0 480 168" role="img" aria-labelledby="scale-comparison-title scale-comparison-desc">
          <title id="scale-comparison-title">同一段实际距离，复印后的图上长度增加</title>
          <desc id="scale-comparison-desc">实际均为2千米。原图比例尺1比50000，图上长4厘米；放大到125%后，比例尺1比40000，图上长5厘米。下方线段是上方的1.25倍。</desc>
          <g fill="#344767" font-size="15">
            <text x="12" y="24">原图 · 1:50000</text>
            <text x="12" y="100">放大后 · 1:40000</text>
            <text x="288" y="24" text-anchor="middle">4 cm</text>
            <text x="313" y="100" text-anchor="middle">5 cm</text>
          </g>
          <g fill="none" stroke="#2454d6" stroke-width="3">
            <path d="M188 44H388 M188 36V52 M388 36V52" />
          </g>
          <g fill="none" stroke="#008578" stroke-width="3">
            <path d="M188 120H438 M188 112V128 M438 112V128" />
          </g>
          <g fill="#596b85" font-size="14">
            <text x="288" y="68" text-anchor="middle">对应实际 2 km</text>
            <text x="313" y="146" text-anchor="middle">仍对应实际 2 km</text>
          </g>
        </svg>
        <figcaption>线段仅表示长度比例，屏幕上的尺寸不作为量尺。</figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { scaleFactorsMethods } from '@/content/knowledge/scaleFactorsMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'
</script>

<style scoped lang="scss">
.scale-comparison {
  width: 100%;
  max-width: 520px;
  margin: 12px 0;
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  figcaption {
    margin-top: 4px;
    color: var(--color-ink-secondary, #596b85);
    font-size: 13px;
  }
}
</style>
