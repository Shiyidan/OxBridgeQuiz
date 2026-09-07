// 模考旧编号迁移的纯映射与内容核对，供本地回填和部署阶段共用。
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mockPaperNumberPool, type MockPaperSeriesKind } from './mockPaperNumbering.js'

type LegacyModule = {
  id: string; code: string; title: string | null; sourceModuleId: string | null; createdAt: string
  questions: Array<{ id: string; questionId: string | null; sourceCode: string; position: number }>
}
type LegacySet = {
  id: string; code: string; sequenceNo: number; examType: string; title: string; version: number
  deletedAt: string | null; paperId: string | null; createdAt: string; modules: LegacyModule[]
}
type NumberSeries = { id: string; examType: string; kind: MockPaperSeriesKind; moduleCode: string; sequenceNo: number }
export type Snapshot = { sets: LegacySet[]; records: Array<Record<string, unknown>> }

// 相同快照重复预览或执行会得到相同系列 ID，不因重试再次创建编号。
function seriesId(key: string): string {
  return `mock-series-${createHash('sha256').update(key).digest('hex').slice(0, 32)}`
}

// 对 JSON 对象键及带主键的记录数组排序，排除数据库返回顺序对快照核对的影响。
export function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) {
    const rows = value.map(canonical)
    if (rows.every((row) => row && typeof row === 'object' && 'id' in row)) {
      rows.sort((left, right) => String((left as { id: string }).id).localeCompare(String((right as { id: string }).id)))
    }
    return rows
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  }
  return value
}

// 仅抽取不得改变的试卷身份、父关系和题目引用，编号新增字段不参与内容比较。
export function protectedSets(sets: Array<{
  id: string; title: string; paperId: string | null
  modules: Array<{ id: string; code: string; title: string | null; sourceModuleId: string | null; questions: LegacyModule['questions'] }>
}>): unknown {
  return canonical(sets.map((set) => ({
    id: set.id, title: set.title, paperId: set.paperId,
    modules: set.modules.map((module) => ({
      id: module.id, code: module.code, title: module.title, sourceModuleId: module.sourceModuleId,
      questions: module.questions.map((question) => ({ id: question.id, questionId: question.questionId, sourceCode: question.sourceCode, position: question.position })),
    })),
  })))
}

// 旧父序号仅用于已审核的历史归族，后续新增完全由独立编号池分配。
export function buildPlan(snapshot: Snapshot) {
  const series = new Map<string, NumberSeries>()
  const fullGroups = new Map<string, LegacySet[]>()
  for (const set of snapshot.sets) {
    const key = `${set.examType}:${set.code.replace(/-V[1-9]\d*$/i, '')}`
    fullGroups.set(key, [...(fullGroups.get(key) || []), set])
  }
  const sets: Array<{ id: string; seriesId: string | null; versionGroupId: string }> = []
  for (const [key, versions] of fullGroups) {
    const isFull = !key.includes('-RELEASED-') && versions.some((set) => !set.deletedAt || set.modules.length > 1)
    const first = versions[0]!
    const groupId = seriesId(`container:${key}`)
    if (isFull) {
      assert.ok(versions.every((set) => set.sequenceNo === first.sequenceNo), `整卷版本编号冲突：${key}`)
      assert.equal(new Set(versions.map((set) => set.version)).size, versions.length, `整卷版本重复：${key}`)
      series.set(groupId, { id: groupId, examType: first.examType, kind: 'full', moduleCode: '', sequenceNo: first.sequenceNo })
    }
    for (const set of versions) sets.push({ id: set.id, seriesId: isFull ? groupId : null, versionGroupId: groupId })
  }
  const modules: Array<{ id: string; seriesId: string | null; version: number | null }> = []
  const usedVersions = new Set<string>()
  for (const set of snapshot.sets) {
    for (const module of set.modules) {
      if (module.sourceModuleId) {
        modules.push({ id: module.id, seriesId: null, version: null })
        continue
      }
      const id = seriesId(`single:${set.examType}:${set.sequenceNo}:${module.code}`)
      const versionKey = `${id}:${set.version}`
      assert.ok(!usedVersions.has(versionKey), `单项历史归族冲突，需要人工映射：${set.code}/${module.code}`)
      usedVersions.add(versionKey)
      series.set(id, { id, examType: set.examType, kind: 'single', moduleCode: module.code, sequenceNo: set.sequenceNo })
      modules.push({ id: module.id, seriesId: id, version: set.version })
    }
  }
  const numbers = new Set<string>()
  const counters = new Map<string, number>()
  for (const item of series.values()) {
    assert.ok(Number.isSafeInteger(item.sequenceNo) && item.sequenceNo > 0)
    const pool = mockPaperNumberPool(item.examType, item.kind, item.moduleCode)
    const key = `${pool}:${item.sequenceNo}`
    assert.ok(!numbers.has(key), `编号冲突，需要人工映射：${key}`)
    numbers.add(key)
    counters.set(pool, Math.max(counters.get(pool) || 0, item.sequenceNo))
  }
  return { series: [...series.values()], sets, modules, counters: [...counters].map(([id, lastNumber]) => ({ id, lastNumber })) }
}

