<!-- 后台转化分析面板：注册人群转化、时长、付费学习时段及分组观察。 -->
<template>
  <div class="conversion-panel">
    <section class="conversion-filter">
      <div class="filter-top">
        <div class="quick-ranges">
          <span>统计日期</span>
          <el-button
            v-for="days in [7, 30, 90]"
            :key="days"
            :type="quickRange === days ? 'primary' : 'default'"
            :plain="quickRange === days"
            @click="selectRange(days)"
            >近 {{ days }} 天</el-button
          >
        </div>
        <span class="timezone">北京时间 · 仅统计普通学生</span>
      </div>
      <div class="filter-fields">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :clearable="false"
          :disabled-date="disableFutureDate"
          @change="quickRange = null"
        />
        <label>转化观察期</label>
        <el-select v-model="windowDays" class="window-select"
          ><el-option
            v-for="days in [7, 14, 30]"
            :key="days"
            :label="`注册后 ${days} 天`"
            :value="days"
        /></el-select>
        <el-button type="primary" :loading="loading" @click="load">查询</el-button>
      </div>
      <p>转化率观察所选日期注册的用户；付费人数和活跃时段观察所选日期发生的行为。</p>
    </section>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon>
      <el-button link type="primary" @click="load">重新加载</el-button>
    </el-alert>
    <div v-loading="loading" class="conversion-content" :aria-busy="loading">
      <template v-if="data">
        <div class="result-heading">
          <div>
            <h3>转化总览</h3>
            <p>{{ appliedPeriod }} · 注册后 {{ data.period.windowDays }} 天内的转化</p>
          </div>
          <span class="observation-badge"
            >{{ data.overview.matured }} 人已满观察期 ·
            {{ data.overview.observing }} 人仍在观察</span
          >
        </div>
        <div class="conversion-metrics">
          <article
            v-for="card in metrics"
            :key="card.label"
            class="conversion-metric"
            :style="{ '--metric-color': card.color }"
          >
            <span>{{ card.label }}</span
            ><strong>{{ card.value }}</strong
            ><small>{{ card.note }}</small>
          </article>
        </div>
        <div v-if="data.quality.smallCohort" class="sample-note">
          {{
            data.overview.matured
              ? `当前完整观察样本为 ${data.overview.matured} 人，比例容易受个别用户影响，建议结合人数判断。`
              : '当前没有已满观察期的注册用户，可扩大日期范围或缩短观察期；未观察完整的用户不会被记为流失。'
          }}
        </div>

        <section class="conversion-section">
          <div class="section-heading">
            <div>
              <h3>每日付费人数</h3>
              <p>
                {{ appliedPeriod }} · 按北京时间付款成功日期统计，同一用户当天多次付款只计 1 人。
              </p>
            </div>
          </div>
          <ConversionPaymentTrendChart :items="data.dailyPayments" />
          <p class="chart-note">
            包含首次付款和复购，赠送会员、奖励及零金额订单不计入；后续退款不扣减付款当日人数。跨日付款分别计入对应日期，每日人数相加不等于期间去重人数。
          </p>
        </section>

        <section class="conversion-section">
          <div class="section-heading">
            <div>
              <h3>转化发生在哪一步</h3>
              <p>同一批已满观察期的注册用户，按人数去重；购买路径与学习路径分别观察。</p>
            </div>
          </div>
          <div class="funnel-grid">
            <article v-for="funnel in data.funnels" :key="funnel.key" class="funnel-card">
              <h4>{{ funnel.label }}</h4>
              <div v-for="(step, index) in funnel.steps" :key="step.label" class="funnel-step">
                <div>
                  <span
                    ><i>{{ index + 1 }}</i
                    >{{ step.label }}</span
                  ><strong>{{ step.count }} <small>人</small></strong>
                </div>
                <el-progress
                  :percentage="progress(step.count, funnel.steps[0]?.count || 0)"
                  :show-text="false"
                  :stroke-width="10"
                  :color="funnel.key === 'payment' ? '#4f46e5' : '#0d9488'"
                />
                <small v-if="index > 0"
                  >上一步转化 {{ percentage(stepRate(funnel.steps, index)) }} · 流失
                  {{ (funnel.steps[index - 1]?.count || 0) - step.count }} 人</small
                >
                <small v-else>完整观察期的注册用户</small>
              </div>
            </article>
          </div>
          <div class="insight-strip">
            <strong>运营观察</strong><span>{{ funnelInsight }}</span>
          </div>
        </section>

        <section class="conversion-section">
          <div class="section-heading">
            <div>
              <h3>用户需要多久完成转化</h3>
              <p>
                仅计算已完成对应转化的样本，以中位数观察典型用户，P90 表示 90%
                的样本在此时长内完成。
              </p>
            </div>
          </div>
          <el-radio-group v-model="durationKey" class="duration-tabs"
            ><el-radio-button v-for="item in durationOptions" :key="item.key" :value="item.key">{{
              item.label
            }}</el-radio-button></el-radio-group
          >
          <template v-if="selectedDuration">
            <p class="duration-note">{{ durationDescription }}</p>
            <div v-if="selectedDuration.sampleCount" class="duration-grid">
              <div class="duration-summary">
                <span>中位转化时长</span
                ><strong>{{ duration(selectedDuration.medianSeconds) }}</strong>
                <dl>
                  <div>
                    <dt>P75</dt>
                    <dd>{{ duration(selectedDuration.p75Seconds) }}</dd>
                  </div>
                  <div>
                    <dt>P90</dt>
                    <dd>{{ duration(selectedDuration.p90Seconds) }}</dd>
                  </div>
                  <div>
                    <dt>有效样本</dt>
                    <dd>
                      {{ selectedDuration.sampleCount }}
                      {{ durationKey === 'checkout' ? '笔订单' : '人' }}
                    </dd>
                  </div>
                </dl>
              </div>
              <div class="duration-bars">
                <div v-for="bucket in selectedDuration.buckets" :key="bucket.label">
                  <span>{{ bucket.label }}</span
                  ><el-progress
                    :percentage="(bucket.share || 0) * 100"
                    :show-text="false"
                    :stroke-width="14"
                    color="#818cf8"
                  /><strong>{{ bucket.count }}</strong
                  ><small>{{ percentage(bucket.share) }}</small>
                </div>
              </div>
            </div>
            <el-empty
              v-else
              :description="
                durationKey === 'registration'
                  ? '暂无可关联的首次访问记录，后续注册将逐步积累'
                  : '所选人群尚无有效转化时长样本'
              "
              :image-size="70"
            />
          </template>
        </section>

        <section class="conversion-section">
          <div class="section-heading">
            <div>
              <h3>付费用户什么时候学习</h3>
              <p>
                {{ appliedPeriod }} · 仅计首次真实付款后的学习行为，同一用户同一天同一小时最多计 1
                人次。
              </p>
            </div>
            <span class="section-stat">{{ data.overview.paidActiveUsers }} 位活跃付费学生</span>
          </div>
          <div class="activity-grid">
            <ConversionActivityHeatmap :items="data.heatmap" />
            <aside class="activity-summary">
              <h4>高频学习时段</h4>
              <div v-for="(hour, index) in data.topHours" :key="hour.hour" class="peak-hour">
                <i>{{ index + 1 }}</i>
                <div>
                  <strong>{{ hourLabel(hour.hour) }}</strong
                  ><span>{{ hour.userHours }} 人次 · {{ hour.users }} 人</span>
                </div>
              </div>
              <p v-if="!data.topHours.length">暂无足够的付费学习记录。</p>
              <p v-else>
                可在这些时段安排答疑和学习提醒，并通过后续效果验证。图中反映学习操作出现的时段，不代表在线时长。
              </p>
            </aside>
          </div>
        </section>

        <div class="comparison-grid">
          <section class="conversion-section">
            <div class="section-heading">
              <div>
                <h3>不同注册批次的转化</h3>
                <p>按注册周分组，仅包含已满 {{ data.period.windowDays }} 天观察期的用户。</p>
              </div>
            </div>
            <AdminDataTable :data="data.weeklyCohorts" empty-text="暂无已观察完整的注册批次"
              ><el-table-column prop="week" label="注册周起始" min-width="115" /><el-table-column
                prop="users"
                label="注册"
                width="70"
              /><el-table-column prop="activated" label="完成练习" width="90" /><el-table-column
                prop="paid"
                label="首付"
                width="70"
              /><el-table-column label="转化率" min-width="85"
                ><template #default="{ row }">{{
                  percentage(row.conversionRate)
                }}</template></el-table-column
              ></AdminDataTable
            >
          </section>
          <section class="conversion-section">
            <div class="section-heading">
              <div>
                <h3>不同备考方向的转化</h3>
                <p>按当前备考偏好分组，不代表考试方向本身导致转化差异。</p>
              </div>
            </div>
            <AdminDataTable :data="data.segments" empty-text="暂无分组数据"
              ><el-table-column prop="label" label="备考方向" min-width="125" /><el-table-column
                prop="users"
                label="注册"
                width="65"
              /><el-table-column prop="paid" label="首付" width="65" /><el-table-column
                label="转化率"
                min-width="85"
                ><template #default="{ row }">{{
                  percentage(row.conversionRate)
                }}</template></el-table-column
              ><el-table-column label="首付中位时长" min-width="110"
                ><template #default="{ row }">{{
                  duration(row.medianSeconds)
                }}</template></el-table-column
              ></AdminDataTable
            >
          </section>
        </div>
        <section class="conversion-section follow-up">
          <div class="section-heading">
            <div>
              <h3>付款之后是否继续使用</h3>
              <p>观察所选日期内首次付款、且已过去完整 7 天的用户。</p>
            </div>
          </div>
          <div class="follow-up-grid">
            <div>
              <span>首付后 7 天内有学习</span
              ><strong
                >{{ data.overview.paidLearningUsers }} / {{ data.overview.paidLearningEligible }}
                <small>人</small></strong
              >
            </div>
            <div>
              <span>所选期间复购用户</span
              ><strong>{{ data.overview.repeatPayerCount }} <small>人</small></strong>
            </div>
            <div>
              <span>注册转化人群中首单已全退</span
              ><strong>{{ data.overview.firstPaymentRefundedUsers }} <small>人</small></strong>
            </div>
          </div>
          <p>
            首次付款成功仍计为转化；后续全额退款单独展示。赠送会员、邀请奖励和零金额订单不计入真实付款。
          </p>
        </section>
        <p class="data-footnote">
          统计截至
          {{ observedText }}。管理员及当前封禁账号不计入。注册时长仅覆盖同一浏览器可关联的访问（{{
            data.quality.registrationTracked
          }}
          / {{ data.quality.registrationTotal }} 人），跨设备或清除 Cookie 后的访问无法还原。<span
            v-if="data.quality.invalidPaymentTimes"
            >有
            {{ data.quality.invalidPaymentTimes }}
            笔成功付款记录缺失或存在异常时间，已排除；相关用户的首次付款时间无法确认，未计入首付、复购和付费后学习统计。</span
          >
        </p>
      </template>
      <el-empty v-else-if="!loading && !error" description="请选择统计范围" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import ConversionActivityHeatmap from './ConversionActivityHeatmap.vue'
