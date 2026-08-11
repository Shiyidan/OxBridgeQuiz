// 邀请码服务：统一处理邀请绑定、双边周卡发放、考试类型激活和退款撤回。
import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import {
  INVITATION_BINDING_SOURCE,
  INVITATION_BINDING_WINDOW_HOURS,
  INVITATION_RELATION_STATUS,
  INVITATION_REWARD_ACTIVATION_WINDOW_HOURS,
  INVITATION_REWARD_DURATION_HOURS,
  INVITATION_REWARD_LIFETIME_LIMIT,
  INVITATION_REWARD_PLAN,
  INVITATION_REWARD_ROLE,
  INVITATION_REWARD_STATUS,
  MEMBERSHIP_SOURCE,
  MEMBERSHIP_STATUS,
  PAYMENT_ORDER_STATUS,
  USER_ROLE,
  isStudentExamTypeAvailable,
} from '../constants/domain.js'
import { prisma } from './prisma.js'

type InvitationDatabase = typeof prisma | Prisma.TransactionClient

const INVITATION_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const INVITATION_CODE_LENGTH = 8
const QUALIFIED_REWARD_STATUSES = [
  INVITATION_REWARD_STATUS.ACTIVATED,
  INVITATION_REWARD_STATUS.EXPIRED,
  INVITATION_REWARD_STATUS.REVOKED,
]

export class InvitationError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly httpStatus = 409,
  ) {
    super(message)
    this.name = 'InvitationError'
  }
}

// 邀请码统一去除空格并转为大写，确保分享链接和手工输入使用同一规则。
export function normalizeInvitationCode(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

// 随机码排除容易混淆的字符，降低学生手工录入出错概率。
function generateInvitationCodeValue(): string {
  const bytes = crypto.randomBytes(INVITATION_CODE_LENGTH)
  return [...bytes]
    .map((value) => INVITATION_CODE_ALPHABET[value % INVITATION_CODE_ALPHABET.length])
    .join('')
}

// 周卡按连续小时计算，不受夏令时或自然日边界影响。
function addHours(value: Date, hours: number): Date {
  return new Date(value.getTime() + hours * 60 * 60 * 1000)
}

// 新权益排在同一考试最晚的有效或待生效权益之后，避免时长重叠浪费。
async function resolveNextMembershipStart(
  db: InvitationDatabase,
  userId: string,
  examType: string,
  now: Date,
): Promise<Date> {
  const latest = await db.userMembership.findFirst({
    where: {
      userId,
      examType,
      status: MEMBERSHIP_STATUS.ACTIVE,
      endsAt: { gt: now },
    },
    orderBy: { endsAt: 'desc' },
    select: { endsAt: true },
  })
  return latest && latest.endsAt > now ? latest.endsAt : now
}

// 只有已经正式到账的奖励计入终身上限；待首付资格不计数，退款撤回后仍保留占用。
async function countQualifiedRewards(db: InvitationDatabase, userId: string): Promise<number> {
  return db.invitationReward.count({
    where: {
      userId,
      OR: [
        {
          status: INVITATION_REWARD_STATUS.PENDING_ACTIVATION,
          grantedAt: { not: null },
        },
        { status: { in: QUALIFIED_REWARD_STATUSES } },
      ],
    },
  })
}

// 注册和个人中心补填共用同一个原子绑定入口，避免形成多位邀请人。
export async function bindInvitationForUser(
  db: Prisma.TransactionClient,
  input: {
    userId: string
    code: string
    source: (typeof INVITATION_BINDING_SOURCE)[keyof typeof INVITATION_BINDING_SOURCE]
    now?: Date
    enforceProfileEligibility?: boolean
  },
) {
  const now = input.now || new Date()
  const codeValue = normalizeInvitationCode(input.code)
  if (!/^[A-Z0-9]{6,16}$/.test(codeValue)) {
    throw new InvitationError('邀请码无效，请检查后重试', 'INVITATION_CODE_INVALID', 422)
  }

  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { id: true, createdAt: true },
  })
  if (!user) throw new InvitationError('用户不存在', 'INVITATION_USER_NOT_FOUND', 404)

  const existing = await db.invitationRelation.findUnique({
    where: { inviteeUserId: user.id },
    select: { id: true },
  })
  if (existing) {
    throw new InvitationError('已绑定好友邀请码，不能再次修改', 'INVITATION_ALREADY_BOUND')
  }

  if (input.enforceProfileEligibility) {
    const deadline = addHours(user.createdAt, INVITATION_BINDING_WINDOW_HOURS)
    if (now >= deadline) {
      throw new InvitationError(
        '需注册后24小时内填写邀请码，当前补填期限已结束',
        'INVITATION_BINDING_EXPIRED',
      )
    }
    const paidOrder = await db.paymentOrder.findFirst({
      where: {
        userId: user.id,
        status: {
          in: [
            PAYMENT_ORDER_STATUS.PAID,
            PAYMENT_ORDER_STATUS.REFUNDING,
            PAYMENT_ORDER_STATUS.REFUNDED,
          ],
        },
      },
      select: { id: true },
    })
    if (paidOrder) {
      throw new InvitationError(
        '已完成会员支付，无法补填邀请码',
        'INVITATION_BINDING_PAYMENT_EXISTS',
      )
    }
  }

  const invitationCode = await db.invitationCode.findUnique({
    where: { code: codeValue },
    select: { id: true, userId: true },
  })
  if (!invitationCode) {
    throw new InvitationError('邀请码无效，请检查后重试', 'INVITATION_CODE_INVALID', 422)
  }
  if (invitationCode.userId === user.id) {
    throw new InvitationError('不能使用自己的邀请码', 'INVITATION_SELF_BIND', 422)
  }
  if (await countQualifiedRewards(db, invitationCode.userId) >= INVITATION_REWARD_LIFETIME_LIMIT) {
    throw new InvitationError('邀请码无效，请检查后重试', 'INVITATION_CODE_INVALID', 422)
  }
  if (await countQualifiedRewards(db, user.id) >= INVITATION_REWARD_LIFETIME_LIMIT) {
    throw new InvitationError(
      '已获得三张七天会员卡，不能再绑定邀请码',
      'INVITATION_REWARD_LIMIT_REACHED',
    )
  }

  const relation = await db.invitationRelation.create({
    data: {
      inviterUserId: invitationCode.userId,
      inviteeUserId: user.id,
      invitationCodeId: invitationCode.id,
      source: input.source,
      boundAt: now,
    },
  })
  await db.invitationReward.create({
    data: {
      invitationRelationId: relation.id,
      userId: user.id,
      beneficiaryRole: INVITATION_REWARD_ROLE.INVITEE,
      status: INVITATION_REWARD_STATUS.PENDING_ACTIVATION,
      durationHours: INVITATION_REWARD_DURATION_HOURS,
    },
  })
  return relation
}

