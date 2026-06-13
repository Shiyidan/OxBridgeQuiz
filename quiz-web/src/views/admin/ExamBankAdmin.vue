<template>
  <div class="exam-bank-page">
    <!-- 顶部返回 -->
    <div class="page-top-bar">
      <button class="back-btn" @click="$router.push('/admin/core-library')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回 ESAT 资料库
      </button>
    </div>

    <div class="page-body">
      <!-- 标题栏 -->
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">真题库管理</h2>
          <p class="section-desc">正在管理 ESAT 的整套历年真题。</p>
        </div>
        <div class="header-actions">
          <button class="btn-ghost-action" @click="handleManualImport">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            试卷解析录入
          </button>
          <button class="btn-primary-action" @click="handleAIGenerate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            试卷AI生成
          </button>
        </div>
      </div>

      <!-- 数据表格 -->
      <div v-if="loading" class="empty-card">加载中...</div>

      <div class="data-card" v-else-if="paperList.length">
        <table class="data-table">
          <thead>
            <tr>
              <th>套卷名称</th>
              <th>学科/模块</th>
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
              <td><span :class="`subject-tag subject-tag--${subjectType(paper.code)}`">{{ subjectLabel(paper.code) }}</span></td>
              <td>{{ paper.year }}</td>
              <td>{{ paper.duration }} 分钟</td>
              <td>{{ paper.totalQuestions }} 题</td>
              <td>
                <button
                  class="status-btn"
                  :class="`status-btn--${paper.status}`"
                  @click="toggleStatusMenu(paper.id)"
                >
                  {{ statusLabel(paper.status) }}
                  <svg v-if="paper.status === 'draft'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <!-- 状态下拉菜单 -->
                <Transition name="fade">
                  <div v-if="activeStatusMenu === paper.id" class="status-dropdown" @click.stop>
                    <button
                      v-for="s in statusOptions"
                      :key="s.value"
                      class="status-option"
                      @click="changeStatus(paper.id, s.value)"
                    >
                      {{ s.label }}
                    </button>
                  </div>
                </Transition>
              </td>
              <td>
                <router-link :to="`/admin/core-library/exams/${paper.id}`" class="action-link">管理内容</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-card" v-else>暂无真题套卷，请点击「试卷解析录入」上传试卷</div>
    </div>

    <!-- 点击外部关闭状态菜单 -->
    <div v-if="activeStatusMenu !== null" class="menu-overlay" @click="activeStatusMenu = null"></div>
  </div>
</template>

<script setup lang="ts">
// 真题库列表（套卷管理 + 状态下拉 + 上传/预览入口）
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getPaperListData, updatePaperStatus } from '@/api/papers'

const route = useRoute()
const router = useRouter()

interface PaperItem {
  id: string
  title: string
  code: string | null
  year: number
  duration: number
  totalQuestions: number
  status: string
  createdAt: string
}

const loading = ref(true)
const activeStatusMenu = ref<string | null>(null)
const paperList = ref<PaperItem[]>([])

// 每次路由进入此列表页时重新获取数据
watch(() => route.path, (path) => {
  if (path === '/admin/core-library/exams') fetchPapers()
}, { immediate: true })

