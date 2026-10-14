// 旧正常诊断答卷迁入年度新卷：内容严格比对、冻结历史位置、备份计划和事务内无损换引用。
import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import { DIAGNOSTIC_ASSEMBLY, EXAM_TYPE, REAL_PAPER_TYPES } from '../constants/domain.js'
import { formatQuestionDocument } from '../utils/questionDocument.js'
import { parseModuleExamSnapshot } from './moduleExamSession.js'

type Client = typeof prisma | Prisma.TransactionClient
type Row = Record<string, any>
export interface HistoryPaperMapping {
  sourcePaperId: string
  targetPaperId: string
  questions: Array<{ sourceQuestionId: string; questionId: string }>
  examRecordIds: string[]
}
export interface DiagnosticHistoryMigrationPlan {
  version: 2
  papers: HistoryPaperMapping[]
  expiredPaperIds: string[]
  stateHash: string
  backup: Record<string, Row[]>
}

// 日期规范化且对象键无关；所有数组位置和字符串原文参与一致性校验。
function stable(value: any): any {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(stable)
  return value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value
}

// 数据库新旧字段等价性和计划并发保护均使用相同确定性指纹。
export function historyMigrationHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex')
}

// 同源同题可采用新版解析与分类；题干、选项、图片及正确答案必须一致，段落 inline 仅影响排版。
function questionFingerprint(row: Row): string {
  const document = formatQuestionDocument(row)
  const content = { ...row.content, blocks: row.content.blocks.map((block: Row) => {
    if (block.type !== 'paragraph') return block
    const { inline: _inline, ...semanticContent } = block
    return semanticContent
  }) }
  return historyMigrationHash({ title: row.title, examType: row.examType, questionType: row.questionType,
    content, answer: document.solution.answer, source: document.meta.source })
}

// 保留完整前镜像供备份与核验；不读取用户账号、认证会话或其他身份数据。
async function captureState(client: Client, sourceIds: string[], targetIds: string[]) {
  const papers = await client.paper.findMany({ where: { id: { in: sourceIds } }, orderBy: { id: 'asc' } })
  const targets = await client.paper.findMany({ where: { id: { in: targetIds } }, orderBy: { id: 'asc' } })
  const questions = await client.question.findMany({ where: { paperId: { in: [...sourceIds, ...targetIds] } }, orderBy: { id: 'asc' } })
  const sourceQuestionIds = questions.filter(q => sourceIds.includes(q.paperId!)).map(q => q.id)
  const questionIds = questions.map(q => q.id)
  const records = await client.examRecord.findMany({ where: { OR: [{ paperId: { in: sourceIds } }, { answers: { some: { questionId: { in: sourceQuestionIds } } } }] }, orderBy: { id: 'asc' } })
  const recordIds = records.map(r => r.id)
  const [answers, tasks, reports, summaries, favorites, mockLinks] = await Promise.all([
    client.answerRecord.findMany({ where: { examRecordId: { in: recordIds } }, orderBy: { id: 'asc' } }),
    client.diagnosticReportTask.findMany({ where: { examRecordId: { in: recordIds } }, orderBy: { id: 'asc' } }),
    client.diagnosticReport.findMany({ where: { examRecordId: { in: recordIds } }, orderBy: { id: 'asc' } }),
    client.wrongQuestionSummary.findMany({ where: { questionId: { in: questionIds } }, orderBy: { id: 'asc' } }),
    client.questionFavorite.findMany({ where: { questionId: { in: questionIds } }, orderBy: { id: 'asc' } }),
    client.mockPaperQuestion.findMany({ where: { questionId: { in: sourceQuestionIds } }, orderBy: { id: 'asc' } }),
  ])
  const wrongAttempts = await client.wrongQuestionAttempt.findMany({ where: { OR: [{ questionId: { in: questionIds } }, { summaryId: { in: summaries.map(s => s.id) } }] }, orderBy: { id: 'asc' } })
  return { papers, targets, questions, records, answers, tasks, reports, summaries, favorites, mockLinks, wrongAttempts } as Record<string, Row[]>
}

