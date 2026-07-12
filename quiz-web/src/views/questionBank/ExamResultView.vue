<!-- 交卷结果入口：诊断测试复用统一分析弹窗，题库练习展示本次完成统计。 -->
<template>
  <div class="result-page">
    <NavBar />

    <DiagnosticAnalysisDialog
      v-if="isAssessment"
      :model-value="true"
      :exam-id="examId"
      @view-report="handleViewDiagnosticReport"
      @return-assessment="handleReturnToAssessment"
    />

    <main v-else class="result-main">
      <div class="result-card">
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
          <router-link to="/question-bank" class="btn button_cancel">返回试题库</router-link>
          <router-link
            :to="{ name: 'exam-result-detail', params: { id: examId }, query: { from: 'question-bank' } }"
            class="btn button_primary"
          >
            查看详细报告
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import DiagnosticAnalysisDialog from '@/components/DiagnosticAnalysisDialog.vue'

const route = useRoute()
const router = useRouter()
const examId = computed(() => (route.query.id as string) || '')
const totalCount = computed(() => parseInt(route.query.total as string) || 0)
const correctCount = computed(() => parseInt(route.query.correct as string) || 0)
const timeSeconds = computed(() => parseInt(route.query.time as string) || 0)
const isAssessment = computed(() => route.query.source === 'assessment')
const accuracy = computed(() =>
  totalCount.value > 0 ? Math.round((correctCount.value / totalCount.value) * 100) : 0,
)
const passClass = computed(() => (accuracy.value >= 60 ? 'pass' : 'fail'))
const formattedTime = computed(() => {
  const minutes = Math.floor(timeSeconds.value / 60)
  const seconds = timeSeconds.value % 60
  return minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`
})

// 诊断分析完成后只响应用户主动查看，不由状态恢复页自动跳转。
async function handleViewDiagnosticReport(target: string): Promise<void> {
  await router.push(target)
}

// 关闭统一分析弹窗后返回诊断测试首页，后台任务不受页面卸载影响。
async function handleReturnToAssessment(): Promise<void> {
  await router.push('/assessment')
}
</script>

<style scoped lang="scss">
.result-page {
  min-height: 100vh;
  background: #f8fafc;
}

.result-main {
  max-width: 640px;
  margin: 0 auto;
  padding: 4rem 2rem;
}

.result-card {
  padding: 3rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
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

@media (max-width: 640px) {
  .result-stats,
  .result-actions {
    flex-direction: column;
  }

  .stat-divider {
    display: none;
  }
}
</style>
