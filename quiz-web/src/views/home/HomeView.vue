<!-- 官网首页容器：登录态首屏承接真实学习状态，后续产品叙事由访客与学生共同复用。 -->
<template>
  <div class="home-shell">
    <!--
      THESIS: 以可追溯的真题诊断为起点，让学生先看清水平，再进入有依据的训练。
      OWN-WORLD: 编辑式大标题、编号叙事、数据台账和深色报告面板共同构成产品世界。
      STORY: 访客沿产品证据完成理解与转化；登录学生沿当前目标和真实待办继续学习。
      FIRST VIEWPORT: 固定页头下优先呈现一句主张、一个主任务，以及足够解释行动原因的上下文。
      FORM: 严格采用参考 HTML 的纵向分屏与克制工程感，交互状态以 PRD 和真实接口为准。
    -->
    <NavBar
      ref="navBarRef"
      :delegate-navigation="true"
      :delegate-exam-selection="true"
      :mistake-exam-type="currentExam"
      :no-goal="state === 'no-goal'"
      @home="scrollToHome"
      @navigate="handleNavigation"
      @select-exam="handleExamSelection"
    />

    <main class="home-main" aria-label="AceMock 首页内容">
      <StudentHome
        v-if="auth.isLoggedIn"
        :loading="loading"
        :error="error"
        :username="auth.user?.username || '同学'"
        :current-exam="currentExam"
        :current-goal="currentGoal"
        :state="state"
        :paper="paper"
        :progress="progress"
        :completed-attempt-count="completedAttemptCount"
        :trend-scores="trendScores"
        :mistake-total="mistakeTotal"
        :practice="practice"
        :report-signal="reportSignal"
        @navigate="handleNavigation"
        @select-exam="handleExamSelection"
        @retry="reload"
        @manage-goals="handleNavigation('/profile')"
      />

      <MarketingHome
        :include-hero="!auth.isLoggedIn"
        :authenticated="auth.isLoggedIn"
        :member-price-label="marketingPriceLabel"
        @register="(targetPath) => openAuthPage('register', targetPath)"
        @login="(targetPath) => openAuthPage('login', targetPath)"
        @navigate="handleNavigation"
        @open-payment="openPayment"
        @scroll-top="scrollToHome"
      />
    </main>

    <HomeGoalDialog
      v-model="goalDialogOpen"
      :exam-type="pendingGoalExam"
      :saving="goalSaving"
      @save="saveGoal"
    />
    <PaymentModal
      v-if="auth.isLoggedIn"
      v-model="paymentOpen"
      :default-exam-type="currentExam || auth.activeExamType"
      @paid="handlePaymentPaid"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import { getMember, updateExamPreferences, type ExamPreference } from '@/api/member'
import { getPaymentConfig } from '@/api/payment'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import HomeGoalDialog from './HomeGoalDialog.vue'
import MarketingHome from './MarketingHome.vue'
import StudentHome from './StudentHome.vue'
import { useHomeDashboard } from './useHomeDashboard'

type AuthPage = 'login' | 'register'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const navBarRef = ref<InstanceType<typeof NavBar> | null>(null)
const paymentOpen = ref(false)
const goalDialogOpen = ref(false)
const goalSaving = ref(false)
const pendingGoalExam = ref<ActiveExamType | null>(null)
const pendingNavigationPath = ref<string | null>(null)
const marketingPriceLabel = ref('¥79/月')

const {
  currentExam,
  goals,
  currentGoal,
  state,
  paper,
  progress,
  completedAttemptCount,
  trendScores,
  mistakeTotal,
  practice,
  reportSignal,
  loading,
  error,
  reload,
} = useHomeDashboard()

// 每位用户独立记录首页最后查看的考试，服务端目标仍是允许恢复的唯一范围。
function getRememberedExamKey(): string | null {
  return auth.user?.id ? `quiz-home-active-exam:${auth.user.id}` : null
}

// 当前考试只持久化为首页浏览偏好，不改写个人中心的报考目标。
function rememberExam(examType: ActiveExamType): void {
  const key = getRememberedExamKey()
  if (key) window.localStorage.setItem(key, examType)
}

// 登录或注册入口携带站内回跳地址，保证营销页主行动能够继续原任务。
function openAuthPage(page: AuthPage, targetPath: string): void {
  void router.push({ name: page, query: { redirect: targetPath || '/' } })
}

// 受保护入口在访客态进入登录流程，公开入口和登录态入口直接导航。
function handleNavigation(path: string): void {
  const protectedPrefixes = [
    '/assessment',
    '/question-bank',
    '/practice',
    '/mistake-notebook',
    '/exam-result',
    '/profile',
  ]
  if (!auth.isLoggedIn && protectedPrefixes.some((prefix) => path.startsWith(prefix))) {
    openAuthPage('login', path)
    return
  }
  if (
    auth.isLoggedIn &&
    state.value === 'no-goal' &&
    protectedPrefixes.slice(0, 4).some((prefix) => path.startsWith(prefix))
  ) {
    pendingNavigationPath.value = path
    scrollToHome()
    ElMessage.info('请先选择 ESAT 或 TMUA 备考目标，保存后将继续进入刚才的功能。')
    void nextTick(() => navBarRef.value?.openExamMenu())
    return
  }
  void router.push(path)
}

