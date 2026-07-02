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
          <p class="auth-sub">
            登录后即可查看完整诊断报告、错题攻克进度和 14 天动态学习路径。
          </p>
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
          <h2 class="auth-title">欢迎回来</h2>
          <p class="auth-subtitle">使用你的账号继续备考旅程</p>

          <div v-if="auth.error" class="auth-alert">{{ auth.error }}</div>

          <el-form
            ref="formRef"
            class="auth-form"
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

          <p class="auth-footer">
            还没有账号？
            <router-link to="/register" class="auth-link">立即注册</router-link>
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 登录页：邮箱 + 密码登录，复用全局 auth-page.css 布局与表单样式。
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { getMember } from '@/api/member'
import { validateEmail, validatePasswordRequired } from '@/utils/validation'

const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()

const form = reactive({
  email: '',
  password: '',
})

// 左侧品牌区特性卡文案，与首页 Hero 卖点保持一致。
const features = [
  '30 分钟完成一次完整诊断',
  '错题自动归因，AI 生成攻克路径',
  '14 天动态学习路径持续更新',
]

// 复用共享校验规则，避免登录页和注册页的邮箱规则漂移。
const rules: FormRules = {
  email: [
    {
      validator: (_rule, value: string, callback) => {
        const result = validateEmail(value)
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

// 登录成功后拉一次会员上下文，缓存到 auth store 供后续页面复用。
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
    // 错误信息已写入 auth.error，模板顶部的 .auth-alert 会展示。
  }
}

const handleForgotPassword = (): void => {
  // 暂未实现。
}
</script>

<!-- 认证类页面共享布局，非 scoped，按需引入以避免全站污染。 -->
<style src="./auth-page.css"></style>
