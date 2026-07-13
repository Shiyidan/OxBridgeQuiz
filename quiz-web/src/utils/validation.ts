// 登录与注册表单共享的基础校验规则。
export interface ValidationResult {
  valid: boolean
  message: string
}

export const USERNAME_PATTERN =
  /^(?!\d+$)(?=.{4,30}$)[A-Za-z0-9\u4E00-\u9FFF](?:[A-Za-z0-9\u4E00-\u9FFF_-]*[A-Za-z0-9\u4E00-\u9FFF])?$/
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%]{8,12}$/
export const EMAIL_CODE_PATTERN = /^\d{6}$/

// 保持前端邮箱格式校验与后端注册校验一致。
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return { valid: false, message: '请输入邮箱地址' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, message: '请输入有效的邮箱地址' }
  }
  return { valid: true, message: '' }
}

// 登录页只需要确认用户输入了密码。
export function validatePasswordRequired(password: string): ValidationResult {
  if (!password) return { valid: false, message: '请输入密码' }
  return { valid: true, message: '' }
}

// 注册和资料编辑使用同一用户名规则，避免保存后产生不可登录的标识符。
export function validateUsername(username: string): ValidationResult {
  const normalized = username.trim()
  if (!normalized) return { valid: false, message: '请输入用户名' }
  if (!USERNAME_PATTERN.test(normalized)) {
    return {
      valid: false,
      message: '4-30位，限中文/英文/数字/_/-，首尾禁用_/-，不可纯数字',
    }
  }
  return { valid: true, message: '' }
}

// 登录标识符允许用户名或邮箱，不套用注册用户名格式以免拒绝合法邮箱。
export function validateLoginIdentifier(identifier: string): ValidationResult {
  if (!identifier.trim()) return { valid: false, message: '请输入用户名或邮箱' }
  if (identifier.length > 191) return { valid: false, message: '用户名或邮箱过长' }
  return { valid: true, message: '' }
}

// 注册页使用完整密码规则，避免提交后才被后端拦截。
export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, message: '请输入密码' }
  if (!PASSWORD_PATTERN.test(password)) {
    return {
      valid: false,
      message: '密码需为8-12位并包含英文和数字，特殊字符仅支持 !@#$%',
    }
  }
  return { valid: true, message: '' }
}

// 确认密码依赖原密码，调用方需要传入当前密码值。
export function validateConfirmPassword(
  password: string,
  confirmPassword: string,
): ValidationResult {
  if (!confirmPassword) return { valid: false, message: '请再次输入密码' }
  if (password !== confirmPassword) return { valid: false, message: '两次输入的密码不一致' }
  return { valid: true, message: '' }
}

// 用于无需错误文案的密码格式判断。
export function isPasswordValid(password: string): boolean {
  return PASSWORD_PATTERN.test(password)
}

// 验证码输入始终保留前六位数字，兼容键盘输入和粘贴内容。
export function normalizeEmailCode(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6)
}
