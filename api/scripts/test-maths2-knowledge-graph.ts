// 数学2图谱回归：核对讲义覆盖、教学关系与多科目边界，验证核心网络及章节分层。
import assert from "node:assert/strict";
import { esatMath2Algebra } from "../../quiz-web/src/content/knowledge/esatMath2Algebra";
import { esatMath2Sequences } from "../../quiz-web/src/content/knowledge/esatMath2Sequences";
import { esatMath2Coordinate } from "../../quiz-web/src/content/knowledge/esatMath2Coordinate";
import { esatMath2Trigonometry } from "../../quiz-web/src/content/knowledge/esatMath2Trigonometry";
import { esatMath2Exponentials } from "../../quiz-web/src/content/knowledge/esatMath2Exponentials";
import { esatMath2Differentiation } from "../../quiz-web/src/content/knowledge/esatMath2Differentiation";
import { esatMath2Integration } from "../../quiz-web/src/content/knowledge/esatMath2Integration";
import { esatMath2Graphs } from "../../quiz-web/src/content/knowledge/esatMath2Graphs";
import { maths2KnowledgeGraph as graph } from "../../quiz-web/src/content/knowledgeGraph/maths2";
import {
  maths2CoreCodes,
  maths2MethodCodes,
  maths2CorePairs,
  maths2Overview as overview,
} from "../../quiz-web/src/content/knowledgeGraph/maths2Overview";
import {
  getKnowledgeGraphNeighbours,
  getKnowledgeGraphView,
} from "../../quiz-web/src/content/knowledgeGraph/navigation";
import { getSubjectKnowledgeGraph } from "../../quiz-web/src/content/knowledgeGraph/registry";
import { knowledgeRelationTypes } from "../../quiz-web/src/content/knowledgeGraph/types";
import { knowledgeLabel } from "../../quiz-web/src/content/knowledgeGraph/labels";
import { layoutKnowledgeGraph } from "../../quiz-web/src/content/knowledgeGraph/layout";
import { selectGraphViewport } from "../../quiz-web/src/content/knowledgeGraph/visibility";
import type { GraphDetailLevel } from "../../quiz-web/src/content/knowledgeGraph/overview";

const lessons = [
  esatMath2Algebra,
  esatMath2Sequences,
  esatMath2Coordinate,
  esatMath2Trigonometry,
  esatMath2Exponentials,
  esatMath2Differentiation,
  esatMath2Integration,
  esatMath2Graphs,
];
assert.equal(graph.nodes.length, 39);
assert.equal(graph.chapters.length, 8);
assert.deepEqual(
  graph.chapters.map(({ code, title }) => ({ code, title })),
  lessons.map(({ code, title }) => ({
    code,
    title: title.split("·")[1]!.trim(),
  })),
);
assert.deepEqual(
  graph.nodes.map(({ code, title, chapterCode }) => ({
    code,
    title,
    chapterCode,
  })),
  lessons.flatMap((lesson) =>
    lesson.sections.map((section) => ({
      code: section.code,
      title: section.title,
      chapterCode: lesson.code,
    })),
  ),
);
const nodes = new Map(graph.nodes.map((node) => [node.code, node]));
assert.equal(nodes.size, graph.nodes.length);
for (const node of [...graph.nodes, ...graph.chapters]) {
  assert.ok(node.titleEn.trim(), `缺少英文名称：${node.code}`);
  assert.equal(knowledgeLabel(node, "zh"), node.title);
  assert.equal(knowledgeLabel(node, "en"), node.titleEn);
}

