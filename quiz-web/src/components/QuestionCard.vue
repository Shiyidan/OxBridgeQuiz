<template>
  <article :class="['question-card', `question-card--${variant}`]">
    <!-- 题号小标 -->
    <div class="question-card__label">Question {{ index + 1 }}</div>
    <div v-if="metaTags.length" class="question-card__meta-tags">
      <span
        v-for="tag in metaTags"
        :key="tag"
        class="question-card__meta-tag"
      >
        {{ tag }}
      </span>
    </div>

    <!-- 内容区：优先 content_blocks（图文混排），fallback 到 title + images -->
    <div class="question-card__prompt">
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
  metaTags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  showAnswer: false,
  metaTags: () => [],
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
    'opt-card--wrong':
      props.showAnswer && props.selectedAnswer === label && !correctAnswers.value.has(label),
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
    margin: 0 auto;
  }

  .question-card__svg :deep(svg) {
    width: 100%;
    max-height: 280px;
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
    font-size: 1.18em;
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

</style>
