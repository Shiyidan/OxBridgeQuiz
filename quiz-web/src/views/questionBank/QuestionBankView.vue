<!-- 题库练习页面：管理题量、难度、续答与做题权益，考纲范围来自学习平台公共上下文。 -->
<template>
  <section class="question-bank" aria-label="题库练习">
    <LearningScopeHeader
      :breadcrumbs="selectedBreadcrumb"
      :title="currentScopeCnLabel"
      :title-en="currentScopeEnLabel"
      @select="handleKnowledgeSelect"
      variant="practice"
    />
    <div class="qb-practice" tabindex="-1" aria-label="练习设置">
      <div v-if="activePractice" class="qb-active-practice" role="status">
        <div>
          <strong>你有一份 {{ activePractice.examType }} 练习尚未交卷</strong>
          <span
            >已答 {{ activePractice.answeredCount }}/{{ activePractice.totalQuestions }} 题</span
          >
        </div>
        <AppButton class="qb-secondary" type="secondary" @click="handleContinuePractice"
          >继续练习</AppButton
        >
      </div>

      <div class="qb-difficulty-grid" aria-label="选择练习难度">
        <article
          v-for="diff in difficulties"
          :key="diff.id"
          class="qb-difficulty-card"
          :class="{ 'qb-difficulty-card--target': targetDifficulty === diff.id }"
          :data-theme="diff.id"
        >
          <div class="qb-difficulty-card__visual">
            <span class="qb-difficulty-card__english">{{ diff.englishLabel }}</span>
            <h3 class="qb-difficulty-card__title">{{ diff.label }}难度</h3>
            <AppButton
              class="qb-difficulty-card__cta"
              :aria-label="diff.label + '难度：立即练习'"
              :size="compactViewport ? 'mini' : 'medium'"
              :disabled="
                summaryLoading ||
                diff.count === 0 ||
                Boolean(activePractice) ||
                Boolean(startingDifficultyId)
              "
              :loading="startingDifficultyId === diff.id"
              @click="handleStartPractice(diff)"
            >
              <span v-if="startingDifficultyId === diff.id">正在生成</span>
              <span v-else-if="summaryLoading">加载中</span>
              <span v-else-if="diff.count === 0">暂无题目</span>
              <span v-else>立即练习</span>
            </AppButton>
          </div>
          <div class="qb-difficulty-card__body">
            <span class="qb-difficulty-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m7.5 16.5 9-9M9 7.5h7.5V15" stroke="currentColor" stroke-width="1.8" />
                <path
                  d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
              </svg>
            </span>
            <div>
              <strong>{{ diff.label }}练习</strong>
              <p class="qb-difficulty-card__desc">{{ diff.description }}</p>
            </div>
          </div>
        </article>
      </div>
      <p class="qb-practice-summary" aria-live="polite">
        <template v-if="summaryLoading">正在读取题量…</template>
        <template v-else-if="summaryFailed">题量暂时无法加载，请重试。</template>
        <template v-else-if="!hasPracticeQuestions"
          >当前范围暂无可练习题目，请选择其他考点。</template
        >
        <template v-else
          >每次最多 {{ DIRECT_PRACTICE_QUESTION_COUNT }} 题 · 完成后查看成绩与解析</template
        >
      </p>
      <AppButton
        v-if="summaryFailed"
        class="qb-secondary"
        type="secondary"
        @click="retryQuestionSummary"
        >重新加载</AppButton
      >
    </div>

    <AppDialog
      v-model="selectionDialogVisible"
      title="确认开始练习"
      confirm-text="开始练习"
      cancel-text="取消"
      @confirm="handleConfirmSelectedPractice"
      @cancel="handleCancelSelectedPractice"
    >
      <p>{{ selectionDialogMessage }}</p>
    </AppDialog>

    <DailyCardAccessDialog
      v-model="upgradeDialogVisible"
      :exam-type="paymentExamType"
      upgrade-message="当前练习范围需开通对应考试的做题会员，也可以选择标有免费的知识点练习。"
      @activated="handleDailyCardActivated"
      @upgrade="handleOpenPayment"
      @cancel="handleCancelMembershipAccess"
    />

    <PaymentModal
      :model-value="paymentVisible"
      :default-exam-type="paymentExamType"
      :default-plan-id="paymentPlan"
      @update:model-value="handlePaymentVisibilityChange"
      @paid="handlePaymentSuccess"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppButton from '@/components/AppButton.vue'
