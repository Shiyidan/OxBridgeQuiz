// 数学1图谱校验：对齐讲义、检查关系完整性及先修环路，并验证节点导航的方向语义。
import assert from 'node:assert/strict'
import { esatUnits } from '../../quiz-web/src/content/knowledge/esatUnits'
import { esatNumber } from '../../quiz-web/src/content/knowledge/esatNumber'
import { esatRatioProportion } from '../../quiz-web/src/content/knowledge/esatRatioProportion'
import { esatAlgebra } from '../../quiz-web/src/content/knowledge/esatAlgebra'
import { esatGeometry } from '../../quiz-web/src/content/knowledge/esatGeometry'
import { esatStatistics } from '../../quiz-web/src/content/knowledge/esatStatistics'
import { esatProbability } from '../../quiz-web/src/content/knowledge/esatProbability'
import { maths1KnowledgeGraph as graph } from '../../quiz-web/src/content/knowledgeGraph/maths1'
import { getKnowledgeGraphNeighbours, getKnowledgeGraphView } from '../../quiz-web/src/content/knowledgeGraph/navigation'
import type { KnowledgeGraph } from '../../quiz-web/src/content/knowledgeGraph/types'
import { knowledgeRelationTypes } from '../../quiz-web/src/content/knowledgeGraph/types'
import { knowledgeLabel, matchesKnowledgeLabel } from '../../quiz-web/src/content/knowledgeGraph/labels'
import { maths1CoreCodes, maths1MethodCodes, maths1CorePairs, maths1NodeDetailLevel, maths1EdgeDetailLevel, graphDetailLevelForZoom } from '../../quiz-web/src/content/knowledgeGraph/maths1Overview'
import { layoutKnowledgeGraph } from '../../quiz-web/src/content/knowledgeGraph/layout'
import { maths1ScopeDetailLevels } from '../../quiz-web/src/content/knowledgeGraph/maths1Overview'
import { selectGraphViewport } from '../../quiz-web/src/content/knowledgeGraph/visibility'

const lessons = [esatUnits, esatNumber, esatRatioProportion, esatAlgebra, esatGeometry, esatStatistics, esatProbability]
assert.equal(graph.examType, 'ESAT')
assert.equal(graph.subjectCode, '110000')
assert.deepEqual(graph.chapters.map(chapter => chapter.code), lessons.map(lesson => lesson.code))
assert.deepEqual(graph.nodes.map(({ code, title, chapterCode }) => ({ code, title, chapterCode })), lessons.flatMap(lesson => lesson.sections.map(section => ({
  code: section.code, title: section.title, chapterCode: lesson.code,
}))), '节点必须完整覆盖现有数学1讲义，编号、名称和章节一致')
for (const node of [...graph.nodes, ...graph.chapters]) {
  assert.ok(node.titleEn.trim().length > 0, `缺少英文名称：${node.code}`)
  assert.equal(knowledgeLabel(node, 'zh'), node.title)
  assert.equal(knowledgeLabel(node, 'en'), node.titleEn)
  assert.ok(matchesKnowledgeLabel(node, node.title))
  assert.ok(matchesKnowledgeLabel(node, node.titleEn.toUpperCase()))
}
const pythagoras = graph.nodes.find(node => node.code === '110507')!
assert.equal(knowledgeLabel(pythagoras, 'en'), "Pythagoras' theorem")
assert.ok(matchesKnowledgeLabel(pythagoras, ' pythagoras '))
assert.ok(!matchesKnowledgeLabel(pythagoras, 'unknown topic'))

const nodes = new Set(graph.nodes.map(node => node.code))
assert.equal(nodes.size, graph.nodes.length)
const ids = new Set<string>()
const pairs = new Set<string>()
const degree = new Map(graph.nodes.map(node => [node.code, 0]))
const prerequisiteTargets = new Map<string, string[]>()
for (const relation of graph.relations) {
  assert.ok(nodes.has(relation.source) && nodes.has(relation.target), `悬空关系：${relation.id}`)
  assert.notEqual(relation.source, relation.target, `自环：${relation.id}`)
  assert.ok(!ids.has(relation.id), `重复ID：${relation.id}`)
  ids.add(relation.id)
  assert.ok(Object.hasOwn(knowledgeRelationTypes, relation.type))
  const key = [relation.source, relation.target].sort().join(':')
  assert.ok(!pairs.has(key), `重复关系：${key}`)
  pairs.add(key)
  assert.ok(relation.explanation.trim().length >= 20, `缺少具体学习理由：${relation.id}`)
  degree.set(relation.source, degree.get(relation.source)! + 1)
  degree.set(relation.target, degree.get(relation.target)! + 1)
  if (relation.type === 'prerequisite') {
    prerequisiteTargets.set(relation.source, [...(prerequisiteTargets.get(relation.source) ?? []), relation.target])
  }
}

