// TMUA 代数与函数整章回归：核验章节导航、七个叶子与新增题源。
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { findKnowledgeLesson } from "../../quiz-web/src/content/knowledge/index.js";
import { tmuaIndicesSources } from "../src/constants/tmuaIndices.js";
import { tmuaSurdsSources } from "../src/constants/tmuaSurds.js";
import { tmuaQuadraticSources } from "../src/constants/tmuaQuadratic.js";
import { tmuaSimultaneousSources } from "../src/constants/tmuaSimultaneous.js";
import {
  tmuaInequalitiesSources,
  tmuaInequalitiesSelfChecks,
} from "../src/constants/tmuaInequalities.js";
import {
  tmuaPolynomialsSources,
  tmuaPolynomialsSelfChecks,
} from "../src/constants/tmuaPolynomials.js";
import {
  tmuaFunctionsSources,
  tmuaFunctionsSelfChecks,
} from "../src/constants/tmuaFunctions.js";
import type { MathematicsLearningSelection } from "../src/constants/mathematicsLearningTypes.js";

const katex = createRequire(
  new URL("../../quiz-web/package.json", import.meta.url),
)("katex") as {
  renderToString: (
    formula: string,
    options: { throwOnError: boolean; strict: string },
  ) => string;
};
// 检查所有文本中的数学公式，防止表达式在学生页面裸露或报错。
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
const order = [
  "221001",
  "221002",
  "221003",
  "221004",
  "221005",
  "221006",
  "221007",
];
const chapter = findKnowledgeLesson("TMUA", "221000");
assert(chapter && !chapter.partial);
assert.deepEqual(
  chapter.sections.map((section) => section.code),
  order,
);
for (const code of order) {
  const lesson = findKnowledgeLesson("TMUA", code);
  assert(lesson && !lesson.partial);
  assert.deepEqual(
    lesson.sections.map((section) => section.code),
    order,
  );
  assert.equal(findKnowledgeLesson("ESAT", code), null);
}
assert.equal(
  findKnowledgeLesson("TMUA", "222000"),
  null,
  "未完成章节不能冒充已上线",
);
const cases = [
  {
    code: "221005",
    visual: "tmua-inequalities",
    sources: tmuaInequalitiesSources,
    self: tmuaInequalitiesSelfChecks,
    evidenceCount: 27,
  },
  {
    code: "221006",
    visual: "tmua-polynomials",
    sources: tmuaPolynomialsSources,
    self: tmuaPolynomialsSelfChecks,
    evidenceCount: 37,
  },
  {
    code: "221007",
    visual: "tmua-functions",
    sources: tmuaFunctionsSources,
    self: tmuaFunctionsSelfChecks,
    evidenceCount: 45,
  },
];
for (const item of cases) {
  const section = chapter.sections.find((entry) => entry.code === item.code)!;
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
  );
  assert(
    section.examFocus.pastPaperPatterns.every(
      (pattern) => pattern.sourceCodes?.length,
    ),
  );
  assert.equal(section.examFocus.examples.length, 2);
  const self = item.self[item.code]?.selection;
  assert(self?.kind === "bank", "自测来自独立题库");
  for (const example of section.examFocus.examples) {
    assert(
      example.source?.kind === "annual" && example.source.subject === "tmua",
    );
    assert(item.sources[example.source.questionCode]);
    assert.notEqual(example.source.questionCode, self.questionCode);
    assert.equal(example.question, "");
    assert(example.steps.length && example.answer && example.takeaway);
  }
  checkFormulas(section, item.code);
}
// 同一题跨节引用时题源必须保持同一考试、年份和卷别。
const merged = new Map<string, MathematicsLearningSelection>();
for (const sources of [
  tmuaIndicesSources,
  tmuaSurdsSources,
  tmuaQuadraticSources,
  tmuaSimultaneousSources,
  tmuaInequalitiesSources,
  tmuaPolynomialsSources,
  tmuaFunctionsSources,
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
console.log("TMUA 代数与函数：七节、整章入口、公式、题源与考试隔离检查通过");
