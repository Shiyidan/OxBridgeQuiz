// 校验内置头像选择规则与三张 SVG 静态资源契约，不访问或修改数据库。
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import {
  BUILT_IN_USER_AVATARS,
  isBlankUserAvatar,
  pickRandomUserAvatar,
  pickStableUserAvatar,
} from '../src/services/userAvatar.js'

// SVG 必须保持可直接部署的固定画布、有限色彩，并且不引用外部内容。
async function assertAvatarSvg(avatarPath: string): Promise<void> {
  const filePath = fileURLToPath(
    new URL(`../../quiz-web/public${avatarPath}`, import.meta.url),
  )
  const svg = await readFile(filePath, 'utf8')

  assert.match(svg, /<svg\b/i, `${avatarPath} 缺少 svg 根元素`)
  assert.match(
    svg,
    /\bviewBox\s*=\s*["']0 0 256 256["']/i,
    `${avatarPath} 的 viewBox 必须为 0 0 256 256`,
  )
  const colors = new Set(svg.match(/#[0-9a-f]{6}\b/gi)?.map((color) => color.toUpperCase()) || [])
  assert.ok(colors.size >= 1 && colors.size <= 5, `${avatarPath} 必须使用 1 至 5 种十六进制颜色`)
  assert.doesNotMatch(
    svg,
    /<(?:text|linearGradient|radialGradient|filter|image)\b/i,
    `${avatarPath} 不得包含文字、渐变、滤镜或外部图片`,
  )
  for (const match of svg.matchAll(/\b(?:href|xlink:href)\s*=\s*["']([^"']+)["']/gi)) {
    assert.match(match[1] || '', /^#/, `${avatarPath} 不得引用外部资源`)
  }
}

// 纯函数回归覆盖路径白名单、随机选择、稳定映射、空值识别和实际 SVG 文件。
async function main(): Promise<void> {
  assert.equal(BUILT_IN_USER_AVATARS.length, 3)
  assert.equal(new Set(BUILT_IN_USER_AVATARS).size, 3)
  assert.deepEqual(BUILT_IN_USER_AVATARS, [
    '/avatars/avatar-01.svg',
    '/avatars/avatar-02.svg',
    '/avatars/avatar-03.svg',
  ])

  const allowedAvatars = new Set<string>(BUILT_IN_USER_AVATARS)
  for (let index = 0; index < 500; index += 1) {
    assert.ok(allowedAvatars.has(pickRandomUserAvatar()))
  }

  assert.equal(pickStableUserAvatar('stable-user'), pickStableUserAvatar('stable-user'))
  assert.equal(pickStableUserAvatar(' stable-user '), pickStableUserAvatar('stable-user'))
  const stableResults = new Set(
    Array.from({ length: 1000 }, (_, index) => pickStableUserAvatar(`user-${index}`)),
  )
  assert.deepEqual([...stableResults].sort(), [...BUILT_IN_USER_AVATARS].sort())

  for (const blankValue of [null, undefined, '', ' ', '\t\r\n']) {
    assert.equal(isBlankUserAvatar(blankValue), true)
  }
  for (const assignedValue of ['/avatars/avatar-01.svg', ' custom-avatar ']) {
    assert.equal(isBlankUserAvatar(assignedValue), false)
  }

  await Promise.all(BUILT_IN_USER_AVATARS.map(assertAvatarSvg))
  console.log('Built-in user avatar service and SVG contract tests passed.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
