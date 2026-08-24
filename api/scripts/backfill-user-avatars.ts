// 为尚未设置头像的历史用户稳定分配内置头像；默认仅预览，显式传入 --apply 才写库。
import type { BuiltInUserAvatar } from '../src/services/userAvatar.js'
import {
  BUILT_IN_USER_AVATARS,
  isBlankUserAvatar,
  pickStableUserAvatar,
} from '../src/services/userAvatar.js'
import { prisma } from '../src/services/prisma.js'

interface BackfillOptions {
  apply: boolean
}

interface AvatarCandidate {
  id: string
  originalAvatar: string | null
  targetAvatar: BuiltInUserAvatar
}

type AvatarDistribution = Record<BuiltInUserAvatar, number>

const USAGE = '用法：npm run backfill:user-avatars -- [--dry-run | --apply]'

// 仅接受显式的预览或写入模式，避免拼错参数后意外采用其他行为。
function parseOptions(): BackfillOptions {
  const args = process.argv.slice(2)
  const allowedOptions = new Set(['--dry-run', '--apply'])
  const unknownOptions = args.filter((arg) => !allowedOptions.has(arg))
  const hasDryRun = args.includes('--dry-run')
  const apply = args.includes('--apply')

  if (unknownOptions.length > 0 || (hasDryRun && apply)) {
    throw new Error(`${USAGE}\n未知或冲突参数：${unknownOptions.join(', ') || args.join(', ')}`)
  }
  return { apply }
}

// 为审计输出建立固定顺序的三头像计数，避免零分配项从结果中消失。
function createAvatarDistribution(): AvatarDistribution {
  return Object.fromEntries(
    BUILT_IN_USER_AVATARS.map((avatar) => [avatar, 0]),
  ) as AvatarDistribution
}

// 主流程始终先生成稳定计划，写入时再用原头像值作并发保护条件。
async function main(): Promise<void> {
  const options = parseOptions()
  const users = await prisma.user.findMany({
    select: { id: true, avatar: true },
    orderBy: { id: 'asc' },
  })
  const candidates: AvatarCandidate[] = users
    .filter((user) => isBlankUserAvatar(user.avatar))
    .map((user) => ({
      id: user.id,
      originalAvatar: user.avatar,
      targetAvatar: pickStableUserAvatar(user.id),
    }))

  const plannedDistribution = createAvatarDistribution()
  for (const candidate of candidates) {
    plannedDistribution[candidate.targetAvatar] += 1
  }

  let actualUpdatedUsers = 0
  let concurrencySkippedUsers = 0
  const updatedDistribution = createAvatarDistribution()

  if (options.apply) {
    for (const candidate of candidates) {
      const result = await prisma.user.updateMany({
        where: {
          id: candidate.id,
          avatar: candidate.originalAvatar,
        },
        data: { avatar: candidate.targetAvatar },
      })
      if (result.count === 1) {
        actualUpdatedUsers += 1
        updatedDistribution[candidate.targetAvatar] += 1
      } else {
        concurrencySkippedUsers += 1
      }
    }
  }

  const remainingBlankUsers = options.apply
    ? (await prisma.user.findMany({
        select: { id: true, avatar: true },
        orderBy: { id: 'asc' },
      })).filter((user) => isBlankUserAvatar(user.avatar)).length
    : candidates.length

  console.log(JSON.stringify({
    mode: options.apply ? 'apply' : 'dry-run',
    scannedUsers: users.length,
    candidateUsers: candidates.length,
    plannedDistribution,
    actualUpdatedUsers,
    concurrencySkippedUsers,
    updatedDistribution,
    remainingBlankUsers,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