// 注册后补填使用最高隔离级别，使“支付先成功”和“邀请先绑定”的竞态结果唯一。
export async function bindInvitationFromProfile(userId: string, code: string) {
  return prisma.$transaction(
    (tx) =>
      bindInvitationForUser(tx, {
        userId,
        code,
        source: INVITATION_BINDING_SOURCE.PROFILE,
        enforceProfileEligibility: true,
      }),
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}

// 已注册学生只保留一个稳定邀请码；唯一冲突时重新生成而不是暴露内部错误。
export async function getOrCreateInvitationCode(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })
  if (!user) throw new InvitationError('用户不存在', 'INVITATION_USER_NOT_FOUND', 404)
  if (user.role !== USER_ROLE.STUDENT) {
    throw new InvitationError('仅学生账号可以创建邀请码', 'INVITATION_STUDENT_ONLY', 403)
  }
  if (await countQualifiedRewards(prisma, userId) >= INVITATION_REWARD_LIFETIME_LIMIT) {
    throw new InvitationError(
      '已获得三张七天会员卡，邀请码已失效',
      'INVITATION_CODE_INACTIVE',
    )
  }
  const existing = await prisma.invitationCode.findUnique({ where: { userId } })
  if (existing) return existing

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.invitationCode.create({
        data: { userId, code: generateInvitationCodeValue() },
      })
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error
      }
      const created = await prisma.invitationCode.findUnique({ where: { userId } })
      if (created) return created
    }
  }
  throw new InvitationError('邀请码暂时无法创建，请稍后重试', 'INVITATION_CODE_CREATE_FAILED', 503)
}

// 注册页校验只返回是否可用，不暴露邀请人的账号信息。
export async function validateInvitationCode(code: string): Promise<boolean> {
  const value = normalizeInvitationCode(code)
  if (!/^[A-Z0-9]{6,16}$/.test(value)) return false
  const invitationCode = await prisma.invitationCode.findUnique({
    where: { code: value },
    select: { userId: true },
  })
  if (!invitationCode) return false
  return await countQualifiedRewards(prisma, invitationCode.userId)
    < INVITATION_REWARD_LIFETIME_LIMIT
}

