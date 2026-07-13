import { z } from 'zod'
import { EMAIL_CODE_PURPOSE } from '../constants/auth.js'

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

const emailSchema = z
  .string()
  .trim()
  .max(191, '邮箱地址过长')
  .email('请输入有效的邮箱地址')
  .transform(normalizeEmail)

const usernameSchema = z.string().trim().min(1, '请输入用户名').max(50, '用户名不能超过 50 个字符')

const passwordSchema = z
  .string()
  .min(8, '密码长度需要 8-128 位')
  .max(128, '密码长度需要 8-128 位')
  .regex(/[a-zA-Z]/, '密码需要包含字母')
  .regex(/[0-9]/, '密码需要包含数字')

const emailCodeFields = {
  challengeId: z.string().uuid('验证码请求无效'),
  emailCode: z.string().regex(/^\d{6}$/, '请输入六位数字验证码'),
}

const examPreferenceSchema = z
  .object({
    examType: z.string().trim().min(1).max(32),
    subjects: z.array(z.string().trim().min(1).max(100)).max(10),
    targetUniversities: z.array(z.string().trim().max(191)).max(20).optional(),
    targetMajor: z.string().trim().max(191).optional(),
    targetScore: z.number().finite().optional(),
    examDate: z.string().trim().max(32).optional(),
    weeklyHours: z.number().finite().min(0).max(168).optional(),
  })
  .strict()

export const sendEmailCodeSchema = z
  .object({
    email: emailSchema,
    purpose: z.enum([
      EMAIL_CODE_PURPOSE.REGISTER,
      EMAIL_CODE_PURPOSE.RESET_PASSWORD,
      EMAIL_CODE_PURPOSE.CHANGE_EMAIL,
    ]),
  })
  .strict()

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    ...emailCodeFields,
    examPreferences: z.array(examPreferenceSchema).max(10).optional(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

export const loginSchema = z
  .object({
    username: z.string().trim().min(1, '请输入用户名或邮箱').max(191),
    password: z.string().min(1, '请输入密码').max(128),
  })
  .strict()

export const updateProfileSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    challengeId: z.string().uuid().optional(),
    emailCode: z.string().regex(/^\d{6}$/).optional(),
  })
  .strict()

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    ...emailCodeFields,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '请输入当前密码').max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmPassword'],
  })

export function parseSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  throw result.error
}
