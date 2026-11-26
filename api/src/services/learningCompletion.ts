// 自主点亮进度：叶子按账号与考试保存，整章批量更新，只有实际新增点亮才写审计。
import type { Request } from 'express'
import { prisma } from './prisma.js'
import { hasActiveExamMembershipAccess } from './member.js'
import { isFreePracticeScope } from '../constants/freeLearningAccess.js'
import { OPERATION_AUDIT_MODULE, OPERATION_AUDIT_RESULT } from '../constants/operationAudit.js'
import { normalizeIpAddress } from '../utils/ipAddress.js'

export class LearningCompletionError extends Error {
  // 将可预期的无效节点与权益错误交给统一响应格式。
  constructor(public status: number, message: string, public code: string) { super(message) }
}

// 读取只属于当前登录账号的叶子状态，会员到期也不抹去已保存的进度。
export async function getLearningCompletions(userId: string, examType: string) {
  return prisma.learningCompletion.findMany({
    where: { userId, examType },
    select: { code: true, completedAt: true },
    orderBy: { code: 'asc' },
  })
}

// 通过真实父子关系展开章节，不能用客户端提交的叶子列表扩大点亮范围。
export async function setLearningCompletion(req: Request, examType: string, code: string, completed: boolean) {
  const user = req.user!
  const nodes = await prisma.syllabusNode.findMany({
    where: { examType },
    select: { code: true, parentCode: true, cnLabel: true },
    orderBy: [{ order: 'asc' }, { code: 'asc' }],
  })
  const target = nodes.find(node => node.code === code)
  if (!target || code.endsWith('0000')) {
    throw new LearningCompletionError(404, '该章节或知识点不存在', 'LEARNING_NODE_NOT_FOUND')
  }
  const children = new Map<string, typeof nodes>()
  for (const node of nodes) {
    if (node.parentCode) children.set(node.parentCode, [...(children.get(node.parentCode) ?? []), node])
  }
  const pending = [target]
  const seen = new Set<string>()
  const codes: string[] = []
  while (pending.length) {
    const node = pending.pop()!
    if (seen.has(node.code)) continue
    seen.add(node.code)
    const descendants = children.get(node.code) ?? []
    if (descendants.length) pending.push(...descendants)
    else codes.push(node.code)
  }
  if (!codes.length) throw new LearningCompletionError(422, '该章节没有可点亮的知识点', 'LEARNING_NODE_EMPTY')
  codes.sort()
  if (completed && !codes.every(item => isFreePracticeScope(examType, item)) &&
      !(await hasActiveExamMembershipAccess(user.userId, examType, prisma, 'learning'))) {
    throw new LearningCompletionError(403, '请先开通当前考试的学习权益，再点亮这一章节。', 'LEARNING_MEMBERSHIP_REQUIRED')
  }
  // 唯一键配合 skipDuplicates 保证重复点击不新增进度；状态与成功日志在同一事务提交。
  await prisma.$transaction(async tx => {
    if (!completed) {
      await tx.learningCompletion.deleteMany({ where: { userId: user.userId, examType, code: { in: codes } } })
      return
    }
    const previous = await tx.learningCompletion.findMany({
      where: { userId: user.userId, examType, code: { in: codes } },
      select: { code: true }, orderBy: { code: 'asc' },
    })
    const inserted = await tx.learningCompletion.createMany({
      data: codes.map(item => ({ userId: user.userId, examType, code: item })),
      skipDuplicates: true,
    })
    if (inserted.count === 0) return
    await tx.operationLog.create({
      data: {
        actorUserId: user.userId,
        actorNameSnapshot: user.username,
        actorEmailSnapshot: user.email,
        actorRoleSnapshot: user.role,
        requestId: req.requestId,
        module: OPERATION_AUDIT_MODULE.LEARNING,
        action: 'learning.light_up',
        summary: ('点亮' + (codes.length > 1 ? '章节' : '知识点') + '：“' + target.cnLabel.slice(0, 300) + '”（' + examType + ' · ' + code + '，新增 ' + inserted.count + ' 个知识点）').slice(0, 500),
        result: OPERATION_AUDIT_RESULT.SUCCESS,
        resourceType: 'SyllabusNode',
        resourceId: examType + ':' + code,
        changes: { completed: { before: false, after: true }, completedCodes: { before: previous.map(item => item.code), after: codes } },
        method: 'PUT',
        path: req.originalUrl.split('?')[0].slice(0, 500),
        statusCode: 200,
        ipAddress: normalizeIpAddress(req.ip)?.slice(0, 64),
        userAgent: req.get('user-agent')?.slice(0, 512),
      },
    })
  })
  return getLearningCompletions(user.userId, examType)
}