async function fetchPapers(): Promise<void> {
  loading.value = true
  try {
    const papers = (await getPaperListData()).papers || []
    paperList.value = papers.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

function subjectLabel(code: string | null): string {
  const map: Record<string, string> = {
    'engaa': 'ENGAA',
    'nsaa': 'NSAA',
    'tmua': 'TMUA',
    'pat': 'PAT',
    'esat': 'ESAT',
  }
  return code ? (map[code.toLowerCase()] || '通用') : '通用'
}

function subjectType(code: string | null): string {
  if (!code) return 'general'
  const t = code.toLowerCase()
  if (t.includes('math')) return 'math'
  if (t.includes('engaa') || t.includes('nsaa')) return 'advanced'
  if (t.includes('physics') || t.includes('pat')) return 'physics'
  return 'general'
}

function statusLabel(status: string): string {
  return { draft: '草稿', review: '审核中', published: '已上线', archived: '已归档' }[status] || status
}

function toggleStatusMenu(id: string): void {
  activeStatusMenu.value = activeStatusMenu.value === id ? null : id
}

async function changeStatus(id: string, newStatus: string): Promise<void> {
  try {
    await updatePaperStatus(id, newStatus)
    // 接口成功后前端状态才更新
    const item = paperList.value.find(p => p.id === id)
    if (item) item.status = newStatus
  } catch (e: any) {
    // 401 由 request 拦截器统一处理（alert + 跳转首页）
    if (e?.response?.status === 401) {
      activeStatusMenu.value = null
      return
    }
    // 其他错误：静默忽略，状态不回滚（未变更）
  }
  activeStatusMenu.value = null
}

function handleManualImport(): void {
  router.push('/admin/core-library/exams/upload')
}

function handleAIGenerate(): void {
  // TODO: 打开AI生成试卷弹窗/页面
}
</script>

<style scoped lang="scss">
.exam-bank-page {
  min-height: 100%;
  position: relative;
}

/* ========== 顶部返回 ========== */
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

/* ========== 内容区 ========== */
.page-body {
  padding: 24px 40px 48px;
}

/* ========== 标题栏 ========== */
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.header-text {
  max-width: 480px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
}

.section-desc {
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* 按钮样式 */
.btn-ghost-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: #ffffff;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
}

.btn-primary-action {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover {
    background: #6366f1;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
    transform: translateY(-1px);
  }
}

/* ========== 数据表格 ========== */
.data-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead th {
  background: #f8fafc;
  padding: 14px 24px;
  text-align: left;
  font-weight: 600;
  font-size: 0.8125rem;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  letter-spacing: 0.01em;
}

.data-table tbody td {
  padding: 18px 24px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
  color: #334155;
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: #fafbfc;
}

/* 列样式 */
.name-cell {
  font-weight: 600;
  color: #0f172a;
  font-size: 0.9rem;
}

/* 学科标签 */
.subject-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
}

.subject-tag--math {
  background: #eff6ff;
  color: #2563eb;
}

.subject-tag--advanced {
  background: #fffbeb;
  color: #d97706;
}

.subject-tag--physics {
  background: #ecfdf5;
  color: #059669;
}

.subject-tag--chemistry {
  background: #fdf4ff;
  color: #c026d3;
}

.subject-tag--general {
  background: #f1f5f9;
  color: #64748b;
}

/* 加载/空态 */
.empty-card {
  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;
  padding: 80px 40px; text-align: center; color: #94a3b8; font-size: 0.9rem;
}

/* 状态按钮（可点击展开） */
.status-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;

  svg {
    width: 13px;
    height: 13px;
  }

  &--published {
    background: #ecfdf5;
    color: #059669;
  }

  &--draft {
    background: #fffbeb;
    color: #d97706;
  }

  &--review {
    background: #eff6ff;
    color: #2563eb;
  }

  &--archived {
    background: #f1f5f9;
    color: #94a3b8;
  }

  &:hover {
    opacity: 0.85;
  }
}

/* 状态下拉菜单 */
.status-dropdown {
  position: absolute;
  z-index: 50;
  margin-top: 4px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 6px;
  min-width: 120px;
}

.status-option {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 0.825rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  border-radius: 6px;
  text-align: left;
  transition: all 0.1s ease;

  &:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
}

/* 操作链接 */
.action-link {
  color: #4f46e5;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: color 0.15s;

  &:hover {
    color: #6366f1;
    text-decoration: underline;
  }
}

/* 菜单遮罩层 */
.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
}

/* 下拉动画 */
.fade-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-leave-active {
  transition: opacity 0.1s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.fade-leave-to {
  opacity: 0;
}

/* ========== 响应式 ========== */
@media (max-width: 1024px) {
  .section-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .data-table {
    display: block;
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .page-body {
    padding: 20px 20px 36px;
  }

  .page-top-bar {
    padding: 20px 20px 0;
  }
}
</style>
