#!/usr/bin/env node
// Generate a reader-friendly AceMock deployment brief from sanitized deployment evidence.
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

// Read the newest deployment record as concise, product-facing release notes.
function readReadableDeploymentNotes(file) {
  const text = readText(file)
  if (!text) return { title: '', intro: '', facts: {}, bullets: [] }
  const start = text.search(/^##\s+\d{4}-\d{2}-\d{2}\s+/m)
  if (start < 0) return { title: '', intro: '', facts: {}, bullets: [] }
  const remaining = text.slice(start)
  const next = remaining.slice(3).search(/^##\s+\d{4}-\d{2}-\d{2}\s+/m)
  const section = next >= 0 ? remaining.slice(0, next + 3) : remaining
  const lines = section.split(/\r?\n/)
  const title = (lines.shift() || '').replace(/^##\s+/, '').trim()
  const intro = lines.find((line) => {
    const trimmed = line.trim()
    return trimmed && !trimmed.startsWith('|') && !trimmed.startsWith('-') && !trimmed.startsWith('处理')
  }) || ''
  const facts = {}
  for (const line of lines) {
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/)
    if (!match || /^[-:]+$/.test(match[1].trim())) continue
    facts[match[1].trim()] = match[2].trim().replace(/\x60/g, '')
  }
  const marker = lines.findIndex((line) => /^处理(?:与验证)?记录[:：]/.test(line.trim()))
  const bullets = marker < 0
    ? []
    : lines.slice(marker + 1)
      .filter((line) => /^\s*-\s+/.test(line))
      .map((line) => line.replace(/^\s*-\s+/, '').replace(/\x60/g, '').trim())
      .filter(Boolean)
      .filter((line) => !/HTML 报告|临时证据|报告目录/.test(line))
      .slice(0, 5)
  return { title, intro: intro.trim().replace(/\x60/g, ''), facts, bullets }
}

// Convert the Git log line into a readable change title.
function commitSubject(commitLog) {
  const match = String(commitLog || '').match(/^\S+\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s+[+-]\d{4}\s+(.+)$/)
  return match?.[1]?.trim() || ''
}

// Prefer the deployment record's feature name over a technical Commit title.
function readableReleaseTitle(notes, commitLog, environmentLabel) {
  const parenthesized = notes.title.match(/[（(]([^）)]+)[）)]/)
  return parenthesized?.[1]?.trim() || commitSubject(commitLog) || environmentLabel + '代码更新'
}

// Parse disk usage into a compact capacity statement.
function diskSummary(text) {
  const match = String(text || '').match(/^\/\S+\s+(\S+)\s+(\S+)\s+(\S+)\s+(\d+%)\s+\/$/m)
  return match ? '已用 ' + match[2] + ' / ' + match[1] + '（' + match[4] + '）' : '未采集'
}

// Parse memory usage into a compact capacity statement.
function memorySummary(text) {
  const match = String(text || '').match(/^Mem:\s+(\S+)\s+(\S+)\s+\S+\s+\S+\s+\S+\s+(\S+)/m)
  return match ? '已用 ' + match[2] + ' / ' + match[1] + '，可用 ' + match[3] : '未采集'
}

// Parse uptime and load averages without exposing command output.
function loadSummary(text) {
  const match = String(text || '').match(/up\s+(.+?),\s+\d+\s+users?,\s+load average:\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+)/)
  const cores = String(text || '').split(/\r?\n/).map((line) => line.trim()).find((line) => /^\d+$/.test(line))
  return match ? '运行 ' + match[1] + '，负载 ' + match[2] + ' / ' + match[3] + ' / ' + match[4] + (cores ? '，' + cores + ' 核' : '') : '未采集'
}

