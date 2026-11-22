// 考试介绍内容适配器：将产品提供的 Markdown 原文拆分为概述卡片、FAQ 和对比内容。
import esatMarkdown from '@/content/examIntro/esat.md?raw'
import stepMarkdown from '@/content/examIntro/step.md?raw'
import tmuaMarkdown from '@/content/examIntro/tmua.md?raw'
import esatEnglishMarkdown from '@/content/examIntro/esat.en.md?raw'
import stepEnglishMarkdown from '@/content/examIntro/step.en.md?raw'
import tmuaEnglishMarkdown from '@/content/examIntro/tmua.en.md?raw'

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
    title: 'TMUA 考试介绍与备考指南',
    subtitle: '基于官方大纲与历年机考真题提炼的知识框架与备考策略',
  },
  esat: {
    code: 'ESAT',
    title: 'ESAT 考试介绍与备考指南',
    subtitle: '基于官方大纲与历年机考真题提炼的知识框架与备考策略',
  },
  step: {
    code: 'STEP',
    title: 'STEP 考试介绍与备考指南',
    subtitle: '基于官方大纲与历年考卷提炼的知识框架与备考策略',
  },
}

const sourceDocuments: Record<ExamType, string> = {
  tmua: tmuaMarkdown,
  esat: esatMarkdown,
  step: stepMarkdown,
}

const englishSourceDocuments: Record<ExamType, string> = {
  tmua: tmuaEnglishMarkdown,
  esat: esatEnglishMarkdown,
  step: stepEnglishMarkdown,
}

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/^\s*>\s?/gm, '')
    .replace(/^---\s*$/gm, '')
    .replace(/^\s*\|\s*\*\*(Q\d+[：:].*?)\*\*\s*\|.*$/gm, '**$1**')
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
      const questionMatches = [...section.markdown.matchAll(/\*\*(Q\d+[：:][^*\n]+)\*\*/g)]
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

function buildExamDocument(examType: ExamType, english = false): ExamIntroDocument {
  const markdown = (english ? englishSourceDocuments : sourceDocuments)[examType]
  const overviewMarkdown = extractBetween(
    markdown,
    /^##\s+(?:一、考试概述|1\. Exam overview)\s*$/m,
    /^##\s+(?:二、常见问题清单|2\. Frequently asked questions)\s*$/m,
  )
  const faqMarkdown = extractBetween(
    markdown,
    /^##\s+(?:二、常见问题清单|2\. Frequently asked questions)\s*$/m,
    /^##\s+(?:三、官方参考来源汇总|3\. Official references)\s*$/m,
  )
  const referencesMarkdown = extractBetween(
    markdown,
    /^##\s+(?:三、官方参考来源汇总|3\. Official references)\s*$/m,
    /^>?#?\s*##\s+(?:四、STEP \/ ESAT \/ TMUA 对比速览|4\. STEP \/ ESAT \/ TMUA at a glance)\s*$/m,
  )
  const comparisonMarkdown = extractBetween(
    markdown,
    /^>?#?\s*##\s+(?:四、STEP \/ ESAT \/ TMUA 对比速览|4\. STEP \/ ESAT \/ TMUA at a glance)\s*$/m,
  )

  return {
    ...examMetadata[examType],
    ...(english
      ? {
          title: `${examMetadata[examType].code} Exam Guide`,
          subtitle:
            examType === 'step'
              ? 'Understand the syllabus and plan your preparation with guidance drawn from official specifications and past papers.'
              : 'Understand the syllabus and plan your preparation with guidance drawn from official specifications and past computer-based tests.',
        }
      : {}),
    overview: parseSections(overviewMarkdown),
    faq: parseFaqGroups(faqMarkdown),
    references: referencesMarkdown
      ? {
          title: english ? 'Official references' : '官方参考来源汇总',
          markdown: normalizeMarkdown(referencesMarkdown),
        }
      : null,
    comparison: comparisonMarkdown
      ? {
          title: english ? 'STEP / ESAT / TMUA at a glance' : 'STEP / ESAT / TMUA 对比速览',
          markdown: normalizeMarkdown(comparisonMarkdown),
        }
      : null,
  }
}

export const examIntroData: Record<ExamType, ExamIntroDocument> = {
  tmua: buildExamDocument('tmua'),
  esat: buildExamDocument('esat'),
  step: buildExamDocument('step'),
}

// 两种语言共用解析规则，保持卡片、FAQ 分组及对比表的结构一致。
export const examIntroEnglishData: Record<ExamType, ExamIntroDocument> = {
  tmua: buildExamDocument('tmua', true),
  esat: buildExamDocument('esat', true),
  step: buildExamDocument('step', true),
}

export const isExamType = (value: string): value is ExamType =>
  value === 'tmua' || value === 'esat' || value === 'step'
