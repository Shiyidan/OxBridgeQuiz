<!-- 分段诊断答题页：支持 ESAT 科目模块和 TMUA Paper 1/2 的独立计时与顺序锁定。 -->
<template>
  <div class="diagnostic-exam-page">
    <ExamVue
      v-if="session?.phase === 'answering' && activeModule"
      :key="timerKey"
      :exam-type="session.examType === 'TMUA' ? 'TMUA' : 'ESAT'"
      mode="assessment"
      :countdown-duration-seconds="activeModule.durationSeconds"
      :expires-at="activeModule.expiresAt"
      :server-now="session.serverNow"
      :initial-elapsed-seconds="0"
      :current-index="currentIndex"
      :total-count="questions.length"
      :section-title="activeModule.label"
      :pause-on-visibility="true"
      @back="handleBack"
      @answering-paused="handleAnsweringPaused"
      @answering-resumed="handleAnsweringResumed"
      @time-expired="handleModuleTimeExpired"
    />

    <main class="diagnostic-exam-shell">
      <div v-if="loading" class="diagnostic-status">正在恢复诊断测试...</div>
      <template v-else-if="session">
        <header class="module-header">
          <div>
            <span>{{ examEyebrow }}</span>
            <h1>{{ activeModule?.label || breakState?.nextModuleLabel || '诊断测试' }}</h1>
          </div>
          <ol class="module-progress" :aria-label="`${sectionNoun}进度`">
            <li
              v-for="(module, index) in session.modules || []"
              :key="module.code"
              :class="{
                'module-progress__item--active': index === session.currentModuleIndex,
                'module-progress__item--completed': module.status === 'completed',
              }"
            >
              <b>{{ index + 1 }}</b>
              <span>{{ module.label }}</span>
            </li>
          </ol>
        </header>

        <div v-if="session.phase === 'answering'" class="exam-layout">
          <aside class="question-nav" :aria-label="`当前${sectionNoun}题目导航`">
            <strong>{{ activeModule?.label }}</strong>
            <small>{{ activeModule?.totalQuestions }} 题 · {{ moduleMinutes }} 分钟</small>
            <div class="question-nav__grid">
              <button
                v-for="(question, index) in questions"
                :key="question.id"
                type="button"
                :class="navItemClass(question, index)"
                :disabled="interactionLocked"
                @click="goToQuestion(index)"
              >
                {{ getQuestionDisplayNumber(question, index) }}
              </button>
            </div>
            <div class="question-nav__summary">
              已答 {{ answeredCount }} · 未答 {{ questions.length - answeredCount }}
            </div>
            <button
              type="button"
              class="question-nav__complete button_cancel"
              :disabled="interactionLocked || !questions.length"
              @click="confirmCompleteModule"
            >
              {{ completeSectionLabel }}
            </button>
          </aside>

          <section
            class="question-panel"
            :class="{ 'question-panel--locked': moduleDeadlineReached }"
          >
            <QuestionCard
              v-if="currentQuestion"
              :key="currentQuestion.id"
              :question="currentQuestion"
              :index="currentIndex"
              :question-label="currentQuestionLabel"
              :selected-answer="answers[currentQuestion.id]"
              :meta-tags="currentKnowledgeTags"
              :disabled="interactionLocked"
              variant="exam"
              @select="handleSelectAnswer"
            />
            <footer class="question-actions">
              <button
                type="button"
                class="button_cancel"
                :disabled="interactionLocked || currentIndex === 0"
                @click="goToQuestion(currentIndex - 1)"
              >
                上一题
              </button>
              <button
                type="button"
                class="button_cancel"
                :disabled="interactionLocked || currentIndex >= questions.length - 1"
                @click="goToQuestion(currentIndex + 1)"
              >
                下一题
              </button>
            </footer>
          </section>
        </div>

        <div v-else-if="session.phase === 'ready_to_submit'" class="diagnostic-status">
          <p>
            全部{{ sectionNoun }}已完成，{{
              transitioning ? '正在提交诊断结果...' : '诊断结果尚未提交。'
            }}
          </p>
          <button
            v-if="!transitioning"
            type="button"
            class="button_primary"
            @click="finalizeExam"
          >
            重试提交诊断结果
          </button>
        </div>
      </template>
      <div v-else class="diagnostic-status">
        <p>无法加载诊断测试。</p>
        <button type="button" class="button_primary" @click="loadSession">重新加载</button>
      </div>
    </main>

    <ExamBreakDialog
      :visible="session?.phase === 'break'"
      :ends-at="breakState?.endsAt || null"
      :server-now="session?.serverNow || null"
      :next-module-label="breakState?.nextModuleLabel || `下一${sectionNoun}`"
      :skipping="transitioning"
      @skip="handleSkipBreak"
      @elapsed="handleBreakElapsed"
    />

    <DiagnosticAnalysisDialog
      :model-value="analysisDialogVisible"
      :exam-id="submittedExamRecordId"
      @view-report="handleViewDiagnosticReport"
      @return-assessment="handleReturnToAssessment"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ExamVue from '@/components/ExamVue.vue'
