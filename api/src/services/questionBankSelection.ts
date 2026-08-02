// 题库选题凭证：冻结服务端选出的题目与题量，防止客户端绕过页面改变练习规模。
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { isExamType, type ExamType } from '../constants/domain.js'

interface QuestionBankSelectionPayload extends jwt.JwtPayload {
  type: 'question-bank-selection'
  examType: ExamType
  questionIds: string[]
}

const SELECTION_AUDIENCE = `${config.jwtAudience}:question-bank-selection`
const SELECTION_TTL_SECONDS = 300

// 选题接口将本次服务端确定的题目顺序签入五分钟有效的短期凭证。
export function signQuestionBankSelection(
  userId: string,
  examType: ExamType,
  questionIds: string[],
): string {
  return jwt.sign(
    {
      type: 'question-bank-selection',
      examType,
      questionIds,
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
  ) {
    throw new Error('Invalid question bank selection token')
  }
  return payload as QuestionBankSelectionPayload
}
