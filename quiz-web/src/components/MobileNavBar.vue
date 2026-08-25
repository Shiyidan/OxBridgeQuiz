<!-- 全站移动端导航：以顶部折叠栏和全屏菜单承载前台主要业务入口。 -->
<template>
  <div class="home-mobile-nav">
    <div class="home-mobile-nav__bar">
      <button class="home-mobile-nav__brand-button" type="button" aria-label="返回首页" @click="goHome">
        <img :src="brandIconUrl" alt="" />
      </button>
      <button
        class="home-mobile-nav__trigger"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="global-mobile-menu"
        @click="openMenu"
      >
        <span class="home-mobile-nav__hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
        <strong>导航</strong>
      </button>
      <button
        v-if="!auth.isLoggedIn"
        class="home-mobile-nav__login"
        type="button"
        @click="navigate('/login')"
      >
        登录
      </button>
      <div v-else ref="accountRef" class="home-mobile-nav__account">
        <button
          class="home-mobile-nav__account-trigger"
          type="button"
          :aria-expanded="accountMenuOpen"
          aria-controls="mobile-account-menu"
          @click.stop="toggleAccountMenu"
        >
          <strong>{{ auth.user?.username }}</strong>
          <span
            :class="{
              'is-highlighted': accountMetaHighlighted,
              'is-pending': accountMetaPending,
            }"
            >{{ accountMetaLabel }}</span
          >
        </button>
        <Transition name="mobile-account-menu">
          <div
            v-if="accountMenuOpen"
            id="mobile-account-menu"
            class="home-mobile-nav__account-menu"
            @click.stop
          >
            <button class="is-danger" type="button" @click="requestLogout">退出登录</button>
          </div>
        </Transition>
      </div>
    </div>

    <Transition name="home-mobile-menu">
      <section
        v-if="menuOpen"
        id="global-mobile-menu"
        ref="overlayRef"
        class="home-mobile-nav__overlay"
        role="dialog"
        aria-modal="true"
        aria-label="移动端导航"
        tabindex="-1"
      >
        <header class="home-mobile-nav__overlay-header">
          <button type="button" class="home-mobile-nav__overlay-brand" @click="goHome">
            <img :src="brandIconUrl" alt="" />
            <span>AceMock</span>
          </button>
        </header>

        <nav class="home-mobile-nav__menu" aria-label="主要导航">
          <button
            v-for="item in menuItems"
            :key="item.key"
            type="button"
            @click="selectMenuItem(item)"
          >
            {{ item.label }}
          </button>
        </nav>

        <footer class="home-mobile-nav__footer">
          <button class="home-mobile-nav__collapse" type="button" @click="closeMenu">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3.5 10.5 8 6l4.5 4.5" />
            </svg>
            <span>收起</span>
          </button>
        </footer>
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import brandIconUrl from '@/assets/brand/acemock-icon.png'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'

interface MobileMenuItem {
  key: string
  label: string
  path: string | null
}

const props = withDefaults(
  defineProps<{
    currentExam?: ActiveExamType | null
    accountMetaLabel?: string
    accountMetaPending?: boolean
    accountMetaHighlighted?: boolean
  }>(),
  {
    currentExam: null,
    accountMetaLabel: '免费用户',
    accountMetaPending: false,
    accountMetaHighlighted: false,
  },
)

const emit = defineEmits<{
  home: []
  navigate: [path: string]
  logout: []
}>()

const auth = useAuthStore()
const menuOpen = ref(false)
const accountMenuOpen = ref(false)
const overlayRef = ref<HTMLElement | null>(null)
const accountRef = ref<HTMLElement | null>(null)

// 考试介绍默认跟随首页当前备考目标，目标缺失时使用 TMUA 公共介绍。
const examIntroPath = computed(() => `/exam-intro/${(props.currentExam || 'TMUA').toLowerCase()}`)

// 移动端主导航覆盖前台核心学习模块，账户设置统一从个人中心进入。
const menuItems = computed<MobileMenuItem[]>(() => [
  { key: 'home', label: '首页', path: null },
  { key: 'assessment', label: '诊断测试', path: '/assessment' },
  { key: 'question-bank', label: '试题库', path: '/question-bank' },
  { key: 'mock-exams', label: '模考中心', path: '/mock-exams' },
  {
    key: 'mistake-notebook',
    label: '错题本',
    path: props.currentExam
      ? `/mistake-notebook?examType=${encodeURIComponent(props.currentExam)}`
      : '/mistake-notebook',
  },
  { key: 'exam-intro', label: '考试介绍', path: examIntroPath.value },
  { key: 'profile', label: '个人中心', path: '/profile' },
])