const completed = new Set<string>()
// 只检查前置基础的有向环；对照理解和方法复用不属于强制先后关系。
function visitPrerequisites(code: string, path: string[]): void {
  assert.ok(!path.includes(code), `前置基础形成环：${[...path, code].join(' → ')}`)
  if (completed.has(code)) return
  for (const target of prerequisiteTargets.get(code) ?? []) visitPrerequisites(target, [...path, code])
  completed.add(code)
}
for (const code of nodes) visitPrerequisites(code, [])

// 教学语义回归：替代解法不是唯一先修，代数与图像的对应关系必须双向可见。
assert.ok(graph.relations.some(edge => edge.source === '110507' && edge.target === '110510' && edge.type === 'application'))
assert.ok(!graph.relations.some(edge => edge.source === '110405' && edge.target === '110416' && edge.type === 'prerequisite'))
const algebraSide = getKnowledgeGraphNeighbours(graph, '110416', ['connection'])
const graphSide = getKnowledgeGraphNeighbours(graph, '110411', ['connection'])
assert.ok(algebraSide.some(item => item.node.code === '110411' && item.direction === 'undirected'))
assert.ok(graphSide.some(item => item.node.code === '110416' && item.direction === 'undirected'))
assert.ok(getKnowledgeGraphNeighbours(graph, '110510', ['application']).some(item => item.node.code === '110507' && item.direction === 'incoming'))
assert.ok(getKnowledgeGraphNeighbours(graph, '110507', ['application']).some(item => item.node.code === '110510' && item.direction === 'outgoing'))
assert.deepEqual(getKnowledgeGraphNeighbours(graph, '120101'), [])
assert.deepEqual(getKnowledgeGraphNeighbours(graph, '110507', []), [])

// 真实教学网络的回归：保留多种方法交汇，不以凑够连线数量作为验收标准。
for (const [source, target] of [
  ['110517', '110507'], ['110518', '110410'], ['110510', '110519'],
  ['110602', '110703'], ['110603', '110703'], ['110703', '110707'],
  ['110516', '110601'], ['110304', '110415'], ['110411', '110419'],
]) {
  assert.ok(graph.relations.some(edge =>
    (edge.source === source && edge.target === target) || (edge.source === target && edge.target === source),
  ), `缺少具体方法联系：${source} / ${target}`)
}
const focused = getKnowledgeGraphView(graph, { selectedCode: '110507' })
assert.ok(focused.relations.some(edge => edge.source !== '110507' && edge.target !== '110507'), '聚焦后不能只保留星形连线')
const statsWithContext = getKnowledgeGraphView(graph, { chapterCode: '110600' })
assert.ok(statsWithContext.nodes.some(node => node.code === '110703'), '统计章节需要展示相关的相对频率知识点')
const statsOnly = getKnowledgeGraphView(graph, { chapterCode: '110600', includeCrossChapter: false })
assert.ok(statsOnly.nodes.length > 0 && statsOnly.nodes.every(node => node.chapterCode === '110600'))
for (const chapter of graph.chapters) {
  for (const type of Object.keys(knowledgeRelationTypes) as (keyof typeof knowledgeRelationTypes)[]) {
    const view = getKnowledgeGraphView(graph, { chapterCode: chapter.code, types: [type] })
    const visible = new Set(view.nodes.map(node => node.code))
    assert.ok(view.relations.every(edge => edge.type === type && visible.has(edge.source) && visible.has(edge.target)))
    assert.ok(view.relations.every(edge => graph.relations.includes(edge)), '局部图不得合成原图中不存在的连线')
  }
}

