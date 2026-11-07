<!-- 跨膜运输复习讲义：紧凑对照与连续讲解，保留现有 SVG 的通路和细胞形态交互。 -->
<template>
  <article class="bio-methods transport-methods" aria-label="扩散、渗透与主动运输：概念与方法">
    <p class="bio-methods__intro"><KnowledgeText :text="content.intro" /></p>
    <section aria-labelledby="transport-process-title">
      <h3 id="transport-process-title"><span>01</span>运输方式：方向、通路与供能</h3>
      <div class="transport-table" role="region" aria-label="运输方式对照表" tabindex="0">
        <table class="bio-methods__table">
          <thead>
            <tr>
              <th scope="col">方式</th>
              <th scope="col">净方向</th>
              <th scope="col">跨膜通路</th>
              <th scope="col">代谢供能</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="process in content.processes" :key="process.name">
              <th scope="row">
                {{ process.name }}<small>{{ process.english }}</small>
              </th>
              <td>{{ process.direction }}</td>
              <td>
                {{ process.route }}<small>{{ process.example }}</small>
              </td>
              <td>{{ process.energy }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="transport-qualification">
        表中溶质的浓度梯度判断采用简单浓度情境；若题干另给离子电势条件，还需考虑电势。主动运输的 ATP
        供能可以是直接或间接的。
      </p>
      <div class="transport-figure"><MembraneTransportDiagram /></div>
      <p class="bio-methods__note">
        <KnowledgeText
          text="**净移动是两个方向通过量的差额**。扩散平衡时粒子仍随机运动，只是两边平均通过量相等；人工膜允许通过时，也能发生扩散或渗透，无需活细胞供能。"
        />
      </p>
    </section>
    <section aria-labelledby="transport-water-title">
      <h3 id="transport-water-title"><span>02</span>渗透：从水势推到细胞变化</h3>
      <div v-for="point in content.osmosis" :key="point.title" class="bio-methods__point">
        <h4>{{ point.title }}</h4>
        <p><KnowledgeText :text="point.text" /></p>
      </div>
    </section>
    <section aria-labelledby="transport-rate-title">
      <h3 id="transport-rate-title"><span>03</span>扩散快慢：别把总量与相对量混在一起</h3>
      <dl class="transport-rates">
        <div v-for="factor in content.rates" :key="factor.name">
          <dt>{{ factor.name }}</dt>
          <dd>{{ factor.reason }}</dd>
        </div>
      </dl>
      <div class="bio-methods__point">
        <h4>为什么细胞不能只靠增大体积来生长？</h4>
        <p><KnowledgeText :text="content.scaleIntro" /></p>
        <p class="transport-formula">
          <KnowledgeText :text="`用边长为 $a$ 的立方体作简化模型：$${content.scaleFormula}$`" />
        </p>
        <p><KnowledgeText :text="content.scaleText" /></p>
      </div>
    </section>
    <section aria-labelledby="transport-experiment-title">
      <h3 id="transport-experiment-title"><span>04</span>实验读数：百分比、零点和斜率</h3>
      <p class="transport-formula"><KnowledgeText :text="`$${content.massFormula}$`" /></p>
      <div v-for="point in content.experiments" :key="point.title" class="bio-methods__point">
        <h4>{{ point.title }}</h4>
        <p><KnowledgeText :text="point.text" /></p>
      </div>
    </section>
  </article>
</template>
<script setup lang="ts">
import { membraneTransportMethods as content } from '@/content/knowledge/membraneTransportMethods'
import MembraneTransportDiagram from './MembraneTransportDiagram.vue'
import KnowledgeText from './KnowledgeText.vue'
</script>
<style scoped lang="scss">
@use './biologyMethods';
.transport-methods .bio-methods__table th:first-child {
  width: 22%;
}
.transport-methods .bio-methods__table th:last-child {
  width: 13%;
}
.transport-methods small {
  display: block;
  margin-top: 5px;
  color: var(--color-ink-soft);
  font-weight: 400;
  font-size: 12px;
}
.transport-methods .transport-qualification {
  font-size: 14px;
}
.transport-figure {
  width: 100%;
  max-width: 920px;
  margin: 20px auto;
  min-width: 0;
}
.transport-figure :deep(.biology-atlas) {
  margin: 0;
}
.transport-rates {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
  margin: 0 0 16px;
}
.transport-rates > div {
  padding: 12px 0;
  border-top: 1px solid var(--color-line);
}
.transport-rates dt {
  font-weight: 700;
}
.transport-rates dd {
  margin: 6px 0 0;
  color: var(--color-ink-soft);
  line-height: 1.8;
}
.transport-methods .transport-formula {
  padding: 12px 16px;
  background: var(--color-learning-blue-soft);
  border-left: 3px solid var(--color-learning-blue);
  overflow-x: auto;
}
@media (max-width: 600px) {
  .transport-rates {
    grid-template-columns: minmax(0, 1fr);
  }
  .transport-table {
    overflow-x: auto;
  }
  .transport-table table {
    min-width: 440px;
  }
  .transport-methods .transport-formula {
    padding: 10px;
  }
}
</style>
