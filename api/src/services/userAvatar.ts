// 内置用户头像选择服务：为新注册账号随机分配头像，并为历史账号回填提供稳定映射。
import crypto from 'node:crypto'

export const BUILT_IN_USER_AVATARS = [
  '/avatars/avatar-01.svg',
  '/avatars/avatar-02.svg',
  '/avatars/avatar-03.svg',
] as const

export type BuiltInUserAvatar = (typeof BUILT_IN_USER_AVATARS)[number]

// 统一校验内置头像索引，防止头像列表调整后产生越界路径。
function userAvatarAt(index: number): BuiltInUserAvatar {
  if (!Number.isInteger(index) || index < 0 || index >= BUILT_IN_USER_AVATARS.length) {
    throw new RangeError(`Built-in user avatar index is out of range: ${index}`)
  }
  return BUILT_IN_USER_AVATARS[index]
}

// 新注册账号从内置头像中等概率随机选择一个默认头像。
export function pickRandomUserAvatar(): BuiltInUserAvatar {
  const avatarCount: number = BUILT_IN_USER_AVATARS.length
  if (avatarCount === 0) {
    throw new RangeError('At least one built-in user avatar is required')
  }
  return userAvatarAt(crypto.randomInt(avatarCount))
}

// 历史账号按稳定业务键映射头像，确保回填重跑时得到相同结果。
export function pickStableUserAvatar(key: string): BuiltInUserAvatar {
  const normalizedKey = key.trim()
  if (!normalizedKey) {
    throw new TypeError('Stable user avatar key must not be blank')
  }
  const avatarCount: number = BUILT_IN_USER_AVATARS.length
  if (avatarCount === 0) {
    throw new RangeError('At least one built-in user avatar is required')
  }

  const digest = crypto.createHash('sha256').update(normalizedKey, 'utf8').digest()
  return userAvatarAt(digest.readUInt32BE(0) % avatarCount)
}

// 数据库空值与纯空白值均视为尚未分配头像，供注册兼容和回填筛选复用。
export function isBlankUserAvatar(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0
}
