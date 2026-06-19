/**
 * 安全解析 Paper.questions JSON 字段。
 * 解析成功返回题目数组，失败时记录日志并返回空数组，避免破损 JSON 导致请求 500。
 */
export function safeParseQuestions(paper: { id: string; questions: string }): any[] {
  try {
    const parsed = JSON.parse(paper.questions)
    return Array.isArray(parsed) ? parsed : []
  } catch (e: any) {
    console.error(`[safeParse] 题目 JSON 解析失败 paperId=${paper.id}`, e.message)
    return []
  }
}
