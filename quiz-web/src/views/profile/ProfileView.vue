<template>
  <div class="profile-page">
    <NavBar />

    <main class="profile-shell">
      <header class="page-heading">
        <div>
          <h1>个人中心 (User Center)</h1>
          <p>管理您的学习进度、个人信息和目标设定。</p>
        </div>
      </header>

      <div class="profile-grid">
        <aside class="student-card">
          <div class="avatar-frame">
            <img v-if="auth.user?.avatar" :src="auth.user.avatar" :alt="`${displayName}头像`" />
            <span v-else>{{ userInitial }}</span>
          </div>
          <div class="student-name-row">
            <strong>{{ displayName }}</strong>
            <div class="membership-tags">
              <el-tag
                v-for="tag in membershipTags"
                :key="tag"
                :type="hasActiveMembership ? 'success' : 'info'"
                effect="light"
                round
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <button class="logout-link" type="button" @click="handleLogout">退出登录</button>
        </aside>

        <section v-if="hasActiveMembership" class="member-dashboard">
          <div class="exam-tabs" role="tablist" aria-label="考试类型">
            <button
              v-for="examType in examTabs"
              :key="examType"
              :class="{ active: currentExamType === examType }"
              type="button"
              role="tab"
              @click="currentExamType = examType"
            >
              {{ examType }}
            </button>
          </div>

          <div v-if="isCurrentExamActive" class="metric-panel">
            <article class="metric-item">
              <span>预估分数</span>
              <strong>{{ estimatedScoreText }}<small v-if="estimatedScoreText !== '--'">/9.0</small></strong>
            </article>
            <article class="metric-item">
              <span>累计做题</span>
              <strong>{{ answeredQuestionText }}<small v-if="answeredQuestionText !== '--'">道</small></strong>
            </article>
            <article class="metric-item">
              <span>累计考试</span>
              <strong>{{ diagnosticExamText }}<small v-if="diagnosticExamText !== '--'">场</small></strong>
            </article>
          </div>

          <div v-else class="member-upgrade-panel">
            <h2>开通 {{ currentExamType }} 会员</h2>
            <p>解锁 {{ currentExamType }} 历年真题、海量练习题、预估分分析与模拟考试权益。</p>
            <button type="button" class="button_primary" @click="handleUpgradeClick">升级会员</button>
          </div>
        </section>

        <section v-else class="free-upgrade-panel">
          <span class="status-pill">诊断测试已完成</span>
          <h2>首次诊断测试分数：{{ estimatedScoreText }}<small v-if="estimatedScoreText !== '--'"> / 9.0</small></h2>
          <p>升级 Pro 会员，解锁历次测试综合分析、海量真题练习册与智能错题本系统。</p>
          <button type="button" class="button_cancel">升级 Pro 会员</button>
        </section>
      </div>

      <section class="form-panel">
        <div class="section-title">
          <h2>基础信息</h2>
          <div class="section-actions">
            <button v-if="!profileEditing" type="button" class="button_cancel" @click="startEditProfile">编辑</button>
            <template v-else>
              <button type="button" class="text-button button_cancel" @click="cancelEditProfile">取消</button>
              <button
                type="button"
                class="primary-button button_primary"
                :disabled="profileSaving"
                @click="saveProfile"
              >
                {{ profileSaving ? '保存中...' : '保存' }}
              </button>
            </template>
          </div>
        </div>

        <div class="readonly-form readonly-form--profile">
          <label>
            <span>用户名称</span>
            <el-input
              v-model="profileForm.name"
              :disabled="!profileEditing || profileSaving"
              placeholder="请输入用户名"
            />
          </label>
          <label>
            <span>电子邮箱</span>
            <el-input
              v-model="profileForm.email"
              :disabled="!profileEditing || profileSaving"
              placeholder="请输入邮箱"
            />
          </label>
          <label>
            <span>用户密码</span>
            <el-input model-value="************" disabled />
          </label>
        </div>
      </section>

      <section class="form-panel">
        <div class="section-title">
          <h2>报考目标</h2>
          <div class="section-actions">
            <button v-if="!examEditing" type="button" class="button_cancel" @click="startEditExam">编辑</button>
            <template v-else>
              <button type="button" class="text-button button_cancel" @click="cancelEditExam">取消</button>
              <button type="button" class="primary-button button_primary" :disabled="examSaving" @click="saveExam">
                {{ examSaving ? '保存中...' : '保存' }}
              </button>
            </template>
          </div>
        </div>

        <!-- 编辑模式 -->
        <div v-if="examEditing" class="exam-edit-mode">
          <div class="form-field">
            <label class="form-label">备考类型（可多选）</label>
            <div class="exam-type-group">
              <label
                v-for="et in examTypes"
                :key="et.value"
                class="exam-type-chip"
                :class="{ 'exam-type-chip--active': editExamTypes.includes(et.value) }"
              >
                <input type="checkbox" :value="et.value" :checked="editExamTypes.includes(et.value)" class="sr-only" @change="toggleEditExamType(et.value)" />
                {{ et.label }}
              </label>
            </div>
          </div>
          <div v-if="editExamTypes.length" class="form-field">
            <label class="form-label">备考科目</label>
            <div v-for="et in editExamTypes" :key="et" class="subject-group">
              <span class="subject-exam-label">{{ examTypeLabel(et) }}{{ et === 'ESAT' ? '（最多选 3 科）' : '' }}</span>
              <div class="subject-chip-group">
                <label
                  v-for="sub in examSubjects[et]"
                  :key="sub"
                  class="subject-chip"
                  :class="{
                    'subject-chip--active': editSubjects[et]?.includes(sub),
                    'subject-chip--required': isExamSubjectRequired(et, sub),
                  }"
                >
                  <input type="checkbox" :value="sub" :checked="editSubjects[et]?.includes(sub)" :disabled="isEditSubjectDisabled(et, sub)" class="sr-only" @change="toggleEditSubject(et, sub)" />
                  {{ sub }}
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 查看模式 -->
        <div v-else class="readonly-form readonly-form--two">
          <label v-for="pref in examPreferences" :key="pref.examType">
            <span>{{ pref.examType }}</span>
            <input :value="pref.subjects.join('、') || '未选择'" readonly />
          </label>
          <label v-if="!examPreferences.length">
            <span>备考偏好</span>
            <input value="未设置" readonly />
          </label>
        </div>
      </section>

      <section v-if="hasActiveMembership" class="subscription-panel">
        <div class="section-title">
          <h2>订阅中心</h2>
        </div>

        <div class="subscription-summary">
          <article>
            <span>当前套餐</span>
            <strong>{{ currentPlanName }}</strong>
            <small>{{ activeSubscriptionCount > 0 ? '进行中' : '暂无有效订阅' }}</small>
          </article>
          <article>
            <span>累计订阅</span>
            <strong>{{ subscriptionRecords.length }}次</strong>
            <small>订阅次数</small>
          </article>
          <article>
            <span>总消费</span>
            <strong>¥{{ totalSpend }}</strong>
            <small>累计金额</small>
          </article>
        </div>

        <div class="record-toolbar">
          <div class="record-tabs" role="tablist" aria-label="订阅记录筛选">
            <button
              v-for="filter in subscriptionFilters"
              :key="filter.value"
              :class="{ active: subscriptionFilter === filter.value }"
              type="button"
              @click="subscriptionFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>
          <button class="sort-button button_cancel" type="button">按时间排序（近→远）</button>
        </div>

        <div class="subscription-list">
          <article
            v-for="record in filteredSubscriptionRecords"
            :key="record.id"
            class="subscription-record"
          >
            <div class="record-main">
              <h3>{{ record.title }}</h3>
              <p>订阅周期: {{ record.period }}</p>
              <div class="payment-meta">
                <span>
                  支付金额
                  <strong>¥{{ record.amount }}</strong>
                </span>
                <span>
                  支付方式
                  <strong>{{ paymentMethodText(record.paymentMethod) }}</strong>
                </span>
              </div>
            </div>

            <div class="record-side">
              <span class="record-status" :class="`record-status--${record.status}`">
                {{ statusText(record.status) }}
              </span>
              <button
                v-if="record.status === 'active'"
                class="record-button button_primary"
                type="button"
              >
                续费
              </button>
              <button
                v-else
                class="record-button button_cancel"
                type="button"
              >
                重新订阅
              </button>
            </div>
          </article>
        </div>
      </section>

      <p v-if="errorText" class="load-warning">{{ errorText }}</p>
    </main>
  </div>
