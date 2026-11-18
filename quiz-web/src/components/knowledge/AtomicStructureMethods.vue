<!-- 原子结构讲义：仅结构定位与质谱读图配图，其余使用紧凑关系表和计算方法。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="原子结构：概念与方法">
    <template #diagram>
      <figure v-if="code === '140101'" class="atomic-figure">
        <svg viewBox="0 0 440 245" role="img" :aria-labelledby="`${uid}-atom`">
          <title :id="`${uid}-atom`">
            氦-4原子示意：核内两个质子和两个中子，核外两个电子，图不按比例
          </title>
          <ellipse
            cx="184"
            cy="116"
            rx="120"
            ry="82"
            fill="#f2f6ff"
            stroke="#a8bce7"
            stroke-width="1.5"
            stroke-dasharray="5 4"
          />
          <circle cx="184" cy="116" r="37" fill="#fff5e5" stroke="#c79b58" stroke-width="1.5" />
          <g v-for="particle in nucleons" :key="particle.x + '-' + particle.y">
            <circle
              :cx="particle.x"
              :cy="particle.y"
              r="14"
              :fill="particle.label === 'p⁺' ? '#e4eafa' : '#eee7f7'"
              :stroke="particle.label === 'p⁺' ? '#2453cd' : '#7958bb'"
            />
            <text :x="particle.x" :y="particle.y + 5" text-anchor="middle">
              {{ particle.label }}
            </text>
          </g>
          <g v-for="x in [64, 304]" :key="x">
            <circle :cx="x" cy="116" r="13" fill="#2453cd" />
            <text :x="x" y="121" text-anchor="middle" fill="white">e⁻</text>
          </g>
          <path
            d="M214 95L270 54H322 M315 116H336"
            fill="none"
            stroke="#7588a7"
            stroke-width="1.5"
          />
          <text x="326" y="59">原子核</text>
          <text x="340" y="121">电子</text>
          <text x="184" y="222" text-anchor="middle">2 个质子与 2 个电子的电荷相抵</text>
        </svg>
        <figcaption>
          以氦-4 为例。核被放大以显示组成；虚线表示电子层，不表示真实运动轨迹。
        </figcaption>
      </figure>
      <figure v-else-if="code === '140105'" class="atomic-figure">
        <svg viewBox="0 0 440 265" role="img" :aria-labelledby="`${uid}-spectrum`">
          <title :id="`${uid}-spectrum`">
            两种同位素的简化质谱：质荷比24与26，峰高100与25，对应丰度80%与20%
          </title>
          <text x="20" y="24">相对信号（最高峰＝100）</text>
          <path d="M55 42V208H408" fill="none" stroke="#7588a7" stroke-width="1.5" />
          <path d="M55 58H390 M55 170.5H390" fill="none" stroke="#d9e2f1" stroke-dasharray="4 4" />
          <g text-anchor="end">
            <text x="46" y="63">100</text>
            <text x="46" y="176">25</text>
            <text x="46" y="213">0</text>
          </g>
          <path d="M154 208V58" stroke="#2453cd" stroke-width="5" />
          <path d="M316 208V170.5" stroke="#087f76" stroke-width="5" />
          <g text-anchor="middle">
            <text x="154" y="230">24</text>
            <text x="235" y="230">25</text>
            <text x="316" y="230">26</text>
            <text x="184" y="84" fill="#2453cd">80%</text>
            <text x="345" y="155" fill="#087f76">20%</text>
          </g>
          <text x="392" y="250">m/z</text>
        </svg>
        <figcaption>
          假设样品只含两种同位素，均形成单电荷原子离子；峰高之和为 125，按题设信号比例计算丰度。
        </figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  atomicStructureMethods,
  type AtomicStructureMethodCode,
} from '@/content/knowledge/atomicStructureMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: AtomicStructureMethodCode }>()
// 章节入口与叶节点共享同一份正文，避免摘要和实际展示不一致。
const lesson = computed(() => atomicStructureMethods[props.code])
const uid = `atomic-method-${useId()}`
const nucleons = [
  { x: 170, y: 102, label: 'p⁺' },
  { x: 198, y: 102, label: 'n' },
  { x: 170, y: 130, label: 'n' },
  { x: 198, y: 130, label: 'p⁺' },
]
</script>

<style scoped>
.atomic-figure {
  width: 100%;
  max-width: 520px;
  box-sizing: border-box;
  margin: 12px auto;
  padding: 14px;
  background: var(--color-learning-blue-soft, #f2f6ff);
  border: 1px solid var(--color-line, #d9e2f1);
  border-radius: 10px;
}
.atomic-figure > svg {
  display: block;
  width: 100%;
  height: auto;
}
.atomic-figure > svg text {
  font-family: var(--font-sans);
  font-size: 16px;
}
.atomic-figure figcaption {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.65;
  color: var(--color-ink-soft, #52627c);
}
@media (max-width: 480px) {
  .atomic-figure {
    padding: 8px;
  }
}
</style>
