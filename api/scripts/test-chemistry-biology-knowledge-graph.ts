// 化学与生物图谱回归：核对完整讲义覆盖、教学边界、各章骨干及五科注册隔离，不访问数据库。
import assert from "node:assert/strict";
import { esatAtomicStructure } from "../../quiz-web/src/content/knowledge/esatAtomicStructure";
import { esatPeriodicTable } from "../../quiz-web/src/content/knowledge/esatPeriodicTable";
import { esatChemicalReactions } from "../../quiz-web/src/content/knowledge/esatChemicalReactions";
import { esatQuantitativeChemistry } from "../../quiz-web/src/content/knowledge/esatQuantitativeChemistry";
import { esatRedox } from "../../quiz-web/src/content/knowledge/esatRedox";
import { esatChemicalBonding } from "../../quiz-web/src/content/knowledge/esatChemicalBonding";
import { esatGroupChemistry } from "../../quiz-web/src/content/knowledge/esatGroupChemistry";
import { esatSeparationTechniques } from "../../quiz-web/src/content/knowledge/esatSeparationTechniques";
import { esatAcidsBasesSalts } from "../../quiz-web/src/content/knowledge/esatAcidsBasesSalts";
import { esatReactionRates } from "../../quiz-web/src/content/knowledge/esatReactionRates";
import { esatEnergyChanges } from "../../quiz-web/src/content/knowledge/esatEnergyChanges";
import { esatElectrolysis } from "../../quiz-web/src/content/knowledge/esatElectrolysis";
import { esatOrganicChemistry } from "../../quiz-web/src/content/knowledge/esatOrganicChemistry";
import { esatMetals } from "../../quiz-web/src/content/knowledge/esatMetals";
import { esatParticleTheory } from "../../quiz-web/src/content/knowledge/esatParticleTheory";
import { esatChemicalTests } from "../../quiz-web/src/content/knowledge/esatChemicalTests";
import { esatAirWater } from "../../quiz-web/src/content/knowledge/esatAirWater";
import { esatCells } from "../../quiz-web/src/content/knowledge/esatCells";
import { esatMembraneTransport } from "../../quiz-web/src/content/knowledge/esatMembraneTransport";
import { esatCellDivision } from "../../quiz-web/src/content/knowledge/esatCellDivision";
import { esatInheritance } from "../../quiz-web/src/content/knowledge/esatInheritance";
import { esatDna } from "../../quiz-web/src/content/knowledge/esatDna";
import { esatGeneTechnologies } from "../../quiz-web/src/content/knowledge/esatGeneTechnologies";
import { esatVariation } from "../../quiz-web/src/content/knowledge/esatVariation";
import { esatEnzymes } from "../../quiz-web/src/content/knowledge/esatEnzymes";
import { esatAnimalPhysiology } from "../../quiz-web/src/content/knowledge/esatAnimalPhysiology";
import { esatEcosystems } from "../../quiz-web/src/content/knowledge/esatEcosystems";
import { esatPlantPhysiology } from "../../quiz-web/src/content/knowledge/esatPlantPhysiology";
import type { KnowledgeLesson } from "../../quiz-web/src/content/knowledge/types";
import { chemistryKnowledgeGraph } from "../../quiz-web/src/content/knowledgeGraph/chemistry";
import {
  chemistryOverview,
  chemistryCoreCodes,
  chemistryMethodCodes,
  chemistryCorePairs,
} from "../../quiz-web/src/content/knowledgeGraph/chemistryOverview";
import { biologyKnowledgeGraph } from "../../quiz-web/src/content/knowledgeGraph/biology";
import {
  biologyOverview,
  biologyCoreCodes,
  biologyMethodCodes,
  biologyCorePairs,
} from "../../quiz-web/src/content/knowledgeGraph/biologyOverview";
import { getSubjectKnowledgeGraph } from "../../quiz-web/src/content/knowledgeGraph/registry";
import { knowledgeLabel } from "../../quiz-web/src/content/knowledgeGraph/labels";
import {
  knowledgeRelationTypes,
  type KnowledgeGraph,
  type KnowledgeRelationType,
} from "../../quiz-web/src/content/knowledgeGraph/types";
import {
  getKnowledgeGraphView,
  getKnowledgeGraphNeighbours,
} from "../../quiz-web/src/content/knowledgeGraph/navigation";
import { layoutKnowledgeGraph } from "../../quiz-web/src/content/knowledgeGraph/layout";
import { selectGraphViewport } from "../../quiz-web/src/content/knowledgeGraph/visibility";
import type {
  createGraphOverview,
  GraphDetailLevel,
} from "../../quiz-web/src/content/knowledgeGraph/overview";

