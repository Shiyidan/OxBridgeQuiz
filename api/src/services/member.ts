// 会员权益上下文汇总与权限判定。用于会员接口和考试开始、交卷阶段的额度预检。
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { parseJsonArray } from "../utils/jsonField.js";
import {
  EFFECTIVE_MEMBERSHIP_STATUS,
  EFFECTIVE_PLAN,
  EXAM_TYPES,
  MEMBERSHIP_STATUS,
  PAPER_ACCESS_TIER,
  QUESTION_BANK_PAPER_TYPES,
  USER_ROLE,
  isStudentExamTypeAvailable,
} from "../constants/domain.js";

const DEFAULT_DIAGNOSTIC_LIMIT = 1;
const DEFAULT_QUESTION_BANK_LIMIT = 25;

export type EntitlementAction = "diagnostic" | "question-bank";
type MemberDatabase = typeof prisma | Prisma.TransactionClient;

export interface ExamPreferenceRecord {
  examType: string;
  subjects: string[];
  targetRegions?: string;
  targetUniversities?: string[];
  targetMajor?: string;
  entrySeason?: string;
  targetScore?: number;
  examDate?: string;
  weeklyHours?: number;
}

export interface StudyPreferences {
  examTypes: string[];
  esatSubjects: string[];
  targetRegions: string;
  targetUniversities: string[];
  targetMajor: string;
  targetScores: Record<"ESAT" | "TMUA", number | null>;
  examDate: string;
  weeklyHours: number;
}

const PROFILE_EXAM_DATES = new Set([
  "2026-10",
  "2027-01",
  "2027-10",
  "2028-01",
  "2028-10",
]);

// 剩余天数按自然日向上取整，避免未到期会员提前显示为零天。
function daysUntil(date: Date, now: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86400000));
}

// 对外时间字段统一输出毫秒时间戳，并保留未配置状态。
function toTimestamp(date: Date | null | undefined): number | null {
  return date ? date.getTime() : null;
}

// 会员只有同时满足状态与有效期条件时才参与权益判定。
function isMembershipActive(
  membership: { status: string; startsAt: Date; endsAt: Date },
  now: Date,
): boolean {
  return (
    membership.status === MEMBERSHIP_STATUS.ACTIVE &&
    membership.startsAt <= now &&
    membership.endsAt > now
  );
}

// 当前无有效会员时仍保留最近记录状态，供个人中心准确展示。
function effectiveMembershipStatus(
  membership: { status: string; endsAt: Date } | undefined,
  now: Date,
): string {
  if (!membership) return EFFECTIVE_MEMBERSHIP_STATUS.FREE;
  if (membership.status === MEMBERSHIP_STATUS.CANCELLED)
    return EFFECTIVE_MEMBERSHIP_STATUS.CANCELLED;
  if (
    membership.status === MEMBERSHIP_STATUS.EXPIRED ||
    membership.endsAt <= now
  )
    return EFFECTIVE_MEMBERSHIP_STATUS.EXPIRED;
  return membership.status;
}

// 同考试类型存在多条记录时选取仍在有效期内且结束最晚的一条。
async function getActiveMembership(
  userId: string,
  examType: string,
  now: Date,
  db: MemberDatabase,
) {
  const memberships = await db.userMembership.findMany({
    where: { userId, examType },
    orderBy: { endsAt: "desc" },
  });
  return (
    memberships.find((membership) => isMembershipActive(membership, now)) ||
    null
  );
}

// 会员资料按考试类型判断有效会员；管理员用于验收和维护时不受会员限制。
export async function hasActiveExamMembershipAccess(
  userId: string,
  examType: string,
  db: MemberDatabase = prisma,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return false;
  if (user.role === USER_ROLE.ADMIN) return true;
  return Boolean(await getActiveMembership(userId, examType, new Date(), db));
}

