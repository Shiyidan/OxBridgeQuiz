<!-- 遗传三节复习讲义：术语紧凑对照，概率与家系图跟随对应方法就近展示。 -->
<template>
  <article class="bio-methods inheritance-methods" aria-label="遗传：概念与方法">
    <p class="bio-methods__intro"><KnowledgeText :text="content.intro" /></p>
    <section
      v-for="(block, index) in content.blocks"
      :key="`${code}-${index}`"
      :aria-labelledby="`inheritance-${code}-${index}`"
    >
      <h3 :id="`inheritance-${code}-${index}`">
        <span>{{ String(index + 1).padStart(2, '0') }}</span
        >{{ block.title }}
      </h3>
      <p v-for="paragraph in block.paragraphs" :key="paragraph">
        <KnowledgeText :text="paragraph" />
      </p>
      <div
        v-if="block.table"
        class="inheritance-table"
        role="region"
        :aria-label="block.title"
        tabindex="0"
      >
        <table class="bio-methods__table">
          <caption>
            {{
              block.table.caption
            }}
          </caption>
          <thead>
            <tr>
              <th v-for="column in block.table.columns" :key="column" scope="col">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in block.table.rows" :key="rowIndex">
              <th scope="row"><KnowledgeText :text="row[0] || ''" /></th>
              <td v-for="(cell, cellIndex) in row.slice(1)" :key="cellIndex">
                <KnowledgeText :text="cell" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-for="point in block.points" :key="point.title" class="bio-methods__point">
        <h4>{{ point.title }}</h4>
        <p><KnowledgeText :text="point.text" /></p>
      </div>
      <div v-if="block.diagram === 'cross'" class="inheritance-crosses">
        <figure v-for="cross in crosses" :key="cross.title">
          <figcaption>{{ cross.title }}</figcaption>
          <table>
            <caption>
              行、列为两位亲本的配子及概率
            </caption>
            <thead>
              <tr>
                <th scope="col">配子</th>
                <th scope="col">A（1/2）</th>
                <th scope="col">a（1/2）</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in cross.rows" :key="row[0]">
                <th scope="row">{{ row[0] }}</th>
                <td>{{ row[1] }}</td>
                <td>{{ row[2] }}</td>
              </tr>
            </tbody>
          </table>
          <p><KnowledgeText :text="cross.result" /></p>
        </figure>
      </div>
      <div v-else-if="block.diagram" class="inheritance-figure">
        <InheritanceDiagram
          compact
          :key="`${code}-${block.diagram}`"
          :topic="code"
          :view="block.diagram === 'pedigree' ? block.diagram : undefined"
        />
      </div>
      <p v-if="block.note" class="bio-methods__note"><KnowledgeText :text="block.note" /></p>
    </section>
  </article>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import {
  inheritanceMethods,
  type InheritanceMethodCode,
} from '@/content/knowledge/inheritanceMethods'
import KnowledgeText from './KnowledgeText.vue'
import InheritanceDiagram from './InheritanceDiagram.vue'

const props = defineProps<{ code: InheritanceMethodCode }>()
// 父章节与叶节点入口均按当前考纲 code 取得本节讲义。
const content = computed(() => inheritanceMethods[props.code])
const crosses = [
  {
    title: 'Aa × Aa · 两位亲本都是杂合子',
    rows: [
      ['A（1/2）', 'AA · 1/4', 'Aa · 1/4'],
      ['a（1/2）', 'Aa · 1/4', 'aa · 1/4'],
    ],
    result: '基因型 **1∶2∶1**；A 完全显性时，表现型 **3∶1**。',
  },
  {
    title: 'Aa × aa · 与隐性纯合子测交',
    rows: [['a（1）', 'Aa · 1/2', 'aa · 1/2']],
    result: '基因型 **1∶1**；A 完全显性时，表现型也为 **1∶1**。aa 只产生 a 配子。',
  },
]
</script>
<style scoped lang="scss">
@use './biologyMethods';
.inheritance-methods {
  container-type: inline-size;
}
.inheritance-crosses {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  max-width: 1080px;
  margin: 16px 0;
}
.inheritance-crosses figure {
  min-width: 0;
  margin: 0;
  padding: 16px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: 10px;
}
.inheritance-crosses figcaption {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-learning-teal);
}
.inheritance-crosses table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 15px;
}
.inheritance-crosses caption {
  padding: 10px 0;
  color: var(--color-ink-soft);
  font-size: 13px;
  text-align: left;
}
.inheritance-crosses th,
.inheritance-crosses td {
  padding: 12px 6px;
  border: 1px solid var(--color-line);
  text-align: center;
  overflow-wrap: anywhere;
}
.inheritance-crosses td {
  background: var(--color-learning-teal-soft);
}
.inheritance-crosses p {
  font-size: 14px;
}
@container (min-width: 760px) {
  .inheritance-crosses {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
.inheritance-figure {
  width: 100%;
  max-width: 1120px;
  min-width: 0;
  margin: 16px 0;
}
.inheritance-figure :deep(.biology-atlas) {
  margin: 0;
}
.inheritance-table {
  min-width: 0;
  overflow-x: auto;
}
.inheritance-table caption {
  padding-bottom: 10px;
  color: var(--color-ink-soft);
  font-size: 14px;
  text-align: left;
}
.inheritance-table th:first-child {
  width: 32%;
}
@media (max-width: 600px) {
  .inheritance-table .bio-methods__table {
    table-layout: auto;
  }
  .inheritance-table th:first-child {
    min-width: 80px;
  }
  .inheritance-table caption {
    font-size: 13px;
  }
}
</style>
