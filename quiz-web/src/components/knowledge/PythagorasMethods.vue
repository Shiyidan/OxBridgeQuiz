<!-- 勾股复习讲义：按公式、应用、特殊比例和考场检查组织数学1知识点。 -->
<template>
  <div class="pythagoras-review">
    <header class="review-intro">
      <div class="review-intro__copy">
        <span>考点梳理</span>
        <h5>勾股题的关键，是认出哪条关系值得计算</h5>
        <p>先确认直角，再判断目标是长度、平方还是比例。能在平方层面消元或比较时，就不必急着开方。</p>
      </div>
      <div class="review-route" aria-label="勾股解题顺序">
        <div><strong>01</strong><span>识别直角</span></div>
        <div><strong>02</strong><span>选择关系</span></div>
        <div><strong>03</strong><span>保留精确值</span></div>
      </div>
    </header>

    <section class="review-section" aria-labelledby="pythagoras-formulas">
      <div class="review-heading"><span>01</span><h5 id="pythagoras-formulas">两个公式、三种变形</h5></div>
      <div class="formula-grid">
        <article v-for="(item, index) in pythagorasMethods.formulas" :key="item.title" class="formula-block">
          <div class="formula-block__copy">
            <h6>{{ item.title }}</h6>
            <p class="formula-block__equation"><KnowledgeText :text="item.formula" /></p>
            <p><KnowledgeText :text="item.detail" /></p>
          </div>
          <svg v-if="index === 0" class="formula-diagram" viewBox="0 0 160 120" role="img" aria-label="直角三角形两条直角边为 a、b，斜边为 c">
            <path class="formula-diagram__plane" d="M 22 98 H 130 V 22 Z" />
            <path class="formula-diagram__right" d="M 118 98 V 86 H 130" />
            <text x="69" y="115">a</text><text x="136" y="64">b</text><text x="58" y="54">c</text>
          </svg>
          <svg v-else class="formula-diagram" viewBox="0 0 160 120" role="img" aria-label="长方体互相垂直的三条棱为 x、y、z，空间对角线为 d">
            <path class="formula-diagram__solid" d="M 20 99 H 91 L 127 78 V 26 H 56 L 20 47 Z M 20 47 H 91 L 127 26 M 91 47 V 99 M 20 99 L 56 78 H 127 M 56 78 V 26" />
            <path class="formula-diagram__base" d="M 20 99 L 127 78" />
            <path class="formula-diagram__diagonal" d="M 20 99 L 127 26" />
            <text x="52" y="116">x</text><text x="107" y="100">y</text><text x="7" y="75">z</text><text x="75" y="52">d</text>
          </svg>
        </article>
      </div>
      <div class="transform-list">
        <article v-for="item in pythagorasMethods.transformations" :key="item.title" class="transform-row">
          <h6>{{ item.title }}</h6>
          <p class="transform-row__formula"><KnowledgeText :text="item.formula" /></p>
          <p><KnowledgeText :text="item.detail" /></p>
        </article>
      </div>
      <p class="review-note"><strong>别把平方关系当成线性关系</strong><KnowledgeText :text="nonlinearNote" /></p>
    </section>

    <section class="review-section" aria-labelledby="pythagoras-scenarios">
      <div class="review-heading"><span>02</span><h5 id="pythagoras-scenarios">嵌入场景：从题目条件识别勾股</h5></div>
      <div class="scenario-list">
        <article v-for="(item, index) in pythagorasMethods.scenarios" :key="item.title" class="scenario">
          <span class="scenario__index">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <h6>{{ item.title }}</h6>
            <p v-if="'formula' in item" class="scenario__formula"><KnowledgeText :text="item.formula" /></p>
            <p><KnowledgeText :text="item.detail" /></p>
          </div>
        </article>
      </div>
    </section>

    <section class="review-section" aria-labelledby="pythagoras-triangles">
      <div class="review-heading"><span>03</span><h5 id="pythagoras-triangles">两个需要熟练识别的特殊三角形</h5></div>
      <div class="triangle-grid">
        <article v-for="(item, index) in pythagorasMethods.triangles" :key="item.title" class="triangle">
          <div class="triangle__copy">
            <h6>{{ item.title }}</h6>
            <p class="triangle__ratio"><KnowledgeText :text="item.formula" /></p>
            <p><KnowledgeText :text="item.detail" /></p>
            <p class="triangle__takeaway"><KnowledgeText :text="item.takeaway" /></p>
          </div>
          <svg v-if="index === 0" viewBox="0 0 150 120" role="img" aria-label="30、60、90度直角三角形，短边、长边、斜边之比为1、根号3、2">
            <path d="M 22 100 H 126 L 126 40 Z" />
            <path class="triangle__right" d="M 116 100 V 90 H 126" />
            <text x="24" y="92">30°</text><text x="102" y="55">60°</text>
            <text x="62" y="116">√3</text><text x="130" y="75">1</text><text x="59" y="59">2</text>
          </svg>
          <svg v-else viewBox="0 0 150 120" role="img" aria-label="45、45、90度等腰直角三角形，两条直角边为1，斜边为根号2">
            <path d="M 22 100 H 112 V 10 Z" />
            <path class="triangle__right" d="M 102 100 V 90 H 112" />
            <text x="26" y="92">45°</text><text x="88" y="30">45°</text>
            <text x="62" y="116">1</text><text x="117" y="58">1</text><text x="50" y="48">√2</text>
          </svg>
        </article>
      </div>
    </section>

    <section class="review-section" aria-labelledby="pythagoras-triples">
      <div class="review-heading"><span>04</span><h5 id="pythagoras-triples">勾股数：快速识别与验算</h5></div>
      <div class="triples"><span v-for="triple in pythagorasMethods.triples" :key="triple"><KnowledgeText :text="triple" /></span></div>
      <p><KnowledgeText :text="triplesNote" /></p>
    </section>

    <section class="review-section" aria-labelledby="pythagoras-pitfalls">
      <div class="review-heading"><span>05</span><h5 id="pythagoras-pitfalls">ESAT 风格易错点</h5></div>
      <div class="pitfall-list">
        <article v-for="item in pythagorasMethods.pitfalls" :key="item.title">
          <h6>{{ item.title }}</h6>
          <p><KnowledgeText :text="item.text" /></p>
        </article>
      </div>
    </section>

    <section class="review-workflow" aria-labelledby="pythagoras-workflow">
      <h5 id="pythagoras-workflow">做题时走三步</h5>
      <ol>
        <li v-for="(item, index) in pythagorasMethods.workflow" :key="item.title">
          <span>{{ index + 1 }}</span><div><strong>{{ item.title }}</strong><p>{{ item.text }}</p></div>
        </li>
      </ol>
    </section>
  </div>
