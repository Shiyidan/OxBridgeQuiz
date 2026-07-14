<template>
  <div class="register-page">
    <NavBar />

    <main class="register-main">
      <section class="register-card">
        <h1 class="register-title">创建账号</h1>
        <p class="register-subtitle">注册后即可查看完整诊断报告</p>

        <el-form
          ref="formRef"
          class="register-form auth-form"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <div class="register-form-grid">
            <section class="register-form-section">
              <div class="form-section-heading">
                <span>01</span>
                <div>
                  <h2>账号信息</h2>
                  <p>用于登录、邮箱验证和账号安全。</p>
                </div>
              </div>

              <el-form-item label="用户名" prop="username">
                <el-input
                  v-model="form.username"
                  placeholder="请输入用户名"
                  autocomplete="username"
                  maxlength="30"
                  show-word-limit
                />
                <template #extra>
                  <span class="field-hint"
                    >4-30位中文、英文、数字、_ 或 -，首尾不能为 _ 或 -，不能为纯数字</span
                  >
                </template>
              </el-form-item>

              <el-form-item label="电子邮箱" prop="email">
                <el-input
                  v-model="form.email"
                  placeholder="example@mail.com"
                  autocomplete="email"
                  @input="handleEmailInput"
                />
              </el-form-item>

              <el-form-item label="邮箱验证码" prop="emailCode">
                <div class="verification-row">
                  <el-input
                    v-model="form.emailCode"
                    placeholder="请输入六位验证码"
                    maxlength="6"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    @input="handleEmailCodeInput"
                  />
                  <el-button
                    :loading="codeSending"
                    :disabled="codeSending || countdown > 0"
                    @click="handleSendCode"
                  >
                    {{ countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
                  </el-button>
                </div>
              </el-form-item>

              <el-form-item label="密码" prop="password">
                <el-input
                  v-model="form.password"
                  type="password"
                  placeholder="请输入密码"
                  autocomplete="new-password"
                  maxlength="12"
                  show-password
                />
                <template #extra>
                  <span class="field-hint">8-12位，必须包含英文和数字，特殊字符仅支持 !@#$%</span>
                </template>
              </el-form-item>

              <el-form-item label="确认密码" prop="confirmPassword">
                <el-input
                  v-model="form.confirmPassword"
                  type="password"
                  placeholder="再次输入密码"
                  autocomplete="new-password"
                  maxlength="12"
                  show-password
                />
              </el-form-item>
            </section>

            <section class="register-form-section register-form-section--exam">
              <div class="form-section-heading">
                <span>02</span>
                <div>
                  <h2>备考信息</h2>
                  <p>补充个性化学习目标，形成学习档案与诊断报告</p>
                </div>
              </div>

              <el-form-item label="备考类型（可多选）">
                <div class="exam-type-group">
                  <label
                    v-for="et in examTypes"
                    :key="et.value"
                    class="exam-type-chip"
                    :class="{
                      'exam-type-chip--active': selectedExamTypes.includes(et.value),
                      'exam-type-chip--unavailable': !et.available,
                    }"
                    :aria-disabled="!et.available"
                    @click.prevent="toggleExamType(et.value)"
                  >
                    <input
                      type="checkbox"
                      :value="et.value"
                      :checked="selectedExamTypes.includes(et.value)"
                      class="sr-only"
                    />
                    {{ et.label }}
                    <small v-if="!et.available">推进中</small>
                  </label>
                </div>
              </el-form-item>

              <el-form-item v-if="selectedExamTypes.length" label="备考科目">
                <div class="subject-list">
                  <div v-for="et in selectedExamTypes" :key="et" class="subject-group">
                    <span class="subject-exam-label"
                      >{{ examTypeLabel(et) }}{{ et === 'ESAT' ? '（最多选 3 科）' : '' }}</span
                    >
                    <div class="subject-chip-group">
                      <label
                        v-for="sub in examSubjects[et]"
                        :key="sub"
                        class="subject-chip"
                        :class="{
                          'subject-chip--active': selectedSubjects[et]?.includes(sub),
                          'subject-chip--required': isSubjectRequired(et, sub),
                        }"
                      >
                        <input
                          type="checkbox"
                          :value="sub"
                          :checked="selectedSubjects[et]?.includes(sub)"
                          :disabled="isSubjectDisabled(et, sub)"
                          class="sr-only"
                          @change="toggleSubject(et, sub)"
                        />
                        {{ sub }}
                      </label>
                    </div>
                  </div>
                </div>
              </el-form-item>

              <div v-if="selectedExamTypes.length" class="exam-goal-list">
                <article
                  v-for="et in selectedExamTypes"
                  :key="`${et}-goals`"
                  class="exam-goal-card"
                >
                  <div class="exam-goal-heading">
                    <strong>{{ examTypeLabel(et) }}</strong>
                    <span>目标信息（选填）</span>
                  </div>
                  <div class="exam-goal-grid">
                    <label class="exam-goal-field exam-goal-field--wide">
                      <span>目标院校（最多选择 2 个）</span>
                      <el-select
                        v-model="selectedGoals[et]!.targetUniversities"
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
                    <label class="exam-goal-field exam-goal-field--wide">
                      <span>目标专业</span>
                      <el-input
                        v-model="selectedGoals[et]!.targetMajor"
                        maxlength="191"
                        placeholder="例如：Mechanical Engineering"
                      />
                    </label>
                    <label v-if="et === 'ESAT'" class="exam-goal-field">
                      <span>ESAT 目标分数</span>
                      <el-input
                        v-model="selectedGoals[et]!.targetScore"
                        type="number"
                        min="1"
                        max="9"
                        step="0.1"
                        placeholder="1.0-9.0"
                      />
                    </label>
                    <label class="exam-goal-field">
                      <span>考试日期</span>
                      <el-date-picker
                        v-model="selectedGoals[et]!.examDate"
                        type="date"
                        value-format="YYYY-MM-DD"
                        format="YYYY-MM-DD"
                        placeholder="选择日期"
                      />
                    </label>
                    <label class="exam-goal-field">
                      <span>每周可投入时长</span>
                      <el-input
                        v-model="selectedGoals[et]!.weeklyHours"
                        type="number"
                        min="1"
                        max="80"
                        step="1"
                        placeholder="1-80 小时"
                      />
                    </label>
                  </div>
                </article>
              </div>

              <div v-else class="exam-empty-state">
                选择备考类型后，可继续设置科目、目标院校和学习计划。
              </div>
            </section>
          </div>

          <el-form-item class="register-submit-row">
            <el-button
              type="primary"
              class="register-submit button_primary"
              :loading="auth.loading"
              native-type="submit"
            >
              {{ auth.loading ? '注册中...' : '注册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <p class="register-footnote">
          已有账号？
          <router-link :to="loginLocation" class="form-link form-link--back">
            <span class="back-icon" aria-hidden="true">←</span>
            去登录
          </router-link>
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// 注册页：创建账号并进入登录态，完成后返回认证流程开始前的目标页面。
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { getMember } from '@/api/member'
import { sendEmailCode } from '@/api/auth'
import {
  EXAM_TYPE_OPTIONS,
  getExamUnavailableMessage,
  isExamTypeAvailable,
} from '@/constants/examTypes'
import { TARGET_UNIVERSITY_OPTIONS } from '@/constants/universities'
import { createAuthRouteLocation, getSafeAuthRedirect } from '@/utils/authRedirect'
import {
  validateConfirmPassword,
  EMAIL_CODE_PATTERN,
  validateEmail,
  validatePassword,
  validateUsername,
  normalizeEmailCode,
} from '@/utils/validation'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const formRef = ref<FormInstance>()

// 从注册页查询参数恢复受保护目标，并过滤非站内地址。
const redirectAfterAuth = computed(() => getSafeAuthRedirect(route.query.redirect))

// 用户返回登录页时继续保留最初访问的目标页面。
const loginLocation = computed(() => createAuthRouteLocation('login', redirectAfterAuth.value))

const form = reactive({
  username: '',
  email: '',
  emailCode: '',
  password: '',
  confirmPassword: '',
})

// 复用共享校验规则，确保注册页与后端基础规则保持一致。
const rules: FormRules = {
  username: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validateUsername(value)
        if (result.valid) callback()
        else callback(new Error(result.message))
      },
      trigger: 'blur',
    },
  ],
  email: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validateEmail(value)
        if (result.valid) callback()
        else callback(new Error(result.message))
      },
      trigger: 'blur',
    },
  ],
  emailCode: [
    {
      validator: (_rule, value: string, callback) => {
        if (EMAIL_CODE_PATTERN.test(value)) callback()
        else callback(new Error('请输入六位数字验证码'))
      },
      trigger: 'blur',
    },
  ],
  password: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validatePassword(value)
        if (result.valid) callback()
        else callback(new Error(result.message))
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validateConfirmPassword(form.password, value)
        if (result.valid) callback()
        else callback(new Error(result.message))
      },
      trigger: 'blur',
    },
  ],
}

