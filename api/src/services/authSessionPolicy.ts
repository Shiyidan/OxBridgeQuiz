// 登录网络限制：同一账号保留两个有效 IP，新网络登录时撤销最早网络的全部会话。
import type { Prisma } from '@prisma/client'
import { config } from '../config.js'
import { AUTH_MAX_ACTIVE_IPS, AUTH_ERROR, AUTH_IP_LIMIT_MESSAGE, AUTH_SESSION_EXPIRED_MESSAGE, AUTH_SESSION_REVOKE_REASON } from '../constants/auth.js'
import { AuthError } from '../utils/authError.js'
import { normalizeIpAddress } from '../utils/ipAddress.js'
import { assertAccountActive } from './accountStatus.js'
import { prisma } from './prisma.js'
import { withUserTransaction } from './transactionRetry.js'

// 登录、续期和网络变更共用用户行锁，避免多个请求同时读取旧 IP 数量后突破上限。
export async function lockAuthSessionUser(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  const user = await tx.user.update({
    where: { id: userId }, data: { updatedAt: new Date() }, select: { accountStatus: true },
  })
  assertAccountActive(user)
}

// 已退出、到期或超过空闲窗口的会话不占网络名额。
function activeSessionWhere(userId: string, now: Date): Prisma.AuthSessionWhereInput {
  return {
    userId, revokedAt: null, expiresAt: { gt: now },
    lastUsedAt: { gt: new Date(now.getTime() - config.refreshTokenTtlSeconds * 1000) },
  }
}

// 按每个 IP 最早的有效登录排列；同 IP 新增设备不改变它原来的先后顺序。
export async function trimAuthSessionIps(
  tx: Prisma.TransactionClient,
  userId: string,
  now: Date,
  preferredIp?: string,
): Promise<string[]> {
  const sessions = await tx.authSession.findMany({
    where: activeSessionWhere(userId, now),
    select: { id: true, ipAddress: true },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  })
  const ips = [...new Set(sessions.map(session => normalizeIpAddress(session.ipAddress)))]
  const excess = ips.length - AUTH_MAX_ACTIVE_IPS
  if (excess <= 0) return []
  // 新网络进入时优先保留；旧版已有超额会话时按原登录顺序收敛。
  const removedIps = new Set(ips.filter(ip => ip !== preferredIp).slice(0, excess))
  const removedIds = sessions.filter(session => removedIps.has(normalizeIpAddress(session.ipAddress)))
    .map(session => session.id)
  await tx.authSession.updateMany({
    where: { userId, id: { in: removedIds }, revokedAt: null },
    data: { revokedAt: now, revokedReason: AUTH_SESSION_REVOKE_REASON.IP_LIMIT },
  })
  return removedIds
}

// 失败后读取已提交的撤销原因，覆盖并发登录或本次请求刚触发淘汰的情况。
export async function authSessionExpiredError(sessionId: string): Promise<AuthError> {
  const session = await prisma.authSession.findUnique({
    where: { id: sessionId }, select: { revokedAt: true, revokedReason: true },
  })
  return session?.revokedAt && session.revokedReason === AUTH_SESSION_REVOKE_REASON.IP_LIMIT
    ? new AuthError(AUTH_ERROR.IP_LIMIT, AUTH_IP_LIMIT_MESSAGE, 401)
    : new AuthError(AUTH_ERROR.SESSION_EXPIRED, AUTH_SESSION_EXPIRED_MESSAGE, 401)
}

// 普通请求同样检查来源；稳定网络只读，切换网络或旧会话超额时才进入加锁事务。
export async function checkAuthSessionIp(userId: string, sessionId: string, rawIp: string | undefined): Promise<boolean> {
  const ip = normalizeIpAddress(rawIp)
  if (!ip) return false
  const now = new Date()
  const sessions = await prisma.authSession.findMany({
    where: activeSessionWhere(userId, now),
    select: { id: true, ipAddress: true },
  })
  const current = sessions.find(session => session.id === sessionId)
  if (!current) return false
  const ips = new Set(sessions.map(session => normalizeIpAddress(session.ipAddress)))
  if (normalizeIpAddress(current.ipAddress) === ip && ips.size <= AUTH_MAX_ACTIVE_IPS) return true

  return withUserTransaction(async tx => {
    await lockAuthSessionUser(tx, userId)
    // 取得锁后重新检查，已经被其他登录撤销的旧请求不得恢复自己的会话。
    const live = await tx.authSession.findFirst({
      where: { ...activeSessionWhere(userId, new Date()), id: sessionId },
      select: { ipAddress: true },
    })
    if (!live) return false
    const moved = normalizeIpAddress(live.ipAddress) !== ip
    if (moved) await tx.authSession.update({ where: { id: sessionId }, data: { ipAddress: ip } })
    const removedIds = await trimAuthSessionIps(tx, userId, new Date(), moved ? ip : undefined)
    return !removedIds.includes(sessionId)
  })
}
