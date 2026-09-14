<!-- 会员访问拦截弹窗：有管理员赠送日卡时优先启用，否则承接原有付费升级提示。 -->
<template>
  <AppDialog
    :model-value="modelValue"
    :title="dialogTitle"
    :loading="busy"
    @confirm="handlePrimaryAction"
    @cancel="handleCancel"
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
          <span class="daily-card-access-dialog__card-kind">{{ examType }} 会员权益 · 日卡</span>
          <strong>AceMock 一日会员卡</strong>
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

    <template #footer="{ cancel, confirm }">
      <AppButton type="secondary" size="small" :disabled="busy" @click="cancel">
        {{ resolvedCancelText }}
      </AppButton>
      <AppButton
        v-if="showMembershipChoice"
        type="secondary"
        size="small"
        :disabled="busy"
        @click="handleUpgradeChoice"
      >
        开通会员
      </AppButton>
      <AppButton size="small" :loading="busy" @click="confirm">
        {{ primaryActionText }}
      </AppButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppDialog from '@/components/AppDialog.vue'
import AppButton from '@/components/AppButton.vue'
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
      emit('update:modelValue', false)
      emit('activated')
      return
    }
    if (props.directUpgradeWhenNoCard && memberContext.pendingDailyCards.length === 0) {
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
  emit('update:modelValue', false)
  emit('upgrade')
}

// 取消按钮关闭当前拦截，并让业务页面自行决定后续返回行为。
function handleCancel(): void {
  if (busy.value) return
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
.daily-card-access-dialog__content {
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
  box-sizing: border-box;
  display: grid;
  gap: 4px;
  margin-top: 16px;
  padding: 14px 16px;
  overflow: hidden;
  border: 1px solid rgba(115, 151, 132, 0.72);
  border-radius: 10px;
  /* 沿用个人中心卡包日卡的绿色渐变、斜纹和阴影。 */
  background:
    radial-gradient(circle at 90% 12%, rgba(123, 176, 143, 0.5), transparent 30%),
    radial-gradient(circle at 5% 110%, rgba(84, 115, 101, 0.46), transparent 38%),
    repeating-linear-gradient(
      132deg,
      rgba(225, 238, 231, 0.07) 0,
      rgba(225, 238, 231, 0.07) 2px,
      transparent 2px,
      transparent 15px
    ),
    linear-gradient(135deg, #414a46 0%, #52635b 48%, #497a61 100%);
  color: rgba(226, 240, 231, 0.88);
  box-shadow:
    0 -7px 18px rgba(48, 65, 57, 0.28),
    0 12px 26px rgba(50, 91, 70, 0.25);
}

.daily-card-access-dialog__card-kind {
  font-size: 12px;
  line-height: 1.5;
}

.daily-card-access-dialog__card-note strong {
  margin: 4px 0;
  color: #fff;
  font-size: 20px;
  font-weight: 650;
  line-height: 1.4;
}

.daily-card-access-dialog__card-note small {
  color: rgba(226, 240, 231, 0.88);
  font-size: 12px;
  line-height: 1.5;
}

.daily-card-access-dialog__hint {
  color: var(--color-ink-muted);
  font-size: var(--text-sm);
}

.daily-card-access-dialog__hint {
  margin-top: 10px;
}

@keyframes daily-card-access-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
