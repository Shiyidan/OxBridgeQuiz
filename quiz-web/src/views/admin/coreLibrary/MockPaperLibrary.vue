<!-- 模考试卷库：以试卷封面卡片维护固定组卷清单、逐题校验结果和问题题目替换。 -->
<template>
  <div class="mock-library-page">
    <header class="page-header">
      <div>
        <router-link class="back-link" to="/admin/core-library">← 返回专业资料库</router-link>
        <h1>模考试卷库</h1>
        <p>按 Mock 编号维护 Module / Paper；可用单项与完整模考状态由系统自动判断。</p>
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
            :placeholder="viewMode === 'sets' ? '搜索套卷名称或编号' : '搜索 Module、套卷名称或编号'"
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
        <div class="toolbar-view-switch">
          <span class="list-total">
            共 {{ pagination.total }} {{ viewMode === 'sets' ? '套' : '个单项' }}
          </span>
          <el-radio-group v-model="viewMode" size="small" @change="handleViewModeChange">
            <el-radio-button value="sets">套卷视图</el-radio-button>
            <el-radio-button value="modules">单项视图</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <div
        v-loading="loading"
        class="paper-grid-shell"
        :class="{ 'is-module-view': viewMode === 'modules' }"
      >
        <div v-if="viewMode === 'sets' && rows.length" class="paper-grid">
          <article
            v-for="row in rows"
            :key="row.id"
            class="paper-card"
            :class="[
              `is-${row.examType.toLowerCase()}`,
              `is-${row.status}`,
              { 'is-incomplete': !row.fullExamReady },
            ]"
          >
            <el-badge
              :value="row.accessTier === 'free' ? 'FREE' : 'MEMBER'"
              :type="row.accessTier === 'free' ? 'success' : 'warning'"
              class="cover-access-badge"
            >
              <button
                class="paper-cover"
                type="button"
                :aria-label="`检查 ${row.title} 的题目`"
                @click="openDetail(row.id)"
              >
                <span class="cover-spine" aria-hidden="true"></span>
                <span class="cover-pattern" aria-hidden="true"></span>

                <span class="cover-topline">
                  <span class="cover-status">{{ statusLabel(row.status) }}</span>
                </span>

                <span class="cover-exam">{{ row.examType }}</span>
                <span class="cover-rule" aria-hidden="true"></span>

                <span class="cover-title">{{ coverTitle(row) }}</span>
                <span class="cover-code">{{ row.code }} · VERSION {{ row.version }}</span>

                <span class="cover-metrics">
                  <span>
                    <strong>{{ row.readyModuleCount }}/{{ row.moduleCount }}</strong>
                    <small>单项可用</small>
                  </span>
                  <span>
                    <strong>{{ row.questionCount }}</strong>
                    <small>题目</small>
                  </span>
                </span>

                <span class="cover-readiness" :class="{ 'is-ready': row.fullExamReady }">
                  <el-icon>
                    <CircleCheckFilled v-if="row.fullExamReady" />
                    <WarningFilled v-else />
                  </el-icon>
                  {{ row.fullExamReady ? '完整模考可用' : '完整模考待补齐' }}
                </span>

                <span class="cover-open">打开试卷 <span aria-hidden="true">→</span></span>
              </button>
            </el-badge>

            <footer class="paper-card-footer">
              <span>
                <small>最近更新</small>
                {{ formatDateTime(row.updatedAt) }}
              </span>
              <div class="card-actions">
                <el-button
                  v-if="row.status === 'draft'"
                  link
                  type="danger"
                  @click="confirmDelete(row)"
                >
                  删除
                </el-button>
              </div>
            </footer>
          </article>
        </div>

        <el-table
          v-else-if="viewMode === 'modules' && moduleRows.length"
          :data="moduleRows"
          row-key="id"
          class="module-table"
        >
          <el-table-column label="Module / Paper" min-width="180">
            <template #default="{ row }">
              <div class="module-identity">
                <strong>{{ row.label }}</strong>
                <code>{{ row.code }}</code>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="考试" width="82">
            <template #default="{ row }">{{ row.mockPaperSet.examType }}</template>
          </el-table-column>
          <el-table-column label="试题组成" min-width="180">
            <template #default="{ row }">
              <div class="question-composition">
                <span>
                  <strong>{{ row.questionCount }}/{{ row.expectedQuestionCount }} 题</strong>
                  <small>{{ Math.round(row.durationSeconds / 60) }} 分钟</small>
                </span>
                <el-progress
                  :percentage="moduleQuestionPercentage(row)"
                  :status="row.validationStatus === 'valid' ? 'success' : undefined"
                  :stroke-width="6"
                  :show-text="false"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="形式与所属套卷" min-width="290">
            <template #default="{ row }">
              <div class="module-association">
                <div>
                  <el-tag
                    :type="row.mockPaperSet.fullExamReady ? 'success' : 'warning'"
                    size="small"
                    effect="plain"
                  >
                    {{ row.mockPaperSet.fullExamReady ? '套卷模块' : '单模块' }}
                  </el-tag>
                  <button
                    type="button"
                    class="module-set-link"
                    @click="openDetail(row.mockPaperSet.id, row.id)"
                  >
                    {{ row.mockPaperSet.title }}
                  </button>
                </div>
                <small>
                  {{ row.mockPaperSet.code }} ·
                  {{ row.mockPaperSet.fullExamReady ? '已组成完整套卷' : '当前套卷待补齐' }}
                </small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="校验" min-width="125">
            <template #default="{ row }">
              <span v-if="row.validationStatus === 'valid'" class="validation-ok">
                <el-icon><CircleCheckFilled /></el-icon>
                单项可用
              </span>
              <span v-else class="validation-pending">
                <el-icon><WarningFilled /></el-icon>
                {{ row.issueCount }} 个问题
              </span>
            </template>
          </el-table-column>
          <el-table-column label="套卷状态" width="105">
            <template #default="{ row }">
              <div class="module-set-status">
                <el-tag :type="statusTagType(row.mockPaperSet.status)" size="small">
                  {{ statusLabel(row.mockPaperSet.status) }}
                </el-tag>
                <small>{{ row.mockPaperSet.accessTier === 'free' ? '免费' : '会员' }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="150">
            <template #default="{ row }">{{ formatDateTime(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="92" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openDetail(row.mockPaperSet.id, row.id)">
                查看题目
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-else-if="!loading" class="empty-state">
          <span class="empty-cover" aria-hidden="true">MOCK</span>
          <strong>{{ viewMode === 'sets' ? '暂无模考卷' : '暂无 Module / Paper' }}</strong>
          <span>
            {{
              viewMode === 'sets'
                ? '上传组卷 Excel 后，系统会从 No.001 开始自动编号并生成草稿。'
                : '上传组卷 Excel 后，每个 Module / Paper 会在这里独立展示。'
            }}
          </span>
          <el-button type="primary" plain @click="openImportDialog">上传第一套试卷</el-button>
        </div>
      </div>

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
        <p>无需区分整卷或单项；系统按 Mock 编号归组，并独立判断每个 Module / Paper 是否可用。</p>
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
                <el-tag :type="detail.readyModuleCount > 0 ? 'success' : 'danger'">
                  {{ detail.readyModuleCount }}/{{ detail.modules.length }} 个单项可用
                </el-tag>
                <el-tag :type="detail.fullExamReady ? 'success' : 'warning'">
                  {{ detail.fullExamReady ? '完整模考可用' : '完整模考暂不可用' }}
                </el-tag>
              </div>
              <p>
                {{ detail.sourceFileName || '手动创建' }} · {{ detail.questionCount }} 道题
                <template v-if="detail.issueCount > 0"> · {{ detail.issueCount }} 项待处理</template>
              </p>
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
                :disabled="detail.readyModuleCount === 0"
                @click="publishCurrentPaper"
              >
                {{ detail.readyModuleCount > 0 ? '发布 Mock 内容' : '暂无可发布单项' }}
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

          <section class="readiness-overview" aria-label="Mock 可用性">
            <div>
              <span>单项模考</span>
              <strong>{{ detail.readyModuleCount }}/{{ detail.modules.length }} 可用</strong>
              <small>每个 Module / Paper 独立校验，互不阻塞。</small>
            </div>
            <div :class="{ 'is-pending': !detail.fullExamReady }">
              <span>完整模考</span>
              <strong>{{ detail.fullExamReady ? '可用' : '暂不可用' }}</strong>
              <small>
                {{
                  detail.fullExamReady
                    ? '当前 Mock 已具备全部正式组成部分。'
                    : '补齐并修复全部正式组成部分后自动可用。'
                }}
              </small>
            </div>
          </section>

          <el-alert
            v-if="detail.issues.length"
            type="warning"
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
                  <em :class="{ error: module.validationStatus !== 'valid' }">
                    {{ module.questionCount }}/{{ module.expectedQuestionCount }}
                  </em>
                  <small
                    :class="module.validationStatus === 'valid' ? 'module-ready' : 'module-pending'"
                  >
                    {{ module.validationStatus === 'valid' ? '单项可用' : '待处理' }}
                  </small>
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
                      :disabled="
                        detail?.status === 'archived' ||
                        (detail?.status === 'published' && module.validationStatus === 'valid')
                      "
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
  getMockPaperModules,
  getMockPaperSetDetail,
  getMockPaperSets,
  importMockPaperWorkbook,
  publishMockPaperSet,
  replaceMockPaperQuestion,
  updateMockPaperSet,
  validateMockPaperSet,
  type MockPaperAccessTier,
  type MockPaperModuleListItem,
  type MockPaperQuestionDetail,
  type MockPaperSetDetail,
  type MockPaperSetListItem,
} from '@/api/mockPaperAdmin'