import AppDialog from '@/components/AppDialog.vue'
import DailyCardAccessDialog from '@/components/DailyCardAccessDialog.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import LearningScopeHeader from '@/components/knowledge/LearningScopeHeader.vue'
import { useLearningScope } from '@/composables/useLearningScope'
import { useLearningWorkspaceStore } from '@/stores/learningWorkspace'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import type { QuestionDifficulty } from '@/api/questionBank'
import { getQuestionSummaryData } from '@/api/questionBank'
import { getActiveQuestionBankPractice, type ActiveQuestionBankPractice } from '@/api/exam'
import { checkMemberAccess, getMember } from '@/api/member'
import { createLoginRequiredRouteLocation } from '@/utils/authRedirect'
import type { AnnualPlan } from '@/constants/annualMembership'

const auth = useAuthStore()
const workspace = useLearningWorkspaceStore()
const route = useRoute()
const router = useRouter()
const {
  isActive,
  loading: scopeLoading,
  ready,
  selectedCode: selectedNodeCode,
  selectedNode,
  title: currentScopeCnLabel,
  titleEn: currentScopeEnLabel,
  breadcrumbs: selectedBreadcrumb,
  selectKnowledge: handleKnowledgeSelect,
} = useLearningScope('practice')
type DifficultyId = QuestionDifficulty
interface DifficultyOption {
  id: DifficultyId
  label: string
  englishLabel: string
  description: string
  count: number
}
interface PendingDirectPractice {
  code: string
  label: string
  difficulty: DifficultyId
  questionCount: number
  examType: ActiveExamType
}
const DIRECT_PRACTICE_QUESTION_COUNT = 5
const targetDifficulty = ref<DifficultyId | null>(null)
const summaryLoading = ref(true)
const summaryFailed = ref(false)
const activePractice = ref<ActiveQuestionBankPractice | null>(null)
const startingDifficultyId = ref<DifficultyId | null>(null)
const selectionDialogVisible = ref(false)
const selectionDialogMessage = ref('')
const upgradeDialogVisible = ref(false)
const paymentVisible = ref(false)
const paymentExamType = ref<ActiveExamType>(auth.activeExamType)
const paymentPlan = ref<AnnualPlan>('annual_practice')
const pendingDirectPractice = ref<PendingDirectPractice | null>(null)
let summaryLoadSequence = 0
let practiceLoadSequence = 0
let practiceContextVersion = 0
// 练习参数始终绑定导航栏当前考试。
const activeExamType = computed(() => auth.activeExamType)
// 开始确认弹窗沿用考纲提供的双语范围名。
const selectedNodeLabel = computed(() => selectedNode.value?.label || currentScopeCnLabel.value)
const difficulties = ref<DifficultyOption[]>([
  {
    id: 'easy',
    label: '简单',
    englishLabel: 'Easy',
    count: 0,
    description: '适合巩固基础知识，掌握基本公式的直接应用。',
  },
  {
    id: 'medium',
    label: '中等',
    englishLabel: 'Medium',
    count: 0,
    description: '要求多步推导与综合理解，贴近真实考试标准难度。',
  },
  {
    id: 'hard',
    label: '困难',
    englishLabel: 'Hard',
    count: 0,
    description: '包含复杂场景变换与严谨证明，适合冲刺高分段。',
  },
])

// 空题量和读取失败分别呈现，不能将网络失败当作无题。
const hasPracticeQuestions = computed(() => difficulties.value.some((item) => item.count > 0))
// 进行中练习由服务端唯一活动键决定，切换考试类型后重新读取对应会话。
async function loadActivePractice(): Promise<void> {
  if (!isActive.value) return
  const requestSequence = ++practiceLoadSequence
  const requestedExamType = activeExamType.value
  activePractice.value = null
  if (!auth.isLoggedIn) return
  try {
    const practice = await getActiveQuestionBankPractice(requestedExamType)
    if (requestSequence !== practiceLoadSequence || requestedExamType !== activeExamType.value) {
      return
    }
    activePractice.value = practice
  } catch {
    if (requestSequence === practiceLoadSequence) activePractice.value = null
  }
}

