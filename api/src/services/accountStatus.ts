// 后台封禁与认证共用账号状态规则，封禁、撤销会话和审计在同一事务中提交。
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { ACCOUNT_STATUS, AUTH_ACCOUNT_BANNED_MESSAGE, AUTH_ERROR } from '../constants/auth.js'
import { USER_ROLE } from '../constants/domain.js'
import { OPERATION_AUDIT_MODULE, OPERATION_AUDIT_RESULT } from '../constants/operationAudit.js'
import { AuthError } from '../utils/authError.js'

// 封禁提示优先于会话已撤销提示，内部调查原因不返回给被封禁用户。
export function assertAccountActive(user: { accountStatus: string }): void {
  if (user.accountStatus === ACCOUNT_STATUS.BANNED) {
    throw new AuthError(AUTH_ERROR.ACCOUNT_BANNED, AUTH_ACCOUNT_BANNED_MESSAGE, 403)
  }
}

export interface AccountStatusChange {
  userIds: string[]
  status: (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS]
  reason: string
  operatorId: string
  requestId?: string
  ipAddress?: string
  userAgent?: string
}

// 以最终账号集合执行批量操作；任一目标不存在或涉及管理员时整批拒绝。
export async function changeAccountStatus(input: AccountStatusChange) {
  return prisma.$transaction(
    async (tx) => {
      const operator = await tx.user.findUnique({ where: { id: input.operatorId } })
      if (!operator || operator.role !== USER_ROLE.ADMIN) {
        throw new AuthError(AUTH_ERROR.FORBIDDEN, '仅管理员可以封禁或解封账号', 403)
      }
      assertAccountActive(operator)
      const users = await tx.user.findMany({
        where: { id: { in: input.userIds } },
        orderBy: { id: 'asc' },
      })
      if (users.length !== input.userIds.length)
        throw new AuthError('ADMIN_USER_NOT_FOUND', '部分用户不存在，请刷新后重试', 404)
      if (users.some((user) => user.id === operator.id || user.role === USER_ROLE.ADMIN)) {
        throw new AuthError(AUTH_ERROR.FORBIDDEN, '不能封禁或解封管理员账号', 403)
      }
      const changedUsers = users.filter((user) => user.accountStatus !== input.status)
      const now = new Date()
      const banning = input.status === ACCOUNT_STATUS.BANNED
      const changedIds = changedUsers.map((user) => user.id)
      await tx.user.updateMany({
        where: { id: { in: changedIds } },
        data: {
          accountStatus: input.status,
          bannedAt: banning ? now : null,
          banReason: banning ? input.reason : null,
        },
      })
      // 解封也不恢复旧会话；重复封禁可再次收敛全部设备的登录状态。
      const revoked = await tx.authSession.updateMany({
        where: { userId: { in: banning ? input.userIds : changedIds }, revokedAt: null },
        data: { revokedAt: now },
      })
      if (changedUsers.length) {
        await tx.operationLog.createMany({
          data: changedUsers.map((user) => ({
            occurredAt: now,
            requestId: input.requestId,
            actorUserId: operator.id,
            actorNameSnapshot: operator.username,
            actorEmailSnapshot: operator.email,
            actorRoleSnapshot: operator.role,
            module: OPERATION_AUDIT_MODULE.USER,
            action: banning ? 'admin.user.ban' : 'admin.user.unban',
            summary: `${banning ? '封禁' : '解封'}用户“${user.username}”`,
            result: OPERATION_AUDIT_RESULT.SUCCESS,
            resourceType: 'User',
            resourceId: user.id,
            changes: {
              accountStatus: { before: user.accountStatus, after: input.status },
              banReason: { before: user.banReason, after: banning ? input.reason : null },
              reason: { before: null, after: input.reason },
            },
            method: 'PUT',
            path: '/api/admin/users/account-status',
            statusCode: 200,
            ipAddress: input.ipAddress?.slice(0, 64),
            userAgent: input.userAgent?.slice(0, 512),
          })),
        })
      }
      return { changedCount: changedUsers.length, revokedSessionCount: revoked.count }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}
