<template>
  <div class="auth-page">
    <NavBar />

    <main class="auth-main">
      <div class="auth-shell">
        <!-- 左侧品牌介绍（桌面） -->
        <aside class="auth-side">
          <div class="auth-eyebrow">
            <span class="auth-eyebrow-dot"></span>
            <span>精准诊断，让备考的每一步都算数</span>
          </div>
          <h1 class="auth-headline">登录你的备考账户</h1>
          <p class="auth-sub">登录后即可查看完整诊断报告、错题攻克进度和 14 天动态学习路径。</p>
          <ul class="auth-features">
            <li v-for="f in features" :key="f">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M3 8l3 3 7-7"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>{{ f }}</span>
            </li>
          </ul>
        </aside>

        <!-- 右侧表单卡片 -->
        <section class="auth-card">
          <div class="auth-brand" aria-hidden="true">
            <span class="auth-brand-mark">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path
                  d="M5 7V4.5C5 3.12 6.12 2 7.5 2H8.5C9.88 2 11 3.12 11 4.5V7M3 7H13L12 14H4L3 7Z"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </div>
          <h2 class="auth-title">{{ isResetMode ? '重置密码' : '欢迎回来' }}</h2>
          <p class="auth-subtitle">
            {{
              isResetMode
                ? '验证注册邮箱并设置新密码，完成后将退出所有设备。'
                : '使用你的账号继续备考旅程'
            }}
          </p>

          <div v-if="!isResetMode && auth.error" class="auth-alert">{{ auth.error }}</div>

          <el-form
            v-if="!isResetMode"
            ref="formRef"
            class="auth-form"
            :model="form"
            :rules="rules"
            label-position="top"
            @submit.prevent="handleSubmit"
          >
            <el-form-item label="用户名或邮箱" prop="username">
              <el-input
                v-model="form.username"
                placeholder="请输入用户名或邮箱"
                autocomplete="username"
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                autocomplete="current-password"
                show-password
              />
              <div class="auth-form-extra">
                <a class="auth-link auth-link-muted" @click.prevent="handleForgotPassword"
                  >忘记密码？</a
                >
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                class="auth-submit button_primary"
                :loading="auth.loading"
                native-type="submit"
              >
                {{ auth.loading ? '登录中...' : '登录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <el-form
            v-else
            ref="resetFormRef"
            class="auth-form"
            :model="resetForm"
            :rules="resetRules"
            label-position="top"
            @submit.prevent="handleReset"
          >
            <el-form-item label="电子邮箱" prop="email">
              <el-input
                v-model="resetForm.email"
                autocomplete="email"
                placeholder="example@mail.com"
                @input="resetEmailChallenge"
              />
            </el-form-item>

            <el-form-item label="邮箱验证码" prop="emailCode">
              <div class="auth-verification-row">
                <el-input
                  v-model="resetForm.emailCode"
                  maxlength="6"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="六位验证码"
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

            <el-form-item label="新密码" prop="password">
              <el-input
                v-model="resetForm.password"
                type="password"
                autocomplete="new-password"
                maxlength="12"
                placeholder="8-12位，包含英文和数字，可使用 !@#$%"
                show-password
              />
            </el-form-item>

            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input
                v-model="resetForm.confirmPassword"
                type="password"
                autocomplete="new-password"
                maxlength="12"
                placeholder="再次输入新密码"
                show-password
              />
            </el-form-item>

            <el-button
              class="auth-submit button_primary"
              native-type="submit"
              :loading="resetSubmitting"
            >
              {{ resetSubmitting ? '提交中...' : '重置密码' }}
            </el-button>
          </el-form>

          <p v-if="!isResetMode" class="auth-footer">
            还没有账号？
            <router-link :to="registerLocation" class="auth-link">立即注册</router-link>
          </p>
          <p v-else class="auth-footer auth-reset-footer">
            <a class="auth-link auth-back-link" @click.prevent="showLoginMode">
              <span aria-hidden="true">←</span>
              返回登录
            </a>
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 登录页：承载登录和密码重置模块，认证后返回用户原先访问的受保护页面。
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { resetPassword, sendEmailCode } from '@/api/auth'
import { getMember } from '@/api/member'
import { createAuthRouteLocation, getSafeAuthRedirect } from '@/utils/authRedirect'
import {
  EMAIL_CODE_PATTERN,
  normalizeEmailCode,
  validateConfirmPassword,
  validateEmail,
  validateLoginIdentifier,
  validatePassword,
  validatePasswordRequired,
} from '@/utils/validation'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const resetFormRef = ref<FormInstance>()
const isResetMode = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const resetForm = reactive({
  email: '',
  emailCode: '',
  password: '',
  confirmPassword: '',
})
const challengeId = ref('')
const codeSending = ref(false)
const resetSubmitting = ref(false)
const countdown = ref(0)
let countdownTimer: number | undefined

// 左侧品牌区特性卡文案，与首页 Hero 卖点保持一致。
const features = [
  '30 分钟完成一次完整诊断',
  '错题自动归因，AI 生成攻克路径',
  '14 天动态学习路径持续更新',
]

// 从登录页查询参数恢复受保护目标，并过滤非站内地址。
const redirectAfterAuth = computed(() => getSafeAuthRedirect(route.query.redirect))

// 用户改走注册流程时继续保留最初访问的目标页面。
const registerLocation = computed(() =>
  createAuthRouteLocation('register', redirectAfterAuth.value),
)

// 复用共享校验规则，登录页只校验用户名和密码是否可用于提交。
const rules: FormRules = {
  username: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validateLoginIdentifier(value)
        if (result.valid) {
          callback()
        } else {
          callback(new Error(result.message))
        }
      },
      trigger: 'blur',
    },
  ],
  password: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validatePasswordRequired(value)
        if (result.valid) {
          callback()
        } else {
          callback(new Error(result.message))
        }
      },
      trigger: 'blur',
    },
  ],
}