import ExamBreakDialog from '@/components/ExamBreakDialog.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import DiagnosticAnalysisDialog from '@/components/DiagnosticAnalysisDialog.vue'
import {
  completeExamModule,
  getModuleExamSession,
  pauseExamModule,
  saveExamProgress,
  skipExamBreak,
  startExam,
  submitExam,
  type AnswerState,
  type ExamResponseInput,
  type StartExamResult,
} from '@/api/exam'
import { getMember } from '@/api/member'
import { useAuthStore } from '@/stores/auth'
import type { AttemptQuestion } from '@/types'
import { hasApiErrorCode } from '@/utils/request'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const session = ref<StartExamResult | null>(null)
const questions = shallowRef<AttemptQuestion[]>([])
const currentIndex = ref(0)
const answers = ref<Record<string, string>>({})
const questionDurations = ref<Record<string, number>>({})
const visitedQuestionIds = ref<Set<string>>(new Set())
const transitioning = ref(false)
const moduleDeadlineReached = ref(false)
const submitted = ref(false)
const analysisDialogVisible = ref(false)
const submittedExamRecordId = ref('')
const timerKey = ref('')
const submissionKey =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `submit-${Date.now()}-${Math.random().toString(16).slice(2)}`
let questionEnteredAt = Date.now()
let timingPaused = false
let saveTimer: ReturnType<typeof setInterval> | null = null
let selectionSaveTimer: ReturnType<typeof setTimeout> | null = null
let progressSavePromise: Promise<void> | null = null
let pauseSessionPromise: Promise<void> | null = null
let resumeSessionPromise: Promise<void> | null = null
let leaveConfirmationPromise: Promise<boolean> | null = null
let pendingExpiredModuleCode = ''

const activeModule = computed(() => session.value?.currentModule || null)
const breakState = computed(() => session.value?.break || null)
const currentQuestion = computed(() => questions.value[currentIndex.value])
const answeredCount = computed(() => Object.keys(answers.value).length)
const moduleMinutes = computed(() => Math.round((activeModule.value?.durationSeconds || 0) / 60))
const interactionLocked = computed(
  () =>
    transitioning.value ||
    moduleDeadlineReached.value ||
    Boolean(session.value?.isExpired) ||
    session.value?.phase === 'paused' ||
    session.value?.phase === 'break_paused',
)
const isFinalModule = computed(
  () => (session.value?.currentModuleIndex || 0) === (session.value?.modules?.length || 1) - 1,
)
// 服务端考试类型决定页面使用 TMUA 分卷语义还是 ESAT 科目语义。
const isTmua = computed(() => session.value?.examType === 'TMUA')
// 学生操作提示统一使用考试真实结构名称，避免把 TMUA Paper 称为学科。
const sectionNoun = computed(() => (isTmua.value ? '试卷' : '科目'))
// 页头明确当前诊断结构，帮助学生确认两卷或三科进度。
const examEyebrow = computed(() => (
  isTmua.value ? 'TMUA Diagnostic · Paper 1 & Paper 2' : 'ESAT Equivalent Diagnostic'
))
// 最后一段结束即进入交卷，其余分段只锁定当前答案并继续流程。
const completeSectionLabel = computed(() => (
  isFinalModule.value
    ? `结束本${sectionNoun.value}并交卷`
    : `结束本${sectionNoun.value}`
))

