// 一次性旧列迁移：保存全部来源扩展，显式拒绝已有新字段与旧内容冲突。
import { isDeepStrictEqual } from 'node:util'
import { buildQuestionStorage, questionObject, solutionToLearningAnalysis } from '../../src/utils/questionDocument.js'

// 只在迁移入口解析旧字符串 JSON，业务读取不再承担历史容器兼容。
function decode(value: unknown, fallback: unknown): any {
  if (value === null || value === undefined) return fallback
  return typeof value === 'string' ? JSON.parse(value) : value
}

// 原始记录完整保留在备份；合并可重复执行，去重仅限已被知识点覆盖的旧考纲标注。
export function migrateQuestionContent(row: any) {
  const oldMeta = questionObject(decode(row.meta, {}), 'meta')
  const { content_blocks, images, learning_analysis, code, source_examType, year, ...extensions } = oldMeta
  const knowledgePoints = decode(row.knowledgePoints, [])
  const syllabusPoints = decode(row.syllabusPoints, [])
  if (!Array.isArray(syllabusPoints) || !Array.isArray(knowledgePoints)) throw new Error('知识点及考纲必须是数组')
  for (const point of syllabusPoints) {
    if (!knowledgePoints.some((known: any) => known?.code === point?.code && (known?.label ?? known?.name) === (point?.label ?? point?.name))) {
      throw new Error(`旧考纲标注未被 knowledgePoints 覆盖：${JSON.stringify(point)}`)
    }
  }
  // 已迁移行的 meta 已不含正文，恢复旧 meta 需由备份核验；这里只验证可重复执行的数据一致性。
  if (row.content !== null && row.content !== undefined && row.solution !== null && row.solution !== undefined
    && !Object.hasOwn(oldMeta, 'content_blocks') && !Object.hasOwn(oldMeta, 'images') && !Object.hasOwn(oldMeta, 'learning_analysis')) {
    const content = questionObject(row.content, 'content')
    const solution = questionObject(row.solution, 'solution')
    if (!isDeepStrictEqual(content.options, decode(row.options, [])) || !isDeepStrictEqual(solution.answer, decode(row.answer, []))) throw new Error('新旧答案或选项冲突')
    return { content, solution, meta: oldMeta }
  }
  const source = questionObject(extensions.source ?? {}, 'meta.source')
  for (const [key, value] of Object.entries({ questionCode: code, examType: source_examType, year })) {
    if (value !== undefined && source[key] !== undefined && !isDeepStrictEqual(source[key], value)) throw new Error(`meta.source.${key} 冲突`)
  }
  const analysis = questionObject(decode(learning_analysis, {}), 'learning_analysis')
  for (const [oldKey, newKey] of Object.entries({ correct_solution: 'correctSolution', exam_focus: 'examFocus', common_error_causes: 'commonErrorCauses', review_guidance: 'reviewGuidance' })) {
    if (Object.hasOwn(analysis, newKey)) throw new Error(`解析存在潜在命名冲突 ${newKey}`)
  }
  if (Object.hasOwn(analysis, 'answer')) throw new Error('解析中存在 answer 命名冲突')
  const result = buildQuestionStorage({
    content_blocks: decode(content_blocks, []), images: decode(images, []),
    options: decode(row.options, []), answer: decode(row.answer, []), learning_analysis: analysis,
    code, source_examType, year, source, metaExtensions: extensions,
  })
  for (const key of ['content', 'solution'] as const) {
    if (row[key] !== null && row[key] !== undefined && !isDeepStrictEqual(row[key], result[key])) throw new Error(`${key} 新旧字段冲突`)
  }
  if (!isDeepStrictEqual(solutionToLearningAnalysis(result.solution), analysis)) throw new Error('解析往返校验失败')
  return result
}

// 迁移核验恢复旧字段的实际含义，逐项证明答案、题干、资源及未知扩展没有变化。
export function verifyQuestionContent(before: any, after: any): void {
  const expected = migrateQuestionContent({ ...before, content: null, solution: null })
  for (const key of ['content', 'solution', 'meta'] as const) {
    if (!isDeepStrictEqual(expected[key], after[key])) throw new Error(`题目 ${before.id} ${key} 核验失败`)
  }
  for (const [key, value] of Object.entries(before)) {
    if (['content', 'solution', 'meta', 'options', 'answer', 'syllabusPoints'].includes(key)) continue
    if (!isDeepStrictEqual(value, after[key])) throw new Error(`题目 ${before.id} ${key} 被意外修改`)
  }
}