// STEP 注册入口暂时隐藏；考试开放后移除 filter 即可恢复现有选择、科目和目标表单逻辑。
const examTypes = EXAM_TYPE_OPTIONS.filter((item) => item.value !== 'STEP')

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

// 注册时保存备考偏好，后续用于个人中心和各考试类型默认展示。
const selectedExamTypes = ref<string[]>([])
const selectedSubjects = ref<Record<string, string[]>>({})
interface ExamGoalDraft {
  targetUniversities: string[]
  targetMajor: string
  targetScore: string
  examDate: string
  weeklyHours: string
}
const selectedGoals = ref<Record<string, ExamGoalDraft>>({})
const ESAT_MAX_SUBJECTS = 3
const challengeId = ref('')
const codeSending = ref(false)
const countdown = ref(0)
let countdownTimer: number | undefined

// 重发倒计时使用服务端返回间隔，避免客户端与限流时间不一致。
function startCountdown(seconds: number): void {
  if (countdownTimer) window.clearInterval(countdownTimer)
  countdown.value = seconds
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && countdownTimer) {
      window.clearInterval(countdownTimer)
      countdownTimer = undefined
    }
  }, 1000)
}

// 邮箱变化后废弃旧挑战，防止验证码绑定到已修改的邮箱。
function handleEmailInput(): void {
  challengeId.value = ''
  form.emailCode = ''
}

