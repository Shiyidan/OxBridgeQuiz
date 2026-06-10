<template>
  <div class="practice-page">
    <NavBar />
    <main class="practice-shell">
      <aside class="question-nav" aria-label="题目导航">
        <h2 class="question-nav__title">题目导航</h2>
        <div class="question-nav__grid">
          <button
            v-for="(q, idx) in questions"
            :key="q.id || idx"
            type="button"
            class="question-nav__item"
            :class="navItemClass(q, idx)"
            :aria-label="`第 ${idx + 1} 题`"
            @click="goToQuestion(idx)"
          >
            {{ idx + 1 }}
          </button>
        </div>

        <div class="question-nav__stats">
          <div class="question-nav__stat">
            <span class="question-nav__dot question-nav__dot--answered" />
            <span>已答 {{ answeredCount }}</span>
          </div>
          <div class="question-nav__stat">
            <span class="question-nav__dot question-nav__dot--skipped" />
            <span>跳过 {{ skippedCount }}</span>
          </div>
          <div class="question-nav__stat">
            <span class="question-nav__dot question-nav__dot--pending" />
            <span>未答 {{ pendingCount }}</span>
          </div>
        </div>
      </aside>

      <section class="exam-panel" aria-live="polite">
        <template v-if="loading">
          <p class="practice-status">加载中...</p>
        </template>
        <template v-else-if="!currentQuestion">
          <p class="practice-status">暂无题目数据</p>
        </template>
        <template v-else>
          <header class="exam-panel__header">
            <div class="exam-panel__title">
              <strong>{{ paperTitle || 'ENGAA 2023 S1' }}</strong>
              <span>第{{ currentIndex + 1 }}/{{ totalCount }}题</span>
            </div>
            <div class="exam-panel__timer" aria-label="剩余时间">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l3 2" />
                <path d="M9 2h6" />
              </svg>
              <span>{{ timerText }}</span>
            </div>
          </header>

          <div class="exam-progress" aria-hidden="true">
            <span :style="{ width: progressPercent }" />
          </div>

          <div class="exam-panel__body">
            <div class="exam-tags">
              <span>第{{ currentIndex + 1 }}题</span>
              <span>{{ topicTitle }}</span>
            </div>

            <QuestionCard
              :key="currentQuestion.id"
              :question="currentQuestion"
              :index="currentIndex"
              :selected-answer="currentAnswer"
              variant="exam"
              @select="handleSelectAnswer"
            />
          </div>

          <footer class="exam-actions">
            <button
              type="button"
              class="exam-action exam-action--ghost"
              :disabled="currentIndex === 0"
              @click="handlePrev"
            >
              上一题
            </button>
            <div class="exam-actions__right">
              <button
                v-if="!isLastQuestion"
                type="button"
                class="exam-action exam-action--ghost"
                @click="handleNext"
              >
                下一题
              </button>
              <button
                type="button"
                class="exam-action exam-action--dark"
                @click="handleSubmit"
              >
                提前交卷
              </button>
            </div>
          </footer>
        </template>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// 在线答题页（从试题库加载真实题目，支持 topic + difficulty 筛选）
