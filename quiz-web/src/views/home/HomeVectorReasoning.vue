<!-- 首页数学1静态讲义：用双路径交点推导呈现学习平台向量与几何论证的方法。 -->
<script setup lang="ts">
import KnowledgeText from '@/components/knowledge/KnowledgeText.vue'
import { vectorReasoningMethods } from '@/content/knowledge/geometryReasoningMethods'

const method = vectorReasoningMethods.sections[3]!
const paths = [
  {
    label: '沿 AD',
    formula:
      '$\\overrightarrow{AP}=t\\overrightarrow{AD}=\\frac{t}{3}\\mathbf b+\\frac{2t}{3}\\mathbf c$',
  },
  {
    label: '沿 BE',
    formula:
      '$\\overrightarrow{AP}=\\mathbf b+s(\\frac12\\mathbf c-\\mathbf b)=(1-s)\\mathbf b+\\frac{s}{2}\\mathbf c$',
  },
]
</script>

<template>
  <section class="vector-preview" aria-label="向量双路径求交点讲解">
    <header>
      <h3>同一个交点，两条推理路径。</h3>
      <p>{{ method.title }}</p>
    </header>
    <div class="reasoning-layout">
      <div class="geometry">
        <p class="given"><KnowledgeText text="$BD:DC=2:1$，E 为 AC 的中点，AD 与 BE 交于 P。" /></p>
        <svg
          viewBox="0 0 580 330"
          role="img"
          aria-label="三角形ABC中，D将BC按2比1分割，E是AC中点，AD与BE相交于P；AP比PD为3比2。"
        >
          <path d="M120 40 L40 280 H520 Z" class="triangle" />
          <path d="M120 40 L264 184 L40 280 Z" class="region" />
          <path d="M120 40 L360 280" class="path-a" />
          <path d="M40 280 L320 160" class="path-b" />
          <path d="M224 94 l-8 12 M424 214 l-8 12" class="equal-mark" />
          <path d="M40 294 V301 H360 V294 M360 301 H520 V294" class="dimension" />
          <g class="vertices">
            <circle cx="120" cy="40" r="4" />
            <circle cx="40" cy="280" r="4" />
            <circle cx="520" cy="280" r="4" />
            <circle cx="360" cy="280" r="4" />
            <circle cx="320" cy="160" r="4" />
          </g>
          <circle cx="264" cy="184" r="14" class="intersection-halo" />
          <circle cx="264" cy="184" r="5" class="intersection" />
          <g class="point-labels">
            <text x="110" y="25">A</text>
            <text x="17" y="285">B</text>
            <text x="533" y="285">C</text>
            <text x="354" y="269">D</text>
            <text x="329" y="154">E</text>
            <text x="273" y="211">P</text>
          </g>
          <g class="vector-labels">
            <text x="62" y="153">b</text>
            <text x="337" y="125">c</text>
          </g>
          <g class="ratio-labels">
            <text x="200" y="323">2</text>
            <text x="440" y="323">1</text>
          </g>
          <g class="segment-labels">
            <text x="184" y="137">3</text>
            <text x="324" y="221">2</text>
          </g>
        </svg>
        <p class="basis">
          <KnowledgeText
            text="以 A 为原点，设 $\overrightarrow{AB}=\mathbf b$，$\overrightarrow{AC}=\mathbf c$。"
          />
        </p>
      </div>
      <div class="derivation">
        <div class="path-equations">
          <div v-for="path in paths" :key="path.label" class="path-row">
            <span>{{ path.label }}</span
            ><KnowledgeText :text="path.formula" />
          </div>
        </div>
        <div class="coefficient-step">
          <strong>不平行的基向量，系数分别相等</strong>
          <KnowledgeText
            text="$\frac t3=1-s,\quad \frac{2t}{3}=\frac s2\quad\Longrightarrow\quad t=\frac35,\ s=\frac45$"
          />
        </div>
        <div class="conclusion">
          <span>把代数结果，读回几何关系</span>
          <KnowledgeText text="$AP:PD=3:2\qquad BP:PE=4:1$" />
        </div>
        <p class="boundary">
          <KnowledgeText
            text="$0<t,s<1$，交点在线段内部；比较系数的前提是 $\mathbf b,\mathbf c$ 不平行。"
          />
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.vector-preview {
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
  color: #718397;
  font-size: 12px;
}
.reasoning-layout {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(350px, 1.1fr);
  gap: 30px;
  align-items: center;
  margin-top: 20px;
}
.geometry {
  min-width: 0;
}
.given,
.basis {
  margin: 0;
  color: #526b81;
  font-size: 13px;
  line-height: 1.7;
}
.geometry svg {
  display: block;
  width: 100%;
  max-height: 230px;
  margin: 4px 0 8px;
  overflow: visible;
}
.triangle {
  fill: #f6f9fd;
  stroke: #b8cce1;
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.region {
  fill: #eaf2fc;
}
.path-a {
  fill: none;
  stroke: #397ed0;
  stroke-width: 2.3;
}
.path-b {
  fill: none;
  stroke: #21978e;
  stroke-width: 2.3;
}
.equal-mark {
  stroke: #7992a7;
  stroke-width: 1.6;
}
.dimension {
  fill: none;
  stroke: #c2d0de;
  stroke-width: 1;
}
.vertices {
  fill: #718da5;
}
.intersection-halo {
  fill: #eafaaf;
}
.intersection {
  fill: #718a1d;
  stroke: white;
  stroke-width: 2;
}
.point-labels {
  font:
    17px Georgia,
    serif;
  fill: #243a4c;
}
.vector-labels {
  font:
    italic 19px Georgia,
    serif;
  fill: #547493;
}
.ratio-labels {
  text-anchor: middle;
  font-size: 14px;
  fill: #718397;
}
.segment-labels {
  font:
    18px Georgia,
    serif;
  fill: #397ed0;
}
.derivation {
  min-width: 0;
  padding-left: 26px;
  border-left: 1px solid #e5edf4;
}
.path-equations {
  display: grid;
  gap: 16px;
  font-size: 15px;
}
.path-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.path-row > span {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #397ed0;
}
.path-row:nth-child(2) > span {
  color: #21897f;
}
.coefficient-step {
  display: grid;
  gap: 10px;
  margin: 20px 0;
  font-size: 14px;
}
.coefficient-step strong {
  font-size: 12px;
  font-weight: 500;
  color: #718397;
}
.conclusion {
  padding: 12px 14px;
  border-left: 2px solid #c7e95b;
  background: linear-gradient(90deg, #f5f9eb, #fbfcf9);
}
.conclusion > span {
  display: block;
  margin-bottom: 6px;
  color: #60714b;
  font-size: 12px;
}
.conclusion :deep(.katex) {
  font-size: 1.15em;
}
.boundary {
  margin: 12px 0 0;
  font-size: 12px;
  line-height: 1.8;
  color: #718397;
}
@media (max-width: 1200px) {
  .vector-preview {
    padding: 18px;
  }
  .reasoning-layout {
    gap: 18px;
    grid-template-columns: minmax(230px, 1fr) minmax(320px, 1.15fr);
  }
  .derivation {
    padding-left: 18px;
  }
  .path-row {
    gap: 6px;
  }
  .path-equations {
    font-size: 12px;
  }
}
</style>
