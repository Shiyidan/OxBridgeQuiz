// 统一执行部署前运行时依赖校验，供本地 TypeScript 脚本与已构建运行目录共同调用。
import { config } from '../config.js'
import { verifyBulkMailTransport, verifyMailTransport } from './mail.js'
import { prisma } from './prisma.js'

export interface RuntimeValidationResult {
  runtimeEnv: string
  frontendUrl: string
  database: 'reachable'
  smtp: 'authenticated'
  bulkSmtp: 'authenticated'
  chinaums: {
    enabled: boolean
    environment?: string
    baseHost?: string
    merchantId?: string
    notificationHost?: string | null
  }
  paymentPurchaseAccess: {
    mode: 'allowlist' | 'unrestricted'
    allowedAccountCount?: number
  }
  paymentLifecycle: {
    enabled: boolean
    pollIntervalMs: number
    batchSize: number
  }
}

/** 验证数据库与 SMTP 等部署必需依赖，并返回不含敏感值的检查摘要。 */
export async function validateRuntimeDependencies(): Promise<RuntimeValidationResult> {
  await prisma.user.count()
  await verifyMailTransport()
  await verifyBulkMailTransport()

  const chinaums = config.chinaums.enabled
    ? {
        enabled: true,
        environment: config.chinaums.environment,
        baseHost: new URL(config.chinaums.baseUrl).host,
        merchantId: `${'*'.repeat(Math.max(0, config.chinaums.mid.length - 4))}${config.chinaums.mid.slice(-4)}`,
        notificationHost: config.chinaums.notifyUrl ? new URL(config.chinaums.notifyUrl).host : null,
      }
    : { enabled: false }

  return {
    runtimeEnv: config.runtimeEnv,
    frontendUrl: config.frontendUrl,
    database: 'reachable',
    smtp: 'authenticated',
    bulkSmtp: 'authenticated',
    chinaums,
    paymentPurchaseAccess: config.paymentAccess.purchaseAllowedEmails.length > 0
      ? {
          mode: 'allowlist',
          allowedAccountCount: config.paymentAccess.purchaseAllowedEmails.length,
        }
      : { mode: 'unrestricted' },
    paymentLifecycle: {
      enabled: config.paymentLifecycle.enabled,
      pollIntervalMs: config.paymentLifecycle.pollIntervalMs,
      batchSize: config.paymentLifecycle.batchSize,
    },
  }
}
