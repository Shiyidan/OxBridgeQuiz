// 测试环境年度题库导入：仅新增开发环境已校验年度卷，原卷、原题和用户数据逐表保留。
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { gzipSync, gunzipSync } from 'node:zlib'
import { Prisma } from '@prisma/client'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { validateAnnualDocument } from '../src/services/annualDiagnostic.js'
import { canonicalQuestionToInput, formatQuestionDocument } from '../src/utils/questionDocument.js'
import { syncPaperQuestions } from '../src/utils/questionSync.js'
import { createNumericId } from '../src/utils/id.js'
import { DIAGNOSTIC_ASSEMBLY, PAPER_TYPE, QUESTION_STATUS } from '../src/constants/domain.js'

// JSON 对象键序不影响内容；数组顺序和题目所有正文、解析、来源必须一致。
function stable(value: any): any {
  if (value instanceof Date) return value.toISOString()
  return Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
}

// 哈希只用于验证保护集合，不在输出中暴露个人资料或答题内容。
function digest(value: unknown) {
  return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')
}

// 导入只追加年度题，原有题库、模考及历史数据在同一事务内核验不变。
async function protectedState(tx: Prisma.TransactionClient, paperIds: string[], questionIds: string[]) {
  const hashes: Record<string, string> = {}
  const tables = ['user', 'examRecord', 'answerRecord', 'diagnosticSession', 'diagnosticReport',
    'diagnosticReportTask', 'wrongQuestionSummary', 'wrongQuestionAttempt', 'questionFavorite',
    'mockPaperSet', 'mockPaperModule', 'mockPaperQuestion', 'practiceNotebook'] as const
  for (const table of tables) hashes[table] = digest(await (tx[table] as any).findMany({ orderBy: { id: 'asc' } }))
  hashes.paper = digest(await tx.paper.findMany({ where: { id: { in: paperIds } }, orderBy: { id: 'asc' } }))
  hashes.question = digest(await tx.question.findMany({ where: { id: { in: questionIds } }, orderBy: { id: 'asc' } }))
  return hashes
}

// 只比较可移植文档，目标数据库生成的 ID、编号和管理时间不参与跨环境核验。
function portable(document: ReturnType<typeof formatQuestionDocument>) {
  return { content: document.content, solution: document.solution, source: document.meta.source,
    module: document.meta.moduleCode, number: document.meta.moduleQuestionNumber }
}

// 来源由本地协调脚本通过 SSH 标准输入传入内存，服务端不落临时脚本或数据文件。
async function main() {
  const args = process.argv.slice(2)
  const argument = (name: string) => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
  if (config.runtimeEnv !== 'test' || !argument('database') || decodeURIComponent(new URL(process.env.DATABASE_URL!).pathname.slice(1)) !== argument('database')) throw new Error('目标必须为指定测试数据库')
  const apply = args.includes('--apply')
  if (apply === args.includes('--dry-run')) throw new Error('指定 --dry-run 或 --apply')
  if (apply && !args.includes('--confirm=APPEND_DEVELOPMENT_ANNUAL_DIAGNOSTICS')) throw new Error('缺少追加年度题库确认')
  const snapshot = JSON.parse(gunzipSync(Buffer.from(argument('source-base64') || '', 'base64')).toString('utf8'))
  if (snapshot.environment !== 'local' || !Array.isArray(snapshot.documents) || !snapshot.documents.length) throw new Error('开发环境来源快照无效')
  const documents = snapshot.documents.map(validateAnnualDocument)
  const keys = documents.map((d: any) => `${d.paper.examType}:${d.paper.year}`)
  if (new Set(keys).size !== keys.length) throw new Error('来源年度重复')
  for (const document of documents) for (const q of document.questions) {
    if (q.content.images.some((image: any) => image.type === 'image' && !/^(data:|https:\/\/)/.test(image.src || ''))) throw new Error('存在尚未同步的本地图片文件')
  }
  if (apply) {
    const manifest = argument('backup-manifest') || ''
    if (!/^\/opt\/quiz\/backups\/manifests\/backup_before_deploy_\d{8}_\d{6}\.txt$/.test(manifest)) throw new Error('必须指定部署前完整备份清单')
    await readFile(manifest)
  }
  const directory = `/opt/quiz/backups/annual-development-sync/${Date.now()}`
  if (apply) {
    await mkdir(directory, { recursive: true })
    await writeFile(`${directory}/source.json.gz`, gzipSync(JSON.stringify(snapshot)), { flag: 'wx', mode: 0o600 })
  }
  const result = await prisma.$transaction(async tx => {
    const paperIds = (await tx.paper.findMany({ select: { id: true } })).map(p => p.id)
    const questionIds = (await tx.question.findMany({ select: { id: true } })).map(q => q.id)
    const before = apply ? await protectedState(tx, paperIds, questionIds) : null
    const created: Array<{ year: string; questions: number }> = []
    const skipped: string[] = []
    for (const document of documents) {
      const key = `${document.paper.examType}:${document.paper.year}`
      const existing = await tx.paper.findMany({ where: { examType: document.paper.examType, year: document.paper.year, assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL } })
      if (existing.length) {
        if (existing.length !== 1 || existing[0]!.status !== QUESTION_STATUS.PUBLISHED) throw new Error(`${key} 已有不同状态或重复年度卷`)
        const rows = await tx.question.findMany({ where: { paperId: existing[0]!.id }, orderBy: { number: 'asc' } })
        if (digest(rows.map(row => portable(formatQuestionDocument(row)))) !== digest(document.questions.map(portable))) throw new Error(`${key} 已有年度内容不同，禁止覆盖`)
        skipped.push(key)
        continue
      }
      if (document.paper.code && await tx.paper.count({ where: { code: document.paper.code } })) throw new Error(`${key} 试卷编号冲突`)
      if (apply) {
        const id = createNumericId()
        await tx.paper.create({ data: { ...document.paper, id, moduleConfig: document.paper.moduleConfig as unknown as Prisma.InputJsonValue, paperType: PAPER_TYPE.REAL_PAPER, status: QUESTION_STATUS.PUBLISHED } })
        await syncPaperQuestions(id, document.questions.map(canonicalQuestionToInput), tx)
        const rows = await tx.question.findMany({ where: { paperId: id }, orderBy: { number: 'asc' } })
        if (digest(rows.map(row => portable(formatQuestionDocument(row)))) !== digest(document.questions.map(portable))) throw new Error(`${key} 写入后逐题核验失败`)
      }
      created.push({ year: key, questions: document.questions.length })
    }
    if (apply && digest(before) !== digest(await protectedState(tx, paperIds, questionIds))) throw new Error('原卷、原题或用户数据变化，回滚导入')
    return { mode: apply ? 'complete' : 'dry-run', created, skipped, originalPapers: paperIds.length, originalQuestions: questionIds.length, protectedVerified: apply }
  }, { isolationLevel: 'Serializable', timeout: 180000 })
  if (apply) await writeFile(`${directory}/result.json`, JSON.stringify(result, null, 2), { flag: 'wx' })
  console.log(JSON.stringify(result))
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 }).finally(async () => { await prisma.$disconnect() })
