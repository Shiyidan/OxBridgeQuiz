// 注册属地：使用注册时留存的 IP 补全用户资料，并按到期时间逐个更新。
import { randomUUID } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { config } from '../config.js'
import { LEGAL_ACCEPTANCE_SOURCE, LEGAL_DOCUMENT_TYPE } from '../constants/legal.js'
import { prisma } from './prisma.js'
import { canLookupIpLocation, isPublicIpAddress, resolveIpLocation } from './ipGeolocation.js'

const DAY_MS = 86400000
const LEASE_NAME = 'registration-location'
const OWNER_ID = `${process.pid}:${randomUUID()}`
let workerTimer: NodeJS.Timeout | undefined
let workerRunning = false

// 两处地区图表采用同一展示口径，不向前端返回原始注册 IP。
export function registrationLocationLabel(user: {
  registrationCountry?: string | null
  registrationRegion?: string | null
}): string {
  return [...new Set([user.registrationCountry?.trim(), user.registrationRegion?.trim()]
    .filter(Boolean))].join(' · ') || '暂无属地'
}

// 数据库租约限制多实例合计每五秒处理一人；异常退出后自动释放。
async function acquireLease(now: Date): Promise<boolean> {
  const lockedUntil = new Date(now.getTime() + 30000)
  try {
    await prisma.backgroundJobLease.create({
      data: { name: LEASE_NAME, ownerId: OWNER_ID, lockedUntil },
    })
    return true
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error
  }
  const result = await prisma.backgroundJobLease.updateMany({
    where: { name: LEASE_NAME, lockedUntil: { lte: now } },
    data: { ownerId: OWNER_ID, lockedUntil },
  })
  return result.count === 1
}

// 每轮只处理一名到期用户，旧用户自动回填；请求失败只推迟重试，不覆盖已有属地。
export async function refreshNextRegistrationLocation(now = new Date()): Promise<void> {
  if (workerRunning || !canLookupIpLocation()) return
  workerRunning = true
  let acquired = false
  try {
    acquired = await acquireLease(now)
    if (!acquired) return
    const user = await prisma.user.findFirst({
      where: { OR: [
        { registrationLocationNextCheckAt: null },
        { registrationLocationNextCheckAt: { lte: now } },
      ] },
      orderBy: [{ registrationLocationNextCheckAt: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
      select: {
        id: true,
        legalAcceptances: {
          where: {
            source: LEGAL_ACCEPTANCE_SOURCE.REGISTER,
            documentType: LEGAL_DOCUMENT_TYPE.USER_AGREEMENT,
          },
          select: { ipAddress: true },
          orderBy: [{ acceptedAt: 'asc' }, { id: 'asc' }],
          take: 1,
        },
      },
    })
    if (!user) return
    const ip = user.legalAcceptances[0]?.ipAddress
    const location = await resolveIpLocation(ip)
    const country = location?.country.trim() || null
    const region = location?.region.trim() || null
    const resolved = !!(country || region)
    // 缺失或内网 IP 不发送外部请求；公网查询失败一小时后重试。
    const retryMs = resolved || !isPublicIpAddress(ip) ? 30 * DAY_MS : 3600000
    await prisma.user.updateMany({
      where: { id: user.id },
      data: {
        registrationLocationNextCheckAt: new Date(now.getTime() + retryMs),
        ...(resolved ? {
          registrationCountry: country,
          registrationRegion: region,
          registrationLocationUpdatedAt: now,
        } : {}),
      },
    })
  } finally {
    try {
      if (acquired) await prisma.backgroundJobLease.updateMany({
        where: { name: LEASE_NAME, ownerId: OWNER_ID },
        data: { lockedUntil: new Date(Date.now() + 5000) },
      })
    } finally {
      workerRunning = false
    }
  }
}

// 注册事务只保存资料，属地补全与定期更新在后台执行，不阻塞注册或统计页面。
export async function startRegistrationLocationWorker(): Promise<void> {
  if (!config.registrationLocation.enabled || workerTimer) return
  // 单次错误留待下一轮恢复，避免临时数据库故障停止整个定时任务。
  const run = async () => {
    try {
      await refreshNextRegistrationLocation()
    } catch (error) {
      console.error('[registration-location] refresh failed:', error)
    }
  }
  workerTimer = setInterval(() => void run(), 5000)
  workerTimer.unref()
  await run()
}