// 品牌与首页导航统一回到当前形态的第一屏，而不是重新加载页面。
function scrollToHome(): void {
  const firstScreen = document.querySelector<HTMLElement>(
    auth.isLoggedIn ? '#home-overview' : '#home-marketing-hero',
  )
  firstScreen?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 管理员直接切换考试工作上下文；学生首次选择时仍需完成必要科目配置。
function handleExamSelection(examType: ActiveExamType): void {
  if (auth.isAdmin) {
    if (auth.activeExamType !== examType) auth.setActiveExamType(examType)
    rememberExam(examType)
    return
  }
  const existingGoal = goals.value.find((goal) => goal.examType === examType)
  if (!existingGoal) {
    pendingGoalExam.value = examType
    goalDialogOpen.value = true
    return
  }
  if (auth.activeExamType === examType) return
  auth.setActiveExamType(examType)
  rememberExam(examType)
}

// 目标保存复用会员偏好接口，并保留另一考试已有的全部用户配置。
async function saveGoal(value: { examType: ActiveExamType; subjects: string[] }): Promise<void> {
  if (goalSaving.value) return
  goalSaving.value = true
  try {
    const existingPreferences = auth.memberContext?.examPreferences || []
    const nextPreference: ExamPreference = {
      examType: value.examType,
      subjects: value.subjects,
    }
    const nextPreferences = existingPreferences.some(
      (preference) => String(preference.examType).toUpperCase() === value.examType,
    )
      ? existingPreferences.map((preference) =>
          String(preference.examType).toUpperCase() === value.examType
            ? { ...preference, subjects: value.subjects }
            : preference,
        )
      : [...existingPreferences, nextPreference]

    await updateExamPreferences(nextPreferences)
    const context = await getMember()
    auth.setMemberContext(context)
    const examChanged = auth.activeExamType !== value.examType
    auth.setActiveExamType(value.examType)
    rememberExam(value.examType)
    goalDialogOpen.value = false
    pendingGoalExam.value = null
    if (!examChanged) await reload()
    ElMessage.success('备考目标已保存')
    const destination = pendingNavigationPath.value
    pendingNavigationPath.value = null
    if (destination) await router.push(destination)
  } catch {
    // 公共请求层负责展示服务端业务错误，弹窗保留当前选择供用户重试。
  } finally {
    goalSaving.value = false
  }
}

// 访客购买先完成认证，登录返回首页后再打开正式支付流程。
function openPayment(): void {
  if (!auth.isLoggedIn) {
    openAuthPage('login', '/?purchase=1')
    return
  }
  paymentOpen.value = true
}

// 支付完成后刷新会员上下文和首页数据，使页头及行动区立即反映真实权益。
async function handlePaymentPaid(): Promise<void> {
  paymentOpen.value = false
  try {
    const context = await getMember()
    auth.setMemberContext(context)
    await reload()
  } catch {
    // 支付组件已经确认成功；上下文刷新失败时由后续页面请求自动恢复。
  }
}

// 营销价格读取公开支付配置；读取失败时保留默认展示价格，不阻断登录与支付入口。
async function loadMarketingPrice(): Promise<void> {
  try {
    const config = await getPaymentConfig()
    marketingPriceLabel.value = `¥${(config.monthlyPriceCents / 100).toFixed(0)}/月`
  } catch {
    // 默认价格只用于营销展示，最终金额和服务可用性由支付弹窗的实时接口确认。
  }
}

// 登录回跳中的购买意图只消费一次，避免刷新其他首页状态时反复弹出。
async function consumePurchaseIntent(): Promise<void> {
  if (!auth.isLoggedIn || route.query.purchase !== '1') return
  paymentOpen.value = true
  const nextQuery = { ...route.query }
  delete nextQuery.purchase
  await router.replace({ path: route.path, query: nextQuery })
}

// 真实目标加载后才恢复最后查看项，且缓存值必须仍属于服务端目标集合。
watch(
  goals,
  (availableGoals) => {
    const key = getRememberedExamKey()
    const remembered = key ? window.localStorage.getItem(key) : null
    if (
      (remembered === 'ESAT' || remembered === 'TMUA') &&
      (auth.isAdmin || availableGoals.some((goal) => goal.examType === remembered)) &&
      auth.activeExamType !== remembered
    ) {
      auth.setActiveExamType(remembered)
      return
    }
    if (
      !auth.isAdmin &&
      availableGoals.length &&
      !availableGoals.some((goal) => goal.examType === auth.activeExamType)
    ) {
      const fallbackExam = availableGoals[0]!.examType
      auth.setActiveExamType(fallbackExam)
      rememberExam(fallbackExam)
    }
  },
  { immediate: true },
)

// 认证状态恢复或登录回跳完成后再处理支付意图。
watch(
  () => [auth.isLoggedIn, route.query.purchase] as const,
  () => {
    void consumePurchaseIntent()
  },
)

// 用户主动关闭目标弹窗时取消此前暂存的功能跳转，避免下次选择被旧意图劫持。
watch(goalDialogOpen, (visible, previousVisible) => {
  if (!visible && previousVisible && !goalSaving.value) {
    pendingGoalExam.value = null
    pendingNavigationPath.value = null
  }
})

// 首页专用 body 标记只在本路由存在，用于解除旧版全站最小宽度并启用响应式布局。
onMounted(() => {
  document.body.classList.add('home-route')
  void loadMarketingPrice()
  void consumePurchaseIntent()
})

// 离开首页时清理全局样式标记，避免影响后台及考试页面。
onBeforeUnmount(() => {
  document.body.classList.remove('home-route')
})
</script>

<style src="./home.css"></style>
