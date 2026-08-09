<!-- 后台试题包查看页：从文件列表进入后按前台解析样式逐题查看，并保留吸顶管理操作。 -->
<template>
  <div v-loading="loading" class="batch-review-page">
    <section v-if="batch" class="sticky-admin-panel">
      <div class="batch-toolbar">
        <div class="batch-heading">
          <button type="button" class="back-link" @click="returnToBatchList">← 返回文件列表</button>
          <el-tooltip :content="batch.title" placement="bottom">
            <h2>{{ batch.title }}</h2>
          </el-tooltip>
        </div>

        <div class="batch-overview" aria-label="试题包概括">
          <span
            ><strong>{{ batch.currentQuestionCount }}</strong> 题</span
          >
          <span>{{ batch.examTypes.join('、') || '—' }}</span>
          <span :title="batchClassificationLabel">{{ batchClassificationLabel }}</span>
          <span>草稿 {{ batch.statusCounts.draft }}</span>
          <span>已发布 {{ batch.statusCounts.published }}</span>
          <span>已归档 {{ batch.statusCounts.archived }}</span>
          <span>{{ formatDate(batch.createdAt) }}</span>
        </div>

        <div class="batch-actions" aria-label="试题包操作">
          <button
            type="button"
            class="action-button action-button--publish"
            :disabled="batchActionDisabled('published')"
            @click="changeBatchStatus('published')"
          >
            {{ batchActionLabel('published', '上线') }}
          </button>
          <button
            type="button"
            :disabled="batchActionDisabled('archived')"
            @click="changeBatchStatus('archived')"
          >
            {{ batchActionLabel('archived', '归档') }}
          </button>
          <button
            type="button"
            class="action-button--danger"
            :disabled="Boolean(batchOperatingAction)"
            @click="deleteBatch"
          >
            {{ batchActionLabel('delete', '删除') }}
          </button>
        </div>
      </div>

      <div v-if="activeQuestion" class="question-toolbar" aria-label="当前题目管理操作">
        <span :title="activeQuestion.code">{{ activeQuestion.code }}</span>
        <span class="question-title" :title="activeQuestion.title">
          {{ activeQuestion.title }}
        </span>
        <span>{{ activeQuestion.examType }}</span>
        <span :title="questionClassificationLabel(activeQuestion)">
          {{ questionClassificationLabel(activeQuestion) }}
        </span>
        <span>{{ difficultyLabel(activeQuestion.difficulty) }}</span>
        <span>{{ qualityTierLabel(activeQuestion.qualityTier) }}</span>
        <el-dropdown trigger="click" @command="changeQuestionStatus">
          <button
            type="button"
            class="status-button"
            :class="`status-button--${activeQuestion.status}`"
          >
            {{ statusLabel(activeQuestion.status) }}
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in statusOptions"
                :key="item.value"
                :command="item.value"
              >
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <span :title="knowledgePointLabels(activeQuestion.knowledgePoints)">
          {{ knowledgePointLabels(activeQuestion.knowledgePoints) }}
        </span>
        <button
          type="button"
          class="question-delete-button"
          :disabled="deletingQuestion"
          @click="deleteActiveQuestion"
        >
          {{ deletingQuestion ? '删除中' : '删除题目' }}
        </button>
      </div>
    </section>

    <section v-if="loadFailed" class="page-state page-state--error">
      <p>试题包内容加载失败。</p>
      <el-button @click="loadReview">重新加载</el-button>
    </section>

    <section v-else-if="!loading && !analysisQuestions.length" class="page-state">
      <p>该试题包当前没有可查看的题目。</p>
    </section>

    <main v-else-if="analysisQuestions.length" class="analysis-view">
      <ExamQuestionAnalysis
        :key="reviewVersion"
        :questions="analysisQuestions"
        :correct-count="0"
        :initial-question-id="activeQuestionId"
        :show-user-answer="false"
        @question-change="handleQuestionChange"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import ExamQuestionAnalysis from '@/components/report/ExamQuestionAnalysis.vue'