// 讲义的展开标题与真实考纲短标题显式对应；编号、章节和其他标题必须完全匹配。
const lessonTitles: Record<string, string> = {
  "140104": "前20号元素的电子排布",
  "140105": "同位素与丰度",
  "140203": "金属与非金属的位置",
  "140302": "常见化合物的化学式",
  "140401": "相对分子质量与相对式量",
  "140406": "方程质量计算与限量",
  "140407": "由实验数量构造方程",
  "140409": "溶液、浓度与溶解度",
  "140501": "基于氧的氧化与还原",
  "140502": "电子转移中的氧化与还原",
  "140607": "结构、成键与物理性质",
  "140702": "碱金属的性质趋势",
  "140703": "卤素的趋势与置换",
  "140801": "从化合物中取得元素",
  "140802": "混合物的物理分离",
  "140804": "用色谱判断纯度",
  "141403": "金属与合金用途和性质",
  "150103": "生物体的结构层级",
  "150303": "无性繁殖与有性繁殖",
  "150304": "性别决定与后代比例",
  "150502": "DNA 结构与碱基配对",
  "150503": "蛋白质合成与三联体信息",
  "150504": "基因突变及其后果",
  "150601": "Genetic engineering（基因工程）",
  "150602": "Stem cells（干细胞）",
  "150603": "Selective breeding（选择育种）",
  "150702": "变异的来源",
  "150802": "酶的作用机制与专一性",
  "150803": "温度、pH 与酶促反应速率",
  "150804": "消化酶：底物、产物与作用部位",
  "151001": "生态层级与种群变化",
  "151002": "碳循环与水循环",
  "151003": "取样调查与生物多样性",
};

interface GraphCase {
  graph: KnowledgeGraph;
  lessons: KnowledgeLesson[];
  overview: ReturnType<typeof createGraphOverview>;
  coreCodes: readonly string[];
  methodCodes: readonly string[];
  corePairs: readonly (readonly [string, string])[];
  expectedNodes: number;
  expectedChapters: number;
  sampleCode: string;
  semanticEdges: readonly (readonly [
    string,
    string,
    KnowledgeRelationType,
    string,
  ])[];
}
const cases: GraphCase[] = [
  {
    graph: chemistryKnowledgeGraph,
    lessons: [
      esatAtomicStructure,
      esatPeriodicTable,
      esatChemicalReactions,
      esatQuantitativeChemistry,
      esatRedox,
      esatChemicalBonding,
      esatGroupChemistry,
      esatSeparationTechniques,
      esatAcidsBasesSalts,
      esatReactionRates,
      esatEnergyChanges,
      esatElectrolysis,
      esatOrganicChemistry,
      esatMetals,
      esatParticleTheory,
      esatChemicalTests,
      esatAirWater,
    ],
    overview: chemistryOverview,
    coreCodes: chemistryCoreCodes,
    methodCodes: chemistryMethodCodes,
    corePairs: chemistryCorePairs,
    expectedNodes: 89,
    expectedChapters: 17,
    sampleCode: "140406",
    semanticEdges: [
      ["140305", "141006", "connection", "不改变"],
      ["141005", "141006", "prerequisite", "活化能"],
      ["140406", "141003", "application", "限量"],
      ["140903", "140410", "application", "质子数"],
      ["140605", "141403", "application", "晶层滑动"],
      ["141204", "141401", "application", "熔融"],
      ["140703", "140502", "application", "电子"],
      ["141605", "141704", "application", "不能证明"],
      ["141305", "141306", "application", "伯醇"],
      ["140105", "140106", "application", "个数丰度"],
    ],
  },
  {
    graph: biologyKnowledgeGraph,
    lessons: [
      esatCells,
      esatMembraneTransport,
      esatCellDivision,
      esatInheritance,
      esatDna,
      esatGeneTechnologies,
      esatVariation,
      esatEnzymes,
      esatAnimalPhysiology,
      esatEcosystems,
      esatPlantPhysiology,
    ],
    overview: biologyOverview,
    coreCodes: biologyCoreCodes,
    methodCodes: biologyMethodCodes,
    corePairs: biologyCorePairs,
    expectedNodes: 34,
    expectedChapters: 11,
    sampleCode: "150503",
    semanticEdges: [
      ["150302", "150702", "application", "新等位基因"],
      ["150503", "150601", "application", "不等于"],
      ["150804", "150201", "application", "吸收"],
      ["150201", "151102", "application", "整体流动"],
      ["150701", "150905", "application", "已有耐药"],
      ["150901", "151002", "application", "能量最终散失"],
      ["150901", "151101", "connection", "净气体交换"],
      ["150501", "150602", "connection", "表达哪些基因"],
      ["150303", "150702", "application", "环境"],
      ["150803", "151101", "application", "限制因素"],
    ],
  },
];

