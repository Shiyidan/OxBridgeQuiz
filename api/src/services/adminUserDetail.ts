// 管理后台用户详情：按用户聚合个人信息、登录位置与正式答题记录，供用户管理抽屉按需查询。
import {
  ANSWER_RECORD_STATE,
  CARD_REWARD_SOURCE,
  EXAM_RECORD_STATUS,
  INVITATION_REWARD_ACTIVATION_WINDOW_HOURS,
  INVITATION_REWARD_ROLE,
  INVITATION_REWARD_STATUS,
  MEMBERSHIP_STATUS,
  PRACTICE_SOURCE,
  USER_ROLE,
  isMockPaperType,
  isRealPaperType,
} from '../constants/domain.js'
import { resolveIpLocation } from './ipGeolocation.js'
import { prisma } from './prisma.js'
import { normalizeIpAddress } from '../utils/ipAddress.js'

interface AdminUserDetailOptions {
  page: number
  pageSize: number
  module?: UserActivityModuleKey
}

export const USER_ACTIVITY_MODULES = [
  { key: 'diagnostic', label: '诊断测试' },
  { key: 'mockExam', label: '模考' },
  { key: 'questionBank', label: '试题库' },
  { key: 'mistakeNotebook', label: '错题本' },
] as const

export type UserActivityModuleKey = (typeof USER_ACTIVITY_MODULES)[number]['key']

// 模块筛选参数只接受后台概览中固定展示的四个产品模块。
export function isUserActivityModule(value: unknown): value is UserActivityModuleKey {
  return USER_ACTIVITY_MODULES.some((module) => module.key === value)
}

// 试卷类型区分诊断、模考与题库，题库中的 notebook 来源单独归入错题本。
function resolveUserActivityModule(record: {
  practiceSource: string | null
  paper: { paperType: string }
}): UserActivityModuleKey {
  if (record.practiceSource === PRACTICE_SOURCE.NOTEBOOK) return 'mistakeNotebook'
  if (isMockPaperType(record.paper.paperType)) return 'mockExam'
  if (isRealPaperType(record.paper.paperType)) return 'diagnostic'
  return 'questionBank'
}

