// 转化分析：区分注册人群的完整观察窗口、真实首付与付费后的学习行为。
import { prisma } from "./prisma.js";
import { analyticsStudentWhere } from "./analyticsScope.js";
import {
  EXAM_RECORD_STATUS,
  USER_ROLE,
} from "../constants/domain.js";
import { OPERATION_AUDIT_RESULT } from "../constants/operationAudit.js";
import {
  REAL_PAYMENT_PRICE_TYPES,
  REAL_PAYMENT_STATUSES,
  realPaymentOrderWhere,
  isRetainedPayment,
} from "./revenuePayments.js";
import { registrationLocationLabel } from "./registrationLocation.js";

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
  examDate?: string;
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

export interface PaidUserSample {
  id: string;
  createdAt: Date;
  registrationCountry: string | null;
  registrationRegion: string | null;
  paymentOrders: ConversionOrder[];
}

// 每人只计一次注册地区和首次付款耗时，首单退款后复购仍使用最早的成功付款时间。
export function aggregatePaidUserAnalytics(
  students: PaidUserSample[],
  now = new Date(),
) {
  const everPaid = students
    .map((student) => ({
      ...student,
      paymentOrders: student.paymentOrders.filter(
        (order) =>
          order.amountCents > 0 &&
          REAL_PAYMENT_STATUSES.some((status) => status === order.status),
      ),
    }))
    .filter((student) => student.paymentOrders.length > 0);
  const paid = everPaid.filter((student) => student.paymentOrders.some(isRetainedPayment));
  const regions = new Map<string, number>();
  const seconds: number[] = [];
  let unknownUsers = 0;
  for (const student of paid) {
    const label = registrationLocationLabel(student);
    if (label === "暂无属地") unknownUsers++;
    regions.set(label, (regions.get(label) || 0) + 1);
    if (
      student.paymentOrders.some((order) =>
        hasInvalidPaymentTime(order, student.createdAt, now),
      )
    )
      continue;
    const firstPaidAt = Math.min(
      ...student.paymentOrders.map((order) => order.paidAt!.getTime()),
    );
    seconds.push((firstPaidAt - student.createdAt.getTime()) / 1000);
  }
  const duration = durationDistribution("payment", seconds, paid.length);
  return {
    observedAt: now.toISOString(),
    paidUsers: paid.length,
    everPaidUsers: everPaid.length,
    fullyRefundedUsers: everPaid.length - paid.length,
    geography: {
      knownUsers: paid.length - unknownUsers,
      unknownUsers,
      regions: [...regions]
        .map(([label, users]) => ({
          label,
          users,
          share: rate(users, paid.length),
        }))
        .sort(
          (a, b) =>
            b.users - a.users || a.label.localeCompare(b.label, "zh-CN"),
        ),
    },
    duration: {
      ...duration,
      meanSeconds: seconds.length
        ? seconds.reduce((sum, value) => sum + value, 0) / seconds.length
        : null,
      minSeconds: seconds.length ? Math.min(...seconds) : null,
      maxSeconds: seconds.length ? Math.max(...seconds) : null,
      invalidUsers: paid.length - seconds.length,
      withinDayShare: rate(
        seconds.filter((value) => value < 86400).length,
        seconds.length,
      ),
      withinWeekShare: rate(
        seconds.filter((value) => value < 7 * 86400).length,
        seconds.length,
      ),
    },
  };
}

// 全历史口径独立于日期筛选，地区只读取已保存的注册属地，不再实时定位。
export async function getPaidUserAnalytics(now = new Date()) {
  const rows = await prisma.user.findMany({
    where: {
      ...analyticsStudentWhere,
      paymentOrders: { some: realPaymentOrderWhere() },
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      createdAt: true,
      registrationCountry: true,
      registrationRegion: true,
      paymentOrders: {
        where: realPaymentOrderWhere(),
        orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          createdAt: true,
          paidAt: true,
          status: true,
          amountCents: true,
          refundedAmountCents: true,
        },
      },
    },
  });
  return aggregatePaidUserAnalytics(rows, now);
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

