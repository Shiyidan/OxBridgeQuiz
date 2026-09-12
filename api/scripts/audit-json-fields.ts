// 仅审计 api/.env 指向的本地数据库 JSON 格式，输出脱敏报告，不修改业务数据。
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { Prisma } from '@prisma/client'

type JsonKind = 'array' | 'object' | 'null' | 'string' | 'scalar'
type Expected = 'array' | 'object' | 'container' | 'unknown'
type Finding = { path: string; classification: string }
type FieldSpec = { name: string; required: boolean; expected: Expected }
type ModelSpec = { name: string; fields: FieldSpec[] }
type FieldReport = {
  required: boolean
  expected: Expected
  types: Record<JsonKind, number>
  stringDecoding: Record<string, number>
  affectedRows: number
  findings: Record<string, number>
  samples: Array<Finding & { id: string }>
}
type ModelReport = { rows: number; complete: boolean; fields: Record<string, FieldReport> }
type AuditReport = {
  status: 'running' | 'complete' | 'partial'
  startedAt: string
  completedAt?: string
  environment?: { runtime: 'local'; host: string; port: string; database: string }
  coverage: { schemaFields: string[]; clientFields: string[]; matched: boolean }
  limits: string[]
  models: Record<string, ModelReport>
  errors: Array<{ code: string; location: string }>
}
type ReadDelegate = {
  findMany(args: {
    select: Record<string, boolean>
    orderBy: { id: 'asc' }
    take: number
    cursor?: { id: string }
    skip?: number
  }): Promise<Array<Record<string, unknown> & { id: string }>>
}

const API_ROOT = fileURLToPath(new URL('..', import.meta.url))
const DEFAULT_REPORT = path.resolve(API_ROOT, '../.private/audits/local-json/latest.json')
const EXPECTATIONS: Record<string, Expected> = {
  'Paper.moduleConfig': 'array',
  'Paper.sourceExamTypes': 'array',
  'Paper.questions': 'array',
  'Question.options': 'array',
  'Question.answer': 'array',
  'Question.knowledgePoints': 'array',
  'Question.syllabusPoints': 'array',
  'Question.attemptPayload': 'object',
  'Question.meta': 'object',
  'MockPaperSet.issues': 'array',
  'MockPaperModule.issues': 'array',
  'MockPaperQuestion.issues': 'array',
  'ParseTask.result': 'object',
  'User.examPreferences': 'array',
  'OperationLog.changes': 'object',
  'DiagnosticSession.answers': 'unknown',
  'ExamRecord.structureSnapshot': 'object',
  'ExamRecord.practiceSnapshot': 'object',
  'PracticeNotebook.knowledgePointCodes': 'array',
  'PracticeNotebook.knowledgePointSnapshot': 'array',
  'DiagnosticReportTask.result': 'object',
  'DiagnosticReport.result': 'object',
  'DiagnosticReport.sourceSnapshot': 'object',
  'Syllabus.sourceJson': 'container',
  'PaymentOrder.examTypes': 'array',
  'PaymentOrder.providerPayload': 'object',
  'PaymentRefund.providerPayload': 'object',
  'PaymentNotification.rawPayload': 'object',
  'PaymentReconciliationItem.providerPayload': 'object',
}

// 错误只携带固定分类和模型字段位置，避免输出 Prisma 异常中的参数值。
class AuditError extends Error {
  constructor(readonly code: string, readonly location: string) {
    super(code)
  }
}

// 识别存储的顶层 JSON 类型，不遍历合法的题干、答案或支付文本。
function jsonKind(value: unknown): JsonKind {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') return 'string'
  return 'scalar'
}

