<!-- 物质概念与方法：紧凑气体图像、相变平台和分层液柱，基础粒子模型与密度使用短表。 -->
<template>
  <KnowledgeMethodsArticle class="matter-methods" :lesson="lesson" label="物质：概念与方法">
    <template #diagram>
      <div v-if="code === '130502'" class="matter-comparison">
        <div class="matter-pair">
          <figure v-for="inverse in [false, true]" :key="String(inverse)" class="matter-figure">
            <h4>{{ inverse ? '横轴改成体积的倒数' : '压强与体积成反比' }}</h4>
            <svg viewBox="0 0 290 215" role="img" :aria-labelledby="uid + '-gas-' + inverse">
              <title :id="uid + '-gas-' + inverse">
                固定量理想气体恒温时，{{
                  inverse
                    ? 'p/p₀ 对 V₀/V 是过原点直线。'
                    : 'p/p₀ 对 V/V₀ 是反比例曲线，体积加倍时压强减半。'
                }}
              </title>
              <path d="M40 18V170H272" fill="none" stroke="#64748b" stroke-width="1.5" />
              <path
                :d="inverse ? 'M40 170L265 20' : gasCurve"
                fill="none"
                stroke="#2453cd"
                stroke-width="2.5"
              />
              <path d="M40 110H130V170" fill="none" stroke="#98a8bb" stroke-dasharray="4 4" />
              <circle cx="130" cy="110" r="3.5" fill="#2453cd" />
              <template v-if="!inverse">
                <path d="M40 140H220V170" fill="none" stroke="#98a8bb" stroke-dasharray="4 4" />
                <circle cx="220" cy="140" r="3.5" fill="#2453cd" />
                <text x="32" y="146" text-anchor="end">0.5</text>
                <text x="220" y="190" text-anchor="middle">2</text>
              </template>
              <text x="48" y="20">p / p₀</text>
              <text x="27" y="188">0</text>
              <text x="32" y="116" text-anchor="end">1</text>
              <text x="130" y="190" text-anchor="middle">1</text>
              <text x="246" y="209" text-anchor="middle">{{ inverse ? 'V₀ / V' : 'V / V₀' }}</text>
            </svg>
            <figcaption>
              {{
                inverse
                  ? '取参考状态 p₀、V₀：p/p₀＝V₀/V。换横轴后才得到直线。'
                  : '取参考状态 p₀、V₀：当 V/V₀＝2，p/p₀＝0.5，乘积仍为 1。'
              }}
            </figcaption>
          </figure>
        </div>
      </div>

      <figure v-else-if="code === '130503'" class="matter-figure matter-figure--single">
        <svg viewBox="0 0 330 205" role="img" :aria-labelledby="uid + '-phase'">
          <title :id="uid + '-phase'">
            常压下纯冰以恒定净功率加热：AB 为冰升温，BC 在 0°C 熔化，CD 为全部熔化后的水升温。
          </title>
          <path d="M40 18V178H305" fill="none" stroke="#64748b" stroke-width="1.5" />
          <path
            d="M40 125H90 M90 125V178 M200 125V178"
            fill="none"
            stroke="#98a8bb"
            stroke-dasharray="4 4"
          />
          <path d="M40 155L90 125H200L280 65" fill="none" stroke="#2453cd" stroke-width="2.5" />
          <path d="M90 113V99H200V113" fill="none" stroke="#087f76" stroke-width="1.5" />
          <text x="48" y="22">T / °C</text>
          <text x="28" y="131">0</text>
          <text x="49" y="160">A</text>
          <text x="82" y="145">B</text>
          <text x="192" y="145">C</text>
          <text x="286" y="64">D</text>
          <text x="145" y="89" text-anchor="middle">Δt</text>
          <text x="90" y="197" text-anchor="middle">t₁</text>
          <text x="200" y="197" text-anchor="middle">t₂</text>
          <text x="307" y="191">t</text>
        </svg>
        <figcaption>
          常压纯冰加热示意：AB、CD 用各自物态的 mcΔT；BC
          温度不变但持续吸能，P净(t₂−t₁)＝mL。平台时长取差值，不能直接用 t₂。
        </figcaption>
      </figure>

      <figure v-else-if="code === '130505'" class="matter-figure matter-figure--single">
        <svg viewBox="0 0 320 210" role="img" :aria-labelledby="uid + '-pressure'">
          <title :id="uid + '-pressure'">
            测点 A 位于第二液层内；压强等于液面压强 p₀，加上全部第一层 h₁ 和第二层中 A 上方部分 h₂
            的液柱贡献。
          </title>
          <rect x="50" y="45" width="150" height="60" fill="#ffeadb" />
          <rect x="50" y="105" width="150" height="80" fill="#e4edff" />
          <path
            d="M50 32V185H200V32 M50 45H200 M50 105H200"
            fill="none"
            stroke="#7193c6"
            stroke-width="1.5"
          />
          <path d="M50 145H230" fill="none" stroke="#98a8bb" stroke-dasharray="4 4" />
          <circle cx="150" cy="145" r="4" fill="#2453cd" />
          <path
            d="M218 45H232 M225 45V105 M218 105H232 M225 105V145 M218 145H232"
            fill="none"
            stroke="#087f76"
            stroke-width="1.5"
          />
          <text x="125" y="26" text-anchor="middle">液面压强 p₀</text>
          <text x="85" y="80">ρ₁</text>
          <text x="85" y="166">ρ₂</text>
          <text x="160" y="140">A</text>
          <text x="242" y="80">h₁</text>
          <text x="242" y="131">h₂</text>
        </svg>
        <figcaption>
          ρ₂＞ρ₁，测点 A 在下层内部。h₂ 只从两层界面量到 A；A
          下方的液体不再加进液柱高度。pA＝p₀＋ρ₁gh₁＋ρ₂gh₂。
        </figcaption>
      </figure>
    </template>
  </KnowledgeMethodsArticle>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { matterMethods, type MatterMethodCode } from '@/content/knowledge/matterMethods'
