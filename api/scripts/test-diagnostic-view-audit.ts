// 诊断查看审计回归：校验考试年份、两类行为隔离及失败结果，不连接数据库。
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { prisma } from '../src/services/prisma.js'
import { diagnosticViewSummary } from '../src/utils/diagnosticAudit.js'
import { operationAuditMiddleware, setOperationAuditContext } from '../src/middleware/operationAudit.js'

const snapshot = {
  diagnosticHistory: {
    version: 1,
    sourcePaper: { id: 'old-paper', title: 'ESAT 2023', year: 2023, duration: 120, deliveryMode: 'continuous' },
    questions: [],
    modules: [],
  },
}
assert.equal(diagnosticViewSummary('ESAT', 2023, null, 'report'), '查看 ESAT 2023 诊断报告')
assert.equal(diagnosticViewSummary('ESAT', 2023, null, 'wrong-questions'), '查看 ESAT 2023 错题记录')
assert.equal(diagnosticViewSummary('TMUA', 2022, null, 'wrong-questions'), '查看 TMUA 2022 错题记录')
assert.equal(diagnosticViewSummary('ESAT', 2026, snapshot, 'report'), '查看 ESAT 2023 诊断报告')
assert.equal(diagnosticViewSummary('ESAT', 2026, JSON.stringify(snapshot), 'wrong-questions'), '查看 ESAT 2023 错题记录')
assert.equal(diagnosticViewSummary('ESAT', undefined, null, 'report'), '查看 ESAT 诊断报告')

const logs: any[] = []
const originalCreate = prisma.operationLog.create
prisma.operationLog.create = (async ({ data }: any) => {
  logs.push(data)
  return data
}) as typeof prisma.operationLog.create

// 模拟真实响应完成事件，经过项目中间件匹配与持久化，不复制其分类规则。
async function respond(path: string, status: number, summary?: string): Promise<any> {
  const before = logs.length
  const req = {
    originalUrl: path,
    method: 'GET',
    requestId: 'audit-test',
    user: { userId: 'student', username: 'test', email: 'test@example.test', role: 'student' },
    ip: '127.0.0.1',
    get: () => 'test',
  } as any
  const res = Object.assign(new EventEmitter(), {
    statusCode: status,
    json: (body: unknown) => body,
  }) as any
  operationAuditMiddleware(req, res, () => {})
  if (summary) setOperationAuditContext(req, { summary, resourceType: 'ExamRecord', resourceId: 'record' })
  res.json(status < 400 ? { success: true } : { success: false, code: 'ANALYSIS_MEMBERSHIP_REQUIRED' })
  res.emit('finish')
  await Promise.resolve()
  assert.ok(logs.length === before || logs.length === before + 1, '一次读取最多产生一条日志')
  return logs.length > before ? logs[before] : undefined
}

try {
  const report = await respond('/api/exams/record/diagnostic-report/summary', 200, diagnosticViewSummary('ESAT', 2023, null, 'report'))
  const wrong = await respond('/api/exams/record/diagnostic-wrong-questions', 200, diagnosticViewSummary('ESAT', 2023, null, 'wrong-questions'))
  assert.equal(report.action, 'diagnostic_report.view')
  assert.equal(wrong.action, 'diagnostic_wrong_questions.view')
  assert.equal(report.summary, '查看 ESAT 2023 诊断报告')
  assert.equal(wrong.summary, '查看 ESAT 2023 错题记录')
  for (const log of [report, wrong]) {
    assert.equal(log.module, 'exam')
    assert.equal(log.resourceId, 'record')
    assert.equal(log.resourceType, 'ExamRecord')
    assert.equal(log.result, 'success')
  }
  for (const status of [400, 401, 403, 404, 409, 410, 500]) {
    assert.equal((await respond('/api/exams/record/diagnostic-wrong-questions', status)).result, 'failure')
  }
  assert.equal(await respond('/api/exams/record/result', 200), undefined)
  assert.equal(await respond('/api/exams/record/review-access', 200), undefined)
  assert.equal(await respond('/api/exams/record/diagnostic-report/status', 200), undefined)
  assert.equal((await respond('/api/exams/record/diagnostic-wrong-questions?year=2099', 200, wrong.summary)).summary, '查看 ESAT 2023 错题记录')
  console.log('PASS diagnostic report/wrong-question audit, snapshot year, single logging and failure isolation')
} finally {
  prisma.operationLog.create = originalCreate
  await prisma.$disconnect()
}
