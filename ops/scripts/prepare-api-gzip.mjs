// 在已有站点配置的 API 代理块中加入 JSON 压缩，保留 HTTPS、来源限制及其他线上配置；仅生成候选文件。
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const [source, destination] = process.argv.slice(2)
assert.ok(
  source && destination,
  'Usage: node prepare-api-gzip.mjs <existing-config> <candidate-config>',
)
assert.notEqual(
  path.resolve(source),
  path.resolve(destination),
  'Never overwrite the active configuration',
)
const input = (await readFile(source, 'utf8')).replace(/\r\n/g, '\n')
const marker = '# Quiz API JSON compression.'
const directives = [
  marker,
  'gzip on;',
  'gzip_types application/json;',
  'gzip_min_length 1024;',
  'gzip_comp_level 5;',
  'gzip_vary on;',
  'gzip_proxied any;',
]
let blocks = 0
const result = input.replace(
  /^(\s*)location \/api\/ \{\n/gm,
  (match, indentation, offset) => {
    blocks++
    const indent = indentation.replace(/\n/g, '') + '    '
    const block = directives.map((line) => indent + line).join('\n') + '\n'
    const afterOpening = input.slice(offset + match.length)
    if (afterOpening.startsWith(block)) return match
    assert.ok(
      !input.includes(marker),
      'Existing managed compression block differs; review it before updating',
    )
    return match + block
  },
)
assert.ok(
  blocks > 0,
  'No expected API proxy block found; do not change an unknown configuration',
)
await writeFile(destination, result, { encoding: 'utf8', mode: 0o600 })
console.log(`api_gzip_candidate=ready blocks=${blocks}`)
