// 认证路由：邮箱验证、密码流程、短期访问令牌和可撤销会话。
import crypto from 'node:crypto'
import { type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { Prisma, type User } from '@prisma/client'
import { ZodError } from 'zod'
import { prisma } from '../services/prisma.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'
import { success, fail } from '../utils/response.js'
import {
  AUTH_ERROR,
  AUTH_SESSION_EXPIRED_MESSAGE,
  EMAIL_CODE_PURPOSE,
  type EmailCodePurpose,
} from '../constants/auth.js'
import {
  changePasswordSchema,
  loginSchema,
  normalizeEmail,
  parseSchema,
  registerSchema,
  resetPasswordSchema,
  sendEmailCodeSchema,
  updateProfileSchema,
} from '../utils/authSchemas.js'
import { AuthError } from '../utils/authError.js'
import { createAsyncRouter } from '../utils/asyncRouter.js'
import { config } from '../config.js'
import { createEmailChallenge, consumeEmailChallenge } from '../services/emailVerification.js'
import { sendVerificationCodeEmail } from '../services/mail.js'
import {
  clearRefreshCookie,
  createAuthSession,
  revokeRefreshSession,
  rotateAuthSession,
} from '../services/authSession.js'
import {
  buildOperationAuditChanges,
  setOperationAuditActor,
  setOperationAuditContext,
} from '../middleware/operationAudit.js'
import { logRuntimeError } from '../utils/runtimeLogger.js'
import {
  LEGAL_ACCEPTANCE_SOURCE,
  LEGAL_DOCUMENT_TYPE,
} from '../constants/legal.js'
import { recordLegalAcceptances } from '../services/legalAcceptance.js'
import { normalizeIpAddress } from '../utils/ipAddress.js'
import { resolveIpLocation } from '../services/ipGeolocation.js'
import { bindInvitationForUser, InvitationError } from '../services/invitation.js'
import { INVITATION_BINDING_SOURCE } from '../constants/domain.js'

export const authRouter = createAsyncRouter()

function limiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(fail('请求过于频繁，请稍后再试', AUTH_ERROR.RATE_LIMITED))
    },
  })
}

const registerLimiter = limiter(60 * 1000, 5)
const loginLimiter = limiter(15 * 60 * 1000, 20)
const emailCodeLimiter = limiter(60 * 60 * 1000, 20)
const passwordLimiter = limiter(15 * 60 * 1000, 10)
const dummyPasswordHash = bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12)

function presentUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  }
}

function handleAuthError(res: Response, error: unknown, event: string): void {
  if (error instanceof InvitationError) {
    res.status(error.httpStatus).json(fail(error.message, error.code))
    return
  }
  if (error instanceof AuthError) {
    res.status(error.status).json(fail(error.message, error.code))
    return
  }
  if (error instanceof ZodError) {
    const firstMessage = error.issues[0]?.message
    const message = firstMessage?.startsWith('Invalid input') ? '请求参数不正确' : firstMessage
    res.status(422).json(fail(message || '请求参数不正确', AUTH_ERROR.INVALID_INPUT))
    return
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json(fail('用户名或邮箱已被使用', AUTH_ERROR.EMAIL_IN_USE))
    return
  }
  logRuntimeError(`auth.${event}_failed`, error)
  res.status(500).json(fail('服务器错误'))
}

