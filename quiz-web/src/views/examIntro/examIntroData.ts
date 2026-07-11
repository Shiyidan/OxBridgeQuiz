// 考试介绍内容适配器：将产品提供的 Markdown 原文拆分为概述卡片、FAQ 和对比内容。
import esatMarkdown from '@/content/examIntro/esat.md?raw'
import stepMarkdown from '@/content/examIntro/step.md?raw'
import tmuaMarkdown from '@/content/examIntro/tmua.md?raw'

export type ExamType = 'tmua' | 'esat' | 'step'

export interface MarkdownSection {
  title: string
  markdown: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqGroup {
  title: string
  items: FaqItem[]
}

export interface ExamIntroDocument {
  code: string
  title: string
  subtitle: string
  overview: MarkdownSection[]
  faq: FaqGroup[]
  references: MarkdownSection | null
  comparison: MarkdownSection | null
}

const examMetadata: Record<ExamType, { code: string; title: string; subtitle: string }> = {
  tmua: {
    code: 'TMUA',
    title: 'TMUA 考试深度解析',
    subtitle: '基于官方大纲与历年机考真题提炼的知识框架与备考策略',
  },
  esat: {
    code: 'ESAT',
    title: 'ESAT 考试深度解析',
    subtitle: '基于官方大纲与历年机考真题提炼的知识框架与备考策略',
  },
  step: {
    code: 'STEP',
    title: 'STEP 考试深度解析',
    subtitle: '基于官方大纲与历年考卷提炼的知识框架与备考策略',
  },
}

const sourceDocuments: Record<ExamType, string> = {
  tmua: tmuaMarkdown,
  esat: esatMarkdown,
  step: stepMarkdown,
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/^\s*>\s?/gm, '')
    .replace(/^---\s*$/gm, '')
    .replace(/^\s*\|\s*\*\*(Q\d+：.*?)\*\*\s*\|.*$/gm, '**$1**')
    .replace(/^\s*\|\s*([^|\n]+?)\s*\|\s*(?:\|\s*)+$/gm, '$1')
    .replace(/^ {2}(?=\S)/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractBetween(markdown: string, start: RegExp, end?: RegExp): string {
  const startMatch = start.exec(markdown)
  if (!startMatch || startMatch.index === undefined) return ''

  const contentStart = startMatch.index + startMatch[0].length
  const rest = markdown.slice(contentStart)
  if (!end) return rest.trim()

  const endMatch = end.exec(rest)
  return (endMatch && endMatch.index !== undefined ? rest.slice(0, endMatch.index) : rest).trim()
}

function parseSections(markdown: string): MarkdownSection[] {
  return markdown
    .split(/^###\s+/m)
    .slice(1)
    .map((chunk) => {
      const [heading = '', ...contentLines] = chunk.split('\n')
      return {
        title: heading.replace(/^\d+\.\d+\s+/, '').trim(),
        markdown: normalizeMarkdown(contentLines.join('\n')),
      }
    })
    .filter((section) => section.title && section.markdown)
}

function parseFaqGroups(markdown: string): FaqGroup[] {
  return parseSections(markdown)
    .map((section) => {
      const questionMatches = [...section.markdown.matchAll(/\*\*(Q\d+：[^*\n]+)\*\*/g)]
      const items = questionMatches.map((match, index) => {
        const answerStart = (match.index || 0) + match[0].length
        const answerEnd = questionMatches[index + 1]?.index ?? section.markdown.length
        return {
          question: (match[1] || '').trim(),
          answer: normalizeMarkdown(section.markdown.slice(answerStart, answerEnd)),
        }
      })
      return { title: section.title, items }
    })
    .filter((group) => group.items.length > 0)
}

function buildExamDocument(examType: ExamType): ExamIntroDocument {
  const markdown = sourceDocuments[examType]
  const overviewMarkdown = extractBetween(
    markdown,
    /^##\s+一、考试概述\s*$/m,
    /^##\s+二、常见问题清单\s*$/m,
  )
  const faqMarkdown = extractBetween(
    markdown,
    /^##\s+二、常见问题清单\s*$/m,
    /^##\s+三、官方参考来源汇总\s*$/m,
  )
  const referencesMarkdown = extractBetween(
    markdown,
    /^##\s+三、官方参考来源汇总\s*$/m,
    /^>?#?\s*##\s+四、STEP \/ ESAT \/ TMUA 对比速览\s*$/m,
  )
  const comparisonMarkdown = extractBetween(
    markdown,
    /^>?#?\s*##\s+四、STEP \/ ESAT \/ TMUA 对比速览\s*$/m,
  )

  return {
    ...examMetadata[examType],
    overview: parseSections(overviewMarkdown),
    faq: parseFaqGroups(faqMarkdown),
    references: referencesMarkdown
      ? { title: '官方参考来源汇总', markdown: normalizeMarkdown(referencesMarkdown) }
      : null,
    comparison: comparisonMarkdown
      ? { title: 'STEP / ESAT / TMUA 对比速览', markdown: normalizeMarkdown(comparisonMarkdown) }
      : null,
  }
}

export const examIntroData: Record<ExamType, ExamIntroDocument> = {
  tmua: buildExamDocument('tmua'),
  esat: buildExamDocument('esat'),
  step: buildExamDocument('step'),
}

export const isExamType = (value: string): value is ExamType =>
  value === 'tmua' || value === 'esat' || value === 'step'