</template>

<script setup lang="ts">
// 学生个人中心：展示会员权益、学习统计、基础信息和订阅记录。
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import { getMember, updateExamPreferences, type MemberSubscription, type ExamPreference } from '@/api/member'
import { getProfileExamStats, type ProfileExamStats } from '@/api/exam'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_EXAM_TYPE, EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'

type SubscriptionFilter = 'all' | 'active' | 'expired' | 'cancelled'
type PaymentMethod = 'wechat' | 'alipay' | 'manual'

interface SubscriptionRecord {
  id: string
  title: string
  period: string
  amount: number
  paymentMethod: PaymentMethod
  status: SubscriptionFilter
}

const router = useRouter()
const auth = useAuthStore()
const errorText = ref('')
const profileStats = ref<Record<string, ProfileExamStats>>({})
const currentExamType = ref(DEFAULT_EXAM_TYPE)
const subscriptionFilter = ref<SubscriptionFilter>('all')
const profileEditing = ref(false)
const profileSaving = ref(false)
const profileForm = reactive({
  name: '',
  email: '',
})

// 报考目标编辑
const examEditing = ref(false)
const examSaving = ref(false)
const editExamTypes = ref<string[]>([])
const editSubjects = ref<Record<string, string[]>>({})

const examTypes = [
  { value: 'ESAT', label: 'ESAT' },
  { value: 'TMUA', label: 'TMUA' },
  { value: 'STEP', label: 'STEP' },
] as const