// 用户标识仅展示最少必要字符，邀请人不能据此读取受邀人完整账号信息。
function maskUsername(username: string): string {
  const chars = [...username]
  if (chars.length <= 2) return `${chars[0] || ''}*`
  return `${chars[0]}${'*'.repeat(Math.min(4, chars.length - 2))}${chars.at(-1)}`
}

// 奖励只区分是否已由用户确认启用；具体权益起止时间单独展示，不再派生排队或结束状态。
function effectiveRewardStatus(
  reward: {
    status: string
    grantedAt: Date | null
    membership: { startsAt: Date; endsAt: Date; status: string } | null
  },
  now: Date,
): string {
  if (
    reward.status === INVITATION_REWARD_STATUS.PENDING_ACTIVATION
    && reward.grantedAt
    && addHours(reward.grantedAt, INVITATION_REWARD_ACTIVATION_WINDOW_HOURS) <= now
  ) {
    return INVITATION_REWARD_STATUS.EXPIRED
  }
  if (
    reward.status === INVITATION_REWARD_STATUS.REVOKED
    || reward.status === INVITATION_REWARD_STATUS.EXPIRED
    || reward.status === INVITATION_REWARD_STATUS.PENDING_ACTIVATION
  ) {
    return reward.status
  }
  if (!reward.membership) return reward.status
  if (reward.membership.status === MEMBERSHIP_STATUS.CANCELLED) {
    return INVITATION_REWARD_STATUS.REVOKED
  }
  return INVITATION_REWARD_STATUS.ACTIVATED
}

