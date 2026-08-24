<!-- 通用头像组件：在导航栏、个人中心与后台用户详情中统一展示头像图片及首字占位。 -->
<template>
  <span
    class="app-avatar"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : `${name}头像`"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <img
      v-if="shouldShowImage"
      :src="normalizedSource"
      alt=""
      draggable="false"
      @error="handleImageError"
    />
    <span v-else class="app-avatar__fallback" aria-hidden="true">{{ displayInitial }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface AppAvatarProps {
  source?: string | null
  name: string
  decorative?: boolean
}

const props = withDefaults(defineProps<AppAvatarProps>(), {
  source: null,
  decorative: false,
})

const imageLoadFailed = ref(false)

// 头像地址去除首尾空白后再交给浏览器，空字符串统一进入文字占位。
const normalizedSource = computed(() => props.source?.trim() || '')

// 仅在存在地址且当前地址未加载失败时渲染图片。
const shouldShowImage = computed(() => Boolean(normalizedSource.value) && !imageLoadFailed.value)

// 占位文字取展示名的首个 Unicode 字符，名称缺失时使用稳定的问号占位。
const displayInitial = computed(() => Array.from(props.name.trim())[0]?.toUpperCase() || '?')

// 图片请求失败后立即切回首字占位，避免显示浏览器破图图标。
function handleImageError(): void {
  imageLoadFailed.value = true
}

// 用户或头像地址变化后允许新资源重新发起加载。
watch(
  () => props.source,
  () => {
    imageLoadFailed.value = false
  },
)
</script>

<style scoped>
.app-avatar {
  display: grid;
  width: 100%;
  height: 100%;
  overflow: hidden;
  place-items: center;
  border-radius: inherit;
}

.app-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-avatar__fallback {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
}
</style>
