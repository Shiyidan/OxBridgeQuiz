// 免费知识点练习沿用服务端冻结范围，统一授权续答、保存、交卷与解析。
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { hasActiveExamMembershipAccess } from "./member.js";
import { isFreePracticeScope } from "../constants/freeLearningAccess.js";
import { PRACTICE_SOURCE } from "../constants/domain.js";
import { parseJsonObject } from "../utils/jsonField.js";

interface PracticeAccessRecord {
  examType: string;
  paperId: string;
  practiceSource: string | null;
  practiceNotebookId: string | null;
  practiceSnapshot: unknown;
}

// 只信任服务器保存的直接练习快照；练习本、整卷和异常旧数据不能借用免费范围。
export function freePracticeRecordScope(
  record: PracticeAccessRecord,
): string | undefined {
  if (
    record.paperId !== "question-bank" ||
    record.practiceSource !== PRACTICE_SOURCE.DIRECT ||
    record.practiceNotebookId
  )
    return undefined;
  const snapshot = parseJsonObject(record.practiceSnapshot);
  const point = parseJsonObject(snapshot.knowledgePoint);
  if (
    snapshot.source !== PRACTICE_SOURCE.DIRECT ||
    typeof point.code !== "string"
  )
    return undefined;
  return isFreePracticeScope(record.examType, point.code)
    ? point.code
    : undefined;
}

// 恢复记录时检查记录自身范围，不接受本次请求另传的免费知识点覆盖旧范围。
export async function hasPracticeRecordAccess(
  userId: string,
  record: PracticeAccessRecord,
  db: typeof prisma | Prisma.TransactionClient = prisma,
): Promise<boolean> {
  return (
    Boolean(freePracticeRecordScope(record)) ||
    hasActiveExamMembershipAccess(userId, record.examType, db)
  );
}
