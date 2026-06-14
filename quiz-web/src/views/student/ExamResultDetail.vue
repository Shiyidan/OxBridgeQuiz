<template>
  <div class="practice-report">
    <main class="report-main">
      <div class="report-shell">
        <router-link :to="backTarget" class="back-link">← {{ backLabel }}</router-link>
        <h1 class="report-title">{{ reportTitle }}</h1>

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
              <span
                ><i class="question-legend__dot question-legend__dot--correct"></i>正确
                {{ correctCount }}</span
              >
              <span
                ><i class="question-legend__dot question-legend__dot--wrong"></i>错误
                {{ wrongCount }}</span
              >
              <span
                ><i class="question-legend__dot question-legend__dot--empty"></i>未答
                {{ skippedCount }}</span
              >
            </div>
          </aside>

          <section v-if="currentQuestion" class="report-card" aria-label="题目详情">
            <span class="section-mark" aria-hidden="true"></span>
            <header class="question-header">
              <div class="question-header__row">
                <h2>{{ examTitle }}</h2>
                <span>第 {{ currentIndex + 1 }}/{{ totalCount }} 题</span>
              </div>
              <div class="question-progress" aria-hidden="true">
                <span :style="{ width: progressPercent }"></span>
              </div>
              <div class="question-tags">
                <span>第 {{ currentIndex + 1 }} 题</span>
                <span v-if="currentQuestion.difficulty">{{
                  currentQuestion.difficulty.level
                }}</span>
                <span :class="currentQuestion.isCorrect ? 'tag-success' : 'tag-error'">
                  {{
                    currentQuestion.isCorrect
                      ? '正确'
                      : currentQuestion.selectedAnswer
                        ? '错误'
                        : '未答'
                  }}
                </span>
              </div>
            </header>

            <div v-if="loading" class="analysis-box"><p>加载中...</p></div>
            <template v-else>
              <QuestionCard
                :question="currentQuestion"
                :index="currentIndex"
                :selected-answer="currentQuestion.selectedAnswer || undefined"
                :show-answer="true"
                @select="noop"
              />

              <div class="answer-summary">
                <span>你的答案：{{ currentQuestion.selectedAnswer || '未作答' }}</span>
                <span>正确答案：{{ correctAnswerText }}</span>
              </div>

              <div class="analysis-stack">
                <section v-if="examFocusList.length" class="analysis-box">
                  <h3>考察点</h3>
                  <div v-for="focus in examFocusList" :key="focus.title" class="analysis-focus">
                    <strong>{{ focus.title }}</strong>
                    <p v-if="focus.description"><LatexText :text="focus.description" /></p>
                  </div>
                </section>

                <section v-if="hasSolution" class="analysis-box">
                  <h3>题目解析</h3>
                  <p v-if="solutionSummary"><LatexText :text="solutionSummary" /></p>
                  <ol v-if="analysisSteps.length" class="analysis-steps">
                    <li v-for="(step, i) in analysisSteps" :key="i"><LatexText :text="step" /></li>
                  </ol>
                  <p v-if="finalAnswer" class="analysis-final">
                    <strong>最终答案：</strong><LatexText :text="finalAnswer" />
                  </p>
                  <ul v-if="wrongReasons.length" class="reason-list">
                    <li v-for="(reason, i) in wrongReasons" :key="i">
                      <LatexText :text="reason" />
                    </li>
                  </ul>
                </section>

                <section v-if="hasReviewGuide" class="analysis-box">
                  <h3>复习引导</h3>
                  <p v-if="reviewSummary"><LatexText :text="reviewSummary" /></p>
                  <ul v-if="recommendedTopics.length">
                    <li v-for="(topic, i) in recommendedTopics" :key="i">
                      <LatexText :text="topic" />
                    </li>
                  </ul>
                  <ul v-if="practiceSuggestions.length">
                    <li v-for="(suggestion, i) in practiceSuggestions" :key="i">
                      <LatexText :text="suggestion" />
                    </li>
                  </ul>
                  <ul v-if="commonMistakes.length">
                    <li v-for="(mistake, i) in commonMistakes" :key="i">
                      <LatexText :text="mistake" />
                    </li>
                  </ul>
                </section>

                <section
                  v-if="!hasSolution && !hasReviewGuide && !examFocusList.length"
                  class="analysis-box"
                >
                  <h3>题目解析</h3>
                  <p>当前题目暂无解析内容。</p>
                </section>
              </div>
            </template>
          </section>

          <section v-else class="report-card"><p class="empty-text">暂无题目数据</p></section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 答题结果详情：按来源区分真题诊断和题库练习。
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import QuestionCard from '@/components/QuestionCard.vue'
import LatexText from '@/components/LatexText.vue'
import { getExamResultData, type ExamQuestion } from '@/api/exam'

type QuestionStatus = 'correct' | 'wrong' | 'skipped'
interface QuestionNavItem {
  number: number
  status: QuestionStatus
}
interface PaperMeta {
  id: string
  title: string
  paperType: string
}
type ReportQuestion = ExamQuestion & { id: string }

const route = useRoute()
const examId = computed(() => route.params.id as string)
const loading = ref(true)
const totalCount = ref(0)
const correctCount = ref(0)
const questions = ref<ReportQuestion[]>([])
const currentIndex = ref(0)
const paper = ref<PaperMeta | null>(null)

