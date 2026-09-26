// 注册来源保护：签名浏览器 Cookie、数据库滑动窗口及与账号创建原子提交的成功额度。
import crypto from 'node:crypto'
import { isIP } from 'node:net'
import { setTimeout } from 'node:timers/promises'
import type { Request, Response } from 'express'
import { ipKeyGenerator } from 'express-rate-limit'
import { Prisma } from '@prisma/client'
import { config } from '../config.js'
import { AUTH_ERROR } from '../constants/auth.js'
import { AuthError } from '../utils/authError.js'
import { normalizeIpAddress } from '../utils/ipAddress.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
import { prisma } from './prisma.js'

export const REGISTRATION_BROWSER_COOKIE = 'quiz_registration_browser'
const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE
const CHINA_OFFSET = 8 * 60 * MINUTE
let lastCleanupAt = 0

export type RegistrationSource = { ip: string; browser: string }
type Bucket = {
  key: string
  limit: number
  since: number
  expiresAt: number
  windowMs?: number
  code: string
  message: string
}

export class RegistrationLimitError extends AuthError {
  // 统一提供重试时间，页面不需要猜测网络、浏览器或每日窗口的长度。
  constructor(
    code: string,
    message: string,
    public readonly retryAt: number,
  ) {
    super(
      code,
      `${message}请于 ${new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(retryAt)}（北京时间）后重试。`,
      429,
    )
  }
}

// 来源摘要和 Cookie 签名使用不同用途前缀，不存储可还原的 IP 或浏览器标识。
function digest(purpose: string, value: string): string {
  return crypto
    .createHmac('sha256', config.emailCodeSecret)
    .update(`registration:${purpose}:${value}`)
    .digest('hex')
}

// 浏览器标识保留于退出登录之后；无效签名不会作为可信标识进入数据库。
export function getRegistrationSource(
  req: Request,
  res: Response,
  requireCookie = false,
): RegistrationSource {
  const address = normalizeIpAddress(req.ip)
  if (!address || !isIP(address))
    throw new AuthError(AUTH_ERROR.REGISTRATION_RESTRICTED, '无法确认当前网络，请稍后重试。', 403)
  const raw: unknown = req.cookies?.[REGISTRATION_BROWSER_COOKIE]
  const match = typeof raw === 'string' ? /^([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(raw) : null
  const valid =
    !!match &&
    crypto.timingSafeEqual(
      Buffer.from(match[2]!, 'hex'),
      Buffer.from(digest('cookie', match[1]!), 'hex'),
    )
  const browser = valid ? match![1]! : crypto.randomBytes(16).toString('hex')
  if (!valid) {
    res.cookie(REGISTRATION_BROWSER_COOKIE, `${browser}.${digest('cookie', browser)}`, {
      httpOnly: true,
      secure: config.refreshCookieSecure,
      sameSite: config.refreshCookieSameSite,
      path: '/api/auth',
      maxAge: 30 * DAY,
    })
    if (requireCookie)
      throw new AuthError(
        AUTH_ERROR.REGISTRATION_COOKIE_REQUIRED,
        '请启用浏览器 Cookie，重新获取验证码后再注册。',
        409,
      )
  }
  // IPv6 同一 /64 网段共用额度，防止通过切换临时地址连续注册。
  return { ip: digest('ip', ipKeyGenerator(address, 64)), browser: digest('browser', browser) }
}

// 窗口以当前时间向前滚动；日额度以北京时间自然日划分。
export function registrationSuccessBuckets(source: RegistrationSource, now = Date.now()): Bucket[] {
  const limits = config.registrationLimits
  const midnight = Math.floor((now + CHINA_OFFSET) / DAY) * DAY - CHINA_OFFSET
  return [
    {
      key: `ip-day:${source.ip}`,
      limit: limits.ipSuccessPerDay,
      since: midnight - 1,
      expiresAt: midnight + DAY,
      code: AUTH_ERROR.REGISTRATION_IP_DAILY,
      message: '当前网络今日注册数量已达上限。',
    },
    {
      key: `ip-success:${source.ip}`,
      limit: limits.ipSuccessPer10Minutes,
      since: now - 10 * MINUTE,
      expiresAt: now + 10 * MINUTE,
      windowMs: 10 * MINUTE,
      code: AUTH_ERROR.REGISTRATION_IP_FREQUENT,
      message: '当前网络短时间内注册账号过多。',
    },
    {
      key: `browser:${source.browser}`,
      limit: limits.browserSuccessPerHour,
      since: now - 60 * MINUTE,
      expiresAt: now + 60 * MINUTE,
      windowMs: 60 * MINUTE,
      code: AUTH_ERROR.REGISTRATION_BROWSER_FREQUENT,
      message: '当前浏览器短时间内创建账号过多，注册已暂缓。',
    },
  ]
}

// 新表只保存结构化毫秒时间戳，异常数据必须阻断注册，不能静默清零额度。
function activeEvents(value: Prisma.JsonValue, bucket: Bucket): number[] {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'number' || !Number.isSafeInteger(item))
  ) {
    throw new Error('Invalid registration rate bucket events')
  }
  return (value as number[]).filter((time) => time > bucket.since).sort((a, b) => a - b)
}

