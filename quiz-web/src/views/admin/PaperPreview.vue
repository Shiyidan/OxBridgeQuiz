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
            <div class="paper-title-row">
              <el-input
                v-if="editingTitle"
                ref="titleInputRef"
                v-model="titleDraft"
                class="paper-title-input"
                maxlength="200"
                :disabled="savingTitle"
                @blur="saveTitle"
                @keydown.enter.prevent="finishTitleEditing"
                @keydown.esc.prevent="cancelTitleEditing"
              />
              <template v-else>
                <h2 class="paper-title">{{ paper.title }}</h2>
                <button
                  v-if="paper.status === 'draft'"
                  type="button"
                  class="title-edit-button"
                  aria-label="编辑试卷标题"
                  title="编辑试卷标题"
                  @click="startTitleEditing"
                >
                  <el-icon aria-hidden="true"><EditPen /></el-icon>
                </button>
              </template>
            </div>
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

        <!-- 题目解析 -->
        <ExamQuestionAnalysis
          v-if="analysisQuestions.length"
          class="paper-analysis"
          :questions="analysisQuestions"
          :correct-count="0"
          :show-user-answer="false"
        />
        <div v-else class="empty-card">暂无题目数据</div>
      </template>

      <div v-else class="empty-card">试卷不存在</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 试卷详情预览复用诊断报告逐题解析组件，保证真题与前台报告展示一致。
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen } from '@element-plus/icons-vue'
import ExamQuestionAnalysis from '@/components/report/ExamQuestionAnalysis.vue'
import type { ExamQuestion } from '@/api/exam'
import type { Question } from '@/types'

import { getPaperDetailData, updatePaperTitle, type PaperDetail } from '@/api/papers'

const route = useRoute()
const paper = ref<PaperDetail | null>(null)
const questions = ref<Question[]>([])
const loading = ref(true)
const editingTitle = ref(false)
const savingTitle = ref(false)
const titleDraft = ref('')
const titleInputRef = ref<{ focus: () => void; blur: () => void } | null>(null)

// 完整真题转换为报告组件的数据结构，题目 id 同时用于左侧导航的稳定定位。
const analysisQuestions = computed<Array<ExamQuestion & { id: string }>>(() =>
  questions.value.map((question, index) => ({
    ...question,
    id: question.id || `q-${index}`,
    questionId: question.id || `q-${index}`,
  })),
)

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

// 点击编辑图标后使用当前标题初始化输入框，并在渲染完成后自动聚焦。
async function startTitleEditing(): Promise<void> {
  if (!paper.value || paper.value.status !== 'draft' || savingTitle.value) return
  titleDraft.value = paper.value.title
  editingTitle.value = true
  await nextTick()
  titleInputRef.value?.focus()
}

// 回车通过触发失焦复用统一保存流程，避免发送两次更新请求。
function finishTitleEditing(): void {
  titleInputRef.value?.blur()
}

// Esc 放弃本次修改并恢复当前已保存标题。
function cancelTitleEditing(): void {
  titleDraft.value = paper.value?.title || ''
  editingTitle.value = false
}

// 输入框失焦时校验并保存标题；失败时恢复服务端最近一次成功值。
async function saveTitle(): Promise<void> {
  if (!paper.value || !editingTitle.value || savingTitle.value) return
  const previousTitle = paper.value.title
  const nextTitle = titleDraft.value.trim()
  if (!nextTitle) {
    titleDraft.value = previousTitle
    editingTitle.value = false
    ElMessage.warning('试卷标题不能为空')
    return
  }
  if (nextTitle === previousTitle) {
    editingTitle.value = false
    return
  }
  savingTitle.value = true
  try {
    const updatedPaper = await updatePaperTitle(paper.value.id, nextTitle)
    paper.value.title = updatedPaper.title
    titleDraft.value = updatedPaper.title
    editingTitle.value = false
    ElMessage.success('试卷标题已保存')
  } catch {
    titleDraft.value = previousTitle
    editingTitle.value = false
  } finally {
    savingTitle.value = false
  }
}

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
.paper-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin-bottom: 10px;
}
.paper-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0;
}
.paper-title-input {
  width: min(900px, 72vw);
}
.paper-title-input :deep(.el-input__wrapper) {
  padding: 4px 12px;
  font-size: 1.25rem;
  font-weight: 700;
}
.title-edit-button {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
}
.title-edit-button:hover {
  background: #e2e8f0;
  color: #0f172a;
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

.paper-analysis {
  width: 100%;
  max-width: 1480px;
}

.paper-analysis :deep(.latex-text__plain) {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  word-break: break-word;
}

.paper-analysis :deep(img) {
  max-width: 100%;
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

  .paper-analysis :deep(.question-analysis) {
    grid-template-columns: minmax(0, 1fr);
  }

  .paper-analysis :deep(.question-nav) {
    position: static;
  }
}
</style>
