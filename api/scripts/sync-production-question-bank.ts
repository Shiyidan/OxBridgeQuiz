// 将线上独立试题库只读同步到本地；保留本地题目身份与历史引用，传输和核验均在内存中完成。
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { isDeepStrictEqual } from 'node:util'
import { createHash } from 'node:crypto'
import dotenv from 'dotenv'
import { Prisma } from '@prisma/client'
import { prisma } from '../src/services/prisma.js'
import { mergeLegacyQuestionMeta } from './lib/questionMetaMigration.js'
import { migrateQuestionContent } from './lib/questionContentMigration.js'

type SourceRow = Record<string, any>
type Snapshot = { questions: SourceRow[]; batches: SourceRow[] }
const scalarFields = [
  'uniqueCode', 'sourceQuestionCode', 'importBatchId', 'revisionVersion', 'revisionReason',
  'examType', 'number', 'moduleCode', 'moduleOrder', 'moduleQuestionNumber', 'title',
  'subject', 'subjectCode', 'questionType', 'difficulty', 'qualityTier', 'topic', 'topicCode',
  'status',
] as const

// 线上进程仅持有读取语句；校验服务器身份后压缩返回，避免落盘或暴露连接凭据。
function readProduction(): Snapshot {
  const cfg = dotenv.parse(readFileSync('../.env.deploy.local'))
  for (const key of ['QUIZ_PROD_SSH_HOST', 'QUIZ_PROD_SSH_USER', 'QUIZ_PROD_SSH_KEY', 'QUIZ_PROD_DATABASE']) {
    if (!cfg[key]) throw new Error(`缺少配置 ${key}`)
  }
  const source = `
import dotenv from 'dotenv'; import fs from 'node:fs'; import {gzipSync} from 'node:zlib';
const env=dotenv.parse(fs.readFileSync('/opt/quiz/api/.env'));
if(env.API_RUNTIME_ENV!=='prod'||decodeURIComponent(new URL(env.DATABASE_URL).pathname.slice(1))!==${JSON.stringify(cfg.QUIZ_PROD_DATABASE)}) throw new Error('Production environment mismatch');
Object.assign(process.env,env);
const {prisma}=await import('./dist/services/prisma.js');
try {
  const snapshot=await prisma.$transaction(async tx=>({
    questions:await tx.question.findMany({where:{paperId:null},include:{knowledgePointLinks:{select:{role:true,syllabusNode:{select:{code:true,examType:true}}}}},orderBy:{uniqueCode:'asc'}}),
    batches:await tx.questionImportBatch.findMany({orderBy:{id:'asc'}})
  }),{isolationLevel:'RepeatableRead',timeout:120000});
  process.stdout.write(gzipSync(JSON.stringify(snapshot)).toString('base64'));
} finally {await prisma.$disconnect();}
`
  const result = spawnSync('ssh', [
    '-i', cfg.QUIZ_PROD_SSH_KEY!, '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15',
    `${cfg.QUIZ_PROD_SSH_USER}@${cfg.QUIZ_PROD_SSH_HOST}`,
    'cd /opt/quiz/api && node --input-type=module',
  ], { input: source, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout: 180000 })
  if (result.status !== 0) throw new Error(`线上只读导出失败：${result.error?.message || result.stderr}`)
  return JSON.parse(gunzipSync(Buffer.from(result.stdout.trim(), 'base64')).toString('utf8'))
}

