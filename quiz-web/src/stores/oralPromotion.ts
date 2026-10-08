// 英语口语推广共享状态：导航、悬挂入口、介绍弹窗及支付避让共用。
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import { recordPromotionEvent, type PromotionSource } from '@/api/promotion'
import { useAuthStore } from '@/stores/auth'

const DISMISS_KEY = 'acemock:oral-promotion:charm-dismissed-date'
const FOCUSED_ROUTES = new Set(['practice', 'diagnostic-exam', 'mock-exam-session'])

// 关闭记忆按浏览器当地自然日计算，跨午夜后允许再次展示。
function currentDay(): string {
  const date = new Date()
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

// 隐私模式禁用存储时仍允许推广正常展示和在本次会话内关闭。
function readDismissedDay(): string {
  try {
    return localStorage.getItem(DISMISS_KEY) || ''
  } catch {
    return ''
  }
}

export const useOralPromotionStore = defineStore('oralPromotion', () => {
  const router = useRouter()
  const auth = useAuthStore()
  const today = ref(currentDay())
  const dismissedDay = ref(readDismissedDay())
  const dialogVisible = ref(false)
  const paymentOwners = ref(new Set<symbol>())

  // 答题、考试、后台与支付期间不提供推广操作，避免打断关键流程。
  const available = computed(() => {
    const route = router.currentRoute.value
    return (
      !FOCUSED_ROUTES.has(String(route.name)) &&
      !route.path.startsWith('/admin') &&
      paymentOwners.value.size === 0
    )
  })
  // 当天关闭只隐藏悬挂入口，常驻导航入口仍然可用。
  const charmVisible = computed(() => available.value && dismissedDay.value !== today.value)

  // 统计只用于观察推广兴趣，失败静默处理，不影响用户操作。
  function trackOpen(entry: PromotionSource): void {
    if (!auth.isLoggedIn || auth.isAdmin) return
    void recordPromotionEvent({
      event: 'open',
      source: entry,
      page: String(router.currentRoute.value.name || 'unknown'),
    }).catch(() => undefined)
  }

  // 所有入口直接打开包含课程说明和咨询二维码的同一弹窗。
  function open(entry: PromotionSource): void {
    if (!available.value || dialogVisible.value) return
    dialogVisible.value = true
    trackOpen(entry)
  }

  // 本地关闭立即生效；持久化失败时保留本次应用会话的关闭状态。
  function dismiss(): void {
    refreshDay()
    dismissedDay.value = today.value
    try {
      localStorage.setItem(DISMISS_KEY, today.value)
    } catch {
      // 浏览器禁用存储时不阻断关闭操作。
    }
  }

  // 页面重新获得焦点或跨午夜时更新日期，让次日推广恢复。
  function refreshDay(): void {
    today.value = currentDay()
  }

  // 多标签页共享关闭日期；清除浏览器存储后允许重新展示。
  function syncDismissal(event: StorageEvent): void {
    if (event.key === DISMISS_KEY || event.key === null) {
      dismissedDay.value = event.newValue || ''
      refreshDay()
    }
  }

  // 多处可挂载支付弹窗，按实例登记，避免一个关闭误恢复另一个的推广。
  function setPaymentOpen(owner: symbol, open: boolean): void {
    if (open) {
      paymentOwners.value.add(owner)
      dialogVisible.value = false
    } else paymentOwners.value.delete(owner)
  }

  return {
    available,
    charmVisible,
    dialogVisible,
    open,
    dismiss,
    refreshDay,
    syncDismissal,
    setPaymentOpen,
  }
})
