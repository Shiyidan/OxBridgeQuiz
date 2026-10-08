<!-- 后台口语推广页签：统计打开介绍次数、去重人数和按次数排序的用户明细。 -->
<template>
  <div class="oral-analytics">
    <section class="oral-filter">
      <div class="oral-filter__ranges">
        <span>统计日期</span>
        <AppButton
          v-for="days in [7, 30, 90]"
          :key="days"
          :type="quickRange === days ? 'primary' : 'secondary'"
          size="small"
          @click="selectRange(days)"
          >近 {{ days }} 天</AppButton
        >
      </div>
      <div class="oral-filter__actions">
        <el-date-picker
          v-model="draftRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :clearable="false"
          :disabled-date="disableFutureDate"
          @change="quickRange = null"
        />
        <AppButton size="small" :loading="loading" @click="applyFilters">查询</AppButton>
        <AppButton type="secondary" size="small" @click="resetFilters">重置</AppButton>
      </div>
      <p>仅统计已登录普通学生打开口语介绍的行为，当前封禁账号不计入。日期按北京时间计算。</p>
    </section>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon>
      <AppButton type="link" size="small" @click="load">重新加载</AppButton>
    </el-alert>
    <div v-loading="loading" :aria-busy="loading" class="oral-results">
      <template v-if="data">
        <div class="oral-metrics">
          <article>
            <span>点击次数</span
            ><strong>{{ data.overview.clickCount.toLocaleString('zh-CN') }}</strong>
            <p>所选期间打开介绍的总次数</p>
          </article>
          <article>
            <span>点击人数</span
            ><strong>{{ data.overview.userCount.toLocaleString('zh-CN') }}</strong>
            <p>按用户账号去重，同一用户只计一人</p>
          </article>
        </div>
        <section class="oral-table">
          <div class="oral-table__heading">
            <div>
              <h3>用户点击明细</h3>
              <p>按点击次数从高到低排列 · {{ appliedPeriod }}</p>
            </div>
            <span>共 {{ data.overview.userCount }} 人</span>
          </div>
          <el-table :data="data.list" row-key="userId" empty-text="所选期间暂无点击记录">
            <el-table-column label="序号" width="80"
              ><template #default="{ $index }">{{
                (pagination.page - 1) * pagination.pageSize + $index + 1
              }}</template></el-table-column
            >
            <el-table-column prop="username" label="用户名" min-width="160" show-overflow-tooltip />
            <el-table-column prop="email" label="邮箱" min-width="230" show-overflow-tooltip />
            <el-table-column prop="clickCount" label="点击次数" width="130" align="right" />
          </el-table>
          <AppPagination
            v-model:page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            @page-change="load"
            @page-size-change="changePageSize"
          />
        </section>
      </template>
      <el-skeleton v-else-if="loading" :rows="6" animated />
    </div>
    <p class="oral-note">
      只记录打开介绍；悬浮、曝光、关闭和点击咨询不计数。关闭后重新打开会再计一次。历史匿名日志不回填，数据从本功能更新后开始累计。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AppButton from '@/components/AppButton.vue'
import AppPagination from '@/components/AppPagination.vue'
import { getOralPromotionAnalytics, type OralPromotionAnalytics } from '@/api/promotion'
import { getApiErrorMessage } from '@/utils/request'

const DAY_MS = 86400000
const data = ref<OralPromotionAnalytics | null>(null)
const loading = ref(false)
const error = ref('')
const quickRange = ref<number | null>(30)
const draftRange = ref<[string, string]>(recentRange(30))
let appliedRange: [string, string] = [...draftRange.value]
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })
let requestId = 0

// 日期选择器统一使用北京时间自然日字符串，管理员所在时区不改变统计边界。
function chinaToday(): string {
  return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
}

// 快捷范围完整覆盖今天及此前若干自然日。
function recentRange(days: number): [string, string] {
  const end = chinaToday()
  const start = new Date(Date.parse(`${end}T00:00:00+08:00`) - (days - 1) * DAY_MS + 8 * 3600000)
  return [start.toISOString().slice(0, 10), end]
}

