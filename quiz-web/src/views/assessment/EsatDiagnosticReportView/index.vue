<!-- ESAT 诊断报告总入口：统一加载数据、管理科目上下文并编排一级报告模块。 -->
<template>
  <div class="diagnostic-report-page">
    <NavBar />
    <main class="report-main">
      <div v-if="loading" class="state-card">正在生成 ESAT 模块诊断...</div>
      <div v-else-if="errorMessage" class="state-card state-card--error">
        <p>{{ errorMessage }}</p>
        <button type="button" class="button_cancel" @click="loadReport">重新加载</button>
      </div>

      <template v-else-if="report && activeModule">
        <header class="report-header">
          <div>
            <span>ESAT Diagnostic Report</span>
            <h1>{{ report.header.title }}</h1>
          </div>
        </header>
        <div v-if="reportWarning" class="report-warning">{{ reportWarning }}</div>

        <EsatEquivalentScore
          :module="activeModule"
          :modules="report.assessment.modules"
          :active-module-id="activeModuleId"
          @select-module="selectModule"
        />
        <EsatOverallOverview
          v-if="report.overview"
          :overview="report.overview"
          :modules="report.assessment.modules"
        />
        <EsatKnowledgeMastery
          v-if="report.knowledgeMastery"
          :knowledge-mastery="report.knowledgeMastery"
        />
        <EsatQuestionReview />
        <EsatAiImprovementPlan
          v-if="report.aiImprovementPlan"
          :plan="report.aiImprovementPlan"
        />
        <EsatLearningPath v-if="report.learningPath" :path="report.learningPath" />
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import { getDiagnosticReportSummary, type DiagnosticReportSummary } from '@/api/exam'
import EsatEquivalentScore from './EsatEquivalentScore.vue'
import EsatOverallOverview from './EsatOverallOverview.vue'
import EsatKnowledgeMastery from './EsatKnowledgeMastery.vue'
import EsatQuestionReview from './EsatQuestionReview.vue'
import EsatAiImprovementPlan from './EsatAiImprovementPlan.vue'
import EsatLearningPath from './EsatLearningPath.vue'

const route = useRoute()
const loading = ref(true)
const errorMessage = ref('')
const reportWarning = ref('')
const report = ref<DiagnosticReportSummary | null>(null)
const activeModuleId = ref('')

// 路由参数是 ESAT 报告接口和权限校验使用的 ExamRecord ID。
const examId = computed(() => String(route.params.id || ''))

// 当前模块只服务于等效评估分内部切换，不代表整份诊断报告的全局科目。
const activeModule = computed(() =>
  report.value?.assessment.modules.find((module) => module.id === activeModuleId.value) || null,
)

// 报告重新生成后保持合法模块选择，失效时回到第一个实际模块。
watch(
  () => report.value?.header.modules,
  (modules) => {
    if (!modules?.some((module) => module.id === activeModuleId.value)) {
      activeModuleId.value = modules?.[0]?.id || ''
    }
  },
)

// 页面初始化只加载 ESAT 独立报告，不复用 TMUA 页面状态。
onMounted(() => {
  void loadReport()
})

// 等效评估分组件通过事件更新当前独立计分模块。
function selectModule(moduleId: string): void {
  if (report.value?.header.modules.some((module) => module.id === moduleId)) {
    activeModuleId.value = moduleId
  }
}

// 加载后校验 reportKind，防止错误考试类型进入 ESAT 页面。
async function loadReport(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  reportWarning.value = ''
  try {
    const data = await getDiagnosticReportSummary(examId.value)
    if (data.report.reportKind !== 'esat') {
      throw new Error('该答卷不是 ESAT 诊断记录')
    }
    report.value = data.report
    reportWarning.value = data.meta.warning || ''
    activeModuleId.value = data.report.header.modules[0]?.id || ''
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.errMsg || error?.message || 'ESAT 诊断报告加载失败'
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

.report-header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-line);
}

.report-header > div:first-child span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.report-header h1 {
  margin: 5px 0 0;
  font-size: var(--text-2xl);
}

.report-warning {
  margin: -16px 0 24px;
  padding: 12px 16px;
  border: 1px solid #f1c56a;
  border-radius: var(--radius-md);
  background: #fff8e8;
  color: #8a5a00;
  font-size: var(--text-sm);
}

@media (max-width: 760px) {
  .report-main {
    padding: 24px 0 48px;
  }

}
</style>
