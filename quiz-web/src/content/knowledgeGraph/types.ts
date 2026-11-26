// 学习图谱内容契约：章节归属与教学关系分开，个人点亮状态由页面按账号叠加。
export type KnowledgeRelationType = 'prerequisite' | 'application' | 'connection'
export type KnowledgeLabelLanguage = 'zh' | 'en'

export const knowledgeRelationTypes = {
  prerequisite: {
    label: '前置基础',
    directed: true,
    description: '先理解起点所述基础，有助于学习终点；不是访问限制，也不表示掌握起点即可掌握终点。',
  },
  application: {
    label: '方法应用',
    directed: true,
    description: '起点的方法用于终点所述情境，通常不是唯一解法。',
  },
  connection: {
    label: '关联理解',
    directed: false,
    description: '两点适合对照或联系理解，没有强制学习先后。',
  },
} as const

export interface KnowledgeGraphChapter {
  code: string
  title: string
  titleEn: string
}

export interface KnowledgeGraphNode {
  code: string
  title: string
  titleEn: string
  chapterCode: string
}

export interface KnowledgeGraphRelation {
  id: string
  source: string
  target: string
  type: KnowledgeRelationType
  explanation: string
}

export interface KnowledgeGraph {
  examType: 'ESAT' | 'TMUA'
  subjectCode: string
  title: string
  version: number
  chapters: readonly KnowledgeGraphChapter[]
  nodes: readonly KnowledgeGraphNode[]
  relations: readonly KnowledgeGraphRelation[]
}
