import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET

  const generated = crypto.randomBytes(64).toString('hex')
  console.warn('[config] JWT_SECRET 未设置，已生成随机密钥。生产环境必须通过环境变量注入固定值。')
  return generated
}

export const config = {
  port: parseInt(process.env.API_PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: resolveJwtSecret(),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // CORS 白名单：开发期匹配 localhost / 127.0.0.1 / 局域网 IP，生产环境配具体域名
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
        /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/,
        /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
      ],
}