// 配置调低时，需要等待足够多的旧事件过期后才能恢复注册。
function assertAvailable(events: number[], bucket: Bucket): void {
  if (events.length < bucket.limit) return
  const retryAt = bucket.windowMs
    ? events[events.length - bucket.limit]! + bucket.windowMs
    : bucket.expiresAt
  throw new RegistrationLimitError(bucket.code, bucket.message, retryAt)
}

// 邮件发送前只读预检成功额度，最终创建账号时仍须在事务内重新扣除。
export async function checkRegistrationSuccessLimits(source: RegistrationSource): Promise<void> {
  const buckets = registrationSuccessBuckets(source)
  const rows = await prisma.registrationRateBucket.findMany({
    where: { key: { in: buckets.map((bucket) => bucket.key) } },
  })
  for (const bucket of buckets) {
    const row = rows.find((item) => item.key === bucket.key)
    if (row) assertAvailable(activeEvents(row.events, bucket), bucket)
  }
}

// 先写入取得行锁，再读取和扣额度；固定锁顺序减少跨来源并发死锁。
async function consumeBuckets(
  tx: Prisma.TransactionClient,
  buckets: Bucket[],
  now: number,
): Promise<void> {
  for (const bucket of [...buckets].sort((a, b) => a.key.localeCompare(b.key))) {
    const row = await tx.registrationRateBucket.upsert({
      where: { key: bucket.key },
      create: { key: bucket.key, events: [], expiresAt: new Date(bucket.expiresAt) },
      update: { expiresAt: new Date(bucket.expiresAt) },
    })
    const events = activeEvents(row.events, bucket)
    assertAvailable(events, bucket)
    await tx.registrationRateBucket.update({
      where: { key: bucket.key },
      data: { events: [...events, now] },
    })
  }
}

// 成功额度与用户、验证码消费、协议和邀请记录共同提交，失败会完整回滚。
export async function consumeRegistrationSuccess(
  tx: Prisma.TransactionClient,
  source: RegistrationSource,
): Promise<void> {
  const now = Date.now()
  await consumeBuckets(tx, registrationSuccessBuckets(source, now), now)
}

// 首次并发建桶及 Serializable 冲突仅重试有限次数，拥堵时给出可重试结果。
export async function registrationTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      const conflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2034' ||
          (error.code === 'P2002' && String(error.meta?.modelName) === 'RegistrationRateBucket'))
      if (!conflict) throw error
      if (attempt >= 4)
        throw new RegistrationLimitError(
          AUTH_ERROR.REGISTRATION_IP_FREQUENT,
          '注册请求较多。',
          Date.now() + MINUTE,
        )
      await setTimeout(20 * (attempt + 1) + crypto.randomInt(30))
    }
  }
}

// 尝试次数独立提交；校验失败也计入短时请求额度，但不消耗成功账号额度。
export async function consumeRegistrationAttempt(
  source: RegistrationSource,
  emailCode = false,
): Promise<void> {
  await registrationTransaction(async (tx) => {
    const now = Date.now()
    const windowMs = emailCode ? 10 * MINUTE : MINUTE
    await consumeBuckets(
      tx,
      [
        {
          key: `${emailCode ? 'ip-code' : 'ip-attempt'}:${source.ip}`,
          limit: emailCode
            ? config.registrationLimits.codeRequestsPer10Minutes
            : config.registrationLimits.ipAttemptsPerMinute,
          since: now - windowMs,
          expiresAt: now + windowMs,
          windowMs,
          code: AUTH_ERROR.REGISTRATION_IP_FREQUENT,
          message: emailCode ? '当前网络获取注册验证码过于频繁。' : '当前网络提交注册过于频繁。',
        },
      ],
      now,
    )
  })
  // 过期一天的计数已不参与限制，每小时顺带清理一次，避免永久保存来源摘要。
  if (Date.now() - lastCleanupAt > 60 * MINUTE) {
    lastCleanupAt = Date.now()
    try {
      await prisma.registrationRateBucket.deleteMany({
        where: { expiresAt: { lt: new Date(Date.now() - DAY) } },
      })
    } catch (error) {
      logRuntimeError('auth.registration_limit_cleanup_failed', error)
    }
  }
}
