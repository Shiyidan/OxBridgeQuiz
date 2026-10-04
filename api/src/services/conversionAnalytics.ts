// 转化分析：区分注册人群的完整观察窗口、真实首付与付费后的学习行为。
import { prisma } from "./prisma.js";
import { ACCOUNT_STATUS } from "../constants/auth.js";
import {
  EXAM_RECORD_STATUS,
  USER_ROLE,
  EXAM_TYPE,
} from "../constants/domain.js";
import { OPERATION_AUDIT_RESULT } from "../constants/operationAudit.js";
import {
  REAL_PAYMENT_PRICE_TYPES,
  REAL_PAYMENT_STATUSES,
} from "./revenuePayments.js";
import { parseJsonArray } from "../utils/jsonField.js";

const DAY = 86400000;
const CHINA_OFFSET = 8 * 3600000;
export const CONVERSION_WINDOW_DAYS = [7, 14, 30] as const;
export const CONVERSION_REVIEW_ACTIONS = [
  "diagnostic_report.view",
  "mistake_notebook.view",
  "favorite_notebook.question_view",
];

export interface ConversionFilters {
  startAt: Date;
  endAt: Date;
  windowDays: number;
}
export interface ConversionOrder {
  id: string;
  createdAt: Date;
  paidAt: Date | null;
  status: string;
  amountCents: number;
  refundedAmountCents: number;
}
export interface ConversionStudent {
  id: string;
  createdAt: Date;
  firstVisitedAt: Date | null;
  examPreferences: unknown;
  paymentOrders: ConversionOrder[];
  examRecords: Array<{
    startedAt: Date;
    submittedAt: Date | null;
    status: string;
  }>;
}
export interface ConversionActivity {
  userId: string;
  at: Date;
}

// 区间采用左闭右开，避免连续日期重复计入午夜事件。
function inPeriod(at: Date, start: Date, end: Date): boolean {
  return at >= start && at < end;
}

// 无分母意味着没有可观察样本，与真实的零转化率分开。
function rate(numerator: number, denominator: number): number | null {
  return denominator ? numerator / denominator : null;
}

// 成功付款的时间必须符合注册、下单、付款的先后关系，异常记录不能用于推断首付。
function hasInvalidPaymentTime(
  order: ConversionOrder,
  registeredAt: Date,
  now: Date,
): boolean {
  return (
    REAL_PAYMENT_STATUSES.some((status) => status === order.status) &&
    (!order.paidAt ||
      order.createdAt < registeredAt ||
      order.paidAt < order.createdAt ||
      order.paidAt > now)
  );
}

// 每日人数按付款成功的北京时间日期去重，复购仍计入当天，未发生付款的日期补零。
function dailyPaymentTrend(
  ordersByUser: Map<string, ConversionOrder[]>,
  startAt: Date,
  endAt: Date,
) {
  const days = new Map<string, Set<string>>();
  const firstDay =
    Math.floor((startAt.getTime() + CHINA_OFFSET) / DAY) * DAY - CHINA_OFFSET;
  for (let time = firstDay; time < endAt.getTime(); time += DAY) {
    days.set(
      new Date(time + CHINA_OFFSET).toISOString().slice(0, 10),
      new Set(),
    );
  }
  for (const [userId, orders] of ordersByUser) {
    for (const order of orders) {
      if (!order.paidAt || !inPeriod(order.paidAt, startAt, endAt)) continue;
      const date = new Date(order.paidAt.getTime() + CHINA_OFFSET)
        .toISOString()
        .slice(0, 10);
      days.get(date)?.add(userId);
    }
  }
  return [...days].map(([date, users]) => ({ date, paidUsers: users.size }));
}

// 百分位使用排序后的线性插值，小样本仍返回实际时长而不四舍五入成天数。
function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  return (
    sorted[lower]! +
    (sorted[Math.ceil(index)]! - sorted[lower]!) * (index - lower)
  );
}

