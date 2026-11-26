// 图谱双语名称：展示语言与知识点身份分离，搜索同时匹配中英文。
import type { KnowledgeGraphNode, KnowledgeLabelLanguage } from './types'

type NamedKnowledge = Pick<KnowledgeGraphNode, 'title' | 'titleEn'>

// 采用考纲中的完整名称，切换语言不改变节点编号和学习状态。
export function knowledgeLabel(node: NamedKnowledge, language: KnowledgeLabelLanguage): string {
  return language === 'en' ? node.titleEn : node.title
}

// 任意显示语言下均可用中文或英文搜索。
export function matchesKnowledgeLabel(node: NamedKnowledge, query: string): boolean {
  return `${node.title} ${node.titleEn}`
    .toLocaleLowerCase()
    .includes(query.trim().toLocaleLowerCase())
}
