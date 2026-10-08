<!-- 用户分析页：通过用户访问、产品使用、转化分析和口语推广组织运营数据。 -->
<template>
  <div class="behavior-analytics-page">
    <div class="page-heading">
      <div>
        <h2 class="page-title">用户行为分析</h2>
        <p class="page-desc">
          后台用户分析统一剔除当前封禁账号，解封后恢复历史统计；匿名及历史未关联账号的访问保留。
        </p>
      </div>
      <div class="scope-badge">
        <span class="scope-badge__dot"></span>
        {{ activeTab === 'traffic' ? '匿名访问与学生注册' : '仅统计普通学生用户' }}
      </div>
    </div>

    <div class="analytics-tabs" role="tablist" aria-label="用户分析视角">
      <button
        v-for="tab in analyticsTabs"
        :id="`analytics-tab-${tab.name}`"
        :key="tab.name"
        class="analytics-tab"
        :class="{ 'analytics-tab--active': activeTab === tab.name }"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.name"
        :aria-controls="`analytics-panel-${tab.name}`"
        :tabindex="activeTab === tab.name ? 0 : -1"
        @click="activeTab = tab.name"
        @keydown="handleTabKeydown($event, tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div
      v-show="activeTab === 'traffic'"
      id="analytics-panel-traffic"
      class="analytics-tab-panel"
      role="tabpanel"
      aria-labelledby="analytics-tab-traffic"
      tabindex="0"
    >
      <WebsiteTrafficPanel />
    </div>

    <div
      v-show="activeTab === 'conversion'"
      id="analytics-panel-conversion"
      class="analytics-tab-panel"
      role="tabpanel"
      aria-labelledby="analytics-tab-conversion"
      tabindex="0"
    >
      <KeepAlive><ConversionAnalyticsPanel v-if="activeTab === 'conversion'" /></KeepAlive>
    </div>

    <div
      v-show="activeTab === 'oral-promotion'"
      id="analytics-panel-oral-promotion"
      class="analytics-tab-panel"
      role="tabpanel"
      aria-labelledby="analytics-tab-oral-promotion"
      tabindex="0"
    >
      <KeepAlive><OralPromotionAnalyticsPanel v-if="activeTab === 'oral-promotion'" /></KeepAlive>
    </div>

    <div
      v-show="activeTab === 'product'"
      id="analytics-panel-product"
      class="analytics-tab-panel"
      role="tabpanel"
      aria-labelledby="analytics-tab-product"
      tabindex="0"
    >
      <section class="filter-card">
        <div class="quick-ranges" aria-label="统计时间快捷选择">
          <span>快捷范围</span>
          <button
            v-for="days in quickRangeOptions"
            :key="days"
            type="button"
            :class="['quick-range', { 'quick-range--active': activeQuickRange === days }]"
            @click="selectQuickRange(days)"
          >
            最近 {{ days }} 天
          </button>
        </div>

        <div class="filter-row">
          <div class="filter-field filter-field--date">
            <label>统计时间</label>
            <el-date-picker
              v-model="draftFilters.dateRange"
              type="daterange"
              unlink-panels
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :disabled-date="disableFutureDate"
              @change="handleDateRangeChange"
            />
          </div>
          <div class="filter-actions">
            <el-button type="primary" @click="applyFilters">查询</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </div>
        </div>
      </section>

      <div v-loading="loading" class="analytics-content">
        <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="loadError" />

        <section class="panel product-panel" aria-label="学生产品使用偏好">
          <div class="panel-heading product-panel__heading">
            <div>
              <h3>产品使用偏好</h3>
              <p>
                练习按成功交卷统计，报告按成功打开正文统计；错题本和收藏夹按成功查看具体题目统计，进入列表不计数。
              </p>
            </div>
            <span class="panel-count">{{ periodText }}</span>
          </div>

          <div class="product-metrics-grid">
            <article
              v-for="card in productMetricCards"
              :key="card.key"
              class="product-metric-card"
              :style="{ '--product-color': card.color }"
            >
              <div class="product-metric-card__label">{{ card.label }}</div>
              <strong>{{ formatInteger(card.value) }}</strong>
              <div class="product-metric-card__meta">
                <span :class="changeClass(card.changeRate)">
                  {{ productChangeText(card) }}
                </span>
                <span>{{ card.detail }}</span>
              </div>
            </article>
          </div>

          <div class="product-insights-grid">
            <article class="product-insight-card">
              <div class="product-insight-card__heading">
                <div>
                  <h4>学习活动使用占比</h4>
                  <p>仅比较已完成的诊断、题库与模考活动</p>
                </div>
                <strong
                  >{{
                    formatInteger(productUsage?.overview.completedActivityCount || 0)
                  }}
                  次</strong
                >
              </div>
              <div class="usage-share-list">
                <div
                  v-for="item in productUsage?.modules || []"
                  :key="item.module"
                  class="usage-share-row"
                >
                  <div class="usage-share-row__meta">
                    <span>{{ productUsageModuleLabel(item.module) }}</span>
                    <span
                      >{{ item.completionCount }} 次 ·
                      {{ formatPercent(item.completionShare) }}</span
                    >
                  </div>
                  <el-progress
                    :percentage="item.completionShare * 100"
                    :stroke-width="9"
                    :show-text="false"
                    :color="PRODUCT_USAGE_MODULE_META[item.module].color"
                  />
                  <div class="usage-share-row__hint">
                    {{ item.userCount }} 名学生，人均 {{ item.averageCompletions.toFixed(1) }} 次
                  </div>
                </div>
              </div>
            </article>

            <article class="product-insight-card">
              <div class="product-insight-card__heading">
                <div>
                  <h4>学生偏好分布</h4>
                  <p>
                    少于
                    {{ productUsage?.scope.preferenceMinimumCompletions || 3 }}
                    次归为数据不足，并列最高归为混合使用
                  </p>
                </div>
                <strong>{{ formatInteger(productUsage?.overview.activeUsers || 0) }} 人</strong>
              </div>
              <div class="preference-list">
                <div
                  v-for="item in productUsage?.preferences || []"
                  :key="item.preference"
                  class="preference-row"
                >
                  <span
                    class="preference-row__dot"
                    :style="{ backgroundColor: PRODUCT_PREFERENCE_META[item.preference].color }"
                  ></span>
                  <span class="preference-row__label">{{
                    productPreferenceLabel(item.preference)
                  }}</span>
                  <strong>{{ item.userCount }} 人</strong>
                  <span>{{ formatPercent(item.userRate) }}</span>
                </div>
              </div>
            </article>
          </div>

          <div class="product-trend-block">
            <div class="product-insight-card__heading">
              <div>
                <h4>每日产品使用趋势</h4>
                <p>按北京时间自然日对比五项核心行为</p>
              </div>
            </div>
            <BehaviorProductTrendChart :items="productUsage?.trend || []" />
          </div>
        </section>

      </div>

      <p class="data-note">
        学习活动按已交卷记录统计，报告按正文读取、错题本与收藏夹按具体题目查看统计；管理员账号不计入。最多查询
        90 天。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getBehaviorAnalytics,
  type BehaviorAnalyticsResult,
  type ProductUsageModuleCode,
} from '@/api/admin'
import BehaviorProductTrendChart from './BehaviorProductTrendChart.vue'
import WebsiteTrafficPanel from './WebsiteTrafficPanel.vue'
import ConversionAnalyticsPanel from './ConversionAnalyticsPanel.vue'
import OralPromotionAnalyticsPanel from './OralPromotionAnalyticsPanel.vue'
import {
  PRODUCT_PREFERENCE_META,
  PRODUCT_USAGE_MODULE_META,
  productPreferenceLabel,
  productUsageModuleLabel,
} from '@/constants/behaviorAnalytics'
import { getApiErrorMessage } from '@/utils/request'

