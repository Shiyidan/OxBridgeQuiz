<template>
  <div class="question-bank-page">
    <div class="page-top-bar">
      <button class="back-btn" type="button" @click="$router.push('/admin/core-library')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回资料库
      </button>
    </div>

    <div class="page-body">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">试题库题目管理</h2>
          <p class="section-desc">管理 AI 生成题目及其内容，发布后进入学生端试题库练习范围。</p>
        </div>
        <button class="btn-primary-action" type="button" @click="handleImport">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          导入题目
        </button>
      </div>

      <div class="filter-bar">
        <div class="search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model.trim="keyword" type="text" placeholder="搜索试卷名称..." class="search-input" />
        </div>
        <div class="filter-tags">
          <button
            v-for="item in examTypeFilters"
            :key="item.value"
            type="button"
            class="filter-tag"
            :class="{ 'filter-tag--active': activeExamType === item.value }"
            @click="activeExamType = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <div v-if="loading" class="empty-card">加载中...</div>
      <div v-else-if="filteredPapers.length" class="data-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>题目名称</th>
              <th>考试类型</th>
              <th>学科/模块</th>
              <th>类型</th>
              <th>年份</th>
              <th>题目数量</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="paper in filteredPapers" :key="paper.id">
              <td class="name-cell">{{ paper.title }}</td>
              <td>
                <span class="exam-type-tag">{{ paper.examType || 'TMUA' }}</span>
              </td>
              <td>
                <span :class="`subject-tag subject-tag--${subjectType(paper.code)}`">
                  {{ subjectLabel(paper.code) }}
                </span>
              </td>
              <td>
                <span class="paper-type-tag">AI 生成卷</span>
              </td>
              <td>{{ paper.year }}</td>
              <td>{{ paper.totalQuestions }} 题</td>
              <td>
                <button
                  class="status-btn"
                  :class="`status-btn--${paper.status}`"
                  type="button"
                  @click="toggleStatusMenu(paper.id)"
                >
                  {{ statusLabel(paper.status) }}
                </button>
                <Transition name="fade">
                  <div v-if="activeStatusMenu === paper.id" class="status-dropdown" @click.stop>
                    <button
                      v-for="s in statusOptions"
                      :key="s.value"
                      class="status-option"
                      type="button"
                      @click="changeStatus(paper.id, s.value)"
                    >
                      {{ s.label }}
                    </button>
                  </div>
                </Transition>
              </td>
              <td>
                <router-link :to="`/admin/core-library/questions/${paper.id}`" class="action-link">
                  管理内容
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-card">暂无 AI 生成题目，请点击“导入题目”上传题目文件。</div>
    </div>

    <div
      v-if="activeStatusMenu !== null"
      class="menu-overlay"
      @click="activeStatusMenu = null"
    ></div>
  </div>
</template>

<script setup lang="ts">
// 试题库题目管理：按 AI 生成题目文件管理内容和发布状态。
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPaperListData, updatePaperStatus, type PaperItem } from '@/api/papers'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import { PAPER_TYPE } from '@/constants/paperTypes'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const keyword = ref('')
const activeExamType = ref('all')
const activeStatusMenu = ref<string | null>(null)
const paperList = ref<PaperItem[]>([])

const examTypeFilters = computed(() => [
  { value: 'all', label: '全部' },
  ...EXAM_TYPE_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
])

const filteredPapers = computed(() => {
  const key = keyword.value.toLowerCase()
  return paperList.value.filter((paper) => {
    const matchKeyword = !key || paper.title.toLowerCase().includes(key)
    const matchExamType = activeExamType.value === 'all' || paper.examType === activeExamType.value
    return matchKeyword && matchExamType
  })
})

watch(
  () => route.path,
  (path) => {
    if (path === '/admin/core-library/questions') fetchPapers()
  },
  { immediate: true },
)

