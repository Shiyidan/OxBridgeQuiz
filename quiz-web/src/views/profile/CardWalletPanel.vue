<!-- 个人中心卡包：集中展示邀请周卡，并承接待启用卡券的考试确认与启用。 -->
<template>
  <section class="card-wallet-panel" aria-labelledby="card-wallet-title">
    <ProfileModuleHeading
      class="card-wallet-heading"
      kicker="MY CARD WALLET"
      title="我的卡包"
      description="集中查看账户收到的周卡及其他会员卡券"
      title-id="card-wallet-title"
    />

    <div v-if="loading" class="wallet-state">卡券加载中...</div>
    <div v-else-if="loadError" class="wallet-state wallet-state--error">
      <span>{{ loadError }}</span>
      <button type="button" @click="loadRewards">重新加载</button>
    </div>
    <template v-else>
      <div class="wallet-tabs profile-segment-tabs" role="tablist" aria-label="卡券状态筛选">
        <button
          v-for="tab in walletTabs"
          :key="tab.value"
          type="button"
          role="tab"
          :aria-selected="activeFilter === tab.value"
          :class="{ active: activeFilter === tab.value }"
          @click="selectFilter(tab.value)"
        >
          {{ tab.label }} {{ tab.count }}
        </button>
      </div>

      <div v-if="filteredRewards.length" class="wallet-preview">
        <div class="wallet-preview-summary">
          <span>
            当前预览 {{ visibleRewards.length }} 张，共 {{ filteredRewards.length }} 张卡券
          </span>
          <button type="button" aria-label="查看更多卡券" @click="walletListVisible = true">
            查看更多
            <el-icon aria-hidden="true"><ArrowRight /></el-icon>
          </button>
        </div>
        <div class="wallet-card-stack">
          <article
            v-for="(reward, index) in visibleRewards"
            :key="reward.id"
            class="wallet-card"
            :class="{
              'wallet-card--inactive': index < visibleRewards.length - 1,
              'wallet-card--activated': reward.status === 'activated',
              'wallet-card--daily': isDailyCard(reward),
              'wallet-card--monthly': isMonthlyCard(reward),
              'wallet-card--quarter': isQuarterCard(reward),
            }"
            :style="{ zIndex: index + 1 }"
            @click="bringToFront(reward.id)"
          >
            <div class="wallet-card-topline">
              <span>{{ rewardSourceLabel(reward) }} · {{ rewardCardKindLabel(reward) }}</span>
            </div>
            <div class="wallet-card-main">
              <h3>{{ rewardCardTitle(reward) }}</h3>
              <button
                v-if="cardActionLabel(reward)"
                type="button"
                :disabled="activationSaving || !canActivate(reward)"
                @click.stop="openActivation(reward)"
              >
                {{ cardActionLabel(reward) }}
              </button>
            </div>
            <div class="wallet-card-footer">
              <p>{{ rewardDescription(reward) }}</p>
              <small class="wallet-card-period">{{ rewardPeriodText(reward) }}</small>
            </div>
          </article>
        </div>
      </div>
      <div v-else class="wallet-state wallet-state--empty">当前分类暂无卡券</div>
    </template>

    <el-dialog
      v-model="walletListVisible"
      title="卡券详情"
      width="min(680px, calc(100vw - 32px))"
      align-center
      destroy-on-close
    >
      <div class="wallet-detail-list">
        <article
          v-for="reward in filteredRewards"
          :key="reward.id"
          class="wallet-card wallet-detail-card"
          :class="{
            'wallet-card--activated': reward.status === 'activated',
            'wallet-card--daily': isDailyCard(reward),
            'wallet-card--monthly': isMonthlyCard(reward),
            'wallet-card--quarter': isQuarterCard(reward),
          }"
        >
          <div class="wallet-card-topline">
            <span>{{ rewardSourceLabel(reward) }} · {{ rewardCardKindLabel(reward) }}</span>
          </div>
          <div class="wallet-card-main">
            <h3>{{ rewardCardTitle(reward) }}</h3>
            <button
              v-if="cardActionLabel(reward)"
              type="button"
              :disabled="activationSaving || !canActivate(reward)"
              @click="activateFromDetail(reward)"
            >
              {{ cardActionLabel(reward) }}
            </button>
          </div>
          <div class="wallet-card-footer">
            <p>{{ rewardDescription(reward) }}</p>
            <small class="wallet-card-period">{{ rewardPeriodText(reward) }}</small>
          </div>
        </article>
      </div>
    </el-dialog>

    <el-dialog
      v-model="activationVisible"
      :title="`选择${activationCardKindLabel}适用考试`"
      width="520px"
      align-center
      destroy-on-close
    >
      <div class="wallet-activation-content">
        <template v-if="activationUsesFixedExam">
          <div class="wallet-goal-summary">
            <span>本卡适用考试</span>
            <div>
              <strong>{{ activationExamType }}</strong>
            </div>
            <p>该考试由首次有效会员订单确定，启用时不能切换。</p>
          </div>
          <p class="wallet-recommendation">
            确认启用后，{{ activationExamType }} 会员到期时间将增加{{ activationDurationText }}。
          </p>
          <p>确认后考试类型不可修改；已有对应会员时，权益将直接追加到当前有效期之后。</p>
        </template>
        <template v-else-if="studyGoalExamTypes.length">
          <div class="wallet-goal-summary">
            <span>当前备考目标</span>
            <div>
              <strong v-for="examType in studyGoalExamTypes" :key="examType">
                {{ examType }}
              </strong>
            </div>
            <p>目标来源于注册时填写的信息或个人中心的后续修改。</p>
          </div>
          <p class="wallet-recommendation">
            {{ activationRecommendation }}
          </p>
          <el-radio-group v-model="activationExamType" class="wallet-exam-switch">
            <el-radio-button value="ESAT">ESAT</el-radio-button>
            <el-radio-button value="TMUA">TMUA</el-radio-button>
          </el-radio-group>
          <p>
            确认后考试类型不可修改；已有对应会员时，会员到期时间将增加{{ activationDurationText }}。
          </p>
        </template>
        <div v-else class="wallet-goal-empty">
          <strong>尚未设置备考目标</strong>
          <p>
            请先在个人中心完善目标考试，系统会据此推荐本张{{ activationCardKindLabel }}的适用考试。
          </p>
        </div>
      </div>
      <template #footer>
        <template v-if="activationUsesFixedExam || studyGoalExamTypes.length">
          <el-button :disabled="activationSaving" @click="activationVisible = false">
            取消
          </el-button>
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
import { ElMessage } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import ProfileModuleHeading from '@/components/ProfileModuleHeading.vue'
import {
  activateInvitationReward,
  getInvitationOverview,
  type InvitationRewardItem,
} from '@/api/invitations'
import { useAuthStore } from '@/stores/auth'

