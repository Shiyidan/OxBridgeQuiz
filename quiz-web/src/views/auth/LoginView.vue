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

          <p class="auth-footer">
            还没有账号？
            <router-link :to="registerLocation" class="auth-link">立即注册</router-link>
          </p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 登录页：完成认证后返回用户进入登录流程前访问的受保护页面。
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import { useAuthStore } from '@/stores/auth'
import { getMember } from '@/api/member'
import { createAuthRouteLocation, getSafeAuthRedirect } from '@/utils/authRedirect'
import { validateLoginIdentifier, validatePasswordRequired } from '@/utils/validation'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  password: '',
})

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

const handleForgotPassword = (): void => {
  router.push(createAuthRouteLocation('forgot-password', redirectAfterAuth.value))
}
</script>

<!-- 认证类页面共享布局，非 scoped，按需引入以避免全站污染。 -->
<style src="./auth-page.css"></style>