// 展开菜单后把焦点放到第一个入口，便于键盘和读屏用户继续操作。
function openMenu(): void {
  accountMenuOpen.value = false
  menuOpen.value = true
  void nextTick(() => overlayRef.value?.focus())
}

// 收起菜单并恢复当前页面内容区域。
function closeMenu(): void {
  menuOpen.value = false
}

// 首页入口先关闭全屏层，再由公共导航决定滚动定位或返回首页。
function goHome(): void {
  closeMenu()
  emit('home')
}

// 站内菜单只表达目标路径，认证和访问权限继续由全局路由守卫处理。
function navigate(path: string): void {
  accountMenuOpen.value = false
  closeMenu()
  emit('navigate', path)
}

// 已登录用户点击右上角账户摘要时切换个人菜单。
function toggleAccountMenu(): void {
  accountMenuOpen.value = !accountMenuOpen.value
}

// 退出动作交由公共导航处理，移动组件只负责关闭本地菜单。
function requestLogout(): void {
  accountMenuOpen.value = false
  emit('logout')
}

// 点击账户区域外时收起下拉，避免菜单遮挡页面内容。
function handleDocumentPointerDown(event: PointerEvent): void {
  if (!accountRef.value?.contains(event.target as Node)) accountMenuOpen.value = false
}

// 菜单项区分首页入口和普通站内路由两种动作。
function selectMenuItem(item: MobileMenuItem): void {
  if (item.path) navigate(item.path)
  else goHome()
}

// 全屏菜单打开时锁定页面滚动，并允许 Escape 快速收起。
function handleEscape(event: KeyboardEvent): void {
  if (event.key !== 'Escape') return
  closeMenu()
  accountMenuOpen.value = false
}

watch(menuOpen, (open) => {
  document.body.classList.toggle('home-mobile-nav-open', open)
  if (open) document.addEventListener('keydown', handleEscape)
  else document.removeEventListener('keydown', handleEscape)
})

watch(accountMenuOpen, (open) => {
  if (open) {
    document.addEventListener('pointerdown', handleDocumentPointerDown)
    document.addEventListener('keydown', handleEscape)
  } else {
    document.removeEventListener('pointerdown', handleDocumentPointerDown)
    if (!menuOpen.value) document.removeEventListener('keydown', handleEscape)
  }
})

onBeforeUnmount(() => {
  document.body.classList.remove('home-mobile-nav-open')
  document.removeEventListener('keydown', handleEscape)
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
})
</script>

<style scoped>
:global(body.home-mobile-nav-open) {
  overflow: hidden;
}

.home-mobile-nav {
  display: none;
}

