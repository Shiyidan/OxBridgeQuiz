// 员工管理统计：基于成功赠卡审计记录，按接收用户汇总管理员的日卡发放情况。
import { USER_ROLE } from '../constants/domain.js'
import { OPERATION_AUDIT_RESULT } from '../constants/operationAudit.js'
import { parseJsonObject } from '../utils/jsonField.js'
import { prisma } from './prisma.js'

const GIFT_CARD_ACTION = 'admin.user.gift_cards.create'

interface AdminStaffStatsOptions {
  page: number
  pageSize: number
  keyword?: string
}

interface RecipientGiftCardAggregate {
  userId: string
  snapshotName: string | null
  grantCount: number
  cardCount: number
  staffIds: Set<string>
  latestGrantedAt: Date | null
}

// 新版日志从白名单变更值读取赠送数量，历史日志缺少该字段时从审计摘要兜底恢复。
function giftCardQuantity(changes: unknown, summary: string): number {
  const changeMap = parseJsonObject(changes)
  const quantityChange = parseJsonObject(changeMap.pendingDailyCardsAdded)
  const quantity = Number(quantityChange.after)
  if (Number.isInteger(quantity) && quantity > 0) return quantity

  const summaryMatch = summary.match(/赠送\s*(\d+)\s*张日卡/)
  const summaryQuantity = Number(summaryMatch?.[1])
  return Number.isInteger(summaryQuantity) && summaryQuantity > 0 ? summaryQuantity : 0
}

// 用户被删除或改名后，审计摘要中的发放时用户名仍可作为历史记录兜底展示。
function recipientNameFromSummary(summary: string): string | null {
  return summary.match(/向用户[“"](.+?)[”"]赠送/)?.[1]?.trim() || null
}

// 接收用户按获赠日卡量和最近获赠时间排序，优先展示主要发放对象。
function compareRecipientRows(
  left: { cardCount: number; latestGrantedAt: string | null; username: string },
  right: { cardCount: number; latestGrantedAt: string | null; username: string },
): number {
  if (right.cardCount !== left.cardCount) return right.cardCount - left.cardCount
  const latestDifference = (Date.parse(right.latestGrantedAt || '') || 0)
    - (Date.parse(left.latestGrantedAt || '') || 0)
  if (latestDifference !== 0) return latestDifference
  return left.username.localeCompare(right.username, 'zh-CN')
}

// 统计范围固定为当前管理员和成功赠卡记录，主表按接收用户而非管理员聚合。
export async function getAdminStaffGiftCardStats(options: AdminStaffStatsOptions) {
  const admins = await prisma.user.findMany({
    where: { role: USER_ROLE.ADMIN },
    select: { id: true, username: true, email: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  })
  const adminIds = admins.map((admin) => admin.id)
  const adminMap = new Map(admins.map((admin) => [admin.id, admin]))
  const logs = adminIds.length
    ? await prisma.operationLog.findMany({
        where: {
          actorUserId: { in: adminIds },
          action: GIFT_CARD_ACTION,
          result: OPERATION_AUDIT_RESULT.SUCCESS,
        },
        select: {
          id: true,
          actorUserId: true,
          resourceId: true,
          occurredAt: true,
          changes: true,
          summary: true,
        },
        orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      })
    : []

  const aggregates = new Map<string, RecipientGiftCardAggregate>()
  let totalCardCount = 0
  for (const log of logs) {
    const quantity = giftCardQuantity(log.changes, log.summary)
    totalCardCount += quantity
    if (!log.actorUserId || !log.resourceId) continue
    const aggregate = aggregates.get(log.resourceId) || {
      userId: log.resourceId,
      snapshotName: recipientNameFromSummary(log.summary),
      grantCount: 0,
      cardCount: 0,
      staffIds: new Set<string>(),
      latestGrantedAt: null,
    }
    aggregate.grantCount += 1
    aggregate.cardCount += quantity
    aggregate.staffIds.add(log.actorUserId)
    aggregate.latestGrantedAt ||= log.occurredAt
    aggregates.set(log.resourceId, aggregate)
  }

  const recipientIds = [...aggregates.keys()]
  const recipients = recipientIds.length
    ? await prisma.user.findMany({
        where: { id: { in: recipientIds } },
        select: { id: true, username: true, email: true },
      })
    : []
  const recipientMap = new Map(recipients.map((recipient) => [recipient.id, recipient]))
  const normalizedKeyword = options.keyword?.trim().toLocaleLowerCase('zh-CN') || ''
  const rows = [...aggregates.values()]
    .map((aggregate) => {
      const recipient = recipientMap.get(aggregate.userId)
      return {
        userId: aggregate.userId,
        username: recipient?.username || aggregate.snapshotName || '未知用户',
        email: recipient?.email || null,
        grantCount: aggregate.grantCount,
        cardCount: aggregate.cardCount,
        staffCount: aggregate.staffIds.size,
        staffNames: [...aggregate.staffIds]
          .map((staffId) => adminMap.get(staffId)?.username)
          .filter((username): username is string => Boolean(username)),
        latestGrantedAt: aggregate.latestGrantedAt?.toISOString() || null,
      }
    })
    .filter((row) => !normalizedKeyword
      || row.username.toLocaleLowerCase('zh-CN').includes(normalizedKeyword)
      || row.email?.toLocaleLowerCase('zh-CN').includes(normalizedKeyword))
    .sort(compareRecipientRows)

  const total = rows.length
  const totalPages = Math.ceil(total / options.pageSize)
  const safePage = totalPages > 0 ? Math.min(options.page, totalPages) : 1
  const pageStart = (safePage - 1) * options.pageSize

  return {
    overview: {
      staffCount: admins.length,
      grantCount: logs.length,
      cardCount: totalCardCount,
      recipientCount: aggregates.size,
    },
    list: rows.slice(pageStart, pageStart + options.pageSize),
    pagination: {
      page: safePage,
      pageSize: options.pageSize,
      total,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: totalPages > 0 && safePage < totalPages,
    },
  }
}
