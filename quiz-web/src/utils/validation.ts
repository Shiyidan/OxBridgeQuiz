// 登录与注册表单共享的基础校验规则。
export interface ValidationResult {
  valid: boolean
  message: string
}

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

// 注册页使用完整密码规则，避免提交后才被后端拦截。
export function validatePassword(password: string): ValidationResult {
  if (!password) return { valid: false, message: '请输入密码' }
  if (password.length < 8 || password.length > 32) {
    return { valid: false, message: '密码长度需要为 8-32 位' }
  }
  if (!/[a-zA-Z]/.test(password)) return { valid: false, message: '密码需要包含字母' }
  if (!/[0-9]/.test(password)) return { valid: false, message: '密码需要包含数字' }
  return { valid: true, message: '' }
}

// 确认密码依赖原密码，调用方需要传入当前密码值。
export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) return { valid: false, message: '请再次输入密码' }
  if (password !== confirmPassword) return { valid: false, message: '两次输入的密码不一致' }
  return { valid: true, message: '' }
}

// 用户名限制与后端注册/资料更新保持一致。
export function validateName(name: string): ValidationResult {
  if (!name.trim()) return { valid: false, message: '请输入姓名' }
  if (name.length > 50) return { valid: false, message: '姓名不能超过 50 个字符' }
  return { valid: true, message: '' }
}

// 用于无需错误文案的密码格式判断。
export function isPasswordValid(password: string): boolean {
  return password.length >= 8 && password.length <= 32 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
}
