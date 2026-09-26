// Back up runtime settings, merge confirmed source IPs, and trust only the local Nginx proxy.
import { createRequire } from 'node:module'
import { readFileSync, copyFileSync, chmodSync, writeFileSync, renameSync } from 'node:fs'
import { isIP } from 'node:net'

const [environment, database, ...ips] = process.argv.slice(2)
if (!['test', 'prod'].includes(environment) || !database || !ips.length || ips.some(ip => !isIP(ip))) {
  throw new Error('Usage: node set-registration-source-block.mjs <test|prod> <expected-database> <ip> [ip...]')
}
const runtime = '/opt/quiz/api/.env'
const require = createRequire('/opt/quiz/api/package.json')
const original = readFileSync(runtime, 'utf8')
const values = require('dotenv').parse(original)
if (values.API_RUNTIME_ENV !== environment || decodeURIComponent(new URL(values.DATABASE_URL).pathname.slice(1)) !== database) {
  throw new Error('Runtime environment/database mismatch')
}
const sources = [...new Set([...(values.REGISTRATION_BLOCKED_IPS || '').split(',').map(ip => ip.trim()).filter(Boolean), ...ips])]
if (sources.some(ip => !isIP(ip))) throw new Error('Existing source restriction contains an invalid address')
const replacements = { TRUST_PROXY: 'loopback', REGISTRATION_BLOCKED_IPS: sources.join(',') }
let updated = original
for (const [key, value] of Object.entries(replacements)) {
  const pattern = new RegExp(`^\\s*${key}=.*$`, 'gm')
  if ((original.match(pattern) || []).length > 1) throw new Error(`Duplicate runtime key: ${key}`)
  updated = pattern.test(updated) ? updated.replace(pattern, `${key}=${value}`) : `${updated.trimEnd()}\n${key}=${value}\n`
}
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
const backup = `/opt/quiz/backups/config/runtime-before-registration-block-${stamp}.env`
copyFileSync(runtime, backup)
chmodSync(backup, 0o600)
const candidate = `${runtime}.registration-block-${process.pid}`
writeFileSync(candidate, updated, { mode: 0o600, flag: 'wx' })
renameSync(candidate, runtime)
console.log(JSON.stringify({ environment, backup, blockedSourceCount: sources.length, trustProxy: 'loopback' }))