interface BehaviorFilters {
  dateRange: [Date, Date] | null
}

type AnalyticsTab = 'traffic' | 'product' | 'conversion' | 'oral-promotion'

interface AnalyticsTabOption {
  name: AnalyticsTab
  label: string
}

interface ProductMetricCard {
  key: string
  label: string
  value: number
  detail: string
  changeRate: number | null
  color: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000
const quickRangeOptions = [7, 30, 90] as const
const analyticsTabs: AnalyticsTabOption[] = [
  { name: 'traffic', label: '用户访问' },
  { name: 'product', label: '产品使用' },
  { name: 'conversion', label: '转化分析' },
  { name: 'oral-promotion', label: '口语推广' },
]
const activeTab = ref<AnalyticsTab>('traffic')
const analytics = ref<BehaviorAnalyticsResult | null>(null)
const loading = ref(false)
const loadError = ref('')
let latestRequestId = 0
const activeQuickRange = ref<(typeof quickRangeOptions)[number] | null>(30)

// 方向键、Home 和 End 在分析视角间移动并立即激活，补齐标准 Tab 键盘行为。
function handleTabKeydown(event: KeyboardEvent, current: AnalyticsTab): void {
  const currentIndex = analyticsTabs.findIndex((tab) => tab.name === current)
  let nextIndex = currentIndex
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % analyticsTabs.length
  else if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + analyticsTabs.length) % analyticsTabs.length
  } else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = analyticsTabs.length - 1
  else return

  event.preventDefault()
  const nextTab = analyticsTabs[nextIndex]
  if (!nextTab) return

  activeTab.value = nextTab.name
  document.getElementById(`analytics-tab-${nextTab.name}`)?.focus()
}