// 题号展示使用当前分段内题号，数据库全卷序号只作为旧数据兜底。
const currentQuestionLabel = computed(() => {
  const question = currentQuestion.value
  if (!question) return ''
  return `${activeModule.value?.label || `当前${sectionNoun.value}`} · Question ${getQuestionDisplayNumber(question, currentIndex.value)}`
})
const currentKnowledgeTags = computed(() => {
  const points = currentQuestion.value?.knowledge_points || []
  const labels = points.map((point) => point.label).filter(Boolean)
  return labels.length ? [...new Set(labels)] : [activeModule.value?.label || '综合考点']
})

// 新规范优先读取 module_question_number，早期 attempt 回退到 component 别名或数组顺序。
function getQuestionDisplayNumber(question: AttemptQuestion, index: number): number {
  return question.module_question_number || question.component_question_number || index + 1
}

// 服务端会话是当前模块、休息阶段和截止时间的唯一数据源。
async function loadSession(): Promise<void> {
  loading.value = true
  try {
    const examRecordId =
      typeof route.query.examRecordId === 'string' ? route.query.examRecordId : ''
    const paperId = String(route.params.paperId || '')
    const data = examRecordId
      ? await getModuleExamSession(examRecordId)
      : await startExam({ paperId })
    await applySession(data)
    if (data.phase === 'ready_to_submit') await finalizeExam()
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    loading.value = false
  }
}

// 切换分段时只保留服务端下发的当前作答状态，已完成分段不会再暴露。
async function applySession(nextSession: StartExamResult): Promise<void> {
  session.value = nextSession
  if (nextSession.phase === 'submitted') {
    submitted.value = true
    submittedExamRecordId.value = nextSession.examRecordId
    analysisDialogVisible.value = true
    return
  }
  if (nextSession.phase === 'ready_to_submit') {
    questions.value = []
    moduleDeadlineReached.value = true
    return
  }
  if (nextSession.phase !== 'answering' || !nextSession.currentModule) {
    questions.value = []
    timingPaused = true
    moduleDeadlineReached.value = false
    return
  }

  moduleDeadlineReached.value = Boolean(nextSession.isExpired)
  questions.value = nextSession.currentModule.questions || nextSession.questions || []
  answers.value = { ...nextSession.answers }
  questionDurations.value = { ...nextSession.questionDurations }
  visitedQuestionIds.value = new Set(
    questions.value
      .filter((question) => {
        return Boolean(
          answers.value[question.id] ||
          (nextSession.questionDurations?.[question.id] || 0) > 0 ||
          nextSession.answerStates?.[question.id] === 'skipped',
        )
      })
      .map((question) => question.id),
  )
  const firstUnanswered = questions.value.findIndex((question) => !answers.value[question.id])
  currentIndex.value =
    firstUnanswered >= 0 ? firstUnanswered : Math.max(questions.value.length - 1, 0)
  if (currentQuestion.value) visitedQuestionIds.value.add(currentQuestion.value.id)
  timingPaused = false
  questionEnteredAt = Date.now()
  timerKey.value = `${nextSession.examRecordId}:${nextSession.currentModule.code}:${nextSession.currentModule.expiresAt}`
  if (nextSession.isExpired) await handleModuleTimeExpired()
}

// 已作答优先，其余按访问记录区分主动跳过与尚未查看。
function getAnswerState(question: AttemptQuestion): AnswerState {
  if (answers.value[question.id]) return 'answered'
  return visitedQuestionIds.value.has(question.id) ? 'skipped' : 'unseen'
}

