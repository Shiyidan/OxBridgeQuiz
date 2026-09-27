<!-- 后台指标标题后的统计口径提示，支持鼠标悬停和键盘聚焦。 -->
<template>
  <el-tooltip
    :content="content"
    placement="top"
    effect="light"
    :trigger="['hover', 'focus']"
    :show-after="150"
    :popper-options="{ modifiers: [{ name: 'preventOverflow', options: { padding: 16 } }] }"
    :popper-style="{ maxWidth: 'min(360px, calc(100vw - 32px))', boxSizing: 'border-box', whiteSpace: 'pre-line', lineHeight: '1.7' }"
  >
    <button class="metric-tooltip-trigger" type="button" :aria-label="`查看${title}的统计口径`">
      <QuestionFilled aria-hidden="true" />
    </button>
  </el-tooltip>
</template>

<script setup lang="ts">
import { QuestionFilled } from '@element-plus/icons-vue'

defineProps<{ title: string; content: string }>()
</script>

<style scoped lang="scss">
.metric-tooltip-trigger {
  display: inline-flex;
  flex-shrink: 0;
  width: 17px;
  height: 17px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #94a3b8;
  cursor: help;
}

.metric-tooltip-trigger:hover,
.metric-tooltip-trigger:focus-visible {
  color: #4f46e5;
}

.metric-tooltip-trigger:focus-visible {
  border-radius: 3px;
  outline: 2px solid #c7d2fe;
  outline-offset: 2px;
}
</style>