// 发送注册、重置密码或修改邮箱验证码。
authRouter.post('/email-code', emailCodeLimiter, optionalAuth, async (req: Request, res: Response) => {
  try {
    const input = parseSchema(sendEmailCodeSchema, req.body)
    const purpose = input.purpose as EmailCodePurpose
    let userId: string | undefined

    if (purpose === EMAIL_CODE_PURPOSE.REGISTER) {
      const exists = await prisma.user.findUnique({ where: { email: input.email } })
      if (exists) throw new AuthError(AUTH_ERROR.EMAIL_IN_USE, '该邮箱已注册', 409)
    }

    if (purpose === EMAIL_CODE_PURPOSE.RESET_PASSWORD) {
      const user = await prisma.user.findUnique({ where: { email: input.email } })
      if (!user) {
        res.json(success({
          challengeId: crypto.randomUUID(),
          expiresIn: config.emailCodeTtlSeconds,
          resendAfter: config.emailCodeResendSeconds,
        }))
        return
      }
      userId = user.id
    }

    if (purpose === EMAIL_CODE_PURPOSE.CHANGE_EMAIL) {
      if (!req.user) {
        throw new AuthError(AUTH_ERROR.SESSION_EXPIRED, AUTH_SESSION_EXPIRED_MESSAGE, 401)
      }
      if (input.email === req.user.email) {
        throw new AuthError(AUTH_ERROR.INVALID_INPUT, '新邮箱不能与当前邮箱相同', 422)
      }
      const exists = await prisma.user.findUnique({ where: { email: input.email } })
      if (exists) throw new AuthError(AUTH_ERROR.EMAIL_IN_USE, '该邮箱已被使用', 409)
      userId = req.user.userId
    }

    const since = new Date(Date.now() - 60 * 60 * 1000)
    const [latest, sentLastHour] = await Promise.all([
      prisma.emailVerificationChallenge.findFirst({
        where: { email: input.email, purpose },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.emailVerificationChallenge.count({
        where: { email: input.email, purpose, createdAt: { gte: since } },
      }),
    ])
    if (latest && Date.now() - latest.createdAt.getTime() < config.emailCodeResendSeconds * 1000) {
      throw new AuthError(AUTH_ERROR.EMAIL_CODE_TOO_FREQUENT, '请稍后再重新获取验证码', 429)
    }
    if (sentLastHour >= 5) {
      throw new AuthError(AUTH_ERROR.EMAIL_CODE_TOO_FREQUENT, '该邮箱获取验证码过于频繁，请稍后再试', 429)
    }

    const challenge = await prisma.$transaction((tx) =>
      createEmailChallenge(tx, { email: input.email, purpose, userId }),
    )
    try {
      await sendVerificationCodeEmail({
        to: input.email,
        code: challenge.code,
        purpose,
        expiresInMinutes: Math.ceil(config.emailCodeTtlSeconds / 60),
      })
    } catch (error) {
      await prisma.emailVerificationChallenge.update({
        where: { id: challenge.id },
        data: { invalidatedAt: new Date() },
      })
      logRuntimeError('auth.email_code.send_failed', error)
      throw new AuthError(
        AUTH_ERROR.EMAIL_SERVICE_UNAVAILABLE,
        '验证码邮件暂时无法发送，请稍后再试',
        503,
      )
    }

    res.json(success({
      challengeId: challenge.id,
      expiresIn: config.emailCodeTtlSeconds,
      resendAfter: config.emailCodeResendSeconds,
    }))
  } catch (error) {
    handleAuthError(res, error, 'email_code')
  }
})

// 注册必须在同一事务中消费邮箱验证码并创建账号。
authRouter.post('/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    const input = parseSchema(registerSchema, req.body)
    const legalAcceptedAt = new Date()
    const legalIpAddress = normalizeIpAddress(req.ip)
    const legalUserAgent = req.get('user-agent')
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: input.email } }),
      prisma.user.findUnique({ where: { username: input.username } }),
    ])
    if (existingEmail) throw new AuthError(AUTH_ERROR.EMAIL_IN_USE, '该邮箱已注册', 409)
    if (existingUsername) throw new AuthError(AUTH_ERROR.USERNAME_IN_USE, '该用户名已被使用', 409)

    const hashed = await bcrypt.hash(input.password, 12)
    const user = await prisma.$transaction(async (tx) => {
      await consumeEmailChallenge(tx, {
        challengeId: input.challengeId,
        email: input.email,
        purpose: EMAIL_CODE_PURPOSE.REGISTER,
        code: input.emailCode,
      })
      const createdUser = await tx.user.create({
        data: {
          email: input.email,
          emailVerifiedAt: new Date(),
          password: hashed,
          username: input.username,
          examPreferences: input.examPreferences || [],
        },
      })
      await recordLegalAcceptances(tx, {
        userId: createdUser.id,
        source: LEGAL_ACCEPTANCE_SOURCE.REGISTER,
        acceptedAt: legalAcceptedAt,
        ipAddress: legalIpAddress,
        userAgent: legalUserAgent,
        documents: [
          {
            documentType: LEGAL_DOCUMENT_TYPE.USER_AGREEMENT,
            documentVersion: input.legalVersions.userAgreement,
          },
          {
            documentType: LEGAL_DOCUMENT_TYPE.PRIVACY_POLICY,
            documentVersion: input.legalVersions.privacyPolicy,
          },
        ],
      })
      if (input.inviteCode) {
        await bindInvitationForUser(tx, {
          userId: createdUser.id,
          code: input.inviteCode,
          source: INVITATION_BINDING_SOURCE.REGISTER,
        })
      }
      return createdUser
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    const session = await createAuthSession(user, req, res)
    setOperationAuditActor(req, user)
    setOperationAuditContext(req, { resourceId: user.id })
    res.status(201).json(success({
      user: presentUser(user),
      accessToken: session.accessToken,
      invitationRewardEligible: Boolean(input.inviteCode),
    }))
  } catch (error) {
    handleAuthError(res, error, 'register')
  }
})

