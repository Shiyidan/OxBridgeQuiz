<template>
  <div class="mistake-notebook-page">
    <NavBar />
    <main class="mistake-notebook-main">
      <header class="mistake-notebook-header">
        <h1>错题本</h1>
        <p>记录你在练习和考试中答错的题目，方便针对性复习</p>
      </header>

      <!-- 错题列表 -->
      <section class="notebook-section">
        <h2 class="section-title">错题列表</h2>

        <div v-if="wrongLoading" class="section-card">
          <p class="loading-text">加载中...</p>
        </div>

        <div v-else-if="wrongList.length === 0" class="section-card section-card--empty">
          <div class="empty-icon">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="12" y="8" width="40" height="50" rx="4" stroke="#cbd5e1" stroke-width="2" fill="none"/>
              <line x1="22" y1="22" x2="42" y2="22" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>
              <line x1="22" y1="30" x2="38" y2="30" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>
              <line x1="22" y1="38" x2="34" y2="38" stroke="#e2e8f0" stroke-width="2" stroke-linecap="round"/>
              <circle cx="46" cy="48" r="12" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2"/>
              <path d="M43 48h6M46 45v6" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <h3>暂无错题</h3>
          <p class="empty-desc">你还没有做错的题目，继续保持！</p>
        </div>

        <div v-else class="section-card">
          <p class="list-summary">共 {{ wrongList.length }} 道错题</p>
          <div
            v-for="(item, idx) in wrongList"
            :key="item.id"
            class="wrong-item"
          >
            <div class="wrong-item__header">
              <span class="wrong-item__num">#{{ idx + 1 }}</span>
              <span class="wrong-item__qid">{{ item.questionId }}</span>
              <span v-if="item.selectedAnswer" class="wrong-item__answer">
                选了 {{ item.selectedAnswer }}
              </span>
              <span v-else class="wrong-item__answer wrong-item__answer--skip">未作答</span>
              <span class="wrong-item__date">{{ formatDate(item.examRecord?.submittedAt) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 练习记录 -->
      <section class="notebook-section">
        <h2 class="section-title">试题库练习记录</h2>

        <div v-if="recordsLoading" class="section-card">
          <p class="loading-text">加载中...</p>
        </div>

        <div v-else-if="practiceRecords.length === 0" class="section-card section-card--empty">
          <h3>暂无练习记录</h3>
          <p class="empty-desc">去试题库完成练习后，记录会出现在这里。</p>
          <router-link to="/question-bank" class="go-practice-btn">
            去练习
          </router-link>
        </div>

        <div v-else class="section-card">
          <p class="list-summary">共 {{ practiceRecords.length }} 次练习</p>
          <div
            v-for="record in practiceRecords"
            :key="record.id"
            class="practice-record-item"
          >
            <div class="practice-record__body">
              <div class="practice-record__info">
                <span class="practice-record__date">{{ formatDateTime(record.submittedAt) }}</span>
                <span class="practice-record__score">
                  {{ record.correctCount }} / {{ record.totalQuestions }} 正确
                </span>
              </div>
              <div class="practice-record__meta">
                <span>正确率 {{ accuracyText(record) }}</span>
                <span>用时 {{ formatDuration(record.durationSeconds) }}</span>
              </div>
            </div>
            <router-link
              :to="`/exam-result/${record.id}`"
              class="practice-record__link"
            >
              查看报告 →
            </router-link>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// 错题本页面：错题列表 + 试题库练习记录
import { ref, onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import {
  getMistakeNotebookData,
  getPracticeRecords,
  type WrongAnswer,
  type PracticeRecord,
} from '@/api/exam'

const wrongList = ref<WrongAnswer[]>([])
const wrongLoading = ref(true)
const practiceRecords = ref<PracticeRecord[]>([])
const recordsLoading = ref(true)

onMounted(async () => {
  const [wrongResult, recordsResult] = await Promise.allSettled([
    getMistakeNotebookData(),
    getPracticeRecords(),
  ])

  if (wrongResult.status === 'fulfilled') {
    wrongList.value = wrongResult.value.wrongAnswers || []
  }
  wrongLoading.value = false

  if (recordsResult.status === 'fulfilled') {
    practiceRecords.value = recordsResult.value.records || []
  }
  recordsLoading.value = false
})

function accuracyText(record: PracticeRecord): string {
  if (!record.totalQuestions) return '0%'
  return `${((record.correctCount / record.totalQuestions) * 100).toFixed(0)}%`
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-'
  return `${Math.max(1, Math.round(seconds / 60))} 分钟`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.mistake-notebook-page {
  min-height: 100vh;
  background: #f8fafc;
}

.mistake-notebook-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.mistake-notebook-header {
  margin-bottom: 2.5rem;

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.938rem;
    color: #64748b;
    margin: 0;
  }
}

.notebook-section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #334155;
  margin: 0 0 1rem;
}

.section-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
}

.section-card--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;

  h3 {
    font-size: 1.15rem;
    font-weight: 600;
    color: #475569;
    margin: 0 0 0.5rem;
  }
}

.loading-text {
  text-align: center;
  color: #94a3b8;
  margin: 0;
  padding: 1rem;
}

.empty-icon {
  margin-bottom: 1.5rem;
  opacity: 0.6;

  svg {
    width: 80px;
    height: 80px;
  }
}

.empty-desc {
  font-size: 0.938rem;
  color: #94a3b8;
  margin: 0 0 1.5rem;
}

.go-practice-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  background: #4f46e5;
  color: #ffffff;
  border-radius: 10px;
  font-size: 0.938rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: #6366f1;
  }
}

.list-summary {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1rem;
}

/* 错题列表 */
.wrong-item {
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 10px;
  margin-bottom: 8px;

  &:last-child { margin-bottom: 0; }
}

.wrong-item__header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
}

.wrong-item__num {
  font-weight: 600;
  color: #0f172a;
  min-width: 28px;
}

.wrong-item__qid {
  flex: 1;
  color: #475569;
}

.wrong-item__answer {
  font-weight: 500;
  color: #ef4444;
  &--skip { color: #94a3b8; font-style: italic; }
}

.wrong-item__date {
  color: #94a3b8;
  font-size: 0.8125rem;
}

/* 练习记录 */
.practice-record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 10px;

  &:last-child { margin-bottom: 0; }
}

.practice-record__body {
  flex: 1;
  min-width: 0;
}

.practice-record__info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 6px;
}

.practice-record__date {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.practice-record__score {
  font-size: 0.875rem;
  font-weight: 700;
  color: #2563eb;
}

.practice-record__meta {
  display: flex;
  gap: 16px;
  font-size: 0.8125rem;
  color: #94a3b8;

  span {
    white-space: nowrap;
  }
}

.practice-record__link {
  flex-shrink: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #4f46e5;
  text-decoration: none;

  &:hover {
    color: #6366f1;
  }
}

@media (max-width: 520px) {
  .mistake-notebook-main {
    padding: 2rem 1rem;
  }

  .practice-record-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .practice-record__info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
