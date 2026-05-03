<template>
  <span class="latex-text">
    <template v-for="(part, idx) in parts" :key="idx">
      <FormulaBlock v-if="part.type === 'latex'" :latex="part.content" />
      <span v-else>{{ part.content }}</span>
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
  type: 'text' | 'latex'
  content: string
}

const parts = computed(() => {
  const result: TextPart[] = []
  const text = props.text

  // 匹配 $...$ 模式（非贪婪匹配）
  const regex = /\$([^$]+)\$/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // 添加匹配前的文本
    if (match.index > lastIndex) {
      result.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      })
    }

    // 添加 LaTeX 内容（去掉 $ 符号）
    result.push({
      type: 'latex',
      content: match[1]
    })

    lastIndex = match.index + match[0].length
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    result.push({
      type: 'text',
      content: text.slice(lastIndex)
    })
  }

  return result
})
</script>

<style scoped>
.latex-text {
  line-height: 1.6;
}
</style>