// 输入阶段过滤非数字，保证验证码模型始终符合提交格式。
function handleEmailCodeInput(value: string): void {
  form.emailCode = normalizeEmailCode(value)
}

// 注册验证码发送前先校验邮箱，并保存后续注册消费的挑战标识。
async function handleSendCode(): Promise<void> {
  const emailResult = validateEmail(form.email)
  if (!emailResult.valid) {
    ElMessage.warning(emailResult.message)
    return
  }
  codeSending.value = true
  try {
    const data = await sendEmailCode(form.email, 'REGISTER')
    challengeId.value = data.challengeId
    startCountdown(data.resendAfter)
    ElMessage({
      type: 'success',
      message: '验证码已发送，请检查邮箱',
      showClose: true,
      duration: 3000,
    })
  } catch (error: unknown) {
    ElMessage({
      type: 'error',
      message: error instanceof Error ? error.message : '验证码发送失败',
      showClose: true,
      duration: 4000,
    })
  } finally {
    codeSending.value = false
  }
}

// 页面离开时释放倒计时，避免卸载后继续更新组件状态。
onBeforeUnmount(() => {
  if (countdownTimer) window.clearInterval(countdownTimer)
})

// 考试类型展示名从统一选项读取，避免页面直接展示内部值。
function examTypeLabel(value: string): string {
  return examTypes.find((e) => e.value === value)?.label || value
}

// 必选科目由考试类型规则集中判断，供默认选择和交互限制共用。
function isSubjectRequired(examType: string, subject: string): boolean {
  return (examRequiredSubjects[examType] || []).includes(subject)
}

// 必选科目和 ESAT 数量上限在交互层同步锁定，防止选择状态失真。
function isSubjectDisabled(examType: string, subject: string): boolean {
  if (isSubjectRequired(examType, subject)) return true
  if (examType === 'ESAT') {
    const current = selectedSubjects.value.ESAT || []
    return current.length >= ESAT_MAX_SUBJECTS && !current.includes(subject)
  }
  return false
}

// 每种考试使用独立目标草稿，避免不同考试共享表单状态。
function emptyExamGoal(): ExamGoalDraft {
  return {
    targetUniversities: [],
    targetMajor: '',
    targetScore: '',
    examDate: '',
    weeklyHours: '',
  }
}

