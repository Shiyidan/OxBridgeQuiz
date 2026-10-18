// 公开页面构建期预渲染：从 Vite 最终入口生成带独立 head 与可读首屏正文的静态 HTML。
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { Plugin } from 'vite'

const SITE_ORIGIN = 'https://acemock.cn'
const SITE_NAME = 'AceMock 云舟备考'

interface PrerenderPage {
  path: string
  title: string
  heading: string
  description: string
  summary: string
  websiteStructuredData?: boolean
}

const prerenderPages: PrerenderPage[] = [
  {
    path: '/',
    title: 'AceMock 云舟备考｜ESAT 与 TMUA 真题诊断',
    heading: '用一套真题，看清你的 ESAT / TMUA 真实水平',
    description:
      'AceMock 云舟备考基于历年真题和考试大纲，提供 ESAT、TMUA 水平诊断、知识点分析、专项练习与错题复习，帮助学生针对薄弱项高效备考。',
    summary:
      '注册后可选择历年真题进行诊断，查看按知识点和能力维度生成的报告，再根据薄弱项进入专项练习与错题复习。',
    websiteStructuredData: true,
  },
  {
    path: '/exam-intro/esat',
    title: 'ESAT 考试介绍、科目与备考指南｜AceMock 云舟备考',
    heading: 'ESAT 考试介绍与备考指南',
    description:
      '了解 ESAT 考试科目、题型、考查重点与备考方法，并通过 AceMock 云舟备考衔接真题诊断和针对性训练。',
    summary:
      '本页介绍 ESAT 的考试结构、科目选择、核心能力要求、常见问题和备考重点，并提供与 TMUA、STEP 的对比入口。',
  },
  {
    path: '/exam-intro/tmua',
    title: 'TMUA 考试介绍、题型与备考指南｜AceMock 云舟备考',
    heading: 'TMUA 考试介绍与备考指南',
    description:
      '了解 TMUA Paper 1、Paper 2 的考试结构、题型与备考重点，并通过 AceMock 云舟备考衔接真题诊断和针对性训练。',
    summary:
      '本页介绍 TMUA Paper 1、Paper 2 的考试结构、数学推理要求、常见问题和备考重点，并提供与 ESAT、STEP 的对比入口。',
  },
  {
    path: '/exam-intro/step',
    title: 'STEP 考试介绍与备考指南｜AceMock 云舟备考',
    heading: 'STEP 考试介绍与备考指南',
    description:
      '了解 STEP 考试结构、核心能力要求、常见问题及其与 ESAT、TMUA 的区别，建立清晰的备考认识。',
    summary:
      '本页介绍 STEP 的考试结构、数学证明与综合解题要求、常见问题和备考重点，并提供与 ESAT、TMUA 的对比入口。',
  },
  {
    path: '/study-resources',
    title: 'ESAT、TMUA、STEP 备考资料下载｜AceMock 云舟备考',
    heading: '备考资料下载',
    description:
      '按考试和资料类型查找官方考纲、过往真题与知识点讲义，下载 AceMock 云舟备考已发布的 PDF 学习资料。',
    summary:
      '资料按 ESAT、TMUA、STEP 与考试资料、过往真题、知识点讲义分类；免费资料可直接下载，会员资料需登录并具备对应考试会员权益。',
  },
]

// 静态文本进入 HTML 前统一转义，避免文案调整时破坏构建产物结构。
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

