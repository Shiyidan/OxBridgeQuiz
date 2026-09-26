// 维护 2026-09-05 管理端趋势修正：默认预览，只写独立修正表，支持撤销，不修改用户业务记录。
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { config } from "../src/config.js";
import { prisma } from "../src/services/prisma.js";
import { ACCOUNT_STATUS } from "../src/constants/auth.js";
import { EXAM_RECORD_STATUS, USER_ROLE } from "../src/constants/domain.js";
import {
  getStudentBehaviorAnalytics,
  productModuleFromPaperType,
} from "../src/services/behaviorAnalytics.js";

const date = new Date("2026-09-05T00:00:00.000Z");
const filters = {
  startAt: new Date("2026-09-04T16:00:00.000Z"),
  endAt: new Date("2026-09-05T16:00:00.000Z"),
};
const reason =
  "按运营确认，仅将 2026-09-05 每日产品使用趋势中的试题库练习次数显示为 0，保留原始记录及其他统计。";
const args = process.argv.slice(2);
const mode = args.includes("--apply")
  ? "apply"
  : args.includes("--rollback")
    ? "rollback"
    : "dry-run";
assert.ok(
  !(args.includes("--apply") && args.includes("--rollback")),
  "Choose one action",
);
for (const arg of args)
  assert.ok(
    [
      "--apply",
      "--rollback",
      "--dry-run",
      "--confirm=SEPT05_TREND_ONLY",
    ].includes(arg) || arg.startsWith("--expected-database="),
    `Unsupported argument: ${arg}`,
  );
assert.equal(
  config.runtimeEnv,
  "prod",
  "This correction is only approved for production",
);
const expectedDatabase = args
  .find((arg) => arg.startsWith("--expected-database="))
  ?.split("=")[1];
assert.ok(
  expectedDatabase,
  "Provide --expected-database from private deployment configuration",
);
assert.equal(
  new URL(process.env.DATABASE_URL!).pathname.slice(1),
  expectedDatabase,
  "Database mismatch",
);
if (mode !== "dry-run")
  assert.ok(
    args.includes("--confirm=SEPT05_TREND_ONLY"),
    "Back up production before applying this confirmed correction",
  );

// 原始答卷和答题以摘要对比，不向控制台输出用户身份或答案内容。
async function sourceSnapshot() {
  const records = await prisma.examRecord.findMany({
    where: {
      status: EXAM_RECORD_STATUS.SUBMITTED,
      submittedAt: { gte: filters.startAt, lt: filters.endAt },
      user: {
        role: USER_ROLE.STUDENT,
        accountStatus: { not: ACCOUNT_STATUS.BANNED },
      },
    },
    include: {
      paper: { select: { paperType: true } },
      answers: { orderBy: { id: "asc" } },
    },
    orderBy: { id: "asc" },
  });
  const target = records.filter(
    (record) =>
      productModuleFromPaperType(record.paper.paperType) === "question_bank",
  );
  return {
    practices: target.length,
    answers: target.reduce((sum, record) => sum + record.answers.length, 0),
    users: new Set(target.map((record) => record.userId)).size,
    digest: createHash("sha256").update(JSON.stringify(records)).digest("hex"),
  };
}

try {
  const before = await sourceSnapshot();
  const analyticsBefore = await getStudentBehaviorAnalytics(filters);
  const existing = await prisma.productUsageTrendOverride.findUnique({
    where: { businessDate: date },
  });
  assert.equal(
    before.practices,
    213,
    "Original count changed; review before proceeding",
  );
  assert.equal(
    before.answers,
    861,
    "Original answers changed; review before proceeding",
  );
  assert.equal(
    before.users,
    3,
    "Affected user count changed; review before proceeding",
  );
  if (existing) {
    assert.equal(
      existing.questionBankPracticeCount,
      0,
      "Conflicting override exists",
    );
    assert.equal(
      existing.reason,
      reason,
      "Unrecognized override; do not overwrite it",
    );
  }
  if (mode === "apply" && !existing) {
    await prisma.productUsageTrendOverride.create({
      data: { businessDate: date, questionBankPracticeCount: 0, reason },
    });
  } else if (mode === "rollback" && existing) {
    await prisma.productUsageTrendOverride.deleteMany({
      where: { businessDate: date, questionBankPracticeCount: 0, reason },
    });
  }
  const analyticsAfter = await getStudentBehaviorAnalytics(filters);
  assert.deepEqual(
    await sourceSnapshot(),
    before,
    "Source records must remain unchanged",
  );
  const expected = structuredClone(analyticsBefore);
  if (mode !== "dry-run")
    expected.productUsage.trend[0]!.questionBankPracticeCount =
      mode === "apply" ? 0 : 213;
  assert.deepEqual(
    analyticsAfter,
    expected,
    "Only the single trend value may change",
  );
  console.log(
    JSON.stringify({
      mode,
      date: "2026-09-05",
      originalPractices: before.practices,
      originalAnswers: before.answers,
      users: before.users,
      displayCount:
        analyticsAfter.productUsage.trend[0]!.questionBankPracticeCount,
      sourceUnchanged: true,
      otherStatisticsUnchanged: true,
    }),
  );
} finally {
  await prisma.$disconnect();
}