// 只对被检查位置的字符串尝试解码，最多三层，并保留失败层数。
function decodeString(value: unknown): { value: unknown; depth: number; outcome: string } {
  let decoded = value
  let depth = 0
  while (typeof decoded === 'string' && depth < 3) {
    try {
      decoded = JSON.parse(decoded) as unknown
      depth += 1
    } catch {
      return { value: decoded, depth, outcome: depth ? 'decoded_text' : 'invalid_json_string' }
    }
  }
  const kind = jsonKind(decoded)
  return {
    value: decoded,
    depth,
    outcome: kind === 'string' ? 'decode_limit' : `decoded_${kind}_depth_${depth}`,
  }
}

// 已知容器字段单独识别旧编码、容器错误和必填空值；未知语义字段仅统计类型。
function inspectContainer(
  value: unknown,
  expected: Expected,
  required: boolean,
  fieldPath: string,
): { decoded: unknown; decoding?: string; findings: Finding[] } {
  const findings: Finding[] = []
  const rawKind = jsonKind(value)
  const decoded = rawKind === 'string' ? decodeString(value) : undefined
  const candidate = decoded ? decoded.value : value
  if (expected === 'unknown') return { decoded: candidate, decoding: decoded?.outcome, findings }

  if (rawKind === 'null') {
    if (required) findings.push({ path: fieldPath, classification: 'required_null' })
    return { decoded: value, findings }
  }
  if (decoded) {
    const kind = jsonKind(decoded.value)
    findings.push({
      path: fieldPath,
      classification: kind === 'array' || kind === 'object'
        ? `legacy_string_encoding_depth_${decoded.depth}`
        : decoded.outcome,
    })
  }
  const kind = jsonKind(candidate)
  if (kind === 'array' || kind === 'object') {
    if (expected !== 'container' && kind !== expected) {
      findings.push({ path: fieldPath, classification: `wrong_container_expected_${expected}` })
    }
  } else if (rawKind !== 'string') {
    findings.push({ path: fieldPath, classification: 'unexpected_scalar' })
  }
  return { decoded: candidate, decoding: decoded?.outcome, findings }
}

// 对代码已依赖的少数内部结构做检查，普通字符串内容不进行递归 JSON 猜测。
function inspectKnownEntries(fieldPath: string, value: unknown): Finding[] {
  const findings: Finding[] = []
  if (jsonKind(value) === 'object') {
    const record = value as Record<string, unknown>
    const nested = fieldPath === 'Question.attemptPayload'
      ? { content_blocks: 'array', images: 'array' } as const
      : fieldPath === 'Question.meta' ? { learning_analysis: 'object' } as const : {}
    for (const [key, expected] of Object.entries(nested)) {
      if (Object.hasOwn(record, key)) {
        findings.push(...inspectContainer(record[key], expected, true, `${fieldPath}.${key}`).findings)
      }
    }
  }
  if (!Array.isArray(value)) return findings
  if (fieldPath === 'PaymentOrder.examTypes' && value.length === 0) {
    findings.push({ path: fieldPath, classification: 'empty_exam_types' })
  }
  for (const [index, entry] of value.entries()) {
    const entryPath = `${fieldPath}[${index}]`
    if (fieldPath === 'Question.options' && jsonKind(entry) !== 'object') {
      findings.push({ path: entryPath, classification: 'option_item_not_object' })
    }
    if ((fieldPath === 'Question.answer' || fieldPath === 'PaymentOrder.examTypes') && typeof entry !== 'string') {
      findings.push({ path: entryPath, classification: 'item_not_string' })
    }
    if (fieldPath === 'User.examPreferences') {
      if (jsonKind(entry) !== 'object') {
        findings.push({ path: entryPath, classification: 'preference_item_not_object' })
      } else if (typeof (entry as Record<string, unknown>).examType !== 'string') {
        findings.push({ path: `${entryPath}.examType`, classification: 'exam_type_not_string' })
      }
    }
  }
  return findings
}

