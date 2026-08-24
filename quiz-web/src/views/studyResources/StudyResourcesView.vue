<!-- 资料下载页：按考试与资料分类展示已发布 PDF，并通过受控接口完成下载。 -->
<template>
  <div class="resources-page">
    <NavBar />

    <main>
      <section class="resources-hero">
        <div class="resources-hero__pattern" aria-hidden="true"></div>
        <div class="resources-shell resources-hero__content">
          <span class="resources-kicker">AceMock 云舟备考 · Study Resources</span>
          <h1>备考资料下载</h1>
          <p>汇集考试资料、过往真题和知识点讲义，按备考目标快速查找并下载 PDF。</p>
        </div>
      </section>

      <section class="resources-shell resources-content" aria-label="备考资料列表">
        <div class="filter-panel">
          <div class="filter-group">
            <span class="filter-label">考试类型</span>
            <div class="filter-options">
              <button
                v-for="option in examFilters"
                :key="option.value || 'all'"
                class="filter-chip"
                :class="{ 'filter-chip--active': filters.examType === option.value }"
                type="button"
                @click="selectExam(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-label">资料分类</span>
            <div class="filter-options">
              <button
                v-for="option in categoryFilters"
                :key="option.value || 'all'"
                class="filter-chip"
                :class="{ 'filter-chip--active': filters.category === option.value }"
                type="button"
                @click="selectCategory(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="list-heading">
          <div>
            <h2>{{ currentCategoryTitle }}</h2>
            <p>共 {{ pagination.total }} 份已发布资料</p>
          </div>
          <span class="download-note">免费资料可直接下载</span>
        </div>

        <div v-if="loading" class="state-panel" aria-live="polite">
          <span class="state-spinner" aria-hidden="true"></span>
          正在加载资料…
        </div>

        <div v-else-if="loadError" class="state-panel state-panel--error">
          <strong>资料加载失败</strong>
          <span>{{ loadError }}</span>
          <el-button type="primary" plain @click="fetchResources">重新加载</el-button>
        </div>

        <div v-else-if="resources.length === 0" class="state-panel">
          <span class="empty-icon" aria-hidden="true">PDF</span>
          <strong>当前筛选下暂无资料</strong>
          <span>可以切换考试类型或资料分类查看其他内容。</span>
        </div>

        <div v-else class="resource-grid">
          <article v-for="resource in resources" :key="resource.id" class="resource-card">
            <div class="resource-card__top">
              <span class="pdf-badge" aria-hidden="true">PDF</span>
              <div class="resource-tags">
                <span class="resource-tag">{{ resource.examType }}</span>
                <span v-if="resource.resourceYear" class="resource-tag resource-tag--year">
                  {{ resource.resourceYear }} 年
                </span>
                <span class="resource-tag">{{ categoryLabel(resource.category) }}</span>
              </div>
            </div>
            <div class="resource-card__body">
              <h3>{{ displayResourceTitle(resource) }}</h3>
              <p v-if="resource.description">
                {{ resource.description }}
              </p>
              <dl>
                <div v-for="file in resource.files" :key="file.id">
                  <dt>{{ fileRoleLabel(file.fileRole) }}</dt>
                  <dd :title="file.originalFileName">{{ file.originalFileName }}</dd>
                </div>
                <div>
                  <dt>大小</dt>
                  <dd>{{ formatFileSize(totalFileSize(resource)) }}</dd>
                </div>
                <div>
                  <dt>发布</dt>
                  <dd>{{ formatDate(resource.publishedAt) }}</dd>
                </div>
              </dl>
            </div>
            <footer class="resource-card__footer">
              <span class="download-count">下载次数：{{ resource.downloadCount }} 次</span>
              <div v-if="resource.category === 'past_paper'" class="download-actions">
                <el-button
                  type="primary"
                  plain
                  :disabled="!fileByRole(resource, 'question')"
                  :loading="isRoleDownloading(resource, 'question')"
                  @click="downloadRoleFile(resource, 'question')"
                >
                  {{ fileByRole(resource, 'question') ? '下载试题' : '试题待上传' }}
                </el-button>
                <el-button
                  type="primary"
                  :disabled="!fileByRole(resource, 'answer')"
                  :loading="isRoleDownloading(resource, 'answer')"
                  @click="downloadRoleFile(resource, 'answer')"
                >
                  {{ fileByRole(resource, 'answer') ? '下载答案' : '答案待上传' }}
                </el-button>
              </div>
              <el-button
                v-else
                type="primary"
                :loading="Boolean(resource.files[0] && downloadingIds.includes(resource.files[0].id))"
                @click="downloadPrimaryFile(resource)"
              >
                {{ resource.accessTier === 'member' && !auth.isLoggedIn ? '登录后下载' : '下载 PDF' }}
              </el-button>
            </footer>
          </article>
        </div>

        <AppPagination
          v-if="!loading && !loadError"
          v-model:page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next"
          @page-change="changePage"
          @page-size-change="changePageSize"
        />
      </section>
    </main>

    <DailyCardAccessDialog
      v-model="membershipAccessVisible"
      :exam-type="paymentExamType"
      upgrade-message="当前资料仅限会员下载，开通对应考试会员后即可继续。"
      cancel-text="暂不下载"
      @activated="handleDailyCardActivated"
      @upgrade="handleMembershipUpgrade"
      @cancel="clearPendingDownload"
    />

    <PaymentModal
      :model-value="paymentVisible"
      :default-exam-type="paymentExamType"
      @update:model-value="handlePaymentVisibilityChange"
      @paid="handlePaymentSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import NavBar from '@/components/NavBar.vue'
