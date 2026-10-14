// 只读审计已迁移诊断旧卷的删除依赖，输出固定候选清单，不提供删除入口。
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Prisma } from '@prisma/client'
import { config } from '../src/config.js'
import { prisma } from '../src/services/prisma.js'
import { DIAGNOSTIC_ASSEMBLY, REAL_PAPER_TYPES } from '../src/constants/domain.js'
import { parseDiagnosticHistorySnapshot } from '../src/utils/diagnosticHistorySnapshot.js'

// 仅审计指定环境；数据库使用一致性只读事务，避免多个计数来自不同数据时点。
async function main() {
  const environment = process.argv.find(arg => arg.startsWith('--environment='))?.slice(14)
  assert.equal(environment, config.runtimeEnv, '必须显式指定当前 --environment')
  if (environment === 'local') assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.DATABASE_URL!).hostname))
  const report = await prisma.$transaction(async tx => {
    const papers = await tx.paper.findMany({ where: { paperType: { in: [...REAL_PAPER_TYPES] }, assemblyType: DIAGNOSTIC_ASSEMBLY.MIGRATED },
      select: { id: true, title: true, examType: true, year: true }, orderBy: { id: 'asc' } })
    const paperIds = papers.map(p => p.id)
    const questions = await tx.question.findMany({ where: { paperId: { in: paperIds } }, select: { id: true, paperId: true }, orderBy: { id: 'asc' } })
    const questionIds = questions.map(q => q.id)
    const oldIds = new Set([...paperIds, ...questionIds])
    const dependencies: Array<{ model: string; field: string; onDelete?: string; count: number }> = []
    // 从当前 Prisma 模型枚举关联，防止新增外键未被手写检查覆盖。
    for (const model of Prisma.dmmf.datamodel.models) {
      const delegate = model.name[0]!.toLowerCase() + model.name.slice(1)
      for (const relation of model.fields.filter(f => f.kind === 'object' && ['Paper', 'Question'].includes(f.type) && f.relationFromFields?.length)) {
        for (const field of relation.relationFromFields!) {
          const ids = relation.type === 'Paper' ? paperIds : questionIds
          const count = await (tx as any)[delegate].count({ where: { [field]: { in: ids } } })
          dependencies.push({ model: model.name, field, onDelete: relation.relationOnDelete, count })
        }
      }
    }
    dependencies.push({ model: 'WrongQuestionAttempt', field: 'questionId', count: await tx.wrongQuestionAttempt.count({ where: { questionId: { in: questionIds } } }) })
    const jsonHits: Record<string, number> = {}
    const scanModels = ['ExamRecord', 'DiagnosticReport', 'DiagnosticReportTask', 'DiagnosticSession', 'MockPaperQuestion', 'MockPaperModule', 'MockPaperSet', 'PracticeNotebook', 'Question', 'Paper']
    // JSON 中的旧身份可能只是追溯别名；仅输出路径计数，不输出学生作答或报告正文。
    function scan(value: unknown, location: string) {
      if (typeof value === 'string') {
        if (oldIds.has(value)) jsonHits[location] = (jsonHits[location] ?? 0) + 1
        else if (value.startsWith('{') || value.startsWith('[')) {
          try { scan(JSON.parse(value), location) } catch { /* 非 JSON 正文保留原样 */ }
        } else if (value.includes('questionId=') || value.includes('paperId=')) {
          for (const id of oldIds) if (value.includes(id)) jsonHits[`${location} (embedded link)`] = (jsonHits[`${location} (embedded link)`] ?? 0) + 1
        }
      } else if (Array.isArray(value)) value.forEach(item => scan(item, `${location}[]`))
      else if (value && typeof value === 'object') for (const [key, item] of Object.entries(value)) {
        if (oldIds.has(key)) jsonHits[`${location}.[old ID key]`] = (jsonHits[`${location}.[old ID key]`] ?? 0) + 1
        scan(item, `${location}.${key}`)
      }
    }
    for (const model of Prisma.dmmf.datamodel.models.filter(m => scanModels.includes(m.name))) {
      const fields = model.fields.filter(f => f.type === 'Json').map(f => f.name)
      if (!fields.length) continue
      const delegate = model.name[0]!.toLowerCase() + model.name.slice(1)
      const where = model.name === 'Question' ? { id: { notIn: questionIds } } : model.name === 'Paper' ? { id: { notIn: paperIds } } : {}
      const rows = await (tx as any)[delegate].findMany({ where, select: Object.fromEntries(fields.map(f => [f, true])) })
      for (const row of rows) for (const field of fields) scan(row[field], `${model.name}.${field}`)
    }
    const records = await tx.examRecord.findMany({ include: { paper: { select: { id: true, assemblyType: true } }, answers: { include: { question: { select: { id: true, paperId: true } } } }, diagnosticReport: true, diagnosticReportTask: true } })
    const migrated = records.filter(r => paperIds.includes(parseDiagnosticHistorySnapshot(r.structureSnapshot)?.sourcePaper.id ?? ''))
    for (const record of migrated) {
      const snapshot = parseDiagnosticHistorySnapshot(record.structureSnapshot)!
      assert.equal(record.paper.assemblyType, DIAGNOSTIC_ASSEMBLY.ANNUAL)
      assert.equal(record.answers.length, record.totalQuestions)
      assert.equal(snapshot.questions.length, record.answers.length)
      for (const answer of record.answers) {
        assert.equal(answer.question.paperId, record.paperId)
        assert.ok(snapshot.questions.some(q => q.questionId === answer.questionId && oldIds.has(q.sourceQuestionId)))
      }
      for (const linked of [record.diagnosticReport, record.diagnosticReportTask]) if (linked) assert.equal(linked.paperId, record.paperId)
    }
    return { environment, auditedAt: new Date(), candidates: { papers: papers.length, questions: questions.length }, papers,
      dependencies, jsonHits,
      migrated: { records: migrated.length, answers: migrated.reduce((sum, r) => sum + r.answers.length, 0), reports: migrated.filter(r => r.diagnosticReport).length, tasks: migrated.filter(r => r.diagnosticReportTask).length },
      otherRealPapers: await tx.paper.groupBy({ by: ['assemblyType', 'status'], where: { paperType: { in: [...REAL_PAPER_TYPES] }, id: { notIn: paperIds } }, _count: true }) }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 120000 })
  const directory = path.resolve('../.private/diagnostic-history-cleanup')
  await mkdir(directory, { recursive: true })
  const reportFile = path.join(directory, `${Date.now()}-${environment}-audit.json`)
  await writeFile(reportFile, JSON.stringify(report, null, 2), { flag: 'wx' })
  const { papers: _papers, ...summary } = report
  console.log(JSON.stringify({ ...summary, reportFile }, null, 2))
}

main().catch(error => { console.error(error); process.exitCode = 1 }).finally(async () => { await prisma.$disconnect() })
