// 部署前验证目标环境配置、数据库连接与 SMTP 登录，供测试和线上发布流程调用。
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { verifyMailTransport } from '../src/services/mail.js'

// 仅执行无副作用的依赖检查，任何失败都以非零退出码阻断部署。
async function main(): Promise<void> {
  await prisma.user.count()
  await verifyMailTransport()
  const chinaums = config.chinaums.enabled
    ? {
        enabled: true,
        environment: config.chinaums.environment,
        baseHost: new URL(config.chinaums.baseUrl).host,
        merchantId: `${'*'.repeat(Math.max(0, config.chinaums.mid.length - 4))}${config.chinaums.mid.slice(-4)}`,
        notificationHost: config.chinaums.notifyUrl ? new URL(config.chinaums.notifyUrl).host : null,
      }
    : { enabled: false }
  console.log(
    JSON.stringify({
      runtimeEnv: config.runtimeEnv,
      frontendUrl: config.frontendUrl,
      database: 'reachable',
      smtp: 'authenticated',
      chinaums,
      paymentPurchaseAccess: config.paymentAccess.purchaseAllowedEmails.length > 0
        ? {
            mode: 'allowlist',
            allowedAccountCount: config.paymentAccess.purchaseAllowedEmails.length,
          }
        : { mode: 'unrestricted' },
    }),
  )
}

main()
  .catch((error) => {
    console.error('[runtime-validation] failed:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
