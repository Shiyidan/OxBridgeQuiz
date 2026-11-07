<!-- 圆定理备考讲义：围绕弦、弧、顶点和切点组织追角与求长方法。 -->
<template>
  <div class="circle-review">
    <header class="circle-intro">
      <div>
        <span class="circle-intro__label">考点梳理</span>
        <h5>圆题先找弦，再判断角看向哪段弧</h5>
        <p>定理是解题的工具。先确认点、线和角之间的关系，再选择能连接已知条件与目标的那一步。</p>
      </div>
      <div class="circle-route" aria-label="圆定理解题思路">
        <div><strong>01</strong><span>确定弦与弧</span></div>
        <div><strong>02</strong><span>识别角的位置</span></div>
        <div><strong>03</strong><span>连接条件与目标</span></div>
      </div>
    </header>

    <section class="circle-section" aria-labelledby="circle-recognition">
      <div class="circle-heading"><span>01</span><h5 id="circle-recognition">先识别结构，避免套错定理</h5></div>
      <div class="recognition-list">
        <article v-for="(item, index) in circleTheoremMethods.essentials" :key="item.title">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <div><h6>{{ item.title }}</h6><p><KnowledgeText :text="item.text" /></p></div>
        </article>
      </div>
      <p class="circle-note"><strong>核心判断</strong>同一条弦有两侧，也对应两段弧；先看顶点和目标角的位置。</p>
    </section>

    <section class="circle-section" aria-labelledby="circle-arc">
      <div class="circle-heading"><span>02</span><h5 id="circle-arc">同弧、同弓形与直径：从弦找到角</h5></div>
      <div class="circle-layout">
        <div class="relation-list">
          <article v-for="item in circleTheoremMethods.arcRelations" :key="item.title" class="relation">
            <h6>{{ item.title }}</h6>
            <p class="relation__formula"><KnowledgeText :text="item.formula" /></p>
            <p><KnowledgeText :text="item.text" /></p>
            <p class="relation__caution"><KnowledgeText :text="item.caution" /></p>
          </article>
        </div>
        <figure class="circle-figure">
          <figcaption><strong>同一段弧，两个观察位置</strong><span>蓝色弧 AB 不包含圆周角顶点 C</span></figcaption>
          <svg viewBox="0 0 240 210" role="img" aria-label="A、B、C 在圆周上，O 是圆心；圆周角 ACB 截取不包含 C 的弧 AB，圆心角 AOB 为120度，圆周角 ACB 为60度">
            <circle cx="120" cy="100" r="75" class="figure-circle" />
            <path d="M 55.05 62.5 A 75 75 0 0 1 184.95 62.5" class="figure-arc" />
            <path d="M 55.05 62.5 L 120 100 L 184.95 62.5" class="figure-radius" />
            <path d="M 55.05 62.5 L 120 175 L 184.95 62.5" class="figure-chords" />
            <circle cx="120" cy="100" r="2.5" class="figure-point" />
            <text x="39" y="62">A</text><text x="190" y="62">B</text>
            <text x="119" y="194">C</text><text x="124" y="109">O</text>
            <text x="101" y="79" class="figure-blue">120°</text><text x="109" y="151" class="figure-teal">60°</text>
          </svg>
          <p><KnowledgeText :text="arcCaption" /></p>
        </figure>
      </div>
    </section>

    <section class="circle-section" aria-labelledby="circle-quadrilateral">
      <div class="circle-heading"><span>03</span><h5 id="circle-quadrilateral">四点共圆：从对角互补接续推理</h5></div>
      <div class="circle-three-column">
        <article v-for="item in circleTheoremMethods.quadrilateral" :key="item.title">
          <h6>{{ item.title }}</h6><p><KnowledgeText :text="item.text" /></p>
        </article>
      </div>
      <p class="circle-note"><strong>判断顺序</strong>先确认四点共圆，再沿圆周标记顶点；相邻角不属于“对角互补”。</p>
    </section>

    <section class="circle-section" aria-labelledby="circle-tangent">
      <div class="circle-heading"><span>04</span><h5 id="circle-tangent">遇到切线：先标切点，再转移角</h5></div>
      <div class="circle-layout">
        <div class="relation-list">
          <article v-for="item in circleTheoremMethods.tangent" :key="item.title" class="relation">
            <h6>{{ item.title }}</h6><p><KnowledgeText :text="item.text" /></p>
          </article>
        </div>
        <figure class="circle-figure circle-figure--teal">
          <figcaption><strong>切线与弦的角如何转移</strong><span>标出切点 A、弦 AB 和另一弓形上的 C</span></figcaption>
          <svg viewBox="0 0 240 215" role="img" aria-label="圆心 O，切线在 A 与半径 OA 垂直；切线向上射线 AT 与弦 AB 的夹角等于另一弓形内圆周角 ACB">
            <circle cx="120" cy="100" r="80" class="figure-circle" />
            <path d="M 200 14 V 190" class="figure-tangent" />
            <path d="M 120 100 H 200" class="figure-radius" />
            <path d="M 200 100 L 80 30.72 L 120 180 Z" class="figure-chords" />
            <path d="M 190 100 V 90 H 200" class="figure-right" />
            <circle cx="120" cy="100" r="2.5" class="figure-point" />
            <text x="204" y="103">A</text><text x="66" y="29">B</text>
            <text x="114" y="198">C</text><text x="105" y="114">O</text><text x="205" y="24">T</text>
            <text x="180" y="76" class="figure-teal">α</text><text x="120" y="157" class="figure-teal">α</text>
          </svg>
          <p><KnowledgeText :text="tangentCaption" /></p>
        </figure>
      </div>
    </section>

    <section class="circle-section" aria-labelledby="circle-bridges">
      <div class="circle-heading"><span>05</span><h5 id="circle-bridges">从追角到求长：让辅助线有明确目的</h5></div>
      <div class="circle-three-column">
        <article v-for="item in circleTheoremMethods.links" :key="item.title">
          <h6>{{ item.title }}</h6><p><KnowledgeText :text="item.text" /></p>
        </article>
      </div>
    </section>

    <section class="circle-check" aria-labelledby="circle-check-title">
      <h5 id="circle-check-title">交卷前，快速检查四件事</h5>
      <div>
        <article v-for="(item, index) in circleTheoremMethods.checks" :key="item.title">
          <span>{{ index + 1 }}</span>
          <div><strong>{{ item.title }}</strong><p>{{ item.text }}</p></div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import KnowledgeText from './KnowledgeText.vue'
