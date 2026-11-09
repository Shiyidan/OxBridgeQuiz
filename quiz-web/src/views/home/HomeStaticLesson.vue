<!-- 首页各科静态讲义：用学科图解和完整推理链展示课程深度，不包含参数或作答控件。 -->
<script setup lang="ts">
import { computed } from 'vue'
import KnowledgeText from '@/components/knowledge/KnowledgeText.vue'
import { homeStaticLessons } from './homeStaticLessons'

const props = defineProps<{ subject: string }>()
// 科目切换仅更换当前讲义及配图，所有展示内容均为静态。
const content = computed(() => homeStaticLessons[props.subject]!)
</script>

<template>
  <section class="static-lesson" :aria-label="content.subtitle">
    <header>
      <h3>{{ content.title }}</h3>
      <p>{{ content.subtitle }}</p>
    </header>
    <div class="lesson-spread">
      <div class="visual-column">
        <p class="given"><KnowledgeText :text="content.given" /></p>
        <svg
          v-if="subject === 'mathematics2'"
          viewBox="0 0 600 330"
          role="img"
          aria-label="抛物线y等于9减x平方与直线y等于5相交于横坐标负2和2，阴影表示两曲线之间的面积。"
        >
          <path d="M60 150 H540 M140 70 V250 M460 70 V250" class="guide" />
          <path d="M140 150 Q300 -10 460 150 Z" class="area" />
          <path d="M50 250 H555 M300 285 V25" class="axis" />
          <path d="M60 250 Q300 -110 540 250" class="curve" />
          <path d="M60 150 H540" class="teal-line" />
          <path d="M380 150 V90" class="slice" />
          <path d="M140 150 V250 M460 150 V250" class="dashed" />
          <circle cx="140" cy="150" r="5" class="dot" />
          <circle cx="460" cy="150" r="5" class="dot" />
          <text x="557" y="269">x</text>
          <text x="311" y="28">y</text>
          <text x="283" y="270">0</text>
          <text x="128" y="274">−2</text>
          <text x="454" y="274">2</text>
          <text x="278" y="146">5</text>
          <text x="380" y="44" class="blue-text">y = 9 − x²</text>
          <text x="490" y="140" class="teal-text">y = 5</text>
          <text x="391" y="112" class="small">4 − x²</text>
          <text x="229" y="115" class="small">积分区域</text>
        </svg>
        <svg
          v-else-if="subject === 'biology'"
          viewBox="0 0 600 330"
          role="img"
          aria-label="Aa与Aa杂交的四种等可能组合为AA、Aa、aA、aa。已知未患病后排除aa，剩下三个组合中两个为携带者。"
        >
          <text x="195" y="30" class="math">Aa × Aa</text>
          <text x="173" y="70">A</text>
          <text x="294" y="70">a</text>
          <text x="87" y="127">A</text>
          <text x="87" y="225">a</text>
          <rect x="120" y="84" width="120" height="92" rx="8" class="neutral-cell" />
          <rect x="248" y="84" width="120" height="92" rx="8" class="carrier-cell" />
          <rect x="120" y="184" width="120" height="92" rx="8" class="carrier-cell" />
          <rect x="248" y="184" width="120" height="92" rx="8" class="excluded-cell" />
          <text x="166" y="127" class="math">AA</text>
          <text x="294" y="127" class="math teal-text">Aa</text>
          <text x="166" y="227" class="math teal-text">aA</text>
          <text x="294" y="227" class="math muted">aa</text>
          <text x="158" y="153" class="small">非携带者</text>
          <text x="290" y="153" class="small">携带者</text>
          <text x="160" y="253" class="small">携带者</text>
          <text x="281" y="253" class="small muted">患病 · 排除</text>
          <path d="M265 260 L351 199" class="exclusion" />
          <path d="M390 120 H420 V235 H390 M420 178 H450" class="axis" />
          <text x="461" y="166" class="large teal-text">2/3</text>
          <text x="448" y="197" class="small">携带者概率</text>
          <text x="150" y="310" class="small">条件筛选：分母从 4 变成 3</text>
        </svg>
        <svg
          v-else-if="subject === 'chemistry'"
          viewBox="0 0 600 350"
          role="img"
          aria-label="放热反应能量图：反应物到未催化峰顶能垒150，产物到峰顶能垒250，焓变负100。催化路径峰顶较低，起终点不变。"
        >
          <path d="M55 25 V320 H560" class="axis" />
          <path d="M95 190 H525 M280 55 H515 M410 280 H525" class="guide" />
          <path d="M85 190 H130 C190 190 215 55 280 55 S375 280 440 280 H540" class="curve" />
          <path d="M85 190 H130 C190 190 190 140 280 140 S375 280 440 280 H540" class="teal-line" />
          <path d="M155 190 V55 M149 55 H161 M149 190 H161" class="energy-bar" />
          <path d="M490 280 V55 M484 55 H496 M484 280 H496" class="energy-bar" />
          <text x="107" y="133" class="blue-text">150</text>
          <text x="500" y="174" class="blue-text">250</text>
          <text x="83" y="214" class="small">反应物</text>
          <text x="430" y="312" class="small">产物</text>
          <text x="298" y="49" class="small blue-text">未催化路径</text>
          <text x="293" y="137" class="small teal-text">催化路径</text>
          <text x="63" y="24" class="small">能量 / kJ mol⁻¹</text>
          <text x="451" y="344" class="small">反应进程</text>
          <text x="230" y="272" class="small">ΔH = −100</text>
        </svg>
        <svg
          v-else-if="subject === 'physics'"
          viewBox="0 0 600 330"
          role="img"
          aria-label="6伏恒压电源与2千欧定值电阻、NTC热敏电阻串联。输出取NTC两端，阻值从4千欧降至1千欧时输出从4伏降至2伏。"
        >
          <path d="M115 140 V45 H330 V75 M330 125 V175 M330 225 V280 H115 V170" class="circuit" />
          <path d="M91 140 H139 M101 157 H129 M115 157 V170" class="circuit" />
          <rect x="315" y="75" width="30" height="50" class="resistor" />
          <rect x="315" y="175" width="30" height="50" class="sensor" />
          <path d="M303 235 H310 L352 168" class="teal-line" />
          <path
            d="M330 150 H410 M330 280 H410 M415 158 V272 M410 158 H420 M410 272 H420"
            class="guide"
          />
          <circle cx="330" cy="150" r="4" class="dot" />
          <circle cx="330" cy="280" r="4" class="dot" />
          <text x="52" y="166" class="math">6 V</text>
          <text x="355" y="106">R = 2 kΩ</text>
          <text x="198" y="200" class="teal-text">NTC</text>
          <text x="186" y="224" class="small">4 → 1 kΩ</text>
          <text x="430" y="205" class="math">Vout</text>
          <text x="430" y="232" class="teal-text">4 V → 2 V</text>
          <text x="185" y="32" class="small">串联电流 I</text>
          <path d="M212 45 H250 l-8 -5 M250 45 l-8 5" class="teal-line" />
          <text x="161" y="315" class="small">升温 → 阻值下降 → 输出电压下降</text>
        </svg>
        <svg
          v-else-if="subject === 'tmua-logic'"
          viewBox="0 0 600 330"
          role="img"
          aria-label="实数轴上，P为x大于2，Q为x小于负2或x大于2。P包含于Q；负3满足Q却不满足P，构成逆命题的反例。"
        >
          <path d="M70 110 H550 M70 225 H550" class="axis" />
          <path d="M210 80 V245 M410 80 V245" class="guide" />
          <path d="M414 110 H548 M410 225 H548 M72 225 H206" class="curve" />
          <path
            d="M540 104 L549 110 L540 116 M540 219 L549 225 L540 231 M80 219 L71 225 L80 231"
            class="curve"
          />
          <circle cx="410" cy="110" r="5" fill="white" stroke="#397ed0" stroke-width="2" />
          <circle cx="410" cy="225" r="5" fill="white" stroke="#397ed0" stroke-width="2" />
          <circle cx="210" cy="225" r="5" fill="white" stroke="#397ed0" stroke-width="2" />
          <text x="72" y="75" class="math">P : x &gt; 2</text>
          <text x="72" y="190" class="math">Q : x² &gt; 4</text>
          <text x="198" y="136">−2</text>
          <text x="405" y="136">2</text>
          <text x="198" y="250">−2</text>
          <text x="405" y="250">2</text>
          <path d="M480 128 V202 l-5 -8 M480 202 l5 -8" class="teal-line" />
          <text x="494" y="167" class="small teal-text">P ⇒ Q</text>
          <circle cx="160" cy="225" r="13" class="halo" />
          <circle cx="160" cy="225" r="4" class="teal-dot" />
          <text x="100" y="285" class="small teal-text">反例 x = −3</text>
          <text x="340" y="285" class="small">Q 成立，P 不成立</text>
        </svg>
        <svg
          v-else
          viewBox="0 0 600 330"
          role="img"
          aria-label="在负2到2的输入区间，F(u)=u平方减u的最小值在u等于二分之一处为负四分之一，最大值在负2处为6。"
        >
          <path d="M80 77 V245 M440 189 V245 M80 77 H260" class="guide" />
          <path d="M55 245 H545 M260 290 V35" class="axis" />
          <path d="M80 245 V77 Q260 357 440 189 V245 Z" class="soft-area" />
          <path d="M80 77 Q260 357 440 189" class="curve" />
          <circle cx="80" cy="77" r="6" class="dot" />
          <circle cx="440" cy="189" r="5" class="dot" />
          <circle cx="305" cy="252" r="12" class="halo" />
          <circle cx="305" cy="252" r="4" class="teal-dot" />
          <text x="61" y="60" class="blue-text">(−2, 6)</text>
          <text x="451" y="186">(2, 2)</text>
          <text x="320" y="281" class="teal-text">(½, −¼)</text>
          <text x="72" y="271">−2</text>
          <text x="433" y="271">2</text>
          <text x="242" y="268">0</text>
          <text x="550" y="251">u</text>
          <text x="274" y="37">F(u)</text>
          <text x="334" y="79" class="blue-text">F(u) = u² − u</text>
          <text x="180" y="316" class="small">外层输入限定在 [−2, 2]</text>
        </svg>
        <p class="caption"><KnowledgeText :text="content.caption" /></p>
      </div>
      <div class="reasoning-column">
        <div v-for="step in content.steps" :key="step.label" class="reasoning-step">
          <span>{{ step.label }}</span
          ><KnowledgeText :text="step.text" />
        </div>
        <div class="conclusion"><KnowledgeText :text="content.conclusion" /></div>
        <p class="boundary">{{ content.boundary }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.static-lesson {
  padding: 22px 28px;
  color: #17262e;
}
h3 {
  margin: 0 0 6px;
  font-size: 23px;
  line-height: 1.4;
  letter-spacing: -0.5px;
}
header p {
  margin: 0;
  font-size: 12px;
  color: #718397;
}
.lesson-spread {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(340px, 1.05fr);
  gap: 28px;
  align-items: center;
  margin-top: 20px;
}
.visual-column,
.reasoning-column {
  min-width: 0;
}
.given,
.caption {
  margin: 0;
  font-size: 13px;
  color: #526b81;
  line-height: 1.7;
}
svg {
  display: block;
  width: 100%;
  height: 250px;
  margin: 6px 0;
  overflow: visible;
}
svg text {
  fill: #526b81;
  font-size: 16px;
  font-family: inherit;
}
svg .small {
  font-size: 13px;
}
svg .math {
  font:
    22px Georgia,
    serif;
}
svg .large {
  font:
    32px Georgia,
    serif;
}
.axis {
  fill: none;
  stroke: #9db1c3;
  stroke-width: 1.3;
}
.guide {
  fill: none;
  stroke: #cbd9e6;
  stroke-width: 1;
  stroke-dasharray: 4 4;
}
.dashed {
  fill: none;
  stroke: #8aaacb;
  stroke-dasharray: 4 4;
}
.curve {
  fill: none;
  stroke: #397ed0;
  stroke-width: 2.5;
}
.teal-line {
  fill: none;
  stroke: #21978e;
  stroke-width: 2.5;
}
.area {
  fill: #e1eefb;
}
.soft-area {
  fill: #f0f5fc;
}
.slice {
  stroke: #abc938;
  stroke-width: 7;
  opacity: 0.8;
}
.dot {
  fill: #397ed0;
  stroke: white;
  stroke-width: 2;
}
.teal-dot {
  fill: #288a7e;
}
.halo {
  fill: #eafaaf;
}
svg .blue-text {
  fill: #397ed0;
}
svg .teal-text {
  fill: #21897f;
}
svg .muted {
  fill: #98a6b2;
}
.neutral-cell {
  fill: #f5f8fc;
  stroke: #d7e3f0;
}
.carrier-cell {
  fill: #eaf6f2;
  stroke: #b4dcd2;
}
.excluded-cell {
  fill: #f7f8fa;
  stroke: #d8dfe7;
  stroke-dasharray: 4 4;
}
.exclusion {
  stroke: #b7c2ce;
  stroke-width: 1.5;
}
.energy-bar {
  stroke: #8ca7c2;
  fill: none;
  stroke-width: 1.3;
}
.circuit {
  fill: none;
  stroke: #53718b;
  stroke-width: 2;
}
.resistor {
  fill: #edf3fb;
  stroke: #53718b;
  stroke-width: 2;
}
.sensor {
  fill: #eaf6f2;
  stroke: #21978e;
  stroke-width: 2;
}
.reasoning-column {
  padding-left: 26px;
  border-left: 1px solid #e5edf4;
}
.reasoning-step {
  display: grid;
  gap: 7px;
  margin-bottom: 17px;
  font-size: 14px;
  line-height: 1.7;
}
.reasoning-step > span:first-child {
  font-size: 11px;
  font-weight: 600;
  color: #718397;
}
.conclusion {
  border-left: 2px solid #c7e95b;
  padding: 12px 14px;
  background: linear-gradient(90deg, #f5f9eb, #fbfcf9);
  font-size: 14px;
  line-height: 1.8;
}
.boundary {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.8;
  color: #718397;
}
@media (max-width: 1200px) {
  .static-lesson {
    padding: 18px;
  }
  .lesson-spread {
    gap: 18px;
    grid-template-columns: minmax(230px, 1fr) minmax(300px, 1.1fr);
  }
  .reasoning-column {
    padding-left: 18px;
  }
  .reasoning-step {
    font-size: 12px;
  }
  .given,
  .caption {
    font-size: 12px;
  }
}
</style>