import type { ExamQuestion } from '@/api/exam'
import {
  deleteQuestionBankImportBatch,
  deleteQuestionBankQuestion,
  getQuestionBankImportBatchDetail,
  getQuestionBankImportBatchReview,
  updateQuestionBankImportBatchStatus,
  updateQuestionBankStatus,
  type QuestionBankAdminDetail,
  type QuestionBankAdminItem,
  type QuestionBankImportBatch,
  type QuestionBankQualityTier,
  type QuestionBankStatus,
} from '@/api/questionBank'
import type { KnowledgePoint } from '@/types'

const route = useRoute()
const router = useRouter()
const batchId = String(route.params.batchId)
const loading = ref(false)
const loadFailed = ref(false)
const deletingQuestion = ref(false)
const batchOperatingAction = ref<'published' | 'archived' | 'delete' | ''>('')
const batch = ref<QuestionBankImportBatch | null>(null)
const questionDetails = ref<QuestionBankAdminDetail[]>([])
const activeQuestionIndex = ref(0)
const activeQuestionId = ref('')
const reviewVersion = ref(0)
const statusOptions: Array<{ value: QuestionBankStatus; label: string }> = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'archived', label: '已归档' },
]
const difficultyOptions = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
  { value: 'composite', label: '复合' },
]

// ESAT/STEP 显示科目，TMUA 显示 Paper；混合文件按两类内容依次汇总。
const batchClassificationLabel = computed(() => {
  if (!batch.value) return '—'
  return (
    [
      ...batch.value.subjects.map((subject) => subject.label),
      ...batch.value.parts.map((part) => part.label),
    ].join('、') || '—'
  )
})

// 整包完整题目转换为公共解析组件的数据结构，数据库题目 id 作为稳定导航标识。
const analysisQuestions = computed<Array<ExamQuestion & { id: string }>>(() =>
  questionDetails.value.map((detail) => ({
    ...detail.question,
    id: detail.question.id || detail.id,
    questionId: detail.id,
  })),
)

// 顶部管理栏始终对应解析组件当前选中的题目。
const activeQuestion = computed<QuestionBankAdminDetail | null>(
  () => questionDetails.value[activeQuestionIndex.value] || null,
)

// 从查看页返回上传文件列表，不保留内部逐题状态。
async function returnToBatchList(): Promise<void> {
  await router.push('/admin/core-library/questions')
}

