// 本地真实数据库回归：只修正指定日期趋势点，验证汇总、其他日期、原始答卷和答题不变，并验证撤销恢复。
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { config } from "../src/config.js";
import { prisma } from "../src/services/prisma.js";
import { ACCOUNT_STATUS } from "../src/constants/auth.js";
import {
  EXAM_RECORD_STATUS,
  PAPER_TYPE,
  USER_ROLE,
} from "../src/constants/domain.js";
import { getStudentBehaviorAnalytics } from "../src/services/behaviorAnalytics.js";

assert.equal(config.runtimeEnv, "local");
assert.ok(
  ["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL!).hostname,
  ),
);
const id = `trend-${randomUUID()}`;
const day = new Date("2097-09-05T00:00:00.000Z");
const filters = {
  startAt: new Date("2097-09-03T16:00:00.000Z"),
  endAt: new Date("2097-09-06T16:00:00.000Z"),
};
let overrideCreated = false;

try {
  assert.equal(
    await prisma.productUsageTrendOverride.findUnique({
      where: { businessDate: day },
    }),
    null,
  );
  await prisma.user.create({
    data: {
      id,
      username: id,
      email: `${id}@example.test`,
      password: "unused",
      role: USER_ROLE.STUDENT,
    },
  });
  await prisma.paper.create({
    data: {
      id,
      title: id,
      year: 2097,
      duration: 60,
      paperType: PAPER_TYPE.AI_PAPER,
    },
  });
  await prisma.question.create({
    data: {
      id,
      uniqueCode: id,
      paperId: id,
      title: "Fixture",
      questionType: "single_choice",
      options: [{ key: "A", content: "Fixture" }],
      answer: ["A"],
      knowledgePoints: [],
      syllabusPoints: [],
      meta: {},
    },
  });
  // 北京时间零点两侧均放置记录，防止 UTC 日期与业务日期混淆。
  const times = [
    "2097-09-04T15:59:59.999Z",
    "2097-09-04T16:00:00.000Z",
    "2097-09-05T15:59:59.999Z",
    "2097-09-05T16:00:00.000Z",
  ];
  for (const time of times)
    await prisma.examRecord.create({
      data: {
        userId: id,
        paperId: id,
        startedAt: new Date(time),
        submittedAt: new Date(time),
        status: EXAM_RECORD_STATUS.SUBMITTED,
        totalQuestions: 1,
        answers: {
          create: { questionId: id, selectedAnswer: "A", isCorrect: true },
        },
      },
    });
  const sourceBefore = await prisma.examRecord.findMany({
    where: { userId: id },
    include: { answers: true },
    orderBy: { id: "asc" },
  });
  const before = await getStudentBehaviorAnalytics(filters);
  assert.equal(
    before.productUsage.trend.find((item) => item.date === "2097-09-05")!
      .questionBankPracticeCount,
    2,
  );
  await prisma.productUsageTrendOverride.create({
    data: { businessDate: day, questionBankPracticeCount: 0, reason: id },
  });
  overrideCreated = true;
  const after = await getStudentBehaviorAnalytics(filters);
  const expected = structuredClone(before);
  expected.productUsage.trend.find(
    (item) => item.date === "2097-09-05",
  )!.questionBankPracticeCount = 0;
  assert.deepEqual(after, expected);
  assert.deepEqual(
    await prisma.examRecord.findMany({
      where: { userId: id },
      include: { answers: true },
      orderBy: { id: "asc" },
    }),
    sourceBefore,
  );
  // 单天查询与跨天查询应用同一条修正；相邻日期仍按真实完成次数展示。
  const singleDay = await getStudentBehaviorAnalytics({
    startAt: new Date(times[1]!),
    endAt: new Date(times[3]!),
  });
  assert.equal(singleDay.productUsage.trend[0]!.questionBankPracticeCount, 0);
  assert.equal(
    singleDay.productUsage.modules.find(
      (item) => item.module === "question_bank",
    )!.completionCount,
    2,
  );
  // 固定修正不能把封禁用户带回趋势，解封后恢复真实范围内的修正值。
  await prisma.productUsageTrendOverride.update({ where: { businessDate: day }, data: { questionBankPracticeCount: 999 } });
  assert.equal((await getStudentBehaviorAnalytics(filters)).productUsage.trend.find(item => item.date === '2097-09-05')!.questionBankPracticeCount, 2);
  await prisma.user.update({ where: { id }, data: { accountStatus: ACCOUNT_STATUS.BANNED } });
  const banned = await getStudentBehaviorAnalytics(filters);
  assert.ok(banned.productUsage.trend.every(item => item.questionBankPracticeCount === 0));
  assert.equal(banned.productUsage.overview.completedActivityCount, 0);
  await prisma.user.update({ where: { id }, data: { accountStatus: ACCOUNT_STATUS.ACTIVE } });
  assert.equal((await getStudentBehaviorAnalytics(filters)).productUsage.trend.find(item => item.date === '2097-09-05')!.questionBankPracticeCount, 2);
  await prisma.productUsageTrendOverride.delete({
    where: { businessDate: day },
  });
  overrideCreated = false;
  assert.deepEqual(await getStudentBehaviorAnalytics(filters), before);
  console.log(
    "PASS target date only, zero override, Beijing day boundaries, unchanged source/other analytics and rollback",
  );
} finally {
  if (overrideCreated)
    await prisma.productUsageTrendOverride.deleteMany({
      where: { businessDate: day, reason: id },
    });
  await prisma.examRecord.deleteMany({ where: { userId: id } });
  await prisma.question.deleteMany({ where: { id } });
  await prisma.paper.deleteMany({ where: { id } });
  await prisma.user.deleteMany({ where: { id } });
  await prisma.$disconnect();
}
