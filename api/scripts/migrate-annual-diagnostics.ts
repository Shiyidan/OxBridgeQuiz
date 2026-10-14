// 将旧诊断组合卷无损汇总为年度科目库；只新增年度版本，旧卷旧题及历史记录全部保留。
import { Prisma } from '@prisma/client'
import { createHash } from 'node:crypto'
import { mkdir, open, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { DIAGNOSTIC_ASSEMBLY, EXAM_TYPE, ESAT_MODULES, TMUA_PAPERS, PAPER_TYPE, REAL_PAPER_TYPES, PAPER_ACCESS_TIER } from '../src/constants/domain.js'
import { validateAnnualDocument, ANNUAL_DOCUMENT_FORMAT } from '../src/services/annualDiagnostic.js'
import { formatQuestionDocument, canonicalQuestionToInput } from '../src/utils/questionDocument.js'
import { syncPaperQuestions } from '../src/utils/questionSync.js'
import { createNumericId } from '../src/utils/id.js'

// 对象键序无关，题目数组及内容块顺序属于原内容，必须参与指纹。
function stable(value: any): any {
  return Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])) : value
}

// 模块比较排除各组合卷的身份与位置，正文、解析、分类、来源及扩展全部参与。
function moduleFingerprint(rows: any[]) {
  const normalized = rows.map((row) => {
    const { id, uniqueCode, paperId, number, moduleOrder, moduleQuestionNumber, createdAt, updatedAt, ...content } = row
    return content
  })
  return createHash('sha256').update(JSON.stringify(stable(normalized))).digest('hex')
}

