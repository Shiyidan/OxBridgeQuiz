<template>
  <div class="question-box">
    <!-- 题号和内容 -->
    <div class="question-header">
      <span class="question-number">{{ question.number || question.order }}.</span>
      <div class="question-content">
        <!-- 新格式：title 字段包含 LaTeX -->
        <template v-if="question.title">
          <LatexText :text="question.title" />
          <!-- 渲染图片/TikZ -->
          <template v-if="question.images && question.images.length">
            <div v-for="(img, idx) in question.images" :key="idx" class="question-image">
              <TikzBlock v-if="img.type === 'tikz'" :code="img.code" />
              <div v-else-if="img.type === 'svg'" class="question-svg" v-html="img.code" />
              <img v-else-if="img.type === 'image'" :src="img.src" :alt="img.alt || ''" />
            </div>
          </template>
        </template>
        <!-- 旧格式：content 数组 -->
        <template v-else>
          <ContentBlock
            v-for="(block, idx) in question.content"
            :key="idx"
            :block="block"
          />
        </template>
      </div>
    </div>

    <!-- 选项 -->
    <OptionList
      :options="question.options"
      :selected="selectedAnswer"
      :correct-answer="question.correctAnswer || question.answer?.[0]"
      :disabled="submitted"
      :show-correct="submitted"
      @select="onSelect"
    />

    <!-- 答案反馈 -->
    <div v-if="submitted && (question.correctAnswer || question.answer?.[0])" class="answer-feedback">
      <span v-if="isCorrect" class="correct">✓ 正确</span>
      <span v-else class="wrong">
        ✗ 错误，正确答案是 {{ question.correctAnswer || question.answer?.[0] }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ContentBlock from './ContentBlock.vue'
import OptionList from './OptionList.vue'
import LatexText from './LatexText.vue'
import TikzBlock from './TikzBlock.vue'
import type { Question } from '@/types'

interface Props {
  question: Question
  selectedAnswer?: string
  submitted: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'select', answer: string): void
}>()

const isCorrect = computed(() => {
  return props.selectedAnswer === props.question.correctAnswer || props.selectedAnswer === props.question.answer?.[0]
})

const onSelect = (label: string) => {
  if (!props.submitted) {
    emit('select', label)
  }
}
</script>

<style scoped>
.question-box {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  background: white;
}

.question-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.question-number {
  font-weight: 700;
  font-size: 1.1em;
  color: #262626;
  flex-shrink: 0;
}

.question-content {
  flex: 1;
  line-height: 1.8;
  font-size: 1rem;
  color: #262626;
}

.answer-feedback {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  font-weight: 500;
}

.answer-feedback .correct {
  color: #52c41a;
  background: #f6ffed;
  padding: 8px 12px;
  border-radius: 4px;
  display: inline-block;
}

.answer-feedback .wrong {
  color: #ff4d4f;
  background: #fff2f0;
  padding: 8px 12px;
  border-radius: 4px;
  display: inline-block;
}

.question-image {
  margin: 16px 0;
  text-align: center;
}

.question-image img {
  max-width: 100%;
  height: auto;
}

.question-svg {
  display: flex;
  justify-content: center;
}

.question-svg :deep(svg) {
  max-width: 100%;
  height: auto;
}
</style>
