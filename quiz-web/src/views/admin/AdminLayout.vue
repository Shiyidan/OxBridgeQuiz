<!-- 管理后台公共布局，承载侧栏导航与独立滚动的管理页面。 -->
<template>
  <div class="admin-page">
    <div class="admin-wrapper">
      <div
        class="admin-layout"
        :class="{ 'admin-layout--sidebar-collapsed': sidebarCollapsed }"
      >
        <aside class="sidebar" :class="{ 'sidebar--collapsed': sidebarCollapsed }">
          <div class="sidebar-header">
            <div class="sidebar-brand">
              <router-link class="sidebar-home-link" to="/" aria-label="返回 AceMock 首页">
                <span class="sidebar-brand-mark" aria-hidden="true">
                  <img :src="brandIconUrl" alt="" />
                </span>
              </router-link>
              <h1 class="sidebar-title">超级管理控制台</h1>
            </div>
            <p class="sidebar-subtitle">
              欢迎，{{ userName }}。您可以在此管理平台核心资产与用户数据。
            </p>
          </div>

          <nav class="sidebar-nav">
            <el-tooltip
              v-for="item in navItems"
              :key="item.path"
              :content="item.label"
              placement="right"
              :disabled="!sidebarCollapsed"
            >
              <router-link
                :to="item.path"
                class="nav-item"
                active-class="nav-item--active"
                @click="handleNavClick"
              >
                <span class="nav-icon" v-html="item.icon"></span>
                <span class="nav-label">{{ item.label }}</span>
              </router-link>
            </el-tooltip>
          </nav>
        </aside>

        <el-tooltip :content="sidebarCollapsed ? '展开菜单' : '收起菜单'" placement="right">
          <button
            class="sidebar-toggle"
            type="button"
            :aria-label="sidebarCollapsed ? '展开后台导航' : '收起后台导航'"
            :aria-expanded="!sidebarCollapsed"
            @click="toggleSidebar"
          >
            <el-icon :size="18">
              <Expand v-if="sidebarCollapsed" />
              <Fold v-else />
            </el-icon>
          </button>
        </el-tooltip>

        <main class="main-content">
          <div class="admin-content-canvas">
            <RouterView />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 管理后台整体布局：独立侧栏和右侧 RouterView，不复用前台顶部导航。
import { computed, onMounted, ref } from 'vue'
import { Expand, Fold } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import brandIconUrl from '@/assets/brand/acemock-icon.png'

const auth = useAuthStore()
const userName = computed(() => auth.user?.username || '管理员')
const sidebarCollapsed = ref(false)

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
  {
    path: '/admin/behavior-analytics',
    label: '用户行为分析',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19V3"/><path d="M2 19h22"/></svg>',
  },
  {
    path: '/admin/operation-logs',
    label: '操作日志',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6"/><path d="M9 8h6"/><path d="M9 12h3"/><path d="M5 3h14v18H5z"/><path d="m14 16 2 2 4-4"/></svg>',
  },
]

// 折叠状态只改变后台布局宽度，当前路由和各管理页面状态保持不变。
function toggleSidebar(): void {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 手机端点击导航后自动收起侧栏，给内容区留出更多横向空间。
function handleNavClick(): void {
  if (window.matchMedia('(max-width: 860px)').matches) {
    sidebarCollapsed.value = true
  }
}

// 手机端初次进入后台默认使用图标侧栏，避免遮挡主要管理内容。
onMounted(() => {
  if (window.matchMedia('(max-width: 860px)').matches) sidebarCollapsed.value = true
})
</script>

<style scoped lang="scss">
.admin-page {
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  background: #f8fafc;
}

.admin-wrapper {
  width: 100%;
  height: 100vh;
  min-height: 0;
  min-width: var(--layout-min-width);
  max-width: none;
  margin: 0 auto;
  padding: 0 2rem;
}

.admin-layout {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 0;
}

.sidebar {
  position: relative;
  width: 260px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 18px 0 32px;
  overflow-x: hidden;
  overflow-y: auto;
  transition: width 0.2s ease;
}

.sidebar-toggle {
  position: absolute;
  bottom: 24px;
  left: 212px;
  z-index: 10;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease,
    left 0.2s ease;
}

.admin-layout--sidebar-collapsed .sidebar-toggle {
  left: 19px;
}

.sidebar-toggle:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
}

.sidebar-toggle:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.sidebar-header {
  padding: 4px 28px 28px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 8px;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.sidebar-home-link {
  display: inline-flex;
  flex: 0 0 auto;
  border-radius: 6px;
}

.sidebar-home-link:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 3px;
}

.sidebar-brand-mark {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  overflow: hidden;
  border-radius: 6px;
}

.sidebar-brand-mark img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scale(1.45);
}

.sidebar-title {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0;
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
  width: 100%;
  box-sizing: border-box;
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

.sidebar--collapsed {
  width: 72px;

  .sidebar-title,
  .sidebar-subtitle,
  .nav-label {
    display: none;
  }

  .sidebar-header {
    display: flex;
    justify-content: center;
    padding: 4px 0 20px;
  }

  .sidebar-brand {
    margin: 0;
  }

  .sidebar-nav {
    padding-inline: 8px;
  }

  .nav-item {
    justify-content: center;
    gap: 0;
    padding-inline: 0;
  }

  .nav-icon {
    opacity: 0.85;
  }
}

.main-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.admin-content-canvas {
  height: 100%;
  min-width: 0;
}

@media (max-width: 860px) {
  // 与全局移动端断点一致，避免桌面最小宽度被外层裁切。
  .admin-page {
    height: 100dvh;
  }

  .admin-wrapper {
    height: 100%;
    min-width: 0;
    padding: 0;
    max-width: none;
  }

  .admin-layout {
    height: 100%;
    min-height: 0;
    width: 100%;
  }

  .sidebar {
    width: 236px;
    padding-bottom: 18px;
  }

  .sidebar--collapsed {
    width: 64px;
  }

  .sidebar-toggle {
    left: 188px;
  }

  .admin-layout--sidebar-collapsed .sidebar-toggle {
    left: 15px;
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

  // 内容保留宽布局，超出手机视口时在主内容区横向滚动。
  .admin-content-canvas {
    height: auto;
    min-height: 100%;
    min-width: 1000px;
  }
}
</style>