// Summarize backup evidence without listing server paths or filenames.
function backupSummary(data) {
  const summary = data['backup-summary'] || ''
  if (summary) {
    const values = Object.fromEntries(summary.split(/\r?\n/).map((line) => line.split('=', 2)).filter((pair) => pair.length === 2))
    return '数据库备份 ' + (values.mysql_count || '0') + ' 份（最近 ' + (values.mysql_latest || '未确认') + '）；'
      + '上传文件备份 ' + (values.uploads_count || '0') + ' 份（最近 ' + (values.uploads_latest || '未确认') + '）'
  }
  const raw = data.database || ''
  const mysqlCount = (raw.match(/\/backups\/mysql\//g) || []).length
  const uploadCount = (raw.match(/\/backups\/uploads\//g) || []).length
  if (!mysqlCount && !uploadCount) return '未采集到备份摘要'
  return '采集窗口确认数据库备份 ' + mysqlCount + ' 份、上传文件备份 ' + uploadCount + ' 份'
}

// Render concise release notes in natural language.
function releaseNotesSection(notes, fallbackItems) {
  const items = notes.bullets.length ? notes.bullets : fallbackItems
  const intro = notes.intro ? '<p class="intro">' + escapeHtml(notes.intro) + '</p>' : ''
  return '<section><h2>一、本次发布内容</h2>' + intro + '<ul>' + items.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul></section>'
}

// Render infrastructure metrics as a short status table instead of raw Linux output.
function resourceSummarySection(data, runtimeMatch) {
  return '<section><h2>三、运行状态摘要</h2><table><tbody>'
    + '<tr><td>服务器容量</td><td>' + escapeHtml(diskSummary(data.disk)) + '</td></tr>'
    + '<tr><td>内存</td><td>' + escapeHtml(memorySummary(data.memory)) + '</td></tr>'
    + '<tr><td>运行负载</td><td>' + escapeHtml(loadSummary(data['cpu-load-uptime'])) + '</td></tr>'
    + '<tr><td>备份</td><td>' + escapeHtml(backupSummary(data)) + '</td></tr>'
    + '<tr><td>环境与数据库门禁</td><td class="' + (runtimeMatch ? 'ok' : 'warn') + '">' + (runtimeMatch ? '匹配' : '未确认') + '</td></tr>'
    + '</tbody></table></section>'
}

// Extract one useful failure reason while filtering shell stack traces and progress meters.
function failureSummary(text) {
  const ignored = /CategoryInfo|FullyQualifiedErrorId|char:\d+|^\s*[+~]|% Total|Dload\s+Upload|^\s*\d+\s+\d+/
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !ignored.test(line))
  const failures = lines.filter((line) => /error|failed|failure|exception|拒绝|失败|异常/i.test(line))
  return (failures.at(-1) || lines.at(-1) || '未采集到明确失败原因').slice(0, 260)
}

// Render only actual risks and next actions, never the full deployment log.
function riskSection(warnings) {
  if (!warnings.length) return '<section><h2>五、风险与后续</h2><div class="empty ok">本次部署未发现阻塞项，核心验证均已完成。</div></section>'
  return '<section><h2>五、风险与后续</h2><ul>' + warnings.map((warning) => '<li>' + escapeHtml(warning) + '</li>').join('') + '</ul></section>'
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

// Translate machine stage identifiers into reader-facing activity names.
function timingStageLabel(stage) {
  const labels = {
    remote_preflight: '环境与数据库门禁',
    local_build: '本地构建',
    artifact_packaging: '构建产物打包',
    bundle_and_upload: '上传与校验',
    remote_deploy: '服务器发布',
    post_deploy_validation: '发布后验证',
    report_generation: '生成部署报告',
    backup: '部署前备份',
    runtime_validation: '运行配置校验',
    migration: '数据库迁移',
    frontend_sync: '前端资源更新',
    backend_sync: '后端服务更新',
    总计: '总耗时',
  }
  return labels[stage] || String(stage).replaceAll('_', ' ')
}

// Render a compact timing table so future deployment regressions can be located without raw evidence.
function timingTable(timings) {
  if (!timings.length) return '<section><h2>四、部署耗时</h2><div class="empty warn">本次未采集分阶段耗时。</div></section>'
  const rows = timings.map((timing) => `
          <tr>
            <td>${escapeHtml(timing.source)}</td>
            <td>${escapeHtml(timingStageLabel(timing.stage))}</td>
            <td>${escapeHtml(timing.seconds)} 秒</td>
            <td>${escapeHtml(timing.totalSeconds)} 秒</td>
          </tr>`).join('')
  return `
    <section>
      <h2>四、部署耗时</h2>
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
const deploymentNotes = readReadableDeploymentNotes(pickArg(args, 'deploymentDoc', 'deployment-doc'))
const data = sections(serverReport)
const gitLines = (data.git || '').split(/\r?\n/).filter(Boolean)
const meta = data['deploy-meta'] || ''
const timestamp = firstLine(meta.split(/\r?\n/).find((line) => line.startsWith('time='))?.slice(5) || new Date().toISOString())
const commitHash = gitLines[1] || ''
const commitLog = gitLines[2] || ''
const pm2Online = /quiz-api[\s\S]*online/.test(data.pm2 || '')
const publicOk = /HTTP\/(?:1\.1|2)\s+200(?:\s|$)/.test(publicHome)
const healthOk = /"status"\s*:\s*"ok"/.test(publicHealth)
const localApiOk = /"status"\s*:\s*"ok"/.test(data['health-local-api'] || '')
const localNginxOk = /"status"\s*:\s*"ok"/.test(data['health-local-nginx'] || '')
const databaseReadOk = /"success"\s*:\s*true/.test(databaseRead)
const requestIdRuntimeOk = /http\.request\.completed/.test(requestIdRuntime) && /requestId/.test(requestIdRuntime)
const migrationOk = /Database schema is up to date|No pending migrations|已是最新/i.test(data['migrations-status'] || '')
const runtimeMatch = /target match:\s*yes/i.test(data.database || '')
const resultClass = result === 'success' ? 'ok' : result === 'failed' ? 'bad' : 'warn'
const environmentLabel = environment === 'test' ? '测试环境' : '生产环境'
const resultLabel = result === 'success' ? '部署成功' : result === 'failed' ? '部署失败' : '部分成功'
const deploymentTimings = parseTimings(deployLog)
const releaseTitle = args['release-title'] || readableReleaseTitle(deploymentNotes, commitLog, environmentLabel)
const scopeLabel = scope === 'all' ? '前端与后端' : scope === 'frontend' ? '前端' : scope === 'backend' ? '后端' : scope
deploymentNotes.intro = '本次已将“' + releaseTitle + '”发布到' + environmentLabel + '，发布范围为' + scopeLabel + '。'
const frontendInScope = scope === 'frontend' || scope === 'all'
const backendInScope = scope === 'backend' || scope === 'all'
const releaseItems = [
  frontendInScope ? '前端页面与静态资源已完成更新。' : '',
  backendInScope ? '后端 API、运行配置校验、数据库迁移与服务重载已完成。' : '',
].filter(Boolean)
const warnings = []
if (result !== 'success') warnings.push('部署未完全成功：' + failureSummary(deployLog))
if (frontendInScope && !publicOk) warnings.push('公网首页验证未通过，需要复查前端资源或 Nginx。')
if (backendInScope && (!healthOk || !pm2Online)) warnings.push('后端健康状态未完全通过，需要复查 API 服务。')
if (backendInScope && !migrationOk) warnings.push('数据库迁移状态未确认是最新。')
if (/found\s+\d+\s+vulnerabilit|vulnerabilities/i.test(deployLog)) warnings.push('依赖扫描发现安全项，建议单独安排依赖升级与回归。')
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
  <title>【${escapeHtml(environmentLabel)}】AceMock ${escapeHtml(releaseTitle)}</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif; color: #172033; background: #f4f7fb; line-height: 1.6; }
    main { max-width: 1040px; margin: 0 auto; padding: 32px 24px 48px; }
    .hero { background: #0f1f38; color: #fff; border-radius: 16px; padding: 28px 32px; }
    .hero-kicker { color: #70d7cb; font-size: 13px; font-weight: 700; letter-spacing: 2px; }
    h1 { margin: 8px 0 6px; font-size: 30px; }
    .hero p { margin: 0; color: #cbd8e8; }
    h2 { margin: 30px 0 12px; font-size: 20px; }
    .meta, section { background: #fff; border: 1px solid #e1e8f0; border-radius: 12px; padding: 20px; margin-top: 18px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e8eeee; padding: 10px 12px; text-align: left; vertical-align: top; }
    th { background: #f0f5f5; }
    code { background: #eef4f4; padding: 2px 5px; border-radius: 4px; }
    .ok { color: #07825d; font-weight: 700; }
    .warn { color: #9a6200; font-weight: 700; }
    .bad { color: #b42318; font-weight: 700; }
    .intro { color: #33435b; font-size: 16px; }
    .hint { color: #718096; font-size: 13px; }
    .empty { padding: 14px; border-radius: 10px; background: #eaf7f2; }
  </style>
</head>
<body>
  <main>
    <div class="hero">
      <div class="hero-kicker">ACEMOCK · RELEASE BRIEF</div>
      <h1>${escapeHtml(releaseTitle)}</h1>
      <p>${escapeHtml(environmentLabel)} · ${escapeHtml(scopeLabel)} · ${escapeHtml(resultLabel)}</p>
    </div>
    <div class="meta">
      <p><strong>结果：</strong><span class="${resultClass}">${escapeHtml(resultLabel)}</span></p>
      <p><strong>环境：</strong>${escapeHtml(environmentLabel)}</p>
      <p><strong>范围：</strong>${escapeHtml(scopeLabel)}</p>
      <p><strong>分支：</strong><code>${escapeHtml(branch)}</code></p>
      <p><strong>Commit：</strong><code>${escapeHtml(commitHash)}</code></p>
      <p><strong>时间：</strong>${escapeHtml(timestamp)}</p>
    </div>

    ${releaseNotesSection(deploymentNotes, releaseItems)}

    <section>
      <h2>二、上线验证</h2>
      <table>
        <thead><tr><th>检查项</th><th>结果</th></tr></thead>
        <tbody>
          <tr><td>网站首页<div class="hint">公网入口可正常访问</div></td><td class="${publicOk ? 'ok' : 'bad'}">${publicOk ? '通过' : '需关注'}</td></tr>
          <tr><td>API 健康状态<div class="hint">公网与服务器内部健康检查</div></td><td class="${healthOk && localApiOk && localNginxOk ? 'ok' : 'bad'}">${healthOk && localApiOk && localNginxOk ? '通过' : '需关注'}</td></tr>
          <tr><td>后端服务进程<div class="hint">quiz-api 运行状态</div></td><td class="${pm2Online ? 'ok' : 'bad'}">${pm2Online ? 'online' : '需关注'}</td></tr>
          <tr><td>数据库只读访问<div class="hint">依赖数据库的业务接口</div></td><td class="${databaseReadOk ? 'ok' : 'bad'}">${databaseReadOk ? '通过' : '需关注'}</td></tr>
          <tr><td>数据库迁移<div class="hint">Prisma 数据库结构状态</div></td><td class="${migrationOk ? 'ok' : 'bad'}">${migrationOk ? '已是最新' : '需关注'}</td></tr>
          <tr><td>请求链路追踪<div class="hint">Request ID 可关联运行记录</div></td><td class="${requestIdRuntimeOk ? 'ok' : 'bad'}">${requestIdRuntimeOk ? '通过' : '需关注'}</td></tr>
        </tbody>
      </table>
    </section>

    ${resourceSummarySection(data, runtimeMatch)}
    ${timingTable(deploymentTimings)}
    ${riskSection(warnings)}
  </main>
</body>
</html>
`

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, html, 'utf8')
console.log(output)