type WalletFilter = 'all' | 'pending' | 'activated'

const emit = defineEmits<{ membershipChanged: []; editGoals: [] }>()
const auth = useAuthStore()
const rewards = ref<InvitationRewardItem[]>([])
const loading = ref(true)
const loadError = ref('')
const activeFilter = ref<WalletFilter>('all')
const foregroundRewardId = ref('')
const walletListVisible = ref(false)
const activationVisible = ref(false)
const activationSaving = ref(false)
const activationRewardId = ref('')
const activationExamType = ref<'ESAT' | 'TMUA' | ''>('')

const activationReward = computed(
  () => rewards.value.find((reward) => reward.id === activationRewardId.value) || null,
)

const activationUsesFixedExam = computed(
  () =>
    activationReward.value?.beneficiaryRole === 'invitee' &&
    Boolean(activationReward.value.examType),
)

const activationCardKindLabel = computed(() =>
  activationReward.value && isDailyCard(activationReward.value)
    ? '日卡'
    : activationReward.value && isMonthlyCard(activationReward.value)
      ? '月卡'
      : activationReward.value && isQuarterCard(activationReward.value)
        ? '季卡'
        : '周卡',
)

const activationDurationText = computed(() =>
  activationReward.value && isDailyCard(activationReward.value)
    ? '一天'
    : activationReward.value && isMonthlyCard(activationReward.value)
      ? '三十天'
      : activationReward.value && isQuarterCard(activationReward.value)
        ? '九十天'
        : '七天',
)

const studyGoalExamTypes = computed(() =>
  (auth.memberContext?.studyPreferences.examTypes || []).filter(
    (examType): examType is 'ESAT' | 'TMUA' => examType === 'ESAT' || examType === 'TMUA',
  ),
)

const walletTabs = computed(() => [
  { value: 'all' as const, label: '全部', count: rewards.value.length },
  {
    value: 'pending' as const,
    label: '待启用',
    count: rewards.value.filter((reward) => reward.status === 'pending_activation').length,
  },
  {
    value: 'activated' as const,
    label: '已启用',
    count: rewards.value.filter((reward) => reward.status === 'activated').length,
  },
])

