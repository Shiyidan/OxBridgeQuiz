// 转化统计回归：完整观察期、首付/退款、浏览器归因和北京时间活跃去重。
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { once } from "node:events";
import express from "express";
import type { Request, Response } from "express";
import { config } from "../src/config.js";
import { prisma } from "../src/services/prisma.js";
import type { getWebsiteTrafficAnalytics } from "../src/services/websiteTraffic.js";
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
  aggregatePaidUserAnalytics,
  getPaidUserAnalytics,
  type PaidUserSample,
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
  result.paidUserGrowth.find((item) => item.date === "2026-09-03")!.cumulativePaidUsers,
  2,
);
assert.equal(
  result.paidUserGrowth.find((item) => item.date === "2026-09-05")!.cumulativePaidUsers,
  3,
);
assert.equal(
  result.paidUserGrowth.find((item) => item.date === "2026-09-10")!.cumulativePaidUsers,
  3,
);
assert.equal(
  result.examPayments.totalUsers,
  3,
);

// 考试节点采用北京时间，首次有效付款只落在一个阶段，考试当天和未来不计入。
const examFilters = {
  startAt: date("2026-07-01T00:00:00+08:00"),
  endAt: date("2026-10-13T00:00:00+08:00"),
  windowDays: 7,
  examDate: "2026-10-12",
};
const examSamples = [
  "2026-07-01", "2026-07-14", "2026-08-13", "2026-09-12",
  "2026-09-28", "2026-10-05", "2026-10-11", "2026-10-12",
].map((day, index) => {
  const sample = student(`exam-${index}`, "2026-01-01T00:00:00+08:00");
  sample.paymentOrders = [order(`exam-order-${index}`, `${day}T00:00:00+08:00`, `${day}T00:00:00+08:00`)];
  return sample;
});
const examNow = date("2026-10-14T00:00:00+08:00");
const examResult = aggregateConversionAnalytics(examSamples, [], examFilters, examNow).examPayments;
assert.deepEqual(examResult.stages.map(row => row.users), [1, 1, 1, 1, 1, 2]);
assert.deepEqual(examResult.stages.map(row => row.observedDays), [13, 30, 30, 16, 7, 7]);
assert.equal(examResult.totalUsers, 7);
assert.equal(examResult.stages[5]!.dailyAverage, 2 / 7);
assert.equal(examResult.stages[5]!.startDate, "2026-10-05");
assert.equal(examResult.stages[5]!.endDate, "2026-10-11");
assert.equal(examResult.stages[5]!.status, "complete");
// 截止今天只计算已经到来的自然日；新注册尚未满观察期也可进入付费高峰。
const beforeExam = date("2026-10-06T12:00:00+08:00");
const existingSamples = structuredClone(examSamples.slice(0, 6));
existingSamples[5]!.createdAt = date("2026-10-05T00:00:00+08:00");
const ongoingExam = aggregateConversionAnalytics(existingSamples, [], examFilters, beforeExam).examPayments;
assert.equal(ongoingExam.stages[5]!.status, "ongoing");
assert.equal(ongoingExam.stages[5]!.observedDays, 2);
assert.equal(ongoingExam.stages[5]!.dailyAverage, 0.5);
assert.equal(ongoingExam.stages[5]!.users, 1);
const futureExam = aggregateConversionAnalytics(existingSamples.slice(0, 5), [], examFilters, date("2026-10-05T00:00:00+08:00")).examPayments;
assert.equal(futureExam.stages[5]!.status, "not_started");
assert.equal(futureExam.stages[5]!.dailyAverage, null);
// 首单全退后重买移到最早保留实付的阶段，复购和部分退款不重复增加人数。
const examRefund = structuredClone(examSamples[2]!);
examRefund.paymentOrders[0]!.status = "refunded";
examRefund.paymentOrders[0]!.refundedAmountCents = 10000;
examRefund.paymentOrders.push(order("retained", "2026-10-05T00:00:00+08:00", "2026-10-05T00:00:00+08:00"));
examRefund.paymentOrders.push(order("repeat", "2026-10-06T00:00:00+08:00", "2026-10-06T00:00:00+08:00"));
examRefund.paymentOrders[1]!.refundedAmountCents = 5000;
const refundExam = aggregateConversionAnalytics([examRefund], [], examFilters, examNow).examPayments;
assert.equal(refundExam.totalUsers, 1);
assert.equal(refundExam.stages[2]!.users, 0);
assert.equal(refundExam.stages[5]!.users, 1);
const partialExam = aggregateConversionAnalytics(examSamples, [], { ...examFilters, startAt: date("2026-10-06T00:00:00+08:00") }, examNow).examPayments;
assert.equal(partialExam.stages[5]!.observedDays, 6);
assert.equal(partialExam.stages[5]!.users, 1);
assert.equal(partialExam.stages[5]!.status, "partial");
assert.equal(partialExam.stages[4]!.status, "outside_range");
const emptyExam = aggregateConversionAnalytics([], [], examFilters, examNow).examPayments;
assert.equal(emptyExam.totalUsers, 0);
assert.ok(emptyExam.stages.every(row => row.share === null && row.users === 0));
assert.deepEqual(aggregateConversionAnalytics(examSamples, [], { ...examFilters, windowDays: 30 }, examNow).examPayments, examResult);
const changedExam = aggregateConversionAnalytics(examSamples, [], { ...examFilters, examDate: "2026-10-13" }, examNow).examPayments;
assert.equal(changedExam.totalUsers, 8);
assert.equal(changedExam.examDate, "2026-10-13");

