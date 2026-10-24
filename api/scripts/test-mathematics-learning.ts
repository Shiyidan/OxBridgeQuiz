// 数学 1 全七章讲义、精选例题与自测回归：验证覆盖、题源边界、答案隔离和判分。
import assert from "node:assert/strict";
import { prisma } from "../src/services/prisma.js";
import { mathematicsLearningSources } from "../src/constants/mathematicsLearningSources.js";
import { mathematicsLearningSelfChecks } from "../src/constants/mathematicsLearningSelfChecks.js";
import {
  mathematicsQuestionWhere,
  getMathematicsLearningExample,
} from "../src/services/mathematicsLearning.js";
import {
  checkLearningSelfCheck,
  getLearningSelfCheck,
} from "../src/services/learningSelfCheck.js";
import { findKnowledgeLesson } from "../../quiz-web/src/content/knowledge/index.js";

const originalMany = prisma.question.findMany;
const originalFirst = prisma.question.findFirst;
const annual = Object.entries(mathematicsLearningSources).find(
  ([, entry]) => entry.kind === "annual",
)!;
const bank = Object.entries(mathematicsLearningSources).find(
  ([, entry]) => entry.kind === "bank",
)!;
const annualCheck = Object.entries(mathematicsLearningSelfChecks).find(
  ([, entry]) => entry.selection?.kind === "annual",
)!;
const bankCheck = Object.entries(mathematicsLearningSelfChecks).find(
  ([, entry]) => entry.selection?.kind === "bank",
)!;
assert(
  annual && bank && annualCheck && bankCheck,
  "两类题源均有实际代表题与自测",
);
assert.deepEqual(Object.keys(mathematicsLearningSelfChecks).sort(), [
  "110101",
  "110102",
  "110201",
  "110202",
  "110203",
  "110204",
  "110205",
  "110206",
  "110207",
  "110208",
  "110209",
  "110210",
  "110211",
  "110212",
  "110213",
  "110214",
  "110301",
  "110302",
  "110303",
  "110304",
  "110305",
  "110306",
  "110307",
  "110308",
  "110309",
  "110310",
  "110311",
  "110401",
  "110402",
  "110403",
  "110404",
  "110405",
  "110406",
  "110407",
  "110408",
  "110409",
  "110410",
  "110411",
  "110412",
  "110413",
  "110414",
  "110415",
  "110416",
  "110417",
  "110418",
  "110419",
  "110501",
  "110502",
  "110503",
  "110504",
  "110505",
  "110506",
  "110507",
  "110508",
  "110509",
  "110510",
  "110511",
  "110512",
  "110513",
  "110514",
  "110515",
  "110516",
  "110517",
  "110518",
  "110519",
  "110601",
  "110602",
  "110603",
  "110604",
  "110701",
  "110702",
  "110703",
  "110704",
  "110705",
  "110706",
  "110707",
]);
// 前后端必须引用同一组考纲与真实题源；章节接入遗漏不能被接口的模拟数据掩盖。
for (const code of Object.keys(mathematicsLearningSelfChecks)) {
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
    const selection = mathematicsLearningSources[example.source.questionCode];
    assert(selection, `${code} 的例题未加入读取白名单`);
    assert.equal(example.source.subject, "mathematics1");
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
}
// 全量审阅已确认的年度证据不可因换例题而丢失，关联自测必须在作答前说明边界。
for (const [chapterCode, expected] of [
  [
    "110600",
    [
      "ENGAA_2016_S1-Q007",
      "ENGAA_2016_S1-Q023",
      "ENGAA_2017_S1-Q015",
      "ESAT_LEGACY_2018_ENGAA_Q01",
      "ESAT_LEGACY_2018_NSAA_Q07",
      "NSAA_2019_S1-Q017",
      "ESAT-2020-MATHS1-012",
      "ESAT_LEGACY_2022_NSAA_Q008",
      "NSAA_2023_S1-Q004",
    ],
  ],
  [
    "110700",
    [
      "ENGAA_2016_S1-Q023",
      "NSAA_2016_S1-Q015",
      "ENGAA_2017_S1-Q023",
      "ESAT_LEGACY_2018_ENGAA_Q27",
      "ESAT_LEGACY_2018_NSAA_Q14",
      "NSAA_2019_S1-Q015",
      "ESAT-2020-MATHS1-004",
      "ESAT-2020-MATHS1-015",
      "ESAT_LEGACY_2021_NSAA_Q012",
      "ESAT_LEGACY_2021_NSAA_Q015",
      "ESAT_LEGACY_2022_NSAA_Q004",
      "ESAT_LEGACY_2022_NSAA_Q017",
      "NSAA_2023_S1-Q020",
    ],
  ],
] as const) {
  const lesson = findKnowledgeLesson("ESAT", chapterCode)!;
  const cited = new Set(
    lesson.sections.flatMap(
      (section) =>
        section.examFocus?.pastPaperPatterns?.flatMap(
          (pattern) => pattern.sourceCodes ?? [],
        ) ?? [],
    ),
  );
  for (const source of expected)
    assert(cited.has(source), `${chapterCode} 遗漏已审阅的年度证据 ${source}`);
}
for (const code of ["110602", "110604", "110702", "110703"]) {
  const section = findKnowledgeLesson("ESAT", code)!.sections.find(
    (item) => item.code === code,
  )!;
  assert(
    section.examFocus?.selfCheckNote,
    `${code} 的关联迁移自测须在作答前说明范围`,
  );
}
let count = 1;
let reads = 0;
const row = {
  id: "mathematics-selected",
  uniqueCode: "fixture-code",
  sourceQuestionCode: annual[0],
  paperId: "annual-paper",
  examType: "ESAT",
  number: 1,
  title: "What is 2 + 3?",
  subject: "Mathematics 1",
  subjectCode: "110000",
  moduleCode: "maths1",
  moduleQuestionNumber: 1,
  questionType: "single_choice",
  difficulty: "easy",
  topic: "Number",
  topicCode: "110200",
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
  paper: { title: "Annual mathematics" },
};

