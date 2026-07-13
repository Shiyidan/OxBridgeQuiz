// 登录注册输入在路由入口统一规范化和校验，避免前后端规则漂移。
import { z } from 'zod'
import { EMAIL_CODE_PURPOSE } from '../constants/auth.js'
import { TARGET_UNIVERSITIES } from '../constants/domain.js'

// 用户名和密码规则作为所有身份接口的唯一后端校验来源。
const USERNAME_PATTERN =
  /^(?!\d+$)(?=.{4,30}$)[A-Za-z0-9\u4E00-\u9FFF](?:[A-Za-z0-9\u4E00-\u9FFF_-]*[A-Za-z0-9\u4E00-\u9FFF])?$/
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%]{8,12}$/

// 邮箱统一小写并去除首尾空格，保证唯一性与验证码绑定一致。
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

const emailSchema = z
  .string()
  .trim()
  .max(191, '邮箱地址过长')
  .email('请输入有效的邮箱地址')
  .transform(normalizeEmail)

const usernameSchema = z
  .string()
  .trim()
  .regex(USERNAME_PATTERN, '4-30位，限中文/英文/数字/_/-，首尾禁用_/-，不可纯数字')

const passwordSchema = z
  .string()
  .regex(PASSWORD_PATTERN, '密码需为8-12位并包含英文和数字，特殊字符仅支持 !@#$%')

const emailCodeFields = {
  challengeId: z.string().uuid('验证码请求无效'),
  emailCode: z.string().regex(/^\d{6}$/, '请输入六位数字验证码'),
}

// 注册和个人中心复用同一份备考目标结构，防止保存出两套数据格式。
const examPreferenceSchema = z
  .object({
    examType: z.string().trim().min(1).max(32),
    subjects: z.array(z.string().trim().min(1).max(100)).max(10),
    targetUniversities: z
      .array(z.enum(TARGET_UNIVERSITIES))
      .max(2, '目标院校最多选择 2 个')
      .optional(),
    targetMajor: z.string().trim().max(191).optional(),
    targetScore: z.number().finite().min(1).max(9).optional(),
    examDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '考试日期格式不正确')
      .optional(),
    weeklyHours: z.number().int().min(1).max(80).optional(),
  })
  .strict()

export const examPreferencesSchema = z.array(examPreferenceSchema).max(10)

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
    examPreferences: examPreferencesSchema.optional(),
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
    emailCode: z
      .string()
      .regex(/^\d{6}$/)
      .optional(),
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

// 路由使用统一解析入口，将 Zod 错误交给全局错误处理中间件转换。
export function parseSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  throw result.error
}