const filteredRewards = computed(() => {
  if (activeFilter.value === 'pending') {
    return rewards.value.filter((reward) => reward.status === 'pending_activation')
  }
  if (activeFilter.value === 'activated') {
    return rewards.value.filter((reward) => reward.status === 'activated')
  }
  return rewards.value
})

// 卡片默认按领取时间倒序，用户点击后把对应卡片置于叠放区最前方。
const visibleRewards = computed(() => {
  const preview = filteredRewards.value.slice(0, 4)
  const foregroundIndex = preview.findIndex((reward) => reward.id === foregroundRewardId.value)
  if (foregroundIndex < 0 || foregroundIndex === preview.length - 1) return preview
  const reordered = [...preview]
  const [foreground] = reordered.splice(foregroundIndex, 1)
  if (foreground) reordered.push(foreground)
  return reordered
})

const activationRecommendation = computed(() =>
  studyGoalExamTypes.value.length === 1
    ? `已根据你的备考目标推荐 ${studyGoalExamTypes.value[0]}，确认前仍可切换。`
    : `你正在同时准备多个考试，请选择本张${activationCardKindLabel.value}要使用的考试。`,
)

// 卡包只展示服务端返回的真实卡券，避免预览数据影响计数与启用操作。
async function loadRewards(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    const overview = await getInvitationOverview()
    rewards.value = overview.rewards
    foregroundRewardId.value = rewards.value[0]?.id || ''
  } catch {
    loadError.value = '卡券暂时无法加载，请稍后重试。'
  } finally {
    loading.value = false
  }
}

// 切换筛选时重置前景卡，保证新分类首张卡可直接操作。
function selectFilter(filter: WalletFilter): void {
  activeFilter.value = filter
  foregroundRewardId.value = ''
}

// 叠放卡片通过点击切换前景，不要求用户在重叠区域精确点击按钮。
function bringToFront(rewardId: string): void {
  foregroundRewardId.value = rewardId
}

// 只有已发放且未启用的奖励才开放使用入口，待首次支付的资格不提前启用。
function canActivate(reward: InvitationRewardItem): boolean {
  return reward.status === 'pending_activation' && Boolean(reward.grantedAt)
}

// 卡面始终展示卡券状态；未完成首次支付的周卡显示禁用的待启用入口。
function cardActionLabel(reward: InvitationRewardItem): string {
  if (canActivate(reward)) return '立即使用'
  if (reward.status === 'pending_activation') return '待启用'
  if (reward.status === 'activated') return '已启用'
  if (reward.status === 'expired') return '已过期'
  return ''
}

// 详情列表进入启用流程前先关闭列表，避免两个弹窗叠加影响确认操作。
function activateFromDetail(reward: InvitationRewardItem): void {
  walletListVisible.value = false
  void openActivation(reward)
}

// 所有卡券共用卡包主题弹窗；受邀周卡锁定支付考试，其他卡券结合备考目标选择。
async function openActivation(reward: InvitationRewardItem): Promise<void> {
  activationRewardId.value = reward.id
  activationExamType.value =
    reward.beneficiaryRole === 'invitee' && reward.examType
      ? reward.examType
      : studyGoalExamTypes.value.length === 1
        ? studyGoalExamTypes.value[0] || ''
        : ''
  activationVisible.value = true
}

// 启用成功后同时刷新卡包与会员上下文，由个人中心更新到期时间。
async function performActivation(
  reward: InvitationRewardItem,
  examType: 'ESAT' | 'TMUA',
  closeDialog = false,
): Promise<void> {
  activationSaving.value = true
  try {
    await activateInvitationReward(reward.id, examType)
    if (closeDialog) activationVisible.value = false
    await loadRewards()
    emit('membershipChanged')
    ElMessage.success(`${rewardDurationTitle(reward)}已启用`)
  } catch {
    await loadRewards()
  } finally {
    activationSaving.value = false
  }
}

// 弹窗确认后使用用户明确选择的考试类型启用邀请人奖励卡。
async function handleActivate(): Promise<void> {
  if (!activationReward.value || !activationExamType.value) return
  await performActivation(activationReward.value, activationExamType.value, true)
}

// 缺少备考目标时关闭卡包弹窗，并交由个人中心打开目标编辑区域。
function handleEditStudyGoals(): void {
  activationVisible.value = false
  emit('editGoals')
}

