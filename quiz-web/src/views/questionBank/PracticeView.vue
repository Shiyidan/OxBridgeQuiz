<!-- 试题库和诊断测试共用的在线答题页 -->
<template>
  <div class="practice-page">
    <header class="practice-topbar">
      <div class="practice-topbar__inner">
        <button
          type="button"
          class="practice-back-link"
          aria-label="返回试题库"
          @click="handleBackToQuestionBank"
        >
          <svg
            class="practice-back-link__icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>返回试题库</span>
        </button>
        <div v-if="currentQuestion" class="practice-topbar__exam" aria-live="polite">
          <div class="practice-topbar__exam-row">
            <strong class="practice-topbar__title">{{ examHeaderText }}</strong>
            <span class="practice-topbar__timer" aria-label="剩余时间">{{ timerText }}</span>
          </div>
          <div class="practice-topbar__progress" aria-hidden="true">
            <span :style="{ width: progressPercent }" />
          </div>
        </div>
      </div>
    </header>
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
        <button
          type="button"
          class="question-nav__submit"
          :disabled="submitting || !currentQuestion"
          @click="confirmSubmitExam"
        >
          提前交卷
        </button>
      </aside>

      <section class="exam-panel" aria-live="polite">
        <p v-if="loading" class="practice-status">加载中...</p>
        <p v-else-if="!currentQuestion" class="practice-status">暂无题目数据</p>
        <template v-else>
          <div class="exam-panel__body">
            <QuestionCard
              :key="currentQuestion.id"
              :question="currentQuestion"
              :index="currentIndex"
              :selected-answer="currentAnswer"
              :meta-tags="currentKnowledgeTags"
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
import { ElMessage, ElMessageBox } from 'element-plus'
import QuestionCard from '@/components/QuestionCard.vue'
import { getQuestionsData } from '@/api/questionBank'
import { getPaperDetailData } from '@/api/papers'
import { submitExam } from '@/api/exam'
import { checkMemberAccess, getMember } from '@/api/member'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_EXAM_TYPE, EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'
import type { Question } from '@/types'

const EXAM_SECONDS = 60 * 60
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const questions = shallowRef<Question[]>([])
const activeExamType = ref<ExamType>(DEFAULT_EXAM_TYPE)
const loading = ref(true)
const currentIndex = ref(0)
const remainingSeconds = ref(EXAM_SECONDS)
const visitedIndexes = ref<Set<number>>(new Set([0]))
const answers = ref<Record<string, string>>({})
const questionDurations = ref<Record<string, number>>({})
const startedAt = Date.now()
const submitting = ref(false)
let timerId: number | undefined
let questionEnteredAt = Date.now()

const totalCount = computed(() => questions.value.length)
const currentQuestion = computed(() => questions.value[currentIndex.value])
const isLastQuestion = computed(
  () => totalCount.value > 0 && currentIndex.value === totalCount.value - 1,
)
const currentAnswer = computed(() =>
  currentQuestion.value ? answers.value[currentQuestion.value.id] : undefined,
)
const answeredCount = computed(() => Object.keys(answers.value).length)
const unansweredCount = computed(() => Math.max(totalCount.value - answeredCount.value, 0))
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
const currentExamTypeLabel = computed(() => (
  EXAM_TYPE_OPTIONS.find((item) => item.value === activeExamType.value)?.label || activeExamType.value
))
const examHeaderText = computed(() => (
  totalCount.value ? `${currentExamTypeLabel.value}（第${currentIndex.value + 1}/${totalCount.value}题）` : currentExamTypeLabel.value
))
const currentKnowledgeTags = computed(() => {
  const question = currentQuestion.value as any
  if (!question) return []
  const points = normalizePointTags(question.syllabus_points || question.syllabusPoints)
  const fallbackPoints = normalizePointTags(question.knowledge_points || question.knowledgePoints)
  const tags = points.length ? points : fallbackPoints
  if (tags.length) return tags
  return topicTitle.value ? [topicTitle.value] : ['综合考点']
})

