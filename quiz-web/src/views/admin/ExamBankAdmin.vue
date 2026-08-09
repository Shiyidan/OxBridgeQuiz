<!-- 真题库管理页：维护试卷发布状态、访问级别和内容入口。 -->
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
            <el-tag
              class="exam-type-tag"
              :class="examTypeClass(row.examType)"
              effect="light"
              round
            >
              {{ row.examType || 'TMUA' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="学科/模块" width="240" align="center" header-align="center">
          <template #default="{ row }">
            <SubjectModuleTags v-if="row.modules?.length" :modules="row.modules" />
            <span v-else class="empty-modules">—</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="year"
          label="年份"
          width="100"
          align="center"
          header-align="center"
        />
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
        <el-table-column label="访问级别" width="130" align="center" header-align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="handleAccessTierCommand(row.id, $event)">
              <button
                class="access-tier-btn"
                :class="`access-tier-btn--${row.accessTier}`"
                type="button"
              >
                {{ accessTierLabel(row.accessTier) }}
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-for="item in accessTierOptions"
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
        <el-table-column label="题目数量" width="100" align="center" header-align="center">
          <template #default="{ row }">{{ row.totalQuestions }} 题</template>
        </el-table-column>
        <el-table-column label="建议时长" width="120" align="center" header-align="center">
          <template #default="{ row }">{{ row.duration }} 分钟</template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="190"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <div class="action-group">
              <router-link :to="`/admin/core-library/exams/${row.id}`" class="table-action-link">
                管理内容
              </router-link>
              <button
                class="table-action-link table-action-link--danger"
                type="button"
                :disabled="deletingPaperId === row.id"
                @click="handleDeletePaper(row)"
              >
                {{ deletingPaperId === row.id ? '删除中' : '删除' }}
              </button>
            </div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import SubjectModuleTags from '@/components/SubjectModuleTags.vue'
import {
  deletePaper,
  getPaperListData,
  updatePaperAccessTier,
  updatePaperStatus,
  type PaperItem,
} from '@/api/papers'
import {
  PAPER_ACCESS_TIER,
  PAPER_ACCESS_TIER_OPTIONS,
  PAPER_TYPE,
  type PaperAccessTier,
} from '@/constants/paperTypes'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const deletingPaperId = ref<string | null>(null)
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
const accessTierOptions = PAPER_ACCESS_TIER_OPTIONS

// 考试类型使用稳定样式类，便于在同一列表中快速区分 ESAT 与 TMUA。
function examTypeClass(examType: unknown): string {
  const normalized = String(examType || 'TMUA').toLowerCase()
  return `exam-type-tag--${normalized}`
}

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

// 状态值来自后端枚举，前端统一转为中文展示。
function statusLabel(status: string): string {
  return (
    { draft: '草稿', review: '审核中', published: '已上线', archived: '已归档' }[status] || status
  )
}

// 访问级别在管理端使用明确中文，数据库继续保存稳定英文编码。
function accessTierLabel(accessTier: PaperAccessTier): string {
  return accessTier === PAPER_ACCESS_TIER.FREE ? '免费卷' : '会员卷'
}

// 状态更新成功后再改本地列表，避免接口失败时提前展示错误状态。
async function changeStatus(id: string, newStatus: string): Promise<void> {
  try {
    await updatePaperStatus(id, newStatus)
    const item = paperList.value.find((paper) => paper.id === id)
    if (item) item.status = newStatus
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  }
}

// Element 下拉菜单只返回 command，这里补上当前行 id 后再复用状态更新逻辑。
function handleStatusCommand(id: string, command: unknown): void {
  void changeStatus(id, String(command))
}

// 访问级别保存成功后同步当前列表行，确保筛选与标签立即反映最新设置。
async function handleAccessTierCommand(id: string, command: unknown): Promise<void> {
  const accessTier = String(command) as PaperAccessTier
  if (!Object.values(PAPER_ACCESS_TIER).includes(accessTier)) return
  try {
    await updatePaperAccessTier(id, accessTier)
    const item = paperList.value.find((paper) => paper.id === id)
    if (item) item.accessTier = accessTier
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  }
}

// 录入入口复用真题库上传解析流程，上传时默认写入真题卷来源。
function handleManualImport(): void {
  router.push('/admin/core-library/exams/upload')
}

// 删除操作先进行不可逆确认，成功后重新读取数据库列表并修正空页分页。
async function handleDeletePaper(paper: PaperItem): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确认删除试卷“${paper.title}”吗？删除后试卷及其题目不可恢复。已有学生诊断记录的试卷不能删除，只能归档。`,
      '删除试卷',
      {
        type: 'warning',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }

  deletingPaperId.value = paper.id
  try {
    const result = await deletePaper(paper.id)
    ElMessage.success(`试卷已删除，同时清理 ${result.deletedQuestions} 道题目`)
    if (paperList.value.length === 1 && pagination.page > 1) pagination.page -= 1
    await fetchPapers()
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    deletingPaperId.value = null
  }
}

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

.exam-type-tag {
  border-radius: var(--radius-pill);
  font-weight: var(--weight-semi);
}

.exam-type-tag--esat {
  background: #ecfeff !important;
  border-color: #a5f3fc !important;
  color: #0e7490 !important;
}

.exam-type-tag--tmua {
  background: #f5f3ff !important;
  border-color: #ddd6fe !important;
  color: #6d28d9 !important;
}

.empty-modules {
  color: #94a3b8;
}

.status-btn,
.access-tier-btn,
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

.action-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.status-btn {
  border: 1px solid transparent;
}

.access-tier-btn {
  border: 1px solid var(--color-line);
}

.access-tier-btn--free {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.access-tier-btn--member {
  border-color: #d4d4d8;
  background: #f4f4f5;
  color: #3f3f46;
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
  border: 0;
  background: transparent;
  color: var(--color-ink);
  text-decoration: none;
  transition:
    background var(--duration-base) ease,
    border-color var(--duration-base) ease,
    color var(--duration-base) ease;
}

.table-action-link--danger {
  color: #dc2626;
}

.table-action-link:disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.table-action-link:hover,
.table-action-link:focus-visible {
  background: var(--color-hover);
  color: var(--color-ink);
}

.table-action-link--danger:not(:disabled):hover,
.table-action-link--danger:not(:disabled):focus-visible {
  background: #fef2f2;
  color: #b91c1c;
}
</style>
