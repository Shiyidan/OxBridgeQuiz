<!-- 模考试卷库：上传固定组卷清单、查看逐题校验结果并在草稿中替换问题题目。 -->
<template>
  <div class="mock-library-page">
    <header class="page-header">
      <div>
        <router-link class="back-link" to="/admin/core-library">← 返回专业资料库</router-link>
        <h1>模考试卷库</h1>
        <p>从试题库题号组成固定 ESAT / TMUA 模考卷，校验通过后再进入发布流程。</p>
      </div>
      <el-button type="primary" size="large" @click="openImportDialog">
        <el-icon><UploadFilled /></el-icon>
        上传组卷 Excel
      </el-button>
    </header>

    <section class="workflow-strip" aria-label="组卷流程">
      <div v-for="(step, index) in workflowSteps" :key="step.title" class="workflow-step">
        <span class="step-index">{{ index + 1 }}</span>
        <div>
          <strong>{{ step.title }}</strong>
          <small>{{ step.desc }}</small>
        </div>
      </div>
    </section>

    <section class="list-panel">
      <div class="toolbar">
        <div class="filters">
          <el-input
            v-model="filters.keyword"
            clearable
            placeholder="搜索套卷名称或编号"
            class="keyword-input"
            @keyup.enter="applyFilters"
          />
          <el-select v-model="filters.examType" clearable placeholder="全部考试" class="filter-select">
            <el-option label="ESAT" value="ESAT" />
            <el-option label="TMUA" value="TMUA" />
          </el-select>
          <el-select v-model="filters.status" clearable placeholder="全部状态" class="filter-select">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已下线" value="archived" />
          </el-select>
          <el-button @click="applyFilters">查询</el-button>
          <el-button text @click="resetFilters">重置</el-button>
        </div>
        <span class="list-total">共 {{ pagination.total }} 套</span>
      </div>

      <el-table v-loading="loading" :data="rows" row-key="id" class="paper-table">
        <el-table-column label="套卷" min-width="230">
          <template #default="{ row }">
            <button class="paper-link" type="button" @click="openDetail(row.id)">
              <strong>{{ row.title }}</strong>
              <span>{{ row.code }} · V{{ row.version }}</span>
            </button>
          </template>
        </el-table-column>
        <el-table-column prop="examType" label="考试" width="86" />
        <el-table-column label="结构" min-width="130">
          <template #default="{ row }">
            {{ row.moduleCount }} 个模块 / {{ row.questionCount }} 题
          </template>
        </el-table-column>
        <el-table-column label="权限" width="96">
          <template #default="{ row }">
            <el-tag :type="row.accessTier === 'free' ? 'success' : 'warning'" effect="plain">
              {{ row.accessTier === 'free' ? '免费卷' : '会员卷' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="校验" min-width="145">
          <template #default="{ row }">
            <div v-if="row.validationStatus === 'valid'" class="validation-ok">
              <el-icon><CircleCheckFilled /></el-icon>
              全部通过
            </div>
            <div v-else class="validation-error">
              <el-icon><WarningFilled /></el-icon>
              {{ row.issueCount }} 项待处理
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="168">
          <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="185" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.id)">检查题目</el-button>
            <el-button
              link
              type="danger"
              :disabled="row.status !== 'draft'"
              @click="confirmDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-state">
            <strong>暂无模考卷</strong>
            <span>上传组卷 Excel 后，系统会从 No.001 开始自动编号并生成草稿。</span>
          </div>
        </template>
      </el-table>

      <AppPagination
        :page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @update:page="changePage"
        @update:page-size="changePageSize"
      />
    </section>

    <el-dialog
      v-model="importDialogVisible"
      title="上传模考组卷清单"
      width="600px"
      :close-on-click-modal="!importing"
      :close-on-press-escape="!importing"
    >
      <div class="import-help">
        <strong>编号自动从各考试现有最大编号继续</strong>
        <p>空库首次上传从 No.001 开始。工作表使用“ESAT01-数学1”或“TMUA01-Paper1”命名。</p>
        <p>每张表前三列依次为“考试类型”“学科”“题号（全局唯一）”，题目顺序按数据行排列。</p>
      </div>
      <el-form label-position="top">
        <el-form-item label="默认权限">
          <el-radio-group v-model="importAccessTier">
            <el-radio-button value="member">会员卷</el-radio-button>
            <el-radio-button value="free">免费卷</el-radio-button>
          </el-radio-group>
          <span class="field-tip">上传后可以逐套修改。</span>
        </el-form-item>
        <el-form-item label="组卷文件">
          <el-upload
            drag
            accept=".xlsx"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleWorkbookChange"
          >
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-copy">
              <strong>{{ selectedFile?.name || '点击或拖拽 .xlsx 文件到此处' }}</strong>
              <span>最大 10 MB；上传后先生成草稿，不会直接发布。</span>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="importing" @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" :disabled="!selectedFile" @click="submitImport">
          上传并检查
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="detailVisible"
      size="92%"
      destroy-on-close
      class="detail-drawer"
      :with-header="false"
    >
      <div v-loading="detailLoading" class="detail-shell">
        <template v-if="detail">
          <header class="detail-header">
            <div>
              <button type="button" class="drawer-close" @click="detailVisible = false">← 返回列表</button>
              <div class="detail-title-row">
                <h2>{{ detail.title }}</h2>
                <el-tag>{{ detail.code }}</el-tag>
                <el-tag :type="detail.validationStatus === 'valid' ? 'success' : 'danger'">
                  {{ detail.validationStatus === 'valid' ? '校验通过' : `${detail.issueCount} 项待处理` }}
                </el-tag>
              </div>
              <p>{{ detail.sourceFileName || '手动创建' }} · {{ detail.questionCount }} 道题</p>
            </div>
            <div class="detail-actions">
              <el-button :loading="validating" @click="refreshValidation">
                <el-icon><Refresh /></el-icon>
                重新校验
              </el-button>
              <el-button
                v-if="detail.status === 'draft'"
                type="primary"
                :loading="publishing"
                :disabled="detail.validationStatus !== 'valid'"
                @click="publishCurrentPaper"
              >
                {{ detail.validationStatus === 'valid' ? '发布到学生端' : '处理完问题后发布' }}
              </el-button>
              <el-button
                v-else-if="detail.status === 'published'"
                type="danger"
                plain
                :loading="archiving"
                @click="archiveCurrentPaper"
              >
                下线套卷
              </el-button>
            </div>
          </header>

          <section class="meta-editor">
            <el-input
              v-model="editForm.title"
              maxlength="255"
              show-word-limit
              :disabled="detail.status !== 'draft'"
            />
            <el-select v-model="editForm.accessTier" :disabled="detail.status === 'archived'">
              <el-option label="会员卷" value="member" />
              <el-option label="免费卷" value="free" />
            </el-select>
            <el-button
              :loading="savingMeta"
              :disabled="detail.status === 'archived' || !editForm.title.trim()"
              @click="saveMetadata"
            >
              保存基本信息
            </el-button>
          </section>

          <el-alert
            v-if="detail.issues.length"
            type="error"
            :closable="false"
            show-icon
            class="set-alert"
          >
            <template #title>{{ detail.issues.join('；') }}</template>
          </el-alert>

          <el-tabs v-model="activeModuleId" class="module-tabs">
            <el-tab-pane v-for="module in detail.modules" :key="module.id" :name="module.id">
              <template #label>
                <span class="module-tab-label">
                  {{ module.label }}
                  <em :class="{ error: module.issueCount > 0 }">
                    {{ module.questionCount }}/{{ module.expectedQuestionCount }}
                  </em>
                </span>
              </template>
              <div v-if="module.issues.length" class="module-issues">
                {{ module.issues.join('；') }}
              </div>
              <el-table :data="module.questions" row-key="id" class="question-table" max-height="610">
                <el-table-column prop="position" label="#" width="58" />
                <el-table-column label="题号" min-width="270">
                  <template #default="{ row }">
                    <code>{{ row.sourceCode || '未填写' }}</code>
                  </template>
                </el-table-column>
                <el-table-column label="题目" min-width="300">
                  <template #default="{ row }">
                    <span v-if="row.question" class="question-title">{{ row.question.title }}</span>
                    <span v-else class="muted">未匹配到题库题目</span>
                  </template>
                </el-table-column>
                <el-table-column label="题库状态" width="110">
                  <template #default="{ row }">
                    <el-tag v-if="row.question" size="small" effect="plain">
                      {{ row.question.status }}
                    </el-tag>
                    <span v-else>—</span>
                  </template>
                </el-table-column>
                <el-table-column label="校验结果" min-width="230">
                  <template #default="{ row }">
                    <span v-if="row.validationStatus === 'valid'" class="validation-ok">通过</span>
                    <span v-else class="row-issues">{{ row.issues.join('；') }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="92" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      link
                      type="primary"
                      :disabled="detail?.status !== 'draft'"
                      @click="openReplaceDialog(row)"
                    >
                      替换
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </template>
      </div>
    </el-drawer>

    <el-dialog v-model="replaceDialogVisible" title="替换题目" width="520px">
      <div v-if="replaceTarget" class="replace-current">
        <span>当前位置</span>
        <strong>第 {{ replaceTarget.position }} 题</strong>
        <code>{{ replaceTarget.sourceCode }}</code>
      </div>
      <el-form label-position="top">
        <el-form-item label="新题号">
          <el-input
            v-model="replacementCode"
            clearable
            maxlength="191"
            placeholder="输入试题库中的全局唯一题号"
            @keyup.enter="submitReplacement"
          />
        </el-form-item>
      </el-form>
      <p class="replace-tip">替换后保留当前题序，并立即重新检查整套试卷。</p>
      <template #footer>
        <el-button :disabled="replacing" @click="replaceDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="replacing"
          :disabled="!replacementCode.trim()"
          @click="submitReplacement"
        >
          确认替换并校验
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import { CircleCheckFilled, Refresh, UploadFilled, WarningFilled } from '@element-plus/icons-vue'
import AppPagination from '@/components/AppPagination.vue'
import {
  archiveMockPaperSet,
  deleteMockPaperSet,
  getMockPaperSetDetail,
  getMockPaperSets,
  importMockPaperWorkbook,
  publishMockPaperSet,
  replaceMockPaperQuestion,
  updateMockPaperSet,
  validateMockPaperSet,
  type MockPaperAccessTier,
  type MockPaperQuestionDetail,
  type MockPaperSetDetail,
  type MockPaperSetListItem,
} from '@/api/mockPaperAdmin'

const workflowSteps = [
  { title: '上传清单', desc: '识别套卷、模块与题序' },
  { title: '全量检查', desc: '核对存在性、状态和结构' },
  { title: '草稿修正', desc: '逐题替换并重新校验' },
  { title: '确认发布', desc: '校验通过后接入正式模考' },
]

const loading = ref(false)
const rows = ref<MockPaperSetListItem[]>([])
const filters = reactive({ keyword: '', examType: '', status: '' })
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const importDialogVisible = ref(false)
const importAccessTier = ref<MockPaperAccessTier>('member')
const selectedFile = ref<File | null>(null)
const importing = ref(false)

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<MockPaperSetDetail | null>(null)
const activeModuleId = ref('')
const editForm = reactive<{ title: string; accessTier: MockPaperAccessTier }>({
  title: '',
  accessTier: 'member',
})
const savingMeta = ref(false)
const validating = ref(false)
const publishing = ref(false)
const archiving = ref(false)

const replaceDialogVisible = ref(false)
const replaceTarget = ref<MockPaperQuestionDetail | null>(null)
const replacementCode = ref('')
const replacing = ref(false)

// 列表请求只采用当前筛选和分页，避免详情刷新干扰管理员定位。
async function loadList(): Promise<void> {
  loading.value = true
  try {
    const result = await getMockPaperSets({
      page: pagination.page,
      pageSize: pagination.pageSize,
      examType: filters.examType,
      status: filters.status,
      keyword: filters.keyword.trim(),
    })
    rows.value = result.list
    pagination.page = result.pagination.page
    pagination.total = result.pagination.total
  } finally {
    loading.value = false
  }
}

// 查询条件变化后从第一页开始，防止旧页码落在新结果范围之外。
function applyFilters(): void {
  pagination.page = 1
  void loadList()
}

// 清空全部条件并恢复默认列表。
function resetFilters(): void {
  filters.keyword = ''
  filters.examType = ''
  filters.status = ''
  pagination.page = 1
  void loadList()
}

// 页码变化直接读取对应服务端分页。
function changePage(page: number): void {
  pagination.page = page
  void loadList()
}

// 分页尺寸变化时回到第一页，避免跳过记录。
function changePageSize(pageSize: number): void {
  pagination.pageSize = pageSize
  pagination.page = 1
  void loadList()
}

// 上传弹窗每次重新打开都清除上次选择，避免误传旧文件。
function openImportDialog(): void {
  selectedFile.value = null
  importAccessTier.value = 'member'
  importDialogVisible.value = true
}

// Element Plus 文件项只接收原始 .xlsx File，真实解析由后端完成。
function handleWorkbookChange(file: UploadFile): void {
  selectedFile.value = file.raw || null
}

// 上传成功后刷新列表并直接打开第一套草稿，便于立即处理缺题。
async function submitImport(): Promise<void> {
  if (!selectedFile.value || importing.value) return
  importing.value = true
  try {
    const result = await importMockPaperWorkbook(selectedFile.value, importAccessTier.value)
    importDialogVisible.value = false
    ElMessage.success(`已生成 ${result.list.length} 套模考草稿`)
    pagination.page = 1
    await loadList()
    if (result.list[0]) await openDetail(result.list[0].id)
  } finally {
    importing.value = false
  }
}

// 详情每次从服务端读取最新逐题校验结果，不复用列表汇总猜测。
async function openDetail(id: string): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const result = await getMockPaperSetDetail(id)
    detail.value = result
    activeModuleId.value = result.modules[0]?.id || ''
    editForm.title = result.title
    editForm.accessTier = result.accessTier
  } finally {
    detailLoading.value = false
  }
}