const examSubjects: Record<string, string[]> = {
  ESAT: ['数学1', '数学2', '物理', '化学', '生物'],
  TMUA: ['数学'],
  STEP: ['数学'],
}

const examRequiredSubjects: Record<string, string[]> = {
  ESAT: ['数学1'],
  TMUA: ['数学'],
  STEP: ['数学'],
}

const ESAT_MAX_SUBJECTS = 3

function examTypeLabel(value: string): string {
  return examTypes.find((e) => e.value === value)?.label || value
}

function isExamSubjectRequired(examType: string, subject: string): boolean {
  return (examRequiredSubjects[examType] || []).includes(subject)
}

function isEditSubjectDisabled(examType: string, subject: string): boolean {
  if (isExamSubjectRequired(examType, subject)) return true
  if (examType === 'ESAT') {
    const current = editSubjects.value['ESAT'] || []
    return current.length >= ESAT_MAX_SUBJECTS && !current.includes(subject)
  }
  return false
}

function toggleEditExamType(value: string): void {
  const idx = editExamTypes.value.indexOf(value)
  if (idx >= 0) {
    editExamTypes.value.splice(idx, 1)
    delete editSubjects.value[value]
  } else {
    editExamTypes.value.push(value)
    editSubjects.value[value] = [...(examRequiredSubjects[value] || [])]
  }
}

function toggleEditSubject(examType: string, subject: string): void {
  if (isEditSubjectDisabled(examType, subject)) return
  const subs = editSubjects.value[examType] || []
  const idx = subs.indexOf(subject)
  if (idx >= 0) subs.splice(idx, 1)
  else subs.push(subject)
  editSubjects.value[examType] = subs
}

function startEditExam(): void {
  const prefs = auth.memberContext?.examPreferences || []
  editExamTypes.value = prefs.map((p) => p.examType)
  editSubjects.value = {}
  for (const p of prefs) {
    editSubjects.value[p.examType] = [...p.subjects]
  }
  examEditing.value = true
}

function cancelEditExam(): void {
  examEditing.value = false
}

async function saveExam(): Promise<void> {
  examSaving.value = true
  try {
    const prefs: ExamPreference[] = editExamTypes.value.map((et) => ({
      examType: et,
      subjects: editSubjects.value[et] || [],
    }))
    await updateExamPreferences(prefs)
    // 刷新 memberContext 以同步界面
    const ctx = await getMember()
    auth.setMemberContext(ctx)
    examEditing.value = false
    ElMessage.success('报考目标已更新')
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.errMsg || err?.message || '更新失败')
  } finally {
    examSaving.value = false
  }
}