const isPastPaper = computed(() => paper.value?.paperType === 'past')
const backTarget = computed(() => (isPastPaper.value ? '/assessment' : '/question-bank'))
const backLabel = computed(() => (isPastPaper.value ? '返回诊断测试' : '返回试题库'))
const reportTitle = computed(() => (isPastPaper.value ? '真题解析报告' : '练习结果报告'))
const examTitle = computed(() => paper.value?.title || currentQuestion.value?.subject || '题库练习')
const currentQuestion = computed<ReportQuestion | undefined>(
  () => questions.value[currentIndex.value],
)
const skippedCount = computed(() => questions.value.filter((q) => !q.selectedAnswer).length)
const wrongCount = computed(
  () => questions.value.filter((q) => q.selectedAnswer && !q.isCorrect).length,
)
const progressPercent = computed(() =>
  totalCount.value ? `${((currentIndex.value + 1) / totalCount.value) * 100}%` : '0%',
)
const correctAnswerText = computed(() => currentQuestion.value?.answer?.join(', ') || '-')
const questionNav = computed<QuestionNavItem[]>(() =>
  questions.value.map((q, i) => ({
    number: i + 1,
    status: q.selectedAnswer ? (q.isCorrect ? 'correct' : 'wrong') : 'skipped',
  })),
)
const la = computed(() => currentQuestion.value?.learning_analysis)
const examFocusList = computed(() => la.value?.exam_focus || [])
const solutionSummary = computed(() => la.value?.solution?.summary || '')
const analysisSteps = computed(() => la.value?.solution?.steps || [])
const finalAnswer = computed(() => la.value?.solution?.final_answer || '')
const wrongReasons = computed(() => la.value?.solution?.distractor_analysis || [])
const reviewSummary = computed(() => la.value?.review_guidance?.summary || '')
const recommendedTopics = computed(() => la.value?.review_guidance?.recommended_topics || [])
const practiceSuggestions = computed(() => la.value?.review_guidance?.practice_suggestions || [])
const commonMistakes = computed(() => la.value?.review_guidance?.common_mistakes || [])
const hasSolution = computed(() =>
  Boolean(
    solutionSummary.value ||
    analysisSteps.value.length ||
    finalAnswer.value ||
    wrongReasons.value.length,
  ),
)
const hasReviewGuide = computed(() =>
  Boolean(
    reviewSummary.value ||
    recommendedTopics.value.length ||
    practiceSuggestions.value.length ||
    commonMistakes.value.length,
  ),
)

// 左侧题号导航只切换当前题，不重新请求报告数据。
function goToQuestion(index: number): void {
  currentIndex.value = index
}

// 解析页只读展示题目，传给 QuestionCard 的 select 事件保持空实现。
function noop(): void {}

// 报告详情统一加载考试记录，再根据 paperType 区分真题诊断和题库练习。
onMounted(async () => {
  try {
    const data = await getExamResultData(examId.value)
    totalCount.value = data.examRecord.totalQuestions
    correctCount.value = data.examRecord.correctCount
    paper.value = data.examRecord.paper || null
    questions.value = (data.questions || []).map((q, i) => ({
      ...q,
      id: q.id || q.questionId || `result-q-${i + 1}`,
      number: i + 1,
      images: q.images || [],
    }))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.practice-report {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
}
.report-main {
  max-width: 1180px;
  margin: 0 auto;
  padding: 40px 24px 72px;
}
.back-link {
  color: #64748b;
  text-decoration: none;
  font-weight: 700;
}
.report-title {
  margin: 22px 0 28px;
  font-size: 30px;
  letter-spacing: 0;
}
.report-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}
.question-nav,
.report-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
}
.question-nav {
  position: sticky;
  top: 84px;
}
.section-mark {
  display: block;
  width: 48px;
  height: 2px;
  margin-bottom: 16px;
  background: #3b7192;
}
.question-nav__title {
  margin: 0 0 16px;
  font-size: 18px;
}
.question-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.question-grid__item {
  height: 38px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
.question-grid__item--active {
  border-color: #2563eb;
  color: #2563eb;
  font-weight: 800;
}
.question-grid__item--correct {
  background: #ecfdf5;
}
.question-grid__item--wrong {
  background: #fef2f2;
}
.question-grid__item--skipped {
  background: #f8fafc;
  color: #94a3b8;
}
.question-legend {
  display: grid;
  gap: 8px;
  margin-top: 18px;
  color: #64748b;
  font-size: 14px;
}
.question-legend__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  background: #cbd5e1;
}
.question-legend__dot--correct {
  background: #22c55e;
}
.question-legend__dot--wrong {
  background: #ef4444;
}
.question-header__row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.question-header h2 {
  margin: 0;
  font-size: 22px;
}
.question-progress {
  height: 4px;
  margin: 16px 0;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}
.question-progress span {
  display: block;
  height: 100%;
  background: #2563eb;
}
.question-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  color: #64748b;
}
.tag-success {
  color: #047857;
}
.tag-error {
  color: #dc2626;
}
.answer-summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: 20px 0;
  padding: 14px;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
}
.analysis-stack {
  display: grid;
  gap: 16px;
}
.analysis-box {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 18px;
  background: #fff;
}
.analysis-box h3 {
  margin: 0 0 12px;
}
.analysis-steps,
.reason-list {
  padding-left: 22px;
}
.empty-text {
  color: #64748b;
  text-align: center;
}
@media (max-width: 900px) {
  .report-layout {
    grid-template-columns: 1fr;
  }
  .question-nav {
    position: static;
  }
}
</style>
