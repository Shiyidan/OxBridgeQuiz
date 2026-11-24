<!-- 数学2坐标几何讲义：平移直线、垂径与切线弦角采用紧凑图文，其他条件用公式和短表。 -->
<template>
  <KnowledgeMethodsArticle
    class="math2-coordinate-methods"
    :lesson="lesson"
    label="数学2坐标几何：概念与方法"
  >
    <template #diagram="{ block }">
      <figure v-if="code === '120302'" class="coordinate-figure">
        <svg viewBox="0 0 310 220" role="img" :aria-labelledby="uid + '-extreme'">
          <title :id="uid + '-extreme'">
            一族平行直线移动经过圆，两条边界切线给出线性表达式的最大值与最小值；切点的半径与切线垂直。
          </title>
          <circle cx="120" cy="110" r="65" fill="#edf3ff" stroke="#91aad3" stroke-width="1.8" />
          <path
            d="M56 62L184 158"
            fill="none"
            stroke="#98a8bb"
            stroke-width="1.5"
            stroke-dasharray="4 4"
          />
          <path
            d="M107 19L223 106 M37 129L125 195"
            fill="none"
            stroke="#2453cd"
            stroke-width="2.5"
          />
          <path
            d="M120 110L159 58 M153 66L161 72L167 64"
            fill="none"
            stroke="#087f76"
            stroke-width="1.8"
          />
          <circle cx="120" cy="110" r="3" fill="#344c6c" />
          <circle cx="159" cy="58" r="3" fill="#087f76" />
          <circle cx="81" cy="162" r="3" fill="#2453cd" />
          <text x="102" y="107">O</text>
          <text x="170" y="54">T</text>
          <text x="146" y="97">r</text>
          <text x="214" y="63">最大值</text>
          <text x="135" y="200">最小值</text>
        </svg>
        <figcaption>
          目标式 px＋qy＝k
          表示一族平行直线。灰线穿过圆时仍可继续移动；移到蓝色切线处，再向外移就没有公共点，因此这里给出可取值的边界。
        </figcaption>
      </figure>

      <figure v-else-if="block.title.startsWith('圆心向弦')" class="coordinate-figure">
        <svg viewBox="0 0 300 205" role="img" :aria-labelledby="uid + '-chord'">
          <title :id="uid + '-chord'">
            圆心 O 向弦 AB 作垂线，垂足 M 平分 AB；半径 OB、弦心距 OM 和半弦 MB 构成直角三角形。
          </title>
          <circle cx="145" cy="100" r="72" fill="none" stroke="#91aad3" stroke-width="1.8" />
          <path d="M145 100L145 136H207.354Z" fill="#e4edff" stroke="none" />
          <path
            d="M82.646 136H207.354 M145 100L207.354 136"
            fill="none"
            stroke="#2453cd"
            stroke-width="2.5"
          />
          <path d="M145 100V136 M145 126H155V136" fill="none" stroke="#087f76" stroke-width="1.8" />
          <circle cx="145" cy="100" r="3" fill="#344c6c" />
          <text x="128" y="95">O</text>
          <text x="67" y="150">A</text>
          <text x="216" y="150">B</text>
          <text x="140" y="157">M</text>
          <text x="128" y="121">d</text>
          <text x="186" y="111">r</text>
          <text x="176" y="157">l</text>
        </svg>
        <figcaption>
          先用垂径定理得到 AM＝MB＝l，再由 d²＋l²＝r² 求 l。题目若问整条弦 AB，最后还要乘
          2；无需先求两个交点坐标。
        </figcaption>
      </figure>

      <figure v-else class="coordinate-figure">
        <svg viewBox="0 0 310 215" role="img" :aria-labelledby="uid + '-alternate'">
          <title :id="uid + '-alternate'">
            切线在 A 处水平，弦 AB 向右上；右侧切线射线与 AB 的夹角等于圆周角
            ACB。左侧切线射线形成的是其补角。
          </title>
          <circle cx="145" cy="105" r="70" fill="none" stroke="#91aad3" stroke-width="1.8" />
          <path d="M30 175H280" fill="none" stroke="#087f76" stroke-width="2.5" />
          <path d="M145 175L205.622 70H84.378Z" fill="none" stroke="#2453cd" stroke-width="2.2" />
          <path
            d="M169 175A24 24 0 0 0 157 154.215 M108.378 70A24 24 0 0 1 96.378 90.785"
            fill="none"
            stroke="#bd7132"
            stroke-width="1.8"
          />
          <text x="134" y="198">A</text>
          <text x="214" y="66">B</text>
          <text x="65" y="66">C</text>
          <text x="167" y="157">θ</text>
          <text x="112" y="94">θ</text>
          <text x="244" y="198">切线</text>
        </svg>
        <figcaption>
          弦 AB 是两个角共同对应的弦。图中取 A 右侧的切线射线，与 ∠ACB
          相等；若改取左侧射线，夹角应为 180°−θ。
        </figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  math2CoordinateMethods,
  type Math2CoordinateMethodCode,
} from '@/content/knowledge/math2CoordinateMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: Math2CoordinateMethodCode }>()
const uid = useId()
// 每个节点独立组织直线、圆方程与圆性质，图示只出现于对应方法下。
const lesson = computed(() => math2CoordinateMethods[props.code])
</script>

<style scoped lang="scss">
.math2-coordinate-methods {
  container-type: inline-size;
}
.math2-coordinate-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.coordinate-figure {
  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  max-width: 620px;
  min-width: 0;
  margin: 12px auto;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.coordinate-figure svg {
  display: block;
  width: 100%;
  max-width: 290px;
  height: auto;
  margin: 0 auto;
}
.coordinate-figure svg text {
  fill: #344c6c;
  font-family: var(--font-family-base, sans-serif);
  font-size: 16px;
}
.coordinate-figure figcaption {
  margin: 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
@container (max-width: 560px) {
  .coordinate-figure {
    grid-template-columns: 1fr;
    max-width: 350px;
    gap: 8px;
  }
}
@media (max-width: 600px) {
  .coordinate-figure {
    padding: 10px;
  }
}
</style>
