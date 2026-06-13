<template>
  <div class="practice-report">
    <main class="report-main">
      <div class="report-shell">
        <router-link to="/question-bank" class="back-link">
          <span class="back-link__icon" aria-hidden="true">&larr;</span>
          返回练习册
        </router-link>

        <h1 class="report-title">练习结果报告</h1>

        <div class="report-layout">
          <aside class="question-nav" aria-label="题目导航">
            <span class="section-mark" aria-hidden="true"></span>
            <h2 class="question-nav__title">题目导航</h2>

            <div class="question-grid">
              <button
                v-for="item in questionNav"
                :key="item.number"
                class="question-grid__item"
                :class="{
                  'question-grid__item--active': currentIndex === item.number - 1,
                  'question-grid__item--correct': item.status === 'correct',
                  'question-grid__item--wrong': item.status === 'wrong',
                  'question-grid__item--skipped': item.status === 'skipped',
                }"
                type="button"
                @click="goToQuestion(item.number - 1)"
              >
                {{ item.number }}
              </button>
            </div>

            <div class="question-legend">
              <span class="question-legend__item">
                <i class="question-legend__dot question-legend__dot--correct"></i>
                已答 {{ answeredCount }}
              </span>
              <span class="question-legend__item">
                <i class="question-legend__dot question-legend__dot--wrong"></i>
                跳过 {{ skippedCount }}
              </span>
              <span class="question-legend__item">
                <i class="question-legend__dot question-legend__dot--empty"></i>
                未答 {{ totalCount - answeredCount }}
              </span>
            </div>
          </aside>

          <section class="report-card" aria-label="题目详情" v-if="currentQuestion">
            <span class="section-mark" aria-hidden="true"></span>

            <header class="question-header">
              <div class="question-header__row">
                <h2>{{ currentQuestion.subject || '' }}</h2>
                <span>第{{ currentIndex + 1 }}/{{ totalCount }}题</span>
              </div>
              <div class="question-progress" aria-hidden="true">
                <span :style="{ width: ((currentIndex + 1) / totalCount) * 100 + '%' }"></span>
              </div>
              <div class="question-tags">
                <span>第{{ currentQuestion.number }}题</span>
                <span v-if="currentQuestion.difficulty">{{ currentQuestion.difficulty.level }}</span>
              </div>
            </header>

            <p class="question-stem">{{ currentQuestion.title }}</p>

            <!-- 加载中 -->
            <div v-if="loading" class="analysis-box"><p>加载中...</p></div>

            <template v-else>
              <div class="option-list">
                <article
                  v-for="option in options"
                  :key="option.label"
                  class="answer-option"
                  :class="{
                    'answer-option--correct': option.isCorrect,
                    'answer-option--selected': option.isSelected,
                  }"
                >
                  <span class="answer-option__badge">{{ option.label }}</span>
                  <span class="answer-option__text">{{ option.text }}</span>
                  <span v-if="option.isCorrect" class="answer-option__check" aria-label="正确">
                    &#10003;
                  </span>
                </article>
              </div>

              <div class="analysis-stack">
                <!-- 考察点 -->
                <section class="analysis-box" v-if="examFocusList.length">
                  <h3>考察点</h3>
                  <div v-for="focus in examFocusList" :key="focus.title" class="analysis-focus">
                    <strong>{{ focus.title }}</strong>
                    <p v-if="focus.description">{{ focus.description }}</p>
                  </div>
                </section>

                <!-- 题目解析 -->
                <section class="analysis-box" v-if="hasSolution">
                  <h3>题目解析</h3>
                  <p v-if="solutionSummary">{{ solutionSummary }}</p>
                  <ol v-if="analysisSteps.length" class="analysis-steps">
                    <li v-for="(step, i) in analysisSteps" :key="i">{{ step }}</li>
                  </ol>
                  <p v-if="finalAnswer" class="analysis-final">最终答案：{{ finalAnswer }}</p>
                  <ul v-if="wrongReasons.length" class="reason-list">
                    <li v-for="(reason, i) in wrongReasons" :key="i">{{ reason }}</li>
                  </ul>
                </section>

                <!-- 复习引导 -->
                <section class="analysis-box" v-if="hasReviewGuide">
                  <h3>复习引导</h3>
                  <p v-if="reviewSummary">{{ reviewSummary }}</p>
                  <ul v-if="recommendedTopics.length">
                    <li v-for="(tpc, i) in recommendedTopics" :key="i">{{ tpc }}</li>
                  </ul>
                  <ul v-if="practiceSuggestions.length">
                    <li v-for="(ps, i) in practiceSuggestions" :key="i">{{ ps }}</li>
                  </ul>
                  <ul v-if="commonMistakes.length">
                    <li v-for="(cm, i) in commonMistakes" :key="i">{{ cm }}</li>
                  </ul>
                </section>
              </div>
            </template>
          </section>

          <section v-else class="report-card">
            <span class="section-mark" aria-hidden="true"></span>
            <p class="question-stem">暂无题目数据</p>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 答题结果详情 — 从 API 加载真实考试数据
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getExamResultData, type ExamResult, type ExamQuestion } from '@/api/exam'

