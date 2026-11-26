// 知识图谱布局：先稳定核心网络，再安放细节节点；输出坐标与缩放、语言和学习状态无关。
interface LayoutNode {
  id: string
  labelWidth: number
  labelHeight: number
  detailLevel?: number
}
interface LayoutEdge {
  source: string
  target: string
  detailLevel?: number
}
interface LayoutPoint extends LayoutNode {
  x: number
  y: number
  vx: number
  vy: number
  level: number
  boxWidth: number
  boxHeight: number
  labelOffset: number
  degree: number
}
const GOLDEN_ANGLE = 2.399963229728653

// 为每层在最小保留倍率下预留文字空间，隐藏的长名称不挤占核心总览。
function footprint(node: LayoutNode) {
  const zoom = node.detailLevel === 1 ? 1.35 : node.detailLevel === 2 ? 2.2 : 1
  return {
    boxWidth: (node.labelWidth + 16) / zoom,
    boxHeight: (node.labelHeight + 24) / zoom,
    labelOffset: (node.labelHeight / 2 + 6) / zoom,
  }
}

// 用真实关系的最短距离组织核心网络，让相邻方法靠近，同时拉开无直接关系的分支。
function graphDistances(points: LayoutPoint[], edges: LayoutEdge[]) {
  const index = new Map(points.map((point, i) => [point.id, i]))
  const distances = points.map((_, i) => points.map((__, j) => (i === j ? 0 : Infinity)))
  for (const edge of edges) {
    const a = index.get(edge.source)
    const b = index.get(edge.target)
    if (a === undefined || b === undefined) continue
    distances[a]![b] = distances[b]![a] = 1
  }
  for (let k = 0; k < points.length; k++) {
    for (let i = 0; i < points.length; i++) {
      for (let j = 0; j < points.length; j++) {
        distances[i]![j] = Math.min(distances[i]![j]!, distances[i]![k]! + distances[k]![j]!)
      }
    }
  }
  return distances
}

// 碰撞只移动本层新节点，后续细节不能把已排好的核心或方法节点推走。
function separateLabels(points: LayoutPoint[], level: number, strength: number): void {
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!
    for (let j = i + 1; j < points.length; j++) {
      const b = points[j]!
      const moveA = a.level === level
      const moveB = b.level === level
      if (!moveA && !moveB) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const overlapX = (a.boxWidth + b.boxWidth) / 2 - Math.abs(dx)
      const overlapY = (a.boxHeight + b.boxHeight) / 2 - Math.abs(dy)
      if (overlapX <= 0 || overlapY <= 0) continue
      const share = strength / (Number(moveA) + Number(moveB))
      if (overlapX < overlapY) {
        const shift = (dx < 0 ? -1 : 1) * (overlapX + 0.1) * share
        if (moveA) a.x -= shift
        if (moveB) b.x += shift
      } else {
        const shift = (dy < 0 ? -1 : 1) * (overlapY + 0.1) * share
        if (moveA) a.y -= shift
        if (moveB) b.y += shift
      }
    }
  }
}

