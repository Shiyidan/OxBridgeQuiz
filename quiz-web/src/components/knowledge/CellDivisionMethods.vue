<!-- 细胞分裂与繁殖四节讲义：按内容组合阶段图、计数表和判断方法。 -->
<template>
  <article class="bio-methods division-methods" aria-label="概念与方法">
    <p class="bio-methods__intro"><KnowledgeText :text="content.intro" /></p>
    <section
      v-for="(block, index) in content.blocks"
      :key="`${code}-${index}`"
      :aria-labelledby="`division-${code}-${index}`"
    >
      <h3 :id="`division-${code}-${index}`">
        <span>{{ String(index + 1).padStart(2, '0') }}</span
        >{{ block.title }}
      </h3>
      <p v-for="paragraph in block.paragraphs" :key="paragraph">
        <KnowledgeText :text="paragraph" />
      </p>
      <div v-for="point in block.points" :key="point.title" class="bio-methods__point">
        <h4>{{ point.title }}</h4>
        <p><KnowledgeText :text="point.text" /></p>
      </div>
      <div
        v-if="block.table"
        class="division-table"
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
      <div v-if="block.diagram" class="division-figure">
        <CellDivisionDiagram :key="code" :topic="code" />
      </div>
      <p v-if="block.note" class="bio-methods__note"><KnowledgeText :text="block.note" /></p>
    </section>
  </article>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import {
  cellDivisionMethods,
  type CellDivisionMethodCode,
} from '@/content/knowledge/cellDivisionMethods'
import KnowledgeText from './KnowledgeText.vue'
import CellDivisionDiagram from './CellDivisionDiagram.vue'

const props = defineProps<{ code: CellDivisionMethodCode }>()
// 父章节切换小节与直接选择叶节点使用同一份讲义。
const content = computed(() => cellDivisionMethods[props.code])
</script>
<style scoped lang="scss">
@use './biologyMethods';
.division-figure {
  width: 100%;
  max-width: 800px;
  min-width: 0;
  margin: 20px auto;
}
.division-figure :deep(.biology-atlas) {
  margin: 0;
}
.division-table {
  min-width: 0;
  overflow-x: auto;
}
.division-table caption {
  padding: 0 0 10px;
  text-align: left;
  color: var(--color-ink-soft);
  font-size: 14px;
}
.division-table th:first-child {
  width: 29%;
}
@media (max-width: 600px) {
  .division-table table {
    min-width: 400px;
  }
  .division-table caption {
    font-size: 13px;
  }
}
</style>