// 已转化样本单独描述耗时；未转化用户不填零，避免拉低中位数。
function durationDistribution(
  key: string,
  samples: number[],
  eligibleCount: number,
) {
  const values = samples
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);
  const thresholds =
    key === "checkout"
      ? [60, 300, 1800, 7200]
      : [3600, 86400, 3 * 86400, 7 * 86400, 30 * 86400];
  const labels =
    key === "checkout"
      ? ["1 分钟内", "1–5 分钟", "5–30 分钟", "30 分钟–2 小时", "2 小时以上"]
      : ["1 小时内", "1–24 小时", "1–3 天", "3–7 天", "7–30 天", "30 天以上"];
  return {
    key,
    sampleCount: values.length,
    eligibleCount,
    medianSeconds: percentile(values, 0.5),
    p75Seconds: percentile(values, 0.75),
    p90Seconds: percentile(values, 0.9),
    buckets: labels.map((label, index) => {
      const min = index === 0 ? 0 : thresholds[index - 1]!;
      const max = thresholds[index] ?? Infinity;
      const count = values.filter(
        (value) => value >= min && value < max,
      ).length;
      return { label, count, share: rate(count, values.length) };
    }),
  };
}

// 学习活跃以开始/完成练习及成功查看复习内容为准，不把登录、付款或自动保存当作学习。
function learningActivities(
  students: ConversionStudent[],
  reviews: ConversionActivity[],
): ConversionActivity[] {
  return [
    ...reviews,
    ...students.flatMap((student) =>
      student.examRecords.flatMap((record) => [
        { userId: student.id, at: record.startedAt },
        ...(record.status === EXAM_RECORD_STATUS.SUBMITTED && record.submittedAt
          ? [{ userId: student.id, at: record.submittedAt }]
          : []),
      ]),
    ),
  ];
}

// 当前备考方向仅用于分组比较，不将付费结果倒推成注册时的偏好。
function preferenceLabel(value: unknown): string {
  const exams = new Set(
    parseJsonArray<{ examType?: string } | null>(value).map(
      (item) => item?.examType,
    ),
  );
  if (exams.has(EXAM_TYPE.ESAT) && exams.has(EXAM_TYPE.TMUA))
    return "ESAT + TMUA";
  if (exams.has(EXAM_TYPE.ESAT)) return EXAM_TYPE.ESAT;
  if (exams.has(EXAM_TYPE.TMUA)) return EXAM_TYPE.TMUA;
  return "未设置";
}

