<!-- 答题结果入口：诊断真题按考试类型分流，题库练习在当前页展示解析。 -->
<template>
  <div class="practice-report">
    <NavBar />
    <main class="report-main">
      <div v-if="loading" class="state-card">正在识别报告类型...</div>
      <div v-else-if="loadError" class="state-card state-card--error">{{ loadError }}</div>
      <section v-else class="practice-result">
        <header class="analysis-page-header">
          <button type="button" class="analysis-back" @click="returnToSource">
            <el-icon aria-hidden="true"><Back /></el-icon>
            {{ returnLabel }}
          </button>
          <i aria-hidden="true"></i>
          <h1>{{ analysisPageTitle }}</h1>
        </header>
        <ExamQuestionAnalysis
          :questions="questions"
          :correct-count="correctCount"
          :initial-question-id="targetQuestionId"
          :single-question-mode="singleQuestionMode"
        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Back } from '@element-plus/icons-vue'
import NavBar from '@/components/NavBar.vue'
import ExamQuestionAnalysis from '@/components/report/ExamQuestionAnalysis.vue'
import { getDiagnosticReportStatus, getExamResultData, type ExamQuestion } from '@/api/exam'
import { PAPER_TYPE, normalizePaperType } from '@/constants/paperTypes'
import { getApiErrorMessage } from '@/utils/request'

interface PaperMeta {
  id: string
  title: string
  paperType: string
  year?: number
  duration?: number
  code?: string | null
}

type ReportQuestion = ExamQuestion & { id: string }

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const loadError = ref('')
const correctCount = ref(0)
const questions = ref<ReportQuestion[]>([])
const paper = ref<PaperMeta | null>(null)
const isDiagnosticRecord = ref(false)
const recordExamType = ref('')

// 当前答卷 ID 用于读取结果并决定后续进入哪一种报告页面。
const examId = computed(() => String(route.params.id || ''))

// 专用逐题解析路由需要保留在当前页，不能再被诊断报告自动分流逻辑重定向。
const isQuestionReview = computed(() => route.name === 'exam-question-review')

// 题号参数只服务于普通练习结果的逐题定位。
const targetQuestionId = computed(() => route.query.questionId as string | undefined)

// 错题本使用专用单题模式，不能从当前入口回退为整卷解析。
const singleQuestionMode = computed(() => Boolean(isQuestionReview.value && targetQuestionId.value))

// 普通练习标题优先使用试卷标题，缺失时回退到题目科目。
const examTitle = computed(() => paper.value?.title || questions.value[0]?.subject || '题库练习')

// 题目业务来源和页面来路分开解析，错题本返回不能被诊断/题库分类覆盖。
const analysisSource = computed<'diagnostic' | 'question-bank'>(() => {
  if (route.query.recordSource === 'diagnostic') return 'diagnostic'
  if (route.query.recordSource === 'question-bank') return 'question-bank'
  if (route.query.from === 'diagnostic') return 'diagnostic'
  if (route.query.from === 'question-bank') return 'question-bank'
  return isDiagnosticRecord.value ? 'diagnostic' : 'question-bank'
})

// 错题本入口单独决定返回行为，并允许携带已校验的列表筛选地址。
const cameFromMistakeNotebook = computed(() => route.query.from === 'mistake-notebook')

// 题库练习没有成型套卷，统一使用会话名称；诊断答卷则展示正式试卷名称。
const pageContextTitle = computed(() =>
  analysisSource.value === 'question-bank' ? '题库专项练习' : examTitle.value,
)

const analysisPageTitle = computed(() =>
  singleQuestionMode.value
    ? `${pageContextTitle.value} · 错题解析`
    : `${pageContextTitle.value} · 题目逐题解析`,
)

// 返回按钮文案与来源保持一一对应，避免学生从解析页回到错误的业务入口。
const returnLabel = computed(() =>
  cameFromMistakeNotebook.value
    ? '返回错题本'
    : analysisSource.value === 'diagnostic'
      ? '返回诊断报告'
      : '返回试题库',
)

