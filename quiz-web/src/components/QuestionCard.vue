<!-- 题目通用渲染卡：按内容块顺序安全展示文本、公式、题图与选项。 -->
<template>
  <article :class="['question-card', `question-card--${variant}`]">
    <!-- 题号小标 -->
    <div class="question-card__label">{{ questionLabel || `Question ${index + 1}` }}</div>
    <div v-if="metaTags.length" class="question-card__meta-tags">
      <span v-for="tag in metaTags" :key="tag" class="question-card__meta-tag">
        {{ tag }}
      </span>
    </div>

    <!-- 内容区：按标准 content_blocks 渲染图文混排题干 -->
    <div class="question-card__prompt">
      <template v-for="(block, idx) in contentBlocks" :key="idx">
        <div v-if="block.type === 'paragraph'" class="question-card__stem">
          <LatexText :text="block.text" />
        </div>
        <div
          v-else-if="block.type === 'image_ref' && getImageById(block.image_id)"
          class="question-card__media"
        >
          <div class="question-card__media-item">
            <img
              v-if="isSvgImage(block.image_id)"
              class="question-card__svg"
              :src="getSvgImageSrc(block.image_id)"
              :alt="getImageAlt(block.image_id, block.alt)"
            />
            <img
              v-else
              :src="getRasterImageSrc(block.image_id)"
              :alt="getImageAlt(block.image_id, block.alt)"
              class="question-card__img"
            />
          </div>
        </div>
      </template>
    </div>

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
          <span v-if="opt.image_id && getImageById(opt.image_id)" class="opt-card__media">
            <img
              v-if="isSvgImage(opt.image_id)"
              class="opt-card__svg"
              :src="getSvgImageSrc(opt.image_id)"
              :alt="getImageAlt(opt.image_id)"
            />
            <img
              v-else
              :src="getRasterImageSrc(opt.image_id)"
              :alt="getImageAlt(opt.image_id)"
              class="opt-card__img"
            />
          </span>
        </span>
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
// 题目渲染卡片（试题库、练习页、试卷预览共用）
import { computed } from 'vue'
import LatexText from './LatexText.vue'
import type { QuestionImage, RenderableQuestion } from '@/types'

interface Props {
  question: RenderableQuestion
  index: number
  selectedAnswer?: string
  showAnswer?: boolean
  variant?: 'default' | 'exam'
  metaTags?: string[]
  questionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  showAnswer: false,
  metaTags: () => [],
})

const emit = defineEmits<{
  (e: 'select', label: string): void
}>()

// 历史题缺少内容块时回退到 title，避免预览和报告出现空题干。
const contentBlocks = computed(() => {
  if (Array.isArray(props.question.content_blocks) && props.question.content_blocks.length) {
    return props.question.content_blocks
  }
  return [{ type: 'paragraph' as const, text: props.question.title || '' }]
})

// 根据 image_ref 的 image_id 匹配 images 数组中的图片
function getImageById(imageId: string | undefined): QuestionImage | null {
  if (!imageId) return null
  return (props.question.images || []).find((i) => i.id === imageId) || null
}

// 组件只上报选项标签，答案状态由考试页或预览页维护。
const handleSelect = (label: string): void => {
  emit('select', label)
}

function normalizeImageSrc(src: string): string {
  if (/^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(src)) return src
  if (/^(https?:|blob:|\/)/i.test(src)) return src
  if (/^[a-z][a-z0-9+.-]*:/i.test(src)) return ''
  return `/${src.replace(/^\.?\//, '')}`
}

function getImageAlt(imageId: string | undefined, fallback = ''): string {
  return getImageById(imageId)?.alt || fallback
}

function isSvgImage(imageId: string | undefined): boolean {
  return getImageById(imageId)?.type === 'svg'
}

function getRasterImageSrc(imageId: string | undefined): string {
  const image = getImageById(imageId)
  return image?.type === 'image' ? normalizeImageSrc(image.src) : ''
}

