#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function parseArgs(argv) {
  const args = {}
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i]
    if (!key.startsWith('--')) continue
    args[key.slice(2)] = argv[i + 1]
    i += 1
  }
  return args
}

function readText(file) {
  if (!file || !fs.existsSync(file)) return ''
  const buffer = fs.readFileSync(file)
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.slice(2).toString('utf16le')
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.alloc(buffer.length - 2)
    for (let i = 2; i + 1 < buffer.length; i += 2) {
      swapped[i - 2] = buffer[i + 1]
      swapped[i - 1] = buffer[i]
    }
    return swapped.toString('utf16le')
  }
  const sample = buffer.subarray(0, Math.min(buffer.length, 200))
  const oddNulls = sample.filter((byte, index) => index % 2 === 1 && byte === 0).length
  if (oddNulls > sample.length / 8) return buffer.toString('utf16le')
  return buffer.toString('utf8')
}

// Read the newest deployment processing notes from the environment-specific tracked record.
function readDeploymentNotes(file) {
  const text = readText(file)
  if (!text) return ''
  const lines = text.split(/\r?\n/)
  const sections = []
  let current = null

  for (const line of lines) {
    if (/^###\s+9\.\d+\s+/.test(line) || /^##\s+\d{4}-\d{2}-\d{2}\s+/.test(line)) {
      if (current) sections.push(current)
      current = { title: line, lines: [] }
      continue
    }
    if (current) current.lines.push(line)
  }
  if (current) sections.push(current)

  const datedSections = sections.filter((section) => /^##\s+\d{4}-\d{2}-\d{2}\s+/.test(section.title))
  const selectedSections = datedSections.length ? datedSections.slice(0, 2) : sections.slice(0, 2)
  const notes = []
  for (const section of selectedSections) {
    const body = section.lines.join('\n')
    const marker = body.search(/处理记录[:：]/)
    if (marker < 0) continue
    const rest = body.slice(marker).trim()
    const end = rest.search(/\n验证结果[:：]/)
    notes.push(`${section.title}\n\n${end >= 0 ? rest.slice(0, end).trim() : rest}`)
  }

  return notes.join('\n\n')
}

function pickArg(args, ...names) {
  for (const name of names) {
    if (args[name]) return args[name]
  }
  return ''
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function sections(text) {
  const result = {}
  let current = 'raw'
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^---\s+(.+?)\s+---$/)
    if (match) {
      current = match[1]
      result[current] = []
    } else {
      if (!result[current]) result[current] = []
      result[current].push(line)
    }
  }
  return Object.fromEntries(Object.entries(result).map(([key, lines]) => [key, lines.join('\n').trim()]))
}

function firstLine(value) {
  return (value || '').split(/\r?\n/).find(Boolean) || ''
}

function pre(title, value) {
  return `
    <section>
      <h2>${escapeHtml(title)}</h2>
      <pre>${escapeHtml(value || '未采集到数据')}</pre>
    </section>`
}

// Extract machine-readable local and remote stage timings from the sanitized deployment log.
function parseTimings(text) {
  const timings = []
  const pattern = /^(local_timing|remote_timing)(?:\s+stage=([^\s]+)\s+seconds=([0-9.]+))?\s+total_seconds=([0-9.]+)$/gm
  for (const match of text.matchAll(pattern)) {
    timings.push({
      source: match[1] === 'local_timing' ? '本地编排' : '远端执行',
      stage: match[2] || '总计',
      seconds: match[3] || match[4],
      totalSeconds: match[4],
    })
  }
  return timings
}

