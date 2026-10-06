// 注册属地与登录会话共用的 IP 解析：以缓存、请求间隔及限流退避隔离外部服务波动。
import { isIP } from 'node:net'
import { normalizeIpAddress } from '../utils/ipAddress.js'

export interface IpLocation {
  country: string
  region: string
  city: string
  label: string
}

interface IpWhoisResponse {
  success?: boolean
  country?: string
  region?: string
  city?: string
}

interface CachedIpLocation {
  expiresAt: number
  value: IpLocation | null
}

const IP_LOOKUP_TIMEOUT_MS = 5000
const IP_LOCATION_CACHE_TTL_MS = 6 * 60 * 60 * 1000
const IP_LOCATION_FAILURE_TTL_MS = 60000
const IP_LOCATION_CACHE_MAX = 500
const locationCache = new Map<string, CachedIpLocation>()
const pendingLookups = new Map<string, Promise<IpLocation | null>>()
let nextLookupAt = 0

// 定时任务遇到限流时暂停外部查询，不把整批用户逐个标为查询失败。
export function canLookupIpLocation(): boolean {
  return Date.now() >= nextLookupAt
}

// 私网、回环和链路本地地址没有可验证的公网地理位置，不发送给外部解析服务。
export function isPublicIpAddress(value: string | null | undefined): boolean {
  const ipAddress = normalizeIpAddress(value)
  if (!ipAddress || !isIP(ipAddress)) return false

  if (isIP(ipAddress) === 4) {
    const octets = ipAddress.split('.').map(Number)
    const [first, second] = octets
    return !(
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      first >= 224
    )
  }

  const normalized = ipAddress.toLowerCase()
  return !(
    normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    /^fe[89ab]/.test(normalized)
  )
}

// 地区文本按国家、行政区和城市去重拼接，避免直辖市等数据出现重复名称。
function buildLocationLabel(response: IpWhoisResponse): IpLocation | null {
  const country = response.country?.trim() || ''
  const region = response.region?.trim() || ''
  const city = response.city?.trim() || ''
  const parts = [...new Set([country, region, city].filter(Boolean))]
  if (!parts.length) return null
  return { country, region, city, label: parts.join(' · ') }
}

// 缓存最近查询结果，同时缓存失败以避免第三方服务异常时反复阻塞个人中心请求。
function cacheLocation(ipAddress: string, value: IpLocation | null): void {
  if (locationCache.size >= IP_LOCATION_CACHE_MAX) {
    const oldestKey = locationCache.keys().next().value
    if (oldestKey) locationCache.delete(oldestKey)
  }
  locationCache.set(ipAddress, {
    value,
    expiresAt: Date.now() + (value ? IP_LOCATION_CACHE_TTL_MS : IP_LOCATION_FAILURE_TTL_MS),
  })
}

// 公网 IP 通过 HTTPS 服务解析；超时、限流或返回异常时降级为空位置，不影响会话列表。
export async function resolveIpLocation(
  value: string | null | undefined,
): Promise<IpLocation | null> {
  const ipAddress = normalizeIpAddress(value)
  if (!isPublicIpAddress(ipAddress) || !ipAddress) return null

  const cached = locationCache.get(ipAddress)
  if (cached && cached.expiresAt > Date.now()) return cached.value
  const pending = pendingLookups.get(ipAddress)
  if (pending) return pending
  if (!canLookupIpLocation()) return null
  nextLookupAt = Date.now() + 5000
  const lookup = fetchIpLocation(ipAddress)
  pendingLookups.set(ipAddress, lookup)
  try {
    return await lookup
  } finally {
    pendingLookups.delete(ipAddress)
  }
}

// 所有入口共享请求间隔；限流至少冷却一小时，并遵守服务端更长的 Retry-After。
async function fetchIpLocation(ipAddress: string): Promise<IpLocation | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), IP_LOOKUP_TIMEOUT_MS)
  try {
    const endpoint = new URL(`https://ipwho.is/${encodeURIComponent(ipAddress)}`)
    endpoint.searchParams.set('lang', 'zh-CN')
    endpoint.searchParams.set('fields', 'success,country,region,city')
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after') || ''
      const retryMs = /^\d+$/.test(retryAfter)
        ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now()
      nextLookupAt = Date.now() + Math.max(3600000, Number.isFinite(retryMs) ? retryMs : 0)
    }
    if (!response.ok) {
      cacheLocation(ipAddress, null)
      return null
    }
    const payload = (await response.json()) as IpWhoisResponse
    const location = payload.success === false ? null : buildLocationLabel(payload)
    cacheLocation(ipAddress, location)
    return location
  } catch {
    cacheLocation(ipAddress, null)
    return null
  } finally {
    clearTimeout(timeout)
  }
}