// 只替换结构中的身份值与身份键，不替换报告正文中的文本片段。
function mapIdentifiers(value: any, ids: Map<string, string>): any {
  if (typeof value === 'string') return ids.get(value) ?? value
  if (Array.isArray(value)) return value.map(item => mapIdentifiers(item, ids))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [ids.get(key) ?? key, mapIdentifiers(item, ids)]))
  return value
}

// 已有位置必须完整且唯一；仅完全缺失位置的旧答卷按原试卷顺序补齐。
function orderedAnswers(record: Row, answers: Row[], questions: Row[]): Row[] {
  if (answers.length !== record.totalQuestions) throw new Error(`${record.id}: 答案行数与原答卷题量不一致`)
  const numbered = answers.filter(a => Number.isInteger(a.position))
  if (numbered.length && (numbered.length !== answers.length || new Set(numbered.map(a => a.position)).size !== answers.length)) throw new Error(`${record.id}: 原答卷位置不完整或重复`)
  const questionMap = new Map(questions.map(q => [q.id, q]))
  if (numbered.length) return [...answers].sort((a, b) => a.position - b.position)
  return [...answers].sort((a, b) => (questionMap.get(a.questionId)?.number ?? 0) - (questionMap.get(b.questionId)?.number ?? 0))
}

// 连续旧考试不改变计时方式；模块考试仅重映射原快照，额外保存原显示位置供历史读取。
function migratedSnapshot(record: Row, source: Row, mapping: HistoryPaperMapping, state: Record<string, Row[]>) {
  const ids = new Map(mapping.questions.map(q => [q.sourceQuestionId, q.questionId]))
  const original = record.structureSnapshot
  if (original !== null && (typeof original !== 'object' || Array.isArray(original))) throw new Error(`${record.id}: structureSnapshot 不是有效对象`)
  const snapshot = parseModuleExamSnapshot(original)
  if (source.deliveryMode === 'module_sequence' && !snapshot) throw new Error(`${record.id}: 缺少原分段快照，不能猜测历史科目`)
  const answers = orderedAnswers(record, state.answers.filter(a => a.examRecordId === record.id), state.questions)
  if (answers.some(a => !ids.has(a.questionId))) throw new Error(`${record.id}: 答卷包含其他试卷的题目`)
  if (snapshot) {
    const snapshotIds = snapshot.modules.flatMap(m => m.questionIds)
    if (snapshotIds.length !== answers.length || new Set(snapshotIds).size !== snapshotIds.length || snapshotIds.some(id => !answers.some(a => a.questionId === id))) throw new Error(`${record.id}: 原快照与答案引用不一致`)
  }
  const questions = answers.map((answer, index) => {
    const q = state.questions.find(row => row.id === answer.questionId)!
    const module = snapshot?.modules.find(m => m.questionIds.includes(q.id))
    return { sourceQuestionId: q.id, questionId: ids.get(q.id)!, number: q.number ?? index + 1,
      moduleCode: module?.code ?? q.moduleCode, moduleOrder: module?.order ?? q.moduleOrder,
      moduleQuestionNumber: module ? module.questionIds.indexOf(q.id) + 1 : q.moduleQuestionNumber }
  })
  const modules = snapshot?.modules ?? (Array.isArray(source.moduleConfig) ? source.moduleConfig.map((m: Row) => ({ ...m, questionIds: questions.filter(q => q.moduleCode === m.code).map(q => q.sourceQuestionId) })) : [])
  return {
    ...(mapIdentifiers(original ?? {}, ids)),
    diagnosticHistory: {
      version: 1,
      sourcePaper: { id: source.id, title: source.title, code: source.code, year: source.year, duration: source.duration, deliveryMode: source.deliveryMode },
      questions,
      modules: mapIdentifiers(modules, ids),
    },
  }
}