// 四个产品模块固定展示，未产生记录的模块也返回 0 次。
function countUserActivityModules(
  records: Array<{ practiceSource: string | null; paper: { paperType: string } }>,
) {
  const counts = new Map<UserActivityModuleKey, number>()
  for (const record of records) {
    const key = resolveUserActivityModule(record)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return USER_ACTIVITY_MODULES.map((module) => ({
    key: module.key,
    label: module.label,
    count: counts.get(module.key) || 0,
  }))
}

// 待启用卡超过30天领取期限后按已过期展示，不依赖个人中心先触发状态回写。
function effectiveRewardStatus(
  reward: { status: string; grantedAt: Date | null },
  now: Date,
): string {
  if (
    reward.status === INVITATION_REWARD_STATUS.PENDING_ACTIVATION &&
    reward.grantedAt &&
    reward.grantedAt.getTime() + INVITATION_REWARD_ACTIVATION_WINDOW_HOURS * 60 * 60 * 1000 <=
      now.getTime()
  ) {
    return INVITATION_REWARD_STATUS.EXPIRED
  }
  return reward.status
}

// 权益卡仅按当前用户持有情况汇总，不返回管理员、发放批次等操作历史。
function summarizeRewardCards(
  rewards: Array<{
    sourceType: string
    beneficiaryRole: string
    status: string
    grantedAt: Date | null
  }>,
  now: Date,
) {
  const definitions = [
    {
      key: 'inviterWeek',
      label: '邀请奖励周卡',
      sourceType: CARD_REWARD_SOURCE.INVITATION,
      beneficiaryRole: INVITATION_REWARD_ROLE.INVITER,
    },
    {
      key: 'inviteeWeek',
      label: '受邀奖励周卡',
      sourceType: CARD_REWARD_SOURCE.INVITATION,
      beneficiaryRole: INVITATION_REWARD_ROLE.INVITEE,
    },
    {
      key: 'dailyGift',
      label: '赠送日卡',
      sourceType: CARD_REWARD_SOURCE.ADMIN_GIFT,
      beneficiaryRole: INVITATION_REWARD_ROLE.RECIPIENT,
    },
  ] as const
  return definitions.map((definition) => {
    const statuses = rewards
      .filter(
        (reward) =>
          reward.sourceType === definition.sourceType &&
          reward.beneficiaryRole === definition.beneficiaryRole,
      )
      .map((reward) => effectiveRewardStatus(reward, now))
    return {
      key: definition.key,
      label: definition.label,
      total: statuses.length,
      pendingCount: statuses.filter(
        (status) => status === INVITATION_REWARD_STATUS.PENDING_ACTIVATION,
      ).length,
      activatedCount: statuses.filter(
        (status) => status === INVITATION_REWARD_STATUS.ACTIVATED,
      ).length,
      expiredCount: statuses.filter((status) => status === INVITATION_REWARD_STATUS.EXPIRED)
        .length,
      revokedCount: statuses.filter((status) => status === INVITATION_REWARD_STATUS.REVOKED)
        .length,
    }
  })
}

// 登录 IP 仅用于解析属地，不向管理页面返回原始地址。
async function resolveLoginLocation(ipAddress: string | null | undefined) {
  const address = normalizeIpAddress(ipAddress)
  if (!address) return null
  return resolveIpLocation(address)
}

// 详情请求独立分页答题记录，同时按记录来源汇总四个产品模块的使用次数。
export async function getAdminUserDetail(userId: string, options: AdminUserDetailOptions) {
  const now = new Date()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      diagnosticUsed: true,
      memberships: {
        where: {
          status: MEMBERSHIP_STATUS.ACTIVE,
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        select: {
          id: true,
          examType: true,
          plan: true,
          status: true,
          startsAt: true,
          endsAt: true,
        },
        orderBy: [{ examType: 'asc' }, { endsAt: 'desc' }],
      },
      receivedInvitation: {
        select: {
          source: true,
          boundAt: true,
          inviter: { select: { id: true, username: true } },
          invitationCode: { select: { code: true } },
        },
      },
      invitationRewards: {
        where: {
          grantedAt: { not: null },
          sourceType: {
            in: [CARD_REWARD_SOURCE.ADMIN_GIFT, CARD_REWARD_SOURCE.INVITATION],
          },
        },
        select: { sourceType: true, beneficiaryRole: true, status: true, grantedAt: true },
      },
      authSessions: {
        where: { ipAddress: { not: null } },
        select: { ipAddress: true, createdAt: true, lastUsedAt: true },
        orderBy: { lastUsedAt: 'desc' },
        take: 1,
      },
    },
  })
  if (!user) return null

  const activityRecords = await prisma.examRecord.findMany({
    where: { userId },
    select: {
      id: true,
      practiceSource: true,
      paper: { select: { paperType: true } },
    },
  })
  const moduleAttemptCounts = countUserActivityModules(activityRecords)
  const selectedModule =
    options.module ||
    moduleAttemptCounts.find((module) => module.count > 0)?.key ||
    USER_ACTIVITY_MODULES[0].key
  const selectedRecordIds = activityRecords
    .filter((record) => resolveUserActivityModule(record) === selectedModule)
    .map((record) => record.id)
  const attemptTotal = selectedRecordIds.length
  const totalPages = Math.ceil(attemptTotal / options.pageSize)
  const safePage = totalPages > 0 ? Math.min(options.page, totalPages) : 1

  const latestSession = user.authSessions[0]
  const [attempts, loginLocation] = await Promise.all([
    prisma.examRecord.findMany({
      where: { userId, id: { in: selectedRecordIds } },
      orderBy: { startedAt: 'desc' },
      skip: (safePage - 1) * options.pageSize,
      take: options.pageSize,
      select: {
        id: true,
        examType: true,
        correctCount: true,
        startedAt: true,
        submittedAt: true,
        status: true,
        paper: {
          select: { code: true, paperType: true },
        },
        answers: {
          where: { answerState: ANSWER_RECORD_STATE.ANSWERED },
          select: { id: true },
        },
      },
    }),
    resolveLoginLocation(latestSession?.ipAddress),
  ])
  // 查询已按到期时间倒序，同一考试类型仅展示当前持续时间最长的一项权益。
  const activeMemberships = user.memberships.filter(
    (membership, index, memberships) =>
      memberships.findIndex((candidate) => candidate.examType === membership.examType) === index,
  )

  return {
    profile: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      diagnosticUsed: user.diagnosticUsed,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    sourceAndEntitlements: {
      invitation: user.receivedInvitation
        ? {
            inviter: user.receivedInvitation.inviter,
            code: user.receivedInvitation.invitationCode.code,
            bindingSource: user.receivedInvitation.source,
            boundAt: user.receivedInvitation.boundAt.toISOString(),
          }
        : null,
      accessLevel:
        user.role === USER_ROLE.ADMIN
          ? 'admin'
          : activeMemberships.length > 0
            ? 'member'
            : 'free',
      memberships: activeMemberships.map((membership) => ({
        ...membership,
        startsAt: membership.startsAt.getTime(),
        endsAt: membership.endsAt.getTime(),
      })),
      rewardCards: summarizeRewardCards(user.invitationRewards, now),
    },
    loginLocation,
    overview: {
      moduleAttemptCounts,
      selectedModule,
    },
    attempts: attempts.map((attempt) => {
      return {
        id: attempt.id,
        examType: attempt.examType,
        status: attempt.status,
        startedAt: attempt.startedAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString() || null,
        accuracy:
          attempt.status === EXAM_RECORD_STATUS.SUBMITTED && attempt.answers.length > 0
            ? Math.round((attempt.correctCount / attempt.answers.length) * 10_000) / 100
            : null,
        paper: attempt.paper,
      }
    }),
    pagination: {
      page: safePage,
      pageSize: options.pageSize,
      total: attemptTotal,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: totalPages > 0 && safePage < totalPages,
    },
  }
}
