<template>
  <div class="options-list">
    <button
      v-for="option in options"
      :key="option.label"
      class="option-btn"
      :class="{
        'selected': selected === option.label,
        'correct': showCorrect && option.label === correctAnswer,
        'wrong': showCorrect && selected === option.label && selected !== correctAnswer
      }"
      :disabled="disabled"
      @click="$emit('select', option.label)"
    >
      <span class="option-label">{{ option.label }}.</span>
      <span class="option-content">
        <!-- 新格式：text 字段包含 LaTeX -->
        <template v-if="option.text">
          <LatexText :text="option.text" />
        </template>
        <!-- 旧格式：content 数组 -->
        <template v-else-if="option.content">
          <ContentBlock
            v-for="(block, idx) in option.content"
            :key="idx"
            :block="block"
          />
        </template>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import ContentBlock from './ContentBlock.vue'
import LatexText from './LatexText.vue'
import type { Option } from '@/types'

interface Props {
  options: Option[]
  selected?: string
  correctAnswer?: string
  disabled?: boolean
  showCorrect?: boolean
}

defineProps<Props>()
defineEmits<{
  (e: 'select', label: string): void
}>()
</script>

<style scoped>
.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

.option-btn {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: white;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.option-btn:hover:not(:disabled) {
  border-color: #1890ff;
  background: #e6f7ff;
}

.option-btn.selected {
  border-color: #1890ff;
  background: #e6f7ff;
}

.option-btn.correct {
  border-color: #52c41a;
  background: #f6ffed;
}

.option-btn.wrong {
  border-color: #ff4d4f;
  background: #fff2f0;
}

.option-btn:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.option-label {
  font-weight: 600;
  color: #262626;
  flex-shrink: 0;
}

.option-content {
  flex: 1;
}
</style>
