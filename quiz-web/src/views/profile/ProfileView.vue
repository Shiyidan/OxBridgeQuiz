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
          <button
            type="button"
            class="diagnostic-quota-button button_primary"
            @click="handleUpgradeClick"
          >
            获取更多模考额度
          </button>
          <button class="logout-link" type="button" @click="handleLogout">退出登录</button>
        </aside>

        <section class="learning-overview-panel">
          <div class="diagnostic-quota-panel">
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
            </div>
          </div>

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
              <p>
                解锁
                {{ currentExamType }}
                历年真题、海量练习题、预估分分析与模拟考试权益。
              </p>
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
              maxlength="30"
              show-word-limit
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
            pattern="[0-9]*"
            placeholder="输入新邮箱收到的六位验证码"
            @input="handleChangeEmailCodeInput"
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
              maxlength="12"
              placeholder="新密码（8-12位，英文+数字，可使用 !@#$%）"
              :disabled="!profileEditing || passwordSaving"
              show-password
            />
            <el-input
              v-model="passwordForm.confirmPassword"
              type="password"
              autocomplete="new-password"
              maxlength="12"
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
                :class="{
                  'exam-type-chip--active': editExamTypes.includes(et.value),
                }"
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
                  <span>目标院校（最多选择 2 个）</span>
                  <el-select
                    v-model="editGoals[et]!.targetUniversities"
                    multiple
                    :multiple-limit="2"
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="请选择目标院校"
                  >
                    <el-option
                      v-for="university in TARGET_UNIVERSITY_OPTIONS"
                      :key="university"
                      :label="university"
                      :value="university"
                    />
                  </el-select>
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

        <!-- 查看模式按考试类型分组，避免长标签与内容相互遮挡。 -->
        <div v-else-if="examPreferences.length" class="exam-summary-list">
          <article v-for="pref in examPreferences" :key="pref.examType" class="exam-summary-card">
            <header class="exam-summary-header">
              <span>{{ pref.examType }}</span>
              <div>
                <strong>{{ pref.examType }} 备考目标</strong>
                <small>该考试类型的科目与申请目标</small>
              </div>
            </header>

            <div class="exam-summary-grid">
              <div class="exam-summary-item">
                <span>备考科目</span>
                <strong>{{ pref.subjects.join('、') || '未选择' }}</strong>
              </div>
              <div class="exam-summary-item">
                <span>目标院校</span>
                <strong>{{ pref.targetUniversities?.join('、') || '未设置' }}</strong>
              </div>
              <div class="exam-summary-item">
                <span>目标专业</span>
                <strong>{{ pref.targetMajor || '未设置' }}</strong>
              </div>
              <div v-if="pref.examType.toUpperCase() === 'ESAT'" class="exam-summary-item">
                <span>目标分数</span>
                <strong>{{
                  pref.targetScore ? `${pref.targetScore.toFixed(1)} / 9.0` : '未设置'
                }}</strong>
              </div>
              <div class="exam-summary-item">
                <span>考试日期</span>
                <strong>{{ pref.examDate || '未设置' }}</strong>
              </div>
              <div class="exam-summary-item">
                <span>每周投入</span>
                <strong>{{ pref.weeklyHours ? `${pref.weeklyHours} 小时/周` : '未设置' }}</strong>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="exam-summary-empty">
          <strong>尚未设置报考目标</strong>
          <span>点击“编辑”选择备考类型并完善申请目标。</span>
        </div>
      </section>

      <section class="subscription-panel subscription-center">
        <div class="section-title">
          <h2>订阅记录</h2>
        </div>

        <div v-if="subscriptionRecords.length" class="record-toolbar">
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
          <button class="subscription-sort-button" type="button" @click="toggleSubscriptionSort">
            <span aria-hidden="true">⇅</span>
            {{ subscriptionSortDescending ? '按时间排序（近→远）' : '按时间排序（远→近）' }}
          </button>
        </div>

        <div v-if="filteredSubscriptionRecords.length" class="record-list">
          <article
            v-for="record in filteredSubscriptionRecords"
            :key="record.id"
            class="record-card"
          >
            <div class="record-main">
              <h3>{{ record.title }}</h3>
              <p>订阅周期：{{ record.period }}</p>
              <div class="payment-meta subscription-payment-meta">
                <span>
                  支付金额
                  <strong>{{ record.paymentAmount }}</strong>
                </span>
                <span>
                  支付方式
                  <strong>{{ record.paymentMethod }}</strong>
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
        <div v-else class="record-empty">
          <strong>暂无订阅记录</strong>
          <span>开通会员后，订阅周期和权益状态将在这里显示。</span>
        </div>
      </section>

      <section class="payment-panel">
        <div class="section-title">
          <div>
            <h2>支付记录</h2>
            <p>展示通过在线支付创建的真实订单和交易状态。</p>
          </div>
        </div>

        <div class="payment-summary">
          <article>
            <span>累计订单</span>
            <strong>{{ paymentOrders.length }}笔</strong>
            <small>全部交易</small>
          </article>
          <article>
            <span>支付成功</span>
            <strong>{{ paidPaymentOrderCount }}笔</strong>
            <small>不含已退款订单</small>
          </article>
          <article>
            <span>累计实付</span>
            <strong>{{ totalPaidAmount }}</strong>
            <small>不含已退款金额</small>
          </article>
        </div>

        <div v-if="paymentOrders.length" class="record-toolbar">
          <div class="record-tabs record-tabs--payment" role="tablist" aria-label="支付记录筛选">
            <button
              v-for="filter in paymentFilters"
              :key="filter.value"
              :class="{ active: paymentFilter === filter.value }"
              type="button"
              @click="paymentFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>
          <span class="record-sort-hint">按创建时间倒序</span>
        </div>

        <div v-if="paymentOrdersLoading" class="record-empty">
          <strong>正在加载支付记录</strong>
          <span>请稍候...</span>
        </div>
        <div v-else-if="paymentOrdersError" class="record-empty record-empty--error">
          <strong>支付记录加载失败</strong>
          <span>{{ paymentOrdersError }}</span>
          <button class="button_cancel" type="button" @click="loadPaymentOrders">重新加载</button>
        </div>
        <div v-else-if="filteredPaymentOrders.length" class="record-list">
          <article v-for="order in filteredPaymentOrders" :key="order.id" class="record-card">
            <div class="record-main">
              <h3>{{ paymentOrderTitle(order) }}</h3>
              <p>订单号：{{ order.orderNo }}</p>
              <div class="payment-meta">
                <span>
                  考试类型
                  <strong>{{ order.examTypes.join('、') || '-' }}</strong>
                </span>
                <span>
                  套餐
                  <strong>{{ paymentPlanText(order) }}</strong>
                </span>
                <span>
                  支付金额
                  <strong>{{ formatPaymentAmount(order.amountCents, order.currency) }}</strong>
                </span>
                <span>
                  支付方式
                  <strong>{{ paymentChannelText(order.channel) }}</strong>
                </span>
                <span>
                  创建时间
                  <strong>{{ formatDateTime(order.createdAt) }}</strong>
                </span>
                <span>
                  支付时间
                  <strong>{{ formatDateTime(order.paidAt) }}</strong>
                </span>
              </div>
            </div>

            <div class="record-side">
              <span class="record-status" :class="`record-status--${order.status}`">
                {{ paymentStatusText(order.status) }}
              </span>
            </div>
          </article>
        </div>
        <div v-else class="record-empty">
          <strong>{{ paymentOrders.length ? '当前筛选下暂无订单' : '暂无支付记录' }}</strong>
          <span>{{
            paymentOrders.length
              ? '请选择其他订单状态查看。'
              : '完成在线支付后，订单记录将在这里显示。'
          }}</span>
        </div>
      </section>

      <p v-if="errorText" class="load-warning">{{ errorText }}</p>
    </main>
  </div>
