<template>
  <span class="latex-text">
    <template v-for="(part, idx) in parts" :key="idx">
      <FormulaBlock
        v-if="part.type === 'latex'"
        :latex="part.content"
      />
      <FormulaBlock
        v-else-if="part.type === 'latex-display'"
        :latex="part.content"
        :display-mode="true"
      />
      <span v-else class="latex-text__plain">{{ part.content }}</span>
    </template>
  </span>
</template>

<script setup lang="ts">
// LaTeX 文本混合渲染器（切分 $...$ / $$...$$ 后用 FormulaBlock 渲染，QuestionCard 内部使用）
import { computed } from 'vue'
import FormulaBlock from './FormulaBlock.vue'

interface Props {
  text: string
}

const props = defineProps<Props>()

interface TextPart {
  type: 'text' | 'latex' | 'latex-display'
  content: string
}

const parts = computed<TextPart[]>(() => {
  const result: TextPart[] = []
  const text = props.text

  // 同时匹配 $$...$$（居中公式）和 $...$（行内公式）
  // 引擎按交替顺序优先尝试 $$...$$，避免被 $...$ 错误吞掉
  const regex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      })
    }

    const displayLatex = match[1]
    const inlineLatex = match[2]
    if (displayLatex !== undefined) {
      result.push({ type: 'latex-display', content: displayLatex })
    } else if (inlineLatex !== undefined) {
      result.push({ type: 'latex', content: inlineLatex })
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    result.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return result
})
</script>

<style scoped>
.latex-text {
  line-height: 1.6;
}

/**
 * 文本片段开启 pre-line：保留 JSON 里的 \n 为可视换行（用于段落分隔），
 * 同时把多余空白合并掉。仅作用于文本片段，避免影响 KaTeX 渲染输出。
 */
.latex-text__plain {
  white-space: pre-line;
}
</style>
