// 银联商务开放平台认证工具：按 OPEN-BODY-SIG 规范生成请求签名和认证头。
import crypto from 'crypto'

export interface ChinaumsSignatureInput {
  appId: string
  appKey: string
  body: string
  timestamp: string
  nonce: string
}

// 请求体先计算 SHA-256 小写十六进制，再与认证参数拼接后执行 HMAC-SHA256。
export function createChinaumsBodySignature(input: ChinaumsSignatureInput): string {
  const bodyDigest = crypto.createHash('sha256').update(input.body, 'utf8').digest('hex')
  const signingText = `${input.appId}${input.timestamp}${input.nonce}${bodyDigest}`
  return crypto
    .createHmac('sha256', Buffer.from(input.appKey, 'utf8'))
    .update(signingText, 'utf8')
    .digest('base64')
}

// 认证头字段顺序与官方示例保持一致，方便联调时直接比对。
export function createChinaumsAuthorizationHeader(input: ChinaumsSignatureInput): string {
  const signature = createChinaumsBodySignature(input)
  return `OPEN-BODY-SIG AppId="${input.appId}",Timestamp="${input.timestamp}",Nonce="${input.nonce}",Signature="${signature}"`
}
