// 在 Node.js 中恢复题目业务顺序，避免数据库对包含大 JSON 的宽记录执行 filesort。

export interface ModuleOrderedQuestion {
  moduleOrder: number | null
  moduleQuestionNumber: number | null
  number: number | null
  paperId?: string | null
}

// 可空数字升序与 MySQL ASC 语义一致：null 位于有效数字之前。
function compareNullableNumber(left: number | null, right: number | null): number {
  if (left === right) return 0
  if (left === null) return -1
  if (right === null) return 1
  return left - right
}

// 可空字符串升序仅用于跨试卷兜底；同一试卷内通常直接相等。
function compareNullableString(left: string | null, right: string | null): number {
  if (left === right) return 0
  if (left === null) return -1
  if (right === null) return 1
  return left.localeCompare(right)
}

// 诊断报告按模块、模块内题号和正式题号排序，排序仅作用于几十道已读取题目。
export function orderQuestionsByModule<T extends ModuleOrderedQuestion>(rows: T[]): T[] {
  return [...rows].sort((left, right) => (
    compareNullableNumber(left.moduleOrder, right.moduleOrder)
    || compareNullableNumber(left.moduleQuestionNumber, right.moduleQuestionNumber)
    || compareNullableNumber(left.number, right.number)
  ))
}

// 跨来源逐题解析保留原查询中的 paperId 兜底顺序，同时避开数据库宽记录排序。
export function orderQuestionsForResult<T extends ModuleOrderedQuestion>(rows: T[]): T[] {
  return [...rows].sort((left, right) => (
    compareNullableNumber(left.moduleOrder, right.moduleOrder)
    || compareNullableNumber(left.moduleQuestionNumber, right.moduleQuestionNumber)
    || compareNullableString(left.paperId ?? null, right.paperId ?? null)
    || compareNullableNumber(left.number, right.number)
  ))
}