// 最近天数按北京时间自然日生成，接口统一将结束日转换为半开区间。
function recentDateRange(days: number): [Date, Date] {
  const end = chinaCalendarDate()
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  return [start, end]
}

const draftFilters = reactive<BehaviorFilters>({
  dateRange: recentDateRange(30),
})
const appliedFilters = reactive<BehaviorFilters>({
  dateRange: recentDateRange(30),
})

// 产品指标、占比和趋势复用同一响应，保持日期范围一致。
const productUsage = computed(() => analytics.value?.productUsage || null)

// 三类练习与报告、错题、收藏查看固定顺序展示，题目查看不参与练习完成占比。
const productMetricCards = computed<ProductMetricCard[]>(() => {
  const moduleMap = new Map((productUsage.value?.modules || []).map((item) => [item.module, item]))
  const moduleCard = (module: ProductUsageModuleCode): ProductMetricCard => {
    const item = moduleMap.get(module)
    const meta = PRODUCT_USAGE_MODULE_META[module]
    return {
      key: module,
      label: meta.metricLabel,
      value: item?.completionCount || 0,
      detail: `${item?.userCount || 0} 名学生完成`,
      changeRate: item?.completionChangeRate ?? null,
      color: meta.color,
    }
  }
  const reportOverview = productUsage.value?.overview
  return [
    moduleCard('diagnostic_test'),
    {
      key: 'diagnostic_report',
      label: '查看分析报告次数',
      value: reportOverview?.reportViewCount || 0,
      detail: `${reportOverview?.reportViewerCount || 0} 名学生 · 同期查看率 ${formatPercent(reportOverview?.samePeriodReportViewRate || 0)}`,
      changeRate: reportOverview?.reportViewChangeRate ?? null,
      color: '#7c3aed',
    },
    moduleCard('question_bank'),
    moduleCard('mock_exam'),
    {
      key: 'mistake_notebook',
      label: '查看错题本次数',
      value: reportOverview?.mistakeNotebookViewCount || 0,
      detail: `${reportOverview?.mistakeNotebookViewerCount || 0} 名学生查看题目`,
      changeRate: reportOverview?.mistakeNotebookViewChangeRate ?? null,
      color: '#e11d48',
    },
    {
      key: 'favorite_notebook',
      label: '查看收藏夹次数',
      value: reportOverview?.favoriteNotebookViewCount || 0,
      detail: `${reportOverview?.favoriteNotebookViewerCount || 0} 名学生查看题目`,
      changeRate: reportOverview?.favoriteNotebookViewChangeRate ?? null,
      color: '#ba861c',
    },
  ]
})

// 响应采用结束时间不包含语义，页面展示时还原为用户选择的最后一天。
const periodText = computed(() => {
  if (!analytics.value) return '等待查询'
  const start = new Date(analytics.value.period.startAt)
  const end = new Date(new Date(analytics.value.period.endAt).getTime() - 1)
  return `${formatChinaDate(start)} 至 ${formatChinaDate(end)}`
})

// 日期值统一格式化为无需时区歧义的年月日。
function formatDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 当前北京时间日期转换为日期选择器可稳定展示的本地日历值。
function chinaCalendarDate(now = new Date()): Date {
  const date = new Date(now.getTime() + CHINA_TIMEZONE_OFFSET_MS)
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

// 接口时间按东八区取自然日，展示不依赖管理员浏览器所在时区。
function formatChinaDate(value: Date): string {
  return new Date(value.getTime() + CHINA_TIMEZONE_OFFSET_MS).toISOString().slice(0, 10)
}

// 管理端整数指标使用本地千分位，提升大数量下的可读性。
function formatInteger(value: number): string {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value)
}

