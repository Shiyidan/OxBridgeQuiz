// Normalizes Prisma JSON columns and legacy JSON strings for API presenters.
export function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }

  return value as T
}

export function parseJsonArray<T = unknown>(value: unknown): T[] {
  const parsed = parseJsonField<unknown>(value, [])
  return Array.isArray(parsed) ? parsed as T[] : []
}

export function parseJsonObject<T extends Record<string, unknown> = Record<string, unknown>>(
  value: unknown,
): T {
  const parsed = parseJsonField<unknown>(value, {})
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {} as T
  return parsed as T
}
