<template>
  <span class="formula-block" v-html="renderedFormula"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  latex: string
  displayMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: false
})

const renderedFormula = computed(() => {
  try {
    return katex.renderToString(props.latex, {
      throwOnError: false,
      displayMode: props.displayMode,
      strict: false
    })
  } catch (e) {
    console.error('KaTeX render error:', e)
    return `<span class="formula-error">${props.latex}</span>`
  }
})
</script>

<style scoped>
.formula-block {
  display: inline-flex;
  align-items: center;
}

.formula-block :deep(.katex) {
  font-size: 1.1em;
}

.formula-error {
  color: #ff4d4f;
  background: #fff2f0;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
