// 界面国际化入口：首页路径确定语言，已保存偏好用于其他页面的公共导航。
import { computed } from 'vue'
import { createI18n } from 'vue-i18n'
import { homeEnglish } from './home'
import { paymentEnglish } from './payment'
import { authEnglish, authErrorSources } from './auth'
import { diagnosticEnglish } from './diagnostic'
import { reviewEnglish } from './review'
import { examIntroEnglish } from './examIntro'
import { profileEnglish } from './profile'

const interfaceEnglish = { ...diagnosticEnglish, ...reviewEnglish, ...profileEnglish }
const englishMessages = {
  ...homeEnglish,
  ...paymentEnglish,
  ...authEnglish,
  ...interfaceEnglish,
  ...examIntroEnglish,
}

// 业务界面的说明含运行时数值；只匹配已登记的完整句式，不翻译任意正文。
const interfacePatterns = Object.keys(interfaceEnglish)
  // 相邻参数没有可识别的边界，调用处必须显式传参，不能从拼接后的句子猜测。
  .filter((key) => /\{p\d+\}/.test(key) && !/\{p\d+\}\{p\d+\}/.test(key))
  .sort(
    (left, right) => right.replace(/\{p\d+\}/g, '').length - left.replace(/\{p\d+\}/g, '').length,
  )
  .map((key) => {
    const parameters = [...key.matchAll(/\{(p\d+)\}/g)].map((match) => match[1]!)
    const parts = key.split(/\{p\d+\}/)
    const escape = (part: string) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return {
      key,
      parameters,
      prefix: parts[0]!,
      expression: new RegExp(`^${parts.map(escape).join('(.*?)')}$`, 's'),
    }
  })

export type SiteLocale = 'zh-CN' | 'en'
const STORAGE_KEY = 'acemock:interface-locale'

// 使用消息函数保留公式、竖线与特殊符号，仅替换明确声明的文案参数。
function message(text: string) {
  return (context: { named: (key: string) => unknown }) =>
    text.replace(/\{(p\d+)\}/g, (_match, key: string) => String(context.named(key) ?? ''))
}

// 显式首页地址优先于历史偏好，避免同一个公开 URL 因浏览器设置显示不同语言。
export function localeForHomePath(path: string): SiteLocale | null {
  if (path === '/en' || path === '/en/') return 'en'
  return path === '/' ? 'zh-CN' : null
}

// 浏览器不允许持久化时仍可正常使用当前会话的语言切换。
function initialLocale(): SiteLocale {
  if (typeof window === 'undefined') return 'zh-CN'
  const explicit = localeForHomePath(window.location.pathname)
  if (explicit) return explicit
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh-CN'
  } catch {
    return 'zh-CN'
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'zh-CN',
  // 中文原文是界面文案键；按完整键查找，句号等标点不解释为对象路径。
  messageResolver: (object, key) =>
    Object.prototype.hasOwnProperty.call(object, key)
      ? ((object as Record<string, ReturnType<typeof message>>)[key] ?? null)
      : null,
  messages: {
    'zh-CN': Object.fromEntries(Object.keys(englishMessages).map((key) => [key, message(key)])),
    en: Object.fromEntries(
      Object.entries(englishMessages).map(([key, value]) => [key, message(value)]),
    ),
  },
})

// 路由和语言入口共用同一个状态；解析语言未来使用独立偏好，不读取此存储键。
export function setSiteLocale(locale: SiteLocale): void {
  i18n.global.locale.value = locale
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // 存储受限只影响下次访问，不影响本次展示。
  }
}

// 仅映射已配置的界面文案；未知服务端内容与用户姓名原样保留。
export function t(value: unknown, params: Record<string, unknown> = {}): string {
  const source = String(value ?? '')
  if (Object.prototype.hasOwnProperty.call(englishMessages, source)) {
    return i18n.global.t(source, params)
  }
  if (i18n.global.locale.value === 'en' && /[\u4e00-\u9fff]/.test(source)) {
    const normalized = source.trim().replace(/\s+/g, ' ')
    // 科目、院校组合只在每一项都有译文时拼接，未知自由文本仍完整保留原文。
    if (/ · |、/.test(normalized)) {
      const parts = normalized.split(/ · |、/)
      const translated = parts.map((part) => t(part))
      if (translated.every((part) => !/[\u4e00-\u9fff]/.test(part))) {
        return translated.join(normalized.includes(' · ') ? ' · ' : ', ')
      }
    }
    if (Object.prototype.hasOwnProperty.call(interfaceEnglish, normalized))
      return i18n.global.t(normalized, params)
    if (normalized.length <= 2000) {
      for (const pattern of interfacePatterns) {
        if (!normalized.startsWith(pattern.prefix)) continue
        const matched = pattern.expression.exec(normalized)
        if (!matched) continue
        const values = Object.fromEntries(
          pattern.parameters.map((name, index) => [name, t(matched[index + 1])]),
        )
        return i18n.global.t(pattern.key, values)
      }
    }
  }
  return source
}

// 页面错误允许使用通用失败提示兜底；题干、解析和报告正文不走此分支。
export function translateInterfaceError(value: unknown): string {
  const translated = t(value)
  return i18n.global.locale.value === 'en' && /[\u4e00-\u9fff]/.test(translated)
    ? t('请求失败，请稍后重试。')
    : translated
}

// 保留诊断模块已有入口，所有已翻译业务页共用同一错误展示规则。
export const translateDiagnosticError = translateInterfaceError

// 认证错误在展示时翻译，保留后端业务码及注册限流的原始北京时间。
export function translateAuthError(source: string, code?: string | number): string {
  if (i18n.global.locale.value !== 'en') return source
  const translated = t(source)
  if (translated !== source || !/[\u4e00-\u9fff]/.test(source)) return translated
  const retry = source.match(/^(.*?)请于\s*([\d/ :-]+)（北京时间）后重试。$/)
  const fallback = authErrorSources[String(code)] || '请求失败，请稍后重试。'
  if (retry) {
    const reason = t(retry[1])
    return `${/[\u4e00-\u9fff]/.test(reason) ? t(fallback) : reason} ${t('请于 {p0}（北京时间）后重试。', { p0: retry[2]?.trim() })}`
  }
  return t(fallback)
}

// 服务端科目名称只在展示边界映射，保存与筛选继续使用原业务值。
export function subjectCopy(value: string): string {
  return value
    .split(' · ')
    .map((subject) => t(subject))
    .join(' · ')
}

// 首页、支付弹窗及共享导航读取同一语言状态，切换时保留当前交互状态。
export function useSiteLocale() {
  const isEnglish = computed(() => i18n.global.locale.value === 'en')
  const homePath = computed(() => (isEnglish.value ? '/en/' : '/'))
  return { t, isEnglish, homePath }
}
