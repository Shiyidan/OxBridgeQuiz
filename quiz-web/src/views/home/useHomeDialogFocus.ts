/** 首页自定义弹窗的焦点管理：锁定背景并把 Tab 导航约束在当前对话框内。 */
import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// 只返回当前可见且可交互的元素，避免焦点落入条件隐藏的控件。
function getFocusableElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0,
  )
}

// 两个首页弹窗共用相同的背景隔离、焦点恢复与首尾循环规则。
export function useHomeDialogFocus(
  dialogRef: Ref<HTMLElement | null>,
  isVisible: () => boolean,
): { trapFocus: (event: KeyboardEvent) => void } {
  let previousFocus: HTMLElement | null = null
  let appWasAlreadyInert = false

  // 关闭或卸载时统一恢复页面交互，避免全局 inert 与滚动锁残留。
  function restorePageInteraction(): void {
    document.body.classList.remove('home-dialog-open')
    const appRoot = document.getElementById('app')
    if (appRoot && !appWasAlreadyInert) appRoot.removeAttribute('inert')
    previousFocus?.focus()
    previousFocus = null
    appWasAlreadyInert = false
  }

  // Tab 在对话框的首尾控件间循环；无可聚焦控件时保持在对话框容器。
  function trapFocus(event: KeyboardEvent): void {
    const dialog = dialogRef.value
    if (!dialog) return
    const focusableElements = getFocusableElements(dialog)
    if (!focusableElements.length) {
      event.preventDefault()
      dialog.focus()
      return
    }

    const firstElement = focusableElements[0]!
    const lastElement = focusableElements.at(-1)!
    const activeElement = document.activeElement
    if (event.shiftKey && (activeElement === firstElement || activeElement === dialog)) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  watch(isVisible, async (visible) => {
    if (!visible) {
      restorePageInteraction()
      return
    }
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.body.classList.add('home-dialog-open')
    const appRoot = document.getElementById('app')
    appWasAlreadyInert = appRoot?.hasAttribute('inert') ?? false
    if (appRoot && !appWasAlreadyInert) appRoot.setAttribute('inert', '')
    await nextTick()
    dialogRef.value?.focus()
  })

  onBeforeUnmount(restorePageInteraction)

  return { trapFocus }
}