// 复购按当前仍有实付金额的订单重排，退款不改写历史首付和累计付费趋势。
for (const [label, changes, expected] of [
  ["首单全退后重买", [{ status: "refunded", refundedAmountCents: 10000 }, {}], 0],
  ["复购全退", [{}, { status: "refunded", refundedAmountCents: 10000 }], 0],
  ["全部退款", [{ status: "refunded", refundedAmountCents: 10000 }, { status: "refunded", refundedAmountCents: 10000 }], 0],
  ["部分退款", [{}, { status: "refunding", refundedAmountCents: 5000 }], 1],
  ["退款金额已足额", [{}, { status: "refunding", refundedAmountCents: 10000 }], 0],
  ["退款状态优先", [{}, { status: "refunded", refundedAmountCents: 0 }], 0],
] as const) {
  const sample = structuredClone(a);
  sample.paymentOrders = sample.paymentOrders.map((payment, index) => ({ ...payment, ...changes[index] }));
  const actual = aggregateConversionAnalytics([sample], [], filters, now);
  assert.equal(actual.overview.repeatPayerCount, expected, label);
  assert.equal(actual.overview.firstPayersInPeriod, 1, label);
  assert.ok(actual.paidUserGrowth.filter(item => item.date >= "2026-09-03").every(item => item.cumulativePaidUsers === 1), label);
}
const repeatAfterRefund = structuredClone(a);
repeatAfterRefund.paymentOrders[0]!.status = "refunded";
repeatAfterRefund.paymentOrders[0]!.refundedAmountCents = 10000;
repeatAfterRefund.paymentOrders.push(order("third", "2026-09-15T00:00:00Z", "2026-09-15T00:05:00Z"));
assert.equal(aggregateConversionAnalytics([repeatAfterRefund], [], filters, now).overview.repeatPayerCount, 1);
assert.equal(aggregateConversionAnalytics([repeatAfterRefund], [], { ...filters, endAt: date("2026-09-15T00:05:00Z") }, now).overview.repeatPayerCount, 0);
assert.equal(aggregateConversionAnalytics([repeatAfterRefund], [], { ...filters, startAt: date("2026-09-15T00:05:00Z") }, now).overview.repeatPayerCount, 1);

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
  uncertainResult.paidUserGrowth.find((item) => item.date === "2026-09-03")!
    .cumulativePaidUsers,
  0,
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

// 累计人数保留期初基数，仅在首付日增长；复购、退款和没有首付的日期不改变人数。
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
const firstAtStart = student("first-at-start", "2026-08-01T00:00:00Z");
firstAtStart.paymentOrders = [order("start", "2026-08-30T00:00:00Z", "2026-08-31T16:00:00Z")];
const firstNextDay = student("first-next-day", "2026-08-01T00:00:00Z");
firstNextDay.paymentOrders = [order("next", "2026-08-30T00:00:00Z", "2026-09-01T16:00:00Z", true)];
const firstAtEnd = student("first-at-end", "2026-08-01T00:00:00Z");
firstAtEnd.paymentOrders = [order("end-only", "2026-08-30T00:00:00Z", "2026-09-03T16:00:00Z")];
const growthStudents = [dailyStudent, firstAtStart, firstNextDay, firstAtEnd];
// 查询时刻的快照不包含后来才支付成功的订单，避免将未来已付款状态误作当时的异常数据。
function growthSnapshot(at: string): ConversionStudent[] {
  return growthStudents.map(student => ({
    ...student,
    paymentOrders: student.paymentOrders.filter(order => !order.paidAt || order.paidAt <= date(at)),
  }));
}
const dailyResult = aggregateConversionAnalytics(
  growthStudents,
  [],
  dailyFilters,
  now,
);
assert.deepEqual(dailyResult.paidUserGrowth, [
  { date: "2026-09-01", cumulativePaidUsers: 2 },
  { date: "2026-09-02", cumulativePaidUsers: 3 },
  { date: "2026-09-03", cumulativePaidUsers: 3 },
]);
assert.deepEqual(
  aggregateConversionAnalytics([], [], dailyFilters, now).paidUserGrowth,
  dailyResult.paidUserGrowth.map((item) => ({ ...item, cumulativePaidUsers: 0 })),
);
assert.deepEqual(
  aggregateConversionAnalytics(
    growthSnapshot("2026-09-01T18:00:00Z"),
    [],
    dailyFilters,
    date("2026-09-01T18:00:00Z"),
  ).paidUserGrowth,
  dailyResult.paidUserGrowth.slice(0, 2),
);