</template>

<script setup lang="ts">
// 学生个人中心：展示会员权益、学习统计、基础信息、订阅和支付记录。
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import { getMember, updateExamPreferences, type ExamPreference } from '@/api/member'
import { getProfileExamStats, type ProfileExamStats } from '@/api/exam'
import { getMyPaymentOrders, type PaymentOrder } from '@/api/payment'
import { useAuthStore } from '@/stores/auth'
import { DEFAULT_EXAM_TYPE, EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'
import { TARGET_UNIVERSITY_OPTIONS } from '@/constants/universities'
import {
  changePassword,
  getSessions,
  revokeSession,
  sendEmailCode,
  type AuthSessionItem,
} from '@/api/auth'
import {
  EMAIL_CODE_PATTERN,
  normalizeEmailCode,
  validateConfirmPassword,
  validatePassword,
  validateUsername,
} from '@/utils/validation'

type SubscriptionFilter = 'all' | 'active' | 'expired' | 'cancelled'
type PaymentOrderFilter = 'all' | 'pending' | 'paid' | 'closed' | 'refund'

interface SubscriptionRecord {
  id: string
  title: string
  period: string
  startedAt: number | null
  paymentAmount: string
  paymentMethod: string
  status: SubscriptionFilter
}

interface ExamGoalDraft {
  targetUniversities: string[]
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
const subscriptionSortDescending = ref(true)
const paymentFilter = ref<PaymentOrderFilter>('all')
const paymentOrders = ref<PaymentOrder[]>([])
const paymentOrdersLoading = ref(true)
const paymentOrdersError = ref('')
const paymentFilters: { label: string; value: PaymentOrderFilter }[] = [
  { label: '全部订单', value: 'all' },
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '已关闭', value: 'closed' },
  { label: '退款', value: 'refund' },
]
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
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const sessions = ref<AuthSessionItem[]>([])
// 只有邮箱实际变化时才要求验证码，单独修改用户名无需重复验证邮箱。
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

// 考试类型展示名从统一选项读取，避免页面直接展示内部值。
function examTypeLabel(value: string): string {
  return examTypes.find((e) => e.value === value)?.label || value
}

// 新增考试类型时创建完整空白资料，保证模板中的双向绑定始终有目标对象。
function emptyExamGoal(): ExamGoalDraft {
  return {
    targetUniversities: [],
    targetMajor: '',
    targetScore: '',
    examDate: '',
    weeklyHours: '',
  }
}

// 必选科目沿用注册规则，确保个人中心不会保存出不兼容偏好。
function isExamSubjectRequired(examType: string, subject: string): boolean {
  return (examRequiredSubjects[examType] || []).includes(subject)
}

// 必选科目和 ESAT 数量上限在编辑时同步锁定，防止选择状态失真。
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

// 只允许修改可选科目，避免用户移除考试类型要求的基础科目。
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
      targetUniversities: [...(p.targetUniversities || [])],
      targetMajor: p.targetMajor || '',
      targetScore: p.targetScore ? String(p.targetScore) : '',
      examDate: p.examDate || '',
      weeklyHours: p.weeklyHours ? String(p.weeklyHours) : '',
    }
  }
  examEditing.value = true
}