// 温和的中心力和椭圆边界保持疏密平衡，避免把节点截断到矩形四边。
function relax(
  points: LayoutPoint[],
  edges: LayoutEdge[],
  level: number,
  width: number,
  height: number,
  backbone: boolean,
): void {
  const index = new Map(points.map((point, i) => [point.id, i]))
  const links = edges.map((edge) => [index.get(edge.source)!, index.get(edge.target)!])
  const distances = backbone ? graphDistances(points, edges) : undefined
  const spacing = Math.max(90, Math.sqrt((width * height) / points.length) * 0.66)
  for (const point of points) point.degree = 0
  for (const [a, b] of links) {
    points[a!]!.degree++
    points[b!]!.degree++
  }
  const steps = backbone ? 650 : 300
  for (let step = 0; step < steps; step++) {
    const forces = points.map(() => ({ x: 0, y: 0 }))
    for (let i = 0; i < points.length; i++) {
      const a = points[i]!
      for (let j = i + 1; j < points.length; j++) {
        const b = points[j]!
        const dx = b.x - a.x || 0.01
        const dy = b.y - a.y || 0.01
        const distance = Math.max(1, Math.hypot(dx, dy))
        const path = distances?.[i]?.[j] ?? Infinity
        const target = spacing * Math.pow(path, 0.7)
        const attraction = Number.isFinite(path) ? ((distance - target) * 0.045) / (path * path) : 0
        const charge = 1 + Math.sqrt(a.degree + b.degree) * 0.15
        const repulsion = (spacing * spacing * 0.008 * charge) / Math.max(30, distance)
        const force = (attraction - repulsion) / distance
        forces[i]!.x += dx * force
        forces[i]!.y += dy * force
        forces[j]!.x -= dx * force
        forces[j]!.y -= dy * force
      }
    }
    if (!backbone) {
      for (const [ai, bi] of links) {
        const a = points[ai!]!
        const b = points[bi!]!
        const dx = b.x - a.x
        const dy = b.y - a.y
        const distance = Math.max(1, Math.hypot(dx, dy))
        const target = spacing + Math.sqrt(a.degree + b.degree) * 7
        const force =
          ((distance - target) * 0.08) / (distance * Math.sqrt(Math.max(a.degree, b.degree, 1)))
        forces[ai!]!.x += dx * force
        forces[ai!]!.y += dy * force
        forces[bi!]!.x -= dx * force
        forces[bi!]!.y -= dy * force
      }
    }
    const speed = 5 * (1 - step / steps) + 0.25
    for (let i = 0; i < points.length; i++) {
      const point = points[i]!
      if (point.level !== level) continue
      const dx = point.x - width / 2
      const dy = point.y - height / 2
      const radius = Math.hypot(dx / (width * 0.43), dy / (height * 0.4))
      const boundary = Math.max(0, radius - 1) * 0.16
      point.vx = (point.vx + forces[i]!.x - dx * (0.003 + boundary)) * 0.65
      point.vy = (point.vy + forces[i]!.y - dy * (0.006 + boundary)) * 0.65
      const limit = Math.max(1, Math.hypot(point.vx, point.vy) / speed)
      point.x += point.vx / limit
      point.y += point.vy / limit
    }
    separateLabels(points, level, 0.7)
  }
  for (let pass = 0; pass < 80; pass++) separateLabels(points, level, 1)
}

// 首层整体收进可见范围，保留分支相对位置；预留边缘文字空间后再消除少量缩放碰撞。
function fitBackbone(points: LayoutPoint[], width: number, height: number): void {
  const minX = Math.min(...points.map((point) => point.x - point.boxWidth / 2))
  const maxX = Math.max(...points.map((point) => point.x + point.boxWidth / 2))
  const minY = Math.min(...points.map((point) => point.y - point.boxHeight / 2))
  const maxY = Math.max(...points.map((point) => point.y + point.boxHeight / 2))
  const scaleX = Math.min(1.3, (width - 150) / Math.max(1, maxX - minX))
  const scaleY = Math.min(1.3, (height - 110) / Math.max(1, maxY - minY))
  for (const point of points) {
    point.x = width / 2 + (point.x - (minX + maxX) / 2) * scaleX
    point.y = height / 2 + (point.y - (minY + maxY) / 2) * scaleY
  }
}

// 细节节点若被多个固定标签夹住，寻找最近空位，避免反复推挤后仍留有重叠。
function settleLabels(
  points: LayoutPoint[],
  level: number,
  width: number,
  height: number,
  keepInView = false,
): void {
  const occupied = points.filter((point) => point.level !== level)
  const moving = points
    .filter((point) => point.level === level)
    .sort((a, b) => b.degree - a.degree || a.id.localeCompare(b.id))
  for (const [index, point] of moving.entries()) {
    const fits = (x: number, y: number) =>
      (!keepInView ||
        (x - point.boxWidth / 2 >= 20 &&
          x + point.boxWidth / 2 <= width - 20 &&
          y - point.boxHeight / 2 >= 20 &&
          y + point.boxHeight / 2 <= height - 20)) &&
      occupied.every(
        (other) =>
          Math.abs(x - other.x) >= (point.boxWidth + other.boxWidth) / 2 + 1 ||
          Math.abs(y - other.y) >= (point.boxHeight + other.boxHeight) / 2 + 1,
      )
    if (!fits(point.x, point.y)) {
      let placed = false
      for (let radius = 3; radius <= Math.max(width, height) * 2 && !placed; radius += 3) {
        for (let step = 0; step < 24; step++) {
          const angle = (step * Math.PI) / 12 + index * GOLDEN_ANGLE
          const x = point.x + Math.cos(angle) * radius
          const y = point.y + Math.sin(angle) * radius
          if (!fits(x, y)) continue
          point.x = x
          point.y = y
          placed = true
          break
        }
      }
    }
    occupied.push(point)
  }
}

