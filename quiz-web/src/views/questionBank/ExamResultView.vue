<!-- 交卷结果兼容入口：诊断测试承载分析任务，历史题库结果链接直接进入逐题解析。 -->
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
      <div class="result-state">正在进入本次练习解析...</div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import DiagnosticAnalysisDialog from '@/components/DiagnosticAnalysisDialog.vue'

const route = useRoute()
const router = useRouter()
const examId = computed(() => String(route.query.id || ''))
const isAssessment = computed(() => route.query.source === 'assessment')
const cameFromPracticeNotebook = computed(() => route.query.from === 'practice-notebook')
const returnPath = computed(() =>
  cameFromPracticeNotebook.value ? '/practice-notebook' : '/question-bank',
)

// 历史题库结果链接不再展示汇总卡片，直接进入本次答卷的逐题解析。
onMounted(async () => {
  if (isAssessment.value) return
  if (!examId.value) {
    await router.replace(returnPath.value)
    return
  }
  await router.replace({
    name: 'exam-result-detail',
    params: { id: examId.value },
    query: {
      from: cameFromPracticeNotebook.value ? 'practice-notebook' : 'question-bank',
      recordSource: 'question-bank',
    },
  })
})

// 诊断分析完成后只响应用户主动查看，不由兼容入口自动跳转。
async function handleViewDiagnosticReport(target: string): Promise<void> {
  await router.push(target)
}

// 关闭诊断分析弹窗后返回诊断测试首页，后台任务不受页面卸载影响。
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

.result-state {
  padding: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 5px;
  background: #fff;
  color: #64748b;
  text-align: center;
}
</style>