import AppPagination from '@/components/AppPagination.vue'
import DailyCardAccessDialog from '@/components/DailyCardAccessDialog.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import { EXAM_TYPE_OPTIONS, type ExamType } from '@/constants/examTypes'
import { getMember } from '@/api/member'
import { useAuthStore, type ActiveExamType } from '@/stores/auth'
import { createLoginRequiredRouteLocation } from '@/utils/authRedirect'
import { getApiErrorMessage, hasApiErrorCode } from '@/utils/request'
import {
  downloadStudyResource,
  getPublishedStudyResources,
  type PublicStudyResourceItem,
  type StudyResourceCategory,
  type StudyResourceFileItem,
  type StudyResourceFileRole,
} from '@/api/studyResources'

type CategoryFilter = StudyResourceCategory | ''

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const examFilters: Array<{ label: string; value: ExamType | '' }> = [
  { label: '全部考试', value: '' },
  ...EXAM_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value })),
]
const categoryFilters: Array<{ label: string; value: CategoryFilter }> = [
  { label: '全部资料', value: '' },
  { label: '考试资料', value: 'exam_material' },
  { label: '过往真题', value: 'past_paper' },
  { label: '知识点讲义', value: 'knowledge_handout' },
]
const filters = reactive<{ examType: ExamType | ''; category: CategoryFilter }>({
  examType: '',
  category: '',
})
const pagination = reactive({ page: 1, pageSize: 12, total: 0 })
const resources = ref<PublicStudyResourceItem[]>([])
const loading = ref(false)
const loadError = ref('')
const downloadingIds = ref<string[]>([])
const membershipAccessVisible = ref(false)
const paymentVisible = ref(false)
const paymentExamType = ref<ActiveExamType>(auth.activeExamType)
const pendingDownload = ref<{ resourceId: string; fileId: string } | null>(null)

// 当前标题随分类筛选变化，帮助用户确认列表语义。
const currentCategoryTitle = computed(
  () => categoryFilters.find((item) => item.value === filters.category)?.label || '全部资料',
)

onMounted(fetchResources)

