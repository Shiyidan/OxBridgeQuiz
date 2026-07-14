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
import { getQuestionsData } from '@/api/questionBank'
import { getPaperDetailData } from '@/api/papers'
import {
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
import type { Question } from '@/types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const examNavRef = ref<InstanceType<typeof ExamVue> | null>(null)
const questions = shallowRef<Question[]>([])
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
const isDebugRetake = computed(() => route.query.debugRetake === '1')

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
const topicTitle = computed(() => (currentQuestion.value as any)?.subject || '')
const currentKnowledgeTags = computed(() => {
  const question = currentQuestion.value as any
  if (!question) return []
  const tags = normalizePointTags(question.knowledge_points || question.knowledgePoints)
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
      if (!isExamTypeAvailable(activeExamType.value)) {
        ElMessage.info(getExamUnavailableMessage(activeExamType.value))
        router.replace('/assessment')
        return
      }
      const loadedQuestions = (paper.questions || []).map((q: any, index: number) => ({
        ...q,
        id: q.id || `paper-${paper.id}-${q.number || index + 1}`,
      }))
      if (!isDebugRetake.value) {
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
      }
      const examSession = await startExam({
        paperId,
        examType: activeExamType.value,
        startedAt: new Date().toISOString(),
        debugRetake: isDebugRetake.value,
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
    const qs = (await getQuestionsData({ code, difficulty, examType })) || []
    const loadedQuestions = qs.map((q: any) => ({
      ...q,
      id: q.id || `${q._paperId || 'paper'}-${q.number}`,
    }))
    if (!loadedQuestions.length) {
      questions.value = []
      resetAnswerState()
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
      examType,
      questionIds: loadedQuestions.map((question) => question.id),
      startedAt: new Date().toISOString(),
    })
    activeExamRecordId.value = examSession.examRecordId
    questions.value = loadedQuestions
    examExpiresAt.value = examSession.expiresAt
    resetAnswerState()
  } catch (e) {
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
  loadedQuestions: Question[],
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
function getQuestionAnswerState(question: Question, index: number): AnswerState {
  if (answers.value[question.id]) return 'answered'
  return visitedIndexes.value.has(index) ? 'skipped' : 'unseen'
}

// 逐题响应使用累计耗时，网络重试只会覆盖同一数值，不会重复累加。
function buildQuestionResponse(question: Question, index: number): ExamResponseInput {
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
  void flushAssessmentProgress(false)
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
  void flushAssessmentProgress(false)
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
  markQuestionDirty(currentQuestion.value.id)
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
  const target = backTargets[examMode.value]!
  const isAssessmentMode = examMode.value === 'assessment'
  const confirmMessage = isAssessmentMode
    ? '返回诊断测试会保存当前作答和用时，之后可继续测试，是否返回？'
    : `返回${target.label}将离开当前答题页面，当前作答不会自动提交，是否返回？`
  try {
    await ElMessageBox.confirm(confirmMessage, '提示', {
      type: 'warning',
      confirmButtonText: isAssessmentMode ? '保存并返回' : `返回${target.label}`,
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

// 诊断测试中途返回时保存当前答案和每题停留时长，用于下次续答。
async function saveCurrentAssessmentProgress(): Promise<void> {
  if (!activeExamRecordId.value || !questions.value.length) return
  await flushAssessmentProgress(true, true, true)
}

// 只提交发生变化的题目；定时保存仅在答案未保存或累计耗时新增满60秒时写入。
async function flushAssessmentProgress(
  includeCurrentDuration = true,
  throwOnError = false,
  forceCurrentSave = false,
): Promise<void> {
  if (
    examMode.value !== 'assessment' ||
    submitting.value ||
    !activeExamRecordId.value ||
    !questions.value.length
  )
    return
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
    if ((error as any)?.response?.data?.code === 'EXAM_EXPIRED') {
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

// 诊断测试交卷后在当前页打开分析弹窗，题库练习仍进入普通结果页。
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
      debugRetake: isDebugRetake.value,
      submissionKey: submissionKey.value,
    })
    // 后端已经交卷后禁止路由守卫再次保存进度，否则会被 submitted 状态拒绝。
    examSubmitted.value = true
    void refreshMemberContextAfterSubmit()
    if (examMode.value === 'assessment') {
      submittedExamRecordId.value = data.examRecordId
      analysisDialogVisible.value = true
      return
    }
    await router.push({
      path: '/exam-result',
      query: {
        id: data.examRecordId,
        total: String(data.totalQuestions),
        correct: String(data.correctCount),
        wrong: String(data.wrongCount),
        // 使用 ExamVue 组件的已扣除暂停时长的实际用时
        time: String(data.durationSeconds),
        source: 'question-bank',
      },
    })
  } catch (e: any) {
    ElMessage.error(e.response?.data?.errMsg || '交卷失败，请重试')
  } finally {
    submitting.value = false
  }
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

// 页面进入后拉题，计时由 ExamVue 组件自行管理。
onMounted(() => {
  loadQuestions()
  progressSaveInterval = setInterval(() => {
    void flushAssessmentProgress()
  }, 60_000)
})

// 离开答题页时释放自动保存资源；业务返回按钮会在导航前等待最后一次保存完成。
onBeforeUnmount(() => {
  if (progressSaveInterval) clearInterval(progressSaveInterval)
})

// 浏览器后退和其他路由跳转同样先保存诊断进度，避免绕过页面内返回按钮。
onBeforeRouteLeave(async () => {
  if (
    examMode.value !== 'assessment' ||
    submitting.value ||
    examSubmitted.value ||
    !activeExamRecordId.value
  )
    return true
  try {
    await saveCurrentAssessmentProgress()
    return true
  } catch (error: any) {
    ElMessage.error(error.response?.data?.errMsg || '保存答题进度失败，请重试')
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
