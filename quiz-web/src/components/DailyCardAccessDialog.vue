<!-- 会员访问拦截弹窗：有管理员赠送日卡时优先启用，否则承接原有付费升级提示。 -->
<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="520px"
    class="daily-card-access-dialog"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :before-close="handleBeforeClose"
    append-to-body
    align-center
    @close="handleDialogClose"
  >
    <div class="daily-card-access-dialog__content" aria-live="polite">
      <div v-if="checking" class="daily-card-access-dialog__state">
        <span class="daily-card-access-dialog__spinner" aria-hidden="true" />
        <p>正在检查可用的免费日卡...</p>
      </div>

      <div v-else-if="errorMessage" class="daily-card-access-dialog__state">
        <span class="daily-card-access-dialog__error-mark" aria-hidden="true">!</span>
        <div>
          <p class="daily-card-access-dialog__error">{{ errorMessage }}</p>
          <p v-if="activationCompleted" class="daily-card-access-dialog__hint">
            日卡已经启用，不会重复消耗；点击“刷新会员状态”即可继续。
          </p>
        </div>
      </div>

      <template v-else-if="pendingDailyCard">
        <p class="daily-card-access-dialog__message">
          使用1张免费日卡，解锁当前考试会员权益24小时，会员到期后仍可查看历史报告。
        </p>
        <div class="daily-card-access-dialog__card-note">
          <strong>{{ examType }} 会员权益</strong>
          <span>启用成功后，可继续刚才的操作</span>
          <small v-if="activationDeadlineText"> 请在 {{ activationDeadlineText }} 前使用 </small>
        </div>
        <p v-if="pendingDailyCardCount > 1" class="daily-card-access-dialog__hint">
          账户中共有 {{ pendingDailyCardCount }} 张待启用日卡，本次仅使用1张。
        </p>
      </template>

      <p v-else class="daily-card-access-dialog__message">
        {{ resolvedUpgradeMessage }}
      </p>
    </div>

    <template #footer>
      <div class="daily-card-access-dialog__actions">
        <button type="button" class="button_cancel" :disabled="busy" @click="handleCancel">
          {{ resolvedCancelText }}
        </button>
        <button
          v-if="showMembershipChoice"
          type="button"
          class="button_cancel daily-card-access-dialog__upgrade"
          :disabled="busy"
          @click="handleUpgradeChoice"
        >
          开通会员
        </button>
        <button
          type="button"
          class="button_primary"
          :disabled="checking || activating"
          @click="handlePrimaryAction"
        >
          {{ primaryActionText }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { activateInvitationReward } from '@/api/invitations'
import { getMember, type PendingDailyCard } from '@/api/member'
import { useAuthStore } from '@/stores/auth'
import { getApiErrorMessage } from '@/utils/request'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    examType: 'ESAT' | 'TMUA'
    upgradeMessage?: string
    cancelText?: string
    directUpgradeWhenNoCard?: boolean
  }>(),
  {
    upgradeMessage: '',
    cancelText: '',
    directUpgradeWhenNoCard: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [visible: boolean]
  activated: []
  upgrade: []
  cancel: []
}>()

const auth = useAuthStore()
const checking = ref(false)
const activating = ref(false)
const errorMessage = ref('')
const accessCheckFailed = ref(false)
const activationCompleted = ref(false)
let actionHandled = false
let accessCheckSequence = 0
let interactionGeneration = 0

// 异步结果只允许写回当前仍可见、同考试且同登录用户的一次弹窗交互。
function isCurrentInteraction(
  generation: number,
  examType: 'ESAT' | 'TMUA',
  userId: string,
): boolean {
  return (
    generation === interactionGeneration &&
    props.modelValue &&
    props.examType === examType &&
    auth.user?.id === userId
  )
}

// 待启用日卡只读取会员上下文，保证所有会员拦截入口使用同一份资格数据。
const pendingDailyCards = computed<PendingDailyCard[]>(
  () => auth.memberContext?.pendingDailyCards || [],
)

// 服务端已经按可用期限返回卡片，拦截场景固定消耗列表中的第一张。
const pendingDailyCard = computed(() => pendingDailyCards.value[0] || null)

// 剩余张数用于帮助用户理解本次只会消耗一张卡。
const pendingDailyCardCount = computed(() => pendingDailyCards.value.length)

// 异步请求使用打开时冻结的考试类型校验，防止切换考试后误续接旧操作。
function hasMembershipForExam(examType: 'ESAT' | 'TMUA'): boolean {
  return (
    Boolean(auth.memberContext?.isAdmin) ||
    Boolean(auth.memberContext?.quotas?.[examType]?.isMember)
  )
}

// 查询和启用期间禁止关闭弹窗，避免用户误以为操作已经取消。
const busy = computed(() => checking.value || activating.value)

// 有卡时突出免费解锁，无卡时保持现有会员升级语义。
const dialogTitle = computed(() => {
  if (checking.value) return '正在检查会员权益'
  if (pendingDailyCard.value || activationCompleted.value) return '你已有免费日卡'
  return '需要会员权益'
})

