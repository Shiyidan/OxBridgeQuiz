// TMUA 二次函数样板回归：检查真实题源边界、跨考试隔离和自测答案保护。
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { prisma } from "../src/services/prisma.js";
import {
  tmuaQuadraticSources,
  tmuaQuadraticSelfChecks,
} from "../src/constants/tmuaQuadratic.js";
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

// 递归核验讲义公式及意外转义的控制字符，避免正文中出现裸露命令。
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

const lesson = findKnowledgeLesson("TMUA", "221003");
assert(lesson && !lesson.partial && lesson.sections.length === 7);
checkFormulas(lesson, "tmuaQuadratic");
assert(findKnowledgeLesson("TMUA", "221000"));
assert(findKnowledgeLesson("TMUA", "221005"));
assert.equal(findKnowledgeLesson("ESAT", "221003"), null);
assert(findKnowledgeLesson("ESAT", "120103"));
const section = lesson.sections.find((item) => item.code === "221003")!;
assert(
  section.visual === "tmua-quadratic" && section.examFocus?.pastPaperSummary,
);
assert(section.conceptFlow && section.conceptFlow.steps.length >= 3);
assert.equal(section.examFocus.examples.length, 2, "样板最多展示两道精选真题");
assert.deepEqual(
  section.examFocus.examples
    .map((example) => tmuaQuadraticSources[example.source!.questionCode]!.paper)
    .sort(),
  ["paper1", "paper2"],
  "两道例题分别展示数学应用和数学推理",
);
assert(
  section.examFocus.pastPaperPatterns?.every(
    (pattern) => pattern.sourceCodes?.length,
  ),
);
// 全量审阅的年度题要作为考法依据保留，不能只剩页面中展示的两道例题。
const evidence = new Set(
  section.examFocus.pastPaperPatterns.flatMap(
    (pattern) => pattern.sourceCodes || [],
  ),
);
assert.deepEqual(
  [...evidence].sort(),
  [
    "TMUA-2017-P1-Q005",
    "TMUA-2017-P1-Q007",
    "TMUA-2017-P1-Q019",
    "TMUA-2017-P2-Q014",
    "TMUA-2018-P1-Q004",
    "TMUA-2018-P1-Q015",
    "TMUA-2018-P1-Q016",
    "TMUA-2018-P2-Q009",
    "TMUA-2018-P2-Q020",
    "TMUA-2019-P1-Q001",
    "TMUA-2019-P1-Q002",
    "TMUA-2019-P1-Q007",
    "TMUA-2019-P1-Q011",
    "TMUA-2019-P1-Q013",
    "TMUA-2019-P1-Q015",
    "TMUA-2019-P1-Q018",
    "TMUA-2019-P2-Q016",
    "TMUA-2020-P1-Q005",
    "TMUA-2020-P1-Q006",
    "TMUA-2020-P1-Q008",
    "TMUA-2020-P1-Q009",
    "TMUA-2020-P1-Q010",
    "TMUA-2020-P1-Q015",
    "TMUA-2020-P1-Q017",
    "TMUA-2020-P1-Q018",
    "TMUA-2020-P1-Q019",
    "TMUA-2020-P1-Q020",
    "TMUA-2020-P2-Q001",
    "TMUA-2020-P2-Q018",
    "TMUA_2021_P1_Q04",
    "TMUA_2021_P1_Q08",
    "TMUA_2021_P1_Q12",
    "TMUA_2021_P1_Q18",
    "TMUA_2021_P2_Q11",
    "TMUA_2021_P2_Q16",
    "TMUA_2022_P1_Q01",
    "TMUA_2022_P1_Q09",
    "TMUA_2022_P1_Q12",
    "TMUA_2022_P1_Q13",
    "TMUA_2022_P1_Q16",
    "TMUA_2022_P1_Q20",
    "TMUA_2022_P2_Q01",
    "TMUA_2022_P2_Q07",
    "TMUA_2023_P1_Q02",
    "TMUA_2023_P1_Q07",
    "TMUA_2023_P1_Q11",
    "TMUA_2023_P1_Q15",
    "TMUA_2023_P1_Q20",
    "TMUA_2023_P2_Q10",
    "TMUA_2023_P2_Q18",
  ].sort(),
);
const self = tmuaQuadraticSelfChecks["221003"]?.selection;
assert(self);
assert(
  section.examFocus.examples.every(
    (example) =>
      example.source?.subject === "tmua" &&
      example.source.questionCode !== self.questionCode,
  ),
);
for (const example of section.examFocus.examples) {
  assert(example.source && tmuaQuadraticSources[example.source.questionCode]);
  assert.equal(example.question, "");
  assert(example.steps.length && example.answer && example.takeaway);
}