const pairs = new Set<string>();
const ids = new Set<string>();
const adjacency = new Map(
  graph.nodes.map((node) => [node.code, [] as string[]]),
);
const prerequisites = new Map(
  graph.nodes.map((node) => [node.code, [] as string[]]),
);
for (const edge of graph.relations) {
  assert.ok(
    nodes.has(edge.source) && nodes.has(edge.target),
    `悬空端点：${edge.id}`,
  );
  assert.notEqual(edge.source, edge.target);
  assert.ok(!ids.has(edge.id), `重复关系编号：${edge.id}`);
  ids.add(edge.id);
  const key = [edge.source, edge.target].sort().join(":");
  assert.ok(!pairs.has(key), `两点重复连线：${key}`);
  pairs.add(key);
  assert.ok(Object.hasOwn(knowledgeRelationTypes, edge.type));
  assert.ok(
    edge.explanation.trim().length >= 20,
    `缺少具体教学理由：${edge.id}`,
  );
  adjacency.get(edge.source)!.push(edge.target);
  adjacency.get(edge.target)!.push(edge.source);
  if (edge.type === "prerequisite")
    prerequisites.get(edge.source)!.push(edge.target);
}
const finished = new Set<string>();
// 只检验前置知识的有向环，方法应用和对照理解允许构成网络。
function visit(code: string, path: string[]): void {
  assert.ok(!path.includes(code), `前置关系成环：${[...path, code].join("→")}`);
  if (finished.has(code)) return;
  for (const next of prerequisites.get(code)!) visit(next, [...path, code]);
  finished.add(code);
}
for (const code of nodes.keys()) visit(code, []);

// 完整网络与总览骨干均应连通；孤点不能靠生成虚假捷径解决。
function reachableFrom(
  start: string,
  links: Map<string, string[]>,
): Set<string> {
  const reached = new Set([start]);
  for (const code of reached)
    for (const next of links.get(code) ?? []) reached.add(next);
  return reached;
}
assert.equal(
  reachableFrom(graph.nodes[0]!.code, adjacency).size,
  graph.nodes.length,
);
for (const chapter of graph.chapters) {
  assert.ok(
    graph.relations.some(
      (edge) =>
        (nodes.get(edge.source)!.chapterCode === chapter.code) !==
        (nodes.get(edge.target)!.chapterCode === chapter.code),
    ),
    `章节缺少具体跨章关系：${chapter.code}`,
  );
}

// 重点联系必须说明具体方法，不能把不同表示或替代解法全部设为强制先修。
assert.ok(
  graph.relations.some(
    (edge) =>
      edge.source === "120203" &&
      edge.target === "120501" &&
      edge.type === "connection" &&
      edge.explanation.includes("正公比"),
  ),
);
assert.ok(
  graph.relations.some(
    (edge) =>
      edge.source === "120103" &&
      edge.target === "120302" &&
      edge.type === "application" &&
      edge.explanation.includes("判别式"),
  ),
);
assert.ok(
  graph.relations.some(
    (edge) =>
      edge.source === "120807" &&
      edge.target === "120701" &&
      edge.type === "application",
  ),
);
assert.ok(
  graph.relations.some(
    (edge) =>
      edge.source === "120602" &&
      edge.target === "120702" &&
      edge.type === "connection" &&
      edge.explanation.includes("负一"),
  ),
);
assert.ok(
  graph.relations.some(
    (edge) =>
      edge.source === "120702" &&
      edge.target === "120706" &&
      edge.explanation.includes("右侧只含自变量"),
  ),
);
const local = getKnowledgeGraphView(graph, { selectedCode: "120103" });
assert.ok(new Set(local.nodes.map((node) => node.chapterCode)).size >= 5);
assert.ok(
  local.relations.some(
    (edge) => edge.source !== "120103" && edge.target !== "120103",
  ),
  "局部图应保留邻居之间的真实关系",
);
assert.ok(
  getKnowledgeGraphNeighbours(graph, "120302", ["application"]).some(
    (item) => item.node.code === "120103" && item.direction === "incoming",
  ),
);
assert.deepEqual(getKnowledgeGraphNeighbours(graph, "110103"), []);

