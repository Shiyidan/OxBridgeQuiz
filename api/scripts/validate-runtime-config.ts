// 部署前验证目标环境配置、数据库连接与 SMTP 登录，供测试和线上发布流程调用。
import { prisma } from '../src/services/prisma.js'
import { validateRuntimeDependencies } from '../src/services/runtimeValidation.js'

// 仅执行无副作用的依赖检查，任何失败都以非零退出码阻断部署。
async function main(): Promise<void> {
  console.log(JSON.stringify(await validateRuntimeDependencies()))
}

main()
  .catch((error) => {
    console.error('[runtime-validation] failed:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
