// Generate a narrow registration-source block while preserving the active Nginx site.
import { readFileSync, writeFileSync } from 'node:fs'
import { isIP } from 'node:net'

const [input, output, ...ips] = process.argv.slice(2)
if (!input || !output || !ips.length || ips.some(ip => !isIP(ip))) {
  throw new Error('Usage: node prepare-registration-ip-block.mjs <active-config> <candidate> <ip> [ip...]')
}
const original = readFileSync(input, 'utf8')
if (original.includes('quiz_registration_source_denied')) {
  // 已有规则只追加完整 IP，保留原名单和其余站点配置；未知格式停止处理。
  const pattern = /^geo \$quiz_registration_source_denied \{\r?\n([^}]+)^\}/gm
  const blocks = [...original.matchAll(pattern)]
  if (blocks.length !== 1) throw new Error('Expected exactly one registration source geo block')
  const lines = blocks[0][1].split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (lines.filter(line => line === 'default 0;').length !== 1) throw new Error('Unexpected default registration policy')
  const existingIps = lines.filter(line => line !== 'default 0;').map(line => {
    const match = /^(\S+)\s+1;$/.exec(line)
    if (!match || !isIP(match[1])) throw new Error('Unexpected registration source entry')
    return match[1]
  })
  const sources = [...new Set([...existingIps, ...ips])]
  const replacement = `geo $quiz_registration_source_denied {\n    default 0;\n${sources.map(ip => `    ${ip} 1;`).join('\n')}\n}`
  writeFileSync(output, original.replace(pattern, () => replacement), { mode: 0o600 })
  console.log(JSON.stringify({ candidate: 'prepared', blockedSources: sources.length, addedSources: sources.length - existingIps.length }))
  process.exit(0)
}
let locations = 0
const site = original.replace(/(location \/api\/ \{)/g, match => {
  locations++
  return `${match}
        default_type application/json;
        if ($quiz_registration_request_denied) {
            return 403 '{"success":false,"code":"AUTH_REGISTRATION_RESTRICTED","errMsg":"当前网络暂时无法注册，请联系客服申请复核。","data":null}';
        }`
})
if (locations !== 2) throw new Error('Expected the existing HTTP and HTTPS API locations')
const rules = `# Registration-source protection; use socket addresses, never client-supplied forwarding headers.
geo $quiz_registration_source_denied {
    default 0;
${[...new Set(ips)].map(ip => `    ${ip} 1;`).join('\n')}
}
map "$quiz_registration_source_denied:$uri" $quiz_registration_request_denied {
    default 0;
    ~*^1:/api/auth/(register|email-code)/?$ 1;
}

`
writeFileSync(output, rules + site, { mode: 0o600 })
console.log(JSON.stringify({ candidate: 'prepared', blockedSources: new Set(ips).size, apiLocations: locations }))
