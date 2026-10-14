// 统一题目写入边界的 JSON 数组校验。

// 写入边界不接受字符串化 JSON；缺失的可选列表使用空数组，显式坏值直接拒绝。
export function questionJsonArray(value: unknown, field: string): any[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error(`${field} 必须是数组`)
  return value
}

