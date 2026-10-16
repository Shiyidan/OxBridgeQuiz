<!-- 生物章节共用图谱外框：统一图解、控制按钮、图例与解释的阅读层级。 -->
<template>
  <figure class="biology-atlas" :aria-label="title">
    <figcaption>
      <span class="atlas-eyebrow">BIOLOGY ATLAS · 生物图解</span>
      <h5>{{ title }}</h5>
      <p v-if="subtitle"><KnowledgeText :text="subtitle" /></p>
    </figcaption>
    <div v-if="$slots.controls" class="atlas-controls"><slot name="controls" /></div>
    <div class="atlas-stage"><slot /></div>
    <div v-if="$slots.legend" class="atlas-legend"><slot name="legend" /></div>
    <div v-if="$slots.explanation" class="atlas-explanation"><slot name="explanation" /></div>
    <p class="atlas-note"><KnowledgeText :text="note" /></p>
  </figure>
</template>

<script setup lang="ts">
import KnowledgeText from './KnowledgeText.vue'

defineProps<{ title: string; subtitle?: string; note: string }>()
</script>

<style scoped>
.biology-atlas {
  min-width: 0;
  margin: 28px 0;
  padding: 22px;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-lg);
  background: linear-gradient(140deg, var(--color-learning-teal-soft), var(--color-surface) 65%);
  color: var(--color-ink);
}
.atlas-eyebrow {
  color: var(--color-learning-teal);
  font: var(--weight-bold) var(--text-xs) var(--font-mono);
  letter-spacing: 0.08em;
}
figcaption h5 {
  margin: 8px 0;
  font-size: var(--text-lg);
  line-height: 1.5;
  font-weight: var(--weight-bold);
}
figcaption p,
.atlas-note {
  margin: 8px 0 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: 1.8;
}
.atlas-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}
.atlas-controls :deep(.app-button.el-button) {
  --app-button-bg: var(--color-surface);
  --app-button-border: var(--color-learning-teal-line);
  --app-button-color: var(--color-learning-teal);
  --app-button-hover-bg: var(--color-learning-teal-soft);
  --app-button-hover-border: var(--color-learning-teal);
  --app-button-hover-color: var(--color-learning-teal);
  max-width: 100%;
  height: auto;
  min-height: 34px;
  margin-left: 0;
  padding: 8px 12px;
  white-space: normal;
  line-height: 1.5;
}
.atlas-controls :deep(.app-button.el-button[aria-pressed='true']) {
  --app-button-bg: var(--color-learning-teal);
  --app-button-border: var(--color-learning-teal);
  --app-button-color: var(--color-ink-inverse);
  --app-button-hover-bg: var(--color-learning-teal);
  --app-button-hover-color: var(--color-ink-inverse);
}
.atlas-stage {
  min-width: 0;
  padding: 12px;
  overflow-x: auto;
  border: 1px solid var(--color-learning-teal-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.atlas-stage :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
.atlas-stage :deep(svg text) {
  font-family: var(--font-sans);
}
.atlas-stage :deep([role='button']) {
  cursor: pointer;
}
.atlas-stage :deep([role='button']:focus-visible) {
  outline: 3px solid var(--color-learning-blue);
  outline-offset: 3px;
}
.atlas-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  padding: 12px 0;
  font-size: var(--text-xs);
  line-height: 1.6;
  color: var(--color-ink-soft);
}
.atlas-explanation {
  margin-top: 16px;
  padding: 18px;
  border-left: 3px solid var(--color-learning-teal);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  background: var(--color-learning-teal-soft);
  font-size: var(--text-sm);
  line-height: 1.9;
}
.atlas-explanation :deep(p) {
  margin: 8px 0;
}
.atlas-explanation :deep(h6) {
  margin: 0 0 8px;
  font-size: var(--text-sm);
  color: var(--color-learning-teal);
}
.atlas-note {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-learning-teal-line);
  font-size: var(--text-xs);
}
@media (max-width: 760px) {
  .biology-atlas {
    padding: 14px;
  }
  .atlas-stage {
    padding: 4px;
  }
  .atlas-explanation {
    padding: 12px;
  }
  figcaption h5 {
    font-size: var(--text-base);
  }
}
</style>
