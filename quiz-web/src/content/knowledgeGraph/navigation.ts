// 图谱导航：有向关系区分基础和后续，无向关系只表示相互联系，不推导学习权限。
import { knowledgeRelationTypes } from './types'
import type {
  KnowledgeGraph,
  KnowledgeGraphNode,
  KnowledgeGraphRelation,
  KnowledgeRelationType,
} from './types'

export interface KnowledgeGraphNeighbour {
  node: KnowledgeGraphNode
  relation: KnowledgeGraphRelation
  direction: 'incoming' | 'outgoing' | 'undirected'
}

export interface KnowledgeGraphScope {
  selectedCode?: string
  chapterCode?: string
  types?: readonly KnowledgeRelationType[]
  includeCrossChapter?: boolean
}

// 局部图保留范围内全部真实连线；章节最多扩展一层跨章节点，不推导传递关系。
export function getKnowledgeGraphView(
  graph: KnowledgeGraph,
  scope: KnowledgeGraphScope = {},
): { nodes: KnowledgeGraphNode[]; relations: KnowledgeGraphRelation[] } {
  const allowed = graph.relations.filter((edge) => !scope.types || scope.types.includes(edge.type))
  const seeds = new Set(
    graph.nodes
      .filter((node) =>
        scope.selectedCode
          ? node.code === scope.selectedCode
          : !scope.chapterCode || node.chapterCode === scope.chapterCode,
      )
      .map((node) => node.code),
  )
  const visible = new Set(seeds)
  if (scope.selectedCode || (scope.chapterCode && scope.includeCrossChapter !== false)) {
    for (const edge of allowed) {
      if (seeds.has(edge.source)) visible.add(edge.target)
      if (seeds.has(edge.target)) visible.add(edge.source)
    }
  }
  return {
    nodes: graph.nodes.filter((node) => visible.has(node.code)),
    relations: allowed.filter((edge) => visible.has(edge.source) && visible.has(edge.target)),
  }
}

// 点击节点时只展开直接关联；长链的两个端点不被自动添加为直接关系。
export function getKnowledgeGraphNeighbours(
  graph: KnowledgeGraph,
  code: string,
  types?: readonly KnowledgeRelationType[],
): KnowledgeGraphNeighbour[] {
  const nodes = new Map(graph.nodes.map((node) => [node.code, node]))
  if (!nodes.has(code)) return []
  const result: KnowledgeGraphNeighbour[] = []
  for (const relation of graph.relations) {
    if (types && !types.includes(relation.type)) continue
    if (relation.source !== code && relation.target !== code) continue
    const outgoing = relation.source === code
    const node = nodes.get(outgoing ? relation.target : relation.source)
    if (!node) continue
    result.push({
      node,
      relation,
      direction: knowledgeRelationTypes[relation.type].directed
        ? outgoing
          ? 'outgoing'
          : 'incoming'
        : 'undirected',
    })
  }
  return result
}