// 缩短日期范围仍从历史付费总数起算，不受注册观察期影响。
assert.deepEqual(
  aggregateConversionAnalytics(growthStudents, [], { ...dailyFilters, startAt: date("2026-09-01T16:00:00Z"), windowDays: 30 }, now).paidUserGrowth,
  dailyResult.paidUserGrowth.slice(1),
);
assert.deepEqual(
  aggregateConversionAnalytics(growthSnapshot("2026-08-31T18:00:00Z"), [], dailyFilters, date("2026-08-31T18:00:00Z")).paidUserGrowth,
  dailyResult.paidUserGrowth.slice(0, 1),
);

// 累计分析覆盖所有历史付款，同 IP 的不同用户仍各计一人，复购和失败订单不重复计数。
const lifetimeSamples: PaidUserSample[] = [
  a,
  b,
  observing,
  old,
  refunded,
  uncertain,
].map((row) => ({
  ...row,
  registrationCountry: row.id === "a" || row.id === "old" ? "中国" : null,
  registrationRegion: row.id === "a" || row.id === "old" ? "上海市" : null,
}));
const lifetime = aggregatePaidUserAnalytics(lifetimeSamples, now);
assert.equal(lifetime.everPaidUsers, 5);
assert.equal(lifetime.paidUsers, 4);
assert.equal(lifetime.fullyRefundedUsers, 1);
assert.equal(lifetime.geography.knownUsers, 2);
assert.equal(lifetime.geography.unknownUsers, 2);
assert.deepEqual(
  lifetime.geography.regions.find((row) => row.label === "中国 · 上海市"),
  { label: "中国 · 上海市", users: 2, share: 0.5 },
);
assert.equal(lifetime.duration.sampleCount, 3);
assert.equal(lifetime.duration.invalidUsers, 1);
assert.equal(lifetime.duration.medianSeconds, 2 * 86400);
assert.equal(
  lifetime.duration.meanSeconds,
  (2 * 86400 + 3660 + 33 * 86400 + 60) / 3,
);
assert.equal(lifetime.duration.withinDayShare, 1 / 3);
assert.equal(lifetime.duration.withinWeekShare, 2 / 3);
assert.equal(
  lifetime.duration.buckets.reduce((sum, bucket) => sum + bucket.count, 0),
  3,
);

