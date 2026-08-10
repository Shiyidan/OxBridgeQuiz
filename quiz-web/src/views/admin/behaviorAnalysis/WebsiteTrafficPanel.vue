<!-- 网站访问分析面板：提供周期去重 IP、访问次数、学生注册及每日趋势。 -->
<template>
  <div class="traffic-panel">
    <section class="traffic-filter" aria-label="网站访问统计筛选">
      <div class="quick-ranges">
        <span>快速范围</span>
        <button
          v-for="days in quickRangeOptions"
          :key="days"
          class="quick-range"
          :class="{ 'quick-range--active': activeQuickRange === days }"
          type="button"
          @click="selectQuickRange(days)"
        >
          近 {{ days }} 天
        </button>
      </div>

      <div class="filter-row">
        <div class="filter-field">
          <label>统计日期</label>
          <el-date-picker
            v-model="draftDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            :clearable="false"
            :disabled-date="disableFutureDate"
            @change="handleDateRangeChange"
          />
        </div>
        <div class="refresh-control">
          <div class="refresh-meta" aria-live="polite">
            <span>{{ lastUpdatedText }}</span>
            <span v-if="includesToday" class="live-hint"><i></i>今日数据持续更新</span>
          </div>
          <el-switch v-model="autoRefresh" inline-prompt active-text="自动" inactive-text="手动" />
          <el-button :icon="Refresh" :loading="refreshing" @click="loadAnalytics(false)">
            刷新
          </el-button>
          <el-button type="primary" @click="applyFilters">查询</el-button>
        </div>
      </div>
    </section>

    <section v-if="loadError && !analytics" class="initial-error" aria-live="assertive">
      <el-result icon="error" title="网站访问统计加载失败" :sub-title="loadError">
        <template #extra>
          <el-button type="primary" @click="loadAnalytics(false)">重新加载</el-button>
        </template>
      </el-result>
    </section>

    <el-alert
      v-if="loadError && analytics"
      type="warning"
      :closable="false"
      show-icon
      :title="`刷新失败，当前显示上次成功数据：${loadError}`"
    />

    <div v-if="!loadError || analytics" v-loading="loading" class="traffic-content">
      <section class="overview-strip" aria-label="网站访问核心指标">
        <article v-for="metric in overviewMetrics" :key="metric.key" class="overview-metric">
          <span>{{ metric.label }}</span>
          <strong>{{ formatInteger(metric.value) }}</strong>
          <small :class="changeClass(metric.changeRate)">
            {{ changeText(metric.changeRate, metric.value) }}
          </small>
        </article>
      </section>

      <section class="panel trend-panel">
        <div class="panel-heading">
          <div>
            <h3>网站访问与注册趋势</h3>
            <p>折线为访问次数，柱形为新增学生注册；均按北京时间自然日统计</p>
          </div>
          <span>{{ periodText }}</span>
        </div>
        <WebsiteTrafficTrendChart :items="analytics?.trend || []" />
      </section>

      <section class="distribution-grid" aria-label="注册学生分布分析">
        <article class="panel distribution-panel">
          <div class="panel-heading">
            <div>
              <h3>注册学生地址分布</h3>
              <p>按注册时 IP 聚合至国家和地区，不展示具体地址</p>
            </div>
            <span>{{ locationCoverageText }}</span>
          </div>

          <RegistrationLocationChart :items="locationItems" />
        </article>

        <article class="panel distribution-panel source-panel">
          <div class="panel-heading">
            <div>
              <h3>用户来源分布</h3>
              <p>用于分析注册学生首次访问网站的渠道来源</p>
            </div>
            <el-tag type="info" effect="plain" round>待开发</el-tag>
          </div>
          <div class="source-placeholder">
            <strong>来源标记接入后展示</strong>
            <p>后续可区分直接访问、搜索引擎、外部链接和推广活动等来源。</p>
          </div>
        </article>
      </section>

      <section class="panel table-panel">
        <div class="panel-heading">
          <div>
            <div class="panel-title-row">
              <h3>每日数据明细</h3>
              <el-tooltip placement="top" effect="light" :show-after="150">
                <template #content>
                  <div class="traffic-definition-tooltip">
                    <p>
                      <strong>独立 IP：</strong>当天访问网站的去重 IP 数量；同一 IP 当天访问多次只算
                      1 个。
                    </p>
                    <p>
                      <strong>访问次数：</strong>当天网站被完整加载的总次数；同一 IP
                      多次访问会累计。
                    </p>
                  </div>
                </template>
                <button
                  class="definition-tooltip-trigger"
                  type="button"
                  aria-label="查看每日数据指标说明"
                >
                  <QuestionFilled />
                </button>
              </el-tooltip>
            </div>
            <p>精确值用于核对图表变化，不展示或导出具体 IP 摘要</p>
          </div>
          <span>{{ analytics?.trend.length || 0 }} 个自然日</span>
        </div>
        <AdminDataTable
          :data="dailyDetailItems"
          :loading="loading"
          empty-text="当前范围暂无网站访问与注册数据"
          max-height="480px"
        >
          <el-table-column prop="date" label="日期" min-width="130" />
          <el-table-column prop="uniqueIpCount" label="独立 IP" min-width="110" align="right" />
          <el-table-column prop="visitCount" label="访问次数" min-width="110" align="right" />
          <el-table-column label="IP 平均访问" min-width="125" align="right">
            <template #default="{ row }">
              {{ averageVisits(row.visitCount, row.uniqueIpCount) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="registrationCount"
            label="注册人数"
            min-width="110"
            align="right"
          />
        </AdminDataTable>
      </section>
    </div>

    <p class="data-note">
      独立 IP 使用服务端 HMAC
      摘要去重，不保存明文地址；顶部为所选周期内去重值，趋势为每日去重值。注册地址仅以国家和地区聚合展示。访问次数按每次完整加载网站累计，管理员登录状态下的内部访问不计入。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled, Refresh } from '@element-plus/icons-vue'
import {
  getTrafficAnalytics,
  type TrafficAnalyticsResult,
  type TrafficRegistrationLocationItem,
} from '@/api/admin'
import { getApiErrorMessage } from '@/utils/request'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import RegistrationLocationChart from './RegistrationLocationChart.vue'
import WebsiteTrafficTrendChart from './WebsiteTrafficTrendChart.vue'

interface OverviewMetric {
  key: string
  label: string
  value: number
  changeRate: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000
const AUTO_REFRESH_MS = 5 * 60 * 1000
const quickRangeOptions = [7, 30, 90] as const
const LOCATION_VISIBLE_LOCATION_LIMIT = 8

const analytics = ref<TrafficAnalyticsResult | null>(null)
const loading = ref(false)
const refreshing = ref(false)
const loadError = ref('')
const autoRefresh = ref(true)
const activeQuickRange = ref<(typeof quickRangeOptions)[number] | null>(30)
const draftDateRange = ref<[Date, Date]>(recentDateRange(30))
const appliedDateRange = ref<[Date, Date]>(recentDateRange(30))
let latestRequestId = 0
let refreshTimer: number | null = null

// 最近日期范围以北京时间今天为末日，避免管理员浏览器时区改变统计边界。
function recentDateRange(days: number): [Date, Date] {
  const end = chinaCalendarDate()
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  return [start, end]
}

// 当前北京时间日历值转换为日期选择器可以稳定显示的本地日期。
function chinaCalendarDate(now = new Date()): Date {
  const value = new Date(now.getTime() + CHINA_TIMEZONE_OFFSET_MS)
  return new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
}

// 日期输入统一序列化为无时区歧义的日历文本。
function formatDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// API 起始时间固定落在北京时间自然日零点。
function chinaDayStart(value: Date): Date {
  return new Date(`${formatDate(value)}T00:00:00.000+08:00`)
}

// 结束日期转换成下一日零点，覆盖完整末日并保持半开区间语义。
function exclusiveEnd(value: Date): Date {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() + 1)
  return chinaDayStart(result)
}

// 首屏指标保持固定三项，并与同长度上一周期进行一致比较。
const overviewMetrics = computed<OverviewMetric[]>(() => [
  {
    key: 'unique-ip',
    label: '独立 IP',
    value: analytics.value?.overview.uniqueIpCount || 0,
    changeRate: analytics.value?.overview.uniqueIpChangeRate ?? null,
  },
  {
    key: 'visits',
    label: '访问次数',
    value: analytics.value?.overview.visitCount || 0,
    changeRate: analytics.value?.overview.visitCountChangeRate ?? null,
  },
  {
    key: 'registrations',
    label: '新增学生注册',
    value: analytics.value?.overview.registrationCount || 0,
    changeRate: analytics.value?.overview.registrationCountChangeRate ?? null,
  },
])

// 每日明细使用趋势数据的副本按日期倒序展示，同时保留图表所需的正序趋势。
const dailyDetailItems = computed(() =>
  [...(analytics.value?.trend || [])].sort((left, right) => right.date.localeCompare(left.date)),
)

// 地址列表保留前八项，其余合并为“其他地区”，兼顾地区明细与图表可读性。
const locationItems = computed<TrafficRegistrationLocationItem[]>(() => {
  const items = analytics.value?.locationDistribution.items || []
  if (items.length <= LOCATION_VISIBLE_LOCATION_LIMIT) return items

  const leadingItems = items.slice(0, LOCATION_VISIBLE_LOCATION_LIMIT)
  const remainingItems = items.slice(LOCATION_VISIBLE_LOCATION_LIMIT)
  return [
    ...leadingItems,
    {
      location: '其他地区',
      registrationCount: remainingItems.reduce((sum, item) => sum + item.registrationCount, 0),
      percentage: Math.min(
        100,
        remainingItems.reduce((sum, item) => sum + item.percentage, 0),
      ),
    },
  ]
})

// 定位覆盖率明确区分已解析与全部注册人数，避免未知地区被误认为零注册。
const locationCoverageText = computed(() => {
  const distribution = analytics.value?.locationDistribution
  if (!distribution) return '等待查询'
  return `已定位 ${formatInteger(distribution.resolvedRegistrationCount)} / ${formatInteger(distribution.totalRegistrationCount)} 人`
})

// 周期文案读取接口边界，保证与实际查询结果而非筛选草稿一致。
const periodText = computed(() => {
  if (!analytics.value) return '等待查询'
  const start = new Date(analytics.value.period.startAt)
  const end = new Date(new Date(analytics.value.period.endAt).getTime() - 1)
  return `${formatChinaDate(start)} 至 ${formatChinaDate(end)}`
})

// 仅当已应用范围包含北京时间今天时提示数据仍会变化。
const includesToday = computed(() => {
  const [start, end] = appliedDateRange.value
  const today = formatDate(chinaCalendarDate())
  return formatDate(start) <= today && formatDate(end) >= today
})

// 更新时间使用北京时间并保留秒级精度，便于管理员判断自动刷新是否运行。
const lastUpdatedText = computed(() => {
  if (!analytics.value) return '尚未更新'
  return `更新于 ${new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(analytics.value.generatedAt))}`
})

// 趋势周期显示固定按北京时间解释接口时间。
function formatChinaDate(value: Date): string {
  return new Date(value.getTime() + CHINA_TIMEZONE_OFFSET_MS).toISOString().slice(0, 10)
}

// 大数字使用本地千分位，避免流量增长后指标难以扫读。
function formatInteger(value: number): string {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value)
}