// 切题、保存和阶段切换前累计当前题的可见作答时长。
function recordCurrentDuration(): void {
  if (timingPaused || !currentQuestion.value) return
  const elapsed = Math.max(0, Math.round((Date.now() - questionEnteredAt) / 1000))
  questionDurations.value = {
    ...questionDurations.value,
    [currentQuestion.value.id]: (questionDurations.value[currentQuestion.value.id] || 0) + elapsed,
  }
  questionEnteredAt = Date.now()
}

// 当前分段始终提交完整快照，避免最后一次选择未进入定时保存。
function buildResponses(): ExamResponseInput[] {
  return questions.value.map((question) => ({
    questionId: question.id,
    selectedAnswer: answers.value[question.id] || null,
    durationSeconds: Math.max(0, Math.round(questionDurations.value[question.id] || 0)),
    answerState: getAnswerState(question),
  }))
}

// 自动保存失败保持静默，主动离开页面时由调用方展示错误并阻止离开。
async function saveProgress(showError = false): Promise<void> {
  if (!session.value || session.value.phase !== 'answering' || transitioning.value) return
  recordCurrentDuration()
  if (progressSavePromise) {
    try {
      await progressSavePromise
    } catch {
      // 当前完整快照会重试上一次保存失败的数据。
    }
  }
  if (!session.value || session.value.phase !== 'answering' || transitioning.value) return
  const request = saveExamProgress(session.value.examRecordId, buildResponses()).then(
    () => undefined,
  )
  progressSavePromise = request
  try {
    await request
  } catch (error: unknown) {
    if (hasApiErrorCode(error, 'EXAM_EXPIRED')) {
      await handleModuleTimeExpired()
      return
    }
    if (showError) throw error
  } finally {
    if (progressSavePromise === request) progressSavePromise = null
  }
}

// 当前分段内切题时结算上一题用时，并记录新题已访问。
function goToQuestion(index: number): void {
  if (
    interactionLocked.value ||
    index < 0 ||
    index >= questions.value.length ||
    index === currentIndex.value
  ) return
  recordCurrentDuration()
  currentIndex.value = index
  if (currentQuestion.value) visitedQuestionIds.value.add(currentQuestion.value.id)
  questionEnteredAt = Date.now()
}

// 答案只写入当前模块本地快照，保存与锁定均以题目 ID 提交。
function handleSelectAnswer(label: string): void {
  if (!currentQuestion.value || interactionLocked.value) return
  answers.value = { ...answers.value, [currentQuestion.value.id]: label }
  if (selectionSaveTimer) clearTimeout(selectionSaveTimer)
  // 选择后短防抖保存，减少刷新、崩溃或恰好到点时尚未落库的答案窗口。
  selectionSaveTimer = setTimeout(() => void saveProgress(), 400)
}

// 题号状态只反映当前分段，不暴露已锁定分段或未来分段。
function navItemClass(question: AttemptQuestion, index: number): Record<string, boolean> {
  return {
    'question-nav__item': true,
    'question-nav__item--current': currentIndex.value === index,
    'question-nav__item--answered': Boolean(answers.value[question.id]),
    'question-nav__item--skipped':
      visitedQuestionIds.value.has(question.id) &&
      !answers.value[question.id] &&
      currentIndex.value !== index,
  }
}

// 页面隐藏时冻结服务端分段剩余时间，保证标签切换、锁屏和主动退出使用同一计时规则。
function handleAnsweringPaused(): void {
  void pauseCurrentModule().catch(() => undefined)
}

// 页面重新可见后由服务端基于冻结秒数生成新截止时间。
function handleAnsweringResumed(): void {
  void resumePausedModule().catch(() => undefined)
}