// 根据路由来源切换数据源：paperId 为真题套卷，否则按考点和难度从题库取题。
async function loadQuestions(): Promise<void> {
  loading.value = true
  try {
    const code = route.query.code as string | undefined
    const difficulty = route.query.difficulty as string | undefined
    const paperId = route.query.paperId as string | undefined

    if (paperId) {
      const paper = await getPaperDetailData(paperId)
      activeExamType.value = normalizeExamType(paper.examType)
      const loadedQuestions = (paper.questions || []).map((q: any, index: number) => ({
        ...q,
        id: q.id || `paper-${paper.id}-${q.number || index + 1}`,
        order: q.number || index + 1,
      }))
      const access = await checkMemberAccess({
        action: 'diagnostic',
        examType: activeExamType.value,
        questionCount: 1,
      })
      if (!access.allowed) {
        ElMessage.warning('当前诊断测试额度不足，请开通会员后继续')
        router.replace('/assessment')
        return
      }
      questions.value = loadedQuestions
      remainingSeconds.value = Math.max(1, paper.duration || 60) * 60
      return
    }

    const examType = normalizeExamType(route.query.examType as string | undefined)
    activeExamType.value = examType
    const qs = (await getQuestionsData({ code, difficulty, examType })) || []
    const loadedQuestions = qs.map((q: any) => ({
      ...q,
      id: q.id || `${q._paperId || 'paper'}-${q.number}`,
      order: q.number,
    }))
    if (loadedQuestions.length > 0) {
      const access = await checkMemberAccess({
        action: 'question-bank',
        examType,
        questionCount: loadedQuestions.length,
      })
      if (!access.allowed) {
        const remainingText = access.remaining === null ? '0' : String(access.remaining)
        ElMessage.warning(`当前试题库额度不足，剩余 ${remainingText} 题，请开通会员后继续`)
        router.replace('/question-bank')
        return
      }
    }
    questions.value = loadedQuestions
  } catch (e) {
    console.error('[Practice] 加载失败', e)
    questions.value = []
  } finally {
    loading.value = false
    questionEnteredAt = Date.now()
  }
}

// 记录访问过的题号，用于区分未看过和跳过的题目状态。
function markVisited(index: number): void {
  visitedIndexes.value = new Set([...visitedIndexes.value, index])
}

// 切题前把当前题停留时长累加，保证来回切换时每段时间都被统计。
function recordCurrentQuestionDuration(): void {
  const question = currentQuestion.value
  if (!question) return
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - questionEnteredAt) / 1000))
  questionDurations.value = {
    ...questionDurations.value,
    [question.id]: (questionDurations.value[question.id] || 0) + elapsedSeconds,
  }
  questionEnteredAt = Date.now()
}

// 题号导航和上下题共用该方法，切题时同步访问状态。
function goToQuestion(index: number): void {
  recordCurrentQuestionDuration()
  currentIndex.value = index
  markVisited(index)
  questionEnteredAt = Date.now()
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

// 返回题库前提醒用户当前作答不会自动交卷，避免误触离开答题现场。
async function handleBackToQuestionBank(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      '返回试题库将离开当前答题页面，当前作答不会自动提交，是否返回？',
      '提示',
      {
        type: 'warning',
        confirmButtonText: '返回试题库',
        cancelButtonText: '继续答题',
        customClass: 'app-confirm-box',
        closeOnClickModal: false,
        distinguishCancelAndClose: true,
      },
    )
    router.push('/question-bank')
  } catch {
    // 用户取消返回时保持当前答题状态。
  }
}

// 提前交卷前进行二次确认，避免学生误触导致答题直接结束。
async function confirmSubmitExam(): Promise<void> {
  if (submitting.value || !currentQuestion.value) return
  const confirmMessage = unansweredCount.value > 0
    ? '交卷后将生成本次答题结果，未作答题目会计为未答，是否提前交卷？'
    : '确认交卷？'
  try {
    await ElMessageBox.confirm(
      confirmMessage,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确认交卷',
        cancelButtonText: '继续答题',
        customClass: 'app-confirm-box',
        closeOnClickModal: false,
        distinguishCancelAndClose: true,
      },
    )
    await handleSubmit()
  } catch {
    // 用户取消交卷时保持当前答题状态。
  }
}

