<template>
  <div class="practice-page">
    <!-- ========== 顶部 ========== -->
    <header class="practice-header">
      <div class="practice-header__inner">
        <div class="practice-header__left">
          <button
            type="button"
            class="practice-back"
            aria-label="返回试题库"
            @click="handleExit"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div class="practice-header__lead">
            <h1 class="practice-title">
              <span class="practice-title__prefix">知识点攻克：</span>
              <span class="practice-title__topic">{{ topicTitle }}</span>
            </h1>
            <p class="practice-meta">
              练习
              <strong class="practice-meta__progress">
                {{ currentIndex + 1 }} / {{ totalCount || '–' }}
              </strong>
              <span class="practice-meta__sep">•</span>
              <span :class="['practice-meta__diff', `diff--${difficultyId}`]">
                {{ difficultyLabel }}
              </span>
              <span class="practice-meta__sep">•</span>
              <span class="practice-meta__source">ESAT 历年真题</span>
            </p>
          </div>
        </div>
        <button type="button" class="practice-exit" @click="handleExit">
          退出练习
        </button>
      </div>
    </header>

    <!-- ========== 题目主体 ========== -->
    <main class="practice-main">
      <div class="practice-main__inner">
        <p v-if="loading" class="practice-status">加载中...</p>
        <p v-else-if="!currentQuestion" class="practice-status">暂无题目数据</p>
        <QuestionCard
          v-else
          :question="currentQuestion"
          :index="currentIndex"
          :selected-answer="currentAnswer"
          @select="handleSelectAnswer"
        />
      </div>
    </main>

    <!-- ========== 底部操作 ========== -->
    <footer class="practice-footer">
      <div class="practice-footer__inner">
        <button
          type="button"
          class="practice-btn practice-btn--secondary"
          :disabled="currentIndex === 0"
          @click="handlePrev"
        >
          上一题
        </button>
        <div class="practice-footer__right">
          <button
            v-if="!isLastQuestion"
            type="button"
            class="practice-btn practice-btn--primary"
            @click="handleNext"
          >
            下一题
          </button>
          <button
            type="button"
            class="practice-btn practice-btn--dark"
            @click="handleSubmit"
          >
            提前交卷
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QuestionCard from '@/components/QuestionCard.vue'
import type { Question } from '@/types'

interface PaperPayload {
  questions: Question[]
}

/** 当前练习渲染第 1-4 题（对应 PDF 第 4-6 页：preview_page4/5/6.png） */
const TARGET_ORDERS: number[] = [1, 2, 3, 4]

const TOPIC_NAMES: Record<string, string> = {
  all: '综合训练 (All Topics)',
  algebra: 'Algebra and functions',
  sequences: 'Sequences and series',
  coordinate: 'Coordinate geometry',
  trigonometry: 'Trigonometry',
  exponentials: 'Exponentials and logarithms',
  differentiation: 'Differentiation',
  integration: 'Integration',
  graphs: 'Graphs of functions',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单难度 (Easy)',
  medium: '中等难度 (Medium)',
  hard: '困难难度 (Hard)',
  composite: '复合难度 (Composite)',
}

const route = useRoute()
const router = useRouter()

const topicId = computed<string>(
  () => (route.query.topic as string) || 'all'
)
const difficultyId = computed<string>(
  () => (route.query.difficulty as string) || 'easy'
)

const topicTitle = computed<string>(
  () => TOPIC_NAMES[topicId.value] || topicId.value
)
const difficultyLabel = computed<string>(
  () => DIFFICULTY_LABELS[difficultyId.value] || difficultyId.value
)

/**
 * shallowRef：题目数据是只读的，不需要深响应；
 * 切题时仅 currentIndex 变化，QuestionCard 通过 prop diff 高效更新。
 */
const questions = shallowRef<Question[]>([])
const loading = ref<boolean>(true)
const currentIndex = ref<number>(0)

/** answers: 题目 id → 选项 label，用 ref + 整体替换保证响应式 */
const answers = ref<Record<string, string>>({})

const totalCount = computed<number>(() => questions.value.length)
const currentQuestion = computed<Question | undefined>(
  () => questions.value[currentIndex.value]
)
const isLastQuestion = computed<boolean>(
  () => totalCount.value > 0 && currentIndex.value === totalCount.value - 1
)
const currentAnswer = computed<string | undefined>(() =>
  currentQuestion.value ? answers.value[currentQuestion.value.id] : undefined
)