// 汇总只保存数量及有限 ID 样本，不把题目正文、个人信息或支付原文写入文件。
function recordField(report: FieldReport, model: string, field: string, id: string, value: unknown): void {
  report.types[jsonKind(value)] += 1
  const inspected = inspectContainer(value, report.expected, report.required, `${model}.${field}`)
  if (inspected.decoding) {
    report.stringDecoding[inspected.decoding] = (report.stringDecoding[inspected.decoding] ?? 0) + 1
  }
  const findings = [...inspected.findings, ...inspectKnownEntries(`${model}.${field}`, inspected.decoded)]
  if (findings.length) report.affectedRows += 1
  for (const finding of findings) {
    report.findings[finding.classification] = (report.findings[finding.classification] ?? 0) + 1
    if (report.samples.filter((sample) => sample.classification === finding.classification).length < 5) {
      report.samples.push({ id, ...finding })
    }
  }
}

// 以源 schema 的字段及可空性核对生成客户端，防止遗漏尚未生成的 JSON 字段。
async function discoverModels(report: AuditReport): Promise<ModelSpec[]> {
  const source = (await readFile(path.join(API_ROOT, 'prisma/schema.prisma'), 'utf8'))
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
  const schemaFields: string[] = []
  for (const model of source.matchAll(/\bmodel\s+(\w+)\s*\{([\s\S]*?)\}/g)) {
    for (const field of model[2].matchAll(/^\s*(\w+)\s+Json(\?)?(?=\s|$)/gm)) {
      schemaFields.push(`${model[1]}.${field[1]}${field[2] ?? ''}`)
    }
  }
  const models = Prisma.dmmf.datamodel.models
    .filter((model) => model.fields.some((field) => field.type === 'Json'))
    .map((model) => {
      if (!model.fields.some((field) => field.name === 'id' && field.isId && field.type === 'String')) {
        throw new AuditError('UNSUPPORTED_MODEL_ID', model.name)
      }
      return {
        name: model.name,
        fields: model.fields.filter((field) => field.type === 'Json').map((field) => ({
          name: field.name,
          required: field.isRequired,
          expected: EXPECTATIONS[`${model.name}.${field.name}`] ?? 'unknown',
        })),
      }
    })
  const clientFields = models.flatMap((model) => model.fields.map((field) =>
    `${model.name}.${field.name}${field.required ? '' : '?'}`))
  report.coverage = {
    schemaFields: schemaFields.sort(),
    clientFields: clientFields.sort(),
    matched: JSON.stringify(schemaFields.sort()) === JSON.stringify(clientFields.sort()),
  }
  if (!report.coverage.matched || schemaFields.length === 0) {
    throw new AuditError('SCHEMA_CLIENT_JSON_MISMATCH', 'schema.prisma')
  }
  return models
}

// 只接受指定本地文件中的环境与连接串，不允许 shell 或 API_ENV_FILE 把审计切到远程。
async function loadLocalEnvironment(): Promise<NonNullable<AuditReport['environment']>> {
  const values = dotenv.parse(await readFile(path.join(API_ROOT, '.env')))
  if (values.API_RUNTIME_ENV !== 'local') throw new AuditError('LOCAL_RUNTIME_REQUIRED', 'API_RUNTIME_ENV')
  if (!values.DATABASE_URL) throw new AuditError('DATABASE_URL_REQUIRED', 'DATABASE_URL')
  let url: URL
  try {
    url = new URL(values.DATABASE_URL)
  } catch {
    throw new AuditError('INVALID_DATABASE_URL', 'DATABASE_URL')
  }
  if (url.protocol !== 'mysql:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new AuditError('LOCAL_MYSQL_REQUIRED', 'DATABASE_URL')
  }
  if (url.searchParams.has('host')) throw new AuditError('HOST_OVERRIDE_FORBIDDEN', 'DATABASE_URL')
  process.env.API_RUNTIME_ENV = values.API_RUNTIME_ENV
  process.env.DATABASE_URL = values.DATABASE_URL
  return { runtime: 'local', host: url.hostname, port: url.port || '3306', database: url.pathname.slice(1) }
}

