// 免费学习与直接练习回归：核对讲义资源、精确选题范围和旧答卷授权，不连接或修改数据库。
import assert from "node:assert/strict";
import {
  FREE_LEARNING_SECTION_CODES,
  isFreeLearningResource,
  isFreePracticeScope,
} from "../src/constants/freeLearningAccess.js";
import {
  FREE_LEARNING_SECTION_CODES as frontendCodes,
  isFreeLearningScope,
} from "../../quiz-web/src/constants/freeLearningAccess.js";
import { findKnowledgeLesson } from "../../quiz-web/src/content/knowledge/freeLessons.js";
import {
  freePracticeRecordScope,
  hasPracticeRecordAccess,
} from "../src/services/freePracticeAccess.js";
import { checkMemberAccess } from "../src/services/member.js";
import {
  startDirectQuestionBankPractice,
  QuestionBankPracticeError,
} from "../src/services/questionBankPractice.js";
import { prisma } from "../src/services/prisma.js";
import { PRACTICE_SOURCE, USER_ROLE } from "../src/constants/domain.js";
import { ACCOUNT_STATUS } from "../src/constants/auth.js";

assert.deepEqual(frontendCodes, FREE_LEARNING_SECTION_CODES);
assert.equal(isFreeLearningResource("GET", "/__proto__/examples/anything"), false);
assert.equal(FREE_LEARNING_SECTION_CODES.length, 10);
for (const code of FREE_LEARNING_SECTION_CODES) {
  assert.equal(isFreePracticeScope("ESAT", code), true);
  assert.equal(isFreePracticeScope("TMUA", code), false);
  assert.equal(isFreeLearningResource("GET", `/esat/self-check/${code}`), true);
  assert.equal(
    isFreeLearningResource("POST", `/esat/self-check/${code}/answer`),
    true,
  );
  assert.equal(
    isFreeLearningResource("POST", `/esat/self-check/${code}`),
    false,
  );
  assert.equal(
    isFreeLearningResource("GET", `/tmua/self-check/${code}`),
    false,
  );
  const lesson = findKnowledgeLesson("ESAT", code)!;
  assert.ok(lesson);
  assert.equal(lesson.sections.length, 2);
  assert.equal(isFreeLearningScope("ESAT", lesson.code), true);
  assert.equal(isFreePracticeScope("ESAT", lesson.code), false);
  assert.ok(
    lesson.sections.every((section) =>
      isFreePracticeScope("ESAT", section.code),
    ),
  );
  const section = lesson.sections.find((item) => item.code === code)!;
  for (const example of section.examFocus?.examples || []) {
    if (!example.source) continue;
    const path = `/${example.source.subject || "biology"}/examples/${example.source.questionCode}`;
    assert.equal(isFreeLearningResource("GET", path), true, path);
    assert.equal(isFreeLearningResource("GET", `${path}/analysis`), true, path);
    assert.equal(isFreeLearningResource("POST", path), false);
  }
  for (const pattern of section.examFocus?.pastPaperPatterns || []) {
    for (const source of pattern.sourceCodes || []) {
      assert.equal(
        isFreeLearningResource("GET", `/pattern/examples/${source}`),
        true,
        source,
      );
    }
  }
}
for (const code of [
  "",
  "110000",
  "110100",
  "110201",
  "110202",
  "120103",
  "130103",
  "140103",
  "150103",
  "221001",
  "110101/extra",
]) {
  assert.equal(isFreePracticeScope("ESAT", code), false, code);
  assert.equal(
    isFreeLearningResource("GET", `/esat/self-check/${code}`),
    false,
    code,
  );
}
assert.equal(findKnowledgeLesson("ESAT", "110201"), null);
assert.equal(findKnowledgeLesson("TMUA", "110101"), null);
assert.equal(
  isFreeLearningResource("GET", "/physics/examples/NSAA_2016_S1-Q057"),
  false,
);
assert.equal(
  isFreeLearningResource("GET", "/biology/examples/unknown/analysis"),
  false,
);
console.log(
  "PASS ten free leaves, trimmed chapters, exact resource paths and paid boundaries",
);

// 事务替身记录数据库过滤条件，覆盖真实开始服务而不向开发库写入测试数据。
let currentCode: string = FREE_LEARNING_SECTION_CODES[0];
let activeRecord: any = null;
let previousRecord: any = null;
let questionReads = 0;
let member = false;
let existingUser = true;
const db = {
  user: {
    findUnique: async () =>
      existingUser ? { id: "user", role: USER_ROLE.STUDENT } : null,
    update: async () => ({ accountStatus: ACCOUNT_STATUS.ACTIVE }),
  },
  userMembership: {
    findMany: async () =>
      member
        ? [
            {
              status: "active",
              plan: "annual_practice",
              startsAt: new Date(0),
              endsAt: new Date("2099-01-01"),
            },
          ]
        : [],
  },
  entitlementConfig: { findFirst: async () => ({ questionBankLimit: 9999 }) },
  answerRecord: { count: async () => 9999 },
  syllabusNode: {
    findMany: async () => [
      {
        id: "free-node",
        code: currentCode,
        parentCode: null,
        cnLabel: "免费点",
        enLabel: "Free point",
      },
      {
        id: "paid-node",
        code: "paid-point",
        parentCode: null,
        cnLabel: "会员点",
        enLabel: "Paid point",
      },
    ],
  },
  question: {
    count: async ({ where }: any) => {
      questionReads++;
      assert.equal(where.examType, "ESAT");
      assert.equal(where.paperId, null);
      assert.deepEqual(where.knowledgePointLinks, {
        some: { syllabusNodeId: { in: ["free-node"] } },
      });
      return 1;
    },
    findMany: async ({ select }: any) => {
      assert.equal(select.solution, undefined);
      assert.equal(select.content, undefined);
      return [{ id: "question", subject: "数学1", subjectCode: "maths1" }];
    },
  },
  paper: { upsert: async () => ({}) },
  examRecord: {
    findUnique: async () => previousRecord,
    findFirst: async () => activeRecord,
    create: async ({ data }: any) => ({
      ...data,
      id: "exam",
      practiceNotebookId: null,
    }),
  },
} as any;