// 分段一旦结束便不可返回，未答题存在时需向学生明确二次确认。
async function confirmCompleteModule(): Promise<void> {
  if (interactionLocked.value) return
  const unanswered = questions.value.length - answeredCount.value
  const nextSection = session.value?.modules?.[(session.value?.currentModuleIndex || 0) + 1]
  try {
    await ElMessageBox.confirm(
      unanswered > 0
        ? `本${sectionNoun.value}还有 ${unanswered} 题未作答。结束后不能返回修改，是否继续？`
        : `本${sectionNoun.value}结束后不能返回修改，是否继续？`,
      isFinalModule.value ? '完成诊断测试' : `结束当前${sectionNoun.value}`,
      {
        type: 'warning',
        confirmButtonText: isFinalModule.value
          ? '完成并交卷'
          : isTmua.value
            ? `结束并开始 ${nextSection?.label || 'Paper 2'}`
            : '结束并进入休息',
        cancelButtonText: '继续答题',
        closeOnClickModal: false,
      },
    )
    await completeCurrentModule()
  } catch {
    // 取消时继续当前模块。
  }
}

// 服务端锁定当前分段后返回休息、下一分段或待交卷阶段，前端不自行推断下一状态。
async function completeCurrentModule(): Promise<void> {
  if (!session.value || transitioning.value || session.value.phase !== 'answering') return
  transitioning.value = true
  recordCurrentDuration()
  timingPaused = true
  let nextSession: StartExamResult | null = null
  try {
    if (progressSavePromise) {
      try {
        await progressSavePromise
      } catch {
        // 模块锁定请求携带完整快照，可覆盖失败的增量保存。
      }
    }
    nextSession = await completeExamModule(session.value.examRecordId, buildResponses())
    await applySession(nextSession)
  } catch {
    if (!moduleDeadlineReached.value) {
      timingPaused = false
      questionEnteredAt = Date.now()
    }
  } finally {
    transitioning.value = false
    continuePendingModuleExpiry()
  }
  if (nextSession?.phase === 'ready_to_submit') await finalizeExam()
}

// 切换请求期间到达的到期事件必须在阶段稳定后重新核对，不能静默丢弃。
function continuePendingModuleExpiry(): void {
  const expiredModuleCode = pendingExpiredModuleCode
  pendingExpiredModuleCode = ''
  if (
    expiredModuleCode &&
    session.value?.phase === 'answering' &&
    activeModule.value?.code === expiredModuleCode &&
    (session.value.isExpired || moduleDeadlineReached.value)
  ) {
    void handleModuleTimeExpired()
    return
  }
  if (
    document.hidden &&
    (session.value?.phase === 'answering' || session.value?.phase === 'break')
  ) {
    window.setTimeout(() => void pauseCurrentModule().catch(() => undefined), 0)
  }
}

// 分段倒计时归零时直接锁定当前答案，不触发整场考试提前交卷。
async function handleModuleTimeExpired(): Promise<void> {
  if (session.value?.phase !== 'answering' || !activeModule.value) return
  const expiredModuleCode = activeModule.value.code
  moduleDeadlineReached.value = true
  timingPaused = true
  if (transitioning.value) {
    pendingExpiredModuleCode = expiredModuleCode
    return
  }
  ElMessage.warning(`当前${sectionNoun.value}时间已结束，答案已锁定`)
  await completeCurrentModule()
}

// 跳过和自然结束共用幂等接口，下一科目的开始时间由服务端决定。
async function advanceFromBreak(): Promise<void> {
  if (!session.value || transitioning.value || session.value.phase !== 'break') return
  transitioning.value = true
  try {
    const next = await skipExamBreak(session.value.examRecordId)
    await applySession(next)
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    transitioning.value = false
    continuePendingModuleExpiry()
  }
}

// 学生主动跳过休息时立即请求开启下一科目。
function handleSkipBreak(): void {
  void advanceFromBreak()
}

// 休息倒计时自然结束时请求恢复最新会话并开始下一科目。
function handleBreakElapsed(): void {
  void advanceFromBreak()
}

