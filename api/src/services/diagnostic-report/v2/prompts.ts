// 诊断报告提示词加载器：从版本目录读取可审计模板，并按考试上下文替换有限占位符。
import { readFileSync } from 'node:fs'

export type DiagnosticPromptName =
  | 'module-positioning'
  | 'module-analysis'
  | 'roi-narrative'
  | 'learning-path'
  | 'starter-plan'

interface DiagnosticPromptContext {
  examType: 'ESAT' | 'TMUA'
  moduleNoun: '科目' | '分卷'
}

const DIAGNOSTIC_PROMPT_VERSION = 'v2'
const promptCache = new Map<string, string>()

// 提示词缺失属于发布产物错误，必须显式失败，不能静默退回另一版本。
function readPromptFile(fileName: string): string {
  const cacheKey = `${DIAGNOSTIC_PROMPT_VERSION}/${fileName}`
  const cached = promptCache.get(cacheKey)
  if (cached) return cached
  const promptUrl = new URL(
    `../../../../prompts/diagnostic-report/${DIAGNOSTIC_PROMPT_VERSION}/${fileName}.txt`,
    import.meta.url,
  )
  const content = readFileSync(promptUrl, 'utf8').trim()
  if (!content) throw new Error(`Diagnostic report prompt is empty: ${cacheKey}`)
  promptCache.set(cacheKey, content)
  return content
}

// 仅替换经过白名单定义的考试上下文，不允许把用户输入拼接进 system prompt。
function renderPrompt(template: string, context: DiagnosticPromptContext): string {
  return template
    .replaceAll('{{examType}}', context.examType)
    .replaceAll('{{moduleNoun}}', context.moduleNoun)
}

// 所有任务提示词共享同一证据边界，再附加各模块的输出契约。
export function diagnosticReportPrompt(
  name: DiagnosticPromptName,
  context: DiagnosticPromptContext,
): string {
  const common = renderPrompt(readPromptFile('common'), context)
  const task = renderPrompt(readPromptFile(name), context)
  return `${common}\n\n${task}`
}
