// JWT 签发与校验。用于 middleware/auth.ts 的 Token 验证和 routes/auth.ts 的登录签发。
import jwt from 'jsonwebtoken'
import { config } from '../config.js'

// 7 天有效期：平衡用户体验和安全——关闭浏览器重新打开无需重新登录
const TOKEN_TTL = '7d'

export interface JwtPayload {
  userId: string
  email: string
  role: string
}

// 登录成功后签发 Token，payload 只放最小必要字段（userId + email + role）
export function signToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: TOKEN_TTL },
  )
}

// 中间件调用，校验失败直接 throw——由调用方 catch 返回 401
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload
}