// 日期控件提供本地日历对象，仅比较日历日期，禁止选择北京时间未来日期。
function disableFutureDate(value: Date): boolean {
  const calendarDate = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  return calendarDate > chinaToday()
}

// 明细标题依据成功响应的统计时间，避免展示尚未提交的筛选草稿。
const appliedPeriod = computed(() => {
  if (!data.value) return ''
  const start = new Date(Date.parse(data.value.period.startAt) + 8 * 3600000)
    .toISOString()
    .slice(0, 10)
  const end = new Date(Date.parse(data.value.period.endAt) - 1 + 8 * 3600000)
    .toISOString()
    .slice(0, 10)
  return `${start} 至 ${end}`
})

// 翻页始终沿用已提交日期，晚返回的请求不能覆盖新的筛选结果。
async function load(): Promise<void> {
  const current = ++requestId
  loading.value = true
  error.value = ''
  try {
    const result = await getOralPromotionAnalytics({
      startAt: new Date(`${appliedRange[0]}T00:00:00+08:00`).toISOString(),
      endAt: new Date(Date.parse(`${appliedRange[1]}T00:00:00+08:00`) + DAY_MS).toISOString(),
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    if (current !== requestId) return
    data.value = result
    Object.assign(pagination, {
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
      total: result.pagination.total,
    })
  } catch (cause) {
    if (current !== requestId) return
    data.value = null
    error.value = getApiErrorMessage(cause, '口语推广统计暂时无法加载，请重试。')
  } finally {
    if (current === requestId) loading.value = false
  }
}

// 查询先提交完整日期再回到第一页，防止将输入中的草稿带入分页。
function applyFilters(): void {
  const range = draftRange.value
  const duration = range?.length === 2 ? Date.parse(range[1]) - Date.parse(range[0]) : NaN
  if (
    !Number.isFinite(duration) ||
    duration < 0 ||
    duration >= 90 * DAY_MS ||
    range[1] > chinaToday()
  ) {
    ElMessage.warning('请选择不超过 90 天且不包含未来日期的范围')
    return
  }
  appliedRange = [...range]
  pagination.page = 1
  void load()
}

// 快捷日期选择直接查询对应范围，保留用户选择的每页条数。
function selectRange(days: number): void {
  quickRange.value = days
  draftRange.value = recentRange(days)
  applyFilters()
}

// 重置回到近 30 天，分页大小保持不变。
function resetFilters(): void {
  selectRange(30)
}

// 每页条数改变后从第一名重新读取，日期继续使用已提交条件。
function changePageSize(): void {
  pagination.page = 1
  void load()
}

// 页签首次打开读取统计，切换回来由 KeepAlive 保留查询与分页状态。
onMounted(() => {
  void load()
})
</script>

<style scoped>
.oral-analytics {
  display: grid;
  gap: 20px;
}
.oral-filter,
.oral-table,
.oral-metrics article {
  padding: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}
.oral-filter__ranges,
.oral-filter__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.oral-filter__ranges {
  margin-bottom: 16px;
}
.oral-filter__ranges > span {
  font-size: 13px;
  color: #64748b;
}
.oral-filter__actions :deep(.el-date-editor) {
  max-width: 100%;
  flex: 0 1 320px;
}
.oral-filter p,
.oral-note {
  margin: 14px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.8;
}
.oral-results {
  min-height: 150px;
}
.oral-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 20px;
}
.oral-metrics span {
  color: #64748b;
  font-size: 14px;
}
.oral-metrics strong {
  display: block;
  margin: 12px 0;
  font-size: 32px;
  color: #51418a;
}
.oral-metrics p {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
}
.oral-table {
  min-width: 0;
}
.oral-table__heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 18px;
}
.oral-table__heading h3 {
  margin: 0;
  font-size: 16px;
}
.oral-table__heading p,
.oral-table__heading > span {
  margin: 8px 0 0;
  font-size: 12px;
  color: #64748b;
}
.oral-note {
  margin-top: 0;
}
@media (max-width: 600px) {
  .oral-filter,
  .oral-table,
  .oral-metrics article {
    padding: 16px;
  }
  .oral-metrics {
    gap: 10px;
  }
}
</style>
