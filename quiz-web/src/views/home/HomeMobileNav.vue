<!-- 移动端首页专用导航：以顶部折叠栏和全屏菜单承载首页主要业务入口。 -->
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
        aria-controls="home-mobile-menu"
        @click="openMenu"
      >
        <span class="home-mobile-nav__hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
        <strong>导航</strong>
      </button>
      <span class="home-mobile-nav__balance" aria-hidden="true"></span>
    </div>

    <Transition name="home-mobile-menu">
      <section
        v-if="menuOpen"
        id="home-mobile-menu"
        ref="overlayRef"
        class="home-mobile-nav__overlay"
        role="dialog"
        aria-modal="true"
        aria-label="首页导航"
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
            <span aria-hidden="true">⌄</span>
            收起
          </button>
        </footer>
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import brandIconUrl from '@/assets/brand/acemock-icon.png'
import type { ActiveExamType } from '@/stores/auth'

interface MobileMenuItem {
  key: string
  label: string
  path: string | null
}

const props = withDefaults(
  defineProps<{
    currentExam?: ActiveExamType | null
  }>(),
  {
    currentExam: null,
  },
)

const emit = defineEmits<{
  home: []
  navigate: [path: string]
}>()

const menuOpen = ref(false)
const overlayRef = ref<HTMLElement | null>(null)

// 考试介绍默认跟随首页当前备考目标，目标缺失时使用 TMUA 公共介绍。
const examIntroPath = computed(() => `/exam-intro/${(props.currentExam || 'TMUA').toLowerCase()}`)

// 移动端主导航保留首页核心学习模块，并补充资料下载入口。
const menuItems = computed<MobileMenuItem[]>(() => [
  { key: 'home', label: '首页', path: null },
  { key: 'assessment', label: '诊断测试', path: '/assessment' },
  { key: 'question-bank', label: '试题库', path: '/question-bank' },
  {
    key: 'mistake-notebook',
    label: '错题本',
    path: props.currentExam
      ? `/mistake-notebook?examType=${encodeURIComponent(props.currentExam)}`
      : '/mistake-notebook',
  },
  { key: 'exam-intro', label: '考试介绍', path: examIntroPath.value },
  { key: 'study-resources', label: '资料下载', path: '/study-resources' },
])

// 展开菜单后把焦点放到第一个入口，便于键盘和读屏用户继续操作。
function openMenu(): void {
  menuOpen.value = true
  void nextTick(() => overlayRef.value?.focus())
}

// 收起菜单并恢复首页内容区域。
function closeMenu(): void {
  menuOpen.value = false
}

// 首页入口先关闭全屏层，再由首页容器完成滚动定位。
function goHome(): void {
  closeMenu()
  emit('home')
}

// 站内菜单只表达目标路径，认证和路由守卫仍由首页容器及全局路由处理。
function navigate(path: string): void {
  closeMenu()
  emit('navigate', path)
}

// 首页菜单项区分首页滚动和普通站内路由两种动作。
function selectMenuItem(item: MobileMenuItem): void {
  if (item.path) navigate(item.path)
  else goHome()
}

// 全屏菜单打开时锁定页面滚动，并允许 Escape 快速收起。
function handleEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeMenu()
}

watch(menuOpen, (open) => {
  document.body.classList.toggle('home-mobile-nav-open', open)
  if (open) document.addEventListener('keydown', handleEscape)
  else document.removeEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.body.classList.remove('home-mobile-nav-open')
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
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
  }

  .home-mobile-nav__bar {
    height: 64px;
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr) 48px;
    align-items: center;
    padding: 0 16px;
    background: var(--home-mobile-nav-color);
    box-shadow: 0 8px 22px rgb(73 10 12 / 16%);
    color: #fff;
  }

  .home-mobile-nav__brand-button,
  .home-mobile-nav__trigger,
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
    justify-self: center;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 44px;
    padding: 0 18px;
    font-size: 14px;
    font-weight: 700;
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

  .home-mobile-nav__collapse span {
    font-size: 24px;
    line-height: 1;
    transform: translateY(-3px);
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
}

@media (prefers-reduced-motion: reduce) {
  .home-mobile-menu-enter-active,
  .home-mobile-menu-leave-active {
    transition-duration: 1ms;
  }
}
</style>