// 取消编辑只退出草稿态，已保存的会员上下文保持不变。
function cancelEditExam(): void {
  examEditing.value = false
}

// 保存前验证目标分数与周投入范围，并将目标资料写回对应考试类型的 JSON 偏好。
async function saveExam(): Promise<void> {
  for (const et of editExamTypes.value) {
    if ((editGoals.value[et]?.targetUniversities.length || 0) > 2) {
      ElMessage.warning(`${et} 目标院校最多选择 2 个`)
      return
    }
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
      const weeklyHours = Number(goal.weeklyHours)
      const targetScore = Number(goal.targetScore)
      return {
        examType: et,
        subjects: editSubjects.value[et] || [],
        ...(goal.targetUniversities.length
          ? { targetUniversities: [...goal.targetUniversities] }
          : {}),
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
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, '更新失败'))
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

// 用户名缺失时提供稳定称呼，避免个人中心标题为空。
const displayName = computed(() => auth.user?.username || '同学')
// 未上传头像时从展示名生成文字占位。
const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())
// 仅有效会员记录参与当前权益和标签计算。
const activeMemberships = computed(() =>
  (auth.memberContext?.memberships || []).filter((item) => item.status === 'active'),
)
// 兼容旧支付标识，确保迁移期间已付费用户仍被识别为会员。
const hasActiveMembership = computed(() => activeMemberships.value.length > 0 || auth.isPaid)
// 缺少备考偏好时统一为空数组，简化模板遍历和编辑初始化。
const examPreferences = computed(() => auth.memberContext?.examPreferences || [])
// 会员标签由实际生效套餐生成，无有效套餐时明确展示免费版。
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
// 预估分数只对已开通考试展示，并统一保留一位小数。
const estimatedScoreText = computed(() => {
  if (!isCurrentExamActive.value) return '--'
  const score = currentExamStats.value.estimatedScore
  return score === null ? '--' : score.toFixed(1)
})
// 未开通考试隐藏答题量，避免把零误解为有效学习统计。
const answeredQuestionText = computed(() =>
  isCurrentExamActive.value ? String(currentExamStats.value.answeredQuestionCount) : '--',
)
// 未开通考试隐藏诊断次数，与其他统计卡片保持同一展示规则。
const diagnosticExamText = computed(() =>
  isCurrentExamActive.value ? String(currentExamStats.value.diagnosticExamCount) : '--',
)
// 诊断额度完全按后端分考试类型权益计算，不再用历史记录推断状态。
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
// 诊断完成状态只读取当前考试类型，避免不同考试记录相互污染。
const hasCompletedCurrentDiagnostic = computed(() => currentExamStats.value.diagnosticExamCount > 0)
// 当前诊断卡片统一格式化分数，无有效成绩时显示占位符。
const currentDiagnosticScoreText = computed(() => {
  const score = currentExamStats.value.estimatedScore
  return score === null ? '--' : score.toFixed(1)
})
// 将后端会员记录转换为订阅列表所需的稳定展示结构。
const subscriptionRecords = computed<SubscriptionRecord[]>(() =>
  (auth.memberContext?.memberships || []).map((item, index) => {
    const paymentOrder = findSubscriptionPaymentOrder(item.examType, item.plan)
    let paymentAmount = '无在线支付记录'
    let paymentMethod = '无在线支付记录'
    if (paymentOrdersLoading.value) {
      paymentAmount = '加载中...'
      paymentMethod = '加载中...'
    } else if (paymentOrdersError.value) {
      paymentAmount = '暂不可用'
      paymentMethod = '暂不可用'
    } else if (paymentOrder) {
      paymentAmount = formatPaymentAmount(paymentOrder.amountCents, paymentOrder.currency)
      paymentMethod = paymentChannelText(paymentOrder.channel)
    }

    return {
      id: `${item.examType}-${item.plan}-${item.startsAt || index}`,
      title: `${item.examType}-${planName(item.plan)}订阅`,
      period: `${formatTimestamp(item.startsAt)} — ${formatTimestamp(item.endsAt)}`,
      startedAt: item.startsAt,
      paymentAmount,
      paymentMethod,
      status: normalizeSubscriptionStatus(item.status),
    }
  }),
)
// 订阅筛选和时间排序只作用于展示副本，不修改原始会员上下文。
const filteredSubscriptionRecords = computed(() => {
  const records =
    subscriptionFilter.value === 'all'
      ? subscriptionRecords.value
      : subscriptionRecords.value.filter((item) => item.status === subscriptionFilter.value)
  const direction = subscriptionSortDescending.value ? -1 : 1
  return [...records].sort(
    (left, right) => ((left.startedAt || 0) - (right.startedAt || 0)) * direction,
  )
})
// 支付筛选按订单业务状态归类，关闭和退款相关状态分别聚合展示。
const filteredPaymentOrders = computed(() => {
  if (paymentFilter.value === 'all') return paymentOrders.value
  if (paymentFilter.value === 'closed') {
    return paymentOrders.value.filter((item) => ['closed', 'failed'].includes(item.status))
  }
  if (paymentFilter.value === 'refund') {
    return paymentOrders.value.filter((item) => ['refunding', 'refunded'].includes(item.status))
  }
  return paymentOrders.value.filter((item) => item.status === paymentFilter.value)
})
// 已支付统计排除退款完成订单，退款处理中仍保留当前实付金额。
const paidPaymentOrders = computed(() =>
  paymentOrders.value.filter((item) => ['paid', 'refunding'].includes(item.status)),
)
const paidPaymentOrderCount = computed(() => paidPaymentOrders.value.length)
const totalPaidAmount = computed(() =>
  formatPaymentAmount(
    paidPaymentOrders.value.reduce((sum, item) => sum + item.amountCents, 0),
    'CNY',
  ),
)
// 用户上下文刷新时仅同步非编辑态表单，避免覆盖正在输入的草稿。
watch(
  () => auth.user,
  () => {
    if (!profileEditing.value) resetProfileForm()
  },
  { immediate: true },
)

