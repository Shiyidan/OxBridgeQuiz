import { prisma } from './prisma.js'
import { formatUserForClient } from '../utils/userPresenter.js'
import {
  EFFECTIVE_MEMBERSHIP_STATUS,
  EFFECTIVE_PLAN,
  EXAM_TYPES,
  MEMBERSHIP_STATUS,
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  USER_ROLE,
} from '../constants/domain.js'

const DEFAULT_DIAGNOSTIC_LIMIT = 2
const DEFAULT_QUESTION_BANK_LIMIT = 100

export type EntitlementAction = 'diagnostic' | 'question-bank'

function daysUntil(date: Date, now: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86400000))
}

function toTimestamp(date: Date | null | undefined): number | null {
  return date ? date.getTime() : null
}

function isMembershipActive(membership: { status: string; startsAt: Date; endsAt: Date }, now: Date): boolean {
  return membership.status === MEMBERSHIP_STATUS.ACTIVE && membership.startsAt <= now && membership.endsAt > now
}

function effectiveMembershipStatus(membership: { status: string; endsAt: Date } | undefined, now: Date): string {
  if (!membership) return EFFECTIVE_MEMBERSHIP_STATUS.FREE
  if (membership.status === MEMBERSHIP_STATUS.CANCELLED) return EFFECTIVE_MEMBERSHIP_STATUS.CANCELLED
  if (membership.status === MEMBERSHIP_STATUS.EXPIRED || membership.endsAt <= now) return EFFECTIVE_MEMBERSHIP_STATUS.EXPIRED
  return membership.status
}

async function getActiveMembership(userId: string, examType: string, now: Date) {
  const memberships = await prisma.userMembership.findMany({
    where: { userId, examType },
    orderBy: { endsAt: 'desc' },
  })
  return memberships.find((membership) => isMembershipActive(membership, now)) || null
}

async function getEntitlementConfig(examType: string) {
  return prisma.entitlementConfig.findFirst({
    where: { examType, status: MEMBERSHIP_STATUS.ACTIVE },
  })
}

async function countDiagnosticUsed(userId: string, examType: string): Promise<number> {
  const [sessionCount, examRecordCount] = await Promise.all([
    prisma.diagnosticSession.count({
      where: { userId, examType, status: 'linked' },
    }),
    prisma.examRecord.count({
      where: {
        userId,
        examType,
        status: 'submitted',
        paper: { paperType: { in: [...REAL_PAPER_TYPES] } },
      },
    }),
  ])
  return sessionCount + examRecordCount
}

async function countQuestionBankUsed(userId: string, examType: string): Promise<number> {
  return prisma.answerRecord.count({
    where: {
      examRecord: {
        userId,
        examType,
        paper: { paperType: { in: [...QUESTION_BANK_PAPER_TYPES] } },
      },
    },
  })
}

// 统一判断权益，路由预检查和提交兜底共用同一套规则。
export async function checkMemberAccess(
  userId: string,
  action: EntitlementAction,
  examType: string,
  requiredCount = 1,
) {
  const now = new Date()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })
  if (!user) return { allowed: false, reason: 'USER_NOT_FOUND', examType, required: requiredCount }

  const isAdmin = user.role === USER_ROLE.ADMIN
  const activeMembership = isAdmin ? null : await getActiveMembership(userId, examType, now)
  const config = await getEntitlementConfig(examType)
  const unlimited = isAdmin || !!activeMembership
  const limit = action === 'diagnostic'
    ? config?.diagnosticLimit ?? DEFAULT_DIAGNOSTIC_LIMIT
    : config?.questionBankLimit ?? DEFAULT_QUESTION_BANK_LIMIT
  const used = action === 'diagnostic'
    ? await countDiagnosticUsed(userId, examType)
    : await countQuestionBankUsed(userId, examType)
  const remaining = unlimited ? null : Math.max(0, limit - used)
  const allowed = unlimited || (remaining ?? 0) >= requiredCount

  return {
    allowed,
    reason: allowed ? null : 'QUOTA_NOT_ENOUGH',
    action,
    examType,
    required: requiredCount,
    limit: unlimited ? null : limit,
    used,
    remaining,
    unlimited,
  }
}