type QuestionStatus = 'correct' | 'wrong' | 'skipped' | 'unanswered'

interface QuestionNavItem {
  number: number
  status: QuestionStatus
}

interface AnswerOption {
  label: string
  text: string
  isCorrect?: boolean
  isSelected?: boolean
}

interface QuestionItem {
  number: number
  title: string
  options: { label: string; text: string }[]
  answer: string[]
  subject?: string
  difficulty?: { level: string; score: number }
  knowledge_points?: { name: string }[]
  learning_analysis?: {
    exam_focus?: { title: string; description: string; source_knowledge_points?: string[] }[]
    solution?: {
      status?: string
      summary?: string
      steps?: string[]
      final_answer?: string
      distractor_analysis?: string[]
    }
    review_guidance?: {
      status?: string
      summary?: string
      recommended_topics?: string[]
      practice_suggestions?: string[]
      common_mistakes?: string[]
    }
  }
  skills?: string[]
  selectedAnswer?: string | null
  isCorrect?: boolean
}

const route = useRoute()
const examId = computed(() => route.params.id as string)

const loading = ref(true)
const totalCount = ref(0)
const answeredCount = ref(0)
const skippedCount = ref(0)
const questions = ref<QuestionItem[]>([])
const currentIndex = ref(0)


const currentQuestion = computed<QuestionItem | undefined>(
  () => questions.value[currentIndex.value]
)

const questionNav = computed<QuestionNavItem[]>(() =>
  questions.value.map((q, i) => {
    let status: QuestionStatus
    if (q.selectedAnswer) {
      status = q.isCorrect ? 'correct' : 'wrong'
    } else {
      status = 'skipped'
    }
    return { number: i + 1, status }
  })
)

const options = computed<AnswerOption[]>(() => {
  const q = currentQuestion.value
  if (!q) return []
  const correctSet = new Set(q.answer || [])
  return (q.options || []).map((o) => ({
    label: o.label,
    text: o.text,
    isCorrect: correctSet.has(o.label),
    isSelected: q.selectedAnswer === o.label,
  }))
})


// ---- learning_analysis \解\析 ----

const la = computed(() => currentQuestion.value?.learning_analysis)

// \考\察\点
const examFocusList = computed(() => la.value?.exam_focus || [])

// \题\目\解\析
const hasSolution = computed(() => {
  const s = la.value?.solution
  return !!(s && (s.summary || s.steps?.length || s.final_answer || s.distractor_analysis?.length))
})
const solutionSummary = computed(() => la.value?.solution?.summary || '')
const analysisSteps = computed(() => la.value?.solution?.steps || [])
const finalAnswer = computed(() => la.value?.solution?.final_answer || '')
const wrongReasons = computed(() => la.value?.solution?.distractor_analysis || [])

