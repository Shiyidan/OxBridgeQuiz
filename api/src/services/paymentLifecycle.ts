// 支付生命周期后台任务：补偿支付与退款结果、关闭超时二维码并回收过期会员状态。
import crypto from 'crypto'
import os from 'os'
import { Prisma } from '@prisma/client'
import { config } from '../config.js'
import {
  MEMBERSHIP_STATUS,
  PAYMENT_ORDER_STATUS,
  PAYMENT_REFUND_STATUS,
  USER_PAYMENT_STATUS,
} from '../constants/domain.js'
import { closePaymentOrder, syncPaymentOrderFromChinaums } from './paymentOrder.js'
import { runScheduledPaymentReconciliation } from './paymentReconciliation.js'
import { refreshPaymentRefund } from './paymentRefund.js'
import { prisma } from './prisma.js'

const LEASE_NAME = 'payment-lifecycle'
const WORKER_OWNER_ID = `${os.hostname()}:${process.pid}:${crypto.randomUUID()}`

let workerTimer: NodeJS.Timeout | null = null
let workerRunning = false

export type PaymentLifecycleStats = {
  leaseAcquired: boolean
  paymentQueries: number
  paymentQueryErrors: number
  expiredOrdersChecked: number
  closedOrders: number
  closeErrors: number
  refundsChecked: number
  refundsCompleted: number
  refundErrors: number
  membershipsExpired: number
  usersExpired: number
}

// 每轮使用独立计数，便于日志和部署验证确认任务实际处理结果。
function createStats(): PaymentLifecycleStats {
  return {
    leaseAcquired: false,
    paymentQueries: 0,
    paymentQueryErrors: 0,
    expiredOrdersChecked: 0,
    closedOrders: 0,
    closeErrors: 0,
    refundsChecked: 0,
    refundsCompleted: 0,
    refundErrors: 0,
    membershipsExpired: 0,
    usersExpired: 0,
  }
}

// 数据库租约保证多个 API 实例不会在同一时间重复执行整轮渠道任务。
async function acquireLease(now: Date): Promise<boolean> {
  const lockedUntil = new Date(now.getTime() + config.paymentLifecycle.leaseMs)
  try {
    await prisma.backgroundJobLease.create({
      data: { name: LEASE_NAME, ownerId: WORKER_OWNER_ID, lockedUntil },
    })
    return true
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error
  }

  const claimed = await prisma.backgroundJobLease.updateMany({
    where: { name: LEASE_NAME, lockedUntil: { lte: now } },
    data: { ownerId: WORKER_OWNER_ID, lockedUntil },
  })
  return claimed.count === 1
}

// 正常完成后提前释放租约；进程异常退出时由 lockedUntil 自动恢复。
async function releaseLease(): Promise<void> {
  await prisma.backgroundJobLease.updateMany({
    where: { name: LEASE_NAME, ownerId: WORKER_OWNER_ID },
    data: {
      ownerId: `${WORKER_OWNER_ID}:released`.slice(0, 128),
      lockedUntil: new Date(),
    },
  })
}

// 长轮次执行期间周期性续租，避免渠道超时累计导致另一个实例提前接管。
function startLeaseHeartbeat(): NodeJS.Timeout {
  const intervalMs = Math.max(10_000, Math.floor(config.paymentLifecycle.leaseMs / 3))
  const timer = setInterval(() => {
    const lockedUntil = new Date(Date.now() + config.paymentLifecycle.leaseMs)
    void prisma.backgroundJobLease.updateMany({
      where: { name: LEASE_NAME, ownerId: WORKER_OWNER_ID },
      data: { lockedUntil },
    }).then((result) => {
      if (result.count !== 1) console.error('[payment-lifecycle] database lease was lost')
    }).catch((error) => console.error('[payment-lifecycle] lease heartbeat failed:', error))
  }, intervalMs)
  timer.unref()
  return timer
}

// 未过期待支付订单定期主动查询，弥补前端关闭或异步通知丢失的情况。
async function reconcilePendingPayments(now: Date, stats: PaymentLifecycleStats): Promise<void> {
  if (!config.chinaums.enabled) return
  const eligibleBefore = new Date(
    now.getTime() - config.paymentLifecycle.pendingQueryAgeSeconds * 1000,
  )
  const orders = await prisma.paymentOrder.findMany({
    where: {
      status: PAYMENT_ORDER_STATUS.PENDING,
      expiresAt: { gt: now },
      createdAt: { lte: eligibleBefore },
      updatedAt: { lte: eligibleBefore },
    },
    orderBy: { updatedAt: 'asc' },
    take: config.paymentLifecycle.batchSize,
  })

  for (const order of orders) {
    stats.paymentQueries += 1
    try {
      await syncPaymentOrderFromChinaums(order)
    } catch (error) {
      stats.paymentQueryErrors += 1
      console.error(`[payment-lifecycle] payment query failed order=${order.orderNo}:`, error)
    }
  }
}

// 超时订单先查询银联状态再关码，支付与关单并发时支付成功优先。
async function closeExpiredOrders(now: Date, stats: PaymentLifecycleStats): Promise<void> {
  if (!config.chinaums.enabled) return
  const orders = await prisma.paymentOrder.findMany({
    where: {
      status: PAYMENT_ORDER_STATUS.PENDING,
      expiresAt: { lte: now },
    },
    orderBy: { expiresAt: 'asc' },
    take: config.paymentLifecycle.batchSize,
  })

  for (const order of orders) {
    stats.expiredOrdersChecked += 1
    try {
      const updated = await closePaymentOrder(order, 'lifecycle')
      if (updated?.status === PAYMENT_ORDER_STATUS.CLOSED) stats.closedOrders += 1
    } catch (error) {
      stats.closeErrors += 1
      console.error(`[payment-lifecycle] close expired order failed order=${order.orderNo}:`, error)
    }
  }
}

