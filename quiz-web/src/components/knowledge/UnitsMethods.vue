<!-- 单位两节概念与方法：关系表、条件对照与紧凑换算路线，供章级及叶节点共用。 -->
<template>
  <article class="units-methods" aria-label="单位概念与方法">
    <p class="units-methods__intro"><KnowledgeText :text="lesson.intro" /></p>
    <section
      v-for="(block, index) in lesson.blocks"
      :key="block.title"
      class="units-methods__section"
    >
      <h3>
        <span>{{ String(index + 1).padStart(2, '0') }}</span
        >{{ block.title }}
      </h3>
      <div v-if="block.formula" class="units-methods__formula">
        <KnowledgeText :text="block.formula" />
      </div>
      <p v-for="paragraph in block.paragraphs" :key="paragraph">
        <KnowledgeText :text="paragraph" />
      </p>
      <div
        v-if="block.table"
        class="units-methods__table"
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
      <div v-for="point in block.points" :key="point.title" class="units-methods__point">
        <h4>{{ point.title }}</h4>
        <div v-if="point.formula" class="units-methods__formula">
          <KnowledgeText :text="point.formula" />
        </div>
        <p><KnowledgeText :text="point.text" /></p>
      </div>
      <UnitsLearningDiagram
        v-if="block.conversion"
        :topic="code"
        compact
        class="units-methods__route"
      />
      <p v-if="block.note" class="units-methods__note"><KnowledgeText :text="block.note" /></p>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { unitsMethods, type UnitsMethodCode } from '@/content/knowledge/unitsMethods'
import KnowledgeText from './KnowledgeText.vue'
import UnitsLearningDiagram from './UnitsLearningDiagram.vue'

const props = defineProps<{ code: UnitsMethodCode }>()
// 章级目录与叶节点使用同一份讲义，切点时正文随当前考纲 code 更新。
const lesson = computed(() => unitsMethods[props.code])
</script>

<style scoped lang="scss">
.units-methods {
  min-width: 0;
  color: var(--color-ink-secondary, #4b5563);
  font-size: 16px;
  line-height: 1.8;
}
.units-methods p {
  margin: 10px 0;
}
.units-methods__intro {
  max-width: 1000px;
}
.units-methods__section {
  margin-top: 26px;
}
.units-methods h3 {
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
.units-methods h3 > span {
  font-size: 14px;
  color: var(--color-learning-blue, #2453cd);
}
.units-methods h4 {
  margin: 0 0 5px;
  color: var(--color-ink, #182235);
  font-size: 17px;
  font-weight: 700;
}
.units-methods__point {
  margin: 18px 0;
}
.units-methods__formula {
  padding: 10px 16px;
  border-left: 3px solid var(--color-learning-blue, #2453cd);
  background: var(--color-learning-blue-soft, #edf3ff);
  overflow-x: auto;
}
.units-methods__table {
  overflow-x: auto;
  margin: 12px 0;
}
.units-methods table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}
.units-methods caption {
  caption-side: bottom;
  text-align: left;
  padding: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}
.units-methods th,
.units-methods td {
  padding: 11px 14px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid #e5eaf1;
}
.units-methods thead {
  background: #f5f7fb;
}
.units-methods th {
  color: var(--color-ink, #182235);
  font-weight: 700;
}
.units-methods tbody th {
  min-width: 100px;
  width: 17%;
}
.units-methods__route {
  max-width: 960px;
  margin: 16px 0;
}
.units-methods p.units-methods__note {
  padding: 10px 14px;
  background: var(--color-learning-amber-soft, #fff8eb);
  border-left: 3px solid var(--color-learning-amber-line, #e8be76);
  font-size: 15px;
}
@media (max-width: 600px) {
  .units-methods {
    font-size: 15px;
  }
  .units-methods h3 {
    font-size: 18px;
    gap: 8px;
  }
  .units-methods th,
  .units-methods td {
    padding: 9px 8px;
  }
  .units-methods tbody th {
    min-width: 68px;
  }
}
</style>
