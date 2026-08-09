// 练习本业务服务：校验保存配置、按难度与知识点动态选题，并格式化历史快照。
import type { Prisma, PracticeNotebook } from '@prisma/client'
import {
  ANSWER_RECORD_STATE,
  EXAM_RECORD_STATUS,
  PRACTICE_NOTEBOOK_DIFFICULTIES,
  PRACTICE_NOTEBOOK_DIFFICULTY,
  QUESTION_STATUS,
  type PracticeNotebookDifficulty,
  isStudentExamTypeAvailable,
} from '../constants/domain.js'
import { parseJsonArray, parseJsonObject } from '../utils/jsonField.js'

type DatabaseClient = Prisma.TransactionClient

export interface PracticeKnowledgePointSnapshot {
  code: string
  label: string
  parentLabel: string
  subjectLabel: string
}

export interface PracticeNotebookInput {
  name: string
  examType: string
  knowledgePointCodes: string[]
  questionCount: number
  difficultyMode: PracticeNotebookDifficulty
  durationMinutes: number | null
  unseenFirst: boolean
}

export interface PracticeQuestionSelection {
  questions: Array<{ id: string; answer: Prisma.JsonValue }>
  availableCount: number
}

export class PracticeNotebookBusinessError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message)
  }
}

const QUESTION_COUNT_OPTIONS = [8, 12, 16, 20]
const DIFFICULTY_BUCKETS = ['easy', 'medium', 'hard'] as const
type DifficultyBucket = (typeof DIFFICULTY_BUCKETS)[number]

// 请求体只接受产品页面提供的稳定选项，避免保存无法在前端还原的配置。
export function normalizePracticeNotebookInput(raw: unknown): PracticeNotebookInput {
  const body = parseJsonObject(raw)
  const name = String(body.name || '').trim()
  const examType = String(body.examType || '').trim().toUpperCase()
  const knowledgePointCodes = [
    ...new Set(
      parseJsonArray<unknown>(body.knowledgePointCodes)
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  ]
  const questionCount = Number(body.questionCount)
  const difficultyMode = String(body.difficultyMode || '') as PracticeNotebookDifficulty
  const durationValue = body.durationMinutes
  const durationMinutes = durationValue === null || durationValue === undefined
    ? null
    : Number(durationValue)

  if (!name || name.length > 30) {
    throw new PracticeNotebookBusinessError('练习本名称应为1至30个字符', 422, 'NOTEBOOK_NAME_INVALID')
  }
  if (!isStudentExamTypeAvailable(examType)) {
    throw new PracticeNotebookBusinessError('当前考试类型暂不支持练习本', 422, 'NOTEBOOK_EXAM_INVALID')
  }
  if (!knowledgePointCodes.length || knowledgePointCodes.length > 200) {
    throw new PracticeNotebookBusinessError('请至少选择一个知识点，单次最多选择200个', 422, 'NOTEBOOK_KNOWLEDGE_INVALID')
  }
  if (!QUESTION_COUNT_OPTIONS.includes(questionCount)) {
    throw new PracticeNotebookBusinessError('每次题量只能选择8、12、16或20题', 422, 'NOTEBOOK_COUNT_INVALID')
  }
  if (!PRACTICE_NOTEBOOK_DIFFICULTIES.includes(difficultyMode)) {
    throw new PracticeNotebookBusinessError('无效的练习难度组合', 422, 'NOTEBOOK_DIFFICULTY_INVALID')
  }
  if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 180)) {
    throw new PracticeNotebookBusinessError('练习时间应为5至180分钟', 422, 'NOTEBOOK_DURATION_INVALID')
  }

  return {
    name,
    examType,
    knowledgePointCodes,
    questionCount,
    difficultyMode,
    durationMinutes,
    unseenFirst: body.unseenFirst !== false,
  }
}