import KnowledgeMethodsArticle from './KnowledgeMethodsArticle.vue'

const props = defineProps<{ code: MatterMethodCode }>()
const uid = useId()
// 每个知识点的正文独立组织，图示随叶节点同步切换。
const lesson = computed(() => matterMethods[props.code])
// 按 p/p₀＝1/(V/V₀) 采样，避免用任意曲线冒充反比例关系。
const gasCurve = Array.from({ length: 61 }, (_, index) => {
  const volumeRatio = 0.5 + index * (1.9 / 60)
  return `${index === 0 ? 'M' : 'L'}${40 + 90 * volumeRatio} ${170 - 60 / volumeRatio}`
}).join(' ')
</script>

<style scoped lang="scss">
.matter-methods {
  container-type: inline-size;
}
.matter-methods :deep(h3 > span) {
  flex-shrink: 0;
  white-space: nowrap;
}
.matter-figure {
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #d8e3ef;
  border-radius: 10px;
  background: #f8fbff;
}
.matter-figure--single {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  align-items: center;
  gap: 18px;
  max-width: 640px;
  margin: 12px auto;
}
.matter-figure > svg {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: auto;
}
.matter-figure > svg text {
  font-family: var(--font-sans);
  font-size: 16px;
  fill: #344c6c;
}
.matter-figure h4 {
  margin: 0 0 6px;
  color: #243e65;
  font-size: 16px;
}
.matter-figure figcaption {
  margin: 8px 0 0;
  color: #52627c;
  font-size: 14px;
  line-height: 1.7;
}
.matter-figure--single figcaption {
  margin: 0;
}
.matter-comparison {
  container-type: inline-size;
  max-width: 620px;
  margin: 12px auto;
}
.matter-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.matter-pair svg {
  max-width: 250px;
}
@container (max-width: 560px) {
  .matter-figure--single {
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
    max-width: 360px;
  }
  .matter-pair {
    grid-template-columns: 1fr;
  }
  .matter-pair figure {
    width: 100%;
    max-width: 330px;
    box-sizing: border-box;
    justify-self: center;
  }
}
@media (max-width: 600px) {
  .matter-figure {
    padding: 10px;
  }
  .matter-methods :deep(tbody th) {
    width: 30%;
  }
}
</style>
