<!-- 员工管理页面：以接收用户为主体展示管理员成功发放日卡的汇总。 -->
<template>
  <div class="staff-page">
    <div class="page-heading">
      <div>
        <h2 class="page-title">员工管理</h2>
        <p class="page-desc">按接收用户统计管理员赠送日卡的情况，仅计入成功发放记录。</p>
      </div>
    </div>

    <section class="overview-grid" aria-label="日卡发放总览">
      <article v-for="item in overviewCards" :key="item.key" class="overview-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.note }}</small>
      </article>
    </section>

    <section class="stats-panel">
      <div class="panel-heading">
        <div>
          <h3>用户获赠统计</h3>
          <p>每行对应一位接收用户，展示累计获赠情况及发放管理员。</p>
        </div>
        <div class="search-row">
          <el-input
            v-model="draftKeyword"
            clearable
            placeholder="搜索接收用户名称或邮箱"
            @keyup.enter="applySearch"
            @clear="applySearch"
          />
          <el-button type="primary" @click="applySearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
      </div>

      <AdminDataTable
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :data="staffRows"
        :loading="loading"
        :total="pagination.total"
        empty-text="暂无用户获赠记录"
        show-pagination
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <el-table-column label="接收用户" min-width="230" fixed="left">
          <template #default="{ row }">
            <div class="staff-cell">
              <strong>{{ row.username }}</strong>
              <span>{{ row.email || '账号已不存在或暂无邮箱' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="获赠次数" min-width="120" align="center">
          <template #default="{ row }">
            <span class="metric-value">{{ row.grantCount }} 次</span>
          </template>
        </el-table-column>
        <el-table-column label="日卡张数" min-width="120" align="center">
          <template #default="{ row }">
            <strong class="card-count">{{ row.cardCount }} 张</strong>
          </template>
        </el-table-column>
        <el-table-column label="已使用" min-width="120" align="center">
          <template #default="{ row }">
            <strong class="used-card-count">{{ row.usedCardCount }} 张</strong>
          </template>
        </el-table-column>
        <el-table-column label="发放管理员" min-width="180" align="center">
          <template #default="{ row }">
            <div class="staff-names">
              <el-tag v-for="name in row.staffNames" :key="name" effect="plain" round>
                {{ name }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最近发放时间" min-width="190" align="center">
          <template #default="{ row }">
            <span :class="['last-granted-at', { 'last-granted-at--empty': !row.latestGrantedAt }]">
              {{ row.latestGrantedAt ? formatDateTime(row.latestGrantedAt) : '尚未发放' }}
            </span>
          </template>
        </el-table-column>
      </AdminDataTable>
    </section>
  </div>
</template>

<script setup lang="ts">
// 员工管理页面：从管理员赠卡审计数据读取总览，并按接收用户汇总和检索。
import { computed, onMounted, reactive, ref } from 'vue'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import { getAdminStaffGiftCardStats, type AdminStaffGiftCardStatsItem } from '@/api/admin'

const staffRows = ref<AdminStaffGiftCardStatsItem[]>([])
const loading = ref(false)
const draftKeyword = ref('')
const appliedKeyword = ref('')
const overview = reactive({
  staffCount: 0,
  grantCount: 0,
  cardCount: 0,
  recipientCount: 0,
})
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
let latestRequestId = 0

// 总览卡片补充统计口径，避免把操作次数和实际日卡张数混淆。
const overviewCards = computed(() => [
  { key: 'staff', label: '管理员人数', value: overview.staffCount, note: '当前管理员账号' },
  { key: 'grants', label: '累计发放次数', value: overview.grantCount, note: '成功赠送操作' },
  { key: 'cards', label: '累计日卡张数', value: overview.cardCount, note: '实际生成日卡' },
  { key: 'recipients', label: '覆盖用户数', value: overview.recipientCount, note: '接收用户去重' },
])

// 后端时间统一由浏览器按当前管理端时区显示。
function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

// 列表请求采用最后一次响应，避免快速搜索或翻页时旧响应覆盖新条件。
async function loadStats(): Promise<void> {
  const requestId = ++latestRequestId
  loading.value = true
  try {
    const data = await getAdminStaffGiftCardStats({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: appliedKeyword.value || undefined,
    })
    if (requestId !== latestRequestId) return
    staffRows.value = data.list || []
    Object.assign(overview, data.overview)
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
  } catch {
    if (requestId !== latestRequestId) return
    staffRows.value = []
    pagination.total = 0
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

// 查询提交当前关键词并回到第一页。
function applySearch(): void {
  appliedKeyword.value = draftKeyword.value.trim()
  pagination.page = 1
  void loadStats()
}

// 重置检索后恢复全部管理员统计。
function resetSearch(): void {
  draftKeyword.value = ''
  appliedKeyword.value = ''
  pagination.page = 1
  void loadStats()
}

// 页码变化继续沿用已提交的搜索条件。
function handlePageChange(page: number): void {
  pagination.page = page
  void loadStats()
}

// 每页数量变化后返回第一页，避免停留在不存在的页码。
function handlePageSizeChange(pageSize: number): void {
  pagination.pageSize = pageSize
  pagination.page = 1
  void loadStats()
}

// 首次进入员工管理时加载当前管理员统计。
onMounted(() => {
  void loadStats()
})
</script>

<style scoped lang="scss">
.staff-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 18px;
  padding: 30px 32px 46px;
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

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.overview-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.overview-card span {
  color: #64748b;
  font-size: 0.8rem;
}

.overview-card strong {
  margin-top: 8px;
  color: #172033;
  font-size: 1.75rem;
  font-weight: 750;
  line-height: 1.1;
}

.overview-card small {
  margin-top: 8px;
  color: #a0aec0;
  font-size: 0.74rem;
}

.stats-panel {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.panel-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 16px;
}

.panel-heading h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1rem;
}

.panel-heading p {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 0.78rem;
}

.search-row {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.search-row :deep(.el-input) {
  width: 260px;
}

.staff-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.staff-cell strong {
  overflow: hidden;
  color: #334155;
  font-size: 0.88rem;
  text-overflow: ellipsis;
}

.staff-cell span {
  overflow: hidden;
  color: #94a3b8;
  font-size: 0.76rem;
  text-overflow: ellipsis;
}

.metric-value {
  color: #475569;
}

.staff-names {
  display: flex;
  justify-content: center;
  gap: 6px;
  flex-wrap: wrap;
}

.card-count {
  color: #4f46e5;
  font-size: 0.95rem;
}

.used-card-count {
  color: #059669;
  font-size: 0.95rem;
}

.last-granted-at {
  color: #475569;
  font-size: 0.82rem;
}

.last-granted-at--empty {
  color: #a0aec0;
}

@media (max-width: 980px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel-heading {
    align-items: stretch;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .staff-page {
    padding: 22px 18px 36px;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .search-row {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .search-row :deep(.el-input) {
    width: 100%;
  }
}
</style>
