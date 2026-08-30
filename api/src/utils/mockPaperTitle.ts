// 模考单项标题：名称跟随原始 Sheet 单项，不随加入的目标套卷编号变化。
const MODULE_DISPLAY_LABELS: Record<string, string> = {
  maths1: 'Math1',
  maths2: 'Math2',
  physics: 'Physics',
  biology: 'Biology',
  chemistry: 'Chemistry',
  paper1: 'Paper1',
  paper2: 'Paper2',
}

// 自定义名称优先；默认名称由单项来源考试、模块和原始序号稳定生成。
export function formatMockPaperModuleTitle(input: {
  title?: string | null
  examType: string
  code: string
  label: string
  sequenceNo: number
}): string {
  if (input.title?.trim()) return input.title.trim()
  const displayLabel = MODULE_DISPLAY_LABELS[input.code] || input.label
  return `${input.examType} ${displayLabel} No.${String(input.sequenceNo).padStart(3, '0')}`
}
