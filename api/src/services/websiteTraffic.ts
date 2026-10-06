// 网站访问统计服务：按北京时间自然日去重 IP 摘要，并聚合访问与学生注册趋势。
import crypto from "node:crypto";
import { config } from "../config.js";
import { EXAM_TYPE, USER_ROLE } from "../constants/domain.js";
import { analyticsStudentWhere, analyticsUserWhere } from "./analyticsScope.js";
import { normalizeIpAddress } from "../utils/ipAddress.js";
import { parseJsonArray } from "../utils/jsonField.js";
import { registrationLocationLabel } from "./registrationLocation.js";
import { prisma } from "./prisma.js";
import { isRetainedPayment, realPaymentOrderWhere } from "./revenuePayments.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000;

export const WEBSITE_TRAFFIC_MAX_RANGE_DAYS = 90;
export const WEBSITE_TRAFFIC_TIMEZONE = "Asia/Shanghai";
export const WEBSITE_VISITOR_TYPE = {
  STUDENT: "student",
  ANONYMOUS: "anonymous",
} as const;
export type WebsiteVisitorType =
  (typeof WEBSITE_VISITOR_TYPE)[keyof typeof WEBSITE_VISITOR_TYPE];

export interface WebsiteTrafficFilters {
  startAt: Date;
  endAt: Date;
}

export interface WebsiteVisitSample {
  businessDate: Date;
  ipHash: string;
  visitorType?: string | null;
}

export interface RegistrationSample {
  createdAt: Date;
  registrationCountry?: string | null;
  registrationRegion?: string | null;
  examPreferences?: unknown;
}

interface RegistrationLocationItem {
  location: string;
  registrationCount: number;
  percentage: number;
}

// 按当前备考偏好将所选周期注册的学生互斥分组，多选学生只计入双考试类别。
export function aggregateRegistrationExamPreferences(
  registrations: RegistrationSample[],
  filters: WebsiteTrafficFilters,
) {
  return aggregateExamPreferences(registrations.filter(student =>
    student.createdAt >= filters.startAt && student.createdAt < filters.endAt,
  ));
}

// 注册与付费人群使用同一套互斥分类，统计用户当前偏好而非购买套餐包含的考试。
function aggregateExamPreferences(students: Pick<RegistrationSample, "examPreferences">[]) {
  const counts = { ESAT: 0, TMUA: 0, both: 0, unset: 0 };
  let totalStudentCount = 0;
  for (const student of students) {
    const examTypes = new Set(
      parseJsonArray<{ examType?: unknown } | null>(student.examPreferences)
        .map((item) => typeof item?.examType === "string" ? item.examType.trim().toUpperCase() : ""),
    );
    const esat = examTypes.has(EXAM_TYPE.ESAT);
    const tmua = examTypes.has(EXAM_TYPE.TMUA);
    const category = esat && tmua ? "both" : esat ? EXAM_TYPE.ESAT : tmua ? EXAM_TYPE.TMUA : "unset";
    counts[category] += 1;
    totalStudentCount += 1;
  }
  const categories = [
    { category: EXAM_TYPE.ESAT, label: EXAM_TYPE.ESAT },
    { category: EXAM_TYPE.TMUA, label: EXAM_TYPE.TMUA },
    { category: "both", label: `${EXAM_TYPE.ESAT} + ${EXAM_TYPE.TMUA}` },
    { category: "unset", label: "未设置" },
  ] as const;
  return {
    totalStudentCount,
    items: categories.map(({ category, label }) => ({
      category,
      label,
      studentCount: counts[category],
      percentage: totalStudentCount > 0
        ? Math.round(counts[category] / totalStudentCount * 10_000) / 100
        : 0,
    })),
  };
}