// 进入个人中心并行加载权益、统计、设备会话和真实支付订单，局部失败不阻塞其他区域。
onMounted(async () => {
  errorText.value = ''
  const [memberResult, statsResult, sessionsResult, paymentOrdersResult] = await Promise.allSettled(
    [getMember(), getProfileExamStats(), getSessions(), getMyPaymentOrders()],
  )

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
  if (paymentOrdersResult.status === 'fulfilled') {
    paymentOrders.value = paymentOrdersResult.value
  } else {
    paymentOrdersError.value = '暂时无法获取订单，请稍后重试。'
  }
  paymentOrdersLoading.value = false
  const hasFailure = [memberResult, statsResult, sessionsResult].some(
    (result) => result.status === 'rejected',
  )
  if (hasFailure) errorText.value = '部分学习数据暂时无法加载，请稍后刷新。'
})

// 退出当前设备时先撤销服务端会话，再离开个人中心。
async function handleLogout(): Promise<void> {
  await auth.logout()
  router.push('/')
}

// 开始编辑时基于最新用户数据创建干净草稿并清空敏感输入。
function startEditProfile(): void {
  resetProfileForm()
  emailCode.value = ''
  emailChallengeId.value = ''
  resetPasswordDraft()
  profileEditing.value = true
}

// 取消编辑时丢弃未保存资料和密码草稿，恢复服务端状态。
function cancelEditProfile(): void {
  resetProfileForm()
  emailCode.value = ''
  emailChallengeId.value = ''
  resetPasswordDraft()
  profileEditing.value = false
}

