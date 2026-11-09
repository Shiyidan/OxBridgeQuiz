// 解析入口共用实时会员校验，保留原目标与定位参数供续费后恢复。
import { onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getExamReviewAccess } from '@/api/exam'

// 各业务页面共用相同的到期状态与恢复动作，避免新增入口遗漏资格检查。
export function useAnalysisMembershipAccess() {
  const route = useRoute()
  const analysisMembershipOpen = ref(false)
  const analysisExamType = ref('')
  const analysisChecking = ref(false)
  let active = true
  let pending: { id: string; path: string; proceed: () => void | Promise<unknown> } | null = null
  onBeforeUnmount(() => {
    active = false
    pending = null
  })

  // 只在来源仍有效时打开提示或进入原解析；网络错误交由公共请求层处理。
  async function checkAnalysisAccess(id: string, proceed: () => void | Promise<unknown>) {
    if (!id || analysisChecking.value || !active) return
    const intent = { id, path: route.fullPath, proceed }
    pending = intent
    analysisChecking.value = true
    try {
      const access = await getExamReviewAccess(id)
      if (!active || route.fullPath !== intent.path) return
      analysisExamType.value = access.examType
      if (!access.allowed) {
        analysisMembershipOpen.value = true
        return
      }
      pending = null
      analysisMembershipOpen.value = false
      await proceed()
    } catch {
      // 资格读取失败不能解释为会员到期，也不能跳转至解析。
    } finally {
      analysisChecking.value = false
    }
  }

  // 购买其他考试不会解锁当前目标，续费成功也必须重新校验原答卷。
  async function resumeAnalysis() {
    if (pending && active && route.fullPath === pending.path) {
      await checkAnalysisAccess(pending.id, pending.proceed)
    }
  }

  return {
    analysisMembershipOpen,
    analysisExamType,
    analysisChecking,
    checkAnalysisAccess,
    resumeAnalysis,
  }
}
