<template>
  <header class="navbar">
    <div class="nav-inner">
      <div class="nav-left">
        <router-link to="/" class="logo">
          <span class="logo-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M5 7V4.5C5 3.12 6.12 2 7.5 2H8.5C9.88 2 11 3.12 11 4.5V7M3 7H13L12 14H4L3 7Z"
                stroke="currentColor"
                stroke-width="1.4"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="logo-text">智钥备考</span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/" class="nav-link" exact-active-class="nav-link--active">首页</router-link>
          <router-link to="/assessment" class="nav-link" active-class="nav-link--active"
            >诊断测试</router-link
          >
          <router-link to="/question-bank" class="nav-link" active-class="nav-link--active"
            >试题库</router-link
          >
          <router-link to="/mistake-notebook" class="nav-link" active-class="nav-link--active"
            >错题本</router-link
          >
        </nav>
      </div>

      <div class="nav-right">
        <slot name="actions">
          <template v-if="auth.isLoggedIn && auth.user">
            <div
              class="user-chip"
              @mouseenter="showDropdown = true"
              @mouseleave="showDropdown = false"
              @click="showDropdown = !showDropdown"
            >
              <div class="user-info">
                <span class="user-name">{{ auth.user.name }}</span>
                <span class="user-meta">{{ currentRoleLabel }}</span>
              </div>
              <div class="user-avatar" :title="auth.user.name">{{ auth.user.name.charAt(0) }}</div>

              <Transition name="dropdown">
                <div v-if="showDropdown" class="user-dropdown" @click.stop>
                  <div class="dropdown-header">
                    <div class="dropdown-user-info">
                      <span class="dropdown-name">{{ auth.user.name }}</span>
                      <span class="dropdown-role">{{ currentRoleLabel }}</span>
                    </div>
                    <div class="dropdown-avatar">{{ auth.user.name.charAt(0) }}</div>
                  </div>
                  <div class="dropdown-menu">
                    <div class="dropdown-section-label">当前角色：{{ currentRoleLabel }}</div>
                    <button class="dropdown-item" type="button" @click="goToRoleHome">
                      {{ roleHomeLabel }}
                    </button>
                    <div class="dropdown-divider"></div>
                    <button
                      class="dropdown-item dropdown-item--danger"
                      type="button"
                      @click="handleLogout"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-ghost">登录</router-link>
            <router-link to="/assessment" class="btn-primary-sm">免费诊断</router-link>
          </template>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// 全局导航栏：所有前台页面共用。极简黑白灰风格，"免费诊断" CTA 引导未登录用户进入诊断入口。
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const showDropdown = ref(false)
const currentRoleLabel = computed(() => (auth.user?.role === 'admin' ? '管理员' : '学生'))
const roleHomeLabel = computed(() => (auth.user?.role === 'admin' ? '后台管理' : '个人中心'))

// 角色入口统一从头像菜单进入，学生和管理员各回到自己的工作台。
function goToRoleHome(): void {
  showDropdown.value = false
  router.push(auth.user?.role === 'admin' ? '/admin/core-library' : '/profile')
}

// 退出后回首页，让需要登录的页面由路由守卫重新拦截。
async function handleLogout(): Promise<void> {
  await auth.logout()
  showDropdown.value = false
  router.push('/')
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  min-width: var(--fluid-page-min-width);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-line);
}

/* 前台流体外壳：1200px 起步，窄屏继续收缩到紧凑下限。 */
.nav-inner {
  width: clamp(var(--fluid-shell-min), var(--fluid-shell-fluid), var(--fluid-shell-max));
  height: var(--nav-height);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(20px, 2.08vw, 40px);
}
.nav-left,
.nav-links,
.nav-right,
.user-chip {
  display: flex;
  align-items: center;
}
.nav-left {
  min-width: 0;
  gap: clamp(20px, 1.67vw, 32px);
}
.logo {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  color: var(--color-ink);
  font-weight: var(--weight-bold);
  font-size: 17px;
  letter-spacing: -0.01em;
}
.logo-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
}
.nav-links {
  min-width: 0;
  gap: clamp(18px, 1.67vw, 32px);
}
.nav-right {
  flex: 0 0 auto;
  gap: 12px;
}
.nav-link {
  padding: 8px 4px;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-ink-soft);
  transition: color var(--duration-base) ease;
  position: relative;
  white-space: nowrap;
}
.nav-link:hover,
.nav-link--active {
  color: var(--color-ink);
}
.btn-ghost,
.btn-primary-sm {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  transition: all var(--duration-base) ease;
}
.btn-ghost {
  color: var(--color-ink-soft);
  padding: 10px 4px;
}
.btn-ghost:hover {
  color: var(--color-ink);
}
.btn-primary-sm {
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  border: 1px solid var(--color-ink);
}
.btn-primary-sm:hover {
  background: var(--color-charcoal);
  border-color: var(--color-charcoal);
  color: var(--color-ink-inverse);
  transform: translateY(-1px);
}
.user-chip {
  position: relative;
  gap: 10px;
  cursor: pointer;
}
.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.user-name {
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  color: var(--color-ink);
}
.user-meta {
  font-size: 12px;
  color: var(--color-ink-muted);
}
.user-avatar,
.dropdown-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}
.user-dropdown {
  position: absolute;
  right: 0;
  top: 48px;
  width: 240px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.dropdown-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-line-soft);
}
.dropdown-name {
  display: block;
  font-weight: var(--weight-semi);
  color: var(--color-ink);
}
.dropdown-role,
.dropdown-section-label {
  color: var(--color-ink-muted);
  font-size: 12px;
}
.dropdown-section-label {
  padding: 8px 12px 4px;
}
.dropdown-menu {
  padding: 10px;
}
.dropdown-item {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  transition: background var(--duration-base) ease;
}
.dropdown-item:hover {
  background: var(--color-hover);
  color: var(--color-ink);
}
.dropdown-item--danger {
  color: var(--color-danger);
}
.dropdown-item--danger:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}
.dropdown-divider {
  height: 1px;
  background: var(--color-line-soft);
  margin: 8px 0;
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--duration-fast) ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
