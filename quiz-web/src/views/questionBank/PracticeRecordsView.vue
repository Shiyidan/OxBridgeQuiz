<!-- 练习记录页：集中展示试题库产生的临时练习与进行中答卷。 -->
<template>
  <div class="practice-records">
    <main class="records-container">
      <header class="records-header">
        <div>
          <span class="records-eyebrow">Practice Records</span>
          <h1>练习记录</h1>
          <p>存放从试题库直接开始、且未保存为练习本的临时练习。</p>
        </div>
        <button type="button" class="records-back" @click="handleBackToQuestionBank">
          <span aria-hidden="true">←</span>
          <span>返回试题库</span>
        </button>
      </header>

      <section v-if="activeTemporaryPractice" class="active-record" aria-label="进行中练习">
        <div>
          <span class="active-record__status">进行中</span>
          <strong>{{ activeTemporaryPractice.examType }} 临时练习</strong>
          <small>
            已答 {{ activeTemporaryPractice.answeredCount }}/{{
              activeTemporaryPractice.totalQuestions
            }}
            题 · 开始于 {{ formatDateTime(activeTemporaryPractice.startedAt) }}
          </small>
        </div>
        <button type="button" class="button_primary" @click="continuePractice">继续练习</button>
      </section>

      <section v-if="loading" class="records-state">正在加载练习记录...</section>
      <section v-else-if="loadError" class="records-state records-state--error">
        <p>{{ loadError }}</p>
        <button type="button" class="button_cancel" @click="loadRecords">重新加载</button>
      </section>
      <section v-else-if="records.length" class="records-list" aria-label="已完成练习记录">
        <div class="records-list__header" aria-hidden="true">
          <span>练习内容</span>
          <span>练习设置</span>
          <span>成绩</span>
          <span>正确率</span>
          <span>用时</span>
          <span>交卷时间</span>
          <span></span>
        </div>
        <article v-for="record in records" :key="record.id" class="record-row">
          <div class="record-row__scope">
            <strong :title="formatScopeTitle(record)">{{ formatScopeTitle(record) }}</strong>
            <small :title="formatScopePath(record)">{{ formatScopePath(record) }}</small>
          </div>
          <div class="record-row__settings">
            <span class="record-tag">专项练习</span>
            <span v-if="record.snapshot.difficulty" class="record-tag">
              {{ formatDifficulty(record.snapshot.difficulty) }}
            </span>
            <span class="record-tag">{{ record.totalQuestions }}题</span>
            <small v-if="formatPlannedCount(record)">{{ formatPlannedCount(record) }}</small>
          </div>
          <strong class="record-row__score">
            {{ record.correctCount }} / {{ record.totalQuestions }}
          </strong>
          <div class="record-row__accuracy" :data-level="masteryLevel(record.accuracy)">
            <strong>{{ record.accuracy }}%</strong>
            <small>{{ masteryLabel(record.accuracy) }}</small>
          </div>
          <span>{{ formatDuration(record.durationSeconds) }}</span>
          <span class="record-row__submitted">{{ formatDateTime(record.submittedAt) }}</span>
          <button type="button" class="record-row__detail" @click="openRecord(record.id)">
            查看解析
          </button>
        </article>
        <AppPagination
          :page="page"
          :page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </section>
      <section v-else class="records-state records-state--empty">
        <strong>暂无临时练习记录</strong>
        <p>从试题库选择考点和难度开始练习，交卷后会保存在这里。</p>
        <button type="button" class="button_primary" @click="handleBackToQuestionBank">
          前往试题库
        </button>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppPagination from '@/components/AppPagination.vue'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import {
  getPracticeNotebooks,
  getTemporaryPracticeHistory,
  type ActiveNotebookPractice,
  type TemporaryPracticeHistoryRecord,
} from '@/api/practiceNotebook'
import { getApiErrorMessage } from '@/utils/request'

const router = useRouter()
const auth = useAuthStore()
const records = ref<TemporaryPracticeHistoryRecord[]>([])
const activePractice = ref<ActiveNotebookPractice | null>(null)
const loading = ref(true)
const loadError = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
let initialized = false
let requestSequence = 0

// 记录列表始终跟随顶部导航选择的考试类型。
const activeExamType = computed<ActiveExamType>(() => auth.activeExamType)

