import crypto from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { config } from '../config.js'
import { AUTH_ERROR, type EmailCodePurpose } from '../constants/auth.js'
import { AuthError } from '../utils/authError.js'

function digestCode(input: {
  email: string
  purpose: EmailCodePurpose
  challengeId: string
  code: string
}): string {
  return crypto
    .createHmac('sha256', config.emailCodeSecret)
    .update(`${input.email}:${input.purpose}:${input.challengeId}:${input.code}`)
    .digest('hex')
}

function safeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'))
}

export function createSixDigitCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export async function createEmailChallenge(
  tx: Prisma.TransactionClient,
  input: { email: string; purpose: EmailCodePurpose; userId?: string },
): Promise<{ id: string; code: string; expiresAt: Date }> {
  const now = new Date()
  await tx.emailVerificationChallenge.updateMany({
    where: {
      email: input.email,
      purpose: input.purpose,
      usedAt: null,
      invalidatedAt: null,
    },
    data: { invalidatedAt: now },
  })

  const id = crypto.randomUUID()
  const code = createSixDigitCode()
  const expiresAt = new Date(now.getTime() + config.emailCodeTtlSeconds * 1000)
  await tx.emailVerificationChallenge.create({
    data: {
      id,
      userId: input.userId,
      email: input.email,
      purpose: input.purpose,
      codeDigest: digestCode({ ...input, challengeId: id, code }),
      expiresAt,
    },
  })
  return { id, code, expiresAt }
}

export async function consumeEmailChallenge(
  tx: Prisma.TransactionClient,
  input: {
    challengeId: string
    email: string
    purpose: EmailCodePurpose
    code: string
    userId?: string
  },
): Promise<void> {
  const challenge = await tx.emailVerificationChallenge.findUnique({
    where: { id: input.challengeId },
  })
  const now = new Date()

  if (
    !challenge ||
    challenge.email !== input.email ||
    challenge.purpose !== input.purpose ||
    (input.userId !== undefined && challenge.userId !== input.userId) ||
    challenge.usedAt ||
    challenge.invalidatedAt
  ) {
    throw new AuthError(AUTH_ERROR.EMAIL_CODE_INVALID, '验证码无效，请重新获取', 422)
  }
  if (challenge.expiresAt <= now) {
    throw new AuthError(AUTH_ERROR.EMAIL_CODE_EXPIRED, '验证码已过期，请重新获取', 422)
  }
  if (challenge.attempts >= config.emailCodeMaxAttempts) {
    throw new AuthError(AUTH_ERROR.EMAIL_CODE_ATTEMPTS_EXCEEDED, '验证码错误次数过多，请重新获取', 422)
  }

  const actualDigest = digestCode({
    email: input.email,
    purpose: input.purpose,
    challengeId: input.challengeId,
    code: input.code,
  })
  if (!safeEqualHex(challenge.codeDigest, actualDigest)) {
    const nextAttempts = challenge.attempts + 1
    await tx.emailVerificationChallenge.update({
      where: { id: challenge.id },
      data: {
        attempts: { increment: 1 },
        invalidatedAt: nextAttempts >= config.emailCodeMaxAttempts ? now : undefined,
      },
    })
    if (nextAttempts >= config.emailCodeMaxAttempts) {
      throw new AuthError(AUTH_ERROR.EMAIL_CODE_ATTEMPTS_EXCEEDED, '验证码错误次数过多，请重新获取', 422)
    }
    throw new AuthError(AUTH_ERROR.EMAIL_CODE_INVALID, '验证码错误', 422)
  }

  const consumed = await tx.emailVerificationChallenge.updateMany({
    where: {
      id: challenge.id,
      usedAt: null,
      invalidatedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  })
  if (consumed.count !== 1) {
    throw new AuthError(AUTH_ERROR.EMAIL_CODE_INVALID, '验证码已被使用，请重新获取', 422)
  }
}

