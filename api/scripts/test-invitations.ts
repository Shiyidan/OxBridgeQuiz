// 邀请码服务级回归：验证限时绑定、首付双边待启用卡、30天失效、上限与退款撤回。
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {
  INVITATION_BINDING_SOURCE,
  INVITATION_RELATION_STATUS,
  INVITATION_REWARD_ROLE,
  INVITATION_REWARD_STATUS,
  MEMBERSHIP_PLAN,
  PAYMENT_ORDER_STATUS,
} from '../src/constants/domain.js'
import {
  InvitationError,
  activateInvitationReward,
  bindInvitationFromProfile,
  getInvitationOverview,
  getOrCreateInvitationCode,
  revokeInvitationRewardsForPaymentOrder,
  validateInvitationCode,
} from '../src/services/invitation.js'
import { fulfillPaidOrder } from '../src/services/paymentFulfillment.js'
import { prisma } from '../src/services/prisma.js'

const testPrefix = 'invitation-regression'
const createdUserIds: string[] = []

// 测试用户使用随机邮箱隔离并发运行，角色和创建时间按业务场景显式设置。
async function createUser(label: string, createdAt = new Date()) {
  const suffix = crypto.randomUUID().slice(0, 8)
  const user = await prisma.user.create({
    data: {
      username: `${testPrefix}-${label}-${suffix}`,
      email: `${testPrefix}-${label}-${suffix}@acemock.test`,
      password: 'not-used-by-service-test',
      emailVerifiedAt: new Date(),
      createdAt,
    },
  })
  createdUserIds.push(user.id)
  return user
}