// 用户名或邮箱密码登录，成功后创建可撤销服务端会话。
authRouter.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const input = parseSchema(loginSchema, req.body)
    const legalAcceptedAt = new Date()
    const identifier = input.username.includes('@') ? normalizeEmail(input.username) : input.username
    const user = await prisma.user.findFirst({
      where: input.username.includes('@') ? { email: identifier } : { username: identifier },
    })
    if (!user) {
      await bcrypt.compare(input.password, await dummyPasswordHash)
      throw new AuthError(AUTH_ERROR.INVALID_CREDENTIALS, '用户名、邮箱或密码错误', 401)
    }
    const valid = await bcrypt.compare(input.password, user.password)
    if (!valid) throw new AuthError(AUTH_ERROR.INVALID_CREDENTIALS, '用户名、邮箱或密码错误', 401)

    await recordLegalAcceptances(prisma, {
      userId: user.id,
      source: LEGAL_ACCEPTANCE_SOURCE.LOGIN,
      acceptedAt: legalAcceptedAt,
      ipAddress: normalizeIpAddress(req.ip),
      userAgent: req.get('user-agent'),
      documents: [
        {
          documentType: LEGAL_DOCUMENT_TYPE.USER_AGREEMENT,
          documentVersion: input.legalVersions.userAgreement,
        },
        {
          documentType: LEGAL_DOCUMENT_TYPE.PRIVACY_POLICY,
          documentVersion: input.legalVersions.privacyPolicy,
        },
      ],
    })
    const session = await createAuthSession(user, req, res)
    setOperationAuditActor(req, user)
    setOperationAuditContext(req, { resourceId: user.id })
    res.json(success({ user: presentUser(user), accessToken: session.accessToken }))
  } catch (error) {
    handleAuthError(res, error, 'login')
  }
})

// 使用HttpOnly刷新Cookie轮换刷新凭证，并签发新的短期访问令牌。
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const result = await rotateAuthSession(req, res)
    res.json(success({ user: presentUser(result.user), accessToken: result.accessToken }))
  } catch (error) {
    handleAuthError(res, error, 'refresh')
  }
})

// 忘记密码：消费邮箱验证码、更新密码并撤销全部既有会话。
authRouter.post('/password/reset', passwordLimiter, async (req: Request, res: Response) => {
  try {
    const input = parseSchema(resetPasswordSchema, req.body)
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) throw new AuthError(AUTH_ERROR.EMAIL_CODE_INVALID, '验证码无效，请重新获取', 422)
    const password = await bcrypt.hash(input.password, 12)
    await prisma.$transaction(async (tx) => {
      await consumeEmailChallenge(tx, {
        challengeId: input.challengeId,
        email: input.email,
        purpose: EMAIL_CODE_PURPOSE.RESET_PASSWORD,
        code: input.emailCode,
        userId: user.id,
      })
      await tx.user.update({
        where: { id: user.id },
        data: { password, passwordChangedAt: new Date() },
      })
      await tx.authSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    })
    clearRefreshCookie(res)
    setOperationAuditActor(req, user)
    setOperationAuditContext(req, {
      resourceId: user.id,
      changes: buildOperationAuditChanges(
        { passwordChanged: false },
        { passwordChanged: true },
      ),
    })
    res.json(success(null))
  } catch (error) {
    handleAuthError(res, error, 'password_reset')
  }
})

