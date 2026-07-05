<template>
  <div class="result-page">
    <NavBar />
    <main class="result-main" :class="{ 'result-main--assessment': isAssessment }">
      <template v-if="isAssessment">
        <header class="assessment-result-header">
          <h1>诊断测试</h1>
          <p>{{ isAnalyzing ? '正在分析您的作答表现，请稍候。' : '诊断已完成，以下是您的评估结果。' }}</p>
        </header>

        <section v-if="isAnalyzing" class="analysis-card" aria-live="polite">
          <div class="analysis-spinner" aria-hidden="true">
            <span>诊</span>
          </div>
          <h2>正在诊断您的知识薄弱点</h2>

          <div class="analysis-progress">
            <div class="analysis-progress__meta">
              <span>已分析进度</span>
              <strong>{{ analysisProgress }}%</strong>
            </div>
            <div class="analysis-progress__track">
              <span :style="{ width: `${analysisProgress}%` }" />
            </div>
          </div>

          <div class="analysis-detail">
            <p>当前进度：第 {{ analysisQuestionIndex }} 题 / 共 {{ totalCount }} 题</p>
            <span>预计剩余时间：约 {{ remainingSeconds }} 秒</span>
          </div>

          <p :key="currentKnowledgePoint" class="analysis-topic">
            正在分析：{{ currentKnowledgePoint }}
          </p>
          <p class="analysis-note">诊断完成后将为您生成个性化学习报告</p>
        </section>

        <section v-else class="assessment-complete-card">
          <div class="complete-icon" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="#22c55e" stroke-width="3" fill="#ecfdf5" />
              <polyline
                points="20,32 28,40 44,24"
                stroke="#22c55e"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <h2>诊断完成!</h2>
          <router-link :to="`/exam-result/${examId}`" class="report-button button_primary">
            查看详细诊断报告 →
          </router-link>
        </section>
      </template>

      <div v-else class="result-card">
        <div class="result-icon" :class="passClass">
          <svg v-if="passClass === 'pass'" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="#10b981" stroke-width="3" fill="#ecfdf5" />
            <polyline
              points="20,32 28,40 44,24"
              stroke="#10b981"
              stroke-width="4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg v-else viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="#f59e0b" stroke-width="3" fill="#fffbeb" />
            <line
              x1="24"
              y1="24"
              x2="40"
              y2="40"
              stroke="#f59e0b"
              stroke-width="4"
              stroke-linecap="round"
            />
            <line
              x1="40"
              y1="24"
              x2="24"
              y2="40"
              stroke="#f59e0b"
              stroke-width="4"
              stroke-linecap="round"
            />
          </svg>
        </div>

        <h1 class="result-title">{{ passClass === 'pass' ? '练习完成!' : '继续加油!' }}</h1>

        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-value">{{ correctCount }}/{{ totalCount }}</span>
            <span class="stat-label">正确 / 总题数</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-value">{{ accuracy }}%</span>
            <span class="stat-label">正确率</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-value">{{ formattedTime }}</span>
            <span class="stat-label">用时</span>
          </div>
        </div>

        <div class="result-actions">
          <router-link :to="backTarget" class="btn button_cancel">{{ backLabel }}</router-link>
          <router-link :to="`/exam-result/${examId}`" class="btn button_primary">
            查看详细报告
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 交卷结果页：诊断测试先展示报告分析中间态，题库练习保留完成统计。
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

const ANALYSIS_DURATION_MS = 10000
const ANALYSIS_TICK_MS = 100
const KNOWLEDGE_SWITCH_MS = 1400
const analysisKnowledgePoints = [
  '代数运算与方程',
  '函数图像与变化率',
  '几何测量与空间想象',
  '概率统计与数据解释',
  '物理力学建模',
  '综合推理与审题习惯',
]

const route = useRoute()
const examId = computed(() => (route.query.id as string) || '')
const totalCount = computed(() => parseInt(route.query.total as string) || 0)
const correctCount = computed(() => parseInt(route.query.correct as string) || 0)
const timeSeconds = computed(() => parseInt(route.query.time as string) || 0)
const isAssessment = computed(() => route.query.source === 'assessment')
const isAnalyzing = ref(false)
const analysisProgress = ref(0)
const knowledgeIndex = ref(0)
let analysisTimer: number | undefined
let knowledgeTimer: number | undefined

// 交卷页通过 source 判断返回入口，避免诊断测试和题库练习互相串场。
const backTarget = computed(() => (isAssessment.value ? '/assessment' : '/question-bank'))
const backLabel = computed(() => (isAssessment.value ? '返回诊断测试' : '返回试题库'))
const accuracy = computed(() =>
  totalCount.value > 0 ? Math.round((correctCount.value / totalCount.value) * 100) : 0,
)
const passClass = computed(() => (accuracy.value >= 60 ? 'pass' : 'fail'))
const formattedTime = computed(() => {
  const m = Math.floor(timeSeconds.value / 60)
  const s = timeSeconds.value % 60
  return m > 0 ? `${m}分${s}秒` : `${s}秒`
})
const analysisQuestionIndex = computed(() => {
  if (totalCount.value <= 0) return 0
  return Math.min(
    totalCount.value,
    Math.max(1, Math.ceil((analysisProgress.value / 100) * totalCount.value)),
  )
})
const remainingSeconds = computed(() =>
  Math.max(0, Math.ceil((ANALYSIS_DURATION_MS * (100 - analysisProgress.value)) / 100 / 1000)),
)
const currentKnowledgePoint = computed(
  () => analysisKnowledgePoints[knowledgeIndex.value % analysisKnowledgePoints.length],
)

