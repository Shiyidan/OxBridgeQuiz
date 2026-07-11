// DeepSeek 结构化调用封装。用于诊断报告的受约束文案生成。
import { config } from '../config.js'

interface DeepSeekResponse {
  choices?: Array<{
    finish_reason?: string
    message?: { content?: string | null }
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface DeepSeekJsonResult<T> {
  data: T
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

const REQUEST_TIMEOUT_MS = 15_000
const MAX_ATTEMPTS = 2

// JSON mode 仍需在提示词中明确要求 JSON，避免模型输出空白或非结构化内容。
export async function requestDeepSeekJson<T>(
  systemPrompt: string,
  userPayload: unknown,
  options: { maxTokens?: number } = {},
): Promise<DeepSeekJsonResult<T>> {
  if (!config.deepseekApiKey) {
    throw new Error('DEEPSEEK_API_KEY is missing')
  }

  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(`${config.deepseekBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: config.deepseekModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(userPayload) },
          ],
          response_format: { type: 'json_object' },
          thinking: { type: 'disabled' },
          temperature: 0.2,
          max_tokens: options.maxTokens ?? 240,
          stream: false,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek request failed (${response.status}): ${errorText.slice(0, 240)}`)
      }

      const result = await response.json() as DeepSeekResponse
      const content = result.choices?.[0]?.message?.content?.trim()
      if (!content) throw new Error('DeepSeek returned empty JSON content')

      return {
        data: JSON.parse(content) as T,
        model: config.deepseekModel,
        usage: {
          promptTokens: result.usage?.prompt_tokens ?? 0,
          completionTokens: result.usage?.completion_tokens ?? 0,
          totalTokens: result.usage?.total_tokens ?? 0,
        },
      }
    } catch (error) {
      lastError = error
      if (attempt === MAX_ATTEMPTS) break
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('DeepSeek request failed')
}