// 未传入页面专属文案时提供适用于诊断和题库的通用升级提示。
const resolvedUpgradeMessage = computed(
  () => props.upgradeMessage || '当前操作需要对应考试的会员权益，开通会员后即可继续使用。',
)

// 未指定页面文案时，按免费卡和付费升级两种状态提供对应的取消语义。
const resolvedCancelText = computed(
  () => props.cancelText || (pendingDailyCard.value ? '暂不使用' : '暂不开通'),
)

// 日卡仍可启用时同时保留付费会员入口，让用户自主选择解锁方式。
const showMembershipChoice = computed(
  () => Boolean(pendingDailyCard.value) && !activationCompleted.value && !errorMessage.value,
)

// 异常按钮根据失败阶段区分重新检查、刷新状态和重试启用。
const primaryActionText = computed(() => {
  if (checking.value) return '检查中...'
  if (activating.value) return activationCompleted.value ? '刷新中...' : '启用中...'
  if (accessCheckFailed.value) return '重新检查'
  if (activationCompleted.value) return '刷新会员状态'
  if (pendingDailyCard.value) return '使用免费日卡'
  return '开通会员'
})

// 日卡期限按本地时区展示，帮助用户判断是否需要立即使用。
const activationDeadlineText = computed(() => {
  const deadline = pendingDailyCard.value?.activationDeadline
  if (!deadline) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(deadline))
})

// 每次打开都刷新会员上下文，避免已登录页面把后台刚发放的日卡误判为无卡。
async function prepareAccessState(): Promise<void> {
  const requestSequence = ++accessCheckSequence
  const generation = interactionGeneration
  const requestedExamType = props.examType
  const requestedUserId = auth.user?.id || ''
  errorMessage.value = ''
  accessCheckFailed.value = false
  activationCompleted.value = false
  checking.value = true
  try {
    const memberContext = await getMember()
    if (
      requestSequence !== accessCheckSequence ||
      !isCurrentInteraction(generation, requestedExamType, requestedUserId) ||
      memberContext.user.id !== requestedUserId
    ) {
      return
    }
    auth.setMemberContext(memberContext)
    if (hasMembershipForExam(requestedExamType)) {
      actionHandled = true
      emit('update:modelValue', false)
      emit('activated')
      return
    }
    if (props.directUpgradeWhenNoCard && memberContext.pendingDailyCards.length === 0) {
      actionHandled = true
      emit('update:modelValue', false)
      emit('upgrade')
    }
  } catch (error: unknown) {
    if (
      requestSequence !== accessCheckSequence ||
      !isCurrentInteraction(generation, requestedExamType, requestedUserId)
    ) {
      return
    }
    accessCheckFailed.value = true
    errorMessage.value = getApiErrorMessage(error, '暂时无法获取会员权益，请稍后重试。')
  } finally {
    if (requestSequence === accessCheckSequence && generation === interactionGeneration) {
      checking.value = false
    }
  }
}

// 日卡启用和会员上下文刷新分阶段记录，刷新失败后重试不会重复消耗卡券。
async function activateDailyCard(): Promise<void> {
  const card = pendingDailyCard.value
  if (!card && !activationCompleted.value) return
  const generation = interactionGeneration
  const requestedExamType = props.examType
  const requestedUserId = auth.user?.id || ''
  activating.value = true
  errorMessage.value = ''
  try {
    if (!activationCompleted.value && card) {
      await activateInvitationReward(card.id, requestedExamType)
      if (!isCurrentInteraction(generation, requestedExamType, requestedUserId)) return
      activationCompleted.value = true
    }
    const memberContext = await getMember()
    if (
      !isCurrentInteraction(generation, requestedExamType, requestedUserId) ||
      memberContext.user.id !== requestedUserId
    ) {
      return
    }
    auth.setMemberContext(memberContext)
    if (!hasMembershipForExam(requestedExamType)) {
      errorMessage.value = '日卡已启用，但会员权益尚未生效，请点击刷新会员状态。'
      return
    }
    actionHandled = true
    emit('update:modelValue', false)
    emit('activated')
  } catch (error: unknown) {
    if (!isCurrentInteraction(generation, requestedExamType, requestedUserId)) return
    const activationErrorMessage = activationCompleted.value
      ? getApiErrorMessage(error, '日卡已启用，但会员状态刷新失败，请重试。')
      : getApiErrorMessage(error, '免费日卡启用失败，请稍后重试。')
    if (!activationCompleted.value) {
      try {
        const memberContext = await getMember()
        if (
          !isCurrentInteraction(generation, requestedExamType, requestedUserId) ||
          memberContext.user.id !== requestedUserId
        ) {
          return
        }
        auth.setMemberContext(memberContext)
        if (hasMembershipForExam(requestedExamType)) {
          actionHandled = true
          emit('update:modelValue', false)
          emit('activated')
          return
        }
      } catch {
        // 保留最初的启用错误；后续按钮仍可重试同一操作。
      }
    }
    if (!isCurrentInteraction(generation, requestedExamType, requestedUserId)) return
    errorMessage.value = activationErrorMessage
  } finally {
    if (generation === interactionGeneration) activating.value = false
  }
}

