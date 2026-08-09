<!-- 试题库和诊断测试共用的在线答题页 -->
<template>
  <div class="practice-page">
    <ExamVue
      :key="examTimerKey"
      ref="examNavRef"
      :exam-type="activeExamType"
      :mode="examMode"
      :countdown-duration-seconds="countdownDurationSeconds"
      :expires-at="examExpiresAt"
      :initial-elapsed-seconds="initialElapsedSeconds"
      :current-index="currentIndex"
      :total-count="totalCount"
      :back-label-override="practiceBackLabel"
      @back="handleBackToQuestionBank"
      @answering-paused="handleAnsweringPaused"
      @answering-resumed="handleAnsweringResumed"
      @time-expired="handleTimeExpired"
    />
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
          class="question-nav__submit button_cancel"
          :disabled="submitting || confirmingSubmit || !currentQuestion"
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
              class="exam-action button_cancel"
              :disabled="currentIndex === 0"
              @click="handlePrev"
            >
              上一题
            </button>
            <div class="exam-actions__right">
              <button
                v-if="!isLastQuestion"
                type="button"
                class="exam-action button_cancel"
                @click="handleNext"
              >
                下一题
              </button>
            </div>
          </footer>
        </template>
      </section>
    </main>

    <DiagnosticAnalysisDialog
      :model-value="analysisDialogVisible"
      :exam-id="submittedExamRecordId"
      @view-report="handleViewDiagnosticReport"
      @return-assessment="handleReturnToAssessment"
    />
    <AppConfirmDialog
      v-model="practiceResultDialogVisible"
      title="练习已交卷"
      :message="practiceResultMessage"
      confirm-text="查看解析"
      :cancel-text="practiceReturnLabel"
      tone="default"
      :show-close="false"
      @confirm="handleViewPracticeAnalysis"
      @cancel="handleReturnAfterPractice"
    />
  </div>
</template>

