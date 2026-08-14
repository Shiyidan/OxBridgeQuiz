#!/usr/bin/env node
// Verify both fixed SMTP identities from a target API runtime without sending messages or printing secrets.
const dns = require('node:dns').promises
const fs = require('node:fs')
const path = require('node:path')
const { createRequire } = require('node:module')

const runtimeDir = path.resolve(process.argv[2] || '/opt/quiz/api')
const envFile = path.resolve(process.argv[3] || path.join(runtimeDir, '.env'))
const runtimeRequire = createRequire(path.join(runtimeDir, 'package.json'))
const nodemailer = runtimeRequire('nodemailer')

// Parse the selected runtime file without copying values into process output.
function readEnv(file) {
  const values = new Map()
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/)
    if (!match) continue
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) value = value.slice(1, -1)
    values.set(match[1], value)
  }
  return values
}

// Normalize display-name From values before validating channel ownership.
function mailbox(value) {
  return (String(value).match(/<([^<>]+)>/)?.[1] || String(value)).trim().toLowerCase()
}

// Authenticate one SMTP channel and close the socket without submitting a message.
async function verifyChannel(values, channel) {
  const prefix = channel === 'bulk' ? 'BULK_' : ''
  const host = values.get(`${prefix}SMTP_HOST`) || values.get('SMTP_HOST') || 'smtpdm.aliyun.com'
  const port = Number(values.get(`${prefix}SMTP_PORT`) || values.get('SMTP_PORT') || '465')
  const secure = (values.get(`${prefix}SMTP_SECURE`) || values.get('SMTP_SECURE') || 'true') === 'true'
  const user = values.get(`${prefix}SMTP_USER`) || ''
  const pass = values.get(`${prefix}SMTP_PASS`) || ''
  const from = values.get(channel === 'bulk' ? 'BULK_MAIL_FROM' : 'MAIL_FROM') || ''
  const expected = channel === 'bulk' ? 'news@mail.acemock.cn' : 'no-reply@mail.acemock.cn'
  if (mailbox(user) !== expected || mailbox(from) !== expected || !pass) {
    throw new Error(`${channel} sender identity is invalid`)
  }
  const { address } = await dns.lookup(host, { family: 4 })
  const transporter = nodemailer.createTransport({
    host: address,
    port,
    secure,
    authMethod: 'LOGIN',
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
    tls: { servername: host },
    auth: { user, pass },
  })
  try {
    await transporter.verify()
  } finally {
    transporter.close()
  }
}

async function main() {
  const values = readEnv(envFile)
  await verifyChannel(values, 'transactional')
  await verifyChannel(values, 'bulk')
  console.log(JSON.stringify({
    runtimeEnv: values.get('API_RUNTIME_ENV'),
    transactionalSmtp: 'authenticated',
    bulkSmtp: 'authenticated',
  }))
}

main().catch((error) => {
  console.error(`[mail-runtime-validation] failed: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
