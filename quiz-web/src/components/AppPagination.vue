<template>
  <div v-if="total > 0" class="app-pagination">
    <el-pagination
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      :layout="layout"
      @update:current-page="emit('update:page', $event)"
      @update:page-size="emit('update:pageSize', $event)"
      @current-change="emit('page-change', $event)"
      @size-change="emit('page-size-change', $event)"
    />
  </div>
</template>

<script setup lang="ts">
// 通用分页器：列表页统一通过 page/pageSize/total 对接 Element Plus 分页。
withDefaults(
  defineProps<{
    page: number
    pageSize: number
    total: number
    pageSizes?: number[]
    layout?: string
  }>(),
  {
    pageSizes: () => [10, 20, 50, 100],
    layout: 'total, sizes, prev, pager, next, jumper',
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
.app-pagination {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  padding-top: 14px;
  margin-top: 0;
  border-top: 1px solid #e5e8e8;
  background: #fbfbfa;
}

@media (max-width: 640px) {
  .app-pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
