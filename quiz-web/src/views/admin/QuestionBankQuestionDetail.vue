<!-- 后台试题库单题审核页：完整预览题干、答案、解析、分类与发布状态。 -->
<template>
  <div v-loading="loading" class="detail-page">
    <header class="detail-header">
      <div>
        <button type="button" class="back-link" @click="returnToQuestionList">
          ← {{ route.query.batchId ? '返回文件' : '返回试题库' }}
        </button>
        <h2>{{ detail?.code || '题目详情' }}</h2>
        <p>{{ detail?.importBatch?.title || '独立题目' }}</p>
      </div>
      <el-select v-if="detail" :model-value="detail.status" @change="changeStatus">
        <el-option v-for="item in statusOptions" :key="item.value" v-bind="item" />
      </el-select>
    </header>

    <template v-if="detail">
      <section class="meta-card">
        <div>
          <span>考试</span><strong>{{ detail.examType }}</strong>
        </div>
        <div>
          <span>难度</span><strong>{{ difficultyLabel(detail.difficulty) }}</strong>
        </div>
        <div>
          <span>学科</span><strong>{{ detail.subject }}</strong>
        </div>
        <div>
          <span>主题</span><strong>{{ detail.topic }}</strong>
        </div>
        <div>
          <span>知识点</span><strong>{{ knowledgePointLabels }}</strong>
        </div>
        <div>
          <span>状态</span><strong>{{ statusLabel(detail.status) }}</strong>
        </div>
      </section>

      <ExamQuestionAnalysis
        :questions="analysisQuestions"
        :correct-count="0"
        :show-user-answer="false"
        single-question-mode
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ExamQuestionAnalysis from '@/components/report/ExamQuestionAnalysis.vue'
import type { ExamQuestion } from '@/api/exam'
import {
  getQuestionBankAdminDetail,
  updateQuestionBankStatus,
  type QuestionBankAdminDetail,
  type QuestionBankStatus,
} from '@/api/questionBank'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const detail = ref<QuestionBankAdminDetail | null>(null)
const statusOptions: Array<{ value: QuestionBankStatus; label: string }> = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'archived', label: '已归档' },
]

// 知识点摘要来自导入时保存的展示快照。
const knowledgePointLabels = computed(
  () => (detail.value?.knowledgePoints || []).map((point) => point.label).join('、') || '—',
)

// 公共解析组件接收报告题目数组，后台单题详情将当前题包装为仅含一题的数据源。
const analysisQuestions = computed<Array<ExamQuestion & { id: string }>>(() => {
  if (!detail.value) return []
  return [
    {
      ...detail.value.question,
      id: detail.value.question.id || detail.value.id,
      questionId: detail.value.id,
    },
  ]
})

// 从上传包进入预览时返回原包，否则回到试题库上传包列表。
function returnToQuestionList(): void {
  const batchId = String(route.query.batchId || '')
  if (batchId) {
    router.push({ name: 'admin-question-batch-detail', params: { batchId } })
    return
  }
  router.push('/admin/core-library/questions')
}

// 路由 id 只读取独立题目详情，不再复用试卷预览接口。
async function loadDetail(): Promise<void> {
  loading.value = true
  try {
    detail.value = await getQuestionBankAdminDetail(String(route.params.id))
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

// 审核页将稳定难度编码转换为中文展示名。
function difficultyLabel(value: string): string {
  return (
    ({ easy: '简单', medium: '中等', hard: '困难', composite: '复合' } as Record<string, string>)[
      value
    ] || value
  )
}

// 审核页状态提示与下拉选项共用相同文案。
function statusLabel(value: QuestionBankStatus): string {
  return statusOptions.find((item) => item.value === value)?.label || value
}

// 审核页状态切换成功后同步本地详情，避免重新加载大体积题目资源。
async function changeStatus(value: unknown): Promise<void> {
  if (!detail.value) return
  const status = String(value) as QuestionBankStatus
  try {
    await updateQuestionBankStatus(detail.value.id, status)
    detail.value.status = status
    ElMessage.success(`题目已设为${statusLabel(status)}`)
  } catch {
    // 公共请求层展示后端错误。
  }
}

onMounted(loadDetail)
</script>

<style scoped lang="scss">
.detail-page {
  max-width: 1080px;
  min-height: 360px;
  padding: 28px 40px 64px;
}

.detail-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 18px;
}

.detail-header .el-select {
  width: 140px;
}

.back-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.detail-header h2 {
  margin: 14px 0 5px;
}

.detail-header p {
  margin: 0;
  color: #64748b;
}

.meta-card {
  margin-bottom: 18px;
  padding: 24px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  display: grid;
  grid-template-columns:
    minmax(72px, 0.7fr)
    minmax(72px, 0.7fr)
    minmax(130px, 1.25fr)
    minmax(150px, 1.5fr)
    minmax(150px, 1.5fr)
    minmax(72px, 0.7fr);
  gap: 16px;
}

.meta-card div {
  display: grid;
  gap: 5px;
}

.meta-card span {
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 960px) {
  .meta-card {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .meta-card {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
