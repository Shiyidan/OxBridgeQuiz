// 注册属地回归：本地数据库验证持久化和更新规则，所有外部定位请求均用固定结果替代。
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mock } from 'node:test'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { USER_ROLE } from '../src/constants/domain.js'
import { ACCOUNT_STATUS } from '../src/constants/auth.js'
import { LEGAL_ACCEPTANCE_SOURCE, LEGAL_DOCUMENT_TYPE } from '../src/constants/legal.js'
import { canLookupIpLocation, resolveIpLocation } from '../src/services/ipGeolocation.js'
import { refreshNextRegistrationLocation } from '../src/services/registrationLocation.js'
import { getWebsiteTrafficAnalytics } from '../src/services/websiteTraffic.js'
import { getPaidUserAnalytics } from '../src/services/conversionAnalytics.js'

if (config.runtimeEnv !== 'local' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
  throw new Error('Registration location regression requires the local database')
}
const prefix = `location-${randomUUID()}`
const leaseName = prefix
const ids: string[] = []
const DAY_MS = 86400000
let now = new Date('2097-01-01T12:00:00Z')
let responseMode: 'success' | 'failure' | 'limited' = 'success'
let region = '上海市'
let requests = 0
let targetId = ''
const findFirst = prisma.user.findFirst.bind(prisma.user)
const createLease = prisma.backgroundJobLease.create.bind(prisma.backgroundJobLease)
const updateLease = prisma.backgroundJobLease.updateMany.bind(prisma.backgroundJobLease)
mock.method(Date, 'now', () => now.getTime())
// 给工作任务附加测试账号范围，任何历史本地用户都不会被读取或更新。
prisma.user.findFirst = ((args: any) => findFirst({
  ...args, where: { AND: [args.where, { id: targetId }] },
})) as typeof prisma.user.findFirst
// 租约测试使用独立名称，不触碰本地服务可能持有的业务租约。
prisma.backgroundJobLease.create = ((args: any) => createLease({
  ...args, data: { ...args.data, name: leaseName },
})) as typeof prisma.backgroundJobLease.create
// 租约更新与领取保持相同隔离范围，仍由真实数据库执行竞争条件判断。
prisma.backgroundJobLease.updateMany = ((args: any) => updateLease({
  ...args, where: { ...args.where, name: leaseName },
})) as typeof prisma.backgroundJobLease.updateMany
mock.method(globalThis, 'fetch', async (input: URL | string) => {
  requests++
  const url = new URL(String(input))
  assert.equal(url.hostname, 'ipwho.is')
  assert.equal(url.pathname, '/8.8.8.8', '只可定位测试注册 IP，不能使用登录 IP')
  if (responseMode === 'failure') throw new Error('simulated timeout')
  if (responseMode === 'limited') return new Response('{}', { status: 429, headers: { 'retry-after': '7200' } })
  return new Response(JSON.stringify({ success: true, country: '中国', region, city: region }))
})

// 使用远期日期隔离统计范围，并保存互不相同的注册 IP 和登录 IP 来检查数据来源。
async function createUser(ip: string | null) {
  const username = `${prefix}-${ids.length}`
  const user = await prisma.user.create({ data: {
    username, email: `${username}@example.test`, password: 'unused', role: USER_ROLE.STUDENT,
    createdAt: now,
    legalAcceptances: { create: [
      { documentType: LEGAL_DOCUMENT_TYPE.USER_AGREEMENT, documentVersion: 'test-register',
        source: LEGAL_ACCEPTANCE_SOURCE.REGISTER, ipAddress: ip, acceptedAt: now },
      { documentType: LEGAL_DOCUMENT_TYPE.USER_AGREEMENT, documentVersion: 'test-login',
        source: LEGAL_ACCEPTANCE_SOURCE.LOGIN, ipAddress: '1.1.1.1', acceptedAt: now },
    ] },
  } })
  ids.push(user.id)
  return user
}

// 前移业务时钟以验证到期更新，避免测试真的等待一小时或三十天。
function advance(ms: number) { now = new Date(now.getTime() + ms) }

