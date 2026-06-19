<template>
  <div class="result-page">
    <NavBar />
    <main class="result-main">
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

        <h1 class="result-title">
          {{ isAssessment ? '模拟考试完成!' : passClass === 'pass' ? '练习完成!' : '继续加油!' }}
        </h1>

        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-value">{{ correctCount }}/{{ totalCount }}</span
            ><span class="stat-label">正确 / 总题数</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-value">{{ accuracy }}%</span><span class="stat-label">正确率</span>
          </div>
          <div class="stat-divider" />
          <div class="stat-item">
            <span class="stat-value">{{ formattedTime }}</span
            ><span class="stat-label">用时</span>
          </div>
        </div>

        <div class="result-actions">
          <router-link :to="backTarget" class="btn btn--outline">{{ backLabel }}</router-link>
          <router-link :to="`/exam-result/${examId}`" class="btn btn--primary"
            >查看详细报告</router-link
          >
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 交卷结果页：按 source 区分诊断测试和试题库练习的返回入口。
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()
const examId = computed(() => (route.query.id as string) || '')
const totalCount = computed(() => parseInt(route.query.total as string) || 0)
const correctCount = computed(() => parseInt(route.query.correct as string) || 0)
const timeSeconds = computed(() => parseInt(route.query.time as string) || 0)
const isAssessment = computed(() => route.query.source === 'assessment')

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
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2rem;
}
.result-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
}
.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #0f172a;
}
.stat-label {
  font-size: 13px;
  color: #94a3b8;
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
.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.75rem;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;
}
.btn--primary {
  background: #4f46e5;
  color: #fff;
  border: none;
}
.btn--outline {
  background: #fff;
  color: #475569;
  border: 1px solid #e2e8f0;
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
