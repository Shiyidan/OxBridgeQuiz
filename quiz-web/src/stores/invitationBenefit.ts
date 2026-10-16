/** 邀请福利提示状态：认证页完成导航后通知应用根层展示公共弹窗。 */
import { ref } from 'vue'
import { defineStore } from 'pinia'

// 暂时关闭认证后的自动邀请提示，恢复活动时开启此开关即可。
const INVITATION_BENEFIT_AUTO_SHOW_ENABLED = false

export const useInvitationBenefitStore = defineStore('invitationBenefit', () => {
  const visible = ref(false)

  // 等待新页面至少完成一次绘制，确保弹窗背景已经从认证页切换为目标页面。
  async function showAfterPagePaint(): Promise<void> {
    if (!INVITATION_BENEFIT_AUTO_SHOW_ENABLED) return
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
    })
    visible.value = true
  }

  function hide(): void {
    visible.value = false
  }

  return { visible, showAfterPagePaint, hide }
})
