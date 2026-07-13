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
type ChinaumsEnv = 'test' | 'prod'

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
    corsOrigins: ['https://acemock.cn'],
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

// 生产环境必须显式提供固定 JWT 密钥，非生产环境才允许临时生成。
function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET

  if (BACKEND_ENV === 'prod') {
    throw new Error('[config] JWT_SECRET is required in production')
  }

  const generated = crypto.randomBytes(64).toString('hex')
  console.warn('[config] JWT_SECRET is missing. A temporary random secret was generated. Production must use a fixed secret.')
  return generated
}

// 邮箱验证码使用独立 HMAC 密钥，避免与访问令牌密钥相互影响。
function resolveEmailCodeSecret(): string {
  if (process.env.EMAIL_CODE_SECRET) return process.env.EMAIL_CODE_SECRET
  if (BACKEND_ENV === 'prod') {
    throw new Error('[config] EMAIL_CODE_SECRET is required in production')
  }
  console.warn('[config] EMAIL_CODE_SECRET is missing. Local email codes will be invalid after restart.')
  return crypto.randomBytes(64).toString('hex')
}

// 布尔环境变量只接受明确值，防止拼写错误静默改变安全配置。
function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`[config] Expected true or false, received: ${value}`)
}

// Cookie SameSite 只允许浏览器支持的三个标准取值。
function parseCookieSameSite(value: string | undefined, fallback: CookieSameSite): CookieSameSite {
  if (!value) return fallback
  if (value === 'lax' || value === 'strict' || value === 'none') return value
  throw new Error(`[config] Unsupported REFRESH_COOKIE_SAME_SITE: ${value}`)
}

// 可信代理按明确跳数配置，避免伪造客户端 IP 绕过审计和限流。
function parseTrustProxy(value: string | undefined, fallback: boolean | number): boolean | number {
  if (value === undefined) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  const hops = Number(value)
  if (Number.isInteger(hops) && hops >= 0) return hops
  throw new Error(`[config] TRUST_PROXY must be true, false, or a non-negative integer`)
}

// 数据库连接必须由环境提供，不在源码中保留可用默认凭据。
function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  throw new Error('[config] DATABASE_URL is required')
}

// CORS 只接受明确来源，生产环境统一到唯一正式主域名。
function resolveCorsOrigins(): (string | RegExp)[] {
  if (!process.env.CORS_ORIGINS) return backendDefaults.corsOrigins
  const origins = process.env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
  if (origins.length === 0) throw new Error('[config] CORS_ORIGINS must contain at least one origin')
  if (origins.includes('*')) throw new Error('[config] CORS_ORIGINS cannot use * when credentials are enabled')
  return origins
}

function parseChinaumsEnv(value: string | undefined): ChinaumsEnv {
  const fallback = BACKEND_ENV === 'prod' ? 'prod' : 'test'
  const environment = value || fallback
  if (environment === 'test' || environment === 'prod') return environment
  throw new Error(`[config] CHINAUMS_ENV must be test or prod, received: ${environment}`)
}

function validateChinaumsUrl(name: string, value: string, requireHttps: boolean): void {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`[config] ${name} must be a valid absolute URL`)
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`[config] ${name} must use HTTP or HTTPS`)
  }
  if (requireHttps && url.protocol !== 'https:') {
    throw new Error(`[config] ${name} must use HTTPS in the ChinaUMS production environment`)
  }
}

function resolveChinaumsConfig() {
  const enabled = parseBoolean(process.env.CHINAUMS_ENABLED, false)
  const environment = parseChinaumsEnv(process.env.CHINAUMS_ENV)
  const productionMode = environment === 'prod' || BACKEND_ENV === 'prod'
  const defaultBaseUrl = environment === 'prod'
    ? 'https://api-mop.chinaums.com'
    : 'https://test-api-open.chinaums.com'
  const payment = {
    enabled,
    environment,
    baseUrl: (process.env.CHINAUMS_BASE_URL || defaultBaseUrl).replace(/\/$/, ''),
    appId: process.env.CHINAUMS_APP_ID || '',
    appKey: process.env.CHINAUMS_APP_KEY || '',
    mid: process.env.CHINAUMS_MID || '',
    tid: process.env.CHINAUMS_TID || '',
    instMid: process.env.CHINAUMS_INST_MID || 'QRPAYDEFAULT',
    msgSrcId: process.env.CHINAUMS_MSG_SRC_ID || '',
    communicationKey: process.env.CHINAUMS_COMMUNICATION_KEY || '',
    notifyUrl: process.env.CHINAUMS_NOTIFY_URL || '',
    returnUrl: process.env.CHINAUMS_RETURN_URL || '',
    orderDescription: process.env.CHINAUMS_ORDER_DESCRIPTION || 'AceMock 在线会员订阅',
    timeoutMs: parseInt(process.env.CHINAUMS_TIMEOUT_MS || '10000', 10),
    orderExpireMinutes: parseInt(process.env.CHINAUMS_ORDER_EXPIRE_MINUTES || '15', 10),
  }

  if (!enabled) return payment
  if (BACKEND_ENV === 'prod' && environment !== 'prod') {
    throw new Error('[config] API_RUNTIME_ENV=prod requires CHINAUMS_ENV=prod')
  }

  const required: Array<[string, string]> = [
    ['CHINAUMS_APP_ID', payment.appId],
    ['CHINAUMS_APP_KEY', payment.appKey],
    ['CHINAUMS_MID', payment.mid],
    ['CHINAUMS_TID', payment.tid],
    ['CHINAUMS_MSG_SRC_ID', payment.msgSrcId],
    ['CHINAUMS_COMMUNICATION_KEY', payment.communicationKey],
    ['CHINAUMS_NOTIFY_URL', payment.notifyUrl],
  ]
  const missing = required.filter(([, value]) => !value).map(([name]) => name)
  if (missing.length > 0) {
    throw new Error(`[config] ChinaUMS is enabled but required values are missing: ${missing.join(', ')}`)
  }
  if (payment.mid.length !== 15) throw new Error('[config] CHINAUMS_MID must contain 15 characters')
  if (payment.tid.length !== 8) throw new Error('[config] CHINAUMS_TID must contain 8 characters')
  if (!/^[A-Za-z0-9]{4}$/.test(payment.msgSrcId)) {
    throw new Error('[config] CHINAUMS_MSG_SRC_ID must contain exactly 4 letters or digits')
  }
  if (!Number.isInteger(payment.timeoutMs) || payment.timeoutMs < 1000) {
    throw new Error('[config] CHINAUMS_TIMEOUT_MS must be an integer of at least 1000')
  }
  if (!Number.isInteger(payment.orderExpireMinutes) || payment.orderExpireMinutes < 1) {
    throw new Error('[config] CHINAUMS_ORDER_EXPIRE_MINUTES must be a positive integer')
  }
  if (payment.orderDescription.length > 128) {
    throw new Error('[config] CHINAUMS_ORDER_DESCRIPTION must not exceed 128 characters')
  }
  validateChinaumsUrl('CHINAUMS_BASE_URL', payment.baseUrl, true)
  validateChinaumsUrl('CHINAUMS_NOTIFY_URL', payment.notifyUrl, productionMode)
  if (payment.returnUrl) validateChinaumsUrl('CHINAUMS_RETURN_URL', payment.returnUrl, productionMode)
  return payment
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
  chinaums: resolveChinaumsConfig(),
}
