<!-- 题目通用渲染卡：按内容块顺序安全展示文本、公式、题图与选项。 -->
<template>
  <article :class="['question-card', `question-card--${variant}`]">
    <div class="question-card__header">
      <div class="question-card__heading">
        <!-- 题号小标 -->
        <div class="question-card__label">{{ questionLabel || `Question ${index + 1}` }}</div>
        <!-- <button
          v-if="showMark"
          type="button"
          class="question-card__mark"
          :class="{ 'question-card__mark--active': marked }"
          :disabled="disabled"
          :aria-label="marked ? '取消标记当前题目' : '标记当前题目'"
          :aria-pressed="marked"
          :title="marked ? '取消 Mark' : 'Mark 题目'"
          @click="emit('toggleMark')"
        >
          <el-icon><Flag /></el-icon>
        </button> -->
      </div>
      <div v-if="metaTags.length" class="question-card__meta-tags">
        <span v-for="tag in metaTags" :key="tag" class="question-card__meta-tag">
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- 内容区：按标准 content_blocks 渲染图文混排题干 -->
    <div
      class="question-card__prompt"
      :class="{ 'question-card__prompt--inline-flow': hasInlineContent }"
    >
      <template v-for="(block, idx) in contentBlocks" :key="idx">
        <span
          v-if="block.type === 'paragraph' && block.inline"
          class="question-card__stem question-card__stem--inline"
        >
          <span v-if="inlineSeparator(idx)">{{ inlineSeparator(idx) }}</span>
          <LatexText :text="block.text" />
        </span>
        <div
          v-else-if="block.type === 'paragraph'"
          class="question-card__stem"
          :class="{ 'question-card__stem--center': block.align === 'center' }"
        >
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

    <!-- 整道题统一采用双列或单列，避免同一组选项出现混杂布局。 -->
    <div
      ref="optionsContainer"
      class="question-card__options"
      :class="{ 'question-card__options--single': useSingleColumnOptions }"
    >
      <div
        v-for="row in optionRows"
        :key="row.map((option) => option.label).join('-')"
        class="question-card__option-row"
        :class="{ 'question-card__option-row--single': row.length === 1 }"
      >
        <button
          v-for="opt in row"
          :key="opt.label"
          type="button"
          class="opt-card"
          :class="optionClass(opt.label)"
          :disabled="disabled"
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
                @load="scheduleOptionLayoutMeasure"
              />
              <img
                v-else
                :src="getRasterImageSrc(opt.image_id)"
                :alt="getImageAlt(opt.image_id)"
                class="opt-card__img"
                @load="scheduleOptionLayoutMeasure"
              />
            </span>
          </span>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
// 题目渲染卡片（试题库、练习页、试卷预览共用）
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Flag } from '@element-plus/icons-vue'
import LatexText from './LatexText.vue'
import type { Option, QuestionImage, RenderableQuestion, RichContentBlock } from '@/types'

interface Props {
  question: RenderableQuestion
  index: number
  selectedAnswer?: string
  showAnswer?: boolean
  variant?: 'default' | 'exam'
  metaTags?: string[]
  questionLabel?: string
  disabled?: boolean
  showMark?: boolean
  marked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  showAnswer: false,
  metaTags: () => [],
  disabled: false,
  showMark: false,
  marked: false,
})

const emit = defineEmits<{
  (e: 'select', label: string): void
  (e: 'toggleMark'): void
}>()

const optionsContainer = ref<HTMLElement | null>(null)
const useSingleColumnOptions = ref(false)
let optionResizeObserver: ResizeObserver | null = null
let optionMeasureFrame: number | null = null
let optionMeasureVersion = 0
let observedOptionsWidth = 0

// 相邻选项先按双列候选布局分组，再由整组选项的实际尺寸统一决定列数。
const optionRows = computed<Option[][]>(() => {
  const rows: Option[][] = []
  for (let index = 0; index < props.question.options.length; index += 2) {
    rows.push(props.question.options.slice(index, index + 2))
  }
  return rows
})

// 历史题缺少内容块时回退到 title，避免预览和报告出现空题干。
const contentBlocks = computed<RichContentBlock[]>(() => {
  if (Array.isArray(props.question.content_blocks) && props.question.content_blocks.length) {
    return props.question.content_blocks
  }
  return [{ type: 'paragraph' as const, text: props.question.title || '' }]
})

const hasInlineContent = computed(() =>
  contentBlocks.value.some((block) => block.type === 'paragraph' && block.inline),
)

