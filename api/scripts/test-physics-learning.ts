// 物理全七章讲义、精选例题与自测回归：验证覆盖、题源边界、答案隔离和判分。
import assert from "node:assert/strict";
import { prisma } from "../src/services/prisma.js";
import { physicsLearningSources } from "../src/constants/physicsLearningSources.js";
import { physicsLearningSelfChecks } from "../src/constants/physicsLearningSelfChecks.js";
import {
  physicsQuestionWhere,
  getPhysicsLearningExample,
} from "../src/services/physicsLearning.js";
import {
  checkLearningSelfCheck,
  getLearningSelfCheck,
} from "../src/services/learningSelfCheck.js";
import { findKnowledgeLesson } from "../../quiz-web/src/content/knowledge/index.js";

const originalMany = prisma.question.findMany;
const originalFirst = prisma.question.findFirst;
const annual = Object.entries(physicsLearningSources).find(
  ([, entry]) => entry.kind === "annual",
)!;
const bank = Object.entries(physicsLearningSources).find(
  ([, entry]) => entry.kind === "bank",
)!;
const annualCheck = Object.entries(physicsLearningSelfChecks).find(
  ([, entry]) => entry.selection?.kind === "annual",
)!;
const bankCheck = Object.entries(physicsLearningSelfChecks).find(
  ([, entry]) => entry.selection?.kind === "bank",
)!;
assert(
  annual && bank && annualCheck && bankCheck,
  "两类题源均有实际代表题与自测",
);
assert.deepEqual(Object.keys(physicsLearningSelfChecks).sort(), [
  "130101",
  "130102",
  "130201",
  "130202",
  "130203",
  "130204",
  "130205",
  "130301",
  "130302",
  "130303",
  "130304",
  "130305",
  "130306",
  "130307",
  "130401",
  "130402",
  "130403",
  "130404",
  "130501",
  "130502",
  "130503",
  "130504",
  "130505",
  "130601",
  "130602",
  "130603",
  "130604",
  "130605",
  "130701",
  "130702",
  "130703",
  "130704",
]);
// 前后端必须引用同一组考纲与真实题源；章节接入遗漏不能被接口的模拟数据掩盖。
for (const code of Object.keys(physicsLearningSelfChecks)) {
  const lesson = findKnowledgeLesson("ESAT", code);
  assert(lesson, `${code} 缺少已注册讲义`);
  const section = lesson.sections.find((item) => item.code === code);
  assert(section, `${code} 缺少叶子讲解`);
  assert(section.summary && section.paragraphs.length && section.rules.length);
  assert.equal(section.example, undefined, "旧原创例题须由固定题源取代");
  assert.equal(section.check, undefined, "自测不得退回客户端内置答案");
  assert(section.visual && section.pitfalls.length && lesson.memory.length);
  assert(section.examFocus?.examples.length, `${code} 缺少精选例题`);
  assert(section.examFocus.pastPaperSummary, `${code} 缺少真题审阅结论`);
  assert(
    section.examFocus.pastPaperPatterns?.length ||
      section.examFocus.pastPaperNote,
    `${code} 无直接真题时须解释题源边界`,
  );
  for (const pattern of section.examFocus.pastPaperPatterns ?? []) {
    assert(pattern.sourceCodes?.length, `${code} 考法缺少真实题号依据`);
    assert.equal(new Set(pattern.sourceCodes).size, pattern.sourceCodes.length);
  }
  for (const example of section.examFocus.examples) {
    assert(example.source, `${code} 必须使用真实题源`);
    const selection = physicsLearningSources[example.source.questionCode];
    assert(selection, `${code} 的例题未加入读取白名单`);
    assert.equal(example.source.subject, "physics");
    assert.equal(example.source.kind, selection.kind);
    assert(example.answer && example.steps.length && example.takeaway);
    assert.equal(
      example.question,
      "",
      "原题正文从 Question 读取，不复制到讲义",
    );
  }
  for (const sourceId of section.sourceIds) {
    assert(
      lesson.sources.some((source) => source.id === sourceId),
      `${code} 参考来源缺失`,
    );
  }
  assert.equal(findKnowledgeLesson("TMUA", code), null);
  if (
    /关联|迁移|复盘/.test(
      physicsLearningSelfChecks[code]!.selection?.reason || "",
    )
  ) {
    assert(
      section.examFocus.selfCheckNote,
      `${code} 的非直接自测须提前说明训练范围`,
    );
  }
}
let count = 1;
let reads = 0;
let canReadSolutions = false;
const row = {
  id: "physics-selected",
  uniqueCode: "fixture-code",
  sourceQuestionCode: annual[0],
  paperId: "annual-paper",
  examType: "ESAT",
  number: 1,
  title: "What is 2 + 3?",
  subject: "Physics",
  subjectCode: "130000",
  moduleCode: "physics",
  moduleQuestionNumber: 1,
  questionType: "single_choice",
  difficulty: "easy",
  topic: "Number",
  topicCode: "130300",
  knowledgePoints: [],
  meta: { source: { examType: "NSAA", year: annual[1].year }, answer: ["B"] },
  status: "draft",
  content: {
    blocks: [{ type: "paragraph", text: "What is 2 + 3?" }],
    options: [
      { label: "A", text: "5" },
      { label: "B", text: "6" },
    ],
    images: [],
  },
  solution: { answer: ["A"], correctSolution: "Submission-only explanation." },
  paper: { title: "Annual physics" },
};

