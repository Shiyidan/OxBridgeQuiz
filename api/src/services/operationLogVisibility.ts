// 后台展示口径：按操作人当前封禁状态过滤审计，保留无法关联账号的历史记录。
import type { Prisma } from '@prisma/client'
import { analyticsUserWhere } from './analyticsScope.js'

export const visibleOperationActorWhere: Prisma.OperationLogWhereInput = {
  OR: [
    { actorUserId: null },
    { actor: { is: analyticsUserWhere } },
  ],
}
