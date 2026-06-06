<template>
  <div class="error-book-page">
    <NavBar />
    <main class="error-book-main">
      <header class="error-book-header">
        <h1>错题本</h1>
        <p>记录你在练习和考试中答错的题目，方便针对性复习</p>
      </header>

      <div class="error-book-empty">
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
    </main>
  </div>
</template>

<script setup lang="ts">
// 错题本页面 — 已付费用户专属
import NavBar from '@/components/NavBar.vue'
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
</style>
