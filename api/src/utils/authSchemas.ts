// 登录注册输入在路由入口统一规范化和校验，避免前后端规则漂移。
import { z } from "zod";
import { EMAIL_CODE_PURPOSE } from "../constants/auth.js";
import { TARGET_UNIVERSITIES } from "../constants/domain.js";
import { LEGAL_DOCUMENT_VERSIONS } from "../constants/legal.js";

// 用户名和密码规则作为所有身份接口的唯一后端校验来源。
const USERNAME_PATTERN =
  /^(?!\d+$)(?=.{4,30}$)[A-Za-z0-9\u4E00-\u9FFF](?:[A-Za-z0-9\u4E00-\u9FFF_-]*[A-Za-z0-9\u4E00-\u9FFF])?$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%]{8,12}$/;

// 邮箱统一小写并去除首尾空格，保证唯一性与验证码绑定一致。
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

const emailSchema = z
  .string()
  .trim()
  .max(191, "邮箱地址过长")
  .email("请输入有效的邮箱地址")
  .transform(normalizeEmail);

const usernameSchema = z
  .string()
  .trim()
  .regex(
    USERNAME_PATTERN,
    "4-30位，限中文/英文/数字/_/-，首尾禁用_/-，不可纯数字",
  );

const passwordSchema = z
  .string()
  .regex(
    PASSWORD_PATTERN,
    "密码需为8-12位并包含英文和数字，特殊字符仅支持 !@#$%",
  );

const emailCodeFields = {
  challengeId: z.string().uuid("验证码请求无效"),
  emailCode: z.string().regex(/^\d{6}$/, "请输入六位数字验证码"),
};

const authLegalVersionsSchema = z
  .object({
    userAgreement: z.literal(LEGAL_DOCUMENT_VERSIONS.userAgreement, {
      error: "用户服务协议版本已更新，请刷新页面后重试",
    }),
    privacyPolicy: z.literal(LEGAL_DOCUMENT_VERSIONS.privacyPolicy, {
      error: "隐私政策版本已更新，请刷新页面后重试",
    }),
  })
  .strict();

const ESAT_SUBJECTS = ["数学1", "数学2", "物理", "化学", "生物"] as const;

// 注册沿用按考试类型收集的原始结构，个人中心通过独立全局结构保存后再做兼容转换。
const examPreferenceSchema = z
  .object({
    examType: z.string().trim().min(1).max(32),
    subjects: z.array(z.string().trim().min(1).max(100)).max(10),
    targetRegions: z.string().trim().min(1).max(191).optional(),
    targetUniversities: z
      .array(z.enum(TARGET_UNIVERSITIES))
      .max(2, "目标院校最多选择 2 个")
      .optional(),
    targetMajor: z.string().trim().max(191).optional(),
    entrySeason: z
      .string()
      .trim()
      .regex(/^\d{4} 年(?:春季|秋季)$/, "预计入学年份格式不正确")
      .optional(),
    targetScore: z.number().finite().min(1).max(9).optional(),
    examDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}(?:-\d{2})?$/, "考试日期格式不正确")
      .optional(),
    weeklyHours: z.number().int().min(1).max(80).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.examType === "ESAT") {
      const subjects = new Set(value.subjects);
      const containsOnlyEsatSubjects = value.subjects.every((subject) =>
        ESAT_SUBJECTS.includes(subject as (typeof ESAT_SUBJECTS)[number]),
      );
      if (
        value.subjects.length !== 3 ||
        subjects.size !== 3 ||
        !subjects.has("数学1") ||
        !containsOnlyEsatSubjects
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["subjects"],
          message: "ESAT 必须从 5 个科目中选择 3 个，且数学1为必选科目",
        });
      }
      return;
    }

    if (value.examType !== "TMUA") return;

    const subjects = new Set(value.subjects);
    if (
      value.subjects.length !== 2 ||
      subjects.size !== 2 ||
      !subjects.has("Paper 1") ||
      !subjects.has("Paper 2")
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["subjects"],
        message: "TMUA 备考科目必须为 Paper 1 和 Paper 2",
      });
    }
  });

export const examPreferencesSchema = z.array(examPreferenceSchema).max(10);

const PROFILE_EXAM_DATES = [
  "2026-10",
  "2027-01",
  "2027-10",
  "2028-01",
  "2028-10",
] as const;
// 个人中心只提交一份账户级学习偏好，避免按考试类型重复传递相同字段。
export const profileStudyPreferencesSchema = z
  .object({
    examTypes: z
      .array(z.enum(["ESAT", "TMUA"]))
      .min(1, "请至少选择一个目标考试")
      .max(2)
      .refine((values) => new Set(values).size === values.length, "目标考试不能重复"),
    primaryExamType: z.enum(["ESAT", "TMUA"]),
    esatSubjects: z
      .array(z.enum(ESAT_SUBJECTS))
      .max(3),
    targetRegions: z.string().trim().max(191),
    targetUniversities: z
      .array(z.enum(TARGET_UNIVERSITIES))
      .max(2, "目标院校最多选择 2 个"),
    targetMajor: z.string().trim().max(191),
    targetScores: z
      .object({
        ESAT: z.number().finite().min(1).max(9).nullable(),
        TMUA: z.number().finite().min(1).max(9).nullable(),
      })
      .strict(),
    examDate: z.enum(PROFILE_EXAM_DATES),
    weeklyHours: z.number().int().min(1).max(80),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.examTypes.includes(value.primaryExamType)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["primaryExamType"],
        message: "默认学习考试必须属于目标考试",
      });
    }
    if (
      value.examTypes.includes("ESAT") &&
      (value.esatSubjects.length !== 3 ||
        new Set(value.esatSubjects).size !== 3 ||
        !value.esatSubjects.includes("数学1"))
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["esatSubjects"],
        message: "ESAT 必须从 5 个科目中选择 3 个，且数学1为必选科目",
      });
    }
  });

export const sendEmailCodeSchema = z
  .object({
    email: emailSchema,
    purpose: z.enum([
      EMAIL_CODE_PURPOSE.REGISTER,
      EMAIL_CODE_PURPOSE.RESET_PASSWORD,
      EMAIL_CODE_PURPOSE.CHANGE_EMAIL,
    ]),
  })
  .strict();

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    legalVersions: authLegalVersionsSchema,
    ...emailCodeFields,
    examPreferences: examPreferencesSchema.optional(),
    inviteCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{6,16}$/, "邀请码格式不正确")
      .optional(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const loginSchema = z
  .object({
    username: z.string().trim().min(1, "请输入用户名或邮箱").max(191),
    password: z.string().min(1, "请输入密码").max(128),
    legalVersions: authLegalVersionsSchema,
  })
  .strict();

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
  .strict();

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    ...emailCodeFields,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码").max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });

// 路由使用统一解析入口，将 Zod 错误交给全局错误处理中间件转换。
export function parseSchema<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw result.error;
}