// 最小夹具区分一层扩展与递归扩展，并证明邻居互联必须来自已存在的边。
const fixture: KnowledgeGraph = {
  ...graph,
  nodes: ['A', 'B', 'C', 'D'].map(code => ({ code, title: code, titleEn: code, chapterCode: code === 'A' ? 'chapter-a' : 'chapter-b' })),
  relations: [
    { id: 'ab', source: 'A', target: 'B', type: 'application', explanation: 'A应用于B' },
    { id: 'ac', source: 'A', target: 'C', type: 'application', explanation: 'A应用于C' },
    { id: 'bc', source: 'B', target: 'C', type: 'connection', explanation: 'B与C对照理解' },
    { id: 'cd', source: 'C', target: 'D', type: 'application', explanation: 'C应用于D' },
  ],
}
assert.deepEqual(getKnowledgeGraphView(fixture, { selectedCode: 'A' }).relations.map(edge => edge.id), ['ab', 'ac', 'bc'])
assert.deepEqual(getKnowledgeGraphView(fixture, { chapterCode: 'chapter-a' }).nodes.map(node => node.code), ['A', 'B', 'C'])
assert.deepEqual(getKnowledgeGraphView(fixture, { selectedCode: 'A', types: ['application'] }).relations.map(edge => edge.id), ['ab', 'ac'])
assert.deepEqual(getKnowledgeGraphView(fixture, { selectedCode: 'A', types: [] }).nodes.map(node => node.code), ['A'])
assert.deepEqual(getKnowledgeGraphView(fixture, { selectedCode: 'missing' }), { nodes: [], relations: [] })
assert.deepEqual(getKnowledgeGraphView(fixture, { chapterCode: 'missing' }), { nodes: [], relations: [] })
const chain = { ...fixture, relations: fixture.relations.filter(edge => edge.id === 'ab' || edge.id === 'bc') }
assert.deepEqual(getKnowledgeGraphView(chain, { selectedCode: 'B' }).relations.map(edge => edge.id), ['ab', 'bc'], 'A-B-C不应凭空添加A-C')

const isolated = [...degree].filter(([, count]) => count === 0).map(([code]) => code)
// 总览骨干覆盖每章且真实连通；展开逐层包含，不允许悬空端点或合成跨级捷径。
const core = new Set<string>(maths1CoreCodes)
assert.equal(core.size, maths1CoreCodes.length)
assert.equal(new Set(maths1MethodCodes).size, maths1MethodCodes.length)
assert.ok(maths1MethodCodes.every(code => nodes.has(code) && !core.has(code)))
assert.ok(maths1CoreCodes.every(code => nodes.has(code)))
assert.deepEqual(new Set(graph.nodes.filter(node => core.has(node.code)).map(node => node.chapterCode)), new Set(graph.chapters.map(chapter => chapter.code)))
const backboneKeys = maths1CorePairs.map(pair => [...pair].sort().join(':'))
assert.equal(new Set(backboneKeys).size, backboneKeys.length)
assert.ok(backboneKeys.every(key => pairs.has(key)))
assert.ok(maths1CorePairs.every(([source, target]) => core.has(source) && core.has(target)))
const reachable = new Set<string>([maths1CoreCodes[0]])
let grew = true
while (grew) {
  grew = false
  for (const [source, target] of maths1CorePairs) {
    if (!reachable.has(source) && !reachable.has(target)) continue
    for (const code of [source, target]) if (!reachable.has(code)) { reachable.add(code); grew = true }
  }
}
assert.equal(reachable.size, core.size, '核心总览必须形成真实关联网络')
const layers = [0, 1, 2].map(level => {
  const visible = graph.nodes.filter(node => maths1NodeDetailLevel(node.code) <= level)
  const codes = new Set(visible.map(node => node.code))
  const edges = graph.relations.filter(edge => maths1EdgeDetailLevel(edge.source, edge.target) <= level)
  assert.ok(edges.every(edge => codes.has(edge.source) && codes.has(edge.target)))
  assert.ok(visible.every(node => edges.some(edge => edge.source === node.code || edge.target === node.code)), '展开节点应有已可见的真实关系')
  return { nodes: visible.length, edges: edges.length }
})
assert.deepEqual(layers, [{ nodes: 20, edges: 22 }, { nodes: 39, edges: 70 }, { nodes: 76, edges: 193 }])
assert.equal(graphDetailLevelForZoom(1.54, 0), 0)
assert.equal(graphDetailLevelForZoom(1.55, 0), 1)
assert.equal(graphDetailLevelForZoom(1.4, 1), 1)
assert.equal(graphDetailLevelForZoom(1.34, 1), 0)
assert.equal(graphDetailLevelForZoom(2.5, 0), 2)
assert.equal(graphDetailLevelForZoom(2.3, 2), 2)
assert.equal(graphDetailLevelForZoom(2.19, 2), 1)
assert.equal(graphDetailLevelForZoom(1, 2), 0)
assert.equal(graphDetailLevelForZoom(Number.NaN, 1), 1)
assert.ok(focused.nodes.some(node => maths1NodeDetailLevel(node.code) > 0), '完整局部图不能被核心层级裁剪')

