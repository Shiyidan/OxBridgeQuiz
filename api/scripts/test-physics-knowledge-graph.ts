// 物理图谱回归：对照七章讲义，校验真实跨章关系、层级覆盖和多科目隔离，不访问数据库。
import assert from "node:assert/strict";
import { esatElectricity } from "../../quiz-web/src/content/knowledge/esatElectricity";
import { esatMagnetism } from "../../quiz-web/src/content/knowledge/esatMagnetism";
import { esatMechanics } from "../../quiz-web/src/content/knowledge/esatMechanics";
import { esatThermalPhysics } from "../../quiz-web/src/content/knowledge/esatThermalPhysics";
import { esatMatter } from "../../quiz-web/src/content/knowledge/esatMatter";
import { esatWaves } from "../../quiz-web/src/content/knowledge/esatWaves";
import { esatRadioactivity } from "../../quiz-web/src/content/knowledge/esatRadioactivity";
import { physicsKnowledgeGraph as graph } from "../../quiz-web/src/content/knowledgeGraph/physics";
import {
  physicsCoreCodes,
  physicsMethodCodes,
  physicsCorePairs,
  physicsOverview as overview,
} from "../../quiz-web/src/content/knowledgeGraph/physicsOverview";
import { getSubjectKnowledgeGraph } from "../../quiz-web/src/content/knowledgeGraph/registry";
import {
  getKnowledgeGraphNeighbours,
  getKnowledgeGraphView,
} from "../../quiz-web/src/content/knowledgeGraph/navigation";
import { knowledgeRelationTypes } from "../../quiz-web/src/content/knowledgeGraph/types";
import { knowledgeLabel } from "../../quiz-web/src/content/knowledgeGraph/labels";
import { layoutKnowledgeGraph } from "../../quiz-web/src/content/knowledgeGraph/layout";
import { selectGraphViewport } from "../../quiz-web/src/content/knowledgeGraph/visibility";
import type { GraphDetailLevel } from "../../quiz-web/src/content/knowledgeGraph/overview";

const lessons = [
  esatElectricity,
  esatMagnetism,
  esatMechanics,
  esatThermalPhysics,
  esatMatter,
  esatWaves,
  esatRadioactivity,
];
// 图谱沿用真实考纲的短标题，讲义已展开的标题在这里显式对应，避免误判或静默漂移。
const lessonTitles: Record<string, string> = {
  "130201": "磁体的性质",
  "130302": "力与受力分析",
  "130304": "牛顿运动定律",
  "130307": "功、能量与效率",
  "130501": "物态与粒子模型",
  "130503": "物态变化与潜热",
};
assert.equal(graph.nodes.length, 32);
assert.equal(graph.chapters.length, 7);
assert.deepEqual(
  graph.chapters.map((c) => [c.code, c.title, c.titleEn]),
  lessons.map((l) => [
    l.code,
    l.title.split("·")[1]!.trim(),
    l.title.split("·")[0]!.trim(),
  ]),
);
assert.deepEqual(
  graph.nodes.map((n) => [
    n.code,
    lessonTitles[n.code] ?? n.title,
    n.chapterCode,
  ]),
  lessons.flatMap((l) => l.sections.map((s) => [s.code, s.title, l.code])),
);
const nodes = new Map(graph.nodes.map((n) => [n.code, n]));
assert.equal(nodes.size, graph.nodes.length);
for (const node of [...graph.chapters, ...graph.nodes]) {
  assert.ok(node.code.startsWith("130"));
  assert.ok(node.title.trim() && node.titleEn.trim());
  assert.equal(knowledgeLabel(node, "en"), node.titleEn);
  assert.equal(knowledgeLabel(node, "zh"), node.title);
}
const ids = new Set<string>(),
  pairs = new Set<string>();
