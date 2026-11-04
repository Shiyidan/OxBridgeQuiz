// 验证原解析白名单与讲义例题一致，防止自测专用题提前暴露答案。
import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { learningExampleAnalysisSources } from '../src/constants/learningExampleAnalysisSources.js'

const directory = resolve('../quiz-web/src/content/knowledge')
const found = new Map<string, Set<string>>()
for (const filename of await readdir(directory)) {
  if (!filename.endsWith('.ts') || filename === 'index.ts' || filename === 'types.ts') continue
  const module = await import(pathToFileURL(resolve(directory, filename)).href)
  for (const value of Object.values(module)) {
    if (!value || typeof value !== 'object' || !('sections' in value) || !Array.isArray(value.sections)) continue
    for (const section of value.sections) {
      for (const example of section.examFocus?.examples || []) {
        if (!example.source?.questionCode) continue
        const subject = example.source.subject || 'biology'
        if (!found.has(subject)) found.set(subject, new Set())
        found.get(subject)!.add(example.source.questionCode)
      }
    }
  }
}
assert.deepEqual([...found.keys()].sort(), Object.keys(learningExampleAnalysisSources).sort())
for (const [subject, codes] of found) {
  assert.deepEqual([...codes].sort(), [...learningExampleAnalysisSources[subject]!].sort(), subject)
}
console.log('例题原解析白名单与各学科讲义配置一致')