// 纯聚合让观察期、重复支付、退款和午夜边界可以独立回归验证。
export function aggregateConversionAnalytics(
  students: ConversionStudent[],
  reviews: ConversionActivity[],
  filters: ConversionFilters,
  now = new Date(),
) {
  const observedAt = now;
  const periodEnd = new Date(Math.min(filters.endAt.getTime(), now.getTime()));
  const windowMs = filters.windowDays * DAY;
  const cohort = students.filter((student) =>
    inPeriod(student.createdAt, filters.startAt, periodEnd),
  );
  const matured = cohort.filter(
    (student) => student.createdAt.getTime() + windowMs <= now.getTime(),
  );
  const uncertainFirstPaymentUsers = new Set(
    students
      .filter((student) =>
        student.paymentOrders.some((order) =>
          hasInvalidPaymentTime(order, student.createdAt, now),
        ),
      )
      .map((student) => student.id),
  );
  const paidOrdersByUser = new Map(
    students.map((student) => [
      student.id,
      student.paymentOrders
        .filter(
          (order) =>
            REAL_PAYMENT_STATUSES.some((status) => status === order.status) &&
            !hasInvalidPaymentTime(order, student.createdAt, now),
        )
        .sort((a, b) => a.paidAt!.getTime() - b.paidAt!.getTime()),
    ]),
  );
  const firstPayments = new Map(
    [...paidOrdersByUser].flatMap(([id, orders]) =>
      orders[0] && !uncertainFirstPaymentUsers.has(id)
        ? [[id, orders[0]] as const]
        : [],
    ),
  );
  // 注册漏斗只约束注册与支付，不强制用户必须先体验某个学习功能。
  const cohortRows = matured.map((student) => {
    const end = new Date(student.createdAt.getTime() + windowMs);
    const starts = student.examRecords.filter((record) =>
      inPeriod(record.startedAt, student.createdAt, end),
    );
    const completed = starts
      .filter(
        (record) =>
          record.status === EXAM_RECORD_STATUS.SUBMITTED &&
          record.submittedAt &&
          inPeriod(record.submittedAt, record.startedAt, end),
      )
      .sort((a, b) => a.submittedAt!.getTime() - b.submittedAt!.getTime());
    const firstPaid = firstPayments.get(student.id);
    const converted =
      !!firstPaid?.paidAt && inPeriod(firstPaid.paidAt, student.createdAt, end);
    return {
      student,
      started: starts.length > 0,
      completed: completed[0]?.submittedAt ?? null,
      ordered: student.paymentOrders.some((order) =>
        inPeriod(order.createdAt, student.createdAt, end),
      ),
      firstPaid: converted ? firstPaid! : null,
    };
  });
  const started = cohortRows.filter((row) => row.started).length;
  const activated = cohortRows.filter((row) => row.completed).length;
  const ordered = cohortRows.filter((row) => row.ordered).length;
  const converted = cohortRows.filter((row) => row.firstPaid).length;
  const refunds = cohortRows.filter(
    (row) =>
      row.firstPaid &&
      row.firstPaid.refundedAmountCents >= row.firstPaid.amountCents,
  ).length;
  const firstPayersInPeriod = students.filter((student) => {
    const paidAt = firstPayments.get(student.id)?.paidAt;
    return paidAt && inPeriod(paidAt, filters.startAt, periodEnd);
  });
  const periodOrders = [...paidOrdersByUser.values()]
    .flat()
    .filter((order) => inPeriod(order.paidAt!, filters.startAt, periodEnd));
  const repeatPayerCount = students.filter(
    (student) =>
      !uncertainFirstPaymentUsers.has(student.id) &&
      (paidOrdersByUser.get(student.id) || []).some(
        (order, index) =>
          index > 0 && inPeriod(order.paidAt!, filters.startAt, periodEnd),
      ),
  ).length;
  const signupSamples = cohort.flatMap((student) =>
    student.firstVisitedAt && student.firstVisitedAt <= student.createdAt
      ? [
          (student.createdAt.getTime() - student.firstVisitedAt.getTime()) /
            1000,
        ]
      : [],
  );
  const activationSamples = cohortRows.flatMap((row) =>
    row.completed
      ? [(row.completed.getTime() - row.student.createdAt.getTime()) / 1000]
      : [],
  );
  const paymentSamples = cohortRows.flatMap((row) =>
    row.firstPaid
      ? [
          (row.firstPaid.paidAt!.getTime() - row.student.createdAt.getTime()) /
            1000,
        ]
      : [],
  );
  const checkoutSamples = periodOrders.map(
    (order) => (order.paidAt!.getTime() - order.createdAt.getTime()) / 1000,
  );
  const activities = learningActivities(students, reviews).filter(
    (event) => event.at <= now,
  );
  const cells = Array.from({ length: 168 }, (_, index) => ({
    weekday: Math.floor(index / 24),
    hour: index % 24,
    userHours: 0,
    users: new Set<string>(),
  }));
  const hourlyUsers = Array.from({ length: 24 }, () => new Set<string>());
  const paidActiveUsers = new Set<string>();
  const seenHours = new Set<string>();
  const postPaymentUsers = new Set<string>();
  for (const event of activities) {
    const payment = firstPayments.get(event.userId);
    if (!payment?.paidAt || event.at < payment.paidAt) continue;
    if (event.at.getTime() < payment.paidAt.getTime() + 7 * DAY)
      postPaymentUsers.add(event.userId);
    if (!inPeriod(event.at, filters.startAt, periodEnd)) continue;
    const china = new Date(event.at.getTime() + CHINA_OFFSET);
    const hour = china.getUTCHours();
    const weekday = (china.getUTCDay() + 6) % 7;
    const key = `${event.userId}:${china.toISOString().slice(0, 10)}:${hour}`;
    if (seenHours.has(key)) continue;
    seenHours.add(key);
    const cell = cells[weekday * 24 + hour]!;
    cell.userHours++;
    cell.users.add(event.userId);
    hourlyUsers[hour]!.add(event.userId);
    paidActiveUsers.add(event.userId);
  }
  const eligiblePaid = firstPayersInPeriod.filter(
    (student) =>
      firstPayments.get(student.id)!.paidAt!.getTime() + 7 * DAY <=
      now.getTime(),
  );
  const returnedPaid = eligiblePaid.filter((student) =>
    postPaymentUsers.has(student.id),
  ).length;
  const segmentLabels = ["ESAT", "TMUA", "ESAT + TMUA", "未设置"];
  const segments = segmentLabels.map((label) => {
    const rows = cohortRows.filter(
      (row) => preferenceLabel(row.student.examPreferences) === label,
    );
    const payers = rows.filter((row) => row.firstPaid);
    return {
      label,
      users: rows.length,
      activated: rows.filter((row) => row.completed).length,
      paid: payers.length,
      conversionRate: rate(payers.length, rows.length),
      medianSeconds: percentile(
        payers
          .map(
            (row) =>
              (row.firstPaid!.paidAt!.getTime() -
                row.student.createdAt.getTime()) /
              1000,
          )
          .sort((a, b) => a - b),
        0.5,
      ),
    };
  });
  const weeklyGroups = new Map<string, typeof cohortRows>();
  for (const row of cohortRows) {
    const china = new Date(row.student.createdAt.getTime() + CHINA_OFFSET);
    china.setUTCDate(china.getUTCDate() - ((china.getUTCDay() + 6) % 7));
    const key = china.toISOString().slice(0, 10);
    weeklyGroups.set(key, [...(weeklyGroups.get(key) || []), row]);
  }
  const weeklyCohorts = [...weeklyGroups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, rows]) => ({
      week,
      users: rows.length,
      activated: rows.filter((row) => row.completed).length,
      paid: rows.filter((row) => row.firstPaid).length,
      conversionRate: rate(
        rows.filter((row) => row.firstPaid).length,
        rows.length,
      ),
    }));
  const hourly = hourlyUsers.map((users, hour) => ({
    hour,
    users: users.size,
    userHours: cells
      .filter((cell) => cell.hour === hour)
      .reduce((sum, cell) => sum + cell.userHours, 0),
  }));
  const topHours = [...hourly]
    .filter((item) => item.userHours > 0)
    .sort((a, b) => b.userHours - a.userHours || a.hour - b.hour)
    .slice(0, 3);
  return {
    period: {
      startAt: filters.startAt.toISOString(),
      endAt: filters.endAt.toISOString(),
      observedAt: observedAt.toISOString(),
      windowDays: filters.windowDays,
      timezone: "Asia/Shanghai",
    },
    overview: {
      registered: cohort.length,
      matured: matured.length,
      observing: cohort.length - matured.length,
      started,
      activated,
      ordered,
      converted,
      activationRate: rate(activated, matured.length),
      conversionRate: rate(converted, matured.length),
      firstPayersInPeriod: firstPayersInPeriod.length,
      repeatPayerCount,
      firstPaymentRefundedUsers: refunds,
      paidActiveUsers: paidActiveUsers.size,
      paidLearningEligible: eligiblePaid.length,
      paidLearningUsers: returnedPaid,
      paidLearningRate: rate(returnedPaid, eligiblePaid.length),
      medianPaymentSeconds: percentile(
        paymentSamples.sort((a, b) => a - b),
        0.5,
      ),
    },
    funnels: [
      {
        key: "payment",
        label: "注册到首次付费",
        steps: [
          { label: "注册用户", count: matured.length },
          { label: "创建支付订单", count: ordered },
          { label: "首次支付成功", count: converted },
        ],
      },
      {
        key: "activation",
        label: "注册到首次学习完成",
        steps: [
          { label: "注册用户", count: matured.length },
          { label: "开始练习", count: started },
          { label: "完成练习", count: activated },
        ],
      },
    ],
    durations: [
      durationDistribution("registration", signupSamples, cohort.length),
      durationDistribution("activation", activationSamples, matured.length),
      durationDistribution("payment", paymentSamples, matured.length),
      durationDistribution("checkout", checkoutSamples, periodOrders.length),
    ],
    dailyPayments: dailyPaymentTrend(
      paidOrdersByUser,
      filters.startAt,
      periodEnd,
    ),
    heatmap: cells.map(({ users, ...cell }) => ({
      ...cell,
      users: users.size,
    })),
    hourly,
    topHours,
    segments,
    weeklyCohorts,
    quality: {
      registrationTracked: signupSamples.length,
      registrationTotal: cohort.length,
      smallCohort: matured.length < 30,
      invalidPaymentTimes: students.reduce(
        (sum, student) =>
          sum +
          student.paymentOrders.filter((order) =>
            hasInvalidPaymentTime(order, student.createdAt, now),
          ).length,
        0,
      ),
    },
  };
}