// 合并目标唯一键前检查收藏分类，任何分类歧义都拒绝迁移，避免静默覆盖用户管理信息。
function validateRelatedReferences(state: Record<string, Row[]>, papers: HistoryPaperMapping[]) {
  const ids = new Map(papers.flatMap(p => p.questions.map(q => [q.sourceQuestionId, q.questionId] as const)))
  const paperIds = new Set(papers.map(p => p.sourcePaperId))
  for (const answer of state.answers.filter(a => ids.has(a.questionId))) {
    const record = state.records.find(r => r.id === answer.examRecordId)!
    if (!paperIds.has(record.paperId)) throw new Error('旧正常诊断题被其他业务答卷引用，必须先单独核对')
  }
  const categories = new Map<string, string | null>()
  for (const favorite of state.favorites) {
    const key = `${favorite.userId}:${ids.get(favorite.questionId) ?? favorite.questionId}`
    if (categories.has(key) && categories.get(key) !== favorite.categoryId) throw new Error('同题收藏具有不同分类，停止迁移以保留用户分类')
    categories.set(key, favorite.categoryId)
  }
}

// 应用外部保存的计划时重新验证映射清单，防止只修改目标 ID 而保留前镜像指纹绕过内容校验。
function validateSavedPlan(plan: DiagnosticHistoryMigrationPlan) {
  if (plan.version !== 2 || historyMigrationHash(plan.backup) !== plan.stateHash) throw new Error('迁移计划损坏或版本过旧，请重新预检')
  const originals = plan.backup.papers
  const expectedNormal = originals.filter(p => p.status === 'published').map(p => p.id).sort()
  const expectedExpired = originals.filter(p => p.status === 'archived').map(p => p.id).sort()
  if (historyMigrationHash(expectedNormal) !== historyMigrationHash(plan.papers.map(p => p.sourcePaperId).sort())
    || historyMigrationHash(expectedExpired) !== historyMigrationHash([...plan.expiredPaperIds].sort())) throw new Error('迁移计划卷范围已改变')
  for (const mapping of plan.papers) {
    const source = originals.find(p => p.id === mapping.sourcePaperId)!
    const target = plan.backup.targets.find(p => p.id === mapping.targetPaperId)
    if (!target || source.examType !== target.examType || source.year !== target.year || target.assemblyType !== DIAGNOSTIC_ASSEMBLY.ANNUAL || target.status !== 'published') throw new Error('迁移目标年度卷无效')
    const originalQuestions = plan.backup.questions.filter(q => q.paperId === source.id)
    if (historyMigrationHash(originalQuestions.map(q => q.id).sort()) !== historyMigrationHash(mapping.questions.map(q => q.sourceQuestionId).sort())
      || new Set(mapping.questions.map(q => q.questionId)).size !== mapping.questions.length) throw new Error('迁移题目映射缺失或重复')
    for (const item of mapping.questions) {
      const old = originalQuestions.find(q => q.id === item.sourceQuestionId)!
      const next = plan.backup.questions.find(q => q.id === item.questionId && q.paperId === target.id)
      if (!next || old.moduleCode !== next.moduleCode || old.moduleQuestionNumber !== next.moduleQuestionNumber || questionFingerprint(old) !== questionFingerprint(next)) throw new Error('迁移题目映射与核验内容不符')
    }
    const recordIds = plan.backup.records.filter(r => r.paperId === source.id).map(r => r.id).sort()
    if (historyMigrationHash(recordIds) !== historyMigrationHash([...mapping.examRecordIds].sort())) throw new Error('迁移答卷清单被修改')
  }
  validateRelatedReferences(plan.backup, plan.papers)
}