// 接口比例为 0 到 1，页面统一转换为百分数。
function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

// 指标卡使用紧凑环比文案。
function compactChangeText(value: number | null): string {
  if (value === null) return '新增'
  if (Math.abs(value) < 0.0005) return '持平'
  return `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`
}

// 当前与上一周期都为零时不标记“新增”，避免空指标产生错误增长暗示。
function productChangeText(card: ProductMetricCard): string {
  if (card.changeRate === null && card.value === 0) return '暂无对比'
  return compactChangeText(card.changeRate)
}

// 增长指标颜色仅表达方向，无法比较时保持中性。
function changeClass(value: number | null): Record<string, boolean> {
  return {
    'metric-change': true,
    'metric-change--up': value !== null && value > 0,
    'metric-change--down': value !== null && value < 0,
    'metric-change--neutral': value === null || value === 0,
  }
}

// 禁止选择未来日期，避免尚未发生的自然日稀释趋势。
function disableFutureDate(value: Date): boolean {
  return formatDate(value) > formatDate(chinaCalendarDate())
}

// 已应用筛选与页面草稿隔离，图表交互和请求期间不会读取半成品输入。
function copyFilters(target: BehaviorFilters, source: BehaviorFilters): void {
  target.dateRange =
    Array.isArray(source.dateRange) && source.dateRange.length === 2
      ? [new Date(source.dateRange[0]), new Date(source.dateRange[1])]
      : null
}

// 日期选择值使用显式东八区边界，避免浏览器所在时区改变统计口径。
function chinaDayStart(value: Date): Date {
  return new Date(`${formatDate(value)}T00:00:00.000+08:00`)
}

// 结束日期加一个日历日并转换成东八区半开区间，完整覆盖用户选择的最后一天。
function exclusiveEnd(value: Date): Date {
  const result = new Date(value)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() + 1)
  return chinaDayStart(result)
}

// 页面始终使用已提交筛选读取一份原子统计响应，保证卡片、占比和趋势口径一致。
async function loadAnalytics(): Promise<void> {
  if (!Array.isArray(appliedFilters.dateRange) || appliedFilters.dateRange.length !== 2) return
  const requestId = ++latestRequestId
  loading.value = true
  loadError.value = ''
  const [startAt, endDate] = appliedFilters.dateRange
  try {
    const data = await getBehaviorAnalytics({
      startAt: chinaDayStart(startAt).toISOString(),
      endAt: exclusiveEnd(endDate).toISOString(),
    })
    if (requestId !== latestRequestId) return
    analytics.value = data
  } catch (error) {
    if (requestId !== latestRequestId) return
    loadError.value = getApiErrorMessage(error, '用户行为统计加载失败')
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

// 快捷范围选中后立即提交查询，减少高频查看最近区间的操作步骤。
function selectQuickRange(days: (typeof quickRangeOptions)[number]): void {
  activeQuickRange.value = days
  draftFilters.dateRange = recentDateRange(days)
  applyFilters()
}

// 手动调整日期后取消快捷项高亮，明确当前范围来自自定义选择。
function handleDateRangeChange(): void {
  activeQuickRange.value = null
}

// 查询前限制完整自然日范围不超过 90 天，并提交当前筛选草稿。
function applyFilters(): void {
  if (!Array.isArray(draftFilters.dateRange) || draftFilters.dateRange.length !== 2) {
    ElMessage.warning('请选择完整的统计时间范围')
    return
  }
  const [startAt, endDate] = draftFilters.dateRange
  const durationMs = exclusiveEnd(endDate).getTime() - chinaDayStart(startAt).getTime()
  if (durationMs <= 0 || durationMs > 90 * DAY_MS) {
    ElMessage.warning('统计时间范围需在 1 至 90 天内')
    return
  }
  copyFilters(appliedFilters, draftFilters)
  void loadAnalytics()
}

// 重置回最近 30 天。
function resetFilters(): void {
  activeQuickRange.value = 30
  draftFilters.dateRange = recentDateRange(30)
  applyFilters()
}

// 首次进入默认读取最近 30 个北京时间自然日。
onMounted(() => {
  void loadAnalytics()
})
</script>

<style scoped lang="scss">
.behavior-analytics-page {
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
  gap: 16px;
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

.scope-badge {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #c7d2fe;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 0.8rem;
  font-weight: 650;
}

.scope-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #6366f1;
}

.analytics-tabs {
  display: flex;
  margin-bottom: -6px;
  border-bottom: 1px solid #e2e8f0;
}

.analytics-tab {
  position: relative;
  height: 42px;
  padding: 0 22px;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
}

.analytics-tab:hover,
.analytics-tab--active {
  color: #4f46e5;
}

.analytics-tab--active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: #4f46e5;
  content: '';
}

.analytics-tab:focus-visible,
.analytics-tab-panel:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.analytics-tab-panel {
  min-width: 0;
}

.filter-card {
  padding: 18px 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
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
.quick-range--active {
  border-color: #a5b4fc;
  background: #eef2ff;
  color: #4f46e5;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.filter-field {
  display: grid;
  grid-template-columns: auto minmax(0, 320px);
  flex: 0 1 auto;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.filter-field label {
  white-space: nowrap;
  color: #64748b;
  font-size: 0.78rem;
}

.filter-field :deep(.el-date-editor) {
  width: 320px;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.filter-actions {
  display: flex;
  min-width: max-content;
  gap: 8px;
}

.analytics-content {
  display: flex;
  min-height: 420px;
  flex-direction: column;
  gap: 18px;
}

.panel.product-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  border-color: #dbeafe;
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.04);
}

.product-panel__heading {
  margin-bottom: 0;
}

.product-metrics-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(160px, 1fr));
  gap: 12px;
  overflow-x: auto;
}