// 默认范围覆盖今天及此前 29 个北京时间自然日，结束时间使用半开区间。
export function defaultWebsiteTrafficPeriod(
  now = new Date(),
): WebsiteTrafficFilters {
  const chinaNow = new Date(now.getTime() + CHINA_TIMEZONE_OFFSET_MS);
  const chinaDayStart = Date.UTC(
    chinaNow.getUTCFullYear(),
    chinaNow.getUTCMonth(),
    chinaNow.getUTCDate(),
  );
  const endAt = new Date(chinaDayStart - CHINA_TIMEZONE_OFFSET_MS + DAY_MS);
  return { startAt: new Date(endAt.getTime() - 30 * DAY_MS), endAt };
}

// 常见爬虫不进入产品访问量，避免搜索索引和自动探测抬高真实访问趋势。
function isLikelyBot(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return /(bot|crawler|spider|slurp|bingpreview|headlesschrome|lighthouse|pagespeed)/i.test(
    userAgent,
  );
}

// 业务日期固定使用北京时间，数据库 DATE 仅承载日历日而不表达时区。
function chinaBusinessDate(value: Date): Date {
  const chinaDate = new Date(value.getTime() + CHINA_TIMEZONE_OFFSET_MS);
  const key = chinaDate.toISOString().slice(0, 10);
  return new Date(`${key}T00:00:00.000Z`);
}

