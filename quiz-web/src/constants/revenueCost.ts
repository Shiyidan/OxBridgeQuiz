// 营收成本分类与成本项：供后台成本列表、联动表单和历史数据展示复用。
export const REVENUE_COST_CATEGORY = {
  TECHNICAL_INFRASTRUCTURE: 'technical_infrastructure',
  DEVELOPMENT_TOOLS: 'development_tools',
  OPERATIONS_MARKETING: 'operations_marketing',
} as const

export type RevenueCostCategory = (typeof REVENUE_COST_CATEGORY)[keyof typeof REVENUE_COST_CATEGORY]

export const REVENUE_COST_ITEM = {
  SERVER_RENTAL: 'server_rental',
  DATABASE_RENTAL: 'database_rental',
  DOMAIN_CERTIFICATE: 'domain_certificate',
  THIRD_PARTY_TECHNICAL_SERVICE: 'third_party_technical_service',
  DEEPSEEK: 'deepseek',
  CLAUDE: 'claude',
  CODEX: 'codex',
  MARKETING_PROMOTION: 'marketing_promotion',
  CONTENT_OPERATIONS: 'content_operations',
  ADMINISTRATION_FINANCE: 'administration_finance',
} as const

export type RevenueCostItem = (typeof REVENUE_COST_ITEM)[keyof typeof REVENUE_COST_ITEM]

export interface RevenueCostOption<T extends string> {
  label: string
  value: T
}

export const REVENUE_COST_CATEGORY_OPTIONS: Array<RevenueCostOption<RevenueCostCategory>> = [
  { label: '技术基础设施服务', value: REVENUE_COST_CATEGORY.TECHNICAL_INFRASTRUCTURE },
  { label: '研发工具', value: REVENUE_COST_CATEGORY.DEVELOPMENT_TOOLS },
  { label: '运营推广', value: REVENUE_COST_CATEGORY.OPERATIONS_MARKETING },
]

export const REVENUE_COST_ITEM_OPTIONS: Record<
  RevenueCostCategory,
  Array<RevenueCostOption<RevenueCostItem>>
> = {
  [REVENUE_COST_CATEGORY.TECHNICAL_INFRASTRUCTURE]: [
    { label: '服务器租赁', value: REVENUE_COST_ITEM.SERVER_RENTAL },
    { label: '数据库租赁', value: REVENUE_COST_ITEM.DATABASE_RENTAL },
    { label: '域名及证书', value: REVENUE_COST_ITEM.DOMAIN_CERTIFICATE },
    { label: '第三方技术服务', value: REVENUE_COST_ITEM.THIRD_PARTY_TECHNICAL_SERVICE },
  ],
  [REVENUE_COST_CATEGORY.DEVELOPMENT_TOOLS]: [
    { label: 'deepseek', value: REVENUE_COST_ITEM.DEEPSEEK },
    { label: 'claude', value: REVENUE_COST_ITEM.CLAUDE },
    { label: 'codex', value: REVENUE_COST_ITEM.CODEX },
  ],
  [REVENUE_COST_CATEGORY.OPERATIONS_MARKETING]: [
    { label: '市场推广', value: REVENUE_COST_ITEM.MARKETING_PROMOTION },
    { label: '内容运营', value: REVENUE_COST_ITEM.CONTENT_OPERATIONS },
    { label: '行政及财税', value: REVENUE_COST_ITEM.ADMINISTRATION_FINANCE },
  ],
}

// 未识别分类按研发工具兼容，匹配数据库历史记录的迁移默认值。
export function normalizeRevenueCostCategory(value: unknown): RevenueCostCategory {
  const matched = REVENUE_COST_CATEGORY_OPTIONS.find((option) => option.value === value)
  return matched?.value || REVENUE_COST_CATEGORY.DEVELOPMENT_TOOLS
}

// 研发工具成本项保留原有具体工具编码，仅统一大小写和首尾空格。
export function normalizeRevenueCostItem(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

// 分类编码转换为后台可读中文，未知值保留原值便于发现脏数据。
export function revenueCostCategoryLabel(value: unknown): string {
  return (
    REVENUE_COST_CATEGORY_OPTIONS.find((option) => option.value === value)?.label ||
    String(value || '-')
  )
}

// 成本项编码转换为后台展示名称，研发工具保留原有具体工具名称。
export function revenueCostItemLabel(value: unknown): string {
  const normalized = normalizeRevenueCostItem(value)
  for (const options of Object.values(REVENUE_COST_ITEM_OPTIONS)) {
    const matched = options.find((option) => option.value === normalized)
    if (matched) return matched.label
  }
  return String(value || '-')
}
