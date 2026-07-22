<!-- 诊断分段标签：统一展示 ESAT 学科模块与 TMUA Paper 1/2 的顺序和配色。 -->
<template>
  <div
    class="subject-module-tags"
    :class="`subject-module-tags--${align}`"
    aria-label="试卷学科或分卷"
  >
    <el-tag
      v-for="module in orderedModules"
      :key="`${module.order}-${module.code}`"
      class="subject-module-tag"
      :class="`subject-module-tag--${subjectType(module.code)}`"
      effect="light"
      round
    >
      {{ moduleLabel(module) }}
    </el-tag>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PaperModuleOutline } from '@/api/papers'

const props = defineProps<{
  modules: PaperModuleOutline[]
  align?: 'start' | 'center'
}>()

// 列表页居中、诊断卡片左对齐，颜色与间距保持一致。
const align = computed(() => props.align || 'center')

// 所有使用位置都按真实考试顺序展示模块，避免依赖接口数组的偶然顺序。
const orderedModules = computed(() => (
  [...props.modules].sort((left, right) => left.order - right.order)
))

// ESAT 五科与 TMUA 两卷分别映射到独立颜色，仅影响视觉识别。
function subjectType(code: string | null): string {
  const normalizedCode = String(code || '').toLowerCase()
  if (
    ['maths1', 'maths2', 'physics', 'chemistry', 'biology', 'paper1', 'paper2'].includes(
      normalizedCode,
    )
  ) {
    return normalizedCode
  }
  return 'general'
}

// 数学模块与 TMUA 分卷使用简洁展示名，内部稳定代码和业务判断保持不变。
function moduleLabel(module: PaperModuleOutline): string {
  const normalizedCode = String(module.code || '').toLowerCase()
  if (normalizedCode === 'maths1') return 'Math 1'
  if (normalizedCode === 'maths2') return 'Math 2'
  if (normalizedCode === 'paper1') return 'Paper 1'
  if (normalizedCode === 'paper2') return 'Paper 2'
  return module.subject
}
</script>

<style scoped lang="scss">
.subject-module-tags {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 6px;
}

.subject-module-tags--center {
  justify-content: center;
}

.subject-module-tags--start {
  justify-content: flex-start;
}

.subject-module-tag {
  flex: 0 0 auto;
  border-radius: var(--radius-pill);
  font-weight: var(--weight-semi);
  white-space: nowrap;
}

.subject-module-tag :deep(.el-tag__content) {
  white-space: nowrap;
}

.subject-module-tag--general {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
  color: #475569 !important;
}

.subject-module-tag--maths1 {
  background: #ecfeff !important;
  border-color: #a5f3fc !important;
  color: #0e7490 !important;
}

.subject-module-tag--maths2 {
  background: #f5f3ff !important;
  border-color: #ddd6fe !important;
  color: #6d28d9 !important;
}

.subject-module-tag--physics {
  background: #eff6ff !important;
  border-color: #bfdbfe !important;
  color: #1d4ed8 !important;
}

.subject-module-tag--chemistry {
  background: #fff7ed !important;
  border-color: #fed7aa !important;
  color: #c2410c !important;
}

.subject-module-tag--biology {
  background: #f0fdf4 !important;
  border-color: #bbf7d0 !important;
  color: #15803d !important;
}

.subject-module-tag--paper1 {
  background: #eef2ff !important;
  border-color: #c7d2fe !important;
  color: #4338ca !important;
}

.subject-module-tag--paper2 {
  background: #fdf4ff !important;
  border-color: #f0abfc !important;
  color: #a21caf !important;
}
</style>
