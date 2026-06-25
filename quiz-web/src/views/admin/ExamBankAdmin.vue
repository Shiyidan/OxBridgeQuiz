<template>
  <div class="exam-bank-page">
    <div class="page-top-bar">
      <button class="back-btn" type="button" @click="$router.push('/admin/core-library')">
        ← 返回 ESAT 资料库
      </button>
    </div>

    <div class="page-body">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">真题库管理</h2>
          <p class="section-desc">管理已录入的历年真题套卷，发布后会进入诊断测试供学生全真模拟。</p>
        </div>
        <div class="header-actions">
          <button class="btn-ghost-action" type="button" @click="handleManualImport">
            试卷解析录入
          </button>
          <button class="btn-primary-action" type="button" @click="handleAIGenerate">
            试卷 AI 生成
          </button>
        </div>
      </div>

      <div v-if="loading" class="empty-card">加载中...</div>
      <div v-else-if="paperList.length" class="data-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>套卷名称</th>
              <th>考试类型</th>
              <th>学科/模块</th>
              <th>类型</th>
              <th>年份</th>
              <th>建议时长</th>
              <th>题目数量</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="paper in paperList" :key="paper.id">
              <td class="name-cell">{{ paper.title }}</td>
              <td>
                <span class="exam-type-tag">{{ paper.examType || 'TMUA' }}</span>
              </td>
              <td>
                <span :class="`subject-tag subject-tag--${subjectType(paper.code)}`">{{
                  subjectLabel(paper.code)
                }}</span>
              </td>
              <td>
                <select
                  class="type-select"
                  :value="paper.paperType || 'past'"
                  @change="changePaperType(paper.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="past">真题</option>
                  <option value="practice">练习</option>
                  <option value="diagnostic">诊断</option>
                </select>
              </td>
              <td>{{ paper.year }}</td>
              <td>{{ paper.duration }} 分钟</td>
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
                <router-link :to="`/admin/core-library/exams/${paper.id}`" class="action-link"
                  >管理内容</router-link
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-card">暂无真题套卷，请点击“试卷解析录入”上传试卷</div>
    </div>

    <div
      v-if="activeStatusMenu !== null"
      class="menu-overlay"
      @click="activeStatusMenu = null"
    ></div>
  </div>
</template>

<script setup lang="ts">
// 真题库列表：套卷管理、类型标记、发布状态和预览入口。
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPaperListData, updatePaperStatus, updatePaperType, type PaperItem } from '@/api/papers'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const activeStatusMenu = ref<string | null>(null)
const paperList = ref<PaperItem[]>([])

// 每次回到真题库列表时重新获取数据，保证上传或编辑后的状态可见。
watch(
  () => route.path,
  (path) => {
    if (path === '/admin/core-library/exams') fetchPapers()
  },
  { immediate: true },
)

// 真题库列表只展示 past 类型，避免练习虚拟卷混入后台真题管理。
async function fetchPapers(): Promise<void> {
  loading.value = true
  try {
    const papers = (await getPaperListData({ paperType: 'past' })).papers || []
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

// 后台列表用试卷 code 推断学科展示名，兼容历史导入数据的空 code。
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

// 状态更新成功后再改本地列表，避免接口失败时提前展示错误状态。
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

// 类型改出 past 后从当前真题列表移除，和后台筛选条件保持一致。
async function changePaperType(id: string, paperType: string): Promise<void> {
  try {
    await updatePaperType(id, paperType)
    const item = paperList.value.find((p) => p.id === id)
    if (item) item.paperType = paperType
    if (paperType !== 'past') paperList.value = paperList.value.filter((p) => p.id !== id)
  } catch {
    await fetchPapers()
  }
}

// 录入入口复用真题库上传解析流程，上传时默认写入 past 类型。
function handleManualImport(): void {
  router.push('/admin/core-library/exams/upload')
}

// AI 生成入口暂未接入流程，先保留按钮事件避免模板空挂载。
function handleAIGenerate(): void {}
</script>

<style scoped lang="scss">
.exam-bank-page {
  min-height: 100%;
  position: relative;
}
.page-top-bar {
  padding: 28px 40px 0;
}
.back-btn {
  padding: 8px 12px;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-weight: 600;
}
.page-body {
  padding: 24px 40px 48px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}
.section-title {
  margin: 0 0 8px;
  font-size: 24px;
  letter-spacing: 0;
}
.section-desc {
  margin: 0;
  color: #64748b;
}
.header-actions {
  display: flex;
  gap: 12px;
}
.btn-ghost-action,
.btn-primary-action {
  height: 40px;
  padding: 0 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-ghost-action {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #334155;
}
.btn-primary-action {
  border: 0;
  background: #4f46e5;
  color: #fff;
}
.data-card,
.empty-card {
  background: #fff;
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
.subject-tag {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 6px;
  background: #eef2ff;
  color: #3730a3;
  font-weight: 700;
  font-size: 12px;
}
.exam-type-tag {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 6px;
  background: #ecfeff;
  color: #0e7490;
  font-weight: 800;
  font-size: 12px;
}
.type-select {
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
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
  .section-header {
    flex-direction: column;
  }
  .data-card {
    overflow-x: auto;
  }
}
</style>