// 切换考试类型时同步初始化或清理科目与目标，避免提交残留数据。
function toggleExamType(value: string): void {
  if (!isExamTypeAvailable(value)) {
    ElMessage.info(getExamUnavailableMessage(value))
    return
  }
  const idx = selectedExamTypes.value.indexOf(value)
  if (idx >= 0) {
    selectedExamTypes.value.splice(idx, 1)
    delete selectedSubjects.value[value]
    delete selectedGoals.value[value]
  } else {
    selectedExamTypes.value.push(value)
    selectedExamTypes.value.sort(
      (left, right) =>
        examTypes.findIndex((item) => item.value === left) -
        examTypes.findIndex((item) => item.value === right),
    )
    // 必选科目需要在选择考试类型时自动带入。
    selectedSubjects.value[value] = [...(examRequiredSubjects[value] || [])]
    selectedGoals.value[value] = emptyExamGoal()
  }
}

// 只允许修改可选科目，必选科目始终遵守注册规则。
function toggleSubject(examType: string, subject: string): void {
  if (isSubjectDisabled(examType, subject)) return
  const subs = selectedSubjects.value[examType] || []
  const idx = subs.indexOf(subject)
  if (idx >= 0) subs.splice(idx, 1)
  else subs.push(subject)
  selectedSubjects.value[examType] = subs
}

// 注册提交前统一校验账号、验证码和各考试目标，再构造后端契约。
const handleSubmit = async (): Promise<void> => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (!challengeId.value) {
    ElMessage.warning('请先获取邮箱验证码')
    return
  }
  for (const et of selectedExamTypes.value) {
    const goal = selectedGoals.value[et] || emptyExamGoal()
    if (goal.targetUniversities.length > 2) {
      ElMessage.warning(`${et} 目标院校最多选择 2 个`)
      return
    }
    const targetScoreText = goal.targetScore.trim()
    const targetScore = Number(targetScoreText)
    if (
      et === 'ESAT' &&
      targetScoreText &&
      (!Number.isFinite(targetScore) || targetScore < 1 || targetScore > 9)
    ) {
      ElMessage.warning('ESAT 目标分数需为 1.0-9.0')
      return
    }
    const weeklyHoursText = goal.weeklyHours.trim()
    const weeklyHours = Number(weeklyHoursText)
    if (
      weeklyHoursText &&
      (!Number.isInteger(weeklyHours) || weeklyHours < 1 || weeklyHours > 80)
    ) {
      ElMessage.warning(`${et} 每周可投入时长需为 1-80 的整数`)
      return
    }
  }
  const examPrefs = selectedExamTypes.value.map((et) => {
    const goal = selectedGoals.value[et] || emptyExamGoal()
    const targetScore = Number(goal.targetScore)
    const weeklyHours = Number(goal.weeklyHours)
    return {
      examType: et,
      subjects: selectedSubjects.value[et] || [],
      ...(goal.targetUniversities.length
        ? { targetUniversities: [...goal.targetUniversities] }
        : {}),
      ...(goal.targetMajor.trim() ? { targetMajor: goal.targetMajor.trim() } : {}),
      ...(et === 'ESAT' && goal.targetScore.trim() ? { targetScore } : {}),
      ...(goal.examDate ? { examDate: goal.examDate } : {}),
      ...(goal.weeklyHours.trim() ? { weeklyHours } : {}),
    }
  })

  try {
    await auth.register({
      username: form.username,
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      challengeId: challengeId.value,
      emailCode: form.emailCode,
      examPreferences: examPrefs,
    })
  } catch (error: unknown) {
    ElMessage({
      type: 'error',
      message: error instanceof Error ? error.message : auth.error || '注册失败，请稍后重试',
      showClose: true,
      duration: 4000,
    })
    return
  }

  ElMessage({
    type: 'success',
    message: '注册成功',
    showClose: true,
    duration: 2500,
  })
  try {
    const memberCtx = await getMember()
    auth.setMemberContext(memberCtx)
  } catch {
    // 会员上下文可以在后续页面重新加载，不阻断已经成功的注册流程。
  }
  await router.replace(redirectAfterAuth.value)
}
</script>

<!-- 复用登录页的认证表单输入规格，注册页仅保留自身布局样式。 -->
<style src="./auth-page.css"></style>