// 上期为零时只表达“新增”或“暂无数据”，不构造无限增长率。
function changeText(value: number | null, current: number): string {
  if (value === null) return current > 0 ? '上期为 0，本期新增' : '上期暂无数据'
  if (Math.abs(value) < 0.0005) return '与上期持平'
  return `较上期 ${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`
}

// 变化颜色只传达方向，不把暂无基线误绘制成增长或下降。
function changeClass(value: number | null): Record<string, boolean> {
  return {
    'metric-change': true,
    'metric-change--up': value !== null && value > 0,
    'metric-change--down': value !== null && value < 0,
    'metric-change--neutral': value === null || value === 0,
  }
}

// 明细中的频次只在存在独立 IP 时计算，空日保持明确占位。
function averageVisits(visitCount: number, uniqueIpCount: number): string {
  return uniqueIpCount > 0 ? (visitCount / uniqueIpCount).toFixed(1) : '—'
}

// 未来日期不允许进入尚未发生的趋势范围。
function disableFutureDate(value: Date): boolean {
  return formatDate(value) > formatDate(chinaCalendarDate())
}

// 手动修改日期后取消快捷范围高亮，避免显示错误的筛选来源。
function handleDateRangeChange(): void {
  activeQuickRange.value = null
}

// 快捷范围选中即提交查询，覆盖日常高频查看路径。
function selectQuickRange(days: (typeof quickRangeOptions)[number]): void {
  activeQuickRange.value = days
  draftDateRange.value = recentDateRange(days)
  applyFilters()
}

