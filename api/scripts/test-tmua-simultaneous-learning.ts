// TMUA 联立方程讲义回归：核验考纲范围、题源边界、答案隔离与判分。
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { prisma } from "../src/services/prisma.js";
import {
  tmuaSimultaneousSources,
  tmuaSimultaneousSelfChecks,
} from "../src/constants/tmuaSimultaneous.js";
import { tmuaQuadraticSources } from "../src/constants/tmuaQuadratic.js";
import {
  tmuaQuestionWhere,
  getTmuaLearningExample,
} from "../src/services/tmuaLearning.js";
import {
  getLearningSelfCheck,
  checkLearningSelfCheck,
} from "../src/services/learningSelfCheck.js";
import { findKnowledgeLesson } from "../../quiz-web/src/content/knowledge/index.js";

const katex = createRequire(
  new URL("../../quiz-web/package.json", import.meta.url),
)("katex") as {
  renderToString: (
    formula: string,
    options: { throwOnError: boolean; strict: string },
  ) => string;
};

// 不允许转义控制字符或不能渲染的公式进入学习讲义。
function checkFormulas(value: unknown, path: string): void {
  if (typeof value === "string") {
    assert(
      !/[\u0000-\u0008\u000b-\u001f\t]/.test(value),
      `${path} 包含无效控制字符`,
    );
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

const lesson = findKnowledgeLesson("TMUA", "221004");
assert(lesson && !lesson.partial && lesson.sections.length === 7);
checkFormulas(lesson, "tmuaSimultaneous");
assert(findKnowledgeLesson("TMUA", "221000"), "全部完成后应支持整章入口");
assert(findKnowledgeLesson("TMUA", "221005"));
assert.equal(findKnowledgeLesson("ESAT", "221004"), null);
assert(findKnowledgeLesson("TMUA", "221003"), "原有二次函数讲义应继续可用");
assert(findKnowledgeLesson("ESAT", "120104"), "其他考试讲义应继续可用");
const section = lesson.sections.find((item) => item.code === "221004")!;
assert(
  section.visual === "tmua-simultaneous" &&
    section.conceptFlow &&
    section.examFocus?.pastPaperSummary,
);
assert(
  section.conceptFlow.steps.length >= 3 &&
    section.conceptFlow.observations.length,
);
assert(section.examFocus.pastPaperPatterns?.length);
assert(
  section.examFocus.pastPaperPatterns.every(
    (pattern) => pattern.sourceCodes?.length,
  ),
);
// 记录独立审阅的年度题目，避免考法归纳退化为只参考展示的两道例题。
assert.deepEqual(
  [
    ...new Set(
      section.examFocus.pastPaperPatterns.flatMap(
        (pattern) => pattern.sourceCodes ?? [],
      ),
    ),
  ].sort(),
  [
    "TMUA-2017-P1-Q006",
    "TMUA-2017-P1-Q007",
    "TMUA-2017-P1-Q014",
    "TMUA-2018-P1-Q004",
    "TMUA-2018-P1-Q011",
    "TMUA-2018-P1-Q014",
    "TMUA-2018-P2-Q011",
    "TMUA-2019-P1-Q006",
    "TMUA-2019-P1-Q009",
    "TMUA-2019-P1-Q011",
    "TMUA-2019-P1-Q014",
    "TMUA-2019-P1-Q020",
    "TMUA-2020-P1-Q004",
    "TMUA-2020-P1-Q007",
    "TMUA-2020-P1-Q014",
    "TMUA-2020-P1-Q016",
    "TMUA-2020-P1-Q017",
    "TMUA-2020-P2-Q001",
    "TMUA_2021_P1_Q01",
    "TMUA_2021_P1_Q08",
    "TMUA_2021_P2_Q11",
    "TMUA_2021_P2_Q14",
    "TMUA_2021_P2_Q15",
    "TMUA_2021_P2_Q16",
    "TMUA_2022_P1_Q09",
    "TMUA_2022_P1_Q20",
    "TMUA_2023_P1_Q02",
  ].sort(),
);
assert(
  section.examFocus.examples.length > 0 &&
    section.examFocus.examples.length <= 2,
  "最多选两道真题",
);
const self = tmuaSimultaneousSelfChecks["221004"]?.selection;
assert(self);
const annualQuestions = new Set([
  ...section.examFocus.examples
    .filter((example) => example.source?.kind === "annual")
    .map((example) => example.source!.questionCode),
  ...(self.kind === "annual" ? [self.questionCode] : []),
]);
assert(annualQuestions.size <= 2, "例题和自测合计最多选用两道真题");
for (const example of section.examFocus.examples) {
  assert(
    example.source?.subject === "tmua" && example.source.kind === "annual",
  );
  assert.notEqual(
    example.source.questionCode,
    self.questionCode,
    "自测不重复本节例题",
  );
  assert(tmuaSimultaneousSources[example.source.questionCode]);
  assert.equal(example.question, "", "原题始终由 Question 读取");
  assert(example.steps.length && example.answer && example.takeaway);
}
// 跨章节复用题源时必须指向同一考试、同一年与同一卷，防止聚合时发生静默覆盖。
for (const [code, selected] of Object.entries(tmuaSimultaneousSources)) {
  const prior = tmuaQuadraticSources[code];
  if (prior) {
    assert.equal(selected.kind, prior.kind, code);
    assert.equal(selected.year, prior.year, code);
    assert.equal(selected.paper, prior.paper, code);
  }
}

const originalMany = prisma.question.findMany;
const originalFirst = prisma.question.findFirst;
let count = 1;
let mayReadSolution = false;
let reads = 0;
const row = {
  id: "tmua-simultaneous-fixture",
  uniqueCode: "fixture",
  sourceQuestionCode: "fixture-source",
  paperId: "annual-paper",
  examType: "TMUA",
  number: 1,
  moduleCode: "paper1",
  moduleOrder: 1,
  moduleQuestionNumber: 1,
  title: "Simultaneous example",
  subject: "Mathematics",
  subjectCode: "220000",
  questionType: "single_choice",
  difficulty: "medium",
  topic: "Simultaneous",
  topicCode: "221000",
  knowledgePoints: [],
  meta: { source: { examType: "TMUA" } },
  content: {
    blocks: [{ type: "paragraph", text: "Choose the correct result." }],
    images: [],
    options: [
      { label: "A", text: "One" },
      { label: "B", text: "Two" },
    ],
  },
  solution: {
    answer: ["A"],
    correctSolution: "Only visible after submission.",
  },
  paper: { title: "TMUA 2020 年诊断测试" },
};

try {
  prisma.question.findMany = (async (query: any) => {
    reads++;
    assert.equal(query.where.examType, "TMUA");
    if (!mayReadSolution)
      assert.equal(query.select.solution, undefined, "作答前不得读取解析");
    if (query.where.sourceQuestionCode) {
      assert(["paper1", "paper2"].includes(query.where.moduleCode));
      assert.equal(query.where.paper.status, "published");
      assert.equal(query.where.paper.assemblyType, "annual_subjects");
    } else {
      assert.equal(query.where.paperId, null);
      assert.equal(query.where.status, "published");
    }
    return Array.from({ length: count }, (_, i) =>
      Object.fromEntries(
        Object.keys(query.select).map((key) => [
          key,
          key === "id" ? `${row.id}${i || ""}` : (row as any)[key],
        ]),
      ),
    );
  }) as typeof originalMany;
  prisma.question.findFirst = (async (query: any) => {
    if (query.where.id && query.where.id !== row.id) return null;
    return (await prisma.question.findMany(query))[0] || null;
  }) as typeof originalFirst;

  assert.equal(await getLearningSelfCheck("221004", "ESAT"), null);
  assert.equal(await getLearningSelfCheck("120104", "TMUA"), null);
  assert.equal(await getTmuaLearningExample("__proto__"), null);
  assert.equal(reads, 0);
  for (const [code, selection] of Object.entries(tmuaSimultaneousSources)) {
    assert.equal(code, selection.questionCode);
    assert.equal(tmuaQuestionWhere(selection).examType, "TMUA");
    const result = await getTmuaLearningExample(code);
    assert(result?.question);
    assert.equal(Object.hasOwn(result.question, "answer"), false);
    assert.equal(Object.hasOwn(result.question, "learning_analysis"), false);
    assert(!JSON.stringify(result).includes("Only visible after submission."));
  }
  const question = await getLearningSelfCheck("221004", "TMUA");
  assert(question?.question);
  assert.equal(Object.hasOwn(question.question, "answer"), false);
  mayReadSolution = true;
  assert.equal(
    await checkLearningSelfCheck("221004", "wrong-id", "A", "TMUA"),
    null,
  );
  assert.equal(
    await checkLearningSelfCheck("221004", row.id, "Z", "TMUA"),
    null,
  );
  assert.equal(
    (await checkLearningSelfCheck("221004", row.id, "A", "TMUA"))?.isCorrect,
    true,
  );
  assert.equal(
    (await checkLearningSelfCheck("221004", row.id, "B", "TMUA"))?.isCorrect,
    false,
  );
  assert.equal(
    (await checkLearningSelfCheck("221004", row.id, "A", "TMUA"))?.question
      .learning_analysis.correct_solution,
    row.solution.correctSolution,
  );
  assert.equal(
    await checkLearningSelfCheck("221004", row.id, "A", "ESAT"),
    null,
  );
  mayReadSolution = false;
  count = 2;
  const annual = Object.values(tmuaSimultaneousSources).find(
    (entry) => entry.kind === "annual",
  )!;
  assert.equal(
    await getTmuaLearningExample(annual.questionCode),
    null,
    "年度来源重复时不能猜测题目",
  );
  count = 0;
  assert.equal(
    (await getLearningSelfCheck("221004", "TMUA"))?.question,
    null,
    "题目失效时显示不可用",
  );
  console.log("TMUA 联立方程：考纲、题源、公式、考试隔离与自测判分通过");
} finally {
  prisma.question.findMany = originalMany;
  prisma.question.findFirst = originalFirst;
  await prisma.$disconnect();
}
