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
  example: { question: string; steps: string[]; answer: string }
  pitfalls: string[]
  check: { question: string; options: string[]; answerIndex: number; explanation: string }
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
}

// 生物先用正文与规则梳理知识，再通过例题推理和变式学习方法。
export interface KnowledgeExamFocus {
  goal: string
  comparison?: { title: string; columns: string[]; rows: string[][] }
  examples: Array<{
    title: string
    source?: { questionCode: string; why: string }
    question: string
    options?: string[]
    answer: string
    steps: string[]
    optionNotes?: string[]
    takeaway: string
    variant: { question: string; answer: string; explanation: string }
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
