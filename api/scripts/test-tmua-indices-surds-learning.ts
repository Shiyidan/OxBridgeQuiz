// TMUA 指数与根式讲义回归：检查章节隔离、公式、真题数量和题源映射。
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { findKnowledgeLesson } from "../../quiz-web/src/content/knowledge/index.js";
import {
  tmuaIndicesSources,
  tmuaIndicesSelfChecks,
} from "../src/constants/tmuaIndices.js";
import {
  tmuaSurdsSources,
  tmuaSurdsSelfChecks,
} from "../src/constants/tmuaSurds.js";
import { tmuaQuadraticSources } from "../src/constants/tmuaQuadratic.js";
import { tmuaSimultaneousSources } from "../src/constants/tmuaSimultaneous.js";
import type { MathematicsLearningSelection } from "../src/constants/mathematicsLearningTypes.js";

const katex = createRequire(
  new URL("../../quiz-web/package.json", import.meta.url),
)("katex") as {
  renderToString: (
    formula: string,
    options: { throwOnError: boolean; strict: string },
  ) => string;
};
// 讲义公式先通过严格渲染检查，避免把源码或异常字符展示给学生。
function checkFormulas(value: unknown, path: string): void {
  if (typeof value === "string") {
    assert(!/[\u0000-\u0008\u000b-\u001f\t]/.test(value), path);
    for (const match of value.matchAll(
      /\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g,
    )) {
      const formula = match[1] ?? match[2] ?? match[3] ?? match[4]!;
      assert.doesNotThrow(
        () =>
          katex.renderToString(formula, {
            throwOnError: true,
            strict: "error",
          }),
        `${path}: ${formula}`,
      );
    }
  } else if (Array.isArray(value))
    value.forEach((item, index) => checkFormulas(item, `${path}[${index}]`));
  else if (value && typeof value === "object")
    Object.entries(value).forEach(([key, item]) =>
      checkFormulas(item, `${path}.${key}`),
    );
}

const cases = [
  {
    code: "221001",
    visual: "tmua-indices",
    sources: tmuaIndicesSources,
    self: tmuaIndicesSelfChecks,
    evidenceCount: 24,
  },
  {
    code: "221002",
    visual: "tmua-surds",
    sources: tmuaSurdsSources,
    self: tmuaSurdsSelfChecks,
    evidenceCount: 26,
  },
];
assert(findKnowledgeLesson("TMUA", "221000"), "全部完成后应支持整章入口");
assert(findKnowledgeLesson("TMUA", "221005"));
for (const item of cases) {
  const lesson = findKnowledgeLesson("TMUA", item.code);
  assert(lesson && !lesson.partial && lesson.sections.length === 7);
  const section = lesson.sections.find((entry) => entry.code === item.code)!;
  assert.equal(section.code, item.code);
  assert.equal(section.visual, item.visual);
  assert(section.conceptFlow && section.conceptFlow.steps.length >= 3);
  assert(section.examFocus?.pastPaperPatterns?.length);
  assert.equal(
    new Set(
      section.examFocus.pastPaperPatterns.flatMap(
        (pattern) => pattern.sourceCodes ?? [],
      ),
    ).size,
    item.evidenceCount,
    "考法归纳保留独立审阅的来源",
  );
  assert(
    section.examFocus.pastPaperPatterns.every(
      (pattern) => pattern.sourceCodes?.length,
    ),
  );
  assert.equal(section.examFocus.examples.length, 2);
  const self = item.self[item.code]?.selection;
  assert(self?.kind === "bank", "自测使用独立题库，避免暴露例题答案");
  for (const example of section.examFocus.examples) {
    assert(
      example.source?.kind === "annual" && example.source.subject === "tmua",
    );
    assert(item.sources[example.source.questionCode]);
    assert.notEqual(example.source.questionCode, self.questionCode);
    assert.equal(example.question, "", "原题通过 Question 读取");
    assert(example.steps.length && example.answer && example.takeaway);
  }
  checkFormulas(lesson, item.code);
  assert.equal(findKnowledgeLesson("ESAT", item.code), null);
}
// 同一题跨知识点复用时来源必须一致，避免汇总白名单时被错误覆盖。
const merged = new Map<string, MathematicsLearningSelection>();
for (const sources of [
  tmuaQuadraticSources,
  tmuaSimultaneousSources,
  tmuaIndicesSources,
  tmuaSurdsSources,
]) {
  for (const [code, selection] of Object.entries(sources)) {
    const old = merged.get(code);
    if (old)
      assert.deepEqual(
        [selection.kind, selection.year, selection.paper],
        [old.kind, old.year, old.paper],
        code,
      );
    merged.set(code, selection);
  }
}
console.log("TMUA 指数与根式：章节、公式、来源、题量与考试隔离检查通过");
