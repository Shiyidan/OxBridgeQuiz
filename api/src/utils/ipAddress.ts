// IP 地址规范化：将本机和 IPv4 映射的 IPv6 地址转为后台易读的 IPv4 格式。

// 真实 IPv6 无法无损转成 IPv4，仅处理 Node 常见的 ::1 和 ::ffff: 前缀。
export function normalizeIpAddress(value: string | null | undefined): string | null {
  const ipAddress = value?.trim()
  if (!ipAddress) return null
  if (ipAddress === '::1') return '127.0.0.1'
  if (ipAddress.toLowerCase().startsWith('::ffff:')) return ipAddress.slice(7)
  return ipAddress
}