.product-metric-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  padding: 17px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  background: #f8fafc;
}

.product-metric-card::before {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--product-color);
  content: '';
}

.product-metric-card__label {
  overflow: hidden;
  margin-bottom: 9px;
  color: #64748b;
  font-size: 0.79rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-metric-card strong {
  display: block;
  margin-bottom: 8px;
  color: #0f172a;
  font-size: 1.6rem;
  line-height: 1;
}

.product-metric-card__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  color: #94a3b8;
  font-size: 0.71rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.product-insights-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(330px, 0.75fr);
  gap: 14px;
}

.product-insight-card,
.product-trend-block {
  min-width: 0;
  padding: 17px;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  background: #fff;
}

.product-insight-card__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.product-insight-card__heading h4 {
  margin: 0;
  color: #334155;
  font-size: 0.9rem;
}

.product-insight-card__heading p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 0.72rem;
}

.product-insight-card__heading > strong {
  flex-shrink: 0;
  color: #4338ca;
  font-size: 0.9rem;
}

.usage-share-list {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.usage-share-row__meta,
.usage-share-row__hint {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.usage-share-row__meta {
  margin-bottom: 7px;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 650;
}

.usage-share-row__hint {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 0.7rem;
}

.preference-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.preference-row {
  display: grid;
  grid-template-columns: 9px minmax(0, 1fr) max-content 54px;
  gap: 9px;
  align-items: center;
  color: #64748b;
  font-size: 0.75rem;
}

.preference-row__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.preference-row__label {
  overflow: hidden;
  color: #475569;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preference-row strong {
  color: #334155;
}

.preference-row > span:last-child {
  text-align: right;
}

.product-trend-block .product-insight-card__heading {
  margin-bottom: 4px;
}

.metric-change {
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
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
}

.panel-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-heading h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1rem;
}

.panel-heading p {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 0.75rem;
}

.panel-count {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 0.76rem;
}

.data-note {
  margin: 0;
  color: #94a3b8;
  font-size: 0.74rem;
  line-height: 1.7;
  text-align: center;
}

@media (max-width: 1280px) {
  .product-insights-grid {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 768px) {
  .behavior-analytics-page {
    padding: 22px 18px;
  }

  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .quick-ranges {
    align-items: stretch;
    flex-wrap: wrap;
  }

  .quick-ranges > span {
    width: 100%;
  }

  .filter-field {
    flex-basis: 100%;
    grid-template-columns: 1fr;
  }

  .filter-actions :deep(.el-button) {
    flex: 1;
  }

  .panel {
    padding: 17px 14px;
  }
}
</style>
