
// 汇总考试子路由共用的响应标准化、答题记录与计分辅助逻辑。
import { Router } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../services/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import { formatQuestionRow } from '../utils/questionSync.js'
import { parseJsonField, parseJsonArray } from '../utils/jsonField.js'
import { checkMemberAccess } from '../services/member.js'
import { computeScores } from '../services/scoring.js'
import type { QuestionResult } from '../services/scoring.js'
import {
  ensureDiagnosticReportTask,
  retryDiagnosticReportTask,
  scheduleDiagnosticReportWorker,
} from '../services/diagnosticReportTask.js'
import {
  ANSWER_RECORD_STATE,
  type AnswerRecordState,
  DIAGNOSTIC_REPORT_TASK_STATUS,
  EXAM_TYPE,
  EXAM_TYPES,
  EXAM_RECORD_STATUS,
  PAPER_TYPE,
  QUESTION_BANK_PAPER_TYPES,
  REAL_PAPER_TYPES,
  isExamType,
  isAnswerRecordState,
  isRealPaperType,
  normalizePaperType,
  paperTypeWhereValues,
} from '../constants/domain.js'


export function safeJsonParse<T>(value: unknown, fallback: T): T {
  return parseJsonField<T>(value, fallback)
}

// Parse comma-separated query values.
export function parseQueryList(value: unknown): string[] {
  if (!value) return []
  const values = Array.isArray(value) ? value : [value]
  return values
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseDateBoundary(value: unknown, boundary: 'start' | 'end'): Date | undefined {
  if (!value) return undefined
  const text = String(Array.isArray(value) ? value[0] : value).trim()
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text)
  const date = matched
    ? new Date(
        Number(matched[1]),
        Number(matched[2]) - 1,
        Number(matched[3]) + (boundary === 'end' ? 1 : 0),
      )
    : new Date(text)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function parsePositiveInt(value: unknown, fallback: number, max?: number): number {
  const parsed = Number.parseInt(String(Array.isArray(value) ? value[0] : value), 10)
  if (Number.isNaN(parsed) || parsed < 1) return fallback
  return max ? Math.min(parsed, max) : parsed
}

export function getQuestionKey(question: any): string {
  return String(question?.id || question?.number || '')
}

export function buildAnswerRecordRows(
  examRecordId: string,
  questions: any[],
  answers: Record<string, string>,
  questionDurations: Record<string, number>,
  answerStates: Record<string, AnswerRecordState> = {},
  includeUnanswered = true,
) {
  return questions
    .map((question) => {
      const key = getQuestionKey(question)
      if (!key) return null
      const selected = answers[key]
      const durationSeconds = Math.max(0, Math.round(Number(questionDurations[key]) || 0))
      if (!includeUnanswered && !selected && durationSeconds <= 0) return null
      const correct = Array.isArray(question.answer) ? question.answer : []
      const isCorrect = !!(selected && correct.includes(selected))
      const answerState = selected
        ? ANSWER_RECORD_STATE.ANSWERED
        : answerStates[key] === ANSWER_RECORD_STATE.SKIPPED || durationSeconds > 0
          ? ANSWER_RECORD_STATE.SKIPPED
          : ANSWER_RECORD_STATE.UNSEEN
      return {
        examRecordId,
        questionId: key,
        selectedAnswer: selected || null,
        answerState,
        isCorrect,

        durationSeconds,
        answeredAt: selected ? new Date() : null,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

export function countCorrectAnswers(questions: any[], answers: Record<string, string>): number {
  let correctCount = 0
  for (const question of questions) {
    const selected = answers[getQuestionKey(question)]
    const correct = Array.isArray(question.answer) ? question.answer : []
    if (selected && correct.includes(selected)) correctCount++
  }
  return correctCount
}

export type ExamResponseInput = {
  questionId: string
  selectedAnswer: string | null
  durationSeconds: number
  answerState: AnswerRecordState
}

export class ExamProgressConflictError extends Error {}

// 保存和交卷统一使用逐题响应数组，避免答案与耗时两个 Map 的题目键不一致。
export function normalizeExamResponses(value: unknown): ExamResponseInput[] {
  if (!Array.isArray(value)) return []
  const responseMap = new Map<string, ExamResponseInput>()
  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    const raw = item as Record<string, unknown>
    const questionId = typeof raw.questionId === 'string' ? raw.questionId.trim() : ''
    if (!questionId) continue
    const selectedAnswer = typeof raw.selectedAnswer === 'string' && raw.selectedAnswer.trim()
      ? raw.selectedAnswer.trim().slice(0, 64)
      : null
    const durationSeconds = Math.max(0, Math.min(24 * 60 * 60, Math.round(Number(raw.durationSeconds) || 0)))
    const requestedState = isAnswerRecordState(raw.answerState)
      ? raw.answerState
      : ANSWER_RECORD_STATE.UNSEEN
    const answerState = selectedAnswer
      ? ANSWER_RECORD_STATE.ANSWERED
      : requestedState === ANSWER_RECORD_STATE.SKIPPED || durationSeconds > 0
        ? ANSWER_RECORD_STATE.SKIPPED
        : ANSWER_RECORD_STATE.UNSEEN
    responseMap.set(questionId, { questionId, selectedAnswer, durationSeconds, answerState })
  }
  return [...responseMap.values()]
}

export function responseMaps(responses: ExamResponseInput[]): {
  answers: Record<string, string>
  durations: Record<string, number>
  states: Record<string, AnswerRecordState>
} {
  const answers: Record<string, string> = {}
  const durations: Record<string, number> = {}
  const states: Record<string, AnswerRecordState> = {}
  for (const response of responses) {
    if (response.selectedAnswer) answers[response.questionId] = response.selectedAnswer
    durations[response.questionId] = response.durationSeconds
    states[response.questionId] = response.answerState
  }
  return { answers, durations, states }
}

export function usesContinuousExamClock(paperType: unknown): boolean {
  const normalized = normalizePaperType(paperType)
  return normalized === PAPER_TYPE.REAL_PAPER || normalized === PAPER_TYPE.MOCK_PAPER
}

export function buildExamDeadline(startedAt: Date, durationMinutes: number): Date {
  return new Date(startedAt.getTime() + Math.max(1, durationMinutes) * 60 * 1000)
}

export function continuousExamDurationSeconds(startedAt: Date, expiresAt: Date, endedAt: Date): number {
  const effectiveEnd = Math.min(endedAt.getTime(), expiresAt.getTime())
  return Math.max(0, Math.round((effectiveEnd - startedAt.getTime()) / 1000))
}

export async function replaceAnswerRecords(
  client: Prisma.TransactionClient | typeof prisma,
  examRecordId: string,
  questions: any[],
  answers: Record<string, string>,
  questionDurations: Record<string, number>,
  answerStates: Record<string, AnswerRecordState> = {},
  includeUnanswered = true,
) {
  await client.answerRecord.deleteMany({ where: { examRecordId } })
  const rows = buildAnswerRecordRows(
    examRecordId,
    questions,
    answers,
    questionDurations,
    answerStates,
    includeUnanswered,
  )

  if (rows.length) await client.answerRecord.createMany({ data: rows })
}

export async function collectSyllabusCodes(codes: string[]): Promise<string[]> {
  if (!codes.length) return []
  const nodes = await prisma.syllabusNode.findMany({
    where: { examType: { in: EXAM_TYPES } },
    select: { code: true, parentCode: true },
  })
  const childrenMap = new Map<string, string[]>()
  for (const node of nodes) {
    if (!node.parentCode) continue
    const children = childrenMap.get(node.parentCode) || []
    children.push(node.code)
    childrenMap.set(node.parentCode, children)
  }
  const result = new Set<string>()
  const visit = (code: string) => {
    result.add(code)
    for (const child of childrenMap.get(code) || []) visit(child)
  }
  codes.forEach(visit)
  return [...result]
}

// Check whether question point JSON contains any target code.
export function jsonPointsHaveCode(value: unknown, codes: string[]): boolean {
  const points = parseJsonArray<{ code?: string }>(value)
  return points.some((point) => point.code && codes.includes(point.code))
}

export function calculateNinePointScore(examType: string, totalQuestions: number, correctCount: number): number | null {
  if (totalQuestions <= 0) return null
  const dummyQuestions: QuestionResult[] = Array.from({ length: totalQuestions }, (_, i) => ({
    subject: null,
    isCorrect: i < correctCount,
  }))
  const result = computeScores(examType, dummyQuestions)
  return result.overallScore
}