import { ref, computed, shallowRef, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import request from '@/utils/request'
import type { Question } from '@/types'

const EXAM_SECONDS = 60 * 60

const route = useRoute()
const router = useRouter()

const questions = shallowRef<Question[]>([])
const paperTitle = ref<string>('')
const loading = ref<boolean>(true)
const currentIndex = ref<number>(0)
const remainingSeconds = ref<number>(EXAM_SECONDS)
const visitedIndexes = ref<Set<number>>(new Set([0]))
const answers = ref<Record<string, string>>({})
const startedAt = Date.now()
const submitting = ref(false)

let timerId: number | undefined

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
const answeredCount = computed<number>(() => Object.keys(answers.value).length)
const skippedCount = computed<number>(() => {
  let count = 0
  visitedIndexes.value.forEach((idx) => {
    const question = questions.value[idx]
    if (idx !== currentIndex.value && question && !answers.value[question.id]) count++
  })
  return count
})
const pendingCount = computed<number>(() =>
  Math.max(totalCount.value - answeredCount.value - skippedCount.value, 0)
)
const progressPercent = computed<string>(() => {
  if (!totalCount.value) return '0%'
  return `${((currentIndex.value + 1) / totalCount.value) * 100}%`
})
const timerText = computed<string>(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
const topicTitle = computed<string>(() => (currentQuestion.value as any)?.subject || '')

async function loadQuestions(): Promise<void> {
  loading.value = true
  try {
    const topic = route.query.topic as string | undefined
    const difficulty = route.query.difficulty as string | undefined

    // 试题库 API，传知识点（学科）和难度
    const params = new URLSearchParams()
    if (topic && topic !== 'all') params.set('subject', topic)
    if (difficulty) params.set('difficulty', difficulty)

    const res = await request.get<{ questions: Question[] }>(
      `/papers/question-bank?${params.toString()}`
    )
    const qs = res.data.questions || []
    questions.value = qs.map((q: any) => ({
      ...q,
      id: q.id || String(q.number),
      order: q.number,
    }))
    paperTitle.value = '试题库练习'
    console.log('[Practice] 从试题库加载', questions.value.length, '道题, topic:', topic, 'difficulty:', difficulty)
  } catch (e) {
    console.error('[Practice] 加载失败', e)
    questions.value = []
  } finally {
    loading.value = false
  }
}

function markVisited(index: number): void {
  visitedIndexes.value = new Set([...visitedIndexes.value, index])
}

function goToQuestion(index: number): void {
  currentIndex.value = index
  markVisited(index)
}

function navItemClass(question: Question, index: number): Record<string, boolean> {
  return {
    'question-nav__item--current': currentIndex.value === index,
    'question-nav__item--answered': Boolean(answers.value[question.id]),
    'question-nav__item--skipped':
      visitedIndexes.value.has(index) && !answers.value[question.id] && currentIndex.value !== index,
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
  if (currentIndex.value > 0) goToQuestion(currentIndex.value - 1)
}

function handleNext(): void {
  if (currentIndex.value < totalCount.value - 1) goToQuestion(currentIndex.value + 1)
}

async function handleSubmit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await request.post<{
      examRecordId: string
      totalQuestions: number
      correctCount: number
      wrongCount: number
    }>('/exams/submit', {
      questions: questions.value,
      answers: { ...answers.value },
      startedAt: new Date(startedAt).toISOString(),
      difficulty: route.query.difficulty,
      subject: route.query.topic !== 'all' ? route.query.topic : undefined,
    })
    const data = res.data
    router.push({
      path: '/exam-result',
      query: {
        id: data.examRecordId,
        total: String(data.totalQuestions),
        correct: String(data.correctCount),
        wrong: String(data.wrongCount),
        time: String(Math.round((Date.now() - startedAt) / 1000)),
      },
    })
  } catch (e: any) {
    ElMessage.error(e.response?.data?.errMsg || '交卷失败，请重试')
  } finally {
    submitting.value = false
  }
}

function startTimer(): void {
  timerId = window.setInterval(() => {
    if (remainingSeconds.value > 0) remainingSeconds.value--
  }, 1000)
}

onMounted(() => {
  loadQuestions()
  startTimer()
})

onUnmounted(() => {
  if (timerId) window.clearInterval(timerId)
})
</script>

<style scoped lang="scss">
.practice-page {
  --exam-bg: #fafafa;
  --exam-surface: #ffffff;
  --exam-ink: #1d1d1f;
  --exam-muted: #9b9b9b;
  --exam-border: #e9e9e9;
  --exam-soft: #f4f4f4;

  min-height: 100vh;
  padding: 12px 24px;
  background: #ffffff;
  color: var(--exam-ink);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei',
    Roboto, sans-serif;
}

.practice-shell {
  min-height: calc(100vh - 24px);
  padding: clamp(44px, 7vh, 72px) clamp(24px, 7vw, 126px);
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 44px;
  align-items: start;
  background: var(--exam-bg);
  border: 1px solid var(--exam-border);
  border-radius: 28px;
}

.question-nav,
.exam-panel {
  background: var(--exam-surface);
  border: 1px solid var(--exam-border);
  border-radius: 18px;
}

.question-nav {
  position: sticky;
  top: 28px;
  align-self: start;
  max-height: calc(100vh - 56px);
  overflow: auto;
  padding: 32px 30px;
}

.question-nav__title {
  margin: 0 0 24px;
  color: #9a9a9a;
  font-size: 1.05rem;
  font-weight: 700;
}

.question-nav__grid {
  display: grid;
  grid-template-columns: repeat(5, 44px);
  gap: 11px;
}

.question-nav__item {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 9px;
  background: #f2f2f2;
  color: #9a9a9a;
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    background: #e8e8e8;
    color: #232323;
  }

  &--answered {
    background: #171717;
    color: #ffffff;
  }

  &--current:not(&--answered) {
    color: #171717;
    box-shadow: inset 0 0 0 2px #d8d8d8;
  }

  &--skipped {
    background: #e8e8e8;
  }
}

