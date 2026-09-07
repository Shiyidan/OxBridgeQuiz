// 模考试卷库与学生模考中心直接展示 API 提供的完整业务编号。

// 完整编号已包含考试、学科和版本，前端仅处理缺失值，不再重新拼号。
export function formatMockPaperSequenceNo(sequenceNo: string | null | undefined): string {
  return sequenceNo || '—'
}

// 仅在单项没有保存标题时提取序号生成简短默认标题，编号本身仍完整展示。
export function mockPaperTitleOrdinal(sequenceNo: string | null | undefined): string | null {
  return sequenceNo?.match(/-(\d+)-V\d+$/i)?.[1] || null
}