// 升级入口保留当前考试类型上下文，便于后续接入支付流程。
function handleUpgradeClick(): void {
  ElMessage.info(`即将开通 ${currentExamType.value} 会员`)
}

// 从额度区进入统一诊断入口，由诊断页继续选择具体试卷。
function handleStartDiagnostic(): void {
  router.push('/assessment')
}

// 订阅列表按用户选择在最近和最早记录之间切换，便于查看历史周期。
function toggleSubscriptionSort(): void {
  subscriptionSortDescending.value = !subscriptionSortDescending.value
}

// 用户主动重试时仅刷新支付订单，避免重复请求个人中心的其他数据。
async function loadPaymentOrders(): Promise<void> {
  paymentOrdersLoading.value = true
  paymentOrdersError.value = ''
  try {
    paymentOrders.value = await getMyPaymentOrders()
  } catch (error: unknown) {
    paymentOrdersError.value = getApiErrorMessage(error, '暂时无法获取订单，请稍后重试。')
  } finally {
    paymentOrdersLoading.value = false
  }
}

// 基础信息保存时仅在邮箱变化后附带新邮箱验证挑战。
async function saveProfile(): Promise<void> {
  const username = profileForm.username.trim()
  const email = profileForm.email.trim()
  const usernameResult = validateUsername(username)
  if (!usernameResult.valid) {
    ElMessage.warning(usernameResult.message)
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }
  if (
    profileEmailChanged.value &&
    (!emailChallengeId.value || !EMAIL_CODE_PATTERN.test(emailCode.value))
  ) {
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
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, '更新资料失败'))
  } finally {
    profileSaving.value = false
  }
}

// 邮箱验证码倒计时使用服务端返回间隔，避免与限流时间不一致。
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