// 查询前约束 1 至 90 个完整自然日，并复制筛选值隔离半成品输入。
function applyFilters(): void {
  const [startAt, endDate] = draftDateRange.value
  const durationMs = exclusiveEnd(endDate).getTime() - chinaDayStart(startAt).getTime()
  if (durationMs <= 0 || durationMs > 90 * DAY_MS) {
    ElMessage.warning('统计时间范围需在 1 至 90 天内')
    return
  }
  appliedDateRange.value = [new Date(startAt), new Date(endDate)]
  void loadAnalytics(false)
}

// 请求竞态只接受最后一次响应；后台刷新保留已有图表，避免五分钟一次的界面闪烁。
async function loadAnalytics(background: boolean): Promise<void> {
  if (background && (document.hidden || !autoRefresh.value)) return
  const requestId = ++latestRequestId
  if (analytics.value) refreshing.value = true
  else loading.value = true
  loadError.value = ''
  const [startAt, endDate] = appliedDateRange.value
  try {
    const data = await getTrafficAnalytics({
      startAt: chinaDayStart(startAt).toISOString(),
      endAt: exclusiveEnd(endDate).toISOString(),
    })
    if (requestId === latestRequestId) analytics.value = data
  } catch (error) {
    if (requestId === latestRequestId) {
      loadError.value = getApiErrorMessage(error, '网站访问统计加载失败，请重试')
    }
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
      refreshing.value = false
    }
  }
}

