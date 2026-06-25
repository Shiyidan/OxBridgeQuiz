<template>
  <header class="navbar">
    <div class="nav-inner">
      <div class="nav-left">
        <router-link to="/" class="logo">
          <span class="logo-mark">G5</span>
          <span class="logo-text">Oxbridge AI</span>
        </router-link>
        <nav class="nav-links">
          <router-link to="/" class="nav-link" active-class="" exact-active-class="nav-link--active"
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
            <router-link to="/register" class="btn-primary-sm">立即注册</router-link>
          </template>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// 全局导航栏：所有前台页面共用。
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

<style scoped lang="scss">
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
}
.nav-inner {
  max-width: 1280px;
  height: 64px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-left,
.nav-links,
.nav-right,
.user-chip {
  display: flex;
  align-items: center;
}
.nav-left {
  gap: 32px;
}
.logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #0f172a;
  font-weight: 800;
  text-decoration: none;
}
.logo-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #1f2937;
  color: #fff;
}
.nav-links {
  gap: 8px;
}
.nav-right {
  gap: 10px;
}
.nav-link {
  padding: 8px 12px;
  border-radius: 8px;
  color: #475569;
  text-decoration: none;
  font-weight: 600;
}
.nav-link:hover,
.nav-link--active {
  background: #eef2ff;
  color: #2563eb;
}
.btn-ghost,
.btn-primary-sm {
  padding: 8px 14px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}
.btn-ghost {
  color: #475569;
}
.btn-primary-sm {
  background: #2563eb;
  color: #fff;
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
  font-weight: 700;
  color: #0f172a;
}
.user-meta {
  font-size: 12px;
  color: #64748b;
}
.user-avatar,
.dropdown-avatar {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
}
.user-dropdown {
  position: absolute;
  right: 0;
  top: 48px;
  width: 240px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
  overflow: hidden;
}
.dropdown-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}
.dropdown-name {
  display: block;
  font-weight: 700;
}
.dropdown-role,
.dropdown-section-label {
  color: #64748b;
  font-size: 12px;
}
.dropdown-menu {
  padding: 10px;
}
.dropdown-item {
  width: 100%;
  padding: 10px 12px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: #334155;
}
.dropdown-item:hover {
  background: #f8fafc;
}
.dropdown-item--danger {
  color: #dc2626;
}
.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 8px 0;
}
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
@media (max-width: 760px) {
  .nav-inner {
    height: 58px;
    min-height: 56px;
    padding: 0 14px;
    flex-wrap: nowrap;
    align-items: center;
    gap: 12px;
  }
  .nav-left {
    flex: 1 1 0;
    min-width: 0;
    gap: 12px;
    flex-wrap: nowrap;
  }
  .nav-links {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    gap: 8px;
    overflow-x: auto;
    padding: 0;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  .nav-links::-webkit-scrollbar {
    display: none;
  }
  .nav-link {
    flex: 0 0 auto;
    padding: 7px 9px;
    font-size: 14px;
    white-space: nowrap;
  }
  .logo-text,
  .user-info {
    display: none;
  }
  .logo-mark {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
  }
  .nav-right {
    flex: 0 0 auto;
    gap: 6px;
  }
  .btn-ghost,
  .btn-primary-sm {
    padding: 7px 9px;
    font-size: 13px;
    white-space: nowrap;
  }
  .user-avatar,
  .dropdown-avatar {
    width: 34px;
    height: 34px;
  }
  .user-dropdown {
    top: 42px;
    right: 0;
    width: min(240px, calc(100vw - 24px));
  }
}
</style>
