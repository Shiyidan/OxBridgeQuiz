<template>
  <div class="result-page">
    <NavBar />

    <main class="result-main">
      <div class="result-card">
        <!-- 结果图标 -->
        <div class="result-icon" :class="passClass">
          <svg v-if="passClass === 'pass'" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="#10b981" stroke-width="3" fill="#ecfdf5"/>
            <polyline points="20,32 28,40 44,24" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="#f59e0b" stroke-width="3" fill="#fffbeb"/>
            <line x1="24" y1="24" x2="40" y2="40" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
            <line x1="40" y1="24" x2="24" y2="40" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
          </svg>
        </div>

        <h1 class="result-title">{{ passClass === 'pass' ? '练习完成!' : '继续加油!' }}</h1>

        <!-- 核心统计 -->
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

        <!-- 操作按钮 -->
        <div class="result-actions">
          <router-link to="/question-bank" class="btn btn--outline">
            返回试题库
          </router-link>
          <router-link
            :to="`/exam-result/${examId}`"
            class="btn btn--primary"
          >
            查看详细结果
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()

const examId = computed(() => route.query.id as string || '')
const totalCount = computed(() => parseInt(route.query.total as string) || 0)
const correctCount = computed(() => parseInt(route.query.correct as string) || 0)
const timeSeconds = computed(() => parseInt(route.query.time as string) || 0)

const accuracy = computed(() =>
  totalCount.value > 0 ? Math.round((correctCount.value / totalCount.value) * 100) : 0
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
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 3rem 2.5rem;
  text-align: center;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.04);
}

.result-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 1.5rem;

  svg { width: 100%; height: 100%; }
}

.result-title {
  font-size: 1.5rem;
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
  border-radius: 14px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 1.625rem;
  font-weight: 700;
  color: #0f172a;
}

.stat-label {
  font-size: 0.8125rem;
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
  border-radius: 10px;
  font-size: 0.938rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.15s ease;

  &--primary {
    background: #4f46e5;
    color: #ffffff;
    border: none;
    &:hover { background: #6366f1; }
  }

  &--outline {
    background: #ffffff;
    color: #475569;
    border: 1px solid #e2e8f0;
    &:hover { background: #f8fafc; }
  }
}
</style>