const subscriptionFilters: { label: string; value: SubscriptionFilter }[] = [
  { label: '全部记录', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已过期', value: 'expired' },
  { label: '已取消', value: 'cancelled' },
]

const displayName = computed(() => auth.user?.name || '同学')
const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())
const activeMemberships = computed(() =>
  (auth.memberContext?.memberships || []).filter((item) => item.status === 'active'),
)
const hasActiveMembership = computed(() => activeMemberships.value.length > 0 || auth.isPaid)
const examPreferences = computed(() => auth.memberContext?.examPreferences || [])
const examTabs = EXAM_TYPE_OPTIONS.map((item) => item.value)
const membershipTags = computed(() => {
  if (!activeMemberships.value.length) return ['免费版']
  return activeMemberships.value.map((item) => `${item.examType} ${planName(item.plan)}`)
})
// 未开通的考试类型保留 tab 入口，但统计值按产品要求隐藏为占位符。
const isCurrentExamActive = computed(() =>
  activeMemberships.value.some((item) => normalizeExamType(item.examType) === currentExamType.value),
)
// 后端按考试类型返回统计，前端兜底可避免接口缺项导致模板分支复杂化。
const currentExamStats = computed<ProfileExamStats>(() => (
  profileStats.value[currentExamType.value] || {
    estimatedScore: null,
    answeredQuestionCount: 0,
    diagnosticExamCount: 0,
  }
))
const estimatedScoreText = computed(() => {
  if (!isCurrentExamActive.value) return '--'
  const score = currentExamStats.value.estimatedScore
  return score === null ? '--' : score.toFixed(1)
})
const answeredQuestionText = computed(() =>
  isCurrentExamActive.value ? String(currentExamStats.value.answeredQuestionCount) : '--',
)
const diagnosticExamText = computed(() =>
  isCurrentExamActive.value ? String(currentExamStats.value.diagnosticExamCount) : '--',
)
const subscriptionRecords = computed<SubscriptionRecord[]>(() =>
  (auth.memberContext?.memberships || []).map((item, index) => ({
    id: `${item.examType}-${item.plan}-${item.startsAt || index}`,
    title: `${item.examType}-${planName(item.plan)}订阅`,
    period: `${formatTimestamp(item.startsAt)} — ${formatTimestamp(item.endsAt)}`,
    amount: planAmount(item),
    paymentMethod: 'manual',
    status: normalizeSubscriptionStatus(item.status),
  })),
)
const filteredSubscriptionRecords = computed(() => {
  if (subscriptionFilter.value === 'all') return subscriptionRecords.value
  return subscriptionRecords.value.filter((item) => item.status === subscriptionFilter.value)
})
const totalSpend = computed(() =>
  subscriptionRecords.value.reduce((sum, item) => sum + item.amount, 0).toFixed(0),
)
const activeSubscriptionCount = computed(
  () => subscriptionRecords.value.filter((item) => item.status === 'active').length,
)
const currentPlanName = computed(() => {
  const active = activeMemberships.value[0]
  if (!active) return '免费版'
  return planName(active.plan)
})

watch(
  () => auth.user,
  () => {
    if (!profileEditing.value) resetProfileForm()
  },
  { immediate: true },
)

onMounted(async () => {
  errorText.value = ''
  const [memberResult, statsResult] = await Promise.allSettled([
    getMember(),
    getProfileExamStats(),
  ])

  if (memberResult.status === 'fulfilled') {
    auth.setMemberContext(memberResult.value)
    // 优先用注册时选的备考偏好，其次用已开通会员的考试类型
    const prefs = memberResult.value.examPreferences || []
    const firstPreference = prefs[0]
    if (firstPreference) {
      currentExamType.value = normalizeExamType(firstPreference.examType)
    } else {
      const firstActive = memberResult.value.memberships.find((item) => item.status === 'active')
      if (firstActive) currentExamType.value = normalizeExamType(firstActive.examType)
    }
  }
  if (statsResult.status === 'fulfilled') {
    profileStats.value = statsResult.value.stats || {}
  }
  const hasFailure = [memberResult, statsResult].some(
    (result) => result.status === 'rejected',
  )
  if (hasFailure) errorText.value = '部分学习数据暂时无法加载，请稍后刷新。'
})