// 复用已有迁移校验将旧线上字段转为当前结构，不在本地恢复已淘汰的列。
function normalize(row: SourceRow): SourceRow {
  let storage: SourceRow
  if (row.content && row.solution) {
    storage = { content: row.content, solution: row.solution, meta: row.meta }
  } else {
    const merged = mergeLegacyQuestionMeta(row.attemptPayload ?? null, row.meta)
    if (merged.conflictKeys.length) throw new Error(`${row.uniqueCode} 存在旧字段冲突`)
    storage = migrateQuestionContent({ ...row, meta: merged.meta })
  }
  for (const key of ['content', 'solution', 'meta']) {
    if (!storage[key] || typeof storage[key] !== 'object' || Array.isArray(storage[key])) {
      throw new Error(`${row.uniqueCode} 的 ${key} 不是结构化对象`)
    }
  }
  const knowledgePoints = typeof row.knowledgePoints === 'string'
    ? JSON.parse(row.knowledgePoints) : row.knowledgePoints
  if (!Array.isArray(knowledgePoints)) throw new Error(`${row.uniqueCode} 知识点格式不正确`)
  return {
    ...Object.fromEntries(scalarFields.map(key => [key, row[key] ?? null])),
    ...storage, knowledgePoints, paperId: null,
    ...Object.fromEntries(['createdAt', 'updatedAt', 'publishedAt', 'archivedAt'].map(key => [key, row[key] ? new Date(row[key]) : null])),
  }
}

// 摘要只用于证明非题库数据未变化，不输出用户答题、报告或个人信息。
function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

// 历史记录、模考引用与非题库试卷作为保护集合，事务提交前逐表比对。
async function protectedDigest(db: Prisma.TransactionClient | typeof prisma) {
  const tables = ['examRecord', 'answerRecord', 'diagnosticReport', 'diagnosticReportTask',
    'wrongQuestionSummary', 'wrongQuestionAttempt', 'questionFavorite', 'mockPaperQuestion', 'practiceNotebook'] as const
  const hashes: Record<string, string> = {}
  for (const table of tables) {
    hashes[table] = digest(await (db[table] as any).findMany({ orderBy: { id: 'asc' } }))
  }
  hashes.papers = digest(await db.paper.findMany({ select: { id: true, updatedAt: true }, orderBy: { id: 'asc' } }))
  hashes.paperQuestions = digest(await db.question.findMany({ where: { paperId: { not: null } }, select: { id: true, updatedAt: true }, orderBy: { id: 'asc' } }))
  return hashes
}

