// 题库选题凭证：冻结服务端选出的题目与题量，防止客户端绕过页面改变练习规模。
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { PRACTICE_SOURCE, isExamType, type ExamType } from '../constants/domain.js'

export interface QuestionBankSelectionScopeNode {
  code: string
  label: string
}

export interface QuestionBankPracticeSnapshot {
  source: typeof PRACTICE_SOURCE.DIRECT
  subject: QuestionBankSelectionScopeNode | null
  knowledgePoint: (QuestionBankSelectionScopeNode & {
    path: QuestionBankSelectionScopeNode[]
  }) | null
  difficulty: string | null
  plannedQuestionCount: number
  questionCount: number
}

interface QuestionBankSelectionPayload extends jwt.JwtPayload {
  type: 'question-bank-selection'
  examType: ExamType
  questionIds: string[]
  practiceSnapshot: QuestionBankPracticeSnapshot
}

const SELECTION_AUDIENCE = `${config.jwtAudience}:question-bank-selection`
const SELECTION_TTL_SECONDS = 300

// 选题接口将本次服务端确定的题目顺序签入五分钟有效的短期凭证。
export function signQuestionBankSelection(
  userId: string,
  examType: ExamType,
  questionIds: string[],
  practiceSnapshot: QuestionBankPracticeSnapshot,
): string {
  return jwt.sign(
    {
      type: 'question-bank-selection',
      examType,
      questionIds,
      practiceSnapshot,
    },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      subject: userId,
      issuer: config.jwtIssuer,
      audience: SELECTION_AUDIENCE,
      expiresIn: SELECTION_TTL_SECONDS,
    },
  )
}

// 范围节点只接受服务端生成的稳定 code 与展示名称，防止异常凭证污染 JSON 快照。
function isScopeNode(value: unknown): value is QuestionBankSelectionScopeNode {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const node = value as Record<string, unknown>
  return typeof node.code === 'string' && Boolean(node.code.trim())
    && typeof node.label === 'string' && Boolean(node.label.trim())
}

// 选题凭证中的快照必须与冻结题量一致，创建答卷时才可直接持久化。
function isPracticeSnapshot(value: unknown, questionCount: number): value is QuestionBankPracticeSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const snapshot = value as Record<string, unknown>
  const knowledgePoint = snapshot.knowledgePoint
  const knowledgePointRecord = knowledgePoint && typeof knowledgePoint === 'object'
    && !Array.isArray(knowledgePoint)
    ? knowledgePoint as Record<string, unknown>
    : null
  const validKnowledgePoint = knowledgePoint === null || (
    knowledgePointRecord !== null
    && isScopeNode(knowledgePoint)
    && Array.isArray(knowledgePointRecord.path)
    && (knowledgePointRecord.path as unknown[]).every(isScopeNode)
  )
  return snapshot.source === PRACTICE_SOURCE.DIRECT
    && (snapshot.subject === null || isScopeNode(snapshot.subject))
    && validKnowledgePoint
    && (snapshot.difficulty === null || typeof snapshot.difficulty === 'string')
    && Number.isInteger(snapshot.plannedQuestionCount)
    && Number(snapshot.plannedQuestionCount) >= questionCount
    && Number.isInteger(snapshot.questionCount)
    && Number(snapshot.questionCount) === questionCount
}

// 创建练习时同时验证凭证用途、所属用户、考试类型和冻结题目集合。
export function verifyQuestionBankSelection(
  token: string,
  userId: string,
): QuestionBankSelectionPayload {
  const payload = jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    issuer: config.jwtIssuer,
    audience: SELECTION_AUDIENCE,
    subject: userId,
  })
  if (
    typeof payload === 'string'
    || payload.type !== 'question-bank-selection'
    || !isExamType(payload.examType)
    || !Array.isArray(payload.questionIds)
    || !payload.questionIds.length
    || payload.questionIds.some((id) => typeof id !== 'string' || !id.trim())
    || new Set(payload.questionIds).size !== payload.questionIds.length
    || !isPracticeSnapshot(payload.practiceSnapshot, payload.questionIds.length)
  ) {
    throw new Error('Invalid question bank selection token')
  }
  return payload as QuestionBankSelectionPayload
}