// 批量读取覆盖注册观察期和付费后七天窗口，避免逐用户查询；只选择统计必需字段。
export async function getConversionAnalytics(
  filters: ConversionFilters,
  now = new Date(),
) {
  const observationEnd = new Date(
    Math.min(
      now.getTime(),
      filters.endAt.getTime() + Math.max(filters.windowDays, 7) * DAY,
    ),
  );
  const students = await prisma.user.findMany({
    where: {
      role: USER_ROLE.STUDENT,
      accountStatus: { not: ACCOUNT_STATUS.BANNED },
      OR: [
        { createdAt: { gte: filters.startAt, lt: filters.endAt } },
        {
          paymentOrders: {
            some: {
              priceType: { in: [...REAL_PAYMENT_PRICE_TYPES] },
              amountCents: { gt: 0 },
              status: { in: [...REAL_PAYMENT_STATUSES] },
              paidAt: { lt: observationEnd },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      createdAt: true,
      firstVisitedAt: true,
      examPreferences: true,
      paymentOrders: {
        where: {
          priceType: { in: [...REAL_PAYMENT_PRICE_TYPES] },
          amountCents: { gt: 0 },
          createdAt: { lt: observationEnd },
        },
        select: {
          id: true,
          createdAt: true,
          paidAt: true,
          status: true,
          amountCents: true,
          refundedAmountCents: true,
        },
        orderBy: { createdAt: "asc" },
      },
      examRecords: {
        where: {
          OR: [
            { startedAt: { gte: filters.startAt, lt: observationEnd } },
            { submittedAt: { gte: filters.startAt, lt: observationEnd } },
          ],
        },
        select: { startedAt: true, submittedAt: true, status: true },
        orderBy: { startedAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  const logs = students.length
    ? await prisma.operationLog.findMany({
        where: {
          actorUserId: { in: students.map((student) => student.id) },
          actorRoleSnapshot: USER_ROLE.STUDENT,
          action: { in: CONVERSION_REVIEW_ACTIONS },
          result: OPERATION_AUDIT_RESULT.SUCCESS,
          occurredAt: { gte: filters.startAt, lt: observationEnd },
        },
        select: { actorUserId: true, occurredAt: true },
        orderBy: { occurredAt: "asc" },
      })
    : [];
  return aggregateConversionAnalytics(
    students,
    logs.flatMap((log) =>
      log.actorUserId ? [{ userId: log.actorUserId, at: log.occurredAt }] : [],
    ),
    filters,
    now,
  );
}