</template>

<script setup lang="ts">
import KnowledgeText from './KnowledgeText.vue'
import { pythagorasMethods } from '@/content/knowledge/pythagorasMethods'

const nonlinearNote = '一般来说，$\\sqrt{a^2+b^2}\\ne a+b$；中途优先保留根式或平方形式，直到题目或下一步需要长度时再开方。'
const triplesNote = '它们的正整数倍也成立，例如 $(6,8,10)$ 和 $(15,36,39)$。识别时先找最长边作为斜边候选；不符合比例时保留根式，不要强行套用。'
</script>

<style scoped>
.pythagoras-review { min-width: 0; color: var(--color-ink); }
.review-intro { display: grid; grid-template-columns: minmax(0, 1fr) minmax(240px, .65fr); align-items: end; gap: 28px; padding: 2px 0 22px; border-bottom: 1px solid #dce5f3; }
.review-intro__copy > span { color: #2451c5; font-size: 13px; font-weight: 700; letter-spacing: .04em; }
.review-intro h5 { margin: 8px 0; font-size: 22px; line-height: 1.4; }
.review-intro p, .review-section p, .review-workflow p { margin: 6px 0 0; color: var(--color-ink-soft); font-size: 14px; line-height: 1.8; overflow-wrap: anywhere; }
.review-route { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; padding: 14px 0; border-block: 1px solid #dce5f3; }
.review-route > div { display: grid; gap: 4px; padding: 0 12px; border-left: 1px solid #e0e6ee; }
.review-route > div:first-child { border-left: 0; }
.review-route strong { color: #2451c5; font-size: 12px; font-weight: 700; }
.review-route span { color: #34455e; font-size: 13px; font-weight: 600; }
.review-section { padding: 25px 0 27px; border-bottom: 1px solid var(--color-line); }
.review-heading { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; }
.review-heading > span { color: #2451c5; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.review-heading h5, .review-workflow h5 { margin: 0; color: #142033; font-size: 18px; font-weight: 700; line-height: 1.5; }
.review-section h6 { margin: 0; color: var(--color-ink); font-size: 15px; line-height: 1.5; }
.formula-grid, .triangle-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.formula-block { display: flex; align-items: center; gap: 14px; min-width: 0; padding: 18px 20px; border: 1px solid #dce6f5; border-radius: 10px; background: #f5f8fd; }
.formula-block__copy { min-width: 0; flex: 1; }
.formula-block__equation { margin: 8px 0 !important; color: #173f9d !important; font-size: 20px !important; }
.formula-diagram { display: block; flex: 0 0 126px; width: 126px; max-width: 32%; height: auto; overflow: visible; }
.formula-diagram__plane { fill: #e6efff; stroke: #3f66c6; stroke-width: 2; stroke-linejoin: round; }
.formula-diagram__right { fill: none; stroke: #3f66c6; stroke-width: 2; }
.formula-diagram__solid { fill: none; stroke: #8b9cad; stroke-width: 1.7; stroke-linejoin: round; }
.formula-diagram__base { fill: none; stroke: #7da5df; stroke-width: 1.5; stroke-dasharray: 4 3; }
.formula-diagram__diagonal { fill: none; stroke: #2451c5; stroke-width: 2.2; }
.formula-diagram text { fill: #34455e; font-size: 12px; font-style: italic; font-weight: 600; }
.transform-list { margin-top: 14px; }
.transform-row { display: grid; grid-template-columns: 90px minmax(140px, .45fr) minmax(0, 1fr); align-items: baseline; gap: 14px; padding: 12px 4px; border-bottom: 1px solid #edf0f4; }
.transform-row p { margin: 0; }
.transform-row__formula, .scenario__formula { color: #2451c5 !important; }
.review-note { display: flex; flex-wrap: wrap; gap: 3px 14px; padding: 12px 16px; margin-top: 16px !important; background: #fff8ec; border-left: 3px solid #d99a38; border-radius: 0 6px 6px 0; }
.review-note > strong { color: #845a1c; white-space: nowrap; }
.scenario-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 28px; }
.scenario { display: grid; grid-template-columns: 25px minmax(0, 1fr); gap: 8px; min-width: 0; padding-top: 12px; border-top: 1px solid #e5ebf1; }
.scenario__index { color: var(--color-learning-blue); font-size: 12px; font-weight: 700; line-height: 1.8; }
.triangle { display: flex; align-items: center; gap: 16px; min-width: 0; padding: 16px; background: #f2f8f7; border: 1px solid #d7e8e4; border-radius: 8px; }
.triangle__copy { flex: 1; min-width: 0; }
.triangle__ratio { color: #11786f !important; font-size: 18px !important; font-weight: 700; }
.triangle__takeaway { padding-top: 8px; border-top: 1px solid #d7e8e4; }
.triangle svg { width: min(32%, 140px); flex: none; overflow: visible; }
.triangle svg path { fill: #e3eeff; stroke: #315cc6; stroke-width: 2; stroke-linejoin: round; }
.triangle svg .triangle__right { fill: none; stroke: #315cc6; stroke-width: 1.5; }
.triangle svg text { fill: #34445b; font-size: 11px; font-weight: 600; }
.triples { display: flex; flex-wrap: wrap; gap: 10px; }
.triples > span { padding: 6px 10px; border: 1px solid var(--color-learning-blue-line); border-radius: 6px; background: var(--color-learning-blue-soft); }
.pitfall-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 26px; }
.pitfall-list article { min-width: 0; padding-left: 11px; border-left: 2px solid var(--color-learning-amber-line); }
.review-workflow { margin-top: 24px; padding: 18px; background: #f2f8f7; border-radius: 8px; }
.review-workflow ol { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 14px 0 0; padding: 0; list-style: none; }
.review-workflow li { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
.review-workflow li > span { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #d9eeea; color: #11786f; font-size: 12px; font-weight: 700; }
.review-workflow li strong { font-size: 14px; }
@media (max-width: 900px) {
  .review-intro, .formula-grid, .triangle-grid, .scenario-list, .pitfall-list { grid-template-columns: minmax(0, 1fr); }
  .review-intro { gap: 16px; }
  .review-workflow ol { grid-template-columns: minmax(0, 1fr); }
  .transform-row { grid-template-columns: minmax(0, 1fr); gap: 4px; }
}
</style>
