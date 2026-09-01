// 网站访问统计服务：按北京时间自然日去重 IP 摘要，并聚合访问与学生注册趋势。
import crypto from "node:crypto";
import { config } from "../config.js";
import { USER_ROLE } from "../constants/domain.js";
import {
  LEGAL_ACCEPTANCE_SOURCE,
  LEGAL_DOCUMENT_TYPE,
} from "../constants/legal.js";
import { normalizeIpAddress } from "../utils/ipAddress.js";
import { resolveIpLocation, type IpLocation } from "./ipGeolocation.js";
import { prisma } from "./prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const CHINA_TIMEZONE_OFFSET_MS = 8 * 60 * 60 * 1000;
const LOCATION_LOOKUP_CONCURRENCY = 8;

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
  ipAddress?: string | null;
}

interface RegistrationLocationItem {
  location: string;
  registrationCount: number;
  percentage: number;
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

// 地址展示只保留国家和行政区，避免城市级信息在低样本量下暴露过细位置。
function registrationLocationLabel(location: IpLocation): string {
  return (
    [...new Set([location.country, location.region].filter(Boolean))].join(
      " · ",
    ) || "未知地区"
  );
}

// 注册 IP 以固定并发解析，复用既有短超时缓存并避免集中请求压垮第三方服务。
async function resolveRegistrationLocations(
  ipAddresses: string[],
): Promise<Map<string, IpLocation | null>> {
  const locations = new Map<string, IpLocation | null>();
  let cursor = 0;

  async function resolveNext(): Promise<void> {
    while (cursor < ipAddresses.length) {
      const index = cursor;
      cursor += 1;
      const ipAddress = ipAddresses[index];
      if (!ipAddress) continue;
      locations.set(ipAddress, await resolveIpLocation(ipAddress));
    }
  }

  const workerCount = Math.min(LOCATION_LOOKUP_CONCURRENCY, ipAddresses.length);
  await Promise.all(Array.from({ length: workerCount }, () => resolveNext()));
  return locations;
}

// 注册地址按所选周期内学生的注册 IP 聚合，只返回国家/地区统计而不返回明文 IP。
async function aggregateRegistrationLocations(
  registrations: RegistrationSample[],
  filters: WebsiteTrafficFilters,
) {
  const currentRegistrations = registrations.filter(
    (item) => item.createdAt >= filters.startAt,
  );
  const uniqueIpAddresses = [
    ...new Set(
      currentRegistrations
        .map((item) => normalizeIpAddress(item.ipAddress))
        .filter((item): item is string => Boolean(item)),
    ),
  ];
  const locations = await resolveRegistrationLocations(uniqueIpAddresses);
  const counts = new Map<string, number>();
  let resolvedRegistrationCount = 0;

  for (const registration of currentRegistrations) {
    const ipAddress = normalizeIpAddress(registration.ipAddress);
    const location = ipAddress ? locations.get(ipAddress) : null;
    const label = location ? registrationLocationLabel(location) : "未知地区";
    if (location) resolvedRegistrationCount += 1;
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
): Promise<{ counted: boolean }> {
  const ipAddress = normalizeIpAddress(rawIpAddress);
  if (!ipAddress || isLikelyBot(userAgent)) return { counted: false };

  const businessDate = chinaBusinessDate(now);
  const ipHash = visitorIpHash(ipAddress);
  await prisma.websiteVisitDaily.upsert({
    where: { businessDate_ipHash: { businessDate, ipHash } },
    create: {
      businessDate,
      ipHash,
      visitorType,
      visitCount: 1,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      ...(visitorType === WEBSITE_VISITOR_TYPE.STUDENT ? { visitorType } : {}),
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
  const [visits, registrations] = await Promise.all([
    prisma.websiteVisitDaily.findMany({
      where: {
        businessDate: {
          gte: chinaBusinessDate(previousStartAt),
          lt: chinaBusinessDate(filters.endAt),
        },
      },
      select: { businessDate: true, ipHash: true, visitorType: true },
      orderBy: { businessDate: "asc" },
    }),
    prisma.user.findMany({
      where: {
        role: USER_ROLE.STUDENT,
        createdAt: { gte: previousStartAt, lt: filters.endAt },
      },
      select: {
        createdAt: true,
        legalAcceptances: {
          where: {
            source: LEGAL_ACCEPTANCE_SOURCE.REGISTER,
            documentType: LEGAL_DOCUMENT_TYPE.USER_AGREEMENT,
          },
          select: { ipAddress: true },
          orderBy: { acceptedAt: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const registrationSamples = registrations.map((item) => ({
    createdAt: item.createdAt,
    ipAddress: item.legalAcceptances[0]?.ipAddress,
  }));
  const trafficAnalytics = aggregateWebsiteTraffic(
    visits,
    registrationSamples,
    filters,
  );
  const locationDistribution = await aggregateRegistrationLocations(
    registrationSamples,
    filters,
  );
  return { ...trafficAnalytics, locationDistribution };
}