// 趋势键使用北京时间自然日，确保凌晨访问与注册不会落入前一天。
function chinaDateKey(value: Date): string {
  return new Date(value.getTime() + CHINA_TIMEZONE_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

// DATE 字段从 Prisma 读取后按 UTC 日历文本取值，不再做二次时区平移。
function businessDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

// IP 摘要使用稳定密钥和版本域，支持周期内去重但不持久化明文地址。
function visitorIpHash(ipAddress: string): string {
  return crypto
    .createHmac("sha256", config.visitorIpHashSecret)
    .update(`website-visitor-ip:v1:${ipAddress}`)
    .digest("hex");
}

// 百分比变化在上期为零时返回空值，避免展示没有基线的虚构增长率。
function changeRate(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 10_000) / 10_000;
}

// 注册地址直接汇总用户资料中的国家和地区，查看统计不触发外部定位。
export function aggregateRegistrationLocations(
  registrations: RegistrationSample[],
  filters: WebsiteTrafficFilters,
) {
  const currentRegistrations = registrations.filter(
    (item) => item.createdAt >= filters.startAt && item.createdAt < filters.endAt,
  );
  let resolvedRegistrationCount = 0;
  const counts = new Map<string, number>();

  for (const registration of currentRegistrations) {
    const label = registrationLocationLabel(registration);
    if (label !== "暂无属地") resolvedRegistrationCount += 1;
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  const totalRegistrationCount = currentRegistrations.length;
  const items: RegistrationLocationItem[] = [...counts.entries()]
    .map(([location, registrationCount]) => ({
      location,
      registrationCount,
      percentage:
        totalRegistrationCount > 0
          ? Math.round((registrationCount / totalRegistrationCount) * 10_000) /
            100
          : 0,
    }))
    .sort(
      (left, right) =>
        right.registrationCount - left.registrationCount ||
        left.location.localeCompare(right.location),
    );

  return {
    source: "registration_ip" as const,
    precision: "country_region" as const,
    totalRegistrationCount,
    resolvedRegistrationCount,
    unknownRegistrationCount:
      totalRegistrationCount - resolvedRegistrationCount,
    items,
  };
}

// 公开上报按日期与 IP 幂等写入；同一 IP 当天先匿名后登录时升级为学生，之后不再降级。
export async function recordWebsiteVisit(
  rawIpAddress: string | undefined,
  userAgent: string | undefined,
  visitorType: WebsiteVisitorType,
  now = new Date(),
  userId?: string,
): Promise<{ counted: boolean }> {
  const ipAddress = normalizeIpAddress(rawIpAddress);
  if (!ipAddress || isLikelyBot(userAgent)) return { counted: false };

  const businessDate = chinaBusinessDate(now);
  const ipHash = visitorIpHash(ipAddress);
  const identified = visitorType === WEBSITE_VISITOR_TYPE.STUDENT && !!userId;
  const users = identified ? { connect: { id: userId! } } : undefined;
  await prisma.websiteVisitDaily.upsert({
    where: { businessDate_ipHash: { businessDate, ipHash } },
    create: {
      businessDate,
      ipHash,
      visitorType,
      hasUnattributedVisit: !identified,
      users,
      visitCount: 1,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      ...(visitorType === WEBSITE_VISITOR_TYPE.STUDENT ? { visitorType } : {}),
      ...(!identified ? { hasUnattributedVisit: true } : {}),
      users,
      lastSeenAt: now,
    },
  });
  if (visitorType === WEBSITE_VISITOR_TYPE.ANONYMOUS) {
    await prisma.websiteVisitDaily.updateMany({
      where: { businessDate, ipHash, visitorType: null },
      data: { visitorType },
    });
  }
  return { counted: true };
}

// 聚合函数保持纯计算，便于覆盖周期去重、上期对比和空白日期补齐规则。
export function aggregateWebsiteTraffic(
  visits: WebsiteVisitSample[],
  registrations: RegistrationSample[],
  filters: WebsiteTrafficFilters,
) {
  const durationMs = filters.endAt.getTime() - filters.startAt.getTime();
  const previousStartAt = new Date(filters.startAt.getTime() - durationMs);
  const currentStartKey = chinaDateKey(filters.startAt);
  const currentVisits = visits.filter(
    (item) => businessDateKey(item.businessDate) >= currentStartKey,
  );
  const previousVisits = visits.filter(
    (item) => businessDateKey(item.businessDate) < currentStartKey,
  );
  const currentRegistrations = registrations.filter(
    (item) => item.createdAt >= filters.startAt,
  );
  const previousRegistrations = registrations.filter(
    (item) => item.createdAt < filters.startAt,
  );

  const currentUniqueIps = new Set(currentVisits.map((item) => item.ipHash))
    .size;
  const previousUniqueIps = new Set(previousVisits.map((item) => item.ipHash))
    .size;
  const currentVisitCount = currentVisits.length;
  const previousVisitCount = previousVisits.length;

  const trend = new Map<
    string,
    {
      ipHashes: Set<string>;
      studentVisitCount: number;
      anonymousVisitCount: number;
      registrationCount: number;
    }
  >();
  for (
    let cursor = filters.startAt.getTime();
    cursor < filters.endAt.getTime();
    cursor += DAY_MS
  ) {
    trend.set(chinaDateKey(new Date(cursor)), {
      ipHashes: new Set(),
      studentVisitCount: 0,
      anonymousVisitCount: 0,
      registrationCount: 0,
    });
  }
  for (const visit of currentVisits) {
    const item = trend.get(businessDateKey(visit.businessDate));
    if (!item) continue;
    item.ipHashes.add(visit.ipHash);
    if (visit.visitorType === WEBSITE_VISITOR_TYPE.STUDENT) {
      item.studentVisitCount += 1;
    } else {
      // 身份分类上线前的历史记录没有 visitorType，统一按匿名访客展示。
      item.anonymousVisitCount += 1;
    }
  }
  for (const registration of currentRegistrations) {
    const item = trend.get(chinaDateKey(registration.createdAt));
    if (item) item.registrationCount += 1;
  }

  return {
    scope: {
      timezone: WEBSITE_TRAFFIC_TIMEZONE,
      uniqueIpDefinition: "period_distinct_hmac" as const,
      visitDefinition: "daily_distinct_ip" as const,
      visitorClassification: "authenticated_role" as const,
      registrationRole: USER_ROLE.STUDENT,
    },
    period: {
      startAt: filters.startAt.toISOString(),
      endAt: filters.endAt.toISOString(),
      previousStartAt: previousStartAt.toISOString(),
      previousEndAt: filters.startAt.toISOString(),
      endExclusive: true as const,
    },
    overview: {
      uniqueIpCount: currentUniqueIps,
      uniqueIpChangeRate: changeRate(currentUniqueIps, previousUniqueIps),
      visitCount: currentVisitCount,
      visitCountChangeRate: changeRate(currentVisitCount, previousVisitCount),
      registrationCount: currentRegistrations.length,
      registrationCountChangeRate: changeRate(
        currentRegistrations.length,
        previousRegistrations.length,
      ),
    },
    trend: [...trend.entries()].map(([date, item]) => ({
      date,
      uniqueIpCount: item.ipHashes.size,
      visitCount: item.ipHashes.size,
      studentVisitCount: item.studentVisitCount,
      anonymousVisitCount: item.anonymousVisitCount,
      registrationCount: item.registrationCount,
    })),
    generatedAt: new Date().toISOString(),
  };
}

// 查询同时覆盖当前周期和等长上一周期，所有比较指标来自同一份数据库快照。
export async function getWebsiteTrafficAnalytics(
  filters: WebsiteTrafficFilters,
) {
  const durationMs = filters.endAt.getTime() - filters.startAt.getTime();
  const previousStartAt = new Date(filters.startAt.getTime() - durationMs);
  const paidOrderWhere = {
    ...realPaymentOrderWhere(),
    paidAt: { gte: filters.startAt, lt: filters.endAt },
  };
  const [visits, registrations, paidStudents] = await Promise.all([
    prisma.websiteVisitDaily.findMany({
      where: {
        // 仅当该 IP 当天的已知账号全部封禁且没有匿名访问时剔除，保留共用网络的正常访问。
        OR: [
          { hasUnattributedVisit: true },
          { users: { none: {} } },
          { users: { some: analyticsUserWhere } },
        ],
        businessDate: {
          gte: chinaBusinessDate(previousStartAt),
          lt: chinaBusinessDate(filters.endAt),
        },
      },
      select: {
        businessDate: true, ipHash: true, visitorType: true,
        users: { where: analyticsUserWhere, select: { id: true } },
        _count: { select: { users: true } },
      },
      orderBy: { businessDate: "asc" },
    }),
    prisma.user.findMany({
      where: {
        ...analyticsStudentWhere,
        createdAt: { gte: previousStartAt, lt: filters.endAt },
      },
      select: {
        createdAt: true,
        examPreferences: true,
        registrationCountry: true,
        registrationRegion: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: {
        ...analyticsStudentWhere,
        paymentOrders: { some: paidOrderWhere },
      },
      select: {
        examPreferences: true,
        paymentOrders: {
          where: paidOrderWhere,
          select: { status: true, amountCents: true, refundedAmountCents: true },
        },
      },
    }),
  ]);
  const registrationSamples = registrations.map((item) => ({
    createdAt: item.createdAt,
    examPreferences: item.examPreferences,
    registrationCountry: item.registrationCountry,
    registrationRegion: item.registrationRegion,
  }));
  const trafficAnalytics = aggregateWebsiteTraffic(
    visits.map((visit) => ({
      businessDate: visit.businessDate,
      ipHash: visit.ipHash,
      // 仅剩匿名访问时不能继续算登录学生；没有账号关联的旧记录沿用原始分类。
      visitorType: visit.users.length ? WEBSITE_VISITOR_TYPE.STUDENT
        : visit._count.users ? WEBSITE_VISITOR_TYPE.ANONYMOUS : visit.visitorType,
    })),
    registrationSamples,
    filters,
  );
  const locationDistribution = aggregateRegistrationLocations(
    registrationSamples,
    filters,
  );
  const examPreferenceDistribution = aggregateRegistrationExamPreferences(registrationSamples, filters);
  const paidExamPreferenceDistribution = aggregateExamPreferences(
    paidStudents.filter(student => student.paymentOrders.some(isRetainedPayment)),
  );
  return { ...trafficAnalytics, locationDistribution, examPreferenceDistribution, paidExamPreferenceDistribution };
}
