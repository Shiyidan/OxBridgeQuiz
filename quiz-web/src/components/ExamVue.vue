<!-- 答题页顶部导航栏：返回 + 标题 + 计时器 + 进度条，mode 决定计时方向与返回文案 -->
<template>
  <header class="exam-topbar">
    <div class="exam-topbar__inner">
      <button
        type="button"
        class="exam-topbar__back"
        :aria-label="backLabel"
        @click="$emit('back')"
      >
        <svg class="exam-topbar__back-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>{{ backLabel }}</span>
      </button>
      <div v-if="totalCount > 0" class="exam-topbar__exam" aria-live="polite">
        <div class="exam-topbar__exam-row">
          <strong class="exam-topbar__title">{{ headerText }}</strong>
          <span
            class="exam-topbar__timer"
            :class="{ 'exam-topbar__timer--warning': isCountdown && timerRemaining <= 300 }"
            :aria-label="isCountdown ? '剩余时间' : '已用时间'"
            >{{ timerText }}</span
          >
        </div>
        <div class="exam-topbar__progress" aria-hidden="true">
          <span :style="{ width: progressPercent }" />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import { EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'

export type ExamMode = 'question-bank' | 'assessment' | 'mock-exam'

// 每种答题模式对应的计时方向和返回按钮文案
const MODE_CONFIG: Record<ExamMode, { isCountdown: boolean; backLabel: string }> = {
  'question-bank': { isCountdown: false, backLabel: '返回试题库' },
  assessment: { isCountdown: true, backLabel: '返回诊断测试' },
  'mock-exam': { isCountdown: true, backLabel: '返回仿真考试' },
}

const props = withDefaults(
  defineProps<{
    examType: ExamType
    mode: ExamMode
    countdownDurationSeconds: number
    currentIndex: number
    totalCount: number
  }>(),
  {
    mode: 'question-bank',
    countdownDurationSeconds: 0,
    currentIndex: 0,
    totalCount: 0,
  },
)

const emit = defineEmits<{
  (e: 'time-expired'): void
  (e: 'back'): void
}>()

// 当前模式对应的配置（计时方向、返回文案）
const config = computed(() => MODE_CONFIG[props.mode])
const isCountdown = computed(() => config.value.isCountdown)
const backLabel = computed(() => config.value.backLabel)

// 页面初始化时打点，后续 tick 基于此时间戳与 wall clock 对比
const startedAt = Date.now()
let timerId: number | undefined
let isMounted = false
// 记录页面隐藏期间的总时长（毫秒），tick 中扣除以保证计时准确
let pausedDuration = 0
let pauseStartedAt = 0
// 5 分钟提醒只触发一次
let fiveMinWarned = false

// 从组件初始化到当前时刻的实际可见秒数
const timerElapsed = ref(0)

// 倒计时模式下剩余秒数，正计时模式恒为 0
const timerRemaining = computed(() =>
  isCountdown.value ? Math.max(0, props.countdownDurationSeconds - timerElapsed.value) : 0,
)

// 顶部显示的计时文本，格式 MM:SS
const timerText = computed(() => {
  const total = isCountdown.value ? timerRemaining.value : timerElapsed.value
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// 顶部标题：考试类型 + 当前题号
const headerText = computed(() => {
  const label =
    EXAM_TYPE_OPTIONS.find((item) => item.value === props.examType)?.label || props.examType
  return `${label}（第${props.currentIndex + 1}/${props.totalCount}题）`
})

// 进度条百分比
const progressPercent = computed(() =>
  props.totalCount ? `${((props.currentIndex + 1) / props.totalCount) * 100}%` : '0%',
)

// 每次 tick 基于 wall clock 计算实际经过的秒数，扣除暂停时长
function tick(): void {
  timerElapsed.value = Math.max(0, Math.round((Date.now() - startedAt - pausedDuration) / 1000))
  if (isCountdown.value && props.countdownDurationSeconds > 0) {
    // 剩余 5 分钟时弹出一次提醒
    if (!fiveMinWarned && timerRemaining.value <= 300) {
      fiveMinWarned = true
      ElNotification({
        title: '考试时间提醒',
        message: '考试时间仅剩5分钟，请抓紧答题哦',
        type: 'warning',
        duration: 5000,
      })
    }
    if (timerElapsed.value >= props.countdownDurationSeconds) {
      emit('time-expired')
    }
  }
}

// 启动计时器，每秒同步一次 wall clock
function startTimer(): void {
  tick()
  timerId = window.setInterval(tick, 1000)
}

// 停止计时器
function stopTimer(): void {
  if (timerId) {
    window.clearInterval(timerId)
    timerId = undefined
  }
}

// 页面隐藏时暂停计时，恢复时弹窗确认后继续；隐藏期间的时长不计入
function handleVisibilityChange(): void {
  if (document.hidden) {
    pauseStartedAt = Date.now()
    stopTimer()
    return
  }
  // 弹窗期间计时保持冻结，点击确定后才累加暂停时长并恢复
  ElMessageBox.alert('是否开始继续答题', '提示', {
    confirmButtonText: '确定',
    confirmButtonClass: 'button_primary',
    customClass: 'app-confirm-box',
    closeOnClickModal: false,
    showClose: false,
  }).then(() => {
    if (!isMounted) return
    pausedDuration += Date.now() - pauseStartedAt
    startTimer()
  })
}

// 挂载时启动计时并监听页面可见性变化
onMounted(() => {
  isMounted = true
  startTimer()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// 卸载时清理计时器和监听
onUnmounted(() => {
  isMounted = false
  stopTimer()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

// 暴露 startedAt 供父组件在交卷时使用
defineExpose({ startedAt, timerElapsed })
</script>

<style scoped lang="scss">
.exam-topbar {
  --exam-topbar-height: 64px;

  position: sticky;
  top: 0;
  z-index: 80;
  height: var(--exam-topbar-height);
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--color-line);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.exam-topbar__inner {
  width: 100%;
  max-width: 1360px;
  height: 100%;
  margin: 0 auto;
  padding: 0 32px;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  align-items: center;
  gap: 24px;
}
.exam-topbar__back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px 0 8px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-ink);
  cursor: pointer;
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  transition:
    background var(--duration-base) ease,
    color var(--duration-base) ease;
}
.exam-topbar__back:hover {
  background: var(--color-hover);
  color: var(--color-black);
}
.exam-topbar__back-icon {
  width: 20px;
  height: 20px;
}
.exam-topbar__exam {
  min-width: 0;
  display: grid;
  gap: 8px;
}
.exam-topbar__exam-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.exam-topbar__title {
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  white-space: nowrap;
}
.exam-topbar__timer {
  flex-shrink: 0;
  color: #1d4ed8;
  font-size: var(--text-lg);
  font-weight: 800;
}
.exam-topbar__timer--warning {
  color: #dc2626;
}
.exam-topbar__progress {
  height: 4px;
  background: #e2e8f0;
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.exam-topbar__progress span {
  display: block;
  height: 100%;
  background: #2563eb;
}
</style>