// 确认离开答题页时保存完整快照，并由服务端冻结当前分段的剩余秒数。
async function pauseCurrentModule(): Promise<void> {
  if (
    !session.value
    || (session.value.phase !== 'answering' && session.value.phase !== 'break')
  ) return
  if (pauseSessionPromise) {
    await pauseSessionPromise
    return
  }
  if (transitioning.value) return

  const isAnswering = session.value.phase === 'answering'
  const examRecordId = session.value.examRecordId
  const moduleCode = activeModule.value?.code || breakState.value?.nextModuleCode || ''
  const operation = (async () => {
    if (isAnswering) recordCurrentDuration()
    timingPaused = true
    transitioning.value = true
    if (selectionSaveTimer) {
      clearTimeout(selectionSaveTimer)
      selectionSaveTimer = null
    }
    if (progressSavePromise) {
      try {
        await progressSavePromise
      } catch {
        // 暂停接口携带完整快照，可覆盖失败的增量保存。
      }
    }

    let nextSession: StartExamResult | null = null
    let pauseSucceeded = false
    try {
      nextSession = await pauseExamModule(
        examRecordId,
        moduleCode,
        isAnswering ? buildResponses() : [],
      )
      await applySession(nextSession)
      pauseSucceeded = true
    } catch (error: unknown) {
      if (!moduleDeadlineReached.value) {
        timingPaused = false
        questionEnteredAt = Date.now()
        timerKey.value = `${timerKey.value}:pause-failed:${Date.now()}`
      }
      throw error
    } finally {
      transitioning.value = false
      if (pauseSucceeded) continuePendingModuleExpiry()
    }

    if (nextSession?.phase === 'ready_to_submit') await finalizeExam()
  })()
  pauseSessionPromise = operation
  try {
    await operation
  } finally {
    if (pauseSessionPromise === operation) pauseSessionPromise = null
  }
}

// 暂停请求完成后再恢复，避免快速切出切回造成旧截止时间与新截止时间并存。
async function resumePausedModule(): Promise<void> {
  if (pauseSessionPromise) {
    try {
      await pauseSessionPromise
    } catch {
      return
    }
  }
  if (document.hidden || !session.value || session.value.phase === 'submitted') return
  if (session.value.phase === 'answering') {
    timingPaused = false
    questionEnteredAt = Date.now()
    timerKey.value = `${timerKey.value}:resume:${Date.now()}`
    return
  }
  if (session.value.phase !== 'paused' && session.value.phase !== 'break_paused') return
  if (resumeSessionPromise) {
    await resumeSessionPromise
    return
  }

  const examRecordId = session.value.examRecordId
  const operation = (async () => {
    transitioning.value = true
    let nextSession: StartExamResult | null = null
    try {
      nextSession = await getModuleExamSession(examRecordId)
      await applySession(nextSession)
    } finally {
      transitioning.value = false
      continuePendingModuleExpiry()
    }
    if (nextSession?.phase === 'ready_to_submit') await finalizeExam()
  })()
  resumeSessionPromise = operation
  try {
    await operation
  } finally {
    if (resumeSessionPromise === operation) resumeSessionPromise = null
  }
}

// ExamVue 在暂停后可能已卸载，由页面级可见性监听负责触发服务端恢复。
function handleDocumentVisibilityChange(): void {
  if (document.hidden) {
    void pauseCurrentModule().catch(() => undefined)
    return
  }
  void resumePausedModule().catch(() => undefined)
}

// 所有分段均锁定后提交空响应，由后端使用已持久化答案生成诊断结果。
async function finalizeExam(): Promise<void> {
  if (!session.value || submitted.value || transitioning.value) return
  transitioning.value = true
  try {
    const result = await submitExam(session.value.examRecordId, {
      responses: [],
      submissionKey,
    })
    submitted.value = true
    submittedExamRecordId.value = result.examRecordId
    analysisDialogVisible.value = true
    try {
      auth.setMemberContext(await getMember())
    } catch {
      // 额度刷新失败不影响已提交的诊断结果。
    }
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    transitioning.value = false
  }
}

