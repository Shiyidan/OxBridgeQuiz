<!-- 真核细胞概念与方法：结构速查配合紧凑识图，重点讲功能联系和判断依据。 -->
<template>
  <article class="cell-methods" aria-label="真核细胞结构与功能：概念与方法">
    <p class="cell-methods__intro"><KnowledgeText :text="content.intro" /></p>

    <section aria-labelledby="cell-structures-title">
      <h3 id="cell-structures-title"><span>01</span>主要结构与功能</h3>
      <div class="cell-methods__overview">
        <dl class="cell-methods__definitions">
          <div v-for="structure in content.structures" :key="structure.name">
            <dt>
              {{ structure.name }}<small>{{ structure.english }}</small>
            </dt>
            <dd>{{ structure.role }}</dd>
          </div>
        </dl>
        <CellStructureDiagram kind="eukaryotic-cell" compact />
      </div>
    </section>

    <section class="cell-methods__connections" aria-labelledby="cell-functions-title">
      <h3 id="cell-functions-title"><span>02</span>从结构解释功能</h3>
      <div v-for="method in content.methods" :key="method.title" class="cell-methods__method">
        <h4>{{ method.title }}</h4>
        <p class="cell-methods__relation">{{ method.relation }}</p>
        <p><KnowledgeText :text="method.text" /></p>
      </div>
    </section>

    <section aria-labelledby="cell-comparison-title">
      <h3 id="cell-comparison-title"><span>03</span>植物细胞不一定有叶绿体</h3>
      <p>
        典型动物细胞、地下根毛细胞和绿色叶肉细胞都有细胞膜、细胞质、细胞核、核糖体和线粒体；主要差别如下。
      </p>
      <table class="cell-methods__comparison">
        <thead>
          <tr>
            <th scope="col">结构</th>
            <th scope="col">典型动物细胞</th>
            <th scope="col">地下根毛细胞</th>
            <th scope="col">绿色叶肉细胞</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in content.comparison" :key="row[0]">
            <th scope="row">{{ row[0] }}</th>
            <td v-for="(cell, index) in row.slice(1)" :key="index">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
      <p>
        <KnowledgeText
          text="**叶绿体与线粒体不是二选一**。叶肉细胞能光合作用，也需要呼吸；根毛不进行光合作用，仍需要呼吸为生命活动供能。"
        />
      </p>
      <p class="cell-methods__exception">
        <KnowledgeText
          text="**典型不等于全部**：成熟哺乳动物红细胞没有细胞核和线粒体，但仍属于真核生物的细胞。判断细胞类型，要结合题干中的结构组合与细胞身份。"
        />
      </p>
    </section>

    <section class="cell-methods__reading" aria-labelledby="cell-reading-title">
      <h3 id="cell-reading-title"><span>04</span>读图：把“存在”与“看见”分开</h3>
      <p>
        <KnowledgeText
          text="**放大倍数决定图像多大，分辨能力决定细节能否区分**。普通光学显微镜不能分辨单独核糖体；继续放大同一张照片，也不能补出原本未记录的细节。"
        />
      </p>
      <p>
        <KnowledgeText
          text="图中没画出某结构，可能是示意图省略、切片未经过或成像条件所限。==没有显示，不等于已证明不存在==。若题干明确说明结构缺失，再用它作为排除依据。"
        />
      </p>
    </section>
  </article>
</template>

<script setup lang="ts">
import { eukaryoticCellMethods as content } from '@/content/knowledge/eukaryoticCellMethods'
import CellStructureDiagram from './CellStructureDiagram.vue'
import KnowledgeText from './KnowledgeText.vue'
</script>

<style scoped>
.cell-methods {
  color: var(--color-ink);
  min-width: 0;
}
.cell-methods p {
  margin: 10px 0;
  color: var(--color-ink-soft);
  line-height: 1.85;
}
.cell-methods .cell-methods__intro {
  margin: 0 0 20px;
}
.cell-methods > section + section {
  margin-top: 28px;
}
.cell-methods h3 {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 0 0 16px;
  font-size: 20px;
  line-height: 1.5;
  font-weight: 700;
}
.cell-methods h3 > span {
  color: var(--color-learning-teal);
  font-size: 14px;
  font-weight: 600;
}
.cell-methods h4 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.55;
}
.cell-methods__overview {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.cell-methods__definitions {
  margin: 0;
}
.cell-methods__definitions > div {
  display: grid;
  grid-template-columns: 135px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--color-line);
}
.cell-methods__definitions dt {
  font-weight: 700;
  line-height: 1.5;
}
.cell-methods__definitions small {
  display: block;
  color: var(--color-ink-soft);
  font-size: 12px;
  font-weight: 400;
}
.cell-methods__definitions dd {
  margin: 0;
  color: var(--color-ink-soft);
  line-height: 1.75;
}
.cell-methods__method {
  padding: 16px 0;
  border-top: 1px solid var(--color-line);
}
.cell-methods__method p:last-child {
  margin-bottom: 0;
}
.cell-methods .cell-methods__relation {
  margin: 8px 0;
  padding-left: 12px;
  border-left: 3px solid var(--color-learning-teal);
  color: var(--color-learning-teal);
  font-size: 15px;
}
.cell-methods__comparison {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  margin: 16px 0;
  font-size: 15px;
  line-height: 1.6;
}
.cell-methods__comparison th,
.cell-methods__comparison td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--color-line);
  text-align: left;
  overflow-wrap: anywhere;
}
.cell-methods__comparison th {
  font-weight: 600;
}
.cell-methods__comparison thead {
  background: var(--color-learning-teal-soft);
}
.cell-methods .cell-methods__exception {
  border-left: 3px solid var(--color-learning-amber);
  padding: 10px 16px;
  background: var(--color-learning-amber-soft);
}
.cell-methods__reading {
  border-top: 1px solid var(--color-line);
  padding-top: 20px;
}
@media (max-width: 1200px) {
  .cell-methods__overview {
    grid-template-columns: minmax(0, 1fr);
  }
  .cell-methods__overview > :deep(.cell-atlas) {
    width: 100%;
    max-width: 560px;
    justify-self: center;
  }
}
@media (max-width: 600px) {
  .cell-methods h3 {
    font-size: 18px;
    gap: 8px;
  }
  .cell-methods__definitions > div {
    grid-template-columns: 110px minmax(0, 1fr);
    gap: 8px;
  }
  .cell-methods__comparison {
    font-size: 13px;
  }
  .cell-methods__comparison th,
  .cell-methods__comparison td {
    padding: 10px 6px;
  }
}
</style>