const workflowSteps = [
  { title: '上传清单', desc: '识别套卷、模块与题序' },
  { title: '逐项检查', desc: '每个 Module / Paper 独立校验' },
  { title: '草稿修正', desc: '逐题替换并刷新可用状态' },
  { title: '确认发布', desc: '上架可用单项并派生完整模考' },
]

const loading = ref(false)
const viewMode = ref<'sets' | 'modules'>('sets')
const rows = ref<MockPaperSetListItem[]>([])
const moduleRows = ref<MockPaperModuleListItem[]>([])
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

// 列表按当前展示维度读取套卷或单项分页，避免前端逐套加载 Module 明细。
async function loadList(): Promise<void> {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      examType: filters.examType,
      status: filters.status,
      keyword: filters.keyword.trim(),
    }
    if (viewMode.value === 'modules') {
      const result = await getMockPaperModules(params)
      moduleRows.value = result.list
      rows.value = []
      pagination.page = result.pagination.page
      pagination.total = result.pagination.total
    } else {
      const result = await getMockPaperSets(params)
      rows.value = result.list
      moduleRows.value = []
      pagination.page = result.pagination.page
      pagination.total = result.pagination.total
    }
  } finally {
    loading.value = false
  }
}

// 切换维度后回到第一页，防止套卷总页数与 Module 总页数互相污染。
function handleViewModeChange(): void {
  pagination.page = 1
  void loadList()
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

// 详情每次从服务端读取最新结果；单项视图进入时直接定位目标 Module/Paper。
async function openDetail(id: string, moduleId?: string): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const result = await getMockPaperSetDetail(id)
    detail.value = result
    activeModuleId.value = result.modules.some((module) => module.id === moduleId)
      ? moduleId || ''
      : result.modules[0]?.id || ''
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

// 发布前再次校验全部内容；已通过的单项锁定，待处理单项发布后仍可继续修复。
async function publishCurrentPaper(): Promise<void> {
  if (!detail.value || publishing.value || detail.value.readyModuleCount === 0) return
  const availability = detail.value.fullExamReady
    ? `将发布 ${detail.value.readyModuleCount} 个可用单项，完整模考同时可用。`
    : `将发布 ${detail.value.readyModuleCount} 个可用单项；完整模考暂不可用。`
  try {
    await ElMessageBox.confirm(
      `确定发布“${detail.value.title}”吗？${availability}发布后已通过的单项将锁定，待处理单项仍可继续修复。`,
      '发布 Mock 内容',
      { type: 'warning', confirmButtonText: '确认发布', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  publishing.value = true
  try {
    await publishMockPaperSet(detail.value.id)
    ElMessage.success('Mock 内容已发布')
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

// 试卷封面统一显示可读的后台状态名称。
function statusLabel(status: string): string {
  if (status === 'published') return '已发布'
  if (status === 'archived') return '已下线'
  return '草稿'
}

// 单项表格复用套卷状态色，保证草稿、发布和下线在两种视图中一致。
function statusTagType(status: string): 'info' | 'success' | 'warning' {
  if (status === 'published') return 'success'
  if (status === 'archived') return 'warning'
  return 'info'
}

// 题量进度以正式预期题数为分母，超额题量最多显示为 100%。
function moduleQuestionPercentage(row: MockPaperModuleListItem): number {
  if (row.expectedQuestionCount <= 0) return 0
  return Math.min(100, Math.round((row.questionCount / row.expectedQuestionCount) * 100))
}

// 封面已单独展示考试类型，主标题移除重复前缀以突出“模拟卷 No.xxx”。
function coverTitle(row: MockPaperSetListItem): string {
  const title = row.title.trim()
  const withoutExamType = title.replace(new RegExp(`^${row.examType}\\s*`, 'i'), '').trim()
  return withoutExamType || title
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
  white-space: nowrap;
}

.toolbar-view-switch {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 14px;
}

.paper-grid-shell {
  min-height: 300px;
  padding: 22px 20px 8px;
}

.paper-grid-shell.is-module-view {
  padding: 0;
}

.paper-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 200px));
  gap: 22px 18px;
  justify-content: start;
}

.paper-card {
  min-width: 0;
  --cover-start: #15294e;
  --cover-end: #243f72;
  --cover-accent: #7dd3fc;
  --cover-soft: rgba(125, 211, 252, 0.16);
}

.paper-card.is-tmua {
  --cover-start: #3d1835;
  --cover-end: #6d294f;
  --cover-accent: #f0abfc;
  --cover-soft: rgba(240, 171, 252, 0.14);
}

.paper-cover {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 270px;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid color-mix(in srgb, var(--cover-accent) 38%, transparent);
  border-radius: 4px 13px 13px 4px;
  padding: 15px 14px 13px 25px;
  background:
    radial-gradient(circle at 88% 12%, var(--cover-soft), transparent 32%),
    linear-gradient(145deg, var(--cover-start), var(--cover-end));
  box-shadow:
    0 12px 24px rgba(15, 23, 42, 0.16),
    0 3px 7px rgba(15, 23, 42, 0.13);
  color: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.paper-cover:hover,
.paper-cover:focus-visible {
  transform: translateY(-3px);
  box-shadow:
    0 17px 30px rgba(15, 23, 42, 0.22),
    0 5px 10px rgba(15, 23, 42, 0.13);
}

.paper-cover:focus-visible {
  outline: 3px solid #818cf8;
  outline-offset: 3px;
}

.paper-card.is-incomplete .paper-cover {
  border-color: rgba(251, 191, 36, 0.62);
}

.paper-card.is-archived .paper-cover {
  filter: saturate(0.35);
  opacity: 0.8;
}

.cover-spine {
  position: absolute;
  z-index: 2;
  inset: 0 auto 0 0;
  width: 11px;
  border-right: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(5, 12, 28, 0.32);
  box-shadow: 3px 0 8px rgba(5, 12, 28, 0.2);
}

.cover-pattern {
  position: absolute;
  top: -44px;
  right: -60px;
  width: 180px;
  height: 180px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  box-shadow:
    0 0 0 20px rgba(255, 255, 255, 0.025),
    0 0 0 40px rgba(255, 255, 255, 0.025);
}

.paper-cover > span:not(.cover-spine, .cover-pattern) {
  position: relative;
  z-index: 3;
}

.cover-topline {
  display: flex;
  align-items: center;
  min-height: 19px;
}

.cover-status {
  display: inline-flex;
  align-items: center;
  min-height: 19px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 2px 7px;
  background: rgba(15, 23, 42, 0.22);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.cover-access-badge {
  display: block;
  width: 100%;
}

.cover-access-badge :deep(.el-badge__content) {
  z-index: 6;
  height: 21px;
  min-width: 0;
  border-width: 2px;
  padding: 0 7px;
  box-shadow: 0 3px 9px rgba(15, 23, 42, 0.24);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 17px;
}

.cover-access-badge :deep(.el-badge__content.is-fixed) {
  top: 2px;
  right: 6px;
  transform: translateY(-50%) translateX(25%);
}

.paper-card.is-published .cover-status {
  border-color: rgba(110, 231, 183, 0.4);
  background: rgba(5, 150, 105, 0.3);
}

.paper-card.is-archived .cover-status {
  background: rgba(71, 85, 105, 0.54);
}

.cover-exam {
  margin-top: 23px;
  color: var(--cover-accent);
  font-size: 18px;
  font-weight: 850;
  letter-spacing: 0.12em;
  line-height: 1;
}

.cover-rule {
  width: 30px;
  height: 2px;
  margin-top: 9px;
  border-radius: 3px;
  background: var(--cover-accent);
}

.cover-title {
  display: -webkit-box;
  min-height: 55px;
  overflow: hidden;
  margin-top: 10px;
  font-size: 21px;
  font-weight: 850;
  line-height: 1.28;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.cover-code {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 8px;
  letter-spacing: 0.09em;
}

.cover-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  margin-top: auto;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.1);
}

.cover-metrics > span {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 6px 8px;
  background: rgba(8, 15, 34, 0.2);
}

.cover-metrics strong {
  font-size: 13px;
}

.cover-metrics small {
  color: rgba(255, 255, 255, 0.62);
  font-size: 8px;
}

.cover-readiness {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 7px;
  color: #fde68a;
  font-size: 9px;
  font-weight: 700;
}

.cover-readiness.is-ready {
  color: #a7f3d0;
}

.cover-open {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.cover-open span {
  color: var(--cover-accent);
  font-size: 14px;
  transition: transform 180ms ease;
}

.paper-cover:hover .cover-open span {
  transform: translateX(4px);
}

.paper-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 43px;
  padding: 6px 3px 0 5px;
}

.paper-card-footer > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
  color: #64748b;
  font-size: 10px;
}

.paper-card-footer small {
  color: #a1aab8;
  font-size: 8px;
}

.card-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
}

.module-table :deep(.el-table__cell) {
  padding: 12px 0;
}

.module-identity,
.module-association,
.module-set-status {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.module-identity strong {
  color: #1e293b;
}

.module-identity code {
  color: #94a3b8;
  font-size: 11px;
}

.question-composition {
  display: flex;
  max-width: 155px;
  flex-direction: column;
  gap: 7px;
}

.question-composition > span {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.question-composition strong {
  color: #334155;
  font-size: 13px;
}

.question-composition small,
.module-association small,
.module-set-status small {
  color: #94a3b8;
  font-size: 11px;
}

.module-association > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.module-set-link {
  overflow: hidden;
  border: 0;
  padding: 0;
  background: transparent;
  color: #4f46e5;
  font: inherit;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.module-set-link:hover {
  color: #3730a3;
  text-decoration: underline;
}

.module-set-status {
  align-items: flex-start;
}

.validation-ok,
.validation-error,
.validation-pending {
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

.validation-pending {
  color: #d97706;
}

.empty-state {
  display: flex;
  min-height: 330px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  padding: 42px 20px;
  color: #94a3b8;
  text-align: center;
}

.empty-state strong {
  color: #475569;
  font-size: 17px;
}

.empty-state .el-button {
  margin-top: 8px;
}

.empty-cover {
  display: grid;
  width: 72px;
  height: 94px;
  place-items: center;
  border-radius: 3px 10px 10px 3px;
  background: linear-gradient(145deg, #1e3a67, #4f46e5);
  box-shadow: 0 12px 24px rgba(79, 70, 229, 0.2);
  color: rgba(255, 255, 255, 0.84);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
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

.readiness-overview {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.readiness-overview > div {
  display: flex;
  min-height: 96px;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  background: #f0fdf4;
}

.readiness-overview > div.is-pending {
  border-color: #fde68a;
  background: #fffbeb;
}

.readiness-overview span,
.readiness-overview small {
  color: #64748b;
}

.readiness-overview strong {
  color: #166534;
  font-size: 20px;
}

.readiness-overview .is-pending strong {
  color: #b45309;
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

.module-tab-label small {
  font-size: 11px;
}

.module-ready {
  color: #059669;
}

.module-pending {
  color: #d97706;
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

  .toolbar-view-switch {
    margin-left: auto;
  }
}
</style>
