/** 邀请码与七天会员奖励 API。 */
import { callApi } from '@/utils/request'

export type InvitationRewardStatus =
  | 'pending_activation'
  | 'activated'
  | 'expired'
  | 'revoked'

export interface InvitationRewardItem {
  id: string
  sourceType: 'invitation' | 'admin_gift'
  beneficiaryRole: 'inviter' | 'invitee' | 'recipient'
  status: InvitationRewardStatus
  examType: 'ESAT' | 'TMUA' | null
  durationHours: number
  startsAt: string | null
  endsAt: string | null
  grantedAt: string | null
  activationDeadline: string | null
  activatedAt: string | null
  revokedAt: string | null
}

export interface InvitationOverview {
  code: string | null
  codeActive: boolean
  rewardLimit: number
  rewardedCount: number
  binding: {
    canBind: boolean
    reason: 'already_bound' | 'payment_exists' | 'expired' | null
    message: string
    deadline: string
    boundCode: string | null
  }
  stats: {
    registered: number
    pendingPayment: number
    rewarded: number
  }
  invitations: Array<{
    id: string
    invitee: string
    status: string
    boundAt: string
    inviterRewardStatus: string | null
  }>
  rewards: InvitationRewardItem[]
}

/** 注册页只校验邀请码可用性，不读取邀请人信息。 */
export function validateInvitationCode(code: string) {
  return callApi<{ valid: boolean }>({
    url: '/invitations/validate',
    method: 'GET',
    params: { code },
  })
}

/** 获取个人中心邀请、补填资格与会员卡状态。 */
export function getInvitationOverview() {
  return callApi<InvitationOverview>({
    url: '/invitations/me',
    method: 'GET',
  })
}

/** 创建或读取本人唯一邀请码。 */
export function createInvitationCode() {
  return callApi<{ code: string }>({
    url: '/invitations/code',
    method: 'POST',
  })
}

/** 注册后在固定入口限时补填邀请码。 */
export function bindInvitationCode(code: string) {
  return callApi<InvitationOverview>({
    url: '/invitations/bind',
    method: 'POST',
    body: { code },
  })
}

/** 用户在30天期限内选择考试并启用卡券。 */
export function activateInvitationReward(rewardId: string, examType: 'ESAT' | 'TMUA') {
  return callApi<{
    membership: { id: string; examType: string; startsAt: string; endsAt: string }
  }>({
    url: `/invitations/rewards/${encodeURIComponent(rewardId)}/activate`,
    method: 'POST',
    body: { examType },
  })
}