// 新邮箱再次变化时废弃旧挑战，防止验证码绑定到错误地址。
function resetEmailVerification(): void {
  emailChallengeId.value = ''
  emailCode.value = ''
}

// 输入阶段过滤非数字，保证验证码模型始终符合提交格式。
function handleChangeEmailCodeInput(value: string): void {
  emailCode.value = normalizeEmailCode(value)
}

// 修改邮箱验证码只发送至当前表单的新地址，并保存本次挑战标识。
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
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, '验证码发送失败'))
  } finally {
    emailCodeSending.value = false
  }
}

// 密码修改成功后清除本地会话并要求重新登录，避免旧凭据继续使用。
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
  } catch (error: unknown) {
    ElMessage.error(getApiErrorMessage(error, '密码修改失败'))
  } finally {
    passwordSaving.value = false
  }
}

// 会话时间统一按中文二十四小时制展示，方便用户识别最近活动。
function formatSessionTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

// IPv4 映射地址转换为用户熟悉的显示格式，本地回环统一为 127.0.0.1。
function formatIpAddress(value?: string | null): string {
  if (!value) return '未知'
  if (value === '::1') return '127.0.0.1'
  return value.replace(/^::ffff:/i, '')
}

// 撤销当前会话后立即退出；其他设备则只从会话列表移除。
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

// 全部设备退出由后端批量撤销会话，当前页面随后返回登录页。
async function handleLogoutAll(): Promise<void> {
  if (!profileEditing.value) return
  await auth.logoutAll()
  ElMessage.success('全部设备已退出')
  router.push('/login')
}

// 资料草稿始终从当前登录用户重建，避免保留上次编辑内容。
function resetProfileForm(): void {
  profileForm.username = auth.user?.username || ''
  profileForm.email = auth.user?.email || ''
}

// 密码草稿不做持久化，每次结束编辑都立即清空。
function resetPasswordDraft(): void {
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
}

// 页面离开时释放邮箱倒计时，避免卸载后继续更新组件状态。
onBeforeUnmount(() => {
  if (emailTimer) window.clearInterval(emailTimer)
})

// 未识别的考试类型回落到默认值，保证统计和路由上下文可用。
function normalizeExamType(value: unknown): ExamType {
  return EXAM_TYPE_OPTIONS.some((item) => item.value === value)
    ? (value as ExamType)
    : DEFAULT_EXAM_TYPE
}

// 套餐内部值集中映射为中文名称，避免各卡片重复维护文案。
function planName(plan: string): string {
  if (plan === 'yearly') return '专业版'
  if (plan === 'monthly') return '月度版'
  if (plan === 'admin') return '管理员权益'
  return '免费版'
}

// 后端异常订阅状态按已过期展示，避免误标记为仍在生效。
function normalizeSubscriptionStatus(status: string): SubscriptionFilter {
  if (status === 'active' || status === 'expired' || status === 'cancelled') return status
  return 'expired'
}

// 订阅状态文案集中映射，保证筛选项和记录标签一致。
function statusText(status: SubscriptionFilter): string {
  const map: Record<SubscriptionFilter, string> = {
    all: '全部',
    active: '进行中',
    expired: '已过期',
    cancelled: '已取消',
  }
  return map[status]
}

// 订阅日期统一输出年月日，无效或缺失时间使用占位符。
function formatTimestamp(value: number | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

// 支付订单标题由考试类型和套餐组成，缺失考试类型时保留稳定兜底。
function paymentOrderTitle(order: PaymentOrder): string {
  return `${order.examTypes.join('、') || '会员'} ${paymentPlanText(order)}订单`
}

// 套餐文案同时体现首月优惠，避免用户将优惠订单误解为普通月付。
function paymentPlanText(order: Pick<PaymentOrder, 'plan' | 'priceType'>): string {
  if (order.priceType === 'first_monthly') return '月度套餐（首月优惠）'
  return order.plan === 'yearly' ? '年度套餐' : '月度套餐'
}

// 支付渠道统一转换为用户可理解的中文名称。
function paymentChannelText(channel: PaymentOrder['channel']): string {
  const map: Record<PaymentOrder['channel'], string> = {
    alipay: '支付宝',
    wechat: '微信支付',
    unionpay: '银联支付',
  }
  return map[channel]
}

// 订阅记录关联最近一笔同考试、同套餐的成功订单，续费场景优先展示最新交易信息。
function findSubscriptionPaymentOrder(examType: string, plan: string): PaymentOrder | undefined {
  return paymentOrders.value.find(
    (order) =>
      order.plan === plan &&
      Boolean(order.paidAt) &&
      ['paid', 'refunding', 'refunded'].includes(order.status) &&
      order.examTypes.some((item) => item.toUpperCase() === examType.toUpperCase()),
  )
}

// 支付状态集中映射，未知状态保持原值以便排查后端扩展状态。
function paymentStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    failed: '支付失败',
    closed: '已关闭',
    refunding: '退款中',
    refunded: '已退款',
  }
  return map[status] || status
}

