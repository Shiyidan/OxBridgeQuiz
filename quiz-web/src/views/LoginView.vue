<template>
  <div class="login-page">
    <NavBar />

    <main class="login-main">
      <section class="login-card">
        <div class="login-brand">
          <span class="brand-mark">G5</span>
        </div>

        <h1 class="login-title">欢迎来到 Oxbridge AI</h1>
        <p class="login-subtitle">使用您的账号登录以继续</p>

        <form class="login-form" @submit.prevent="handleSubmit">
          <div class="form-field">
            <label for="login-email" class="form-label">电子邮箱</label>
            <input
              id="login-email"
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="demo@student.com"
              autocomplete="email"
              required
            />
          </div>

          <div class="form-field">
            <div class="form-label-row">
              <label for="login-password" class="form-label">密码</label>
              <a href="#" class="form-link" @click.prevent="handleForgotPassword">
                忘记密码?
              </a>
            </div>
            <input
              id="login-password"
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>

          <button type="submit" class="login-submit">
            <span>登录 / 演示登入</span>
            <span class="submit-arrow" aria-hidden="true">→</span>
          </button>
        </form>

        <p class="login-footnote">
          还没有账号？
          <router-link to="/login" class="form-link">立即注册</router-link>
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// 登录页（静态 mock，点击登录写入 auth store 并跳转首页）
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/stores/auth'

interface LoginForm {
  email: string
  password: string
}

const router = useRouter()
const auth = useAuthStore()

const form = reactive<LoginForm>({
  email: 'demo@student.com',
  password: 'demopass',
})

const handleSubmit = (): void => {
  console.log('[LoginView] submit', { email: form.email })
  auth.login()
  router.push('/')
}

const handleForgotPassword = (): void => {
  console.log('[LoginView] forgot password clicked')
}
</script>

<style scoped lang="scss">
/* ========== 设计令牌（与 样式开发规范.md 对齐） ========== */
.login-page {
  --color-primary: #4f46e5;
  --color-primary-light: #6366f1;
  --color-primary-dark: #4338ca;
  --color-primary-bg: #eef2ff;

  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;

  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;

  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;

  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
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

/* ========== 主区域（垂直水平居中） ========== */
.login-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) var(--space-4);
}

/* ========== 登录卡片 ========== */
.login-card {
  width: 100%;
  max-width: 460px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--space-12) var(--space-10);
  box-shadow: var(--shadow-card);
  text-align: center;
}

/* ========== 品牌 Logo ========== */
.login-brand {
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

.login-title {
  margin: 0 0 var(--space-2);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.login-subtitle {
  margin: 0 0 var(--space-8);
  font-size: 0.938rem;
  color: var(--color-text-muted);
}

/* ========== 表单 ========== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  text-align: left;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-primary-light);
    text-decoration: underline;
  }
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
}

/* ========== 提交按钮（深色 CTA） ========== */
.login-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
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
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    background: #1e293b;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.22);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
}

.submit-arrow {
  font-size: 1.125rem;
  line-height: 1;
}

/* ========== 注册引导 ========== */
.login-footnote {
  margin: var(--space-8) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* ========== 响应式 ========== */
@media (max-width: 640px) {
  .login-card {
    padding: var(--space-10) var(--space-6);
    border-radius: var(--radius-xl);
  }

  .login-title {
    font-size: 1.25rem;
  }

  .login-brand .brand-mark {
    width: 56px;
    height: 56px;
    font-size: 1.25rem;
  }
}
</style>
