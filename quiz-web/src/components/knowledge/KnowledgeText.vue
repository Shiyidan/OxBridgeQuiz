<!-- 学习讲解专用文本：少量加粗与重点标记，公式仍统一交给 LatexText 渲染。 -->
<template>
  <span class="knowledge-text">
    <template v-for="(part, index) in parts" :key="index">
      <strong v-if="part.kind === 'strong'"><LatexText :text="part.text" /></strong>
      <mark v-else-if="part.kind === 'highlight'"><LatexText :text="part.text" /></mark>
      <LatexText v-else :text="part.text" />
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LatexText from '@/components/LatexText.vue'

interface TextPart {
  kind: 'plain' | 'strong' | 'highlight'
  text: string
}

const props = defineProps<{ text: string }>()

// 只识别讲义约定的行内强调，原文仍按纯文本渲染，不开放 HTML 或完整 Markdown。
const parts = computed<TextPart[]>(() => {
  const result: TextPart[] = []
  const markers = /(\*\*|==)([^\r\n]+?)\1/g
  let cursor = 0
  for (const match of props.text.matchAll(markers)) {
    const start = match.index
    if (start > cursor) result.push({ kind: 'plain', text: props.text.slice(cursor, start) })
    result.push({ kind: match[1] === '**' ? 'strong' : 'highlight', text: match[2]! })
    cursor = start + match[0].length
  }
  if (cursor < props.text.length) result.push({ kind: 'plain', text: props.text.slice(cursor) })
  return result
})
</script>

<style scoped>
.knowledge-text {
  overflow-wrap: anywhere;
}
.knowledge-text strong {
  color: var(--color-ink);
  font-weight: var(--weight-bold);
}
.knowledge-text mark {
  padding: 0.05em 0.2em;
  border-radius: 3px;
  border-bottom: 2px solid var(--color-learning-amber-line);
  background: var(--color-learning-amber-soft);
  color: var(--color-ink);
  font-weight: var(--weight-semi);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
</style>