<style scoped lang="scss">
.register-page {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-border: #e2e8f0;
  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --shadow-card: 0 4px 24px -4px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);

  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-bg);
  color: var(--color-text);
}

.register-main {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--space-12) 1rem;
  overflow-y: auto;
}

.register-card {
  width: 100%;
  max-width: 1080px;
  margin-block: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-12) var(--space-10);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.register-title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.register-subtitle {
  margin: 0 0 var(--space-8);
  font-size: 0.938rem;
  color: var(--color-text-muted);
}

.register-form {
  text-align: left;
}

.register-form :deep(.el-form-item__error) {
  padding-top: 3px;
  font-size: 0.75rem;
  line-height: 1.25;
  white-space: nowrap;
}

.register-form-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 40px;
  align-items: stretch;
}

.register-form-section {
  min-width: 0;
}

.register-form-section--exam {
  padding-left: 40px;
  border-left: 1px solid var(--color-border);
}

.form-section-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}

.form-section-heading > span {
  display: grid;
  place-items: center;
  flex: 0 0 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-text);
  color: var(--color-text-inverse);
  font-size: 0.75rem;
  font-weight: 700;
}

.form-section-heading h2 {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.4;
}

.form-section-heading p {
  margin: 4px 0 0;
  color: var(--color-text-muted);
  font-size: 0.813rem;
  line-height: 1.5;
}

.verification-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  gap: 12px;
  width: 100%;
}

.verification-row :deep(.el-button) {
  height: 48px;
}

.field-hint {
  font-size: 0.813rem;
  color: var(--color-text-muted);
}

.form-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color var(--duration-base) ease;

  &:hover {
    border-bottom-color: var(--color-ink);
  }
}

.form-link--back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
}

.back-icon {
  transition: transform var(--duration-base) ease;
}

.form-link--back:hover .back-icon {
  transform: translateX(-3px);
}

.register-submit {
  width: 100%;
}

.register-submit-row {
  max-width: 360px;
  margin: 32px auto 0;
}

.register-footnote {
  margin: var(--space-8) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
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
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--color-text);
  }
}

.exam-type-chip--active,
.subject-chip--active {
  background: var(--color-text);
  color: var(--color-text-inverse);
  border-color: var(--color-text);
}

.exam-type-chip--unavailable {
  gap: 7px;
  border-style: dashed;
  color: var(--color-text-secondary);
}

.exam-type-chip--unavailable:hover {
  border-color: var(--color-border);
}

.exam-type-chip--unavailable small {
  font-size: 0.6875rem;
  font-weight: var(--weight-semi);
}

.subject-chip--required {
  cursor: not-allowed;
}

.subject-group {
  width: 100%;
}

.subject-list {
  display: grid;
  gap: 16px;
  width: 100%;
}

.subject-exam-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.813rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.exam-goal-list {
  display: grid;
  gap: 14px;
}

.exam-goal-card {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: #f8fafc;
}

.exam-goal-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.exam-goal-heading strong {
  font-size: 0.938rem;
}

.exam-goal-heading span,
.exam-goal-field > span {
  color: var(--color-text-muted);
  font-size: 0.75rem;
}

.exam-goal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.exam-goal-field {
  display: grid;
  gap: 6px;
  align-content: start;
  min-width: 0;
}

.exam-goal-field--wide {
  grid-column: 1 / -1;
}

.exam-goal-field :deep(.el-date-editor) {
  width: 100%;
  height: var(--height-input);
}

.exam-goal-field :deep(.el-select) {
  width: 100%;
}

.exam-goal-field :deep(.el-select__wrapper) {
  min-height: var(--height-input);
  padding: 0 14px;
}

.exam-empty-state {
  padding: 28px 20px;
  border: 1px dashed var(--color-border);
  border-radius: 10px;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  line-height: 1.7;
  text-align: center;
}

@media (max-width: 900px) {
  .register-form-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .register-form-section--exam {
    padding-top: 32px;
    padding-left: 0;
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }
}

@media (max-width: 640px) {
  .register-card {
    padding: var(--space-10) 1.5rem;
    border-radius: var(--radius-xl);
  }

  .exam-goal-grid {
    grid-template-columns: 1fr;
  }

  .exam-goal-field--wide {
    grid-column: auto;
  }

  .register-form :deep(.el-form-item__error) {
    white-space: normal;
  }
}
</style>