// 轻量接口只拉题量和难度分布，避免列表页首次加载全量题目。
async function loadQuestionSummary(): Promise<void> {
  if (!isActive.value) return
  const requestSequence = ++summaryLoadSequence
  const requestedExamType = activeExamType.value
  const requestedNodeCode = selectedNodeCode.value
  resetQuestionSummary()
  summaryFailed.value = false
  summaryLoading.value = Boolean(requestedNodeCode)
  if (!requestedNodeCode) return
  try {
    const data = await getQuestionSummaryData(requestedNodeCode, requestedExamType)
    if (
      requestSequence !== summaryLoadSequence ||
      requestedExamType !== activeExamType.value ||
      requestedNodeCode !== selectedNodeCode.value
    ) {
      return
    }
    if (data.difficultyCount) {
      difficulties.value = difficulties.value.map((d) => ({
        ...d,
        count: data.difficultyCount[d.id] || 0,
      }))
    }
  } catch {
    if (requestSequence === summaryLoadSequence) {
      resetQuestionSummary()
      summaryFailed.value = true
    }
  } finally {
    if (requestSequence === summaryLoadSequence) summaryLoading.value = false
  }
}

// 汇总筛选变化或请求失败时统一清空总数与各难度数量，使练习按钮同步失效。
function resetQuestionSummary(): void {
  difficulties.value = difficulties.value.map((item) => ({ ...item, count: 0 }))
}

// 考纲失败需先恢复共享范围，题量失败则仅重试轻量统计接口。
async function retryQuestionSummary(): Promise<void> {
  if (workspace.syllabusError) await workspace.loadSyllabus(true).catch(() => undefined)
  else await loadQuestionSummary()
}
// 可见任务、考试、范围或账号变化时清理冻结的练习意图，并令旧请求失效。
watch(
  () =>
    [
      isActive.value,
      ready.value,
      scopeLoading.value,
      activeExamType.value,
      selectedNodeCode.value,
      auth.isLoggedIn,
      auth.user?.id,
      workspace.syllabusError,
    ] as const,
  () => {
    practiceContextVersion += 1
    summaryLoadSequence += 1
    practiceLoadSequence += 1
    selectionDialogVisible.value = upgradeDialogVisible.value = paymentVisible.value = false
    pendingDirectPractice.value = null
    startingDifficultyId.value = null
    activePractice.value = null
    resetQuestionSummary()
    summaryFailed.value = workspace.syllabusError
    summaryLoading.value = isActive.value && scopeLoading.value && !workspace.syllabusError
    paymentExamType.value = activeExamType.value
    if (!isActive.value || !ready.value) return
    void loadQuestionSummary()
    void loadActivePractice()
  },
  { immediate: true, flush: 'sync' },
)
// 只有明确带难度的链接才高亮卡片，普通进入始终不预选中等难度。
watch(
  () => [isActive.value, activeExamType.value, route.query.code, route.query.difficulty],
  () => {
    if (!isActive.value) return
    const value = String(route.query.difficulty || '')
    targetDifficulty.value = difficulties.value.some((item) => item.id === value)
      ? (value as DifficultyId)
      : null
  },
  { immediate: true },
)
// 游客开始练习时进入登录，返回后仍保留考点和所选难度。
function requireLoginForPracticeAction(): boolean {
  if (auth.isLoggedIn) return false
  const returnTo = router.resolve({
    path: '/question-bank',
    query: { code: selectedNodeCode.value, mode: 'practice', difficulty: targetDifficulty.value },
  }).fullPath
  void router.push(createLoginRequiredRouteLocation(returnTo))
  return true
}
// 窄屏卡片继续使用公共按钮的紧凑尺寸。
const compactViewport = ref(false)
let compactViewportQuery: MediaQueryList | undefined
// 仅调整按钮大小，不创建第二套练习行为。
function syncCompactViewport(): void {
  compactViewport.value = compactViewportQuery?.matches ?? false
}
onMounted(() => {
  compactViewportQuery = window.matchMedia('(max-width: 860px)')
  syncCompactViewport()
  compactViewportQuery.addEventListener('change', syncCompactViewport)
})
onBeforeUnmount(() => {
  summaryLoadSequence += 1
  practiceLoadSequence += 1
  practiceContextVersion += 1
  compactViewportQuery?.removeEventListener('change', syncCompactViewport)
})
// 移动端仅开放题库与考纲浏览，正式练习统一提示切换到电脑端。
function requireDesktopForQuestionBankPractice(): boolean {
  const isMobileViewport =
    window.matchMedia('(max-width: 780px)').matches || window.screen.width <= 780
  if (!isMobileViewport) return false
  ElMessage.info('试题练习需使用电脑端答题，请在电脑端打开后开始练习。')
  return true
}

