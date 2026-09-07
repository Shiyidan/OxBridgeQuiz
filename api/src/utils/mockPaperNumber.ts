// 模考业务编号统一生成和搜索解析；系列整数用于分号，公开编号包含考试、学科和版本。
import { MOCK_PAPER_MODULE_NUMBER_CODES } from '../constants/domain.js'

export type ParsedMockPaperNumber = {
  examType: string
  moduleCode: string | null
  sequenceNo: number
  version: number
}

// 具体试卷版本使用完整编号；隐藏容器或缺少有效身份的历史记录不伪造编号。
export function buildMockPaperNumber(
  examType: string,
  sequenceNo: number | null | undefined,
  version: number | null | undefined,
  moduleCode?: string | null,
): string | null {
  const normalizedExamType = examType.trim().toUpperCase()
  const moduleNumbers = MOCK_PAPER_MODULE_NUMBER_CODES[normalizedExamType]
  if (!moduleNumbers || sequenceNo == null || version == null
    || !Number.isInteger(sequenceNo) || sequenceNo < 1 || sequenceNo > 2_147_483_647
    || !Number.isInteger(version) || version < 1 || version > 2_147_483_647) return null
  const moduleNumber = moduleCode ? moduleNumbers[moduleCode] : null
  if (moduleCode && typeof moduleNumber !== 'string') return null
  return `${normalizedExamType}-MOCK${moduleNumber ? `-${moduleNumber}` : ''}-${String(sequenceNo).padStart(3, '0')}-V${version}`
}

// 完整编号检索解析所有维度，避免将 M2 的 005 误匹配为其他学科或完整卷的 005。
export function parseMockPaperNumber(value: string): ParsedMockPaperNumber | null {
  const match = /^(ESAT|TMUA)-MOCK(?:-(M1|M2|B|C|P|P1|P2))?-(\d+)-V([1-9]\d*)$/i.exec(value.trim())
  if (!match) return null
  const examType = match[1]!.toUpperCase()
  const moduleNumber = match[2]?.toUpperCase()
  const moduleCode = moduleNumber
    ? Object.entries(MOCK_PAPER_MODULE_NUMBER_CODES[examType]!).find(([, code]) => code === moduleNumber)?.[0]
    : null
  if (moduleNumber && !moduleCode) return null
  const sequenceNo = Number(match[3])
  const version = Number(match[4])
  if (!buildMockPaperNumber(examType, sequenceNo, version, moduleCode)) return null
  return { examType, moduleCode: moduleCode ?? null, sequenceNo, version }
}

// 默认试卷标题仍使用简短序号，公开 sequenceNo 字段必须使用 buildMockPaperNumber。
export function formatMockPaperSequenceNo(value: number | null | undefined): string {
  return value == null ? '—' : `No.${String(value).padStart(3, '0')}`
}

// 搜索支持纯数字及 No. 前缀，只接受正整数以避免将标题中的片段误当编号。
export function parseMockPaperSequenceNo(value: string): number | null {
  const match = /^(?:no\.?\s*)?(\d+)$/i.exec(value.trim())
  if (!match) return null
  const result = Number(match[1])
  return Number.isSafeInteger(result) && result > 0 ? result : null
}
