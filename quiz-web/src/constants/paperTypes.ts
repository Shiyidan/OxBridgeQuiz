// 试卷来源类型：用于区分真题卷、模考卷和 AI 生成卷。
export const PAPER_TYPE = {
  REAL_PAPER: 'realPaper',
  MOCK_PAPER: 'mockPaper',
  AI_PAPER: 'aiPaper',
} as const

export type PaperType = (typeof PAPER_TYPE)[keyof typeof PAPER_TYPE]

export const PAPER_TYPE_OPTIONS = [
  { value: PAPER_TYPE.REAL_PAPER, label: '真题卷' },
  { value: PAPER_TYPE.MOCK_PAPER, label: '模考卷' },
  { value: PAPER_TYPE.AI_PAPER, label: 'AI 生成卷' },
] as const

const paperTypeLabelMap: Record<PaperType, string> = {
  [PAPER_TYPE.REAL_PAPER]: '真题卷',
  [PAPER_TYPE.MOCK_PAPER]: '模考卷',
  [PAPER_TYPE.AI_PAPER]: 'AI 生成卷',
}

const paperTypeSourceLabelMap: Record<PaperType, string> = {
  [PAPER_TYPE.REAL_PAPER]: '来源-真题',
  [PAPER_TYPE.MOCK_PAPER]: '来源-模考',
  [PAPER_TYPE.AI_PAPER]: '来源-AI生成',
}

export function normalizePaperType(value?: string | null): PaperType {
  if (
    value === PAPER_TYPE.REAL_PAPER ||
    value === PAPER_TYPE.MOCK_PAPER ||
    value === PAPER_TYPE.AI_PAPER
  ) {
    return value
  }
  return PAPER_TYPE.REAL_PAPER
}

export function paperTypeLabel(value?: string | null): string {
  return paperTypeLabelMap[normalizePaperType(value)]
}

export function paperTypeSourceLabel(value?: string | null): string {
  return paperTypeSourceLabelMap[normalizePaperType(value)]
}