function getSvgImageSrc(imageId: string | undefined): string {
  const image = getImageById(imageId)
  return image?.type === 'svg'
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(image.svg)}`
    : ''
}

const answerSet = computed<Set<string>>(() => new Set(props.question.answer || []))

function optionClass(text: string | undefined, label: string): Record<string, boolean> {
  const normalizedText = (text || '').replace(/\$+/g, '').replace(/\s+/g, ' ').trim()
  return {
    'opt-card--selected': props.selectedAnswer === label,
    'opt-card--correct': props.showAnswer && answerSet.value.has(label),
    'opt-card--wrong':
      props.showAnswer && props.selectedAnswer === label && !answerSet.value.has(label),
    'opt-card--wide': props.variant === 'exam' && normalizedText.length > 42,
  }
}
</script>

<style scoped lang="scss">
.question-card {
  width: 100%;
}

.question-card--exam {
  color: var(--color-ink);

  .question-card__label {
    margin: 0 0 10px;
    color: var(--color-ink-muted);
    font-size: var(--text-lg);
    font-weight: var(--weight-semi);
    letter-spacing: 0;
  }

  .question-card__meta-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: -2px 0 14px;
  }

  .question-card__meta-tag {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-pill);
    background: var(--color-hover);
    color: var(--color-ink-soft);
    font-size: var(--text-xs);
    font-weight: var(--weight-semi);
  }

  .question-card__prompt {
    min-height: 180px;
    padding: 24px 28px;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
  }

  .question-card__stem {
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    font-size: var(--text-lg);
    line-height: 1.6;
    background: transparent;
    color: var(--color-ink);
  }

  .question-card__stem + .question-card__stem {
    margin-top: 10px;
  }

  .question-card__stem :deep(.latex-text) {
    display: block;
    line-height: 1.6;
  }

  .question-card__stem :deep(.latex-text__plain) {
    display: inline;
  }

  .question-card__stem :deep(.formula-block--display) {
    margin: 22px 0;
    text-align: center;
  }

  .question-card__stem :deep(.katex-display) {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .question-card__media {
    margin: 16px 0;
  }

  .question-card__media-item {
    border: 0;
    border-radius: var(--radius-lg);
    box-shadow: none;
    padding: 0;
    background: transparent;
  }

  .question-card__svg {
    width: min(100%, 320px);
    max-height: 280px;
    margin: 0 auto;
    object-fit: contain;
  }

  .question-card__img {
    max-width: min(100%, 420px);
    max-height: 300px;
    object-fit: contain;
  }

  .question-card__options {
    margin-top: 18px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
  }

  .opt-card {
    min-height: 56px;
    gap: 14px;
    padding: 12px 18px;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-xl);
    background: var(--color-surface);
    box-shadow: none;
    color: var(--color-ink);
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
    transition:
      background var(--duration-base) ease,
      border-color var(--duration-base) ease,
      box-shadow var(--duration-base) ease,
      transform var(--duration-fast) ease;

    &:hover {
      border-color: var(--color-ink);
      background: var(--color-surface-alt);
    }

    &--selected {
      border-color: var(--color-ink);
      background: var(--color-hover);
      box-shadow: inset 0 0 0 1px var(--color-ink);

      .opt-card__bullet {
        background: var(--color-ink);
        color: var(--color-ink-inverse);
      }
    }

    &--correct {
      border-color: var(--color-success);
      background: var(--color-success-bg);
      box-shadow: none;

      .opt-card__bullet {
        background: var(--color-success);
        color: var(--color-ink-inverse);
      }
    }

    &--wrong {
      border-color: var(--color-danger);
      background: var(--color-danger-bg);
      box-shadow: none;

      .opt-card__bullet {
        background: var(--color-danger);
        color: var(--color-ink-inverse);
      }
    }

    &--wide {
      grid-column: 1 / -1;
    }
  }

  .opt-card__bullet {
    width: 32px;
    height: 32px;
    border: 0;
    background: var(--color-hover);
    color: var(--color-ink-soft);
    font-size: var(--text-sm);
    font-weight: var(--weight-bold);
  }

  .opt-card__text {
    color: var(--color-ink);
    line-height: var(--leading-normal);
  }

  .opt-card__text :deep(.latex-text) {
    line-height: var(--leading-normal);
  }

  .opt-card__text :deep(.katex) {
    font-size: 1em;
  }

  .opt-card__text :deep(.katex-display) {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }
}

/* ========== 题干卡 ========== */
.question-card__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink-muted);
  margin: 0 0 0.5rem;
  letter-spacing: 0.02em;
}

.question-card__stem {
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  padding: 1.5rem 1.75rem;
  font-size: 1rem;
  line-height: 1.75;
  color: var(--color-ink);
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
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  padding: 1.25rem;
  display: flex;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.question-card__svg {
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
  border: 1.5px solid var(--color-line);
  border-radius: var(--radius-xl);
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
  width: 100%;

  &:hover {
    border-color: var(--color-ink);
    background: var(--color-hover);
  }

  &:active {
    transform: scale(0.99);
  }

  &--selected {
    border-color: var(--color-ink);
    background: var(--color-hover);
    box-shadow: inset 0 0 0 1px var(--color-ink);

    .opt-card__bullet {
      background: var(--color-ink);
      color: var(--color-ink-inverse);
    }
  }

  &--correct {
    border-color: var(--color-success);
    background: var(--color-success-bg);
    .opt-card__bullet {
      background: var(--color-success);
      color: var(--color-ink-inverse);
    }
    &.opt-card--selected {
      border-color: var(--color-success);
      box-shadow: inset 0 0 0 1px var(--color-success);
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
  background: var(--color-hover);
  color: var(--color-ink-soft);
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
  transition:
    background 0.18s ease,
    color 0.18s ease;
}

.opt-card__text {
  flex: 1;
  min-width: 0;
  line-height: 1.5;
  word-break: break-word;
}

.opt-card__media {
  display: block;
  margin-top: 4px;
}

.opt-card__svg {
  display: block;
  max-width: 100%;
  height: auto;
}

.opt-card__img {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  display: block;
}

/* 选项中的 katex 公式略微下移以与字母对齐 */
.opt-card__text :deep(.katex) {
  font-size: 1em;
}
</style>
