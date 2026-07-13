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

      <section class="diagnostic-quota-panel">
        <div class="diagnostic-quota-heading">
          <h2>诊断测试额度</h2>
          <p>各考试类型独立计算额度，互不占用。</p>
        </div>
        <div class="diagnostic-quota-actions">
          <div class="diagnostic-quota-list" role="tablist" aria-label="诊断测试额度明细">
            <button
              v-for="item in diagnosticQuotaItems"
              :key="item.examType"
              class="diagnostic-quota-pill"
              :class="{
                'diagnostic-quota-pill--active': currentExamType === item.examType,
                'diagnostic-quota-pill--empty': item.isEmpty,
              }"
              type="button"
              role="tab"
              :aria-selected="currentExamType === item.examType"
              @click="currentExamType = item.examType"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.text }}</span>
            </button>
          </div>
          <button
            type="button"
            class="diagnostic-quota-button button_primary"
            @click="handleUpgradeClick"
          >
            获取更多模考额度
          </button>
        </div>
      </section>

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
          <div v-if="isCurrentExamActive" class="metric-panel">
            <article class="metric-item">
              <span>预估分数</span>
              <strong
                >{{ estimatedScoreText
                }}<small v-if="estimatedScoreText !== '--'">/9.0</small></strong
              >
            </article>
            <article class="metric-item">
              <span>累计做题</span>
              <strong
                >{{ answeredQuestionText
                }}<small v-if="answeredQuestionText !== '--'">道</small></strong
              >
            </article>
            <article class="metric-item">
              <span>累计考试</span>
              <strong
                >{{ diagnosticExamText
                }}<small v-if="diagnosticExamText !== '--'">场</small></strong
              >
            </article>
          </div>

          <div v-else class="member-upgrade-panel">
            <h2>开通 {{ currentExamType }} 会员</h2>
            <p>解锁 {{ currentExamType }} 历年真题、海量练习题、预估分分析与模拟考试权益。</p>
            <button type="button" class="button_primary" @click="handleUpgradeClick">
              升级会员
            </button>
          </div>
        </section>

        <section v-else class="free-upgrade-panel">
          <template v-if="hasCompletedCurrentDiagnostic">
            <span class="status-pill">{{ currentExamType }} 诊断测试已完成</span>
            <h2>
              {{ currentExamType }} 诊断测试分数：{{ currentDiagnosticScoreText
              }}<small v-if="currentDiagnosticScoreText !== '--'"> / 9.0</small>
            </h2>
            <p>升级 Pro 会员，解锁历次测试综合分析、海量真题练习册与智能错题本系统。</p>
            <button type="button" class="button_cancel" @click="handleUpgradeClick">
              升级 Pro 会员
            </button>
          </template>
          <template v-else>
            <span class="status-pill">{{ currentExamType }} 尚未完成诊断测试</span>
            <h2>完成 {{ currentExamType }} 首次诊断，获取能力评估</h2>
            <p>完成该考试类型的诊断测试后，可查看预估分数、薄弱知识点和后续学习建议。</p>
            <button type="button" class="button_cancel" @click="handleStartDiagnostic">
              开始 {{ currentExamType }} 诊断测试
            </button>
          </template>
        </section>
      </div>

      <section class="form-panel">
        <div class="section-title">
          <h2>基础信息</h2>
          <div class="section-actions">
            <button
              v-if="!profileEditing"
              type="button"
              class="button_cancel"
              @click="startEditProfile"
            >
              编辑
            </button>
            <template v-else>
              <button type="button" class="text-button button_cancel" @click="cancelEditProfile">
                取消
              </button>
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
            <span>用户名</span>
            <el-input
              v-model="profileForm.username"
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
              @input="resetEmailVerification"
            />
          </label>
          <label>
            <span>用户密码</span>
            <el-input model-value="************" disabled />
          </label>
        </div>
        <div v-if="profileEditing && profileEmailChanged" class="email-verification-row">
          <el-input
            v-model="emailCode"
            maxlength="6"
            inputmode="numeric"
            placeholder="输入新邮箱收到的六位验证码"
          />
          <button
            type="button"
            class="button_cancel"
            :disabled="emailCodeSending || emailCountdown > 0"
            @click="sendChangeEmailCode"
          >
            {{ emailCountdown > 0 ? `${emailCountdown}秒后重发` : '验证新邮箱' }}
          </button>
        </div>

        <div class="security-subsection">
          <div class="security-heading">
            <div>
              <h3>登录安全</h3>
              <p>修改密码和管理当前账号的登录设备。</p>
            </div>
            <button
              type="button"
              class="button_cancel"
              :disabled="!profileEditing"
              @click="handleLogoutAll"
            >
              退出全部设备
            </button>
          </div>

          <div class="password-form">
            <el-input
              v-model="passwordForm.currentPassword"
              type="password"
              autocomplete="current-password"
              placeholder="当前密码"
              :disabled="!profileEditing || passwordSaving"
              show-password
            />
            <el-input
              v-model="passwordForm.newPassword"
              type="password"
              autocomplete="new-password"
              placeholder="新密码（8-128位，包含字母和数字）"
              :disabled="!profileEditing || passwordSaving"
              show-password
            />
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="确认新密码"
              :disabled="!profileEditing || passwordSaving"
              show-password
            />
            <button
              type="button"
              class="button_primary"
              :disabled="!profileEditing || passwordSaving"
              @click="savePassword"
            >
              {{ passwordSaving ? '修改中...' : '修改密码' }}
            </button>
          </div>

          <div class="session-list">
            <article v-for="session in sessions" :key="session.id" class="session-item">
              <div>
                <strong>{{ session.isCurrent ? '当前设备' : '已登录设备' }}</strong>
                <small
                  >IP：{{ formatIpAddress(session.ipAddress) }} · 最近活动
                  {{ formatSessionTime(session.lastUsedAt) }}</small
                >
              </div>
              <button
                type="button"
                class="button_cancel"
                :disabled="!profileEditing"
                @click="handleRevokeSession(session)"
              >
                {{ session.isCurrent ? '退出' : '撤销' }}
              </button>
            </article>
          </div>
        </div>
      </section>

      <section class="form-panel">
        <div class="section-title">
          <h2>报考目标</h2>
          <div class="section-actions">
            <button v-if="!examEditing" type="button" class="button_cancel" @click="startEditExam">
              编辑
            </button>
            <template v-else>
              <button type="button" class="text-button button_cancel" @click="cancelEditExam">
                取消
              </button>
              <button
                type="button"
                class="primary-button button_primary"
                :disabled="examSaving"
                @click="saveExam"
              >
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
                <input
                  type="checkbox"
                  :value="et.value"
                  :checked="editExamTypes.includes(et.value)"
                  class="sr-only"
                  @change="toggleEditExamType(et.value)"
                />
                {{ et.label }}
              </label>
            </div>
          </div>
          <div v-if="editExamTypes.length" class="form-field">
            <label class="form-label">备考科目</label>
            <div v-for="et in editExamTypes" :key="et" class="subject-group">
              <span class="subject-exam-label"
                >{{ examTypeLabel(et) }}{{ et === 'ESAT' ? '（最多选 3 科）' : '' }}</span
              >
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
                  <input
                    type="checkbox"
                    :value="sub"
                    :checked="editSubjects[et]?.includes(sub)"
                    :disabled="isEditSubjectDisabled(et, sub)"
                    class="sr-only"
                    @change="toggleEditSubject(et, sub)"
                  />
                  {{ sub }}
                </label>
              </div>
            </div>
          </div>
          <div v-if="editExamTypes.length" class="form-field">
            <label class="form-label">学习路径分析资料</label>
            <div v-for="et in editExamTypes" :key="`${et}-goals`" class="goal-group">
              <strong>{{ examTypeLabel(et) }}</strong>
              <div class="goal-grid">
                <label>
                  <span>目标院校（多个用逗号分隔）</span>
                  <input
                    v-model="editGoals[et]!.targetUniversitiesText"
                    type="text"
                    placeholder="例如：Imperial College London"
                  />
                </label>
                <label>
                  <span>目标专业</span>
                  <input
                    v-model="editGoals[et]!.targetMajor"
                    type="text"
                    placeholder="例如：Mechanical Engineering"
                  />
                </label>
                <label v-if="et === 'ESAT'">
                  <span>ESAT 目标分数（1.0–9.0）</span>
                  <input
                    v-model="editGoals[et]!.targetScore"
                    type="number"
                    min="1"
                    max="9"
                    step="0.1"
                    placeholder="例如：7.0"
                  />
                </label>
                <label>
                  <span>考试日期</span>
                  <input v-model="editGoals[et]!.examDate" type="date" />
                </label>
                <label>
                  <span>每周可投入时长</span>
                  <input
                    v-model="editGoals[et]!.weeklyHours"
                    type="number"
                    min="1"
                    max="80"
                    step="1"
                    placeholder="例如：12"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 查看模式 -->
        <div v-else class="readonly-form readonly-form--two">
          <template v-for="pref in examPreferences" :key="pref.examType">
            <label>
              <span>{{ pref.examType }} 备考科目</span>
              <input :value="pref.subjects.join('、') || '未选择'" readonly />
            </label>
            <label>
              <span>{{ pref.examType }} 目标院校</span>
              <input :value="pref.targetUniversities?.join('、') || '未设置'" readonly />
            </label>
            <label>
              <span>{{ pref.examType }} 目标专业</span>
              <input :value="pref.targetMajor || '未设置'" readonly />
            </label>
            <label v-if="pref.examType.toUpperCase() === 'ESAT'">
              <span>{{ pref.examType }} 目标分数</span>
              <input
                :value="pref.targetScore ? `${pref.targetScore.toFixed(1)} / 9.0` : '未设置'"
                readonly
              />
            </label>
            <label>
              <span>{{ pref.examType }} 考试与投入</span>
              <input
                :value="`${pref.examDate || '日期未设置'} · ${pref.weeklyHours ? `${pref.weeklyHours} 小时/周` : '时长未设置'}`"
                readonly
              />
            </label>
          </template>
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
              <button v-else class="record-button button_cancel" type="button">重新订阅</button>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import {
  getMember,
  updateExamPreferences,
  type MemberSubscription,
  type ExamPreference,
} from '@/api/member'
import { getProfileExamStats, type ProfileExamStats } from '@/api/exam'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_EXAM_TYPE, EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'
import {
  changePassword,
  getSessions,
  revokeSession,
  sendEmailCode,
  type AuthSessionItem,
} from '@/api/auth'
import { validateConfirmPassword, validatePassword } from '@/utils/validation'

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

