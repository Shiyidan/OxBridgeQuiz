<!-- TMUA 独立诊断报告页：按综合分、两卷诊断、知识结构、提升优先级和学习路径编排完整报告。 -->
<template>
  <div class="diagnostic-report-page">
    <NavBar />
    <main class="report-main">
      <div v-if="loading" class="state-card" role="status" aria-live="polite">
        正在生成 TMUA 两卷诊断...
      </div>
      <div v-else-if="errorMessage" class="state-card state-card--error" role="alert">
        <p>{{ errorMessage }}</p>
        <button type="button" class="button_cancel" @click="loadReport">重新加载</button>
      </div>

      <DiagnosticReportV2
        v-else-if="report && reportMeta?.productVersion === 'v2'"
        :report="report"
        :meta="reportMeta"
        @question-analysis="viewQuestionAnalysis"
        @practice="createPracticeFromReport"
      />

      <template v-else-if="report">
        <header class="report-header">
          <div>
            <span>TMUA Diagnostic Report</span>
            <h1>{{ report.header.title }}</h1>
          </div>
          <button type="button" class="question-analysis-button" @click="viewQuestionAnalysis">
            题目解析
          </button>
        </header>

        <section v-if="needsReportUpgrade" class="report-upgrade" aria-labelledby="tmua-upgrade-title">
          <div>
            <strong id="tmua-upgrade-title">这份报告仍在使用旧版 TMUA 分析</strong>
            <p>可基于原答卷补充两卷深度评价、知识掌握、提升优先级和学习路径，成绩与作答记录不会改变。</p>
            <small v-if="upgradeMessage" role="status" aria-live="polite">{{ upgradeMessage }}</small>
          </div>
          <button
            type="button"
            class="report-upgrade__button"
            :disabled="upgradeInProgress"
            @click="upgradeReport"
          >
            {{ upgradeInProgress ? `正在更新 ${upgradeProgress}%` : '更新报告' }}
          </button>
        </section>

        <TmuaEquivalentScore
          v-if="report.assessment.modules.length"
          :report="report"
          :modules="report.assessment.modules"
        />
        <EsatOverallOverview
          v-if="report.overview"
          :overview="report.overview"
          :modules="report.assessment.modules"
        />
        <EsatKnowledgeMastery
          v-if="report.knowledgeMastery"
          :knowledge-mastery="report.knowledgeMastery"
          exam-type="TMUA"
        />
        <EsatAiImprovementPlan
          v-if="report.aiImprovementPlan"
          :plan="report.aiImprovementPlan"
        />
        <EsatLearningPath
          v-if="report.learningPath"
          :path="report.learningPath"
        />
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import {
  getDiagnosticReportStatus,
  getDiagnosticReportSummary,
  regenerateDiagnosticReport,
  type DiagnosticReportMeta,
  type DiagnosticReportSummary as DiagnosticReportSummaryData,
} from '@/api/exam'
import { getApiErrorMessage } from '@/utils/request'
import TmuaEquivalentScore from './diagnostic-report/v1/TmuaEquivalentScore.vue'
import EsatOverallOverview from './diagnostic-report/v1/EsatOverallOverview.vue'
import EsatKnowledgeMastery from './diagnostic-report/v1/EsatKnowledgeMastery.vue'
import EsatAiImprovementPlan from './diagnostic-report/v1/EsatAiImprovementPlan.vue'
import EsatLearningPath from './diagnostic-report/v1/EsatLearningPath.vue'
import DiagnosticReportV2 from './diagnostic-report/v2/DiagnosticReportV2.vue'

defineOptions({ name: 'TmuaDiagnosticReportView' })

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const errorMessage = ref('')
const report = ref<DiagnosticReportSummaryData | null>(null)
const reportMeta = ref<DiagnosticReportMeta | null>(null)
const reportExamRecordId = ref('')
const upgradeInProgress = ref(false)
const upgradeProgress = ref(0)
const upgradeMessage = ref('')
let upgradeRequestId = 0