// 维护脚本显式验证目标环境，默认只读；仅在全部年度审计通过后允许追加年度库。
async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  if (apply === args.includes('--dry-run')) throw new Error('必须且只能指定 --dry-run 或 --apply')
  const environment = args.find((arg) => arg.startsWith('--environment='))?.slice(14) || 'local'
  if (environment !== config.runtimeEnv) throw new Error('必须显式指定正确的目标环境')
  if (environment === 'local' && !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) throw new Error('local 只允许本地数据库')
  if (apply && !args.includes('--confirm=CREATE_ANNUAL_DIAGNOSTICS')) throw new Error('缺少 --confirm=CREATE_ANNUAL_DIAGNOSTICS')
  const papers = await prisma.paper.findMany({
    where: { paperType: { in: [...REAL_PAPER_TYPES] }, status: 'published', assemblyType: { notIn: [DIAGNOSTIC_ASSEMBLY.ANNUAL, DIAGNOSTIC_ASSEMBLY.RETIRED] }, examType: { in: [EXAM_TYPE.ESAT, EXAM_TYPE.TMUA] } },
    orderBy: [{ examType: 'asc' }, { year: 'asc' }, { id: 'asc' }],
  })
  const keys = [...new Set(papers.map((paper) => `${paper.examType}:${paper.year}`))]
  const plans: Array<{ key: string; document: ReturnType<typeof validateAnnualDocument>; sourceIds: string[] }> = []
  const skipped: string[] = []
  for (const key of keys) {
    const sources = papers.filter((paper) => `${paper.examType}:${paper.year}` === key)
    const first = sources[0]
    if (await prisma.paper.count({ where: { examType: first.examType, year: first.year, paperType: PAPER_TYPE.REAL_PAPER, assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL } })) { skipped.push(key); continue }
    if (new Set(sources.map((paper) => paper.accessTier)).size !== 1) throw new Error(`${key} 原组合卷访问级别不一致，停止迁移`)
    const modules = new Map<string, { config: any; rows: any[]; fingerprint: string }>()
    for (const paper of sources) {
      const rows = await prisma.question.findMany({ where: { paperId: paper.id }, orderBy: { number: 'asc' } })
      if (!Array.isArray(paper.moduleConfig) || rows.length !== paper.totalQuestions) throw new Error(`${key} 原卷结构不完整`)
      for (const module of paper.moduleConfig as any[]) {
        const moduleRows = rows.filter((q) => q.moduleCode === module.code)
        if (moduleRows.length !== module.questionCount) throw new Error(`${key}:${module.code} 题数不符`)
        const fingerprint = moduleFingerprint(moduleRows)
        const previous = modules.get(module.code)
        if (previous && (previous.fingerprint !== fingerprint || previous.config.durationSeconds !== module.durationSeconds)) throw new Error(`${key}:${module.code} 在不同组合卷中有冲突，停止迁移`)
        if (!previous) modules.set(module.code, { config: module, rows: moduleRows, fingerprint })
      }
    }
    const codes: readonly string[] = first.examType === EXAM_TYPE.ESAT ? ESAT_MODULES : TMUA_PAPERS
    if (modules.size !== codes.length || codes.some((code) => !modules.has(code))) throw new Error(`${key} 缺少完整年度科目`)
    let globalNumber = 0
    const document = validateAnnualDocument({
      format: ANNUAL_DOCUMENT_FORMAT,
      paper: {
        title: `${first.examType} ${first.year} 年诊断测试`, code: `DIAGNOSTIC-${first.examType}-${first.year}`,
        examType: first.examType, year: first.year, accessTier: first.accessTier || PAPER_ACCESS_TIER.MEMBER,
        remarks: first.remarks,
        moduleConfig: codes.map((code, index) => ({ ...modules.get(code)!.config, order: index + 1 })),
      },
      questions: codes.flatMap((code, moduleIndex) => modules.get(code)!.rows.map((row, questionIndex) => {
        const q = formatQuestionDocument(row)
        return { ...q, meta: { ...q.meta, number: ++globalNumber, moduleCode: code, moduleOrder: moduleIndex + 1, moduleQuestionNumber: questionIndex + 1 } }
      })),
    })
    plans.push({ key, document, sourceIds: sources.map((paper) => paper.id) })
  }
  console.log(JSON.stringify({ mode: apply ? 'preflight' : 'dry-run', sourcePapers: papers.length, skipped, years: plans.map((plan) => ({ year: plan.key, questions: plan.document.questions.length, modules: plan.document.paper.moduleConfig.map((module) => ({ code: module.code, count: module.questionCount })) })) }, null, 2))
  if (!apply || !plans.length) return
  const directory = path.resolve('../.private/diagnostic-annual-migration', String(Date.now()))
  await mkdir(directory, { recursive: true })
  const backup = await open(path.join(directory, 'source-papers-and-questions.ndjson.gz'), 'wx')
  try {
    for (const paper of papers) {
      const rows = await prisma.question.findMany({ where: { paperId: paper.id }, orderBy: { number: 'asc' } })
      await backup.writeFile(gzipSync(JSON.stringify({ paper, questions: rows }) + '\n'))
    }
    await backup.sync()
  } finally { await backup.close() }
  const created = []
  for (const plan of plans) {
    const paper = await prisma.$transaction(async (tx) => {
      const id = createNumericId()
      const paper = await tx.paper.create({ data: { id, ...plan.document.paper, moduleConfig: plan.document.paper.moduleConfig as unknown as Prisma.InputJsonValue, paperType: PAPER_TYPE.REAL_PAPER, status: 'published' } })
      await syncPaperQuestions(id, plan.document.questions.map(canonicalQuestionToInput), tx)
      const saved = await tx.question.findMany({ where: { paperId: id }, orderBy: { number: 'asc' } })
      if (saved.length !== plan.document.questions.length) throw new Error(`${plan.key} 写入后题数不符`)
      for (const [index, row] of saved.entries()) {
        const actual = formatQuestionDocument(row)
        const expected = plan.document.questions[index]
        if (JSON.stringify(stable({ content: actual.content, solution: actual.solution, source: actual.meta.source })) !== JSON.stringify(stable({ content: expected.content, solution: expected.solution, source: expected.meta.source }))) throw new Error(`${plan.key} 第${index + 1}题写入内容不一致`)
      }
      return paper
    }, { timeout: 180000 })
    created.push({ key: plan.key, paperId: paper.id, questions: paper.totalQuestions, sourceIds: plan.sourceIds })
    await writeFile(path.join(directory, 'result.json'), JSON.stringify(created, null, 2))
  }
  console.log(JSON.stringify({ mode: 'complete', created, backupDirectory: directory }, null, 2))
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 }).finally(async () => { await prisma.$disconnect() })