// 诊断测试交卷后模拟 10 秒报告分析过程，再进入完成态。
onMounted(() => {
  if (!isAssessment.value) return
  startAnalysis()
})

onBeforeUnmount(() => {
  stopAnalysisTimers()
})

function startAnalysis(): void {
  isAnalyzing.value = true
  analysisProgress.value = 0
  knowledgeIndex.value = 0
  const startedAt = Date.now()

  analysisTimer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt
    analysisProgress.value = Math.min(100, Math.round((elapsed / ANALYSIS_DURATION_MS) * 100))
    if (analysisProgress.value >= 100) {
      isAnalyzing.value = false
      stopAnalysisTimers()
    }
  }, ANALYSIS_TICK_MS)

  knowledgeTimer = window.setInterval(() => {
    knowledgeIndex.value += 1
  }, KNOWLEDGE_SWITCH_MS)
}

function stopAnalysisTimers(): void {
  if (analysisTimer) window.clearInterval(analysisTimer)
  if (knowledgeTimer) window.clearInterval(knowledgeTimer)
  analysisTimer = undefined
  knowledgeTimer = undefined
}
</script>

<style lang="scss">
.result-page {
  min-height: 100vh;
  background: #f8fafc;
}

.result-main {
  max-width: 640px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.result-main--assessment {
  max-width: 960px;
  padding-top: 28px;
}

.assessment-result-header {
  margin-bottom: 28px;
}

.assessment-result-header h1 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 28px;
  font-weight: 800;
}

.assessment-result-header p {
  margin: 0;
  color: #64748b;
  font-size: 15px;
}

.analysis-card,
.assessment-complete-card {
  width: min(526px, 100%);
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.04);
}

.analysis-card {
  padding: 36px 38px 34px;
}

.analysis-spinner {
  position: relative;
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  margin: 0 auto 24px;
  border: 4px solid #edf2ff;
  border-top-color: #2f6bed;
  border-left-color: #2f6bed;
  border-radius: 50%;
  animation: analysis-spin 1s linear infinite;
}

.analysis-spinner span {
  color: #2f6bed;
  font-size: 20px;
  font-weight: 800;
  animation: analysis-spin-reverse 1s linear infinite;
}

.analysis-card h2,
.assessment-complete-card h2 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 800;
}

.analysis-progress {
  margin-top: 28px;
  text-align: left;
}

.analysis-progress__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
}

.analysis-progress__meta strong {
  color: #2563eb;
}

.analysis-progress__track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f1f5f9;
}

.analysis-progress__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2f6bed;
  transition: width 0.1s linear;
}

.analysis-detail {
  margin-top: 26px;
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
}

.analysis-detail p {
  margin: 0 0 6px;
}

.analysis-detail span {
  color: #94a3b8;
  font-weight: 500;
}

.analysis-topic {
  min-height: 20px;
  margin: 42px 0 0;
  color: #64748b;
  font-size: 13px;
  font-style: italic;
  animation: topic-fade 1.4s ease both;
}

.analysis-note {
  margin: 54px 0 0;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  color: #94a3b8;
  font-size: 12px;
}

.assessment-complete-card {
  padding: 34px 32px 38px;
}

.complete-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: #dcfce7;
}

.complete-icon svg {
  width: 100%;
  height: 100%;
}

.assessment-complete-card h2 {
  margin-bottom: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid #eef2f7;
}

.report-button {
  width: 100%;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
  border-radius: 8px;
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  text-decoration: none;
}

.result-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 3rem 2.5rem;
  text-align: center;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.04);
}

.result-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 1.5rem;
}

.result-icon svg {
  width: 100%;
  height: 100%;
}

.result-title {
  margin: 0 0 2rem;
  color: #0f172a;
  font-size: 24px;
  font-weight: 700;
}

.result-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  border-radius: 8px;
  background: #f8fafc;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  color: #0f172a;
  font-size: 26px;
  font-weight: 700;
}

.stat-label {
  color: #94a3b8;
  font-size: 13px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #e2e8f0;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.result-page .btn {
  padding: 0.75rem 1.75rem;
  font-size: 15px;
}

@keyframes analysis-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes analysis-spin-reverse {
  to {
    transform: rotate(-360deg);
  }
}

@keyframes topic-fade {
  0% {
    opacity: 0;
    transform: translateY(6px);
  }

  20%,
  80% {
    opacity: 1;
    transform: translateY(0);
  }

  100% {
    opacity: 0.75;
    transform: translateY(-2px);
  }
}

@media (max-width: 640px) {
  .result-stats,
  .result-actions {
    flex-direction: column;
  }

  .stat-divider {
    display: none;
  }

  .analysis-card,
  .assessment-complete-card {
    padding-right: 24px;
    padding-left: 24px;
  }
}
</style>
