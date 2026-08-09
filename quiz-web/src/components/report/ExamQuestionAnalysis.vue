<template>
  <div class="question-analysis" :class="{ 'question-analysis--single': singleQuestionMode }">
    <aside v-if="!singleQuestionMode" class="question-nav" aria-label="题目导航">
      <span class="section-mark" aria-hidden="true"></span>
      <h2 class="question-nav__title">题目导航</h2>
      <div class="question-nav__groups">
        <section
          v-for="group in questionNavGroups"
          :key="group.key"
          class="question-nav__group"
          :aria-label="`${group.label}题目`"
        >
          <div
            v-if="showQuestionGroupLabels"
            class="question-nav__divider"
            :title="group.fullLabel"
          >
            <span>{{ group.label }}</span>
          </div>
          <div class="question-grid">
            <button
              v-for="item in group.items"
              :key="item.index"
              class="question-grid__item"
              :class="{
                'question-grid__item--active': currentIndex === item.index,
                'question-grid__item--correct': item.status === 'correct',
                'question-grid__item--wrong': item.status === 'wrong',
                'question-grid__item--skipped': item.status === 'skipped',
              }"
              type="button"
              @click="goToQuestion(item.index)"
            >
              {{ item.number }}
            </button>
          </div>
        </section>
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
      <QuestionCard
        :question="currentQuestion"
        :index="displayQuestionIndex"
        :selected-answer="currentQuestion.selectedAnswer || undefined"
        :show-answer="true"
        variant="exam"
        @select="noop"
      />

      <div class="answer-summary">
        <span v-if="showUserAnswer"
          >你的答案：{{ currentQuestion.selectedAnswer || '未作答' }}</span
        >
        <span>正确答案：{{ answerText }}</span>
      </div>

      <div class="analysis-stack">
        <section v-if="examFocusText" class="analysis-box">
          <h3>考察点</h3>
          <div class="analysis-box__body">
            <p><LatexText :text="examFocusText" /></p>
          </div>
        </section>

        <section v-if="hasSolution" class="analysis-box">
          <h3>题目解析</h3>
          <div class="analysis-box__body">
            <p v-if="correctSolution"><LatexText :text="correctSolution" /></p>
            <ol v-if="showStructuredSolution && solutionSteps.length" class="analysis-steps">
              <li v-for="(step, i) in solutionSteps" :key="i"><LatexText :text="step" /></li>
            </ol>
            <p v-if="showStructuredSolution && finalValue" class="analysis-final">
              <strong>最终结论：</strong><LatexText :text="finalValue" />
            </p>
            <ul v-if="showStructuredSolution && distractorReasons.length" class="reason-list">
              <li v-for="(reason, i) in distractorReasons" :key="i">
                <LatexText :text="reason" />
              </li>
            </ul>
          </div>
        </section>

        <section v-if="hasReviewGuide" class="analysis-box">
          <h3>复习引导</h3>
          <div class="analysis-box__body">
            <p v-if="reviewGuidance"><LatexText :text="reviewGuidance" /></p>
            <ul v-if="commonErrorCauses.length">
              <li v-for="(cause, i) in commonErrorCauses" :key="i"><LatexText :text="cause" /></li>
            </ul>
          </div>
        </section>

        <section v-if="!hasSolution && !hasReviewGuide && !examFocusText" class="analysis-box">
          <h3>题目解析</h3>
          <div class="analysis-box__body">
            <p>当前题目暂无解析内容。</p>
          </div>
        </section>
      </div>
    </section>

    <section v-else class="report-card"><p class="empty-text">暂无题目数据</p></section>
  </div>
</template>

<script setup lang="ts">
// 公共逐题解析组件：诊断测试和试题库报告共用同一套题目解析展示。
import { computed, ref, watch } from 'vue'
import QuestionCard from '@/components/QuestionCard.vue'
import LatexText from '@/components/LatexText.vue'
import type { ExamQuestion } from '@/api/exam'

type QuestionStatus = 'correct' | 'wrong' | 'skipped'
type ReportQuestion = ExamQuestion & { id: string }
interface QuestionNavItem {
  index: number
  number: number
  status: QuestionStatus
}