// 记录页只承接没有练习本归属的进行中答卷，避免把固定练习本任务重复展示。
const activeTemporaryPractice = computed(() => {
  const practice = activePractice.value
  if (!practice || practice.practiceNotebookId || practice.examType !== activeExamType.value)
    return null
  return practice
})

// 列表与活动答卷使用同一考试类型快照，快速切换考试时只接受最后一次响应。
async function loadRecords(): Promise<void> {
  const sequence = ++requestSequence
  const requestedExamType = activeExamType.value
  loading.value = true
  loadError.value = ''
  try {
    const [history, notebookData] = await Promise.all([
      getTemporaryPracticeHistory(requestedExamType, page.value, pageSize.value),
      getPracticeNotebooks(requestedExamType),
    ])
    if (sequence !== requestSequence || requestedExamType !== activeExamType.value) return
    records.value = history.list
    page.value = history.pagination.page
    pageSize.value = history.pagination.pageSize
    total.value = history.pagination.total
    activePractice.value = notebookData.activePractice
  } catch (error: unknown) {
    if (sequence !== requestSequence) return
    records.value = []
    activePractice.value = null
    total.value = 0
    loadError.value = getApiErrorMessage(error, '练习记录加载失败，请稍后重试')
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

// 页码变化后读取对应一页临时练习。
function handlePageChange(nextPage: number): void {
  page.value = nextPage
  void loadRecords()
}

// 每页数量变化后回到第一页，避免旧页码超过新的总页数。
function handlePageSizeChange(nextPageSize: number): void {
  pageSize.value = nextPageSize
  page.value = 1
  void loadRecords()
}

// 进行中临时练习从服务端记录恢复，并保留练习记录作为交卷后的返回来源。
function continuePractice(): void {
  if (!activeTemporaryPractice.value) return
  void router.push({
    path: '/practice',
    query: { examId: activeTemporaryPractice.value.examRecordId, from: 'practice-records' },
  })
}

// 已交卷记录复用题库逐题解析，同时固定返回到当前记录列表。
function openRecord(examRecordId: string): void {
  void router.push({
    name: 'exam-result-detail',
    params: { id: examRecordId },
    query: { from: 'practice-records', recordSource: 'question-bank' },
  })
}

// 练习内容使用提交时快照中的最深考纲节点，不再降级展示缺失范围的旧记录。
function formatScopeTitle(record: TemporaryPracticeHistoryRecord): string {
  return record.snapshot.knowledgePoint.label
}

// 路径只展示标题之前的层级，避免主标题和辅助路径重复。
function formatScopePath(record: TemporaryPracticeHistoryRecord): string {
  const parentLabels = record.snapshot.knowledgePoint.path
    .slice(0, -1)
    .map((node) => node.label)
  return parentLabels.length ? `${record.examType} · ${parentLabels.join(' / ')}` : record.examType
}

// 难度枚举转换为学生端短标签，未知值保留原文便于兼容后续扩展。
function formatDifficulty(value: TemporaryPracticeHistoryRecord['snapshot']['difficulty']): string {
  const labels: Record<TemporaryPracticeHistoryRecord['snapshot']['difficulty'], string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  }
  return labels[value]
}

// 额度缩量时同时展示原计划题量和实际题量，题量相同时不重复提示。
function formatPlannedCount(record: TemporaryPracticeHistoryRecord): string {
  const planned = record.snapshot.plannedQuestionCount
  if (planned === record.totalQuestions) return ''
  return `原计划${planned}题`
}

// 正确率映射为三档掌握状态，颜色只作为文案之外的辅助提示。
function masteryLevel(accuracy: number): 'good' | 'focus' | 'review' {
  if (accuracy >= 80) return 'good'
  return accuracy >= 60 ? 'focus' : 'review'
}

// 掌握状态文案帮助学生快速判断下一步复习优先级。
function masteryLabel(accuracy: number): string {
  const labels = { good: '掌握良好', focus: '继续巩固', review: '建议复习' }
  return labels[masteryLevel(accuracy)]
}

// 时间使用本地化展示；无效或缺失值不伪造成当前时间。
function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// 用时统一显示到分钟和秒，便于与逐题详情核对。
function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const rest = safeSeconds % 60
  return minutes ? `${minutes}分${rest}秒` : `${rest}秒`
}