// 自动刷新开关控制唯一计时器，切换时不会叠加后台请求。
function syncAutoRefreshTimer(): void {
  if (refreshTimer !== null) window.clearInterval(refreshTimer)
  refreshTimer = null
  if (!autoRefresh.value) return
  refreshTimer = window.setInterval(() => void loadAnalytics(true), AUTO_REFRESH_MS)
}

watch(autoRefresh, syncAutoRefreshTimer)

onMounted(() => {
  void loadAnalytics(false)
  syncAutoRefreshTimer()
})

onBeforeUnmount(() => {
  if (refreshTimer !== null) window.clearInterval(refreshTimer)
})
</script>

<style scoped lang="scss">
.traffic-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.traffic-filter,
.overview-strip,
.panel,
.initial-error {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.traffic-filter {
  padding: 18px 20px;
}

.initial-error {
  padding: 12px;
}

.quick-ranges {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.quick-ranges > span {
  margin-right: 4px;
  color: #64748b;
  font-size: 0.8rem;
}

.quick-range {
  padding: 6px 11px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  color: #64748b;
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

.quick-range:hover,
.quick-range:focus-visible,
.quick-range--active {
  border-color: #a5b4fc;
  background: #eef2ff;
  color: #4f46e5;
}

.quick-range:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.filter-row {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) max-content;
  gap: 18px;
  align-items: end;
}

.filter-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 7px;
}

.filter-field label {
  color: #64748b;
  font-size: 0.78rem;
}

.filter-field :deep(.el-date-editor) {
  width: 100%;
}

.refresh-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.refresh-meta {
  display: flex;
  min-width: 132px;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  color: #94a3b8;
  font-size: 0.7rem;
}

.live-hint {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #0f766e;
}

.live-hint i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #14b8a6;
}