// 卡券来源区分邀请人和受邀人，帮助用户理解奖励原因。
function rewardSourceLabel(reward: InvitationRewardItem): string {
  if (isDailyCard(reward) || isQuarterCard(reward)) return '会员权益'
  if (reward.sourceType === 'admin_gift') return '推广有礼'
  return reward.beneficiaryRole === 'inviter' ? '邀请好友奖励' : '受邀注册奖励'
}

// 卡券时长同时决定卡面主题和日卡、周卡的展示名称。
function isDailyCard(reward: InvitationRewardItem): boolean {
  return reward.durationHours === 24
}

// 月卡按30天连续权益识别，使用独立蓝色主题避免与周卡和季卡混淆。
function isMonthlyCard(reward: InvitationRewardItem): boolean {
  return reward.durationHours === 30 * 24
}

// 季卡按90天连续权益识别，用于卡面主题与时长文案。
function isQuarterCard(reward: InvitationRewardItem): boolean {
  return reward.durationHours === 90 * 24
}

// 卡面顶部用简短类型区分日卡与周卡。
function rewardCardKindLabel(reward: InvitationRewardItem): string {
  if (isDailyCard(reward)) return '日卡'
  if (isMonthlyCard(reward)) return '月卡'
  if (isQuarterCard(reward)) return '季卡'
  return '周卡'
}

// 卡券详情和主标题共用同一时长名称，避免两处文案漂移。
function rewardDurationTitle(reward: InvitationRewardItem): string {
  if (isDailyCard(reward)) return '一日会员卡'
  if (isMonthlyCard(reward)) return '月度会员卡'
  if (isQuarterCard(reward)) return '季度会员卡'
  return '七天会员卡'
}

// 卡面标题统一带产品名，仅根据实际时长切换权益名称。
function rewardCardTitle(reward: InvitationRewardItem): string {
  return `AceMock ${rewardDurationTitle(reward)}`
}

// 卡面说明区分支付尚未完成与已经可以使用的待启用状态。
function rewardDescription(reward: InvitationRewardItem): string {
  if (reward.status === 'pending_activation' && !reward.grantedAt) {
    return '完成首次有效支付后即可启用'
  }
  if (reward.status === 'pending_activation') {
    if (isDailyCard(reward)) return '启用后获得一天对应考试会员权益'
    if (isMonthlyCard(reward)) return '启用后获得三十天对应考试会员权益'
    if (isQuarterCard(reward)) return '启用后获得九十天对应考试会员权益'
    return '启用后获得七天对应考试会员权益'
  }
  if (reward.status === 'activated') {
    if (isDailyCard(reward)) return '会员到期时间已增加一天'
    if (isMonthlyCard(reward)) return '会员到期时间已增加三十天'
    if (isQuarterCard(reward)) return '会员到期时间已增加九十天'
    return '会员到期时间已增加七天'
  }
  return reward.status === 'expired' ? '该卡券未在有效期内启用' : '该卡券已撤回'
}

// 时间统一使用本地日期展示，空值不输出误导信息。
function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

// 卡面底部优先展示可操作期限，启用后则展示实际权益周期。
function rewardPeriodText(reward: InvitationRewardItem): string {
  if (reward.status === 'pending_activation' && reward.grantedAt) {
    return `请于 ${formatDate(reward.activationDeadline)} 前启用`
  }
  if (reward.status === 'pending_activation') return '等待首次有效支付'
  if (reward.status === 'activated') {
    return `${formatDate(reward.startsAt)} — ${formatDate(reward.endsAt)}`
  }
  return reward.status === 'expired' ? '已超过启用期限' : '奖励资格已撤回'
}

onMounted(loadRewards)
</script>

<style scoped lang="scss">
.card-wallet-panel {
  box-sizing: border-box;
  min-width: 0;
  padding: 18px 20px 16px;
  border: 1px solid rgba(220, 225, 239, 0.88);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(44, 49, 86, 0.07);
}

.card-wallet-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.wallet-tabs button.active {
  background: #fff;
  color: #5b4bd6;
  box-shadow: 0 4px 12px rgba(71, 59, 147, 0.12);
  font-weight: 700;
}

.wallet-tabs button.active::after {
  position: absolute;
  left: 50%;
  bottom: -11px;
  width: 0;
  height: 0;
  border-top: 8px solid #fff;
  border-right: 10px solid transparent;
  border-left: 10px solid transparent;
  filter: drop-shadow(0 4px 4px rgba(71, 59, 147, 0.09));
  content: '';
  pointer-events: none;
  transform: translateX(-50%);
}

