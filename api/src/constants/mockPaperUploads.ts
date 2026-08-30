// 模考 Excel 上传档案状态：覆盖解析处理中、成功入库和识别失败三类结果。
export const MOCK_PAPER_UPLOAD_STATUS = {
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const