// 多个固定起点中优先选择交叉少、边长适中且邻点间距均衡的布局，不改变正式关系。
function layoutCost(
  points: LayoutPoint[],
  edges: LayoutEdge[],
  width: number,
  height: number,
): number {
  const byId = new Map(points.map((point) => [point.id, point]))
  const links = edges.map((edge) => [byId.get(edge.source)!, byId.get(edge.target)!] as const)
  let crossings = 0
  let overlaps = 0
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const a = points[i]!
      const b = points[j]!
      if (
        Math.abs(a.x - b.x) < (a.boxWidth + b.boxWidth) / 2 &&
        Math.abs(a.y - b.y) < (a.boxHeight + b.boxHeight) / 2
      )
        overlaps++
    }
  }
  const side = (a: LayoutPoint, b: LayoutPoint, c: LayoutPoint) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  for (let i = 0; i < links.length; i++) {
    const [a, b] = links[i]!
    for (let j = i + 1; j < links.length; j++) {
      const [c, d] = links[j]!
      if (a === c || a === d || b === c || b === d) continue
      if (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0) crossings++
    }
  }
  const spacingSquared = (width * height) / Math.max(1, points.length)
  const lengths = links.reduce(
    (sum, [a, b]) => sum + ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) / spacingSquared,
    0,
  )
  const nearest = points.map((a) =>
    Math.min(...points.filter((b) => a !== b).map((b) => Math.hypot(a.x - b.x, a.y - b.y))),
  )
  const average = nearest.reduce((sum, distance) => sum + distance, 0) / nearest.length
  const variance =
    points.length > 1
      ? nearest.reduce((sum, distance) => sum + (distance / average - 1) ** 2, 0)
      : 0
  return overlaps * 10000 + crossings * 45 + lengths + variance * 8
}

// 名称在任一语言下使用相同的预留尺寸；排序和固定种子使重置及数据重排可复现。
export function layoutKnowledgeGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  width: number,
  height: number,
) {
  const ordered = [...nodes].sort((a, b) => a.id.localeCompare(b.id))
  const orderedEdges = [...edges].sort((a, b) =>
    (a.source + ':' + a.target).localeCompare(b.source + ':' + b.target),
  )
  const points: LayoutPoint[] = []
  const levels = [...new Set(ordered.map((node) => node.detailLevel ?? 0))].sort((a, b) => a - b)
  for (const level of levels) {
    const next = ordered.filter((node) => (node.detailLevel ?? 0) === level)
    const placed = new Map(points.map((point) => [point.id, point]))
    const backbone = points.length === 0
    next.forEach((node, i) => {
      const neighbours = orderedEdges.flatMap((edge) => {
        const other =
          edge.source === node.id ? edge.target : edge.target === node.id ? edge.source : ''
        const point = placed.get(other)
        return point ? [point] : []
      })
      const angle = (i + level * 11) * GOLDEN_ANGLE
      const radius = Math.sqrt((i + 0.5) / next.length)
      const centerX = neighbours.length
        ? neighbours.reduce((sum, point) => sum + point.x, 0) / neighbours.length
        : width / 2
      const centerY = neighbours.length
        ? neighbours.reduce((sum, point) => sum + point.y, 0) / neighbours.length
        : height / 2
      points.push({
        ...node,
        ...footprint(node),
        level,
        x: centerX + Math.cos(angle) * (backbone ? width * radius * 0.35 : 55 + radius * 65),
        y: centerY + Math.sin(angle) * (backbone ? height * radius * 0.35 : 40 + radius * 45),
        vx: 0,
        vy: 0,
        degree: 0,
      })
    })
    const ids = new Set(points.map((point) => point.id))
    const visibleEdges = orderedEdges.filter(
      (edge) => (edge.detailLevel ?? 0) <= level && ids.has(edge.source) && ids.has(edge.target),
    )
    if (backbone) {
      let best = points
      let bestCost = Infinity
      for (let seed = 0; seed < 6; seed++) {
        const candidate = points.map((point, i) => {
          const angle = i * GOLDEN_ANGLE * (seed * 2 + 1) + seed * 0.8
          const radius = Math.sqrt((i + 0.5) / points.length) * 0.35
          return {
            ...point,
            x: width / 2 + Math.cos(angle) * width * radius,
            y: height / 2 + Math.sin(angle) * height * radius,
          }
        })
        relax(candidate, visibleEdges, level, width, height, true)
        fitBackbone(candidate, width, height)
        settleLabels(candidate, level, width, height, true)
        const cost = layoutCost(candidate, visibleEdges, width, height)
        if (cost < bestCost) {
          bestCost = cost
          best = candidate
        }
      }
      points.splice(0, points.length, ...best)
    } else {
      relax(points, visibleEdges, level, width, height, false)
      settleLabels(points, level, width, height)
    }
  }
  return points.map((point) => ({ id: point.id, x: point.x, y: point.y - point.labelOffset }))
}