// 前台列表仅请求已发布元数据，筛选切换与分页复用同一入口。
async function fetchResources(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const result = await getPublishedStudyResources({
      page: pagination.page,
      pageSize: pagination.pageSize,
      examType: filters.examType || undefined,
      category: filters.category || undefined,
    })
    resources.value = result.list
    pagination.total = result.pagination.total
  } catch (error: unknown) {
    resources.value = []
    pagination.total = 0
    loadError.value = getApiErrorMessage(error, '请检查网络后重试')
  } finally {
    loading.value = false
  }
}

// 考试筛选变化后回到第一页，避免新结果页码越界。
function selectExam(examType: ExamType | ''): void {
  if (filters.examType === examType) return
  filters.examType = examType
  pagination.page = 1
  void fetchResources()
}

// 三类资料共享同一个公开列表，分类只改变查询条件。
function selectCategory(category: CategoryFilter): void {
  if (filters.category === category) return
  filters.category = category
  pagination.page = 1
  void fetchResources()
}

function changePage(page: number): void {
  pagination.page = page
  void fetchResources()
  window.scrollTo({ top: 300, behavior: 'smooth' })
}

function changePageSize(pageSize: number): void {
  pagination.pageSize = pageSize
  pagination.page = 1
  void fetchResources()
}

// 文件字节通过带认证头的 API 客户端读取，下载地址不暴露服务器物理路径。
async function handleDownload(
  resource: PublicStudyResourceItem,
  file: StudyResourceFileItem,
): Promise<void> {
  if (resource.accessTier === 'member' && !auth.isLoggedIn) {
    await router.push(createLoginRequiredRouteLocation(route.fullPath))
    return
  }
  if (
    resource.accessTier === 'member' &&
    (resource.examType === 'ESAT' || resource.examType === 'TMUA') &&
    !auth.memberContext?.isAdmin &&
    !auth.memberContext?.quotas?.[resource.examType]?.isMember
  ) {
    pendingDownload.value = { resourceId: resource.id, fileId: file.id }
    paymentExamType.value = resource.examType
    membershipAccessVisible.value = true
    return
  }
  if (downloadingIds.value.includes(file.id)) return
  downloadingIds.value = [...downloadingIds.value, file.id]
  try {
    const blob = await downloadStudyResource(file.id)
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = file.originalFileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    resource.downloadCount += 1
    ElMessage.success('资料已开始下载')
  } catch (error: unknown) {
    if (
      (resource.examType === 'ESAT' || resource.examType === 'TMUA') &&
      hasApiErrorCode(error, 'STUDY_RESOURCE_MEMBERSHIP_REQUIRED')
    ) {
      pendingDownload.value = { resourceId: resource.id, fileId: file.id }
      paymentExamType.value = resource.examType
      membershipAccessVisible.value = true
    }
    // 公共请求层展示文件缺失等其余具体原因。
  } finally {
    downloadingIds.value = downloadingIds.value.filter((id) => id !== file.id)
  }
}

// 日卡或新会员权益生效后重新定位当前列表中的文件并继续原下载。
async function resumePendingDownload(): Promise<void> {
  const pending = pendingDownload.value
  pendingDownload.value = null
  if (!pending) return
  const resource = resources.value.find((item) => item.id === pending.resourceId)
  const file = resource?.files.find((item) => item.id === pending.fileId)
  if (!resource || !file) {
    ElMessage.info('资料状态已更新，请重新选择。')
    return
  }
  await handleDownload(resource, file)
}

// 免费日卡启用后直接承接用户刚才选择的资料文件。
async function handleDailyCardActivated(): Promise<void> {
  await resumePendingDownload()
}

// 没有可用日卡或用户主动升级时再进入原有支付流程。
function handleMembershipUpgrade(): void {
  paymentVisible.value = true
}

// 未完成购买便关闭收银台时结束本次下载意图。
function handlePaymentVisibilityChange(visible: boolean): void {
  paymentVisible.value = visible
  if (!visible) clearPendingDownload()
}

// 取消权益拦截时清除待下载文件，避免后续误触发旧下载。
function clearPendingDownload(): void {
  pendingDownload.value = null
}

