// 化学章节讲义的共同元数据，供正文、摘要和速记使用同一份内容。
import type { KnowledgeMethodArticle } from './types'

export interface ChemistryMethodLesson extends KnowledgeMethodArticle {
  summary: string
  memory: string[]
}