async function loadQuestions(): Promise<void> {
  loading.value = true
  try {
    const res = await fetch('/data/paper.json')
    if (!res.ok) throw new Error('paper.json 请求失败')
    const data: PaperPayload = await res.json()
    questions.value = data.questions
      .filter((q) => typeof q.order === 'number' && TARGET_ORDERS.includes(q.order))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    console.log('[Practice] 加载题目', questions.value.length, '道')
  } catch (e) {
    console.error('[Practice] 加载失败', e)
    questions.value = []
  } finally {
    loading.value = false
  }
}

function handleSelectAnswer(label: string): void {
  if (!currentQuestion.value) return
  answers.value = {
    ...answers.value,
    [currentQuestion.value.id]: label,
  }
}

function handlePrev(): void {
  if (currentIndex.value > 0) currentIndex.value--
}

function handleNext(): void {
  if (currentIndex.value < totalCount.value - 1) currentIndex.value++
}

function handleSubmit(): void {
  console.log('[Practice] submit', { ...answers.value })
  const answeredCount = Object.keys(answers.value).length
  alert(
    `已交卷。共完成 ${answeredCount} / ${totalCount.value} 题。\n` +
      `答案：${JSON.stringify(answers.value)}`
  )
}

function handleExit(): void {
  if (Object.keys(answers.value).length > 0) {
    if (!window.confirm('确定要退出练习吗？当前作答将丢失。')) return
  }
  router.push('/question-bank')
}

onMounted(loadQuestions)
</script>

<style scoped lang="scss">
.practice-page {
  --color-primary: #4f46e5;
  --color-primary-light: #6366f1;
  --color-primary-dark: #4338ca;
  --color-primary-bg: #eef2ff;

  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-composite: #9333ea;

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
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei',
    Roboto, sans-serif;
}

/* ========== 顶部 ========== */
.practice-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.practice-header__inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

.practice-header__left {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;
}

.practice-back {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: var(--color-surface-muted);
    border-color: var(--color-text-muted);
  }
}

.practice-header__lead {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.practice-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--color-text);
  letter-spacing: -0.01em;
}

.practice-title__prefix {
  margin-right: 4px;
}

.practice-meta {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.practice-meta__progress {
  font-weight: 700;
  color: var(--color-text-secondary);
}

.practice-meta__sep {
  color: var(--color-border);
}

.practice-meta__diff {
  font-weight: 600;

  &.diff--easy {
    color: var(--color-success);
  }
  &.diff--medium {
    color: var(--color-warning);
  }
  &.diff--hard {
    color: var(--color-error);
  }
  &.diff--composite {
    color: var(--color-composite);
  }
}

.practice-exit {
  flex-shrink: 0;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0.5rem 0.25rem;
  transition: color 0.2s;

  &:hover {
    color: var(--color-text);
  }
}

/* ========== 主体 ========== */
.practice-main {
  flex: 1;
}

.practice-main__inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 2rem 2rem 6rem;
}

.practice-status {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.95rem;
  padding: 4rem 0;
}

/* ========== 底部 ========== */
.practice-footer {
  position: sticky;
  bottom: 0;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
}

.practice-footer__inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.practice-footer__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.practice-btn {
  padding: 0.75rem 1.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 1;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &--secondary {
    background: var(--color-surface);
    border-color: var(--color-border);
    color: var(--color-text-secondary);

    &:hover:not(:disabled) {
      background: var(--color-surface-muted);
      border-color: var(--color-text-muted);
      color: var(--color-text);
    }

    &:disabled {
      background: var(--color-surface-muted);
      color: var(--color-text-muted);
      border-color: var(--color-border-light);
      transform: none;
    }
  }

  &--primary {
    background: var(--color-primary);
    color: var(--color-text-inverse);

    &:hover:not(:disabled) {
      background: var(--color-primary-light);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
  }

  &--dark {
    background: var(--color-text);
    color: var(--color-text-inverse);

    &:hover:not(:disabled) {
      background: #1e293b;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.22);
    }
  }
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .practice-header__inner,
  .practice-main__inner,
  .practice-footer__inner {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .practice-title {
    font-size: 1.05rem;
  }

  .practice-meta {
    font-size: 0.8rem;
  }

  .practice-btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.875rem;
  }
}
</style>
