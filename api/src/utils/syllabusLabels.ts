// 考纲双语标签工具：统一校验、展示和旧版 `English (中文)` 数据迁移规则。

export interface BilingualSyllabusLabel {
  enLabel: string
  cnLabel: string
}

export const BILINGUAL_SYLLABUS_NAME_SUFFIX = '（双语版）'

type SyllabusDocumentNode = Record<string, unknown> & {
  code?: unknown
  label?: unknown
  name?: unknown
  title?: unknown
  en_label?: unknown
  cn_label?: unknown
  children?: unknown
}

// 当前页面仍需双语并列展示时，从分离字段生成展示文案；同名标签只显示一次。
export function formatSyllabusLabel(label: BilingualSyllabusLabel): string {
  const enLabel = label.enLabel.trim()
  const cnLabel = label.cnLabel.trim()
  if (enLabel === cnLabel) return enLabel
  return `${enLabel} (${cnLabel})`
}

// 新格式另建可识别版本，避免迁移时覆盖线上正式考纲的版本身份。
export function buildBilingualSyllabusName(name: string): string {
  const normalizedName = name.trim()
  if (normalizedName.endsWith(BILINGUAL_SYLLABUS_NAME_SUFFIX)) return normalizedName
  return `${normalizedName.slice(0, 255 - BILINGUAL_SYLLABUS_NAME_SUFFIX.length)}${BILINGUAL_SYLLABUS_NAME_SUFFIX}`
}

// 历史标签按最后一组中英文括号拆分，避免英文名称内部括号被提前截断。
export function splitLegacySyllabusLabel(value: unknown): BilingualSyllabusLabel {
  const legacyLabel = typeof value === 'string' ? value.trim() : ''
  if (!legacyLabel) throw new Error('旧版考纲节点缺少 label')
  const match = legacyLabel.match(/^(.*?)\s*[（(]([^()（）]+)[)）]\s*$/u)
  const enLabel = match?.[1]?.trim() || legacyLabel
  const cnLabel = match?.[2]?.trim() || legacyLabel
  return { enLabel, cnLabel }
}

// 正式考纲节点只接受独立的英文和中文名称，不再用单个 label 混合两种语言。
export function readSyllabusLabels(node: SyllabusDocumentNode): BilingualSyllabusLabel {
  const enLabel = typeof node.en_label === 'string' ? node.en_label.trim() : ''
  const cnLabel = typeof node.cn_label === 'string' ? node.cn_label.trim() : ''
  if (!enLabel || !cnLabel) throw new Error('考纲节点必须包含 en_label 和 cn_label')
  return { enLabel, cnLabel }
}

// 数据迁移保留原树形容器和扩展字段，仅把节点名称改写为双语标准字段。
export function migrateSyllabusDocumentLabels(input: unknown): unknown {
  // 每个节点删除旧名称别名并递归保留 children，保证重复执行不会再次改变结果。
  const migrateNode = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('考纲节点必须是对象')
    }
    const node = value as SyllabusDocumentNode
    const existingEnLabel = typeof node.en_label === 'string' ? node.en_label.trim() : ''
    const existingCnLabel = typeof node.cn_label === 'string' ? node.cn_label.trim() : ''
    const labels = existingEnLabel && existingCnLabel
      ? { enLabel: existingEnLabel, cnLabel: existingCnLabel }
      : splitLegacySyllabusLabel(node.label ?? node.name ?? node.title)
    const { label: _label, name: _name, title: _title, children, ...rest } = node
    return {
      ...rest,
      en_label: labels.enLabel,
      cn_label: labels.cnLabel,
      ...(children === undefined
        ? {}
        : {
            children: Array.isArray(children)
              ? children.map(migrateNode)
              : (() => { throw new Error('考纲节点 children 必须是数组') })(),
          }),
    }
  }

  if (Array.isArray(input)) return input.map(migrateNode)
  if (!input || typeof input !== 'object') throw new Error('考纲内容必须是树形 JSON')
  const container = input as Record<string, unknown>
  for (const key of ['nodes', 'syllabus', 'tree', 'children']) {
    if (!Array.isArray(container[key])) continue
    return { ...container, [key]: (container[key] as unknown[]).map(migrateNode) }
  }
  if ('code' in container) return migrateNode(container)
  throw new Error('考纲内容缺少节点数组')
}