// 支付订单使用真实履约入口需要的最小完整字段，不调用外部银联服务。
async function createPendingOrder(userId: string, examType: 'ESAT' | 'TMUA', amountCents = 100) {
  return prisma.paymentOrder.create({
    data: {
      orderNo: `IT${Date.now()}${crypto.randomInt(100000, 999999)}`,
      userId,
      examTypes: [examType],
      plan: MEMBERSHIP_PLAN.MONTHLY,
      priceType: 'first_monthly',
      amountCents,
      channel: 'alipay',
      status: PAYMENT_ORDER_STATUS.PENDING,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  })
}

// 模拟银联可信查询结果，覆盖生产履约使用的金额和交易状态校验。
async function confirmPaidOrder(order: { orderNo: string; amountCents: number }) {
  const now = new Date()
  const payTime = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(now)
  await fulfillPaidOrder(
    order.orderNo,
    {
      errCode: 'SUCCESS',
      billStatus: 'PAID',
      totalAmount: order.amountCents,
      billPayment: {
        status: 'TRADE_SUCCESS',
        totalAmount: order.amountCents,
        payTime,
        targetOrderId: `provider-${order.orderNo}`,
        targetSys: 'ALIPAY',
      },
    },
    'query',
  )
}

// 清理严格限定本测试创建的用户和关联订单，不触碰其他开发数据。
async function cleanup(): Promise<void> {
  if (!createdUserIds.length) return
  const orders = await prisma.paymentOrder.findMany({
    where: { userId: { in: createdUserIds } },
    select: { id: true },
  })
  const orderIds = orders.map((order) => order.id)
  await prisma.$transaction(async (tx) => {
    await tx.invitationReward.deleteMany({ where: { userId: { in: createdUserIds } } })
    await tx.invitationRelation.deleteMany({
      where: {
        OR: [
          { inviterUserId: { in: createdUserIds } },
          { inviteeUserId: { in: createdUserIds } },
        ],
      },
    })
    await tx.invitationCode.deleteMany({ where: { userId: { in: createdUserIds } } })
    await tx.userMembership.deleteMany({ where: { userId: { in: createdUserIds } } })
    if (orderIds.length) await tx.paymentOrder.deleteMany({ where: { id: { in: orderIds } } })
    await tx.user.deleteMany({ where: { id: { in: createdUserIds } } })
  })
}

// 完整主流程在一个用例中保持真实状态衔接，并验证关键不可逆边界。
async function main(): Promise<void> {
  const inviter = await createUser('inviter')
  const invitee = await createUser('invitee')
  const code = await getOrCreateInvitationCode(inviter.id)

  await bindInvitationFromProfile(invitee.id, code.code.toLowerCase())
  let overview = await getInvitationOverview(invitee.id)
  assert.equal(overview.binding.reason, 'already_bound')
  assert.equal(overview.binding.boundCode, code.code)
  assert.equal(overview.rewards[0]?.status, INVITATION_REWARD_STATUS.PENDING_ACTIVATION)
  assert.equal(overview.rewards[0]?.grantedAt, null)
  assert.equal(overview.rewardedCount, 0)
  await assert.rejects(
    () => activateInvitationReward(invitee.id, overview.rewards[0]!.id, 'TMUA'),
    (error: unknown) =>
      error instanceof InvitationError && error.code === 'INVITATION_REWARD_PAYMENT_REQUIRED',
  )
  await assert.rejects(
    () => bindInvitationFromProfile(invitee.id, code.code),
    (error: unknown) =>
      error instanceof InvitationError && error.code === 'INVITATION_ALREADY_BOUND',
  )

  const order = await createPendingOrder(invitee.id, 'TMUA')
  await confirmPaidOrder(order)
  const relation = await prisma.invitationRelation.findUniqueOrThrow({
    where: { inviteeUserId: invitee.id },
  })
  assert.equal(relation.status, INVITATION_RELATION_STATUS.REWARDED)

  const inviteeReward = await prisma.invitationReward.findFirstOrThrow({
    where: {
      invitationRelationId: relation.id,
      beneficiaryRole: INVITATION_REWARD_ROLE.INVITEE,
    },
    include: { membership: true },
  })
  assert.equal(inviteeReward.status, INVITATION_REWARD_STATUS.PENDING_ACTIVATION)
  assert.equal(inviteeReward.examType, 'TMUA')
  assert.equal(inviteeReward.membership, null)
  overview = await getInvitationOverview(invitee.id)
  assert.ok(overview.rewards[0]?.activationDeadline)

  const paidMembership = await prisma.userMembership.findFirstOrThrow({
    where: { paymentOrderId: order.id, examType: 'TMUA' },
  })
  const activatedInvitee = await activateInvitationReward(invitee.id, inviteeReward.id, 'TMUA')
  assert.equal(activatedInvitee.examType, 'TMUA')
  assert.equal(activatedInvitee.startsAt.getTime(), paidMembership.endsAt.getTime())
  assert.equal(
    activatedInvitee.endsAt.getTime() - activatedInvitee.startsAt.getTime(),
    168 * 60 * 60 * 1000,
  )
  overview = await getInvitationOverview(invitee.id)
  assert.equal(overview.rewards[0]?.status, INVITATION_REWARD_STATUS.ACTIVATED)
  assert.equal(overview.rewardedCount, 1)

  const inviterReward = await prisma.invitationReward.findFirstOrThrow({
    where: {
      invitationRelationId: relation.id,
      beneficiaryRole: INVITATION_REWARD_ROLE.INVITER,
    },
  })
  assert.equal(inviterReward.status, INVITATION_REWARD_STATUS.PENDING_ACTIVATION)
  const activated = await activateInvitationReward(inviter.id, inviterReward.id, 'ESAT')
  assert.equal(activated.examType, 'ESAT')
  assert.equal(activated.endsAt.getTime() - activated.startsAt.getTime(), 168 * 60 * 60 * 1000)

  const expiredRewardOwner = await createUser('expired-reward')
  const expiredRewardRelation = await prisma.invitationRelation.create({
    data: {
      inviterUserId: inviter.id,
      inviteeUserId: expiredRewardOwner.id,
      invitationCodeId: code.id,
      source: INVITATION_BINDING_SOURCE.PROFILE,
      status: INVITATION_RELATION_STATUS.REWARDED,
      rewardedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    },
  })
  const expiredReward = await prisma.invitationReward.create({
    data: {
      invitationRelationId: expiredRewardRelation.id,
      userId: expiredRewardOwner.id,
      beneficiaryRole: INVITATION_REWARD_ROLE.INVITEE,
      status: INVITATION_REWARD_STATUS.PENDING_ACTIVATION,
      examType: 'TMUA',
      grantedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    },
  })
  await assert.rejects(
    () => activateInvitationReward(expiredRewardOwner.id, expiredReward.id, 'TMUA'),
    (error: unknown) =>
      error instanceof InvitationError
      && error.code === 'INVITATION_REWARD_EXPIRED',
  )
  const expiredOverview = await getInvitationOverview(expiredRewardOwner.id)
  assert.equal(expiredOverview.rewards[0]?.status, INVITATION_REWARD_STATUS.EXPIRED)

  const expiredInvitee = await createUser(
    'expired',
    new Date(Date.now() - 25 * 60 * 60 * 1000),
  )
  await assert.rejects(
    () => bindInvitationFromProfile(expiredInvitee.id, code.code),
    (error: unknown) =>
      error instanceof InvitationError && error.code === 'INVITATION_BINDING_EXPIRED',
  )

  // 在邀请码仍有效时先建立一条待支付关系，用于覆盖达到三张后的迟到支付。
  const cappedInvitee = await createUser('capped-invitee')
  await bindInvitationFromProfile(cappedInvitee.id, code.code)

  for (let index = 0; index < 2; index += 1) {
    const fixtureInvitee = await createUser(`cap-${index}`)
    const fixtureRelation = await prisma.invitationRelation.create({
      data: {
        inviterUserId: inviter.id,
        inviteeUserId: fixtureInvitee.id,
        invitationCodeId: code.id,
        source: INVITATION_BINDING_SOURCE.PROFILE,
        status: INVITATION_RELATION_STATUS.REWARDED,
        rewardedAt: new Date(),
      },
    })
    await prisma.invitationReward.create({
      data: {
        invitationRelationId: fixtureRelation.id,
        userId: inviter.id,
        beneficiaryRole: INVITATION_REWARD_ROLE.INVITER,
        status:
          index === 0
            ? INVITATION_REWARD_STATUS.ACTIVATED
            : INVITATION_REWARD_STATUS.REVOKED,
        grantedAt: new Date(),
        revokedAt: index === 1 ? new Date() : null,
      },
    })
  }

  overview = await getInvitationOverview(inviter.id)
  assert.equal(overview.rewardedCount, 3)
  assert.equal(overview.codeActive, false)
  assert.equal(await validateInvitationCode(code.code), false)
  await assert.rejects(
    () => getOrCreateInvitationCode(inviter.id),
    (error: unknown) =>
      error instanceof InvitationError && error.code === 'INVITATION_CODE_INACTIVE',
  )
  const rejectedInvitee = await createUser('rejected-after-cap')
  await assert.rejects(
    () => bindInvitationFromProfile(rejectedInvitee.id, code.code),
    (error: unknown) =>
      error instanceof InvitationError && error.code === 'INVITATION_CODE_INVALID',
  )

  const cappedOrder = await createPendingOrder(cappedInvitee.id, 'ESAT')
  await confirmPaidOrder(cappedOrder)
  const cappedRelation = await prisma.invitationRelation.findUniqueOrThrow({
    where: { inviteeUserId: cappedInvitee.id },
  })
  const cappedInviterReward = await prisma.invitationReward.findFirst({
    where: {
      invitationRelationId: cappedRelation.id,
      beneficiaryRole: INVITATION_REWARD_ROLE.INVITER,
    },
  })
  assert.equal(cappedInviterReward, null)
  const cappedInviteeReward = await prisma.invitationReward.findFirstOrThrow({
    where: {
      invitationRelationId: cappedRelation.id,
      beneficiaryRole: INVITATION_REWARD_ROLE.INVITEE,
    },
  })
  assert.equal(cappedInviteeReward.status, INVITATION_REWARD_STATUS.PENDING_ACTIVATION)
  assert.equal(
    await prisma.invitationReward.count({ where: { status: 'limit_reached' } }),
    0,
  )

  await prisma.$transaction((tx) =>
    revokeInvitationRewardsForPaymentOrder(tx, order.id, new Date()),
  )
  const revokedRewards = await prisma.invitationReward.findMany({
    where: { triggerPaymentOrderId: order.id },
  })
  assert.ok(revokedRewards.length === 2)
  assert.ok(revokedRewards.every((reward) => reward.status === INVITATION_REWARD_STATUS.REVOKED))
  const revokedMemberships = await prisma.userMembership.findMany({
    where: { id: { in: revokedRewards.flatMap((reward) => reward.membershipId || []) } },
  })
  assert.ok(revokedMemberships.every((membership) => membership.status === 'cancelled'))

  overview = await getInvitationOverview(inviter.id)
  assert.equal(overview.rewardedCount, 3)
  console.log('Invitation binding, activation, expiry, code invalidation, and refund regression passed')
}

main()
  .finally(cleanup)
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
