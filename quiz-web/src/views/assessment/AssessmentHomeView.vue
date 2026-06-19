<template>
  <div class="assessment-page">
    <NavBar />
    <main class="assessment-shell">
      <button class="back-link" type="button" @click="router.push('/')">← 返回首页</button>

      <header class="page-header">
        <h1>{{ activeExamLabel }} 仿真考试</h1>
        <p>选择试卷开始全真模拟，严格计时、即时出分。</p>
      </header>

      <section class="mode-panel">
        <div class="mode-panel__copy">
          <h2>准备好进行全真模拟了吗？</h2>
          <p>模拟考试将严格按照真实考试环境进行，包含计时器与完整长试卷。</p>
        </div>
        <div class="mode-actions" role="tablist">
          <button
            type="button"
            class="mode-button"
            :class="{ 'mode-button--active': activeMode === 'custom' }"
            @click="activeMode = 'custom'"
          >
            自定义模拟考试
          </button>
          <button
            type="button"
            class="mode-button"
            :class="{ 'mode-button--active': activeMode === 'bank' }"
            @click="activeMode = 'bank'"
          >
            试卷库模拟考试
          </button>
        </div>
      </section>

      <section v-if="activeMode === 'bank'" class="paper-section">
        <div class="section-title-row">
          <h2>试卷入口</h2>
          <span>{{ visiblePapers.length }} 套可用</span>
        </div>

        <div v-if="loading" class="empty-state">加载中...</div>
        <div v-else-if="visiblePapers.length" class="paper-grid">
          <article v-for="paper in visiblePapers" :key="paper.id" class="paper-card">
            <span class="card-mark"></span>
            <div class="paper-card__main">
              <h3>{{ paper.title }}</h3>
              <p>考试日期: {{ paper.year }}/{{ formatMonthDay(paper.createdAt) }}</p>
            </div>
            <dl class="paper-card__meta">
              <div>
                <dt>{{ paper.totalQuestions }}</dt>
                <dd>题目</dd>
              </div>
              <div>
                <dt>{{ paper.duration }}</dt>
                <dd>分钟</dd>
              </div>
            </dl>
            <button class="paper-card__link" type="button" @click="startPaper(paper.id)">
              进入考试 →
            </button>
          </article>
        </div>
        <div v-else class="empty-state">暂无已上线真题套卷，请先在后台真题库发布试卷。</div>
      </section>

      <section class="records-section">
        <h2>参与记录</h2>
        <div v-if="records.length" class="record-grid">
          <article v-for="record in records" :key="record.id" class="record-card">
            <span class="card-mark"></span>
            <div class="record-card__head">
              <div>
                <h3>{{ record.paperTitle }}</h3>
                <p>考试日期: {{ formatDate(record.submittedAt || record.startedAt) }}</p>
              </div>
              <span class="record-status">已完成</span>
            </div>
            <div class="record-card__footer">
              <div>
                <strong>{{ scoreText(record) }}</strong>
                <span>分数</span>
                <small>用时 {{ formatDuration(record.durationSeconds) }}</small>
              </div>
              <button type="button" @click="router.push(`/exam-result/${record.id}`)">
                查看详细报告 →
              </button>
            </div>
          </article>
        </div>
        <div v-else class="empty-state empty-state--compact">暂无参与记录</div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// 诊断测试入口页：展示真题套卷、进入在线答题，并承接历史报告。
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import {
  getAssessmentPapersData,
  type AssessmentPaperItem,
  type AssessmentRecordItem,
} from '@/api/papers'

const router = useRouter()
const loading = ref(true)
const activeMode = ref<'custom' | 'bank'>('bank')
const papers = ref<AssessmentPaperItem[]>([])
const records = ref<AssessmentRecordItem[]>([])
const visiblePapers = computed(() => papers.value)
const activeExamLabel = computed(
  () => papers.value.find((p) => p.code)?.code?.toUpperCase() || 'TMUA',
)

// 进入诊断测试页时拉取可测试真题与历史记录，保证入口和报告列表同步。
onMounted(async () => {
  try {
    const data = await getAssessmentPapersData()
    papers.value = data.papers || []
    records.value = data.records || []
  } catch {
    papers.value = []
    records.value = []
  } finally {
    loading.value = false
  }
})

// 点击套卷后复用在线答题页，paperId 决定答题页加载整套真题。
function startPaper(paperId: string): void {
  router.push({ path: '/practice', query: { paperId, mode: 'assessment' } })
}

// 参与记录按 10 分制展示，和页面原型中的分数表达保持一致。
function scoreText(record: AssessmentRecordItem): string {
  if (!record.totalQuestions) return '0'
  return ((record.correctCount / record.totalQuestions) * 10).toFixed(1)
}

