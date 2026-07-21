<!-- 题干与选项的混合文本渲染器：保留原文换行并将四类 LaTeX 定界符交给 KaTeX。 -->
<template>
  <span class="latex-text">
    <template v-for="(part, idx) in parts" :key="idx">
      <FormulaBlock v-if="part.type === 'latex'" :latex="part.content" />
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

interface LatexDelimiter {
  open: string
  close: string
  type: 'latex' | 'latex-display'
  allowNewline: boolean
}

const LATEX_DELIMITERS: LatexDelimiter[] = [
  { open: '$$', close: '$$', type: 'latex-display', allowNewline: true },
  { open: '\\[', close: '\\]', type: 'latex-display', allowNewline: true },
  { open: '\\(', close: '\\)', type: 'latex', allowNewline: true },
  { open: '$', close: '$', type: 'latex', allowNewline: false },
]

// 只有奇数个连续反斜杠才会转义当前符号，避免把 \$ 当成公式起点。
function isEscaped(text: string, index: number): boolean {
  let slashCount = 0
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === '\\'; cursor -= 1) {
    slashCount += 1
  }
  return slashCount % 2 === 1
}

// 显示公式定界符优先于行内美元符，防止 $$...$$ 被拆成两段。
function delimiterAt(text: string, index: number): LatexDelimiter | null {
  for (const delimiter of LATEX_DELIMITERS) {
    if (text.startsWith(delimiter.open, index) && !isEscaped(text, index)) return delimiter
  }
  return null
}

// 只接受未转义的闭合符；$...$ 不跨行，降低孤立货币符号吞掉整段文本的风险。
function findClosingDelimiter(
  text: string,
  contentStart: number,
  delimiter: LatexDelimiter,
): number {
  let searchFrom = contentStart
  while (searchFrom < text.length) {
    const closingIndex = text.indexOf(delimiter.close, searchFrom)
    if (closingIndex < 0) return -1
    if (!delimiter.allowNewline && text.slice(contentStart, closingIndex).includes('\n')) return -1
    if (!isEscaped(text, closingIndex)) return closingIndex
    searchFrom = closingIndex + delimiter.close.length
  }
  return -1
}

// 相邻纯文本合并后一次渲染，原始空白和换行不做二次转义。
function appendText(parts: TextPart[], content: string): void {
  if (!content) return
  const previous = parts[parts.length - 1]
  if (previous?.type === 'text') previous.content += content
  else parts.push({ type: 'text', content })
}

// 按原文顺序产生纯文本、行内公式和显示公式片段。
function splitLatexText(text: string): TextPart[] {
  const result: TextPart[] = []
  let cursor = 0
  let textStart = 0

  while (cursor < text.length) {
    const delimiter = delimiterAt(text, cursor)
    if (!delimiter) {
      cursor += 1
      continue
    }

    const contentStart = cursor + delimiter.open.length
    const closingIndex = findClosingDelimiter(text, contentStart, delimiter)
    if (closingIndex < 0) {
      cursor += delimiter.open.length
      continue
    }

    appendText(result, text.slice(textStart, cursor))
    result.push({
      type: delimiter.type,
      content: text.slice(contentStart, closingIndex),
    })
    cursor = closingIndex + delimiter.close.length
    textStart = cursor
  }

  appendText(result, text.slice(textStart))
  return result
}

// props 更新时重新切分，但不修改 JSON 解析后的原始文本。
const parts = computed<TextPart[]>(() => {
  return splitLatexText(props.text)
})
</script>

<style scoped>
.latex-text {
  line-height: 1.6;
}

/**
 * 文本片段开启 pre-wrap：保留 JSON 解析后的换行与必要空白，
 * 仅作用于文本片段，避免影响 KaTeX 渲染输出。
 */
.latex-text__plain {
  white-space: pre-wrap;
}
</style>
