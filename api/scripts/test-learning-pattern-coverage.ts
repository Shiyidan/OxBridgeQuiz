// 检查讲义中每条历年考法都有可展示的真题，避免新增考法遗漏例题。
import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { learningPatternExamples } from '../src/constants/learningPatternExamples.js'

const directory = resolve('../quiz-web/src/content/knowledge')
let count = 0
for (const filename of await readdir(directory)) {
  if (!/^(esat|tmua).*\.ts$/.test(filename)) continue
  const lessonModule = await import(pathToFileURL(resolve(directory, filename)).href)
  for (const value of Object.values(lessonModule)) {
    if (!value || typeof value !== 'object' || !('sections' in value) || !Array.isArray(value.sections)) continue
    for (const section of value.sections) {
      const focus = section.examFocus
      for (const pattern of focus?.pastPaperPatterns || []) {
        count++
        const codes: string[] = pattern.sourceCodes || []
        const hasExistingExample = focus.examples.some((example: { source?: { questionCode: string; kind?: string } }) =>
          example.source && example.source.kind !== 'bank' && codes.includes(example.source.questionCode),
        )
        const hasLinkedExample = codes.some((code) => Object.hasOwn(learningPatternExamples, code))
        assert.ok(hasExistingExample || hasLinkedExample, `${section.code}: ${pattern.form} 缺少对应真题`)
      }
    }
  }
}
assert.ok(count > 0, '未找到需要检查的真题考法')
console.log(`已检查 ${count} 条真题考法的例题关联`)