// 每位用户仅在首次真实付款日增加一次，区间之前的付费用户作为累计基数。
function cumulativePaidUserTrend(
  firstPayments: Map<string, ConversionOrder>,
  startAt: Date,
  endAt: Date,
) {
  const days = new Map<string, number>();
  const firstDay =
    Math.floor((startAt.getTime() + CHINA_OFFSET) / DAY) * DAY - CHINA_OFFSET;
  for (let time = firstDay; time < endAt.getTime(); time += DAY) {
    days.set(
      new Date(time + CHINA_OFFSET).toISOString().slice(0, 10),
      0,
    );
  }
  let cumulativePaidUsers = 0;
  for (const order of firstPayments.values()) {
    if (!order.paidAt || order.paidAt >= endAt) continue;
    if (order.paidAt.getTime() < firstDay) {
      cumulativePaidUsers += 1;
      continue;
    }
    const date = new Date(order.paidAt.getTime() + CHINA_OFFSET)
      .toISOString()
      .slice(0, 10);
    if (days.has(date)) days.set(date, days.get(date)! + 1);
  }
  return [...days].map(([date, newPaidUsers]) => {
    cumulativePaidUsers += newPaidUsers;
    return { date, cumulativePaidUsers };
  });
}

// 按首次仍有实付金额的付款日分组，日均值只使用所选范围内已经到来的北京时间自然日。
function examPaymentAnalysis(
  paidOrdersByUser: Map<string, ConversionOrder[]>,
  uncertainUsers: Set<string>,
  filters: ConversionFilters,
  now: Date,
) {
  const examDate = filters.examDate ?? `${new Date(now.getTime() + CHINA_OFFSET).getUTCFullYear()}-10-12`;
  const examAt = new Date(`${examDate}T00:00:00+08:00`).getTime();
  const endAt = Math.min(filters.endAt.getTime(), now.getTime(), examAt);
  const firstPayments = [...paidOrdersByUser].flatMap(([id, orders]) => {
    if (uncertainUsers.has(id)) return [];
    const first = orders.find(isRetainedPayment);
    return first?.paidAt ? [first.paidAt.getTime()] : [];
  });
  const stages = [
    { label: "考前 90 天以上", min: 91, max: null },
    { label: "考前 61–90 天", min: 61, max: 90 },
    { label: "考前 31–60 天", min: 31, max: 60 },
    { label: "考前 15–30 天", min: 15, max: 30 },
    { label: "考前 8–14 天", min: 8, max: 14 },
    { label: "考前 1–7 天", min: 1, max: 7 },
  ].map(({ label, min, max }) => {
    const stageStart = max === null ? filters.startAt.getTime() : examAt - max * DAY;
    const stageEnd = examAt - (min - 1) * DAY;
    const start = Math.max(stageStart, filters.startAt.getTime());
    const end = Math.min(stageEnd, endAt);
    const observedDays = end > start
      ? Math.ceil((end + CHINA_OFFSET) / DAY) - Math.floor((start + CHINA_OFFSET) / DAY)
      : 0;
    const users = firstPayments.filter((at) => at >= start && at < end).length;
    return {
      label,
      startDate: observedDays ? new Date(start + CHINA_OFFSET).toISOString().slice(0, 10) : null,
      endDate: observedDays ? new Date(end - 1 + CHINA_OFFSET).toISOString().slice(0, 10) : null,
      observedDays,
      users,
      dailyAverage: rate(users, observedDays),
      status: stageStart >= now.getTime() ? "not_started" : !observedDays ? "outside_range"
        : now.getTime() < stageEnd ? "ongoing"
        : start > stageStart || end < stageEnd ? "partial" : "complete",
    };
  });
  const totalUsers = stages.reduce((sum, stage) => sum + stage.users, 0);
  return {
    examDate,
    totalUsers,
    stages: stages.map((stage) => ({ ...stage, share: rate(stage.users, totalUsers) })),
  };
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
  // 先剔除全额退款订单再排序号，首单退款后仅重新购买一次不属于有效复购。
  const repeatPayerCount = students.filter(
    (student) =>
      !uncertainFirstPaymentUsers.has(student.id) &&
      (paidOrdersByUser.get(student.id) || []).filter(isRetainedPayment).some(
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
    paidUserGrowth: cumulativePaidUserTrend(
      firstPayments,
      filters.startAt,
      periodEnd,
    ),
    heatmap: cells.map(({ users, ...cell }) => ({
      ...cell,
      users: users.size,
    })),
    hourly,
    topHours,
    examPayments: examPaymentAnalysis(paidOrdersByUser, uncertainFirstPaymentUsers, filters, now),
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
      ...analyticsStudentWhere,
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