// \复\习\引\导
const hasReviewGuide = computed(() => {
  const rg = la.value?.review_guidance
  return !!(rg && (rg.summary || rg.recommended_topics?.length || rg.practice_suggestions?.length || rg.common_mistakes?.length))
})
const reviewSummary = computed(() => la.value?.review_guidance?.summary || '')
const recommendedTopics = computed(() => la.value?.review_guidance?.recommended_topics || [])
const practiceSuggestions = computed(() => la.value?.review_guidance?.practice_suggestions || [])
const commonMistakes = computed(() => la.value?.review_guidance?.common_mistakes || [])

function goToQuestion(index: number): void {
  currentIndex.value = index
}

onMounted(async () => {
  try {
    const data = await getExamResultData(examId.value)
    totalCount.value = data.examRecord.totalQuestions
    questions.value = (data.questions || []).map((q, i) => ({
      ...q,
      number: q.number ?? i + 1,
    }))
    answeredCount.value = questions.value.filter((q) => q.selectedAnswer).length
    skippedCount.value = totalCount.value - answeredCount.value
  } catch {
    // \加\载\失\败
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.practice-report {
  --color-primary: #4f46e5;
  --color-accent: #2f6f9f;
  --color-accent-dark: #223b3c;
  --color-success: #10b981;
  --color-success-bg: #ecfdf5;
  --color-bg: #f7f6f4;
  --color-surface: #ffffff;
  --color-surface-muted: #f3f6f6;
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;
  --color-text: #273437;
  --color-text-secondary: #5f6d70;
  --color-text-muted: #a0aaad;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --radius-md: 0.5rem;
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei',
    Roboto, sans-serif;
}

.report-nav {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 64px;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--color-border-light);
}

.report-nav__inner {
  max-width: 1160px;
  height: 100%;
  margin: 0 auto;
  padding: 0 var(--space-8);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.report-nav__brand {
  color: var(--color-text);
  font-size: 1.125rem;
  font-weight: 800;
}

.report-nav__links {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.report-nav__link {
  color: var(--color-text);
  font-size: 0.875rem;
  font-weight: 700;
  transition: color 0.2s ease;

  &:hover,
  &--active {
    color: var(--color-accent);
  }
}

.report-nav__avatar {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-text);
  color: var(--color-surface);
  font-size: 0.8125rem;
  font-weight: 800;
}

.report-main {
  padding: 34px var(--space-8) 56px;
}

.report-shell {
  width: min(1160px, 100%);
  min-height: calc(100vh - 112px);
  margin: 0 auto;
  padding: var(--space-6) 116px 64px;
  background: var(--color-surface);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: 0.9375rem;
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-text);
  }
}

.back-link__icon {
  font-size: 1.25rem;
  line-height: 1;
}

.report-title {
  margin: var(--space-4) 0 var(--space-5);
  color: var(--color-text);
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.25;
}

.report-layout {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  gap: var(--space-6);
  align-items: start;
}

.question-nav,
.report-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.question-nav {
  min-height: 400px;
  padding: var(--space-5);
  position: sticky;
  top: 88px;
}

.section-mark {
  display: block;
  width: 42px;
  height: 2px;
  margin-bottom: var(--space-5);
  background: var(--color-accent);
}

.question-nav__title {
  margin: 0 0 var(--space-4);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 700;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(5, 32px);
  gap: var(--space-2);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-light);
}

.question-grid__item {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-text-secondary);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: var(--color-border);
  }

  &--active {
    background: var(--color-accent-dark);
    color: var(--color-surface);
  }

  &--correct {
    background: var(--color-success-bg);
    color: var(--color-success);
    box-shadow: inset 0 0 0 1px var(--color-success);
  }

  &--wrong {
    background: #fef2f2;
    color: #ef4444;
    box-shadow: inset 0 0 0 1px #ef4444;
  }

  &--skipped {
    background: var(--color-surface);
    color: var(--color-text-muted);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  &--answered {
    background: var(--color-surface);
    color: var(--color-accent);
    box-shadow: inset 0 0 0 1px var(--color-accent);
  }
}

.question-legend {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-4);
}