// 汇总用户在各考试类型下的会员和免费额度上下文
export async function getMemberContext(userId: string) {
  const now = new Date()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true, role: true, avatar: true, paymentStatus: true, examPreferences: true },
  })

  if (!user) return null

  const [configs, memberships, paperExamTypes] = await Promise.all([
    prisma.entitlementConfig.findMany({ where: { status: 'active' } }),
    prisma.userMembership.findMany({
      where: { userId },
      orderBy: { endsAt: 'desc' },
    }),
    prisma.paper.findMany({
      select: { examType: true },
      distinct: ['examType'],
    }),
  ])

  const examTypes = new Set<string>(EXAM_TYPES)
  for (const config of configs) examTypes.add(config.examType)
  for (const membership of memberships) examTypes.add(membership.examType)
  for (const paper of paperExamTypes) examTypes.add(paper.examType)

  const configMap = new Map(configs.map((config) => [config.examType, config]))
  const membershipsByExamType = new Map<string, typeof memberships>()
  for (const membership of memberships) {
    const items = membershipsByExamType.get(membership.examType) || []
    items.push(membership)
    membershipsByExamType.set(membership.examType, items)
  }

  const isAdmin = user.role === USER_ROLE.ADMIN
  const examTypeContexts = await Promise.all(
    [...examTypes].map(async (examType) => {
      const config = configMap.get(examType)
      const userMemberships = membershipsByExamType.get(examType) || []
      const activeMembership = userMemberships.find((membership) => isMembershipActive(membership, now))
      const latestMembership = userMemberships[0]
      const diagnosticLimit = config?.diagnosticLimit ?? DEFAULT_DIAGNOSTIC_LIMIT
      const questionBankLimit = config?.questionBankLimit ?? DEFAULT_QUESTION_BANK_LIMIT

      const [diagnosticUsed, questionBankUsed] = await Promise.all([
        countDiagnosticUsed(userId, examType),
        prisma.answerRecord.count({
          where: {
            examRecord: {
              userId,
              examType,
              paper: { paperType: { in: [...QUESTION_BANK_PAPER_TYPES] } },
            },
          },
        }),
      ])

      const unlimited = isAdmin || !!activeMembership
      const plan = activeMembership?.plan || latestMembership?.plan || (isAdmin ? EFFECTIVE_PLAN.ADMIN : EFFECTIVE_PLAN.FREE)
      const status = activeMembership
        ? EFFECTIVE_MEMBERSHIP_STATUS.ACTIVE
        : (isAdmin
            ? EFFECTIVE_MEMBERSHIP_STATUS.ACTIVE
            : effectiveMembershipStatus(latestMembership, now))

      return {
        examType,
        status,
        isMember: unlimited,
        plan,
        startsAt: toTimestamp(activeMembership?.startsAt || latestMembership?.startsAt),
        endsAt: toTimestamp(activeMembership?.endsAt || latestMembership?.endsAt),
        remainingDays: activeMembership ? daysUntil(activeMembership.endsAt, now) : 0,
        diagnostic: {
          limit: unlimited ? null : diagnosticLimit,
          used: diagnosticUsed,
          remaining: unlimited ? null : Math.max(0, diagnosticLimit - diagnosticUsed),
          unlimited,
        },
        questionBank: {
          limit: unlimited ? null : questionBankLimit,
          used: questionBankUsed,
          remaining: unlimited ? null : Math.max(0, questionBankLimit - questionBankUsed),
          unlimited,
        },
      }
    }),
  )

  const membershipList = examTypeContexts
    .filter((item) => item.isMember || item.status === 'expired' || item.status === 'cancelled')
    .map((item) => ({
      examType: item.examType,
      plan: item.plan,
      status: item.status,
      startsAt: item.startsAt,
      endsAt: item.endsAt,
      remainingDays: item.remainingDays,
    }))

  // 将 examTypes 数组转为 quotas 对象，前端用 quotas[examType] 直接取，无需 find()
  const quotas: Record<string, Omit<typeof examTypeContexts[number], 'examType'>> = {}
  for (const ctx of examTypeContexts) {
    const { examType, ...rest } = ctx
    quotas[examType] = rest
  }

  return {
    user: formatUserForClient(user),
    role: user.role,
    isAdmin,
    memberships: membershipList,
    quotas,
    examPreferences: safeParseExamPreferences(user.examPreferences),
  }
}

function safeParseExamPreferences(raw: string): Array<{ examType: string; subjects: string[] }> {
  try { return JSON.parse(raw) } catch { return [] }
}
