<template>
  <div class="exam-bank-page">
    <div class="page-body">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">真题库管理</h2>
          <p class="section-desc">管理已录入的历年真题套卷，发布后会进入诊断测试供学生全真模拟。</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="handleManualImport">试卷录入</el-button>
        </div>
      </div>

      <AdminDataTable
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :data="paperList"
        :loading="loading"
        :total="pagination.total"
        empty-text="暂无真题套卷，请点击“试卷解析录入”上传试卷"
        max-height="var(--exam-table-max-height)"
        show-pagination
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <el-table-column
          prop="title"
          label="套卷名称"
          min-width="220"
          align="center"
          header-align="center"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span class="cell-name">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="考试类型" width="120" align="center" header-align="center">
          <template #default="{ row }">
            <el-tag class="exam-type-tag" effect="light" round>{{ row.examType || 'TMUA' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="学科/模块" width="140" align="center" header-align="center">
          <template #default="{ row }">
            <el-tag
              class="subject-tag"
              :class="`subject-tag--${subjectType(row.code)}`"
              effect="light"
              round
            >
              {{ subjectLabel(row.code) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="year"
          label="年份"
          width="100"
          align="center"
          header-align="center"
        />
        <el-table-column label="建议时长" width="120" align="center" header-align="center">
          <template #default="{ row }">{{ row.duration }} 分钟</template>
        </el-table-column>
        <el-table-column label="题目数量" width="120" align="center" header-align="center">
          <template #default="{ row }">{{ row.totalQuestions }} 题</template>
        </el-table-column>
        <el-table-column label="状态" width="140" align="center" header-align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="handleStatusCommand(row.id, $event)">
              <button class="status-btn" :class="`status-btn--${row.status}`" type="button">
                {{ statusLabel(row.status) }}
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="item in statusOptions"
                    :key="item.value"
                    :command="item.value"
                  >
                    {{ item.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="140"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <router-link :to="`/admin/core-library/exams/${row.id}`" class="table-action-link">
              管理内容
            </router-link>
          </template>
        </el-table-column>
      </AdminDataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
// 真题库列表：套卷管理、发布状态和预览入口。
import { reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import { getPaperListData, updatePaperStatus, type PaperItem } from '@/api/papers'
import { PAPER_TYPE } from '@/constants/paperTypes'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const paperList = ref<PaperItem[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'review', label: '审核中' },
  { value: 'published', label: '已上线' },
  { value: 'archived', label: '已归档' },
]

// 每次回到真题库列表时重新获取数据，保证上传或编辑后的状态可见。
watch(
  () => route.path,
  (path) => {
    if (path === '/admin/core-library/exams') void fetchPapers()
  },
  { immediate: true },
)

// 真题库列表只展示真题卷来源，避免题库和模考来源混入后台真题管理。
async function fetchPapers(): Promise<void> {
  loading.value = true
  try {
    const data = await getPaperListData({
      page: pagination.page,
      pageSize: pagination.pageSize,
      paperType: PAPER_TYPE.REAL_PAPER,
    })
    paperList.value = data.list || []
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
  } catch {
    paperList.value = []
    pagination.total = 0
    ElMessage.error('真题套卷加载失败')
  } finally {
    loading.value = false
  }
}

// 真题库分页切换时只更新分页条件，并重新读取当前页数据。
async function handlePageChange(page: number): Promise<void> {
  pagination.page = page
  await fetchPapers()
}

// 修改每页数量后回到第一页，避免请求到不存在的页码。
async function handlePageSizeChange(pageSize: number): Promise<void> {
  pagination.pageSize = pageSize
  pagination.page = 1
  await fetchPapers()
}

// 后台列表用试卷 code 推断学科展示名，空 code 展示为通用。
function subjectLabel(code: string | null): string {
  return code || '通用'
}

// 学科类型只影响标签颜色，不参与业务筛选。
function subjectType(code: string | null): string {
  if (!code) return 'general'
  const text = code.toLowerCase()
  if (text.includes('math')) return 'math'
  if (text.includes('step') || text.includes('esat')) return 'advanced'
  if (text.includes('physics') || text.includes('pat')) return 'physics'
  return 'general'
}

// 状态值来自后端枚举，前端统一转为中文展示。
function statusLabel(status: string): string {
  return (
    { draft: '草稿', review: '审核中', published: '已上线', archived: '已归档' }[status] || status
  )
}

// 状态更新成功后再改本地列表，避免接口失败时提前展示错误状态。
async function changeStatus(id: string, newStatus: string): Promise<void> {
  try {
    await updatePaperStatus(id, newStatus)
    const item = paperList.value.find((paper) => paper.id === id)
    if (item) item.status = newStatus
  } catch {
    ElMessage.error('试卷状态更新失败')
  }
}

// Element 下拉菜单只返回 command，这里补上当前行 id 后再复用状态更新逻辑。
function handleStatusCommand(id: string, command: unknown): void {
  void changeStatus(id, String(command))
}

// 录入入口复用真题库上传解析流程，上传时默认写入真题卷来源。
function handleManualImport(): void {
  router.push('/admin/core-library/exams/upload')
}

// AI 生成入口暂未接入流程，先保留按钮事件避免模板空挂载。
function handleAIGenerate(): void {}
</script>

<style scoped lang="scss">
.exam-bank-page {
  --exam-table-max-height: calc(100vh - var(--nav-height) - 170px);

  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 40px 10px;
  overflow: hidden;
}

.section-header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 10px;
}

.header-text {
  max-width: 620px;
}

.section-title {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0;
}

.section-desc {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  flex-shrink: 0;
  gap: 10px;
}

.cell-name {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.exam-type-tag,
.subject-tag {
  border-radius: var(--radius-pill);
  font-weight: var(--weight-semi);
}

.exam-type-tag {
  background: #ecfeff !important;
  border-color: #a5f3fc !important;
  color: #0e7490 !important;
}

.subject-tag--general {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  color: #475569 !important;
}

.subject-tag--math {
  background: #ecfdf5 !important;
  border-color: #a7f3d0 !important;
  color: #047857 !important;
}

.subject-tag--advanced {
  background: #eef2ff !important;
  border-color: #c7d2fe !important;
  color: #3730a3 !important;
}

.subject-tag--physics {
  background: #eff6ff !important;
  border-color: #bfdbfe !important;
  color: #1d4ed8 !important;
}

.status-btn,
.table-action-link {
  min-width: 72px;
  height: var(--height-button-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
}

.status-btn {
  border: 1px solid transparent;
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

.table-action-link {
  color: var(--color-ink);
  text-decoration: none;
  transition:
    background var(--duration-base) ease,
    border-color var(--duration-base) ease,
    color var(--duration-base) ease;
}

.table-action-link:hover,
.table-action-link:focus-visible {
  background: var(--color-hover);
  color: var(--color-ink);
}
</style>