try {
  prisma.question.findMany = (async (query: any) => {
    reads++;
    assert.equal(query.where.examType, "ESAT");
    if (query.where.sourceQuestionCode) {
      assert.equal(query.where.moduleCode, "maths1");
      assert.equal(query.where.paper.assemblyType, "annual_subjects");
      assert.equal(query.where.paper.status, "published");
      assert.equal(query.where.paper.paperType, "realPaper");
      assert.equal(query.where.status, undefined, "年度题发布由试卷状态决定");
    } else {
      assert.equal(query.where.paperId, null);
      assert.equal(query.where.status, "published");
      assert.equal(query.where.subjectCode, "110000", "独立题必须限定数学1");
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
    assert.equal(query.where.subjectCode, "110000", "独立题必须限定数学1");
    if (query.where.id && query.where.id !== row.id) return null;
    return (await prisma.question.findMany(query))[0] || null;
  }) as typeof originalFirst;

  assert.equal(await getMathematicsLearningExample("__proto__"), null);
  assert.equal(await getMathematicsLearningExample("unselected"), null);
  assert.equal(await getLearningSelfCheck("110999"), null);
  assert.equal(reads, 0);
  // 每个正式例题都经过同一无答案入口，新增章节不能绕过年度或独立题库的发布边界。
  for (const [code, selection] of Object.entries(mathematicsLearningSources)) {
    const where = mathematicsQuestionWhere(selection);
    if (selection.kind === "annual") {
      assert.equal(where.sourceQuestionCode, selection.questionCode);
      assert.equal((where.paper as any).year, selection.year);
    } else {
      assert.equal(where.uniqueCode, selection.questionCode);
    }
    const result = await getMathematicsLearningExample(code);
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
  // 全部76个知识点逐一验证答案隔离、题目绑定和提交后判分，保留复盘题的正常作答能力。
  for (const [code, entry] of Object.entries(mathematicsLearningSelfChecks)) {
    assert(entry.selection, `${code} 应配置已审阅的自测来源`);
    const result = await getLearningSelfCheck(code);
    assert(result?.question);
    assert.equal(Object.hasOwn(result.question, "answer"), false);
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
  }
  count = 2;
  assert.equal(await getMathematicsLearningExample(annual[0]), null);
  assert.equal((await getLearningSelfCheck(annualCheck[0]))?.question, null);
  assert.equal(await checkLearningSelfCheck(annualCheck[0], row.id, "A"), null);
  count = 0;
  assert.equal(await getMathematicsLearningExample(bank[0]), null);
  assert.equal((await getLearningSelfCheck(bankCheck[0]))?.question, null);
  assert.throws(() =>
    mathematicsQuestionWhere({
      kind: "annual",
      questionCode: "invalid",
      reason: "",
    }),
  );
  console.log(
    "数学1全七章76点讲义与映射、全部精选例题、两类题源、答案隔离、判分、重复来源及下架检查通过",
  );
} finally {
  prisma.question.findMany = originalMany;
  prisma.question.findFirst = originalFirst;
  await prisma.$disconnect();
}