// 章节首屏必须保留本章骨干并限制跨章扩展，不能再一次性展示全部邻点。
for (const chapter of graph.chapters) {
  const scope = getKnowledgeGraphView(graph, { chapterCode: chapter.code })
  const levels = maths1ScopeDetailLevels(scope.nodes, scope.relations, chapter.code)
  const chapterCore = scope.nodes.filter(node => levels.nodeLevels.get(node.code) === 0)
  assert.ok(chapterCore.some(node => node.chapterCode === chapter.code))
  assert.ok(chapterCore.filter(node => node.chapterCode !== chapter.code).length <= 3)
  assert.ok(chapterCore.length < scope.nodes.length)
  for (const edge of scope.relations) {
    assert.ok(levels.edgeLevels.get(edge.id)! >= levels.nodeLevels.get(edge.source)!)
    assert.ok(levels.edgeLevels.get(edge.id)! >= levels.nodeLevels.get(edge.target)!)
  }
}
const overviewLevels = maths1ScopeDetailLevels(graph.nodes, graph.relations)
assert.deepEqual(new Set([...overviewLevels.nodeLevels].filter(([, level]) => level === 0).map(([code]) => code)), core)
assert.equal([...overviewLevels.edgeLevels.values()].filter(level => level === 0).length, 22)

// 两个空间区域使用同一缩放倍率：只展开当前视野的细节，平移后另一片才出现。
const viewportNodes = [
  { id: 'a', detailLevel: 0 as const, x: 70, y: 90 },
  { id: 'b', detailLevel: 1 as const, x: 140, y: 120 },
  { id: 'c', detailLevel: 2 as const, x: 210, y: 160 },
  { id: 'd', detailLevel: 0 as const, x: 870, y: 90 },
  { id: 'e', detailLevel: 2 as const, x: 940, y: 120 },
]
const viewportEdges = [
  { id: 'ab', source: 'a', target: 'b', detailLevel: 1 as const },
  { id: 'bc', source: 'b', target: 'c', detailLevel: 2 as const },
  { id: 'de', source: 'd', target: 'e', detailLevel: 2 as const },
  { id: 'ad', source: 'a', target: 'd', detailLevel: 0 as const },
]
const viewportSize = { width: 400, height: 240 }
const originalViewportNodes = JSON.stringify(viewportNodes)
assert.deepEqual([...selectGraphViewport(viewportNodes, viewportEdges, viewportSize, 0, true).visibleIds], ['a'])
assert.deepEqual([...selectGraphViewport(viewportNodes, viewportEdges, viewportSize, 1, true).visibleIds], ['a', 'b'])
const detailedRegion = selectGraphViewport(viewportNodes, viewportEdges, viewportSize, 2, true)
assert.deepEqual([...detailedRegion.visibleIds], ['a', 'b', 'c'])
assert.deepEqual(detailedRegion.edges.map(edge => edge.id), ['ab', 'bc'], '不可显示通向远处隐藏节点的连线或合成 a-c')
const pannedRegion = selectGraphViewport(viewportNodes.map(node => ({ ...node, x: node.x - 800 })), viewportEdges, viewportSize, 2, true, detailedRegion.renderedIds)
assert.deepEqual([...pannedRegion.visibleIds], ['d', 'e'])
assert.deepEqual(pannedRegion.edges.map(edge => edge.id), ['de'])
assert.deepEqual([...selectGraphViewport(viewportNodes, viewportEdges, viewportSize, 0, true, detailedRegion.renderedIds).renderedIds], ['a'], '缩小时细节必须收起')
assert.deepEqual([...selectGraphViewport(viewportNodes, viewportEdges, viewportSize, 0, false).visibleIds], ['a', 'b', 'c'], '点击知识点的完整局部图不受核心层级裁剪')
const edgeNode = [{ id: 'edge', detailLevel: 0 as const, x: -48, y: 90 }]
assert.equal(selectGraphViewport(edgeNode, [], viewportSize, 0, true).renderedIds.size, 0)
const buffered = selectGraphViewport(edgeNode, [], viewportSize, 0, true, new Set(['edge']))
assert.equal(buffered.renderedIds.size, 1)
assert.equal(buffered.visibleIds.size, 0, '缓冲区节点不能算进视野内数量')
assert.equal(selectGraphViewport([{ ...edgeNode[0], x: Number.NaN }], [], viewportSize, 0, true).renderedIds.size, 0)
assert.equal(JSON.stringify(viewportNodes), originalViewportNodes, '筛选视野不能修改布局坐标')