// 登录状态下修改密码，成功后撤销全部设备会话并要求重新登录。
authRouter.post('/password/change', passwordLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const input = parseSchema(changePasswordSchema, req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) throw new AuthError(AUTH_ERROR.SESSION_EXPIRED, '登录状态已过期', 401)
    const currentValid = await bcrypt.compare(input.currentPassword, user.password)
    if (!currentValid) {
      throw new AuthError(AUTH_ERROR.CURRENT_PASSWORD_INVALID, '当前密码错误', 422)
    }
    if (await bcrypt.compare(input.newPassword, user.password)) {
      throw new AuthError(AUTH_ERROR.PASSWORD_UNCHANGED, '新密码不能与当前密码相同', 422)
    }
    const password = await bcrypt.hash(input.newPassword, 12)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password, passwordChangedAt: new Date() },
      }),
      prisma.authSession.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ])
    clearRefreshCookie(res)
    setOperationAuditContext(req, {
      resourceId: user.id,
      changes: buildOperationAuditChanges(
        { passwordChanged: false },
        { passwordChanged: true },
      ),
    })
    res.json(success(null))
  } catch (error) {
    handleAuthError(res, error, 'password_change')
  }
})

// 更新用户名；邮箱变化时必须消费绑定当前用户的新邮箱验证码。
authRouter.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const input = parseSchema(updateProfileSchema, req.body)
    const currentUser = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!currentUser) throw new AuthError(AUTH_ERROR.SESSION_EXPIRED, '用户不存在', 401)

    const emailChanged = input.email !== currentUser.email
    if (emailChanged && (!input.challengeId || !input.emailCode)) {
      throw new AuthError(AUTH_ERROR.EMAIL_CODE_INVALID, '请验证新邮箱', 422)
    }
    const user = await prisma.$transaction(async (tx) => {
      if (emailChanged) {
        await consumeEmailChallenge(tx, {
          challengeId: input.challengeId!,
          email: input.email,
          purpose: EMAIL_CODE_PURPOSE.CHANGE_EMAIL,
          code: input.emailCode!,
          userId: currentUser.id,
        })
      }
      return tx.user.update({
        where: { id: currentUser.id },
        data: {
          username: input.username,
          email: input.email,
          emailVerifiedAt: emailChanged ? new Date() : currentUser.emailVerifiedAt,
        },
      })
    })
    setOperationAuditContext(req, {
      resourceId: user.id,
      changes: buildOperationAuditChanges(
        { username: currentUser.username, email: currentUser.email },
        { username: user.username, email: user.email },
      ),
    })
    res.json(success({ user: presentUser(user) }))
  } catch (error) {
    handleAuthError(res, error, 'profile_update')
  }
})

// 当前设备服务端登出。
authRouter.post('/logout', optionalAuth, async (req: Request, res: Response) => {
  try {
    await revokeRefreshSession(req)
    clearRefreshCookie(res)
    if (req.user) setOperationAuditContext(req, { resourceId: req.user.userId })
    res.json(success(null))
  } catch (error) {
    handleAuthError(res, error, 'logout')
  }
})

// 撤销当前用户全部设备会话。
authRouter.post('/logout-all', requireAuth, async (req: Request, res: Response) => {
  await prisma.authSession.updateMany({
    where: { userId: req.user!.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  clearRefreshCookie(res)
  res.json(success(null))
})

// 查看当前用户的有效会话。
authRouter.get('/sessions', requireAuth, async (req: Request, res: Response) => {
  const sessions = await prisma.authSession.findMany({
    where: { userId: req.user!.userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastUsedAt: 'desc' },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    },
  })
  const currentSession = sessions.find((session) => session.id === req.user!.sessionId)
  const currentIpLocation = await resolveIpLocation(currentSession?.ipAddress)
  res.json(success({
    list: sessions.map((session) => ({
      ...session,
      isCurrent: session.id === req.user!.sessionId,
      ipLocation: session.id === req.user!.sessionId ? currentIpLocation : null,
    })),
  }))
})

// 撤销指定设备会话。
authRouter.delete('/sessions/:id', requireAuth, async (req: Request, res: Response) => {
  await prisma.authSession.updateMany({
    where: { id: req.params.id, userId: req.user!.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
  if (req.params.id === req.user!.sessionId) clearRefreshCookie(res)
  res.json(success(null))
})