// 只有显式指定本地覆盖才写入；未匹配的本地题目或考纲一律阻止操作，避免隐式删除历史。
async function main() {
  dotenv.config({ path: '.env', quiet: true })
  if (process.env.API_RUNTIME_ENV !== 'local' || !['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname)) {
    throw new Error('目标必须是本地开发数据库')
  }
  const apply = process.argv.includes('--apply')
  if (apply === process.argv.includes('--dry-run')) throw new Error('指定 --dry-run 或 --apply')
  if (apply && !process.argv.includes('--confirm=REPLACE_LOCAL_QUESTION_BANK')) throw new Error('缺少本地覆盖确认参数')
  const source = readProduction()
  if (!source.questions.length || new Set(source.questions.map(row => row.uniqueCode)).size !== source.questions.length) {
    throw new Error('线上题库为空或编号重复')
  }
  const local = await prisma.question.findMany({ where: { paperId: null }, orderBy: { uniqueCode: 'asc' } })
  const byCode = new Map(local.map(row => [row.uniqueCode, row]))
  const sourceCodes = new Set(source.questions.map(row => row.uniqueCode))
  if (local.some(row => !sourceCodes.has(row.uniqueCode))) throw new Error('发现线上没有的本地题目，须另行核对引用后处理')
  const nodes = await prisma.syllabusNode.findMany({ select: { id: true, code: true, examType: true } })
  const nodeIds = new Map(nodes.map(node => [`${node.examType}:${node.code}`, node.id]))
  const ids = new Map(source.questions.map(row => [row.id, byCode.get(row.uniqueCode)?.id || row.id]))
  const prepared = source.questions.map(row => {
    const links = row.knowledgePointLinks.map((link: SourceRow) => {
      const nodeId = nodeIds.get(`${link.syllabusNode.examType}:${link.syllabusNode.code}`)
      if (!nodeId) throw new Error(`本地缺少考纲 ${link.syllabusNode.code}`)
      return { questionId: ids.get(row.id)!, syllabusNodeId: nodeId, role: link.role }
    })
    const replacesQuestionId = row.replacesQuestionId ? ids.get(row.replacesQuestionId) : null
    if (row.replacesQuestionId && !replacesQuestionId) throw new Error('版本链超出独立试题库')
    const data: SourceRow = { ...normalize(row), replacesQuestionId }
    return { id: ids.get(row.id)!, data, links }
  })
  const collisions = await prisma.question.count({ where: { paperId: { not: null }, OR: [
    { id: { in: prepared.map(row => row.id) } }, { uniqueCode: { in: [...sourceCodes] } },
  ] } })
  if (collisions) throw new Error('线上编号与本地试卷题目冲突')
  const images = prepared.flatMap(row => row.data.content.images || [])
  if (images.some(image => image.type === 'image' && !/^(data:|https:\/\/)/.test(image.src || ''))) {
    throw new Error('题库包含本地文件图片，需先制定资源同步方案')
  }
  const changed = prepared.filter(row => {
    const current = byCode.get(row.data.uniqueCode)
    return current && Object.entries(row.data).some(([key, value]) => !isDeepStrictEqual((current as any)[key], value))
  }).length
  console.log(JSON.stringify({ mode: apply ? 'preflight' : 'dry-run', source: source.questions.length,
    existing: local.length, added: prepared.length - local.length, batches: source.batches.length,
    changed, legacyConverted: source.questions.filter(row => !row.content).length, images: images.length }))
  if (!apply) return

  await prisma.$transaction(async tx => {
    const protectedBefore = await protectedDigest(tx)
    if (!isDeepStrictEqual(await tx.question.findMany({ where: { paperId: null }, orderBy: { uniqueCode: 'asc' } }), local)) {
      throw new Error('本地题库在审计后发生变化')
    }
    for (const batch of source.batches) {
      const data = { ...batch, createdAt: new Date(batch.createdAt) }
      await tx.questionImportBatch.upsert({ where: { id: batch.id }, create: data as any, update: data })
    }
    // 先释放并在全量记录就位后恢复版本链，主键始终沿用本地匹配记录。
    await tx.question.updateMany({ where: { paperId: null }, data: { replacesQuestionId: null } })
    for (const row of prepared) {
      const data = { ...row.data, replacesQuestionId: null }
      await tx.question.upsert({ where: { id: row.id }, create: { id: row.id, ...data } as any, update: data })
    }
    for (const row of prepared.filter(row => row.data.replacesQuestionId)) {
      await tx.question.update({ where: { id: row.id }, data: { replacesQuestionId: row.data.replacesQuestionId, updatedAt: row.data.updatedAt } })
    }
    await tx.questionKnowledgePoint.deleteMany({ where: { question: { paperId: null } } })
    const links = prepared.flatMap(row => row.links)
    for (let offset = 0; offset < links.length; offset += 500) {
      await tx.questionKnowledgePoint.createMany({ data: links.slice(offset, offset + 500) })
    }
    const written = await tx.question.findMany({ where: { paperId: null }, include: { knowledgePointLinks: true } })
    const writtenById = new Map(written.map(row => [row.id, row]))
    for (const row of prepared) {
      const actual = writtenById.get(row.id)!
      for (const [field, expected] of Object.entries(row.data)) {
        if (!isDeepStrictEqual((actual as any)[field], expected)) throw new Error(`${row.data.uniqueCode} ${field} 同步核验失败`)
      }
      const sortLinks = (value: SourceRow[]) => value.map(link => `${link.syllabusNodeId}:${link.role}`).sort()
      if (!isDeepStrictEqual(sortLinks(actual.knowledgePointLinks), sortLinks(row.links))) throw new Error('考纲关联核验失败')
    }
    if (written.length !== source.questions.length || !isDeepStrictEqual(protectedBefore, await protectedDigest(tx))) {
      throw new Error('数量或历史保护核验失败，回滚同步')
    }
    console.log(JSON.stringify({ verified: written.length, protectedRecordsUnchanged: true }))
  }, { timeout: 300000, maxWait: 10000, isolationLevel: 'Serializable' })
  console.log('本地试题库同步完成；线上未写入。')
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
  .finally(async () => { await prisma.$disconnect() })