.question-nav__stats {
  margin-top: 30px;
  padding-top: 28px;
  border-top: 1px solid #eeeeee;
  display: grid;
  gap: 18px;
}

.question-nav__stat {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #777777;
  font-size: 1rem;
}

.question-nav__dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  background: #f3f3f3;

  &--answered {
    background: #171717;
  }

  &--skipped {
    background: #e6e6e6;
  }
}

.exam-panel {
  min-width: 0;
  padding: 52px 56px 34px;
}

.exam-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.exam-panel__title {
  display: flex;
  align-items: baseline;
  gap: 16px;
  min-width: 0;
  font-size: 1.25rem;

  strong {
    font-size: 1.28rem;
    font-weight: 800;
  }

  span {
    color: var(--exam-muted);
    white-space: nowrap;
  }
}

.exam-panel__timer {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #171717;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0;

  svg {
    width: 22px;
    height: 22px;
  }
}

.exam-progress {
  height: 5px;
  margin-top: 24px;
  border-radius: 999px;
  overflow: hidden;
  background: #eeeeee;

  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: #171717;
    transition: width 0.2s ease;
  }
}

.exam-panel__body {
  margin-top: 26px;
}

.exam-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;

  span {
    padding: 10px 16px;
    border-radius: 7px;
    background: var(--exam-soft);
    color: #9b9b9b;
    font-size: 1rem;
    font-weight: 700;
  }
}

.exam-actions {
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.exam-actions__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.exam-action {
  min-width: 96px;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 9px;
  border: 1px solid var(--exam-border);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease;

  &:disabled {
    cursor: not-allowed;
    color: #c6c6c6;
    background: #f5f5f5;
  }

  &--ghost {
    background: #ffffff;
    color: #4a4a4a;

    &:hover:not(:disabled) {
      background: #f6f6f6;
      border-color: #d8d8d8;
    }
  }

  &--dark {
    border-color: #171717;
    background: #171717;
    color: #ffffff;
  }
}

.practice-status {
  margin: 0;
  padding: 72px 0;
  text-align: center;
  color: var(--exam-muted);
  font-size: 1rem;
}

@media (max-width: 1100px) {
  .practice-shell {
    grid-template-columns: 250px minmax(0, 1fr);
    gap: 24px;
    padding: 32px 24px;
  }

  .question-nav {
    top: 24px;
    max-height: calc(100vh - 48px);
    padding: 26px 22px;
  }

  .question-nav__grid {
    grid-template-columns: repeat(4, 42px);
  }

  .exam-panel {
    padding: 44px 36px 30px;
  }
}

@media (max-width: 820px) {
  .practice-page {
    padding: 0;
  }

  .practice-shell {
    min-height: 100vh;
    grid-template-columns: 1fr;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .question-nav {
    position: static;
    max-height: none;
    align-self: auto;
  }

  .question-nav__grid {
    grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
  }

  .question-nav__item {
    width: 100%;
  }

  .exam-panel__header,
  .exam-actions {
    align-items: flex-start;
    flex-direction: column;
  }

  .exam-actions__right {
    width: 100%;
  }

  .exam-action {
    flex: 1;
  }
}

@media (max-width: 560px) {
  .practice-shell {
    padding: 18px 14px;
  }

  .exam-panel,
  .question-nav {
    border-radius: 14px;
  }

  .exam-panel {
    padding: 28px 18px 22px;
  }

  .exam-panel__title {
    flex-direction: column;
    gap: 4px;
  }

  .exam-progress {
    margin-top: 18px;
  }

  .exam-panel__body {
    margin-top: 22px;
  }
}
</style>
