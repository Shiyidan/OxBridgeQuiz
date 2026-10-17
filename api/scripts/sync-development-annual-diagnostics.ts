// 经用户确认后把本地已发布年度诊断卷追加到测试环境；仅内存传输，不复制用户或独立试题库数据。
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { spawnSync } from 'node:child_process'
import dotenv from 'dotenv'
import { build } from 'esbuild'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { ANNUAL_DOCUMENT_FORMAT, validateAnnualDocument } from '../src/services/annualDiagnostic.js'
import { formatQuestionDocument } from '../src/utils/questionDocument.js'
import { DIAGNOSTIC_ASSEMBLY, QUESTION_STATUS } from '../src/constants/domain.js'

// 本地读取一致性快照，远端仍独立检查测试环境和数据库身份后才允许追加。
async function main() {
  if (config.runtimeEnv !== 'local' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error('来源必须为本地开发数据库')
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  if (apply === args.includes('--dry-run')) throw new Error('指定 --dry-run 或 --apply')
  if (apply && !args.includes('--confirm=APPEND_DEVELOPMENT_ANNUAL_DIAGNOSTICS')) throw new Error('缺少用户确认参数')
  const cfg = dotenv.parse(readFileSync('../.env.deploy.local'))
  for (const key of ['QUIZ_TEST_SSH_KEY', 'QUIZ_TEST_SSH_HOST', 'QUIZ_TEST_SSH_USER', 'QUIZ_TEST_DATABASE']) if (!cfg[key]) throw new Error(`缺少 ${key}`)
  if (!/^[A-Za-z0-9.-]+$/.test(cfg.QUIZ_TEST_SSH_HOST!) || !/^[A-Za-z0-9_-]+$/.test(cfg.QUIZ_TEST_SSH_USER!)) throw new Error('测试 SSH 配置无效')
  const documents = await prisma.$transaction(async tx => {
    const papers = await tx.paper.findMany({ where: { assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL, status: QUESTION_STATUS.PUBLISHED }, orderBy: [{ examType: 'asc' }, { year: 'asc' }] })
    const docs = []
    for (const paper of papers) {
      const rows = await tx.question.findMany({ where: { paperId: paper.id }, orderBy: { number: 'asc' } })
      docs.push(validateAnnualDocument({ format: ANNUAL_DOCUMENT_FORMAT, paper, questions: rows.map(formatQuestionDocument) }))
    }
    return docs
  }, { isolationLevel: 'RepeatableRead', timeout: 120000 })
  const bundle = await build({ entryPoints: ['scripts/import-development-annual-diagnostics.ts'], write: false,
    bundle: true, platform: 'node', target: 'node20', format: 'esm', packages: 'external',
    plugins: [{ name: 'runtime-prisma', setup(builder) {
      // 所有业务查询仍复用目标环境的 Prisma 单例，不创建第二个数据库连接配置。
      builder.onResolve({ filter: /prisma\.js$/ }, arg => resolve(arg.resolveDir, arg.path).replaceAll('\\', '/').endsWith('/src/services/prisma.js') ? { path: '/opt/quiz/api/dist/services/prisma.js', external: true } : null)
    } }],
  })
  const payload = gzipSync(JSON.stringify({ environment: 'local', documents })).toString('base64')
  const remoteArgs = ['node', '-', ...args, `--database=${cfg.QUIZ_TEST_DATABASE}`, `--source-base64=${payload}`]
  const input = `process.argv=${JSON.stringify(remoteArgs)};\n${bundle.outputFiles[0]!.text}`
  const result = spawnSync('ssh', ['-i', cfg.QUIZ_TEST_SSH_KEY!, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15',
    `${cfg.QUIZ_TEST_SSH_USER}@${cfg.QUIZ_TEST_SSH_HOST}`, 'cd /opt/quiz/api && API_ENV_FILE=/opt/quiz/api/.env node --input-type=module -'],
  { input, encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 240000 })
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  if (result.status !== 0) throw new Error(`年度同步失败：${result.error?.message || result.status}`)
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 }).finally(async () => { await prisma.$disconnect() })