@media (max-width: 860px) {
  .home-mobile-nav {
    --home-mobile-nav-color: #0f5e55;

    position: sticky;
    top: 0;
    z-index: 220;
    display: block;
    flex: 0 0 auto;
    align-self: stretch;
    width: 100%;
    min-width: 0;
    max-width: 100vw;
  }

  .home-mobile-nav__bar {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    height: 64px;
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) minmax(92px, 128px);
    align-items: center;
    padding: 0 16px;
    background: var(--home-mobile-nav-color);
    box-shadow: 0 8px 22px rgb(73 10 12 / 16%);
    color: #fff;
  }

  .home-mobile-nav__brand-button,
  .home-mobile-nav__trigger,
  .home-mobile-nav__login,
  .home-mobile-nav__account-trigger,
  .home-mobile-nav__account-menu button,
  .home-mobile-nav__overlay-brand,
  .home-mobile-nav__menu button,
  .home-mobile-nav__collapse {
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .home-mobile-nav__brand-button {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    overflow: hidden;
    border-radius: 9px;
  }

  .home-mobile-nav__brand-button img,
  .home-mobile-nav__overlay-brand img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transform: scale(1.42);
  }

  .home-mobile-nav__trigger {
    position: absolute;
    left: 50%;
    top: 50%;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 44px;
    padding: 0 18px;
    font-size: 14px;
    font-weight: 700;
    transform: translate(-50%, -50%);
  }

  .home-mobile-nav__hamburger {
    width: 18px;
    display: grid;
    gap: 3px;
  }

  .home-mobile-nav__hamburger i {
    height: 2px;
    display: block;
    border-radius: 2px;
    background: currentcolor;
  }

  .home-mobile-nav__login {
    grid-column: 3;
    justify-self: end;
    min-width: 48px;
    min-height: 44px;
    padding: 0 4px;
    font-size: 14px;
    font-weight: 700;
  }

  .home-mobile-nav__account {
    position: relative;
    grid-column: 3;
    justify-self: end;
    width: 100%;
    min-width: 0;
  }

  .home-mobile-nav__account-trigger {
    width: 100%;
    min-height: 48px;
    display: grid;
    align-content: center;
    justify-items: end;
    padding: 4px 0;
    line-height: 1.25;
  }

  .home-mobile-nav__account-trigger strong,
  .home-mobile-nav__account-trigger span {
    display: block;
    overflow: hidden;
    max-width: 100%;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home-mobile-nav__account-trigger strong {
    font-size: 12px;
    font-weight: 700;
  }

  .home-mobile-nav__account-trigger span {
    color: rgb(255 255 255 / 78%);
    font-size: 9px;
  }

  .home-mobile-nav__account-trigger span.is-highlighted {
    color: #ffd47d;
    font-weight: 700;
  }

  .home-mobile-nav__balance {
    grid-column: 3;
  }

  .home-mobile-nav__account-menu {
    position: absolute;
    z-index: 240;
    top: calc(100% + 8px);
    right: 0;
    width: 96px;
    padding: 7px;
    border: 1px solid #e6e8ec;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 14px 34px rgb(15 23 42 / 20%);
    color: #252a32;
  }

  .home-mobile-nav__account-menu button {
    width: 100%;
    min-height: 40px;
    padding: 0 11px;
    border-radius: 7px;
    text-align: left;
    font-size: 13px;
  }

  .home-mobile-nav__account-menu button:hover {
    background: #f4f6f7;
  }

  .home-mobile-nav__account-menu button.is-danger {
    color: #dd4f4f;
  }

  .home-mobile-nav__overlay {
    position: fixed;
    z-index: 230;
    inset: 0 0 auto;
    height: calc(66.666dvh - 30px);
    display: grid;
    grid-template-rows: 64px minmax(0, 1fr) auto;
    overflow-y: auto;
    background: var(--home-mobile-nav-color);
    box-shadow: 0 16px 36px rgb(15 52 48 / 26%);
    color: #fff;
  }

  .home-mobile-nav__overlay:focus {
    outline: none;
  }

  .home-mobile-nav__overlay-header {
    display: flex;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid rgb(255 255 255 / 22%);
  }

  .home-mobile-nav__overlay-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-weight: 700;
  }

  .home-mobile-nav__overlay-brand img {
    width: 38px;
    height: 38px;
    overflow: hidden;
    border-radius: 9px;
  }

  .home-mobile-nav__menu {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: clamp(10px, 2vh, 16px);
    padding: 16px 24px;
  }

  .home-mobile-nav__menu button {
    padding: 4px 18px;
    font-size: clamp(17px, 4.6vw, 21px);
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .home-mobile-nav__menu button:focus-visible,
  .home-mobile-nav__collapse:focus-visible,
  .home-mobile-nav__trigger:focus-visible,
  .home-mobile-nav__login:focus-visible,
  .home-mobile-nav__account-trigger:focus-visible,
  .home-mobile-nav__account-menu button:focus-visible,
  .home-mobile-nav__brand-button:focus-visible,
  .home-mobile-nav__overlay-brand:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 4px;
  }

  .home-mobile-nav__footer {
    border-top: 1px solid rgb(255 255 255 / 14%);
  }

  .home-mobile-nav__collapse {
    width: 100%;
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-top: 1px solid rgb(255 255 255 / 18%);
    font-size: 13px;
    font-weight: 700;
  }

  .home-mobile-nav__collapse svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentcolor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }

  .home-mobile-menu-enter-active,
  .home-mobile-menu-leave-active {
    transition: opacity 180ms ease, transform 220ms ease;
  }

  .home-mobile-menu-enter-from,
  .home-mobile-menu-leave-to {
    opacity: 0;
    transform: translateY(-18px);
  }

  .mobile-account-menu-enter-active,
  .mobile-account-menu-leave-active {
    transition: opacity 150ms ease, transform 150ms ease;
  }

  .mobile-account-menu-enter-from,
  .mobile-account-menu-leave-to {
    opacity: 0;
    transform: translateY(-5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-mobile-menu-enter-active,
  .home-mobile-menu-leave-active {
    transition-duration: 1ms;
  }
}
</style>
