<template>
  <div class="preview-page">
    <!-- 顶部返回 -->
    <div class="page-top-bar">
      <button class="back-btn" @click="$router.push('/admin/core-library/exams')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回真题库列表
      </button>
    </div>

    <div class="page-body">
      <!-- 加载态 -->
      <div v-if="loading" class="empty-card">加载中...</div>

      <!-- 试卷信息头部 -->
      <template v-else-if="paper">
        <div class="paper-header">
          <div class="paper-header__left">
            <h2 class="paper-title">{{ paper.title }}</h2>
            <div class="paper-meta">
              <span>年份：{{ paper.year }}</span>
              <span class="meta-sep">·</span>
              <span>时长：{{ paper.duration }} 分钟</span>
              <span class="meta-sep">·</span>
              <span>共 {{ questions.length }} 题</span>
              <span class="meta-sep">·</span>
              <span :class="`status-tag status-tag--${paper.status}`">{{ statusLabel(paper.status) }}</span>
            </div>
          </div>
          <div class="paper-header__right">
            <a :href="`${API_URL}/papers/${paper.id}/pdf`" download class="btn-ghost-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              下载 PDF
            </a>
          </div>
        </div>

        <!-- 题目列表 -->
        <div v-if="questions.length" class="questions-list">
          <QuestionCard
            v-for="(q, i) in questions"
            :key="q.id || i"
            :question="q"
            :index="i"
            :show-answer="true"
          />
        </div>
        <div v-else class="empty-card">暂无题目数据</div>
      </template>

      <div v-else class="empty-card">试卷不存在</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 试卷详情预览（逐题渲染解析结果，复用 QuestionCard 组件）
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import QuestionCard from '@/components/QuestionCard.vue'
import type { Question } from '@/types'

import { getPaperDetailData, type PaperDetail } from '@/api/papers'
import { API_URL } from '@/config'

const route = useRoute()
const paper = ref<PaperDetail | null>(null)
const questions = ref<Question[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const data = await getPaperDetailData(route.params.id as string)
    paper.value = data

    // 将 API 返回的 question 映射到 Question 类型
    const raw = data.questions || []
    questions.value = raw.map((q: any, idx: number) => ({
      id: q.id || `q-${idx}`,
      number: q.number,
      order: q.order || q.number,
      title: q.title || '',
      options: q.options || [],
      answer: q.answer || [],
      images: q.images || [],
    }))
  } catch {
    paper.value = null
    questions.value = []
  } finally {
    loading.value = false
  }
})

function statusLabel(s: string) {
  return { draft: '草稿', review: '审核中', published: '已上线', archived: '已归档' }[s] || s
}
</script>

<style scoped lang="scss">
.preview-page { min-height: 100%; }

.page-top-bar { padding: 28px 40px 0; }
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: none; background: transparent;
  font-size: 0.875rem; font-weight: 500; color: #64748b;
  cursor: pointer; border-radius: 8px; transition: all 0.15s ease;
  svg { width: 16px; height: 16px; }
  &:hover { color: #0f172a; background: #f1f5f9; }
}

.page-body { padding: 24px 40px 48px; }

/* 试卷信息头部 */
.paper-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 28px; gap: 16px;
}
.paper-header__left { min-width: 0; }
.paper-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0 0 10px; }
.paper-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 0.85rem; color: #64748b; }
.meta-sep { color: #cbd5e1; }

.status-tag {
  display: inline-block; padding: 2px 10px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; margin-left: 4px;
  &--draft { background: #fffbeb; color: #d97706; }
  &--review { background: #eff6ff; color: #2563eb; }
  &--published { background: #ecfdf5; color: #059669; }
  &--archived { background: #f1f5f9; color: #94a3b8; }
}

.btn-ghost-action {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 20px; background: #ffffff; color: #475569;
  border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s ease; text-decoration: none;
  svg { width: 16px; height: 16px; }
  &:hover { background: #f8fafc; border-color: #cbd5e1; }
}

/* 题目列表 */
.questions-list {
  display: flex; flex-direction: column; gap: 28px;
  max-width: 820px;
}

/* SVG 兜底：Qwen 偶发忘记输出 width/height，用 CSS 补位 */
.questions-list :deep(.question-card__svg svg) {
  width: 100%;
  height: auto;
}

.empty-card {
  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;
  padding: 80px 40px; text-align: center; color: #94a3b8; font-size: 0.9rem;
}

@media (max-width: 768px) {
  .page-body { padding: 20px 20px 36px; }
  .page-top-bar { padding: 20px 20px 0; }
  .paper-header { flex-direction: column; }
}
</style>
