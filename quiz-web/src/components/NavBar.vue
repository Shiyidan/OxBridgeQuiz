<template>
  <header class="navbar">
    <div class="nav-inner">
      <div class="nav-left">
        <router-link to="/" class="logo">
          <span class="logo-mark">G5</span>
          <span class="logo-text">Oxbridge AI</span>
        </router-link>
        <nav class="nav-links">
          <router-link
            to="/"
            class="nav-link"
            active-class=""
            exact-active-class="nav-link--active"
          >
            首页
          </router-link>
          <router-link to="/diagnostic" class="nav-link" active-class="nav-link--active">诊断测试</router-link>
          <router-link
            to="/question-bank"
            class="nav-link"
            active-class="nav-link--active"
          >
            试题库
          </router-link>
          <a href="/#about" class="nav-link">错题本</a>
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
                <span class="user-meta">{{ auth.user.role === 'admin' ? '管理员' : '学生' }}</span>
              </div>
              <div class="user-avatar" :title="auth.user.name">
                {{ auth.user.name.charAt(0) }}
              </div>

              <!-- 用户下拉卡片 -->
              <Transition name="dropdown">
                <div v-if="showDropdown" class="user-dropdown" @mouseenter="showDropdown = true" @mouseleave="showDropdown = false">
                  <!-- 卡片头部：用户信息 -->
                  <div class="dropdown-header">
                    <div class="dropdown-user-info">
                      <span class="dropdown-name">{{ auth.user.name }}</span>
                      <span class="dropdown-role">{{ auth.user.role === 'admin' ? '管理员' : '学生' }}</span>
                    </div>
                    <div class="dropdown-avatar">{{ auth.user.name.charAt(0) }}</div>
                  </div>

                  <div class="dropdown-menu">
                    <div class="dropdown-section-label">当前角色：{{ currentRoleLabel }}</div>

                    <button class="dropdown-item" @click="goToAdmin">
                      后台管理
                    </button>

                    <div class="dropdown-divider"></div>

                    <button class="dropdown-item dropdown-item--danger" @click="handleLogout">
                      退出登录
                      <svg class="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
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
// 全局导航栏（所有前台页面共用）
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const showDropdown = ref(false)

const currentRoleLabel = computed(() =>
  auth.user?.role === 'admin' ? '管理员' : '学生',
)

function goToAdmin(): void {
  showDropdown.value = false
  router.push('/admin/core-library')
}

function handleLogout(): void {
  auth.logout()
  showDropdown.value = false
  router.push('/')
}
</script>

<style scoped lang="scss">
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 2rem;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.logo-mark {
  width: 32px;
  height: 32px;
  background: #0f172a;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 700;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.nav-links {
  display: flex;
  gap: 0.25rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  &--active {
    color: #0f172a;
    background: #f1f5f9;
    font-weight: 600;
  }
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ========== 未登录态 ========== */
.btn-ghost {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
}

.btn-primary-sm {
  padding: 0.5rem 1.25rem;
  background: #4f46e5;
  color: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: #6366f1;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
  }
}

/* ========== 已登录态：用户信息条 ========== */
.user-chip {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 4px 4px 4px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f1f5f9;
  }
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.25;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.user-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%);
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
}

/* ========== 用户下拉卡片（新增） ========== */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 260px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
  padding: 12px 0;
  z-index: 1100;
}

.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 12px;
}

.dropdown-user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dropdown-name {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.dropdown-role {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 2px;
}

.dropdown-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%);
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dropdown-section-label {
  padding: 8px 16px 4px;
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.dropdown-menu {
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  &--active {
    color: #4f46e5;
    background: #eef2ff;
    font-weight: 600;

    &:hover {
      background: #eef2ff;
    }
  }

  &--danger {
    color: #ef4444;

    &:hover {
      background: #fef2f2;
      color: #ef4444;
    }
  }
}

.logout-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-left: auto;
}

.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 16px;
}

/* ========== 下拉动画 ========== */
.dropdown-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .user-info {
    display: none;
  }

  .user-dropdown {
    right: -60px;
    width: 240px;
  }
}
</style>