// 预渲染正文只承载可索引的品牌、页面主题和公开导航，Vue 挂载后由正式页面接管。
function renderStaticContent(page: PrerenderPage, brandIcon: string): string {
  const links = prerenderPages
    .map(({ path, heading }) => `<a href="${path}">${escapeHtml(heading)}</a>`)
    .join(' · ')
  if (page.path === '/') {
    const resourceLinks = prerenderPages
      .filter(({ path }) => path !== '/')
      .map(
        ({ path, heading }) =>
          `<a href="${path}">${escapeHtml(heading)}<span aria-hidden="true">↗</span></a>`,
      )
      .join('')
    const loadingCards = ['真题诊断', '专项练习', '错题复习']
      .map(
        (label) =>
          `<div class="seo-card"><p>${label}</p><div aria-hidden="true"><span class="seo-bone seo-card-title"></span><span class="seo-bone"></span><span class="seo-bone seo-card-line"></span></div></div>`,
      )
      .join('')
    return `<div class="seo-home" data-seo-prerendered="true">
      <header class="seo-header"><div class="seo-nav">
        <a class="seo-brand" href="/" aria-label="${SITE_NAME}"><img src="${escapeHtml(brandIcon)}" alt="" width="32" height="32" />AceMock</a>
        <nav class="seo-menu" aria-label="主导航"><a href="/">首页</a><a href="/assessment">诊断测试</a><a href="/question-bank">试题库</a><a href="/mock-exams">模考中心</a><a href="/exam-intro/esat">考试介绍</a></nav>
        <div class="seo-account" role="status" aria-label="正在加载账号信息"><span class="seo-bone" aria-hidden="true"></span></div>
      </div></header>
      <main class="seo-main">
        <section class="seo-intro" aria-labelledby="seo-home-title">
          <p class="seo-kicker">${SITE_NAME} <span>ESAT · TMUA</span></p>
          <h1 id="seo-home-title">用一套真题，<br />看清你的 ESAT / TMUA 真实水平</h1>
          <p class="seo-description">${escapeHtml(page.description)}</p>
          <div class="seo-loading" role="status"><span class="seo-loading-dot" aria-hidden="true"></span>正在准备你的备考首页</div>
          <div class="seo-cards" aria-label="学习内容加载中" aria-busy="true">${loadingCards}</div>
          <p class="seo-summary">${escapeHtml(page.summary)}</p>
        </section>
        <section class="seo-resources" aria-labelledby="seo-resources-title">
          <h2 id="seo-resources-title">了解考试与备考资料</h2><nav aria-label="公开页面">${resourceLinks}</nav>
          <noscript><p>完整诊断与学习功能需要启用 JavaScript；你仍可通过以上链接浏览公开介绍。</p></noscript>
        </section>
      </main>
    </div>`
  }
  return `<main data-seo-prerendered="true" style="max-width:1120px;margin:0 auto;padding:72px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7;color:#181818"><p>${SITE_NAME}</p><h1>${escapeHtml(page.heading)}</h1><p>${escapeHtml(page.description)}</p><p>${escapeHtml(page.summary)}</p><nav aria-label="公开页面">${links}</nav></main>`
}

// 精确替换入口中唯一的 SEO 标签；缺失时中止构建，避免静默产出错误页面。
function replaceRequired(
  html: string,
  pattern: RegExp,
  replacement: string,
  label: string,
): string {
  if (!pattern.test(html)) throw new Error(`SEO prerender could not find ${label}`)
  return html.replace(pattern, replacement)
}

// 根据路由生成独立 head 和静态正文，查询参数及登录态不产生额外页面。
function renderPrerenderedHtml(
  baseHtml: string,
  page: PrerenderPage,
  firstPaintStyles: string,
): string {
  const canonicalUrl = new URL(page.path, SITE_ORIGIN).toString()
  let html = baseHtml
  html = replaceRequired(
    html,
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(page.title)}</title>`,
    'title',
  )
  html = replaceRequired(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    'description',
  )
  html = replaceRequired(
    html,
    /<meta\s+name="robots"[\s\S]*?\/>/,
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    'robots',
  )
  html = replaceRequired(
    html,
    /<link\s+rel="canonical"[\s\S]*?\/>/,
    `<link rel="canonical" href="${canonicalUrl}" />`,
    'canonical',
  )
  html = replaceRequired(
    html,
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    'og:title',
  )
  html = replaceRequired(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    'og:description',
  )
  html = replaceRequired(
    html,
    /<meta\s+property="og:url"[\s\S]*?\/>/,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    'og:url',
  )
  if (!page.websiteStructuredData) {
    html = html.replace(
      /\s*<script id="website-structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/,
      '',
    )
  }
  // 首屏样式内联，避免等待应用 CSS；限定在静态外壳内，Vue 接管后不影响业务页面。
  if (page.path === '/') html = html.replace('</head>', `<style>${firstPaintStyles}</style></head>`)
  const brandIcon = baseHtml.match(/<link\s+rel="icon"[^>]*href="([^"]+)"/)?.[1] || ''
  return replaceRequired(
    html,
    /<div id="app"><\/div>/,
    `<div id="app">${renderStaticContent(page, brandIcon)}</div>`,
    '#app mount point',
  )
}

// Vite 写出哈希资源后再复用最终 index.html，确保预渲染页面引用本次构建文件。
export function seoPrerenderPlugin(): Plugin {
  return {
    name: 'quiztestdemo-seo-prerender',
    apply: 'build',
    async writeBundle(outputOptions) {
      const outputDirectory = resolve(process.cwd(), outputOptions.dir || 'dist')
      const indexPath = resolve(outputDirectory, 'index.html')
      const baseHtml = await readFile(indexPath, 'utf8')
      const firstPaintStyles = await readFile(
        new URL('./seoFirstPaint.css', import.meta.url),
        'utf8',
      )
      for (const page of prerenderPages) {
        const source = renderPrerenderedHtml(baseHtml, page, firstPaintStyles)
        const targetPath =
          page.path === '/' ? indexPath : resolve(outputDirectory, page.path.slice(1), 'index.html')
        await mkdir(dirname(targetPath), { recursive: true })
        await writeFile(targetPath, source, 'utf8')
      }
    },
  }
}
