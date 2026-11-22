<!-- 英文诊断与解析页提示未翻译的接口正文，不改写原题或已有报告结论。 -->
<script setup lang="ts">
import { computed } from 'vue'
import { t, useSiteLocale } from '@/locales'

const props = defineProps<{ content: unknown; kind?: 'report' | 'question' }>()
const { isEnglish } = useSiteLocale()

// 只在原数据仍含无对应译文的中文时提示，纯英文内容不额外占据空间。
function hasOriginalText(value: unknown): boolean {
  if (typeof value === 'string') return /[\u4e00-\u9fff]/.test(t(value))
  if (Array.isArray(value)) return value.some(hasOriginalText)
  if (value && typeof value === 'object') return Object.values(value).some(hasOriginalText)
  return false
}
// 中文模式不重复提示，英文模式只检查当前页面已加载的正文。
const visible = computed(() => isEnglish.value && hasOriginalText(props.content))
</script>

<template>
  <p v-if="visible" class="original-content-note">
    {{
      t(
        kind === 'question'
          ? '题目和解析按原文展示，界面语言切换不改写题目内容。'
          : '部分报告正文仍为原文，界面语言切换不改写诊断结论。',
      )
    }}
  </p>
</template>

<style scoped>
.original-content-note {
  margin: 12px 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}
</style>
