<template>
  <article :class="['question-card', `question-card--${variant}`]">
    <!-- 题号小标 -->
    <div class="question-card__label">Question {{ index + 1 }}</div>

    <!-- 内容区：优先 content_blocks（图文混排），fallback 到 title + images -->
    <template v-if="hasContentBlocks">
      <template v-for="(block, idx) in question.content_blocks" :key="idx">
        <div v-if="block.type === 'paragraph' && block.text" class="question-card__stem">
          <LatexText :text="block.text" />
        </div>
        <div
          v-else-if="block.type === 'image_ref' && getImageById(block.image_id)"
          class="question-card__media"
        >
          <div class="question-card__media-item">
            <div
              v-if="getImageById(block.image_id)!.code"
              class="question-card__svg"
              :aria-label="getImageById(block.image_id)!.alt || block.alt || ''"
              v-html="getImageById(block.image_id)!.code"
            />
            <img
              v-else-if="getImageById(block.image_id)!.src"
              :src="normalizeImageSrc(getImageById(block.image_id)!.src!)"
              :alt="getImageById(block.image_id)!.alt || block.alt || ''"
              class="question-card__img"
            />
          </div>
        </div>
      </template>
    </template>

    <!-- Fallback：旧格式 title + images -->
    <template v-else>
      <div class="question-card__stem">
        <LatexText v-if="question.title" :text="question.title" />
      </div>

      <div
        v-if="renderImages.length"
        class="question-card__media"
      >
        <div
          v-for="(img, idx) in renderImages"
          :key="idx"
          class="question-card__media-item"
        >
          <div
            v-if="img.code"
            class="question-card__svg"
            :aria-label="img.alt || ''"
            v-html="img.code"
          />
          <img
            v-else-if="img.src"
            :src="img.src"
            :alt="img.alt || ''"
            class="question-card__img"
          />
        </div>
      </div>
    </template>

    <!-- 选项 2 栏栅格 -->
    <div class="question-card__options">
      <button
        v-for="opt in question.options"
        :key="opt.label"
        type="button"
        class="opt-card"
        :class="optionClass(opt.text, opt.label)"
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
// 题目渲染卡片（试题库、练习页、试卷预览共用）
import { computed } from 'vue'
import LatexText from './LatexText.vue'
import type { Question, QuestionImage } from '@/types'

interface Props {
  question: Question
  index: number
  selectedAnswer?: string
  showAnswer?: boolean
  variant?: 'default' | 'exam'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  showAnswer: false,
})

const emit = defineEmits<{
  (e: 'select', label: string): void
}>()

// 是否使用新版 content_blocks 渲染（至少有 paragraph 或 image_ref 块）
const hasContentBlocks = computed<boolean>(() => {
  const blocks = props.question.content_blocks
  return Array.isArray(blocks) && blocks.some(b => b.type === 'paragraph' || b.type === 'image_ref')
})

// 根据 image_ref 的 image_id 匹配 images 数组中的图片
function getImageById(imageId: string | undefined): QuestionImage | null {
  if (!imageId) return null
  const images = props.question.images
  if (!Array.isArray(images)) return null
  const img = images.find(i => i.id === imageId)
  if (!img) return null
  return {
    id: img.id,
    type: img.code ? 'svg' : 'image',
    src: img.src ? normalizeImageSrc(img.src) : undefined,
    code: img.code,
    alt: img.alt || '',
  }
}

const renderImages = computed<QuestionImage[]>(() => {
  const directImages = props.question.images || []
  const contentImages = (props.question.content || [])
    .filter((block) => (block.type === 'image' || block.type === 'svg') && (block.src || block.value))
    .map<QuestionImage>((block) => ({
      type: block.type === 'svg' && !block.src ? 'svg' : 'image',
      src: block.src ? normalizeImageSrc(block.src) : undefined,
      code: block.type === 'svg' && block.value ? block.value : undefined,
      alt: block.metadata?.alt || '',
    }))

  return [...directImages, ...contentImages].map(normalizeRenderImage)
})

const handleSelect = (label: string): void => {
  emit('select', label)
}

function normalizeImageSrc(src: string): string {
  if (/^(https?:|data:|blob:|\/)/i.test(src)) return src
  return `/${src.replace(/^\.?\//, '')}`
}

function normalizeRenderImage(img: QuestionImage): QuestionImage {
  return {
    ...img,
    type: img.code ? 'svg' : 'image',
    src: img.src ? normalizeImageSrc(img.src) : undefined,
  }
}

const correctAnswers = computed<Set<string>>(() =>
  new Set(props.question.answer || [])
)

function optionClass(text: string | undefined, label: string): Record<string, boolean> {
  const normalizedText = (text || '').replace(/\$+/g, '').replace(/\s+/g, ' ').trim()
  return {
    'opt-card--selected': props.selectedAnswer === label,
    'opt-card--correct': props.showAnswer && correctAnswers.value.has(label),
    'opt-card--wide': props.variant === 'exam' && normalizedText.length > 42,
  }
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

.question-card--exam {
  .question-card__label {
    display: none;
  }

  .question-card__stem {
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    font-size: 1.2rem;
    line-height: 1.5;
    background: transparent;
  }

  .question-card__stem :deep(.latex-text) {
    line-height: 1.5;
  }

  .question-card__media-item {
    border-color: #eeeeee;
    border-radius: 14px;
    box-shadow: none;
  }

  .question-card__options {
    margin-top: 1.25rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.85rem 1rem;
  }

  .opt-card {
    min-height: 68px;
    gap: 1rem;
    padding: 0.85rem 1.35rem;
    border: 1px solid #ececec;
    border-radius: 14px;
    box-shadow: none;
    font-size: 1.1rem;

    &:hover {
      border-color: #d6d6d6;
      background: #fafafa;
    }

    &--selected {
      border-color: #171717;
      background: #ffffff;
      box-shadow: 0 0 0 2px rgba(23, 23, 23, 0.08);

      .opt-card__bullet {
        border-color: #171717;
        background: #171717;
        color: #ffffff;
      }
    }

    &--wide {
      grid-column: 1 / -1;
    }
  }

  .opt-card__bullet {
    width: 36px;
    height: 36px;
    border: 1.5px solid #d4d4d4;
    background: #ffffff;
    color: #a0a0a0;
    font-size: 1rem;
    font-weight: 700;
  }

  .opt-card__text {
    color: #2a2a2a;
  }
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
  width: 100%;
  display: flex;
  justify-content: center;
}

.question-card__svg :deep(svg) {
  max-width: 100%;
  width: min(100%, 360px);
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

  &--correct {
    border-color: #10b981;
    background: #ecfdf5;
    .opt-card__bullet {
      background: #10b981;
      color: #ffffff;
    }
    &.opt-card--selected {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
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