import { circleTheoremMethods } from '@/content/knowledge/circleTheoremMethods'

const arcCaption = '固定端点 A、B；角 $\\angle ACB$ 对着的是不包含 C 的那段弧。'
const tangentCaption = '$\\angle TAB=\\angle ACB$；若切线射线反向，需要重新判断对应的角。'
</script>

<style scoped>
.circle-review { container-type: inline-size; min-width: 0; color: var(--color-ink); }
.circle-intro { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, .72fr); align-items: end; gap: 28px; padding: 2px 0 22px; border-bottom: 1px solid #dce5f3; }
.circle-intro__label { color: #2451c5; font-size: 13px; font-weight: 700; }
.circle-intro h5 { margin: 8px 0; color: #142033; font-size: 22px; line-height: 1.4; }
.circle-intro p, .circle-section p, .circle-check p { margin: 6px 0 0; color: var(--color-ink-soft); font-size: 14px; line-height: 1.8; overflow-wrap: anywhere; }
.circle-route { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 14px 0; border-block: 1px solid #dce5f3; }
.circle-route > div { display: grid; gap: 4px; padding: 0 12px; border-left: 1px solid #e0e6ee; }
.circle-route > div:first-child { border-left: 0; }
.circle-route strong { color: #2451c5; font-size: 12px; }
.circle-route span { color: #34455e; font-size: 13px; font-weight: 600; }
.circle-section { padding: 25px 0 27px; border-bottom: 1px solid var(--color-line); }
.circle-heading { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; }
.circle-heading > span { color: #2451c5; font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.circle-heading h5, .circle-check h5 { margin: 0; color: #142033; font-size: 18px; line-height: 1.5; }
.circle-section h6 { margin: 0; color: var(--color-ink); font-size: 15px; line-height: 1.5; }
.recognition-list, .circle-three-column { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.recognition-list article { display: flex; gap: 9px; min-width: 0; }
.recognition-list article > span { flex: none; color: #2451c5; font-size: 12px; font-weight: 700; line-height: 1.8; }
.circle-note { display: flex; flex-wrap: wrap; gap: 2px 12px; margin-top: 17px !important; padding: 12px 15px; border-left: 3px solid #d99a38; border-radius: 0 6px 6px 0; background: #fff8ec; }
.circle-note strong { color: #845a1c; }
.circle-layout { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr); align-items: start; gap: 24px; }
.relation-list { min-width: 0; }
.relation { padding: 13px 0; border-top: 1px solid #e6ebf1; }
.relation:first-child { padding-top: 0; border-top: 0; }
.relation__formula { color: #2451c5 !important; font-weight: 600; }
.relation__caution { padding-left: 10px; border-left: 2px solid #d9ad64; }
.circle-figure { min-width: 0; margin: 0; padding: 17px; border: 1px solid #dce6f5; border-radius: 10px; background: #f5f8fd; }
.circle-figure--teal { border-color: #d5e9e3; background: #f2f9f7; }
.circle-figure figcaption { display: grid; gap: 4px; color: #182b49; font-size: 14px; line-height: 1.5; }
.circle-figure figcaption span { color: #65748a; font-size: 12px; }
.circle-figure > svg { display: block; width: 100%; max-width: 300px; height: auto; margin: 12px auto; }
.circle-figure > svg text { fill: #34455e; font-size: 13px; font-weight: 600; }
.circle-figure > svg .figure-blue { fill: #2451c5; }
.circle-figure > svg .figure-teal { fill: #11786f; }
.figure-circle { fill: white; stroke: #9db4d1; stroke-width: 1.8; }
.figure-arc { fill: none; stroke: #2451c5; stroke-width: 4; stroke-linecap: round; }
.figure-radius { fill: none; stroke: #2451c5; stroke-width: 1.8; }
.figure-chords { fill: none; stroke: #168477; stroke-width: 2; stroke-linejoin: round; }
.figure-tangent { fill: none; stroke: #168477; stroke-width: 2; }
.figure-right { fill: none; stroke: #34455e; stroke-width: 1.5; }
.figure-point { fill: #34455e; }
.circle-three-column article { min-width: 0; padding-top: 12px; border-top: 2px solid #dce6f5; }
.circle-check { margin-top: 24px; padding: 18px; border-radius: 8px; background: #f2f8f7; }
.circle-check > div { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 24px; margin-top: 14px; }
.circle-check article { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
.circle-check article > span { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #d9eeea; color: #11786f; font-size: 12px; font-weight: 700; }
.circle-check article strong { font-size: 14px; }
/* 圆周角和切线图按正文宽度重排，让角标、弧线和切点保持清晰。 */
@container (max-width: 820px) {
  .circle-layout { grid-template-columns: minmax(0, 1fr); gap: 16px; }
}
@media (max-width: 900px) {
  .circle-intro, .circle-layout, .recognition-list, .circle-three-column, .circle-check > div { grid-template-columns: minmax(0, 1fr); }
  .circle-intro, .circle-layout { gap: 16px; }
}
</style>
