<!-- 管理端试卷预览：按 ESAT 模块或 TMUA 分卷复用正式题目渲染链路。 -->
<template>
  <div class="preview-page">
    <!-- 顶部返回 -->
    <div class="page-top-bar">
      <button class="back-btn" @click="$router.push(backPath)">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {{ backLabel }}
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
              <template
                v-if="paper.deliveryMode === 'module_sequence' && paper.breakDurationSeconds"
              >
                <span class="meta-sep">·</span>
                <span>科目间休息 {{ (paper.breakDurationSeconds || 0) / 60 }} 分钟</span>
              </template>
              <template
                v-else-if="paper.deliveryMode === 'module_sequence' && paper.examType === 'TMUA'"
              >
                <span class="meta-sep">·</span>
                <span>两卷独立计时，卷间自动切换</span>
              </template>
              <span class="meta-sep">·</span>
              <span :class="`status-tag status-tag--${paper.status}`">{{
                statusLabel(paper.status)
              }}</span>
            </div>
          </div>
        </div>

        <!-- 题目列表 -->
        <p v-if="paper.assemblyType === 'legacy_equivalent'" class="assembly-notice">
          本卷为历年官方真题重组的 ESAT 等效诊断卷，并非某一场官方原版试卷。
        </p>
        <div v-if="questions.length" class="questions-list">
          <section v-for="group in questionGroups" :key="group.code" class="module-group">
            <header v-if="paper.deliveryMode === 'module_sequence'" class="module-group__header">
              <div>
                <span>{{ paper.examType === 'TMUA' ? `Paper ${group.order}` : `Module ${group.order}` }}</span>
                <h3>{{ group.label }}</h3>
              </div>
              <strong>{{ group.questions.length }} 题</strong>
            </header>
            <QuestionCard
              v-for="(q, i) in group.questions"
              :key="q.id || i"
              :question="q"
              :index="i"
              :question-label="`${group.label} · Question ${q.module_question_number || q.component_question_number || i + 1}`"
              :show-answer="true"
              variant="exam"
            />
          </section>
        </div>
        <div v-else class="empty-card">暂无题目数据</div>
      </template>

      <div v-else class="empty-card">试卷不存在</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 试卷详情预览（逐题渲染解析结果，复用 QuestionCard 组件）
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import QuestionCard from '@/components/QuestionCard.vue'
import type { Question } from '@/types'

import { getPaperDetailData, type PaperDetail } from '@/api/papers'
import { API_URL } from '@/config'

const route = useRoute()
const paper = ref<PaperDetail | null>(null)
const questions = ref<Question[]>([])
const loading = ref(true)

// 分段卷按稳定代码和顺序分组；扁平卷归入单一连续分组。
const questionGroups = computed(() => {
  const groups = new Map<string, { code: string; label: string; order: number; questions: Question[] }>()
  for (const question of questions.value) {
    const code = question.module_code || question.component_code || 'continuous'
    const order = question.module_order || question.component_order || 1
    const configuredSection = paper.value?.modules?.find((module) => (
      module.code === code && module.order === order
    ))
    const existing = groups.get(code) || {
      code,
      label: configuredSection?.subject || question.subject || (code === 'continuous' ? '试卷题目' : code),
      order,
      questions: [],
    }
    existing.questions.push(question)
    groups.set(code, existing)
  }
  return [...groups.values()].sort((a, b) => a.order - b.order)
})

// 路由来源决定预览页返回试题库或真题库管理。
const isQuestionBankPreview = computed(() => route.path.includes('/core-library/questions/'))
// 返回路径与当前管理入口保持一致。
const backPath = computed(() =>
  isQuestionBankPreview.value ? '/admin/core-library/questions' : '/admin/core-library/exams',
)
// 返回按钮文案与目标管理页面对应。
const backLabel = computed(() =>
  isQuestionBankPreview.value ? '返回试题库管理' : '返回真题库列表',
)

onMounted(async () => {
  try {
    const data = await getPaperDetailData(route.params.id as string)
    paper.value = data

    // 预览页直接渲染标准题目结构。
    const raw = data.questions || []
    questions.value = raw.map((q, idx) => ({
      ...q,
      id: q.id || `q-${idx}`,
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
.preview-page {
  min-height: 100%;
}

.page-top-bar {
  padding: 28px 40px 0;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.15s ease;
  svg {
    width: 16px;
    height: 16px;
  }
  &:hover {
    color: #0f172a;
    background: #f1f5f9;
  }
}

.page-body {
  padding: 24px 40px 48px;
}

/* 试卷信息头部 */
.paper-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
}
.paper-header__left {
  min-width: 0;
}
.paper-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
}
.paper-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.85rem;
  color: #64748b;
}
.meta-sep {
  color: #cbd5e1;
}

.status-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  margin-left: 4px;
  &--draft {
    background: #fffbeb;
    color: #d97706;
  }
  &--review {
    background: #eff6ff;
    color: #2563eb;
  }
  &--published {
    background: #ecfdf5;
    color: #059669;
  }
  &--archived {
    background: #f1f5f9;
    color: #94a3b8;
  }
}

/* 题目列表 */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 820px;
}
.module-group {
  display: grid;
  gap: 28px;
}
.module-group__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
}
.module-group__header span {
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.module-group__header h3 {
  margin: 4px 0 0;
  color: #0f172a;
}
.module-group__header strong {
  color: #64748b;
  font-size: 0.82rem;
}
.assembly-notice {
  max-width: 820px;
  padding: 12px 16px;
  border: 1px solid #fde68a;
  border-radius: 10px;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.82rem;
}

/* SVG 兜底：Qwen 偶发忘记输出 width/height，用 CSS 补位 */
.questions-list :deep(.question-card__svg svg) {
  width: 100%;
  height: auto;
}

.empty-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 80px 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .page-body {
    padding: 20px 20px 36px;
  }
  .page-top-bar {
    padding: 20px 20px 0;
  }
  .paper-header {
    flex-direction: column;
  }
}
</style>