// 支付成功后刷新会员上下文并继续下载，不要求用户再次查找资料。
async function handlePaymentSuccess(): Promise<void> {
  paymentVisible.value = false
  try {
    auth.setMemberContext(await getMember())
    await resumePendingDownload()
  } catch {
    // 支付组件已确认成功，公共请求层负责提示权益刷新失败。
  }
}

// 普通资料仍下载资料组中的唯一主文件。
function downloadPrimaryFile(resource: PublicStudyResourceItem): void {
  const file = resource.files[0]
  if (file) void handleDownload(resource, file)
}

function fileByRole(
  resource: PublicStudyResourceItem,
  role: 'question' | 'answer',
): StudyResourceFileItem | undefined {
  return resource.files.find((file) => file.fileRole === role)
}

// 年度真题按钮只把对应角色文件交给统一下载流程。
function downloadRoleFile(resource: PublicStudyResourceItem, role: 'question' | 'answer'): void {
  const file = fileByRole(resource, role)
  if (file) void handleDownload(resource, file)
}

function isRoleDownloading(resource: PublicStudyResourceItem, role: 'question' | 'answer'): boolean {
  const file = fileByRole(resource, role)
  return Boolean(file && downloadingIds.value.includes(file.id))
}

function categoryLabel(category: StudyResourceCategory): string {
  return categoryFilters.find((option) => option.value === category)?.label || category
}

function displayResourceTitle(resource: PublicStudyResourceItem): string {
  return resource.category === 'past_paper' && resource.resourceYear
    ? `${resource.resourceYear} 年真题`
    : resource.title
}

function fileRoleLabel(role: StudyResourceFileRole): string {
  if (role === 'question') return '试题'
  if (role === 'answer') return '答案'
  return '文件'
}

function totalFileSize(resource: PublicStudyResourceItem): number {
  return resource.files.reduce((total, file) => total + file.fileSizeBytes, 0)
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('zh-CN')
}
</script>

<style scoped lang="scss">
.resources-page {
  min-width: var(--fluid-page-min-width);
  min-height: 100vh;
  background: #f7f8f6;
}

.resources-shell {
  width: var(--fluid-shell-width);
  margin: 0 auto;
}

.resources-hero {
  position: relative;
  overflow: hidden;
  background: #17201e;
  color: #fff;
}

.resources-hero__pattern {
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background-image: linear-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.22) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(90deg, transparent, #000 32%, #000 68%, transparent);
}

.resources-hero__content {
  position: relative;
  padding: clamp(54px, 6vw, 88px) 0;
}

.resources-kicker {
  color: #b8c6c1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.resources-hero h1 {
  margin: 16px 0 14px;
  font-size: clamp(34px, 4vw, 54px);
  line-height: 1.08;
}

.resources-hero p {
  max-width: 680px;
  margin: 0;
  color: #d8e0dd;
  font-size: 16px;
  line-height: 1.8;
}

.resources-content {
  padding: 34px 0 96px;
}

.filter-panel {
  display: grid;
  gap: 18px;
  padding: 15px 24px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 20px;
}

.filter-label {
  width: 68px;
  flex: 0 0 auto;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.filter-chip {
  min-height: 34px;
  padding: 0 15px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: #fff;
  color: var(--color-ink-soft);
  font-family: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
}

.filter-chip:hover,
.filter-chip--active {
  border-color: #17201e;
  background: #17201e;
  color: #fff;
}

.list-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin: 18px 0;
}

.list-heading h2 {
  margin: 0 0 6px;
  color: var(--color-ink);
  font-size: 25px;
}

.list-heading p,
.download-note {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.resource-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-xl);
  background: #fff;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.resource-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.resource-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 0;
}

.pdf-badge {
  display: grid;
  place-items: center;
  width: 44px;
  height: 52px;
  border-radius: 6px 12px 6px 6px;
  background: #f0564a;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.resource-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.resource-tag {
  padding: 5px 9px;
  border-radius: var(--radius-pill);
  background: #eef2f0;
  color: #52615c;
  font-size: 11px;
  font-weight: 700;
}