// 页面入口和浏览器历史返回共用同一确认流程，只有保存并暂停成功后才允许离开。
async function confirmAndPauseBeforeLeaving(): Promise<boolean> {
  if (submitted.value) return true
  if (transitioning.value) return false
  if (session.value?.phase !== 'answering' && session.value?.phase !== 'break') return true
  if (leaveConfirmationPromise) return leaveConfirmationPromise

  const operation = (async () => {
    try {
      await ElMessageBox.confirm(
        `返回诊断中心会保存当前${sectionNoun.value}进度，之后可继续测试。`,
        '确认返回',
        {
          confirmButtonText: '保存并返回',
          cancelButtonText: '继续答题',
          closeOnClickModal: false,
        },
      )
      await pauseCurrentModule()
      return true
    } catch {
      // 取消返回或保存失败时留在当前页面。
      return false
    }
  })()
  leaveConfirmationPromise = operation
  try {
    return await operation
  } finally {
    if (leaveConfirmationPromise === operation) leaveConfirmationPromise = null
  }
}

// 页面内返回入口确认成功后固定回到诊断测试首页。
async function handleBack(): Promise<void> {
  if (await confirmAndPauseBeforeLeaving()) {
    await router.push('/assessment')
  }
}

// 分析完成后按弹窗返回的考试类型路由进入诊断报告。
async function handleViewDiagnosticReport(target: string): Promise<void> {
  analysisDialogVisible.value = false
  await router.push(target)
}

// 暂不查看报告时返回诊断测试列表并刷新试卷状态。
async function handleReturnToAssessment(): Promise<void> {
  analysisDialogVisible.value = false
  await router.push('/assessment')
}

onMounted(() => {
  void loadSession()
  saveTimer = setInterval(() => void saveProgress(), 30_000)
  document.addEventListener('visibilitychange', handleDocumentVisibilityChange)
})

onBeforeUnmount(() => {
  if (saveTimer) clearInterval(saveTimer)
  if (selectionSaveTimer) clearTimeout(selectionSaveTimer)
  document.removeEventListener('visibilitychange', handleDocumentVisibilityChange)
})

onBeforeRouteLeave(async () => confirmAndPauseBeforeLeaving())
</script>

<style scoped lang="scss">
.diagnostic-exam-page {
  min-height: 100vh;
  background: var(--color-bg);
}

.diagnostic-exam-shell {
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 32px 0 72px;
}

.module-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 24px;
}

.module-header > div > span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.module-header h1 {
  margin: 6px 0 0;
  color: var(--color-ink);
  font-size: var(--text-3xl);
}

.module-progress {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.module-progress li {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.module-progress li b {
  display: grid;
  width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-hover);
}

.module-progress__item--active {
  border-color: var(--color-ink) !important;
  color: var(--color-ink) !important;
}

.module-progress__item--completed b {
  background: var(--color-ink) !important;
  color: var(--color-ink-inverse);
}

.exam-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 24px;
}

.question-nav,
.question-panel {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
}

.question-nav {
  align-self: start;
  display: grid;
  gap: 8px;
  padding: 20px;
}

.question-nav small {
  color: var(--color-ink-muted);
}

.question-nav__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 7px;
  margin: 12px 0;
}

.question-nav__item {
  aspect-ratio: 1;
  border: 1px solid var(--color-line);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-ink-soft);
  cursor: pointer;
}

.question-nav__item--current {
  border-color: var(--color-ink);
  box-shadow: inset 0 0 0 1px var(--color-ink);
}

.question-nav__item--answered {
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}

.question-nav__item--skipped {
  background: var(--color-warning-bg);
}

.question-nav__summary {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.question-nav__complete {
  min-height: 40px;
  margin-top: 8px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.question-panel {
  padding: 28px;
}

.question-panel--locked :deep(.opt-card) {
  pointer-events: none;
  opacity: 0.72;
}

.question-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
}

.question-actions button {
  min-width: 96px;
  min-height: 40px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.diagnostic-status {
  display: grid;
  min-height: 420px;
  place-items: center;
  color: var(--color-ink-muted);
}

@media (max-width: 900px) {
  .module-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .module-progress {
    flex-wrap: wrap;
  }

  .exam-layout {
    grid-template-columns: 1fr;
  }
}
</style>
