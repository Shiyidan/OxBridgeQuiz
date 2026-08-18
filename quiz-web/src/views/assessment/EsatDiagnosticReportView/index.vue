<!-- ESAT 诊断报告总入口：统一加载数据、管理科目上下文并编排一级报告模块。 -->
<template>
  <div class="diagnostic-report-page">
    <NavBar />
    <main class="report-main">
      <div v-if="loading" class="state-card" role="status" aria-live="polite">
        正在生成 ESAT 模块诊断...
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

      <template v-else-if="report && activeModule">
        <header class="report-header">
          <div>
            <span>{{ reportMeta?.sourcePaperType === 'mockPaper' ? '来源：无限模考' : 'ESAT Diagnostic Report' }}</span>
            <h1>{{ report.header.title }}</h1>
          </div>
          <button type="button" class="question-analysis-button" @click="viewQuestionAnalysis">
            题目解析
          </button>
        </header>
        <p v-if="report.learningPath?.profile.subjectMismatch" class="report-warning">
          个人资料中的报考科目与本次实际作答模块不一致；本报告已按本次试卷的实际模块生成，避免遗漏需要补强的科目。
        </p>
        <section v-if="needsReportUpgrade" class="report-upgrade" aria-labelledby="report-upgrade-title">
          <div>
            <strong id="report-upgrade-title">这份报告仍在使用旧版诊断分析</strong>
            <p>可以直接使用原答卷重新生成科目整体评价与学习路径；成绩和作答记录不会改变。</p>
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
        <EsatAiImprovementPlan
          v-if="report.aiImprovementPlan"
          :plan="report.aiImprovementPlan"
        />
        <EsatLearningPath
          v-if="report.learningPath"
          :path="report.learningPath"
        />
      </template>
      <div v-else-if="report" class="state-card" role="status">
        这份答卷没有可用于生成 ESAT 诊断报告的计分模块。
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import {
  getDiagnosticReportSummary,
  getDiagnosticReportStatus,
  regenerateDiagnosticReport,
  type DiagnosticReportMeta,
  type DiagnosticReportSummary,
} from '@/api/exam'
import { getApiErrorMessage } from '@/utils/request'
import EsatEquivalentScore from '../diagnostic-report/v1/EsatEquivalentScore.vue'
import EsatOverallOverview from '../diagnostic-report/v1/EsatOverallOverview.vue'
import EsatKnowledgeMastery from '../diagnostic-report/v1/EsatKnowledgeMastery.vue'
import EsatAiImprovementPlan from '../diagnostic-report/v1/EsatAiImprovementPlan.vue'
import EsatLearningPath from '../diagnostic-report/v1/EsatLearningPath.vue'
import DiagnosticReportV2 from '../diagnostic-report/v2/DiagnosticReportV2.vue'

defineOptions({ name: 'EsatDiagnosticReportView' })

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const errorMessage = ref('')
const report = ref<DiagnosticReportSummary | null>(null)
const reportMeta = ref<DiagnosticReportMeta | null>(null)
const activeModuleId = ref('')
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

// 路由参数是 ESAT 报告接口和权限校验使用的 ExamRecord ID。
const examId = computed(() => String(route.params.id || ''))

// 当前模块只服务于等效评估分内部切换，不代表整份诊断报告的全局科目。
const activeModule = computed(() =>
  report.value?.assessment.modules.find((module) => module.id === activeModuleId.value) || null,
)

// 当页面展示上一份有效报告时，题目解析必须读取该报告对应的答卷，而不是本次失败或分析中的答卷。
const questionReviewExamId = computed(() => reportExamRecordId.value || examId.value)

// 产品版本与升级资格由服务端统一判定，历史内部修订号不再由页面自行推断。
const needsReportUpgrade = computed(() => reportMeta.value?.canUpgrade === true)

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

// 页面离开后终止本地轮询序列，后台报告任务仍继续执行并安全保存。
onBeforeUnmount(() => {
  upgradeRequestId += 1
})

