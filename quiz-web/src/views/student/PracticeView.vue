<!-- 试题库和诊断测试共用的在线答题页 -->
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
          <div>
            <span class="question-nav__dot question-nav__dot--answered" />已答 {{ answeredCount }}
          </div>
          <div>
            <span class="question-nav__dot question-nav__dot--skipped" />跳过 {{ skippedCount }}
          </div>
          <div>
            <span class="question-nav__dot question-nav__dot--pending" />未答 {{ pendingCount }}
          </div>
        </div>
      </aside>

      <section class="exam-panel" aria-live="polite">
        <p v-if="loading" class="practice-status">加载中...</p>
        <p v-else-if="!currentQuestion" class="practice-status">暂无题目数据</p>
        <template v-else>
          <header class="exam-panel__header">
            <div class="exam-panel__title">
              <strong>{{ paperTitle || '试题库练习' }}</strong>
              <span>第 {{ currentIndex + 1 }}/{{ totalCount }} 题</span>
            </div>
            <div class="exam-panel__timer" aria-label="剩余时间">{{ timerText }}</div>
          </header>

          <div class="exam-progress" aria-hidden="true">
            <span :style="{ width: progressPercent }" />
          </div>

          <div class="exam-panel__body">
            <div class="exam-tags">
              <span>第 {{ currentIndex + 1 }} 题</span>
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
              <button type="button" class="exam-action exam-action--dark" @click="handleSubmit">
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
// 在线答题页：试题库按考点取题，诊断测试按 paperId 取整套真题。
import { ref, computed, shallowRef, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import { getQuestionsData } from '@/api/questionBank'
import { getPaperDetailData } from '@/api/papers'
import { submitExam } from '@/api/exam'
import type { Question } from '@/types'

const EXAM_SECONDS = 60 * 60
const route = useRoute()
const router = useRouter()

const questions = shallowRef<Question[]>([])
const paperTitle = ref('')
const loading = ref(true)
const currentIndex = ref(0)
const remainingSeconds = ref(EXAM_SECONDS)
const visitedIndexes = ref<Set<number>>(new Set([0]))
const answers = ref<Record<string, string>>({})
const startedAt = Date.now()
const submitting = ref(false)
let timerId: number | undefined

const totalCount = computed(() => questions.value.length)
const currentQuestion = computed(() => questions.value[currentIndex.value])
const isLastQuestion = computed(
  () => totalCount.value > 0 && currentIndex.value === totalCount.value - 1,
)
const currentAnswer = computed(() =>
  currentQuestion.value ? answers.value[currentQuestion.value.id] : undefined,
)
const answeredCount = computed(() => Object.keys(answers.value).length)
const skippedCount = computed(() => {
  let count = 0
  visitedIndexes.value.forEach((idx) => {
    const question = questions.value[idx]
    if (idx !== currentIndex.value && question && !answers.value[question.id]) count++
  })
  return count
})
const pendingCount = computed(() =>
  Math.max(totalCount.value - answeredCount.value - skippedCount.value, 0),
)
const progressPercent = computed(() =>
  totalCount.value ? `${((currentIndex.value + 1) / totalCount.value) * 100}%` : '0%',
)
const timerText = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
const topicTitle = computed(() => (currentQuestion.value as any)?.subject || '')

// 根据路由来源切换数据源：paperId 为真题套卷，否则按考点和难度从题库取题。
async function loadQuestions(): Promise<void> {
  loading.value = true
  try {
    const code = route.query.code as string | undefined
    const difficulty = route.query.difficulty as string | undefined
    const paperId = route.query.paperId as string | undefined

    if (paperId) {
      const paper = await getPaperDetailData(paperId)
      questions.value = (paper.questions || []).map((q: any, index: number) => ({
        ...q,
        id: q.id || `paper-${paper.id}-${q.number || index + 1}`,
        order: q.number || index + 1,
      }))
      paperTitle.value = paper.title
      remainingSeconds.value = Math.max(1, paper.duration || 60) * 60
      return
    }

    const qs = (await getQuestionsData({ code, difficulty })) || []
    questions.value = qs.map((q: any) => ({
      ...q,
      id: q.id || `${q._paperId || 'paper'}-${q.number}`,
      order: q.number,
    }))
    paperTitle.value = '试题库练习'
  } catch (e) {
    console.error('[Practice] 加载失败', e)
    questions.value = []
  } finally {
    loading.value = false
  }
}

// 记录访问过的题号，用于区分未看过和跳过的题目状态。
function markVisited(index: number): void {
  visitedIndexes.value = new Set([...visitedIndexes.value, index])
}

// 题号导航和上下题共用该方法，切题时同步访问状态。
function goToQuestion(index: number): void {
  currentIndex.value = index
  markVisited(index)
}

// 根据当前题、已答题、已访问状态计算左侧题号样式。
function navItemClass(question: Question, index: number): Record<string, boolean> {
  return {
    'question-nav__item--current': currentIndex.value === index,
    'question-nav__item--answered': Boolean(answers.value[question.id]),
    'question-nav__item--skipped':
      visitedIndexes.value.has(index) &&
      !answers.value[question.id] &&
      currentIndex.value !== index,
  }
}

// 选项点击后按题目 id 写入答案，便于交卷时组装 answerMap。
function handleSelectAnswer(label: string): void {
  if (!currentQuestion.value) return
  answers.value = { ...answers.value, [currentQuestion.value.id]: label }
}

// 上一题按钮只在非首题时切换，避免越界访问题目数组。
function handlePrev(): void {
  if (currentIndex.value > 0) goToQuestion(currentIndex.value - 1)
}

// 下一题按钮只在非末题时切换，末题交由交卷按钮完成流程。
function handleNext(): void {
  if (currentIndex.value < totalCount.value - 1) goToQuestion(currentIndex.value + 1)
}

// 交卷后保留来源参数，结果页据此区分返回诊断测试或试题库。
async function handleSubmit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    const data = await submitExam({
      questions: questions.value,
      answers: { ...answers.value },
      startedAt: new Date(startedAt).toISOString(),
      difficulty: route.query.difficulty as string,
      code: route.query.code as string,
      paperId: route.query.paperId as string,
    })
    router.push({
      path: '/exam-result',
      query: {
        id: data.examRecordId,
        total: String(data.totalQuestions),
        correct: String(data.correctCount),
        wrong: String(data.wrongCount),
        time: String(Math.round((Date.now() - startedAt) / 1000)),
        source: route.query.paperId ? 'assessment' : 'question-bank',
      },
    })
  } catch (e: any) {
    ElMessage.error(e.response?.data?.errMsg || '交卷失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 本地计时只负责页面倒计时，最终用时以开始和提交时间差计算。
function startTimer(): void {
  timerId = window.setInterval(() => {
    if (remainingSeconds.value > 0) remainingSeconds.value--
  }, 1000)
}

// 页面进入后同时拉题和启动计时，保证首屏可答题且计时同步开始。
onMounted(() => {
  loadQuestions()
  startTimer()
})

// 离开答题页时清理计时器，避免后台继续扣时或重复计时。
onUnmounted(() => {
  if (timerId) window.clearInterval(timerId)
})
</script>

<style scoped lang="scss">
.practice-page {
  min-height: 100vh;
  background: #fff;
  color: #1d1d1f;
}
.practice-shell {
  min-height: calc(100vh - 64px);
  padding: 48px clamp(20px, 6vw, 96px);
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 32px;
  background: #fafafa;
}
.question-nav,
.exam-panel {
  background: #fff;
  border: 1px solid #e9e9e9;
  border-radius: 8px;
}
.question-nav {
  padding: 24px;
  position: sticky;
  top: 84px;
}
.question-nav__title {
  margin: 0 0 18px;
  font-size: 18px;
}
.question-nav__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.question-nav__item {
  height: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
.question-nav__item--current {
  border-color: #2563eb;
  color: #2563eb;
  font-weight: 700;
}
.question-nav__item--answered {
  background: #ecfdf5;
  border-color: #86efac;
}
.question-nav__item--skipped {
  background: #fff7ed;
  border-color: #fdba74;
}
.question-nav__stats {
  margin-top: 20px;
  display: grid;
  gap: 10px;
  color: #64748b;
  font-size: 14px;
}
.question-nav__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  background: #cbd5e1;
}
.question-nav__dot--answered {
  background: #22c55e;
}
.question-nav__dot--skipped {
  background: #f97316;
}
.exam-panel {
  padding: 28px;
}
.exam-panel__header,
.exam-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.exam-panel__title {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.exam-panel__timer {
  font-weight: 800;
  color: #1d4ed8;
}
.exam-progress {
  height: 4px;
  margin: 18px 0 28px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}
.exam-progress span {
  display: block;
  height: 100%;
  background: #2563eb;
}
.exam-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  color: #64748b;
  font-size: 14px;
}
.exam-action {
  min-width: 96px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
}
.exam-action--dark {
  background: #1f2937;
  color: #fff;
  border-color: #1f2937;
}
.exam-actions__right {
  display: flex;
  gap: 12px;
}
.practice-status {
  padding: 48px;
  text-align: center;
  color: #64748b;
}
@media (max-width: 900px) {
  .practice-shell {
    grid-template-columns: 1fr;
  }
  .question-nav {
    position: static;
  }
}
</style>
