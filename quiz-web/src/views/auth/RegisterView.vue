<template>
  <div class="register-page">
    <NavBar />

    <main class="register-main">
      <section class="register-card">
        <div class="register-brand">
          <span class="brand-mark">G5</span>
        </div>

        <h1 class="register-title">创建账号</h1>
        <p class="register-subtitle">注册后即可查看完整诊断报告</p>

        <form class="register-form" @submit.prevent="handleSubmit" novalidate>
          <div v-if="auth.error" class="form-error">{{ auth.error }}</div>

          <div class="form-field">
            <label for="reg-name" class="form-label">姓名</label>
            <input
              id="reg-name"
              v-model="form.name"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.name }"
              placeholder="您的姓名"
              autocomplete="name"
              @input="clearError('name')"
            />
            <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
          </div>

          <div class="form-field">
            <label for="reg-email" class="form-label">电子邮箱</label>
            <input
              id="reg-email"
              v-model="form.email"
              type="text"
              class="form-input"
              :class="{ 'input-error': errors.email }"
              placeholder="example@mail.com"
              autocomplete="email"
              @input="clearError('email')"
            />
            <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
          </div>

          <div class="form-field">
            <label for="reg-password" class="form-label">密码</label>
            <input
              id="reg-password"
              v-model="form.password"
              type="password"
              class="form-input"
              :class="{ 'input-error': errors.password }"
              placeholder="••••••••"
              autocomplete="new-password"
              @input="clearError('password')"
            />
            <span class="field-hint">8-32 位，需包含字母和数字</span>
            <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
          </div>

          <div class="form-field">
            <label for="reg-confirm" class="form-label">确认密码</label>
            <input
              id="reg-confirm"
              v-model="form.confirmPassword"
              type="password"
              class="form-input"
              :class="{ 'input-error': errors.confirmPassword }"
              placeholder="再次输入密码"
              autocomplete="new-password"
              @input="clearError('confirmPassword')"
            />
            <span v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</span>
          </div>

          <button type="submit" class="register-submit" :disabled="!isFormValid || auth.loading">
            <span v-if="auth.loading">注册中...</span>
            <span v-else>注册</span>
          </button>
        </form>

        <p class="register-footnote">
          已有账号？
          <router-link to="/login" class="form-link">去登录</router-link>
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
  isPasswordValid,
} from '@/utils/validation'

const router = useRouter()
const auth = useAuthStore()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

function clearError(field: keyof typeof errors): void {
  errors[field] = ''
}

function validate(): boolean {
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  let valid = true

  const nameResult = validateName(form.name)
  if (!nameResult.valid) { errors.name = nameResult.message; valid = false }

  const emailResult = validateEmail(form.email)
  if (!emailResult.valid) { errors.email = emailResult.message; valid = false }

  const passwordResult = validatePassword(form.password)
  if (!passwordResult.valid) { errors.password = passwordResult.message; valid = false }

  const confirmResult = validateConfirmPassword(form.password, form.confirmPassword)
  if (!confirmResult.valid) { errors.confirmPassword = confirmResult.message; valid = false }

  return valid
}

const isFormValid = computed(() => {
  return (
    form.name.trim().length > 0 &&
    form.email.trim().length > 0 &&
    isPasswordValid(form.password) &&
    form.confirmPassword === form.password
  )
})

const handleSubmit = async (): Promise<void> => {
  if (!validate()) return

  try {
    await auth.register(form.name, form.email, form.password, form.confirmPassword)
    router.push('/')
  } catch {
    // 错误已在 auth.error 中
  }
}
</script>

<style scoped lang="scss">
.register-page {
  --color-primary: #4f46e5;
  --color-primary-light: #6366f1;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-border: #e2e8f0;
  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;
  --color-error: #dc2626;

  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;

  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;

  --shadow-card: 0 4px 24px -4px rgba(15, 23, 42, 0.06),
    0 1px 3px rgba(15, 23, 42, 0.04);

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei',
    Roboto, sans-serif;
}

.register-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-4);
}

.register-card {
  width: 100%;
  max-width: 460px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-12) var(--space-10);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.register-brand {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-6);

  .brand-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    background: var(--color-text);
    color: var(--color-text-inverse);
    border-radius: var(--radius-xl);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
}

.register-title {
  margin: 0 0 var(--space-2);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.register-subtitle {
  margin: 0 0 var(--space-8);
  font-size: 0.938rem;
  color: var(--color-text-muted);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  text-align: left;
}

.form-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-lg);
  color: var(--color-error);
  font-size: 0.875rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  background: var(--color-surface-muted);
  border: 1px solid transparent;
  border-radius: var(--radius-lg);
  font-size: 0.938rem;
  font-family: inherit;
  color: var(--color-text);
  box-sizing: border-box;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:hover {
    background: #e8edf4;
  }

  &:focus {
    outline: none;
    background: var(--color-surface);
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.14);
  }

  &.input-error {
    border-color: var(--color-error);
  }
}

.field-hint {
  font-size: 0.813rem;
  color: var(--color-text-muted);
}

.field-error {
  font-size: 0.813rem;
  color: var(--color-error);
}

.form-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;

  &:hover {
    color: var(--color-primary-light);
    text-decoration: underline;
  }
}

.register-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: var(--space-3);
  padding: 14px 24px;
  background: var(--color-text);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--radius-lg);
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;

  &:hover:not(:disabled) {
    background: #1e293b;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.22);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.register-footnote {
  margin: var(--space-8) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .register-card {
    padding: var(--space-10) var(--space-6);
    border-radius: var(--radius-xl);
  }

  .register-title {
    font-size: 1.25rem;
  }
}
</style>