// 新诊断测试按试卷级访问设置授权；已创建的进行中测试由考试记录本身承接当次授权。
export async function hasDiagnosticPaperAccess(
  userId: string,
  paper: { examType: string; accessTier?: string | null },
  db: MemberDatabase = prisma,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return false;
  if (
    user.role === USER_ROLE.ADMIN ||
    paper.accessTier === PAPER_ACCESS_TIER.FREE
  ) {
    return true;
  }
  return Boolean(
    await getActiveMembership(userId, paper.examType, new Date(), db),
  );
}

// 权益配置按考试类型读取，未配置时由调用方使用安全默认额度。
async function getEntitlementConfig(examType: string, db: MemberDatabase) {
  return db.entitlementConfig.findFirst({
    where: { examType, status: MEMBERSHIP_STATUS.ACTIVE },
  });
}

// 诊断用量合并已关联会话和已提交真题，避免两条入口重复赠送额度。
async function countDiagnosticUsed(
  userId: string,
  examType: string,
  db: MemberDatabase,
): Promise<number> {
  const [sessionCount, examRecordCount] = await Promise.all([
    db.diagnosticSession.count({
      where: { userId, examType, status: "linked" },
    }),
    db.examRecord.count({
      where: {
        userId,
        examType,
        status: "submitted",
        paperId: { not: "question-bank" },
        paper: { paperType: { notIn: [...QUESTION_BANK_PAPER_TYPES] } },
      },
    }),
  ]);
  return sessionCount + examRecordCount;
}

// 题库用量按实际答题记录计数，确保额度反映用户已消费题目数。
async function countQuestionBankUsed(
  userId: string,
  examType: string,
  db: MemberDatabase,
): Promise<number> {
  return db.answerRecord.count({
    where: {
      examRecord: {
        userId,
        examType,
        status: "submitted",
        paperId: "question-bank",
      },
    },
  });
}

// 统一判断权益，路由预检查和提交兜底共用同一套规则。
export async function checkMemberAccess(
  userId: string,
  action: EntitlementAction,
  examType: string,
  requiredCount = 1,
  db: MemberDatabase = prisma,
) {
  const now = new Date();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user)
    return {
      allowed: false,
      reason: "USER_NOT_FOUND",
      examType,
      required: requiredCount,
    };
  if (!isStudentExamTypeAvailable(examType)) {
    return {
      allowed: false,
      reason: "EXAM_NOT_AVAILABLE",
      action,
      examType,
      required: requiredCount,
      limit: 0,
      used: 0,
      remaining: 0,
      unlimited: false,
    };
  }

  const isAdmin = user.role === USER_ROLE.ADMIN;
  const activeMembership = isAdmin
    ? null
    : await getActiveMembership(userId, examType, now, db);
  const config = await getEntitlementConfig(examType, db);
  const unlimited = isAdmin || !!activeMembership;
  const limit =
    action === "diagnostic"
      ? (config?.diagnosticLimit ?? DEFAULT_DIAGNOSTIC_LIMIT)
      : (config?.questionBankLimit ?? DEFAULT_QUESTION_BANK_LIMIT);
  const used =
    action === "diagnostic"
      ? await countDiagnosticUsed(userId, examType, db)
      : await countQuestionBankUsed(userId, examType, db);
  const remaining = unlimited ? null : Math.max(0, limit - used);
  const allowed = unlimited || (remaining ?? 0) >= requiredCount;

  return {
    allowed,
    reason: allowed ? null : "QUOTA_NOT_ENOUGH",
    action,
    examType,
    required: requiredCount,
    limit: unlimited ? null : limit,
    used,
    remaining,
    unlimited,
  };
}