// 交卷后保留来源参数，结果页据此区分返回诊断测试或试题库。
async function handleSubmit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    recordCurrentQuestionDuration()
    const data = await submitExam({
      questions: questions.value,
      answers: { ...answers.value },
      questionDurations: { ...questionDurations.value },
      startedAt: new Date(startedAt).toISOString(),
      difficulty: route.query.difficulty as string,
      code: route.query.code as string,
      paperId: route.query.paperId as string,
      examType: activeExamType.value,
    })
    const memberCtx = await getMember()
    auth.setMemberContext(memberCtx)
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

function normalizeExamType(value: unknown): ExamType {
  return EXAM_TYPE_OPTIONS.some((item) => item.value === value)
    ? (value as ExamType)
    : DEFAULT_EXAM_TYPE
}

function normalizePointTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const items = raw
    .map((item: any) => ({
      code: typeof item?.code === 'string' ? item.code : '',
      role: typeof item?.role === 'string' ? item.role : '',
      label: item?.label || item?.name || item?.title || item?.code || '',
    }))
    .filter((item) => item.label)
    .sort((a, b) => b.code.length - a.code.length)

  const leafItems = items.filter((item) => ['leaf', 'child', 'point'].includes(item.role))
  if (leafItems.length) {
    return [...new Set(leafItems.map((item) => String(item.label)))]
  }

  const maxCodeLength = items[0]?.code.length || 0
  const deepestItems = maxCodeLength
    ? items.filter((item) => item.code.length === maxCodeLength)
    : items.slice(0, 1)

  return [...new Set(deepestItems.map((item) => String(item.label)))]
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
  --practice-topbar-height: 64px;

  min-height: 100vh;
  background: #fff;
  color: #1d1d1f;
}
.practice-topbar {
  position: sticky;
  top: 0;
  z-index: 80;
  height: var(--practice-topbar-height);
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--color-line);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.practice-topbar__inner {
  width: 100%;
  max-width: 1360px;
  height: 100%;
  margin: 0 auto;
  padding: 0 32px;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  align-items: center;
  gap: 24px;
}
.practice-back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px 0 8px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  transition:
    background var(--duration-base) ease,
    color var(--duration-base) ease;
}
.practice-back-link:hover {
  background: var(--color-hover);
  color: var(--color-black);
}
.practice-back-link__icon {
  width: 20px;
  height: 20px;
}
.practice-topbar__exam {
  min-width: 0;
  display: grid;
  gap: 8px;
}
.practice-topbar__exam-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.practice-topbar__title {
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  white-space: nowrap;
}
.practice-topbar__timer {
  flex-shrink: 0;
  color: #1d4ed8;
  font-size: var(--text-lg);
  font-weight: 800;
}
.practice-topbar__progress {
  height: 4px;
  background: #e2e8f0;
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.practice-topbar__progress span {
  display: block;
  height: 100%;
  background: #2563eb;
}
.practice-shell {
  width: 100%;
  max-width: 1360px;
  min-height: calc(100vh - var(--practice-topbar-height));
  margin: 0 auto;
  padding: 24px 32px 40px;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  align-items: start;
  gap: 24px;
  background: #fafafa;
}
.question-nav,
.exam-panel {
  background: #fff;
  border: 1px solid #e9e9e9;
  border-radius: 8px;
}
.question-nav {
  align-self: start;
  height: fit-content;
  max-height: calc(100vh - var(--practice-topbar-height) - 48px);
  overflow-y: auto;
  padding: 20px;
  position: sticky;
  top: calc(var(--practice-topbar-height) + 24px);
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
.question-nav__submit {
  width: 100%;
  height: 48px;
  margin-top: 24px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
  transition:
    background var(--duration-base) ease,
    border-color var(--duration-base) ease,
    color var(--duration-base) ease;
}
.question-nav__submit:hover:not(:disabled) {
  border-color: var(--color-ink);
  background: var(--color-hover);
}
.question-nav__submit:disabled {
  color: var(--color-ink-muted);
  cursor: not-allowed;
  opacity: 0.6;
}
.exam-panel {
  padding: 20px 24px 24px;
}
.exam-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.exam-actions {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #edf0f1;
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
  padding: 32px;
  text-align: center;
  color: #64748b;
}
</style>