interface QuestionNavGroup {
  key: string
  identity: string
  label: string
  fullLabel: string
  items: QuestionNavItem[]
}

const MODULE_LABELS: Record<string, string> = {
  maths1: 'Mathematics 1',
  maths2: 'Mathematics 2',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  paper1: 'Paper 1',
  paper2: 'Paper 2',
}

const props = defineProps<{
  questions: ReportQuestion[]
  correctCount: number
  initialQuestionId?: string
  singleQuestionMode?: boolean
  showUserAnswer?: boolean
  groupBy?: 'module' | 'syllabus'
}>()
const emit = defineEmits<{
  questionChange: [index: number]
}>()

// 作答报告默认显示用户答案，后台逐题查看可关闭该项而继续复用完整解析布局。
const showUserAnswer = computed(() => props.showUserAnswer !== false)

const currentIndex = ref(0)
const currentQuestion = computed<ReportQuestion | undefined>(
  () => props.questions[currentIndex.value],
)
const displayQuestionIndex = computed(() => {
  if (!props.singleQuestionMode) return currentIndex.value
  const originalNumber = Number(currentQuestion.value?.number)
  return Number.isInteger(originalNumber) && originalNumber > 0 ? originalNumber - 1 : 0
})
const skippedCount = computed(() => props.questions.filter((q) => !q.selectedAnswer).length)
const wrongCount = computed(
  () => props.questions.filter((q) => q.selectedAnswer && !q.isCorrect).length,
)
const answerText = computed(() => currentQuestion.value?.answer?.join(', ') || '-')
// 题库解析按考纲学科分组，诊断和管理预览继续按考试模块分组。
const questionNavGroups = computed<QuestionNavGroup[]>(() => {
  const groups: QuestionNavGroup[] = []
  props.questions.forEach((question, index) => {
    const moduleCode = String(question.module_code || question.component_code || '')
      .trim()
      .toLowerCase()
    const subjectCode = String(question.subject_code || '').trim().toLowerCase()
    const subject = String(question.subject || '').trim()
    const usesSyllabusGrouping = props.groupBy === 'syllabus'
    const groupIdentity = usesSyllabusGrouping
      ? subjectCode || subject.toLowerCase() || 'syllabus'
      : moduleCode || subject.toLowerCase() || 'continuous'
    const existingGroup = groups.find((group) => group.identity === groupIdentity)
    const item: QuestionNavItem = {
      index,
      number: Number(question.number) || index + 1,
      status: question.selectedAnswer ? (question.isCorrect ? 'correct' : 'wrong') : 'skipped',
    }

    if (existingGroup) {
      existingGroup.items.push(item)
      return
    }

    const label = usesSyllabusGrouping
      ? subject || '考纲题目'
      : MODULE_LABELS[moduleCode] || subject || '试卷题目'
    groups.push({
      key: groupIdentity,
      identity: groupIdentity,
      label,
      fullLabel: subject || label,
      items: [item],
    })
  })
  return groups
})
// 题库解析即使只有一个考纲分组也展示名称，避免左侧只剩题号而看不到所属范围。
const showQuestionGroupLabels = computed(
  () => props.groupBy === 'syllabus' || questionNavGroups.value.length > 1,
)
const la = computed(() => currentQuestion.value?.learning_analysis)
const examFocusText = computed(() => la.value?.exam_focus || '')
const correctSolution = computed(() => la.value?.correct_solution || la.value?.solution || '')
const solutionSteps = computed(() => la.value?.solution_trace?.steps || [])
const finalValue = computed(() => la.value?.solution_trace?.final_value || '')

// 完整解析已覆盖推导步骤、结论和选项分析时不再重复展示结构化链路，缺失时才使用结构化内容兜底。
const showStructuredSolution = computed(() => !correctSolution.value)

// 解析文件使用选项与原因对象数组，展示前过滤不完整的异常项。
function normalizeDistractorReasons(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []

    const entry = item as Record<string, unknown>
    const option = typeof entry.option === 'string' ? entry.option.trim() : ''
    const reason = typeof entry.reason === 'string' ? entry.reason.trim() : ''
    if (!option || !reason) return []
    return [`${option}: ${reason}`]
  })
}

