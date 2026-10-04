// 转化统计回归：完整观察期、首付/退款、浏览器归因和北京时间活跃去重。
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { once } from "node:events";
import express from "express";
import type { Request, Response } from "express";
import { config } from "../src/config.js";
import { prisma } from "../src/services/prisma.js";
import { adminRouter } from "../src/routes/admin.js";
import { globalErrorHandler } from "../src/middleware/error.js";
import { signAccessToken } from "../src/services/jwt.js";
import {
  USER_ROLE,
  PAYMENT_ORDER_STATUS,
  PAYMENT_PRICE_TYPE,
  MEMBERSHIP_PLAN,
} from "../src/constants/domain.js";
import { ACCOUNT_STATUS } from "../src/constants/auth.js";
import {
  OPERATION_AUDIT_MODULE,
  OPERATION_AUDIT_RESULT,
} from "../src/constants/operationAudit.js";
import {
  aggregateConversionAnalytics,
  type ConversionStudent,
  type ConversionOrder,
} from "../src/services/conversionAnalytics.js";
import {
  readRegistrationVisit,
  recordRegistrationVisit,
  clearRegistrationVisit,
  REGISTRATION_VISIT_COOKIE,
} from "../src/services/registrationAttribution.js";

const date = (value: string) => new Date(value);
const filters = {
  startAt: date("2026-09-01T00:00:00Z"),
  endAt: date("2026-10-01T00:00:00Z"),
  windowDays: 7,
};
const now = date("2026-10-04T00:00:00Z");
// 样本将订单数与用户数拉开，确保重试下单和复购不会重复产生首付用户。
function order(
  id: string,
  created: string,
  paid: string | null,
  refunded = false,
): ConversionOrder {
  return {
    id,
    createdAt: date(created),
    paidAt: paid ? date(paid) : null,
    status: refunded ? "refunded" : paid ? "paid" : "failed",
    amountCents: 10000,
    refundedAmountCents: refunded ? 10000 : 0,
  };
}
function student(id: string, created: string): ConversionStudent {
  return {
    id,
    createdAt: date(created),
    firstVisitedAt: null,
    examPreferences: [{ examType: "ESAT" }],
    paymentOrders: [],
    examRecords: [],
  };
}
const a = student("a", "2026-09-01T00:00:00Z");
a.firstVisitedAt = date("2026-08-31T23:00:00Z");
a.paymentOrders = [
  order("a1", "2026-09-02T00:00:00Z", "2026-09-03T00:00:00Z"),
  order("a2", "2026-09-10T00:00:00Z", "2026-09-10T00:05:00Z"),
];
a.examRecords = [
  {
    startedAt: date("2026-09-01T01:00:00Z"),
    submittedAt: date("2026-09-01T01:30:00Z"),
    status: "submitted",
  },
];
const b = student("b", "2026-09-02T00:00:00Z");
b.paymentOrders = [
  order("b1", "2026-09-03T00:00:00Z", null),
  order("b2", "2026-09-03T00:01:00Z", null),
];
const observing = student("observing", "2026-09-30T00:00:00Z");
observing.paymentOrders = [
  order("c1", "2026-09-30T01:00:00Z", "2026-09-30T01:01:00Z"),
];
const old = student("old", "2026-08-01T00:00:00Z");
old.paymentOrders = [
  order("d1", "2026-09-03T00:00:00Z", "2026-09-03T00:01:00Z"),
];
const refunded = student("refunded", "2026-09-04T00:00:00Z");
refunded.paymentOrders = [
  order("e1", "2026-09-05T00:00:00Z", "2026-09-05T00:01:00Z", true),
];
const reviews = [
  { userId: "a", at: date("2026-09-02T15:00:00Z") }, // 付款前的行为不可计为付费学习。
  { userId: "a", at: date("2026-09-04T15:00:00Z") },
  { userId: "a", at: date("2026-09-04T15:30:00Z") },
  { userId: "a", at: date("2026-09-04T16:00:00Z") }, // 北京时间次日零点。
  { userId: "a", at: date("2026-09-11T15:00:00Z") }, // 下一周同小时累计人次，人数仍去重。
];
const result = aggregateConversionAnalytics(
  [a, b, observing, old, refunded],
  reviews,
  filters,
  now,
);
assert.equal(result.overview.registered, 4);
assert.equal(result.overview.matured, 3);
assert.equal(result.overview.observing, 1);
assert.equal(result.overview.converted, 2);
assert.equal(result.overview.conversionRate, 2 / 3);
assert.equal(result.overview.firstPayersInPeriod, 4);
assert.equal(result.overview.repeatPayerCount, 1);
assert.equal(result.overview.firstPaymentRefundedUsers, 1);
assert.equal(result.overview.paidLearningEligible, 3);
assert.equal(result.overview.paidLearningUsers, 1);
assert.equal(result.overview.paidLearningRate, 1 / 3);
assert.deepEqual(
  result.funnels[0]!.steps.map((step) => step.count),
  [3, 3, 2],
);
assert.deepEqual(
  result.funnels[1]!.steps.map((step) => step.count),
  [3, 1, 1],
);
assert.equal(
  result.durations.find((item) => item.key === "registration")!.medianSeconds,
  3600,
);
assert.equal(
  result.durations.find((item) => item.key === "checkout")!.sampleCount,
  5,
);
assert.equal(
  result.heatmap.find((cell) => cell.weekday === 4 && cell.hour === 23)!
    .userHours,
  2,
);
assert.equal(
  result.heatmap.find((cell) => cell.weekday === 4 && cell.hour === 23)!.users,
  1,
);
assert.equal(
  result.heatmap.find((cell) => cell.weekday === 5 && cell.hour === 0)!
    .userHours,
  1,
);
assert.equal(result.overview.paidActiveUsers, 1);
assert.equal(
  result.dailyPayments.find((item) => item.date === "2026-09-03")!.paidUsers,
  2,
);
assert.equal(
  result.dailyPayments.find((item) => item.date === "2026-09-05")!.paidUsers,
  1,
);
assert.equal(
  result.dailyPayments.find((item) => item.date === "2026-09-10")!.paidUsers,
  1,
);
assert.equal(result.segments[0]!.paid, 2);
assert.equal(
  result.weeklyCohorts.reduce((sum, row) => sum + row.users, 0),
  3,
);

