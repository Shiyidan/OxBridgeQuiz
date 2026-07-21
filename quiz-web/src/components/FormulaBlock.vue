<template>
  <span
    class="formula-block"
    :class="{ 'formula-block--display': displayMode }"
    v-html="renderedFormula"
  ></span>
</template>

<script setup lang="ts">
// KaTeX 公式渲染块（行内/居中模式，模块级缓存）
import { computed } from 'vue'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  latex: string
  displayMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: false,
})

/**
 * 模块级缓存：跨组件实例复用 KaTeX 渲染结果。
 * Why: 切题时同一公式（如 $x$、$R$）会出现在多道题里；缓存命中可避免重复 katex.renderToString。
 * How to apply: key = displayMode|latex；纯字符串 in/out，无副作用。
 */
const renderCache = new Map<string, string>()

// KaTeX 异常回退仍进入 v-html，因此必须先转义用户试卷中的原始公式文本。
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const renderedFormula = computed<string>(() => {
  const key = `${props.displayMode ? 'D' : 'I'}|${props.latex}`
  const cached = renderCache.get(key)
  if (cached !== undefined) return cached

  try {
    const html = katex.renderToString(props.latex, {
      throwOnError: false,
      displayMode: props.displayMode,
      strict: false,
    })
    renderCache.set(key, html)
    return html
  } catch (e) {
    console.error('KaTeX render error:', e)
    return `<span class="formula-error">${escapeHtml(props.latex)}</span>`
  }
})
</script>

<style scoped>
.formula-block {
  display: inline-flex;
  align-items: center;
}

.formula-block--display {
  display: block;
  margin: 0.75em 0;
  text-align: center;
}

.formula-block :deep(.katex) {
  font-size: 1.05em;
}

.formula-block--display :deep(.katex-display) {
  margin: 0;
}

.formula-error {
  color: #ef4444;
  background: #fef2f2;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
