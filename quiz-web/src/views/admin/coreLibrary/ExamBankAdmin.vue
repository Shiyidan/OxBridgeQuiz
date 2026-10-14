<!-- 真题库管理页：按考试类型和年份浏览套卷，维护发布状态、访问级别和内容入口。 -->
<template>
  <div class="exam-bank-page">
    <div class="page-body">
      <div class="section-header">
        <div class="header-text">
          <h2 class="section-title">真题库管理</h2>
          <p class="section-desc">按年份统一管理各科真题，学生选择科目后组成诊断测试。</p>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="handleManualImport">导入年度试卷</el-button>
        </div>
      </div>

      <el-tabs
        class="exam-tabs"
        :model-value="activeExamType"
        @update:model-value="handleExamChange"
      >
        <el-tab-pane
          v-for="exam in examTabs"
          :key="exam.value"
          :label="exam.label"
          :name="exam.value"
        />
      </el-tabs>

      <div class="collection-header">
        <div>
          <el-button v-if="selectedYear" class="back-years" text @click="backToYears">
            <el-icon><ArrowLeft /></el-icon>全部年份
          </el-button>
          <h3>{{ selectedYear ? `${selectedYear} 年试卷` : `${activeExamType} 历年真题` }}</h3>
          <p>
            {{
              selectedYear
                ? '按科目查看题目与解析，年度统一维护发布状态和访问级别。'
                : '选择年份，查看 ESAT 五科或 TMUA 两卷。'
            }}
          </p>
        </div>
        <span v-if="!loading && !loadError" class="collection-count">
          共 {{ pagination.total }} {{ selectedYear ? '个年度题库' : '个年份' }}
        </span>
      </div>

      <el-alert
        v-if="loadError"
        :title="loadError"
        type="error"
        :closable="false"
        show-icon
        class="load-error"
      >
        <el-button text type="primary" @click="fetchPapers">重新加载</el-button>
      </el-alert>

      <template v-else-if="!selectedYear">
        <el-skeleton v-if="loading" :rows="5" animated class="year-skeleton" />
        <el-empty
          v-else-if="!yearList.length"
          :description="`暂无 ${activeExamType} 真题，请先录入试卷`"
        />
        <div v-else class="year-grid">
          <router-link
            v-for="item in yearList"
            :key="item.year"
            class="year-card"
            :to="{ path: route.path, query: { examType: activeExamType, year: item.year } }"
            :aria-label="`查看 ${activeExamType} ${item.year} 年的 ${item.paperCount} 套试卷`"
          >
            <div class="year-card__heading">
              <span class="year-card__year">{{ item.year }}<small>年</small></span>
              <el-icon class="year-card__icon"><FolderOpened /></el-icon>
            </div>
            <p class="year-card__count">
              {{ activeExamType === 'ESAT' ? '五科年度题库' : 'Paper 1 + Paper 2' }}
            </p>
            <div class="year-card__access">
              <span
                v-if="item.accessTierCounts[PAPER_ACCESS_TIER.FREE]"
                class="year-card__badge year-card__badge--free"
                >免费<span v-if="item.paperCount > 1">
                  {{ item.accessTierCounts[PAPER_ACCESS_TIER.FREE] }}</span
                ></span
              >
              <span
                v-if="item.accessTierCounts[PAPER_ACCESS_TIER.MEMBER]"
                class="year-card__badge year-card__badge--member"
                >会员<span v-if="item.paperCount > 1">
                  {{ item.accessTierCounts[PAPER_ACCESS_TIER.MEMBER] }}</span
                ></span
              >
            </div>
            <div class="year-card__footer">
              查看科目<el-icon><ArrowRight /></el-icon>
            </div>
          </router-link>
        </div>
        <AppPagination
          v-if="!loading"
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </template>

      <div v-else class="annual-table-panel">
        <el-config-provider :locale="zhCn">
          <AdminDataTable
            v-model:page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :data="paperList"
            :loading="loading"
            :total="pagination.total"
            :empty-text="`${activeExamType} ${selectedYear} 年暂无试卷，请先录入试卷`"
            show-pagination
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          >
            <el-table-column
              prop="title"
              label="年度题库"
              min-width="300"
              class-name="annual-title-column"
              align="left"
              header-align="left"
            >
              <template #default="{ row }">
                <div class="annual-title-cell">
                  <el-icon class="annual-title-icon" aria-hidden="true"><Document /></el-icon>
                  <div class="annual-title-text">
                    <span class="cell-name">{{ row.title }}</span>
                    <span v-if="row.modules?.length" class="cell-description"
                      >{{ row.modules.length }} 个科目</span
                    >
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="140" align="center" header-align="center">
              <template #default="{ row }">
                <el-dropdown trigger="click" @command="handleStatusCommand(row.id, $event)">
                  <button class="status-btn" :class="`status-btn--${row.status}`" type="button">
                    {{ statusLabel(row.status) }}
                    <el-icon aria-hidden="true"><ArrowDown /></el-icon>
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
            <el-table-column label="访问级别" width="140" align="center" header-align="center">
              <template #default="{ row }">
                <el-dropdown trigger="click" @command="handleAccessTierCommand(row.id, $event)">
                  <button
                    class="access-tier-btn"
                    :class="`access-tier-btn--${row.accessTier}`"
                    type="button"
                  >
                    {{ accessTierLabel(row.accessTier) }}
                    <el-icon aria-hidden="true"><ArrowDown /></el-icon>
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
            <el-table-column label="题目数量" width="120" align="center" header-align="center">
              <template #default="{ row }"
                ><span class="question-count">{{ row.totalQuestions }}</span
                ><span class="question-unit">题</span></template
              >
            </el-table-column>
            <el-table-column
              label="操作"
              width="280"
              fixed="right"
              align="center"
              header-align="center"
            >
              <template #default="{ row }">
                <div class="action-group">
                  <router-link
                    :to="{
                      path: `/admin/core-library/exams/${row.id}`,
                      query: { examType: activeExamType, year: selectedYear },
                    }"
                    class="table-action-link"
                  >
                    管理内容
                  </router-link>
                  <AppButton
                    type="text"
                    size="small"
                    :loading="exportingPaperId === row.id"
                    @click="handleExport(row)"
                    >导出</AppButton
                  >
                  <AppButton
                    class="delete-action"
                    type="text"
                    size="small"
                    :loading="deletingPaperId === row.id"
                    @click="handleDeletePaper(row)"
                  >
                    {{ deletingPaperId === row.id ? '删除中' : '删除' }}
                  </AppButton>
                </div>
              </template>
            </el-table-column>
          </AdminDataTable>
        </el-config-provider>
      </div>
      <template v-if="selectedYear && !loading && !loadError">
        <section v-for="paper in paperList" :key="paper.id" class="annual-modules">
          <h3>科目内容</h3>
          <div class="module-grid">
            <router-link
              v-for="module in orderedModules(paper.modules || [])"
              :key="module.code"
              class="module-card"
              :to="{
                path: `/admin/core-library/exams/${paper.id}`,
                query: { examType: activeExamType, year: selectedYear, moduleCode: module.code },
              }"
            >
              <strong>{{ moduleLabel(module) }}</strong>
              <span>{{ module.questionCount }} 题 · {{ module.durationSeconds / 60 }} 分钟</span>
              <span class="module-card__link"
                >查看题目与解析 <el-icon><ArrowRight /></el-icon
              ></span>
            </router-link>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
