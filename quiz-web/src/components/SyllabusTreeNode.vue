<!-- 考纲树双语节点：中文在上、英文在下，仅在文字被截断时显示完整悬浮提示。 -->
<template>
  <el-tooltip
    :content="tooltipContent"
    :disabled="!hasOverflow"
    placement="right"
    :show-after="300"
    popper-class="syllabus-tree-node-tooltip"
  >
    <div ref="nodeRef" class="syllabus-tree-node" :aria-label="tooltipContent">
      <span ref="cnLabelRef" class="syllabus-tree-node__cn">{{ node.cn_label }}</span>
      <span ref="enLabelRef" class="syllabus-tree-node__en">{{ node.en_label }}</span>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface SyllabusTreeNodeData {
  code: string
  en_label: string
  cn_label: string
}

const props = defineProps<{
  node: SyllabusTreeNodeData
}>()

const nodeRef = ref<HTMLElement>()
const cnLabelRef = ref<HTMLElement>()
const enLabelRef = ref<HTMLElement>()
const hasOverflow = ref(false)
let resizeObserver: ResizeObserver | undefined

const tooltipContent = computed(() => `${props.node.cn_label}\n${props.node.en_label}`)

// 任一行超出当前可用宽度时才开放悬浮提示，完整显示的短名称不打扰阅读。
function measureTextOverflow(): void {
  const labels = [cnLabelRef.value, enLabelRef.value].filter(
    (element): element is HTMLElement => Boolean(element),
  )
  hasOverflow.value = labels.some(
    (element) => Math.ceil(element.scrollWidth) > Math.floor(element.clientWidth) + 1,
  )
}

// 节点挂载后持续监听可用宽度，侧栏和响应式布局变化时同步更新提示状态。
onMounted(async () => {
  await nextTick()
  measureTextOverflow()
  if (typeof ResizeObserver === 'undefined' || !nodeRef.value) return
  resizeObserver = new ResizeObserver(measureTextOverflow)
  resizeObserver.observe(nodeRef.value)
})

watch(
  () => [props.node.cn_label, props.node.en_label],
  async () => {
    await nextTick()
    measureTextOverflow()
  },
)

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<style scoped lang="scss">
.syllabus-tree-node {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
  padding: 6px 0;
}

.syllabus-tree-node__cn,
.syllabus-tree-node__en {
  display: block;
  overflow: hidden;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.syllabus-tree-node__cn {
  color: var(--color-ink);
  font-size: 14px;
  font-weight: var(--weight-semi);
}

.syllabus-tree-node__en {
  color: var(--color-ink-muted);
  font-size: 12px;
  font-weight: var(--weight-regular);
}

:global(.syllabus-tree-node-tooltip) {
  max-width: 360px;
  line-height: 1.55;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

@media (max-width: 780px), (max-device-width: 780px) {
  .syllabus-tree-node {
    gap: 2px;
    padding: 5px 0;
  }

  .syllabus-tree-node__cn {
    font-size: 12px;
  }

  .syllabus-tree-node__en {
    font-size: 10px;
  }
}
</style>
