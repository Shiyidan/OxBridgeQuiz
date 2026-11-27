<!-- 学习和题库共用的范围标题：呈现考纲路径与双语名称，不负责页面导航。 -->
<template>
  <header class="learning-scope-header" :class="`is-${variant}`">
    <nav v-if="breadcrumbs.length" class="scope-breadcrumb" aria-label="考纲路径">
      <template v-for="(item, index) in breadcrumbs" :key="item.code">
        <ArrowRight v-if="index" aria-hidden="true" />
        <button
          v-if="index < breadcrumbs.length - 1"
          type="button"
          :title="item.label"
          @click="$emit('select', item.code)"
        >
          {{ item.label }}
        </button>
        <span v-else class="scope-current" aria-current="page" :title="item.label">{{
          item.label
        }}</span>
      </template>
    </nav>
    <div v-if="showTitle">
      <h2 class="scope-title">{{ title }}</h2>
      <p v-if="titleEn !== title" class="scope-english">{{ titleEn }}</p>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'

withDefaults(
  defineProps<{
    breadcrumbs: { code: string; label: string }[]
    title: string
    titleEn: string
    showTitle?: boolean
    variant: 'lesson' | 'index' | 'practice'
  }>(),
  { showTitle: true },
)
defineEmits<{ select: [code: string] }>()
</script>

<style scoped>
.learning-scope-header {
  min-width: 0;
  margin-bottom: 18px;
}
.learning-scope-header.is-index {
  margin-bottom: 20px;
}
.learning-scope-header.is-lesson {
  margin-bottom: 8px;
}
.scope-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--color-ink-muted);
  font-size: 14px;
}
.is-index .scope-breadcrumb,
.is-lesson .scope-breadcrumb {
  margin-bottom: 8px;
}
.is-index .scope-breadcrumb:has(.scope-current:only-child) {
  display: none;
}
.scope-breadcrumb button {
  max-width: 240px;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}
.scope-breadcrumb button:hover {
  color: var(--color-learning-blue);
}
.scope-breadcrumb button:focus-visible {
  outline: 2px solid var(--color-learning-blue);
  outline-offset: 3px;
}
.scope-current {
  min-width: 0;
  max-width: 100%;
  color: var(--color-ink);
  overflow-wrap: anywhere;
}
.scope-breadcrumb svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
.scope-title {
  margin: 0;
  font-size: 28px;
  line-height: 1.45;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.scope-english {
  margin: 6px 0 0;
  color: var(--color-ink-muted);
  font-size: 17px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.is-index .scope-title {
  font-size: 24px;
  line-height: 1.3;
}
.is-index .scope-english {
  margin-top: 3px;
  font-size: 14px;
}
</style>