// 区间左闭右开；首单全退后再购买仍保留最初的决策时间，部分退款仍属于付费用户。
const durations = [0, 3599, 3600, 86400, 3 * 86400, 7 * 86400, 30 * 86400];
const durationSamples = durations.map(
  (seconds, index): PaidUserSample => ({
    id: `duration-${index}`,
    createdAt: date("2026-08-01T00:00:00Z"),
    registrationCountry: null,
    registrationRegion: null,
    paymentOrders: [
      order(
        `duration-order-${index}`,
        "2026-08-01T00:00:00Z",
        new Date(
          date("2026-08-01T00:00:00Z").getTime() + seconds * 1000,
        ).toISOString(),
      ),
    ],
  }),
);
const exactDurations = aggregatePaidUserAnalytics(
  durationSamples,
  now,
);
assert.deepEqual(
  exactDurations.duration.buckets.map((bucket) => bucket.count),
  [2, 1, 1, 1, 1, 1],
);
assert.equal(exactDurations.duration.minSeconds, 0);
assert.equal(exactDurations.duration.maxSeconds, 30 * 86400);
assert.equal(exactDurations.duration.medianSeconds, 86400);
const repurchased: PaidUserSample = {
  ...durationSamples[0]!,
  id: "repurchased",
  paymentOrders: [
    {
      ...order("later", "2026-08-04T00:00:00Z", "2026-08-04T00:00:00Z"),
      refundedAmountCents: 1000,
    },
    order(
      "first-refunded",
      "2026-08-02T00:00:00Z",
      "2026-08-02T00:00:00Z",
      true,
    ),
  ],
};
const repurchasedResult = aggregatePaidUserAnalytics(
  [repurchased],
  now,
);
assert.equal(repurchasedResult.paidUsers, 1);
assert.equal(repurchasedResult.duration.medianSeconds, 86400);
const allRefunded = aggregatePaidUserAnalytics(
  [
    {
      ...repurchased,
      paymentOrders: repurchased.paymentOrders.map((item) => ({
        ...item,
        refundedAmountCents: item.amountCents,
      })),
    },
  ],
  now,
);
assert.equal(allRefunded.paidUsers, 0);
assert.equal(allRefunded.fullyRefundedUsers, 1);
assert.equal(allRefunded.duration.meanSeconds, null);
assert.equal(allRefunded.duration.withinDayShare, null);
assert.deepEqual(allRefunded.geography.regions, []);
for (const invalidOrder of [
  order("future", "2026-09-01T00:00:00Z", "2027-01-01T00:00:00Z"),
  order("before-order", "2026-09-02T00:00:00Z", "2026-09-01T00:00:00Z"),
  order("before-registration", "2026-07-31T00:00:00Z", "2026-08-02T00:00:00Z"),
]) {
  const invalid = aggregatePaidUserAnalytics(
    [
      {
        ...repurchased,
        paymentOrders: [...repurchased.paymentOrders, invalidOrder],
      },
    ],
    now,
  );
  assert.equal(invalid.paidUsers, 1);
  assert.equal(invalid.duration.invalidUsers, 1);
  assert.equal(invalid.duration.sampleCount, 0);
}
const noPaid = aggregatePaidUserAnalytics([], now);
assert.equal(noPaid.paidUsers, 0);
assert.equal(noPaid.duration.medianSeconds, null);
assert.ok(
  noPaid.duration.buckets.every(
    (bucket) => bucket.count === 0 && bucket.share === null,
  ),
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

// 接口回归不向第三方发送本地用户 IP，解析失败仍须保留人数和时长。
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(
    input instanceof globalThis.Request ? input.url : String(input),
  );
  if (url.hostname === "ipwho.is")
    return new globalThis.Response(JSON.stringify({ success: false }), {
      status: 200,
    });
  return originalFetch(input, init);
};
try {
  const paidBaseline = await getPaidUserAnalytics();
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
    query + "&examDate=2026-02-30",
    query + "&examDate=invalid",
    query + "&examDate=2026-10-12&examDate=2026-10-13",
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
    payload.data.paidUserGrowth.find((item) => item.date === "1997-07-01")!
      .cumulativePaidUsers,
    1,
  );
  assert.ok(
    payload.data.paidUserGrowth
      .every((item) => item.cumulativePaidUsers === (item.date < "1997-07-01" ? 0 : 1)),
  );
  const laterResponse = await fetch(base + "?startAt=1997-07-02T00:00:00Z&endAt=1997-07-04T00:00:00Z&windowDays=30", { headers });
  const laterPayload = (await laterResponse.json()) as typeof payload;
  assert.equal(laterResponse.status, 200);
  assert.ok(laterPayload.data.paidUserGrowth.length > 0);
  assert.ok(laterPayload.data.paidUserGrowth.every(item => item.cumulativePaidUsers === 1));
  assert.equal(payload.data.overview.paidActiveUsers, 1);
  assert.equal(payload.data.overview.paidLearningRate, 1);
  const examResponse = await fetch(base + query + "&examDate=1997-07-08", { headers });
  const examPayload = (await examResponse.json()) as typeof payload;
  assert.equal(examResponse.status, 200);
  assert.equal(examPayload.data.examPayments.examDate, "1997-07-08");
  assert.equal(examPayload.data.examPayments.totalUsers, 1);
  assert.equal(examPayload.data.examPayments.stages[5]!.users, 1);
  assert.equal(payload.data.durations[0]!.medianSeconds, 600);
  assert.equal((await fetch(base + "/paid-users")).status, 401);
  assert.equal(
    (
      await fetch(base + "/paid-users", {
        headers: { authorization: `Bearer ${active.token}` },
      })
    ).status,
    403,
  );
  const paidResponse = await fetch(base + "/paid-users", { headers });
  assert.equal(paidResponse.status, 200);
  const paidPayload = (await paidResponse.json()) as {
    success: boolean;
    data: ReturnType<typeof aggregatePaidUserAnalytics>;
  };
  assert.equal(paidPayload.success, true);
  assert.equal(paidPayload.data.paidUsers, paidBaseline.paidUsers + 1);
  assert.equal(paidPayload.data.everPaidUsers, paidBaseline.everPaidUsers + 1);
  assert.equal(
    paidPayload.data.geography.unknownUsers,
    paidBaseline.geography.unknownUsers + 1,
  );
  assert.equal(
    paidPayload.data.duration.sampleCount,
    paidBaseline.duration.sampleCount + 1,
  );
  assert.ok(!JSON.stringify(paidPayload).includes(active.user.id));
  assert.ok(!JSON.stringify(paidPayload).includes(active.user.email!));
  // 全历史接口不接收日期与观察期，任意旧日期查询不能截断这部分结果。
  const filteredPaid = await fetch(base + "/paid-users" + query, { headers });
  const filteredPayload = (await filteredPaid.json()) as typeof paidPayload;
  assert.equal(filteredPayload.data.paidUsers, paidPayload.data.paidUsers);
  assert.deepEqual(filteredPayload.data.duration, paidPayload.data.duration);
  // 偏好移到访问分析：老注册用户本期付费可见，复购去重，使用当前偏好而非套餐考试。
  const trafficUrl = base.replace("/conversion-analytics", "/traffic-analytics") + query;
  // 多次请求覆盖付款状态变化后的真实查询结果，不复用第一次响应。
  async function readPreferences() {
    const response = await fetch(trafficUrl, { headers });
    assert.equal(response.status, 200);
    return (await response.json()).data as Awaited<ReturnType<typeof getWebsiteTrafficAnalytics>>;
  }
  await prisma.user.update({ where: { id: active.user.id }, data: {
    createdAt: date("1990-01-01T00:00:00Z"),
    examPreferences: [{ examType: "ESAT" }, { examType: "TMUA" }, { examType: "ESAT" }],
  } });
  await fixturePayment(active.user.id);
  const preferences = await readPreferences();
  assert.equal(preferences.examPreferenceDistribution.totalStudentCount, 2);
  assert.equal(preferences.paidExamPreferenceDistribution.totalStudentCount, 1);
  assert.equal(preferences.paidExamPreferenceDistribution.items.find(item => item.category === "both")!.studentCount, 1);
  assert.equal(preferences.paidExamPreferenceDistribution.items.find(item => item.category === "both")!.percentage, 100);
  await prisma.paymentOrder.updateMany({ where: { userId: active.user.id }, data: { status: PAYMENT_ORDER_STATUS.REFUNDED, refundedAmountCents: 10000 } });
  assert.equal((await readPreferences()).paidExamPreferenceDistribution.totalStudentCount, 0);
  await prisma.paymentOrder.updateMany({ where: { userId: active.user.id }, data: { status: PAYMENT_ORDER_STATUS.REFUNDING, refundedAmountCents: 5000 } });
  assert.equal((await readPreferences()).paidExamPreferenceDistribution.totalStudentCount, 1);
  await prisma.paymentOrder.updateMany({ where: { userId: active.user.id }, data: { refundedAmountCents: 10000 } });
  assert.equal((await readPreferences()).paidExamPreferenceDistribution.totalStudentCount, 0);
  await prisma.paymentOrder.updateMany({ where: { userId: active.user.id }, data: { status: PAYMENT_ORDER_STATUS.REFUNDED, refundedAmountCents: 0 } });
  assert.equal((await readPreferences()).paidExamPreferenceDistribution.totalStudentCount, 0);
  await prisma.paymentOrder.updateMany({ where: { userId: active.user.id }, data: { status: PAYMENT_ORDER_STATUS.PAID, paidAt: date("1997-07-07T00:00:00Z") } });
  assert.equal((await readPreferences()).paidExamPreferenceDistribution.totalStudentCount, 0);
  await prisma.paymentOrder.updateMany({ where: { userId: active.user.id }, data: { paidAt: date("1997-06-30T00:00:00Z"), createdAt: date("1997-06-30T00:00:00Z") } });
  assert.equal((await readPreferences()).paidExamPreferenceDistribution.totalStudentCount, 1);
  assert.ok(!("segments" in payload.data));
  console.log("PASS exam preferences: registration/payment cohorts, old registrations, repeat deduplication, refunds, paid date boundaries and exclusive current preferences.");
  console.log(
    "PASS conversion API: real database aggregation, admin authorization, banned/admin/gift exclusions, date/window validation and attribution coverage.",
  );
} finally {
  globalThis.fetch = originalFetch;
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
