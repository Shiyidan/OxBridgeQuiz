<!-- 个人中心邀请码面板：创建分享码、固定展示补填状态、查看邀请进度并启用七天会员卡。 -->
<template>
  <section class="invitation-panel" aria-labelledby="invitation-title">
    <ProfileModuleHeading
      kicker="INVITE & REWARD"
      title="邀请有礼"
      description="好友使用邀请码注册并完成首次会员支付，双方各得七天会员卡。"
      title-id="invitation-title"
    >
      <div v-if="overview" class="reward-progress">
        <strong>{{ overview.rewardedCount }}/{{ overview.rewardLimit }}</strong>
        <span>已获得周卡</span>
      </div>
    </ProfileModuleHeading>

    <div v-if="loading" class="invitation-state">邀请信息加载中...</div>
    <div v-else-if="loadError" class="invitation-state invitation-state--error">
      <span>{{ loadError }}</span>
      <button type="button" @click="loadOverview">重新加载</button>
    </div>

    <template v-else-if="overview">
      <div class="invitation-content-grid">
        <div class="invitation-left-column">
          <article class="invitation-card">
            <div class="card-title-line">
              <div class="invite-code-title">
                <span>我的邀请码</span>
                <strong>{{ overview.code || (overview.codeActive ? '尚未创建' : '已失效') }}</strong>
              </div>
              <button
                v-if="!overview.code && overview.codeActive"
                type="button"
                :disabled="creatingCode"
                @click="handleCreateCode"
              >
                {{ creatingCode ? '创建中...' : '创建邀请码' }}
              </button>
            </div>
            <template v-if="overview.code && overview.codeActive">
              <div class="share-actions">
                <button type="button" @click="copyText(overview.code, '邀请码已复制')">
                  复制邀请码
                </button>
                <button type="button" @click="copyText(shareUrl, '邀请链接已复制')">
                  复制邀请链接
                </button>
              </div>
              <p>同一邀请码可分享给多位新同学，每位同学首次有效支付最多触发一次奖励。</p>
            </template>
            <p v-else-if="!overview.codeActive" class="invitation-code-inactive">
              已获得三张七天会员卡，邀请码已失效，不能继续分享或绑定。
            </p>
          </article>

          <article class="invitation-card binding-card">
            <div class="card-title-line">
              <div>
                <span>我的邀请关系</span>
                <strong v-if="bindingTitle">{{ bindingTitle }}</strong>
              </div>
            </div>
            <div class="binding-control-row">
              <el-input
                v-model="bindingDraft"
                maxlength="16"
                autocomplete="off"
                placeholder="请输入好友邀请码"
                :disabled="!overview.binding.canBind || bindingSaving"
                @input="handleBindingInput"
              />
              <button
                type="button"
                class="binding-submit"
                :disabled="!overview.binding.canBind || !bindingDraft || bindingSaving"
                @click="handleBind"
              >
                {{ bindingSaving ? '绑定中...' : '确认绑定' }}
              </button>
            </div>
            <p :class="{ 'binding-disabled-reason': !overview.binding.canBind }">
              {{ bindingDescription }}
            </p>
          </article>

          <div class="invitation-history">
            <div class="section-heading">
              <div>
                <h3>邀请记录</h3>
                <p>仅展示受邀账号的脱敏标识和奖励进度。</p>
              </div>
            </div>
            <div v-if="overview.invitations.length" class="history-list">
              <div v-for="item in overview.invitations" :key="item.id" class="history-row">
                <div class="history-identity">
                  <span>{{ item.invitee }}</span>
                  <small>{{ formatTime(item.boundAt) }}</small>
                </div>
                <div class="history-progress-wrap">
                  <el-steps
                    class="invitation-progress"
                    :active="relationCompletedStepCount(item.status, item.inviterRewardStatus)"
                    finish-status="success"
                    process-status="wait"
                    align-center
                  >
                    <el-step v-for="step in INVITATION_PROGRESS_STEPS" :key="step" :title="step" />
                  </el-steps>
                  <small
                    v-if="relationProgressNote(item.status, item.inviterRewardStatus)"
                    class="history-progress-note"
                  >
                    {{ relationProgressNote(item.status, item.inviterRewardStatus) }}
                  </small>
                </div>
              </div>
            </div>
            <div v-else class="reward-empty">还没有好友通过你的邀请码注册。</div>
          </div>
        </div>

        <div class="reward-section">
          <div class="section-heading">
            <div>
              <h3>我的七天会员卡</h3>
              <p>每人终身最多获得三张，邀请人与受邀人来源合并计算。</p>
            </div>
          </div>
          <div v-if="overview.rewards.length" class="reward-list">
            <article v-for="reward in overview.rewards" :key="reward.id" class="reward-card">
              <div>
                <span>{{ rewardSourceLabel(reward) }}</span>
                <strong>{{ reward.examType || '待选择考试' }} · 七天会员卡</strong>
                <small>{{ rewardPeriodText(reward) }}</small>
              </div>
              <div class="reward-card-action">
                <span
                  v-if="reward.status !== 'pending_activation' || !reward.grantedAt"
                  :class="`reward-status reward-status--${reward.status}`"
                >
                  {{ rewardStatusLabel(reward.status) }}
                </span>
                <button
                  v-if="reward.status === 'pending_activation' && reward.grantedAt"
                  type="button"
                  :disabled="activationSaving"
                  @click="openActivation(reward)"
                >
                  {{ reward.beneficiaryRole === 'invitee' ? '启用周卡' : '选择考试并启用' }}
                </button>
              </div>
            </article>
          </div>
          <div v-else class="reward-empty">暂无七天会员卡，分享邀请码后可在这里查看奖励。</div>
        </div>
      </div>
    </template>

    <el-dialog
      v-model="activationVisible"
      title="选择周卡适用考试"
      width="520px"
      align-center
      destroy-on-close
    >
      <div class="activation-content">
        <template v-if="studyGoalExamTypes.length">
          <div class="activation-goal-summary">
            <span>当前备考目标</span>
            <div class="activation-goal-tags">
              <strong v-for="examType in studyGoalExamTypes" :key="examType">
                {{ examType }}
              </strong>
            </div>
            <p>目标来源于注册时填写的信息或个人中心的后续修改。</p>
          </div>
          <p v-if="studyGoalExamTypes.length === 1" class="activation-recommendation">
            已根据你的备考目标推荐 {{ studyGoalExamTypes[0] }}，确认前仍可切换。
          </p>
          <p v-else class="activation-recommendation">
            你正在同时准备多个考试，请选择本张周卡要使用的考试。
          </p>
          <el-radio-group v-model="activationExamType" class="activation-exam-switch">
            <el-radio-button value="ESAT">ESAT</el-radio-button>
            <el-radio-button value="TMUA">TMUA</el-radio-button>
          </el-radio-group>
          <p>确认后考试类型不可修改；已有对应会员时，七天权益将排在当前有效期之后。</p>
        </template>
        <div v-else class="activation-goal-empty">
          <strong>尚未设置备考目标</strong>
          <p>请先在个人中心完善目标考试，系统会据此推荐本张周卡的适用考试。</p>
        </div>
      </div>
      <template #footer>
        <template v-if="studyGoalExamTypes.length">
          <el-button :disabled="activationSaving" @click="activationVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="activationSaving"
            :disabled="!activationExamType"
            @click="handleActivate"
          >
            确认启用
          </el-button>
        </template>
        <template v-else>
          <el-button @click="activationVisible = false">稍后设置</el-button>
          <el-button type="primary" @click="handleEditStudyGoals">去完善备考目标</el-button>
        </template>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProfileModuleHeading from '@/components/ProfileModuleHeading.vue'
