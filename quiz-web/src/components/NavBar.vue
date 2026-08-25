<template>
  <header class="navbar">
    <div class="nav-inner">
      <div class="nav-left">
        <router-link to="/" class="logo" @click="handleHomeNavigation">
          <span class="logo-mark" aria-hidden="true">
            <img :src="brandIconUrl" alt="" class="logo-mark-image" />
          </span>
          <span class="logo-text">
            AceMock
          </span>
        </router-link>
        <nav class="nav-links">
          <router-link
            to="/"
            class="nav-link"
            exact-active-class="nav-link--active"
            @click="handleHomeNavigation"
            >首页</router-link
          >
          <router-link
            to="/assessment"
            class="nav-link"
            active-class="nav-link--active"
            @click="handleRouteNavigation($event, '/assessment')"
            >诊断测试</router-link
          >
          <router-link
            to="/question-bank"
            class="nav-link"
            :class="{ 'nav-link--active': isLearningWorkspaceRoute }"
            active-class="nav-link--active"
            @click="handleRouteNavigation($event, '/question-bank')"
            >试题库</router-link
          >
          <router-link
            to="/mock-exams"
            class="nav-link"
            active-class="nav-link--active"
            @click="handleRouteNavigation($event, '/mock-exams')"
            >模考中心</router-link
          >
          <router-link
            :to="mistakeNotebookPath"
            class="nav-link"
            active-class="nav-link--active"
            @click="handleRouteNavigation($event, mistakeNotebookPath)"
            >错题本</router-link
          >
          <el-dropdown
            class="nav-exam-menu"
            trigger="hover"
            placement="bottom-start"
            :show-timeout="80"
            :hide-timeout="180"
            popper-class="exam-intro-dropdown"
            @command="handleExamCommand"
          >
            <button
              class="nav-link nav-exam-trigger"
              :class="{ 'nav-link--active': isExamIntroRoute }"
              type="button"
            >
              考试介绍
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="exam in examMenuItems"
                  :key="exam.type"
                  :command="exam.type"
                  :class="{ 'is-current-exam': currentExamType === exam.type }"
                >
                  {{ exam.label }}
                </el-dropdown-item>
                <!-- 资料下载入口暂时隐藏，恢复时解除本段模板注释。
                <el-dropdown-item
                  command="study-resources"
                  :class="{ 'is-current-exam': route.path.startsWith('/study-resources') }"
                >
                  资料下载
                </el-dropdown-item>
                -->
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </nav>
      </div>

      <div class="nav-right">
        <slot name="actions">
          <template v-if="auth.isLoggedIn && auth.user">
            <el-dropdown
              v-if="props.showExamSwitcher && auth.isAdmin"
              trigger="click"
              placement="bottom-end"
              popper-class="student-exam-dropdown"
              @command="handlePreferredExamTypeCommand"
            >
              <button
                type="button"
                class="exam-preference-chip"
                :aria-label="`当前考试工作区：${preferredExamType}，点击切换`"
              >
                <span class="exam-preference-dot" aria-hidden="true"></span>
                <span>考试工作区：{{ preferredExamType }}</span>
                <el-icon class="exam-preference-caret" aria-hidden="true">
                  <ArrowDown />
                </el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="exam in activeExamOptions"
                    :key="exam.value"
                    :command="exam.value"
                    :class="{ 'is-current-exam': preferredExamType === exam.value }"
                  >
                    {{ exam.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <button
              v-else-if="props.showExamSwitcher"
              type="button"
              class="exam-preference-chip"
              :aria-label="`${studyGoalLabel}，前往个人中心修改备考目标`"
              title="前往个人中心修改备考目标"
              @click="goToStudyGoals"
            >
              <span
                class="exam-preference-dot"
                :class="{ 'exam-preference-dot--empty': !displayedStudyGoalExamType }"
                aria-hidden="true"
              ></span>
              <span>{{ studyGoalLabel }}</span>
              <el-icon class="exam-preference-caret" aria-hidden="true">
                <ArrowRight />
              </el-icon>
            </button>
            <div
              class="user-chip"
              @mouseenter="showDropdown = true"
              @mouseleave="showDropdown = false"
              @click="showDropdown = !showDropdown"
            >
              <div class="user-info">
                <span class="user-name" :title="auth.user.username">
                  {{ auth.user.username }}
                </span>
                <button
                  v-if="hasValidPendingMembershipCard"
                  type="button"
                  class="user-meta user-meta--pending-card"
                  title="前往我的卡包查看免费会员权益"
                  @click.stop="goToPendingMembershipCards"
                >
                  免费会员权益待使用
                </button>
                <span
                  v-else
                  class="user-meta"
                  :class="{ 'user-meta--member': hasActiveMembership }"
                >
                  {{ currentEntitlementLabel }}
                </span>
              </div>
              <div class="user-avatar" :title="auth.user.username">
                <AppAvatar
                  :source="auth.user.avatar"
                  :name="auth.user.username"
                  decorative
                />
              </div>

              <Transition name="dropdown">
                <div v-if="showDropdown" class="user-dropdown" @click.stop>
                  <div class="dropdown-header">
                    <div class="dropdown-user-info">
                      <span class="dropdown-name" :title="auth.user.username">
                        {{ auth.user.username }}
                      </span>
                      <span
                        class="dropdown-role"
                        :class="{ 'dropdown-role--pending': hasValidPendingMembershipCard }"
                      >
                        {{ dropdownAccountDetailLabel }}
                      </span>
                    </div>
                    <div class="dropdown-avatar">
                      <AppAvatar
                        :source="auth.user.avatar"
                        :name="auth.user.username"
                        decorative
                      />
                    </div>
                  </div>
                  <div class="dropdown-menu">
                    <button class="dropdown-item" type="button" @click="goToRoleHome">
                      {{ roleHomeLabel }}
                    </button>
                    <button
                      v-if="auth.isAdmin"
                      class="dropdown-item"
                      type="button"
                      @click="goToProfile"
                    >
                      个人中心
                    </button>
                    <div class="dropdown-divider"></div>
                    <button
                      class="dropdown-item dropdown-item--danger"
                      type="button"
                      @click="handleLogout"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-ghost">登录</router-link>
          </template>
        </slot>
      </div>
    </div>
  </header>
  <MobileNavBar
    :current-exam="mobileCurrentExam"
    :account-meta-label="mobileAccountMetaLabel"
    :account-meta-pending="hasValidPendingMembershipCard"
    :account-meta-highlighted="hasActiveMembership || hasValidPendingMembershipCard"
    @home="handleMobileHomeNavigation"
    @navigate="handleMobileRouteNavigation"
    @logout="handleLogout"
  />
</template>

<script setup lang="ts">
// 全局导航栏：所有前台页面共用，并根据登录状态展示用户入口。
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, ArrowRight } from '@element-plus/icons-vue'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import AppAvatar from '@/components/AppAvatar.vue'
import MobileNavBar from '@/components/MobileNavBar.vue'
import brandIconUrl from '@/assets/brand/acemock-icon.png'

interface NavBarProps {
  delegateNavigation?: boolean
  delegateExamSelection?: boolean
  mistakeExamType?: ActiveExamType | null
  showExamSwitcher?: boolean
}

const props = withDefaults(defineProps<NavBarProps>(), {
  delegateNavigation: false,
  delegateExamSelection: false,
  mistakeExamType: null,
  showExamSwitcher: true,
})

const emit = defineEmits<{
  home: []
  navigate: [path: string]
  'select-exam': [examType: ActiveExamType]
}>()

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const showDropdown = ref(false)
const entitlementClock = ref(Date.now())
let entitlementExpiryTimer: ReturnType<typeof setTimeout> | null = null
const examMenuItems = EXAM_TYPE_OPTIONS.map((item) => ({
  type: item.value.toLowerCase(),
  label: item.label,
}))
const activeExamOptions = EXAM_TYPE_OPTIONS.filter(
  (item): item is (typeof EXAM_TYPE_OPTIONS)[number] & { value: ActiveExamType } =>
    item.value === 'ESAT' || item.value === 'TMUA',
)

// 顶部只展示个人中心已保存的备考目标，固定排序避免接口记录顺序造成文案跳动。
const savedStudyGoalExamTypes = computed<ActiveExamType[]>(() => {
  const savedExamTypes = new Set(
    (auth.memberContext?.studyPreferences.examTypes || []).map((examType) =>
      String(examType || '').toUpperCase(),
    ),
  )
  return (['ESAT', 'TMUA'] as const).filter((examType) => savedExamTypes.has(examType))
})

// 生效会员按考试类型排序，顶部与头像下拉共用同一份权益口径。
const activeMemberExamTypes = computed<ActiveExamType[]>(() =>
  Object.entries(auth.memberContext?.quotas || {})
    .filter(
      ([, quota]) =>
        quota.isMember &&
        (quota.endsAt === null || quota.endsAt > entitlementClock.value),
    )
    .map(([examType]) => examType.toUpperCase())
    .filter((examType): examType is ActiveExamType => examType === 'ESAT' || examType === 'TMUA')
    .sort((left, right) => (left === 'ESAT' ? -1 : right === 'ESAT' ? 1 : 0)),
)

// 唯一会员考试强制优先；双会员或无会员时展示当前实际学习上下文。
const displayedStudyGoalExamType = computed<ActiveExamType | null>(() => {
  if (activeMemberExamTypes.value.length === 1) return activeMemberExamTypes.value[0]!
  if (activeMemberExamTypes.value.includes(auth.activeExamType)) return auth.activeExamType
  if (savedStudyGoalExamTypes.value.includes(auth.activeExamType)) return auth.activeExamType
  return activeMemberExamTypes.value[0] || savedStudyGoalExamTypes.value[0] || null
})

// 顶部只表达当前正在备考的考试，没有权益和目标时给出明确状态。
const studyGoalLabel = computed(() =>
  displayedStudyGoalExamType.value
    ? `当前备考：${displayedStudyGoalExamType.value}`
    : '当前备考：未设置',
)

// 当前存在任一有效考试会员时优先展示会员权益，不再显示待使用卡券入口。
const hasActiveMembership = computed(() => activeMemberExamTypes.value.length > 0)

// 未到期或仍在等待达成领取条件的会员卡都用于召回，提示用户前往卡包查看活动进度。
const validPendingMembershipCards = computed(() =>
  (auth.memberContext?.pendingMembershipCards || []).filter(
    (card) => card.activationDeadline === null || card.activationDeadline > entitlementClock.value,
  ),
)

// 可立即使用的管理员赠送日卡使用严格有效口径，并在下拉文案中优先于活动周卡。
const validPendingDailyCards = computed(() =>
  (auth.memberContext?.pendingDailyCards || []).filter(
    (card) => card.activationDeadline > entitlementClock.value,
  ),
)

// 有效会员优先于待启用卡券，避免已享受权益的用户看到重复召回入口。
const hasValidPendingMembershipCard = computed(
  () =>
    !auth.isAdmin &&
    activeMemberExamTypes.value.length === 0 &&
    validPendingMembershipCards.value.length > 0,
)

// 顶部用户名下方展示当前权益；双考试会员使用紧凑文案避免挤压头像区域。
const currentEntitlementLabel = computed(() => {
  if (auth.isAdmin) return '管理员'
  if (activeMemberExamTypes.value.length > 1) return 'ESAT/TMUA会员'
  if (activeMemberExamTypes.value.length === 1) return `${activeMemberExamTypes.value[0]}会员`
  return '免费用户'
})

// 移动端沿用桌面权益优先级，仅将待使用卡券压缩为更适合窄屏的提示文案。
const mobileAccountMetaLabel = computed(() =>
  hasValidPendingMembershipCard.value ? '有免费权益待使用' : currentEntitlementLabel.value,
)

// 下拉优先召回可直接使用的日卡，其次提示邀请周卡，其他卡种使用通用名称。
const pendingMembershipCardLabel = computed(() => {
  const cards = validPendingMembershipCards.value
  const dailyCardCount = validPendingDailyCards.value.length
  if (dailyCardCount > 0) return `${dailyCardCount}张免费日卡待启用`

  const weeklyCardCount = cards.filter((card) => card.durationHours === 7 * 24).length
  if (weeklyCardCount > 0) return `${weeklyCardCount}张免费周卡待启用`
  return `${cards.length}张免费会员卡待启用`
})

// 下拉第二行补充权益时效，不再重复顶部已经展示的会员类型。
const dropdownAccountDetailLabel = computed(() => {
  if (auth.isAdmin) return '管理员账户'
  if (activeMemberExamTypes.value.length === 0) {
    return hasValidPendingMembershipCard.value
      ? pendingMembershipCardLabel.value
      : '免费账户'
  }

  const preferredMemberExamType = activeMemberExamTypes.value.includes(auth.activeExamType)
    ? auth.activeExamType
    : activeMemberExamTypes.value[0]!
  const endsAt = auth.memberContext?.quotas?.[preferredMemberExamType]?.endsAt
  return endsAt ? formatMembershipDeadline(endsAt) : '会员权益长期有效'
})

// 管理员考试工作区继续跟随当前前端会话，不读取学生备考目标。
const preferredExamType = computed(() => auth.activeExamType)

// 首页委托模式下为错题本携带当前考试，其他页面保持原来的通用入口。
const mistakeNotebookPath = computed(() =>
  props.mistakeExamType
    ? `/mistake-notebook?examType=${encodeURIComponent(props.mistakeExamType)}`
    : '/mistake-notebook',
)

// 根据登录用户身份切换头像菜单的工作台入口。
const roleHomeLabel = computed(() => (auth.user?.role === 'admin' ? '后台管理' : '个人中心'))

// 考试介绍子路由共享同一个导航激活状态。
const isExamIntroRoute = computed(
  () => route.path.startsWith('/exam-intro') || route.path.startsWith('/study-resources'),
)

// 练习本与练习记录属于试题库学习工作区，进入后继续高亮试题库导航。
const isLearningWorkspaceRoute = computed(
  () =>
    route.path.startsWith('/question-bank') ||
    route.path.startsWith('/practice-notebook') ||
    route.path.startsWith('/practice-records'),
)

// 从路由参数派生当前考试类型，用于标记下拉菜单选中项。
const currentExamType = computed(() => String(route.params.examType || '').toLowerCase())

// 移动端错题本与考试介绍优先跟随页面传入的考试，其次使用全局学习上下文。
const mobileCurrentExam = computed(() => props.mistakeExamType || auth.activeExamType)

// 会员到期时间使用紧凑的本地月日与时分，适配头像下拉有限宽度。
function formatMembershipDeadline(timestamp: number): string {
  const deadline = new Date(timestamp)
  const month = String(deadline.getMonth() + 1).padStart(2, '0')
  const day = String(deadline.getDate()).padStart(2, '0')
  const hour = String(deadline.getHours()).padStart(2, '0')
  const minute = String(deadline.getMinutes()).padStart(2, '0')
  return `会员有效期至 ${month}/${day} ${hour}:${minute}`
}

// Element Plus 下拉命令统一切换考试页面，避免手写 hover 浮层产生闪烁。
function handleExamCommand(command: string): void {
  const path = command === 'study-resources' ? '/study-resources' : `/exam-intro/${command}`
  if (props.delegateNavigation) emit('navigate', path)
  else router.push(path)
}

// 管理员保留原有工作区切换能力；首页通过委托事件同步其学习数据视图。
function handlePreferredExamTypeCommand(command: ActiveExamType): void {
  if (props.delegateExamSelection) emit('select-exam', command)
  else auth.setActiveExamType(command)
}

// 首页品牌在委托模式下回到当前首页首屏，其他页面沿用 RouterLink 导航。
function handleHomeNavigation(event: MouseEvent): void {
  if (!props.delegateNavigation) return
  event.preventDefault()
  emit('home')
}

// 首页委托模式只上报业务路径，普通页面仍由 RouterLink 直接导航。
function handleRouteNavigation(event: MouseEvent, path: string): void {
  if (!props.delegateNavigation) return
  event.preventDefault()
  emit('navigate', path)
}

// 首页沿用首屏滚动，其他模块点击移动端品牌或“首页”时返回首页路由。
function handleMobileHomeNavigation(): void {
  if (props.delegateNavigation) emit('home')
  else void router.push('/')
}

// 首页继续承接自身导航逻辑，其他模块由公共导航直接切换路由。
function handleMobileRouteNavigation(path: string): void {
  if (props.delegateNavigation) emit('navigate', path)
  else void router.push(path)
}

// 角色入口统一从头像菜单进入，学生和管理员各回到自己的工作台。
function goToRoleHome(): void {
  showDropdown.value = false
  router.push(auth.user?.role === 'admin' ? '/admin/core-library' : '/profile')
}

// 管理员保留后台入口的同时，可进入普通个人中心检查会员与支付结果。
function goToProfile(): void {
  showDropdown.value = false
  router.push('/profile')
}

// 顶部备考目标是只读摘要，所有修改统一交由个人中心的目标偏好弹窗完成。
function goToStudyGoals(): void {
  void router.push({ path: '/profile', query: { editGoals: '1' } })
}

// 顶部待使用权益按钮直达个人中心卡包，方便用户查看可用卡券或邀请活动进度。
async function goToPendingMembershipCards(): Promise<void> {
  showDropdown.value = false
  await router.push({
    path: '/profile',
    query: { wallet: 'pending' },
    hash: '#member-card-wallet',
  })
  await nextTick()
  document.getElementById('member-card-wallet')?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
}

// 退出后回首页，让需要登录的页面由路由守卫重新拦截。
async function handleLogout(): Promise<void> {
  await auth.logout()
  showDropdown.value = false
  router.push('/')
}

// 导航栏仅为学生预加载个人中心保存的长期备考目标。
async function loadStudentExamPreference(): Promise<void> {
  if (!auth.isLoggedIn || auth.isAdmin || auth.memberContext) return
  try {
    await auth.ensureMemberContext()
  } catch {
    // 获取失败时保留未设置状态，公共请求层负责错误提示。
  }
}

// 仅在最近一次会员或待启用卡到期时刷新展示时钟，使过期权益立即从顶部消失。
function scheduleEntitlementExpiryRefresh(): void {
  if (entitlementExpiryTimer) clearTimeout(entitlementExpiryTimer)
  entitlementExpiryTimer = null
  const now = Date.now()
  entitlementClock.value = now
  const deadlines = [
    ...Object.values(auth.memberContext?.quotas || {})
      .map((quota) => quota.endsAt)
      .filter((deadline): deadline is number => typeof deadline === 'number' && deadline > now),
    ...(auth.memberContext?.pendingMembershipCards || [])
      .map((card) => card.activationDeadline)
      .filter((deadline): deadline is number => typeof deadline === 'number' && deadline > now),
  ]
  if (deadlines.length === 0) return
  const nextDeadline = Math.min(...deadlines)
  const maximumTimeout = 2_147_483_647
  entitlementExpiryTimer = setTimeout(
    scheduleEntitlementExpiryRefresh,
    Math.min(Math.max(nextDeadline - now + 50, 50), maximumTimeout),
  )
}

watch(() => auth.memberContext, scheduleEntitlementExpiryRefresh, { immediate: true })

onMounted(() => void loadStudentExamPreference())

onBeforeUnmount(() => {
  if (entitlementExpiryTimer) clearTimeout(entitlementExpiryTimer)
})
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  min-width: var(--fluid-page-min-width);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.09);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

