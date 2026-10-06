// 后台分析统一账号口径：按查询时的封禁状态剔除，解封后自动恢复历史统计。
import type { Prisma } from '@prisma/client'
import { ACCOUNT_STATUS } from '../constants/auth.js'
import { USER_ROLE } from '../constants/domain.js'

export const analyticsUserWhere: Prisma.UserWhereInput = {
  accountStatus: { not: ACCOUNT_STATUS.BANNED },
}

export const analyticsStudentWhere: Prisma.UserWhereInput = {
  ...analyticsUserWhere,
  role: USER_ROLE.STUDENT,
}