import {
  activateInvitationReward,
  bindInvitationCode,
  createInvitationCode,
  getInvitationOverview,
  type InvitationOverview,
  type InvitationRewardItem,
  type InvitationRewardStatus,
} from '@/api/invitations'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits<{ membershipChanged: []; editGoals: [] }>()
const auth = useAuthStore()
const overview = ref<InvitationOverview | null>(null)
const loading = ref(true)
const loadError = ref('')
const creatingCode = ref(false)
const bindingDraft = ref('')
const bindingSaving = ref(false)
const activationVisible = ref(false)
const activationSaving = ref(false)
const activationRewardId = ref('')
const activationExamType = ref<'ESAT' | 'TMUA' | ''>('')
const studyGoalExamTypes = computed(() =>
  (auth.memberContext?.studyPreferences.examTypes || []).filter(
    (examType): examType is 'ESAT' | 'TMUA' => examType === 'ESAT' || examType === 'TMUA',
  ),
)

const shareUrl = computed(() =>
  overview.value?.code
    ? `${window.location.origin}/register?invite=${encodeURIComponent(overview.value.code)}`
    : '',
)

const bindingTitle = computed(() => {
  if (!overview.value) return ''
  if (overview.value.binding.boundCode) return '已绑定好友邀请码'
  return overview.value.binding.canBind ? '可补填邀请码' : ''
})

