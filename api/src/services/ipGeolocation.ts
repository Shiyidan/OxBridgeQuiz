// 登录会话 IP 地理解析：仅查询公网地址，并以短超时和内存缓存隔离第三方服务波动。
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

const IP_LOOKUP_TIMEOUT_MS = 1500
const IP_LOCATION_CACHE_TTL_MS = 6 * 60 * 60 * 1000
const IP_LOCATION_CACHE_MAX = 500
const locationCache = new Map<string, CachedIpLocation>()

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
    expiresAt: Date.now() + IP_LOCATION_CACHE_TTL_MS,
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