async function handleLogout(): Promise<void> {
  await auth.logout()
  router.push('/')
}

function startEditProfile(): void {
  resetProfileForm()
  profileEditing.value = true
}

function cancelEditProfile(): void {
  resetProfileForm()
  profileEditing.value = false
}

function handleUpgradeClick(): void {
  ElMessage.info(`即将开通 ${currentExamType.value} 会员`)
}

async function saveProfile(): Promise<void> {
  const name = profileForm.name.trim()
  const email = profileForm.email.trim()
  if (!name) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (name.length > 50) {
    ElMessage.warning('用户名不能超过 50 个字符')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }

  profileSaving.value = true
  try {
    // 密码不在个人中心修改，避免和登录凭证更新流程混在一起。
    await auth.updateProfile(name, email)
    profileEditing.value = false
    ElMessage.success('基础信息已更新')
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.errMsg || err?.message || '更新资料失败')
  } finally {
    profileSaving.value = false
  }
}

function resetProfileForm(): void {
  profileForm.name = auth.user?.name || ''
  profileForm.email = auth.user?.email || ''
}

function normalizeExamType(value: unknown): ExamType {
  return EXAM_TYPE_OPTIONS.some((item) => item.value === value)
    ? (value as ExamType)
    : DEFAULT_EXAM_TYPE
}

function planName(plan: string): string {
  if (plan === 'yearly') return '专业版'
  if (plan === 'monthly') return '月度版'
  if (plan === 'admin') return '管理员权益'
  return '免费版'
}

function planAmount(item: MemberSubscription): number {
  if (item.plan === 'yearly') return 259
  if (item.plan === 'monthly') return 69
  return 0
}

function normalizeSubscriptionStatus(status: string): SubscriptionFilter {
  if (status === 'active' || status === 'expired' || status === 'cancelled') return status
  return 'expired'
}

function paymentMethodText(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    wechat: '微信',
    alipay: '支付宝',
    manual: '手动',
  }
  return map[method]
}

function statusText(status: SubscriptionFilter): string {
  const map: Record<SubscriptionFilter, string> = {
    all: '全部',
    active: '进行中',
    expired: '已过期',
    cancelled: '已取消',
  }
  return map[status]
}

function formatTimestamp(value: number | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate(),
  ).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.profile-page {
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-ink);
}

.profile-shell {
  width: 100%;
  height: calc(100vh - var(--nav-height));
  margin: 0;
  padding: 64px var(--container-px-desktop) 96px;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.profile-shell > * {
  width: min(100%, 1600px);
  margin-left: auto;
  margin-right: auto;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 28px;
  border-bottom: 1px solid var(--color-line);

  h1 {
    margin: 0 0 12px;
    color: var(--color-ink);
    font-size: var(--text-4xl);
    font-weight: var(--weight-bold);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-tight);
  }

  p {
    margin: 0;
    color: var(--color-ink-soft);
    font-size: var(--text-base);
    font-weight: var(--weight-normal);
    line-height: var(--leading-relaxed);
  }
}

.profile-grid {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 24px;
  margin-top: 32px;
}

.student-card,
.free-upgrade-panel,
.metric-panel,
.member-upgrade-panel,
.form-panel,
.subscription-panel {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.student-card {
  display: grid;
  justify-items: center;
  gap: 16px;
  align-self: start;
  min-height: 236px;
  padding: 32px 24px 24px;

  strong {
    color: var(--color-ink);
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-tight);
  }
}

.student-name-row {
  display: grid;
  justify-items: center;
  gap: 8px;
  max-width: 100%;
  text-align: center;
}

.membership-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  max-width: 100%;

  :deep(.el-tag) {
    border-color: var(--color-line);
    background: var(--color-hover);
    color: var(--color-ink);
    font-weight: var(--weight-semi);
  }
}

