// Prisma 客户端单例。全局唯一实例，避免开发环境热重载时创建多个连接。
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()