interface PracticePrefill {
  name: string
  knowledgePointCodes: string[]
  difficulty: 'low' | 'medium' | 'high'
  questionCount: number
  durationMinutes: number
}

// 路由参数是 TMUA 报告接口和权限校验使用的 ExamRecord ID。
const examId = computed(() => String(route.params.id || ''))

// 产品版本与升级资格由服务端统一判定，避免把旧内部修订号误当作 V2。
const needsReportUpgrade = computed(() => reportMeta.value?.canUpgrade === true)

// 页面初始化只加载 TMUA 独立报告，不复用 ESAT 页面状态。
onMounted(() => {
  void loadReport()
})

// 页面离开后终止本地轮询，后台任务仍会继续完成并持久化报告。
onBeforeUnmount(() => {
  upgradeRequestId += 1
})

// 逐题解析复用公共只读页面，并携带 TMUA 报告来源。
function viewQuestionAnalysis(): void {
  void router.push({
    name: 'exam-question-review',
    params: { id: reportExamRecordId.value || examId.value },
    query: { from: 'diagnostic', report: 'tmua' },
  })
}

// 报告行动只把建议带入练习本创建页，不在后台静默创建内容。
function createPracticeFromReport(prefill: PracticePrefill): void {
  void router.push({
    name: 'practice-notebook-new',
    query: {
      source: 'diagnostic-report',
      returnTo: route.fullPath,
      examType: 'TMUA',
      name: prefill.name,
      knowledgePointCodes: prefill.knowledgePointCodes.join(','),
      difficulty: prefill.difficulty,
      questionCount: String(prefill.questionCount),
      durationMinutes: String(prefill.durationMinutes),
    },
  })
}

// 历史报告升级沿用原答卷；新报告保存成功前，页面继续保留旧快照。
async function upgradeReport(): Promise<void> {
  if (upgradeInProgress.value) return
  const requestId = ++upgradeRequestId
  upgradeInProgress.value = true
  upgradeProgress.value = 10
  upgradeMessage.value = '正在分析两卷表现、知识结构和下一阶段学习路径。'
  try {
    await regenerateDiagnosticReport(reportExamRecordId.value || examId.value)
    while (requestId === upgradeRequestId) {
      const status = await getDiagnosticReportStatus(reportExamRecordId.value || examId.value)
      upgradeProgress.value = status.progress
      if (status.status === 'completed') {
        await loadReport()
        upgradeMessage.value = ''
        return
      }
      if (status.status === 'failed') {
        throw new Error(status.errorMessage || '完整报告生成失败，旧报告仍可继续查看')
      }
      await waitForUpgradePoll()
    }
  } catch (error: unknown) {
    upgradeMessage.value = getApiErrorMessage(error, '完整报告生成失败，旧报告仍可继续查看')
  } finally {
    if (requestId === upgradeRequestId) upgradeInProgress.value = false
  }
}

// 短轮询只读取服务端真实进度，不在前端模拟分析阶段。
function waitForUpgradePoll(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 1500))
}

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
    reportMeta.value = data.meta
    reportExamRecordId.value = data.meta.reportExamRecordId || examId.value
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error, 'TMUA 诊断报告加载失败')
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

.report-upgrade {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.report-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-line);
}

.report-header span {
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.report-header h1 {
  margin: 5px 0 0;
  font-size: var(--text-2xl);
}

.question-analysis-button,
.report-upgrade__button {
  min-height: 42px;
  flex: 0 0 auto;
  padding: 9px 16px;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-sm);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  cursor: pointer;
  font-weight: var(--weight-medium);
}

.report-upgrade {
  padding: 18px 20px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.report-upgrade strong,
.report-upgrade p {
  margin: 0;
}

.report-upgrade p,
.report-upgrade small {
  display: block;
  margin-top: 4px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
}

.report-upgrade__button:disabled {
  cursor: wait;
  opacity: 0.58;
}

@media (max-width: 760px) {
  .report-main {
    width: calc(100% - 32px);
    padding: 24px 0 48px;
  }

  .report-header,
  .report-upgrade {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
