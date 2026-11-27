// 学习与题库页面共用的考纲上下文：复用工作区数据，仅在当前任务可见时同步范围。
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLearningWorkspaceStore } from '@/stores/learningWorkspace'
import { resolveLearningWorkspaceTask } from '@/utils/learningWorkspaceRoute'

// 缓存页面保留自己的选中范围，避免另一任务的导航触发隐藏页面请求或改写地址。
export function useLearningScope(task: 'learning' | 'practice') {
  const auth = useAuthStore()
  const workspace = useLearningWorkspaceStore()
  const route = useRoute()
  const router = useRouter()
  const selectedCode = ref('')
  const initialized = ref(false)

  // 与外壳使用相同的分流规则，包含 TMUA 限制和历史深链接。
  const isActive = computed(
    () =>
      route.name === 'question-bank' &&
      resolveLearningWorkspaceTask(auth.activeExamType, route.query) === task,
  )
  // 页面只持有 code，标题和祖先始终来自当前考试的共享考纲索引。
  const selectedEntry = computed(() => workspace.index.get(selectedCode.value))
  // 讲义筛选和练习标题使用同一个正式考纲节点。
  const selectedNode = computed(() => selectedEntry.value?.node)
  // 无有效范围时提供稳定标题，不回退到另一个考试的旧名称。
  const title = computed(() => selectedNode.value?.cn_label || '综合考点')
  // 英文名称独立使用考纲字段，不从拼接标签拆分。
  const titleEn = computed(() => selectedNode.value?.en_label || title.value)
  // 空考纲也是加载完成，不能将没有节点误报成持续加载。
  const loading = computed(() => !initialized.value || workspace.syllabusLoading)
  // 初始化与考试切换期间不提前获取讲义或题量。
  const ready = computed(() => !loading.value && Boolean(selectedNode.value))
  // 路径从共享索引派生，面包屑与左侧考纲树保持一致。
  const breadcrumbs = computed(() => {
    const entry = selectedEntry.value
    if (!entry) return []
    return [...entry.parents, selectedCode.value].flatMap((code) => {
      const node = workspace.index.get(code)?.node
      return node ? [{ code, label: node.cn_label || node.label }] : []
    })
  })

  // 页内章节和面包屑选择仍走原地址，保留浏览器前进后退和分享链接。
  function selectKnowledge(code: string): void {
    if (!isActive.value || !workspace.index.has(code)) return
    workspace.select(code)
    void router.push({
      path: '/question-bank',
      query: { ...route.query, mode: task, code },
    })
  }

  watch(
    () => [isActive.value, route.query.code, workspace.selectedCode, workspace.syllabus] as const,
    () => {
      if (!isActive.value) return
      const requested = typeof route.query.code === 'string' ? route.query.code.trim() : ''
      const code = [requested, workspace.selectedCode, workspace.subjectCode].find((candidate) =>
        workspace.index.has(candidate),
      )
      selectedCode.value = code || ''
      if (code) workspace.select(code)
    },
    { immediate: true, flush: 'sync' },
  )

  // 等待全局考试偏好后复用合并中的考纲请求，不创建第二份考纲数据。
  onMounted(async () => {
    await auth.ensureMemberContext().catch(() => undefined)
    await workspace.loadSyllabus().catch(() => undefined)
    initialized.value = true
  })

  return {
    isActive,
    loading,
    ready,
    selectedCode,
    selectedNode,
    title,
    titleEn,
    breadcrumbs,
    selectKnowledge,
  }
}
