<!-- 诊断报告分析弹窗：交卷后展示真实生成进度，并在报告落库后提供主动查看入口。 -->
<template>
  <el-dialog
    :model-value="modelValue"
    width="560px"
    class="diagnostic-analysis-dialog"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :append-to-body="true"
    align-center
  >
    <button
      type="button"
      class="diagnostic-analysis-dialog__close"
      aria-label="关闭分析窗口并返回诊断测试"
      title="关闭并返回诊断测试"
      @click="returnToAssessment"
    >
      ×
    </button>

    <section v-if="analysisFailed" class="analysis-state analysis-state--failed" aria-live="polite">
      <div class="analysis-state__icon analysis-state__icon--failed" aria-hidden="true">!</div>
      <h2>最新一次诊断分析失败</h2>
      <p class="analysis-state__description">
        {{ analysisError || '报告生成过程中发生异常，请重新分析。' }}
      </p>
      <div class="analysis-state__actions">
        <button type="button" class="button_primary" :disabled="retrying" @click="retryAnalysis">
          {{ retrying ? '正在重新发起...' : '重新分析' }}
        </button>
        <button type="button" class="button_cancel" @click="returnToAssessment">返回诊断测试</button>
      </div>
      <p class="analysis-state__note">其他已完成测试的报告可从诊断测试首页“历次记录”查看。</p>
    </section>

    <section v-else-if="isAnalyzing" class="analysis-state" aria-live="polite">
      <div class="analysis-spinner" aria-hidden="true">
        <span>诊</span>
      </div>
      <p class="analysis-state__eyebrow">答卷已提交并安全保存</p>
      <h2>{{ analysisMessage }}</h2>
      <p class="analysis-state__description">正在根据本次作答生成个性化诊断结果，请稍候。</p>

      <div
        class="analysis-progress"
        role="progressbar"
        aria-label="诊断报告分析进度"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="analysisProgress"
      >
        <div class="analysis-progress__meta">
          <span>分析进度</span>
          <strong>{{ analysisProgress }}%</strong>
        </div>
        <div class="analysis-progress__track">
          <span :style="{ width: `${analysisProgress}%` }" />
        </div>
      </div>

      <div class="analysis-module-ticker">
        <span>正在构建</span>
        <div class="analysis-module-ticker__viewport">
          <Transition name="module-caption" mode="out-in">
            <strong :key="currentAnalysisModule">{{ currentAnalysisModule }}</strong>
          </Transition>
        </div>
        <small>{{ currentModuleIndex + 1 }}/{{ ANALYSIS_MODULES.length }}</small>
      </div>
      <p v-if="pollError" class="analysis-state__error">{{ pollError }}</p>
      <p class="analysis-state__note">关闭弹窗不会停止后台分析，完成后可从诊断测试首页查看报告。</p>
    </section>

    <section v-else class="analysis-state analysis-state--completed" aria-live="polite">
      <div class="analysis-state__icon analysis-state__icon--completed" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="#16a34a" stroke-width="3" fill="#ecfdf5" />
          <polyline
            points="20,32 28,40 44,24"
            stroke="#16a34a"
            stroke-width="4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <p class="analysis-state__eyebrow">诊断结果已保存</p>
      <h2>诊断报告生成完成</h2>
      <p class="analysis-state__description">六大诊断模块已生成，您可以立即查看完整报告。</p>
      <div class="analysis-state__actions analysis-state__actions--completed">
        <button type="button" class="button_primary" @click="viewCurrentReport">
          查看诊断报告
        </button>
        <button type="button" class="button_cancel" @click="returnToAssessment">返回诊断测试</button>
      </div>
    </section>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  getDiagnosticReportStatus,
  retryDiagnosticReport,
  type DiagnosticReportStatus,
} from '@/api/exam'
import { getApiErrorMessage } from '@/utils/request'

const STATUS_POLL_MS = 2000
const VISUAL_PROGRESS_DURATION_MS = 12000
const VISUAL_PROGRESS_START = 8
const VISUAL_PROGRESS_LIMIT = 99
const VISUAL_PROGRESS_TICK_MS = 80
const ANALYSIS_MODULES = [
  '等效评估分',
  '总体成绩概览',
  '知识点掌握度',
  '错题逐题分析',
  'AI 提升规划表',
  'AI 定制三阶段学习路径',
] as const

const props = defineProps<{
  modelValue: boolean
  examId: string
}>()

const emit = defineEmits<{
  'view-report': [target: string]
  'return-assessment': []
}>()

const visualProgress = ref(VISUAL_PROGRESS_START)
const analysisStatus = ref<DiagnosticReportStatus['status']>('pending')
const analysisMessage = ref('正在准备诊断分析')
const analysisError = ref('')
const pollError = ref('')
const reportKind = ref<DiagnosticReportStatus['reportKind']>('esat')
const reportExamRecordId = ref('')
const retrying = ref(false)
let pollTimer: number | undefined
let completionTimer: number | undefined
let visualProgressTimer: number | undefined
let visualProgressStartedAt = 0
let reportReady = false

