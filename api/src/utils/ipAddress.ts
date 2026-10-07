// IP 地址规范化：将本机和 IPv4 映射的 IPv6 地址转为后台易读的 IPv4 格式。
import { isIP } from 'node:net'

// 合并同一 IPv6 的大小写、补零及映射写法，防止同一网络被计为多个登录 IP。
export function normalizeIpAddress(value: string | null | undefined): string | null {
  const ipAddress = value?.trim()
  if (!ipAddress) return null
  if (isIP(ipAddress) === 6) {
    const canonical = new URL(`http://[${ipAddress}]/`).hostname.slice(1, -1)
    if (canonical === '::1') return '127.0.0.1'
    if (canonical.startsWith('::ffff:')) {
      const [high, low] = canonical.slice(7).split(':').map(part => Number.parseInt(part, 16))
      return `${high! >> 8}.${high! & 255}.${low! >> 8}.${low! & 255}`
    }
    return canonical
  }
  return ipAddress
}