// 替换和保存完成后同时刷新详情与列表汇总。
async function refreshCurrentDetail(): Promise<void> {
  if (!detail.value) return
  const id = detail.value.id
  const result = await getMockPaperSetDetail(id)
  const previousModule = activeModuleId.value
  detail.value = result
  activeModuleId.value = result.modules.some((module) => module.id === previousModule)
    ? previousModule
    : result.modules[0]?.id || ''
  editForm.title = result.title
  editForm.accessTier = result.accessTier
  await loadList()
}

// 草稿可保存名称和访问级别；已发布卷只同步免费/会员属性，不改变试卷结构。
async function saveMetadata(): Promise<void> {
  if (!detail.value || savingMeta.value) return
  savingMeta.value = true
  try {
    await updateMockPaperSet(detail.value.id, {
      title: editForm.title.trim(),
      accessTier: editForm.accessTier,
    })
    ElMessage.success('基本信息已保存')
    await refreshCurrentDetail()
  } finally {
    savingMeta.value = false
  }
}

// 题库状态变化后由管理员主动触发全量复核。
async function refreshValidation(): Promise<void> {
  if (!detail.value || validating.value) return
  validating.value = true
  try {
    await validateMockPaperSet(detail.value.id)
    await refreshCurrentDetail()
    ElMessage.success('已完成全量校验')
  } finally {
    validating.value = false
  }
}