const originalTransaction = prisma.$transaction;
prisma.$transaction = (async (callback: any) =>
  callback(db)) as typeof prisma.$transaction;
try {
  for (const code of FREE_LEARNING_SECTION_CODES) {
    currentCode = code;
    assert.equal(
      (await checkMemberAccess("user", "question-bank", "ESAT", 5, db, code))
        .allowed,
      true,
    );
    const started = await startDirectQuestionBankPractice("user", {
      examType: "ESAT",
      difficulty: "easy",
      code,
      requestId: `free-${code}`,
    });
    assert.equal(started.isResumed, false);
    assert.equal(started.record.practiceSnapshot.knowledgePoint.code, code);
    assert.equal(freePracticeRecordScope(started.record), code);
    assert.equal(
      await hasPracticeRecordAccess("user", started.record, db),
      true,
    );
    activeRecord = started.record;
    // 续答依赖原记录范围，跳转其他知识点仍返回原免费练习。
    const resumed = await startDirectQuestionBankPractice("user", {
      examType: "ESAT",
      difficulty: "hard",
      code: "paid-point",
      requestId: `resume-${code}`,
    });
    assert.equal(resumed.isResumed, true);
    assert.equal(resumed.record, activeRecord);
    activeRecord = null;
  }
  const readCount = questionReads;
  for (const [examType, code] of [
    ["ESAT", undefined],
    ["ESAT", "110100"],
    ["ESAT", "110201"],
    ["ESAT", "120103"],
    ["TMUA", "110101"],
  ] as const) {
    assert.equal(
      (await checkMemberAccess("user", "question-bank", examType, 5, db, code))
        .allowed,
      false,
    );
    await assert.rejects(
      startDirectQuestionBankPractice("user", {
        examType,
        difficulty: "easy",
        code,
        requestId: "blocked-start",
      }),
      (error: unknown) =>
        error instanceof QuestionBankPracticeError &&
        error.code === "QUESTION_BANK_ACCESS_DENIED",
    );
  }
  assert.equal(questionReads, readCount, "会员范围在读取题目前被拒绝");
  const record = {
    examType: "ESAT",
    paperId: "question-bank",
    practiceNotebookId: null,
    practiceSource: PRACTICE_SOURCE.DIRECT,
    totalQuestions: 1,
    practiceSnapshot: {
      source: PRACTICE_SOURCE.DIRECT,
      knowledgePoint: { code: "110101" },
    },
  };
  for (const invalid of [
    { ...record, examType: "TMUA" },
    { ...record, paperId: "real-paper" },
    { ...record, practiceNotebookId: "notebook" },
    { ...record, practiceSource: null },
    { ...record, practiceSnapshot: null },
    {
      ...record,
      practiceSnapshot: {
        source: PRACTICE_SOURCE.DIRECT,
        knowledgePoint: { code: "110100" },
      },
    },
    {
      ...record,
      practiceSnapshot: {
        source: PRACTICE_SOURCE.DIRECT,
        knowledgePoint: { code: "110201" },
      },
    },
  ]) {
    assert.equal(freePracticeRecordScope(invalid), undefined);
    assert.equal(await hasPracticeRecordAccess("user", invalid, db), false);
    activeRecord = invalid;
    await assert.rejects(
      startDirectQuestionBankPractice("user", {
        examType: "ESAT",
        difficulty: "easy",
        code: "110101",
        requestId: "free-start",
      }),
      QuestionBankPracticeError,
    );
    activeRecord = null;
    previousRecord = invalid;
    await assert.rejects(
      startDirectQuestionBankPractice("user", {
        examType: "ESAT",
        difficulty: "easy",
        code: "110101",
        requestId: "free-start",
      }),
      QuestionBankPracticeError,
    );
    previousRecord = null;
  }
  existingUser = false;
  assert.equal(
    (await checkMemberAccess("user", "question-bank", "ESAT", 1, db, "110101"))
      .allowed,
    false,
  );
  existingUser = true;
  member = true;
  assert.equal(
    (await checkMemberAccess("user", "question-bank", "ESAT", 5, db, "110201"))
      .allowed,
    true,
  );
  assert.equal(
    await hasPracticeRecordAccess(
      "user",
      { ...record, practiceSnapshot: null },
      db,
    ),
    true,
  );
  console.log(
    "PASS start/resume, fixed scope, no question reads on denial, member access and legacy records",
  );
} finally {
  prisma.$transaction = originalTransaction;
  await prisma.$disconnect();
}
