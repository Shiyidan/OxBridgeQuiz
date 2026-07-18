<!-- 学生用户行为分析页：展示核心学习产品偏好、操作排行、趋势及日志下钻。 -->
<template>
  <div class="behavior-analytics-page">
    <div class="page-heading">
      <div>
        <h2 class="page-title">用户行为分析</h2>
        <p class="page-desc">对比诊断、题库和模考使用偏好，并结合关键操作定位产品优化方向。</p>
      </div>
      <div class="scope-badge">
        <span class="scope-badge__dot"></span>
        仅统计普通学生用户
      </div>
    </div>

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
        <div class="filter-field">
          <label>操作模块（仅筛选下方审计）</label>
          <el-select v-model="draftFilters.module" clearable placeholder="全部操作模块">
            <el-option
              v-for="option in studentModuleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
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
            <p>练习次数按成功提交记录去重；分析报告只统计成功打开正文，不包含生成状态轮询。</p>
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
              <span>{{ card.detail }}</span>
              <span :class="changeClass(card.changeRate)">
                {{ productChangeText(card) }}
              </span>
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
                >{{ formatInteger(productUsage?.overview.completedActivityCount || 0) }} 次</strong
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
                    >{{ item.completionCount }} 次 · {{ formatPercent(item.completionShare) }}</span
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
                  {{
                    productUsage?.scope.preferenceMinimumCompletions || 3
                  }}
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
              <p>按北京时间自然日对比四项核心行为</p>
            </div>
          </div>
          <BehaviorProductTrendChart :items="productUsage?.trend || []" />
        </div>
      </section>

      <div class="subsection-heading">
        <div>
          <h3>操作审计概览</h3>
          <p>统计学生关键操作、失败情况及操作模块渗透</p>
        </div>
      </div>

      <section class="metrics-grid" aria-label="学生行为核心指标">
        <article class="metric-card">
          <div class="metric-card__label">活跃学生</div>
          <strong>{{ formatInteger(overview.activeUsers) }}</strong>
          <span :class="changeClass(overview.activeUsersChangeRate)">
            {{ changeText(overview.activeUsersChangeRate) }}
          </span>
        </article>
        <article class="metric-card">
          <div class="metric-card__label">关键操作次数</div>
          <strong>{{ formatInteger(overview.operationCount) }}</strong>
          <span :class="changeClass(overview.operationCountChangeRate)">
            {{ changeText(overview.operationCountChangeRate) }}
          </span>
        </article>
        <article class="metric-card">
          <div class="metric-card__label">人均操作次数</div>
          <strong>{{ overview.averageOperations.toFixed(1) }}</strong>
          <span :class="changeClass(overview.averageOperationsChangeRate)">
            {{ changeText(overview.averageOperationsChangeRate) }}
          </span>
        </article>
        <article class="metric-card">
          <div class="metric-card__label">使用模块数</div>
          <strong>{{ overview.moduleCount }}</strong>
          <span class="metric-card__hint">当前范围内有学生使用</span>
        </article>
        <article class="metric-card">
          <div class="metric-card__label">操作失败率</div>
          <strong>{{ formatPercent(overview.failureRate) }}</strong>
          <span :class="failureChangeClass">
            {{ failureChangeText }}
          </span>
        </article>
      </section>

      <el-alert
        v-if="analytics?.dataQuality.unattributedOperationCount"
        class="quality-alert"
        type="warning"
        :closable="false"
        show-icon
        :title="`${analytics.dataQuality.unattributedOperationCount} 条历史操作缺少用户标识，已计入总次数但未计入活跃人数与人均次数`"
      />

      <section class="charts-grid">
        <article class="panel panel--trend">
          <div class="panel-heading">
            <div>
              <h3>每日使用趋势</h3>
              <p>{{ periodText }} · 北京时间自然日</p>
            </div>
          </div>
          <BehaviorTrendChart :items="analytics?.trend || []" />
        </article>

        <article class="panel">
          <div class="panel-heading">
            <div>
              <h3>操作模块排行</h3>
              <p>点击柱形可直接筛选该操作模块</p>
            </div>
          </div>
          <BehaviorModuleChart :items="analytics?.modules || []" @select="selectModuleFromChart" />
        </article>
      </section>

      <section class="panel action-panel">
        <div class="panel-heading panel-heading--table">
          <div>
            <h3>高频行为排行</h3>
            <p>按使用人数优先、操作次数次优展示前 20 项</p>
          </div>
          <span class="panel-count">{{ topActions.length }} 项行为</span>
        </div>

        <AdminDataTable
          :data="topActions"
          :loading="loading"
          empty-text="当前范围暂无学生关键行为"
          max-height="560px"
        >
          <el-table-column label="行为" min-width="190">
            <template #default="{ row }">
              <div class="action-cell">
                <strong>{{ operationActionLabel(row.action) }}</strong>
                <code>{{ row.action }}</code>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="模块" width="112" align="center">
            <template #default="{ row }">{{ operationModuleLabel(row.module) }}</template>
          </el-table-column>
          <el-table-column prop="userCount" label="使用人数" width="104" align="right" />
          <el-table-column prop="operationCount" label="操作次数" width="104" align="right" />
          <el-table-column label="人均次数" width="104" align="right">
            <template #default="{ row }">{{ row.averageOperations.toFixed(1) }}</template>
          </el-table-column>
          <el-table-column label="活跃渗透率" width="118" align="right">
            <template #default="{ row }">{{ formatPercent(row.penetrationRate) }}</template>
          </el-table-column>
          <el-table-column label="重复使用率" width="118" align="right">
            <template #default="{ row }">{{ formatPercent(row.repeatedUserRate) }}</template>
          </el-table-column>
          <el-table-column label="失败率" width="96" align="right">
            <template #default="{ row }">
              <span :class="{ 'failure-value': row.failureRate > 0 }">
                {{ formatPercent(row.failureRate) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作环比" width="112" align="right">
            <template #default="{ row }">
              <span :class="changeClass(row.operationChangeRate)">
                {{ compactChangeText(row.operationChangeRate) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="明细" width="92" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="openOperationLogs(row)">查看日志</el-button>
            </template>
          </el-table-column>
        </AdminDataTable>
      </section>
    </div>

    <p class="data-note">
      学习活动次数来自已提交考试记录，报告查看和其他关键行为来自操作审计日志；管理员账号和认证登录行为不计入统计。最多查询
      90 天。报告查看仅覆盖本次采集功能上线后的成功正文读取，历史查看次数无法补回。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  getBehaviorAnalytics,
  type BehaviorAnalyticsAction,
  type BehaviorAnalyticsOverview,
  type BehaviorAnalyticsResult,
  type ProductUsageModuleCode,
} from '@/api/admin'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import BehaviorModuleChart from '@/components/admin/BehaviorModuleChart.vue'
import BehaviorProductTrendChart from '@/components/admin/BehaviorProductTrendChart.vue'
import BehaviorTrendChart from '@/components/admin/BehaviorTrendChart.vue'
import {
  PRODUCT_PREFERENCE_META,
  PRODUCT_USAGE_MODULE_META,
  productPreferenceLabel,
  productUsageModuleLabel,
} from '@/constants/behaviorAnalytics'
import {
  STUDENT_BEHAVIOR_MODULE_OPTIONS,
  operationActionLabel,
  operationModuleLabel,
} from '@/constants/operationAudit'

interface BehaviorFilters {
  dateRange: [Date, Date] | null
  module: string
}

interface ApiFailureShape {
  response?: {
    data?: {
      errMsg?: string
    }
  }
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
const studentModuleOptions = STUDENT_BEHAVIOR_MODULE_OPTIONS
const router = useRouter()
const analytics = ref<BehaviorAnalyticsResult | null>(null)
const loading = ref(false)
const loadError = ref('')
let latestRequestId = 0
const activeQuickRange = ref<(typeof quickRangeOptions)[number] | null>(30)

// 最近天数按北京时间自然日生成，接口统一将结束日转换为半开区间。
function recentDateRange(days: number): [Date, Date] {
  const end = chinaCalendarDate()
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  return [start, end]
}

const draftFilters = reactive<BehaviorFilters>({
  dateRange: recentDateRange(30),
  module: '',
})
const appliedFilters = reactive<BehaviorFilters>({
  dateRange: recentDateRange(30),
  module: '',
})

const emptyOverview: BehaviorAnalyticsOverview = {
  activeUsers: 0,
  activeUsersChangeRate: null,
  operationCount: 0,
  operationCountChangeRate: null,
  averageOperations: 0,
  averageOperationsChangeRate: null,
  moduleCount: 0,
  failureRate: 0,
  failureRateChange: null,
}

// 首屏与错误后的指标卡保持固定结构，不显示 undefined。
const overview = computed(() => analytics.value?.overview || emptyOverview)

// 产品偏好区直接复用同一原子响应，日期变化时与通用操作统计保持同步。
const productUsage = computed(() => analytics.value?.productUsage || null)

// 三类完成指标与报告查看指标固定顺序展示，便于管理员快速横向比较。
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
  ]
})

// 排行首期只展示最有决策价值的前 20 项，完整数据仍保留在接口响应中。
const topActions = computed(() => (analytics.value?.actions || []).slice(0, 20))

// 响应采用结束时间不包含语义，页面展示时还原为用户选择的最后一天。
const periodText = computed(() => {
  if (!analytics.value) return '等待查询'
  const start = new Date(analytics.value.period.startAt)
  const end = new Date(new Date(analytics.value.period.endAt).getTime() - 1)
  return `${formatChinaDate(start)} 至 ${formatChinaDate(end)}`
})

// 失败率差值按百分点展示，下降属于改善并使用正向颜色。
const failureChangeText = computed(() => {
  if (overview.value.failureRateChange === null) return '上一周期暂无可比数据'
  const points = overview.value.failureRateChange * 100
  if (Math.abs(points) < 0.05) return '与上一周期持平'
  return `较上期${points > 0 ? '上升' : '下降'} ${Math.abs(points).toFixed(1)} 个百分点`
})

// 失败率上升为风险，下降为改善，颜色方向与其他增长指标相反。
const failureChangeClass = computed(() => ({
  'metric-change': true,
  'metric-change--up':
    overview.value.failureRateChange !== null && overview.value.failureRateChange < 0,
  'metric-change--down':
    overview.value.failureRateChange !== null && overview.value.failureRateChange > 0,
  'metric-change--neutral':
    overview.value.failureRateChange === null || overview.value.failureRateChange === 0,
}))

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

// 同周期变化提供完整文字，上一周期无基线时不显示虚构的百分比。
function changeText(value: number | null): string {
  if (value === null) return '上一周期暂无可比数据'
  if (Math.abs(value) < 0.0005) return '与上一周期持平'
  return `较上期 ${value > 0 ? '+' : ''}${(value * 100).toFixed(1)}%`
}

// 表格窄列使用紧凑环比文案。
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
  target.module = source.module
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

// 接口错误优先展示后端校验信息，网络异常使用页面兜底文案。
function apiErrorMessage(error: unknown, fallback: string): string {
  return (error as ApiFailureShape)?.response?.data?.errMsg || fallback
}

// 页面始终使用已提交筛选读取一份原子统计响应，保证卡片、图表和排行口径一致。
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
      module: appliedFilters.module || undefined,
    })
    if (requestId !== latestRequestId) return
    analytics.value = data
  } catch (error) {
    if (requestId !== latestRequestId) return
    loadError.value = apiErrorMessage(error, '用户行为统计加载失败')
    ElMessage.error(loadError.value)
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

// 重置回最近 30 天和全部核心模块。
function resetFilters(): void {
  activeQuickRange.value = 30
  draftFilters.dateRange = recentDateRange(30)
  draftFilters.module = ''
  applyFilters()
}

// 点击模块图后复用页面主筛选并立即刷新所有指标。
function selectModuleFromChart(module: string): void {
  draftFilters.module = module
  applyFilters()
}

// 行为下钻固定携带学生角色、精确行为编码和当前时间范围，目标页可继续用 Request ID 排障。
function openOperationLogs(row: BehaviorAnalyticsAction): void {
  if (!analytics.value) return
  const inclusiveEndAt = new Date(new Date(analytics.value.period.endAt).getTime() - 1)
  void router.push({
    name: 'admin-operation-logs',
    query: {
      role: 'student',
      module: row.module,
      action: row.action,
      startAt: analytics.value.period.startAt,
      endAt: inclusiveEndAt.toISOString(),
    },
  })
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
  display: grid;
  grid-template-columns: minmax(300px, 1.5fr) minmax(160px, 0.7fr) max-content;
  gap: 16px;
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

.filter-field :deep(.el-select),
.filter-field :deep(.el-date-editor) {
  width: 100%;
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
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
  bottom: 0;
  left: 0;
  width: 4px;
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
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #94a3b8;
  font-size: 0.71rem;
}

.product-metric-card__meta > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.subsection-heading h3,
.subsection-heading p {
  margin: 0;
}

.subsection-heading h3 {
  color: #1e293b;
  font-size: 1rem;
}

.subsection-heading p {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 0.74rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);
}

.metric-card__label {
  margin-bottom: 9px;
  color: #64748b;
  font-size: 0.8rem;
}

.metric-card strong {
  display: block;
  margin-bottom: 7px;
  color: #0f172a;
  font-size: 1.65rem;
  line-height: 1;
}

.metric-change,
.metric-card__hint {
  font-size: 0.72rem;
}

.metric-change--up {
  color: #059669;
}

.metric-change--down,
.failure-value {
  color: #dc2626;
}

.metric-change--neutral,
.metric-card__hint {
  color: #94a3b8;
}

.quality-alert {
  border-radius: 10px;
}

.charts-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.75fr);
  gap: 18px;
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

.action-panel {
  padding-bottom: 18px;
}

.action-cell {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.action-cell strong {
  overflow: hidden;
  color: #334155;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-cell code {
  color: #94a3b8;
  font-size: 0.72rem;
}

.data-note {
  margin: 0;
  color: #94a3b8;
  font-size: 0.74rem;
  line-height: 1.7;
  text-align: center;
}

@media (max-width: 1280px) {
  .product-metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .product-insights-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .filter-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    align-self: end;
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

  .filter-row,
  .metrics-grid,
  .product-metrics-grid {
    grid-template-columns: 1fr;
  }

  .product-metric-card__meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-actions :deep(.el-button) {
    flex: 1;
  }

  .panel {
    padding: 17px 14px;
  }
}
</style>