// 续答只携带 ExamRecord ID，题目集合和保存进度全部由服务端会话恢复。
function handleContinuePractice(): void {
  if (!activePractice.value) return
  if (requireDesktopForQuestionBankPractice()) return
  void router.push({
    path: '/practice',
    query: { examId: activePractice.value.examRecordId },
  })
}

// 答题页使用点击开始时冻结的范围，确认弹窗期间切换树节点不会改变本次练习归属。
function navigateToPractice(practice: PendingDirectPractice): void {
  if (requireDesktopForQuestionBankPractice()) return
  void router.push({
    path: '/practice',
    query: {
      code: practice.code,
      difficulty: practice.difficulty,
      examType: practice.examType,
    },
  })
}

// 开始按钮先确认知识点和默认五题计划，匹配不足时展示实际可生成题量。
function handleStartPractice(diff: DifficultyOption): void {
  if (summaryLoading.value || startingDifficultyId.value || !diff.count) return
  targetDifficulty.value = diff.id
  if (requireDesktopForQuestionBankPractice()) return
  if (requireLoginForPracticeAction()) return
  if (activePractice.value) {
    ElMessage.info('请先继续并完成当前练习')
    return
  }

  const plannedQuestionCount = Math.min(diff.count, DIRECT_PRACTICE_QUESTION_COUNT)
  pendingDirectPractice.value = {
    code: selectedNodeCode.value,
    label: selectedNodeLabel.value,
    difficulty: diff.id,
    questionCount: plannedQuestionCount,
    examType: activeExamType.value,
  }
  const practiceCountMessage =
    diff.count > plannedQuestionCount
      ? `题库共${diff.count}题，本次随机练习${plannedQuestionCount}题`
      : `本次练习全部${plannedQuestionCount}题`
  selectionDialogMessage.value = `您已选择${pendingDirectPractice.value.label}，${practiceCountMessage}，开始练习？`
  selectionDialogVisible.value = true
}

// 用户确认范围后检查当前考试会员，未解锁时提供日卡和开通入口。
async function handleConfirmSelectedPractice(): Promise<void> {
  // AppDialog 由页面主动关闭；先退出范围确认，再承接会员提示。
  selectionDialogVisible.value = false
  if (requireDesktopForQuestionBankPractice()) {
    pendingDirectPractice.value = null
    return
  }
  if (requireLoginForPracticeAction()) return
  const pending = pendingDirectPractice.value
  if (!pending) return
  startingDifficultyId.value = pending.difficulty
  const request = practiceContextVersion
  try {
    const access = await checkMemberAccess({
      action: 'question-bank',
      examType: pending.examType,
      questionCount: pending.questionCount,
      code: pending.code,
    })
    if (
      request !== practiceContextVersion ||
      !isActive.value ||
      pendingDirectPractice.value !== pending
    )
      return
    if (access.allowed) {
      pendingDirectPractice.value = null
      navigateToPractice(pending)
      return
    }

    paymentExamType.value = pending.examType
    upgradeDialogVisible.value = true
  } catch {
    // 公共请求层已统一展示网络或服务端错误，此处只阻止按钮事件产生未处理异常。
  } finally {
    if (request === practiceContextVersion) startingDifficultyId.value = null
  }
}

