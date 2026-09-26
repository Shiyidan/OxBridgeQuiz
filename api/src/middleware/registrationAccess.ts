// 注册及验证码接口的来源限制，阻止已确认的异常 IP 更换邮箱继续注册。
import { BlockList, isIP } from 'node:net'
import type { RequestHandler } from 'express'
import { AUTH_ERROR } from '../constants/auth.js'
import { normalizeIpAddress } from '../utils/ipAddress.js'
import { fail } from '../utils/response.js'

// 配置只接受完整 IP；错误配置应阻止启动，避免误封网段或静默失效。
export function parseRegistrationBlockedIps(value: string | undefined): string[] {
  const addresses = [...new Set((value || '').split(',').map(ip => ip.trim()).filter(Boolean))]
  if (addresses.some(ip => !isIP(ip))) throw new Error('[config] REGISTRATION_BLOCKED_IPS must contain comma-separated IP addresses')
  return addresses
}

// 使用 Express 经可信代理解析的来源，IPv4 映射地址和等价 IPv6 写法保持一致。
export function createRegistrationSourceGuard(addresses: string[]): RequestHandler {
  const blocked = new BlockList()
  for (const address of addresses) {
    const normalized = normalizeIpAddress(address)!
    blocked.addAddress(normalized, isIP(normalized) === 6 ? 'ipv6' : 'ipv4')
  }
  return (req, res, next) => {
    const ip = normalizeIpAddress(req.ip)
    if (addresses.length && (!ip || !isIP(ip) || blocked.check(ip, isIP(ip) === 6 ? 'ipv6' : 'ipv4'))) {
      res.status(403).json(fail('当前网络暂时无法注册，请联系客服申请复核。', AUTH_ERROR.REGISTRATION_RESTRICTED))
      return
    }
    next()
  }
}
