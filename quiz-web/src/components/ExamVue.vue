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
    expiresAt?: string | null
    serverNow?: string | null
    initialElapsedSeconds?: number
    currentIndex: number
    totalCount: number
    answeredCount?: number
    sectionTitle?: string
    pauseOnVisibility?: boolean
    backLabelOverride?: string
  }>(),
  {
    mode: 'question-bank',
    countdownDurationSeconds: 0,
    expiresAt: null,
    serverNow: null,
    initialElapsedSeconds: 0,
    currentIndex: 0,
    totalCount: 0,
    sectionTitle: '',
    pauseOnVisibility: false,
    backLabelOverride: '',
  },
)

const emit = defineEmits<{
  (e: 'time-expired'): void
  (e: 'back'): void
  (e: 'answering-paused'): void
  (e: 'answering-resumed'): void
}>()

// 当前模式对应的配置（计时方向、返回文案）
const config = computed(() => MODE_CONFIG[props.mode])
const isCountdown = computed(
  () =>
    config.value.isCountdown ||
    (props.mode === 'question-bank' && props.countdownDurationSeconds > 0),
)
const usesContinuousClock = computed(() => isCountdown.value)
const backLabel = computed(() => props.backLabelOverride || config.value.backLabel)

// 页面初始化时打点，后续 tick 基于此时间戳与 wall clock 对比
const expiresAtTimestamp = props.expiresAt ? new Date(props.expiresAt).getTime() : Number.NaN
const hasServerDeadline = Number.isFinite(expiresAtTimestamp)
const serverClockOffsetMs = props.serverNow ? new Date(props.serverNow).getTime() - Date.now() : 0
const startedAt = hasServerDeadline
  ? expiresAtTimestamp - Math.max(0, props.countdownDurationSeconds) * 1000
  : Date.now() - Math.max(0, props.initialElapsedSeconds) * 1000
let timerId: number | undefined
let isMounted = false
// 记录页面隐藏期间的总时长（毫秒），tick 中扣除以保证计时准确
let pausedDuration = 0
let pauseStartedAt = 0
let isVisibilityPaused = false
// 5 分钟提醒只触发一次
let fiveMinWarned = false
let timeExpiredEmitted = false

// 从组件初始化到当前时刻的实际可见秒数
const timerElapsed = ref(Math.max(0, props.initialElapsedSeconds))

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

// 模块化考试在考试类型后补充当前科目，旧答题流程保持原有标题。
const headerText = computed(() => {
  const label =
    EXAM_TYPE_OPTIONS.find((item) => item.value === props.examType)?.label || props.examType
  const section = props.sectionTitle ? ` · ${props.sectionTitle}` : ''
  return `${label}${section}（第${props.currentIndex + 1}/${props.totalCount}题）`
})

// 诊断测试按当前分段已作答题量展示进度，其他答题模式保留按当前题号计算的兼容逻辑。
const progressPercent = computed(() => {
  if (!props.totalCount) return '0%'
  const completedCount = props.answeredCount ?? props.currentIndex + 1
  const boundedCount = Math.min(Math.max(completedCount, 0), props.totalCount)
  return `${(boundedCount / props.totalCount) * 100}%`
})

// 每次 tick 基于 wall clock 计算实际经过的秒数，扣除暂停时长
function tick(): void {
  if (isCountdown.value && hasServerDeadline) {
    const remainingSeconds = Math.max(
      0,
      Math.ceil((expiresAtTimestamp - (Date.now() + serverClockOffsetMs)) / 1000),
    )
    timerElapsed.value = Math.max(0, props.countdownDurationSeconds - remainingSeconds)
  } else {
    timerElapsed.value = Math.max(0, Math.round((Date.now() - startedAt - pausedDuration) / 1000))
  }
  if (isCountdown.value && props.countdownDurationSeconds > 0) {
    // 剩余 5 分钟时弹出一次提醒
    if (!fiveMinWarned && timerRemaining.value > 0 && timerRemaining.value <= 300) {
      fiveMinWarned = true
      ElNotification({
        title: '考试时间提醒',
        message: '考试时间仅剩5分钟，请抓紧答题哦',
        type: 'warning',
        duration: 5000,
      })
    }
    if (!timeExpiredEmitted && timerElapsed.value >= props.countdownDurationSeconds) {
      timeExpiredEmitted = true
      stopTimer()
      emit('time-expired')
    }
  }
}

// 启动计时器，每秒同步一次 wall clock
function startTimer(): void {
  stopTimer()
  tick()
  if (!timeExpiredEmitted) timerId = window.setInterval(tick, 1000)
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
    if (isVisibilityPaused) return
    isVisibilityPaused = true
    pauseStartedAt = Date.now()
    emit('answering-paused')
    stopTimer()
    return
  }
  if (!isVisibilityPaused) return

  // 可恢复诊断由父页面调用服务端恢复接口，旧截止时间不能在本组件内直接重启。
  if (props.pauseOnVisibility) {
    isVisibilityPaused = false
    emit('answering-resumed')
    return
  }

  // 真题与仿真考试按服务端截止时间继续计时，切回后直接恢复单题活跃耗时。
  if (usesContinuousClock.value) {
    startTimer()
    if (timeExpiredEmitted) return
    isVisibilityPaused = false
    emit('answering-resumed')
    ElNotification({
      title: '考试计时未暂停',
      message: '离开页面期间倒计时仍在继续，请继续作答。',
      type: 'warning',
      duration: 5000,
    })
    return
  }

  // 试题库练习在确认继续前保持总计时和单题耗时冻结。
  ElMessageBox.alert('是否开始继续答题', '提示', {
    confirmButtonText: '确定',
    confirmButtonClass: 'button_primary',
    customClass: 'app-confirm-box',
    closeOnClickModal: false,
    showClose: false,
  }).then(() => {
    if (!isMounted) return
    pausedDuration += Date.now() - pauseStartedAt
    isVisibilityPaused = false
    startTimer()
    emit('answering-resumed')
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
  background: rgba(255, 255, 255, 0.98);
  border-bottom: 1px solid var(--color-line);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.exam-topbar__inner {
  width: 100%;
  max-width: 1440px;
  height: 100%;
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
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
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  white-space: nowrap;
}
.exam-topbar__timer {
  flex-shrink: 0;
  color: var(--color-ink);
  font-size: var(--text-lg);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.exam-topbar__timer--warning {
  color: var(--color-danger);
}
.exam-topbar__progress {
  height: 4px;
  background: var(--color-line);
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.exam-topbar__progress span {
  display: block;
  height: 100%;
  background: var(--color-ink);
}
</style>