// 取消首次确认时清理冻结的知识点和难度计划。
function handleCancelSelectedPractice(): void {
  pendingDirectPractice.value = null
}

// 免费日卡启用后继续使用此前冻结的练习参数，并重新由服务端校验会员权益。
async function handleDailyCardActivated(): Promise<void> {
  await handleConfirmSelectedPractice()
}

// 关闭权益拦截时清理此前冻结的练习参数，避免下次误续接旧操作。
function handleCancelMembershipAccess(): void {
  pendingDirectPractice.value = null
}

// 没有可用日卡或用户主动升级时再进入支付，并结束当前免费练习尝试。
function handleOpenPayment(): void {
  paymentPlan.value = 'annual_practice'
  upgradeDialogVisible.value = false
  paymentVisible.value = true
}

// 未完成购买便关闭收银台时结束此前冻结的练习意图。
function handlePaymentVisibilityChange(visible: boolean): void {
  paymentVisible.value = visible
  if (!visible) pendingDirectPractice.value = null
}

// 支付完成后刷新当前考试会员资格，当前页面无需重新登录即可继续练习。
async function handlePaymentSuccess(): Promise<void> {
  paymentVisible.value = false
  const userId = auth.user?.id
  const exam = activeExamType.value
  try {
    const context = await getMember()
    if (auth.user?.id !== userId || activeExamType.value !== exam) return
    auth.setMemberContext(context)
    await workspace.loadPersonal()
    if (!isActive.value || auth.user?.id !== userId || activeExamType.value !== exam) return
    if (pendingDirectPractice.value) {
      await handleConfirmSelectedPractice()
    } else {
      await Promise.all([loadQuestionSummary(), loadActivePractice()])
    }
  } catch {
    // 支付组件已确认成功，公共请求层负责提示权益刷新失败。
  }
}
</script>

<style scoped>
.question-bank {
  min-width: 0;
  min-height: calc(100vh - var(--nav-height));
  padding-bottom: 40px;
  color: var(--color-ink);
}
.qb-practice {
  min-width: 0;
  outline: none;
  scroll-margin-top: calc(var(--nav-height) + 20px);
}
/* 做题模式沿用原试题库三色难度卡片，每张卡片独立发起该难度的练习。 */
.qb-difficulty-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  scroll-margin-top: calc(var(--nav-height) + 24px);
}

.qb-difficulty-card {
  --difficulty-accent: #3483f7;
  --difficulty-accent-dark: #2368d1;
  --difficulty-gradient-start: #86b8ff;
  --difficulty-gradient-end: #e9f3ff;
  --difficulty-glow: rgb(255 255 255 / 68%);

  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: 10px;
  background: var(--color-surface);
  box-shadow: 0 10px 26px rgb(15 23 42 / 7%);
  transition:
    border-color var(--duration-base) ease,
    box-shadow var(--duration-base) ease,
    transform var(--duration-base) ease;
}

.qb-difficulty-card[data-theme='medium'] {
  --difficulty-accent: #7068eb;
  --difficulty-accent-dark: #5148cb;
  --difficulty-gradient-start: #b2abff;
  --difficulty-gradient-end: #eeedff;
  --difficulty-glow: rgb(255 255 255 / 62%);
}

.qb-difficulty-card[data-theme='hard'] {
  --difficulty-accent: #e25f62;
  --difficulty-accent-dark: #c34449;
  --difficulty-gradient-start: #f1a09e;
  --difficulty-gradient-end: #fff0eb;
  --difficulty-glow: rgb(255 255 255 / 60%);
}

.qb-difficulty-card:hover {
  border-color: color-mix(in srgb, var(--difficulty-accent) 48%, var(--color-line));
  box-shadow: 0 16px 34px rgb(15 23 42 / 12%);
  transform: translateY(-3px);
}

