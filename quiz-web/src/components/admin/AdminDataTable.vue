<template>
  <div class="admin-data-table">
    <div class="admin-data-table__wrap">
      <el-table
        v-loading="loading"
        v-bind="$attrs"
        :data="data"
        class="admin-data-table__table"
        stripe
        :empty-text="emptyText"
      >
        <slot />
      </el-table>
    </div>

    <div v-if="showPagination" class="admin-data-table__pagination">
      <AppPagination
        v-if="!loading"
        :page="page"
        :page-size="pageSize"
        :total="total"
        @update:page="emit('update:page', $event)"
        @update:page-size="emit('update:pageSize', $event)"
        @page-change="emit('page-change', $event)"
        @page-size-change="emit('page-size-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
// 后台通用数据表格：统一 Element Table 外壳、自然高度和分页器布局；
// 已用于用户管理、支付对账、营收与数据、真题库、试题库和大纲管理页面。
import AppPagination from '@/components/AppPagination.vue'

defineOptions({
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    data: T[]
    emptyText?: string
    loading?: boolean
    showPagination?: boolean
    page?: number
    pageSize?: number
    total?: number
  }>(),
  {
    emptyText: '暂无数据',
    loading: false,
    showPagination: false,
    page: 1,
    pageSize: 20,
    total: 0,
  },
)

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
  'page-change': [value: number]
  'page-size-change': [value: number]
}>()
</script>

<style scoped lang="scss">
.admin-data-table {
  flex: 0 1 auto;
  min-height: 0;
  width: 100%;
}

.admin-data-table__wrap {
  min-height: 0;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
}

.admin-data-table__pagination {
  flex-shrink: 0;
  margin-top: 10px;
  padding: 0;
  background: #f8fafc;
}

.admin-data-table__pagination:empty {
  display: none;
}

.admin-data-table__pagination :deep(.app-pagination) {
  padding: 0;
  border-top: 0;
  background: transparent;
}

:deep(.admin-data-table__table) {
  --el-table-border-color: var(--color-line-soft);
  --el-table-header-bg-color: #f0f3ff;
  --el-table-row-hover-bg-color: var(--color-hover);

  width: 100%;
  font-size: var(--text-sm);
}

:deep(.admin-data-table__table .el-table__cell) {
  padding: 12px 16px;
}

:deep(.admin-data-table__table th.el-table__cell) {
  color: #334155;
  font-weight: var(--weight-semi);
  background: #f0f3ff;
}

:deep(.admin-data-table__table .el-table__header-wrapper th.el-table__cell),
:deep(.admin-data-table__table .el-table__fixed-right th.el-table__cell) {
  background: #f0f3ff;
}

:deep(.admin-data-table__table th .cell),
:deep(.admin-data-table__table .el-table__fixed-right .cell) {
  overflow: visible;
  text-overflow: clip;
  white-space: nowrap;
}

:deep(.admin-data-table__table .el-table__row) {
  height: var(--height-table-row);
}
</style>