@media (prefers-reduced-motion: reduce) {
  .wallet-tabs button {
    transition: none;
  }
}

.wallet-preview-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0 6px;
  color: #7a748d;
  font-size: 11px;
}

.wallet-preview-summary button {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: 0 0 auto;
  padding: 3px 0;
  border: 0;
  background: transparent;
  color: #6858eb;
  cursor: pointer;
  font: inherit;
  font-weight: 650;
}

.wallet-preview-summary button:hover {
  color: #4936d1;
}

.wallet-preview-summary .el-icon {
  font-size: 13px;
}

.wallet-card-stack {
  width: 100%;
}

.wallet-card {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  display: flex;
  min-height: 116px;
  flex-direction: column;
  padding: 9px 12px;
  overflow: hidden;
  border: 1px solid rgba(82, 158, 188, 0.72);
  border-radius: 10px;
  background:
    radial-gradient(circle at 91% 8%, rgba(55, 202, 211, 0.48), transparent 31%),
    radial-gradient(circle at 5% 110%, rgba(61, 110, 172, 0.5), transparent 39%),
    repeating-linear-gradient(
      132deg,
      rgba(214, 243, 248, 0.07) 0,
      rgba(214, 243, 248, 0.07) 2px,
      transparent 2px,
      transparent 15px
    ),
    linear-gradient(135deg, #10243f 0%, #174d6b 52%, #168a91 100%);
  color: #fff;
  box-shadow:
    0 -7px 18px rgba(12, 43, 65, 0.3),
    0 12px 26px rgba(15, 91, 111, 0.28);
  cursor: pointer;
  transition:
    transform 160ms ease,
    opacity 160ms ease;
}

.wallet-card + .wallet-card {
  margin-top: -68px;
  box-shadow:
    0 -9px 20px rgba(28, 49, 54, 0.3),
    0 12px 24px rgba(29, 68, 67, 0.28);
}

.wallet-card--inactive {
  opacity: 1;
}

.wallet-card--activated {
  filter: saturate(0.72);
}

.wallet-card--daily {
  border-color: rgba(115, 151, 132, 0.72);
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
  box-shadow:
    0 -7px 18px rgba(48, 65, 57, 0.28),
    0 12px 26px rgba(50, 91, 70, 0.25);
}

.wallet-card--daily .wallet-card-topline,
.wallet-card--daily .wallet-card-footer p,
.wallet-card--daily .wallet-card-period {
  color: rgba(226, 240, 231, 0.88);
}

.wallet-card--daily .wallet-card-main button {
  background: #e1eee6;
  color: #315744;
}

.wallet-card--daily .wallet-card-main button:disabled {
  background: rgba(225, 238, 230, 0.76);
  color: rgba(49, 87, 68, 0.64);
}

.wallet-card--quarter {
  border-color: rgba(179, 132, 34, 0.72);
  background:
    radial-gradient(circle at 88% 18%, rgba(196, 151, 48, 0.62), transparent 28%),
    radial-gradient(circle at 8% 110%, rgba(164, 116, 17, 0.34), transparent 36%),
    repeating-linear-gradient(
      132deg,
      rgba(194, 151, 53, 0.08) 0,
      rgba(194, 151, 53, 0.08) 2px,
      transparent 2px,
      transparent 15px
    ),
    linear-gradient(135deg, #090909 0%, #17140d 58%, #8f650f 100%);
  box-shadow:
    0 -7px 18px rgba(43, 31, 5, 0.32),
    0 12px 26px rgba(116, 78, 7, 0.3);
}

.wallet-card--monthly {
  border-color: rgba(213, 166, 224, 0.55);
  background:
    radial-gradient(circle at 98% -8%, rgba(246, 157, 183, 0.7), transparent 34%),
    radial-gradient(circle at 4% 108%, rgba(137, 97, 223, 0.55), transparent 40%),
    repeating-linear-gradient(
      132deg,
      rgba(255, 255, 255, 0.06) 0,
      rgba(255, 255, 255, 0.06) 2px,
      transparent 2px,
      transparent 15px
    ),
    linear-gradient(135deg, #61328f, #922d79 72%, #cb5e8c);
  box-shadow:
    0 -6px 16px rgba(47, 25, 74, 0.2),
    0 10px 22px rgba(79, 35, 104, 0.24);
}

.wallet-card--monthly .wallet-card-topline,
.wallet-card--monthly .wallet-card-footer p,
.wallet-card--monthly .wallet-card-period {
  color: rgba(255, 255, 255, 0.84);
}

.wallet-card--monthly .wallet-card-main button {
  background: #fff;
  color: #7a3b85;
}

.wallet-card--monthly .wallet-card-main button:disabled {
  background: rgba(255, 255, 255, 0.78);
  color: rgba(87, 54, 101, 0.58);
}

.wallet-card--quarter .wallet-card-topline,
.wallet-card--quarter .wallet-card-footer p,
.wallet-card--quarter .wallet-card-period {
  color: rgba(205, 172, 94, 0.9);
}

.wallet-card--quarter .wallet-card-main button {
  background: #c59a35;
  color: #1f1806;
}

.wallet-card--quarter .wallet-card-main button:disabled {
  background: rgba(197, 154, 53, 0.72);
  color: rgba(31, 24, 6, 0.64);
}

.wallet-card:hover {
  transform: translateY(-2px);
}

.wallet-card-topline,
.wallet-card-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.wallet-card-topline {
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;
}

.wallet-card-main {
  align-items: flex-end;
  margin-top: 4px;
}

.wallet-card-main h3 {
  margin: 1px 0 2px;
  font-size: 16px;
  font-weight: 700;
}

.wallet-card-footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  white-space: nowrap;
}

.wallet-card-footer p {
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 11px;
}

.wallet-card-main button,
.wallet-state button {
  flex: 0 0 auto;
  padding: 6px 10px;
  border: 0;
  border-radius: 7px;
  background: #d9f3f5;
  color: #15556a;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
}

.wallet-card-main button:disabled {
  background: rgba(217, 243, 245, 0.76);
  color: rgba(21, 85, 106, 0.64);
  cursor: not-allowed;
}

.wallet-card-period {
  display: block;
  margin-top: 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 11px;
}

.wallet-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 150px;
  color: #777187;
  font-size: 13px;
}

.wallet-state--error {
  color: #b5534a;
}

.wallet-state--empty {
  margin-top: 10px;
  min-height: 130px;
  border: 1px dashed #ddd8f5;
  border-radius: 9px;
  background: #fbfaff;
}

.wallet-state button {
  border: 1px solid #8d7ef0;
  color: #5b4bd6;
}

.wallet-detail-list {
  display: grid;
  gap: 12px;
  max-height: min(62vh, 520px);
  padding: 2px 8px 10px 2px;
  overflow-y: auto;
}

.wallet-detail-card {
  width: 100%;
  min-height: 116px;
  cursor: default;
}

.wallet-detail-list .wallet-card + .wallet-card {
  margin-top: 0;
}

.wallet-detail-card:hover {
  transform: none;
}

.wallet-activation-content {
  display: grid;
  gap: 18px;
}

.wallet-activation-content > p {
  margin: 0;
  color: #6f6a85;
  font-size: 12px;
  line-height: 1.5;
}

.wallet-goal-summary,
.wallet-goal-empty {
  padding: 14px 16px;
  border: 1px solid #e4e0fb;
  border-radius: 10px;
  background: #f8f7ff;
}

.wallet-goal-summary > span {
  color: #777187;
  font-size: 12px;
}

.wallet-goal-summary > div {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.wallet-goal-summary strong {
  padding: 5px 10px;
  border-radius: 7px;
  background: #ebe8ff;
  color: #5144ca;
  font-size: 13px;
}

.wallet-goal-summary p,
.wallet-goal-empty p {
  margin: 7px 0 0;
  color: #777187;
  font-size: 12px;
}

.wallet-recommendation {
  color: #5144ca !important;
  font-weight: 650;
}

.wallet-exam-switch :deep(.el-radio-button__inner) {
  border-color: #ded9f4;
  background: #fff;
  color: #554f67;
  box-shadow: none;
  font-weight: 650;
}

.wallet-exam-switch :deep(.el-radio-button__inner:hover) {
  border-color: #9b91ef;
  color: #5b4bd6;
}

.wallet-exam-switch :deep(.el-radio-button.is-active .el-radio-button__inner),
.wallet-exam-switch :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: #8a7eeb !important;
  background: #eeebff !important;
  color: #5144ca !important;
  box-shadow: -1px 0 0 0 #8a7eeb !important;
}

@media (max-width: 560px) {
  .card-wallet-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .wallet-card-main {
    align-items: flex-start;
    flex-direction: column;
  }

  .wallet-detail-list article {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
