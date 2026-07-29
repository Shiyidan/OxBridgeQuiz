<!-- 项目通用确认弹窗：统一承载警告说明、取消与确认操作。 -->
<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="520px"
    class="app-confirm-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :append-to-body="true"
    align-center
    @close="handleDialogClose"
  >
    <div class="app-confirm-dialog__content">
      <span v-if="tone === 'warning'" class="app-confirm-dialog__warning" aria-hidden="true">
        !
      </span>
      <p>{{ message }}</p>
    </div>

    <template #footer>
      <div class="app-confirm-dialog__actions">
        <button type="button" class="button_cancel" @click="handleCancel">
          {{ cancelText }}
        </button>
        <button type="button" class="button_primary" @click="handleConfirm">
          {{ confirmText }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    tone?: 'warning' | 'default'
  }>(),
  {
    confirmText: '确认',
    cancelText: '取消',
    tone: 'warning',
  },
)

const emit = defineEmits<{
  'update:modelValue': [visible: boolean]
  confirm: []
  cancel: []
}>()

let actionHandled = false

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) actionHandled = false
  },
)

// 确认操作先标记主动关闭，避免 el-dialog 的 close 事件再次触发取消。
function handleConfirm(): void {
  actionHandled = true
  emit('update:modelValue', false)
  emit('confirm')
}

// 取消按钮与右上角关闭统一返回取消结果。
function handleCancel(): void {
  actionHandled = true
  emit('update:modelValue', false)
  emit('cancel')
}

// 仅将非按钮触发的关闭作为取消，保证一次交互只发出一个结果事件。
function handleDialogClose(): void {
  if (actionHandled) {
    actionHandled = false
    return
  }
  emit('update:modelValue', false)
  emit('cancel')
}
</script>

<style scoped lang="scss">
:global(.app-confirm-dialog) {
  padding: 0;
  border-radius: 5px;
}

:global(.app-confirm-dialog .el-dialog__header) {
  margin: 0;
  padding: 18px 24px 14px;
  border-bottom: 1px solid var(--color-line-soft);
}

:global(.app-confirm-dialog .el-dialog__title) {
  color: var(--color-ink);
  font-size: var(--text-xl);
  font-weight: var(--weight-semi);
}

:global(.app-confirm-dialog .el-dialog__headerbtn) {
  top: 14px;
  right: 18px;
}

:global(.app-confirm-dialog .el-dialog__body) {
  padding: 20px 24px 8px;
}

:global(.app-confirm-dialog .el-dialog__footer) {
  padding: 12px 24px 20px;
}

.app-confirm-dialog__content {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.app-confirm-dialog__content p {
  margin: 0;
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
}

.app-confirm-dialog__warning {
  display: grid;
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-warning);
  color: var(--color-ink-inverse);
  font-weight: var(--weight-bold);
}

.app-confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.app-confirm-dialog__actions button {
  min-width: 112px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 5px;
  white-space: nowrap;
}
</style>
