<!-- 营收与数据页面，用于管理员查看、导入和编辑成本记录 -->
<template>
  <div class="revenue-page">
    <div class="page-top-bar">
      <button class="back-btn" @click="$router.push('/admin')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        返回类别列表
      </button>
    </div>

    <div class="page-body">
      <div class="page-heading">
        <div>
          <h2 class="page-title">营收与数据</h2>
          <p class="page-desc">平台收入统计、用户增长数据与关键指标看板。</p>
        </div>
        <el-button type="primary" @click="openImportDialog">成本导入</el-button>
      </div>

      <div class="table-wrap">
        <el-table v-loading="loading" :data="costs" stripe>
          <el-table-column type="index" label="序号" width="80" />
          <el-table-column prop="rechargeItem" label="充值项" min-width="140" />
          <el-table-column label="金额" min-width="120">
            <template #default="{ row }">
              {{ formatAmount(row.amount) }}
            </template>
          </el-table-column>
          <el-table-column label="时间" min-width="160">
            <template #default="{ row }">
              {{ formatDate(row.occurredAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="operator" label="操作人" min-width="120" />
          <el-table-column label="报销情况" min-width="140">
            <template #default="{ row }">
              <el-tag :type="reimbursementTagType(row.reimbursementStatus)" effect="light">
                {{ reimbursementLabel(row.reimbursementStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
        <el-form-item label="充值项" prop="rechargeItem">
          <el-select v-model="form.rechargeItem" placeholder="请选择充值项">
            <el-option v-for="item in rechargeItems" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" :step="100" controls-position="right" />
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-select v-model="form.operator" placeholder="请选择操作人">
            <el-option v-for="item in operators" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间" prop="occurredAt">
          <el-date-picker v-model="form.occurredAt" type="date" placeholder="请选择时间" />
        </el-form-item>
        <el-form-item label="报销情况" prop="reimbursementStatus">
          <el-select v-model="form.reimbursementStatus" placeholder="请选择报销情况">
            <el-option
              v-for="item in reimbursementOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="可填写备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCost">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import request from '@/utils/request'

type ReimbursementStatus = 'unreimbursed' | 'reimbursing' | 'reimbursed' | 'non_reimbursable'

interface RevenueCost {
  id: string
  rechargeItem: string
  amount: number
  operator: string
  occurredAt: string
  reimbursementStatus: ReimbursementStatus
  remark: string | null
  createdAt: string
  updatedAt: string
}

interface CostForm {
  rechargeItem: string
  amount: number | undefined
  operator: string
  occurredAt: Date | undefined
  reimbursementStatus: ReimbursementStatus
  remark: string
}

const rechargeItems = ['deepseek', 'claude', 'codex']
const operators = ['S', 'L', 'P', 'SS']
const reimbursementOptions: Array<{ label: string; value: ReimbursementStatus }> = [
  { label: '未报销', value: 'unreimbursed' },
  { label: '报销中', value: 'reimbursing' },
  { label: '已报销', value: 'reimbursed' },
  { label: '不可报销', value: 'non_reimbursable' },
]

const costs = ref<RevenueCost[]>([])
const loading = ref(true)
const submitting = ref(false)
const dialogVisible = ref(false)
const editingCostId = ref<string | null>(null)
const formRef = ref<FormInstance>()

const form = reactive<CostForm>({
  rechargeItem: '',
  amount: undefined,
  operator: '',
  occurredAt: undefined,
  reimbursementStatus: 'unreimbursed',
  remark: '',
})

const rules: FormRules<CostForm> = {
  rechargeItem: [{ required: true, message: '请选择充值项', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  operator: [{ required: true, message: '请选择操作人', trigger: 'change' }],
  occurredAt: [{ required: true, message: '请选择时间', trigger: 'change' }],
  reimbursementStatus: [{ required: true, message: '请选择报销情况', trigger: 'change' }],
}

const isEditing = computed(() => Boolean(editingCostId.value))
const dialogTitle = computed(() => (isEditing.value ? '编辑成本' : '成本导入'))

function clearValidate(): void {
  void nextTick(() => formRef.value?.clearValidate())
}

function resetForm(): void {
  form.rechargeItem = ''
  form.amount = undefined
  form.operator = ''
  form.occurredAt = undefined
  form.reimbursementStatus = 'unreimbursed'
  form.remark = ''
  clearValidate()
}

function openImportDialog(): void {
  editingCostId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: RevenueCost): void {
  editingCostId.value = row.id
  form.rechargeItem = row.rechargeItem
  form.amount = Number(row.amount)
  form.operator = row.operator
  form.occurredAt = new Date(row.occurredAt)
  form.reimbursementStatus = row.reimbursementStatus
  form.remark = row.remark || ''
  dialogVisible.value = true
  clearValidate()
}

function formatAmount(amount: number): string {
  return `¥${Number(amount).toFixed(2)}`
}

function formatDate(date: string): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function reimbursementLabel(status: ReimbursementStatus): string {
  return reimbursementOptions.find((item) => item.value === status)?.label || status
}

function reimbursementTagType(status: ReimbursementStatus): 'primary' | 'success' | 'info' | 'warning' {
  const map: Record<ReimbursementStatus, 'primary' | 'success' | 'info' | 'warning'> = {
    unreimbursed: 'warning',
    reimbursing: 'primary',
    reimbursed: 'success',
    non_reimbursable: 'info',
  }
  return map[status]
}

function buildPayload() {
  return {
    rechargeItem: form.rechargeItem,
    amount: form.amount,
    operator: form.operator,
    occurredAt: form.occurredAt?.toISOString(),
    reimbursementStatus: form.reimbursementStatus,
    remark: form.remark.trim() || null,
  }
}

async function getList(): Promise<void> {
  loading.value = true
  try {
    const res = await request.get<{ costs: RevenueCost[] }>('/admin/revenue-costs/getList')
    costs.value = res.data.costs
  } catch (e: any) {
    ElMessage.error(e.response?.data?.errMsg || '成本数据加载失败')
  } finally {
    loading.value = false
  }
}

async function submitCost(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !form.occurredAt) return

  submitting.value = true
  try {
    if (editingCostId.value) {
      await request.put(`/admin/revenue-costs/${editingCostId.value}`, buildPayload())
    } else {
      await request.post('/admin/revenue-costs', buildPayload())
    }
    await getList()
    dialogVisible.value = false
    ElMessage.success(isEditing.value ? '成本记录更新成功' : '成本导入成功')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.errMsg || (isEditing.value ? '成本记录更新失败' : '成本导入失败'))
  } finally {
    submitting.value = false
  }
}

onMounted(getList)
</script>

<style scoped lang="scss">
.revenue-page { min-height: 100%; }
.page-top-bar { padding: 28px 40px 0; }
.back-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: none; background: transparent;
  font-size: 0.875rem; font-weight: 500; color: #64748b;
  cursor: pointer; border-radius: 8px; transition: all 0.15s ease;
  svg { width: 16px; height: 16px; }
  &:hover { color: #0f172a; background: #f1f5f9; }
}
.page-body { padding: 24px 40px 48px; }
.page-heading {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
  margin-bottom: 24px;
}
.page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
.page-desc { font-size: 0.9rem; color: #64748b; margin: 0; }
.table-wrap {
  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;
  overflow: hidden;
}

:deep(.el-select),
:deep(.el-date-editor.el-input),
:deep(.el-input-number) {
  width: 100%;
}

@media (max-width: 640px) {
  .page-top-bar { padding: 20px 20px 0; }
  .page-body { padding: 20px; }
  .page-heading { flex-direction: column; }
}
</style>
