<template>
  <template v-if="block.type === 'text'">
    <span class="text-block">{{ block.value }}</span>
  </template>

  <br v-else-if="block.type === 'break'" />

  <FormulaBlock
    v-else-if="block.type === 'formula'"
    :latex="block.latex || block.value || ''"
  />

  <img
    v-else-if="block.type === 'image'"
    :src="block.src"
    class="content-image"
    :alt="block.metadata?.alt || 'image'"
  />

  <div
    v-else-if="block.type === 'svg'"
    class="svg-content"
    v-html="block.value"
  />

  <TikzBlock
    v-else-if="block.type === 'tikz'"
    :code="block.code || block.value || ''"
  />
</template>

<script setup lang="ts">
import FormulaBlock from './FormulaBlock.vue'
import TikzBlock from './TikzBlock.vue'
import type { ContentBlock as ContentBlockType } from '@/types'

interface Props {
  block: ContentBlockType
}

defineProps<Props>()
</script>

<style scoped>
.text-block {
  line-height: 1.6;
}

.content-image {
  max-width: 100%;
  height: auto;
  margin: 8px 0;
  display: block;
}

.svg-content {
  margin: 8px 0;
}

.svg-content :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