// 参与记录统一使用 yyyy/MM/dd，和原型中的考试日期格式保持一致。
function formatDate(value: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// 套卷卡片没有真实考试日期时，用创建日期补足月日展示。
function formatMonthDay(value: string): string {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '01/01'
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

// 历史记录只展示分钟级用时，减少秒级波动带来的视觉噪声。
function formatDuration(seconds: number | null): string {
  if (!seconds) return '-'
  return `${Math.max(1, Math.round(seconds / 60))} 分钟`
}
</script>

<style scoped lang="scss">
.assessment-page {
  min-height: 100vh;
  background: #f7f6f4;
  color: #273437;
  overflow-x: hidden;
}
.assessment-shell {
  width: min(1116px, calc(100% - 40px));
  margin: 0 auto;
  padding: 32px 0 72px;
}
.back-link {
  border: 0;
  background: transparent;
  color: #89979a;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.page-header {
  margin-top: 24px;
}
.page-header h1 {
  margin: 0;
  font-size: 32px;
  letter-spacing: 0;
}
.page-header p {
  margin: 12px 0 0;
  color: #7b898c;
}
.mode-panel {
  margin-top: 40px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 32px;
  align-items: center;
  padding: 28px 30px;
  border: 1px solid #cfe2ee;
  border-radius: 8px;
  background: #edf7fd;
}
.mode-panel__copy h2 {
  margin: 0 0 8px;
  color: #174264;
  font-size: 20px;
}
.mode-panel__copy p {
  margin: 0;
  color: #315d7b;
}
.mode-actions {
  display: flex;
  gap: 14px;
}
.mode-button {
  width: 186px;
  height: 82px;
  border: 1px solid #d8e0e4;
  border-radius: 8px;
  background: #fff;
  color: #23465f;
  font-weight: 800;
  cursor: pointer;
}
.mode-button--active {
  background: #3b7192;
  color: #fff;
  border-color: #3b7192;
}
.paper-section,
.records-section {
  margin-top: 36px;
}
.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}
.section-title-row h2,
.records-section h2 {
  margin: 0;
  font-size: 20px;
}
.paper-grid,
.record-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.paper-card,
.record-card {
  min-width: 0;
  padding: 24px;
  border: 1px solid #e0e4e5;
  border-radius: 8px;
  background: #fff;
}
.card-mark {
  display: block;
  width: 48px;
  height: 2px;
  margin-bottom: 18px;
  background: #3b7192;
}
.paper-card__main h3,
.record-card h3 {
  margin: 0 0 8px;
  font-size: 18px;
  overflow-wrap: anywhere;
}
.paper-card__main p,
.record-card p {
  margin: 0;
  color: #7b898c;
}
.paper-card__meta {
  display: flex;
  gap: 32px;
  margin: 24px 0;
  padding-top: 20px;
  border-top: 1px solid #edf0f1;
}
.paper-card__meta dt {
  font-size: 28px;
  color: #3b7192;
  font-weight: 800;
}
.paper-card__meta dd {
  margin: 0;
  color: #7b898c;
}
.paper-card__link,
.record-card button {
  border: 0;
  background: transparent;
  color: #334b52;
  font-weight: 800;
  cursor: pointer;
}
.record-card__head,
.record-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
.record-card__footer {
  align-items: end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #edf0f1;
}
.record-card strong {
  display: block;
  color: #3b7192;
  font-size: 28px;
}
.record-card small {
  display: block;
  color: #7b898c;
  margin-top: 6px;
}
.record-status {
  align-self: start;
  padding: 6px 10px;
  border-radius: 6px;
  background: #d1fae5;
  color: #047857;
  font-size: 13px;
  font-weight: 700;
}
.empty-state {
  padding: 28px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  text-align: center;
}
.empty-state--compact {
  margin-top: 16px;
}
@media (max-width: 860px) {
  .assessment-shell {
    width: min(100% - 24px, 560px);
    padding: 24px 0 56px;
  }
  .mode-panel,
  .paper-grid,
  .record-grid {
    grid-template-columns: 1fr;
  }
  .mode-actions {
    flex-direction: column;
  }
  .mode-button {
    width: 100%;
  }
  .record-card__head,
  .record-card__footer {
    align-items: flex-start;
    flex-direction: column;
  }
  .record-card__footer {
    gap: 18px;
  }
  .record-card button {
    align-self: stretch;
    text-align: left;
    white-space: normal;
  }
  .record-status {
    align-self: flex-start;
  }
}
@media (max-width: 520px) {
  .assessment-shell {
    width: calc(100% - 24px);
  }
  .page-header h1 {
    font-size: 30px;
  }
  .mode-panel {
    margin-top: 32px;
    padding: 24px;
  }
  .paper-card,
  .record-card {
    padding: 22px;
  }
  .paper-card__meta {
    gap: 28px;
  }
}
</style>