// 只允许保存当前考试考纲中的叶子节点，并生成不受后续考纲改名影响的展示快照。
export async function resolveKnowledgePointSnapshot(
  db: DatabaseClient,
  examType: string,
  codes: string[],
): Promise<{ nodeIds: string[]; snapshot: PracticeKnowledgePointSnapshot[] }> {
  const nodes = await db.syllabusNode.findMany({
    where: { examType },
    select: { id: true, code: true, label: true, parentCode: true, order: true },
  })
  const nodeMap = new Map(nodes.map((node) => [node.code, node]))
  const parentCodes = new Set(nodes.flatMap((node) => node.parentCode ? [node.parentCode] : []))
  const selectedNodes = codes.map((code) => nodeMap.get(code)).filter(Boolean) as typeof nodes
  if (selectedNodes.length !== codes.length || selectedNodes.some((node) => parentCodes.has(node.code))) {
    throw new PracticeNotebookBusinessError(
      '所选知识点已失效或不是叶子知识点，请重新选择',
      422,
      'NOTEBOOK_KNOWLEDGE_INVALID',
    )
  }

  const snapshot = selectedNodes.map((node) => {
    const ancestors: typeof nodes = []
    let current = node.parentCode ? nodeMap.get(node.parentCode) : undefined
    const visited = new Set<string>()
    while (current && !visited.has(current.code)) {
      ancestors.unshift(current)
      visited.add(current.code)
      current = current.parentCode ? nodeMap.get(current.parentCode) : undefined
    }
    const subject = ancestors.length > 1 ? ancestors[1] : ancestors[0]
    const parent = ancestors.at(-1)
    return {
      code: node.code,
      label: node.label,
      parentLabel: parent?.label || subject?.label || '当前学科',
      subjectLabel: subject?.label || node.label,
    }
  })

  return { nodeIds: selectedNodes.map((node) => node.id), snapshot }
}

// 保存配置前确认当前已发布单选题总量足以支持所选每次题量。
export async function ensureNotebookQuestionCapacity(
  db: DatabaseClient,
  examType: string,
  nodeIds: string[],
  requiredCount: number,
): Promise<void> {
  const availableCount = await db.question.count({
    where: {
      paperId: null,
      status: QUESTION_STATUS.PUBLISHED,
      examType,
      questionType: 'single_choice',
      knowledgePointLinks: { some: { syllabusNodeId: { in: nodeIds } } },
    },
  })
  if (availableCount < requiredCount) {
    throw new PracticeNotebookBusinessError(
      `当前范围只有 ${availableCount} 道题，请减少题量或增加知识点`,
      422,
      'NOTEBOOK_QUESTIONS_NOT_ENOUGH',
      { availableCount },
    )
  }
}

// 目标比例按页面语义换算为整数题量，均衡模式的余数优先分配给中等和简单题。
function calculateDifficultyTargets(
  mode: PracticeNotebookDifficulty,
  total: number,
): Record<DifficultyBucket, number> {
  if (mode === PRACTICE_NOTEBOOK_DIFFICULTY.MIXED) {
    const base = Math.floor(total / 3)
    const remaining = total - base * 3
    return {
      easy: base + (remaining > 1 ? 1 : 0),
      medium: base + (remaining > 0 ? 1 : 0),
      hard: base,
    }
  }
  const weights = mode === PRACTICE_NOTEBOOK_DIFFICULTY.EASY
    ? { easy: 0.6, medium: 0.3, hard: 0.1 }
    : mode === PRACTICE_NOTEBOOK_DIFFICULTY.MEDIUM
      ? { easy: 0.2, medium: 0.6, hard: 0.2 }
      : { easy: 0.1, medium: 0.3, hard: 0.6 }
  const raw = DIFFICULTY_BUCKETS.map((bucket) => ({
    bucket,
    value: total * weights[bucket],
  }))
  const result = Object.fromEntries(raw.map(({ bucket, value }) => [bucket, Math.floor(value)])) as Record<DifficultyBucket, number>
  let remaining = total - Object.values(result).reduce((sum, value) => sum + value, 0)
  const priority: DifficultyBucket[] = ['medium', 'easy', 'hard']
  raw
    .sort((left, right) => {
      const fractionDiff = (right.value - Math.floor(right.value)) - (left.value - Math.floor(left.value))
      return fractionDiff || priority.indexOf(left.bucket) - priority.indexOf(right.bucket)
    })
    .forEach(({ bucket }) => {
      if (remaining <= 0) return
      result[bucket] += 1
      remaining -= 1
    })
  return result
}