// 观察期末尾不包含第八天；正好满观察期时进入分母。
const boundary = student("boundary", "2026-09-01T00:00:00Z");
boundary.paymentOrders = [
  order("boundary1", "2026-09-02T00:00:00Z", "2026-09-08T00:00:00Z"),
];
const boundaryResult = aggregateConversionAnalytics(
  [boundary],
  [],
  filters,
  date("2026-09-08T00:00:00Z"),
);
assert.equal(boundaryResult.overview.matured, 1);
assert.equal(boundaryResult.overview.converted, 0);

// 首单时间缺失时不能把后来的复购误当首付，正常订单仍可提供结算耗时。
const uncertain = student("uncertain", "2026-09-01T00:00:00Z");
uncertain.paymentOrders = [
  { ...order("u1", "2026-09-02T00:00:00Z", null), status: "paid" },
  order("u2", "2026-09-03T00:00:00Z", "2026-09-03T00:05:00Z"),
];
const uncertainResult = aggregateConversionAnalytics(
  [uncertain],
  [],
  filters,
  now,
);
assert.equal(uncertainResult.overview.converted, 0);
assert.equal(uncertainResult.overview.firstPayersInPeriod, 0);
assert.equal(uncertainResult.quality.invalidPaymentTimes, 1);
assert.equal(
  uncertainResult.dailyPayments.find((item) => item.date === "2026-09-03")!
    .paidUsers,
  1,
);
assert.equal(
  uncertainResult.durations.find((item) => item.key === "checkout")!
    .sampleCount,
  1,
);

const empty = aggregateConversionAnalytics([], [], filters, now);
assert.equal(empty.overview.conversionRate, null);
assert.equal(empty.overview.medianPaymentSeconds, null);
assert.equal(empty.heatmap.length, 168);
assert.ok(empty.heatmap.every((cell) => cell.userHours === 0));

