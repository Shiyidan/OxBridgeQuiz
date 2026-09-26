// Generate a narrow registration-source block while preserving the active Nginx site.
import { readFileSync, writeFileSync } from 'node:fs'
import { isIP } from 'node:net'

const [input, output, ...ips] = process.argv.slice(2)
if (!input || !output || !ips.length || ips.some(ip => !isIP(ip))) {
  throw new Error('Usage: node prepare-registration-ip-block.mjs <active-config> <candidate> <ip> [ip...]')
}
const original = readFileSync(input, 'utf8')
if (original.includes('quiz_registration_source_denied')) throw new Error('An existing registration block must be reviewed before replacement')
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
