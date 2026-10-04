// 用户收藏与分类：独立保存题目关系，所有读写均限定当前登录用户。
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { USER_ROLE, isQuestionDifficulty, isExamType } from '../constants/domain.js'

export const favoritesRouter = createAsyncRouter()
favoritesRouter.use(requireAuth)
const idSchema = z.string().trim().min(1).max(191)
const examSchema = z.string().refine(isExamType, '考试类型无效')
const idsSchema = z
  .array(idSchema)
  .min(1)
  .max(100)
  .transform((ids) => [...new Set(ids)])
const categorySchema = z.object({ examType: examSchema, name: z.string().trim().min(1).max(40) })

// 收藏夹统计
favoritesRouter.get('/summary', async (req, res) => {
  const examType = examSchema.parse(req.query.examType)
  const userId = req.user!.userId
  // 同一快照内读取计数和分类，避免并发删除分类时总数与分类数短暂不一致。
  const { groups, categories, wrongCount, subjects } = await prisma.$transaction(async (tx) => {
    const groups = await tx.questionFavorite.groupBy({
      by: ['categoryId'],
      where: { userId, question: { examType } },
      _count: { _all: true },
    })
    const [categories, wrongCount, subjects] = await Promise.all([
      tx.favoriteCategory.findMany({
        where: { userId, examType },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      tx.wrongQuestionSummary.count({ where: { userId, examType, removedAt: null } }),
      tx.question.findMany({
        where: { examType, favorites: { some: { userId } } },
        distinct: ['subjectCode'],
        select: { subjectCode: true, subject: true },
        orderBy: { subjectCode: 'asc' },
      }),
    ])
    return { groups, categories, wrongCount, subjects }
  })
  res.json(
    success({
      total: groups.reduce((sum, item) => sum + item._count._all, 0),
      unclassified: groups.find((item) => item.categoryId === null)?._count._all ?? 0,
      wrongCount,
      categories: categories.map((category) => ({
        ...category,
        count: groups.find((item) => item.categoryId === category.id)?._count._all ?? 0,
      })),
      subjects: subjects.filter((item) => item.subjectCode),
    }),
  )
})

// 收藏状态
favoritesRouter.post('/status', async (req, res) => {
  const questionIds = idsSchema.parse(req.body.questionIds)
  const rows = await prisma.questionFavorite.findMany({
    where: { userId: req.user!.userId, questionId: { in: questionIds } },
    select: { questionId: true, categoryId: true },
  })
  res.json(success(rows))
})

// 收藏列表
favoritesRouter.get('/', async (req, res) => {
  const query = z
    .object({
      examType: examSchema,
      categoryId: z.string().max(191).optional(),
      keyword: z.string().trim().max(100).optional(),
      subjectCode: z.string().max(64).optional(),
      knowledge: z.string().trim().max(100).optional(),
      difficulty: z
        .string()
        .refine((value) => !value || isQuestionDifficulty(value))
        .optional(),
      page: z.coerce.number().int().min(1).max(1000000).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(20),
    })
    .parse(req.query)
  const question: Prisma.QuestionWhereInput = {
    examType: query.examType,
    ...(query.keyword ? { title: { contains: query.keyword } } : {}),
    ...(query.subjectCode ? { subjectCode: query.subjectCode } : {}),
    ...(isQuestionDifficulty(query.difficulty) ? { difficulty: query.difficulty } : {}),
    ...(query.knowledge
      ? {
          OR: [
            { topic: { contains: query.knowledge } },
            {
              knowledgePointLinks: {
                some: { syllabusNode: { label: { contains: query.knowledge } } },
              },
            },
          ],
        }
      : {}),
  }
  const where: Prisma.QuestionFavoriteWhereInput = {
    userId: req.user!.userId,
    question,
    ...(query.categoryId
      ? { categoryId: query.categoryId === 'unclassified' ? null : query.categoryId }
      : {}),
  }
  const [total, items] = await prisma.$transaction([
    prisma.questionFavorite.count({ where }),
    prisma.questionFavorite.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: {
        questionId: true,
        categoryId: true,
        createdAt: true,
        question: {
          select: { title: true, number: true, difficulty: true, subject: true, topic: true },
        },
      },
    }),
  ])
  res.json(success({ total, items, page: query.page, pageSize: query.pageSize }))
})

