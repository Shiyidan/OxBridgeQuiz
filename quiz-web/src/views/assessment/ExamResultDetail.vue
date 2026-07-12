<!-- 答题结果入口：诊断真题按考试类型分流，题库练习在当前页展示解析。 -->
<template>
  <div class="practice-report">
    <NavBar />
    <main class="report-main">
      <div v-if="loading" class="state-card">正在识别报告类型...</div>
      <div v-else-if="loadError" class="state-card state-card--error">{{ loadError }}</div>
      <section v-else class="practice-result">
        <h1>练习结果报告</h1>
        <ExamQuestionAnalysis
          :questions="questions"
          :correct-count="correctCount"
          :exam-title="examTitle"
          :initial-question-id="targetQuestionId"
        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import ExamQuestionAnalysis from '@/components/report/ExamQuestionAnalysis.vue'
import { getDiagnosticReportStatus, getExamResultData, type ExamQuestion } from '@/api/exam'
import { PAPER_TYPE, normalizePaperType } from '@/constants/paperTypes'

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

// 当前答卷 ID 用于读取结果并决定后续进入哪一种报告页面。
const examId = computed(() => String(route.params.id || ''))

// 题号参数只服务于普通练习结果的逐题定位。
const targetQuestionId = computed(() => route.query.questionId as string | undefined)

// 普通练习标题优先使用试卷标题，缺失时回退到题目科目。
const examTitle = computed(() => paper.value?.title || questions.value[0]?.subject || '题库练习')

// 页面加载后先识别 paperType 和 examType，诊断记录随即跳到独立考试报告页。
onMounted(async () => {
  try {
    const data = await getExamResultData(examId.value)
    const isDiagnostic = normalizePaperType(data.examRecord.paper?.paperType) === PAPER_TYPE.REAL_PAPER
    if (isDiagnostic) {
      const status = await getDiagnosticReportStatus(examId.value)
      if (status.status === 'completed' && status.reportExamRecordId) {
        await redirectDiagnosticReport(data.examRecord.examType, status.reportExamRecordId)
      } else if (status.status === 'failed' && status.hasPreviousReport) {
        await redirectDiagnosticReport(data.examRecord.examType, examId.value)
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

    correctCount.value = data.examRecord.correctCount
    paper.value = data.examRecord.paper || null
    questions.value = (data.questions || []).map((question, index) => ({
      ...question,
      id: question.id || question.questionId || `result-q-${index + 1}`,
      number: index + 1,
      images: question.images || [],
    }))
  } catch (error: any) {
    loadError.value = error?.response?.data?.errMsg || '加载答卷失败，请稍后重试'
  } finally {
    loading.value = false
  }
})

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
  width: 100%;
  max-width: var(--shell-max);
  margin: 0 auto;
  padding: 36px var(--container-px-desktop) 72px;
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

.practice-result h1 {
  margin: 0 0 24px;
  font-size: var(--text-2xl);
}
</style>
