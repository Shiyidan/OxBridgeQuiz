// 验证解析排版维护保留题目身份与判分数据，并拒绝越界、过期和并发更新。
import assert from 'node:assert/strict'
import type { Prisma } from '@prisma/client'
import { syncPaperQuestions } from '../src/utils/questionSync.js'

const original = {
  id: 'question-with-history', paperId: 'paper-with-history', updatedAt: new Date('2026-01-01'),
  content: { blocks: [{ type: 'text', text: 'original stem' }] },
  solution: { answer: ['A'], correctSolution: '4\\pir^2', commonErrorCauses: ['unit error'], solution_trace: { steps: ['original'] } },
}
let row = structuredClone(original)
let writes = 0
let concurrent = false
const tx = { question: {
  findMany: async ({ where }: any) => where.paperId === row.paperId && where.id.in.includes(row.id) ? [structuredClone(row)] : [],
  updateMany: async ({ where, data }: any) => {
    if (concurrent || where.updatedAt.getTime() !== row.updatedAt.getTime()) return { count: 0 }
    writes++
    row = { ...row, solution: structuredClone(data.solution), updatedAt: new Date() }
    return { count: 1 }
  },
} } as unknown as Prisma.TransactionClient
const options = { mode: 'solution-formatting' as const }
const patch = { id: row.id, expectedSolution: structuredClone(row.solution), solution: { ...row.solution, correctSolution: '\\(4\\pi r^2\\)' } }
const ids = await syncPaperQuestions(row.paperId, [patch], tx, options)
assert.deepEqual(ids, [original.id])
assert.equal(row.id, original.id)
assert.deepEqual(row.content, original.content)
assert.deepEqual(row.solution.answer, original.solution.answer)
assert.deepEqual(row.solution.solution_trace, original.solution.solution_trace)
assert.equal(row.solution.correctSolution, patch.solution.correctSolution)
assert.equal(writes, 1)
await assert.rejects(syncPaperQuestions(row.paperId, [patch], tx, options), /解析已变化/)

const current = { id: row.id, expectedSolution: structuredClone(row.solution), solution: structuredClone(row.solution) }
await assert.rejects(syncPaperQuestions('another-paper', [current], tx, options), /不属于/)
await assert.rejects(syncPaperQuestions(row.paperId, [current, current], tx, options), /重复/)
await assert.rejects(syncPaperQuestions(null, [current], tx, options), /必须指定/)
await assert.rejects(syncPaperQuestions(row.paperId, [{ ...current, title: 'changed' }], tx, options), /题目结构/)
await assert.rejects(syncPaperQuestions(row.paperId, [{ ...current, solution: { ...current.solution, answer: ['B'] } }], tx, options), /不能更改答案/)
await assert.rejects(syncPaperQuestions(row.paperId, [{ ...current, solution: { ...current.solution, solution_trace: {} } }], tx, options), /不能更改答案/)
await assert.rejects(syncPaperQuestions(row.paperId, [{ ...current, solution: { ...current.solution, commonErrorCauses: [] } }], tx, options), /条目结构/)
await assert.rejects(syncPaperQuestions(row.paperId, [{ ...current, solution: { ...current.solution, correctSolution: null } }], tx, options), /说明文字/)
assert.equal(writes, 1)
concurrent = true
await assert.rejects(syncPaperQuestions(row.paperId, [current], tx, options), /并发修改/)
assert.equal(writes, 1)
console.log('PASS: solution formatting preserves identities/answers and rejects stale, foreign, structural and concurrent writes')