const annual = Object.values(tmuaQuadraticSources).find(
  (entry) => entry.kind === "annual",
);
const bank = Object.values(tmuaQuadraticSources).find(
  (entry) => entry.kind === "bank",
);
assert(annual && bank);
assert.equal(tmuaQuestionWhere(annual).examType, "TMUA");
assert.equal(tmuaQuestionWhere(annual).moduleCode, annual.paper);
assert.equal(
  (tmuaQuestionWhere(annual).paper as { status: string }).status,
  "published",
);
assert.equal(
  tmuaQuestionWhere(annual).status,
  undefined,
  "年度题由卷发布状态控制",
);
assert.equal(tmuaQuestionWhere(bank).paperId, null);
assert.equal(tmuaQuestionWhere(bank).status, "published");
assert.throws(() => tmuaQuestionWhere({ ...annual, paper: "wrong-paper" }));
assert.throws(() => tmuaQuestionWhere({ ...annual, year: undefined }));

const originalMany = prisma.question.findMany;
const originalFirst = prisma.question.findFirst;
let count = 1;
let mayReadSolution = false;
let reads = 0;
const row = {
  id: "tmua-fixture",
  uniqueCode: "fixture",
  sourceQuestionCode: annual.questionCode,
  paperId: "annual-paper",
  examType: "TMUA",
  number: 1,
  moduleCode: annual.paper,
  moduleOrder: 1,
  moduleQuestionNumber: 1,
  title: "Quadratic example",
  subject: "Mathematics",
  subjectCode: "220000",
  questionType: "single_choice",
  difficulty: "medium",
  topic: "Quadratic",
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
      assert.equal(query.select.solution, undefined, "提交前不可读取解析");
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

  assert.equal(await getTmuaLearningExample("__proto__"), null);
  assert.equal(await getLearningSelfCheck("221003", "ESAT"), null);
  assert.equal(await getLearningSelfCheck("120103", "TMUA"), null);
  assert.equal(reads, 0);
  for (const code of Object.keys(tmuaQuadraticSources)) {
    const result = await getTmuaLearningExample(code);
    assert(result?.question);
    assert.equal(Object.hasOwn(result.question, "answer"), false);
    assert.equal(Object.hasOwn(result.question, "learning_analysis"), false);
    assert(!JSON.stringify(result).includes("Only visible after submission."));
  }
  const question = await getLearningSelfCheck("221003", "TMUA");
  assert(question?.question);
  assert.equal(Object.hasOwn(question.question, "answer"), false);
  mayReadSolution = true;
  assert.equal(
    await checkLearningSelfCheck("221003", "wrong-id", "A", "TMUA"),
    null,
  );
  assert.equal(
    await checkLearningSelfCheck("221003", row.id, "Z", "TMUA"),
    null,
  );
  assert.equal(
    (await checkLearningSelfCheck("221003", row.id, "A", "TMUA"))?.isCorrect,
    true,
  );
  assert.equal(
    (await checkLearningSelfCheck("221003", row.id, "B", "TMUA"))?.isCorrect,
    false,
  );
  assert.equal(
    (await checkLearningSelfCheck("221003", row.id, "A", "TMUA"))?.question
      .learning_analysis.correct_solution,
    row.solution.correctSolution,
  );
  assert.equal(
    await checkLearningSelfCheck("221003", row.id, "A", "ESAT"),
    null,
  );
  mayReadSolution = false;
  count = 2;
  assert.equal(
    await getTmuaLearningExample(annual.questionCode),
    null,
    "年度题重复时拒绝猜测来源",
  );
  count = 0;
  assert.equal(
    await getTmuaLearningExample(bank.questionCode),
    null,
    "独立题下架后不可读取",
  );
  console.log(
    "TMUA 二次函数样板：考试隔离、题源、答案保护、判分与异常边界通过",
  );
} finally {
  prisma.question.findMany = originalMany;
  prisma.question.findFirst = originalFirst;
  await prisma.$disconnect();
}
