<!-- 公共语言入口：在首页切换对应 URL，其他页面保留当前业务路径。 -->
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { localeForHomePath, setSiteLocale, useSiteLocale, type SiteLocale } from '@/locales'

const route = useRoute()
const router = useRouter()
const { isEnglish } = useSiteLocale()

// 首页切换保留查询参数和锚点，购买回跳等意图不因语言切换丢失。
async function switchLanguage(nextLocale: SiteLocale) {
  if (nextLocale === (isEnglish.value ? 'en' : 'zh-CN')) return
  if (localeForHomePath(route.path)) {
    await router.push({
      path: nextLocale === 'en' ? '/en/' : '/',
      query: route.query,
      hash: route.hash,
    })
  } else {
    setSiteLocale(nextLocale)
  }
}
</script>

<template>
  <button
    class="language-switcher"
    type="button"
    :lang="isEnglish ? 'zh-CN' : 'en'"
    :aria-label="isEnglish ? '切换到中文' : 'Switch to English'"
    :title="isEnglish ? '切换到中文' : 'Switch to English'"
    @click="switchLanguage(isEnglish ? 'zh-CN' : 'en')"
  >
    <span>{{ isEnglish ? 'CN' : 'EN' }}</span>
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 5h10m-3-3 3 3-3 3M13 11H3m3-3-3 3 3 3" />
    </svg>
  </button>
</template>

<style scoped>
.language-switcher {
  flex: none;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 44px;
  height: 28px;
  padding: 0 4px;
  gap: 2px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--language-text, #687787);
  font: 600 11px/1 var(--font-sans, sans-serif);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 160ms ease,
    color 160ms ease;
}
.language-switcher svg {
  width: 11px;
  height: 11px;
  flex: none;
  stroke: currentColor;
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.65;
}
.language-switcher:hover {
  background: var(--language-hover, #f2f5f7);
  color: var(--language-hover-text, #0f5e55);
}
.language-switcher:focus-visible {
  outline: 2px solid #387ed5;
  outline-offset: 2px;
}
@media (max-width: 860px) {
  .language-switcher {
    height: 36px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .language-switcher {
    transition: none;
  }
}
</style>
