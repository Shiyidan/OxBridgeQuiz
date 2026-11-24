<!-- 数学2代数与函数讲义：方法用公式与短表，二次式与定义域配紧凑静态图。 -->
<template>
  <KnowledgeMethodsArticle
    class="math2-algebra-methods"
    :lesson="lesson"
    label="数学2代数与函数：概念与方法"
  >
    <template #diagram>
      <figure v-if="code === '120103'" class="algebra-figure algebra-figure--single">
        <svg viewBox="0 0 320 220" role="img" :aria-labelledby="uid + '-quadratic'">
          <title :id="uid + '-quadratic'">
            函数 y＝(x−1)²−4，根为−1和3，顶点为(1,−4)，对称轴 x＝1。
          </title>
          <path d="M25 85H292 M100 18V198" fill="none" stroke="#64748b" stroke-width="1.5" />
          <path d="M140 45V192 M100 173H140" fill="none" stroke="#98a8bb" stroke-dasharray="4 4" />
          <path :d="quadraticPath" fill="none" stroke="#2453cd" stroke-width="2.5" />
          <circle cx="60" cy="85" r="3.5" fill="#2453cd" />
          <circle cx="220" cy="85" r="3.5" fill="#2453cd" />
          <circle cx="140" cy="173" r="3.5" fill="#087f76" />
          <text x="288" y="25" text-anchor="end">y＝(x−1)²−4</text>
          <text x="60" y="107" text-anchor="middle">−1</text>
          <text x="220" y="107" text-anchor="middle">3</text>
          <text x="140" y="107" text-anchor="middle">1</text>
          <text x="90" y="179" text-anchor="end">−4</text>
          <text x="158" y="186">(1, −4)</text>
          <text x="90" y="103" text-anchor="end">0</text>
          <text x="293" y="105">x</text>
          <text x="85" y="21">y</text>
        </svg>
        <figcaption>
          因式式读出两个根 −1、3；顶点式读出最小值 −4。对称轴 x＝1
          同时位于两根中点，三种信息应相互吻合。
        </figcaption>
      </figure>

      <div v-else-if="code === '120107'" class="algebra-pair">
        <figure
          v-for="restricted in [false, true]"
          :key="String(restricted)"
          class="algebra-figure"
        >
          <h4>{{ restricted ? '限制 x≥0：一一对应' : 'x 为任意实数：多对一' }}</h4>
          <svg viewBox="0 0 300 225" role="img" :aria-labelledby="uid + '-domain-' + restricted">
            <title :id="uid + '-domain-' + restricted">
              {{
                restricted
                  ? 'y＝x²只取x≥0的分支，水平线y＝4只在x＝2处相交。'
                  : 'y＝x²在全体实数上，水平线y＝4在x＝−2和x＝2处各相交一次。'
              }}
            </title>
            <path d="M20 180H277 M140 20V190" fill="none" stroke="#64748b" stroke-width="1.5" />
            <path d="M20 60H277" fill="none" stroke="#bd7132" stroke-dasharray="4 4" />
            <path
              :d="restricted ? positiveSquarePath : fullSquarePath"
              fill="none"
              stroke="#2453cd"
              stroke-width="2.5"
            />
            <path d="M228 60V180" stroke="#98a8bb" stroke-dasharray="3 4" />
            <circle cx="228" cy="60" r="3.5" fill="#087f76" />
            <template v-if="!restricted">
              <path d="M52 60V180" stroke="#98a8bb" stroke-dasharray="3 4" />
              <circle cx="52" cy="60" r="3.5" fill="#087f76" />
              <text x="52" y="202" text-anchor="middle">−2</text>
            </template>
            <text x="228" y="202" text-anchor="middle">2</text>
            <text x="130" y="54" text-anchor="end">4</text>
            <text x="130" y="201" text-anchor="end">0</text>
            <text x="273" y="47" text-anchor="end">y＝4</text>
            <text x="273" y="24" text-anchor="end">y＝x²</text>
            <text x="280" y="196">x</text>
            <text x="125" y="20">y</text>
          </svg>
          <figcaption>
            {{
              restricted
                ? '每个非负输出只对应一个允许的输入；解 x²＝4 时只保留 x＝2。'
                : '两个不同输入 −2、2 给出相同输出 4；每个输入仍只有一个输出，因此它仍是函数。'
            }}
          </figcaption>
        </figure>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  math2AlgebraMethods,
  type Math2AlgebraMethodCode,
} from '@/content/knowledge/math2AlgebraMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: Math2AlgebraMethodCode }>()
const uid = useId()
// 节点切换时同步正文、图示和对应的定义域说明。
const lesson = computed(() => math2AlgebraMethods[props.code])
// 按真实函数值采样，确保顶点、零点与图中标记完全一致。
const quadraticPath = Array.from({ length: 101 }, (_, index) => {
  const x = -1.5 + index * 0.05
  return `${index ? 'L' : 'M'}${(100 + x * 40).toFixed(2)} ${(85 - ((x - 1) ** 2 - 4) * 22).toFixed(2)}`
}).join(' ')
// 两图保留相同坐标尺度，仅改变允许绘制的输入范围。
function squarePath(restricted: boolean) {
  const start = restricted ? 0 : -2.25
  return Array.from({ length: 101 }, (_, index) => {
    const x = start + ((2.25 - start) * index) / 100
    return `${index ? 'L' : 'M'}${(140 + x * 44).toFixed(2)} ${(180 - x ** 2 * 30).toFixed(2)}`
  }).join(' ')
}
const fullSquarePath = squarePath(false)
const positiveSquarePath = squarePath(true)
</script>

<style scoped lang="scss">
.math2-algebra-methods {
  container-type: inline-size;
}
.math2-algebra-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.algebra-figure {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.algebra-figure svg {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: 0 auto;
}
.algebra-figure svg text {
  fill: #344c6c;
  font-family: var(--font-family-base, sans-serif);
  font-size: 16px;
}
.algebra-figure h4 {
  margin: 0 0 8px;
  font-size: 16px;
}
.algebra-figure figcaption {
  margin-top: 8px;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
.algebra-figure--single {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  max-width: 620px;
  margin: 12px auto;
}
.algebra-figure--single figcaption {
  margin-top: 0;
}
.algebra-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-width: 640px;
  margin: 12px auto;
}
@container (max-width: 580px) {
  .algebra-figure--single {
    grid-template-columns: 1fr;
    max-width: 350px;
    gap: 8px;
  }
  .algebra-pair {
    grid-template-columns: 1fr;
  }
  .algebra-pair .algebra-figure {
    width: 100%;
    max-width: 340px;
    box-sizing: border-box;
    justify-self: center;
  }
}
@media (max-width: 600px) {
  .algebra-figure {
    padding: 10px;
  }
}
</style>
