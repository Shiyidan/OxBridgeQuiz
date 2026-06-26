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

        <el-form
          ref="formRef"
          class="login-form"
          :model="form"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="电子邮箱" prop="email">
            <el-input
              v-model="form.email"
              placeholder="demo@student.com"
              autocomplete="email"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              show-password
            />
            <template #extra>
              <a class="form-link" @click.prevent="handleForgotPassword">忘记密码?</a>
            </template>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              class="login-submit"
              :loading="auth.loading"
              native-type="submit"
            >
              {{ auth.loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <p class="login-footnote">
          还没有账号？
          <router-link to="/register" class="form-link">立即注册</router-link>
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// 登录页
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { getMember } from '@/api/member'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()

const form = reactive({
  email: '',
  password: '',
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
}

const handleSubmit = async (): Promise<void> => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  try {
    await auth.login(form.email, form.password)
    const memberCtx = await getMember()
    auth.setMemberContext(memberCtx)
    router.push('/')
  } catch {
    // 后端错误已在 auth.error 中
  }
}

const handleForgotPassword = (): void => {
  // 暂未实现
}
</script>

<style scoped lang="scss">
.login-page {
  --color-primary: #4f46e5;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --shadow-card: 0 4px 24px -4px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04);

  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
}

.login-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) 1rem;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: var(--color-surface);
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-2xl);
  padding: var(--space-12) var(--space-10);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.login-brand {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-6);
}

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
}

.login-title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.login-subtitle {
  margin: 0 0 var(--space-8);
  font-size: 0.938rem;
  color: var(--color-text-muted);
}

.login-form {
  text-align: left;
}

.form-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.login-submit {
  width: 100%;
}

.login-footnote {
  margin: var(--space-8) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

@media (max-width: 640px) {
  .login-card {
    padding: var(--space-10) 1.5rem;
    border-radius: var(--radius-xl);
  }
}
</style>
