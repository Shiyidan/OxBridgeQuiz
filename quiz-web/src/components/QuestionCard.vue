<template>
  <article class="question-card">
    <!-- 题号小标 -->
    <div class="question-card__label">Question {{ index + 1 }}</div>

    <!-- 题干（含 LaTeX） -->
    <div class="question-card__stem">
      <LatexText v-if="question.title" :text="question.title" />
    </div>

    <!-- 题目配图：svg / png 等 -->
    <div
      v-if="question.images && question.images.length"
      class="question-card__media"
    >
      <div
        v-for="(img, idx) in question.images"
        :key="idx"
        class="question-card__media-item"
      >
        <div
          v-if="img.type === 'svg' && img.code"
          class="question-card__svg"
          :aria-label="img.alt || ''"
          v-html="img.code"
        />
        <img
          v-else-if="img.type === 'image' && img.src"
          :src="img.src"
          :alt="img.alt || ''"
          class="question-card__img"
        />
      </div>
    </div>

    <!-- 选项 2 栏栅格 -->
    <div class="question-card__options">
      <button
        v-for="opt in question.options"
        :key="opt.label"
        type="button"
        class="opt-card"
        :class="{ 'opt-card--selected': selectedAnswer === opt.label }"
        :aria-pressed="selectedAnswer === opt.label"
        @click="handleSelect(opt.label)"
      >
        <span class="opt-card__bullet">{{ opt.label }}</span>
        <span class="opt-card__text">
          <LatexText v-if="opt.text" :text="opt.text" />
          <template v-else>{{ '' }}</template>
        </span>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import LatexText from './LatexText.vue'
import type { Question } from '@/types'

interface Props {
  question: Question
  index: number
  selectedAnswer?: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'select', label: string): void
}>()

const handleSelect = (label: string): void => {
  emit('select', label)
}
</script>

<style scoped lang="scss">
.question-card {
  --color-primary: #4f46e5;
  --color-primary-light: #6366f1;
  --color-primary-bg: #eef2ff;

  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;

  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;

  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px -2px rgba(15, 23, 42, 0.06);

  width: 100%;
}

/* ========== 题干卡 ========== */
.question-card__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
}

.question-card__stem {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem 1.75rem;
  font-size: 1rem;
  line-height: 1.75;
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
  word-break: break-word;
}

.question-card__stem :deep(.latex-text) {
  display: inline;
}

/* ========== 配图（SVG / PNG） ========== */
.question-card__media {
  margin-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-card__media-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  display: flex;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.question-card__svg {
  max-width: 100%;
  display: flex;
  justify-content: center;
}

.question-card__svg :deep(svg) {
  max-width: 100%;
  height: auto;
  display: block;
}

.question-card__img {
  max-width: 100%;
  height: auto;
  display: block;
}

/* ========== 选项栅格 ========== */
.question-card__options {
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.875rem 1rem;
}

.opt-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1.125rem;
  background: var(--color-surface);
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xl);
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
  width: 100%;

  &:hover {
    border-color: var(--color-primary-light);
    background: var(--color-primary-bg);
  }

  &:active {
    transform: scale(0.99);
  }

  &--selected {
    border-color: var(--color-primary);
    background: var(--color-primary-bg);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);

    .opt-card__bullet {
      background: var(--color-text);
      color: var(--color-text-inverse);
    }
  }
}

.opt-card__bullet {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
  transition: background 0.18s ease, color 0.18s ease;
}

.opt-card__text {
  flex: 1;
  min-width: 0;
  line-height: 1.5;
  word-break: break-word;
}

/* 选项中的 katex 公式略微下移以与字母对齐 */
.opt-card__text :deep(.katex) {
  font-size: 1em;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .question-card__options {
    grid-template-columns: 1fr;
  }

  .question-card__stem {
    padding: 1.25rem 1rem;
    font-size: 0.95rem;
  }
}
</style>
