<!-- 力学概念与方法：紧凑静态图解释面积、受力和下落状态，其余内容使用关系表与公式。 -->
<template>
  <KnowledgeMethodsArticle class="mechanics-methods" :lesson="lesson" label="力学：概念与方法">
    <template #diagram>
      <figure v-if="code === '130301'" class="mechanics-figure mechanics-figure--single">
        <svg viewBox="0 0 330 220" role="img" :aria-labelledby="uid + '-velocity'">
          <title :id="uid + '-velocity'">
            速度由 0 秒时的 4 m/s 匀减至 6 秒时的 −2 m/s，4 秒过零；正面积 8 m，负面积大小 2 m。
          </title>
          <path d="M40 130V30L200 130Z" fill="#e4edff" />
          <path d="M200 130H280V180Z" fill="#ffeddf" />
          <path d="M40 18V192 M40 130H307" fill="none" stroke="#64748b" stroke-width="1.5" />
          <path d="M40 30L280 180" fill="none" stroke="#2453cd" stroke-width="2.5" />
          <path d="M280 130V180H40" fill="none" stroke="#9aa9bb" stroke-dasharray="4 4" />
          <g fill="#344c6c">
            <text x="46" y="18">v / (m/s)</text>
            <text x="296" y="155">t / s</text>
            <text x="29" y="35" text-anchor="end">4</text>
            <text x="29" y="135" text-anchor="end">0</text>
            <text x="29" y="185" text-anchor="end">−2</text>
            <text x="200" y="151" text-anchor="middle">4</text>
            <text x="280" y="122" text-anchor="middle">6</text>
            <text x="92" y="105">＋8 m</text>
            <text x="228" y="148">−2 m</text>
          </g>
        </svg>
        <figcaption>
          0–4 s 沿正方向走 8 m，4–6 s 反向走 2 m：位移为 6 m，路程为 10 m。斜率始终为 −1
          m/s²，过零后速率反而增大。
        </figcaption>
      </figure>

      <figure v-else-if="code === '130302'" class="mechanics-figure mechanics-figure--single">
        <svg viewBox="0 0 320 200" role="img" :aria-labelledby="uid + '-forces'">
          <title :id="uid + '-forces'">
            水平面物块受向上支持力 N、向下重力 mg、向右拉力 10 N 和向左摩擦力 6
            N，竖直无加速度，合力向右 4 N。
          </title>
          <rect x="130" y="80" width="60" height="40" rx="4" fill="#edf3ff" stroke="#7193c6" />
          <g fill="none" stroke="#2453cd" stroke-width="2">
            <path d="M160 80V25L154 33 M160 25L166 33" />
            <path d="M160 120V175L154 167 M160 175L166 167" />
            <path d="M190 100H280L272 94 M280 100L272 106" />
          </g>
          <path
            d="M130 100H76L84 94 M76 100L84 106"
            fill="none"
            stroke="#b17844"
            stroke-width="2"
          />
          <text x="173" y="42">N</text>
          <text x="173" y="171">mg</text>
          <text x="220" y="83">10 N</text>
          <text x="62" y="83">6 N</text>
          <text x="160" y="106" text-anchor="middle">物块</text>
        </svg>
        <figcaption>
          竖直无加速度，所以 N＝mg；水平方向合力为 10−6＝4
          N，向右。图中只画物块受力，没有把运动方向或反作用力混进来。
        </figcaption>
      </figure>

      <figure v-else-if="code === '130303'" class="mechanics-figure mechanics-figure--single">
        <svg viewBox="0 0 320 205" role="img" :aria-labelledby="uid + '-spring'">
          <title :id="uid + '-spring'">
            线性弹簧从零伸长加载至 0.03 m，弹力增至 6 N；斜率 200 N/m，三角形面积 0.09 J。
          </title>
          <path d="M50 155L230 35V155Z" fill="#e4edff" />
          <path d="M50 17V155H285" fill="none" stroke="#64748b" stroke-width="1.5" />
          <path d="M50 155L230 35" fill="none" stroke="#2453cd" stroke-width="2.5" />
          <path d="M50 35H230V155" fill="none" stroke="#91aacd" stroke-dasharray="4 4" />
          <text x="9" y="22">F / N</text>
          <text x="32" y="41">6</text>
          <text x="32" y="174">0</text>
          <text x="230" y="176" text-anchor="middle">0.03</text>
          <text x="272" y="196">x / m</text>
          <text x="139" y="137">0.09 J</text>
        </svg>
        <figcaption>
          斜率给 k＝6/0.03＝200 N/m；面积给储能 ½×6×0.03＝0.09 J。一个看“陡不陡”，一个看“面积多少”。
        </figcaption>
      </figure>

      <div v-else-if="code === '130305'" class="mechanics-comparison">
        <div class="mechanics-pair">
          <figure
            v-for="terminal in [false, true]"
            :key="String(terminal)"
            class="mechanics-figure"
          >
            <h4>{{ terminal ? '达到终端速度' : '向下加速阶段' }}</h4>
            <svg viewBox="0 0 230 190" role="img" :aria-labelledby="uid + '-fall-' + terminal">
              <title :id="uid + '-fall-' + terminal">
                忽略浮力，{{
                  terminal
                    ? '阻力等于重力，物体匀速向下运动。'
                    : '阻力小于重力，合力向下，物体下落加速。'
                }}
              </title>
              <circle cx="94" cy="90" r="14" fill="#edf3ff" stroke="#7193c6" />
              <path
                d="M94 104V164L88 156 M94 164L100 156"
                fill="none"
                stroke="#2453cd"
                stroke-width="2.5"
              />
              <path
                :d="terminal ? 'M94 76V16L88 24 M94 16L100 24' : 'M94 76V46L88 54 M94 46L100 54'"
                fill="none"
                stroke="#087f76"
                stroke-width="2.5"
              />
              <path
                d="M177 75V129L172 122 M177 129L182 122"
                fill="none"
                stroke="#64748b"
                stroke-width="1.5"
                stroke-dasharray="4 3"
              />
              <text x="111" :y="terminal ? 31 : 57">D</text>
              <text x="111" y="153">mg</text>
              <text x="188" y="107">v</text>
            </svg>
            <figcaption>
              {{ terminal ? 'D＝mg，a＝0；仍向下运动。' : 'D＜mg，合力和加速度向下。' }}
            </figcaption>
          </figure>
        </div>
        <p class="mechanics-caption">实线箭头表示力，虚线箭头表示速度；两状态的重量相同。</p>
      </div>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { mechanicsMethods, type MechanicsMethodCode } from '@/content/knowledge/mechanicsMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: MechanicsMethodCode }>()