// 汇总用户在各考试类型下的会员和免费额度上下文。
export async function getMemberContext(userId: string) {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      avatar: true,
      examPreferences: true,
    },
  });

  if (!user) return null;

  const [configs, memberships, paperExamTypes] = await Promise.all([
    prisma.entitlementConfig.findMany({ where: { status: "active" } }),
    prisma.userMembership.findMany({
      where: { userId },
      orderBy: { endsAt: "desc" },
    }),
    prisma.paper.findMany({
      select: { examType: true },
      distinct: ["examType"],
    }),
  ]);

  const examTypes = new Set<string>(EXAM_TYPES);
  for (const config of configs) examTypes.add(config.examType);
  for (const membership of memberships) examTypes.add(membership.examType);
  for (const paper of paperExamTypes) examTypes.add(paper.examType);

  const configMap = new Map(configs.map((config) => [config.examType, config]));
  const membershipsByExamType = new Map<string, typeof memberships>();
  for (const membership of memberships) {
    const items = membershipsByExamType.get(membership.examType) || [];
    items.push(membership);
    membershipsByExamType.set(membership.examType, items);
  }

  const isAdmin = user.role === USER_ROLE.ADMIN;
  const examTypeContexts = await Promise.all(
    [...examTypes].map(async (examType) => {
      const config = configMap.get(examType);
      const userMemberships = membershipsByExamType.get(examType) || [];
      const activeMembership = userMemberships.find((membership) =>
        isMembershipActive(membership, now),
      );
      const latestMembership = userMemberships[0];
      const entitlementEndMembership = userMemberships.find(
        (membership) =>
          membership.status === MEMBERSHIP_STATUS.ACTIVE && membership.endsAt > now,
      );
      const diagnosticLimit =
        config?.diagnosticLimit ?? DEFAULT_DIAGNOSTIC_LIMIT;
      const questionBankLimit =
        config?.questionBankLimit ?? DEFAULT_QUESTION_BANK_LIMIT;

      const [diagnosticUsed, questionBankUsed] = await Promise.all([
        countDiagnosticUsed(userId, examType, prisma),
        countQuestionBankUsed(userId, examType, prisma),
      ]);

      const unlimited = isAdmin || !!activeMembership;
      const plan =
        activeMembership?.plan ||
        latestMembership?.plan ||
        (isAdmin ? EFFECTIVE_PLAN.ADMIN : EFFECTIVE_PLAN.FREE);
      const status = activeMembership
        ? EFFECTIVE_MEMBERSHIP_STATUS.ACTIVE
        : isAdmin
          ? EFFECTIVE_MEMBERSHIP_STATUS.ACTIVE
          : effectiveMembershipStatus(latestMembership, now);

      return {
        examType,
        status,
        isMember: unlimited,
        plan,
        startsAt: toTimestamp(
          activeMembership?.startsAt || latestMembership?.startsAt,
        ),
        endsAt: toTimestamp(
          activeMembership?.endsAt || latestMembership?.endsAt,
        ),
        entitlementEndsAt: toTimestamp(
          entitlementEndMembership?.endsAt || latestMembership?.endsAt,
        ),
        remainingDays: activeMembership
          ? daysUntil(entitlementEndMembership?.endsAt || activeMembership.endsAt, now)
          : 0,
        diagnostic: {
          limit: unlimited ? null : diagnosticLimit,
          used: diagnosticUsed,
          remaining: unlimited
            ? null
            : Math.max(0, diagnosticLimit - diagnosticUsed),
          unlimited,
        },
        questionBank: {
          limit: unlimited ? null : questionBankLimit,
          used: questionBankUsed,
          remaining: unlimited
            ? null
            : Math.max(0, questionBankLimit - questionBankUsed),
          unlimited,
        },
      };
    }),
  );

  const membershipList = examTypeContexts
    .filter(
      (item) =>
        item.isMember ||
        item.status === "expired" ||
        item.status === "cancelled",
    )
    .map((item) => ({
      examType: item.examType,
      plan: item.plan,
      status: item.status,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      entitlementEndsAt: item.entitlementEndsAt,
      remainingDays: item.remainingDays,
    }));

  // 将 examTypes 数组转为 quotas 对象，前端用 quotas[examType] 直接取，无需 find()
  const quotas: Record<
    string,
    Omit<(typeof examTypeContexts)[number], "examType">
  > = {};
  for (const ctx of examTypeContexts) {
    const { examType, ...rest } = ctx;
    quotas[examType] = rest;
  }

  const examPreferences = safeParseExamPreferences(user.examPreferences);

  return {
    user,
    role: user.role,
    isAdmin,
    memberships: membershipList,
    quotas,
    examPreferences,
    studyPreferences: buildStudyPreferences(examPreferences),
  };
}

