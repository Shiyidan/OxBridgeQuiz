// 部署时保护历史数据，依次回填题目正文和考纲双语字段，验证成功才允许删列。
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const [environment, databaseName, repoApi, artifactApi, runtimeApi, stage] = process.argv.slice(2)
assert.ok(['test', 'prod'].includes(environment))
assert.equal(process.env.API_RUNTIME_ENV, environment)
assert.equal(new URL(process.env.DATABASE_URL).pathname.slice(1), databaseName)
assert.match(stage, /^\/tmp\/quiz-deploy-\d{8}[-_]\d{6}\/question-storage$/)
const cli = path.join(runtimeApi, 'node_modules/.bin/prisma')
const finalSchema = await readFile(path.join(repoApi, 'prisma/schema.prisma'), 'utf8')
const backupDir = `/opt/quiz/backups/question-storage/${path.basename(path.dirname(stage))}`

// Prisma CLI 仅处理结构；数据读取与写入始终使用项目 Prisma 单例。
function command(executable, args, capture = false) {
  return execFileSync(executable, args, { cwd: runtimeApi, env: process.env, encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024, stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit' })
}

// 只读检查数据库实际列，重跑时跳过已经完成的阶段，不依赖运行客户端是否过期。
function actualQuestionFields() {
  const schema = command(cli, ['db', 'pull', '--print', '--schema', path.join(repoApi, 'prisma/schema.prisma')], true)
  const question = schema.match(/model Question \{([\s\S]*?)\n\}/i)?.[1] || ''
  const syllabus = schema.match(/model SyllabusNode \{([\s\S]*?)\n\}/i)?.[1] || ''
  return { legacyMeta: /^\s+attemptPayload\s/m.test(question), legacyContent: /^\s+options\s/m.test(question), legacyLabel: /^\s+label\s/m.test(syllabus) }
}

// 每阶段复制原样迁移的前缀，绝不改写或删减仓库迁移历史。
async function prepare(name, source, cutoff) {
  const dir = path.join(stage, name)
  await mkdir(path.join(dir, 'prisma/migrations'), { recursive: true })
  await mkdir(path.join(dir, 'services'), { recursive: true })
  await writeFile(path.join(dir, 'package.json'), '{"type":"module"}')
  await symlink(path.join(runtimeApi, 'node_modules'), path.join(dir, 'node_modules'), 'dir')
  const schema = source.replace(/provider\s*=\s*"prisma-client-js"/, `provider = "prisma-client-js"\n  output = "${dir}/generated-client"`)
  const schemaPath = path.join(dir, 'prisma/schema.prisma')
  await writeFile(schemaPath, schema)
  for (const entry of await readdir(path.join(repoApi, 'prisma/migrations'), { withFileTypes: true })) {
    if (entry.name === 'migration_lock.toml' || (entry.isDirectory() && (!cutoff || entry.name <= cutoff))) {
      await cp(path.join(repoApi, 'prisma/migrations', entry.name), path.join(dir, 'prisma/migrations', entry.name), { recursive: true })
    }
  }
  await cp(path.join(artifactApi, 'dist/maintenance'), dir, { recursive: true })
  const singleton = await readFile(path.join(repoApi, 'src/services/prisma.ts'), 'utf8')
  await writeFile(path.join(dir, 'services/prisma.js'), singleton.replace("'@prisma/client'", "'../generated-client/index.js'"))
  return { dir, schemaPath }
}

// 在独立输出目录生成阶段客户端，避免覆盖正在服务或仍需回填的旧客户端。
async function clientFor(prepared) {
  command(cli, ['generate', '--schema', prepared.schemaPath])
  const { prisma } = await import(pathToFileURL(path.join(prepared.dir, 'services/prisma.js')).href)
  const { Prisma } = await import(pathToFileURL(path.join(prepared.dir, 'generated-client/index.js')).href)
  return { prisma, Prisma }
}

// 子进程仅运行已构建的正式维护脚本；审计摘要不输出用户答案或身份信息。
function maintain(prepared, name, args) {
  const output = command('node', [path.join(prepared.dir, `${name}.mjs`), ...args], true)
  if (name === 'cleanup-legacy-temporary-practice') {
    const result = JSON.parse(output.slice(output.indexOf('{')))
    console.log(JSON.stringify({ legacyPractice: result.candidateRecords, affectedUsers: result.affectedUsers, byExamType: result.byExamType }))
    assert.equal(result.candidateRecords, 0, '发现旧临时练习；需用户明确批准删除后才能继续，部署器不会自动删除')
  } else console.log(output.trim())
}

// 字段排序消除不同阶段 Client 的对象属性顺序差异，数组与实际值保持原样。
function canonical(value) {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  return value
}

// 只比较迁移前已存在的业务列；题目迁移列另由逐题无损回填校验覆盖。
async function protectedState(client, selects) {
  const hashes = {}
  for (const [delegate, select] of Object.entries(selects)) {
    const rows = await client[delegate].findMany({ select, orderBy: { id: 'asc' } })
    hashes[delegate] = { count: rows.length, hash: createHash('sha256').update(JSON.stringify(canonical(rows))).digest('hex') }
  }
  return hashes
}

const state = actualQuestionFields()
const initial = await prepare('initial', await readFile(path.join(runtimeApi, 'prisma/schema.prisma'), 'utf8'))
const initialClient = await clientFor(initial)
maintain(initial, 'cleanup-legacy-temporary-practice', ['--dry-run'])
if (!Object.values(state).some(Boolean)) {
  await initialClient.prisma.$disconnect()
  console.log('question_storage_stage=already_migrated')
  process.exit(0)
}
const names = ['Paper', 'Question', 'ExamRecord', 'AnswerRecord', 'DiagnosticSession', 'DiagnosticReport', 'DiagnosticReportTask', 'WrongQuestionSummary', 'WrongQuestionAttempt', 'QuestionFavorite', 'PracticeNotebook', 'MockPaperSet', 'MockPaperModule', 'MockPaperQuestion']
const questionMigrated = new Set(['attemptPayload', 'options', 'answer', 'syllabusPoints', 'meta', 'content', 'solution'])
const selects = Object.fromEntries(initialClient.Prisma.dmmf.datamodel.models.filter(model => names.includes(model.name)).map(model => [model.name[0].toLowerCase() + model.name.slice(1), Object.fromEntries(model.fields.filter(field => field.kind !== 'object' && !(model.name === 'Question' && questionMigrated.has(field.name))).map(field => [field.name, true]))]))
// 应用保持停止直至最终构建部署与验证成功；失败不能恢复旧代码写入已迁移结构。
command('pm2', ['stop', 'quiz-api'])
const before = await protectedState(initialClient.prisma, selects)
await mkdir(backupDir, { recursive: true })
await writeFile(path.join(backupDir, 'protected-before.json'), JSON.stringify(before), { mode: 0o600 })
await initialClient.prisma.$disconnect()
if (state.legacyMeta) {
  maintain(initial, 'migrate-question-meta', ['--dry-run', `--environment=${environment}`])
  maintain(initial, 'migrate-question-meta', ['--apply', '--confirm=MERGE_QUESTION_META', `--environment=${environment}`, `--backup-dir=${backupDir}/meta`])
}
if (state.legacyContent) {
  const content = await prepare('content', await readFile(path.join(repoApi, 'prisma/question-content-stage.prisma'), 'utf8'), '20261014020000_add_question_content_solution')
  command(cli, ['migrate', 'deploy', '--schema', content.schemaPath])
  const client = await clientFor(content)
  await client.prisma.$disconnect()
  maintain(content, 'migrate-question-content', ['--dry-run', `--environment=${environment}`])
  maintain(content, 'migrate-question-content', ['--apply', '--confirm=SPLIT_QUESTION_CONTENT', `--environment=${environment}`, `--backup-dir=${backupDir}/content`])
}
if (state.legacyLabel) {
  const bilingualSchema = finalSchema.replace(/(model SyllabusNode \{)/, '$1\n  label String @db.VarChar(512)').replace(/(enLabel|cnLabel)(\s+)String(\s+@db.VarChar\(512\))/g, '$1$2String?$3')
  const labels = await prepare('labels', bilingualSchema, '20261017050000_add_syllabus_bilingual_labels')
  command(cli, ['migrate', 'deploy', '--schema', labels.schemaPath])
  const client = await clientFor(labels)
  await client.prisma.$disconnect()
  maintain(labels, 'migrate-syllabus-labels', ['--dry-run', `--environment=${environment}`])
  maintain(labels, 'migrate-syllabus-labels', ['--apply', '--confirm=SPLIT_SYLLABUS_LABELS', `--environment=${environment}`])
}
const final = await prepare('final', finalSchema)
command(cli, ['migrate', 'deploy', '--schema', final.schemaPath])
const finalClient = await clientFor(final)
try {
  assert.deepEqual(await protectedState(finalClient.prisma, selects), before, '历史记录或题目非迁移字段发生变化')
  command(cli, ['migrate', 'status', '--schema', final.schemaPath])
  await writeFile(path.join(backupDir, 'verified.json'), JSON.stringify({ environment, protected: before, verified: true }), { mode: 0o600 })
  console.log(JSON.stringify({ question_storage_stage: 'verified', protectedCounts: Object.fromEntries(Object.entries(before).map(([name, item]) => [name, item.count])) }))
} finally { await finalClient.prisma.$disconnect() }