const links = new Map(graph.nodes.map((n) => [n.code, [] as string[]]));
const prerequisites = new Map(graph.nodes.map((n) => [n.code, [] as string[]]));
for (const edge of graph.relations) {
  assert.ok(
    nodes.has(edge.source) && nodes.has(edge.target),
    `悬空关系：${edge.id}`,
  );
  assert.notEqual(edge.source, edge.target);
  assert.ok(edge.type in knowledgeRelationTypes);
  assert.equal(ids.has(edge.id), false, `重复关系编号：${edge.id}`);
  ids.add(edge.id);
  const pair = [edge.source, edge.target].sort().join(":");
  assert.equal(pairs.has(pair), false, `重复端点对：${pair}`);
  pairs.add(pair);
  assert.ok(
    edge.explanation.trim().length >= 25,
    `说明未解释具体方法：${edge.id}`,
  );
  links.get(edge.source)!.push(edge.target);
  links.get(edge.target)!.push(edge.source);
  if (edge.type === "prerequisite")
    prerequisites.get(edge.source)!.push(edge.target);
}
// 前置基础不得成有向环，方法应用和对照关系允许构成网络。
function visit(code: string, path: string[]): void {
  assert.ok(!path.includes(code), `前置成环：${[...path, code].join("→")}`);
  if (visited.has(code)) return;
  for (const target of prerequisites.get(code)!) visit(target, [...path, code]);
  visited.add(code);
}
const visited = new Set<string>();
for (const code of nodes.keys()) visit(code, []);
// 检查正式关系与核心网络均能连通，不依赖自动生成的传递连线。
function reachable(
  start: string,
  adjacency: Map<string, string[]>,
): Set<string> {
  const reached = new Set([start]);
  for (const code of reached)
    for (const target of adjacency.get(code) ?? []) reached.add(target);
  return reached;
}
assert.equal(reachable(graph.nodes[0]!.code, links).size, 32);
for (const chapter of graph.chapters)
  assert.ok(
    graph.relations.some(
      (e) =>
        (nodes.get(e.source)!.chapterCode === chapter.code) !==
        (nodes.get(e.target)!.chapterCode === chapter.code),
    ),
  );

// 对关键跨章方法及其边界做约束：有具体用途，不能只凭相同术语或公式外观连边。
for (const [source, target, type, condition] of [
  ["130102", "130404", "application", "容器"],
  ["130505", "130502", "application", "恒温"],
  ["130504", "130402", "application", "密度"],
  ["130301", "130604", "application", "往返"],
  ["130203", "130604", "application", "扬声器"],
  ["130204", "130604", "application", "动圈式"],
  ["130306", "130702", "application", "外力冲量"],
  ["130703", "130704", "application", "本底"],
  ["130605", "130703", "connection", "粒子辐射"],
  ["130306", "130307", "connection", "并不意味着"],
  ["130204", "130205", "prerequisite", "稳定直流"],
])
  assert.ok(
    graph.relations.some(
      (e) =>
        e.source === source &&
        e.target === target &&
        e.type === type &&
        e.explanation.includes(condition!),
    ),
    `缺少重要关系或条件：${source} → ${target}`,
  );
assert.equal(
  pairs.has(["130403", "130704"].sort().join(":")),
  false,
  "不能把热辐射冷却直接当作核衰变半衰期",
);
const energy = getKnowledgeGraphView(graph, { selectedCode: "130307" });
assert.ok(new Set(energy.nodes.map((n) => n.chapterCode)).size >= 5);
assert.ok(
  energy.relations.some((e) => e.source !== "130307" && e.target !== "130307"),
  "保留直接邻居间已有联系",
);
const recoil = getKnowledgeGraphNeighbours(graph, "130702");
assert.ok(recoil.some((n) => n.node.code === "130306"));
assert.deepEqual(getKnowledgeGraphNeighbours(graph, "110507"), []);

const core = new Set<string>(physicsCoreCodes),
  methods = new Set<string>(physicsMethodCodes);