// 个人中心一次返回创建、补填、邀请进度和奖励卡所需的完整稳定上下文。
export async function getInvitationOverview(userId: string) {
  const now = new Date()
  await prisma.invitationReward.updateMany({
    where: {
      userId,
      status: INVITATION_REWARD_STATUS.PENDING_ACTIVATION,
      grantedAt: {
        lte: addHours(now, -INVITATION_REWARD_ACTIVATION_WINDOW_HOURS),
      },
    },
    data: { status: INVITATION_REWARD_STATUS.EXPIRED },
  })
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      createdAt: true,
      invitationCode: true,
      receivedInvitation: { include: { invitationCode: true } },
      invitationRewards: {
        include: { membership: true },
        orderBy: { createdAt: 'desc' },
      },
      sentInvitations: {
        include: {
          invitee: { select: { username: true } },
          rewards: { select: { beneficiaryRole: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!user) throw new InvitationError('用户不存在', 'INVITATION_USER_NOT_FOUND', 404)

  const paidOrder = await prisma.paymentOrder.findFirst({
    where: {
      userId,
      status: {
        in: [
          PAYMENT_ORDER_STATUS.PAID,
          PAYMENT_ORDER_STATUS.REFUNDING,
          PAYMENT_ORDER_STATUS.REFUNDED,
        ],
      },
    },
    select: { id: true },
  })
  const deadline = addHours(user.createdAt, INVITATION_BINDING_WINDOW_HOURS)
  let bindingReason: string | null = null
  let bindingMessage = '可在补填截止时间前绑定一次好友邀请码'
  if (user.receivedInvitation) {
    bindingReason = 'already_bound'
    bindingMessage = '已绑定好友邀请码，不能再次修改'
  } else if (paidOrder) {
    bindingReason = 'payment_exists'
    bindingMessage = '已完成会员支付，无法补填邀请码'
  } else if (now >= deadline) {
    bindingReason = 'expired'
    bindingMessage = '需注册后24小时内填写邀请码，当前补填期限已结束'
  }

  const rewardedCount = user.invitationRewards.filter((reward) =>
    (
      reward.status === INVITATION_REWARD_STATUS.PENDING_ACTIVATION
      && Boolean(reward.grantedAt)
    )
    || QUALIFIED_REWARD_STATUSES.includes(
      reward.status as (typeof QUALIFIED_REWARD_STATUSES)[number],
    ),
  ).length
  const codeActive = rewardedCount < INVITATION_REWARD_LIFETIME_LIMIT
  const invitations = user.sentInvitations.map((relation) => ({
    id: relation.id,
    invitee: maskUsername(relation.invitee.username),
    status: relation.status,
    boundAt: relation.boundAt.toISOString(),
    inviterRewardStatus:
      relation.rewards.find((reward) => reward.beneficiaryRole === INVITATION_REWARD_ROLE.INVITER)?.status
      || null,
  }))

  return {
    code: user.invitationCode?.code || null,
    codeActive,
    rewardLimit: INVITATION_REWARD_LIFETIME_LIMIT,
    rewardedCount,
    binding: {
      canBind: !bindingReason,
      reason: bindingReason,
      message: bindingMessage,
      deadline: deadline.toISOString(),
      boundCode: user.receivedInvitation?.invitationCode.code || null,
    },
    stats: {
      registered: user.sentInvitations.length,
      pendingPayment: user.sentInvitations.filter(
        (relation) => relation.status === INVITATION_RELATION_STATUS.PENDING_PAYMENT,
      ).length,
      rewarded: user.sentInvitations.filter(
        (relation) => relation.status === INVITATION_RELATION_STATUS.REWARDED,
      ).length,
    },
    invitations,
    rewards: user.invitationRewards.map((reward) => ({
      id: reward.id,
      beneficiaryRole: reward.beneficiaryRole,
      status: effectiveRewardStatus(reward, now),
      examType: reward.examType,
      durationHours: reward.durationHours,
      startsAt: reward.membership?.startsAt.toISOString() || null,
      endsAt: reward.membership?.endsAt.toISOString() || null,
      grantedAt: reward.grantedAt?.toISOString() || null,
      activationDeadline: reward.grantedAt
        ? addHours(reward.grantedAt, INVITATION_REWARD_ACTIVATION_WINDOW_HOURS).toISOString()
        : null,
      activatedAt: reward.activatedAt?.toISOString() || null,
      revokedAt: reward.revokedAt?.toISOString() || null,
    })),
  }
}

// 双方奖励在首笔有效支付后到账并等待手动启用，受邀人沿用购买考试类型。
export async function fulfillInvitationRewardsForPaidOrder(
  tx: Prisma.TransactionClient,
  order: { id: string; userId: string },
  examType: string,
  paidAt: Date,
): Promise<void> {
  const relation = await tx.invitationRelation.findUnique({
    where: { inviteeUserId: order.userId },
    include: { rewards: true },
  })
  if (
    !relation
    || relation.status !== INVITATION_RELATION_STATUS.PENDING_PAYMENT
    // 支付渠道时间精确到秒，绑定时间保留毫秒；同一秒内按已绑定处理。
    || relation.boundAt.getTime() > paidAt.getTime() + 999
  ) {
    return
  }

  const reserved = await tx.invitationRelation.updateMany({
    where: {
      id: relation.id,
      status: INVITATION_RELATION_STATUS.PENDING_PAYMENT,
      triggerPaymentOrderId: null,
    },
    data: {
      status: INVITATION_RELATION_STATUS.REWARDED,
      triggerPaymentOrderId: order.id,
      rewardedAt: paidAt,
    },
  })
  if (reserved.count !== 1) return

  const inviteeReward = relation.rewards.find(
    (reward) => reward.beneficiaryRole === INVITATION_REWARD_ROLE.INVITEE,
  )
  if (!inviteeReward) {
    throw new InvitationError('受邀人奖励资格不存在', 'INVITATION_REWARD_MISSING', 500)
  }

  const inviteeCount = await countQualifiedRewards(tx, relation.inviteeUserId)
  if (inviteeCount >= INVITATION_REWARD_LIFETIME_LIMIT) {
    await tx.invitationReward.delete({ where: { id: inviteeReward.id } })
  } else {
    await tx.invitationReward.update({
      where: { id: inviteeReward.id },
      data: {
        status: INVITATION_REWARD_STATUS.PENDING_ACTIVATION,
        examType,
        triggerPaymentOrderId: order.id,
        grantedAt: paidAt,
      },
    })
  }

  const inviterCount = await countQualifiedRewards(tx, relation.inviterUserId)
  if (inviterCount < INVITATION_REWARD_LIFETIME_LIMIT) {
    await tx.invitationReward.create({
      data: {
        invitationRelationId: relation.id,
        userId: relation.inviterUserId,
        beneficiaryRole: INVITATION_REWARD_ROLE.INVITER,
        status: INVITATION_REWARD_STATUS.PENDING_ACTIVATION,
        triggerPaymentOrderId: order.id,
        durationHours: INVITATION_REWARD_DURATION_HOURS,
        grantedAt: paidAt,
      },
    })
  }
}

// 双方在30天内确认启用后才创建周卡权益，同一奖励并发确认最多成功一次。
export async function activateInvitationReward(userId: string, rewardId: string, examType: string) {
  if (!isStudentExamTypeAvailable(examType)) {
    throw new InvitationError('请选择当前开放的考试类型', 'INVITATION_EXAM_NOT_AVAILABLE', 422)
  }
  return prisma.$transaction(
    async (tx) => {
      const reward = await tx.invitationReward.findFirst({
        where: { id: rewardId, userId },
      })
      if (!reward) throw new InvitationError('七天会员卡不存在', 'INVITATION_REWARD_NOT_FOUND', 404)
      if (
        reward.status !== INVITATION_REWARD_STATUS.PENDING_ACTIVATION
        || reward.membershipId
      ) {
        throw new InvitationError('该七天会员卡当前不可启用', 'INVITATION_REWARD_NOT_ACTIVATABLE')
      }

      const now = new Date()
      if (!reward.grantedAt) {
        throw new InvitationError(
          '完成首次有效会员支付后可启用该七天会员卡',
          'INVITATION_REWARD_PAYMENT_REQUIRED',
        )
      }
      if (addHours(reward.grantedAt, INVITATION_REWARD_ACTIVATION_WINDOW_HOURS) <= now) {
        throw new InvitationError('该七天会员卡已超过30天启用期限', 'INVITATION_REWARD_EXPIRED')
      }
      const selectedExamType = reward.beneficiaryRole === INVITATION_REWARD_ROLE.INVITEE
        ? reward.examType
        : examType
      if (!selectedExamType || !isStudentExamTypeAvailable(selectedExamType)) {
        throw new InvitationError('请选择当前开放的考试类型', 'INVITATION_EXAM_NOT_AVAILABLE', 422)
      }
      const startsAt = await resolveNextMembershipStart(tx, userId, selectedExamType, now)
      const membership = await tx.userMembership.create({
        data: {
          userId,
          examType: selectedExamType,
          plan: INVITATION_REWARD_PLAN,
          sourceType: MEMBERSHIP_SOURCE.INVITATION_REWARD,
          sourceId: reward.id,
          status: MEMBERSHIP_STATUS.ACTIVE,
          startsAt,
          endsAt: addHours(startsAt, reward.durationHours),
        },
      })
      const updated = await tx.invitationReward.updateMany({
        where: {
          id: reward.id,
          status: INVITATION_REWARD_STATUS.PENDING_ACTIVATION,
          membershipId: null,
        },
        data: {
          status: INVITATION_REWARD_STATUS.ACTIVATED,
          examType: selectedExamType,
          membershipId: membership.id,
          activatedAt: now,
        },
      })
      if (updated.count !== 1) {
        throw new InvitationError('会员卡状态已变化，请刷新后重试', 'INVITATION_REWARD_CHANGED')
      }
      return membership
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}

// 触发订单退款时精确撤回双方奖励，已撤回奖励仍保留终身计数和历史记录。
export async function revokeInvitationRewardsForPaymentOrder(
  tx: Prisma.TransactionClient,
  paymentOrderId: string,
  refundedAt: Date,
): Promise<void> {
  const rewards = await tx.invitationReward.findMany({
    where: {
      triggerPaymentOrderId: paymentOrderId,
      status: { not: INVITATION_REWARD_STATUS.REVOKED },
    },
    select: { id: true, membershipId: true },
  })
  for (const reward of rewards) {
    if (reward.membershipId) {
      const membership = await tx.userMembership.findUnique({ where: { id: reward.membershipId } })
      if (membership) {
        await tx.userMembership.update({
          where: { id: membership.id },
          data: {
            status: MEMBERSHIP_STATUS.CANCELLED,
            ...(membership.startsAt <= refundedAt && membership.endsAt > refundedAt
              ? { endsAt: refundedAt }
              : {}),
          },
        })
      }
    }
    await tx.invitationReward.update({
      where: { id: reward.id },
      data: { status: INVITATION_REWARD_STATUS.REVOKED, revokedAt: refundedAt },
    })
  }
  await tx.invitationRelation.updateMany({
    where: { triggerPaymentOrderId: paymentOrderId },
    data: { status: INVITATION_RELATION_STATUS.REFUNDED, refundedAt },
  })
}
