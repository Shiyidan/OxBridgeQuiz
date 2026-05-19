export interface ValidationResult {
  valid: boolean
  message: string
}

// 邮箱校验
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { valid: false, message: '请输入邮箱地址' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, message: '请输入有效的邮箱地址' }
  }
  return { valid: true, message: '' }
}

// 密码校验（登录用，仅检查非空）
export function validatePasswordRequired(password: string): ValidationResult {
  if (!password) {
    return { valid: false, message: '请输入密码' }
  }
  return { valid: true, message: '' }
}

// 密码校验（注册用，检查完整规则）
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, message: '请输入密码' }
  }
  if (password.length < 8 || password.length > 32) {
    return { valid: false, message: '密码长度需为 8-32 位' }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码需包含字母' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码需包含数字' }
  }
  return { valid: true, message: '' }
}

// 确认密码校验
export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { valid: false, message: '请再次输入密码' }
  }
  if (password !== confirmPassword) {
    return { valid: false, message: '两次输入的密码不一致' }
  }
  return { valid: true, message: '' }
}

// 姓名校验
export function validateName(name: string): ValidationResult {
  if (!name.trim()) {
    return { valid: false, message: '请输入姓名' }
  }
  if (name.length > 50) {
    return { valid: false, message: '姓名不超过 50 字' }
  }
  return { valid: true, message: '' }
}

// 检查密码基础格式（用于按钮禁用判断，不弹错误）
export function isPasswordValid(password: string): boolean {
  return password.length >= 8 && password.length <= 32 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}