.qb-difficulty-card--target {
  border-color: var(--difficulty-accent);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--difficulty-accent) 24%, transparent),
    0 14px 32px rgb(15 23 42 / 11%);
}

.qb-difficulty-card__visual {
  position: relative;
  min-height: 178px;
  padding: 24px 22px;
  overflow: hidden;
  background:
    radial-gradient(circle at 84% 25%, var(--difficulty-glow) 0 12%, transparent 36%),
    linear-gradient(118deg, var(--difficulty-gradient-start), var(--difficulty-gradient-end));
  isolation: isolate;
}

.qb-difficulty-card__visual::before,
.qb-difficulty-card__visual::after {
  position: absolute;
  z-index: -1;
  border: 1px solid rgb(255 255 255 / 46%);
  border-radius: 28px;
  background: rgb(255 255 255 / 14%);
  content: '';
  transform: rotate(24deg);
}

.qb-difficulty-card__visual::before {
  width: 128px;
  height: 128px;
  top: -56px;
  right: -36px;
}

.qb-difficulty-card__visual::after {
  width: 80px;
  height: 80px;
  right: 34px;
  bottom: -52px;
}

.qb-difficulty-card__english {
  display: block;
  margin-bottom: 7px;
  color: color-mix(in srgb, var(--difficulty-accent-dark) 76%, var(--color-ink));
  font-size: 11px;
  font-weight: var(--weight-bold);
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.qb-difficulty-card__title {
  margin: 0;
  color: #fff;
  font-size: clamp(25px, 2.2vw, 34px);
  font-weight: var(--weight-bold);
  letter-spacing: 0.02em;
  line-height: 1.2;
  text-shadow: 0 2px 5px rgb(41 68 120 / 28%);
}

.qb-difficulty-card__body {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 12px;
  min-height: 128px;
  padding: 22px;
  background: var(--color-surface);
}

.qb-difficulty-card__icon {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 7px;
  background: var(--difficulty-accent);
  color: #fff;
}

.qb-difficulty-card__icon svg {
  width: 18px;
  height: 18px;
}

.qb-difficulty-card__body strong {
  display: block;
  margin: 3px 0 7px;
  color: var(--color-ink);
  font-size: var(--text-base);
}

.qb-difficulty-card__desc {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

/* 难度入口沿用卡片主题色，按钮尺寸、加载和禁用交互仍由 AppButton 提供。 */
.qb-difficulty-card__cta.app-button.el-button {
  --app-button-bg: var(--difficulty-accent);
  --app-button-border: var(--difficulty-accent);
  --app-button-hover-bg: var(--difficulty-accent-dark);
  --app-button-hover-border: var(--difficulty-accent-dark);
  --app-button-active-bg: var(--difficulty-accent-dark);
  --app-button-active-border: var(--difficulty-accent-dark);
}

.qb-difficulty-card__cta {
  position: absolute;
  right: 18px;
  bottom: 18px;
}
@media (max-width: 860px) {
  .qb-difficulty-card__cta {
    position: static;
  }
  .qb-difficulty-card__visual {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .qb-difficulty-grid {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  }
}

.qb-practice-summary {
  margin: 22px 0 0;
  color: var(--color-ink-muted);
  font-size: 14px;
  line-height: 1.6;
}
.qb-practice-summary + .app-button {
  margin-top: 12px;
}
.qb-primary.app-button.el-button {
  --app-button-bg: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue);
  --app-button-hover-bg: #1945ab;
  --app-button-hover-border: #1945ab;
  --app-button-active-bg: #173e99;
  --app-button-active-border: #173e99;
}
.qb-secondary.app-button.el-button {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-learning-blue);
  --app-button-border: var(--color-learning-blue-line);
  --app-button-hover-bg: var(--color-learning-blue-soft);
  --app-button-hover-border: var(--color-learning-blue);
  --app-button-active-bg: var(--color-learning-blue-soft);
  --app-button-active-border: var(--color-learning-blue);
}
.qb-active-practice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 5px;
  background: var(--color-learning-blue-soft);
}
.qb-active-practice > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}
.qb-active-practice span {
  color: var(--color-ink-soft);
  font-size: 13px;
}
</style>