const bindingDescription = computed(() => {
  if (!overview.value) return ''
  if (overview.value.binding.boundCode) return '绑定后不能再次编辑、替换或解绑。'
  if (!overview.value.binding.canBind) return overview.value.binding.message
  return `请在 ${formatTime(overview.value.binding.deadline)} 前完成绑定，首次支付成功后不可补填。`
})

// 邀请总览刷新后同步固定补填输入框，绑定成功也保持同一位置不可编辑展示。
async function loadOverview(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    overview.value = await getInvitationOverview()
    bindingDraft.value = overview.value.binding.boundCode || ''
  } catch {
    loadError.value = '邀请信息暂时无法加载，请稍后重试。'
  } finally {
    loading.value = false
  }
}

// 用户创建邀请码后直接刷新分享区域，不生成第二个当前邀请码。
async function handleCreateCode(): Promise<void> {
  creatingCode.value = true
  try {
    await createInvitationCode()
    await loadOverview()
    ElMessage.success('邀请码已创建')
  } catch {
    // 公共请求层展示服务端业务错误。
  } finally {
    creatingCode.value = false
  }
}

// 输入只保留大写字母和数字，避免粘贴空格造成无效提交。
function handleBindingInput(value: string): void {
  bindingDraft.value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16)
}

// 绑定不可撤销，确认后由服务端重新检查24小时期限、支付状态和并发绑定。
async function handleBind(): Promise<void> {
  if (!overview.value?.binding.canBind || !bindingDraft.value) return
  try {
    await ElMessageBox.confirm(
      `确认绑定邀请码 ${bindingDraft.value}？绑定成功后不能修改或解绑。`,
      '确认邀请关系',
      { type: 'warning', confirmButtonText: '确认绑定', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  bindingSaving.value = true
  try {
    overview.value = await bindInvitationCode(bindingDraft.value)
    bindingDraft.value = overview.value.binding.boundCode || bindingDraft.value
    ElMessage.success('邀请码绑定成功')
  } catch {
    await loadOverview()
  } finally {
    bindingSaving.value = false
  }
}

// 复制失败时给出可恢复反馈，不伪装成已经写入剪贴板。
async function copyText(value: string, message: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value)
    ElMessage.success(message)
  } catch {
    ElMessage.warning('复制失败，请手动选择并复制')
  }
}

// 周卡推荐只读取注册或个人中心保存的备考目标，避免会员状态替代用户真实意向。
function recommendedExamType(): 'ESAT' | 'TMUA' | '' {
  return studyGoalExamTypes.value.length === 1 ? studyGoalExamTypes.value[0] || '' : ''
}

// 未设置目标时关闭弹窗并交由个人中心进入备考目标编辑区域。
function handleEditStudyGoals(): void {
  activationVisible.value = false
  emit('editGoals')
}

// 受邀人确认时间即可启用既定考试，邀请人仍通过弹窗选择适用考试。
async function openActivation(reward: InvitationRewardItem): Promise<void> {
  if (reward.beneficiaryRole === 'invitee' && reward.examType) {
    try {
      await ElMessageBox.confirm(
        `确认启用 ${reward.examType} 七天会员卡？已有对应会员时，到期时间将增加七天。`,
        '启用七天会员卡',
        { type: 'success', confirmButtonText: '确认启用', cancelButtonText: '取消' },
      )
    } catch {
      return
    }
    await performActivation(reward.id, reward.examType)
    return
  }
  activationRewardId.value = reward.id
  activationExamType.value = recommendedExamType()
  activationVisible.value = true
}

// 启用成功后同步邀请卡与全局会员上下文，使个人中心立即展示新权益。
async function performActivation(
  rewardId: string,
  examType: 'ESAT' | 'TMUA',
  closeDialog = false,
): Promise<void> {
  activationSaving.value = true
  try {
    await activateInvitationReward(rewardId, examType)
    if (closeDialog) activationVisible.value = false
    await loadOverview()
    emit('membershipChanged')
    ElMessage.success('七天会员卡已启用')
  } catch {
    await loadOverview()
  } finally {
    activationSaving.value = false
  }
}

// 邀请人弹窗确认后使用其明确选择的考试类型执行启用。
async function handleActivate(): Promise<void> {
  if (!activationRewardId.value || !activationExamType.value) return
  await performActivation(activationRewardId.value, activationExamType.value, true)
}

// 时间统一使用用户本地时区展示，空值不输出误导日期。
function formatTime(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

// 奖励来源区分邀请人和受邀人，便于用户理解为何获得该卡。
function rewardSourceLabel(reward: InvitationRewardItem): string {
  return reward.beneficiaryRole === 'inviter' ? '邀请好友奖励' : '受邀注册奖励'
}

// 周卡周期根据状态展示可执行信息，不把待启用误写为已经开始。
function rewardPeriodText(reward: InvitationRewardItem): string {
  if (reward.status === 'pending_activation') {
    if (!reward.grantedAt) return '完成首次有效会员支付后可启用'
    return `请于 ${formatTime(reward.activationDeadline)} 前启用，逾期失效`
  }
  if (reward.status === 'expired') return '未在到账后30天内启用，奖励已失效'
  if (reward.status === 'revoked') return '触发订单退款，奖励已撤回'
  return `${formatTime(reward.startsAt)} — ${formatTime(reward.endsAt)}`
}

// 正常奖励只展示待启用和已启用，失效与撤回作为异常结果保留。
function rewardStatusLabel(status: InvitationRewardStatus): string {
  const labels: Record<InvitationRewardStatus, string> = {
    pending_activation: '待启用',
    activated: '已启用',
    expired: '已失效',
    revoked: '已撤回',
  }
  return labels[status]
}

const INVITATION_PROGRESS_STEPS = ['已注册', '待首次支付', '奖励已发放'] as const

// 邀请人在邀请码失效前已建立的关系可能晚于第三张卡支付，此时不误标第四张奖励已发放。
function relationCompletedStepCount(status: string, inviterRewardStatus: string | null): number {
  if (status === 'pending_payment') return 1
  if (status === 'rewarded' && !inviterRewardStatus) return 2
  return 3
}

// 退款、邀请码失效和奖励失效属于正常三步之外的结果，单独保留提示避免步骤状态产生歧义。
function relationProgressNote(status: string, inviterRewardStatus: string | null): string {
  if (status === 'refunded') return '订单已退款，奖励已撤回'
  if (status === 'rewarded' && !inviterRewardStatus) return '邀请码失效前已绑定，本次不再发放邀请人周卡'
  if (inviterRewardStatus === 'expired') return '邀请人奖励未按期启用，现已失效'
  return ''
}

onMounted(loadOverview)
</script>

<style scoped lang="scss">
.invitation-panel {
  box-sizing: border-box;
  margin-top: 16px;
  padding: 18px 20px 16px;
  border: 1px solid rgba(220, 225, 239, 0.88);
  border-radius: 12px;
  background: linear-gradient(135deg, #fbfaff 0%, #f4f2ff 100%);
  box-shadow: 0 10px 28px rgba(44, 49, 86, 0.07);
  color: #211f35;
}

.card-title-line,
.section-heading,
.history-row,
.reward-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-heading h3 {
  margin: 2px 0 0;
  font-size: 16px;
}

.section-heading p,
.invitation-card p,
.activation-content p {
  margin: 4px 0 0;
  color: #6f6a85;
  font-size: 12px;
  line-height: 1.45;
}

.reward-progress {
  min-width: 88px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #f7f6ff;
  text-align: center;
}

.reward-progress strong,
.reward-progress span {
  display: block;
}

.reward-progress strong {
  color: #5b4ce1;
  font-size: 1.15rem;
}

.reward-progress span {
  margin-top: 2px;
  color: #777187;
  font-size: 0.76rem;
}

.invitation-content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 12px;
  margin-top: 14px;
}

.invitation-left-column {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
}

.invitation-card,
.reward-card,
.invitation-history,
.reward-section {
  border: 1px solid #e2def8;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
}

.invitation-card {
  box-sizing: border-box;
  padding: 12px 14px;
}

.card-title-line span,
.reward-card span,
.history-row small {
  color: #7a748d;
  font-size: 0.78rem;
}

.card-title-line strong,
.reward-card strong {
  display: block;
  margin-top: 5px;
  font-size: 0.95rem;
}

.invite-code-title {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.invite-code-title strong {
  margin-top: 0;
}

button {
  border: 1px solid #7568e8;
  border-radius: 9px;
  padding: 8px 13px;
  background: #fff;
  color: #5144ca;
  cursor: pointer;
  font-weight: 650;
}

button:disabled {
  border-color: #d7d3e9;
  color: #aaa5b9;
  cursor: not-allowed;
}

.share-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.binding-control-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  margin-top: 8px;
}

.binding-disabled-reason {
  color: #9a5d43 !important;
}

.binding-submit {
  min-width: 104px;
  background: #6455df;
  color: #fff;
}

.reward-section,
.invitation-history {
  box-sizing: border-box;
  height: 100%;
  min-width: 0;
  padding: 14px;
}

.reward-list,
.history-list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.reward-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 10px;
  border-color: rgba(174, 125, 220, 0.58);
  background:
    radial-gradient(circle at 98% -8%, rgba(245, 161, 173, 0.5), transparent 35%),
    radial-gradient(circle at 4% 108%, rgba(151, 111, 237, 0.4), transparent 38%),
    repeating-linear-gradient(
      -34deg,
      rgba(255, 255, 255, 0.06) 0 1px,
      transparent 1px 7px
    ),
    linear-gradient(120deg, #21183c 0%, #51306d 56%, #a44d62 100%);
  box-shadow: 0 12px 24px rgba(73, 38, 98, 0.22);
}

.reward-card::before,
.reward-card::after {
  position: absolute;
  border: 1px solid rgba(255, 226, 241, 0.2);
  border-radius: 50%;
  content: '';
  pointer-events: none;
}

.reward-card::before {
  top: -92px;
  right: -56px;
  width: 184px;
  height: 184px;
  box-shadow:
    0 0 0 20px rgba(255, 222, 243, 0.08),
    0 0 0 45px rgba(255, 222, 243, 0.05);
}

.reward-card::after {
  right: 18px;
  bottom: -48px;
  width: 84px;
  height: 84px;
  border-color: rgba(255, 238, 247, 0.14);
}

.reward-card > div {
  position: relative;
  z-index: 1;
}

.reward-card > div:first-child {
  min-width: 0;
}

.reward-card > div:first-child > span {
  color: rgba(245, 232, 255, 0.84);
}

.reward-card > div:first-child > strong {
  color: #fff;
  letter-spacing: 0.01em;
}

.reward-card small {
  display: block;
  margin-top: 5px;
  color: rgba(245, 232, 255, 0.78);
}

.reward-card-action {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.reward-card-action button {
  border: 1px solid rgba(255, 242, 238, 0.68);
  background: linear-gradient(135deg, #fff4ed, #ffd9d1);
  color: #9a3555;
  box-shadow: 0 6px 14px rgba(42, 19, 53, 0.2);
}

.reward-status {
  padding: 4px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff4fb !important;
  backdrop-filter: blur(4px);
  font-weight: 700;
}

.reward-status--activated {
  background: rgba(220, 255, 235, 0.88);
  color: #277548 !important;
}

.reward-status--revoked,
.reward-status--expired {
  background: rgba(255, 235, 235, 0.9);
  color: #9a4f4f !important;
}

.history-row {
  display: grid;
  grid-template-columns: minmax(110px, 0.55fr) minmax(310px, 1.45fr);
  align-items: center;
  gap: 16px;
  padding: 7px 2px;
  border-bottom: 1px solid #efedf8;
}

.history-row:last-child {
  border-bottom: 0;
}

.history-identity {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.history-progress-wrap {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.invitation-progress {
  width: 100%;
}

.invitation-progress :deep(.el-step__icon) {
  z-index: 2;
  box-sizing: border-box;
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin: 0;
  border-width: 1px;
  font-size: 0;
}

.invitation-progress :deep(.el-step__head) {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  height: 16px;
}

.invitation-progress :deep(.el-step__icon-inner) {
  display: none;
}

.invitation-progress :deep(.el-step__head.is-success .el-step__icon) {
  border-color: #6655dc;
  background: #6655dc;
}

.invitation-progress :deep(.el-step__head.is-wait .el-step__icon) {
  border-color: #c9c5d8;
  background: #fff;
}

.invitation-progress :deep(.el-step__line) {
  display: none;
}

.invitation-progress :deep(.el-step:not(:last-child) .el-step__head::after) {
  content: '';
  position: absolute;
  z-index: 1;
  top: 50%;
  right: -50%;
  left: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: #dedbe9;
}

.invitation-progress :deep(.el-step:not(:last-child) .el-step__head.is-success::after) {
  background: #6655dc;
}

.invitation-progress :deep(.el-step__main) {
  margin-top: 3px;
}

.invitation-progress :deep(.el-step__title) {
  color: #928da0;
  font-size: 11px;
  line-height: 1.35;
}

.invitation-progress :deep(.el-step__title.is-success) {
  color: #5a4fbd;
  font-weight: 650;
}

.history-progress-note {
  color: #a45c42 !important;
  text-align: right;
}

.reward-empty,
.invitation-state {
  margin-top: 10px;
  padding: 12px;
  border: 1px dashed #d8d4ee;
  border-radius: 13px;
  color: #817b91;
  text-align: center;
}

.invitation-state--error button {
  margin-left: 12px;
}

.activation-content {
  display: grid;
  gap: 18px;
}

.activation-goal-summary,
.activation-goal-empty {
  padding: 14px 16px;
  border: 1px solid #e4e0fb;
  border-radius: 12px;
  background: #f8f7ff;
}

.activation-goal-summary > span {
  color: #777187;
  font-size: 12px;
}

.activation-goal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.activation-goal-tags strong {
  padding: 5px 10px;
  border-radius: 999px;
  background: #ebe8ff;
  color: #5144ca;
  font-size: 13px;
}

.activation-goal-empty strong {
  color: #302b4e;
  font-size: 15px;
}

.activation-recommendation {
  color: #5144ca !important;
  font-weight: 650;
}

.activation-exam-switch :deep(.el-radio-button__inner) {
  border-color: #ded9f4;
  background: #fff;
  color: #554f67;
  box-shadow: none;
  font-weight: 650;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    color 150ms ease;
}

.activation-exam-switch :deep(.el-radio-button__inner:hover) {
  border-color: #9b91ef;
  color: #5b4bd6;
}

.activation-exam-switch :deep(.el-radio-button.is-active .el-radio-button__inner),
.activation-exam-switch
  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: #8a7eeb !important;
  background: #eeebff !important;
  color: #5144ca !important;
  box-shadow: -1px 0 0 0 #8a7eeb !important;
}

@media (max-width: 760px) {
  .reward-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .invitation-content-grid {
    grid-template-columns: 1fr;
  }

  .invitation-left-column {
    grid-template-rows: auto;
  }

  .binding-control-row {
    grid-template-columns: 1fr;
  }

  .binding-submit {
    width: 100%;
  }

  .reward-section,
  .invitation-history {
    height: auto;
  }

  .reward-card-action {
    justify-items: start;
  }

  .history-row {
    grid-template-columns: 1fr;
    gap: 9px;
  }

  .history-identity {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
}
</style>