// 用户主动选择付费方案时关闭日卡提示，并把冻结的原操作交给支付流程续接。
function handleUpgradeChoice(): void {
  if (busy.value) return
  actionHandled = true
  emit('update:modelValue', false)
  emit('upgrade')
}

// 主按钮按当前资格选择免费启用、错误重试或原有付费升级流程。
async function handlePrimaryAction(): Promise<void> {
  if (busy.value) return
  if (accessCheckFailed.value) {
    await prepareAccessState()
    return
  }
  if (pendingDailyCard.value || activationCompleted.value) {
    await activateDailyCard()
    return
  }
  actionHandled = true
  emit('update:modelValue', false)
  emit('upgrade')
}

// 取消按钮关闭当前拦截，并让业务页面自行决定后续返回行为。
function handleCancel(): void {
  if (busy.value) return
  actionHandled = true
  emit('update:modelValue', false)
  emit('cancel')
}

// Element Plus 关闭钩子在异步操作期间拒绝关闭，避免启用结果丢失。
function handleBeforeClose(done: () => void): void {
  if (!busy.value) done()
}

// 仅将右上角关闭等非按钮操作转换为一次取消事件。
function handleDialogClose(): void {
  if (actionHandled) {
    actionHandled = false
    return
  }
  emit('update:modelValue', false)
  emit('cancel')
}

// 每次打开重新读取当前上下文状态，并清除上一次交互留下的错误。
watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      interactionGeneration += 1
      accessCheckSequence += 1
      checking.value = false
      activating.value = false
      return
    }
    interactionGeneration += 1
    actionHandled = false
    void prepareAccessState()
  },
  { immediate: true },
)

// 弹窗可见期间若目标考试变化，立即废弃旧检查并按新考试重新判断权益。
watch(
  () => props.examType,
  () => {
    if (!props.modelValue) return
    interactionGeneration += 1
    activating.value = false
    actionHandled = false
    void prepareAccessState()
  },
)

// 页面卸载或切换账号时废弃所有在途结果，防止旧用户上下文回写全局状态。
onBeforeUnmount(() => {
  interactionGeneration += 1
  accessCheckSequence += 1
})
</script>

<style scoped lang="scss">
:global(.daily-card-access-dialog) {
  padding: 0;
  border-radius: 5px;
}

:global(.daily-card-access-dialog .el-dialog__header) {
  margin: 0;
  padding: 18px 24px 14px;
  border-bottom: 1px solid var(--color-line-soft);
}

:global(.daily-card-access-dialog .el-dialog__title) {
  color: var(--color-ink);
  font-size: var(--text-xl);
  font-weight: var(--weight-semi);
}

:global(.daily-card-access-dialog .el-dialog__headerbtn) {
  top: 14px;
  right: 18px;
}

:global(.daily-card-access-dialog .el-dialog__body) {
  padding: 20px 24px 8px;
}

:global(.daily-card-access-dialog .el-dialog__footer) {
  padding: 12px 24px 20px;
}

.daily-card-access-dialog__content {
  min-height: 84px;
  color: var(--color-ink-soft);
}

.daily-card-access-dialog__message,
.daily-card-access-dialog__state p,
.daily-card-access-dialog__hint {
  margin: 0;
  line-height: var(--leading-relaxed);
}

.daily-card-access-dialog__state {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.daily-card-access-dialog__spinner {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  border: 2px solid var(--color-line);
  border-top-color: var(--color-ink);
  border-radius: 50%;
  animation: daily-card-access-spin 0.8s linear infinite;
}

.daily-card-access-dialog__error-mark {
  display: grid;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  place-items: center;
  border-radius: 50%;
  background: var(--color-danger);
  color: var(--color-ink-inverse);
  font-weight: var(--weight-bold);
}

.daily-card-access-dialog__error {
  color: var(--color-danger);
}

.daily-card-access-dialog__card-note {
  display: grid;
  gap: 4px;
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-alt);
}

.daily-card-access-dialog__card-note strong {
  color: var(--color-ink);
}

.daily-card-access-dialog__card-note small,
.daily-card-access-dialog__hint {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.daily-card-access-dialog__hint {
  margin-top: 10px;
}

.daily-card-access-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.daily-card-access-dialog__actions button {
  min-width: 112px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 5px;
  white-space: nowrap;
}

.daily-card-access-dialog__upgrade {
  border-color: var(--color-ink-soft);
  color: var(--color-ink);
}

@keyframes daily-card-access-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  :global(.daily-card-access-dialog) {
    width: calc(100vw - 32px) !important;
  }

  .daily-card-access-dialog__actions {
    flex-direction: column-reverse;
  }

  .daily-card-access-dialog__actions button {
    width: 100%;
  }
}
</style>
