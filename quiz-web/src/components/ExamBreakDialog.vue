<!-- 模块化诊断测试的固定休息弹窗：按服务端截止时间倒计时，可主动跳过。 -->
<template>
  <el-dialog
    :model-value="visible"
    width="440px"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :append-to-body="true"
    class="exam-break-dialog"
  >
    <div class="break-content" role="timer" aria-live="polite">
      <span class="break-content__eyebrow">Module Break</span>
      <h2>科目间休息</h2>
      <strong class="break-content__timer">{{ formattedRemaining }}</strong>
      <p>
        下一科为 <b>{{ nextModuleLabel }}</b
        >。倒计时结束后将自动开始，休息时间不计入作答时间。
      </p>
      <button
        type="button"
        class="break-content__skip button_primary"
        :disabled="skipping"
        @click="emit('skip')"
      >
        {{ skipping ? '正在开始...' : `跳过休息，开始 ${nextModuleLabel}` }}
      </button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    endsAt: string | null
    serverNow?: string | null
    nextModuleLabel: string
    skipping?: boolean
  }>(),
  {
    serverNow: null,
    skipping: false,
  },
)

const emit = defineEmits<{
  (event: 'skip'): void
  (event: 'elapsed'): void
}>()

const remainingSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
let clockOffsetMs = 0
let elapsedEmitted = false

const formattedRemaining = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// 使用绝对截止时间和服务端时钟偏移，页面切后台后倒计时仍保持准确。
function updateRemaining(): void {
  if (!props.visible || !props.endsAt) {
    remainingSeconds.value = 0
    return
  }
  const remainingMs = new Date(props.endsAt).getTime() - (Date.now() + clockOffsetMs)
  remainingSeconds.value = Math.max(0, Math.ceil(remainingMs / 1000))
  if (remainingMs <= 0 && !elapsedEmitted) {
    elapsedEmitted = true
    emit('elapsed')
  }
}

// 每次进入新的休息阶段都重置一次性到点事件和时钟偏移。
function resetTimer(): void {
  if (timer) clearInterval(timer)
  timer = null
  elapsedEmitted = false
  clockOffsetMs = props.serverNow ? new Date(props.serverNow).getTime() - Date.now() : 0
  updateRemaining()
  if (props.visible) timer = setInterval(updateRemaining, 250)
}

watch(() => [props.visible, props.endsAt, props.serverNow], resetTimer, { immediate: true })

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped lang="scss">
.break-content {
  display: grid;
  justify-items: center;
  padding: 8px 16px 18px;
  text-align: center;
}

.break-content__eyebrow {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.break-content h2 {
  margin: 8px 0 18px;
  color: var(--color-ink);
  font-size: var(--text-2xl);
}

.break-content__timer {
  color: var(--color-ink);
  font-size: 3.5rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.break-content p {
  max-width: 340px;
  margin: 18px 0 22px;
  color: var(--color-ink-soft);
  line-height: var(--leading-relaxed);
}

.break-content__skip {
  min-width: 240px;
  min-height: 44px;
  border: 0;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: var(--weight-semi);
}

.break-content__skip:disabled {
  cursor: wait;
  opacity: 0.6;
}
</style>
