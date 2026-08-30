// 集中解析并校验 API 在本地、测试与生产环境使用的运行时配置。
import path from 'path'
import crypto from 'crypto'
import dotenv from 'dotenv'
import { assertPaymentRuntimeSafety } from './utils/paymentRuntimeSafety.js'

const envFile = process.env.API_ENV_FILE?.trim() || path.resolve(process.cwd(), '.env')
dotenv.config({ path: envFile })

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
type MailConfigName =
  | 'SMTP_USER'
  | 'SMTP_PASS'
  | 'MAIL_FROM'
  | 'BULK_SMTP_USER'
  | 'BULK_SMTP_PASS'
  | 'BULK_MAIL_FROM'

const TRANSACTIONAL_MAIL_ADDRESS = 'no-reply@mail.acemock.cn'
const BULK_MAIL_ADDRESS = 'news@mail.acemock.cn'

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
    frontendUrl: 'https://test.example.invalid',
    corsOrigins: ['https://test.example.invalid', ...LOCAL_CORS_ORIGINS],
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

const runtimeEnv = process.env.API_RUNTIME_ENV?.trim()
if (!runtimeEnv) {
  throw new Error('[config] API_RUNTIME_ENV is required; use local, test, or prod explicitly')
}

const BACKEND_ENV = runtimeEnv as BackendEnv
const backendDefaults = BACKEND_CONFIG_BY_ENV[BACKEND_ENV]

if (!backendDefaults) {
  throw new Error(`[config] Unsupported API_RUNTIME_ENV: ${BACKEND_ENV}`)
}

// 测试与线上环境必须使用稳定 JWT 密钥，避免重启后令牌整体失效。
function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET

  if (BACKEND_ENV !== 'local') {
    throw new Error(`[config] JWT_SECRET is required when API_RUNTIME_ENV=${BACKEND_ENV}`)
  }

  const generated = crypto.randomBytes(64).toString('hex')
  console.warn(
    '[config] JWT_SECRET is missing. A temporary random secret was generated for local development.',
  )
  return generated
}

// 邮箱验证码使用独立且稳定的 HMAC 密钥，测试与线上重启后仍可继续验证。
function resolveEmailCodeSecret(): string {
  if (process.env.EMAIL_CODE_SECRET) return process.env.EMAIL_CODE_SECRET
  if (BACKEND_ENV !== 'local') {
    throw new Error(`[config] EMAIL_CODE_SECRET is required when API_RUNTIME_ENV=${BACKEND_ENV}`)
  }
  console.warn(
    '[config] EMAIL_CODE_SECRET is missing. Local email codes will be invalid after restart.',
  )
  return crypto.randomBytes(64).toString('hex')
}

// 访客 IP 使用独立 HMAC 密钥生成不可逆摘要，避免与认证签名共享密钥域。
function resolveVisitorIpHashSecret(): string {
  const value = process.env.VISITOR_IP_HASH_SECRET?.trim()
  if (value) return value
  if (BACKEND_ENV !== 'local') {
    throw new Error(`[config] VISITOR_IP_HASH_SECRET is required when API_RUNTIME_ENV=${BACKEND_ENV}`)
  }
  console.warn(
    '[config] VISITOR_IP_HASH_SECRET is missing. Local visitor IP deduplication will reset after restart.',
  )
  return crypto.randomBytes(64).toString('hex')
}

// 从纯邮箱或带显示名的 From 值中提取邮箱地址，供通道职责校验使用。
function extractMailboxAddress(value: string): string {
  const angleAddress = value.match(/<([^<>]+)>/)?.[1]
  return (angleAddress || value).trim().toLowerCase()
}

// 邮件通道必须使用固定业务邮箱，避免环境配置漂移到个人或错误账号。
function resolveMailValue(name: MailConfigName, expectedAddress: string): string {
  const value = process.env[name]?.trim()
  if (value) {
    if ((name.endsWith('_USER') || name.endsWith('_FROM')) && extractMailboxAddress(value) !== expectedAddress) {
      throw new Error(`[config] ${name} must use ${expectedAddress}`)
    }
    return value
  }
  if (BACKEND_ENV !== 'local') {
    throw new Error(`[config] ${name} is required when API_RUNTIME_ENV=${BACKEND_ENV}`)
  }
  return ''
}

// 布尔环境变量只接受明确值，防止拼写错误静默改变安全配置。
function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error(`[config] Expected true or false, received: ${value}`)
}