const isAnalyzing = computed(
  () => analysisStatus.value === 'pending' || analysisStatus.value === 'analyzing',
)
const analysisFailed = computed(() => analysisStatus.value === 'failed')
const analysisProgress = computed(() => Math.floor(visualProgress.value))
// 六个分析模块按照单向视觉进度依次展示，到最后一项后停留，不再循环。
const currentModuleIndex = computed(() => Math.min(
  ANALYSIS_MODULES.length - 1,
  Math.floor((analysisProgress.value / VISUAL_PROGRESS_LIMIT) * ANALYSIS_MODULES.length),
))
const currentAnalysisModule = computed(() => ANALYSIS_MODULES[currentModuleIndex.value]!)

// 弹窗每次绑定新的考试记录时重置展示状态，并读取对应后台任务进度。
watch(
  () => [props.modelValue, props.examId] as const,
  ([visible, examId], previousValues) => {
    const [previousVisible, previousExamId] = previousValues || [undefined, undefined]
    if (!visible || !examId) {
      if (!visible) stopAnalysisPolling()
      return
    }
    if (visible === previousVisible && examId === previousExamId) return
    initializeAnalysis()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  stopAnalysisPolling()
})

// 新一次交卷从最低进度开始，确保旧报告状态不会短暂闪现在当前弹窗。
function initializeAnalysis(): void {
  stopAnalysisPolling()
  visualProgress.value = VISUAL_PROGRESS_START
  visualProgressStartedAt = Date.now()
  reportReady = false
  analysisStatus.value = 'pending'
  analysisMessage.value = '正在准备诊断分析'
  analysisError.value = ''
  pollError.value = ''
  reportExamRecordId.value = ''
  startVisualProgress()
  void pollAnalysisStatus()
}

// 后端完成后仍展示满 6 秒，随后停在完成态，等待用户主动查看报告。
async function pollAnalysisStatus(): Promise<void> {
  if (!props.modelValue || !props.examId) return
  try {
    const status = await getDiagnosticReportStatus(props.examId)
    if (!props.modelValue) return
    pollError.value = ''
    analysisStatus.value = status.status
    analysisMessage.value = status.message
    analysisError.value = status.errorMessage || ''
    reportKind.value = status.reportKind
    reportExamRecordId.value = status.reportExamRecordId || ''

    if (status.status === 'completed' && status.reportExamRecordId) {
      stopStatusPolling()
      analysisStatus.value = 'analyzing'
      analysisMessage.value = '诊断报告已生成，正在整理六大模块'
      reportReady = true
      advanceVisualProgress()
      return
    }
    if (status.status === 'failed') {
      stopStatusPolling()
      stopVisualProgress()
      return
    }
  } catch (error: unknown) {
    pollError.value = getApiErrorMessage(error, '暂时无法获取分析进度，正在重试。')
  }
  pollTimer = window.setTimeout(() => void pollAnalysisStatus(), STATUS_POLL_MS)
}

// 失败重试只重新执行报告任务，不会重复提交答卷或扣减诊断额度。
async function retryAnalysis(): Promise<void> {
  if (retrying.value || !props.examId) return
  retrying.value = true
  try {
    await retryDiagnosticReport(props.examId)
    initializeAnalysis()
  } catch (error: unknown) {
    analysisError.value = getApiErrorMessage(error, '重新分析失败，请稍后重试。')
  } finally {
    retrying.value = false
  }
}

// 报告类型决定进入 ESAT 或 TMUA 独立页面，避免两套诊断页面混用。
function reportPath(kind: DiagnosticReportStatus['reportKind'], recordId: string): string {
  if (kind === 'esat') return `/exam-result/${recordId}/esat`
  if (kind === 'tmua') return `/exam-result/${recordId}/tmua`
  return `/exam-result/${recordId}`
}

// 完成态只发出导航意图，是否离开答题页由父页面统一处理。
function viewCurrentReport(): void {
  const recordId = reportExamRecordId.value || props.examId
  emit('view-report', reportPath(reportKind.value, recordId))
}

// 返回诊断列表由父页面执行路由跳转，弹窗本身不直接依赖页面路由。
function returnToAssessment(): void {
  emit('return-assessment')
}

// 视觉进度在固定时长内匀速走到 99%；后台未完成时保持 99%，完成后才进入 100%。
function startVisualProgress(): void {
  stopVisualProgress()
  visualProgressTimer = window.setInterval(advanceVisualProgress, VISUAL_PROGRESS_TICK_MS)
  advanceVisualProgress()
}