// 读取历史或空偏好时统一返回数组，避免会员上下文输出不稳定结构。
function safeParseExamPreferences(raw: unknown): ExamPreferenceRecord[] {
  return parseJsonArray<ExamPreferenceRecord>(raw);
}

// 历史申请季和完整日期统一映射到个人中心支持的考试月份。
function resolveStudyExamDate(preferences: ExamPreferenceRecord[]): string {
  const savedDate = preferences.find((item) => item.examDate)?.examDate?.slice(0, 7);
  if (savedDate && PROFILE_EXAM_DATES.has(savedDate)) return savedDate;

  const entrySeason = preferences.find((item) => item.entrySeason)?.entrySeason || "";
  const entryYear = entrySeason.match(/^\s*(\d{4})/u)?.[1];
  const migratedDate = entryYear
    ? `${entryYear}-${entrySeason.includes("春季") ? "01" : "10"}`
    : "";
  return PROFILE_EXAM_DATES.has(migratedDate) ? migratedDate : "2026-10";
}

// 会员上下文提供单一账户级偏好，前端无需理解底层按考试兼容存储。
export function buildStudyPreferences(preferences: ExamPreferenceRecord[]): StudyPreferences {
  const esatPreference = preferences.find((item) => item.examType.toUpperCase() === "ESAT");
  const tmuaPreference = preferences.find((item) => item.examType.toUpperCase() === "TMUA");
  const firstWith = <T>(selector: (item: ExamPreferenceRecord) => T | undefined): T | undefined =>
    preferences.map(selector).find((value) => value !== undefined);
  const weeklyHours = firstWith((item) => item.weeklyHours);

  return {
    examTypes: [
      ...new Set(
        preferences
          .map((item) => item.examType.toUpperCase())
          .filter((examType) => examType === "ESAT" || examType === "TMUA"),
      ),
    ],
    esatSubjects: esatPreference?.subjects || [],
    targetRegions: firstWith((item) => item.targetRegions) || "",
    targetUniversities: firstWith((item) => item.targetUniversities) || [],
    targetMajor: firstWith((item) => item.targetMajor) || "",
    targetScores: {
      ESAT: esatPreference?.targetScore ?? null,
      TMUA: tmuaPreference?.targetScore ?? null,
    },
    examDate: resolveStudyExamDate(preferences),
    weeklyHours:
      weeklyHours && weeklyHours >= 1 && weeklyHours <= 80 ? weeklyHours : 20,
  };
}

// 全局偏好在数据库写入前转换为报告链路仍在使用的按考试记录。
export function expandStudyPreferences(preferences: StudyPreferences): ExamPreferenceRecord[] {
  return preferences.examTypes.map((examType) => {
    const targetScore =
      examType === "ESAT" || examType === "TMUA" ? preferences.targetScores[examType] : null;
    return {
      examType,
      subjects: examType === "ESAT" ? [...preferences.esatSubjects] : ["Paper 1", "Paper 2"],
      targetRegions: preferences.targetRegions,
      targetUniversities: [...preferences.targetUniversities],
      targetMajor: preferences.targetMajor,
      ...(targetScore !== null ? { targetScore } : {}),
      examDate: preferences.examDate,
      weeklyHours: preferences.weeklyHours,
    };
  });
}
