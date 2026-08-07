// 路由 SEO 管理：为公开内容提供独立搜索语义，并让登录后业务页面退出公开索引。
import type { RouteLocationNormalizedLoaded } from 'vue-router'

const SITE_ORIGIN = 'https://acemock.cn'
const SITE_NAME = 'AceMock 云舟备考'
const HOME_TITLE = 'AceMock 云舟备考｜ESAT 与 TMUA 真题诊断'
const HOME_DESCRIPTION =
  'AceMock 云舟备考基于历年真题和考试大纲，提供 ESAT、TMUA 水平诊断、知识点分析、专项练习与错题复习，帮助学生针对薄弱项高效备考。'

interface PublicSeoMetadata {
  title: string
  description: string
  canonicalPath: string
  websiteStructuredData?: boolean
}

const publicSeoByPath: Record<string, PublicSeoMetadata> = {
  '/': {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    canonicalPath: '/',
    websiteStructuredData: true,
  },
  '/exam-intro/esat': {
    title: 'ESAT 考试介绍、科目与备考指南｜AceMock 云舟备考',
    description:
      '了解 ESAT 考试科目、题型、考查重点与备考方法，并通过 AceMock 云舟备考衔接真题诊断和针对性训练。',
    canonicalPath: '/exam-intro/esat',
  },
  '/exam-intro/tmua': {
    title: 'TMUA 考试介绍、题型与备考指南｜AceMock 云舟备考',
    description:
      '了解 TMUA Paper 1、Paper 2 的考试结构、题型与备考重点，并通过 AceMock 云舟备考衔接真题诊断和针对性训练。',
    canonicalPath: '/exam-intro/tmua',
  },
  '/exam-intro/step': {
    title: 'STEP 考试介绍与备考指南｜AceMock 云舟备考',
    description:
      '了解 STEP 考试结构、核心能力要求、常见问题及其与 ESAT、TMUA 的区别，建立清晰的备考认识。',
    canonicalPath: '/exam-intro/step',
  },
}

const privatePageTitles: Array<{ prefix: string; title: string }> = [
  { prefix: '/login', title: `登录｜${SITE_NAME}` },
  { prefix: '/register', title: `注册｜${SITE_NAME}` },
  { prefix: '/profile', title: `个人中心｜${SITE_NAME}` },
  { prefix: '/question-bank', title: `试题库｜${SITE_NAME}` },
  { prefix: '/practice-notebook', title: `练习本｜${SITE_NAME}` },
  { prefix: '/practice', title: `在线练习｜${SITE_NAME}` },
  { prefix: '/assessment', title: `诊断测试｜${SITE_NAME}` },
  { prefix: '/exam-result', title: `诊断报告｜${SITE_NAME}` },
  { prefix: '/mistake-notebook', title: `错题本｜${SITE_NAME}` },
  { prefix: '/legal', title: `协议与政策｜${SITE_NAME}` },
  { prefix: '/admin', title: `管理后台｜${SITE_NAME}` },
]

// 统一更新指定 name 的 meta，避免多次路由切换后出现重复标签。
function setNamedMeta(name: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.name = name
    document.head.appendChild(element)
  }
  element.content = content
}

// 统一更新 Open Graph 属性，并在私有页移除不应对外传播的页面信息。
function setPropertyMeta(property: string, content: string | null): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (content === null) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('property', property)
    document.head.appendChild(element)
  }
  element.content = content
}

// 公开页使用唯一规范网址；私有页不发送 canonical，避免与 noindex 形成相互竞争的索引信号。
function setCanonical(url: string | null): void {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (url === null) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.appendChild(element)
  }
  element.href = url
}

// WebSite 结构化数据只保留在域名首页，返回首页时按同一品牌基线恢复。
function setWebsiteStructuredData(enabled: boolean): void {
  const id = 'website-structured-data'
  const current = document.getElementById(id)
  if (!enabled) {
    current?.remove()
    return
  }
  const element = current || document.createElement('script')
  element.id = id
  element.setAttribute('type', 'application/ld+json')
  element.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['AceMock', '云舟备考', 'acemock.cn'],
    url: `${SITE_ORIGIN}/`,
  })
  if (!current) document.head.appendChild(element)
}

// 私有页保留清晰的浏览器标题，但移除摘要、分享信息和结构化数据并禁止索引。
function applyPrivateSeo(path: string): void {
  const matchedTitle = privatePageTitles.find(
    ({ prefix }) => path === prefix || path.startsWith(`${prefix}/`),
  )
  document.title = matchedTitle?.title || SITE_NAME
  setNamedMeta('robots', 'noindex, nofollow, noarchive, nosnippet')
  document.head.querySelector('meta[name="description"]')?.remove()
  setCanonical(null)
  setPropertyMeta('og:type', null)
  setPropertyMeta('og:title', null)
  setPropertyMeta('og:description', null)
  setPropertyMeta('og:url', null)
  setWebsiteStructuredData(false)
}

// 公开页同步搜索、分享和规范网址信号，确保标题、摘要与实际页面语义一致。
function applyPublicSeo(metadata: PublicSeoMetadata): void {
  const canonicalUrl = new URL(metadata.canonicalPath, SITE_ORIGIN).toString()
  document.title = metadata.title
  setNamedMeta('description', metadata.description)
  setNamedMeta('robots', 'index, follow, max-image-preview:large')
  setCanonical(canonicalUrl)
  setPropertyMeta('og:type', 'website')
  setPropertyMeta('og:locale', 'zh_CN')
  setPropertyMeta('og:site_name', SITE_NAME)
  setPropertyMeta('og:title', metadata.title)
  setPropertyMeta('og:description', metadata.description)
  setPropertyMeta('og:url', canonicalUrl)
  setWebsiteStructuredData(Boolean(metadata.websiteStructuredData))
}

// 每次导航完成后按最终路径应用 SEO，查询参数和页内状态不产生新的规范页面。
export function applyRouteSeo(route: RouteLocationNormalizedLoaded): void {
  const normalizedPath = route.path !== '/' ? route.path.replace(/\/$/, '') : '/'
  const metadata = publicSeoByPath[normalizedPath]
  if (metadata) {
    applyPublicSeo(metadata)
    return
  }
  applyPrivateSeo(normalizedPath)
}