// 新建分类
favoritesRouter.post('/categories', async (req, res) => {
  const data = categorySchema.parse(req.body)
  const userId = req.user!.userId
  const count = await prisma.favoriteCategory.count({ where: { userId, examType: data.examType } })
  if (count >= 50) {
    res.status(409).json(fail('每个考试工作区最多创建 50 个分类'))
    return
  }
  const lastCategory = await prisma.favoriteCategory.findFirst({
    where: { userId, examType: data.examType },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  const result = await prisma.favoriteCategory.create({
    data: { ...data, userId, sortOrder: (lastCategory?.sortOrder ?? -1) + 1 },
  })
  res.json(success(result))
})

// 分类排序
favoritesRouter.put('/categories/order', async (req, res) => {
  const { examType, ids } = z.object({ examType: examSchema, ids: idsSchema }).parse(req.body)
  const userId = req.user!.userId
  await prisma.$transaction(
    ids.map((id, sortOrder) =>
      prisma.favoriteCategory.updateMany({ where: { id, userId, examType }, data: { sortOrder } }),
    ),
  )
  res.json(success(null))
})

// 修改分类
favoritesRouter.put('/categories/:id', async (req, res) => {
  const { name } = categorySchema.pick({ name: true }).parse(req.body)
  const result = await prisma.favoriteCategory.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { name },
  })
  if (!result.count) {
    res.status(404).json(fail('分类不存在'))
    return
  }
  res.json(success(null))
})

// 删除分类
favoritesRouter.delete('/categories/:id', async (req, res) => {
  await prisma.favoriteCategory.deleteMany({
    where: { id: req.params.id, userId: req.user!.userId },
  })
  res.json(success(null))
})

// 批量整理收藏
favoritesRouter.put('/batch', async (req, res) => {
  const body = z
    .object({
      examType: examSchema,
      questionIds: idsSchema,
      action: z.enum(['move', 'remove']),
      categoryId: idSchema.nullable().optional(),
    })
    .parse(req.body)
  const userId = req.user!.userId
  const where = {
    userId,
    questionId: { in: body.questionIds },
    question: { examType: body.examType },
  }
  if (body.action === 'remove') {
    await prisma.questionFavorite.deleteMany({ where })
  } else {
    if (
      body.categoryId &&
      !(await prisma.favoriteCategory.findFirst({
        where: { id: body.categoryId, userId, examType: body.examType },
      }))
    ) {
      res.status(404).json(fail('分类不存在或不属于当前考试工作区'))
      return
    }
    await prisma.questionFavorite.updateMany({
      where,
      data: { categoryId: body.categoryId ?? null },
    })
  }
  res.json(success(null))
})

// 收藏题目查看
favoritesRouter.post('/:questionId/view', async (req, res) => {
  const questionId = idSchema.parse(req.params.questionId)
  const favorite = await prisma.questionFavorite.findUnique({
    where: { userId_questionId: { userId: req.user!.userId, questionId } },
    select: { id: true },
  })
  if (!favorite) {
    res.status(404).json(fail('题目已取消收藏或不存在'))
    return
  }
  res.json(success({ recorded: true }))
})

// 收藏题目详情
favoritesRouter.get('/:questionId', async (req, res) => {
  const userId = req.user!.userId
  const favorite = await prisma.questionFavorite.findUnique({
    where: { userId_questionId: { userId, questionId: req.params.questionId } },
    include: { question: true },
  })
  if (!favorite) {
    res.status(404).json(fail('题目已取消收藏或不存在'))
    return
  }
  // 收藏可独立复习，完整题目和解析不受该题答卷的交卷状态限制。
  res.json(
    success({
      categoryId: favorite.categoryId,
      question: formatQuestionRow(favorite.question),
    }),
  )
})

// 收藏题目
favoritesRouter.put('/:questionId', async (req, res) => {
  const questionId = idSchema.parse(req.params.questionId)
  const userId = req.user!.userId
  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      ...(req.user!.role === USER_ROLE.ADMIN
        ? {}
        : {
            OR: [
              { answerRecords: { some: { examRecord: { userId } } } },
              { favorites: { some: { userId } } },
              { wrongQuestionSummaries: { some: { userId } } },
            ],
          }),
    },
    select: { id: true },
  })
  if (!question) {
    res.status(404).json(fail('题目不存在或尚未获得作答权限'))
    return
  }
  // MySQL 唯一键配合忽略重复插入，使多个标签页同时收藏也保持幂等。
  await prisma.questionFavorite.createMany({ data: [{ userId, questionId }], skipDuplicates: true })
  const favorite = await prisma.questionFavorite.findUniqueOrThrow({
    where: { userId_questionId: { userId, questionId } },
  })
  res.json(success({ questionId, categoryId: favorite.categoryId }))
})

// 取消收藏
favoritesRouter.delete('/:questionId', async (req, res) => {
  await prisma.questionFavorite.deleteMany({
    where: { userId: req.user!.userId, questionId: req.params.questionId },
  })
  res.json(success(null))
})