try {
  prisma.question.findMany = (async (query: any) => {
    reads++;
    if (!canReadSolutions) {
      assert.equal(query.select.solution, undefined, "未作答查询不得读取解析");
    }
    assert.equal(query.where.examType, "ESAT");
    if (query.where.sourceQuestionCode) {
      assert.equal(query.where.moduleCode, "physics");
      assert.equal(query.where.paper.assemblyType, "annual_subjects");
      assert.equal(query.where.paper.status, "published");
      assert.equal(query.where.paper.paperType, "realPaper");
      assert.equal(query.where.status, undefined, "年度题发布由试卷状态决定");
    } else {
      assert.equal(query.where.paperId, null);
      assert.equal(query.where.status, "published");
      assert.equal(query.where.subjectCode, "130000", "独立题必须限定物理");
    }
    return Array.from({ length: count }, (_, index) =>
      Object.fromEntries(
        Object.keys(query.select).map((key) => [
          key,
          key === "id" ? `${row.id}${index || ""}` : (row as any)[key],
        ]),
      ),
    );
  }) as typeof originalMany;
  prisma.question.findFirst = (async (query: any) => {
    assert.equal(query.where.paperId, null);
    assert.equal(query.where.status, "published");
    assert.equal(query.where.subjectCode, "130000", "独立题必须限定物理");
    if (query.where.id && query.where.id !== row.id) return null;
    return (await prisma.question.findMany(query))[0] || null;
  }) as typeof originalFirst;

  assert.equal(await getPhysicsLearningExample("__proto__"), null);
  assert.equal(await getPhysicsLearningExample("unselected"), null);
  assert.equal(await getLearningSelfCheck("130999"), null);
  assert.equal(reads, 0);
  // 每个正式例题都经过同一无答案入口，新增章节不能绕过年度或独立题库的发布边界。
  for (const [code, selection] of Object.entries(physicsLearningSources)) {
    assert.equal(code, selection.questionCode, "题源键与实际题号必须一致");
    const where = physicsQuestionWhere(selection);
    if (selection.kind === "annual") {
      assert.equal(where.sourceQuestionCode, selection.questionCode);
      assert.equal((where.paper as any).year, selection.year);
    } else {
      assert.equal(where.uniqueCode, selection.questionCode);
    }
    const result = await getPhysicsLearningExample(code);
    assert(result?.question);
    if (selection.kind === "annual") {
      assert(result.source.originLabel.includes(String(selection.year)));
      if (selection.exam)
        assert(result.source.originLabel.includes(selection.exam));
      if (!selection.exam || !selection.paper || !selection.questionNumber)
        assert.equal(
          result.source.originLabel.includes("第"),
          false,
          "未核准原卷位置时不得显示推测题号",
        );
    }
    assert.equal(Object.hasOwn(result.question, "answer"), false);
    assert.equal(Object.hasOwn(result.question, "learning_analysis"), false);
    assert.equal(JSON.stringify(result).includes("Submission-only"), false);
  }
  // 全部32个知识点逐一验证答案隔离、题目绑定和提交后判分，保留复盘题的正常作答能力。
  for (const [code, entry] of Object.entries(physicsLearningSelfChecks)) {
    assert(entry.selection, `${code} 应配置已审阅的自测来源`);
    const result = await getLearningSelfCheck(code);
    assert(result?.question);
    assert.equal(Object.hasOwn(result.question, "answer"), false);
    canReadSolutions = true;
    assert.equal(await checkLearningSelfCheck(code, "wrong-id", "A"), null);
    assert.equal(await checkLearningSelfCheck(code, row.id, "Z"), null);
    assert.equal(
      (await checkLearningSelfCheck(code, row.id, "A"))?.isCorrect,
      true,
    );
    assert.equal(
      (await checkLearningSelfCheck(code, row.id, "B"))?.isCorrect,
      false,
    );
    assert.equal(
      (await checkLearningSelfCheck(code, row.id, "A"))?.question
        .learning_analysis.correct_solution,
      row.solution.correctSolution,
    );
    canReadSolutions = false;
  }
  count = 2;
  assert.equal(await getPhysicsLearningExample(annual[0]), null);
  assert.equal((await getLearningSelfCheck(annualCheck[0]))?.question, null);
  canReadSolutions = true;
  assert.equal(await checkLearningSelfCheck(annualCheck[0], row.id, "A"), null);
  canReadSolutions = false;
  count = 0;
  assert.equal(await getPhysicsLearningExample(bank[0]), null);
  assert.equal((await getLearningSelfCheck(bankCheck[0]))?.question, null);
  assert.throws(() =>
    physicsQuestionWhere({
      kind: "annual",
      questionCode: "invalid",
      reason: "",
    }),
  );
  console.log(
    "物理全七章32点讲义与映射、全部精选例题、两类题源、答案隔离、判分、重复来源及下架检查通过",
  );
} finally {
  prisma.question.findMany = originalMany;
  prisma.question.findFirst = originalFirst;
  await prisma.$disconnect();
}