// 金额以分为单位格式化，异常币种回退到人民币符号展示。
function formatPaymentAmount(amountCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency || 'CNY',
      minimumFractionDigits: 2,
    }).format(amountCents / 100)
  } catch {
    return `¥${(amountCents / 100).toFixed(2)}`
  }
}

// 支付时间保留到分钟，未支付订单使用占位符。
function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// 接口异常优先展示后端业务消息，网络异常和未知异常使用调用方兜底文案。
function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as { response?: { data?: { errMsg?: unknown } }; message?: unknown }
  const responseMessage = apiError.response?.data?.errMsg
  if (typeof responseMessage === 'string' && responseMessage) return responseMessage
  if (typeof apiError.message === 'string' && apiError.message) return apiError.message
  return fallback
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
  --profile-card-gap: clamp(12px, 1vw, 16px);
  --profile-card-gap-lg: clamp(18px, 1.5vw, 24px);
  --profile-overview-body-min-height: clamp(150px, 10vw, 160px);
  --profile-avatar-size: clamp(76px, 5.25vw, 84px);
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
  display: grid;
  grid-template-columns: minmax(170px, 0.65fr) minmax(0, 1.35fr);
  align-items: center;
  gap: var(--profile-card-gap-lg);
  padding: clamp(16px, 1.25vw, 20px) var(--profile-card-pad);
  border-bottom: 1px solid var(--color-line-soft);
  background: var(--color-surface);
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
  flex-wrap: wrap;
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
.learning-overview-panel,
.form-panel,
.subscription-panel,
.payment-panel {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.student-card {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  justify-items: center;
  gap: 10px;
  align-self: stretch;
  min-height: 0;
  padding: clamp(20px, 1.5vw, 24px) var(--profile-card-pad-x) 18px;

  strong {
    color: var(--color-ink);
    font-size: clamp(var(--text-lg), 1.25vw, var(--text-xl));
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-tight);
  }
}