// 重置模块复用共享正则，并通过表单项在失焦和提交时展示字段错误。
const resetRules: FormRules = {
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
        if (!EMAIL_CODE_PATTERN.test(value)) {
          callback(new Error('请输入六位数字验证码'))
        } else if (!challengeId.value) {
          callback(new Error('请先获取邮箱验证码'))
        } else {
          callback()
        }
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
        const result = validateConfirmPassword(resetForm.password, value)
        if (result.valid) callback()
        else callback(new Error(result.message))
      },
      trigger: 'blur',
    },
  ],
}

// 登录成功后拉一次会员上下文，缓存到 auth store 供后续页面复用。
const handleSubmit = async (): Promise<void> => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  try {
    await auth.login(form.username, form.password)
    try {
      const memberCtx = await getMember()
      auth.setMemberContext(memberCtx)
    } catch {
      // 会员上下文可由目标页面重新加载，不阻断已经成功的登录流程。
    }
    await router.replace(redirectAfterAuth.value)
  } catch {
    // 错误信息已写入 auth.error，模板顶部的 .auth-alert 会展示。
  }
}

// 忘记密码入口在当前登录卡片内切换模块，不再进入独立路由。
const handleForgotPassword = (): void => {
  isResetMode.value = true
}

// 邮箱变化后废弃旧挑战，防止验证码被用于不同邮箱。
function resetEmailChallenge(): void {
  challengeId.value = ''
  resetForm.emailCode = ''
  resetFormRef.value?.clearValidate('emailCode')
}

// 输入阶段过滤非数字，保证验证码模型始终符合提交格式。
function handleEmailCodeInput(value: string): void {
  resetForm.emailCode = normalizeEmailCode(value)
}

// 释放当前倒计时，避免模块切换后继续更新隐藏状态。
function stopCountdown(): void {
  if (!countdownTimer) return
  window.clearInterval(countdownTimer)
  countdownTimer = undefined
}

// 重发倒计时使用服务端返回间隔，避免客户端与限流时间不一致。
function startCountdown(seconds: number): void {
  stopCountdown()
  countdown.value = seconds
  countdownTimer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) stopCountdown()
  }, 1000)
}

// 忘记密码验证码发送前先校验邮箱，并保存本次重置挑战。
async function handleSendCode(): Promise<void> {
  if (!resetFormRef.value) return
  try {
    await resetFormRef.value.validateField('email')
  } catch {
    return
  }
  codeSending.value = true
  try {
    const data = await sendEmailCode(resetForm.email, 'RESET_PASSWORD')
    challengeId.value = data.challengeId
    resetFormRef.value?.clearValidate('emailCode')
    startCountdown(data.resendAfter)
    ElMessage.success('如果该邮箱已注册，验证码邮件会很快送达')
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '验证码发送失败')
  } finally {
    codeSending.value = false
  }
}

// 清空重置模块的临时挑战与密码，返回登录时不保留敏感输入。
function clearResetState(): void {
  stopCountdown()
  resetForm.email = ''
  resetForm.emailCode = ''
  resetForm.password = ''
  resetForm.confirmPassword = ''
  challengeId.value = ''
  countdown.value = 0
  resetFormRef.value?.clearValidate()
}

// 重置密码前统一校验邮箱、挑战和新密码，避免无效请求进入后端。
async function handleReset(): Promise<void> {
  if (!resetFormRef.value) return
  try {
    await resetFormRef.value.validate()
  } catch {
    return
  }

  resetSubmitting.value = true
  try {
    await resetPassword({ ...resetForm, challengeId: challengeId.value })
    ElMessage.success('密码已重置，请使用新密码登录')
    clearResetState()
    isResetMode.value = false
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : '密码重置失败')
  } finally {
    resetSubmitting.value = false
  }
}

// 返回登录模块时销毁验证码挑战和密码草稿。
function showLoginMode(): void {
  clearResetState()
  isResetMode.value = false
}

// 登录页卸载时释放验证码倒计时。
onBeforeUnmount(stopCountdown)
</script>

<!-- 认证类页面共享布局，非 scoped，按需引入以避免全站污染。 -->
<style src="./auth-page.css"></style>