// 试题库管理只展示 AI 生成卷来源，和学生端试题库的数据来源保持一致。
async function fetchPapers(): Promise<void> {
  loading.value = true
  try {
    const papers = (await getPaperListData({ paperType: PAPER_TYPE.AI_PAPER })).papers || []
    paperList.value = papers.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  } catch {
    paperList.value = []
  } finally {
    loading.value = false
  }
}

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'review', label: '审核中' },
  { value: 'published', label: '已上线' },
  { value: 'archived', label: '已归档' },
]

// 后台列表用试卷 code 推断学科展示名，空 code 展示为通用。
function subjectLabel(code: string | null): string {
  return code || '通用'
}

// 学科类型只影响标签颜色，不参与业务筛选。
function subjectType(code: string | null): string {
  if (!code) return 'general'
  const t = code.toLowerCase()
  if (t.includes('math')) return 'math'
  if (t.includes('step') || t.includes('esat')) return 'advanced'
  if (t.includes('physics') || t.includes('pat')) return 'physics'
  return 'general'
}

// 状态值来自后端枚举，前端统一转为中文展示。
function statusLabel(status: string): string {
  return (
    { draft: '草稿', review: '审核中', published: '已上线', archived: '已归档' }[status] || status
  )
}

// 同一时间只展开一个状态菜单，避免表格内多个浮层互相遮挡。
function toggleStatusMenu(id: string): void {
  activeStatusMenu.value = activeStatusMenu.value === id ? null : id
}

// 发布成功后，该批次题目进入学生端试题库练习范围。
async function changeStatus(id: string, newStatus: string): Promise<void> {
  try {
    await updatePaperStatus(id, newStatus)
    const item = paperList.value.find((p) => p.id === id)
    if (item) item.status = newStatus
  } catch (e: any) {
    if (e?.response?.status === 401) {
      activeStatusMenu.value = null
      return
    }
  }
  activeStatusMenu.value = null
}

// 导入入口复用标准 JSON / Markdown 上传流程，文件内 paperType 决定进入哪个管理列表。
function handleImport(): void {
  router.push({ path: '/admin/core-library/exams/upload', query: { source: 'questions' } })
}
</script>

<style scoped lang="scss">
.question-bank-page {
  min-height: 100%;
  position: relative;
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

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.header-text {
  max-width: 620px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
  letter-spacing: 0;
}

.section-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.btn-primary-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: #6366f1;
  }
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.search-input-wrap {
  position: relative;
  flex: 1;
  max-width: 320px;

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
  }
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 38px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  padding: 6px 14px;
  border: 0;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  &--active {
    background: #4f46e5;
    color: white;
  }
}

.data-card,
.empty-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: visible;
}

.empty-card {
  padding: 32px;
  color: #64748b;
  text-align: center;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 14px;
}

th {
  color: #64748b;
  background: #f8fafc;
  font-weight: 700;
}

.name-cell {
  font-weight: 700;
  color: #0f172a;
}

.subject-tag,
.exam-type-tag,
.paper-type-tag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 12px;
}

.subject-tag {
  background: #eef2ff;
  color: #3730a3;
}

.subject-tag--general {
  background: #f1f5f9;
  color: #475569;
}

.subject-tag--math {
  background: #ecfdf5;
  color: #047857;
}

.subject-tag--advanced {
  background: #eef2ff;
  color: #3730a3;
}

.subject-tag--physics {
  background: #eff6ff;
  color: #1d4ed8;
}

.exam-type-tag {
  background: #ecfeff;
  color: #0e7490;
}

.paper-type-tag {
  background: #f5f3ff;
  color: #5b21b6;
}

.status-btn {
  min-width: 78px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.status-btn--published {
  background: #dcfce7;
  color: #047857;
}

.status-btn--draft {
  background: #f1f5f9;
  color: #475569;
}

.status-btn--review {
  background: #fef3c7;
  color: #b45309;
}

.status-btn--archived {
  background: #e5e7eb;
  color: #374151;
}

.status-dropdown {
  position: absolute;
  z-index: 2;
  margin-top: 8px;
  width: 110px;
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}

.status-option {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.status-option:hover {
  background: #f8fafc;
}

.action-link {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 700;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 1;
  background: transparent;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .section-header,
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .data-card {
    overflow-x: auto;
  }
}
</style>