// Render a compact timing table so future deployment regressions can be located without raw evidence.
function timingTable(timings) {
  if (!timings.length) return pre('部署阶段耗时', '当前报告未采集到阶段耗时。')
  const rows = timings.map((timing) => `
          <tr>
            <td>${escapeHtml(timing.source)}</td>
            <td><code>${escapeHtml(timing.stage)}</code></td>
            <td>${escapeHtml(timing.seconds)} 秒</td>
            <td>${escapeHtml(timing.totalSeconds)} 秒</td>
          </tr>`).join('')
  return `
    <section>
      <h2>部署阶段耗时</h2>
      <table>
        <thead><tr><th>来源</th><th>阶段</th><th>阶段耗时</th><th>累计耗时</th></tr></thead>
        <tbody>${rows}
        </tbody>
      </table>
    </section>`
}

const args = parseArgs(process.argv)
const environment = args.environment || 'unknown'
if (!['test', 'prod'].includes(environment)) {
  throw new Error('Missing or invalid --environment. Expected test or prod.')
}
const scope = args.scope || 'unknown'
const branch = args.branch || 'unknown'
const result = args.result || 'success'
const output = args.output || path.join(
  process.cwd(),
  '.private',
  'deployment-reports',
  `quiztestdemo-${environment}-deployment-report.html`,
)
const serverReport = readText(pickArg(args, 'serverReport', 'server-report'))
const deployLog = readText(pickArg(args, 'deployLog', 'deploy-log'))
const publicHome = readText(pickArg(args, 'publicHome', 'public-home'))
const publicHealth = readText(pickArg(args, 'publicHealth', 'public-health'))
const databaseRead = readText(pickArg(args, 'databaseRead', 'database-read'))
const requestIdRuntime = readText(pickArg(args, 'requestIdRuntime', 'request-id-runtime'))
const deploymentNotes = readDeploymentNotes(pickArg(args, 'deploymentDoc', 'deployment-doc'))
const data = sections(serverReport)
const gitLines = (data.git || '').split(/\r?\n/).filter(Boolean)
const meta = data['deploy-meta'] || ''
const timestamp = firstLine(meta.split(/\r?\n/).find((line) => line.startsWith('time='))?.slice(5) || new Date().toISOString())
const commitHash = gitLines[1] || ''
const commitLog = gitLines[2] || ''
const pm2Online = /quiz-api[\s\S]*online/.test(data.pm2 || '')
const publicOk = /200 OK/.test(publicHome)
const healthOk = /"status"\s*:\s*"ok"/.test(publicHealth)
const databaseReadOk = /HTTP\/1\.1 200 OK/.test(databaseRead) && /"success"\s*:\s*true/.test(databaseRead)
const requestIdRuntimeOk = /http\.request\.completed/.test(requestIdRuntime) && /requestId/.test(requestIdRuntime)
const resultClass = result === 'success' ? 'ok' : result === 'failed' ? 'bad' : 'warn'
const deploymentTimings = parseTimings(deployLog)
const deploymentContent = environment === 'test'
  ? [
      '测试环境后端与前端在本地隔离工作树中构建，服务器仅校验并同步构建产物。',
      '后端范围包含运行时配置检查、备份、Prisma 迁移和 PM2 重载；前端范围包含静态资源同步。',
    ]
  : [
      '后端范围包含依赖安装、迁移检查、RDS 迁移、构建和 PM2 重载。',
      '前端范围包含依赖安装、Vite 生产构建和静态资源同步。',
    ]

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QuizTestDemo ${escapeHtml(environment)} 部署报告</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #243434; background: #f6f8f8; line-height: 1.6; }
    main { max-width: 1040px; margin: 0 auto; padding: 40px 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    h2 { margin: 30px 0 12px; font-size: 20px; }
    .meta, section { background: #fff; border: 1px solid #dfe7e7; border-radius: 8px; padding: 20px; margin-top: 18px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e8eeee; padding: 10px 12px; text-align: left; vertical-align: top; }
    th { background: #f0f5f5; }
    pre { overflow: auto; background: #f7faf9; border: 1px solid #e3ebea; border-radius: 6px; padding: 12px; white-space: pre-wrap; }
    code { background: #eef4f4; padding: 2px 5px; border-radius: 4px; }
    .ok { color: #07825d; font-weight: 700; }
    .warn { color: #9a6200; font-weight: 700; }
    .bad { color: #b42318; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>QuizTestDemo ${escapeHtml(environment)} 部署报告</h1>
    <div class="meta">
      <p><strong>结果：</strong><span class="${resultClass}">${escapeHtml(result)}</span></p>
      <p><strong>环境：</strong><code>${escapeHtml(environment)}</code></p>
      <p><strong>范围：</strong>${escapeHtml(scope)}</p>
      <p><strong>分支：</strong><code>${escapeHtml(branch)}</code></p>
      <p><strong>Commit：</strong><code>${escapeHtml(commitHash)}</code> ${escapeHtml(commitLog)}</p>
      <p><strong>时间：</strong>${escapeHtml(timestamp)}</p>
    </div>

    <section>
      <h2>一、部署内容</h2>
      <ul>
        <li>目标环境：<code>${escapeHtml(environment)}</code></li>
        <li>执行范围：<code>${escapeHtml(scope)}</code></li>
        <li>代码分支：<code>${escapeHtml(branch)}</code></li>
        ${deploymentContent.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </section>

    <section>
      <h2>二、核心验证</h2>
      <table>
        <thead><tr><th>检查项</th><th>结果</th></tr></thead>
        <tbody>
          <tr><td>公网首页</td><td class="${publicOk ? 'ok' : 'bad'}">${publicOk ? '通过' : '异常'}</td></tr>
          <tr><td>公网 API Health</td><td class="${healthOk ? 'ok' : 'bad'}">${healthOk ? '通过' : '异常'}</td></tr>
          <tr><td>PM2 quiz-api</td><td class="${pm2Online ? 'ok' : 'bad'}">${pm2Online ? 'online' : '未确认 online'}</td></tr>
          <tr><td>数据库依赖只读接口</td><td class="${databaseReadOk ? 'ok' : 'bad'}">${databaseReadOk ? '通过' : '异常'}</td></tr>
          <tr><td>Request ID 运行日志关联</td><td class="${requestIdRuntimeOk ? 'ok' : 'bad'}">${requestIdRuntimeOk ? '通过' : '异常'}</td></tr>
          <tr><td>本地 API Health</td><td><code>${escapeHtml(firstLine(data['health-local-api']))}</code></td></tr>
          <tr><td>本地 Nginx API Health</td><td><code>${escapeHtml(firstLine(data['health-local-nginx']))}</code></td></tr>
        </tbody>
      </table>
    </section>

    ${timingTable(deploymentTimings)}

    ${pre('三、服务器目录结构', data.structure)}
    ${pre('四、更新时间', data.timestamps)}
    ${pre('五、磁盘空间', data.disk)}
    ${pre('六、内存空间', data.memory)}
    ${pre('七、CPU / 负载 / 运行时间', data['cpu-load-uptime'])}
    ${pre('八、端口监听', data.ports)}
    ${pre('九、PM2 状态', data.pm2)}
    ${pre('十、数据库与备份', data.database)}
    ${pre('十一、Prisma 迁移状态', data['migrations-status'])}
    ${pre('十二、公网首页响应', publicHome)}
    ${pre('十三、公网 API Health', publicHealth)}
    ${pre('十四、部署日志摘要', deployLog)}
    ${pre('十五、数据库依赖接口验证', databaseRead)}
    ${pre('十六、Request ID 运行日志验证', requestIdRuntime)}
    ${pre('十七、部署方案处理记录', deploymentNotes)}

    <section>
      <h2>十八、风险与后续</h2>
      <ul>
        <li>如果 npm audit 在部署日志中提示漏洞，应单独安排依赖升级和回归测试。</li>
        <li>生产或测试数据库只能通过 Prisma migration 演进，常规部署不得使用 <code>db push</code>。</li>
        <li>如果公网仍使用 HTTP，正式对外前建议补充域名、备案和 HTTPS。</li>
      </ul>
    </section>
  </main>
</body>
</html>
`

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, html, 'utf8')
console.log(output)