// 后端完成得较快时仍保持匀速走完；若已经停在 99%，收到完成状态后立即收尾。
function advanceVisualProgress(): void {
  const elapsed = Math.max(0, Date.now() - visualProgressStartedAt)
  const ratio = Math.min(1, elapsed / VISUAL_PROGRESS_DURATION_MS)
  const nextProgress = VISUAL_PROGRESS_START
    + (VISUAL_PROGRESS_LIMIT - VISUAL_PROGRESS_START) * ratio
  visualProgress.value = Math.max(visualProgress.value, nextProgress)

  if (!reportReady || visualProgress.value < VISUAL_PROGRESS_LIMIT) return
  visualProgress.value = 100
  stopVisualProgress()
  if (completionTimer) return
  completionTimer = window.setTimeout(() => {
    analysisStatus.value = 'completed'
    completionTimer = undefined
  }, 420)
}

function stopVisualProgress(): void {
  if (visualProgressTimer) window.clearInterval(visualProgressTimer)
  visualProgressTimer = undefined
}

function stopStatusPolling(): void {
  if (pollTimer) window.clearTimeout(pollTimer)
  pollTimer = undefined
}

function stopAnalysisPolling(): void {
  stopStatusPolling()
  if (completionTimer) window.clearTimeout(completionTimer)
  completionTimer = undefined
  stopVisualProgress()
}

</script>

<style lang="scss">
.diagnostic-analysis-dialog {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
}

.diagnostic-analysis-dialog__close {
  width: 34px;
  height: 34px;
  position: absolute;
  z-index: 2;
  top: 14px;
  right: 14px;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #94a3b8;
  font-family: inherit;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.diagnostic-analysis-dialog__close:hover {
  background: #f1f5f9;
  color: #334155;
}

.diagnostic-analysis-dialog__close:focus-visible {
  outline: 2px solid #7c3aed;
  outline-offset: 2px;
}

.diagnostic-analysis-dialog .el-dialog__header {
  display: none;
}

.diagnostic-analysis-dialog .el-dialog__body {
  padding: 40px 42px 36px;
}

.analysis-state {
  text-align: center;
}

.analysis-state h2 {
  margin: 8px 0 0;
  color: #172033;
  font-size: 22px;
  font-weight: 800;
}

.analysis-state__eyebrow {
  margin: 0;
  color: #7c3aed;
  font-size: 13px;
  font-weight: 700;
}

.analysis-state__description {
  margin: 12px 0 0;
  color: #718096;
  font-size: 14px;
  line-height: 1.7;
}

.analysis-spinner {
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  margin: 0 auto 22px;
  border: 4px solid #eee9ff;
  border-top-color: #7c3aed;
  border-left-color: #7c3aed;
  border-radius: 50%;
  animation: diagnostic-analysis-spin 1s linear infinite;
}

.analysis-spinner span {
  color: #7c3aed;
  font-size: 20px;
  font-weight: 800;
  animation: diagnostic-analysis-spin-reverse 1s linear infinite;
}

.analysis-progress {
  margin-top: 28px;
  text-align: left;
}

.analysis-progress__meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 9px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.analysis-progress__meta strong {
  color: #7c3aed;
}

.analysis-progress__track {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1f3f7;
}

.analysis-progress__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #7c3aed, #3b82f6);
  transition: width 0.08s linear;
}

.analysis-module-ticker {
  min-height: 44px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin-top: 28px;
  padding: 10px 14px;
  overflow: hidden;
  border: 1px solid #e9e5ff;
  border-radius: 9px;
  background: #faf9ff;
  color: #94a3b8;
  font-size: 12px;
  text-align: left;
}

.analysis-module-ticker__viewport {
  min-width: 0;
  height: 20px;
  position: relative;
  overflow: hidden;
}

.analysis-module-ticker__viewport strong {
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: #6d28d9;
  font-size: 13px;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-state__note,
.analysis-state__error {
  margin: 24px 0 0;
  color: #94a3b8;
  font-size: 12px;
}

.analysis-state__error {
  color: #dc2626;
}

.analysis-state__icon {
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  margin: 0 auto 20px;
  border-radius: 50%;
  font-size: 28px;
  font-weight: 800;
}

.analysis-state__icon--failed {
  background: #fff1f2;
  color: #dc2626;
}

.analysis-state__icon--completed {
  background: #ecfdf5;
}

.analysis-state__icon svg {
  width: 100%;
  height: 100%;
}

.analysis-state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
}

.analysis-state__actions button {
  min-width: 138px;
  min-height: 42px;
  padding: 0 20px;
  border-radius: 8px;
}

.analysis-state__actions--completed .button_primary {
  min-width: 180px;
}

.module-caption-enter-active,
.module-caption-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.module-caption-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.module-caption-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

@keyframes diagnostic-analysis-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes diagnostic-analysis-spin-reverse {
  to {
    transform: rotate(-360deg);
  }
}

@media (max-width: 640px) {
  .diagnostic-analysis-dialog {
    width: calc(100% - 32px) !important;
  }

  .diagnostic-analysis-dialog .el-dialog__body {
    padding: 34px 22px 28px;
  }
}
</style>