<script setup lang="ts">
// 在线答题页：试题库按考点取题，诊断测试按 paperId 取整套真题。
import { ref, computed, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import QuestionCard from '@/components/QuestionCard.vue'
import ExamVue from '@/components/ExamVue.vue'
import DiagnosticAnalysisDialog from '@/components/DiagnosticAnalysisDialog.vue'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import { getQuestionsData } from '@/api/questionBank'
import { getPaperDetailData } from '@/api/papers'
import {
  getExamSession,
  saveExamProgress,
  startExam,
  submitExam,
  type AnswerState,
  type ExamProgress,
  type ExamResponseInput,
} from '@/api/exam'
import { checkMemberAccess, getMember } from '@/api/member'
import { useAuthStore } from '@/stores/auth'
import {
  DEFAULT_EXAM_TYPE,
  EXAM_TYPE_OPTIONS,
  getExamUnavailableMessage,
  isExamTypeAvailable,
  type ExamType,
} from '@/constants/examTypes'
import type { RenderableQuestion } from '@/types'
import { hasApiErrorCode } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const examNavRef = ref<InstanceType<typeof ExamVue> | null>(null)
const questions = shallowRef<RenderableQuestion[]>([])
const activeExamType = ref<ExamType>(DEFAULT_EXAM_TYPE)
const loading = ref(true)
const currentIndex = ref(0)
const countdownDurationSeconds = ref(0)
const examExpiresAt = ref<string | null>(null)
const initialElapsedSeconds = ref(0)
const examTimerKey = ref(0)
const visitedIndexes = ref<Set<number>>(new Set([0]))
const answers = ref<Record<string, string>>({})
const questionDurations = ref<Record<string, number>>({})
const submitting = ref(false)
const confirmingSubmit = ref(false)
const examSubmitted = ref(false)
const activeExamRecordId = ref('')
const analysisDialogVisible = ref(false)
const practiceResultDialogVisible = ref(false)
const submittedExamRecordId = ref('')
const submissionKey = ref(
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `submit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
)
let questionEnteredAt = Date.now()
let isQuestionTimingPaused = false
let timeExpiredHandling = false
let progressSaveInterval: ReturnType<typeof setInterval> | null = null
let selectionSaveTimer: ReturnType<typeof setTimeout> | null = null
let dirtyVersion = 0
const dirtyQuestionVersions = new Map<string, number>()
const persistedQuestionDurations = new Map<string, number>()
let progressSavePromise: Promise<void> | null = null

// 根据入口区分模式：试题库正计时，诊断测试 / 仿真考试倒计时。
const examMode = computed(() => {
  if (route.query.paperId) return 'assessment'
  // 后续仿真考试入口可在此扩展
  return 'question-bank'
})

// 题库答卷来源决定中途返回、交卷结果和逐题解析的稳定回跳目标。
const cameFromPracticeNotebook = computed(() => route.query.from === 'practice-notebook')
const cameFromPracticeRecords = computed(() => route.query.from === 'practice-records')
const practiceReturnPath = computed(() =>
  cameFromPracticeNotebook.value
    ? '/practice-notebook'
    : cameFromPracticeRecords.value
      ? '/practice-records'
      : '/question-bank',
)
const practiceReturnLabel = computed(() =>
  cameFromPracticeNotebook.value
    ? '返回练习本'
    : cameFromPracticeRecords.value
      ? '返回练习记录'
      : '返回试题库首页',
)
const practiceBackLabel = computed(() =>
  cameFromPracticeNotebook.value
    ? '返回练习本'
    : cameFromPracticeRecords.value
      ? '返回练习记录'
      : '',
)
const practiceResultMessage = computed(
  () => `本次练习已成功提交。你可以${practiceReturnLabel.value}，或查看本次答题解析。`,
)
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
const topicTitle = computed(() => currentQuestion.value?.subject || '')
const currentKnowledgeTags = computed(() => {
  const question = currentQuestion.value as
    | (RenderableQuestion & { knowledgePoints?: unknown })
    | undefined
  if (!question) return []
  const tags = normalizePointTags(question.knowledge_points || question.knowledgePoints)
  if (tags.length) return tags
  return topicTitle.value ? [topicTitle.value] : ['综合考点']
})

// 根据路由来源切换数据源：paperId 为真题套卷，否则按考点和难度从题库取题。
async function loadQuestions(): Promise<void> {
  loading.value = true
  try {
    const resumeExamId = String(route.query.examId || '').trim()
    const code = route.query.code as string | undefined
    const difficulty = route.query.difficulty as string | undefined
    const paperId = route.query.paperId as string | undefined

    if (resumeExamId) {
      const examSession = await getExamSession(resumeExamId)
      const examType = normalizeExamType(examSession.examType)
      activeExamType.value = examType
      if (!isExamTypeAvailable(examType)) {
        ElMessage.info(getExamUnavailableMessage(examType))
        router.replace({ path: '/question-bank', query: { examType } })
        return
      }
      const loadedQuestions = (examSession.questions || []).map((question, index) => ({
        ...question,
        id: question.id || `session-${resumeExamId}-${index + 1}`,
      }))
      if (!loadedQuestions.length) {
        throw new Error('当前练习没有可恢复的题目')
      }
      activeExamRecordId.value = examSession.examRecordId
      questions.value = loadedQuestions
      examExpiresAt.value = examSession.expiresAt
      countdownDurationSeconds.value = examSession.expiresAt
        ? Math.max(
            1,
            Math.round(
              (new Date(examSession.expiresAt).getTime() -
                new Date(examSession.startedAt).getTime()) /
                1000,
            ),
          )
        : 0
      restoreSavedProgress(examSession, loadedQuestions)
      if (examSession.isExpired) isQuestionTimingPaused = true
      return
    }

    if (paperId) {
      const paper = await getPaperDetailData(paperId)
      activeExamType.value = normalizeExamType(paper.examType)
      if (!isExamTypeAvailable(activeExamType.value)) {
        ElMessage.info(getExamUnavailableMessage(activeExamType.value))
        router.replace('/assessment')
        return
      }
      // 兼容旧链接：分段卷必须进入服务端按当前科目或 Paper 下题的专用页面。
      if (paper.deliveryMode === 'module_sequence') {
        await router.replace({ name: 'diagnostic-exam', params: { paperId: paper.id } })
        return
      }
      const loadedQuestions = (paper.questions || []).map((q, index) => ({
        ...q,
        id: q.id || `paper-${paper.id}-${q.number || index + 1}`,
      }))
      const examSession = await startExam({
        paperId,
        examType: activeExamType.value,
        startedAt: new Date().toISOString(),
      })
      activeExamRecordId.value = examSession.examRecordId
      questions.value = loadedQuestions
      countdownDurationSeconds.value = Math.max(1, paper.duration || 60) * 60
      examExpiresAt.value = examSession.expiresAt
      if (examSession.isResumed) {
        restoreSavedProgress(examSession, loadedQuestions)
      } else {
        resetAnswerState()
      }
      if (examSession.isExpired) isQuestionTimingPaused = true
      return
    }

    const examType = normalizeExamType(route.query.examType as string | undefined)
    activeExamType.value = examType
    if (!isExamTypeAvailable(examType)) {
      ElMessage.info(getExamUnavailableMessage(examType))
      router.replace({ path: '/question-bank', query: { examType } })
      return
    }
    const selection = await getQuestionsData({ code, difficulty, examType })
    const qs = selection.questions || []
    const loadedQuestions = qs.map((q, index) => ({
      ...q,
      id: q.id || `question-bank-${q.code || q.number || index + 1}`,
    }))
    if (!loadedQuestions.length) {
      questions.value = []
      resetAnswerState()
      return
    }
    if (!selection.selectionToken) {
      ElMessage.error('选题凭证生成失败，请返回试题库重试')
      await router.replace('/question-bank')
      return
    }
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
    const examSession = await startExam({
      selectionToken: selection.selectionToken,
      startedAt: new Date().toISOString(),
    })
    activeExamRecordId.value = examSession.examRecordId
    questions.value = loadedQuestions
    examExpiresAt.value = examSession.expiresAt
    if (examSession.isResumed) {
      restoreSavedProgress(examSession, loadedQuestions)
    } else {
      resetAnswerState()
    }
    await router.replace({
      path: '/practice',
      query: { examId: examSession.examRecordId },
    })
  } catch (e) {
    if (hasApiErrorCode(e, 'QUESTION_BANK_IN_PROGRESS')) {
      ElMessage.info('已有未完成练习，请从试题库点击“继续练习”')
      await router.replace({
        path: '/question-bank',
        query: { examType: activeExamType.value },
      })
      return
    }
    console.error('[Practice] 加载失败', e)
    questions.value = []
  } finally {
    loading.value = false
    questionEnteredAt = Date.now()
  }
}

function resetAnswerState(): void {
  currentIndex.value = 0
  visitedIndexes.value = new Set([0])
  answers.value = {}
  questionDurations.value = {}
  dirtyQuestionVersions.clear()
  persistedQuestionDurations.clear()
  isQuestionTimingPaused = false
  initialElapsedSeconds.value = 0
  examTimerKey.value += 1
}

function restoreSavedProgress(
  progress: Pick<
    ExamProgress,
    'answers' | 'questionDurations' | 'answerStates' | 'durationSeconds'
  >,
  loadedQuestions: RenderableQuestion[],
): void {
  const questionIds = new Set(loadedQuestions.map((question) => question.id))
  const restoredAnswers: Record<string, string> = {}
  const restoredDurations: Record<string, number> = {}
  persistedQuestionDurations.clear()

  for (const [questionId, answer] of Object.entries(progress.answers || {})) {
    if (questionIds.has(questionId)) restoredAnswers[questionId] = answer
  }
  for (const [questionId, duration] of Object.entries(progress.questionDurations || {})) {
    if (questionIds.has(questionId)) {
      const normalizedDuration = Math.max(0, Number(duration) || 0)
      restoredDurations[questionId] = normalizedDuration
      persistedQuestionDurations.set(questionId, normalizedDuration)
    }
  }

  answers.value = restoredAnswers
  questionDurations.value = restoredDurations
  initialElapsedSeconds.value = Math.max(0, Number(progress.durationSeconds) || 0)

  const visited = new Set<number>([0])
  loadedQuestions.forEach((question, index) => {
    const savedState = progress.answerStates?.[question.id]
    if (
      savedState === 'answered' ||
      savedState === 'skipped' ||
      restoredAnswers[question.id] ||
      (restoredDurations[question.id] ?? 0) > 0
    )
      visited.add(index)
  })
  const firstUnansweredIndex = loadedQuestions.findIndex(
    (question) => !restoredAnswers[question.id],
  )
  currentIndex.value =
    firstUnansweredIndex >= 0 ? firstUnansweredIndex : Math.max(loadedQuestions.length - 1, 0)
  visited.add(currentIndex.value)
  visitedIndexes.value = visited
  dirtyQuestionVersions.clear()
  examTimerKey.value += 1
}

// 根据答案与访问记录区分已答、主动跳过和从未查看。
function getQuestionAnswerState(question: RenderableQuestion, index: number): AnswerState {
  if (answers.value[question.id]) return 'answered'
  return visitedIndexes.value.has(index) ? 'skipped' : 'unseen'
}

// 逐题响应使用累计耗时，网络重试只会覆盖同一数值，不会重复累加。
function buildQuestionResponse(question: RenderableQuestion, index: number): ExamResponseInput {
  return {
    questionId: question.id,
    selectedAnswer: answers.value[question.id] || null,
    durationSeconds: Math.max(0, Math.round(questionDurations.value[question.id] || 0)),
    answerState: getQuestionAnswerState(question, index),
  }
}

// 交卷提交整套最终快照，后端据此重新校验所有答案与状态。
function buildExamResponses(): ExamResponseInput[] {
  return questions.value.map((question, index) => buildQuestionResponse(question, index))
}

// 脏版本用于避免保存请求期间的新变化被旧请求错误清除。
function markQuestionDirty(questionId: string): void {
  dirtyVersion += 1
  dirtyQuestionVersions.set(questionId, dirtyVersion)
}

// 记录访问过的题号，用于区分未看过和跳过的题目状态。
function markVisited(index: number): void {
  visitedIndexes.value = new Set([...visitedIndexes.value, index])
}

// 切题前把当前题停留时长累加，保证来回切换时每段时间都被统计。
function recordCurrentQuestionDuration(markDirty = true): void {
  if (isQuestionTimingPaused) return
  const question = currentQuestion.value
  if (!question) return
  const elapsedSeconds = Math.max(0, Math.round((Date.now() - questionEnteredAt) / 1000))
  questionDurations.value = {
    ...questionDurations.value,
    [question.id]: (questionDurations.value[question.id] || 0) + elapsedSeconds,
  }
  if (markDirty) markQuestionDirty(question.id)
  questionEnteredAt = Date.now()
}

// 导航栏检测到页面切出时结算当前题，真题总倒计时是否继续由导航栏模式决定。
function handleAnsweringPaused(): void {
  if (isQuestionTimingPaused) return
  recordCurrentQuestionDuration()
  isQuestionTimingPaused = true
  void flushExamProgress(false)
}

// 只有导航栏确认可以继续作答后，才重新开始当前题的活跃耗时。
function handleAnsweringResumed(): void {
  if (!isQuestionTimingPaused) return
  isQuestionTimingPaused = false
  questionEnteredAt = Date.now()
}

// 题号导航和上下题共用该方法，切题时同步访问状态。
function goToQuestion(index: number): void {
  if (index === currentIndex.value) return
  recordCurrentQuestionDuration()
  currentIndex.value = index
  markVisited(index)
  questionEnteredAt = Date.now()
  void flushExamProgress(false)
}

// 根据当前题、已答题、已访问状态计算左侧题号样式。
function navItemClass(question: RenderableQuestion, index: number): Record<string, boolean> {
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
  markQuestionDirty(currentQuestion.value.id)
  if (selectionSaveTimer) clearTimeout(selectionSaveTimer)
  selectionSaveTimer = setTimeout(() => {
    selectionSaveTimer = null
    void flushExamProgress(false)
  }, 600)
}

// 上一题按钮只在非首题时切换，避免越界访问题目数组。
function handlePrev(): void {
  if (currentIndex.value > 0) goToQuestion(currentIndex.value - 1)
}

// 下一题按钮只在非末题时切换，末题交由交卷按钮完成流程。
function handleNext(): void {
  if (currentIndex.value < totalCount.value - 1) goToQuestion(currentIndex.value + 1)
}

// 根据入口返回对应页面，离开前二次确认避免误触。
async function handleBackToQuestionBank(): Promise<void> {
  const backTargets: Record<string, { label: string; path: string }> = {
    'question-bank': { label: '试题库', path: '/question-bank' },
    assessment: { label: '诊断测试', path: '/assessment' },
    'mock-exam': { label: '仿真考试', path: '/' },
  }
  const target = cameFromPracticeNotebook.value
    ? { label: '练习本', path: '/practice-notebook' }
    : cameFromPracticeRecords.value
      ? { label: '练习记录', path: '/practice-records' }
      : backTargets[examMode.value]!
  const confirmMessage =
    examMode.value === 'assessment'
      ? '返回诊断测试会保存当前作答和用时，之后可继续测试，是否返回？'
      : `返回${target.label}会保存当前作答和用时，之后可继续练习，是否返回？`
  try {
    await ElMessageBox.confirm(confirmMessage, '提示', {
      type: 'warning',
      confirmButtonText: '保存并返回',
      cancelButtonText: '继续答题',
      confirmButtonClass: 'button_primary',
      cancelButtonClass: 'button_cancel',
      customClass: 'app-confirm-box',
      closeOnClickModal: false,
      distinguishCancelAndClose: true,
    })
    router.push(target.path)
  } catch {
    // 用户取消返回时保持当前答题状态。
  }
}

// 中途返回时保存当前答案和每题停留时长，用于题库练习或诊断测试续答。
async function saveCurrentExamProgress(): Promise<void> {
  if (!activeExamRecordId.value || !questions.value.length) return
  await flushExamProgress(true, true, true)
}

// 只提交发生变化的题目；定时保存仅在答案未保存或累计耗时新增满60秒时写入。
async function flushExamProgress(
  includeCurrentDuration = true,
  throwOnError = false,
  forceCurrentSave = false,
): Promise<void> {
  if (submitting.value || !activeExamRecordId.value || !questions.value.length) return
  if (includeCurrentDuration) {
    const question = currentQuestion.value
    recordCurrentQuestionDuration(false)
    if (question) {
      const currentDuration = questionDurations.value[question.id] || 0
      const persistedDuration = persistedQuestionDurations.get(question.id) || 0
      if (
        forceCurrentSave ||
        dirtyQuestionVersions.has(question.id) ||
        currentDuration - persistedDuration >= 60
      )
        markQuestionDirty(question.id)
    }
  }
  if (progressSavePromise) {
    try {
      await progressSavePromise
    } catch (error) {
      if (throwOnError) throw error
    }
  }

  const capturedVersions = [...dirtyQuestionVersions.entries()]
  if (!capturedVersions.length) return
  const questionIndexMap = new Map(questions.value.map((question, index) => [question.id, index]))
  const responses = capturedVersions.flatMap(([questionId]) => {
    const index = questionIndexMap.get(questionId)
    if (index === undefined) return []
    return [buildQuestionResponse(questions.value[index]!, index)]
  })
  if (!responses.length) return

  const request = saveExamProgress(activeExamRecordId.value, responses).then((result) => {
    activeExamRecordId.value = result.examRecordId
    responses.forEach((response) => {
      persistedQuestionDurations.set(response.questionId, response.durationSeconds)
    })
    capturedVersions.forEach(([questionId, version]) => {
      if (dirtyQuestionVersions.get(questionId) === version)
        dirtyQuestionVersions.delete(questionId)
    })
  })
  progressSavePromise = request
  try {
    await request
  } catch (error) {
    if (hasApiErrorCode(error, 'EXAM_EXPIRED')) {
      void handleTimeExpired()
      if (throwOnError) throw error
      return
    }
    if (throwOnError) throw error
    console.warn('[Practice] 自动保存答题进度失败', error)
  } finally {
    if (progressSavePromise === request) progressSavePromise = null
  }
}

// 提前交卷前进行二次确认，避免学生误触导致答题直接结束。
async function confirmSubmitExam(): Promise<void> {
  if (submitting.value || confirmingSubmit.value || !currentQuestion.value) return
  confirmingSubmit.value = true
  const confirmMessage =
    unansweredCount.value > 0
      ? '交卷后将生成本次答题结果，未作答题目会计为未答，是否提前交卷？'
      : '确认交卷？'
  try {
    await ElMessageBox.confirm(confirmMessage, '提示', {
      type: 'warning',
      confirmButtonText: '确认交卷',
      cancelButtonText: '继续答题',
      confirmButtonClass: 'button_primary',
      cancelButtonClass: 'button_cancel',
      customClass: 'app-confirm-box',
      closeOnClickModal: false,
      distinguishCancelAndClose: true,
    })
    await handleSubmit()
  } catch {
    // 用户取消交卷时保持当前答题状态。
  } finally {
    confirmingSubmit.value = false
  }
}

// 诊断测试继续打开分析任务弹窗；题库练习与练习本在当前答题页选择返回或查看解析。
async function handleSubmit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    recordCurrentQuestionDuration()
    // 等待已经发出的增量保存结束，减少正常操作中旧请求晚于交卷到达的概率。
    if (progressSavePromise) {
      try {
        await progressSavePromise
      } catch (error) {
        console.warn('[Practice] 交卷前等待进度保存失败，将以最终答卷快照为准', error)
      }
    }
    if (!activeExamRecordId.value) throw new Error('考试记录尚未创建，请刷新页面后重试')
    const data = await submitExam(activeExamRecordId.value, {
      responses: buildExamResponses(),
      startedAt: new Date(examNavRef.value?.startedAt ?? Date.now()).toISOString(),
      submissionKey: submissionKey.value,
    })
    // 后端已经交卷后禁止路由守卫再次保存进度，否则会被 submitted 状态拒绝。
    examSubmitted.value = true
    void refreshMemberContextAfterSubmit()
    submittedExamRecordId.value = data.examRecordId
    if (examMode.value === 'assessment') {
      analysisDialogVisible.value = true
      return
    }
    practiceResultDialogVisible.value = true
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    submitting.value = false
  }
}

// 题库练习交卷后直接进入本次逐题解析，不再经过已废弃的结果汇总页。
async function handleViewPracticeAnalysis(): Promise<void> {
  if (!submittedExamRecordId.value) return
  practiceResultDialogVisible.value = false
  await router.push({
    name: 'exam-result-detail',
    params: { id: submittedExamRecordId.value },
    query: {
      from: cameFromPracticeNotebook.value
        ? 'practice-notebook'
        : cameFromPracticeRecords.value
          ? 'practice-records'
          : 'question-bank',
      recordSource: 'question-bank',
    },
  })
}

// 返回按钮根据开始练习的业务入口回到试题库或练习册首页。
async function handleReturnAfterPractice(): Promise<void> {
  practiceResultDialogVisible.value = false
  await router.push({
    path: practiceReturnPath.value,
    query:
      cameFromPracticeNotebook.value || cameFromPracticeRecords.value
        ? undefined
        : { examType: activeExamType.value },
  })
}

// 交卷后的会员额度刷新不阻断已成功提交的诊断分析流程。
async function refreshMemberContextAfterSubmit(): Promise<void> {
  try {
    const memberCtx = await getMember()
    auth.setMemberContext(memberCtx)
  } catch (error) {
    console.warn('[Practice] 交卷后刷新会员上下文失败', error)
  }
}

// 用户主动点击查看后才离开答题页并进入对应考试类型的诊断报告。
async function handleViewDiagnosticReport(target: string): Promise<void> {
  analysisDialogVisible.value = false
  await router.push(target)
}

// 分析完成或失败后返回诊断列表，列表会读取已保存报告的最新状态。
async function handleReturnToAssessment(): Promise<void> {
  analysisDialogVisible.value = false
  await router.push('/assessment')
}

// 倒计时归零时由 ExamVue 触发，弹出弹窗后强制交卷。
async function handleTimeExpired(): Promise<void> {
  if (timeExpiredHandling || submitting.value || examSubmitted.value) return
  timeExpiredHandling = true
  try {
    await ElMessageBox.alert('考试时间已结束，系统将自动提交您的试卷。', '答题时间到', {
      confirmButtonText: '确定',
      confirmButtonClass: 'button_primary',
      customClass: 'app-confirm-box',
      closeOnClickModal: false,
      showClose: false,
    })
  } finally {
    await handleSubmit()
    timeExpiredHandling = false
  }
}

function normalizeExamType(value: unknown): ExamType {
  return EXAM_TYPE_OPTIONS.some((item) => item.value === value)
    ? (value as ExamType)
    : DEFAULT_EXAM_TYPE
}

function normalizePointTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const items = raw
    .map((item) => {
      const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {}
      const rawLabel = record.label || record.name || record.title || record.code
      return {
        code: typeof record.code === 'string' ? record.code : '',
        role: typeof record.role === 'string' ? record.role : '',
        label: typeof rawLabel === 'string' ? rawLabel : '',
      }
    })
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

// 页面进入后拉题，计时由 ExamVue 组件自行管理。
onMounted(() => {
  loadQuestions()
  progressSaveInterval = setInterval(() => {
    void flushExamProgress()
  }, 60_000)
})

// 离开答题页时释放自动保存资源；业务返回按钮会在导航前等待最后一次保存完成。
onBeforeUnmount(() => {
  if (progressSaveInterval) clearInterval(progressSaveInterval)
  if (selectionSaveTimer) clearTimeout(selectionSaveTimer)
})

// 浏览器后退和其他路由跳转同样先保存进度，避免绕过页面内返回按钮。
onBeforeRouteLeave(async () => {
  if (submitting.value || examSubmitted.value || !activeExamRecordId.value) return true
  try {
    await saveCurrentExamProgress()
    return true
  } catch {
    return false
  }
})
</script>

<style scoped lang="scss">
.practice-page {
  --practice-topbar-height: 64px;

  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-ink);
}
.practice-shell {
  width: 100%;
  max-width: 1440px;
  min-height: calc(100vh - var(--practice-topbar-height));
  margin: 0 auto;
  padding: 24px 40px 40px;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  align-items: start;
  gap: 24px;
}
.question-nav,
.exam-panel {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}
.question-nav {
  position: sticky;
  top: calc(var(--practice-topbar-height) + 24px);
  align-self: start;
  height: auto;
  padding: 20px;
}
.question-nav__title {
  margin: 0 0 18px;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}
.question-nav__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.question-nav__item {
  height: 42px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  cursor: pointer;
  transition:
    background var(--duration-base) ease,
    border-color var(--duration-base) ease,
    color var(--duration-base) ease;
}
.question-nav__item:hover {
  border-color: var(--color-ink);
  background: var(--color-hover);
}
.question-nav__item--current {
  border-color: var(--color-ink);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}
.question-nav__item--answered {
  border-color: var(--color-success);
  background: var(--color-success-bg);
  color: var(--color-success);
}
.question-nav__item--skipped {
  border-color: var(--color-warning);
  background: var(--color-warning-bg);
  color: #9a6200;
}
.question-nav__item--current.question-nav__item--answered,
.question-nav__item--current.question-nav__item--skipped {
  border-color: var(--color-ink);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}
.question-nav__stats {
  margin-top: 20px;
  display: grid;
  gap: 10px;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
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
  background: var(--color-warning);
}
.question-nav__submit {
  width: 100%;
  height: 48px;
  margin-top: 24px;
  font-size: var(--text-base);
}
.exam-panel {
  min-width: 0;
  padding: 24px;
}
.exam-panel__body {
  min-width: 0;
}
.exam-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--color-line-soft);
}
.exam-action {
  min-width: 96px;
  height: 40px;
}
.exam-actions__right {
  display: flex;
  gap: 12px;
}
.practice-status {
  padding: 32px;
  text-align: center;
  color: var(--color-ink-muted);
}
</style>
