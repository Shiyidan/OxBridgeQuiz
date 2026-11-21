// 诊断查看日志统一使用原试卷年份，迁移后的历史答卷优先读取冻结快照。
import { parseDiagnosticHistorySnapshot } from './diagnosticHistorySnapshot.js'

// 考试与年份均来自服务端答卷，客户端不能通过展示参数改写审计摘要。
export function diagnosticViewSummary(
  examType: string,
  paperYear: number | null | undefined,
  structureSnapshot: unknown,
  kind: 'report' | 'wrong-questions',
): string {
  const year = parseDiagnosticHistorySnapshot(structureSnapshot)?.sourcePaper.year ?? paperYear
  const subject = [examType, year].filter((value) => value !== null && value !== undefined).join(' ')
  return `查看 ${subject} ${kind === 'report' ? '诊断报告' : '错题记录'}`
}
