<!-- 操作日志页面：按角色和业务维度检索审计记录，并承接行为分析的精确下钻。 -->
<template>
  <div class="operation-logs-page">
    <div class="page-heading">
      <div>
        <h2 class="page-title">操作日志</h2>
        <p class="page-desc">查询管理员与普通用户的关键业务操作及字段变更记录。</p>
      </div>
    </div>

    <section class="filter-card">
      <div class="role-filter" aria-label="操作角色筛选">
        <button
          v-for="option in roleOptions"
          :key="option.value"
          type="button"
          :class="[
            'role-filter__item',
            { 'role-filter__item--active': draftFilters.role === option.value },
          ]"
          @click="changeRole(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div v-if="draftFilters.action" class="precision-filter">
        <span>当前行为</span>
        <strong>{{ operationActionLabel(draftFilters.action) }}</strong>
        <code>{{ draftFilters.action }}</code>
        <button type="button" aria-label="清除行为筛选" @click="clearActionFilter">×</button>
      </div>

      <div class="filter-row">
        <el-input
          v-model="draftFilters.keyword"
          class="filter-keyword"
          clearable
          placeholder="操作人、邮箱、对象 ID 或 Request ID"
          @keyup.enter="applyFilters"
        />
        <el-select v-model="draftFilters.module" clearable placeholder="全部模块">
          <el-option
            v-for="option in moduleOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-select v-model="draftFilters.result" clearable placeholder="全部结果">
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failure" />
        </el-select>
        <el-date-picker
          v-model="draftFilters.timeRange"
          class="filter-date"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :default-time="defaultTimes"
        />
        <div class="filter-actions">
          <el-button type="primary" @click="applyFilters">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>
    </section>

    <AdminDataTable
      v-model:page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :data="logs"
      :loading="loading"
      :total="pagination.total"
      empty-text="暂无操作记录"
      max-height="var(--operation-log-table-height)"
      show-pagination
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <el-table-column label="发生时间" width="176" fixed="left">
        <template #default="{ row }">{{ formatDateTime(row.occurredAt) }}</template>
      </el-table-column>
      <el-table-column label="操作人" min-width="210">
        <template #default="{ row }">
          <div class="actor-cell">
            <strong>{{ row.actorNameSnapshot }}</strong>
            <span>{{ row.actorEmailSnapshot }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="角色" width="104" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.actorRoleSnapshot === 'admin' ? 'danger' : 'info'"
            effect="light"
            round
          >
            {{ roleLabel(row.actorRoleSnapshot) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="模块" width="116" align="center">
        <template #default="{ row }">{{ moduleLabel(row.module) }}</template>
      </el-table-column>
      <el-table-column prop="summary" label="操作内容" min-width="210" show-overflow-tooltip />
      <el-table-column label="操作对象" min-width="168" show-overflow-tooltip>
        <template #default="{ row }">{{ resourceLabel(row) }}</template>
      </el-table-column>
      <el-table-column label="结果" width="92" align="center">
        <template #default="{ row }">
          <el-tag :type="row.result === 'success' ? 'success' : 'danger'" effect="light">
            {{ row.result === 'success' ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ipAddress" label="来源 IP" width="142">
        <template #default="{ row }">{{ row.ipAddress || '-' }}</template>
      </el-table-column>
      <el-table-column label="详情" width="90" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDetail(row.id)">查看</el-button>
        </template>
      </el-table-column>
    </AdminDataTable>

    <el-drawer v-model="detailVisible" title="操作详情" size="640px" destroy-on-close>
      <div v-loading="detailLoading" class="detail-content">
        <template v-if="selectedLog">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="发生时间" :span="2">
              {{ formatDateTime(selectedLog.occurredAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="Request ID" :span="2">
              <div class="request-id-row">
                <code>{{ selectedLog.requestId || '历史日志暂无 Request ID' }}</code>
                <el-button
                  v-if="selectedLog.requestId"
                  link
                  type="primary"
                  @click="copyRequestId(selectedLog.requestId)"
                >
                  复制
                </el-button>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="操作人">{{
              selectedLog.actorNameSnapshot
            }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{
              roleLabel(selectedLog.actorRoleSnapshot)
            }}</el-descriptions-item>
            <el-descriptions-item label="邮箱" :span="2">{{
              selectedLog.actorEmailSnapshot
            }}</el-descriptions-item>
            <el-descriptions-item label="模块">{{
              moduleLabel(selectedLog.module)
            }}</el-descriptions-item>
            <el-descriptions-item label="结果">
              {{ selectedLog.result === 'success' ? '成功' : '失败' }}
            </el-descriptions-item>
            <el-descriptions-item label="操作内容" :span="2">{{
              selectedLog.summary
            }}</el-descriptions-item>
            <el-descriptions-item label="操作编码" :span="2">{{
              selectedLog.action
            }}</el-descriptions-item>
            <el-descriptions-item label="操作对象" :span="2">{{
              resourceLabel(selectedLog)
            }}</el-descriptions-item>
            <el-descriptions-item label="请求"
              >{{ selectedLog.method }} {{ selectedLog.statusCode }}</el-descriptions-item
            >
            <el-descriptions-item label="来源 IP">{{
              selectedLog.ipAddress || '-'
            }}</el-descriptions-item>
            <el-descriptions-item label="接口路径" :span="2">{{
              selectedLog.path
            }}</el-descriptions-item>
            <el-descriptions-item v-if="selectedLog.errorCode" label="错误码" :span="2">
              {{ selectedLog.errorCode }}
            </el-descriptions-item>
            <el-descriptions-item label="设备信息" :span="2">
              {{ selectedLog.userAgent || '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <section class="changes-section">
            <div class="section-heading">
              <h3>字段变更</h3>
              <span>{{ changeEntries.length ? `${changeEntries.length} 项` : '无字段变更' }}</span>
            </div>
            <div v-if="changeEntries.length" class="changes-list">
              <article v-for="entry in changeEntries" :key="entry.field" class="change-item">
                <div class="change-item__field">{{ fieldLabel(entry.field) }}</div>
                <div class="change-values">
                  <div>
                    <span>修改前</span>
                    <pre>{{ formatChangeValue(entry.change.before) }}</pre>
                  </div>
                  <div class="change-arrow" aria-hidden="true">→</div>
                  <div>
                    <span>修改后</span>
                    <pre>{{ formatChangeValue(entry.change.after) }}</pre>
                  </div>
                </div>
              </article>
            </div>
            <el-empty v-else description="本次操作没有字段前后值" :image-size="72" />
          </section>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
// 操作日志页面：供管理员按角色和业务维度检索审计记录，并查看白名单字段变更。
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import {
  getOperationLogDetail,
  getOperationLogs,
  type OperationLogChange,
  type OperationLogDetail,
  type OperationLogItem,
} from '@/api/admin'
import {
  OPERATION_AUDIT_MODULE_OPTIONS,
  operationActionLabel,
  operationModuleLabel,
} from '@/constants/operationAudit'

interface AuditFilters {
  role: string
  module: string
  result: string
  action: string
  keyword: string
  timeRange: [Date, Date] | null
}

interface ApiFailureShape {
  response?: {
    data?: {
      errMsg?: string
    }
  }
}

const roleOptions = [
  { label: '全部', value: 'all' },
  { label: '管理员操作', value: 'admin' },
  { label: '普通用户操作', value: 'student' },
]

const moduleOptions = OPERATION_AUDIT_MODULE_OPTIONS

const fieldLabels: Record<string, string> = {
  username: '用户名',
  email: '邮箱',
  passwordChanged: '密码',
  examPreferences: '备考偏好',
  role: '用户角色',
  paymentStatus: '付款状态',
  memberships: '会员权益',
  firstMonthlyPriceCents: '首次月付价格（分）',
  monthlyPriceCents: '正常月付价格（分）',
  yearlyPriceCents: '年度价格（分）',
  status: '状态',
  rechargeItem: '成本项',
  amount: '金额',
  operator: '操作人',
  occurredAt: '业务日期',
  reimbursementStatus: '报销状态',
  remark: '备注',
  title: '试卷名称',
  code: '试卷编码',
  examType: '考试类型',
  year: '年份',
  duration: '考试时长',
  totalQuestions: '题目数量',
  paperType: '试卷类型',
  isActive: '启用状态',
  record: '被删除记录',
}

const defaultTimes: [Date, Date] = [new Date(2000, 0, 1, 0, 0, 0), new Date(2000, 0, 1, 23, 59, 59)]

const route = useRoute()
const router = useRouter()
const logs = ref<OperationLogItem[]>([])
const loading = ref(false)
let latestListRequestId = 0
const detailVisible = ref(false)
const detailLoading = ref(false)
const selectedLog = ref<OperationLogDetail | null>(null)
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
const draftFilters = reactive<AuditFilters>({
  role: 'all',
  module: '',
  result: '',
  action: '',
  keyword: '',
  timeRange: null,
})
const appliedFilters = reactive<AuditFilters>({
  role: 'all',
  module: '',
  result: '',
  action: '',
  keyword: '',
  timeRange: null,
})

// 详情仅在打开抽屉后读取 changes，列表请求不暴露字段前后值。
const changeEntries = computed(() =>
  Object.entries(selectedLog.value?.changes || {}).map(([field, change]) => ({
    field,
    change: change as OperationLogChange,
  })),
)

const moduleLabel = operationModuleLabel

// 角色快照按操作发生时的身份显示，不跟随用户当前角色变化。
function roleLabel(role: string): string {
  return role === 'admin' ? '管理员' : '普通用户'
}

// 数据库时间由浏览器统一转换为当前管理端时区。
function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

// 资源类型和标识组合展示，缺少具体对象时仍保留类型语义。
function resourceLabel(log: Pick<OperationLogItem, 'resourceType' | 'resourceId'>): string {
  if (!log.resourceType && !log.resourceId) return '-'
  return [log.resourceType, log.resourceId].filter(Boolean).join(' · ')
}

// 字段名优先使用产品标签，未知扩展字段保留原始编码。
function fieldLabel(field: string): string {
  return fieldLabels[field] || field
}

// 复杂变更值使用格式化 JSON，布尔和空值转换为可理解的审计语义。
function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '空'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

// Request ID 可直接粘贴到 PM2 日志查询命令中定位同一次请求。
async function copyRequestId(requestId: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(requestId)
    ElMessage.success('Request ID 已复制')
  } catch {
    ElMessage.error('复制失败，请手动选择 Request ID')
  }
}

// 管理端统一优先展示后端业务错误，没有响应体时使用页面兜底文案。
function apiErrorMessage(error: unknown, fallback: string): string {
  return (error as ApiFailureShape)?.response?.data?.errMsg || fallback
}

// 已应用筛选与草稿筛选隔离，分页时不会带入尚未查询的输入。
function copyFilters(target: AuditFilters, source: AuditFilters): void {
  target.role = source.role
  target.module = source.module
  target.result = source.result
  target.action = source.action
  target.keyword = source.keyword.trim()
  target.timeRange =
    Array.isArray(source.timeRange) && source.timeRange.length === 2
      ? [new Date(source.timeRange[0]), new Date(source.timeRange[1])]
      : null
}

// 已提交条件同步到地址栏，使下钻链接、清除和刷新后的页面状态保持一致。
function syncFilterQuery(filters: AuditFilters): void {
  const query: Record<string, string> = {}
  if (filters.role !== 'all') query.role = filters.role
  if (filters.module) query.module = filters.module
  if (filters.result) query.result = filters.result
  if (filters.action) query.action = filters.action
  if (filters.keyword) query.keyword = filters.keyword
  if (Array.isArray(filters.timeRange) && filters.timeRange.length === 2) {
    query.startAt = filters.timeRange[0].toISOString()
    query.endAt = filters.timeRange[1].toISOString()
  }
  void router.replace({ name: 'admin-operation-logs', query })
}

// 列表始终使用已提交筛选条件，保持搜索和分页状态一致。
async function loadLogs(): Promise<void> {
  const requestId = ++latestListRequestId
  loading.value = true
  try {
    const timeRange = appliedFilters.timeRange
    const hasTimeRange = Array.isArray(timeRange) && timeRange.length === 2
    const data = await getOperationLogs({
      page: pagination.page,
      pageSize: pagination.pageSize,
      role: appliedFilters.role === 'all' ? undefined : appliedFilters.role,
      module: appliedFilters.module || undefined,
      result: appliedFilters.result || undefined,
      action: appliedFilters.action || undefined,
      keyword: appliedFilters.keyword || undefined,
      startAt: hasTimeRange ? timeRange[0].toISOString() : undefined,
      endAt: hasTimeRange ? timeRange[1].toISOString() : undefined,
    })
    if (requestId !== latestListRequestId) return
    logs.value = data.list || []
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
  } catch (error) {
    if (requestId !== latestListRequestId) return
    logs.value = []
    pagination.total = 0
    ElMessage.error(apiErrorMessage(error, '操作日志加载失败'))
  } finally {
    if (requestId === latestListRequestId) loading.value = false
  }
}

// 角色标签属于主筛选入口，切换后立即提交并回到第一页。
async function changeRole(role: string): Promise<void> {
  draftFilters.role = role
  copyFilters(appliedFilters, draftFilters)
  syncFilterQuery(appliedFilters)
  pagination.page = 1
  await loadLogs()
}

// 查询时提交当前草稿条件，并从第一页读取结果。
function applyFilters(): void {
  copyFilters(appliedFilters, draftFilters)
  syncFilterQuery(appliedFilters)
  pagination.page = 1
  void loadLogs()
}

// 重置保留当前每页数量，其余筛选恢复默认值。
function resetFilters(): void {
  draftFilters.role = 'all'
  draftFilters.module = ''
  draftFilters.result = ''
  draftFilters.action = ''
  draftFilters.keyword = ''
  draftFilters.timeRange = null
  applyFilters()
}

// 下钻行为以可见标签呈现，清除后保留其余时间、角色和模块条件。
function clearActionFilter(): void {
  draftFilters.action = ''
  applyFilters()
}

// 路由查询只接受页面可识别的筛选值，非法值回退为默认条件。
function initializeFiltersFromRoute(): void {
  const role = typeof route.query.role === 'string' ? route.query.role : ''
  const module = typeof route.query.module === 'string' ? route.query.module : ''
  const result = typeof route.query.result === 'string' ? route.query.result : ''
  const keyword =
    typeof route.query.keyword === 'string' ? route.query.keyword.trim().slice(0, 100) : ''
  const action =
    typeof route.query.action === 'string' ? route.query.action.trim().slice(0, 128) : ''
  const startAt = typeof route.query.startAt === 'string' ? new Date(route.query.startAt) : null
  const endAt = typeof route.query.endAt === 'string' ? new Date(route.query.endAt) : null

  draftFilters.role = ['all', 'admin', 'student'].includes(role) ? role : 'all'
  draftFilters.module = moduleOptions.some((option) => option.value === module) ? module : ''
  draftFilters.result = ['success', 'failure'].includes(result) ? result : ''
  draftFilters.action = action
  draftFilters.keyword = keyword
  draftFilters.timeRange =
    startAt &&
    endAt &&
    !Number.isNaN(startAt.getTime()) &&
    !Number.isNaN(endAt.getTime()) &&
    startAt <= endAt
      ? [startAt, endAt]
      : null
  copyFilters(appliedFilters, draftFilters)
}

// 页码变化继续复用已应用筛选条件。
function handlePageChange(page: number): void {
  pagination.page = page
  void loadLogs()
}

// 每页数量变化后回到第一页，防止落入超出总页数的页码。
function handlePageSizeChange(pageSize: number): void {
  pagination.pageSize = pageSize
  pagination.page = 1
  void loadLogs()
}

// 详情按需读取敏感变更值，抽屉先展示加载状态避免残留上一条记录。
async function openDetail(id: string): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true
  selectedLog.value = null
  try {
    selectedLog.value = await getOperationLogDetail(id)
  } catch (error) {
    ElMessage.error(apiErrorMessage(error, '操作详情加载失败'))
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

// 首次进入先承接行为分析下钻条件；普通入口仍读取全部最近操作。
onMounted(() => {
  initializeFiltersFromRoute()
  void loadLogs()
})
</script>

<style scoped lang="scss">
.operation-logs-page {
  --operation-log-table-height: calc(100vh - var(--nav-height) - 280px);

  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 18px;
  padding: 30px 32px;
  background: #f8fafc;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  margin: 0;
  color: #0f172a;
  font-size: 1.5rem;
  font-weight: 800;
}

.page-desc {
  margin: 7px 0 0;
  color: #94a3b8;
  font-size: 0.86rem;
}

.filter-card {
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.role-filter {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.role-filter__item {
  padding: 8px 15px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #64748b;
  font: inherit;
  font-size: 0.86rem;
  cursor: pointer;
}

.role-filter__item--active {
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 650;
}

.precision-filter {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  gap: 8px;
  margin: -2px 0 14px;
  padding: 7px 9px 7px 11px;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  background: #f5f7ff;
  color: #64748b;
  font-size: 0.76rem;
}

.precision-filter strong {
  color: #4338ca;
}

.precision-filter code {
  overflow: hidden;
  color: #818cf8;
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.precision-filter button {
  display: grid;
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  padding: 0;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #e0e7ff;
  color: #4f46e5;
  font: inherit;
  cursor: pointer;
}

.filter-row {
  display: grid;
  grid-template-columns: 270px 126px 108px minmax(320px, 1fr) max-content;
  column-gap: 16px;
  row-gap: 12px;
  align-items: center;
}

.filter-row > * {
  min-width: 0;
}

.filter-date {
  width: 100% !important;
  min-width: 0;
}

.filter-actions {
  display: flex;
  min-width: max-content;
  gap: 8px;
}

.actor-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.actor-cell strong {
  overflow: hidden;
  color: #334155;
  font-size: 0.86rem;
  text-overflow: ellipsis;
}

.actor-cell span {
  overflow: hidden;
  color: #94a3b8;
  font-size: 0.76rem;
  text-overflow: ellipsis;
}

.detail-content {
  min-height: 240px;
}

.request-id-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;

  code {
    overflow-wrap: anywhere;
    color: #334155;
  }
}

.changes-section {
  margin-top: 26px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-heading h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1rem;
}

.section-heading span {
  color: #94a3b8;
  font-size: 0.78rem;
}

.changes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.change-item {
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  background: #fbfdff;
}

.change-item__field {
  margin-bottom: 10px;
  color: #334155;
  font-size: 0.85rem;
  font-weight: 700;
}

.change-values {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr);
  gap: 8px;
  align-items: stretch;
}

.change-values > div:not(.change-arrow) {
  min-width: 0;
}

.change-values span {
  display: block;
  margin-bottom: 5px;
  color: #94a3b8;
  font-size: 0.72rem;
}

.change-values pre {
  min-height: 42px;
  max-height: 220px;
  margin: 0;
  padding: 10px;
  overflow: auto;
  border-radius: 6px;
  background: #f1f5f9;
  color: #334155;
  font:
    12px/1.5 Consolas,
    Monaco,
    monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.change-arrow {
  display: grid;
  place-items: center;
  padding-top: 22px;
  color: #818cf8;
  font-weight: 800;
}

@media (max-width: 1500px) {
  .filter-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filter-keyword,
  .filter-date {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .operation-logs-page {
    padding: 22px 18px;
  }

  .filter-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .role-filter {
    overflow-x: auto;
  }

  .role-filter__item {
    flex-shrink: 0;
  }

  .change-values {
    grid-template-columns: 1fr;
  }

  .change-arrow {
    padding: 0;
    transform: rotate(90deg);
  }
}
</style>