@media (max-width: 860px) {
  .navbar {
    display: none;
  }
}

/* 前台流体外壳：1200px 起步，窄屏继续收缩到紧凑下限。 */
.nav-inner {
  width: var(--fluid-shell-width);
  height: var(--nav-height);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(20px, 2.08vw, 40px);
}
.nav-left,
.nav-links,
.nav-right,
.user-chip {
  display: flex;
  align-items: center;
}
.nav-left {
  min-width: 0;
  gap: clamp(20px, 1.67vw, 32px);
}
.logo {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  color: var(--color-ink);
  font-weight: var(--weight-bold);
  font-size: 17px;
  letter-spacing: -0.01em;
}
.logo-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  overflow: hidden;
}
.logo-mark-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.45);
}
.logo-text {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  white-space: nowrap;
}
.nav-links {
  min-width: 0;
  gap: clamp(18px, 1.67vw, 32px);
}
.nav-right {
  flex: 0 0 auto;
  gap: 12px;
}
.exam-preference-chip {
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 4px;
  gap: 8px;
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  white-space: nowrap;
  cursor: pointer;
}
.exam-preference-chip:focus-visible {
  outline: 2px solid var(--color-active);
  outline-offset: 4px;
}
.exam-preference-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--color-success);
}
.exam-preference-dot--empty {
  background: var(--color-ink-muted);
}
.exam-preference-caret {
  color: var(--color-ink-muted);
  font-size: 13px;
}
:global(.student-exam-dropdown.el-popper) {
  width: 88px !important;
  min-width: 88px !important;
  box-sizing: border-box;
  padding: 6px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
:global(.student-exam-dropdown .el-dropdown-menu) {
  width: 100%;
  min-width: 0;
  padding: 0;
}
:global(.student-exam-dropdown .el-dropdown-menu__item) {
  min-height: 40px;
  padding: 0 14px;
  justify-content: center;
  text-align: center;
  border-radius: var(--radius-md);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
:global(.student-exam-dropdown .el-dropdown-menu__item:hover),
:global(.student-exam-dropdown .el-dropdown-menu__item:focus),
:global(.student-exam-dropdown .el-dropdown-menu__item.is-current-exam) {
  background: var(--color-hover);
  color: var(--color-ink);
}
.nav-link {
  padding: 8px 4px;
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--color-ink-soft);
  transition: color var(--duration-base) ease;
  position: relative;
  white-space: nowrap;
}
.nav-exam-menu {
  position: relative;
}
.nav-exam-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
}
.nav-exam-trigger:focus,
.nav-exam-trigger:focus-visible {
  outline: none;
  box-shadow: none;
}
:global(.exam-intro-dropdown.el-popper) {
  width: max-content;
  min-width: 0;
  padding: 6px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
:global(.exam-intro-dropdown .el-dropdown-menu) {
  padding: 0;
}
:global(.exam-intro-dropdown .el-dropdown-menu__item) {
  width: max-content;
  min-height: 40px;
  min-width: 76px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
:global(.exam-intro-dropdown .el-dropdown-menu__item:focus),
:global(.exam-intro-dropdown .el-dropdown-menu__item:focus-visible) {
  outline: none;
  box-shadow: none;
}
:global(.exam-intro-dropdown .el-dropdown-menu__item:hover),
:global(.exam-intro-dropdown .el-dropdown-menu__item:focus),
:global(.exam-intro-dropdown .el-dropdown-menu__item.is-current-exam) {
  background: var(--color-hover);
  color: var(--color-ink);
}
.nav-link:hover,
.nav-link--active {
  color: var(--color-ink);
}
.btn-ghost {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--weight-semi);
  transition: all var(--duration-base) ease;
}
.btn-ghost {
  color: var(--color-ink-soft);
  padding: 10px 4px;
}
.btn-ghost:hover {
  color: var(--color-ink);
}
.user-chip {
  position: relative;
  gap: 10px;
  cursor: pointer;
}

/* 连接用户名区域与下拉卡片，避免鼠标经过两者之间的视觉留白时误触发离开。 */
.user-chip::after {
  position: absolute;
  z-index: 0;
  top: 100%;
  right: 0;
  width: 100%;
  height: 13px;
  content: '';
}
.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 0;
  max-width: 120px;
}
.user-name {
  display: block;
  overflow: hidden;
  width: 100%;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  color: var(--color-ink);
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-meta {
  font-size: 12px;
  color: var(--color-ink-muted);
}
.user-meta--member {
  color: var(--color-report-orange);
  font-weight: var(--weight-semi);
}
.user-meta--pending-card {
  max-width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-report-orange);
  font: inherit;
  font-size: 12px;
  font-weight: var(--weight-semi);
  line-height: 1.35;
  white-space: nowrap;
  cursor: pointer;
}
.user-meta--pending-card:hover {
  text-decoration: underline;
}
.user-meta--pending-card:focus-visible {
  border-radius: 2px;
  outline: 2px solid var(--color-report-orange);
  outline-offset: 2px;
}
.user-avatar,
.dropdown-avatar {
  display: grid;
  flex: 0 0 36px;
  place-items: center;
  width: 36px;
  height: 36px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}
.user-dropdown {
  position: absolute;
  z-index: 1;
  right: 0;
  top: 48px;
  width: 240px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.dropdown-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--color-line-soft);
}
.dropdown-user-info {
  flex: 1;
  min-width: 0;
  max-width: 150px;
}
.dropdown-name {
  display: block;
  overflow: hidden;
  width: 100%;
  font-weight: var(--weight-semi);
  color: var(--color-ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dropdown-role {
  display: inline-block;
  margin-top: 2px;
  color: var(--color-ink-muted);
  font-size: 12px;
  font-weight: var(--weight-medium);
  white-space: nowrap;
}
.dropdown-role--pending {
  color: var(--color-report-orange);
  font-weight: var(--weight-semi);
}
.dropdown-menu {
  padding: 10px;
}
.dropdown-item {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  transition: background var(--duration-base) ease;
}
.dropdown-item:hover {
  background: var(--color-hover);
  color: var(--color-ink);
}
.dropdown-item--danger {
  color: var(--color-danger);
}
.dropdown-item--danger:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}
.dropdown-divider {
  height: 1px;
  background: var(--color-line-soft);
  margin: 8px 0;
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--duration-fast) ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