// 真题库列表：套卷管理、发布状态和预览入口。
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import AppPagination from '@/components/AppPagination.vue'
import AppButton from '@/components/AppButton.vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ArrowDown, ArrowLeft, ArrowRight, Document, FolderOpened } from '@element-plus/icons-vue'
import { EXAM_TYPE_OPTIONS } from '@/constants/examTypes'
import { getApiErrorMessage } from '@/utils/request'
import {
  deletePaper,
  getPaperListData,
  getAdminPaperYears,
  getDiagnosticPaperDocument,
  updatePaperAccessTier,
  updatePaperStatus,
  type PaperItem,
  type PaperModuleOutline,
  type AdminPaperYear,
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
const exportingPaperId = ref<string | null>(null)
const paperList = ref<PaperItem[]>([])
const yearList = ref<AdminPaperYear[]>([])
const loadError = ref('')
let requestSequence = 0
const examTabs = EXAM_TYPE_OPTIONS.filter((exam) => exam.value === 'ESAT' || exam.value === 'TMUA')
// 地址保存考试上下文，直接访问未指定类型的真题库时默认展示 ESAT。
const activeExamType = computed<'ESAT' | 'TMUA'>(() =>
  route.query.examType === 'TMUA' ? 'TMUA' : 'ESAT',
)
// 仅合法四位年份进入当年列表，异常地址回到年份导航。
const selectedYear = computed<number | null>(() => {
  const value = String(route.query.year || '')
  const year = Number(value)
  return /^\d{4}$/.test(value) && year >= 2000 && year <= 2100 ? year : null
})
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

// 后台列表始终按考试定义顺序展示模块，避免依赖接口数组的偶然顺序。
function orderedModules(modules: PaperModuleOutline[]): PaperModuleOutline[] {
  return [...modules].sort((left, right) => left.order - right.order)
}

// 数学模块与 TMUA 分卷使用简洁展示名，内部代码继续保持不变。
function moduleLabel(module: PaperModuleOutline): string {
  const normalizedCode = String(module.code || '').toLowerCase()
  if (normalizedCode === 'maths1') return 'Math 1'
  if (normalizedCode === 'maths2') return 'Math 2'
  if (normalizedCode === 'paper1') return 'Paper 1'
  if (normalizedCode === 'paper2') return 'Paper 2'
  return module.subject
}

// 切换考试后从年份开始浏览，不把另一考试的年份筛选带入新列表。
function handleExamChange(value: string | number): void {
  if (value === activeExamType.value || (value !== 'ESAT' && value !== 'TMUA')) return
  void router.push({ path: '/admin/core-library/exams', query: { examType: value } })
}

// 返回当前考试的年份导航，重新读取最新套卷状态汇总。
function backToYears(): void {
  void router.push({ path: '/admin/core-library/exams', query: { examType: activeExamType.value } })
}

// 页面初始化、类型切换及浏览器返回统一根据地址加载对应层级。
watch(
  () => [route.path, activeExamType.value, selectedYear.value],
  () => {
    requestSequence += 1
    if (route.path !== '/admin/core-library/exams') return
    pagination.page = 1
    void fetchPapers()
  },
  { immediate: true },
)

// 年份读取聚合统计，进入年份才查询套卷；忽略切换上下文前发出的旧请求。
async function fetchPapers(): Promise<void> {
  const sequence = ++requestSequence
  const year = selectedYear.value
  loading.value = true
  loadError.value = ''
  paperList.value = []
  yearList.value = []
  pagination.total = 0
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      examType: activeExamType.value,
    }
    if (year === null) {
      const data = await getAdminPaperYears(params)
      if (sequence !== requestSequence) return
      yearList.value = data.list
      Object.assign(pagination, data.pagination)
    } else {
      const data = await getPaperListData({ ...params, year, paperType: PAPER_TYPE.REAL_PAPER })
      if (sequence !== requestSequence) return
      paperList.value = data.list
      Object.assign(pagination, data.pagination)
    }
  } catch (error: unknown) {
    if (sequence !== requestSequence) return
    loadError.value = getApiErrorMessage(error, '真题库加载失败，请稍后重试')
  } finally {
    if (sequence === requestSequence) loading.value = false
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
  router.push({
    path: '/admin/core-library/exams/upload',
    query: { examType: activeExamType.value, year: selectedYear.value || undefined },
  })
}

