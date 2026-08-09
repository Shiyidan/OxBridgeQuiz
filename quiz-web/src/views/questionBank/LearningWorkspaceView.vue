<!-- 试题学习工作区：固定全局导航，并为试题库、练习本与练习记录提供页面切换。 -->
<template>
  <div class="learning-workspace">
    <NavBar />
    <div class="learning-workspace__viewport">
      <Transition :name="transitionName" mode="out-in">
        <KeepAlive :include="['QuestionBankView']">
          <component :is="activeView" :key="activeViewKey" />
        </KeepAlive>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import QuestionBankView from './QuestionBankView.vue'
import PracticeNotebookView from './PracticeNotebookView.vue'
import PracticeNotebookCreateView from './PracticeNotebookCreateView.vue'
import PracticeRecordsView from './PracticeRecordsView.vue'

const route = useRoute()
const transitionName = ref('workspace-slide-forward')
// 当前路由映射为工作区内部页，避免全局导航参与页面切换动画。
const activeViewKey = computed(() => {
  if (route.name === 'practice-notebook-edit') return 'practice-notebook-edit'
  if (route.name === 'practice-notebook-new') return 'practice-notebook-new'
  if (route.name === 'practice-notebook') return 'practice-notebook'
  if (route.name === 'practice-records') return 'practice-records'
  return 'question-bank'
})
// 工作区视图按路由装载试题库、练习本、练习记录或练习本配置页。
const activeView = computed(() => {
  if (
    activeViewKey.value === 'practice-notebook-new' ||
    activeViewKey.value === 'practice-notebook-edit'
  )
    return PracticeNotebookCreateView
  if (activeViewKey.value === 'practice-notebook') return PracticeNotebookView
  if (activeViewKey.value === 'practice-records') return PracticeRecordsView
  return QuestionBankView
})

// 路由层级决定切换方向，深入配置页向左，返回上一级向右。
function getWorkspaceRouteOrder(routeName: unknown): number {
  if (routeName === 'practice-notebook-edit') return 2
  if (routeName === 'practice-notebook-new') return 2
  if (routeName === 'practice-notebook') return 1
  if (routeName === 'practice-records') return 1
  return 0
}

// 同一工作区内按页面顺序决定滑动方向。
watch(
  () => route.name,
  (nextRouteName, previousRouteName) => {
    if (nextRouteName === previousRouteName) return
    transitionName.value =
      getWorkspaceRouteOrder(nextRouteName) > getWorkspaceRouteOrder(previousRouteName)
        ? 'workspace-slide-forward'
        : 'workspace-slide-back'
  },
  { flush: 'sync' },
)
</script>

<style scoped>
.learning-workspace {
  min-height: 100vh;
  min-width: var(--fluid-page-min-width);
  overflow-x: clip;
  background: var(--color-bg);
}

.learning-workspace__viewport {
  min-height: calc(100vh - var(--nav-height));
  overflow-x: clip;
}

.workspace-slide-forward-enter-active,
.workspace-slide-forward-leave-active,
.workspace-slide-back-enter-active,
.workspace-slide-back-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.workspace-slide-forward-enter-from,
.workspace-slide-back-leave-to {
  opacity: 0;
  transform: translateX(56px);
}

.workspace-slide-forward-leave-to,
.workspace-slide-back-enter-from {
  opacity: 0;
  transform: translateX(-56px);
}

@media (prefers-reduced-motion: reduce) {
  .workspace-slide-forward-enter-active,
  .workspace-slide-forward-leave-active,
  .workspace-slide-back-enter-active,
  .workspace-slide-back-leave-active {
    transition-duration: 1ms;
  }
}
</style>
