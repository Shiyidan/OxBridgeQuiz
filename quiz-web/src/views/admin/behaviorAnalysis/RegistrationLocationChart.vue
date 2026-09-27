<!-- 注册地址分布图：将国家和地区人数交给公共饼图展示。 -->
<template>
  <AdminDistributionPieChart title="注册学生国家和地区占比" :items="chartItems" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TrafficRegistrationLocationItem } from '@/api/admin'
import AdminDistributionPieChart from '@/components/admin/AdminDistributionPieChart.vue'

const props = defineProps<{ items: TrafficRegistrationLocationItem[] }>()

// 保留注册地址接口结构，转换为公共人数饼图所需的分类与人数。
const chartItems = computed(() => props.items.map((item) => ({
  label: item.location,
  count: item.registrationCount,
})))
</script>