.avatar-frame {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.logout-link {
  width: 100%;
  padding-top: 16px;
  border: 0;
  border-top: 1px solid var(--color-line-soft);
  background: transparent;
  color: var(--color-ink-soft);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  cursor: pointer;
  transition: color var(--duration-base) ease;
}

.logout-link:hover {
  color: var(--color-ink);
}

.free-upgrade-panel {
  min-height: 220px;
  padding: 32px;
  border-color: var(--color-charcoal);
  background: var(--color-charcoal);
  color: var(--color-ink-inverse);

  h2 {
    margin: 16px 0 12px;
    color: var(--color-ink-inverse);
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    line-height: var(--leading-snug);
    letter-spacing: var(--tracking-tight);
  }

  p {
    margin: 0 0 24px;
    color: color-mix(in srgb, var(--color-ink-inverse) 72%, transparent);
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
  }

  .button_cancel {
    height: 46px;
    padding: 0 24px;
    font-size: 15px;
  }

  .button_cancel:hover {
    transform: translateY(-2px);
  }
}

.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 14px;
  border: 1px solid color-mix(in srgb, var(--color-ink-inverse) 20%, transparent);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--color-ink-inverse) 10%, transparent);
  color: var(--color-ink-inverse);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.member-dashboard {
  display: grid;
  gap: 14px;
}

.exam-tabs {
  display: flex;
  gap: 10px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;

  button {
    height: var(--height-button-lg);
    min-width: 90px;
    padding: 0 22px;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-ink-soft);
    font-family: inherit;
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition:
      background var(--duration-base) ease,
      color var(--duration-base) ease,
      border-color var(--duration-base) ease,
      transform var(--duration-base) ease;

    &.active {
      border-color: var(--color-ink);
      background: var(--color-ink);
      color: var(--color-ink-inverse);
    }

    &:hover:not(.active) {
      border-color: var(--color-ink);
      color: var(--color-ink);
      transform: translateY(-1px);
    }
  }
}

.metric-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 220px;
  padding: 40px 32px;

  .metric-item {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 18px;
    min-width: 0;
    padding: 12px 18px;
    text-align: center;
  }

  .metric-item + .metric-item {
    border-left: 1px solid var(--color-line-soft);
  }

  span {
    color: var(--color-ink-muted);
    font-size: var(--text-sm);
    font-weight: var(--weight-semi);
  }

  strong {
    color: var(--color-ink);
    font-size: var(--text-5xl);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-tight);
    line-height: 1;
  }

  small {
    color: var(--color-ink-muted);
    font-size: var(--text-xl);
    font-weight: var(--weight-medium);
  }
}

.member-upgrade-panel {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 16px;
  min-height: 220px;
  padding: 40px 32px;
  text-align: center;

  h2 {
    margin: 0;
    color: var(--color-ink);
    font-size: var(--text-3xl);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-tight);
  }

  p {
    max-width: 520px;
    margin: 0;
    color: var(--color-ink-soft);
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
  }

  .button_primary {
    padding: 0 22px;
  }

  .button_primary:hover {
    transform: translateY(-2px);
  }
}

.form-panel,
.subscription-panel {
  margin-top: 24px;
  padding: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;

  h2 {
    margin: 0;
    color: var(--color-ink);
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    line-height: var(--leading-snug);
    letter-spacing: var(--tracking-tight);
  }

  button:not(.button_primary):not(.button_cancel) {
    border: 0;
    background: transparent;
    color: var(--color-ink);
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-semi);
    cursor: pointer;
    transition: color var(--duration-base) ease;
  }

  button:not(.button_primary):not(.button_cancel):hover {
    color: var(--color-charcoal);
  }
}

.section-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.section-actions .text-button {
  min-width: 62px;
  height: var(--height-button-sm);
  padding: 0 14px;
}

.section-actions .primary-button {
  min-width: 62px;
  height: var(--height-button-sm);
  padding: 0 14px;
}

