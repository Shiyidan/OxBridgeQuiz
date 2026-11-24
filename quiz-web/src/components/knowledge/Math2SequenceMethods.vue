<!-- 数学2数列与级数讲义：推导与条件就近组织，仅为正负公比的收敛差异配图。 -->
<template>
  <KnowledgeMethodsArticle
    class="math2-sequence-methods"
    :lesson="lesson"
    label="数学2数列与级数：概念与方法"
  >
    <template #diagram>
      <div class="sequence-pair">
        <figure v-for="model in convergenceModels" :key="model.ratio" class="sequence-figure">
          <h4>{{ model.ratio > 0 ? 'r＝1/2：从下方接近' : 'r＝−1/2：交替接近' }}</h4>
          <svg viewBox="0 0 310 230" role="img" :aria-labelledby="uid + '-sum-' + model.ratio">
            <title :id="uid + '-sum-' + model.ratio">
              首项为1，{{
                model.ratio > 0
                  ? '公比为1/2，部分和1、3/2、7/4逐步接近2。'
                  : '公比为−1/2，部分和1、1/2、3/4在2/3的两侧交替接近。'
              }}图中点表示整数项数下的部分和，虚线为无穷和。
            </title>
            <path d="M40 25V190H285" fill="none" stroke="#64748b" stroke-width="1.5" />
            <path
              :d="`M40 ${model.limitY}H280`"
              fill="none"
              stroke="#bd7132"
              stroke-width="1.5"
              stroke-dasharray="4 4"
            />
            <polyline
              :points="model.points.map((point) => `${point.x},${point.y}`).join(' ')"
              fill="none"
              stroke="#9eb5e7"
              stroke-width="1.5"
            />
            <circle
              v-for="point in model.points"
              :key="point.n"
              :cx="point.x"
              :cy="point.y"
              r="3.5"
              fill="#2453cd"
            />
            <text x="44" y="18">部分和 Sₙ</text>
            <text x="275" :y="model.ratio > 0 ? 41 : 129" text-anchor="end">
              {{ model.ratio > 0 ? '极限 2' : '极限 2/3' }}
            </text>
            <text x="31" y="56" text-anchor="end">2</text>
            <text x="31" y="126" text-anchor="end">1</text>
            <text x="31" y="196" text-anchor="end">0</text>
            <text
              v-for="n in [1, 2, 4, 6, 8]"
              :key="n"
              :x="40 + n * 27"
              y="212"
              text-anchor="middle"
            >
              {{ n }}
            </text>
            <text x="287" y="213">n</text>
          </svg>
          <figcaption>
            {{
              model.ratio > 0
                ? '每一项为正，部分和持续增加；剩余尾项越来越小，因此趋向有限的和 2。'
                : '加入的项正负交替，部分和来回越过 2/3，但偏差越来越小，仍然收敛。'
            }}
          </figcaption>
        </figure>
        <p class="sequence-caption">
          两图均取 a＝1。圆点才是数列值；连接线仅帮助观察先后变化，不表示 n 可取非整数。
        </p>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  math2SequenceMethods,
  type Math2SequenceMethodCode,
} from '@/content/knowledge/math2SequenceMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: Math2SequenceMethodCode }>()
const uid = useId()
// 节点各自使用独立讲义与速记，不将等比图叠加到其他小节。
const lesson = computed(() => math2SequenceMethods[props.code])
// 保持两图坐标尺度相同，由有限和公式生成整数项数对应的点。
const convergenceModels = [0.5, -0.5].map((ratio) => ({
  ratio,
  limitY: 190 - 70 / (1 - ratio),
  points: Array.from({ length: 8 }, (_, index) => {
    const n = index + 1
    return { n, x: 40 + n * 27, y: 190 - (70 * (1 - ratio ** n)) / (1 - ratio) }
  }),
}))
</script>

<style scoped lang="scss">
.math2-sequence-methods {
  container-type: inline-size;
}
.math2-sequence-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.sequence-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-width: 660px;
  margin: 12px auto;
}
.sequence-figure {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.sequence-figure svg {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: 0 auto;
}
.sequence-figure svg text {
  fill: #344c6c;
  font-family: var(--font-family-base, sans-serif);
  font-size: 16px;
}
.sequence-figure h4 {
  margin: 0 0 8px;
  font-size: 16px;
}
.sequence-figure figcaption,
.sequence-caption {
  margin: 8px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
.sequence-caption {
  grid-column: 1 / -1;
}
@container (max-width: 580px) {
  .sequence-pair {
    grid-template-columns: 1fr;
    max-width: 350px;
  }
}
@media (max-width: 600px) {
  .sequence-figure {
    padding: 10px;
  }
}
</style>
