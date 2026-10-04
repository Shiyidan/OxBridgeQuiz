<!-- 错题本难度标签：错题与收藏列表共用低、中、高分级的文字和配色。 -->
<template>
  <span class="question-difficulty-tag" :class="`question-difficulty-tag--${level}`">
    难度：{{ labels[level] }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ difficulty?: string | null }>()
const labels = { easy: '低', medium: '中', hard: '高', unknown: '未标注' } as const

// 缺失或未知难度统一使用未标注样式，避免被误归为某个难度等级。
const level = computed(() => {
  const value = props.difficulty
  return value === 'easy' || value === 'medium' || value === 'hard' ? value : 'unknown'
})
</script>

<style scoped>
.question-difficulty-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  line-height: var(--leading-normal);
  white-space: nowrap;
}
.question-difficulty-tag--easy {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.question-difficulty-tag--medium {
  background: var(--color-warning-bg);
  color: var(--color-report-orange);
}
.question-difficulty-tag--hard {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}
.question-difficulty-tag--unknown {
  background: var(--color-info-bg);
  color: var(--color-info);
}
</style>