// 返回同一工作区的试题库首页。
function handleBackToQuestionBank(): void {
  void router.push('/question-bank')
}

// 顶部考试类型切换后从第一页读取对应记录，避免混入上一考试的数据。
watch(activeExamType, () => {
  if (!initialized) return
  page.value = 1
  records.value = []
  activePractice.value = null
  void loadRecords()
})

// 登录守卫确保用户身份存在，再初始化会员考试偏好与记录列表。
onMounted(async () => {
  try {
    await auth.ensureMemberContext()
  } catch {
    // 公共请求层展示上下文失败；页面仍按当前全局考试类型读取记录。
  }
  initialized = true
  await loadRecords()
})
</script>

<style scoped>
.practice-records {
  min-height: calc(100vh - var(--nav-height));
  color: var(--color-ink);
}

.records-container {
  width: var(--fluid-shell-width);
  margin: 0 auto;
  padding: 40px 0 96px;
}

.records-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.records-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.records-eyebrow::before {
  width: 24px;
  height: 1px;
  background: var(--color-ink);
  content: '';
}

.records-header h1 {
  margin: 0;
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
}

.records-header p {
  margin: 10px 0 0;
  color: var(--color-ink-soft);
}

.records-back {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-ink);
  font: inherit;
  font-weight: var(--weight-semi);
  cursor: pointer;
}

.records-back:hover,
.records-back:focus-visible {
  border-color: var(--color-ink);
  background: var(--color-hover);
}

.active-record {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 96px;
  margin-bottom: 20px;
  padding: 18px 24px;
  border: 1px solid var(--color-line);
  border-left: 5px solid var(--color-success);
  background: var(--color-surface);
}

.active-record > div {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 6px 10px;
}

.active-record__status {
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
}

.active-record small {
  grid-column: 1 / -1;
  color: var(--color-ink-muted);
}

.records-state {
  min-height: 220px;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  text-align: center;
}

.records-state p {
  margin: 0;
}

.records-state--error {
  color: var(--color-danger);
}

.records-state--empty strong {
  color: var(--color-ink);
  font-size: var(--text-lg);
}

.records-list {
  border-top: 1px solid var(--color-line);
  border-bottom: 1px solid var(--color-line);
  background: var(--color-surface);
}

.records-list__header,
.record-row {
  display: grid;
  grid-template-columns:
    minmax(260px, 2fr) minmax(210px, 1.4fr) 100px 110px 110px minmax(160px, 1.1fr)
    96px;
  align-items: center;
  gap: 20px;
  padding: 0 24px;
}

.records-list__header {
  min-height: 56px;
  border-bottom: 1px solid var(--color-ink);
  color: var(--color-ink-muted);
  font-size: var(--text-xs);
}

.record-row {
  min-height: 104px;
  border-bottom: 1px solid var(--color-line-soft);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
}

.record-row:hover {
  background: var(--color-hover);
}

.record-row__scope,
.record-row__settings,
.record-row__accuracy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.record-row__scope strong,
.record-row__score {
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
}

.record-row__scope strong,
.record-row__scope small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-row__scope small,
.record-row__settings small {
  color: var(--color-ink-muted);
}

.record-row__settings {
  flex-flow: row wrap;
  align-items: center;
  gap: 6px;
}

.record-row__settings small {
  flex-basis: 100%;
}

.record-tag {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--color-info-bg);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  white-space: nowrap;
}

.record-row__accuracy strong {
  font-variant-numeric: tabular-nums;
}

.record-row__accuracy small {
  font-size: var(--text-xs);
  white-space: nowrap;
}

.record-row__accuracy[data-level='good'] {
  color: var(--color-success);
}

.record-row__accuracy[data-level='focus'] {
  color: var(--color-warning);
}

.record-row__accuracy[data-level='review'] {
  color: var(--color-danger);
}

.record-row__submitted {
  line-height: var(--leading-relaxed);
}

.record-row__detail {
  border: 0;
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  font-weight: var(--weight-semi);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.records-list :deep(.app-pagination) {
  padding: 20px 24px;
}

@media (max-width: 900px) {
  .records-header {
    align-items: flex-start;
  }

  .records-list {
    overflow-x: auto;
  }

  .records-list__header,
  .record-row {
    min-width: 1220px;
  }
}
</style>
