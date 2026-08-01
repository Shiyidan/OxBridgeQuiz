// 在目标运行目录验证已构建 API 的数据库和 SMTP 依赖，不需要安装 TypeScript 开发依赖。
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const runtimeDir = path.resolve(process.argv[2] || '/opt/quiz/api')
const loadRuntimeModule = async (relativePath) => import(pathToFileURL(path.join(runtimeDir, relativePath)).href)

const { validateRuntimeDependencies } = await loadRuntimeModule('dist/services/runtimeValidation.js')
const { prisma } = await loadRuntimeModule('dist/services/prisma.js')

try {
  console.log(JSON.stringify(await validateRuntimeDependencies()))
} catch (error) {
  console.error('[runtime-validation] failed:', error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