import ConversionPaymentTrendChart from './ConversionPaymentTrendChart.vue'
import {
  getConversionAnalytics,
  type ConversionDuration,
  type ConversionResult,
} from '@/api/conversionAnalytics'
import { getApiErrorMessage } from '@/utils/request'

const DAY = 86400000
const data = ref<ConversionResult | null>(null)
const loading = ref(false)
const error = ref('')
const quickRange = ref<number | null>(30)
const windowDays = ref(7)
const dateRange = ref<[Date, Date]>(recentRange(30))
const durationKey = ref<ConversionDuration['key']>('payment')
let sequence = 0
const durationOptions = [
  { key: 'registration', label: '首次访问 → 注册' },
  { key: 'activation', label: '注册 → 首次完成练习' },
  { key: 'payment', label: '注册 → 首次付费' },
  { key: 'checkout', label: '下单 → 支付成功' },
] as const

// 日期控件只承载北京时间日历日期，避免管理员设备时区改变查询范围。
function recentRange(days: number): [Date, Date] {
  const china = new Date(Date.now() + 8 * 3600000)
  const end = new Date(china.getUTCFullYear(), china.getUTCMonth(), china.getUTCDate())
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  return [start, end]
}
// 日历值按北京时间转换为接口边界，结束日包含完整自然日。
function calendarKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}
// 未来注册批次尚未发生，不允许作为筛选起点。
function disableFutureDate(value: Date): boolean {
  return calendarKey(value) > calendarKey(recentRange(1)[1])
}
// 快捷范围立即应用，观察期沿用当前选择。
function selectRange(days: number) {
  quickRange.value = days
  dateRange.value = recentRange(days)
  void load()
}
// 同时更新所有面板，只接受最后一次查询；失败保留已展示数据与原统计范围。
async function load() {
  const [start, end] = dateRange.value
  const startAt = new Date(`${calendarKey(start)}T00:00:00+08:00`)
  const endAt = new Date(new Date(`${calendarKey(end)}T00:00:00+08:00`).getTime() + DAY)
  if (endAt <= startAt || endAt.getTime() - startAt.getTime() > 90 * DAY) {
    ElMessage.warning('请选择 1 至 90 天的统计范围')
    return
  }
  const request = ++sequence
  loading.value = true
  error.value = ''
  try {
    const result = await getConversionAnalytics({
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      windowDays: windowDays.value,
    })
    if (request === sequence) data.value = result
  } catch (reason) {
    if (request === sequence) error.value = getApiErrorMessage(reason, '转化分析加载失败，请重试')
  } finally {
    if (request === sequence) loading.value = false
  }
}
// 无分母用占位符表达缺少样本，零转化率仍正常显示 0.0%。
function percentage(value: number | null): string {
  return value === null ? '—' : `${(value * 100).toFixed(1)}%`
}
// 时长按数量级显示，缺少可关联事件时不以零代替。
function duration(seconds: number | null): string {
  if (seconds === null) return '—'
  if (seconds < 60) return `${Math.round(seconds)} 秒`
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)} 分钟`
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)} 小时`
  return `${(seconds / 86400).toFixed(1)} 天`
}
// 漏斗比例按同一批注册用户计算，空批次不绘制虚假的满条。
function progress(count: number, total: number): number {
  return total ? Math.min(100, (count / total) * 100) : 0
}
// 步间转化率以已到达上一阶段的人数为分母。
function stepRate(steps: Array<{ count: number }>, index: number): number | null {
  return steps[index - 1]?.count ? steps[index]!.count / steps[index - 1]!.count : null
}
// 高频时段以整点区间展示，与热力图使用同一北京时间口径。
function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00–${String(hour + 1).padStart(2, '0')}:00`
}
// 日期说明始终读取成功响应，查询草稿不会修改旧结果的范围标签。
const appliedPeriod = computed(() =>
  data.value
    ? `${new Date(new Date(data.value.period.startAt).getTime() + 8 * 3600000).toISOString().slice(0, 10)} 至 ${new Date(new Date(data.value.period.endAt).getTime() + 8 * 3600000 - 1).toISOString().slice(0, 10)}`
    : '',
)
// 分析快照明确截止时间，尚未成熟的注册人群会随时间进入观察。
const observedText = computed(() =>
  data.value
    ? new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(data.value.period.observedAt))
    : '',
)
// 首屏将人数、转化率、速度和付费后使用并列，避免只看订单数量。
const metrics = computed(() => {
  if (!data.value) return []
  const o = data.value.overview,
    days = data.value.period.windowDays
  return [
    {
      label: '新增注册用户',
      value: o.registered,
      note: `${o.matured} 人已满观察期`,
      color: '#4f46e5',
    },
    {
      label: `${days} 天学习激活率`,
      value: percentage(o.activationRate),
      note: `${o.activated} 人完成首次练习`,
      color: '#0d9488',
    },
    {
      label: `${days} 天首付转化率`,
      value: percentage(o.conversionRate),
      note: `${o.converted} 人首次付款`,
      color: '#7c3aed',
    },
    {
      label: '期间首次付费用户',
      value: o.firstPayersInPeriod,
      note: '包含此前注册的用户',
      color: '#0284c7',
    },
    {
      label: '注册到首付中位时长',
      value: duration(o.medianPaymentSeconds),
      note: '已满观察期且完成转化',
      color: '#d97706',
    },
    {
      label: '首付后 7 天学习率',
      value: percentage(o.paidLearningRate),
      note: `${o.paidLearningUsers} / ${o.paidLearningEligible} 人`,
      color: '#059669',
    },
  ]
})
// 只报告实际观察到的流失环节，不将相关性包装成已验证的原因。
const funnelInsight = computed(() => {
  const o = data.value?.overview
  if (!o?.matured) return '等待形成完整观察样本后，再比较注册、学习与购买各环节。'
  const notStarted = o.matured - o.started,
    unfinished = o.started - o.activated,
    unpaid = o.ordered - o.converted
  return `${notStarted} 人注册后未开始练习，${unfinished} 人开始后未完成；${unpaid} 人创建订单后未在观察期内完成首付。可分别检查首次使用引导、练习负担和支付过程。`
})
// 四种时长来自不同事件对，切换只改变展示而不重新请求。
const selectedDuration = computed(() =>
  data.value?.durations.find((item) => item.key === durationKey.value),
)
// 每种时长标明样本来源，避免把结算耗时误读为用户决策周期。
const durationDescription = computed(
  () =>
    ({
      registration: `所选日期注册、且能关联本浏览器首次访问的用户。有效覆盖 ${data.value?.quality.registrationTracked || 0} / ${data.value?.quality.registrationTotal || 0} 人；历史未采集部分不补零。`,
      activation:
        '已满观察期的注册用户，从注册到首次完成诊断、题库或模考练习。未完成者不进入时长分布。',
      payment: '已满观察期的注册用户，从注册到观察期内首次真实付款。重复购买不改变首次转化时长。',
      checkout: '所选日期内支付成功的真实订单，从该笔订单创建到支付成功；包含复购订单。',
    })[durationKey.value],
)
onMounted(() => {
  void load()
})
onBeforeUnmount(() => {
  sequence++
})
</script>

<style scoped lang="scss">
.conversion-panel,
.conversion-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}
.conversion-content {
  min-height: 360px;
}
.conversion-filter,
.conversion-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 22px;
  min-width: 0;
}
.filter-top,
.filter-fields,
.quick-ranges,
.result-heading,
.section-heading {
  display: flex;
  align-items: center;
  gap: 14px;
}
.filter-top,
.result-heading,
.section-heading {
  justify-content: space-between;
}
.filter-fields {
  margin-top: 18px;
  flex-wrap: wrap;
}
.filter-fields :deep(.el-date-editor) {
  max-width: 360px;
}
.window-select {
  width: 160px;
}
.quick-ranges :deep(.el-button + .el-button) {
  margin-left: 0;
}
.timezone,
.conversion-filter p,
.result-heading p,
.section-heading p,
.duration-note,
.chart-note,
.follow-up p,
.data-footnote {
  color: #94a3b8;
  font-size: 12px;
  line-height: 1.7;
}
.conversion-filter p {
  margin: 12px 0 0;
}
h3,
h4,
p {
  margin: 0;
}
h3 {
  color: #1e293b;
  font-size: 17px;
}
h4 {
  color: #334155;
  font-size: 14px;
}
.result-heading p,
.section-heading p {
  margin-top: 5px;
}
.observation-badge {
  color: #6366f1;
  background: #eef2ff;
  border-radius: 7px;
  padding: 8px 12px;
  font-size: 12px;
  white-space: nowrap;
}
.conversion-metrics {
  display: grid;
  grid-template-columns: repeat(6, minmax(155px, 1fr));
  overflow-x: auto;
  gap: 12px;
}
.conversion-metric {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-top: 3px solid var(--metric-color);
  border-radius: 11px;
}
.conversion-metric > span {
  color: #64748b;
  font-size: 12px;
}
.conversion-metric strong {
  color: #0f172a;
  font-size: 25px;
  font-weight: 600;
  white-space: nowrap;
}
.conversion-metric small {
  color: #94a3b8;
  font-size: 11px;
}
.sample-note {
  padding: 11px 16px;
  color: #92651a;
  background: #fffbeb;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.6;
}
.section-heading {
  margin-bottom: 22px;
  align-items: flex-start;
}
.section-stat {
  color: #4f46e5;
  font-size: 12px;
  white-space: nowrap;
}
.funnel-grid,
.comparison-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.funnel-card {
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e8edf4;
  border-radius: 10px;
}
.funnel-step {
  margin-top: 22px;
}
.funnel-step > div:first-child {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 9px;
  font-size: 13px;
  color: #475569;
}
.funnel-step i {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  margin-right: 8px;
  color: #6366f1;
  background: #eef2ff;
  border-radius: 50%;
  font-size: 11px;
  font-style: normal;
}
.funnel-step strong {
  font-size: 19px;
  color: #1e293b;
}
.funnel-step small {
  display: inline-block;
  margin-top: 7px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: normal;
}
.insight-strip {
  display: flex;
  gap: 16px;
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 8px;
  background: #eef2ff;
  font-size: 12px;
  line-height: 1.8;
  color: #64748b;
}
.insight-strip strong {
  color: #4f46e5;
  white-space: nowrap;
}
.duration-tabs {
  flex-wrap: wrap;
}
.duration-note {
  margin: 14px 0 22px;
}
.chart-note {
  margin-top: 12px;
}
.duration-grid {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 32px;
}
.duration-summary {
  padding: 22px;
  background: #f8fafc;
  border-radius: 10px;
}
.duration-summary > span {
  color: #64748b;
  font-size: 12px;
}
.duration-summary > strong {
  display: block;
  margin: 14px 0 20px;
  font-size: 29px;
  color: #4f46e5;
}
.duration-summary dl {
  margin: 0;
}
.duration-summary dl > div {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 12px;
}
.duration-summary dt {
  color: #94a3b8;
}
.duration-summary dd {
  color: #475569;
  margin: 0;
}
.duration-bars {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
}
.duration-bars > div {
  display: grid;
  grid-template-columns: 125px minmax(0, 1fr) 35px 60px;
  gap: 12px;
  align-items: center;
  font-size: 12px;
  color: #64748b;
}
.duration-bars strong,
.duration-bars small {
  text-align: right;
}
.activity-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 28px;
}
.activity-summary {
  padding: 18px;
  background: #f8fafc;
  border-radius: 10px;
}
.activity-summary p {
  margin-top: 16px;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.8;
}
.peak-hour {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
}
.peak-hour i {
  font-style: normal;
  font-size: 20px;
  color: #c7d2fe;
}
.peak-hour strong {
  font-size: 14px;
  color: #334155;
}
.peak-hour span {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #94a3b8;
}
.follow-up-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}
.follow-up-grid > div {
  padding: 18px;
  border-radius: 10px;
  background: #f8fafc;
}
.follow-up-grid span {
  display: block;
  color: #64748b;
  font-size: 12px;
}
.follow-up-grid strong {
  display: block;
  margin-top: 14px;
  font-size: 24px;
  color: #334155;
}
.follow-up-grid small {
  font-size: 12px;
  font-weight: normal;
}
.follow-up p {
  margin-top: 18px;
}
.data-footnote {
  text-align: center;
}
@media (max-width: 1280px) {
  .comparison-grid,
  .activity-grid {
    grid-template-columns: 1fr;
  }
  .activity-summary {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }
  .peak-hour,
  .activity-summary p {
    margin-top: 0;
  }
}
@media (max-width: 768px) {
  .filter-top,
  .result-heading,
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .funnel-grid,
  .duration-grid,
  .follow-up-grid {
    grid-template-columns: 1fr;
  }
  .conversion-filter,
  .conversion-section {
    padding: 16px;
  }
  .quick-ranges {
    gap: 8px;
    flex-wrap: wrap;
  }
  .duration-bars > div {
    grid-template-columns: 95px minmax(0, 1fr) 25px 48px;
    gap: 8px;
  }
  .insight-strip {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
