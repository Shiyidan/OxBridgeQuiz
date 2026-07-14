<template>
  <header class="navbar">
    <div class="nav-inner">
      <div class="nav-left">
        <router-link to="/" class="logo">
          <span class="logo-mark" aria-hidden="true">
            <img :src="brandIconUrl" alt="" class="logo-mark-image" />
          </span>
          <span class="logo-text">云舟备考</span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/" class="nav-link" exact-active-class="nav-link--active"
            >首页</router-link
          >
          <router-link to="/assessment" class="nav-link" active-class="nav-link--active"
            >诊断测试</router-link
          >
          <router-link to="/question-bank" class="nav-link" active-class="nav-link--active"
            >试题库</router-link
          >
          <router-link to="/mistake-notebook" class="nav-link" active-class="nav-link--active"
            >错题本</router-link
          >
          <el-dropdown
            class="nav-exam-menu"
            trigger="hover"
            placement="bottom-start"
            :show-timeout="80"
            :hide-timeout="180"
            popper-class="exam-intro-dropdown"
            @command="handleExamCommand"
          >
            <button
              class="nav-link nav-exam-trigger"
              :class="{ 'nav-link--active': isExamIntroRoute }"
              type="button"
            >
              考试介绍
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="exam in examMenuItems"
                  :key="exam.type"
                  :command="exam.type"
                  :class="{ 'is-current-exam': currentExamType === exam.type }"
                >
                  {{ exam.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
                <span class="user-name">{{ auth.user.username }}</span>
                <span class="user-meta">{{ currentRoleLabel }}</span>
              </div>
              <div class="user-avatar" :title="auth.user.username">
                {{ auth.user.username.charAt(0) }}
              </div>

              <Transition name="dropdown">
                <div v-if="showDropdown" class="user-dropdown" @click.stop>
                  <div class="dropdown-header">
                    <div class="dropdown-user-info">
                      <span class="dropdown-name">{{ auth.user.username }}</span>
                      <span class="dropdown-role">{{ currentRoleLabel }}</span>
                    </div>
                    <div class="dropdown-avatar">{{ auth.user.username.charAt(0) }}</div>
                  </div>
                  <div class="dropdown-menu">
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
          </template>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// 全局导航栏：所有前台页面共用，并根据登录状态展示用户入口。
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import brandIconUrl from '@/assets/brand/acemock-icon.png'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const showDropdown = ref(false)
const examMenuItems = EXAM_TYPE_OPTIONS.map((item) => ({
  type: item.value.toLowerCase(),
  label: item.label,
}))

// 根据登录用户身份显示导航栏角色名称。
const currentRoleLabel = computed(() => (auth.user?.role === 'admin' ? '管理员' : '学生'))

// 根据登录用户身份切换头像菜单的工作台入口。
const roleHomeLabel = computed(() => (auth.user?.role === 'admin' ? '后台管理' : '个人中心'))

// 考试介绍子路由共享同一个导航激活状态。
const isExamIntroRoute = computed(() => route.path.startsWith('/exam-intro'))

// 从路由参数派生当前考试类型，用于标记下拉菜单选中项。
const currentExamType = computed(() => String(route.params.examType || '').toLowerCase())

// Element Plus 下拉命令统一切换考试页面，避免手写 hover 浮层产生闪烁。
function handleExamCommand(examType: string): void {
  router.push(`/exam-intro/${examType}`)
}

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
  overflow: hidden;
}
.logo-mark-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.45);
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
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--color-ink-soft);
  transition: color var(--duration-base) ease;
  position: relative;
  white-space: nowrap;
}
.nav-exam-menu {
  position: relative;
}
.nav-exam-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 0;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
}
.nav-exam-trigger:focus,
.nav-exam-trigger:focus-visible {
  outline: none;
  box-shadow: none;
}
:global(.exam-intro-dropdown.el-popper) {
  width: max-content;
  min-width: 0;
  padding: 6px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
:global(.exam-intro-dropdown .el-dropdown-menu) {
  padding: 0;
}
:global(.exam-intro-dropdown .el-dropdown-menu__item) {
  width: max-content;
  min-height: 40px;
  min-width: 76px;
  padding: 0 14px;
  border-radius: var(--radius-md);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
:global(.exam-intro-dropdown .el-dropdown-menu__item:focus),
:global(.exam-intro-dropdown .el-dropdown-menu__item:focus-visible) {
  outline: none;
  box-shadow: none;
}
:global(.exam-intro-dropdown .el-dropdown-menu__item:hover),
:global(.exam-intro-dropdown .el-dropdown-menu__item:focus),
:global(.exam-intro-dropdown .el-dropdown-menu__item.is-current-exam) {
  background: var(--color-hover);
  color: var(--color-ink);
}
.nav-link:hover,
.nav-link--active {
  color: var(--color-ink);
}
.btn-ghost {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  border-radius: var(--radius-md);
  font-size: var(--text-base);
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
.dropdown-role {
  color: var(--color-ink-muted);
  font-size: 12px;
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