// 付款日期按北京时间补齐，同一天多笔去重、跨零点分别计数，范围末端不重复计入。
const dailyStudent = student("daily", "2026-08-01T00:00:00Z");
dailyStudent.paymentOrders = [
  order("before", "2026-08-30T00:00:00Z", "2026-08-31T15:59:59Z"),
  order("midnight", "2026-08-31T00:00:00Z", "2026-08-31T16:00:00Z"),
  order("same-day", "2026-09-01T00:00:00Z", "2026-09-01T15:59:59Z"),
  order("next-day", "2026-09-01T00:00:00Z", "2026-09-01T16:00:00Z", true),
  order("unpaid", "2026-09-02T00:00:00Z", null),
  order("end", "2026-09-03T00:00:00Z", "2026-09-03T16:00:00Z"),
];
const dailyFilters = {
  startAt: date("2026-08-31T16:00:00Z"),
  endAt: date("2026-09-03T16:00:00Z"),
  windowDays: 7,
};
const dailyResult = aggregateConversionAnalytics(
  [dailyStudent],
  [],
  dailyFilters,
  now,
);
assert.deepEqual(dailyResult.dailyPayments, [
  { date: "2026-09-01", paidUsers: 1 },
  { date: "2026-09-02", paidUsers: 1 },
  { date: "2026-09-03", paidUsers: 0 },
]);
assert.deepEqual(
  aggregateConversionAnalytics([], [], dailyFilters, now).dailyPayments,
  dailyResult.dailyPayments.map((item) => ({ ...item, paidUsers: 0 })),
);
assert.deepEqual(
  aggregateConversionAnalytics(
    [dailyStudent],
    [],
    dailyFilters,
    date("2026-09-01T18:00:00Z"),
  ).dailyPayments,
  dailyResult.dailyPayments.slice(0, 2),
);

// 首次访问 Cookie 使用服务器签名；重复访问保留起点，伪造/过期/未来/缺失不产生时长。
const cookies: Record<string, string> = {};
let writes = 0;
const response = {
  cookie(name: string, value: string) {
    cookies[name] = value;
    writes++;
  },
  clearCookie(name: string) {
    delete cookies[name];
  },
} as unknown as Response;
const req = { cookies } as Request;
recordRegistrationVisit(req, response, date("2026-09-01T00:00:00Z"));
const original = cookies[REGISTRATION_VISIT_COOKIE]!;
recordRegistrationVisit(req, response, date("2026-09-01T00:01:00Z"));
assert.equal(writes, 1);
assert.equal(
  readRegistrationVisit(req, date("2026-09-01T00:02:00Z"))?.toISOString(),
  "2026-09-01T00:00:00.000Z",
);
assert.equal(readRegistrationVisit(req, date("2026-08-31T23:59:00Z")), null);
assert.equal(readRegistrationVisit(req, date("2027-01-01T00:00:00Z")), null);
cookies[REGISTRATION_VISIT_COOKIE] = original.replace(
  /^\d/,
  original[0] === "1" ? "2" : "1",
);
assert.equal(readRegistrationVisit(req, now), null);
clearRegistrationVisit(response);
assert.equal(readRegistrationVisit(req, now), null);
console.log(
  "PASS conversion analytics: mature cohorts, repeat purchases, refunds, durations, midnight/hour deduplication, empty states and signed registration attribution.",
);

// 真实接口回归只允许本地库，随机账号和历史独立时段不混入正常运营数据。
if (
  config.runtimeEnv !== "local" ||
  !["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL!).hostname,
  )
)
  throw new Error("Conversion API regression requires the local database");
const userIds: string[] = [];
const app = express();
app.use(express.json());
app.use("/api/admin", adminRouter);
app.use(globalErrorHandler);
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
if (!address || typeof address === "string")
  throw new Error("Missing test port");
const base = `http://127.0.0.1:${address.port}/api/admin/conversion-analytics`;
const query =
  "?startAt=1997-06-30T00:00:00Z&endAt=1997-07-07T00:00:00Z&windowDays=7";