const uid = useId()
// 每个叶节点使用独立讲义；切换时正文、图示和速记保持同一知识点。
const lesson = computed(() => mechanicsMethods[props.code])
</script>

<style scoped lang="scss">
.mechanics-methods {
  container-type: inline-size;
}
.mechanics-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.mechanics-figure {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.mechanics-figure--single {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  max-width: 640px;
  margin: 12px auto;
}
.mechanics-figure > svg {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: auto;
}
.mechanics-figure > svg text {
  font-family: var(--font-sans);
  font-size: 16px;
  fill: #344c6c;
}
.mechanics-figure h4 {
  margin: 0 0 6px;
  color: #243e65;
  font-size: 16px;
}
.mechanics-figure figcaption,
.mechanics-caption {
  margin: 8px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
.mechanics-figure--single figcaption {
  margin: 0;
}
.mechanics-comparison {
  container-type: inline-size;
  max-width: 600px;
  margin: 12px auto;
}
.mechanics-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.mechanics-pair svg {
  max-width: 210px;
}
@container (max-width: 560px) {
  .mechanics-figure--single {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    max-width: 360px;
  }
  .mechanics-pair {
    grid-template-columns: 1fr;
  }
  .mechanics-pair figure {
    width: 100%;
    max-width: 320px;
    box-sizing: border-box;
    justify-self: center;
  }
}
@media (max-width: 600px) {
  .mechanics-figure {
    padding: 10px;
  }
  .mechanics-methods :deep(tbody th) {
    width: 27%;
  }
}
</style>
