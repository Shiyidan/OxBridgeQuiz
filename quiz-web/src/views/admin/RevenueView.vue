<template>
  <div class="revenue-page">
    <div class="page-body">
      <div class="page-heading">
        <div>
          <h2 class="page-title">营收与数据</h2>
          <p class="page-desc">平台收入统计、用户增长数据与关键指标看板。</p>
        </div>
        <el-button type="primary" @click="openImportDialog">成本导入</el-button>
      </div>

      <AdminDataTable
        v-model:page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :data="costs"
        :loading="loading"
        :total="pagination.total"
        empty-text="暂无成本记录"
        max-height="var(--revenue-table-max-height)"
        show-pagination
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      >
        <el-table-column
          type="index"
          label="序号"
          width="64"
          :index="tableIndex"
          align="center"
          header-align="center"
        />
        <el-table-column
          prop="costCategory"
          label="成本分类"
          width="180"
          class-name="cost-category-column"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <el-tag :type="costCategoryTagType(row.costCategory)" effect="light">
              {{ revenueCostCategoryLabel(row.costCategory) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="rechargeItem"
          label="成本项"
          width="132"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <div class="cost-item-cell">
              <span :class="['cost-item-tag', costItemClass(row.costCategory)]">
                {{ revenueCostItemLabel(row.rechargeItem) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="112" align="center" header-align="center">
          <template #default="{ row }">{{ formatAmount(row.amount) }}</template>
        </el-table-column>
        <el-table-column label="时间" width="142" align="center" header-align="center">
          <template #default="{ row }">{{ formatDate(row.occurredAt) }}</template>
        </el-table-column>
        <el-table-column
          prop="operator"
          label="操作人"
          width="90"
          align="center"
          header-align="center"
        />
        <el-table-column label="报销情况" width="120" align="center" header-align="center">
          <template #default="{ row }">
            <el-tag :type="reimbursementTagType(row.reimbursementStatus)" effect="light">
              {{ reimbursementLabel(row.reimbursementStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="remark"
          label="备注"
          min-width="179"
          align="center"
          header-align="center"
          show-overflow-tooltip
        />
        <el-table-column
          label="操作"
          width="96"
          fixed="right"
          align="center"
          header-align="center"
        >
          <template #default="{ row }">
            <button class="table-action-btn" type="button" @click.stop="openEditDialog(row)">
              编辑
            </button>
          </template>
        </el-table-column>
      </AdminDataTable>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form
        ref="formRef"
        class="cost-form"
        :model="form"
        :rules="rules"
        label-width="92px"
      >
        <el-form-item label="成本分类" prop="costCategory">
          <el-select
            v-model="form.costCategory"
            placeholder="请选择成本分类"
            @change="handleCostCategoryChange"
          >
            <el-option
              v-for="item in REVENUE_COST_CATEGORY_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="成本项" prop="rechargeItem">
          <el-select v-model="form.rechargeItem" placeholder="请选择成本项">
            <el-option
              v-for="item in availableCostItems"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            :step="100"
            controls-position="right"
          />
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
// 营收与数据页面：用于管理员查看、导入和编辑成本记录。
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getRevenueListData, updateRevenue, createRevenue, type RevenueItem } from '@/api/admin'
import AdminDataTable from '@/components/admin/AdminDataTable.vue'
import {
  REVENUE_COST_CATEGORY,
  REVENUE_COST_CATEGORY_OPTIONS,
  REVENUE_COST_ITEM_OPTIONS,
  normalizeRevenueCostCategory,
  normalizeRevenueCostItem,
  revenueCostCategoryLabel,
  revenueCostItemLabel,
  type RevenueCostCategory,
} from '@/constants/revenueCost'

type ReimbursementStatus = 'unreimbursed' | 'reimbursing' | 'reimbursed' | 'non_reimbursable'
type RevenueCost = RevenueItem & {
  costCategory: RevenueCostCategory
  reimbursementStatus: ReimbursementStatus
}

interface CostForm {
  costCategory: RevenueCostCategory
  rechargeItem: string
  amount: number | undefined
  operator: string
  occurredAt: Date | undefined
  reimbursementStatus: ReimbursementStatus
  remark: string
}

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
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const form = reactive<CostForm>({
  costCategory: REVENUE_COST_CATEGORY.TECHNICAL_INFRASTRUCTURE,
  rechargeItem: '',
  amount: undefined,
  operator: '',
  occurredAt: undefined,
  reimbursementStatus: 'unreimbursed',
  remark: '',
})

const rules: FormRules<CostForm> = {
  costCategory: [{ required: true, message: '请选择成本分类', trigger: 'change' }],
  rechargeItem: [{ required: true, message: '请选择成本项', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  operator: [{ required: true, message: '请选择操作人', trigger: 'change' }],
  occurredAt: [{ required: true, message: '请选择时间', trigger: 'change' }],
  reimbursementStatus: [{ required: true, message: '请选择报销情况', trigger: 'change' }],
}

const isEditing = computed(() => Boolean(editingCostId.value))
const dialogTitle = computed(() => (isEditing.value ? '编辑成本' : '成本导入'))
const availableCostItems = computed(() => REVENUE_COST_ITEM_OPTIONS[form.costCategory])

// 弹窗打开后等待表单挂载完成，再清理旧校验状态。
function clearValidate(): void {
  void nextTick(() => formRef.value?.clearValidate())
}

// 导入新成本时重置表单，避免沿用上一条编辑记录。
function resetForm(): void {
  form.costCategory = REVENUE_COST_CATEGORY.TECHNICAL_INFRASTRUCTURE
  form.rechargeItem = ''
  form.amount = undefined
  form.operator = ''
  form.occurredAt = undefined
  form.reimbursementStatus = 'unreimbursed'
  form.remark = ''
  clearValidate()
}

// 成本导入入口必须清空编辑 id，提交时才会走新增接口。
function openImportDialog(): void {
  editingCostId.value = null
  resetForm()
  dialogVisible.value = true
}

// 编辑时把行数据回填到表单，提交时走更新接口。
function openEditDialog(row: RevenueCost): void {
  editingCostId.value = row.id
  form.costCategory = normalizeRevenueCostCategory(row.costCategory)
  const normalizedItem = normalizeRevenueCostItem(row.rechargeItem)
  form.rechargeItem = availableCostItems.value.some((item) => item.value === normalizedItem)
    ? normalizedItem
    : ''
  form.amount = Number(row.amount)
  form.operator = row.operator
  form.occurredAt = new Date(row.occurredAt)
  form.reimbursementStatus = row.reimbursementStatus
  form.remark = row.remark || ''
  dialogVisible.value = true
  clearValidate()
}

// 金额统一按人民币展示，避免表格里裸数字缺少语义。
function formatAmount(amount: number): string {
  return `¥${Number(amount).toFixed(2)}`
}

// 成本表格只展示日期，和导入表单的日期粒度保持一致。
function formatDate(date: string): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 报销状态枚举统一由前端映射为中文标签。
function reimbursementLabel(status: ReimbursementStatus): string {
  return reimbursementOptions.find((item) => item.value === status)?.label || status
}

// 报销状态映射到 Element Plus 标签类型，保持表格状态可扫描。
function reimbursementTagType(
  status: ReimbursementStatus,
): 'primary' | 'success' | 'info' | 'warning' {
  const map: Record<ReimbursementStatus, 'primary' | 'success' | 'info' | 'warning'> = {
    unreimbursed: 'warning',
    reimbursing: 'primary',
    reimbursed: 'success',
    non_reimbursable: 'info',
  }
  return map[status]
}

// 成本分类使用固定标签颜色，方便管理员快速区分三类开支。
function costCategoryTagType(category: RevenueCostCategory): 'primary' | 'success' | 'warning' {
  const map: Record<RevenueCostCategory, 'primary' | 'success' | 'warning'> = {
    [REVENUE_COST_CATEGORY.TECHNICAL_INFRASTRUCTURE]: 'primary',
    [REVENUE_COST_CATEGORY.DEVELOPMENT_TOOLS]: 'success',
    [REVENUE_COST_CATEGORY.OPERATIONS_MARKETING]: 'warning',
  }
  return map[normalizeRevenueCostCategory(category)]
}

// 成本项颜色跟随所属分类，不再为每个供应商维护独立样式。
function costItemClass(category: RevenueCostCategory): string {
  return `cost-item-tag--${normalizeRevenueCostCategory(category)}`
}

// 切换分类后清空旧成本项，避免保存不属于新分类的组合。
function handleCostCategoryChange(): void {
  form.rechargeItem = ''
  formRef.value?.clearValidate('rechargeItem')
}

function tableIndex(index: number): number {
  return (pagination.page - 1) * pagination.pageSize + index + 1
}

// 表单提交前统一清洗字段，和后端成本 payload 保持一致。
function buildPayload() {
  return {
    costCategory: form.costCategory,
    rechargeItem: form.rechargeItem,
    amount: form.amount,
    operator: form.operator,
    occurredAt: form.occurredAt?.toISOString(),
    reimbursementStatus: form.reimbursementStatus,
    remark: form.remark.trim() || null,
  }
}

// 成本接口返回分页结构，页面只消费当前页列表和分页元数据。
async function getList(): Promise<void> {
  loading.value = true
  try {
    const data = await getRevenueListData({
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    costs.value = (data.list || []) as RevenueCost[]
    pagination.page = data.pagination.page
    pagination.pageSize = data.pagination.pageSize
    pagination.total = data.pagination.total
  } catch {
    costs.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 成本列表分页切换时只更新分页条件，并重新读取当前页数据。
async function handlePageChange(page: number): Promise<void> {
  pagination.page = page
  await getList()
}

// 修改每页数量后回到第一页，避免请求到不存在的页码。
async function handlePageSizeChange(pageSize: number): Promise<void> {
  pagination.pageSize = pageSize
  pagination.page = 1
  await getList()
}

// 根据是否存在编辑 id 选择新增或更新接口，成功后刷新表格。
async function submitCost(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !form.occurredAt) return

  submitting.value = true
  const wasEditing = Boolean(editingCostId.value)
  try {
    if (wasEditing && editingCostId.value) {
      await updateRevenue(editingCostId.value, buildPayload())
    } else {
      await createRevenue(buildPayload())
      pagination.page = 1
    }
    await getList()
    dialogVisible.value = false
    ElMessage.success(wasEditing ? '成本记录更新成功' : '成本导入成功')
  } catch {
    // Axios 公共响应处理会展示后端 errMsg。
  } finally {
    submitting.value = false
  }
}

onMounted(getList)
</script>

<style scoped lang="scss">
.revenue-page {
  --revenue-table-max-height: calc(100vh - var(--nav-height) - 170px);

  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.page-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 24px 40px 10px;
  overflow: hidden;
}

.page-heading {
  flex-shrink: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 10px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
}

.page-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

.table-action-btn {
  min-width: 48px;
  height: var(--height-button-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-ink);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-semi);
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background var(--duration-base) ease,
    border-color var(--duration-base) ease,
    color var(--duration-base) ease;
}

.table-action-btn:hover,
.table-action-btn:focus-visible {
  border-color: var(--color-line);
  background: var(--color-hover);
  color: var(--color-ink);
}

.cost-item-cell {
  display: flex;
  justify-content: center;
}

:deep(.admin-data-table__table .el-table__cell) {
  padding-right: 10px;
  padding-left: 10px;
}

:deep(.el-table td.cost-category-column .cell) {
  overflow: visible;
  text-overflow: clip;
}

.cost-item-tag {
  min-width: 82px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: var(--weight-semi);
  line-height: 1.2;
  text-align: center;
  white-space: nowrap;
}

.cost-item-tag--technical_infrastructure {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.cost-item-tag--development_tools {
  color: #047857;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.cost-item-tag--operations_marketing {
  color: #9a3412;
  background: #fff7ed;
  border-color: #fed7aa;
}

.cost-item-tag--default {
  color: #475569;
  background: #f8fafc;
  border-color: #cbd5e1;
}

.cost-form :deep(.el-select),
.cost-form :deep(.el-date-editor.el-input),
.cost-form :deep(.el-input-number) {
  width: 100%;
}

@media (max-width: 640px) {
  .page-body {
    padding: 20px;
  }

  .page-heading {
    flex-direction: column;
  }
}
</style>
