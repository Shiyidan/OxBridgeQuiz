#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')
const tls = require('tls')

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

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex <= 0) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.deploy.local'))

function env(name, fallback = '') {
  return process.env[name] || fallback
}

function deploymentMeta(args) {
  const environment = args.environment || 'unknown'
  const result = args.result || 'unknown'
  const scope = args.scope || 'unknown'
  const branch = args.branch || 'unknown'
  const environmentLabels = { test: '测试环境', prod: '生产环境' }
  const resultLabels = { success: '成功', partial: '部分成功', failed: '失败' }
  const environmentLabel = environmentLabels[environment]
  const resultLabel = resultLabels[result]
  if (!environmentLabel) throw new Error('Missing or invalid --environment. Expected test or prod.')
  if (!resultLabel) throw new Error('Missing or invalid --result. Expected success, partial or failed.')
  return { environment, environmentLabel, result, resultLabel, scope, branch }
}

function deploymentSubject(args, meta) {
  return args.subject || env(
    'DEPLOY_REPORT_SUBJECT',
    `【${meta.environmentLabel}】AceMock 部署报告（${meta.resultLabel}）`,
  )
}

function encodeHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value), 'utf8').toString('base64')}?=`
}

function dotStuff(value) {
  return value.replace(/\r?\n/g, '\r\n').replace(/^\./gm, '..')
}

function readResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = ''
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('SMTP response timeout'))
    }, 30000)

    function cleanup() {
      clearTimeout(timeout)
      socket.off('data', onData)
      socket.off('error', onError)
    }

    function onError(error) {
      cleanup()
      reject(error)
    }

    function onData(chunk) {
      buffer += chunk.toString('utf8')
      const lines = buffer.split(/\r?\n/).filter(Boolean)
      const last = lines[lines.length - 1] || ''
      if (/^\d{3}\s/.test(last)) {
        cleanup()
        resolve(buffer)
      }
    }

    socket.on('data', onData)
    socket.on('error', onError)
  })
}

async function smtpCommand(socket, line, expectedCodes, options = {}) {
  if (line) socket.write(`${line}\r\n`)
  const response = await readResponse(socket)
  const code = Number(response.slice(0, 3))
  if (!expectedCodes.includes(code)) {
    const label = options.sensitive ? '<redacted>' : line || '<greeting>'
    throw new Error(`SMTP command failed: ${label}\n${response.trim()}`)
  }
  return response
}

function toRelativePath(file) {
  const relative = path.relative(process.cwd(), path.resolve(file))
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`agently-cli --body-file must be inside the current workspace: ${file}`)
  }
  return relative
}

function parseJsonOutput(output) {
  const text = String(output || '').trim()
  if (!text) return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

// Resolve a Windows npm command shim without sending user-provided arguments through cmd.exe.
function resolveCommandPath(command) {
  if (path.isAbsolute(command) || command.includes('/') || command.includes('\\')) {
    const resolved = path.resolve(command)
    return fs.existsSync(resolved) ? resolved : command
  }

  const searchPaths = String(process.env.PATH || '').split(path.delimiter).filter(Boolean)
  const extensions = process.platform === 'win32'
    ? String(process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
    : ['']
  const hasExtension = Boolean(path.extname(command))

  for (const searchPath of searchPaths) {
    const candidates = hasExtension
      ? [path.join(searchPath, command)]
      : extensions.map((extension) => path.join(searchPath, `${command}${extension.toLowerCase()}`))
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate
    }
  }

  return command
}

// Invoke the Agently npm package through Node so subjects and paths remain single argv values on Windows.
function agentlyInvocation(cli, commandArgs) {
  const resolvedCli = resolveCommandPath(cli)
  if (process.platform !== 'win32' || path.extname(resolvedCli).toLowerCase() !== '.cmd') {
    return { command: resolvedCli, args: commandArgs }
  }

  const shimDirectory = path.dirname(resolvedCli)
  const cliScript = path.join(
    shimDirectory,
    'node_modules',
    '@tencent-qqmail',
    'agently-cli',
    'scripts',
    'run.js',
  )
  if (!fs.existsSync(cliScript)) {
    throw new Error(`Unable to resolve the Agently CLI entry point beside ${resolvedCli}.`)
  }

  const bundledNode = path.join(shimDirectory, 'node.exe')
  return {
    command: fs.existsSync(bundledNode) ? bundledNode : process.execPath,
    args: [cliScript, ...commandArgs],
  }
}

function sendWithAgently(args, report, subject) {
  const cli = args.cli || env('DEPLOY_REPORT_AGENTLY_CLI', process.platform === 'win32' ? 'agently-cli.cmd' : 'agently-cli')
  const to = String(args.to || env('DEPLOY_REPORT_TO'))
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
  const token = args.confirmationToken || args['confirmation-token'] || env('DEPLOY_REPORT_AGENTLY_CONFIRMATION_TOKEN')

  if (!to.length) throw new Error('No deployment report recipients configured.')

  const commandArgs = ['message', '+send']
  for (const recipient of to) commandArgs.push('--to', recipient)
  commandArgs.push('--subject', subject, '--body-file', toRelativePath(report))
  if (token) commandArgs.push('--confirmation-token', token)

  const invocation = agentlyInvocation(cli, commandArgs)
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true,
  })
  const combinedOutput = [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
  if (result.error) {
    throw new Error(result.error.message)
  }
  if (result.status !== 0) {
    throw new Error(combinedOutput || `agently-cli exited with code ${result.status}`)
  }

  const payload = parseJsonOutput(combinedOutput)
  const data = payload?.data || payload
  if (data?.confirmation_required || data?.confirmation_token || data?.confirmationToken) {
    const confirmationToken = data.confirmation_token || data.confirmationToken
    const summary = data.summary || combinedOutput
    console.log('Agently confirmation required.')
    console.log(summary)
    if (confirmationToken) console.log(`confirmation_token=${confirmationToken}`)
    return
  }

  console.log(combinedOutput || `Deployment report emailed to ${to.length} recipient(s).`)
}

async function sendWithSmtp(args, report, subject) {
  const host = args.host || env('DEPLOY_REPORT_SMTP_HOST')
  const port = Number(args.port || env('DEPLOY_REPORT_SMTP_PORT', '465'))
  const user = args.user || env('DEPLOY_REPORT_SMTP_USER')
  const pass = args.pass || env('DEPLOY_REPORT_SMTP_PASS') || env('DEPLOY_REPORT_SMTP_AUTH_CODE')
  const fromAddress = args.from || env('DEPLOY_REPORT_FROM')
  const fromName = args.fromName || env('DEPLOY_REPORT_FROM_NAME', 'AceMock 云舟备考')
  const to = String(args.to || env('DEPLOY_REPORT_TO'))
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)

  if (!host) throw new Error('Missing DEPLOY_REPORT_SMTP_HOST.')
  if (!user) throw new Error('Missing DEPLOY_REPORT_SMTP_USER.')
  if (!pass) throw new Error('Missing DEPLOY_REPORT_SMTP_PASS or DEPLOY_REPORT_SMTP_AUTH_CODE.')
  if (!fromAddress) throw new Error('Missing DEPLOY_REPORT_FROM.')
  if (!to.length) {
    throw new Error('No deployment report recipients configured.')
  }

  const html = fs.readFileSync(report, 'utf8')
  const message = [
    `From: ${encodeHeader(fromName)} <${fromAddress}>`,
    `To: ${to.join(', ')}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <quiz-deploy-${Date.now()}@quiztestdemo.local>`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
  ].join('\r\n')

  const socket = tls.connect({
    host,
    port,
    servername: host,
    rejectUnauthorized: env('DEPLOY_REPORT_SMTP_REJECT_UNAUTHORIZED', 'true') !== 'false',
  })

  await new Promise((resolve, reject) => {
    socket.once('secureConnect', resolve)
    socket.once('error', reject)
  })

  try {
    await smtpCommand(socket, '', [220])
    await smtpCommand(socket, `EHLO ${env('COMPUTERNAME', 'quiztestdemo-deploy')}`, [250])
    await smtpCommand(socket, 'AUTH LOGIN', [334])
    await smtpCommand(socket, Buffer.from(user, 'utf8').toString('base64'), [334], { sensitive: true })
    await smtpCommand(socket, Buffer.from(pass, 'utf8').toString('base64'), [235], { sensitive: true })
    await smtpCommand(socket, `MAIL FROM:<${fromAddress}>`, [250])
    for (const recipient of to) {
      await smtpCommand(socket, `RCPT TO:<${recipient}>`, [250, 251])
    }
    await smtpCommand(socket, 'DATA', [354])
    socket.write(`${dotStuff(message)}\r\n.\r\n`)
    await smtpCommand(socket, '', [250])
    await smtpCommand(socket, 'QUIT', [221])
  } finally {
    socket.end()
  }

  console.log(`Deployment report emailed to ${to.length} recipient(s).`)
}

async function main() {
  const args = parseArgs(process.argv)
  const report = args.report
  if (!report || !fs.existsSync(report)) {
    throw new Error(`Report file not found: ${report || '<empty>'}`)
  }

  const meta = deploymentMeta(args)
  const subject = deploymentSubject(args, meta)
  const transport = args.transport || env('DEPLOY_REPORT_MAIL_TRANSPORT', 'smtp')
  if (args['dry-run'] === 'true') {
    const recipients = String(args.to || env('DEPLOY_REPORT_TO'))
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean)
    if (!recipients.length) throw new Error('No deployment report recipients configured.')
    if (transport === 'smtp') {
      const required = {
        DEPLOY_REPORT_SMTP_HOST: args.host || env('DEPLOY_REPORT_SMTP_HOST'),
        DEPLOY_REPORT_SMTP_USER: args.user || env('DEPLOY_REPORT_SMTP_USER'),
        DEPLOY_REPORT_SMTP_SECRET: args.pass || env('DEPLOY_REPORT_SMTP_PASS') || env('DEPLOY_REPORT_SMTP_AUTH_CODE'),
        DEPLOY_REPORT_FROM: args.from || env('DEPLOY_REPORT_FROM'),
      }
      const missing = Object.entries(required).filter(([, value]) => !value).map(([name]) => name)
      if (missing.length) throw new Error(`Missing deployment report mail settings: ${missing.join(', ')}`)
    }
    console.log(JSON.stringify({
      dryRun: true,
      transport,
      environment: meta.environment,
      result: meta.result,
      scope: meta.scope,
      branch: meta.branch,
      recipientCount: recipients.length,
      subject,
    }))
    return
  }
  if (transport === 'smtp') {
    await sendWithSmtp(args, report, subject)
    return
  }
  if (transport !== 'agently') {
    throw new Error(`Unsupported mail transport: ${transport}`)
  }
  sendWithAgently(args, report, subject)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

