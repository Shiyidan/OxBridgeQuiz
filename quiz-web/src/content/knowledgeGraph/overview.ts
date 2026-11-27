// 各科图谱共用的分层规则：人工骨干控制可见性，缩放与平移不改变正式关系或节点位置。
import type { KnowledgeGraphNode, KnowledgeGraphRelation } from './types'

export type GraphDetailLevel = 0 | 1 | 2

export const graphDetailLabels: Record<GraphDetailLevel, string> = {
  0: '核心网络',
  1: '方法展开',
  2: '区域细节',
}

interface OverviewConfig {
  coreCodes: readonly string[]
  methodCodes: readonly string[]
  corePairs: readonly (readonly [string, string])[]
  chapterCoreCodes: Readonly<Record<string, readonly string[]>>
}

// 统一使用相同的分层算法，各科只提供经过教学审阅的节点与真实连线名单。
export function createGraphOverview(config: OverviewConfig) {
  const coreCodes = new Set(config.coreCodes)
  const methodCodes = new Set(config.methodCodes)
  const corePairs = new Set(config.corePairs.map((pair) => [...pair].sort().join(':')))

  // 层级只控制总览显示，不改变学习权限及账号进度。
  function nodeDetailLevel(code: string): GraphDetailLevel {
    return coreCodes.has(code) ? 0 : methodCodes.has(code) ? 1 : 2
  }

  // 非骨干关系至少在方法层出现，且不能早于任一端点。
  function edgeDetailLevel(source: string, target: string): GraphDetailLevel {
    if (corePairs.has([source, target].sort().join(':'))) return 0
    return Math.max(1, nodeDetailLevel(source), nodeDetailLevel(target)) as GraphDetailLevel
  }

  // 章节保留本章核心和至多三个直接相连的跨章核心，其余按层级逐步展开。
  function scopeDetailLevels(
    nodes: readonly KnowledgeGraphNode[],
    relations: readonly KnowledgeGraphRelation[],
    chapterCode = '',
  ) {
    const chapterCores = new Set(config.chapterCoreCodes[chapterCode] || [])
    const byCode = new Map(nodes.map((node) => [node.code, node]))
    const crossCores = new Set<string>()
    if (chapterCores.size) {
      const candidates = [...relations].sort(
        (a, b) =>
          edgeDetailLevel(a.source, a.target) - edgeDetailLevel(b.source, b.target) ||
          a.id.localeCompare(b.id),
      )
      for (const edge of candidates) {
        const other = chapterCores.has(edge.source)
          ? edge.target
          : chapterCores.has(edge.target)
            ? edge.source
            : ''
        if (coreCodes.has(other) && byCode.get(other)?.chapterCode !== chapterCode)
          crossCores.add(other)
        if (crossCores.size === 3) break
      }
    }
    const nodeLevels = new Map<string, GraphDetailLevel>(
      nodes.map((node) => [
        node.code,
        chapterCores.size
          ? chapterCores.has(node.code) || crossCores.has(node.code)
            ? 0
            : (Math.max(1, nodeDetailLevel(node.code)) as GraphDetailLevel)
          : nodeDetailLevel(node.code),
      ]),
    )
    const edgeLevels = new Map<string, GraphDetailLevel>(
      relations.map((edge) => [
        edge.id,
        chapterCores.size
          ? (Math.max(
              nodeLevels.get(edge.source) ?? 2,
              nodeLevels.get(edge.target) ?? 2,
            ) as GraphDetailLevel)
          : edgeDetailLevel(edge.source, edge.target),
      ]),
    )
    return { nodeLevels, edgeLevels }
  }

  return { nodeDetailLevel, edgeDetailLevel, scopeDetailLevels }
}

// 展开和收起采用不同阈值，避免临界缩放闪烁；大幅缩放可直接跨层。
export function graphDetailLevelForZoom(
  zoom: number,
  previous: GraphDetailLevel,
): GraphDetailLevel {
  if (!Number.isFinite(zoom)) return previous
  if (zoom >= 2.5 || (previous === 2 && zoom >= 2.2)) return 2
  if (zoom >= 1.55 || (previous >= 1 && zoom >= 1.35)) return 1
  return 0
}