// 后台任务参数必须是有界正整数，避免错误配置触发忙轮询或一次拉取过多记录。
function parsePositiveInteger(
  name: string,
  value: string | undefined,
  fallback: number,
  bounds: { min: number; max: number },
): number {
  const parsed = Number(value ?? fallback)
  if (!Number.isInteger(parsed) || parsed < bounds.min || parsed > bounds.max) {
    throw new Error(`[config] ${name} must be an integer between ${bounds.min} and ${bounds.max}`)
  }
  return parsed
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

// 本地默认写入项目 api/uploads，测试和生产固定写入发布目录之外的持久化目录。
function resolveStudyResourceStorageRoot(): string {
  const configured = process.env.STUDY_RESOURCE_STORAGE_ROOT?.trim()
  if (configured) return path.resolve(configured)
  return BACKEND_ENV === 'local'
    ? path.resolve(process.cwd(), 'uploads', 'study-resources')
    : '/opt/quiz/uploads/study-resources'
}

// 模考组卷原始 Excel 与业务数据分开持久化，测试和生产部署更新时不会覆盖历史文件。
function resolveMockPaperWorkbookStorageRoot(): string {
  const configured = process.env.MOCK_PAPER_WORKBOOK_STORAGE_ROOT?.trim()
  if (configured) return path.resolve(configured)
  return BACKEND_ENV === 'local'
    ? path.resolve(process.cwd(), 'uploads', 'mock-paper-workbooks')
    : '/opt/quiz/uploads/mock-paper-workbooks'
}

// 测试与生产地址属于私有部署配置，禁止回退到仓库中的示例地址。
function resolveFrontendUrl(): string {
  const value = process.env.FRONTEND_URL?.trim().replace(/\/$/, '')
  if (!value) {
    if (BACKEND_ENV !== 'local') {
      throw new Error(`[config] FRONTEND_URL is required when API_RUNTIME_ENV=${BACKEND_ENV}`)
    }
    return backendDefaults.frontendUrl
  }

  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('[config] FRONTEND_URL must use HTTP or HTTPS')
  }
  return value
}

// CORS 只接受明确来源，测试与生产来源必须由各自私有配置提供。
function resolveCorsOrigins(): (string | RegExp)[] {
  if (!process.env.CORS_ORIGINS) {
    if (BACKEND_ENV !== 'local') {
      throw new Error(`[config] CORS_ORIGINS is required when API_RUNTIME_ENV=${BACKEND_ENV}`)
    }
    return backendDefaults.corsOrigins
  }
  const origins = process.env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
  if (origins.length === 0) throw new Error('[config] CORS_ORIGINS must contain at least one origin')
  if (origins.includes('*')) throw new Error('[config] CORS_ORIGINS cannot use * when credentials are enabled')
  return origins
}

// 支付购买白名单按邮箱去重并统一为小写；配置为空时不限制购买账号。
function parsePaymentPurchaseAllowedEmails(value: string | undefined): string[] {
  if (!value?.trim()) return []
  const emails = [...new Set(value.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean))]
  const invalidEmail = emails.find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  if (invalidEmail) {
    throw new Error('[config] PAYMENT_PURCHASE_ALLOWED_EMAILS contains an invalid email address')
  }
  return emails
}

function parseChinaumsEnv(value: string | undefined): ChinaumsEnv {
  const fallback = BACKEND_ENV === 'prod' ? 'prod' : 'test'
  const environment = value || fallback
  if (environment === 'test' || environment === 'prod') return environment
  throw new Error(`[config] CHINAUMS_ENV must be test or prod, received: ${environment}`)
}

function validateChinaumsUrl(name: string, value: string, requireHttps: boolean): URL {
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
  return url
}

