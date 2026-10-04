<!-- 错题本收藏入口：在答题、解析和复习列表中收藏或取消收藏题目，并提示操作结果。 -->
<template>
  <el-tooltip ref="tooltipRef" :content="tooltipText" placement="top">
    <AppButton
      class="favorite-button"
      :class="{ 'is-selected': selected }"
      type="text"
      size="small"
      :icon="selected ? StarFilled : Star"
      icon-only
      :aria-label="failed ? '重试收藏状态' : selected ? '取消收藏' : '收藏题目'"
      :aria-pressed="selected"
      :disabled="pending"
      :aria-busy="pending || undefined"
      @click="toggle"
    />
  </el-tooltip>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage, type TooltipInstance } from 'element-plus'
import AppButton from '@/components/AppButton.vue'
import { useFavoritesStore } from '@/stores/favorites'
const props = defineProps<{ questionId: string }>()
const store = useFavoritesStore()
const tooltipRef = ref<TooltipInstance>()
const loading = ref(false)
const failed = ref(false)
// 请求期间锁定重复操作，保留原星标，避免加载图标替换造成闪烁。
const pending = computed(() => loading.value || Boolean(store.busy[props.questionId]))
// 同一题在不同页面使用同一个收藏状态。
const selected = computed(() => Boolean(store.states[props.questionId]))
// 根据收藏状态和加载结果提供操作提示。
const tooltipText = computed(() =>
  failed.value
    ? '收藏状态加载失败，点击重试'
    : selected.value
      ? '取消收藏'
      : '收藏题目，可在错题本中查看',
)
// 长短文案切换后重新定位提示框和箭头，避免箭头留在旧位置而露出菱形。
watch(tooltipText, () => tooltipRef.value?.updatePopper(), { flush: 'post' })
// 换题时只接受当前题的加载结果，避免快速切换造成错误状态。
async function refresh() {
  const id = props.questionId
  loading.value = true
  failed.value = false
  try {
    await store.load([id])
    if (id === props.questionId) failed.value = store.states[id] === undefined
  } catch {
    if (id === props.questionId) failed.value = true
  } finally {
    if (id === props.questionId) loading.value = false
  }
}
// 收藏状态由服务端确认后更新，取消收藏仅提示结果。
async function toggle() {
  if (failed.value) {
    await refresh()
    return
  }
  const id = props.questionId
  const previous = store.states[id]
  try {
    if (!(await store.setFavorite(id, !previous))) return
    if (!previous) {
      ElMessage.success('已收藏，可在错题本中整理分类')
      return
    }
    ElMessage.info('已取消收藏')
  } catch {
    /* 请求层展示失败信息，星标保持服务端最后一次成功状态。 */
  }
}
watch(() => props.questionId, refresh, { immediate: true })
</script>
<style scoped>
.favorite-button {
  margin-left: 6px;
}
/* 通过公共按钮的颜色变量覆盖各交互状态，避免悬浮或按下时恢复为黑色。 */
.favorite-button.app-button.el-button.app-button--text {
  --app-button-color: var(--color-ink-muted);
  /* 收藏状态只在请求成功后切换一次，不经过中间色或透明度动画。 */
  transition: none;
  opacity: 1;
  transform: none;
}
.favorite-button.app-button.el-button.app-button--text.is-selected {
  --app-button-color: var(--color-favorite);
  --app-button-bg: var(--color-favorite-bg);
  --app-button-hover-bg: var(--color-warning-bg);
  --app-button-active-bg: var(--color-warning-bg);
}
/* 请求期间禁用点击时仍保留悬浮底色，不闪回默认背景。 */
.favorite-button.app-button.el-button.app-button--text:hover {
  background: var(--app-button-hover-bg);
}
.favorite-button :deep(.el-icon) {
  font-size: 21px;
}
</style>
