<template>
  <div class="auth-page">
    <NavBar />
    <main class="auth-main">
      <div class="auth-shell auth-shell--single">
        <section class="auth-card">
          <div class="auth-card-heading">
            <h1 class="auth-title">重置密码</h1>
            <p class="auth-subtitle">验证注册邮箱并设置新密码，完成后将退出所有设备。</p>
          </div>

          <el-form class="auth-form" label-position="top" @submit.prevent="handleReset">
            <el-form-item label="电子邮箱">
              <el-input
                v-model="form.email"
                autocomplete="email"
                placeholder="example@mail.com"
                @input="resetEmailChallenge"
              />
            </el-form-item>
            <el-form-item label="邮箱验证码">
              <div class="verification-row">
                <el-input
                  v-model="form.emailCode"
                  maxlength="6"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="六位验证码"
                  @input="handleEmailCodeInput"
                />
                <el-button
                  :loading="sending"
                  :disabled="sending || countdown > 0"
                  @click="handleSendCode"
                >
                  {{ countdown > 0 ? `${countdown}秒后重发` : '获取验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item label="新密码">
              <el-input
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                maxlength="12"
                placeholder="8-12位，包含英文和数字，可使用 !@#$%"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input
                v-model="form.confirmPassword"
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
              :loading="submitting"
            >
              {{ submitting ? '提交中...' : '重置密码' }}
            </el-button>
          </el-form>

          <p class="auth-footer forgot-password-footer">
            <router-link to="/login" class="auth-link">
              <span class="back-icon" aria-hidden="true">←</span>
              返回登录
            </router-link>
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 忘记密码页通过注册邮箱验证码重置密码，并使原有会话失效。
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import { resetPassword, sendEmailCode } from '@/api/auth'
import {
  EMAIL_CODE_PATTERN,
  normalizeEmailCode,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from '@/utils/validation'
import './auth-page.css'

const router = useRouter()
const form = reactive({
  email: '',
  emailCode: '',
  password: '',
  confirmPassword: '',
})
const challengeId = ref('')
const sending = ref(false)
const submitting = ref(false)
const countdown = ref(0)
let timer: number | undefined

// 邮箱变化后废弃旧挑战，防止验证码被用于不同邮箱。
function resetEmailChallenge(): void {
  challengeId.value = ''
  form.emailCode = ''
}

// 输入阶段过滤非数字，保证验证码模型始终符合提交格式。
function handleEmailCodeInput(value: string): void {
  form.emailCode = normalizeEmailCode(value)
}

// 重发倒计时使用服务端返回间隔，避免客户端与限流时间不一致。
function startCountdown(seconds: number): void {
  if (timer) window.clearInterval(timer)
  countdown.value = seconds
  timer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && timer) {
      window.clearInterval(timer)
      timer = undefined
    }
  }, 1000)
}

// 忘记密码验证码发送前先校验邮箱，并保存本次重置挑战。
async function handleSendCode(): Promise<void> {
  const result = validateEmail(form.email)
  if (!result.valid) {
    ElMessage.warning(result.message)
    return
  }
  sending.value = true
  try {
    const data = await sendEmailCode(form.email, 'RESET_PASSWORD')
    challengeId.value = data.challengeId
    startCountdown(data.resendAfter)
    ElMessage.success('如果该邮箱已注册，验证码邮件会很快送达')
  } catch (error: any) {
    ElMessage.error(error?.message || '验证码发送失败')
  } finally {
    sending.value = false
  }
}

// 重置密码前统一校验邮箱、挑战和新密码，避免无效请求进入后端。
async function handleReset(): Promise<void> {
  const emailResult = validateEmail(form.email)
  const passwordResult = validatePassword(form.password)
  const confirmResult = validateConfirmPassword(form.password, form.confirmPassword)
  if (!emailResult.valid) {
    ElMessage.warning(emailResult.message)
    return
  }
  if (!EMAIL_CODE_PATTERN.test(form.emailCode) || !challengeId.value) {
    ElMessage.warning('请获取并输入六位验证码')
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

  submitting.value = true
  try {
    await resetPassword({ ...form, challengeId: challengeId.value })
    ElMessage.success('密码已重置，请使用新密码登录')
    router.push('/login')
  } catch (error: any) {
    ElMessage.error(error?.message || '密码重置失败')
  } finally {
    submitting.value = false
  }
}

// 页面离开时释放倒计时，避免卸载后继续更新组件状态。
onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<style scoped>
.auth-shell--single {
  grid-template-columns: minmax(0, 520px);
  justify-content: center;
}

.auth-card-heading {
  margin-bottom: 32px;
}

.auth-card-heading .auth-title {
  margin-bottom: 10px;
  font-size: clamp(28px, 2vw, 32px);
  line-height: 1.2;
}

.auth-card-heading .auth-subtitle {
  margin: 0;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.verification-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  gap: 12px;
  width: 100%;
}

.forgot-password-footer {
  margin-top: 24px;
}

.forgot-password-footer .auth-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  text-decoration: none;
}

.back-icon {
  transition: transform var(--duration-base) ease;
}

.forgot-password-footer .auth-link:hover .back-icon {
  transform: translateX(-3px);
}
</style>