// 生产通知地址必须可被银联公网回调，显式拦截本机、保留地址和常见私网地址。
function isPrivateNetworkHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host === '::1' || host === '0.0.0.0' || host.endsWith('.local')) return true
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return true
  const match = host.match(/^172\.(\d+)\./)
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31)
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
    expectedMid: process.env.CHINAUMS_EXPECTED_MID || '',
    tid: process.env.CHINAUMS_TID || '',
    instMid: process.env.CHINAUMS_INST_MID || 'QRPAYDEFAULT',
    msgSrcId: process.env.CHINAUMS_MSG_SRC_ID || '',
    communicationKey: process.env.CHINAUMS_COMMUNICATION_KEY || '',
    notifyUrl: process.env.CHINAUMS_NOTIFY_URL || '',
    returnUrl: process.env.CHINAUMS_RETURN_URL || '',
    orderDescription: process.env.CHINAUMS_ORDER_DESCRIPTION || 'AceMock Membership',
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
  ]
  if (productionMode) {
    required.push(
      ['CHINAUMS_EXPECTED_MID', payment.expectedMid],
      ['CHINAUMS_COMMUNICATION_KEY', payment.communicationKey],
      ['CHINAUMS_NOTIFY_URL', payment.notifyUrl],
    )
  }
  const missing = required.filter(([, value]) => !value).map(([name]) => name)
  if (missing.length > 0) {
    throw new Error(`[config] ChinaUMS is enabled but required values are missing: ${missing.join(', ')}`)
  }
  if (!/^\d{15}$/.test(payment.mid)) throw new Error('[config] CHINAUMS_MID must contain exactly 15 digits')
  if (payment.expectedMid && payment.expectedMid !== payment.mid) {
    throw new Error('[config] CHINAUMS_MID does not match CHINAUMS_EXPECTED_MID')
  }
  if (!/^[A-Za-z0-9]{8}$/.test(payment.tid)) {
    throw new Error('[config] CHINAUMS_TID must contain exactly 8 letters or digits')
  }
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
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._()\/-]*$/.test(payment.orderDescription)) {
    throw new Error('[config] CHINAUMS_ORDER_DESCRIPTION must use payment-page-safe ASCII characters')
  }
  const baseUrl = validateChinaumsUrl('CHINAUMS_BASE_URL', payment.baseUrl, true)
  if (productionMode && baseUrl.origin !== 'https://api-mop.chinaums.com') {
    throw new Error('[config] ChinaUMS production must use https://api-mop.chinaums.com')
  }
  if (payment.notifyUrl) {
    const notifyUrl = validateChinaumsUrl('CHINAUMS_NOTIFY_URL', payment.notifyUrl, productionMode)
    if (productionMode) {
      if (isPrivateNetworkHost(notifyUrl.hostname)) {
        throw new Error('[config] CHINAUMS_NOTIFY_URL must use a public production hostname')
      }
      if (notifyUrl.pathname.replace(/\/$/, '') !== '/api/payment/notifications/chinaums') {
        throw new Error('[config] CHINAUMS_NOTIFY_URL must end with /api/payment/notifications/chinaums')
      }
      if (notifyUrl.username || notifyUrl.password || notifyUrl.search || notifyUrl.hash) {
        throw new Error('[config] CHINAUMS_NOTIFY_URL cannot contain credentials, query parameters, or fragments')
      }
    }
  }
  if (payment.returnUrl) validateChinaumsUrl('CHINAUMS_RETURN_URL', payment.returnUrl, productionMode)
  return payment
}

