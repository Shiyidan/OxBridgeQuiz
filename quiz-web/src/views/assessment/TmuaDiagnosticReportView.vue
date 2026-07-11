<!-- TMUA 独立诊断报告页：保留当前首部分，等待后续按 TMUA 规则继续开发。 -->
<template>
  <div class="diagnostic-report-page">
    <NavBar />
    <main class="report-main">
      <div v-if="loading" class="state-card">正在生成 TMUA 诊断...</div>
      <div v-else-if="errorMessage" class="state-card state-card--error">
        <p>{{ errorMessage }}</p>
        <button type="button" class="button_cancel" @click="loadReport">重新加载</button>
      </div>
      <DiagnosticReportSummary v-else-if="report" :report="report" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import DiagnosticReportSummary from '@/components/report/DiagnosticReportSummary.vue'
import { getDiagnosticReportSummary, type DiagnosticReportSummary as DiagnosticReportSummaryData } from '@/api/exam'

const route = useRoute()
const loading = ref(true)
const errorMessage = ref('')
const report = ref<DiagnosticReportSummaryData | null>(null)

// 路由参数是 TMUA 报告接口和权限校验使用的 ExamRecord ID。
const examId = computed(() => String(route.params.id || ''))

// 页面初始化只加载 TMUA 独立报告，不复用 ESAT 页面状态。
onMounted(() => {
  void loadReport()
})

// 加载后校验 reportKind，避免 ESAT 或 STEP 答卷误入 TMUA 页面。
async function loadReport(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getDiagnosticReportSummary(examId.value)
    if (data.report.reportKind !== 'tmua') {
      throw new Error('该答卷不是 TMUA 诊断记录')
    }
    report.value = data.report
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.errMsg || error?.message || 'TMUA 诊断报告加载失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.diagnostic-report-page {
  width: 100%;
  min-width: var(--fluid-page-min-width);
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-ink);
  --fluid-shell-min: 980px;
  --fluid-shell-fluid: calc(68.75vw + 100px);
}

.report-main {
  width: clamp(var(--fluid-shell-min), var(--fluid-shell-fluid), var(--fluid-shell-max));
  margin: 0 auto;
  padding: 36px 0 72px;
}

.state-card {
  padding: 48px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  text-align: center;
}

.state-card--error {
  color: var(--color-danger);
}

.state-card p {
  margin: 0 0 16px;
}
</style>