// 多层布局必须独立于隐藏细节、数据顺序和账号状态；覆盖窄屏虚拟画布及桌面尺寸。
const layoutNodes = graph.nodes.map(node => ({ id: node.code, labelWidth: 132, labelHeight: 64, detailLevel: maths1NodeDetailLevel(node.code) }))
const layoutEdges = graph.relations.map(edge => ({ ...edge, detailLevel: maths1EdgeDetailLevel(edge.source, edge.target) }))
const inputBefore = JSON.stringify([layoutNodes, layoutEdges])
for (const [width, height] of [[1000, 500], [1344, 624], [1800, 720]]) {
  const points = layoutKnowledgeGraph(layoutNodes, layoutEdges, width, height)
  assert.equal(points.length, graph.nodes.length)
  assert.equal(new Set(points.map(point => point.id)).size, graph.nodes.length)
  assert.ok(points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)))
  assert.deepEqual(layoutKnowledgeGraph([...layoutNodes].reverse(), [...layoutEdges].reverse(), width, height), points, '数据重排不能改变布局')
  for (const level of [0, 1]) {
    const prefix = layoutKnowledgeGraph(layoutNodes.filter(node => node.detailLevel <= level), layoutEdges.filter(edge => edge.detailLevel <= level), width, height)
    const ids = new Set(prefix.map(point => point.id))
    assert.deepEqual(points.filter(point => ids.has(point.id)), prefix, '预排后续细节不能移动已确定的位置')
  }
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      assert.ok(Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y) > 8, '节点圆点不能叠在一起')
    }
  }
}
assert.equal(JSON.stringify([layoutNodes, layoutEdges]), inputBefore, '布局不得改写共享节点或教学关系')
assert.deepEqual(layoutKnowledgeGraph([], [], 800, 450), [])
const singlePoint = layoutKnowledgeGraph([{ id: 'one', labelWidth: 100, labelHeight: 30 }], [], 800, 450)
assert.equal(singlePoint[0].x, 400)
assert.ok(Number.isFinite(singlePoint[0].y))
const disconnected = layoutKnowledgeGraph(layoutNodes.slice(0, 4).map(node => ({ ...node, detailLevel: 0 })), [], 800, 450)
assert.ok(disconnected.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)))
const counts = Object.fromEntries(Object.keys(knowledgeRelationTypes).map(type => [type, graph.relations.filter(edge => edge.type === type).length]))
const chapterByCode = new Map(graph.nodes.map(node => [node.code, node.chapterCode]))
const crossChapter = graph.relations.filter(edge => chapterByCode.get(edge.source) !== chapterByCode.get(edge.target)).length
console.log(JSON.stringify({ chapters: graph.chapters.length, nodes: graph.nodes.length, relations: graph.relations.length, counts, crossChapter, isolated, layers, pythagorasView: { nodes: focused.nodes.length, relations: focused.relations.length } }, null, 2))
console.log('PASS 数学1节点覆盖、关系语义/去重、前置无环、局部网络、跨章筛选、三级缩放与分层布局稳定性')
