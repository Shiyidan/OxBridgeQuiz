<!-- 转化分析的累计付费概况：注册地区和注册到首付时长，独立于日期筛选。 -->
<template>
  <section class="paid-analysis" aria-labelledby="paid-analysis-title">
    <header class="paid-heading">
      <div>
        <h3 id="paid-analysis-title">累计付费用户分析 <span class="scope-tag">全部历史</span></h3>
        <p>地域分布与注册到首次付款的时长，不受顶部统计日期和转化观察期影响。</p>
      </div>
      <AppButton type="secondary" size="small" :loading="loading" @click="load">刷新数据</AppButton>
    </header>

    <el-alert v-if="error" :title="error" type="error" :closable="false" show-icon>
      <template #default>
        <span v-if="data">当前保留上次成功查询的结果。</span>
        <AppButton type="link" size="small" :disabled="loading" @click="load">重新加载</AppButton>
      </template>
    </el-alert>
    <div v-loading="loading" class="paid-body" :aria-busy="loading">
      <template v-if="data">
        <div class="paid-summary">
          <div class="paid-count">
            <strong>{{ data.paidUsers }}</strong
            ><span>位付费用户纳入分析</span>
          </div>
          <p>
            历史成功付费 {{ data.everPaidUsers }} 人 · 已全部退款 {{ data.fullyRefundedUsers }} 人
          </p>
        </div>
        <div class="paid-grid">
          <article class="analysis-card">
            <div class="card-heading">
              <h4>付费用户地域分布</h4>
              <span
                >已识别 {{ data.geography.knownUsers }} 人 · 未知
                {{ data.geography.unknownUsers }} 人</span
              >
            </div>
            <p class="card-note">按注册 IP 的国家 / 地区、省份汇总，每人计一次。</p>
            <div
              v-if="data.geography.regions.length"
              class="region-list"
              role="region"
              aria-label="付费用户地域排名"
              tabindex="0"
            >
              <div
                v-for="(region, index) in data.geography.regions"
                :key="region.label"
                class="region-row"
              >
                <span class="region-rank">{{ index + 1 }}</span>
                <div class="region-content">
                  <div class="bar-heading">
                    <span>{{ region.label }}</span
                    ><span
                      ><b>{{ region.users }} 人</b> · {{ percent(region.share) }}</span
                    >
                  </div>
                  <el-progress
                    :percentage="progress(region.share)"
                    :show-text="false"
                    :stroke-width="7"
                    :color="region.label === '未知' ? '#cbd5e1' : '#6366f1'"
                  />
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无符合口径的付费用户" :image-size="90" />
            <p class="card-footnote">
              占比以全部纳入分析的付费用户为分母。IP 地域仅供参考；地址缺失或解析失败归入“未知”。
            </p>
          </article>

          <article class="analysis-card">
            <div class="card-heading">
              <h4>注册到首次付款时长</h4>
              <span>有效样本 {{ data.duration.sampleCount }} / {{ data.paidUsers }} 人</span>
            </div>
            <p class="card-note">从账号注册到首次真实付款成功，复购不重置起点。</p>
            <div class="duration-stats">
              <div>
                <span>中位时长</span><strong>{{ duration(data.duration.medianSeconds) }}</strong>
              </div>
              <div>
                <span>平均时长</span><strong>{{ duration(data.duration.meanSeconds) }}</strong>
              </div>
              <div>
                <span>最快转化</span><strong>{{ duration(data.duration.minSeconds) }}</strong>
              </div>
              <div>
                <span>最慢转化</span><strong>{{ duration(data.duration.maxSeconds) }}</strong>
              </div>
            </div>
            <div v-if="data.duration.sampleCount" class="duration-bars">
              <div v-for="bucket in data.duration.buckets" :key="bucket.label" class="duration-row">
                <span>{{ bucket.label }}</span>
                <el-progress
                  :percentage="progress(bucket.share)"
                  :show-text="false"
                  :stroke-width="9"
                  color="#14b8a6"
                />
                <span
                  ><b>{{ bucket.count }} 人</b> · {{ percent(bucket.share) }}</span
                >
              </div>
            </div>
            <el-empty v-else description="暂无有效的首付时长样本" :image-size="70" />
            <p v-if="data.duration.sampleCount" class="duration-insight">
              <strong>{{ percent(data.duration.withinDayShare) }}</strong> 在 24 小时内付费，
              <strong>{{ percent(data.duration.withinWeekShare) }}</strong> 在 7 天内付费。
            </p>
            <p v-if="data.duration.invalidUsers" class="card-footnote">
              {{
                data.duration.invalidUsers
              }}
              人的付款时间缺失或顺序异常，未进入时长统计，仍计入人数和地域分布。
            </p>
          </article>
        </div>
        <p class="paid-footnote">
          统计截至
          {{
            observedText
          }}（北京时间）。仅统计普通学生的真实付费，排除管理员、当前封禁账号、赠送和零金额订单。
          已全部退款者不纳入以上两项分析；部分退款、退款后再次付费及会员已到期者仍计入。时长占比以有效样本为分母。
        </p>
      </template>
      <el-skeleton v-else-if="loading" :rows="7" animated />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppButton from '@/components/AppButton.vue'