// 参数错误立即终止，不把拼错的写入参数或环境参数作为有效选项。
function parseOptions(): { selfTest: boolean; reportPath: string } {
  const args = process.argv.slice(2)
  let reportPath = DEFAULT_REPORT
  let selfTest = false
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--self-test') selfTest = true
    else if (args[index] === '--report' && args[index + 1] && !args[index + 1].startsWith('--')) {
      reportPath = path.resolve(args[++index])
    } else throw new AuditError('INVALID_ARGUMENT', 'arguments')
  }
  return { selfTest, reportPath }
}

// 自测只使用内存样例，覆盖旧编码、必填空值及已知条目规则，不加载连接配置。
function selfTest(): void {
  assert.equal(inspectContainer([], 'array', true, 'x').findings.length, 0)
  assert.equal(inspectContainer({}, 'object', true, 'x').findings.length, 0)
  assert.equal(inspectContainer(null, 'array', false, 'x').findings.length, 0)
  assert.equal(inspectContainer(null, 'array', true, 'x').findings[0].classification, 'required_null')
  assert.equal(inspectContainer('[]', 'array', true, 'x').findings[0].classification, 'legacy_string_encoding_depth_1')
  assert.equal(inspectContainer(JSON.stringify('[]'), 'array', true, 'x').findings[0].classification, 'legacy_string_encoding_depth_2')
  assert.equal(inspectContainer('{bad', 'object', true, 'x').findings[0].classification, 'invalid_json_string')
  assert.equal(inspectContainer('[]', 'object', true, 'x').findings[1].classification, 'wrong_container_expected_object')
  assert.equal(inspectContainer(42, 'array', true, 'x').findings[0].classification, 'unexpected_scalar')
  assert.equal(inspectContainer('null', 'object', false, 'x').findings[0].classification, 'decoded_null_depth_1')
  assert.equal(inspectContainer('legacy text', 'unknown', true, 'x').findings.length, 0)
  assert.equal(decodeString(JSON.stringify(JSON.stringify(JSON.stringify('[]')))).outcome, 'decode_limit')
  assert.equal(inspectKnownEntries('Question.meta', { text: '{bad', learning_analysis: {} }).length, 0)
  assert.equal(inspectKnownEntries('Question.attemptPayload', { content_blocks: '[]', images: {} }).length, 2)
  assert.equal(inspectKnownEntries('Question.options', [null, 'A', {}, []]).length, 3)
  assert.equal(inspectKnownEntries('Question.answer', ['[legal answer]', 42]).length, 1)
  assert.equal(inspectKnownEntries('User.examPreferences', [null, {}, { examType: 'ESAT' }]).length, 2)
  assert.equal(inspectKnownEntries('PaymentOrder.examTypes', []).length, 1)
  assert.equal(inspectKnownEntries('PaymentOrder.examTypes', ['ESAT', null]).length, 1)
  console.log('SELF_TEST_OK cases=19 databaseAccess=false')
}

// 字段汇总每行只计一次受影响记录，具体异常计数可能因多个数组条目而更多。
function createFieldReport(field: FieldSpec): FieldReport {
  return {
    required: field.required,
    expected: field.expected,
    types: { array: 0, object: 0, null: 0, string: 0, scalar: 0 },
    stringDecoding: {},
    affectedRows: 0,
    findings: {},
    samples: [],
  }
}

// 仅暴露已知错误码，不输出堆栈、数据库响应、连接字符串或用户输入。
function safeError(error: unknown, location: string): { code: string; location: string } {
  if (error instanceof AuditError) return { code: error.code, location: error.location }
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
  return { code: typeof code === 'string' && /^(P\d{4}|E[A-Z_]+)$/.test(code) ? code : 'AUDIT_FAILED', location }
}

