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
              :value="row.accessTier === 'free' ? '免费' : '会员'"
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
                <span class="cover-kicker">
                  <span class="cover-exam">{{ row.examType }}</span>
                  <span class="cover-status" :class="`is-${coverStatus(row)}`">
                    {{ coverStatusLabel(row) }}
                  </span>
                </span>

                <span class="cover-title">{{ coverTitle(row) }}</span>
                <span class="cover-code">{{ row.code }} · VERSION {{ row.version }}</span>

                <span class="cover-module-summary">
                  <span class="cover-module-count">
                    <small>可用模块</small>
                    <strong>
                      {{ Math.min(row.readyModuleCount, modulePoolCapacity(row.examType)) }}/{{
                        modulePoolCapacity(row.examType)
                      }}
                    </strong>
                  </span>
                  <span class="cover-subjects">
                    <small>当前科目</small>
                    <span class="cover-subject-list">
                      <em
                        v-for="module in row.modules"
                        :key="module.code"
                        :class="{ 'is-pending': module.validationStatus !== 'valid' }"
                      >
                        {{ moduleNameMap[module.code] || module.label }}
                      </em>
                    </span>
                  </span>
                </span>

                <span class="cover-open">打开试卷 <span aria-hidden="true">→</span></span>
              </button>
            </el-badge>

            <footer class="paper-card-footer">
              <span>
                <span class="paper-card-footer__meta">
                  <small>最近更新</small>
                  <em>{{ coverStatusLabel(row) }}</em>
                </span>
                {{ formatDateTime(row.updatedAt) }}
              </span>
              <div class="card-actions">
                <el-button
                  v-if="row.deletable"
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
          <el-table-column label="Module / Paper" min-width="225">
            <template #default="{ row }">
              <div class="module-identity">
                <strong>{{ moduleDisplayName(row) }}</strong>
                <code>{{ row.code }}</code>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="考试" width="82">
            <template #default="{ row }">{{ row.mockPaperSet.examType }}</template>
          </el-table-column>
          <el-table-column label="形式与所属套卷" min-width="330">
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
          <el-table-column label="发布状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.mockPaperSet.status)" size="small">
                {{ statusLabel(row.mockPaperSet.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="访问权限" width="110">
            <template #default="{ row }">
              <el-tag
                :type="row.mockPaperSet.accessTier === 'free' ? 'success' : 'warning'"
                size="small"
                effect="plain"
              >
                {{ row.mockPaperSet.accessTier === 'free' ? '免费' : '会员' }}
              </el-tag>
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
                  {{ Math.min(detail.readyModuleCount, modulePoolCapacity(detail.examType)) }}/{{
                    modulePoolCapacity(detail.examType)
                  }} 个单项可用
                </el-tag>
                <el-tag :type="detail.fullExamReady ? 'success' : 'warning'">
                  {{
                    fullExamAvailabilityLabel(
                      detail.examType,
                      detail.readyModuleCount,
                      detail.fullExamReady,
                    )
                  }}
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

          <el-alert
            v-if="detail.issues.length"
            type="warning"
            :closable="false"
            show-icon
            class="set-alert"
          >
            <template #title>{{ detail.issues.join('；') }}</template>
          </el-alert>

          <el-tabs
            v-model="activeModuleId"
            class="module-tabs"
          >
            <el-tab-pane v-for="module in detail.modules" :key="module.id" :name="module.id">
              <template #label>
                <span class="module-tab-label">
                  {{ moduleDisplayTitle(detail.examType, module.code, module.label, detail.sequenceNo) }}
                  <em :class="{ error: module.validationStatus !== 'valid' }">
                    {{ module.questionCount }}/{{ module.expectedQuestionCount }}
                  </em>
                  <small
                    class="module-publication"
                    :class="module.published ? 'is-published' : 'is-unpublished'"
                  >
                    {{ module.published ? '单项已发布' : '单项未发布' }}
                  </small>
                  <button
                    v-if="module.removable"
                    type="button"
                    class="module-tab-remove"
                    :disabled="removingModuleId === module.id"
                    :aria-label="`移除 ${moduleDisplayTitle(detail.examType, module.code, module.label, detail.sequenceNo)}`"
                    @click.stop="confirmRemoveModule(module)"
                  >
                    ×
                  </button>
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
            <el-tab-pane v-if="detail.canAddModules" name="add-module">
              <template #label>
                <button
                  type="button"
                  class="module-tab-add"
                  aria-label="添加单项卷"
                  @click.stop="openAddModuleDialog"
                >
                  +
                </button>
              </template>
            </el-tab-pane>
          </el-tabs>
        </template>
      </div>
    </el-drawer>

    <el-dialog v-model="addModuleDialogVisible" title="选择可加入的单项卷" width="680px">
      <div v-loading="candidateLoading" class="module-candidate-shell">
        <el-radio-group v-if="moduleCandidates.length" v-model="selectedCandidateId">
          <el-radio
            v-for="candidate in moduleCandidates"
            :key="candidate.id"
            :value="candidate.id"
            border
            class="module-candidate-option"
          >
            <span class="module-candidate-main">
              <strong>
                {{
                  moduleDisplayTitle(
                    detail?.examType || '',
                    candidate.code,
                    candidate.label,
                    candidate.sourceSet.sequenceNo,
                  )
                }}
              </strong>
              <small>
                {{ candidate.sourceSet.code }} · {{ candidate.questionCount }} 题 ·
                {{ formatDuration(candidate.durationSeconds) }}
              </small>
            </span>
            <span class="module-candidate-tags">
              <el-tag size="small" effect="plain">
                {{ statusLabel(candidate.sourceSet.status) }}
              </el-tag>
              <el-tag size="small" effect="plain" type="warning">
                {{ candidate.sourceSet.accessTier === 'free' ? '免费' : '会员' }}
              </el-tag>
            </span>
          </el-radio>
        </el-radio-group>
        <el-empty
          v-else-if="!candidateLoading"
          description="暂无尚未组成套卷的可用单项卷"
          :image-size="76"
        />
      </div>
      <p class="module-candidate-tip">仅显示同一考试、校验通过且尚未被其他完整套卷采用的单项卷。</p>
      <template #footer>
        <el-button :disabled="addingModule" @click="addModuleDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="addingModule"
          :disabled="!selectedCandidateId"
          @click="submitAddModule"
        >
          加入当前套卷
        </el-button>
      </template>
    </el-dialog>

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
  addMockPaperModule,
  archiveMockPaperSet,
  deleteMockPaperSet,
  getMockPaperModuleCandidates,
  getMockPaperModules,
  getMockPaperSetDetail,
  getMockPaperSets,
  importMockPaperWorkbook,
  publishMockPaperSet,
  removeMockPaperModule,
  replaceMockPaperQuestion,
  updateMockPaperSet,
  validateMockPaperSet,
  type MockPaperAccessTier,
  type MockPaperModuleCandidate,
  type MockPaperModuleDetail,
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

const moduleNameMap: Record<string, string> = {
  maths1: 'Math1',
  maths2: 'Math2',
  physics: 'Physics',
  biology: 'Biology',
  chemistry: 'Chemistry',
  paper1: 'Paper1',
  paper2: 'Paper2',
}

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

const addModuleDialogVisible = ref(false)
const candidateLoading = ref(false)
const moduleCandidates = ref<MockPaperModuleCandidate[]>([])
const selectedCandidateId = ref('')
const addingModule = ref(false)
const removingModuleId = ref('')

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

// 加号弹窗每次实时读取候选，避免展示刚被其他管理员组套的单项卷。
async function openAddModuleDialog(): Promise<void> {
  if (!detail.value?.canAddModules || candidateLoading.value) return
  addModuleDialogVisible.value = true
  candidateLoading.value = true
  selectedCandidateId.value = ''
  moduleCandidates.value = []
  try {
    const result = await getMockPaperModuleCandidates(detail.value.id)
    moduleCandidates.value = result.list
  } finally {
    candidateLoading.value = false
  }
}

// 确认后由服务端复制单项题序、锁定来源并重新计算当前套卷完整性。
async function submitAddModule(): Promise<void> {
  if (!detail.value || !selectedCandidateId.value || addingModule.value) return
  addingModule.value = true
  try {
    const result = await addMockPaperModule(detail.value.id, selectedCandidateId.value)
    addModuleDialogVisible.value = false
    activeModuleId.value = result.id
    await refreshCurrentDetail()
    ElMessage.success('单项卷已加入当前套卷')
  } finally {
    addingModule.value = false
  }
}

// 移除只调整草稿套卷结构；题库中的 Question 数据不随 Module 关系删除。
async function confirmRemoveModule(module: MockPaperModuleDetail): Promise<void> {
  if (!detail.value || !module.removable || removingModuleId.value) return
  try {
    await ElMessageBox.confirm(
      `确定从当前草稿套卷移除“${moduleDisplayTitle(
        detail.value.examType,
        module.code,
        module.label,
        detail.value.sequenceNo,
      )}”吗？题库中的试题不会被删除。`,
      '移除单项卷',
      { type: 'warning', confirmButtonText: '确认移除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  removingModuleId.value = module.id
  try {
    await removeMockPaperModule(detail.value.id, module.id)
    ElMessage.success('已从当前套卷移除单项卷')
    await refreshCurrentDetail()
  } finally {
    removingModuleId.value = ''
  }
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
  const availability = `将发布 ${detail.value.readyModuleCount} 个可用单项；${fullExamAvailabilityLabel(
    detail.value.examType,
    detail.value.readyModuleCount,
    detail.value.fullExamReady,
  )}。`
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
  const publishedModuleNotice = row.paperId
    ? '当前已发布的单项会同步下架，'
    : ''
  try {
    await ElMessageBox.confirm(
      `确定删除“${row.title}”吗？${publishedModuleNotice}该操作不会删除试题库原题。`,
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

// 套卷封面只表达整套卷状态；单项模块是否开放不参与这里的状态文案。
function coverStatus(row: MockPaperSetListItem): MockPaperSetListItem['status'] {
  if (row.status === 'archived') return 'archived'
  if (row.status === 'published' && row.fullExamReady) return 'published'
  return 'draft'
}

// 封面和最近更新时间区域共用同一套套卷状态口径。
function coverStatusLabel(row: MockPaperSetListItem): string {
  return statusLabel(coverStatus(row))
}

// 单项表格复用套卷状态色，保证草稿、发布和下线在两种视图中一致。
function statusTagType(status: string): 'info' | 'success' | 'warning' {
  if (status === 'published') return 'success'
  if (status === 'draft') return 'warning'
  return 'info'
}

// 套卷详情与单项列表共用同一模块标题规则，例如 ESAT Math1 No.001。
function moduleDisplayTitle(
  examType: string,
  moduleCode: string,
  fallbackLabel: string,
  sequenceNo: number,
): string {
  const moduleName = moduleNameMap[moduleCode] || fallbackLabel
  return `${examType} ${moduleName} No.${String(sequenceNo).padStart(3, '0')}`
}

// 单项列表把所属套卷信息转换为统一模块标题。
function moduleDisplayName(row: MockPaperModuleListItem): string {
  return moduleDisplayTitle(
    row.mockPaperSet.examType,
    row.code,
    row.label,
    row.mockPaperSet.sequenceNo,
  )
}

// 套卷封面使用稳定编号生成统一标题，避免后台自定义标题造成列表难以扫描。
function coverTitle(row: MockPaperSetListItem): string {
  return `${row.examType} 模拟卷 No.${String(row.sequenceNo).padStart(3, '0')}`
}

// ESAT Module 池可容纳全部五科，TMUA 仍固定为两个 Paper。
function modulePoolCapacity(examType: MockPaperSetListItem['examType']): number {
  return examType === 'ESAT' ? 5 : 2
}

// ESAT 每种正式组合固定包含 Math1，再从其余可用模块中任选两个。
function esatCombinationCount(readyModuleCount: number): number {
  const selectableModuleCount = Math.max(0, readyModuleCount - 1)
  return selectableModuleCount >= 2
    ? selectableModuleCount * (selectableModuleCount - 1) / 2
    : 0
}

// 后台状态同时表达是否可开完整模考，以及当前 Module 池能够派生的组合数量。
function fullExamAvailabilityLabel(
  examType: MockPaperSetListItem['examType'],
  readyModuleCount: number,
  fullExamReady: boolean,
): string {
  if (!fullExamReady) return '完整模考待补齐'
  if (examType === 'TMUA') return '完整模考可用'
  return `可生成 ${esatCombinationCount(readyModuleCount)} 种完整模考组合`
}

// 候选单项使用分钟展示正式限时，便于管理员在组套前快速核对。
function formatDuration(durationSeconds: number): string {
  return `${Math.round(durationSeconds / 60)} 分钟`
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
  width: 100%;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px 20px;
}

.paper-card {
  min-width: 0;
  --cover-accent: #2563eb;
  --cover-accent-soft: #eff6ff;
  --cover-border: #cbd5e1;
  --cover-surface: #f8fafc;
}

.paper-card.is-tmua {
  --cover-accent: #8b3a62;
  --cover-accent-soft: #fdf2f8;
  --cover-border: #d8c4ce;
  --cover-surface: #fffafb;
}

.paper-cover {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 258px;
  overflow: hidden;
  flex-direction: column;
  border: 1px solid var(--cover-border);
  border-radius: 10px;
  padding: 16px 16px 14px 20px;
  background: var(--cover-surface);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  color: #0f172a;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.paper-cover:hover,
.paper-cover:focus-visible {
  border-color: var(--cover-accent);
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.13);
}

.paper-cover:focus-visible {
  outline: 3px solid #818cf8;
  outline-offset: 3px;
}

.paper-card.is-incomplete .paper-cover {
  border-color: #d6dce5;
}

.paper-card.is-archived .paper-cover {
  opacity: 0.72;
}

.cover-spine {
  position: absolute;
  z-index: 2;
  inset: 0 auto 0 0;
  width: 5px;
  background: var(--cover-accent);
}

.cover-pattern {
  display: none;
}

.paper-cover > span:not(.cover-spine, .cover-pattern) {
  position: relative;
  z-index: 3;
}

.cover-access-badge {
  display: block;
  width: 100%;
}

.cover-access-badge :deep(.el-badge__content) {
  z-index: 6;
  height: 23px;
  min-width: 0;
  border-width: 2px;
  padding: 0 8px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.16);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.06em;
  line-height: 19px;
}

.cover-access-badge :deep(.el-badge__content.is-fixed) {
  top: 2px;
  right: 6px;
  transform: translateY(-50%) translateX(25%);
}

.cover-kicker {
  display: flex;
  min-height: 26px;
  align-items: center;
  gap: 8px;
  padding-right: 36px;
}

.cover-exam,
.cover-status {
  display: inline-flex;
  align-items: center;
  border-radius: 5px;
  line-height: 1;
}

.cover-exam {
  padding: 6px 8px;
  background: var(--cover-accent-soft);
  color: var(--cover-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.cover-status {
  gap: 5px;
  border: 1px solid #fdba74;
  padding: 5px 8px;
  background: #ffedd5;
  color: #c2410c;
  font-size: 12px;
  font-weight: 750;
}

.cover-status::before {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: currentColor;
  content: '';
}

.cover-status.is-published {
  border-color: #86efac;
  background: #dcfce7;
  color: #047857;
}

.cover-status.is-archived {
  border-color: #cbd5e1;
  background: #f1f5f9;
  color: #475569;
}

.cover-title {
  display: block;
  overflow: hidden;
  margin-top: 13px;
  color: #0f172a;
  font-size: 20px;
  font-weight: 750;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-code {
  overflow: hidden;
  margin-top: 3px;
  margin-bottom: auto;
  color: #64748b;
  font-size: 11px;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cover-module-summary {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.cover-module-count,
.cover-subjects {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.cover-module-count {
  flex: 0 0 auto;
}

.cover-module-count strong {
  color: #0f172a;
  font-size: 15px;
  line-height: 1.1;
}

.cover-module-summary small {
  color: #64748b;
  font-size: 10px;
}

.cover-subjects {
  flex: 1 1 auto;
}

.cover-subject-list {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-wrap: nowrap;
  gap: 3px;
  white-space: nowrap;
}

.cover-subject-list em {
  border-radius: 4px;
  padding: 3px;
  background: var(--cover-accent-soft);
  color: var(--cover-accent);
  font-size: 9px;
  font-style: normal;
  font-weight: 650;
  line-height: 1;
}

.cover-subject-list em.is-pending {
  background: #f1f5f9;
  color: #64748b;
}

.cover-open {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 9px;
  border-top: 1px solid #e2e8f0;
  padding-top: 9px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
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
  font-size: 12px;
  line-height: 1.5;
}

.paper-card-footer small {
  color: #64748b;
  font-size: 12px;
}

.paper-card-footer__meta {
  display: flex;
  align-items: center;
  gap: 7px;
}

.paper-card-footer__meta em {
  color: #64748b;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
}

.card-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
}

.module-table :deep(.el-table__cell) {
  padding: 12px 0;
}

.module-association {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.module-identity {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-identity strong {
  color: #1e293b;
  font-size: 14px;
}

.module-identity code {
  color: #94a3b8;
  font-size: 11px;
}

.module-association small {
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

.set-alert {
  margin-bottom: 16px;
}

.module-tabs {
  padding: 0 18px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
}

.module-tabs :deep(#tab-add-module) {
  height: var(--el-tabs-header-height);
  padding: 0 8px;
}

.module-tab-add {
  width: 30px;
  height: 30px;
  border: 1px dashed #94a3b8;
  border-radius: 7px;
  background: #fff;
  color: #475569;
  cursor: pointer;
  font: inherit;
  font-size: 16px;
  line-height: 26px;
}

.module-tab-add:hover,
.module-tab-add:focus-visible {
  border-color: #2563eb;
  color: #2563eb;
}

.module-tab-add:focus-visible {
  outline: 2px solid #bfdbfe;
  outline-offset: 2px;
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

.module-tab-remove {
  display: inline-grid;
  width: 19px;
  height: 19px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  padding: 0;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font: inherit;
  font-size: 16px;
  line-height: 1;
  opacity: 0;
  transition:
    opacity 150ms ease,
    background 150ms ease,
    color 150ms ease;
}

.module-tab-label:hover .module-tab-remove,
.module-tab-remove:focus-visible {
  opacity: 1;
}

.module-tab-remove:hover,
.module-tab-remove:focus-visible {
  background: #fef2f2;
  color: #dc2626;
  outline: none;
}

.module-tab-remove:disabled {
  cursor: wait;
  opacity: 0.45;
}

.module-candidate-shell {
  min-height: 150px;
}

.module-candidate-shell .el-radio-group {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.module-candidate-option {
  width: 100%;
  height: auto;
  min-height: 66px;
  margin: 0;
  padding: 11px 14px;
}

.module-candidate-option :deep(.el-radio__label) {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.module-candidate-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.module-candidate-main strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-candidate-main small,
.module-candidate-tip {
  color: #64748b;
}

.module-candidate-tags {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 6px;
}

.module-candidate-tip {
  margin: 12px 0 0;
  font-size: 12px;
}

.module-publication {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 3px 7px;
  font-weight: 650;
  line-height: 1;
}

.module-publication.is-published {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.module-publication.is-unpublished {
  border-color: #cbd5e1;
  background: #f8fafc;
  color: #64748b;
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

@media (max-width: 1400px) {
  .paper-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1080px) {
  .workflow-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .paper-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

@media (max-width: 680px) {
  .paper-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
