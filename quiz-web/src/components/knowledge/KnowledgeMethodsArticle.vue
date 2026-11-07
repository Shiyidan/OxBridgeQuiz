<!-- 概念与方法通用正文：复用紧凑关系表、公式和重点提示，学科图示通过插槽接入。 -->
<template>
  <article class="method-article" :aria-label="label">
    <p class="method-article__intro"><KnowledgeText :text="lesson.intro" /></p>
    <section
      v-for="(block, index) in lesson.blocks"
      :key="block.title"
      class="method-article__section"
    >
      <h3>
        <span>{{ String(index + 1).padStart(2, '0') }}</span
        >{{ block.title }}
      </h3>
      <div v-if="block.formula" class="method-article__formula">
        <KnowledgeText :text="block.formula" />
      </div>
      <p v-for="paragraph in block.paragraphs" :key="paragraph">
        <KnowledgeText :text="paragraph" />
      </p>
      <div
        v-if="block.table"
        class="method-article__table"
        role="region"
        :aria-label="block.title"
        tabindex="0"
      >
        <table>
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
              <template v-for="(cell, cellIndex) in row" :key="cellIndex">
                <th v-if="cellIndex === 0" scope="row"><KnowledgeText :text="cell" /></th>
                <td v-else><KnowledgeText :text="cell" /></td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-for="point in block.points" :key="point.title" class="method-article__point">
        <h4>{{ point.title }}</h4>
        <p><KnowledgeText :text="point.text" /></p>
      </div>
      <div v-if="block.diagram" class="method-article__diagram">
        <slot name="diagram" :block="block" />
      </div>
      <p v-if="block.note" class="method-article__note"><KnowledgeText :text="block.note" /></p>
    </section>
  </article>
</template>

<script setup lang="ts">
import type { KnowledgeMethodArticle } from '@/content/knowledge/types'
import KnowledgeText from './KnowledgeText.vue'

defineProps<{ lesson: KnowledgeMethodArticle; label: string }>()
</script>

<style scoped lang="scss">
.method-article {
  min-width: 0;
  color: var(--color-ink-secondary, #4b5563);
  font-size: 16px;
  line-height: 1.8;
}
.method-article p {
  margin: 10px 0;
}
.method-article__intro {
  max-width: 1000px;
}
.method-article__section {
  margin-top: 26px;
}
.method-article h3 {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin: 0 0 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-learning-blue-line, #d8e3fc);
  color: var(--color-ink, #182235);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.5;
}
.method-article h3 > span {
  font-size: 14px;
  color: var(--color-learning-blue, #2453cd);
}
.method-article h4 {
  margin: 0 0 5px;
  color: var(--color-ink, #182235);
  font-size: 17px;
  font-weight: 700;
}
.method-article__point {
  margin: 18px 0;
}
.method-article__formula {
  padding: 10px 16px;
  border-left: 3px solid var(--color-learning-blue, #2453cd);
  background: var(--color-learning-blue-soft, #edf3ff);
  overflow-x: auto;
}
.method-article__table {
  overflow-x: auto;
  margin: 12px 0;
}
.method-article table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}
.method-article caption {
  caption-side: bottom;
  text-align: left;
  padding: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}
.method-article th,
.method-article td {
  padding: 11px 14px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid #e5eaf1;
}
.method-article thead {
  background: #f5f7fb;
}
.method-article th {
  color: var(--color-ink, #182235);
  font-weight: 700;
}
.method-article tbody th {
  min-width: 100px;
  width: 17%;
}
.method-article__diagram {
  max-width: 1080px;
  margin: 16px 0;
}
.method-article p.method-article__note {
  padding: 10px 14px;
  background: var(--color-learning-amber-soft, #fff8eb);
  border-left: 3px solid var(--color-learning-amber-line, #e8be76);
  font-size: 15px;
}
@media (max-width: 600px) {
  .method-article {
    font-size: 15px;
  }
  .method-article h3 {
    font-size: 18px;
    gap: 8px;
  }
  .method-article th,
  .method-article td {
    padding: 9px 8px;
  }
  .method-article tbody th {
    min-width: 68px;
  }
}
</style>
