<!-- 公共基础弹窗：统一标题、内容间距和 Small 操作按钮，供前后台业务弹窗复用。 -->
<template>
  <ElDialog
    v-bind="$attrs"
    :model-value="modelValue"
    :title="title"
    :width="width"
    class="app-dialog"
    :class="{ 'app-dialog--no-divider': !showHeaderDivider }"
    :show-close="false"
    :close-on-click-modal="closeOnClickModal && !loading"
    :close-on-press-escape="closeOnPressEscape && !loading"
    :before-close="handleDismiss"
    :destroy-on-close="destroyOnClose"
    append-to-body
    align-center
    @update:model-value="updateVisible"
    @open="emit('open')"
    @opened="emit('opened')"
    @close="emit('close')"
    @closed="emit('closed')"
  >
    <template #header="{ titleId }">
      <h2 :id="titleId" class="app-dialog__title">{{ title }}</h2>
      <button
        v-if="showClose"
        type="button"
        class="app-dialog__close"
        aria-label="关闭弹窗"
        :disabled="loading"
        @click="requestCancel"
      >
        <ElIcon :size="16" aria-hidden="true"><Close /></ElIcon>
      </button>
    </template>

    <div v-if="icon" class="app-dialog__with-icon">
      <ElIcon class="app-dialog__content-icon" :size="24" :style="{ color: iconColor }" aria-hidden="true">
        <component :is="icon" />
      </ElIcon>
      <div class="app-dialog__icon-content"><slot /></div>
    </div>
    <slot v-else />

    <template v-if="showFooter" #footer>
      <div class="app-dialog__actions">
        <slot name="footer" :confirm="requestConfirm" :cancel="requestCancel" :loading="loading">
          <AppButton
            v-if="showCancel"
            type="secondary"
            size="small"
            :disabled="loading"
            @click="requestCancel"
          >
            {{ cancelText }}
          </AppButton>
          <AppButton
            v-if="showConfirm"
            :type="confirmType"
            size="small"
            :loading="loading"
            :disabled="confirmDisabled"
            @click="requestConfirm"
          >
            {{ confirmText }}
          </AppButton>
        </slot>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { watch, type Component } from 'vue'
import { ElDialog, ElIcon } from 'element-plus'
import { Close } from '@element-plus/icons-vue'
import AppButton from './AppButton.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    width?: string | number
    /** 可选内容图标；不传时不显示，不改变按钮类型或关闭规则。 */
    icon?: Component
    iconColor?: string
    showClose?: boolean
    showFooter?: boolean
    showHeaderDivider?: boolean
    showCancel?: boolean
    showConfirm?: boolean
    cancelText?: string
    confirmText?: string
    confirmType?: 'primary' | 'danger'
    confirmDisabled?: boolean
    loading?: boolean
    closeOnClickModal?: boolean
    closeOnPressEscape?: boolean
    destroyOnClose?: boolean
  }>(),
  {
    width: 520,
    showClose: true,
    showFooter: true,
    showHeaderDivider: true,
    showCancel: true,
    showConfirm: true,
    cancelText: '取消',
    confirmText: '确认',
    confirmType: 'primary',
    confirmDisabled: false,
    loading: false,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    destroyOnClose: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [visible: boolean]
  confirm: []
  cancel: []
  open: []
  opened: []
  close: []
  closed: []
}>()

let cancelRequested = false

// 新一轮打开重置取消保护，避免关闭动画期间重复发出取消事件。
watch(
  () => props.modelValue,
  (visible) => {
    if (visible) cancelRequested = false
  },
  { flush: 'sync' },
)

// Element Plus 关闭动画结束后也会同步状态，仅转发真实状态变化。
function updateVisible(visible: boolean): void {
  if (visible !== props.modelValue) emit('update:modelValue', visible)
}

// 确认只通知业务页面；保存成功后由页面关闭，校验或请求失败时保留内容。
function requestConfirm(): void {
  if (!props.modelValue || props.loading || props.confirmDisabled || cancelRequested) return
  emit('confirm')
}

// 取消和关闭图标走同一入口，加载期间禁止退出；父页面主动关闭不触发取消。
function requestCancel(): void {
  if (!props.modelValue || props.loading || cancelRequested) return
  cancelRequested = true
  emit('update:modelValue', false)
  emit('cancel')
}

// 可选的 Esc / 遮罩关闭也复用取消规则，避免绕过加载锁定。
function handleDismiss(done: () => void): void {
  if (!props.modelValue || props.loading || cancelRequested) return
  requestCancel()
  done()
}
</script>

<style scoped>
:global(.app-dialog.el-dialog) {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 32px);
  margin: auto;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-dialog);
  background: var(--color-surface);
  box-shadow: var(--shadow-dialog);
}

:global(.app-dialog .el-dialog__header) {
  position: relative;
  flex: none;
  margin: 0;
  padding: 18px 24px 14px;
  border-bottom: 1px solid var(--color-dialog-divider);
}

:global(.app-dialog--no-divider .el-dialog__header) {
  border-bottom: 0;
}

.app-dialog__title {
  margin: 0;
  padding: 0 40px 0 0;
  color: var(--color-ink);
  font-size: 18px;
  font-weight: var(--weight-semi);
  line-height: 28px;
  text-align: left;
  overflow-wrap: anywhere;
}

.app-dialog__close {
  position: absolute;
  top: 14px;
  right: 18px;
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-button);
  place-items: center;
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
}

.app-dialog__close:hover:not(:disabled) {
  background: var(--color-hover);
  color: var(--color-ink);
}

.app-dialog__close:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 2px;
}

.app-dialog__close:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

:global(.app-dialog .el-dialog__body) {
  flex: 1 1 auto;
  min-height: 80px;
  padding: 20px 24px 8px;
  overflow-y: auto;
  overscroll-behavior: contain;
  color: var(--color-ink-soft);
  font-size: 14px;
  line-height: 24px;
}

:global(.app-dialog .el-dialog__body > p) {
  margin: 0;
}

.app-dialog__with-icon {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.app-dialog__content-icon {
  flex: 0 0 24px;
  color: var(--color-ink-muted);
}

.app-dialog__icon-content {
  flex: 1;
  min-width: 0;
}

.app-dialog__icon-content :deep(> p) {
  margin: 0;
}

:global(.app-dialog .el-dialog__footer) {
  flex: none;
  padding: 12px 24px 20px;
}

.app-dialog__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}
</style>
