// 正常旧诊断历史关联年度新卷：dry-run 固定计划，完整备份后才能 apply；不删除试卷或用户答卷。
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { gzipSync, gunzipSync } from 'node:zlib'
import path from 'node:path'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { createDiagnosticHistoryMigrationPlan, applyDiagnosticHistoryMigrationPlan, type DiagnosticHistoryMigrationPlan } from '../src/services/diagnosticHistoryMigration.js'

// 计划与备份落在私有目录，日志只报告计数；线上须在维护窗口停止作答与报告任务后应用。
async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  if (apply === args.includes('--dry-run')) throw new Error('必须且只能指定 --dry-run 或 --apply')
  const environment = args.find(arg => arg.startsWith('--environment='))?.slice(14)
  if (!environment || environment !== config.runtimeEnv) throw new Error('必须显式指定正确的 --environment=local|test|prod')
  if (environment === 'local' && !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error('local 只允许本地数据库')
  const planArgument = args.find(arg => arg.startsWith('--plan='))?.slice(7)
  if (apply && (!planArgument || !args.includes('--confirm=RELINK_DIAGNOSTIC_HISTORY'))) throw new Error('apply 必须提供 dry-run 的 --plan 路径及 --confirm=RELINK_DIAGNOSTIC_HISTORY')
  const directory = path.resolve('../.private/diagnostic-history-migration')
  await mkdir(directory, { recursive: true })
  if (!apply) {
    const expiredFile = args.find(arg => arg.startsWith('--expired-paper-ids-file='))?.split('=').slice(1).join('=')
    const expiredPaperIds: unknown = expiredFile ? JSON.parse(await readFile(path.resolve(expiredFile), 'utf8')) : []
    if (!Array.isArray(expiredPaperIds) || expiredPaperIds.some(id => typeof id !== 'string' || !id.trim()) || new Set(expiredPaperIds).size !== expiredPaperIds.length) throw new Error('失效名单文件必须是无重复的试卷 ID 字符串数组')
    const plan = await createDiagnosticHistoryMigrationPlan(prisma, undefined, { expiredPaperIds })
    const planFile = path.join(directory, `${Date.now()}-${environment}-plan.json.gz`)
    const payload = { environment, createdAt: new Date().toISOString(), plan }
    await writeFile(planFile, gzipSync(JSON.stringify(payload)), { flag: 'wx' })
    console.log(JSON.stringify({ mode: 'dry-run', environment, planFile, sourcePapers: plan.papers.length,
      mappedQuestions: plan.papers.reduce((n, p) => n + p.questions.length, 0),
      records: plan.papers.reduce((n, p) => n + p.examRecordIds.length, 0),
      answers: plan.backup.answers.filter(a => plan.papers.some(p => p.examRecordIds.includes(a.examRecordId))).length,
      reports: plan.backup.reports.filter(r => plan.papers.some(p => p.examRecordIds.includes(r.examRecordId))).length,
      expiredPapers: plan.expiredPaperIds.length, stateHash: plan.stateHash }, null, 2))
    return
  }
  const payload = JSON.parse(gunzipSync(await readFile(path.resolve(planArgument!))).toString('utf8')) as { environment: string; plan: DiagnosticHistoryMigrationPlan }
  if (payload.environment !== environment) throw new Error('迁移计划环境不匹配')
  // 固定前镜像额外独立备份后才执行；事务内重新计算指纹，任何并发作答都会使旧计划失效。
  const backupFile = path.join(directory, `${Date.now()}-${environment}-before.json.gz`)
  await writeFile(backupFile, gzipSync(JSON.stringify(payload)), { flag: 'wx' })
  const result = await applyDiagnosticHistoryMigrationPlan(payload.plan)
  await writeFile(`${backupFile}.result.json`, JSON.stringify({ completedAt: new Date(), environment, ...result }, null, 2))
  console.log(JSON.stringify({ mode: 'complete', environment, backupFile, ...result }, null, 2))
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 }).finally(async () => { await prisma.$disconnect() })
