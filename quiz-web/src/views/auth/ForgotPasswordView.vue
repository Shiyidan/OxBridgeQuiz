<template>
  <div class="auth-page">
    <NavBar />
    <main class="auth-main">
      <div class="auth-shell auth-shell--single">
        <section class="auth-card">
          <div class="auth-card-heading">
            <span class="auth-kicker">账号安全</span>
            <h2>重置密码</h2>
            <p>验证注册邮箱后设置新密码，原有设备将全部退出。</p>
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
                  placeholder="六位验证码"
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
                placeholder="8-128位，包含字母和数字"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                autocomplete="new-password"
                placeholder="再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-button class="auth-submit button_primary" native-type="submit" :loading="submitting">
              {{ submitting ? '提交中...' : '重置密码' }}
            </el-button>
          </el-form>

          <p class="auth-switch"><router-link to="/login">返回登录</router-link></p>
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
import { validateConfirmPassword, validateEmail, validatePassword } from '@/utils/validation'
import './auth-page.css'

const router = useRouter()
const form = reactive({ email: '', emailCode: '', password: '', confirmPassword: '' })
const challengeId = ref('')
const sending = ref(false)
const submitting = ref(false)
const countdown = ref(0)
let timer: number | undefined

function resetEmailChallenge(): void {
  challengeId.value = ''
  form.emailCode = ''
}

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

async function handleReset(): Promise<void> {
  const emailResult = validateEmail(form.email)
  const passwordResult = validatePassword(form.password)
  const confirmResult = validateConfirmPassword(form.password, form.confirmPassword)
  if (!emailResult.valid) {
    ElMessage.warning(emailResult.message)
    return
  }
  if (!/^\d{6}$/.test(form.emailCode) || !challengeId.value) {
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

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
})
</script>

<style scoped>
.auth-shell--single {
  grid-template-columns: minmax(0, 520px);
  justify-content: center;
}

.verification-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px;
  gap: 12px;
  width: 100%;
}
</style>