// 初次进入一次加载批次摘要和全部完整题目，失败时保留明确的重试入口。
async function loadReview(): Promise<void> {
  loading.value = true
  loadFailed.value = false
  try {
    const [batchData, reviewData] = await Promise.all([
      getQuestionBankImportBatchDetail(batchId),
      getQuestionBankImportBatchReview(batchId),
    ])
    batch.value = batchData
    questionDetails.value = reviewData.questions
    const targetIndex = activeQuestionId.value
      ? questionDetails.value.findIndex((question) => question.id === activeQuestionId.value)
      : 0
    activeQuestionIndex.value = targetIndex >= 0 ? targetIndex : 0
    activeQuestionId.value = questionDetails.value[activeQuestionIndex.value]?.id || ''
    reviewVersion.value += 1
  } catch {
    batch.value = null
    questionDetails.value = []
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

// 整包状态操作后只重载批次汇总，完整题目内容无需再次传输。
async function refreshBatch(): Promise<void> {
  batch.value = await getQuestionBankImportBatchDetail(batchId)
}

// 公共解析组件切题时同步当前题目概括和管理员操作目标。
function handleQuestionChange(index: number): void {
  if (!questionDetails.value[index]) return
  activeQuestionIndex.value = index
  activeQuestionId.value = questionDetails.value[index].id
}

// 当前题目的科目与主题合并为吸顶栏中的紧凑分类信息。
function questionClassificationLabel(question: QuestionBankAdminItem): string {
  return [question.subject, question.topic].filter(Boolean).join(' / ') || '—'
}

// 知识点快照只用于当前题目的概括展示。
function knowledgePointLabels(points: KnowledgePoint[] | unknown): string {
  return Array.isArray(points)
    ? points
        .map((point) => String(point?.label || point?.code || ''))
        .filter(Boolean)
        .join('、') || '—'
    : '—'
}

// 难度编码在管理查看页统一转换为中文标签。
function difficultyLabel(value: string): string {
  return difficultyOptions.find((item) => item.value === value)?.label || value || '—'
}

// 生成质量等级转换为管理员可读标签。
function qualityTierLabel(value: QuestionBankQualityTier | null): string {
  if (value === 'excellent') return '优秀'
  if (value === 'qualified') return '标准'
  return '—'
}

// 题目状态使用统一中文标签，并与下拉选项保持一致。
function statusLabel(value: QuestionBankStatus): string {
  return statusOptions.find((item) => item.value === value)?.label || value
}

// 单题状态变更后同步顶部题目状态和批次状态数量。
async function changeQuestionStatus(command: unknown): Promise<void> {
  const question = activeQuestion.value
  const status = String(command) as QuestionBankStatus
  if (!question || status === question.status) return
  try {
    await updateQuestionBankStatus(question.id, status)
    question.status = status
    await refreshBatch()
    ElMessage.success(`题目已设为${statusLabel(status)}`)
  } catch {
    // 公共请求层展示后端错误。
  }
}

// 删除当前题目前记录相邻题目，成功后继续停留在最接近的位置。
async function deleteActiveQuestion(): Promise<void> {
  const question = activeQuestion.value
  if (!question) return
  try {
    await ElMessageBox.confirm(
      `确认删除题目 ${question.code} 吗？已有答题或错题记录的题目不能删除，只能归档。`,
      '删除题目',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  deletingQuestion.value = true
  const nextQuestion =
    questionDetails.value[activeQuestionIndex.value + 1] ||
    questionDetails.value[activeQuestionIndex.value - 1] ||
    null
  try {
    await deleteQuestionBankQuestion(question.id)
    questionDetails.value.splice(activeQuestionIndex.value, 1)
    activeQuestionId.value = nextQuestion?.id || ''
    const nextIndex = nextQuestion
      ? questionDetails.value.findIndex((item) => item.id === nextQuestion.id)
      : 0
    activeQuestionIndex.value = nextIndex >= 0 ? nextIndex : 0
    reviewVersion.value += 1
    await refreshBatch()
    ElMessage.success('题目已删除')
  } catch {
    // 公共请求层展示后端错误。
  } finally {
    deletingQuestion.value = false
  }
}

// 已全部处于目标状态或正在执行其他整包操作时禁用重复操作。
function batchActionDisabled(
  status: Extract<QuestionBankStatus, 'published' | 'archived'>,
): boolean {
  return Boolean(
    batchOperatingAction.value ||
    !batch.value?.currentQuestionCount ||
    batch.value.statusCounts[status] === batch.value.currentQuestionCount,
  )
}

// 整包操作按钮在请求期间显示进行中状态。
function batchActionLabel(action: 'published' | 'archived' | 'delete', fallback: string): string {
  return batchOperatingAction.value === action ? `${fallback}中` : fallback
}

// 整包上线或归档前明确告知对学生新练习和历史记录的影响。
async function changeBatchStatus(
  status: Extract<QuestionBankStatus, 'published' | 'archived'>,
): Promise<void> {
  if (!batch.value) return
  const actionName = status === 'published' ? '上线' : '归档'
  const impactMessage =
    status === 'published'
      ? `上线后，包内 ${batch.value.currentQuestionCount} 道题将进入学生端新练习的选题范围。`
      : '归档后，包内题目不再进入学生端新练习，但进行中作答、历史记录和错题本会继续保留。'
  try {
    await ElMessageBox.confirm(
      `${impactMessage}确认${actionName}试题包“${batch.value.title}”吗？`,
      `${actionName}试题包`,
      { type: 'warning', confirmButtonText: `确认${actionName}`, cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  batchOperatingAction.value = status
  try {
    const result = await updateQuestionBankImportBatchStatus(batchId, status)
    questionDetails.value.forEach((question) => {
      question.status = status
    })
    await refreshBatch()
    ElMessage.success(`试题包已${actionName}，共更新 ${result.updatedQuestions} 道题`)
  } catch {
    // 公共请求层展示后端错误。
  } finally {
    batchOperatingAction.value = ''
  }
}

// 整包删除沿用答题历史保护，成功后返回文件列表。
async function deleteBatch(): Promise<void> {
  if (!batch.value) return
  try {
    await ElMessageBox.confirm(
      `确认删除试题包“${batch.value.title}”及其中 ${batch.value.currentQuestionCount} 道题吗？删除不可恢复；已有学生作答或错题记录时不能删除，只能归档。`,
      '删除试题包',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  batchOperatingAction.value = 'delete'
  try {
    await deleteQuestionBankImportBatch(batchId)
    ElMessage.success('试题包已删除')
    await returnToBatchList()
  } catch {
    // 公共请求层展示后端错误。
  } finally {
    batchOperatingAction.value = ''
  }
}

// 上传时间按管理员当前浏览器时区显示到分钟。
function formatDate(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

onMounted(loadReview)
</script>

<style scoped lang="scss">
.batch-review-page {
  min-height: 100%;
  padding: 0 40px 40px;
  background: #f8fafc;
}

.sticky-admin-panel {
  position: sticky;
  top: 0;
  z-index: 40;
  margin: 0 -40px 24px;
  border-bottom: 1px solid #dbe3ee;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(8px);
}

.batch-toolbar,
.question-toolbar {
  display: grid;
  align-items: center;
  gap: 16px;
  padding-inline: 40px;
}

.batch-toolbar {
  min-height: 72px;
  grid-template-columns: minmax(220px, 1.1fr) minmax(0, 2fr) auto;
  border-bottom: 1px solid #e2e8f0;
}

.batch-heading,
.batch-overview,
.batch-actions {
  min-width: 0;
}

.batch-heading {
  display: grid;
  gap: 5px;
}

.back-link {
  width: fit-content;
  padding: 0;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.batch-heading h2 {
  margin: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 19px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-overview {
  display: flex;
  align-items: center;
  gap: 14px;
  overflow: hidden;
  color: #64748b;
  font-size: 13px;
}

.batch-overview span {
  flex: 0 0 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-overview span:nth-child(3) {
  min-width: 0;
  flex: 1;
}

.batch-overview strong {
  color: #0f172a;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.batch-actions button,
.question-delete-button {
  padding: 5px 0;
  border: 0;
  background: transparent;
  color: #111827;
  font: inherit;
  cursor: pointer;
}

.batch-actions .action-button--publish {
  color: #047857;
}

.batch-actions .action-button--danger,
.question-delete-button {
  color: #dc2626;
}

.batch-actions button:disabled,
.question-delete-button:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.question-toolbar {
  min-height: 58px;
  grid-template-columns:
    minmax(120px, 1.1fr)
    minmax(180px, 1.8fr)
    70px
    minmax(130px, 1.25fr)
    64px
    64px
    88px
    minmax(130px, 1.4fr)
    72px;
  color: #334155;
  font-size: 14px;
}

.question-toolbar > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.question-title {
  color: #0f172a;
}

.status-button {
  min-width: 74px;
  height: 30px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.status-button--draft {
  background: #f1f5f9;
  color: #475569;
}

.status-button--published {
  background: #dcfce7;
  color: #047857;
}

.status-button--archived {
  background: #e5e7eb;
  color: #374151;
}

.analysis-view {
  width: 100%;
  max-width: 1480px;
  margin: 0 auto;
}

.analysis-view :deep(.question-nav) {
  top: 154px;
}

.analysis-view :deep(.latex-text__plain) {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  word-break: break-word;
}

.analysis-view :deep(img) {
  max-width: 100%;
  height: auto;
}

.page-state {
  min-height: 360px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  color: #64748b;
}

.page-state--error {
  color: #b91c1c;
}

@media (max-width: 1200px) {
  .batch-overview span:nth-last-child(-n + 4) {
    display: none;
  }

  .question-toolbar {
    grid-template-columns: minmax(120px, 1fr) minmax(180px, 2fr) 70px 110px 88px 72px;
  }

  .question-toolbar > :nth-child(4),
  .question-toolbar > :nth-child(6),
  .question-toolbar > :nth-child(8) {
    display: none;
  }
}

@media (max-width: 900px) {
  .batch-review-page {
    padding-inline: 20px;
  }

  .sticky-admin-panel {
    margin-inline: -20px;
  }

  .batch-toolbar,
  .question-toolbar {
    padding-inline: 20px;
  }

  .batch-toolbar {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .batch-overview {
    display: none;
  }

  .analysis-view :deep(.question-analysis) {
    grid-template-columns: minmax(0, 1fr);
  }

  .analysis-view :deep(.question-nav) {
    position: static;
  }
}
</style>