// 每次随机起点只读取所需数量的题目ID，不把完整题库加载进 Node 内存。
async function selectRandomQuestionIds(
  db: DatabaseClient,
  where: Prisma.QuestionWhereInput,
  take: number,
): Promise<string[]> {
  if (take <= 0) return []
  const count = await db.question.count({ where })
  if (!count) return []
  const actualTake = Math.min(take, count)
  const skip = Math.floor(Math.random() * (count - actualTake + 1))
  const rows = await db.question.findMany({
    where,
    orderBy: { id: 'asc' },
    skip,
    take: actualTake,
    select: { id: true },
  })
  return rows.map((row) => row.id)
}

// 新题不足时按最近一次回答时间从早到晚补充旧题，减少连续两组立即重复。
async function selectLeastRecentlyAnsweredIds(
  db: DatabaseClient,
  userId: string,
  where: Prisma.QuestionWhereInput,
  take: number,
): Promise<string[]> {
  if (take <= 0) return []
  const groups = await db.answerRecord.groupBy({
    by: ['questionId'],
    where: {
      answerState: ANSWER_RECORD_STATE.ANSWERED,
      examRecord: { userId, status: EXAM_RECORD_STATUS.SUBMITTED },
      question: where,
    },
    _max: { answeredAt: true },
    orderBy: { _max: { answeredAt: 'asc' } },
    take,
  })
  return groups.map((group) => group.questionId)
}

// 单个知识点/难度范围内先取未做题，再按规则补旧题；关闭优先规则时直接随机抽取。
async function selectFromScope(
  db: DatabaseClient,
  userId: string,
  baseWhere: Prisma.QuestionWhereInput,
  take: number,
  unseenFirst: boolean,
  selectedIds: Set<string>,
): Promise<string[]> {
  if (take <= 0) return []
  const exclusion = selectedIds.size ? { id: { notIn: [...selectedIds] } } : {}
  const scopedWhere: Prisma.QuestionWhereInput = { AND: [baseWhere, exclusion] }
  if (!unseenFirst) return selectRandomQuestionIds(db, scopedWhere, take)

  const unseenIds = await selectRandomQuestionIds(db, {
    AND: [
      scopedWhere,
      {
        answerRecords: {
          none: {
            answerState: ANSWER_RECORD_STATE.ANSWERED,
            examRecord: { userId, status: EXAM_RECORD_STATUS.SUBMITTED },
          },
        },
      },
    ],
  }, take)
  unseenIds.forEach((id) => selectedIds.add(id))
  if (unseenIds.length >= take) return unseenIds

  const oldIds = await selectLeastRecentlyAnsweredIds(
    db,
    userId,
    { AND: [baseWhere, { id: { notIn: [...selectedIds] } }] },
    take - unseenIds.length,
  )
  return [...unseenIds, ...oldIds]
}

// 三档题目难度与练习本难度桶保持一一对应。
function difficultyWhere(bucket: DifficultyBucket): Prisma.QuestionWhereInput {
  return { difficulty: bucket }
}

