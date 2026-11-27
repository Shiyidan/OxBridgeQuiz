// 图谱视野筛选：缩放决定细节层级，屏幕坐标决定当前区域，不改动节点位置或生成新关系。
import type { GraphDetailLevel } from './overview'

interface ViewportNode {
  id: string
  detailLevel?: GraphDetailLevel
  x: number
  y: number
}
interface ViewportEdge {
  id: string
  source: string
  target: string
  detailLevel?: GraphDetailLevel
}

// 边缘保留一小段缓冲，只有当前视野附近的节点及其已有连线参与渲染。
export function selectGraphViewport<Edge extends ViewportEdge>(
  nodes: readonly ViewportNode[],
  edges: readonly Edge[],
  viewport: { width: number; height: number },
  level: GraphDetailLevel,
  progressive: boolean,
  previous: ReadonlySet<string> = new Set(),
) {
  const renderedIds = new Set<string>()
  const visibleIds = new Set<string>()
  for (const node of nodes) {
    if (progressive && (node.detailLevel ?? 2) > level) continue
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue
    // 进入和退出视野采用不同边界，缓慢拖动时不在边缘反复开关节点。
    const buffer = previous.has(node.id) ? 64 : 32
    if (
      node.x < -buffer ||
      node.x > viewport.width + buffer ||
      node.y < -buffer ||
      node.y > viewport.height + buffer
    )
      continue
    renderedIds.add(node.id)
    if (node.x >= 0 && node.x <= viewport.width && node.y >= 0 && node.y <= viewport.height)
      visibleIds.add(node.id)
  }
  const renderedEdges = edges.filter(
    (edge) =>
      renderedIds.has(edge.source) &&
      renderedIds.has(edge.target) &&
      (!progressive || (edge.detailLevel ?? 2) <= level),
  )
  return {
    renderedIds,
    visibleIds,
    edges: renderedEdges,
    visibleEdges: renderedEdges.filter(
      (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
    ).length,
  }
}