// 按 ID 游标逐批只读全部 JSON 字段；失败保留已完成统计，退出码 2 表示审计不完整。
async function main(): Promise<void> {
  const options = parseOptions()
  if (options.selfTest) return selfTest()
  const report: AuditReport = {
    status: 'running',
    startedAt: new Date().toISOString(),
    coverage: { schemaFields: [], clientFields: [], matched: false },
    limits: [
      '只读本地 api/.env；每批 100 行，仅选择 ID 和 JSON 字段；不修改或清理数据。',
      '按 Prisma 返回值分类；可空字段的 SQL NULL 与 JSON null 均显示为 null，不作错误推断。',
      '只校验已登记的容器和少量内部规则；不代表完整业务 schema、权限、状态或评分验收。',
      'DiagnosticSession.answers 及未来新增的未知语义字段只作类型和字符串解码统计。',
      'Paper.questions 仅作旧版兼容字段审计，不作为官方业务题目来源。',
      '每字段每类异常最多保留 5 个 ID/路径样本；异常计数可能多于受影响行数。',
      '分页扫描未建立数据库快照；并发写入可能影响扫描一致性。',
    ],
    models: {},
    errors: [],
  }
  let currentLocation = 'initialization'
  let prisma: (typeof import('../src/services/prisma.js'))['prisma'] | undefined
  try {
    report.environment = await loadLocalEnvironment()
    const models = await discoverModels(report)
    console.log(`JSON_AUDIT local models=${models.length} fields=${report.coverage.clientFields.length}`)
    // 验证本地连接和 schema 一致后才创建项目唯一 Prisma Client。
    prisma = (await import('../src/services/prisma.js')).prisma
    for (const model of models) {
      currentLocation = `${model.name}.{${model.fields.map((field) => field.name).join(',')}}`
      const modelReport: ModelReport = {
        rows: 0, complete: false,
        fields: Object.fromEntries(model.fields.map((field) => [field.name, createFieldReport(field)])),
      }
      report.models[model.name] = modelReport
      const delegateName = model.name[0].toLowerCase() + model.name.slice(1)
      const delegate = (prisma as unknown as Record<string, ReadDelegate>)[delegateName]
      const select = Object.fromEntries(['id', ...model.fields.map((field) => field.name)].map((name) => [name, true]))
      let cursor: string | undefined
      while (true) {
        const rows = await delegate.findMany({ select, orderBy: { id: 'asc' }, take: 100,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) })
        for (const row of rows) {
          for (const field of model.fields) {
            recordField(modelReport.fields[field.name], model.name, field.name, row.id, row[field.name])
          }
        }
        modelReport.rows += rows.length
        if (rows.length < 100) break
        cursor = rows[rows.length - 1].id
      }
      modelReport.complete = true
      const affected = Object.values(modelReport.fields).reduce((sum, field) => sum + field.affectedRows, 0)
      console.log(`JSON_AUDIT ${model.name} rows=${modelReport.rows} affectedFieldRows=${affected}`)
    }
    report.status = 'complete'
  } catch (error) {
    report.status = 'partial'
    report.errors.push(safeError(error, currentLocation))
  } finally {
    if (prisma) {
      try { await prisma.$disconnect() } catch (error) {
        report.status = 'partial'
        report.errors.push(safeError(error, 'disconnect'))
      }
    }
    report.completedAt = new Date().toISOString()
    await mkdir(path.dirname(options.reportPath), { recursive: true })
    await writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  }
  const affected = Object.values(report.models).some((model) =>
    Object.values(model.fields).some((field) => field.affectedRows > 0))
  process.exitCode = report.status === 'partial' ? 2 : affected ? 1 : 0
  for (const error of report.errors) console.error(`${error.code} ${error.location}`)
  console.log(`JSON_AUDIT status=${report.status} exitCode=${process.exitCode} report=${options.reportPath}`)
}

main().catch((error: unknown) => {
  const failure = safeError(error, 'script')
  console.error(`${failure.code} ${failure.location}`)
  process.exitCode = 2
})