.readonly-form {
  display: grid;
  gap: 22px 32px;

  label {
    display: grid;
    grid-template-columns: 78px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  span {
    color: var(--color-ink);
    font-size: var(--text-sm);
    font-weight: var(--weight-semi);
    white-space: nowrap;
  }

  input {
    width: 100%;
    min-width: 0;
    height: 40px;
    padding: 0 12px;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    color: var(--color-ink);
    font-family: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }

  :deep(.el-input__wrapper) {
    min-height: 40px;
    padding: 0 12px;
    border-radius: var(--radius-md);
    box-shadow: 0 0 0 1px var(--color-line) inset;
  }

  :deep(.el-input__inner) {
    color: var(--color-ink);
    font-weight: var(--weight-medium);
  }

  :deep(.el-input.is-disabled .el-input__wrapper) {
    background: var(--color-surface-alt);
  }
}

.readonly-form--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.readonly-form--profile {
  grid-template-columns: repeat(3, minmax(220px, 1fr));
}

.readonly-form--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.subscription-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 0 0 28px;
  border-bottom: 1px solid var(--color-line-soft);

  article {
    display: grid;
    gap: 6px;
    padding: 20px;
    border: 1px solid var(--color-line-soft);
    border-radius: var(--radius-lg);
    background: var(--color-surface-alt);
  }

  span,
  small {
    color: var(--color-ink-muted);
    font-size: var(--text-xs);
    font-weight: var(--weight-semi);
  }

  strong {
    color: var(--color-ink);
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
  }
}

.record-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 28px 0;
}

.record-tabs {
  display: inline-grid;
  grid-template-columns: repeat(4, minmax(78px, 1fr));
  padding: 4px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-hover);

  button {
    height: 30px;
    border: 0;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-ink-soft);
    font-family: inherit;
    font-size: var(--text-xs);
    font-weight: var(--weight-semi);
    cursor: pointer;
    transition:
      background var(--duration-base) ease,
      color var(--duration-base) ease;

    &.active {
      background: var(--color-ink);
      color: var(--color-ink-inverse);
    }
  }
}

.sort-button {
  height: 34px;
  padding: 0 18px;
  font-size: var(--text-xs);
}

.subscription-list {
  display: grid;
  gap: 14px;
  padding: 0;
}

.subscription-record {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 24px;
  padding: 22px 24px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  transition:
    border-color var(--duration-slow) ease,
    box-shadow var(--duration-slow) ease,
    transform var(--duration-slow) ease;
}

.subscription-record:hover {
  border-color: var(--color-ink);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.record-main {
  min-width: 0;

  h3 {
    margin: 0 0 8px;
    color: var(--color-ink);
    font-size: var(--text-base);
    font-weight: var(--weight-semi);
    letter-spacing: var(--tracking-tight);
  }

  p {
    margin: 0 0 28px;
    color: var(--color-ink-muted);
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
  }
}

.payment-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 42px;

  span {
    display: grid;
    gap: 5px;
    color: var(--color-ink-muted);
    font-size: var(--text-xs);
    font-weight: var(--weight-semi);
  }

  strong {
    color: var(--color-ink);
    font-size: var(--text-sm);
    font-weight: var(--weight-semi);
  }
}

.record-side {
  display: grid;
  justify-items: end;
  align-content: space-between;
  gap: 36px;
}

.record-status {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 10px;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.record-status--active {
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}

.record-status--expired {
  background: var(--color-hover);
  color: var(--color-ink-muted);
}

.record-status--cancelled {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.record-button {
  min-width: auto;
  height: 32px;
  padding: 0 14px;
  font-size: var(--text-xs);
}

.record-button:hover {
  transform: translateY(-1px);
}

.load-warning {
  margin: 16px 0 0;
  color: var(--color-warning);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

/* 报考目标编辑 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.exam-edit-mode {
  display: grid;
  gap: 22px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  color: var(--color-ink);
}

.exam-type-group,
.subject-chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.exam-type-chip,
.subject-chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  cursor: pointer;
  user-select: none;
  transition: all var(--duration-base) ease;

  &:hover {
    border-color: var(--color-ink);
    color: var(--color-ink);
  }
}

.exam-type-chip--active,
.subject-chip--active {
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  border-color: var(--color-ink);
}

.subject-chip--required {
  cursor: not-allowed;
  opacity: 0.75;
}

.subject-group {
  margin-bottom: 10px;

  &:last-child { margin-bottom: 0; }
}

.subject-exam-label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  color: var(--color-ink-muted);
}

</style>
