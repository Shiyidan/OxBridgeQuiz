// 试题库讲解内容：考纲 code 对齐；正文可用 **加粗**、==重点==，标题/标签保持纯文本，公式复用 LatexText。
export interface KnowledgeSource {
  id: string
  title: string
  url: string
  note: string
}

export interface KnowledgeSection {
  code: string
  title: string
  summary: string
  paragraphs: string[]
  rules: Array<{ title: string; text: string }>
  example?: { question: string; steps: string[]; answer: string }
  pitfalls: string[]
  check?: { question: string; options: string[]; answerIndex: number; explanation: string }
  sourceIds: string[]
  examFocus?: KnowledgeExamFocus
  visual?:
    | 'unit-scale'
    | 'number-line'
    | 'bounds'
    | 'eukaryotic-cell'
    | 'prokaryotic-cell'
    | 'organisation'
    | 'membrane-transport'
    | 'cell-division'
    | 'inheritance'
    | 'dna'
    | 'gene-technologies'
    | 'variation'
    | 'enzymes'
    | 'animal-physiology'
    | 'ecosystems'
    | 'plant-physiology'
    | 'atomic-structure'
    | 'periodic-table'
    | 'chemical-reactions'
    | 'quantitative-chemistry'
    | 'redox'
    | 'chemical-bonding'
    | 'group-chemistry'
    | 'separation-techniques'
}

export type KnowledgeExamStage = 'summary' | 'examples' | 'check'

// 科学章节先梳理知识；考法以实际真题为依据，题库仿题不能充当历年证据。
export interface KnowledgeExamFocus {
  goal: string
  pastPaperSummary?: string
  pastPaperPatterns?: Array<{
    form: string
    description: string
    reference: string
    // 保留该考法对应的全部来源编号，供跨年覆盖核验；前台只展示归纳与年份。
    sourceCodes?: string[]
  }>
  pastPaperNote?: string
  comparison?: { title: string; columns: string[]; rows: string[][] }
  examples: Array<{
    title: string
    source?: {
      questionCode: string
      why: string
      subject?: 'biology' | 'chemistry'
      kind?: 'annual' | 'bank'
    }
    question: string
    options?: string[]
    answer: string
    steps: string[]
    optionNotes?: string[]
    takeaway: string
    variant?: { question: string; answer: string; explanation: string }
  }>
  checklist: string[]
}

export interface KnowledgeLesson {
  code: string
  title: string
  subtitle: string
  intro: string
  memory: string[]
  sections: KnowledgeSection[]
  sources: KnowledgeSource[]
}