import { getPaidUserAnalytics, type PaidUserAnalytics } from '@/api/conversionAnalytics'
import { getApiErrorMessage } from '@/utils/request'

const data = ref<PaidUserAnalytics | null>(null)
const loading = ref(false)
const error = ref('')
let sequence = 0

// 累计数据单独刷新，日期筛选和其他统计失败不会清空该区域。
async function load() {
  const request = ++sequence
  loading.value = true
  error.value = ''
  try {
    const result = await getPaidUserAnalytics()
    if (request === sequence) data.value = result
  } catch (cause) {
    if (request === sequence) error.value = getApiErrorMessage(cause, '累计付费用户分析加载失败')
  } finally {
    if (request === sequence) loading.value = false
  }
}

// 截止时间固定北京时间，与后台其他运营统计的日期含义保持一致。
const observedText = computed(() =>
  data.value
    ? new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(data.value.observedAt))
    : '',
)

// 无分母用占位符，避免让未知比例看起来像真实的零值。
function percent(value: number | null): string {
  return value === null ? '—' : `${(value * 100).toFixed(1)}%`
}

// 图条使用实际人数占比，文本保留一位小数。
function progress(value: number | null): number {
  return Math.max(0, Math.min(100, (value ?? 0) * 100))
}

// 保留天、小时和分钟，快速付款使用秒，避免将不到一分钟显示为零分钟。
function duration(value: number | null): string {
  if (value === null) return '—'
  if (value < 60) return `${Number(value.toFixed(1))} 秒`
  const minutes = Math.floor(value / 60)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const remaining = minutes % 60
  return [
    days ? `${days} 天` : '',
    hours ? `${hours} 小时` : '',
    remaining ? `${remaining} 分钟` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

onMounted(() => {
  void load()
})
onBeforeUnmount(() => {
  sequence++
})
</script>

<style scoped lang="scss">
.paid-analysis {
  min-width: 0;
  padding: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
}
.paid-heading,
.paid-summary,
.paid-count,
.card-heading,
.bar-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
  font-size: 15px;
}
.scope-tag {
  display: inline-block;
  margin-left: 8px;
  padding: 4px 8px;
  background: #eef2ff;
  color: #6366f1;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 400;
  vertical-align: middle;
}
.paid-heading p,
.card-note,
.card-footnote,
.paid-footnote {
  color: #64748b;
  font-size: 12px;
  line-height: 1.8;
}
.paid-heading p {
  margin-top: 6px;
}
.paid-analysis > :deep(.el-alert) {
  margin-top: 16px;
}
.paid-body {
  margin-top: 20px;
  min-height: 100px;
}
.paid-summary {
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 10px 24px;
  margin-bottom: 20px;
}
.paid-count {
  justify-content: flex-start;
  color: #475569;
  font-size: 13px;
}
.paid-count strong {
  color: #4f46e5;
  font-size: 30px;
  font-weight: 600;
}
.paid-summary p,
.card-heading > span {
  color: #64748b;
  font-size: 12px;
}
.paid-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.analysis-card {
  min-width: 0;
  padding: 20px;
  border: 1px solid #e8edf4;
  border-radius: 10px;
}
.card-heading {
  flex-wrap: wrap;
  gap: 6px 12px;
}
.card-note {
  margin-top: 8px;
}
.region-list {
  max-height: 356px;
  overflow-y: auto;
  margin: 18px 0;
  padding-right: 10px;
  scrollbar-gutter: stable;
}
.region-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}
.region-rank {
  width: 22px;
  flex-shrink: 0;
  color: #94a3b8;
  text-align: center;
  font-size: 12px;
}
.region-content {
  flex: 1;
  min-width: 0;
}
.bar-heading {
  margin-bottom: 9px;
  color: #475569;
  font-size: 12px;
}
.bar-heading > span:first-child {
  overflow-wrap: anywhere;
}
.bar-heading > span:last-child {
  flex-shrink: 0;
  color: #64748b;
}
b {
  color: #334155;
  font-weight: 500;
}
.duration-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 18px 0;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}
.duration-stats > div {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.duration-stats span {
  color: #64748b;
  font-size: 12px;
}
.duration-stats strong {
  color: #0f172a;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
}
.duration-bars {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 0;
}
.duration-row {
  display: grid;
  grid-template-columns: 90px minmax(30px, 1fr) 102px;
  gap: 12px;
  align-items: center;
  color: #64748b;
  font-size: 12px;
}
.duration-row > span:last-child {
  text-align: right;
}
.duration-insight {
  margin-top: 20px;
  padding: 12px;
  color: #0f766e;
  background: #f0fdfa;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.8;
}
.card-footnote {
  margin-top: 16px;
}
.paid-footnote {
  margin-top: 16px;
}
@media (max-width: 1100px) {
  .paid-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .paid-analysis,
  .analysis-card {
    padding: 14px;
  }
  .paid-heading {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .duration-stats {
    padding: 12px;
    gap: 12px;
  }
  .duration-row {
    grid-template-columns: 78px minmax(20px, 1fr) 94px;
    gap: 8px;
  }
}
</style>