// 随机用户使用真实会话，检验管理员边界而不依赖任何现有账号。
async function fixtureUser(role: string, banned = false) {
  const name = `conversion-${crypto.randomUUID()}`;
  const user = await prisma.user.create({
    data: {
      username: name,
      email: `${name}@example.test`,
      password: "unused",
      role,
      accountStatus: banned ? ACCOUNT_STATUS.BANNED : ACCOUNT_STATUS.ACTIVE,
      createdAt: date("1997-06-30T00:00:00Z"),
      firstVisitedAt: date("1997-06-29T23:50:00Z"),
    },
  });
  userIds.push(user.id);
  const session = await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: crypto.randomBytes(32).toString("hex"),
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return { user, token: signAccessToken(user, session.id) };
}

// 同样处于已支付状态的赠卡与真实订单必须产生不同的转化结果。
async function fixturePayment(userId: string, gift = false) {
  await prisma.paymentOrder.create({
    data: {
      orderNo: `CONV_${crypto.randomUUID()}`,
      userId,
      examTypes: ["ESAT"],
      plan: MEMBERSHIP_PLAN.MONTHLY,
      priceType: gift
        ? PAYMENT_PRICE_TYPE.ADMIN_GIFT
        : PAYMENT_PRICE_TYPE.MONTHLY,
      amountCents: gift ? 0 : 10000,
      status: PAYMENT_ORDER_STATUS.PAID,
      channel: "wechat",
      createdAt: date("1997-07-01T00:00:00Z"),
      paidAt: date("1997-07-01T00:01:00Z"),
      expiresAt: date("1997-07-01T00:10:00Z"),
    },
  });
}

try {
  const admin = await fixtureUser(USER_ROLE.ADMIN);
  const active = await fixtureUser(USER_ROLE.STUDENT);
  const banned = await fixtureUser(USER_ROLE.STUDENT, true);
  const gift = await fixtureUser(USER_ROLE.STUDENT);
  await fixtureUser(USER_ROLE.STUDENT);
  await fixturePayment(admin.user.id);
  await fixturePayment(active.user.id);
  await fixturePayment(banned.user.id);
  await fixturePayment(gift.user.id, true);
  await prisma.operationLog.create({
    data: {
      actorUserId: active.user.id,
      actorNameSnapshot: "fixture",
      actorEmailSnapshot: "",
      actorRoleSnapshot: USER_ROLE.STUDENT,
      occurredAt: date("1997-07-02T12:00:00Z"),
      module: OPERATION_AUDIT_MODULE.EXAM,
      action: "diagnostic_report.view",
      summary: "fixture",
      result: OPERATION_AUDIT_RESULT.SUCCESS,
      method: "GET",
      path: "/fixture",
      statusCode: 200,
    },
  });
  assert.equal((await fetch(base + query)).status, 401);
  assert.equal(
    (
      await fetch(base + query, {
        headers: { authorization: `Bearer ${active.token}` },
      })
    ).status,
    403,
  );
  const headers = { authorization: `Bearer ${admin.token}` };
  for (const invalid of [
    query.replace("windowDays=7", "windowDays=1"),
    "?startAt=bad&endAt=bad",
    "?startAt=1997-01-01&endAt=1998-01-01",
    "?startAt=1997-01-01",
  ]) {
    assert.equal((await fetch(base + invalid, { headers })).status, 422);
  }
  const response = await fetch(base + query, { headers });
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    success: boolean;
    data: ReturnType<typeof aggregateConversionAnalytics>;
  };
  assert.equal(payload.success, true);
  assert.equal(payload.data.overview.registered, 3);
  assert.equal(payload.data.overview.converted, 1);
  assert.equal(payload.data.overview.firstPayersInPeriod, 1);
  assert.equal(
    payload.data.dailyPayments.find((item) => item.date === "1997-07-01")!
      .paidUsers,
    1,
  );
  assert.ok(
    payload.data.dailyPayments
      .filter((item) => item.date !== "1997-07-01")
      .every((item) => item.paidUsers === 0),
  );
  assert.equal(payload.data.overview.paidActiveUsers, 1);
  assert.equal(payload.data.overview.paidLearningRate, 1);
  assert.equal(payload.data.durations[0]!.medianSeconds, 600);
  console.log(
    "PASS conversion API: real database aggregation, admin authorization, banned/admin/gift exclusions, date/window validation and attribution coverage.",
  );
} finally {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await prisma.operationLog.deleteMany({
    where: { actorUserId: { in: userIds } },
  });
  await prisma.paymentOrder.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.authSession.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
}
