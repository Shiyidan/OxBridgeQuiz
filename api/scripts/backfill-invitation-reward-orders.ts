// 为规则调整前已启用的邀请周卡补建零元内部订单，统一订阅与订单统计口径。
import crypto from 'node:crypto'
import {
  CARD_REWARD_SOURCE,
  INVITATION_REWARD_PAYMENT_CHANNEL,
  INVITATION_REWARD_PLAN,
  INVITATION_REWARD_STATUS,
  PAYMENT_ORDER_STATUS,
  PAYMENT_PRICE_TYPE,
} from '../src/constants/domain.js'
import { prisma } from '../src/services/prisma.js'

const shouldApply = process.argv.includes('--apply')

// 历史回填订单使用邀请奖励前缀，并加入随机段避免批量处理时发生编号冲突。
function createInvitationRewardOrderNo(now: Date): string {
  const timestamp = now.toISOString().replace(/\D/g, '').slice(0, 17)
  return `IR${timestamp}${crypto.randomBytes(5).toString('hex').toUpperCase()}`
}

// 只处理已启用且会员记录尚未关联订单的邀请周卡，重复执行不会重复建单。
async function main(): Promise<void> {
  const rewards = await prisma.invitationReward.findMany({
    where: {
      sourceType: CARD_REWARD_SOURCE.INVITATION,
      status: INVITATION_REWARD_STATUS.ACTIVATED,
      membershipId: { not: null },
    },
    include: { membership: true },
    orderBy: { activatedAt: 'asc' },
  })
  const pending = rewards.filter((reward) => reward.membership && !reward.membership.paymentOrderId)

  console.log(`已启用邀请周卡 ${rewards.length} 张，待补内部订单 ${pending.length} 张。`)
  if (!shouldApply || pending.length === 0) {
    if (!shouldApply && pending.length > 0) console.log('当前为预览模式；使用 --apply 执行回填。')
    return
  }

  let createdCount = 0
  for (const reward of pending) {
    await prisma.$transaction(async (tx) => {
      const current = await tx.invitationReward.findUnique({
        where: { id: reward.id },
        include: { membership: true },
      })
      if (
        !current
        || current.sourceType !== CARD_REWARD_SOURCE.INVITATION
        || current.status !== INVITATION_REWARD_STATUS.ACTIVATED
        || !current.membership
        || current.membership.paymentOrderId
      ) {
        return
      }

      const paidAt = current.activatedAt || current.membership.createdAt
      const order = await tx.paymentOrder.create({
        data: {
          orderNo: createInvitationRewardOrderNo(paidAt),
          userId: current.userId,
          examTypes: [current.membership.examType],
          plan: INVITATION_REWARD_PLAN,
          priceType: PAYMENT_PRICE_TYPE.INVITATION_REWARD,
          amountCents: 0,
          currency: 'CNY',
          channel: INVITATION_REWARD_PAYMENT_CHANNEL,
          status: PAYMENT_ORDER_STATUS.PAID,
          provider: 'internal',
          providerPayload: {
            source: CARD_REWARD_SOURCE.INVITATION,
            rewardId: current.id,
            backfilled: true,
          },
          paidAt,
          expiresAt: paidAt,
          createdAt: paidAt,
          updatedAt: paidAt,
        },
      })
      const updated = await tx.userMembership.updateMany({
        where: { id: current.membership.id, paymentOrderId: null },
        data: { paymentOrderId: order.id },
      })
      if (updated.count !== 1) throw new Error(`会员记录 ${current.membership.id} 已被其他流程更新`)
      createdCount += 1
    })
  }

  console.log(`回填完成，共创建 ${createdCount} 笔邀请周卡零元内部订单。`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