// 失效名单必须来自同步/改造前的业务归档审计，当前 archived 状态也可能只是保留历史的技术归档。
export async function createDiagnosticHistoryMigrationPlan(client: Client = prisma, sourcePaperIds?: string[], options: { expiredPaperIds?: string[] } = {}): Promise<DiagnosticHistoryMigrationPlan> {
  const expiredIds = options.expiredPaperIds ?? []
  const sources = await client.paper.findMany({ where: {
    ...(sourcePaperIds ? { id: { in: sourcePaperIds } } : {}),
    paperType: { in: [...REAL_PAPER_TYPES] }, examType: { in: [EXAM_TYPE.ESAT, EXAM_TYPE.TMUA] },
    OR: [{ status: 'published' }, { status: 'archived', id: { in: expiredIds } }],
    assemblyType: { notIn: Object.values(DIAGNOSTIC_ASSEMBLY) },
  }, orderBy: { id: 'asc' } })
  if (expiredIds.some(id => !sources.some(source => source.id === id && source.status === 'archived'))) throw new Error('失效名单必须全部属于本次范围内已核验的归档旧卷')
  const normal = sources.filter(s => s.status === 'published')
  const targets = normal.length ? await client.paper.findMany({ where: {
    paperType: { in: [...REAL_PAPER_TYPES] }, assemblyType: DIAGNOSTIC_ASSEMBLY.ANNUAL, status: 'published',
    OR: normal.map(s => ({ examType: s.examType, year: s.year })),
  }, orderBy: { id: 'asc' } }) : []
  const backup = await captureState(client, sources.map(s => s.id), targets.map(t => t.id))
  const papers = normal.map(source => {
    const candidates = targets.filter(t => t.examType === source.examType && t.year === source.year)
    if (candidates.length !== 1) throw new Error(`${source.examType} ${source.year}: 必须唯一匹配已发布年度卷`)
    const target = candidates[0]
    const oldQuestions = backup.questions.filter(q => q.paperId === source.id)
    const newQuestions = backup.questions.filter(q => q.paperId === target.id)
    if (!oldQuestions.length || oldQuestions.length !== source.totalQuestions) throw new Error(`${source.id}: 原卷题量不完整`)
    const questions = oldQuestions.map(old => {
      if (!old.moduleCode || !Number.isInteger(old.moduleQuestionNumber)) throw new Error(`${old.id}: 缺少科目或科目内题号`)
      const matches = newQuestions.filter(q => q.moduleCode === old.moduleCode && q.moduleQuestionNumber === old.moduleQuestionNumber)
      if (matches.length !== 1 || questionFingerprint(old) !== questionFingerprint(matches[0])) throw new Error(`${source.id}:${old.moduleCode}:${old.moduleQuestionNumber}: 新旧题目内容不一致或匹配不唯一`)
      return { sourceQuestionId: old.id as string, questionId: matches[0].id as string }
    })
    if (new Set(questions.map(q => q.questionId)).size !== questions.length) throw new Error(`${source.id}: 多道原题对应同一道新题`)
    const records = backup.records.filter(r => r.paperId === source.id)
    const plan = { sourcePaperId: source.id, targetPaperId: target.id, questions, examRecordIds: records.map(r => r.id as string) }
    for (const record of records) migratedSnapshot(record, source, plan, backup)
    if (backup.tasks.some(t => plan.examRecordIds.includes(t.examRecordId) && ['pending', 'analyzing'].includes(t.status))) throw new Error(`${source.id}: 存在正在生成的报告任务，请完成或暂停任务后迁移`)
    return plan
  })
  validateRelatedReferences(backup, papers)
  return { version: 2, papers, expiredPaperIds: sources.filter(s => s.status === 'archived').map(s => s.id), stateHash: historyMigrationHash(backup), backup }
}