// 等效评估分组件通过事件更新当前独立计分模块。
function selectModule(moduleId: string): void {
  if (report.value?.header.modules.some((module) => module.id === moduleId)) {
    activeModuleId.value = moduleId
  }
}

// 逐题解析复用公共 ExamQuestionAnalysis 页面，并以当前报告对应答卷作为只读数据来源。
function viewQuestionAnalysis(): void {
  void router.push({
    name: 'exam-question-review',
    params: { id: questionReviewExamId.value },
    query: { from: 'diagnostic', report: 'esat' },
  })
}

// 报告行动仅预填练习本表单，由学生确认题量、知识点和时长后再创建。
function createPracticeFromReport(prefill: PracticePrefill): void {
  void router.push({
    name: 'practice-notebook-new',
    query: {
      source: 'diagnostic-report',
      returnTo: route.fullPath,
      examType: 'ESAT',
      name: prefill.name,
      knowledgePointCodes: prefill.knowledgePointCodes.join(','),
      difficulty: prefill.difficulty,
      questionCount: String(prefill.questionCount),
      durationMinutes: String(prefill.durationMinutes),
    },
  })
}

// 历史报告升级沿用原答卷，轮询完成后重新读取新快照并原地替换页面内容。
async function upgradeReport(): Promise<void> {
  if (upgradeInProgress.value) return
  const requestId = ++upgradeRequestId
  upgradeInProgress.value = true
  upgradeProgress.value = 10
  upgradeMessage.value = '正在根据原答卷生成七日路径，旧报告会保留到新版保存成功。'
  try {
    await regenerateDiagnosticReport(questionReviewExamId.value)
    while (requestId === upgradeRequestId) {
      const status = await getDiagnosticReportStatus(questionReviewExamId.value)
      upgradeProgress.value = status.progress
      if (status.status === 'completed') {
        await loadReport()
        upgradeMessage.value = ''
        return
      }
      if (status.status === 'failed') {
        throw new Error(status.errorMessage || '新版报告生成失败，旧报告仍可继续查看')
      }
      await waitForUpgradePoll()
    }
  } catch (error: unknown) {
    upgradeMessage.value = getApiErrorMessage(error, '新版报告生成失败，旧报告仍可继续查看')
  } finally {
    if (requestId === upgradeRequestId) upgradeInProgress.value = false
  }
}

// 短轮询只等待后台真实状态，不在前端模拟分析进度。
function waitForUpgradePoll(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 1500))
}

// 加载后校验 reportKind，防止错误考试类型进入 ESAT 页面。
async function loadReport(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await getDiagnosticReportSummary(examId.value)
    if (data.report.reportKind !== 'esat') {
      throw new Error('该答卷不是 ESAT 诊断记录')
    }
    report.value = data.report
    reportMeta.value = data.meta
    reportExamRecordId.value = data.meta.reportExamRecordId || examId.value
    activeModuleId.value = data.report.header.modules[0]?.id || ''
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error, 'ESAT 诊断报告加载失败')
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
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
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

.question-analysis-button {
  min-width: 128px;
  padding: 10px 18px;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-sm);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.question-analysis-button:hover {
  border-color: #303030;
  background: #303030;
  transform: translateY(-1px);
}

.question-analysis-button:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 2px;
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

.report-upgrade {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin: -12px 0 28px;
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

.report-upgrade__button {
  min-height: 42px;
  flex: 0 0 auto;
  padding: 9px 15px;
  border: 1px solid var(--color-ink);
  border-radius: var(--radius-sm);
  background: var(--color-ink);
  color: var(--color-ink-inverse);
  cursor: pointer;
  font-weight: var(--weight-medium);
}

.report-upgrade__button:disabled {
  cursor: wait;
  opacity: 0.58;
}

.report-upgrade__button:focus-visible {
  outline: 2px solid var(--color-report-purple);
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .report-main {
    width: calc(100% - 32px);
    padding: 24px 0 48px;
  }

  .report-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .report-upgrade {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
