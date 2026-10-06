<!-- 转化分析中的考前付费阶段比较，用日均新增人数识别付费高峰。 -->
<template>
  <section class="exam-payment-panel">
    <header>
      <div>
        <h3>考前付费高峰分析</h3>
        <p>{{ period }} · 考试节点 {{ data.examDate }} · 按付款日期分析</p>
      </div>
      <label class="exam-date"
        >考试日期
        <el-date-picker
          v-model="examDate"
          type="date"
          value-format="YYYY-MM-DD"
          :clearable="false"
          aria-label="考试日期"
          @change="emit('change')"
        />
      </label>
    </header>
    <div class="peak-summary">
      <div>
        <span>当前高峰阶段 · 按日均新增比较</span>
        <strong>{{ peakLabels || '暂无考前付费数据' }}</strong>
        <p v-if="peakLabels">日均 {{ peakAverage.toFixed(2) }} 人；相同日均值并列展示。</p>
        <p v-else>可扩大统计日期范围，或调整考试节点后查看。</p>
      </div>
      <div class="total">
        <span>所选范围内考前新增付费</span>
        <strong>{{ data.totalUsers }} <small>人</small></strong>
        <p>每位用户仅计入一个阶段</p>
      </div>
    </div>
    <AdminDataTable :data="data.stages" empty-text="暂无考前付费数据">
      <el-table-column prop="label" label="距考试时间" min-width="150" />
      <el-table-column label="实际统计日期" min-width="280">
        <template #default="{ row }">{{
          row.startDate ? `${row.startDate} 至 ${row.endDate}` : '—'
        }}</template>
      </el-table-column>
      <el-table-column label="已统计天数" width="110">
        <template #default="{ row }">{{ row.observedDays || '—' }}</template>
      </el-table-column>
      <el-table-column label="新增付费人数" width="120">
        <template #default="{ row }">{{ row.observedDays ? row.users : '—' }}</template>
      </el-table-column>
      <el-table-column label="占比" width="110">
        <template #default="{ row }">{{
          row.observedDays && row.share !== null ? `${(row.share * 100).toFixed(1)}%` : '—'
        }}</template>
      </el-table-column>
      <el-table-column label="日均新增付费" min-width="170">
        <template #default="{ row }">
          <div v-if="row.dailyAverage !== null" class="average">
            <el-progress
              :percentage="peakAverage ? (row.dailyAverage / peakAverage) * 100 : 0"
              :show-text="false"
              :stroke-width="8"
              color="#818cf8"
            />
            <strong>{{ row.dailyAverage.toFixed(2) }}</strong>
          </div>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="统计状态" width="140">
        <template #default="{ row }">
          <el-tag
            :type="
              row.status === 'complete' ? 'success' : row.status === 'ongoing' ? 'warning' : 'info'
            "
            effect="light"
          >
            {{ statusLabels[row.status as keyof typeof statusLabels] }}
          </el-tag>
        </template>
      </el-table-column>
    </AdminDataTable>
    <p class="note">
      以每位用户最早一笔未全额退款的真实付款为准，包含所选日期之前注册的用户；复购不重复计数，部分退款后仍有实付金额的订单保留。
      封禁用户、赠送和零金额订单不计入；考试当天及之后不计入。此处不受注册转化观察期影响。
    </p>
    <p class="note">
      日均 = 新增付费人数 ÷
      实际统计的自然日数（含今日，今日数据尚未完整）。部分覆盖及统计中的阶段仅反映已统计日期；小样本高峰供参考，扩大至近
      90 天可观察更完整的考前走势。
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import type { ExamPaymentAnalysis } from '@/api/conversionAnalytics'

const props = defineProps<{ data: ExamPaymentAnalysis; period: string }>()
const examDate = defineModel<string>({ required: true })
const emit = defineEmits<{ change: [] }>()
const statusLabels = {
  not_started: '尚未开始',
  outside_range: '范围外',
  ongoing: '统计中',
  partial: '部分覆盖',
  complete: '完整阶段',
}
// 阶段长短不一，统一比较日均人数，避免长时间段天然占优。
const peakAverage = computed(() =>
  Math.max(0, ...props.data.stages.map((stage) => stage.dailyAverage ?? 0)),
)
// 零付款不产生高峰结论，日均相同时保留所有并列阶段。
const peakLabels = computed(() =>
  peakAverage.value > 0
    ? props.data.stages
        .filter((stage) => stage.dailyAverage === peakAverage.value)
        .map((stage) => stage.label)
        .join('、')
    : '',
)
</script>

<style scoped lang="scss">
.exam-payment-panel {
  padding: 22px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  min-width: 0;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
h3 {
  margin: 0;
  color: #1e293b;
  font-size: 17px;
}
p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}
.exam-date {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #475569;
}
.exam-date :deep(.el-date-editor) {
  width: 150px;
}
.peak-summary {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 22px;
  margin: 20px 0;
  padding: 20px;
  border-radius: 10px;
  background: #f5f5ff;
}
.peak-summary span {
  font-size: 12px;
  color: #64748b;
}
.peak-summary strong {
  display: block;
  margin-top: 8px;
  color: #4338ca;
  font-size: 22px;
}
.peak-summary small {
  font-size: 13px;
  font-weight: 400;
}
.total {
  min-width: 200px;
}
.average {
  display: flex;
  align-items: center;
  gap: 12px;
}
.average :deep(.el-progress) {
  flex: 1;
  min-width: 40px;
}
.average strong {
  min-width: 36px;
  font-weight: 500;
}
.note {
  margin-top: 12px;
}
@media (max-width: 768px) {
  .exam-payment-panel {
    padding: 16px;
  }
}
</style>