// 导出统一文档供年度校对及再次导入，浏览器下载后释放临时地址。
async function handleExport(paper: PaperItem): Promise<void> {
  if (exportingPaperId.value) return
  exportingPaperId.value = paper.id
  try {
    const document = await getDiagnosticPaperDocument(paper.id)
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(document, null, 2)], { type: 'application/json;charset=utf-8' }),
    )
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = `${paper.examType}_${paper.year}_年度试卷.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch {
    // 请求层统一显示下载失败原因，保持当前年份和科目内容可操作。
  } finally {
    exportingPaperId.value = null
  }
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
.annual-modules {
  margin: 24px 0;
}
.annual-modules h3 {
  color: var(--color-ink);
  font-size: 18px;
}
.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
}
.module-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  color: var(--color-ink);
  text-decoration: none;
}
.module-card:hover,
.module-card:focus-visible {
  border-color: var(--color-ink-muted);
  background: var(--color-hover);
}
.module-card > span {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}
.module-card__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.exam-bank-page {
  // 当前分页全部展开，由后台主内容区滚动到分页器。

  height: auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.page-body {
  flex: none;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 40px 10px;
  overflow: visible;
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

.exam-tabs {
  margin-top: 14px;

  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
  :deep(.el-tabs__item) {
    height: 52px;
    font-size: 16px;
    font-weight: var(--weight-semi);
  }
  :deep(.el-tabs__content) {
    display: none;
  }
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin: 28px 0 20px;

  h3 {
    margin: 0;
    color: var(--color-ink);
    font-size: 20px;
    font-weight: var(--weight-semi);
  }
  p {
    margin: 8px 0 0;
    color: var(--color-ink-muted);
    font-size: var(--text-sm);
  }
}

.back-years {
  margin: 0 0 12px -12px;
  color: var(--color-ink-muted);

  .el-icon {
    margin-right: 6px;
  }
}

.collection-count {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  white-space: nowrap;
}

.year-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(245px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.year-card {
  display: flex;
  flex-direction: column;
  padding: 24px 24px 0;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  color: var(--color-ink);
  text-decoration: none;
  transition:
    border-color var(--duration-base),
    box-shadow var(--duration-base);

  &:hover,
  &:focus-visible {
    border-color: var(--color-ink-muted);
    box-shadow: var(--shadow-sm);
  }

  &:focus-visible {
    outline: 2px solid var(--color-ink);
    outline-offset: 3px;
  }
}

.year-card__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.year-card__year {
  font-size: 32px;
  line-height: 1.2;
  font-weight: var(--weight-semi);
  font-variant-numeric: tabular-nums;

  small {
    margin-left: 8px;
    font-size: var(--text-sm);
    font-weight: normal;
    color: var(--color-ink-muted);
  }
}

.year-card__icon {
  padding: 10px;
  border-radius: var(--radius-lg);
  background: var(--color-hover);
  color: var(--color-ink-muted);
  font-size: 22px;
  box-sizing: content-box;
}

.year-card__count {
  margin: 18px 0 12px;
  font-size: var(--text-sm);
}

.year-card__access {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-bottom: 22px;
  color: var(--color-ink-muted);
  font-size: 12px;
  line-height: 20px;
}

.year-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border: 1px solid transparent;
  border-radius: 5px;
  font-size: 14px;
  font-weight: var(--weight-semi);
}

.year-card__badge--free {
  border-color: #059669;
  background: #059669;
  color: #ffffff;
}

.year-card__badge--member {
  border-color: #f59e0b;
  background: #f59e0b;
  color: #422006;
}

.year-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding: 16px 0;
  border-top: 1px solid var(--color-line-soft);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.year-skeleton {
  padding: 24px 0 40px;
}
.load-error {
  margin-bottom: 24px;
}

.cell-name {
  color: var(--color-ink);
  font-weight: var(--weight-semi);
}

.annual-table-panel {
  min-width: 0;

  :deep(.admin-data-table__wrap) {
    border-radius: 10px;
  }

  :deep(.admin-data-table__table .el-table__cell) {
    padding: 18px 0;
  }

  :deep(.admin-data-table__table .el-table__cell > .cell) {
    padding: 0 14px;
  }

  :deep(.admin-data-table__table th.el-table__cell) {
    padding: 14px 0;
    background: #f6f8fb;
    color: var(--color-ink-muted);
    font-size: 13px;
  }

  :deep(.admin-data-table__table .annual-title-column > .cell) {
    padding-left: 24px;
    text-align: left;
  }

  :deep(.admin-data-table__pagination) {
    margin-top: 16px;
    background: transparent;
  }
}

.annual-title-cell {
  display: flex;
  align-items: center;
  gap: 14px;
}

.annual-title-icon {
  flex: 0 0 40px;
  height: 40px;
  border: 1px solid var(--color-line-soft);
  border-radius: 8px;
  background: #f6f8fb;
  color: #64748b;
  font-size: 20px;
}

.annual-title-text {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  line-height: 1.5;

  .cell-name {
    font-size: 15px;
    overflow-wrap: anywhere;
  }
}

.cell-description,
.question-unit {
  font-size: 12px;
  color: var(--color-ink-muted);
}

.question-count {
  font-size: 16px;
  font-weight: var(--weight-semi);
  font-variant-numeric: tabular-nums;
}

.question-unit {
  margin-left: 6px;
}

.empty-modules {
  color: #94a3b8;
}

.subject-module-tags {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.subject-module-tag {
  flex: 0 0 auto;
  border-radius: var(--radius-pill);
  font-weight: var(--weight-semi);
  white-space: nowrap;
}

.subject-module-tag :deep(.el-tag__content) {
  white-space: nowrap;
}

.subject-module-tag--general {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  color: #475569 !important;
}

.subject-module-tag--maths1 {
  background: #ecfeff !important;
  border-color: #a5f3fc !important;
  color: #0e7490 !important;
}

.subject-module-tag--maths2 {
  background: #f5f3ff !important;
  border-color: #ddd6fe !important;
  color: #6d28d9 !important;
}

.subject-module-tag--physics {
  background: #eff6ff !important;
  border-color: #bfdbfe !important;
  color: #1d4ed8 !important;
}

.subject-module-tag--chemistry {
  background: #fff7ed !important;
  border-color: #fed7aa !important;
  color: #c2410c !important;
}

.subject-module-tag--biology {
  background: #f0fdf4 !important;
  border-color: #bbf7d0 !important;
  color: #15803d !important;
}

.subject-module-tag--paper1 {
  background: #eef2ff !important;
  border-color: #c7d2fe !important;
  color: #4338ca !important;
}

.subject-module-tag--paper2 {
  background: #fdf4ff !important;
  border-color: #f0abfc !important;
  color: #a21caf !important;
}

.status-btn,
.access-tier-btn,
.table-action-link {
  box-sizing: border-box;
  min-width: 88px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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
  gap: 8px;
  white-space: nowrap;
}

.status-btn .el-icon,
.access-tier-btn .el-icon {
  font-size: 12px;
}

.status-btn:focus-visible,
.access-tier-btn:focus-visible {
  outline: 2px solid var(--color-ink);
  outline-offset: 3px;
}

.action-group :deep(.delete-action.app-button) {
  color: #dc2626;
}

.action-group :deep(.delete-action.app-button:hover:not(:disabled)) {
  color: #b91c1c;
  background: #fef2f2;
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
  border: 1px solid var(--color-line);
  background: var(--color-surface);
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
@media (max-width: 860px) {
  .page-body {
    flex: none;
    padding: 20px 16px;
  }
}
</style>
