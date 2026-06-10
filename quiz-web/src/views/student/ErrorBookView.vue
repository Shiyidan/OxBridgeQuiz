<template>
  <div class="error-book-page">
    <NavBar />
    <main class="error-book-main">
      <header class="error-book-header">
        <h1>错题本</h1>
        <p>记录你在练习和考试中答错的题目，方便针对性复习</p>
      </header>

      <!-- 加载中 -->
      <div v-if="loading" class="error-book-empty">
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="wrongList.length === 0" class="error-book-empty">
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
        <h2>暂无错题</h2>
        <p class="empty-desc">你还没有做错的题目，继续保持！</p>
        <router-link to="/question-bank" class="go-practice-btn">
          去练习
        </router-link>
      </div>

      <!-- 错题列表 -->
      <div v-else class="error-book-list">
        <p class="list-summary">共 {{ wrongList.length }} 道错题</p>
        <div
          v-for="(item, idx) in wrongList"
          :key="item.id"
          class="error-item"
        >
          <div class="error-item__header">
            <span class="error-item__num">#{{ idx + 1 }}</span>
            <span class="error-item__qid">{{ item.questionId }}</span>
            <span v-if="item.selectedAnswer" class="error-item__answer">
              选了 {{ item.selectedAnswer }}
            </span>
            <span v-else class="error-item__answer error-item__answer--skip">未作答</span>
            <span class="error-item__date">{{ formatDate(item.examRecord?.submittedAt) }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// 错题本页面 — 从 API 获取当前用户的错题记录
import { ref, onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import request from '@/utils/request'

interface WrongAnswer {
  id: string
  questionId: string
  selectedAnswer: string | null
  isCorrect: boolean
  examRecord?: {
    id: string
    submittedAt: string
  }
}

interface ErrorBookData {
  wrongAnswers: WrongAnswer[]
  total: number
}

const wrongList = ref<WrongAnswer[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const res = await request.get<ErrorBookData>('/exams/error-book')
    wrongList.value = res.data.wrongAnswers || []
  } catch {
    wrongList.value = []
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.error-book-page {
  min-height: 100vh;
  background: #f8fafc;
}

.error-book-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.error-book-header {
  margin-bottom: 2rem;

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

.error-book-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5rem 2rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 1.5rem;
  opacity: 0.6;

  svg {
    width: 80px;
    height: 80px;
  }
}

.error-book-empty h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem;
}

.empty-desc {
  font-size: 0.938rem;
  color: #94a3b8;
  margin: 0 0 2rem;
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

/* 错题列表 */
.error-book-list {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
}

.list-summary {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1rem;
}

.error-item {
  padding: 12px 16px;
  background: #fef2f2;
  border-radius: 10px;
  margin-bottom: 8px;

  &:last-child { margin-bottom: 0; }
}

.error-item__header {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.875rem;
}

.error-item__num {
  font-weight: 600;
  color: #0f172a;
  min-width: 28px;
}

.error-item__qid {
  flex: 1;
  color: #475569;
}

.error-item__answer {
  font-weight: 500;
  color: #ef4444;
  &--skip { color: #94a3b8; font-style: italic; }
}

.error-item__date {
  color: #94a3b8;
  font-size: 0.8125rem;
}
</style>