interface ExamGoalDraft {
  targetUniversitiesText: string
  targetMajor: string
  targetScore: string
  examDate: string
  weeklyHours: string
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
  username: '',
  email: '',
})
const emailCode = ref('')
const emailChallengeId = ref('')
const emailCodeSending = ref(false)
const emailCountdown = ref(0)
let emailTimer: number | undefined
const passwordSaving = ref(false)
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const sessions = ref<AuthSessionItem[]>([])
const profileEmailChanged = computed(
  () => profileForm.email.trim().toLowerCase() !== (auth.user?.email || '').toLowerCase(),
)

// 报考目标编辑
const examEditing = ref(false)
const examSaving = ref(false)
const editExamTypes = ref<string[]>([])
const editSubjects = ref<Record<string, string[]>>({})
const editGoals = ref<Record<string, ExamGoalDraft>>({})

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

// 新增考试类型时创建完整空白资料，保证模板中的双向绑定始终有目标对象。
function emptyExamGoal(): ExamGoalDraft {
  return {
    targetUniversitiesText: '',
    targetMajor: '',
    targetScore: '',
    examDate: '',
    weeklyHours: '',
  }
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

// 切换备考类型时同步创建或清理对应科目与学习路径资料。
function toggleEditExamType(value: string): void {
  const idx = editExamTypes.value.indexOf(value)
  if (idx >= 0) {
    editExamTypes.value.splice(idx, 1)
    delete editSubjects.value[value]
    delete editGoals.value[value]
  } else {
    editExamTypes.value.push(value)
    editSubjects.value[value] = [...(examRequiredSubjects[value] || [])]
    editGoals.value[value] = emptyExamGoal()
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

// 进入编辑模式时把已保存的结构化备考资料转换为表单草稿。
function startEditExam(): void {
  const prefs = auth.memberContext?.examPreferences || []
  editExamTypes.value = prefs.map((p) => p.examType)
  editSubjects.value = {}
  editGoals.value = {}
  for (const p of prefs) {
    editSubjects.value[p.examType] = [...p.subjects]
    editGoals.value[p.examType] = {
      targetUniversitiesText: (p.targetUniversities || []).join('、'),
      targetMajor: p.targetMajor || '',
      targetScore: p.targetScore ? String(p.targetScore) : '',
      examDate: p.examDate || '',
      weeklyHours: p.weeklyHours ? String(p.weeklyHours) : '',
    }
  }
  examEditing.value = true
}

function cancelEditExam(): void {
  examEditing.value = false
}

// 保存前验证目标分数与周投入范围，并将目标资料写回对应考试类型的 JSON 偏好。
async function saveExam(): Promise<void> {
  for (const et of editExamTypes.value) {
    const targetScoreText = editGoals.value[et]?.targetScore.trim() || ''
    const targetScore = Number(targetScoreText)
    if (
      et === 'ESAT' &&
      targetScoreText &&
      (!Number.isFinite(targetScore) || targetScore < 1 || targetScore > 9)
    ) {
      ElMessage.warning('ESAT 目标分数需为 1.0-9.0')
      return
    }
    const weeklyHoursText = editGoals.value[et]?.weeklyHours.trim() || ''
    const weeklyHours = Number(weeklyHoursText)
    if (weeklyHoursText && (!Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 80)) {
      ElMessage.warning(`${et} 每周可投入时长需为 1-80 小时`)
      return
    }
  }
  examSaving.value = true
  try {
    const prefs: ExamPreference[] = editExamTypes.value.map((et) => {
      const goal = editGoals.value[et] || emptyExamGoal()
      const targetUniversities = goal.targetUniversitiesText
        .split(/[，,、]/)
        .map((item) => item.trim())
        .filter(Boolean)
      const weeklyHours = Number(goal.weeklyHours)
      const targetScore = Number(goal.targetScore)
      return {
        examType: et,
        subjects: editSubjects.value[et] || [],
        ...(targetUniversities.length ? { targetUniversities } : {}),
        ...(goal.targetMajor.trim() ? { targetMajor: goal.targetMajor.trim() } : {}),
        ...(et === 'ESAT' && goal.targetScore && Number.isFinite(targetScore)
          ? { targetScore }
          : {}),
        ...(goal.examDate ? { examDate: goal.examDate } : {}),
        ...(goal.weeklyHours && Number.isFinite(weeklyHours) ? { weeklyHours } : {}),
      }
    })
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

const displayName = computed(() => auth.user?.username || '同学')
const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())
const activeMemberships = computed(() =>
  (auth.memberContext?.memberships || []).filter((item) => item.status === 'active'),
)
const hasActiveMembership = computed(() => activeMemberships.value.length > 0 || auth.isPaid)
const examPreferences = computed(() => auth.memberContext?.examPreferences || [])
const membershipTags = computed(() => {
  if (!activeMemberships.value.length) return ['免费版']
  return activeMemberships.value.map((item) => `${item.examType} ${planName(item.plan)}`)
})
// 未开通的考试类型保留 tab 入口，但统计值按产品要求隐藏为占位符。
const isCurrentExamActive = computed(() =>
  activeMemberships.value.some(
    (item) => normalizeExamType(item.examType) === currentExamType.value,
  ),
)
// 后端按考试类型返回统计，前端兜底可避免接口缺项导致模板分支复杂化。
const currentExamStats = computed<ProfileExamStats>(
  () =>
    profileStats.value[currentExamType.value] || {
      estimatedScore: null,
      answeredQuestionCount: 0,
      diagnosticExamCount: 0,
    },
)
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
const diagnosticQuotaItems = computed(() => {
  const quotas = auth.memberContext?.quotas || {}
  return EXAM_TYPE_OPTIONS.map((item) => {
    const quota = quotas[item.value]
    const diagnostic = quota?.diagnostic
    const isUnlimited = Boolean(quota?.isMember || diagnostic?.unlimited)
    let text = '暂无额度'

    if (isUnlimited) {
      text = '会员不限次'
    } else if (diagnostic && diagnostic.remaining !== null && diagnostic.limit !== null) {
      text = `剩余 ${diagnostic.remaining}/${diagnostic.limit} 次`
    }

    return {
      examType: item.value,
      label: item.label,
      text,
      isEmpty: !isUnlimited && (!diagnostic || diagnostic.remaining === 0),
    }
  })
})
const hasCompletedCurrentDiagnostic = computed(() => currentExamStats.value.diagnosticExamCount > 0)
const currentDiagnosticScoreText = computed(() => {
  const score = currentExamStats.value.estimatedScore
  return score === null ? '--' : score.toFixed(1)
})
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
  const [memberResult, statsResult, sessionsResult] = await Promise.allSettled([
    getMember(),
    getProfileExamStats(),
    getSessions(),
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
  if (sessionsResult.status === 'fulfilled') sessions.value = sessionsResult.value.list
  const hasFailure = [memberResult, statsResult, sessionsResult].some(
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
  emailCode.value = ''
  emailChallengeId.value = ''
  resetPasswordDraft()
  profileEditing.value = true
}

function cancelEditProfile(): void {
  resetProfileForm()
  emailCode.value = ''
  emailChallengeId.value = ''
  resetPasswordDraft()
  profileEditing.value = false
}

function handleUpgradeClick(): void {
  ElMessage.info(`即将开通 ${currentExamType.value} 会员`)
}

function handleStartDiagnostic(): void {
  router.push('/assessment')
}

async function saveProfile(): Promise<void> {
  const username = profileForm.username.trim()
  const email = profileForm.email.trim()
  if (!username) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (username.length > 50) {
    ElMessage.warning('用户名不能超过 50 个字符')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }
  if (profileEmailChanged.value && (!emailChallengeId.value || !/^\d{6}$/.test(emailCode.value))) {
    ElMessage.warning('请先验证新邮箱并输入六位验证码')
    return
  }

  profileSaving.value = true
  try {
    await auth.updateProfile({
      username,
      email,
      challengeId: profileEmailChanged.value ? emailChallengeId.value : undefined,
      emailCode: profileEmailChanged.value ? emailCode.value : undefined,
    })
    resetPasswordDraft()
    profileEditing.value = false
    ElMessage.success('基础信息已更新')
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.errMsg || err?.message || '更新资料失败')
  } finally {
    profileSaving.value = false
  }
}

function startEmailCountdown(seconds: number): void {
  if (emailTimer) window.clearInterval(emailTimer)
  emailCountdown.value = seconds
  emailTimer = window.setInterval(() => {
    emailCountdown.value -= 1
    if (emailCountdown.value <= 0 && emailTimer) {
      window.clearInterval(emailTimer)
      emailTimer = undefined
    }
  }, 1000)
}

function resetEmailVerification(): void {
  emailChallengeId.value = ''
  emailCode.value = ''
}

async function sendChangeEmailCode(): Promise<void> {
  const email = profileForm.email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning('请输入有效的新邮箱地址')
    return
  }
  emailCodeSending.value = true
  try {
    const data = await sendEmailCode(email, 'CHANGE_EMAIL')
    emailChallengeId.value = data.challengeId
    emailCode.value = ''
    startEmailCountdown(data.resendAfter)
    ElMessage.success('验证码已发送到新邮箱')
  } catch (error: any) {
    ElMessage.error(error?.message || '验证码发送失败')
  } finally {
    emailCodeSending.value = false
  }
}

async function savePassword(): Promise<void> {
  if (!profileEditing.value) return
  const passwordResult = validatePassword(passwordForm.newPassword)
  const confirmResult = validateConfirmPassword(
    passwordForm.newPassword,
    passwordForm.confirmPassword,
  )
  if (!passwordForm.currentPassword) {
    ElMessage.warning('请输入当前密码')
    return
  }
  if (!passwordResult.valid) {
    ElMessage.warning(passwordResult.message)
    return
  }
  if (!confirmResult.valid) {
    ElMessage.warning(confirmResult.message)
    return
  }

  passwordSaving.value = true
  try {
    await changePassword(passwordForm)
    resetPasswordDraft()
    auth.clearLocalSession()
    ElMessage.success('密码已修改，请使用新密码重新登录')
    await router.replace('/login')
  } catch (error: any) {
    ElMessage.error(error?.message || '密码修改失败')
  } finally {
    passwordSaving.value = false
  }
}

function formatSessionTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function formatIpAddress(value?: string | null): string {
  if (!value) return '未知'
  if (value === '::1') return '127.0.0.1'
  return value.replace(/^::ffff:/i, '')
}

async function handleRevokeSession(session: AuthSessionItem): Promise<void> {
  if (!profileEditing.value) return
  await revokeSession(session.id)
  if (session.isCurrent) {
    await auth.logout()
    router.push('/login')
    return
  }
  sessions.value = sessions.value.filter((item) => item.id !== session.id)
  ElMessage.success('设备会话已撤销')
}

async function handleLogoutAll(): Promise<void> {
  if (!profileEditing.value) return
  await auth.logoutAll()
  ElMessage.success('全部设备已退出')
  router.push('/login')
}

function resetProfileForm(): void {
  profileForm.username = auth.user?.username || ''
  profileForm.email = auth.user?.email || ''
}

function resetPasswordDraft(): void {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

onBeforeUnmount(() => {
  if (emailTimer) window.clearInterval(emailTimer)
})

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
  min-width: var(--fluid-page-min-width);
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-ink);
  --fluid-shell-min: 980px;
  --fluid-shell-fluid: calc(68.75vw + 100px);
  --profile-sidebar-width: clamp(200px, 15vw, 240px);
  --profile-card-pad: clamp(24px, 2vw, 32px);
  --profile-card-pad-x: clamp(18px, 1.5vw, 24px);
  --profile-card-pad-lg: clamp(28px, 2.5vw, 40px);
  --profile-card-gap: clamp(12px, 1vw, 16px);
  --profile-card-gap-lg: clamp(18px, 1.5vw, 24px);
  --profile-card-min-height: clamp(200px, 13.75vw, 220px);
  --profile-student-min-height: clamp(216px, 14.75vw, 236px);
  --profile-avatar-size: clamp(84px, 6vw, 96px);
}

.profile-shell {
  width: 100%;
  height: calc(100vh - var(--nav-height));
  margin: 0;
  padding: clamp(48px, 3.33vw, 64px) 0 clamp(72px, 5vw, 96px);
  overflow: auto;
  scrollbar-gutter: stable;
}

.profile-shell > * {
  width: clamp(var(--fluid-shell-min), var(--fluid-shell-fluid), var(--fluid-shell-max));
  margin-left: auto;
  margin-right: auto;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(18px, 1.25vw, 24px);
  padding-bottom: clamp(22px, 1.46vw, 28px);
  border-bottom: 1px solid var(--color-line);

  h1 {
    margin: 0 0 12px;
    color: var(--color-ink);
    font-size: clamp(var(--text-3xl), 1.875vw, var(--text-4xl));
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

.diagnostic-quota-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--profile-card-gap-lg);
  margin-top: clamp(24px, 1.67vw, 32px);
  padding: clamp(20px, 1.67vw, 26px) var(--profile-card-pad);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.diagnostic-quota-heading {
  flex: 0 0 auto;

  h2 {
    margin: 0 0 6px;
    color: var(--color-ink);
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
  }

  p {
    margin: 0;
    color: var(--color-ink-muted);
    font-size: var(--text-sm);
  }
}

.diagnostic-quota-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--profile-card-gap);
  min-width: 0;
}

.diagnostic-quota-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.diagnostic-quota-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: var(--color-hover);
  color: var(--color-ink-soft);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  white-space: nowrap;
  cursor: pointer;
  transition:
    border-color var(--duration-base) ease,
    background var(--duration-base) ease,
    color var(--duration-base) ease,
    transform var(--duration-base) ease;

  strong {
    color: var(--color-ink);
  }

  &:hover {
    border-color: var(--color-ink);
    transform: translateY(-1px);
  }
}

.diagnostic-quota-pill--active {
  border-color: var(--color-ink);
  background: var(--color-ink);
  color: var(--color-ink-inverse);

  strong {
    color: var(--color-ink-inverse);
  }
}

.diagnostic-quota-pill--empty:not(.diagnostic-quota-pill--active) {
  background: var(--color-surface-alt);
  color: var(--color-ink-muted);
}

.diagnostic-quota-button {
  flex: 0 0 auto;
  min-width: 176px;
  height: 42px;
  padding: 0 20px;
  border-radius: var(--radius-md);
}

.profile-grid {
  display: grid;
  grid-template-columns: var(--profile-sidebar-width) minmax(0, 1fr);
  gap: var(--profile-card-gap-lg);
  margin-top: var(--profile-card-gap-lg);
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
  gap: var(--profile-card-gap);
  align-self: start;
  min-height: var(--profile-student-min-height);
  padding: var(--profile-card-pad) var(--profile-card-pad-x) clamp(20px, 1.5vw, 24px);

  strong {
    color: var(--color-ink);
    font-size: clamp(var(--text-lg), 1.25vw, var(--text-xl));
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
  width: var(--profile-avatar-size);
  height: var(--profile-avatar-size);
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
  min-height: var(--profile-card-min-height);
  padding: var(--profile-card-pad);
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
  gap: var(--profile-card-gap);
}

.metric-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: var(--profile-card-min-height);
  padding: var(--profile-card-pad-lg) var(--profile-card-pad);

  .metric-item {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: clamp(12px, 1.13vw, 18px);
    min-width: 0;
    padding: clamp(10px, 0.75vw, 12px) clamp(12px, 1.13vw, 18px);
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
    font-size: clamp(var(--text-3xl), 2.5vw, var(--text-5xl));
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
  gap: var(--profile-card-gap);
  min-height: var(--profile-card-min-height);
  padding: var(--profile-card-pad-lg) var(--profile-card-pad);
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
  margin-top: var(--profile-card-gap-lg);
  padding: var(--profile-card-pad);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(12px, 0.83vw, 16px);
  margin-bottom: clamp(22px, 1.46vw, 28px);

  h2 {
    margin: 0;
    color: var(--color-ink);
    font-size: clamp(var(--text-xl), 1.5vw, var(--text-2xl));
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
  gap: clamp(18px, 1.15vw, 22px) clamp(24px, 1.67vw, 32px);

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
  grid-template-columns: repeat(3, minmax(clamp(160px, 13.75vw, 220px), 1fr));
}

.readonly-form--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.email-verification-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px;
  gap: 12px;
  max-width: 560px;
  margin-top: 18px;
}

.security-subsection {
  margin-top: clamp(24px, 1.67vw, 32px);
  padding-top: clamp(22px, 1.46vw, 28px);
  border-top: 1px solid var(--color-line-soft);
}

.security-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.security-heading h3 {
  margin: 0;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
}

.security-heading p {
  margin: 5px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.security-subsection button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.password-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: center;
}

.session-list {
  display: grid;
  gap: 10px;
  margin-top: 24px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.session-item small {
  display: block;
  margin: 4px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.subscription-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(12px, 0.83vw, 16px);
  padding: 0 0 clamp(22px, 1.46vw, 28px);
  border-bottom: 1px solid var(--color-line-soft);

  article {
    display: grid;
    gap: 6px;
    padding: clamp(16px, 1.25vw, 20px);
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
    font-size: clamp(var(--text-xl), 1.5vw, var(--text-2xl));
    font-weight: var(--weight-bold);
  }
}

.record-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(14px, 0.94vw, 18px);
  margin: clamp(22px, 1.46vw, 28px) 0;
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
  gap: clamp(10px, 0.88vw, 14px);
  padding: 0;
}

.subscription-record {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--profile-card-gap-lg);
  padding: clamp(16px, 1.38vw, 22px) var(--profile-card-pad-x);
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
  gap: clamp(24px, 2.19vw, 42px);

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
  gap: clamp(24px, 1.88vw, 36px);
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

  &:last-child {
    margin-bottom: 0;
  }
}

.subject-exam-label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  color: var(--color-ink-muted);
}

.goal-group {
  padding: 16px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.goal-group > strong {
  display: block;
  margin-bottom: 12px;
  font-size: var(--text-sm);
}

.goal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.goal-grid label {
  display: grid;
  gap: 6px;
}

.goal-grid span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.goal-grid input {
  width: 100%;
  height: var(--height-input-sm);
  padding: 0 12px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font-family: inherit;
  outline: none;
}

.goal-grid input:focus {
  border-color: var(--color-ink);
}
</style>