const distractorReasons = computed(() =>
  normalizeDistractorReasons(la.value?.solution_trace?.distractors),
)
const reviewGuidance = computed(() => la.value?.review_guidance || '')
const commonErrorCauses = computed(() => la.value?.common_error_causes || [])
const hasSolution = computed(() =>
  Boolean(
    correctSolution.value ||
    solutionSteps.value.length ||
    finalValue.value ||
    distractorReasons.value.length,
  ),
)
const hasReviewGuide = computed(() =>
  Boolean(reviewGuidance.value || commonErrorCauses.value.length),
)

// 从错题本跳转进来时，优先定位到 query 指定的题目。
watch(
  () => [props.questions, props.initialQuestionId] as const,
  ([questions, questionId]) => {
    if (!questions.length) {
      currentIndex.value = 0
      return
    }
    if (questionId) {
      const targetIndex = questions.findIndex(
        (q) => q.id === questionId || q.questionId === questionId,
      )
      if (targetIndex >= 0) {
        currentIndex.value = targetIndex
        return
      }
    }
    if (currentIndex.value >= questions.length) currentIndex.value = questions.length - 1
  },
  { immediate: true },
)

// 当前题号同步给管理侧吸顶操作栏，报告页面无需监听也不受影响。
watch(currentIndex, (index) => emit('questionChange', index), { immediate: true })

// 左侧题号导航只切换当前题，不重新请求报告数据。
function goToQuestion(index: number): void {
  currentIndex.value = index
}

// 解析页只读展示题目，传给 QuestionCard 的 select 事件保持空实现。
function noop(): void {}
</script>

<style scoped lang="scss">
.question-analysis {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  max-width: 100%;
  min-width: 0;
}

.question-analysis--single {
  grid-template-columns: minmax(0, 1fr);
}

.question-nav,
.report-card {
  min-width: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 24px;
}

.report-card {
  max-width: 100%;
  overflow: hidden;
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

.question-nav__groups {
  display: grid;
  gap: 18px;
}

.question-nav__group {
  min-width: 0;
}

.question-nav__divider {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin-bottom: 10px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.question-nav__divider::before,
.question-nav__divider::after {
  min-width: 20px;
  height: 1px;
  flex: 1;
  background: #cbd5e1;
  content: '';
}

.question-nav__divider span {
  min-width: 0;
  max-width: calc(100% - 60px);
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  white-space: nowrap;
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
  gap: 20px;
}

.analysis-box {
  overflow: hidden;
  border: 1px solid #cfe3ff;
  border-radius: 8px;
  background: #fff;
  overflow-wrap: anywhere;
}

.analysis-box h3 {
  margin: 0;
  padding: 15px 20px;
  border-bottom: 1px solid #cfe3ff;
  background: #f4f9ff;
  color: #123b7b;
  font-size: 16px;
  font-weight: 700;
}

.analysis-box__body {
  padding: 20px;
  color: #1e3a5f;
  line-height: 1.75;
}

.analysis-box__body > :first-child {
  margin-top: 0;
}

.analysis-box__body > :last-child {
  margin-bottom: 0;
}

.analysis-box__body p {
  margin: 0 0 18px;
}

.report-card :deep(.question-card) {
  min-width: 0;
}

.report-card :deep(.question-card__stem),
.report-card :deep(.opt-card__text) {
  overflow-wrap: anywhere;
}

.report-card :deep(.question-card__media-item),
.report-card :deep(.question-card__svg) {
  min-width: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.report-card :deep(.katex-display) {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.report-card :deep(svg) {
  max-width: 100%;
}

.analysis-steps,
.reason-list {
  margin: 0 0 18px;
  padding-left: 22px;
}

.analysis-steps li + li,
.reason-list li + li {
  margin-top: 4px;
}

.analysis-final strong {
  color: #123b7b;
}

.empty-text {
  color: #64748b;
  text-align: center;
}
</style>