.traffic-content {
  display: flex;
  min-height: 420px;
  flex-direction: column;
  gap: 18px;
}

.overview-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
}

.overview-metric {
  min-width: 0;
  padding: 22px 24px;
}

.overview-metric + .overview-metric {
  border-left: 1px solid #e2e8f0;
}

.overview-metric > span {
  display: block;
  margin-bottom: 10px;
  color: #64748b;
  font-size: 0.8rem;
}

.overview-metric strong {
  display: block;
  margin-bottom: 8px;
  color: #0f172a;
  font-size: 1.8rem;
  line-height: 1;
}

.overview-metric small {
  font-size: 0.72rem;
}

.metric-change--up {
  color: #059669;
}

.metric-change--down {
  color: #dc2626;
}

.metric-change--neutral {
  color: #94a3b8;
}

.panel {
  min-width: 0;
  padding: 20px;
}

.trend-panel {
  overflow: hidden;
}

.distribution-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.distribution-panel {
  min-height: 340px;
}

.source-panel {
  display: flex;
  flex-direction: column;
}

.source-placeholder {
  display: flex;
  flex: 1;
  min-height: 230px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px;
  text-align: center;
}

.source-placeholder strong {
  color: #334155;
  font-size: 0.95rem;
}

.source-placeholder p {
  max-width: 34rem;
  margin: 9px 0 0;
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.7;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-heading h3,
.panel-heading p {
  margin: 0;
}

.panel-heading h3 {
  color: #1e293b;
  font-size: 1rem;
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 7px;
}

.definition-tooltip-trigger {
  display: inline-flex;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #fff;
  color: #64748b;
  cursor: help;
}

.definition-tooltip-trigger:hover,
.definition-tooltip-trigger:focus-visible {
  border-color: #818cf8;
  color: #4f46e5;
}

.definition-tooltip-trigger:focus-visible {
  outline: 2px solid #c7d2fe;
  outline-offset: 2px;
}

.traffic-definition-tooltip {
  max-width: 360px;
  color: #334155;
  line-height: 1.6;
}

.traffic-definition-tooltip p {
  margin: 0;
}

.traffic-definition-tooltip p + p {
  margin-top: 8px;
}

.panel-heading p {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 0.75rem;
}

.panel-heading > span {
  flex-shrink: 0;
  color: #64748b;
  font-size: 0.76rem;
}

.table-panel {
  padding-bottom: 18px;
}

.data-note {
  margin: 0;
  color: #94a3b8;
  font-size: 0.74rem;
  line-height: 1.7;
  text-align: center;
}

@media (max-width: 1280px) {
  .filter-row,
  .distribution-grid {
    grid-template-columns: 1fr;
  }

  .refresh-control {
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .quick-ranges {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .quick-ranges > span {
    width: 100%;
  }

  .overview-strip {
    grid-template-columns: 1fr;
  }

  .overview-metric + .overview-metric {
    border-top: 1px solid #e2e8f0;
    border-left: 0;
  }

  .refresh-control {
    align-items: stretch;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .refresh-meta {
    width: 100%;
    align-items: flex-start;
  }

  .panel {
    padding: 17px 14px;
  }
}
</style>