.resource-tag--year {
  background: #e5eee9;
  color: #244c3e;
}

.resource-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 8px 20px;
}

.resource-card h3 {
  margin: 0 0 3px;
  color: var(--color-ink);
  font-size: 18px;
  line-height: 1.45;
}

.resource-card p {
  min-height: 48px;
  margin: 0 0 30px;
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-ink-muted);
  font-size: 13px;
  line-height: 1.8;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.resource-card dl {
  display: grid;
  gap: 1px;
  margin: auto 0 0;
}

.resource-card dl div {
  min-width: 0;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 8px;
}

.resource-card dt,
.resource-card dd {
  margin: 0;
  font-size: 12px;
}

.resource-card dt {
  color: var(--color-ink-muted);
}

.resource-card dd {
  overflow: hidden;
  color: var(--color-ink-soft);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid var(--color-line-soft);
  background: #fbfcfb;
}

.download-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.download-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.download-count {
  color: #16794d;
  font-size: 12px;
  font-weight: 700;
}

.state-panel {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-xl);
  background: #fff;
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
  text-align: center;
}

.state-panel strong {
  color: var(--color-ink);
  font-size: var(--text-base);
}

.state-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #d8dfdc;
  border-top-color: #17201e;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 68px;
  border-radius: 8px 16px 8px 8px;
  background: #edf1ef;
  color: #75817d;
  font-size: 12px;
  font-weight: 800;
}

.resources-content :deep(.app-pagination) {
  margin-top: 28px;
  background: transparent;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1000px) {
  .resource-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 720px), (max-device-width: 720px) {
  :global(body:has(.resources-page)) {
    min-width: 0;
  }

  .resources-page {
    --fluid-page-min-width: 0px;
    --fluid-shell-width: calc(100% - 32px);

    min-width: 0;
  }

  :deep(.navbar) {
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }

  :deep(.navbar::-webkit-scrollbar) {
    display: none;
  }

  :deep(.nav-inner) {
    width: max-content;
    min-width: 100%;
    padding: 0 16px;
  }

  .resources-hero__content { padding: 44px 0; }
  .filter-group, .list-heading { align-items: flex-start; flex-direction: column; }
  .filter-group { gap: 10px; }
  .filter-label { width: auto; }
  .download-note { line-height: 1.6; }
  .resource-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .resource-card {
    border-radius: 10px;
  }

  .resource-card:hover {
    transform: none;
  }

  .resource-card__top {
    align-items: flex-start;
    gap: 8px;
    padding: 12px 12px 0;
  }

  .pdf-badge {
    width: 34px;
    height: 40px;
    flex: 0 0 34px;
    border-radius: 5px 9px 5px 5px;
    font-size: 9px;
  }

  .resource-tags {
    gap: 4px;
  }

  .resource-tag {
    padding: 3px 5px;
    font-size: 9px;
  }

  .resource-card__body {
    padding: 8px 12px;
  }

  .resource-card h3 {
    font-size: 14px;
    line-height: 1.4;
  }

  .resource-card p {
    min-height: 0;
    margin-bottom: 14px;
    font-size: 11px;
    line-height: 1.6;
  }

  .resource-card dl div {
    grid-template-columns: 34px minmax(0, 1fr);
    gap: 5px;
  }

  .resource-card dt,
  .resource-card dd {
    font-size: 10px;
  }

  .resource-card__footer {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
    padding: 9px 12px 12px;
  }

  .download-count {
    font-size: 10px;
  }

  .download-actions {
    width: 100%;
    align-items: stretch;
    flex-direction: row;
    gap: 6px;
  }

  .resource-card__footer :deep(.el-button) {
    width: 100%;
    min-width: 0;
    margin-left: 0;
    padding-right: 8px;
    padding-left: 8px;
  }

  .download-actions :deep(.el-button) {
    flex: 1 1 0;
    width: auto;
  }
}
</style>