// 长时间处于退款中的记录由主动查询收敛到成功或继续等待最终结果。
async function reconcileProcessingRefunds(now: Date, stats: PaymentLifecycleStats): Promise<void> {
  if (!config.chinaums.enabled) return
  const eligibleBefore = new Date(
    now.getTime() - config.paymentLifecycle.refundQueryAgeSeconds * 1000,
  )
  const refunds = await prisma.paymentRefund.findMany({
    where: {
      status: PAYMENT_REFUND_STATUS.PROCESSING,
      updatedAt: { lte: eligibleBefore },
    },
    orderBy: { updatedAt: 'asc' },
    take: config.paymentLifecycle.batchSize,
  })

  for (const refund of refunds) {
    stats.refundsChecked += 1
    try {
      const updated = await refreshPaymentRefund(refund.refundOrderNo)
      if (updated.status === PAYMENT_REFUND_STATUS.SUCCEEDED) stats.refundsCompleted += 1
    } catch (error) {
      stats.refundErrors += 1
      console.error(`[payment-lifecycle] refund query failed refund=${refund.refundOrderNo}:`, error)
    }
  }
}

// 到期权益批量转为 expired，仅在用户没有其他有效会员时回写旧版付款状态。
async function expireMemberships(now: Date, stats: PaymentLifecycleStats): Promise<void> {
  const candidates = await prisma.userMembership.findMany({
    where: { status: MEMBERSHIP_STATUS.ACTIVE, endsAt: { lte: now } },
    select: { userId: true },
    distinct: ['userId'],
    orderBy: { userId: 'asc' },
    take: config.paymentLifecycle.batchSize,
  })
  const userIds = candidates.map((candidate) => candidate.userId)
  if (userIds.length === 0) return

  const result = await prisma.$transaction(async (tx) => {
    const expiredMemberships = await tx.userMembership.updateMany({
      where: {
        userId: { in: userIds },
        status: MEMBERSHIP_STATUS.ACTIVE,
        endsAt: { lte: now },
      },
      data: { status: MEMBERSHIP_STATUS.EXPIRED },
    })
    const expiredUsers = await tx.user.updateMany({
      where: {
        id: { in: userIds },
        paymentStatus: USER_PAYMENT_STATUS.PAID,
        memberships: {
          none: { status: MEMBERSHIP_STATUS.ACTIVE, endsAt: { gt: now } },
        },
      },
      data: { paymentStatus: USER_PAYMENT_STATUS.EXPIRED },
    })
    return { expiredMemberships: expiredMemberships.count, expiredUsers: expiredUsers.count }
  })
  stats.membershipsExpired += result.expiredMemberships
  stats.usersExpired += result.expiredUsers
}

// 单轮任务按查询、关单、退款和权益顺序执行，并通过数据库租约跨进程互斥。
export async function runPaymentLifecycleCycle(now = new Date()): Promise<PaymentLifecycleStats> {
  const stats = createStats()
  if (workerRunning) return stats
  workerRunning = true
  let leaseHeartbeat: NodeJS.Timeout | null = null
  try {
    stats.leaseAcquired = await acquireLease(now)
    if (!stats.leaseAcquired) return stats
    leaseHeartbeat = startLeaseHeartbeat()
    await expireMemberships(now, stats)
    await reconcilePendingPayments(now, stats)
    await closeExpiredOrders(now, stats)
    await reconcileProcessingRefunds(now, stats)
    await runScheduledPaymentReconciliation(now).catch((error) => {
      console.error('[payment-reconciliation] scheduled run failed:', error)
    })
    return stats
  } finally {
    if (leaseHeartbeat) clearInterval(leaseHeartbeat)
    if (stats.leaseAcquired) {
      await releaseLease().catch((error) => console.error('[payment-lifecycle] lease release failed:', error))
    }
    workerRunning = false
  }
}

// 仅在发生实际扫描或错误时输出摘要，避免空轮询污染运行日志。
function logCycle(stats: PaymentLifecycleStats): void {
  const activity = stats.paymentQueries
    + stats.expiredOrdersChecked
    + stats.refundsChecked
    + stats.membershipsExpired
  const errors = stats.paymentQueryErrors + stats.closeErrors + stats.refundErrors
  if (activity === 0 && errors === 0) return
  console.log('[payment-lifecycle] cycle completed', stats)
}

// API 启动后立即执行一轮，随后按配置周期轮询并允许空闲计时器自然退出。
export async function startPaymentLifecycleWorker(): Promise<void> {
  if (!config.paymentLifecycle.enabled) {
    console.log('[payment-lifecycle] worker disabled')
    return
  }
  if (workerTimer) return

  // 首轮与后续轮询复用同一错误边界和活动摘要。
  const run = async () => {
    const stats = await runPaymentLifecycleCycle()
    logCycle(stats)
  }
  await run()
  workerTimer = setInterval(() => {
    void run().catch((error) => console.error('[payment-lifecycle] polling failed:', error))
  }, config.paymentLifecycle.pollIntervalMs)
  workerTimer.unref()
  console.log(`[payment-lifecycle] worker started intervalMs=${config.paymentLifecycle.pollIntervalMs}`)
}