// 动态组卷在难度目标内尽量平均覆盖知识点，短缺只在用户已选范围内重分配。
export async function selectPracticeQuestions(
  db: DatabaseClient,
  userId: string,
  notebook: Pick<PracticeNotebook, 'examType' | 'knowledgePointCodes' | 'questionCount' | 'difficultyMode' | 'unseenFirst'>,
): Promise<PracticeQuestionSelection> {
  const codes = parseJsonArray<string>(notebook.knowledgePointCodes)
  const resolved = await resolveKnowledgePointSnapshot(db, notebook.examType, codes)
  const commonWhere: Prisma.QuestionWhereInput = {
    paperId: null,
    status: QUESTION_STATUS.PUBLISHED,
    examType: notebook.examType,
    questionType: 'single_choice',
    knowledgePointLinks: { some: { syllabusNodeId: { in: resolved.nodeIds } } },
  }
  const availableCount = await db.question.count({ where: commonWhere })
  if (availableCount < notebook.questionCount) {
    throw new PracticeNotebookBusinessError(
      `当前条件下最多可生成 ${availableCount} 题，请调整题量或知识点`,
      422,
      'NOTEBOOK_QUESTIONS_NOT_ENOUGH',
      { availableCount },
    )
  }

  const mode = notebook.difficultyMode as PracticeNotebookDifficulty
  if (!PRACTICE_NOTEBOOK_DIFFICULTIES.includes(mode)) {
    throw new PracticeNotebookBusinessError('练习本难度配置已失效，请先编辑', 422, 'NOTEBOOK_DIFFICULTY_INVALID')
  }
  const targets = calculateDifficultyTargets(mode, notebook.questionCount)
  const selectedIds = new Set<string>()
  const shuffledNodeIds = [...resolved.nodeIds].sort(() => Math.random() - 0.5)

  for (const bucket of DIFFICULTY_BUCKETS) {
    const target = targets[bucket]
    const basePerNode = Math.floor(target / shuffledNodeIds.length)
    let extras = target - basePerNode * shuffledNodeIds.length
    for (const nodeId of shuffledNodeIds) {
      const nodeTarget = basePerNode + (extras-- > 0 ? 1 : 0)
      const ids = await selectFromScope(
        db,
        userId,
        {
          AND: [
            commonWhere,
            difficultyWhere(bucket),
            { knowledgePointLinks: { some: { syllabusNodeId: nodeId } } },
          ],
        },
        nodeTarget,
        notebook.unseenFirst,
        selectedIds,
      )
      ids.forEach((id) => selectedIds.add(id))
    }
    const missing = target - [...selectedIds].length
      + Object.values(targets)
        .slice(0, DIFFICULTY_BUCKETS.indexOf(bucket))
        .reduce((sum, value) => sum + value, 0)
    if (missing > 0) {
      const ids = await selectFromScope(
        db,
        userId,
        { AND: [commonWhere, difficultyWhere(bucket)] },
        missing,
        notebook.unseenFirst,
        selectedIds,
      )
      ids.forEach((id) => selectedIds.add(id))
    }
  }

  if (selectedIds.size < notebook.questionCount) {
    const ids = await selectFromScope(
      db,
      userId,
      commonWhere,
      notebook.questionCount - selectedIds.size,
      notebook.unseenFirst,
      selectedIds,
    )
    ids.forEach((id) => selectedIds.add(id))
  }
  if (selectedIds.size < notebook.questionCount) {
    throw new PracticeNotebookBusinessError(
      `当前难度组合最多可生成 ${selectedIds.size} 题，请调整配置`,
      422,
      'NOTEBOOK_QUESTIONS_NOT_ENOUGH',
      { availableCount: selectedIds.size },
    )
  }

  const orderedIds = [...selectedIds].slice(0, notebook.questionCount)
  const rows = await db.question.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true, answer: true },
  })
  const rowMap = new Map(rows.map((row) => [row.id, row]))
  return {
    questions: orderedIds.flatMap((id) => rowMap.get(id) ? [rowMap.get(id)!] : []),
    availableCount,
  }
}

// 接口输出只读取稳定快照，兼容历史记录缺少可选展示字段。
export function parsePracticeSnapshot(value: unknown): Record<string, unknown> {
  return parseJsonObject(value)
}
