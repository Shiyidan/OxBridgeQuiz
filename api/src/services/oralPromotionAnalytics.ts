// 口语推广统计：复用持久化操作记录，以实际学生账号聚合打开介绍次数。
import { Prisma } from '@prisma/client'
import type { Request } from 'express'
import { prisma } from './prisma.js'
import { analyticsStudentWhere } from './analyticsScope.js'
import { USER_ROLE } from '../constants/domain.js'
import { OPERATION_AUDIT_MODULE, OPERATION_AUDIT_RESULT } from '../constants/operationAudit.js'
import { ORAL_PROMOTION_OPEN_ACTION } from '../constants/oralPromotion.js'
import { getCurrentRequestId } from '../utils/requestContext.js'

export interface OralPromotionAnalyticsFilters {
  startAt: Date
  endAt: Date
  page: number
  pageSize: number
}

// 身份只来自服务端认证；访客、管理员和旧版非打开事件均不写入统计。
export async function recordOralPromotionOpen(req: Request, source: string): Promise<boolean> {
  if (req.user?.role !== USER_ROLE.STUDENT) return false
  await prisma.operationLog.create({
    data: {
      actorUserId: req.user.userId,
      actorNameSnapshot: req.user.username,
      actorEmailSnapshot: req.user.email,
      actorRoleSnapshot: req.user.role,
      requestId: getCurrentRequestId(),
      module: OPERATION_AUDIT_MODULE.PROMOTION,
      action: ORAL_PROMOTION_OPEN_ACTION,
      summary: source === 'navigation' ? '从导航打开英语口语介绍' : '从悬挂入口打开英语口语介绍',
      result: OPERATION_AUDIT_RESULT.SUCCESS,
      method: 'POST',
      path: '/api/traffic/promotion-events',
      statusCode: 200,
    },
  })
  return true
}

// 两项总览与用户排行在同一数据库快照内计算，封禁状态和日期口径始终一致。
export async function getOralPromotionAnalytics(filters: OralPromotionAnalyticsFilters) {
  const eventWhere: Prisma.OperationLogWhereInput = {
    action: ORAL_PROMOTION_OPEN_ACTION,
    module: OPERATION_AUDIT_MODULE.PROMOTION,
    result: OPERATION_AUDIT_RESULT.SUCCESS,
    actorRoleSnapshot: USER_ROLE.STUDENT,
    occurredAt: { gte: filters.startAt, lt: filters.endAt },
  }
  const where: Prisma.OperationLogWhereInput = {
    ...eventWhere,
    actor: { is: analyticsStudentWhere },
  }
  return prisma.$transaction(async (tx) => {
    const clickCount = await tx.operationLog.count({ where })
    const userCount = await tx.user.count({
      where: { ...analyticsStudentWhere, operationLogs: { some: eventWhere } },
    })
    const totalPages = Math.ceil(userCount / filters.pageSize)
    const page = Math.min(filters.page, Math.max(totalPages, 1))
    const groups = await tx.operationLog.groupBy({
      by: ['actorUserId'],
      where,
      _count: { actorUserId: true },
      orderBy: [{ _count: { actorUserId: 'desc' } }, { actorUserId: 'asc' }],
      skip: (page - 1) * filters.pageSize,
      take: filters.pageSize,
    })
    const users = await tx.user.findMany({
      where: { id: { in: groups.flatMap((group) => group.actorUserId ? [group.actorUserId] : []) } },
      select: { id: true, username: true, email: true },
    })
    const userMap = new Map(users.map((user) => [user.id, user]))
    return {
      period: { startAt: filters.startAt.toISOString(), endAt: filters.endAt.toISOString() },
      overview: { clickCount, userCount },
      list: groups.map((group) => {
        const user = userMap.get(group.actorUserId!)!
        return { userId: user.id, username: user.username, email: user.email, clickCount: group._count.actorUserId }
      }),
      pagination: {
        page, pageSize: filters.pageSize, total: userCount, totalPages,
        hasPrev: page > 1, hasNext: page < totalPages,
      },
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead })
}