// 连续项目块默认补一个空格；标点片段直接衔接前文，避免出现英文标点前空格。
function inlineSeparator(index: number): string {
  if (index <= 0) return ''
  const current = contentBlocks.value[index]
  const previous = contentBlocks.value[index - 1]
  if (
    current?.type !== 'paragraph' ||
    !current.inline ||
    previous?.type !== 'paragraph' ||
    !previous.inline
  ) {
    return ''
  }
  return /^[,.;:!?)}\]]/.test(current.text.trimStart()) ? '' : ' '
}

// 根据 image_ref 的 image_id 匹配 images 数组中的图片
function getImageById(imageId: string | undefined): QuestionImage | null {
  if (!imageId) return null
  return (props.question.images || []).find((i) => i.id === imageId) || null
}

// 组件只上报选项标签，答案状态由考试页或预览页维护。
const handleSelect = (label: string): void => {
  if (props.disabled) return
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

function optionClass(label: string): Record<string, boolean> {
  return {
    'opt-card--selected': props.selectedAnswer === label,
    'opt-card--correct': props.showAnswer && answerSet.value.has(label),
    'opt-card--wrong':
      props.showAnswer && props.selectedAnswer === label && !answerSet.value.has(label),
  }
}

// 半列内发生换行、公式溢出或图片需要明显缩小时，整道题改用单列选项。
function optionNeedsSingleColumn(card: HTMLElement): boolean {
  const latexText = card.querySelector<HTMLElement>('.latex-text')
  const textContainer = card.querySelector<HTMLElement>('.opt-card__text')
  if (latexText && textContainer) {
    const textStyle = window.getComputedStyle(latexText)
    const fontSize = Number.parseFloat(textStyle.fontSize) || 16
    const lineHeight = Number.parseFloat(textStyle.lineHeight) || fontSize * 1.5
    if (latexText.getBoundingClientRect().height > lineHeight * 1.5) return true
    if (textContainer.scrollWidth > textContainer.clientWidth + 1) return true

    const displayFormula = latexText.querySelector<HTMLElement>('.katex-display')
    if (displayFormula && displayFormula.scrollWidth > textContainer.clientWidth + 1) return true
  }

  const media = card.querySelector<HTMLElement>('.opt-card__media')
  const image = media?.querySelector<HTMLImageElement>('img')
  if (!media || !image || !image.complete) return false
  const availableWidth = media.clientWidth
  return (
    (availableWidth > 0 && image.naturalWidth > availableWidth * 1.15) ||
    image.naturalHeight > 180
  )
}

// 每次先恢复双列测量，再把最终列数统一应用到整道题的全部选项。
async function measureOptionLayout(): Promise<void> {
  const container = optionsContainer.value
  if (!container || props.variant !== 'exam') {
    useSingleColumnOptions.value = false
    return
  }
  const version = ++optionMeasureVersion
  useSingleColumnOptions.value = false
  await nextTick()
  if (version !== optionMeasureVersion || optionsContainer.value !== container) return

  const cards = container.querySelectorAll<HTMLElement>('.opt-card')
  useSingleColumnOptions.value = [...cards].some(optionNeedsSingleColumn)
}

// 图片加载、题目切换和容器宽度变化共用一次动画帧内的布局测量。
function scheduleOptionLayoutMeasure(): void {
  if (optionMeasureFrame !== null) window.cancelAnimationFrame(optionMeasureFrame)
  optionMeasureFrame = window.requestAnimationFrame(() => {
    optionMeasureFrame = null
    void measureOptionLayout()
  })
}

watch(
  () => [props.question.id, props.question.options, props.variant],
  () => {
    observedOptionsWidth = 0
    useSingleColumnOptions.value = false
    scheduleOptionLayoutMeasure()
  },
  { flush: 'post' },
)

onMounted(() => {
  if (optionsContainer.value && typeof ResizeObserver !== 'undefined') {
    optionResizeObserver = new ResizeObserver(([entry]) => {
      const nextWidth = entry?.contentRect.width || 0
      if (Math.abs(nextWidth - observedOptionsWidth) < 1) return
      observedOptionsWidth = nextWidth
      scheduleOptionLayoutMeasure()
    })
    optionResizeObserver.observe(optionsContainer.value)
  }
  scheduleOptionLayoutMeasure()
})

onBeforeUnmount(() => {
  optionMeasureVersion += 1
  optionResizeObserver?.disconnect()
  if (optionMeasureFrame !== null) window.cancelAnimationFrame(optionMeasureFrame)
})
</script>

<style scoped lang="scss">
.question-card {
  width: 100%;
}

.question-card--exam {
  color: var(--color-ink);

  .question-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 14px;
  }

  .question-card__label {
    flex: 0 0 auto;
    margin: 0;
    // color: var(--color-ink-muted);
    font-size: var(--text-lg);
    // font-weight: var(--weight-semi);
    letter-spacing: 0;
  }

  .question-card__heading {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .question-card__mark {
    display: inline-grid;
    width: 28px;
    height: 28px;
    flex: 0 0 auto;
    padding: 0;
    place-items: center;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    transition:
      color 0.15s ease,
      background 0.15s ease;
  }

  .question-card__mark:hover {
    background: #f1f5f9;
    color: #64748b;
  }

  .question-card__mark:focus-visible {
    outline: 2px solid #94a3b8;
    outline-offset: 2px;
  }

  .question-card__mark:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .question-card__mark :deep(.el-icon) {
    font-size: 19px;
  }

  .question-card__mark :deep(path) {
    fill: transparent;
    stroke: currentColor;
    stroke-linejoin: round;
    stroke-width: 56px;
  }

  .question-card__mark--active {
    color: #ef4444;
  }

  .question-card__mark--active:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  .question-card__mark--active :deep(path) {
    fill: currentColor;
    stroke: currentColor;
  }

  .question-card__meta-tags {
    display: flex;
    max-width: 70%;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin: 0;
  }

  .question-card__meta-tag {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-pill);
    background: color-mix(in srgb, var(--color-ink) 8%, var(--color-surface));
    color: var(--color-ink-soft);
    font-size: var(--text-xs);
    font-weight: var(--weight-semi);
  }

  .question-card__prompt {
    min-height: 180px;
    padding: 24px 28px;
    border: 1px solid var(--color-line);
    border-radius: 5px;
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

  .question-card__stem--inline {
    display: inline;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
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
    padding-block: 0.12em;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .question-card__media {
    margin: 16px 0;
  }

  .question-card__media-item {
    border: 0;
    border-radius: 5px;
    box-shadow: none;
    padding: 0;
    background: transparent;
  }

  .question-card__svg {
    width: auto;
    max-width: 100%;
    height: 280px;
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
    margin-top: 12px;
    gap: 8px;
  }

  .question-card__option-row {
    gap: 16px;
  }

  .opt-card {
    min-height: 56px;
    gap: 14px;
    padding: 12px 18px;
    border: 1px solid var(--color-line);
    border-radius: 5px;
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

  }

  .opt-card__bullet {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 5px;
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
    font-size: 1.1em;
  }

  .opt-card__text :deep(.katex-display) {
    max-width: 100%;
    padding-block: 0.12em;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }
}

/* ========== 题干卡 ========== */
.question-card__prompt--inline-flow {
  padding: 1.5rem 1.75rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  color: var(--color-ink);
  font-size: 1rem;
  line-height: 1.75;
  word-break: break-word;
}

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

/* 试题中的普通文本使用 CSS 数学通用字体族，KaTeX 公式保留自身字体。 */
.question-card :deep(.latex-text__plain) {
  font-family: math;
}

.question-card__stem--center {
  text-align: center;
}

.question-card__stem--center :deep(.latex-text) {
  display: block;
}

.question-card__stem--inline {
  display: inline;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: inherit;
  font-size: inherit;
  line-height: inherit;
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
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.question-card__option-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.question-card__option-row--single {
  grid-template-columns: minmax(0, 1fr);
}

.question-card__options--single .question-card__option-row {
  grid-template-columns: minmax(0, 1fr);
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

  &:disabled,
  &:disabled:hover,
  &:disabled:active {
    border-color: var(--color-line);
    background: var(--color-surface);
    cursor: not-allowed;
    opacity: 0.68;
    transform: none;
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
  display: flex;
  justify-content: flex-start;
  max-width: 100%;
  margin-top: 4px;
}

.opt-card__svg {
  display: block;
  width: auto;
  max-width: 100%;
  height: 180px;
  object-fit: contain;
}

.opt-card__img {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  display: block;
}

/* 选项中的 katex 公式略微下移以与字母对齐 */
.opt-card__text :deep(.katex) {
  font-size: 1.1em;
}

@media (max-width: 760px) {
  .question-card__option-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