assert.equal(core.size, physicsCoreCodes.length);
assert.equal(methods.size, physicsMethodCodes.length);
assert.ok([...methods].every((code) => nodes.has(code) && !core.has(code)));
assert.ok([...core].every((code) => nodes.has(code)));
assert.equal(
  new Set([...core].map((code) => nodes.get(code)!.chapterCode)).size,
  7,
);
const coreLinks = new Map([...core].map((code) => [code, [] as string[]]));
for (const [source, target] of physicsCorePairs) {
  assert.ok(core.has(source) && core.has(target));
  assert.ok(
    pairs.has([source, target].sort().join(":")),
    "总览只能使用真实直接连线",
  );
  coreLinks.get(source)!.push(target);
  coreLinks.get(target)!.push(source);
}
assert.equal(reachable(physicsCoreCodes[0], coreLinks).size, core.size);
const levels = overview.scopeDetailLevels(graph.nodes, graph.relations);
assert.equal([...levels.nodeLevels.values()].filter((l) => l === 0).length, 16);
assert.equal([...levels.edgeLevels.values()].filter((l) => l === 0).length, 22);
for (const chapter of graph.chapters) {
  const scope = getKnowledgeGraphView(graph, {
    chapterCode: chapter.code,
    includeCrossChapter: true,
  });
  const scoped = overview.scopeDetailLevels(
    scope.nodes,
    scope.relations,
    chapter.code,
  );
  const cores = scope.nodes.filter((n) => scoped.nodeLevels.get(n.code) === 0);
  assert.ok(cores.length < scope.nodes.length && cores.length >= 2);
  assert.ok(cores.filter((n) => n.chapterCode !== chapter.code).length <= 3);
  for (const edge of scope.relations)
    assert.ok(
      scoped.edgeLevels.get(edge.id)! >=
        Math.max(
          scoped.nodeLevels.get(edge.source)!,
          scoped.nodeLevels.get(edge.target)!,
        ),
    );
}

const layoutNodes = graph.nodes.map((n) => ({
  id: n.code,
  detailLevel: overview.nodeDetailLevel(n.code),
  labelWidth: 156,
  labelHeight: 72,
}));
const layoutEdges = graph.relations.map((e) => ({
  ...e,
  detailLevel: overview.edgeDetailLevel(e.source, e.target),
}));
for (const [width, height] of [
  [1200, 614],
  [800, 614],
]) {
  const positions = layoutKnowledgeGraph(
    layoutNodes,
    layoutEdges,
    width!,
    height!,
  );
  assert.ok(
    positions.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y)),
  );
  const corePositions = layoutKnowledgeGraph(
    layoutNodes.filter((n) => core.has(n.id)),
    layoutEdges.filter((e) => e.detailLevel === 0),
    width!,
    height!,
  );
  for (const point of corePositions)
    assert.deepEqual(
      positions.find((n) => n.id === point.id),
      point,
      "加入细节不能改变骨干位置",
    );
  for (const level of [0, 1, 2] as GraphDetailLevel[]) {
    const region = selectGraphViewport(
      positions.map((n) => ({
        ...n,
        detailLevel: overview.nodeDetailLevel(n.id),
      })),
      layoutEdges,
      { width: width!, height: height! },
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
        (e) =>
          region.renderedIds.has(e.source) && region.renderedIds.has(e.target),
      ),
    );
  }
}
assert.equal(getSubjectKnowledgeGraph("ESAT", "130000")?.graph, graph);
assert.equal(
  getSubjectKnowledgeGraph("ESAT", "110000")?.graph.nodes.length,
  76,
);
assert.equal(
  getSubjectKnowledgeGraph("ESAT", "120000")?.graph.nodes.length,
  39,
);
assert.equal(
  getSubjectKnowledgeGraph("ESAT", "140000")?.graph.nodes.length,
  89,
);
assert.equal(
  getSubjectKnowledgeGraph("ESAT", "150000")?.graph.nodes.length,
  34,
);
for (const code of ["130307", "unknown"])
  assert.equal(getSubjectKnowledgeGraph("ESAT", code), undefined);
assert.equal(getSubjectKnowledgeGraph("TMUA", "130000"), undefined);
console.log(
  JSON.stringify({
    chapters: graph.chapters.length,
    nodes: graph.nodes.length,
    relations: graph.relations.length,
    crossChapter: graph.relations.filter(
      (e) =>
        nodes.get(e.source)!.chapterCode !== nodes.get(e.target)!.chapterCode,
    ).length,
    levels: [0, 1, 2].map((level) => ({
      level,
      nodes: [...levels.nodeLevels.values()].filter((l) => l <= level).length,
      relations: [...levels.edgeLevels.values()].filter((l) => l <= level)
        .length,
    })),
  }),
);
console.log("PASS 物理图谱覆盖、关系边界、跨章网络、分层、稳定布局与科目隔离");