// 发布前再次由后端执行全量校验，成功后该套卷才会进入学生端目录。
async function publishCurrentPaper(): Promise<void> {
  if (!detail.value || publishing.value || detail.value.validationStatus !== 'valid') return
  try {
    await ElMessageBox.confirm(
      `确定发布“${detail.value.title}”吗？发布后题目和结构将锁定。`,
      '发布模考试卷',
      { type: 'warning', confirmButtonText: '确认发布', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  publishing.value = true
  try {
    await publishMockPaperSet(detail.value.id)
    ElMessage.success('模考试卷已发布到学生端')
    await refreshCurrentDetail()
  } finally {
    publishing.value = false
  }
}

// 下线只关闭新答卷入口，弹窗明确保留既有进度与报告。
async function archiveCurrentPaper(): Promise<void> {
  if (!detail.value || archiving.value || detail.value.status !== 'published') return
  try {
    await ElMessageBox.confirm(
      `下线“${detail.value.title}”后不能新开始，但已有答卷仍可继续和查看报告。`,
      '下线模考试卷',
      { type: 'warning', confirmButtonText: '确认下线', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  archiving.value = true
  try {
    await archiveMockPaperSet(detail.value.id)
    ElMessage.success('模考试卷已下线')
    await refreshCurrentDetail()
  } finally {
    archiving.value = false
  }
}

// 替换弹窗保留原题作为对照，新题号默认留空防止误确认。
function openReplaceDialog(row: MockPaperQuestionDetail): void {
  replaceTarget.value = row
  replacementCode.value = ''
  replaceDialogVisible.value = true
}

// 单题替换成功后返回同一模块和位置查看新的校验结果。
async function submitReplacement(): Promise<void> {
  if (!detail.value || !replaceTarget.value || !replacementCode.value.trim() || replacing.value) {
    return
  }
  replacing.value = true
  try {
    await replaceMockPaperQuestion(
      detail.value.id,
      replaceTarget.value.id,
      replacementCode.value.trim(),
    )
    replaceDialogVisible.value = false
    ElMessage.success('题目已替换并重新校验')
    await refreshCurrentDetail()
  } finally {
    replacing.value = false
  }
}

// 删除草稿前显示套卷名称，确认后只删除该套草稿及其组卷关系。
async function confirmDelete(row: MockPaperSetListItem): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `确定删除“${row.title}”吗？该操作不会删除试题库原题。`,
      '删除模考草稿',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  await deleteMockPaperSet(row.id)
  ElMessage.success('模考草稿已删除')
  if (rows.value.length === 1 && pagination.page > 1) pagination.page -= 1
  await loadList()
}

// 表格统一显示可读的后台状态名称。
function statusLabel(status: string): string {
  if (status === 'published') return '已发布'
  if (status === 'archived') return '已下线'
  return '草稿'
}

// 状态颜色与草稿、发布、下线语义保持一致。
function statusTagType(status: string): 'info' | 'success' | 'warning' {
  if (status === 'published') return 'success'
  if (status === 'archived') return 'warning'
  return 'info'
}

// 后台列表使用固定中国时区格式展示最近修改时间。
function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

onMounted(() => void loadList())
</script>

<style scoped lang="scss">
.mock-library-page {
  min-height: 100%;
  padding: 28px 38px 48px;
  background: #f7f9fc;
  color: #0f172a;
}

.page-header,
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.page-header h1,
.detail-header h2 {
  margin: 10px 0 8px;
  font-size: 28px;
  letter-spacing: -0.03em;
}

.page-header p,
.detail-header p {
  margin: 0;
  color: #64748b;
}

.back-link,
.drawer-close {
  border: 0;
  padding: 0;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
}

.workflow-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  margin: 28px 0 20px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #e2e8f0;
}

.workflow-step {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 78px;
  padding: 16px 20px;
  background: #fff;
}

.step-index {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 800;
}

.workflow-step strong,
.workflow-step small {
  display: block;
}

.workflow-step small {
  margin-top: 4px;
  color: #94a3b8;
}

.list-panel {
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  border-bottom: 1px solid #edf1f5;
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.keyword-input {
  width: 260px;
}

.filter-select {
  width: 126px;
}

.list-total {
  color: #94a3b8;
  font-size: 14px;
}

.paper-table :deep(.el-table__cell) {
  padding: 14px 0;
}

.paper-link {
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 0;
  padding: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.paper-link strong:hover {
  color: #4f46e5;
}

.paper-link span {
  color: #94a3b8;
  font-size: 12px;
}

.validation-ok,
.validation-error {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
}

.validation-ok {
  color: #059669;
}

.validation-error,
.row-issues {
  color: #dc2626;
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 48px 0;
  color: #94a3b8;
}

.empty-state strong {
  color: #475569;
}

.list-panel :deep(.app-pagination) {
  padding: 14px 20px;
  background: #fff;
}

.import-help {
  margin-bottom: 20px;
  padding: 14px 16px;
  border: 1px solid #c7d2fe;
  border-radius: 10px;
  background: #f5f7ff;
}

.import-help p,
.replace-tip {
  margin: 6px 0 0;
  color: #64748b;
  line-height: 1.6;
}

.field-tip {
  margin-left: 12px;
  color: #94a3b8;
  font-size: 13px;
}

.upload-icon {
  margin-bottom: 8px;
  color: #4f46e5;
  font-size: 34px;
}

.upload-copy strong,
.upload-copy span {
  display: block;
}

.upload-copy span {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 13px;
}

.detail-shell {
  min-height: 100%;
  padding: 26px 34px 42px;
  background: #f8fafc;
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-actions,
.meta-editor {
  display: flex;
  align-items: center;
  gap: 10px;
}

.meta-editor {
  margin: 24px 0 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.meta-editor :deep(.el-input) {
  max-width: 420px;
}

.meta-editor :deep(.el-select) {
  width: 130px;
}

.set-alert {
  margin-bottom: 16px;
}

.module-tabs {
  padding: 0 18px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
}

.module-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.module-tab-label em {
  padding: 2px 6px;
  border-radius: 10px;
  background: #ecfdf5;
  color: #059669;
  font-size: 11px;
  font-style: normal;
}

.module-tab-label em.error {
  background: #fef2f2;
  color: #dc2626;
}

.module-issues {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
}

.question-table code,
.replace-current code {
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.question-title {
  display: -webkit-box;
  overflow: hidden;
  color: #475569;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.muted {
  color: #94a3b8;
}

.replace-current {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 6px 12px;
  margin-bottom: 18px;
  padding: 14px;
  border-radius: 10px;
  background: #f8fafc;
}

.replace-current code {
  grid-column: 2;
}

@media (max-width: 1080px) {
  .workflow-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .toolbar,
  .filters {
    align-items: stretch;
    flex-wrap: wrap;
  }
}
</style>