try {
  const user = await createUser('8.8.8.8')
  targetId = user.id
  await refreshNextRegistrationLocation(now)
  let saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  assert.equal(saved.registrationCountry, '中国')
  assert.equal(saved.registrationRegion, '上海市')
  assert.equal(saved.registrationLocationUpdatedAt?.getTime(), now.getTime())
  assert.equal(saved.registrationLocationNextCheckAt?.getTime(), now.getTime() + 30 * DAY_MS)
  const firstSuccess = saved.registrationLocationUpdatedAt!.getTime()
  assert.equal(requests, 1)

  // 服务正常但还没到期时不重复查询；数据库租约也禁止其他实例并发接管。
  advance(DAY_MS)
  await refreshNextRegistrationLocation(now)
  assert.equal(requests, 1)
  await prisma.backgroundJobLease.update({ where: { name: leaseName }, data: {
    ownerId: 'other-instance', lockedUntil: new Date(now.getTime() + 60 * DAY_MS),
  } })
  advance(30 * DAY_MS)
  await refreshNextRegistrationLocation(now)
  assert.equal(requests, 1)
  await prisma.backgroundJobLease.update({ where: { name: leaseName }, data: { lockedUntil: now } })

  responseMode = 'failure'
  await refreshNextRegistrationLocation(now)
  saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  assert.equal(saved.registrationRegion, '上海市')
  assert.equal(saved.registrationLocationUpdatedAt?.getTime(), firstSuccess)
  assert.equal(saved.registrationLocationNextCheckAt?.getTime(), now.getTime() + 3600000)
  assert.equal(requests, 2)

  advance(3600000)
  responseMode = 'success'
  region = '北京市'
  await refreshNextRegistrationLocation(now)
  saved = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
  assert.equal(saved.registrationRegion, '北京市')
  assert.equal(saved.registrationLocationUpdatedAt?.getTime(), now.getTime())
  assert.equal(requests, 3)

  // 共用 IP 的新用户复用解析缓存，但每个用户独立保存、独立计数。
  const shared = await createUser('8.8.8.8')
  targetId = shared.id
  advance(6000)
  await refreshNextRegistrationLocation(now)
  assert.equal(requests, 3)
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: shared.id } })).registrationRegion, '北京市')
  const missing = await createUser(null)
  targetId = missing.id
  advance(6000)
  await refreshNextRegistrationLocation(now)
  assert.equal(requests, 3)
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: missing.id } })).registrationCountry, null)
  assert.equal(await resolveIpLocation('192.168.1.1'), null)

  // 两种统计都只读数据库；重复查询没有定位请求，封禁依旧从统计排除。
  const filters = { startAt: new Date('2097-01-01T00:00:00Z'), endAt: new Date('2097-03-01T00:00:00Z') }
  let traffic = await getWebsiteTrafficAnalytics(filters)
  assert.equal(traffic.locationDistribution.resolvedRegistrationCount, 2)
  assert.equal(traffic.locationDistribution.items.find(item => item.location === '中国 · 北京市')?.registrationCount, 2)
  assert.equal(traffic.locationDistribution.items.find(item => item.location === '暂无属地')?.registrationCount, 1)
  await getWebsiteTrafficAnalytics(filters)
  await getPaidUserAnalytics(now)
  assert.equal(requests, 3)
  await prisma.user.update({ where: { id: shared.id }, data: { accountStatus: ACCOUNT_STATUS.BANNED } })
  traffic = await getWebsiteTrafficAnalytics(filters)
  assert.equal(traffic.locationDistribution.resolvedRegistrationCount, 1)

  // 限流遵守 Retry-After，暂停期间不再外呼，已有属地不丢失。
  targetId = user.id
  advance(30 * DAY_MS)
  responseMode = 'limited'
  await refreshNextRegistrationLocation(now)
  assert.equal(requests, 4)
  assert.equal(canLookupIpLocation(), false)
  advance(3600000)
  await refreshNextRegistrationLocation(now)
  assert.equal(requests, 4)
  assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).registrationRegion, '北京市')
  advance(3600000)
  responseMode = 'success'
  await refreshNextRegistrationLocation(now)
  assert.equal(requests, 5)
  console.log('PASS registration location: persistence, 30-day refresh, retry, shared IP cache, lease, missing IP, rate-limit cooldown, database-only analytics and banned-user exclusion.')
} finally {
  mock.restoreAll()
  prisma.user.findFirst = findFirst
  prisma.backgroundJobLease.create = createLease
  prisma.backgroundJobLease.updateMany = updateLease
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
  await prisma.backgroundJobLease.deleteMany({ where: { name: leaseName } })
  await prisma.$disconnect()
}