// 相同目标题的错题摘要合并，但每一次错误作答的 ID 和内容保留；收藏分类已在预检确认一致。
async function migrateRelatedReferences(tx: Prisma.TransactionClient, state: Record<string, Row[]>, ids: Map<string, string>) {
  const groups = new Map<string, Row[]>()
  for (const summary of state.summaries) {
    const key = `${summary.userId}:${ids.get(summary.questionId) ?? summary.questionId}`
    groups.set(key, [...(groups.get(key) ?? []), summary])
  }
  for (const summaries of groups.values()) {
    if (!summaries.some(s => ids.has(s.questionId))) continue
    const targetId = ids.get(summaries[0].questionId) ?? summaries[0].questionId
    const survivor = summaries.find(s => s.questionId === targetId) ?? summaries[0]
    const latest = [...summaries].sort((a, b) => b.latestWrongAt.getTime() - a.latestWrongAt.getTime() || b.id.localeCompare(a.id))[0]
    const earliest = [...summaries].sort((a, b) => a.firstWrongAt.getTime() - b.firstWrongAt.getTime())[0]
    const removedAt = summaries.some(s => s.removedAt === null) ? null : new Date(Math.max(...summaries.map(s => s.removedAt.getTime())))
    await tx.wrongQuestionAttempt.updateMany({ where: { summaryId: { in: summaries.map(s => s.id) } }, data: { summaryId: survivor.id, questionId: targetId } })
    await tx.wrongQuestionSummary.deleteMany({ where: { id: { in: summaries.filter(s => s.id !== survivor.id).map(s => s.id) } } })
    await tx.wrongQuestionSummary.update({ where: { id: survivor.id }, data: {
      questionId: targetId, wrongCount: summaries.reduce((n, s) => n + s.wrongCount, 0), firstWrongAt: earliest.firstWrongAt,
      latestWrongAt: latest.latestWrongAt, latestAnswerRecordId: latest.latestAnswerRecordId, latestExamRecordId: latest.latestExamRecordId,
      latestSelectedAnswer: latest.latestSelectedAnswer, latestDurationSeconds: latest.latestDurationSeconds, latestAnsweredAt: latest.latestAnsweredAt,
      latestPaperType: latest.latestPaperType, latestPaperTitle: latest.latestPaperTitle, removedAt,
      createdAt: new Date(Math.min(...summaries.map(s => s.createdAt.getTime()))), updatedAt: new Date(Math.max(...summaries.map(s => s.updatedAt.getTime()))),
    } })
  }
  const favorites = new Map<string, Row[]>()
  for (const favorite of state.favorites) {
    const key = `${favorite.userId}:${ids.get(favorite.questionId) ?? favorite.questionId}`
    favorites.set(key, [...(favorites.get(key) ?? []), favorite])
  }
  for (const items of favorites.values()) {
    if (!items.some(f => ids.has(f.questionId))) continue
    const targetId = ids.get(items[0].questionId) ?? items[0].questionId
    const survivor = [...items].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))[0]
    await tx.questionFavorite.deleteMany({ where: { id: { in: items.filter(f => f.id !== survivor.id).map(f => f.id) } } })
    await tx.questionFavorite.update({ where: { id: survivor.id }, data: { questionId: targetId, updatedAt: survivor.updatedAt } })
  }
  for (const link of state.mockLinks.filter(l => ids.has(l.questionId))) {
    await tx.mockPaperQuestion.update({ where: { id: link.id }, data: { questionId: ids.get(link.questionId), updatedAt: link.updatedAt } })
  }
}

