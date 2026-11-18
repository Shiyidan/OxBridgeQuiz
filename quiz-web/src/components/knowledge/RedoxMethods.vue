<!-- 氧化还原后五节讲义：仅歧化使用分叉与汇合对照图，其他节保持紧凑表格。 -->
<template>
  <KnowledgeMethodsArticle :lesson="lesson" label="氧化还原：概念与方法">
    <template #diagram>
      <div class="redox-comparison">
        <div class="redox-comparison__pair">
          <figure>
            <h4>歧化：同一起点分向两端</h4>
            <svg viewBox="0 0 360 190" role="img" :aria-labelledby="uid + '-split'">
              <title :id="uid + '-split'">
                H₂O₂ 中氧为负一，部分升至氧气中的零，部分降至水中的负二。
              </title>
              <defs>
                <marker
                  :id="uid + '-arrow-split'"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0L10 5L0 10Z" fill="#8191ab" />
                </marker>
              </defs>
              <path
                d="M89 94L255 45 M89 94L255 143"
                fill="none"
                stroke="#8191ab"
                stroke-width="2"
                :marker-end="'url(#' + uid + '-arrow-split)'"
              />
              <circle cx="62" cy="94" r="27" fill="#edf2ff" stroke="#2453cd" stroke-width="2" />
              <circle cx="284" cy="45" r="25" fill="#fff4e5" stroke="#ac7527" stroke-width="2" />
              <circle cx="284" cy="143" r="25" fill="#e9f7f3" stroke="#087f76" stroke-width="2" />
              <g text-anchor="middle">
                <text x="62" y="101" class="redox-comparison__value">−1</text>
                <text x="284" y="52" class="redox-comparison__value">0</text>
                <text x="284" y="150" class="redox-comparison__value">−2</text>
                <text x="62" y="49">H₂O₂ 中的 O</text>
                <text x="284" y="13">O₂</text>
                <text x="284" y="185">H₂O</text>
                <text x="164" y="50">升 1 · 氧化</text>
                <text x="164" y="153">降 1 · 还原</text>
              </g>
            </svg>
            <figcaption>比较同一种起始物质中的同一元素：一部分升价，一部分降价。</figcaption>
          </figure>
          <figure>
            <h4>归中：不同起点汇到中间</h4>
            <svg viewBox="0 0 360 190" role="img" :aria-labelledby="uid + '-merge'">
              <title :id="uid + '-merge'">
                C 与 CO₂ 中碳分别为零和正四，生成 CO 时都变为正二，不是歧化。
              </title>
              <defs>
                <marker
                  :id="uid + '-arrow-merge'"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0L10 5L0 10Z" fill="#8191ab" />
                </marker>
              </defs>
              <path
                d="M91 45L253 90 M91 143L253 100"
                fill="none"
                stroke="#8191ab"
                stroke-width="2"
                :marker-end="'url(#' + uid + '-arrow-merge)'"
              />
              <circle cx="62" cy="45" r="25" fill="#fff4e5" stroke="#ac7527" stroke-width="2" />
              <circle cx="62" cy="143" r="25" fill="#e9f7f3" stroke="#087f76" stroke-width="2" />
              <circle cx="284" cy="95" r="27" fill="#edf2ff" stroke="#2453cd" stroke-width="2" />
              <g text-anchor="middle">
                <text x="62" y="52" class="redox-comparison__value">0</text>
                <text x="62" y="150" class="redox-comparison__value">+4</text>
                <text x="284" y="102" class="redox-comparison__value">+2</text>
                <text x="62" y="13">C</text>
                <text x="62" y="185">CO₂ 中的 C</text>
                <text x="284" y="145">CO 中的 C</text>
                <text x="164" y="50">升 2 · 氧化</text>
                <text x="164" y="153">降 2 · 还原</text>
              </g>
            </svg>
            <figcaption>也有升价与降价，但来自不同起始氧化态；不能归为歧化。</figcaption>
          </figure>
        </div>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { redoxMethods, type RedoxMethodCode } from '@/content/knowledge/redoxMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: RedoxMethodCode }>()
// 每个考纲节点读取独立讲义；配图仅在需要比较分叉和汇合的区块出现。
const lesson = computed(() => redoxMethods[props.code])
const uid = 'redox-method-' + useId()
</script>

<style scoped>
.redox-comparison {
  container-type: inline-size;
  max-width: 900px;
  margin: 12px auto;
}
.redox-comparison__pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.redox-comparison figure {
  min-width: 0;
  margin: 0;
  padding: 14px;
  border: 1px solid #d8e3f5;
  border-radius: 9px;
  background: #f6f9ff;
}
.redox-comparison h4 {
  margin: 0 0 12px;
  color: #243e65;
  font-size: 16px;
  line-height: 1.6;
}
.redox-comparison svg {
  display: block;
  width: 100%;
  height: auto;
}
.redox-comparison svg text {
  font-family: var(--font-sans);
  font-size: 16px;
  fill: #425574;
}
.redox-comparison svg .redox-comparison__value {
  font-size: 21px;
  font-weight: 600;
}
.redox-comparison figcaption {
  margin-top: 12px;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
@container (max-width: 660px) {
  .redox-comparison__pair {
    grid-template-columns: 1fr;
  }
  .redox-comparison figure {
    max-width: 440px;
    justify-self: center;
    padding: 12px;
  }
}
</style>
