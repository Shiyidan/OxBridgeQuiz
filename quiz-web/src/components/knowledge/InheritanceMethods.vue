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
      <div v-if="block.diagram" class="inheritance-figure">
        <InheritanceDiagram
          compact
          :key="`${code}-${block.diagram}`"
          :topic="code"
          :view="
            block.diagram === 'cross' || block.diagram === 'pedigree' ? block.diagram : undefined
          "
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
</script>
<style scoped lang="scss">
@use './biologyMethods';
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
