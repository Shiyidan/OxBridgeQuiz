<!-- 标题和目录共用的自主点亮按钮：支持亮暗、部分完成、保存中及键盘可访问状态。 -->
<template>
  <span class="learning-light" @click.stop @keydown.stop>
    <AppButton
      type="secondary"
      :size="compact ? 'mini' : 'small'"
      :icon="LearningBulbIcon"
      :icon-only="compact"
      :loading="busy"
      :disabled="disabled"
      :class="{ 'is-lit': active, 'is-partial': partial && !active }"
      :aria-pressed="partial && !active ? 'mixed' : active"
      :aria-label="description"
      :title="disabled ? undefined : description"
      @click="emit('toggle')"
      >{{ active ? '已点亮' : '点亮' }}</AppButton
    >
  </span>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import AppButton from '@/components/AppButton.vue'
import LearningBulbIcon from './LearningBulbIcon.vue'
const props = defineProps<{
  active: boolean
  partial?: boolean
  busy?: boolean
  disabled?: boolean
  compact?: boolean
  label: string
}>()
const emit = defineEmits<{ toggle: [] }>()
// 可访问名称同时说明对象和下一次动作，不仅靠颜色区别状态。
const description = computed(() =>
  props.active
    ? props.label + '已点亮，点击取消'
    : props.partial
      ? props.label + '部分已点亮，点击点亮全部'
      : '点亮' + props.label + '，标记为已学完',
)
</script>
<style scoped lang="scss">
.learning-light {
  display: inline-flex;
  flex-shrink: 0;
}
.learning-light :deep(.app-button.el-button.app-button--secondary) {
  --app-button-bg: transparent;
  --app-button-hover-bg: transparent;
  --app-button-active-bg: transparent;
  --app-button-color: #7a8798;
  border: 0;
  background: transparent;
  color: var(--app-button-color);

  &.is-lit {
    --app-button-color: #e5a800;
  }

  &.is-partial:not(.is-lit) {
    --app-button-color: #a66a08;
  }
}
.learning-light :deep(.app-button--mini) {
  min-width: 32px;
  min-height: 32px;
  padding: 5px;
}
.learning-light :deep(.el-icon) {
  width: 20px;
  height: 20px;
  font-size: 20px;
}
</style>