.student-card .diagnostic-quota-button {
  width: auto;
  min-width: 0;
  margin-top: 4px;
  height: 34px;
  padding: 0 14px;
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.learning-overview-panel {
  display: grid;
  grid-template-rows: auto minmax(var(--profile-overview-body-min-height), 1fr);
  overflow: hidden;
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
  align-self: end;
  width: 100%;
  padding-top: 12px;
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
  min-height: var(--profile-overview-body-min-height);
  padding: clamp(20px, 1.5vw, 24px) var(--profile-card-pad);
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
  min-height: var(--profile-overview-body-min-height);
}

.metric-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 100%;
  padding: clamp(18px, 1.5vw, 24px) var(--profile-card-pad);

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
  min-height: 100%;
  padding: clamp(18px, 1.5vw, 24px) var(--profile-card-pad);
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
.subscription-panel,
.payment-panel {
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

.section-title > div > p {
  margin: 6px 0 0;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
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

.exam-summary-list {
  display: grid;
  gap: 18px;
}

.exam-summary-card {
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
}

.exam-summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--color-line-soft);
  background: var(--color-surface);
}

.exam-summary-header > span {
  display: grid;
  place-items: center;
  min-width: 58px;
  height: 32px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
}

.exam-summary-header div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.exam-summary-header strong {
  color: var(--color-ink);
  font-size: var(--text-base);
  font-weight: var(--weight-bold);
}

.exam-summary-header small {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.exam-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.exam-summary-item {
  display: grid;
  align-content: start;
  gap: 8px;
  min-width: 0;
  min-height: 76px;
  padding: 14px 16px;
  border: 1px solid var(--color-line-soft);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.exam-summary-item span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.exam-summary-item strong {
  overflow-wrap: anywhere;
  color: var(--color-ink);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  line-height: var(--leading-relaxed);
}

.exam-summary-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 36px 24px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
  text-align: center;
}

.exam-summary-empty strong {
  color: var(--color-ink);
  font-size: var(--text-base);
}

.exam-summary-empty span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
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

.subscription-center {
  margin-top: var(--profile-card-gap-lg);
}

.payment-summary {
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

.record-tabs--payment {
  grid-template-columns: repeat(5, minmax(78px, 1fr));
}

.subscription-center .record-toolbar {
  margin: 0 0 clamp(22px, 1.46vw, 28px);
}

.subscription-center .record-tabs {
  border-color: transparent;
  background: var(--color-info-bg);
}

.subscription-center .record-tabs button.active {
  background: var(--color-surface);
  color: var(--color-report-blue);
  box-shadow: var(--shadow-sm);
}

.subscription-sort-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink-soft);
  font-family: inherit;
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition:
    border-color var(--duration-base) ease,
    color var(--duration-base) ease;
}

.subscription-sort-button:hover {
  border-color: var(--color-report-blue);
  color: var(--color-report-blue);
}

.record-sort-hint {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.record-list {
  display: grid;
  gap: clamp(10px, 0.88vw, 14px);
  padding: 0;
}

.record-card {
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

.record-card:hover {
  border-color: var(--color-ink);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.subscription-center .record-card {
  min-height: 126px;
  border-color: var(--color-line);
  box-shadow: var(--shadow-sm);
}

.subscription-center .record-card:hover {
  border-color: color-mix(in srgb, var(--color-report-blue) 35%, var(--color-line));
  box-shadow: var(--shadow-md);
}

.subscription-center .record-main p {
  margin-bottom: 0;
}

.subscription-payment-meta {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--color-line-soft);
}

.subscription-center .record-side {
  min-width: 104px;
}

.subscription-center .record-status--active {
  background: color-mix(in srgb, var(--color-report-blue) 12%, var(--color-surface));
  color: var(--color-report-blue);
}

.subscription-center .record-status--expired {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.subscription-center .record-button.button_primary {
  border-color: var(--color-report-blue);
  background: var(--color-report-blue);
  color: var(--color-ink-inverse);
}

.subscription-center .record-button.button_primary:hover {
  border-color: color-mix(in srgb, var(--color-report-blue) 80%, var(--color-black));
  background: color-mix(in srgb, var(--color-report-blue) 80%, var(--color-black));
}

.subscription-center .record-button.button_cancel {
  border-color: transparent;
  background: color-mix(in srgb, var(--color-report-blue) 8%, var(--color-surface));
  color: var(--color-report-blue);
}

.subscription-center .record-button.button_cancel:hover {
  border-color: color-mix(in srgb, var(--color-report-blue) 24%, var(--color-line));
  background: color-mix(in srgb, var(--color-report-blue) 13%, var(--color-surface));
}

.record-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: clamp(28px, 2.5vw, 40px) 24px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-alt);
  text-align: center;
}

.record-empty strong {
  color: var(--color-ink);
  font-size: var(--text-base);
}

.record-empty span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.record-empty button {
  margin-top: 8px;
}

.record-empty--error strong,
.record-empty--error span {
  color: var(--color-danger);
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

.record-status--pending,
.record-status--refunding {
  background: var(--color-warning-bg);
  color: var(--color-warning);
}

.record-status--paid {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.record-status--failed,
.record-status--refunded {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.record-status--closed {
  background: var(--color-hover);
  color: var(--color-ink-muted);
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

.goal-grid :deep(.el-select) {
  width: 100%;
}
</style>