// 支付生命周期任务在测试和生产环境默认开启，本地按需显式启用。
function resolvePaymentLifecycleConfig() {
  const pollIntervalMs = parsePositiveInteger(
    'PAYMENT_LIFECYCLE_POLL_INTERVAL_MS',
    process.env.PAYMENT_LIFECYCLE_POLL_INTERVAL_MS,
    60_000,
    { min: 10_000, max: 3_600_000 },
  )
  const leaseMs = parsePositiveInteger(
    'PAYMENT_LIFECYCLE_LEASE_MS',
    process.env.PAYMENT_LIFECYCLE_LEASE_MS,
    300_000,
    { min: 60_000, max: 3_600_000 },
  )
  if (leaseMs < pollIntervalMs) {
    throw new Error('[config] PAYMENT_LIFECYCLE_LEASE_MS must be greater than or equal to the poll interval')
  }
  return {
    enabled: parseBoolean(process.env.PAYMENT_LIFECYCLE_ENABLED, BACKEND_ENV !== 'local'),
    pollIntervalMs,
    leaseMs,
    batchSize: parsePositiveInteger(
      'PAYMENT_LIFECYCLE_BATCH_SIZE',
      process.env.PAYMENT_LIFECYCLE_BATCH_SIZE,
      20,
      { min: 1, max: 100 },
    ),
    pendingQueryAgeSeconds: parsePositiveInteger(
      'PAYMENT_PENDING_QUERY_AGE_SECONDS',
      process.env.PAYMENT_PENDING_QUERY_AGE_SECONDS,
      30,
      { min: 10, max: 86_400 },
    ),
    refundQueryAgeSeconds: parsePositiveInteger(
      'PAYMENT_REFUND_QUERY_AGE_SECONDS',
      process.env.PAYMENT_REFUND_QUERY_AGE_SECONDS,
      30,
      { min: 10, max: 86_400 },
    ),
    reconciliationEnabled: parseBoolean(
      process.env.PAYMENT_RECONCILIATION_ENABLED,
      BACKEND_ENV !== 'local',
    ),
    reconciliationHour: parsePositiveInteger(
      'PAYMENT_RECONCILIATION_HOUR',
      process.env.PAYMENT_RECONCILIATION_HOUR,
      2,
      { min: 0, max: 23 },
    ),
    reconciliationBatchSize: parsePositiveInteger(
      'PAYMENT_RECONCILIATION_BATCH_SIZE',
      process.env.PAYMENT_RECONCILIATION_BATCH_SIZE,
      100,
      { min: 1, max: 500 },
    ),
  }
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

const chinaumsConfig = resolveChinaumsConfig()
const paymentLifecycleConfig = resolvePaymentLifecycleConfig()

// 正式支付不能脱离后台状态收敛任务运行，部署前校验与 API 启动共用这条门禁。
assertPaymentRuntimeSafety({
  runtimeEnv: BACKEND_ENV,
  chinaumsEnabled: chinaumsConfig.enabled,
  lifecycleEnabled: paymentLifecycleConfig.enabled,
})

export const config = {
  runtimeEnv: BACKEND_ENV,
  port: parseInt(process.env.API_PORT || String(backendDefaults.port), 10),
  frontendUrl: resolveFrontendUrl(),
  jwtSecret: resolveJwtSecret(),
  jwtIssuer: process.env.JWT_ISSUER || 'quiztest-api',
  jwtAudience: process.env.JWT_AUDIENCE || 'quiztest-web',
  accessTokenTtlSeconds: parseInt(process.env.ACCESS_TOKEN_TTL_SECONDS || '900', 10),
  refreshTokenTtlSeconds: parseInt(process.env.REFRESH_TOKEN_TTL_SECONDS || '604800', 10),
  refreshCookieSecure,
  refreshCookieSameSite,
  emailCodeSecret: resolveEmailCodeSecret(),
  visitorIpHashSecret: resolveVisitorIpHashSecret(),
  emailCodeTtlSeconds: parseInt(process.env.EMAIL_CODE_TTL_SECONDS || '600', 10),
  emailCodeResendSeconds: parseInt(process.env.EMAIL_CODE_RESEND_SECONDS || '60', 10),
  emailCodeMaxAttempts: parseInt(process.env.EMAIL_CODE_MAX_ATTEMPTS || '5', 10),
  smtpHost: process.env.SMTP_HOST || 'smtpdm.aliyun.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '465', 10),
  smtpSecure: parseBoolean(process.env.SMTP_SECURE, true),
  smtpConnectionTimeoutMs: parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || '5000', 10),
  smtpGreetingTimeoutMs: parseInt(process.env.SMTP_GREETING_TIMEOUT_MS || '5000', 10),
  smtpSocketTimeoutMs: parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS || '15000', 10),
  smtpUser: resolveMailValue('SMTP_USER', TRANSACTIONAL_MAIL_ADDRESS),
  smtpPass: resolveMailValue('SMTP_PASS', TRANSACTIONAL_MAIL_ADDRESS),
  mailFrom: resolveMailValue('MAIL_FROM', TRANSACTIONAL_MAIL_ADDRESS),
  bulkSmtpHost: process.env.BULK_SMTP_HOST || process.env.SMTP_HOST || 'smtpdm.aliyun.com',
  bulkSmtpPort: parseInt(process.env.BULK_SMTP_PORT || process.env.SMTP_PORT || '465', 10),
  bulkSmtpSecure: parseBoolean(process.env.BULK_SMTP_SECURE ?? process.env.SMTP_SECURE, true),
  bulkSmtpUser: resolveMailValue('BULK_SMTP_USER', BULK_MAIL_ADDRESS),
  bulkSmtpPass: resolveMailValue('BULK_SMTP_PASS', BULK_MAIL_ADDRESS),
  bulkMailFrom: resolveMailValue('BULK_MAIL_FROM', BULK_MAIL_ADDRESS),
  databaseUrl: resolveDatabaseUrl(),
  studyResourceStorageRoot: resolveStudyResourceStorageRoot(),
  mockPaperWorkbookStorageRoot: resolveMockPaperWorkbookStorageRoot(),
  studyResourceMaxFileSizeBytes:
    parsePositiveInteger('STUDY_RESOURCE_MAX_FILE_SIZE_MB', process.env.STUDY_RESOURCE_MAX_FILE_SIZE_MB, 50, {
      min: 1,
      max: 100,
    }) * 1024 * 1024,
  corsOrigins: resolveCorsOrigins(),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY, backendDefaults.trustProxy),
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, ''),
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash',
  chinaums: chinaumsConfig,
  paymentAccess: {
    purchaseAllowedEmails: parsePaymentPurchaseAllowedEmails(
      process.env.PAYMENT_PURCHASE_ALLOWED_EMAILS,
    ),
  },
  paymentLifecycle: paymentLifecycleConfig,
}
