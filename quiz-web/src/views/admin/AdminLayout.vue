<template>
  <div class="admin-page">
    <NavBar />
    <div class="admin-wrapper">
      <div class="admin-layout">
        <aside class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">
          <button
            class="sidebar-toggle"
            type="button"
            :aria-label="sidebarCollapsed ? '展开后台导航' : '收起后台导航'"
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            {{ sidebarCollapsed ? '›' : '‹' }}
          </button>

          <div class="sidebar-header">
            <h1 class="sidebar-title">超级管理控制台</h1>
            <p class="sidebar-subtitle">
              欢迎，{{ userName }}。您可以在此管理平台核心资产与用户数据。
            </p>
          </div>

          <nav class="sidebar-nav">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="nav-item"
              active-class="nav-item--active"
              :title="item.label"
              @click="handleNavClick"
            >
              <span class="nav-icon" v-html="item.icon"></span>
              <span class="nav-label">{{ item.label }}</span>
            </router-link>
          </nav>
        </aside>

        <main class="main-content">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 管理后台整体布局：NavBar、左侧导航栏和右侧 RouterView。
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NavBar from '@/components/NavBar.vue'

const auth = useAuthStore()
const userName = computed(() => auth.user?.name || '管理员')
const sidebarCollapsed = ref(true)

interface NavItem {
  path: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  {
    path: '/admin/revenue',
    label: '营收与数据',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  },
  {
    path: '/admin/staff',
    label: '员工管理',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  },
  {
    path: '/admin/users',
    label: '用户管理',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  },
  {
    path: '/admin/core-library',
    label: '核心资料库',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  },
  {
    path: '/admin/payment',
    label: '付费策略与订阅',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
  },
]

// 手机端点击导航后自动收起侧栏，给内容区留出更多横向空间。
function handleNavClick(): void {
  if (window.matchMedia('(max-width: 768px)').matches) {
    sidebarCollapsed.value = true
  }
}
</script>

<style scoped lang="scss">
.admin-page {
  min-height: 100vh;
  background: #f8fafc;
}

.admin-wrapper {
  width: 100%;
  min-width: var(--layout-min-width);
  max-width: none;
  margin: 0 auto;
  padding: 0 2rem;
}

.admin-layout {
  display: flex;
  min-height: calc(100vh - 64px);
}

.sidebar {
  position: relative;
  width: 260px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 32px 0;
  overflow-y: auto;
}

.sidebar-toggle {
  display: none;
}

.sidebar-header {
  padding: 0 28px 28px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 8px;
}

.sidebar-title {
  font-size: 1.375rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0;
  margin: 0 0 8px;
}

.sidebar-subtitle {
  font-size: 0.8125rem;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
  text-decoration: none;
  transition: all 0.15s ease;

  .nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    opacity: 0.7;

    :deep(svg) {
      width: 100%;
      height: 100%;
    }
  }

  &:hover {
    color: #0f172a;
    background: #f8fafc;

    .nav-icon {
      opacity: 1;
    }
  }

  &--active {
    color: #4f46e5;
    background: #eef2ff;
    font-weight: 600;

    .nav-icon {
      opacity: 1;
    }
  }
}

.main-content {
  flex: 1;
  min-width: 0;
  overflow: auto;
}

@media (max-width: 768px) {
  .admin-wrapper {
    padding: 0;
    max-width: none;
  }

  .admin-layout {
    min-height: calc(100vh - 58px);
    width: 100%;
  }

  .sidebar {
    width: 236px;
    padding: 18px 0;
    transition: width 0.2s ease;
    overflow-x: hidden;
  }

  .sidebar--collapsed {
    width: 64px;

    .sidebar-header {
      padding: 0 10px 12px;
      border-bottom-color: transparent;
    }

    .sidebar-title,
    .sidebar-subtitle,
    .nav-label {
      display: none;
    }

    .sidebar-nav {
      padding: 8px 8px;
    }

    .nav-item {
      justify-content: center;
      padding: 12px 0;
      gap: 0;
    }
  }

  .sidebar-toggle {
    display: grid;
    place-items: center;
    position: absolute;
    top: 10px;
    right: -15px;
    z-index: 2;
    width: 30px;
    height: 30px;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    background: #ffffff;
    color: #475569;
    font-size: 20px;
    font-weight: 800;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
    cursor: pointer;
  }

  .sidebar-header {
    padding: 0 20px 20px;
  }

  .sidebar-title {
    font-size: 1.1rem;
  }

  .sidebar-nav {
    padding: 8px 10px;
  }

  .nav-item {
    padding: 11px 12px;
    white-space: nowrap;
  }

  .main-content {
    flex: 1 1 auto;
    min-width: 0;
    overflow-x: auto;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .main-content :deep(.data-card) {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .main-content :deep(.data-table) {
    min-width: 680px;
  }
}
</style>
