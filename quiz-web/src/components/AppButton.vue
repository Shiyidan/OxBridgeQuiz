<!-- 公共按钮：前后台操作复用统一尺寸、语义样式、图标和加载状态。 -->
<template>
  <ElButton
    type="default"
    class="app-button"
    :class="[`app-button--${type}`, `app-button--${size}`, { 'app-button--icon-only': iconOnly }]"
    :native-type="nativeType"
    :auto-insert-space="false"
    :disabled="unavailable"
    :aria-busy="loading || undefined"
    :aria-label="ariaLabel"
    :title="iconOnly ? ariaLabel : undefined"
    @click="handleClick"
  >
    <ElIcon v-if="loading" class="app-button__loading" :size="16" aria-hidden="true">
      <Loading />
    </ElIcon>
    <ElIcon v-else-if="icon && (iconPosition === 'left' || iconOnly)" :size="16" aria-hidden="true">
      <component :is="icon" />
    </ElIcon>
    <span v-if="!iconOnly" class="app-button__label"><slot /></span>
    <ElIcon
      v-if="!loading && icon && iconPosition === 'right' && !iconOnly"
      :size="16"
      aria-hidden="true"
    >
      <component :is="icon" />
    </ElIcon>
  </ElButton>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { ElButton, ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    type?: 'primary' | 'secondary' | 'danger' | 'text' | 'link'
    size?: 'large' | 'medium' | 'small' | 'mini'
    nativeType?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    loading?: boolean
    /** 图标适用于所有按钮类型；不传时只显示文字。 */
    icon?: Component
    iconPosition?: 'left' | 'right'
    /** 纯图标按钮需同时提供 icon 和 ariaLabel，作为操作名称与悬浮提示。 */
    iconOnly?: boolean
    ariaLabel?: string
  }>(),
  {
    type: 'primary',
    size: 'medium',
    nativeType: 'button',
    disabled: false,
    loading: false,
    iconPosition: 'left',
    iconOnly: false,
  },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

// 加载期间一并禁用原生按钮，阻止重复点击和表单重复提交。
const unavailable = computed(() => props.disabled || props.loading)

// 仅转发可用状态下的点击，业务行为由调用页面处理。
function handleClick(event: MouseEvent) {
  if (!unavailable.value) emit('click', event)
}
</script>

<style scoped>
.app-button.el-button {
  --app-button-height: var(--height-button);
  --app-button-bg: var(--color-ink);
  --app-button-border: var(--color-ink);
  --app-button-color: var(--color-ink-inverse);
  --app-button-hover-bg: var(--color-charcoal);
  --app-button-hover-border: var(--color-charcoal);
  --app-button-active-bg: var(--color-black);
  --app-button-active-border: var(--color-black);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  flex: none;
  box-sizing: border-box;
  width: max-content;
  min-width: var(--button-min-width);
  height: var(--app-button-height);
  margin: 0;
  padding: 0 18px;
  border: 1px solid var(--app-button-border);
  border-radius: var(--radius-button);
  background: var(--app-button-bg);
  color: var(--app-button-color);
  font-family: inherit;
  font-size: 14px;
  font-weight: var(--weight-semi);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease,
    transform 0.2s ease;
}

/* Element Plus 的内容容器不额外增加间距，图文间距统一为 8px。 */
.app-button :deep(> span) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0;
  font-weight: inherit;
}

.app-button__label {
  font-weight: inherit;
}

.app-button.el-button:hover:not(:disabled) {
  border-color: var(--app-button-hover-border);
  background: var(--app-button-hover-bg);
  color: var(--app-button-color);
}

.app-button.el-button:active:not(:disabled) {
  border-color: var(--app-button-active-border);
  background: var(--app-button-active-bg);
  transform: translateY(1px);
}

.app-button.el-button:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 2px;
}

.app-button.el-button:disabled {
  border-color: var(--app-button-border);
  background: var(--app-button-bg);
  color: var(--app-button-color);
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.app-button.el-button.app-button--secondary {
  --app-button-bg: var(--color-surface);
  --app-button-color: var(--color-ink);
  --app-button-hover-bg: var(--color-hover);
  --app-button-hover-border: var(--color-ink);
  --app-button-active-bg: var(--color-surface-alt);
  --app-button-active-border: var(--color-ink);
}

.app-button.el-button.app-button--danger {
  --app-button-bg: var(--color-danger);
  --app-button-border: var(--color-danger);
  --app-button-hover-bg: var(--color-danger-hover);
  --app-button-hover-border: var(--color-danger-hover);
  --app-button-active-bg: var(--color-danger-active);
  --app-button-active-border: var(--color-danger-active);
}

.app-button.el-button.app-button--large {
  --app-button-height: var(--height-button-lg);
  padding: 0 22px;
  font-size: 16px;
}

.app-button.el-button.app-button--small {
  --app-button-height: var(--height-button-sm);
  min-width: 0;
  padding: 0 14px;
  font-size: 13px;
}

.app-button.el-button.app-button--mini {
  --app-button-height: var(--height-button-mini);
  min-width: 0;
  padding: 0 10px;
  font-size: 12px;
}

.app-button.el-button.app-button--text,
.app-button.el-button.app-button--link {
  --app-button-bg: transparent;
  --app-button-border: transparent;
  --app-button-color: var(--color-ink);
  --app-button-hover-bg: var(--color-hover);
  --app-button-hover-border: transparent;
  --app-button-active-bg: var(--color-active);
  --app-button-active-border: transparent;
  min-width: 0;
}

.app-button.el-button.app-button--text {
  padding: 0 12px;
}

.app-button.el-button.app-button--link {
  --app-button-hover-bg: transparent;
  --app-button-active-bg: transparent;
  height: auto;
  padding: 4px 0;
}

/* Link 的文字统一带下划线，图标仅作为可选内容。 */
.app-button--link .app-button__label {
  text-decoration: underline;
  text-underline-offset: 5px;
}

.app-button.el-button.app-button--link:hover:not(:disabled) {
  transform: translateY(-2px);
}

.app-button.el-button.app-button--link:active:not(:disabled) {
  transform: translateY(0);
}

.app-button.el-button.app-button--icon-only {
  width: var(--app-button-height);
  min-width: var(--app-button-height);
  height: var(--app-button-height);
  padding: 0;
}

.app-button__loading {
  animation: app-button-spin 0.8s linear infinite;
}

@keyframes app-button-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-button.el-button {
    transition: none;
  }

  .app-button.el-button:hover:not(:disabled),
  .app-button.el-button:active:not(:disabled),
  .app-button.el-button.app-button--link:hover:not(:disabled),
  .app-button.el-button.app-button--link:active:not(:disabled) {
    transform: none;
  }

  .app-button__loading {
    animation: none;
  }
}
</style>