// 页面加载后先识别 paperType 和 examType，诊断记录随即跳到独立考试报告页。
onMounted(async () => {
  try {
    const data = await getExamResultData(examId.value)
    const isDiagnostic =
      normalizePaperType(data.examRecord.paper?.paperType) === PAPER_TYPE.REAL_PAPER
    isDiagnosticRecord.value = isDiagnostic
    recordExamType.value = data.examRecord.examType
    if (isDiagnostic && !isQuestionReview.value) {
      const status = await getDiagnosticReportStatus(examId.value)
      if (status.status === 'completed' && status.reportExamRecordId) {
        await redirectDiagnosticReport(data.examRecord.examType, status.reportExamRecordId)
      } else {
        await router.replace({
          path: '/exam-result',
          query: {
            id: examId.value,
            total: String(data.examRecord.totalQuestions),
            correct: String(data.examRecord.correctCount),
            source: 'assessment',
          },
        })
      }
      return
    }

    paper.value = data.examRecord.paper || null
    const loadedQuestions = (data.questions || []).map((question, index) => ({
      ...question,
      id: question.id || question.questionId || `result-q-${index + 1}`,
      // 后端已按试卷正式题号排序；仅在历史异常数据缺题号时才使用列表位置兜底。
      number: question.number ?? index + 1,
      images: question.images || [],
    }))
    if (singleQuestionMode.value) {
      const target = loadedQuestions.find(
        (question) =>
          question.id === targetQuestionId.value || question.questionId === targetQuestionId.value,
      )
      if (!target) {
        loadError.value = '该题不属于本次答卷'
        return
      }
      questions.value = [target]
      correctCount.value = target.isCorrect ? 1 : 0
      return
    }
    correctCount.value = data.examRecord.correctCount
    questions.value = loadedQuestions
  } catch (error: unknown) {
    loadError.value = getApiErrorMessage(error, '加载答卷失败，请稍后重试')
  } finally {
    loading.value = false
  }
})

// 返回目标由来源和考试类型固定决定，不依赖浏览器历史栈，刷新页面后仍能保持正确去向。
function returnToSource(): void {
  if (cameFromMistakeNotebook.value) {
    const returnTo = String(route.query.returnTo || '')
    const safeReturnTo =
      returnTo === '/mistake-notebook' || returnTo.startsWith('/mistake-notebook?')
        ? returnTo
        : '/mistake-notebook'
    void router.push(safeReturnTo)
    return
  }
  if (analysisSource.value === 'question-bank') {
    void router.push('/question-bank')
    return
  }
  const reportKind = String(route.query.report || recordExamType.value)
    .trim()
    .toLowerCase()
  if (reportKind === 'esat') {
    void router.push({ name: 'esat-diagnostic-report', params: { id: examId.value } })
    return
  }
  if (reportKind === 'tmua') {
    void router.push({ name: 'tmua-diagnostic-report', params: { id: examId.value } })
    return
  }
  void router.push('/assessment')
}

// 根据 examType 进入独立路由，后续 ESAT/TMUA 页面可以分别开发和验收。
async function redirectDiagnosticReport(examType: string, reportRecordId: string): Promise<void> {
  const normalized = examType.trim().toUpperCase()
  if (normalized === 'ESAT') {
    await router.replace({ name: 'esat-diagnostic-report', params: { id: reportRecordId } })
    return
  }
  if (normalized === 'TMUA') {
    await router.replace({ name: 'tmua-diagnostic-report', params: { id: reportRecordId } })
    return
  }
  throw new Error(`暂不支持 ${normalized || '未知考试'} 的诊断报告`)
}
</script>

<style scoped lang="scss">
.practice-report {
  width: 100%;
  min-height: 100vh;
  background: var(--color-bg);
  color: var(--color-ink);
}

.report-main {
  width: var(--fluid-shell-width);
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

.analysis-page-header {
  display: flex;
  gap: 14px;
  align-items: center;
  min-height: 36px;
  margin: 0 0 24px;
}

.analysis-back {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: var(--color-ink-soft);
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.analysis-back .el-icon {
  font-size: 17px;
}

.analysis-back:focus-visible {
  border-radius: var(--radius-sm);
  outline: 2px solid var(--color-ink-soft);
  outline-offset: 3px;
}

.analysis-page-header > i {
  width: 1px;
  height: 22px;
  background: var(--color-line);
}

.analysis-page-header h1 {
  margin: 0;
  font-size: var(--text-2xl);
}

@media (max-width: 640px) {
  .analysis-page-header {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }

  .analysis-page-header > i {
    display: none;
  }

  .analysis-page-header h1 {
    width: 100%;
  }
}
</style>