const core = new Set<string>(maths2CoreCodes);
assert.equal(core.size, maths2CoreCodes.length);
assert.equal(new Set(maths2MethodCodes).size, maths2MethodCodes.length);
assert.ok(
  maths2MethodCodes.every((code) => nodes.has(code) && !core.has(code)),
);
const coreLinks = new Map([...core].map((code) => [code, [] as string[]]));
for (const [source, target] of maths2CorePairs) {
  assert.ok(core.has(source) && core.has(target));
  assert.ok(
    pairs.has([source, target].sort().join(":")),
    `骨干必须是实际关系：${source}/${target}`,
  );
  coreLinks.get(source)!.push(target);
  coreLinks.get(target)!.push(source);
}
assert.equal(reachableFrom(maths2CoreCodes[0], coreLinks).size, core.size);
assert.equal(
  new Set([...core].map((code) => nodes.get(code)!.chapterCode)).size,
  8,
);
const levels = overview.scopeDetailLevels(graph.nodes, graph.relations);
assert.equal(
  [...levels.nodeLevels.values()].filter((level) => level === 0).length,
  17,
);
assert.equal(
  [...levels.edgeLevels.values()].filter((level) => level === 0).length,
  22,
);
for (const chapter of graph.chapters) {
  const view = getKnowledgeGraphView(graph, { chapterCode: chapter.code });
  const scoped = overview.scopeDetailLevels(
    view.nodes,
    view.relations,
    chapter.code,
  );
  const initial = view.nodes.filter(
    (node) => scoped.nodeLevels.get(node.code) === 0,
  );
  assert.ok(initial.some((node) => node.chapterCode === chapter.code));
  assert.ok(
    initial.filter((node) => node.chapterCode !== chapter.code).length <= 3,
  );
  assert.ok(initial.length < view.nodes.length);
  for (const edge of view.relations) {
    assert.ok(
      scoped.edgeLevels.get(edge.id)! >= scoped.nodeLevels.get(edge.source)!,
    );
    assert.ok(
      scoped.edgeLevels.get(edge.id)! >= scoped.nodeLevels.get(edge.target)!,
    );
  }
}

const layoutNodes = graph.nodes.map((node) => ({
  id: node.code,
  labelWidth: 156,
  labelHeight: 72,
  detailLevel: overview.nodeDetailLevel(node.code),
}));
const layoutEdges = graph.relations.map((edge) => ({
  ...edge,
  detailLevel: overview.edgeDetailLevel(edge.source, edge.target),
}));
const positions = layoutKnowledgeGraph(layoutNodes, layoutEdges, 1200, 614);
assert.ok(
  positions.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)),
);
const coreLayout = layoutKnowledgeGraph(
  layoutNodes.filter((node) => core.has(node.id)),
  layoutEdges.filter((edge) => edge.detailLevel === 0),
  1200,
  614,
);
for (const point of coreLayout)
  assert.deepEqual(
    positions.find((node) => node.id === point.id),
    point,
    "添加细节不能推走核心节点",
  );
for (const level of [0, 1, 2] as GraphDetailLevel[]) {
  const region = selectGraphViewport(
    positions.map((point) => ({
      ...point,
      detailLevel: overview.nodeDetailLevel(point.id),
    })),
    layoutEdges,
    { width: 1200, height: 614 },
    level,
    true,
    new Set(),
  );
  assert.ok(
    [...region.renderedIds].every(
      (code) => overview.nodeDetailLevel(code) <= level,
    ),
  );
  assert.ok(
    region.edges.every(
      (edge) =>
        region.renderedIds.has(edge.source) &&
        region.renderedIds.has(edge.target),
    ),
  );
}

assert.equal(getSubjectKnowledgeGraph("ESAT", "120000")?.graph, graph);
assert.equal(
  getSubjectKnowledgeGraph("ESAT", "110000")?.graph.nodes.length,
  76,
);
assert.equal(
  getSubjectKnowledgeGraph("ESAT", "130000")?.graph.nodes.length,
  32,
);
assert.equal(
  getSubjectKnowledgeGraph("ESAT", "140000")?.graph.nodes.length,
  89,
);
assert.equal(
  getSubjectKnowledgeGraph("ESAT", "150000")?.graph.nodes.length,
  34,
);
assert.equal(getSubjectKnowledgeGraph("ESAT", "unknown"), undefined);
assert.equal(getSubjectKnowledgeGraph("TMUA", "120000"), undefined);
assert.equal(getSubjectKnowledgeGraph("ESAT", "120103"), undefined);
console.log(
  JSON.stringify({
    chapters: graph.chapters.length,
    nodes: graph.nodes.length,
    relations: graph.relations.length,
    levels: [0, 1, 2].map((level) => ({
      level,
      nodes: [...levels.nodeLevels.values()].filter((value) => value <= level)
        .length,
      relations: [...levels.edgeLevels.values()].filter(
        (value) => value <= level,
      ).length,
    })),
  }),
);
console.log("数学2图谱覆盖、关系语义、分层、稳定布局与科目边界通过");