.question-legend__item {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
}

.question-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-border);

  &--correct {
    background: #10b981;
  }

  &--wrong {
    background: #ef4444;
  }

  &--skipped {
    background: #cfd7d8;
  }

  &--empty {
    background: var(--color-surface-muted);
    border: 1px solid var(--color-border);
  }
}

.report-card {
  padding: 34px 34px 52px;
}

.question-header {
  margin-bottom: var(--space-6);
}

.question-header__row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  margin-bottom: var(--space-2);

  h2 {
    margin: 0;
    color: var(--color-text);
    font-size: 1rem;
    font-weight: 800;
  }

  span {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    font-weight: 700;
  }
}

.question-progress {
  width: 100%;
  height: 4px;
  margin-bottom: var(--space-5);
  background: var(--color-border-light);
  border-radius: 999px;
  overflow: hidden;

  span {
    display: block;
    width: 64px;
    height: 100%;
    background: var(--color-accent-dark);
    border-radius: inherit;
  }
}

.question-tags {
  display: flex;
  gap: var(--space-3);

  span {
    padding: 5px 14px;
    border-radius: 999px;
    background: var(--color-surface-muted);
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 700;
  }
}

.question-stem {
  margin: 0 0 var(--space-8);
  color: var(--color-text);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.1875rem;
  line-height: 1.5;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.answer-option {
  position: relative;
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.answer-option--correct {
  border-color: var(--color-success);
  background: var(--color-success-bg);
}

.answer-option__badge {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  font-size: 0.875rem;
  font-weight: 800;
}

.answer-option--selected .answer-option__badge {
  background: var(--color-accent);
  color: var(--color-surface);
}

.answer-option__text {
  color: var(--color-text-secondary);
  font-size: 1rem;
  font-weight: 600;
}

.answer-option__check {
  position: absolute;
  top: -11px;
  right: -11px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-success);
  color: var(--color-surface);
  font-size: 0.875rem;
  font-weight: 900;
}

.analysis-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-8);
  padding-top: var(--space-6);
  border-top: 1px solid var(--color-border-light);
}

.analysis-box {
  padding: var(--space-4);
  border: 2px solid var(--color-accent);
  border-radius: var(--radius-md);

  h3 {
    margin: 0 0 var(--space-3);
    color: var(--color-accent);
    font-size: 1rem;
    font-weight: 800;
  }

  p {
    margin: 0 0 var(--space-2);
    color: var(--color-text);
    font-size: 0.9375rem;
    line-height: 1.55;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.analysis-steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: var(--space-2) 0 var(--space-4);
  padding-left: 1.35rem;

  li {
    color: var(--color-text);
    font-size: 0.9375rem;
    line-height: 1.45;

    &::marker {
      color: var(--color-primary);
      font-weight: 800;
    }
  }
}

.reason-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: 0;
  padding-left: 1.2rem;

  li {
    color: var(--color-text);
    font-size: 0.9375rem;
    line-height: 1.45;

    &::marker {
      color: var(--color-primary);
    }
  }
}

@media (max-width: 1024px) {
  .report-shell {
    padding: var(--space-6);
  }

  .report-layout {
    grid-template-columns: 200px minmax(0, 1fr);
  }

  .question-grid {
    grid-template-columns: repeat(5, 28px);
  }

  .question-grid__item {
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 768px) {
  .report-nav__inner {
    padding: 0 var(--space-4);
  }

  .report-nav__links {
    gap: var(--space-3);
  }

  .report-nav__link {
    display: none;
  }

  .report-main {
    padding: var(--space-4);
  }

  .report-shell {
    min-height: auto;
    padding: var(--space-5) var(--space-4);
  }

  .report-layout {
    grid-template-columns: 1fr;
  }

  .question-nav {
    position: static;
    min-height: auto;
  }

  .question-grid {
    grid-template-columns: repeat(5, 32px);
  }

  .report-card {
    padding: var(--space-5) var(--space-4);
  }

  .question-stem {
    font-size: 1.0625rem;
  }
}
</style>