// 全计划单事务换引用，任何并发改动或写后核验失败都会回滚；重复应用同一计划不会重复迁移。
export async function applyDiagnosticHistoryMigrationPlan(plan: DiagnosticHistoryMigrationPlan, client: typeof prisma = prisma) {
  validateSavedPlan(plan)
  const sourceIds = [...plan.papers.map(p => p.sourcePaperId), ...plan.expiredPaperIds]
  return client.$transaction(async tx => {
    const marked = await tx.paper.findMany({ where: { id: { in: sourceIds } }, select: { id: true, assemblyType: true } })
    if (marked.length === sourceIds.length && marked.every(p => p.assemblyType === (plan.expiredPaperIds.includes(p.id) ? DIAGNOSTIC_ASSEMBLY.LEGACY_EXPIRED : DIAGNOSTIC_ASSEMBLY.MIGRATED))) {
      return { migratedPapers: 0, migratedRecords: 0, migratedAnswers: 0, expiredPapers: 0, alreadyApplied: true }
    }
    const state = await captureState(tx, sourceIds, [...new Set(plan.papers.map(p => p.targetPaperId))])
    if (historyMigrationHash(state) !== plan.stateHash) throw new Error('数据库数据已变化，请重新 dry-run；尚未修改任何历史记录')
    const ids = new Map(plan.papers.flatMap(p => p.questions.map(q => [q.sourceQuestionId, q.questionId] as const)))
    let migratedRecords = 0
    let migratedAnswers = 0
    for (const mapping of plan.papers) {
      const source = state.papers.find(p => p.id === mapping.sourcePaperId)!
      for (const record of state.records.filter(r => r.paperId === source.id)) {
        const snapshot = migratedSnapshot(record, source, mapping, state)
        const answers = orderedAnswers(record, state.answers.filter(a => a.examRecordId === record.id), state.questions)
        for (const [index, answer] of answers.entries()) {
          await tx.answerRecord.update({ where: { id: answer.id }, data: { questionId: ids.get(answer.questionId)!, position: answer.position ?? index } })
          migratedAnswers++
        }
        await tx.examRecord.update({ where: { id: record.id }, data: { paperId: mapping.targetPaperId, structureSnapshot: snapshot as Prisma.InputJsonObject } })
        await tx.diagnosticReportTask.updateMany({ where: { examRecordId: record.id }, data: { paperId: mapping.targetPaperId, updatedAt: state.tasks.find(t => t.examRecordId === record.id)?.updatedAt } })
        const report = state.reports.find(r => r.examRecordId === record.id)
        if (report) {
          const reportIds = new Map([...ids, [source.id, mapping.targetPaperId]])
          await tx.diagnosticReport.update({ where: { id: report.id }, data: { paperId: mapping.targetPaperId,
            sourceSnapshot: report.sourceSnapshot == null ? Prisma.DbNull : mapIdentifiers(report.sourceSnapshot, reportIds), updatedAt: report.updatedAt } })
        }
        const saved = await tx.examRecord.findUniqueOrThrow({ where: { id: record.id } })
        if (historyMigrationHash({ ...saved, paperId: record.paperId, structureSnapshot: record.structureSnapshot }) !== historyMigrationHash(record)) throw new Error(`${record.id}: 非引用答卷字段被修改`)
        const savedAnswers = await tx.answerRecord.findMany({ where: { examRecordId: record.id }, orderBy: { id: 'asc' } })
        const expectedAnswers: Row[] = answers.map((a, index): Row => ({ ...a, questionId: ids.get(a.questionId), position: a.position ?? index })).sort((a, b) => a.id.localeCompare(b.id))
        if (historyMigrationHash(savedAnswers) !== historyMigrationHash(expectedAnswers)) throw new Error(`${record.id}: 答案写后核验不一致`)
        migratedRecords++
      }
      await tx.paper.update({ where: { id: source.id }, data: { assemblyType: DIAGNOSTIC_ASSEMBLY.MIGRATED, updatedAt: source.updatedAt } })
    }
    await migrateRelatedReferences(tx, state, ids)
    for (const id of plan.expiredPaperIds) {
      const source = state.papers.find(p => p.id === id)!
      await tx.paper.update({ where: { id }, data: { assemblyType: DIAGNOSTIC_ASSEMBLY.LEGACY_EXPIRED, updatedAt: source.updatedAt } })
    }
    // 报告正文、任务输出与时间均不得因关联迁移改变。
    for (const table of ['diagnosticReport', 'diagnosticReportTask'] as const) {
      const before = table === 'diagnosticReport' ? state.reports : state.tasks
      const query = { where: { id: { in: before.map(r => r.id) } }, orderBy: { id: 'asc' as const } }
      const after = table === 'diagnosticReport' ? await tx.diagnosticReport.findMany(query) : await tx.diagnosticReportTask.findMany(query)
      for (const row of after) {
        const original = before.find(r => r.id === row.id)!
        const normalized = { ...row, paperId: original.paperId, ...('sourceSnapshot' in row ? { sourceSnapshot: original.sourceSnapshot } : {}) }
        if (historyMigrationHash(normalized) !== historyMigrationHash(original)) throw new Error(`${row.id}: 报告正文或任务信息被修改`)
      }
    }
    return { migratedPapers: plan.papers.length, migratedRecords, migratedAnswers, expiredPapers: plan.expiredPaperIds.length, alreadyApplied: false }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 30000, timeout: 180000 })
}
