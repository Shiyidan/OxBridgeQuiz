import path from 'path'
import crypto from 'crypto'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const LOCAL_CORS_ORIGINS = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
]

type BackendEnv = 'local' | 'test' | 'prod'
type CookieSameSite = 'lax' | 'strict' | 'none'

type BackendEnvConfig = {
  port: number
  frontendUrl: string
  corsOrigins: (string | RegExp)[]
  refreshCookieSecure: boolean
  refreshCookieSameSite: CookieSameSite
  trustProxy: boolean | number
}

const BACKEND_CONFIG_BY_ENV: Record<BackendEnv, BackendEnvConfig> = {
  local: {
    port: 3001,
    frontendUrl: 'http://localhost:5173',
    corsOrigins: LOCAL_CORS_ORIGINS,
    refreshCookieSecure: false,
    refreshCookieSameSite: 'lax',
    trustProxy: false,
  },
  test: {
    port: 3001,
    frontendUrl: 'http://8.149.140.115',
    corsOrigins: ['http://8.149.140.115', ...LOCAL_CORS_ORIGINS],
    refreshCookieSecure: false,
    refreshCookieSameSite: 'lax',
    trustProxy: 1,
  },
  prod: {
    port: 3001,
    frontendUrl: 'https://acemock.cn',
    corsOrigins: ['https://acemock.cn', 'https://www.acemock.cn'],
    refreshCookieSecure: true,
    refreshCookieSameSite: 'lax',
    trustProxy: 1,
  },
}

const BACKEND_ENV = (process.env.API_RUNTIME_ENV || 'local') as BackendEnv
const backendDefaults = BACKEND_CONFIG_BY_ENV[BACKEND_ENV]

if (!backendDefaults) {
  throw new Error(`[config] Unsupported API_RUNTIME_ENV: ${BACKEND_ENV}`)
}

function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET

  if (BACKEND_ENV === 'prod') {
    throw new Error('[config] JWT_SECRET is required in production')
  }

  const generated = crypto.randomBytes(64).toString('hex')
  console.warn('[config] JWT_SECRET is missing. A temporary random secret was generated. Production must use a fixed secret.')
  return generated
}

function resolveEmailCodeSecret(): string {
  if (process.env.EMAIL_CODE_SECRET) return process.env.EMAIL_CODE_SECRET
  if (BACKEND_ENV === 'prod') {
    throw new Error('[config] EMAIL_CODE_SECRET is required in production')
  }
  console.warn('[config] EMAIL_CODE_SECRET is missing. Local email codes will be invalid after restart.')
  return crypto.randomBytes(64).toString('hex')
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`[config] Expected true or false, received: ${value}`)
}

function parseCookieSameSite(value: string | undefined, fallback: CookieSameSite): CookieSameSite {
  if (!value) return fallback
  if (value === 'lax' || value === 'strict' || value === 'none') return value
  throw new Error(`[config] Unsupported REFRESH_COOKIE_SAME_SITE: ${value}`)
}

function parseTrustProxy(value: string | undefined, fallback: boolean | number): boolean | number {
  if (value === undefined) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  const hops = Number(value)
  if (Number.isInteger(hops) && hops >= 0) return hops
  throw new Error(`[config] TRUST_PROXY must be true, false, or a non-negative integer`)
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  throw new Error('[config] DATABASE_URL is required')
}

function resolveCorsOrigins(): (string | RegExp)[] {
  if (!process.env.CORS_ORIGINS) return backendDefaults.corsOrigins
  const origins = process.env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
  if (origins.length === 0) throw new Error('[config] CORS_ORIGINS must contain at least one origin')
  if (origins.includes('*')) throw new Error('[config] CORS_ORIGINS cannot use * when credentials are enabled')
  return origins
}

const refreshCookieSecure = parseBoolean(
  process.env.REFRESH_COOKIE_SECURE,
  backendDefaults.refreshCookieSecure,
)
const refreshCookieSameSite = parseCookieSameSite(
  process.env.REFRESH_COOKIE_SAME_SITE,
  backendDefaults.refreshCookieSameSite,
)

if (refreshCookieSameSite === 'none' && !refreshCookieSecure) {
  throw new Error('[config] SameSite=None cookies require REFRESH_COOKIE_SECURE=true')
}

if (BACKEND_ENV === 'prod' && !refreshCookieSecure) {
  throw new Error('[config] Production requires REFRESH_COOKIE_SECURE=true')
}

export const config = {
  runtimeEnv: BACKEND_ENV,
  port: parseInt(process.env.API_PORT || String(backendDefaults.port), 10),
  frontendUrl: process.env.FRONTEND_URL || backendDefaults.frontendUrl,
  jwtSecret: resolveJwtSecret(),
  jwtIssuer: process.env.JWT_ISSUER || 'quiztest-api',
  jwtAudience: process.env.JWT_AUDIENCE || 'quiztest-web',
  accessTokenTtlSeconds: parseInt(process.env.ACCESS_TOKEN_TTL_SECONDS || '900', 10),
  refreshTokenTtlSeconds: parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS || '604800', 10),
  refreshCookieSecure,
  refreshCookieSameSite,
  emailCodeSecret: resolveEmailCodeSecret(),
  emailCodeTtlSeconds: parseInt(process.env.EMAIL_CODE_TTL_SECONDS || '600', 10),
  emailCodeResendSeconds: parseInt(process.env.EMAIL_CODE_RESEND_SECONDS || '60', 10),
  emailCodeMaxAttempts: parseInt(process.env.EMAIL_CODE_MAX_ATTEMPTS || '5', 10),
  smtpHost: process.env.SMTP_HOST || 'smtpdm.aliyun.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpSecure: parseBoolean(process.env.SMTP_SECURE, true),
  smtpConnectionTimeoutMs: parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || '5000', 10),
  smtpGreetingTimeoutMs: parseInt(process.env.SMTP_GREETING_TIMEOUT_MS || '5000', 10),
  smtpSocketTimeoutMs: parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS || '15000', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  mailFrom: process.env.MAIL_FROM || '',
  databaseUrl: resolveDatabaseUrl(),
  corsOrigins: resolveCorsOrigins(),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY, backendDefaults.trustProxy),
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
}
