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
          <a href="/#features" class="nav-link">诊断测试</a>
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
            <div class="user-chip" @click="handleAvatarClick">
              <div class="user-info">
                <span class="user-name">{{ auth.user.name }}</span>
                <span class="user-meta">{{ auth.user.major }}</span>
              </div>
              <div class="user-avatar" :title="auth.user.name">
                {{ auth.user.name.charAt(0) }}
              </div>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-ghost">登录</router-link>
            <router-link to="/login" class="btn-primary-sm">立即注册</router-link>
          </template>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const handleAvatarClick = (): void => {
  console.log('[NavBar] avatar clicked')
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

@media (max-width: 768px) {
  .nav-links {
    display: none;
  }

  .user-info {
    display: none;
  }
}
</style>