// 通过真实邻接边检查完整与核心网络，不能用自动补边掩盖遗漏。
function reachable(start: string, links: Map<string, string[]>): Set<string> {
  const reached = new Set([start]);
  for (const code of reached)
    for (const target of links.get(code) ?? []) reached.add(target);
  return reached;
}

// 对两个科目采用同一边界检查，具体方法联系由各科独立列出，避免只检查图能画出来。
function validateCase(test: GraphCase): void {
  const { graph, overview, lessons } = test;
  const prefix = graph.subjectCode.slice(0, 2);
  assert.equal(graph.nodes.length, test.expectedNodes);
  assert.equal(graph.chapters.length, test.expectedChapters);
  assert.deepEqual(
    graph.chapters.map((c) => c.code),
    lessons.map((l) => l.code),
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
  for (const node of [...graph.nodes, ...graph.chapters]) {
    assert.ok(node.code.startsWith(prefix));
    assert.ok(node.title.trim() && node.titleEn.trim());
    assert.equal(knowledgeLabel(node, "zh"), node.title);
    assert.equal(knowledgeLabel(node, "en"), node.titleEn);
  }
  const pairs = new Set<string>(),
    ids = new Set<string>();
  const links = new Map(graph.nodes.map((n) => [n.code, [] as string[]]));
  const prerequisite = new Map(
    graph.nodes.map((n) => [n.code, [] as string[]]),
  );
  for (const e of graph.relations) {
    assert.ok(nodes.has(e.source) && nodes.has(e.target), `悬空关系：${e.id}`);
    assert.notEqual(e.source, e.target);
    assert.ok(e.type in knowledgeRelationTypes);
    assert.ok(!ids.has(e.id), `重复编号：${e.id}`);
    ids.add(e.id);
    const pair = [e.source, e.target].sort().join(":");
    assert.ok(!pairs.has(pair), `重复端点：${pair}`);
    pairs.add(pair);
    assert.ok(e.explanation.trim().length >= 25, `缺少具体方法说明：${e.id}`);
    links.get(e.source)!.push(e.target);
    links.get(e.target)!.push(e.source);
    if (e.type === "prerequisite") prerequisite.get(e.source)!.push(e.target);
  }
  const visited = new Set<string>();
  // 只禁止前置关系有向环，方法应用及对照理解可以形成交叉网络。
  function visit(code: string, path: string[]): void {
    assert.ok(!path.includes(code), `前置成环：${[...path, code].join("→")}`);
    if (visited.has(code)) return;
    for (const next of prerequisite.get(code)!) visit(next, [...path, code]);
    visited.add(code);
  }
  for (const code of nodes.keys()) visit(code, []);
  assert.equal(reachable(graph.nodes[0]!.code, links).size, graph.nodes.length);
  for (const chapter of graph.chapters)
    assert.ok(
      graph.relations.some(
        (e) =>
          (nodes.get(e.source)!.chapterCode === chapter.code) !==
          (nodes.get(e.target)!.chapterCode === chapter.code),
      ),
      `缺少跨章联系：${chapter.code}`,
    );
  for (const [source, target, type, condition] of test.semanticEdges)
    assert.ok(
      graph.relations.some(
        (e) =>
          e.source === source &&
          e.target === target &&
          e.type === type &&
          e.explanation.includes(condition),
      ),
      `教学关系或条件缺失：${source} → ${target}`,
    );
  const local = getKnowledgeGraphView(graph, { selectedCode: test.sampleCode });
  assert.ok(new Set(local.nodes.map((n) => n.chapterCode)).size >= 4);
  assert.ok(
    local.relations.some(
      (e) => e.source !== test.sampleCode && e.target !== test.sampleCode,
    ),
  );
  assert.ok(local.relations.every((e) => ids.has(e.id)));
  assert.deepEqual(getKnowledgeGraphNeighbours(graph, "110507"), []);

  const core = new Set(test.coreCodes),
    methods = new Set(test.methodCodes);
  assert.equal(core.size, test.coreCodes.length);
  assert.equal(methods.size, test.methodCodes.length);
  assert.ok([...core].every((code) => nodes.has(code)));
  assert.ok([...methods].every((code) => nodes.has(code) && !core.has(code)));
  assert.equal(
    new Set([...core].map((code) => nodes.get(code)!.chapterCode)).size,
    test.expectedChapters,
  );
  const coreLinks = new Map([...core].map((code) => [code, [] as string[]]));
  const corePairs = new Set<string>();
  for (const [source, target] of test.corePairs) {
    assert.ok(core.has(source) && core.has(target));
    const pair = [source, target].sort().join(":");
    assert.ok(
      pairs.has(pair) && !corePairs.has(pair),
      "核心关系必须真实且不重复",
    );
    corePairs.add(pair);
    coreLinks.get(source)!.push(target);
    coreLinks.get(target)!.push(source);
  }
  assert.equal(reachable(test.coreCodes[0]!, coreLinks).size, core.size);
  for (const chapter of graph.chapters) {
    const scope = getKnowledgeGraphView(graph, {
      chapterCode: chapter.code,
      includeCrossChapter: true,
    });
    const levels = overview.scopeDetailLevels(
      scope.nodes,
      scope.relations,
      chapter.code,
    );
    const chapterCores = scope.nodes.filter(
      (n) => levels.nodeLevels.get(n.code) === 0,
    );
    assert.ok(chapterCores.some((n) => n.chapterCode === chapter.code));
    assert.ok(chapterCores.length < scope.nodes.length);
    assert.ok(
      chapterCores.filter((n) => n.chapterCode !== chapter.code).length <= 3,
    );
    for (const e of scope.relations)
      assert.ok(
        levels.edgeLevels.get(e.id)! >=
          Math.max(
            levels.nodeLevels.get(e.source)!,
            levels.nodeLevels.get(e.target)!,
          ),
      );
  }
  const layoutNodes = graph.nodes.map((n) => ({
    id: n.code,
    labelWidth: 156,
    labelHeight: 72,
    detailLevel: overview.nodeDetailLevel(n.code),
  }));
  const layoutEdges = graph.relations.map((e) => ({
    ...e,
    detailLevel: overview.edgeDetailLevel(e.source, e.target),
  }));
  for (const width of [1200, 800]) {
    const points = layoutKnowledgeGraph(layoutNodes, layoutEdges, width, 614);
    const corePoints = layoutKnowledgeGraph(
      layoutNodes.filter((n) => core.has(n.id)),
      layoutEdges.filter((e) => e.detailLevel === 0),
      width,
      614,
    );
    for (const p of corePoints)
      assert.deepEqual(
        points.find((n) => n.id === p.id),
        p,
        "展开细节不能推走核心节点",
      );
    assert.ok(
      points.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y)),
    );
    for (const level of [0, 1, 2] as GraphDetailLevel[]) {
      const region = selectGraphViewport(
        points.map((n) => ({
          ...n,
          detailLevel: overview.nodeDetailLevel(n.id),
        })),
        layoutEdges,
        { width, height: 614 },
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
            region.renderedIds.has(e.source) &&
            region.renderedIds.has(e.target),
        ),
      );
    }
  }
  assert.equal(
    getSubjectKnowledgeGraph("ESAT", graph.subjectCode)?.graph,
    graph,
  );
  assert.equal(getSubjectKnowledgeGraph("TMUA", graph.subjectCode), undefined);
  assert.equal(getSubjectKnowledgeGraph("ESAT", test.sampleCode), undefined);
  console.log(
    JSON.stringify({
      subject: graph.title,
      chapters: graph.chapters.length,
      nodes: graph.nodes.length,
      relations: graph.relations.length,
      crossChapter: graph.relations.filter(
        (e) =>
          nodes.get(e.source)!.chapterCode !== nodes.get(e.target)!.chapterCode,
      ).length,
      layers: [0, 1, 2].map((l) => ({
        nodes: graph.nodes.filter((n) => overview.nodeDetailLevel(n.code) <= l)
          .length,
        edges: graph.relations.filter(
          (e) => overview.edgeDetailLevel(e.source, e.target) <= l,
        ).length,
      })),
    }),
  );
}
for (const test of cases) validateCase(test);
for (const [code, count] of [
  ["110000", 76],
  ["120000", 39],
  ["130000", 32],
  ["140000", 89],
  ["150000", 34],
] as const)
  assert.equal(
    getSubjectKnowledgeGraph("ESAT", code)?.graph.nodes.length,
    count,
  );
assert.equal(getSubjectKnowledgeGraph("ESAT", "unknown"), undefined);
console.log("PASS 化学与生物节点覆盖、关系条件、章节骨干、稳定布局及五科隔离");
